/**
 * NEXCHAT — Stealth Calculator Lock & Decoy Vault Camouflage Engine
 * Module: src/js/calculator-lock.js
 * 
 * Provides an authentic, fully functional digital calculator disguise.
 * Entering the master secret PIN + '=' reveals the real secure vault.
 * Entering a decoy coercion PIN + '=' unlocks the sanitized decoy environment.
 * Any other calculation computes normally with zero disclosure of security layers.
 */

(function (global) {
  'use strict';

  const STORAGE_KEYS = {
    ENABLED: 'nex_calc_lock_enabled',
    MASTER_PIN: 'nex_calc_master_pin',
    DECOY_PIN: 'nex_calc_decoy_pin',
    LOCK_ON_IDLE: 'nex_calc_lock_on_idle'
  };

  class CalculatorLockEngine {
    constructor() {
      this.displayValue = '0';
      this.prevValue = '';
      this.operation = null;
      this.waitingForSecondOperand = false;
      this.inputBuffer = '';
      this.isLocked = false;
      this.overlayEl = null;

      this.init();
    }

    init() {
      // Default fallback pins if unconfigured
      if (!localStorage.getItem(STORAGE_KEYS.MASTER_PIN)) {
        localStorage.setItem(STORAGE_KEYS.MASTER_PIN, '1337');
      }
      if (!localStorage.getItem(STORAGE_KEYS.DECOY_PIN)) {
        localStorage.setItem(STORAGE_KEYS.DECOY_PIN, '9999');
      }

      this.injectDOM();
      this.bindKeyboardShortcuts();

      if (typeof window !== 'undefined') {
        window.NexCalculatorLock = this;
      }

      // Check if auto-lock on launch is active
      if (localStorage.getItem(STORAGE_KEYS.ENABLED) === 'true') {
        this.show();
      }
    }

    injectDOM() {
      if (document.getElementById('nexCalculatorLockOverlay')) return;

      const overlay = document.createElement('div');
      overlay.id = 'nexCalculatorLockOverlay';
      overlay.style.cssText = `
        display: none;
        position: fixed;
        inset: 0;
        z-index: 9999999;
        background: #0d1117;
        color: #f0f6fc;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        align-items: center;
        justify-content: center;
        user-select: none;
      `;

      overlay.innerHTML = `
        <div style="background: #161b22; border: 1px solid #30363d; border-radius: 20px; width: 340px; max-width: 92vw; padding: 22px; box-shadow: 0 20px 60px rgba(0,0,0,0.85); display: flex; flex-direction: column; gap: 16px;">
          <!-- Header Bar -->
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #21262d; padding-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 10px; height: 10px; border-radius: 50%; background: #ff5f56;"></div>
              <div style="width: 10px; height: 10px; border-radius: 50%; background: #ffbd2e;"></div>
              <div style="width: 10px; height: 10px; border-radius: 50%; background: #27c93f;"></div>
              <span style="font-size: 11px; font-weight: 600; color: #8b949e; margin-left: 6px; letter-spacing: 0.5px;">CALCULATOR</span>
            </div>
            <span style="font-size: 10px; color: #484f58; font-family: monospace;">DEG</span>
          </div>

          <!-- LCD / LED Display -->
          <div style="background: #090d13; border: 1px solid #21262d; border-radius: 12px; padding: 14px 16px; text-align: right; min-height: 52px; display: flex; flex-direction: column; justify-content: flex-end;">
            <div id="nexCalcHistory" style="font-size: 11px; color: #8b949e; min-height: 14px; font-family: monospace;"></div>
            <div id="nexCalcDisplay" style="font-size: 32px; font-weight: 700; color: #f0f6fc; font-family: monospace; overflow-x: auto; white-space: nowrap; letter-spacing: 1px;">0</div>
          </div>

          <!-- Keypad Matrix Grid -->
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
            <button class="calc-btn calc-op-clear" data-action="clear" style="padding: 16px 0; border: none; border-radius: 12px; background: #21262d; color: #ff7b72; font-size: 16px; font-weight: 700; cursor: pointer;">AC</button>
            <button class="calc-btn calc-op" data-action="invert" style="padding: 16px 0; border: none; border-radius: 12px; background: #21262d; color: #58a6ff; font-size: 16px; font-weight: 700; cursor: pointer;">±</button>
            <button class="calc-btn calc-op" data-action="percent" style="padding: 16px 0; border: none; border-radius: 12px; background: #21262d; color: #58a6ff; font-size: 16px; font-weight: 700; cursor: pointer;">%</button>
            <button class="calc-btn calc-op" data-op="÷" style="padding: 16px 0; border: none; border-radius: 12px; background: #1f6feb; color: #fff; font-size: 18px; font-weight: 700; cursor: pointer;">÷</button>

            <button class="calc-btn calc-num" data-num="7" style="padding: 16px 0; border: none; border-radius: 12px; background: #21262d; color: #f0f6fc; font-size: 18px; font-weight: 600; cursor: pointer;">7</button>
            <button class="calc-btn calc-num" data-num="8" style="padding: 16px 0; border: none; border-radius: 12px; background: #21262d; color: #f0f6fc; font-size: 18px; font-weight: 600; cursor: pointer;">8</button>
            <button class="calc-btn calc-num" data-num="9" style="padding: 16px 0; border: none; border-radius: 12px; background: #21262d; color: #f0f6fc; font-size: 18px; font-weight: 600; cursor: pointer;">9</button>
            <button class="calc-btn calc-op" data-op="×" style="padding: 16px 0; border: none; border-radius: 12px; background: #1f6feb; color: #fff; font-size: 18px; font-weight: 700; cursor: pointer;">×</button>

            <button class="calc-btn calc-num" data-num="4" style="padding: 16px 0; border: none; border-radius: 12px; background: #21262d; color: #f0f6fc; font-size: 18px; font-weight: 600; cursor: pointer;">4</button>
            <button class="calc-btn calc-num" data-num="5" style="padding: 16px 0; border: none; border-radius: 12px; background: #21262d; color: #f0f6fc; font-size: 18px; font-weight: 600; cursor: pointer;">5</button>
            <button class="calc-btn calc-num" data-num="6" style="padding: 16px 0; border: none; border-radius: 12px; background: #21262d; color: #f0f6fc; font-size: 18px; font-weight: 600; cursor: pointer;">6</button>
            <button class="calc-btn calc-op" data-op="-" style="padding: 16px 0; border: none; border-radius: 12px; background: #1f6feb; color: #fff; font-size: 18px; font-weight: 700; cursor: pointer;">−</button>

            <button class="calc-btn calc-num" data-num="1" style="padding: 16px 0; border: none; border-radius: 12px; background: #21262d; color: #f0f6fc; font-size: 18px; font-weight: 600; cursor: pointer;">1</button>
            <button class="calc-btn calc-num" data-num="2" style="padding: 16px 0; border: none; border-radius: 12px; background: #21262d; color: #f0f6fc; font-size: 18px; font-weight: 600; cursor: pointer;">2</button>
            <button class="calc-btn calc-num" data-num="3" style="padding: 16px 0; border: none; border-radius: 12px; background: #21262d; color: #f0f6fc; font-size: 18px; font-weight: 600; cursor: pointer;">3</button>
            <button class="calc-btn calc-op" data-op="+" style="padding: 16px 0; border: none; border-radius: 12px; background: #1f6feb; color: #fff; font-size: 18px; font-weight: 700; cursor: pointer;">+</button>

            <button class="calc-btn calc-num" data-num="0" style="grid-column: span 2; padding: 16px 0; border: none; border-radius: 12px; background: #21262d; color: #f0f6fc; font-size: 18px; font-weight: 600; cursor: pointer;">0</button>
            <button class="calc-btn calc-num" data-num="." style="padding: 16px 0; border: none; border-radius: 12px; background: #21262d; color: #f0f6fc; font-size: 18px; font-weight: 600; cursor: pointer;">.</button>
            <button class="calc-btn calc-op-equals" data-action="equals" style="padding: 16px 0; border: none; border-radius: 12px; background: #238636; color: #fff; font-size: 20px; font-weight: 700; cursor: pointer;">=</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
      this.overlayEl = overlay;
      this.bindKeypadEvents();
    }

    bindKeypadEvents() {
      if (!this.overlayEl) return;

      this.overlayEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.calc-btn');
        if (!btn) return;

        // Visual click feedback
        btn.style.opacity = '0.7';
        setTimeout(() => { btn.style.opacity = '1'; }, 100);

        if (btn.dataset.num !== undefined) {
          this.inputDigit(btn.dataset.num);
        } else if (btn.dataset.op !== undefined) {
          this.handleOperator(btn.dataset.op);
        } else if (btn.dataset.action === 'clear') {
          this.resetCalculator();
        } else if (btn.dataset.action === 'invert') {
          this.invertSign();
        } else if (btn.dataset.action === 'percent') {
          this.applyPercent();
        } else if (btn.dataset.action === 'equals') {
          this.evaluateOrUnlock();
        }
      });
    }

    bindKeyboardShortcuts() {
      window.addEventListener('keydown', (e) => {
        // Toggle panic shortcut: Ctrl + Alt + C
        if (e.ctrlKey && e.altKey && e.code === 'KeyC') {
          e.preventDefault();
          this.toggle();
          return;
        }

        if (!this.isLocked) return;

        // When locked, intercept standard numpad & calculator keys
        if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          this.inputDigit(e.key);
        } else if (e.key === '.') {
          e.preventDefault();
          this.inputDigit('.');
        } else if (['+', '-', '*', '/'].includes(e.key)) {
          e.preventDefault();
          const opMap = { '+': '+', '-': '-', '*': '×', '/': '÷' };
          this.handleOperator(opMap[e.key]);
        } else if (e.key === 'Enter' || e.key === '=') {
          e.preventDefault();
          this.evaluateOrUnlock();
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          this.backspace();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          this.resetCalculator();
        }
      });
    }

    updateDisplay() {
      const display = document.getElementById('nexCalcDisplay');
      const history = document.getElementById('nexCalcHistory');
      if (display) display.textContent = this.displayValue;
      if (history) {
        history.textContent = this.operation ? `${this.prevValue} ${this.operation}` : '';
      }
    }

    inputDigit(digit) {
      if (this.waitingForSecondOperand) {
        this.displayValue = digit === '.' ? '0.' : digit;
        this.waitingForSecondOperand = false;
      } else {
        if (digit === '.' && this.displayValue.includes('.')) return;
        this.displayValue = this.displayValue === '0' && digit !== '.' ? digit : this.displayValue + digit;
      }
      this.inputBuffer += digit;
      this.updateDisplay();
    }

    handleOperator(nextOp) {
      const inputValue = parseFloat(this.displayValue);

      if (this.operation && this.waitingForSecondOperand) {
        this.operation = nextOp;
        this.updateDisplay();
        return;
      }

      if (this.prevValue === '') {
        this.prevValue = String(inputValue);
      } else if (this.operation) {
        const currentValue = this.prevValue || 0;
        const result = this.calculate(parseFloat(currentValue), inputValue, this.operation);
        this.displayValue = `${parseFloat(result.toFixed(7))}`;
        this.prevValue = String(this.displayValue);
      }

      this.waitingForSecondOperand = true;
      this.operation = nextOp;
      this.inputBuffer = ''; // reset buffer on op
      this.updateDisplay();
    }

    calculate(first, second, op) {
      if (op === '+') return first + second;
      if (op === '-') return first - second;
      if (op === '×') return first * second;
      if (op === '÷') return second !== 0 ? first / second : 0;
      return second;
    }

    invertSign() {
      this.displayValue = String(-parseFloat(this.displayValue));
      this.updateDisplay();
    }

    applyPercent() {
      this.displayValue = String(parseFloat(this.displayValue) / 100);
      this.updateDisplay();
    }

    backspace() {
      if (this.displayValue.length > 1) {
        this.displayValue = this.displayValue.slice(0, -1);
      } else {
        this.displayValue = '0';
      }
      this.updateDisplay();
    }

    resetCalculator() {
      this.displayValue = '0';
      this.prevValue = '';
      this.operation = null;
      this.waitingForSecondOperand = false;
      this.inputBuffer = '';
      this.updateDisplay();
    }

    /**
     * Core Gatekeeper: Checks if entered sequence is a secret vault passcode
     */
    evaluateOrUnlock() {
      const enteredCode = this.displayValue.trim();
      const masterPin = localStorage.getItem(STORAGE_KEYS.MASTER_PIN) || '1337';
      const decoyPin = localStorage.getItem(STORAGE_KEYS.DECOY_PIN) || '9999';

      // 1. MASTER VAULT UNLOCK
      if (enteredCode === masterPin) {
        this.unlockApp('master');
        return;
      }

      // 2. DECOY COERCION UNLOCK
      if (enteredCode === decoyPin) {
        this.unlockApp('decoy');
        return;
      }

      // 3. STANDARD ARITHMETIC EVALUATION
      if (!this.operation || this.prevValue === '') {
        return;
      }

      const first = parseFloat(this.prevValue);
      const second = parseFloat(this.displayValue);
      const result = this.calculate(first, second, this.operation);

      this.displayValue = `${parseFloat(result.toFixed(7))}`;
      this.operation = null;
      this.prevValue = '';
      this.waitingForSecondOperand = true;
      this.updateDisplay();
    }

    unlockApp(mode = 'master') {
      this.hide();

      if (mode === 'decoy') {
        if (window.NexDecoyVault && typeof window.NexDecoyVault.enterDecoyMode === 'function') {
          window.NexDecoyVault.enterDecoyMode();
        }
        if (window.showNotif) {
          window.showNotif('System Initialized (Decoy Partition Active)', 'info');
        }
      } else {
        if (window.playLuxuryPopSound) window.playLuxuryPopSound();
        if (window.showNotif) {
          window.showNotif('Security Clearance Verified: Master Vault Unlocked', 'success');
        }
      }
    }

    show() {
      if (!this.overlayEl) this.injectDOM();
      this.resetCalculator();
      if (this.overlayEl) {
        this.overlayEl.style.display = 'flex';
      }
      this.isLocked = true;
    }

    hide() {
      if (this.overlayEl) {
        this.overlayEl.style.display = 'none';
      }
      this.isLocked = false;
    }

    toggle() {
      if (this.isLocked) {
        this.hide();
      } else {
        this.show();
      }
    }

    setMasterPin(newPin) {
      if (!newPin || newPin.length < 3) return false;
      localStorage.setItem(STORAGE_KEYS.MASTER_PIN, String(newPin).trim());
      return true;
    }

    setDecoyPin(newPin) {
      if (!newPin || newPin.length < 3) return false;
      localStorage.setItem(STORAGE_KEYS.DECOY_PIN, String(newPin).trim());
      return true;
    }
  }

  // Auto-instantiate
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => new CalculatorLockEngine());
    } else {
      new CalculatorLockEngine();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
