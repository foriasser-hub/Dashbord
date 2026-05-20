// ===========================================
// LE PARADISIER MANAGER - Serveur Principal
// ===========================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config, validateConfig } from './config/index.js';
import { testConnection } from './config/database.js';
import { logger, requestLogger } from './utils/logger.js';
import routes from './routes/index.js';

// Validation de la configuration
try {
  validateConfig();
} catch (error) {
  logger.error('Configuration invalide:', error.message);
  process.exit(1);
}

const app = express();

// ===== MIDDLEWARES DE SÉCURITÉ =====

// Helmet pour les headers de sécurité
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS
app.use(cors({
  origin: (origin, callback) => {
    // Permettre les requêtes sans origin (Postman, etc.) en dev
    if (!origin && config.env === 'development') {
      return callback(null, true);
    }
    
    if (config.cors.origins.includes(origin) || config.cors.origins.includes('*')) {
      callback(null, true);
    } else {
      logger.warn('Requête CORS bloquée:', { origin });
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting général
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Trop de requêtes, veuillez réessayer plus tard'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting pour la connexion
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.rateLimit.loginMax,
  message: {
    success: false,
    message: 'Trop de tentatives de connexion, réessayez dans 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', loginLimiter);

// ===== MIDDLEWARES DE PARSING =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logger des requêtes
app.use(requestLogger);

// ===== ROUTES =====
app.use('/api', routes);

// Route racine
app.get('/', (req, res) => {
  res.json({
    name: config.app.name,
    version: '1.0.0',
    status: 'online',
    api: '/api',
    documentation: '/api/health'
  });
});

// ===== GESTION DES ERREURS =====

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// Erreurs globales
app.use((err, req, res, next) => {
  logger.error('Erreur non gérée:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  // Ne pas exposer les détails en production
  const message = config.env === 'production' 
    ? 'Erreur serveur interne' 
    : err.message;
  
  res.status(err.status || 500).json({
    success: false,
    message,
    ...(config.env === 'development' && { stack: err.stack })
  });
});

// ===== DÉMARRAGE DU SERVEUR =====
const startServer = async () => {
  try {
    // Test de connexion à la base de données
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      logger.warn('Base de données non connectée - fonctionnement limité');
    }
    
    app.listen(config.port, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════╗
║           LE PARADISIER MANAGER - Backend API             ║
╠═══════════════════════════════════════════════════════════╣
║  Serveur démarré sur le port ${config.port}                        ║
║  Environnement: ${config.env.padEnd(40)}║
║  Base de données: ${dbConnected ? 'Connectée ✓' : 'Non connectée ✗'}                      ║
║                                                           ║
║  API: http://localhost:${config.port}/api                          ║
║  Santé: http://localhost:${config.port}/api/health                 ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
    
  } catch (error) {
    logger.error('Erreur au démarrage:', error);
    process.exit(1);
  }
};

// Gestion de l'arrêt propre
process.on('SIGTERM', () => {
  logger.info('Signal SIGTERM reçu, arrêt en cours...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Signal SIGINT reçu, arrêt en cours...');
  process.exit(0);
});

startServer();

export default app;
