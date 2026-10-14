/**
 * ReadReceipts - Message delivery/read status tracking
 *  pending →  sent →  read (some) →  read (all)
 */

import { writeBatch, doc, arrayUnion, Timestamp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

export const TICK_STATES = {
  PENDING: 'pending',
  SENT: 'sent',
  READ: 'read',
  READ_ALL: 'read-all'
};

/**
 * Determines the tick state based on reads vs total members.
 * @param {Object} message The message object
 * @param {number} totalGroupMembers Total members in the group
 * @returns {string} The TICK_STATES value
 */
export function getTickState(message, totalGroupMembers) {
  if (!message.id || message.pending) return TICK_STATES.PENDING;
  
  const readByCount = message.readBy ? message.readBy.length : 0;
  
  if (readByCount === 0) return TICK_STATES.SENT;
  // -1 to exclude the sender from total group members expecting to read
  if (readByCount >= totalGroupMembers - 1) return TICK_STATES.READ_ALL;
  
  return TICK_STATES.READ;
}

/**
 * Creates a tick element span.
 * @param {string} state TICK_STATES value
 * @returns {HTMLElement}
 */
export function createTickElement(state) {
  const tick = document.createElement('span');
  tick.className = 'nex-msg-tick';
  tick.style.fontSize = '12px';
  tick.style.marginLeft = '4px';
  tick.style.display = 'inline-block';
  
  updateTickElement(tick, state);
  return tick;
}

/**
 * Updates an existing tick element.
 * @param {HTMLElement} element The tick element
 * @param {string} newState TICK_STATES value
 */
export function updateTickElement(element, newState) {
  if (!element) return;
  
  element.dataset.state = newState;
  
  switch (newState) {
    case TICK_STATES.PENDING:
      element.innerHTML = '';
      element.style.color = 'rgba(255,255,255,0.5)';
      break;
    case TICK_STATES.SENT:
      element.innerHTML = '';
      element.style.color = 'rgba(255,255,255,0.5)';
      break;
    case TICK_STATES.READ:
      element.innerHTML = '';
      element.style.color = 'rgba(255,255,255,0.5)';
      break;
    case TICK_STATES.READ_ALL:
      element.innerHTML = '';
      element.style.color = '#00ff66';
      break;
  }
}

/**
 * Creates a modal to show who read the message.
 * @param {Array} readByList Array of { uid, username, avatar, readAt }
 * @param {Function} onClose Callback when modal closes
 * @returns {HTMLElement} The modal element
 */
export function createReadByModal(readByList, onClose) {
  const modal = document.createElement('div');
  modal.className = 'nex-read-modal';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100vw';
  modal.style.height = '100vh';
  modal.style.background = 'rgba(10, 14, 23, 0.8)';
  modal.style.display = 'flex';
  modal.style.justifyContent = 'center';
  modal.style.alignItems = 'center';
  modal.style.zIndex = '1000';
  modal.style.opacity = '0';
  modal.style.transition = 'opacity 0.2s';
  
  const content = document.createElement('div');
  content.style.background = '#1a1d23';
  content.style.borderRadius = '12px';
  content.style.width = '300px';
  content.style.maxHeight = '80vh';
  content.style.display = 'flex';
  content.style.flexDirection = 'column';
  content.style.boxShadow = '0 8px 24px rgba(0,0,0,0.5)';
  content.style.transform = 'translateY(20px)';
  content.style.transition = 'transform 0.2s';

  const header = document.createElement('div');
  header.style.padding = '16px';
  header.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  
  const title = document.createElement('h3');
  title.textContent = 'Message Read By';
  title.style.margin = '0';
  title.style.color = '#fff';
  title.style.fontSize = '16px';
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.background = 'none';
  closeBtn.style.border = 'none';
  closeBtn.style.color = '#fff';
  closeBtn.style.fontSize = '24px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.onclick = onClose;
  
  header.appendChild(title);
  header.appendChild(closeBtn);
  
  const list = document.createElement('div');
  list.style.padding = '16px';
  list.style.overflowY = 'auto';
  list.style.flex = '1';
  
  if (!readByList || readByList.length === 0) {
    list.innerHTML = '<p style="color:rgba(255,255,255,0.5); text-align:center; margin:0;">No one has read this yet.</p>';
  } else {
    readByList.forEach(user => {
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.marginBottom = '12px';
      
      const avatar = document.createElement('img');
      avatar.src = user.avatar || 'default-avatar.png';
      avatar.style.width = '40px';
      avatar.style.height = '40px';
      avatar.style.borderRadius = '50%';
      avatar.style.marginRight = '12px';
      avatar.style.objectFit = 'cover';
      
      const info = document.createElement('div');
      
      const name = document.createElement('div');
      name.textContent = user.username || 'Unknown User';
      name.style.color = '#fff';
      name.style.fontWeight = 'bold';
      name.style.fontSize = '14px';
      
      const time = document.createElement('div');
      const d = user.readAt ? (user.readAt.toDate ? user.readAt.toDate() : new Date(user.readAt)) : null;
      time.textContent = d ? d.toLocaleString() : '';
      time.style.color = 'rgba(255,255,255,0.5)';
      time.style.fontSize = '12px';
      
      info.appendChild(name);
      info.appendChild(time);
      item.appendChild(avatar);
      item.appendChild(info);
      list.appendChild(item);
    });
  }
  
  content.appendChild(header);
  content.appendChild(list);
  modal.appendChild(content);
  
  modal.onclick = (e) => {
    if (e.target === modal) onClose();
  };
  
  return modal;
}

let activeModal = null;

/**
 * Shows the read by modal.
 * @param {Array} readByList Users who read it
 * @param {Function} onClose Callback
 */
export function showReadByModal(readByList, onClose) {
  hideReadByModal();
  
  const handleClose = () => {
    hideReadByModal();
    if (onClose) onClose();
  };
  
  activeModal = createReadByModal(readByList, handleClose);
  document.body.appendChild(activeModal);
  
  requestAnimationFrame(() => {
    activeModal.style.opacity = '1';
    activeModal.firstChild.style.transform = 'translateY(0)';
  });
}

/**
 * Hides the read by modal.
 */
export function hideReadByModal() {
  if (activeModal) {
    const modal = activeModal;
    modal.style.opacity = '0';
    modal.firstChild.style.transform = 'translateY(20px)';
    setTimeout(() => {
      if (modal.parentNode) modal.parentNode.removeChild(modal);
    }, 200);
    activeModal = null;
  }
}

/**
 * Batch marks multiple messages as read in Firestore.
 * @param {Array<string>} messageIds Array of message document IDs
 * @param {string} uid The current user's UID
 * @param {Object} db Firestore database instance
 * @param {string} groupId The group ID (needed for document path)
 */
export async function batchMarkAsRead(messageIds, uid, db, groupId) {
  if (!messageIds || messageIds.length === 0 || !uid || !db || !groupId) return;
  
  try {
    const batch = writeBatch(db);
    const now = Timestamp.now();
    
    messageIds.forEach(msgId => {
      const msgRef = doc(db, 'groups', groupId, 'messages', msgId);
      batch.update(msgRef, {
        readBy: arrayUnion(uid),
        [`readAt.${uid}`]: now
      });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error in batchMarkAsRead:', error);
  }
}

/**
 * Creates an IntersectionObserver to mark messages read when visible.
 * @param {HTMLElement} container The scrolling container
 * @param {Function} onVisible Callback with messageId when visible for > 2s
 * @returns {IntersectionObserver}
 */
export function createReadObserver(container, onVisible) {
  const visibleTimers = new Map();
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const msgId = entry.target.dataset.messageId;
      if (!msgId) return;
      
      if (entry.isIntersecting) {
        if (!visibleTimers.has(msgId)) {
          const timer = setTimeout(() => {
            onVisible(msgId);
            observer.unobserve(entry.target);
            visibleTimers.delete(msgId);
          }, 2000);
          visibleTimers.set(msgId, timer);
        }
      } else {
        if (visibleTimers.has(msgId)) {
          clearTimeout(visibleTimers.get(msgId));
          visibleTimers.delete(msgId);
        }
      }
    });
  }, {
    root: container,
    threshold: 0.5
  });
  
  return observer;
}
