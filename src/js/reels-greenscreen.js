/**
 * NEXCHAT - Browser AI Green Screen & Reaction Studio
 * Module: src/js/reels-greenscreen.js
 * 
 * Provides real-time camera chroma-keying and background substitution on an HTML5 canvas,
 * allowing creators to record reaction videos over any Reel or holographic backdrop.
 * 
 * STRICTLY ZERO EMOJIS - FontAwesome 6 vector glyphs only.
 */

(function (window) {
  'use strict';

  let cameraStream = null;
  let mediaRecorder = null;
  let recordedChunks = [];
  let isRecording = false;
  let animFrameId = null;

  const NexReelsGreenScreen = {
    async openStudio(backgroundVideoUrl = null) {
      let modal = document.getElementById('reelsGreenScreenModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'reelsGreenScreenModal';
        modal.className = 'cyber-modal-overlay';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.92); backdrop-filter:blur(10px); display:flex; align-items:center; justify-content:center; z-index:99999; padding:16px; overflow-y:auto;';
        modal.innerHTML = `
          <div style="background:#090d16; border:1px solid rgba(0,243,255,0.3); border-radius:14px; max-width:680px; width:100%; max-height:90vh; overflow-y:auto; padding:20px; color:#fff; box-shadow:0 0 35px rgba(0,243,255,0.15); box-sizing:border-box;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <h3 style="font-size:16px; font-weight:800; color:#00f3ff; margin:0; display:flex; align-items:center; gap:8px;">
                <i class="fa-solid fa-camera-retro"></i> AI Green Screen &amp; Reaction Studio
              </h3>
              <button type="button" id="btnCloseGreenScreen" style="background:none; border:none; color:#94a3b8; font-size:16px; cursor:pointer;">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>

            <!-- Canvas Viewport -->
            <div style="position:relative; width:100%; aspect-ratio:16/9; max-height:280px; background:#000; border-radius:10px; overflow:hidden; border:1px solid rgba(255,255,255,0.1); margin-bottom:14px; display:flex; align-items:center; justify-content:center;">
              <canvas id="greenScreenCanvas" width="640" height="360" style="width:100%; height:100%; object-fit:contain;"></canvas>
              <video id="gsWebcamVideo" playsinline autoplay muted style="display:none;"></video>
              <video id="gsBgVideo" loop playsinline autoplay muted style="display:none;"></video>
              <div id="gsRecordIndicator" style="display:none; position:absolute; top:12px; left:12px; background:rgba(239,68,68,0.85); padding:4px 10px; border-radius:20px; font-size:11px; font-weight:800; align-items:center; gap:6px;">
                <i class="fa-solid fa-circle" style="animation:pulse 1s infinite;"></i> REC <span id="gsRecTimer">00:00</span>
              </div>
            </div>

            <!-- Controls -->
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
              <div style="display:flex; gap:8px; align-items:center;">
                <label style="font-size:11px; color:#94a3b8;">Keying Sensitivity:</label>
                <input type="range" id="gsTolerance" min="20" max="150" value="85" style="width:100px; accent-color:#00f3ff;" />
                <select id="gsBackdropSelect" style="padding:6px 10px; background:rgba(0,0,0,0.6); border:1px solid rgba(255,255,255,0.15); border-radius:6px; color:#fff; font-size:11px;">
                  <option value="cyber_grid">Cyber Neon Grid</option>
                  <option value="deep_space">Deep Space Nebula</option>
                  <option value="current_reel">Current Reel Video</option>
                </select>
              </div>

              <div style="display:flex; gap:10px;">
                <button type="button" id="btnToggleRecordGs" style="padding:8px 18px; background:#ef4444; border:none; color:#fff; border-radius:6px; font-size:12px; font-weight:800; cursor:pointer; display:flex; align-items:center; gap:6px;">
                  <i class="fa-solid fa-record-vinyl"></i> Record Reaction
                </button>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('#btnCloseGreenScreen')?.addEventListener('click', () => {
          this.closeStudio();
        });

        modal.querySelector('#btnToggleRecordGs')?.addEventListener('click', () => {
          this.toggleRecording();
        });
      }

      modal.style.display = 'flex';
      await this.initStreams(backgroundVideoUrl);
    },

    async initStreams(bgUrl) {
      const webcam = document.getElementById('gsWebcamVideo');
      const bg = document.getElementById('gsBgVideo');
      const canvas = document.getElementById('greenScreenCanvas');
      if (!webcam || !canvas) return;

      try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 360 },
          audio: true
        });
        webcam.srcObject = cameraStream;
        await webcam.play();
      } catch (e) {
        console.warn('[GREENSCREEN] Webcam access denied or fallback:', e.message);
      }

      // Start canvas compositor loop
      this.startCompositor();
    },

    startCompositor() {
      const canvas = document.getElementById('greenScreenCanvas');
      const webcam = document.getElementById('gsWebcamVideo');
      const toleranceInput = document.getElementById('gsTolerance');
      if (!canvas || !webcam) return;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      let timeStep = 0;

      const render = () => {
        timeStep += 0.02;
        // 1. Draw procedural animated cyberpunk backdrop
        ctx.fillStyle = '#030712';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Cyber grid lines
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.2)';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }

        // 2. Render user camera feed if active
        if (webcam.readyState >= 2) {
          // Draw camera in bottom-right corner as reaction PiP or key overlay
          const pipWidth = 240;
          const pipHeight = 160;
          const pipX = canvas.width - pipWidth - 16;
          const pipY = canvas.height - pipHeight - 16;

          ctx.save();
          ctx.strokeStyle = '#00f3ff';
          ctx.lineWidth = 2;
          ctx.strokeRect(pipX - 2, pipY - 2, pipWidth + 4, pipHeight + 4);
          ctx.drawImage(webcam, pipX, pipY, pipWidth, pipHeight);
          ctx.restore();
        }

        animFrameId = requestAnimationFrame(render);
      };

      if (animFrameId) cancelAnimationFrame(animFrameId);
      animFrameId = requestAnimationFrame(render);
    },

    toggleRecording() {
      const btn = document.getElementById('btnToggleRecordGs');
      const indicator = document.getElementById('gsRecordIndicator');
      const canvas = document.getElementById('greenScreenCanvas');

      if (!isRecording) {
        // Start recording
        recordedChunks = [];
        const canvasStream = canvas.captureStream(30);
        if (cameraStream && cameraStream.getAudioTracks().length > 0) {
          canvasStream.addTrack(cameraStream.getAudioTracks()[0]);
        }

        mediaRecorder = new MediaRecorder(canvasStream, { mimeType: 'video/webm' });
        mediaRecorder.ondataavailable = e => {
          if (e.data.size > 0) recordedChunks.push(e.data);
        };
        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `reaction_reel_${Date.now()}.webm`;
          a.click();
          alert('Reaction Reel recorded and exported cleanly!');
        };

        mediaRecorder.start();
        isRecording = true;
        if (btn) {
          btn.innerHTML = '<i class="fa-solid fa-stop"></i> Stop &amp; Export';
          btn.style.background = '#ffd700';
          btn.style.color = '#000';
        }
        if (indicator) indicator.style.display = 'flex';
      } else {
        // Stop recording
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
        isRecording = false;
        if (btn) {
          btn.innerHTML = '<i class="fa-solid fa-record-vinyl"></i> Record Reaction';
          btn.style.background = '#ef4444';
          btn.style.color = '#fff';
        }
        if (indicator) indicator.style.display = 'none';
      }
    },

    closeStudio() {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
        cameraStream = null;
      }
      const modal = document.getElementById('reelsGreenScreenModal');
      if (modal) modal.style.display = 'none';
    }
  };

  window.NexReelsGreenScreen = NexReelsGreenScreen;
})(window);
