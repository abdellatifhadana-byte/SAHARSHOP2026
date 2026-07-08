'use strict';
// ============================================================
// H-5 — حارس تكلفة الذكاء الاصطناعي (AI Spend Guard)
// حصة يومية لكل مستخدم فوق الـ rate-limit العام، لمنع استنزاف
// رصيد مفاتيح env المشتركة. عدّاد في الذاكرة يُصفَّر يومياً
// (كافٍ لتحديد سقف داخل نسخة الخادم؛ يفشل مفتوحاً عند إعادة التشغيل).
// السقف يُضبط بـ AI_DAILY_QUOTA (افتراضي 200 طلب/مستخدم/يوم).
// ============================================================
const DAILY = Math.max(1, +process.env.AI_DAILY_QUOTA || 200);
const _counts = new Map(); // key: `${userId}:${YYYY-MM-DD}` → count

function _today() { return new Date().toISOString().slice(0, 10); }

// تنظيف دوري خفيف للمفاتيح القديمة (منع نمو الذاكرة)
setInterval(() => {
  const today = _today();
  for (const k of _counts.keys()) if (!k.endsWith(today)) _counts.delete(k);
}, 60 * 60 * 1000).unref?.();

module.exports = function aiQuota(req, res, next) {
  const userId = req.user && req.user.id;
  if (!userId) return next(); // المسارات المصادَقة فقط؛ غيرها يمرّ
  const key = `${userId}:${_today()}`;
  const used = _counts.get(key) || 0;
  if (used >= DAILY) {
    return res.status(429).json({
      error: `بلغت الحصة اليومية للذكاء الاصطناعي (${DAILY} طلب). تُعاد غداً — أو أضف مفتاحك الخاص في الربط.`,
      quota: DAILY, used,
    });
  }
  _counts.set(key, used + 1);
  res.setHeader('X-AI-Quota-Limit', DAILY);
  res.setHeader('X-AI-Quota-Remaining', Math.max(0, DAILY - used - 1));
  next();
};
