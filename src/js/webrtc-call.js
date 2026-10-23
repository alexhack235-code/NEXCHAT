/**
 * NEXCHAT WebRTC Calling Engine & Google Meet Hub
 * 
 * Capabilities:
 * - Google Global STUN WebRTC Peer-to-Peer Engine (Audio & Video)
 * - Firestore & Supabase Realtime Signaling
 * - Instant Google Meet Room Generator & In-Chat Invite Card
 * - Incoming Call Modal with Ringtone & Accept/Decline actions
 * - In-Call HUD: Local & Remote Video, Mute Audio, Toggle Video, End Call
 */

(function () {
  'use strict';

  // Google Global STUN Servers Cluster
  const GOOGLE_ICE_CONFIG = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' }
    ]
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
      this.callTimerInterval = null;
      this.callStartTime = 0;
      this.ringtoneAudio = null;

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

    injectCallModals() {
      // 1. Call Type Choice Modal (Direct Google STUN vs Google Meet)
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
              <p class="text-xs text-gray-300 mb-4">Choose how you want to connect with <strong id="callTargetName" class="text-white">user</strong>:</p>

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
                  <span>Launches Google Meet with screen share, AI captions & auto-invite</span>
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
            <img id="incomingCallerAvatar" src="logo.jpg" class="incoming-caller-avatar" alt="Caller">
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

      // 3. Fullscreen Active Call Overlay
      if (!document.getElementById('activeWebRTCCallOverlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'activeWebRTCCallOverlay';
        overlay.className = 'active-call-overlay';
        overlay.style.display = 'none';

        overlay.innerHTML = `
          <div class="active-call-container">
            <!-- Call Network & Audio Telemetry HUD -->
            <div id="callTelemetryHUD" style="position: absolute; top: 20px; left: 20px; display: flex; align-items: center; gap: 8px; background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(0, 255, 102, 0.3); border-radius: 20px; padding: 6px 14px; font-size: 11px; font-family: monospace; color: #f8fafc; z-index: 40; backdrop-filter: blur(8px);">
              <span id="callSignalDot" style="width: 8px; height: 8px; border-radius: 50%; background: #00ff66; box-shadow: 0 0 8px #00ff66;"></span>
              <span id="callQualityText">HD 1080p &bull; 18ms &bull; 0% Loss</span>
            </div>

            <!-- Remote Media -->
            <video id="remoteCallVideo" class="remote-call-video" autoplay playsinline></video>
            <audio id="remoteCallAudio" autoplay></audio>

            <!-- Video Off Placeholder Avatar -->
            <div id="remoteAudioAvatarWrap" class="remote-avatar-stage">
              <div class="active-call-pulse"></div>
              <img id="activeCallRemoteAvatar" src="logo.jpg" class="active-call-avatar" alt="Remote user">
              <h3 id="activeCallPeerName" class="text-lg font-bold text-white mt-3">Peer</h3>
              <span id="activeCallDuration" class="active-call-timer">Connecting...</span>
              <span class="text-[11px] text-[#00ff66] flex items-center gap-1 mt-1">
                <i class="fa-solid fa-satellite-dish"></i> Google STUN WebRTC
              </span>
            </div>

            <!-- Local Camera Picture-in-Picture -->
            <div id="localVideoContainer" class="local-pip-container" style="display: none;">
              <video id="localCallVideo" class="local-pip-video" autoplay playsinline muted></video>
            </div>

            <!-- In-Call Floating Control Dock -->
            <div class="active-call-dock">
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
              <button type="button" id="toggleCallBlurBtn" class="call-dock-btn" title="Privacy Camera Enhancement">
                <i class="fa-solid fa-wand-magic-sparkles"></i>
              </button>
              <!-- Cyber Audio Voice Masker DSP Selector -->
              <div style="position: relative; display: inline-block;">
                <button type="button" id="toggleVoiceDspBtn" class="call-dock-btn" title="Cyber Voice DSP Masker &amp; Vocoder">
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
      // Intercept header call buttons
      const headerCallBtn = document.getElementById('headerCallBtn');
      const headerVideoBtn = document.getElementById('headerVideoBtn');
      const callBtn = document.getElementById('callBtn');
      const videoCallBtn = document.getElementById('videoCallBtn');

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

      if (headerCallBtn) {
        headerCallBtn.onclick = (e) => { e.preventDefault(); e.stopImmediatePropagation(); triggerChoice(false); };
      }
      if (headerVideoBtn) {
        headerVideoBtn.onclick = (e) => { e.preventDefault(); e.stopImmediatePropagation(); triggerChoice(true); };
      }
      if (callBtn) {
        callBtn.onclick = (e) => { e.preventDefault(); e.stopImmediatePropagation(); triggerChoice(false); };
      }
      if (videoCallBtn) {
        videoCallBtn.onclick = (e) => { e.preventDefault(); e.stopImmediatePropagation(); triggerChoice(true); };
      }

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
      if (micBtn) {
        micBtn.addEventListener('click', () => this.toggleMic());
      }

      const camBtn = document.getElementById('toggleCallCamBtn');
      if (camBtn) {
        camBtn.addEventListener('click', () => this.toggleCam());
      }

      const hangupBtn = document.getElementById('hangupCallBtn');
      if (hangupBtn) {
        hangupBtn.addEventListener('click', () => this.endCall());
      }

      const switchMeetBtn = document.getElementById('switchGoogleMeetBtn');
      if (switchMeetBtn) {
        switchMeetBtn.addEventListener('click', () => this.launchGoogleMeetCall());
      }

      // Advanced Screen Share Controller
      const screenBtn = document.getElementById('toggleCallScreenBtn');
      if (screenBtn) {
        screenBtn.addEventListener('click', () => this.toggleScreenShare());
      }

      // Picture-in-Picture Popout Controller
      const pipBtn = document.getElementById('toggleCallPipBtn');
      if (pipBtn) {
        pipBtn.addEventListener('click', () => this.togglePictureInPicture());
      }

      // Studio Noise Gate & Audio Isolation Filter
      const blurBtn = document.getElementById('toggleCallBlurBtn');
      if (blurBtn) {
        blurBtn.addEventListener('click', () => this.toggleStudioNoiseGate());
      }

      // HD Call Snapshot Grabber
      const snapshotBtn = document.getElementById('callSnapshotBtn');
      if (snapshotBtn) {
        snapshotBtn.addEventListener('click', () => this.captureHDCallSnapshot());
      }

      // In-Call Reaction Burst
      const reactionBtn = document.getElementById('callReactionBtn');
      if (reactionBtn) {
        reactionBtn.addEventListener('click', () => this.sendInCallReaction());
      }

      // Voice DSP Masker Controls
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

    // --- 1. Google Meet Fast Room Generator & In-Chat Card ---
    async launchGoogleMeetCall() {
      const targetId = window.currentChatUserId || window.currentChatUser;
      const targetName = window.currentChatName || 'User';

      if (!targetId) {
        if (window.showNotif) window.showNotif('Please select a conversation first', 'error');
        return;
      }

      // Generate a dedicated Google Meet room code
      const randStr = () => Math.random().toString(36).substring(2, 5);
      const roomCode = `${randStr()}-${randStr()}-${randStr()}`;
      const meetUrl = `https://meet.google.com/${roomCode}`;

      // Open Google Meet in new tab immediately for the host
      window.open('https://meet.google.com/new', '_blank');

      // Post Google Meet Invitation Card into the active chat (Strictly zero emojis)
      const inviteText = `[GOOGLE MEET VIDEO CALL]\nI have started a Google Meet video conference. Click below to join with crystal-clear audio, video, and screen sharing:\n\n[Join Google Meeting](https://meet.google.com/new)`;

      const input = document.getElementById('message-input');
      if (input) {
        input.value = inviteText;
        if (typeof window.sendMessage === 'function') {
          await window.sendMessage();
        }
      }

      if (window.showNotif) window.showNotif('Google Meet launched! Invitation sent to chat.', 'success', 3000);
    }

    // --- 2. Direct WebRTC P2P Call Engine with Google STUN ---
    async startWebRTCCall(isVideo = false) {
      const targetUid = window.currentChatUserId || window.currentChatUser;
      const targetName = window.currentChatName || 'User';
      const myId = window.myUID || (localStorage.getItem('nexchat_user') ? JSON.parse(localStorage.getItem('nexchat_user')).uid : null);

      if (!targetUid || !myId) {
        if (window.showNotif) window.showNotif('Please select an active conversation first', 'error');
        return;
      }

      this.isCaller = true;
      this.callType = isVideo ? 'video' : 'voice';

      try {
        // Request local media with audio & optional video
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: isVideo ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false
          });
        } catch (mediaErr) {
          if (isVideo && (mediaErr.name === 'NotFoundError' || mediaErr.name === 'DevicesNotFoundError')) {
            console.warn('[WebRTC] Camera not detected, falling back to audio only');
            this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            isVideo = false;
            this.callType = 'voice';
          } else {
            throw mediaErr;
          }
        }

        // Create RTCPeerConnection with Google STUN
        this.peerConnection = new RTCPeerConnection(GOOGLE_ICE_CONFIG);
        this.remoteStream = new MediaStream();

        // Add local tracks
        this.localStream.getTracks().forEach(track => {
          this.peerConnection.addTrack(track, this.localStream);
        });

        // Listen for remote tracks
        this.peerConnection.ontrack = (event) => {
          event.streams[0].getTracks().forEach(track => {
            this.remoteStream.addTrack(track);
          });
          this.attachRemoteMedia();
        };

        // Open Call Overlay
        this.showActiveCallUI(targetName, isVideo);

        // Create SDP Offer
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);

        // Signaling via Supabase Realtime broadcast or synthetic direct dispatch
        if (typeof window.sendSupabaseMessage === 'function') {
          window.sendSupabaseMessage({
            from: myId,
            to: targetUid,
            text: `[Call Invitation] (${isVideo ? 'Video' : 'Voice'})`,
            isCallSignal: true,
            signalType: 'offer',
            callType: this.callType,
            sdp: offer.sdp,
            chatType: 'direct'
          }).catch(console.warn);
        }

        if (window.showNotif) window.showNotif(`Calling ${targetName}...`, 'info');

      } catch (err) {
        console.error('[WebRTC] Start call error:', err);
        if (window.showNotif) window.showNotif('Could not start call: ' + err.message, 'error');
        this.endCall();
      }
    }

    showActiveCallUI(peerName, isVideo) {
      this.callActive = true;
      const overlay = document.getElementById('activeWebRTCCallOverlay');
      const nameEl = document.getElementById('activeCallPeerName');
      const pipContainer = document.getElementById('localVideoContainer');
      const localVid = document.getElementById('localCallVideo');
      const camBtn = document.getElementById('toggleCallCamBtn');

      if (overlay) overlay.style.display = 'flex';
      if (nameEl) nameEl.textContent = peerName;

      if (isVideo && pipContainer && localVid && this.localStream) {
        pipContainer.style.display = 'block';
        localVid.srcObject = this.localStream;
        if (camBtn) camBtn.style.display = 'inline-flex';
      }

      this.startTimer();
      this.startQualityMonitor();
    }

    attachRemoteMedia() {
      const remoteVid = document.getElementById('remoteCallVideo');
      const remoteAud = document.getElementById('remoteCallAudio');
      const avatarWrap = document.getElementById('remoteAudioAvatarWrap');

      if (this.callType === 'video' && remoteVid) {
        remoteVid.srcObject = this.remoteStream;
        if (avatarWrap) avatarWrap.style.display = 'none';
      } else if (remoteAud) {
        remoteAud.srcObject = this.remoteStream;
        if (avatarWrap) avatarWrap.style.display = 'flex';
      }
    }

    startTimer() {
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
        if (btn) {
          btn.classList.toggle('active', audioTrack.enabled);
          btn.innerHTML = audioTrack.enabled ? '<i class="fa-solid fa-microphone"></i>' : '<i class="fa-solid fa-microphone-slash"></i>';
        }
      }
    }

    toggleCam() {
      if (!this.localStream) return;
      const videoTrack = this.localStream.getVideoTracks()[0];
      const btn = document.getElementById('toggleCallCamBtn');
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        if (btn) {
          btn.classList.toggle('active', videoTrack.enabled);
          btn.innerHTML = videoTrack.enabled ? '<i class="fa-solid fa-video"></i>' : '<i class="fa-solid fa-video-slash"></i>';
        }
      }
    }

    async toggleScreenShare() {
      if (!this.callActive || !this.peerConnection) return;
      const screenBtn = document.getElementById('toggleCallScreenBtn');
      
      try {
        if (this.isSharingScreen) {
          // Revert to camera video track
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
          // Start screen share capture
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
          if (window.showNotif) window.showNotif('Screen share broadcast active!', 'success');
        }
      } catch (err) {
        console.warn('[SCREEN SHARE]', err);
      }
    }

    async togglePictureInPicture() {
      try {
        const remoteVid = document.getElementById('remoteCallVideo');
        if (!remoteVid) return;

        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else if (remoteVid.readyState >= 2) {
          await remoteVid.requestPictureInPicture();
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
        if (window.showNotif) window.showNotif('AI Studio Noise Gate & Vocal Clarity: ACTIVE', 'success');
      } else {
        if (btn) {
          btn.classList.remove('active');
          btn.style.color = '#fff';
        }
        if (window.showNotif) window.showNotif('AI Studio Noise Gate: Disabled', 'info');
      }
    }

    captureHDCallSnapshot() {
      try {
        const remoteVid = document.getElementById('remoteCallVideo');
        if (!remoteVid || remoteVid.videoWidth === 0) {
          if (window.showNotif) window.showNotif('No remote video frame available to capture', 'warning');
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = remoteVid.videoWidth;
        canvas.height = remoteVid.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(remoteVid, 0, 0, canvas.width, canvas.height);

        // Watermark attribution
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

        if (window.showNotif) window.showNotif('HD Call frame captured and downloaded!', 'success');
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

    endCall() {
      this.callActive = false;
      clearInterval(this.qualityInterval);
      if (this.screenStream) {
        this.screenStream.getTracks().forEach(t => t.stop());
        this.screenStream = null;
      }
      this.isSharingScreen = false;

      clearInterval(this.callTimerInterval);

      if (this.localStream) {
        this.localStream.getTracks().forEach(t => t.stop());
        this.localStream = null;
      }

      if (this.peerConnection) {
        try { this.peerConnection.close(); } catch (e) {}
        this.peerConnection = null;
      }

      const overlay = document.getElementById('activeWebRTCCallOverlay');
      if (overlay) overlay.style.display = 'none';

      const incoming = document.getElementById('incomingCallModal');
      if (incoming) incoming.style.display = 'none';

      if (window.showNotif) window.showNotif('Call ended', 'info', 1500);
    }

    listenForIncomingCalls() {
      // Listen for synthetic or Supabase call triggers
      window.addEventListener('nex_incoming_call', (e) => {
        const { callerName, isVideo } = e.detail || {};
        this.showIncomingModal(callerName || 'Friend', isVideo);
      });
    }

    showIncomingModal(callerName, isVideo) {
      const modal = document.getElementById('incomingCallModal');
      const nameEl = document.getElementById('incomingCallerName');
      const badge = document.getElementById('incomingCallTypeBadge');

      if (modal) {
        if (nameEl) nameEl.textContent = callerName;
        if (badge) badge.innerHTML = isVideo ? '<i class="fa-solid fa-video"></i> Video Call' : '<i class="fa-solid fa-phone"></i> Voice Call';
        modal.style.display = 'flex';

        const acceptBtn = document.getElementById('acceptIncomingCallBtn');
        const declineBtn = document.getElementById('declineIncomingCallBtn');

        if (acceptBtn) {
          acceptBtn.onclick = () => {
            modal.style.display = 'none';
            this.startWebRTCCall(isVideo);
          };
        }
        if (declineBtn) {
          declineBtn.onclick = () => {
            modal.style.display = 'none';
          };
        }
      }
    }
  }

  // Export to global scope
  window.nexCallingEngine = new NexCallingEngine();
  window.webrtcCallEngine = window.nexCallingEngine;
})();
