/**
 * MentionAutocomplete - @user mention autocomplete dropdown
 * Enhanced version extracted from chat.js mention parsing.
 * 
 * Provides:
 * - Autocomplete dropdown triggered by @ in the input field
 * - Mention parsing with user ID resolution
 * - Highlighted mention rendering in message text
 * 
 * @module mention-autocomplete
 */

/**
 * @typedef {Object} MentionUser
 * @property {string} uid - User ID
 * @property {string} username - Display username
 * @property {string} [avatar] - Profile picture URL
 * @property {string} [role] - Group role (admin/moderator/member)
 */

/**
 * Create and attach the mention autocomplete system to a textarea
 * @param {HTMLTextAreaElement} input - The message input textarea
 * @param {Object} options
 * @param {Function} options.getMembers - () => MentionUser[] — returns current group members
 * @param {Function} [options.onMentionSelect] - (user: MentionUser) => void
 * @returns {{ destroy: Function, parseText: Function }}
 */
export function createMentionAutocomplete(input, options = {}) {
  if (!input) throw new Error('Input element is required');

  const getMembers = options.getMembers || (() => []);
  const onMentionSelect = options.onMentionSelect;

  let dropdown = null;
  let selectedIndex = 0;
  let filteredUsers = [];
  let mentionStartPos = -1;
  let isActive = false;

  // Create dropdown element
  function createDropdown() {
    const el = document.createElement('div');
    el.classList.add('nex-mention-autocomplete');
    el.style.display = 'none';

    // Position near the input
    const inputRect = input.getBoundingClientRect();
    const parent = input.closest('.message-input-area') || input.parentElement;
    if (parent) {
      parent.style.position = 'relative';
      parent.appendChild(el);
    } else {
      document.body.appendChild(el);
    }

    return el;
  }

  dropdown = createDropdown();

  function showDropdown(users) {
    if (!dropdown || users.length === 0) {
      hideDropdown();
      return;
    }

    filteredUsers = users.slice(0, 8); // Max 8 suggestions
    selectedIndex = 0;

    dropdown.innerHTML = filteredUsers.map((user, i) => `
      <div class="nex-mention-autocomplete-item ${i === 0 ? 'selected' : ''}" 
           data-index="${i}" data-uid="${user.uid}" data-username="${escapeHtml(user.username)}">
        <img src="${escapeHtml(user.avatar || 'favicon.png')}" alt="" class="nex-mention-autocomplete-avatar">
        <div class="nex-mention-autocomplete-info">
          <span class="nex-mention-autocomplete-name">${escapeHtml(user.username)}</span>
          ${user.role && user.role !== 'member' ? `<span class="nex-role-badge ${user.role}">${getRoleEmoji(user.role)}</span>` : ''}
        </div>
      </div>
    `).join('');

    dropdown.style.display = 'block';
    isActive = true;

    // Click handlers
    dropdown.querySelectorAll('.nex-mention-autocomplete-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const idx = parseInt(item.dataset.index, 10);
        selectMention(idx);
      });
    });
  }

  function hideDropdown() {
    if (dropdown) {
      dropdown.style.display = 'none';
      dropdown.innerHTML = '';
    }
    isActive = false;
    filteredUsers = [];
    selectedIndex = 0;
    mentionStartPos = -1;
  }

  function selectMention(index) {
    const user = filteredUsers[index];
    if (!user) return;

    const text = input.value;
    const before = text.substring(0, mentionStartPos);
    const after = text.substring(input.selectionStart);

    input.value = `${before}@${user.username} ${after}`;
    input.focus();

    // Set cursor position after the mention
    const newPos = before.length + user.username.length + 2;
    input.setSelectionRange(newPos, newPos);

    if (onMentionSelect) onMentionSelect(user);
    hideDropdown();
  }

  function updateHighlight(index) {
    const items = dropdown.querySelectorAll('.nex-mention-autocomplete-item');
    items.forEach((item, i) => {
      item.classList.toggle('selected', i === index);
    });
    selectedIndex = index;

    // Scroll into view
    const selected = items[index];
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }

  // Input handler
  function handleInput() {
    const text = input.value;
    const cursorPos = input.selectionStart;

    // Find the @ character before cursor
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastAtPos = textBeforeCursor.lastIndexOf('@');

    if (lastAtPos === -1) {
      hideDropdown();
      return;
    }

    // Check that @ is at start or preceded by whitespace
    if (lastAtPos > 0 && !/\s/.test(text[lastAtPos - 1])) {
      hideDropdown();
      return;
    }

    const searchTerm = textBeforeCursor.substring(lastAtPos + 1);

    // If search term contains a space, mention is complete
    if (/\s/.test(searchTerm)) {
      hideDropdown();
      return;
    }

    mentionStartPos = lastAtPos;

    // Filter members
    const members = getMembers();
    const filtered = searchTerm.length === 0
      ? members
      : members.filter(user =>
          user.username.toLowerCase().includes(searchTerm.toLowerCase())
        );

    showDropdown(filtered);
  }

  // Keyboard navigation
  function handleKeyDown(e) {
    if (!isActive) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        updateHighlight(Math.min(selectedIndex + 1, filteredUsers.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        updateHighlight(Math.max(selectedIndex - 1, 0));
        break;
      case 'Enter':
      case 'Tab':
        if (filteredUsers.length > 0) {
          e.preventDefault();
          selectMention(selectedIndex);
        }
        break;
      case 'Escape':
        hideDropdown();
        break;
    }
  }

  // Attach listeners
  input.addEventListener('input', handleInput);
  input.addEventListener('keydown', handleKeyDown);
  document.addEventListener('click', (e) => {
    if (!dropdown?.contains(e.target) && e.target !== input) {
      hideDropdown();
    }
  });

  return {
    /**
     * Clean up event listeners and DOM
     */
    destroy() {
      input.removeEventListener('input', handleInput);
      input.removeEventListener('keydown', handleKeyDown);
      if (dropdown) dropdown.remove();
    },

    /**
     * Parse text and extract mentioned user IDs
     * @param {string} text - Message text to parse
     * @param {MentionUser[]} members - Available members to match against
     * @returns {{ text: string, mentionedUserIds: string[] }}
     */
    parseText(text, members) {
      return parseMentions(text, members);
    }
  };
}

/**
 * Parse message text and extract @mentions
 * @param {string} text - Raw message text
 * @param {MentionUser[]} [members] - Available members for UID resolution
 * @returns {{ text: string, mentionedUserIds: string[] }}
 */
export function parseMentions(text, members = []) {
  if (!text) return { text: '', mentionedUserIds: [] };

  const mentionRegex = /@(\w+)/g;
  const mentionedUserIds = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    const username = match[1];
    const member = members.find(m =>
      m.username.toLowerCase() === username.toLowerCase()
    );
    if (member) {
      mentionedUserIds.push(member.uid);
    } else {
      // Keep the username string as fallback
      mentionedUserIds.push(username);
    }
  }

  return {
    text,
    mentionedUserIds: [...new Set(mentionedUserIds)]
  };
}

/**
 * Highlight @mentions in message text for display
 * @param {string} text - Message text
 * @param {string[]} [mentionedUserIds] - UIDs that were mentioned
 * @param {string} [currentUid] - Current user's UID (for self-mention highlight)
 * @returns {string} HTML string with mention spans
 */
export function highlightMentions(text, mentionedUserIds = [], currentUid = '') {
  if (!text) return '';

  return escapeHtml(text).replace(/@(\w+)/g, (match, username) => {
    const isSelfMention = mentionedUserIds.includes(currentUid);
    const extraClass = isSelfMention ? ' nex-mention-self' : '';
    return `<span class="nex-mention${extraClass}" data-username="${escapeHtml(username)}">${match}</span>`;
  });
}

/**
 * Get role emoji for display
 * @param {string} role
 * @returns {string}
 */
function getRoleEmoji(role) {
  const emojis = {
    creator: '',
    admin: '',
    moderator: '',
    member: ''
  };
  return emojis[role] || '';
}

/**
 * Escape HTML special characters
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
