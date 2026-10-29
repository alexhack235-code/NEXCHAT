
const reactionIconMap = {
  heart: '<i class="fa-solid fa-heart" style="color:#ef4444;font-size:11px;"></i>',
  thumbs_up: '<i class="fa-solid fa-thumbs-up" style="color:#3b82f6;font-size:11px;"></i>',
  fire: '<i class="fa-solid fa-fire" style="color:#f97316;font-size:11px;"></i>',
  star: '<i class="fa-solid fa-star" style="color:#eab308;font-size:11px;"></i>',
  check: '<i class="fa-solid fa-circle-check" style="color:#22c55e;font-size:11px;"></i>',
  bolt: '<i class="fa-solid fa-bolt" style="color:#a855f7;font-size:11px;"></i>'
};
import { getReactionSummary } from './message-reactions.js';
/**
 * @fileoverview MessageBubble - Renders a single chat message bubble
 * 
 * Supports: text, attachments (image/video/audio/doc), replies (quoted),
 * reactions display, read receipt ticks, sender info with role badges,
 * context menu (long-press/right-click), and swipe-to-reply gesture.
 */

// Distinct vibrant WhatsApp-grade group sender colors
export const SENDER_COLORS = [
  '#00f0ff', // Electric Cyan
  '#ff8a00', // Vibrant Orange
  '#2ecc71', // Bright Lime
  '#c084fc', // Neon Purple
  '#ffd166', // Golden Yellow
  '#f43f5e', // Vibrant Rose
  '#38bdf8', // Sky Blue
  '#a3e635', // Lime Light
  '#fb7185', // Soft Coral
  '#e879f9', // Orchid
  '#34d399', // Emerald
  '#f59e0b'  // Amber
];

/**
 * Deterministically maps a user ID or display name to a vibrant sender color
 * @param {string} idOrName 
 * @returns {string} Hex color string
 */
export function getSenderColor(idOrName) {
  if (!idOrName) return SENDER_COLORS[0];
  let hash = 0;
  const str = String(idOrName);
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % SENDER_COLORS.length;
  return SENDER_COLORS[index];
}

/**
 * Formats a timestamp into a readable string (e.g., '12:34 PM' or 'Yesterday 12:34 PM')
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
  if (isYesterday) return 'Yesterday ' + timeStr;
  
  return date.toLocaleDateString() + ' ' + timeStr;
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
 * Renders a complete message bubble matching WhatsApp Group specifications
 * @param {Object} message 
 * @param {HTMLElement} container 
 * @param {Object} options 
 */
export function renderMessageBubble(message, container, options = {}) {
  try {
    const wrapper = document.createElement('div');
    wrapper.className = 'nex-msg-wrapper ' + (options.isOwn ? 'sent' : 'received');
    wrapper.dataset.messageId = message.id;

    // Context menu handler
    const handleContextMenu = (e) => {
      e.preventDefault();
      if (options.onCopy) console.log('Show context menu for message', message.id);
    };
    wrapper.addEventListener('contextmenu', handleContextMenu);

    const senderColor = getSenderColor(message.from || options.senderName || 'user');

    // 1. Mini circular sender avatar next to received message bubbles
    if (!options.isOwn) {
      const avatarWrap = document.createElement('div');
      avatarWrap.className = 'nex-msg-avatar-wrap';

      const initialChar = (options.senderName || 'U')
        .trim()
        .replace(/^~\s*/, '')
        .trim()
        .charAt(0)
        .toUpperCase() || 'U';

      const initialCircle = document.createElement('div');
      initialCircle.className = 'nex-msg-avatar nex-msg-avatar-fallback';
      initialCircle.style.backgroundColor = senderColor;
      initialCircle.textContent = initialChar;

      const hasCustomPic = options.senderAvatar &&
        options.senderAvatar !== 'default-avatar.png' &&
        options.senderAvatar !== 'favicon.png' &&
        options.senderAvatar !== 'logo.jpg';

      if (hasCustomPic) {
        const avatarImg = document.createElement('img');
        avatarImg.className = 'nex-msg-avatar';
        avatarImg.src = options.senderAvatar;
        avatarImg.alt = options.senderName || 'User';
        avatarImg.onerror = function() {
          this.style.display = 'none';
          initialCircle.style.display = 'flex';
        };
        initialCircle.style.display = 'none';
        avatarWrap.appendChild(avatarImg);
        avatarWrap.appendChild(initialCircle);
      } else {
        avatarWrap.appendChild(initialCircle);
      }

      wrapper.appendChild(avatarWrap);
    }

    const contentArea = document.createElement('div');
    contentArea.className = 'nex-msg-content-area';

    const bubble = document.createElement('div');
    bubble.className = 'nex-msg-bubble ' + (options.isOwn ? 'sent' : 'received');

    // 2. WhatsApp Group Identity: Sender's name at top of bubble in unique vibrant color with '~ ' prefix
    if (!options.isOwn && options.senderName) {
      const senderDiv = document.createElement('div');
      senderDiv.className = 'nex-msg-sender';
      senderDiv.style.color = senderColor;

      const cleanName = String(options.senderName).trim().replace(/^~\s*/, '');
      const senderNameSpan = document.createElement('span');
      senderNameSpan.className = 'nex-msg-sender-name';
      senderNameSpan.textContent = '~ ' + cleanName;
      senderDiv.appendChild(senderNameSpan);

      if (options.senderRole && options.senderRole !== 'member') {
        const badge = document.createElement('span');
        badge.className = 'nex-role-badge ' + options.senderRole;
        if (options.senderRole === 'creator' || options.senderRole === 'owner') {
          badge.innerHTML = '<i class="fa-solid fa-crown"></i> OWNER';
        } else if (options.senderRole === 'admin') {
          badge.innerHTML = '<i class="fa-solid fa-shield-halved"></i> ADMIN';
        } else if (options.senderRole === 'moderator' || options.senderRole === 'mod') {
          badge.innerHTML = '<i class="fa-solid fa-bolt"></i> MOD';
        } else {
          badge.textContent = options.senderRole.toUpperCase();
        }
        senderDiv.appendChild(badge);
      }
      if (options.isVerified) {
        const verBadge = document.createElement('span');
        verBadge.className = 'nex-role-badge verified';
        verBadge.title = 'Verified NEX User';
        verBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> VERIFIED';
        senderDiv.appendChild(verBadge);
      }
      bubble.appendChild(senderDiv);
    }

    // 3. Quoted reply with left bar tinted to match quoted sender's assigned color
    if (message.replyTo) {
      const quoteBlock = document.createElement('div');
      quoteBlock.className = 'nex-msg-quote';

      const quotedSenderId = message.replyTo.senderId || message.replyTo.from || message.replyTo.senderName || 'user';
      const quotedSenderColor = getSenderColor(quotedSenderId);
      quoteBlock.style.borderLeftColor = quotedSenderColor;

      const quoteSenderEl = document.createElement('div');
      quoteSenderEl.className = 'nex-msg-quote-sender';
      quoteSenderEl.style.color = quotedSenderColor;
      const qRawName = String(message.replyTo.senderName || 'Member').trim().replace(/^~\s*/, '');
      quoteSenderEl.textContent = '~ ' + qRawName;
      quoteBlock.appendChild(quoteSenderEl);

      const quoteTextEl = document.createElement('div');
      quoteTextEl.className = 'nex-msg-quote-text';
      quoteTextEl.textContent = message.replyTo.text || 'Attachment';
      quoteBlock.appendChild(quoteTextEl);

      if (options.onQuoteClick) {
        quoteBlock.style.cursor = 'pointer';
        quoteBlock.addEventListener('click', () => options.onQuoteClick(message.replyTo.messageId));
      }
      bubble.appendChild(quoteBlock);
    }

    // 4. Attachments (image / video / audio / document)
    if (message.attachment) {
      const attDiv = document.createElement('div');
      attDiv.className = 'nex-msg-attachment';
      const type = message.attachment.fileType;

      if (type && type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = (message.attachment.downloadURL || message.attachment.url || message.attachment.fileUrl || "");
        img.className = 'nex-attachment-img';
        attDiv.appendChild(img);
      } else if (type && type.startsWith('video/')) {
        const vid = document.createElement('video');
        vid.src = (message.attachment.downloadURL || message.attachment.url || message.attachment.fileUrl || "");
        vid.controls = true;
        vid.className = 'nex-attachment-video';
        attDiv.appendChild(vid);
      } else {
        const doc = document.createElement('div');
        doc.className = 'nex-attachment-doc';
        const docIcon = document.createElement('i');
        docIcon.className = 'fa-solid fa-file-lines';
        docIcon.style.marginRight = '6px';
        const docText = document.createElement('span');
        docText.textContent = message.attachment.fileName || 'Document';
        doc.appendChild(docIcon);
        doc.appendChild(docText);
        attDiv.appendChild(doc);
      }
      bubble.appendChild(attDiv);
    }

    // 5. Message Text
    if (message.text) {
      const textDiv = document.createElement('div');
      textDiv.className = 'nex-msg-text';
      try {
        const mentionResult = highlightMentions(String(message.text), message.mentionedUserIds, options.currentUid);
        if (mentionResult instanceof Node) {
          textDiv.appendChild(mentionResult);
        } else {
          textDiv.innerHTML = String(mentionResult || escapeHtml(message.text));
        }
      } catch (_) {
        textDiv.textContent = String(message.text);
      }
      bubble.appendChild(textDiv);
    }

    // 6. Meta row (timestamp + read receipt)
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

    // Read receipt ticks (FontAwesome icons)
    if (options.isOwn) {
      const tickSpan = document.createElement('span');
      tickSpan.className = 'nex-msg-tick';

      let isRead = false;
      let isReadAll = false;
      const readCount = Array.isArray(message.readBy) ? message.readBy.length : (message.readBy && typeof message.readBy === 'object' ? Object.keys(message.readBy).length : 0);
      if (readCount > 0) {
        isRead = true;
        if (readCount >= (options.totalMembers || 1) - 1) {
          isReadAll = true;
        }
      }

      if (isReadAll) {
        tickSpan.classList.add('read-all');
        tickSpan.innerHTML = '<i class="fa-solid fa-check-double"></i>';
      } else if (isRead) {
        tickSpan.classList.add('read');
        tickSpan.innerHTML = '<i class="fa-solid fa-check-double"></i>';
      } else {
        tickSpan.classList.add('sent');
        tickSpan.innerHTML = '<i class="fa-solid fa-check"></i>';
      }

      if (options.onTickClick) {
        tickSpan.style.cursor = 'pointer';
        tickSpan.addEventListener('click', () => options.onTickClick(message.id));
      }
      metaRow.appendChild(tickSpan);
    }

    bubble.appendChild(metaRow);
    contentArea.appendChild(bubble);

    // Reactions
    if (message.reactions) {
      try {
        const summary = getReactionSummary(message.reactions);
        if (summary && summary.length > 0) {
          const reactionsRow = document.createElement('div');
          reactionsRow.className = 'nex-reactions-row';

          summary.forEach(({ emoji, count, uids }) => {
            if (count > 0) {
              const pill = document.createElement('div');
              pill.className = 'nex-reaction-pill';
              const iconHtml = reactionIconMap[emoji] || `<span style="font-size:11px;font-weight:700;">${escapeHtml(emoji)}</span>`;
              pill.innerHTML = `${iconHtml} <span class="reaction-count" style="margin-left:3px;font-size:10px;font-weight:700;">${count}</span>`;
              if (Array.isArray(uids) && uids.includes(options.currentUid)) {
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
      } catch (reactionErr) {
        console.warn('[MessageBubble] Reactions render notice:', reactionErr);
      }
    }

    // Disappearing / Ephemeral Countdown
    if (message.expiresAt) {
      const expDate = message.expiresAt.toDate ? message.expiresAt.toDate() : new Date(message.expiresAt);
      const expireDiv = document.createElement('div');
      expireDiv.className = 'nex-msg-expires disappearing-countdown-badge';
      expireDiv.innerHTML = `
        <div class="ghost-countdown-content">
          <i class="fa-solid fa-clock-rotate-left fa-spin-pulse"></i>
          <span class="ghost-countdown-label">Disappears in</span>
          <span class="ghost-timer-sec disappear-timer-val">Calculating...</span>
        </div>
        <div class="disappear-progress-bar">
          <div class="disappear-progress-fill"></div>
        </div>
      `;
      contentArea.appendChild(expireDiv);

      const timerVal = expireDiv.querySelector('.disappear-timer-val');
      const progressFill = expireDiv.querySelector('.disappear-progress-fill');
      const createdAtMs = message.createdAt?.toDate ? message.createdAt.toDate().getTime() : (message.time?.toDate ? message.time.toDate().getTime() : Date.now() - 60000);
      const totalDurationMs = Math.max(1000, expDate.getTime() - createdAtMs);

      const updateCountdown = () => {
        const remainingMs = expDate.getTime() - Date.now();
        if (remainingMs <= 0) {
          clearInterval(intervalId);
          expireDiv.innerHTML = '<i class="fa-solid fa-fire-burner"></i> <span>Message expired</span>';
          wrapper.classList.add('ephemeral-dissolve');
          setTimeout(() => {
            if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
          }, 600);
          return;
        }

        const remSec = Math.floor(remainingMs / 1000);
        const remMin = Math.floor(remSec / 60);
        const remHours = Math.floor(remMin / 60);
        const remDays = Math.floor(remHours / 24);

        let formatted = '';
        if (remDays > 0) {
          formatted = remDays + 'd ' + (remHours % 24) + 'h';
        } else if (remHours > 0) {
          formatted = remHours + 'h ' + (remMin % 60) + 'm';
        } else if (remMin > 0) {
          const s = remSec % 60;
          formatted = remMin + 'm ' + (s < 10 ? '0' : '') + s + 's';
        } else {
          formatted = remSec + 's';
        }

        if (timerVal) timerVal.textContent = formatted;
        if (progressFill) {
          const pct = Math.max(0, Math.min(100, (remainingMs / totalDurationMs) * 100));
          progressFill.style.width = pct + '%';
          if (pct < 20 || remainingMs < 60000) {
            expireDiv.classList.add('critical-urgency');
          }
        }
      };

      updateCountdown();
      const intervalId = setInterval(updateCountdown, 1000);
    }

    wrapper.appendChild(contentArea);
    container.appendChild(wrapper);

  } catch (error) {
    console.error('Error rendering message bubble:', error);
  }
}

/**
 * Renders a system message / announcement centered in a subtle rounded pill badge
 * @param {string} text 
 * @param {HTMLElement} container 
 */
export function renderSystemMessage(text, container) {
  if (!text || !container) return;
  const wrapper = document.createElement('div');
  wrapper.className = 'nex-msg-wrapper system';

  const pill = document.createElement('div');
  pill.className = 'nex-system-pill';

  let iconClass = 'fa-solid fa-circle-info';
  const lower = String(text).toLowerCase();
  if (lower.includes('encrypt') || lower.includes('security') || lower.includes('lock')) {
    iconClass = 'fa-solid fa-lock';
  } else if (lower.includes('joined') || lower.includes('added') || lower.includes('welcome')) {
    iconClass = 'fa-solid fa-user-plus';
  } else if (lower.includes('left') || lower.includes('removed')) {
    iconClass = 'fa-solid fa-arrow-right-from-bracket';
  } else if (lower.includes('topic') || lower.includes('title') || lower.includes('pinned')) {
    iconClass = 'fa-solid fa-pen';
  }

  const icon = document.createElement('i');
  icon.className = iconClass;
  pill.appendChild(icon);

  const span = document.createElement('span');
  span.textContent = text;
  pill.appendChild(span);

  wrapper.appendChild(pill);
  container.appendChild(wrapper);
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
  sepDiv.textContent = typeof date === 'string' ? date : formatTimestamp(date).split(' ')[0];
  container.appendChild(sepDiv);
}
