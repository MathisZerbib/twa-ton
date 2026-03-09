/**
 * routes/prices.js — mounted at /api/prices
 */

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/priceController');

router.get('/ton-usdt', ctrl.getTonUsdRate);

module.exports = router;
