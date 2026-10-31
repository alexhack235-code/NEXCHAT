import React, { useState, useEffect } from 'react';
import { useLiveTranslation, VC_SUPPORTED_LANGUAGES } from './useLiveTranslation.js';
import { chronexLiveVcDsp } from '../../js/chronex-live-vc-dsp.js';

/**
 * <LiveVC />
 * ChronEX Live Voice Channel with Real-Time Universal Voice Translation
 * Discord-style participant circles, speaking visualizer rings,
 * flag badges (Speak -> Hear), live dual-subtitle bar, and Push-to-Talk.
 * 
 * STRICT COMPLIANCE:
 * - Strictly 0 Unicode emojis (FontAwesome 6 vector glyphs only).
 * - Pure Windows CRLF line endings.
 */

export function LiveVCToggle({ onOpen, isActive = false, className = '' }) {
  return (
    <button
      type="button"
      className={`chronex-live-vc-toggle-pill ${isActive ? 'active' : ''} ${className}`.trim()}
      onClick={onOpen}
      title="Join ChronEX Live Real-Time Voice Translator"
      aria-label="Open ChronEX Live Voice Channel"
    >
      <i className="fa-solid fa-headset" style={{ color: isActive ? '#00ff66' : '#00f2ff' }}></i>
      <span>Live VC</span>
      {isActive && <span className="live-vc-active-beacon"></span>}
    </button>
  );
}

export function LiveVC({
  roomId = 'default_vc',
  roomName = 'Cyber Operations Voice Channel',
  userLang = 'en',
  speakLang: initialSpeakLang = 'en',
  hearLang: initialHearLang = 'tr',
  currentUser = { id: 'usr_me', name: 'You', avatar: 'logo.jpg' },
  initialParticipants = [],
  onLeave
}) {
  const {
    speakLang,
    setSpeakLang,
    hearLang,
    setHearLang,
    isLiveActive,
    setIsLiveActive,
    isMicActive,
    isPushToTalk,
    setIsPushToTalk,
    subtitles,
    activeSpeakers,
    startPushToTalk,
    stopPushToTalk,
    toggleHandsFreeMic
  } = useLiveTranslation({
    roomId,
    speakLang: initialSpeakLang,
    hearLang: initialHearLang,
    isChronexActive: true,
    currentUser
  });

  const [participants, setParticipants] = useState(() => {
    if (initialParticipants && initialParticipants.length > 0) return initialParticipants;
    return [
      {
        id: currentUser.id,
        name: currentUser.name || 'You',
        avatar: currentUser.avatar || 'logo.jpg',
        speakLang: initialSpeakLang,
        hearLang: initialHearLang,
        isSelf: true
      },
      {
        id: 'usr_turkish_peer',
        name: 'Kerem (Istanbul)',
        avatar: 'favicons/favicon.ico',
        speakLang: 'tr',
        hearLang: 'en',
        isSelf: false
      },
      {
        id: 'usr_french_peer',
        name: 'Camille (Paris)',
        avatar: 'favicons/favicon.ico',
        speakLang: 'fr',
        hearLang: 'en',
        isSelf: false
      }
    ];
  });

  // Update 3D Spatial Pan Matrix whenever participants roster changes
  useEffect(() => {
    chronexLiveVcDsp.updateGridPositions(participants.map(p => p.id));
  }, [participants]);

  // Update self participant language tags when user changes selection
  useEffect(() => {
    setParticipants(prev => prev.map(p => {
      if (p.isSelf || p.id === currentUser.id) {
        return { ...p, speakLang, hearLang };
      }
      return p;
    }));
  }, [speakLang, hearLang, currentUser.id]);

  const getLangObj = (code) => {
    return VC_SUPPORTED_LANGUAGES.find(l => l.code === code) || { code, name: code.toUpperCase(), tag: code.toUpperCase(), flagIcon: 'fa-globe' };
  };

  return (
    <div className="chronex-live-vc-backdrop" role="dialog" aria-modal="true">
      <div className="chronex-live-vc-room">
        {/* Discord-Style Room Header */}
        <div className="live-vc-header">
          <div className="live-vc-header-brand">
            <div className="live-vc-channel-icon">
              <i className="fa-solid fa-volume-high"></i>
            </div>
            <div>
              <span className="live-vc-badge">CHRONEX LIVE VC</span>
              <h2 className="live-vc-title">{roomName}</h2>
            </div>
          </div>

          <div className="live-vc-header-controls">
            {/* Live Universal Translation Master Toggle */}
            <button
              type="button"
              className={`live-vc-toggle-btn ${isLiveActive ? 'active' : ''}`}
              onClick={() => setIsLiveActive(!isLiveActive)}
              title="Toggle Live Voice Translation (AI Cloned Speech / TTS)"
            >
              <i className="fa-solid fa-microphone-lines"></i>
              <span>ChronEX Live: {isLiveActive ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              className="live-vc-leave-btn"
              onClick={onLeave}
              title="Disconnect from Voice Channel"
            >
              <i className="fa-solid fa-phone-slash"></i>
              <span>Leave</span>
            </button>
          </div>
        </div>

        {/* User Language Configuration Bar */}
        <div className="live-vc-lang-bar">
          <div className="live-vc-lang-field">
            <label className="live-vc-lang-label">
              <i className="fa-solid fa-microphone"></i>
              <span>I speak:</span>
            </label>
            <div className="live-vc-select-wrap">
              <select
                className="live-vc-select"
                value={speakLang}
                onChange={e => setSpeakLang(e.target.value)}
              >
                {VC_SUPPORTED_LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>
                    {l.name} ({l.tag})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="live-vc-lang-arrow">
            <i className="fa-solid fa-arrow-right"></i>
          </div>

          <div className="live-vc-lang-field">
            <label className="live-vc-lang-label">
              <i className="fa-solid fa-headphones"></i>
              <span>I want to hear:</span>
            </label>
            <div className="live-vc-select-wrap">
              <select
                className="live-vc-select"
                value={hearLang}
                onChange={e => setHearLang(e.target.value)}
              >
                {VC_SUPPORTED_LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>
                    {l.name} ({l.tag})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="live-vc-mode-toggle">
            <button
              type="button"
              className={`live-vc-mode-pill ${isPushToTalk ? 'active' : ''}`}
              onClick={() => setIsPushToTalk(!isPushToTalk)}
              title="Toggle Push-to-Talk or Voice Activity"
            >
              <i className={`fa-solid ${isPushToTalk ? 'fa-hand' : 'fa-microphone'}`}></i>
              <span>{isPushToTalk ? 'Push-To-Talk' : 'Voice Activity'}</span>
            </button>
          </div>
        </div>

        {/* Discord-Style Participant Circle Grid */}
        <div className="live-vc-participants-stage">
          <div className="live-vc-grid">
            {participants.map(p => {
              const isSpeaking = activeSpeakers.has(p.id);
              const speakObj = getLangObj(p.speakLang);
              const hearObj = getLangObj(p.hearLang);

              return (
                <div key={p.id} className={`live-vc-user-card ${isSpeaking ? 'speaking' : ''}`}>
                  {/* Avatar Circle with Audio Visualizer Ring */}
                  <div className="live-vc-avatar-wrap">
                    <img
                      src={p.avatar}
                      alt={p.name}
                      className="live-vc-avatar"
                      onError={e => { e.target.src = 'favicons/favicon.ico'; }}
                    />
                    {isSpeaking && <div className="live-vc-speaking-ring"></div>}
                    <div className="live-vc-mic-status">
                      <i className={`fa-solid ${isSpeaking ? 'fa-microphone' : 'fa-microphone-slash'}`}></i>
                    </div>
                  </div>

                  {/* Participant Name */}
                  <div className="live-vc-user-name">
                    <span>{p.name}</span>
                    {p.isSelf && <span className="live-vc-self-tag">YOU</span>}
                  </div>

                  {/* Flag / Language Pill: Speak -> Hear */}
                  <div className="live-vc-lang-badge-pill">
                    <span className="live-vc-flag-token" title={`Speaks: ${speakObj.name}`}>
                      <i className={`fa-solid ${speakObj.flagIcon}`}></i>
                      <span>{speakObj.tag}</span>
                    </span>
                    <i className="fa-solid fa-arrow-right-long live-vc-arrow-mini"></i>
                    <span className="live-vc-flag-token hear" title={`Hears: ${hearObj.name}`}>
                      <i className={`fa-solid ${hearObj.flagIcon}`}></i>
                      <span>{hearObj.tag}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Dual Subtitle Bar at Bottom */}
        <div className="live-vc-subtitle-bar">
          <div className="live-vc-subtitle-header">
            <span className="live-vc-sub-badge">
              <i className="fa-solid fa-closed-captioning"></i> REAL-TIME TRANSLATED SUBTITLES
            </span>
            <span className="live-vc-sub-status">
              {isLiveActive ? 'NEURAL VOICE CLONE ACTIVE' : 'CAPTIONS ONLY'}
            </span>
          </div>

          <div className="live-vc-subtitle-content">
            {subtitles ? (
              <div className="live-vc-caption-row">
                <div className="live-vc-caption-orig">
                  <span className="live-vc-caption-speaker">{subtitles.speakerName}:</span>
                  <span className="live-vc-caption-text">"{subtitles.originalText}"</span>
                  <span className="live-vc-caption-lang">[{getLangObj(subtitles.speakLang).tag}]</span>
                </div>

                {isLiveActive && subtitles.speakLang !== subtitles.hearLang && (
                  <div className="live-vc-caption-trans">
                    <span className="live-vc-caption-arrow"><i className="fa-solid fa-arrow-right"></i></span>
                    <span className="live-vc-caption-translated-text">"{subtitles.translatedText}"</span>
                    <span className="live-vc-caption-target-lang">[{getLangObj(subtitles.hearLang).tag}]</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="live-vc-caption-placeholder">
                <i className="fa-solid fa-waveform-lines fa-fade"></i> Speak naturally. ChronEX will translate your voice into everyone's native language in real-time.
              </p>
            )}
          </div>
        </div>

        {/* Push-to-Talk & Mic Control Deck */}
        <div className="live-vc-controls-deck">
          <div className="live-vc-controls-left">
            <button
              type="button"
              className={`live-vc-action-btn ${isMicActive ? 'active' : ''}`}
              onClick={toggleHandsFreeMic}
              title={isMicActive ? 'Mute Microphone' : 'Activate Microphone'}
            >
              <i className={`fa-solid ${isMicActive ? 'fa-microphone' : 'fa-microphone-slash'}`}></i>
              <span>{isMicActive ? 'Mute' : 'Unmute'}</span>
            </button>
          </div>

          {/* Center Main Push-to-Talk Button */}
          <div className="live-vc-center-ptt">
            <button
              type="button"
              className={`live-vc-ptt-btn ${isMicActive ? 'active' : ''}`}
              onMouseDown={startPushToTalk}
              onMouseUp={stopPushToTalk}
              onTouchStart={startPushToTalk}
              onTouchEnd={stopPushToTalk}
              title="Hold to speak your language"
            >
              <i className="fa-solid fa-microphone-lines"></i>
              <span>{isMicActive ? 'TRANSMITTING VOICE...' : 'Hold to speak your language'}</span>
            </button>
          </div>

          <div className="live-vc-controls-right">
            <span className="live-vc-telemetry">
              <span className="live-vc-dot"></span>
              <span>2GB VRAM OPTIMIZED</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveVC;
