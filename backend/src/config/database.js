// ===========================================
// Configuration Base de Données PostgreSQL
// ===========================================

import pg from 'pg';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

dotenv.config();

const { Pool } = pg;

// Configuration du pool de connexions
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  min: parseInt(process.env.DB_POOL_MIN) || 2,
  max: parseInt(process.env.DB_POOL_MAX) || 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

// SSL pour les environnements de production (Supabase, Railway, etc.)
if (process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production') {
  poolConfig.ssl = {
    rejectUnauthorized: false
  };
}

const pool = new Pool(poolConfig);

// Gestion des erreurs de connexion
pool.on('error', (err) => {
  console.error('[DB POOL ERROR]', { code: err.code, message: err.message });
  logger.error('Erreur inattendue du pool PostgreSQL:', { code: err.code, message: err.message });
});

pool.on('connect', () => {
  logger.debug('Nouvelle connexion au pool PostgreSQL');
});

// Helper pour les requêtes
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Requête exécutée', { text: text.substring(0, 100), duration, rows: result.rowCount });
    return result;
  } catch (error) {
    logger.error('Erreur de requête SQL:', { text: text.substring(0, 100), error: error.message });
    throw error;
  }
};

// Transaction helper
export const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Test de connexion
export const testConnection = async () => {
  try {
    const result = await query('SELECT NOW() as now, current_database() as db');
    logger.info(`Connexion DB réussie: ${result.rows[0].db} à ${result.rows[0].now}`);
    return true;
  } catch (error) {
    console.error('[DB CONNECTION FAILED]', {
      code: error.code,
      message: error.message,
      databaseUrl: process.env.DATABASE_URL ? 'present' : 'MISSING',
      ssl: process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production'
    });
    logger.error('Échec de connexion à la base de données:', error.message);
    return false;
  }
};

// Fermeture propre du pool
export const closePool = async () => {
  await pool.end();
  logger.info('Pool de connexions fermé');
};

export default pool;
