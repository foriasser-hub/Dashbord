// ===========================================
// Routes d'Authentification
// ===========================================

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { query } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { validateLogin, validateChangePassword } from '../middleware/validate.js';
import { logger, auditLog } from '../utils/logger.js';

const router = Router();

// POST /api/auth/login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Rechercher l'utilisateur
    const result = await query(
      'SELECT id, email, password_hash, name, role, is_active FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      auditLog('LOGIN_FAILED', null, { email, reason: 'user_not_found' });
      return res.status(401).json({
        success: false,
        message: 'Identifiants incorrects'
      });
    }
    
    const user = result.rows[0];
    
    // Vérifier si le compte est actif
    if (!user.is_active) {
      auditLog('LOGIN_FAILED', user.id, { reason: 'account_disabled' });
      return res.status(403).json({
        success: false,
        message: 'Compte désactivé'
      });
    }
    
    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      auditLog('LOGIN_FAILED', user.id, { reason: 'invalid_password' });
      return res.status(401).json({
        success: false,
        message: 'Identifiants incorrects'
      });
    }
    
    // Générer les tokens
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    
    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );
    
    // Sauvegarder le refresh token hashé
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    await query(`
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
    `, [user.id, refreshHash, expiresAt]);
    
    // Mettre à jour last_login
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    
    auditLog('LOGIN_SUCCESS', user.id, { ip: req.ip });
    
    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        accessToken,
        refreshToken,
        expiresIn: config.jwt.expiresIn
      }
    });
    
  } catch (error) {
    logger.error('Erreur login:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token requis'
      });
    }
    
    // Vérifier le token
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    
    // Chercher le token en base
    const tokens = await query(`
      SELECT * FROM refresh_tokens 
      WHERE user_id = $1 AND is_revoked = false AND expires_at > NOW()
    `, [decoded.userId]);
    
    // Vérifier qu'un des tokens correspond
    let validToken = null;
    for (const token of tokens.rows) {
      const valid = await bcrypt.compare(refreshToken, token.token_hash);
      if (valid) {
        validToken = token;
        break;
      }
    }
    
    if (!validToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token invalide'
      });
    }
    
    // Récupérer l'utilisateur
    const userResult = await query(
      'SELECT id, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur invalide'
      });
    }
    
    const user = userResult.rows[0];
    
    // Générer un nouveau access token
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    
    res.json({
      success: true,
      data: {
        accessToken,
        expiresIn: config.jwt.expiresIn
      }
    });
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token expiré'
      });
    }
    logger.error('Erreur refresh:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res) => {
  try {
    // Révoquer tous les refresh tokens de l'utilisateur
    await query(`
      UPDATE refresh_tokens 
      SET is_revoked = true 
      WHERE user_id = $1
    `, [req.user.id]);
    
    auditLog('LOGOUT', req.user.id);
    
    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
    
  } catch (error) {
    logger.error('Erreur logout:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await query(`
      SELECT id, email, name, role, phone, last_login, created_at
      FROM users WHERE id = $1
    `, [req.user.id]);
    
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
    logger.error('Erreur get me:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, validateChangePassword, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Récupérer le hash actuel
    const result = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );
    
    const user = result.rows[0];
    
    // Vérifier le mot de passe actuel
    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    
    if (!validPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }
    
    // Hasher le nouveau mot de passe
    const newHash = await bcrypt.hash(newPassword, 12);
    
    // Mettre à jour
    await query(`
      UPDATE users 
      SET password_hash = $1, password_changed_at = NOW() 
      WHERE id = $2
    `, [newHash, req.user.id]);
    
    // Révoquer tous les refresh tokens
    await query(`
      UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1
    `, [req.user.id]);
    
    auditLog('PASSWORD_CHANGED', req.user.id);
    
    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });
    
  } catch (error) {
    logger.error('Erreur change password:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

export default router;
