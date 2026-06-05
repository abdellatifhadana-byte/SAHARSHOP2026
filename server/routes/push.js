'use strict';
const router  = require('express').Router();
const auth    = require('../middleware/auth');
const { db }  = require('../database');
const webpush = require('web-push');
const path    = require('path');
const fs      = require('fs');

// VAPID keys — generated once, stored in data/vapid.json
const VAPID_FILE = path.join(__dirname, '..', 'data', 'vapid.json');

function getVapidKeys() {
  if (fs.existsSync(VAPID_FILE)) {
    try { return JSON.parse(fs.readFileSync(VAPID_FILE, 'utf8')); } catch {}
  }
  const keys = webpush.generateVAPIDKeys();
  fs.mkdirSync(path.dirname(VAPID_FILE), { recursive: true });
  fs.writeFileSync(VAPID_FILE, JSON.stringify(keys));
  console.log('[Push] Generated new VAPID keys');
  return keys;
}

const vapid = getVapidKeys();
const CONTACT = process.env.ADMIN_EMAIL ? `mailto:${process.env.ADMIN_EMAIL}` : 'mailto:admin@sahar.shop';

webpush.setVapidDetails(CONTACT, vapid.publicKey, vapid.privateKey);
console.log(`[Push] VAPID public key: ${vapid.publicKey.slice(0, 20)}...`);

// GET /api/push/vapid-key  — returns the public key for the frontend
router.get('/vapid-key', (req, res) => {
  res.json({ publicKey: vapid.publicKey });
});

// POST /api/push/subscribe  — saves user's push subscription
router.post('/subscribe', auth, async (req, res) => {
  const { subscription } = req.body;
  if (!subscription?.endpoint) return res.status(400).json({ error: 'Invalid subscription object' });
  try {
    const settings = await db.getSettings(req.user.id) || {};
    const subs = settings.pushSubscriptions || [];
    // Avoid duplicates (same endpoint)
    const already = subs.some(s => s.endpoint === subscription.endpoint);
    if (!already) subs.push(subscription);
    await db.saveSettings(req.user.id, { ...settings, pushSubscriptions: subs });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/push/unsubscribe  — removes a push subscription
router.post('/unsubscribe', auth, async (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) return res.status(400).json({ error: 'endpoint required' });
  try {
    const settings = await db.getSettings(req.user.id) || {};
    const subs = (settings.pushSubscriptions || []).filter(s => s.endpoint !== endpoint);
    await db.saveSettings(req.user.id, { ...settings, pushSubscriptions: subs });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Helper — send a push notification to all subscriptions of a user
async function notifyUser(userId, title, body, data = {}) {
  const settings = await db.getSettings(userId) || {};
  const subs = settings.pushSubscriptions || [];
  if (!subs.length) return;

  const payload = JSON.stringify({ title, body, ...data });
  const dead = [];

  await Promise.allSettled(subs.map(async (sub, i) => {
    try {
      await webpush.sendNotification(sub, payload);
    } catch (e) {
      if (e.statusCode === 410 || e.statusCode === 404) dead.push(i);
    }
  }));

  // Clean up dead subscriptions (unsubscribed browsers)
  if (dead.length) {
    const alive = subs.filter((_, i) => !dead.includes(i));
    await db.saveSettings(userId, { ...settings, pushSubscriptions: alive });
  }
}

module.exports = router;
module.exports.notifyUser = notifyUser;
