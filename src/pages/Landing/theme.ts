// نظام الألوان — فاتح فاخر (Premium Commerce OS) + كاشف عنوان الـAPI
export const C = {
  bg: '#F8FAFC', surface: '#FFFFFF', alt: '#F1F5F9',
  ink: '#0F172A', ink2: '#475569', ink3: '#94A3B8',
  border: 'rgba(15,23,42,0.08)', borderH: 'rgba(15,23,42,0.16)',
  shadow: '0 12px 40px rgba(15,23,42,0.08)', shadowH: '0 24px 60px rgba(15,23,42,0.14)',
  orange: '#FF6B35', orangeD: '#E8551F', blue: '#0EA5E9', green: '#10B981', purple: '#7C3AED',
} as const;

// نفس منطق كشف العنوان في services/api.ts (يعمل في dev والإنتاج)
export function apiBase(): string {
  if (typeof window !== 'undefined') {
    if (window.location.port === '5173' || window.location.port === '4173') return 'http://localhost:3001/api';
    return `${window.location.origin}/api`;
  }
  return '/api';
}
