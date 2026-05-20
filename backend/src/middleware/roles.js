// ===========================================
// Middleware de Gestion des Rôles et Permissions
// ===========================================

import { logger } from '../utils/logger.js';

// Définition des permissions par rôle
export const PERMISSIONS = {
  admin: {
    // Accès total
    users: ['read', 'create', 'update', 'delete'],
    clients: ['read', 'create', 'update', 'delete'],
    rooms: ['read', 'create', 'update', 'delete'],
    reservations: ['read', 'create', 'update', 'delete'],
    restaurant: ['read', 'create', 'update', 'delete'],
    deliveries: ['read', 'create', 'update', 'delete'],
    stock: ['read', 'create', 'update', 'delete'],
    expenses: ['read', 'create', 'update', 'delete'],
    invoices: ['read', 'create', 'update', 'delete'],
    staff: ['read', 'create', 'update', 'delete'],
    reports: ['read', 'export'],
    settings: ['read', 'update'],
    audit: ['read']
  },
  
  manager: {
    // Gestion quotidienne sans suppression majeure
    users: ['read'],
    clients: ['read', 'create', 'update'],
    rooms: ['read', 'create', 'update'],
    reservations: ['read', 'create', 'update', 'delete'],
    restaurant: ['read', 'create', 'update', 'delete'],
    deliveries: ['read', 'create', 'update', 'delete'],
    stock: ['read', 'create', 'update'],
    expenses: ['read', 'create', 'update'],
    invoices: ['read', 'create', 'update'],
    staff: ['read', 'update'],
    reports: ['read', 'export'],
    settings: ['read'],
    audit: []
  },
  
  employe: {
    // Accès limité, opérations quotidiennes
    users: [],
    clients: ['read', 'create'],
    rooms: ['read'],
    reservations: ['read', 'create'],
    restaurant: ['read', 'create', 'update'],
    deliveries: ['read', 'create', 'update'],
    stock: ['read'],
    expenses: [],
    invoices: ['read'],
    staff: [],
    reports: [],
    settings: [],
    audit: []
  },
  
  comptable: {
    // Accès finances uniquement
    users: [],
    clients: ['read'],
    rooms: ['read'],
    reservations: ['read'],
    restaurant: ['read'],
    deliveries: ['read'],
    stock: ['read'],
    expenses: ['read', 'create', 'update', 'delete'],
    invoices: ['read', 'create', 'update', 'delete'],
    staff: ['read'],
    reports: ['read', 'export'],
    settings: [],
    audit: ['read']
  }
};

// Middleware pour vérifier les rôles
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Accès refusé', {
        userId: req.user.id,
        role: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path
      });
      
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé pour ce rôle'
      });
    }
    
    next();
  };
};

// Middleware pour vérifier les permissions spécifiques
export const requirePermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }
    
    const userPermissions = PERMISSIONS[req.user.role];
    
    if (!userPermissions || !userPermissions[resource]) {
      return res.status(403).json({
        success: false,
        message: 'Ressource non autorisée'
      });
    }
    
    if (!userPermissions[resource].includes(action)) {
      logger.warn('Permission refusée', {
        userId: req.user.id,
        role: req.user.role,
        resource,
        action,
        path: req.path
      });
      
      return res.status(403).json({
        success: false,
        message: `Action "${action}" non autorisée sur "${resource}"`
      });
    }
    
    next();
  };
};

// Helper pour obtenir les permissions d'un rôle
export const getRolePermissions = (role) => {
  return PERMISSIONS[role] || {};
};

// Helper pour vérifier une permission
export const hasPermission = (role, resource, action) => {
  const perms = PERMISSIONS[role];
  return perms && perms[resource] && perms[resource].includes(action);
};

export default { requireRole, requirePermission, PERMISSIONS };
