'use strict';
const router = require('express').Router();
const auth   = require('../middleware/auth');
const { db } = require('../database');

router.get('/', auth, (req, res) => {
  const settings = db.getSettings(req.user.id);
  res.json(settings || {});
});

router.put('/', auth, (req, res) => {
  const existing = db.getSettings(req.user.id) || {};
  const merged = deepMerge(existing, req.body);
  db.saveSettings(req.user.id, merged);
  db.addLog({ userId: req.user.id, user: 'Manager', action: 'Settings updated', details: Object.keys(req.body).join(', '), type: 'settings', severity: 'info' });
  res.json(merged);
});

router.get('/logs', auth, (req, res) => {
  res.json(db.getLogs(req.user.id));
});

router.get('/notifications', auth, (req, res) => {
  res.json(db.getNotifications(req.user.id));
});

router.post('/notifications/read', auth, (req, res) => {
  db.markAllRead(req.user.id);
  res.json({ ok: true });
});

router.delete('/notifications', auth, (req, res) => {
  db.clearNotifications(req.user.id);
  res.json({ ok: true });
});

router.get('/templates', auth, (req, res) => {
  res.json(db.getTemplates(req.user.id));
});

router.put('/templates', auth, (req, res) => {
  db.saveTemplates(req.user.id, req.body);
  res.json({ ok: true });
});

// Export data
router.get('/export', auth, (req, res) => {
  const uid = req.user.id;
  const data = {
    exportedAt: new Date().toISOString(),
    products: db.getProducts(uid),
    orders: db.getOrders(uid),
    customers: db.getCustomers(uid),
    settings: db.getSettings(uid),
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="commerce-export.json"');
  res.json(data);
});

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && target[key] && typeof target[key] === 'object') {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

// QR Code for catalog
router.get('/qr', auth, (req, res) => {
  const settings = db.getSettings(req.user.id) || {};
  const baseUrl = process.env.PRODUCTION_URL || `http://localhost:${process.env.PORT||3001}`;
  const catalogUrl = `${baseUrl}/store/${req.user.id}`;
  // Return URL for frontend to render QR (using existing QRCode component)
  res.json({ url: catalogUrl, userId: req.user.id });
});

// POST /api/settings/verify-connection — proxy for connection verification (avoid CORS)
router.post('/verify-connection', auth, async (req, res) => {
  const { service, token, pageId, apiKey } = req.body;
  const https = require('https');

  function httpsGet(hostname, path, headers) {
    return new Promise((resolve, reject) => {
      const req2 = https.request({ hostname, path, headers, method: 'GET' }, r => {
        let data = ''; r.on('data', c => data += c); r.on('end', () => resolve({ status: r.statusCode, body: data }));
      });
      req2.on('error', reject); req2.setTimeout(8000, () => { req2.destroy(); reject(new Error('Timeout')); });
      req2.end();
    });
  }

  try {
    if (service === 'openai') {
      const r = await httpsGet('api.openai.com', '/v1/models', { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' });
      const data = JSON.parse(r.body);
      if (r.status === 200 && data.data) return res.json({ ok: true, info: `${data.data.length} models available` });
      return res.json({ ok: false, error: data.error?.message || 'Invalid key' });
    }

    if (service === 'gemini') {
      const r = await httpsGet('generativelanguage.googleapis.com', `/v1/models?key=${apiKey}`, { 'Content-Type': 'application/json' });
      const data = JSON.parse(r.body);
      if (r.status === 200 && data.models) return res.json({ ok: true, info: `${data.models.length} models` });
      return res.json({ ok: false, error: data.error?.message || 'Invalid key' });
    }

    if (['facebook', 'instagram', 'whatsapp', 'messenger'].includes(service)) {
      const r = await httpsGet('graph.facebook.com', `/v19.0/me?access_token=${token}`, { 'Content-Type': 'application/json' });
      const data = JSON.parse(r.body);
      if (!data.error && data.id) {
        // If pageId given, verify page access
        if (pageId) {
          const r2 = await httpsGet('graph.facebook.com', `/v19.0/${pageId}?access_token=${token}&fields=name,id`, {});
          const d2 = JSON.parse(r2.body);
          if (!d2.error) return res.json({ ok: true, name: d2.name || data.name, id: d2.id });
        }
        return res.json({ ok: true, name: data.name, id: data.id });
      }
      return res.json({ ok: false, error: data.error?.message || 'Invalid token' });
    }

    if (service === 'cloudinary') {
      const { cloudName, apiKey: cldKey, apiSecret } = req.body;
      if (!cloudName || !cldKey || !apiSecret) return res.json({ ok: false, error: 'Missing credentials' });
      const auth64 = Buffer.from(`${cldKey}:${apiSecret}`).toString('base64');
      const r = await httpsGet('api.cloudinary.com', `/v1_1/${cloudName}/usage`, { 'Authorization': `Basic ${auth64}` });
      const data = JSON.parse(r.body);
      if (r.status === 200 && !data.error) return res.json({ ok: true, info: data.credits ? `${data.credits.usage} credits` : 'متصل' });
      return res.json({ ok: false, error: data.error?.message || 'Invalid credentials' });
    }

    res.json({ ok: false, error: 'Unknown service' });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

// POST /api/settings/verify-all — batch test all configured connections
router.post('/verify-all', auth, async (req, res) => {
  const settings = db.getSettings(req.user.id) || {};
  const results  = {};
  const https2   = require('https');

  function httpsGet2(hostname, path, headers) {
    return new Promise((resolve) => {
      const r = https2.request({ hostname, path, headers: { 'Content-Type': 'application/json', ...headers }, method: 'GET' }, resp => {
        let data = ''; resp.on('data', c => data += c); resp.on('end', () => resolve({ status: resp.statusCode, body: data }));
      });
      r.on('error', () => resolve({ status: 0, body: '{}' }));
      r.setTimeout(7000, () => { r.destroy(); resolve({ status: 0, body: '{}' }); });
      r.end();
    });
  }

  const checks = [];

  // OpenAI
  if (settings.ai?.apiKey) {
    checks.push(httpsGet2('api.openai.com', '/v1/models', { 'Authorization': `Bearer ${settings.ai.apiKey}` }).then(r => {
      try { const d = JSON.parse(r.body); results.openai = { ok: r.status === 200 && !!d.data, info: d.data ? `${d.data.length} نموذج` : d.error?.message }; } catch { results.openai = { ok: false }; }
    }));
  }

  // Gemini
  if (settings.ai?.geminiKey) {
    checks.push(httpsGet2('generativelanguage.googleapis.com', `/v1/models?key=${settings.ai.geminiKey}`, {}).then(r => {
      try { const d = JSON.parse(r.body); results.gemini = { ok: r.status === 200 && !!d.models, info: d.models ? `${d.models.length} نموذج` : d.error?.message }; } catch { results.gemini = { ok: false }; }
    }));
  }

  // Meta platforms (WhatsApp, Facebook, Instagram)
  for (const platform of ['whatsapp', 'facebook', 'instagram']) {
    const s = settings.social?.[platform];
    if (s?.accessToken) {
      checks.push(httpsGet2('graph.facebook.com', `/v19.0/me?access_token=${s.accessToken}`, {}).then(r => {
        try { const d = JSON.parse(r.body); results[platform] = { ok: !d.error && !!d.id, info: d.name || d.error?.message }; } catch { results[platform] = { ok: false }; }
      }));
    }
  }

  // Supabase
  if (settings.supabaseUrl && settings.supabaseKey) {
    try {
      const u = new URL(settings.supabaseUrl);
      checks.push(httpsGet2(u.hostname, '/rest/v1/', { 'apikey': settings.supabaseKey }).then(r => {
        results.supabase = { ok: r.status < 400 };
      }));
    } catch {}
  }

  // Cloudinary
  if (settings.cloudinaryCloudName && settings.cloudinaryApiKey && settings.cloudinaryApiSecret) {
    const auth64 = Buffer.from(`${settings.cloudinaryApiKey}:${settings.cloudinaryApiSecret}`).toString('base64');
    checks.push(httpsGet2('api.cloudinary.com', `/v1_1/${settings.cloudinaryCloudName}/usage`, { 'Authorization': `Basic ${auth64}` }).then(r => {
      try { const d = JSON.parse(r.body); results.cloudinary = { ok: r.status === 200 && !d.error, info: d.credits ? `${d.credits.usage} credits` : undefined }; } catch { results.cloudinary = { ok: false }; }
    }));
  }

  await Promise.all(checks);
  res.json(results);
});

// GET /api/settings/backups — list available backups
router.get('/backups', auth, (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const backupDir = path.join(__dirname, '../data/backups');
  if (!fs.existsSync(backupDir)) return res.json({ backups: [] });
  const files = fs.readdirSync(backupDir)
    .filter(f => f.includes(req.user.id))
    .sort().reverse().slice(0, 10)
    .map(f => ({
      filename: f,
      date: f.split(req.user.id + '-')[1]?.replace('.json','') || f,
      size: fs.statSync(path.join(backupDir, f)).size,
    }));
  res.json({ backups: files });
});

// GET /api/settings/backups/:filename — download a specific backup
router.get('/backups/:filename', auth, (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const filename = path.basename(req.params.filename);
  if (!filename.includes(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
  const filepath = path.join(__dirname, '../data/backups', filename);
  if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'Backup not found' });
  res.download(filepath);
});

module.exports = router;
