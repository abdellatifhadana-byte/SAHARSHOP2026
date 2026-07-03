// نظام الألوان — «طين وزليج» (هوية مغربية دافئة) + كاشف عنوان الـAPI.
// الأسماء الدلالية محفوظة (orange/blue/purple/green) لكن قيمها مغربية:
//   orange=طين (أساسي) · purple=زعفران (لمسة) · blue=نعناع أطلسي · green=نجاح.
export const C = {
  bg: '#FBF7F0', surface: '#FFFFFF', alt: '#F4EDE2',
  ink: '#1A130D', ink2: '#6B5D4F', ink3: '#A99C8B',
  border: 'rgba(26,19,13,0.10)', borderH: 'rgba(26,19,13,0.18)',
  shadow: '0 14px 44px rgba(120,72,43,0.10)', shadowH: '0 26px 64px rgba(120,72,43,0.16)',
  orange: '#C75B39', orangeD: '#A8482B', blue: '#1F8A70', green: '#2E8B57', purple: '#E8A317',
} as const;

// نفس منطق كشف العنوان في services/api.ts (يعمل في dev والإنتاج)
export function apiBase(): string {
  if (typeof window !== 'undefined') {
    if (window.location.port === '5173' || window.location.port === '4173') return 'http://localhost:3001/api';
    return `${window.location.origin}/api`;
  }
  return '/api';
}
