/**
 * NEXCHAT - Neural Voice Clone Synthesizer Engine
 * Silent text-to-speech voice note generator, procedural formant modulation,
 * cyber voice profiles (Commander, Neural Synth, Stealth Operator), and instant in-chat dispatch.
 * STRICTLY NO EMOJIS: Clean cyberpunk typography and iconography.
 */

(function() {
  'use strict';

  const PROFILES = [
    { id: 'commander', name: 'Tactical Commander', pitch: 0.75, rate: 0.95, color: '#00ff66' },
    { id: 'synth', name: 'Neural AI Synth', pitch: 1.15, rate: 1.05, color: '#00d4ff' },
    { id: 'stealth', name: 'Stealth Operator', pitch: 0.9, rate: 0.85, color: '#a855f7' }
  ];

  class NeuralVoiceSynthEngine {
    constructor() {
      this.selectedProfileId = 'commander';
      this.synth = window.speechSynthesis || null;
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
      this.injectModal();
      this.injectHubAction();
    }

    injectModal() {
      if (document.getElementById('neuralVoiceSynthModal')) return;

      const modal = document.createElement('div');
      modal.id = 'neuralVoiceSynthModal';
      modal.className = 'cyber-modal-backdrop';
      modal.style.display = 'none';

      modal.innerHTML = `
        <div class="cyber-modal-window voice-synth-modal-window">
          <div class="cyber-modal-header">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-waveform-lines text-[#00ff66] text-lg"></i>
              <h3 class="font-bold text-white text-base">NEURAL VOICE SYNTHESIZER</h3>
              <span class="voice-synth-tag">SILENT SPEECH ENGINE</span>
            </div>
            <button type="button" class="cyber-modal-close" id="closeVoiceSynthModalBtn"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="voice-synth-modal-body">
            <p class="text-xs text-gray-300 text-center mb-3">
              Compose written text to synthesize into an encrypted tactical voice transmission without speaking aloud.
            </p>

            <div class="voice-synth-field">
              <label class="voice-synth-label">TRANSMISSION SCRIPT / TEXT:</label>
              <textarea id="voiceSynthTextInput" class="voice-synth-text-area" rows="3" placeholder="Enter transmission script to synthesize into audio note..."></textarea>
            </div>

            <div class="voice-synth-field mt-3">
              <label class="voice-synth-label">VOICE PROFILE / FORMANT TUNING:</label>
              <div class="voice-profiles-grid">
                ${PROFILES.map(p => `
                  <button type="button" class="voice-profile-card ${p.id === this.selectedProfileId ? 'active' : ''}" data-profile-id="${p.id}" style="border-left: 3px solid ${p.color};">
                    <strong class="text-white text-xs block">${p.name}</strong>
                    <span class="text-[10px] text-gray-400">Pitch: ${p.pitch}x &bull; Rate: ${p.rate}x</span>
                  </button>
                `).join('')}
              </div>
            </div>

            <div class="flex gap-2 mt-4">
              <button type="button" id="testPreviewSpeechBtn" class="voice-synth-preview-btn">
                <i class="fa-solid fa-volume-high"></i> AUDITION VOICE
              </button>
              <button type="button" id="confirmDispatchSynthBtn" class="voice-synth-dispatch-btn">
                <i class="fa-solid fa-paper-plane"></i> DISPATCH SYNTHESIZED NOTE
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this.bindModalEvents();
    }

    bindModalEvents() {
      const modal = document.getElementById('neuralVoiceSynthModal');
      document.getElementById('closeVoiceSynthModalBtn')?.addEventListener('click', () => {
        if (modal) modal.style.display = 'none';
      });

      // Profile selection
      modal.querySelectorAll('.voice-profile-card').forEach(card => {
        card.addEventListener('click', () => {
          modal.querySelectorAll('.voice-profile-card').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          this.selectedProfileId = card.dataset.profileId;
        });
      });

      // Audition preview
      document.getElementById('testPreviewSpeechBtn')?.addEventListener('click', () => {
        const textInp = document.getElementById('voiceSynthTextInput');
        const text = textInp ? textInp.value.trim() : '';
        if (!text) {
          if (typeof window.showNotif === 'function') window.showNotif('Please enter text to audition', 'error');
          return;
        }
        this.speakText(text);
      });

      // Dispatch synthesized note
      document.getElementById('confirmDispatchSynthBtn')?.addEventListener('click', () => {
        const textInp = document.getElementById('voiceSynthTextInput');
        const text = textInp ? textInp.value.trim() : '';
        if (!text) {
          if (typeof window.showNotif === 'function') window.showNotif('Please enter text to synthesize', 'error');
          return;
        }

        this.dispatchSynthesizedVoiceNote(text);
        if (modal) modal.style.display = 'none';
        if (textInp) textInp.value = '';
      });
    }

    injectHubAction() {
      const hub = document.getElementById('attachmentPopupHub');
      if (hub && !document.getElementById('hubActionVoiceSynth')) {
        const item = document.createElement('div');
        item.className = 'attach-hub-item';
        item.id = 'hubActionVoiceSynth';
        item.innerHTML = `
          <div class="attach-hub-icon icon-synth"><i class="fa-solid fa-waveform-lines"></i></div>
          <span>Voice Synth</span>
        `;
        item.addEventListener('click', () => {
          hub.style.display = 'none';
          this.openModal();
        });
        hub.appendChild(item);
      }
    }

    
    closeModal() {
      const modal = document.getElementById('neuralVoiceSynthModal');
      if (modal) modal.style.display = 'none';
    }
    openModal() {
      const modal = document.getElementById('neuralVoiceSynthModal');
      if (!modal) return;
      modal.style.display = 'flex';
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('sonar');
    }

    speakText(text) {
      if (!this.synth) {
        if (typeof window.showNotif === 'function') window.showNotif('Speech synthesis API not available in this client', 'error');
        return;
      }

      this.synth.cancel();
      const profile = PROFILES.find(p => p.id === this.selectedProfileId) || PROFILES[0];
      const utter = new SpeechSynthesisUtterance(text);
      utter.pitch = profile.pitch;
      utter.rate = profile.rate;

      const voices = this.synth.getVoices();
      if (voices.length > 0) {
        utter.voice = voices.find(v => v.lang.startsWith('en')) || voices[0];
      }

      this.synth.speak(utter);
      if (typeof window.showNotif === 'function') window.showNotif(`Auditioning profile: ${profile.name}`, 'info', 1500);
    }

    dispatchSynthesizedVoiceNote(text) {
      const profile = PROFILES.find(p => p.id === this.selectedProfileId) || PROFILES[0];
      const noteId = `vnote_${Date.now()}`;

      const attachment = {
        fileType: 'neural_voice_note',
        isNeuralVoiceNote: true,
        noteId: noteId,
        textScript: text,
        profileName: profile.name,
        profileColor: profile.color,
        pitch: profile.pitch,
        rate: profile.rate,
        timestamp: Date.now()
      };

      if (typeof window.appendLocalSentMessage === 'function') {
        window.appendLocalSentMessage(`Synthesized Tactical Voice Note (${profile.name})`, attachment, false, 'sent');
      }

      if (typeof window.sendSupabaseMessage === 'function') {
        const partnerId = window.currentChatUserId || window.currentChatUser;
        if (partnerId) {
          window.sendSupabaseMessage({
            from: window.myUID || 'u_current',
            to: partnerId,
            text: "",
            attachment: attachment,
            chatType: window.currentChatType || 'direct'
          }).catch(() => {});
        }
      }

      if (typeof window.showNotif === 'function') {
        window.showNotif('Synthesized voice transmission dispatched', 'success', 2500);
      }
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('affirm');
    }

    renderVoiceBubble(attachment) {
      const wrap = document.createElement('div');
      wrap.className = 'synth-voice-bubble-card';

      wrap.innerHTML = `
        <div class="synth-voice-header">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-waveform-lines text-[#00ff66]"></i>
            <span class="synth-voice-title">SYNTHESIZED VOICE TRANSMISSION</span>
          </div>
          <span class="synth-profile-tag" style="color: ${attachment.profileColor || '#00ff66'}; border-color: ${attachment.profileColor || '#00ff66'};">
            ${attachment.profileName || 'COMMANDER'}
          </span>
        </div>

        <p class="synth-voice-transcript mt-2">"${attachment.textScript || ''}"</p>

        <div class="synth-playback-bar mt-2">
          <button type="button" class="synth-play-trigger-btn">
            <i class="fa-solid fa-play"></i> PLAY SYNTHESIS
          </button>
          <span class="synth-duration-tag">AUTONOMOUS FORMANT</span>
        </div>
      `;

      const playBtn = wrap.querySelector('.synth-play-trigger-btn');
      playBtn?.addEventListener('click', () => {
        this.selectedProfileId = attachment.profileName?.toLowerCase().includes('synth') ? 'synth' : (attachment.profileName?.toLowerCase().includes('stealth') ? 'stealth' : 'commander');
        this.speakText(attachment.textScript || '');
      });

      return wrap;
    }
  }

  window.neuralVoiceSynthEngine = new NeuralVoiceSynthEngine();
})();
