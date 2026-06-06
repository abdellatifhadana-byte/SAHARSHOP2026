'use strict';
const pool = require('./db');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      price NUMERIC NOT NULL DEFAULT 0,
      cost NUMERIC DEFAULT 0,
      stock INTEGER DEFAULT 0,
      sku TEXT DEFAULT '',
      category TEXT DEFAULT '',
      emoji TEXT DEFAULT '📦',
      images JSONB DEFAULT '[]',
      sizes JSONB DEFAULT '[]',
      colors JSONB DEFAULT '[]',
      color_images JSONB DEFAULT '{}',
      image_url TEXT DEFAULT '',
      is_for_children BOOLEAN DEFAULT FALSE,
      age_range TEXT DEFAULT '',
      size_type TEXT DEFAULT 'adult',
      views INTEGER DEFAULT 0,
      sales INTEGER DEFAULT 0,
      status TEXT DEFAULT 'draft',
      offer_type TEXT DEFAULT 'product',
      duration TEXT DEFAULT '',
      service_area TEXT DEFAULT '',
      portfolio JSONB DEFAULT '[]',
      custom_fields JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      customer_id TEXT DEFAULT '',
      customer_name TEXT DEFAULT '',
      customer_phone TEXT DEFAULT '',
      items JSONB DEFAULT '[]',
      total NUMERIC DEFAULT 0,
      status TEXT DEFAULT 'pending',
      notes TEXT DEFAULT '',
      address TEXT DEFAULT '',
      city TEXT DEFAULT '',
      source TEXT DEFAULT 'manual',
      delivery_provider TEXT DEFAULT '',
      tracking_number TEXT DEFAULT '',
      needs_review BOOLEAN DEFAULT FALSE,
      review_reason TEXT DEFAULT '',
      customer_code TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      city TEXT DEFAULT '',
      address TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      vip BOOLEAN DEFAULT FALSE,
      source TEXT DEFAULT 'manual',
      trust_score INTEGER DEFAULT 80,
      buyer_score INTEGER DEFAULT 50,
      total_spent NUMERIC DEFAULT 0,
      total_orders INTEGER DEFAULT 0,
      last_order_date TEXT DEFAULT '',
      tags JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      customer_id TEXT DEFAULT '',
      customer_name TEXT DEFAULT '',
      customer_phone TEXT DEFAULT '',
      platform TEXT DEFAULT 'whatsapp',
      source TEXT DEFAULT 'manual',
      status TEXT DEFAULT 'open',
      last_message TEXT DEFAULT '',
      unread INTEGER DEFAULT 0,
      messages JSONB DEFAULT '[]',
      priority TEXT DEFAULT 'medium',
      mood TEXT DEFAULT 'neutral',
      pinned BOOLEAN DEFAULT FALSE,
      label TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS delivery_providers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      website_url TEXT DEFAULT '',
      add_order_page TEXT DEFAULT '',
      tracking_url TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      cost NUMERIC DEFAULT 0,
      enabled BOOLEAN DEFAULT TRUE,
      api_type TEXT DEFAULT '',
      api_key TEXT DEFAULT '',
      api_endpoint TEXT DEFAULT '',
      webhook_url TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS broadcasts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      target TEXT DEFAULT 'all',
      sent_to INTEGER DEFAULT 0,
      failed INTEGER DEFAULT 0,
      type TEXT DEFAULT 'custom',
      simulated BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS templates (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      data JSONB NOT NULL DEFAULT '[]',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      type TEXT DEFAULT 'percentage',
      value NUMERIC DEFAULT 0,
      min_order NUMERIC DEFAULT 0,
      max_uses INTEGER DEFAULT 0,
      uses INTEGER DEFAULT 0,
      active BOOLEAN DEFAULT TRUE,
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT DEFAULT 'info',
      message TEXT NOT NULL,
      read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS settings (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      data JSONB NOT NULL DEFAULT '{}',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT,
      "user" TEXT DEFAULT 'System',
      action TEXT,
      details TEXT DEFAULT '',
      type TEXT DEFAULT 'info',
      severity TEXT DEFAULT 'info',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS loyalty_points (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      customer_id TEXT NOT NULL,
      points INTEGER DEFAULT 0,
      total_earned INTEGER DEFAULT 0,
      tier TEXT DEFAULT 'silver',
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, customer_id)
    )`);

    // Performance indexes
    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_products_user_id    ON products(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_products_status      ON products(status)`,
      `CREATE INDEX IF NOT EXISTS idx_products_offer_type  ON products(offer_type)`,
      `CREATE INDEX IF NOT EXISTS idx_orders_user_id       ON orders(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_orders_status        ON orders(status)`,
      `CREATE INDEX IF NOT EXISTS idx_orders_created       ON orders(created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_customers_user_id    ON customers(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_customers_phone      ON customers(phone)`,
      `CREATE INDEX IF NOT EXISTS idx_convos_user_id       ON conversations(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_notifs_user_id       ON notifications(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_logs_user_id         ON audit_logs(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_delivery_user_id     ON delivery_providers(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_loyalty_user_id      ON loyalty_points(user_id)`,
    ];
    for (const sql of indexes) await client.query(sql);

    // OTP tokens table (Fix #3)
    await client.query(`CREATE TABLE IF NOT EXISTS otp_tokens (
      id BIGSERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_tokens(email)`);

    // Refresh tokens table (Fix #12)
    await client.query(`CREATE TABLE IF NOT EXISTS refresh_tokens (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      revoked BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_tokens(user_id)`);

    // Fix conversation.status default (Fix #13)
    await client.query(`ALTER TABLE conversations ALTER COLUMN status SET DEFAULT 'active'`);
    await client.query(`UPDATE conversations SET status='active' WHERE status='open'`);

    // FK fixes: loyalty_points.customer_id → customers(id) ON DELETE CASCADE
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'loyalty_points_customer_id_fkey'
        ) THEN
          ALTER TABLE loyalty_points
            ADD CONSTRAINT loyalty_points_customer_id_fkey
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
        END IF;
      END $$
    `).catch(() => {});

    // FK fix: audit_logs.user_id → users(id) ON DELETE SET NULL
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'audit_logs_user_id_fkey'
        ) THEN
          ALTER TABLE audit_logs
            ADD CONSTRAINT audit_logs_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
        END IF;
      END $$
    `).catch(() => {});

    await client.query('COMMIT');
    console.log('[DB] ✅ Migrations complete');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[DB] ❌ Migration failed — rolled back:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = migrate;
