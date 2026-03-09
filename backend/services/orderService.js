/**
 * services/orderService.js
 *
 * Wraps the Prisma-backed order store (orderStore.js).
 * All methods are async. Socket.io emissions are handled in the controller.
 */

const store = require('../store/orderStore');

async function getAllOrders() {
  return store.getAllOrders();
}

async function getAvailableOrders() {
  return store.getAvailableOrders();
}

async function getOrderById(id) {
  return store.getOrder(String(id));
}

async function createOrder(data) {
  return store.createOrder({
    ...data,
    orderId: String(data.orderId),
  });
}

async function acceptOrder(id, courierWallet) {
  const order = await store.getOrder(id);
  if (!order) return { error: 'Order not found', status: 404 };
  if (order.status !== 'pending') return { error: `Order is already ${order.status}`, status: 409 };
  const updated = await store.updateOrder(id, { status: 'accepted', courierWallet });
  return { data: updated };
}

async function pickupOrder(id, courierWallet) {
  const order = await store.getOrder(id);
  if (!order) return { error: 'Order not found', status: 404 };
  if (order.courierWallet !== courierWallet) return { error: 'Not the assigned courier', status: 403 };
  const updated = await store.updateOrder(id, { status: 'picked_up' });
  return { data: updated };
}

async function confirmDelivery(id, courierWallet, code) {
  const order = await store.getOrder(id);
  if (!order) return { error: 'Order not found', status: 404 };
  if (order.courierWallet !== courierWallet) return { error: 'Not the assigned courier', status: 403 };
  if (order.confirmCode !== String(code)) return { error: 'Invalid confirmation code', status: 400 };
  const updated = await store.updateOrder(id, { status: 'delivered' });
  return { data: updated };
}

async function setCourierLocation(orderId, lat, lng) {
  return store.setCourierLocation(orderId, lat, lng);
}

async function getOrdersByWallet(address) {
  return store.getOrdersByWallet(address);
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
  getOrdersByWallet,
};
