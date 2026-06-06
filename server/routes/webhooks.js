'use strict';
const router = require('express').Router();
const crypto = require('crypto');
const { db } = require('../database');
const ai     = require('../lib/ai-engine');

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'sahar_shop_verify';

// Meta verification
router.get('/meta', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
  if (mode === 'subscribe' && token === VERIFY_TOKEN) return res.send(challenge);
  res.status(403).send('Forbidden');
});

// Meta webhook events
router.post('/meta', (req, res) => {
  const sig = req.headers['x-hub-signature-256'];
  const appSecret = process.env.META_APP_SECRET;
  if (appSecret && sig) {
    const hmac   = crypto.createHmac('sha256', appSecret);
    const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');
    if (sig !== digest) return res.status(401).send('Invalid signature');
  }

  const body = req.body;
  if (body.object === 'whatsapp_business_account' || body.object === 'page') {
    (body.entry || []).forEach(entry => {
      const changes = entry.changes || [{ value: entry }];
      changes.forEach(change => {
        const v = change.value || change;
        if (v.messages) v.messages.forEach(msg => handleIncoming(msg, v.metadata?.phone_number_id));
      });
    });
    return res.send('EVENT_RECEIVED');
  }
  res.status(404).send();
});

async function handleIncoming(msg, phoneId) {
  const from = msg.from;
  const text = msg.text?.body;
  if (!text) return;

  // Find user by WhatsApp Phone ID
  const allUsers = await db.listUsers();
  let userId = null;
  for (const u of allUsers) {
    const s = await db.getSettings(u.id);
    if (s?.social?.whatsapp?.pageId === phoneId) { userId = u.id; break; }
  }
  if (!userId) return;

  // Find or create conversation
  const convs = await db.getConversations(userId);
  let conv = convs.find(c => c.customerPhone === from);
  if (!conv) {
    conv = await db.createConversation({
      userId, customerName: from, customerPhone: from,
      source: 'WhatsApp', status: 'active', lastMessage: text, unread: 1,
    });
  }

  await db.addMessage(conv.id, { content: text, role: 'customer' });
  await db.addNotification({ userId, type: 'info', message: `💬 رسالة جديدة من ${from}` });

  const settings  = await db.getSettings(userId) || {};
  const products  = await db.getProducts(userId);
  const openaiKey = settings.ai?.apiKey    || process.env.OPENAI_API_KEY;
  const geminiKey = settings.ai?.geminiKey || process.env.GEMINI_API_KEY;
  const aiProvider = settings.ai?.provider  || 'openai';
  const model     = settings.ai?.model     || 'gpt-4o-mini';

  const storeName  = settings.brand?.name || 'متجر SAHAR';
  const sysPrompt  = `أنت مساعد بيع ذكي لمتجر "${storeName}". تحدث بالدارجة المغربية بأسلوب ودي واحترافي. المنتجات المتاحة:\n${(products||[]).filter(p=>p.status==='published'&&p.stock>0).map(p=>`- ${p.name}: ${p.price} ${settings.brand?.currency||'MAD'}`).join('\n')}`;

  let reply = null;

  if (openaiKey && aiProvider !== 'gemini') {
    try {
      reply = await ai.getRemoteAI('openai', openaiKey, model, sysPrompt, [{ role: 'user', content: text }]);
    } catch (e) { console.warn('[Webhook/OpenAI]', e.message); }
  }

  if (!reply && geminiKey) {
    try {
      reply = await ai.getRemoteAI('gemini', geminiKey, null, sysPrompt, [{ role: 'user', content: text }]);
    } catch (e) { console.warn('[Webhook/Gemini]', e.message); }
  }

  if (!reply) reply = ai.generateLocalReply(ai.detectIntent(text), text, products, settings);

  setTimeout(async () => {
    await db.addMessage(conv.id, { content: reply, role: 'ai' });
  }, 2000);
}

module.exports = router;
