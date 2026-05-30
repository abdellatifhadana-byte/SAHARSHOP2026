import React from 'react';
import { lazy, Suspense, useEffect } from 'react';
import { useStore } from '../store';
import NavBar from './NavBar';
import GlobalSearch from '../components/GlobalSearch';

// ── Skeleton fallback ─────────────────────────────
function PageSkeleton() {
  return (
    <div style={{ padding:'20px 0', display:'flex', flexDirection:'column', gap:12, maxWidth:1100, margin:'0 auto' }}>
      <div className="skeleton" style={{ height:100, borderRadius:18 }}/>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
        {[1,2,3].map(i=><div key={i} className="skeleton" style={{ height:80, borderRadius:14 }}/>)}
      </div>
      {[1,2,3].map(i=><div key={i} className="skeleton" style={{ height:56, borderRadius:12 }}/>)}
    </div>
  );
}

// ── Lazy pages ────────────────────────────────────
const DashboardPage     = lazy(() => import('./DashboardPage'));
const ProductsPage      = lazy(() => import('./ProductsPage'));
const OrdersPage        = lazy(() => import('./OrdersPage'));
const MessagesPage      = lazy(() => import('./MessagesPage'));
const CustomersPage     = lazy(() => import('./CustomersPage'));
const AnalyticsPage     = lazy(() => import('./AnalyticsPage'));
const ConnectionsPage   = lazy(() => import('./ConnectionsPage'));
const DeliveryPage      = lazy(() => import('./DeliveryPage'));
const NotificationsPage = lazy(() => import('./NotificationsPage'));
const SettingsPage      = lazy(() => import('./SettingsPage'));
const BannerStudioPage  = lazy(() => import('./BannerStudioPage'));
const ImageEditorPage   = lazy(() => import('./ImageEditorPage'));
const ChatImportPage    = lazy(() => import('./ChatImportPage'));
const CouponsPage       = lazy(() => import('./CouponsPage'));

function PageContent() {
  const { currentPage } = useStore();
  switch (currentPage) {
    case 'dashboard':     return <DashboardPage />;
    case 'products':      return <ProductsPage />;
    case 'orders':        return <OrdersPage />;
    case 'conversations': return <MessagesPage />;
    case 'customers':     return <CustomersPage />;
    case 'analytics':     return <AnalyticsPage />;
    case 'connections':   return <ConnectionsPage />;
    case 'delivery':      return <DeliveryPage />;
    case 'notifications': return <NotificationsPage />;
    case 'settings':      return <SettingsPage />;
    case 'banner':        return <BannerStudioPage />;
    case 'editor':        return <ImageEditorPage />;
    case 'import':        return <ChatImportPage />;
    case 'coupons':       return <CouponsPage />;
    case 'insights':      return <AnalyticsPage />;
    default:              return <DashboardPage />;
  }
}

export default function MainLayout() {
  const { token, isOnline } = useStore();
  const [showSearch, setShowSearch] = React.useState(false);

  // Listen for Ctrl+K
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(v => !v);
      }
      if (e.key === 'Escape') setShowSearch(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Preload critical pages in background
  useEffect(() => {
    const t = setTimeout(() => {
      import('./ProductsPage');
      import('./OrdersPage');
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--void)', display: 'flex', flexDirection: 'column' }}>
      <NavBar />
      {showSearch && <GlobalSearch onClose={() => setShowSearch(false)} />}
      {/* Offline banner */}
      {!isOnline && (
        <div style={{
          background: 'rgba(245,158,11,.15)', borderBottom: '1px solid rgba(245,158,11,.3)',
          padding: '8px 16px', textAlign: 'center', fontSize: 12, color: '#f59e0b',
          fontWeight: 700, zIndex: 50,
        }}>
          ⚠️ وضع غير متصل — البيانات محلية فقط
        </div>
      )}
      {/* Main content */}
      <main style={{ flex:1, paddingTop:56, paddingBottom:80, overflowX:'hidden', minHeight:'100dvh' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'20px 16px' }}>
          <Suspense fallback={<PageSkeleton />}>
            <PageContent />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
