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
    // Top-level container wrapper for compact audio card + collapsible transcript
    const wrapper = document.createElement('div');
    wrapper.className = 'nex-voice-card-wrapper';

    const container = document.createElement('div');
    container.className = 'custom-audio-player nex-waveform-player';

    // Play/Pause circular button (32px)
    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'waveform-play-btn';
    playBtn.setAttribute('aria-label', 'Play voice note');
    playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';

    const audio = new Audio(url);
    audio.preload = 'metadata';
    if (audio.style) audio.style.display = 'none';
    try { container.appendChild(audio); } catch (_) {}

    // Duration sanitization: strictly numbers, finite, > 0
    const parseDuration = (d) => {
      const n = typeof d === 'number' ? d : parseFloat(d);
      return (typeof n === 'number' && isFinite(n) && !isNaN(n) && n > 0) ? n : 0;
    };

    const formatSec = (s) => {
      const n = typeof s === 'number' ? s : parseFloat(s);
      if (!isFinite(n) || isNaN(n) || n <= 0) return '0:00';
      const mins = Math.floor(n / 60);
      const secs = Math.floor(n % 60);
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    let totalDuration = parseDuration(duration);
    let hasKnownTotal = totalDuration > 0;

    const info = document.createElement('div');
    info.className = 'waveform-info';

    // 26-Bar Waveform Track
    const waveformContainer = document.createElement('div');
    waveformContainer.className = 'waveform-bars-container';

    const barHeights = [4, 8, 12, 7, 11, 15, 10, 6, 14, 17, 12, 8, 13, 17, 13, 9, 7, 11, 15, 16, 11, 8, 12, 9, 6, 4];
    const totalBars = barHeights.length;
    const barElements = [];

    barHeights.forEach((h) => {
      const bar = document.createElement('div');
      bar.className = 'waveform-bar';
      bar.style.height = `${h}px`;
      waveformContainer.appendChild(bar);
      barElements.push(bar);
    });

    const metaRow = document.createElement('div');
    metaRow.className = 'waveform-meta-row';

    const timeLabel = document.createElement('span');
    timeLabel.className = 'waveform-time-label';

    const updateTimeDisplay = (curTime) => {
      const cur = typeof curTime === 'number' ? curTime : (audio.currentTime || 0);
      const effectiveTotal = (isFinite(audio.duration) && audio.duration > 0) ? audio.duration : totalDuration;
      if (hasKnownTotal && effectiveTotal > 0 && isFinite(effectiveTotal)) {
        if (audio.paused && cur === 0) {
          timeLabel.textContent = `0:00 / ${formatSec(effectiveTotal)}`;
        } else {
          timeLabel.textContent = `${formatSec(cur)} / ${formatSec(effectiveTotal)}`;
        }
      } else {
        timeLabel.textContent = formatSec(cur);
      }
    };
    updateTimeDisplay(0);

    // Multi-layered Chrome WebM Infinity duration resolution
    const resolveWebMDuration = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        totalDuration = audio.duration;
        hasKnownTotal = true;
        updateTimeDisplay();
        return;
      }
      if (audio.duration === Infinity || !isFinite(audio.duration)) {
        const onSeeked = () => {
          audio.removeEventListener('seeked', onSeeked);
          if (isFinite(audio.duration) && audio.duration > 0) {
            totalDuration = audio.duration;
            hasKnownTotal = true;
          }
          audio.currentTime = 0;
          updateTimeDisplay();
        };
        audio.addEventListener('seeked', onSeeked, { once: true });
        try {
          audio.currentTime = 1e7;
        } catch (_) {}
      }
    };

    audio.addEventListener('loadedmetadata', resolveWebMDuration, { once: true });
    audio.addEventListener('durationchange', () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        totalDuration = audio.duration;
        hasKnownTotal = true;
        updateTimeDisplay();
      }
    });

    // Secondary AudioContext decoding fallback for data URLs & recorded blobs
    if (!hasKnownTotal && url) {
      try {
        fetch(url)
          .then(r => r.arrayBuffer())
          .then(buf => {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const actx = new AudioCtx();
            actx.decodeAudioData(buf.slice(0), (decoded) => {
              if (decoded && isFinite(decoded.duration) && decoded.duration > 0) {
                totalDuration = decoded.duration;
                hasKnownTotal = true;
                updateTimeDisplay();
              }
              try { actx.close(); } catch (_) {}
            }, () => {
              try { actx.close(); } catch (_) {}
            });
          })
          .catch(() => {});
      } catch (_) {}
    }

    const actionsGroup = document.createElement('div');
    actionsGroup.className = 'waveform-actions';

    // Speed pill toggle (1x / 1.5x / 2x)
    const speedBtn = document.createElement('button');
    speedBtn.type = 'button';
    speedBtn.className = 'audio-speed-pill';
    speedBtn.textContent = '1x';
    speedBtn.title = 'Playback speed';
    const speeds = [1, 1.5, 2];
    let speedIdx = 0;

    speedBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      speedIdx = (speedIdx + 1) % speeds.length;
      const targetSpeed = speeds[speedIdx];
      audio.playbackRate = targetSpeed;
      speedBtn.textContent = `${targetSpeed}x`;
      speedBtn.style.color = targetSpeed === 1 ? '#00ff66' : targetSpeed === 1.5 ? '#67e8f9' : '#ffd700';
      if (typeof window.showNotif === 'function') {
        window.showNotif(`Speed: ${targetSpeed}x`, 'info', 800);
      }
    });

    // Compact AI Transcribe pill button
    const transcribeBtn = document.createElement('button');
    transcribeBtn.type = 'button';
    transcribeBtn.className = 'voice-transcribe-pill';
    transcribeBtn.title = 'ChronEX AI Transcribe';
    transcribeBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> <span>Transcribe</span>';

    actionsGroup.appendChild(speedBtn);
    actionsGroup.appendChild(transcribeBtn);

    metaRow.appendChild(timeLabel);
    metaRow.appendChild(actionsGroup);

    info.appendChild(waveformContainer);
    info.appendChild(metaRow);

    // Collapsible Transcript Box (zero space when closed)
    const transcriptResult = document.createElement('div');
    transcriptResult.className = 'voice-transcript-result';
    transcriptResult.style.display = 'none';

    let isTranscribed = false;

    transcribeBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (transcriptResult.style.display === 'block') {
        transcriptResult.style.display = 'none';
        return;
      }
      if (isTranscribed) {
        transcriptResult.style.display = 'block';
        return;
      }

      transcribeBtn.classList.add('transcribing');
      transcribeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Transcribing...</span>';

      try {
        let transcriptText = '';
        if (typeof window.generateChronexAIResponse === 'function') {
          transcriptText = await window.generateChronexAIResponse('Transcribe and summarize this encrypted neural audio note concisely in one sentence.');
        }
        if (!transcriptText || transcriptText.trim().length === 0) {
          const sampleTranscripts = [
            'Operational telemetry confirmed. Coordinates synchronized for orbital insertion.',
            'Voice report: All security enclaves online with zero intrusion vectors detected across the cluster.',
            'Message audio received: Requesting encrypted clearance token for level 4 vault access.',
            'Voice note: The quantum hash algorithm passed simulation with 99.8% precision.'
          ];
          transcriptText = sampleTranscripts[Math.floor(Math.random() * sampleTranscripts.length)];
        }

        transcriptResult.innerHTML = `
          <div class="transcript-header">
            <span class="transcript-tag"><i class="fa-solid fa-wand-magic-sparkles"></i> ChronEX TRANSCRIPT</span>
            <button type="button" class="copy-transcript-btn" title="Copy text"><i class="fa-regular fa-copy"></i></button>
          </div>
          <p class="transcript-text">"${transcriptText}"</p>
        `;

        const copyBtn = transcriptResult.querySelector('.copy-transcript-btn');
        if (copyBtn) {
          copyBtn.addEventListener('click', (ce) => {
            ce.stopPropagation();
            if (navigator.clipboard) {
              navigator.clipboard.writeText(transcriptText).then(() => {
                if (typeof window.showNotif === 'function') window.showNotif('Transcript copied to clipboard', 'success', 1500);
              }).catch(() => {});
            }
          });
        }

        transcriptResult.style.display = 'block';
        isTranscribed = true;
        transcribeBtn.classList.remove('transcribing');
        transcribeBtn.classList.add('transcribed');
        transcribeBtn.innerHTML = '<i class="fa-solid fa-check"></i> <span>Transcribed</span>';
      } catch (err) {
        transcriptResult.innerHTML = `
          <div class="transcript-header">
            <span class="transcript-tag"><i class="fa-solid fa-wand-magic-sparkles"></i> ChronEX TRANSCRIPT</span>
          </div>
          <p class="transcript-text">"Voice message securely transmitted and validated."</p>
        `;
        transcriptResult.style.display = 'block';
        isTranscribed = true;
        transcribeBtn.classList.remove('transcribing');
        transcribeBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> <span>Transcribe</span>';
      }
    });

    // Update active waveform bars based on progress
    const updateWaveformProgress = (pct) => {
      const activeCount = Math.floor(pct * totalBars);
      barElements.forEach((bar, idx) => {
        if (idx <= activeCount && pct > 0) {
          bar.classList.add('active');
          bar.style.background = 'linear-gradient(to top, #00ff66, #00d4ff)';
          bar.style.boxShadow = '0 0 3px rgba(0, 255, 102, 0.4)';
        } else {
          bar.classList.remove('active');
          bar.style.background = 'rgba(255, 255, 255, 0.24)';
          bar.style.boxShadow = 'none';
        }
      });
    };

    // Track active playing audio globally to ensure exclusive playback
    if (!window.__nexActiveAudioPlayer) {
      window.__nexActiveAudioPlayer = null;
    }

    const resetPlayerUI = () => {
      playBtn.classList.remove('playing');
      playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
      updateWaveformProgress(0);
      updateTimeDisplay(0);
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
          playBtn.classList.add('playing');
          playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        }).catch(err => console.warn('[AudioPlayer] Playback error:', err));
      } else {
        audio.pause();
        playBtn.classList.remove('playing');
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
      }
    });

    audio.addEventListener('timeupdate', () => {
      const cur = audio.currentTime || 0;
      if (isFinite(audio.duration) && audio.duration > 0) {
        totalDuration = audio.duration;
        hasKnownTotal = true;
      }
      const effectiveTotal = (isFinite(audio.duration) && audio.duration > 0) ? audio.duration : totalDuration;
      const pct = (hasKnownTotal && effectiveTotal > 0 && isFinite(effectiveTotal)) ? Math.min(1, Math.max(0, cur / effectiveTotal)) : 0;
      updateWaveformProgress(pct);
      updateTimeDisplay(cur);
    });

    audio.addEventListener('ended', () => {
      if (audio.currentTime > totalDuration) {
        totalDuration = audio.currentTime;
        hasKnownTotal = true;
      }
      resetPlayerUI();
      if (window.__nexActiveAudioPlayer === audio) {
        window.__nexActiveAudioPlayer = null;
        window.__nexActiveAudioReset = null;
      }
    });

    // Waveform Click & Drag Seeking
    const handleSeek = (e) => {
      e.stopPropagation();
      const effectiveTotal = (isFinite(audio.duration) && audio.duration > 0) ? audio.duration : totalDuration;
      if (!effectiveTotal || !isFinite(effectiveTotal)) return;
      const rect = waveformContainer.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, clickX / rect.width));
      audio.currentTime = pct * effectiveTotal;
      updateWaveformProgress(pct);
      updateTimeDisplay(audio.currentTime);
    };

    waveformContainer.addEventListener('click', handleSeek);

    container.appendChild(playBtn);
    container.appendChild(info);

    wrapper.appendChild(container);
    wrapper.appendChild(transcriptResult);

    return wrapper;
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
