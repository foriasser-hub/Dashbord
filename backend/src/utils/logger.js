// ===========================================
// Système de Logging avec Winston
// ===========================================

import winston from 'winston';
import { config } from '../config/index.js';
import fs from 'fs';
import path from 'path';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Format personnalisé pour les logs
const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  let log = `${timestamp} [${level}]: ${message}`;
  
  if (Object.keys(meta).length > 0) {
    log += ` ${JSON.stringify(meta)}`;
  }
  
  if (stack) {
    log += `\n${stack}`;
  }
  
  return log;
});

// Configuration des transports
const transports = [];

// En production sur Render, utiliser uniquement la console
// Les fichiers de logs ne sont pas persistants sur Render
if (config.env === 'production') {
  transports.push(new winston.transports.Console({
    format: combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      logFormat
    )
  }));
} else {
  // En développement, essayer de créer le dossier logs
  try {
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    transports.push(
      new winston.transports.File({ 
        filename: 'logs/error.log', 
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),
      new winston.transports.File({ 
        filename: 'logs/combined.log',
        maxsize: 5242880,
        maxFiles: 5
      })
    );
  } catch (err) {
    console.warn('Unable to create logs directory, using console only:', err.message);
  }
  
  // Console colorée en dev
  transports.push(new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'HH:mm:ss' }),
      logFormat
    )
  }));
}

// Création du logger
export const logger = winston.createLogger({
  level: config.logLevel,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  defaultMeta: { service: 'paradisier-api' },
  transports
});

// Logger pour les requêtes HTTP
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')?.substring(0, 50)
    };
    
    if (req.user) {
      logData.userId = req.user.id;
    }
    
    if (res.statusCode >= 400) {
      logger.warn('Requête échouée', logData);
    } else {
      logger.info('Requête traitée', logData);
    }
  });
  
  next();
};

// Logger d'audit pour les actions sensibles
export const auditLog = (action, userId, details = {}) => {
  logger.info('AUDIT', {
    action,
    userId,
    timestamp: new Date().toISOString(),
    ...details
  });
};

export default logger;
