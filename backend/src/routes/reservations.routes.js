// ===========================================
// Routes Réservations
// ===========================================

import { Router } from 'express';
import { query, transaction } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/roles.js';
import { validateReservation, validateUUID } from '../middleware/validate.js';
import { logger, auditLog } from '../utils/logger.js';

const router = Router();

router.use(authenticate);

// GET /api/reservations
router.get('/', requirePermission('reservations', 'read'), async (req, res) => {
  try {
    const { status, room_id, from_date, to_date, limit = 100, offset = 0 } = req.query;
    
    let sql = `
      SELECT r.*, 
        c.name as client_name, c.phone as client_phone,
        rm.name as room_name, rm.type as room_type
      FROM reservations r
      LEFT JOIN clients c ON r.client_id = c.id
      LEFT JOIN rooms rm ON r.room_id = rm.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      sql += ` AND r.status = $${paramIndex++}`;
      params.push(status);
    }
    if (room_id) {
      sql += ` AND r.room_id = $${paramIndex++}`;
      params.push(room_id);
    }
    if (from_date) {
      sql += ` AND r.check_in >= $${paramIndex++}`;
      params.push(from_date);
    }
    if (to_date) {
      sql += ` AND r.check_out <= $${paramIndex++}`;
      params.push(to_date);
    }
    
    sql += ` ORDER BY r.check_in DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await query(sql, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    logger.error('Erreur liste reservations:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/reservations/:id
router.get('/:id', validateUUID, requirePermission('reservations', 'read'), async (req, res) => {
  try {
    const result = await query(`
      SELECT r.*, 
        c.name as client_name, c.phone as client_phone, c.email as client_email,
        rm.name as room_name, rm.type as room_type
      FROM reservations r
      LEFT JOIN clients c ON r.client_id = c.id
      LEFT JOIN rooms rm ON r.room_id = rm.id
      WHERE r.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    logger.error('Erreur get reservation:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/reservations
router.post('/', validateReservation, requirePermission('reservations', 'create'), async (req, res) => {
  try {
    const { client_id, room_id, check_in, check_out, price_per_night, paid_amount, notes } = req.body;
    
    // Vérifier disponibilité de la chambre
    const conflict = await query(`
      SELECT id FROM reservations
      WHERE room_id = $1 
      AND status NOT IN ('Annulée', 'Terminée')
      AND check_in < $3 AND check_out > $2
    `, [room_id, check_in, check_out]);
    
    if (conflict.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Chambre non disponible pour ces dates'
      });
    }
    
    // Calculer le total
    const nights = Math.ceil((new Date(check_out) - new Date(check_in)) / (1000 * 60 * 60 * 24));
    const total_amount = nights * price_per_night;
    
    // Déterminer le statut de paiement
    let payment_status = 'En attente';
    if (paid_amount >= total_amount) payment_status = 'Payé';
    else if (paid_amount > 0) payment_status = 'Acompte';
    
    const result = await query(`
      INSERT INTO reservations 
        (client_id, room_id, check_in, check_out, price_per_night, total_amount, paid_amount, payment_status, notes, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [client_id || null, room_id, check_in, check_out, price_per_night, 
        total_amount, paid_amount || 0, payment_status, notes || null, req.user.id]);
    
    auditLog('RESERVATION_CREATED', req.user.id, { 
      reservationId: result.rows[0].id,
      roomId: room_id,
      total: total_amount
    });
    
    res.status(201).json({
      success: true,
      message: 'Réservation créée',
      data: result.rows[0]
    });
    
  } catch (error) {
    logger.error('Erreur create reservation:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PATCH /api/reservations/:id
router.patch('/:id', validateUUID, requirePermission('reservations', 'update'), async (req, res) => {
  try {
    const allowedFields = ['client_id', 'room_id', 'check_in', 'check_out', 
                          'price_per_night', 'paid_amount', 'status', 'payment_status', 'notes'];
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    // Récupérer la réservation actuelle
    const current = await query('SELECT * FROM reservations WHERE id = $1', [req.params.id]);
    if (current.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }
    
    const reservation = current.rows[0];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex++}`);
        values.push(req.body[field]);
      }
    }
    
    // Recalculer le total si les dates ou le prix changent
    const newCheckIn = req.body.check_in || reservation.check_in;
    const newCheckOut = req.body.check_out || reservation.check_out;
    const newPrice = req.body.price_per_night || reservation.price_per_night;
    
    const nights = Math.ceil((new Date(newCheckOut) - new Date(newCheckIn)) / (1000 * 60 * 60 * 24));
    const newTotal = nights * newPrice;
    
    if (newTotal !== parseFloat(reservation.total_amount)) {
      updates.push(`total_amount = $${paramIndex++}`);
      values.push(newTotal);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucune modification fournie'
      });
    }
    
    values.push(req.params.id);
    
    const result = await query(`
      UPDATE reservations SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);
    
    auditLog('RESERVATION_UPDATED', req.user.id, { reservationId: req.params.id });
    
    res.json({
      success: true,
      message: 'Réservation modifiée',
      data: result.rows[0]
    });
    
  } catch (error) {
    logger.error('Erreur update reservation:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/reservations/:id
router.delete('/:id', validateUUID, requirePermission('reservations', 'delete'), async (req, res) => {
  try {
    // Annuler plutôt que supprimer
    const result = await query(`
      UPDATE reservations SET status = 'Annulée'
      WHERE id = $1
      RETURNING id, reservation_number
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }
    
    auditLog('RESERVATION_CANCELLED', req.user.id, { 
      reservationId: req.params.id,
      number: result.rows[0].reservation_number
    });
    
    res.json({
      success: true,
      message: 'Réservation annulée'
    });
    
  } catch (error) {
    logger.error('Erreur delete reservation:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/reservations/:id/payment - Enregistrer un paiement
router.post('/:id/payment', validateUUID, requirePermission('reservations', 'update'), async (req, res) => {
  try {
    const { amount, method } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Montant invalide'
      });
    }
    
    const current = await query('SELECT * FROM reservations WHERE id = $1', [req.params.id]);
    if (current.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }
    
    const reservation = current.rows[0];
    const newPaid = parseFloat(reservation.paid_amount) + amount;
    const total = parseFloat(reservation.total_amount);
    
    if (newPaid > total) {
      return res.status(400).json({
        success: false,
        message: `Paiement dépasse le reste à payer (${total - parseFloat(reservation.paid_amount)} Ar)`
      });
    }
    
    let payment_status = 'Acompte';
    if (newPaid >= total) payment_status = 'Payé';
    
    const result = await query(`
      UPDATE reservations 
      SET paid_amount = $1, payment_status = $2
      WHERE id = $3
      RETURNING *
    `, [newPaid, payment_status, req.params.id]);
    
    auditLog('RESERVATION_PAYMENT', req.user.id, {
      reservationId: req.params.id,
      amount,
      method,
      newTotal: newPaid
    });
    
    res.json({
      success: true,
      message: 'Paiement enregistré',
      data: result.rows[0]
    });
    
  } catch (error) {
    logger.error('Erreur payment reservation:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;
