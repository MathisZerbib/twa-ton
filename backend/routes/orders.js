/**
 * routes/orders.js — mounted at /api/orders
 */

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/orderController');

router.get('/', ctrl.getAll);
router.get('/available', ctrl.getAvailable);
router.get('/:id', ctrl.getOne);
router.post('/', ctrl.create);
router.patch('/:id/accept', ctrl.accept);
router.patch('/:id/pickup', ctrl.pickup);
router.post('/:id/confirm', ctrl.confirm);

module.exports = router;
