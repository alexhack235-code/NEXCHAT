/**
 * NEXCHAT Group Chat Module — Public API
 * 
 * This is the main entry point for the group chat system.
 * It provides a clean facade over the internal modules, wiring together
 * the store, services, components, and UI rendering.
 * 
 * Usage in chat.js:
 *   import { GroupChat } from './src/features/group/index.js';
 *   
 *   // Open a group chat (replaces loadGroupMessages)
 *   await GroupChat.open(groupId, messagesContainer);
 *   
 *   // Send a message (replaces sendGroupMessage)
 *   await GroupChat.send({ text: 'Hello!' });
 *   
 *   // Load older messages on scroll
 *   await GroupChat.loadOlder();
 *   
 *   // Close when switching chats
 *   GroupChat.close();
 * 
 * @module group-chat
 */

// ============ STORE ============
import { groupStore } from './group-store.js';

// ============ SERVICES ============
import {
  openGroupChat,
  closeGroupChat,
  loadOlderMessages,
  sendMessage,
  addReaction,
  deleteMessage,
  editMessage,
  getUserProfile
} from './group-message-service.js';

import {
  createGroup,
  getGroup,
  updateGroupInfo,
  deleteGroup,
  addMembers,
  removeMember,
  leaveGroup,
  getGroupMembers,
  promoteToModerator,
  promoteToAdmin,
  demoteToMember,
  setSlowMode,
  setDisappearingMessages,
  muteMember,
  unmuteMember,
  isMemberMuted,
  submitJoinRequest,
  getPendingJoinRequests,
  acceptJoinRequest,
  declineJoinRequest,
  pinMessage,
  unpinMessage,
  regenerateInviteLink
} from './group-service.js';

// ============ CACHE ============
import { initCache, pruneOldMessages } from './group-cache.js';

// ============ PERMISSIONS ============
import { getUserRole, hasPermission, PERMISSIONS, checkSlowMode, getRoleLabel, getRoleBadgeColor } from './group-permissions.js';

// ============ COMPONENTS ============
import { VirtualScroller } from './components/virtual-scroller.js';
import { renderMessageBubble, renderSystemMessage } from './components/message-bubble.js';
import { insertDateSeparators, createDateSeparator } from './components/date-separator.js';
import { insertUnreadDivider, createUnreadDivider } from './components/unread-divider.js';
import { createReactionPicker, showReactionPicker, hideReactionPicker, renderReactionsRow } from './components/message-reactions.js';
import { showReplyPreview, hideReplyPreview, createQuotedBlock, getReplyPayload, isReplying, getCurrentReplyTarget } from './components/message-reply.js';
import { createTickElement, getTickState, createReadObserver, batchMarkAsRead, showReadByModal } from './components/read-receipts.js';
import { createPinnedBar, updatePinnedBar, showPinnedBar, hidePinnedBar } from './components/pinned-messages.js';
import { createPoll, votePoll, closePoll, renderPoll, showPollModal } from './components/poll-component.js';
import { createMentionAutocomplete, parseMentions, highlightMentions } from './components/mention-autocomplete.js';
import { createTypingIndicator, createTypingBroadcaster } from './components/typing-indicator.js';
import { showInviteModal, generateInviteLink } from './components/invite-qr.js';
import { createGroupCallButton, showGroupCallModal } from './components/group-call-button.js';
import { db, auth } from '../../../firebase-config.js';
import { broadcastTyping } from '../../js/presence.js';

// ============ INTERNAL STATE ============
let _scroller = null;
let _readObserver = null;
let _mentionAutocomplete = null;
let _typingIndicator = null;
let _typingBroadcaster = null;
let _pinnedBar = null;
let _container = null;
let _inputElement = null;
let _initialized = false;

/**
 * Initialize the group chat system
 * Call once on app startup.
 */
async function init() {
  if (_initialized) return;
  
  try {
    await initCache();
    // Prune old cached messages on startup
    pruneOldMessages(30).catch(() => {});
    _initialized = true;
    console.log('[GroupChat] Module initialized');
  } catch (err) {
    console.warn('[GroupChat] Init warning:', err);
    _initialized = true; // Continue even if cache fails
  }
}

/**
 * Open a group chat — the main entry point
 * Replaces loadGroupMessages() from chat.js.
 * 
 * @param {string} groupId - The Firestore group document ID
 * @param {HTMLElement} messagesContainer - The #messages-area element
 * @param {Object} [options]
 * @param {HTMLTextAreaElement} [options.inputElement] - The message input textarea
 * @param {HTMLElement} [options.pinnedBarContainer] - Container for pinned messages bar
 * @param {HTMLElement} [options.typingContainer] - Container for typing indicator
 * @param {string} [options.currentUid] - Current user's UID
 * @param {Function} [options.onNotify] - (message, type) => void — notification callback
 */
async function open(groupId, messagesContainer, options = {}) {
  if (!_initialized) await init();

  // Clean up previous
  close();

  _container = messagesContainer;
  _inputElement = options.inputElement;

  const currentUid = options.currentUid || (await _getCurrentUid());
  const onNotify = options.onNotify || (() => {});

  // Initialize virtual scroller
  _scroller = new VirtualScroller(messagesContainer, {
    estimatedItemHeight: 80,
    overscan: 5,
    renderItem: (item, element, index) => {
      _renderItem(item, element, currentUid, options);
    },
    onLoadMore: async () => {
      const state = groupStore.getState();
      if (state.hasOlderMessages && !state.isLoadingOlder) {
        const older = await loadOlderMessages();
        if (older.length > 0) {
          const processed = _processMessages(groupStore.getState().messages, currentUid);
          _scroller.setItems(processed);
        }
        _scroller.finishLoadMore();
      } else {
        _scroller.finishLoadMore();
      }
    },
    onBottomReached: () => {
      // Mark visible messages as read
    }
  });

  // Initialize read receipt observer
  _readObserver = createReadObserver(messagesContainer, async (messageId) => {
    try {
      await batchMarkAsRead([messageId], currentUid, db);
    } catch (e) {
      // Silent fail for read receipts
    }
  });

  // Initialize mention autocomplete
  if (_inputElement) {
    _mentionAutocomplete = createMentionAutocomplete(_inputElement, {
      getMembers: () => {
        const members = groupStore.getState().members;
        if (!members) return [];
        return Array.from(members.values()).filter(m => m.uid !== currentUid);
      }
    });
  }

  // Initialize typing indicator
  if (options.typingContainer) {
    _typingIndicator = createTypingIndicator(options.typingContainer);
  }

  // Initialize typing broadcaster
  if (_inputElement) {
    _typingBroadcaster = createTypingBroadcaster(
      () => {
        try { broadcastTyping(true); } catch(e) {}
      },
      () => {
        try { broadcastTyping(false); } catch(e) {}
      }
    );

    _inputElement.addEventListener('input', () => _typingBroadcaster?.handleInput());
  }

  // Subscribe to store changes
  groupStore.subscribe('messages', (messages) => {
    if (_scroller && messages) {
      const processed = _processMessages(messages, currentUid);
      _scroller.setItems(processed);
    }
  });

  groupStore.subscribe('typingUsers', (typingUsers) => {
    if (_typingIndicator && typingUsers) {
      const members = groupStore.getState().members;
      const names = typingUsers
        .filter(uid => uid !== currentUid)
        .map(uid => {
          const profile = members?.get(uid);
          return profile?.username || 'Someone';
        });
      _typingIndicator.update(names);
    }
  });

  groupStore.subscribe('pinnedMessages', (pinned) => {
    if (pinned && pinned.length > 0) {
      _updatePinnedBar(pinned, options);
    } else if (_pinnedBar) {
      hidePinnedBar(_pinnedBar);
    }
  });

  // Load the group chat
  await openGroupChat(groupId);

  // Load group metadata for pinned messages
  try {
    const group = await getGroup(groupId);
    if (group) {
      groupStore.setState({
        currentGroup: group,
        pinnedMessages: group.pinnedMessages || []
      });
    }
  } catch (e) {
    console.warn('[GroupChat] Failed to load group metadata:', e);
  }

  // Scroll to bottom after initial load
  requestAnimationFrame(() => {
    _scroller?.scrollToBottom(false);
  });
}

/**
 * Send a group message
 * Replaces sendGroupMessage() from chat.js.
 * 
 * @param {Object} params
 * @param {string} params.text
 * @param {Object} [params.attachment]
 * @returns {Promise<string>} Message ID
 */
async function send(params = {}) {
  // Include reply data if replying
  if (isReplying()) {
    const replyTarget = getCurrentReplyTarget();
    if (replyTarget) {
      params.replyTo = getReplyPayload(replyTarget);
    }
  }

  const msgId = await sendMessage(params);
  hideReplyPreview();

  // Scroll to bottom after sending
  requestAnimationFrame(() => {
    _scroller?.scrollToBottom(true);
  });

  return msgId;
}

/**
 * Load older messages (pagination)
 * @returns {Promise<Array>}
 */
async function loadOlder() {
  return loadOlderMessages();
}

/**
 * Close the group chat — clean up everything
 */
function close() {
  closeGroupChat();

  if (_scroller) {
    _scroller.destroy();
    _scroller = null;
  }

  if (_readObserver) {
    _readObserver.disconnect();
    _readObserver = null;
  }

  if (_mentionAutocomplete) {
    _mentionAutocomplete.destroy();
    _mentionAutocomplete = null;
  }

  if (_typingIndicator) {
    _typingIndicator.destroy();
    _typingIndicator = null;
  }

  if (_typingBroadcaster) {
    _typingBroadcaster.destroy();
    _typingBroadcaster = null;
  }

  _pinnedBar = null;
  _container = null;
  _inputElement = null;

  groupStore.resetState();
}

// ============ INTERNAL HELPERS ============

/**
 * Process raw messages into renderable items with date separators and unread dividers
 * @param {Array} messages
 * @param {string} currentUid
 * @returns {Array}
 */
function _processMessages(messages, currentUid) {
  if (!messages || messages.length === 0) return [];

  // Insert date separators
  let processed = insertDateSeparators(messages);

  // Insert unread divider
  processed = insertUnreadDivider(processed, currentUid);

  return processed;
}

/**
 * Render a single item (message, date separator, or unread divider)
 * @param {Object} item
 * @param {HTMLElement} element
 * @param {string} currentUid
 * @param {Object} options
 */
function _renderItem(item, element, currentUid, options = {}) {
  element.innerHTML = '';

  if (item.type === 'date-separator') {
    element.appendChild(createDateSeparator(item.date));
    return;
  }

  if (item.type === 'unread-divider') {
    element.appendChild(createUnreadDivider(item.count));
    return;
  }

  // Regular message
  const members = groupStore.getState().members;
  const group = groupStore.getState().currentGroup;
  const senderProfile = members?.get(item.from) || { username: 'Unknown', avatar: 'favicon.png' };
  const isOwn = item.from === currentUid;
  const senderRole = group ? getUserRole(group, item.from) : 'member';
  const totalMembers = group?.members?.length || 1;

  renderMessageBubble(item, element, {
    isOwn,
    senderName: senderProfile.username,
    senderAvatar: senderProfile.avatar,
    senderRole,
    currentUid,
    totalMembers,
    onReply: (msg) => {
      showReplyPreview(msg, senderProfile.username, () => hideReplyPreview());
      groupStore.setState({ replyingTo: msg });
      _inputElement?.focus();
    },
    onReact: (msg) => {
      const bubble = element.querySelector('.nex-msg-bubble');
      if (bubble) {
        showReactionPicker(bubble, async (emoji) => {
          try {
            await addReaction(msg.id, emoji);
          } catch (e) {
            console.error('[GroupChat] Reaction failed:', e);
          }
          hideReactionPicker();
        });
      }
    },
    onPin: async (msg) => {
      try {
        await pinMessage(groupStore.getState().currentGroupId, msg.id);
        if (options.onNotify) options.onNotify(' Message pinned', 'success');
      } catch (e) {
        if (options.onNotify) options.onNotify(e.message, 'error');
      }
    },
    onDelete: async (msg) => {
      if (confirm('Delete this message?')) {
        try {
          await deleteMessage(msg.id);
          if (options.onNotify) options.onNotify(' Message deleted', 'success');
        } catch (e) {
          if (options.onNotify) options.onNotify(e.message, 'error');
        }
      }
    },
    onCopy: (msg) => {
      navigator.clipboard.writeText(msg.text || '').catch(() => {});
      if (options.onNotify) options.onNotify(' Copied', 'success');
    },
    onQuoteClick: (messageId) => {
      _scroller?.scrollToItem(messageId);
    },
    onTickClick: async (msg) => {
      if (!msg.readBy || msg.readBy.length === 0) return;
      const readByList = msg.readBy.map(uid => {
        const profile = members?.get(uid);
        return {
          uid,
          username: profile?.username || 'Unknown',
          avatar: profile?.avatar || 'favicon.png',
          readAt: msg.readAt?.[uid] || null
        };
      });
      showReadByModal(readByList, () => {});
    },
    onReactionClick: async (emoji) => {
      try {
        await addReaction(item.id, emoji);
      } catch (e) {
        console.error('[GroupChat] Reaction toggle failed:', e);
      }
    }
  });

  // Observe for read receipts
  if (!isOwn && _readObserver) {
    element.dataset.messageId = item.id;
    _readObserver.observe(element);
  }
}

/**
 * Update the pinned messages bar
 * @param {Array} pinnedMessageIds
 * @param {Object} options
 */
function _updatePinnedBar(pinnedMessageIds, options) {
  const container = options.pinnedBarContainer || _container?.parentElement;
  if (!container) return;

  // Resolve pinned message texts from store
  const messages = groupStore.getState().messages;
  const pinnedMessages = pinnedMessageIds
    .map(id => messages.find(m => m.id === id))
    .filter(Boolean)
    .map(m => ({
      id: m.id,
      text: m.text || ' Attachment',
      senderName: getUserProfile(m.from)?.username || 'Unknown'
    }));

  if (pinnedMessages.length === 0) return;

  if (!_pinnedBar) {
    _pinnedBar = createPinnedBar(pinnedMessages, (messageId) => {
      _scroller?.scrollToItem(messageId);
    }, () => {
      hidePinnedBar(_pinnedBar);
    });
    container.insertBefore(_pinnedBar, container.firstChild);
  } else {
    updatePinnedBar(_pinnedBar, pinnedMessages, 0);
  }

  showPinnedBar(_pinnedBar);
}

/**
 * Get current user UID
 * @returns {Promise<string>}
 */
async function _getCurrentUid() {
  return auth.currentUser?.uid || '';
}

// ============ PUBLIC API ============

/**
 * GroupChat — Public API facade
 * @namespace
 */
export const GroupChat = {
  // Lifecycle
  init,
  open,
  send,
  loadOlder,
  close,

  // Group management
  createGroup,
  getGroup,
  updateGroupInfo,
  deleteGroup,

  // Member management
  addMembers,
  removeMember,
  leaveGroup,
  getGroupMembers,

  // Role management
  promoteToModerator,
  promoteToAdmin,
  demoteToMember,
  getUserRole,
  hasPermission,
  PERMISSIONS,
  getRoleLabel,
  getRoleBadgeColor,

  // Settings
  setSlowMode,
  setDisappearingMessages,
  muteMember,
  unmuteMember,
  isMemberMuted,

  // Join requests
  submitJoinRequest,
  getPendingJoinRequests,
  acceptJoinRequest,
  declineJoinRequest,

  // Pinning
  pinMessage,
  unpinMessage,

  // Messages
  addReaction,
  deleteMessage,
  editMessage,
  getUserProfile,

  // Invite
  showInviteModal,
  generateInviteLink,
  regenerateInviteLink,

  // Polls
  createPoll,
  showPollModal,

  // UI components
  showGroupCallModal,
  showReadByModal,

  // Store access
  getStore: () => groupStore,
  getState: () => groupStore.getState(),
  subscribe: (key, cb) => groupStore.subscribe(key, cb)
};

export default GroupChat;
