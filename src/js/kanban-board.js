/**
 * NEXCHAT - In-Chat Tactical Kanban Mission Board & Milestone Tracker
 * Interactive sprint task board for agile operations with drag-and-drop progression,
 * operative assignment, and milestone completion events.
 * STRICTLY NO EMOJIS: Clean cyberpunk typography and FontAwesome icons.
 */

(function() {
  'use strict';

  class KanbanBoardEngine {
    constructor() {
      this.missions = new Map();
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
    }

    injectModal() {
      if (document.getElementById('kanbanBoardModal')) return;

      const modal = document.createElement('div');
      modal.id = 'kanbanBoardModal';
      modal.className = 'cyber-modal-backdrop';
      modal.style.display = 'none';

      modal.innerHTML = `
        <div class="cyber-modal-window kanban-modal-window">
          <div class="cyber-modal-header">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-table-columns text-[#00f3ff] text-lg"></i>
              <h3 class="font-bold text-white text-base">TACTICAL MISSION KANBAN</h3>
              <span class="kanban-badge">SPRINT MATRIX</span>
            </div>
            <button type="button" class="cyber-modal-close" id="closeKanbanModalBtn"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="kanban-modal-body">
            <div class="kanban-creator-bar">
              <div class="flex gap-2 flex-wrap sm:flex-nowrap">
                <input type="text" id="kanbanTaskTitleInput" class="kanban-input flex-1" placeholder="Task Objective: e.g. Audit Zero-Day Kernel Patch" />
                <select id="kanbanTaskPrioritySelect" class="kanban-select w-36">
                  <option value="CRITICAL">CRITICAL PRIORITY</option>
                  <option value="HIGH" selected>HIGH PRIORITY</option>
                  <option value="NOMINAL">NOMINAL PRIORITY</option>
                </select>
                <button type="button" class="kanban-add-btn" id="kanbanCreateTaskBtn">
                  <i class="fa-solid fa-plus"></i> ADD TASK
                </button>
              </div>
            </div>

            <div class="kanban-columns-container mt-4">
              <!-- Backlog Column -->
              <div class="kanban-column" data-col="backlog">
                <div class="kanban-col-header">
                  <div class="flex items-center gap-1.5">
                    <span class="kanban-col-indicator backlog"></span>
                    <span class="kanban-col-title">BACKLOG</span>
                  </div>
                  <span class="kanban-col-count" id="countBacklog">2</span>
                </div>
                <div class="kanban-cards-wrapper" id="colBacklogCards">
                  <div class="kanban-card" data-id="tsk_1">
                    <div class="kanban-card-pri high">HIGH</div>
                    <div class="kanban-card-title">Setup encrypted mesh relay nodes</div>
                    <div class="kanban-card-meta">
                      <span class="text-gray-400"><i class="fa-solid fa-user-astronaut"></i> Operative Raven</span>
                      <button type="button" class="kanban-move-btn" onclick="window.kanbanBoardEngine.advanceModalTask('tsk_1', 'in_progress')">
                        <i class="fa-solid fa-chevron-right"></i>
                      </button>
                    </div>
                  </div>
                  <div class="kanban-card" data-id="tsk_2">
                    <div class="kanban-card-pri critical">CRITICAL</div>
                    <div class="kanban-card-title">Patch memory leak in Audio Spectrum Visualizer</div>
                    <div class="kanban-card-meta">
                      <span class="text-gray-400"><i class="fa-solid fa-user-shield"></i> Operative Nova</span>
                      <button type="button" class="kanban-move-btn" onclick="window.kanbanBoardEngine.advanceModalTask('tsk_2', 'in_progress')">
                        <i class="fa-solid fa-chevron-right"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- In Progress Column -->
              <div class="kanban-column" data-col="in_progress">
                <div class="kanban-col-header">
                  <div class="flex items-center gap-1.5">
                    <span class="kanban-col-indicator in-progress"></span>
                    <span class="kanban-col-title">IN PROGRESS</span>
                  </div>
                  <span class="kanban-col-count" id="countInProgress">1</span>
                </div>
                <div class="kanban-cards-wrapper" id="colInProgressCards">
                  <div class="kanban-card" data-id="tsk_3">
                    <div class="kanban-card-pri critical">CRITICAL</div>
                    <div class="kanban-card-title">Deploy Quantum ECDSA P-256 Signatures</div>
                    <div class="kanban-card-meta">
                      <span class="text-gray-400"><i class="fa-solid fa-user-secret"></i> You</span>
                      <button type="button" class="kanban-move-btn" onclick="window.kanbanBoardEngine.advanceModalTask('tsk_3', 'audit')">
                        <i class="fa-solid fa-chevron-right"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Audit Column -->
              <div class="kanban-column" data-col="audit">
                <div class="kanban-col-header">
                  <div class="flex items-center gap-1.5">
                    <span class="kanban-col-indicator audit"></span>
                    <span class="kanban-col-title">UNDER AUDIT</span>
                  </div>
                  <span class="kanban-col-count" id="countAudit">1</span>
                </div>
                <div class="kanban-cards-wrapper" id="colAuditCards">
                  <div class="kanban-card" data-id="tsk_4">
                    <div class="kanban-card-pri nominal">NOMINAL</div>
                    <div class="kanban-card-title">Split chat.css bundle into chat2.css</div>
                    <div class="kanban-card-meta">
                      <span class="text-gray-400"><i class="fa-solid fa-robot"></i> System Sentinel</span>
                      <button type="button" class="kanban-move-btn" onclick="window.kanbanBoardEngine.advanceModalTask('tsk_4', 'deployed')">
                        <i class="fa-solid fa-chevron-right"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Deployed Column -->
              <div class="kanban-column" data-col="deployed">
                <div class="kanban-col-header">
                  <div class="flex items-center gap-1.5">
                    <span class="kanban-col-indicator deployed"></span>
                    <span class="kanban-col-title">DEPLOYED</span>
                  </div>
                  <span class="kanban-col-count" id="countDeployed">1</span>
                </div>
                <div class="kanban-cards-wrapper" id="colDeployedCards">
                  <div class="kanban-card" data-id="tsk_5">
                    <div class="kanban-card-pri nominal">NOMINAL</div>
                    <div class="kanban-card-title">Ghost Panic Decoy Lock verified</div>
                    <div class="kanban-card-meta">
                      <span class="text-[#00ff66]"><i class="fa-solid fa-circle-check"></i> Complete</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="kanban-footer-actions mt-4">
              <button type="button" class="kanban-btn-share" id="shareKanbanToChatBtn">
                <i class="fa-solid fa-paper-plane"></i> DEPLOY SPRINT BOARD CARD TO CHANNEL
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      modal.querySelector('#closeKanbanModalBtn').addEventListener('click', () => this.closeModal());

      modal.querySelector('#kanbanCreateTaskBtn').addEventListener('click', () => {
        const inp = modal.querySelector('#kanbanTaskTitleInput');
        const pri = modal.querySelector('#kanbanTaskPrioritySelect').value;
        const title = inp.value.trim();
        if (!title) return;

        const newId = 'tsk_' + Date.now();
        const cardHtml = `
          <div class="kanban-card" data-id="${newId}">
            <div class="kanban-card-pri ${pri.toLowerCase()}">${pri}</div>
            <div class="kanban-card-title">${this.escapeHtml(title)}</div>
            <div class="kanban-card-meta">
              <span class="text-gray-400"><i class="fa-solid fa-user-secret"></i> You</span>
              <button type="button" class="kanban-move-btn" onclick="window.kanbanBoardEngine.advanceModalTask('${newId}', 'in_progress')">
                <i class="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </div>
        `;
        const wrapper = modal.querySelector('#colBacklogCards');
        wrapper.insertAdjacentHTML('afterbegin', cardHtml);
        inp.value = '';
        this.updateCounts();
      });

      modal.querySelector('#shareKanbanToChatBtn').addEventListener('click', () => {
        this.dispatchBoardToChat();
      });
    }

    injectHubAction() {
      const hubList = document.querySelector('#attachmentHubModal .hub-grid') || 
                      document.querySelector('.attachment-hub-menu') ||
                      document.getElementById('attachmentGrid');
      if (!hubList || document.getElementById('hubActionKanban')) return;

      const item = document.createElement('div');
      item.id = 'hubActionKanban';
      item.className = 'hub-action-item';
      item.innerHTML = `
        <div class="hub-action-icon"><i class="fa-solid fa-table-columns text-[#00f3ff]"></i></div>
        <div class="hub-action-label">Kanban Board</div>
      `;
      item.addEventListener('click', () => {
        const hubModal = document.getElementById('attachmentHubModal');
        if (hubModal) hubModal.style.display = 'none';
        this.openModal();
      });
      hubList.appendChild(item);
    }

    openModal() {
      const modal = document.getElementById('kanbanBoardModal');
      if (!modal) return;
      modal.style.display = 'flex';
      this.updateCounts();
    }

    closeModal() {
      const modal = document.getElementById('kanbanBoardModal');
      if (modal) modal.style.display = 'none';
    }

    advanceModalTask(taskId, targetCol) {
      const modal = document.getElementById('kanbanBoardModal');
      if (!modal) return;
      const card = modal.querySelector(`[data-id="${taskId}"]`);
      if (!card) return;

      let nextColId = 'colBacklogCards';
      let nextTarget = 'in_progress';

      if (targetCol === 'in_progress') {
        nextColId = 'colInProgressCards';
        nextTarget = 'audit';
      } else if (targetCol === 'audit') {
        nextColId = 'colAuditCards';
        nextTarget = 'deployed';
      } else if (targetCol === 'deployed') {
        nextColId = 'colDeployedCards';
        nextTarget = null;
      }

      const targetWrapper = modal.querySelector(`#${nextColId}`);
      if (targetWrapper) {
        targetWrapper.appendChild(card);
        const metaBtn = card.querySelector('.kanban-move-btn');
        if (metaBtn) {
          if (nextTarget) {
            metaBtn.setAttribute('onclick', `window.kanbanBoardEngine.advanceModalTask('${taskId}', '${nextTarget}')`);
          } else {
            metaBtn.remove();
            const metaSpan = card.querySelector('.kanban-card-meta');
            if (metaSpan) {
              metaSpan.innerHTML = `<span class="text-[#00ff66]"><i class="fa-solid fa-circle-check"></i> Complete</span>`;
            }
          }
        }
      }
      this.updateCounts();
    }

    updateCounts() {
      const modal = document.getElementById('kanbanBoardModal');
      if (!modal) return;
      const setCnt = (col, elId) => {
        const cnt = modal.querySelectorAll(`#${col} .kanban-card`).length;
        const el = modal.querySelector(`#${elId}`);
        if (el) el.textContent = cnt;
      };
      setCnt('colBacklogCards', 'countBacklog');
      setCnt('colInProgressCards', 'countInProgress');
      setCnt('colAuditCards', 'countAudit');
      setCnt('colDeployedCards', 'countDeployed');
    }

    dispatchBoardToChat() {
      const modal = document.getElementById('kanbanBoardModal');
      const cards = [];
      modal.querySelectorAll('.kanban-card').forEach(el => {
        const title = el.querySelector('.kanban-card-title').textContent.trim();
        const pri = el.querySelector('.kanban-card-pri').textContent.trim();
        const col = el.closest('.kanban-column').dataset.col;
        cards.push({ title, pri, col });
      });

      const missionPayload = {
        id: 'msn_' + Date.now().toString(36),
        title: 'TACTICAL SPRINT MATRIX 07',
        tasks: cards.slice(0, 4),
        totalTasks: cards.length,
        timestamp: new Date().toISOString()
      };

      if (typeof window.sendMessageWithAttachment === 'function') {
        window.sendMessageWithAttachment(`[MISSION KANBAN] ${missionPayload.title} (${missionPayload.totalTasks} Tasks)`, {
          isKanbanMission: true,
          kanbanData: missionPayload
        });
      } else if (window.chatApp && typeof window.chatApp.sendMessage === 'function') {
        window.chatApp.sendMessage(`[MISSION KANBAN] ${missionPayload.title} (${missionPayload.totalTasks} Tasks)`, {
          isKanbanMission: true,
          kanbanData: missionPayload
        });
      } else {
        const rawObj = {
          id: 'msg_knb_' + Date.now(),
          sender_id: 'KANBAN_MISSION_AGENT',
          sender_name: 'Tactical Kanban Board',
          content: `[MISSION KANBAN] ${missionPayload.title}`,
          attachment: {
            isKanbanMission: true,
            kanbanData: missionPayload
          },
          created_at: new Date().toISOString()
        };
        if (typeof window.appendLocalSentMessage === 'function') {
          window.appendLocalSentMessage(rawObj);
        }
      }

      this.closeModal();
    }

    renderKanbanBubble(kanbanData) {
      const data = kanbanData || {};
      const tasks = data.tasks || [
        { title: 'Neural Formant Synthesis Node', pri: 'CRITICAL', col: 'in_progress' },
        { title: 'Asymmetric Key Signature Seal', pri: 'HIGH', col: 'backlog' },
        { title: 'Coordinate Geo-Beacon Verification', pri: 'NOMINAL', col: 'deployed' }
      ];

      const card = document.createElement('div');
      card.className = 'kanban-bubble-card';
      card.id = 'bubble_knb_' + (data.id || Date.now());

      let tasksHtml = '';
      tasks.forEach((t, idx) => {
        const colLabel = t.col === 'in_progress' ? 'IN PROGRESS' : (t.col === 'deployed' ? 'DEPLOYED' : (t.col === 'audit' ? 'AUDIT' : 'BACKLOG'));
        const colClass = t.col ? t.col.replace('_', '-') : 'backlog';
        tasksHtml += `
          <div class="kanban-bubble-task-item" id="bubbleTask_${idx}">
            <div class="flex items-center justify-between">
              <span class="kanban-bubble-pri ${t.pri.toLowerCase()}">${t.pri}</span>
              <span class="kanban-bubble-status ${colClass}">${colLabel}</span>
            </div>
            <div class="kanban-bubble-task-title mt-1">${this.escapeHtml(t.title)}</div>
            <div class="kanban-bubble-task-actions mt-1">
              <button type="button" class="kanban-advance-chip" onclick="window.kanbanBoardEngine.cycleBubbleTask('${card.id}', ${idx})">
                <i class="fa-solid fa-arrow-right"></i> ADVANCE
              </button>
            </div>
          </div>
        `;
      });

      card.innerHTML = `
        <div class="kanban-bubble-header">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-table-columns text-[#00f3ff]"></i>
            <span class="font-bold text-white text-xs">${this.escapeHtml(data.title || 'TACTICAL SPRINT BOARD')}</span>
          </div>
          <span class="kanban-bubble-badge">${tasks.length} ACTIVE DIRECTIVES</span>
        </div>

        <div class="kanban-bubble-tasks-list mt-2">
          ${tasksHtml}
        </div>

        <div class="kanban-bubble-footer mt-2">
          <button type="button" class="kanban-open-board-btn" onclick="window.kanbanBoardEngine.openModal()">
            <i class="fa-solid fa-expand"></i> OPEN FULL SPRINT MATRIX
          </button>
        </div>
      `;

      return card;
    }

    cycleBubbleTask(cardId, taskIdx) {
      const card = document.getElementById(cardId);
      if (!card) return;
      const taskItem = card.querySelector(`#bubbleTask_${taskIdx}`);
      if (!taskItem) return;

      const statusSpan = taskItem.querySelector('.kanban-bubble-status');
      const cur = statusSpan.textContent.trim();

      if (cur === 'BACKLOG') {
        statusSpan.textContent = 'IN PROGRESS';
        statusSpan.className = 'kanban-bubble-status in-progress';
      } else if (cur === 'IN PROGRESS') {
        statusSpan.textContent = 'AUDIT';
        statusSpan.className = 'kanban-bubble-status audit';
      } else if (cur === 'AUDIT') {
        statusSpan.textContent = 'DEPLOYED';
        statusSpan.className = 'kanban-bubble-status deployed';
        const advBtn = taskItem.querySelector('.kanban-advance-chip');
        if (advBtn) advBtn.style.display = 'none';
      }
    }

    escapeHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  }

  window.KanbanBoardEngine = KanbanBoardEngine;
  window.kanbanBoardEngine = new KanbanBoardEngine();
})();
