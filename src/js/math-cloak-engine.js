/**
 * =============================================================================
 * NEXCHAT - MATH CLOAK: OPERATIONAL SCIENTIFIC CALCULATOR DECOY (v1.0)
 * Global Namespace: window.NexMathCloak
 * =============================================================================
 * Capabilities:
 * 1. 1-Click Panic Camouflage: Instantly morphs the entire NEXCHAT window into
 *    a 100% operational scientific calculator with real mathematical calculations.
 * 2. Identity Dissimulation: Renames document title to "Calculator - Scientific"
 *    and masks window appearance to deceive any physical onlooker or snooper.
 * 3. Secret Equation Vault Key: Entering the secret formula (e.g., '7331=')
 *    silently dissolves the calculator skin and restores the active chat enclave.
 * 4. Panic Duress Trigger: Entering '9999=' triggers a sterile guest profile.
 * 5. Global Hotkey Activation: Pressing Ctrl+Shift+X or Alt+C toggles the cloak.
 *
 * STRICTLY 0 UNICODE EMOJIS: Pure FontAwesome 6 vector glyphs only.
 * PURE WINDOWS CRLF LINE ENDINGS. ES2022 COMPLIANT.
 * =============================================================================
 */

(function (global) {
  'use strict';

  const STORAGE_KEY_EQUATION = 'nex_math_cloak_code';
  const STORAGE_KEY_ENABLED = 'nex_math_cloak_enabled';
  const DEFAULT_EQUATION_CODE = '7331';
  const DURESS_EQUATION_CODE = '9999';

  class MathCloakEngine {
    constructor() {
      this.isCloakEngaged = false;
      this.inputBuffer = '0';
      this.historyBuffer = '';
      this.originalTitle = '';
      this._hasBoundEvents = false;

      this.init();
    }

    init() {
      if (typeof window === 'undefined' || typeof document === 'undefined') return;

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.bindDOM());
      } else {
        this.bindDOM();
      }
    }

    isEnabled() {
      try {
        return localStorage.getItem(STORAGE_KEY_ENABLED) === 'true';
      } catch (_) {
        return false;
      }
    }

    setEnabled(enabled) {
      try {
        localStorage.setItem(STORAGE_KEY_ENABLED, enabled ? 'true' : 'false');
      } catch (_) {}
    }

    getSecretCode() {
      try {
        return localStorage.getItem(STORAGE_KEY_EQUATION) || DEFAULT_EQUATION_CODE;
      } catch (_) {
        return DEFAULT_EQUATION_CODE;
      }
    }

    setSecretCode(code) {
      if (!code || code.trim().length === 0) return false;
      try {
        localStorage.setItem(STORAGE_KEY_EQUATION, code.trim());
        return true;
      } catch (_) {
        return false;
      }
    }

    bindDOM() {
      if (this._hasBoundEvents) return;
      this._hasBoundEvents = true;

      // 1. Bind Header Cloak Panic Buttons
      const bindPanicBtn = (id) => {
        const btn = document.getElementById(id);
        if (btn) {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.engageCloak();
          });
        }
      };

      bindPanicBtn('mathCloakPanicBtnHeader');
      bindPanicBtn('mathCloakPanicBtnTop');
      bindPanicBtn('btnQuickMathCloak');

      // 2. Bind Calculator Keypad Buttons
      const overlay = document.getElementById('mathCloakOverlay');
      if (overlay) {
        // Numeric keys
        overlay.querySelectorAll('.calc-key-btn[data-num]').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            const num = btn.getAttribute('data-num');
            if (num !== null) this.handleNumber(num);
          });
        });

        // Math operator keys
        overlay.querySelectorAll('.calc-key-btn[data-act]').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            const act = btn.getAttribute('data-act');
            if (act) this.handleAction(act);
          });
        });

        // Scientific functions
        overlay.querySelectorAll('.calc-sci-btn[data-fn]').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            const fn = btn.getAttribute('data-fn');
            if (fn) this.handleScientificFn(fn);
          });
        });
      }

      // 3. Global Hotkey Listeners (Ctrl+Shift+X or Alt+C)
      window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey && e.shiftKey && e.code === 'KeyX') || (e.altKey && e.code === 'KeyC')) {
          if (!this.isEnabled()) return;
          e.preventDefault();
          if (this.isCloakEngaged) {
            // Hotkey does not uncloak directly to prevent snoopers from finding it; equation required
            if (typeof window.safeShowNotification === 'function') {
              window.safeShowNotification('Enter equation to calculate', 'info');
            }
          } else {
            this.engageCloak();
          }
        }
      });
    }

    engageCloak(force = false) {
      if (!force && !this.isEnabled()) return;
      if (this.isCloakEngaged) return;
      this.isCloakEngaged = true;

      const overlay = document.getElementById('mathCloakOverlay');
      if (overlay) {
        overlay.style.display = 'flex';
        overlay.style.opacity = '1';
        overlay.setAttribute('aria-hidden', 'false');
      }

      this.originalTitle = document.title || 'NEXCHAT';
      document.title = 'Calculator - Scientific';

      this.inputBuffer = '0';
      this.historyBuffer = '';
      this.updateDisplay();

      // Mute active media/calls if playing
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('nex:cloak:engaged'));
      }
    }

    disengageCloak() {
      if (!this.isCloakEngaged) return;

      const overlay = document.getElementById('mathCloakOverlay');
      if (overlay) {
        overlay.style.transition = 'opacity 0.22s ease';
        overlay.style.opacity = '0';
        setTimeout(() => {
          overlay.style.display = 'none';
          overlay.style.opacity = '1';
          this.isCloakEngaged = false;
        }, 220);
      } else {
        this.isCloakEngaged = false;
      }

      document.title = this.originalTitle || 'NEXCHAT';

      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('nex:cloak:disengaged'));
      }

      if (typeof window.safeShowNotification === 'function') {
        window.safeShowNotification('Enclave unlocked: Chat restored', 'success');
      }
    }

    handleNumber(num) {
      if (this.inputBuffer === '0' || this.inputBuffer === 'Error') {
        this.inputBuffer = num;
      } else {
        this.inputBuffer += num;
      }
      this.updateDisplay();
    }

    handleAction(action) {
      if (action === 'clear') {
        this.inputBuffer = '0';
        this.historyBuffer = '';
      } else if (action === 'dot') {
        if (!this.inputBuffer.includes('.')) {
          this.inputBuffer += '.';
        }
      } else if (action === 'neg') {
        if (this.inputBuffer !== '0' && this.inputBuffer !== 'Error') {
          if (this.inputBuffer.startsWith('-')) {
            this.inputBuffer = this.inputBuffer.substring(1);
          } else {
            this.inputBuffer = '-' + this.inputBuffer;
          }
        }
      } else if (action === 'percent') {
        const val = parseFloat(this.inputBuffer);
        if (!isNaN(val)) {
          this.inputBuffer = String(val / 100);
        }
      } else if (action === '=') {
        this.evaluateEquals();
        return;
      } else {
        // Operators (+, -, *, /)
        this.historyBuffer = `${this.inputBuffer} ${action} `;
        this.inputBuffer = '0';
      }
      this.updateDisplay();
    }

    handleScientificFn(fn) {
      const val = parseFloat(this.inputBuffer);
      if (isNaN(val)) return;

      if (fn === 'sin') {
        this.inputBuffer = String(Math.sin(val * (Math.PI / 180)).toFixed(8)).replace(/\.?0+$/, '');
      } else if (fn === 'cos') {
        this.inputBuffer = String(Math.cos(val * (Math.PI / 180)).toFixed(8)).replace(/\.?0+$/, '');
      } else if (fn === 'tan') {
        this.inputBuffer = String(Math.tan(val * (Math.PI / 180)).toFixed(8)).replace(/\.?0+$/, '');
      } else if (fn === 'sqrt') {
        if (val < 0) {
          this.inputBuffer = 'Error';
        } else {
          this.inputBuffer = String(Math.sqrt(val).toFixed(8)).replace(/\.?0+$/, '');
        }
      } else if (fn === 'pow') {
        this.historyBuffer = `${this.inputBuffer} ^ `;
        this.inputBuffer = '0';
      } else if (fn === 'pi') {
        this.inputBuffer = String(Math.PI.toFixed(8));
      }
      this.updateDisplay();
    }

    evaluateEquals() {
      const formula = (this.historyBuffer + this.inputBuffer).trim();
      const secretCode = this.getSecretCode();

      // 1. Check Secret Unlock Equation (e.g. "7331" or "7331=")
      if (formula === secretCode || this.inputBuffer === secretCode || formula.endsWith(secretCode)) {
        this.inputBuffer = '0';
        this.historyBuffer = '';
        this.disengageCloak();
        return;
      }

      // 2. Check Panic Duress PIN (e.g. "9999")
      if (formula === DURESS_EQUATION_CODE || this.inputBuffer === DURESS_EQUATION_CODE || formula.endsWith(DURESS_EQUATION_CODE)) {
        this.inputBuffer = '0';
        this.historyBuffer = '';
        this.disengageCloak();
        if (window.NexChatPasscodeGate && typeof window.NexChatPasscodeGate.triggerDuressDecoy === 'function') {
          window.NexChatPasscodeGate.triggerDuressDecoy();
        }
        return;
      }

      // 3. Perform Actual Accurate Mathematical Computation
      try {
        let sanitized = formula
          .replace(/×/g, '*')
          .replace(/÷/g, '/')
          .replace(/−/g, '-')
          .replace(/\^/g, '**');

        // Only allow safe math tokens
        if (/^[0-9+\-*/().\s*]+$/.test(sanitized)) {
          const result = Function(`'use strict'; return (${sanitized})`)();
          this.historyBuffer = formula + ' =';
          this.inputBuffer = String(typeof result === 'number' && !isNaN(result) ? result : 'Error');
        } else {
          this.inputBuffer = 'Error';
        }
      } catch (_) {
        this.inputBuffer = 'Error';
      }

      this.updateDisplay();
    }

    updateDisplay() {
      const mainEl = document.getElementById('calcMainDisplay');
      const histEl = document.getElementById('calcHistoryTape');

      if (mainEl) mainEl.textContent = this.inputBuffer;
      if (histEl) histEl.textContent = this.historyBuffer;
    }
  }

  // Attach Singleton instance
  global.NexMathCloak = new MathCloakEngine();

})(typeof window !== 'undefined' ? window : this);
