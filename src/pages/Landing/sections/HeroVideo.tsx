// Landing/sections/HeroVideo.tsx
import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { C } from '../theme';

interface HeroVideoProps {
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
}

export default function HeroVideo({ 
  className = '', 
  autoPlay = true,
  muted = true,
  loop = true
}: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleLoaded = () => setIsLoaded(true);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('loadeddata', handleLoaded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('loadeddata', handleLoaded);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  return (
    <div 
      className={className}
      style={{ 
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: C.shadowH,
        background: '#000',
        aspectRatio: '16/9',
        maxWidth: '100%',
      }}
    >
      {/* Vidéo */}
      <video
        ref={videoRef}
        src={C.assets.heroVideo}
        poster={C.assets.poster}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      >
        {/* Format alternatif WebM pour meilleure compatibilité */}
        <source src={C.assets.heroVideoWebm} type="video/webm" />
        <source src={C.assets.heroVideo} type="video/mp4" />
        Votre navigateur ne supporte pas les vidéos HTML5.
      </video>

      {/* Overlay avec contrôles */}
      <div 
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px 20px',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.4))',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      >
        <button
          onClick={togglePlay}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '50%',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#fff',
            backdropFilter: 'blur(4px)',
            transition: 'background 0.2s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>

        <button
          onClick={toggleMute}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '50%',
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#fff',
            backdropFilter: 'blur(4px)',
            transition: 'background 0.2s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>

        {/* Barre de progression personnalisée */}
        <div 
          style={{
            flex: 1,
            height: 4,
            background: 'rgba(255,255,255,0.3)',
            borderRadius: 2,
            position: 'relative',
            cursor: 'pointer',
          }}
          onClick={(e) => {
            const video = videoRef.current;
            if (!video) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percent = x / rect.width;
            video.currentTime = percent * video.duration;
          }}
        >
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              background: C.orange,
              borderRadius: 2,
              width: '0%',
              transition: 'width 0.1s linear',
            }}
            ref={(el) => {
              if (!el || !videoRef.current) return;
              const updateProgress = () => {
                const video = videoRef.current;
                if (!video || video.duration === 0) return;
                el.style.width = `${(video.currentTime / video.duration) * 100}%`;
              };
              videoRef.current.addEventListener('timeupdate', updateProgress);
              return () => videoRef.current?.removeEventListener('timeupdate', updateProgress);
            }}
          />
        </div>

        <span style={{ 
          color: 'rgba(255,255,255,0.7)',
          fontSize: 11,
          fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {isLoaded && videoRef.current && (
            `${Math.floor(videoRef.current.currentTime)}s`
          )}
        </span>
      </div>

      {/* Badge "Play" au centre (si en pause) */}
      {!isPlaying && isLoaded && (
        <button
          onClick={togglePlay}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255,255,255,0.15)',
            border: '2px solid rgba(255,255,255,0.3)',
            borderRadius: '50%',
            width: 64,
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#fff',
            backdropFilter: 'blur(4px)',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
            e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
            e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
          }}
        >
          <Play size={28} style={{ marginLeft: 4 }} />
        </button>
      )}
    </div>
  );
}