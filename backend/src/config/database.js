// ===========================================
// Configuration Base de Données PostgreSQL
// ===========================================

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Vérifier si DATABASE_URL est défini
const databaseUrl = process.env.DATABASE_URL;

// Configuration du pool de connexions
let pool = null;
let poolError = null;

if (databaseUrl) {
  const poolConfig = {
    connectionString: databaseUrl,
    min: parseInt(process.env.DB_POOL_MIN) || 2,
    max: parseInt(process.env.DB_POOL_MAX) || 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };

  // SSL pour les environnements de production
  if (process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production') {
    poolConfig.ssl = {
      rejectUnauthorized: false
    };
  }

  try {
    pool = new Pool(poolConfig);
    
    // Gestion des erreurs de connexion
    pool.on('error', (err) => {
      console.error('Erreur inattendue du pool PostgreSQL:', err.message);
    });

    pool.on('connect', () => {
      console.log('Nouvelle connexion au pool PostgreSQL');
    });
  } catch (error) {
    poolError = error.message;
    console.error('Erreur création pool PostgreSQL:', error.message);
  }
} else {
  poolError = 'DATABASE_URL non défini';
  console.warn('DATABASE_URL non défini - base de données non disponible');
}

// Helper pour les requêtes
export const query = async (text, params) => {
  if (!pool) {
    throw new Error(poolError || 'Pool de connexion non initialisé');
  }
  
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Requête exécutée', { text: text.substring(0, 100), duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Erreur de requête SQL:', { text: text.substring(0, 100), error: error.message });
    throw error;
  }
};

// Transaction helper
export const transaction = async (callback) => {
  if (!pool) {
    throw new Error(poolError || 'Pool de connexion non initialisé');
  }
  
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
  if (!pool) {
    console.error('Test connexion impossible:', poolError);
    return false;
  }
  
  try {
    const result = await query('SELECT NOW() as now, current_database() as db');
    console.log(`Connexion DB réussie: ${result.rows[0].db} à ${result.rows[0].now}`);
    return true;
  } catch (error) {
    console.error('Échec de connexion à la base de données:', error.message);
    return false;
  }
};

// Fermeture propre du pool
export const closePool = async () => {
  if (pool) {
    await pool.end();
    console.log('Pool de connexions fermé');
  }
};

export default pool;
