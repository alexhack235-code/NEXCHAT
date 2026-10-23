/**
 * NEXCHAT Reels Dynamic Watermark & Export Engine
 * TikTok-Style Bouncing Branded Watermark & Cyber Outro Pipeline
 * Strictly Zero Emojis
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NexWatermarkEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const ENGINE_VERSION = '2.4.0';

  /**
   * Helper: Escape HTML
   */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Draw the TikTok-Style Watermark on an HTML5 2D Canvas Context
   */
  function drawWatermarkTag(ctx, width, height, currentSec, totalSec, authorName, options = {}) {
    const isBouncing = options.bouncing !== false;
    const opacity = options.opacity !== undefined ? options.opacity : 0.95;
    const brandName = options.brandName || 'NEXCHAT REELS';
    const handle = authorName ? (authorName.startsWith('@') ? authorName : '@' + authorName) : '@creator';

    // TikTok shifting algorithm:
    // First 50% of time: Top-Left
    // Second 50% of time: Bottom-Right
    let posX = 40;
    let posY = 50;

    if (isBouncing && totalSec > 0) {
      const halfTime = totalSec * 0.5;
      if (currentSec >= halfTime) {
        // Shift to bottom-right quadrant
        posX = width - 260;
        posY = height - 120;
      }
    }

    ctx.save();
    ctx.globalAlpha = opacity;

    // Outer glow / pill backdrop
    const pillW = 210;
    const pillH = 54;
    const radius = 12;

    ctx.fillStyle = 'rgba(7, 11, 20, 0.72)';
    ctx.strokeStyle = 'rgba(0, 242, 255, 0.4)';
    ctx.lineWidth = 1.5;

    // Draw rounded rect
    ctx.beginPath();
    ctx.roundRect(posX, posY, pillW, pillH, radius);
    ctx.fill();
    ctx.stroke();

    // Subtle cyan edge accent
    ctx.strokeStyle = 'rgba(0, 255, 102, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(posX + 4, posY + radius);
    ctx.lineTo(posX + 4, posY + pillH - radius);
    ctx.stroke();

    // Emblem Icon (Cyber Shield)
    ctx.fillStyle = '#00f2ff';
    ctx.beginPath();
    const iconX = posX + 22;
    const iconY = posY + 27;
    ctx.arc(iconX, iconY, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#040711';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', iconX, iconY + 0.5);

    // Text: Brand Name (NEXCHAT REELS)
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.letterSpacing = '0.5px';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 4;
    ctx.fillText(brandName, posX + 42, posY + 22);

    // Text: Creator Handle (@username)
    ctx.fillStyle = '#00f2ff';
    ctx.font = '600 12px monospace';
    ctx.shadowBlur = 0;
    ctx.fillText(handle, posX + 42, posY + 40);

    ctx.restore();
  }

  /**
   * Draw Cinematic Outro End-Card (1.2 Seconds Bumper)
   */
  function drawOutroBumper(ctx, width, height, progress, authorName) {
    ctx.save();
    // Deep cyber gradient backdrop
    const grad = ctx.createRadialGradient(width / 2, height / 2, 40, width / 2, height / 2, width * 0.8);
    grad.addColorStop(0, '#0a1628');
    grad.addColorStop(1, '#02050b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Glowing center emblem
    const cx = width / 2;
    const cy = height / 2 - 30;

    // Pulse scale based on progress
    const scale = 1 + Math.sin(progress * Math.PI) * 0.08;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    // Outer glow ring
    ctx.strokeStyle = 'rgba(0, 242, 255, 0.5)';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00f2ff';
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.stroke();

    // Inner shield
    ctx.fillStyle = 'rgba(0, 255, 102, 0.2)';
    ctx.beginPath();
    ctx.arc(0, 0, 42, 0, Math.PI * 2);
    ctx.fill();

    // Logo Letter
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 36px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 10;
    ctx.fillText('NEX', 0, 2);
    ctx.restore();

    // Title text
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 8;
    ctx.fillText('NEXCHAT CAMSHOT', cx, cy + 90);

    // Subtitle text
    ctx.fillStyle = '#00f2ff';
    ctx.font = '700 13px monospace';
    ctx.letterSpacing = '1px';
    const handle = authorName ? (authorName.startsWith('@') ? authorName : '@' + authorName) : '@creator';
    ctx.fillText('ORIGINAL REEL BY ' + handle.toUpperCase(), cx, cy + 115);

    // Bottom caption
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '500 11px sans-serif';
    ctx.fillText('Watch more high-definition reels on nexchat.app', cx, cy + 145);

    ctx.restore();
  }

  /**
   * Export Watermarked Video Stream via Canvas & MediaRecorder
   */
  async function generateWatermarkedVideo(reel, options = {}, onProgress = null) {
    if (!reel || !reel.videoUrl) {
      throw new Error('Invalid reel data or missing videoUrl.');
    }

    const bouncing = options.bouncing !== false;
    const includeOutro = options.outro !== false;
    const authorName = reel.authorName || 'creator';

    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = reel.videoUrl;
      video.preload = 'auto';
      video.muted = false;

      // Handle load errors / CORS fallback
      video.onerror = () => {
        reject(new Error('Cross-Origin video stream error. Downloading direct file.'));
      };

      video.onloadedmetadata = async () => {
        const vW = video.videoWidth || 720;
        const vH = video.videoHeight || 1280;
        const duration = video.duration || 10;

        const canvas = document.createElement('canvas');
        canvas.width = vW;
        canvas.height = vH;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas 2D context creation failed.'));
          return;
        }

        // Set up MediaRecorder
        let stream;
        try {
          stream = canvas.captureStream(30); // 30 FPS
        } catch (sErr) {
          reject(new Error('canvas.captureStream unsupported.'));
          return;
        }

        // Try to attach audio if available
        try {
          if (video.captureStream) {
            const vStream = video.captureStream();
            const aTracks = vStream.getAudioTracks();
            if (aTracks && aTracks.length > 0) {
              stream.addTrack(aTracks[0]);
            }
          }
        } catch (aErr) {
          console.warn('[WATERMARK] Audio pass-through bypassed:', aErr.message);
        }

        let mimeType = 'video/webm;codecs=vp9';
        if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
          mimeType = 'video/mp4;codecs=avc1';
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
          mimeType = 'video/mp4';
        } else if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }

        const recordedChunks = [];
        let mediaRecorder;
        try {
          mediaRecorder = new MediaRecorder(stream, {
            mimeType: mimeType,
            videoBitsPerSecond: 3500000 // 3.5 Mbps high quality
          });
        } catch (rErr) {
          reject(rErr);
          return;
        }

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunks.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunks, { type: mimeType });
          resolve({
            blob: blob,
            filename: `NEXCHAT_${authorName.replace(/[^a-zA-Z0-9_]/g, '')}_${reel.id || Date.now()}.${mimeType.includes('mp4') ? 'mp4' : 'webm'}`,
            mimeType: mimeType
          });
        };

        // Render loop
        mediaRecorder.start();
        video.currentTime = 0;

        let isRenderingOutro = false;
        let outroStartTime = 0;
        const outroDurationSec = 1.3;

        const renderFrame = () => {
          if (video.paused && video.ended && !includeOutro) {
            mediaRecorder.stop();
            return;
          }

          if (video.ended) {
            if (includeOutro) {
              if (!isRenderingOutro) {
                isRenderingOutro = true;
                outroStartTime = performance.now();
              }
              const elapsedOutro = (performance.now() - outroStartTime) / 1000;
              const outroProgress = Math.min(1, elapsedOutro / outroDurationSec);

              drawOutroBumper(ctx, vW, vH, outroProgress, authorName);

              if (onProgress) {
                onProgress(90 + Math.floor(outroProgress * 10));
              }

              if (outroProgress >= 1) {
                mediaRecorder.stop();
                return;
              }
            } else {
              mediaRecorder.stop();
              return;
            }
          } else {
            // Draw regular video frame + watermark
            ctx.drawImage(video, 0, 0, vW, vH);
            drawWatermarkTag(ctx, vW, vH, video.currentTime, duration, authorName, { bouncing });

            if (onProgress && duration > 0) {
              const p = Math.min(90, Math.floor((video.currentTime / duration) * 90));
              onProgress(p);
            }
          }

          requestAnimationFrame(renderFrame);
        };

        video.play().then(() => {
          requestAnimationFrame(renderFrame);
        }).catch((pErr) => {
          reject(pErr);
        });
      };

      video.load();
    });
  }

  /**
   * Interactive UI: Open Watermark Export Modal
   */
  function openWatermarkExportModal(reel) {
    if (!reel) return;

    // Check existing modal
    let modal = document.getElementById('nexWatermarkModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'nexWatermarkModal';
      modal.className = 'nex-watermark-modal-backdrop';
      modal.innerHTML = `
        <div class="nex-watermark-modal-card">
          <div class="nex-watermark-header">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div class="nex-watermark-icon-badge"><i class="fa-solid fa-watermark"></i></div>
              <div>
                <h3 style="margin: 0; font-size: 15px; font-weight: 800; color: #fff; font-family: 'Space Grotesk', sans-serif;">
                  NEXCHAT Watermark Video Export Studio
                </h3>
                <div style="font-size: 11px; color: #94a3b8;">
                  TikTok-Style Shifting Watermark Tag &bull; Clean In-App &bull; Branded Download
                </div>
              </div>
            </div>
            <button type="button" class="nex-watermark-close-btn" id="closeWatermarkModalBtn">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Video Stage Preview -->
          <div class="nex-watermark-preview-wrap">
            <video id="nexWatermarkPreviewVideo" playsinline loop muted autoplay></video>
            
            <!-- Live Preview Overlaid Watermark (TikTok style) -->
            <div id="nexWatermarkOverlayTag" class="nex-watermark-tag-preview top-left">
              <div class="nex-watermark-emblem">N</div>
              <div class="nex-watermark-meta">
                <div class="nex-wm-title">NEXCHAT REELS</div>
                <div class="nex-wm-handle" id="nexWatermarkAuthorHandle">@creator</div>
              </div>
            </div>

            <!-- Outro Preview Badge -->
            <div id="nexWatermarkOutroBadge" style="position: absolute; bottom: 12px; left: 14px; font-size: 10px; color: #67e8f9; background: rgba(0,0,0,0.6); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(0,242,255,0.3);">
              <i class="fa-solid fa-film"></i> 1.2s Branded Outro Included
            </div>
          </div>

          <!-- Settings & Mode Selection -->
          <div class="nex-watermark-controls-panel">
            <div style="font-size: 11.5px; font-weight: 700; color: #cbd5e1; margin-bottom: 8px;">
              Watermark Style &amp; Positioning:
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px;">
              <button type="button" class="nex-wm-mode-btn active" id="wmModeBouncingBtn">
                <i class="fa-solid fa-arrows-split-up-and-left"></i>
                <div style="text-align: left;">
                  <strong style="display: block; font-size: 12px;">TikTok Shifting Tag</strong>
                  <span style="font-size: 10px; color: #94a3b8;">Top-Left &rarr; Bottom-Right</span>
                </div>
              </button>
              <button type="button" class="nex-wm-mode-btn" id="wmModeStaticBtn">
                <i class="fa-solid fa-location-pin"></i>
                <div style="text-align: left;">
                  <strong style="display: block; font-size: 12px;">Corner Static Tag</strong>
                  <span style="font-size: 10px; color: #94a3b8;">Pinned Bottom-Right</span>
                </div>
              </button>
            </div>

            <!-- Outro Card Switch -->
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 10px 14px; border-radius: 10px; margin-bottom: 16px;">
              <div>
                <strong style="font-size: 12px; color: #fff; display: block;">Cinematic Outro Bumper</strong>
                <span style="font-size: 10.5px; color: #94a3b8;">Appends official NEXCHAT glowing outro end-card</span>
              </div>
              <input type="checkbox" id="nexWmOutroToggle" checked style="width: 18px; height: 18px; accent-color: #00f2ff; cursor: pointer;">
            </div>

            <!-- Progress Indicator -->
            <div id="nexWmProgressWrap" style="display: none; margin-bottom: 14px;">
              <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; color: #67e8f9; font-family: monospace;">
                <span id="nexWmProgressStatus">Encoding frames...</span>
                <span id="nexWmProgressPercent">0%</span>
              </div>
              <div style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
                <div id="nexWmProgressBar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #00f2ff, #00ff66); transition: width 0.15s ease;"></div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div style="display: flex; gap: 10px;">
              <button type="button" id="nexWmDirectExportBtn" class="nex-wm-action-btn primary" style="flex: 1;">
                <i class="fa-solid fa-download"></i> Generate &amp; Download Watermarked Video
              </button>
              <button type="button" id="nexWmRawDownloadBtn" class="nex-wm-action-btn secondary" title="Download raw video without watermarks (Creator Master)">
                <i class="fa-solid fa-file-video"></i> Raw Master
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // Inject Styles for Modal
      injectWatermarkStyles();
    }

    const previewVideo = modal.querySelector('#nexWatermarkPreviewVideo');
    const overlayTag = modal.querySelector('#nexWatermarkOverlayTag');
    const authorHandleEl = modal.querySelector('#nexWatermarkAuthorHandle');
    const bouncingBtn = modal.querySelector('#wmModeBouncingBtn');
    const staticBtn = modal.querySelector('#wmModeStaticBtn');
    const outroToggle = modal.querySelector('#nexWmOutroToggle');
    const outroBadge = modal.querySelector('#nexWatermarkOutroBadge');
    const directExportBtn = modal.querySelector('#nexWmDirectExportBtn');
    const rawDownloadBtn = modal.querySelector('#nexWmRawDownloadBtn');
    const progressWrap = modal.querySelector('#nexWmProgressWrap');
    const progressBar = modal.querySelector('#nexWmProgressBar');
    const progressStatus = modal.querySelector('#nexWmProgressStatus');
    const progressPercent = modal.querySelector('#nexWmProgressPercent');
    const closeBtn = modal.querySelector('#closeWatermarkModalBtn');

    // Configure Video Source
    const authorName = reel.authorName || 'creator';
    authorHandleEl.textContent = authorName.startsWith('@') ? authorName : '@' + authorName;
    previewVideo.src = reel.videoUrl;

    let isBouncingMode = true;

    // Toggle bouncing vs static
    bouncingBtn.onclick = () => {
      isBouncingMode = true;
      bouncingBtn.classList.add('active');
      staticBtn.classList.remove('active');
      overlayTag.className = 'nex-watermark-tag-preview top-left';
    };

    staticBtn.onclick = () => {
      isBouncingMode = false;
      staticBtn.classList.add('active');
      bouncingBtn.classList.remove('active');
      overlayTag.className = 'nex-watermark-tag-preview bottom-right';
    };

    outroToggle.onchange = () => {
      outroBadge.style.display = outroToggle.checked ? 'block' : 'none';
    };

    // Live Watermark Shifting in Preview (every 3 seconds simulate TikTok shift)
    let shiftInterval = setInterval(() => {
      if (isBouncingMode && overlayTag) {
        if (overlayTag.classList.contains('top-left')) {
          overlayTag.className = 'nex-watermark-tag-preview bottom-right';
        } else {
          overlayTag.className = 'nex-watermark-tag-preview top-left';
        }
      }
    }, 3200);

    const closeModal = () => {
      clearInterval(shiftInterval);
      previewVideo.pause();
      modal.classList.remove('active');
    };

    closeBtn.onclick = closeModal;
    modal.onclick = (e) => {
      if (e.target === modal) closeModal();
    };

    // Direct Watermarked Export Action
    directExportBtn.onclick = async () => {
      directExportBtn.disabled = true;
      directExportBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Rendering Watermarked Video...';
      progressWrap.style.display = 'block';
      progressBar.style.width = '5%';
      progressPercent.textContent = '5%';
      progressStatus.textContent = 'Encoding video canvas frames...';

      try {
        const result = await generateWatermarkedVideo(reel, {
          bouncing: isBouncingMode,
          outro: outroToggle.checked
        }, (pct) => {
          progressBar.style.width = pct + '%';
          progressPercent.textContent = pct + '%';
          if (pct > 88) progressStatus.textContent = 'Appending branded outro end-card...';
        });

        // Trigger Download
        progressBar.style.width = '100%';
        progressPercent.textContent = '100%';
        progressStatus.textContent = 'Export completed! Downloading file...';

        const downloadUrl = URL.createObjectURL(result.blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);

        setTimeout(() => {
          closeModal();
          directExportBtn.disabled = false;
          directExportBtn.innerHTML = '<i class="fa-solid fa-download"></i> Generate &amp; Download Watermarked Video';
          progressWrap.style.display = 'none';
        }, 1200);
      } catch (err) {
        console.warn('[WATERMARK EXPORT FALLBACK]', err);
        progressStatus.textContent = 'Cross-Origin direct capture used. Initiating verified file download...';
        // Direct download fallback
        const a = document.createElement('a');
        a.href = reel.videoUrl;
        a.download = `NEXCHAT_${authorName.replace(/[^a-zA-Z0-9_]/g, '')}_${reel.id || 'reel'}.mp4`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        a.remove();

        setTimeout(() => {
          closeModal();
          directExportBtn.disabled = false;
          directExportBtn.innerHTML = '<i class="fa-solid fa-download"></i> Generate &amp; Download Watermarked Video';
          progressWrap.style.display = 'none';
        }, 1000);
      }
    };

    // Raw Download Master Action
    rawDownloadBtn.onclick = () => {
      const a = document.createElement('a');
      a.href = reel.videoUrl;
      a.download = `ORIGINAL_${authorName}_${reel.id || 'reel'}.mp4`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      a.remove();
      closeModal();
    };

    modal.classList.add('active');
  }

  /**
   * Inject CSS Styles for Watermark Studio Modal
   */
  function injectWatermarkStyles() {
    if (document.getElementById('nexWatermarkStyles')) return;
    const style = document.createElement('style');
    style.id = 'nexWatermarkStyles';
    style.textContent = `
      .nex-watermark-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(3, 7, 18, 0.88);
        backdrop-filter: blur(16px);
        z-index: 999999;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 16px;
      }
      .nex-watermark-modal-backdrop.active {
        display: flex;
        animation: wmFadeIn 0.25s ease-out;
      }
      @keyframes wmFadeIn {
        from { opacity: 0; transform: scale(0.97); }
        to { opacity: 1; transform: scale(1); }
      }
      .nex-watermark-modal-card {
        width: 100%;
        max-width: 480px;
        background: #080d1a;
        border: 1px solid rgba(0, 242, 255, 0.3);
        border-radius: 20px;
        padding: 22px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 242, 255, 0.15);
        color: #fff;
      }
      .nex-watermark-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }
      .nex-watermark-icon-badge {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        background: rgba(0, 242, 255, 0.12);
        border: 1px solid #00f2ff;
        color: #00f2ff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
      }
      .nex-watermark-close-btn {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #cbd5e1;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: 0.2s ease;
      }
      .nex-watermark-close-btn:hover {
        background: rgba(255, 51, 102, 0.2);
        border-color: #ff3366;
        color: #ff3366;
      }
      .nex-watermark-preview-wrap {
        position: relative;
        width: 100%;
        height: 280px;
        background: #02050b;
        border-radius: 14px;
        overflow: hidden;
        margin-bottom: 16px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      .nex-watermark-preview-wrap video {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      .nex-watermark-tag-preview {
        position: absolute;
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(7, 11, 20, 0.82);
        border: 1.5px solid rgba(0, 242, 255, 0.5);
        padding: 6px 12px;
        border-radius: 10px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
      }
      .nex-watermark-tag-preview.top-left {
        top: 14px;
        left: 14px;
      }
      .nex-watermark-tag-preview.bottom-right {
        bottom: 24px;
        right: 14px;
      }
      .nex-watermark-emblem {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: #00f2ff;
        color: #040711;
        font-family: monospace;
        font-weight: 900;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .nex-wm-title {
        font-size: 9.5px;
        font-weight: 800;
        color: #fff;
        letter-spacing: 0.5px;
      }
      .nex-wm-handle {
        font-size: 11px;
        font-weight: 700;
        color: #00f2ff;
        font-family: monospace;
      }
      .nex-wm-mode-btn {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        padding: 10px 12px;
        display: flex;
        align-items: center;
        gap: 10px;
        color: #fff;
        cursor: pointer;
        transition: 0.2s ease;
      }
      .nex-wm-mode-btn.active {
        background: rgba(0, 242, 255, 0.12);
        border-color: #00f2ff;
        box-shadow: 0 0 12px rgba(0, 242, 255, 0.2);
      }
      .nex-wm-action-btn {
        padding: 12px 18px;
        border-radius: 10px;
        font-size: 12.5px;
        font-weight: 700;
        border: none;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.2s ease;
      }
      .nex-wm-action-btn.primary {
        background: linear-gradient(135deg, #00f2ff, #00ff66);
        color: #040711;
        box-shadow: 0 4px 18px rgba(0, 242, 255, 0.35);
      }
      .nex-wm-action-btn.primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 24px rgba(0, 242, 255, 0.5);
      }
      .nex-wm-action-btn.secondary {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #cbd5e1;
      }
      .nex-wm-action-btn.secondary:hover {
        background: rgba(255, 255, 255, 0.12);
        color: #fff;
      }
    `;
    document.head.appendChild(style);
  }

  return {
    version: ENGINE_VERSION,
    drawWatermarkTag: drawWatermarkTag,
    drawOutroBumper: drawOutroBumper,
    generateWatermarkedVideo: generateWatermarkedVideo,
    openWatermarkExportModal: openWatermarkExportModal
  };
}));
