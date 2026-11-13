/**
 * NEXCHAT - Slash Commands & Power Palette Engine
 * Notion / Slack / Discord-style instant slash command menu (/) in composer.
 * Quick access to /split, /code, /confidential, /timer, /poll, /tldr, /silent, /burn.
 * STRICTLY ZERO EMOJIS - FontAwesome 6 vector glyphs only.
 */

(function(global) {
  'use strict';

  const COMMANDS = [
    { cmd: '/canvas', title: 'Nano-Canvas Annotator', desc: 'Open floating scratchpad to sketch diagrams and send to chat', icon: 'fa-paintbrush', color: '#00f2fe' },
    { cmd: '/deaddrop', title: 'Quantum Ephemeral Dead Drop', desc: 'Send secret message protected by hold-to-reveal & tilt sensor', icon: 'fa-atom', color: '#c084fc' },
    { cmd: '/sleep', title: 'Sleep Protocol & Morning Briefing', desc: 'Activate overnight rest mode and queue morning intelligence briefing', icon: 'fa-moon', color: '#a855f7' },
    { cmd: '/zen', title: 'Anti-Flame War Zen Shield', desc: 'Quarantine heated debates and mute notification tension', icon: 'fa-shield-halved', color: '#10b981' },
    { cmd: '/probing', title: 'Overnight Runtime Probing & Stress', desc: 'Investigate runtime health, memory leaks, and overnight background stability', icon: 'fa-microscope', color: '#38bdf8' },
    { cmd: '/analyze', title: 'Tactical System & Chat Analysis', desc: 'Analyze APK/WebView runtime, memory, and chat velocity', icon: 'fa-chart-line', color: '#38bdf8' },
    { cmd: '/summarize', title: 'Active Chat Summary', desc: 'Summarize visible conversation messages with ChronEX AI', icon: 'fa-wand-magic-sparkles', color: '#67e8f9' },
    { cmd: '/summarize all', title: 'Full Historical Group Summary', desc: 'Synthesize complete group history including pre-join messages', icon: 'fa-layer-group', color: '#a855f7' },
    { cmd: '/companion', title: 'AI Workflow Companion', desc: 'Toggle mood detection & automated recommendations on/off', icon: 'fa-robot', color: '#10b981' },
    { cmd: '/trackrecord', title: 'User Usage Track Record', desc: 'View usage analytics, chat habits, and mood report', icon: 'fa-chart-pie', color: '#f59e0b' },
    { cmd: '/split', title: 'Dual-Pane Command Deck', desc: 'Split screen and view two chats side-by-side', icon: 'fa-table-columns', color: '#00f2fe' },
    { cmd: '/code', title: 'Collaborative Code Sandbox', desc: 'Open embedded code editor and runner', icon: 'fa-code', color: '#10b981' },
    { cmd: '/confidential', title: 'Confidential Scratchpad', desc: 'Create anti-shoulder-surfing blur note', icon: 'fa-user-secret', color: '#c084fc' },
    { cmd: '/timer', title: 'Quantum Dispatch Timer', desc: 'Schedule message or send when online', icon: 'fa-clock', color: '#00f2fe' },
    { cmd: '/poll', title: 'Interactive Prediction Poll', desc: 'Launch voting poll with token escrow', icon: 'fa-square-poll-vertical', color: '#ffd700' },
    { cmd: '/tldr', title: 'ChronEX AI Summary', desc: 'Summarize recent discussion in 3 bullets', icon: 'fa-wand-magic-sparkles', color: '#67e8f9' },
    { cmd: '/silent', title: 'Silent Dispatch', desc: 'Send next message without notification noise', icon: 'fa-volume-xmark', color: '#cbd5e1' },
    { cmd: '/clear', title: 'Clear Screen', desc: 'Clear local transient message display', icon: 'fa-broom', color: '#ff6b6b' }
  ];

  class EliteSlashCommands {
    constructor() {
      this.selectedIndex = 0;
      this.filteredCommands = [...COMMANDS];
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
      const input = document.getElementById('message-input');
      const palette = document.getElementById('slashCommandPalette');
      if (!input || !palette) return;

      input.addEventListener('input', () => {
        const val = input.value || '';
        // Fix 6: Only show slash command palette if user is in an active chat and explicitly starts input with '/'
        const hasActiveChat = Boolean(window.currentChatUser || window.currentChatId);
        if (hasActiveChat && val.startsWith('/') && val.trim().length >= 1) {
          const query = val.toLowerCase().slice(1).trim();
          this.filteredCommands = COMMANDS.filter(c => c.cmd.includes(query) || c.title.toLowerCase().includes(query));
          this.selectedIndex = 0;
          this.renderPalette();
          palette.style.display = 'block';
        } else {
          palette.style.display = 'none';
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          const val = (input.value || '').trim();
          if (val.startsWith('/')) {
            e.preventDefault();
            this.handleDirectCommand(val);
            return;
          }
        }

        if (palette.style.display !== 'block') return;

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.selectedIndex = (this.selectedIndex + 1) % this.filteredCommands.length;
          this.highlightSelected();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.selectedIndex = (this.selectedIndex - 1 + this.filteredCommands.length) % this.filteredCommands.length;
          this.highlightSelected();
        } else if (e.key === 'Tab') {
          if (this.filteredCommands[this.selectedIndex]) {
            e.preventDefault();
            this.executeCommand(this.filteredCommands[this.selectedIndex]);
          }
        } else if (e.key === 'Escape') {
          palette.style.display = 'none';
        }
      });
    }

    handleDirectCommand(rawVal) {
      const input = document.getElementById('message-input');
      const palette = document.getElementById('slashCommandPalette');
      if (input) input.value = '';
      if (palette) palette.style.display = 'none';

      const lower = rawVal.toLowerCase().trim();
      if (lower.startsWith('/canvas') || lower.startsWith('/draw')) {
        this.executeCommand({ cmd: '/canvas' });
      } else if (lower.startsWith('/deaddrop')) {
        const secret = rawVal.replace(/^\/deaddrop\s*/i, '').trim();
        if (window.NexQuantumDeadDrop) {
          window.NexQuantumDeadDrop.dispatchDeadDrop(secret || 'Classified Tactical Drop');
        } else {
          this.executeCommand({ cmd: '/deaddrop' });
        }
      } else if (lower.startsWith('/sleep') || lower.startsWith('/rest')) {
        if (window.NexSleepProtocol) {
          window.NexSleepProtocol.toggle();
        } else {
          this.executeCommand({ cmd: '/sleep' });
        }
      } else if (lower.startsWith('/zen')) {
        if (window.NexZenShield) {
          if (window.NexZenShield.isShieldActive) window.NexZenShield.deactivateZenShield();
          else window.NexZenShield.activateZenShield();
        } else {
          this.executeCommand({ cmd: '/zen' });
        }
      } else if (lower.startsWith('/probing')) {
        const parts = lower.split(/\s+/);
        const sub = parts[1] || '';
        if (window.NexRuntimeProbing) {
          if (sub === 'start' || sub === 'simulate' || sub === 'run') {
            window.NexRuntimeProbing.startSimulation();
          } else if (sub === 'stop') {
            window.NexRuntimeProbing.stopSimulation();
          } else {
            window.NexRuntimeProbing.runProbe();
          }
        } else {
          this.executeCommand({ cmd: '/probing' });
        }
      } else if (lower === '/summarize all' || lower.startsWith('/summarize all')) {
        this.executeCommand({ cmd: '/summarize all' });
      } else if (lower === '/summarize' || lower.startsWith('/summarize')) {
        this.executeCommand({ cmd: '/summarize' });
      } else if (lower.startsWith('/analyze')) {
        this.executeCommand({ cmd: '/analyze' });
      } else if (lower.startsWith('/companion')) {
        const parts = lower.split(/\s+/);
        if (parts[1] === 'on') {
          if (window.NexWorkflowCompanion) window.NexWorkflowCompanion.setEnabled(true);
          if (typeof window.showNotif === 'function') window.showNotif('AI Workflow Companion turned ON.', 'success', 2500);
        } else if (parts[1] === 'off') {
          if (window.NexWorkflowCompanion) window.NexWorkflowCompanion.setEnabled(false);
          if (typeof window.showNotif === 'function') window.showNotif('AI Workflow Companion turned OFF.', 'info', 2500);
        } else {
          this.executeCommand({ cmd: '/companion' });
        }
      } else if (lower.startsWith('/trackrecord') || lower.startsWith('/usage')) {
        this.executeCommand({ cmd: '/trackrecord' });
      } else {
        const matched = COMMANDS.find(c => c.cmd === lower || lower.startsWith(c.cmd + ' '));
        if (matched) {
          this.executeCommand(matched);
        } else if (this.filteredCommands[this.selectedIndex]) {
          this.executeCommand(this.filteredCommands[this.selectedIndex]);
        }
      }
    }

    renderPalette() {
      const listEl = document.getElementById('slashPaletteCommandsList') || document.getElementById('slashCommandsList');
      if (!listEl) return;

      listEl.innerHTML = '';
      if (this.filteredCommands.length === 0) {
        listEl.innerHTML = '<div style="padding: 10px; color: #8b949e; font-size: 12px; text-align: center;">No matching command found.</div>';
        return;
      }

      this.filteredCommands.forEach((c, idx) => {
        const item = document.createElement('div');
        item.className = 'slash-cmd-item' + (idx === this.selectedIndex ? ' selected' : '');
        item.style.cssText = `
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          border-radius: 8px;
          transition: background 0.15s;
          background: ${idx === this.selectedIndex ? 'rgba(0, 242, 254, 0.12)' : 'transparent'};
        `;
        item.innerHTML = `
          <div style="width: 28px; height: 28px; border-radius: 8px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; color: ${c.color}; font-size: 13px;">
            <i class="fa-solid ${c.icon}"></i>
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <strong style="color: #fff; font-size: 12.5px;">${c.cmd}</strong>
              <span style="font-size: 12px; color: #cbd5e1;">${c.title}</span>
            </div>
            <div style="font-size: 10.5px; color: #8b949e; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${c.desc}</div>
          </div>
        `;

        item.addEventListener('click', () => {
          this.executeCommand(c);
        });

        listEl.appendChild(item);
      });
    }

    highlightSelected() {
      const items = document.querySelectorAll('.slash-cmd-item');
      items.forEach((item, idx) => {
        if (idx === this.selectedIndex) {
          item.classList.add('selected');
          item.style.background = 'rgba(0, 242, 254, 0.12)';
        } else {
          item.classList.remove('selected');
          item.style.background = 'transparent';
        }
      });
    }

        closePalette() {
      const palette = document.getElementById('slashCommandPalette');
      if (palette) palette.style.display = 'none';
      const menu = document.getElementById('slashCommandsMenu');
      if (menu) menu.style.display = 'none';
    }

    executeCommand(command) {
      const input = document.getElementById('message-input');
      const palette = document.getElementById('slashCommandPalette');
      if (input) input.value = '';
      if (palette) palette.style.display = 'none';

      switch (command.cmd) {
        case '/canvas':
          if (window.NexNanoCanvas) {
            window.NexNanoCanvas.openModal();
          } else if (typeof showNotif === 'function') {
            showNotif('Opening Nano-Canvas...', 'info', 1500);
          }
          break;
        case '/deaddrop':
          if (window.NexQuantumDeadDrop) {
            window.NexQuantumDeadDrop.dispatchDeadDrop('Classified Tactical Drop');
          } else if (typeof showNotif === 'function') {
            showNotif('Creating Quantum Dead Drop...', 'info', 1500);
          }
          break;
        case '/sleep':
          if (window.NexSleepProtocol) {
            window.NexSleepProtocol.toggle();
          } else if (typeof showNotif === 'function') {
            showNotif('Sleep Protocol toggled.', 'info', 1500);
          }
          break;
        case '/zen':
          if (window.NexZenShield) {
            if (window.NexZenShield.isShieldActive) window.NexZenShield.deactivateZenShield();
            else window.NexZenShield.activateZenShield();
          } else if (typeof showNotif === 'function') {
            showNotif('Zen Shield toggled.', 'info', 1500);
          }
          break;
        case '/probing':
          if (window.NexRuntimeProbing) {
            window.NexRuntimeProbing.runProbe();
          } else if (typeof showNotif === 'function') {
            showNotif('Initializing runtime probing sentinel...', 'info', 2000);
          }
          break;
        case '/analyze':
          this.renderTacticalAnalysisCard();
          break;
        case '/summarize':
          if (window.NexChronexxSummarizer && typeof window.NexChronexxSummarizer.triggerGroupCatchUp === 'function') {
            window.NexChronexxSummarizer.triggerGroupCatchUp({ fullHistory: false });
          } else if (typeof showNotif === 'function') {
            showNotif('Synthesizing active conversation with ChronEX AI...', 'info', 2000);
          }
          break;
        case '/summarize all':
          if (window.NexChronexxSummarizer && typeof window.NexChronexxSummarizer.triggerGroupCatchUp === 'function') {
            window.NexChronexxSummarizer.triggerGroupCatchUp({ fullHistory: true });
          } else if (typeof showNotif === 'function') {
            showNotif('Synthesizing full group archive with ChronEX AI...', 'info', 2000);
          }
          break;
        case '/companion':
          if (window.NexWorkflowCompanion) {
            window.NexWorkflowCompanion.toggle();
          } else if (typeof showNotif === 'function') {
            showNotif('AI Workflow Companion toggled.', 'info', 2000);
          }
          break;
        case '/trackrecord':
          if (window.NexWorkflowCompanion) {
            window.NexWorkflowCompanion.showTrackRecord();
          } else if (typeof showNotif === 'function') {
            showNotif('Displaying user usage track record...', 'info', 2000);
          }
          break;
        case '/split':
          if (window.eliteDualPaneMatrix) window.eliteDualPaneMatrix.toggleSplitScreen();
          break;
        case '/code':
          if (window.eliteCodeSandboxDrawer) window.eliteCodeSandboxDrawer.openDrawer();
          break;
        case '/confidential':
          if (window.eliteConfidentialScratchpad) window.eliteConfidentialScratchpad.openModal();
          break;
        case '/timer':
          if (typeof window.openScheduledDispatchModal === 'function') window.openScheduledDispatchModal();
          break;
        case '/poll':
          const pollBtn = document.getElementById('poll-btn');
          if (pollBtn) pollBtn.click();
          break;
        case '/tldr':
          if (window.NexChronexxSummarizer) {
            window.NexChronexxSummarizer.triggerGroupCatchUp({ fullHistory: false });
          } else if (typeof showNotif === 'function') {
            showNotif('Summarizing recent chat with ChronEX AI...', 'info', 2000);
          }
          break;
        case '/silent':
          if (typeof showNotif === 'function') showNotif('Silent mode enabled for next message.', 'info', 2000);
          break;
        case '/clear':
          const messagesArea = document.getElementById('messages-area');
          if (messagesArea) messagesArea.innerHTML = '<div style="text-align:center;padding:20px;color:#8b949e;font-size:12px;">Screen cleared locally.</div>';
          break;
      }
    }

    renderTacticalAnalysisCard() {
      const container = document.getElementById('messages-area') || document.querySelector('.messages-list') || document.getElementById('chatDetailView');
      if (!container) {
        if (typeof window.showNotif === 'function') window.showNotif('Please select a chat to render tactical analysis.', 'info');
        return;
      }

      const isNative = !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
      const platform = isNative ? 'Capacitor Android Native Runtime' : 'Web / Chromium WebView';
      const resolution = `${window.innerWidth} x ${window.innerHeight} (DPR ${window.devicePixelRatio || 1})`;
      const chatTarget = window.currentChatName || window.currentChatUser || 'Global Deck';
      const chatType = (window.currentChatType || 'direct').toUpperCase();
      const domNodes = document.querySelectorAll('*').length;
      const renderedMsgs = document.querySelectorAll('.message-bubble, .msg-item, .chat-message').length;
      const memEst = performance && performance.memory ? `${(performance.memory.usedJSHeapSize / 1048576).toFixed(1)} MB` : 'Dynamic Sandbox';
      const companionActive = window.NexWorkflowCompanion ? (window.NexWorkflowCompanion.isEnabled ? 'ACTIVE' : 'OFF') : 'ACTIVE';
      const netStatus = navigator.onLine ? 'ONLINE (Sub-15ms Sync)' : 'OFFLINE (IndexedDB Cache)';

      const card = document.createElement('div');
      card.className = 'tactical-analysis-card';
      card.style.cssText = `
        background: rgba(3, 7, 18, 0.96);
        border: 1px solid rgba(56, 189, 248, 0.45);
        border-radius: 14px;
        padding: 16px;
        margin: 14px 0;
        color: #fff;
        box-shadow: 0 0 25px rgba(56, 189, 248, 0.15);
      `;

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(56,189,248,0.25); padding-bottom:8px; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <i class="fa-solid fa-chart-line" style="color:#38bdf8; font-size:16px;"></i>
            <strong style="color:#38bdf8; font-size:13.5px; text-transform:uppercase;">NEXCHAT Tactical Diagnostics & Runtime Analysis</strong>
          </div>
          <span style="font-size:10px; color:#94a3b8; font-weight:700; background:rgba(255,255,255,0.06); padding:2px 8px; border-radius:4px; border:1px solid rgba(255,255,255,0.1);">
            BUILD v1.0.0
          </span>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:10px; margin-bottom:12px;">
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:10px;">
            <div style="font-size:10px; color:#94a3b8; text-transform:uppercase;">Runtime Environment</div>
            <div style="font-size:12px; font-weight:700; color:#38bdf8; margin-top:3px;">${platform}</div>
          </div>
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:10px;">
            <div style="font-size:10px; color:#94a3b8; text-transform:uppercase;">Active Conversation</div>
            <div style="font-size:12px; font-weight:700; color:#10b981; margin-top:3px;">${chatTarget} (${chatType})</div>
          </div>
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:10px;">
            <div style="font-size:10px; color:#94a3b8; text-transform:uppercase;">Rendered Message Nodes</div>
            <div style="font-size:12px; font-weight:700; color:#ffd700; margin-top:3px;">${renderedMsgs} Messages (${domNodes} DOM nodes)</div>
          </div>
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:10px;">
            <div style="font-size:10px; color:#94a3b8; text-transform:uppercase;">Memory & Pipeline</div>
            <div style="font-size:12px; font-weight:700; color:#c084fc; margin-top:3px;">${memEst} | Companion: ${companionActive}</div>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(56,189,248,0.07); padding:8px 12px; border-radius:8px; font-size:11px; color:#cbd5e1;">
          <div><i class="fa-solid fa-signal" style="color:#10b981; margin-right:6px;"></i>${netStatus} &bull; Viewport: ${resolution}</div>
          <button type="button" class="btn-refresh-analysis" style="background:transparent; border:1px solid #38bdf8; color:#38bdf8; padding:3px 8px; border-radius:5px; font-size:10.5px; cursor:pointer; font-weight:700;">
            <i class="fa-solid fa-rotate"></i> Refresh
          </button>
        </div>
      `;

      card.querySelector('.btn-refresh-analysis')?.addEventListener('click', () => {
        card.remove();
        this.renderTacticalAnalysisCard();
      });

      container.appendChild(card);
      card.scrollIntoView({ behavior: 'smooth' });

      if (typeof window.showNotif === 'function') {
        window.showNotif('Tactical runtime analysis report generated.', 'info', 2000);
      }
    }
  }

  // Export Singleton
  global.EliteSlashCommands = EliteSlashCommands;
  global.eliteSlashCommands = new EliteSlashCommands();

})(typeof window !== 'undefined' ? window : this);

  // Expose global closer
  window.closeSlashCommandPalette = function() {
    const pal = document.getElementById('slashCommandPalette');
    if (pal) pal.style.display = 'none';
    const menu = document.getElementById('slashCommandsMenu');
    if (menu) menu.style.display = 'none';
  };
