import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, limitToLast, startAfter, onSnapshot,
  serverTimestamp, Timestamp, increment, arrayUnion, writeBatch
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { db, auth } from '../../../firebase-config.js';
import { groupStore } from './group-store.js';
import { cacheMessages, getCachedMessages, cacheUserProfile, getCachedUserProfiles } from './group-cache.js';
import { hasPermission, PERMISSIONS, checkSlowMode } from './group-permissions.js';
import { parseMentions } from './components/mention-autocomplete.js';

/**
 * GroupMessageService - Message sending, receiving, and pagination
 * 
 * Architecture:
 * 1. Initial load: Fetch last 40 messages (desc), reverse to asc, render
 * 2. Realtime tail: onSnapshot listener after the newest message for incoming
 * 3. Pagination: startAfter(oldestDoc) when scrolling to top
 * 4. Cache: IndexedDB write-through, instant render on revisit
 */

// Internal state
let _realtimeUnsubscribe = null;
let _userProfileCache = new Map();
const PAGE_SIZE = 40;

/**
 * Open a group chat — performs initial message load
 * 1. Check IndexedDB cache for instant render
 * 2. Fetch last 40 messages from Firestore
 * 3. Attach realtime listener for new messages
 * 
 * @param {string} groupId
 * @returns {Promise<void>}
 */
export async function openGroupChat(groupId) {
  // Clean up previous listeners
  closeGroupChat();
  
  // Reset store
  groupStore.resetState();
  groupStore.setState({
    currentGroupId: groupId,
    isLoadingMessages: true,
    hasOlderMessages: true
  });

  // 1. Try cache first for instant render
  try {
    const cached = await getCachedMessages(groupId, PAGE_SIZE);
    if (cached && cached.length > 0) {
      groupStore.setState({ messages: cached });
    }
  } catch (e) {
    console.warn('[GroupMsg] Cache read failed:', e);
  }

  // 2. Fetch from Firestore
  try {
    const q = query(
      collection(db, 'groupMessages'),
      where('groupId', '==', groupId),
      orderBy('timestamp', 'desc'),
      limit(PAGE_SIZE)
    );

    const snapshot = await getDocs(q);
    const messages = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      // Skip expired disappearing messages
      if (data.expiresAt) {
        const expiresAt = data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
        if (expiresAt <= new Date()) {
          // Delete expired message asynchronously
          deleteDoc(doc(db, 'groupMessages', docSnap.id)).catch(() => {});
          continue;
        }
      }
      messages.push({ id: docSnap.id, ...data, _docSnap: docSnap });
    }

    // Reverse to chronological order (asc)
    messages.reverse();

    // Resolve user profiles
    await _resolveUserProfiles(messages);

    // Update store
    const hasOlder = snapshot.docs.length >= PAGE_SIZE;
    const oldest = messages.length > 0 ? messages[0] : null;
    const newest = messages.length > 0 ? messages[messages.length - 1] : null;

    groupStore.setState({
      messages,
      isLoadingMessages: false,
      hasOlderMessages: hasOlder,
      oldestLoadedTimestamp: oldest?.timestamp || null,
      newestLoadedTimestamp: newest?.timestamp || null
    });

    // Cache messages
    cacheMessages(groupId, messages.map(m => ({ ...m, _docSnap: undefined }))).catch(() => {});

    // 3. Attach realtime listener for NEW messages (after the newest)
    _attachRealtimeListener(groupId, newest);

  } catch (error) {
    console.error('[GroupMsg] Initial load failed:', error);
    groupStore.setState({ isLoadingMessages: false });
  }
}

/**
 * Load older messages (pagination — called when scrolling to top)
 * Uses cursor-based pagination with startAfter.
 * 
 * @returns {Promise<Array>} The older messages loaded
 */
export async function loadOlderMessages() {
  const state = groupStore.getState();
  if (!state.currentGroupId || state.isLoadingOlder || !state.hasOlderMessages) {
    return [];
  }

  groupStore.setState({ isLoadingOlder: true });

  try {
    const groupId = state.currentGroupId;
    const oldestMessage = state.messages[0];
    
    if (!oldestMessage || !oldestMessage.timestamp) {
      groupStore.setState({ isLoadingOlder: false, hasOlderMessages: false });
      return [];
    }

    // Convert timestamp for query
    let oldestTimestamp = oldestMessage.timestamp;
    if (oldestTimestamp.toDate) {
      // Already a Firestore Timestamp
    } else if (oldestTimestamp instanceof Date) {
      oldestTimestamp = Timestamp.fromDate(oldestTimestamp);
    } else if (typeof oldestTimestamp === 'number') {
      oldestTimestamp = Timestamp.fromMillis(oldestTimestamp);
    }

    // Query messages older than the oldest loaded, in desc order
    // Then we create a Firestore query with the timestamp
    // We need a reference snapshot for startAfter - use the timestamp directly
    const q = query(
      collection(db, 'groupMessages'),
      where('groupId', '==', groupId),
      orderBy('timestamp', 'desc'),
      startAfter(oldestTimestamp),
      limit(PAGE_SIZE)
    );

    const snapshot = await getDocs(q);
    const olderMessages = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      if (data.expiresAt) {
        const expiresAt = data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
        if (expiresAt <= new Date()) {
          deleteDoc(doc(db, 'groupMessages', docSnap.id)).catch(() => {});
          continue;
        }
      }
      olderMessages.push({ id: docSnap.id, ...data });
    }

    // Reverse to chronological order
    olderMessages.reverse();

    // Resolve user profiles
    await _resolveUserProfiles(olderMessages);

    // Prepend to existing messages
    const currentMessages = groupStore.getState().messages;
    const newOldest = olderMessages.length > 0 ? olderMessages[0] : null;

    groupStore.setState({
      messages: [...olderMessages, ...currentMessages],
      isLoadingOlder: false,
      hasOlderMessages: snapshot.docs.length >= PAGE_SIZE,
      oldestLoadedTimestamp: newOldest?.timestamp || state.oldestLoadedTimestamp
    });

    // Cache
    cacheMessages(groupId, olderMessages).catch(() => {});

    return olderMessages;

  } catch (error) {
    console.error('[GroupMsg] Load older failed:', error);
    groupStore.setState({ isLoadingOlder: false });
    return [];
  }
}

/**
 * Send a group message
 * Supports: text, attachments, replies, mentions, disappearing messages, slow mode
 * 
 * @param {Object} params
 * @param {string} params.text - Message text
 * @param {Object} [params.attachment] - { downloadURL, fileName, fileType, fileSize }
 * @param {Object} [params.replyTo] - { messageId, text, senderId, senderName }
 * @returns {Promise<string>} Message document ID
 */
export async function sendMessage(params = {}) {
  const state = groupStore.getState();
  const groupId = state.currentGroupId;
  const currentUser = auth.currentUser;

  if (!groupId || !currentUser) {
    throw new Error('No active group chat or user not authenticated');
  }

  const { text, attachment, replyTo } = params;
  if ((!text || !text.trim()) && !attachment) {
    throw new Error('Message cannot be empty');
  }

  const uid = currentUser.uid;

  // Fetch group data for permission checks
  const groupDoc = await getDoc(doc(db, 'groups', groupId));
  if (!groupDoc.exists()) throw new Error('Group not found');
  const groupData = groupDoc.data();

  // Permission checks
  if (!groupData.members || !groupData.members.includes(uid)) {
    throw new Error('You are not a member of this group');
  }

  // Check suspension
  if (groupData.suspendedMembers && groupData.suspendedMembers.includes(uid)) {
    throw new Error('You are suspended from this group');
  }

  // Check mute status
  if (groupData.mutedMembers && groupData.mutedMembers[uid]) {
    const muteExpiry = groupData.mutedMembers[uid];
    const expiryDate = muteExpiry.toDate ? muteExpiry.toDate() : new Date(muteExpiry);
    if (expiryDate > new Date()) {
      throw new Error('You are muted in this group');
    }
  }

  // Check slow mode
  if (groupData.slowMode && groupData.slowMode.enabled) {
    const cooldown = state.slowModeCooldownEnd;
    if (cooldown && Date.now() < cooldown) {
      const remaining = Math.ceil((cooldown - Date.now()) / 1000);
      throw new Error(`Slow mode: wait ${remaining}s before sending again`);
    }
  }

  // Parse mentions
  const members = state.members ? Array.from(state.members.values()) : [];
  const mentionResult = parseMentions(text || '', members);

  // Build message data
  const messageData = {
    groupId,
    from: uid,
    text: mentionResult.text || '',
    timestamp: serverTimestamp(),
    edited: false,
    readBy: [uid],
    readAt: {},
    reactions: {},
    mentionedUserIds: mentionResult.mentionedUserIds || []
  };

  // Disappearing messages
  const disappearing = groupData.disappearingMessages || {};
  if (disappearing.enabled && disappearing.durationMinutes > 0) {
    messageData.expiresAt = Timestamp.fromDate(
      new Date(Date.now() + disappearing.durationMinutes * 60000)
    );
  }

  // Attachment
  if (attachment) {
    messageData.attachment = attachment;
  }

  // Reply
  if (replyTo) {
    messageData.replyTo = {
      messageId: replyTo.messageId,
      text: (replyTo.text || '').substring(0, 200),
      senderId: replyTo.senderId,
      senderName: replyTo.senderName
    };
  }

  // Optimistic UI — add to store immediately with pending state
  const optimisticId = `optimistic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const optimisticMessage = {
    id: optimisticId,
    ...messageData,
    timestamp: new Date(),
    _optimistic: true,
    _pending: true
  };

  const currentMessages = groupStore.getState().messages;
  groupStore.setState({
    messages: [...currentMessages, optimisticMessage],
    replyingTo: null // Clear reply state
  });

  // Set slow mode cooldown
  if (groupData.slowMode && groupData.slowMode.enabled) {
    groupStore.setState({
      slowModeCooldownEnd: Date.now() + (groupData.slowMode.cooldownSeconds || 30) * 1000
    });
  }

  try {
    // Write to Firestore
    const msgRef = await addDoc(collection(db, 'groupMessages'), messageData);

    // Remove optimistic and let realtime listener handle the confirmed message
    // The realtime listener will add the message with the real Firestore ID

    // Deduct token
    await updateDoc(doc(db, 'users', uid), {
      tokens: increment(-1),
      lastMessageSentAt: serverTimestamp()
    });

    // Update group lastMessage
    await updateDoc(doc(db, 'groups', groupId), {
      lastMessage: text || (attachment ? ' Attachment' : ''),
      lastMessageTime: serverTimestamp()
    });

    // Log activity (non-blocking)
    addDoc(collection(db, 'messageActivity'), {
      senderId: uid,
      type: 'group_message',
      groupId,
      messageLength: (text || '').length,
      cost: 1,
      timestamp: serverTimestamp()
    }).catch(() => {});

    return msgRef.id;

  } catch (error) {
    // Remove optimistic message on failure
    const msgs = groupStore.getState().messages.filter(m => m.id !== optimisticId);
    groupStore.setState({ messages: msgs });
    throw error;
  }
}

/**
 * Add a reaction to a message
 * @param {string} messageId
 * @param {string} emoji
 * @returns {Promise<void>}
 */
export async function addReaction(messageId, emoji) {
  const uid = auth.currentUser?.uid;
  if (!uid || !messageId || !emoji) return;

  const msgRef = doc(db, 'groupMessages', messageId);
  const msgSnap = await getDoc(msgRef);
  if (!msgSnap.exists()) return;

  const reactions = msgSnap.data().reactions || {};
  const emojiVoters = reactions[emoji] || [];

  if (emojiVoters.includes(uid)) {
    // Remove reaction
    await updateDoc(msgRef, {
      [`reactions.${emoji}`]: arrayUnion(uid) // Firestore doesn't have arrayRemove for nested - use full update
    });
    // Actually we need to handle this differently for nested maps
    const updatedReactions = { ...reactions };
    updatedReactions[emoji] = emojiVoters.filter(u => u !== uid);
    if (updatedReactions[emoji].length === 0) {
      delete updatedReactions[emoji];
    }
    await updateDoc(msgRef, { reactions: updatedReactions });
  } else {
    // Add reaction
    const updatedReactions = { ...reactions };
    updatedReactions[emoji] = [...emojiVoters, uid];
    await updateDoc(msgRef, { reactions: updatedReactions });
  }
}

/**
 * Delete a message
 * @param {string} messageId
 * @returns {Promise<void>}
 */
export async function deleteMessage(messageId) {
  const uid = auth.currentUser?.uid;
  if (!uid || !messageId) return;

  const state = groupStore.getState();
  const groupId = state.currentGroupId;

  // Check permission
  const msgSnap = await getDoc(doc(db, 'groupMessages', messageId));
  if (!msgSnap.exists()) return;

  const msgData = msgSnap.data();
  const isOwn = msgData.from === uid;

  if (!isOwn) {
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    if (!groupDoc.exists()) return;
    if (!hasPermission(groupDoc.data(), uid, PERMISSIONS.DELETE_ANY_MESSAGE)) {
      throw new Error('You do not have permission to delete this message');
    }
  }

  await deleteDoc(doc(db, 'groupMessages', messageId));
}

/**
 * Edit a message
 * @param {string} messageId
 * @param {string} newText
 * @returns {Promise<void>}
 */
export async function editMessage(messageId, newText) {
  const uid = auth.currentUser?.uid;
  if (!uid || !messageId) return;

  const msgRef = doc(db, 'groupMessages', messageId);
  const msgSnap = await getDoc(msgRef);
  if (!msgSnap.exists()) return;

  if (msgSnap.data().from !== uid) {
    throw new Error('You can only edit your own messages');
  }

  await updateDoc(msgRef, {
    text: newText.trim(),
    edited: true,
    editedAt: serverTimestamp()
  });
}

/**
 * Close the group chat — clean up listeners
 */
export function closeGroupChat() {
  if (_realtimeUnsubscribe) {
    _realtimeUnsubscribe();
    _realtimeUnsubscribe = null;
  }
}

// ============ INTERNAL HELPERS ============

/**
 * Attach realtime onSnapshot listener for new incoming messages
 * Listens only for messages AFTER the newest loaded message.
 * @param {string} groupId
 * @param {Object|null} newestMessage
 */
function _attachRealtimeListener(groupId, newestMessage) {
  if (_realtimeUnsubscribe) {
    _realtimeUnsubscribe();
  }

  let q;
  if (newestMessage && newestMessage.timestamp) {
    let ts = newestMessage.timestamp;
    if (ts instanceof Date) ts = Timestamp.fromDate(ts);
    
    q = query(
      collection(db, 'groupMessages'),
      where('groupId', '==', groupId),
      orderBy('timestamp', 'asc'),
      startAfter(ts)
    );
  } else {
    q = query(
      collection(db, 'groupMessages'),
      where('groupId', '==', groupId),
      orderBy('timestamp', 'asc')
    );
  }

  _realtimeUnsubscribe = onSnapshot(q, async (snapshot) => {
    const currentState = groupStore.getState();
    if (currentState.currentGroupId !== groupId) return;

    const changes = snapshot.docChanges();
    let messages = [...currentState.messages];
    let changed = false;

    for (const change of changes) {
      const data = change.doc.data();
      const msgId = change.doc.id;

      // Skip expired
      if (data.expiresAt) {
        const exp = data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
        if (exp <= new Date()) {
          deleteDoc(doc(db, 'groupMessages', msgId)).catch(() => {});
          continue;
        }
      }

      if (change.type === 'added') {
        // Check for duplicates and optimistic messages
        const existingIdx = messages.findIndex(m => m.id === msgId);
        const optimisticIdx = messages.findIndex(m =>
          m._optimistic && m.from === data.from && m.text === data.text
        );

        if (existingIdx >= 0) {
          // Update existing
          messages[existingIdx] = { id: msgId, ...data };
        } else if (optimisticIdx >= 0) {
          // Replace optimistic with confirmed
          messages[optimisticIdx] = { id: msgId, ...data };
        } else {
          // New message
          messages.push({ id: msgId, ...data });
        }
        changed = true;
      } else if (change.type === 'modified') {
        const idx = messages.findIndex(m => m.id === msgId);
        if (idx >= 0) {
          messages[idx] = { id: msgId, ...data };
          changed = true;
        }
      } else if (change.type === 'removed') {
        messages = messages.filter(m => m.id !== msgId);
        changed = true;
      }
    }

    if (changed) {
      // Sort by timestamp
      messages.sort((a, b) => {
        const tA = _getTimestampMs(a.timestamp);
        const tB = _getTimestampMs(b.timestamp);
        return tA - tB;
      });

      // Resolve new user profiles
      await _resolveUserProfiles(messages);

      groupStore.setState({ messages });

      // Cache
      const last40 = messages.slice(-PAGE_SIZE);
      cacheMessages(groupId, last40.map(m => ({ ...m, _docSnap: undefined, _optimistic: undefined }))).catch(() => {});
    }
  }, (error) => {
    console.error('[GroupMsg] Realtime listener error:', error);
  });
}

/**
 * Resolve user profiles for message senders
 * Uses in-memory cache + IndexedDB cache + Firestore fallback
 * @param {Array} messages
 */
async function _resolveUserProfiles(messages) {
  const unknownUids = new Set();

  for (const msg of messages) {
    if (msg.from && !_userProfileCache.has(msg.from)) {
      unknownUids.add(msg.from);
    }
  }

  if (unknownUids.size === 0) return;

  // Try IndexedDB cache first
  const uidsArray = Array.from(unknownUids);
  try {
    const cached = await getCachedUserProfiles(uidsArray);
    for (const [uid, profile] of Object.entries(cached)) {
      if (profile) {
        _userProfileCache.set(uid, profile);
        unknownUids.delete(uid);
      }
    }
  } catch (e) {
    // Ignore cache failures
  }

  // Fetch remaining from Firestore
  for (const uid of unknownUids) {
    if (uid === 'group_defense_bot') {
      _userProfileCache.set(uid, { username: 'Group Defense Bot', avatar: 'favicon.png' });
      continue;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const profile = {
          uid,
          username: data.username || data.name || data.email || 'Unknown',
          avatar: data.profilePicUrl || data.profilePic || data.photoURL || 'favicon.png',
          email: data.email || ''
        };
        _userProfileCache.set(uid, profile);
        // Cache to IndexedDB
        cacheUserProfile(uid, profile).catch(() => {});
      } else {
        _userProfileCache.set(uid, { uid, username: 'Unknown User', avatar: 'favicon.png' });
      }
    } catch (e) {
      _userProfileCache.set(uid, { uid, username: 'Unknown User', avatar: 'favicon.png' });
    }
  }

  // Update store members map
  groupStore.setState({ members: new Map(_userProfileCache) });
}

/**
 * Get timestamp as milliseconds for sorting
 * @param {*} ts
 * @returns {number}
 */
function _getTimestampMs(ts) {
  if (!ts) return 0;
  if (ts.toMillis) return ts.toMillis();
  if (ts.toDate) return ts.toDate().getTime();
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === 'number') return ts;
  return 0;
}

/**
 * Get resolved user profile from cache
 * @param {string} uid
 * @returns {Object|null}
 */
export function getUserProfile(uid) {
  return _userProfileCache.get(uid) || null;
}
