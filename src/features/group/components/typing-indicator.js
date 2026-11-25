/**
 * TypingIndicator - Displays typing status for group members
 * Shows animated bouncing dots with "User is typing..." text.
 * Integrates with both Supabase Realtime and Firestore for dual-layer presence.
 * 
 * @module typing-indicator
 */

/**
 * Create the typing indicator DOM element
 * @param {HTMLElement} container - Parent element to append to
 * @returns {{ element: HTMLElement, show: Function, hide: Function, update: Function, destroy: Function }}
 */
export function createTypingIndicator(container) {
  const element = document.createElement('div');
  element.classList.add('nex-typing-indicator');
  element.style.display = 'none';

  element.innerHTML = `
    <div class="nex-typing-avatars-stack" aria-hidden="true"></div>
    <div class="nex-typing-wave-bars" aria-hidden="true">
      <span></span><span></span><span></span><span></span>
    </div>
    <span class="nex-typing-text nex-typing-name-shimmer"></span>
  `;

  const stackEl = element.querySelector('.nex-typing-avatars-stack');
  const textEl = element.querySelector('.nex-typing-text');
  let hideTimeout = null;

  if (container) {
    container.appendChild(element);
  }

  return {
    element,

    /**
     * Show the typing indicator with user names
     * @param {string[]} usernames - Array of usernames currently typing
     */
    show(usernames) {
      if (!usernames || usernames.length === 0) {
        this.hide();
        return;
      }

      clearTimeout(hideTimeout);

      if (stackEl) {
        stackEl.innerHTML = usernames.slice(0, 3).map((u) => {
          const ch = String(u || 'M').trim().charAt(0).toUpperCase() || 'M';
          return `<span class="nex-typing-mini-avatar">${ch}</span>`;
        }).join('');
      }

      let text;
      if (usernames.length === 1) {
        text = `${usernames[0]} typing...`;
      } else if (usernames.length === 2) {
        text = `${usernames[0]} & ${usernames[1]} typing...`;
      } else {
        text = `${usernames[0]} + ${usernames.length - 1} others typing...`;
      }

      textEl.textContent = text;
      element.style.display = 'inline-flex';
      element.style.visibility = 'visible';
      element.classList.add('visible');
    },

    /**
     * Hide the typing indicator
     */
    hide() {
      element.classList.remove('visible');
      hideTimeout = setTimeout(() => {
        element.style.display = 'none';
      }, 300);
    },

    /**
     * Update typing users and auto-hide after timeout
     * @param {string[]} usernames
     * @param {number} [autoHideMs=5000]
     */
    update(usernames, autoHideMs = 5000) {
      if (!usernames || usernames.length === 0) {
        this.hide();
        return;
      }

      this.show(usernames);

      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => {
        this.hide();
      }, autoHideMs);
    },

    /**
     * Clean up
     */
    destroy() {
      clearTimeout(hideTimeout);
      element.remove();
    }
  };
}

/**
 * Debounced typing broadcaster
 * Throttles typing status updates to prevent Firestore spam.
 * 
 * @param {Function} onTypingStart - Called when user starts typing
 * @param {Function} onTypingStop - Called when user stops typing
 * @param {number} [debounceMs=2000] - Debounce delay in ms
 * @returns {{ handleInput: Function, destroy: Function }}
 */
export function createTypingBroadcaster(onTypingStart, onTypingStop, debounceMs = 2000) {
  let isTyping = false;
  let timeout = null;

  function handleInput() {
    if (!isTyping) {
      isTyping = true;
      onTypingStart();
    }

    clearTimeout(timeout);
    timeout = setTimeout(() => {
      isTyping = false;
      onTypingStop();
    }, debounceMs);
  }

  function destroy() {
    clearTimeout(timeout);
    if (isTyping) {
      isTyping = false;
      onTypingStop();
    }
  }

  return { handleInput, destroy };
}
