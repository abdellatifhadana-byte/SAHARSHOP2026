'use strict';
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.warn('[DB] ⚠️  DATABASE_URL is not set — running in no-database mode (all queries return empty results).');
  // Stub client returned by stub pool.connect() — supports BEGIN/COMMIT/ROLLBACK
  const stubClient = {
    query:   async () => ({ rows: [], rowCount: 0 }),
    release: () => {},
  };
  // Full stub pool: supports both pool.query() and pool.connect() (for transactions)
  module.exports = {
    query:   async () => ({ rows: [], rowCount: 0 }),
    connect: async () => stubClient,
    on:      () => {},
  };
} else {
  // M-8: تحقّق شهادة TLS في الإنتاج (الافتراضي rejectUnauthorized:true).
  // مرّر CA المزوّد عبر DATABASE_CA (نص) أو PGSSLROOTCERT/DATABASE_CA_PATH (مسار).
  // التعطيل الصريح فقط بـ DB_SSL_INSECURE=1 — لا نقبل MITM بصمت بعد الآن.
  function buildSSL() {
    if (process.env.NODE_ENV !== 'production') return false;
    if (process.env.DB_SSL_INSECURE === '1') return { rejectUnauthorized: false };
    const caPath   = process.env.PGSSLROOTCERT || process.env.DATABASE_CA_PATH;
    const caInline = process.env.DATABASE_CA;
    try {
      if (caInline) return { rejectUnauthorized: true, ca: caInline };
      if (caPath)   return { rejectUnauthorized: true, ca: require('fs').readFileSync(caPath, 'utf8') };
    } catch (e) { console.warn('[DB] CA load failed, using system trust:', e.message); }
    return { rejectUnauthorized: true };
  }
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: buildSSL(),
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  pool.on('error', (err) => console.error('[DB] Pool error:', err.message));
  module.exports = pool;
}
