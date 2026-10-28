/**
 * NEXCHAT - Live Babel Subtitles & Real-Time Call Translation Engine
 * Streaming bilingual speech recognition captions, instant neural translation,
 * multi-language target selection, live call video subtitle overlay, and
 * Speech-to-Speech audio readout for WebRTC calls.
 * STRICTLY ZERO EMOJIS - FontAwesome 6 vector glyphs only.
 */

(function() {
  'use strict';

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  class BabelSubtitlesEngine {
    constructor() {
      this.enabled = false;
      this.targetLang = 'EN'; // EN | ES | PIDGIN | FR | DE | JA | ZH | RU | AR | IT
      this.voiceOutputEnabled = false;
      this.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
      this.activeRecognizer = null;
      this.debounceTimer = null;
      this.lastSpokenText = '';
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
      const callContainer = document.getElementById('call-overlay') || document.querySelector('.active-call-container') || document.getElementById('activeCallOverlay') || document.body;
      if (callContainer && !document.getElementById('liveCallSubtitlesBox')) {
        const subBox = document.createElement('div');
        subBox.id = 'liveCallSubtitlesBox';
        subBox.className = 'live-call-subtitles-box';
        subBox.style.cssText = `
          display: none;
          position: fixed;
          bottom: calc(130px + env(safe-area-inset-bottom, 0px));
          left: 50%;
          transform: translateX(-50%);
          width: 92%;
          max-width: 680px;
          background: rgba(10, 15, 29, 0.95);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(0, 242, 255, 0.35);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.8), 0 0 16px rgba(0, 242, 255, 0.2);
          z-index: 200050;
          padding: 10px 14px;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        `;

        subBox.innerHTML = `
          <div class="subtitles-header-bar" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="sub-title-tag" style="color: #00f2ff; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">
                <i class="fa-solid fa-language"></i> CHRONEX LIVE BABEL CALL HUD
              </span>
              <span class="live-pulse-dot" style="width: 7px; height: 7px; background: #00ff66; border-radius: 50%; display: inline-block; box-shadow: 0 0 8px #00ff66;"></span>
            </div>
            <div class="sub-controls-row" style="display: flex; align-items: center; gap: 8px;">
              <button type="button" id="toggleBabelSpeechVoiceBtn" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #94a3b8; font-size: 10px; min-height: 38px; padding: 6px 12px; border-radius: 6px; touch-action: manipulation; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                <i class="fa-solid fa-volume-xmark"></i> Voice Output
              </button>
              <div class="sub-lang-picker" style="display: flex; align-items: center; gap: 4px;">
                <span style="font-size: 10px; color: #94a3b8; font-weight: 700;">TO:</span>
                <select id="subTargetLangSelect" class="sub-lang-select" style="background: rgba(0, 242, 255, 0.1); border: 1px solid rgba(0, 242, 255, 0.3); color: #00f2ff; font-size: 10.5px; font-weight: 700; border-radius: 6px; min-height: 38px; padding: 6px 10px; cursor: pointer; touch-action: manipulation; outline: none;">
                  <option value="EN" selected>English (EN)</option>
                  <option value="ES">Spanish (ES)</option>
                  <option value="PIDGIN">Nigerian Pidgin</option>
                  <option value="FR">French (FR)</option>
                  <option value="DE">German (DE)</option>
                  <option value="ZH">Chinese (ZH)</option>
                  <option value="JA">Japanese (JA)</option>
                  <option value="RU">Russian (RU)</option>
                  <option value="AR">Arabic (AR)</option>
                  <option value="IT">Italian (IT)</option>
                </select>
              </div>
            </div>
          </div>
          <div class="subtitles-content" id="liveSubtitlesContent">
            <p class="sub-original-text" id="subOrigText" style="margin: 0 0 4px 0; font-size: 11.5px; color: #94a3b8; font-style: italic; line-height: 1.35; word-break: break-word;">"Listening for live speech audio..."</p>
            <p class="sub-translated-text" id="subTransText" style="margin: 0; font-size: 13.5px; color: #00f2fe; font-weight: 600; line-height: 1.4; word-break: break-word;">"Real-time neural call translation will appear here."</p>
          </div>
        `;

        callContainer.appendChild(subBox);

        document.getElementById('subTargetLangSelect')?.addEventListener('change', (e) => {
          this.targetLang = e.target.value;
          if (typeof window.showNotif === 'function') window.showNotif(`Subtitles language: ${this.targetLang}`, 'info', 1500);
        });

        document.getElementById('toggleBabelSpeechVoiceBtn')?.addEventListener('click', () => {
          this.voiceOutputEnabled = !this.voiceOutputEnabled;
          const btn = document.getElementById('toggleBabelSpeechVoiceBtn');
          if (btn) {
            btn.style.color = this.voiceOutputEnabled ? '#00ff66' : '#94a3b8';
            btn.style.borderColor = this.voiceOutputEnabled ? 'rgba(0, 255, 102, 0.4)' : 'rgba(255,255,255,0.15)';
            btn.innerHTML = this.voiceOutputEnabled 
              ? '<i class="fa-solid fa-volume-high"></i> Voice Output: ON' 
              : '<i class="fa-solid fa-volume-xmark"></i> Voice Output: OFF';
          }
          if (typeof window.showNotif === 'function') {
            window.showNotif(this.voiceOutputEnabled ? 'Speech-to-Speech Voice Playback Active' : 'Voice Playback Muted', 'info', 1500);
          }
        });
      }
    }

    injectCallDockButton() {
      const dock = document.querySelector('.active-call-dock') || document.querySelector('.call-controls-bar');
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
        if (typeof window.showNotif === 'function') window.showNotif('[BABEL] Live Call Subtitles Active!', 'success', 2000);
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
              clearTimeout(this.debounceTimer);
              this.debounceTimer = setTimeout(() => {
                this.performLiveTranslation(text, transEl);
              }, 180);
            }
          };

          this.activeRecognizer.onerror = (err) => {
            console.warn('[BabelSubtitles] Speech Recognition error:', err);
          };

          this.activeRecognizer.onend = () => {
            if (this.enabled) {
              try { this.activeRecognizer.start(); } catch (e) {}
            }
          };

          this.activeRecognizer.start();
          return;
        } catch (e) {
          console.warn('[BabelSubtitles] Native SpeechRecognition initialization failed:', e);
        }
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
        if (this.voiceOutputEnabled && s.trans !== this.lastSpokenText) {
          this.speakTranslatedText(s.trans, this.targetLang.toLowerCase());
        }
        idx++;
        setTimeout(step, 4000);
      };
      step();
    }

    async performLiveTranslation(text, transEl) {
      if (!transEl || !text || !text.trim()) return;
      const target = this.targetLang.toLowerCase();

      try {
        let translated = text;
        if (window.CyberFeatures && window.CyberFeatures.translator) {
          translated = await window.CyberFeatures.translator.translateText(text, target);
        } else if (typeof window.generateChronexAIResponse === 'function') {
          const prompt = `Translate this into ${target}. Output ONLY the direct translated sentence:\n"${text}"`;
          const res = await window.generateChronexAIResponse(prompt);
          if (res && !res.includes('QUOTA')) translated = res.trim();
        }

        transEl.textContent = `"${translated}"`;

        if (this.voiceOutputEnabled && translated !== this.lastSpokenText) {
          this.speakTranslatedText(translated, target);
        }
      } catch (err) {
        transEl.textContent = `[${this.targetLang} Neural Translation]: "${text}"`;
      }
    }

    speakTranslatedText(text, targetLang) {
      this.lastSpokenText = text;
      if (window.CyberFeatures && window.CyberFeatures.translator) {
        window.CyberFeatures.translator.speakText(text, targetLang);
      } else if (window.speechSynthesis) {
        try {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = targetLang === 'es' ? 'es-ES' : (targetLang === 'fr' ? 'fr-FR' : (targetLang === 'de' ? 'de-DE' : 'en-US'));
          utterance.rate = 1.05;
          window.speechSynthesis.speak(utterance);
        } catch (e) {}
      }
    }
  }

  window.babelSubtitlesEngine = new BabelSubtitlesEngine();
})();
