/**

 * NEXCHAT - Tactical Broadcast Channels & Verified Wire Feeds Engine

 * One-to-many broadcast publishing, channel creation, subscriber management,

 * verified wire feeds, read counters, and channel reaction metrics.

 * WhatsApp-Style Flow with Dark Obsidian Glassmorphism

 * STRICTLY NO EMOJIS: Clean cyberpunk typography and iconography.

 */

(function () {

  'use strict';

  // Seeded Official & Discoverable Channels

  const DEFAULT_CHANNELS = [

    {

      id: 'chan_nexchat_official',

      name: 'NEXCHAT Official',

      handle: '@nexchat_official',

      description: 'Official announcements, quantum security firmware updates, and core releases from NEXCHAT Protocol.',

      avatar: 'favicons/icon-192.png',

      creatorId: 'system_nexchat',

      creatorName: 'NEXCHAT Protocol',

      isVerified: true,

      followerCount: 248900,

      createdAt: Date.now() - 86400000 * 30,

      lastPostSnippet: 'NEXCHAT v4.2 Security Protocol rollout complete. Quantum forward secrecy enabled for all active nodes.',

      lastPostTime: 'Today, 10:15 AM',

      posts: [

        {

          id: 'post_nex_1',

          authorName: 'NEXCHAT Protocol',

          text: 'Welcome to NEXCHAT Broadcast Channels! Follow this channel to receive instant real-time security alerts, feature drops, and system status advisories.',

          timestamp: 'Yesterday, 04:20 PM',

          likes: 4120

        },

        {

          id: 'post_nex_2',

          authorName: 'NEXCHAT Protocol',

          text: 'NEXCHAT v4.2 Security Protocol rollout complete. Quantum forward secrecy enabled for all active nodes. End-to-end multi-device sync is now operational with zero latency.',

          timestamp: 'Today, 10:15 AM',

          likes: 6890

        }

      ]

    },

    {

      id: 'chan_chronex_ai',

      name: 'ChronEX AI Intelligence',

      handle: '@chronex_ai',

      description: 'Neural models, deep reasoning breakthroughs, and daily autonomous workspace dispatches.',

      avatar: 'chronex-ai.jpg',

      creatorId: 'system_chronex',

      creatorName: 'ChronEX Neural Core',

      isVerified: true,

      followerCount: 184200,

      createdAt: Date.now() - 86400000 * 20,

      lastPostSnippet: 'Deep reasoning engine calibrated at 99.8% precision with multi-lingual audio transcription.',

      lastPostTime: 'Today, 08:30 AM',

      posts: [

        {

          id: 'post_chronex_1',

          authorName: 'ChronEX Neural Core',

          text: 'Deep reasoning engine calibrated at 99.8% precision with multi-lingual audio transcription. Real-time neural translation supports over 32 global languages directly in your conversations.',

          timestamp: 'Today, 08:30 AM',

          likes: 3150

        }

      ]

    },

    {

      id: 'chan_cyber_defense',

      name: 'Cyber Defense Guild',

      handle: '@cyber_defense',

      description: 'Zero-day vulnerability disclosures, biometric authentication advisories, and cipher vault reports.',

      avatar: 'favicons/icon-192.png',

      creatorId: 'system_defense',

      creatorName: 'Cyber Defense Command',

      isVerified: true,

      followerCount: 96400,

      createdAt: Date.now() - 86400000 * 15,

      lastPostSnippet: 'Biometric authorization active across all secondary linked hardware keys.',

      lastPostTime: 'Yesterday, 07:45 PM',

      posts: [

        {

          id: 'post_defense_1',

          authorName: 'Cyber Defense Command',

          text: 'Biometric authorization active across all secondary linked hardware keys. Ensure your enclave key backup is stored securely.',

          timestamp: 'Yesterday, 07:45 PM',

          likes: 1840

        }

      ]

    }

  ];

  class BroadcastChannelsEngine {

    constructor() {
      this.channels = JSON.parse(JSON.stringify(DEFAULT_CHANNELS));
      this.followedChannelIds = new Set(['chan_nexchat_official']);
      this.activeFeedChannelId = null;
      this.currentTab = 'explore';
      this.hasMountedUI = false;
    }

    init() {

      this.loadStorage();

      this.injectStyles();

      this.mountModals();

      this.renderChannelsInUpdates();

      this.bindFabListeners();

      console.log('[ChannelsEngine] Initialized with', this.channels.length, 'channels');

    }

    loadStorage() {

      try {

        const storedChannels = localStorage.getItem('nexchat_channels_vault');

        if (storedChannels) {

          this.channels = JSON.parse(storedChannels);

        } else {

          this.channels = JSON.parse(JSON.stringify(DEFAULT_CHANNELS));

          this.saveChannels();

        }

        const storedFollowed = localStorage.getItem('nexchat_followed_channels');

        if (storedFollowed) {

          this.followedChannelIds = new Set(JSON.parse(storedFollowed));

        } else {

          this.followedChannelIds = new Set(['chan_nexchat_official']);

          this.saveFollowed();

        }

      } catch (err) {

        console.warn('[ChannelsEngine] Storage load fallback:', err);

        this.channels = JSON.parse(JSON.stringify(DEFAULT_CHANNELS));

        this.followedChannelIds = new Set(['chan_nexchat_official']);

      }

    }

    saveChannels() {

      try {

        localStorage.setItem('nexchat_channels_vault', JSON.stringify(this.channels));

      } catch (e) { }

    }

    saveFollowed() {

      try {

        localStorage.setItem('nexchat_followed_channels', JSON.stringify(Array.from(this.followedChannelIds)));

      } catch (e) { }

    }

    getCurrentUser() {

      if (window.auth?.currentUser) {

        return window.auth.currentUser;

      }

      return {

        uid: 'user_' + (localStorage.getItem('nex_device_id') || 'local_node'),

        displayName: localStorage.getItem('nex_user_name') || 'Operator'

      };

    }

    injectStyles() {

      if (document.getElementById('channels-engine-styles')) return;

      const style = document.createElement('style');

      style.id = 'channels-engine-styles';

      style.textContent = `

        /* Channels Engine Modal & Feed Styles */

        .channels-modal-overlay {

          position: fixed;

          top: 0;

          left: 0;

          right: 0;

          bottom: 0;

          background: rgba(11, 20, 26, 0.88);

          backdrop-filter: blur(8px);

          -webkit-backdrop-filter: blur(8px);

          z-index: 10005;

          display: flex;

          align-items: center;

          justify-content: center;

          padding: 14px;

          opacity: 0;

          pointer-events: none;

          transition: opacity 0.22s ease;

          box-sizing: border-box;

        }

        .channels-modal-overlay.open {

          opacity: 1;

          pointer-events: auto;

        }

        .channels-modal-card {

          width: 100%;

          max-width: 520px;

          background: #111b21;

          border: 1px solid rgba(255, 255, 255, 0.08);

          border-radius: 18px;

          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7);

          overflow: hidden;

          display: flex;

          flex-direction: column;

          max-height: 88vh;

          transform: translateY(12px) scale(0.98);

          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);

        }

        .channels-modal-overlay.open .channels-modal-card {

          transform: translateY(0) scale(1);

        }

        .channels-modal-header {

          display: flex;

          align-items: center;

          justify-content: space-between;

          padding: 14px 18px;

          background: #182229;

          border-bottom: 1px solid rgba(255, 255, 255, 0.06);

        }

        .channels-header-left {

          display: flex;

          align-items: center;

          gap: 10px;

        }

        .channels-header-icon {

          width: 34px;

          height: 34px;

          border-radius: 10px;

          background: rgba(0, 255, 102, 0.12);

          border: 1px solid rgba(0, 255, 102, 0.3);

          color: #00ff66;

          display: flex;

          align-items: center;

          justify-content: center;

          font-size: 15px;

        }

        .channels-header-title {

          font-size: 17px;

          font-weight: 700;

          color: #e9edef;

          margin: 0;

        }

        .channels-header-actions {

          display: flex;

          align-items: center;

          gap: 8px;

        }

        .btn-create-channel-pill {

          background: #00a884;

          color: #111b21;

          border: none;

          padding: 6px 14px;

          border-radius: 9999px;

          font-size: 12.5px;

          font-weight: 700;

          cursor: pointer;

          display: inline-flex;

          align-items: center;

          gap: 6px;

          transition: background 0.18s ease;

        }

        .btn-create-channel-pill:hover {

          background: #00c498;

        }

        .channels-close-btn {

          background: transparent;

          border: none;

          color: #8696a0;

          font-size: 18px;

          width: 32px;

          height: 32px;

          border-radius: 50%;

          cursor: pointer;

          display: flex;

          align-items: center;

          justify-content: center;

        }

        .channels-close-btn:hover {

          background: rgba(255, 255, 255, 0.08);

          color: #e9edef;

        }

        /* Tabs */

        .channels-modal-tabs {

          display: flex;

          background: #111b21;

          border-bottom: 1px solid rgba(255, 255, 255, 0.06);

          padding: 0 14px;

        }

        .channel-tab-btn {

          flex: 1;

          padding: 11px 8px;

          background: transparent;

          border: none;

          border-bottom: 2px solid transparent;

          color: #8696a0;

          font-size: 13.5px;

          font-weight: 600;

          cursor: pointer;

          text-align: center;

          transition: all 0.18s ease;

        }

        .channel-tab-btn.active {

          color: #00ff66;

          border-bottom-color: #00ff66;

        }

        /* Search in Modal */

        .channels-search-bar {

          padding: 10px 14px 6px 14px;

          background: #111b21;

        }

        .channels-search-input-box {

          display: flex;

          align-items: center;

          gap: 10px;

          background: #202c33;

          border-radius: 9999px;

          padding: 0 14px;

          height: 36px;

          border: 1px solid rgba(255, 255, 255, 0.06);

        }

        .channels-search-input {

          background: transparent;

          border: none;

          outline: none;

          color: #e9edef;

          font-size: 13.5px;

          width: 100%;

        }

        .channels-search-input::placeholder {

          color: #8696a0;

        }

        /* Channel Item List */

        .channels-modal-list {

          flex: 1 1 auto;

          overflow-y: auto;

          padding: 6px 0;

          max-height: 52vh;

        }

        .channel-card-row {

          display: flex;

          align-items: center;

          gap: 12px;

          padding: 10px 16px;

          cursor: pointer;

          transition: background 0.15s ease;

          border-bottom: 1px solid rgba(255, 255, 255, 0.03);

        }

        .channel-card-row:hover {

          background: rgba(255, 255, 255, 0.04);

        }

        .channel-card-avatar {

          width: 46px;

          height: 46px;

          border-radius: 50%;

          object-fit: cover;

          background: #202c33;

          flex-shrink: 0;

          border: 1.5px solid rgba(0, 255, 102, 0.3);

        }

        .channel-card-info {

          flex: 1 1 auto;

          min-width: 0;

        }

        .channel-card-title-row {

          display: flex;

          align-items: center;

          gap: 6px;

        }

        .channel-card-name {

          font-size: 15px;

          font-weight: 700;

          color: #e9edef;

          white-space: nowrap;

          overflow: hidden;

          text-overflow: ellipsis;

        }

        .channel-verified-badge {

          color: #00ff66;

          font-size: 13px;

          flex-shrink: 0;

        }

        .channel-card-followers {

          font-size: 12px;

          color: #8696a0;

          margin-top: 2px;

        }

        .channel-card-snippet {

          font-size: 12.5px;

          color: #64748b;

          white-space: nowrap;

          overflow: hidden;

          text-overflow: ellipsis;

          margin-top: 3px;

        }

        .btn-follow-toggle {

          padding: 6px 14px;

          border-radius: 9999px;

          font-size: 12px;

          font-weight: 700;

          cursor: pointer;

          flex-shrink: 0;

          transition: all 0.18s ease;

          border: 1px solid #00a884;

          background: transparent;

          color: #00a884;

        }

        .btn-follow-toggle:hover {

          background: rgba(0, 168, 132, 0.12);

        }

        .btn-follow-toggle.following {

          background: #202c33;

          border-color: rgba(255, 255, 255, 0.1);

          color: #8696a0;

        }

        .btn-follow-toggle.following:hover {

          background: rgba(239, 68, 68, 0.12);

          border-color: #ef4444;

          color: #ef4444;

        }

        /* Updates Tab Channel Card Rows */

        .updates-channel-item {

          display: flex;

          align-items: center;

          gap: 12px;

          padding: 9px 16px;

          cursor: pointer;

          transition: background 0.15s ease;

          border-bottom: 1px solid rgba(255, 255, 255, 0.03);

        }

        .updates-channel-item:hover {

          background: rgba(255, 255, 255, 0.04);

        }

        .updates-channel-avatar {

          width: 48px;

          height: 48px;

          border-radius: 50%;

          object-fit: cover;

          background: #202c33;

          border: 1.5px solid rgba(0, 255, 102, 0.35);

          flex-shrink: 0;

        }

        .updates-channel-content {

          flex: 1 1 auto;

          min-width: 0;

        }

        .updates-channel-top {

          display: flex;

          align-items: center;

          justify-content: space-between;

        }

        .updates-channel-name-wrap {

          display: flex;

          align-items: center;

          gap: 5px;

          min-width: 0;

        }

        .updates-channel-name {

          font-size: 15px;

          font-weight: 600;

          color: #e9edef;

          white-space: nowrap;

          overflow: hidden;

          text-overflow: ellipsis;

        }

        .updates-channel-time {

          font-size: 11.5px;

          color: #8696a0;

          flex-shrink: 0;

        }

        .updates-channel-snippet {

          font-size: 13px;

          color: #8696a0;

          white-space: nowrap;

          overflow: hidden;

          text-overflow: ellipsis;

          margin-top: 3px;

        }

        /* Discover More Channels Carousel */

        .channels-discover-strip {

          padding: 12px 16px 14px 16px;

          border-bottom: 1px solid rgba(255, 255, 255, 0.06);

        }

        .channels-discover-title {

          font-size: 13.5px;

          font-weight: 600;

          color: #8696a0;

          margin-bottom: 10px;

          display: flex;

          align-items: center;

          justify-content: space-between;

        }

        .channels-cards-scroll {

          display: flex;

          gap: 12px;

          overflow-x: auto;

          scrollbar-width: none;

          padding-bottom: 4px;

        }

        .channels-cards-scroll::-webkit-scrollbar {

          display: none;

        }

        .channel-spotlight-card {

          width: 140px;

          min-width: 140px;

          background: #182229;

          border: 1px solid rgba(255, 255, 255, 0.08);

          border-radius: 14px;

          padding: 14px 10px 12px 10px;

          display: flex;

          flex-direction: column;

          align-items: center;

          text-align: center;

          position: relative;

        }

        .spotlight-avatar {

          width: 50px;

          height: 50px;

          border-radius: 50%;

          object-fit: cover;

          margin-bottom: 8px;

          border: 1.5px solid rgba(0, 255, 102, 0.4);

        }

        .spotlight-name {

          font-size: 13px;

          font-weight: 700;

          color: #e9edef;

          white-space: nowrap;

          overflow: hidden;

          text-overflow: ellipsis;

          width: 100%;

        }

        .spotlight-btn-follow {

          margin-top: 10px;

          width: 100%;

          padding: 5px 0;

          font-size: 12px;

          font-weight: 700;

          border-radius: 9999px;

          background: #00a884;

          color: #111b21;

          border: none;

          cursor: pointer;

        }

        .spotlight-btn-follow.following {

          background: #202c33;

          color: #8696a0;

          border: 1px solid rgba(255, 255, 255, 0.1);

        }

        /* Channel Feed Modal */

        .channel-feed-card {

          max-width: 600px;

          height: 85vh;

        }

        .channel-feed-header {

          display: flex;

          align-items: center;

          justify-content: space-between;

          padding: 12px 16px;

          background: #182229;

          border-bottom: 1px solid rgba(255, 255, 255, 0.08);

        }

        .feed-header-contact {

          display: flex;

          align-items: center;

          gap: 10px;

        }

        .feed-header-avatar {

          width: 40px;

          height: 40px;

          border-radius: 50%;

          object-fit: cover;

          border: 1.5px solid rgba(0, 255, 102, 0.35);

        }

        .feed-header-name {

          font-size: 15.5px;

          font-weight: 700;

          color: #e9edef;

        }

        .feed-header-sub {

          font-size: 12px;

          color: #8696a0;

        }

        .channel-posts-timeline {

          flex: 1 1 auto;

          overflow-y: auto;

          padding: 16px;

          background: #0b141a;

          display: flex;

          flex-direction: column;

          gap: 14px;

        }

        .channel-post-card {

          background: #182229;

          border: 1px solid rgba(255, 255, 255, 0.06);

          border-radius: 14px;

          padding: 14px 16px;

          display: flex;

          flex-direction: column;

          gap: 8px;

          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);

        }

        .channel-post-header {

          display: flex;

          align-items: center;

          justify-content: space-between;

        }

        .channel-post-author {

          font-size: 13.5px;

          font-weight: 700;

          color: #00ff66;

        }

        .channel-post-time {

          font-size: 11.5px;

          color: #8696a0;

        }

        .channel-post-text {

          font-size: 14px;

          color: #d1d7db;

          line-height: 1.45;

          margin: 0;

          white-space: pre-wrap;

          word-break: break-word;

        }

        .channel-post-reactions {

          display: flex;

          align-items: center;

          gap: 8px;

          margin-top: 4px;

        }

        .reaction-pill {

          background: #202c33;

          border: 1px solid rgba(255, 255, 255, 0.06);

          border-radius: 9999px;

          padding: 3px 10px;

          font-size: 11.5px;

          color: #8696a0;

          cursor: pointer;

          display: inline-flex;

          align-items: center;

          gap: 4px;

        }

        .reaction-pill:hover,

        .reaction-pill.reacted {

          color: #00ff66;

          border-color: rgba(0, 255, 102, 0.3);

          background: rgba(0, 255, 102, 0.08);

        }

        /* Broadcast Composer for Creators */

        .channel-composer-bar {

          display: flex;

          align-items: center;

          gap: 10px;

          padding: 10px 16px;

          background: #182229;

          border-top: 1px solid rgba(255, 255, 255, 0.08);

        }

        .channel-composer-input {

          flex: 1;

          background: #202c33;

          border: 1px solid rgba(255, 255, 255, 0.06);

          border-radius: 9999px;

          padding: 9px 16px;

          color: #e9edef;

          font-size: 13.5px;

          outline: none;

        }

        .channel-composer-send-btn {

          width: 40px;

          height: 40px;

          border-radius: 50%;

          background: #00a884;

          color: #111b21;

          border: none;

          font-size: 15px;

          display: flex;

          align-items: center;

          justify-content: center;

          cursor: pointer;

        }

      `;

      document.head.appendChild(style);

    }

    mountModals() {

      if (document.getElementById('channelsExploreModal')) return;

      // 1. Explore & Manage Channels Modal

      const exploreModal = document.createElement('div');

      exploreModal.id = 'channelsExploreModal';

      exploreModal.className = 'channels-modal-overlay';

      exploreModal.innerHTML = `

        <div class="channels-modal-card">

          <div class="channels-modal-header">

            <div class="channels-header-left">

              <div class="channels-header-icon"><i class="fa-solid fa-tower-broadcast"></i></div>

              <h3 class="channels-header-title">Channels</h3>

            </div>

            <div class="channels-header-actions">

              <button type="button" class="btn-create-channel-pill" id="channelsOpenCreateBtn">

                <i class="fa-solid fa-plus"></i> New Channel

              </button>

              <button type="button" class="channels-close-btn" id="channelsCloseExploreBtn" title="Close">

                <i class="fa-solid fa-xmark"></i>

              </button>

            </div>

          </div>

          <div class="channels-modal-tabs">

            <button type="button" class="channel-tab-btn active" data-tab="explore">Explore</button>

            <button type="button" class="channel-tab-btn" data-tab="following">Following</button>

            <button type="button" class="channel-tab-btn" data-tab="my_channels">My Channels</button>

          </div>

          <div class="channels-search-bar">

            <div class="channels-search-input-box">

              <i class="fa-solid fa-magnifying-glass" style="color: #8696a0; font-size: 13px;"></i>

              <input type="text" id="channelsFilterInput" class="channels-search-input" placeholder="Search channels by name or topic...">

            </div>

          </div>

          <div class="channels-modal-list" id="channelsModalList">

            <!-- Dynamic channel cards populated here -->

          </div>

        </div>

      `;

      document.body.appendChild(exploreModal);

      // 2. Create Channel Modal

      const createModal = document.createElement('div');

      createModal.id = 'createChannelModal';

      createModal.className = 'channels-modal-overlay';

      createModal.innerHTML = `

        <div class="channels-modal-card" style="max-width: 460px;">

          <div class="channels-modal-header">

            <div class="channels-header-left">

              <div class="channels-header-icon"><i class="fa-solid fa-plus"></i></div>

              <h3 class="channels-header-title">Create Channel</h3>

            </div>

            <button type="button" class="channels-close-btn" id="closeCreateChannelBtn" title="Close">

              <i class="fa-solid fa-xmark"></i>

            </button>

          </div>

          <form id="createChannelForm" style="padding: 18px 20px; display: flex; flex-direction: column; gap: 14px;">

            <div style="text-align: center; margin-bottom: 4px;">

              <div style="position: relative; width: 72px; height: 72px; margin: 0 auto;">
                <img id="newChannelAvatarPreview" src="favicons/icon-192.png" alt="Channel Avatar" style="width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 2px solid #00ff66; box-shadow: 0 0 16px rgba(0,255,102,0.3); margin: 0 auto; display: block;">
                <button type="button" id="uploadChannelAvatarBtn" onclick="document.getElementById('newChannelAvatarInput').click()" style="position: absolute; bottom: 0; right: 0; background: #00ff66; border: none; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #000;" title="Upload channel photo">
                  <i class="fa-solid fa-camera" style="font-size: 11px;"></i>
                </button>
              </div>
              <input type="file" id="newChannelAvatarInput" accept="image/*" style="display: none;">
              <p style="font-size: 11.5px; color: #8696a0; margin: 6px 0 0 0;">Upload Custom Picture or Keep Ribbon Avatar</p>

            </div>

            <div>

              <label style="font-size: 12.5px; font-weight: 600; color: #8696a0; display: block; margin-bottom: 6px;">Channel Name</label>

              <input type="text" id="newChannelName" required placeholder="e.g. Cyber Security Wire, Daily Alpha..." style="width: 100%; box-sizing: border-box; background: #202c33; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 10px 14px; color: #e9edef; font-size: 14px; outline: none;">

            </div>

            <div>

              <label style="font-size: 12.5px; font-weight: 600; color: #8696a0; display: block; margin-bottom: 6px;">Handle / Username</label>

              <input type="text" id="newChannelHandle" placeholder="e.g. @cyber_security" style="width: 100%; box-sizing: border-box; background: #202c33; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 10px 14px; color: #e9edef; font-size: 14px; outline: none;">

            </div>

            <div>

              <label style="font-size: 12.5px; font-weight: 600; color: #8696a0; display: block; margin-bottom: 6px;">Description</label>

              <textarea id="newChannelDescription" rows="3" placeholder="Describe what your broadcast channel covers for your subscribers..." style="width: 100%; box-sizing: border-box; background: #202c33; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 10px 14px; color: #e9edef; font-size: 13.5px; outline: none; resize: none;"></textarea>

            </div>

            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 6px;">

              <button type="button" id="cancelCreateChannelBtn" style="background: transparent; border: 1px solid rgba(255,255,255,0.12); color: #8696a0; border-radius: 9999px; padding: 8px 18px; font-size: 13px; font-weight: 600; cursor: pointer;">Cancel</button>

              <button type="submit" style="background: #00a884; border: none; color: #111b21; border-radius: 9999px; padding: 8px 22px; font-size: 13px; font-weight: 700; cursor: pointer;">Create Channel</button>

            </div>

          </form>

        </div>

      `;

      document.body.appendChild(createModal);

      // 3. Channel Feed Timeline Modal

      const feedModal = document.createElement('div');

      feedModal.id = 'channelFeedModal';

      feedModal.className = 'channels-modal-overlay';

      feedModal.innerHTML = `

        <div class="channels-modal-card channel-feed-card">

          <div class="channel-feed-header">

            <div class="feed-header-contact">

              <button type="button" class="channels-close-btn" id="feedBackBtn" title="Back" style="margin-right: 4px;">

                <i class="fa-solid fa-arrow-left"></i>

              </button>

              <img id="feedChannelAvatar" src="favicons/icon-192.png" alt="Avatar" class="feed-header-avatar">

              <div>

                <div style="display: flex; align-items: center; gap: 5px;">

                  <span id="feedChannelName" class="feed-header-name">Channel Name</span>

                  <i class="fa-solid fa-circle-check channel-verified-badge" id="feedChannelVerified"></i>

                </div>

                <div id="feedChannelSubscribers" class="feed-header-sub">0 followers</div>

              </div>

            </div>

            <div style="display: flex; align-items: center; gap: 8px;">

              <button type="button" class="btn-follow-toggle" id="feedFollowToggleBtn">Follow</button>

              <button type="button" class="channels-close-btn" id="closeFeedModalBtn" title="Close">

                <i class="fa-solid fa-xmark"></i>

              </button>

            </div>

          </div>

          <div class="channel-posts-timeline" id="feedPostsTimeline">

            <!-- Channel broadcast updates populated here -->

          </div>

          <div class="channel-composer-bar" id="feedComposerBar" style="display: none;">

            <input type="text" id="feedComposerInput" class="channel-composer-input" placeholder="Broadcast an update to your followers...">

            <button type="button" id="feedComposerSendBtn" class="channel-composer-send-btn" title="Broadcast">

              <i class="fa-solid fa-paper-plane"></i>

            </button>

          </div>

        </div>

      `;

      document.body.appendChild(feedModal);

      this.bindModalEvents();

      this.hasMountedUI = true;

    }

    bindModalEvents() {

      // Explore modal close

      document.getElementById('channelsCloseExploreBtn')?.addEventListener('click', () => this.closeModal());

      document.getElementById('channelsExploreModal')?.addEventListener('click', (e) => {

        if (e.target.id === 'channelsExploreModal') this.closeModal();

      });

      // Tabs in explore modal

      const tabBtns = document.querySelectorAll('#channelsExploreModal .channel-tab-btn');

      tabBtns.forEach(btn => {

        btn.addEventListener('click', () => {

          tabBtns.forEach(b => b.classList.remove('active'));

          btn.classList.add('active');

          this.currentTab = btn.getAttribute('data-tab');

          this.renderModalList();

        });

      });

      // Search filter

      document.getElementById('channelsFilterInput')?.addEventListener('input', (e) => {

        this.renderModalList(e.target.value);

      });

      // Open Create Channel

      document.getElementById('channelsOpenCreateBtn')?.addEventListener('click', () => {

        this.closeModal();

        this.openCreateModal();

      });

      // Create Modal close

      document.getElementById('closeCreateChannelBtn')?.addEventListener('click', () => this.closeCreateModal());

      document.getElementById('cancelCreateChannelBtn')?.addEventListener('click', () => this.closeCreateModal());

      document.getElementById('createChannelModal')?.addEventListener('click', (e) => {

        if (e.target.id === 'createChannelModal') this.closeCreateModal();

      });

      // Create Form submit

      document.getElementById('createChannelForm')?.addEventListener('submit', (e) => {

        e.preventDefault();

        this.handleCreateChannel();

      });

      document.getElementById('newChannelAvatarInput')?.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            const preview = document.getElementById('newChannelAvatarPreview');
            if (preview) preview.src = evt.target.result;
          };
          reader.readAsDataURL(file);
        }
      });

      // Feed Modal close / back

      document.getElementById('feedBackBtn')?.addEventListener('click', () => {

        this.closeFeedModal();

        this.openModal('following');

      });

      document.getElementById('closeFeedModalBtn')?.addEventListener('click', () => this.closeFeedModal());

      document.getElementById('channelFeedModal')?.addEventListener('click', (e) => {

        if (e.target.id === 'channelFeedModal') this.closeFeedModal();

      });

      // Feed follow toggle

      document.getElementById('feedFollowToggleBtn')?.addEventListener('click', () => {

        if (!this.activeFeedChannelId) return;

        this.toggleFollow(this.activeFeedChannelId);

        this.updateFeedHeader(this.activeFeedChannelId);

      });

      // Feed composer broadcast

      document.getElementById('feedComposerSendBtn')?.addEventListener('click', () => this.handleBroadcastPost());

      document.getElementById('feedComposerInput')?.addEventListener('keydown', (e) => {

        if (e.key === 'Enter') {

          e.preventDefault();

          this.handleBroadcastPost();

        }

      });

    }

    bindFabListeners() {

      document.getElementById('channelsExploreBtn')?.addEventListener('click', (e) => {

        e.preventDefault();

        this.openModal('explore');

      });

    }

    openModal(tab = 'explore') {

      this.mountModals();

      const modal = document.getElementById('channelsExploreModal');

      if (!modal) return;

      this.currentTab = tab;

      const tabBtns = modal.querySelectorAll('.channel-tab-btn');

      tabBtns.forEach(b => {

        b.classList.toggle('active', b.getAttribute('data-tab') === tab);

      });

      const filterInput = document.getElementById('channelsFilterInput');

      if (filterInput) filterInput.value = '';

      this.renderModalList();

      modal.classList.add('open');

    }

    closeModal() {

      const modal = document.getElementById('channelsExploreModal');

      if (modal) modal.classList.remove('open');

    }

    openCreateModal() {

      this.mountModals();

      const modal = document.getElementById('createChannelModal');

      if (!modal) return;

      document.getElementById('createChannelForm')?.reset();

      modal.classList.add('open');

    }

    closeCreateModal() {

      const modal = document.getElementById('createChannelModal');

      if (modal) modal.classList.remove('open');

    }

    handleCreateChannel() {

      const nameInput = document.getElementById('newChannelName');

      const handleInput = document.getElementById('newChannelHandle');

      const descInput = document.getElementById('newChannelDescription');

      const name = nameInput?.value?.trim();

      if (!name) return;

      let handle = handleInput?.value?.trim() || ('@' + name.toLowerCase().replace(/[^a-z0-9_]/g, ''));

      if (!handle.startsWith('@')) handle = '@' + handle;

      const description = descInput?.value?.trim() || 'Welcome to ' + name + ' official broadcast.';

      const user = this.getCurrentUser();

      const avatarPreview = document.getElementById('newChannelAvatarPreview');
      let channelAvatar = 'favicons/icon-192.png';
      if (avatarPreview && avatarPreview.src && (avatarPreview.src.startsWith('data:image/') || avatarPreview.src.startsWith('http') || avatarPreview.src.includes('.'))) {
        channelAvatar = avatarPreview.src;
      }

      const newChannel = {

        id: 'chan_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),

        name: name,

        handle: handle,

        description: description,

        avatar: channelAvatar,

        profilePic: channelAvatar,

        icon: channelAvatar,

        creatorId: user.uid,

        creatorName: user.displayName || 'You',

        isVerified: false,

        followerCount: 1,

        createdAt: Date.now(),

        lastPostSnippet: 'Channel created by ' + (user.displayName || 'Creator') + '.',

        lastPostTime: 'Just now',

        posts: [

          {

            id: 'post_init_' + Date.now(),

            authorName: user.displayName || 'You',

            text: 'Welcome to ' + name + '! This broadcast wire is now online. Updates and dispatches will be broadcast directly here.',

            timestamp: 'Just now',

            likes: 1

          }

        ]

      };

      this.channels.unshift(newChannel);

      this.followedChannelIds.add(newChannel.id);

      this.saveChannels();

      this.saveFollowed();

      if (window.db && window.auth?.currentUser) {

        try {

          window.db.collection('channels').doc(newChannel.id).set({

            name: newChannel.name,

            handle: newChannel.handle,

            description: newChannel.description,

            avatar: channelAvatar,

            profilePic: channelAvatar,

            icon: channelAvatar,

            creatorId: user.uid,

            creatorName: user.displayName || 'You',

            isVerified: false,

            subscriberCount: 1,

            createdAt: firebase.firestore.FieldValue.serverTimestamp()

          }).catch(err => console.warn('[ChannelsEngine] Firestore channel sync notice:', err.message));

        } catch (_) { }

      }

      this.closeCreateModal();

      this.renderChannelsInUpdates();

      if (window.showNotif) {

        window.showNotif('Channel created successfully!', 'success');

      } else {

        alert('Channel "' + name + '" created successfully!');

      }

      this.openChannelFeed(newChannel.id);

    }

    toggleFollow(channelId, btnEl) {

      const channel = this.channels.find(c => c.id === channelId);

      if (!channel) return;

      const isFollowing = this.followedChannelIds.has(channelId);

      if (isFollowing) {

        this.followedChannelIds.delete(channelId);

        channel.followerCount = Math.max(0, channel.followerCount - 1);

      } else {

        this.followedChannelIds.add(channelId);

        channel.followerCount = (channel.followerCount || 0) + 1;

        if (navigator.vibrate) {

          try { navigator.vibrate(12); } catch (_) { }

        }

      }

      this.saveChannels();

      this.saveFollowed();

      if (btnEl) {

        const nowFollowing = this.followedChannelIds.has(channelId);

        btnEl.classList.toggle('following', nowFollowing);

        btnEl.textContent = nowFollowing ? 'Following' : 'Follow';

      }

      this.renderChannelsInUpdates();

      if (window.db && window.auth?.currentUser) {

        const uid = window.auth.currentUser.uid;

        const subRef = window.db.collection('channels').doc(channelId).collection('subscribers').doc(uid);

        if (this.followedChannelIds.has(channelId)) {

          subRef.set({ subscribedAt: firebase.firestore.FieldValue.serverTimestamp() }).catch(() => { });

        } else {

          subRef.delete().catch(() => { });

        }

      }

    }

    renderModalList(query = '') {

      const listEl = document.getElementById('channelsModalList');

      if (!listEl) return;

      const user = this.getCurrentUser();

      const q = query.toLowerCase().trim();

      let filtered = this.channels.filter(c => {

        if (q && !c.name.toLowerCase().includes(q) && !c.description.toLowerCase().includes(q) && !c.handle.toLowerCase().includes(q)) {

          return false;

        }

        if (this.currentTab === 'following') {

          return this.followedChannelIds.has(c.id);

        } else if (this.currentTab === 'my_channels') {

          return c.creatorId === user.uid;

        }

        return true;

      });

      if (filtered.length === 0) {

        listEl.innerHTML = `

          <div style="padding: 36px 20px; text-align: center; color: #8696a0;">

            <i class="fa-solid fa-satellite-dish" style="font-size: 32px; color: #334155; margin-bottom: 12px; display: block;"></i>

            <p style="font-size: 14px; font-weight: 600; color: #cbd5e1; margin: 0 0 4px 0;">No channels found</p>

            <p style="font-size: 12px; color: #64748b; margin: 0;">${this.currentTab === 'my_channels' ? 'You have not created any channels yet.' : (this.currentTab === 'following' ? 'You are not following any channels yet.' : 'Try a different search term.')}</p>

          </div>

        `;

        return;

      }

      listEl.innerHTML = filtered.map(c => {

        const isFollowing = this.followedChannelIds.has(c.id);

        const countFormatted = c.followerCount >= 1000 ? (c.followerCount / 1000).toFixed(1) + 'K' : c.followerCount;

        return `

          <div class="channel-card-row" data-channel-id="${c.id}">

            <img src="${c.avatar || 'favicons/icon-192.png'}" alt="${c.name}" class="channel-card-avatar">

            <div class="channel-card-info">

              <div class="channel-card-title-row">

                <span class="channel-card-name">${c.name}</span>

                ${c.isVerified ? '<i class="fa-solid fa-circle-check channel-verified-badge" title="Verified Broadcast"></i>' : ''}

              </div>

              <div class="channel-card-followers">${countFormatted} followers &bull; ${c.handle}</div>

              <div class="channel-card-snippet">${c.description}</div>

            </div>

            <button type="button" class="btn-follow-toggle ${isFollowing ? 'following' : ''}" data-follow-id="${c.id}">

              ${isFollowing ? 'Following' : 'Follow'}

            </button>

          </div>

        `;

      }).join('');

      listEl.querySelectorAll('.channel-card-row').forEach(row => {

        row.addEventListener('click', (e) => {

          if (e.target.closest('.btn-follow-toggle')) return;

          const chanId = row.getAttribute('data-channel-id');

          this.closeModal();

          this.openChannelFeed(chanId);

        });

      });

      listEl.querySelectorAll('.btn-follow-toggle').forEach(btn => {

        btn.addEventListener('click', (e) => {

          e.stopPropagation();

          const chanId = btn.getAttribute('data-follow-id');

          this.toggleFollow(chanId, btn);

        });

      });

    }

    renderChannelsInUpdates() {

      const container = document.getElementById('channelsList');

      if (!container) return;

      const followed = this.channels.filter(c => this.followedChannelIds.has(c.id));

      const unFollowed = this.channels.filter(c => !this.followedChannelIds.has(c.id));

      let html = '';

      if (followed.length > 0) {

        html += `<div class="updates-channels-followed-list">`;

        followed.forEach(c => {

          html += `

            <div class="updates-channel-item" data-feed-id="${c.id}">

              <img src="${c.avatar || 'favicons/icon-192.png'}" alt="${c.name}" class="updates-channel-avatar">

              <div class="updates-channel-content">

                <div class="updates-channel-top">

                  <div class="updates-channel-name-wrap">

                    <span class="updates-channel-name">${c.name}</span>

                    ${c.isVerified ? '<i class="fa-solid fa-circle-check" style="color: #00ff66; font-size: 12px;"></i>' : ''}

                  </div>

                  <span class="updates-channel-time">${c.lastPostTime || 'Today'}</span>

                </div>

                <div class="updates-channel-snippet">${c.lastPostSnippet || c.description}</div>

              </div>

            </div>

          `;

        });

        html += `</div>`;

      }

      html += `

        <div class="channels-discover-strip">

          <div class="channels-discover-title">

            <span>Find channels to follow</span>

            <button type="button" class="channels-explore-pill-btn" onclick="window.broadcastChannelsEngine.openModal('explore')" style="background: transparent; color: #00ff66; border: none; font-size: 12.5px; cursor: pointer; padding: 0;">

              See all <i class="fa-solid fa-chevron-right" style="font-size: 10px;"></i>

            </button>

          </div>

          <div class="channels-cards-scroll">

      `;

      const discoverCards = unFollowed.length > 0 ? unFollowed : this.channels;

      discoverCards.slice(0, 5).forEach(c => {

        const isFollow = this.followedChannelIds.has(c.id);

        html += `

          <div class="channel-spotlight-card" data-feed-id="${c.id}">

            <img src="${c.avatar || 'favicons/icon-192.png'}" alt="${c.name}" class="spotlight-avatar">

            <span class="spotlight-name">${c.name}</span>

            <span style="font-size: 11px; color: #8696a0; margin-top: 2px;">${c.followerCount >= 1000 ? (c.followerCount / 1000).toFixed(0) + 'K' : c.followerCount} followers</span>

            <button type="button" class="spotlight-btn-follow ${isFollow ? 'following' : ''}" data-spotlight-follow="${c.id}">

              ${isFollow ? 'Following' : 'Follow'}

            </button>

          </div>

        `;

      });

      html += `

          </div>

        </div>

      `;

      container.innerHTML = html;

      container.querySelectorAll('[data-feed-id]').forEach(el => {

        el.addEventListener('click', (e) => {

          if (e.target.closest('button')) return;

          const chanId = el.getAttribute('data-feed-id');

          this.openChannelFeed(chanId);

        });

      });

      container.querySelectorAll('[data-spotlight-follow]').forEach(btn => {

        btn.addEventListener('click', (e) => {

          e.stopPropagation();

          const chanId = btn.getAttribute('data-spotlight-follow');

          this.toggleFollow(chanId, btn);

        });

      });

    }

    openChannelFeed(channelId) {

      this.mountModals();

      const channel = this.channels.find(c => c.id === channelId);

      if (!channel) return;

      this.activeFeedChannelId = channelId;

      const modal = document.getElementById('channelFeedModal');

      if (!modal) return;

      this.updateFeedHeader(channelId);

      this.renderFeedPosts(channel);

      const user = this.getCurrentUser();

      const isCreator = channel.creatorId === user.uid || channel.creatorId === 'system_nexchat';

      const composer = document.getElementById('feedComposerBar');

      if (composer) {

        composer.style.display = isCreator ? 'flex' : 'none';

      }

      modal.classList.add('open');

    }

    updateFeedHeader(channelId) {

      const channel = this.channels.find(c => c.id === channelId);

      if (!channel) return;

      const nameEl = document.getElementById('feedChannelName');

      const avatarEl = document.getElementById('feedChannelAvatar');

      const verifiedEl = document.getElementById('feedChannelVerified');

      const subsEl = document.getElementById('feedChannelSubscribers');

      const followBtn = document.getElementById('feedFollowToggleBtn');

      if (nameEl) nameEl.textContent = channel.name;

      if (avatarEl) avatarEl.src = channel.avatar || 'favicons/icon-192.png';

      if (verifiedEl) verifiedEl.style.display = channel.isVerified ? 'inline-block' : 'none';

      if (subsEl) {

        const count = channel.followerCount >= 1000 ? (channel.followerCount / 1000).toFixed(1) + 'K' : channel.followerCount;

        subsEl.textContent = count + ' followers &bull; ' + channel.handle;

      }

      if (followBtn) {

        const isFollowing = this.followedChannelIds.has(channelId);

        followBtn.classList.toggle('following', isFollowing);

        followBtn.textContent = isFollowing ? 'Following' : 'Follow';

      }

    }

    renderFeedPosts(channel) {

      const timeline = document.getElementById('feedPostsTimeline');

      if (!timeline) return;

      const posts = channel.posts || [];

      if (posts.length === 0) {

        timeline.innerHTML = `

          <div style="padding: 40px 20px; text-align: center; color: #8696a0;">

            <i class="fa-solid fa-bullhorn" style="font-size: 34px; color: #334155; margin-bottom: 12px; display: block;"></i>

            <p style="font-size: 14.5px; font-weight: 600; color: #cbd5e1; margin: 0 0 6px 0;">No broadcasts yet</p>

            <p style="font-size: 12.5px; color: #64748b; margin: 0;">Stay tuned for dispatches from ${channel.name}.</p>

          </div>

        `;

        return;

      }

      timeline.innerHTML = posts.map(p => `

        <div class="channel-post-card">

          <div class="channel-post-header">

            <span class="channel-post-author">${p.authorName || channel.name}</span>

            <span class="channel-post-time">${p.timestamp || 'Today'}</span>

          </div>

          <p class="channel-post-text">${p.text}</p>

          <div class="channel-post-reactions">

            <button type="button" class="reaction-pill" data-post-like="${p.id}">

              <i class="fa-solid fa-thumbs-up"></i> <span>${p.likes || 1}</span>

            </button>

            <button type="button" class="reaction-pill">

              <i class="fa-solid fa-fire"></i>

            </button>

            <button type="button" class="reaction-pill">

              <i class="fa-solid fa-rocket"></i>

            </button>

          </div>

        </div>

      `).join('');

      timeline.querySelectorAll('[data-post-like]').forEach(btn => {

        btn.addEventListener('click', () => {

          btn.classList.toggle('reacted');

          const span = btn.querySelector('span');

          if (span) {

            let val = parseInt(span.textContent, 10) || 0;

            span.textContent = btn.classList.contains('reacted') ? val + 1 : Math.max(0, val - 1);

          }

        });

      });

      timeline.scrollTop = timeline.scrollHeight;

    }

    handleBroadcastPost() {

      if (!this.activeFeedChannelId) return;

      const input = document.getElementById('feedComposerInput');

      const text = input?.value?.trim();

      if (!text) return;

      const channel = this.channels.find(c => c.id === this.activeFeedChannelId);

      if (!channel) return;

      const user = this.getCurrentUser();

      const newPost = {

        id: 'post_' + Date.now().toString(36),

        authorName: user.displayName || channel.name,

        text: text,

        timestamp: 'Just now',

        likes: 0

      };

      if (!channel.posts) channel.posts = [];

      channel.posts.push(newPost);

      channel.lastPostSnippet = text;

      channel.lastPostTime = 'Just now';

      this.saveChannels();

      input.value = '';

      this.renderFeedPosts(channel);

      this.renderChannelsInUpdates();

      if (window.db && window.auth?.currentUser) {

        try {

          window.db.collection('channels').doc(channel.id).collection('posts').doc(newPost.id).set({

            text: newPost.text,

            authorId: user.uid,

            authorName: newPost.authorName,

            createdAt: firebase.firestore.FieldValue.serverTimestamp()

          }).catch(() => { });

        } catch (_) { }

      }

    }

    closeFeedModal() {

      const modal = document.getElementById('channelFeedModal');

      if (modal) modal.classList.remove('open');

      this.activeFeedChannelId = null;

    }

  }

  const engine = new BroadcastChannelsEngine();

  window.broadcastChannelsEngine = engine;

    const params = new URLSearchParams(window.location.search);

    const chanModal = params.get('channels_modal');

    if (chanModal === 'explore') {

      setTimeout(() => engine.openModal('explore'), 100);

    } else if (chanModal === 'create') {

      setTimeout(() => engine.openCreateModal(), 100);

    } else if (chanModal === 'feed') {

      setTimeout(() => engine.openChannelFeed('chan_nexchat_official'), 100);

    }

  if (document.readyState === 'loading') {

    document.addEventListener('DOMContentLoaded', () => engine.init());

  } else {

    engine.init();

  }

})();

