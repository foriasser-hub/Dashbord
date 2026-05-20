// ===========================================
// Index des Routes API
// ===========================================

import { Router } from 'express';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import clientsRoutes from './clients.routes.js';
import roomsRoutes from './rooms.routes.js';
import reservationsRoutes from './reservations.routes.js';
import restaurantRoutes from './restaurant.routes.js';
import stockRoutes from './stock.routes.js';
import expensesRoutes from './expenses.routes.js';
import invoicesRoutes from './invoices.routes.js';
import dashboardRoutes from './dashboard.routes.js';

const router = Router();

// Routes publiques (auth)
router.use('/auth', authRoutes);

// Routes protégées
router.use('/users', usersRoutes);
router.use('/clients', clientsRoutes);
router.use('/rooms', roomsRoutes);
router.use('/reservations', reservationsRoutes);
router.use('/restaurant-orders', restaurantRoutes);
router.use('/stock', stockRoutes);
router.use('/expenses', expensesRoutes);
router.use('/invoices', invoicesRoutes);
router.use('/dashboard', dashboardRoutes);

// Route de santé
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Le Paradisier Manager opérationnelle',
    timestamp: new Date().toISOString()
  });
});

export default router;
