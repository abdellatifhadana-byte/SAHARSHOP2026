import { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useStore } from './store';
import AuthPage    from './pages/AuthPage';
import MainLayout  from './pages/MainLayout';
import LandingPage from './pages/LandingPage';
import Storefront  from './pages/Storefront';

const PAGE_URLS: Record<string, string> = {
  dashboard:     '/dashboard',
  products:      '/products',
  orders:        '/orders',
  conversations: '/messages',
  customers:     '/customers',
  analytics:     '/analytics',
  insights:      '/insights',
  connections:   '/connections',
  delivery:      '/delivery',
  notifications: '/notifications',
  settings:      '/settings',
  banner:        '/studio',
  editor:        '/editor',
  import:        '/import',
};

const URL_PAGES: Record<string, string> = Object.fromEntries(
  Object.entries(PAGE_URLS).map(([k, v]) => [v, k])
);

function getSeasonalTheme(): string {
  const m = new Date().getMonth();
  if (m >= 5 && m <= 7) return 'theme-summer';
  if (m === 10) return 'theme-blackfriday';
  return '';
}

function ThemeManager() {
  const { settings } = useStore();
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('theme-ramadan','theme-eid','theme-summer','theme-blackfriday','light-theme');
    const manual = (settings as any).design?.seasonalTheme;
    if (manual && manual !== 'auto' && manual !== 'default') { html.classList.add(`theme-${manual}`); return; }
    if (settings.design?.theme === 'light') html.classList.add('light-theme');
    if (!manual || manual === 'auto') { const s = getSeasonalTheme(); if (s) html.classList.add(s); }
  }, [settings.design?.theme, (settings as any).design?.seasonalTheme]);
  return null;
}

function RouterSync() {
  const { currentPage, setPage } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Public routes that RouterSync must NEVER interfere with
  const isPublicRoute = location.pathname.startsWith('/store') ||
    location.pathname.startsWith('/landing') ||
    location.pathname === '/';

  useEffect(() => {
    if (isPublicRoute) return; // Never sync from public routes
    const page = URL_PAGES[location.pathname];
    if (page && page !== currentPage) setPage(page as any);
  }, [location.pathname]);

  useEffect(() => {
    if (isPublicRoute) return; // Never push navigation from public routes
    const url = PAGE_URLS[currentPage];
    if (url && location.pathname !== url) navigate(url, { replace: false });
  }, [currentPage]);

  return null;
}

function AppShell() {
  const { token } = useStore();
  const isDemoMode = token === 'demo-token-local';
  const isAuthed   = !!token || isDemoMode;

  return (
    <>
      <ThemeManager />
      {isAuthed && <RouterSync />}
      {/* ambient background handled in CSS body */}

      <Routes>
        {/* ── PUBLIC: Storefront for customers ── */}
        <Route path="/store"          element={<Storefront />} />
        <Route path="/store/:userId"  element={<Storefront />} />
        <Route path="/store/*"        element={<Storefront />} />

        {/* ── PUBLIC: Landing page (choose: merchant or customer) ── */}
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/auth"    element={isAuthed ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
        <Route path="/login"   element={isAuthed ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
        <Route path="/register"element={isAuthed ? <Navigate to="/dashboard" replace /> : <AuthPage />} />

        {/* ── PROTECTED: Merchant dashboard ── */}
        {['/dashboard','/products','/orders','/messages','/customers',
          '/analytics','/insights','/connections','/delivery','/notifications',
          '/settings','/studio','/editor','/import','/coupons'].map(path => (
          <Route key={path} path={path}
            element={isAuthed ? <MainLayout /> : <Navigate to="/login" replace />} />
        ))}

        {/* ── ROOT: Show landing page always at / ── */}
        <Route path="/" element={
          isAuthed
            ? <Navigate to="/dashboard" replace />
            : <LandingPage />
        } />

        {/* ── FALLBACK ── */}
        <Route path="*" element={
          isAuthed ? <Navigate to="/dashboard" replace /> : <LandingPage />
        } />
      </Routes>
    </>
  );
}

export default function App() {
  return <AppShell />;
}
