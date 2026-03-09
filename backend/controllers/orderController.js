/**
 * controllers/orderController.js
 *
 * Thin controller — validates, delegates to orderService, emits Socket.io events.
 */

const orderService = require('../services/orderService');

function getAll(req, res) {
  res.json(orderService.getAllOrders());
}

function getAvailable(req, res) {
  res.json(orderService.getAvailableOrders());
}

function getOne(req, res) {
  const order = orderService.getOrderById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
}

function create(req, res) {
  const {
    storeId, orderId, buyerWallet, merchantWallet,
    deliveryAddress, items,
    foodTotalTon, deliveryFeeTon, protocolFeeTon,
    referrerWallet,
  } = req.body;

  if (!orderId || !buyerWallet || !deliveryAddress) {
    return res.status(400).json({
      error: 'Missing required fields: orderId, buyerWallet, deliveryAddress',
    });
  }

  const order = orderService.createOrder({
    storeId, orderId, buyerWallet, merchantWallet,
    deliveryAddress, items,
    foodTotalTon, deliveryFeeTon, protocolFeeTon,
    referrerWallet,
  });

  // Real-time: notify courier feed
  req.app.get('io').to('couriers').emit('orders:new', order);

  res.status(201).json(order);
}

function accept(req, res) {
  const { courierWallet } = req.body;
  if (!courierWallet) return res.status(400).json({ error: 'courierWallet required' });

  const result = orderService.acceptOrder(req.params.id, courierWallet);
  if (result.error) return res.status(result.status).json({ error: result.error });

  const io = req.app.get('io');
  io.to(`order:${req.params.id}`).emit('order:accepted', result.data);
  io.to('couriers').emit('orders:taken', req.params.id);

  res.json(result.data);
}

function pickup(req, res) {
  const { courierWallet } = req.body;
  const result = orderService.pickupOrder(req.params.id, courierWallet);
  if (result.error) return res.status(result.status).json({ error: result.error });

  req.app.get('io').to(`order:${req.params.id}`).emit('order:picked_up', result.data);
  res.json(result.data);
}

function confirm(req, res) {
  const { courierWallet, code } = req.body;
  const result = orderService.confirmDelivery(req.params.id, courierWallet, code);
  if (result.error) return res.status(result.status).json({ error: result.error });

  req.app.get('io').to(`order:${req.params.id}`).emit('order:delivered', result.data);
  res.json(result.data);
}

module.exports = { getAll, getAvailable, getOne, create, accept, pickup, confirm };
