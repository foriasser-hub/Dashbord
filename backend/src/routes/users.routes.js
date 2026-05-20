// ===========================================
// Routes Utilisateurs (Admin)
// ===========================================

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/roles.js';
import { validateCreateUser, validateUUID } from '../middleware/validate.js';
import { logger, auditLog } from '../utils/logger.js';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// GET /api/users - Liste des utilisateurs
router.get('/', requirePermission('users', 'read'), async (req, res) => {
  try {
    const result = await query(`
      SELECT id, email, name, role, phone, is_active, last_login, created_at
      FROM users
      ORDER BY created_at DESC
    `);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    logger.error('Erreur liste users:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/users/:id - Détail utilisateur
router.get('/:id', validateUUID, requirePermission('users', 'read'), async (req, res) => {
  try {
    const result = await query(`
      SELECT id, email, name, role, phone, is_active, last_login, created_at, updated_at
      FROM users WHERE id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    logger.error('Erreur get user:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/users - Créer un utilisateur
router.post('/', validateCreateUser, requirePermission('users', 'create'), async (req, res) => {
  try {
    const { email, password, name, role, phone } = req.body;
    
    // Vérifier si l'email existe déjà
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }
    
    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Créer l'utilisateur
    const result = await query(`
      INSERT INTO users (email, password_hash, name, role, phone)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, name, role, phone, is_active, created_at
    `, [email, passwordHash, name, role, phone || null]);
    
    auditLog('USER_CREATED', req.user.id, { 
      newUserId: result.rows[0].id,
      email,
      role
    });
    
    res.status(201).json({
      success: true,
      message: 'Utilisateur créé',
      data: result.rows[0]
    });
    
  } catch (error) {
    logger.error('Erreur create user:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PATCH /api/users/:id - Modifier un utilisateur
router.patch('/:id', validateUUID, requirePermission('users', 'update'), async (req, res) => {
  try {
    const { name, role, phone, is_active } = req.body;
    const userId = req.params.id;
    
    // Empêcher la modification de son propre rôle
    if (userId === req.user.id && role && role !== req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez pas modifier votre propre rôle'
      });
    }
    
    // Construire la requête dynamiquement
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (role !== undefined) {
      updates.push(`role = $${paramIndex++}`);
      values.push(role);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(phone);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucune modification fournie'
      });
    }
    
    values.push(userId);
    
    const result = await query(`
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, email, name, role, phone, is_active, updated_at
    `, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    auditLog('USER_UPDATED', req.user.id, { targetUserId: userId, changes: req.body });
    
    res.json({
      success: true,
      message: 'Utilisateur modifié',
      data: result.rows[0]
    });
    
  } catch (error) {
    logger.error('Erreur update user:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/users/:id - Supprimer un utilisateur
router.delete('/:id', validateUUID, requirePermission('users', 'delete'), async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Empêcher la suppression de soi-même
    if (userId === req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte'
      });
    }
    
    // Vérifier si c'est le dernier admin
    const adminCount = await query(
      `SELECT COUNT(*) FROM users WHERE role = 'admin' AND is_active = true AND id != $1`,
      [userId]
    );
    
    const targetUser = await query('SELECT role FROM users WHERE id = $1', [userId]);
    
    if (targetUser.rows.length > 0 && 
        targetUser.rows[0].role === 'admin' && 
        parseInt(adminCount.rows[0].count) === 0) {
      return res.status(403).json({
        success: false,
        message: 'Impossible de supprimer le dernier administrateur'
      });
    }
    
    // Désactiver plutôt que supprimer (soft delete)
    const result = await query(`
      UPDATE users SET is_active = false WHERE id = $1
      RETURNING id, email
    `, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Révoquer tous les tokens
    await query('UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1', [userId]);
    
    auditLog('USER_DELETED', req.user.id, { targetUserId: userId });
    
    res.json({
      success: true,
      message: 'Utilisateur désactivé'
    });
    
  } catch (error) {
    logger.error('Erreur delete user:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/users/:id/reset-password - Réinitialiser mot de passe (admin)
router.post('/:id/reset-password', validateUUID, requirePermission('users', 'update'), async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe invalide (min 8 caractères)'
      });
    }
    
    const passwordHash = await bcrypt.hash(newPassword, 12);
    
    const result = await query(`
      UPDATE users 
      SET password_hash = $1, password_changed_at = NOW()
      WHERE id = $2
      RETURNING id, email
    `, [passwordHash, req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Révoquer les tokens existants
    await query('UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1', [req.params.id]);
    
    auditLog('PASSWORD_RESET_BY_ADMIN', req.user.id, { targetUserId: req.params.id });
    
    res.json({
      success: true,
      message: 'Mot de passe réinitialisé'
    });
    
  } catch (error) {
    logger.error('Erreur reset password:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;
