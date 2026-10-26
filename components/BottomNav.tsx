import React from 'react';

/**
 * NEXCHAT v2 Master Bottom Navigation Bar
 * Layout: Chats / ChronEX AI / [Market Hub (Center + 20% Bigger)] / Calls
 * 
 * STRICTLY ZERO EMOJIS: FontAwesome 6 vector icons and cyberpunk styling only.
 */

export interface BottomNavProps {
  activeTab: 'chats' | 'ai' | 'marketplace' | 'calls' | 'updates';
  onTabChange: (tab: 'chats' | 'ai' | 'marketplace' | 'calls' | 'updates') => void;
  unreadCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  unreadCount = 0,
}) => {
  return (
    <nav className="bottom-nav" style={{
      height: '66px',
      backgroundColor: '#0A0F1E',
      borderTop: '1px solid rgba(0, 255, 198, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)'
    }}>
      {/* 1. Chats */}
      <button
        type="button"
        id="nav-messages"
        className={`nav-item ${activeTab === 'chats' ? 'active' : ''}`}
        onClick={() => onTabChange('chats')}
        title="Chats"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'center' }}
      >
        <div className="nav-icon-wrapper" style={{ position: 'relative' }}>
          <i className="fa-solid fa-comment-dots" style={{ color: activeTab === 'chats' ? '#00FFC6' : '#8696a0', fontSize: '18px' }} />
          {unreadCount > 0 && (
            <span className="nav-pill-badge" style={{
              position: 'absolute',
              top: '-4px',
              right: '-6px',
              background: '#00FFC6',
              color: '#0A0F1E',
              fontSize: '10px',
              fontWeight: 800,
              borderRadius: '9px',
              padding: '1px 5px'
            }}>
              {unreadCount}
            </span>
          )}
        </div>
        <span className="nav-label" style={{ color: activeTab === 'chats' ? '#00FFC6' : '#8696a0', fontSize: '11px', fontWeight: 600 }}>
          Chats
        </span>
      </button>

      {/* 2. ChronEX AI */}
      <button
        type="button"
        id="nav-ai"
        className={`nav-item ${activeTab === 'ai' ? 'active' : ''}`}
        onClick={() => onTabChange('ai')}
        title="ChronEX AI Assistant"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'center' }}
      >
        <div className="nav-icon-wrapper" style={{ position: 'relative' }}>
          <i className="fa-solid fa-microchip" style={{ color: activeTab === 'ai' ? '#00FFC6' : '#8696a0', fontSize: '18px' }} />
          <span style={{
            position: 'absolute',
            top: '0',
            right: '-3px',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#00FFC6',
            boxShadow: '0 0 6px #00FFC6'
          }} />
        </div>
        <span className="nav-label" style={{ color: activeTab === 'ai' ? '#00FFC6' : '#8696a0', fontSize: '11px', fontWeight: 600 }}>
          ChronEX AI
        </span>
      </button>

      {/* 3. Market Hub (Center + 20% Bigger Super-App Signal) */}
      <button
        type="button"
        id="nav-marketplace"
        className={`nav-item nav-item-center-super ${activeTab === 'marketplace' ? 'active' : ''}`}
        onClick={() => onTabChange('marketplace')}
        title="NEX Market Hub"
        style={{
          transform: 'translateY(-10px) scale(1.2)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'center',
          zIndex: 10
        }}
      >
        <div className="super-app-icon-wrapper" style={{
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #00FFC6 0%, #0088FF 100%)',
          color: '#0A0F1E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 18px rgba(0, 255, 198, 0.55)',
          margin: '0 auto'
        }}>
          <i className="fa-solid fa-store" style={{ fontSize: '18px' }} />
        </div>
        <span className="super-app-label" style={{
          color: '#00FFC6',
          fontSize: '11px',
          fontWeight: 800,
          letterSpacing: '0.5px'
        }}>
          Market
        </span>
      </button>

      {/* 4. Calls */}
      <button
        type="button"
        id="nav-calls"
        className={`nav-item ${activeTab === 'calls' ? 'active' : ''}`}
        onClick={() => onTabChange('calls')}
        title="Calls"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'center' }}
      >
        <div className="nav-icon-wrapper">
          <i className="fa-solid fa-headset" style={{ color: activeTab === 'calls' ? '#00FFC6' : '#8696a0', fontSize: '18px' }} />
        </div>
        <span className="nav-label" style={{ color: activeTab === 'calls' ? '#00FFC6' : '#8696a0', fontSize: '11px', fontWeight: 600 }}>
          Calls
        </span>
      </button>
    </nav>
  );
};
