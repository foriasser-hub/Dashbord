// ===========================================
// Script de Seed - Données initiales
// ===========================================

import bcrypt from 'bcryptjs';
import { query, testConnection, closePool } from '../config/database.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

async function seed() {
  logger.info('Démarrage du seed de la base de données...');
  
  try {
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Impossible de se connecter à la base de données');
    }
    
    // Créer l'admin par défaut
    await createDefaultAdmin();
    
    // Créer les paramètres par défaut
    await createDefaultSettings();
    
    logger.info('Seed terminé avec succès!');
    
  } catch (error) {
    logger.error('Erreur de seed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

async function createDefaultAdmin() {
  const { email, password } = config.defaultAdmin;
  
  // Vérifier si l'admin existe déjà
  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    logger.info('Admin par défaut existe déjà');
    return;
  }
  
  // Hasher le mot de passe
  const passwordHash = await bcrypt.hash(password, 12);
  
  // Créer l'admin
  await query(`
    INSERT INTO users (email, password_hash, name, role, is_active)
    VALUES ($1, $2, $3, $4, $5)
  `, [email, passwordHash, 'Administrateur', 'admin', true]);
  
  logger.info(`Admin créé: ${email}`);
}

async function createDefaultSettings() {
  const settings = [
    { key: 'business_name', value: JSON.stringify(config.app.name), description: 'Nom de l\'entreprise' },
    { key: 'currency', value: JSON.stringify(config.app.currency), description: 'Devise' },
    { key: 'phone', value: JSON.stringify(config.app.phone), description: 'Téléphone' },
    { key: 'address', value: JSON.stringify(config.app.address), description: 'Adresse' }
  ];
  
  for (const setting of settings) {
    await query(`
      INSERT INTO settings (key, value, description)
      VALUES ($1, $2, $3)
      ON CONFLICT (key) DO NOTHING
    `, [setting.key, setting.value, setting.description]);
  }
  
  logger.info('Paramètres par défaut créés');
}

seed();
