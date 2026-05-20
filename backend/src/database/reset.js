// ===========================================
// Script de Reset de Base de Données
// ATTENTION: Supprime toutes les données!
// ===========================================

import { query, testConnection, closePool } from '../config/database.js';
import { logger } from '../utils/logger.js';

async function reset() {
  logger.warn('⚠️  ATTENTION: Ce script va supprimer toutes les données!');
  logger.info('Appuyez sur Ctrl+C dans les 5 secondes pour annuler...');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  logger.info('Démarrage du reset...');
  
  try {
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Impossible de se connecter à la base de données');
    }
    
    // Supprimer toutes les tables dans le bon ordre (dépendances)
    const dropTables = `
      DROP TABLE IF EXISTS audit_logs CASCADE;
      DROP TABLE IF EXISTS refresh_tokens CASCADE;
      DROP TABLE IF EXISTS settings CASCADE;
      DROP TABLE IF EXISTS deliveries CASCADE;
      DROP TABLE IF EXISTS restaurant_orders CASCADE;
      DROP TABLE IF EXISTS reservations CASCADE;
      DROP TABLE IF EXISTS invoices CASCADE;
      DROP TABLE IF EXISTS expenses CASCADE;
      DROP TABLE IF EXISTS stock_items CASCADE;
      DROP TABLE IF EXISTS staff CASCADE;
      DROP TABLE IF EXISTS rooms CASCADE;
      DROP TABLE IF EXISTS clients CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `;
    
    await query(dropTables);
    
    logger.info('Tables supprimées avec succès');
    logger.info('Exécutez "npm run db:migrate" puis "npm run db:seed" pour recréer');
    
  } catch (error) {
    logger.error('Erreur de reset:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

reset();
