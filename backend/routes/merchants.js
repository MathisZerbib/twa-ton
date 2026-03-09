/**
 * routes/merchants.js — mounted at /api/merchants
 */

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/merchantController');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', ctrl.create);

module.exports = router;
