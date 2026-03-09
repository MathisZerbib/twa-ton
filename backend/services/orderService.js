/**
 * services/orderService.js
 *
 * Wraps the in-memory order store (orderStore.js).
 * Socket.io emissions are handled in the controller so services stay pure.
 */

const store = require('../store/orderStore');

function getAllOrders() {
  return store.getAllOrders();
}

function getAvailableOrders() {
  return store.getAvailableOrders();
}

function getOrderById(id) {
  return store.getOrder(String(id));
}

function createOrder(data) {
  return store.createOrder({
    ...data,
    orderId: String(data.orderId),
  });
}

function acceptOrder(id, courierWallet) {
  const order = store.getOrder(id);
  if (!order) return { error: 'Order not found', status: 404 };
  if (order.status !== 'pending') return { error: `Order is already ${order.status}`, status: 409 };
  const updated = store.updateOrder(id, { status: 'accepted', courierWallet });
  return { data: updated };
}

function pickupOrder(id, courierWallet) {
  const order = store.getOrder(id);
  if (!order) return { error: 'Order not found', status: 404 };
  if (order.courierWallet !== courierWallet) return { error: 'Not the assigned courier', status: 403 };
  const updated = store.updateOrder(id, { status: 'picked_up' });
  return { data: updated };
}

function confirmDelivery(id, courierWallet, code) {
  const order = store.getOrder(id);
  if (!order) return { error: 'Order not found', status: 404 };
  if (order.courierWallet !== courierWallet) return { error: 'Not the assigned courier', status: 403 };
  if (order.confirmCode !== String(code)) return { error: 'Invalid confirmation code', status: 400 };
  const updated = store.updateOrder(id, { status: 'delivered' });
  return { data: updated };
}

function setCourierLocation(orderId, lat, lng) {
  return store.setCourierLocation(orderId, lat, lng);
}

module.exports = {
  getAllOrders,
  getAvailableOrders,
  getOrderById,
  createOrder,
  acceptOrder,
  pickupOrder,
  confirmDelivery,
  setCourierLocation,
};
