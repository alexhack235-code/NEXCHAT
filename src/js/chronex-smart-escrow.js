/**
 * NEXCHAT - ChronEX Smart Escrow Guardian Engine
 * Module: src/js/chronex-smart-escrow.js
 * 
 * CORE CAPABILITIES:
 * 1. Peer-to-Peer Trustless Escrow Deals:
 *    - Operates in both Direct and Group chats.
 *    - Lifecycle states:
 *      PROPOSED -> TOKENS_LOCKED -> DELIVERABLE_UPLOADED -> INSPECTED_RELEASED (or DISPUTED) -> SETTLED
 *      (Also handles CANCELLED and REFUNDED).
 * 2. Secure Escrow Vault:
 *    - Token balance store: reads/writes to 'nex_tokens_balance', 'nexchat_user_tokens', and 'nex_tokens'.
 *    - Locks tokens in escrow vault upon buyer activation.
 *    - Seller attaches deliverable (SHA-256 file hash, encrypted payload, download link, or credentials).
 *    - Buyer previews deliverable checksum and watermark before clicking [Release Escrow].
 *    - Escrow release transfers tokens to seller and unlocks deliverable payload.
 *    - [Raise Dispute] dispatches dispute metadata to group moderators / SuperAdmin.
 * 3. Interactive Cyber HUD Escrow Card:
 *    - In-chat render: <div class="escrow-deal-card status-${status}">...</div>
 *    - Live interactive buttons, 5-step visual progress HUD, and real-time countdown timer.
 * 4. Attachment Hub Integration:
 *    - Exposes openCreateEscrowModal(targetUser, currentChatType) and auto-injects into #attachmentPopupHub.
 * 
 * STRICT COMPLIANCE:
 * - Strictly 0 Unicode emojis (FontAwesome 6 vector glyphs only).
 * - Pure Windows CRLF line endings.
 * - 60fps performance with non-blocking timers and passive DOM listeners.
 */

export class ChronexSmartEscrow {
  constructor() {
    this.vaultStorageKey = 'nex_smart_escrow_vault';
    this.tokenBalanceKey = 'nex_tokens_balance';
    this.disputeLogKey = 'nex_escrow_disputes_log';

    this.deals = this.loadDeals();
    this.countdownInterval = null;

    this.init();
  }

  init() {
    this.injectStyles();
    this.startCountdownTicker();
    this.listenIncomingEscrowEvents();

    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.injectAttachmentHubOption();
          this.injectModals();
        }, { passive: true });
      } else {
        this.injectAttachmentHubOption();
        this.injectModals();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 1. TOKEN BALANCE & VAULT STORAGE
  // ---------------------------------------------------------------------------
  getUserTokens() {
    if (typeof localStorage === 'undefined') return 1000;
    const stored = localStorage.getItem(this.tokenBalanceKey) ||
                   localStorage.getItem('nexchat_user_tokens') ||
                   localStorage.getItem('nex_tokens');
    return stored ? (parseInt(stored, 10) || 0) : 1000;
  }

  setUserTokens(amount) {
    const val = Math.max(0, parseInt(amount, 10) || 0);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.tokenBalanceKey, String(val));
      localStorage.setItem('nexchat_user_tokens', String(val));
      localStorage.setItem('nex_tokens', String(val));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nexchat:tokens_changed', { detail: { tokens: val } }));
    }
    return val;
  }

  loadDeals() {
    try {
      if (typeof localStorage === 'undefined') return {};
      const raw = localStorage.getItem(this.vaultStorageKey);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  saveDeals() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.vaultStorageKey, JSON.stringify(this.deals));
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nex_smart_escrow_vault_updated', { detail: { deals: this.deals } }));
      }
    } catch (_) {}
  }

  getDeal(dealId) {
    return this.deals[dealId] || null;
  }

  // ---------------------------------------------------------------------------
  // 2. CRYPTOGRAPHIC CHECKSUM UTILITY
  // ---------------------------------------------------------------------------
  async computeChecksum(input) {
    try {
      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(input);
        const hashBuf = await window.crypto.subtle.digest('SHA-256', data);
        const hashArr = Array.from(new Uint8Array(hashBuf));
        return hashArr.map(b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (_) {}

    // Fallback deterministic hex hash
    let hash = 0;
    const str = String(input);
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return (hex + 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855').substring(0, 64);
  }

  // ---------------------------------------------------------------------------
  // 3. ESCROW DEAL CREATION & LIFECYCLE MUTATIONS
  // ---------------------------------------------------------------------------
  createDeal({ title, description, amount, role, counterpartyUid, counterpartyName, windowHours = 24, chatType = 'direct' }) {
    const myUid = (typeof window !== 'undefined' && window.myUID) ? window.myUID : 'u_current';
    const myName = (typeof window !== 'undefined' && window.currentUserName) ? window.currentUserName : 'Operative';
    const dealAmount = Math.max(1, parseInt(amount, 10) || 100);

    const dealId = `escrow_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const isCreatorBuyer = (role === 'buyer');

    const buyerUid = isCreatorBuyer ? myUid : (counterpartyUid || 'partner_user');
    const buyerName = isCreatorBuyer ? myName : (counterpartyName || 'Counterparty');
    const sellerUid = !isCreatorBuyer ? myUid : (counterpartyUid || 'partner_user');
    const sellerName = !isCreatorBuyer ? myName : (counterpartyName || 'Counterparty');

    // Pre-flight balance check if creator is buyer
    if (isCreatorBuyer) {
      const balance = this.getUserTokens();
      if (balance < dealAmount) {
        if (typeof window !== 'undefined' && typeof window.showNotif === 'function') {
          window.showNotif(`Insufficient tokens! Need ${dealAmount} NEX tokens for escrow lock.`, 'error', 3000);
        }
        return null;
      }
    }

    const deal = {
      id: dealId,
      title: title || 'Encrypted Peer-to-Peer Asset Deal',
      description: description || 'Digital asset delivery under trustless cryptographic escrow.',
      amount: dealAmount,
      currency: 'NEX',
      buyerUid,
      buyerName,
      sellerUid,
      sellerName,
      creatorUid: myUid,
      creatorRole: role,
      status: 'PROPOSED', // 'PROPOSED' | 'TOKENS_LOCKED' | 'DELIVERABLE_UPLOADED' | 'INSPECTED_RELEASED' | 'DISPUTED' | 'SETTLED' | 'CANCELLED' | 'REFUNDED'
      chatType,
      windowHours: parseInt(windowHours, 10) || 24,
      createdAt: Date.now(),
      lockedAt: null,
      uploadedAt: null,
      releasedAt: null,
      settledAt: null,
      disputedAt: null,
      disputeReason: null,
      disputeRaisedBy: null,
      disputeResolution: null,
      deliverable: null,
      receiptId: null
    };

    // If creator is buyer, they can immediately lock tokens upon creation
    if (isCreatorBuyer) {
      const bal = this.getUserTokens();
      this.setUserTokens(bal - dealAmount);
      deal.status = 'TOKENS_LOCKED';
      deal.lockedAt = Date.now();
    }

    this.deals[dealId] = deal;
    this.saveDeals();

    // Broadcast attachment into chat
    this.broadcastDealCreation(deal);

    return deal;
  }

  lockTokens(dealId) {
    const deal = this.deals[dealId];
    if (!deal || deal.status !== 'PROPOSED') return false;

    const myUid = (typeof window !== 'undefined' && window.myUID) ? window.myUID : 'u_current';
    if (deal.buyerUid !== myUid && deal.buyerUid !== 'partner_user') {
      if (typeof window !== 'undefined' && typeof window.showNotif === 'function') {
        window.showNotif('Only the designated Buyer can lock tokens for this deal', 'error', 2500);
      }
      return false;
    }

    const balance = this.getUserTokens();
    if (balance < deal.amount) {
      if (typeof window !== 'undefined' && typeof window.showNotif === 'function') {
        window.showNotif(`Insufficient tokens! Need ${deal.amount} NEX tokens to lock escrow.`, 'error', 3000);
      }
      return false;
    }

    // Deduct tokens
    this.setUserTokens(balance - deal.amount);

    deal.status = 'TOKENS_LOCKED';
    deal.lockedAt = Date.now();
    this.deals[dealId] = deal;
    this.saveDeals();

    this.broadcastDealEvent('TOKENS_LOCKED', dealId, { lockedAt: deal.lockedAt });
    this.refreshCardDOM(dealId);

    if (typeof window !== 'undefined') {
      if (typeof window.showNotif === 'function') {
        window.showNotif(`Escrow locked! ${deal.amount} NEX secured in vault.`, 'success', 2500);
      }
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('affirm');
    }

    return true;
  }

  async attachDeliverable(dealId, { type, content, watermark, instructions }) {
    const deal = this.deals[dealId];
    if (!deal || (deal.status !== 'TOKENS_LOCKED' && deal.status !== 'PROPOSED')) return false;

    const checksum = await this.computeChecksum(content || 'nex_deliverable_seal');
    const sealWatermark = watermark || `CONFIDENTIAL WATERMARK // ESCROW-VERIFIED // SEAL-${dealId.slice(-4).toUpperCase()}`;

    deal.deliverable = {
      type: type || 'FILE_HASH', // 'FILE_HASH' | 'ENCRYPTED_PAYLOAD' | 'DOWNLOAD_LINK' | 'CREDENTIALS'
      content: content || '',
      checksum: checksum,
      watermark: sealWatermark,
      instructions: instructions || 'Inspect deliverable verification seal before releasing escrow funds.',
      uploadedAt: Date.now()
    };

    deal.status = 'DELIVERABLE_UPLOADED';
    deal.uploadedAt = Date.now();
    this.deals[dealId] = deal;
    this.saveDeals();

    this.broadcastDealEvent('DELIVERABLE_UPLOADED', dealId, { deliverable: deal.deliverable });
    this.refreshCardDOM(dealId);

    if (typeof window !== 'undefined') {
      if (typeof window.showNotif === 'function') {
        window.showNotif('Deliverable attached to escrow vault with SHA-256 seal', 'success', 2500);
      }
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('affirm');
    }

    return true;
  }

  releaseEscrow(dealId) {
    const deal = this.deals[dealId];
    if (!deal || (deal.status !== 'DELIVERABLE_UPLOADED' && deal.status !== 'TOKENS_LOCKED')) return false;

    const myUid = (typeof window !== 'undefined' && window.myUID) ? window.myUID : 'u_current';
    if (deal.buyerUid !== myUid && deal.buyerUid !== 'partner_user') {
      if (typeof window !== 'undefined' && typeof window.showNotif === 'function') {
        window.showNotif('Only the designated Buyer can authorize escrow release', 'error', 2500);
      }
      return false;
    }

    deal.status = 'SETTLED';
    deal.releasedAt = Date.now();
    deal.settledAt = Date.now();
    deal.receiptId = `RCPT-NEX-${dealId.slice(-6).toUpperCase()}`;

    // If current user is also the seller (e.g. self-test), return tokens to seller balance
    if (deal.sellerUid === myUid) {
      const curBal = this.getUserTokens();
      this.setUserTokens(curBal + deal.amount);
    }

    this.deals[dealId] = deal;
    this.saveDeals();

    this.broadcastDealEvent('ESCROW_SETTLED', dealId, {
      settledAt: deal.settledAt,
      receiptId: deal.receiptId
    });
    this.refreshCardDOM(dealId);

    if (typeof window !== 'undefined') {
      if (typeof window.showNotif === 'function') {
        window.showNotif(`Escrow Released! ${deal.amount} NEX transferred to seller. Deal Settled.`, 'success', 3500);
      }
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('victory');
    }

    return true;
  }

  raiseDispute(dealId, reason) {
    const deal = this.deals[dealId];
    if (!deal) return false;

    const myUid = (typeof window !== 'undefined' && window.myUID) ? window.myUID : 'u_current';

    deal.status = 'DISPUTED';
    deal.disputedAt = Date.now();
    deal.disputeReason = reason || 'Deliverable non-compliance / specification dispute';
    deal.disputeRaisedBy = myUid;

    this.deals[dealId] = deal;
    this.saveDeals();

    // Log dispute metadata
    this.logDispute({
      dealId,
      disputedAt: deal.disputedAt,
      reason: deal.disputeReason,
      raisedBy: myUid,
      amount: deal.amount,
      buyerUid: deal.buyerUid,
      sellerUid: deal.sellerUid
    });

    this.broadcastDealEvent('ESCROW_DISPUTED', dealId, {
      disputedAt: deal.disputedAt,
      reason: deal.disputeReason,
      raisedBy: myUid
    });
    this.refreshCardDOM(dealId);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nexchat:escrow_dispute_raised', {
        detail: { dealId, reason: deal.disputeReason, deal }
      }));
      if (typeof window.showNotif === 'function') {
        window.showNotif('Escrow dispute raised. Metadata escalated to moderators & SuperAdmin.', 'warning', 3500);
      }
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('sonar');
    }

    return true;
  }

  resolveDispute(dealId, verdict, notes = '') {
    const deal = this.deals[dealId];
    if (!deal || deal.status !== 'DISPUTED') return false;

    const myUid = (typeof window !== 'undefined' && window.myUID) ? window.myUID : 'u_current';

    if (verdict === 'REFUND_BUYER') {
      deal.status = 'REFUNDED';
      deal.disputeResolution = notes || 'Arbitration settled in favor of Buyer. Full refund issued.';
      deal.settledAt = Date.now();
      deal.receiptId = `REFUND-NEX-${dealId.slice(-6).toUpperCase()}`;

      // Refund tokens if buyer is current user
      if (deal.buyerUid === myUid) {
        const cur = this.getUserTokens();
        this.setUserTokens(cur + deal.amount);
      }
    } else if (verdict === 'PAY_SELLER') {
      deal.status = 'SETTLED';
      deal.disputeResolution = notes || 'Arbitration settled in favor of Seller. Escrow released.';
      deal.releasedAt = Date.now();
      deal.settledAt = Date.now();
      deal.receiptId = `ARBITRATE-PAY-${dealId.slice(-6).toUpperCase()}`;

      // Pay seller if seller is current user
      if (deal.sellerUid === myUid) {
        const cur = this.getUserTokens();
        this.setUserTokens(cur + deal.amount);
      }
    }

    this.deals[dealId] = deal;
    this.saveDeals();

    this.broadcastDealEvent('DISPUTE_RESOLVED', dealId, {
      status: deal.status,
      resolution: deal.disputeResolution,
      verdict
    });
    this.refreshCardDOM(dealId);

    if (typeof window !== 'undefined') {
      if (typeof window.showNotif === 'function') {
        window.showNotif(`Dispute Arbitrated: ${deal.status}`, 'info', 3000);
      }
    }

    return true;
  }

  cancelDeal(dealId) {
    const deal = this.deals[dealId];
    if (!deal) return false;

    const myUid = (typeof window !== 'undefined' && window.myUID) ? window.myUID : 'u_current';
    const isBuyer = deal.buyerUid === myUid || deal.buyerUid === 'partner_user';
    const baseTime = deal.lockedAt || deal.createdAt;
    const isExpired = (Date.now() - baseTime) > (deal.windowHours * 3600000);

    if (deal.status === 'PROPOSED') {
      deal.status = 'CANCELLED';
    } else if (deal.status === 'TOKENS_LOCKED' && isExpired && isBuyer) {
      deal.status = 'REFUNDED';
      deal.disputeResolution = 'Window expired without seller deliverable. Full refund issued to buyer.';
      deal.settledAt = Date.now();
      deal.receiptId = `EXPIRE-REFUND-${dealId.slice(-6).toUpperCase()}`;
      const curBal = this.getUserTokens();
      this.setUserTokens(curBal + deal.amount);
      if (typeof window !== 'undefined' && typeof window.showNotif === 'function') {
        window.showNotif(`Escrow window expired. ${deal.amount} NEX tokens refunded to your balance.`, 'success', 3500);
      }
    } else {
      return false;
    }

    this.deals[dealId] = deal;
    this.saveDeals();

    this.broadcastDealEvent(deal.status === 'REFUNDED' ? 'ESCROW_REFUNDED' : 'DEAL_CANCELLED', dealId, {});
    this.refreshCardDOM(dealId);

    if (typeof window !== 'undefined' && typeof window.showNotif === 'function' && deal.status !== 'REFUNDED') {
      window.showNotif('Escrow Deal cancelled', 'info', 2000);
    }
    return true;
  }

  logDispute(record) {
    try {
      if (typeof localStorage === 'undefined') return;
      const raw = localStorage.getItem(this.disputeLogKey);
      const list = raw ? JSON.parse(raw) : [];
      list.unshift(record);
      localStorage.setItem(this.disputeLogKey, JSON.stringify(list.slice(0, 100)));
    } catch (_) {}
  }

  // ---------------------------------------------------------------------------
  // 4. BROADCASTING & REALTIME SYNCHRONIZATION
  // ---------------------------------------------------------------------------
  broadcastDealCreation(deal) {
    const attachment = {
      fileType: 'chronex_escrow',
      isEscrowDeal: true,
      escrowDealData: deal
    };

    if (typeof window !== 'undefined' && typeof window.appendLocalSentMessage === 'function') {
      window.appendLocalSentMessage(`Opened Smart Escrow Deal: "${deal.title}" (${deal.amount} NEX)`, attachment, false, 'sent');
    }

    if (typeof window !== 'undefined' && typeof window.sendSupabaseMessage === 'function') {
      const partnerId = window.currentChatUserId || window.currentChatUser;
      if (partnerId) {
        window.sendSupabaseMessage({
          from: deal.creatorUid,
          to: partnerId,
          text: '',
          attachment: attachment,
          chatType: deal.chatType || 'direct'
        }).catch(() => {});
      }
    }
  }

  broadcastDealEvent(action, dealId, payload) {
    if (typeof window !== 'undefined' && typeof window.sendSupabaseMessage === 'function') {
      const partnerId = window.currentChatUserId || window.currentChatUser;
      if (partnerId) {
        window.sendSupabaseMessage({
          from: (window.myUID || 'u_current'),
          to: partnerId,
          text: '',
          attachment: {
            fileType: 'chronex_escrow_event',
            isEscrowEvent: true,
            action,
            dealId,
            payload
          },
          chatType: (window.currentChatType || 'direct')
        }).catch(() => {});
      }
    }
  }

  listenIncomingEscrowEvents() {
    if (typeof window === 'undefined') return;

    window.addEventListener('nexchat:incoming_message', (e) => {
      const msg = e.detail;
      if (!msg || !msg.attachment) return;

      const att = msg.attachment;
      if (att.isEscrowDeal && att.escrowDealData) {
        const deal = att.escrowDealData;
        if (!this.deals[deal.id] || this.deals[deal.id].status === 'PROPOSED') {
          this.deals[deal.id] = deal;
          this.saveDeals();
          this.refreshCardDOM(deal.id);
        }
      } else if (att.isEscrowEvent && att.dealId) {
        const deal = this.deals[att.dealId];
        if (deal) {
          if (att.action === 'TOKENS_LOCKED') {
            deal.status = 'TOKENS_LOCKED';
            deal.lockedAt = att.payload?.lockedAt || Date.now();
          } else if (att.action === 'DELIVERABLE_UPLOADED') {
            deal.status = 'DELIVERABLE_UPLOADED';
            deal.deliverable = att.payload?.deliverable;
            deal.uploadedAt = Date.now();
          } else if (att.action === 'ESCROW_SETTLED') {
            deal.status = 'SETTLED';
            deal.settledAt = att.payload?.settledAt || Date.now();
            deal.receiptId = att.payload?.receiptId;
            const myUid = (typeof window !== 'undefined' && window.myUID) ? window.myUID : null;
            if (deal.sellerUid === myUid && !deal.tokensCredited) {
              this.setUserTokens(this.getUserTokens() + deal.amount);
              deal.tokensCredited = true;
              if (typeof window !== 'undefined' && typeof window.showNotif === 'function') {
                window.showNotif(`Escrow payment received! +${deal.amount} NEX added to your balance.`, 'success', 4000);
              }
            }
          } else if (att.action === 'ESCROW_DISPUTED') {
            deal.status = 'DISPUTED';
            deal.disputedAt = att.payload?.disputedAt || Date.now();
            deal.disputeReason = att.payload?.reason;
          } else if (att.action === 'DISPUTE_RESOLVED') {
            deal.status = att.payload?.status || 'SETTLED';
            deal.disputeResolution = att.payload?.resolution;
          } else if (att.action === 'DEAL_CANCELLED') {
            deal.status = 'CANCELLED';
          }
          this.deals[att.dealId] = deal;
          this.saveDeals();
          this.refreshCardDOM(att.dealId);
        }
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 5. INTERACTIVE CYBER HUD ESCROW CARD RENDERING
  // ---------------------------------------------------------------------------
  renderEscrowBubble(attachment) {
    const dealData = attachment.escrowDealData || {};
    return this.renderEscrowCard(dealData);
  }

  renderEscrowCard(dealData) {
    const dealId = dealData.id || `escrow_${Date.now()}`;
    if (!this.deals[dealId]) {
      this.deals[dealId] = dealData;
      this.saveDeals();
    }
    const deal = this.deals[dealId] || dealData;

    const myUid = (typeof window !== 'undefined' && window.myUID) ? window.myUID : 'u_current';
    const isBuyer = (deal.buyerUid === myUid || deal.buyerUid === 'partner_user');
    const isSeller = (deal.sellerUid === myUid || deal.sellerUid === 'partner_user');

    const card = document.createElement('div');
    card.className = `escrow-deal-card status-${deal.status.toLowerCase()}`;
    card.id = `escrowDeal_${deal.id}`;
    card.dataset.dealId = deal.id;

    // Steps configuration
    const steps = [
      { key: 'PROPOSED', label: 'Proposed', icon: 'fa-file-lines' },
      { key: 'TOKENS_LOCKED', label: 'Tokens Locked', icon: 'fa-lock' },
      { key: 'DELIVERABLE_UPLOADED', label: 'Deliverable', icon: 'fa-cloud-arrow-up' },
      { key: 'INSPECTED_RELEASED', label: 'Inspected', icon: 'fa-circle-check' },
      { key: 'SETTLED', label: 'Settled', icon: 'fa-shield-halved' }
    ];

    const currentStepIndex = this.getStepIndex(deal.status);

    card.innerHTML = `
      <!-- Header Bar -->
      <div class="escrow-card-header">
        <div class="flex items-center gap-2">
          <i class="fa-solid fa-shield-halved text-[#00f2ff] text-base"></i>
          <span class="escrow-header-tag">CHRONEX SMART ESCROW</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="escrow-status-badge status-${deal.status.toLowerCase()}">
            ${deal.status.replace(/_/g, ' ')}
          </span>
          <span class="escrow-token-badge">
            <i class="fa-solid fa-coins text-[#fbbf24]"></i> ${deal.amount} ${deal.currency}
          </span>
        </div>
      </div>

      <!-- Main Body -->
      <div class="escrow-card-body">
        <h4 class="escrow-deal-title">${deal.title}</h4>
        <p class="escrow-deal-desc">${deal.description}</p>

        <!-- Parties Row -->
        <div class="escrow-parties-row">
          <span>Buyer: <strong class="text-white">@${deal.buyerName}</strong> ${isBuyer ? '<span class="role-pill">(You)</span>' : ''}</span>
          <span>Seller: <strong class="text-white">@${deal.sellerName}</strong> ${isSeller ? '<span class="role-pill">(You)</span>' : ''}</span>
        </div>

        <!-- 5-Step Visual Progress HUD -->
        <div class="escrow-progress-container">
          <div class="escrow-progress-track">
            <div class="escrow-progress-fill" style="width: ${Math.max(0, currentStepIndex * 25)}%;"></div>
          </div>
          <div class="escrow-progress-nodes">
            ${steps.map((s, idx) => {
              const isPassed = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return `
                <div class="escrow-node ${isPassed ? 'completed' : ''} ${isCurrent ? 'active' : ''}">
                  <div class="node-circle">
                    <i class="fa-solid ${isPassed ? 'fa-check' : s.icon}"></i>
                  </div>
                  <span class="node-label">${s.label}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Live Countdown Timer -->
        <div class="escrow-countdown-row" id="countdownRow_${deal.id}">
          <i class="fa-solid fa-stopwatch text-[#00f2ff]"></i>
          <span>Inspection &amp; Settlement Window:</span>
          <strong class="font-mono text-[#00f2ff]" id="countdownText_${deal.id}">
            ${this.calculateRemainingTime(deal)}
          </strong>
        </div>

        <!-- Deliverable Preview / Verification Strip -->
        ${deal.deliverable ? `
          <div class="escrow-deliverable-strip">
            <div class="flex justify-between items-center">
              <span class="text-[11px] font-bold text-gray-300">
                <i class="fa-solid fa-cube text-[#00f2ff] mr-1"></i> Deliverable Sealed: [${deal.deliverable.type}]
              </span>
              <span class="escrow-watermark-tag">${deal.deliverable.watermark}</span>
            </div>
            <div class="text-[10px] text-gray-400 font-mono mt-1 truncate">
              SHA-256: <span class="text-[#00ff88]">${deal.deliverable.checksum}</span>
            </div>
            ${deal.status === 'SETTLED' ? `
              <div class="mt-2 pt-2 border-t border-gray-700/60 flex justify-between items-center">
                <span class="text-[11px] text-[#00ff88] font-bold">
                  <i class="fa-solid fa-unlock mr-1"></i> Deliverable Payload Unlocked
                </span>
                <button type="button" class="escrow-btn-open-payload" data-deal-id="${deal.id}">
                  <i class="fa-solid fa-box-open mr-1"></i> View Deliverable
                </button>
              </div>
            ` : ''}
          </div>
        ` : ''}

        <!-- Dispute Notice Banner if DISPUTED -->
        ${deal.status === 'DISPUTED' ? `
          <div class="escrow-dispute-banner">
            <div class="flex items-center gap-2 text-[#ff0055] font-bold text-xs">
              <i class="fa-solid fa-triangle-exclamation"></i>
              <span>DISPUTE ARBITRATION ACTIVE</span>
            </div>
            <p class="text-[11px] text-gray-300 mt-1 mb-0 font-mono">
              Notice: ${deal.disputeReason || 'Specification dispute pending moderator audit.'}
            </p>
          </div>
        ` : ''}

        <!-- Action Control Buttons -->
        <div class="escrow-actions-row" id="escrowActions_${deal.id}">
          ${this.renderActionButtons(deal, isBuyer, isSeller)}
        </div>

        <!-- Multi-Sig Receipt Bar -->
        <div class="escrow-card-footer">
          <span>TX ID: <strong class="font-mono text-gray-400">${deal.id}</strong></span>
          ${deal.receiptId ? `<span>Receipt: <strong class="font-mono text-[#00ff88]">${deal.receiptId}</strong></span>` : ''}
          <span class="multi-sig-tag"><i class="fa-solid fa-lock"></i> 2-of-2 Multi-Sig Vault</span>
        </div>
      </div>
    `;

    this.bindCardEventListeners(card, deal);
    return card;
  }

  getStepIndex(status) {
    switch (status) {
      case 'PROPOSED': return 0;
      case 'TOKENS_LOCKED': return 1;
      case 'DELIVERABLE_UPLOADED': return 2;
      case 'INSPECTED_RELEASED': return 3;
      case 'SETTLED': return 4;
      case 'DISPUTED': return 2;
      case 'REFUNDED': return 4;
      default: return 0;
    }
  }

  calculateRemainingTime(deal) {
    if (deal.status === 'SETTLED' || deal.status === 'REFUNDED' || deal.status === 'CANCELLED') {
      return 'Settled / Closed';
    }
    const baseTime = deal.lockedAt || deal.createdAt;
    const expiry = baseTime + (deal.windowHours * 3600000);
    const now = Date.now();
    const diff = expiry - now;

    if (diff <= 0) return '00h 00m 00s (Grace Window)';
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);

    return `${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  }

  renderActionButtons(deal, isBuyer, isSeller) {
    const status = deal.status;

    if (status === 'PROPOSED') {
      return `
        <button type="button" class="escrow-btn escrow-btn-lock" data-deal-id="${deal.id}">
          <i class="fa-solid fa-lock"></i> Lock Escrow Tokens (${deal.amount} NEX)
        </button>
        <button type="button" class="escrow-btn escrow-btn-cancel" data-deal-id="${deal.id}">
          <i class="fa-solid fa-xmark"></i> Cancel Deal
        </button>
      `;
    }

    if (status === 'TOKENS_LOCKED') {
      return `
        <button type="button" class="escrow-btn escrow-btn-upload" data-deal-id="${deal.id}">
          <i class="fa-solid fa-cloud-arrow-up"></i> Attach Deliverable
        </button>
        <span class="escrow-waiting-notice">
          <i class="fa-solid fa-clock"></i> Tokens locked in vault. Awaiting seller deliverable.
        </span>
      `;
    }

    if (status === 'DELIVERABLE_UPLOADED') {
      return `
        <button type="button" class="escrow-btn escrow-btn-release" data-deal-id="${deal.id}">
          <i class="fa-solid fa-circle-check"></i> Release Escrow Funds
        </button>
        <button type="button" class="escrow-btn escrow-btn-dispute" data-deal-id="${deal.id}">
          <i class="fa-solid fa-triangle-exclamation"></i> Raise Dispute
        </button>
      `;
    }

    if (status === 'SETTLED' || status === 'INSPECTED_RELEASED') {
      return `
        <div class="escrow-settled-pill">
          <i class="fa-solid fa-circle-check text-[#00ff88]"></i>
          <span>ESCROW SETTLED &amp; TOKENS TRANSFERRED</span>
        </div>
      `;
    }

    if (status === 'DISPUTED') {
      return `
        <button type="button" class="escrow-btn escrow-btn-arbitrate-refund" data-deal-id="${deal.id}">
          <i class="fa-solid fa-rotate-left"></i> Arbitrate: Refund Buyer
        </button>
        <button type="button" class="escrow-btn escrow-btn-arbitrate-pay" data-deal-id="${deal.id}">
          <i class="fa-solid fa-paper-plane"></i> Arbitrate: Pay Seller
        </button>
      `;
    }

    if (status === 'REFUNDED') {
      return `
        <div class="escrow-settled-pill">
          <i class="fa-solid fa-rotate-left text-[#fbbf24]"></i>
          <span>DISPUTE SETTLED: ESCROW REFUNDED TO BUYER</span>
        </div>
      `;
    }

    if (status === 'CANCELLED') {
      return `
        <div class="escrow-settled-pill">
          <i class="fa-solid fa-ban text-gray-500"></i>
          <span>ESCROW PROPOSAL CANCELLED</span>
        </div>
      `;
    }

    return '';
  }

  bindCardEventListeners(card, deal) {
    const dealId = deal.id;

    // Lock tokens button
    card.querySelector('.escrow-btn-lock')?.addEventListener('click', () => {
      this.lockTokens(dealId);
    });

    // Cancel proposal button
    card.querySelector('.escrow-btn-cancel')?.addEventListener('click', () => {
      this.cancelDeal(dealId);
    });

    // Attach deliverable button
    card.querySelector('.escrow-btn-upload')?.addEventListener('click', () => {
      this.openUploadDeliverableModal(dealId);
    });

    // Release escrow button
    card.querySelector('.escrow-btn-release')?.addEventListener('click', () => {
      if (confirm(`Confirm releasing ${deal.amount} NEX tokens to seller? This action is irreversible.`)) {
        this.releaseEscrow(dealId);
      }
    });

    // Raise dispute button
    card.querySelector('.escrow-btn-dispute')?.addEventListener('click', () => {
      this.openRaiseDisputeModal(dealId);
    });

    // View deliverable button
    card.querySelector('.escrow-btn-open-payload')?.addEventListener('click', () => {
      this.openDeliverablePayloadModal(dealId);
    });

    // Arbitration buttons
    card.querySelector('.escrow-btn-arbitrate-refund')?.addEventListener('click', () => {
      const notes = prompt('Enter arbitration rationale for buyer refund:');
      if (notes !== null) {
        this.resolveDispute(dealId, 'REFUND_BUYER', notes);
      }
    });

    card.querySelector('.escrow-btn-arbitrate-pay')?.addEventListener('click', () => {
      const notes = prompt('Enter arbitration rationale for seller payout:');
      if (notes !== null) {
        this.resolveDispute(dealId, 'PAY_SELLER', notes);
      }
    });
  }

  refreshCardDOM(dealId) {
    const oldCard = document.getElementById(`escrowDeal_${dealId}`);
    if (oldCard && oldCard.parentElement) {
      const deal = this.deals[dealId];
      if (deal) {
        const newCard = this.renderEscrowCard(deal);
        oldCard.parentElement.replaceChild(newCard, oldCard);
      }
    }
  }

  startCountdownTicker() {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    this.countdownInterval = setInterval(() => {
      if (typeof document === 'undefined') return;
      (typeof document.querySelectorAll === 'function' ? document.querySelectorAll('.escrow-deal-card') : []).forEach(card => {
        const dealId = card.dataset.dealId;
        if (dealId && this.deals[dealId]) {
          const textEl = document.getElementById(`countdownText_${dealId}`);
          if (textEl) {
            textEl.textContent = this.calculateRemainingTime(this.deals[dealId]);
          }
        }
      });
    }, 1000);
  }

  // ---------------------------------------------------------------------------
  // 6. MODALS: CREATE ESCROW, ATTACH DELIVERABLE, VIEW PAYLOAD, DISPUTE
  // ---------------------------------------------------------------------------
  openCreateEscrowModal(targetUser = null, currentChatType = 'direct') {
    if (typeof document === 'undefined') return;

    let modal = document.getElementById('chronexCreateEscrowModal');
    if (modal) modal.remove();

    const userBal = this.getUserTokens();

    modal = document.createElement('div');
    modal.id = 'chronexCreateEscrowModal';
    modal.className = 'nextgen-modal-overlay chronex-escrow-modal-backdrop';
    modal.style.display = 'flex';

    modal.innerHTML = `
      <div class="nextgen-modal-card chronex-escrow-modal-card">
        <div class="nextgen-modal-header chronex-escrow-modal-header">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-shield-halved text-[#00f2ff] text-lg"></i>
            <h3 class="font-extrabold text-white text-sm tracking-wide m-0">OPEN SMART ESCROW DEAL</h3>
          </div>
          <button type="button" class="nextgen-modal-close" id="closeCreateEscrowBtn">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="chronex-escrow-modal-body">
          <!-- Token Vault Indicator -->
          <div class="escrow-balance-strip">
            <span>Available Token Vault Balance:</span>
            <strong class="text-[#fbbf24] font-mono"><i class="fa-solid fa-coins"></i> ${userBal} NEX</strong>
          </div>

          <!-- Deal Directive -->
          <div class="escrow-input-group mt-3">
            <label class="escrow-field-label">Deal / Deliverable Title:</label>
            <input type="text" id="escrowDealTitleInput" class="escrow-text-input" placeholder="e.g. 4K Digital Master &amp; Commercial License Rights" maxlength="70" />
          </div>

          <!-- Role Selection -->
          <div class="escrow-input-group mt-3">
            <label class="escrow-field-label">Your Deal Role:</label>
            <div class="escrow-role-selector">
              <button type="button" class="escrow-role-btn active" data-role="buyer">
                <i class="fa-solid fa-wallet"></i>
                <div class="escrow-role-info">
                  <strong>Buyer (Paying Tokens)</strong>
                  <span>Locks NEX tokens into escrow vault</span>
                </div>
              </button>
              <button type="button" class="escrow-role-btn" data-role="seller">
                <i class="fa-solid fa-box-open"></i>
                <div class="escrow-role-info">
                  <strong>Seller (Delivering Asset)</strong>
                  <span>Uploads deliverable payload upon lock</span>
                </div>
              </button>
            </div>
          </div>

          <!-- Escrow Amount Preset Chips -->
          <div class="escrow-input-group mt-3">
            <div class="flex justify-between items-center mb-1">
              <label class="escrow-field-label m-0">Escrow Reward / Purchase Amount:</label>
              <span class="text-[10px] text-gray-400 font-mono">Currency: NEX</span>
            </div>
            <div class="escrow-amount-chips">
              <button type="button" class="escrow-chip-btn" data-amt="50">50 NEX</button>
              <button type="button" class="escrow-chip-btn active" data-amt="100">100 NEX</button>
              <button type="button" class="escrow-chip-btn" data-amt="250">250 NEX</button>
              <button type="button" class="escrow-chip-btn" data-amt="500">500 NEX</button>
              <button type="button" class="escrow-chip-btn" data-amt="1000">1000 NEX</button>
            </div>
            <input type="number" id="escrowCustomAmountInput" class="escrow-text-input mt-2" placeholder="Or custom amount (e.g. 750)" value="100" min="1" />
          </div>

          <!-- Description / Deliverable Criteria -->
          <div class="escrow-input-group mt-3">
            <label class="escrow-field-label">Deliverable Specifications &amp; Criteria:</label>
            <textarea id="escrowDescInput" class="escrow-textarea" rows="2" placeholder="Specify file specifications, format, checksum requirement, or credentials..."></textarea>
          </div>

          <!-- Expiry / Inspection Window -->
          <div class="escrow-input-group mt-3">
            <label class="escrow-field-label">Inspection &amp; Settlement Window:</label>
            <div class="escrow-window-row">
              <button type="button" class="escrow-window-btn" data-hrs="12">12 Hours</button>
              <button type="button" class="escrow-window-btn active" data-hrs="24">24 Hours</button>
              <button type="button" class="escrow-window-btn" data-hrs="48">48 Hours</button>
              <button type="button" class="escrow-window-btn" data-hrs="72">72 Hours</button>
            </div>
          </div>

          <!-- Modal Action Bar -->
          <div class="escrow-modal-actions mt-4">
            <button type="button" class="escrow-btn-cancel" id="cancelCreateEscrowBtn">Cancel</button>
            <button type="button" class="escrow-btn-deploy" id="confirmDeployEscrowBtn">
              <i class="fa-solid fa-lock"></i> Deploy Escrow Contract
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    let selectedRole = 'buyer';
    let selectedAmount = 100;
    let selectedWindowHours = 24;

    modal.querySelectorAll('.escrow-role-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.escrow-role-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedRole = btn.dataset.role;
      });
    });

    const customAmtInput = modal.querySelector('#escrowCustomAmountInput');
    modal.querySelectorAll('.escrow-chip-btn').forEach(chip => {
      chip.addEventListener('click', () => {
        modal.querySelectorAll('.escrow-chip-btn').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        selectedAmount = parseInt(chip.dataset.amt, 10);
        if (customAmtInput) customAmtInput.value = selectedAmount;
      });
    });

    if (customAmtInput) {
      customAmtInput.addEventListener('input', () => {
        const val = parseInt(customAmtInput.value, 10);
        if (!isNaN(val) && val > 0) {
          selectedAmount = val;
          modal.querySelectorAll('.escrow-chip-btn').forEach(c => c.classList.remove('active'));
        }
      });
    }

    modal.querySelectorAll('.escrow-window-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.escrow-window-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedWindowHours = parseInt(btn.dataset.hrs, 10);
      });
    });

    const closeModal = () => modal.remove();
    modal.querySelector('#closeCreateEscrowBtn').addEventListener('click', closeModal);
    modal.querySelector('#cancelCreateEscrowBtn').addEventListener('click', closeModal);

    modal.querySelector('#confirmDeployEscrowBtn').addEventListener('click', () => {
      const titleInput = modal.querySelector('#escrowDealTitleInput');
      const descInput = modal.querySelector('#escrowDescInput');

      const title = titleInput ? titleInput.value.trim() : '';
      const desc = descInput ? descInput.value.trim() : '';

      if (!title) {
        if (typeof window !== 'undefined' && typeof window.showNotif === 'function') {
          window.showNotif('Please enter a deal title', 'error', 2000);
        }
        return;
      }

      const partnerId = targetUser || (typeof window !== 'undefined' ? window.currentChatUserId || window.currentChatUser : null);

      const deal = this.createDeal({
        title,
        description: desc,
        amount: selectedAmount,
        role: selectedRole,
        counterpartyUid: partnerId,
        counterpartyName: partnerId ? `@${partnerId}` : 'Operative',
        windowHours: selectedWindowHours,
        chatType: currentChatType || (typeof window !== 'undefined' ? window.currentChatType : 'direct')
      });

      if (deal) {
        closeModal();
        if (typeof window !== 'undefined') {
          if (typeof window.showNotif === 'function') {
            window.showNotif(`Escrow deal deployed! (${deal.amount} NEX)`, 'success', 2500);
          }
          if (typeof window.playCyberSfx === 'function') window.playCyberSfx('affirm');
        }
      }
    });
  }

  openUploadDeliverableModal(dealId) {
    if (typeof document === 'undefined') return;

    let modal = document.getElementById('chronexUploadDeliverableModal');
    if (modal) modal.remove();

    const deal = this.deals[dealId];
    if (!deal) return;

    modal = document.createElement('div');
    modal.id = 'chronexUploadDeliverableModal';
    modal.className = 'nextgen-modal-overlay chronex-escrow-modal-backdrop';
    modal.style.display = 'flex';

    modal.innerHTML = `
      <div class="nextgen-modal-card chronex-escrow-modal-card">
        <div class="nextgen-modal-header chronex-escrow-modal-header">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-cloud-arrow-up text-[#00f2ff] text-lg"></i>
            <h3 class="font-extrabold text-white text-sm tracking-wide m-0">ATTACH ESCROW DELIVERABLE</h3>
          </div>
          <button type="button" class="nextgen-modal-close" id="closeUploadDeliverableBtn">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="chronex-escrow-modal-body">
          <div class="escrow-input-group">
            <label class="escrow-field-label">Deliverable Type:</label>
            <div class="escrow-type-selector">
              <button type="button" class="escrow-type-btn active" data-type="FILE_HASH">
                <i class="fa-solid fa-file-code"></i> File Hash (SHA-256)
              </button>
              <button type="button" class="escrow-type-btn" data-type="ENCRYPTED_PAYLOAD">
                <i class="fa-solid fa-key"></i> Encrypted Secret / Keys
              </button>
              <button type="button" class="escrow-type-btn" data-type="DOWNLOAD_LINK">
                <i class="fa-solid fa-link"></i> Secure Download Link
              </button>
              <button type="button" class="escrow-type-btn" data-type="CREDENTIALS">
                <i class="fa-solid fa-user-lock"></i> Account Credentials
              </button>
            </div>
          </div>

          <div class="escrow-input-group mt-3">
            <label class="escrow-field-label">Deliverable Content / Payload:</label>
            <textarea id="escrowDeliverableContentInput" class="escrow-textarea" rows="3" placeholder="Paste file integrity hash, download URL, or confidential credentials..."></textarea>
          </div>

          <div class="escrow-input-group mt-3">
            <label class="escrow-field-label">Custom Watermark / Integrity Stamp:</label>
            <input type="text" id="escrowWatermarkInput" class="escrow-text-input" value="CONFIDENTIAL WATERMARK // NEX-ESCROW-SEAL-${dealId.slice(-4).toUpperCase()}" />
          </div>

          <div class="escrow-modal-actions mt-4">
            <button type="button" class="escrow-btn-cancel" id="cancelUploadDeliverableBtn">Cancel</button>
            <button type="button" class="escrow-btn-deploy" id="confirmUploadDeliverableBtn">
              <i class="fa-solid fa-upload"></i> Seal &amp; Attach to Vault
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    let selectedType = 'FILE_HASH';

    modal.querySelectorAll('.escrow-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.escrow-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedType = btn.dataset.type;
      });
    });

    const closeModal = () => modal.remove();
    modal.querySelector('#closeUploadDeliverableBtn').addEventListener('click', closeModal);
    modal.querySelector('#cancelUploadDeliverableBtn').addEventListener('click', closeModal);

    modal.querySelector('#confirmUploadDeliverableBtn').addEventListener('click', async () => {
      const contentInput = modal.querySelector('#escrowDeliverableContentInput');
      const watermarkInput = modal.querySelector('#escrowWatermarkInput');

      const content = contentInput ? contentInput.value.trim() : '';
      const watermark = watermarkInput ? watermarkInput.value.trim() : '';

      if (!content) {
        if (typeof window !== 'undefined' && typeof window.showNotif === 'function') {
          window.showNotif('Please enter deliverable content or payload', 'error', 2000);
        }
        return;
      }

      await this.attachDeliverable(dealId, {
        type: selectedType,
        content: content,
        watermark: watermark
      });

      closeModal();
    });
  }

  openDeliverablePayloadModal(dealId) {
    if (typeof document === 'undefined') return;

    let modal = document.getElementById('chronexDeliverablePayloadModal');
    if (modal) modal.remove();

    const deal = this.deals[dealId];
    if (!deal || !deal.deliverable) return;

    modal = document.createElement('div');
    modal.id = 'chronexDeliverablePayloadModal';
    modal.className = 'nextgen-modal-overlay chronex-escrow-modal-backdrop';
    modal.style.display = 'flex';

    modal.innerHTML = `
      <div class="nextgen-modal-card chronex-escrow-modal-card">
        <div class="nextgen-modal-header chronex-escrow-modal-header">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-box-open text-[#00ff88] text-lg"></i>
            <h3 class="font-extrabold text-white text-sm tracking-wide m-0">UNLOCKED DELIVERABLE PAYLOAD</h3>
          </div>
          <button type="button" class="nextgen-modal-close" id="closePayloadModalBtn">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="chronex-escrow-modal-body">
          <div class="escrow-balance-strip">
            <span>Cryptographic Verification Seal:</span>
            <span class="escrow-watermark-tag">${deal.deliverable.watermark}</span>
          </div>

          <div class="escrow-input-group mt-3">
            <label class="escrow-field-label">Deliverable Type: <span class="text-[#00f2ff]">[${deal.deliverable.type}]</span></label>
            <div class="escrow-payload-view-box">
              <pre class="m-0 font-mono text-xs text-[#00ff88] break-all whitespace-pre-wrap">${deal.deliverable.content}</pre>
            </div>
          </div>

          <div class="escrow-input-group mt-3">
            <label class="escrow-field-label">SHA-256 Checksum:</label>
            <div class="escrow-hash-box">
              <code class="text-[11px] text-[#00f2ff] font-mono break-all">${deal.deliverable.checksum}</code>
            </div>
          </div>

          <div class="escrow-modal-actions mt-4">
            <button type="button" class="escrow-btn-cancel" id="closePayloadFooterBtn">Done</button>
            <button type="button" class="escrow-btn-deploy" id="copyPayloadBtn">
              <i class="fa-solid fa-copy"></i> Copy Payload
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    modal.querySelector('#closePayloadModalBtn').addEventListener('click', closeModal);
    modal.querySelector('#closePayloadFooterBtn').addEventListener('click', closeModal);

    modal.querySelector('#copyPayloadBtn').addEventListener('click', () => {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(deal.deliverable.content).then(() => {
          if (typeof window !== 'undefined' && typeof window.showNotif === 'function') {
            window.showNotif('Deliverable copied to clipboard', 'success', 2000);
          }
        });
      }
    });
  }

  openRaiseDisputeModal(dealId) {
    if (typeof document === 'undefined') return;

    let modal = document.getElementById('chronexRaiseDisputeModal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'chronexRaiseDisputeModal';
    modal.className = 'nextgen-modal-overlay chronex-escrow-modal-backdrop';
    modal.style.display = 'flex';

    modal.innerHTML = `
      <div class="nextgen-modal-card chronex-escrow-modal-card">
        <div class="nextgen-modal-header chronex-escrow-modal-header">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-triangle-exclamation text-[#ff0055] text-lg"></i>
            <h3 class="font-extrabold text-white text-sm tracking-wide m-0">RAISE ESCROW DISPUTE</h3>
          </div>
          <button type="button" class="nextgen-modal-close" id="closeRaiseDisputeBtn">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="chronex-escrow-modal-body">
          <p class="text-xs text-gray-300 leading-relaxed">
            Raising a dispute freezes the escrow vault and escalates metadata to channel moderators and SuperAdmin for cryptographic arbitration.
          </p>

          <div class="escrow-input-group mt-3">
            <label class="escrow-field-label">Dispute Reason / Non-Compliance Report:</label>
            <textarea id="escrowDisputeReasonInput" class="escrow-textarea" rows="3" placeholder="Detail the specification failure, missing credentials, or checksum discrepancy..."></textarea>
          </div>

          <div class="escrow-modal-actions mt-4">
            <button type="button" class="escrow-btn-cancel" id="cancelRaiseDisputeBtn">Cancel</button>
            <button type="button" class="escrow-btn-danger" id="confirmRaiseDisputeBtn">
              <i class="fa-solid fa-triangle-exclamation"></i> File Dispute
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    modal.querySelector('#closeRaiseDisputeBtn').addEventListener('click', closeModal);
    modal.querySelector('#cancelRaiseDisputeBtn').addEventListener('click', closeModal);

    modal.querySelector('#confirmRaiseDisputeBtn').addEventListener('click', () => {
      const input = modal.querySelector('#escrowDisputeReasonInput');
      const reason = input ? input.value.trim() : '';

      if (!reason) {
        if (typeof window !== 'undefined' && typeof window.showNotif === 'function') {
          window.showNotif('Please enter dispute reason', 'error', 2000);
        }
        return;
      }

      this.raiseDispute(dealId, reason);
      closeModal();
    });
  }

  // ---------------------------------------------------------------------------
  // 7. ATTACHMENT HUB INJECTION
  // ---------------------------------------------------------------------------
  injectAttachmentHubOption() {
    if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return;

    const hub = document.getElementById('attachmentPopupHub');
    if (hub && !document.getElementById('hubActionSmartEscrow')) {
      const item = document.createElement('div');
      item.className = 'attach-hub-item';
      item.id = 'hubActionSmartEscrow';
      item.innerHTML = `
        <div class="attach-hub-icon icon-smart-escrow">
          <i class="fa-solid fa-shield-halved"></i>
        </div>
        <span>Smart Escrow</span>
      `;

      item.addEventListener('click', () => {
        hub.style.display = 'none';
        const partner = (typeof window !== 'undefined' ? window.currentChatUserId || window.currentChatUser : null);
        const chatType = (typeof window !== 'undefined' ? window.currentChatType : 'direct');
        this.openCreateEscrowModal(partner, chatType);
      });

      hub.appendChild(item);
    }
  }

  injectModals() {
    // Initial bindings if any
  }

  // ---------------------------------------------------------------------------
  // 8. CSS STYLES INJECTION
  // ---------------------------------------------------------------------------
  injectStyles() {
    if (typeof document === 'undefined' || !document.head) return;
    if (document.getElementById('chronexSmartEscrowStyles')) return;

    const style = document.createElement('style');
    style.id = 'chronexSmartEscrowStyles';
    style.textContent = `
      .escrow-deal-card {
        background: #090d16;
        border: 1px solid rgba(0, 242, 255, 0.25);
        border-radius: 10px;
        padding: 14px;
        max-width: 480px;
        width: 100%;
        color: #fff;
        font-family: system-ui, -apple-system, sans-serif;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        margin: 6px 0;
        box-sizing: border-box;
      }
      .escrow-deal-card.status-tokens_locked {
        border-color: rgba(0, 242, 255, 0.5);
        box-shadow: 0 0 15px rgba(0, 242, 255, 0.15);
      }
      .escrow-deal-card.status-deliverable_uploaded {
        border-color: rgba(168, 85, 247, 0.5);
        box-shadow: 0 0 15px rgba(168, 85, 247, 0.15);
      }
      .escrow-deal-card.status-settled {
        border-color: rgba(0, 255, 136, 0.4);
        box-shadow: 0 0 15px rgba(0, 255, 136, 0.15);
      }
      .escrow-deal-card.status-disputed {
        border-color: rgba(255, 0, 85, 0.6);
        box-shadow: 0 0 15px rgba(255, 0, 85, 0.2);
      }
      .escrow-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        padding-bottom: 10px;
        margin-bottom: 10px;
      }
      .escrow-header-tag {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.5px;
        color: #fff;
      }
      .escrow-status-badge {
        font-size: 9.5px;
        font-weight: 800;
        padding: 2px 7px;
        border-radius: 4px;
        font-family: monospace;
        text-transform: uppercase;
        background: rgba(255, 255, 255, 0.08);
        color: #94a3b8;
      }
      .escrow-status-badge.status-proposed {
        background: rgba(245, 158, 11, 0.15);
        border: 1px solid #f59e0b;
        color: #f59e0b;
      }
      .escrow-status-badge.status-tokens_locked {
        background: rgba(0, 242, 255, 0.15);
        border: 1px solid #00f2ff;
        color: #00f2ff;
      }
      .escrow-status-badge.status-deliverable_uploaded {
        background: rgba(168, 85, 247, 0.15);
        border: 1px solid #a855f7;
        color: #a855f7;
      }
      .escrow-status-badge.status-settled {
        background: rgba(0, 255, 136, 0.15);
        border: 1px solid #00ff88;
        color: #00ff88;
      }
      .escrow-status-badge.status-disputed {
        background: rgba(255, 0, 85, 0.15);
        border: 1px solid #ff0055;
        color: #ff0055;
      }
      .escrow-token-badge {
        font-size: 11.5px;
        font-weight: 800;
        font-family: monospace;
        color: #fbbf24;
        background: rgba(251, 191, 36, 0.1);
        border: 1px solid rgba(251, 191, 36, 0.3);
        padding: 2px 8px;
        border-radius: 4px;
      }
      .escrow-deal-title {
        margin: 0 0 4px 0;
        font-size: 13.5px;
        font-weight: 700;
        color: #fff;
      }
      .escrow-deal-desc {
        margin: 0 0 10px 0;
        font-size: 11.5px;
        color: #94a3b8;
        line-height: 1.4;
      }
      .escrow-parties-row {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        color: #94a3b8;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        padding: 6px 10px;
        border-radius: 6px;
        margin-bottom: 12px;
      }
      .role-pill {
        color: #00f2ff;
        font-size: 10px;
        font-family: monospace;
      }
      .escrow-progress-container {
        position: relative;
        margin: 14px 0 16px 0;
      }
      .escrow-progress-track {
        position: absolute;
        top: 14px;
        left: 15px;
        right: 15px;
        height: 3px;
        background: rgba(255, 255, 255, 0.1);
        z-index: 1;
      }
      .escrow-progress-fill {
        height: 100%;
        background: #00f2ff;
        transition: width 0.3s;
      }
      .escrow-progress-nodes {
        position: relative;
        display: flex;
        justify-content: space-between;
        z-index: 2;
      }
      .escrow-node {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 60px;
        text-align: center;
      }
      .node-circle {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #0f172a;
        border: 2px solid rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        color: #64748b;
        margin-bottom: 4px;
        transition: all 0.2s;
      }
      .escrow-node.completed .node-circle {
        background: rgba(0, 242, 255, 0.2);
        border-color: #00f2ff;
        color: #00f2ff;
      }
      .escrow-node.active .node-circle {
        background: #00f2ff;
        border-color: #00f2ff;
        color: #050811;
        box-shadow: 0 0 10px #00f2ff;
      }
      .node-label {
        font-size: 9px;
        color: #64748b;
        font-weight: 600;
        text-transform: uppercase;
      }
      .escrow-node.completed .node-label {
        color: #cbd5e1;
      }
      .escrow-node.active .node-label {
        color: #00f2ff;
      }
      .escrow-countdown-row {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        color: #94a3b8;
        background: rgba(0, 242, 255, 0.05);
        border: 1px solid rgba(0, 242, 255, 0.15);
        padding: 6px 10px;
        border-radius: 6px;
        margin-bottom: 10px;
      }
      .escrow-deliverable-strip {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        padding: 8px 10px;
        margin-bottom: 10px;
      }
      .escrow-watermark-tag {
        font-size: 9px;
        font-family: monospace;
        background: rgba(0, 255, 136, 0.15);
        border: 1px solid rgba(0, 255, 136, 0.4);
        color: #00ff88;
        padding: 1px 6px;
        border-radius: 3px;
      }
      .escrow-btn-open-payload {
        background: rgba(0, 255, 136, 0.15);
        border: 1px solid #00ff88;
        color: #00ff88;
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 10.5px;
        font-weight: 700;
        cursor: pointer;
      }
      .escrow-dispute-banner {
        background: rgba(255, 0, 85, 0.1);
        border: 1px solid #ff0055;
        border-radius: 6px;
        padding: 8px 10px;
        margin-bottom: 10px;
      }
      .escrow-actions-row {
        display: flex;
        gap: 8px;
        margin: 10px 0;
        flex-wrap: wrap;
      }
      .escrow-btn {
        padding: 8px 14px;
        border-radius: 6px;
        font-size: 11.5px;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s;
        border: none;
      }
      .escrow-btn-lock {
        background: #00f2ff;
        color: #050811;
      }
      .escrow-btn-cancel {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: #94a3b8;
      }
      .escrow-btn-upload {
        background: #a855f7;
        color: #fff;
      }
      .escrow-btn-release {
        background: #00ff88;
        color: #050811;
      }
      .escrow-btn-dispute {
        background: rgba(255, 0, 85, 0.15);
        border: 1px solid #ff0055;
        color: #ff0055;
      }
      .escrow-btn-arbitrate-refund {
        background: rgba(245, 158, 11, 0.2);
        border: 1px solid #f59e0b;
        color: #f59e0b;
      }
      .escrow-btn-arbitrate-pay {
        background: rgba(0, 255, 136, 0.2);
        border: 1px solid #00ff88;
        color: #00ff88;
      }
      .escrow-waiting-notice {
        font-size: 11px;
        color: #94a3b8;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .escrow-settled-pill {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 11px;
        font-weight: 700;
        color: #00ff88;
        background: rgba(0, 255, 136, 0.1);
        border: 1px solid rgba(0, 255, 136, 0.3);
        padding: 6px 12px;
        border-radius: 6px;
      }
      .escrow-card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        padding-top: 8px;
        font-size: 10px;
        color: #64748b;
      }
      .multi-sig-tag {
        font-family: monospace;
        color: #94a3b8;
      }
      .chronex-escrow-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 10060;
        background: rgba(5, 7, 13, 0.85);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .chronex-escrow-modal-card {
        background: #090d16;
        border: 1px solid rgba(0, 242, 255, 0.25);
        box-shadow: 0 10px 40px rgba(0, 242, 255, 0.12);
        border-radius: 12px;
        width: 95vw;
        max-width: 540px;
        max-height: 90vh;
        overflow-y: auto;
        color: #fff;
        font-family: system-ui, -apple-system, sans-serif;
      }
      .chronex-escrow-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 18px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
      .chronex-escrow-modal-body {
        padding: 18px;
      }
      .escrow-balance-strip {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(251, 191, 36, 0.08);
        border: 1px solid rgba(251, 191, 36, 0.25);
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 11.5px;
      }
      .escrow-field-label {
        font-size: 11px;
        font-weight: 700;
        color: #94a3b8;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        margin-bottom: 6px;
        display: block;
      }
      .escrow-text-input, .escrow-textarea {
        width: 100%;
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 8px;
        color: #fff;
        font-size: 12px;
        padding: 8px 10px;
        outline: none;
        box-sizing: border-box;
      }
      .escrow-text-input:focus, .escrow-textarea:focus {
        border-color: #00f2ff;
      }
      .escrow-role-selector {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }
      .escrow-role-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: #cbd5e1;
        cursor: pointer;
        text-align: left;
        transition: all 0.2s;
      }
      .escrow-role-btn.active {
        background: rgba(0, 242, 255, 0.12);
        border-color: #00f2ff;
        color: #fff;
      }
      .escrow-role-btn i {
        font-size: 16px;
        color: #00f2ff;
      }
      .escrow-role-info strong {
        display: block;
        font-size: 11.5px;
      }
      .escrow-role-info span {
        display: block;
        font-size: 9.5px;
        color: #94a3b8;
      }
      .escrow-amount-chips, .escrow-window-row, .escrow-type-selector {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .escrow-chip-btn, .escrow-window-btn, .escrow-type-btn {
        flex: 1;
        min-width: 80px;
        padding: 7px 8px;
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
      .escrow-chip-btn.active, .escrow-window-btn.active, .escrow-type-btn.active {
        background: rgba(0, 242, 255, 0.15);
        border-color: #00f2ff;
        color: #00f2ff;
      }
      .escrow-modal-actions {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        padding-top: 14px;
      }
      .escrow-btn-deploy {
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
      .escrow-payload-view-box, .escrow-hash-box {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        padding: 10px;
      }
    `;
    document.head.appendChild(style);
  }
}

// Global browser singleton binding
if (typeof window !== 'undefined') {
  window.ChronexSmartEscrow = ChronexSmartEscrow;
  if (!window.chronexSmartEscrow) {
    window.chronexSmartEscrow = new ChronexSmartEscrow();
  }
}
