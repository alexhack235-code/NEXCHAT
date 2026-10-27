/**
 * NEXCHAT - Collaborative Code & Markdown Sandbox Drawer
 * Real-time code editing, live client-side sandbox execution,
 * syntax highlighting preview, and 1-tap formatting dispatch into chat.
 * STRICTLY ZERO EMOJIS - FontAwesome 6 vector icons only.
 */

(function(global) {
  'use strict';

  class EliteCodeSandboxDrawer {
    constructor() {
      this.isOpen = false;
      this.currentLang = 'javascript';
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
      // Header trigger
      const headerBtn = document.getElementById('headerCodeSandboxBtn');
      if (headerBtn && !headerBtn.dataset.bound) {
        headerBtn.dataset.bound = 'true';
        headerBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.toggleDrawer();
        });
      }

      // Composer trigger
      const composerBtn = document.getElementById('btnCodeSandboxComposer');
      if (composerBtn && !composerBtn.dataset.bound) {
        composerBtn.dataset.bound = 'true';
        composerBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.toggleDrawer();
        });
      }

      // Close drawer
      const closeBtn = document.getElementById('closeCodeSandboxDrawerBtn');
      if (closeBtn && !closeBtn.dataset.bound) {
        closeBtn.dataset.bound = 'true';
        closeBtn.addEventListener('click', () => this.closeDrawer());
      }

      // Language selector
      const langSelect = document.getElementById('sandboxLangSelect');
      if (langSelect && !langSelect.dataset.bound) {
        langSelect.dataset.bound = 'true';
        langSelect.addEventListener('change', (e) => {
          this.currentLang = e.target.value;
          this.updateCodeTemplate();
        });
      }

      // Run code button
      const runBtn = document.getElementById('btnRunSandboxCode');
      if (runBtn && !runBtn.dataset.bound) {
        runBtn.dataset.bound = 'true';
        runBtn.addEventListener('click', () => this.executeCode());
      }

      // Dispatch to chat button
      const dispatchBtn = document.getElementById('btnDispatchCodeToChat');
      if (dispatchBtn && !dispatchBtn.dataset.bound) {
        dispatchBtn.dataset.bound = 'true';
        dispatchBtn.addEventListener('click', () => this.dispatchToChat());
      }

      // Clear editor button
      const clearBtn = document.getElementById('btnClearSandboxCode');
      if (clearBtn && !clearBtn.dataset.bound) {
        clearBtn.dataset.bound = 'true';
        clearBtn.addEventListener('click', () => {
          const editor = document.getElementById('sandboxCodeEditor');
          if (editor) editor.value = '';
          const consoleEl = document.getElementById('sandboxConsoleOutput');
          if (consoleEl) consoleEl.textContent = 'Console ready.';
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
      const drawer = document.getElementById('codeSandboxDrawer');
      if (!drawer) return;
      this.isOpen = true;
      drawer.style.display = 'flex';
      this.updateCodeTemplate();
      if (typeof playLuxuryChimeSound === 'function') playLuxuryChimeSound();
    }

    closeDrawer() {
      const drawer = document.getElementById('codeSandboxDrawer');
      if (!drawer) return;
      this.isOpen = false;
      drawer.style.display = 'none';
    }

    updateCodeTemplate() {
      const editor = document.getElementById('sandboxCodeEditor');
      if (!editor || editor.value.trim().length > 0) return;

      const templates = {
        javascript: `// NEXCHAT Live Sandbox\nfunction calculateMetrics(data) {\n  return data.map(n => n * 2);\n}\nconsole.log('Result:', calculateMetrics([10, 20, 30]));`,
        html: `<!DOCTYPE html>\n<div style="padding: 10px; background: #002233; color: #00f2fe; border-radius: 8px;">\n  <h3>Quantum Node Preview</h3>\n  <p>Live sandbox rendering active.</p>\n</div>`,
        json: `{\n  "service": "NEXCHAT-E2EE",\n  "version": "11.0.0",\n  "status": "OPERATIONAL",\n  "cluster": "edge-alpha"\n}`,
        markdown: `# Project Specification\n\n- Task 1: Complete E2EE Audit\n- Task 2: Validate 120 FPS Rendering\n- Task 3: Deploy Quantum Timers`
      };

      editor.value = templates[this.currentLang] || templates.javascript;
    }

    executeCode() {
      const editor = document.getElementById('sandboxCodeEditor');
      const consoleEl = document.getElementById('sandboxConsoleOutput');
      if (!editor || !consoleEl) return;

      const code = editor.value;
      consoleEl.innerHTML = '';

      if (this.currentLang === 'javascript') {
        const logs = [];
        const customConsole = {
          log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
          warn: (...args) => logs.push('[WARN] ' + args.join(' ')),
          error: (...args) => logs.push('[ERROR] ' + args.join(' '))
        };

        try {
          const runFn = new Function('console', code);
          const startTime = performance.now();
          runFn(customConsole);
          const duration = (performance.now() - startTime).toFixed(2);
          
          const outputStr = logs.length ? logs.join('\n') : 'Code executed successfully with 0 console logs.';
          consoleEl.innerHTML = `<span style="color:#00ff66;">[SUCCESS (${duration}ms)]</span>\n${outputStr}`;
        } catch (err) {
          consoleEl.innerHTML = `<span style="color:#f87171;">[RUNTIME ERROR] ${err.message}</span>`;
        }
      } else if (this.currentLang === 'json') {
        try {
          const parsed = JSON.parse(code);
          consoleEl.innerHTML = `<span style="color:#00ff66;">[VALID JSON]</span>\n${JSON.stringify(parsed, null, 2)}`;
        } catch (err) {
          consoleEl.innerHTML = `<span style="color:#f87171;">[JSON SYNTAX ERROR] ${err.message}</span>`;
        }
      } else if (this.currentLang === 'html') {
        consoleEl.innerHTML = `<span style="color:#00f2fe;">[HTML PREVIEW]</span>\n<div style="border: 1px dashed rgba(255,255,255,0.2); padding: 8px; margin-top: 6px; border-radius: 6px;">${code}</div>`;
      } else {
        consoleEl.innerHTML = `<span style="color:#cbd5e1;">[PREVIEW COMPLETE] ${code.length} characters ready.</span>`;
      }
    }

    dispatchToChat() {
      const editor = document.getElementById('sandboxCodeEditor');
      if (!editor) return;

      const code = editor.value.trim();
      if (!code) {
        if (typeof showNotif === 'function') showNotif('Code editor is empty.', 'error', 2000);
        return;
      }

      const formatted = `\`\`\`${this.currentLang}\n${code}\n\`\`\``;
      const composer = document.getElementById('message-input');
      if (composer) {
        composer.value = formatted;
        this.closeDrawer();
        if (typeof showNotif === 'function') {
          showNotif('Code snippet loaded into chat composer!', 'success', 2000);
        }
        composer.focus();
      }
    }
  }

  // Export Singleton
  global.EliteCodeSandboxDrawer = EliteCodeSandboxDrawer;
  global.eliteCodeSandboxDrawer = new EliteCodeSandboxDrawer();

})(typeof window !== 'undefined' ? window : this);
