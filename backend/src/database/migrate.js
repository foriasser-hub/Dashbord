// ===========================================
// Script de Migration de Base de Données
// ===========================================

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { query, testConnection, closePool } from '../config/database.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrate() {
  logger.info('Démarrage de la migration de base de données...');
  
  try {
    // Test de connexion
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Impossible de se connecter à la base de données');
    }
    
    // Lecture du fichier SQL
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    
    // Exécution du schéma
    logger.info('Exécution du schéma SQL...');
    await query(schema);
    
    logger.info('Migration terminée avec succès!');
    
    // Afficher les tables créées
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    logger.info(`Tables créées: ${tables.rows.map(r => r.table_name).join(', ')}`);
    
  } catch (error) {
    logger.error('Erreur de migration:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

migrate();
