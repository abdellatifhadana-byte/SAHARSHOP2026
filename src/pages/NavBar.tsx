import { useStore } from '../store';
import type { Page } from '../types';
import {
  LayoutDashboard, BarChart3, Settings, Tag,
  Search, LogOut, ExternalLink, Sun, Moon, Plus,
} from 'lucide-react';
import { NavIconCart, NavIconTruck, NavIconBrain, NavIconPackage, NavIconMessage } from '../components/icons';
import React from 'react';
import GlobalSearch from '../components/GlobalSearch';
import type { Lang } from '../i18n';

const LANGS: { code: Lang; flag: string; label: string }[] = [
  { code: 'ar',     flag: '🇸🇦', label: 'العربية'  },
  { code: 'darija', flag: '🇲🇦', label: 'الدارجة'  },
  { code: 'fr',     flag: '🇫🇷', label: 'Français' },
  { code: 'en',     flag: '🇬🇧', label: 'English'  },
];

function LangSwitcher({ compact = false }: { compact?: boolean }) {
  const { settings, updateSettings } = useStore();
  const lang: Lang = ((settings.brand as any)?.language || 'ar') as Lang;
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const cur = LANGS.find(l => l.code === lang) || LANGS[0];
  const isRtl = lang === 'ar' || lang === 'darija';

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        title="تغيير اللغة"
        style={{
          display: 'flex', alignItems: 'center', gap: compact ? 0 : 5,
          padding: compact ? '4px 6px' : '4px 10px',
          borderRadius: 8, background: 'rgba(255,255,255,.05)',
          border: '1px solid var(--border)', color: 'var(--ink2)',
          cursor: 'pointer', fontSize: compact ? 15 : 12, fontWeight: 600,
          fontFamily: 'inherit',
        }}
      >
        <span style={{ fontSize: 14, lineHeight: 1 }}>{cur.flag}</span>
        {!compact && <span>{cur.label}</span>}
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          top: '110%',
          ...(isRtl ? { right: 0 } : { left: 0 }),
          minWidth: 145,
          background: 'var(--panel,#111827)',
          border: '1px solid rgba(255,255,255,.09)',
          borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 12px 36px rgba(0,0,0,.4)',
          zIndex: 9999,
        }}>
          {LANGS.map(l => (
            <button key={l.code}
              onClick={() => { updateSettings('brand', { ...(settings.brand as any), language: l.code }); setOpen(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 14px',
                background: l.code === lang ? 'rgba(255,106,0,.1)' : 'transparent',
                border: 'none', color: l.code === lang ? '#FF6A00' : 'var(--ink2)',
                fontSize: 13, fontWeight: l.code === lang ? 800 : 500,
                cursor: 'pointer', fontFamily: 'inherit',
                textAlign: isRtl ? 'right' : 'left',
                transition: 'background .12s',
              }}
              onMouseEnter={e => { if (l.code !== lang) e.currentTarget.style.background = 'rgba(255,255,255,.05)'; }}
              onMouseLeave={e => { if (l.code !== lang) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 16 }}>{l.flag}</span>
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const MAIN_NAV: { page: Page; icon: any; label: string }[] = [
  { page: 'dashboard',   icon: LayoutDashboard, label: 'الرئيسية'   },
  { page: 'products',    icon: NavIconPackage,  label: 'المنتجات'   },
  { page: 'orders',      icon: NavIconCart,     label: 'الطلبات'    },
  { page: 'insights',    icon: BarChart3,       label: 'الأداء'     },
  { page: 'connections', icon: NavIconBrain,    label: 'الاتصالات'  },
  { page: 'settings',    icon: Settings,        label: 'الإعدادات'  },
];

// Custom PNG icons — drop files in /public/icons/
// Falls back to default icon if PNG not found
const NAV_ICON_MAP: Record<string, string> = {
  dashboard:     '/icons/home',
  products:      '/icons/products',
  orders:        '/icons/orders',
  conversations: '/icons/messages',
};
const FAB_ICON = '/icons/fab';

/** Renders a custom PNG icon with fallback to a Lucide component */
function NavIcon({ page, FallbackIcon, size = 22, cssSize, active = false }: {
  page: string; FallbackIcon: any; size?: number; cssSize?: string; active?: boolean;
}) {
  const base = NAV_ICON_MAP[page];
  const [useFallback, setUseFallback] = React.useState(false);
  if (!base || useFallback) {
    return <FallbackIcon size={size} strokeWidth={active ? 2.4 : 1.8}
      style={cssSize ? { width: cssSize, height: cssSize } : undefined} />;
  }
  return (
    <img
      src={`${base}.png`}
      onError={(e) => {
        const t = e.currentTarget;
        if (!t.dataset.tried) { t.dataset.tried = '1'; t.src = `${base}.svg`; }
        else setUseFallback(true);
      }}
      alt={page}
      style={{ width: cssSize || size, height: cssSize || size, objectFit: 'contain', display: 'block',
        filter: active ? 'none' : 'brightness(0.6)',
        transition: 'filter .15s',
      }}
    />
  );
}

function FabIcon({ open }: { open: boolean }) {
  const [useFallback, setUseFallback] = React.useState(false);
  const rot: React.CSSProperties = {
    transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
    transition: 'transform .22s cubic-bezier(.4,0,.2,1)',
    display: 'block',
  };
  if (useFallback) return <Plus size={40} strokeWidth={2.8} style={rot} color="var(--ember)" />;
  return (
    <img
      src={`${FAB_ICON}.png`}
      onError={(e) => {
        const t = e.currentTarget;
        if (!t.dataset.tried) { t.dataset.tried = '1'; t.src = `${FAB_ICON}.svg`; }
        else setUseFallback(true);
      }}
      alt="+"
      style={{ width: 42, height: 42, objectFit: 'contain', ...rot }}
    />
  );
}

export default function NavBar() {
  const {
    currentPage, setPage, settings, updateSettings,
    orders, conversations, notifications,
    sidebarOpen, setSidebarOpen, logout, user
  } = useStore();

  const [showSearch, setShowSearch] = React.useState(false);
  const [fabOpen, setFabOpen] = React.useState(false);
  const [navHidden, setNavHidden] = React.useState(false);

  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setShowSearch(v => !v); }
      if (e.key === 'Escape') setShowSearch(false);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  React.useEffect(() => {
    let lastY = 0;
    const handler = () => {
      const y = window.scrollY || document.documentElement.scrollTop ||
        document.querySelector('.page-content')?.scrollTop || 0;
      const delta = y - lastY;
      if (delta > 8 && y > 60) setNavHidden(true);
      else if (delta < -8) setNavHidden(false);
      lastY = y;
    };
    const el = document.querySelector('.page-content') as HTMLElement;
    if (el) el.addEventListener('scroll', handler, { passive: true });
    window.addEventListener('scroll', handler, { passive: true });
    return () => {
      if (el) el.removeEventListener('scroll', handler);
      window.removeEventListener('scroll', handler);
    };
  }, []);

  const pending   = orders.filter(o => o.status === 'pending').length;
  const unreadMsg = conversations.reduce((s: number, c: any) => s + (c.unread || 0), 0);
  const unreadN   = notifications.filter((n: any) => !n.read).length;
  const isDark    = settings.design?.theme !== 'light';

  const badge = (p: Page) =>
    p === 'orders' ? pending : p === 'conversations' ? unreadMsg : p === 'notifications' ? unreadN : 0;

  const go = (p: Page) => { setPage(p); setSidebarOpen(false); };

  const doFabAction = (action: string, page: Page) => {
    try { localStorage.setItem('pendingFab', action); } catch {}
    go(page);
    setFabOpen(false);
  };

  const userId = user?.id || (() => {
    try { const u = localStorage.getItem('ai_commerce_user'); return u ? JSON.parse(u)?.id : null; } catch { return null; }
  })();
  const storeLink = userId ? `/store/${userId}` : null;

  const totalAlerts = pending + unreadMsg;

  return (
    <>
      {showSearch && <GlobalSearch onClose={() => setShowSearch(false)} />}

      {/* ══ DESKTOP NAV ══ */}
      <header className="topnav topnav-desktop">
        {/* Logo */}
        <div className="nav-logo">
          <div style={{ width: 32, height: 32, borderRadius: 9, overflow: 'hidden', background: 'var(--void)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 12px rgba(255,106,0,.2)' }}>
            <img src="/sahar-logo-text.png" alt="S" style={{ width: '88%', height: '88%', objectFit: 'contain' }}
              onError={e => { const el = e.currentTarget as HTMLImageElement; el.style.display = 'none'; (el.parentElement as HTMLElement).innerHTML = '<span style="font-size:14px;font-weight:900;color:#FF6A00;font-family:monospace">S</span>'; }} />
          </div>
          <span className="nav-brand">{settings.brand.name || 'SAHAR shop'}</span>
        </div>

        {/* Main Nav */}
        <nav className="nav-links" style={{ flex: 1 }}>
          {MAIN_NAV.map(item => {
            const active = currentPage === item.page || (item.page === 'insights' && currentPage === 'analytics');
            const b = badge(item.page);
            return (
              <button key={item.page} onClick={() => go(item.page)} className={`nav-item${active ? ' active' : ''}`}>
                <item.icon size={13} strokeWidth={2.1} />
                {item.label}
                {b > 0 && <span className="nav-badge">{b > 9 ? '9+' : b}</span>}
              </button>
            );
          })}
        </nav>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* Messages badge button */}
          <button
            onClick={() => go('conversations')}
            style={{ position: 'relative', width: 32, height: 32, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: currentPage === 'conversations' ? 'var(--ember-soft)' : 'rgba(255,255,255,.05)', border: `1px solid ${currentPage === 'conversations' ? 'rgba(255,106,0,.3)' : 'var(--border)'}`, color: currentPage === 'conversations' ? 'var(--ember)' : 'var(--ink3)', cursor: 'pointer', transition: 'all .15s' }}
            title="الرسائل"
          >
            <NavIconMessage size={14} />
            {unreadMsg > 0 && (
              <span style={{ position: 'absolute', top: -3, right: -3, width: 14, height: 14, background: 'var(--ember)', borderRadius: '50%', fontSize: 8, fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 6px rgba(255,106,0,.5)' }}>
                {unreadMsg > 9 ? '9' : unreadMsg}
              </span>
            )}
          </button>

          {storeLink && (
            <a href={storeLink} target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 'var(--r-sm)', background: 'var(--mint-soft)', border: '1px solid rgba(0,210,179,.22)', color: 'var(--mint)', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
              <ExternalLink size={11} strokeWidth={2.5} /> متجري
            </a>
          )}

          <button onClick={() => setShowSearch(true)}
            style={{ width: 32, height: 32, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)', color: 'var(--ink3)', cursor: 'pointer' }}>
            <Search size={14} strokeWidth={2.2} />
          </button>

          {settings.ai?.humanSimulation && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, background: 'var(--mint-soft)', border: '1px solid rgba(0,210,179,.2)' }}>
              <span className="dot-live" />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--mint)' }}>AI</span>
            </div>
          )}

          <LangSwitcher />

          <button
            onClick={() => updateSettings('design', { ...settings.design, theme: isDark ? 'light' : 'dark' })}
            style={{ width: 32, height: 32, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)', color: 'var(--ink3)', cursor: 'pointer' }}
            title={isDark ? 'وضع النهار' : 'وضع الليل'}>
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          <button onClick={() => { if (window.confirm('هل تريد الخروج؟')) logout(); }}
            style={{ width: 32, height: 32, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ember-soft)', border: '1px solid rgba(255,106,0,.2)', color: 'var(--ember)', cursor: 'pointer' }}
            title="خروج">
            <LogOut size={13} strokeWidth={2.5} />
          </button>
        </div>
      </header>

      {/* ══ MOBILE TOP BAR ══ */}
      <header className="topnav topnav-mobile">
        <div className="nav-logo">
          <div style={{ width: 28, height: 28, borderRadius: 8, overflow: 'hidden', background: 'var(--void)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/sahar-logo-text.png" alt="S" style={{ width: '88%', height: '88%', objectFit: 'contain' }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.parentElement as HTMLElement).innerHTML = '<span style="font-size:12px;font-weight:900;color:#FF6A00">S</span>'; }} />
          </div>
          <span className="nav-brand" style={{ fontSize: 13, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {settings.brand.name}
          </span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, paddingRight: 8 }}>
          {settings.ai?.humanSimulation && <span className="dot-live" title="AI نشط" />}
          {totalAlerts > 0 && <span className="badge badge-ember" style={{ fontSize: 10 }}>{totalAlerts}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => setShowSearch(true)}
            style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)', color: 'var(--ink2)', cursor: 'pointer' }}>
            <Search size={14} />
          </button>
          <button onClick={() => go('settings')}
            style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)', color: 'var(--ink2)', cursor: 'pointer' }}>
            <Settings size={14} />
          </button>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)', color: 'var(--ink2)', cursor: 'pointer' }}>
            {sidebarOpen
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6 6 18M6 6l12 12" /></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
            }
          </button>
        </div>
      </header>

      {/* ══ MOBILE SIDEBAR ══ */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}>
          <div className="sidebar-panel" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="nav-logo">
                <div style={{ width: 26, height: 26, borderRadius: 7, overflow: 'hidden', background: 'var(--void)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/sahar-logo-text.png" alt="S" style={{ width: '88%', height: '88%', objectFit: 'contain' }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.parentElement as HTMLElement).innerHTML = '<span style="font-size:11px;font-weight:900;color:#FF6A00">S</span>'; }} />
                </div>
                <span className="nav-brand" style={{ fontSize: 13 }}>{settings.brand.name}</span>
              </div>
              <button onClick={() => setSidebarOpen(false)}
                style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)', color: 'var(--ink2)', cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
            {storeLink && (
              <a href={storeLink} target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 18px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 700, color: 'var(--mint)', background: 'var(--mint-soft)', textDecoration: 'none' }}>
                <ExternalLink size={15} /> متجري للزبائن
              </a>
            )}
            <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
              {[...MAIN_NAV,
                { page: 'conversations' as Page, icon: NavIconMessage, label: 'الرسائل' },
                { page: 'delivery' as Page, icon: NavIconTruck, label: 'التوصيل' },
                { page: 'coupons' as Page, icon: Tag, label: 'الكوبونات' },
                { page: 'import'    as Page, icon: NavIconMessage, label: '📥 استيراد المحادثات' },
                { page: 'services'  as Page, icon: NavIconPackage,  label: '🔧 الخدمات' },
              ].map(item => {
                const active = currentPage === item.page || (item.page === 'insights' && currentPage === 'analytics');
                const b = badge(item.page);
                return (
                  <button key={item.page} onClick={() => go(item.page)} className={`sidebar-item${active ? ' active' : ''}`}>
                    <item.icon size={16} strokeWidth={2} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {b > 0 && (
                      <span style={{ minWidth: 18, height: 18, borderRadius: 99, background: 'var(--ember)', color: '#fff', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{b}</span>
                    )}
                  </button>
                );
              })}
            </nav>
            <div style={{ padding: '12px 16px 14px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <LangSwitcher />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => updateSettings('design', { ...settings.design, theme: isDark ? 'light' : 'dark' })}
                  style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)', color: 'var(--ink2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
                  {isDark ? '☀️ نهار' : '🌙 ليل'}
                </button>
                <button onClick={() => { if (window.confirm('خروج؟')) logout(); }}
                  style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'var(--ember-soft)', border: '1px solid rgba(255,106,0,.2)', color: 'var(--ember)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
                  <LogOut size={13} /> خروج
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ MOBILE BOTTOM NAV ══ */}

      {/* FAB action sheet backdrop */}
      {fabOpen && (
        <div
          onClick={() => setFabOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 999,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* FAB action sheet */}
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 70, zIndex: 1000,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        transform: fabOpen ? 'translateY(0)' : 'translateY(20px)',
        opacity: fabOpen ? 1 : 0,
        pointerEvents: fabOpen ? 'auto' : 'none',
        transition: 'transform 0.22s cubic-bezier(.4,0,.2,1), opacity 0.18s ease',
        padding: '0 24px 8px',
      }}>
        {[
          { emoji: '📦', label: 'إضافة منتج',  action: 'addProduct',  page: 'products'  as Page },
          { emoji: '🔧', label: 'إضافة خدمة',  action: 'addService',  page: 'products'  as Page },
          { emoji: '👤', label: 'إضافة زبون',  action: 'addCustomer', page: 'customers' as Page },
        ].map((item, i) => (
          <button
            key={item.action}
            onClick={() => doFabAction(item.action, item.page)}
            style={{
              width: '100%', maxWidth: 280,
              padding: '14px 22px',
              borderRadius: 18,
              background: i === 0 ? 'linear-gradient(135deg,rgba(255,106,0,.18),rgba(255,133,51,.12))' : i === 1 ? 'linear-gradient(135deg,rgba(139,92,246,.18),rgba(124,111,250,.12))' : 'linear-gradient(135deg,rgba(0,210,179,.18),rgba(0,237,202,.12))',
              border: i === 0 ? '1px solid rgba(255,106,0,.35)' : i === 1 ? '1px solid rgba(139,92,246,.35)' : '1px solid rgba(0,210,179,.35)',
              color: 'var(--ink1)',
              fontSize: 15,
              fontWeight: 800,
              fontFamily: 'inherit',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              boxShadow: i === 0 ? '0 4px 24px rgba(255,106,0,0.2), 0 0 40px rgba(255,106,0,0.06)' : i === 1 ? '0 4px 24px rgba(139,92,246,0.2)' : '0 4px 24px rgba(0,210,179,0.2)',
              backdropFilter: 'blur(12px)',
              transform: fabOpen ? 'translateY(0)' : 'translateY(10px)',
              opacity: fabOpen ? 1 : 0,
              transition: `transform 0.2s cubic-bezier(.4,0,.2,1) ${i * 0.04}s, opacity 0.16s ease ${i * 0.04}s`,
            }}
          >
            <span style={{ fontSize: 20 }}>{item.emoji}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <nav className="mobile-bottom-nav" style={{
        display: 'flex', alignItems: 'center',
        transform: navHidden ? 'translateY(100%)' : 'translateY(0)',
        transition: 'transform 0.3s cubic-bezier(.4,0,.2,1)',
      }}>
        {/* Left 2: الرئيسية + المنتجات — always visible */}
        {[
          { page: 'dashboard' as Page, icon: LayoutDashboard, label: 'الرئيسية' },
          { page: 'products'  as Page, icon: NavIconPackage,  label: 'المنتجات' },
        ].map(item => {
          const active = currentPage === item.page;
          const b = badge(item.page);
          return (
            <button key={item.page} className={`mob-nav-btn${active ? ' active' : ''}`} onClick={() => go(item.page)}
              style={{ flex: 1 }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <NavIcon page={item.page} FallbackIcon={item.icon} size={30} cssSize="clamp(28px,5vw,44px)" active={active} />
                {b > 0 && (
                  <span style={{ position: 'absolute', top: -5, right: -7, width: 16, height: 16, background: 'var(--ember)', borderRadius: '50%', fontSize: 9, fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 8px rgba(255,106,0,.6)' }}>
                    {b > 9 ? '9' : b}
                  </span>
                )}
              </div>
            </button>
          );
        })}

        {/* Central FAB — icon only, ember glow, no circle */}
        <div style={{ flex: '0 0 80px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
          <button
            onClick={() => { if (navHidden) { setNavHidden(false); } else { setFabOpen(v => !v); } }}
            style={{
              width: 62, height: 62,
              borderRadius: '50%',
              background: 'transparent',
              border: 'none',
              color: 'var(--ember)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              position: 'absolute',
              bottom: 5,
              filter: 'drop-shadow(0 0 14px rgba(255,106,0,0.9)) drop-shadow(0 0 6px rgba(255,106,0,0.6))',
              transition: 'filter 0.2s ease, transform 0.22s cubic-bezier(.4,0,.2,1)',
              zIndex: 10,
            }}
            onMouseEnter={e => e.currentTarget.style.filter = 'drop-shadow(0 0 16px rgba(255,106,0,1)) drop-shadow(0 0 6px rgba(255,106,0,0.8))'}
            onMouseLeave={e => e.currentTarget.style.filter = 'drop-shadow(0 0 10px rgba(255,106,0,0.85)) drop-shadow(0 0 4px rgba(255,106,0,0.5))'}
            aria-label="قائمة الإجراءات"
          >
            <FabIcon open={fabOpen} />
          </button>
        </div>

        {/* Right side: الطلبات + الرسائل — always visible */}
        {[
          { page: 'orders'        as Page, icon: NavIconCart,    label: 'الطلبات'  },
          { page: 'conversations' as Page, icon: NavIconMessage, label: 'الرسائل' },
        ].map(item => {
          const active = currentPage === item.page;
          const b = badge(item.page);
          return (
            <button key={item.page} className={`mob-nav-btn${active ? ' active' : ''}`} onClick={() => go(item.page)}
              style={{ flex: 1 }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <NavIcon page={item.page} FallbackIcon={item.icon} size={30} cssSize="clamp(28px,5vw,44px)" active={active} />
                {b > 0 && (
                  <span style={{ position: 'absolute', top: -5, right: -7, width: 16, height: 16, background: 'var(--ember)', borderRadius: '50%', fontSize: 9, fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 8px rgba(255,106,0,.6)' }}>
                    {b > 9 ? '9' : b}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>

    </>
  );
}
