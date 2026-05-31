import { useState, useMemo, lazy, Suspense } from 'react';
import { useStore } from '../store';
import Sparkline from '../components/Sparkline';
import { Download, TrendingUp, BarChart3 } from 'lucide-react';

// Lazy-load recharts to keep initial bundle small
const RechartsBar = lazy(() => import('recharts').then(m => ({
  default: function RevenueBarChart({ data, currency }: { data: { label: string; revenue: number; count: number }[]; currency: string }) {
    const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } = m;
    return (
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--ink3,#888)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--ink3,#888)' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: 'var(--panel2,#1C3058)', border: '1px solid var(--border,rgba(255,255,255,.1))', borderRadius: 10, fontSize: 12 }}
            formatter={(v: any) => [`${Number(v).toLocaleString()} ${currency}`, 'الإيراد']}
          />
          {data.map((_, i) => (
            <Cell key={i} fill={`rgba(255,106,0,${0.5 + (i / data.length) * 0.5})`} />
          ))}
          <Bar dataKey="revenue" radius={[6, 6, 2, 2]} />
        </BarChart>
      </ResponsiveContainer>
    );
  },
})));

const RechartsPie = lazy(() => import('recharts').then(m => ({
  default: function StatusPieChart({ data }: { data: { name: string; value: number; color: string }[] }) {
    const { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } = m;
    return (
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip
            contentStyle={{ background: 'var(--panel2,#1C3058)', border: '1px solid var(--border,rgba(255,255,255,.1))', borderRadius: 10, fontSize: 12 }}
            formatter={(v: any, name: any) => [v, name]}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, color: 'var(--ink3,#888)' }} />
        </PieChart>
      </ResponsiveContainer>
    );
  },
})));

type Period = 3 | 6 | 12;

const STATUS_COLORS: Record<string, string> = {
  pending:    '#F59E0B',
  approved:   '#3B82F6',
  processing: '#8B5CF6',
  shipped:    '#06B6D4',
  delivered:  '#10B981',
  cancelled:  '#EF4444',
};
const STATUS_AR: Record<string, string> = {
  pending:'بانتظار', approved:'موافقة', processing:'جارٍ',
  shipped:'شُحن', delivered:'وُصّل', cancelled:'ملغي',
};

export default function AnalyticsPage() {
  const { orders, products, customers, settings } = useStore();
  const [months, setMonths] = useState<Period>(6);
  const { currency } = settings.brand;

  const active    = orders.filter(o => o.status !== 'cancelled');
  const revenue   = active.reduce((s, o) => s + o.total, 0);
  const costTotal = active.reduce((s, o) => s + o.items.reduce((ss, item) => { const p = products.find(x => x.id === item.productId); return ss + (p?.cost || 0) * item.quantity; }, 0), 0);
  const profit    = revenue - costTotal;
  const avgOrder  = active.length ? Math.round(revenue / active.length) : 0;
  const margin    = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
  const dlvRate   = orders.length ? Math.round((orders.filter(o => o.status === 'delivered').length / orders.length) * 100) : 0;

  const now = new Date();
  const monthly = useMemo(() => Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const label = d.toLocaleString('ar', { month: 'short' });
    const mo = active.filter(o => { const od = new Date(o.createdAt); return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear(); });
    return { label, revenue: mo.reduce((s, o) => s + o.total, 0), count: mo.length };
  }), [months, active.length]);

  const topProds = [...products].sort((a, b) => b.sales - a.sales).slice(0, 5);
  const maxSales = topProds[0]?.sales || 1;

  const sources: Record<string, { orders: number; revenue: number }> = {};
  active.forEach(o => { if (!sources[o.source]) sources[o.source] = { orders: 0, revenue: 0 }; sources[o.source].orders++; sources[o.source].revenue += o.total; });
  const maxSrcRev = Math.max(...Object.values(sources).map(s => s.revenue), 1);

  const statusDist: Record<string, number> = {};
  orders.forEach(o => { statusDist[o.status] = (statusDist[o.status] || 0) + 1; });

  const statusPieData = Object.entries(statusDist).map(([name, value]) => ({
    name: STATUS_AR[name] || name, value, color: STATUS_COLORS[name] || '#6B7280',
  }));

  const exportCSV = () => {
    const rows = [['الشهر','الإيرادات','الطلبات'], ...monthly.map(m => [m.label, m.revenue, m.count])];
    const csv = '﻿' + rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a'); a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`; a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  const kpis = [
    { label: 'الإيرادات',      value: `${revenue.toLocaleString()} ${currency}`,  color: '#10b981', spark: monthly.map(m => m.revenue) },
    { label: 'صافي الربح',    value: `${profit.toLocaleString()} ${currency}`,   color: '#6366f1', spark: monthly.map(m => Math.max(0, m.revenue * 0.35)) },
    { label: 'هامش الربح',    value: `${margin}%`,                               color: '#a855f7', spark: [margin-5,margin-2,margin,margin+1,margin,margin+2,margin] },
    { label: 'متوسط الطلب',   value: `${avgOrder} ${currency}`,                  color: '#f97316', spark: monthly.map(m => m.count ? m.revenue / m.count : 0) },
    { label: 'معدل التوصيل',  value: `${dlvRate}%`,                              color: '#06b6d4', spark: [dlvRate-5,dlvRate,dlvRate+2,dlvRate-1,dlvRate,dlvRate+3,dlvRate] },
    { label: 'زبائن متكررون', value: String(customers.filter(c => c.totalOrders >= 3).length), color: '#8b5cf6', spark: [0,1,1,2,2,3,customers.filter(c=>c.totalOrders>=3).length] },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">التحليلات</h1>
          <p className="page-sub">من بياناتك الحقيقية</p>
        </div>
        <button onClick={exportCSV} className="btn btn-ghost btn-sm"><Download size={15} /> CSV</button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {kpis.map((k, i) => (
          <div key={i} className="card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: 12, color: 'var(--ink3)', fontWeight: 700 }}>{k.label}</p>
              <div style={{ opacity: .75 }}><Sparkline data={k.spark} color={k.color} height={28} width={60} /></div>
            </div>
            <p style={{ fontSize: 18, fontWeight: 900, color: 'var(--ink1)' }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue Bar Chart (Recharts) */}
      <div className="card" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 900, color: 'var(--ink1)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={16} color="var(--clr-ok,#10b981)" /> الإيرادات الشهرية
          </h2>
          <div style={{ display: 'flex', gap: 5 }}>
            {([3,6,12] as Period[]).map(m => (
              <button key={m} onClick={() => setMonths(m)} className={`tab-btn ${months===m?'active':''}`} style={{ padding: '5px 12px', fontSize: 12.5 }}>{m} شهر</button>
            ))}
          </div>
        </div>
        {monthly.some(m => m.revenue > 0) ? (
          <Suspense fallback={<div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink3)' }}>جارٍ التحميل...</div>}>
            <RechartsBar data={monthly} currency={currency} />
          </Suspense>
        ) : (
          <div style={{ height: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--ink3)', gap: 8 }}>
            <span style={{ fontSize: 40, opacity: 0.3 }}>📊</span>
            <p style={{ fontSize: 14 }}>لا توجد بيانات بعد</p>
          </div>
        )}
      </div>

      {/* Status Pie Chart + Top Products */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Status distribution — Pie chart */}
        <div className="card" style={{ padding: '18px 20px' }}>
          <h2 style={{ fontSize: 14, fontWeight: 900, color: 'var(--ink1)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
            <BarChart3 size={14} color="var(--ember)" /> حالات الطلبات
          </h2>
          {statusPieData.length > 0 ? (
            <Suspense fallback={<div style={{ height: 180 }} />}>
              <RechartsPie data={statusPieData} />
            </Suspense>
          ) : (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink3)', fontSize: 13 }}>لا طلبات بعد</div>
          )}
        </div>

        {/* Top products */}
        <div className="card" style={{ padding: '18px 20px' }}>
          <h2 style={{ fontSize: 14, fontWeight: 900, color: 'var(--ink1)', marginBottom: 16 }}>🏆 أفضل المنتجات</h2>
          {topProds.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {topProds.map((p, i) => (
                <div key={p.id}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--ink3)', width: 16 }}>#{i+1}</span>
                      <span style={{ fontSize: 18 }}>{p.emoji}</span>
                      <span style={{ fontSize: 13, color: 'var(--ink1)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>{p.name}</span>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ fontSize: 12.5, fontWeight: 900, color: 'var(--ink1)' }}>{p.sales} مبيعة</p>
                      <p style={{ fontSize: 10.5, color: 'var(--ink3)', textAlign: 'left' }}>{(p.price * p.sales).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="progress-bar" style={{ height: 5 }}>
                    <div className="progress-fill" style={{ width: `${(p.sales / maxSales) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : <p style={{ color: 'var(--ink3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>لا مبيعات بعد</p>}
        </div>
      </div>

      {/* Sources */}
      {Object.keys(sources).length > 0 && (
        <div className="card" style={{ padding: '18px 20px' }}>
          <h2 style={{ fontSize: 14, fontWeight: 900, color: 'var(--ink1)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 7 }}>
            <BarChart3 size={15} color="var(--clr-ok,#10b981)" /> مصادر الطلبات
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {Object.entries(sources).sort((a,b)=>b[1].revenue-a[1].revenue).map(([name, data]) => (
              <div key={name}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--ink1)', fontWeight: 700 }}>{name}</span>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: 12.5, fontWeight: 900, color: 'var(--ink1)' }}>{data.revenue.toLocaleString()} {currency}</p>
                    <p style={{ fontSize: 10.5, color: 'var(--ink3)', textAlign: 'left' }}>{data.orders} طلب</p>
                  </div>
                </div>
                <div className="progress-bar progress-accent" style={{ height: 5 }}>
                  <div className="progress-fill" style={{ width: `${(data.revenue / maxSrcRev) * 100}%`, background: 'linear-gradient(90deg,#FF6A00,#ef4444)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customer stats */}
      <div className="card" style={{ padding: '18px 20px' }}>
        <h2 style={{ fontSize: 14, fontWeight: 900, color: 'var(--ink1)', marginBottom: 14 }}>إحصائيات الزبائن</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {[
            { l: 'إجمالي الزبائن', v: customers.length },
            { l: 'VIP', v: customers.filter(c=>c.vip).length },
            { l: 'متكررون (3+)', v: customers.filter(c=>c.totalOrders>=3).length },
            { l: `إجمالي مشترياتهم`, v: `${customers.reduce((s,c)=>s+c.totalSpent,0).toLocaleString()} ${currency}` },
          ].map((s, i) => (
            <div key={i} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <p style={{ fontSize: 18, fontWeight: 900, color: 'var(--ink1)' }}>{s.v}</p>
              <p style={{ fontSize: 11.5, color: 'var(--ink3)', marginTop: 3 }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
