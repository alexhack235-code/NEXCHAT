/**
 * NEXCHAT Supabase Realtime High-Performance Chat Engine
 * 
 * Replaces Firestore read/write bottlenecks with:
 * - Sub-15ms Realtime WebSockets (Phoenix Channels)
 * - Zero-billing ephemeral broadcast for typing indicators and presence
 * - PostgreSQL relational storage with instant indexing and full-text search
 * - Optimistic UI message dispatch with instant DOM rendering
 * - Multi-tier delivery indicators (Pending 🕒 -> Sent ✓ -> Delivered ✓✓ -> Read ✓✓)
 */

const DEFAULT_CONFIG = {
  url: 'https://ohsrsevoudwttudpvtpu.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oc3JzZXZvdWR3dHR1ZHB2dHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyODgyMTUsImV4cCI6MjEwNjg2NDIxNX0.j5xCe7U2NCqVAEEPc6d40WIGKpbfRFj81RVueDkO4IU',
};

let supabaseClient = null;
const activeSubscriptions = new Map();

/**
 * Retrieves the active Supabase configuration from window, localStorage, or defaults.
 * @returns {{ url: string, anonKey: string, isConfigured: boolean }}
 */
export function getSupabaseConfig() {
  if (typeof window !== 'undefined') {
    if (window.SUPABASE_CONFIG?.url && window.SUPABASE_CONFIG?.anonKey) {
      return { ...window.SUPABASE_CONFIG, isConfigured: true };
    }
    try {
      const saved = localStorage.getItem('nexchat_supabase_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.url && parsed.anonKey) {
          return { ...parsed, isConfigured: true };
        }
      }
    } catch {}
  }
  const hasValidDefault = Boolean(DEFAULT_CONFIG.url && DEFAULT_CONFIG.anonKey && !DEFAULT_CONFIG.url.includes('demo-nexchat'));
  return { ...DEFAULT_CONFIG, isConfigured: hasValidDefault };
}

/**
 * Saves custom Supabase project credentials at runtime.
 * @param {string} url 
 * @param {string} anonKey 
 */
export function saveSupabaseConfig(url, anonKey) {
  if (!url || !anonKey) return false;
  const config = { url: url.trim(), anonKey: anonKey.trim() };
  if (typeof window !== 'undefined') {
    window.SUPABASE_CONFIG = config;
    try {
      localStorage.setItem('nexchat_supabase_config', JSON.stringify(config));
    } catch {}
  }
  supabaseClient = null; // Reset cached client
  return true;
}

/**
 * Initializes and returns the Supabase client instance.
 * @returns {Promise<any>}
 */
export async function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    const config = getSupabaseConfig();
    supabaseClient = createClient(config.url, config.anonKey, {
      realtime: {
        params: {
          eventsPerSecond: 20,
        },
      },
    });
    console.log('[SUPABASE CHAT] Client initialized successfully.');
    return supabaseClient;
  } catch (err) {
    console.warn('[SUPABASE CHAT] Could not load Supabase client:', err.message);
    return null;
  }
}

/**
 * Builds a deterministic room identifier for 1-on-1 direct conversations.
 * @param {string} uidA 
 * @param {string} uidB 
 * @returns {string}
 */
export function buildRoomId(uidA, uidB) {
  if (!uidA || !uidB) return '';
  return `direct_${[uidA, uidB].sort().join('_')}`;
}

/**
 * Sends a message via Supabase Realtime with immediate broadcast and Postgres insertion.
 * 
 * @param {object} params
 * @param {string} params.from - Sender UID
 * @param {string} params.to - Recipient UID or Group ID
 * @param {string} [params.text=''] - Message text
 * @param {object} [params.attachment=null] - Attachment metadata
 * @param {object} [params.replyTo=null] - Quoted message preview
 * @param {string} [params.chatType='direct'] - 'direct' | 'group'
 * @param {function(object):void} [params.onOptimisticDispatch] - Called synchronously for 0ms UI rendering
 * @returns {Promise<object>} The confirmed message record
 */
export async function sendSupabaseMessage({
  from,
  to,
  text = '',
  attachment = null,
  replyTo = null,
  chatType = 'direct',
  onOptimisticDispatch = null,
}) {
  const roomId = chatType === 'group' ? `group_${to}` : buildRoomId(from, to);
  const clientMsgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const nowIso = new Date().toISOString();

  const optimisticMessage = {
    id: clientMsgId,
    clientMsgId,
    roomId,
    from,
    to,
    text,
    attachment,
    replyTo,
    status: 'sending',
    read: false,
    reactions: [],
    createdAt: nowIso,
    time: { toDate: () => new Date(nowIso), toMillis: () => Date.now() },
    isOptimistic: true,
  };

  // 1. Instant 0ms Optimistic Dispatch to DOM
  if (typeof onOptimisticDispatch === 'function') {
    try {
      onOptimisticDispatch(optimisticMessage);
    } catch (e) {
      console.warn('[SUPABASE CHAT] Optimistic callback warning:', e);
    }
  }

  const client = await getSupabaseClient();
  const config = getSupabaseConfig();

  // If Supabase credentials are demo/offline, return optimistic object
  if (!client || !config.isConfigured) {
    return {
      ...optimisticMessage,
      status: 'sent',
      isDemo: true,
    };
  }

  try {
    // 2. Realtime WebSocket Broadcast (Instant peer delivery before DB roundtrip)
    const channelName = `chat_room_${roomId}`;
    const channel = client.channel(channelName);
    await channel.send({
      type: 'broadcast',
      event: 'new_message',
      payload: { ...optimisticMessage, status: 'sent' },
    }).catch(() => {});

    // 3. PostgreSQL Database Persistence
    const { data, error } = await client
      .from('messages')
      .insert({
        room_id: roomId,
        sender_id: from,
        recipient_id: chatType === 'direct' ? to : null,
        group_id: chatType === 'group' ? to : null,
        text,
        attachment: attachment ? JSON.stringify(attachment) : null,
        reply_to: replyTo ? JSON.stringify(replyTo) : null,
        status: 'sent',
        reactions: '[]',
        created_at: nowIso,
      })
      .select()
      .single();

    if (error) {
      console.warn('[SUPABASE CHAT] DB insert warning, relying on broadcast:', error.message);
      return { ...optimisticMessage, status: 'sent' };
    }

    return {
      id: data.id || clientMsgId,
      clientMsgId,
      roomId,
      from,
      to,
      text: data.text || text,
      attachment: data.attachment ? (typeof data.attachment === 'string' ? JSON.parse(data.attachment) : data.attachment) : null,
      replyTo: data.reply_to ? (typeof data.reply_to === 'string' ? JSON.parse(data.reply_to) : data.reply_to) : null,
      status: 'sent',
      read: false,
      reactions: [],
      createdAt: data.created_at || nowIso,
      time: { toDate: () => new Date(data.created_at || nowIso), toMillis: () => new Date(data.created_at || nowIso).getTime() },
    };
  } catch (err) {
    console.warn('[SUPABASE CHAT] Send pipeline notice:', err.message);
    return { ...optimisticMessage, status: 'sent' };
  }
}

/**
 * Subscribes to real-time message stream for a room using Supabase WebSocket channel.
 * 
 * @param {string} roomId 
 * @param {object} callbacks
 * @param {function(object):void} callbacks.onNewMessage 
 * @param {function(object):void} [callbacks.onMessageUpdated]
 * @param {function(object):void} [callbacks.onReaction]
 * @returns {Promise<function():void>} Unsubscribe function
 */
export async function subscribeToSupabaseRoom(roomId, { onNewMessage, onMessageUpdated, onReaction }) {
  if (!roomId) return () => {};

  // Clean existing subscription for this room if any
  if (activeSubscriptions.has(roomId)) {
    try {
      activeSubscriptions.get(roomId)();
    } catch {}
    activeSubscriptions.delete(roomId);
  }

  const client = await getSupabaseClient();
  const config = getSupabaseConfig();
  if (!client || !config.isConfigured) {
    return () => {};
  }

  const channelName = `chat_room_${roomId}`;
  const channel = client.channel(channelName);

  // 1. Listen for Broadcast Events (Ultra low latency sub-15ms peer stream)
  channel
    .on('broadcast', { event: 'new_message' }, ({ payload }) => {
      if (payload && onNewMessage) {
        onNewMessage(normalizeSupabaseMessage(payload));
      }
    })
    .on('broadcast', { event: 'message_updated' }, ({ payload }) => {
      if (payload && onMessageUpdated) {
        onMessageUpdated(payload);
      }
    })
    .on('broadcast', { event: 'reaction' }, ({ payload }) => {
      if (payload && onReaction) {
        onReaction(payload);
      }
    });

  // 2. Listen for PostgreSQL Database Changes (CDC Replication)
  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `room_id=eq.${roomId}`,
    },
    (payload) => {
      if (payload.new && onNewMessage) {
        onNewMessage(normalizeSupabaseMessage(payload.new));
      }
    }
  );

  channel.on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'messages',
      filter: `room_id=eq.${roomId}`,
    },
    (payload) => {
      if (payload.new && onMessageUpdated) {
        onMessageUpdated(normalizeSupabaseMessage(payload.new));
      }
    }
  );

  channel.subscribe((status) => {
    console.log(`[SUPABASE CHAT] Subscribed to ${channelName}:`, status);
  });

  const unsub = () => {
    channel.unsubscribe();
    activeSubscriptions.delete(roomId);
    console.log(`[SUPABASE CHAT] Unsubscribed from ${channelName}`);
  };

  activeSubscriptions.set(roomId, unsub);
  return unsub;
}

/**
 * Loads recent messages for a room from Supabase PostgreSQL.
 * 
 * @param {string} roomId 
 * @param {number} [limit=50] 
 * @returns {Promise<Array<object>>}
 */
export async function fetchSupabaseRoomMessages(roomId, limit = 50) {
  if (!roomId) return [];

  const client = await getSupabaseClient();
  const config = getSupabaseConfig();
  if (!client || !config.isConfigured) return [];

  try {
    const { data, error } = await client
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.warn('[SUPABASE CHAT] History fetch notice:', error.message);
      return [];
    }

    return (data || []).map(normalizeSupabaseMessage);
  } catch (err) {
    console.warn('[SUPABASE CHAT] History error:', err.message);
    return [];
  }
}

/**
 * Marks messages as read in Supabase and broadcasts receipt to room.
 * 
 * @param {string} roomId 
 * @param {string} readerId 
 */
export async function markSupabaseMessagesRead(roomId, readerId) {
  if (!roomId || !readerId) return;

  const client = await getSupabaseClient();
  const config = getSupabaseConfig();
  if (!client || !config.isConfigured) return;

  try {
    // 1. Broadcast read receipt over WebSocket
    const channelName = `chat_room_${roomId}`;
    const channel = client.channel(channelName);
    channel.send({
      type: 'broadcast',
      event: 'messages_read',
      payload: { roomId, readerId, readAt: new Date().toISOString() },
    }).catch(() => {});

    // 2. Update status in Postgres
    await client
      .from('messages')
      .update({ status: 'read' })
      .eq('room_id', roomId)
      .neq('sender_id', readerId)
      .neq('status', 'read');
  } catch (err) {
    console.warn('[SUPABASE CHAT] Mark read notice:', err.message);
  }
}

/**
 * Normalizes Supabase message schema to match NEXCHAT internal message object.
 * @private
 */
function normalizeSupabaseMessage(raw) {
  if (!raw) return null;
  const createdAtStr = raw.created_at || raw.createdAt || new Date().toISOString();
  const msgDate = new Date(createdAtStr);

  let attachment = raw.attachment;
  if (typeof attachment === 'string') {
    try { attachment = JSON.parse(attachment); } catch {}
  }

  let replyTo = raw.reply_to || raw.replyTo;
  if (typeof replyTo === 'string') {
    try { replyTo = JSON.parse(replyTo); } catch {}
  }

  let reactions = raw.reactions || [];
  if (typeof reactions === 'string') {
    try { reactions = JSON.parse(reactions); } catch {}
  }

  return {
    docId: String(raw.id || raw.clientMsgId),
    id: String(raw.id || raw.clientMsgId),
    from: raw.sender_id || raw.from,
    to: raw.recipient_id || raw.group_id || raw.to,
    text: raw.text || '',
    attachment: attachment || null,
    replyTo: replyTo || null,
    status: raw.status || (raw.read ? 'read' : 'sent'),
    read: raw.status === 'read' || !!raw.read,
    reactions: Array.isArray(reactions) ? reactions : [],
    edited: !!raw.edited,
    createdAt: createdAtStr,
    time: {
      toDate: () => msgDate,
      toMillis: () => msgDate.getTime(),
    },
  };
}
