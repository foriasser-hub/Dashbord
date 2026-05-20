// ===========================================
// Routes Dashboard & Statistics
// ===========================================

import { Router } from 'express';
import { query } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.use(authenticate);

// GET /api/dashboard/stats - Statistiques principales
router.get('/stats', async (req, res) => {
  try {
    // Revenus du jour (commandes payées)
    const todayRevenue = await query(`
      SELECT COALESCE(SUM(paid_amount), 0) as total
      FROM restaurant_orders
      WHERE DATE(created_at) = CURRENT_DATE AND payment_status = 'Payé'
    `);
    
    // Revenus hébergement du jour
    const todayRoomRevenue = await query(`
      SELECT COALESCE(SUM(paid_amount), 0) as total
      FROM reservations
      WHERE DATE(created_at) = CURRENT_DATE OR (check_in <= CURRENT_DATE AND check_out >= CURRENT_DATE)
    `);
    
    // Dépenses du jour
    const todayExpenses = await query(`
      SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
      FROM expenses
      WHERE date = CURRENT_DATE
    `);
    
    // Commandes du jour
    const todayOrders = await query(`
      SELECT COUNT(*) as count, 
             COALESCE(SUM(total_amount), 0) as total,
             COALESCE(SUM(paid_amount), 0) as paid
      FROM restaurant_orders
      WHERE DATE(created_at) = CURRENT_DATE
    `);
    
    // Réservations actives
    const activeReservations = await query(`
      SELECT COUNT(*) as count
      FROM reservations
      WHERE status IN ('Confirmée', 'En cours')
      AND check_in <= CURRENT_DATE AND check_out >= CURRENT_DATE
    `);
    
    // Taux d'occupation
    const occupancy = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'Occupé') as occupied,
        COUNT(*) as total
      FROM rooms
    `);
    
    // Paiements en attente
    const pendingPayments = await query(`
      SELECT 
        COALESCE(SUM(r.remaining_amount), 0) as reservations,
        COALESCE(SUM(o.total_amount - o.paid_amount), 0) as orders
      FROM 
        (SELECT remaining_amount FROM reservations WHERE payment_status != 'Payé') r,
        (SELECT total_amount, paid_amount FROM restaurant_orders WHERE payment_status != 'Payé') o
    `);
    
    const pendingRes = await query(`
      SELECT COALESCE(SUM(total_amount - paid_amount), 0) as total 
      FROM reservations WHERE payment_status != 'Payé'
    `);
    const pendingOrd = await query(`
      SELECT COALESCE(SUM(total_amount - paid_amount), 0) as total 
      FROM restaurant_orders WHERE payment_status != 'Payé'
    `);
    
    // Alertes stock
    const stockAlerts = await query(`
      SELECT COUNT(*) as count
      FROM stock_items
      WHERE status IN ('Critique', 'Faible', 'Épuisé')
    `);
    
    const roomRevenue = parseFloat(todayRoomRevenue.rows[0].total);
    const restaurantRevenue = parseFloat(todayRevenue.rows[0].total);
    const expenses = parseFloat(todayExpenses.rows[0].total);
    const totalRevenue = roomRevenue + restaurantRevenue;
    
    const occupancyRate = occupancy.rows[0].total > 0 
      ? Math.round((occupancy.rows[0].occupied / occupancy.rows[0].total) * 100)
      : 0;
    
    res.json({
      success: true,
      data: {
        today: {
          revenue: totalRevenue,
          revenueRestaurant: restaurantRevenue,
          revenueRooms: roomRevenue,
          expenses: expenses,
          expensesCount: parseInt(todayExpenses.rows[0].count),
          profit: totalRevenue - expenses,
          ordersCount: parseInt(todayOrders.rows[0].count),
          ordersTotal: parseFloat(todayOrders.rows[0].total)
        },
        reservations: {
          active: parseInt(activeReservations.rows[0].count)
        },
        rooms: {
          occupied: parseInt(occupancy.rows[0].occupied),
          total: parseInt(occupancy.rows[0].total),
          occupancyRate
        },
        pending: {
          reservations: parseFloat(pendingRes.rows[0].total),
          orders: parseFloat(pendingOrd.rows[0].total),
          total: parseFloat(pendingRes.rows[0].total) + parseFloat(pendingOrd.rows[0].total)
        },
        alerts: {
          stockCount: parseInt(stockAlerts.rows[0].count)
        }
      }
    });
    
  } catch (error) {
    logger.error('Erreur dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/dashboard/revenue - Revenus sur période
router.get('/revenue', async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    let days = 7;
    if (period === 'month') days = 30;
    if (period === 'year') days = 365;
    
    // Revenus par jour
    const revenue = await query(`
      WITH dates AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '${days - 1} days',
          CURRENT_DATE,
          '1 day'::interval
        )::date as date
      )
      SELECT 
        d.date,
        COALESCE(SUM(o.paid_amount), 0) as restaurant,
        COALESCE(SUM(r.paid_amount), 0) as rooms
      FROM dates d
      LEFT JOIN restaurant_orders o ON DATE(o.created_at) = d.date AND o.payment_status = 'Payé'
      LEFT JOIN reservations r ON DATE(r.created_at) = d.date
      GROUP BY d.date
      ORDER BY d.date
    `);
    
    // Simplifier la requête
    const restaurantByDay = await query(`
      SELECT DATE(created_at) as date, SUM(paid_amount) as total
      FROM restaurant_orders
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
      AND payment_status = 'Payé'
      GROUP BY DATE(created_at)
    `);
    
    const roomsByDay = await query(`
      SELECT DATE(created_at) as date, SUM(paid_amount) as total
      FROM reservations
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
    `);
    
    // Construire les données par jour
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const restRow = restaurantByDay.rows.find(r => r.date?.toISOString?.()?.startsWith(dateStr) || r.date === dateStr);
      const roomRow = roomsByDay.rows.find(r => r.date?.toISOString?.()?.startsWith(dateStr) || r.date === dateStr);
      
      data.push({
        date: dateStr,
        restaurant: parseFloat(restRow?.total || 0),
        rooms: parseFloat(roomRow?.total || 0),
        total: parseFloat(restRow?.total || 0) + parseFloat(roomRow?.total || 0)
      });
    }
    
    res.json({
      success: true,
      data: {
        period,
        days,
        values: data,
        totals: {
          restaurant: data.reduce((s, d) => s + d.restaurant, 0),
          rooms: data.reduce((s, d) => s + d.rooms, 0),
          total: data.reduce((s, d) => s + d.total, 0)
        }
      }
    });
    
  } catch (error) {
    logger.error('Erreur dashboard revenue:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/dashboard/reports - Rapport complet
router.get('/reports', async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    
    const start = from_date || new Date(new Date().setDate(1)).toISOString().split('T')[0]; // Début du mois
    const end = to_date || new Date().toISOString().split('T')[0];
    
    // Revenus restaurant
    const restaurantRevenue = await query(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total,
        COALESCE(SUM(paid_amount), 0) as paid,
        COUNT(*) as count
      FROM restaurant_orders
      WHERE DATE(created_at) BETWEEN $1 AND $2
    `, [start, end]);
    
    // Revenus hébergement
    const roomsRevenue = await query(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total,
        COALESCE(SUM(paid_amount), 0) as paid,
        COUNT(*) as count
      FROM reservations
      WHERE check_in BETWEEN $1 AND $2
    `, [start, end]);
    
    // Dépenses par catégorie
    const expenses = await query(`
      SELECT 
        category,
        SUM(amount) as total,
        COUNT(*) as count
      FROM expenses
      WHERE date BETWEEN $1 AND $2
      GROUP BY category
      ORDER BY total DESC
    `, [start, end]);
    
    const totalExpenses = expenses.rows.reduce((s, e) => s + parseFloat(e.total), 0);
    const totalRevenue = parseFloat(restaurantRevenue.rows[0].paid) + parseFloat(roomsRevenue.rows[0].paid);
    
    res.json({
      success: true,
      data: {
        period: { from: start, to: end },
        revenue: {
          restaurant: {
            total: parseFloat(restaurantRevenue.rows[0].total),
            paid: parseFloat(restaurantRevenue.rows[0].paid),
            count: parseInt(restaurantRevenue.rows[0].count)
          },
          rooms: {
            total: parseFloat(roomsRevenue.rows[0].total),
            paid: parseFloat(roomsRevenue.rows[0].paid),
            count: parseInt(roomsRevenue.rows[0].count)
          },
          totalPaid: totalRevenue
        },
        expenses: {
          byCategory: expenses.rows.map(e => ({
            category: e.category,
            total: parseFloat(e.total),
            count: parseInt(e.count)
          })),
          total: totalExpenses
        },
        profit: {
          gross: totalRevenue,
          net: totalRevenue - totalExpenses
        }
      }
    });
    
  } catch (error) {
    logger.error('Erreur dashboard reports:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;
