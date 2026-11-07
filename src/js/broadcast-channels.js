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
      id: 'chan_camshot_official',
      name: 'CamShot',
      handle: '@CamShot.nex',
      description: 'Official CamShot studio feed, creator reels, cinematic presets, and 4K vertical broadcast releases.',
      avatar: 'assets/camshot_logo.svg',
      creatorId: 'system_camshot',
      creatorName: 'CamShot Studio',
      isVerified: true,
      followerCount: 149,
      createdAt: Date.now() - 86400000 * 10,
      lastPostSnippet: 'CamShot Pro Cine Anamorphic presets v2.4 live for all verified creators.',
      lastPostTime: '10:27 a.m.',
      posts: [
        {
          id: 'post_camshot_1',
          authorName: 'CamShot',
          text: 'Welcome to the official CamShot broadcast channel on NEXCHAT! Follow here for creator bounties, algorithmic boost drops, and cinematic 4K camera gear releases.',
          image: 'assets/camshot_logo.svg',
          timestamp: '10:27 a.m.',
          views: '149',
          likes: 24
        },
        {
          id: 'post_camshot_2',
          authorName: 'CamShot',
          text: 'CamShot Pro Cine Anamorphic presets v2.4 live for all verified creators. Tap attach or reels to link your stream directly.',
          timestamp: '11:42 a.m.',
          views: '312',
          likes: 58
        }
      ]
    },
    {
      id: 'chan_localhost',
      name: 'LOCALHOST',
      handle: '@localhost.nex',
      description: 'Localhost development hub, testing wire broadcasts, real-time node sync, and system diagnostics.',
      avatar: 'logo.jpg',
      creatorId: 'system_nexchat',
      creatorName: 'LOCALHOST Admin',
      isVerified: true,
      followerCount: 149,
      createdAt: Date.now() - 86400000 * 5,
      lastPostSnippet: 'Testing broadcast update delivery across localhost node cluster.',
      lastPostTime: '10:27 a.m.',
      posts: [
        {
          id: 'post_lh_1',
          authorName: 'LOCALHOST',
          text: 'Broadcast message running on local node. Real-time updates synced across all instances.',
          timestamp: '10:27 a.m.',
          views: '149',
          likes: 12
        }
      ]
    },
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
      lastPostTime: '10:15 a.m.',
      posts: [
        {
          id: 'post_nex_1',
          authorName: 'NEXCHAT Protocol',
          text: 'Welcome to NEXCHAT Broadcast Channels! Follow this channel to receive instant real-time security alerts, feature drops, and system status advisories.',
          timestamp: 'Yesterday, 04:20 PM',
          views: '4.2K',
          likes: 4120
        },
        {
          id: 'post_nex_2',
          authorName: 'NEXCHAT Protocol',
          text: 'NEXCHAT v4.2 Security Protocol rollout complete. Quantum forward secrecy enabled for all active nodes. End-to-end multi-device sync is now operational with zero latency.',
          timestamp: '10:15 a.m.',
          views: '6.8K',
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
      lastPostTime: '08:30 a.m.',
      posts: [
        {
          id: 'post_chronex_1',
          authorName: 'ChronEX Neural Core',
          text: 'Deep reasoning engine calibrated at 99.8% precision with multi-lingual audio transcription. Real-time neural translation supports over 32 global languages directly in your conversations.',
          timestamp: '08:30 a.m.',
          views: '3.1K',
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
      lastPostTime: 'Yesterday',
      posts: [
        {
          id: 'post_defense_1',
          authorName: 'Cyber Defense Command',
          text: 'Biometric authorization active across all secondary linked hardware keys. Ensure your enclave key backup is stored securely.',
          timestamp: 'Yesterday',
          views: '1.8K',
          likes: 1840
        }
      ]
    }
  ];

  class BroadcastChannelsEngine {

    constructor() {
      this.channels = JSON.parse(JSON.stringify(DEFAULT_CHANNELS));
      this.followedChannelIds = new Set(['chan_camshot_official', 'chan_localhost', 'chan_nexchat_official']);
      this.pendingMediaAttachment = null;
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

          const parsed = JSON.parse(storedChannels);
          DEFAULT_CHANNELS.forEach(def => {
            const existing = parsed.find(c => c.id === def.id || (c.name && c.name.toLowerCase() === def.name.toLowerCase()));
            if (!existing) {
              parsed.unshift(def);
            } else {
              if (!existing.posts || existing.posts.length === 0) existing.posts = def.posts;
              if (def.avatar && (!existing.avatar || existing.avatar.includes('icon-192'))) existing.avatar = def.avatar;
              if (def.handle) existing.handle = def.handle;
            }
          });
          this.channels = parsed;
          this.saveChannels();

        } else {

          this.channels = JSON.parse(JSON.stringify(DEFAULT_CHANNELS));

          this.saveChannels();

        }

        const storedFollowed = localStorage.getItem('nexchat_followed_channels');

        if (storedFollowed) {

          this.followedChannelIds = new Set(JSON.parse(storedFollowed));

        } else {

          this.followedChannelIds = new Set(['chan_camshot_official', 'chan_localhost', 'chan_nexchat_official']);

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



      
        /* ==========================================================================
           WHATSAPP 1:1 CHANNEL FULL PAGE ROUTE (NEX NEON HYBRID)
           ========================================================================== */

        body.channel-route-active {
          overflow: hidden !important;
        }

        body.channel-route-active .bottom-nav,
        body.channel-route-active #statusContainer,
        body.channel-route-active .nex-status-container,
        body.channel-route-active .chat-header,
        body.channel-route-active #mainHeader,
        body.channel-route-active .status-fab-container,
        body.channel-route-active .updates-fab-container,
        body.channel-route-active #chatContainer {
          display: none !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }

        /* Fullscreen Channel Route Viewport - Width 100vw, Height 100dvh, inset 0 */
        .whatsapp-channel-route {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100dvh !important;
          height: 100vh !important;
          margin: 0 !important;
          padding: 0 !important;
          border-radius: 0 !important;
          border: none !important;
          background: #0b141a !important;
          background-color: #0b141a !important;
          background-image: radial-gradient(circle at 50% 50%, rgba(17, 27, 33, 0.7) 0%, #0b141a 100%) !important;
          z-index: 999999 !important;
          display: flex !important;
          flex-direction: column !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
        }

        /* WhatsApp Channel Header - Height 60px */
        .whatsapp-channel-header {
          height: 60px !important;
          min-height: 60px !important;
          max-height: 60px !important;
          width: 100% !important;
          background: #182229 !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding: 0 10px !important;
          box-sizing: border-box !important;
          position: relative !important;
          z-index: 50 !important;
          flex-shrink: 0 !important;
        }

        .channel-header-left {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          min-width: 0 !important;
          flex: 1 !important;
        }

        .channel-header-btn {
          width: 38px !important;
          height: 38px !important;
          border-radius: 50% !important;
          border: none !important;
          background: transparent !important;
          color: #aebac1 !important;
          font-size: 17px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          flex-shrink: 0 !important;
          transition: background 0.15s ease, color 0.15s ease !important;
        }

        .channel-header-btn:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          color: #e9edef !important;
        }

        .channel-avatar-container {
          position: relative !important;
          width: 40px !important;
          height: 40px !important;
          flex-shrink: 0 !important;
          cursor: pointer !important;
        }

        .channel-header-avatar {
          width: 40px !important;
          height: 40px !important;
          border-radius: 50% !important;
          object-fit: cover !important;
          background: #202c33 !important;
          border: 1.5px solid rgba(0, 255, 102, 0.4) !important;
        }

        .channel-avatar-admin-badge {
          position: absolute !important;
          bottom: -2px !important;
          right: -2px !important;
          width: 16px !important;
          height: 16px !important;
          border-radius: 50% !important;
          background: #00ff66 !important;
          color: #0b141a !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 9px !important;
          font-weight: 800 !important;
          border: 2px solid #182229 !important;
        }

        .channel-header-meta {
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          min-width: 0 !important;
          flex: 1 !important;
          cursor: pointer !important;
        }

        .channel-header-name-row {
          display: flex !important;
          align-items: center !important;
          gap: 5px !important;
        }

        .channel-header-name {
          font-size: 15px !important;
          font-weight: 700 !important;
          color: #e9edef !important;
          text-transform: uppercase !important;
          letter-spacing: 0.4px !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
        }

        .channel-verified-icon {
          color: #00ff66 !important;
          font-size: 13px !important;
          flex-shrink: 0 !important;
        }

        .channel-header-followers {
          font-size: 12px !important;
          color: #8696a0 !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          margin-top: 1px !important;
        }

        .channel-header-right {
          display: flex !important;
          align-items: center !important;
          gap: 2px !important;
          position: relative !important;
        }

        
        /* Channel Header Expand Down Arrow */
        .channel-header-expand-btn {
          background: none !important;
          border: none !important;
          color: #8696a0 !important;
          font-size: 11px !important;
          cursor: pointer !important;
          padding: 2px 4px !important;
          display: inline-flex !important;
          align-items: center !important;
          transition: color 0.15s ease !important;
        }
        .channel-header-expand-btn:hover {
          color: #00ff66 !important;
        }
        #channelHeaderExpandIcon {
          transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        /* Channel Info Dropdown Panel (200ms ease) */
        .whatsapp-channel-info-dropdown {
          position: absolute !important;
          top: 60px !important;
          left: 0 !important;
          right: 0 !important;
          background: #111b21 !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.12) !important;
          padding: 14px 16px !important;
          z-index: 45 !important;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6) !important;
          transform: translateY(-100%) !important;
          opacity: 0 !important;
          pointer-events: none !important;
          transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease !important;
        }
        .whatsapp-channel-info-dropdown.open {
          transform: translateY(0) !important;
          opacity: 1 !important;
          pointer-events: auto !important;
        }
        .channel-info-dropdown-content {
          display: flex !important;
          flex-direction: column !important;
          gap: 12px !important;
        }
        .channel-info-about-section {
          display: flex !important;
          flex-direction: column !important;
          gap: 4px !important;
        }
        .channel-info-about-label {
          font-size: 11px !important;
          font-weight: 700 !important;
          color: #8696a0 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.4px !important;
        }
        .channel-info-about-text {
          font-size: 13.5px !important;
          color: #d1d7db !important;
          line-height: 1.45 !important;
          margin: 0 !important;
        }
        .channel-info-dropdown-actions {
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
        }
        .channel-dropdown-action-btn, .channel-dropdown-follow-btn {
          flex: 1 !important;
          padding: 8px 14px !important;
          border-radius: 8px !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
          cursor: pointer !important;
          transition: all 0.15s ease !important;
        }
        .channel-dropdown-action-btn {
          background: rgba(255, 255, 255, 0.08) !important;
          border: 1px solid rgba(255, 255, 255, 0.14) !important;
          color: #e9edef !important;
        }
        .channel-dropdown-action-btn:hover {
          background: rgba(255, 255, 255, 0.14) !important;
        }
        .channel-dropdown-follow-btn {
          background: #00ff66 !important;
          border: none !important;
          color: #000 !important;
          font-weight: 700 !important;
        }
        .channel-dropdown-follow-btn:hover {
          background: #33ff88 !important;
        }

        /* Message Card Actions Dropdown (200ms ease) */
        .whatsapp-channel-dots-btn {
          background: none !important;
          border: none !important;
          color: #8696a0 !important;
          cursor: pointer !important;
          padding: 2px 6px !important;
          border-radius: 4px !important;
          font-size: 13px !important;
          transition: color 0.15s ease, background 0.15s ease !important;
          margin-left: auto !important;
        }
        .whatsapp-channel-dots-btn:hover {
          color: #e9edef !important;
          background: rgba(255, 255, 255, 0.08) !important;
        }
        .whatsapp-channel-card-actions-dropdown {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          margin-top: 4px !important;
          margin-left: 4px !important;
          transform: translateY(-8px) !important;
          opacity: 0 !important;
          transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease !important;
        }
        .whatsapp-channel-card-actions-dropdown.open {
          transform: translateY(0) !important;
          opacity: 1 !important;
        }
        .whatsapp-channel-action-chip {
          background: #202c33 !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #d1d7db !important;
          border-radius: 16px !important;
          padding: 5px 12px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 6px !important;
          cursor: pointer !important;
          transition: all 0.15s ease !important;
        }
        .whatsapp-channel-action-chip:hover {
          background: #2a3942 !important;
          color: #00ff66 !important;
        }
        .whatsapp-channel-action-chip.reacted {
          color: #00ff66 !important;
          border-color: #00ff66 !important;
          background: rgba(0, 255, 102, 0.15) !important;
        }

        /* Dropdown Menu */
        .whatsapp-channel-dropdown-menu {
          position: absolute !important;
          top: 48px !important;
          right: 0 !important;
          width: 190px !important;
          background: #233138 !important;
          border-radius: 10px !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          padding: 6px 0 !important;
          z-index: 100 !important;
          animation: fadeInMenu 0.15s ease-out !important;
        }

        @keyframes fadeInMenu {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .channel-dropdown-item {
          width: 100% !important;
          padding: 10px 16px !important;
          background: transparent !important;
          border: none !important;
          color: #d1d7db !important;
          font-size: 13.5px !important;
          text-align: left !important;
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
          cursor: pointer !important;
          transition: background 0.12s ease !important;
        }

        .channel-dropdown-item:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          color: #fff !important;
        }

        /* Timeline (Messages Middle) - padding 8px left/right, gap 8px */
        .whatsapp-channel-timeline {
          flex: 1 1 auto !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          padding: 8px !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 8px !important;
          box-sizing: border-box !important;
          -webkit-overflow-scrolling: touch !important;
        }

        /* Update Row */
        .whatsapp-channel-update-row {
          width: 100% !important;
          max-width: 100% !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: flex-start !important;
          box-sizing: border-box !important;
        }

        /* Update Card - Width 100% - 16px (or calc(100% - 16px)), NOT 80% */
        .whatsapp-channel-card {
          width: 100% !important;
          max-width: 100% !important;
          background: #1f2c34 !important;
          border: 1px solid rgba(255, 255, 255, 0.06) !important;
          border-radius: 12px !important;
          padding: 12px 14px !important;
          box-sizing: border-box !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35) !important;
          position: relative !important;
        }

        .whatsapp-channel-card-media {
          width: 100% !important;
          border-radius: 8px !important;
          overflow: hidden !important;
          margin-bottom: 8px !important;
          background: #111b21 !important;
        }

        .whatsapp-channel-card-img {
          width: 100% !important;
          height: auto !important;
          max-height: 380px !important;
          object-fit: cover !important;
          display: block !important;
          cursor: pointer !important;
        }

        .whatsapp-channel-card-text {
          font-size: 14.5px !important;
          line-height: 1.48 !important;
          color: #e9edef !important;
          word-break: break-word !important;
          white-space: pre-wrap !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
        }

        .whatsapp-channel-card-meta {
          display: flex !important;
          justify-content: flex-end !important;
          align-items: center !important;
          margin-top: 6px !important;
        }

        .whatsapp-card-views-time {
          display: inline-flex !important;
          align-items: center !important;
          gap: 5px !important;
          font-size: 11px !important;
          color: #8696a0 !important;
          font-variant-numeric: tabular-nums !important;
        }

        .whatsapp-card-views-time i {
          font-size: 11px !important;
          color: #8696a0 !important;
        }

        /* Action Rail (Reaction / Share arrow bottom-left outside card) */
        .whatsapp-channel-card-actions {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          margin-top: 4px !important;
          padding-left: 2px !important;
        }

        .whatsapp-channel-react-btn {
          background: #182229 !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 9999px !important;
          padding: 4px 10px !important;
          font-size: 12px !important;
          color: #8696a0 !important;
          cursor: pointer !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 5px !important;
          transition: all 0.15s ease !important;
        }

        .whatsapp-channel-react-btn:hover,
        .whatsapp-channel-react-btn.reacted {
          background: rgba(0, 255, 102, 0.12) !important;
          color: #00ff66 !important;
          border-color: rgba(0, 255, 102, 0.3) !important;
        }

        .whatsapp-channel-share-btn {
          background: #182229 !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 50% !important;
          width: 28px !important;
          height: 28px !important;
          font-size: 11px !important;
          color: #8696a0 !important;
          cursor: pointer !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: all 0.15s ease !important;
        }

        .whatsapp-channel-share-btn:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          color: #e9edef !important;
        }

        /* Input Bar - Stuck to bottom: position sticky bottom 0, width 100%, padding 8px */
        .whatsapp-channel-input-bar {
          position: sticky !important;
          bottom: 0 !important;
          left: 0 !important;
          width: 100% !important;
          box-sizing: border-box !important;
          background: #182229 !important;
          border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
          padding: 8px 10px !important;
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          z-index: 100 !important;
          margin: 0 !important;
          flex-shrink: 0 !important;
        }

        .channel-input-tool-btn {
          width: 38px !important;
          height: 38px !important;
          border-radius: 50% !important;
          border: none !important;
          background: transparent !important;
          color: #8696a0 !important;
          font-size: 18px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          flex-shrink: 0 !important;
          transition: color 0.15s ease, background 0.15s ease !important;
        }

        .channel-input-tool-btn:hover {
          color: #e9edef !important;
          background: rgba(255, 255, 255, 0.06) !important;
        }

        .channel-input-field-wrapper {
          flex: 1 !important;
          min-width: 0 !important;
          display: flex !important;
          align-items: center !important;
          background: #202c33 !important;
          border-radius: 22px !important;
          padding: 4px 14px !important;
          border: 1px solid rgba(255, 255, 255, 0.06) !important;
          min-height: 42px !important;
          box-sizing: border-box !important;
        }

        .channel-input-field {
          width: 100% !important;
          border: none !important;
          outline: none !important;
          background: transparent !important;
          color: #e9edef !important;
          font-size: 14.5px !important;
          font-family: inherit !important;
        }

        .channel-input-field::placeholder {
          color: #8696a0 !important;
        }

        .channel-circle-action-btn {
          width: 42px !important;
          height: 42px !important;
          min-width: 42px !important;
          border-radius: 50% !important;
          border: none !important;
          background: #00a884 !important;
          color: #111b21 !important;
          font-size: 16px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          flex-shrink: 0 !important;
          transition: transform 0.15s ease, background 0.18s ease !important;
          box-shadow: 0 0 10px rgba(0, 255, 102, 0.3) !important;
        }

        .channel-circle-action-btn:hover {
          background: #00c498 !important;
          transform: scale(1.05) !important;
          box-shadow: 0 0 14px rgba(0, 255, 102, 0.5) !important;
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

      // 3. WhatsApp 1:1 Channel Full Page Route Viewport
      const feedModal = document.createElement('div');
      feedModal.id = 'channelFeedModal';
      feedModal.className = 'whatsapp-channel-route';
      feedModal.style.display = 'none';
      feedModal.innerHTML = `
        <!-- 1. Header (Height 60px, WhatsApp Copy) -->
        <header class="whatsapp-channel-header">
          <div class="channel-header-left">
            <button type="button" class="channel-header-btn channel-back-btn" id="feedBackBtn" title="Back to Updates">
              <i class="fa-solid fa-arrow-left"></i>
            </button>
            <div class="channel-avatar-container" id="feedAvatarContainer" title="Channel Info">
              <img id="feedChannelAvatar" src="assets/camshot_logo.svg" alt="Avatar" class="channel-header-avatar">
              <span class="channel-avatar-admin-badge" id="feedAdminBadge" title="Admin" style="display: none;">
                <i class="fa-solid fa-plus"></i>
              </span>
            </div>
            <div class="channel-header-meta" id="feedMetaContainer" title="Channel Info">
              <div class="channel-header-name-row">
                <span id="feedChannelName" class="channel-header-name">CAMSHOT</span>
                <i class="fa-solid fa-circle-check channel-verified-icon" id="feedChannelVerified"></i>
                <button type="button" class="channel-header-expand-btn" id="channelHeaderExpandBtn" title="Toggle Channel Info">
                  <i class="fa-solid fa-chevron-down" id="channelHeaderExpandIcon"></i>
                </button>
              </div>
              <div id="feedChannelSubscribers" class="channel-header-followers">149 followers • @CamShot.nex</div>
            </div>
          </div>
          <div class="channel-header-right">
            <button type="button" class="channel-header-btn" id="feedShareLinkBtn" title="Copy Channel Link">
              <i class="fa-solid fa-link"></i>
            </button>
            <button type="button" class="channel-header-btn" id="feedMenuBtn" title="Channel Options">
              <i class="fa-solid fa-ellipsis-vertical"></i>
            </button>
            <div class="whatsapp-channel-dropdown-menu" id="feedOptionsMenu" style="display: none;">
              <button type="button" class="channel-dropdown-item" id="menuChannelInfoBtn">
                <i class="fa-solid fa-circle-info"></i> Channel info
              </button>
              <button type="button" class="channel-dropdown-item" id="menuCopyLinkBtn">
                <i class="fa-solid fa-link"></i> Copy link
              </button>
              <button type="button" class="channel-dropdown-item" id="menuShareBtn">
                <i class="fa-solid fa-share-nodes"></i> Share
              </button>
              <button type="button" class="channel-dropdown-item" id="menuMuteBtn">
                <i class="fa-solid fa-bell-slash"></i> Mute
              </button>
              <button type="button" class="channel-dropdown-item" id="menuToggleFollowBtn">
                <i class="fa-solid fa-user-plus"></i> <span id="menuFollowBtnText">Follow</span>
              </button>
            </div>
          </div>
        </header>

        <!-- Dropdown Channel Info Panel (Slides Down 200ms) -->
        <div id="channelInfoDropdownPanel" class="whatsapp-channel-info-dropdown" style="display: none;">
          <div class="channel-info-dropdown-content">
            <div class="channel-info-about-section">
              <span class="channel-info-about-label">About</span>
              <p class="channel-info-about-text" id="feedChannelAboutText"></p>
            </div>
            <div class="channel-info-dropdown-actions">
              <button type="button" class="channel-dropdown-action-btn" id="dropdownCopyLinkBtn">
                <i class="fa-solid fa-link"></i>
                <span>Copy Link</span>
              </button>
              <button type="button" class="channel-dropdown-follow-btn" id="dropdownFollowBtn">
                <i class="fa-solid fa-plus" id="dropdownFollowIcon"></i>
                <span id="dropdownFollowText">Follow</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 2. Messages Timeline (WhatsApp Copy) -->
        <main class="whatsapp-channel-timeline" id="feedPostsTimeline">
          <!-- Populated dynamically with full width update cards -->
        </main>

        <!-- 3. WhatsApp Bottom Input Bar (Stuck to bottom) -->
        <footer class="whatsapp-channel-input-bar" id="feedComposerBar">
          <button type="button" class="channel-input-tool-btn" id="feedEmojiBtn" title="Emoji">
            <i class="fa-regular fa-face-smile"></i>
          </button>
          <div class="channel-input-field-wrapper">
            <input
              type="text"
              id="feedComposerInput"
              class="channel-input-field"
              placeholder="Write an update"
              autocomplete="off"
            />
          </div>
          <button type="button" class="channel-input-tool-btn" id="feedAttachBtn" title="Attach media">
            <i class="fa-solid fa-paperclip"></i>
          </button>
          <button type="button" class="channel-input-tool-btn" id="feedCameraBtn" title="Camera">
            <i class="fa-solid fa-camera"></i>
          </button>
          <button type="button" class="channel-circle-action-btn" id="feedComposerSendBtn" title="Voice or Send">
            <i class="fa-solid fa-microphone" id="feedActionIcon"></i>
          </button>

          <!-- Hidden File Inputs -->
          <input type="file" id="feedMediaInput" accept="image/*,video/*" style="display: none;" />
          <input type="file" id="feedCameraInput" accept="image/*" capture="environment" style="display: none;" />
        </footer>
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

      // Feed Modal close / back -> Returns directly to Updates list
      document.getElementById('feedBackBtn')?.addEventListener('click', () => {
        this.closeFeedModal();
      });

      // 3-dots Menu Toggle
      document.getElementById('feedMenuBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const menu = document.getElementById('feedOptionsMenu');
        if (menu) menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
      });

      // Close dropdown menu when clicking anywhere else
      document.addEventListener('click', (e) => {
        const menu = document.getElementById('feedOptionsMenu');
        if (menu && menu.style.display === 'block' && !e.target.closest('#feedOptionsMenu') && !e.target.closest('#feedMenuBtn')) {
          menu.style.display = 'none';
        }
      });

      // Copy Link Button
      document.getElementById('feedShareLinkBtn')?.addEventListener('click', () => {
        this.handleCopyChannelLink();
      });

      document.getElementById('menuCopyLinkBtn')?.addEventListener('click', () => {
        document.getElementById('feedOptionsMenu').style.display = 'none';
        this.handleCopyChannelLink();
      });

      document.getElementById('menuChannelInfoBtn')?.addEventListener('click', () => {
        document.getElementById('feedOptionsMenu').style.display = 'none';
        this.showChannelInfoModal();
      });

      document.getElementById('feedAvatarContainer')?.addEventListener('click', () => {
        this.showChannelInfoModal();
      });

      document.getElementById('feedMetaContainer')?.addEventListener('click', () => {
        this.showChannelInfoModal();
      });

      document.getElementById('menuShareBtn')?.addEventListener('click', () => {
        document.getElementById('feedOptionsMenu').style.display = 'none';
        this.handleShareChannel();
      });

      document.getElementById('menuMuteBtn')?.addEventListener('click', () => {
        document.getElementById('feedOptionsMenu').style.display = 'none';
        if (window.showNotif) window.showNotif('Notifications muted for this channel', 'info');
      });

      document.getElementById('menuToggleFollowBtn')?.addEventListener('click', () => {
        document.getElementById('feedOptionsMenu').style.display = 'none';
        if (this.activeFeedChannelId) {
          this.toggleFollow(this.activeFeedChannelId);
          this.updateFeedHeader(this.activeFeedChannelId);
        }
      });

      // Attach & Camera Media Handlers
      document.getElementById('feedAttachBtn')?.addEventListener('click', () => {
        document.getElementById('feedMediaInput')?.click();
      });

      document.getElementById('feedCameraBtn')?.addEventListener('click', () => {
        document.getElementById('feedCameraInput')?.click();
      });

      const handleMediaSelect = (inputEl) => {
        const file = inputEl.files && inputEl.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          this.pendingMediaAttachment = evt.target.result;
          if (window.showNotif) window.showNotif('Media attached to broadcast update', 'success');
          const icon = document.getElementById('feedActionIcon');
          if (icon) icon.className = 'fa-solid fa-paper-plane';
        };
        reader.readAsDataURL(file);
        inputEl.value = '';
      };

      document.getElementById('feedMediaInput')?.addEventListener('change', (e) => handleMediaSelect(e.target));
      document.getElementById('feedCameraInput')?.addEventListener('change', (e) => handleMediaSelect(e.target));

      // Dynamic Send / Mic Icon Switching
      const composerInput = document.getElementById('feedComposerInput');
      composerInput?.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        const icon = document.getElementById('feedActionIcon');
        if (icon) {
          if (val.length > 0 || this.pendingMediaAttachment) {
            icon.className = 'fa-solid fa-paper-plane';
          } else {
            icon.className = 'fa-solid fa-microphone';
          }
        }
      });

      // Composer Broadcast
      document.getElementById('feedComposerSendBtn')?.addEventListener('click', () => this.handleBroadcastPost());
      composerInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleBroadcastPost();
        }
      });

      // Browser popstate (Back button gesture / Android back)
      window.addEventListener('popstate', () => {
        if (this.activeFeedChannelId) {
          this.closeFeedModal();
        }
      });

      // Escape key to exit channel
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.activeFeedChannelId) {
          this.closeFeedModal();
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

      // [FORTRESS AI Cloud Defender: Channel Creation Guard]
      if (window.fortressGuard) {
        const nameCheck = window.fortressGuard(name, 'Channel Creation - Name');
        if (!nameCheck.safe) return;
        if (descInput?.value) {
          const descCheck = window.fortressGuard(descInput.value, 'Channel Creation - Description');
          if (!descCheck.safe) return;
        }
      }

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

      // 1. FULL SCREEN ROUTE: Hide Updates list AND bottom nav completely
      document.body.classList.add('channel-route-active');
      const bottomNav = document.querySelector('.bottom-nav');
      if (bottomNav) bottomNav.style.setProperty('display', 'none', 'important');
      const statusContainer = document.getElementById('statusContainer');
      if (statusContainer) statusContainer.style.setProperty('display', 'none', 'important');
      const mainHeader = document.getElementById('mainHeader') || document.querySelector('.chat-header');
      if (mainHeader) mainHeader.style.setProperty('display', 'none', 'important');

      // 2. Setup Header & Content
      this.updateFeedHeader(channelId);
      this.renderFeedPosts(channel);

      // 3. Setup dynamic placeholder for input bar (Owner vs Follower)
      const user = this.getCurrentUser();
      const isCreator = channel.creatorId === user.uid || channel.creatorId === 'system_nexchat' || channel.creatorId === 'system_camshot';
      const input = document.getElementById('feedComposerInput');
      if (input) {
        input.value = '';
        input.placeholder = isCreator ? 'Write an update' : 'Share questions and other updates.';
      }
      this.pendingMediaAttachment = null;
      const actionIcon = document.getElementById('feedActionIcon');
      if (actionIcon) actionIcon.className = 'fa-solid fa-microphone';

      const composer = document.getElementById('feedComposerBar');
      if (composer) {
        composer.style.display = 'flex';
      }

      // 4. Open full page route
      modal.style.display = 'flex';
      modal.classList.add('open');

      // 5. Push history state for seamless Back button handling
      try {
        window.history.pushState({ channelRoute: true, channelId: channelId }, '');
      } catch (_) { }
    }

    updateFeedHeader(channelId) {
      const channel = this.channels.find(c => c.id === channelId);
      if (!channel) return;

      const nameEl = document.getElementById('feedChannelName');
      const avatarEl = document.getElementById('feedChannelAvatar');
      const verifiedEl = document.getElementById('feedChannelVerified');
      const subsEl = document.getElementById('feedChannelSubscribers');
      const adminBadge = document.getElementById('feedAdminBadge');
      const menuFollowText = document.getElementById('menuFollowBtnText');

      if (nameEl) {
        nameEl.textContent = channel.name.toUpperCase();
      }

      if (avatarEl) {
        avatarEl.src = channel.avatar || 'assets/camshot_logo.svg';
      }

      if (verifiedEl) {
        verifiedEl.style.display = channel.isVerified ? 'inline-block' : 'none';
      }

      const user = this.getCurrentUser();
      const isCreator = channel.creatorId === user.uid || channel.creatorId === 'system_nexchat' || channel.creatorId === 'system_camshot';
      if (adminBadge) {
        adminBadge.style.display = isCreator ? 'flex' : 'none';
      }

      if (subsEl) {
        const count = channel.followerCount >= 1000 ? (channel.followerCount / 1000).toFixed(1) + 'K' : (channel.followerCount || 1);
        const countStr = count === 1 ? '1 follower' : count + ' followers';
        const handleStr = channel.handle ? ' • ' + channel.handle : '';
        subsEl.textContent = countStr + handleStr;
      }

      if (menuFollowText) {
        const isFollowing = this.followedChannelIds.has(channelId);
        menuFollowText.textContent = isFollowing ? 'Unfollow' : 'Follow';
      }
    }

    escapeAndFormat(text) {
      if (!text) return '';
      const div = document.createElement('div');
      div.textContent = text;
      let escaped = div.innerHTML;
      // Auto linkify URLs
      escaped = escaped.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #00ff66; text-decoration: underline;">$1</a>');
      return escaped;
    }

    renderFeedPosts(channel) {
      const timeline = document.getElementById('feedPostsTimeline');
      if (!timeline) return;

      const posts = channel.posts || [];
      if (posts.length === 0) {
        timeline.innerHTML = `
          <div style="padding: 40px 16px; text-align: center; color: #8696a0; margin: auto;">
            <i class="fa-solid fa-bullhorn" style="font-size: 34px; color: #334155; margin-bottom: 12px; display: block;"></i>
            <p style="font-size: 15px; font-weight: 600; color: #cbd5e1; margin: 0 0 6px 0;">No updates yet</p>
            <p style="font-size: 13px; color: #64748b; margin: 0;">Stay tuned for broadcasts from ${channel.name}.</p>
          </div>
        `;
        return;
      }

      timeline.innerHTML = posts.map(p => {
        const timeDisplay = p.timestamp || '10:27 a.m.';
        const viewsDisplay = p.views || (channel.followerCount ? String(channel.followerCount) : '149');
        const isReacted = p.userReacted ? 'reacted' : '';
        const likeCount = p.likes > 0 ? p.likes : '';

        return `
          <div class="whatsapp-channel-update-row">
            <div class="whatsapp-channel-card" data-post-id="${p.id}">
              ${p.image ? `
                <div class="whatsapp-channel-card-media">
                  <img src="${p.image}" alt="Update media" class="whatsapp-channel-card-img" />
                </div>
              ` : ''}
              <div class="whatsapp-channel-card-text">${this.escapeAndFormat(p.text || '')}</div>
              <div class="whatsapp-channel-card-meta">
                <span class="whatsapp-card-views-time">
                  <i class="fa-regular fa-eye"></i> ${viewsDisplay} &nbsp; ${timeDisplay}
                </span>
                <button type="button" class="whatsapp-channel-dots-btn" data-toggle-actions="${p.id}" title="Message Actions">
                  <i class="fa-solid fa-ellipsis"></i>
                </button>
              </div>
            </div>
            <!-- Message actions dropdown (React, Share, Forward) with 200ms animation -->
            <div class="whatsapp-channel-card-actions-dropdown" id="actions_dropdown_${p.id}" style="display: none;">
              <button type="button" class="whatsapp-channel-action-chip ${isReacted}" data-post-react="${p.id}" title="React">
                <i class="fa-regular fa-face-smile"></i>
                <span class="react-count">${likeCount ? `(${likeCount})` : 'React'}</span>
              </button>
              <button type="button" class="whatsapp-channel-action-chip" data-post-share="${p.id}" title="Forward update">
                <i class="fa-solid fa-share"></i>
                <span>Forward</span>
              </button>
              <button type="button" class="whatsapp-channel-action-chip" data-post-copy="${p.id}" title="Copy Text">
                <i class="fa-regular fa-copy"></i>
                <span>Copy</span>
              </button>
            </div>
          </div>
        `;
      }).join('');

      // Bind Actions Dropdown Toggle
      timeline.querySelectorAll('[data-toggle-actions]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const postId = btn.getAttribute('data-toggle-actions');
          const dropdown = document.getElementById(`actions_dropdown_${postId}`);
          if (!dropdown) return;
          const isShowing = dropdown.classList.contains('open');

          // Close other open action dropdowns
          timeline.querySelectorAll('.whatsapp-channel-card-actions-dropdown.open').forEach(d => {
            if (d !== dropdown) {
              d.classList.remove('open');
              setTimeout(() => d.style.display = 'none', 200);
            }
          });

          if (isShowing) {
            dropdown.classList.remove('open');
            setTimeout(() => dropdown.style.display = 'none', 200);
          } else {
            dropdown.style.display = 'flex';
            requestAnimationFrame(() => dropdown.classList.add('open'));
          }
        });
      });

      // Bind Reaction Click
      timeline.querySelectorAll('[data-post-react]').forEach(btn => {
        btn.addEventListener('click', () => {
          const postId = btn.getAttribute('data-post-react');
          const post = posts.find(p => p.id === postId);
          if (!post) return;
          post.userReacted = !post.userReacted;
          post.likes = post.userReacted ? (post.likes || 0) + 1 : Math.max(0, (post.likes || 1) - 1);
          this.saveChannels();
          btn.classList.toggle('reacted', post.userReacted);
          const span = btn.querySelector('.react-count');
          if (span) span.textContent = post.likes > 0 ? `(${post.likes})` : 'React';
        });
      });

      // Bind Share / Forward Click
      timeline.querySelectorAll('[data-post-share]').forEach(btn => {
        btn.addEventListener('click', () => {
          const postId = btn.getAttribute('data-post-share');
          const post = posts.find(p => p.id === postId);
          if (post) {
            const shareText = `Check out this update from ${channel.name} on NEXCHAT:\n\n"${post.text || 'Channel Media'}"\n\nhttps://nexchat-drab.vercel.app/channel/${channel.id}`;
            if (navigator.clipboard) {
              navigator.clipboard.writeText(shareText);
              if (window.showNotif) window.showNotif('Update link copied to clipboard', 'success');
            }
          }
        });
      });

      // Bind Copy Text Click
      timeline.querySelectorAll('[data-post-copy]').forEach(btn => {
        btn.addEventListener('click', () => {
          const postId = btn.getAttribute('data-post-copy');
          const post = posts.find(p => p.id === postId);
          if (post && post.text) {
            if (navigator.clipboard) {
              navigator.clipboard.writeText(post.text);
              if (window.showNotif) window.showNotif('Update text copied to clipboard', 'success');
            }
          }
        });
      });

      timeline.scrollTop = timeline.scrollHeight;
    }

    handleBroadcastPost() {
      if (!this.activeFeedChannelId) return;
      const input = document.getElementById('feedComposerInput');
      const text = input?.value?.trim() || '';
      const media = this.pendingMediaAttachment || null;

      if (!text && !media) {
        if (window.showNotif) window.showNotif('Tap & hold to record voice broadcast, or type an update', 'info');
        return;
      }

      if (text && window.fortressGuard) {
        const inspection = window.fortressGuard(text, 'Broadcast Channels');
        if (!inspection.safe) return;
      }

      const channel = this.channels.find(c => c.id === this.activeFeedChannelId);
      if (!channel) return;

      const user = this.getCurrentUser();
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase();

      const newPost = {
        id: 'post_' + Date.now().toString(36),
        authorName: channel.name,
        text: text,
        image: media,
        timestamp: timeStr,
        views: '1',
        likes: 0
      };

      if (!channel.posts) channel.posts = [];
      channel.posts.push(newPost);
      channel.lastPostSnippet = text || 'Photo update';
      channel.lastPostTime = timeStr;
      this.saveChannels();

      input.value = '';
      this.pendingMediaAttachment = null;
      const icon = document.getElementById('feedActionIcon');
      if (icon) icon.className = 'fa-solid fa-microphone';

      this.renderFeedPosts(channel);
      this.renderChannelsInUpdates();

      if (window.db && window.auth?.currentUser) {
        try {
          window.db.collection('channels').doc(channel.id).collection('posts').doc(newPost.id).set({
            text: newPost.text,
            image: newPost.image || null,
            authorId: user.uid,
            authorName: newPost.authorName,
            views: 1,
            likes: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          }).catch(() => { });
        } catch (_) { }
      }
    }

    handleCopyChannelLink() {
      if (!this.activeFeedChannelId) return;
      const channel = this.channels.find(c => c.id === this.activeFeedChannelId);
      if (!channel) return;
      const link = `https://nexchat-drab.vercel.app/channel/${channel.id}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(link).then(() => {
          if (window.showNotif) window.showNotif(`Channel link copied: ${channel.name}`, 'success');
        });
      } else {
        if (window.showNotif) window.showNotif(`Channel link: ${link}`, 'info');
      }
    }

    handleShareChannel() {
      if (!this.activeFeedChannelId) return;
      const channel = this.channels.find(c => c.id === this.activeFeedChannelId);
      if (!channel) return;
      const shareData = {
        title: `${channel.name} on NEXCHAT`,
        text: `Follow the official ${channel.name} broadcast channel for updates!`,
        url: `https://nexchat-drab.vercel.app/channel/${channel.id}`
      };
      if (navigator.share) {
        navigator.share(shareData).catch(() => {});
      } else {
        this.handleCopyChannelLink();
      }
    }

    showChannelInfoModal() {
      if (!this.activeFeedChannelId) return;
      const channel = this.channels.find(c => c.id === this.activeFeedChannelId);
      if (!channel) return;
      alert(`[CHANNEL INFO: ${channel.name.toUpperCase()}]\n\nHandle: ${channel.handle}\nFollowers: ${channel.followerCount}\nDescription: ${channel.description}\nCreated By: ${channel.creatorName}`);
    }

    closeFeedModal() {
      const modal = document.getElementById('channelFeedModal');
      if (modal) {
        modal.classList.remove('open');
        modal.style.display = 'none';
      }

      // Restore Updates list and bottom nav
      document.body.classList.remove('channel-route-active');
      const bottomNav = document.querySelector('.bottom-nav');
      if (bottomNav) bottomNav.style.removeProperty('display');
      const statusContainer = document.getElementById('statusContainer');
      if (statusContainer) statusContainer.style.removeProperty('display');
      const mainHeader = document.getElementById('mainHeader') || document.querySelector('.chat-header');
      if (mainHeader) mainHeader.style.removeProperty('display');

      const menu = document.getElementById('feedOptionsMenu');
      if (menu) menu.style.display = 'none';

      this.activeFeedChannelId = null;
      this.pendingMediaAttachment = null;
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

