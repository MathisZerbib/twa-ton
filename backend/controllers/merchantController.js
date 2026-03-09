/**
 * controllers/merchantController.js
 *
 * Thin controller: validates input, calls service, sends response.
 */

const merchantService = require('../services/merchantService');

async function getAll(req, res, next) {
  try {
    const merchants = await merchantService.getAllMerchants();
    res.json(merchants);
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const merchant = await merchantService.getMerchantById(req.params.id);
    if (!merchant) return res.status(404).json({ error: 'Merchant not found' });
    res.json(merchant);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, category, merchantWallet } = req.body;

    if (!name || !category || !merchantWallet) {
      return res.status(400).json({ error: 'Missing required fields: name, category, merchantWallet' });
    }

    const merchant = await merchantService.createMerchant(req.body);
    res.status(201).json(merchant);
  } catch (err) {
    // Prisma unique constraint violation (duplicate wallet)
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Merchant wallet already registered.' });
    }
    next(err);
  }
}

module.exports = { getAll, getOne, create };
