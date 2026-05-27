import { useStore } from '../store';
import type { Page } from '../types';
import {
  LayoutDashboard, Package, ShoppingBag,
  BarChart3, Settings, MessageSquare,
  Search, LogOut, ExternalLink, Sun, Moon
} from 'lucide-react';
import React from 'react';
import GlobalSearch from '../components/GlobalSearch';

const MAIN_NAV: { page: Page; icon: any; label: string }[] = [
  { page: 'dashboard', icon: LayoutDashboard, label: 'الرئيسية'  },
  { page: 'products',  icon: Package,         label: 'المنتجات'  },
  { page: 'orders',    icon: ShoppingBag,     label: 'الطلبات'   },
  { page: 'insights',  icon: BarChart3,       label: 'الأداء'    },
  { page: 'settings',  icon: Settings,        label: 'الإعدادات' },
];

export default function NavBar() {
  const {
    currentPage, setPage, settings, updateSettings,
    orders, conversations, notifications,
    sidebarOpen, setSidebarOpen, logout, user
  } = useStore();

  const [showSearch, setShowSearch] = React.useState(false);

  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setShowSearch(v => !v); }
      if (e.key === 'Escape') setShowSearch(false);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const pending   = orders.filter(o => o.status === 'pending').length;
  const unreadMsg = conversations.reduce((s: number, c: any) => s + (c.unread || 0), 0);
  const unreadN   = notifications.filter((n: any) => !n.read).length;
  const isDark    = settings.design?.theme !== 'light';

  const badge = (p: Page) =>
    p === 'orders' ? pending : p === 'conversations' ? unreadMsg : p === 'notifications' ? unreadN : 0;

  const go = (p: Page) => { setPage(p); setSidebarOpen(false); };

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
          <div style={{ width: 32, height: 32, borderRadius: 9, overflow: 'hidden', background: 'var(--void)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 12px rgba(255,77,26,.2)' }}>
            <img src="/sahar-logo-text.png" alt="S" style={{ width: '88%', height: '88%', objectFit: 'contain' }}
              onError={e => { const el = e.currentTarget as HTMLImageElement; el.style.display = 'none'; (el.parentElement as HTMLElement).innerHTML = '<span style="font-size:14px;font-weight:900;color:#FF4D1A;font-family:monospace">S</span>'; }} />
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
            style={{ position: 'relative', width: 32, height: 32, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: currentPage === 'conversations' ? 'var(--ember-soft)' : 'rgba(255,255,255,.05)', border: `1px solid ${currentPage === 'conversations' ? 'rgba(255,77,26,.3)' : 'var(--border)'}`, color: currentPage === 'conversations' ? 'var(--ember)' : 'var(--ink3)', cursor: 'pointer', transition: 'all .15s' }}
            title="الرسائل"
          >
            <MessageSquare size={14} strokeWidth={2} />
            {unreadMsg > 0 && (
              <span style={{ position: 'absolute', top: -3, right: -3, width: 14, height: 14, background: 'var(--ember)', borderRadius: '50%', fontSize: 8, fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 6px rgba(255,77,26,.5)' }}>
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

          <button
            onClick={() => updateSettings('design', { ...settings.design, theme: isDark ? 'light' : 'dark' })}
            style={{ width: 32, height: 32, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)', color: 'var(--ink3)', cursor: 'pointer' }}
            title={isDark ? 'وضع النهار' : 'وضع الليل'}>
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          <button onClick={() => { if (window.confirm('هل تريد الخروج؟')) logout(); }}
            style={{ width: 32, height: 32, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ember-soft)', border: '1px solid rgba(255,77,26,.2)', color: 'var(--ember)', cursor: 'pointer' }}
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
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.parentElement as HTMLElement).innerHTML = '<span style="font-size:12px;font-weight:900;color:#FF4D1A">S</span>'; }} />
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
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.parentElement as HTMLElement).innerHTML = '<span style="font-size:11px;font-weight:900;color:#FF4D1A">S</span>'; }} />
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
              {[...MAIN_NAV, { page: 'conversations' as Page, icon: MessageSquare, label: 'الرسائل' }].map(item => {
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
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
              <button
                onClick={() => updateSettings('design', { ...settings.design, theme: isDark ? 'light' : 'dark' })}
                style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)', color: 'var(--ink2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
                {isDark ? '☀️ نهار' : '🌙 ليل'}
              </button>
              <button onClick={() => { if (window.confirm('خروج؟')) logout(); }}
                style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'var(--ember-soft)', border: '1px solid rgba(255,77,26,.2)', color: 'var(--ember)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
                <LogOut size={13} /> خروج
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MOBILE BOTTOM NAV ══ */}
      <nav className="mobile-bottom-nav">
        {MAIN_NAV.map(item => {
          const active = currentPage === item.page || (item.page === 'insights' && currentPage === 'analytics');
          const b = badge(item.page);
          return (
            <button key={item.page} className={`mob-nav-btn${active ? ' active' : ''}`} onClick={() => go(item.page)}>
              <div style={{ position: 'relative' }}>
                <item.icon size={20} strokeWidth={active ? 2.4 : 1.8} />
                {b > 0 && (
                  <span style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, background: 'var(--ember)', borderRadius: '50%', fontSize: 8, fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 8px rgba(255,77,26,.5)' }}>
                    {b > 9 ? '9' : b}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
