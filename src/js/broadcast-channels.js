/**
 * NEXCHAT - Tactical Broadcast Channels & Verified Wire Feeds Engine
 * One-to-many broadcast publishing, channel subscriber management,
 * verified wire feeds, read counters, and channel reaction metrics.
 * STRICTLY NO EMOJIS: Clean cyberpunk typography and iconography.
 */

(function() {
  'use strict';

  const DEFAULT_CHANNELS = [
    {
      id: 'chan_nexus_wire',
      name: 'Nexus Cyber Wire',
      tag: '[OFFICIAL]',
      subscribers: 3240,
      verified: true,
      description: 'Zero-day security alerts, kernel updates, and cryptographic network status.',
      posts: [
        { id: 'p1', author: 'Cyber Command', time: '12m ago', text: 'All enclave nodes upgraded to Apex-Shield v10.5. Prototype pollution defense active.' },
        { id: 'p2', author: 'Security Ops', time: '1h ago', text: 'Sector 02 quantum relays synchronized with 99.98% uptime.' }
      ]
    },
    {
      id: 'chan_market_intel',
      name: 'Alpha Market Intel',
      tag: '[PREDICTIONS]',
      subscribers: 1890,
      verified: true,
      description: 'Real-time prediction market telemetry, token liquidity, and prize pools.',
      posts: [
        { id: 'p3', author: 'Alpha Analyst', time: '35m ago', text: 'Prediction pot in channel reached 1,200 tokens. Payout resolution scheduled at market close.' }
      ]
    }
  ];

  class BroadcastChannelsEngine {
    constructor() {
      this.channels = DEFAULT_CHANNELS;
      this.activeChannelId = 'chan_nexus_wire';
      this.init();
    }

    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.bindDOM());
      } else {
        this.bindDOM();
      }
    }

    bindDOM() {
      this.injectModal();
      this.injectHeaderTrigger();
    }

    injectModal() {
      if (document.getElementById('broadcastChannelsModal')) return;

      const modal = document.createElement('div');
      modal.id = 'broadcastChannelsModal';
      modal.className = 'cyber-modal-backdrop';
      modal.style.display = 'none';

      modal.innerHTML = `
        <div class="cyber-modal-window channels-modal-window">
          <div class="cyber-modal-header">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-bullhorn text-[#00ff66] text-lg"></i>
              <h3 class="font-bold text-white text-base">TACTICAL BROADCAST CHANNELS</h3>
              <span class="channel-feed-badge">ONE-TO-MANY WIRE</span>
            </div>
            <button type="button" class="cyber-modal-close" id="closeChannelsModalBtn"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="channels-modal-body">
            <!-- Channel Switcher Tabs -->
            <div class="channels-nav-row" id="channelsNavRow">
              <!-- Rendered dynamically -->
            </div>

            <!-- Active Channel Feed Viewport -->
            <div class="channel-feed-viewport mt-3" id="channelFeedViewport">
              <!-- Rendered dynamically -->
            </div>

            <!-- Publisher Bar (Admin) -->
            <div class="channel-publish-bar mt-3">
              <input type="text" id="channelPublishInput" class="channel-publish-input" placeholder="Publish tactical dispatch to channel subscribers..." />
              <button type="button" id="confirmChannelPublishBtn" class="channel-publish-btn">
                <i class="fa-solid fa-paper-plane"></i> BROADCAST
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this.bindModalEvents();
      this.renderFeed();
    }

    bindModalEvents() {
      const modal = document.getElementById('broadcastChannelsModal');
      document.getElementById('closeChannelsModalBtn')?.addEventListener('click', () => {
        modal.style.display = 'none';
      });

      document.getElementById('confirmChannelPublishBtn')?.addEventListener('click', () => {
        const input = document.getElementById('channelPublishInput');
        const text = input ? input.value.trim() : '';
        if (!text) return;

        const chan = this.channels.find(c => c.id === this.activeChannelId);
        if (chan) {
          chan.posts.unshift({
            id: `p_${Date.now()}`,
            author: window.currentUserName || 'Operative',
            time: 'Just now',
            text: text
          });
          this.renderFeed();
          if (input) input.value = '';
          if (typeof window.showNotif === 'function') {
            window.showNotif(`Published dispatch to ${chan.name}`, 'success', 2000);
          }
          if (typeof window.playCyberSfx === 'function') window.playCyberSfx('affirm');
        }
      });
    }

    injectHeaderTrigger() {
      const headerActions = document.querySelector('.chat-detail-header-actions') || 
                            document.querySelector('.chat-detail-header-right');
      if (headerActions && !document.getElementById('broadcastChannelsBtnHeader')) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'broadcastChannelsBtnHeader';
        btn.className = 'header-icon-btn';
        btn.title = 'Tactical Broadcast Channels';
        btn.innerHTML = `<i class="fa-solid fa-bullhorn text-[#00ff66]"></i>`;
        btn.addEventListener('click', () => this.openModal());
        headerActions.appendChild(btn);
      }
    }

    
    closeModal() {
      const modal = document.getElementById('broadcastChannelsModal');
      if (modal) modal.style.display = 'none';
    }
    openModal() {
      const modal = document.getElementById('broadcastChannelsModal');
      if (!modal) return;
      modal.style.display = 'flex';
      this.renderFeed();
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('sonar');
    }

    renderFeed() {
      const nav = document.getElementById('channelsNavRow');
      if (nav) {
        nav.innerHTML = this.channels.map(c => `
          <button type="button" class="channel-tab-pill ${c.id === this.activeChannelId ? 'active' : ''}" data-chan-id="${c.id}">
            ${c.name} (${c.subscribers})
          </button>
        `).join('');

        nav.querySelectorAll('.channel-tab-pill').forEach(btn => {
          btn.addEventListener('click', () => {
            this.activeChannelId = btn.dataset.chanId;
            this.renderFeed();
          });
        });
      }

      const viewport = document.getElementById('channelFeedViewport');
      const activeChan = this.channels.find(c => c.id === this.activeChannelId) || this.channels[0];
      if (viewport && activeChan) {
        viewport.innerHTML = `
          <div class="channel-info-banner mb-3">
            <div class="flex items-center justify-between">
              <h4 class="font-bold text-white text-sm">${activeChan.name} ${activeChan.tag}</h4>
              <span class="text-xs text-[#00ff66] font-mono">${activeChan.subscribers.toLocaleString()} SUBSCRIBERS</span>
            </div>
            <p class="text-xs text-gray-400 mt-1">${activeChan.description}</p>
          </div>

          <div class="channel-posts-list">
            ${activeChan.posts.map(post => `
              <div class="channel-post-item">
                <div class="flex items-center justify-between">
                  <strong class="text-[#00d4ff] text-xs font-mono">${post.author}</strong>
                  <span class="text-[10px] text-gray-500 font-mono">${post.time}</span>
                </div>
                <p class="text-xs text-gray-200 mt-1">${post.text}</p>
                <div class="post-reactions-bar mt-2">
                  <button type="button" class="post-rxn-btn"><i class="fa-solid fa-check"></i> ACK</button>
                  <button type="button" class="post-rxn-btn"><i class="fa-solid fa-shield"></i> VERIFIED</button>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    }
  }

  window.broadcastChannelsEngine = new BroadcastChannelsEngine();
})();
