/**
 * NEXCHAT - Anti-Shoulder-Surfing Confidential Scratchpad Engine
 * Frosted Gaussian blur masks for sensitive credentials and secret notes,
 * hover/touch-and-hold to peek, and single-tap quantum self-burn on read.
 * STRICTLY ZERO EMOJIS - FontAwesome 6 vector icons only.
 */

(function(global) {
  'use strict';

  class EliteConfidentialScratchpad {
    constructor() {
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
      // Composer button
      const triggerBtn = document.getElementById('btnConfidentialCipher');
      if (triggerBtn && !triggerBtn.dataset.bound) {
        triggerBtn.dataset.bound = 'true';
        triggerBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.openModal();
        });
      }

      // Close modal
      const closeBtn = document.getElementById('closeConfidentialModalBtn');
      if (closeBtn && !closeBtn.dataset.bound) {
        closeBtn.dataset.bound = 'true';
        closeBtn.addEventListener('click', () => this.closeModal());
      }

      // Dispatch cipher button
      const dispatchBtn = document.getElementById('btnDispatchConfidentialNote');
      if (dispatchBtn && !dispatchBtn.dataset.bound) {
        dispatchBtn.dataset.bound = 'true';
        dispatchBtn.addEventListener('click', () => this.dispatchConfidentialNote());
      }

      // Delegated listeners for hover-to-peek and self-burn
      document.addEventListener('click', (e) => {
        const burnBtn = e.target.closest('.btn-burn-confidential');
        if (burnBtn) {
          e.preventDefault();
          this.burnNote(burnBtn);
        }
      });

      document.addEventListener('mouseover', (e) => {
        const peekTarget = e.target.closest('.confidential-peek-target');
        if (peekTarget) peekTarget.style.filter = 'none';
      });

      document.addEventListener('mouseout', (e) => {
        const peekTarget = e.target.closest('.confidential-peek-target');
        if (peekTarget) peekTarget.style.filter = 'blur(8px)';
      });

      document.addEventListener('touchstart', (e) => {
        const peekTarget = e.target.closest('.confidential-peek-target');
        if (peekTarget) peekTarget.style.filter = 'none';
      }, { passive: true });

      document.addEventListener('touchend', (e) => {
        const peekTarget = e.target.closest('.confidential-peek-target');
        if (peekTarget) peekTarget.style.filter = 'blur(8px)';
      }, { passive: true });
    }

    openModal() {
      const modal = document.getElementById('confidentialNoteModal');
      const input = document.getElementById('confidentialNoteText');
      if (!modal) return;

      if (input) input.value = '';
      modal.style.display = 'flex';
      modal.setAttribute('aria-hidden', 'false');
    }

    closeModal() {
      const modal = document.getElementById('confidentialNoteModal');
      if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
      }
    }

    dispatchConfidentialNote() {
      const input = document.getElementById('confidentialNoteText');
      const text = input ? input.value.trim() : '';

      if (!text) {
        if (typeof showNotif === 'function') showNotif('Please enter confidential content.', 'error', 2000);
        return;
      }

      const formatted = `[CONFIDENTIAL_CIPHER]\n${text}\n[/CONFIDENTIAL_CIPHER]`;

      const composer = document.getElementById('message-input');
      if (composer) {
        composer.value = formatted;
        this.closeModal();
        if (typeof window.sendMessage === 'function') {
          window.sendMessage();
        }
      }
    }

    burnNote(burnBtn) {
      const card = burnBtn.closest('.confidential-cipher-bubble, .message-wrapper, .message-bubble');
      if (!card) return;

      card.style.transition = 'all 0.4s ease';
      card.style.opacity = '0';
      card.style.transform = 'scale(0.95)';
      card.style.filter = 'blur(10px)';

      if (typeof playCyberSfx === 'function') playCyberSfx('burn');
      if (typeof showNotif === 'function') showNotif('Confidential note purged from memory.', 'info', 2000);

      setTimeout(() => {
        card.innerHTML = `
          <div style="color: #8b949e; font-style: italic; font-size: 11.5px; padding: 6px 10px; background: rgba(0,0,0,0.25); border-radius: 8px;">
            <i class="fa-solid fa-fire" style="color: #ff8800;"></i> Confidential note burned and erased.
          </div>
        `;
        card.style.opacity = '1';
        card.style.transform = '';
        card.style.filter = '';
      }, 400);
    }

    isCipherMessage(text) {
      return typeof text === 'string' && text.includes('[CONFIDENTIAL_CIPHER]') && text.includes('[/CONFIDENTIAL_CIPHER]');
    }

    renderCipherMask(text, messageId = '') {
      const innerText = text.replace(/\[\/?CONFIDENTIAL_CIPHER\]/g, '').trim();
      const escaped = (innerText || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      return `
        <div class="confidential-cipher-bubble" data-msg-id="${messageId}" style="position: relative; border-radius: 10px; padding: 10px 12px; background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(239, 68, 68, 0.4); overflow: hidden; margin: 4px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 11px; color: #f87171; font-weight: 700;">
            <span><i class="fa-solid fa-eye-slash" style="margin-right: 5px;"></i> Confidential Cipher</span>
            <button type="button" class="btn-burn-confidential" title="Self-Burn / Erase Note" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #fca5a5; font-size: 10px; padding: 2px 7px; border-radius: 6px; cursor: pointer;">
              <i class="fa-solid fa-fire"></i> Burn
            </button>
          </div>
          <div class="confidential-peek-target" style="filter: blur(8px); user-select: none; transition: filter 0.25s ease; cursor: pointer; color: #f1f5f9; font-size: 13.5px; line-height: 1.45; word-break: break-word;" title="Hold / Hover to Peek">
            ${escaped}
          </div>
          <div class="confidential-peek-hint" style="font-size: 10px; color: #94a3b8; margin-top: 6px; display: flex; align-items: center; gap: 4px;">
            <i class="fa-solid fa-fingerprint" style="color: #00ffc6;"></i> <span>Hover or touch and hold to reveal</span>
          </div>
        </div>
      `;
    }
  }

  // Export Singleton
  global.EliteConfidentialScratchpad = EliteConfidentialScratchpad;
  global.eliteConfidentialScratchpad = new EliteConfidentialScratchpad();

})(typeof window !== 'undefined' ? window : this);
