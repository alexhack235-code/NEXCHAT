/**
 * @fileoverview UnreadDivider - Shows a "↓ X unread messages" marker
 * Appears at the boundary between read and unread messages.
 */

/**
 * Creates a DOM element for the unread divider.
 * @param {number} count Number of unread messages
 * @returns {HTMLElement} The created DOM element
 */
export function createUnreadDivider(count) {
  const container = document.createElement('div');
  container.className = 'nex-unread-divider-container';
  
  const label = document.createElement('div');
  label.className = 'nex-unread-divider-label';
  label.innerHTML = `<span>↓</span> <span class="nex-unread-count">${count}</span> unread messages`;
  
  container.appendChild(label);
  return container;
}

/**
 * Finds the index in the messages array where unread messages start.
 * @param {Array} messages Array of message objects
 * @param {string} currentUid The ID of the current user
 * @returns {number} The index of the first unread message, or -1 if all are read
 */
export function findUnreadBoundary(messages, currentUid) {
  if (!messages || !Array.isArray(messages) || !currentUid) {
    return -1;
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    
    // Skip non-message items (like date separators)
    if (msg.type === 'date-separator' || msg.type === 'unread-divider') {
      continue;
    }

    // A message is unread if it's not from the current user AND
    // the current user's ID is not in the readBy array.
    if (msg.from !== currentUid) {
      if (!msg.readBy || !Array.isArray(msg.readBy) || !msg.readBy.includes(currentUid)) {
        return i;
      }
    }
  }

  return -1; // All messages read
}

/**
 * Takes an array of messages and returns a new array with an unread divider injected if applicable.
 * @param {Array} messages Array of message objects (or mixed with date separators)
 * @param {string} currentUid The ID of the current user
 * @returns {Array} New array containing messages, separators, and the unread divider
 */
export function insertUnreadDivider(messages, currentUid) {
  if (!messages || !Array.isArray(messages) || !currentUid) {
    return messages || [];
  }

  const boundaryIndex = findUnreadBoundary(messages, currentUid);
  
  if (boundaryIndex === -1) {
    return [...messages];
  }

  // Calculate number of unread actual messages
  let unreadCount = 0;
  for (let i = boundaryIndex; i < messages.length; i++) {
    if (!messages[i].type || (messages[i].type !== 'date-separator' && messages[i].type !== 'unread-divider')) {
      if (messages[i].from !== currentUid) {
        unreadCount++;
      }
    }
  }

  if (unreadCount === 0) {
    return [...messages];
  }

  const result = [...messages];
  
  result.splice(boundaryIndex, 0, {
    type: 'unread-divider',
    count: unreadCount,
    id: `unread-div-${Date.now()}` // Unique ID
  });

  return result;
}

/**
 * Updates the unread count displayed on an existing divider element.
 * @param {HTMLElement} element The unread divider element
 * @param {number} newCount The new unread count
 */
export function updateUnreadCount(element, newCount) {
  if (!element) return;
  const countSpan = element.querySelector('.nex-unread-count');
  if (countSpan) {
    countSpan.textContent = newCount.toString();
  }
}

/**
 * Removes the unread divider from the DOM with a fade-out animation.
 * @param {HTMLElement} element The unread divider element to remove
 */
export function removeUnreadDivider(element) {
  if (!element || !element.parentNode) return;
  
  // Add animation class if supported by CSS, otherwise just remove immediately
  element.classList.add('nex-fade-out');
  
  // Wait for animation to finish (assuming 300ms transition)
  setTimeout(() => {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }, 300);
}
