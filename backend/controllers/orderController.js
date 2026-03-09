/**
 * controllers/orderController.js
 *
 * Thin controller — validates, delegates to orderService, emits Socket.io events.
 * All handlers are async since the store is now backed by PostgreSQL via Prisma.
 */

const orderService = require('../services/orderService');

async function getAll(req, res) {
  const orders = await orderService.getAllOrders();
  res.json(orders);
}

async function getAvailable(req, res) {
  const orders = await orderService.getAvailableOrders();
  res.json(orders);
}

async function getOne(req, res) {
  const order = await orderService.getOrderById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
}

async function create(req, res) {
  const {
    storeId, orderId, buyerWallet, merchantWallet,
    deliveryAddress, deliveryLat, deliveryLng,
    storeLat, storeLng, items,
    foodTotalTon, deliveryFeeTon, protocolFeeTon,
    referrerWallet,
  } = req.body;

  if (!orderId || !buyerWallet || !deliveryAddress) {
    return res.status(400).json({
      error: 'Missing required fields: orderId, buyerWallet, deliveryAddress',
    });
  }

  const order = await orderService.createOrder({
    storeId, orderId, buyerWallet, merchantWallet,
    deliveryAddress, deliveryLat, deliveryLng,
    storeLat, storeLng, items,
    foodTotalTon, deliveryFeeTon, protocolFeeTon,
    referrerWallet,
  });

  // Real-time: notify courier feed
  req.app.get('io').to('couriers').emit('orders:new', order);

  res.status(201).json(order);
}

async function accept(req, res) {
  const { courierWallet } = req.body;
  if (!courierWallet) return res.status(400).json({ error: 'courierWallet required' });

  const result = await orderService.acceptOrder(req.params.id, courierWallet);
  if (result.error) return res.status(result.status).json({ error: result.error });

  const io = req.app.get('io');
  io.to(`order:${req.params.id}`).emit('order:accepted', result.data);
  io.to('couriers').emit('orders:taken', req.params.id);

  res.json(result.data);
}

async function pickup(req, res) {
  const { courierWallet } = req.body;
  const result = await orderService.pickupOrder(req.params.id, courierWallet);
  if (result.error) return res.status(result.status).json({ error: result.error });

  req.app.get('io').to(`order:${req.params.id}`).emit('order:picked_up', result.data);
  res.json(result.data);
}

async function confirm(req, res) {
  const { courierWallet, code } = req.body;
  const result = await orderService.confirmDelivery(req.params.id, courierWallet, code);
  if (result.error) return res.status(result.status).json({ error: result.error });

  req.app.get('io').to(`order:${req.params.id}`).emit('order:delivered', result.data);
  res.json(result.data);
}

async function getByWallet(req, res) {
  const orders = await orderService.getOrdersByWallet(req.params.address);
  res.json(orders);
}

async function getByCourier(req, res) {
  const orders = await orderService.getOrdersByCourier(req.params.address);
  res.json(orders);
}

module.exports = { getAll, getAvailable, getOne, getByWallet, getByCourier, create, accept, pickup, confirm };
