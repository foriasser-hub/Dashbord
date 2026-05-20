// ===========================================
// Routes Factures
// ===========================================

import { Router } from 'express';
import { query } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/roles.js';
import { validateUUID } from '../middleware/validate.js';
import { logger, auditLog } from '../utils/logger.js';

const router = Router();

router.use(authenticate);

// GET /api/invoices
router.get('/', requirePermission('invoices', 'read'), async (req, res) => {
  try {
    const { status, client_id, from_date, to_date, limit = 100, offset = 0 } = req.query;
    
    let sql = `
      SELECT i.*, c.name as client_name
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      sql += ` AND i.status = $${paramIndex++}`;
      params.push(status);
    }
    if (client_id) {
      sql += ` AND i.client_id = $${paramIndex++}`;
      params.push(client_id);
    }
    if (from_date) {
      sql += ` AND DATE(i.created_at) >= $${paramIndex++}`;
      params.push(from_date);
    }
    if (to_date) {
      sql += ` AND DATE(i.created_at) <= $${paramIndex++}`;
      params.push(to_date);
    }
    
    sql += ` ORDER BY i.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await query(sql, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    logger.error('Erreur liste invoices:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/invoices/:id
router.get('/:id', validateUUID, requirePermission('invoices', 'read'), async (req, res) => {
  try {
    const result = await query(`
      SELECT i.*, c.name as client_name, c.phone as client_phone, c.email as client_email, c.address as client_address
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE i.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    logger.error('Erreur get invoice:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/invoices
router.post('/', requirePermission('invoices', 'create'), async (req, res) => {
  try {
    const { client_id, service_type, items, total_amount, paid_amount, due_date, notes } = req.body;
    
    if (!total_amount || total_amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Montant total invalide'
      });
    }
    
    let status = 'En attente';
    if (paid_amount >= total_amount) status = 'Payée';
    
    const result = await query(`
      INSERT INTO invoices 
        (client_id, service_type, items, total_amount, paid_amount, status, due_date, notes, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [client_id || null, service_type || null, items ? JSON.stringify(items) : null,
        total_amount, paid_amount || 0, status, due_date || null, notes || null, req.user.id]);
    
    auditLog('INVOICE_CREATED', req.user.id, { 
      invoiceId: result.rows[0].id,
      invoiceNumber: result.rows[0].invoice_number,
      total: total_amount
    });
    
    res.status(201).json({
      success: true,
      message: 'Facture créée',
      data: result.rows[0]
    });
    
  } catch (error) {
    logger.error('Erreur create invoice:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PATCH /api/invoices/:id
router.patch('/:id', validateUUID, requirePermission('invoices', 'update'), async (req, res) => {
  try {
    const allowedFields = ['client_id', 'service_type', 'items', 'total_amount', 
                          'paid_amount', 'status', 'due_date', 'notes'];
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
      UPDATE invoices SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }
    
    auditLog('INVOICE_UPDATED', req.user.id, { invoiceId: req.params.id });
    
    res.json({
      success: true,
      message: 'Facture modifiée',
      data: result.rows[0]
    });
    
  } catch (error) {
    logger.error('Erreur update invoice:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/invoices/:id/payment - Enregistrer un paiement
router.post('/:id/payment', validateUUID, requirePermission('invoices', 'update'), async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Montant invalide'
      });
    }
    
    const current = await query('SELECT * FROM invoices WHERE id = $1', [req.params.id]);
    if (current.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }
    
    const invoice = current.rows[0];
    const newPaid = parseFloat(invoice.paid_amount) + amount;
    const total = parseFloat(invoice.total_amount);
    
    if (newPaid > total) {
      return res.status(400).json({
        success: false,
        message: `Paiement dépasse le reste à payer`
      });
    }
    
    let status = invoice.status;
    if (newPaid >= total) status = 'Payée';
    
    const result = await query(`
      UPDATE invoices 
      SET paid_amount = $1, status = $2
      WHERE id = $3
      RETURNING *
    `, [newPaid, status, req.params.id]);
    
    auditLog('INVOICE_PAYMENT', req.user.id, {
      invoiceId: req.params.id,
      amount,
      newTotal: newPaid
    });
    
    res.json({
      success: true,
      message: 'Paiement enregistré',
      data: result.rows[0]
    });
    
  } catch (error) {
    logger.error('Erreur invoice payment:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/invoices/:id
router.delete('/:id', validateUUID, requirePermission('invoices', 'delete'), async (req, res) => {
  try {
    // Annuler plutôt que supprimer
    const result = await query(`
      UPDATE invoices SET status = 'Annulée'
      WHERE id = $1
      RETURNING id, invoice_number
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }
    
    auditLog('INVOICE_CANCELLED', req.user.id, { 
      invoiceId: req.params.id,
      invoiceNumber: result.rows[0].invoice_number
    });
    
    res.json({
      success: true,
      message: 'Facture annulée'
    });
    
  } catch (error) {
    logger.error('Erreur delete invoice:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;
