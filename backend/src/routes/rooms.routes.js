// ===========================================
// Routes Chambres et Appartements
// ===========================================

import { Router } from 'express';
import { query } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/roles.js';
import { validateRoom, validateUUID } from '../middleware/validate.js';
import { logger, auditLog } from '../utils/logger.js';

const router = Router();

router.use(authenticate);

// GET /api/rooms
router.get('/', requirePermission('rooms', 'read'), async (req, res) => {
  try {
    const { status, type } = req.query;
    
    let sql = 'SELECT * FROM rooms WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      sql += ` AND status = $${paramIndex++}`;
      params.push(status);
    }
    if (type) {
      sql += ` AND type = $${paramIndex++}`;
      params.push(type);
    }
    
    sql += ' ORDER BY name';
    
    const result = await query(sql, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    logger.error('Erreur liste rooms:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/rooms/available - Chambres disponibles pour une période
router.get('/available', requirePermission('rooms', 'read'), async (req, res) => {
  try {
    const { check_in, check_out, type } = req.query;
    
    if (!check_in || !check_out) {
      return res.status(400).json({
        success: false,
        message: 'Dates de séjour requises'
      });
    }
    
    let sql = `
      SELECT r.* FROM rooms r
      WHERE r.status IN ('Disponible', 'Nettoyage')
      AND r.id NOT IN (
        SELECT room_id FROM reservations
        WHERE status NOT IN ('Annulée', 'Terminée')
        AND check_in < $2 AND check_out > $1
      )
    `;
    const params = [check_in, check_out];
    
    if (type) {
      sql += ' AND r.type = $3';
      params.push(type);
    }
    
    sql += ' ORDER BY r.type, r.name';
    
    const result = await query(sql, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    logger.error('Erreur rooms available:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/rooms/:id
router.get('/:id', validateUUID, requirePermission('rooms', 'read'), async (req, res) => {
  try {
    const result = await query(`
      SELECT r.*,
        (SELECT json_agg(res.* ORDER BY res.check_in DESC) 
         FROM reservations res 
         WHERE res.room_id = r.id AND res.status != 'Annulée'
         LIMIT 5) as recent_reservations
      FROM rooms r
      WHERE r.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Chambre non trouvée'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    logger.error('Erreur get room:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/rooms
router.post('/', validateRoom, requirePermission('rooms', 'create'), async (req, res) => {
  try {
    const { name, type, capacity, price_per_night, status, floor, description, equipment } = req.body;
    
    // Vérifier unicité du nom
    const existing = await query('SELECT id FROM rooms WHERE name = $1', [name]);
    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Une chambre avec ce nom existe déjà'
      });
    }
    
    const result = await query(`
      INSERT INTO rooms (name, type, capacity, price_per_night, status, floor, description, equipment)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [name, type, capacity || 2, price_per_night, status || 'Disponible', 
        floor || null, description || null, equipment || null]);
    
    auditLog('ROOM_CREATED', req.user.id, { roomId: result.rows[0].id, name });
    
    res.status(201).json({
      success: true,
      message: 'Chambre créée',
      data: result.rows[0]
    });
    
  } catch (error) {
    logger.error('Erreur create room:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PATCH /api/rooms/:id
router.patch('/:id', validateUUID, requirePermission('rooms', 'update'), async (req, res) => {
  try {
    const allowedFields = ['name', 'type', 'capacity', 'price_per_night', 'status', 'floor', 'description', 'equipment'];
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex++}`);
        values.push(req.body[field]);
      }
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucune modification fournie'
      });
    }
    
    values.push(req.params.id);
    
    const result = await query(`
      UPDATE rooms SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Chambre non trouvée'
      });
    }
    
    auditLog('ROOM_UPDATED', req.user.id, { roomId: req.params.id });
    
    res.json({
      success: true,
      message: 'Chambre modifiée',
      data: result.rows[0]
    });
    
  } catch (error) {
    logger.error('Erreur update room:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/rooms/:id
router.delete('/:id', validateUUID, requirePermission('rooms', 'delete'), async (req, res) => {
  try {
    // Vérifier les réservations actives
    const active = await query(`
      SELECT COUNT(*) FROM reservations 
      WHERE room_id = $1 AND status IN ('Confirmée', 'En cours', 'En attente')
    `, [req.params.id]);
    
    if (parseInt(active.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer: réservations actives'
      });
    }
    
    const result = await query('DELETE FROM rooms WHERE id = $1 RETURNING id, name', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Chambre non trouvée'
      });
    }
    
    auditLog('ROOM_DELETED', req.user.id, { roomId: req.params.id, name: result.rows[0].name });
    
    res.json({
      success: true,
      message: 'Chambre supprimée'
    });
    
  } catch (error) {
    logger.error('Erreur delete room:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;
