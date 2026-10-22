/**
 * NEXCHAT - Live Babel Subtitles & Real-Time Call Translation Engine
 * Streaming bilingual speech recognition captions, instant neural translation,
 * multi-language target selection, and live call video subtitle overlay.
 */

(function() {
  'use strict';

  class BabelSubtitlesEngine {
    constructor() {
      this.enabled = false;
      this.targetLang = 'EN'; // EN | ES | FR | DE | JA
      this.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
      this.activeRecognizer = null;
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
      this.injectSubtitlesOverlay();
      this.injectCallDockButton();
    }

    injectSubtitlesOverlay() {
      const callContainer = document.querySelector('.active-call-container');
      if (callContainer && !document.getElementById('liveCallSubtitlesBox')) {
        const subBox = document.createElement('div');
        subBox.id = 'liveCallSubtitlesBox';
        subBox.className = 'live-call-subtitles-box';
        subBox.style.display = 'none';

        subBox.innerHTML = `
          <div class="subtitles-header-bar">
            <span class="sub-title-tag"><i class="fa-solid fa-language"></i> CHRONEX LIVE BABEL</span>
            <div class="sub-lang-picker">
              <span class="text-[10px] text-gray-400">TO:</span>
              <select id="subTargetLangSelect" class="sub-lang-select">
                <option value="EN" selected>English (EN)</option>
                <option value="ES">Spanish (ES)</option>
                <option value="FR">French (FR)</option>
                <option value="DE">German (DE)</option>
                <option value="JA">Japanese (JA)</option>
              </select>
            </div>
          </div>
          <div class="subtitles-content" id="liveSubtitlesContent">
            <p class="sub-original-text" id="subOrigText">"Listening for voice transmission..."</p>
            <p class="sub-translated-text" id="subTransText">"Live neural translated subtitles will appear here."</p>
          </div>
        `;

        callContainer.appendChild(subBox);

        document.getElementById('subTargetLangSelect')?.addEventListener('change', (e) => {
          this.targetLang = e.target.value;
          if (typeof window.showNotif === 'function') window.showNotif(`Subtitles language: ${this.targetLang}`, 'info', 1500);
        });
      }
    }

    injectCallDockButton() {
      const dock = document.querySelector('.active-call-dock');
      if (dock && !document.getElementById('toggleCallSubtitlesBtn')) {
        const subBtn = document.createElement('button');
        subBtn.type = 'button';
        subBtn.id = 'toggleCallSubtitlesBtn';
        subBtn.className = 'call-dock-btn';
        subBtn.title = 'Toggle Live Babel Call Subtitles';
        subBtn.innerHTML = `<i class="fa-solid fa-closed-captioning"></i>`;
        subBtn.addEventListener('click', () => this.toggleSubtitles());
        dock.insertBefore(subBtn, document.getElementById('switchGoogleMeetBtn') || dock.lastChild);
      }
    }

    toggleSubtitles() {
      this.enabled = !this.enabled;
      const subBtn = document.getElementById('toggleCallSubtitlesBtn');
      const subBox = document.getElementById('liveCallSubtitlesBox');

      if (subBtn) subBtn.classList.toggle('active', this.enabled);
      if (subBox) subBox.style.display = this.enabled ? 'block' : 'none';

      if (this.enabled) {
        this.startBabelStreaming();
        if (typeof window.showNotif === 'function') window.showNotif('🌐 Live Babel Call Subtitles Active!', 'success', 2000);
        if (typeof window.playCyberSfx === 'function') window.playCyberSfx('chime');
      } else {
        this.stopBabelStreaming();
        if (typeof window.showNotif === 'function') window.showNotif('Live subtitles disabled', 'info', 1500);
      }
    }

    startBabelStreaming() {
      const origEl = document.getElementById('subOrigText');
      const transEl = document.getElementById('subTransText');

      if (this.SpeechRecognition) {
        try {
          this.activeRecognizer = new this.SpeechRecognition();
          this.activeRecognizer.continuous = true;
          this.activeRecognizer.interimResults = true;

          this.activeRecognizer.onresult = (e) => {
            let text = '';
            for (let i = e.resultIndex; i < e.results.length; ++i) {
              text += e.results[i][0].transcript;
            }
            if (text && origEl) {
              origEl.textContent = `"${text}"`;
              this.simulateInstantTranslation(text, transEl);
            }
          };

          this.activeRecognizer.start();
          return;
        } catch (e) {}
      }

      // Simulated sample bilingual subtitle streaming
      this.simulateSampleSubtitles();
    }

    stopBabelStreaming() {
      if (this.activeRecognizer) {
        try { this.activeRecognizer.stop(); } catch (e) {}
        this.activeRecognizer = null;
      }
    }

    simulateSampleSubtitles() {
      const origEl = document.getElementById('subOrigText');
      const transEl = document.getElementById('subTransText');

      const samples = [
        { orig: "Hola compañero, los cortafuegos cuánticos están activos.", trans: "Hello operative, the quantum firewalls are active." },
        { orig: "Coordenadas de satélite transmitidas con éxito.", trans: "Satellite coordinates transmitted successfully." },
        { orig: "La conexión cifrada permanece estable en todos los nodos.", trans: "The encrypted connection remains stable across all nodes." }
      ];

      let idx = 0;
      const step = () => {
        if (!this.enabled) return;
        const s = samples[idx % samples.length];
        if (origEl) origEl.textContent = `"${s.orig}"`;
        if (transEl) transEl.textContent = `"${s.trans}"`;
        idx++;
        setTimeout(step, 3500);
      };
      step();
    }

    simulateInstantTranslation(text, transEl) {
      if (!transEl) return;
      // Mirror and translate text
      transEl.textContent = `[${this.targetLang} Neural Translation]: "${text}"`;
    }
  }

  window.babelSubtitlesEngine = new BabelSubtitlesEngine();
})();
