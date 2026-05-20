// ===========================================
// Routes Restaurant (Commandes)
// ===========================================

import { Router } from 'express';
import { query } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/roles.js';
import { validateOrder, validateUUID } from '../middleware/validate.js';
import { logger, auditLog } from '../utils/logger.js';

const router = Router();

router.use(authenticate);

// GET /api/restaurant-orders
router.get('/', requirePermission('restaurant', 'read'), async (req, res) => {
  try {
    const { status, type, date, limit = 100, offset = 0 } = req.query;
    
    let sql = `
      SELECT o.*, c.name as client_name
      FROM restaurant_orders o
      LEFT JOIN clients c ON o.client_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      sql += ` AND o.status = $${paramIndex++}`;
      params.push(status);
    }
    if (type) {
      sql += ` AND o.order_type = $${paramIndex++}`;
      params.push(type);
    }
    if (date) {
      sql += ` AND DATE(o.created_at) = $${paramIndex++}`;
      params.push(date);
    }
    
    sql += ` ORDER BY o.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await query(sql, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    logger.error('Erreur liste orders:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/restaurant-orders/today - Commandes du jour
router.get('/today', requirePermission('restaurant', 'read'), async (req, res) => {
  try {
    const result = await query(`
      SELECT o.*, c.name as client_name
      FROM restaurant_orders o
      LEFT JOIN clients c ON o.client_id = c.id
      WHERE DATE(o.created_at) = CURRENT_DATE
      ORDER BY o.created_at DESC
    `);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    logger.error('Erreur orders today:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/restaurant-orders/:id
router.get('/:id', validateUUID, requirePermission('restaurant', 'read'), async (req, res) => {
  try {
    const result = await query(`
      SELECT o.*, c.name as client_name, c.phone as client_phone
      FROM restaurant_orders o
      LEFT JOIN clients c ON o.client_id = c.id
      WHERE o.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    logger.error('Erreur get order:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/restaurant-orders
router.post('/', validateOrder, requirePermission('restaurant', 'create'), async (req, res) => {
  try {
    const { 
      client_id, client_name, client_phone, 
      order_type, items, items_text, total_amount, 
      paid_amount, payment_method, notes 
    } = req.body;
    
    let payment_status = 'En attente';
    if (paid_amount >= total_amount) payment_status = 'Payé';
    
    const result = await query(`
      INSERT INTO restaurant_orders 
        (client_id, client_name, client_phone, order_type, items, items_text, 
         total_amount, paid_amount, payment_method, payment_status, notes, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      client_id || null, client_name || null, client_phone || null,
      order_type, JSON.stringify(items), items_text || null,
      total_amount, paid_amount || 0, payment_method || null,
      payment_status, notes || null, req.user.id
    ]);
    
    auditLog('ORDER_CREATED', req.user.id, { 
      orderId: result.rows[0].id,
      orderNumber: result.rows[0].order_number,
      total: total_amount
    });
    
    res.status(201).json({
      success: true,
      message: 'Commande créée',
      data: result.rows[0]
    });
    
  } catch (error) {
    logger.error('Erreur create order:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PATCH /api/restaurant-orders/:id
router.patch('/:id', validateUUID, requirePermission('restaurant', 'update'), async (req, res) => {
  try {
    const allowedFields = ['client_id', 'client_name', 'client_phone', 'order_type', 
                          'items', 'items_text', 'total_amount', 'paid_amount', 
                          'payment_method', 'payment_status', 'status', 'notes'];
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        let value = req.body[field];
        if (field === 'items') value = JSON.stringify(value);
        updates.push(`${field} = $${paramIndex++}`);
        values.push(value);
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
      UPDATE restaurant_orders SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }
    
    auditLog('ORDER_UPDATED', req.user.id, { orderId: req.params.id });
    
    res.json({
      success: true,
      message: 'Commande modifiée',
      data: result.rows[0]
    });
    
  } catch (error) {
    logger.error('Erreur update order:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PATCH /api/restaurant-orders/:id/status - Changer le statut
router.patch('/:id/status', validateUUID, requirePermission('restaurant', 'update'), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['À préparer', 'En préparation', 'Prête', 'Livrée', 'Annulée'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }
    
    const result = await query(`
      UPDATE restaurant_orders SET status = $1
      WHERE id = $2
      RETURNING *
    `, [status, req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }
    
    auditLog('ORDER_STATUS_CHANGED', req.user.id, { 
      orderId: req.params.id,
      newStatus: status
    });
    
    res.json({
      success: true,
      message: 'Statut modifié',
      data: result.rows[0]
    });
    
  } catch (error) {
    logger.error('Erreur update order status:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/restaurant-orders/:id
router.delete('/:id', validateUUID, requirePermission('restaurant', 'delete'), async (req, res) => {
  try {
    // Vérifier si livraison liée
    const delivery = await query('SELECT id FROM deliveries WHERE order_id = $1', [req.params.id]);
    
    if (delivery.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer: livraison liée'
      });
    }
    
    // Annuler plutôt que supprimer
    const result = await query(`
      UPDATE restaurant_orders SET status = 'Annulée'
      WHERE id = $1
      RETURNING id, order_number
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }
    
    auditLog('ORDER_CANCELLED', req.user.id, { 
      orderId: req.params.id,
      orderNumber: result.rows[0].order_number
    });
    
    res.json({
      success: true,
      message: 'Commande annulée'
    });
    
  } catch (error) {
    logger.error('Erreur delete order:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;
