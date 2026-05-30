'use strict';
// ============================================================
// AI Commerce OS — Backend Server v2.1
// ============================================================
const path = require('path');
const fs   = require('fs');

// Load .env FIRST before anything else
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const compression = require('compression');
const rateLimit   = require('express-rate-limit');

const app  = express();
const PORT = process.env.PORT || 3001;
const DIST = path.join(__dirname, '..', 'dist');

// ── Ensure data dir ──────────────────────────────────────────
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ── Middleware ───────────────────────────────────────────────
// CSP: restrictive in production, relaxed locally for Vite HMR
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],           // React needs inline scripts
      styleSrc:  ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc:    ["'self'", 'data:', 'https:', 'blob:'],  // base64 product images
      connectSrc:["'self'",
        'https://api.openai.com',
        'https://generativelanguage.googleapis.com',
        'https://graph.facebook.com',
      ],
      fontSrc:   ["'self'", 'https://fonts.gstatic.com'],
      mediaSrc:  ["'self'", 'blob:'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  } : false,
  crossOriginEmbedderPolicy: false,
}));
app.use(compression());

// CORS: strict allowlist — unknown origins blocked in production
app.use(cors({
  origin: (origin, callback) => {
    // Allow: no origin (same-origin, Capacitor mobile apps)
    if (!origin) return callback(null, true);
    const allowed = [
      'http://localhost:5173', 'http://localhost:3000',
      'http://localhost:3001', 'http://localhost:4173',
      ...(process.env.PRODUCTION_URL   ? [process.env.PRODUCTION_URL]                          : []),
      ...(process.env.FRONTEND_URL     ? [process.env.FRONTEND_URL]                            : []),
      ...(process.env.RAILWAY_PUBLIC_DOMAIN ? [`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`] : []),
    ];
    const permitted =
      allowed.some(o => origin.startsWith(o)) ||
      origin.endsWith('.railway.app') ||
      origin.endsWith('.up.railway.app');

    if (permitted) return callback(null, true);

    // Production: block unknown origins — do NOT silently allow
    if (process.env.NODE_ENV === 'production') {
      console.warn('[CORS] Blocked unknown origin in production:', origin);
      return callback(new Error(`CORS: ${origin} not allowed`));
    }
    callback(new Error(`CORS: ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// ── Rate limiting ─────────────────────────────────────────────
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false }));
app.use('/api/auth/', rateLimit({ windowMs: 60 * 1000, max: 20, message: { error: 'Too many requests, try again later' } }));

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/products',      require('./routes/products'));
app.use('/api/orders',        require('./routes/orders'));
app.use('/api/customers',     require('./routes/customers'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/settings',      require('./routes/settings'));
app.use('/api/delivery',      require('./routes/delivery'));
app.use('/api/broadcast',     require('./routes/broadcast'));
app.use('/api/webhooks',      require('./routes/webhooks'));
app.use('/api/analytics',     require('./routes/analytics'));
app.use('/api/media',         require('./routes/media'));
app.use('/api/loyalty', require('./routes/loyalty'));
app.use('/api/coupons',       require('./routes/coupons'));
app.use('/api/ai',            require('./routes/ai'));
app.use('/api/delivery-auto', require('./routes/delivery-auto'));

// ── Health ───────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    status: 'ok', version: '3.2.0', name: 'SAHAR shop AI Commerce OS',
    time: new Date().toISOString(),
    uptime: Math.round(process.uptime()) + 's',
    memory: Math.round(mem.heapUsed/1024/1024) + 'MB',
    node: process.version,
    ai: {
      openai: !!(process.env.OPENAI_API_KEY),
      gemini: !!(process.env.GEMINI_API_KEY),
    },
    env: process.env.NODE_ENV || 'development',
  });
});

// ── Serve uploaded media ─────────────────────────────────────
const UPLOADS = path.join(DATA_DIR, 'uploads');
if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true });

// ── Serve frontend build ─────────────────────────────────────
app.use(express.static(DIST));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API route not found' });
  const indexFile = path.join(DIST, 'index.html');
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.status(503).send([
      '<h2>Frontend not built yet</h2>',
      '<p>Run <code>npm run build</code> in the project root, then restart the server.</p>',
    ].join(''));
  }
});

// ── Error handler ────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Start ────────────────────────────────────────────────────
const server = app.listen(PORT, '0.0.0.0', () => {
  const hasKey = !!(process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY);
  const url = process.env.RAILWAY_PUBLIC_DOMAIN 
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` 
    : `http://localhost:${PORT}`;
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║      AI Commerce OS  — v3.2 Ready       ║');
  console.log(`║  🌐  ${url}`);
  console.log(`║  🤖  AI: ${hasKey ? '✅ API key set' : '⚠️  Local AI (no key)'}     ║`);
  console.log('╚══════════════════════════════════════════╝\n');
  console.log(`[ENV] NODE_ENV=${process.env.NODE_ENV || 'development'}`);
  console.log(`[ENV] PORT=${PORT}`);
  ensureAdmin();
});

// ── WebSocket ────────────────────────────────────────────────
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server, path: '/ws' });
const clients = new Map();

wss.on('connection', (ws, req) => {
  const params = new URLSearchParams((req.url||'').split('?')[1]);
  const userId = params.get('userId') || 'anon';
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId).add(ws);
  ws.send(JSON.stringify({ event: 'connected', userId }));
  ws.on('close', () => {
    clients.get(userId)?.delete(ws);
    if (!clients.get(userId)?.size) clients.delete(userId);
  });
  ws.on('error', () => {});
});

app.set('broadcast', (userId, event) => {
  const sockets = clients.get(userId);
  if (!sockets) return;
  const msg = JSON.stringify(event);
  sockets.forEach(ws => { try { if (ws.readyState === 1) ws.send(msg); } catch {} });
});

// ── Auto-create admin ─────────────────────────────────────────
function ensureAdmin() {
  const { db } = require('./database');
  const email = process.env.ADMIN_EMAIL;
  const pass  = process.env.ADMIN_PASSWORD;
  if (!email || !pass) return;
  if (db.getUserByEmail(email)) return;
  const bcrypt = require('bcryptjs');
  db.createUser({ name: process.env.ADMIN_NAME || 'Admin', email, password: bcrypt.hashSync(pass, 10), role: 'admin' });
  const { defaultSettings } = require('./defaults');
  db.saveSettings(db.getUserByEmail(email).id, { ...defaultSettings, brand: { ...defaultSettings.brand, email } });
  console.log(`[Admin] Created: ${email}`);
}

// ── Morning Report Cron ─────────────────────────
function startMorningReportCron() {
  const { db } = require('./database');
  function scheduleNext() {
    const now = new Date();
    const next = new Date();
    next.setDate(next.getDate() + (now.getHours() >= 8 ? 1 : 0));
    next.setHours(8, 0, 0, 0);
    const delay = next.getTime() - now.getTime();
    setTimeout(() => {
      try {
        const users = db.listUsers();
        users.forEach(user => {
          const orders = db.getOrders(user.id);
          const yesterday = new Date(Date.now()-86400000).toISOString().split('T')[0];
          const ydOrders = orders.filter(o=>o.status!=='cancelled'&&o.createdAt?.startsWith(yesterday));
          const ydRev = ydOrders.reduce((s,o)=>s+o.total,0);
          const pending = orders.filter(o=>o.status==='pending').length;
          const conversations = db.getConversations(user.id);
          const unread = conversations.filter(c=>c.unread>0).length;
          const products = db.getProducts(user.id);
          const lowStock = products.filter(p=>p.stock>0&&p.stock<=5).length;
          const msg = [
            '🌅 ملخص صباح اليوم:',
            `💰 إيراد الأمس: ${ydRev.toLocaleString()} ${db.getSettings(user.id)?.brand?.currency||'MAD'}`,
            `🛒 طلبات معلقة: ${pending}`,
            `💬 رسائل غير مقروءة: ${unread}`,
            lowStock > 0 ? `⚠️ مخزون منخفض: ${lowStock} منتج` : '✅ المخزون جيد',
          ].join("\n");
          db.addNotification({ userId: user.id, type: 'info', message: msg });
          db.addLog({ userId: user.id, user: 'System', action: 'Morning report generated', details: '', type: 'info', severity: 'info' });
        });
      } catch(e) { console.error('[MorningReport]', e.message); }
      scheduleNext();
    }, delay);
  }
  scheduleNext();
  console.log('[MorningReport] Cron scheduled for 08:00 daily');
}
startMorningReportCron();

// ── Daily Backup System ─────────────────────────
function startDailyBackup() {
  const { db } = require('./database');
  function doBackup() {
    try {
      const users = db.listUsers();
      users.forEach(user => {
        const backup = {
          timestamp: new Date().toISOString(),
          products: db.getProducts(user.id),
          orders: db.getOrders(user.id),
          customers: db.getCustomers(user.id),
          settings: db.getSettings(user.id),
        };
        const backupDir = path.join(DATA_DIR, 'backups');
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
        const filename = `backup-${user.id}-${new Date().toISOString().split('T')[0]}.json`;
        fs.writeFileSync(path.join(backupDir, filename), JSON.stringify(backup, null, 2));
        // Keep only last 7 backups per user
        const files = fs.readdirSync(backupDir).filter(f => f.includes(user.id)).sort();
        if (files.length > 7) files.slice(0, files.length - 7).forEach(f => fs.unlinkSync(path.join(backupDir, f)));
        console.log(`[Backup] ✅ ${user.email} — ${filename}`);
      });
    } catch(e) { console.error('[Backup]', e.message); }
  }
  // Run at startup + every 24h
  setTimeout(doBackup, 5000);
  setInterval(doBackup, 24 * 60 * 60 * 1000);
  console.log('[Backup] Daily backup scheduled');
}
startDailyBackup();



module.exports = app;
