import ErrorBoundary from '../../components/ErrorBoundary';
import { C } from './theme';
import { useScrollProgress } from './hooks';
import { LandingProvider, useLanding } from './context';
import { BackToTop } from './components';
import PromoBanner from './sections/PromoBanner';
import Header from './sections/Header';
import Hero from './sections/Hero';
import LiveMarketplace from './sections/LiveMarketplace';
import Cities from './sections/Cities';
import Bento from './sections/Bento';
import HowItWorks from './sections/HowItWorks';
import WhySahar from './sections/WhySahar';
import Pricing from './sections/Pricing';
import FAQ from './sections/FAQ';
import FinalCTA from './sections/FinalCTA';
import Footer from './sections/Footer';

const GLOBAL_CSS = `
  @keyframes lpIn { from{opacity:0} to{opacity:1} }
  @keyframes lpUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes lpShimmer { 0%,100%{opacity:.5} 50%{opacity:1} }
  @keyframes lpFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
  @keyframes lpFloat2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(9px)} }
  @keyframes lpBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(7px)} }
  @keyframes lpGrad { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
  @keyframes lpShine { 0%{transform:translateX(-220%) skewX(-18deg)} 60%,100%{transform:translateX(320%) skewX(-18deg)} }
  .lpcard { transition: transform .3s cubic-bezier(.16,1,.3,1), box-shadow .3s ease, border-color .3s ease; }
  .lpcard:hover { transform: translateY(-5px); box-shadow: ${C.shadowH}; border-color: ${C.borderH}; }
  .lpcard:hover .lpico { transform: scale(1.1) rotate(-6deg); }
  .lpico { transition: transform .3s cubic-bezier(.16,1,.3,1); }
  .lpbtn .sh { position:absolute; top:0; bottom:0; width:34%; background:linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent); transform:translateX(-220%) skewX(-18deg); animation:lpShine 4.5s ease-in-out infinite; pointer-events:none; }
  .lpmenu::-webkit-scrollbar { width:6px } .lpmenu::-webkit-scrollbar-thumb { background:rgba(0,0,0,.14); border-radius:3px }
  .bento { display:grid; grid-template-columns:repeat(2,1fr); gap:14px; }
  @media(min-width:780px){ .bento{ grid-template-columns:repeat(4,1fr); grid-auto-rows:1fr } .bento .feat{ grid-column:span 2; grid-row:span 2 } .bento .wide{ grid-column:span 2 } }
  html { scroll-behavior: smooth; }
`;

function Shell() {
  const { isRtl } = useLanding();
  const prog = useScrollProgress();
  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} style={{ minHeight: '100dvh', overflowX: 'hidden', background: C.bg, color: C.ink, fontFamily: 'Tajawal, system-ui, sans-serif' }}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ position: 'fixed', top: 0, insetInlineStart: 0, height: 3, width: `${Math.round(prog * 100)}%`, background: `linear-gradient(90deg, ${C.orange}, ${C.blue}, ${C.purple})`, zIndex: 60, transition: 'width .1s linear' }} />
      <PromoBanner />
      <Header />
      <main>
        <Hero />
        <LiveMarketplace />
        <Cities />
        <Bento />
        <HowItWorks />
        <WhySahar />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}

export default function LandingPage() {
  return (
    <ErrorBoundary>
      <LandingProvider>
        <Shell />
      </LandingProvider>
    </ErrorBoundary>
  );
}
