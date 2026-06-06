// ================================================================
// API Client — يتصل بالـ backend عند توفره، وإلا يعمل offline
// ================================================================

const BASE_URL = (() => {
  if (typeof window !== 'undefined') {
    // Auto-detect: same origin or localhost:3001
    if (window.location.port === '5173' || window.location.port === '4173') {
      return 'http://localhost:3001/api';
    }
    return `${window.location.origin}/api`;
  }
  return 'http://localhost:3001/api';
})();

let _token: string | null = null;
let _refreshToken: string | null = null;
let _isOnline = false;
let _refreshing = false;

try { _token = localStorage.getItem('ai_commerce_token'); } catch {}
try { _refreshToken = localStorage.getItem('ai_commerce_refresh'); } catch {}

export function getToken()  { return _token; }
export function isOnline()  { return _isOnline; }

export function setToken(t: string | null) {
  _token = t;
  try {
    if (t) localStorage.setItem('ai_commerce_token', t);
    else localStorage.removeItem('ai_commerce_token');
  } catch {}
}

export function setRefreshToken(t: string | null) {
  _refreshToken = t;
  try {
    if (t) localStorage.setItem('ai_commerce_refresh', t);
    else localStorage.removeItem('ai_commerce_refresh');
  } catch {}
}

// ── Health check ──────────────────────────────────────────────
export const healthCheck = () => checkBackend();
export async function checkBackend(): Promise<boolean> {
  try {
    const r = await fetch(`${BASE_URL}/health`, {
      signal: AbortSignal.timeout(2500),
    });
    _isOnline = r.ok;
  } catch {
    _isOnline = false;
  }
  return _isOnline;
}

// ── Raw fetch helper ─────────────────────────────────────────
async function _doFetch(method: string, path: string, body?: unknown): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;
  return fetch(`${BASE_URL}${path}`, {
    method, headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10000),
  });
}

// ── Refresh access token using stored refresh token ───────────
async function _tryRefresh(): Promise<boolean> {
  if (!_refreshToken || _refreshing) return false;
  _refreshing = true;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: _refreshToken }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) { setRefreshToken(null); return false; }
    const data = await res.json();
    setToken(data.token);
    setRefreshToken(data.refreshToken);
    return true;
  } catch { return false; }
  finally { _refreshing = false; }
}

// ── Generic request ───────────────────────────────────────────
async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const isAuthRoute = path.startsWith('/auth/');
  let res = await _doFetch(method, path, body);

  if (res.status === 401 && !isAuthRoute && _refreshToken) {
    const refreshed = await _tryRefresh();
    if (refreshed) {
      res = await _doFetch(method, path, body);
    } else {
      try { localStorage.removeItem('ai_commerce_token'); localStorage.removeItem('ai_commerce_refresh'); } catch {}
      window.location.href = '/login';
      throw new Error('Session expired — please log in again');
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json() as T;
}

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  register: (data: { name: string; email: string; password: string; storeName?: string }) =>
    request<{ token: string; refreshToken: string; user: any }>('POST', '/auth/register', data),

  login: (data: { email: string; password: string }) =>
    request<{ token: string; refreshToken: string; user: any }>('POST', '/auth/login', data),

  me: () => request<{ user: any }>('GET', '/auth/me'),

  logout: (refreshToken?: string) =>
    request<{ ok: boolean }>('POST', '/auth/logout', { refreshToken: refreshToken || _refreshToken }),

  refresh: () => _tryRefresh(),

  changePassword: (data: { current: string; next: string }) =>
    request<{ success: boolean }>('POST', '/auth/change-password', data),

  forgotPassword: (email: string) =>
    request<{ sent: boolean; email?: string }>('POST', '/auth/forgot-password', { email }),

  resetPassword: (email: string, code: string, newPassword: string) =>
    request<{ success: boolean; message: string }>('POST', '/auth/reset-password', { email, code, newPassword }),
};

// ── Products ──────────────────────────────────────────────────
// data may include: offer_type, duration, service_area alongside standard fields
export const productsAPI = {
  list:   ()              => request<any[]>('GET', '/products'),
  create: (data: any)     => request<any>('POST', '/products', data),
  update: (id: string, d: any) => request<any>('PUT', `/products/${id}`, d),
  remove: (id: string)    => request<any>('DELETE', `/products/${id}`),
};

// ── Orders ────────────────────────────────────────────────────
export const ordersAPI = {
  list:    ()            => request<any[]>('GET', '/orders'),
  create:  (data: any)   => request<any>('POST', '/orders', data),
  approve: (id: string)  => request<any>('PUT', `/orders/${id}/approve`),
  reject:  (id: string)  => request<any>('PUT', `/orders/${id}/reject`),
  ship:    (id: string, data?: any) => request<any>('PUT', `/orders/${id}/ship`, data),
  deliver: (id: string)  => request<any>('PUT', `/orders/${id}/deliver`),
  update:  (id: string, d: any) => request<any>('PUT', `/orders/${id}`, d),
};

// ── Customers ─────────────────────────────────────────────────
export interface CustomerPage {
  data:    any[];
  total:   number;
  limit:   number;
  offset:  number;
  hasMore: boolean;
}
export const customersAPI = {
  list: (params?: { limit?: number; offset?: number; q?: string }) => {
    const qs = new URLSearchParams();
    if (params?.limit  != null) qs.set('limit',  String(params.limit));
    if (params?.offset != null) qs.set('offset', String(params.offset));
    if (params?.q)               qs.set('q',      params.q);
    const query = qs.toString();
    return request<CustomerPage>('GET', `/customers${query ? '?' + query : ''}`);
  },
  create: (data: any)    => request<any>('POST', '/customers', data),
  update: (id: string, d: any) => request<any>('PUT', `/customers/${id}`, d),
  remove: (id: string)   => request<any>('DELETE', `/customers/${id}`),
};

// ── Conversations ─────────────────────────────────────────────
export const conversationsAPI = {
  list:         ()              => request<any[]>('GET', '/conversations'),
  create:       (data: any)     => request<any>('POST', '/conversations', data),
  update:       (id: string, d: any) => request<any>('PUT', `/conversations/${id}`, d),
  remove:       (id: string)    => request<any>('DELETE', `/conversations/${id}`),
  sendMessage:  (id: string, d: any) => request<any>('POST', `/conversations/${id}/messages`, d),
};

// ── Coupons ───────────────────────────────────────────────────
export const couponsAPI = {
  list:     ()              => request<any[]>('GET', '/coupons'),
  create:   (data: any)     => request<any>('POST', '/coupons', data),
  update:   (id: string, d: any) => request<any>('PUT', `/coupons/${id}`, d),
  remove:   (id: string)    => request<any>('DELETE', `/coupons/${id}`),
  validate: (code: string, userId: string, total: number) =>
    request<{ valid: boolean; discount: number; message?: string; couponId?: string }>(
      'GET', `/coupons/validate?code=${encodeURIComponent(code)}&userId=${userId}&total=${total}`
    ),
};

// ── Settings ──────────────────────────────────────────────────
export const settingsAPI = {
  get:           ()       => request<any>('GET', '/settings'),
  save:          (d: any) => request<any>('PUT', '/settings', d),
  getLogs:       ()       => request<any[]>('GET', '/settings/logs'),
  getNotifs:     ()       => request<any[]>('GET', '/settings/notifications'),
  markRead:      ()       => request<any>('POST', '/settings/notifications/read'),
  clearNotifs:   ()       => request<any>('DELETE', '/settings/notifications'),
  getTemplates:  ()       => request<any[]>('GET', '/settings/templates'),
  saveTemplates: (t: any) => request<any>('PUT', '/settings/templates', t),
};

// ── Analytics ─────────────────────────────────────────────────
export const analyticsAPI = {
  get:    () => request<any>('GET', '/analytics'),
  funnel: () => request<any>('GET', '/analytics/funnel'),
};

// ── Broadcast ─────────────────────────────────────────────────
export const broadcastAPI = {
  send:    (data: any) => request<any>('POST', '/broadcast', data),
  history: ()          => request<any[]>('GET', '/broadcast/history'),
};

// ── Media ─────────────────────────────────────────────────────
export const mediaAPI = {
  uploadBase64: (data: string, ext = 'jpg') =>
    request<{ url: string; filename: string }>('POST', '/media/upload-base64', { data, ext }),
};

// ── Delivery ──────────────────────────────────────────────────
export const deliveryAPI = {
  list:     ()           => request<any[]>('GET', '/delivery'),
  save:     (data: any)  => request<any>('POST', '/delivery', data),
  remove:   (id: string) => request<any>('DELETE', `/delivery/${id}`),
  simulate: (orderId: string) => request<any>('POST', `/delivery/simulate/${orderId}`),
  create:   (orderId: string, data?: any) => request<any>('POST', `/delivery/create/${orderId}`, data),
};

// ── AI chat via backend ───────────────────────────────────────
export const aiAPI = {
  reply: (data: {
    message: string;
    history: any[];
    products: any[];
    settings: any;
  }) => request<{ reply: string; model: string }>('POST', '/ai/reply', data),

  extractOrder: (history: any[]) =>
    request<{ phone?: string; city?: string; name?: string; size?: string; color?: string }>(
      'POST', '/ai/extract-order', { history }
    ),
};

// ── Loyalty ──────────────────────────────────────────────────
export const loyaltyAPI = {
  get: (customerId: string) => request<any>('GET', `/loyalty/${customerId}`),
  add: (data: { customerId: string; amount: number }) => request<any>('POST', '/loyalty/add', data),
};

// ── WebSocket real-time ───────────────────────────────────────
let _ws: WebSocket | null = null;
const _handlers = new Map<string, Set<(data: any) => void>>();

export function connectWS(userId: string) {
  if (_ws && _ws.readyState < 2) return;
  try {
    const wsBase = BASE_URL.replace(/^http/, 'ws').replace('/api', '');
    _ws = new WebSocket(`${wsBase}/ws?userId=${userId}`);
    _ws.onopen = () => {
      if (_token && _ws) _ws.send(JSON.stringify({ type: 'auth', token: _token }));
    };
    _ws.onmessage = (e) => {
      try {
        const { event, data } = JSON.parse(e.data);
        _handlers.get(event)?.forEach(fn => fn(data));
      } catch {}
    };
    _ws.onerror = () => {};
    _ws.onclose = () => {
      setTimeout(() => connectWS(userId), 5000);
    };
  } catch {}
}

export function onWS(event: string, handler: (data: any) => void) {
  if (!_handlers.has(event)) _handlers.set(event, new Set());
  _handlers.get(event)!.add(handler);
  return () => _handlers.get(event)?.delete(handler);
}

export function disconnectWS() {
  _ws?.close();
  _ws = null;
}
