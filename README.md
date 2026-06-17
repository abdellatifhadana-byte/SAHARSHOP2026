<div align="center">

# 🛍️ SAHAR shop — AI Commerce OS

### منصّة المغرب الذكية للبيع والخدمات والحجوزات
**Morocco's smart platform for selling, services & bookings**

بِع منتجاتك · قدّم خدماتك · استقبل الحجوزات والمواعيد · وصّل لكل مدن المغرب — كل شيء من مكان واحد، مدعوم بالذكاء الاصطناعي.

`React 19` · `TypeScript` · `Vite` · `Node/Express` · `PostgreSQL` · `WhatsApp Cloud API` · `5 لغات`

</div>

---

## ✨ نظرة عامة

**SAHAR shop** نظام تجارة متكامل يجمع في تطبيق واحد: متجراً إلكترونياً للتاجر، صفحة زبون أنيقة، سوقاً مغربياً موحّداً، مساعداً ذكياً يرد على الزبائن، صندوق رسائل موحّد، وتوصيلاً مؤتمتاً — بخمس لغات (العربية، الدارجة، الفرنسية، الإنجليزية، الصينية) ودعم كامل للاتجاهين (RTL/LTR).

| | |
|---|---|
| 🏬 **للتاجر** | لوحة تحكم كاملة: منتجات، خدمات، طلبات، زبائن، تحليلات، تسويق |
| 🛍️ **للزبون** | متجر إلكتروني برابط خاص + سلة + دفع عند الاستلام + تتبّع |
| 🏪 **السوق الموحّد** | كتالوج عام يجمع إعلانات كل البائعين + نشر مجاني + تقييمات |
| 🤖 **الذكاء الاصطناعي** | مساعد يرد، يقترح، ويجمع بيانات الطلب 24/7 (6 مزوّدين) |

---

## 🚀 تشغيل سريع

### الطريقة اليدوية
```bash
# 1) تثبيت المكتبات
npm install
cd server && npm install && cd ..

# 2) إعداد البيئة
cp server/.env.example server/.env
#   عدّل server/.env وأضِف JWT_SECRET و DATABASE_URL

# 3) بناء الواجهة ثم تشغيل الخادم
npm run build
node server/index.js
```
افتح: **http://localhost:3001** · فحص الصحة: **/api/health**

### سكربتات جاهزة
```bash
# Mac / Linux
chmod +x start.sh && ./start.sh
# Windows: انقر مرتين على start.bat
```

---

## ⚙️ متغيّرات البيئة (`server/.env`)

```env
# ── أساسي ───────────────────────────────────────────
JWT_SECRET=ضع-سلسلة-عشوائية-32-حرفاً        # ضروري
DATABASE_URL=postgres://user:pass@host:5432/db  # PostgreSQL

# ── مدير أوّل تلقائي (اختياري) ──────────────────────
ADMIN_EMAIL=admin@mystore.ma
ADMIN_PASSWORD=Admin1234!
ADMIN_NAME=المدير

# ── الذكاء الاصطناعي (يعمل بدونه بمحاكاة محلية) ─────
GEMINI_API_KEY=AIza...          # مجاني من Google
OPENAI_API_KEY=sk-...           # اختياري
# DeepSeek / Claude / Mistral / Groq ... مدعومة أيضاً

# ── السوق الموحّد (اختياري) ─────────────────────────
PLATFORM_ADMIN_EMAIL=           # حساب مراجعة الإعلانات (افتراضي: ADMIN_EMAIL)
PLATFORM_WHATSAPP_TOKEN=        # لتفعيل تأكيد هاتف البائع عبر OTP
PLATFORM_WHATSAPP_PHONE_ID=     # (إن تُركا فارغين يعمل النشر دون تأكيد)

# ── تكاملات (اختياري) ───────────────────────────────
CLOUDINARY_URL=                 # رفع الصور
VAPID_PUBLIC_KEY= / VAPID_PRIVATE_KEY=   # إشعارات الويب Push
META_VERIFY_TOKEN= / META_APP_SECRET=    # WhatsApp/Facebook webhook
```

---

## 🧩 الميزات الكاملة

### 🏬 لوحة التاجر
- **الرئيسية** — نظرة حيّة (إيراد، طلبات، زبائن، رسائل) + تقرير الصباح + مسار البيع.
- **المنتجات** — حقول حسب الفئة، صور متعددة + فيديو، خيارات (مقاس/لون)، وصف بالذكاء الاصطناعي، مخزون وتنبيهات.
- **الخدمات** — للحرفيين وأصحاب المهن: السعر، المدة، مناطق التغطية، ومعرض أعمال.
- **الطلبات** — لوحة 5 مراحل، فاتورة، إرسال/تأكيد عبر واتساب، إنشاء توصيل.
- **الزبائن (CRM)** — سجل كامل، نقاط ولاء، مستوى ثقة، شارة VIP.
- **الرسائل الموحّدة** — واتساب + فيسبوك + إنستغرام في صندوق واحد، ردود ذكية تلقائية.
- **التوصيل** — ربط شركات الشحن، أتمتة الإرسال، إشعار الزبون بالتتبّع.
- **الكوبونات** — أكواد خصم، شحن مجاني، **عجلة الحظ**، برامج ولاء.
- **استوديو البانر** — تصميم بانرات/إعلانات بالذكاء الاصطناعي + هاشتاغات + نشر.
- **محرّر الصور** — تحسين صور المنتجات.
- **التحليلات** — الزيارات، المبيعات، الأرباح، مصادر الزوار.
- **مراجعة الإعلانات** — اعتماد/رفض إعلانات السوق (لمشرف المنصّة).
- **الإعدادات** — هوية المتجر، الدفع، الذكاء الاصطناعي، النسخ الاحتياطي، تصدير/استيراد، واللغة.

### 🛍️ صفحة الزبون (Storefront)
متجر إلكتروني أنيق برابط خاص: `‎/store/<userId>` — كتالوج بفلترة (منتجات/خدمات/رقمي)، **شريط معلومات بارز** (توصيل مجاني، الدفع عند الاستلام، حالة المتجر، العروض)، سلة كاملة، إتمام طلب بمدن المغرب وحساب التوصيل تلقائياً، **3 تدفّقات للخدمات** (حجز موعد / طلب الخدمة / طلب عاجل)، مساعد دردشة، عجلة الحظ، تتبّع الطلب، وتأكيد عبر واتساب.

### 🏪 السوق المغربي الموحّد (Marketplace)
صفحة عامة `‎/market` تجمع إعلانات كل البائعين (منتجات + خدمات):
- **نشر مجاني بلا حساب** — نموذج بسيط مع صورة (تُضغط على الجهاز) → يصل بحالة «قيد المراجعة».
- **مراجعة الإدارة** قبل النشر للعموم (حماية الجودة والثقة).
- **التقييمات والنجوم** ⭐ — متوسط بارز على البطاقة + نافذة تفاصيل وإضافة تقييم.
- **تأكيد الهاتف OTP** عبر واتساب (اختياري — يُفعَّل عند ضبط مُرسِل المنصّة).
- تواصل مباشر مع البائع عبر واتساب — الطلب يذهب للبائع دون وسيط.

### 🤖 الذكاء الاصطناعي
6 مزوّدين مع تحويل تلقائي عند الفشل (Fallback) ومحاكاة محلية عند غياب المفاتيح: ردّ آلي على الزبائن، اقتراح منتجات، توليد أوصاف، وتصميم بانرات.

### 🌍 تعدّد اللغات
واجهتا الزبون (المتجر + السوق) والصفحة الرئيسية بخمس لغات كاملة مع مبدّل خاص بالزبون واتجاه تلقائي RTL/LTR.

---

## 🗺️ المسارات العامة

| المسار | الوصف |
|--------|-------|
| `/` | الصفحة الرئيسية (Landing) |
| `/market` | السوق المغربي الموحّد |
| `/store/<userId>` | متجر التاجر للزبائن |
| `/login` · `/dashboard` | دخول التاجر · لوحة التحكم |

---

## 🔗 واجهة الـ API (موجز)

```text
Auth        POST /api/auth/register · /api/auth/login · /api/auth/refresh
Products    GET  /api/products · GET /api/products/public/catalog?userId=X
Orders      POST /api/orders/public            ← من المتجر/السوق
            GET  /api/orders/track/:phone      ← تتبّع الزبون
            PUT  /api/orders/:id/approve|ship   ← + إشعار واتساب تلقائي
Marketplace POST /api/listings/public          ← نشر إعلان (مراجعة)
            GET  /api/listings/public/catalog   ← الكتالوج الموحّد
            PUT  /api/listings/:id/approve|reject|suspend
            GET/POST /api/listings/:id/reviews  ← التقييمات
            POST /api/listings/otp/request|verify
AI          POST /api/ai/reply · /api/ai/public-reply · /api/ai/publish
Coupons     GET /api/coupons/validate · POST /api/coupons/public/spin
Settings    GET /api/settings · /api/settings/export
Health      GET /api/health
```

---

## 📂 هيكل المشروع

```text
SAHARSHOP2026/
├── src/                      # الواجهة (React + TS + Vite)
│   ├── pages/                # الصفحات (Dashboard, Products, Orders, Storefront,
│   │                         #   Marketplace, Moderation, Settings, Landing ...)
│   ├── components/           # مكوّنات مشتركة (NavBar, GlobalSearch, TourGuide ...)
│   ├── i18n/                 # الترجمة: translations.ts (الإدارة) + public.ts (الزبون)
│   └── store.tsx             # حالة التطبيق (Context)
├── server/                   # الخادم (Node + Express + PostgreSQL)
│   ├── index.js              # نقطة الدخول + WebSocket + الكرون
│   ├── database.js           # طبقة البيانات (pg) واستعلامات مُعاملة
│   ├── migrate.js            # ترحيلات الجداول (idempotent)
│   ├── routes/               # auth, products, orders, listings, ai, coupons ...
│   ├── middleware/           # auth (Bearer), validate ...
│   └── lib/                  # logger, secrets ...
├── public/                   # الأصول الثابتة (الشعار، الأيقونات، PWA)
├── Procfile · nixpacks.toml · railway.json   # النشر
└── package.json · tsconfig.json · vite.config.ts
```

---

## ☁️ النشر (Railway / Nixpacks)

البناء عبر Nixpacks ثم `node server/index.js` (يخدم الواجهة المبنيّة + الـAPI). فحص الصحة على `/api/health`، وتوجيه SPA عبر catch-all. اضبط `DATABASE_URL` و`JWT_SECRET` في متغيّرات البيئة على المنصّة.

---

## ✅ التحقق والجودة

```bash
npm run build            # بناء الواجهة (Vite)
npx tsc --noEmit         # فحص الأنواع
cd server && npm test    # اختبارات الخادم (node:test)
```
أمان: مصادقة JWT (ساعة) + رموز تحديث دوّارة مُجزّأة (SHA‑256)، استعلامات مُعاملة (لا حقن SQL)، تشفير أسرار الإعدادات (AES‑256‑GCM)، وحدّ معدّل على النقاط الحسّاسة.

---

## 📞 الدعم والتطوير

<div align="center">

💬 واتساب: **[+212 649 200 188](https://wa.me/212649200188)** · **[+212 612 265 893](https://wa.me/212612265893)**
📍 الدار البيضاء، المغرب 🇲🇦

**تطوير · Developed by:** Alloservix · Abdellatif hadana

`AI Commerce OS © 2026 — جميع الحقوق محفوظة`

</div>
