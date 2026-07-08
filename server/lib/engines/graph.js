'use strict';
// ============================================================
// Business Graph — طبقة علاقات فوق النموذج الموحّد (Facade، لا جداول جديدة)
// العلاقات تُستنتج من البيانات القائمة (فئة/مدينة/مالك/قرب)، فيصبح:
//   Recommendation / Map / Feed / AI  مجرد استعلامات على الغراف.
// أنواع الحواف (edges):
//   sells·provides·offers·receives (داخلية للنشاط) — تأتي من getProfile
//   belongs_to(category) · located_in(city) · same_owner · near · related_to
// لا SQL بحث مكرّر: يعيد استخدام Search/Business الموحّد.
// ============================================================
const business = require('../business');

// خريطة قرابة الفئات (للـ related_to) — قابلة للتوسّع بلا if في الكود
// كل فئة ⇄ فئات مكمّلة يبحث عنها الزبون عادةً في نفس السياق.
// Weighted Graph: كل حافة لها قوّة 0..1 — التوصيات تُرتَّب بقوّة العلاقة لا بوجودها.
const CATEGORY_AFFINITY = {
  'سباك':      [['كهربائي', 0.82], ['نجار', 0.6], ['دهان', 0.5], ['مواد البناء', 0.7], ['بناء', 0.55]],
  'كهربائي':   [['سباك', 0.82], ['أنظمة إنذار', 0.7], ['كاميرات', 0.9], ['شبكات', 0.6], ['تكييف', 0.65]],
  'كاميرات':   [['أنظمة إنذار', 0.95], ['كهربائي', 0.82], ['شبكات', 0.61], ['صيانة', 0.5]],
  'نجار':      [['دهان', 0.75], ['سباك', 0.6], ['ديكور', 0.7], ['حداد', 0.55]],
  'دهان':      [['نجار', 0.75], ['ديكور', 0.7], ['بناء', 0.6]],
  'تكييف':     [['كهربائي', 0.7], ['صيانة', 0.75], ['سباك', 0.5]],
  'ميكانيكي':  [['كهرباء سيارات', 0.85], ['قطع غيار', 0.9], ['غسيل سيارات', 0.55]],
  'حلاق':      [['تجميل', 0.8], ['عطور', 0.5]],
  'مطعم':      [['حلويات', 0.7], ['توصيل', 0.75], ['قاعات', 0.5]],
  'هواتف':     [['صيانة هواتف', 0.92], ['إكسسوارات', 0.8], ['شبكات', 0.5]],
};

const norm = (s) => String(s || '').toLowerCase().trim();

// فئات ذات صلة موزونة: [{category, weight}] مرتّبة تنازلياً بالقوّة
function relatedCategoriesWeighted(categories = []) {
  const acc = new Map();
  for (const c of categories) {
    const key = Object.keys(CATEGORY_AFFINITY).find(k => norm(c).includes(norm(k)) || norm(k).includes(norm(c)));
    if (key) for (const [cat, w] of CATEGORY_AFFINITY[key]) acc.set(cat, Math.max(acc.get(cat) || 0, w));
  }
  return [...acc.entries()].map(([category, weight]) => ({ category, weight })).sort((a, b) => b.weight - a.weight);
}

// فئات ذات صِلة بفئة معطاة (تماثل نصّي + خريطة القرابة)
function relatedCategories(categories = []) {
  return relatedCategoriesWeighted(categories).map(x => x.category);
}

// حواف نشاط واحد → أنشطة أخرى ذات علاقة
// { near, sameCategory, sameOwner, related } كلها Business موحّد.
async function relationsOf(source, id, { limit = 8 } = {}) {
  const profile = await business.getProfile(source, id);
  if (!profile) return null;
  const b = profile.business;
  const city = b.city || undefined;
  const cats = b.categories || [];

  // نفس الفئة/المدينة، ونفس المالك، وذات صِلة (فئات مكمّلة)
  const [sameCatRaw, relatedRaw] = await Promise.all([
    cats.length ? business.search({ city, q: cats[0], limit: limit + 4 }) : Promise.resolve([]),
    Promise.all(relatedCategories(cats).slice(0, 4).map(rc => business.search({ city, q: rc, limit: 4 })))
      .then(arrs => arrs.flat()),
  ]);

  const self = (x) => !(x.source === source && x.id === id);
  const dedupe = (arr) => {
    const seen = new Set(); const out = [];
    for (const x of arr) { const k = `${x.source}:${x.id}`; if (!seen.has(k) && self(x)) { seen.add(k); out.push(x); } }
    return out;
  };

  const sameCategory = dedupe(sameCatRaw).slice(0, limit);
  const related = dedupe(relatedRaw).slice(0, limit);
  const sameOwner = b.ownerId
    ? dedupe([...sameCatRaw, ...relatedRaw]).filter(x => x.ownerId === b.ownerId).slice(0, limit)
    : [];

  return {
    business: b,
    edges: {
      belongs_to: cats,
      located_in: city || null,
      same_category: sameCategory,
      same_owner: sameOwner,
      related_to: related,
    },
  };
}

module.exports = { relationsOf, relatedCategories, relatedCategoriesWeighted, CATEGORY_AFFINITY };
