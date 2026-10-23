/**
 * NEXCHAT - Chat File Transfer, Tiered Limits, Rate Limiting & Message Deletion Manager
 * =====================================================================================
 * Capabilities:
 * 1. Tiered File Upload Limits:
 *    - Beginner / Standard / Free: 50 MB (5 uploads/min, 5s cooldown)
 *    - Pro Plan (X Blue): 100 MB (15 uploads/min, 2s cooldown)
 *    - Pro Master (Ultra): 150 MB (30 uploads/min, 1s cooldown)
 *    - Business Gold / VIP Sovereign: 200 MB (60 uploads/min, instant)
 *
 * 2. Sliding Window Upload Rate Limiter:
 *    - Burst prevention & DDoS mitigation
 *    - Graceful UI prompts with cooldown counter & upgrade recommendations
 *
 * 3. User-to-User Message Deletion:
 *    - Delete for Everyone (Firestore document purge / recalled tombstone)
 *    - Delete for Me (Firestore deletedFor array union & client cache purge)
 *    - Intuitive Cyberpunk confirmation modal
 *
 * 4. User-to-User Incident Reporting Integration:
 *    - Deep-linked reporting on individual messages and chat header
 *
 * STRICTLY ZERO EMOJIS: Vector icons (FontAwesome 6) and clean cyberpunk styling only.
 * WhatsApp Concierge: +234 905 434 5858
 */

(function () {
  'use strict';

  const WHATSAPP_HOTLINE = '2349054345858';
  const WHATSAPP_FORMATTED = '+234 905 434 5858';

  // ===================================================================
  // 1. TIER CONFIGURATION
  // ===================================================================

  const TIER_UPLOAD_SPECS = {
    TIER_BEGINNER: {
      key: 'TIER_BEGINNER',
      name: 'Beginner / Standard',
      maxMB: 50,
      rateLimitPerMin: 5,
      minCooldownSec: 5,
      badgeColor: '#10b981',
      badgeIcon: 'fa-circle-check',
      priceText: 'Free / $5',
      nextTierKey: 'TIER_PRO'
    },
    TIER_PRO: {
      key: 'TIER_PRO',
      name: 'Pro Plan (X Blue)',
      maxMB: 100,
      rateLimitPerMin: 15,
      minCooldownSec: 2,
      badgeColor: '#1d9bf0',
      badgeIcon: 'fa-circle-check',
      priceText: '$12 / 18,000 NGN',
      nextTierKey: 'TIER_PRO_MAX'
    },
    TIER_PRO_MAX: {
      key: 'TIER_PRO_MAX',
      name: 'Pro Master (Premium+ Ultra)',
      maxMB: 150,
      rateLimitPerMin: 30,
      minCooldownSec: 1,
      badgeColor: '#00f2ff',
      badgeIcon: 'fa-certificate',
      priceText: '$25 / 38,000 NGN',
      nextTierKey: 'TIER_BUSINESS_GOLD'
    },
    TIER_BUSINESS_GOLD: {
      key: 'TIER_BUSINESS_GOLD',
      name: 'Verified Business & VIP',
      maxMB: 200,
      rateLimitPerMin: 60,
      minCooldownSec: 0,
      badgeColor: '#ffd700',
      badgeIcon: 'fa-briefcase',
      priceText: '$50 / 75,000 NGN',
      nextTierKey: null
    }
  };

  // State for upload rate limiting
  const _uploadTimestamps = [];
  let _lastUploadTime = 0;

  class NexChatFileManager {
    constructor() {
      this.initModalStyles();
    }

    /**
     * Resolves the active user's verification badge and upload tier specs.
     */
    getUserUploadTierConfig() {
      try {
        let badge = null;
        let plan = '';

        if (window.currentUserData) {
          badge = window.currentUserData.verificationBadge;
          plan = (window.currentUserData.plan || '').toLowerCase();
        }

        if (!badge) {
          try {
            const storedUser = JSON.parse(localStorage.getItem('nexchat_user') || '{}');
            badge = storedUser.verificationBadge;
            plan = (storedUser.plan || '').toLowerCase();
          } catch (_) {}
        }

        if (!badge) {
          badge = localStorage.getItem('nex_user_verification_badge');
        }
        if (!plan) {
          plan = (localStorage.getItem('nex_user_plan') || '').toLowerCase();
        }

        // 1. VIP Sovereign / Business (200 MB)
        if (
          badge === 'TIER_SOVEREIGN_VIP' ||
          badge === 'TIER_APEX_PATRON' ||
          badge === 'TIER_BUSINESS_GOLD' ||
          plan === 'sovereign' ||
          plan === 'vip' ||
          plan === 'business'
        ) {
          return TIER_UPLOAD_SPECS.TIER_BUSINESS_GOLD;
        }

        // 2. Pro Master / Premium+ Ultra (150 MB)
        if (
          badge === 'TIER_PRO_MAX' ||
          plan === 'promax' ||
          plan === 'ultra' ||
          plan === 'master' ||
          plan === 'premium_plus'
        ) {
          return TIER_UPLOAD_SPECS.TIER_PRO_MAX;
        }

        // 3. Pro Plan (100 MB)
        if (
          badge === 'TIER_PRO' ||
          (window.currentUserData && window.currentUserData.isVerified) ||
          plan === 'pro' ||
          plan === 'blue'
        ) {
          return TIER_UPLOAD_SPECS.TIER_PRO;
        }

        // 4. Default / Beginner (50 MB)
        return TIER_UPLOAD_SPECS.TIER_BEGINNER;
      } catch (err) {
        console.warn('[NEX FILE MGR] Error resolving user tier:', err);
        return TIER_UPLOAD_SPECS.TIER_BEGINNER;
      }
    }

    /**
     * Validates a candidate file against the user's tier size limit and security filters.
     */
    validateFileAttachment(file) {
      if (!file) return { ok: false, reason: 'No file selected' };

      const tierConfig = this.getUserUploadTierConfig();
      const maxBytes = tierConfig.maxMB * 1024 * 1024;
      const fileBytes = file.size || 0;
      const fileSizeMB = (fileBytes / (1024 * 1024)).toFixed(1);

      // Check file size against plan tier sequence
      if (fileBytes > maxBytes) {
        return {
          ok: false,
          isSizeLimit: true,
          fileSizeMB: parseFloat(fileSizeMB),
          maxMB: tierConfig.maxMB,
          tierConfig,
          reason: `File size (${fileSizeMB} MB) exceeds your ${tierConfig.name} limit of ${tierConfig.maxMB} MB.`
        };
      }

      // Check dangerous extensions
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      const dangerousExts = ['exe', 'bat', 'cmd', 'sh', 'vbs', 'msi', 'com', 'scr', 'ps1', 'jar', 'apk', 'pif', 'hta', 'vbe', 'wsf'];
      if (dangerousExts.includes(ext)) {
        return {
          ok: false,
          isSizeLimit: false,
          reason: `Executable (.${ext}) files are prohibited for client integrity and security.`
        };
      }

      return {
        ok: true,
        fileSizeMB: parseFloat(fileSizeMB),
        tierConfig
      };
    }

    /**
     * Sliding window rate limiter for file uploads.
     */
    checkUploadRateLimit() {
      const tierConfig = this.getUserUploadTierConfig();
      const now = Date.now();

      // 1. Cooldown interval check
      if (tierConfig.minCooldownSec > 0 && _lastUploadTime > 0) {
        const elapsedSec = (now - _lastUploadTime) / 1000;
        if (elapsedSec < tierConfig.minCooldownSec) {
          const waitTime = Math.ceil(tierConfig.minCooldownSec - elapsedSec);
          return {
            allowed: false,
            reason: `Upload cooldown active. Please wait ${waitTime}s before sending another file.`,
            retryAfterSec: waitTime,
            tierConfig
          };
        }
      }

      // 2. Sliding 60-second window
      const oneMinuteAgo = now - 60000;
      while (_uploadTimestamps.length > 0 && _uploadTimestamps[0] < oneMinuteAgo) {
        _uploadTimestamps.shift();
      }

      if (_uploadTimestamps.length >= tierConfig.rateLimitPerMin) {
        const oldest = _uploadTimestamps[0];
        const waitTime = Math.ceil((oldest + 60000 - now) / 1000);
        return {
          allowed: false,
          reason: `Rate limit reached (max ${tierConfig.rateLimitPerMin} uploads/min on ${tierConfig.name}). Please wait ${waitTime}s.`,
          retryAfterSec: waitTime,
          tierConfig
        };
      }

      return { allowed: true, tierConfig };
    }

    /**
     * Records a valid upload initiation.
     */
    recordUploadAttempt() {
      const now = Date.now();
      _uploadTimestamps.push(now);
      _lastUploadTime = now;
    }

    // ===================================================================
    // 2. TIER LIMIT MODAL (50 MB / 100 MB / 150 MB SEQUENCE)
    // ===================================================================

    showUploadLimitModal(fileSizeMB, currentTier) {
      let modal = document.getElementById('nexUploadTierLimitModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'nexUploadTierLimitModal';
        modal.className = 'nex-limit-modal-overlay';
        document.body.appendChild(modal);
      }

      const activeTierKey = currentTier ? currentTier.key : 'TIER_BEGINNER';

      modal.innerHTML = `
        <div class="nex-limit-modal-card">
          <div class="nex-limit-header">
            <div class="nex-limit-icon-halo">
              <i class="fa-solid fa-cloud-arrow-up"></i>
            </div>
            <div class="nex-limit-header-text">
              <h3>File Size Limit Reached</h3>
              <p>Your file (${fileSizeMB} MB) exceeds the ${currentTier.name} limit (${currentTier.maxMB} MB).</p>
            </div>
            <button type="button" class="nex-limit-close-btn" onclick="document.getElementById('nexUploadTierLimitModal').style.display='none';">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="nex-limit-body">
            <div class="nex-tier-sequence-grid">
              <!-- Tier 1: 50MB -->
              <div class="nex-tier-item ${activeTierKey === 'TIER_BEGINNER' ? 'current-tier' : ''}">
                <div class="tier-badge-pill" style="color: #10b981; border-color: rgba(16, 185, 129, 0.4);">
                  <i class="fa-solid fa-circle-check"></i> Standard
                </div>
                <div class="tier-size-spec">50 MB</div>
                <div class="tier-rate-spec">5 uploads/min</div>
                <div class="tier-price-spec">Standard Plan</div>
                ${activeTierKey === 'TIER_BEGINNER' ? '<span class="tier-active-tag"><i class="fa-solid fa-check"></i> Current</span>' : ''}
              </div>

              <!-- Tier 2: 100MB Pro Plan -->
              <div class="nex-tier-item highlight-pro ${activeTierKey === 'TIER_PRO' ? 'current-tier' : ''}">
                <div class="tier-badge-pill" style="color: #1d9bf0; border-color: rgba(29, 155, 240, 0.4);">
                  <i class="fa-solid fa-circle-check"></i> Pro Plan
                </div>
                <div class="tier-size-spec" style="color: #1d9bf0;">100 MB</div>
                <div class="tier-rate-spec">15 uploads/min &bull; 2s</div>
                <div class="tier-price-spec">$12 / 18,000 NGN</div>
                <button type="button" class="btn-tier-upgrade btn-pro" onclick="window.NexChatFileManager.handleUpgradePlan('TIER_PRO')">
                  <i class="fa-solid fa-bolt"></i> Upgrade 100MB
                </button>
              </div>

              <!-- Tier 3: 150MB Pro Master -->
              <div class="nex-tier-item highlight-promax ${activeTierKey === 'TIER_PRO_MAX' ? 'current-tier' : ''}">
                <div class="tier-badge-pill" style="color: #00f2ff; border-color: rgba(0, 242, 255, 0.4);">
                  <i class="fa-solid fa-certificate"></i> Pro Master
                </div>
                <div class="tier-size-spec" style="color: #00f2ff;">150 MB</div>
                <div class="tier-rate-spec">30 uploads/min &bull; 1s</div>
                <div class="tier-price-spec">$25 / 38,000 NGN</div>
                <button type="button" class="btn-tier-upgrade btn-promax" onclick="window.NexChatFileManager.handleUpgradePlan('TIER_PRO_MAX')">
                  <i class="fa-solid fa-crown"></i> Upgrade 150MB
                </button>
              </div>

              <!-- Tier 4: 200MB VIP Sovereign -->
              <div class="nex-tier-item ${activeTierKey === 'TIER_BUSINESS_GOLD' ? 'current-tier' : ''}">
                <div class="tier-badge-pill" style="color: #ffd700; border-color: rgba(255, 215, 0, 0.4);">
                  <i class="fa-solid fa-briefcase"></i> VIP Sovereign
                </div>
                <div class="tier-size-spec" style="color: #ffd700;">200 MB</div>
                <div class="tier-rate-spec">60 uploads/min &bull; 0s</div>
                <div class="tier-price-spec">$50 / 75,000 NGN</div>
                <button type="button" class="btn-tier-upgrade btn-vip" onclick="window.NexChatFileManager.handleUpgradePlan('TIER_BUSINESS_GOLD')">
                  <i class="fa-solid fa-star"></i> Enterprise
                </button>
              </div>
            </div>

            <div class="nex-limit-concierge-strip">
              <i class="fa-solid fa-headset" style="color: #25D366; font-size: 15px;"></i>
              <span>Instant Activation via WhatsApp Concierge: <strong>${WHATSAPP_FORMATTED}</strong></span>
              <a href="https://wa.me/${WHATSAPP_HOTLINE}?text=HELLO%20NEXCHAT%20SUPPORT,%20I%20WANT%20TO%20UPGRADE%20MY%20FILE%20UPLOAD%20LIMIT" target="_blank" class="btn-whatsapp-pill">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> Chat
              </a>
            </div>
          </div>
        </div>
      `;

      modal.style.display = 'flex';
      modal.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
      };
    }

    handleUpgradePlan(tierKey) {
      const modal = document.getElementById('nexUploadTierLimitModal');
      if (modal) modal.style.display = 'none';

      // 1. If Creator store exists on window or page, trigger it
      if (window.NexCreatorStore && typeof window.NexCreatorStore.openStoreModal === 'function') {
        window.NexCreatorStore.openStoreModal();
        return;
      }

      // 2. Direct order via WhatsApp Payment Concierge
      const tierInfo = TIER_UPLOAD_SPECS[tierKey] || TIER_UPLOAD_SPECS.TIER_PRO;
      const orderText = `HELLO DEMON ALEX\n\nI WANT TO UPGRADE MY UPLOAD LIMIT & BADGE:\nPlan: ${tierInfo.name}\nMax File Size: ${tierInfo.maxMB} MB\nPrice: ${tierInfo.priceText}\nHotline: ${WHATSAPP_FORMATTED}`;
      const waUrl = `https://wa.me/${WHATSAPP_HOTLINE}?text=${encodeURIComponent(orderText)}`;
      window.open(waUrl, '_blank');
    }

    // ===================================================================
    // 3. USER-TO-USER MESSAGE DELETION SYSTEM
    // ===================================================================

    /**
     * Opens the confirmation dialog for deleting a message.
     */
    openDeleteMessageModal(msg, isOwn, onComplete) {
      if (!msg) return;

      let modal = document.getElementById('nexDeleteMessageModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'nexDeleteMessageModal';
        modal.className = 'nex-delete-modal-overlay';
        document.body.appendChild(modal);
      }

      const snippet = msg.text
        ? (msg.text.length > 90 ? msg.text.substring(0, 90) + '...' : msg.text)
        : (msg.attachment ? (msg.attachment.fileName || 'Attachment file') : 'Selected Message');

      modal.innerHTML = `
        <div class="nex-delete-modal-card">
          <div class="nex-delete-header">
            <div class="nex-delete-icon-halo">
              <i class="fa-solid fa-trash-can"></i>
            </div>
            <div>
              <h3>Delete Message?</h3>
              <p>Choose how you want this message removed from the conversation.</p>
            </div>
          </div>

          <div class="nex-delete-preview-box">
            <span class="preview-author">${isOwn ? 'You' : 'Sender'}:</span>
            <span class="preview-text">"${this.escapeHtml(snippet)}"</span>
          </div>

          <div class="nex-delete-actions">
            ${isOwn ? `
              <button type="button" class="btn-delete-opt btn-delete-everyone" id="btnConfirmDeleteEveryone">
                <i class="fa-solid fa-users"></i>
                <div class="btn-text">
                  <strong>Delete for Everyone</strong>
                  <small>Erases this message for all participants</small>
                </div>
              </button>
            ` : ''}

            <button type="button" class="btn-delete-opt btn-delete-forme" id="btnConfirmDeleteForMe">
              <i class="fa-solid fa-eye-slash"></i>
              <div class="btn-text">
                <strong>Delete for Me</strong>
                <small>Removes this message from your device only</small>
              </div>
            </button>

            <button type="button" class="btn-delete-cancel" id="btnCancelDeleteMessage">
              Cancel
            </button>
          </div>
        </div>
      `;

      modal.style.display = 'flex';

      const closeModal = () => {
        modal.style.display = 'none';
      };

      modal.onclick = (e) => {
        if (e.target === modal) closeModal();
      };

      modal.querySelector('#btnCancelDeleteMessage')?.addEventListener('click', closeModal);

      // Handle Delete for Everyone
      const everyoneBtn = modal.querySelector('#btnConfirmDeleteEveryone');
      if (everyoneBtn) {
        everyoneBtn.addEventListener('click', async () => {
          closeModal();
          await this.executeDeleteForEveryone(msg);
          if (typeof onComplete === 'function') onComplete();
        });
      }

      // Handle Delete for Me
      const forMeBtn = modal.querySelector('#btnConfirmDeleteForMe');
      if (forMeBtn) {
        forMeBtn.addEventListener('click', async () => {
          closeModal();
          await this.executeDeleteForMe(msg);
          if (typeof onComplete === 'function') onComplete();
        });
      }
    }

    /**
     * Executes Delete for Everyone: Purges Firestore doc or marks it recalled tombstone.
     */
    async executeDeleteForEveryone(msg) {
      if (!msg || !msg.docId) {
        if (typeof window.showNotif === 'function') window.showNotif('Unable to resolve message ID', 'error');
        return;
      }

      const docId = msg.docId;
      const isGroup = window.currentChatType === 'group';
      const collectionName = isGroup ? 'groupMessages' : 'messages';

      try {
        if (typeof window.showNotif === 'function') window.showNotif('Deleting message for everyone...', 'info', 1200);

        // Optimistic DOM removal
        const wrapper = document.querySelector(`[data-doc-id="${docId}"]`) ||
                        Array.from(document.querySelectorAll('.message-wrapper')).find(w => w.innerHTML.includes(docId));
        if (wrapper) {
          wrapper.style.transition = 'opacity 0.25s, transform 0.25s';
          wrapper.style.opacity = '0';
          wrapper.style.transform = 'scale(0.95)';
          setTimeout(() => wrapper.remove(), 260);
        }

        // Import firestore dynamically or via global window.firebase / window.db
        if (typeof window.deleteMessageFromFirestore === 'function') {
          await window.deleteMessageFromFirestore(collectionName, docId, true);
        } else {
          // Direct fallback call via event
          document.dispatchEvent(new CustomEvent('nexDeleteMessageRequest', {
            detail: { docId, collectionName, forEveryone: true }
          }));
        }

        if (typeof window.showNotif === 'function') window.showNotif('Message deleted for everyone', 'success', 1800);
      } catch (err) {
        console.error('[NEX FILE MGR] Error deleting message for everyone:', err);
        if (typeof window.showNotif === 'function') window.showNotif('Failed to delete message: ' + (err.message || 'Network error'), 'error');
      }
    }

    /**
     * Executes Delete for Me: Adds user UID to deletedFor array.
     */
    async executeDeleteForMe(msg) {
      if (!msg || !msg.docId) return;

      const docId = msg.docId;
      const isGroup = window.currentChatType === 'group';
      const collectionName = isGroup ? 'groupMessages' : 'messages';

      try {
        // Optimistic DOM removal
        const wrapper = document.querySelector(`[data-doc-id="${docId}"]`) ||
                        Array.from(document.querySelectorAll('.message-wrapper')).find(w => w.innerHTML.includes(docId));
        if (wrapper) {
          wrapper.style.transition = 'opacity 0.25s, transform 0.25s';
          wrapper.style.opacity = '0';
          setTimeout(() => wrapper.remove(), 260);
        }

        // Cache locally in localStorage so it stays hidden even offline
        try {
          const localHidden = JSON.parse(localStorage.getItem('nex_hidden_msg_ids') || '[]');
          if (!localHidden.includes(docId)) {
            localHidden.push(docId);
            localStorage.setItem('nex_hidden_msg_ids', JSON.stringify(localHidden.slice(-500)));
          }
        } catch (_) {}

        // Dispatch delete request to chat.js listener
        document.dispatchEvent(new CustomEvent('nexDeleteMessageRequest', {
          detail: { docId, collectionName, forEveryone: false }
        }));

        if (typeof window.showNotif === 'function') window.showNotif('Message removed for you', 'success', 1500);
      } catch (err) {
        console.error('[NEX FILE MGR] Error deleting message for me:', err);
      }
    }

    /**
     * Helper to verify if a message ID is marked hidden locally.
     */
    isMessageHiddenLocally(docId) {
      if (!docId) return false;
      try {
        const localHidden = JSON.parse(localStorage.getItem('nex_hidden_msg_ids') || '[]');
        return localHidden.includes(docId);
      } catch (_) {
        return false;
      }
    }

    escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    // ===================================================================
    // 4. MODAL STYLES (Cyberpunk Dark Aesthetics)
    // ===================================================================

    initModalStyles() {
      if (document.getElementById('nexChatFileManagerStyles')) return;
      const style = document.createElement('style');
      style.id = 'nexChatFileManagerStyles';
      style.textContent = `
        /* Overlay Backdrop */
        .nex-limit-modal-overlay,
        .nex-delete-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(5, 8, 17, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 999999;
          display: none;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: nexFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes nexFadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }

        /* Modal Cards */
        .nex-limit-modal-card,
        .nex-delete-modal-card {
          background: #0d121d;
          border: 1px solid rgba(0, 255, 102, 0.25);
          border-radius: 20px;
          width: 100%;
          max-width: 600px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 255, 102, 0.1);
          color: #f1f5f9;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          overflow: hidden;
        }

        .nex-delete-modal-card {
          max-width: 440px;
          border-color: rgba(239, 68, 68, 0.3);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(239, 68, 68, 0.12);
        }

        /* Headers */
        .nex-limit-header,
        .nex-delete-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 20px 22px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          position: relative;
        }

        .nex-limit-icon-halo {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(0, 242, 255, 0.12);
          border: 1px solid rgba(0, 242, 255, 0.35);
          color: #00f2ff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .nex-delete-icon-halo {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #ef4444;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
          flex-shrink: 0;
        }

        .nex-limit-header-text h3,
        .nex-delete-header h3 {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
          color: #ffffff;
        }

        .nex-limit-header-text p,
        .nex-delete-header p {
          margin: 3px 0 0 0;
          font-size: 12.5px;
          color: #94a3b8;
        }

        .nex-limit-close-btn {
          position: absolute;
          top: 18px;
          right: 18px;
          background: none;
          border: none;
          color: #64748b;
          font-size: 18px;
          cursor: pointer;
          transition: color 0.15s;
        }
        .nex-limit-close-btn:hover { color: #f1f5f9; }

        /* Tier Sequence Grid */
        .nex-limit-body {
          padding: 20px 22px;
        }

        .nex-tier-sequence-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        @media (max-width: 540px) {
          .nex-tier-sequence-grid { grid-template-columns: 1fr; }
        }

        .nex-tier-item {
          background: #111723;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          position: relative;
          transition: all 0.2s ease;
        }

        .nex-tier-item.current-tier {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.06);
        }

        .nex-tier-item.highlight-pro {
          border-color: rgba(29, 155, 240, 0.35);
          background: rgba(29, 155, 240, 0.05);
        }

        .nex-tier-item.highlight-promax {
          border-color: rgba(0, 242, 255, 0.35);
          background: rgba(0, 242, 255, 0.05);
        }

        .tier-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          border: 1px solid;
          border-radius: 9999px;
          padding: 2px 8px;
          width: fit-content;
        }

        .tier-size-spec {
          font-size: 22px;
          font-weight: 800;
          color: #f1f5f9;
        }

        .tier-rate-spec {
          font-size: 11.5px;
          color: #94a3b8;
        }

        .tier-price-spec {
          font-size: 11.5px;
          font-weight: 600;
          color: #cbd5e1;
        }

        .tier-active-tag {
          font-size: 10.5px;
          font-weight: 700;
          color: #10b981;
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .btn-tier-upgrade {
          margin-top: 8px;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.15s ease;
        }

        .btn-pro {
          background: #1d9bf0;
          color: #ffffff;
        }
        .btn-pro:hover {
          background: #1a8cd8;
          box-shadow: 0 4px 14px rgba(29, 155, 240, 0.4);
        }

        .btn-promax {
          background: linear-gradient(135deg, #00f2ff, #0099ff);
          color: #050811;
        }
        .btn-promax:hover {
          box-shadow: 0 4px 14px rgba(0, 242, 255, 0.45);
        }

        .btn-vip {
          background: #ffd700;
          color: #050811;
        }
        .btn-vip:hover {
          background: #e6c200;
        }

        /* Concierge Strip */
        .nex-limit-concierge-strip {
          background: rgba(37, 211, 102, 0.08);
          border: 1px solid rgba(37, 211, 102, 0.25);
          border-radius: 10px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          color: #cbd5e1;
        }

        .nex-limit-concierge-strip span { flex: 1; }

        .btn-whatsapp-pill {
          background: #25D366;
          color: #050811;
          text-decoration: none;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        /* Delete Message Dialog */
        .nex-delete-preview-box {
          margin: 16px 20px;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 12.5px;
          line-height: 1.4;
          max-height: 90px;
          overflow-y: auto;
        }
        .preview-author {
          font-weight: 700;
          color: #00f2ff;
          margin-right: 6px;
        }
        .preview-text {
          color: #cbd5e1;
          font-style: italic;
        }

        .nex-delete-actions {
          padding: 0 20px 20px 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .btn-delete-opt {
          width: 100%;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: #141b27;
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
        }

        .btn-delete-opt i {
          font-size: 16px;
          width: 24px;
          text-align: center;
        }

        .btn-delete-everyone {
          border-color: rgba(239, 68, 68, 0.35);
          background: rgba(239, 68, 68, 0.08);
        }
        .btn-delete-everyone i { color: #ef4444; }
        .btn-delete-everyone:hover {
          background: rgba(239, 68, 68, 0.18);
          border-color: #ef4444;
        }

        .btn-delete-forme i { color: #94a3b8; }
        .btn-delete-forme:hover {
          background: #1a2233;
          border-color: rgba(255, 255, 255, 0.2);
        }

        .btn-delete-opt .btn-text strong {
          display: block;
          font-size: 13.5px;
        }
        .btn-delete-opt .btn-text small {
          font-size: 11px;
          color: #8b949e;
        }

        .btn-delete-cancel {
          background: none;
          border: none;
          color: #8b949e;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 10px;
          margin-top: 4px;
          transition: color 0.15s;
        }
        .btn-delete-cancel:hover { color: #ffffff; }

        /* Message hover actions enhancements */
        .msg-delete-trigger-btn {
          background: rgba(239, 68, 68, 0.12) !important;
          border: 1px solid rgba(239, 68, 68, 0.25) !important;
          color: #ef4444 !important;
          border-radius: 50% !important;
          width: 22px !important;
          height: 22px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 10px !important;
          cursor: pointer !important;
          margin-left: 2px !important;
          transition: all 0.15s ease !important;
        }
        .msg-delete-trigger-btn:hover {
          background: #ef4444 !important;
          color: #ffffff !important;
          transform: scale(1.15) !important;
        }

        .msg-report-trigger-btn {
          background: rgba(245, 158, 11, 0.12) !important;
          border: 1px solid rgba(245, 158, 11, 0.25) !important;
          color: #f59e0b !important;
          border-radius: 50% !important;
          width: 22px !important;
          height: 22px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 10px !important;
          cursor: pointer !important;
          margin-left: 2px !important;
          transition: all 0.15s ease !important;
        }
        .msg-report-trigger-btn:hover {
          background: #f59e0b !important;
          color: #000000 !important;
          transform: scale(1.15) !important;
        }

        .report-header-btn:hover {
          background: rgba(239, 68, 68, 0.2) !important;
          box-shadow: 0 0 12px rgba(239, 68, 68, 0.3) !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Export to window
  window.NexChatFileManager = new NexChatFileManager();
  window.chatFileManager = window.NexChatFileManager;
})();
