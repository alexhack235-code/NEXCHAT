/**
 * MessageReply - Swipe-to-reply gesture, reply preview bar, quoted message rendering
 */

import { getSenderColor } from './message-bubble.js';

let activeReplyTarget = null;
let isReplyModeActive = false;
let startX = 0;
let currentX = 0;
let startY = 0;
let currentY = 0;
const HORIZONTAL_THRESHOLD = 80;
const VERTICAL_CANCEL_THRESHOLD = 30;

/**
 * Attaches swipe-to-reply gesture to a message element.
 * Threshold: Swipe ONLY if horizontal > 80px AND vertical < 30px.
 * If vertical > 30px, cancel swipe, allow scroll. 1 swipe = 1 reply open.
 * @param {HTMLElement} element The message DOM element
 * @param {Object} message The message data object
 * @param {Function} onReply Callback when swipe threshold is reached
 */
function ensureGroupDelegatedSwipeController(containerEl) {
  if (!containerEl || containerEl.dataset.groupSwipeDelegated === 'true') return;
  containerEl.dataset.groupSwipeDelegated = 'true';

  let activeEl = null;
  let activeIcon = null;
  let isDragging = false;
  let isLockedHorizontal = false;
  let hasTriggered = false;
  let pendingRaf = false;
  let latestDx = 0;

  const ensureIcon = (el) => {
    let icon = el.querySelector('.nex-reply-icon');
    if (!icon) {
      icon = document.createElement('div');
      icon.className = 'nex-reply-icon';
      icon.innerHTML = '<i class="fa-solid fa-reply"></i>';
      icon.style.position = 'absolute';
      icon.style.top = '50%';
      icon.style.left = '12px';
      icon.style.transform = 'translate3d(0, -50%, 0) scale(0.45)';
      icon.style.opacity = '0';
      icon.style.pointerEvents = 'none';
      icon.style.zIndex = '5';
      el.appendChild(icon);
    }
    return icon;
  };

  const applyFrame = () => {
    pendingRaf = false;
    if (!activeEl || !isLockedHorizontal) return;
    const damped = 60 * Math.log1p(Math.max(0, latestDx) / 38);
    activeEl.style.transform = `translate3d(${damped.toFixed(1)}px, 0, 0)`;
    if (activeIcon) {
      const progress = Math.min(1, latestDx / HORIZONTAL_THRESHOLD);
      const pop = progress >= 1 ? 1.15 : (0.45 + progress * 0.6);
      activeIcon.style.opacity = progress.toFixed(2);
      activeIcon.style.transform = `translate3d(${(damped * 0.14).toFixed(1)}px, -50%, 0) scale(${pop.toFixed(2)})`;
    }
  };

  const resetGesture = () => {
    const el = activeEl;
    const icon = activeIcon;
    const wasLocked = isLockedHorizontal;
    activeEl = null;
    activeIcon = null;
    isDragging = false;
    isLockedHorizontal = false;
    latestDx = 0;
    startX = 0;
    startY = 0;
    currentX = 0;
    currentY = 0;

    if (el) {
      if (wasLocked) {
        el.style.transition = 'transform 340ms cubic-bezier(0.22, 1.35, 0.36, 1)';
        el.style.transform = 'translate3d(0px, 0, 0)';
        setTimeout(() => {
          el.style.willChange = 'auto';
          el.style.transition = '';
        }, 350);
      } else {
        el.style.willChange = 'auto';
      }
    }
    if (icon) {
      icon.style.transition = 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease';
      icon.style.opacity = '0';
      icon.style.transform = 'translate3d(0, -50%, 0) scale(0.45)';
    }
  };

  containerEl.addEventListener('touchstart', (e) => {
    if (!e.touches || e.touches.length !== 1) return;
    const target = e.target.closest('.nex-msg-wrapper, [data-swipe-bound="true"]');
    if (!target || !target._nexGroupSwipeMeta) return;
    activeEl = target;
    activeIcon = null;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isDragging = true;
    isLockedHorizontal = false;
    hasTriggered = false;
    latestDx = 0;
  }, { passive: true });

  containerEl.addEventListener('touchmove', (e) => {
    if (!isDragging || !activeEl || !e.touches || e.touches.length !== 1) return;
    currentX = e.touches[0].clientX;
    currentY = e.touches[0].clientY;
    const diffX = currentX - startX;
    const diffY = currentY - startY;

    if (!isLockedHorizontal) {
      if (Math.abs(diffY) > VERTICAL_CANCEL_THRESHOLD || diffX < -12) {
        resetGesture();
        return;
      }
      if (diffX > 12 && diffX > Math.abs(diffY) * 1.25) {
        isLockedHorizontal = true;
        activeEl.style.transition = 'none';
        activeEl.style.willChange = 'transform';
        activeIcon = ensureIcon(activeEl);
        activeIcon.style.transition = 'none';
      } else {
        return;
      }
    }

    if (isLockedHorizontal && diffX > 0) {
      latestDx = diffX;
      if (!pendingRaf) {
        pendingRaf = true;
        requestAnimationFrame(applyFrame);
      }
      if (diffX >= HORIZONTAL_THRESHOLD && Math.abs(diffY) < VERTICAL_CANCEL_THRESHOLD && !hasTriggered) {
        hasTriggered = true;
        if (navigator.vibrate) try { navigator.vibrate(15); } catch (_) {}
        const meta = activeEl._nexGroupSwipeMeta;
        if (meta && meta.onReply) meta.onReply(meta.message);
      }
    }
  }, { passive: true });

  const onEnd = () => {
    if (!isDragging && !isLockedHorizontal) return;
    resetGesture();
  };

  containerEl.addEventListener('touchend', onEnd, { passive: true });
  containerEl.addEventListener('touchcancel', onEnd, { passive: true });
}

export function attachSwipeToReply(element, message, onReply) {
  if (!element) return;
  element._nexGroupSwipeMeta = { message, onReply };
  if (element.dataset.swipeBound === 'true') return;
  element.dataset.swipeBound = 'true';

  const parentStream = element.parentElement || document.getElementById('nexGroupMsgStream') || document.getElementById('messages-area');
  if (parentStream) {
    ensureGroupDelegatedSwipeController(parentStream);
  }
}

/**
 * Shows the reply preview bar above the input area.
 * @param {Object} message The message to reply to
 * @param {string} senderName Name of the sender
 * @param {Function} onCancel Callback when cancel is clicked
 */
export function showReplyPreview(message, senderName, onCancel) {
  activeReplyTarget = message;
  isReplyModeActive = true;
  
  const senderColor = getSenderColor(message.from || message.senderId || senderName || 'user');

  let previewEl = document.getElementById('replyPreview');
  if (!previewEl) {
    previewEl = document.createElement('div');
    previewEl.id = 'replyPreview';
    previewEl.className = 'nex-reply-preview';
    previewEl.style.display = 'flex';
    previewEl.style.justifyContent = 'space-between';
    previewEl.style.alignItems = 'center';
    previewEl.style.padding = '8px 16px';
    previewEl.style.background = '#1a1d23';
    previewEl.style.borderLeft = `4px solid ${senderColor}`;
    previewEl.style.borderTop = '1px solid rgba(255,255,255,0.1)';
    previewEl.style.borderTopLeftRadius = '8px';
    previewEl.style.borderTopRightRadius = '8px';
    
    const inputArea = document.querySelector('.nex-chat-input-area') || document.querySelector('.message-input-area');
    if (inputArea && inputArea.parentNode) {
      inputArea.parentNode.insertBefore(previewEl, inputArea);
    } else {
      document.body.appendChild(previewEl);
    }
  } else {
    previewEl.style.borderLeft = `4px solid ${senderColor}`;
  }

  const text = message.text || (message.type === 'image' ? 'Image' : 'Message');
  const truncatedText = text.length > 50 ? text.substring(0, 50) + '...' : text;
  const cleanName = (senderName || 'Member').trim().replace(/^~\s*/, '');

  previewEl.innerHTML = `
    <div style="display: flex; flex-direction: column; overflow: hidden; flex: 1;">
      <span style="color: ${senderColor}; font-size: 12px; font-weight: bold;">Replying to ~ ${cleanName}</span>
      <span style="color: rgba(255,255,255,0.7); font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${truncatedText}</span>
    </div>
    <button id="cancelReplyBtn" style="background: none; border: none; color: rgba(255,255,255,0.6); font-size: 15px; cursor: pointer; padding: 4px 8px;" title="Cancel Reply"><i class="fa-solid fa-xmark"></i></button>
  `;
  
  previewEl.style.display = 'flex';

  document.getElementById('cancelReplyBtn').onclick = () => {
    hideReplyPreview();
    if (onCancel) onCancel();
  };
}

/**
 * Hides the reply preview bar.
 */
export function hideReplyPreview() {
  activeReplyTarget = null;
  isReplyModeActive = false;
  const previewEl = document.getElementById('replyPreview');
  if (previewEl) {
    previewEl.style.display = 'none';
  }
}

/**
 * Creates a quoted block element for displaying a replied-to message.
 * @param {Object} replyTo Reply payload object
 * @param {Function} onClick Callback when clicked to scroll to original
 * @returns {HTMLElement} The quoted block element
 */
export function createQuotedBlock(replyTo, onClick) {
  const quotedSenderId = replyTo.senderId || replyTo.from || replyTo.senderName || 'user';
  const quotedColor = getSenderColor(quotedSenderId);

  const block = document.createElement('div');
  block.className = 'nex-msg-quote';
  block.style.background = 'rgba(0, 0, 0, 0.22)';
  block.style.borderLeft = `3.5px solid ${quotedColor}`;
  block.style.padding = '5px 8px';
  block.style.borderRadius = '4px 8px 8px 4px';
  block.style.marginBottom = '5px';
  block.style.cursor = 'pointer';
  block.style.fontSize = '12px';

  const nameSpan = document.createElement('div');
  nameSpan.className = 'nex-msg-quote-sender';
  nameSpan.style.color = quotedColor;
  nameSpan.style.fontWeight = 'bold';
  nameSpan.style.marginBottom = '2px';
  const rawName = (replyTo.senderName || 'Member').trim().replace(/^~\s*/, '');
  nameSpan.textContent = '~ ' + rawName;

  const textSpan = document.createElement('div');
  textSpan.className = 'nex-msg-quote-text';
  textSpan.style.color = 'rgba(255,255,255,0.85)';
  textSpan.style.display = '-webkit-box';
  textSpan.style.webkitLineClamp = '3';
  textSpan.style.webkitBoxOrient = 'vertical';
  textSpan.style.overflow = 'hidden';
  textSpan.textContent = replyTo.text || 'Attachment';

  block.appendChild(nameSpan);
  block.appendChild(textSpan);

  block.onclick = (e) => {
    e.stopPropagation();
    if (onClick) onClick(replyTo.messageId);
  };

  return block;
}

/**
 * Gets the reply payload to attach to a new message.
 * @param {Object} message The message being replied to
 * @returns {Object} The replyTo payload
 */
export function getReplyPayload(message) {
  if (!message) return null;
  
  const text = message.text || (message.type === 'image' ? 'Image' : '');
  const truncated = text.length > 200 ? text.substring(0, 197) + '...' : text;
  
  return {
    messageId: message.id,
    text: truncated,
    senderId: message.senderId || message.from,
    senderName: message.senderName || 'Unknown'
  };
}

/**
 * Checks if reply mode is active.
 * @returns {boolean}
 */
export function isReplying() {
  return isReplyModeActive;
}

/**
 * Gets the current message being replied to.
 * @returns {Object|null}
 */
export function getCurrentReplyTarget() {
  return activeReplyTarget;
}
