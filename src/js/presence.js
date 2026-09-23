/**
 * Supabase Realtime Presence & Typing Indicator Service for NEXCHAT
 * Free tier, no credit card required.
 * Handles instant user typing indicators and online presence across direct chats.
 */

// Default configuration (can be customized via window.SUPABASE_CONFIG)
const DEFAULT_SUPABASE = {
  url: window.SUPABASE_CONFIG?.url || 'https://demo-nexchat.supabase.co',
  anonKey: window.SUPABASE_CONFIG?.anonKey || 'public-anon-key-placeholder',
};

let supabaseClient = null;
let currentChannel = null;
let activeChatId = null;
let currentUserId = null;
let currentUserName = null;
let typingDebounceTimer = null;

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
 * @param {string} params.chatId - Unique chat room identifier
 * @param {string} params.userId - Current user UID
 * @param {string} params.userName - Current user username
 * @param {function({isTyping: boolean, user: string}):void} params.onTypingUpdate - Typing callback
 */
export async function subscribeToChatPresence({ chatId, userId, userName, onTypingUpdate }) {
  if (!chatId) return;

  // Leave previous channel if switching chats
  if (currentChannel && activeChatId !== chatId) {
    await unsubscribeChatPresence();
  }

  activeChatId = chatId;
  currentUserId = userId || 'anon';
  currentUserName = userName || 'User';

  const client = await getSupabase();
  if (!client) {
    console.log('Presence running in offline/local mode');
    return;
  }

  try {
    const channelName = `presence-chat-${chatId}`;
    currentChannel = client.channel(channelName);

    // Listen to typing broadcast events
    currentChannel
      .on('broadcast', { event: 'typing' }, (payload) => {
        const data = payload.payload;
        if (data && data.userId !== currentUserId) {
          if (onTypingUpdate) {
            onTypingUpdate({
              isTyping: !!data.isTyping,
              user: data.userName || 'User',
              userId: data.userId
            });
          }
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
 */
export async function broadcastTyping(isTyping) {
  if (!currentChannel) return;

  try {
    await currentChannel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: currentUserId,
        userName: currentUserName,
        isTyping: isTyping,
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
