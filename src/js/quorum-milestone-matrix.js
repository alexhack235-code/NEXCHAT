/**
 * =============================================================================
 * NEXCHAT - LIVE QUORUM CONSENSUS & MILESTONE MATRIX (v3.1)
 * Namespace: window.NexPinboardManager.QuorumMatrix
 * STRICTLY 0 UNICODE EMOJIS: Pure FontAwesome 6 vector glyphs and typography.
 * =============================================================================
 */

(function() {
  'use strict';

  class QuorumMilestoneMatrix {
    constructor() {
      this.state = {
        chatId: 'default_chat',
        missionCodename: 'OPERATION BLACKOUT',
        currentProposal: null,
        milestones: [],
        isHudVisible: false
      };

      this.currentVoterUid = localStorage.getItem('auth_uid') || localStorage.getItem('myUID') || 'operator_1';
      this.currentVoterHandle = localStorage.getItem('auth_username') || localStorage.getItem('username') || 'Operator';
      this.init();
    }

    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.boot());
      } else {
        this.boot();
      }
    }

    boot() {
      this.loadState();
      this.bindEvents();
      this.listenDuressWipe();
      this.render();
    }

    getStorageKey() {
      const activeChat = window.currentChatUser || window.currentChatId || 'general';
      return `nex_quorum_matrix_${activeChat}`;
    }

    loadState() {
      try {
        const raw = localStorage.getItem(this.getStorageKey());
        if (raw) {
          const parsed = JSON.parse(raw);
          this.state.currentProposal = parsed.currentProposal || null;
          this.state.milestones = parsed.milestones || [];
          this.state.missionCodename = parsed.missionCodename || 'OPERATION BLACKOUT';
        } else {
          this.seedInitialState();
        }
      } catch (_) {
        this.seedInitialState();
      }
    }

    seedInitialState() {
      this.state.currentProposal = {
        id: 'prop_001',
        chatId: window.currentChatUser || window.currentChatId || 'general',
        title: 'Authorize Deep Database Extraction Payload',
        description: 'Requires 66% operative approval before executing direct decrypt query on server vault.',
        targetThresholdPercent: 66.6,
        quorumMode: 'SUPERMAJORITY_66',
        totalEligibleOperatives: 6,
        ballots: {},
        status: 'VOTING_ACTIVE',
        createdAt: Date.now(),
        expiresAt: Date.now() + 86400000
      };

      this.state.milestones = [
        {
          phaseIndex: 1,
          phaseId: 'phase_infil',
          phaseTitle: 'Infiltration',
          status: 'IN_PROGRESS',
          tasks: [
            { id: 't1_1', title: 'Bypass Perimeter SSL Enclave', completed: true, completedBy: 'CipherLead', completedAt: Date.now() - 3600000, auditSeal: '0x7A9F1B' },
            { id: 't1_2', title: 'Deploy Rootkit Beacon v3', completed: false }
          ]
        },
        {
          phaseIndex: 2,
          phaseId: 'phase_extract',
          phaseTitle: 'Intel Extraction',
          status: 'LOCKED',
          tasks: [
            { id: 't2_1', title: 'Dump Cipher Hashes to Stealth Node', completed: false },
            { id: 't2_2', title: 'Sign Exfiltration Manifest', completed: false }
          ]
        },
        {
          phaseIndex: 3,
          phaseId: 'phase_exfil',
          phaseTitle: 'Safe Exfiltration',
          status: 'LOCKED',
          tasks: [
            { id: 't3_1', title: 'Purge Event Logs (Duress Shred)', completed: false },
            { id: 't3_2', title: 'Sever Remote Session Bridges', completed: false }
          ]
        }
      ];

      this.saveState();
    }

    saveState() {
      try {
        localStorage.setItem(this.getStorageKey(), JSON.stringify({
          currentProposal: this.state.currentProposal,
          milestones: this.state.milestones,
          missionCodename: this.state.missionCodename
        }));
      } catch (_) {}
    }

    listenDuressWipe() {
      window.addEventListener('nex:duress:wipe', () => {
        this.state.currentProposal = null;
        this.state.milestones = [];
        this.saveState();
        const hud = document.getElementById('nexQuorumHud');
        if (hud) hud.style.display = 'none';
        console.info('[NEX DURESS PROTOCOL]: Quorum and Milestone matrix completely wiped.');
      });
    }

    /* ------------------------------------------------------------------------
       CRYPTOGRAPHIC BALLOT VOTING ENGINE
       ------------------------------------------------------------------------ */
    castBallot(choice) {
      const proposal = this.state.currentProposal;
      if (!proposal || proposal.status !== 'VOTING_ACTIVE') {
        this.showToast('Voting is closed or no active proposal exists.');
        return;
      }

      const timestamp = Date.now();
      const rawPayload = `${proposal.id}:${this.currentVoterUid}:${choice}:${timestamp}`;
      // Generate SHA-256 style deterministic verification seal
      const ballotSeal = '0x' + Array.from(rawPayload)
        .reduce((hash, char) => Math.imul(31, hash) + char.charCodeAt(0) | 0, 0)
        .toString(16)
        .toUpperCase()
        .padStart(8, '0');

      proposal.ballots[this.currentVoterUid] = {
        voterUid: this.currentVoterUid,
        voterHandle: this.currentVoterHandle,
        choice: choice,
        timestamp: timestamp,
        ballotSeal: ballotSeal
      };

      this.evaluateQuorum();
      this.saveState();
      this.render();

      window.dispatchEvent(new CustomEvent('nex:quorum:ballot_cast', {
        detail: { proposalId: proposal.id, voter: this.currentVoterHandle, choice, ballotSeal }
      }));

      this.showToast(`Ballot cast: ${choice} [Seal: ${ballotSeal}]`);
    }

    evaluateQuorum() {
      const proposal = this.state.currentProposal;
      if (!proposal) return;

      const ballots = Object.values(proposal.ballots);
      const totalEligible = proposal.totalEligibleOperatives || 6;
      const affirmativeVotes = ballots.filter(b => b.choice === 'AFFIRMATIVE').length;
      const affirmativePercent = (affirmativeVotes / totalEligible) * 100;

      if (affirmativePercent >= proposal.targetThresholdPercent) {
        proposal.status = 'CONSENSUS_REACHED';
        proposal.consensusSeal = '0xCONSENSUS_' + Date.now().toString(16).toUpperCase();

        window.dispatchEvent(new CustomEvent('nex:quorum:threshold_reached', {
          detail: { proposalId: proposal.id, affirmativeVotes, totalEligible, seal: proposal.consensusSeal }
        }));

        this.showToast('QUORUM LOCKED: 66% Consensus Threshold Authorized!');
      }
    }

    /* ------------------------------------------------------------------------
       MILESTONE TASK AUDIT TOGGLE
       ------------------------------------------------------------------------ */
    toggleMilestoneTask(phaseIndex, taskId, isChecked) {
      const phase = this.state.milestones.find(m => m.phaseIndex === phaseIndex);
      if (!phase || phase.status === 'LOCKED') return;

      const task = phase.tasks.find(t => t.id === taskId);
      if (!task) return;

      task.completed = isChecked;

      if (isChecked) {
        task.completedBy = this.currentVoterHandle;
        task.completedAt = Date.now();
        const raw = `${taskId}:${task.completedBy}:${task.completedAt}`;
        task.auditSeal = '0x' + Array.from(raw).reduce((h, c) => Math.imul(31, h) + c.charCodeAt(0) | 0, 0).toString(16).toUpperCase();
        this.showToast(`Task verified: ${task.title}`);
      } else {
        task.completedBy = null;
        task.completedAt = null;
        task.auditSeal = null;
      }

      // Check if all tasks in phase are finished
      const allTasksDone = phase.tasks.every(t => t.completed);
      if (allTasksDone) {
        phase.status = 'COMPLETED';
        phase.completedAt = Date.now();
        // Unlock next phase if available
        const nextPhase = this.state.milestones.find(m => m.phaseIndex === phaseIndex + 1);
        if (nextPhase && nextPhase.status === 'LOCKED') {
          nextPhase.status = 'IN_PROGRESS';
          nextPhase.unlockedAt = Date.now();
          this.showToast(`MILESTONE ADVANCED: ${nextPhase.phaseTitle} unlocked!`);

          window.dispatchEvent(new CustomEvent('nex:milestone:advanced', {
            detail: { phaseId: nextPhase.phaseId, phaseTitle: nextPhase.phaseTitle }
          }));
        }
      } else {
        phase.status = 'IN_PROGRESS';
      }

      this.saveState();
      this.render();
    }

    /* ------------------------------------------------------------------------
       DOM RENDERING ENGINE
       ------------------------------------------------------------------------ */
    render() {
      const hud = document.getElementById('nexQuorumHud');
      if (!hud) return;

      hud.style.display = 'flex';
      this.renderQuorumCard();
      this.renderMilestonesTrack();
    }

    renderQuorumCard() {
      const proposal = this.state.currentProposal;
      if (!proposal) return;

      const missionNameEl = document.getElementById('quorumMissionCodename');
      const statusBadge = document.getElementById('quorumStatusBadge');
      const thresholdLabel = document.getElementById('quorumThresholdLabel');
      const ratioAffirmative = document.getElementById('ratioFillAffirmative');
      const ratioNegative = document.getElementById('ratioFillNegative');
      const statYes = document.getElementById('statAffirmativeCount');
      const statNo = document.getElementById('statNegativeCount');
      const mySealBadge = document.getElementById('ballotSealHash');

      if (missionNameEl) missionNameEl.textContent = this.state.missionCodename;
      if (thresholdLabel) thresholdLabel.textContent = `${proposal.targetThresholdPercent}% SUPERMAJORITY`;

      const ballots = Object.values(proposal.ballots);
      const totalEligible = proposal.totalEligibleOperatives || 6;
      const yesVotes = ballots.filter(b => b.choice === 'AFFIRMATIVE').length;
      const noVotes = ballots.filter(b => b.choice === 'NEGATIVE').length;

      const yesPct = Math.round((yesVotes / totalEligible) * 100);
      const noPct = Math.round((noVotes / totalEligible) * 100);

      if (ratioAffirmative) ratioAffirmative.style.width = `${yesPct}%`;
      if (ratioNegative) ratioNegative.style.width = `${noPct}%`;

      if (statYes) statYes.textContent = `${yesVotes} YES (${yesPct}%)`;
      if (statNo) statNo.textContent = `${noVotes} NO (${noPct}%)`;

      // Status Badge
      if (statusBadge) {
        statusBadge.className = 'quorum-status-pill ' + (proposal.status === 'CONSENSUS_REACHED' ? 'locked' : 'pending');
        statusBadge.textContent = proposal.status === 'CONSENSUS_REACHED' ? 'CONSENSUS LOCKED' : 'VOTING ACTIVE';
      }

      // My Ballot Seal
      const myBallot = proposal.ballots[this.currentVoterUid];
      if (mySealBadge) {
        mySealBadge.textContent = myBallot ? myBallot.ballotSeal : 'NOT CAST';
      }

      // Update Active Vote Buttons
      document.querySelectorAll('.quorum-vote-btn').forEach(btn => {
        btn.classList.toggle('active', myBallot && myBallot.choice === btn.dataset.vote);
      });

      // Roster Rendering
      const rosterGrid = document.getElementById('quorumRosterGrid');
      const rosterCount = document.getElementById('rosterCountText');
      if (rosterGrid) {
        rosterGrid.innerHTML = ballots.map(b => `
          <div class="roster-pill">
            <span class="voter-name">@${escapeHtml(b.voterHandle)}</span>
            <span class="voter-choice ${b.choice}">${b.choice}</span>
          </div>
        `).join('');
      }
      if (rosterCount) {
        rosterCount.textContent = `${ballots.length} / ${totalEligible} PARTICIPATING`;
      }
    }

    renderMilestonesTrack() {
      const stepperRow = document.getElementById('milestonesStepperRow');
      const activePhase = this.state.milestones.find(m => m.status === 'IN_PROGRESS') || this.state.milestones[0];
      const statsEl = document.getElementById('milestonesTrackStats');

      if (statsEl && activePhase) {
        statsEl.textContent = `PHASE ${activePhase.phaseIndex} OF ${this.state.milestones.length} ACTIVE`;
      }

      if (stepperRow) {
        stepperRow.innerHTML = this.state.milestones.map((m, idx) => `
          <div class="milestone-step-card ${m.status.toLowerCase()}" data-phase="${m.phaseIndex}">
            <div class="step-badge">
              <span class="step-num">0${m.phaseIndex}</span>
              <i class="fa-solid ${m.status === 'COMPLETED' ? 'fa-check' : m.status === 'IN_PROGRESS' ? 'fa-angles-right' : 'fa-lock'}"></i>
            </div>
            <div class="step-body">
              <div class="step-title">${escapeHtml(m.phaseTitle)}</div>
              <div class="step-status">${m.status.replace('_', ' ')}</div>
            </div>
          </div>
          ${idx < this.state.milestones.length - 1 ? `<div class="milestone-connector ${m.status === 'COMPLETED' ? 'active' : ''}"></div>` : ''}
        `).join('');
      }

      // Tasks Checklist of Active Phase
      const tasksList = document.getElementById('milestoneTasksList');
      if (tasksList && activePhase) {
        tasksList.innerHTML = activePhase.tasks.map(t => `
          <div class="milestone-task-item">
            <input type="checkbox" class="task-check" ${t.completed ? 'checked' : ''} data-phase-idx="${activePhase.phaseIndex}" data-task-id="${t.id}">
            <div>
              <div class="task-desc ${t.completed ? 'completed' : ''}">${escapeHtml(t.title)}</div>
              ${t.completed ? `
                <div class="task-audit-tag">
                  <i class="fa-solid fa-circle-check"></i>
                  <span>AUDITED BY @${escapeHtml(t.completedBy || 'Operator')} [${t.auditSeal || '0xVERIFIED'}]</span>
                </div>
              ` : ''}
            </div>
          </div>
        `).join('');

        tasksList.querySelectorAll('.task-check').forEach(chk => {
          chk.addEventListener('change', (e) => {
            const pIdx = parseInt(e.target.dataset.phaseIdx, 10);
            const tId = e.target.dataset.taskId;
            this.toggleMilestoneTask(pIdx, tId, e.target.checked);
          });
        });
      }
    }

    bindEvents() {
      // Voting Button clicks
      document.querySelectorAll('.quorum-vote-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const choice = btn.dataset.vote;
          if (choice) this.castBallot(choice);
        });
      });

      // Toggle Roster Accordion
      document.getElementById('btnToggleQuorumDetails')?.addEventListener('click', () => {
        const roster = document.getElementById('quorumBallotsRoster');
        if (roster) {
          roster.style.display = roster.style.display === 'none' ? 'flex' : 'none';
        }
      });
    }

    showToast(msg) {
      if (typeof window.showToast === 'function') {
        window.showToast(msg);
      } else {
        console.log(`[QUORUM MATRIX]: ${msg}`);
      }
    }
  }

  // Register in global namespace hierarchy
  if (typeof window !== 'undefined') {
    if (!window.NexPinboardManager) {
      window.NexPinboardManager = {};
    }
    window.NexPinboardManager.QuorumMatrix = new QuorumMilestoneMatrix();
  }
})();