/**
 * GroupStore - Observable state management for group chat
 * 
 * State shape:
 * {
 *   currentGroupId: string|null,
 *   currentGroup: object|null,       // group metadata doc
 *   messages: Array,                 // array of message objects
 *   members: Map<string, object>,    // resolved user profiles
 *   typingUsers: string[],           // UIDs currently typing
 *   unreadCount: number,
 *   isLoadingMessages: boolean,
 *   isLoadingOlder: boolean,         // pagination loading
 *   hasOlderMessages: boolean,       // false when all history loaded
 *   oldestLoadedTimestamp: object|null,
 *   newestLoadedTimestamp: object|null,
 *   pinnedMessages: Array,
 *   replyingTo: object|null,         // message being replied to
 *   slowModeCooldownEnd: number|null // timestamp when cooldown expires
 * }
 */

const INITIAL_STATE = {
  currentGroupId: null,
  currentGroup: null,
  messages: [],
  members: new Map(),
  typingUsers: [],
  unreadCount: 0,
  isLoadingMessages: false,
  isLoadingOlder: false,
  hasOlderMessages: true,
  oldestLoadedTimestamp: null,
  newestLoadedTimestamp: null,
  pinnedMessages: [],
  replyingTo: null,
  slowModeCooldownEnd: null
};

class GroupStore {
  constructor() {
    /** @type {Object} */
    this.state = { ...INITIAL_STATE };
    
    /** @type {Map<string, Set<Function>>} */
    this.subscriptions = new Map();
    
    /** @type {Set<Function>} */
    this.globalSubscriptions = new Set();
  }

  /**
   * Subscribes to changes on a specific state key
   * @param {string} key - The state key to watch
   * @param {Function} callback - Called with the new value when it changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(key, callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }
    this.subscriptions.get(key).add(callback);

    return () => {
      const subs = this.subscriptions.get(key);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscriptions.delete(key);
        }
      }
    };
  }

  /**
   * Subscribes to any state change
   * @param {Function} callback - Called with the entire new state when any part changes
   * @returns {Function} Unsubscribe function
   */
  subscribeAll(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    this.globalSubscriptions.add(callback);

    return () => {
      this.globalSubscriptions.delete(callback);
    };
  }

  /**
   * Updates state with partial updates and notifies relevant subscribers
   * @param {Object} partialState - The state updates to apply
   */
  setState(partialState) {
    if (!partialState || typeof partialState !== 'object') {
      return;
    }

    const changedKeys = [];
    
    // Check for actual changes to avoid unnecessary notifications
    for (const key in partialState) {
      if (Object.prototype.hasOwnProperty.call(partialState, key)) {
        if (this.state[key] !== partialState[key]) {
          changedKeys.push(key);
          this.state[key] = partialState[key];
        }
      }
    }

    if (changedKeys.length === 0) {
      return; // No actual changes
    }

    // Notify key-specific subscribers
    for (const key of changedKeys) {
      const subs = this.subscriptions.get(key);
      if (subs) {
        for (const callback of subs) {
          try {
            callback(this.state[key]);
          } catch (err) {
            console.error(`Error in subscriber for key "${key}":`, err);
          }
        }
      }
    }

    // Notify global subscribers
    for (const callback of this.globalSubscriptions) {
      try {
        callback(this.state);
      } catch (err) {
        console.error('Error in global subscriber:', err);
      }
    }
  }

  /**
   * Returns a shallow copy of the current state
   * @returns {Object} Current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Resets the state back to the initial defaults (useful when switching groups)
   */
  resetState() {
    this.setState({ ...INITIAL_STATE, members: new Map() });
  }

  /**
   * Removes all subscriptions to avoid memory leaks
   */
  destroy() {
    this.subscriptions.clear();
    this.globalSubscriptions.clear();
  }
}

export const groupStore = new GroupStore();
