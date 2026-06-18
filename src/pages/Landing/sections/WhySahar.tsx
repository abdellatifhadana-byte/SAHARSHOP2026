import { Zap, Bot, TrendingUp } from 'lucide-react';
import { Section, SecHead, Reveal } from '../components';
import { useLanding } from '../context';
import { C } from '../theme';

export default function WhySahar() {
  const { isRtl, tx } = useLanding();
  const items = [
    { icon: <Zap size={22} />, t: 'why1', d: 'why1d', c: C.orange },
    { icon: <Bot size={22} />, t: 'why2', d: 'why2d', c: C.blue },
    { icon: <TrendingUp size={22} />, t: 'why3', d: 'why3d', c: C.green },
  ];
  return (
    <Section alt>
      <Reveal><SecHead title={tx('storesTitle')} /></Reveal>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,260px), 1fr))', gap: 18, marginTop: 30 }}>
        {items.map((w, i) => (
          <Reveal key={w.t} delay={i * 90}>
            <div className="lpcard" style={{ height: '100%', padding: '26px 22px', borderRadius: 18, background: C.surface, border: `1px solid ${C.border}`, boxShadow: C.shadow, textAlign: isRtl ? 'right' : 'left' }}>
              <div className="lpico" style={{ width: 50, height: 50, borderRadius: 14, background: `${w.c}14`, color: w.c, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>{w.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 7px', color: C.ink }}>{tx(w.t)}</h3>
              <p style={{ fontSize: 13, color: C.ink2, lineHeight: 1.7, margin: 0 }}>{tx(w.d)}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
