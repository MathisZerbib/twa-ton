/**
 * controllers/adminController.js
 *
 * Admin-only controller for the Super Admin dashboard.
 * Provides platform-wide analytics, order listing (filterable), and cancel.
 */

const prisma = require('../store/db');

// ── Dashboard Stats ──────────────────────────────────────────────────────────
async function getStats(_req, res) {
  const [
    totalOrders,
    pendingOrders,
    acceptedOrders,
    pickedUpOrders,
    deliveredOrders,
    cancelledOrders,
    totalMerchants,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: 'pending' } }),
    prisma.order.count({ where: { status: 'accepted' } }),
    prisma.order.count({ where: { status: 'picked_up' } }),
    prisma.order.count({ where: { status: 'delivered' } }),
    prisma.order.count({ where: { status: 'cancelled' } }),
    prisma.merchant.count(),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        orderId: true,
        status: true,
        deliveryAddress: true,
        foodTotalTon: true,
        deliveryFeeTon: true,
        createdAt: true,
      },
    }),
  ]);

  // Revenue stats (from delivered orders)
  const delivered = await prisma.order.findMany({
    where: { status: 'delivered' },
    select: { foodTotalTon: true, deliveryFeeTon: true, protocolFeeTon: true },
  });

  const totalRevenueTon = delivered.reduce((s, o) => s + o.foodTotalTon + o.deliveryFeeTon + o.protocolFeeTon, 0);
  const totalProtocolFees = delivered.reduce((s, o) => s + o.protocolFeeTon, 0);
  const totalDeliveryFees = delivered.reduce((s, o) => s + o.deliveryFeeTon, 0);

  // Unique couriers & buyers
  const uniqueCouriers = await prisma.order.findMany({
    where: { courierWallet: { not: null } },
    distinct: ['courierWallet'],
    select: { courierWallet: true },
  });
  const uniqueBuyers = await prisma.order.findMany({
    distinct: ['buyerWallet'],
    select: { buyerWallet: true },
  });

  res.json({
    orders: {
      total: totalOrders,
      pending: pendingOrders,
      accepted: acceptedOrders,
      picked_up: pickedUpOrders,
      delivered: deliveredOrders,
      cancelled: cancelledOrders,
    },
    revenue: {
      totalTon: totalRevenueTon,
      protocolFees: totalProtocolFees,
      deliveryFees: totalDeliveryFees,
    },
    users: {
      totalMerchants,
      totalCouriers: uniqueCouriers.length,
      totalBuyers: uniqueBuyers.length,
    },
    recentOrders,
  });
}

// ── All Orders (filterable) ──────────────────────────────────────────────────
async function getAllOrders(req, res) {
  const { status, limit = '50', offset = '0', search } = req.query;

  const where = {};
  if (status && status !== 'all') where.status = status;
  if (search) {
    where.OR = [
      { orderId: { contains: search, mode: 'insensitive' } },
      { buyerWallet: { contains: search, mode: 'insensitive' } },
      { courierWallet: { contains: search, mode: 'insensitive' } },
      { deliveryAddress: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(parseInt(limit) || 50, 200),
      skip: parseInt(offset) || 0,
    }),
    prisma.order.count({ where }),
  ]);

  res.json({ orders, total });
}

// ── Cancel Order ─────────────────────────────────────────────────────────────
async function cancelOrder(req, res) {
  const { id } = req.params;

  const order = await prisma.order.findFirst({
    where: { OR: [{ id }, { orderId: id }] },
  });

  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status === 'delivered') return res.status(409).json({ error: 'Cannot cancel a delivered order' });
  if (order.status === 'cancelled') return res.status(409).json({ error: 'Order is already cancelled' });

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: 'cancelled' },
  });

  // Notify via Socket.io
  const io = req.app.get('io');
  io.to(`order:${order.orderId}`).emit('order:cancelled', updated);
  io.to('couriers').emit('orders:taken', order.orderId);

  res.json(updated);
}

// ── All Merchants ────────────────────────────────────────────────────────────
async function getAllMerchants(_req, res) {
  const merchants = await prisma.merchant.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { orders: true, products: true } } },
  });
  res.json(merchants);
}

module.exports = { getStats, getAllOrders, cancelOrder, getAllMerchants };
