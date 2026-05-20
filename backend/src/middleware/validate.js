// ===========================================
// Middleware de Validation des Données
// ===========================================

import { validationResult, body, param, query as queryValidator } from 'express-validator';

// Handler des erreurs de validation
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

// ===== VALIDATIONS AUTH =====
export const validateLogin = [
  body('email')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Mot de passe requis')
    .isLength({ min: 6 }).withMessage('Mot de passe trop court'),
  handleValidationErrors
];

export const validateChangePassword = [
  body('currentPassword')
    .notEmpty().withMessage('Mot de passe actuel requis'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Minimum 8 caractères')
    .matches(/[A-Z]/).withMessage('Au moins une majuscule')
    .matches(/[a-z]/).withMessage('Au moins une minuscule')
    .matches(/[0-9]/).withMessage('Au moins un chiffre'),
  handleValidationErrors
];

// ===== VALIDATIONS USER =====
export const validateCreateUser = [
  body('email')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Minimum 8 caractères')
    .matches(/[A-Z]/).withMessage('Au moins une majuscule'),
  body('name')
    .notEmpty().withMessage('Nom requis')
    .isLength({ max: 255 }).withMessage('Nom trop long')
    .trim()
    .escape(),
  body('role')
    .isIn(['admin', 'manager', 'employe', 'comptable'])
    .withMessage('Rôle invalide'),
  handleValidationErrors
];

// ===== VALIDATIONS CLIENT =====
export const validateClient = [
  body('name')
    .notEmpty().withMessage('Nom requis')
    .isLength({ max: 255 }).withMessage('Nom trop long')
    .trim()
    .escape(),
  body('phone')
    .optional()
    .matches(/^(\+261|0)(32|33|34|38)[0-9]{7}$/)
    .withMessage('Téléphone malgache invalide'),
  body('email')
    .optional()
    .isEmail().withMessage('Email invalide'),
  body('type')
    .optional()
    .isIn(['Restaurant', 'Appartement', 'Les deux'])
    .withMessage('Type invalide'),
  handleValidationErrors
];

// ===== VALIDATIONS ROOM =====
export const validateRoom = [
  body('name')
    .notEmpty().withMessage('Nom requis')
    .isLength({ max: 255 }).withMessage('Nom trop long')
    .trim(),
  body('type')
    .isIn(['Chambre', 'Appartement']).withMessage('Type invalide'),
  body('price_per_night')
    .isFloat({ min: 0 }).withMessage('Prix invalide'),
  body('capacity')
    .optional()
    .isInt({ min: 1, max: 20 }).withMessage('Capacité invalide'),
  handleValidationErrors
];

// ===== VALIDATIONS RESERVATION =====
export const validateReservation = [
  body('client_id')
    .optional()
    .isUUID().withMessage('ID client invalide'),
  body('room_id')
    .notEmpty().withMessage('Chambre requise')
    .isUUID().withMessage('ID chambre invalide'),
  body('check_in')
    .notEmpty().withMessage('Date d\'arrivée requise')
    .isISO8601().withMessage('Date invalide'),
  body('check_out')
    .notEmpty().withMessage('Date de départ requise')
    .isISO8601().withMessage('Date invalide')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.check_in)) {
        throw new Error('Date de départ doit être après l\'arrivée');
      }
      return true;
    }),
  body('price_per_night')
    .isFloat({ min: 0 }).withMessage('Prix invalide'),
  body('paid_amount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Montant payé invalide')
    .custom((value, { req }) => {
      const total = req.body.total_amount;
      if (total && value > total) {
        throw new Error('Paiement ne peut pas dépasser le total');
      }
      return true;
    }),
  handleValidationErrors
];

// ===== VALIDATIONS ORDER =====
export const validateOrder = [
  body('items')
    .notEmpty().withMessage('Items requis'),
  body('total_amount')
    .isFloat({ min: 0 }).withMessage('Montant invalide'),
  body('order_type')
    .isIn(['Sur place', 'À emporter', 'Livraison'])
    .withMessage('Type de commande invalide'),
  body('paid_amount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Montant payé invalide'),
  handleValidationErrors
];

// ===== VALIDATIONS STOCK =====
export const validateStockItem = [
  body('name')
    .notEmpty().withMessage('Nom requis')
    .isLength({ max: 255 }).withMessage('Nom trop long')
    .trim(),
  body('category')
    .isIn(['Cuisine', 'Boissons', 'Chambre', 'Nettoyage', 'Autre'])
    .withMessage('Catégorie invalide'),
  body('quantity')
    .isFloat({ min: 0 }).withMessage('Quantité invalide'),
  body('min_quantity')
    .optional()
    .isFloat({ min: 0 }).withMessage('Seuil minimum invalide'),
  body('purchase_price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Prix d\'achat invalide'),
  handleValidationErrors
];

// ===== VALIDATIONS EXPENSE =====
export const validateExpense = [
  body('date')
    .notEmpty().withMessage('Date requise')
    .isISO8601().withMessage('Date invalide'),
  body('category')
    .isIn(['Achats restaurant', 'Salaires', 'Électricité', 'Eau', 'Internet', 
           'Maintenance', 'Marketing', 'Transport', 'Loyer', 'Impôts', 'Autre'])
    .withMessage('Catégorie invalide'),
  body('description')
    .notEmpty().withMessage('Description requise')
    .isLength({ max: 500 }).withMessage('Description trop longue')
    .trim(),
  body('amount')
    .isFloat({ min: 0.01 }).withMessage('Montant invalide'),
  handleValidationErrors
];

// ===== VALIDATIONS UUID =====
export const validateUUID = [
  param('id')
    .isUUID().withMessage('ID invalide'),
  handleValidationErrors
];

export default {
  handleValidationErrors,
  validateLogin,
  validateChangePassword,
  validateCreateUser,
  validateClient,
  validateRoom,
  validateReservation,
  validateOrder,
  validateStockItem,
  validateExpense,
  validateUUID
};
