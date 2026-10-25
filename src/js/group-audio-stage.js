/**
 * NEXCHAT - Live Cyber Clubhouse / Audio Stage Engine
 * Module: src/js/group-audio-stage.js
 * 
 * Provides Discord & Twitter Spaces style live audio stages inside group chats with
 * spatial visualizer rings, speaker queue, listener seats, and real-time token tipping showers.
 * 
 * STRICTLY ZERO EMOJIS - FontAwesome 6 vector glyphs only.
 */

(function (window) {
  'use strict';

  let activeAudioContext = null;
  let stageState = {
    isOpen: false,
    groupId: null,
    topic: 'Global Cyber Intelligence & Staging',
    speakers: [
      { uid: 's1', name: 'ChronEX Lead', avatar: 'logo.jpg', isSpeaking: true, tips: 1450 },
      { uid: 's2', name: 'Security Operative', avatar: 'favicons/favicon.ico', isSpeaking: false, tips: 820 }
    ],
    listeners: [
      { uid: 'l1', name: 'Cipher_99' },
      { uid: 'l2', name: 'Shadow_Op' },
      { uid: 'l3', name: 'Delta_7' }
    ],
    handRaised: false,
    isMuted: false
  };

  function playTipChime() {
    try {
      if (!activeAudioContext) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        activeAudioContext = new AudioContext();
      }
      if (activeAudioContext.state === 'suspended') {
        activeAudioContext.resume();
      }
      const now = activeAudioContext.currentTime;
      const osc = activeAudioContext.createOscillator();
      const gain = activeAudioContext.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.connect(gain);
      gain.connect(activeAudioContext.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (_) { }
  }

  function launchTokenShower(amount = 100) {
    playTipChime();
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed; inset:0; pointer-events:none; z-index:99999; overflow:hidden;';
    document.body.appendChild(container);

    // Create 30 animated coin glyphs
    for (let i = 0; i < 30; i++) {
      const coin = document.createElement('div');
      const startX = Math.random() * window.innerWidth;
      const duration = 1.2 + Math.random() * 1.5;
      const size = 18 + Math.random() * 12;
      const color = Math.random() > 0.5 ? '#ffd700' : '#00f3ff';

      coin.innerHTML = '<i class="fa-solid fa-coins"></i>';
      coin.style.cssText = `
        position: absolute;
        top: -40px;
        left: ${startX}px;
        font-size: ${size}px;
        color: ${color};
        filter: drop-shadow(0 0 8px ${color});
        animation: tokenFall ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
      `;
      container.appendChild(coin);
    }

    // Add CSS keyframe dynamically if not present
    if (!document.getElementById('tokenShowerStyle')) {
      const style = document.createElement('style');
      style.id = 'tokenShowerStyle';
      style.textContent = `
        @keyframes tokenFall {
          0% { transform: translateY(0) rotate(0deg) scale(0.8); opacity: 1; }
          100% { transform: translateY(${window.innerHeight + 80}px) rotate(720deg) scale(1.2); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    // Floating announcement banner
    const alert = document.createElement('div');
    alert.style.cssText = 'position:fixed; top:80px; left:50%; transform:translateX(-50%); background:rgba(3,7,18,0.95); border:1px solid #ffd700; border-radius:30px; padding:10px 22px; color:#ffd700; font-weight:800; font-size:14px; box-shadow:0 0 25px rgba(255,215,0,0.4); z-index:99999; display:flex; align-items:center; gap:10px; animation:fadeInOut 2.5s forwards;';
    alert.innerHTML = `<i class="fa-solid fa-bolt"></i> +${amount} TOKENS SHOWER POURED ON STAGE!`;
    document.body.appendChild(alert);

    setTimeout(() => {
      container.remove();
      alert.remove();
    }, 2800);
  }

  const NexGroupAudioStage = {
    init() {
      this.bindUi();
    },

    toggleStage(groupId) {
      stageState.groupId = groupId;
      stageState.isOpen = !stageState.isOpen;
      this.render();
    },

    render() {
      let panel = document.getElementById('groupAudioStagePanel');
      if (!stageState.isOpen) {
        if (panel) panel.style.display = 'none';
        return;
      }

      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'groupAudioStagePanel';
        panel.style.cssText = 'background:rgba(3,7,18,0.92); border:1px solid rgba(0,243,255,0.25); border-radius:12px; margin:10px 14px; padding:14px; box-shadow:0 4px 20px rgba(0,243,255,0.08);';
        
        const chatView = document.querySelector('.chat-view') || document.querySelector('.chat-container') || document.getElementById('chatMessages');
        if (chatView && chatView.parentNode) {
          chatView.parentNode.insertBefore(panel, chatView);
        } else {
          document.body.appendChild(panel);
        }
      }

      panel.style.display = 'block';
      panel.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.06);">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="display:inline-flex; align-items:center; gap:5px; background:rgba(0,243,255,0.15); border:1px solid #00f3ff; color:#00f3ff; border-radius:20px; padding:2px 8px; font-size:10px; font-weight:800; text-transform:uppercase;">
              <i class="fa-solid fa-podcast"></i> LIVE STAGE
            </span>
            <strong style="color:#fff; font-size:13px;">${stageState.topic}</strong>
          </div>
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-size:11px; color:#94a3b8; font-family:monospace;">
              <i class="fa-solid fa-headphones"></i> ${stageState.listeners.length} listening
            </span>
            <button type="button" id="btnCloseStage" style="background:none; border:none; color:#94a3b8; cursor:pointer; font-size:14px; margin-left:6px;">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <!-- Speakers Gallery -->
        <div style="display:flex; gap:16px; margin-bottom:14px; overflow-x:auto; padding-bottom:4px;">
          ${stageState.speakers.map(s => `
            <div style="display:flex; flex-direction:column; align-items:center; position:relative; min-width:68px;">
              <div style="position:relative; width:48px; height:48px; border-radius:50%; border:2px solid ${s.isSpeaking ? '#00f3ff' : 'rgba(255,255,255,0.15)'}; box-shadow:${s.isSpeaking ? '0 0 12px #00f3ff' : 'none'}; overflow:hidden;">
                <img src="${s.avatar}" alt="${s.name}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='favicons/favicon.ico'" />
                ${s.isSpeaking ? '<div style="position:absolute; bottom:2px; right:2px; width:10px; height:10px; background:#00f3ff; border-radius:50%; border:2px solid #000;"></div>' : ''}
              </div>
              <span style="font-size:11px; color:#fff; font-weight:600; margin-top:4px; text-align:center; max-width:68px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                ${s.name}
              </span>
              <span style="font-size:9.5px; color:#ffd700; font-family:monospace;">
                <i class="fa-solid fa-coins"></i> ${s.tips}
              </span>
            </div>
          `).join('')}
        </div>

        <!-- Stage Actions -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div style="display:flex; gap:6px;">
            <button type="button" id="btnStageRaiseHand" style="padding:6px 12px; background:${stageState.handRaised ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.06)'}; border:1px solid ${stageState.handRaised ? '#c084fc' : 'rgba(255,255,255,0.15)'}; color:${stageState.handRaised ? '#c084fc' : '#fff'}; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer;">
              <i class="fa-solid fa-hand"></i> ${stageState.handRaised ? 'Hand Raised' : 'Raise Hand'}
            </button>
            <button type="button" id="btnStageMute" style="padding:6px 12px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.15); color:#fff; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer;">
              <i class="fa-solid ${stageState.isMuted ? 'fa-microphone-slash' : 'fa-microphone'}"></i> ${stageState.isMuted ? 'Unmute' : 'Mute'}
            </button>
          </div>
          <div style="display:flex; gap:6px;">
            <button type="button" id="btnTipStageShower" style="padding:6px 14px; background:linear-gradient(135deg, #ffd700, #ff8c00); border:none; color:#000; border-radius:6px; font-size:11px; font-weight:800; cursor:pointer; display:flex; align-items:center; gap:6px; box-shadow:0 0 10px rgba(255,215,0,0.3);">
              <i class="fa-solid fa-bolt"></i> Tip Stage (100)
            </button>
          </div>
        </div>
      `;

      // Event handlers
      panel.querySelector('#btnCloseStage')?.addEventListener('click', () => {
        stageState.isOpen = false;
        panel.style.display = 'none';
      });

      panel.querySelector('#btnStageRaiseHand')?.addEventListener('click', () => {
        stageState.handRaised = !stageState.handRaised;
        this.render();
      });

      panel.querySelector('#btnStageMute')?.addEventListener('click', () => {
        stageState.isMuted = !stageState.isMuted;
        this.render();
      });

      panel.querySelector('#btnTipStageShower')?.addEventListener('click', () => {
        launchTokenShower(100);
        // Increment top speaker's tips
        if (stageState.speakers[0]) {
          stageState.speakers[0].tips += 100;
        }
        setTimeout(() => this.render(), 600);
      });
    },

    bindUi() {
      document.querySelectorAll('#btnOpenGroupStage, .btn-group-stage').forEach(btn => {
        btn.addEventListener('click', () => {
          this.toggleStage('current_group');
        });
      });
    }
  };

  window.NexGroupAudioStage = NexGroupAudioStage;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => NexGroupAudioStage.init());
  } else {
    NexGroupAudioStage.init();
  }
})(window);
