'use strict';
// ============================================================
// Recommendation Engine — يجلس فوق Business Graph (لا قواعد if كثيرة)
//   forBusiness: أنشطة ذات صلة بنشاط مفتوح (related + same_category + same_owner)
//   forQuery:    "سباك" → كهربائي/نجار/مواد بناء (عبر قرابة الفئات في الغراف)
// كل النتائج تُرتَّب بـ Ranking، وتعيد استخدام Search الموحّد.
// ============================================================
const graph = require('./graph');
const business = require('../business');
const ranking = require('./ranking');

function dedupeRank(list, excludeKey) {
  const seen = new Set(); const out = [];
  for (const b of list) {
    const k = `${b.source}:${b.id}`;
    if (k === excludeKey || seen.has(k)) continue;
    seen.add(k); out.push(b);
  }
  return ranking.rank(out).slice(0, 12);
}

// توصيات عند فتح صفحة نشاط (ترتيب بقوّة العلاقة عبر الوزن)
async function forBusiness(source, id) {
  const rel = await graph.relationsOf(source, id, { limit: 8 });
  if (!rel) return { businesses: [] };
  const merged = [...rel.edges.related_to, ...rel.edges.same_category, ...rel.edges.same_owner];
  return { businesses: dedupeRank(merged, `${source}:${id}`), edges: rel.edges };
}

// توصيات عند البحث: أنشطة مكمّلة، موزونة بقوّة العلاقة (Weighted Graph)
async function forQuery({ q, city, limit = 8 } = {}) {
  if (!q) return { businesses: [] };
  const weighted = graph.relatedCategoriesWeighted([q]); // [{category, weight}] مرتّبة
  if (!weighted.length) return { businesses: [] };
  const arrs = await Promise.all(weighted.slice(0, 5).map(async ({ category, weight }) => {
    const list = await business.search({ city, q: category, limit: 4 });
    // قوّة العلاقة تُغذّي إشارة relevance في Ranking → التوصيات مبنية على الوزن
    list.forEach(b => { b.__relevance = weight; });
    return list;
  }));
  return { basedOn: weighted, businesses: dedupeRank(arrs.flat()).slice(0, limit) };
}

module.exports = { forBusiness, forQuery };
