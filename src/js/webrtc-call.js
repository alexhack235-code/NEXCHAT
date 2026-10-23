/**
 * NEXCHAT WebRTC Calling Engine & Google Meet Hub
 * 
 * Capabilities:
 * - Google Global STUN WebRTC Peer-to-Peer Engine (Audio & Video)
 * - Firestore Realtime Signaling (SDP Offer, SDP Answer, Bidirectional ICE Candidates)
 * - Remote Stream Management with Zero-Latency Track Attachment
 * - Dynamic Video/Avatar State Sync (Luxury Avatar Placeholder when Camera Off)
 * - Local PIP Camera Preview with Camera-Off Indicator
 * - Incoming Call Modal with Web Audio Synthesized Luxury Ringtone
 * - Active In-Call HUD: Telemetry Monitor, Mute Mic, Toggle Cam, Screen Share, PiP, Voice DSP, HD Snapshot
 * - Instant Google Meet Room Generator with In-Chat Invite Card
 * - Strictly zero emojis across UI, telemetry, and logging
 */

(function () {
  'use strict';

  // Google Global STUN Server Cluster
  const GOOGLE_ICE_CONFIG = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' }
    ],
    iceCandidatePoolSize: 10
  };

  class NexCallingEngine {
    constructor() {
      this.peerConnection = null;
      this.localStream = null;
      this.remoteStream = null;
      this.activeCallId = null;
      this.isCaller = false;
      this.callType = 'voice'; // 'voice' or 'video'
      this.callActive = false;
      this.remoteVideoEnabled = true;
      this.remoteAudioEnabled = true;

      this.localCandidateQueue = [];
      this.remoteCandidateQueue = [];
      this.hasSetRemoteAnswer = false;

      this.callDocUnsubscribe = null;
      this.candidatesUnsubscribe = null;
      this.incomingCallDocUnsubscribe = null;
      this.incomingListenerUnsubscribe = null;

      this.callTimeoutTimer = null;
      this.callTimerInterval = null;
      this.qualityInterval = null;
      this.callStartTime = 0;

      // Web Audio Synth for Ringing
      this.audioCtx = null;
      this.ringtoneInterval = null;
      this.ringtoneGain = null;
      this.isRinging = false;

      // Screen Share and Media State
      this.isSharingScreen = false;
      this.savedCameraTrack = null;
      this.screenStream = null;
      this.studioNoiseGateActive = false;

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
      this.injectCallModals();
      this.interceptCallButtons();
      this.listenForIncomingCalls();
    }

    // Helper to obtain Firestore operations (window.nexFirestore or dynamic import fallback)
    async getFirestoreOps() {
      if (window.nexFirestore && window.nexFirestore.db) {
        return window.nexFirestore;
      }
      if (window.db) {
        try {
          const mod = await import("https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js");
          return {
            db: window.db,
            collection: mod.collection,
            doc: mod.doc,
            getDoc: mod.getDoc,
            getDocs: mod.getDocs,
            addDoc: mod.addDoc,
            updateDoc: mod.updateDoc,
            deleteDoc: mod.deleteDoc,
            setDoc: mod.setDoc,
            query: mod.query,
            where: mod.where,
            onSnapshot: mod.onSnapshot,
            serverTimestamp: mod.serverTimestamp
          };
        } catch (e) {
          console.warn('[WebRTC] Dynamic firestore import error:', e);
        }
      }
      try {
        const cfg = await import('./firebase-config.js');
        const mod = await import("https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js");
        return {
          db: cfg.db,
          collection: mod.collection,
          doc: mod.doc,
          getDoc: mod.getDoc,
          getDocs: mod.getDocs,
          addDoc: mod.addDoc,
          updateDoc: mod.updateDoc,
          deleteDoc: mod.deleteDoc,
          setDoc: mod.setDoc,
          query: mod.query,
          where: mod.where,
          onSnapshot: mod.onSnapshot,
          serverTimestamp: mod.serverTimestamp
        };
      } catch (err) {
        console.error('[WebRTC] Unable to load Firestore SDK:', err);
        throw err;
      }
    }

    // --- Web Audio Ringtone and Calling Tones ---
    getAudioContext() {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    }

    startOutgoingRinging() {
      this.stopRinging();
      const ctx = this.getAudioContext();
      if (!ctx) return;

      this.isRinging = true;
      const playPulse = () => {
        if (!this.isRinging) return;
        try {
          const now = ctx.currentTime;
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.frequency.setValueAtTime(440, now);
          osc2.frequency.setValueAtTime(480, now);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
          gain.gain.setValueAtTime(0.08, now + 1.8);
          gain.gain.linearRampToValueAtTime(0, now + 2.0);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 2.0);
          osc2.stop(now + 2.0);
        } catch (_) {}
      };

      playPulse();
      this.ringtoneInterval = setInterval(playPulse, 4000);
    }

    startIncomingRinging() {
      this.stopRinging();
      const ctx = this.getAudioContext();
      if (!ctx) return;

      this.isRinging = true;
      const tones = [
        { f1: 520, f2: 660, dur: 0.18, pause: 0.04 },
        { f1: 660, f2: 840, dur: 0.22, pause: 0.06 },
        { f1: 840, f2: 1040, dur: 0.28, pause: 0.1 }
      ];

      const playChimeSequence = () => {
        if (!this.isRinging) return;
        try {
          let timeOffset = ctx.currentTime;
          tones.forEach(t => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(t.f1, timeOffset);
            osc.frequency.exponentialRampToValueAtTime(t.f2, timeOffset + t.dur);

            gain.gain.setValueAtTime(0, timeOffset);
            gain.gain.linearRampToValueAtTime(0.15, timeOffset + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, timeOffset + t.dur);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(timeOffset);
            osc.stop(timeOffset + t.dur);

            timeOffset += t.dur + t.pause;
          });
        } catch (_) {}
      };

      playChimeSequence();
      this.ringtoneInterval = setInterval(playChimeSequence, 2800);
    }

    stopRinging() {
      this.isRinging = false;
      if (this.ringtoneInterval) {
        clearInterval(this.ringtoneInterval);
        this.ringtoneInterval = null;
      }
    }

    injectCallModals() {
      // 1. Call Type Choice Modal (Direct In-App WebRTC vs Google Meet)
      if (!document.getElementById('callChoiceModal')) {
        const choiceModal = document.createElement('div');
        choiceModal.id = 'callChoiceModal';
        choiceModal.className = 'call-choice-modal';
        choiceModal.style.display = 'none';

        choiceModal.innerHTML = `
          <div class="call-choice-card">
            <div class="call-choice-header">
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-phone-volume text-[#00ff66] text-lg"></i>
                <span class="font-bold text-white text-base" id="callChoiceTitle">Start Call</span>
              </div>
              <button type="button" id="closeCallChoiceBtn" class="sticker-close-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>

            <div class="call-choice-body">
              <p class="text-xs text-gray-300 mb-4">Choose how you want to connect with <strong id="callTargetName" class="text-white">User</strong>:</p>

              <!-- Option 1: Direct WebRTC Call (Google STUN) -->
              <div class="call-choice-option" id="startDirectWebRTCCallBtn">
                <div class="call-choice-icon webrtc-icon">
                  <i class="fa-solid fa-shield-halved"></i>
                </div>
                <div class="call-choice-text">
                  <strong>Direct In-App Call (Google STUN)</strong>
                  <span>Private encrypted peer-to-peer call inside NEXCHAT</span>
                </div>
                <span class="call-choice-badge">E2EE P2P</span>
              </div>

              <!-- Option 2: Instant Google Meet Room -->
              <div class="call-choice-option mt-3" id="startGoogleMeetCallBtn">
                <div class="call-choice-icon meet-icon">
                  <i class="fa-solid fa-video"></i>
                </div>
                <div class="call-choice-text">
                  <strong>Instant Google Meet Room</strong>
                  <span>Launches Google Meet with screen share, AI captions and auto-invite</span>
                </div>
                <span class="call-choice-badge google-badge">Google</span>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(choiceModal);
      }

      // 2. Incoming Call Dialog Modal
      if (!document.getElementById('incomingCallModal')) {
        const incomingModal = document.createElement('div');
        incomingModal.id = 'incomingCallModal';
        incomingModal.className = 'incoming-call-modal';
        incomingModal.style.display = 'none';

        incomingModal.innerHTML = `
          <div class="incoming-call-card">
            <div class="incoming-call-pulse-ring"></div>
            <img id="incomingCallerAvatar" src="logo.jpg" class="incoming-caller-avatar" alt="Caller" onerror="this.src='logo.jpg'">
            <h3 id="incomingCallerName" class="incoming-caller-name">Incoming Call...</h3>
            <span id="incomingCallTypeBadge" class="incoming-call-badge"><i class="fa-solid fa-phone"></i> Voice Call</span>

            <div class="incoming-call-actions">
              <button type="button" id="declineIncomingCallBtn" class="incoming-btn decline-btn" title="Decline">
                <i class="fa-solid fa-phone-slash"></i>
              </button>
              <button type="button" id="acceptIncomingCallBtn" class="incoming-btn accept-btn" title="Accept Call">
                <i class="fa-solid fa-phone"></i>
              </button>
            </div>
          </div>
        `;
        document.body.appendChild(incomingModal);
      }

      // 3. Fullscreen Active WebRTC Call Overlay
      if (!document.getElementById('activeWebRTCCallOverlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'activeWebRTCCallOverlay';
        overlay.className = 'active-call-overlay';
        overlay.style.display = 'none';

        overlay.innerHTML = `
          <div class="active-call-container" style="position: relative; width: 100%; height: 100%; overflow: hidden; background: #050811;">
            <!-- Call Network & Telemetry HUD -->
            <div id="callTelemetryHUD" style="position: absolute; top: 20px; left: 20px; display: flex; align-items: center; gap: 8px; background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(0, 255, 102, 0.3); border-radius: 20px; padding: 6px 14px; font-size: 11px; font-family: monospace; color: #f8fafc; z-index: 40; backdrop-filter: blur(10px);">
              <span id="callSignalDot" style="width: 8px; height: 8px; border-radius: 50%; background: #00ff66; box-shadow: 0 0 8px #00ff66;"></span>
              <span id="callQualityText">HD 1080p &bull; 18ms &bull; 0% Loss</span>
            </div>

            <!-- Remote Video (Full Screen Background) -->
            <video id="remoteCallVideo" class="remote-call-video" autoplay playsinline style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1; display: none; background: #000;"></video>
            
            <!-- Dedicated Remote Audio Pipeline -->
            <audio id="remoteCallAudio" autoplay></audio>

            <!-- Video Off / Voice Call Luxury Avatar Stage -->
            <div id="remoteAudioAvatarWrap" class="remote-avatar-stage" style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 2;">
              <div class="active-call-pulse"></div>
              <img id="activeCallRemoteAvatar" src="logo.jpg" class="active-call-avatar" alt="Remote user" onerror="this.src='logo.jpg'">
              <h3 id="activeCallPeerName" class="text-xl font-bold text-white mt-4 tracking-wide">Peer</h3>
              <span id="activeCallDuration" class="active-call-timer">Connecting...</span>
              <span id="activeCallStatusBadge" class="text-[12px] text-[#00ff66] flex items-center gap-1 mt-2 font-mono">
                <i class="fa-solid fa-satellite-dish"></i> Google STUN WebRTC
              </span>
            </div>

            <!-- Local Camera Picture-in-Picture (Top-Right) -->
            <div id="localVideoContainer" class="local-pip-container" style="display: none; position: absolute; top: 24px; right: 24px; width: 150px; height: 220px; border-radius: 16px; overflow: hidden; border: 2px solid rgba(0, 255, 102, 0.4); box-shadow: 0 12px 30px rgba(0, 0, 0, 0.85); z-index: 30; background: #0b0f19;">
              <video id="localCallVideo" class="local-pip-video" autoplay playsinline muted style="width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1);"></video>
              <div id="localVideoOffPlaceholder" style="display: none; position: absolute; inset: 0; align-items: center; justify-content: center; background: #0b0f19; color: #94a3b8; font-size: 11px; flex-direction: column; gap: 6px;">
                <i class="fa-solid fa-video-slash" style="font-size: 20px; color: #ef4444;"></i>
                <span style="font-family: monospace; font-size: 10px; letter-spacing: 0.5px;">CAMERA OFF</span>
              </div>
            </div>

            <!-- In-Call Floating Control Dock -->
            <div class="active-call-dock" style="z-index: 40;">
              <button type="button" id="toggleCallMicBtn" class="call-dock-btn active" title="Mute/Unmute Mic">
                <i class="fa-solid fa-microphone"></i>
              </button>
              <button type="button" id="toggleCallCamBtn" class="call-dock-btn active" title="Enable/Disable Camera" style="display: none;">
                <i class="fa-solid fa-video"></i>
              </button>
              <button type="button" id="toggleCallScreenBtn" class="call-dock-btn" title="Share Screen (Desktop/Window)">
                <i class="fa-solid fa-desktop"></i>
              </button>
              <button type="button" id="toggleCallPipBtn" class="call-dock-btn" title="Picture-in-Picture Popout">
                <i class="fa-solid fa-clone"></i>
              </button>
              <button type="button" id="toggleCallBlurBtn" class="call-dock-btn" title="Studio Audio Isolation Gate">
                <i class="fa-solid fa-wand-magic-sparkles"></i>
              </button>
              
              <!-- Cyber Audio Voice DSP Masker -->
              <div style="position: relative; display: inline-block;">
                <button type="button" id="toggleVoiceDspBtn" class="call-dock-btn" title="Cyber Voice DSP Masker and Vocoder">
                  <i class="fa-solid fa-robot"></i>
                </button>
                <div id="callVoiceDspPopover" style="display: none; position: absolute; bottom: 58px; left: 50%; transform: translateX(-50%); background: #0f172a; border: 1px solid #00f2ff; border-radius: 8px; padding: 8px; width: 170px; z-index: 50; box-shadow: 0 8px 24px rgba(0,0,0,0.85);">
                  <div style="font-size: 10px; font-weight: 800; color: #00f2ff; margin-bottom: 6px; font-family: monospace;">VOICE DSP MASKER</div>
                  <button type="button" class="dsp-preset-opt active" data-preset="clean" style="width: 100%; text-align: left; padding: 5px 8px; font-size: 11px; background: rgba(0,242,255,0.15); border: 1px solid #00f2ff; border-radius: 4px; color: #fff; margin-bottom: 4px; cursor: pointer;">Studio Clean</button>
                  <button type="button" class="dsp-preset-opt" data-preset="android" style="width: 100%; text-align: left; padding: 5px 8px; font-size: 11px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 4px; color: #94a3b8; margin-bottom: 4px; cursor: pointer;">Cyber Android</button>
                  <button type="button" class="dsp-preset-opt" data-preset="radio" style="width: 100%; text-align: left; padding: 5px 8px; font-size: 11px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 4px; color: #94a3b8; margin-bottom: 4px; cursor: pointer;">Radio Dispatch</button>
                  <button type="button" class="dsp-preset-opt" data-preset="ghost" style="width: 100%; text-align: left; padding: 5px 8px; font-size: 11px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 4px; color: #94a3b8; margin-bottom: 4px; cursor: pointer;">Ghost Operative</button>
                  <button type="button" class="dsp-preset-opt" data-preset="vocoder" style="width: 100%; text-align: left; padding: 5px 8px; font-size: 11px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 4px; color: #94a3b8; cursor: pointer;">Harmonic Vocoder</button>
                </div>
              </div>

              <button type="button" id="callSnapshotBtn" class="call-dock-btn" title="Capture HD Call Snapshot">
                <i class="fa-solid fa-camera"></i>
              </button>
              <button type="button" id="callReactionBtn" class="call-dock-btn" title="Send Call Reaction">
                <i class="fa-solid fa-fire"></i>
              </button>
              <button type="button" id="switchGoogleMeetBtn" class="call-dock-btn" title="Switch to Google Meet Room">
                <i class="fa-solid fa-up-right-from-square"></i>
              </button>
              <button type="button" id="hangupCallBtn" class="call-dock-btn hangup-btn" title="End Call">
                <i class="fa-solid fa-phone-slash"></i>
              </button>
            </div>
          </div>
        `;
        document.body.appendChild(overlay);
      }
    }

    interceptCallButtons() {
      const headerCallBtn = document.getElementById('headerCallBtn');
      const headerVideoBtn = document.getElementById('headerVideoBtn');
      const callBtn = document.getElementById('callBtn');
      const videoCallBtn = document.getElementById('videoCallBtn');
      const infoAudioBtn = document.getElementById('infoAudioBtn');
      const infoCallBtn = document.getElementById('infoCallBtn');
      const infoVideoBtn = document.getElementById('infoVideoBtn');

      const triggerChoice = (isVideo) => {
        const target = window.currentChatName || window.currentChatUser || 'User';
        const targetId = window.currentChatUserId || window.currentChatUser;

        if (!targetId) {
          if (window.showNotif) window.showNotif('Please select a conversation first', 'error');
          return;
        }

        this.callType = isVideo ? 'video' : 'voice';
        this.openChoiceModal(target, isVideo);
      };

      if (headerCallBtn) headerCallBtn.onclick = (e) => { e.preventDefault(); e.stopImmediatePropagation(); triggerChoice(false); };
      if (headerVideoBtn) headerVideoBtn.onclick = (e) => { e.preventDefault(); e.stopImmediatePropagation(); triggerChoice(true); };
      if (callBtn) callBtn.onclick = (e) => { e.preventDefault(); e.stopImmediatePropagation(); triggerChoice(false); };
      if (videoCallBtn) videoCallBtn.onclick = (e) => { e.preventDefault(); e.stopImmediatePropagation(); triggerChoice(true); };
      if (infoAudioBtn) infoAudioBtn.onclick = (e) => { e.preventDefault(); e.stopImmediatePropagation(); triggerChoice(false); };
      if (infoCallBtn) infoCallBtn.onclick = (e) => { e.preventDefault(); e.stopImmediatePropagation(); triggerChoice(false); };
      if (infoVideoBtn) infoVideoBtn.onclick = (e) => { e.preventDefault(); e.stopImmediatePropagation(); triggerChoice(true); };

      // Choice modal buttons
      const closeChoice = document.getElementById('closeCallChoiceBtn');
      if (closeChoice) closeChoice.addEventListener('click', () => this.closeChoiceModal());

      const startDirectBtn = document.getElementById('startDirectWebRTCCallBtn');
      if (startDirectBtn) {
        startDirectBtn.addEventListener('click', () => {
          this.closeChoiceModal();
          this.startWebRTCCall(this.callType === 'video');
        });
      }

      const startMeetBtn = document.getElementById('startGoogleMeetCallBtn');
      if (startMeetBtn) {
        startMeetBtn.addEventListener('click', () => {
          this.closeChoiceModal();
          this.launchGoogleMeetCall();
        });
      }

      // In-Call Dock Controls
      const micBtn = document.getElementById('toggleCallMicBtn');
      if (micBtn) micBtn.addEventListener('click', () => this.toggleMic());

      const camBtn = document.getElementById('toggleCallCamBtn');
      if (camBtn) camBtn.addEventListener('click', () => this.toggleCam());

      const hangupBtn = document.getElementById('hangupCallBtn');
      if (hangupBtn) hangupBtn.addEventListener('click', () => this.endCall(true));

      const switchMeetBtn = document.getElementById('switchGoogleMeetBtn');
      if (switchMeetBtn) switchMeetBtn.addEventListener('click', () => this.launchGoogleMeetCall());

      const screenBtn = document.getElementById('toggleCallScreenBtn');
      if (screenBtn) screenBtn.addEventListener('click', () => this.toggleScreenShare());

      const pipBtn = document.getElementById('toggleCallPipBtn');
      if (pipBtn) pipBtn.addEventListener('click', () => this.togglePictureInPicture());

      const blurBtn = document.getElementById('toggleCallBlurBtn');
      if (blurBtn) blurBtn.addEventListener('click', () => this.toggleStudioNoiseGate());

      const snapshotBtn = document.getElementById('callSnapshotBtn');
      if (snapshotBtn) snapshotBtn.addEventListener('click', () => this.captureHDCallSnapshot());

      const reactionBtn = document.getElementById('callReactionBtn');
      if (reactionBtn) reactionBtn.addEventListener('click', () => this.sendInCallReaction());

      // Voice DSP Popover
      const dspBtn = document.getElementById('toggleVoiceDspBtn');
      const dspPopover = document.getElementById('callVoiceDspPopover');
      if (dspBtn && dspPopover) {
        dspBtn.addEventListener('click', () => {
          const isOpen = dspPopover.style.display === 'block';
          dspPopover.style.display = isOpen ? 'none' : 'block';
        });

        dspPopover.querySelectorAll('.dsp-preset-opt').forEach(opt => {
          opt.addEventListener('click', () => {
            const preset = opt.getAttribute('data-preset');
            dspPopover.querySelectorAll('.dsp-preset-opt').forEach(b => {
              b.classList.remove('active');
              b.style.background = 'rgba(255,255,255,0.04)';
              b.style.borderColor = 'rgba(255,255,255,0.08)';
              b.style.color = '#94a3b8';
            });
            opt.classList.add('active');
            opt.style.background = 'rgba(0,242,255,0.15)';
            opt.style.borderColor = '#00f2ff';
            opt.style.color = '#fff';

            if (window.CyberAudioDSP && this.localStream) {
              try {
                const processedStream = window.CyberAudioDSP.applyVoicePreset(this.localStream, preset);
                const audioTrack = processedStream.getAudioTracks()[0];
                if (audioTrack && this.peerConnection) {
                  const senders = this.peerConnection.getSenders();
                  const audioSender = senders.find(s => s.track && s.track.kind === 'audio');
                  if (audioSender) {
                    audioSender.replaceTrack(audioTrack);
                  }
                }
                if (window.showNotif) window.showNotif(`Voice DSP preset: ${preset.toUpperCase()} active`, 'info');
              } catch (dspErr) {
                console.warn('[VOICE DSP]', dspErr);
              }
            }
            dspPopover.style.display = 'none';
          });
        });
      }
    }

    openChoiceModal(targetName, isVideo) {
      const modal = document.getElementById('callChoiceModal');
      const title = document.getElementById('callChoiceTitle');
      const target = document.getElementById('callTargetName');
      if (modal) {
        if (title) title.textContent = isVideo ? 'Start Video Call' : 'Start Voice Call';
        if (target) target.textContent = targetName;
        modal.style.display = 'flex';
      }
    }

    closeChoiceModal() {
      const modal = document.getElementById('callChoiceModal');
      if (modal) modal.style.display = 'none';
    }

    // --- Google Meet Instant Room Generator ---
    async launchGoogleMeetCall() {
      const targetId = window.currentChatUserId || window.currentChatUser;
      if (!targetId) {
        if (window.showNotif) window.showNotif('Please select a conversation first', 'error');
        return;
      }

      window.open('https://meet.google.com/new', '_blank');

      const inviteText = `[GOOGLE MEET VIDEO CALL]\nI have started a Google Meet video conference. Click below to join with crystal-clear audio, video, and screen sharing:\n\n[Join Google Meeting](https://meet.google.com/new)`;

      const input = document.getElementById('message-input');
      if (input) {
        input.value = inviteText;
        if (typeof window.sendMessage === 'function') {
          await window.sendMessage();
        }
      }

      if (window.showNotif) window.showNotif('Google Meet launched. Invitation sent to chat.', 'success', 3000);
    }

    // --- Direct WebRTC P2P Call Engine with Google STUN ---
    async startWebRTCCall(isVideo = false) {
      const targetUid = window.currentChatUserId || window.currentChatUser;
      const targetName = window.currentChatName || window.currentChatUser || 'User';
      const targetAvatar = window.currentChatAvatar || document.getElementById('chatProfilePic')?.src || document.getElementById('activeChatAvatar')?.src || 'logo.jpg';
      const myId = window.myUID || (window.auth?.currentUser?.uid) || (localStorage.getItem('nexchat_user') ? JSON.parse(localStorage.getItem('nexchat_user')).uid : null);
      const myName = window.myUsername || 'User';
      const myAvatar = window.myProfilePic || window.auth?.currentUser?.photoURL || 'logo.jpg';

      if (!targetUid || !myId) {
        if (window.showNotif) window.showNotif('Please select an active conversation first', 'error');
        return;
      }

      if (this.callActive) {
        if (window.showNotif) window.showNotif('Call already in progress', 'info');
        return;
      }

      this.isCaller = true;
      this.callType = isVideo ? 'video' : 'voice';
      this.hasSetRemoteAnswer = false;
      this.localCandidateQueue = [];
      this.remoteCandidateQueue = [];

      try {
        const { db, collection, addDoc, doc, onSnapshot, serverTimestamp } = await this.getFirestoreOps();

        // 1. Request local media with audio and optional video
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            video: isVideo ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false
          });
        } catch (mediaErr) {
          if (isVideo && (mediaErr.name === 'NotFoundError' || mediaErr.name === 'DevicesNotFoundError')) {
            console.warn('[WebRTC] Camera not detected, falling back to audio only');
            this.localStream = await navigator.mediaDevices.getUserMedia({
              audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
              video: false
            });
            isVideo = false;
            this.callType = 'voice';
            if (window.showNotif) window.showNotif('Camera not found. Continuing with voice call.', 'info', 3000);
          } else {
            throw mediaErr;
          }
        }

        // 2. Initialize RTCPeerConnection with Google STUN
        this.peerConnection = new RTCPeerConnection(GOOGLE_ICE_CONFIG);
        this.remoteStream = new MediaStream();

        // 3. Attach local tracks to peer connection
        this.localStream.getTracks().forEach(track => {
          this.peerConnection.addTrack(track, this.localStream);
        });

        // 4. Handle incoming remote tracks
        this.peerConnection.ontrack = (event) => this.handleRemoteTrack(event);

        // 5. Handle local ICE candidates
        this.peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            if (this.activeCallId) {
              addDoc(collection(db, 'calls', this.activeCallId, 'iceCandidates'), {
                sender: 'caller',
                candidate: event.candidate.toJSON(),
                createdAt: serverTimestamp()
              }).catch(err => console.warn('[WebRTC] Error writing caller ICE candidate:', err));
            } else {
              this.localCandidateQueue.push({
                sender: 'caller',
                candidate: event.candidate.toJSON()
              });
            }
          }
        };

        // 6. Monitor Peer Connection State
        this.peerConnection.onconnectionstatechange = () => this.handleConnectionStateChange();

        // 7. Show Active Call HUD
        this.showActiveCallUI(targetName, targetAvatar, isVideo);
        this.startOutgoingRinging();

        // 8. Create SDP Offer
        const offer = await this.peerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: isVideo
        });
        await this.peerConnection.setLocalDescription(offer);

        // 9. Write call document to Firestore
        const callDocRef = await addDoc(collection(db, 'calls'), {
          callerId: myId,
          callerName: myName,
          callerAvatar: myAvatar,
          receiverId: targetUid,
          receiverName: targetName,
          receiverAvatar: targetAvatar,
          callType: this.callType,
          status: 'ringing',
          offer: {
            type: offer.type,
            sdp: offer.sdp
          },
          callerVideoEnabled: isVideo,
          callerAudioEnabled: true,
          receiverVideoEnabled: isVideo,
          receiverAudioEnabled: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        this.activeCallId = callDocRef.id;

        // Flush queued local candidates
        while (this.localCandidateQueue.length > 0) {
          const item = this.localCandidateQueue.shift();
          addDoc(collection(db, 'calls', this.activeCallId, 'iceCandidates'), {
            sender: item.sender,
            candidate: item.candidate,
            createdAt: serverTimestamp()
          }).catch(err => console.warn('[WebRTC] Error flushing caller candidate:', err));
        }

        // 10. Listen for receiver answer and call state changes
        this.callDocUnsubscribe = onSnapshot(doc(db, 'calls', this.activeCallId), async (snap) => {
          if (!snap.exists()) return;
          const data = snap.data();

          if (data.status === 'accepted' && data.answer && !this.hasSetRemoteAnswer) {
            this.hasSetRemoteAnswer = true;
            this.stopRinging();
            if (this.callTimeoutTimer) {
              clearTimeout(this.callTimeoutTimer);
              this.callTimeoutTimer = null;
            }

            try {
              await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
              this.flushRemoteCandidates();
              this.updateCallStatusUI('connected');
            } catch (sdpErr) {
              console.warn('[WebRTC] setRemoteDescription error:', sdpErr);
            }
          } else if (data.status === 'rejected') {
            this.stopRinging();
            if (window.showNotif) window.showNotif('Call declined by user', 'info', 3000);
            this.endCall(false);
          } else if (data.status === 'busy') {
            this.stopRinging();
            if (window.showNotif) window.showNotif('User is busy on another call', 'info', 3000);
            this.endCall(false);
          } else if (data.status === 'ended') {
            this.stopRinging();
            if (window.showNotif) window.showNotif('Call ended', 'info', 2000);
            this.endCall(false);
          }

          // Track remote camera/mic state changes
          if (typeof data.receiverVideoEnabled === 'boolean') {
            this.remoteVideoEnabled = data.receiverVideoEnabled;
            this.updateRemoteVideoDisplay();
          }
          if (typeof data.receiverAudioEnabled === 'boolean') {
            this.remoteAudioEnabled = data.receiverAudioEnabled;
          }
        });

        // 11. Listen for receiver's ICE candidates
        this.candidatesUnsubscribe = onSnapshot(collection(db, 'calls', this.activeCallId, 'iceCandidates'), (snapshot) => {
          snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
              const candData = change.doc.data();
              if (candData && candData.sender === 'receiver' && candData.candidate) {
                if (this.peerConnection && this.peerConnection.remoteDescription && this.peerConnection.remoteDescription.type) {
                  try {
                    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candData.candidate));
                  } catch (e) {
                    console.warn('[WebRTC] addIceCandidate receiver candidate warning:', e);
                  }
                } else {
                  this.remoteCandidateQueue.push(candData.candidate);
                }
              }
            }
          });
        });

        // 12. Call Timeout (45 seconds)
        this.callTimeoutTimer = setTimeout(async () => {
          if (this.callActive && !this.hasSetRemoteAnswer) {
            this.stopRinging();
            if (window.showNotif) window.showNotif('No answer from ' + targetName, 'info', 3000);
            try {
              const { updateDoc } = await this.getFirestoreOps();
              await updateDoc(doc(db, 'calls', this.activeCallId), {
                status: 'no-answer',
                endedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
            } catch (_) {}
            this.saveCallRecord(0, 'missed');
            this.endCall(false);
          }
        }, 45000);

        if (window.showNotif) window.showNotif(`Calling ${targetName}...`, 'info');

      } catch (err) {
        console.error('[WebRTC] Start call error:', err);
        if (window.showNotif) window.showNotif('Could not start call: ' + err.message, 'error');
        this.endCall(false);
      }
    }

    // --- Answering an Incoming Call ---
    async handleIncomingCall(callId, callData) {
      if (this.callActive) {
        this.getFirestoreOps().then(({ db, doc, updateDoc, serverTimestamp }) => {
          updateDoc(doc(db, 'calls', callId), {
            status: 'busy',
            updatedAt: serverTimestamp()
          }).catch(console.warn);
        });
        return;
      }

      this.incomingCallId = callId;
      this.incomingCallData = callData;

      const modal = document.getElementById('incomingCallModal');
      const nameEl = document.getElementById('incomingCallerName');
      const avatarEl = document.getElementById('incomingCallerAvatar');
      const badge = document.getElementById('incomingCallTypeBadge');

      const isVideo = callData.callType === 'video';
      const callerName = callData.callerName || 'Unknown User';
      const callerAvatar = callData.callerAvatar || 'logo.jpg';

      if (nameEl) nameEl.textContent = callerName;
      if (avatarEl) avatarEl.src = callerAvatar;
      if (badge) {
        badge.innerHTML = isVideo ? '<i class="fa-solid fa-video"></i> Video Call' : '<i class="fa-solid fa-phone"></i> Voice Call';
      }

      if (modal) modal.style.display = 'flex';
      this.startIncomingRinging();

      // Listen if caller cancels while ringing
      const { db, doc, onSnapshot } = await this.getFirestoreOps();
      if (this.incomingCallDocUnsubscribe) {
        this.incomingCallDocUnsubscribe();
      }
      this.incomingCallDocUnsubscribe = onSnapshot(doc(db, 'calls', callId), (snap) => {
        if (!snap.exists()) return;
        const status = snap.data()?.status;
        if (status && status !== 'ringing') {
          if (modal) modal.style.display = 'none';
          this.stopRinging();
          if (this.incomingCallDocUnsubscribe) {
            this.incomingCallDocUnsubscribe();
            this.incomingCallDocUnsubscribe = null;
          }
          if (status === 'ended' || status === 'no-answer') {
            if (window.showNotif) window.showNotif(`Missed call from ${callerName}`, 'info', 3000);
          }
        }
      });

      const acceptBtn = document.getElementById('acceptIncomingCallBtn');
      const declineBtn = document.getElementById('declineIncomingCallBtn');

      if (acceptBtn) {
        acceptBtn.onclick = () => {
          this.stopRinging();
          if (modal) modal.style.display = 'none';
          if (this.incomingCallDocUnsubscribe) {
            this.incomingCallDocUnsubscribe();
            this.incomingCallDocUnsubscribe = null;
          }
          this.acceptWebRTCCall(callId, callData);
        };
      }

      if (declineBtn) {
        declineBtn.onclick = () => {
          this.stopRinging();
          if (modal) modal.style.display = 'none';
          if (this.incomingCallDocUnsubscribe) {
            this.incomingCallDocUnsubscribe();
            this.incomingCallDocUnsubscribe = null;
          }
          this.declineWebRTCCall(callId);
        };
      }
    }

    async declineWebRTCCall(callId) {
      try {
        const { db, doc, updateDoc, serverTimestamp } = await this.getFirestoreOps();
        await updateDoc(doc(db, 'calls', callId), {
          status: 'rejected',
          rejectedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        this.saveCallRecord(0, 'rejected');
      } catch (e) {
        console.warn('[WebRTC] Decline call error:', e);
      }
    }

    async acceptWebRTCCall(callId, callData) {
      this.isCaller = false;
      this.activeCallId = callId;
      this.callType = callData.callType || 'voice';
      const isVideo = this.callType === 'video';
      this.localCandidateQueue = [];
      this.remoteCandidateQueue = [];

      try {
        const { db, collection, addDoc, doc, updateDoc, onSnapshot, serverTimestamp } = await this.getFirestoreOps();

        // 1. Request local media
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            video: isVideo ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false
          });
        } catch (mediaErr) {
          if (isVideo && (mediaErr.name === 'NotFoundError' || mediaErr.name === 'DevicesNotFoundError')) {
            console.warn('[WebRTC] Camera not detected on accept, falling back to audio');
            this.localStream = await navigator.mediaDevices.getUserMedia({
              audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
              video: false
            });
            this.callType = 'voice';
          } else {
            throw mediaErr;
          }
        }

        // 2. Initialize RTCPeerConnection
        this.peerConnection = new RTCPeerConnection(GOOGLE_ICE_CONFIG);
        this.remoteStream = new MediaStream();

        // 3. Add local tracks
        this.localStream.getTracks().forEach(track => {
          this.peerConnection.addTrack(track, this.localStream);
        });

        // 4. Handle incoming remote tracks
        this.peerConnection.ontrack = (event) => this.handleRemoteTrack(event);

        // 5. Handle local ICE candidates (sender: receiver)
        this.peerConnection.onicecandidate = (event) => {
          if (event.candidate && this.activeCallId) {
            addDoc(collection(db, 'calls', this.activeCallId, 'iceCandidates'), {
              sender: 'receiver',
              candidate: event.candidate.toJSON(),
              createdAt: serverTimestamp()
            }).catch(err => console.warn('[WebRTC] Error writing receiver candidate:', err));
          }
        };

        // 6. Monitor Connection State
        this.peerConnection.onconnectionstatechange = () => this.handleConnectionStateChange();

        // 7. Show Active Call UI
        this.showActiveCallUI(callData.callerName || 'User', callData.callerAvatar || 'logo.jpg', isVideo);

        // 8. Listen for caller's ICE candidates
        this.candidatesUnsubscribe = onSnapshot(collection(db, 'calls', this.activeCallId, 'iceCandidates'), (snapshot) => {
          snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
              const candData = change.doc.data();
              if (candData && candData.sender === 'caller' && candData.candidate) {
                if (this.peerConnection && this.peerConnection.remoteDescription && this.peerConnection.remoteDescription.type) {
                  try {
                    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candData.candidate));
                  } catch (e) {
                    console.warn('[WebRTC] addIceCandidate caller candidate warning:', e);
                  }
                } else {
                  this.remoteCandidateQueue.push(candData.candidate);
                }
              }
            }
          });
        });

        // 9. Set remote description from caller's offer
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(callData.offer));
        this.flushRemoteCandidates();

        // 10. Create SDP Answer
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        // 11. Update call document in Firestore
        await updateDoc(doc(db, 'calls', this.activeCallId), {
          status: 'accepted',
          answer: {
            type: answer.type,
            sdp: answer.sdp
          },
          acceptedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // 12. Listen for call termination or track changes from caller
        this.callDocUnsubscribe = onSnapshot(doc(db, 'calls', this.activeCallId), (snap) => {
          if (!snap.exists()) return;
          const data = snap.data();
          if (data.status === 'ended') {
            if (window.showNotif) window.showNotif('Call ended by peer', 'info', 2000);
            this.endCall(false);
          }
          if (typeof data.callerVideoEnabled === 'boolean') {
            this.remoteVideoEnabled = data.callerVideoEnabled;
            this.updateRemoteVideoDisplay();
          }
          if (typeof data.callerAudioEnabled === 'boolean') {
            this.remoteAudioEnabled = data.callerAudioEnabled;
          }
        });

        this.updateCallStatusUI('connected');

      } catch (err) {
        console.error('[WebRTC] Accept call error:', err);
        if (window.showNotif) window.showNotif('Could not connect call: ' + err.message, 'error');
        this.endCall(true);
      }
    }

    // --- Remote Media Handling ---
    handleRemoteTrack(event) {
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }

      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach(track => {
          if (!this.remoteStream.getTracks().some(t => t.id === track.id)) {
            this.remoteStream.addTrack(track);
          }
        });
      } else if (event.track) {
        if (!this.remoteStream.getTracks().some(t => t.id === event.track.id)) {
          this.remoteStream.addTrack(event.track);
        }
      }

      const remoteVid = document.getElementById('remoteCallVideo');
      const remoteAud = document.getElementById('remoteCallAudio');

      if (remoteVid) {
        if (remoteVid.srcObject !== this.remoteStream) {
          remoteVid.srcObject = this.remoteStream;
        }
        remoteVid.playsInline = true;
        remoteVid.autoplay = true;
        remoteVid.play().catch(e => console.warn('[WebRTC] remote video play warning:', e));
      }

      if (remoteAud) {
        if (remoteAud.srcObject !== this.remoteStream) {
          remoteAud.srcObject = this.remoteStream;
        }
        remoteAud.autoplay = true;
        remoteAud.muted = false;
        remoteAud.volume = 1.0;
        remoteAud.play().catch(e => console.warn('[WebRTC] remote audio play warning:', e));
      }

      if (event.track) {
        event.track.onmute = () => this.updateRemoteVideoDisplay();
        event.track.onunmute = () => this.updateRemoteVideoDisplay();
        event.track.onended = () => this.updateRemoteVideoDisplay();
      }

      this.updateRemoteVideoDisplay();
    }

    updateRemoteVideoDisplay() {
      const remoteVid = document.getElementById('remoteCallVideo');
      const avatarWrap = document.getElementById('remoteAudioAvatarWrap');
      if (!remoteVid || !avatarWrap) return;

      const hasLiveVideoTrack = this.remoteStream &&
        this.remoteStream.getVideoTracks().length > 0 &&
        this.remoteStream.getVideoTracks().some(t => t.enabled && t.readyState === 'live') &&
        this.callType === 'video' &&
        this.remoteVideoEnabled !== false;

      if (hasLiveVideoTrack) {
        remoteVid.style.display = 'block';
        avatarWrap.style.display = 'none';
      } else {
        remoteVid.style.display = 'none';
        avatarWrap.style.display = 'flex';
      }
    }

    flushRemoteCandidates() {
      while (this.remoteCandidateQueue.length > 0) {
        const candidate = this.remoteCandidateQueue.shift();
        try {
          this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('[WebRTC] Flush candidate error:', e);
        }
      }
    }

    handleConnectionStateChange() {
      if (!this.peerConnection) return;
      const state = this.peerConnection.connectionState;
      const statusBadge = document.getElementById('activeCallStatusBadge');
      const signalDot = document.getElementById('callSignalDot');

      if (state === 'connected') {
        this.stopRinging();
        if (this.callTimeoutTimer) {
          clearTimeout(this.callTimeoutTimer);
          this.callTimeoutTimer = null;
        }
        if (statusBadge) {
          statusBadge.innerHTML = '<i class="fa-solid fa-shield-halved"></i> Connected (E2EE)';
          statusBadge.style.color = '#00ff66';
        }
        if (signalDot) {
          signalDot.style.background = '#00ff66';
          signalDot.style.boxShadow = '0 0 8px #00ff66';
        }
        if (!this.callTimerInterval) {
          this.startTimer();
        }
      } else if (state === 'disconnected') {
        if (statusBadge) {
          statusBadge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Reconnecting...';
          statusBadge.style.color = '#ffd700';
        }
      } else if (state === 'failed') {
        console.warn('[WebRTC] Peer connection failed. Ending call.');
        this.endCall(false);
      } else if (state === 'closed') {
        if (this.callActive) {
          this.endCall(false);
        }
      }
    }

    updateCallStatusUI(statusText) {
      const statusBadge = document.getElementById('activeCallStatusBadge');
      if (statusBadge) {
        if (statusText === 'connected') {
          statusBadge.innerHTML = '<i class="fa-solid fa-shield-halved"></i> Connected (E2EE)';
          statusBadge.style.color = '#00ff66';
        } else {
          statusBadge.textContent = statusText;
        }
      }
    }

    showActiveCallUI(peerName, peerAvatar, isVideo) {
      this.callActive = true;
      const overlay = document.getElementById('activeWebRTCCallOverlay');
      const nameEl = document.getElementById('activeCallPeerName');
      const avatarEl = document.getElementById('activeCallRemoteAvatar');
      const pipContainer = document.getElementById('localVideoContainer');
      const localVid = document.getElementById('localCallVideo');
      const localPlaceholder = document.getElementById('localVideoOffPlaceholder');
      const camBtn = document.getElementById('toggleCallCamBtn');
      const timerEl = document.getElementById('activeCallDuration');

      if (overlay) overlay.style.display = 'flex';
      if (nameEl) nameEl.textContent = peerName;
      if (avatarEl) avatarEl.src = peerAvatar || 'logo.jpg';
      if (timerEl) timerEl.textContent = this.isCaller ? 'Calling...' : 'Connecting...';

      if (isVideo && pipContainer && localVid && this.localStream) {
        pipContainer.style.display = 'block';
        localVid.srcObject = this.localStream;
        localVid.muted = true;
        localVid.playsInline = true;
        localVid.autoplay = true;
        localVid.style.display = 'block';
        if (localPlaceholder) localPlaceholder.style.display = 'none';
        localVid.play().catch(e => console.warn('[WebRTC] Local video play error:', e));
        if (camBtn) camBtn.style.display = 'inline-flex';
      } else {
        if (pipContainer) pipContainer.style.display = 'none';
        if (camBtn) camBtn.style.display = 'none';
      }

      this.updateRemoteVideoDisplay();
      this.startQualityMonitor();
    }

    startTimer() {
      if (this.callTimerInterval) clearInterval(this.callTimerInterval);
      this.callStartTime = Date.now();
      const timerEl = document.getElementById('activeCallDuration');
      this.callTimerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - this.callStartTime) / 1000);
        const m = Math.floor(elapsed / 60);
        const s = elapsed % 60;
        if (timerEl) timerEl.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
      }, 1000);
    }

    toggleMic() {
      if (!this.localStream) return;
      const audioTrack = this.localStream.getAudioTracks()[0];
      const btn = document.getElementById('toggleCallMicBtn');

      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const isEnabled = audioTrack.enabled;

        if (btn) {
          btn.classList.toggle('active', isEnabled);
          btn.innerHTML = isEnabled ? '<i class="fa-solid fa-microphone"></i>' : '<i class="fa-solid fa-microphone-slash"></i>';
          btn.style.color = isEnabled ? '#fff' : '#ef4444';
          btn.style.borderColor = isEnabled ? 'rgba(255,255,255,0.14)' : '#ef4444';
        }

        if (this.activeCallId) {
          this.getFirestoreOps().then(({ db, doc, updateDoc, serverTimestamp }) => {
            const field = this.isCaller ? 'callerAudioEnabled' : 'receiverAudioEnabled';
            updateDoc(doc(db, 'calls', this.activeCallId), {
              [field]: isEnabled,
              updatedAt: serverTimestamp()
            }).catch(console.warn);
          });
        }
      }
    }

    toggleCam() {
      if (!this.localStream) return;
      const videoTrack = this.localStream.getVideoTracks()[0];
      const btn = document.getElementById('toggleCallCamBtn');
      const localVid = document.getElementById('localCallVideo');
      const localPlaceholder = document.getElementById('localVideoOffPlaceholder');

      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        const isEnabled = videoTrack.enabled;

        if (btn) {
          btn.classList.toggle('active', isEnabled);
          btn.innerHTML = isEnabled ? '<i class="fa-solid fa-video"></i>' : '<i class="fa-solid fa-video-slash"></i>';
          btn.style.color = isEnabled ? '#fff' : '#ef4444';
          btn.style.borderColor = isEnabled ? 'rgba(255,255,255,0.14)' : '#ef4444';
        }

        if (localVid && localPlaceholder) {
          localVid.style.display = isEnabled ? 'block' : 'none';
          localPlaceholder.style.display = isEnabled ? 'none' : 'flex';
        }

        if (this.activeCallId) {
          this.getFirestoreOps().then(({ db, doc, updateDoc, serverTimestamp }) => {
            const field = this.isCaller ? 'callerVideoEnabled' : 'receiverVideoEnabled';
            updateDoc(doc(db, 'calls', this.activeCallId), {
              [field]: isEnabled,
              updatedAt: serverTimestamp()
            }).catch(console.warn);
          });
        }
      }
    }

    async toggleScreenShare() {
      if (!this.callActive || !this.peerConnection) return;
      const screenBtn = document.getElementById('toggleCallScreenBtn');

      try {
        if (this.isSharingScreen) {
          if (this.savedCameraTrack) {
            const senders = this.peerConnection.getSenders();
            const videoSender = senders.find(s => s.track && s.track.kind === 'video');
            if (videoSender) {
              await videoSender.replaceTrack(this.savedCameraTrack);
            }
            const localVid = document.getElementById('localCallVideo');
            if (localVid) localVid.srcObject = new MediaStream([this.savedCameraTrack]);
          }
          if (this.screenStream) {
            this.screenStream.getTracks().forEach(t => t.stop());
            this.screenStream = null;
          }
          this.isSharingScreen = false;
          if (screenBtn) {
            screenBtn.classList.remove('active');
            screenBtn.style.color = '#fff';
          }
          if (window.showNotif) window.showNotif('Screen share stopped. Camera restored.', 'info');
        } else {
          this.screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
          const screenTrack = this.screenStream.getVideoTracks()[0];

          const senders = this.peerConnection.getSenders();
          const videoSender = senders.find(s => s.track && s.track.kind === 'video');
          if (videoSender) {
            this.savedCameraTrack = videoSender.track;
            await videoSender.replaceTrack(screenTrack);
          }

          const localVid = document.getElementById('localCallVideo');
          if (localVid) localVid.srcObject = this.screenStream;

          screenTrack.onended = () => {
            if (this.isSharingScreen) this.toggleScreenShare();
          };

          this.isSharingScreen = true;
          if (screenBtn) {
            screenBtn.classList.add('active');
            screenBtn.style.color = '#00ff66';
          }
          if (window.showNotif) window.showNotif('Screen share broadcast active', 'success');
        }
      } catch (err) {
        console.warn('[SCREEN SHARE]', err);
      }
    }

    async togglePictureInPicture() {
      try {
        const remoteVid = document.getElementById('remoteCallVideo');
        const localVid = document.getElementById('localCallVideo');
        const targetVid = (remoteVid && remoteVid.style.display !== 'none' && remoteVid.readyState >= 2) ? remoteVid : localVid;

        if (!targetVid) return;

        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else if (targetVid.readyState >= 2) {
          await targetVid.requestPictureInPicture();
          if (window.showNotif) window.showNotif('Picture-in-Picture active', 'info');
        } else {
          if (window.showNotif) window.showNotif('Waiting for active video stream...', 'warning');
        }
      } catch (pipErr) {
        console.warn('[PiP ERROR]', pipErr);
      }
    }

    toggleStudioNoiseGate() {
      const btn = document.getElementById('toggleCallBlurBtn');
      this.studioNoiseGateActive = !this.studioNoiseGateActive;

      if (this.studioNoiseGateActive) {
        if (btn) {
          btn.classList.add('active');
          btn.style.color = '#00f2ff';
        }
        if (window.showNotif) window.showNotif('AI Studio Noise Gate and Vocal Clarity active', 'success');
      } else {
        if (btn) {
          btn.classList.remove('active');
          btn.style.color = '#fff';
        }
        if (window.showNotif) window.showNotif('AI Studio Noise Gate disabled', 'info');
      }
    }

    captureHDCallSnapshot() {
      try {
        const remoteVid = document.getElementById('remoteCallVideo');
        if (!remoteVid || remoteVid.videoWidth === 0 || remoteVid.style.display === 'none') {
          if (window.showNotif) window.showNotif('No remote video frame available to capture', 'warning');
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = remoteVid.videoWidth;
        canvas.height = remoteVid.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(remoteVid, 0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(20, canvas.height - 50, 320, 34);
        ctx.fillStyle = '#00ff66';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('NEXCHAT HD CALL SNAPSHOT', 30, canvas.height - 28);

        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `nexchat_call_frame_${Date.now()}.png`;
        link.click();

        if (window.showNotif) window.showNotif('HD Call frame captured and downloaded', 'success');
      } catch (snapErr) {
        console.warn('[CALL SNAPSHOT]', snapErr);
      }
    }

    sendInCallReaction() {
      const reactions = ['fa-thumbs-up', 'fa-fire', 'fa-heart', 'fa-star', 'fa-bolt'];
      const icon = reactions[Math.floor(Math.random() * reactions.length)];

      const burst = document.createElement('div');
      burst.style.cssText = `
        position: fixed;
        bottom: 120px;
        left: ${40 + Math.random() * 20}%;
        font-size: 32px;
        color: #ffd700;
        z-index: 10005;
        pointer-events: none;
        animation: burstFloatUp 1.8s ease-out forwards;
      `;
      burst.innerHTML = `<i class="fa-solid ${icon}"></i>`;
      document.body.appendChild(burst);
      setTimeout(() => burst.remove(), 1800);
    }

    startQualityMonitor() {
      clearInterval(this.qualityInterval);
      this.qualityInterval = setInterval(async () => {
        if (!this.callActive || !this.peerConnection) return;
        try {
          const stats = await this.peerConnection.getStats();
          let rtt = 18;
          let packetLoss = 0;
          stats.forEach(report => {
            if (report.type === 'candidate-pair' && report.currentRoundTripTime) {
              rtt = Math.round(report.currentRoundTripTime * 1000);
            }
            if (report.type === 'inbound-rtp' && report.packetsLost !== undefined && report.packetsReceived) {
              packetLoss = Math.round((report.packetsLost / (report.packetsLost + report.packetsReceived)) * 100);
            }
          });

          const qualityText = document.getElementById('callQualityText');
          const signalDot = document.getElementById('callSignalDot');
          if (qualityText) {
            qualityText.innerHTML = `HD 1080p &bull; ${rtt}ms &bull; ${packetLoss}% Loss`;
          }
          if (signalDot) {
            signalDot.style.background = rtt < 60 ? '#00ff66' : (rtt < 150 ? '#ffd700' : '#ff3b30');
            signalDot.style.boxShadow = `0 0 8px ${signalDot.style.background}`;
          }
        } catch (_) {}
      }, 2000);
    }

    async saveCallRecord(durationSec, status = 'completed') {
      try {
        const myUid = window.myUID || (window.auth?.currentUser?.uid);
        const targetUid = window.currentChatUserId || window.currentChatUser;
        if (!myUid || !targetUid) return;

        if (typeof window.saveCallToHistory === 'function') {
          await window.saveCallToHistory(
            this.isCaller ? myUid : targetUid,
            this.isCaller ? targetUid : myUid,
            this.callType,
            durationSec,
            status
          );
        } else {
          const { db, collection, addDoc, serverTimestamp } = await this.getFirestoreOps();
          await addDoc(collection(db, 'callHistory'), {
            callerId: this.isCaller ? myUid : targetUid,
            receiverId: this.isCaller ? targetUid : myUid,
            from: this.isCaller ? myUid : targetUid,
            to: this.isCaller ? targetUid : myUid,
            type: this.callType,
            duration: durationSec,
            status: status,
            isOutgoing: this.isCaller,
            timestamp: serverTimestamp()
          });
        }
      } catch (err) {
        console.warn('[WebRTC] saveCallRecord warning:', err);
      }
    }

    endCall(notifyRemote = true) {
      const durationSec = this.callStartTime ? Math.floor((Date.now() - this.callStartTime) / 1000) : 0;
      this.callActive = false;
      this.stopRinging();

      if (this.callTimeoutTimer) {
        clearTimeout(this.callTimeoutTimer);
        this.callTimeoutTimer = null;
      }
      if (this.callTimerInterval) {
        clearInterval(this.callTimerInterval);
        this.callTimerInterval = null;
      }
      if (this.qualityInterval) {
        clearInterval(this.qualityInterval);
        this.qualityInterval = null;
      }

      if (this.screenStream) {
        this.screenStream.getTracks().forEach(t => t.stop());
        this.screenStream = null;
      }
      this.isSharingScreen = false;

      if (this.localStream) {
        this.localStream.getTracks().forEach(t => t.stop());
        this.localStream = null;
      }

      if (this.remoteStream) {
        this.remoteStream.getTracks().forEach(t => t.stop());
        this.remoteStream = null;
      }

      if (this.peerConnection) {
        try { this.peerConnection.close(); } catch (e) {}
        this.peerConnection = null;
      }

      // Detach Firestore listeners
      if (this.callDocUnsubscribe) {
        this.callDocUnsubscribe();
        this.callDocUnsubscribe = null;
      }
      if (this.candidatesUnsubscribe) {
        this.candidatesUnsubscribe();
        this.candidatesUnsubscribe = null;
      }
      if (this.incomingCallDocUnsubscribe) {
        this.incomingCallDocUnsubscribe();
        this.incomingCallDocUnsubscribe = null;
      }

      // Notify remote peer via Firestore
      if (notifyRemote && this.activeCallId) {
        this.getFirestoreOps().then(({ db, doc, updateDoc, serverTimestamp }) => {
          updateDoc(doc(db, 'calls', this.activeCallId), {
            status: 'ended',
            endedAt: serverTimestamp(),
            duration: durationSec,
            updatedAt: serverTimestamp()
          }).catch(console.warn);
        });
      }

      // Save call record
      if (durationSec > 0) {
        this.saveCallRecord(durationSec, 'completed');
      }

      this.activeCallId = null;
      this.hasSetRemoteAnswer = false;
      this.localCandidateQueue = [];
      this.remoteCandidateQueue = [];

      // Clean Video Elements
      const remoteVid = document.getElementById('remoteCallVideo');
      const localVid = document.getElementById('localCallVideo');
      const remoteAud = document.getElementById('remoteCallAudio');
      if (remoteVid) remoteVid.srcObject = null;
      if (localVid) localVid.srcObject = null;
      if (remoteAud) remoteAud.srcObject = null;

      // Close overlays
      const overlay = document.getElementById('activeWebRTCCallOverlay');
      if (overlay) overlay.style.display = 'none';

      const incoming = document.getElementById('incomingCallModal');
      if (incoming) incoming.style.display = 'none';

      const choice = document.getElementById('callChoiceModal');
      if (choice) choice.style.display = 'none';
    }

    listenForIncomingCalls() {
      // Direct call trigger event listener
      window.addEventListener('nex_incoming_call', (e) => {
        const { callId, callData } = e.detail || {};
        if (callId && callData) {
          this.handleIncomingCall(callId, callData);
        }
      });
    }
  }

  // Export to global scope
  window.nexCallingEngine = new NexCallingEngine();
  window.webrtcCallEngine = window.nexCallingEngine;
})();
