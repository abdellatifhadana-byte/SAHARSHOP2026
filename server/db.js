'use strict';
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.warn('[DB] ⚠️  DATABASE_URL is not set — running in no-database mode (all queries return empty results).');
  // Export a stub pool so the app starts without crashing when no DB is configured.
  module.exports = {
    query: async () => ({ rows: [], rowCount: 0 }),
    on: () => {},
  };
} else {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  pool.on('error', (err) => console.error('[DB] Pool error:', err.message));
  module.exports = pool;
}
