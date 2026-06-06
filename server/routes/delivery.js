'use strict';
const router = require('express').Router();
const auth   = require('../middleware/auth');
const https  = require('https');
const crypto = require('crypto');
const { db } = require('../database');

router.get('/', auth, async (req, res) => {
  try { res.json(await db.getDeliveryProviders(req.user.id)); }
  catch (e) { console.error('[delivery]', e.message); res.status(500).json({ error: 'Server error' }); }
});

router.post('/', auth, async (req, res) => {
  try {
    await db.upsertDeliveryProvider({ ...req.body, userId: req.user.id });
    await db.addLog({ userId: req.user.id, user: 'Manager', action: `Delivery provider saved: ${req.body.name}`, details: '', type: 'delivery', severity: 'info' });
    res.json({ ok: true, providers: await db.getDeliveryProviders(req.user.id) });
  } catch (e) { console.error('[delivery]', e.message); res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db.deleteDeliveryProvider(req.params.id, req.user.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// POST /api/delivery/create/:orderId — create real delivery shipment
// Supports: Amana, Jibli, generic webhook, or falls back to simulation
router.post('/create/:orderId', auth, async (req, res) => {
  try {
    const order = await db.getOrder(req.params.orderId);
    if (!order || order.userId !== req.user.id) return res.status(404).json({ error: 'Order not found' });

    const providers = (await db.getDeliveryProviders(req.user.id)).filter(p => p.enabled);
    if (!providers.length) return res.status(400).json({ error: 'No delivery provider configured' });

    const prov    = providers[0];
    const settings = await db.getSettings(req.user.id) || {};
    const tracking = 'TRK-' + crypto.randomBytes(3).toString('hex').toUpperCase();

    // ── Amana API ──────────────────────────────────────────────────
    if (prov.apiType === 'amana' && prov.apiKey) {
      try {
        const payload = JSON.stringify({
          apiKey: prov.apiKey,
          reference: order.id,
          receiverName: order.customerName,
          receiverPhone: order.customerPhone,
          receiverAddress: `${order.address}, ${order.city}`,
          description: (order.items || []).map(i => `${i.productName} x${i.quantity}`).join(', '),
          cod: order.total,
          weight: 0.5,
        });
        const result = await _post(prov.apiEndpoint || 'api.amana.ma', '/api/v1/parcels', {
          'Authorization': `Bearer ${prov.apiKey}`,
        }, payload);
        const data = JSON.parse(result);
        const realTracking = data.trackingNumber || data.tracking_number || tracking;
        await db.updateOrder(order.id, { status: 'processing', trackingNumber: realTracking, deliveryProvider: prov.name });
        await db.addLog({ userId: req.user.id, user: 'System', action: `Amana delivery created: ${order.id}`, details: realTracking, type: 'delivery', severity: 'success' });
        return res.json({ success: true, tracking: realTracking, provider: prov.name, real: true });
      } catch (e) {
        console.warn('[Delivery/Amana]', e.message);
      }
    }

    // ── Jibli API ──────────────────────────────────────────────────
    if (prov.apiType === 'jibli' && prov.apiKey) {
      try {
        const payload = JSON.stringify({
          token: prov.apiKey,
          order_ref: order.id,
          customer_name: order.customerName,
          customer_phone: order.customerPhone,
          city: order.city,
          address: order.address,
          price: order.total,
          products: (order.items || []).map(i => ({ name: i.productName, qty: i.quantity })),
        });
        const result = await _post(prov.apiEndpoint || 'api.jibli.ma', '/v1/orders/create', {
          'X-API-Key': prov.apiKey,
        }, payload);
        const data = JSON.parse(result);
        const realTracking = data.tracking || data.code || tracking;
        await db.updateOrder(order.id, { status: 'processing', trackingNumber: realTracking, deliveryProvider: prov.name });
        await db.addLog({ userId: req.user.id, user: 'System', action: `Jibli delivery created: ${order.id}`, details: realTracking, type: 'delivery', severity: 'success' });
        return res.json({ success: true, tracking: realTracking, provider: prov.name, real: true });
      } catch (e) {
        console.warn('[Delivery/Jibli]', e.message);
      }
    }

    // ── Generic webhook ────────────────────────────────────────────
    if (prov.webhookUrl) {
      try {
        const u = new URL(prov.webhookUrl);
        const host = u.hostname;
        const BLOCKED = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|::1|0\.0\.0\.0|metadata\.google|169\.254\.169\.254)/i;
        if (u.protocol !== 'https:' || BLOCKED.test(host)) {
          console.warn('[Delivery/Webhook] Blocked SSRF attempt to:', prov.webhookUrl);
          throw new Error('Blocked: internal or non-HTTPS URL');
        }
        const payload = JSON.stringify({
          event: 'order.created',
          orderId: order.id,
          tracking,
          customer: { name: order.customerName, phone: order.customerPhone, city: order.city, address: order.address },
          items: order.items,
          total: order.total,
          currency: settings.brand?.currency || 'MAD',
        });
        await _post(u.hostname, u.pathname, {
          'X-Webhook-Secret': prov.apiKey || '',
        }, payload);
        await db.updateOrder(order.id, { status: 'processing', trackingNumber: tracking, deliveryProvider: prov.name });
        await db.addLog({ userId: req.user.id, user: 'System', action: `Webhook delivery: ${order.id}`, details: tracking, type: 'delivery', severity: 'success' });
        return res.json({ success: true, tracking, provider: prov.name, real: true, via: 'webhook' });
      } catch (e) {
        console.warn('[Delivery/Webhook]', e.message);
      }
    }

    // ── Simulation fallback ────────────────────────────────────────
    await db.updateOrder(order.id, { status: 'processing', trackingNumber: tracking, deliveryProvider: prov.name });
    await db.addLog({ userId: req.user.id, user: 'System', action: `Delivery simulated: ${order.id}`, details: `${prov.name} — ${tracking}`, type: 'delivery', severity: 'info' });
    res.json({ success: true, tracking, provider: prov.name, real: false, openUrl: prov.addOrderPage || prov.websiteUrl });
  } catch (e) { console.error('[delivery/create]', e.message); res.status(500).json({ error: 'Server error' }); }
});

// Legacy route kept for compatibility
router.post('/simulate/:orderId', auth, async (req, res) => {
  try {
    const order = await db.getOrder(req.params.orderId);
    if (!order || order.userId !== req.user.id) return res.status(404).json({ error: 'Order not found' });
    const providers = (await db.getDeliveryProviders(req.user.id)).filter(p => p.enabled);
    if (!providers.length) return res.status(400).json({ error: 'No delivery provider configured' });
    const prov    = providers[0];
    const tracking = 'TRK-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    await db.updateOrder(order.id, { status: 'processing', trackingNumber: tracking, deliveryProvider: prov.name });
    await db.addLog({ userId: req.user.id, user: 'System', action: `Delivery created: ${order.id}`, details: `${prov.name} — ${tracking}`, type: 'delivery', severity: 'success' });
    res.json({ success: true, tracking, provider: prov.name, orderUrl: prov.addOrderPage || prov.websiteUrl });
  } catch (e) { console.error('[delivery/simulate]', e.message); res.status(500).json({ error: 'Server error' }); }
});

// POST /api/delivery/test-connection — server-side URL reachability test (no CORS issues)
router.post('/test-connection', auth, async (req, res) => {
  const { url } = req.body || {};
  if (!url || typeof url !== 'string') return res.json({ ok: false, error: 'رابط غير صالح' });
  let parsed;
  try { parsed = new URL(url); } catch { return res.json({ ok: false, error: 'صيغة الرابط غير صحيحة' }); }
  if (!['http:', 'https:'].includes(parsed.protocol)) return res.json({ ok: false, error: 'البروتوكول غير مدعوم' });
  const BLOCKED_TEST = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|::1|0\.0\.0\.0|metadata\.google)/i;
  if (BLOCKED_TEST.test(parsed.hostname)) return res.json({ ok: false, error: 'عنوان IP داخلي غير مسموح به' });
  const start = Date.now();
  try {
    const mod = parsed.protocol === 'https:' ? require('https') : require('http');
    await new Promise((resolve, reject) => {
      const r = mod.request(
        { hostname: parsed.hostname, port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80), path: parsed.pathname || '/', method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } },
        resolve
      );
      r.on('error', reject);
      r.setTimeout(7000, () => { r.destroy(); reject(new Error('Timeout')); });
      r.end();
    });
    const ms = Date.now() - start;
    res.json({ ok: true, info: `${ms}ms — ${parsed.hostname}` });
  } catch (e) {
    res.json({ ok: false, error: e.message || 'لا يمكن الوصول للموقع' });
  }
});

function _post(hostname, path, extraHeaders, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), ...extraHeaders },
    };
    const r = https.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    });
    r.on('error', reject);
    r.setTimeout(10000, () => { r.destroy(); reject(new Error('Timeout')); });
    r.write(body);
    r.end();
  });
}

module.exports = router;
