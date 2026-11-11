/**
 * NEXCHAT - ChronEX Neural Voice-to-Text Transcriber & Speech Intelligence Engine
 * Web Speech Recognition API, inline voice note transcript box,
 * multi-speed playback (1x, 1.5x, 2x), and direct input mic dictation.
 */

(function() {
  'use strict';

  class VoiceTranscriberEngine {
    constructor() {
      this.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
      this.activeRecognizer = null;
      this.isDictating = false;
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
      this.bindDictationButton();
      this.observeVoiceMessages();
    }

    // 1. Direct Live Voice Dictation & Translation in Message Input
    bindDictationButton() {
      let dictateBtn = document.getElementById('voiceDictateBtn');
      const inputWrap = document.querySelector('.message-input-wrapper');
      
      if (!dictateBtn && inputWrap) {
        dictateBtn = document.createElement('button');
        dictateBtn.type = 'button';
        dictateBtn.id = 'voiceDictateBtn';
        dictateBtn.className = 'input-inline-btn voice-dictate-btn';
        dictateBtn.title = 'Voice to Text & Translate';
        dictateBtn.innerHTML = `<i class="fa-solid fa-microphone-lines"></i>`;
        
        const input = document.getElementById('message-input') || document.getElementById('messageInput');
        if (input && input.nextSibling) {
          inputWrap.insertBefore(dictateBtn, input.nextSibling);
        } else {
          inputWrap.appendChild(dictateBtn);
        }
      }

      if (dictateBtn && !dictateBtn.dataset.vttBound) {
        dictateBtn.dataset.vttBound = 'true';
        dictateBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.toggleDictation();
        });
      }
    }

    startVoiceToInput() {
      if (this.isDictating) {
        this.stopDictation();
        return;
      }
      this.toggleDictation();
    }

    async toggleDictation() {
      const btn = document.getElementById('voiceDictateBtn');
      const input = document.getElementById('message-input') || document.getElementById('messageInput');

      if (this.isDictating) {
        this.stopDictation();
        return;
      }

      // If Web Speech Recognition is not supported, use fallback recorder
      if (!this.SpeechRecognition) {
        this.startFallbackAudioDictation(btn, input);
        return;
      }

      try {
        this.activeRecognizer = new this.SpeechRecognition();
        // High-performance real-time setup: continuous false for instant natural finish, interimResults for 0-latency live streaming
        this.activeRecognizer.continuous = false;
        this.activeRecognizer.interimResults = true;
        this.activeRecognizer.maxAlternatives = 1;

        const langMap = {
          'en': 'en-US', 'es': 'es-ES', 'fr': 'fr-FR', 'ru': 'ru-RU',
          'ar': 'ar-SA', 'hi': 'hi-IN', 'tr': 'tr-TR', 'sw': 'sw-KE',
          'tl': 'fil-PH', 'id': 'id-ID', 'zh': 'zh-CN', 'ja': 'ja-JP',
          'ko': 'ko-KR', 'de': 'de-DE', 'pt': 'pt-BR', 'it': 'it-IT'
        };
        const spokenLangSetting = localStorage.getItem('nex_voice_input_lang') || navigator.language || 'en-US';
        const spokenShort = spokenLangSetting.split('-')[0].toLowerCase();
        this.activeRecognizer.lang = langMap[spokenShort] || spokenLangSetting;

        const initialInputValue = input ? input.value : '';
        const initialPrefix = initialInputValue ? initialInputValue.trim() + ' ' : '';
        let finalAccumulated = '';
        let finalized = false;

        this.activeRecognizer.onstart = () => {
          this.isDictating = true;
          if (btn) btn.classList.add('dictating');
          if (typeof window.showNotif === 'function') {
            window.showNotif('Listening... Speak now to transcribe', 'info', 1600);
          }
          if (typeof window.playCyberSfx === 'function') window.playCyberSfx('chime');
        };

        this.activeRecognizer.onresult = (e) => {
          let interimTranscript = '';
          for (let i = e.resultIndex; i < e.results.length; ++i) {
            const piece = e.results[i][0].transcript;
            if (e.results[i].isFinal) {
              finalAccumulated += piece + ' ';
            } else {
              interimTranscript += piece;
            }
          }
          // Real-time 0-latency stream directly into input box as words are spoken
          if (input) {
            input.value = initialPrefix + finalAccumulated + interimTranscript;
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }
        };

        const processFinalTranscript = async () => {
          if (finalized) return;
          finalized = true;

          const rawText = finalAccumulated.trim();
          if (rawText && input) {
            const targetLang = localStorage.getItem('nex_auto_translate_target_lang') ||
                               localStorage.getItem('nexchat_preferred_language') ||
                               (window.CyberFeatures && window.CyberFeatures.translator && window.CyberFeatures.translator.autoTranslateTargetLang);

            const targetShort = targetLang ? targetLang.split('-')[0].toLowerCase() : '';
            if (targetShort && targetShort !== 'off' && targetShort !== spokenShort) {
              let translated = rawText;
              // 1. Instant 0ms synchronous dictionary translation
              if (typeof window.fastTranslateSync === 'function') {
                const syncHit = window.fastTranslateSync(rawText, targetShort);
                if (syncHit) translated = syncHit;
              }
              // 2. Speculative fast async translation
              if (translated === rawText && typeof window.fastTranslateAsync === 'function') {
                try {
                  const asyncHit = await window.fastTranslateAsync(rawText, targetShort);
                  if (asyncHit) translated = asyncHit;
                } catch (_) {}
              } else if (translated === rawText && window.CyberFeatures && window.CyberFeatures.translator) {
                try {
                  translated = await window.CyberFeatures.translator.translateText(rawText, targetShort);
                } catch (_) {}
              }

              input.value = (initialPrefix + translated).trim();
              input.dispatchEvent(new Event('input', { bubbles: true }));
            }

            input.focus();
            if (typeof input.setSelectionRange === 'function') {
              input.setSelectionRange(input.value.length, input.value.length);
            }
            if (typeof window.playCyberSfx === 'function') window.playCyberSfx('chime');
          }

          this.stopDictation();
        };

        this.activeRecognizer.onerror = (e) => {
          console.warn('[VTT] Speech recognition notice:', e.error);
          this.stopDictation();
        };

        this.activeRecognizer.onend = () => {
          processFinalTranscript();
        };

        this.activeRecognizer.start();

      } catch (err) {
        console.warn('[VTT] Speech recognition start error:', err);
        this.stopDictation();
      }
    }

    async startFallbackAudioDictation(btn, input) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (typeof window.showNotif === 'function') {
          window.showNotif('Speech recognition not supported in this browser.', 'warning');
        }
        return;
      }

      try {
        this.fallbackAudioChunks = [];
        this.fallbackStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaRecorderFallback = new MediaRecorder(this.fallbackStream);

        this.mediaRecorderFallback.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) this.fallbackAudioChunks.push(e.data);
        };

        this.isDictating = true;
        if (btn) btn.classList.add('dictating');
        if (typeof window.showNotif === 'function') {
          window.showNotif('Recording speech... Tap again when finished to transcribe', 'info', 2200);
        }

        this.mediaRecorderFallback.start(100);
      } catch (err) {
        console.warn('[VTT] Fallback audio capture failed:', err);
        this.stopDictation();
      }
    }

    async stopFallbackAudioDictation() {
      if (!this.mediaRecorderFallback) return;

      const chunks = [...this.fallbackAudioChunks];
      this.fallbackAudioChunks = [];

      try {
        if (this.mediaRecorderFallback.state !== 'inactive') {
          this.mediaRecorderFallback.stop();
        }
      } catch (_) {}
      this.mediaRecorderFallback = null;

      if (this.fallbackStream) {
        try {
          this.fallbackStream.getTracks().forEach(t => t.stop());
        } catch (_) {}
        this.fallbackStream = null;
      }

      const input = document.getElementById('message-input') || document.getElementById('messageInput');
      if (!input || chunks.length === 0) return;

      const targetLang = localStorage.getItem('nex_auto_translate_target_lang') ||
                         localStorage.getItem('nexchat_preferred_language') ||
                         (window.CyberFeatures && window.CyberFeatures.translator && window.CyberFeatures.translator.autoTranslateTargetLang) ||
                         'en';

      if (typeof window.showNotif === 'function') {
        window.showNotif('Transcribing speech...', 'info', 1800);
      }

      try {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const base64Audio = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(audioBlob);
        });

        if (base64Audio) {
          const resp = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio: base64Audio, targetLang: targetLang || 'en' })
          });
          if (resp.ok) {
            const data = await resp.json();
            const text = (data.result || data.response || data.transcript || '').trim();
            if (text && !text.toLowerCase().includes('not clear enough')) {
              const prev = input.value.trim();
              input.value = prev ? `${prev} ${text}` : text;
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.focus();
              if (typeof window.playCyberSfx === 'function') window.playCyberSfx('chime');
            }
          }
        }
      } catch (err) {
        console.warn('[VTT] Server transcribe error:', err);
      }
    }

    stopDictation() {
      this.isDictating = false;
      const btn = document.getElementById('voiceDictateBtn');
      if (btn) btn.classList.remove('dictating');

      if (this.activeRecognizer) {
        try { this.activeRecognizer.stop(); } catch (e) {}
        this.activeRecognizer = null;
      }

      if (this.mediaRecorderFallback) {
        this.stopFallbackAudioDictation();
      }
    }

    // 2. In-Chat Voice Note Transcription & Speed Controls
    observeVoiceMessages() {
      // Delegate click listener for all current & future transcribe buttons in chat
      document.addEventListener('click', (e) => {
        const transcribeBtn = e.target.closest('.voice-transcribe-btn, .voice-transcribe-pill');
        if (transcribeBtn) {
          e.stopPropagation();
          this.handleTranscribeClick(transcribeBtn);
        }

        const speedPill = e.target.closest('.voice-speed-pill');
        if (speedPill) {
          e.stopPropagation();
          this.handleSpeedChange(speedPill);
        }

        const copyBtn = e.target.closest('.copy-transcript-btn');
        if (copyBtn) {
          e.stopPropagation();
          const textEl = copyBtn.parentElement.querySelector('.transcript-text');
          if (textEl) {
            navigator.clipboard.writeText(textEl.textContent.trim()).then(() => {
              if (typeof window.showNotif === 'function') window.showNotif('Transcript copied to clipboard!', 'success', 1500);
            });
          }
        }
      });
    }

        async handleTranscribeClick(btn) {
      const parent = btn.closest('.nex-voice-card-wrapper') || btn.closest('.message-attachment-container') || btn.closest('.message-bubble');
      if (!parent) return;

      let resultBox = parent.querySelector('.voice-transcript-result, .voice-transcribed-box');
      if (resultBox && resultBox.style.display === 'block' && !btn.classList.contains('retry-needed')) {
        resultBox.style.display = 'none';
        return;
      }

      if (!resultBox) {
        resultBox = document.createElement('div');
        resultBox.className = 'voice-transcript-result';
        parent.appendChild(resultBox);
      }

      const audioEl = parent.querySelector('audio');
      const audioUrl = parent.dataset.audioUrl ||
                       parent.getAttribute('data-audio-url') ||
                       (audioEl ? (audioEl.currentSrc || audioEl.src) : '') ||
                       parent.querySelector('.waveform-play-btn')?.getAttribute('data-audio-src') || '';
      const msgId = parent.dataset.msgId || parent.getAttribute('data-id') || (audioUrl ? audioUrl.slice(-24) : 'voice-' + Date.now());

      if (!audioUrl) {
        resultBox.innerHTML = `
          <div class="transcript-header">
            <span class="transcript-tag"><i class="fa-solid fa-wand-magic-sparkles"></i> ChronEX TRANSCRIPT</span>
          </div>
          <p class="transcript-text" style="color:#ffaa44;">"No speech detected"</p>
        `;
        resultBox.style.display = 'block';
        return;
      }

      btn.classList.add('transcribing');
      btn.classList.remove('retry-needed');

      const setStatus = (label) => {
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>${label}</span>`;
      };

      setStatus('Loading audio...');

      try {
        let result = null;
        if (typeof window.runBestEffortVoiceTranscribeAndTranslate === 'function') {
          result = await window.runBestEffortVoiceTranscribeAndTranslate(audioUrl, 'en', setStatus, msgId);
        } else {
          // Direct best-effort fallback implementation
          let audioPayload = audioUrl;
          if (audioUrl.startsWith('blob:')) {
            try {
              const bRes = await fetch(audioUrl);
              const bBlob = await bRes.blob();
              if (bBlob.size < 800) {
                result = { success: false, shortAudio: true, error: 'Audio too short to translate' };
              } else {
                audioPayload = await new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result);
                  reader.onerror = reject;
                  reader.readAsDataURL(bBlob);
                });
              }
            } catch (bErr) {
              console.warn('[VOICE] Blob conversion fallback failed:', bErr);
            }
          }

          if (!result && audioPayload) {
            let tries = 0;
            const maxTries = 3;
            while (tries < maxTries && !result?.success) {
              tries++;
              setStatus(tries > 1 ? `Translating (retry ${tries}/3)...` : 'Translating...');
              try {
                const ctl = new AbortController();
                const timeoutId = setTimeout(() => ctl.abort(), 15000);
                const resp = await fetch('/api/ai', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ mode: 'transcribe', audio: audioPayload, targetLang: 'en' }),
                  signal: ctl.signal
                });
                clearTimeout(timeoutId);
                if (resp.ok) {
                  const data = await resp.json();
                  const text = (data && (data.response || data.transcript)) ? (data.response || data.transcript).trim() : '';
                  if (text && !text.toLowerCase().includes('not clear enough')) {
                    result = { success: true, transcript: text, translated: text };
                    break;
                  }
                }
              } catch (err) {
                console.warn(`[VOICE] Try ${tries} failed:`, err);
              }
              if (tries < maxTries) {
                await new Promise(r => setTimeout(r, 2000));
              }
            }
          }
        }

        if (result && result.success && (result.translated || result.transcript)) {
          const finalOutput = result.translated || result.transcript;
          resultBox.innerHTML = `
            <div class="transcript-header">
              <span class="transcript-tag"><i class="fa-solid fa-wand-magic-sparkles"></i> ChronEX TRANSCRIPT</span>
              <button type="button" class="copy-transcript-btn" title="Copy text"><i class="fa-regular fa-copy"></i></button>
            </div>
            <p class="transcript-text">"${finalOutput}"</p>
          `;
          resultBox.style.display = 'block';

          btn.classList.remove('transcribing');
          btn.classList.add('transcribed');
          btn.innerHTML = `<i class="fa-solid fa-check text-[#00ff66]"></i> <span>Transcribed</span>`;
          if (typeof window.playCyberSfx === 'function') window.playCyberSfx('chime');
        } else if (result && result.shortAudio) {
          resultBox.innerHTML = `
            <div class="transcript-header">
              <span class="transcript-tag"><i class="fa-solid fa-wand-magic-sparkles"></i> ChronEX TRANSCRIPT</span>
            </div>
            <p class="transcript-text" style="color:#ffaa44;">"Audio too short to translate"</p>
          `;
          resultBox.style.display = 'block';
          btn.classList.remove('transcribing');
          btn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> <span>Transcribe</span>`;
        } else {
          resultBox.innerHTML = `
            <div class="transcript-header">
              <span class="transcript-tag"><i class="fa-solid fa-triangle-exclamation" style="color:#ff4444;"></i> STATUS</span>
            </div>
            <p class="transcript-text" style="color:#ffaa44;">Could not translate after 3 tries. Tap to retry</p>
          `;
          resultBox.style.display = 'block';
          btn.classList.remove('transcribing');
          btn.classList.add('retry-needed');
          btn.innerHTML = `<i class="fa-solid fa-rotate-right"></i> <span>Retry Translate</span>`;
        }
      } catch (err) {
        console.warn('[VOICE] Final transcript error:', err);
        resultBox.innerHTML = `
          <div class="transcript-header">
            <span class="transcript-tag"><i class="fa-solid fa-triangle-exclamation" style="color:#ff4444;"></i> STATUS</span>
          </div>
          <p class="transcript-text" style="color:#ffaa44;">Could not translate after 3 tries. Tap to retry</p>
        `;
        resultBox.style.display = 'block';
        btn.classList.remove('transcribing');
        btn.classList.add('retry-needed');
        btn.innerHTML = `<i class="fa-solid fa-rotate-right"></i> <span>Retry Translate</span>`;
      }
    }

    handleSpeedChange(pill) {
      const container = pill.closest('.message-attachment-container');
      const audio = container ? container.querySelector('audio') : null;
      if (!audio) return;

      const speed = parseFloat(pill.dataset.speed || '1');
      audio.playbackRate = speed;

      const row = pill.parentElement;
      if (row) {
        row.querySelectorAll('.voice-speed-pill').forEach(p => p.classList.remove('active'));
      }
      pill.classList.add('active');

      if (typeof window.showNotif === 'function') {
        window.showNotif(`Playback speed: ${speed}x`, 'info', 1200);
      }
    }
  }

  const engine = new VoiceTranscriberEngine();
  window.VoiceTranscriberEngine = VoiceTranscriberEngine;
  window.voiceTranscriberEngine = engine;
  window.startVoiceToInput = () => engine.startVoiceToInput();
  window.toggleVoiceDictation = () => engine.toggleDictation();
})();
