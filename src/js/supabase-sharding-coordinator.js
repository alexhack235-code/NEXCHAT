/**
 * NEXCHAT Supabase 8-Project Sharding Coordinator
 * 
 * Architecture:
 * - 4 Accounts x 2 Projects = 8 Projects (1,600 Concurrent Realtime Connections)
 * - Account 1: Project 1 (nexchat-main: Auth, Profiles, Groups, Shard Registry, Group->Shard Router)
 *             Project 2 (nexchat-chat-1: Messages for shard 1, eu-central-1)
 * - Account 2: Project 3 (nexchat-chat-2: eu-west-1), Project 4 (nexchat-chat-3: eu-west-1)
 * - Account 3: Project 5 (nexchat-chat-4: ap-northeast-1 Tokyo), Project 6 (nexchat-chat-5: ap-northeast-1 Tokyo)
 * - Account 4: Project 7 (nexchat-chat-6: us-west-2 Oregon), Project 8 (nexchat-chat-7: us-west-2 Oregon)
 */

import { getActiveSupabaseSettings } from './supabase-config.js';

// Cache of initialized Supabase client instances per shard
const shardClientsCache = new Map();
let mainClient = null;

// Local in-memory cache of group -> shard mappings to avoid redundant round-trips
const groupShardRouteCache = new Map();
const directShardRouteCache = new Map();
let cachedShardsList = null;

/**
 * Initializes and returns the Supabase client for the MAIN project (nexchat-main).
 * @returns {Promise<any>}
 */
export async function getMainClient() {
  if (mainClient) return mainClient;

  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    const settings = getActiveSupabaseSettings();
    mainClient = createClient(settings.url, settings.anonKey, {
      realtime: { params: { eventsPerSecond: 20 } },
    });
    return mainClient;
  } catch (err) {
    console.error('[SHARDING] Failed to initialize nexchat-main client:', err);
    return null;
  }
}

/**
 * Fetches and caches the active message shards registered in nexchat-main.
 * @param {boolean} [forceRefresh=false]
 * @returns {Promise<Array<object>>}
 */
export async function getAllShards(forceRefresh = false) {
  if (!forceRefresh && cachedShardsList && cachedShardsList.length > 0) {
    return cachedShardsList;
  }

  const main = await getMainClient();
  if (!main) return [];

  try {
    const { data, error } = await main
      .from('shards')
      .select('name, account_label, url, anon_key, status, active_groups_count')
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (!error && data && data.length > 0) {
      cachedShardsList = data;
      return cachedShardsList;
    }
  } catch (err) {
    console.warn('[SHARDING] Notice loading shards list from main registry:', err.message);
  }

  return cachedShardsList || [];
}

/**
 * Resolves the shard configuration (name, url, anonKey) for a specific group.
 * Asks nexchat-main where this group's messages live, or auto-allocates to the least loaded shard.
 * 
 * @param {string} groupId 
 * @returns {Promise<{ shardName: string, accountLabel: string, url: string, anonKey: string } | null>}
 */
export async function getShardForGroup(groupId) {
  if (!groupId) return null;

  // Check in-memory route cache first
  if (groupShardRouteCache.has(groupId)) {
    return groupShardRouteCache.get(groupId);
  }

  const main = await getMainClient();
  if (!main) return null;

  try {
    // 1. Try fast RPC function
    const { data, error } = await main.rpc('get_group_shard', { p_group_id: groupId });
    if (!error && data && data.length > 0) {
      const route = {
        groupId: data[0].group_id,
        shardName: data[0].shard_name,
        accountLabel: data[0].account_label,
        url: data[0].url,
        anonKey: data[0].anon_key,
      };
      groupShardRouteCache.set(groupId, route);
      return route;
    }

    // 2. Direct fallback query on group_shards
    const { data: mapping, error: mapErr } = await main
      .from('group_shards')
      .select('shard_name, shards(name, account_label, url, anon_key)')
      .eq('group_id', groupId)
      .maybeSingle();

    if (!mapErr && mapping?.shards) {
      const route = {
        groupId,
        shardName: mapping.shard_name,
        accountLabel: mapping.shards.account_label,
        url: mapping.shards.url,
        anonKey: mapping.shards.anon_key,
      };
      groupShardRouteCache.set(groupId, route);
      return route;
    }

    // 3. Auto-allocate shard if this group isn't routed yet
    const shards = await getAllShards();
    if (shards && shards.length > 0) {
      const sorted = [...shards].sort((a, b) => (a.active_groups_count || 0) - (b.active_groups_count || 0));
      const chosen = sorted[0];

      const route = {
        groupId,
        shardName: chosen.name,
        accountLabel: chosen.account_label,
        url: chosen.url,
        anonKey: chosen.anon_key,
      };
      groupShardRouteCache.set(groupId, route);

      // Persist allocation in background
      main.from('group_shards').upsert({
        group_id: groupId,
        shard_name: chosen.name,
        allocated_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
      }, { onConflict: 'group_id' }).catch(() => {});

      return route;
    }
  } catch (err) {
    console.error(`[SHARDING] Error resolving shard for group ${groupId}:`, err);
  }

  return null;
}

/**
 * Deterministic hash of string for O(1) direct chat load-balancing.
 * @param {string} str 
 * @returns {number}
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

/**
 * Resolves the shard configuration for a 1-on-1 direct chat room.
 * Uses deterministic hashing across all 7 shards for uniform load distribution.
 * 
 * @param {string} roomId 
 * @returns {Promise<{ shardName: string, accountLabel: string, url: string, anonKey: string } | null>}
 */
export async function getShardForDirectChat(roomId) {
  if (!roomId) return null;

  if (directShardRouteCache.has(roomId)) {
    return directShardRouteCache.get(roomId);
  }

  const shards = await getAllShards();
  if (!shards || shards.length === 0) return null;

  const index = Math.abs(hashString(roomId)) % shards.length;
  const chosen = shards[index];

  const route = {
    roomId,
    shardName: chosen.name,
    accountLabel: chosen.account_label,
    url: chosen.url,
    anonKey: chosen.anon_key,
  };

  directShardRouteCache.set(roomId, route);
  return route;
}

/**
 * Universal shard resolver for any room (group or direct).
 * 
 * @param {string} roomId 
 * @returns {Promise<{ shardName: string, accountLabel: string, url: string, anonKey: string } | null>}
 */
export async function getShardForRoom(roomId) {
  if (!roomId) return null;
  if (roomId.startsWith('group_')) {
    return getShardForGroup(roomId.replace(/^group_/, ''));
  }
  return getShardForDirectChat(roomId);
}

/**
 * Gets or initializes a Supabase client for a specific shard (nexchat-chat-1 ... 7).
 * Reuses the existing client instance to stay well within the 200 Realtime connections cap.
 * 
 * @param {string} shardName 
 * @param {string} [shardUrl] 
 * @param {string} [shardAnonKey] 
 * @returns {Promise<any>}
 */
export async function getShardClient(shardName, shardUrl, shardAnonKey) {
  if (!shardName) return null;

  if (shardClientsCache.has(shardName)) {
    return shardClientsCache.get(shardName);
  }

  // If URL/Key were not provided directly, look them up from cache or nexchat-main
  if (!shardUrl || !shardAnonKey) {
    const shards = await getAllShards();
    const found = shards.find(s => s.name === shardName);
    if (found) {
      shardUrl = found.url;
      shardAnonKey = found.anon_key;
    }
  }

  if (!shardUrl || !shardAnonKey) {
    console.error(`[SHARDING] Missing credentials for shard: ${shardName}`);
    return null;
  }

  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    const client = createClient(shardUrl, shardAnonKey, {
      realtime: { params: { eventsPerSecond: 20 } },
    });
    shardClientsCache.set(shardName, client);
    console.log(`[SHARDING] Connected to Shard: ${shardName} (${shardUrl})`);
    return client;
  } catch (err) {
    console.error(`[SHARDING] Could not connect to shard ${shardName}:`, err);
    return null;
  }
}

/**
 * Sends a message to a group by dynamically routing to its designated chat shard.
 * 
 * @param {string} groupId 
 * @param {object} messageData 
 * @returns {Promise<{ success: boolean, messageId?: string, shard?: string, error?: any }>}
 */
export async function sendShardedGroupMessage(groupId, messageData) {
  const route = await getShardForGroup(groupId);
  if (!route) {
    return { success: false, error: 'Could not resolve shard for group' };
  }

  const shardClient = await getShardClient(route.shardName, route.url, route.anonKey);
  if (!shardClient) {
    return { success: false, error: `Failed to connect to chat shard: ${route.shardName}` };
  }

  try {
    const payload = {
      room_id: `group_${groupId}`,
      group_id: groupId,
      sender_id: messageData.senderId || messageData.from,
      sender_name: messageData.senderName || '',
      sender_avatar: messageData.senderAvatar || 'logo.jpg',
      text: messageData.text || '',
      attachment: messageData.attachment || null,
      reply_to: messageData.replyTo || null,
      status: 'sent',
      reactions: [],
      read_by: [messageData.senderId || messageData.from],
      created_at: new Date().toISOString()
    };

    const { data, error } = await shardClient
      .from('messages')
      .insert([payload])
      .select('id')
      .single();

    if (error) throw error;

    return { success: true, messageId: data.id, shard: route.shardName };
  } catch (err) {
    console.error(`[SHARDING] Error writing message to ${route.shardName}:`, err);
    return { success: false, error: err.message || err };
  }
}

/**
 * Subscribes to real-time messages for a group on its designated chat shard.
 * 
 * @param {string} groupId 
 * @param {function} onMessage 
 * @returns {Promise<{ unsubscribe: function } | null>}
 */
export async function subscribeToShardedGroup(groupId, onMessage) {
  const route = await getShardForGroup(groupId);
  if (!route) return null;

  const shardClient = await getShardClient(route.shardName, route.url, route.anonKey);
  if (!shardClient) return null;

  const channelName = `group_realtime_${groupId}`;
  const channel = shardClient
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `group_id=eq.${groupId}`
      },
      (payload) => {
        if (typeof onMessage === 'function') {
          onMessage(payload.new);
        }
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      shardClient.removeChannel(channel);
    }
  };
}

/**
 * Returns current health and connection statistics across all 8 Supabase projects.
 * @returns {Promise<object>}
 */
export async function getShardStats() {
  const shards = await getAllShards();
  return {
    architecture: '4 Accounts x 2 Projects = 8 Supabase Projects (1,600 Realtime Connections)',
    mainProject: getActiveSupabaseSettings().url,
    totalShards: shards.length,
    activeShards: shards.map(s => ({
      name: s.name,
      account: s.account_label,
      url: s.url,
      connected: shardClientsCache.has(s.name)
    }))
  };
}
