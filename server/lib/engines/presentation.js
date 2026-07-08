'use strict';
// ============================================================
// Presentation Registry — كيف يُعرَض النشاط (منفصل عن Capabilities)
// Capabilities تصف ما يستطيع النشاط فعله؛ هذه الطبقة تصف ترتيب الأقسام
// حسب "نوع العرض" (kind) بلا أي if. القدرات تُبقي/تُخفي القسم،
// والـ Registry يرتّبه. إضافة نوع جديد (فندق/طبيب) = سطر واحد هنا.
// ============================================================
const LAYOUTS = {
  store:      ['about', 'products', 'offers', 'gallery', 'reviews', 'location', 'contact'],
  service:    ['about', 'services', 'booking', 'gallery', 'reviews', 'location', 'contact'],
  restaurant: ['about', 'products', 'booking', 'gallery', 'reviews', 'location', 'contact'],
  doctor:     ['about', 'appointments', 'booking', 'reviews', 'location', 'contact'],
  hotel:      ['about', 'gallery', 'booking', 'reviews', 'location', 'contact'],
  default:    ['about', 'products', 'services', 'offers', 'booking', 'gallery', 'reviews', 'location', 'contact'],
};

function layoutFor(kind) {
  return LAYOUTS[kind] || LAYOUTS.default;
}

// رتّب الأقسام المفعّلة (enabled) وفق تخطيط النوع؛ أي قسم مفعّل خارج
// التخطيط يُلحَق في النهاية حتى لا يضيع.
function orderSections(kind, enabled) {
  const layout = layoutFor(kind);
  const inLayout = layout.filter(s => enabled.includes(s));
  const extras = enabled.filter(s => !layout.includes(s));
  return [...inLayout, ...extras];
}

module.exports = { orderSections, layoutFor, LAYOUTS };
