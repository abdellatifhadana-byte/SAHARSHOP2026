'use strict';
// ============================================================
// Notification Engine — يستقبل من Rules Engine (لا من الـBus مباشرة)
// ويوزّع على القنوات خلف واجهة موحّدة. القنوات تعيد استخدام البنية
// الموجودة (in-app عبر db.addNotification, WhatsApp/Email عند التهيئة).
// إضافة قناة = adapter جديد في CHANNELS، بلا لمس القواعد.
// ============================================================
const { db } = require('../../database');

// محوّلات القنوات — واجهة موحّدة send({ businessId, message, event })
const CHANNELS = {
  'in-app': async ({ businessId, message }) => {
    // in-app: يُخزَّن كإشعار للمالك (businessId مثل 'store:<userId>' أو 'provider:<id>')
    const userId = ownerUserId(businessId);
    if (userId) await db.addNotification({ userId, type: 'info', message });
  },
  'whatsapp': async ({ message }) => {
    // seam: يُوصَل بمزوّد WhatsApp عند تهيئته (نفس مسار routes/ai/publish الحالي)
    if (!process.env.META_VERIFY_TOKEN) return; // غير مهيّأ → تجاهل بهدوء
    // التنفيذ الفعلي يُضاف عند ربط رقم المرسل؛ الآن seam فقط
    void message;
  },
  'email': async ({ message }) => {
    if (!process.env.BREVO_API_KEY && !process.env.SMTP_HOST) return; // seam
    void message;
  },
  'push': async ({ message }) => { void message; }, // seam: web-push موجود في routes/push
};

// استخراج userId المالك من businessId الموحّد ('store:ID' | 'provider:ID' | خام)
function ownerUserId(businessId) {
  if (!businessId) return null;
  const s = String(businessId);
  if (s.startsWith('store:')) return s.slice(6);
  // provider/listing: لا نملك userId مباشرة هنا — in-app يتطلّب userId المتجر،
  // يمرَّر عبر event.payload.ownerId عند توفّره
  return null;
}

// تُستدعى من Rules Engine
async function notify({ audience, businessId, channel = ['in-app'], message, event }) {
  const ownerId = event?.payload?.ownerId || null;
  const ctx = { audience, businessId: (ownerId ? `store:${ownerId}` : businessId), message, event };
  for (const ch of channel) {
    const adapter = CHANNELS[ch];
    if (!adapter) continue;
    try { await adapter(ctx); } catch (e) { console.error('[notify]', ch, e.message); }
  }
}

module.exports = { notify, CHANNELS };
