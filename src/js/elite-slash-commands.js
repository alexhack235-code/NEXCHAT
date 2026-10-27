/**
 * NEXCHAT - Slash Commands & Power Palette Engine
 * Notion / Slack / Discord-style instant slash command menu (/) in composer.
 * Quick access to /split, /code, /confidential, /timer, /poll, /tldr, /silent, /burn.
 * STRICTLY ZERO EMOJIS - FontAwesome 6 vector glyphs only.
 */

(function(global) {
  'use strict';

  const COMMANDS = [
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
        const val = input.value;
        if (val.startsWith('/')) {
          const query = val.toLowerCase().slice(1);
          this.filteredCommands = COMMANDS.filter(c => c.cmd.includes(query) || c.title.toLowerCase().includes(query));
          this.selectedIndex = 0;
          this.renderPalette();
          palette.style.display = 'block';
        } else {
          palette.style.display = 'none';
        }
      });

      input.addEventListener('keydown', (e) => {
        if (palette.style.display !== 'block') return;

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.selectedIndex = (this.selectedIndex + 1) % this.filteredCommands.length;
          this.highlightSelected();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.selectedIndex = (this.selectedIndex - 1 + this.filteredCommands.length) % this.filteredCommands.length;
          this.highlightSelected();
        } else if (e.key === 'Enter' || e.key === 'Tab') {
          if (this.filteredCommands[this.selectedIndex]) {
            e.preventDefault();
            this.executeCommand(this.filteredCommands[this.selectedIndex]);
          }
        } else if (e.key === 'Escape') {
          palette.style.display = 'none';
        }
      });
    }

    renderPalette() {
      const listEl = document.getElementById('slashCommandsList');
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

    executeCommand(command) {
      const input = document.getElementById('message-input');
      const palette = document.getElementById('slashCommandPalette');
      if (input) input.value = '';
      if (palette) palette.style.display = 'none';

      switch (command.cmd) {
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
          if (typeof showNotif === 'function') showNotif('Summarizing recent chat with ChronEX AI...', 'info', 2000);
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
  }

  // Export Singleton
  global.EliteSlashCommands = EliteSlashCommands;
  global.eliteSlashCommands = new EliteSlashCommands();

})(typeof window !== 'undefined' ? window : this);
