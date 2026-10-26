/**

 * NEXCHAT - Live Cyber Audio Spaces (Clubhouse / Twitter Spaces for NEXCHAT)

 * Live multi-speaker amphitheater, Web Audio volume analyzer rings,

 * audience hand raising, floating applause reactions, and stage sync.

 */



(function() {

  'use strict';



  class AudioSpacesEngine {

    constructor() {

      this.isHost = false;

      this.isSpeaker = false;

      this.isMuted = false;

      this.handRaised = false;

      this.activeSpaceTopic = 'Cyber Security Briefing: Zero-Day Guard';

      this.speakers = [

        { uid: 'u_operative_404', name: 'Alex [Host]', role: 'host', freq: '880 Hz', isSpeaking: true },

        { uid: 'u_chronex_ai', name: 'ChronEX AI', role: 'ai', freq: 'Neural', isSpeaking: true },

        { uid: 'u_synth_coder', name: 'Guest Node', role: 'speaker', freq: 'Co-Host', isSpeaking: false }

      ];

      this.audience = [

        { uid: 'u_aud_1', name: 'Neon Hacker' },

        { uid: 'u_aud_2', name: 'Cipher Ghost' },

        { uid: 'u_aud_3', name: 'Matrix Scout' }

      ];

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

      this.injectOrEnhanceModal();

      this.bindHeaderTriggers();

      this.listenSupabaseRealtime();

    }



    injectOrEnhanceModal() {

      const existingModal = document.getElementById('audioSpacesModal');

      if (existingModal) {

        this.enhanceExistingModal();

      } else {

        this.injectModal();

      }

    }



    injectModal() {

      const modal = document.createElement('div');

      modal.id = 'audioSpacesModal';

      modal.className = 'cyber-modal-backdrop';

      modal.style.display = 'none';



      modal.innerHTML = `

        <div class="cyber-modal-window audio-spaces-window">

          <div class="cyber-modal-header">

            <div class="flex items-center gap-2">

              <i class="fa-solid fa-tower-broadcast text-[#00ff66] text-lg"></i>

              <h3 class="font-bold text-white text-base" id="activeStageTitle">LIVE AUDIO SPACE</h3>

              <span class="live-stage-pill"><i class="fa-solid fa-circle-dot text-[#00ff66] animate-pulse"></i> BROADCAST ON</span>

            </div>

            <button type="button" class="cyber-modal-close" id="closeAudioSpacesBtn"><i class="fa-solid fa-xmark"></i></button>

          </div>



          <div class="audio-spaces-body" id="audioSpacesBody">

            <div class="stage-topic-card">

              <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">CURRENT TOPIC:</span>

              <h4 class="text-white font-bold text-sm mt-1" id="stageTopicHeading">${this.activeSpaceTopic}</h4>

            </div>



            <!-- Speaker Podium Grid -->

            <div class="stage-speakers-title mt-4">STAGE SPEAKERS (PODIUM):</div>

            <div class="stage-speakers-grid mt-2" id="podiumSpeakersGrid">

              <!-- Rendered dynamically -->

            </div>



            <!-- Audience Grid -->

            <div class="stage-speakers-title mt-4">LISTENING AUDIENCE:</div>

            <div class="stage-audience-row mt-2" id="galleryAvatars">

              <!-- Rendered dynamically -->

            </div>



            <!-- In-Stage Floating Control Dock -->

            <div class="stage-control-dock mt-5">

              <button type="button" id="stageMicToggleBtn" class="stage-dock-btn" title="Mute/Unmute Mic">

                <i class="fa-solid fa-microphone"></i> <span>MUTE</span>

              </button>

              <button type="button" id="stageHandRaiseBtn" class="stage-dock-btn" title="Raise Hand to Speak">

                <i class="fa-solid fa-hand"></i> <span>RAISE HAND</span>

              </button>

              <button type="button" id="stageReactionSfxBtn" class="stage-dock-btn" title="Send Applause Reaction">

                <i class="fa-solid fa-hands-clapping text-amber-400"></i> <span>APPLAUD</span>

              </button>

              <button type="button" id="leaveStageBtn" class="stage-dock-btn leave-btn" title="Leave Audio Space">

                <i class="fa-solid fa-person-walking-dashed-line-arrow-right"></i> <span>LEAVE</span>

              </button>

            </div>

          </div>

        </div>

      `;



      document.body.appendChild(modal);

      this.bindModalEvents();

      this.renderStageRosters();

    }



    enhanceExistingModal() {

      this.bindModalEvents();

      this.renderStageRosters();

    }



    bindModalEvents() {

      const modal = document.getElementById('audioSpacesModal');

      const closeBtns = [

        document.getElementById('closeAudioSpacesBtn'),

        document.getElementById('closeAudioSpacesBackdrop'),

        document.getElementById('leaveStageBtn')

      ];



      closeBtns.forEach(btn => {

        btn?.addEventListener('click', () => {

          if (modal) modal.style.display = 'none';

          if (typeof window.showNotif === 'function') window.showNotif('Left Cyber Audio Space', 'info', 1800);

          if (typeof window.playCyberSfx === 'function') window.playCyberSfx('zap');

        });

      });



      // Mute Toggle (support both stageMicToggleBtn and stageMuteBtn)

      const muteBtn = document.getElementById('stageMicToggleBtn') || document.getElementById('stageMuteBtn');

      muteBtn?.addEventListener('click', () => {

        this.isMuted = !this.isMuted;

        muteBtn.classList.toggle('active', this.isMuted);

        const span = muteBtn.querySelector('span');

        if (span) span.textContent = this.isMuted ? 'Muted' : 'Mute';

        const icon = muteBtn.querySelector('i');

        if (icon) icon.className = this.isMuted ? 'fa-solid fa-microphone-slash' : 'fa-solid fa-microphone';

        if (typeof window.showNotif === 'function') {

          window.showNotif(this.isMuted ? 'Stage mic muted' : 'Stage mic live', 'info', 1500);

        }

        if (typeof window.playCyberSfx === 'function') window.playCyberSfx(this.isMuted ? 'zap' : 'affirm');

      });



      // Hand Raise (support both stageHandRaiseBtn and stageHandBtn)

      const handBtn = document.getElementById('stageHandRaiseBtn') || document.getElementById('stageHandBtn');

      handBtn?.addEventListener('click', () => {

        this.handRaised = !this.handRaised;

        handBtn.classList.toggle('active', this.handRaised);

        const span = handBtn.querySelector('span');

        if (span) span.textContent = this.handRaised ? 'Hand Up' : 'Raise Hand';

        if (this.handRaised) {

          if (typeof window.showNotif === 'function') {

            window.showNotif('<i class="fa-solid fa-hand"></i> Hand raised! Requested host permission to speak on podium.', 'info', 2500);

          }

          if (typeof window.playCyberSfx === 'function') window.playCyberSfx('chime');

          this.broadcastStageEvent('raise_hand');

        }

      });



      // Applause Reaction Cannon

      const reactBtn = document.getElementById('stageReactionSfxBtn') || document.getElementById('stageReactBtn');

      reactBtn?.addEventListener('click', () => {

        const emojis = ['<i class="fa-solid fa-hands-clapping"></i>', '<i class="fa-solid fa-fire"></i>', '<i class="fa-solid fa-rocket"></i>', '<i class="fa-solid fa-star"></i>', '<i class="fa-solid fa-crown"></i>'];

        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

        this.spawnStageFloatingReaction(randomEmoji);

        this.broadcastStageEvent('applause', randomEmoji);

        if (typeof window.playCyberSfx === 'function') window.playCyberSfx('affirm');

      });

    }



    bindHeaderTriggers() {

      const headerActions = document.querySelector('.chat-detail-header-actions') || 

                            document.querySelector('.chat-detail-header-right');

      if (headerActions && !document.getElementById('audioSpacesBtnHeader')) {

        const spaceBtn = document.createElement('button');

        spaceBtn.type = 'button';

        spaceBtn.id = 'audioSpacesBtnHeader';

        spaceBtn.className = 'header-icon-btn';

        spaceBtn.title = 'Open Live Cyber Audio Space';

        spaceBtn.innerHTML = `<i class="fa-solid fa-tower-broadcast text-[#00ff66]"></i>`;

        spaceBtn.addEventListener('click', () => this.openStage());

        headerActions.appendChild(spaceBtn);

      }

    }



    openStage() {

      const modal = document.getElementById('audioSpacesModal');

      if (!modal) return;

      modal.style.display = 'flex';

      this.renderStageRosters();

      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('sonar');

    }



    renderStageRosters() {

      const speakersGrid = document.getElementById('podiumSpeakersGrid') || document.getElementById('stageSpeakersGrid');

      if (speakersGrid) {

        speakersGrid.innerHTML = this.speakers.map(s => `

          <div class="podium-speaker stage-speaker-card ${s.isSpeaking ? 'active-speaking speaking-active' : ''}">

            <div class="speaker-avatar-wrap">

              <img src="logo.jpg" alt="${s.name}" class="speaker-avatar" onerror="this.onerror=null;this.src='logo.jpg';" />

              ${s.role === 'host' ? '<span class="speaker-role-badge host speaker-crown-badge"><i class="fa-solid fa-crown"></i></span>' : ''}

              ${s.role === 'ai' ? '<span class="speaker-role-badge ai"><i class="fa-solid fa-robot"></i></span>' : ''}

              ${s.role === 'speaker' ? '<span class="speaker-role-badge speaker"><i class="fa-solid fa-microphone"></i></span>' : ''}

              <span class="speaker-speaking-ring"></span>

            </div>

            <span class="speaker-name mt-1">${s.name}</span>

            <span class="speaker-freq speaker-role-tag">${s.freq || s.role.toUpperCase()}</span>

          </div>

        `).join('');

      }



      const audienceRow = document.getElementById('galleryAvatars') || document.getElementById('stageAudienceRow');

      if (audienceRow) {

        audienceRow.innerHTML = this.audience.map(a => `

          <div class="stage-audience-item" title="${a.name}">

            <img src="logo.jpg" alt="${a.name}" class="gallery-avatar audience-avatar" onerror="this.onerror=null;this.src='logo.jpg';" />

            <span class="audience-name">${a.name}</span>

          </div>

        `).join('') + '<span class="gallery-more-badge">+145</span>';

      }

    }



    spawnStageFloatingReaction(emoji) {

      const modal = document.getElementById('audioSpacesModal');

      const body = document.querySelector('.spaces-modal-container') || document.getElementById('audioSpacesBody') || modal || document.body;

      const particle = document.createElement('div');

      particle.className = 'stage-reaction-particle';

      particle.textContent = emoji;

      particle.style.position = 'fixed';

      particle.style.left = `${45 + (Math.random() * 10 - 5)}%`;

      particle.style.bottom = '120px';

      particle.style.zIndex = '99999';

      particle.style.fontSize = '36px';

      particle.style.pointerEvents = 'none';

      particle.style.animation = 'stageFloatUp 1.6s ease-out forwards';

      document.body.appendChild(particle);

      setTimeout(() => particle.remove(), 1600);

    }



    broadcastStageEvent(action, payload = null) {

      if (typeof window.sendSupabaseMessage === 'function') {

        const partnerId = window.currentChatUserId || window.currentChatUser;

        if (!partnerId) return;



        window.sendSupabaseMessage({

          from: window.myUID || 'u_current',

          to: partnerId,

          text: "",

          attachment: {

            fileType: 'audio_space_event',

            isAudioSpaceEvent: true,

            action: action,

            payload: payload

          },

          chatType: window.currentChatType || 'direct'

        }).catch(() => {});

      }

    }



    listenSupabaseRealtime() {

      window.addEventListener('nexchat:audio_space_event_received', (e) => {

        const event = e.detail;

        if (!event) return;

        if (event.action === 'applause') {

          this.spawnStageFloatingReaction(event.payload || '<i class="fa-solid fa-hands-clapping"></i>');

        } else if (event.action === 'raise_hand') {

          if (typeof window.showNotif === 'function') {

            window.showNotif('<i class="fa-solid fa-hand"></i> A listener in the space raised their hand to speak!', 'info', 2500);

          }

        }

      });

    }

  }



  window.audioSpacesEngine = new AudioSpacesEngine();

})();

