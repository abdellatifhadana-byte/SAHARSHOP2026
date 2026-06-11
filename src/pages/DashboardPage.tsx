import React from 'react';
import { useStore } from '../store';
import {
  ShoppingBag, MessageCircle, Users, TrendingUp,
  ChevronRight, AlertTriangle, ChevronDown, ChevronUp, Bell,
  ArrowUpRight, ArrowDownRight, Package, Zap,
} from 'lucide-react';
import { isPushSupported, getPushPermission, subscribeToPush } from '../lib/pushNotifications';

const STATUS_AR: Record<string,string> = {
  pending:'بانتظار', approved:'موافقة', processing:'جارٍ',
  shipped:'شُحن', delivered:'وُصّل', cancelled:'ملغي',
};

function DashboardSkeleton() {
  const pulse: React.CSSProperties = {
    borderRadius: 12, background: 'rgba(255,255,255,0.03)',
    animation: 'pulse 1.6s ease-in-out infinite',
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`@keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 0.8; } }`}</style>
      <div style={{ ...pulse, height: 48 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[1,2,3,4].map(i => <div key={i} style={{ ...pulse, height: 100 }} />)}
      </div>
      <div style={{ ...pulse, height: 200 }} />
    </div>
  );
}

export default function DashboardPage() {
  const { settings, products, orders, customers, conversations, setPage, isLoading, token } = useStore();
  const [showDetails, setShowDetails] = React.useState(false);
  const [pushSupported, setPushSupported] = React.useState(false);
  const [pushPerm, setPushPerm] = React.useState<NotificationPermission>('default');
  const [pushLoading, setPushLoading] = React.useState(false);

  React.useEffect(() => {
    isPushSupported().then(s => {
      setPushSupported(s);
      if (s) setPushPerm(getPushPermission());
    });
  }, []);

  const handleEnablePush = async () => {
    setPushLoading(true);
    const ok = await subscribeToPush(token || '');
    setPushLoading(false);
    if (ok) setPushPerm('granted');
  };

  if (isLoading) return <DashboardSkeleton />;

  const { currency } = settings.brand;
  const active = orders.filter(o => o.status !== 'cancelled');
  const revenue = active.reduce((s, o) => s + o.total, 0);
  const today = new Date().toISOString().split('T')[0];
  const todayRev = active.filter(o => o.createdAt?.startsWith(today)).reduce((s, o) => s + o.total, 0);
  const pending = orders.filter(o => o.status === 'pending').length;
  const unread = conversations.reduce((s, c) => s + c.unread, 0);
  const low = products.filter(p => p.stock >= 0 && p.stock <= settings.products.lowStockAlert).length;
  const published = products.filter(p => p.status === 'published').length;

  const kpiCards = [
    { label: 'الإيراد', value: revenue.toLocaleString(), unit: currency, sub: `اليوم: ${todayRev.toLocaleString()} ${currency}`, color: '#22C55E', icon: TrendingUp, page: 'analytics' as const, trend: 'up' },
    { label: 'الطلبات', value: String(active.length), unit: 'طلب', sub: pending > 0 ? `${pending} معلق` : 'لا معلقة', color: '#F59E0B', icon: ShoppingBag, page: 'orders' as const, trend: pending > 0 ? 'warn' : 'good' },
    { label: 'الرسائل', value: String(unread || conversations.length), unit: unread > 0 ? 'غير مقروء' : 'محادثة', sub: 'AI نشط', color: '#7C3AED', icon: MessageCircle, page: 'conversations' as const, trend: 'neutral' },
    { label: 'الزبائن', value: String(customers.length), unit: 'زبون', sub: `${customers.filter(c => c.vip).length} VIP`, color: '#3B82F6', icon: Users, page: 'customers' as const, trend: 'good' },
  ];

  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4);
  const lowStockProducts = products.filter(p => p.stock >= 0 && p.stock <= settings.products.lowStockAlert);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Welcome + Push */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 24, fontWeight: 900, marginBottom: 2 }}>
            مرحباً 👋
          </h1>
          <p style={{ fontSize: 13, color: '#999' }}>
            {pending > 0 ? `عندك ${pending} طلب جديد ينتظر` : 'كل شيء على ما يرام'}
          </p>
        </div>

        {pushSupported && pushPerm === 'default' && (
          <button onClick={handleEnablePush} disabled={pushLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', borderRadius: 10,
              background: '#7C3AED', border: 'none',
              color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              opacity: pushLoading ? 0.6 : 1,
            }}>
            <Bell size={14} /> تفعيل الإشعارات
          </button>
        )}
      </div>

      {/* Revenue Hero */}
      <div style={{
        padding: '28px 24px', borderRadius: 20,
        background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(255,122,0,0.08))',
        border: '1px solid rgba(124,58,237,0.15)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.2), transparent 70%)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 12, color: '#999', marginBottom: 8, fontWeight: 600 }}>الإيراد الإجمالي</div>
          <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 12 }}>
            {revenue.toLocaleString()} <span style={{ fontSize: 20, color: '#999', fontWeight: 500 }}>{currency}</span>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
            <span style={{ color: '#22C55E' }}>↑ اليوم: {todayRev.toLocaleString()} {currency}</span>
            <span style={{ color: '#999' }}>{active.length} طلب نشط</span>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {kpiCards.map(k => (
          <button key={k.label} onClick={() => setPage(k.page)}
            style={{
              padding: '18px 16px', borderRadius: 16, cursor: 'pointer', fontFamily: 'inherit',
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
              textAlign: 'right', transition: 'all 0.2s ease',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${k.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <k.icon size={15} color={k.color} />
              </div>
              <span style={{ fontSize: 11, color: '#999', fontWeight: 600 }}>{k.label}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 3 }}>{k.value}</div>
            <div style={{ fontSize: 10, color: '#999' }}>{k.sub}</div>
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button onClick={() => setPage('products')}
          style={{ padding: '14px', borderRadius: 14, background: '#7C3AED', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Package size={16} /> إضافة منتج
        </button>
        <button onClick={() => setPage('orders')}
          style={{ padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#FAFAFA', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <ShoppingBag size={16} /> الطلبات
        </button>
      </div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div style={{ borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>آخر الطلبات</span>
            <button onClick={() => setPage('orders')} style={{ background: 'none', border: 'none', color: '#A855F7', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              عرض الكل <ChevronRight size={13} />
            </button>
          </div>
          {recentOrders.map(o => (
            <div key={o.id} style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              onClick={() => setPage('orders')}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{o.customerName}</div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{o.city || '—'} · {o.source || 'مباشر'}</div>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{o.total.toLocaleString()} {currency}</div>
                <div style={{ marginTop: 3 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: o.status === 'pending' ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)', color: o.status === 'pending' ? '#F59E0B' : '#22C55E' }}>
                    {STATUS_AR[o.status] || o.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div style={{ padding: '16px 18px', borderRadius: 16, background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <AlertTriangle size={14} color="#F59E0B" />
            <span style={{ fontWeight: 700, color: '#F59E0B', fontSize: 13 }}>{lowStockProducts.length} منتج مخزونه منخفض</span>
          </div>
          {lowStockProducts.slice(0, 3).map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: '#999' }}>
              <span>{p.emoji} {p.name}</span>
              <span style={{ color: p.stock === 0 ? '#EF4444' : '#F59E0B', fontWeight: 700 }}>
                {p.stock === 0 ? 'نفد' : `${p.stock} قطعة`}
              </span>
            </div>
          ))}
          <button onClick={() => setPage('products')} style={{ marginTop: 10, width: '100%', padding: '8px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            إدارة المخزون
          </button>
        </div>
      )}
    </div>
  );
}