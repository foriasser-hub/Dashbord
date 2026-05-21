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
import { testConnection } from '../config/database.js';
import { logger } from '../utils/logger.js';

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

// Route de santé améliorée avec vérification DB
router.get('/health', async (req, res) => {
  const startTime = Date.now();
  let dbStatus = 'unknown';
  let dbLatency = null;
  
  try {
    const dbStart = Date.now();
    const dbConnected = await testConnection();
    dbLatency = Date.now() - dbStart;
    dbStatus = dbConnected ? 'connected' : 'disconnected';
  } catch (error) {
    dbStatus = 'error';
    logger.error('Health check - Erreur DB:', { 
      message: error.message,
      code: error.code 
    });
  }
  
  const health = {
    success: true,
    message: 'API Le Paradisier Manager opérationnelle',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus,
      latency: dbLatency ? `${dbLatency}ms` : null
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
    },
    responseTime: `${Date.now() - startTime}ms`
  };
  
  // Status 503 si DB non connectée
  const statusCode = dbStatus === 'connected' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Route de debug des variables d'environnement (sans exposer les secrets)
router.get('/debug/env', (req, res) => {
  const maskSecret = (value) => {
    if (!value) return 'NOT SET';
    if (value.length <= 8) return '***';
    return value.substring(0, 4) + '***' + value.substring(value.length - 4);
  };
  
  const envDebug = {
    timestamp: new Date().toISOString(),
    node_env: process.env.NODE_ENV || 'NOT SET',
    port: process.env.PORT || 'NOT SET',
    
    // Supabase config (masqué)
    supabase: {
      url: process.env.SUPABASE_URL ? maskSecret(process.env.SUPABASE_URL) : 'NOT SET',
      anon_key: process.env.SUPABASE_ANON_KEY ? 'SET (masked)' : 'NOT SET',
      service_key: process.env.SUPABASE_SERVICE_KEY ? 'SET (masked)' : 'NOT SET'
    },
    
    // JWT config (masqué)
    jwt: {
      secret: process.env.JWT_SECRET ? 'SET (masked)' : 'NOT SET',
      expires: process.env.JWT_EXPIRES_IN || 'NOT SET'
    },
    
    // CORS
    cors_origins: process.env.CORS_ORIGINS || 'NOT SET',
    
    // Render info
    render: {
      service_name: process.env.RENDER_SERVICE_NAME || 'NOT SET',
      is_render: !!process.env.RENDER
    },
    
    // Variables définies
    defined_vars: Object.keys(process.env).filter(key => 
      key.startsWith('SUPABASE') || 
      key.startsWith('JWT') || 
      key.startsWith('CORS') ||
      key.startsWith('RENDER') ||
      key === 'NODE_ENV' ||
      key === 'PORT'
    ).sort()
  };
  
  logger.info('Debug env requested', { 
    ip: req.ip, 
    userAgent: req.get('User-Agent')?.substring(0, 50)
  });
  
  res.json({
    success: true,
    message: 'Variables d\'environnement (valeurs masquées)',
    data: envDebug
  });
});

export default router;
