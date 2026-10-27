/**
 * NEXCHAT - Message Revision Audit Trail & Git-Style Diff Engine
 * Tracks edit history timestamps, computes word-level additions/deletions,
 * and renders high-fidelity visual diff comparisons for full professional accountability.
 * STRICTLY ZERO EMOJIS - FontAwesome 6 vector icons only.
 */

(function(global) {
  'use strict';

  const REVISIONS_STORAGE_KEY = 'nexchat_message_revisions_vault';

  class EliteRevisionDiffEngine {
    constructor() {
      this.revisionsVault = this.loadVault();
      this.init();
    }

    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.bindDOM());
      } else {
        this.bindDOM();
      }
    }

    loadVault() {
      try {
        const raw = localStorage.getItem(REVISIONS_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
      } catch (e) {
        return {};
      }
    }

    saveVault() {
      try {
        localStorage.setItem(REVISIONS_STORAGE_KEY, JSON.stringify(this.revisionsVault));
      } catch (e) {}
    }

    /**
     * Records an edit revision for a message
     */
    recordRevision(messageId, oldText, newText, editorId = 'user') {
      if (!messageId || !oldText || !newText || oldText === newText) return;

      if (!this.revisionsVault[messageId]) {
        this.revisionsVault[messageId] = [
          { version: 1, text: oldText, timestamp: Date.now() - 60000, editor: editorId }
        ];
      }

      const nextVersion = this.revisionsVault[messageId].length + 1;
      this.revisionsVault[messageId].push({
        version: nextVersion,
        text: newText,
        timestamp: Date.now(),
        editor: editorId
      });

      this.saveVault();
      this.attachEditedBadge(messageId);
    }

    getRevisions(messageId) {
      return this.revisionsVault[messageId] || null;
    }

    /**
     * Computes word-level diff between two text strings using LCS algorithm
     */
    computeWordDiff(textA, textB) {
      const wordsA = textA.split(/(\s+)/);
      const wordsB = textB.split(/(\s+)/);

      const m = wordsA.length;
      const n = wordsB.length;

      // Matrix computation
      const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));

      for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
          if (wordsA[i] === wordsB[j]) {
            dp[i + 1][j + 1] = dp[i][j] + 1;
          } else {
            dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
          }
        }
      }

      // Backtrack to build diff tokens
      const diffTokens = [];
      let i = m, j = n;

      while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && wordsA[i - 1] === wordsB[j - 1]) {
          diffTokens.unshift({ type: 'unchanged', text: wordsA[i - 1] });
          i--;
          j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
          diffTokens.unshift({ type: 'added', text: wordsB[j - 1] });
          j--;
        } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
          diffTokens.unshift({ type: 'deleted', text: wordsA[i - 1] });
          i--;
        }
      }

      return diffTokens;
    }

    /**
     * Opens the visual diff inspector modal
     */
    openDiffModal(messageId) {
      const modal = document.getElementById('messageDiffModal');
      const timelineList = document.getElementById('diffTimelineList');
      const diffViewArea = document.getElementById('diffVisualComparisonArea');
      if (!modal) return;

      const revisions = this.getRevisions(messageId);
      if (!revisions || revisions.length < 2) {
        if (typeof showNotif === 'function') {
          showNotif('No revision history found for this message.', 'info', 2000);
        }
        return;
      }

      if (timelineList) {
        timelineList.innerHTML = '';
        revisions.forEach((rev, idx) => {
          const isLatest = idx === revisions.length - 1;
          const isOriginal = idx === 0;
          const label = isOriginal ? 'v1 (Original)' : (isLatest ? `v${rev.version} (Latest)` : `v${rev.version}`);
          const dateStr = new Date(rev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

          const item = document.createElement('div');
          item.className = 'diff-timeline-item' + (isLatest ? ' active' : '');
          item.style.cssText = `
            padding: 8px 12px;
            border-radius: 8px;
            cursor: pointer;
            background: ${isLatest ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.03)'};
            border: 1px solid ${isLatest ? '#00f2fe' : 'rgba(255, 255, 255, 0.06)'};
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            margin-bottom: 6px;
          `;
          item.innerHTML = `
            <div>
              <strong style="color: #fff;">${label}</strong>
              <div style="font-size: 10.5px; color: #8b949e;">${dateStr}</div>
            </div>
            <i class="fa-solid fa-chevron-right" style="font-size: 10px; color: #00f2fe;"></i>
          `;
          timelineList.appendChild(item);
        });
      }

      // Default compare: Original vs Latest
      const originalRev = revisions[0];
      const latestRev = revisions[revisions.length - 1];
      this.renderDiffComparison(originalRev.text, latestRev.text);

      modal.style.display = 'flex';
      modal.setAttribute('aria-hidden', 'false');
    }

    renderDiffComparison(textOld, textNew) {
      const area = document.getElementById('diffVisualComparisonArea');
      if (!area) return;

      const diff = this.computeWordDiff(textOld, textNew);

      let html = '';
      diff.forEach(token => {
        if (token.type === 'deleted') {
          html += `<del style="background: rgba(239, 68, 68, 0.2); color: #f87171; text-decoration: line-through; padding: 2px 4px; border-radius: 4px; margin: 0 1px;">${this.escapeHtml(token.text)}</del>`;
        } else if (token.type === 'added') {
          html += `<ins style="background: rgba(16, 185, 129, 0.2); color: #00ff66; text-decoration: none; padding: 2px 4px; border-radius: 4px; margin: 0 1px; font-weight: 600;">${this.escapeHtml(token.text)}</ins>`;
        } else {
          html += `<span style="color: #cbd5e1;">${this.escapeHtml(token.text)}</span>`;
        }
      });

      area.innerHTML = html;
    }

    escapeHtml(str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    closeDiffModal() {
      const modal = document.getElementById('messageDiffModal');
      if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
      }
    }

    attachEditedBadge(messageId) {
      const bubble = document.querySelector(`[data-id="${messageId}"] .timestamp, [data-msg-id="${messageId}"] .timestamp`);
      if (bubble && !bubble.querySelector('.message-edited-badge')) {
        const badge = document.createElement('span');
        badge.className = 'message-edited-badge';
        badge.style.cssText = 'color: #00f2fe; cursor: pointer; margin-left: 4px; font-size: 10px; text-decoration: underline;';
        badge.innerHTML = '<i class="fa-solid fa-code-compare"></i> edited';
        badge.title = 'Click to inspect revision history and git-style diff';
        badge.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openDiffModal(messageId);
        });
        bubble.appendChild(badge);
      }
    }

    bindDOM() {
      const closeBtn = document.getElementById('closeMessageDiffModalBtn');
      if (closeBtn && !closeBtn.dataset.bound) {
        closeBtn.dataset.bound = 'true';
        closeBtn.addEventListener('click', () => this.closeDiffModal());
      }
    }
  }

  // Export Singleton
  global.EliteRevisionDiffEngine = EliteRevisionDiffEngine;
  global.eliteRevisionDiffEngine = new EliteRevisionDiffEngine();

})(typeof window !== 'undefined' ? window : this);
