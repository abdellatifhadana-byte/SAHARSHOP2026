'use strict';
// ============================================================
// Map Engine — عقد خريطة ثابت مستقل عن مكتبة العرض
// يبني { viewport, markers, clusters, legend } من نتائج Search/Graph.
// الواجهة تستهلك هذا العقد فقط → يمكن لاحقاً Leaflet / MapLibre / Google
// بلا أي تغيير في الـ backend.
// ============================================================

const TYPE_LEGEND = {
  store:   { color: '#f97316', label: 'متاجر' },
  service: { color: '#8b5cf6', label: 'خدمات' },
};

// حدود العرض من مجموعة نقاط
function bounds(points) {
  if (!points.length) return null;
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  for (const p of points) {
    minLat = Math.min(minLat, p.lat); maxLat = Math.max(maxLat, p.lat);
    minLng = Math.min(minLng, p.lng); maxLng = Math.max(maxLng, p.lng);
  }
  return { sw: { lat: minLat, lng: minLng }, ne: { lat: maxLat, lng: maxLng } };
}

// تجميع تقريبي (clustering) بشبكة حسب دقّة الإحداثيات
function cluster(markers, precision = 2) {
  const cells = new Map();
  for (const m of markers) {
    const key = `${m.lat.toFixed(precision)},${m.lng.toFixed(precision)}`;
    if (!cells.has(key)) cells.set(key, { lat: 0, lng: 0, count: 0, ids: [] });
    const c = cells.get(key);
    c.lat += m.lat; c.lng += m.lng; c.count++; c.ids.push(m.id);
  }
  return [...cells.values()].map(c => ({ lat: +(c.lat / c.count).toFixed(5), lng: +(c.lng / c.count).toFixed(5), count: c.count, ids: c.ids }));
}

// يبني العقد من قائمة Business موحّدة
function build(businesses, { center = null, radiusKm = 25 } = {}) {
  const markers = businesses
    .filter(b => b.location)
    .map(b => ({
      id: b.id, source: b.source, name: b.name,
      lat: b.location.lat, lng: b.location.lng,
      type: b.type, verified: b.verified, rating: b.rating?.avg || 0,
      href: b.href, distanceKm: b.distanceKm ?? null, score: b._score ?? null,
    }));
  const usedTypes = [...new Set(markers.map(m => m.type))];
  return {
    viewport: { center, radiusKm, bounds: bounds(markers), count: markers.length },
    markers,
    clusters: cluster(markers),
    legend: Object.fromEntries(usedTypes.filter(t => TYPE_LEGEND[t]).map(t => [t, TYPE_LEGEND[t]])),
  };
}

module.exports = { build, cluster, bounds, TYPE_LEGEND };
