// ===========================================
// Routes Stock
// ===========================================

import { Router } from 'express';
import { query } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/roles.js';
import { validateStockItem, validateUUID } from '../middleware/validate.js';
import { logger, auditLog } from '../utils/logger.js';

const router = Router();

router.use(authenticate);

// GET /api/stock
router.get('/', requirePermission('stock', 'read'), async (req, res) => {
  try {
    const { category, status, search } = req.query;
    
    let sql = 'SELECT * FROM stock_items WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (category) {
      sql += ` AND category = $${paramIndex++}`;
      params.push(category);
    }
    if (status) {
      sql += ` AND status = $${paramIndex++}`;
      params.push(status);
    }
    if (search) {
      sql += ` AND name ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    sql += ' ORDER BY category, name';
    
    const result = await query(sql, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    logger.error('Erreur liste stock:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/stock/alerts - Articles en alerte (faible ou critique)
router.get('/alerts', requirePermission('stock', 'read'), async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM stock_items 
      WHERE status IN ('Faible', 'Critique', 'Épuisé')
      ORDER BY 
        CASE status 
          WHEN 'Épuisé' THEN 1 
          WHEN 'Critique' THEN 2 
          ELSE 3 
        END,
        name
    `);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    logger.error('Erreur stock alerts:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/stock/value - Valeur totale du stock
router.get('/value', requirePermission('stock', 'read'), async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        category,
        SUM(quantity * purchase_price) as total_value,
        COUNT(*) as item_count
      FROM stock_items
      GROUP BY category
      ORDER BY category
    `);
    
    const total = result.rows.reduce((sum, row) => sum + parseFloat(row.total_value || 0), 0);
    
    res.json({
      success: true,
      data: {
        byCategory: result.rows,
        totalValue: total
      }
    });
    
  } catch (error) {
    logger.error('Erreur stock value:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/stock/:id
router.get('/:id', validateUUID, requirePermission('stock', 'read'), async (req, res) => {
  try {
    const result = await query('SELECT * FROM stock_items WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    logger.error('Erreur get stock item:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/stock
router.post('/', validateStockItem, requirePermission('stock', 'create'), async (req, res) => {
  try {
    const { name, category, quantity, unit, min_quantity, purchase_price, selling_price, supplier, notes } = req.body;
    
    const result = await query(`
      INSERT INTO stock_items 
        (name, category, quantity, unit, min_quantity, purchase_price, selling_price, supplier, last_entry, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE, $9)
      RETURNING *
    `, [name, category, quantity, unit || 'pièce', min_quantity || 0, 
        purchase_price || 0, selling_price || 0, supplier || null, notes || null]);
    
    auditLog('STOCK_CREATED', req.user.id, { itemId: result.rows[0].id, name });
    
    res.status(201).json({
      success: true,
      message: 'Article ajouté au stock',
      data: result.rows[0]
    });
    
  } catch (error) {
    logger.error('Erreur create stock:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PATCH /api/stock/:id
router.patch('/:id', validateUUID, requirePermission('stock', 'update'), async (req, res) => {
  try {
    const allowedFields = ['name', 'category', 'quantity', 'unit', 'min_quantity', 
                          'purchase_price', 'selling_price', 'supplier', 'notes'];
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex++}`);
        values.push(req.body[field]);
      }
    }
    
    // Si la quantité change, mettre à jour last_entry
    if (req.body.quantity !== undefined) {
      updates.push(`last_entry = CURRENT_DATE`);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucune modification fournie'
      });
    }
    
    values.push(req.params.id);
    
    const result = await query(`
      UPDATE stock_items SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }
    
    auditLog('STOCK_UPDATED', req.user.id, { itemId: req.params.id });
    
    res.json({
      success: true,
      message: 'Article modifié',
      data: result.rows[0]
    });
    
  } catch (error) {
    logger.error('Erreur update stock:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/stock/:id/adjust - Ajuster la quantité
router.post('/:id/adjust', validateUUID, requirePermission('stock', 'update'), async (req, res) => {
  try {
    const { adjustment, reason } = req.body;
    
    if (adjustment === undefined || adjustment === 0) {
      return res.status(400).json({
        success: false,
        message: 'Ajustement requis'
      });
    }
    
    // Récupérer la quantité actuelle
    const current = await query('SELECT quantity, name FROM stock_items WHERE id = $1', [req.params.id]);
    
    if (current.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }
    
    const newQuantity = parseFloat(current.rows[0].quantity) + adjustment;
    
    if (newQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantité résultante ne peut pas être négative'
      });
    }
    
    const result = await query(`
      UPDATE stock_items 
      SET quantity = $1, last_entry = CURRENT_DATE
      WHERE id = $2
      RETURNING *
    `, [newQuantity, req.params.id]);
    
    auditLog('STOCK_ADJUSTED', req.user.id, {
      itemId: req.params.id,
      itemName: current.rows[0].name,
      adjustment,
      reason,
      newQuantity
    });
    
    res.json({
      success: true,
      message: `Stock ajusté de ${adjustment > 0 ? '+' : ''}${adjustment}`,
      data: result.rows[0]
    });
    
  } catch (error) {
    logger.error('Erreur adjust stock:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/stock/:id
router.delete('/:id', validateUUID, requirePermission('stock', 'delete'), async (req, res) => {
  try {
    const result = await query('DELETE FROM stock_items WHERE id = $1 RETURNING id, name', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }
    
    auditLog('STOCK_DELETED', req.user.id, { itemId: req.params.id, name: result.rows[0].name });
    
    res.json({
      success: true,
      message: 'Article supprimé du stock'
    });
    
  } catch (error) {
    logger.error('Erreur delete stock:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;
