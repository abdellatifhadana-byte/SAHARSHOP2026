'use strict';
const router = require('express').Router();
const auth   = require('../middleware/auth');
const https  = require('https');
const crypto = require('crypto');
const { db } = require('../database');

router.get('/',  auth, (req, res) => res.json(db.getDeliveryProviders(req.user.id)));

router.post('/', auth, (req, res) => {
  db.upsertDeliveryProvider({ ...req.body, userId: req.user.id });
  db.addLog({ userId: req.user.id, user: 'Manager', action: `Delivery provider saved: ${req.body.name}`, details: '', type: 'delivery', severity: 'info' });
  res.json({ ok: true, providers: db.getDeliveryProviders(req.user.id) });
});

router.delete('/:id', auth, (req, res) => {
  db.deleteDeliveryProvider(req.params.id);
  res.json({ ok: true });
});

// POST /api/delivery/create/:orderId — create real delivery shipment
// Supports: Amana, Jibli, generic webhook, or falls back to simulation
router.post('/create/:orderId', auth, async (req, res) => {
  const order = db.getOrder(req.params.orderId);
  if (!order || order.userId !== req.user.id) return res.status(404).json({ error: 'Order not found' });

  const providers = db.getDeliveryProviders(req.user.id).filter(p => p.enabled);
  if (!providers.length) return res.status(400).json({ error: 'No delivery provider configured' });

  const prov    = providers[0];
  const settings = db.getSettings(req.user.id) || {};
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
      db.updateOrder(order.id, { status: 'processing', trackingNumber: realTracking, deliveryProvider: prov.name });
      db.addLog({ userId: req.user.id, user: 'System', action: `Amana delivery created: ${order.id}`, details: realTracking, type: 'delivery', severity: 'success' });
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
      db.updateOrder(order.id, { status: 'processing', trackingNumber: realTracking, deliveryProvider: prov.name });
      db.addLog({ userId: req.user.id, user: 'System', action: `Jibli delivery created: ${order.id}`, details: realTracking, type: 'delivery', severity: 'success' });
      return res.json({ success: true, tracking: realTracking, provider: prov.name, real: true });
    } catch (e) {
      console.warn('[Delivery/Jibli]', e.message);
    }
  }

  // ── Generic webhook ────────────────────────────────────────────
  if (prov.webhookUrl) {
    try {
      const u = new URL(prov.webhookUrl);
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
      db.updateOrder(order.id, { status: 'processing', trackingNumber: tracking, deliveryProvider: prov.name });
      db.addLog({ userId: req.user.id, user: 'System', action: `Webhook delivery: ${order.id}`, details: tracking, type: 'delivery', severity: 'success' });
      return res.json({ success: true, tracking, provider: prov.name, real: true, via: 'webhook' });
    } catch (e) {
      console.warn('[Delivery/Webhook]', e.message);
    }
  }

  // ── Simulation fallback ────────────────────────────────────────
  db.updateOrder(order.id, { status: 'processing', trackingNumber: tracking, deliveryProvider: prov.name });
  db.addLog({ userId: req.user.id, user: 'System', action: `Delivery simulated: ${order.id}`, details: `${prov.name} — ${tracking}`, type: 'delivery', severity: 'info' });
  res.json({ success: true, tracking, provider: prov.name, real: false, openUrl: prov.addOrderPage || prov.websiteUrl });
});

// Legacy route kept for compatibility
router.post('/simulate/:orderId', auth, (req, res) => {
  req.params.orderId = req.params.orderId;
  const order = db.getOrder(req.params.orderId);
  if (!order || order.userId !== req.user.id) return res.status(404).json({ error: 'Order not found' });
  const providers = db.getDeliveryProviders(req.user.id).filter(p => p.enabled);
  if (!providers.length) return res.status(400).json({ error: 'No delivery provider configured' });
  const prov    = providers[0];
  const tracking = 'TRK-' + crypto.randomBytes(3).toString('hex').toUpperCase();
  db.updateOrder(order.id, { status: 'processing', trackingNumber: tracking, deliveryProvider: prov.name });
  db.addLog({ userId: req.user.id, user: 'System', action: `Delivery created: ${order.id}`, details: `${prov.name} — ${tracking}`, type: 'delivery', severity: 'success' });
  res.json({ success: true, tracking, provider: prov.name, orderUrl: prov.addOrderPage || prov.websiteUrl });
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
