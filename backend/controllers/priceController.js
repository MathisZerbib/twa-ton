/**
 * controllers/priceController.js
 */

const { getTonUsdPrice } = require('../services/priceService');

async function getTonUsdRate(req, res, next) {
  try {
    const priceUsd = await getTonUsdPrice();
    res.json({ priceUsd });
  } catch (err) {
    next(err);
  }
}

module.exports = { getTonUsdRate };
