/**
 * MessageReactions - Emoji reaction picker and display
 * Double-tap for quick , long-press for picker tray.
 * Stacked pills below message showing emoji + count.
 */

export const QUICK_REACTIONS = ['', '', '', '', '', ''];

let currentPicker = null;

/**
 * Creates a floating picker tray DOM element.
 * @param {Function} onSelect Callback when an emoji is selected
 * @returns {HTMLElement} The picker element
 */
export function createReactionPicker(onSelect) {
  const picker = document.createElement('div');
  picker.className = 'nex-reaction-picker';
  picker.style.position = 'absolute';
  picker.style.zIndex = '100';
  picker.style.display = 'flex';
  picker.style.gap = '8px';
  picker.style.padding = '8px';
  picker.style.background = '#1a1d23';
  picker.style.borderRadius = '24px';
  picker.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
  picker.style.transform = 'scale(0)';
  picker.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
  
  QUICK_REACTIONS.forEach(emoji => {
    const btn = document.createElement('button');
    btn.className = 'nex-reaction-btn';
    btn.textContent = emoji;
    btn.style.background = 'none';
    btn.style.border = 'none';
    btn.style.fontSize = '20px';
    btn.style.cursor = 'pointer';
    btn.style.padding = '4px';
    btn.style.transition = 'transform 0.1s';
    
    btn.onmouseover = () => btn.style.transform = 'scale(1.2)';
    btn.onmouseout = () => btn.style.transform = 'scale(1)';
    
    btn.onclick = (e) => {
      e.stopPropagation();
      onSelect(emoji);
      hideReactionPicker();
    };
    picker.appendChild(btn);
  });

  const plusBtn = document.createElement('button');
  plusBtn.className = 'nex-reaction-btn nex-reaction-plus';
  plusBtn.textContent = '+';
  plusBtn.style.background = 'rgba(255,255,255,0.1)';
  plusBtn.style.border = 'none';
  plusBtn.style.borderRadius = '50%';
  plusBtn.style.width = '32px';
  plusBtn.style.height = '32px';
  plusBtn.style.color = '#fff';
  plusBtn.style.cursor = 'pointer';
  picker.appendChild(plusBtn);

  return picker;
}

/**
 * Renders the reactions row below a message.
 * @param {Object} reactions Map of emoji to array of UIDs
 * @param {string} currentUid Current user's UID
 * @param {Function} onReactionClick Callback when a pill is clicked
 * @returns {HTMLElement} The reactions row element
 */
export function renderReactionsRow(reactions, currentUid, onReactionClick) {
  const row = document.createElement('div');
  row.className = 'nex-reactions-row';
  row.style.display = 'flex';
  row.style.flexWrap = 'wrap';
  row.style.gap = '4px';
  row.style.marginTop = '4px';

  if (!reactions) return row;

  const summary = getReactionSummary(reactions);

  summary.forEach(({ emoji, count, uids }) => {
    if (count === 0) return;

    const pill = document.createElement('button');
    pill.className = 'nex-reaction-pill';
    pill.style.display = 'flex';
    pill.style.alignItems = 'center';
    pill.style.gap = '4px';
    pill.style.padding = '2px 8px';
    pill.style.borderRadius = '12px';
    pill.style.border = '1px solid rgba(255,255,255,0.1)';
    pill.style.background = 'rgba(255,255,255,0.05)';
    pill.style.color = '#fff';
    pill.style.fontSize = '12px';
    pill.style.cursor = 'pointer';

    if (uids.includes(currentUid)) {
      pill.classList.add('mine');
      pill.style.background = 'rgba(0, 255, 102, 0.1)';
      pill.style.border = '1px solid #00ff66';
    }

    pill.innerHTML = `<span>${emoji}</span><span>${count}</span>`;
    
    pill.onclick = (e) => {
      e.stopPropagation();
      onReactionClick(emoji);
    };

    row.appendChild(pill);
  });

  return row;
}

/**
 * Shows the reaction picker relative to an anchor element.
 * @param {HTMLElement} anchorElement The message element
 * @param {Function} onSelect Callback when selected
 */
export function showReactionPicker(anchorElement, onSelect) {
  hideReactionPicker();
  
  currentPicker = createReactionPicker(onSelect);
  document.body.appendChild(currentPicker);

  const rect = anchorElement.getBoundingClientRect();
  
  currentPicker.style.top = `${rect.top - 50 + window.scrollY}px`;
  currentPicker.style.left = `${Math.max(10, rect.left)}px`;
  
  // Trigger animation
  requestAnimationFrame(() => {
    currentPicker.style.transform = 'scale(1)';
  });
  
  const handleOutsideClick = (e) => {
    if (currentPicker && !currentPicker.contains(e.target)) {
      hideReactionPicker();
      document.removeEventListener('click', handleOutsideClick);
    }
  };
  
  setTimeout(() => {
    document.addEventListener('click', handleOutsideClick);
  }, 0);
}

/**
 * Hides the current reaction picker.
 */
export function hideReactionPicker() {
  if (currentPicker) {
    const picker = currentPicker;
    picker.style.transform = 'scale(0)';
    setTimeout(() => {
      if (picker.parentNode) {
        picker.parentNode.removeChild(picker);
      }
    }, 200);
    currentPicker = null;
  }
}

/**
 * Toggles a reaction for a user.
 * @param {Object} reactions Current reactions object
 * @param {string} emoji The emoji
 * @param {string} uid User ID
 * @returns {Object} New reactions object
 */
export function toggleReaction(reactions, emoji, uid) {
  const newReactions = { ...reactions };
  if (!newReactions[emoji]) {
    newReactions[emoji] = [];
  }

  const uids = newReactions[emoji];
  const index = uids.indexOf(uid);

  if (index === -1) {
    newReactions[emoji] = [...uids, uid];
  } else {
    newReactions[emoji] = uids.filter(id => id !== uid);
    if (newReactions[emoji].length === 0) {
      delete newReactions[emoji];
    }
  }

  return newReactions;
}

/**
 * Gets a sorted summary of reactions.
 * @param {Object} reactions Current reactions object
 * @returns {Array} Sorted array of reaction objects
 */
export function getReactionSummary(reactions) {
  if (!reactions) return [];
  
  return Object.keys(reactions)
    .map(emoji => ({
      emoji,
      count: reactions[emoji].length,
      uids: reactions[emoji]
    }))
    .sort((a, b) => b.count - a.count);
}
