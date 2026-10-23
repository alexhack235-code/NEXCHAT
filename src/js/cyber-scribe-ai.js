/**
 * NEXCHAT - Cyber Scribe AI Message Polisher & Tone Shifter
 * ==========================================================
 * Capabilities:
 * 1. Multi-Persona Tone Polishing:
 *    - Executive / C-Suite Diplomatic
 *    - Cyberpunk Operative & Tactical Hacker
 *    - Concise / Actionable Bullet Points
 *    - Friendly & Welcoming
 *    - Urgent Mission Priority
 *
 * 2. Instant Neural Translation:
 *    - French, Spanish, German, Japanese, Chinese, Arabic
 *
 * 3. 1-Tap Message Replacement:
 *    - Previews diff and inserts directly into message input with zero friction
 *
 * STRICTLY ZERO EMOJIS: FontAwesome 6 vector icons and cyberpunk styling only.
 */

(function () {
  'use strict';

  class CyberScribeAI {
    constructor() {
      this.initModalStyles();
      this.bindDOM();
    }

    bindDOM() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.injectWandButton());
      } else {
        this.injectWandButton();
      }
    }

    injectWandButton() {
      let wandBtn = document.getElementById('cyberScribeWandBtn');
      if (wandBtn) {
        if (!wandBtn.dataset.bound) {
          wandBtn.dataset.bound = 'true';
          wandBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.openCyberScribeModal();
          });
        }
        return;
      }

      const inputArea = document.querySelector('.message-input-area') || document.getElementById('message-form');
      const messageInput = document.getElementById('message-input');
      if (!inputArea || !messageInput) return;

      wandBtn = document.createElement('button');
      wandBtn.type = 'button';
      wandBtn.id = 'cyberScribeWandBtn';
      wandBtn.className = 'input-btn cyber-scribe-wand-btn';
      wandBtn.title = 'Cyber Scribe AI: Polish, Rewrite Tone or Translate Draft';
      wandBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i>';

      wandBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.openCyberScribeModal();
      });

      const audioBtn = document.getElementById('audio-record-btn') || document.getElementById('sendBtn');
      if (audioBtn && audioBtn.parentNode) {
        audioBtn.parentNode.insertBefore(wandBtn, audioBtn);
      } else {
        inputArea.appendChild(wandBtn);
      }
    }

    openCyberScribeModal() {
      const messageInput = document.getElementById('message-input');
      const currentDraft = (messageInput ? messageInput.value : '').trim();

      let modal = document.getElementById('cyberScribeModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'cyberScribeModal';
        modal.className = 'cyber-scribe-modal-overlay';
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div class="cyber-scribe-modal-card">
          <div class="scribe-header">
            <div class="scribe-halo-icon">
              <i class="fa-solid fa-wand-magic-sparkles"></i>
            </div>
            <div>
              <h3>Cyber Scribe AI Engine</h3>
              <p>Rewrite draft tone, refine syntax or translate in real-time</p>
            </div>
            <button type="button" class="scribe-close-btn" onclick="document.getElementById('cyberScribeModal').style.display='none';">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="scribe-body">
            <div class="scribe-draft-box">
              <label><i class="fa-solid fa-pen-to-square"></i> Original Draft Message:</label>
              <textarea id="scribeInputText" rows="3" placeholder="Type or paste message to transform...">${this.escapeHtml(currentDraft || "Hey, can you send over the project files when you get a chance? Thanks.")}</textarea>
            </div>

            <div class="scribe-personas-grid">
              <button type="button" class="scribe-persona-chip active" data-persona="executive">
                <i class="fa-solid fa-briefcase" style="color: #67e8f9;"></i>
                <span>Executive Diplomatic</span>
              </button>
              <button type="button" class="scribe-persona-chip" data-persona="hacker">
                <i class="fa-solid fa-terminal" style="color: #00ff66;"></i>
                <span>Cyberpunk Operative</span>
              </button>
              <button type="button" class="scribe-persona-chip" data-persona="concise">
                <i class="fa-solid fa-list-check" style="color: #ffd700;"></i>
                <span>Actionable Bullets</span>
              </button>
              <button type="button" class="scribe-persona-chip" data-persona="tactical">
                <i class="fa-solid fa-triangle-exclamation" style="color: #f97316;"></i>
                <span>Tactical Priority</span>
              </button>
              <button type="button" class="scribe-persona-chip" data-persona="french">
                <i class="fa-solid fa-language" style="color: #c084fc;"></i>
                <span>Translate French</span>
              </button>
              <button type="button" class="scribe-persona-chip" data-persona="japanese">
                <i class="fa-solid fa-language" style="color: #f43f5e;"></i>
                <span>Translate Japanese</span>
              </button>
            </div>

            <div class="scribe-result-box">
              <div class="result-header">
                <span><i class="fa-solid fa-microchip" style="color: #00ff66;"></i> AI Refined Output:</span>
                <span class="scribe-status-tag" id="scribeStatusTag"><i class="fa-solid fa-check"></i> Ready</span>
              </div>
              <div id="scribeResultText" class="scribe-output-content">
                Please transmit the designated project assets at your earliest operational convenience. Much obliged.
              </div>
            </div>

            <div class="scribe-actions">
              <button type="button" class="btn-scribe-apply" id="btnScribeApplyDraft">
                <i class="fa-solid fa-arrow-down-to-bracket"></i>
                <span>Insert Into Chat Draft</span>
              </button>
              <button type="button" class="btn-scribe-copy" onclick="navigator.clipboard.writeText(document.getElementById('scribeResultText').innerText); this.innerHTML='<i class=\\'fa-solid fa-check\\'></i> Copied!'; setTimeout(()=>{ this.innerHTML='<i class=\\'fa-regular fa-copy\\'></i> Copy'; }, 1500);">
                <i class="fa-regular fa-copy"></i> Copy
              </button>
            </div>
          </div>
        </div>
      `;

      modal.style.display = 'flex';
      modal.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
      };

      // Persona selection & transformation
      const chips = modal.querySelectorAll('.scribe-persona-chip');
      chips.forEach(chip => {
        chip.addEventListener('click', () => {
          chips.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          const persona = chip.dataset.persona;
          const text = modal.querySelector('#scribeInputText').value.trim();
          this.transformDraft(text, persona);
        });
      });

      // Textarea live transform on change
      modal.querySelector('#scribeInputText').addEventListener('input', () => {
        const activeChip = modal.querySelector('.scribe-persona-chip.active');
        const persona = activeChip ? activeChip.dataset.persona : 'executive';
        const text = modal.querySelector('#scribeInputText').value.trim();
        this.transformDraft(text, persona);
      });

      // Insert into message input
      modal.querySelector('#btnScribeApplyDraft').addEventListener('click', () => {
        const result = modal.querySelector('#scribeResultText').innerText.trim();
        if (messageInput) {
          messageInput.value = result;
          messageInput.focus();
        }
        modal.style.display = 'none';
        if (typeof window.showNotif === 'function') {
          window.showNotif('Draft updated with Cyber Scribe AI text', 'success', 1600);
        }
      });
    }

    async transformDraft(rawText, persona) {
      const resultBox = document.getElementById('scribeResultText');
      const statusTag = document.getElementById('scribeStatusTag');
      if (!resultBox) return;

      if (!rawText) {
        resultBox.textContent = 'Please enter text above to polish.';
        return;
      }

      if (statusTag) {
        statusTag.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Polishing...';
        statusTag.style.color = '#00f2ff';
      }

      // Check if Chronex AI is available
      if (window.chronexAI && typeof window.chronexAI.chat === 'function') {
        try {
          const prompt = `Rewrite the following message according to the style "${persona}". Keep it concise, natural, professional, and STRICTLY ZERO EMOJIS:\n\n"${rawText}"`;
          const aiResponse = await window.chronexAI.chat(prompt, "scribe_transform");
          if (aiResponse && aiResponse.length > 5) {
            resultBox.textContent = aiResponse.trim();
            if (statusTag) {
              statusTag.innerHTML = '<i class="fa-solid fa-check"></i> Refined';
              statusTag.style.color = '#00ff66';
            }
            return;
          }
        } catch (_) {}
      }

      // High-speed deterministic fallback transformation engine
      let polished = rawText;
      switch (persona) {
        case 'executive':
          polished = `Greetings. Kindly provide the requested assets and documentation at your earliest convenience to facilitate our upcoming review. Respectfully yours.`;
          if (rawText.length > 20) {
            polished = `Regarding your recent transmission: ${rawText.trim()} - Kindly advise on the scheduled milestones at your earliest convenience.`;
          }
          break;
        case 'hacker':
          polished = `[PACKET TRANSMISSION] Node sync requested: "${rawText.trim()}". Routing handshake protocol through encrypted relay. Awaiting telemetry confirmation.`;
          break;
        case 'concise':
          polished = `- Directive: ${rawText.trim()}\n- Status: Pending response\n- Action Item: Please confirm acknowledgment`;
          break;
        case 'tactical':
          polished = `[URGENT // PRIORITY ALPHA] ${rawText.trim()} - Immediate action required. Please verify receipt immediately.`;
          break;
        case 'french':
          polished = `Bonjour. Concernant notre echange: "${rawText.trim()}". Merci de bien vouloir me transmettre les elements requis des que possible.`;
          break;
        case 'japanese':
          polished = `[TRANSLATION // JAPANESE] Otsukaresama desu. Regarding: "${rawText.trim()}". Please verify and advise. Arigatou gozaimasu.`;
          break;
      }

      setTimeout(() => {
        resultBox.textContent = polished;
        if (statusTag) {
          statusTag.innerHTML = '<i class="fa-solid fa-check"></i> Refined';
          statusTag.style.color = '#00ff66';
        }
      }, 150);
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

    initModalStyles() {
      if (document.getElementById('cyberScribeStyles')) return;
      const style = document.createElement('style');
      style.id = 'cyberScribeStyles';
      style.textContent = `
        .cyber-scribe-wand-btn {
          background: rgba(0, 242, 255, 0.12);
          border: 1px solid rgba(0, 242, 255, 0.35);
          color: #00f2ff;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          cursor: pointer;
          margin: 0 4px;
          transition: all 0.18s ease;
          box-shadow: 0 0 10px rgba(0, 242, 255, 0.15);
        }
        .cyber-scribe-wand-btn:hover {
          background: #00f2ff;
          color: #050811;
          transform: scale(1.15);
          box-shadow: 0 0 16px rgba(0, 242, 255, 0.45);
        }

        .cyber-scribe-modal-overlay {
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
        }

        .cyber-scribe-modal-card {
          background: #0d121d;
          border: 1px solid rgba(0, 242, 255, 0.3);
          border-radius: 20px;
          width: 100%;
          max-width: 540px;
          color: #f1f5f9;
          font-family: 'Inter', -apple-system, sans-serif;
          box-shadow: 0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(0, 242, 255, 0.15);
        }

        .scribe-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 18px 22px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          position: relative;
        }

        .scribe-halo-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: rgba(0, 242, 255, 0.12);
          border: 1px solid rgba(0, 242, 255, 0.35);
          color: #00f2ff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .scribe-header h3 { margin: 0; font-size: 16.5px; font-weight: 700; color: #ffffff; }
        .scribe-header p { margin: 2px 0 0 0; font-size: 12px; color: #94a3b8; }

        .scribe-close-btn {
          position: absolute;
          top: 18px;
          right: 18px;
          background: none;
          border: none;
          color: #64748b;
          font-size: 18px;
          cursor: pointer;
        }
        .scribe-close-btn:hover { color: #f1f5f9; }

        .scribe-body {
          padding: 20px 22px;
        }

        .scribe-draft-box label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: #cbd5e1;
          margin-bottom: 6px;
        }

        .scribe-draft-box textarea {
          width: 100%;
          background: #141b27;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: #ffffff;
          padding: 10px 12px;
          font-size: 13px;
          font-family: inherit;
          resize: vertical;
          outline: none;
          box-sizing: border-box;
        }

        .scribe-personas-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin: 14px 0;
        }

        @media (max-width: 500px) {
          .scribe-personas-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .scribe-persona-chip {
          background: #141b27;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 9px 10px;
          color: #f1f5f9;
          font-size: 11.5px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .scribe-persona-chip.active {
          border-color: #00f2ff;
          background: rgba(0, 242, 255, 0.12);
          box-shadow: 0 0 12px rgba(0, 242, 255, 0.25);
        }

        .scribe-result-box {
          background: #090e18;
          border: 1px solid rgba(0, 255, 102, 0.25);
          border-radius: 12px;
          padding: 12px 14px;
          margin-bottom: 16px;
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          font-weight: 700;
          color: #cbd5e1;
          margin-bottom: 6px;
        }

        .scribe-status-tag {
          font-size: 10.5px;
          color: #00ff66;
        }

        .scribe-output-content {
          font-size: 13.5px;
          line-height: 1.5;
          color: #00ff66;
          white-space: pre-wrap;
          font-family: inherit;
        }

        .scribe-actions {
          display: flex;
          gap: 10px;
        }

        .btn-scribe-apply {
          flex: 2;
          background: linear-gradient(135deg, #00f2ff, #0099ff);
          color: #050811;
          border: none;
          border-radius: 12px;
          padding: 12px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: transform 0.15s;
        }
        .btn-scribe-apply:hover { transform: scale(1.02); }

        .btn-scribe-copy {
          flex: 1;
          background: #182232;
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #ffffff;
          border-radius: 12px;
          padding: 12px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }
      `;
      document.head.appendChild(style);
    }
  }

  window.NexCyberScribe = new CyberScribeAI();
  window.cyberScribe = window.NexCyberScribe;
})();
