'use strict';
const router = require('express').Router();
const auth   = require('../middleware/auth');
const { db } = require('../database');
const ai     = require('../lib/ai-engine');

// GET /api/conversations
router.get('/', auth, async (req, res) => {
  try { res.json(await db.getConversations(req.user.id)); }
  catch (e) { console.error('[conversations]', e.message); res.status(500).json({ error: 'Server error' }); }
});

// POST /api/conversations
router.post('/', auth, async (req, res) => {
  try {
    const conv = await db.createConversation({ ...req.body, userId: req.user.id });
    await db.addNotification({ userId: req.user.id, type: 'info', message: `💬 New conversation with ${conv.customerName}` });
    // Abandoned cart reminder — 24 hours after conversation with no order
    const convIdForTimer = conv.id;
    const userIdForTimer = req.user.id;
    setTimeout(async () => {
      try {
        const updatedConv = await db.getConversation(convIdForTimer);
        if (!updatedConv || updatedConv.status === 'archived') return;
        const orders = await db.getOrders(userIdForTimer);
        const hasOrder = orders.some(o =>
          o.customerId === updatedConv.customerId && new Date(o.createdAt) > new Date(updatedConv.createdAt)
        );
        if (!hasOrder) {
          await db.addMessage(convIdForTimer, { content: 'مرحبا! 😊 هل أتممت طلبك؟ نحن هنا إذا كنت بحاجة مساعدة', role: 'ai' });
          await db.addNotification({ userId: userIdForTimer, type: 'info', message: `⏰ تم إرسال تنبيه سلة مهجورة لـ ${updatedConv.customerName}` });
        }
      } catch(e) {}
    }, 24 * 60 * 60 * 1000); // 24 hours
    res.status(201).json(conv);
  } catch (e) { console.error('[conversations]', e.message); res.status(500).json({ error: 'Server error' }); }
});

// PUT /api/conversations/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const conv = await db.getConversation(req.params.id);
    if (!conv || conv.userId !== req.user.id) return res.status(404).json({ error: 'Not found' });
    res.json(await db.updateConversation(req.params.id, req.body));
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/conversations/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const conv = await db.getConversation(req.params.id);
    if (!conv || conv.userId !== req.user.id) return res.status(404).json({ error: 'Not found' });
    // Mark as archived instead of hard delete
    await db.updateConversation(req.params.id, { status: 'archived' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// POST /api/conversations/:id/messages
router.post('/:id/messages', auth, async (req, res) => {
  const { content, role = 'customer' } = req.body;
  const convId = req.params.id;
  const uid    = req.user.id;

  try {
    const conv = await db.getConversation(convId);
    if (!conv || conv.userId !== uid) return res.status(404).json({ error: 'Not found' });

    const msg = await db.addMessage(convId, { content, role });
    req.app.get('broadcast')?.(uid, { event: 'new_message', convId, data: msg });

    // Auto AI reply when customer sends
    if (role === 'customer') {
      const settings = await db.getSettings(uid) || {};
      const products = await db.getProducts(uid);
      const delay    = Math.max(800, (settings.ai?.replyDelay || 2) * 1000);
      const openaiKey = settings.ai?.apiKey || process.env.OPENAI_API_KEY;
      const geminiKey = settings.ai?.geminiKey || process.env.GEMINI_API_KEY;
      const provider  = settings.ai?.provider || 'openai';

      setTimeout(async () => {
        let reply = null;
        const key = provider === 'gemini' ? geminiKey : openaiKey;
        if (key) {
          try {
            const updatedConv = await db.getConversation(convId);
            const history = (updatedConv?.messages || []).slice(-8).map(m => ({
              role: m.role === 'ai' ? 'assistant' : 'user',
              content: m.content,
            }));
            reply = await ai.getRemoteAI(provider, key, settings.ai?.model, settings.ai?.systemPrompt, history);
          } catch (e) { console.warn('[AI] Remote failed:', e.message); }
        }

        if (!reply) {
          const intent = ai.detectIntent(content);
          reply = ai.generateLocalReply(intent, content, products, settings);
        }

        const aiMsg = await db.addMessage(convId, { content: reply, role: 'ai' });
        req.app.get('broadcast')?.(uid, { event: 'new_message', convId, data: aiMsg });
      }, delay);
    }

    res.json(msg);
  } catch (e) { console.error('[conversations/messages]', e.message); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
