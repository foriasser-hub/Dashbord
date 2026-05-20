// ===========================================
// Routes Clients
// ===========================================

import { Router } from 'express';
import { query } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/roles.js';
import { validateClient, validateUUID } from '../middleware/validate.js';
import { logger, auditLog } from '../utils/logger.js';

const router = Router();

router.use(authenticate);

// GET /api/clients
router.get('/', requirePermission('clients', 'read'), async (req, res) => {
  try {
    const { status, type, search, limit = 100, offset = 0 } = req.query;
    
    let sql = `
      SELECT c.*, 
        (SELECT COUNT(*) FROM reservations WHERE client_id = c.id) as reservation_count,
        (SELECT COUNT(*) FROM restaurant_orders WHERE client_id = c.id) as order_count
      FROM clients c
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      sql += ` AND c.status = $${paramIndex++}`;
      params.push(status);
    }
    if (type) {
      sql += ` AND c.type = $${paramIndex++}`;
      params.push(type);
    }
    if (search) {
      sql += ` AND (c.name ILIKE $${paramIndex} OR c.phone ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    sql += ` ORDER BY c.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await query(sql, params);
    
    // Count total
    const countResult = await query('SELECT COUNT(*) FROM clients');
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      total: parseInt(countResult.rows[0].count)
    });
    
  } catch (error) {
    logger.error('Erreur liste clients:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/clients/:id
router.get('/:id', validateUUID, requirePermission('clients', 'read'), async (req, res) => {
  try {
    const result = await query(`
      SELECT c.*,
        (SELECT json_agg(r.*) FROM reservations r WHERE r.client_id = c.id ORDER BY r.created_at DESC LIMIT 10) as recent_reservations,
        (SELECT json_agg(o.*) FROM restaurant_orders o WHERE o.client_id = c.id ORDER BY o.created_at DESC LIMIT 10) as recent_orders
      FROM clients c
      WHERE c.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    logger.error('Erreur get client:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/clients
router.post('/', validateClient, requirePermission('clients', 'create'), async (req, res) => {
  try {
    const { name, phone, email, address, type, status, notes } = req.body;
    
    const result = await query(`
      INSERT INTO clients (name, phone, email, address, type, status, notes, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [name, phone || null, email || null, address || null, type || 'Les deux', 
        status || 'Nouveau', notes || null, req.user.id]);
    
    auditLog('CLIENT_CREATED', req.user.id, { clientId: result.rows[0].id, name });
    
    res.status(201).json({
      success: true,
      message: 'Client créé',
      data: result.rows[0]
    });
    
  } catch (error) {
    logger.error('Erreur create client:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PATCH /api/clients/:id
router.patch('/:id', validateUUID, requirePermission('clients', 'update'), async (req, res) => {
  try {
    const allowedFields = ['name', 'phone', 'email', 'address', 'type', 'status', 'notes', 'credit_remaining'];
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
      UPDATE clients SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }
    
    auditLog('CLIENT_UPDATED', req.user.id, { clientId: req.params.id });
    
    res.json({
      success: true,
      message: 'Client modifié',
      data: result.rows[0]
    });
    
  } catch (error) {
    logger.error('Erreur update client:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/clients/:id
router.delete('/:id', validateUUID, requirePermission('clients', 'delete'), async (req, res) => {
  try {
    // Vérifier s'il y a des réservations ou commandes liées
    const linked = await query(`
      SELECT 
        (SELECT COUNT(*) FROM reservations WHERE client_id = $1) as reservations,
        (SELECT COUNT(*) FROM restaurant_orders WHERE client_id = $1) as orders
    `, [req.params.id]);
    
    const { reservations, orders } = linked.rows[0];
    
    if (parseInt(reservations) > 0 || parseInt(orders) > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer: ${reservations} réservation(s) et ${orders} commande(s) liées`,
        linkedData: { reservations: parseInt(reservations), orders: parseInt(orders) }
      });
    }
    
    const result = await query('DELETE FROM clients WHERE id = $1 RETURNING id, name', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }
    
    auditLog('CLIENT_DELETED', req.user.id, { clientId: req.params.id, name: result.rows[0].name });
    
    res.json({
      success: true,
      message: 'Client supprimé'
    });
    
  } catch (error) {
    logger.error('Erreur delete client:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;
