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

// ==========================================
// ROUTES DE DIAGNOSTIC (sans dépendances DB)
// ==========================================

// Route ping ultra simple - toujours fonctionne
router.get('/ping', (req, res) => {
  res.json({ ok: true, message: 'pong' });
});

// Route debug/env - sans dépendance DB ni logger externe
router.get('/debug/env', (req, res) => {
  try {
    const maskSecret = (value) => {
      if (!value) return 'NOT SET';
      if (value.length <= 8) return '***';
      return value.substring(0, 4) + '***' + value.substring(value.length - 4);
    };
    
    const envDebug = {
      timestamp: new Date().toISOString(),
      node_env: process.env.NODE_ENV || 'NOT SET',
      port: process.env.PORT || 'NOT SET',
      
      // Database config (masqué)
      database: {
        url: process.env.DATABASE_URL ? maskSecret(process.env.DATABASE_URL) : 'NOT SET',
        ssl: process.env.DB_SSL || 'NOT SET'
      },
      
      // JWT config (masqué)
      jwt: {
        secret: process.env.JWT_SECRET ? 'SET (masked)' : 'NOT SET',
        refresh_secret: process.env.JWT_REFRESH_SECRET ? 'SET (masked)' : 'NOT SET',
        expires: process.env.JWT_EXPIRES_IN || 'NOT SET'
      },
      
      // CORS
      cors_origins: process.env.CORS_ORIGINS || 'NOT SET',
      
      // Render info
      render: {
        service_name: process.env.RENDER_SERVICE_NAME || 'NOT SET',
        is_render: !!process.env.RENDER,
        external_url: process.env.RENDER_EXTERNAL_URL || 'NOT SET'
      },
      
      // Variables définies (liste)
      defined_vars: Object.keys(process.env).filter(key => 
        key.startsWith('DATABASE') || 
        key.startsWith('DB_') ||
        key.startsWith('JWT') || 
        key.startsWith('CORS') ||
        key.startsWith('RENDER') ||
        key === 'NODE_ENV' ||
        key === 'PORT'
      ).sort()
    };
    
    console.log('DEBUG ENV requested from:', req.ip);
    
    res.json({
      success: true,
      message: 'Variables d\'environnement (valeurs masquées)',
      data: envDebug
    });
  } catch (error) {
    console.error('DEBUG ENV ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur debug/env',
      error: error.message
    });
  }
});

// Route health améliorée - avec try/catch robuste
router.get('/health', async (req, res) => {
  const startTime = Date.now();
  let dbStatus = 'unknown';
  let dbLatency = null;
  let dbError = null;
  
  try {
    // Import dynamique pour éviter les erreurs au chargement
    const { testConnection } = await import('../config/database.js');
    const dbStart = Date.now();
    const dbConnected = await testConnection();
    dbLatency = Date.now() - dbStart;
    dbStatus = dbConnected ? 'connected' : 'disconnected';
  } catch (error) {
    dbStatus = 'error';
    dbError = error.message;
    console.error('Health check - DB Error:', error.message);
  }
  
  const health = {
    success: true,
    message: 'API Le Paradisier Manager opérationnelle',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus,
      latency: dbLatency ? `${dbLatency}ms` : null,
      error: dbError
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
    },
    responseTime: `${Date.now() - startTime}ms`
  };
  
  // Status 503 si DB non connectée, mais la route répond quand même
  const statusCode = dbStatus === 'connected' ? 200 : 503;
  res.status(statusCode).json(health);
});

// ==========================================
// ROUTES MÉTIER
// ==========================================

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

export default router;
