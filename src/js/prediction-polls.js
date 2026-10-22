/**
 * NEXCHAT - Interactive Token Prediction Polls & In-Chat Wagering Markets Engine
 * Real-time voting, token wagers, live animated percentage bars,
 * automated proportional pot payouts, and Supabase broadcast synchronization.
 */

(function() {
  'use strict';

  const POLLS_CACHE_KEY = 'nexchat_polls_cache';
  const TOKEN_BAL_KEY = 'nexchat_user_tokens';

  class PredictionPollEngine {
    constructor() {
      this.selectedWager = 50;
      this.polls = this.loadPollsCache();
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
      this.injectHubAction();
      this.listenSupabaseRealtime();
    }

    getUserTokens() {
      const stored = localStorage.getItem(TOKEN_BAL_KEY);
      if (stored === null) {
        localStorage.setItem(TOKEN_BAL_KEY, '1000');
        return 1000;
      }
      return parseInt(stored, 10) || 0;
    }

    setUserTokens(amount) {
      localStorage.setItem(TOKEN_BAL_KEY, String(Math.max(0, amount)));
      window.dispatchEvent(new CustomEvent('nexchat:tokens_changed', { detail: { tokens: amount } }));
    }

    loadPollsCache() {
      try {
        const raw = localStorage.getItem(POLLS_CACHE_KEY);
        return raw ? JSON.parse(raw) : {};
      } catch (e) {
        return {};
      }
    }

    savePollsCache() {
      try {
        localStorage.setItem(POLLS_CACHE_KEY, JSON.stringify(this.polls));
      } catch (e) {}
    }

    injectModal() {
      if (document.getElementById('createPredictionPollModal')) return;

      const modal = document.createElement('div');
      modal.id = 'createPredictionPollModal';
      modal.className = 'cyber-modal-backdrop';
      modal.style.display = 'none';

      modal.innerHTML = `
        <div class="cyber-modal-window poll-modal-window">
          <div class="cyber-modal-header">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-chart-line text-[#00ff66] text-lg"></i>
              <h3 class="font-bold text-white text-base">NEW PREDICTION MARKET</h3>
              <span class="poll-live-tag">TOKEN WAGERING</span>
            </div>
            <button type="button" class="cyber-modal-close" id="closePollModalBtn"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="poll-modal-body">
            <p class="text-xs text-gray-300 text-center mb-3">
              Create an interactive poll where members can stake NEX tokens. When resolved, the winning side takes the entire pot!
            </p>

            <div class="poll-field-group">
              <label class="poll-label">PREDICTION QUESTION / TOPIC:</label>
              <input type="text" id="pollQuestionInput" class="poll-text-input" placeholder="e.g. Will Bitcoin break $120k this week?" maxlength="100" />
            </div>

            <div class="poll-field-group mt-3">
              <label class="poll-label">CHOICE OPTIONS (MIN 2):</label>
              <div class="poll-options-inputs-list" id="pollOptionsInputsList">
                <input type="text" class="poll-text-input poll-opt-input mb-2" placeholder="Option 1 (e.g. Yes, to the moon 🚀)" maxlength="50" />
                <input type="text" class="poll-text-input poll-opt-input mb-2" placeholder="Option 2 (e.g. No, dip first 📉)" maxlength="50" />
              </div>
              <button type="button" id="addPollOptionBtn" class="poll-add-opt-btn">
                <i class="fa-solid fa-plus"></i> Add Choice Option
              </button>
            </div>

            <div class="poll-field-group mt-3">
              <label class="poll-label">STAKE PER VOTE:</label>
              <div class="poll-wager-pills-row">
                <button type="button" class="poll-wager-pill" data-wager="0">Free (0 🪙)</button>
                <button type="button" class="poll-wager-pill active" data-wager="50">50 🪙</button>
                <button type="button" class="poll-wager-pill" data-wager="100">100 🪙</button>
                <button type="button" class="poll-wager-pill" data-wager="250">250 🪙</button>
              </div>
            </div>

            <button type="button" id="confirmLaunchPollBtn" class="poll-launch-btn mt-4">
              <i class="fa-solid fa-bolt"></i> LAUNCH PREDICTION MARKET
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      document.getElementById('closePollModalBtn')?.addEventListener('click', () => {
        this.closeModal();
      });

      // Wager pills
      modal.querySelectorAll('.poll-wager-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          modal.querySelectorAll('.poll-wager-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          this.selectedWager = parseInt(pill.dataset.wager, 10);
        });
      });

      // Add choice option
      document.getElementById('addPollOptionBtn')?.addEventListener('click', () => {
        const list = document.getElementById('pollOptionsInputsList');
        const count = list ? list.querySelectorAll('.poll-opt-input').length : 0;
        if (count < 4) {
          const opt = document.createElement('input');
          opt.type = 'text';
          opt.className = 'poll-text-input poll-opt-input mb-2';
          opt.placeholder = `Option ${count + 1}`;
          opt.maxLength = 50;
          list.appendChild(opt);
        } else {
          if (typeof window.showNotif === 'function') window.showNotif('Maximum 4 choices allowed', 'info');
        }
      });

      // Launch button
      document.getElementById('confirmLaunchPollBtn')?.addEventListener('click', () => {
        this.executeLaunch();
      });
    }

    injectHubAction() {
      const hub = document.getElementById('attachmentPopupHub');
      if (hub && !document.getElementById('hubActionPredictionPoll')) {
        const item = document.createElement('div');
        item.className = 'attach-hub-item';
        item.id = 'hubActionPredictionPoll';
        item.innerHTML = `
          <div class="attach-hub-icon icon-prediction-poll"><i class="fa-solid fa-chart-line"></i></div>
          <span>Prediction</span>
        `;
        item.addEventListener('click', () => {
          hub.style.display = 'none';
          this.openModal();
        });
        hub.appendChild(item);
      }

      // Also wire existing hubActionPoll if present
      const existingPollBtn = document.getElementById('hubActionPoll');
      if (existingPollBtn) {
        existingPollBtn.addEventListener('click', () => {
          if (hub) hub.style.display = 'none';
          this.openModal();
        });
      }
    }

    openModal() {
      const modal = document.getElementById('createPredictionPollModal');
      if (!modal) return;
      modal.style.display = 'flex';
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('sonar');
    }

    closeModal() {
      const modal = document.getElementById('createPredictionPollModal');
      if (modal) modal.style.display = 'none';
    }

    executeLaunch() {
      const qInput = document.getElementById('pollQuestionInput');
      const question = qInput ? qInput.value.trim() : '';

      if (!question) {
        if (typeof window.showNotif === 'function') window.showNotif('Please enter a prediction question', 'error');
        return;
      }

      const optInputs = document.querySelectorAll('.poll-opt-input');
      const options = [];
      optInputs.forEach((inp, idx) => {
        const val = inp.value.trim();
        if (val) {
          options.push({
            id: idx,
            text: val,
            votes: 0,
            voters: []
          });
        }
      });

      if (options.length < 2) {
        if (typeof window.showNotif === 'function') window.showNotif('Please provide at least 2 choice options', 'error');
        return;
      }

      const userTokens = this.getUserTokens();
      if (this.selectedWager > 0 && userTokens < this.selectedWager) {
        if (typeof window.showNotif === 'function') window.showNotif(`Insufficient tokens! Need ${this.selectedWager} NEX to stake creator vote.`, 'error');
        return;
      }

      const pollId = `poll_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const creatorUid = window.myUID || (localStorage.getItem('nexchat_user') ? JSON.parse(localStorage.getItem('nexchat_user')).uid : 'u_current');
      const creatorName = window.currentUserName || 'Operative';

      const pollPayload = {
        pollId: pollId,
        creatorUid: creatorUid,
        creatorName: creatorName,
        question: question,
        options: options,
        wager: this.selectedWager,
        totalPot: 0,
        status: 'open', // 'open' | 'resolved'
        resolvedWinnerId: null,
        timestamp: Date.now()
      };

      this.polls[pollId] = pollPayload;
      this.savePollsCache();

      const pollAttachment = {
        fileType: 'prediction_poll',
        isPredictionPoll: true,
        pollData: pollPayload
      };

      if (typeof window.appendLocalSentMessage === 'function') {
        window.appendLocalSentMessage(`📊 Launched Prediction Market: "${question}"`, pollAttachment, false, 'sent');
      }

      if (typeof window.sendSupabaseMessage === 'function') {
        const partnerId = window.currentChatUserId || window.currentChatUser;
        if (partnerId) {
          window.sendSupabaseMessage({
            from: creatorUid,
            to: partnerId,
            text: "",
            attachment: pollAttachment,
            chatType: window.currentChatType || 'direct'
          }).catch(console.warn);
        }
      }

      this.closeModal();

      if (typeof window.showNotif === 'function') {
        window.showNotif(`⚡ Prediction Market launched with ${this.selectedWager} 🪙 stakes!`, 'success', 2500);
      }
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('affirm');
    }

    castVote(pollId, optionId) {
      let poll = this.polls[pollId];
      if (!poll) {
        poll = this.loadPollsCache()[pollId];
      }
      if (!poll) {
        if (typeof window.showNotif === 'function') window.showNotif('Poll not found or expired', 'error');
        return;
      }

      if (poll.status === 'resolved') {
        if (typeof window.showNotif === 'function') window.showNotif('This prediction market is already resolved and paid out!', 'info');
        return;
      }

      const currentUid = window.myUID || (localStorage.getItem('nexchat_user') ? JSON.parse(localStorage.getItem('nexchat_user')).uid : 'u_current');
      const currentName = window.currentUserName || 'You';

      // Check if already voted
      const alreadyVoted = poll.options.some(opt => opt.voters.some(v => v.uid === currentUid));
      if (alreadyVoted) {
        if (typeof window.showNotif === 'function') window.showNotif('You have already cast your vote in this market!', 'info');
        return;
      }

      // Check tokens
      if (poll.wager > 0) {
        const bal = this.getUserTokens();
        if (bal < poll.wager) {
          if (typeof window.showNotif === 'function') window.showNotif(`Insufficient tokens! Need ${poll.wager} NEX to stake vote.`, 'error');
          return;
        }
        this.setUserTokens(bal - poll.wager);
        poll.totalPot += poll.wager;
      }

      const opt = poll.options.find(o => o.id === optionId);
      if (!opt) return;

      opt.votes += 1;
      opt.voters.push({
        uid: currentUid,
        name: currentName,
        amount: poll.wager,
        time: Date.now()
      });

      this.polls[pollId] = poll;
      this.savePollsCache();

      this.updateBubbleUI(pollId, poll);
      this.broadcastPollEvent(poll, 'vote');

      if (typeof window.showNotif === 'function') {
        window.showNotif(`✅ Vote placed on "${opt.text}"! (${poll.wager > 0 ? poll.wager + ' 🪙 Staked' : 'Free'})`, 'success', 2500);
      }
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('chime');
    }

    resolveMarket(pollId, winningOptionId) {
      const poll = this.polls[pollId];
      if (!poll) return;

      poll.status = 'resolved';
      poll.resolvedWinnerId = winningOptionId;

      const winningOpt = poll.options.find(o => o.id === winningOptionId);
      const winners = winningOpt ? winningOpt.voters : [];

      if (poll.totalPot > 0 && winners.length > 0) {
        const payoutPerWinner = Math.floor(poll.totalPot / winners.length);
        const currentUid = window.myUID || (localStorage.getItem('nexchat_user') ? JSON.parse(localStorage.getItem('nexchat_user')).uid : 'u_current');

        // If current user is a winner, credit their balance
        if (winners.some(w => w.uid === currentUid)) {
          const curBal = this.getUserTokens();
          this.setUserTokens(curBal + payoutPerWinner);
          if (typeof window.showNotif === 'function') {
            window.showNotif(`🏆 MARKET WON! Claimed +${payoutPerWinner} NEX Tokens!`, 'success', 3500);
          }
        }
      }

      this.polls[pollId] = poll;
      this.savePollsCache();

      this.updateBubbleUI(pollId, poll);
      this.broadcastPollEvent(poll, 'resolve');

      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('victory');
    }

    renderPollBubble(attachment) {
      const poll = attachment.pollData || {};
      const pollId = poll.pollId || `poll_${Date.now()}`;
      if (!this.polls[pollId]) {
        this.polls[pollId] = poll;
        this.savePollsCache();
      }

      const activePoll = this.polls[pollId] || poll;
      const container = document.createElement('div');
      container.className = 'prediction-poll-card';
      container.id = `pollCard_${pollId}`;

      const totalVotes = activePoll.options.reduce((sum, o) => sum + o.votes, 0);
      const currentUid = window.myUID || (localStorage.getItem('nexchat_user') ? JSON.parse(localStorage.getItem('nexchat_user')).uid : 'u_current');
      const isCreator = (activePoll.creatorUid === currentUid);
      const userVotedOpt = activePoll.options.find(opt => opt.voters && opt.voters.some(v => v.uid === currentUid));

      container.innerHTML = `
        <div class="poll-card-header">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-chart-line text-[#00ff66]"></i>
            <span class="poll-type-tag">PREDICTION MARKET</span>
          </div>
          <div class="poll-pot-badge">
            <i class="fa-solid fa-coins text-amber-400"></i>
            <strong id="pollPotVal_${pollId}">${activePoll.totalPot.toLocaleString()} 🪙</strong>
          </div>
        </div>

        <h4 class="poll-question-title mt-2">${activePoll.question}</h4>
        <span class="poll-meta-sub">Created by ${activePoll.creatorName || 'Operative'} &bull; Stake: ${activePoll.wager > 0 ? activePoll.wager + ' NEX' : 'Free'}</span>

        <div class="poll-options-grid mt-3" id="pollOptionsGrid_${pollId}">
          ${this.renderOptionsHTML(activePoll, totalVotes, userVotedOpt)}
        </div>

        <div class="poll-status-footer mt-3">
          <span>${totalVotes} Total Vote${totalVotes !== 1 ? 's' : ''} &bull; ${activePoll.status === 'resolved' ? '<strong class="text-amber-400">RESOLVED</strong>' : '<strong class="text-[#00ff66]">OPEN FOR VOTES</strong>'}</span>
          ${isCreator && activePoll.status !== 'resolved' ? `<button type="button" class="poll-resolve-open-btn" data-poll-id="${pollId}">RESOLVE MARKET</button>` : ''}
        </div>

        ${isCreator && activePoll.status !== 'resolved' ? `
          <div class="creator-resolve-box" id="creatorResolveBox_${pollId}" style="display: none;">
            <span class="text-[10px] text-gray-300">SELECT WINNING OUTCOME TO PAYOUT POT:</span>
            <div class="flex gap-2 mt-2">
              ${activePoll.options.map(opt => `
                <button type="button" class="resolve-pick-opt-btn" data-poll-id="${pollId}" data-opt-id="${opt.id}">
                  ${opt.text}
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}
      `;

      // Bind Vote Buttons
      container.querySelectorAll('.poll-vote-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const optId = parseInt(btn.dataset.optId, 10);
          this.castVote(pollId, optId);
        });
      });

      // Bind Resolve Panel
      const resolveToggle = container.querySelector('.poll-resolve-open-btn');
      resolveToggle?.addEventListener('click', (e) => {
        e.stopPropagation();
        const box = document.getElementById(`creatorResolveBox_${pollId}`);
        if (box) box.style.display = box.style.display === 'none' ? 'block' : 'none';
      });

      container.querySelectorAll('.resolve-pick-opt-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const optId = parseInt(btn.dataset.optId, 10);
          this.resolveMarket(pollId, optId);
        });
      });

      return container;
    }

    renderOptionsHTML(poll, totalVotes, userVotedOpt) {
      return poll.options.map(opt => {
        const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
        const isUserChoice = userVotedOpt && userVotedOpt.id === opt.id;
        const isWinner = poll.status === 'resolved' && poll.resolvedWinnerId === opt.id;

        return `
          <div class="poll-option-row ${isUserChoice ? 'user-choice' : ''} ${isWinner ? 'winner-choice' : ''}">
            <div class="poll-option-bar" style="width: ${pct}%;"></div>
            <div class="poll-option-content">
              <span class="poll-option-text">
                ${isWinner ? '👑 ' : ''}${opt.text} ${isUserChoice ? '<span class="voted-tag">YOUR VOTE</span>' : ''}
              </span>
              <div class="flex items-center gap-2">
                <strong class="poll-option-pct">${pct}%</strong>
                <span class="poll-option-votes">(${opt.votes})</span>
                ${!userVotedOpt && poll.status !== 'resolved' ? `
                  <button type="button" class="poll-vote-btn" data-poll-id="${poll.pollId}" data-opt-id="${opt.id}">
                    VOTE
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    updateBubbleUI(pollId, poll) {
      const card = document.getElementById(`pollCard_${pollId}`);
      if (!card) return;

      const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
      const currentUid = window.myUID || (localStorage.getItem('nexchat_user') ? JSON.parse(localStorage.getItem('nexchat_user')).uid : 'u_current');
      const userVotedOpt = poll.options.find(opt => opt.voters && opt.voters.some(v => v.uid === currentUid));

      const potVal = document.getElementById(`pollPotVal_${pollId}`);
      if (potVal) potVal.textContent = `${poll.totalPot.toLocaleString()} 🪙`;

      const grid = document.getElementById(`pollOptionsGrid_${pollId}`);
      if (grid) {
        grid.innerHTML = this.renderOptionsHTML(poll, totalVotes, userVotedOpt);
        grid.querySelectorAll('.poll-vote-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const optId = parseInt(btn.dataset.optId, 10);
            this.castVote(pollId, optId);
          });
        });
      }

      const footer = card.querySelector('.poll-status-footer');
      if (footer) {
        footer.innerHTML = `
          <span>${totalVotes} Total Vote${totalVotes !== 1 ? 's' : ''} &bull; ${poll.status === 'resolved' ? '<strong class="text-amber-400">RESOLVED</strong>' : '<strong class="text-[#00ff66]">OPEN FOR VOTES</strong>'}</span>
        `;
      }

      const resolveBox = document.getElementById(`creatorResolveBox_${pollId}`);
      if (resolveBox && poll.status === 'resolved') {
        resolveBox.remove();
      }
    }

    broadcastPollEvent(poll, action) {
      if (typeof window.sendSupabaseMessage === 'function') {
        const partnerId = window.currentChatUserId || window.currentChatUser;
        if (!partnerId) return;

        window.sendSupabaseMessage({
          from: window.myUID || 'u_current',
          to: partnerId,
          text: "",
          attachment: {
            fileType: 'prediction_poll_sync',
            isPredictionPollSync: true,
            action: action,
            pollData: poll
          },
          chatType: window.currentChatType || 'direct'
        }).catch(console.warn);
      }
    }

    listenSupabaseRealtime() {
      window.addEventListener('nexchat:poll_sync_received', (e) => {
        const poll = e.detail?.pollData;
        if (!poll) return;
        this.polls[poll.pollId] = poll;
        this.savePollsCache();
        this.updateBubbleUI(poll.pollId, poll);
      });
    }
  }

  window.predictionPollEngine = new PredictionPollEngine();
})();
