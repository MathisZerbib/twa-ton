/**
 * TON-Eats Order Store — PostgreSQL via Prisma
 *
 * Persistent order storage replacing the previous in-memory Map.
 * All methods are async and return Prisma model instances.
 *
 * The `courierLocation` virtual field is computed from courierLat/courierLng
 * so the API response shape stays identical to the old in-memory version.
 */

const prisma = require('./db');

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/**
 * Adds the virtual `courierLocation` field to keep API compatibility.
 * Prisma stores lat/lng in separate columns; the frontend expects { lat, lng }.
 */
function withCourierLocation(order) {
  if (!order) return null;
  const { courierLat, courierLng, ...rest } = order;
  return {
    ...rest,
    courierLocation:
      courierLat != null && courierLng != null
        ? { lat: courierLat, lng: courierLng }
        : null,
  };
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

async function createOrder({
  storeId,
  orderId,
  buyerWallet,
  merchantWallet,
  deliveryAddress,
  deliveryLat,
  deliveryLng,
  storeLat,
  storeLng,
  items,
  foodTotalTon,
  deliveryFeeTon,
  protocolFeeTon,
  referrerWallet,
}) {
  const record = await prisma.order.create({
    data: {
      orderId: String(orderId),
      storeId: storeId ?? '1',
      buyerWallet,
      merchantWallet,
      deliveryAddress,
      deliveryLat: deliveryLat != null ? Number(deliveryLat) : null,
      deliveryLng: deliveryLng != null ? Number(deliveryLng) : null,
      storeLat: storeLat != null ? Number(storeLat) : null,
      storeLng: storeLng != null ? Number(storeLng) : null,
      items: items ?? [],
      foodTotalTon: Number(foodTotalTon),
      deliveryFeeTon: Number(deliveryFeeTon),
      protocolFeeTon: Number(protocolFeeTon),
      referrerWallet: referrerWallet ?? null,
      confirmCode: generateCode(),
      status: 'pending',
    },
  });
  return withCourierLocation(record);
}

async function getOrder(id) {
  const order = await prisma.order.findUnique({
    where: { orderId: String(id) },
  });
  return withCourierLocation(order);
}

async function getAllOrders() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return orders.map(withCourierLocation);
}

async function getAvailableOrders() {
  const orders = await prisma.order.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'asc' },
  });
  return orders.map(withCourierLocation);
}

async function updateOrder(id, patch) {
  try {
    const updated = await prisma.order.update({
      where: { orderId: String(id) },
      data: { ...patch },
    });
    return withCourierLocation(updated);
  } catch {
    return null; // Record not found
  }
}

async function setCourierLocation(orderId, lat, lng) {
  try {
    const updated = await prisma.order.update({
      where: { orderId: String(orderId) },
      data: { courierLat: lat, courierLng: lng },
    });
    return withCourierLocation(updated);
  } catch {
    return null;
  }
}

async function getOrdersByWallet(address) {
  const orders = await prisma.order.findMany({
    where: { buyerWallet: address },
    orderBy: { createdAt: 'desc' },
  });
  return orders.map(withCourierLocation);
}

async function getOrdersByCourier(courierWallet) {
  const orders = await prisma.order.findMany({
    where: { courierWallet },
    orderBy: { createdAt: 'desc' },
  });
  return orders.map(withCourierLocation);
}

module.exports = {
  createOrder,
  getOrder,
  getAllOrders,
  getAvailableOrders,
  getOrdersByWallet,
  getOrdersByCourier,
  updateOrder,
  setCourierLocation,
};
