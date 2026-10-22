/**
 * NEXCHAT - Interactive Escrow Bounty Contracts Engine
 * In-chat decentralized task marketplace, cryptographic token escrow,
 * solution submission review, and automated escrow payout settlement.
 * STRICTLY NO EMOJIS: Clean cyberpunk typography and iconography.
 */

(function() {
  'use strict';

  const TOKEN_BAL_KEY = 'nexchat_user_tokens';
  const BOUNTY_CACHE_KEY = 'nexchat_bounty_contracts';

  class BountyContractsEngine {
    constructor() {
      this.selectedReward = 100;
      this.bounties = this.loadBounties();
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
      this.injectSubmissionModal();
      this.injectHubAction();
      this.listenSupabaseRealtime();
    }

    getUserTokens() {
      const stored = localStorage.getItem(TOKEN_BAL_KEY);
      return stored ? (parseInt(stored, 10) || 0) : 1000;
    }

    setUserTokens(amount) {
      localStorage.setItem(TOKEN_BAL_KEY, String(Math.max(0, amount)));
      window.dispatchEvent(new CustomEvent('nexchat:tokens_changed', { detail: { tokens: amount } }));
    }

    loadBounties() {
      try {
        const raw = localStorage.getItem(BOUNTY_CACHE_KEY);
        return raw ? JSON.parse(raw) : {};
      } catch (e) {
        return {};
      }
    }

    saveBounties() {
      try {
        localStorage.setItem(BOUNTY_CACHE_KEY, JSON.stringify(this.bounties));
      } catch (e) {}
    }

    injectModal() {
      if (document.getElementById('createBountyModal')) return;

      const modal = document.createElement('div');
      modal.id = 'createBountyModal';
      modal.className = 'cyber-modal-backdrop';
      modal.style.display = 'none';

      modal.innerHTML = `
        <div class="cyber-modal-window bounty-modal-window">
          <div class="cyber-modal-header">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-file-contract text-[#00ff66] text-lg"></i>
              <h3 class="font-bold text-white text-base">NEW ESCROW BOUNTY CONTRACT</h3>
              <span class="bounty-status-tag">LOCKED ESCROW</span>
            </div>
            <button type="button" class="cyber-modal-close" id="closeBountyModalBtn"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="bounty-modal-body">
            <p class="text-xs text-gray-300 text-center mb-3">
              Deploy an operative task contract into the channel. Bounty tokens are locked in smart escrow until you verify and release payment to the winning submission.
            </p>

            <div class="bounty-field-group">
              <label class="bounty-label">TASK DIRECTIVE / TITLE:</label>
              <input type="text" id="bountyTitleInput" class="bounty-text-input" placeholder="e.g. Identify vulnerability in payload auth pipeline" maxlength="80" />
            </div>

            <div class="bounty-field-group mt-3">
              <label class="bounty-label">CRITERIA & VERIFICATION REQUIREMENTS:</label>
              <textarea id="bountyDescInput" class="bounty-text-area" rows="2" placeholder="Detail verification criteria, required deliverables, or proof hash..."></textarea>
            </div>

            <div class="bounty-field-group mt-3">
              <label class="bounty-label">ESCROW REWARD STAKE:</label>
              <div class="bounty-pills-row">
                <button type="button" class="bounty-pill" data-amount="50">50 Tokens</button>
                <button type="button" class="bounty-pill active" data-amount="100">100 Tokens</button>
                <button type="button" class="bounty-pill" data-amount="250">250 Tokens</button>
                <button type="button" class="bounty-pill" data-amount="500">500 Tokens</button>
              </div>
            </div>

            <button type="button" id="confirmDeployBountyBtn" class="bounty-deploy-btn mt-4">
              <i class="fa-solid fa-lock"></i> LOCK ESCROW & DEPLOY CONTRACT
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      document.getElementById('closeBountyModalBtn')?.addEventListener('click', () => {
        this.closeModal();
      });

      modal.querySelectorAll('.bounty-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          modal.querySelectorAll('.bounty-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          this.selectedReward = parseInt(pill.dataset.amount, 10);
        });
      });

      document.getElementById('confirmDeployBountyBtn')?.addEventListener('click', () => {
        this.executeDeploy();
      });
    }

    injectSubmissionModal() {
      if (document.getElementById('submitBountyProofModal')) return;

      const modal = document.createElement('div');
      modal.id = 'submitBountyProofModal';
      modal.className = 'cyber-modal-backdrop';
      modal.style.display = 'none';

      modal.innerHTML = `
        <div class="cyber-modal-window bounty-sub-modal-window">
          <div class="cyber-modal-header">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-paper-plane text-[#00d4ff] text-base"></i>
              <h3 class="font-bold text-white text-sm">SUBMIT SOLUTION PROOF</h3>
            </div>
            <button type="button" class="cyber-modal-close" id="closeBountySubModalBtn"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="bounty-modal-body">
            <input type="hidden" id="activeSubBountyId" value="" />
            <div class="bounty-field-group">
              <label class="bounty-label">SUBMISSION / PROOF TEXT:</label>
              <textarea id="bountyProofInput" class="bounty-text-area" rows="3" placeholder="Provide solution details, code snippet, or verification proof..."></textarea>
            </div>
            <button type="button" id="sendBountyProofBtn" class="bounty-deploy-btn mt-3">
              <i class="fa-solid fa-check"></i> TRANSMIT PROOF TO CONTRACT CREATOR
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      document.getElementById('closeBountySubModalBtn')?.addEventListener('click', () => {
        modal.style.display = 'none';
      });

      document.getElementById('sendBountyProofBtn')?.addEventListener('click', () => {
        this.executeProofSubmission();
      });
    }

    injectHubAction() {
      const hub = document.getElementById('attachmentPopupHub');
      if (hub && !document.getElementById('hubActionBounty')) {
        const item = document.createElement('div');
        item.className = 'attach-hub-item';
        item.id = 'hubActionBounty';
        item.innerHTML = `
          <div class="attach-hub-icon icon-bounty"><i class="fa-solid fa-file-contract"></i></div>
          <span>Bounties</span>
        `;
        item.addEventListener('click', () => {
          hub.style.display = 'none';
          this.openModal();
        });
        hub.appendChild(item);
      }
    }

    openModal() {
      const modal = document.getElementById('createBountyModal');
      if (!modal) return;
      modal.style.display = 'flex';
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('sonar');
    }

    closeModal() {
      const modal = document.getElementById('createBountyModal');
      if (modal) modal.style.display = 'none';
    }

    executeDeploy() {
      const titleInput = document.getElementById('bountyTitleInput');
      const descInput = document.getElementById('bountyDescInput');
      const title = titleInput ? titleInput.value.trim() : '';
      const desc = descInput ? descInput.value.trim() : '';

      if (!title) {
        if (typeof window.showNotif === 'function') window.showNotif('Please enter a task title', 'error');
        return;
      }

      const bal = this.getUserTokens();
      if (bal < this.selectedReward) {
        if (typeof window.showNotif === 'function') {
          window.showNotif(`Insufficient tokens! Need ${this.selectedReward} tokens for escrow lock.`, 'error');
        }
        return;
      }

      // Deduct escrow tokens
      this.setUserTokens(bal - this.selectedReward);

      const bountyId = `bnty_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const creatorUid = window.myUID || 'u_current';
      const creatorName = window.currentUserName || 'Operative';

      const bountyPayload = {
        bountyId: bountyId,
        title: title,
        description: desc || 'Complete instructions and provide valid proof.',
        rewardTokens: this.selectedReward,
        creatorUid: creatorUid,
        creatorName: creatorName,
        status: 'OPEN', // 'OPEN' | 'FULFILLED'
        submissions: [],
        winner: null,
        timestamp: Date.now()
      };

      this.bounties[bountyId] = bountyPayload;
      this.saveBounties();

      const attachment = {
        fileType: 'escrow_bounty',
        isBountyContract: true,
        bountyData: bountyPayload
      };

      if (typeof window.appendLocalSentMessage === 'function') {
        window.appendLocalSentMessage(`Deployed Escrow Bounty Contract: "${title}"`, attachment, false, 'sent');
      }

      if (typeof window.sendSupabaseMessage === 'function') {
        const partnerId = window.currentChatUserId || window.currentChatUser;
        if (partnerId) {
          window.sendSupabaseMessage({
            from: creatorUid,
            to: partnerId,
            text: "",
            attachment: attachment,
            chatType: window.currentChatType || 'direct'
          }).catch(() => {});
        }
      }

      this.closeModal();

      if (typeof window.showNotif === 'function') {
        window.showNotif(`Escrow Bounty Contract deployed! (${this.selectedReward} Tokens Escrowed)`, 'success', 2500);
      }
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('affirm');
    }

    renderBountyBubble(attachment) {
      const bData = attachment.bountyData || {};
      const bId = bData.bountyId || `bnty_${Date.now()}`;
      if (!this.bounties[bId]) {
        this.bounties[bId] = bData;
        this.saveBounties();
      }

      const active = this.bounties[bId] || bData;
      const card = document.createElement('div');
      card.className = 'bounty-contract-card';
      card.id = `bountyCard_${bId}`;

      const currentUid = window.myUID || 'u_current';
      const isCreator = (active.creatorUid === currentUid);
      const isFulfilled = (active.status === 'FULFILLED');

      card.innerHTML = `
        <div class="bounty-card-header">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-file-contract text-[#00ff66]"></i>
            <span class="bounty-type-badge">ESCROW BOUNTY</span>
          </div>
          <div class="bounty-escrow-amount">
            <i class="fa-solid fa-lock text-[#00d4ff]"></i>
            <strong>${active.rewardTokens.toLocaleString()} TOKENS</strong>
          </div>
        </div>

        <h4 class="bounty-task-title mt-2">${active.title}</h4>
        <p class="bounty-task-desc mt-1">${active.description}</p>
        <span class="bounty-meta-line">Issuer: ${active.creatorName || 'Operative'} &bull; Status: <strong class="${isFulfilled ? 'text-amber-400' : 'text-[#00ff66]'}">${active.status}</strong></span>

        <!-- Submissions & Actions Container -->
        <div class="bounty-action-box mt-3" id="bountyActionBox_${bId}">
          ${isFulfilled ? `
            <div class="bounty-settled-notice">
              <i class="fa-solid fa-circle-check text-[#00ff66]"></i>
              <span>CONTRACT FULFILLED & ESCROW RELEASED TO ${active.winner?.authorName || 'WINNER'}</span>
            </div>
          ` : `
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs text-gray-400">${active.submissions.length} Solution Submission${active.submissions.length !== 1 ? 's' : ''}</span>
              ${!isCreator ? `
                <button type="button" class="bounty-submit-solution-btn" data-bounty-id="${bId}">
                  <i class="fa-solid fa-paper-plane"></i> SUBMIT PROOF
                </button>
              ` : `
                <button type="button" class="bounty-review-solutions-btn" data-bounty-id="${bId}">
                  <i class="fa-solid fa-magnifying-glass"></i> REVIEW SUBMISSIONS
                </button>
              `}
            </div>
          `}
        </div>

        <!-- Creator Review Panel -->
        ${isCreator && !isFulfilled ? `
          <div class="bounty-submissions-panel mt-3" id="bountySubPanel_${bId}" style="display: none;">
            <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">SUBMITTED SOLUTIONS:</span>
            <div class="bounty-sub-list mt-2">
              ${active.submissions.length === 0 ? `
                <div class="text-xs text-gray-500 italic py-2">No operative solutions submitted yet.</div>
              ` : active.submissions.map(s => `
                <div class="bounty-sub-item">
                  <div class="flex items-center justify-between">
                    <strong class="text-white text-xs">${s.authorName}</strong>
                    <button type="button" class="bounty-release-escrow-btn" data-bounty-id="${bId}" data-sub-id="${s.subId}">
                      APPROVE & PAY
                    </button>
                  </div>
                  <p class="text-xs text-gray-300 mt-1">${s.text}</p>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      `;

      // Bind Submit Proof
      const submitBtn = card.querySelector('.bounty-submit-solution-btn');
      submitBtn?.addEventListener('click', () => {
        const subModal = document.getElementById('submitBountyProofModal');
        const hiddenId = document.getElementById('activeSubBountyId');
        if (hiddenId) hiddenId.value = bId;
        if (subModal) subModal.style.display = 'flex';
      });

      // Bind Review Submissions Toggle
      const reviewBtn = card.querySelector('.bounty-review-solutions-btn');
      reviewBtn?.addEventListener('click', () => {
        const panel = document.getElementById(`bountySubPanel_${bId}`);
        if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      });

      // Bind Release Escrow
      card.querySelectorAll('.bounty-release-escrow-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const subId = btn.dataset.subId;
          this.releaseEscrowPayout(bId, subId);
        });
      });

      return card;
    }

    executeProofSubmission() {
      const hiddenId = document.getElementById('activeSubBountyId');
      const bId = hiddenId ? hiddenId.value : null;
      const proofInput = document.getElementById('bountyProofInput');
      const proofText = proofInput ? proofInput.value.trim() : '';

      if (!bId || !proofText) {
        if (typeof window.showNotif === 'function') window.showNotif('Please enter solution proof text', 'error');
        return;
      }

      const active = this.bounties[bId];
      if (!active) return;

      const subId = `sub_${Date.now()}`;
      const subEntry = {
        subId: subId,
        authorUid: window.myUID || 'u_current',
        authorName: window.currentUserName || 'Operative',
        text: proofText,
        timestamp: Date.now()
      };

      active.submissions.push(subEntry);
      this.bounties[bId] = active;
      this.saveBounties();

      // Broadcast update
      this.broadcastBountyEvent('submission', { bountyId: bId, submission: subEntry });

      const modal = document.getElementById('submitBountyProofModal');
      if (modal) modal.style.display = 'none';
      if (proofInput) proofInput.value = '';

      if (typeof window.showNotif === 'function') {
        window.showNotif('Solution proof submitted for verification', 'success', 2500);
      }
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('affirm');
    }

    releaseEscrowPayout(bountyId, subId) {
      const active = this.bounties[bountyId];
      if (!active || active.status === 'FULFILLED') return;

      const sub = active.submissions.find(s => s.subId === subId);
      if (!sub) return;

      active.status = 'FULFILLED';
      active.winner = sub;
      this.bounties[bountyId] = active;
      this.saveBounties();

      // If current user is winner, credit balance
      const currentUid = window.myUID || 'u_current';
      if (sub.authorUid === currentUid) {
        const curBal = this.getUserTokens();
        this.setUserTokens(curBal + active.rewardTokens);
        if (typeof window.showNotif === 'function') {
          window.showNotif(`BOUNTY WON! Escrow credited +${active.rewardTokens} Tokens!`, 'success', 3500);
        }
      }

      this.broadcastBountyEvent('fulfilled', { bountyId, winner: sub, amount: active.rewardTokens });

      // Refresh bubble UI
      const card = document.getElementById(`bountyCard_${bountyId}`);
      if (card) {
        const actionBox = document.getElementById(`bountyActionBox_${bountyId}`);
        if (actionBox) {
          actionBox.innerHTML = `
            <div class="bounty-settled-notice">
              <i class="fa-solid fa-circle-check text-[#00ff66]"></i>
              <span>CONTRACT FULFILLED & ESCROW RELEASED TO ${sub.authorName}</span>
            </div>
          `;
        }
        const panel = document.getElementById(`bountySubPanel_${bountyId}`);
        if (panel) panel.remove();
      }

      if (typeof window.showNotif === 'function') {
        window.showNotif(`Escrow payment of ${active.rewardTokens} Tokens released to ${sub.authorName}`, 'success', 2500);
      }
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('victory');
    }

    broadcastBountyEvent(action, payload) {
      if (typeof window.sendSupabaseMessage === 'function') {
        const partnerId = window.currentChatUserId || window.currentChatUser;
        if (!partnerId) return;

        window.sendSupabaseMessage({
          from: window.myUID || 'u_current',
          to: partnerId,
          text: "",
          attachment: {
            fileType: 'escrow_bounty_event',
            isBountyEvent: true,
            action: action,
            payload: payload
          },
          chatType: window.currentChatType || 'direct'
        }).catch(() => {});
      }
    }

    listenSupabaseRealtime() {
      window.addEventListener('nexchat:bounty_sync_received', (e) => {
        const event = e.detail;
        if (!event) return;
        const bId = event.payload?.bountyId;
        if (!bId) return;

        if (event.action === 'submission') {
          const active = this.bounties[bId];
          if (active && event.payload.submission) {
            active.submissions.push(event.payload.submission);
            this.bounties[bId] = active;
            this.saveBounties();
          }
        } else if (event.action === 'fulfilled') {
          const active = this.bounties[bId];
          if (active) {
            active.status = 'FULFILLED';
            active.winner = event.payload.winner;
            this.bounties[bId] = active;
            this.saveBounties();

            const currentUid = window.myUID || 'u_current';
            if (event.payload.winner?.authorUid === currentUid) {
              const curBal = this.getUserTokens();
              this.setUserTokens(curBal + event.payload.amount);
              if (typeof window.showNotif === 'function') {
                window.showNotif(`BOUNTY WON! +${event.payload.amount} Tokens Escrow Credited!`, 'success', 3500);
              }
              if (typeof window.playCyberSfx === 'function') window.playCyberSfx('victory');
            }
          }
        }
      });
    }
  }

  window.bountyContractsEngine = new BountyContractsEngine();
})();
