/**
 * Supabase Realtime Presence & Typing Indicator Service for NEXCHAT
 * Free tier, no credit card required.
 * Handles instant user typing indicators and online presence across direct chats.
 */

// Default configuration (can be customized via window.SUPABASE_CONFIG)
const DEFAULT_SUPABASE = {
  url: window.SUPABASE_CONFIG?.url || 'https://ohsrsevoudwttudpvtpu.supabase.co',
  anonKey: window.SUPABASE_CONFIG?.anonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oc3JzZXZvdWR3dHR1ZHB2dHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyODgyMTUsImV4cCI6MjEwNjg2NDIxNX0.j5xCe7U2NCqVAEEPc6d40WIGKpbfRFj81RVueDkO4IU',
};

let supabaseClient = null;
let currentChannel = null;
let activeChatId = null;
let activeChatType = 'direct';
let currentUserId = null;
let currentUserName = null;
let typingDebounceTimer = null;

/**
 * Builds a deterministic bidirectional room name for two users or group
 */
export function buildPresenceChannelName(chatId, chatType, userId) {
  if (!chatId) return 'presence-global';
  if (chatType === 'group') {
    return `presence-group-${chatId}`;
  }
  const uids = [String(userId || ''), String(chatId || '')].sort().join('__');
  return `presence-direct-${uids}`;
}

/**
 * Dynamically loads Supabase JS from CDN ESM
 */
async function getSupabase() {
  if (supabaseClient) return supabaseClient;

  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    const config = window.SUPABASE_CONFIG || DEFAULT_SUPABASE;
    supabaseClient = createClient(config.url, config.anonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    return supabaseClient;
  } catch (err) {
    console.warn('Could not load Supabase client via CDN:', err);
    return null;
  }
}

/**
 * Initializes chat presence and listens for typing state in a room
 * 
 * @param {object} params
 * @param {string} params.chatId - Unique chat room identifier (other user UID or group ID)
 * @param {string} [params.chatType='direct'] - 'direct' or 'group'
 * @param {string} params.userId - Current user UID (myUID)
 * @param {string} params.userName - Current user username (myUsername)
 * @param {function({isTyping: boolean, user: string, from: string}):void} params.onTypingUpdate - Typing callback
 */
export async function subscribeToChatPresence({ chatId, chatType = 'direct', userId, userName, onTypingUpdate }) {
  if (!chatId) return;

  // Leave previous channel if switching chats
  if (currentChannel && (activeChatId !== chatId || activeChatType !== chatType)) {
    await unsubscribeChatPresence();
  }

  activeChatId = chatId;
  activeChatType = chatType || 'direct';
  currentUserId = userId || window.myUID || (typeof myUID !== 'undefined' ? myUID : 'anon');
  currentUserName = userName || window.myUsername || (typeof myUsername !== 'undefined' ? myUsername : 'User');

  const client = await getSupabase();
  if (!client) {
    console.log('Presence running in offline/local mode');
    return;
  }

  try {
    const channelName = buildPresenceChannelName(chatId, activeChatType, currentUserId);
    currentChannel = client.channel(channelName);

    // Listen to typing broadcast events - ONLY for other person
    currentChannel
      .on('broadcast', { event: 'typing' }, (payload) => {
        const data = payload.payload;
        if (!data) return;

        const myId = currentUserId || window.myUID || (typeof myUID !== 'undefined' ? myUID : null) || localStorage.getItem('myUID');
        const senderId = data.from || data.userId;

        // RULE 1: STRICTLY IGNORE MY OWN TYPING EVENT (Prevents self typing on own screen)
        if (senderId && myId && String(senderId).toLowerCase() === String(myId).toLowerCase()) {
          return;
        }

        // RULE 2: If directed to someone else in direct chat, ignore
        if (data.to && myId && String(data.to).toLowerCase() !== String(myId).toLowerCase() && activeChatType === 'direct') {
          return;
        }

        // RULE 3: Deliver typing event only for the other person
        if (onTypingUpdate) {
          onTypingUpdate({
            isTyping: !!data.isTyping,
            action: data.action || (data.isTyping ? 'typing' : 'idle'),
            user: data.userName || data.user || 'User',
            from: senderId,
            timestamp: data.timestamp || Date.now()
          });
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = currentChannel.presenceState();
        console.log('Presence state updated:', state);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await currentChannel.track({
            userId: currentUserId,
            userName: currentUserName,
            onlineAt: new Date().toISOString(),
          });
        }
      });
  } catch (err) {
    console.warn('Presence connection notice:', err.message);
  }
}

/**
 * Broadcasts typing status to other participants in the active chat
 * @param {boolean} isTyping
 * @param {string} [targetUid=null]
 */
export async function broadcastTyping(isTyping, targetUid = null, actionType = 'typing') {
  if (!currentChannel) return;

  const myId = currentUserId || window.myUID || (typeof myUID !== 'undefined' ? myUID : null) || localStorage.getItem('myUID') || 'anon';
  const myName = currentUserName || window.myUsername || (typeof myUsername !== 'undefined' ? myUsername : 'User');

  try {
    await currentChannel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        from: myId,
        to: targetUid || activeChatId,
        userId: myId,
        userName: myName,
        isTyping: !!isTyping,
        action: actionType || (isTyping ? 'typing' : 'idle'),
        timestamp: Date.now(),
      },
    });
  } catch (err) {
    // Non-blocking fail-safe
  }
}

/**
 * Handles typing input event with automatic 2.5s debounce to stop typing indicator
 */
export function handleUserTypingInput() {
  broadcastTyping(true);

  if (typingDebounceTimer) {
    clearTimeout(typingDebounceTimer);
  }

  typingDebounceTimer = setTimeout(() => {
    broadcastTyping(false);
  }, 2500);
}

/**
 * Unsubscribes from active presence channel
 */
export async function unsubscribeChatPresence() {
  if (typingDebounceTimer) {
    clearTimeout(typingDebounceTimer);
    typingDebounceTimer = null;
  }

  if (currentChannel) {
    try {
      broadcastTyping(false);
      await currentChannel.untrack();
      await currentChannel.unsubscribe();
    } catch {}
    currentChannel = null;
  }
  activeChatId = null;
}
