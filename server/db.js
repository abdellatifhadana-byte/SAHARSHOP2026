'use strict';
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('[DB] ❌ DATABASE_URL is not set. PostgreSQL will not connect.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => console.error('[DB] Pool error:', err.message));

module.exports = pool;
