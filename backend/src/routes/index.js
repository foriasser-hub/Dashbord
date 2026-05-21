// ===========================================
// Index des Routes API
// ===========================================

import { Router } from 'express';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import clientsRoutes from './clients.routes.js';
import roomsRoutes from './rooms.routes.js';
import reservationsRoutes from './reservations.routes.js';
import restaurantRoutes from './restaurant.routes.js';
import stockRoutes from './stock.routes.js';
import expensesRoutes from './expenses.routes.js';
import invoicesRoutes from './invoices.routes.js';
import dashboardRoutes from './dashboard.routes.js';

const router = Router();

// Routes publiques (auth)
router.use('/auth', authRoutes);

// Routes protégées
router.use('/users', usersRoutes);
router.use('/clients', clientsRoutes);
router.use('/rooms', roomsRoutes);
router.use('/reservations', reservationsRoutes);
router.use('/restaurant-orders', restaurantRoutes);
router.use('/stock', stockRoutes);
router.use('/expenses', expensesRoutes);
router.use('/invoices', invoicesRoutes);
router.use('/dashboard', dashboardRoutes);

// Route de santé avec diagnostic
router.get('/health', async (req, res) => {
  const diagnostic = {
    success: false,
    server: 'ok',
    database: 'unknown',
    databaseUrl: process.env.DATABASE_URL ? 'present' : 'missing',
    dbSsl: process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production',
    nodeEnv: process.env.NODE_ENV || 'not set',
    timestamp: new Date().toISOString()
  };

  try {
    const { query } = await import('../config/database.js');
    const result = await query('SELECT NOW() as now, current_database() as db, version() as version');
    diagnostic.success = true;
    diagnostic.database = 'connected';
    diagnostic.dbName = result.rows[0].db;
    diagnostic.dbTime = result.rows[0].now;
    diagnostic.pgVersion = result.rows[0].version.split(' ').slice(0, 2).join(' ');
    diagnostic.message = 'API Le Paradisier Manager opérationnelle';
  } catch (error) {
    diagnostic.database = 'failed';
    diagnostic.errorType = error.code || error.name || 'UNKNOWN';
    diagnostic.message = simplifyDbError(error);
    console.error('[HEALTH CHECK ERROR]', {
      code: error.code,
      message: error.message,
      host: error.address || 'unknown',
      port: error.port || 'unknown'
    });
  }

  const statusCode = diagnostic.success ? 200 : 503;
  res.status(statusCode).json(diagnostic);
});

// Route de diagnostic des variables d'environnement (sans exposer les valeurs)
router.get('/debug/env', (req, res) => {
  const vars = [
    'NODE_ENV',
    'PORT',
    'DATABASE_URL',
    'DB_SSL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'CORS_ORIGINS'
  ];

  const status = {};
  for (const v of vars) {
    const val = process.env[v];
    if (!val) {
      status[v] = 'MISSING';
    } else if (v === 'DATABASE_URL') {
      // Show only host portion for debugging
      try {
        const url = new URL(val);
        status[v] = `present (host: ${url.hostname}, port: ${url.port || '5432'})`;
      } catch {
        status[v] = 'present (invalid URL format)';
      }
    } else if (v === 'JWT_SECRET' || v === 'JWT_REFRESH_SECRET') {
      status[v] = `present (${val.length} chars)`;
    } else {
      status[v] = `present (${val})`;
    }
  }

  res.json({
    success: true,
    environment: status,
    timestamp: new Date().toISOString()
  });
});

// Helper pour simplifier les erreurs DB sans exposer de secrets
function simplifyDbError(error) {
  const code = error.code;
  const msg = error.message || '';

  if (code === 'ENOTFOUND') return 'Hôte de base de données introuvable - vérifiez DATABASE_URL';
  if (code === 'ECONNREFUSED') return 'Connexion refusée par le serveur PostgreSQL';
  if (code === 'ETIMEDOUT' || code === 'ECONNRESET') return 'Timeout de connexion - vérifiez le réseau ou le firewall';
  if (code === '28P01') return 'Mot de passe incorrect dans DATABASE_URL';
  if (code === '3D000') return 'Base de données inexistante';
  if (code === '28000') return 'Authentification échouée - vérifiez les identifiants';
  if (code === 'SELF_SIGNED_CERT_IN_CHAIN' || msg.includes('SSL')) return 'Erreur SSL - vérifiez DB_SSL=true';
  if (msg.includes('timeout')) return 'Connexion timeout - le serveur ne répond pas';
  if (msg.includes('SASL')) return 'Erreur SASL auth - mot de passe probablement incorrect';
  if (msg.includes('no pg_hba.conf')) return 'Accès refusé par pg_hba.conf - IP non autorisée';

  return `Erreur DB: ${code || 'inconnue'} - ${msg.substring(0, 100)}`;
}

export default router;
