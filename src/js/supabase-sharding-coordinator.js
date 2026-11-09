/**
 * NEXCHAT Supabase 8-Project Sharding Coordinator
 * 
 * Architecture:
 * - 4 Accounts x 2 Projects = 8 Projects (1,600 Concurrent Realtime Connections)
 * - Account 1: Project 1 (nexchat-main: Auth, Profiles, Groups, Shard Registry, Group->Shard Router)
 *             Project 2 (nexchat-chat-1: Messages for shard 1)
 * - Account 2: Project 3 (nexchat-chat-2), Project 4 (nexchat-chat-3)
 * - Account 3: Project 5 (nexchat-chat-4), Project 6 (nexchat-chat-5)
 * - Account 4: Project 7 (nexchat-chat-6), Project 8 (nexchat-chat-7)
 */

import { getActiveSupabaseSettings } from './supabase-config.js';

// Cache of initialized Supabase client instances per shard
const shardClientsCache = new Map();
let mainClient = null;

// Local in-memory cache of group -> shard mappings to avoid redundant round-trips
const groupShardRouteCache = new Map();

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
 * Resolves the shard configuration (name, url, anonKey) for a specific group.
 * Asks nexchat-main where this group's messages live.
 * 
 * @param {string} groupId 
 * @returns {Promise<{ shardName: string, url: string, anonKey: string } | null>}
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

    // 2. Direct fallback query if RPC is not installed yet
    const { data: mapping, error: mapErr } = await main
      .from('group_shards')
      .select('shard_name, shards(name, account_label, url, anon_key)')
      .eq('group_id', groupId)
      .single();

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
  } catch (err) {
    console.error(`[SHARDING] Error resolving shard for group ${groupId}:`, err);
  }

  return null;
}

/**
 * Gets or initializes a Supabase client for a specific shard (nexchat-chat-1 ... 7).
 * Reuses the existing client instance to stay well within the 200 Realtime connections cap.
 * 
 * @param {string} shardName 
 * @param {string} shardUrl 
 * @param {string} shardAnonKey 
 * @returns {Promise<any>}
 */
export async function getShardClient(shardName, shardUrl, shardAnonKey) {
  if (!shardName) return null;

  if (shardClientsCache.has(shardName)) {
    return shardClientsCache.get(shardName);
  }

  // If URL/Key were not provided directly, look them up from nexchat-main's shards registry
  if (!shardUrl || !shardAnonKey) {
    const main = await getMainClient();
    if (main) {
      const { data } = await main.from('shards').select('url, anon_key').eq('name', shardName).single();
      if (data) {
        shardUrl = data.url;
        shardAnonKey = data.anon_key;
      }
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
