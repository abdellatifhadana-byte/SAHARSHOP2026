import { useState, useRef, useEffect } from 'react';
import ErrorBoundary from '../../components/ErrorBoundary';
import { C } from './theme';
import { useScrollProgress } from './hooks';
import { LandingProvider, useLanding } from './context';
import { BackToTop, Zellige } from './components';
import PromoBanner from './sections/PromoBanner';
import Header from './sections/Header';
import Hero from './sections/Hero';
import LiveTicker from './sections/LiveTicker';
import LiveMarketplace from './sections/LiveMarketplace';
import OSPreview from './sections/OSPreview';
import Cities from './sections/Cities';
import Bento from './sections/Bento';
import HowItWorks from './sections/HowItWorks';
import Pricing from './sections/Pricing';
import FAQ from './sections/FAQ';
import FinalCTA from './sections/FinalCTA';
import Footer from './sections/Footer';
import { Play, X, Volume2, VolumeX, Pause } from 'lucide-react';

// ─── BRAND LOGO COMPONENT (PNG) ───
const BrandLogo = ({ 
  size = 40, 
  className = '', 
  style = {},
  showText = false,
  text = 'AMANZINE'
}: { 
  size?: number; 
  className?: string; 
  style?: React.CSSProperties;
  showText?: boolean;
  text?: string;
}) => {
  const [error, setError] = useState(false);
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, ...style }} className={className}>
      <div style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        overflow: 'hidden',
        background: 'rgba(255,106,0,0.08)',
        border: '1.5px solid rgba(255,106,0,0.32)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 24px rgba(255,106,0,0.2)',
        flexShrink: 0,
      }}>
        {error ? (
          <span style={{ fontSize: size * 0.5, fontWeight: 900, color: '#FF6A00' }}>A</span>
        ) : (
          <img
            src="/amanzine-logo-new-v2.png"
            alt="AMANZINE"
            style={{ width: '82%', height: '82%', objectFit: 'contain' }}
            onError={() => setError(true)}
          />
        )}
      </div>
      {showText && (
        <span style={{ 
          fontWeight: 900, 
          fontSize: Math.round(size * 0.45), 
          letterSpacing: '-0.02em', 
          color: C.ink 
        }}>
          <span style={{ color: C.orange }}>{text}</span>
        </span>
      )}
    </div>
  );
};

// ─── VIDEO COMPONENT ───
const BrandVideo = ({ 
  variant = 'autoplay', 
  maxWidth = '100%',
  poster,
  className = '',
  style = {},
  onPlay,
  onPause,
  showControls = true,
}: {
  variant?: 'autoplay' | 'controls' | 'modal' | 'background' | 'hero';
  maxWidth?: string | number;
  poster?: string;
  className?: string;
  style?: React.CSSProperties;
  onPlay?: () => void;
  onPause?: () => void;
  showControls?: boolean;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const videoStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
    height: 'auto',
    borderRadius: '16px',
    display: 'block',
    margin: '0 auto',
    boxShadow: '0 12px 48px rgba(0,0,0,0.25)',
    ...style,
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      onPause?.();
    } else {
      videoRef.current.play();
      onPlay?.();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(progress);
  };

  // Hero variant - full width with overlay controls
  if (variant === 'hero') {
    return (
      <div 
        style={{ 
          position: 'relative', 
          width: '100%', 
          maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
          margin: '0 auto',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 16px 56px rgba(0,0,0,0.3)',
          ...style,
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={className}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          poster={poster}
          onTimeUpdate={handleTimeUpdate}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
          }}
        >
          <source src="/amanzine-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '20px 24px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          opacity: isHovering || !isPlaying ? 1 : 0.6,
          transition: 'opacity 0.3s ease',
        }}>
          {showControls && (
            <>
              <button
                onClick={togglePlay}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.25s',
                  flexShrink: 0,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>
              
              <div style={{ 
                flex: 1, 
                height: 3, 
                background: 'rgba(255,255,255,0.2)', 
                borderRadius: 99, 
                position: 'relative',
                cursor: 'pointer',
              }}>
                <div style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #FF6A00, #FF8533)',
                  borderRadius: 99,
                  transition: 'width 0.1s linear',
                }} />
              </div>
              
              <button
                onClick={toggleMute}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
              
              <span style={{ 
                fontSize: 10, 
                color: 'rgba(255,255,255,0.7)', 
                fontWeight: 600, 
                fontFamily: 'Tajawal, sans-serif',
                letterSpacing: '0.02em',
                flexShrink: 0,
              }}>
                {Math.round(progress)}%
              </span>
            </>
          )}
        </div>
        
        {/* Play button overlay - shown when video is paused */}
        {!isPlaying && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}>
            <button
              onClick={togglePlay}
              style={{
                pointerEvents: 'auto',
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'rgba(255,106,0,0.88)',
                backdropFilter: 'blur(8px)',
                border: '2px solid rgba(255,255,255,0.2)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s',
                boxShadow: '0 0 40px rgba(255,106,0,0.4)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 0 60px rgba(255,106,0,0.6)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 0 40px rgba(255,106,0,0.4)'; }}
            >
              <Play size={28} style={{ marginLeft: 4 }} />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Background variant
  if (variant === 'background') {
    return (
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        height: '400px', 
        overflow: 'hidden', 
        borderRadius: '20px',
        ...style,
      }} className={className}>
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          poster={poster}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        >
          <source src="/amanzine-video.mp4" type="video/mp4" />
        </video>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(255,106,0,0.2))',
        }} />
      </div>
    );
  }

  // Modal variant
  if (variant === 'modal') {
    return (
      <video
        ref={videoRef}
        autoPlay
        controls
        playsInline
        poster={poster}
        style={videoStyle}
        className={className}
      >
        <source src="/amanzine-video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    );
  }

  // Default - autoplay or controls
  return (
    <video
      ref={videoRef}
      autoPlay={variant === 'autoplay'}
      controls={variant === 'controls'}
      muted={variant === 'autoplay'}
      loop={variant === 'autoplay'}
      playsInline
      poster={poster}
      style={videoStyle}
      className={className}
    >
      <source src="/amanzine-video.mp4" type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
};

// ─── VIDEO MODAL ───
const VideoModal = ({ 
  isOpen, 
  onClose,
}: { 
  isOpen: boolean; 
  onClose: () => void;
}) => {
  useEffect(() => {
    if (!isOpen) return;
    let popped = false;
    const onPop = () => { popped = true; onClose(); };
    window.history.pushState({ videoModal: true }, '');
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if (!popped) window.history.back();
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '24px',
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '90%',
          maxWidth: '960px',
          background: '#0A0A14',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 40px 100px rgba(0,0,0,0.7)',
          border: '1px solid rgba(255,255,255,0.08)',
          animation: 'scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.12)',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '20px',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.6)')}
        >
          <X size={24} />
        </button>
        <BrandVideo variant="modal" />
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
};

// ─── GLOBAL CSS WITH VIDEO STYLES ───
const GLOBAL_CSS = `
  @keyframes lpIn { from{opacity:0} to{opacity:1} }
  @keyframes lpUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes lpShimmer { 0%,100%{opacity:.5} 50%{opacity:1} }
  @keyframes lpFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
  @keyframes lpFloat2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(9px)} }
  @keyframes lpBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(7px)} }
  @keyframes lpGrad { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
  @keyframes lpShine { 0%{transform:translateX(-220%) skewX(-18deg)} 60%,100%{transform:translateX(320%) skewX(-18deg)} }
  @keyframes lpPulse { 0%,100%{box-shadow:0 0 0 0 rgba(255,106,0,0.4)} 50%{box-shadow:0 0 0 20px rgba(255,106,0,0)} }
  @keyframes lpZellige { to { background-position: 192px 192px } }
  @keyframes lpTicker { to { transform: translateX(-50%) } }
  
  .lpcard { position: relative; transition: transform .3s cubic-bezier(.16,1,.3,1), box-shadow .3s ease, border-color .3s ease; }
  .lpcard::after { content:''; position:absolute; inset:0; border-radius:inherit; pointer-events:none; opacity:0; transition:opacity .4s ease; background-image:${NAQSH}; background-repeat:no-repeat; background-position:top -7px right -7px; background-size:66px 66px; }
  .lpcard:hover { transform: translateY(-5px); box-shadow: ${C.shadowH}, inset 0 0 0 1.5px ${C.orange}26; border-color: ${C.borderH}; }
  .lpcard:hover::after { opacity:.13; }
  .lpcard:hover .lpico { transform: scale(1.1) rotate(-6deg); }
  .lpico { transition: transform .3s cubic-bezier(.16,1,.3,1); }
  .lpbtn .sh { position:absolute; top:0; bottom:0; width:34%; background:linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent); transform:translateX(-220%) skewX(-18deg); animation:lpShine 4.5s ease-in-out infinite; pointer-events:none; }
  .lpmenu::-webkit-scrollbar { width:6px } .lpmenu::-webkit-scrollbar-thumb { background:rgba(0,0,0,.14); border-radius:3px }
  .bento { display:grid; grid-template-columns:repeat(2,1fr); gap:14px; }
  @media(min-width:780px){ .bento{ grid-template-columns:repeat(4,1fr); grid-auto-rows:1fr } .bento .feat{ grid-column:span 2; grid-row:span 2 } .bento .wide{ grid-column:span 2 } }
  .osdesk { position:relative }
  @media(min-width:861px){ .osdesk{ height:470px } .oswin{ position:absolute } .osw1{ width:380px; top:0; inset-inline-end:0; z-index:3 } .osw2{ width:330px; top:120px; inset-inline-start:0; z-index:2 } .osw3{ width:330px; top:248px; inset-inline-end:56px; z-index:4 } }
  @media(max-width:860px){ .oswin{ position:relative; margin-bottom:14px } }
  html { scroll-behavior: smooth; }
  
  .video-wrapper { position: relative; border-radius: 20px; overflow: hidden; }
  .video-wrapper video { width: 100%; height: auto; display: block; }
  .video-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; }
  .video-overlay button { pointer-events: auto; }
  .play-pulse { animation: lpPulse 2s ease-in-out infinite; }
`;

// نقش زاوية (نجمة مغربية) يظهر على البطاقات عند التحويم — مبنيّ من ألوان الثيم
const NAQSH_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='66' height='66'><g fill='none' stroke='${C.orange}' stroke-width='1.3'><rect x='18' y='18' width='30' height='30'/><rect x='18' y='18' width='30' height='30' transform='rotate(45 33 33)'/></g><circle cx='33' cy='33' r='6' fill='none' stroke='${C.blue}' stroke-width='1.3'/></svg>`;
const NAQSH = `url("data:image/svg+xml,${encodeURIComponent(NAQSH_SVG)}")`;

// ─── SHELL ───
function Shell() {
  const { isRtl, tx } = useLanding();
  const prog = useScrollProgress();
  const [videoOpen, setVideoOpen] = useState(false);
  
  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} style={{ 
      minHeight: '100dvh', 
      overflowX: 'hidden', 
      background: C.bg, 
      color: C.ink, 
      fontFamily: 'Tajawal, system-ui, sans-serif' 
    }}>
      <style>{GLOBAL_CSS}</style>
      <Zellige />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Progress bar */}
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          insetInlineStart: 0, 
          height: 3, 
          width: `${Math.round(prog * 100)}%`, 
          background: `linear-gradient(90deg, ${C.orange}, ${C.purple}, ${C.blue})`, 
          zIndex: 60, 
          transition: 'width .1s linear' 
        }} />
        
        <PromoBanner />
        <Header />
        
        <main>
          <Hero />
          
          {/* ─── VIDEO SHOWCASE SECTION ─── */}
          <section style={{
            padding: 'clamp(30px,5vw,60px) clamp(16px,5vw,40px)',
            maxWidth: 1100,
            margin: '0 auto',
            width: '100%',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h2 style={{
                fontSize: 'clamp(24px,4vw,36px)',
                fontWeight: 900,
                color: C.ink,
                marginBottom: 10,
              }}>
                {tx('demoTitle') || 'شاهد منصتنا في العمل'}
              </h2>
              <p style={{ 
                fontSize: 16, 
                color: C.ink2, 
                maxWidth: 480, 
                margin: '0 auto',
                lineHeight: 1.7,
              }}>
                {tx('demoSub') || 'اكتشف كيف يمكن لـ AMANZINE تحويل عملك'}
              </p>
            </div>
            
            <BrandVideo 
              variant="hero" 
              maxWidth="100%"
              showControls={true}
            />
            
            {/* Video stats */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 40,
              marginTop: 24,
              flexWrap: 'wrap',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: C.orange }}>8.2s</div>
                <div style={{ fontSize: 12, color: C.ink3 }}>{tx('duration') || 'المدة'}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: C.orange }}>1088×832</div>
                <div style={{ fontSize: 12, color: C.ink3 }}>{tx('resolution') || 'الدقة'}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: C.orange }}>2.2 MB</div>
                <div style={{ fontSize: 12, color: C.ink3 }}>{tx('size') || 'الحجم'}</div>
              </div>
            </div>
          </section>
          
          <LiveTicker />
          <LiveMarketplace />
          <OSPreview />
          <Cities />
          <Bento />
          <HowItWorks />
          <Pricing />
          <FAQ />
          <FinalCTA />
        </main>
        <Footer />
      </div>
      <BackToTop />
      
      {/* Video Modal */}
      <VideoModal isOpen={videoOpen} onClose={() => setVideoOpen(false)} />
    </div>
  );
}

// ─── LANDING PAGE ───
export default function LandingPage() {
  return (
    <ErrorBoundary>
      <LandingProvider>
        <Shell />
      </LandingProvider>
    </ErrorBoundary>
  );
}
