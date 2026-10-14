import { openDB } from 'idb';

/**
 * GroupCache - IndexedDB persistent cache for group messages and metadata
 */

const DB_NAME = 'NEXCHAT_GroupCache';
const DB_VERSION = 1;

let dbPromise = null;

/**
 * Initializes the IndexedDB database
 * @returns {Promise<import('idb').IDBPDatabase>}
 */
export async function initCache() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
          messageStore.createIndex('groupId_timestamp', ['groupId', 'timestamp']);
        }
        if (!db.objectStoreNames.contains('groups')) {
          db.createObjectStore('groups', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('userProfiles')) {
          db.createObjectStore('userProfiles', { keyPath: 'uid' });
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Caches an array of messages
 * @param {string} groupId 
 * @param {Array<Object>} messages 
 */
export async function cacheMessages(groupId, messages) {
  if (!groupId || !Array.isArray(messages) || messages.length === 0) return;
  const db = await initCache();
  const tx = db.transaction('messages', 'readwrite');
  for (const msg of messages) {
    if (msg.id) {
      tx.store.put({ ...msg, groupId });
    }
  }
  await tx.done;
}

/**
 * Retrieves cached messages for a group
 * @param {string} groupId 
 * @param {number} [limit=50] 
 * @returns {Promise<Array<Object>>}
 */
export async function getCachedMessages(groupId, limit = 50) {
  if (!groupId) return [];
  const db = await initCache();
  const index = db.transaction('messages').store.index('groupId_timestamp');
  
  // Create a range for the specific groupId
  // We use [groupId, null] to [groupId, MAX_VALUE] to get all timestamps for this group
  const range = IDBKeyRange.bound([groupId, 0], [groupId, Infinity]);
  
  let cursor = await index.openCursor(range, 'prev'); // Ordered by timestamp desc
  const messages = [];
  
  while (cursor && messages.length < limit) {
    messages.push(cursor.value);
    cursor = await cursor.continue();
  }
  
  return messages.reverse(); // Return in chronological order
}

/**
 * Gets the oldest cached timestamp for a group
 * @param {string} groupId 
 * @returns {Promise<number|null>}
 */
export async function getOldestCachedTimestamp(groupId) {
  if (!groupId) return null;
  const db = await initCache();
  const index = db.transaction('messages').store.index('groupId_timestamp');
  const range = IDBKeyRange.bound([groupId, 0], [groupId, Infinity]);
  const cursor = await index.openCursor(range, 'next'); // Ascending order to get oldest
  
  if (cursor) {
    return cursor.value.timestamp;
  }
  return null;
}

/**
 * Caches group metadata
 * @param {Object} groupData 
 */
export async function cacheGroup(groupData) {
  if (!groupData || !groupData.id) return;
  const db = await initCache();
  await db.put('groups', groupData);
}

/**
 * Retrieves cached group metadata
 * @param {string} groupId 
 * @returns {Promise<Object|null>}
 */
export async function getCachedGroup(groupId) {
  if (!groupId) return null;
  const db = await initCache();
  return (await db.get('groups', groupId)) || null;
}

/**
 * Caches a user profile
 * @param {string} uid 
 * @param {Object} profile 
 */
export async function cacheUserProfile(uid, profile) {
  if (!uid || !profile) return;
  const db = await initCache();
  await db.put('userProfiles', { ...profile, uid });
}

/**
 * Retrieves a cached user profile
 * @param {string} uid 
 * @returns {Promise<Object|null>}
 */
export async function getCachedUserProfile(uid) {
  if (!uid) return null;
  const db = await initCache();
  return (await db.get('userProfiles', uid)) || null;
}

/**
 * Retrieves multiple cached user profiles
 * @param {Array<string>} uids 
 * @returns {Promise<Map<string, Object>>}
 */
export async function getCachedUserProfiles(uids) {
  const result = new Map();
  if (!Array.isArray(uids) || uids.length === 0) return result;
  
  const db = await initCache();
  const tx = db.transaction('userProfiles', 'readonly');
  
  await Promise.all(uids.map(async (uid) => {
    const profile = await tx.store.get(uid);
    if (profile) {
      result.set(uid, profile);
    }
  }));
  
  return result;
}

/**
 * Deletes messages older than maxAgeDays
 * @param {number} [maxAgeDays=30] 
 */
export async function pruneOldMessages(maxAgeDays = 30) {
  const cutoffTime = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000);
  const db = await initCache();
  const tx = db.transaction('messages', 'readwrite');
  const store = tx.store;
  let cursor = await store.openCursor();
  
  while (cursor) {
    if (cursor.value.timestamp < cutoffTime) {
      await cursor.delete();
    }
    cursor = await cursor.continue();
  }
  
  await tx.done;
}

/**
 * Clears all cached data for a specific group
 * @param {string} groupId 
 */
export async function clearGroupCache(groupId) {
  if (!groupId) return;
  const db = await initCache();
  
  // Clear group doc
  const groupTx = db.transaction('groups', 'readwrite');
  await groupTx.store.delete(groupId);
  
  // Clear messages
  const msgTx = db.transaction('messages', 'readwrite');
  const index = msgTx.store.index('groupId_timestamp');
  const range = IDBKeyRange.bound([groupId, 0], [groupId, Infinity]);
  let cursor = await index.openCursor(range);
  
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  
  await groupTx.done;
  await msgTx.done;
}
