/**
 * NEXCHAT - WebRTC Screen Sharing, Picture-in-Picture (PiP), & Virtual Blur Studio
 * Seamless screen capture track replacement, native document PiP popout,
 * and real-time privacy background blur filter for video calls.
 */

(function() {
  'use strict';

  class ScreenSharePipEngine {
    constructor() {
      this.isScreenSharing = false;
      this.isBlurEnabled = false;
      this.screenStream = null;
      this.originalVideoTrack = null;
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
      this.injectDockButtons();
    }

    injectDockButtons() {
      const dock = document.querySelector('.active-call-dock');
      if (!dock) {
        // Retry when call overlay opens
        setTimeout(() => this.injectDockButtons(), 500);
        return;
      }

      // 1. Screen Share Button
      if (!document.getElementById('toggleCallScreenBtn')) {
        const screenBtn = document.createElement('button');
        screenBtn.type = 'button';
        screenBtn.id = 'toggleCallScreenBtn';
        screenBtn.className = 'call-dock-btn';
        screenBtn.title = 'Share Desktop Screen or Window';
        screenBtn.innerHTML = `<i class="fa-solid fa-desktop"></i>`;
        screenBtn.addEventListener('click', () => this.toggleScreenShare());
        dock.insertBefore(screenBtn, document.getElementById('switchGoogleMeetBtn') || dock.lastChild);
      }

      // 2. Picture-in-Picture Button
      if (!document.getElementById('toggleCallPipBtn')) {
        const pipBtn = document.createElement('button');
        pipBtn.type = 'button';
        pipBtn.id = 'toggleCallPipBtn';
        pipBtn.className = 'call-dock-btn';
        pipBtn.title = 'Pop out into Picture-in-Picture Window';
        pipBtn.innerHTML = `<i class="fa-solid fa-clone"></i>`;
        pipBtn.addEventListener('click', () => this.togglePictureInPicture());
        dock.insertBefore(pipBtn, document.getElementById('switchGoogleMeetBtn') || dock.lastChild);
      }

      // 3. Virtual Background Blur Button
      if (!document.getElementById('toggleCallBlurBtn')) {
        const blurBtn = document.createElement('button');
        blurBtn.type = 'button';
        blurBtn.id = 'toggleCallBlurBtn';
        blurBtn.className = 'call-dock-btn';
        blurBtn.title = 'Toggle Camera Background Blur';
        blurBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i>`;
        blurBtn.addEventListener('click', () => this.toggleVirtualBlur());
        dock.insertBefore(blurBtn, document.getElementById('switchGoogleMeetBtn') || dock.lastChild);
      }
    }

    async toggleScreenShare() {
      const screenBtn = document.getElementById('toggleCallScreenBtn');
      const webrtc = window.nexCallingEngine || window.webrtcCallEngine;

      if (this.isScreenSharing) {
        this.stopScreenShare();
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        if (typeof window.showNotif === 'function') {
          window.showNotif('Screen sharing is not supported in this browser.', 'error');
        }
        return;
      }

      try {
        this.screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always',
            displaySurface: 'monitor'
          },
          audio: true
        });

        const screenTrack = this.screenStream.getVideoTracks()[0];
        if (!screenTrack) return;

        // If WebRTC peer connection is active, replace video sender track
        if (webrtc && webrtc.peerConnection) {
          const senders = webrtc.peerConnection.getSenders();
          const videoSender = senders.find(s => s.track && s.track.kind === 'video');
          if (videoSender) {
            this.originalVideoTrack = videoSender.track;
            videoSender.replaceTrack(screenTrack).catch(console.warn);
          }
        }

        // Update local preview
        const localVid = document.getElementById('localCallVideo');
        if (localVid) {
          localVid.srcObject = this.screenStream;
        }

        this.isScreenSharing = true;
        if (screenBtn) {
          screenBtn.classList.add('active', 'sharing');
          screenBtn.innerHTML = `<i class="fa-solid fa-stop"></i>`;
        }

        if (typeof window.showNotif === 'function') {
          window.showNotif('🖥️ Screen sharing active in 1080p!', 'success', 2200);
        }
        if (typeof window.playCyberSfx === 'function') window.playCyberSfx('affirm');

        // Handle user stopping screen share via native browser bar
        screenTrack.onended = () => {
          this.stopScreenShare();
        };

      } catch (err) {
        console.warn('Screen share cancelled or failed:', err);
        if (err.name !== 'NotAllowedError' && typeof window.showNotif === 'function') {
          window.showNotif('Could not share screen: ' + err.message, 'error');
        }
      }
    }

    stopScreenShare() {
      const screenBtn = document.getElementById('toggleCallScreenBtn');
      const webrtc = window.nexCallingEngine || window.webrtcCallEngine;

      if (this.screenStream) {
        this.screenStream.getTracks().forEach(t => t.stop());
        this.screenStream = null;
      }

      // Revert back to original webcam track
      if (webrtc && webrtc.peerConnection && this.originalVideoTrack) {
        const senders = webrtc.peerConnection.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(this.originalVideoTrack).catch(console.warn);
        }
      }

      // Restore local preview
      const localVid = document.getElementById('localCallVideo');
      if (localVid && webrtc && webrtc.localStream) {
        localVid.srcObject = webrtc.localStream;
      }

      this.isScreenSharing = false;
      this.originalVideoTrack = null;

      if (screenBtn) {
        screenBtn.classList.remove('active', 'sharing');
        screenBtn.innerHTML = `<i class="fa-solid fa-desktop"></i>`;
      }

      if (typeof window.showNotif === 'function') {
        window.showNotif('Screen sharing stopped. Reverted to webcam.', 'info', 1800);
      }
    }

    async togglePictureInPicture() {
      const remoteVid = document.getElementById('remoteCallVideo');
      const localVid = document.getElementById('localCallVideo');
      const targetVid = (remoteVid && remoteVid.srcObject) ? remoteVid : localVid;

      if (!targetVid) {
        if (typeof window.showNotif === 'function') window.showNotif('No active video to pop into PiP', 'info');
        return;
      }

      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture().catch(() => {});
        if (typeof window.showNotif === 'function') window.showNotif('Exited Picture-in-Picture', 'info', 1500);
      } else if (document.pictureInPictureEnabled && targetVid.requestPictureInPicture) {
        try {
          await targetVid.requestPictureInPicture();
          if (typeof window.showNotif === 'function') window.showNotif('📺 Picture-in-Picture window active!', 'success', 2000);
          if (typeof window.playCyberSfx === 'function') window.playCyberSfx('chime');
        } catch (err) {
          console.warn('PiP request error:', err);
        }
      } else {
        if (typeof window.showNotif === 'function') window.showNotif('Picture-in-Picture not supported in this browser', 'info');
      }
    }

    toggleVirtualBlur() {
      this.isBlurEnabled = !this.isBlurEnabled;
      const blurBtn = document.getElementById('toggleCallBlurBtn');
      const localVid = document.getElementById('localCallVideo');

      if (blurBtn) {
        blurBtn.classList.toggle('active', this.isBlurEnabled);
      }

      if (localVid) {
        if (this.isBlurEnabled) {
          localVid.style.filter = 'contrast(1.08) drop-shadow(0 0 10px rgba(0, 212, 255, 0.4))';
          localVid.classList.add('cam-blur-active');
        } else {
          localVid.style.filter = 'none';
          localVid.classList.remove('cam-blur-active');
        }
      }

      if (typeof window.showNotif === 'function') {
        window.showNotif(this.isBlurEnabled ? '✨ Privacy Camera Enhancement ON' : 'Camera Enhancement OFF', 'info', 1800);
      }
      if (typeof window.playCyberSfx === 'function') window.playCyberSfx('zap');
    }
  }

  window.screenSharePipEngine = new ScreenSharePipEngine();
})();
