import React from 'react';

/**
 * NEXCHAT v2 Master Bottom Navigation Bar
 * Layout: Chats / Updates / Reels / [Market Hub (Center Hero)] / Announcements / Calls
 * 
 * STRICTLY ZERO EMOJIS: FontAwesome 6 vector icons and cyberpunk styling only.
 */

export interface BottomNavProps {
  activeTab: 'chats' | 'updates' | 'reels' | 'marketplace' | 'announcements' | 'calls' | 'ai';
  onTabChange: (tab: 'chats' | 'updates' | 'reels' | 'marketplace' | 'announcements' | 'calls' | 'ai') => void;
  unreadCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  unreadCount = 0,
}) => {
  return (
    <nav className="bottom-nav" style={{
      height: '64px',
      backgroundColor: '#0A0F1E',
      borderTop: '1px solid rgba(0, 200, 150, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.6)',
      padding: '0 4px'
    }}>
      {/* 1. Chats */}
      <button
        type="button"
        id="nav-messages"
        className={`nav-item ${activeTab === 'chats' ? 'active' : ''}`}
        onClick={() => onTabChange('chats')}
        title="Chats"
        style={{ flex: '1 1 0', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'center', padding: '4px 1px' }}
      >
        <div className="nav-icon-wrapper" style={{ position: 'relative', margin: '0 auto', width: '38px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="fa-solid fa-comment-dots" style={{ color: activeTab === 'chats' ? '#00C896' : '#8696a0', fontSize: '16px' }} />
          {unreadCount > 0 && (
            <span className="nav-pill-badge" style={{
              position: 'absolute',
              top: '-3px',
              right: '-4px',
              background: '#00C896',
              color: '#0A0F1E',
              fontSize: '9.5px',
              fontWeight: 800,
              borderRadius: '9px',
              padding: '0 4px',
              minWidth: '14px',
              lineHeight: '14px'
            }}>
              {unreadCount}
            </span>
          )}
        </div>
        <span className="nav-label" style={{ color: activeTab === 'chats' ? '#00C896' : '#8696a0', fontSize: '10px', fontWeight: 600, display: 'block', marginTop: '1px' }}>
          Chats
        </span>
      </button>

      {/* 2. Updates / Status Vault */}
      <button
        type="button"
        id="nav-status"
        className={`nav-item ${activeTab === 'updates' ? 'active' : ''}`}
        onClick={() => onTabChange('updates')}
        title="Status Updates"
        style={{ flex: '1 1 0', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'center', padding: '4px 1px' }}
      >
        <div className="nav-icon-wrapper" style={{ position: 'relative', margin: '0 auto', width: '38px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="fa-solid fa-circle-notch" style={{ color: activeTab === 'updates' ? '#00C896' : '#8696a0', fontSize: '16px' }} />
          <span style={{
            position: 'absolute',
            top: '1px',
            right: '3px',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#00C896',
            boxShadow: '0 0 6px #00C896'
          }} />
        </div>
        <span className="nav-label" style={{ color: activeTab === 'updates' ? '#00C896' : '#8696a0', fontSize: '10px', fontWeight: 600, display: 'block', marginTop: '1px' }}>
          Updates
        </span>
      </button>

      {/* 3. Reels (CamShot Short-Form Video Stream) */}
      <button
        type="button"
        id="nav-reels"
        className={`nav-item ${activeTab === 'reels' ? 'active' : ''}`}
        onClick={() => onTabChange('reels')}
        title="CamShot Video Reels"
        style={{ flex: '1 1 0', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'center', padding: '4px 1px' }}
      >
        <div className="nav-icon-wrapper" style={{ position: 'relative', margin: '0 auto', width: '38px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="fa-solid fa-clapperboard" style={{ color: activeTab === 'reels' ? '#00C896' : '#8696a0', fontSize: '16px' }} />
        </div>
        <span className="nav-label" style={{ color: activeTab === 'reels' ? '#00C896' : '#8696a0', fontSize: '10px', fontWeight: 600, display: 'block', marginTop: '1px' }}>
          Reels
        </span>
      </button>

      {/* 4. Market Hub */}
      <button
        type="button"
        id="nav-marketplace"
        className={`nav-item ${activeTab === 'marketplace' ? 'active' : ''}`}
        onClick={() => onTabChange('marketplace')}
        title="NEX Market Hub"
        style={{ flex: '1 1 0', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'center', padding: '4px 1px' }}
      >
        <div className="nav-icon-wrapper" style={{ position: 'relative', margin: '0 auto', width: '38px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="fa-solid fa-store" style={{ color: activeTab === 'marketplace' ? '#00C896' : '#8696a0', fontSize: '16px' }} />
        </div>
        <span className="nav-label" style={{ color: activeTab === 'marketplace' ? '#00C896' : '#8696a0', fontSize: '10px', fontWeight: 600, display: 'block', marginTop: '1px' }}>
          Market
        </span>
      </button>

      {/* 5. Announcements / Dispatches */}
      <button
        type="button"
        id="nav-announcements"
        className={`nav-item ${activeTab === 'announcements' ? 'active' : ''}`}
        onClick={() => onTabChange('announcements')}
        title="System Announcements"
        style={{ flex: '1 1 0', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'center', padding: '4px 1px' }}
      >
        <div className="nav-icon-wrapper" style={{ position: 'relative', margin: '0 auto', width: '38px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="fa-solid fa-bullhorn" style={{ color: activeTab === 'announcements' ? '#00C896' : '#8696a0', fontSize: '16px' }} />
          <span style={{
            position: 'absolute',
            top: '1px',
            right: '3px',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#00f3ff',
            boxShadow: '0 0 6px #00f3ff'
          }} />
        </div>
        <span className="nav-label" style={{ color: activeTab === 'announcements' ? '#00C896' : '#8696a0', fontSize: '10px', fontWeight: 600, display: 'block', marginTop: '1px' }}>
          Alerts
        </span>
      </button>

      {/* 6. Calls */}
      <button
        type="button"
        id="nav-calls"
        className={`nav-item ${activeTab === 'calls' ? 'active' : ''}`}
        onClick={() => onTabChange('calls')}
        title="Calls"
        style={{ flex: '1 1 0', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'center', padding: '4px 1px' }}
      >
        <div className="nav-icon-wrapper" style={{ position: 'relative', margin: '0 auto', width: '38px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="fa-solid fa-headset" style={{ color: activeTab === 'calls' ? '#00C896' : '#8696a0', fontSize: '16px' }} />
        </div>
        <span className="nav-label" style={{ color: activeTab === 'calls' ? '#00C896' : '#8696a0', fontSize: '10px', fontWeight: 600, display: 'block', marginTop: '1px' }}>
          Calls
        </span>
      </button>
    </nav>
  );
};
