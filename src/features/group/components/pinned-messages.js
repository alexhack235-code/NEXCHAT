/**
 * PinnedMessages - Collapsible banner showing pinned messages (up to 5)
 */

export const MAX_PINNED = 5;

/**
 * Creates the pinned bar element.
 * @param {Array} pinnedMessages Array of pinned message objects
 * @param {Function} onNavigate Callback to navigate to a message
 * @param {Function} onClose Callback when closed/unpinned
 * @returns {HTMLElement} The pinned bar element
 */
export function createPinnedBar(pinnedMessages, onNavigate, onClose) {
  const bar = document.createElement('div');
  bar.className = 'nex-pin-bar';
  bar.style.position = 'sticky';
  bar.style.top = '0';
  bar.style.zIndex = '50';
  bar.style.background = '#1a1d23';
  bar.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
  bar.style.padding = '8px 16px';
  bar.style.display = 'flex';
  bar.style.alignItems = 'center';
  bar.style.justifyContent = 'space-between';
  bar.style.transform = 'translateY(-100%)';
  bar.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
  bar.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
  bar.style.cursor = 'pointer';

  updatePinnedBar(bar, pinnedMessages, 0, onNavigate, onClose);

  return bar;
}

/**
 * Updates the pinned bar content.
 * @param {HTMLElement} element The bar element
 * @param {Array} pinnedMessages Array of pinned messages
 * @param {number} currentIndex The currently displayed index
 * @param {Function} onNavigate Callback to scroll
 * @param {Function} onClose Callback to unpin
 */
export function updatePinnedBar(element, pinnedMessages, currentIndex = 0, onNavigate, onClose) {
  if (!element || !pinnedMessages || pinnedMessages.length === 0) return;
  
  // Normalize index
  const safeIndex = (currentIndex % pinnedMessages.length + pinnedMessages.length) % pinnedMessages.length;
  const msg = pinnedMessages[safeIndex];
  
  element.innerHTML = '';
  element.dataset.index = safeIndex.toString();

  const iconContainer = document.createElement('div');
  iconContainer.innerHTML = '';
  iconContainer.style.marginRight = '12px';
  iconContainer.style.fontSize = '18px';

  const contentContainer = document.createElement('div');
  contentContainer.style.flex = '1';
  contentContainer.style.display = 'flex';
  contentContainer.style.flexDirection = 'column';
  contentContainer.style.overflow = 'hidden';

  const titleRow = document.createElement('div');
  titleRow.style.display = 'flex';
  titleRow.style.alignItems = 'center';
  titleRow.style.gap = '8px';
  
  const title = document.createElement('span');
  title.textContent = 'Pinned Message';
  title.style.color = '#00ff66';
  title.style.fontWeight = 'bold';
  title.style.fontSize = '12px';
  
  const badge = document.createElement('span');
  badge.textContent = `${safeIndex + 1} of ${pinnedMessages.length}`;
  badge.style.color = 'rgba(255,255,255,0.5)';
  badge.style.fontSize = '10px';
  
  titleRow.appendChild(title);
  if (pinnedMessages.length > 1) {
    titleRow.appendChild(badge);
  }

  const text = document.createElement('div');
  const msgText = msg.text || (msg.type === 'image' ? ' Image' : 'Message');
  text.textContent = msgText.length > 60 ? msgText.substring(0, 57) + '...' : msgText;
  text.style.color = '#fff';
  text.style.fontSize = '14px';
  text.style.whiteSpace = 'nowrap';
  text.style.overflow = 'hidden';
  text.style.textOverflow = 'ellipsis';

  contentContainer.appendChild(titleRow);
  contentContainer.appendChild(text);
  
  contentContainer.onclick = () => {
    if (onNavigate) onNavigate(msg.id);
  };

  element.appendChild(iconContainer);
  element.appendChild(contentContainer);

  const controls = document.createElement('div');
  controls.style.display = 'flex';
  controls.style.alignItems = 'center';
  controls.style.gap = '8px';

  if (pinnedMessages.length > 1) {
    const navDiv = document.createElement('div');
    navDiv.style.display = 'flex';
    navDiv.style.flexDirection = 'column';
    
    const upBtn = document.createElement('button');
    upBtn.innerHTML = '▲';
    upBtn.style.background = 'none';
    upBtn.style.border = 'none';
    upBtn.style.color = 'rgba(255,255,255,0.7)';
    upBtn.style.cursor = 'pointer';
    upBtn.style.fontSize = '10px';
    upBtn.style.padding = '2px';
    upBtn.onclick = (e) => {
      e.stopPropagation();
      const nextIndex = cyclePinnedMessage(pinnedMessages, safeIndex, -1);
      updatePinnedBar(element, pinnedMessages, nextIndex, onNavigate, onClose);
    };

    const downBtn = document.createElement('button');
    downBtn.innerHTML = '▼';
    downBtn.style.background = 'none';
    downBtn.style.border = 'none';
    downBtn.style.color = 'rgba(255,255,255,0.7)';
    downBtn.style.cursor = 'pointer';
    downBtn.style.fontSize = '10px';
    downBtn.style.padding = '2px';
    downBtn.onclick = (e) => {
      e.stopPropagation();
      const nextIndex = cyclePinnedMessage(pinnedMessages, safeIndex, 1);
      updatePinnedBar(element, pinnedMessages, nextIndex, onNavigate, onClose);
    };

    navDiv.appendChild(upBtn);
    navDiv.appendChild(downBtn);
    controls.appendChild(navDiv);
  }

  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '×';
  closeBtn.style.background = 'none';
  closeBtn.style.border = 'none';
  closeBtn.style.color = 'rgba(255,255,255,0.5)';
  closeBtn.style.fontSize = '24px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.padding = '0 4px';
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    if (onClose) onClose(msg.id);
  };

  controls.appendChild(closeBtn);
  element.appendChild(controls);
}

/**
 * Shows the pinned bar.
 * @param {HTMLElement} element The pinned bar element
 */
export function showPinnedBar(element) {
  if (!element) return;
  // Use timeout to allow DOM insertion before animating
  setTimeout(() => {
    element.style.transform = 'translateY(0)';
  }, 10);
}

/**
 * Hides the pinned bar.
 * @param {HTMLElement} element The pinned bar element
 */
export function hidePinnedBar(element) {
  if (!element) return;
  element.style.transform = 'translateY(-100%)';
}

/**
 * Checks if the limit of pinned messages has been reached.
 * @param {Array} pinnedMessages Current pinned messages
 * @returns {boolean}
 */
export function isPinLimitReached(pinnedMessages) {
  return pinnedMessages && pinnedMessages.length >= MAX_PINNED;
}

/**
 * Adds a message ID to the pinned list.
 * @param {Array} pinnedMessages Current list
 * @param {string} messageId The message ID to pin
 * @returns {Array} Updated array or throws error
 */
export function addPinnedMessage(pinnedMessages, messageId) {
  const current = pinnedMessages || [];
  if (current.includes(messageId)) return current;
  if (isPinLimitReached(current)) {
    throw new Error(`Maximum of ${MAX_PINNED} pinned messages reached.`);
  }
  return [...current, messageId];
}

/**
 * Removes a message ID from the pinned list.
 * @param {Array} pinnedMessages Current list
 * @param {string} messageId The message ID to unpin
 * @returns {Array} Updated array
 */
export function removePinnedMessage(pinnedMessages, messageId) {
  const current = pinnedMessages || [];
  return current.filter(id => id !== messageId);
}

/**
 * Cycles to the next/prev pinned message index.
 * @param {Array} pinnedMessages Array of messages
 * @param {number} currentIndex Current index
 * @param {number} direction 1 for next, -1 for prev
 * @returns {number} The new index
 */
export function cyclePinnedMessage(pinnedMessages, currentIndex, direction) {
  if (!pinnedMessages || pinnedMessages.length <= 1) return 0;
  const len = pinnedMessages.length;
  return (currentIndex + direction % len + len) % len;
}
