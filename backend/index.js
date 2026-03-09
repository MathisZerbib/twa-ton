'use strict';

/**
 * TON-Eats Backend — index.js
 *
 * Layers (clean architecture):
 *   routes/        — HTTP routing only (no logic)
 *   controllers/   — request/response handling, input validation
 *   services/      — pure business logic / DB calls
 *   middleware/    — cross-cutting concerns (auth, errors, rate-limiting)
 *   store/         — in-memory order store + Prisma singleton
 *
 * Socket.io Rooms:
 *   "couriers"         — all connected courier clients
 *   "order:<orderId>"  — buyer + assigned courier for one order
 *
 * Socket.io Events (server → client):
 *   orders:new        — new order available (couriers room)
 *   orders:taken      — order no longer available (couriers room)
 *   orders:available  — initial snapshot sent on join
 *   order:state       — full order snapshot sent on join
 *   order:accepted    — courier accepted (order room)
 *   order:picked_up   — food picked up (order room)
 *   order:delivered   — confirmed delivery (order room)
 *   courier:location  — GPS update (order room)
 *
 * Socket.io Events (client → server):
 *   join:order        — join an order room
 *   join:couriers     — join the courier feed
 *   courier:location  — broadcast GPS coords
 */

require('dotenv').config();

const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');

const orderStore   = require('./store/orderStore');
const errorHandler = require('./middleware/errorHandler');
const notFound     = require('./middleware/notFound');

// ── App & HTTP Server ─────────────────────────────────────────────────────────
const app        = express();
const httpServer = http.createServer(app);

// ── Allowed origins (dev-friendly) ───────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  // LAN / Docker internal
  /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
  // Cloudflare tunnels
  /^https?:\/\/.*\.trycloudflare\.com$/,
  // ngrok / similar
  /^https?:\/\/.*\.ngrok\.io$/,
  // Any localhost port (dev)
  /^https?:\/\/localhost(:\d+)?$/,
  // Vercel Production & Previews
  'https://twa-ton.vercel.app',
  /^https?:\/\/.*\.vercel\.app$/,
  // Render internal/previews (useful for cross-service calls)
  /^https?:\/\/.*\.onrender\.com$/,
];

// ── Security Middleware ───────────────────────────────────────────────────────
/**
 * Global CORS whitelist validator.
 * Consistent across REST (Express) and WebSockets (Socket.io).
 */
function checkOrigin(origin, callback) {
  // 🚀 Pass-through for same-origin or tool-based requests (curl, etc.)
  if (!origin) return callback(null, true);

  // ✅ Whitelist check
  const isAllowed = ALLOWED_ORIGINS.some(pattern =>
    typeof pattern === 'string' ? pattern === origin : pattern.test(origin)
  );

  if (isAllowed) {
    callback(null, true);
  } else {
    // ⚠️ Log rejected origin to help troubleshoot in Render logs
    console.warn(`[CORS] ❌ Blocked origin: ${origin}`);
    callback(null, false);
  }
}

// REST (Express) CORS + Preflight — Manual implementation for maximum Vercel compatibility
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  checkOrigin(origin, (err, allowed) => {
    if (allowed && origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.setHeader('Access-Control-Max-Age', '86400');
    }

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    next();
  });
});

app.use(helmet({
  contentSecurityPolicy: false,
}));
 

// Body parsing — limit payload to 1 MB to prevent DoS
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// ── Global rate limiter ───────────────────────────────────────────────────────
// Allow up to 500 requests per minute per IP — blocks brute-force and scrapers
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});
app.use('/api', globalLimiter);

// Stricter limiter for write endpoints
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many write requests, please slow down.' },
});
app.use('/api/orders', writeLimiter);
app.use('/api/merchants', writeLimiter);

// ── Socket.io ─────────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: { origin: checkOrigin, methods: ['GET', 'POST', 'PATCH'] },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
});

// Make io available inside route handlers
app.set('io', io);

io.on('connection', socket => {
  console.log(`[Socket] ✅ connected  → ${socket.id}`);

  // Buyer or courier joins a specific order room for live updates
  socket.on('join:order', ({ orderId }) => {
    if (!orderId) return;
    const room = `order:${orderId}`;
    socket.join(room);
    console.log(`[Socket] ${socket.id} joined ${room}`);
    const order = orderStore.getOrder(String(orderId));
    if (order) socket.emit('order:state', order);
  });

  // Courier joins the shared feed to receive new orders
  socket.on('join:couriers', () => {
    socket.join('couriers');
    console.log(`[Socket] ${socket.id} joined couriers`);
    socket.emit('orders:available', orderStore.getAvailableOrders());
  });

  // Courier broadcasts GPS position
  socket.on('courier:location', ({ orderId, lat, lng }) => {
    if (!orderId || lat == null || lng == null) return;
    orderStore.setCourierLocation(orderId, lat, lng);
    io.to(`order:${orderId}`).emit('courier:location', { orderId, lat, lng });
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] ❌ disconnected → ${socket.id}`);
  });
});

// ── REST Routes ───────────────────────────────────────────────────────────────
app.use('/api/orders',    require('./routes/orders'));
app.use('/api/merchants', require('./routes/merchants'));
app.use('/api/prices',    require('./routes/prices'));
app.use('/api/manifest',  require('./routes/manifest'));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ ok: true, uptime: process.uptime() }));

// ── 404 & Error Handlers ─────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Boot ──────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, async () => {
    console.log(`\n🚀  TON-Eats backend   → http://localhost:${PORT}`);
    console.log(`⚡  Socket.io          → ws://localhost:${PORT}`);
    console.log(`📦  REST API           → http://localhost:${PORT}/api\n`);

    // Auto-seed if empty
    try {
      const prisma = require('./store/db');
      const count = await prisma.merchant.count();
      if (count === 0) {
        console.log('📦 Database is empty. Running auto-seed...');
        const { seed } = require('./seed');
        await seed(false); // Don't clear if it's already empty
      }
    } catch (err) {
      console.warn('⚠️  Auto-seed check failed (DB might not be ready yet):', err.message);
    }
  });
}

module.exports = { app, httpServer };
