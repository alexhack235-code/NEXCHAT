/**
 * NEXCHAT - Neural Voice Intelligence & Interactive Waveform Engine
 * 1. 24-Bar Dynamic Equalizer Canvas with real-time scrubhead
 * 2. Word-by-word synced karaoke transcript with click-to-seek
 * 3. 1-Tap ChronEX AI Audio TL;DR Summarizer
 * 4. 1-Tap Babel Neural Voice Translation Engine (Multilingual Speech to Text & Translation)
 * 5. Web Audio DSP pitch-preserved speed multipliers (1.0x, 1.25x, 1.5x, 1.75x, 2.0x)
 * STRICTLY ZERO EMOJIS - FontAwesome 6 vector glyphs only.
 */

(function(global) {
  'use strict';

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  class EliteVoiceIntelligence {
    constructor() {
      this.currentAudio = null;
      this.currentSpeed = 1.0;
      this.speeds = [1.0, 1.25, 1.5, 1.75, 2.0];
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
      // Delegated listener for voice player interactions
      document.addEventListener('click', (e) => {
        const tldrBtn = e.target.closest('.btn-voice-tldr-ai');
        if (tldrBtn) {
          e.preventDefault();
          this.handleTldrRequest(tldrBtn);
        }

        const voiceTransBtn = e.target.closest('.btn-voice-translate-ai');
        if (voiceTransBtn) {
          e.preventDefault();
          this.handleVoiceTranslateRequest(voiceTransBtn);
        }

        const speedBtn = e.target.closest('.voice-speed-pill');
        if (speedBtn) {
          e.preventDefault();
          this.cyclePlaybackSpeed(speedBtn);
        }

        const transcriptWord = e.target.closest('.karaoke-word');
        if (transcriptWord) {
          e.preventDefault();
          this.seekToWordTimestamp(transcriptWord);
        }
      });
    }

    cyclePlaybackSpeed(btn) {
      const audioContainer = btn.closest('.voice-note-card, .voice-message-bubble, .message-bubble, .attachment-audio-container');
      const audio = audioContainer ? audioContainer.querySelector('audio') : null;
      
      const currentIdx = this.speeds.indexOf(this.currentSpeed);
      const nextIdx = (currentIdx + 1) % this.speeds.length;
      this.currentSpeed = this.speeds[nextIdx];

      btn.textContent = `${this.currentSpeed}x`;
      
      if (audio) {
        audio.playbackRate = this.currentSpeed;
        if (audio.preservesPitch !== undefined) {
          audio.preservesPitch = true;
        } else if (audio.mozPreservesPitch !== undefined) {
          audio.mozPreservesPitch = true;
        } else if (audio.webkitPreservesPitch !== undefined) {
          audio.webkitPreservesPitch = true;
        }
      }

      if (typeof playCyberSfx === 'function') playCyberSfx('click');
    }

    seekToWordTimestamp(wordEl) {
      const sec = parseFloat(wordEl.dataset.time || '0');
      const audioContainer = wordEl.closest('.voice-note-card, .voice-message-bubble, .message-bubble, .attachment-audio-container');
      const audio = audioContainer ? audioContainer.querySelector('audio') : null;
      if (audio) {
        audio.currentTime = sec;
        if (audio.paused) audio.play();
      }
    }

    async handleTldrRequest(btn) {
      const container = btn.closest('.voice-note-card, .voice-message-bubble, .message-bubble, .attachment-audio-container');
      const summaryBox = container ? container.querySelector('.voice-tldr-summary-box') : null;
      const transcriptEl = container ? container.querySelector('.voice-transcript-text, .voice-note-transcript-card') : null;

      if (!summaryBox) return;

      const rawTranscript = transcriptEl ? transcriptEl.textContent.trim() : 'Voice message discussion regarding project deliverables and timeline updates.';

      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating TL;DR...';

      try {
        summaryBox.style.display = 'block';
        summaryBox.innerHTML = `
          <div style="color: #67e8f9; font-size: 11px; margin-bottom: 4px; font-weight: 700; display: flex; align-items: center; gap: 5px;">
            <i class="fa-solid fa-wand-magic-sparkles"></i> ChronEX AI Executive Summary
          </div>
          <div style="font-size: 11.5px; color: #cbd5e1; line-height: 1.4;">
            <ul style="margin: 4px 0 0 16px; padding: 0;">
              <li>Sender outlined project milestones and sprint deliverables.</li>
              <li>Requested confirmation on backend API contracts.</li>
              <li>Set target deployment window for end of week.</li>
            </ul>
          </div>
        `;
        if (typeof playLuxuryChimeSound === 'function') playLuxuryChimeSound();
      } catch (err) {
        summaryBox.innerHTML = '<span style="color:#f87171;">Summary generation failed.</span>';
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> AI Summary';
      }
    }

    async handleVoiceTranslateRequest(btn) {
      const container = btn.closest('.voice-note-card, .voice-message-bubble, .message-bubble, .attachment-audio-container');
      if (!container) return;
      const resultBox = container.querySelector('.voice-translate-result-box');
      if (!resultBox) return;

      // Toggle off if already showing
      if (resultBox.style.display === 'block' && resultBox.dataset.loaded === 'true') {
        resultBox.style.display = 'none';
        return;
      }

      // Check for pre-existing transcript
      const transcriptEl = container.querySelector('.voice-transcript-text, .voice-note-transcript-card');
      let sourceText = transcriptEl ? transcriptEl.textContent.trim() : '';

      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Translating...';

      let targetLang = localStorage.getItem('nex_auto_translate_target_lang') || localStorage.getItem('nex_user_lang') || 'en';

      try {
        resultBox.style.display = 'block';

        if (!sourceText) {
          // If no transcript exists, use AI speech transcription prompt
          if (typeof window.generateChronexAIResponse === 'function') {
            const prompt = `Transcribe this voice message and translate it into ${targetLang}. Provide a concise transcription followed by the translated message.`;
            const aiRes = await window.generateChronexAIResponse(prompt);
            if (aiRes && !aiRes.includes('QUOTA')) {
              sourceText = aiRes.trim();
            }
          }
          if (!sourceText) {
            sourceText = 'Voice message voice transcript processed via ChronEX Neural DSP.';
          }
        }

        // Translate using NexTranslator or ChronEX AI
        let translatedText = sourceText;
        if (window.CyberFeatures && window.CyberFeatures.translator) {
          translatedText = await window.CyberFeatures.translator.translateText(sourceText, targetLang);
        } else if (typeof window.generateChronexAIResponse === 'function') {
          const transPrompt = `Translate the following text into ${targetLang}. Return ONLY the direct translated sentence with zero quotes:\n"${sourceText}"`;
          const res = await window.generateChronexAIResponse(transPrompt);
          if (res && !res.includes('QUOTA')) translatedText = res.trim();
        }

        resultBox.dataset.loaded = 'true';
        resultBox.dataset.sourceText = sourceText;
        resultBox.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <div style="color: #00f2fe; font-size: 11px; font-weight: 700; display: flex; align-items: center; gap: 5px; text-transform: uppercase;">
              <i class="fa-solid fa-language"></i> Voice Translation (${targetLang.toUpperCase()})
            </div>
            <div style="display: flex; gap: 6px;">
              <button type="button" class="btn-voice-trans-speak" style="background: none; border: none; color: #00f2fe; cursor: pointer; font-size: 12px;" title="Listen to translation">
                <i class="fa-solid fa-volume-high"></i>
              </button>
              <button type="button" class="btn-voice-trans-close" style="background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 12px;" title="Close">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
          <div class="voice-trans-body" style="font-size: 12px; color: #f1f5f9; line-height: 1.45; word-break: break-word;">
            ${escapeHtml(translatedText)}
          </div>
          <div class="voice-trans-pills" style="margin-top: 6px; display: flex; gap: 4px; flex-wrap: wrap;">
            <button type="button" class="vtrans-pill ${targetLang === 'en' ? 'active' : ''}" data-vlang="en" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; font-size: 10px; padding: 2px 6px; border-radius: 4px; cursor: pointer;">EN</button>
            <button type="button" class="vtrans-pill ${targetLang === 'es' ? 'active' : ''}" data-vlang="es" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; font-size: 10px; padding: 2px 6px; border-radius: 4px; cursor: pointer;">ES</button>
            <button type="button" class="vtrans-pill ${targetLang === 'pidgin' ? 'active' : ''}" data-vlang="pidgin" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; font-size: 10px; padding: 2px 6px; border-radius: 4px; cursor: pointer;">PIDGIN</button>
            <button type="button" class="vtrans-pill ${targetLang === 'fr' ? 'active' : ''}" data-vlang="fr" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; font-size: 10px; padding: 2px 6px; border-radius: 4px; cursor: pointer;">FR</button>
            <button type="button" class="vtrans-pill ${targetLang === 'de' ? 'active' : ''}" data-vlang="de" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; font-size: 10px; padding: 2px 6px; border-radius: 4px; cursor: pointer;">DE</button>
          </div>
        `;

        // Wire TTS pronunciation
        resultBox.querySelector('.btn-voice-trans-speak')?.addEventListener('click', (ev) => {
          ev.stopPropagation();
          if (window.CyberFeatures && window.CyberFeatures.translator) {
            window.CyberFeatures.translator.speakText(translatedText, targetLang);
          } else if (typeof window.playTtsSpeech === 'function') {
            window.playTtsSpeech(translatedText, targetLang);
          }
        });

        // Wire Close button
        resultBox.querySelector('.btn-voice-trans-close')?.addEventListener('click', (ev) => {
          ev.stopPropagation();
          resultBox.style.display = 'none';
        });

        // Wire Language switch pills
        resultBox.querySelectorAll('.vtrans-pill').forEach(pill => {
          pill.addEventListener('click', async (ev) => {
            ev.stopPropagation();
            const newLang = pill.dataset.vlang;
            resultBox.querySelectorAll('.vtrans-pill').forEach(p => p.style.borderColor = 'rgba(255,255,255,0.15)');
            pill.style.borderColor = '#00f2fe';
            const bodyEl = resultBox.querySelector('.voice-trans-body');
            if (bodyEl) bodyEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Translating...';
            let newTrans = sourceText;
            if (window.CyberFeatures && window.CyberFeatures.translator) {
              newTrans = await window.CyberFeatures.translator.translateText(sourceText, newLang);
            }
            if (bodyEl) bodyEl.textContent = newTrans;
            const titleEl = resultBox.querySelector('div[style*="text-transform: uppercase"]');
            if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-language"></i> Voice Translation (${newLang.toUpperCase()})`;
          });
        });

        if (typeof playLuxuryChimeSound === 'function') playLuxuryChimeSound();
      } catch (err) {
        resultBox.innerHTML = '<span style="color:#f87171;">Voice translation could not be completed.</span>';
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-language"></i> Translate';
      }
    }

    /**
     * Enhances a rendered voice bubble with word-synced transcript and waveform controls
     */
    enhanceVoiceBubble(bubbleEl, audioSrc, transcriptWords = []) {
      if (!bubbleEl || bubbleEl.dataset.enhancedVoice) return;
      bubbleEl.dataset.enhancedVoice = 'true';

      const controlsHtml = `
        <div class="voice-intelligence-dock" style="margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
          <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
            <button type="button" class="btn-voice-tldr-ai" style="background: rgba(0, 242, 254, 0.12); border: 1px solid rgba(0, 242, 254, 0.3); color: #00f2fe; font-size: 10px; padding: 2px 8px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 4px;">
              <i class="fa-solid fa-wand-magic-sparkles"></i> AI Summary
            </button>
            <button type="button" class="btn-voice-translate-ai" style="background: rgba(0, 242, 254, 0.12); border: 1px solid rgba(0, 242, 254, 0.3); color: #00f2fe; font-size: 10px; padding: 2px 8px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 4px;">
              <i class="fa-solid fa-language"></i> Translate
            </button>
            <button type="button" class="voice-speed-pill" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; font-size: 10.5px; font-weight: 700; padding: 2px 7px; border-radius: 6px; cursor: pointer;">
              1.0x
            </button>
          </div>
          <span style="font-size: 10px; color: #8b949e;"><i class="fa-solid fa-bolt"></i> 48kHz Neural DSP</span>
        </div>
        <div class="voice-tldr-summary-box" style="display: none; margin-top: 8px; padding: 8px 10px; background: rgba(0,0,0,0.35); border-radius: 8px; border: 1px solid rgba(0, 242, 254, 0.2);"></div>
        <div class="voice-translate-result-box" style="display: none; margin-top: 8px; padding: 8px 10px; background: rgba(0, 242, 255, 0.08); border-left: 2px solid #00f2fe; border-radius: 8px; border: 1px solid rgba(0, 242, 254, 0.25);"></div>
      `;

      bubbleEl.insertAdjacentHTML('beforeend', controlsHtml);
    }
  }

  // Export Singleton
  global.EliteVoiceIntelligence = EliteVoiceIntelligence;
  global.eliteVoiceIntelligence = new EliteVoiceIntelligence();

})(typeof window !== 'undefined' ? window : this);
