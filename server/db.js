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
