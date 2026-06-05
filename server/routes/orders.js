'use strict';
const { validateOrder, sanitizeBody } = require('../middleware/validate');
const router = require('express').Router();
const auth   = require('../middleware/auth');
const crypto = require('crypto');
const { db } = require('../database');
const sync   = require('../sync');
let pushNotify;
try { pushNotify = require('../routes/push').notifyUser; } catch { pushNotify = () => Promise.resolve(); }

router.get('/', auth, async (req, res) => {
  try { res.json(await db.getOrders(req.user.id)); }
  catch (e) { console.error('[orders]', e.message); res.status(500).json({ error: 'Server error' }); }
});

router.post('/', auth, sanitizeBody, async (req, res) => {
  try {
    const order = await db.createOrder({ ...req.body, userId: req.user.id, status: 'pending' });
    await db.addLog({ userId: req.user.id, user: 'AI', action: `New order: ${order.id}`, details: order.customerName, type: 'order', severity: 'info' });
    await db.addNotification({ userId: req.user.id, type: 'info', message: `🛒 طلب جديد من ${order.customerName}` });
    sync.syncOrder(req.user.id, order).catch(() => {});
    const settings = await db.getSettings(req.user.id) || {};
    pushNotify(req.user.id, '🛒 طلب جديد!', `${order.customerName} — ${order.total || 0} ${settings.brand?.currency || 'MAD'}`, { url: '/orders' }).catch(() => {});
    req.app.get('broadcast')?.(req.user.id, { event: 'order_created', data: order });
    res.status(201).json(order);
  } catch (e) { console.error('[orders]', e.message); res.status(500).json({ error: 'Server error' }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const o = await db.getOrder(req.params.id);
    if (!o || o.userId !== req.user.id) return res.status(404).json({ error: 'Not found' });
    res.json(o);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const o = await db.getOrder(req.params.id);
    if (!o || o.userId !== req.user.id) return res.status(404).json({ error: 'Not found' });
    res.json(await db.updateOrder(o.id, req.body));
  } catch (e) { console.error('[orders]', e.message); res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id/approve', auth, async (req, res) => {
  try {
    const order = await db.getOrder(req.params.id);
    if (!order || order.userId !== req.user.id) return res.status(404).json({ error: 'Not found' });

    await db.updateOrder(order.id, { status: 'approved' });

    // Update customer stats
    if (order.customerId) {
      const customer = await db.getCustomer(order.customerId);
      if (customer) await db.updateCustomer(order.customerId, {
        totalOrders: (customer.totalOrders || 0) + 1,
        totalSpent: (customer.totalSpent || 0) + (order.total || 0),
        lastOrderDate: new Date().toISOString().split('T')[0],
      });
    }

    // Reduce stock
    for (const item of (order.items || [])) {
      if (!item.productId) continue;
      const p = await db.getProduct(item.productId);
      if (p) await db.updateProduct(p.id, {
        stock: Math.max(0, (p.stock || 0) - (item.quantity || 1)),
        sales: (p.sales || 0) + (item.quantity || 1),
      });
    }

    // Auto-delivery
    const settings = await db.getSettings(req.user.id) || {};
    const providers = (await db.getDeliveryProviders(req.user.id)).filter(p => p.enabled);
    if (settings.delivery?.autoSendOnApproval && providers.length > 0) {
      const prov = providers[0];
      const tracking = `TRK-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      await db.updateOrder(order.id, { status: 'processing', deliveryProvider: prov.name, trackingNumber: tracking });
      await db.addLog({ userId: req.user.id, user: 'System', action: `Sent to delivery: ${order.id}`, details: `${prov.name} — ${tracking}`, type: 'delivery', severity: 'info' });
    }

    // Add loyalty points to customer
    if (order.customerId && order.total > 0) {
      try { await db.addLoyaltyPoints(req.user.id, order.customerId, order.total); } catch(e) {}
    }
    await db.addLog({ userId: req.user.id, user: 'Manager', action: `Approved order: ${order.id}`, details: order.customerName, type: 'order', severity: 'success' });
    await db.addNotification({ userId: req.user.id, type: 'success', message: `✅ تم تأكيد طلب ${order.customerName}` });

    const approveSettings = settings;
    const waToken = approveSettings.social?.whatsapp?.accessToken;
    const waPhoneId = approveSettings.social?.whatsapp?.pageId;
    const refreshedOrder = await db.getOrder(order.id);
    const cur2 = approveSettings.brand?.currency || 'MAD';
    const brandName2 = approveSettings.brand?.name || 'المتجر';
    const itemsList2 = (refreshedOrder?.items||[]).map((i,idx) =>
      `${idx+1}. ${i.productName}${i.size?' ('+i.size+')':''}${i.color?' — '+i.color:''} × ${i.quantity||1} = ${((i.price||0)*(i.quantity||1)).toLocaleString()} ${cur2}`
    ).join('\n');

    const invoice = [
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `🛍️ *${brandName2}*`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `✅ *تم تأكيد طلبك!*`,
      ``,
      `👤 *الزبون:* ${refreshedOrder?.customerName}`,
      `📱 *الهاتف:* ${refreshedOrder?.customerPhone}`,
      `📍 *المدينة:* ${refreshedOrder?.city||'—'}`,
      `🏠 *العنوان:* ${refreshedOrder?.address||'—'}`,
      ``,
      `📦 *المنتجات:*`,
      itemsList2,
      ``,
      `💰 *المجموع:* ${(refreshedOrder?.total||0).toLocaleString()} ${cur2}`,
      `🔖 *رقم الطلب:* ${refreshedOrder?.id}`,
      `🔑 *كود التتبع:* *${refreshedOrder?.customerCode||'—'}*`,
      ``,
      `📌 _احتفظ بكود التتبع لمتابعة طلبك_`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `🚚 سيتم الشحن خلال 24-48 ساعة`,
      `شكراً لثقتك! 🙏`,
    ].join('\n');

    await db.updateOrder(order.id, { notes: (refreshedOrder?.notes||'') + '\n[INVOICE]' + invoice });

    if (waToken && waPhoneId && refreshedOrder?.customerPhone) {
      try {
        const body2 = JSON.stringify({ messaging_product:'whatsapp', to:refreshedOrder.customerPhone.replace(/\s/g,''), type:'text', text:{ body:invoice } });
        const https2 = require('https');
        const r2 = https2.request({ hostname:'graph.facebook.com', path:'/v19.0/' + waPhoneId + '/messages', method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + waToken, 'Content-Length':Buffer.byteLength(body2) } }, res=>res.resume());
        r2.on('error',()=>{}); r2.write(body2); r2.end();
      } catch {}
    } else {
      const waPhone = (refreshedOrder?.customerPhone||'').replace(/\D/g,'');
      if (waPhone) {
        await db.updateOrder(order.id, { notes: (refreshedOrder?.notes||'') + '\n[WA_URL]https://wa.me/' + waPhone + '?text=' + encodeURIComponent(invoice) });
      }
    }
    const finalOrder = await db.getOrder(order.id);
    sync.syncOrder(req.user.id, finalOrder).catch(() => {});
    req.app.get('broadcast')?.(req.user.id, { event: 'order_updated', data: finalOrder });
    res.json(finalOrder);
  } catch (e) { console.error('[orders/approve]', e.message); res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id/reject', auth, async (req, res) => {
  try {
    const o = await db.getOrder(req.params.id);
    if (!o || o.userId !== req.user.id) return res.status(404).json({ error: 'Not found' });
    await db.updateOrder(o.id, { status: 'cancelled' });
    await db.addLog({ userId: req.user.id, user: 'Manager', action: `Rejected order: ${o.id}`, details: req.body.reason || '', type: 'order', severity: 'error' });
    const updated = await db.getOrder(o.id);
    req.app.get('broadcast')?.(req.user.id, { event: 'order_updated', data: updated });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id/ship', auth, async (req, res) => {
  try {
    const o = await db.getOrder(req.params.id);
    if (!o || o.userId !== req.user.id) return res.status(404).json({ error: 'Not found' });
    const tracking = req.body.trackingNumber || `TRK-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const shipSettings = await db.getSettings(req.user.id) || {};
    const prov = req.body.provider || shipSettings.delivery?.defaultProvider || 'Amana';
    await db.updateOrder(o.id, { status: 'shipped', trackingNumber: tracking, deliveryProvider: prov });
    await db.addLog({ userId: req.user.id, user: 'Manager', action: `Shipped: ${o.id}`, details: tracking, type: 'delivery', severity: 'success' });
    await db.addNotification({ userId: req.user.id, type: 'success', message: `🚚 Shipped — ${tracking}` });
    const shipWaToken = shipSettings.social?.whatsapp?.accessToken;
    const shipWaPhoneId = shipSettings.social?.whatsapp?.pageId;
    const shippedOrder = await db.getOrder(o.id);
    if (shipWaToken && shipWaPhoneId && shippedOrder?.customerPhone) {
      try {
        const trackUrl = shipSettings.delivery?.trackingUrlTemplate ? shipSettings.delivery.trackingUrlTemplate.replace('{tracking}', tracking) : '';
        const shipMsg = `مرحباً ${shippedOrder.customerName}! 👋\n\n🚚 طلبك في الطريق إليك!\n\n📦 رقم التتبع: ${tracking}\n🏢 شركة التوصيل: ${prov}\n⏱️ متوقع الوصول خلال: 24-48 ساعة\n${trackUrl ? `\n🔗 تتبع طلبك: ${trackUrl}` : ''}\n\nشكراً لثقتك! 🙏`;
        const shipBody = JSON.stringify({ messaging_product:'whatsapp', to:shippedOrder.customerPhone.replace(/\s/g,''), type:'text', text:{ body:shipMsg } });
        const https3 = require('https');
        const r3 = https3.request({ hostname:'graph.facebook.com', path:`/v19.0/${shipWaPhoneId}/messages`, method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${shipWaToken}`, 'Content-Length':Buffer.byteLength(shipBody) } }, res=>res.resume());
        r3.on('error',()=>{}); r3.write(shipBody); r3.end();
      } catch {}
    }
    req.app.get('broadcast')?.(req.user.id, { event: 'order_updated', data: shippedOrder });
    res.json(shippedOrder);
  } catch (e) { console.error('[orders/ship]', e.message); res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id/deliver', auth, async (req, res) => {
  try {
    const o = await db.getOrder(req.params.id);
    if (!o || o.userId !== req.user.id) return res.status(404).json({ error: 'Not found' });
    await db.updateOrder(o.id, { status: 'delivered' });
    await db.addLog({ userId: req.user.id, user: 'System', action: `Delivered: ${o.id}`, details: o.customerName, type: 'order', severity: 'success' });

    if (o.customerId && o.total > 0) {
      const delivSettings = await db.getSettings(req.user.id) || {};
      const pts = Math.floor(o.total * (delivSettings.loyalty?.pointsPerMAD || 1));
      try { await db.addLoyaltyPoints(req.user.id, o.customerId, pts); } catch(e) {}
    }

    const deliveredOrder = await db.getOrder(o.id);
    req.app.get('broadcast')?.(req.user.id, { event: 'order_updated', data: deliveredOrder });

    const brand = ((await db.getSettings(req.user.id))||{}).brand || {};
    const storeBase = process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : '';
    const reviewMsg = `🎉 مبروك ${o.customerName}!\n\nوصل طلبك بنجاح من ${brand.name||'SAHAR shop'} 📦\n\nنتمنى يكون عجبك كلشي 💛\n\n⭐ كنفرحو بتقييمك:\n• كيف كانت جودة المنتج؟\n• كيف كانت سرعة التوصيل؟\n• هل ستوصي بنا لأصدقائك؟\n\nرأيك مهم جداً لنا 🙏\n${storeBase ? '🔗 ' + storeBase + '/store/' + req.user.id : ''}\n\nشكراً لثقتك! 💫\n— ${brand.name||'SAHAR shop'} ✨`;
    const waPhone = (o.customerPhone||'').replace(/\D/g,'');
    const reviewWaUrl = waPhone ? 'https://wa.me/' + waPhone + '?text=' + encodeURIComponent(reviewMsg) : null;

    res.json({ ...deliveredOrder, reviewWaUrl, reviewMsg });
  } catch (e) { console.error('[orders/deliver]', e.message); res.status(500).json({ error: 'Server error' }); }
});

// POST /api/orders/public — create order from storefront (no auth)
router.post('/public', sanitizeBody, validateOrder, async (req, res) => {
  const { userId, items, customerName, customerPhone, city, address, notes, total, source } = req.body;
  if (!userId || !items?.length || !customerName || !customerPhone)
    return res.status(400).json({ error: 'userId, items, name, phone required' });
  try {
    // crypto.randomBytes: 8 hex chars, ~40 bits entropy — brute-force resistant
    const customerCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    // Atomic transaction: both order + customer succeed or both roll back
    const { order, customer } = await db.createOrderWithCustomer(
      { userId, customerName, customerPhone, city: city||'', address: address||'',
        items, total: +total||0, source: source||'Storefront',
        status: 'pending', notes: notes||'', customerCode },
      { userId, name: customerName, phone: customerPhone,
        city: city||'', address: address||'', source: source||'Storefront' }
    );

    await db.addNotification({ userId, type: 'info', message: `🛒 طلب جديد من ${customerName} — ${order.total} MAD` });
    await db.addLog({ userId, user: 'Storefront', action: `New order: ${customerName}`, details: `${city} — ${total} MAD`, type: 'order', severity: 'info' });

    res.status(201).json({ order, customerId: customer.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/orders/track/:phone — track order by phone (public)
router.get('/track/:phone', async (req, res) => {
  const { phone } = req.params;
  const { userId } = req.query;
  if (!phone || !userId) return res.status(400).json({ error: 'phone and userId required' });
  try {
    const orders = (await db.getOrders(userId)).filter(o =>
      o.customerPhone?.replace(/\D/g,'').includes(phone.replace(/\D/g,''))
    );
    const STATUS_AR = { pending:'⏳ بانتظار التأكيد', approved:'✅ تم التأكيد', processing:'⚙️ جارٍ التحضير', shipped:'🚚 في الطريق', delivered:'📦 وصل', cancelled:'❌ ملغي' };
    res.json(orders.map(o => ({
      id: o.id, status: o.status, statusAr: STATUS_AR[o.status] || o.status,
      total: o.total, customerCode: o.customerCode,
      trackingNumber: o.trackingNumber, deliveryProvider: o.deliveryProvider,
      createdAt: o.createdAt, items: o.items,
    })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/orders/track-code/:code — track by customer code (public)
router.get('/track-code/:code', async (req, res) => {
  const { code } = req.params;
  const { userId } = req.query;
  if (!code || !userId) return res.status(400).json({ error: 'code and userId required' });
  try {
    const order = await db.findOrderByCode(userId, code);
    if (!order) return res.status(404).json({ error: 'لم نجد طلباً بهذا الكود' });
    const STATUS_AR = { pending:'⏳ بانتظار التأكيد', approved:'✅ تم التأكيد', processing:'⚙️ جارٍ التحضير', shipped:'🚚 في الطريق', delivered:'📦 وصل', cancelled:'❌ ملغي' };
    res.json({
      id: order.id, status: order.status, statusAr: STATUS_AR[order.status] || order.status,
      total: order.total, customerCode: order.customerCode,
      trackingNumber: order.trackingNumber, deliveryProvider: order.deliveryProvider,
      createdAt: order.createdAt, items: order.items,
      customerName: order.customerName, city: order.city,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
