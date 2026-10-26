import React from 'react';

/**
 * NEXCHAT v2 Master Top Bar
 * Layout: NEXCHAT Logo, Centered Big CAMS Button, Search Chats or Ask ChronEX AI
 * 
 * STRICTLY ZERO EMOJIS: FontAwesome 6 vector icons and cyberpunk styling only.
 */

export interface TopBarProps {
  onOpenCams?: () => void;
  onSearchClick?: () => void;
  onMenuClick?: (e: React.MouseEvent) => void;
  tokensCount?: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenCams,
  onSearchClick,
  onMenuClick,
  tokensCount = 0,
}) => {
  return (
    <header
      className="top-header"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        backgroundColor: '#0A0F1E',
        borderBottom: '1px solid rgba(0, 255, 198, 0.2)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Brand Title with Glowing Pulsing Dot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img
          src="/logo.jpg"
          alt="NEXCHAT"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '1.5px solid #00FFC6',
            boxShadow: '0 0 10px rgba(0, 255, 198, 0.4)',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '20px', fontWeight: 800, color: '#e9edef', letterSpacing: '0.5px' }}>
            NEXCHAT
          </span>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#00FFC6',
              boxShadow: '0 0 8px #00FFC6',
            }}
          />
        </div>
      </div>

      {/* Centered Big CAMS Button (NEXCHAT Flagship Feature) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <button
          type="button"
          id="topHeaderCamsBtn"
          className="top-cams-hero-btn"
          onClick={onOpenCams || (() => { window.location.href = 'reels.html'; })}
          title="Launch NEX CAMS & Reels"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 16px',
            borderRadius: '22px',
            background: 'linear-gradient(135deg, rgba(0, 255, 198, 0.22) 0%, rgba(0, 136, 255, 0.22) 100%)',
            border: '1.5px solid #00FFC6',
            color: '#00FFC6',
            fontSize: '13px',
            fontWeight: 800,
            letterSpacing: '1px',
            boxShadow: '0 0 16px rgba(0, 255, 198, 0.35)',
            cursor: 'pointer',
          }}
        >
          <i className="fa-solid fa-clapperboard" style={{ fontSize: '14px' }} />
          <span>CAMS</span>
        </button>
      </div>

      {/* Right Actions: Search & Menu (WhatsApp camera icon removed!) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          type="button"
          onClick={onSearchClick}
          title="Search chats or ask ChronEX AI..."
          style={{ background: 'transparent', border: 'none', color: '#8696a0', fontSize: '17px', cursor: 'pointer' }}
        >
          <i className="fa-solid fa-magnifying-glass" />
        </button>
        <button
          type="button"
          onClick={onMenuClick}
          title="Menu"
          style={{ background: 'transparent', border: 'none', color: '#8696a0', fontSize: '18px', cursor: 'pointer' }}
        >
          <i className="fa-solid fa-ellipsis-vertical" />
        </button>
      </div>
    </header>
  );
};
