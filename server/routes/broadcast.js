'use strict';
const router  = require('express').Router();
const auth    = require('../middleware/auth');
const https   = require('https');
const { db }  = require('../database');

router.get('/history', auth, async (req, res) => {
  try { res.json(await db.getBroadcasts(req.user.id)); }
  catch (e) { console.error('[broadcast]', e.message); res.status(500).json({ error: 'Server error' }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { message, target = 'all', type = 'custom', productId, discountPct } = req.body;
    if (!message && type === 'custom') return res.status(400).json({ error: 'Message is required' });

    const settings  = await db.getSettings(req.user.id) || {};
    const customers = await db.getCustomers(req.user.id);

    let targets = customers;
    if (target === 'vip')    targets = customers.filter(c => c.vip);
    if (target === 'repeat') targets = customers.filter(c => c.totalOrders >= 3);
    if (target === 'new')    targets = customers.filter(c => c.totalOrders === 0);

    const products = await db.getProducts(req.user.id);
    const finalMsg = message || buildMessage(type, productId, discountPct, products, settings);
    if (!finalMsg) return res.status(400).json({ error: 'Could not build message' });

    const waToken   = settings.social?.whatsapp?.accessToken;
    const waPhoneId = settings.social?.whatsapp?.pageId;
    const isReal    = !!(waToken && waPhoneId && settings.social?.whatsapp?.connected);
    let sent = 0, failed = 0;

    if (isReal) {
      for (const customer of targets) {
        if (!customer.phone) { failed++; continue; }
        try {
          const body = JSON.stringify({ messaging_product: 'whatsapp', to: customer.phone.replace(/\s/g,''), type: 'text', text: { body: finalMsg } });
          const ok = await new Promise(resolve => {
            const r = https.request({ hostname: 'graph.facebook.com', path: `/v19.0/${waPhoneId}/messages`, method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${waToken}`, 'Content-Length': Buffer.byteLength(body) } }, res => resolve(res.statusCode < 300));
            r.on('error', () => resolve(false)); r.write(body); r.end();
          });
          if (ok) sent++; else failed++;
        } catch { failed++; }
      }
    } else {
      sent = targets.length; // simulate
    }

    await db.saveBroadcast({ userId: req.user.id, message: finalMsg, target, sentTo: sent, failed, type, simulated: !isReal });
    await db.addLog({ userId: req.user.id, user: 'Manager', action: isReal ? `Broadcast sent` : `Broadcast simulated`, details: `${sent}/${targets.length} customers${isReal ? '' : ' (simulated)'}`, type: 'notification', severity: 'info' });
    // M-6: لا نُبلّغ "تم الإرسال" لرسائل لم تُرسَل فعلياً — نوضّح وضع المحاكاة
    await db.addNotification({
      userId: req.user.id,
      type: isReal ? 'success' : 'warning',
      message: isReal
        ? `📢 تم الإرسال فعلياً لـ ${sent} زبون`
        : `📢 محاكاة فقط: جُهّزت رسالة لـ ${sent} زبون لكنها لم تُرسَل — اربط WhatsApp API للإرسال الحقيقي`,
    });

    res.json({ success: true, sent, failed, total: targets.length, simulated: !isReal });
  } catch (e) { console.error('[broadcast]', e.message); res.status(500).json({ error: 'Server error' }); }
});

function buildMessage(type, productId, discountPct, products, settings) {
  const cur = settings.brand?.currency || 'MAD';
  const p = products.find(x => x.id === productId);
  if (!p) return null;
  if (type === 'new_product')
    return `🎉 منتج جديد!\n\n${p.emoji||'📦'} ${p.name}\n💰 ${p.price} ${cur}\n\nاطلب الآن 🚚`;
  if (type === 'discount') {
    const d = discountPct || 15;
    const newPrice = Math.round(p.price * (1 - d/100));
    return `🔥 عرض خاص!\n\n${p.emoji||'📦'} ${p.name}\n~~${p.price}~~ ← ${newPrice} ${cur} (خصم ${d}%)\n\nلفترة محدودة! ⏰`;
  }
  return null;
}

module.exports = router;
