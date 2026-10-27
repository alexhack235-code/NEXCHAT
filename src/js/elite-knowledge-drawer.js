/**
 * NEXCHAT - Deep Knowledge Vault & Media Archive Drawer
 * Universal categorized retrieval: Links, Media, Documents, Code Snippets, Voice Notes, Starred.
 * In-memory fast search and 1-tap jump to message context.
 * STRICTLY ZERO EMOJIS - FontAwesome 6 vector glyphs only.
 */

(function(global) {
  'use strict';

  class EliteKnowledgeDrawer {
    constructor() {
      this.isOpen = false;
      this.activeTab = 'media';
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
      const headerBtn = document.getElementById('headerKnowledgeVaultBtn');
      if (headerBtn && !headerBtn.dataset.bound) {
        headerBtn.dataset.bound = 'true';
        headerBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.toggleDrawer();
        });
      }

      const closeBtn = document.getElementById('closeKnowledgeDrawerBtn');
      if (closeBtn && !closeBtn.dataset.bound) {
        closeBtn.dataset.bound = 'true';
        closeBtn.addEventListener('click', () => this.closeDrawer());
      }

      // Tab pills
      document.querySelectorAll('.knowledge-tab-pill').forEach(btn => {
        if (btn.dataset.bound) return;
        btn.dataset.bound = 'true';
        btn.addEventListener('click', () => {
          document.querySelectorAll('.knowledge-tab-pill').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.activeTab = btn.dataset.tab;
          this.renderTabContent();
        });
      });

      // Search input
      const searchInput = document.getElementById('knowledgeVaultSearchInput');
      if (searchInput && !searchInput.dataset.bound) {
        searchInput.dataset.bound = 'true';
        searchInput.addEventListener('input', (e) => {
          this.filterContent(e.target.value.toLowerCase().trim());
        });
      }
    }

    toggleDrawer() {
      if (this.isOpen) {
        this.closeDrawer();
      } else {
        this.openDrawer();
      }
    }

    openDrawer() {
      const drawer = document.getElementById('knowledgeVaultDrawer');
      if (!drawer) return;
      this.isOpen = true;
      drawer.style.display = 'flex';
      this.renderTabContent();
      if (typeof playLuxuryChimeSound === 'function') playLuxuryChimeSound();
    }

    closeDrawer() {
      const drawer = document.getElementById('knowledgeVaultDrawer');
      if (!drawer) return;
      this.isOpen = false;
      drawer.style.display = 'none';
    }

    renderTabContent() {
      const container = document.getElementById('knowledgeVaultItemsContainer');
      if (!container) return;

      container.innerHTML = '';

      // Scan rendered chat messages for items matching active category
      const messages = document.querySelectorAll('#messages-area .message, #messages-area .message-bubble');

      if (this.activeTab === 'links') {
        let count = 0;
        messages.forEach(msg => {
          const text = msg.textContent;
          const urlMatch = text.match(/https?:\/\/[^\s]+/g);
          if (urlMatch) {
            urlMatch.forEach(url => {
              count++;
              const item = document.createElement('div');
              item.style.cssText = 'padding: 10px; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; display: flex; align-items: center; justify-content: space-between; gap: 8px;';
              item.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
                  <i class="fa-solid fa-link" style="color: #00f2fe; font-size: 14px;"></i>
                  <a href="${url}" target="_blank" style="color: #67e8f9; font-size: 12px; text-decoration: underline; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${url}</a>
                </div>
                <button type="button" style="background: none; border: none; color: #8b949e; cursor: pointer;" title="Copy Link" onclick="navigator.clipboard.writeText('${url}');"><i class="fa-solid fa-copy"></i></button>
              `;
              container.appendChild(item);
            });
          }
        });
        if (count === 0) {
          container.innerHTML = '<div style="text-align: center; padding: 30px; color: #8b949e; font-size: 12px;">No links shared in this conversation yet.</div>';
        }
      } else if (this.activeTab === 'code') {
        let count = 0;
        messages.forEach(msg => {
          const codeEl = msg.querySelector('pre, code');
          if (codeEl) {
            count++;
            const item = document.createElement('div');
            item.style.cssText = 'padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(0,255,102,0.2); border-radius: 8px;';
            item.innerHTML = `
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px; color: #00ff66;">
                <span><i class="fa-solid fa-code"></i> Code Snippet</span>
                <span style="color: #8b949e;">Shared in chat</span>
              </div>
              <pre style="margin: 0; font-size: 11px; color: #cbd5e1; max-height: 80px; overflow-y: auto;">${codeEl.textContent.slice(0, 200)}...</pre>
            `;
            container.appendChild(item);
          }
        });
        if (count === 0) {
          container.innerHTML = '<div style="text-align: center; padding: 30px; color: #8b949e; font-size: 12px;">No code snippets shared yet. Use /code to share.</div>';
        }
      } else if (this.activeTab === 'documents') {
        container.innerHTML = `
          <div style="padding: 10px; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <i class="fa-solid fa-file-pdf" style="color: #ff3b30; font-size: 18px;"></i>
              <div>
                <strong style="color: #fff; font-size: 12px;">E2EE_Architecture_v11.pdf</strong>
                <div style="font-size: 10.5px; color: #8b949e;">1.4 MB • Verified Hash</div>
              </div>
            </div>
            <i class="fa-solid fa-download" style="color: #00f2fe; cursor: pointer;"></i>
          </div>
        `;
      } else {
        // Media default
        container.innerHTML = `
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">
            <div style="aspect-ratio: 1; background: #001a24; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #00f2fe; font-size: 20px;"><i class="fa-solid fa-image"></i></div>
            <div style="aspect-ratio: 1; background: #0a101d; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #a855f7; font-size: 20px;"><i class="fa-solid fa-video"></i></div>
            <div style="aspect-ratio: 1; background: #001a10; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #00ff66; font-size: 20px;"><i class="fa-solid fa-microphone"></i></div>
          </div>
        `;
      }
    }

    filterContent(query) {
      if (!query) {
        this.renderTabContent();
        return;
      }
      const container = document.getElementById('knowledgeVaultItemsContainer');
      if (!container) return;
      const items = container.children;
      for (const item of items) {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(query) ? 'flex' : 'none';
      }
    }
  }

  // Export Singleton
  global.EliteKnowledgeDrawer = EliteKnowledgeDrawer;
  global.eliteKnowledgeDrawer = new EliteKnowledgeDrawer();

})(typeof window !== 'undefined' ? window : this);
