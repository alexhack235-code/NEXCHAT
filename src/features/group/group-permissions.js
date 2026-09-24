/**
 * GroupPermissions - Role-based permission system for groups
 */

export const PERMISSIONS = {
  SEND_MESSAGE: 'SEND_MESSAGE',
  ADD_MEMBER: 'ADD_MEMBER',
  REMOVE_MEMBER: 'REMOVE_MEMBER',
  EDIT_GROUP_INFO: 'EDIT_GROUP_INFO',
  PIN_MESSAGE: 'PIN_MESSAGE',
  DELETE_ANY_MESSAGE: 'DELETE_ANY_MESSAGE',
  MUTE_MEMBER: 'MUTE_MEMBER',
  SET_SLOW_MODE: 'SET_SLOW_MODE',
  SET_DISAPPEARING: 'SET_DISAPPEARING',
  PROMOTE_MODERATOR: 'PROMOTE_MODERATOR',
  PROMOTE_ADMIN: 'PROMOTE_ADMIN',
  DELETE_GROUP: 'DELETE_GROUP',
  CREATE_POLL: 'CREATE_POLL',
  GENERATE_INVITE: 'GENERATE_INVITE'
};

const ROLES = {
  CREATOR: 'creator',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  MEMBER: 'member'
};

export const ROLE_PERMISSIONS = {
  [ROLES.MEMBER]: [
    PERMISSIONS.SEND_MESSAGE,
    PERMISSIONS.CREATE_POLL
  ],
  [ROLES.MODERATOR]: [
    PERMISSIONS.SEND_MESSAGE,
    PERMISSIONS.CREATE_POLL,
    PERMISSIONS.PIN_MESSAGE,
    PERMISSIONS.DELETE_ANY_MESSAGE,
    PERMISSIONS.MUTE_MEMBER,
    PERMISSIONS.GENERATE_INVITE
  ],
  [ROLES.ADMIN]: [
    PERMISSIONS.SEND_MESSAGE,
    PERMISSIONS.CREATE_POLL,
    PERMISSIONS.PIN_MESSAGE,
    PERMISSIONS.DELETE_ANY_MESSAGE,
    PERMISSIONS.MUTE_MEMBER,
    PERMISSIONS.GENERATE_INVITE,
    PERMISSIONS.ADD_MEMBER,
    PERMISSIONS.REMOVE_MEMBER,
    PERMISSIONS.EDIT_GROUP_INFO,
    PERMISSIONS.SET_SLOW_MODE,
    PERMISSIONS.SET_DISAPPEARING,
    PERMISSIONS.PROMOTE_MODERATOR
  ],
  [ROLES.CREATOR]: [
    // Creator has all permissions
    ...Object.values(PERMISSIONS)
  ]
};

/**
 * Determines a user's role in a group
 * @param {Object} groupData 
 * @param {string} uid 
 * @returns {string} The role string
 */
export function getUserRole(groupData, uid) {
  if (!groupData || !uid) return ROLES.MEMBER;
  if (groupData.creatorId === uid) return ROLES.CREATOR;
  if (Array.isArray(groupData.admins) && groupData.admins.includes(uid)) return ROLES.ADMIN;
  if (Array.isArray(groupData.moderators) && groupData.moderators.includes(uid)) return ROLES.MODERATOR;
  return ROLES.MEMBER;
}

/**
 * Checks if a user has a specific permission
 * @param {Object} groupData 
 * @param {string} uid 
 * @param {string} permission 
 * @returns {boolean}
 */
export function hasPermission(groupData, uid, permission) {
  const role = getUserRole(groupData, uid);
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

/**
 * Higher-level check for complex actions (e.g., target user roles)
 * @param {Object} groupData 
 * @param {string} uid - Actor UID
 * @param {string} action - Action being performed
 * @param {string} [targetUid] - Target UID
 * @returns {boolean}
 */
export function canPerformAction(groupData, uid, action, targetUid = null) {
  const actorRole = getUserRole(groupData, uid);
  const targetRole = targetUid ? getUserRole(groupData, targetUid) : null;
  
  if (!hasPermission(groupData, uid, action)) {
    return false;
  }

  // Rank system: Creator (4) > Admin (3) > Moderator (2) > Member (1)
  const getRank = (role) => {
    switch (role) {
      case ROLES.CREATOR: return 4;
      case ROLES.ADMIN: return 3;
      case ROLES.MODERATOR: return 2;
      default: return 1;
    }
  };

  if (targetRole) {
    const actorRank = getRank(actorRole);
    const targetRank = getRank(targetRole);
    
    // Cannot perform negative actions on higher or equal ranks (except creator on admins)
    if (actorRank <= targetRank && actorRole !== ROLES.CREATOR) {
      return false;
    }
  }

  return true;
}

/**
 * Returns updated fields to promote a user to moderator
 * @param {Object} groupData 
 * @param {string} uid 
 * @returns {Object} Fields to update in Firestore
 */
export function promoteToModerator(groupData, uid) {
  if (!groupData || !uid) throw new Error('Invalid arguments');
  
  const moderators = new Set(groupData.moderators || []);
  const admins = new Set(groupData.admins || []);
  
  moderators.add(uid);
  admins.delete(uid); // Ensure they are not also admin
  
  return {
    moderators: Array.from(moderators),
    admins: Array.from(admins)
  };
}

/**
 * Returns updated fields to promote a user to admin
 * @param {Object} groupData 
 * @param {string} uid 
 * @returns {Object} Fields to update in Firestore
 */
export function promoteToAdmin(groupData, uid) {
  if (!groupData || !uid) throw new Error('Invalid arguments');
  
  const admins = new Set(groupData.admins || []);
  const moderators = new Set(groupData.moderators || []);
  
  admins.add(uid);
  moderators.delete(uid);
  
  return {
    admins: Array.from(admins),
    moderators: Array.from(moderators)
  };
}

/**
 * Returns updated fields to demote a user to member
 * @param {Object} groupData 
 * @param {string} uid 
 * @returns {Object} Fields to update in Firestore
 */
export function demoteToMember(groupData, uid) {
  if (!groupData || !uid) throw new Error('Invalid arguments');
  
  const admins = new Set(groupData.admins || []);
  const moderators = new Set(groupData.moderators || []);
  
  admins.delete(uid);
  moderators.delete(uid);
  
  return {
    admins: Array.from(admins),
    moderators: Array.from(moderators)
  };
}

/**
 * Returns the display string for a role
 * @param {string} role 
 * @returns {string}
 */
export function getRoleLabel(role) {
  switch (role) {
    case ROLES.CREATOR: return ' Creator';
    case ROLES.ADMIN: return ' Admin';
    case ROLES.MODERATOR: return ' Moderator';
    default: return ' Member';
  }
}

/**
 * Returns the hex color for a role badge
 * @param {string} role 
 * @returns {string}
 */
export function getRoleBadgeColor(role) {
  switch (role) {
    case ROLES.CREATOR: return '#ffd700'; // Gold
    case ROLES.ADMIN: return '#ff4444'; // Red
    case ROLES.MODERATOR: return '#00ff66'; // Green
    default: return '#8892b0'; // Gray
  }
}

/**
 * Checks if a user is allowed to send a message based on slow mode
 * @param {Object} groupData 
 * @param {string} uid 
 * @param {number} lastMessageTime - Timestamp in ms of user's last message
 * @returns {{allowed: boolean, remainingSeconds: number}}
 */
export function checkSlowMode(groupData, uid, lastMessageTime) {
  if (!groupData || !groupData.slowModeSeconds || groupData.slowModeSeconds <= 0) {
    return { allowed: true, remainingSeconds: 0 };
  }

  const role = getUserRole(groupData, uid);
  // Admins and Creator bypass slow mode
  if (role === ROLES.ADMIN || role === ROLES.CREATOR) {
    return { allowed: true, remainingSeconds: 0 };
  }

  if (!lastMessageTime) {
    return { allowed: true, remainingSeconds: 0 };
  }

  const now = Date.now();
  const timeSinceLastMsg = now - lastMessageTime;
  const cooldownMs = groupData.slowModeSeconds * 1000;

  if (timeSinceLastMsg >= cooldownMs) {
    return { allowed: true, remainingSeconds: 0 };
  }

  const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastMsg) / 1000);
  return { allowed: false, remainingSeconds };
}
