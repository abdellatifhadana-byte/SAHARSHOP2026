import { useState, useEffect } from 'react';

// هل تجاوز المستخدم حدّ تمرير معيّن؟ (لرأس الصفحة وزر العودة للأعلى)
export function useScrolled(threshold = 16): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled((document.documentElement.scrollTop || window.scrollY) > threshold);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

// نسبة التقدّم في التمرير 0..1 (لشريط التقدّم العلوي)
export function useScrollProgress(): number {
  const [prog, setProg] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      setProg(el.scrollTop / ((el.scrollHeight - el.clientHeight) || 1));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return prog;
}
