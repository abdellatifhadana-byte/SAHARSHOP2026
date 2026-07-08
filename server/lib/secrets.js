'use strict';
// ============================================================
// Secrets-at-rest encryption (H-1)
// Backward-compatible AES-256-GCM for third-party API keys/tokens
// stored inside the per-merchant `settings` JSONB.
//
// Design goals (لا تكسر أي ميزة):
//  - Passthrough: غير المشفّر يُقرأ كما هو (نص صريح قديم يبقى يعمل).
//  - Fail-safe: أي خطأ في التشفير/فك التشفير يُعيد القيمة كما هي
//    دون رمي استثناء — فلا تتعطّل قراءة الإعدادات أبداً.
//  - يُشتق المفتاح من SECRETS_KEY أو JWT_SECRET (ثابت في الإنتاج).
//    يمكن تعطيله صراحةً بـ ENCRYPT_SECRETS=0.
// ============================================================
const crypto = require('crypto');

const PREFIX = 'enc:v1:';
const DISABLED = process.env.ENCRYPT_SECRETS === '0';

function getKey() {
  const raw = process.env.SECRETS_KEY || process.env.JWT_SECRET || '';
  if (!raw) return null;
  // مفتاح 32 بايت مشتق بثبات
  return crypto.scryptSync(raw, 'sahar-secrets-salt-v1', 32);
}

function encrypt(plain) {
  try {
    if (DISABLED) return plain;
    if (typeof plain !== 'string' || plain === '' || plain.startsWith(PREFIX)) return plain;
    const key = getKey();
    if (!key) return plain;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return PREFIX + Buffer.concat([iv, tag, ct]).toString('base64');
  } catch { return plain; }
}

function decrypt(stored) {
  try {
    if (typeof stored !== 'string' || !stored.startsWith(PREFIX)) return stored;
    const key = getKey();
    if (!key) return stored;
    const buf = Buffer.from(stored.slice(PREFIX.length), 'base64');
    const iv = buf.subarray(0, 12), tag = buf.subarray(12, 28), ct = buf.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
  } catch { return stored; }
}

// الحقول الحاملة للأسرار داخل كائن الإعدادات
function walkSecrets(obj, fn) {
  if (!obj || typeof obj !== 'object') return;
  ['cloudinaryApiKey', 'cloudinaryApiSecret', 'supabaseKey'].forEach(k => {
    if (typeof obj[k] === 'string') obj[k] = fn(obj[k]);
  });
  if (obj.ai && typeof obj.ai === 'object') {
    ['apiKey', 'geminiKey', 'claudeKey', 'deepseekKey', 'grokKey', 'mistralKey'].forEach(k => {
      if (typeof obj.ai[k] === 'string') obj.ai[k] = fn(obj.ai[k]);
    });
  }
  if (obj.security && typeof obj.security === 'object') {
    if (typeof obj.security.hcaptchaSecret === 'string') obj.security.hcaptchaSecret = fn(obj.security.hcaptchaSecret);
  }
  if (obj.marketing && typeof obj.marketing === 'object') {
    if (typeof obj.marketing.brevoApiKey === 'string') obj.marketing.brevoApiKey = fn(obj.marketing.brevoApiKey);
  }
  if (obj.social && typeof obj.social === 'object') {
    for (const plat of Object.keys(obj.social)) {
      const s = obj.social[plat];
      if (s && typeof s === 'object') {
        ['accessToken', 'apiKey'].forEach(k => { if (typeof s[k] === 'string') s[k] = fn(s[k]); });
      }
    }
  }
}

// تُستدعى قبل الحفظ في القاعدة (لا تعدّل كائن المتصل)
function encryptSettings(data) {
  try {
    if (!data || typeof data !== 'object') return data;
    const clone = JSON.parse(JSON.stringify(data));
    walkSecrets(clone, encrypt);
    return clone;
  } catch { return data; }
}

// تُستدعى بعد القراءة من القاعدة (الكائن طازج من pg)
function decryptSettings(data) {
  try {
    if (!data || typeof data !== 'object') return data;
    walkSecrets(data, decrypt);
    return data;
  } catch { return data; }
}

// ============================================================
// H-1 (جانب العميل): لا تُعاد الأسرار للمتصفح إطلاقاً.
// GET /settings يُرجعها مقنَّعة بـ MASK، وPUT يتجاهل قيم MASK
// (فلا يكتب القناع فوق السر الحقيقي عند حفظ حقول أخرى).
// ============================================================
const MASK = '••••••••';

// نسخة مقنَّعة تُرسل للواجهة — القيم غير الفارغة تُستبدل بالقناع
function maskSettings(data) {
  try {
    if (!data || typeof data !== 'object') return data;
    const clone = JSON.parse(JSON.stringify(data));
    walkSecrets(clone, v => (v ? MASK : v));
    return clone;
  } catch { return data; }
}

// إزالة قيم القناع من حمولة الحفظ الواردة (تُبقي السر المخزّن كما هو)
function stripMasked(source) {
  if (!source || typeof source !== 'object') return source;
  if (Array.isArray(source)) return source;
  const out = {};
  for (const key of Object.keys(source)) {
    const v = source[key];
    if (v === MASK) continue;
    out[key] = (v && typeof v === 'object' && !Array.isArray(v)) ? stripMasked(v) : v;
  }
  return out;
}

module.exports = { encrypt, decrypt, encryptSettings, decryptSettings, MASK, maskSettings, stripMasked };
