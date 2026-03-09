/**
 * routes/admin.js — mounted at /api/admin
 *
 * Super-admin endpoints for order management and platform analytics.
 */

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');

// ── Dashboard stats ──────────────────────────────────────────────────────────
router.get('/stats', ctrl.getStats);

// ── All orders (with filters) ────────────────────────────────────────────────
router.get('/orders', ctrl.getAllOrders);

// ── Cancel an order ──────────────────────────────────────────────────────────
router.patch('/orders/:id/cancel', ctrl.cancelOrder);

// ── All merchants ────────────────────────────────────────────────────────────
router.get('/merchants', ctrl.getAllMerchants);

module.exports = router;
