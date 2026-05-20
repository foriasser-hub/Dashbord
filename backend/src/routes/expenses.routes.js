// ===========================================
// Routes Dépenses
// ===========================================

import { Router } from 'express';
import { query } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/roles.js';
import { validateExpense, validateUUID } from '../middleware/validate.js';
import { logger, auditLog } from '../utils/logger.js';

const router = Router();

router.use(authenticate);

// GET /api/expenses
router.get('/', requirePermission('expenses', 'read'), async (req, res) => {
  try {
    const { category, from_date, to_date, limit = 100, offset = 0 } = req.query;
    
    let sql = `
      SELECT e.*, u.name as created_by_name
      FROM expenses e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (category) {
      sql += ` AND e.category = $${paramIndex++}`;
      params.push(category);
    }
    if (from_date) {
      sql += ` AND e.date >= $${paramIndex++}`;
      params.push(from_date);
    }
    if (to_date) {
      sql += ` AND e.date <= $${paramIndex++}`;
      params.push(to_date);
    }
    
    sql += ` ORDER BY e.date DESC, e.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await query(sql, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    logger.error('Erreur liste expenses:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/expenses/summary - Résumé par catégorie
router.get('/summary', requirePermission('expenses', 'read'), async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    
    let sql = `
      SELECT 
        category,
        COUNT(*) as count,
        SUM(amount) as total
      FROM expenses
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (from_date) {
      sql += ` AND date >= $${paramIndex++}`;
      params.push(from_date);
    }
    if (to_date) {
      sql += ` AND date <= $${paramIndex++}`;
      params.push(to_date);
    }
    
    sql += ' GROUP BY category ORDER BY total DESC';
    
    const result = await query(sql, params);
    
    const grandTotal = result.rows.reduce((sum, row) => sum + parseFloat(row.total || 0), 0);
    
    res.json({
      success: true,
      data: {
        byCategory: result.rows,
        grandTotal
      }
    });
    
  } catch (error) {
    logger.error('Erreur expenses summary:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/expenses/:id
router.get('/:id', validateUUID, requirePermission('expenses', 'read'), async (req, res) => {
  try {
    const result = await query(`
      SELECT e.*, u.name as created_by_name
      FROM expenses e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dépense non trouvée'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    logger.error('Erreur get expense:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/expenses
router.post('/', validateExpense, requirePermission('expenses', 'create'), async (req, res) => {
  try {
    const { date, category, description, supplier, amount, payment_method, reference, notes } = req.body;
    
    const result = await query(`
      INSERT INTO expenses 
        (date, category, description, supplier, amount, payment_method, reference, notes, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [date, category, description, supplier || null, amount, 
        payment_method || null, reference || null, notes || null, req.user.id]);
    
    auditLog('EXPENSE_CREATED', req.user.id, { 
      expenseId: result.rows[0].id,
      category,
      amount
    });
    
    res.status(201).json({
      success: true,
      message: 'Dépense enregistrée',
      data: result.rows[0]
    });
    
  } catch (error) {
    logger.error('Erreur create expense:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PATCH /api/expenses/:id
router.patch('/:id', validateUUID, requirePermission('expenses', 'update'), async (req, res) => {
  try {
    const allowedFields = ['date', 'category', 'description', 'supplier', 
                          'amount', 'payment_method', 'reference', 'notes'];
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
      UPDATE expenses SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dépense non trouvée'
      });
    }
    
    auditLog('EXPENSE_UPDATED', req.user.id, { expenseId: req.params.id });
    
    res.json({
      success: true,
      message: 'Dépense modifiée',
      data: result.rows[0]
    });
    
  } catch (error) {
    logger.error('Erreur update expense:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', validateUUID, requirePermission('expenses', 'delete'), async (req, res) => {
  try {
    const result = await query('DELETE FROM expenses WHERE id = $1 RETURNING id, description, amount', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dépense non trouvée'
      });
    }
    
    auditLog('EXPENSE_DELETED', req.user.id, { 
      expenseId: req.params.id,
      description: result.rows[0].description,
      amount: result.rows[0].amount
    });
    
    res.json({
      success: true,
      message: 'Dépense supprimée'
    });
    
  } catch (error) {
    logger.error('Erreur delete expense:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;
