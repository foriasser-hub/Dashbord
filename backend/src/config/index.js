// ===========================================
// Configuration Centrale de l'Application
// ===========================================

import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Environnement
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT) || 3000,
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  
  // CORS
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:5500').split(',').map(s => s.trim())
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    loginMax: parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 5
  },
  
  // Application
  app: {
    name: process.env.APP_NAME || 'Le Paradisier Manager',
    currency: process.env.APP_CURRENCY || 'Ar',
    phone: process.env.APP_PHONE || '+261 34 00 000 00',
    address: process.env.APP_ADDRESS || 'Toamasina, Madagascar'
  },
  
  // Admin par défaut
  defaultAdmin: {
    email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@paradisier.mg',
    password: process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123!'
  },
  
  // Logs
  logLevel: process.env.LOG_LEVEL || 'info'
};

// Validation de la configuration en production
export const validateConfig = () => {
  const errors = [];
  
  if (config.env === 'production') {
    if (config.jwt.secret === 'dev-secret-change-in-production') {
      errors.push('JWT_SECRET doit être défini en production');
    }
    if (config.jwt.secret.length < 32) {
      errors.push('JWT_SECRET doit avoir au moins 32 caractères');
    }
    if (!process.env.DATABASE_URL) {
      errors.push('DATABASE_URL doit être défini');
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`Erreurs de configuration:\n${errors.join('\n')}`);
  }
  
  return true;
};

export default config;
