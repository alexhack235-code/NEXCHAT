/**
 * @fileoverview DateSeparator - Inserts date dividers between message groups
 * Shows "Today", "Yesterday", or "September 23, 2026" between messages from different dates.
 */

/**
 * Formats a Date object into a readable date label.
 * @param {Date} date The date to format
 * @returns {string} The formatted date string ("Today", "Yesterday", or "Month DD, YYYY")
 */
export function formatDateLabel(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();
  
  // Normalize to start of day for comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const diffTime = today.getTime() - targetDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  }
}

/**
 * Checks if a date separator should be inserted between two messages.
 * @param {Object} prevMessage The previous message
 * @param {Object} currentMessage The current message
 * @returns {boolean} True if dates differ
 */
export function shouldInsertSeparator(prevMessage, currentMessage) {
  if (!prevMessage || !currentMessage) return true;
  if (!prevMessage.timestamp || !currentMessage.timestamp) return false;

  const getValidDate = (ts) => {
    if (ts instanceof Date) return ts;
    if (ts.toDate && typeof ts.toDate === 'function') return ts.toDate();
    if (typeof ts === 'number') return new Date(ts);
    return null;
  };

  const prevDate = getValidDate(prevMessage.timestamp);
  const currDate = getValidDate(currentMessage.timestamp);

  if (!prevDate || !currDate) return false;

  return prevDate.getDate() !== currDate.getDate() ||
         prevDate.getMonth() !== currDate.getMonth() ||
         prevDate.getFullYear() !== currDate.getFullYear();
}

/**
 * Creates a DOM element for the date separator.
 * @param {Date} date The date to display
 * @returns {HTMLElement} The created DOM element
 */
export function createDateSeparator(date) {
  const container = document.createElement('div');
  container.className = 'nex-date-separator-container';
  
  const label = document.createElement('div');
  label.className = 'nex-date-separator-label';
  label.textContent = formatDateLabel(date);
  
  container.appendChild(label);
  return container;
}

/**
 * Takes an array of messages and returns a new array with date separators injected.
 * @param {Array} messages Array of message objects
 * @returns {Array} New array containing messages and date separators
 */
export function insertDateSeparators(messages) {
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return [];
  }

  const result = [];
  
  for (let i = 0; i < messages.length; i++) {
    const currentMessage = messages[i];
    
    if (i === 0 || shouldInsertSeparator(messages[i - 1], currentMessage)) {
      let msgDate = null;
      if (currentMessage.timestamp instanceof Date) {
        msgDate = currentMessage.timestamp;
      } else if (currentMessage.timestamp?.toDate) {
        msgDate = currentMessage.timestamp.toDate();
      } else if (typeof currentMessage.timestamp === 'number') {
        msgDate = new Date(currentMessage.timestamp);
      }
      
      if (msgDate) {
        result.push({
          type: 'date-separator',
          date: msgDate,
          id: `date-sep-${msgDate.getTime()}` // Optional: ID for list rendering
        });
      }
    }
    
    result.push(currentMessage);
  }
  
  return result;
}
