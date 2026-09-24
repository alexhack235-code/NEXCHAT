/**
 * MessageReply - Swipe-to-reply gesture, reply preview bar, quoted message rendering
 */

let activeReplyTarget = null;
let isReplyModeActive = false;
let startX = 0;
let currentX = 0;
const SWIPE_THRESHOLD = 50;

/**
 * Attaches swipe-to-reply gesture to a message element.
 * @param {HTMLElement} element The message DOM element
 * @param {Object} message The message data object
 * @param {Function} onReply Callback when swipe threshold is reached
 */
export function attachSwipeToReply(element, message, onReply) {
  const isSent = element.classList.contains('nex-msg-sent');
  const icon = document.createElement('div');
  icon.className = 'nex-reply-icon';
  icon.innerHTML = '';
  icon.style.position = 'absolute';
  icon.style.top = '50%';
  icon.style.transform = 'translateY(-50%) scale(0)';
  icon.style.transition = 'transform 0.2s';
  icon.style.opacity = '0';
  
  if (isSent) {
    icon.style.right = '-40px';
  } else {
    icon.style.left = '-40px';
  }
  
  element.style.position = 'relative';
  element.appendChild(icon);

  let isDragging = false;

  element.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isDragging = true;
    element.style.transition = 'none';
  }, { passive: true });

  element.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    
    currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    
    // Swipe left for sent, right for received
    if ((isSent && diff < 0) || (!isSent && diff > 0)) {
      const absDiff = Math.abs(diff);
      const move = isSent ? Math.max(-100, diff) : Math.min(100, diff);
      
      element.style.transform = `translateX(${move}px)`;
      
      if (absDiff > 20) {
        icon.style.opacity = Math.min(1, absDiff / 50).toString();
        const scale = Math.min(1, absDiff / SWIPE_THRESHOLD);
        icon.style.transform = `translateY(-50%) scale(${scale})`;
      }
    }
  }, { passive: true });

  element.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    isDragging = false;
    
    const diff = currentX - startX;
    const absDiff = Math.abs(diff);
    
    element.style.transition = 'transform 0.3s ease';
    element.style.transform = 'translateX(0)';
    icon.style.transition = 'all 0.3s ease';
    icon.style.transform = 'translateY(-50%) scale(0)';
    icon.style.opacity = '0';
    
    if (absDiff > SWIPE_THRESHOLD && ((isSent && diff < 0) || (!isSent && diff > 0))) {
      onReply(message);
    }
    
    startX = 0;
    currentX = 0;
  });
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
    previewEl.style.borderLeft = '4px solid #00ff66';
    previewEl.style.borderTop = '1px solid rgba(255,255,255,0.1)';
    previewEl.style.borderTopLeftRadius = '8px';
    previewEl.style.borderTopRightRadius = '8px';
    
    const inputArea = document.querySelector('.nex-chat-input-area');
    if (inputArea && inputArea.parentNode) {
      inputArea.parentNode.insertBefore(previewEl, inputArea);
    } else {
      document.body.appendChild(previewEl);
    }
  }

  const text = message.text || (message.type === 'image' ? ' Image' : 'Message');
  const truncatedText = text.length > 50 ? text.substring(0, 50) + '...' : text;

  previewEl.innerHTML = `
    <div style="display: flex; flex-direction: column; overflow: hidden; flex: 1;">
      <span style="color: #00ff66; font-size: 12px; font-weight: bold;">Replying to ${senderName}</span>
      <span style="color: rgba(255,255,255,0.7); font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${truncatedText}</span>
    </div>
    <button id="cancelReplyBtn" style="background: none; border: none; color: rgba(255,255,255,0.5); font-size: 20px; cursor: pointer; padding: 0 8px;">×</button>
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
  const block = document.createElement('div');
  block.className = 'nex-msg-quote';
  block.style.background = 'rgba(0, 0, 0, 0.2)';
  block.style.borderLeft = '3px solid #00ff66';
  block.style.padding = '4px 8px';
  block.style.borderRadius = '4px';
  block.style.marginBottom = '4px';
  block.style.cursor = 'pointer';
  block.style.fontSize = '12px';
  block.style.opacity = '0.8';

  const nameSpan = document.createElement('div');
  nameSpan.style.color = '#00ff66';
  nameSpan.style.fontWeight = 'bold';
  nameSpan.style.marginBottom = '2px';
  nameSpan.textContent = replyTo.senderName || 'Unknown';

  const textSpan = document.createElement('div');
  textSpan.style.color = 'rgba(255,255,255,0.9)';
  textSpan.style.display = '-webkit-box';
  textSpan.style.webkitLineClamp = '3';
  textSpan.style.webkitBoxOrient = 'vertical';
  textSpan.style.overflow = 'hidden';
  textSpan.textContent = replyTo.text;

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
  
  const text = message.text || (message.type === 'image' ? ' Image' : '');
  const truncated = text.length > 200 ? text.substring(0, 197) + '...' : text;
  
  return {
    messageId: message.id,
    text: truncated,
    senderId: message.senderId,
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
