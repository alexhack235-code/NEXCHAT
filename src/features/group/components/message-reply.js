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
export function attachSwipeToReply(element, message, onReply) {
  if (!element || element.dataset.swipeBound === 'true') return;
  element.dataset.swipeBound = 'true';

  let icon = element.querySelector('.nex-reply-icon');
  if (!icon) {
    icon = document.createElement('div');
    icon.className = 'nex-reply-icon';
    icon.innerHTML = '<i class="fa-solid fa-reply"></i>';
    icon.style.position = 'absolute';
    icon.style.top = '50%';
    icon.style.left = '12px';
    icon.style.transform = 'translateY(-50%) scale(0.5)';
    icon.style.opacity = '0';
    icon.style.pointerEvents = 'none';
    icon.style.zIndex = '5';
    element.appendChild(icon);
  }

  let isDragging = false;
  let isLockedHorizontal = false;
  let hasTriggered = false;

  element.addEventListener('touchstart', (e) => {
    if (!e.touches || e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isDragging = true;
    isLockedHorizontal = false;
    hasTriggered = false;
    element.style.transition = 'none';
  }, { passive: true });

  element.addEventListener('touchmove', (e) => {
    if (!isDragging || hasTriggered) return;
    if (!e.touches || e.touches.length !== 1) return;

    currentX = e.touches[0].clientX;
    currentY = e.touches[0].clientY;
    const diffX = currentX - startX;
    const diffY = currentY - startY;

    // Rule: If vertical > 30px, cancel swipe, allow scroll. No fight.
    if (Math.abs(diffY) > VERTICAL_CANCEL_THRESHOLD) {
      isDragging = false;
      isLockedHorizontal = false;
      element.style.transition = 'transform 0.2s ease';
      element.style.transform = 'translateX(0px)';
      icon.style.opacity = '0';
      return;
    }

    if (!isLockedHorizontal) {
      if (diffX > 12 && Math.abs(diffY) < 15) {
        isLockedHorizontal = true;
      } else if (diffX < -12) {
        isDragging = false;
        return;
      }
    }

    if (isLockedHorizontal && diffX > 0) {
      if (e.cancelable) e.preventDefault();
      const move = Math.min(40, diffX * 0.5);
      element.style.transform = `translateX(${move}px)`;

      const progress = Math.min(1, diffX / HORIZONTAL_THRESHOLD);
      icon.style.opacity = String(progress);
      icon.style.transform = `translateY(-50%) scale(${0.5 + progress * 0.5})`;

      // Trigger condition: horizontal > 80px AND vertical < 30px
      if (diffX >= HORIZONTAL_THRESHOLD && Math.abs(diffY) < VERTICAL_CANCEL_THRESHOLD && !hasTriggered) {
        hasTriggered = true;
        if (navigator.vibrate) navigator.vibrate(25);
        if (onReply) onReply(message);
      }
    }
  }, { passive: false });

  element.addEventListener('touchend', () => {
    if (!isDragging && !isLockedHorizontal) return;
    isDragging = false;
    isLockedHorizontal = false;

    element.style.transition = 'transform 0.15s ease';
    element.style.transform = 'translateX(0)';

    setTimeout(() => {
      icon.style.opacity = '0';
      icon.style.transform = 'translateY(-50%) scale(0.5)';
    }, 200);

    startX = 0;
    startY = 0;
    currentX = 0;
    currentY = 0;
  }, { passive: true });
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
