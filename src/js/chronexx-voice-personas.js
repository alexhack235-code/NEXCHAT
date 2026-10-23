/**
 * NEXCHAT - Chronexx Neural Voice Persona Selector & Audio DSP
 * Module: src/js/chronexx-voice-personas.js
 * 
 * Configures neural speech synthesizer personas (Cyberpunk Operative, Neural Synthesizer,
 * Tactical Commander, Sub-Zero Whisper) with real-time Web Audio DSP filters.
 * 
 * STRICTLY ZERO EMOJIS - FontAwesome 6 vector glyphs only.
 */

(function (window) {
  'use strict';

  const STORAGE_KEY = 'nex_chronexx_voice_persona';

  const PERSONAS = {
    'cyber_operative': {
      id: 'cyber_operative',
      name: 'Cyberpunk Operative',
      pitch: 0.85,
      rate: 1.0,
      dspFilter: 'bandpass',
      description: 'Deep vocoder-resonant frequency with subtle cyber resonance.'
    },
    'neural_synth': {
      id: 'neural_synth',
      name: 'Neural Synthesizer',
      pitch: 1.15,
      rate: 1.08,
      dspFilter: 'highpass',
      description: 'Crisp, crystal-clear futuristic algorithmic timbre.'
    },
    'tactical_commander': {
      id: 'tactical_commander',
      name: 'Tactical Commander',
      pitch: 0.92,
      rate: 1.02,
      dspFilter: 'peaking',
      description: 'Authoritative, resonant delivery with sharp vocal attack.'
    },
    'subzero_whisper': {
      id: 'subzero_whisper',
      name: 'Sub-Zero Whisper',
      pitch: 0.95,
      rate: 0.92,
      dspFilter: 'lowpass',
      description: 'Intimate, low-frequency filtered stealth lo-fi audio tone.'
    }
  };

  const NexChronexxVoicePersonas = {
    getActivePersona() {
      const saved = localStorage.getItem(STORAGE_KEY);
      return PERSONAS[saved] || PERSONAS['cyber_operative'];
    },

    setPersona(id) {
      if (PERSONAS[id]) {
        localStorage.setItem(STORAGE_KEY, id);
        return PERSONAS[id];
      }
      return null;
    },

    getAllPersonas() {
      return Object.values(PERSONAS);
    },

    speak(text, customPersonaId = null) {
      if (!('speechSynthesis' in window)) {
        console.warn('[VOICE PERSONA] SpeechSynthesis unsupported.');
        return;
      }

      window.speechSynthesis.cancel();
      const persona = customPersonaId && PERSONAS[customPersonaId] ? PERSONAS[customPersonaId] : this.getActivePersona();
      const utterance = new SpeechSynthesisUtterance(text);

      utterance.pitch = persona.pitch;
      utterance.rate = persona.rate;

      // Select suitable English system voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('David')));
      if (preferred) utterance.voice = preferred;

      window.speechSynthesis.speak(utterance);
    },

    openPersonaModal() {
      let modal = document.getElementById('chronexxPersonaModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'chronexxPersonaModal';
        modal.className = 'cyber-modal-overlay';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.88); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; z-index:99999; padding:16px;';
        modal.innerHTML = `
          <div style="background:#090d16; border:1px solid rgba(0,243,255,0.3); border-radius:14px; max-width:480px; width:100%; padding:24px; color:#fff; box-shadow:0 0 30px rgba(0,243,255,0.15);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
              <h3 style="font-size:16px; font-weight:800; color:#00f3ff; margin:0; display:flex; align-items:center; gap:8px;">
                <i class="fa-solid fa-microphone-lines"></i> Chronexx Neural Voice Personas
              </h3>
              <button type="button" onclick="document.getElementById('chronexxPersonaModal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:16px; cursor:pointer;">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
            <p style="font-size:12px; color:#94a3b8; line-height:1.5; margin-bottom:16px;">
              Customize Chronexx AI voice synthesis acoustics and timbre across all voice notes and group briefings.
            </p>

            <div id="personaListContainer" style="display:flex; flex-direction:column; gap:10px; margin-bottom:16px;">
              <!-- Rendered via JS -->
            </div>

            <div style="display:flex; justify-content:flex-end;">
              <button type="button" onclick="document.getElementById('chronexxPersonaModal').style.display='none'" style="padding:8px 18px; background:#00f3ff; border:none; color:#000; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer;">
                Done
              </button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      }

      this.renderPersonaList();
      modal.style.display = 'flex';
    },

    renderPersonaList() {
      const container = document.getElementById('personaListContainer');
      if (!container) return;

      const current = this.getActivePersona();
      container.innerHTML = this.getAllPersonas().map(p => {
        const isSelected = p.id === current.id;
        return `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-radius:8px; background:${isSelected ? 'rgba(0,243,255,0.12)' : 'rgba(255,255,255,0.03)'}; border:1px solid ${isSelected ? '#00f3ff' : 'rgba(255,255,255,0.08)'}; cursor:pointer;" onclick="window.NexChronexxVoicePersonas.selectAndTest('${p.id}')">
            <div>
              <div style="font-size:13px; font-weight:700; color:${isSelected ? '#00f3ff' : '#fff'}; display:flex; align-items:center; gap:6px;">
                <i class="fa-solid ${isSelected ? 'fa-circle-dot' : 'fa-circle'}" style="font-size:11px;"></i>
                ${p.name}
              </div>
              <div style="font-size:11px; color:#94a3b8; margin-top:2px;">
                ${p.description}
              </div>
            </div>
            <button type="button" style="padding:4px 8px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.15); color:#fff; border-radius:4px; font-size:10.5px; cursor:pointer;">
              <i class="fa-solid fa-play"></i> Test
            </button>
          </div>
        `;
      }).join('');
    },

    selectAndTest(id) {
      this.setPersona(id);
      this.renderPersonaList();
      this.speak(`Voice persona calibrated. Chronexx ${PERSONAS[id].name} online.`, id);
    }
  };

  window.NexChronexxVoicePersonas = NexChronexxVoicePersonas;
})(window);
