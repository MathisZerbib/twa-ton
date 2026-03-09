/**
 * TON-Eats In-Memory Order Store
 *
 * Stores all orders in a Map keyed by orderId (string).
 * In production, replace with a real DB (PostgreSQL / Redis).
 *
 * Order shape:
 * {
 *   id:              string           — UUID
 *   storeId:         string
 *   orderId:         string           — on-chain orderId (BigInt as string)
 *   buyerWallet:     string           — TON address of buyer
 *   merchantWallet:  string
 *   deliveryAddress: string
 *   items:           Array<{ name, qty, priceTon }>
 *   foodTotalTon:    number
 *   deliveryFeeTon:  number
 *   protocolFeeTon:  number
 *   referrerWallet:  string | null
 *   confirmCode:     string           — 4-digit delivery confirmation code
 *   status:          'pending' | 'accepted' | 'picked_up' | 'delivered'
 *   courierWallet:   string | null
 *   courierLocation: { lat, lng } | null
 *   createdAt:       number           — unix ms
 *   updatedAt:       number
 * }
 */

const orders = new Map();

function generateCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function createOrder({ storeId, orderId, buyerWallet, merchantWallet, deliveryAddress, items, foodTotalTon, deliveryFeeTon, protocolFeeTon, referrerWallet }) {
  const id = orderId; // use the on-chain orderId as our primary key
  const record = {
    id,
    storeId: storeId ?? '1',
    orderId,
    buyerWallet,
    merchantWallet,
    deliveryAddress,
    items: items ?? [],
    foodTotalTon: Number(foodTotalTon),
    deliveryFeeTon: Number(deliveryFeeTon),
    protocolFeeTon: Number(protocolFeeTon),
    referrerWallet: referrerWallet ?? null,
    confirmCode: generateCode(),
    status: 'pending',
    courierWallet: null,
    courierLocation: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  orders.set(id, record);
  return record;
}

function getOrder(id) {
  return orders.get(String(id)) ?? null;
}

function getAllOrders() {
  return Array.from(orders.values()).sort((a, b) => b.createdAt - a.createdAt);
}

function getAvailableOrders() {
  return Array.from(orders.values())
    .filter(o => o.status === 'pending')
    .sort((a, b) => a.createdAt - b.createdAt);
}

function updateOrder(id, patch) {
  const order = orders.get(String(id));
  if (!order) return null;
  const updated = { ...order, ...patch, updatedAt: Date.now() };
  orders.set(String(id), updated);
  return updated;
}

function setCourierLocation(orderId, lat, lng) {
  const order = orders.get(String(orderId));
  if (!order) return null;
  order.courierLocation = { lat, lng };
  order.updatedAt = Date.now();
  orders.set(String(orderId), order);
  return order;
}

module.exports = {
  createOrder,
  getOrder,
  getAllOrders,
  getAvailableOrders,
  updateOrder,
  setCourierLocation,
};
