/**
 * NEXCHAT Messaging Features Service
 * Handles reply previews, rich audio message playback, and navigation hooks.
 */

let activeReply = null;

export const messagingFeatures = {
  replyingToMessage: () => activeReply,

  setReplyingToMessage: (msg) => {
    activeReply = msg;
    const preview = document.getElementById('replyPreview');
    const nameEl = document.getElementById('replyFromName');
    const msgEl = document.getElementById('replyMessage');
    if (preview && nameEl && msgEl && msg) {
      nameEl.textContent = msg.senderName || 'User';
      const snippet = msg.text || (msg.attachment ? (msg.attachment.fileName || 'Attachment') : 'Message');
      msgEl.textContent = snippet.length > 80 ? snippet.substring(0, 80) + '...' : snippet;
      preview.style.display = 'flex';
      const input = document.getElementById('message-input');
      if (input) input.focus();
    }
  },

  hideReplyPreview: () => {
    activeReply = null;
    const preview = document.getElementById('replyPreview');
    if (preview) preview.style.display = 'none';
  },

  createAudioPlayerElement: (url, duration = 0) => {
    const container = document.createElement('div');
    container.className = 'custom-audio-player nex-waveform-player';
    container.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      background: rgba(18, 24, 38, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(12px);
      border-radius: 18px;
      min-width: 250px;
      max-width: 100%;
      margin: 4px 0;
      box-sizing: border-box;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
    `;

    // Play/Pause circular button
    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'waveform-play-btn';
    playBtn.style.cssText = `
      background: linear-gradient(135deg, #00ff66, #00d4ff);
      border: none;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #000;
      cursor: pointer;
      flex-shrink: 0;
      transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      box-shadow: 0 2px 10px rgba(0, 255, 102, 0.4);
    `;
    playBtn.innerHTML = '<i class="fa-solid fa-play" style="font-size: 13px; margin-left: 2px;"></i>';

    const audio = new Audio(url);
    audio.preload = 'metadata';

    const info = document.createElement('div');
    info.style.cssText = 'display: flex; flex-direction: column; flex: 1; min-width: 0; gap: 4px;';

    // 28-Bar Waveform Track
    const waveformContainer = document.createElement('div');
    waveformContainer.className = 'waveform-bars-container';
    waveformContainer.style.cssText = `
      height: 28px;
      display: flex;
      align-items: center;
      gap: 2.5px;
      cursor: pointer;
      padding: 2px 0;
      position: relative;
      user-select: none;
    `;

    // Deterministic bar heights pattern
    const barHeights = [
      8, 14, 20, 12, 18, 24, 16, 10, 22, 26, 18, 14, 20, 28,
      22, 16, 12, 18, 24, 26, 18, 14, 20, 16, 10, 14, 12, 8
    ];
    const totalBars = barHeights.length;
    const barElements = [];

    barHeights.forEach((h, idx) => {
      const bar = document.createElement('div');
      bar.className = 'waveform-bar';
      bar.style.cssText = `
        flex: 1;
        height: ${h}px;
        background: rgba(255, 255, 255, 0.25);
        border-radius: 2px;
        transition: background 0.1s ease, transform 0.15s ease;
      `;
      waveformContainer.appendChild(bar);
      barElements.push(bar);
    });

    const metaRow = document.createElement('div');
    metaRow.style.cssText = 'display: flex; justify-content: space-between; align-items: center; font-size: 10.5px; opacity: 0.85; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;';

    const formatSec = (s) => {
      if (!s || isNaN(s)) return '0:00';
      const mins = Math.floor(s / 60);
      const secs = Math.floor(s % 60);
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const timeLabel = document.createElement('span');
    timeLabel.textContent = duration ? `0:00 / ${formatSec(duration)}` : '0:00';

    // Speed pill toggle (1x / 1.5x / 2x)
    const speedBtn = document.createElement('button');
    speedBtn.type = 'button';
    speedBtn.className = 'audio-speed-pill';
    speedBtn.style.cssText = `
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 10px;
      color: #00ff66;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    `;
    speedBtn.textContent = '1x';
    const speeds = [1, 1.5, 2];
    let speedIdx = 0;

    speedBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      speedIdx = (speedIdx + 1) % speeds.length;
      const targetSpeed = speeds[speedIdx];
      audio.playbackRate = targetSpeed;
      speedBtn.textContent = `${targetSpeed}x`;
      speedBtn.style.color = targetSpeed === 1 ? '#00ff66' : targetSpeed === 1.5 ? '#67e8f9' : '#ffd700';
    });

    metaRow.appendChild(timeLabel);
    metaRow.appendChild(speedBtn);

    info.appendChild(waveformContainer);
    info.appendChild(metaRow);

    // Update active waveform bars based on progress
    const updateWaveformProgress = (pct) => {
      const activeCount = Math.floor(pct * totalBars);
      barElements.forEach((bar, idx) => {
        if (idx <= activeCount && pct > 0) {
          bar.style.background = 'linear-gradient(to top, #00ff66, #00d4ff)';
          bar.style.boxShadow = '0 0 4px rgba(0, 255, 102, 0.4)';
        } else {
          bar.style.background = 'rgba(255, 255, 255, 0.25)';
          bar.style.boxShadow = 'none';
        }
      });
    };

    // Track active playing audio globally to ensure exclusive playback
    if (!window.__nexActiveAudioPlayer) {
      window.__nexActiveAudioPlayer = null;
    }

    const resetPlayerUI = () => {
      playBtn.innerHTML = '<i class="fa-solid fa-play" style="font-size: 13px; margin-left: 2px;"></i>';
      playBtn.style.background = 'linear-gradient(135deg, #00ff66, #00d4ff)';
      playBtn.style.transform = 'scale(1)';
      updateWaveformProgress(0);
      timeLabel.textContent = audio.duration ? `0:00 / ${formatSec(audio.duration)}` : (duration ? `0:00 / ${formatSec(duration)}` : '0:00');
    };

    playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (audio.paused) {
        if (window.__nexActiveAudioPlayer && window.__nexActiveAudioPlayer !== audio) {
          try {
            window.__nexActiveAudioPlayer.pause();
            if (window.__nexActiveAudioReset) window.__nexActiveAudioReset();
          } catch (_) {}
        }
        window.__nexActiveAudioPlayer = audio;
        window.__nexActiveAudioReset = resetPlayerUI;

        audio.play().then(() => {
          playBtn.innerHTML = '<i class="fa-solid fa-pause" style="font-size: 13px;"></i>';
          playBtn.style.background = 'linear-gradient(135deg, #00d4ff, #8b5cf6)';
          playBtn.style.transform = 'scale(1.05)';
        }).catch(err => console.warn('[AudioPlayer] Playback error:', err));
      } else {
        audio.pause();
        playBtn.innerHTML = '<i class="fa-solid fa-play" style="font-size: 13px; margin-left: 2px;"></i>';
        playBtn.style.background = 'linear-gradient(135deg, #00ff66, #00d4ff)';
        playBtn.style.transform = 'scale(1)';
      }
    });

    audio.addEventListener('loadedmetadata', () => {
      if (audio.duration && !isNaN(audio.duration)) {
        timeLabel.textContent = `0:00 / ${formatSec(audio.duration)}`;
      }
    });

    audio.addEventListener('timeupdate', () => {
      if (audio.duration) {
        const pct = audio.currentTime / audio.duration;
        updateWaveformProgress(pct);
        timeLabel.textContent = `${formatSec(audio.currentTime)} / ${formatSec(audio.duration)}`;
      }
    });

    audio.addEventListener('ended', () => {
      resetPlayerUI();
      if (window.__nexActiveAudioPlayer === audio) {
        window.__nexActiveAudioPlayer = null;
        window.__nexActiveAudioReset = null;
      }
    });

    // Waveform Click & Drag Seeking
    const handleSeek = (e) => {
      e.stopPropagation();
      if (!audio.duration) return;
      const rect = waveformContainer.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, clickX / rect.width));
      audio.currentTime = pct * audio.duration;
      updateWaveformProgress(pct);
    };

    waveformContainer.addEventListener('click', handleSeek);

    container.appendChild(playBtn);
    container.appendChild(info);
    return container;
  }
};

window.messagingFeatures = messagingFeatures;

const initMessagingFeatures = () => {
  const navItems = document.querySelectorAll('[data-nav]');
  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      const navSection = item.getAttribute('data-nav');
      if (navSection && window.handleNavigation) {
        window.handleNavigation(navSection);
      }
    });
  });

  const cancelReplyBtn = document.getElementById('cancelReplyBtn');
  if (cancelReplyBtn) {
    cancelReplyBtn.addEventListener('click', () => {
      messagingFeatures.hideReplyPreview();
    });
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMessagingFeatures);
} else {
  initMessagingFeatures();
}

window.__nexchatMessagingFeaturesReady = true;
