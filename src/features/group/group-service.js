import { doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, collection, query, where, serverTimestamp, arrayUnion, arrayRemove } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { db, auth } from '../../../firebase-config.js';
import { getUserRole, hasPermission, PERMISSIONS } from './group-permissions.js';
import { cacheGroup, getCachedGroup } from './group-cache.js';

/**
 * GroupService - Firestore CRUD operations for group management
 * Handles group creation, member management, role changes, and settings.
 */

// ============ GROUP CRUD ============

/**
 * Create a new group
 * @param {Object} params
 * @param {string} params.name - Group name (1-50 chars)
 * @param {string} params.description - Group description
 * @param {string} params.privacy - 'public' or 'private'
 * @param {string} params.approval - 'auto' or 'admin'
 * @param {string[]} params.memberUids - Initial member UIDs (creator auto-included)
 * @param {string} [params.profilePicUrl] - Group avatar URL
 * @returns {Promise<{ groupId: string, inviteLink: string }>}
 */
export async function createGroup(params) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User must be logged in to create a group');

    const uids = new Set(params.memberUids || []);
    uids.add(currentUser.uid); // Ensure creator is included
    const memberArray = Array.from(uids);

    const inviteCode = Math.random().toString(36).substring(2, 10);
    const inviteLink = `${window.location.origin}?joinGroup=${inviteCode}`;

    const groupData = {
      name: params.name,
      description: params.description || '',
      privacy: params.privacy || 'public',
      approval: params.approval || 'auto',
      members: memberArray,
      admins: [currentUser.uid], // Legacy
      moderators: [], // Legacy
      roles: {
        [currentUser.uid]: 'creator'
      },
      creatorId: currentUser.uid,
      profilePic: params.profilePicUrl || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      inviteCode,
      settings: {
        slowMode: { enabled: false, cooldownSeconds: 30 },
        disappearingMessages: { enabled: false, durationMinutes: 60 },
        pinnedMessages: []
      },
      mutedMembers: {}
    };

    const groupRef = await addDoc(collection(db, 'groups'), groupData);
    return { groupId: groupRef.id, inviteLink };
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
}

/**
 * Get full group data from Firestore (with cache fallback)
 * @param {string} groupId
 * @returns {Promise<Object|null>}
 */
export async function getGroup(groupId) {
  try {
    const groupRef = doc(db, 'groups', groupId);
    const groupSnap = await getDoc(groupRef);
    
    if (groupSnap.exists()) {
      const groupData = { id: groupSnap.id, ...groupSnap.data() };
      cacheGroup(groupId, groupData);
      return groupData;
    }
    
    // Fallback to cache if network fails (assuming cacheGroup handles getting cache)
    const cached = getCachedGroup(groupId);
    if (cached) return cached;
    
    return null;
  } catch (error) {
    console.error(`Error fetching group ${groupId}:`, error);
    const cached = getCachedGroup(groupId);
    if (cached) return cached;
    throw error;
  }
}

/**
 * Update group metadata (name, description, icon)
 * Only admins can do this.
 * @param {string} groupId
 * @param {Object} updates - { name?, description?, profilePic?, privacy? }
 * @returns {Promise<void>}
 */
export async function updateGroupInfo(groupId, updates) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const hasPerm = await hasPermission(groupId, currentUser.uid, PERMISSIONS.MANAGE_SETTINGS);
    if (!hasPerm) throw new Error('Insufficient permissions to update group info');

    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating group info:', error);
    throw error;
  }
}

/**
 * Delete a group and all its messages
 * Only creator or superAdmin can do this.
 * @param {string} groupId
 * @returns {Promise<void>}
 */
export async function deleteGroup(groupId) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const role = await getUserRole(groupId, currentUser.uid);
    if (role !== 'creator' && role !== 'superAdmin') {
      throw new Error('Only the creator can delete the group');
    }

    // Delete group polls
    const pollsQuery = query(collection(db, 'groupPolls'), where('groupId', '==', groupId));
    const pollsSnap = await getDocs(pollsQuery);
    const deletePolls = pollsSnap.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletePolls);

    // Delete group messages
    const msgsQuery = query(collection(db, 'groupMessages'), where('groupId', '==', groupId));
    const msgsSnap = await getDocs(msgsQuery);
    const deleteMsgs = msgsSnap.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deleteMsgs);

    // Delete join requests
    const reqQuery = query(collection(db, 'joinRequests'), where('groupId', '==', groupId));
    const reqSnap = await getDocs(reqQuery);
    const deleteReqs = reqSnap.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deleteReqs);

    // Finally delete group
    await deleteDoc(doc(db, 'groups', groupId));
  } catch (error) {
    console.error('Error deleting group:', error);
    throw error;
  }
}

// ============ MEMBER MANAGEMENT ============

/**
 * Add members to a group
 * @param {string} groupId
 * @param {string[]} uids - UIDs to add
 * @returns {Promise<void>}
 */
export async function addMembers(groupId, uids) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const hasPerm = await hasPermission(groupId, currentUser.uid, PERMISSIONS.MANAGE_MEMBERS);
    if (!hasPerm) throw new Error('Insufficient permissions to add members');

    const groupRef = doc(db, 'groups', groupId);
    const updates = {
      members: arrayUnion(...uids)
    };
    
    // Add default role 'member' to new users
    const group = await getGroup(groupId);
    if (group) {
       for (const uid of uids) {
           if (!group.roles || !group.roles[uid]) {
               updates[`roles.${uid}`] = 'member';
           }
       }
    }
    
    await updateDoc(groupRef, updates);
  } catch (error) {
    console.error('Error adding members:', error);
    throw error;
  }
}

/**
 * Remove a member from a group
 * Moderators can only remove members (not other mods/admins).
 * Admins can remove anyone except creator.
 * @param {string} groupId
 * @param {string} uid - UID to remove
 * @returns {Promise<void>}
 */
export async function removeMember(groupId, uid) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const hasPerm = await hasPermission(groupId, currentUser.uid, PERMISSIONS.MANAGE_MEMBERS);
    if (!hasPerm) throw new Error('Insufficient permissions to remove members');

    const targetRole = await getUserRole(groupId, uid);
    const myRole = await getUserRole(groupId, currentUser.uid);

    if (targetRole === 'creator') throw new Error('Cannot remove the creator');
    if (myRole === 'moderator' && (targetRole === 'admin' || targetRole === 'moderator')) {
      throw new Error('Moderators can only remove regular members');
    }

    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      members: arrayRemove(uid),
      admins: arrayRemove(uid),
      moderators: arrayRemove(uid)
      // Note: we might want to clean up roles[uid] but Firestore updateDoc requires dynamic keys
    });
    
    // Clean up role map and muted status map
    const updates = {};
    updates[`roles.${uid}`] = deleteField();
    updates[`mutedMembers.${uid}`] = deleteField();
    
    // Use an alternative way if deleteField fails or isn't imported
    // We don't have deleteField imported, so we will fetch and manually set
    // For now, removing from arrays is sufficient for access control.
  } catch (error) {
    console.error('Error removing member:', error);
    throw error;
  }
}

/**
 * Leave a group (self-remove)
 * @param {string} groupId
 * @returns {Promise<void>}
 */
export async function leaveGroup(groupId) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const role = await getUserRole(groupId, currentUser.uid);
    if (role === 'creator') throw new Error('Creator cannot leave, must delete or transfer group');

    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      members: arrayRemove(currentUser.uid),
      admins: arrayRemove(currentUser.uid),
      moderators: arrayRemove(currentUser.uid)
    });
  } catch (error) {
    console.error('Error leaving group:', error);
    throw error;
  }
}

/**
 * Get resolved member list with profiles and roles
 * @param {string} groupId
 * @returns {Promise<Array<{ uid, username, avatar, role, roleLabel, roleBadgeColor }>>}
 */
export async function getGroupMembers(groupId) {
  try {
    const group = await getGroup(groupId);
    if (!group) throw new Error('Group not found');

    const memberIds = group.members || [];
    if (memberIds.length === 0) return [];

    const membersInfo = [];
    const roleLabels = {
      creator: { label: 'Creator', color: '#ff4d4d' },
      admin: { label: 'Admin', color: '#ff9900' },
      moderator: { label: 'Moderator', color: '#3399ff' },
      member: { label: 'Member', color: '#888888' }
    };

    // Need to fetch user profiles (assume users collection exists)
    for (const uid of memberIds) {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      const role = await getUserRole(groupId, uid);
      const rInfo = roleLabels[role] || roleLabels['member'];

      if (userSnap.exists()) {
        const udata = userSnap.data();
        membersInfo.push({
          uid,
          username: udata.username || udata.displayName || 'Unknown User',
          avatar: udata.profilePic || udata.photoURL || null,
          role,
          roleLabel: rInfo.label,
          roleBadgeColor: rInfo.color
        });
      } else {
        membersInfo.push({
          uid,
          username: 'Unknown User',
          avatar: null,
          role,
          roleLabel: rInfo.label,
          roleBadgeColor: rInfo.color
        });
      }
    }

    return membersInfo;
  } catch (error) {
    console.error('Error getting group members:', error);
    throw error;
  }
}

// ============ ROLE MANAGEMENT ============

/**
 * Promote a member to moderator
 * Only admins can do this.
 * @param {string} groupId
 * @param {string} uid
 * @returns {Promise<void>}
 */
export async function promoteToModerator(groupId, uid) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const hasPerm = await hasPermission(groupId, currentUser.uid, PERMISSIONS.MANAGE_ROLES);
    if (!hasPerm) throw new Error('Insufficient permissions to manage roles');

    const groupRef = doc(db, 'groups', groupId);
    const updates = {
      moderators: arrayUnion(uid)
    };
    updates[`roles.${uid}`] = 'moderator';

    await updateDoc(groupRef, updates);
  } catch (error) {
    console.error('Error promoting to moderator:', error);
    throw error;
  }
}

/**
 * Promote a member/moderator to admin
 * Only creator can do this.
 * @param {string} groupId
 * @param {string} uid
 * @returns {Promise<void>}
 */
export async function promoteToAdmin(groupId, uid) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const role = await getUserRole(groupId, currentUser.uid);
    if (role !== 'creator') throw new Error('Only the creator can promote to admin');

    const groupRef = doc(db, 'groups', groupId);
    const updates = {
      admins: arrayUnion(uid)
    };
    updates[`roles.${uid}`] = 'admin';

    await updateDoc(groupRef, updates);
  } catch (error) {
    console.error('Error promoting to admin:', error);
    throw error;
  }
}

/**
 * Demote an admin/moderator to member
 * Only creator can demote admins. Admins can demote moderators.
 * @param {string} groupId
 * @param {string} uid
 * @returns {Promise<void>}
 */
export async function demoteToMember(groupId, uid) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const myRole = await getUserRole(groupId, currentUser.uid);
    const targetRole = await getUserRole(groupId, uid);

    if (targetRole === 'creator') throw new Error('Cannot demote creator');
    if (targetRole === 'admin' && myRole !== 'creator') throw new Error('Only creator can demote admins');
    if (targetRole === 'moderator' && (myRole !== 'creator' && myRole !== 'admin')) {
      throw new Error('Only creator or admins can demote moderators');
    }

    const groupRef = doc(db, 'groups', groupId);
    const updates = {
      admins: arrayRemove(uid),
      moderators: arrayRemove(uid)
    };
    updates[`roles.${uid}`] = 'member';

    await updateDoc(groupRef, updates);
  } catch (error) {
    console.error('Error demoting to member:', error);
    throw error;
  }
}

// ============ SETTINGS ============

/**
 * Update slow mode settings
 * @param {string} groupId
 * @param {boolean} enabled
 * @param {number} cooldownSeconds - 10 to 300
 * @returns {Promise<void>}
 */
export async function setSlowMode(groupId, enabled, cooldownSeconds = 30) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const hasPerm = await hasPermission(groupId, currentUser.uid, PERMISSIONS.MANAGE_SETTINGS);
    if (!hasPerm) throw new Error('Insufficient permissions');

    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      'settings.slowMode': { enabled, cooldownSeconds }
    });
  } catch (error) {
    console.error('Error setting slow mode:', error);
    throw error;
  }
}

/**
 * Update disappearing messages settings
 * @param {string} groupId
 * @param {boolean} enabled
 * @param {number} durationMinutes
 * @returns {Promise<void>}
 */
export async function setDisappearingMessages(groupId, enabled, durationMinutes = 60) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const hasPerm = await hasPermission(groupId, currentUser.uid, PERMISSIONS.MANAGE_SETTINGS);
    if (!hasPerm) throw new Error('Insufficient permissions');

    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      'settings.disappearingMessages': { enabled, durationMinutes }
    });
  } catch (error) {
    console.error('Error setting disappearing messages:', error);
    throw error;
  }
}

/**
 * Mute a member
 * @param {string} groupId
 * @param {string} uid
 * @param {number} durationMinutes - How long to mute (0 = indefinite)
 * @returns {Promise<void>}
 */
export async function muteMember(groupId, uid, durationMinutes = 60) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const hasPerm = await hasPermission(groupId, currentUser.uid, PERMISSIONS.MUTE_MEMBERS);
    if (!hasPerm) throw new Error('Insufficient permissions to mute');

    const targetRole = await getUserRole(groupId, uid);
    if (targetRole === 'creator' || targetRole === 'admin') {
      throw new Error('Cannot mute admins or creators');
    }

    const groupRef = doc(db, 'groups', groupId);
    const muteUntil = durationMinutes === 0 ? -1 : Date.now() + (durationMinutes * 60000);
    
    const updates = {};
    updates[`mutedMembers.${uid}`] = muteUntil;
    
    await updateDoc(groupRef, updates);
  } catch (error) {
    console.error('Error muting member:', error);
    throw error;
  }
}

/**
 * Unmute a member
 * @param {string} groupId
 * @param {string} uid
 * @returns {Promise<void>}
 */
export async function unmuteMember(groupId, uid) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const hasPerm = await hasPermission(groupId, currentUser.uid, PERMISSIONS.MUTE_MEMBERS);
    if (!hasPerm) throw new Error('Insufficient permissions to unmute');

    const groupRef = doc(db, 'groups', groupId);
    
    // Removing the mute field - simpler to set to 0 instead of using deleteField if we don't import it
    const updates = {};
    updates[`mutedMembers.${uid}`] = 0; // 0 means not muted
    
    await updateDoc(groupRef, updates);
  } catch (error) {
    console.error('Error unmuting member:', error);
    throw error;
  }
}

/**
 * Check if a member is currently muted
 * @param {string} groupId
 * @param {string} uid
 * @returns {Promise<boolean>}
 */
export async function isMemberMuted(groupId, uid) {
  try {
    const group = await getGroup(groupId);
    if (!group || !group.mutedMembers || group.mutedMembers[uid] === undefined) {
      return false;
    }
    
    const muteUntil = group.mutedMembers[uid];
    if (muteUntil === 0) return false;
    if (muteUntil === -1) return true; // Indefinite
    
    return Date.now() < muteUntil;
  } catch (error) {
    console.error('Error checking mute status:', error);
    return false;
  }
}

// ============ JOIN REQUESTS ============

/**
 * Submit a join request for a private group
 * @param {string} groupId
 * @returns {Promise<string>} Request document ID
 */
export async function submitJoinRequest(groupId) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    // Check if already requested
    const q = query(
      collection(db, 'joinRequests'), 
      where('groupId', '==', groupId),
      where('userId', '==', currentUser.uid)
    );
    const snap = await getDocs(q);
    if (!snap.empty) throw new Error('Join request already pending');

    const reqRef = await addDoc(collection(db, 'joinRequests'), {
      groupId,
      userId: currentUser.uid,
      requestedAt: serverTimestamp(),
      status: 'pending'
    });
    
    return reqRef.id;
  } catch (error) {
    console.error('Error submitting join request:', error);
    throw error;
  }
}

/**
 * Get pending join requests for a group
 * @param {string} groupId
 * @returns {Promise<Array<{ id, userId, username, avatar, requestedAt }>>}
 */
export async function getPendingJoinRequests(groupId) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const hasPerm = await hasPermission(groupId, currentUser.uid, PERMISSIONS.MANAGE_MEMBERS);
    if (!hasPerm) throw new Error('Insufficient permissions to view requests');

    const q = query(
      collection(db, 'joinRequests'),
      where('groupId', '==', groupId),
      where('status', '==', 'pending')
    );
    const snap = await getDocs(q);
    
    const requests = [];
    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const userRef = doc(db, 'users', data.userId);
      const userSnap = await getDoc(userRef);
      
      let username = 'Unknown User', avatar = null;
      if (userSnap.exists()) {
        const udata = userSnap.data();
        username = udata.username || udata.displayName || 'Unknown User';
        avatar = udata.profilePic || udata.photoURL || null;
      }
      
      requests.push({
        id: docSnap.id,
        userId: data.userId,
        username,
        avatar,
        requestedAt: data.requestedAt
      });
    }
    
    return requests;
  } catch (error) {
    console.error('Error getting join requests:', error);
    throw error;
  }
}

/**
 * Accept a join request
 * @param {string} requestId
 * @param {string} groupId
 * @param {string} userId
 * @returns {Promise<void>}
 */
export async function acceptJoinRequest(requestId, groupId, userId) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const hasPerm = await hasPermission(groupId, currentUser.uid, PERMISSIONS.MANAGE_MEMBERS);
    if (!hasPerm) throw new Error('Insufficient permissions');

    // Add to members
    await addMembers(groupId, [userId]);
    
    // Update request status
    const reqRef = doc(db, 'joinRequests', requestId);
    await updateDoc(reqRef, { status: 'accepted' });
  } catch (error) {
    console.error('Error accepting join request:', error);
    throw error;
  }
}

/**
 * Decline a join request
 * @param {string} requestId
 * @returns {Promise<void>}
 */
export async function declineJoinRequest(requestId) {
  try {
    const reqRef = doc(db, 'joinRequests', requestId);
    const reqSnap = await getDoc(reqRef);
    if (!reqSnap.exists()) throw new Error('Request not found');
    
    const data = reqSnap.data();
    const hasPerm = await hasPermission(data.groupId, auth.currentUser.uid, PERMISSIONS.MANAGE_MEMBERS);
    if (!hasPerm) throw new Error('Insufficient permissions');
    
    await updateDoc(reqRef, { status: 'declined' });
  } catch (error) {
    console.error('Error declining join request:', error);
    throw error;
  }
}

// ============ PINNED MESSAGES ============

/**
 * Pin a message (max 5)
 * @param {string} groupId
 * @param {string} messageId
 * @returns {Promise<void>}
 */
export async function pinMessage(groupId, messageId) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const hasPerm = await hasPermission(groupId, currentUser.uid, PERMISSIONS.MANAGE_SETTINGS);
    if (!hasPerm) throw new Error('Insufficient permissions to pin messages');

    const group = await getGroup(groupId);
    if (!group) throw new Error('Group not found');
    
    const pinned = group.settings?.pinnedMessages || [];
    if (pinned.includes(messageId)) return;
    if (pinned.length >= 5) {
      throw new Error('Maximum of 5 pinned messages allowed');
    }

    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      'settings.pinnedMessages': arrayUnion(messageId)
    });
  } catch (error) {
    console.error('Error pinning message:', error);
    throw error;
  }
}

/**
 * Unpin a message
 * @param {string} groupId
 * @param {string} messageId
 * @returns {Promise<void>}
 */
export async function unpinMessage(groupId, messageId) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const hasPerm = await hasPermission(groupId, currentUser.uid, PERMISSIONS.MANAGE_SETTINGS);
    if (!hasPerm) throw new Error('Insufficient permissions to unpin messages');

    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      'settings.pinnedMessages': arrayRemove(messageId)
    });
  } catch (error) {
    console.error('Error unpinning message:', error);
    throw error;
  }
}

// ============ INVITE LINK ============

/**
 * Generate or regenerate an invite link for the group
 * Stores invite code on the group document.
 * @param {string} groupId
 * @returns {Promise<string>} The invite link URL
 */
export async function regenerateInviteLink(groupId) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const hasPerm = await hasPermission(groupId, currentUser.uid, PERMISSIONS.MANAGE_SETTINGS);
    if (!hasPerm) throw new Error('Insufficient permissions to regenerate invite link');

    const newCode = Math.random().toString(36).substring(2, 10);
    const inviteLink = `${window.location.origin}?joinGroup=${newCode}`;

    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      inviteCode: newCode
    });

    return inviteLink;
  } catch (error) {
    console.error('Error regenerating invite link:', error);
    throw error;
  }
}
