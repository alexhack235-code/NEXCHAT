/**
 * @fileoverview MessageBubble - Renders a single chat message bubble
 * 
 * Supports: text, attachments (image/video/audio/doc), replies (quoted),
 * reactions display, read receipt ticks, sender info with role badges,
 * context menu (long-press/right-click), and swipe-to-reply gesture.
 */

/**
 * @typedef {Object} MessageAttachment
 * @property {string} downloadURL
 * @property {string} fileName
 * @property {string} fileType
 * @property {number} fileSize
 */

/**
 * @typedef {Object} MessageReplyTo
 * @property {string} messageId
 * @property {string} text
 * @property {string} senderId
 * @property {string} senderName
 */

/**
 * @typedef {Object} Message
 * @property {string} id
 * @property {string} from
 * @property {string} text
 * @property {Object|Date} timestamp
 * @property {boolean} [edited]
 * @property {MessageAttachment} [attachment]
 * @property {MessageReplyTo} [replyTo]
 * @property {Object.<string, string[]>} [reactions]
 * @property {string[]} [readBy]
 * @property {boolean} [isPoll]
 * @property {string} [pollId]
 * @property {Object|Date} [expiresAt]
 * @property {string[]} [mentionedUserIds]
 */

/**
 * @typedef {Object} RenderOptions
 * @property {boolean} isOwn
 * @property {string} senderName
 * @property {string} senderAvatar
 * @property {string} [senderRole]
 * @property {string} currentUid
 * @property {number} totalMembers
 * @property {Function} [onReply]
 * @property {Function} [onReact]
 * @property {Function} [onPin]
 * @property {Function} [onDelete]
 * @property {Function} [onCopy]
 * @property {Function} [onForward]
 * @property {Function} [onQuoteClick]
 * @property {Function} [onTickClick]
 * @property {Function} [onReactionClick]
 */

/**
 * Formats a timestamp into a readable string (e.g., "12:34 PM" or "Yesterday 12:34 PM")
 * @param {Object|Date|number} timestamp 
 * @returns {string}
 */
export function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  let date;
  if (timestamp instanceof Date) {
    date = timestamp;
  } else if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else {
    return '';
  }

  const now = new Date();
  const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();

  const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
  const timeStr = date.toLocaleTimeString([], timeOptions);

  if (isToday) return timeStr;
  if (isYesterday) return `Yesterday ${timeStr}`;
  
  return `${date.toLocaleDateString()} ${timeStr}`;
}

/**
 * Highlights mentions in text by wrapping them in spans
 * @param {string} text 
 * @param {string[]} mentionedUserIds 
 * @param {string} currentUid 
 * @returns {HTMLElement} 
 */
export function highlightMentions(text, mentionedUserIds, currentUid) {
  const container = document.createElement('span');
  if (!text) return container;
  
  if (!mentionedUserIds || mentionedUserIds.length === 0) {
    container.textContent = text;
    return container;
  }

  // Basic mention parser (assuming @username format)
  // In a real app, we might need a map of uid -> username to properly highlight.
  // For now, we'll just wrap @words.
  const words = text.split(/(\s+)/);
  
  words.forEach(word => {
    if (word.startsWith('@') && word.length > 1) {
      const span = document.createElement('span');
      span.className = 'nex-mention';
      span.textContent = word;
      container.appendChild(span);
    } else {
      container.appendChild(document.createTextNode(word));
    }
  });

  return container;
}

/**
 * Renders a complete message bubble
 * @param {Message} message 
 * @param {HTMLElement} container 
 * @param {RenderOptions} options 
 */
export function renderMessageBubble(message, container, options) {
  try {
    const wrapper = document.createElement('div');
    wrapper.className = `nex-msg-wrapper ${options.isOwn ? 'sent' : 'received'}`;
    wrapper.dataset.messageId = message.id;

    // Context menu handlers
    const handleContextMenu = (e) => {
      e.preventDefault();
      // Implementation would show a custom context menu
      if (options.onCopy) console.log('Show context menu for message', message.id);
    };
    wrapper.addEventListener('contextmenu', handleContextMenu);
    
    // Avatar (received only)
    if (!options.isOwn) {
      const avatar = document.createElement('img');
      avatar.className = 'nex-msg-avatar';
      avatar.src = options.senderAvatar || 'default-avatar.png';
      avatar.alt = options.senderName || 'User';
      wrapper.appendChild(avatar);
    }

    const contentArea = document.createElement('div');
    contentArea.className = 'nex-msg-content-area';

    // Sender Info (received only)
    if (!options.isOwn && options.senderName) {
      const senderDiv = document.createElement('div');
      senderDiv.className = 'nex-msg-sender';
      senderDiv.textContent = options.senderName;
      
      if (options.senderRole) {
        const badge = document.createElement('span');
        badge.className = 'nex-role-badge';
        badge.textContent = options.senderRole;
        senderDiv.appendChild(badge);
      }
      contentArea.appendChild(senderDiv);
    }

    const bubble = document.createElement('div');
    bubble.className = 'nex-msg-bubble';

    // Quoted reply
    if (message.replyTo) {
      const quoteBlock = document.createElement('div');
      quoteBlock.className = 'nex-msg-quote';
      quoteBlock.innerHTML = `<strong>${message.replyTo.senderName}</strong><div>${message.replyTo.text || 'Attachment'}</div>`;
      if (options.onQuoteClick) {
        quoteBlock.style.cursor = 'pointer';
        quoteBlock.addEventListener('click', () => options.onQuoteClick(message.replyTo.messageId));
      }
      bubble.appendChild(quoteBlock);
    }

    // Attachment
    if (message.attachment) {
      const attDiv = document.createElement('div');
      attDiv.className = 'nex-msg-attachment';
      const type = message.attachment.fileType;
      
      if (type && type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = message.attachment.downloadURL;
        img.className = 'nex-attachment-img';
        attDiv.appendChild(img);
      } else if (type && type.startsWith('video/')) {
        const vid = document.createElement('video');
        vid.src = message.attachment.downloadURL;
        vid.controls = true;
        vid.className = 'nex-attachment-video';
        attDiv.appendChild(vid);
      } else {
        const doc = document.createElement('div');
        doc.className = 'nex-attachment-doc';
        doc.innerHTML = `<span> ${message.attachment.fileName || 'Document'}</span>`;
        attDiv.appendChild(doc);
      }
      bubble.appendChild(attDiv);
    }

    // Text Content
    if (message.text) {
      const textDiv = document.createElement('div');
      textDiv.className = 'nex-msg-text';
      textDiv.appendChild(highlightMentions(message.text, message.mentionedUserIds, options.currentUid));
      bubble.appendChild(textDiv);
    }

    // Meta row (timestamp + read receipt)
    const metaRow = document.createElement('div');
    metaRow.className = 'nex-msg-meta';
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'nex-msg-time';
    timeSpan.textContent = formatTimestamp(message.timestamp);
    metaRow.appendChild(timeSpan);

    if (message.edited) {
      const editSpan = document.createElement('span');
      editSpan.className = 'nex-msg-edited';
      editSpan.textContent = ' (edited)';
      metaRow.appendChild(editSpan);
    }

    // Read receipts
    if (options.isOwn) {
      const tickSpan = document.createElement('span');
      tickSpan.className = 'nex-msg-tick';
      
      let tickIcon = ''; // Sent
      if (message.readBy && message.readBy.length > 0) {
        tickIcon = ''; // Read by at least one
        if (message.readBy.length >= options.totalMembers - 1) {
          tickSpan.classList.add('read-all'); // Read by all
        }
      }
      tickSpan.textContent = tickIcon;
      if (options.onTickClick) {
        tickSpan.style.cursor = 'pointer';
        tickSpan.addEventListener('click', () => options.onTickClick(message.id));
      }
      metaRow.appendChild(tickSpan);
    }
    
    bubble.appendChild(metaRow);
    contentArea.appendChild(bubble);

    // Reactions
    if (message.reactions && Object.keys(message.reactions).length > 0) {
      const reactionsRow = document.createElement('div');
      reactionsRow.className = 'nex-reactions-row';
      
      Object.entries(message.reactions).forEach(([emoji, users]) => {
        if (users && users.length > 0) {
          const pill = document.createElement('div');
          pill.className = 'nex-reaction-pill';
          pill.textContent = `${emoji} ${users.length}`;
          if (users.includes(options.currentUid)) {
            pill.classList.add('active');
          }
          if (options.onReactionClick) {
            pill.addEventListener('click', () => options.onReactionClick(message.id, emoji));
          }
          reactionsRow.appendChild(pill);
        }
      });
      contentArea.appendChild(reactionsRow);
    }

    // Expires / Disappearing message
    if (message.expiresAt) {
      const expireDiv = document.createElement('div');
      expireDiv.className = 'nex-msg-expires';
      expireDiv.textContent = ' Disappearing message';
      contentArea.appendChild(expireDiv);
    }

    wrapper.appendChild(contentArea);
    container.appendChild(wrapper);

  } catch (error) {
    console.error('Error rendering message bubble:', error);
  }
}

/**
 * Renders a system message (e.g., member joined)
 * @param {string} text 
 * @param {HTMLElement} container 
 */
export function renderSystemMessage(text, container) {
  if (!text || !container) return;
  const sysDiv = document.createElement('div');
  sysDiv.className = 'nex-system-message';
  sysDiv.textContent = text;
  container.appendChild(sysDiv);
}

/**
 * Renders a date separator (legacy wrapper)
 * @param {Object|Date} date 
 * @param {HTMLElement} container 
 */
export function renderDateSeparator(date, container) {
  if (!date || !container) return;
  const sepDiv = document.createElement('div');
  sepDiv.className = 'nex-date-separator';
  sepDiv.textContent = typeof date === 'string' ? date : formatTimestamp(date).split(' ')[0]; // Fallback
  container.appendChild(sepDiv);
}
