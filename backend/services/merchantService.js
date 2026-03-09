/**
 * services/merchantService.js
 *
 * Business logic for merchant & product management.
 * All Prisma calls live here — controllers stay thin.
 */

const prisma = require('../store/db');

async function getAllMerchants() {
  return prisma.merchant.findMany({ include: { products: true } });
}

async function getMerchantById(id) {
  const merchant = await prisma.merchant.findUnique({
    where: { id },
    include: { products: true },
  });
  return merchant; // null if not found
}

async function createMerchant({ name, category, imageUrl, bannerUrl, description, merchantWallet, lat, lng, products }) {
  return prisma.merchant.create({
    data: {
      name,
      category,
      description: description || null,
      merchantWallet,
      lat: parseFloat(lat) || 0.0,
      lng: parseFloat(lng) || 0.0,
      imageUrl: imageUrl || '/burger_logo.png',
      bannerUrl: bannerUrl || '/gourmet_burger.png',
      products: {
        create: Array.isArray(products)
          ? products.map(p => ({
              name: p.name,
              description: p.description || null,
              priceUsdt: parseFloat(p.priceUsdt) || 0,
              category: p.category || 'sides',
              imageUrl: p.imageUrl || null,
            }))
          : [],
      },
    },
    include: { products: true },
  });
}

module.exports = { getAllMerchants, getMerchantById, createMerchant };
