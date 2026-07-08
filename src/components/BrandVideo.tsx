import React from 'react';

interface BrandVideoProps {
  variant?: 'autoplay' | 'controls' | 'modal' | 'background';
  maxWidth?: string | number;
  poster?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const BrandVideo: React.FC<BrandVideoProps> = ({
  variant = 'autoplay',
  maxWidth = '100%',
  poster,
  className = '',
  style = {},
}) => {
  const videoStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
    height: 'auto',
    borderRadius: '12px',
    display: 'block',
    margin: '0 auto',
    ...style,
  };

  if (variant === 'background') {
    return (
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        height: '400px', 
        overflow: 'hidden', 
        borderRadius: '12px' 
      }}>
        <video
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        >
          <source src="/amanzine-video.mp4" type="video/mp4" />
        </video>
      </div>
    );
  }

  return (
    <video
      autoPlay={variant === 'autoplay' || variant === 'modal'}
      controls={variant === 'controls' || variant === 'modal'}
      muted={variant === 'autoplay'}
      loop={variant === 'autoplay'}
      playsInline
      poster={poster}
      className={className}
      style={videoStyle}
    >
      <source src="/amanzine-video.mp4" type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
};

// Modal Video Player Component
export const VideoModal: React.FC<{ 
  triggerText?: string; 
  onOpen?: () => void; 
  onClose?: () => void;
}> = ({ triggerText = '▶️ Watch Demo', onOpen, onClose }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const open = () => {
    setIsOpen(true);
    onOpen?.();
  };

  const close = () => {
    setIsOpen(false);
    onClose?.();
  };

  return (
    <>
      <button 
        onClick={open}
        style={{
          padding: '12px 24px',
          background: 'linear-gradient(135deg, #1e7e34, #dc2626)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
        onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {triggerText}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={close}
        >
          <div
            style={{
              position: 'relative',
              width: '90%',
              maxWidth: '900px',
              background: '#0A0A14',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={close}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(0,0,0,0.6)',
                color: 'white',
                border: 'none',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '20px',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(4px)',
              }}
            >
              ✕
            </button>
            <BrandVideo variant="controls" />
          </div>
        </div>
      )}
    </>
  );
};

export default BrandVideo;