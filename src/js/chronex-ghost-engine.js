/**
 * NEXCHAT - ChronEX Ghost Digital Twin Engine
 * Module: src/js/chronex-ghost-engine.js
 * 
 * CORE CAPABILITIES:
 * 1. Ghost Digital Twin Configuration:
 *    - Persisted in localStorage key: 'nex_chronex_ghost_config'
 *    - enabled: boolean (default false)
 *    - tone: 'cyber' | 'professional' | 'casual' | 'trader' (default 'cyber')
 *    - whitelist: 'all' | 'vip' | 'marketplace' (default 'all')
 *    - customDirectives: string (default '')
 *    - autoReplyDelayMs: number (default 1500)
 * 2. Away & Offline Telemetry Tracking:
 *    - Passive user activity monitoring (inactivity timeout, visibility change, window blur/focus)
 *    - Intercepts incoming messages via 'nexchat:incoming_message'
 * 3. Contextual Reply Generation:
 *    - High-velocity Google Gemini API integration (models: gemini-2.5-flash, gemini-2.0-flash, gemini-1.5-flash)
 *    - Comprehensive intelligent fallback templates tailored to selected tone and custom directives
 * 4. Automatic Ghost Watermark Tagging:
 *    - Outbound messages tagged with:
 *      <div class="ghost-auto-reply-badge"><i class="fa-solid fa-ghost"></i> ChronEX Ghost Auto-Replied</div>
 * 5. Ghost Briefing Journal:
 *    - Stored in localStorage key: 'nex_ghost_briefing_log'
 *    - Exposes getGhostBriefingSummary() for structured morning intelligence digests
 * 6. UI Controllers:
 *    - openGhostSettingsModal(): Configure tone, whitelist, directives, delay, and toggle
 *    - toggleGhostMode(forcedState): Immediate state flip with UI and event synchronization
 *    - renderBriefingModal() / openGhostBriefingModal(): Cyber HUD morning briefing dialog
 * 
 * STRICT COMPLIANCE:
 * - Strictly 0 Unicode emojis (FontAwesome 6 vector glyphs only).
 * - Pure Windows CRLF line endings.
 * - Non-blocking passive listeners, 60fps performance.
 */

// Safe dynamic or fallback resolution of Gemini Key Pool
let resolvedGeminiPool = null;
let resolvedDefaultKeys = [];

async function resolveGeminiKeys() {
  if (typeof window !== 'undefined' && window.geminiKeyPool) {
    resolvedGeminiPool = window.geminiKeyPool;
    return;
  }
  try {
    const configMod = await import('../../gemini-config.js');
    resolvedGeminiPool = configMod.geminiKeyPool || null;
    resolvedDefaultKeys = configMod.DEFAULT_GEMINI_KEYS || [];
  } catch (e) {
    // Fallback to window globals if set
    if (typeof window !== 'undefined') {
      resolvedGeminiPool = window.geminiKeyPool || null;
      resolvedDefaultKeys = window.DEFAULT_GEMINI_KEYS || [];
    }
  }
}

export class ChronexGhostEngine {
  constructor() {
    this.configStorageKey = 'nex_chronex_ghost_config';
    this.journalStorageKey = 'nex_ghost_briefing_log';
    this.vipStorageKey = 'nex_vip_contacts';

    this.defaultConfig = {
      enabled: false,
      tone: 'cyber', // 'cyber' | 'professional' | 'casual' | 'trader'
      whitelist: 'all', // 'all' | 'vip' | 'marketplace'
      customDirectives: '',
      autoReplyDelayMs: 1500
    };

    this.config = this.loadConfig();
    this.journal = this.loadJournal();
    this.isAway = false;
    this.idleTimer = null;
    this.idleThresholdMs = 45000; // 45 seconds of inactivity triggers away state
    this.recentReplyCooldown = new Map(); // senderId -> timestamp

    this.init();
  }

  init() {
    resolveGeminiKeys();
    this.setupTelemetryTracking();
    this.setupIncomingMessageListener();
    this.injectStyles();

    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.bindHeaderTrigger();
        }, { passive: true });
      } else {
        this.bindHeaderTrigger();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 1. CONFIGURATION STORAGE
  // ---------------------------------------------------------------------------
  loadConfig() {
    try {
      if (typeof localStorage === 'undefined') return { ...this.defaultConfig };
      const raw = localStorage.getItem(this.configStorageKey);
      if (!raw) return { ...this.defaultConfig };
      const parsed = JSON.parse(raw);
      return {
        enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : false,
        tone: ['cyber', 'professional', 'casual', 'trader'].includes(parsed.tone) ? parsed.tone : 'cyber',
        whitelist: ['all', 'vip', 'marketplace'].includes(parsed.whitelist) ? parsed.whitelist : 'all',
        customDirectives: typeof parsed.customDirectives === 'string' ? parsed.customDirectives : '',
        autoReplyDelayMs: typeof parsed.autoReplyDelayMs === 'number' && parsed.autoReplyDelayMs >= 300 ? parsed.autoReplyDelayMs : 1500
      };
    } catch (_) {
      return { ...this.defaultConfig };
    }
  }

  saveConfig() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.configStorageKey, JSON.stringify(this.config));
      }
      this.updateHeaderButtonUI();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nex_chronex_ghost_config_saved', { detail: { config: this.config } }));
      }
    } catch (_) {}
  }

  // ---------------------------------------------------------------------------
  // 2. AWAY & OFFLINE TELEMETRY TRACKING
  // ---------------------------------------------------------------------------
  setupTelemetryTracking() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Inactivity / Idle tracking
    const resetIdle = () => {
      if (this.isAway) {
        this.isAway = false;
        this.broadcastPresenceChange();
      }
      if (this.idleTimer) clearTimeout(this.idleTimer);
      this.idleTimer = setTimeout(() => {
        this.isAway = true;
        this.broadcastPresenceChange();
      }, this.idleThresholdMs);
    };

    const passiveOpts = { passive: true };
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(evt => {
      window.addEventListener(evt, resetIdle, passiveOpts);
    });

    // Visibility change detection
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.isAway = true;
      } else {
        this.isAway = false;
        resetIdle();
      }
      this.broadcastPresenceChange();
    }, passiveOpts);

    // Window blur & focus
    window.addEventListener('blur', () => {
      this.isAway = true;
      this.broadcastPresenceChange();
    }, passiveOpts);

    window.addEventListener('focus', () => {
      this.isAway = false;
      resetIdle();
      this.broadcastPresenceChange();
    }, passiveOpts);

    resetIdle();
  }

  setAwayState(awayState) {
    this.isAway = Boolean(awayState);
    this.broadcastPresenceChange();
  }

  isUserAway() {
    return this.isAway;
  }

  isGhostActive() {
    return Boolean(this.config.enabled);
  }

  broadcastPresenceChange() {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('nex_chronex_ghost_presence', {
      detail: { isAway: this.isAway, isEnabled: this.config.enabled }
    }));
  }

  // ---------------------------------------------------------------------------
  // 3. WHITELIST & INTERCEPTION RULES
  // ---------------------------------------------------------------------------
  isSenderWhitelisted(senderId, senderName, messageText, chatType) {
    if (this.config.whitelist === 'all') {
      return true;
    }

    if (this.config.whitelist === 'vip') {
      try {
        const rawVip = localStorage.getItem(this.vipStorageKey);
        const vipList = rawVip ? JSON.parse(rawVip) : [];
        if (Array.isArray(vipList)) {
          const match = vipList.some(v => {
            if (typeof v === 'string') return v === senderId || v === senderName;
            if (v && typeof v === 'object') return v.id === senderId || v.uid === senderId || v.name === senderName;
            return false;
          });
          if (match) return true;
        }
      } catch (_) {}
      return false;
    }

    if (this.config.whitelist === 'marketplace') {
      if (chatType === 'marketplace' || chatType === 'escrow') return true;
      const text = (messageText || '').toLowerCase();
      const marketplaceKeywords = [
        'escrow', 'buy', 'sell', 'deal', 'token', 'tokens', 'price',
        'payment', 'bounty', 'trade', 'swap', 'order', 'cost', 'invoice',
        'market', 'usdt', 'nex', 'deliverable', 'checksum', 'release'
      ];
      return marketplaceKeywords.some(kw => text.includes(kw));
    }

    return true;
  }

  setupIncomingMessageListener() {
    if (typeof window === 'undefined') return;

    window.addEventListener('nexchat:incoming_message', (e) => {
      const msg = e.detail;
      if (!msg) return;
      this.handleInboundMessage(msg);
    });
  }

  async handleInboundMessage(msg) {
    if (!this.config.enabled) return;

    const myUid = (typeof window !== 'undefined' && window.myUID) ? window.myUID : 'u_current';
    const senderId = msg.from || msg.sender || msg.authorUid || '';
    const senderName = msg.senderName || msg.sender || msg.from || 'Operative';
    const inboundText = (msg.text || '').trim();
    const chatType = msg.chatType || (typeof window !== 'undefined' ? window.currentChatType : 'direct') || 'direct';

    // Prevent replying to ourselves
    if (senderId && senderId === myUid) return;

    // Prevent infinite auto-reply loops
    if (inboundText.includes('ghost-auto-reply-badge') || inboundText.includes('ChronEX Ghost Auto-Replied')) {
      return;
    }

    // Ignore empty text messages (e.g. pure file attachments handled elsewhere)
    if (!inboundText) return;

    // Check whitelist rules
    if (!this.isSenderWhitelisted(senderId, senderName, inboundText, chatType)) {
      return;
    }

    // Check per-sender cooldown (15 seconds between replies to avoid conversation storming)
    const now = Date.now();
    const lastReply = this.recentReplyCooldown.get(senderId) || 0;
    if (now - lastReply < 15000) {
      return;
    }
    this.recentReplyCooldown.set(senderId, now);

    // Natural human delay simulation
    const delay = Math.max(300, this.config.autoReplyDelayMs || 1500);

    setTimeout(async () => {
      try {
        const rawReply = await this.generateContextualReply(inboundText, senderName, senderId);
        const outboundPayload = this.formatGhostMessage(rawReply);

        // Dispatch via Supabase / WebSockets
        if (typeof window !== 'undefined' && typeof window.sendSupabaseMessage === 'function') {
          const partnerId = (window.currentChatUserId || window.currentChatUser || senderId);
          window.sendSupabaseMessage({
            from: myUid,
            to: partnerId,
            text: outboundPayload,
            attachment: null,
            chatType: chatType
          }).catch(() => {});
        }

        // Render locally in chat viewport
        if (typeof window !== 'undefined' && typeof window.appendLocalSentMessage === 'function') {
          window.appendLocalSentMessage(outboundPayload, null, false, 'sent');
        }

        // Log entry to Ghost Briefing Journal
        this.logToJournal({
          senderId,
          senderName,
          inboundText,
          replyText: rawReply,
          tone: this.config.tone,
          chatType,
          simulatedDelayMs: delay
        });

        // Dispatch event for UI hooks
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('nexchat:ghost_reply_sent', {
            detail: { senderId, senderName, inboundText, replyText: rawReply, timestamp: Date.now() }
          }));
        }
      } catch (err) {
        // Safe failover
      }
    }, delay);
  }

  // ---------------------------------------------------------------------------
  // 4. CONTEXTUAL REPLY GENERATION (GEMINI API + TONE FALLBACKS)
  // ---------------------------------------------------------------------------
  async generateContextualReply(inboundText, senderName, senderId) {
    const tone = this.config.tone;
    const directives = (this.config.customDirectives || '').trim();

    // Attempt Gemini Flash API inference
    try {
      const pool = resolvedGeminiPool || (typeof window !== 'undefined' ? window.geminiKeyPool : null);
      const totalKeys = pool ? pool.getTotalKeys() : (resolvedDefaultKeys.length || 1);
      const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

      let systemToneInstruction = '';
      if (tone === 'cyber') {
        systemToneInstruction = 'You are the ChronEX Ghost Digital Twin of the user in NEXCHAT. Tone: High-tech cyberpunk tactical operative. Direct, analytical, brief, confident. Maximum 2 concise sentences. Strictly zero emojis.';
      } else if (tone === 'professional') {
        systemToneInstruction = 'You are the ChronEX Ghost Digital Twin of the user in NEXCHAT. Tone: Executive corporate professional. Courteous, crisp, structured, efficient. Maximum 2 concise sentences. Strictly zero emojis.';
      } else if (tone === 'casual') {
        systemToneInstruction = 'You are the ChronEX Ghost Digital Twin of the user in NEXCHAT. Tone: Relaxed, friendly peer. Natural, calm, authentic. Maximum 2 concise sentences. Strictly zero emojis.';
      } else if (tone === 'trader') {
        systemToneInstruction = 'You are the ChronEX Ghost Digital Twin of the user in NEXCHAT. Tone: High-frequency Web3 crypto desk trader. Focused on liquidity, risk management, execution, alpha. Maximum 2 concise sentences. Strictly zero emojis.';
      }

      let directiveClause = '';
      if (directives) {
        directiveClause = `PRIMARY OPERATIVE DIRECTIVE: ${directives}\r\nYou MUST naturally adhere to or mention this directive in your response.`;
      }

      const prompt = `${systemToneInstruction}
${directiveClause}

Inbound transmission from ${senderName}:
"${inboundText}"

Write a short, natural auto-reply speaking on behalf of the user who is temporarily away. Strictly zero Unicode emojis. Plain text only.`;

      for (let attempt = 0; attempt < Math.max(1, totalKeys); attempt++) {
        const keyInfo = pool?.getNextKey?.();
        const apiKey = keyInfo?.key || (resolvedDefaultKeys.length ? resolvedDefaultKeys[0] : '');
        if (!apiKey) break;

        let success = false;
        for (const model of models) {
          try {
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const res = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.4,
                  maxOutputTokens: 256,
                  topP: 0.9
                }
              })
            });

            if (res.ok) {
              const data = await res.json();
              const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (reply && reply.trim()) {
                pool?.reportSuccess?.(apiKey);
                return this.sanitizeReplyText(reply.trim());
              }
            } else if (res.status === 429 || res.status === 503) {
              pool?.reportRateLimit?.(apiKey);
            }
          } catch (_) {
            // Try next model or key
          }
        }
        if (success) break;
      }
    } catch (_) {
      // Failover to intelligent fallback templates
    }

    return this.getIntelligentFallbackReply(inboundText, tone, directives);
  }

  getIntelligentFallbackReply(inboundText, tone, directives) {
    const lower = (inboundText || '').toLowerCase();
    const isGreeting = /^(hi|hello|hey|yo|sup|good\s*(morning|afternoon|evening))\b/i.test(lower);
    const isQuestion = lower.includes('?') || /^(what|how|why|when|where|who|can\s*you|could\s*you|is\s*it)\b/i.test(lower);
    const isTrade = /(escrow|buy|sell|deal|token|tokens|price|cost|pay|swap|trade|bounty)/i.test(lower);

    let template = '';

    if (tone === 'cyber') {
      if (isGreeting) {
        template = 'Neural telemetry received. Operator is currently in deep-focus cyber link. Transmission buffered in local node.';
      } else if (isTrade) {
        template = 'Escrow and trade signal intercepted. Ghost protocol holding channel open until cryptographic sign-off.';
      } else if (isQuestion) {
        template = 'Query dispatched to ChronEX neural cache. Operator is off-terminal; priority telemetry logged.';
      } else {
        template = 'Ghost twin protocol online. Inbound transmission buffered. Operator will reconnect shortly.';
      }
    } else if (tone === 'professional') {
      if (isGreeting) {
        template = 'Greetings. I am currently away from my desk. Your message has been logged in my priority briefing queue.';
      } else if (isTrade) {
        template = 'Deal proposal noted. Escrow terms and documentation will be inspected upon return.';
      } else if (isQuestion) {
        template = 'Thank you for reaching out. I am currently offline and will review your inquiry with priority upon my return.';
      } else {
        template = 'Ghost digital twin active. Your message has been received and stored for priority response.';
      }
    } else if (tone === 'casual') {
      if (isGreeting) {
        template = 'Hey there! Stepped away from the screen for a bit. Catch you as soon as I am back.';
      } else if (isTrade) {
        template = 'Saw your trade message. Out of desk for a bit, will check the deal and tokens once back.';
      } else if (isQuestion) {
        template = 'Good question. Stepped away right now, but I will get back to you with details soon.';
      } else {
        template = 'Stepped away from NEXCHAT for a bit. Ghost twin has your note, will reply soon!';
      }
    } else if (tone === 'trader') {
      if (isGreeting) {
        template = 'Signal received. Trading desk is temporarily off-screen. Order queue monitored.';
      } else if (isTrade) {
        template = 'Trade alert logged. Stand by for counter-order or escrow confirmation once back on-desk.';
      } else if (isQuestion) {
        template = 'Inquiry logged on terminal. Standing by until operator returns to review market variables.';
      } else {
        template = 'Desk active in auto-hold. Transmission recorded. Reviewing order flow upon return.';
      }
    }

    if (directives) {
      template += ` [Status Directive: ${directives}]`;
    }

    return template;
  }

  sanitizeReplyText(text) {
    // Strip accidental unicode emojis and clean quotes
    return text
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/^["']|["']$/g, '')
      .trim();
  }

  // ---------------------------------------------------------------------------
  // 5. GHOST AUTO-REPLY TAGGING
  // ---------------------------------------------------------------------------
  formatGhostMessage(replyText) {
    return `<div class="ghost-auto-reply-badge"><i class="fa-solid fa-ghost"></i> ChronEX Ghost Auto-Replied</div>\r\n${replyText}`;
  }

  // ---------------------------------------------------------------------------
  // 6. GHOST BRIEFING JOURNAL
  // ---------------------------------------------------------------------------
  loadJournal() {
    try {
      if (typeof localStorage === 'undefined') return [];
      const raw = localStorage.getItem(this.journalStorageKey);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  saveJournal() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.journalStorageKey, JSON.stringify(this.journal));
      }
    } catch (_) {}
  }

  logToJournal({ senderId, senderName, inboundText, replyText, tone, chatType, simulatedDelayMs }) {
    const entry = {
      id: `ghost_log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      senderId: senderId || 'unknown',
      senderName: senderName || 'Operative',
      inboundText: inboundText || '',
      replyText: replyText || '',
      tone: tone || this.config.tone,
      chatType: chatType || 'direct',
      simulatedDelayMs: simulatedDelayMs || this.config.autoReplyDelayMs
    };

    this.journal.unshift(entry);
    // Keep max 150 items
    if (this.journal.length > 150) {
      this.journal = this.journal.slice(0, 150);
    }
    this.saveJournal();
  }

  clearJournal() {
    this.journal = [];
    this.saveJournal();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nex_ghost_journal_cleared'));
    }
  }

  getGhostBriefingSummary() {
    const list = this.journal;
    const now = Date.now();
    const oneDayMs = 24 * 3600000;

    const last24Hours = list.filter(entry => {
      const entryTime = new Date(entry.timestamp).getTime();
      return (now - entryTime) <= oneDayMs;
    });

    const targetList = last24Hours.length > 0 ? last24Hours : list.slice(0, 20);

    const uniqueSendersSet = new Set();
    const highlights = [];

    targetList.forEach(item => {
      uniqueSendersSet.add(item.senderName);
      if (highlights.length < 6) {
        highlights.push({
          sender: item.senderName,
          prompt: item.inboundText.length > 60 ? item.inboundText.substring(0, 57) + '...' : item.inboundText,
          reply: item.replyText.length > 80 ? item.replyText.substring(0, 77) + '...' : item.replyText,
          time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
    });

    const uniqueCount = uniqueSendersSet.size;
    const totalCount = targetList.length;

    let digestText = `CHRONEX GHOST MORNING INTEL BRIEFING\r\n`;
    digestText += `Time Span: Last 24 Hours | Intercepted: ${totalCount} messages | Unique Operatives: ${uniqueCount}\r\n`;
    digestText += `Active Persona Tone: ${this.config.tone.toUpperCase()}\r\n`;
    if (this.config.customDirectives) {
      digestText += `Custom Directive: "${this.config.customDirectives}"\r\n`;
    }
    digestText += `----------------------------------------\r\n`;

    if (highlights.length === 0) {
      digestText += `No inbound transmissions intercepted during this surveillance cycle.\r\n`;
    } else {
      highlights.forEach((h, idx) => {
        digestText += `[${idx + 1}] ${h.time} | @${h.sender}:\r\n`;
        digestText += `    Inbound: "${h.prompt}"\r\n`;
        digestText += `    Ghost Reply: "${h.reply}"\r\n`;
      });
    }

    return {
      totalCount,
      uniqueCount,
      uniqueSenders: Array.from(uniqueSendersSet),
      highlights,
      entries: targetList,
      digestText
    };
  }

  // ---------------------------------------------------------------------------
  // 7. UI CONTROLLERS & MODAL MANAGEMENT
  // ---------------------------------------------------------------------------
  toggleGhostMode(forcedState = null) {
    if (typeof forcedState === 'boolean') {
      this.config.enabled = forcedState;
    } else {
      this.config.enabled = !this.config.enabled;
    }
    this.saveConfig();
    this.updateHeaderButtonUI();

    if (typeof window !== 'undefined') {
      if (typeof window.showNotif === 'function') {
        const statusText = this.config.enabled
          ? `ChronEX Ghost Active: Tone [${this.config.tone.toUpperCase()}]`
          : 'ChronEX Ghost: Standby Mode';
        window.showNotif(statusText, this.config.enabled ? 'success' : 'info', 2500);
      }
      if (typeof window.playCyberSfx === 'function') {
        window.playCyberSfx(this.config.enabled ? 'affirm' : 'toggle');
      }
      window.dispatchEvent(new CustomEvent('nex_chronex_ghost_toggle', { detail: { enabled: this.config.enabled } }));
    }

    return this.config.enabled;
  }

  openGhostSettingsModal() {
    if (typeof document === 'undefined') return;

    let modal = document.getElementById('chronexGhostSettingsModal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'chronexGhostSettingsModal';
    modal.className = 'nextgen-modal-overlay chronex-ghost-modal-backdrop';
    modal.style.display = 'flex';

    modal.innerHTML = `
      <div class="nextgen-modal-card chronex-ghost-modal-card">
        <div class="nextgen-modal-header chronex-ghost-modal-header">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-ghost text-[#00f2ff] text-lg"></i>
            <h3 class="font-extrabold text-white text-sm tracking-wide m-0">CHRONEX GHOST DIGITAL TWIN</h3>
            <span class="chronex-ghost-pill ${this.config.enabled ? 'active' : ''}" id="ghostSettingsStatusPill">
              ${this.config.enabled ? 'ARMED & ONLINE' : 'STANDBY'}
            </span>
          </div>
          <button type="button" class="nextgen-modal-close" id="closeGhostSettingsBtn">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="chronex-ghost-modal-body">
          <!-- Master Switch -->
          <div class="ghost-config-row">
            <div>
              <strong class="text-white text-xs block uppercase tracking-wider">Autonomous Digital Twin Protocol</strong>
              <span class="text-[11px] text-gray-400">Generates contextual neural replies when AFK or off-terminal.</span>
            </div>
            <label class="cyber-switch">
              <input type="checkbox" id="ghostMasterToggle" ${this.config.enabled ? 'checked' : ''} />
              <span class="cyber-slider"></span>
            </label>
          </div>

          <!-- Persona Tone Selector -->
          <div class="ghost-form-group mt-3">
            <label class="ghost-field-label">Persona Response Tone:</label>
            <div class="ghost-tone-grid">
              <button type="button" class="ghost-tone-btn ${this.config.tone === 'cyber' ? 'active' : ''}" data-tone="cyber">
                <i class="fa-solid fa-terminal"></i>
                <div class="ghost-tone-info">
                  <strong>Cyber</strong>
                  <span>Tactical Matrix</span>
                </div>
              </button>
              <button type="button" class="ghost-tone-btn ${this.config.tone === 'professional' ? 'active' : ''}" data-tone="professional">
                <i class="fa-solid fa-briefcase"></i>
                <div class="ghost-tone-info">
                  <strong>Professional</strong>
                  <span>Corporate Senior</span>
                </div>
              </button>
              <button type="button" class="ghost-tone-btn ${this.config.tone === 'casual' ? 'active' : ''}" data-tone="casual">
                <i class="fa-solid fa-comments"></i>
                <div class="ghost-tone-info">
                  <strong>Casual</strong>
                  <span>Friendly Peer</span>
                </div>
              </button>
              <button type="button" class="ghost-tone-btn ${this.config.tone === 'trader' ? 'active' : ''}" data-tone="trader">
                <i class="fa-solid fa-chart-line"></i>
                <div class="ghost-tone-info">
                  <strong>Trader</strong>
                  <span>Web3 Liquidity Desk</span>
                </div>
              </button>
            </div>
          </div>

          <!-- Whitelist Filter -->
          <div class="ghost-form-group mt-3">
            <label class="ghost-field-label">Interception Whitelist:</label>
            <div class="ghost-whitelist-row">
              <button type="button" class="ghost-whitelist-btn ${this.config.whitelist === 'all' ? 'active' : ''}" data-wl="all">
                <i class="fa-solid fa-globe"></i> All Inbound
              </button>
              <button type="button" class="ghost-whitelist-btn ${this.config.whitelist === 'vip' ? 'active' : ''}" data-wl="vip">
                <i class="fa-solid fa-star"></i> VIP Contacts Only
              </button>
              <button type="button" class="ghost-whitelist-btn ${this.config.whitelist === 'marketplace' ? 'active' : ''}" data-wl="marketplace">
                <i class="fa-solid fa-shield-halved"></i> Marketplace &amp; Escrow
              </button>
            </div>
          </div>

          <!-- Custom Directives -->
          <div class="ghost-form-group mt-3">
            <label class="ghost-field-label">Custom Directives / AFK Instruction:</label>
            <textarea id="ghostDirectivesInput" class="ghost-textarea" rows="2" placeholder="e.g. Tell them I'm coding until 8pm and will inspect escrow deals then.">${this.config.customDirectives || ''}</textarea>
            <span class="text-[10px] text-gray-500 mt-1 block">Injected into neural prompt to condition ghost responses accurately.</span>
          </div>

          <!-- Simulated Human Latency -->
          <div class="ghost-form-group mt-3">
            <label class="ghost-field-label">Simulated Human Delay (Natural Typing Latency):</label>
            <div class="ghost-delay-presets">
              <button type="button" class="ghost-delay-btn ${this.config.autoReplyDelayMs === 800 ? 'active' : ''}" data-ms="800">800ms (Fast)</button>
              <button type="button" class="ghost-delay-btn ${this.config.autoReplyDelayMs === 1500 ? 'active' : ''}" data-ms="1500">1.5s (Natural)</button>
              <button type="button" class="ghost-delay-btn ${this.config.autoReplyDelayMs === 2500 ? 'active' : ''}" data-ms="2500">2.5s (Casual)</button>
              <button type="button" class="ghost-delay-btn ${this.config.autoReplyDelayMs === 4000 ? 'active' : ''}" data-ms="4000">4.0s (Deep Think)</button>
            </div>
          </div>

          <!-- Modal Action Bar -->
          <div class="ghost-modal-actions mt-4">
            <button type="button" class="ghost-action-briefing-btn" id="openBriefingFromSettingsBtn">
              <i class="fa-solid fa-newspaper"></i> Morning Briefing Journal
            </button>
            <div class="flex gap-2">
              <button type="button" class="ghost-btn-cancel" id="cancelGhostSettingsBtn">Cancel</button>
              <button type="button" class="ghost-btn-save" id="saveGhostSettingsBtn">
                <i class="fa-solid fa-check"></i> Apply Configuration
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event Bindings
    const masterToggle = modal.querySelector('#ghostMasterToggle');
    const pill = modal.querySelector('#ghostSettingsStatusPill');
    let selectedTone = this.config.tone;
    let selectedWhitelist = this.config.whitelist;
    let selectedDelay = this.config.autoReplyDelayMs;

    masterToggle.addEventListener('change', () => {
      const isArmed = masterToggle.checked;
      pill.className = `chronex-ghost-pill ${isArmed ? 'active' : ''}`;
      pill.textContent = isArmed ? 'ARMED & ONLINE' : 'STANDBY';
    });

    modal.querySelectorAll('.ghost-tone-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.ghost-tone-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedTone = btn.dataset.tone;
      });
    });

    modal.querySelectorAll('.ghost-whitelist-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.ghost-whitelist-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedWhitelist = btn.dataset.wl;
      });
    });

    modal.querySelectorAll('.ghost-delay-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.ghost-delay-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedDelay = parseInt(btn.dataset.ms, 10);
      });
    });

    const closeModal = () => modal.remove();

    modal.querySelector('#closeGhostSettingsBtn').addEventListener('click', closeModal);
    modal.querySelector('#cancelGhostSettingsBtn').addEventListener('click', closeModal);

    modal.querySelector('#openBriefingFromSettingsBtn').addEventListener('click', () => {
      closeModal();
      this.renderBriefingModal();
    });

    modal.querySelector('#saveGhostSettingsBtn').addEventListener('click', () => {
      const directivesInput = modal.querySelector('#ghostDirectivesInput');
      this.config.enabled = masterToggle.checked;
      this.config.tone = selectedTone;
      this.config.whitelist = selectedWhitelist;
      this.config.customDirectives = directivesInput ? directivesInput.value.trim() : '';
      this.config.autoReplyDelayMs = selectedDelay;

      this.saveConfig();
      closeModal();

      if (typeof window !== 'undefined') {
        if (typeof window.showNotif === 'function') {
          window.showNotif('ChronEX Ghost protocols armed successfully', 'success', 2500);
        }
        if (typeof window.playCyberSfx === 'function') {
          window.playCyberSfx('affirm');
        }
      }
    });
  }

  renderBriefingModal() {
    this.openGhostBriefingModal();
  }

  openGhostBriefingModal() {
    if (typeof document === 'undefined') return;

    let modal = document.getElementById('chronexGhostBriefingModal');
    if (modal) modal.remove();

    const summary = this.getGhostBriefingSummary();

    modal = document.createElement('div');
    modal.id = 'chronexGhostBriefingModal';
    modal.className = 'nextgen-modal-overlay chronex-ghost-modal-backdrop';
    modal.style.display = 'flex';

    modal.innerHTML = `
      <div class="nextgen-modal-card chronex-ghost-modal-card" style="max-width: 680px;">
        <div class="nextgen-modal-header chronex-ghost-modal-header">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-ghost text-[#00f2ff] text-lg"></i>
            <h3 class="font-extrabold text-white text-sm tracking-wide m-0">CHRONEX GHOST BRIEFING JOURNAL</h3>
          </div>
          <button type="button" class="nextgen-modal-close" id="closeGhostBriefingBtn">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="chronex-ghost-modal-body">
          <!-- Summary Metrics HUD -->
          <div class="ghost-metrics-grid">
            <div class="ghost-metric-card">
              <span class="metric-val text-[#00f2ff]">${summary.totalCount}</span>
              <span class="metric-lbl">Intercepted Calls</span>
            </div>
            <div class="ghost-metric-card">
              <span class="metric-val text-[#00ff88]">${summary.uniqueCount}</span>
              <span class="metric-lbl">Unique Operatives</span>
            </div>
            <div class="ghost-metric-card">
              <span class="metric-val text-[#fbbf24]">${this.config.tone.toUpperCase()}</span>
              <span class="metric-lbl">Current Tone</span>
            </div>
            <div class="ghost-metric-card">
              <span class="metric-val text-[#a855f7]">${this.config.enabled ? 'ACTIVE' : 'STANDBY'}</span>
              <span class="metric-lbl">Twin Status</span>
            </div>
          </div>

          <!-- Morning Digest Highlights -->
          <div class="mt-3">
            <div class="flex justify-between items-center mb-2">
              <label class="ghost-field-label m-0">Morning Intel Digest Highlights:</label>
              <span class="text-[10px] text-gray-400 font-mono">Window: Last 24 Hours</span>
            </div>
            <div class="ghost-journal-stream">
              ${summary.highlights.length === 0 ? `
                <div class="text-xs text-gray-500 italic text-center py-6">
                  <i class="fa-solid fa-moon text-gray-600 text-2xl block mb-2"></i>
                  No inbound transmissions intercepted during this cycle.
                </div>
              ` : summary.highlights.map((h, i) => `
                <div class="ghost-stream-item">
                  <div class="flex justify-between items-center">
                    <span class="text-xs font-bold text-[#00f2ff]">
                      <i class="fa-solid fa-user-secret mr-1"></i> @${h.sender}
                    </span>
                    <span class="text-[10px] text-gray-500 font-mono">${h.time}</span>
                  </div>
                  <div class="text-xs text-gray-300 mt-1 pl-2 border-l-2 border-gray-700">
                    <strong class="text-gray-400 font-mono">Inbound:</strong> "${h.prompt}"
                  </div>
                  <div class="text-xs text-[#00ff88] mt-1 pl-2 border-l-2 border-[#00ff88]/40">
                    <strong class="text-[#00f2ff] font-mono">Ghost:</strong> "${h.reply}"
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Action Controls -->
          <div class="ghost-modal-actions mt-4">
            <button type="button" class="ghost-btn-danger" id="clearGhostJournalBtn">
              <i class="fa-solid fa-trash-can"></i> Clear Journal
            </button>
            <div class="flex gap-2">
              <button type="button" class="ghost-btn-secondary" id="copyGhostDigestBtn">
                <i class="fa-solid fa-copy"></i> Copy Digest
              </button>
              <button type="button" class="ghost-btn-save" id="closeBriefingFooterBtn">
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();

    modal.querySelector('#closeGhostBriefingBtn').addEventListener('click', closeModal);
    modal.querySelector('#closeBriefingFooterBtn').addEventListener('click', closeModal);

    modal.querySelector('#clearGhostJournalBtn').addEventListener('click', () => {
      this.clearJournal();
      closeModal();
      if (typeof window !== 'undefined' && typeof window.showNotif === 'function') {
        window.showNotif('Ghost Briefing Journal cleared', 'info', 2000);
      }
    });

    modal.querySelector('#copyGhostDigestBtn').addEventListener('click', () => {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(summary.digestText).then(() => {
          if (typeof window !== 'undefined' && typeof window.showNotif === 'function') {
            window.showNotif('Morning Briefing copied to clipboard', 'success', 2000);
          }
        });
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 8. HEADER TRIGGER BUTTON INJECTION
  // ---------------------------------------------------------------------------
  bindHeaderTrigger() {
    if (typeof document === 'undefined' || typeof document.querySelector !== 'function') return;

    const headerActions = document.querySelector('.chat-detail-header-actions') || 
                          document.querySelector('.chat-detail-header-right');

    if (headerActions && !document.getElementById('chronexGhostHeaderBtn')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'chronexGhostHeaderBtn';
      btn.className = 'header-icon-btn chronex-ghost-header-trigger';
      btn.title = 'ChronEX Ghost Digital Twin';
      btn.innerHTML = `<i class="fa-solid fa-ghost ${this.config.enabled ? 'text-[#00f2ff]' : 'text-gray-400'}"></i>`;

      btn.addEventListener('click', () => {
        this.openGhostSettingsModal();
      });

      headerActions.insertBefore(btn, headerActions.firstChild || null);
    }
  }

  updateHeaderButtonUI() {
    if (typeof document === 'undefined') return;
    const btn = document.getElementById('chronexGhostHeaderBtn');
    if (btn) {
      btn.innerHTML = `<i class="fa-solid fa-ghost ${this.config.enabled ? 'text-[#00f2ff]' : 'text-gray-400'}"></i>`;
    }
  }

  // ---------------------------------------------------------------------------
  // 9. CSS STYLES INJECTION
  // ---------------------------------------------------------------------------
  injectStyles() {
    if (typeof document === 'undefined' || !document.head) return;
    if (document.getElementById('chronexGhostEngineStyles')) return;

    const style = document.createElement('style');
    style.id = 'chronexGhostEngineStyles';
    style.textContent = `
      .ghost-auto-reply-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(0, 242, 255, 0.12);
        border: 1px solid rgba(0, 242, 255, 0.35);
        color: #00f2ff;
        font-family: 'Space Grotesk', system-ui, -apple-system, sans-serif;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.5px;
        padding: 3px 8px;
        border-radius: 4px;
        margin-bottom: 6px;
        text-transform: uppercase;
      }
      .ghost-auto-reply-badge i {
        color: #00f2ff;
        font-size: 11px;
      }
      .chronex-ghost-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 10050;
        background: rgba(5, 7, 13, 0.85);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .chronex-ghost-modal-card {
        background: #090d16;
        border: 1px solid rgba(0, 242, 255, 0.25);
        box-shadow: 0 10px 40px rgba(0, 242, 255, 0.12);
        border-radius: 12px;
        width: 95vw;
        max-width: 580px;
        max-height: 90vh;
        overflow-y: auto;
        color: #fff;
        font-family: system-ui, -apple-system, sans-serif;
      }
      .chronex-ghost-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 18px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
      .chronex-ghost-modal-body {
        padding: 18px;
      }
      .chronex-ghost-pill {
        font-size: 9.5px;
        font-weight: 800;
        padding: 2px 7px;
        border-radius: 4px;
        background: rgba(148, 163, 184, 0.15);
        border: 1px solid rgba(148, 163, 184, 0.3);
        color: #94a3b8;
        font-family: monospace;
      }
      .chronex-ghost-pill.active {
        background: rgba(0, 242, 255, 0.15);
        border-color: #00f2ff;
        color: #00f2ff;
        box-shadow: 0 0 10px rgba(0, 242, 255, 0.25);
      }
      .ghost-config-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.07);
        padding: 12px 14px;
        border-radius: 8px;
      }
      .ghost-field-label {
        font-size: 11px;
        font-weight: 700;
        color: #94a3b8;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        margin-bottom: 6px;
        display: block;
      }
      .ghost-tone-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }
      .ghost-tone-btn {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: #cbd5e1;
        cursor: pointer;
        text-align: left;
        transition: all 0.2s;
      }
      .ghost-tone-btn:hover {
        background: rgba(0, 242, 255, 0.06);
        border-color: rgba(0, 242, 255, 0.3);
      }
      .ghost-tone-btn.active {
        background: rgba(0, 242, 255, 0.12);
        border-color: #00f2ff;
        color: #fff;
        box-shadow: 0 0 12px rgba(0, 242, 255, 0.2);
      }
      .ghost-tone-btn i {
        font-size: 16px;
        color: #00f2ff;
      }
      .ghost-tone-info strong {
        display: block;
        font-size: 12px;
      }
      .ghost-tone-info span {
        display: block;
        font-size: 10px;
        color: #94a3b8;
      }
      .ghost-whitelist-row, .ghost-delay-presets {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .ghost-whitelist-btn, .ghost-delay-btn {
        flex: 1;
        min-width: 100px;
        padding: 7px 10px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        color: #cbd5e1;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition: all 0.2s;
      }
      .ghost-whitelist-btn.active, .ghost-delay-btn.active {
        background: rgba(0, 242, 255, 0.15);
        border-color: #00f2ff;
        color: #00f2ff;
      }
      .ghost-textarea {
        width: 100%;
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 8px;
        color: #fff;
        font-size: 12px;
        padding: 8px 10px;
        outline: none;
        resize: vertical;
        box-sizing: border-box;
      }
      .ghost-textarea:focus {
        border-color: #00f2ff;
      }
      .ghost-modal-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        padding-top: 14px;
      }
      .ghost-btn-save {
        background: #00f2ff;
        color: #050811;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 11.5px;
        font-weight: 800;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .ghost-btn-save:hover {
        background: #38bdf8;
      }
      .ghost-btn-cancel, .ghost-btn-secondary {
        background: rgba(255, 255, 255, 0.06);
        color: #94a3b8;
        border: 1px solid rgba(255, 255, 255, 0.12);
        padding: 8px 14px;
        border-radius: 6px;
        font-size: 11.5px;
        font-weight: 700;
        cursor: pointer;
      }
      .ghost-btn-danger {
        background: rgba(255, 0, 85, 0.12);
        color: #ff0055;
        border: 1px solid #ff0055;
        padding: 8px 14px;
        border-radius: 6px;
        font-size: 11.5px;
        font-weight: 700;
        cursor: pointer;
      }
      .ghost-action-briefing-btn {
        background: rgba(0, 242, 255, 0.1);
        border: 1px solid rgba(0, 242, 255, 0.3);
        color: #00f2ff;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 11.5px;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .ghost-metrics-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
      }
      .ghost-metric-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        padding: 10px;
        text-align: center;
      }
      .ghost-metric-card .metric-val {
        display: block;
        font-size: 17px;
        font-weight: 900;
        font-family: monospace;
      }
      .ghost-metric-card .metric-lbl {
        display: block;
        font-size: 9.5px;
        color: #94a3b8;
        margin-top: 2px;
        text-transform: uppercase;
      }
      .ghost-journal-stream {
        max-height: 280px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 8px;
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 8px;
        padding: 10px;
      }
      .ghost-stream-item {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 6px;
        padding: 8px 10px;
      }
    `;
    document.head.appendChild(style);
  }
}

// Global browser singleton binding
if (typeof window !== 'undefined') {
  window.ChronexGhostEngine = ChronexGhostEngine;
  if (!window.chronexGhostEngine) {
    window.chronexGhostEngine = new ChronexGhostEngine();
  }
}
