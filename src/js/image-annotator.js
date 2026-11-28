/**
 * NEXCHAT Image Pen Annotation & Drawing Editor
 * Telegram / WhatsApp-Style In-Chat Image Editor
 */

(function () {
  const PALETTE = [
    { name: 'Red', color: '#ef4444' },
    { name: 'Yellow', color: '#facc15' },
    { name: 'Green', color: '#22c55e' },
    { name: 'Cyan', color: '#00f2ff' },
    { name: 'Blue', color: '#3b82f6' },
    { name: 'White', color: '#ffffff' },
    { name: 'Black', color: '#111827' }
  ];

  const STROKE_WIDTHS = [
    { label: 'Fine', size: 3 },
    { label: 'Medium', size: 8 },
    { label: 'Thick', size: 16 },
    { label: 'Marker', size: 28 }
  ];

  let modalEl = null;
  let canvasEl = null;
  let ctx = null;
  let sourceImg = null;
  let onSaveCallback = null;
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;
  let currentColor = '#22c55e';
  let currentWidth = 8;
  let currentMode = 'pen'; // 'pen' | 'highlighter'
  let historyStack = [];
  const MAX_HISTORY = 25;
  let originalMimeType = 'image/jpeg';
  let originalFileName = 'image.jpg';

  function createModal() {
    if (modalEl) return modalEl;

    const overlay = document.createElement('div');
    overlay.id = 'nex-image-annotator-modal';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 100050;
      background: rgba(5, 10, 20, 0.94);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      color: #f8fafc;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      user-select: none;
      -webkit-user-select: none;
      overflow: hidden;
    `;

    overlay.innerHTML = `
      <!-- Header Toolbar -->
      <div style="width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; background: rgba(15, 23, 42, 0.85); border-bottom: 1px solid rgba(255, 255, 255, 0.1); box-sizing: border-box; z-index: 2;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <button type="button" id="nex-annotator-cancel-btn" style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); color: #cbd5e1; font-size: 13px; font-weight: 600; padding: 7px 14px; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.15s ease;">
            <i class="fa-solid fa-xmark"></i> <span>Cancel</span>
          </button>
        </div>

        <div style="font-size: 14px; font-weight: 700; color: #00f2ff; display: flex; align-items: center; gap: 7px; letter-spacing: 0.5px;">
          <i class="fa-solid fa-pen-nib"></i> <span>PHOTO ANNOTATOR</span>
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          <button type="button" id="nex-annotator-undo-btn" title="Undo Last Stroke" style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); color: #cbd5e1; width: 36px; height: 36px; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; transition: all 0.15s ease;">
            <i class="fa-solid fa-rotate-left"></i>
          </button>
          <button type="button" id="nex-annotator-clear-btn" title="Clear All Drawings" style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; width: 36px; height: 36px; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; transition: all 0.15s ease;">
            <i class="fa-solid fa-trash-can"></i>
          </button>
          <button type="button" id="nex-annotator-done-btn" style="background: linear-gradient(135deg, #00ff66 0%, #00d4ff 100%); border: none; color: #050a14; font-size: 13px; font-weight: 700; padding: 7px 18px; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 0 12px rgba(0, 255, 102, 0.35); transition: transform 0.15s ease;">
            <i class="fa-solid fa-check"></i> <span>Done</span>
          </button>
        </div>
      </div>

      <!-- Canvas Viewport -->
      <div id="nex-annotator-canvas-container" style="flex: 1; width: 100%; display: flex; align-items: center; justify-content: center; position: relative; padding: 12px; box-sizing: border-box; overflow: hidden; touch-action: none;">
        <canvas id="nex-annotator-canvas" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6); touch-action: none; cursor: crosshair;"></canvas>
      </div>

      <!-- Bottom Tools Bar -->
      <div style="width: 100%; display: flex; flex-direction: column; gap: 10px; padding: 12px 18px 18px 18px; background: rgba(15, 23, 42, 0.92); border-top: 1px solid rgba(255, 255, 255, 0.1); box-sizing: border-box; z-index: 2;">
        <!-- Modes & Thickness Row -->
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
          <!-- Pen / Highlighter Mode Toggle -->
          <div style="display: inline-flex; background: rgba(255, 255, 255, 0.06); padding: 3px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.12);">
            <button type="button" id="nex-mode-pen" class="nex-annotator-mode-btn" data-mode="pen" style="background: #22c55e; color: #050a14; border: none; font-size: 12px; font-weight: 700; padding: 5px 12px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;">
              <i class="fa-solid fa-pen"></i> <span>Pen</span>
            </button>
            <button type="button" id="nex-mode-highlighter" class="nex-annotator-mode-btn" data-mode="highlighter" style="background: transparent; color: #cbd5e1; border: none; font-size: 12px; font-weight: 600; padding: 5px 12px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;">
              <i class="fa-solid fa-highlighter"></i> <span>Highlighter</span>
            </button>
          </div>

          <!-- Stroke Size Selector -->
          <div id="nex-stroke-sizes" style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase;">Size:</span>
            ${STROKE_WIDTHS.map((w, idx) => `
              <button type="button" class="nex-size-btn ${idx === 1 ? 'active' : ''}" data-size="${w.size}" title="${w.label}" style="width: 28px; height: 28px; border-radius: 50%; background: ${idx === 1 ? 'rgba(0, 242, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)'}; border: 1.5px solid ${idx === 1 ? '#00f2ff' : 'rgba(255, 255, 255, 0.18)'}; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; padding: 0;">
                <span style="width: ${Math.min(18, w.size + 3)}px; height: ${Math.min(18, w.size + 3)}px; border-radius: 50%; background: #ffffff; display: block;"></span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Color Palette Row -->
        <div id="nex-color-palette" style="display: flex; align-items: center; justify-content: center; gap: 12px; padding: 4px 0; overflow-x: auto;">
          ${PALETTE.map((p, idx) => `
            <button type="button" class="nex-color-swatch ${p.color === '#22c55e' ? 'active' : ''}" data-color="${p.color}" title="${p.name}" style="width: 32px; height: 32px; min-width: 32px; border-radius: 50%; background: ${p.color}; border: 2.5px solid ${p.color === '#22c55e' ? '#ffffff' : 'rgba(255, 255, 255, 0.25)'}; transform: ${p.color === '#22c55e' ? 'scale(1.2)' : 'scale(1)'}; cursor: pointer; transition: transform 0.15s ease, border-color 0.15s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></button>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    modalEl = overlay;
    canvasEl = overlay.querySelector('#nex-annotator-canvas');
    ctx = canvasEl.getContext('2d');

    bindEvents();
    return modalEl;
  }

  function bindEvents() {
    if (!modalEl) return;

    modalEl.querySelector('#nex-annotator-cancel-btn').addEventListener('click', close);
    modalEl.querySelector('#nex-annotator-done-btn').addEventListener('click', saveAndClose);
    modalEl.querySelector('#nex-annotator-undo-btn').addEventListener('click', undo);
    modalEl.querySelector('#nex-annotator-clear-btn').addEventListener('click', clearAll);

    // Mode Toggle
    modalEl.querySelectorAll('.nex-annotator-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        setMode(mode);
      });
    });

    // Stroke Sizes
    modalEl.querySelectorAll('.nex-size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const size = parseInt(btn.dataset.size, 10) || 8;
        currentWidth = size;
        modalEl.querySelectorAll('.nex-size-btn').forEach(b => {
          b.style.background = 'rgba(255, 255, 255, 0.08)';
          b.style.borderColor = 'rgba(255, 255, 255, 0.18)';
        });
        btn.style.background = 'rgba(0, 242, 255, 0.2)';
        btn.style.borderColor = '#00f2ff';
      });
    });

    // Color Swatches
    modalEl.querySelectorAll('.nex-color-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        const color = swatch.dataset.color;
        setColor(color);
      });
    });

    // Canvas Pointer Drawing (Desktop Mouse + Mobile Touch + Stylus)
    canvasEl.addEventListener('pointerdown', handlePointerDown);
    canvasEl.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  }

  function setMode(mode) {
    currentMode = mode;
    const penBtn = modalEl.querySelector('#nex-mode-pen');
    const hlBtn = modalEl.querySelector('#nex-mode-highlighter');
    if (mode === 'pen') {
      penBtn.style.background = '#22c55e';
      penBtn.style.color = '#050a14';
      hlBtn.style.background = 'transparent';
      hlBtn.style.color = '#cbd5e1';
    } else {
      hlBtn.style.background = '#facc15';
      hlBtn.style.color = '#050a14';
      penBtn.style.background = 'transparent';
      penBtn.style.color = '#cbd5e1';
    }
  }

  function setColor(color) {
    currentColor = color;
    modalEl.querySelectorAll('.nex-color-swatch').forEach(s => {
      if (s.dataset.color === color) {
        s.style.borderColor = '#ffffff';
        s.style.transform = 'scale(1.2)';
      } else {
        s.style.borderColor = 'rgba(255, 255, 255, 0.25)';
        s.style.transform = 'scale(1)';
      }
    });
  }

  function pushHistoryState() {
    if (!ctx || !canvasEl) return;
    try {
      const imgData = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
      historyStack.push(imgData);
      if (historyStack.length > MAX_HISTORY) {
        historyStack.shift();
      }
    } catch (_) {}
  }

  function undo() {
    if (historyStack.length === 0) return;
    const prev = historyStack.pop();
    if (prev && ctx) {
      ctx.putImageData(prev, 0, 0);
    }
  }

  function clearAll() {
    if (!ctx || !canvasEl || !sourceImg) return;
    pushHistoryState();
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    ctx.drawImage(sourceImg, 0, 0, canvasEl.width, canvasEl.height);
  }

  function getCanvasCoords(e) {
    const rect = canvasEl.getBoundingClientRect();
    const scaleX = canvasEl.width / rect.width;
    const scaleY = canvasEl.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  function handlePointerDown(e) {
    if (!canvasEl || !ctx) return;
    e.preventDefault();
    canvasEl.setPointerCapture?.(e.pointerId);

    pushHistoryState();

    const { x, y } = getCanvasCoords(e);
    isDrawing = true;
    lastX = x;
    lastY = y;

    // Draw single dot on tap
    drawStroke(x, y, x, y);
  }

  function handlePointerMove(e) {
    if (!isDrawing || !ctx) return;
    e.preventDefault();
    const { x, y } = getCanvasCoords(e);
    drawStroke(lastX, lastY, x, y);
    lastX = x;
    lastY = y;
  }

  function handlePointerUp(e) {
    if (!isDrawing) return;
    isDrawing = false;
    try {
      canvasEl.releasePointerCapture?.(e.pointerId);
    } catch (_) {}
  }

  function drawStroke(x1, y1, x2, y2) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = currentColor;

    if (currentMode === 'highlighter') {
      ctx.globalAlpha = 0.38;
      ctx.lineWidth = Math.max(currentWidth * 2.5, 20);
    } else {
      ctx.globalAlpha = 1.0;
      ctx.lineWidth = currentWidth;
    }

    ctx.stroke();
    ctx.restore();
  }

  function open(srcOrFile, onSave) {
    createModal();
    onSaveCallback = onSave;
    historyStack = [];

    let imageSrc = '';
    if (srcOrFile instanceof File || srcOrFile instanceof Blob) {
      originalMimeType = srcOrFile.type || 'image/jpeg';
      originalFileName = srcOrFile.name || 'annotated_image.jpg';
      imageSrc = URL.createObjectURL(srcOrFile);
    } else if (typeof srcOrFile === 'string') {
      imageSrc = srcOrFile;
      originalMimeType = srcOrFile.endsWith('.png') ? 'image/png' : 'image/jpeg';
      originalFileName = 'annotated_photo.jpg';
    } else {
      console.error('[NexImageAnnotator] Invalid source provided:', srcOrFile);
      return;
    }

    sourceImg = new Image();
    sourceImg.crossOrigin = 'anonymous';

    sourceImg.onload = () => {
      // Calculate canvas dimensions (keep original resolution up to 2048px for fidelity)
      let w = sourceImg.naturalWidth || sourceImg.width || 800;
      let h = sourceImg.naturalHeight || sourceImg.height || 600;
      const MAX_DIM = 2048;

      if (w > MAX_DIM || h > MAX_DIM) {
        if (w > h) {
          h = Math.round((h * MAX_DIM) / w);
          w = MAX_DIM;
        } else {
          w = Math.round((w * MAX_DIM) / h);
          h = MAX_DIM;
        }
      }

      canvasEl.width = w;
      canvasEl.height = h;

      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(sourceImg, 0, 0, w, h);

      setMode('pen');
      setColor('#22c55e');
      modalEl.style.display = 'flex';
    };

    sourceImg.onerror = () => {
      alert('Unable to load image for annotation.');
      close();
    };

    sourceImg.src = imageSrc;
  }

  function close() {
    if (modalEl) {
      modalEl.style.display = 'none';
    }
    isDrawing = false;
    historyStack = [];
    sourceImg = null;
    onSaveCallback = null;
  }

  function saveAndClose() {
    if (!canvasEl) {
      close();
      return;
    }

    const mime = originalMimeType.includes('png') ? 'image/png' : 'image/jpeg';
    const quality = mime === 'image/jpeg' ? 0.92 : undefined;

    canvasEl.toBlob((blob) => {
      if (!blob) {
        close();
        return;
      }
      const dataUrl = canvasEl.toDataURL(mime, quality);
      if (typeof onSaveCallback === 'function') {
        try {
          onSaveCallback(blob, dataUrl);
        } catch (err) {
          console.error('[NexImageAnnotator] onSave callback error:', err);
        }
      }
      close();
    }, mime, quality);
  }

  window.NexImageAnnotator = {
    open,
    close
  };
})();

export const NexImageAnnotator = window.NexImageAnnotator;
