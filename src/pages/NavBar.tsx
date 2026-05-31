import { useStore } from '../store';
import type { Page } from '../types';
import {
  LayoutDashboard, BarChart3, Settings, Tag,
  Search, LogOut, ExternalLink, Sun, Moon, Plus,
  Users, MoreHorizontal, X,
} from 'lucide-react';
import { NavIconCart, NavIconTruck, NavIconBrain, NavIconPackage, NavIconMessage } from '../components/icons';
import React from 'react';
import GlobalSearch from '../components/GlobalSearch';

const MAIN_NAV: { page: Page; icon: any; label: string }[] = [
  { page: 'dashboard',   icon: LayoutDashboard, label: 'الرئيسية'   },
  { page: 'products',    icon: NavIconPackage,  label: 'المنتجات'   },
  { page: 'orders',      icon: NavIconCart,     label: 'الطلبات'    },
  { page: 'insights',    icon: BarChart3,       label: 'الأداء'     },
  { page: 'connections', icon: NavIconBrain,    label: 'الاتصالات'  },
  { page: 'settings',    icon: Settings,        label: 'الإعدادات'  },
];

export default function NavBar() {
  const {
    currentPage, setPage, settings, updateSettings,
    orders, conversations, notifications,
    sidebarOpen, setSidebarOpen, logout, user
  } = useStore();

  const [showSearch, setShowSearch] = React.useState(false);
  const [fabOpen, setFabOpen] = React.useState(false);
  const [moreOpen, setMoreOpen] = React.useState(false);

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
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
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
              width: '100%', maxWidth: 260,
              padding: '12px 20px',
              borderRadius: 14,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--ink)',
              fontSize: 15,
              fontWeight: 700,
              fontFamily: 'inherit',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
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

      <nav className="mobile-bottom-nav" style={{ display: 'flex', alignItems: 'center' }}>
        {/* Left 2: الرئيسية + المنتجات */}
        {[
          { page: 'dashboard' as Page, icon: LayoutDashboard, label: 'الرئيسية' },
          { page: 'products'  as Page, icon: NavIconPackage,  label: 'المنتجات' },
        ].map(item => {
          const active = currentPage === item.page;
          const b = badge(item.page);
          return (
            <button key={item.page} className={`mob-nav-btn${active ? ' active' : ''}`} onClick={() => go(item.page)}
              style={{ flex: 1 }}>
              <div style={{ position: 'relative' }}>
                <item.icon size={20} strokeWidth={active ? 2.4 : 1.8} />
                {b > 0 && (
                  <span style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, background: 'var(--ember)', borderRadius: '50%', fontSize: 8, fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 8px rgba(255,106,0,.5)' }}>
                    {b > 9 ? '9' : b}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Central FAB */}
        <div style={{ flex: '0 0 72px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
          <button
            onClick={() => setFabOpen(v => !v)}
            style={{
              width: 54, height: 54,
              borderRadius: '50%',
              background: 'var(--ember)',
              border: 'none',
              color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              position: 'absolute',
              bottom: 10,
              boxShadow: '0 4px 18px rgba(255,106,0,.55), 0 2px 8px rgba(0,0,0,.3)',
              transform: fabOpen ? 'rotate(45deg)' : 'rotate(0deg)',
              transition: 'transform 0.22s cubic-bezier(.4,0,.2,1), box-shadow 0.15s ease',
              zIndex: 10,
            }}
            aria-label="قائمة الإجراءات"
          >
            <Plus size={26} strokeWidth={2.5} />
          </button>
        </div>

        {/* Right 2: الطلبات + المزيد */}
        {[
          { page: 'orders' as Page, icon: NavIconCart, label: 'الطلبات' },
        ].map(item => {
          const active = currentPage === item.page;
          const b = badge(item.page);
          return (
            <button key={item.page} className={`mob-nav-btn${active ? ' active' : ''}`} onClick={() => go(item.page)}
              style={{ flex: 1 }}>
              <div style={{ position: 'relative' }}>
                <item.icon size={20} strokeWidth={active ? 2.4 : 1.8} />
                {b > 0 && (
                  <span style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, background: 'var(--ember)', borderRadius: '50%', fontSize: 8, fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 8px rgba(255,106,0,.5)' }}>
                    {b > 9 ? '9' : b}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* المزيد — opens bottom sheet */}
        <button className={`mob-nav-btn${moreOpen ? ' active' : ''}`} onClick={() => setMoreOpen(v => !v)} style={{ flex: 1 }}>
          <div style={{ position: 'relative' }}>
            <MoreHorizontal size={20} strokeWidth={moreOpen ? 2.4 : 1.8} />
            {totalAlerts > 0 && !pending && unreadMsg > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, background: 'var(--ember)', borderRadius: '50%', fontSize: 8, fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadMsg > 9 ? '9' : unreadMsg}</span>
            )}
          </div>
          <span>المزيد</span>
        </button>
      </nav>

      {/* ══ MOBILE "المزيد" BOTTOM SHEET ══ */}
      {moreOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
          onClick={() => setMoreOpen(false)} />
      )}
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: moreOpen ? 64 : -300, zIndex: 999,
        background: 'var(--panel2)', borderRadius: '20px 20px 0 0',
        border: '1px solid var(--border)', borderBottom: 'none',
        padding: '16px 16px 20px',
        transition: 'bottom 0.28s cubic-bezier(.4,0,.2,1)',
        boxShadow: '0 -8px 32px rgba(0,0,0,.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink2)' }}>قائمة التنقل</span>
          <button onClick={() => setMoreOpen(false)}
            style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,.06)', border: '1px solid var(--border)', color: 'var(--ink3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { page: 'conversations' as Page, icon: NavIconMessage, label: 'الرسائل',   badge: unreadMsg },
            { page: 'customers'     as Page, icon: Users,          label: 'الزبائن',   badge: 0 },
            { page: 'analytics'     as Page, icon: BarChart3,      label: 'التحليلات', badge: 0 },
            { page: 'delivery'      as Page, icon: NavIconTruck,   label: 'التوصيل',   badge: 0 },
            { page: 'coupons'       as Page, icon: Tag,            label: 'الكوبونات', badge: 0 },
            { page: 'connections'   as Page, icon: NavIconBrain,   label: 'الاتصالات', badge: 0 },
            { page: 'notifications' as Page, icon: null,           label: 'الإشعارات', badge: unreadN },
            { page: 'settings'      as Page, icon: Settings,       label: 'الإعدادات', badge: 0 },
          ].map(item => {
            const isActive = currentPage === item.page;
            const IconComp = item.icon;
            return (
              <button key={item.page}
                onClick={() => { go(item.page); setMoreOpen(false); }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  padding: '10px 4px', borderRadius: 12,
                  background: isActive ? 'var(--ember-soft)' : 'rgba(255,255,255,.04)',
                  border: `1px solid ${isActive ? 'rgba(255,106,0,.3)' : 'var(--border)'}`,
                  color: isActive ? 'var(--ember)' : 'var(--ink2)',
                  cursor: 'pointer', position: 'relative', fontFamily: 'inherit',
                }}>
                {item.badge > 0 && (
                  <span style={{ position: 'absolute', top: 6, right: 6, width: 14, height: 14, background: 'var(--ember)', borderRadius: '50%', fontSize: 8, fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
                {IconComp ? <IconComp size={18} strokeWidth={isActive ? 2.3 : 1.8} /> : <span style={{ fontSize: 18 }}>🔔</span>}
                <span style={{ fontSize: 10, fontWeight: 700 }}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
