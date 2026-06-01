'use strict';
/**
 * Lightweight Supabase sync — uses REST API directly (no SDK dependency).
 * Syncs orders and customers to a `sahar_sync` table in Supabase.
 * Entirely optional: if SUPABASE_URL / SUPABASE_ANON_KEY are not set,
 * all functions are no-ops.
 */
const https = require('https');

const SUPABASE_URL      = () => process.env.SUPABASE_URL      || '';
const SUPABASE_ANON_KEY = () => process.env.SUPABASE_ANON_KEY || '';

function isConfigured() {
  return !!(SUPABASE_URL() && SUPABASE_ANON_KEY());
}

// Generic REST upsert — table must have (user_id TEXT, record_id TEXT, payload JSONB, updated_at TIMESTAMPTZ)
function supabaseRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const url  = new URL(SUPABASE_URL());
    const data = body ? JSON.stringify(body) : null;

    const options = {
      hostname: url.hostname,
      path: `/rest/v1/${path}`,
      method,
      headers: {
        'apikey':        SUPABASE_ANON_KEY(),
        'Authorization': `Bearer ${SUPABASE_ANON_KEY()}`,
        'Content-Type':  'application/json',
        'Prefer':        'resolution=merge-duplicates,return=minimal',
      },
    };
    if (data) options.headers['Content-Length'] = Buffer.byteLength(data);

    const req = https.request(options, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        if (res.statusCode >= 400) reject(new Error(`Supabase ${res.statusCode}: ${d}`));
        else resolve(d ? JSON.parse(d) : null);
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// Ensure the sync table exists (called once at startup)
async function ensureTable() {
  if (!isConfigured()) return;
  // Supabase REST can't run DDL — table must be pre-created via dashboard.
  // SQL to run in Supabase SQL editor once:
  //   CREATE TABLE IF NOT EXISTS sahar_sync (
  //     user_id    TEXT NOT NULL,
  //     record_id  TEXT NOT NULL,
  //     table_name TEXT NOT NULL,
  //     payload    JSONB,
  //     updated_at TIMESTAMPTZ DEFAULT NOW(),
  //     PRIMARY KEY (user_id, table_name, record_id)
  //   );
  //   ALTER TABLE sahar_sync ENABLE ROW LEVEL SECURITY;
  console.log('[Sync] Supabase configured — will sync orders/customers to sahar_sync table');
}

async function upsertRecord(userId, tableName, recordId, payload) {
  if (!isConfigured()) return;
  try {
    await supabaseRequest('POST', 'sahar_sync', {
      user_id:    String(userId),
      table_name: tableName,
      record_id:  String(recordId),
      payload,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn(`[Sync] upsert ${tableName}/${recordId} failed:`, e.message);
  }
}

async function syncOrder(userId, order) {
  await upsertRecord(userId, 'orders', order.id, order);
}

async function syncCustomer(userId, customer) {
  await upsertRecord(userId, 'customers', customer.id, customer);
}

async function syncProduct(userId, product) {
  await upsertRecord(userId, 'products', product.id, product);
}

// Bulk sync — call on startup or after bulk import
async function syncAll(userId, { orders = [], customers = [], products = [] } = {}) {
  if (!isConfigured()) return;
  const jobs = [
    ...orders.map(o   => syncOrder(userId, o)),
    ...customers.map(c => syncCustomer(userId, c)),
    ...products.map(p  => syncProduct(userId, p)),
  ];
  await Promise.allSettled(jobs);
  console.log(`[Sync] Bulk sync: ${orders.length} orders, ${customers.length} customers, ${products.length} products`);
}

module.exports = { isConfigured, ensureTable, syncOrder, syncCustomer, syncProduct, syncAll };
