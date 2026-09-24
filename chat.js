import "./src/js/security-guard.js";
import { GroupChat } from "./src/features/group/index.js";
import { auth, db, rtdb } from "./firebase-config.js";
import { chronexAI } from "./chronex-ai-service.js";
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, setDoc,
  query, where, onSnapshot, serverTimestamp, orderBy, limit, limitToLast, Timestamp, increment, runTransaction, arrayUnion, arrayRemove, deleteField
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";
import { uploadVideoToCloudinary } from "./src/js/cloudinary.js";
import { uploadMediaBlob, uploadAnyMedia, uploadStatusMedia } from "./src/js/media-upload.js";
import { broadcastTyping, subscribeToChatPresence, unsubscribeChatPresence } from "./src/js/presence.js";
import { joinCall as joinLiveKitCall, leaveCall as leaveLiveKitCall } from "./src/js/livekit-call.js";
import {
  findPendingSession, approvePairingSession, rejectPairingSession,
  getLinkedDevices, unlinkDevice, listenForSessionRevocation, detectDeviceInfo
} from "./src/js/link-device.js";
import { openWallpaperModal, applyActiveWallpaper, WALLPAPER_PRESETS } from "./src/js/wallpaper-presets.js";


const storage = getStorage();

const isAndroid = /Android/.test(navigator.userAgent);
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
const isMobile = isAndroid || isIOS;

function vibrate(duration = 10) {
  if (navigator.vibrate) {
    navigator.vibrate(duration);
  }
}

function hapticFeedback(intensity = 'medium') {
  if (!navigator.vibrate) return;

  const patterns = {
    light: [10],
    medium: [20],
    heavy: [50],
    success: [10, 50, 10],
    alert: [100, 50, 100]
  };

  navigator.vibrate(patterns[intensity] || patterns.medium);
}

let currentChatUser = null;
let currentChatType = 'direct'; // 'direct' or 'group'
let currentChatName = null;
let typingStatusUnsubscribe = null;
let userStatusUnsubscribe = null;
let pendingRequestsListener = null;
let typingStatusTimeout = null;
let isTypingActive = false;
let myUID = null;
let myUsername = null;
let currentJoinModalGroupId = null;
let currentJoinRequestDocId = null;
let myProfilePic = null;
let tokens = 0;
const GROUP_DEFENSE_BOT_ID = 'group_defense_bot';
let currentMuteGroupId = null;
let chatLoadSkeletonTimer = null;
let chatLoadOverlayTimer = null;
let chatLoadSafetyTimer = null;
const CHAT_LOAD_SAFETY_TIMEOUT = 15000;
const directChatMessageCache = new Map();
const groupChatMessageCache = new Map();

let sentMessageSuccessCount = Number(localStorage.getItem('sentMessageSuccessCount') || 0);

// ============================================================
// BALANCE FORMATTING FUNCTION
// ============================================================

function formatBalanceDisplay(amount) {
  if (amount >= 1e32) {
    return '∞';
  }
  if (amount >= 1e15) {
    return 'QUADTRILLION';
  }
  if (amount >= 1e12) {
    return 'TRILLION';
  }
  if (amount >= 1e9) {
    return 'BILLION';
  }
  if (amount >= 1e6) {
    return 'MILLION';
  }
  if (amount >= 1e3) {
    return 'THOUSAND';
  }
  return `${amount}`;
}
const MESSAGE_SEND_NOTIFICATION_INTERVAL = 100;

function shouldShowMessageSentNotification() {
  sentMessageSuccessCount += 1;
  localStorage.setItem('sentMessageSuccessCount', sentMessageSuccessCount);
  return sentMessageSuccessCount % MESSAGE_SEND_NOTIFICATION_INTERVAL === 0;
}

function getDirectChatCacheKey(uidA, uidB) {
  return [uidA, uidB].filter(Boolean).sort().join('|');
}

function getCachedDirectChatMessages(uidA, uidB, maxAge = 180000) {
  const key = getDirectChatCacheKey(uidA, uidB);
  const cached = directChatMessageCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > maxAge) {
    directChatMessageCache.delete(key);
    return null;
  }
  return cached.messages;
}

function cacheDirectChatMessages(uidA, uidB, messages) {
  const key = getDirectChatCacheKey(uidA, uidB);
  directChatMessageCache.set(key, {
    messages: Array.isArray(messages) ? messages.slice() : [],
    timestamp: Date.now()
  });
}

function getGroupChatCacheKey(groupId) {
  return `group_${groupId}`;
}

function getCachedGroupChatMessages(groupId, maxAge = 180000) {
  const key = getGroupChatCacheKey(groupId);
  const cached = groupChatMessageCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > maxAge) {
    groupChatMessageCache.delete(key);
    return null;
  }
  return cached.messages;
}

function cacheGroupChatMessages(groupId, messages) {
  const key = getGroupChatCacheKey(groupId);
  groupChatMessageCache.set(key, {
    messages: Array.isArray(messages) ? messages.slice() : [],
    timestamp: Date.now()
  });
}

function renderCachedDirectChatHistory(messages, messagesDiv) {
  if (!messagesDiv || !messages || !messages.length) return;
  const html = messages.map((m) => {
    const isOwn = m.from === myUID;
    const senderText = isOwn ? 'You' : escape(currentChatName || 'Friend');
    const timestamp = formatChatTimestamp(m.time?.toDate?.() || new Date(m.time || Date.now()));
    const bubbleColor = isOwn ? '#00ff66' : '#333';
    const textColor = isOwn ? '#000' : '#fff';
    const align = isOwn ? 'flex-end' : 'flex-start';
    return `
      <div style="display:flex; justify-content:${align}; margin:8px 0; padding:0 12px; flex-direction: column; align-items: ${align};">
        <div style="font-size:11px; color:${isOwn ? '#00ff66' : '#aaa'}; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.4px;">
          ${escape(senderText)} · ${escape(timestamp)}
        </div>
        <div class="message-bubble" style="background:${bubbleColor}; color:${textColor}; padding:12px 14px; border-radius:14px; max-width:75%; word-wrap:break-word;">
          ${escape(m.text || m.message || '')}
        </div>
      </div>`;
  }).join('');

  messagesDiv.innerHTML = html;
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function renderCachedGroupChatHistory(messages, messagesDiv) {
  if (!messagesDiv || !messages || !messages.length) return;
  const html = messages.map((m) => {
    const isOwn = m.from === myUID;
    const senderText = isOwn ? 'You' : (m.from ? m.from.substring(0, 12) : 'Member');
    const timestamp = formatChatTimestamp(m.timestamp?.toDate?.() || new Date(m.timestamp || Date.now()));
    const bgColor = isOwn ? '#00ff6633' : '#333';
    const textColor = '#fff';
    const labelColor = isOwn ? '#00ff66' : '#ff9500';
    return `
      <div style="margin: 10px 0; padding: 8px;">
        <div style="font-size: 12px; color: ${labelColor}; margin-bottom: 4px; font-weight: 700; letter-spacing:0.25px;">
          ${escape(senderText)} · ${escape(timestamp)}
        </div>
        <div style="background: ${bgColor}; padding: 10px; border-radius: 8px; word-wrap: break-word;">
          ${escape(m.text || m.message || (m.attachment ? 'Attachment' : ''))}
        </div>
      </div>`;
  }).join('');

  messagesDiv.innerHTML = html;
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function normalizeGroupMutedMembers(mutedData) {
  if (!mutedData) return {};
  if (Array.isArray(mutedData)) {
    const map = {};
    mutedData.forEach(item => {
      if (item && item.userId) {
        map[item.userId] = item.mutedUntil;
      }
    });
    return map;
  }
  return mutedData;
}

function formatTimeRemaining(timestamp) {
  if (!timestamp) return '';
  const expiresAt = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diffMs = expiresAt - new Date();
  if (diffMs <= 0) return 'Expired';
  const minutes = Math.ceil(diffMs / 60000);
  if (minutes < 60) return `${minutes}m left`;
  if (minutes < 1440) return `${Math.ceil(minutes / 60)}h left`;
  return `${Math.ceil(minutes / 1440)}d left`;
}

function formatLastSeen(timestamp) {
  if (!timestamp) return 'Last seen unknown';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diffMs = new Date() - date;
  if (diffMs < 60000) return 'Last seen just now';
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `Last seen ${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Last seen ${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `Last seen ${diffDays}d ago`;
}

function formatChatDate(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

function formatChatTimestamp(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const day = formatChatDate(date);
  return day ? `${day} · ${time}` : time;
}

function getUserPresenceStatus(userData) {
  if (!userData) return '❔ Unknown';
  if (userData.online) return '🟢 Online';
  if (userData.lastSeen) return `🕒 ${formatLastSeen(userData.lastSeen)}`;
  return '🔴 Offline';
}

function buildTypingDocId(chatId, chatType) {
  if (!chatId) return null;
  if (chatType === 'group') {
    return `group_${chatId}`;
  }
  const uids = [myUID, chatId].sort();
  return `direct_${uids.join('_')}`;
}

function getTypingDocRef(chatId, chatType) {
  const docId = buildTypingDocId(chatId, chatType);
  if (!docId) return null;
  return doc(db, 'typingStatus', docId);
}

async function updateTypingStatus(isTyping) {
  if (!myUID || !currentChatUser || !currentChatType) return;
  const typingRef = getTypingDocRef(currentChatUser, currentChatType);
  if (!typingRef) return;

  try {
    // 1. Supabase Realtime presence broadcast (instant, 0 billing)
    broadcastTyping(isTyping);

    // 2. Firestore presence backup
    await setDoc(typingRef, {
      typingUsers: isTyping ? arrayUnion(myUID) : arrayRemove(myUID),
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn('Typing status update failed:', err);
  }
}

async function clearTypingStatus() {
  if (!isTypingActive) return;
  isTypingActive = false;
  if (typingStatusTimeout) {
    clearTimeout(typingStatusTimeout);
    typingStatusTimeout = null;
  }
  await updateTypingStatus(false);
}

function showTypingIndicator(label) {
  const indicator = document.getElementById('typingIndicator');
  if (!indicator) return;
  indicator.style.display = 'flex';
  indicator.innerHTML = `
    <span class="typing-label" style="font-size: 13px; color: #ccc; margin-right: 8px;">${label}</span>
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
  `;
}

function hideTypingIndicator() {
  const indicator = document.getElementById('typingIndicator');
  if (!indicator) return;
  indicator.style.display = 'none';
  indicator.innerHTML = `
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
  `;
}

function getTypingUserName(uid) {
  if (!uid) return 'Someone';
  if (currentChatType === 'direct' && uid === currentChatUser) {
    return currentChatName || 'User';
  }
  const member = groupMembers?.find(member => member.uid === uid);
  return member?.username || member?.name || uid;
}

function subscribeUserPresence(userId) {
  if (userStatusUnsubscribe) {
    userStatusUnsubscribe();
    userStatusUnsubscribe = null;
  }

  if (!userId) return;

  const userRef = doc(db, 'users', userId);
  userStatusUnsubscribe = onSnapshot(userRef, (snap) => {
    if (!snap.exists()) return;
    const userData = snap.data();
    const statusText = getUserPresenceStatus(userData);
    const statusTextEl = document.getElementById('statusText');
    if (statusTextEl) statusTextEl.textContent = statusText;
    const infoStatusEl = document.getElementById('infoStatus');
    if (infoStatusEl) infoStatusEl.textContent = statusText;
  }, (error) => {
    console.warn('User presence snapshot failed:', error);
  });
}

function subscribeTypingIndicator(chatId, chatType) {
  if (typingStatusUnsubscribe) {
    typingStatusUnsubscribe();
    typingStatusUnsubscribe = null;
  }
  if (!chatId || !chatType) {
    hideTypingIndicator();
    unsubscribeChatPresence();
    return;
  }

  // Supabase Realtime presence channel for instant typing indicator
  subscribeToChatPresence({
    chatId: chatId,
    userId: myUID,
    userName: myUsername,
    onTypingUpdate: ({ isTyping, user }) => {
      if (isTyping) {
        showTypingIndicator(`${user} is typing...`);
      } else {
        hideTypingIndicator();
      }
    }
  });

  const typingRef = getTypingDocRef(chatId, chatType);
  if (!typingRef) {
    hideTypingIndicator();
    return;
  }

  typingStatusUnsubscribe = onSnapshot(typingRef, (snap) => {
    if (!snap.exists()) {
      hideTypingIndicator();
      return;
    }

    const data = snap.data();
    const typingUsers = (data.typingUsers || []).filter(uid => uid && uid !== myUID);
    if (!typingUsers.length) {
      hideTypingIndicator();
      return;
    }

    const names = typingUsers.map(uid => getTypingUserName(uid));
    if (chatType === 'direct') {
      const name = names[0] || currentChatName || 'Someone';
      showTypingIndicator(`${name} is typing...`);
    } else {
      if (names.length === 1) {
        showTypingIndicator(`@${names[0]} is typing...`);
      } else if (names.length === 2) {
        showTypingIndicator(`@${names[0]} and @${names[1]} are typing...`);
      } else {
        showTypingIndicator(`Multiple people are typing...`);
      }
    }
  }, (error) => {
    console.warn('Typing indicator snapshot failed:', error);
    hideTypingIndicator();
  });
}

function handleTypingInputEvent() {
  const input = document.getElementById('message-input');
  if (!input) return;
  const text = input.value.trim();

  if (!text) {
    clearTypingStatus();
    return;
  }

  if (!isTypingActive) {
    isTypingActive = true;
    updateTypingStatus(true).catch(() => {});
  }

  if (typingStatusTimeout) {
    clearTimeout(typingStatusTimeout);
  }

  typingStatusTimeout = setTimeout(() => {
    isTypingActive = false;
    clearTypingStatus().catch(() => {});
  }, 2000);
}

async function isGroupMemberMuted(groupId, userId) {
  if (!groupId || !userId) return false;
  try {
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    if (!groupDoc.exists()) return false;
    const mutedMembers = normalizeGroupMutedMembers(groupDoc.data().mutedMembers);
    const muteInfo = mutedMembers[userId];
    if (!muteInfo) return false;
    const expiresAt = muteInfo.toDate ? muteInfo.toDate() : new Date(muteInfo);
    if (expiresAt <= new Date()) {
      await unmuteGroupMember(groupId, userId);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error checking group mute status:', err);
    return false;
  }
}

async function muteGroupMember(groupId, userId, durationMinutes) {
  if (!groupId || !userId || durationMinutes <= 0) return;
  try {
    const mutedUntil = Timestamp.fromDate(new Date(Date.now() + durationMinutes * 60000));
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      [`mutedMembers.${userId}`]: mutedUntil
    });
  } catch (err) {
    console.error('Error muting group member:', err);
    throw err;
  }
}

async function unmuteGroupMember(groupId, userId) {
  if (!groupId || !userId) return;
  try {
    await updateDoc(doc(db, 'groups', groupId), {
      [`mutedMembers.${userId}`]: deleteField()
    });
  } catch (err) {
    console.error('Error unmuting group member:', err);
    throw err;
  }
}

async function updateGroupDisappearingMessages(groupId, enabled, durationMinutes) {
  if (!groupId) return;
  try {
    await updateDoc(doc(db, 'groups', groupId), {
      disappearingMessages: {
        enabled: !!enabled,
        durationMinutes: enabled ? durationMinutes : 0
      }
    });
  } catch (err) {
    console.error('Error updating disappearing messages settings:', err);
    throw err;
  }
}

async function sendGroupBotMessage(groupId, text, mentionedUserIds = []) {
  if (!groupId || !text) return;
  try {
    await addDoc(collection(db, 'groupMessages'), {
      groupId,
      from: GROUP_DEFENSE_BOT_ID,
      text,
      timestamp: serverTimestamp(),
      edited: false,
      mentionedUserIds: mentionedUserIds
    });
  } catch (err) {
    console.error('Error sending group bot message:', err);
  }
}

let messageListener = null;
let directChatAutoAccept = true; // true: free chat, false: requires request/approval
let approvedChatUsers = []; // list of user IDs allowed to chat direct
let pendingChatRequests = {}; // track pending outgoing requests by user ID
let selfAIAutoResponderSeenMessages = new Set();
let selfAISelectedUserIds = [];
let messageListener2 = null;
let contactsListener = null;
let updateMessagesTimeout = null; // Debounce timer to prevent rapid rerendering
let callActive = false;
let callStartTime = null;
let callTimer = null;
let ringingAudio = null; // For incoming call ringing sound
let ringingInterval = null; // Repeated ringing timer
let callDocListener = null;
let incomingCallListener = null;
let incomingChatRequestListener = null;
let activeCallDocId = null;
let incomingCallOverlay = null;
let mentionPopupOpen = false;
let groupMembers = [];
let selectedRingtone = 'skype'; // Default ringtone - now Skype-like!
window.lastUpdateTime = Date.now(); // Track last UI update time for adaptive debouncing

let globalAudioContext = null;

function getAudioContext() {
  if (!globalAudioContext) {
    globalAudioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (globalAudioContext.state === 'suspended') {
    globalAudioContext.resume().catch(err => {
      console.warn('Could not resume audio context:', err);
    });
  }

  return globalAudioContext;
}

function initializeAudio() {
  try {
    const audioContext = getAudioContext();
    const dummyOscillator = audioContext.createOscillator();
    const dummyGain = audioContext.createGain();
    dummyGain.gain.setValueAtTime(0.001, audioContext.currentTime);
    dummyOscillator.connect(dummyGain);
    dummyGain.connect(audioContext.destination);
    dummyOscillator.start();
    dummyOscillator.stop(audioContext.currentTime + 0.01);
  } catch (err) {
    console.warn('Could not initialize audio context:', err);
  }
}

let notificationPermissionGranted = false;

async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    notificationPermissionGranted = true;
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    notificationPermissionGranted = permission === 'granted';
    return notificationPermissionGranted;
  }

  return false;
}

function showBrowserNotification(title, body, icon = 'logo.jpg', tag = 'nexchat') {
  if (!notificationPermissionGranted || document.hasFocus()) {
    return; // Don't show notifications if app is focused
  }

  try {
    const options = {
      body: body,
      icon: icon,
      tag: tag,
      badge: 'logo.jpg',
      requireInteraction: false,
      silent: false,
      renotify: true,
      vibrate: [200, 100, 200],
      data: {
        url: './chat.html',
        tag
      }
    };

    const notification = new Notification(title, options);

    setTimeout(() => {
      notification.close();
    }, 5000);

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  } catch (err) {
    console.warn('Could not show browser notification:', err);
  }
}

function safeShowNotification(message, type = 'info', duration = 3000) {
  if (typeof showNotification === 'function') {
    return showNotification(message, type, duration);
  }
  if (typeof showNotif === 'function') {
    return showNotif(message, type, duration);
  }
  console.log('Notification fallback:', message, type, duration);
}

function notifyNewMessage(message, senderName) {
  if (!document.hasFocus() && navigator.vibrate) {
    vibrate([120, 60, 120]);
  }

  safeShowNotification(`?? New message from ${senderName}`, 'info', 3000);

  showBrowserNotification(
    'NEXCHAT - New Message',
    `${senderName}: ${message.text || 'New message'}`,
    'logo.jpg',
    'new-message'
  );
}

function notifyIncomingCall(callerName, isVideo = false) {
  const callType = isVideo ? 'Video' : 'Voice';

  safeShowNotification(`?? Incoming ${callType} Call from ${callerName}`, 'info', 8000);

  showBrowserNotification(
    `NEXCHAT - Incoming ${callType} Call`,
    `${callerName} is calling you...`,
    'logo.jpg',
    'incoming-call'
  );
}

function playSkypeRingtone() {
  try {
    const audioContext = getAudioContext();

    const toneSequence = [
      { startFreq: 420, endFreq: 580, duration: 220 }, // Rising tone 1
      { startFreq: 520, endFreq: 720, duration: 220 }, // Rising tone 2
      { startFreq: 850, endFreq: 380, duration: 280 }  // Falling tone 3
    ];

    const gapDuration = 40; // ms gap between tones
    let currentTime = audioContext.currentTime;

    toneSequence.forEach((tone, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(tone.startFreq, currentTime);
      oscillator.frequency.linearRampToValueAtTime(tone.endFreq, currentTime + tone.duration / 1000);

      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, currentTime + 0.02); // Quick attack
      gainNode.gain.setValueAtTime(0.5, currentTime + (tone.duration - 30) / 1000);
      gainNode.gain.linearRampToValueAtTime(0, currentTime + tone.duration / 1000); // Quick decay

      oscillator.start(currentTime);
      oscillator.stop(currentTime + tone.duration / 1000);

      if (index < toneSequence.length - 1) {
        currentTime += (tone.duration + gapDuration) / 1000;
      }
    });


  } catch (err) {
    console.warn('Could not play Skype ringtone:', err);
  }
}

function startRinging(ringtone = selectedRingtone) {
  if (ringingAudio || ringingInterval) return; // Already ringing

  const ringtoneSettings = {
    'classic': { frequency: 800, type: 'sine' },
    'digital': { frequency: 1200, type: 'square' },
    'soft': { frequency: 600, type: 'triangle' },
    'urgent': { frequency: 1000, type: 'sawtooth' },
    'skype': { type: 'skype' } // Special Skype-like sequence
  };

  const settings = ringtoneSettings[ringtone] || ringtoneSettings['classic'];

  const playRingOnce = () => {
    try {
      if (settings.type === 'skype') {
        playSkypeRingtone();
        return;
      }

      const audioContext = getAudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(settings.frequency, audioContext.currentTime);
      oscillator.type = settings.type;
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);

      oscillator.start();
      setTimeout(() => {
        try {
          oscillator.stop();
        } catch (err) {
          console.warn('Could not stop oscillator:', err);
        }
      }, 1000);
    } catch (err) {
      console.warn('Could not play ringing sound:', err);
    }
  };

  playRingOnce();
  ringingInterval = setInterval(playRingOnce, 3000);
  ringingAudio = true;
}

function stopRinging() {
  if (ringingInterval) {
    clearInterval(ringingInterval);
    ringingInterval = null;
  }
  if (ringingAudio) {
    ringingAudio = null;
  }
}

let localAiMessages = [];

function generateClientId(length = 12) {
  return [...Array(length)].map(() => Math.random().toString(36).charAt(2)).join('');
}

function initAiModelSelection() {
  const modelSelect = document.getElementById('aiModelSelect');
  if (!modelSelect || typeof chronexAI === 'undefined' || !chronexAI.setModel) return;

  const savedModelKey = localStorage.getItem('nexchat_ai_model') || 'nexchat-custom';
  modelSelect.value = savedModelKey;

  modelSelect.addEventListener('change', () => {
    const selected = modelSelect.value;
    localStorage.setItem('nexchat_ai_model', selected);
  });

  const selectedModelConfig = {
    'performance': { name: 'NEXCHAT Performance Model', temperature: 0.2, maxTokens: 1200, topP: 0.6 },
    'creative': { name: 'NEXCHAT Creative Model', temperature: 0.9, maxTokens: 2200, topP: 0.95 },
    'safe': { name: 'NEXCHAT Safe Guard', temperature: 0.4, maxTokens: 1500, topP: 0.5, frequencyPenalty: 0.8, presencePenalty: 0.8 },
    'nexchat-custom': { name: 'NEXCHAT Custom Neural Model', temperature: 0.7, maxTokens: 2000, topP: 0.9, frequencyPenalty: 0.6, presencePenalty: 0.6 }
  };

  const modelConfig = selectedModelConfig[savedModelKey] || selectedModelConfig['nexchat-custom'];
  chronexAI.setModel(modelConfig);
  showNotif(`? AI model loaded: ${modelConfig.name}`, 'success', 2000);
}

function loadChatApprovalSettings() {
  directChatAutoAccept = localStorage.getItem('nexchatDirectChatAutoAccept') !== 'false';
  const checkbox = document.getElementById('directChatAutoAccept');
  if (checkbox) {
    checkbox.checked = directChatAutoAccept;
    checkbox.onchange = async () => {
      directChatAutoAccept = checkbox.checked;
      localStorage.setItem('nexchatDirectChatAutoAccept', directChatAutoAccept ? 'true' : 'false');
      showNotif(`? Direct Chat ${directChatAutoAccept ? 'enabled' : 'requires requests'}`, 'success');
    };
  }

  if (!myUID) return;

  getDoc(doc(db, 'users', myUID)).then(snapshot => {
    if (snapshot.exists()) {
      approvedChatUsers = snapshot.data().approvedChatUsers || [];
    }
  }).catch(err => {
    console.warn('Could not load approved chat users:', err);
  });

  setupIncomingChatRequestListener();
}

function isDirectChatAllowed(targetUid) {
  if (directChatAutoAccept) return true;
  if (!targetUid) return false;
  return approvedChatUsers.includes(targetUid);
}

function setUserApprovedForChat(targetUid) {
  if (!myUID || !targetUid) return;
  if (approvedChatUsers.includes(targetUid)) return;
  approvedChatUsers.push(targetUid);
  updateDoc(doc(db, 'users', myUID), {
    approvedChatUsers: arrayUnion(targetUid)
  }).catch(err => console.warn('Could not save approved chat user:', err));
}

async function sendChatRequest(targetUid) {
  if (!myUID || !targetUid) return;
  if (pendingChatRequests[targetUid]) {
    showNotif('⏳ Chat request already pending for this user', 'error');
    return;
  }

  try {
    const requestDoc = await addDoc(collection(db, 'chatRequests'), {
      from: myUID,
      to: targetUid,
      status: 'pending',
      createdAt: serverTimestamp(),
      fromName: myUsername || 'Unknown',
      toName: currentChatUser || targetUid
    });

    pendingChatRequests[targetUid] = requestDoc.id;
    showNotif(`✅ Friend request sent to ${targetUid}`, 'success');

    await addDoc(collection(db, 'messages'), {
      from: myUID,
      to: targetUid,
      text: `ðŸ“¨ Request: ${myUsername || 'Someone'} wants to chat with you. Please accept or decline in the Requests panel.`,
      time: serverTimestamp(),
      read: false,
      type: 'text',
      chatType: 'request'
    });

  } catch (err) {
    console.error('Failed to send chat request:', err);
    showNotif('❌ Could not send chat request', 'error');
  }
}

function showDirectChatRequestPrompt(targetUid, targetName = 'User') {
  if (!targetUid) return;
  if (pendingChatRequests[targetUid]) {
    showNotif('⏳ Chat request already pending for this user', 'info');
    return;
  }

  const overlayId = `direct-chat-request-overlay-${targetUid}`;
  if (document.getElementById(overlayId)) return;

  const overlay = document.createElement('div');
  overlay.id = overlayId;
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.88);display:flex;align-items:center;justify-content:center;z-index:10010;padding:12px;';
  overlay.innerHTML = `
    <div style="width:100%;max-width:460px;padding:24px;background:#111;border:1px solid #00ff66;border-radius:18px;color:#f8fafc;font-family:Arial, sans-serif;text-align:center;box-shadow:0 0 40px rgba(0,255,102,0.25);">
      <h3 style="margin:0 0 16px;color:#00ff66;font-size:22px;">🔒 Approval required</h3>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#cbd5e1;">${escape(targetName)} requires approval before direct messages can be sent. Send a chat request now?</p>
      <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:8px;">
        <button id="send-direct-chat-request-${targetUid}" style="min-width:130px;padding:12px 18px;background:#00ff66;border:none;border-radius:10px;color:#000;font-weight:700;cursor:pointer;">Send Request</button>
        <button id="cancel-direct-chat-request-${targetUid}" style="min-width:130px;padding:12px 18px;background:#1f2937;border:none;border-radius:10px;color:#fff;cursor:pointer;">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById(`send-direct-chat-request-${targetUid}`)?.addEventListener('click', async () => {
    overlay.remove();
    await sendChatRequest(targetUid);
  });

  document.getElementById(`cancel-direct-chat-request-${targetUid}`)?.addEventListener('click', () => {
    overlay.remove();
  });
}

function setupIncomingChatRequestListener() {
  if (!myUID) return;

  if (typeof incomingChatRequestListener !== 'undefined' && incomingChatRequestListener) {
    incomingChatRequestListener();
  }

  const requestsQuery = query(
    collection(db, 'chatRequests'),
    where('to', '==', myUID),
    where('status', '==', 'pending')
  );

  incomingChatRequestListener = onSnapshot(requestsQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type !== 'added') return;
      const request = change.doc.data();
      const reqId = change.doc.id;

      if (document.getElementById(`chat-request-${reqId}`)) return;

      const overlay = document.createElement('div');
      overlay.id = `chat-request-${reqId}`;
      overlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:10001;`;
      overlay.innerHTML = `
        <div style="max-width:420px;padding:20px;background:#151515;border:1px solid #00ff66;border-radius:14px;text-align:center;color:#fff;">
          <h3 style="margin-top:0;color:#00ff66;">ðŸ”” Incoming chat request</h3>
          <p style="margin:16px 0;">Excuse me <strong>@${myUsername || 'User'}</strong>, <strong>${request.fromName || request.from}</strong> wants to chat with you.</p>
          <div style="display:flex;justify-content:center;gap:12px;margin-top:12px;">
            <button id="accept-request-${reqId}" style="padding:10px 18px;background:#00b300;border:none;border-radius:8px;color:#000;">Accept</button>
            <button id="decline-request-${reqId}" style="padding:10px 18px;background:#ff4444;border:none;border-radius:8px;color:#fff;">Decline</button>
          </div>
        </div>`;

      document.body.appendChild(overlay);

      document.getElementById(`accept-request-${reqId}`)?.addEventListener('click', async () => {
        overlay.remove();
        try {
          await updateDoc(doc(db, 'chatRequests', reqId), {
            status: 'accepted',
            acceptedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });

          await updateDoc(doc(db, 'users', myUID), {
            approvedChatUsers: arrayUnion(request.from)
          });

          await updateDoc(doc(db, 'users', request.from), {
            approvedChatUsers: arrayUnion(myUID)
          });

          approvedChatUsers.push(request.from);
          showNotif('✅ Chat request accepted', 'success');
        } catch (err) {
          console.error('Accept request failed:', err);
          showNotif('❌ Could not accept request', 'error');
        }
      });

      document.getElementById(`decline-request-${reqId}`)?.addEventListener('click', async () => {
        overlay.remove();
        try {
          await updateDoc(doc(db, 'chatRequests', reqId), {
            status: 'declined',
            declinedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          showNotif('❌ Chat request declined', 'info');
        } catch (err) {
          console.error('Decline request failed:', err);
          showNotif('❌ Could not decline request', 'error');
        }
      });
    });
  });
}

function renderChatLoadingSkeleton(chatType = 'direct') {
  const messagesDiv = document.getElementById('messages-area');
  if (!messagesDiv) return;

  messagesDiv.innerHTML = `
    <div class="chat-loading-skeleton">
      <div class="skeleton-bubble incoming medium"></div>
      <div class="skeleton-bubble outgoing short"></div>
      <div class="skeleton-bubble incoming long"></div>
      <div class="skeleton-bubble outgoing medium"></div>
    </div>
  `;
  messagesDiv.scrollTop = 0;
}

let chatReloadAnimationFrame = null;
let chatReloadProgress = 0;
let chatReloadFinishing = false;

function showChatReloadOverlay(statusText = 'Loading chat...') {
  const overlay = document.getElementById('chatReloadOverlay');
  if (!overlay) return;

  overlay.classList.add('visible');
  overlay.setAttribute('aria-hidden', 'false');
  overlay.dataset.status = 'loading';
  chatReloadProgress = 12;
  chatReloadFinishing = false;

  const progressEl = overlay.querySelector('.chat-reload-progress');
  const statusEl = overlay.querySelector('.chat-reload-status');
  if (progressEl) progressEl.style.width = '12%';
  if (statusEl) statusEl.textContent = statusText;

  if (chatReloadAnimationFrame) {
    cancelAnimationFrame(chatReloadAnimationFrame);
    chatReloadAnimationFrame = null;
  }

  const animate = () => {
    const progressTarget = chatReloadFinishing ? 100 : Math.min(92, chatReloadProgress + (Math.random() * 2 + 0.8));
    chatReloadProgress = progressTarget;
    if (progressEl) progressEl.style.width = `${progressTarget}%`;

    if (chatReloadFinishing && progressTarget >= 100) {
      hideChatReloadOverlay();
      return;
    }

    chatReloadAnimationFrame = requestAnimationFrame(animate);
  };

  if (chatLoadSafetyTimer) {
    clearTimeout(chatLoadSafetyTimer);
  }
  chatLoadSafetyTimer = setTimeout(() => {
    console.warn('Chat load safety timeout reached, hiding load overlay.');
    hideChatReloadOverlay();
    showNotif('Chat is taking longer than expected. Loading continues in the background.', 'warning');
  }, CHAT_LOAD_SAFETY_TIMEOUT);

  chatReloadAnimationFrame = requestAnimationFrame(animate);
}

function completeChatReloadOverlay() {
  const overlay = document.getElementById('chatReloadOverlay');
  if (!overlay) return;
  overlay.dataset.status = 'finished';
  const statusEl = overlay.querySelector('.chat-reload-status');
  if (statusEl) statusEl.textContent = 'Opening chat...';
  chatReloadFinishing = true;
  if (chatLoadSafetyTimer) {
    clearTimeout(chatLoadSafetyTimer);
    chatLoadSafetyTimer = null;
  }
}

function cancelChatLoadFeedback() {
  if (chatLoadSkeletonTimer) {
    clearTimeout(chatLoadSkeletonTimer);
    chatLoadSkeletonTimer = null;
  }
  if (chatLoadOverlayTimer) {
    clearTimeout(chatLoadOverlayTimer);
    chatLoadOverlayTimer = null;
  }
  if (chatLoadSafetyTimer) {
    clearTimeout(chatLoadSafetyTimer);
    chatLoadSafetyTimer = null;
  }
}

function queueChatLoadFeedback(statusText = 'Loading chat...') {
  cancelChatLoadFeedback();
  chatLoadSkeletonTimer = setTimeout(() => {
    renderChatLoadingSkeleton(currentChatType);
  }, 100);
  chatLoadOverlayTimer = setTimeout(() => {
    showChatReloadOverlay(statusText);
  }, 180);
}

function hideChatReloadOverlay() {
  const overlay = document.getElementById('chatReloadOverlay');
  if (!overlay) return;
  overlay.classList.remove('visible');
  overlay.setAttribute('aria-hidden', 'true');
  if (chatLoadSafetyTimer) {
    clearTimeout(chatLoadSafetyTimer);
    chatLoadSafetyTimer = null;
  }

  if (chatReloadAnimationFrame) {
    cancelAnimationFrame(chatReloadAnimationFrame);
    chatReloadAnimationFrame = null;
  }
}

const notificationSounds = {
  success: null,
  error: null,
  info: null
};

let basicUIInitialized = false;
let authListenersInitialized = false;
let offlineDB = null;
let settingsInitialized = false;
let authRedirectTimer = null;
let authRedirectInProgress = false; // Flag to prevent multiple redirect setups
let pageInitializedForCurrentUser = false; // Flag to prevent re-initialization on auth state changes

// Cleanup function to reset auth redirect flags before a deliberate logout or cache clear.
// NOTE: Do NOT clear auth_redirect_block here — that could re-enable redirect triggers mid-session.
// Do NOT reset pageInitializedForCurrentUser — that is managed by onAuthStateChanged.
function resetAuthFlags() {
  if (authRedirectTimer) {
    clearTimeout(authRedirectTimer);
    authRedirectTimer = null;
  }
  // Only reset the in-progress flag so a new redirect can start after deliberate logout
  authRedirectInProgress = false;
}

const emojis = [
  'ðŸ˜€', 'ðŸ˜ƒ', 'ðŸ˜„', 'ðŸ˜', 'ðŸ˜†', 'ðŸ˜…', 'ðŸ¤£', 'ðŸ˜‚', 'ðŸ™‚', 'ðŸ™ƒ',
  'ðŸ˜‰', 'ðŸ˜Š', 'ðŸ˜‡', 'ðŸ˜', 'ðŸ¥°', 'ðŸ˜˜', 'ðŸ˜š', 'ðŸ˜™', 'ðŸ˜‹', 'ðŸ˜œ',
  'ðŸ¤ª', 'ðŸ˜Ž', 'ðŸ¤©', 'ðŸ¥³', 'ðŸ˜', 'ðŸ˜’', 'ðŸ˜ž', 'ðŸ˜”', 'ðŸ˜Ÿ', 'ðŸ˜¢',
  'ðŸ˜­', 'ðŸ˜¤', 'ðŸ˜ ', 'ðŸ˜¡', 'ðŸ¤¬', 'ðŸ˜³', 'ðŸ¥º', 'ðŸ¤¯', 'ðŸ˜±', 'ðŸ˜¨',
  'ðŸ˜°', 'ðŸ˜‡', 'ðŸ¤—', 'ðŸ¤”', 'ðŸ¤«', 'ðŸ¤­', 'ðŸ§', 'ðŸ‘»', 'ðŸ’€', 'â˜ ï¸'
];

function toggleFullscreen() {
  const elem = document.documentElement;
  const app = document.querySelector('.app');
  const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;

  if (!isFullscreen) {
    let fullscreenPromise = null;

    if (elem.requestFullscreen) {
      fullscreenPromise = elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      fullscreenPromise = elem.webkitRequestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      fullscreenPromise = elem.mozRequestFullScreen();
    } else if (elem.msRequestFullscreen) {
      fullscreenPromise = elem.msRequestFullscreen();
    }

    if (fullscreenPromise) {
      fullscreenPromise.catch(() => {
        applyMaximizedView();
      });
    } else {
      applyMaximizedView();
    }

    showNotif("?? Fullscreen mode", "success", 1500);
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }

    removeMaximizedView();
    showNotif("?? Normal view", "success", 1500);
  }
}

function applyMaximizedView() {
  const app = document.querySelector('.app');
  if (app) {
    app.dataset.maximized = 'true';
    document.body.style.overflow = 'hidden';
    console.log('? Fullscreen applied');
  }
}

function removeMaximizedView() {
  const app = document.querySelector('.app');
  if (app && app.dataset.maximized === 'true') {
    app.dataset.maximized = 'false';
    document.body.style.overflow = 'auto';
    console.log('? Fullscreen removed');
  }
}

function showNotif(msg, type = "info", duration = 3000) {
  const container = document.getElementById("notificationContainer");
  
  // Sanitize message to remove corrupted mojibake and leading question marks
  let cleanMsg = String(msg || '')
    .replace(/^(\?{1,6}\s*)+/, '')
    .replace(/^\?x\s+\?{1,6}\s*/, '')
    .replace(/^\?\?R\s+/, '')
    .replace(/âœ…/g, '✅')
    .replace(/â Œ/g, '❌')
    .replace(/ðŸ“ž/g, '📞')
    .trim();

  const iconPrefix = type === 'success' ? '✅ ' : type === 'error' ? '❌ ' : type === 'warning' ? '⚠️ ' : 'ℹ️ ';
  const displayText = `${iconPrefix}${cleanMsg}`;

  if (!container) {
    console.warn("Notification container not found");
    if (type === "error") {
      alert(displayText);
    }
    return;
  }

  const notif = document.createElement("div");
  notif.className = `notification ${type}`;
  notif.style.cssText = `
    padding: 12px 20px;
    margin: 10px;
    border-radius: 8px;
    background: ${type === "success" ? "#4CAF50" : type === "error" ? "#f44336" : "#2196F3"};
    color: white;
    font-weight: 500;
    animation: slideInRight 0.3s ease;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    font-size: 14px;
    max-width: 90%;
  `;
  notif.textContent = displayText;
  container.appendChild(notif);

  playNotificationSound(type);

  setTimeout(() => {
    notif.style.animation = "slideOutRight 0.3s ease";
    setTimeout(() => notif.remove(), 300);
  }, duration);
}

function playNotificationSound(type = "info") {
  try {
    const soundPath = notificationSounds[type];
    if (soundPath) {
      const audio = new Audio(soundPath);
      audio.play().catch(() => playBeep(type));
    } else {
      playBeep(type);
    }
  } catch (err) {
    playBeep(type);
  }
}

function playBeep(type) {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === 'error') oscillator.frequency.value = 300;
    else if (type === 'success') oscillator.frequency.value = 800;
    else oscillator.frequency.value = 500;

    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (e) {
    console.error("Audio context not supported", e);
  }
}

function announceIncomingMessage(contactName) {
  try {
    if (!window.speechSynthesis) {
      console.warn("Speech synthesis not supported");
      return;
    }

    window.speechSynthesis.cancel();

    const message = `NEXCHAT says you have an unread message in ${contactName}`;

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);

    console.log(`?? Voice notification: ${message}`);
  } catch (err) {
    console.warn("Could not play voice notification:", err);
  }
}

async function showGroupInfoPanel(groupId) {
  try {
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    if (!groupDoc.exists()) {
      showNotif('? Group not found', 'error');
      return;
    }

    const groupData = groupDoc.data();
    const members = groupData.members || [];
    const infoPic = groupData.groupPic || '??';

    const infoNameEl = document.getElementById('infoName');
    const infoPicEl = document.getElementById('infoPic');
    const infoMemberCountEl = document.getElementById('infoMemberCount');

    if (infoNameEl) infoNameEl.textContent = groupData.name || 'Group';
    if (infoPicEl) infoPicEl.src = infoPic || '??';
    if (infoMemberCountEl) infoMemberCountEl.textContent = `Group ï¿½ ${members.length} members`;

    try {
      const messagesQuery = query(
        collection(db, 'groupMessages'),
        where('groupId', '==', groupId),
        limit(50)
      );
      const messagesSnapshot = await getDocs(messagesQuery);

      const mediaItems = [];
      let mediaCount = 0;

      messagesSnapshot.forEach(doc => {
        const msg = doc.data();
        if (msg.attachment) {
          mediaCount++;
          if (mediaItems.length < 9) {
            mediaItems.push(msg.attachment);
          }
        }
      });

      document.getElementById('mediaCount').textContent = mediaCount;
      const mediaPreview = document.getElementById('mediaPreview');
      if (mediaPreview) mediaPreview.innerHTML = '';

      mediaItems.forEach(attachment => {
        if (attachment.downloadURL) {
          const item = document.createElement('div');
          item.className = 'media-item';
          if (attachment.fileType && attachment.fileType.startsWith('image/')) {
            item.innerHTML = `<img src="${attachment.downloadURL}" alt="media">`;
          } else if (attachment.fileType && attachment.fileType.startsWith('video/')) {
            item.innerHTML = `<video src="${attachment.downloadURL}"></video>`;
          } else {
            item.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #1a1a1a; color: #00ff66;"><i class="fa-solid fa-file"></i></div>`;
          }
          const mediaPreview = document.getElementById('mediaPreview');
          if (mediaPreview) mediaPreview.appendChild(item);
        }
      });
    } catch (err) {
      console.log('Media loading skipped:', err.message);
      const mediaCountEl = document.getElementById('mediaCount');
      if (mediaCountEl) mediaCountEl.textContent = '0';
    }

    const membersContent = document.getElementById('membersListContent');
    if (membersContent) membersContent.innerHTML = '';
    const adminMembers = groupData.admins || [groupData.createdBy];
    const modMembers = groupData.moderators || [];
    const mutedMembersMap = normalizeGroupMutedMembers(groupData.mutedMembers || {});

    for (const memberId of members) {
      const userDoc = await getDoc(doc(db, 'users', memberId));
      const userData = userDoc.data() || {};
      const username = userData.username || userData.name || 'Unknown';
      const isAdminMember = adminMembers.includes(memberId);
      const isModMember = modMembers.includes(memberId);
      const isYou = memberId === myUID;
      const muteInfo = mutedMembersMap[memberId];
      let muteStatus = '';
      if (muteInfo) {
        const expiresAt = muteInfo.toDate ? muteInfo.toDate() : new Date(muteInfo);
        if (expiresAt > new Date()) {
          muteStatus = ` · 🔇 Muted (${formatTimeRemaining(muteInfo)})`;
        }
      }

      const roleLabel = isAdminMember ? '👑 Admin' : (isModMember ? '🛡️ Moderator' : 'Member');

      const memberDiv = document.createElement('div');
      memberDiv.className = 'member-item';
      memberDiv.innerHTML = `
        <div class="member-avatar">${username.charAt(0).toUpperCase()}</div>
        <div class="member-info">
          <div class="member-name">${escape(username)} ${isYou ? '(You)' : ''}${muteStatus}</div>
          <div class="member-role">${roleLabel}</div>
        </div>
      `;
      if (membersContent) membersContent.appendChild(memberDiv);
    }

    const currentUserAdmins = groupData.admins || [groupData.createdBy];
    const isAdmin = currentUserAdmins.includes(myUID);

    const groupAdminActionsSection = document.getElementById('groupAdminActionsSection');
    const groupDisappearingSection = document.getElementById('groupDisappearingSection');
    const groupMuteMembersSection = document.getElementById('groupMuteMembersSection');
    const groupApprovalSection = document.getElementById('groupApprovalSection');
    const approvalStatusText = document.getElementById('approvalStatusText');
    const groupApprovalToggle = document.getElementById('groupApprovalToggle');

    if (groupAdminActionsSection) {
      groupAdminActionsSection.style.display = isAdmin ? 'block' : 'none';
    }
    if (groupDisappearingSection) {
      groupDisappearingSection.style.display = isAdmin ? 'block' : 'none';
    }
    if (groupMuteMembersSection) {
      groupMuteMembersSection.style.display = isAdmin ? 'block' : 'none';
    }
    if (groupApprovalSection) {
      groupApprovalSection.style.display = isAdmin ? 'block' : 'none';
    }
    if (approvalStatusText) {
      approvalStatusText.textContent = (groupData.privacy === 'private' || groupData.approval === 'admin') ? 'Admin approval required' : 'Anyone can join freely';
    }
    if (groupApprovalToggle) {
      groupApprovalToggle.checked = groupData.approval === 'admin';
      groupApprovalToggle.onchange = async () => {
        try {
          const newApproval = groupApprovalToggle.checked ? 'admin' : 'auto';
          await updateDoc(doc(db, 'groups', groupId), { approval: newApproval });
          approvalStatusText.textContent = newApproval === 'admin' ? 'Admin approval required' : 'Anyone can join freely';
          showNotif('? Group join approval setting updated', 'success');
          await loadGroupPendingRequests(groupId);
        } catch (updateError) {
          console.error('Error updating group approval setting:', updateError);
          showNotif('? Could not update approval setting', 'error');
          groupApprovalToggle.checked = !groupApprovalToggle.checked;
        }
      };
    }

    const disappearingToggle = document.getElementById('disappearingToggle');
    const disappearingDurationRow = document.getElementById('disappearingDurationRow');
    const disappearingDurationSelect = document.getElementById('disappearingDurationSelect');
    const disappearingConfig = groupData.disappearingMessages || { enabled: false, durationMinutes: 60 };
    if (disappearingToggle) disappearingToggle.checked = !!disappearingConfig.enabled;
    if (disappearingDurationSelect) disappearingDurationSelect.value = disappearingConfig.durationMinutes || 60;
    if (disappearingDurationRow) {
      disappearingDurationRow.style.display = disappearingConfig.enabled ? 'flex' : 'none';
    }

    if (isAdmin) {
      await loadGroupPendingRequests(groupId);
    }

    const infoSidebarEl = document.getElementById('infoSidebar');
    const membersListEl = document.getElementById('membersList');
    if (infoSidebarEl) infoSidebarEl.style.display = 'block';
    if (membersListEl) membersListEl.style.display = 'block';

  } catch (error) {
    console.error('Error showing group info panel:', error);
    showNotif('Error loading group info: ' + error.message, 'error');
  }
}

async function showUserInfoPanel(userId) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      showNotif('? User not found', 'error');
      return;
    }

    const userData = userDoc.data();

    const infoNameEl = document.getElementById('infoName');
    const infoPicEl = document.getElementById('infoPic');
    const infoMemberCountEl = document.getElementById('infoMemberCount');

    if (infoNameEl) infoNameEl.textContent = userData.username || userData.name || 'User';
    if (infoPicEl) infoPicEl.src = userData.profilePic || userData.profilePicUrl || '??';
    if (infoMemberCountEl) infoMemberCountEl.textContent = userData.email || 'User Profile';

    const membersListEl = document.getElementById('membersList');
    if (membersListEl) membersListEl.style.display = 'none';

    if (typeof myUID !== 'undefined' && myUID) {
      try {
        const myDoc = await getDoc(doc(db, 'users', myUID));
        if (myDoc.exists()) {
          const myData = myDoc.data();
          const blockedUsers = myData.blockedUsers || [];
          const mutedUsers = myData.mutedUsers || [];

          const isBlocked = blockedUsers.includes(userId);
          const isMuted = mutedUsers.includes(userId);

          const blockBtn = document.getElementById('infoBlockBtn');
          const unblockBtn = document.getElementById('infoUnblockBtn');
          const muteToggle = document.getElementById('muteUserToggle');

          if (blockBtn && unblockBtn) {
            if (isBlocked) {
              blockBtn.style.display = 'none';
              unblockBtn.style.display = 'flex';
            } else {
              blockBtn.style.display = 'flex';
              unblockBtn.style.display = 'none';
            }
          }

          if (muteToggle) {
            muteToggle.checked = isMuted;
          }
        }
      } catch (e) {
        console.error("Error checking user status:", e);
      }
    }

    const infoSidebarEl = document.getElementById('infoSidebar');
    if (infoSidebarEl) infoSidebarEl.style.display = 'block';

  } catch (error) {
    console.error('Error showing user info panel:', error);
    showNotif('Error loading user info: ' + error.message, 'error');
  }
}

document.getElementById('closeInfoBtn')?.addEventListener('click', () => {
  document.getElementById('infoSidebar').style.display = 'none';
});

document.getElementById('closeInfoBtn2')?.addEventListener('click', () => {
  document.getElementById('infoSidebar').style.display = 'none';
});

async function showGroupAdminPanel(groupId) {
  try {
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    if (!groupDoc.exists()) {
      showNotif('? Group not found', 'error');
      return;
    }

    const groupData = groupDoc.data();
    const adminMembers = groupData.admins || [groupData.createdBy];

    if (!adminMembers.includes(myUID)) {
      showNotif('? Only admins can manage members', 'error');
      return;
    }

    let adminPanel = document.getElementById('groupAdminPanel');
    if (!adminPanel) {
      adminPanel = document.createElement('div');
      adminPanel.id = 'groupAdminPanel';
      document.body.appendChild(adminPanel);
    }

    const members = groupData.members || [];
    const suspendedMembers = groupData.suspendedMembers || [];

    let membersHTML = '<div style="max-height: 400px; overflow-y: auto;">';

    for (const memberId of members) {
      if (memberId === myUID) continue; // Don't show controls for self

      const userDoc = await getDoc(doc(db, 'users', memberId));
      const userData = userDoc.data() || {};
      const username = userData.username || userData.name || memberId;
      const isSuspended = suspendedMembers.includes(memberId);
      const isAdmin = adminMembers.includes(memberId);

      const suspendStatus = isSuspended ? '?? Suspended' : '? Active';
      const adminBadge = isAdmin ? ' ??' : '';

      membersHTML += `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; border-bottom: 1px solid #00ff66; gap: 10px;">
          <div style="flex: 1; min-width: 0;">
            <p style="margin: 0; font-weight: 600; color: #00ff66;">${escape(username)}${adminBadge}</p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: ${isSuspended ? '#ff6b6b' : '#4CAF50'};">${suspendStatus}</p>
          </div>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            ${!isAdmin ? `<button onclick="promoteToAdmin('${groupId}', '${memberId}')" style="padding: 6px 10px; background: #00d4ff; color: #000; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">?? Promote</button>` : '<span style="color: #00ff66; font-size: 12px;">Admin</span>'}\n            <button onclick="toggleSuspendMember('${groupId}', '${memberId}', ${isSuspended})" style="padding: 6px 10px; background: ${isSuspended ? '#4CAF50' : '#ff6b6b'}; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">${isSuspended ? '? Unsuspend' : '?? Suspend'}</button>\n            <button onclick="kickMember('${groupId}', '${memberId}')" style="padding: 6px 10px; background: #ff4444; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">? Kick</button>\n          </div>\n        </div>\n      `;
    }
    membersHTML += '</div>';

    adminPanel.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 1000;" onclick="document.getElementById('groupAdminPanel').style.display='none'">
        <div style="background: #0a0f1a; border: 2px solid #00ff66; border-radius: 12px; padding: 20px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;" onclick="event.stopPropagation()">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 style="margin: 0; color: #00ff66;">?? Manage Members</h3>\n            <button onclick="document.getElementById('groupAdminPanel').style.display='none'" style="background: none; border: none; color: #00ff66; font-size: 24px; cursor: pointer;">ï¿½</button>\n          </div>\n          ${membersHTML}\n        </div>\n      </div>\n    `;
    adminPanel.style.display = 'block';
  } catch (error) {
    console.error('Error showing admin panel:', error);
    showNotif('Error loading admin panel: ' + error.message, 'error');
  }
}

async function toggleSuspendMember(groupId, memberId, currentlySuspended) {
  try {
    const groupRef = doc(db, 'groups', groupId);
    const groupDoc = await getDoc(groupRef);
    const groupData = groupDoc.data() || {};
    let suspendedMembers = groupData.suspendedMembers || [];

    if (currentlySuspended) {
      suspendedMembers = suspendedMembers.filter(id => id !== memberId);
      await updateDoc(groupRef, { suspendedMembers });
      showNotif('? Member unsuspended', 'success');
    } else {
      if (!suspendedMembers.includes(memberId)) {
        suspendedMembers.push(memberId);
      }
      await updateDoc(groupRef, { suspendedMembers });
      showNotif('? Member suspended', 'success');
    }

    await showGroupAdminPanel(groupId);
  } catch (error) {
    console.error('Error toggling suspend:', error);
    showNotif('Error: ' + error.message, 'error');
  }
}

async function promoteToAdmin(groupId, memberId) {
  try {
    const groupRef = doc(db, 'groups', groupId);
    const groupDoc = await getDoc(groupRef);
    const groupData = groupDoc.data() || {};
    let admins = groupData.admins || [groupData.createdBy];

    if (!admins.includes(memberId)) {
      admins.push(memberId);
    }

    await updateDoc(groupRef, { admins });
    showNotif('?? Member promoted to admin', 'success');

    await showGroupAdminPanel(groupId);
  } catch (error) {
    console.error('Error promoting member:', error);
    showNotif('Error: ' + error.message, 'error');
  }
}

async function kickMember(groupId, memberId) {
  try {
    if (!confirm('Are you sure you want to kick this member?')) return;

    const groupRef = doc(db, 'groups', groupId);
    const groupDoc = await getDoc(groupRef);
    const groupData = groupDoc.data() || {};
    let members = groupData.members || [];
    let admins = groupData.admins || [groupData.createdBy];

    members = members.filter(id => id !== memberId);

    admins = admins.filter(id => id !== memberId);

    await updateDoc(groupRef, {
      members,
      admins
    });

    showNotif('? Member kicked from group', 'success');

    await showGroupAdminPanel(groupId);
  } catch (error) {
    console.error('Error kicking member:', error);
    showNotif('Error: ' + error.message, 'error');
  }
}

function setupMentionInput() {
  const input = document.getElementById('message-input');
  if (!input || currentChatType !== 'group') {
    console.log("Mention input setup skipped - not a group chat or input missing");
    return;
  }

  if (input.dataset.mentionListenerAttached === 'true') {
    console.log("Mention listener already attached, skipping");
    return;
  }

  input.addEventListener('keyup', (e) => {
    const text = input.value;
    const lastAtIndex = text.lastIndexOf('@');

    if (lastAtIndex !== -1 && lastAtIndex === text.length - 1) {
      showMentionPopup(input);
    } else if (lastAtIndex !== -1) {
      const afterAt = text.substring(lastAtIndex + 1);
      if (afterAt.match(/^\w*$/)) {
        filterMentionPopup(afterAt);
      } else if (afterAt.includes(' ')) {
        hideMentionPopup();
      }
    } else {
      hideMentionPopup();
    }
  });

  input.dataset.mentionListenerAttached = 'true';
  console.log("? Mention input listener attached");
}

function showMentionPopup(input) {
  let popup = document.getElementById('mentionPopup');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'mentionPopup';
    document.body.appendChild(popup);
  }

  let html = '<div style="position: fixed; background: #1a1f3a; border: 1px solid #00ff66; border-radius: 8px; max-height: 200px; overflow-y: auto; z-index: 500; padding: 8px; min-width: 150px;">';

  groupMembers.forEach(member => {
    if (member.uid !== myUID) {
      html += `
        <div onclick="insertMention('${member.username || member.name}')" style="padding: 8px; cursor: pointer; color: #00ff66; border-radius: 4px;">
          ${escape(member.username || member.name)} <span style="color: #00d4ff; font-size: 11px;">(${escape(member.uid)})</span>
        </div>
      `;
    }
  });

  html += '</div>';
  popup.innerHTML = html;
  popup.style.display = 'block';
  mentionPopupOpen = true;

  const rect = input.getBoundingClientRect();
  popup.style.top = (rect.top - 220) + 'px';
  popup.style.left = rect.left + 'px';
}

function filterMentionPopup(filter) {
  const popup = document.getElementById('mentionPopup');
  if (!popup) return;

  const filtered = groupMembers.filter(m =>
    (m.username || m.name).toLowerCase().includes(filter.toLowerCase()) && m.uid !== myUID
  );

  if (filtered.length === 0) {
    popup.style.display = 'none';
    return;
  }

  let html = '<div style="position: fixed; background: #1a1f3a; border: 1px solid #00ff66; border-radius: 8px; max-height: 200px; overflow-y: auto; z-index: 500; padding: 8px; min-width: 150px;">';

  filtered.forEach(member => {
    html += `
      <div onclick="insertMention('${member.username || member.name}')" style="padding: 8px; cursor: pointer; color: #00ff66; border-radius: 4px; background: rgba(0, 255, 102, 0.1);">
        ${escape(member.username || member.name)}
      </div>
    `;
  });

  html += '</div>';
  popup.innerHTML = html;
  popup.style.display = 'block';
}

function hideMentionPopup() {
  const popup = document.getElementById('mentionPopup');
  if (popup) {
    popup.style.display = 'none';
  }
  mentionPopupOpen = false;
}

function insertMention(username) {
  const input = document.getElementById('message-input');
  if (!input) return;

  const text = input.value;
  const lastAtIndex = text.lastIndexOf('@');

  if (lastAtIndex !== -1) {
    const beforeAt = text.substring(0, lastAtIndex);
    const afterAt = text.substring(lastAtIndex + 1);
    const afterSpace = afterAt.includes(' ') ? afterAt.substring(afterAt.indexOf(' ')) : '';

    input.value = beforeAt + '@' + username + ' ' + afterSpace;
    input.focus();
    hideMentionPopup();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  let container = document.getElementById('notificationContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notificationContainer';
    container.className = 'notification-container';
    document.body.appendChild(container);
    console.warn('?? `notificationContainer` was missing. Created fallback container.');
  }

  window.testNotif = function (msg = 'Test notification', type = 'info', duration = 3000) {
    try {
      showNotif(msg, type, duration);
    } catch (e) {
      console.error('Failed to show test notification:', e);
    }
  };

  const initAudioOnInteraction = () => {
    initializeAudio();
    document.removeEventListener('click', initAudioOnInteraction);
    document.removeEventListener('touchstart', initAudioOnInteraction);
    document.removeEventListener('keydown', initAudioOnInteraction);
  };

  document.addEventListener('click', initAudioOnInteraction);
  document.addEventListener('touchstart', initAudioOnInteraction);
  document.addEventListener('keydown', initAudioOnInteraction);

  const requestNotificationsOnInteraction = async () => {
    await requestNotificationPermission();
    document.removeEventListener('click', requestNotificationsOnInteraction);
    document.removeEventListener('touchstart', requestNotificationsOnInteraction);
    document.removeEventListener('keydown', requestNotificationsOnInteraction);
  };

  document.addEventListener('click', requestNotificationsOnInteraction);
  document.addEventListener('touchstart', requestNotificationsOnInteraction);
  document.addEventListener('keydown', requestNotificationsOnInteraction);

  window.testRingtone = function(ringtone = 'skype') {
    console.log(`Testing ${ringtone} ringtone...`);
    startRinging(ringtone);
    setTimeout(() => stopRinging(), 3000);
  };
});


function escape(text) {
  const div = document.createElement("div");
  div.textContent = text || "";
  return div.innerHTML;
}

function formatTime(timestamp) {
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(timestamp) {
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

let isLoadContactsRunning = false;
const debouncedLoadContacts = debounce(async function () {
  if (isLoadContactsRunning) return;
  isLoadContactsRunning = true;
  try {
    await loadContacts();
  } catch (err) {
    console.error('Error during debounced loadContacts:', err);
  } finally {
    isLoadContactsRunning = false;
  }
}, 400);

function safeLoadContacts() {
  if (isLoadContactsRunning) return;
  debouncedLoadContacts();
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function showChatListView() {
  try { GroupChat.close(); } catch(e) {}
  const listView = document.getElementById("chatListView");
  const detailView = document.getElementById("chatDetailView");
  const statusContainer = document.getElementById("statusContainer");
  const groupsContainer = document.getElementById("groupsContainer");
  const announcementsContainer = document.getElementById("announcementsContainer");
  const callHistoryContainer = document.getElementById("callHistoryContainer");
  const bottomNav = document.querySelector(".bottom-nav");
  if (listView) {
    listView.classList.remove("hidden");
    listView.style.display = "flex";
    listView.style.zIndex = "10";
  }
  if (detailView) {
    detailView.classList.add("hidden");
    detailView.classList.remove("visible", "entering");
    detailView.style.display = "none";
    detailView.style.zIndex = "0";
  }
  if (groupsContainer) {
    groupsContainer.style.display = "none";
  }
  if (announcementsContainer) {
    announcementsContainer.style.display = "none";
  }
  if (callHistoryContainer) {
    callHistoryContainer.style.display = "none";
  }
  if (statusContainer) {
    statusContainer.style.display = "none";
  }
  if (bottomNav) {
    bottomNav.style.display = "flex";
  }
  const activeChatHeader = document.getElementById('activeChatHeader');
  const headerLogoContainer = document.getElementById('headerLogoContainer');
  if (activeChatHeader) activeChatHeader.style.display = 'none';
  if (headerLogoContainer) headerLogoContainer.style.display = 'flex';

  const fab = document.getElementById('mobileFabNewChat');
  if (fab) fab.style.display = 'flex';
  hideTypingIndicator();
  clearTypingStatus();
  if (typingStatusUnsubscribe) {
    typingStatusUnsubscribe();
    typingStatusUnsubscribe = null;
  }
  if (userStatusUnsubscribe) {
    userStatusUnsubscribe();
    userStatusUnsubscribe = null;
  }

  if (window.loadUserBackground) window.loadUserBackground();
}



async function archiveChat(chatId) {
  try {
    const userRef = doc(db, "users", myUID);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const archivedChats = userDoc.data().archivedChats || [];
      if (!archivedChats.includes(chatId)) {
        archivedChats.push(chatId);
        await updateDoc(userRef, {
          archivedChats: archivedChats
        });
        showNotif("? Chat archived", "success", 1500);
        loadContacts(); // Reload to update UI
      }
    }
  } catch (err) {
    console.error("Error archiving chat:", err);
    showNotif("? Failed to archive chat", "error");
  }
}

async function blockUser(userId) {
  if (!userId) return;
  try {
    const userRef = doc(db, "users", myUID);
    await updateDoc(userRef, {
      blockedUsers: arrayUnion(userId)
    });
    showNotif("?? User blocked", "success", 1500);
    safeLoadContacts();
  } catch (err) {
    console.error("Error blocking user:", err);
    showNotif("? Failed to block user", "error");
  }
}

async function unblockUser(userId) {
  if (!userId) return;
  try {
    const userRef = doc(db, "users", myUID);
    await updateDoc(userRef, {
      blockedUsers: arrayRemove(userId)
    });
    showNotif("? User unblocked", "success", 1500);
    safeLoadContacts();
  } catch (err) {
    console.error("Error unblocking user:", err);
    showNotif("? Failed to unblock user", "error");
  }
}

async function muteUser(userId) {
  if (!userId) return;
  try {
    const userRef = doc(db, "users", myUID);
    await updateDoc(userRef, {
      mutedUsers: arrayUnion(userId)
    });
    showNotif("?? User muted", "success", 1500);
    safeLoadContacts();
  } catch (err) {
    console.error("Error muting user:", err);
    showNotif("? Failed to mute user", "error");
  }
}

async function unmuteUser(userId) {
  if (!userId) return;
  try {
    const userRef = doc(db, "users", myUID);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      let mutedUsers = userDoc.data().mutedUsers || [];
      mutedUsers = mutedUsers.filter(id => id !== userId);
      await updateDoc(userRef, {
        mutedUsers: mutedUsers
      });
      showNotif("?? User unmuted", "success", 1500);
      safeLoadContacts();
    }
  } catch (err) {
    console.error("Error unmuting user:", err);
    showNotif("? Failed to unmute user", "error");
  }
}

async function isUserMuted(userId) {
  if (!userId) return false;
  try {
    const userRef = doc(db, "users", myUID);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) return false;
    const mutedUsers = userDoc.data().mutedUsers || [];
    return mutedUsers.includes(userId);
  } catch (err) {
    console.error("Error checking user mute status:", err);
    return false;
  }
}

async function isUserBlocked(userId) {
  if (!userId) return false;
  try {
    const userRef = doc(db, "users", myUID);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) return false;
    const blockedUsers = userDoc.data().blockedUsers || [];
    return blockedUsers.includes(userId);
  } catch (err) {
    console.error("Error checking block status:", err);
    return false;
  }
}

async function unarchiveChat(chatId) {
  try {
    const userRef = doc(db, "users", myUID);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      let archivedChats = userDoc.data().archivedChats || [];
      archivedChats = archivedChats.filter(id => id !== chatId);

      await updateDoc(userRef, {
        archivedChats: archivedChats
      });

      showNotif("? Chat unarchived", "success", 1500);
      loadContacts(); // Reload to update UI
    }
  } catch (err) {
    console.error("Error unarchiving chat:", err);
    showNotif("? Failed to unarchive chat", "error");
  }
}

function handleNavigation(section) {
  if (section === "video") {
    alert("?? NEXHAT-DEVELOPERS ARE WORKIN ON IT. Stay tuned!");
    return;
  }

  const chatListView = document.getElementById("chatListView");
  const statusContainer = document.getElementById("statusContainer");
  const groupsContainer = document.getElementById("groupsContainer");
  const announcementsContainer = document.getElementById("announcementsContainer");
  const chatDetailView = document.getElementById("chatDetailView");
  const callHistoryContainer = document.getElementById("callHistoryContainer");

  if (chatListView) chatListView.style.display = "none";
  if (statusContainer) statusContainer.style.display = "none";
  if (groupsContainer) groupsContainer.style.display = "none";
  if (announcementsContainer) announcementsContainer.style.display = "none";
  if (chatDetailView) chatDetailView.style.display = "none";
  if (callHistoryContainer) callHistoryContainer.style.display = "none";

  switch (section) {
    case "chats":
      console.log("?? Showing chats");
      if (chatListView) chatListView.style.display = "block";
      break;
    case "updates":
      console.log("? Showing statuses");
      if (statusContainer) statusContainer.style.display = "block";
      loadStatusFeed();
      break;
    case "communities":
      console.log("?? Showing groups");
      if (groupsContainer) groupsContainer.style.display = "block";
      loadGroups();
      break;
    case "announcements":
      console.log("?? Showing announcements");
      if (announcementsContainer) announcementsContainer.style.display = "flex";
      loadAnnouncements();
      break;
    case "games":
      console.log("?? Opening Gaming Hub");
      window.open("gaminghub.html", "_blank");
      showNotif("?? Nex Gaming Hub opened in new window", "success");
      break;
    case "marketplace":
      console.log("??? Opening Marketplace");
      window.open("advertisement.html", "_blank");
      showNotif("??? Nex Marketplace opened in new window", "success");
      break;
    case "calls":
      console.log("?? Showing call history");
      if (callHistoryContainer) {
        callHistoryContainer.style.display = "block";
        loadCallHistory();
      }
      break;
  }
}

async function showChatContextMenu(event, chatId) {
  const existingMenu = document.querySelector(".chat-context-menu");
  if (existingMenu) {
    existingMenu.remove();
  }

  const isMuted = await isChatMuted(chatId);

  const menu = document.createElement("div");
  menu.className = "chat-context-menu";

  let chatItem = null;
  try {
    const escapedChatId = typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(chatId) : chatId;
    chatItem = document.querySelector(`li[data-chat-id="${escapedChatId}"]`);
  } catch (error) {
    chatItem = null;
  }

  if (!chatItem) {
    const allItems = document.querySelectorAll('li[data-chat-id]');
    allItems.forEach(item => {
      if (item.getAttribute('data-chat-id') === chatId) {
        chatItem = item;
      }
    });
  }

  if (chatItem) {
    chatItem.style.position = "relative";
    chatItem.appendChild(menu);
    menu.style.cssText = `
      position: absolute;
      top: calc(100% + 5px);
      right: 0;
      background: #1a1a1a;
      border: 2px solid #00ff66;
      border-radius: 8px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      min-width: 180px;
    `;
  } else {
    menu.style.cssText = `
      position: fixed;
      top: ${event.clientY}px;
      left: ${event.clientX}px;
      background: #1a1a1a;
      border: 2px solid #00ff66;
      border-radius: 8px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      min-width: 180px;
    `;
    document.body.appendChild(menu);
    return;
  }

  const createMenuBtn = (text, color = "#00ff66", borderTop = false) => {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.style.cssText = `
      width: 100%;
      padding: 10px;
      background: transparent;
      border: none;
      color: ${color};
      cursor: pointer;
      text-align: left;
      font-size: 14px;
      transition: all 0.2s;
      ${borderTop ? 'border-top: 1px solid #333;' : ''}
    `;
    btn.onmouseover = () => {
      btn.style.background = `${color}20`;
    };
    btn.onmouseout = () => {
      btn.style.background = "transparent";
    };
    return btn;
  };

  const isFavorite = document.querySelector(`li[data-chat-id="${chatId}"]`)?.dataset.favorite === "true";
  const favoriteBtn = createMenuBtn(isFavorite ? "?? Unfavorite" : "? Favorite", "#ffd700");
  favoriteBtn.onclick = async () => {
    await toggleFavorite(chatId);
    menu.remove();
  };
  menu.appendChild(favoriteBtn);

  const muteBtn = createMenuBtn(
    isMuted ? "?? Unmute" : "?? Mute",
    isMuted ? "#00ff66" : "#ffa500",
    true
  );
  muteBtn.onclick = async () => {
    if (isMuted) {
      await unmuteChat(chatId);
    } else {
      await muteChat(chatId);
    }
    menu.remove();
  };
  menu.appendChild(muteBtn);

  const isGroup = document.querySelector(`li[data-chat-id="${chatId}"] .group-avatar`) !== null;
  let isUserChat = !isGroup && chatId !== 'chronex-ai';

  if (isUserChat) {
    const [userBlocked, userMuted] = await Promise.all([
      isUserBlocked(chatId),
      isUserMuted(chatId)
    ]);

    const muteUserBtn = createMenuBtn(
      userMuted ? "?? Unmute User" : "?? Mute User",
      userMuted ? "#00ff66" : "#ffa500",
      true
    );
    muteUserBtn.onclick = async () => {
      if (userMuted) {
        await unmuteUser(chatId);
      } else {
        await muteUser(chatId);
      }
      menu.remove();
    };
    menu.appendChild(muteUserBtn);

    const blockBtn = createMenuBtn(
      userBlocked ? "? Unblock User" : "?? Block User",
      userBlocked ? "#00ff66" : "#ff4d4d",
      true
    );
    blockBtn.onclick = async () => {
      if (userBlocked) {
        await unblockUser(chatId);
      } else {
        if (!confirm("?? Block this user? You will no longer receive messages from them.")) return;
        await blockUser(chatId);
      }
      menu.remove();
    };
    menu.appendChild(blockBtn);
  }

  if (isGroup) {
    const infoBtn = createMenuBtn("?? Group Info", "#00d4ff", true);
    infoBtn.onclick = () => {
      showGroupInfoPanel(chatId);
      menu.remove();
    };
    menu.appendChild(infoBtn);
  }

  const wallpaperBtn = createMenuBtn("🎨 Wallpaper", "#00ff88", true);
  wallpaperBtn.onclick = () => {
    menu.remove();
    if (typeof window.openChatWallpaperPicker === 'function') {
      window.openChatWallpaperPicker(chatId, currentChatName, isGroup);
    }
  };
  menu.appendChild(wallpaperBtn);

  const archiveBtn = createMenuBtn("📁 Archive", "#00ff66", true);
  archiveBtn.onclick = async () => {
    await archiveChat(chatId);
    menu.remove();
  };
  menu.appendChild(archiveBtn);


  const deleteBtn = createMenuBtn("??? Delete", "#ff6b6b", true);
  deleteBtn.onclick = async () => {
    if (confirm("Are you sure you want to delete this chat? This will remove it from your list.")) {
      await deleteChat(chatId);
      menu.remove();
    }
  };
  menu.appendChild(deleteBtn);

  setTimeout(() => {
    document.addEventListener("click", function closeMenu(e) {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener("click", closeMenu);
      }
    });
  }, 0);
}

async function toggleFavorite(chatId) {
  try {
    const userRef = doc(db, "users", myUID);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      let favorites = userDoc.data().favorites || [];
      const index = favorites.indexOf(chatId);

      if (index === -1) {
        favorites.push(chatId);
        showNotif("? Added to favorites", "success", 1500);
      } else {
        favorites.splice(index, 1);
        showNotif("?? Removed from favorites", "info", 1500);
      }

      await updateDoc(userRef, { favorites });

      const item = document.querySelector(`li[data-chat-id="${chatId}"]`);
      if (item) {
        item.dataset.favorite = (index === -1) ? "true" : "false";
        safeLoadContacts();
      } else {
        safeLoadContacts();
      }
    }
  } catch (err) {
    console.error("Error toggling favorite:", err);
    showNotif("? Failed to update favorite", "error");
  }
}

async function muteChat(chatId) {
  try {
    const userRef = doc(db, "users", myUID);
    await updateDoc(userRef, {
      mutedChats: arrayUnion(chatId)
    });
    showNotif("?? Chat muted", "success", 1500);
    safeLoadContacts();
  } catch (err) {
    console.error("Error muting chat:", err);
    showNotif("? Failed to mute chat", "error");
  }
}

async function unmuteChat(chatId) {
  try {
    const userRef = doc(db, "users", myUID);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      let mutedChats = userDoc.data().mutedChats || [];
      mutedChats = mutedChats.filter(id => id !== chatId);

      await updateDoc(userRef, {
        mutedChats: mutedChats
      });
      showNotif("?? Chat unmuted", "success", 1500);
      safeLoadContacts();
    }
  } catch (err) {
    console.error("Error unmuting chat:", err);
    showNotif("? Failed to unmute chat", "error");
  }
}

async function isChatMuted(chatId) {
  try {
    const userRef = doc(db, "users", myUID);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const mutedChats = userDoc.data().mutedChats || [];
      return mutedChats.includes(chatId);
    }
    return false;
  } catch (err) {
    console.error("Error checking mute status:", err);
    return false;
  }
}

window.addEventListener("load", () => {
  const savedDarkMode = localStorage.getItem("darkMode");
  if (savedDarkMode === "true") {
    document.body.classList.add("dark-mode");
    document.body.classList.remove("light-mode");
  } else {
    document.body.classList.add("light-mode");
    document.body.classList.remove("dark-mode");
  }
});

async function autoPopulateTestUsers() {
  try {
    const usersRef = collection(db, "users");
    const snap = await getDocs(usersRef);

    if (snap.docs.length === 0) {
      console.log("?? Database is empty - auto-populating test users...");

      const testUsers = [
        {
          uid: "test_user_001",
          email: "alex@gmail.com",
          name: "Alex Johnson",
          username: "alexjohnson",
          online: true,
          tokens: 1000,
          createdAt: new Date().toISOString()
        },
        {
          uid: "test_user_002",
          email: "sara@gmail.com",
          name: "Sara Ahmed",
          username: "saraahmed",
          online: true,
          tokens: 1000,
          createdAt: new Date().toISOString()
        },
        {
          uid: "test_user_003",
          email: "john@gmail.com",
          name: "John Smith",
          username: "johnsmith",
          online: false,
          tokens: 1000,
          createdAt: new Date().toISOString()
        },
        {
          uid: "test_user_004",
          email: "emma@gmail.com",
          name: "Emma Wilson",
          username: "emmawilson",
          online: true,
          tokens: 1000,
          createdAt: new Date().toISOString()
        }
      ];

      for (const user of testUsers) {
        const { uid, ...userData } = user;
        try {
          await setDoc(doc(db, "users", uid), userData);
          console.log("? Created test user:", uid, userData.name);
        } catch (err) {
          console.error("? Failed to create test user:", uid, err);
        }
      }

      showNotif("? Test users auto-created! Ready to test search.", "success", 3000);
    }
  } catch (err) {
    console.error("Error in auto-populate:", err);
  }
}

function openSearch() {
  console.log("?? Opening search...");
  console.log("?? Current myUID:", myUID);

  if (!myUID) {
    console.error("? User not authenticated! Waiting for auth...");
    showNotif("Please wait, loading user data...", "info");
    return;
  }

  const overlay = document.getElementById("search-overlay");
  const modal = document.getElementById("search-modal");
  const input = document.getElementById("search-input");
  const resultsDiv = document.getElementById("search-results");

  if (!overlay || !modal || !input) {
    console.error("? Search elements not found!");
    showNotif("Search not available", "error");
    return;
  }

  overlay.style.display = "flex";
  modal.style.display = "flex";

  if (isAndroid) {
    document.body.classList.add('android-device');
  }

  if (resultsDiv) {
    resultsDiv.innerHTML = "<div style='padding: 16px; text-align: center; color: #ffa500;'>? Loading users...</div>";
  }

  loadAllUsers();

  input.focus();
  input.select();
  console.log("? Search opened and input focused");
}

function browseAllUsers() {
  loadAllUsers();
}

async function loadAllUsers() {
  console.log("?? Loading all users and groups...");
  console.log("?? myUID at loadAllUsers:", myUID);

  const resultsDiv = document.getElementById("search-results");

  if (!resultsDiv) {
    console.error("? Search results div not found!");
    return;
  }

  if (!myUID) {
    console.warn("?? User not authenticated yet");
    showNotif("Please wait, authenticating...", "info");
    resultsDiv.innerHTML = "<div style='padding: 16px; text-align: center; color: #ffa500;'>? Loading user data...</div>";

    let retries = 0;
    while (!myUID && retries < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }

    if (!myUID) {
      console.error("? Failed to authenticate");
      resultsDiv.innerHTML = "<div style='padding: 16px; text-align: center; color: #ff4d4d;'>? Error: Not authenticated. Please refresh the page.</div>";
      showNotif("Authentication failed. Please refresh.", "error");
      return;
    }

    console.log("? Auth completed after waiting");
  }

  try {
    console.log("?? Querying Firestore users collection...");
    const usersRef = collection(db, "users");
    const q = query(usersRef, limit(50));
    const snap = await getDocs(q);

    let allUsers = [];

    console.log("?? Total users in Firestore:", snap.docs.length);
    snap.forEach(docSnap => {
      const user = docSnap.data();
      const uid = docSnap.id;
      user.uid = uid;
      user.isGroup = false;

      console.log(`?? Processing user from Firestore - ID: ${uid}, Username: ${user.username}`);

      if (uid !== myUID) {
        allUsers.push(user);
      }
    });

    console.log("?? Loading groups...");
    try {
      const groupsRef = collection(db, "groups");
      const groupsQuery = query(groupsRef, where("members", "array-contains", myUID));
      const groupsSnap = await getDocs(groupsQuery);

      console.log("?? Total groups:", groupsSnap.docs.length);
      groupsSnap.forEach(docSnap => {
        const group = docSnap.data();
        group.uid = docSnap.id;
        group.id = docSnap.id;
        group.isGroup = true;
        group.type = 'group';

        console.log(`?? Processing group - ID: ${group.uid}, Name: ${group.name}, Members: ${group.members?.length}`);
        allUsers.push(group);
      });
    } catch (groupErr) {
      console.warn("?? Could not fetch groups:", groupErr);
    }

    console.log("?? Checking Realtime Database...");
    try {
      const rtdbRef = ref(rtdb, 'users');
      const rtdbSnap = await get(rtdbRef);
      if (rtdbSnap.exists()) {
        const rtdbUsers = rtdbSnap.val();
        console.log("?? Total users in Realtime DB:", Object.keys(rtdbUsers).length);

        Object.entries(rtdbUsers).forEach(([uid, userData]) => {
          console.log(`?? Processing user from RTDB - ID: ${uid}, Username: ${userData.username}`);

          if (uid !== myUID && !allUsers.find(u => u.uid === uid)) {
            userData.uid = uid;
            userData.isGroup = false;
            allUsers.push(userData);
          }
        });
      }
    } catch (rtdbErr) {
      console.warn("?? Could not fetch from Realtime Database:", rtdbErr);
    }

    console.log("?? Total unique items found:", allUsers.length);

    if (allUsers.length === 0) {
      console.warn("No users or groups found");
      resultsDiv.innerHTML = "<div style='padding: 16px; text-align: center; color: #999; font-size: 14px;'>No users or groups found yet.</div>";
      return;
    }

    resultsDiv.innerHTML = ""; // Clear previous results

    allUsers.forEach(item => {
      const resultItem = document.createElement("div");
      resultItem.className = "search-result-item";
      resultItem.style.cssText = `
        padding: 14px;
        border: 1.5px solid rgba(0, 255, 102, 0.3);
        border-radius: 12px;
        margin: 10px;
        cursor: pointer;
        background: linear-gradient(135deg, rgba(10, 15, 26, 0.8), rgba(0, 255, 102, 0.05));
        color: #fff;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        gap: 12px;
      `;

      const displayName = item.name || item.username || item.email || item.uid || "Unknown User";
      const profilePic = item.isGroup ? '👥' : (item.profilePic || item.profilePicUrl || null);
      const userHeadline = !item.isGroup && item.username ? `@${escape(item.username)}` : escape(displayName);
      const userDetails = !item.isGroup && item.name && item.username && item.name !== item.username ? `<p style="margin: 6px 0 0 0; color: #00d4ff; font-size: 11px; word-break: break-all;"><strong>Name:</strong> ${escape(item.name)}</p>` : '';

      console.log(`?? Creating UI for: ${displayName}, isGroup: ${item.isGroup}, has profilePic: ${!!profilePic}`);

      let profileHTML = '';
      if (!item.isGroup && typeof profilePic === 'string' && (profilePic.startsWith('data:') || profilePic.startsWith('http'))) {
        profileHTML = `<img src="${escape(profilePic)}" alt="${escape(displayName)}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #00ff66; flex-shrink: 0;">`;
      } else {
        const bgColor = item.isGroup ? '#00d4ff' : '#00ff66';
        const icon = item.isGroup ? '👥' : displayName.charAt(0).toUpperCase();
        profileHTML = `<div style="width: 50px; height: 50px; border-radius: 50%; background: ${bgColor}; color: #000; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 20px; flex-shrink: 0;">${icon}</div>`;
      }

      const statusLabel = item.isGroup
        ? `<span style="font-size: 11px; padding: 2px 8px; border-radius: 4px; white-space: nowrap; font-weight: 600; background: rgba(0, 212, 255, 0.3); color: #00d4ff;">Group (${item.members?.length || 0} members)</span>`
        : `<span style="font-size: 11px; padding: 2px 8px; border-radius: 4px; white-space: nowrap; font-weight: 600; background: ${item.online === true ? 'rgba(76, 175, 80, 0.3)' : item.online === false ? 'rgba(153, 153, 153, 0.3)' : 'rgba(255, 165, 0, 0.3)'}; color: ${item.online === true ? '#4CAF50' : item.online === false ? '#999' : '#ffa500'};">${item.online === true ? '🟢 Online' : item.online === false ? '🔴 Offline' : '⚠️ Unknown'}</span>`;

      resultItem.innerHTML = `
        ${profileHTML}
        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <h4 style="margin: 0; color: #00ff66; font-weight: 600; word-break: break-word; flex: 1;">${item.isGroup ? '👥 ' : ''}${userHeadline}</h4>
            ${statusLabel}
          </div>
          ${userDetails}
          ${!item.isGroup ? `<p style="margin: 4px 0; color: #00d4ff; font-size: 11px; word-break: break-all;"><strong>📧 Email:</strong> ${escape(item.email || 'N/A')}</p>` : `<p style="margin: 4px 0; color: #00d4ff; font-size: 11px; word-break: break-all;"><strong>📝 Description:</strong> ${escape(item.description || 'No description')}</p>`}
          <p style="margin: 0; color: #00d4ff; font-size: 11px; word-break: break-all;"><strong>➡ UID:</strong> ${escape(item.uid)}</p>
        </div>
      `;

      resultItem.addEventListener("click", async () => {
        try {
          console.log(`Opening ${item.isGroup ? 'group' : 'chat'} with ${displayName} (${item.uid})`);
          if (item.isGroup) {
            await handleGroupJoinLink(item.uid);
          } else {
            await openChat(item.uid, displayName, profilePic, 'direct');
          }
          closeSearch();
          showChatDetailView();
        } catch (chatErr) {
          console.error("Error opening chat:", chatErr);
          showNotif("Error opening chat: " + chatErr.message, "error");
        }
      });

      resultItem.addEventListener("mouseover", () => {
        resultItem.style.background = "linear-gradient(135deg, #00ff66, #00d4ff)";
        resultItem.style.borderColor = "#00ff66";
        resultItem.style.color = "#000";
        resultItem.style.boxShadow = "0 0 20px rgba(0, 255, 102, 0.4)";
      });

      resultItem.addEventListener("mouseout", () => {
        resultItem.style.background = "linear-gradient(135deg, rgba(10, 15, 26, 0.8), rgba(0, 255, 102, 0.05))";
        resultItem.style.borderColor = "rgba(0, 255, 102, 0.3)";
        resultItem.style.color = "#fff";
        resultItem.style.boxShadow = "none";
      });

      resultsDiv.appendChild(resultItem);
    });

    showNotif(`? Found ${allUsers.length} item${allUsers.length !== 1 ? 's' : ''}`, "success", 2000);
    console.log("? Loaded " + allUsers.length + " items");
  } catch (err) {
    console.error("? Error loading users and groups:", err);
    const resultsDiv = document.getElementById("search-results");
    if (resultsDiv) {
      resultsDiv.innerHTML = "<div style='padding: 16px; text-align: center; color: #ff4d4d;'>? Error loading data: " + escape(err.message) + "</div>";
    }
    showNotif("Error loading data: " + err.message, "error");
  }
}

function closeSearch() {
  console.log("? Closing search...");
  const overlay = document.getElementById("search-overlay");
  const modal = document.getElementById("search-modal");
  const input = document.getElementById("search-input");

  if (overlay) overlay.style.display = "none";
  if (modal) modal.style.display = "none";
  if (input) {
    input.value = "";
    input.blur();
  }

  document.body.classList.remove('android-device');

  const resultsDiv = document.getElementById("search-results");
  if (resultsDiv) resultsDiv.innerHTML = "";
}

async function searchUser(e) {
  if (e) e.preventDefault();

  if (!myUID) {
    console.warn("?? User not authenticated yet, waiting...");
    showNotif("Please wait, loading user data...", "info");
    return;
  }

  const searchInput = document.getElementById("search-input");
  if (!searchInput) {
    console.error("? Search input element not found!");
    showNotif("Search input error", "error");
    return;
  }

  const searchTerm = searchInput.value.trim();
  const searchTermLower = searchTerm.toLowerCase();
  console.log("?? Searching for:", searchTerm);

  if (!searchTerm) {
    document.getElementById("search-results").innerHTML = "";
    return;
  }

  try {
    console.log("?? Starting search for:", searchTerm);

    const q = query(collection(db, "users"));
    const snap = await getDocs(q);

    console.log("?? Total users in database:", snap.docs.length);

    let foundResults = [];
    snap.forEach(docSnap => {
      const user = docSnap.data();
      user.uid = docSnap.id;
      user.isGroup = false;

      if (user.uid !== myUID) {
        const uid = user.uid || "";
        const username = (user.username || "").toLowerCase();
        const name = (user.name || "").toLowerCase();
        const email = (user.email || "").toLowerCase();


        let matchPriority = -1;
        const uidLower = uid.toLowerCase();

        if (uidLower === searchTermLower) {
          matchPriority = 0; // Exact UID match - highest priority
        } else if (uidLower.includes(searchTermLower)) {
          matchPriority = 1; // Partial UID match
        } else if (email.includes(searchTermLower)) {
          matchPriority = 2; // Email match
        } else if (username.includes(searchTermLower)) {
          matchPriority = 3; // Username match
        } else if (name.includes(searchTermLower)) {
          matchPriority = 4; // Name match
        }

        if (matchPriority >= 0) {
          user.matchPriority = matchPriority;
          console.log("? User found:", user.username || user.email, "Email:", user.email, "UID:", user.uid, "Priority:", matchPriority, "Online:", user.online);
          foundResults.push(user);
        }
      }
    });

    console.log("?? Searching groups...");
    try {
      const groupsRef = collection(db, "groups");
      const groupsSnap = await getDocs(groupsRef);

      groupsSnap.forEach(docSnap => {
        const group = docSnap.data();
        group.uid = docSnap.id;
        group.id = docSnap.id;
        group.isGroup = true;
        group.type = 'group';

        if (group.members?.includes(myUID)) {
          const groupId = group.uid || "";
          const groupName = (group.name || "").toLowerCase();
          const groupDesc = (group.description || "").toLowerCase();

          let matchPriority = -1;
          const groupIdLower = groupId.toLowerCase();

          if (groupIdLower === searchTermLower) {
            matchPriority = 0; // Exact group ID match
          } else if (groupIdLower.includes(searchTermLower)) {
            matchPriority = 1; // Partial group ID match
          } else if (groupName.includes(searchTermLower)) {
            matchPriority = 2; // Group name match
          } else if (groupDesc.includes(searchTermLower)) {
            matchPriority = 3; // Description match
          }

          if (matchPriority >= 0) {
            group.matchPriority = matchPriority + 10; // Add 10 to prioritize users over groups
            console.log("? Group found:", group.name, "ID:", group.uid, "Members:", group.members?.length);
            foundResults.push(group);
          }
        }
      });
    } catch (groupErr) {
      console.warn("?? Error searching groups:", groupErr);
    }

    foundResults.sort((a, b) => a.matchPriority - b.matchPriority);

    const resultsDiv = document.getElementById("search-results");

    if (foundResults.length === 0) {
      resultsDiv.innerHTML = `
        <div style='padding: 16px; text-align: center; color: #ff6b6b; font-size: 14px;'>
          ? No user or group with UID/name "${escape(searchTerm)}" found
        </div>
      `;
      return;
    }

    resultsDiv.innerHTML = "";

    if (foundResults.length > 0) {
      showNotif(`? Found ${foundResults.length} result(s)!`, "success", 2000);
    }

    foundResults.forEach(item => {
      const resultItem = document.createElement("div");
      resultItem.className = "search-result-item";
      resultItem.style.cssText = `
        padding: 14px;
        border: 1.5px solid rgba(0, 255, 102, 0.3);
        border-radius: 12px;
        margin: 10px 0;
        background: linear-gradient(135deg, rgba(10, 15, 26, 0.8), rgba(0, 255, 102, 0.05));
        color: #fff;
        transition: all 0.3s;
        display: flex;
        flex-direction: column;
        gap: 10px;
      `;

      const displayName = item.name || item.username || item.uid || 'Unknown User';
      const profilePic = item.isGroup ? '👥' : (item.profilePic || item.profilePicUrl || null);
      const userHeadline = !item.isGroup && item.username ? `@${escape(item.username)}` : escape(displayName);
      const userDetails = !item.isGroup && item.name && item.username && item.name !== item.username ? `<p style="margin: 6px 0 0 0; color: #00d4ff; font-size: 11px; word-break: break-all;"><strong>Name:</strong> ${escape(item.name)}</p>` : '';

      let profileHTML = '';
      if (!item.isGroup && typeof profilePic === 'string' && (profilePic.startsWith('data:') || profilePic.startsWith('http'))) {
        profileHTML = `<img src="${escape(profilePic)}" alt="" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #00ff66;">`;
      } else {
        const bgColor = item.isGroup ? '#00d4ff' : '#00ff66';
        const icon = item.isGroup ? '👥' : displayName.charAt(0).toUpperCase();
        profileHTML = `<div style="width: 50px; height: 50px; border-radius: 50%; background: ${bgColor}; color: #000; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 20px;">${icon}</div>`;
      }

      resultItem.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
          ${profileHTML}
          <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px;">
            <h4 style="margin: 0; color: #00ff66; font-weight: 600;">${item.isGroup ? '👥 ' : ''}${userHeadline}</h4>
            ${userDetails}
            ${item.isGroup ? `<p style="margin: 4px 0 0 0; color: #00d4ff; font-size: 11px; word-break: break-all;"><strong>📝 Description:</strong> ${escape(item.description || 'No description')}</p>` : `<p style="margin: 4px 0 0 0; color: #00d4ff; font-size: 11px; word-break: break-all;"><strong>📧 Email:</strong> ${escape(item.email || 'N/A')}</p>`}
            <p style="margin: 4px 0 0 0; color: #00d4ff; font-size: 11px; word-break: break-all;"><strong>➡ UID:</strong> ${escape(item.uid)}</p>
            ${item.isGroup ? `<p style="margin: 4px 0 0 0; font-size: 11px; color: #00ff66;"><strong>👥 Members:</strong> ${item.members?.length || 0}</p>` : `<p style="margin: 4px 0 0 0; font-size: 11px; color: ${item.online === true ? '#4CAF50' : item.online === false ? '#999' : '#ffa500'};">${item.online === true ? '🟢 Online' : item.online === false ? '🔴 Offline' : '⚠️ Status Unknown'}</p>`}
          </div>
        </div>
        <button id="chat-btn-${item.uid}" style="
          width: 100%;
          padding: 10px;
          background: ${item.isGroup ? '#00d4ff' : '#00ff66'};
          color: #000;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        ">${item.isGroup ? '👥 Join Group' : '➡ Start Chatting'}</button>
      `;

      const chatBtn = resultItem.querySelector(`#chat-btn-${item.uid}`);
      chatBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        try {
          console.log(`${item.isGroup ? '👥 Joining group' : '➡ Starting chat'} with:`, displayName);
          if (item.isGroup) {
            await handleGroupJoinLink(item.uid);
          } else {
            await openChat(item.uid, displayName, profilePic, 'direct');
          }
          closeSearch();
          showChatDetailView();
        } catch (chatErr) {
          console.error("Error opening chat:", chatErr);
          showNotif("Error opening chat: " + chatErr.message, "error");
        }
      });

      chatBtn.addEventListener("mouseover", () => {
        chatBtn.style.background = item.isGroup ? "#00ccdd" : "#00dd55";
        chatBtn.style.transform = "scale(1.02)";
      });

      chatBtn.addEventListener("mouseout", () => {
        chatBtn.style.background = item.isGroup ? '#00d4ff' : '#00ff66';
        chatBtn.style.transform = "scale(1)";
      });

      resultItem.addEventListener("mouseover", () => {
        resultItem.style.background = "linear-gradient(135deg, rgba(0, 255, 102, 0.2), rgba(0, 212, 255, 0.1))";
        resultItem.style.boxShadow = "0 0 20px rgba(0, 255, 102, 0.3)";
      });

      resultItem.addEventListener("mouseout", () => {
        resultItem.style.background = "linear-gradient(135deg, rgba(10, 15, 26, 0.8), rgba(0, 255, 102, 0.05))";
        resultItem.style.boxShadow = "none";
      });

      resultsDiv.appendChild(resultItem);
    });
  } catch (err) {
    console.error("Search error:", err);
    showNotif("Error: " + err.message, "error");
    document.getElementById("search-results").innerHTML = "<div style='padding: 16px; text-align: center; color: #ff4d4d;'>Error searching</div>";
  }
}


function goBack() {
  try { GroupChat.close(); } catch(e) {}
  currentChatUser = null;
  const messages = document.getElementById("messages-area");
  if (messages) {
    messages.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i class="fa-regular fa-comments"></i></div>
        <p>Select a chat to start messaging</p>
        <p class="empty-hint">Search for users or select from contacts</p>
      </div>
    `;
  }
  document.getElementById("chatName").textContent = "Select a chat";
  document.getElementById("chatProfilePic").src = "";
  document.getElementById("statusText").textContent = "Offline";
  if (messageListener) {
    messageListener();
    messageListener = null;
  }
  if (messageListener2) {
    messageListener2();
    messageListener2 = null;
  }
}

function goBackToDashboard() {
  currentChatUser = null;
  if (typeof showChatListView === 'function') {
    showChatListView();
  }
  if (typeof goBack === 'function') {
    goBack();
  }
}

function initializeEmojiPicker() {
  const emojiGrid = document.getElementById("emoji-grid");
  if (emojiGrid) {
    emojiGrid.innerHTML = emojis.map(e =>
      `<button type="button" class="emoji-item" data-emoji="${e}" style="background: none; border: 1px solid #ddd; font-size: 20px; cursor: pointer; padding: 8px; border-radius: 6px; transition: all 0.2s">${e}</button>`
    ).join("");

    emojiGrid.addEventListener("click", (e) => {
      if (e.target.classList.contains("emoji-item")) {
        const emoji = e.target.getAttribute("data-emoji");
        const input = document.getElementById("message-input");
        input.value += emoji;
        input.focus();
      }
    });
  }
}

function toggleEmojiPicker() {
  const picker = document.getElementById("emoji-picker");
  if (picker) {
    picker.style.display = picker.style.display === "none" ? "block" : "none";
  }
}

document.getElementById("emoji-btn")?.addEventListener("click", (e) => {
  e.preventDefault();
  toggleEmojiPicker();
});

document.getElementById("close-emoji-btn")?.addEventListener("click", () => {
  document.getElementById("emoji-picker").style.display = "none";
});

document.getElementById("sticker-btn")?.addEventListener("click", (e) => {
  e.preventDefault();
  openQuickStatusModal();
});

function openQuickStatusModal() {
  if (!myUID) {
    showNotif("Please log in first", "error");
    return;
  }

  const modal = document.createElement("div");
  modal.id = "quick-status-modal";
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: flex-end;
    z-index: 1000;
    animation: slideUpModal 0.3s ease-out;
    `;

  modal.innerHTML = `
      <div style="
    background: #1a1a1a;
    border-radius: 20px 20px 0 0;
    padding: 20px;
    width: 100%;
    max-width: 500px;
    box-shadow: 0 -4px 20px rgba(0, 255, 102, 0.2);
    border: 1px solid #00ff66;
    border-bottom: none;
    ">
      <h3 style="
    color: #00ff66;
    font-size: 18px;
    font-weight: 700;
    margin: 0 0 8px 0;
    text-align: center;
    ">? Post a Quick Status</h3>

      <p style="
    color: rgba(0, 255, 102, 0.7);
    font-size: 12px;
    margin: 0 0 12px 0;
    text-align: center;
    ">Visible only to users you've chatted with ??</p>

      <textarea id="quick-status-input"
    placeholder="What's on your mind? (max 150 characters)"
    maxlength="150"
    style="
    width: 100%;
    padding: 12px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid #00ff66;
    border-radius: 12px;
    color: #00ff66;
    font-family: inherit;
    font-size: 14px;
    resize: vertical;
    min-height: 80px;
    box-sizing: border-box;
    outline: none;
    "></textarea>

      <div style="
    display: flex;
    gap: 10px;
    margin-top: 16px;
    ">
      <button id="cancel-status-btn" style="
    flex: 1;
    padding: 12px;
    background: #333;
    color: #fff;
    border: 1px solid #555;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    ">Cancel</button>
      <button id="post-quick-status-btn" style="
    flex: 1;
    padding: 12px;
    background: #00ff66;
    color: #000;
    border: none;
    border-radius: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    ">Post Status ?</button>
      </div>
    </div>
      `;

  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideUpModal {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    `;
  document.head.appendChild(style);

  document.body.appendChild(modal);

  const input = document.getElementById("quick-status-input");
  const postBtn = document.getElementById("post-quick-status-btn");
  const cancelBtn = document.getElementById("cancel-status-btn");

  input.focus();

  postBtn.addEventListener("click", async () => {
    const text = input.value.trim();
    if (!text) {
      showNotif("Status cannot be empty", "error");
      return;
    }

    try {
      const chattedUsers = await getChattedUsers(myUID);
      console.log("?? Quick Status posting - Chatted users:", chattedUsers);

      const statusesRef = collection(db, "statuses");
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const statusData = {
        userId: myUID,
        text: text,
        timestamp: serverTimestamp(),
        expiresAt: expiresAt,
        likes: 0,
        comments: [],
        visibleTo: chattedUsers // Only visible to chatted users
      };

      console.log("?? Saving quick status with data:", statusData);

      await addDoc(statusesRef, statusData);

      showNotif("? Status posted! (Visible only to users you've chatted with)", "success", 2000);
      hapticFeedback('success');
      modal.remove();
      style.remove();
    } catch (err) {
      console.error("Error posting status:", err);
      showNotif("Error posting status: " + err.message, "error");
    }
  });

  cancelBtn.addEventListener("click", () => {
    modal.remove();
    style.remove();
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
      style.remove();
    }
  });
}

async function sendMessage(e) {
  if (e) e.preventDefault();

  console.log("?? Send message triggered"); // Debug log

  if (!currentChatUser) {
    showNotif("Select a chat first", "error");
    console.warn("? No chat selected");
    return;
  }

  const messageText = document.getElementById("message-input");
  const text = messageText?.value.trim();

  if (!text && !selectedFile) {
    showNotif("Message or file attachment required", "error");
    return;
  }

  if (!myUID) {
    showNotif("? Please log in first", "error");
    return;
  }

  hapticFeedback('light');

  try {
    const userRef = doc(db, "users", myUID);

    if (tokens < 1) {
      showNotif("? Insufficient tokens! You need at least 1 token to send a message. ??", "error");
      return;
    }

    let attachment = null;

    if (selectedFile) {
      showNotif("?? Uploading file...", "info");
      try {
        attachment = await uploadFileToStorage(selectedFile, currentChatUser, currentChatType === 'group');
        showNotif("? File uploaded successfully!", "success", 2000);
      } catch (uploadErr) {
        console.error("? File upload failed:", uploadErr);
        showNotif("? Failed to upload file: " + uploadErr.message, "error");
        throw uploadErr;
      }
    }

    if (currentChatType === 'ai') {
      try {
        console.log("?? Initiating Chronex AI synchronization...");

        if (messageText) messageText.value = "";
        if (typeof removeAttachment === 'function') removeAttachment();

        tokens--;
        const tokenDisplay = document.getElementById("currentTokenBalance");
        if (tokenDisplay) tokenDisplay.textContent = formatBalanceDisplay(tokens);

        await updateDoc(userRef, {
          tokens: increment(-1),
          lastMessageSentAt: serverTimestamp()
        });

        if (typeof displayChronexAIUserMessage === 'function') {
          displayChronexAIUserMessage(text);
        }

        const messagesDiv = document.getElementById("messages-area");
        const typingEl = document.createElement("div");
        typingEl.id = "ai-typing-indicator";
        typingEl.className = "message-wrapper received";
        typingEl.style.cssText = "display: flex; justify-content: flex-start; margin: 8px 0; padding: 0 12px;";
        typingEl.innerHTML = `
          <img src="chronex-ai.jpg" class="message-avatar" alt="AI" style="width: 32px; height: 32px; border-radius: 50%; border: 1.5px solid #00ff66; margin-right: 8px;">
          <div class="message-bubble" style="background: linear-gradient(135deg, #111, #0a0e1a); color: #00ff66; padding: 10px 14px; border-radius: 12px; border: 1px solid rgba(0, 255, 102, 0.3);">
            <p style="margin: 0;"><i class="fas fa-microchip pulse"></i> ?? Synaptic processing...</p>
          </div>
        `;
        if (messagesDiv) {
          messagesDiv.appendChild(typingEl);
          messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        const aiClientId = generateClientId(16);
        const aiPromise = chronexAI.chat(text, `chronex-${myUID}`, aiClientId);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("AI_TIMEOUT")), 20000)
        );

        const aiResponse = await Promise.race([aiPromise, timeoutPromise]);

        const indicator = document.getElementById("ai-typing-indicator");
        if (indicator) indicator.remove();

        if (typeof displayChronexAIResponse === 'function') {
          displayChronexAIResponse(aiResponse);
        }

        localAiMessages.push({
          from: 'chronex-ai',
          to: myUID,
          text: aiResponse,
          time: { toDate: () => new Date() },
          read: true,
          type: 'text',
          localOnly: true,
          clientId: aiClientId
        });

        hapticFeedback('success');
        showNotif(`? Neural Sync Successful`, "success", 1500);

      } catch (aiErr) {
        console.error("? Chronex AI Error:", aiErr);
        const indicator = document.getElementById("ai-typing-indicator");
        if (indicator) indicator.remove();

        let errorMsg = "Neural uplink failed. Using fallback protocols.";
        if (aiErr.message === "AI_TIMEOUT") errorMsg = "Neural link timed out. Local cache engaged.";

        showNotif("? " + errorMsg, "error");

        try {
          const fallback = await chronexAI.getJavaScriptResponse(text);
          if (typeof displayChronexAIResponse === 'function') {
            displayChronexAIResponse(fallback);
          }
          localAiMessages.push({
            from: 'chronex-ai',
            to: myUID,
            text: fallback,
            time: { toDate: () => new Date() },
            read: true,
            type: 'text',
            localOnly: true,
            isAiResponse: true,
            clientId: aiClientId
          });
        } catch (fErr) {
          console.error("Critical Fallback Failed:", fErr);
        }
      }
    } else if (currentChatType === 'group') {
      console.log("?? Sending group message to:", currentChatUser);
      await sendGroupMessage(currentChatUser, text, attachment);
    } else {
      if (!isDirectChatAllowed(currentChatUser)) {
        await sendChatRequest(currentChatUser);
        showNotif(`?? Chat request sent to ${currentChatUser} (waiting for approval)`, 'info', 4000);
        return;
      }

      console.log("?? Sending direct message to:", currentChatUser);
      const messageData = {
        from: myUID,
        to: currentChatUser,
        text: text || "",
        time: serverTimestamp(),
        read: false,
        type: "text",
        edited: false,
        reactions: [],
        ...(window.messagingFeatures && window.messagingFeatures.replyingToMessage && window.messagingFeatures.replyingToMessage() ? {
          replyTo: {
            text: window.messagingFeatures.replyingToMessage().text,
            senderName: window.messagingFeatures.replyingToMessage().senderName,
            timestamp: new Date().toISOString()
          }
        } : {})
      };
      if (attachment) messageData.attachment = attachment;
      await addDoc(collection(db, "messages"), messageData);
      appendLocalSentMessage(text, attachment);

      await updateDoc(userRef, {
        tokens: increment(-1),
        lastMessageSentAt: serverTimestamp()
      });

      try {
        await addDoc(collection(db, 'messageActivity'), {
          userId: myUID,
          recipientId: currentChatUser,
          sentAt: new Date(),
          messageLength: (text || "").length,
          hasAttachment: !!attachment,
          tokensCost: 1
        });
      } catch (trackErr) {
        console.warn('Warning: Could not track message activity:', trackErr);
      }
    }

    if (window.messagingFeatures && window.messagingFeatures.hideReplyPreview) {
      window.messagingFeatures.hideReplyPreview();
    }
    if (messageText) messageText.value = "";
    if (typeof removeAttachment === 'function') removeAttachment();

    hapticFeedback('success');
    if (shouldShowMessageSentNotification()) {
      showNotif(`? Message sent`, "success", 2000);
    }
    const emojiPicker = document.getElementById("emoji-picker");
    if (emojiPicker) emojiPicker.style.display = "none";
    console.log("? Message lifecycle synchronized successfully");
  } catch (err) {
    hapticFeedback('heavy');
    console.error("? Critical Send Error:", err);
    showNotif("Error sending message: " + err.message, "error");
  }
}

function appendLocalSentMessage(text, attachment = null, showHeader = false) {
  const messagesContainer = document.getElementById("messages-area");
  if (!messagesContainer) return;

  const wrapper = document.createElement("div");
  wrapper.className = "message-wrapper sent";
  wrapper.style.cssText = "display:flex; justify-content:flex-end; margin:8px 0; padding:0 12px; flex-direction: column; align-items: flex-end;";

  if (showHeader) {
    const headerLabel = document.createElement("div");
    headerLabel.style.cssText = "font-size:11px; color:#00ff66; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;";
    const now = new Date();
    headerLabel.textContent = `You · ${formatChatTimestamp(now)}`;
    wrapper.appendChild(headerLabel);
  }

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.style.cssText = "background:#00ff66; color:#000; padding:10px 14px; border-radius:12px; max-width:70%; word-wrap:break-word;";

  if (attachment && attachment.fileType && attachment.fileType.startsWith('audio/')) {
    const audioEl = document.createElement('audio');
    audioEl.controls = true;
    audioEl.src = attachment.downloadURL || '';
    audioEl.style.maxWidth = '100%';
    bubble.appendChild(audioEl);
  } else if (attachment && attachment.downloadURL) {
    const link = document.createElement('a');
    link.href = attachment.downloadURL;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = attachment.fileName || 'View file';
    bubble.appendChild(link);
  } else {
    bubble.textContent = text || "";
  }

  const timeSpan = document.createElement("div");
  timeSpan.style.cssText = "font-size:11px; margin-top:4px; opacity:0.7;";
  timeSpan.textContent = formatTime(new Date());
  bubble.appendChild(timeSpan);

  wrapper.appendChild(bubble);
  messagesContainer.appendChild(wrapper);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}


function displayChronexAIUserMessage(message) {
  const messagesContainer = document.getElementById("messages-area");
  if (!messagesContainer) return;

  const div = document.createElement("div");
  div.className = "message-wrapper sent";
  div.style.cssText = "display: flex; justify-content: flex-end; margin: 8px 0; padding: 0 12px;";

  div.innerHTML = `
    <div class="message-bubble" style="background: #00ff66; color: #000; padding: 10px 14px; border-radius: 12px; max-width: 70%; word-wrap: break-word;">
      <p style="margin: 0;">${escape(message)}</p>
      <div style="font-size: 11px; margin-top: 4px; opacity: 0.7;">? ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
    </div>
  `;

  messagesContainer.appendChild(div);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function displayChronexAIResponse(response) {
  const messagesContainer = document.getElementById("messages-area");
  if (!messagesContainer) return;

  const div = document.createElement("div");
  div.className = "message-wrapper received";
  div.style.cssText = "display: flex; justify-content: flex-start; margin: 8px 0; padding: 0 12px;";

  div.innerHTML = `
    <img src="chronex-ai.jpg" class="message-avatar" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1.5px solid #00ff66; margin-right: 8px; flex-shrink: 0;">
    <div class="message-bubble" style="background: linear-gradient(135deg, #111, #0a0e1a); color: #00ff66; padding: 10px 14px; border-radius: 12px; max-width: 70%; word-wrap: break-word; border: 1px solid rgba(0, 255, 102, 0.3);">
      <p style="margin: 0; white-space: pre-wrap;">${response}</p>
      <div style="font-size: 11px; margin-top: 4px; opacity: 0.7;">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
    </div>
  `;

  messagesContainer.appendChild(div);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function displayChronexAIError(errorMessage) {
  const messagesContainer = document.getElementById("messages-area");
  if (!messagesContainer) return;

  const div = document.createElement("div");
  div.className = "message-wrapper received error";
  div.style.cssText = "display: flex; justify-content: flex-start; margin: 8px 0; padding: 0 12px;";

  div.innerHTML = `
    <img src="chronex-ai.jpg" class="message-avatar" style="width: 32px; height: 32px; border-radius: 50%; border: 1.5px solid #ff4d4d; margin-right: 8px; flex-shrink: 0;">
    <div class="message-bubble" style="background: rgba(255, 77, 77, 0.1); color: #ff4d4d; padding: 10px 14px; border-radius: 12px; max-width: 70%; word-wrap: break-word; border: 1px solid rgba(255, 77, 77, 0.3);">
      <p style="margin: 0;">?? **NEURAL LINK ERROR**</p>
      <p style="margin: 4px 0 0 0; font-size: 13px;">${escape(errorMessage)}</p>
      <div style="font-size: 11px; margin-top: 4px; opacity: 0.7;">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
    </div>
  `;

  messagesContainer.appendChild(div);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function loadMessages() {
  if (!currentChatUser) {
    console.warn("?? loadMessages: No currentChatUser set");
    return;
  }

  console.log("?? Loading messages for chat with:", currentChatUser);
  console.log("?? Current user UID:", myUID);

  if (messageListener) {
    messageListener();
    messageListener = null;
  }
  if (messageListener2) {
    messageListener2();
    messageListener2 = null;
  }

  const messagesDiv = document.getElementById("messages-area");
  if (!messagesDiv) {
    console.error("? messages-area element not found");
    return;
  }

  let cachedDirectMessages = null;
  if (currentChatType === 'direct' && myUID && currentChatUser) {
    cachedDirectMessages = getCachedDirectChatMessages(myUID, currentChatUser);
  }

  if (cachedDirectMessages && cachedDirectMessages.length > 0) {
    renderCachedDirectChatHistory(cachedDirectMessages, messagesDiv);
    cancelChatLoadFeedback();
  } else {
    messagesDiv.innerHTML = "";
    queueChatLoadFeedback('Please wait… loading chat');
  }

  const q = query(
    collection(db, "messages"),
    where("from", "==", myUID),
    where("to", "==", currentChatUser),
    limit(50) // Reduced limit for better performance
  );

  const q2 = query(
    collection(db, "messages"),
    where("from", "==", currentChatUser),
    where("to", "==", myUID),
    limit(50) // Reduced limit for better performance
  );

  let messages1 = [];
  let messages2 = [];
  let loaded1 = false;
  let loaded2 = false;

  const updateMessages = () => {
    const isInitialLoadComplete = loaded1 && loaded2;
    console.log("?? Message progress - loaded1:", loaded1, "loaded2:", loaded2, "messages1:", messages1.length, "messages2:", messages2.length);

    const dbMessages = [...messages1, ...messages2];
    const uniqueMessagesMap = new Map();
    dbMessages.forEach((msg) => {
      if (msg.docId) {
        uniqueMessagesMap.set(msg.docId, msg);
      }
    });

    if (isInitialLoadComplete) {
      completeChatReloadOverlay();
    }
    const uniqueDbMessages = Array.from(uniqueMessagesMap.values());

    const uniqueLocalAiMessages = localAiMessages.filter(localMsg => {
      const isDuplicate = uniqueDbMessages.some(dbMsg => {
        if (localMsg.clientId && dbMsg.clientId && localMsg.clientId === dbMsg.clientId) {
          return true;
        }

        const dbTime = dbMsg.time?.toMillis ? dbMsg.time.toMillis() : (dbMsg.time || 0);
        const localTime = localMsg.time?.toMillis ? localMsg.time.toMillis() : (localMsg.time?.toDate ? localMsg.time.toDate().getTime() : Date.now());
        return dbMsg.text === localMsg.text && Math.abs(dbTime - localTime) < 10000;
      });
      return !isDuplicate;
    });

    const allMessages = [...uniqueDbMessages, ...uniqueLocalAiMessages].sort((a, b) => {
      const timeA = a.time?.toDate?.() || new Date(0);
      const timeB = b.time?.toDate?.() || new Date(0);
      return timeA - timeB;
    });

    if (currentChatType === 'direct' && myUID && currentChatUser) {
      cacheDirectChatMessages(myUID, currentChatUser, allMessages);
    }

    messagesDiv.innerHTML = "";

    if (allMessages.length === 0) {
      if (!isInitialLoadComplete) {
        messagesDiv.innerHTML = currentChatType === 'ai'
          ? "<p style='text-align: center; color: #00ff66; padding: 20px; font-family: Orbitron;'>?? Synchronizing Neural Uplink...</p>"
          : "<p style='text-align: center; color: #888; padding: 20px;'>Loading messages...</p>";
        return;
      }

      console.log("?? No messages found between users");
      messagesDiv.innerHTML = `
      <div class="empty-state">
          <div class="empty-icon"><i class="fa-regular fa-paper-plane"></i></div>
          <p>No messages yet</p>
          <p class="empty-hint">Start the conversation!</p>
        </div>
      `;
      return;
    }

    const unreadMessages = allMessages.filter(m => m.from !== myUID && m.read === false);
    if (unreadMessages.length > 0) {
      const latestUnread = unreadMessages[unreadMessages.length - 1];
      const messageTime = latestUnread.time?.toDate?.() || new Date(0);
      const isRecent = Date.now() - messageTime.getTime() < 30000; // Within last 30 seconds

      if (isRecent) {
        const senderName = getContactName(latestUnread.from) || latestUnread.from;
        notifyNewMessage(latestUnread, senderName);
      }
    }

    allMessages.forEach(async (m) => {
      if (m.from !== myUID && m.read === false && m.docId) {
        try {
          await updateDoc(doc(db, "messages", m.docId), { read: true });
        } catch (e) {
          console.error("Error marking message as read:", e);
        }
      }
    });


    allMessages.forEach((m) => {
      let isOwn = m.from === myUID;
      const isAI = m.from === 'chronex-ai' || m.isAiResponse;

      if (isAI) isOwn = false;

      const div = document.createElement("div");
      div.className = `message-wrapper ${isOwn ? "sent" : "received"}`;
      div.style.cssText = `
    display: flex;
    justify-content: ${isOwn ? "flex-end" : "flex-start"};
    margin: 8px 0;
    padding: 0 12px;
    `;

      const msgDate = m.time?.toDate?.() || new Date();
      const time = formatTime(msgDate);

      const bubble = document.createElement("div");
      bubble.className = "message-bubble";
      bubble.style.cssText = `
    background: ${isOwn ? "#00ff66" : "#222"};
    color: ${isOwn ? "#000" : "#fff"};
    padding: 10px 14px;
    border-radius: 12px;
    max-width: 70%;
    word-wrap: break-word;
    transition: all 0.2s;
    `;

      if (m.replyTo) {
        const replyIndicator = document.createElement("div");
        replyIndicator.className = "swipe-reply-indicator";
        replyIndicator.style.cssText = `
        position: absolute;
        left: 0;
        top: 0;
        width: 4px;
        height: 100%;
        background: ${isOwn ? "#00aa44" : "#00d4ff"};
        border-radius: 2px;
      `;
        bubble.style.position = "relative";
        bubble.style.paddingLeft = "14px";
        bubble.appendChild(replyIndicator);

        const replyQuote = document.createElement("div");
        replyQuote.style.cssText = `
        background: ${isOwn ? "rgba(0,170,68,0.2)" : "rgba(0,212,255,0.2)"};
        border-left: 3px solid ${isOwn ? "#00aa44" : "#00d4ff"};
        padding: 8px;
        margin-bottom: 8px;
        border-radius: 4px;
        font-size: 12px;
        font-style: italic;
      `;
        replyQuote.innerHTML = `<strong>?? ${escape(m.replyTo.senderName)}:</strong> ${escape(m.replyTo.text.substring(0, 60))}${m.replyTo.text.length > 60 ? '...' : ''}`;
        bubble.appendChild(replyQuote);
      }

      const content = document.createElement("p");
      content.style.margin = "0";

      if (m.attachment && m.attachment.fileType && m.attachment.fileType.startsWith('audio/')) {
        const audioPlayer = window.messagingFeatures.createAudioPlayerElement(
          m.attachment.downloadURL,
          m.attachment.duration || 0
        );
        bubble.appendChild(audioPlayer);
      } else {
        if (isAI || (currentChatType === 'ai' && !isOwn)) {
          const aiAvatar = document.createElement("img");
          aiAvatar.src = "chronex-ai.jpg";
          aiAvatar.className = "message-avatar";
          aiAvatar.style.cssText = `width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1.5px solid #00ff66; margin-right: 8px; flex-shrink: 0;`;

          div.appendChild(aiAvatar); // Append avatar FIRST
          bubble.style.background = "linear-gradient(135deg, #111, #0a0e1a)";
          bubble.style.border = "1px solid rgba(0, 255, 102, 0.3)";
          bubble.style.color = "#00ff66";
        }
        content.textContent = m.text;
        bubble.appendChild(content);
      }

      const timeSpan = document.createElement("div");
      timeSpan.style.cssText = `font-size: 11px; margin-top: 4px; opacity: 0.7; display: flex; align-items: center; gap: 4px;`;

      let receiptText = time + (m.edited ? " (edited)" : "");
      if (isOwn) {
        if (m.read) {
          receiptText = '?? ' + receiptText; // Double checkmark for read
        } else {
          receiptText = '? ' + receiptText;  // Single checkmark for sent
        }
      }
      timeSpan.textContent = receiptText;

      bubble.appendChild(timeSpan);

      bubble.addEventListener("mouseenter", () => {
        bubble.style.transform = "scale(1.02)";
      });
      bubble.addEventListener("mouseleave", () => {
        bubble.style.transform = "scale(1)";
      });

      div.appendChild(bubble);
      messagesDiv.appendChild(div);
    });

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  };

  const debouncedUpdateMessages = () => {
    if (updateMessagesTimeout) clearTimeout(updateMessagesTimeout);
    const timeSinceLastUpdate = Date.now() - (window.lastUpdateTime || 0);
    const adaptiveDelay = timeSinceLastUpdate < 30000 ? 200 : 600; // 0.2s if recent activity, 0.6s otherwise
    updateMessagesTimeout = setTimeout(() => {
      updateMessages();
      window.lastUpdateTime = Date.now();
    }, adaptiveDelay);
  };

  messageListener = onSnapshot(q, (snap) => {
    console.log("? Query 1 snapshot received:", snap.docs.length, "messages");
    cancelChatLoadFeedback();
    messages1 = snap.docs.map(docSnap => ({ ...docSnap.data(), docId: docSnap.id }));
    loaded1 = true;
    debouncedUpdateMessages();
  }, (err) => {
    console.error("? Error loading outgoing messages:", err);
    loaded1 = true;
    debouncedUpdateMessages();
  });

  messageListener2 = onSnapshot(q2, (snap) => {
    console.log("? Query 2 snapshot received:", snap.docs.length, "messages");
    cancelChatLoadFeedback();
    messages2 = snap.docs.map(docSnap => ({ ...docSnap.data(), docId: docSnap.id }));
    loaded2 = true;
    debouncedUpdateMessages();
  }, (err) => {
    console.error("? Error loading incoming messages:", err);
    loaded2 = true;
    debouncedUpdateMessages();
  });
}




function updateChatProfileDisplay(username, profilePic, status = 'Online') {
  const headerLogoContainer = document.getElementById("headerLogoContainer");
  const activeChatHeader = document.getElementById("activeChatHeader");

  if (headerLogoContainer && activeChatHeader) {
    headerLogoContainer.style.display = 'none';
    activeChatHeader.style.display = 'flex';

    const activeChatName = document.getElementById("activeChatName");
    const activeChatStatus = document.getElementById("activeChatStatus");
    const activeChatAvatar = document.getElementById("activeChatAvatar");

    if (activeChatName) activeChatName.textContent = username;
    if (activeChatStatus) activeChatStatus.textContent = status;
    if (activeChatAvatar) {
      if (profilePic) {
        activeChatAvatar.src = profilePic;
        activeChatAvatar.style.display = 'block';
      } else {
        activeChatAvatar.src = 'logo.jpg';
      }

      activeChatAvatar.style.cursor = 'pointer';
      activeChatAvatar.onclick = (e) => {
        e.stopPropagation();
        const modal = document.getElementById('profilePicModal');
        const modalImg = document.getElementById('profileModalImg');
        const modalName = document.getElementById('profileModalName');
        const modalDesc = document.getElementById('profileModalDesc');
        const modalWordmark = document.getElementById('profileModalBrandWordmark');

        if (modal && modalImg && modalName) {
          modalImg.src = profilePic || 'logo.jpg';
          modalName.textContent = username;

          if (modalWordmark) modalWordmark.style.display = (username === "Chronex AI") ? 'block' : 'none';

          if (modalDesc) {
            if (username === "Chronex AI") {
              modalDesc.textContent = "Official NEX_DEV Neural Assistant. Primary interface for the NEXCHAT ecosystem. Advanced robotic intelligence designed for cross-sector synchronization.";
            } else if (status.includes("Group")) {
              modalDesc.textContent = "Secure NEX_CORE Communication Node. Restricted access unit for multi-user data stream processing.";
            } else {
              modalDesc.textContent = "Registered NEXCHAT Neural Entity. Secure direct-link established.";
            }
          }

          modal.style.display = 'flex';

          const editBtn = document.getElementById('editProfileBtnModal');
          if (editBtn) editBtn.style.display = 'none';
        }
      };
    }
  }

  if (activeChatName) {
    activeChatName.style.cursor = 'pointer';
    activeChatName.onclick = (e) => {
      e.stopPropagation();
      if (currentChatUser && currentChatType === 'direct') {
        showUserInfoPanel(currentChatUser);
      } else if (currentChatUser && currentChatType === 'group') {
        showGroupInfoPanel(currentChatUser);
      }
    };
  }

  const chatUserProfile = document.getElementById("chatUserProfile");
  if (chatUserProfile) {
    chatUserProfile.style.display = 'flex';

    const chatUserName = document.getElementById("chatUserName");
    const chatUserStatus = document.getElementById("chatUserStatus");
    const chatUserAvatar = document.getElementById("chatUserAvatar");

    if (chatUserName) chatUserName.textContent = username;
    if (chatUserStatus) chatUserStatus.textContent = status;
    if (chatUserAvatar) {
      chatUserAvatar.src = profilePic || "??";

      chatUserAvatar.style.cursor = 'pointer';
      chatUserAvatar.onclick = (e) => {
        e.stopPropagation();
        if (profilePic) {
          const modal = document.getElementById('profilePicModal');
          const modalImg = document.getElementById('profileModalImg');
          const modalName = document.getElementById('profileModalName');
          const modalDesc = document.getElementById('profileModalDesc');
          const modalWordmark = document.getElementById('profileModalBrandWordmark');

          if (modal && modalImg && modalName) {
            modalImg.src = profilePic || 'logo.jpg';
            modalName.textContent = username;

            if (modalWordmark) modalWordmark.style.display = (username === "Chronex AI") ? 'block' : 'none';

            if (modalDesc) {
              if (username === "Chronex AI") {
                modalDesc.textContent = "Official NEX_DEV Neural Assistant. Primary interface for the NEXCHAT ecosystem. Advanced robotic intelligence designed for cross-sector synchronization.";
              } else if (status.includes("Group")) {
                modalDesc.textContent = "Secure NEX_CORE Communication Node. Restricted access unit for multi-user data stream processing.";
              } else {
                modalDesc.textContent = "Registered NEXCHAT Neural Entity. Secure direct-link established.";
              }
            }

            modal.style.display = 'flex';

            const editBtn = document.getElementById('editProfileBtnModal');
            if (editBtn) editBtn.style.display = 'none';
          }
        }
      };
    }

    if (chatUserName) {
      chatUserName.style.cursor = 'pointer';
      chatUserName.onclick = (e) => {
        e.stopPropagation();
        if (currentChatUser && currentChatType === 'direct') {
          showUserInfoPanel(currentChatUser);
        } else if (currentChatUser && currentChatType === 'group') {
          showGroupInfoPanel(currentChatUser);
        }
      };
    }
  }
}

function hideChatProfileDisplay() {
  const headerLogoContainer = document.getElementById("headerLogoContainer");
  const activeChatHeader = document.getElementById("activeChatHeader");
  const chatUserProfile = document.getElementById("chatUserProfile");

  if (headerLogoContainer) headerLogoContainer.style.display = 'block';
  if (activeChatHeader) activeChatHeader.style.display = 'none';
  if (chatUserProfile) chatUserProfile.style.display = 'none';
}

async function openChat(uid, username, profilePic, chatType = 'direct') {
  if (chatType === 'direct' && uid !== myUID && !isDirectChatAllowed(uid)) {
    if (pendingChatRequests[uid]) {
      showNotif('â³ Chat request already pending for this user', 'info');
    } else {
      showDirectChatRequestPrompt(uid, username, profilePic);
    }
    return;
  }

  currentChatUser = uid;
  currentChatType = chatType;
  currentChatName = username;
  const chatDetailView = document.getElementById('chatDetailView');
  const chatDetailHeader = document.querySelector('.chat-detail-header');
  if (chatDetailView) {
    chatDetailView.classList.toggle('group-chat', chatType === 'group');
    chatDetailView.classList.toggle('ai-chat', chatType === 'ai');
  }
  if (chatDetailHeader) {
    chatDetailHeader.classList.toggle('group-chat', chatType === 'group');
    chatDetailHeader.classList.toggle('ai-chat', chatType === 'ai');
  }
  subscribeTypingIndicator(uid, chatType);
  if (chatType === 'direct') {
    try { GroupChat.close(); } catch(e) {}
    subscribeUserPresence(uid);
  } else {
    if (chatType !== 'group') {
      try { GroupChat.close(); } catch(e) {}
    }
    if (userStatusUnsubscribe) {
      userStatusUnsubscribe();
      userStatusUnsubscribe = null;
    }
  }

  if (uid === 'chronex-ai' || chatType === 'ai') {
  } else {
    localAiMessages = [];
  }

  updateChatProfileDisplay(username, profilePic, "Loading...");


  const chatNameEl = document.getElementById("chatName");
  if (chatNameEl) chatNameEl.textContent = username;

  const chatProfilePicEl = document.getElementById("chatProfilePic");
  if (chatProfilePicEl) {
    if (profilePic && (profilePic.startsWith('http') || profilePic.startsWith('data:') || profilePic.includes('.'))) {
      chatProfilePicEl.src = profilePic;
    } else {
      chatProfilePicEl.src = 'logo.jpg';
    }
  }

  const infoNameEl = document.getElementById("infoName");
  if (infoNameEl) infoNameEl.textContent = username;

  const infoPicEl = document.getElementById("infoPic");
  if (infoPicEl) {
    if (profilePic && (profilePic.startsWith('http') || profilePic.startsWith('data:') || profilePic.includes('.'))) {
      infoPicEl.src = profilePic;
    } else {
      infoPicEl.src = 'logo.jpg';
    }
  }

  try {
    if (chatType === 'group') {
      const groupDoc = await getDoc(doc(db, "groups", uid));
      if (groupDoc.exists()) {
        const groupData = groupDoc.data();
        const infoEmailEl = document.getElementById("infoEmail");
        if (infoEmailEl) infoEmailEl.textContent = `Members: ${groupData.members.length} `;

        const statusTextEl = document.getElementById("statusText");
        if (statusTextEl) statusTextEl.textContent = `?? Group Chat`;

        const infoStatusEl = document.getElementById("infoStatus");
        if (infoStatusEl) infoStatusEl.textContent = `?? Group Chat`;

        updateChatProfileDisplay(username, profilePic, "?? Group Chat");

        const memberIds = Array.isArray(groupData.members) ? groupData.members : [];
      if (memberIds.length > 0) {
        const memberDocs = await Promise.all(memberIds.map(async (memberId) => {
          try {
            const memberSnap = await getDoc(doc(db, 'users', memberId));
            if (memberSnap.exists()) {
              const memberData = memberSnap.data();
              return {
                uid: memberId,
                username: memberData.username || memberData.name || memberData.email || 'Member',
                name: memberData.name || memberData.username || memberData.email || 'Member'
              };
            }
          } catch (e) {
            console.warn('Error loading group member:', memberId, e);
          }
          return null;
        }));
        groupMembers = memberDocs.filter(Boolean);
      } else {
        groupMembers = [];
      }

      setTimeout(() => setupMentionInput(), 100);
      }
    } else if (chatType === 'ai') {
      const infoEmailEl = document.getElementById("infoEmail");
      if (infoEmailEl) infoEmailEl.textContent = "Advanced AI Assistant";

      const statusTextEl = document.getElementById("statusText");
      if (statusTextEl) statusTextEl.textContent = "?? AI Ready";

      const infoStatusEl = document.getElementById("infoStatus");
      if (infoStatusEl) infoStatusEl.textContent = "?? AI Ready";

      updateChatProfileDisplay(username, profilePic, "?? AI Ready");

      const infoDescEl = document.getElementById("infoDesc");
      const infoBrandLogo = document.getElementById("infoBrandLogo");
      if (infoDescEl) infoDescEl.textContent = "Official NEX_DEV Neural Assistant. Primary interface for the NEXCHAT ecosystem. Advanced robotic intelligence designed for cross-sector synchronization.";
      if (infoBrandLogo) infoBrandLogo.style.display = 'block';

      showNotif("?? Welcome to Chronex AI! Ask me anything!", "info");
    } else {
      const userDoc = await getDoc(doc(db, "users", uid));
      let userData = {};

      if (userDoc.exists()) {
        userData = userDoc.data();
        const infoEmail = document.getElementById("infoEmail");
        if (infoEmail) infoEmail.textContent = userData.email || "";

        const statusText = getUserPresenceStatus(userData);
        const statusTextEl = document.getElementById("statusText");
        if (statusTextEl) statusTextEl.textContent = statusText;

        const infoStatusEl = document.getElementById("infoStatus");
        if (infoStatusEl) infoStatusEl.textContent = statusText;

        updateChatProfileDisplay(username, profilePic, statusText);
      } else {
        console.warn("User document not found in database, but proceeding with UID:", uid);
        const infoEmail = document.getElementById("infoEmail");
        if (infoEmail) infoEmail.textContent = "Profile pending...";

        const statusTextEl = document.getElementById("statusText");
        if (statusTextEl) statusTextEl.textContent = "? Pending";

        const infoStatusEl = document.getElementById("infoStatus");
        if (infoStatusEl) infoStatusEl.textContent = "? Pending";

        updateChatProfileDisplay(username, profilePic, "? Pending");
      }
    }

    const infoDescEl = document.getElementById("infoDesc");
    const infoBrandLogo = document.getElementById("infoBrandLogo");
    if (chatType === 'ai') {
      if (infoDescEl) infoDescEl.textContent = "Official NEX_DEV Neural Assistant. Primary interface for the NEXCHAT ecosystem. Advanced robotic intelligence designed for cross-sector synchronization.";
      if (infoBrandLogo) infoBrandLogo.style.display = 'block';
    } else {
      if (infoDescEl) infoDescEl.textContent = "";
      if (infoBrandLogo) infoBrandLogo.style.display = 'none';
    }

    if (chatType === 'direct' && myUID && uid !== myUID) {
      try {
        const myUserRef = doc(db, "users", myUID);
        const myUserDoc = await getDoc(myUserRef);
        const myContacts = myUserDoc.data()?.contacts || [];

        if (!myContacts.includes(uid)) {
          myContacts.push(uid);
          await updateDoc(myUserRef, { contacts: myContacts });
          console.log("? Added user to contacts");

          setTimeout(() => {
            if (typeof loadContacts === 'function') loadContacts();
          }, 300);
        }
      } catch (contactErr) {
        console.warn("Could not update contacts:", contactErr);
      }
    }

    showChatDetailView();

    if (chatType === 'group') {
      loadGroupMessages(uid);
      await loadChatBackground(uid, chatType);
    } else {
      loadMessages();
      await loadChatBackground(uid, chatType);
    }

    const pollBtn = document.getElementById('poll-btn');

    if (chatType === 'group') {
      if (pollBtn) pollBtn.style.display = 'block';
    } else {
      if (pollBtn) pollBtn.style.display = 'none';
      setTimeout(() => updateBlockUnblockUI(), 100);
    }

  } catch (err) {
    console.error("Error loading chat info:", err);
    showNotif("? Error loading chat info: " + err.message, "error");
    currentChatUser = null;
    return;
  }

  initAiModelSelection();
}

document.getElementById('poll-btn')?.addEventListener('click', () => {
  if (currentChatType === 'group' && currentChatUser) {
    GroupChat.showPollModal(async (question, options) => {
      try {
        await GroupChat.createPoll(db, currentChatUser, myUID, question, options);
        showNotif('📊 Poll created successfully!', 'success');
      } catch (err) {
        showNotif('Failed to create poll: ' + (err.message || err), 'error');
      }
    });
  }
});

document.getElementById("menuBtn")?.addEventListener("click", (e) => {
  e.stopPropagation();
  const menu = document.getElementById("chatOptionsMenu");
  const menuBtn = document.getElementById("menuBtn");

  if (menu) {
    const isVisible = menu.style.display !== "none";

    if (!isVisible) {
      menu.style.display = "block";

      if (menuBtn) {
        const rect = menuBtn.getBoundingClientRect();
        menu.style.top = (rect.bottom + 5) + "px";
        menu.style.right = (window.innerWidth - rect.right) + "px";
      }
    } else {
      menu.style.display = "none";
    }

    const adminBtn = document.getElementById("groupAdminBtn");
    if (adminBtn) {
      adminBtn.style.display = currentChatType === 'group' ? 'block' : 'none';
    }
    const inviteQrBtn = document.getElementById("groupInviteQrBtn");
    if (inviteQrBtn) {
      inviteQrBtn.style.display = currentChatType === 'group' ? 'block' : 'none';
    }
  }
});

document.addEventListener("click", (e) => {
  const menu = document.getElementById("chatOptionsMenu");
  const menuBtn = document.getElementById("menuBtn");

  if (menu && menuBtn && !menu.contains(e.target) && !menuBtn.contains(e.target)) {
    menu.style.display = "none";
  }
});

document.getElementById("groupAdminBtn")?.addEventListener("click", () => {
  if (currentChatType === 'group' && currentChatUser) {
    showGroupAdminPanel(currentChatUser);
    document.getElementById("chatOptionsMenu").style.display = "none";
  }
});

document.getElementById("groupInviteQrBtn")?.addEventListener("click", () => {
  if (currentChatType === 'group' && currentChatUser) {
    document.getElementById("chatOptionsMenu").style.display = "none";
    GroupChat.showInviteModal(currentChatUser, currentChatName || 'Group', {
      onCopy: () => showNotif('📋 Invite link copied!', 'success'),
      onShare: () => showNotif('🔗 Shared invite link!', 'info')
    });
  }
});

document.getElementById("chatHeaderProfile")?.addEventListener("click", () => {
  if (currentChatType === 'group' && currentChatUser) {
    showGroupInfoPanel(currentChatUser);
  } else if (currentChatType === 'direct' && currentChatUser) {
    showUserInfoPanel(currentChatUser);
  }
});

document.getElementById("muteBtn")?.addEventListener("click", async () => {
  if (!currentChatUser) return;
  showNotif("?? Chat muted", "success");
  document.getElementById("chatOptionsMenu").style.display = "none";
});

document.getElementById("blockBtn")?.addEventListener("click", async () => {
  if (!currentChatUser || !myUID) {
    showNotif("? Please log in first", "error");
    return;
  }

  try {
    const userRef = doc(db, "users", myUID);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      showNotif("? User profile not found", "error");
      return;
    }

    const blockedUsers = userDoc.data()?.blockedUsers || [];

    if (!blockedUsers.includes(currentChatUser)) {
      await updateDoc(userRef, {
        blockedUsers: [...blockedUsers, currentChatUser]
      });
      showNotif("?? User blocked successfully (chat history preserved)", "success");
      updateBlockUnblockUI();
      document.getElementById("chatOptionsMenu").style.display = "none";
    } else {
      showNotif("?? User already blocked", "error");
    }
  } catch (err) {
    console.error("Block error:", err);
    showNotif("? Error blocking user: " + err.message, "error");
  }
  document.getElementById("chatOptionsMenu").style.display = "none";
});

document.getElementById("unblockBtn")?.addEventListener("click", async () => {
  if (!currentChatUser || !myUID) {
    showNotif("? Please log in first", "error");
    return;
  }

  try {
    const userRef = doc(db, "users", myUID);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      showNotif("? User profile not found", "error");
      return;
    }

    const blockedUsers = userDoc.data()?.blockedUsers || [];

    if (blockedUsers.includes(currentChatUser)) {
      const updatedBlockedUsers = blockedUsers.filter(uid => uid !== currentChatUser);
      await updateDoc(userRef, {
        blockedUsers: updatedBlockedUsers
      });
      showNotif("? User unblocked successfully", "success");
      updateBlockUnblockUI();
      document.getElementById("chatOptionsMenu").style.display = "none";
    } else {
      showNotif("?? User is not blocked", "error");
    }
  } catch (err) {
    console.error("Unblock error:", err);
    showNotif("? Error unblocking user: " + err.message, "error");
  }
  document.getElementById("chatOptionsMenu").style.display = "none";
});

async function updateBlockUnblockUI() {
  if (!currentChatUser || !myUID) return;

  try {
    const userRef = doc(db, "users", myUID);
    const userDoc = await getDoc(userRef);

    const blockedUsers = userDoc.data()?.blockedUsers || [];
    const isBlocked = blockedUsers.includes(currentChatUser);

    const blockBtn = document.getElementById("blockBtn");
    const unblockBtn = document.getElementById("unblockBtn");

    if (isBlocked) {
      if (blockBtn) blockBtn.style.display = "none";
      if (unblockBtn) unblockBtn.style.display = "block";
    } else {
      if (blockBtn) blockBtn.style.display = "block";
      if (unblockBtn) unblockBtn.style.display = "none";
    }
  } catch (err) {
    console.error("Error updating block/unblock UI:", err);
  }
}

document.getElementById("deleteBtn")?.addEventListener("click", async () => {
  if (!currentChatUser || !confirm("Delete this chat? Messages will be removed.")) return;

  try {
    const q = query(
      collection(db, "messages"),
      where("from", "in", [myUID, currentChatUser])
    );
    const snap = await getDocs(q);

    const batch = [];
    snap.forEach(docSnap => {
      const m = docSnap.data();
      if ((m.from === myUID && m.to === currentChatUser) ||
        (m.from === currentChatUser && m.to === myUID)) {
        batch.push(deleteDoc(docSnap.ref));
      }
    });

    await Promise.all(batch);
    showNotif("Chat deleted", "success");
    goBack();
  } catch (err) {
    showNotif("Error deleting chat: " + err.message, "error");
  }
  document.getElementById("chatOptionsMenu").style.display = "none";
});

document.getElementById("reportBtn")?.addEventListener("click", async () => {
  if (!currentChatUser || !myUID) return;

  try {
    const reportRef = collection(db, "reports");
    await addDoc(reportRef, {
      reportedBy: myUID,
      reportedUser: currentChatUser,
      reason: "User reported from chat",
      timestamp: serverTimestamp(),
      status: "pending"
    });

    showNotif("? User reported successfully - Our team will review this", "success");
    document.getElementById("chatOptionsMenu").style.display = "none";
  } catch (err) {
    console.error("Report error:", err);
    showNotif("? Error submitting report: " + err.message, "error");
  }
});

async function requestMediaPermissions(isVideo = false) {
  try {
    const constraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: isVideo ? {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      } : false
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    window.currentCallStream = stream;
    return stream;
  } catch (err) {
    console.error('Permission denied or device not found:', err);
    if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
      showNotif('? Camera/Microphone permission denied. Please allow access in browser settings and refresh.', 'error', 6000);
      if (navigator.permissions && navigator.permissions.query) {
        try {
          navigator.permissions.query({ name: 'microphone' }).then(permissionState => {
            if (permissionState.state === 'denied') {
              showNotif('?? Microphone permission is denied; please update site permissions.', 'info', 6000);
            }
          });
        } catch (pErr) {
        }
      }
    } else if (err.name === 'NotFoundError') {
      showNotif('? No camera or microphone found on this device', 'error', 6000);
    } else {
      showNotif(`? Error accessing device: ${err.message}`, 'error', 6000);
    }
    return null;
  }
}

let callTimeoutTimer = null;

async function startCall(isVideo = false) {
  if (!currentChatUser) {
    showNotif('Select a chat first', 'error');
    return;
  }

  if (callActive) {
    showNotif('Call already in progress', 'info');
    return;
  }

  if (!myUID) {
    showNotif('Please log in before placing a call', 'error');
    return;
  }

  if (currentChatType === 'group') {
    GroupChat.showGroupCallModal({
      groupName: currentChatName || 'Group Call',
      callType: isVideo ? 'video' : 'audio',
      participants: [],
      onJoin: async (type) => {
        try {
          await joinLiveKitCall(currentChatUser, myUsername || 'User', type === 'video');
        } catch (err) {
          showNotif('Group call error: ' + (err.message || err), 'error');
        }
      }
    });
    return;
  }

  if (currentChatType !== 'direct') {
    showNotif('Calls are available only in direct or group chats', 'error');
    return;
  }

  const callTypeText = isVideo ? 'video' : 'voice';

  try {
    const callDocRef = await addDoc(collection(db, 'calls'), {
      callerId: myUID,
      callerName: myUsername || '',
      receiverId: currentChatUserId,
      receiverName: currentChatUser,
      callType: callTypeText,
      status: 'ringing',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    activeCallDocId = callDocRef.id;
    setupCallDocumentListener(activeCallDocId);

    showNotif(`?? Calling ${currentChatUser}...`, 'info');
    hapticFeedback('medium');

    const stream = await requestMediaPermissions(isVideo);
    if (!stream) {
      await updateDoc(callDocRef, {
        status: 'failed',
        updatedAt: serverTimestamp()
      }).catch(() => { });
      return;
    }

    callActive = true;
    callStartTime = Date.now();

    showCallUI(isVideo, 'ringing');
    startCallTimer();

    stream.getTracks().forEach(track => {
      track.onended = () => {
        if (callActive) {
          endCall();
        }
      };
    });

    showNotif(`?? ${isVideo ? 'Video' : 'Voice'} call started to @${currentChatUser.substring(0, 8)}...`, 'success');

    if (callTimeoutTimer) clearTimeout(callTimeoutTimer);
    callTimeoutTimer = setTimeout(async () => {
      if (callActive && activeCallDocId) {
        console.log('?? Call timeout after 60s - marking as no-answer (missed call)');
        try {
          await updateDoc(doc(db, 'calls', activeCallDocId), {
            status: 'no-answer',
            endedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });

          const callHistoryId = await saveCallToHistory(myUID, currentChatUserId, callTypeText, 60, 'missed');
          console.log('?? Missed call logged to history:', callHistoryId);
          showNotif(`?? Missed call from @${currentChatUser}`, 'info');
          endCall();
        } catch (err) {
          console.error('Error saving missed call:', err);
        }
      }
    }, 60000); // 60 seconds
  } catch (err) {
    console.error('Error starting call:', err);
    showNotif('Error starting call: ' + err.message, 'error');
  }
}

function showCallUI(isVideo = false, callStatus = 'active') {
  const avatarSrc = document.getElementById('activeChatAvatar')?.src || '';
  const localLabel = myUsername || 'You';
  const remoteLabel = currentChatUser || 'Unknown';

  const existing = document.getElementById('call-overlay');
  if (existing) {
    existing.remove();
  }

  const callOverlay = document.createElement('div');
  callOverlay.id = 'call-overlay';
  callOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.95);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 999;
    padding: 20px;
    backdrop-filter: blur(10px);
    `;

  callOverlay.innerHTML = `
      <div style="text-align: center; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; position: relative;">
        
        <!-- Main Content Area -->
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%;">
          ${isVideo ? `
          <!-- Video Call Layout -->
          <div id="video-container" style="
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
          ">
            <!-- Remote Video (Full screen background) -->
            <video id="remote-video" autoplay playsinline style="
              width: 100%;
              height: 100%;
              object-fit: cover;
              background: #000;
              position: absolute;
              top: 0;
              left: 0;
              border-radius: 0;
            "></video>

            <!-- Network Quality Indicator -->
            <div id="network-indicator" style="
              position: absolute;
              top: 20px;
              left: 20px;
              display: flex;
              align-items: center;
              gap: 8px;
              background: rgba(0,0,0,0.7);
              padding: 8px 12px;
              border-radius: 20px;
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255,255,255,0.1);
              z-index: 15;
            ">
              <div id="network-bars" style="display: flex; gap: 2px;">
                <div class="network-bar" style="width: 3px; height: 12px; background: #ff4444; border-radius: 1px;"></div>
                <div class="network-bar" style="width: 3px; height: 16px; background: #ffaa44; border-radius: 1px;"></div>
                <div class="network-bar" style="width: 3px; height: 20px; background: #ffff44; border-radius: 1px;"></div>
                <div class="network-bar" style="width: 3px; height: 24px; background: #44ff44; border-radius: 1px;"></div>
              </div>
              <span id="network-text" style="color: #fff; font-size: 12px; font-weight: 500;">Connecting...</span>
            </div>

            <!-- Call Status Overlay -->
            <div id="call-status-overlay" style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              text-align: center;
              z-index: 12;
              display: ${callStatus === 'active' ? 'none' : 'block'};
            ">
              <div style="
                width: 160px;
                height: 160px;
                border-radius: 50%;
                border: 4px solid #00ff66;
                padding: 4px;
                margin: 0 auto 30px;
                box-shadow: 0 0 40px rgba(0,255,102,0.4);
                animation: pulse-ring-professional 2s infinite;
                background: linear-gradient(135deg, rgba(0,255,102,0.1), rgba(0,255,102,0.05));
              ">
                <img src="${avatarSrc}" style="
                  width: 100%;
                  height: 100%;
                  object-fit: cover;
                  border-radius: 50%;
                  background: #333;
                  border: 2px solid rgba(255,255,255,0.1);
                ">
              </div>
              <h2 style="color: #00ff66; font-size: 28px; margin: 10px 0; font-weight: 300; text-shadow: 0 2px 10px rgba(0,255,102,0.3);">${callStatus === 'ringing' ? 'Calling...' : 'Connecting...'}</h2>
              <p style="color: #fff; font-size: 18px; margin: 0; font-weight: 500; opacity: 0.9;">${currentChatUser}</p>
              <div id="call-status-dots" style="margin-top: 20px;">
                <div style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #00ff66; margin: 0 4px; animation: dot-pulse 1.5s infinite;"></div>
                <div style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #00ff66; margin: 0 4px; animation: dot-pulse 1.5s infinite 0.2s;"></div>
                <div style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #00ff66; margin: 0 4px; animation: dot-pulse 1.5s infinite 0.4s;"></div>
              </div>
            </div>

            <!-- Local Video (Professional corner preview) -->
            <div id="local-video-container" style="
              position: absolute;
              top: 20px;
              right: 20px;
              width: 140px;
              height: 180px;
              border-radius: 16px;
              overflow: hidden;
              border: 3px solid rgba(255,255,255,0.9);
              box-shadow: 0 8px 32px rgba(0,0,0,0.3);
              z-index: 13;
              background: #000;
              backdrop-filter: blur(20px);
            ">
              <video id="local-video" autoplay playsinline muted style="
                width: 100%;
                height: 100%;
                object-fit: cover;
                background: #000;
              "></video>
              <div id="local-video-placeholder" style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #333, #555);
                color: #fff;
                font-size: 12px;
                text-align: center;
              ">Camera Off</div>
            </div>

            <!-- Call Duration & Info -->
            <div id="call-info" style="
              position: absolute;
              bottom: 120px;
              left: 50%;
              transform: translateX(-50%);
              background: rgba(0,0,0,0.8);
              padding: 12px 24px;
              border-radius: 25px;
              backdrop-filter: blur(15px);
              border: 1px solid rgba(255,255,255,0.1);
              display: ${callStatus === 'active' ? 'block' : 'none'};
              z-index: 14;
            ">
              <div id="call-duration" style="color: #fff; font-size: 24px; font-weight: 300; text-align: center; font-family: 'Roboto', sans-serif;">0:00</div>
              <div id="call-quality" style="color: #00ff66; font-size: 12px; text-align: center; margin-top: 4px; opacity: 0.8;">HD Quality</div>
            </div>
          </div>
          ` : `
          <!-- Voice Call Layout (Professional Design) -->
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            min-height: 100vh;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
          ">
            <!-- Network Quality for Voice Calls -->
            <div id="voice-network-indicator" style="
              position: absolute;
              top: 40px;
              left: 50%;
              transform: translateX(-50%);
              display: flex;
              align-items: center;
              gap: 8px;
              background: rgba(0,0,0,0.7);
              padding: 8px 16px;
              border-radius: 20px;
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255,255,255,0.1);
            ">
              <div id="voice-network-bars" style="display: flex; gap: 2px;">
                <div class="network-bar" style="width: 3px; height: 12px; background: #44ff44; border-radius: 1px;"></div>
                <div class="network-bar" style="width: 3px; height: 16px; background: #44ff44; border-radius: 1px;"></div>
                <div class="network-bar" style="width: 3px; height: 20px; background: #44ff44; border-radius: 1px;"></div>
                <div class="network-bar" style="width: 3px; height: 24px; background: #44ff44; border-radius: 1px;"></div>
              </div>
              <span id="voice-network-text" style="color: #fff; font-size: 12px; font-weight: 500;">Excellent</span>
            </div>

            <div style="
              width: 220px;
              height: 220px;
              border-radius: 50%;
              border: 5px solid #00ff66;
              padding: 5px;
              margin-bottom: 50px;
              box-shadow: 0 0 50px rgba(0,255,102,0.4);
              animation: pulse-ring-professional 2s infinite;
              background: linear-gradient(135deg, rgba(0,255,102,0.1), rgba(0,255,102,0.05));
              position: relative;
            ">
              <img src="${avatarSrc}" style="
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 50%;
                background: #333;
                border: 3px solid rgba(255,255,255,0.1);
              ">
              <!-- Voice Activity Indicator -->
              <div id="voice-activity" style="
                position: absolute;
                bottom: 10px;
                right: 10px;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #44ff44;
                border: 2px solid #fff;
                opacity: 0;
                transition: opacity 0.3s ease;
              "></div>
            </div>

            <h2 style="color: #00ff66; font-size: 32px; margin: 10px 0; font-weight: 300; text-shadow: 0 2px 10px rgba(0,255,102,0.3);">${callStatus === 'ringing' ? 'Calling...' : remoteLabel}</h2>
            <p style="color: #fff; font-size: 16px; margin: 4px 0; opacity: 0.9;">Voice Call</p>
            <p id="call-status-label" style="color: #fff; font-size: 18px; margin: 5px 0; opacity: 0.8;">${callStatus === 'ringing' ? 'Ringing...' : callStatus === 'active' ? 'Connected' : 'Calling...'}</p>
            <p id="call-duration" style="color: #fff; font-size: 48px; margin: 30px 0; font-weight: 200; font-family: 'Roboto', sans-serif; display: ${callStatus === 'active' ? 'block' : 'none'}; text-shadow: 0 2px 10px rgba(255,255,255,0.1);">0:00</p>

            <!-- Call Status Animation -->
            <div id="voice-call-dots" style="margin-top: 20px; display: ${callStatus !== 'active' ? 'block' : 'none'};">
              <div style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #00ff66; margin: 0 4px; animation: dot-pulse 1.5s infinite;"></div>
              <div style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #00ff66; margin: 0 4px; animation: dot-pulse 1.5s infinite 0.2s;"></div>
              <div style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #00ff66; margin: 0 4px; animation: dot-pulse 1.5s infinite 0.4s;"></div>
            </div>
          </div>
          `}
        </div>
        
        <!-- Professional Call Controls -->
        <div style="
          position: absolute;
          bottom: 40px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          padding: 0 20px;
          z-index: 20;
        ">
          ${callStatus === 'active' ? `
            <!-- Active Call Controls -->
            <div style="display: flex; align-items: center; gap: 12px;">
              ${isVideo ? `
                <button id="toggle-camera-btn" class="call-control-btn-professional" title="Toggle Camera" style="background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05));">
                  <span class="control-icon">📹</span>
                  <span class="control-label">Camera</span>
                </button>
                <button id="switch-camera-btn" class="call-control-btn-professional" title="Switch Camera" style="background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05));">
                  <span class="control-icon">🔄</span>
                  <span class="control-label">Switch</span>
                </button>
              ` : ``}
              <button id="toggle-mic-btn" class="call-control-btn-professional" title="Toggle Microphone" style="background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05));">
                <span class="control-icon">🎤</span>
                <span class="control-label">Mic</span>
              </button>
              <button id="toggle-speaker-btn" class="call-control-btn-professional" title="Toggle Speaker" style="background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05));">
                <span class="control-icon">🔊</span>
                <span class="control-label">Speaker</span>
              </button>
            </div>
            <button id="end-call-btn" class="end-call-btn-professional" title="End Call">
              <span class="end-icon">📞</span>
              <span class="end-text">End Call</span>
            </button>
          ` : `
            <!-- Outgoing Call Controls -->
            <div style="display: flex; align-items: center; gap: 12px;">
              <button id="mute-preview-btn" class="call-control-btn-professional" title="Mute Preview" style="background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05)); display: ${isVideo ? 'flex' : 'none'};">
                <span class="control-icon">🔇</span>
                <span class="control-label">Mute</span>
              </button>
            </div>
            <button id="end-call-btn" class="end-call-btn-professional cancel" title="Cancel Call">
              <span class="end-icon">❌</span>
              <span class="end-text">Cancel</span>
            </button>
          `}
        </div>
      </div>
      
      <style>
        .call-control-btn {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: none;
          background: rgba(255,255,255,0.2);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          backdrop-filter: blur(10px);
        }
        
        .call-control-btn:hover {
          background: rgba(255,255,255,0.3);
          transform: scale(1.1);
        }
        
        .call-control-btn.disabled {
          background: rgba(255,68,68,0.3) !important;
          color: #ffaaaa !important;
        }
        
        .control-icon {
          font-size: 24px;
        }

        .end-call-btn {
          width: 140px;
          height: 50px;
          border-radius: 25px;
          border: none;
          background: #ff4444;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
          box-shadow: 0 4px 15px rgba(255, 68, 68, 0.4);
        }

        .end-call-btn:hover {
          background: #ff6666;
          transform: scale(1.05);
        }

        .end-icon {
          font-size: 18px;
        }

        .end-text {
          font-size: 16px;
        }

        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(0, 255, 102, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(0, 255, 102, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 255, 102, 0); }
        }
      </style>

      <style>
        /* Professional Call Control Styles */
        .call-control-btn-professional {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.2);
          color: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(15px);
          position: relative;
          overflow: hidden;
        }

        .call-control-btn-professional::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .call-control-btn-professional:hover {
          transform: translateY(-2px) scale(1.05);
          border-color: rgba(255,255,255,0.4);
          box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        }

        .call-control-btn-professional:hover::before {
          opacity: 1;
        }

        .call-control-btn-professional.disabled {
          background: linear-gradient(135deg, rgba(255,68,68,0.3), rgba(255,68,68,0.1)) !important;
          border-color: #ff4444 !important;
          color: #ffaaaa !important;
        }

        .call-control-btn-professional.disabled .control-icon {
          opacity: 0.6;
        }

        .control-icon {
          font-size: 20px;
          margin-bottom: 2px;
          transition: all 0.3s ease;
        }

        .control-label {
          font-size: 10px;
          font-weight: 500;
          opacity: 0.8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .end-call-btn-professional {
          width: 140px;
          height: 50px;
          border-radius: 25px;
          border: none;
          background: linear-gradient(135deg, #ff4444, #ff6666);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-weight: 600;
          box-shadow: 0 4px 20px rgba(255, 68, 68, 0.4);
          backdrop-filter: blur(15px);
          position: relative;
          overflow: hidden;
        }

        .end-call-btn-professional::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s ease;
        }

        .end-call-btn-professional:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 30px rgba(255, 68, 68, 0.6);
        }

        .end-call-btn-professional:hover::before {
          left: 100%;
        }

        .end-call-btn-professional.cancel {
          background: linear-gradient(135deg, #666, #888);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .end-call-btn-professional.cancel:hover {
          background: linear-gradient(135deg, #777, #999);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
        }

        .end-icon {
          font-size: 18px;
        }

        .end-text {
          font-size: 14px;
          letter-spacing: 0.5px;
        }

        /* Professional Animations */
        @keyframes pulse-ring-professional {
          0% {
            box-shadow: 0 0 0 0 rgba(0, 255, 102, 0.4), 0 0 0 0 rgba(0, 255, 102, 0.2) inset;
          }
          50% {
            box-shadow: 0 0 0 10px rgba(0, 255, 102, 0), 0 0 0 10px rgba(0, 255, 102, 0.1) inset;
          }
          100% {
            box-shadow: 0 0 0 0 rgba(0, 255, 102, 0), 0 0 0 0 rgba(0, 255, 102, 0) inset;
          }
        }

        @keyframes dot-pulse {
          0%, 80%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          40% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        /* Network Quality Animation */
        .network-bar {
          transition: all 0.3s ease;
          animation: network-pulse 2s ease-in-out infinite;
        }

        .network-bar:nth-child(1) { animation-delay: 0s; }
        .network-bar:nth-child(2) { animation-delay: 0.1s; }
        .network-bar:nth-child(3) { animation-delay: 0.2s; }
        .network-bar:nth-child(4) { animation-delay: 0.3s; }

        @keyframes network-pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        /* Voice Activity Animation */
        @keyframes voice-activity-pulse {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.3);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0.8;
          }
        }

        #voice-activity.active {
          animation: voice-activity-pulse 0.6s ease-in-out infinite;
        }

        /* Responsive Design */
        @media (max-width: 480px) {
          .call-control-btn-professional {
            width: 60px;
            height: 60px;
          }

          .control-icon {
            font-size: 18px;
          }

          .control-label {
            font-size: 9px;
          }

          .end-call-btn-professional {
            width: 120px;
            height: 45px;
          }

          .end-text {
            font-size: 13px;
          }
        }
      </style>
    </div>
      `;

  document.body.appendChild(callOverlay);

  if (isVideo) {
    setupVideoStreams(window.currentCallStream);
  }

  const endBtn = document.getElementById('end-call-btn');
  endBtn.addEventListener('click', () => {
    endCall();
    callOverlay.remove();
  });

  let cameraEnabled = true;
  let micEnabled = true;
  let speakerEnabled = true;

  // Network quality simulation
  const updateNetworkQuality = () => {
    const networkBars = document.querySelectorAll('.network-bar');
    const networkText = document.getElementById('network-text') || document.getElementById('voice-network-text');

    // Simulate network quality (in real app, this would come from WebRTC stats)
    const quality = Math.random();
    let qualityLevel, qualityText, barCount;

    if (quality > 0.8) {
      qualityLevel = 'excellent';
      qualityText = 'Excellent';
      barCount = 4;
    } else if (quality > 0.6) {
      qualityLevel = 'good';
      qualityText = 'Good';
      barCount = 3;
    } else if (quality > 0.4) {
      qualityLevel = 'fair';
      qualityText = 'Fair';
      barCount = 2;
    } else {
      qualityLevel = 'poor';
      qualityText = 'Poor';
      barCount = 1;
    }

    // Update bars
    networkBars.forEach((bar, index) => {
      if (index < barCount) {
        bar.style.background = qualityLevel === 'excellent' ? '#44ff44' :
                             qualityLevel === 'good' ? '#ffff44' :
                             qualityLevel === 'fair' ? '#ffaa44' : '#ff4444';
        bar.style.opacity = '1';
      } else {
        bar.style.opacity = '0.3';
      }
    });

    if (networkText) {
      networkText.textContent = qualityText;
      networkText.style.color = qualityLevel === 'excellent' ? '#44ff44' :
                               qualityLevel === 'good' ? '#ffff44' :
                               qualityLevel === 'fair' ? '#ffaa44' : '#ff4444';
    }
  };

  // Update network quality every 3 seconds
  if (callStatus === 'active') {
    updateNetworkQuality();
    setInterval(updateNetworkQuality, 3000);
  }

  if (isVideo) {
    const toggleCameraBtn = document.getElementById('toggle-camera-btn');
    const switchCameraBtn = document.getElementById('switch-camera-btn');

    toggleCameraBtn?.addEventListener('click', () => {
      cameraEnabled = !cameraEnabled;
      const localVideo = document.getElementById('local-video');
      const localVideoPlaceholder = document.getElementById('local-video-placeholder');

      if (localVideo && localVideo.srcObject) {
        const videoTrack = localVideo.srcObject.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = cameraEnabled;
          toggleCameraBtn.classList.toggle('disabled', !cameraEnabled);

          // Update icon and label
          const iconSpan = toggleCameraBtn.querySelector('.control-icon');
          const labelSpan = toggleCameraBtn.querySelector('.control-label');
          if (iconSpan && labelSpan) {
            if (cameraEnabled) {
              iconSpan.textContent = '📹';
              labelSpan.textContent = 'Camera';
            } else {
              iconSpan.textContent = '📷';
              labelSpan.textContent = 'Off';
            }
          }

          // Show/hide placeholder
          if (localVideoPlaceholder) {
            localVideoPlaceholder.style.display = cameraEnabled ? 'none' : 'flex';
          }
        }
      }
    });

    switchCameraBtn?.addEventListener('click', async () => {
      try {
        const localVideo = document.getElementById('local-video');
        if (localVideo && localVideo.srcObject) {
          const videoTrack = localVideo.srcObject.getVideoTracks()[0];
          if (videoTrack && videoTrack.getCapabilities && videoTrack.getCapabilities().facingMode) {
            await videoTrack.applyConstraints({
              facingMode: videoTrack.getSettings().facingMode === 'user' ? 'environment' : 'user'
            });
          }
        }
      } catch (error) {
        console.warn('Camera switch not supported:', error);
      }
    });
  }

  const toggleMicBtn = document.getElementById('toggle-mic-btn');
  toggleMicBtn?.addEventListener('click', () => {
    micEnabled = !micEnabled;
    const localVideo = document.getElementById('local-video');

    if (localVideo && localVideo.srcObject) {
      const audioTrack = localVideo.srcObject.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = micEnabled;
        toggleMicBtn.classList.toggle('disabled', !micEnabled);

        // Update icon and label
        const iconSpan = toggleMicBtn.querySelector('.control-icon');
        const labelSpan = toggleMicBtn.querySelector('.control-label');
        if (iconSpan && labelSpan) {
          if (micEnabled) {
            iconSpan.textContent = '🎤';
            labelSpan.textContent = 'Mic';
          } else {
            iconSpan.textContent = '🔇';
            labelSpan.textContent = 'Muted';
          }
        }
      }
    }
  });

  const toggleSpeakerBtn = document.getElementById('toggle-speaker-btn');
  toggleSpeakerBtn?.addEventListener('click', () => {
    speakerEnabled = !speakerEnabled;
    // In a real implementation, this would control audio output routing
    toggleSpeakerBtn.classList.toggle('disabled', !speakerEnabled);

    const iconSpan = toggleSpeakerBtn.querySelector('.control-icon');
    const labelSpan = toggleSpeakerBtn.querySelector('.control-label');
    if (iconSpan && labelSpan) {
      if (speakerEnabled) {
        iconSpan.textContent = '🔊';
        labelSpan.textContent = 'Speaker';
      } else {
        iconSpan.textContent = '🔈';
        labelSpan.textContent = 'Earpiece';
      }
    }
  });

  const mutePreviewBtn = document.getElementById('mute-preview-btn');
  mutePreviewBtn?.addEventListener('click', () => {
    // Mute preview audio during outgoing call
    const localVideo = document.getElementById('local-video');
    if (localVideo && localVideo.srcObject) {
      const audioTrack = localVideo.srcObject.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        mutePreviewBtn.classList.toggle('disabled', !audioTrack.enabled);
      }
    }
  });

  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      endCall();
      callOverlay.remove();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}

async function setupVideoStreams(stream = null) {
  try {
    const localVideo = document.getElementById('local-video');

    if (!localVideo) {
      console.error('Local video element not found');
      return;
    }

    if (!stream && window.currentCallStream) {
      stream = window.currentCallStream;
    }

    if (!stream) {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
    }

    localVideo.srcObject = stream;

    window.currentCallStream = stream;

    console.log('? Video stream connected successfully');
    showNotif('?? Camera connected', 'success', 2000);


    setTimeout(() => {
      const placeholder = document.getElementById('remote-placeholder');
      if (placeholder) {
        placeholder.innerHTML = `
          <p style="color: #00ff66; font-size: 14px;">?? Waiting for ${currentChatUser} to join...</p>
          <p style="color: #888; font-size: 12px; margin-top: 10px;">For full P2P video calling, WebRTC signaling server required</p>
        `;
      }
    }, 2000);

  } catch (error) {
    console.error('Error setting up video streams:', error);
    showNotif(`? Camera error: ${error.message}`, 'error', 4000);
  }
}

function detachCallDocListener() {
  if (callDocListener) {
    callDocListener();
    callDocListener = null;
  }
}

function setupCallDocumentListener(callId) {
  detachCallDocListener();

  const callRef = doc(db, 'calls', callId);
  callDocListener = onSnapshot(callRef, async (snap) => {
    if (!snap.exists()) return;
    const callData = snap.data();

    if (!callData || !callData.status) return;

    if (callData.status === 'accepted') {
      if (callTimeoutTimer) {
        clearTimeout(callTimeoutTimer);
        callTimeoutTimer = null;
      }
      showNotif('?? Call connected', 'success');
      if (!callActive) {
        callActive = true;
        callStartTime = Date.now();
        showCallUI(callData.callType === 'video', 'active');
        startCallTimer();
      } else {
        const statusLabel = document.getElementById('call-status-label');
        if (statusLabel) statusLabel.textContent = 'Connected';
      }
    } else if (callData.status === 'rejected') {
      if (callTimeoutTimer) {
        clearTimeout(callTimeoutTimer);
        callTimeoutTimer = null;
      }
      showNotif('? Call rejected', 'error');
      if (callData.receiverId === myUID && !callActive) {
        await saveCallToHistory(callData.callerId, myUID, callData.callType, 0, 'rejected');
      }
      endCall();
    } else if (callData.status === 'no-answer') {
      if (callTimeoutTimer) {
        clearTimeout(callTimeoutTimer);
        callTimeoutTimer = null;
      }
      showNotif(`?? Missed ${callData.callType} call from @${callData.callerName || callData.callerId}`, 'info');
      if (callData.receiverId === myUID) {
        await saveCallToHistory(callData.callerId, myUID, callData.callType, 0, 'missed');
      }
      endCall();
    } else if (callData.status === 'ended') {
      showNotif('?? Call ended', 'info');
      endCall();
    }
  }, (err) => {
    console.warn('Call listener error:', err);
  });
}

function startCallTimer() {
  if (callTimer) clearInterval(callTimer);
  callTimer = setInterval(() => {
    const elapsed = Math.floor((Date.now() - (callStartTime || Date.now())) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = String(elapsed % 60).padStart(2, '0');
    const callDuration = document.getElementById('call-duration');
    if (callDuration) {
      callDuration.textContent = `${mins}:${secs}`;
    }
  }, 1000);
}

function setupIncomingCallListener() {
  if (!myUID) return;

  if (incomingCallListener) {
    incomingCallListener();
    incomingCallListener = null;
  }

  const incomingQuery = query(
    collection(db, 'calls'),
    where('receiverId', '==', myUID),
    where('status', '==', 'ringing')
  );

  incomingCallListener = onSnapshot(incomingQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type !== 'added') return;
      const callData = change.doc.data();
      const callId = change.doc.id;

      if (callActive) {
        updateDoc(doc(db, 'calls', callId), {
          status: 'busy',
          updatedAt: serverTimestamp()
        }).catch((err) => console.warn('Failed to mark call busy:', err));
        return;
      }

      showIncomingCallPrompt(callId, callData);
    });
  }, (err) => {
    console.warn('Incoming call listener error:', err);
  });
}

async function showIncomingCallPrompt(callId, callData) {
  if (incomingCallOverlay) return;

  const callerName = callData.callerName || callData.callerId || 'Unknown';
  const isVideo = callData.callType === 'video';

  notifyIncomingCall(callerName, isVideo);

  incomingCallOverlay = document.createElement('div');
  incomingCallOverlay.id = 'incoming-call-overlay';
  incomingCallOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.85);
    color: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    gap: 20px;
    padding: 20px;
  `;

  incomingCallOverlay.innerHTML = `
    <div style="text-align: center; max-width: 90%;">
      <h2 style="font-size: 28px; color: #00ff66; margin-bottom: 10px;">Incoming ${isVideo ? 'Video' : 'Voice'} Call</h2>
      <p style="font-size: 18px; margin-bottom: 10px;">${callerName} is calling you...</p>
    </div>
    <div style="display: flex; gap: 20px;">
      <button id="accept-call-btn" style="padding: 14px 28px; border: none; border-radius: 12px; background: #00b300; color: white; font-size: 16px; cursor: pointer;">Accept</button>
      <button id="reject-call-btn" style="padding: 14px 28px; border: none; border-radius: 12px; background: #ff4444; color: white; font-size: 16px; cursor: pointer;">Reject</button>
    </div>
  `;

  document.body.appendChild(incomingCallOverlay);

  startRinging(); // Start ringing sound for incoming call

  document.getElementById('accept-call-btn')?.addEventListener('click', async () => {
    stopRinging(); // Stop ringing when accepting
    incomingCallOverlay.remove();
    incomingCallOverlay = null;

    currentChatUser = callData.callerId;
    currentChatType = 'direct';

    try {
      await updateDoc(doc(db, 'calls', callId), {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error accepting call:', err);
      showNotif('? Unable to accept call', 'error');
      return;
    }

    activeCallDocId = callId;
    setupCallDocumentListener(callId);

    const stream = await requestMediaPermissions(isVideo);
    if (!stream) {
      await updateDoc(doc(db, 'calls', callId), {
        status: 'rejected',
        updatedAt: serverTimestamp()
      });
      return;
    }

    callActive = true;
    callStartTime = Date.now();
    showCallUI(isVideo, 'active');
    startCallTimer();
  });

  document.getElementById('reject-call-btn')?.addEventListener('click', async () => {
    stopRinging(); // Stop ringing when rejecting
    incomingCallOverlay.remove();
    incomingCallOverlay = null;

    try {
      await updateDoc(doc(db, 'calls', callId), {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error rejecting call:', err);
      showNotif('? Unable to reject call', 'error');
    }
  });
}

document.addEventListener('audioMessageReady', (e) => {
  if (e.detail && e.detail.file) {
    console.log("?? Audio message ready received in chat.js");
    selectedFile = e.detail.file;

    const form = document.getElementById('message-form');
    if (form) {
      const submitEvent = new Event('submit', {
        'bubbles': true,
        'cancelable': true
      });
      form.dispatchEvent(submitEvent);
    }
  }
});

function endCall() {
  const callDuration = callStartTime ? Math.floor((Date.now() - callStartTime) / 1000) : 0;
  const callType = document.getElementById('local-video') ? 'video' : 'voice';

  if (currentChatUser && myUID) {
    saveCallToHistory(myUID, currentChatUserId, callType, callDuration, 'completed').catch(err => {
      console.warn('Could not save call to history:', err);
    });
  }

  if (callTimer) clearInterval(callTimer);
  callActive = false;
  callStartTime = null;

  // Disconnect and cleanup LiveKit cloud room
  leaveLiveKitCall();

  if (window.currentCallStream) {
    window.currentCallStream.getTracks().forEach(track => {
      track.stop();
    });
    window.currentCallStream = null;
  }

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      devices.forEach(device => {
      });
    }).catch(err => console.warn('Could not enumerate devices:', err));
  }

  if (activeCallDocId) {
    const callRef = doc(db, 'calls', activeCallDocId);
    updateDoc(callRef, {
      status: 'ended',
      endedAt: serverTimestamp(),
      duration: Math.floor(callDuration),
      updatedAt: serverTimestamp()
    }).catch(err => console.warn('Could not update call status:', err));
    activeCallDocId = null;
  }

  detachCallDocListener();

  if (callTimeoutTimer) {
    clearTimeout(callTimeoutTimer);
    callTimeoutTimer = null;
  }

  const overlay = document.getElementById('call-overlay');
  if (overlay) overlay.remove();

  if (incomingCallOverlay) {
    incomingCallOverlay.remove();
    incomingCallOverlay = null;
  }

  showNotif('?? Call ended', 'info');
  hapticFeedback('light');
}

function bindCallButtonListeners() {
  const callBtn = document.getElementById("callBtn");
  if (callBtn) {
    callBtn.addEventListener("click", () => {
      startCall(false);
      const menu = document.getElementById("chatOptionsMenu");
      if (menu) menu.style.display = "none";
    });
  }

  const videoCallBtn = document.getElementById("videoCallBtn");
  if (videoCallBtn) {
    videoCallBtn.addEventListener("click", () => {
      startCall(true);
      const menu = document.getElementById("chatOptionsMenu");
      if (menu) menu.style.display = "none";
    });
  }

  const infoCallBtn = document.getElementById("infoCallBtn");
  if (infoCallBtn) {
    infoCallBtn.addEventListener("click", () => startCall(false));
  }

  const infoVideoBtn = document.getElementById("infoVideoBtn");
  if (infoVideoBtn) {
    infoVideoBtn.addEventListener("click", () => startCall(true));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindCallButtonListeners);
} else {
  bindCallButtonListeners();
}

document.getElementById("infoAddBtn")?.addEventListener("click", () => {
  if (currentChatType === 'group') {
    openAddGroupMembersPrompt();
  } else {
    showNotif("?? Add members to convert to group chat", "info");
  }
});

document.getElementById("infoAddMemberBtn")?.addEventListener("click", () => {
  if (currentChatType === 'group') {
    openAddGroupMembersPrompt();
  }
});

document.getElementById("confirmAddGroupMembersBtn")?.addEventListener("click", async (e) => {
  e.preventDefault();
  if (currentChatType === 'group' && currentChatUser) {
    await addSelectedGroupMembersToGroup(currentChatUser);
  }
});

document.getElementById("openMuteMembersModalBtn")?.addEventListener("click", () => {
  if (currentChatType === 'group' && currentChatUser) {
    openMuteMemberModal(currentChatUser);
  } else {
    showNotif('? Select a group first', 'error');
  }
});

document.getElementById("closeMuteMemberModalBtn")?.addEventListener("click", () => {
  closeMuteMemberModal();
});

document.getElementById("saveMuteMemberSettingsBtn")?.addEventListener("click", async (e) => {
  e.preventDefault();
  await saveMuteMemberSettings();
});

const disappearingToggleEl = document.getElementById("disappearingToggle");
if (disappearingToggleEl) {
  disappearingToggleEl.addEventListener("change", () => {
    const durationRow = document.getElementById("disappearingDurationRow");
    if (durationRow) {
      durationRow.style.display = disappearingToggleEl.checked ? 'flex' : 'none';
    }
  });
}

document.getElementById("saveDisappearingSettingsBtn")?.addEventListener("click", async (e) => {
  e.preventDefault();
  if (currentChatType !== 'group' || !currentChatUser) {
    showNotif('? Select a group first', 'error');
    return;
  }

  const enabled = document.getElementById("disappearingToggle")?.checked;
  const durationMinutes = parseInt(document.getElementById("disappearingDurationSelect")?.value || '60', 10) || 60;

  try {
    await updateGroupDisappearingMessages(currentChatUser, enabled, durationMinutes);
    showNotif('? Disappearing message settings saved', 'success');
    await showGroupInfoPanel(currentChatUser);
  } catch (err) {
    console.error('Error saving disappearing settings:', err);
    showNotif('? Failed to save disappearing settings', 'error');
  }
});

document.getElementById("cancelAddGroupMembersBtn")?.addEventListener("click", (e) => {
  e.preventDefault();
  closeAddGroupMembersModal();
});

document.getElementById("infoRemoveAllMembersBtn")?.addEventListener("click", async () => {
  if (currentChatType === 'group' && currentChatUser) {
    await removeAllGroupMembers(currentChatUser);
  }
});

document.getElementById("infoDeleteGroupBtn")?.addEventListener("click", async () => {
  if (currentChatType === 'group' && currentChatUser) {
    await deleteGroup(currentChatUser);
  }
});

document.getElementById("infoSearchBtn")?.addEventListener("click", () => {
  openSearch();
  showNotif("?? Search within this chat", "info");
});

document.getElementById("infoBtn")?.addEventListener("click", () => {
  const sidebar = document.getElementById("infoSidebar");
  if (sidebar && currentChatUser) {
    sidebar.style.display = sidebar.style.display === "none" ? "block" : "none";
  }
});

document.getElementById("closeInfoBtn")?.addEventListener("click", () => {
  document.getElementById("infoSidebar").style.display = "none";
});

document.getElementById("infoBlockBtn")?.addEventListener("click", async () => {
  if (!currentChatUser || !myUID) {
    showNotif("? Please log in first", "error");
    return;
  }

  try {
    const userRef = doc(db, "users", myUID);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      showNotif("? User profile not found", "error");
      return;
    }

    const blockedUsers = userDoc.data()?.blockedUsers || [];

    if (!blockedUsers.includes(currentChatUser)) {
      await updateDoc(userRef, {
        blockedUsers: [...blockedUsers, currentChatUser]
      });
      showNotif("?? User blocked successfully", "success");
      document.getElementById("infoSidebar").style.display = "none";
      setTimeout(() => goBack(), 500);
    } else {
      showNotif("?? User already blocked", "error");
    }
  } catch (err) {
    console.error("Block error:", err);
    showNotif("? Error blocking user: " + err.message, "error");
  }
});

document.getElementById("infoDeleteBtn")?.addEventListener("click", async () => {
  if (!currentChatUser || !confirm("Delete this chat?")) return;

  try {
    const q = query(collection(db, "messages"));
    const snap = await getDocs(q);

    const batch = [];
    snap.forEach(docSnap => {
      const m = docSnap.data();
      if ((m.from === myUID && m.to === currentChatUser) ||
        (m.from === currentChatUser && m.to === myUID)) {
        batch.push(deleteDoc(docSnap.ref));
      }
    });

    await Promise.all(batch);
    showNotif("Chat deleted", "success");
    goBack();
  } catch (err) {
    showNotif("Error: " + err.message, "error");
  }
});

document.getElementById("infoReportBtn")?.addEventListener("click", async () => {
  if (!currentChatUser || !myUID) return;

  try {
    const reportRef = collection(db, "reports");
    await addDoc(reportRef, {
      reportedBy: myUID,
      reportedUser: currentChatUser,
      reason: "User reported from info panel",
      timestamp: serverTimestamp(),
      status: "pending"
    });

    showNotif("? User reported successfully - Our team will review this", "success");
    document.getElementById("infoSidebar").style.display = "none";
  } catch (err) {
    console.error("Report error:", err);
    showNotif("? Error submitting report: " + err.message, "error");
  }
});

document.getElementById("settingsBtn")?.addEventListener("click", () => {
  showNotif("?? Settings - Coming soon!", "info");
});

window.logoutUser = async function () {
  if (!confirm("🔒 Are you sure you want to exit NEXCHAT?")) {
    return;
  }

  try {
    if (myUID) {
      await updateDoc(doc(db, "users", myUID), { online: false });
    }
    resetAuthFlags(); // Reset all auth flags before logout
    await signOut(auth);
    localStorage.clear();
    sessionStorage.clear();
    showNotif("👋 See you soon!", "success", 1000);
    setTimeout(() => {
      window.location.href = "index.html";
    }, 500);
  } catch (err) {
    showNotif("Logout error: " + err.message, "error");
  }
};

document.getElementById("logout-btn")?.addEventListener("click", logoutUser);

document.getElementById("nav-messages")?.addEventListener("click", () => {
  showChatListView();
  showNotif("Messages", "info", 800);
});

document.getElementById("nav-status")?.addEventListener("click", () => {
  const statusContainer = document.getElementById("statusContainer");
  const chatListView = document.getElementById("chatListView");

  if (statusContainer.style.display === "none") {
    chatListView.style.display = "none";
    statusContainer.style.display = "block";
    document.getElementById("nav-messages").classList.remove("active");
    document.getElementById("nav-status").classList.add("active");
    showNotif("?? NEX-STATUS", "info", 800);
  } else {
    statusContainer.style.display = "none";
    chatListView.style.display = "block";
    document.getElementById("nav-status").classList.remove("active");
    document.getElementById("nav-messages").classList.add("active");
    showNotif("Messages", "info", 800);
  }
});

document.getElementById("nav-announcements")?.addEventListener("click", () => {
  const announcementsContainer = document.getElementById("announcementsContainer");
  const chatListView = document.getElementById("chatListView");
  const statusContainer = document.getElementById("statusContainer");
  const groupsContainer = document.getElementById("groupsContainer");

  if (announcementsContainer.style.display === "none") {
    chatListView.style.display = "none";
    statusContainer.style.display = "none";
    groupsContainer.style.display = "none";
    announcementsContainer.style.display = "flex";

    document.getElementById("nav-messages").classList.remove("active");
    document.getElementById("nav-status").classList.remove("active");
    document.getElementById("nav-groups").classList.remove("active");
    document.getElementById("nav-announcements").classList.add("active");

    loadAnnouncements();
    showNotif("?? Announcements", "info", 800);
  } else {
    announcementsContainer.style.display = "none";
    chatListView.style.display = "block";
    document.getElementById("nav-announcements").classList.remove("active");
    document.getElementById("nav-messages").classList.add("active");
    showNotif("Messages", "info", 800);
  }
});




document.getElementById("nav-terminal")?.addEventListener("click", () => {
  window.open('terminal.html', '_blank', 'width=1000,height=700,scrollbars=yes,resizable=yes');
  showNotif("?? Terminal Opened", "info", 800);
});

let selectedFile = null;

document.getElementById("attach-btn")?.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  document.getElementById("file-input")?.click();
});

document.getElementById("file-input")?.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const maxSize = 50 * 1024 * 1024; // 50MB

  if (file.size > maxSize) {
    showNotif("? File too large (max 50MB)", "error", 2000);
    return;
  }

  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime',
    'application/pdf'
  ];

  if (!allowedTypes.includes(file.type)) {
    showNotif("? File type not supported. Use: Images, Videos, or PDF", "error", 2000);
    return;
  }

  selectedFile = file;
  showAttachmentPreview(file);
  showNotif(`? File selected: ${file.name} `, "success", 1500);
  try { document.dispatchEvent(new CustomEvent('selectedFileChanged')); } catch (e) { }
});

function showAttachmentPreview(file) {
  const preview = document.getElementById("attachment-preview");
  const nameEl = document.getElementById("attachment-name");

  if (preview && nameEl) {
    nameEl.textContent = file.name;
    preview.style.display = "block";
  }
}

document.getElementById("remove-attachment")?.addEventListener("click", (e) => {
  e.preventDefault();
  removeAttachment();
});

function removeAttachment() {
  selectedFile = null;
  const fileInput = document.getElementById("file-input");
  if (fileInput) fileInput.value = "";

  const preview = document.getElementById("attachment-preview");
  if (preview) preview.style.display = "none";

  showNotif("? Attachment removed", "info", 1000);
  try { document.dispatchEvent(new CustomEvent('selectedFileChanged')); } catch (e) { }
}

async function uploadFileToStorage(file, chatId, isGroup = false) {
  return new Promise((resolve, reject) => {
    try {
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      const folderPath = isGroup ? `group-attachments/${chatId}/${myUID}` : `chat-attachments/${myUID}`;
      const fileRef = storageRef(storage, `${folderPath}/${fileName}`);

      const totalSize = file.size;
      const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);

      console.log(`?? Uploading file: ${file.name} (${totalSizeMB}MB)`);

      const modal = document.getElementById('uploadProgressModal');
      const filenameEl = modal.querySelector('.progress-filename');
      const sizeEl = modal.querySelector('.progress-size');
      const percentageEl = modal.querySelector('.progress-percentage');
      const circle = modal.querySelector('.progress-ring-circle');

      filenameEl.textContent = file.name;
      sizeEl.textContent = `0.00 / ${totalSizeMB} MB`;
      percentageEl.textContent = '0%';
      circle.style.strokeDashoffset = '314'; // Full circle
      modal.style.display = 'flex';

      // 1. If Video, use Cloudinary unsigned upload
      if (file.type && file.type.startsWith('video/')) {
        uploadVideoToCloudinary(file, {
          folder: isGroup ? `groups/${chatId}` : `chats/${myUID}`,
          onProgress: (progress, text) => {
            percentageEl.textContent = `${Math.round(progress)}%`;
            sizeEl.textContent = text;
            circle.style.strokeDashoffset = 314 - (314 * progress / 100);
          }
        }).then((res) => {
          modal.style.display = 'none';
          showNotif(`? Video uploaded successfully!`, 'success', 3000);
          resolve({
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            downloadURL: res.secure_url,
            uploadedAt: serverTimestamp()
          });
        }).catch((cloudErr) => {
          console.warn('Cloudinary upload warning, falling back to Vercel Media Blob:', cloudErr);
          fallbackToMediaBlob();
        });
        return;
      }

      // 2. For voice notes, documents, and other attachments, use Vercel Media Blob
      function fallbackToMediaBlob() {
        uploadMediaBlob(file, {
          folder: isGroup ? `group-attachments/${chatId}` : `chat-attachments/${myUID}`,
          uid: myUID,
          access: 'public',
          onProgress: (progress, text) => {
            percentageEl.textContent = `${Math.round(progress)}%`;
            sizeEl.textContent = text;
            circle.style.strokeDashoffset = 314 - (314 * progress / 100);
          }
        }).then((res) => {
          modal.style.display = 'none';
          showNotif(`? ${file.name} uploaded successfully`, 'success', 3000);
          resolve({
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            downloadURL: res.url,
            uploadedAt: serverTimestamp()
          });
        }).catch((blobErr) => {
          console.warn('Media blob upload warning, falling back to storage:', blobErr);
          runFirebaseStorageUpload();
        });
      }

      function runFirebaseStorageUpload() {
        const uploadTask = uploadBytesResumable(fileRef, file);

        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            const uploadedMB = (snapshot.bytesTransferred / 1024 / 1024).toFixed(2);
            const dashOffset = 314 - (314 * progress / 100);

            percentageEl.textContent = `${Math.round(progress)}%`;
            sizeEl.textContent = `${uploadedMB} / ${totalSizeMB} MB`;
            circle.style.strokeDashoffset = dashOffset;
          },
          (error) => {
            console.error("? Error uploading file:", error);
            modal.style.display = 'none';
            showNotif(`? Upload failed: ${error.message}`, 'error');
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              modal.style.display = 'none';
              showNotif(`? ${file.name} uploaded successfully`, 'success', 3000);
              resolve({
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                downloadURL: downloadURL,
                uploadedAt: serverTimestamp()
              });
            } catch (error) {
              modal.style.display = 'none';
              reject(error);
            }
          }
        );
      }

      fallbackToMediaBlob();
      return;
    } catch (error) {
      reject(error);
    }
  });
}



async function transferTokens() {
  console.log("?? Transfer Tokens button clicked!");
  console.log("?? Current myUID:", myUID);

  const recipientUID = document.getElementById("recipientUID")?.value.trim();
  const amount = parseInt(document.getElementById("transferAmount")?.value || 0);
  const resultEl = document.getElementById("transferResult");
  const transferBtn = document.getElementById("transferTokensBtn");

  console.log("?? Recipient UID input:", recipientUID);
  console.log("?? Amount input:", amount);
  console.log("?? Result element:", resultEl);
  console.log("?? Transfer button:", transferBtn);

  if (!myUID) {
    if (resultEl) {
      resultEl.innerHTML = `<span style="color: #ff6b6b;">? Please log in first. If you are logged in, try refreshing the page.</span>`;
    }
    showNotif("? Authentication required", "error");
    console.error("? myUID is null - user not authenticated");
    return;
  }

  if (!resultEl) {
    console.error("? Transfer result element not found!");
    return;
  }

  if (!recipientUID) {
    resultEl.innerHTML = `<span style="color: #ff6b6b;">? Please enter recipient UID</span>`;
    return;
  }

  if (!amount || amount <= 0) {
    resultEl.innerHTML = `<span style="color: #ff6b6b;">? Please enter a valid amount</span>`;
    return;
  }

  if (amount > 99999) {
    resultEl.innerHTML = `<span style="color: #ff6b6b;">? Amount cannot exceed 99,999 tokens</span>`;
    return;
  }

  if (recipientUID === myUID) {
    resultEl.innerHTML = `<span style="color: #ff6b6b;">? Cannot transfer tokens to yourself</span>`;
    return;
  }

  try {
    if (transferBtn) {
      transferBtn.disabled = true;
      transferBtn.textContent = "⏳ Processing...";
    }

    resultEl.innerHTML = `<span style="color: #00ff66;">Verifying recipient...</span>`;

    const senderRef = doc(db, "users", myUID);
    const recipientRef = doc(db, "users", recipientUID);
    const giftRef = doc(collection(db, "tokenGifts"));

    const result = await runTransaction(db, async (transaction) => {
      const senderDoc = await transaction.get(senderRef);
      const recipientDoc = await transaction.get(recipientRef);

      if (!senderDoc.exists()) {
        throw new Error("Your user data not found");
      }

      if (!recipientDoc.exists()) {
        throw new Error("Recipient not found - invalid UID");
      }

      const senderTokens = senderDoc.data()?.tokens ?? 0;
      const recipientName = recipientDoc.data()?.username || recipientDoc.data()?.email || "Recipient";

      if (typeof senderTokens !== 'number') {
        throw new Error("Invalid token data format");
      }

      if (senderTokens < amount) {
        throw new Error(`Insufficient balance - You have ${senderTokens} tokens, but trying to send ${amount}`);
      }

      const newSenderTokens = Math.max(0, senderTokens - amount);

      transaction.update(senderRef, {
        tokens: newSenderTokens,
        lastTokenTransfer: serverTimestamp()
      });

      transaction.set(giftRef, {
        senderId: myUID,
        senderName: myUsername || senderDoc.data()?.username || 'Someone',
        recipientId: recipientUID,
        recipientName,
        amount,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return {
        recipientName,
        amount,
        newSenderTokens,
        giftId: giftRef.id
      };
    });

    resultEl.innerHTML = `
      <div style="background: rgba(0, 255, 102, 0.1); border-left: 3px solid #00ff66; padding: 12px; border-radius: 6px; margin-top: 12px;">
        <p style="color: #00ff66; margin: 0; font-weight: 600;">🎁 Gift request sent</p>
        <p style="color: #e0e0e0; margin: 6px 0 0 0; font-size: 13px;">
          Requested <strong>${result.amount} tokens</strong> for <strong>${result.recipientName}</strong>
        </p>
        <p style="color: #888; margin: 4px 0 0 0; font-size: 12px;">
          Tokens have been reserved and will be delivered once accepted.
        </p>
      </div>
    `;

    showNotif(`Gift request created for ${result.recipientName}`, 'success', 3000);
    document.getElementById("recipientUID").value = "";
    document.getElementById("transferAmount").value = "";

    setTimeout(() => {
      if (transferBtn) {
        transferBtn.disabled = false;
        transferBtn.textContent = "🚀 Send Tokens";
      }
      resultEl.innerHTML = "";
    }, 4500);

  } catch (err) {
    console.error("Transfer error:", err);
    console.error("Error code:", err.code);
    console.error("Error message:", err.message);

    let errorMsg = err.message;
    let errorTitle = "Transfer Failed";

    if (err.message && err.message.includes('offline')) {
      errorMsg = "Network error - Check your internet connection";
      errorTitle = "Offline";
    } else if (err.code === 'permission-denied' || err.message?.includes('Permission denied')) {
      errorMsg = "You don't have permission to transfer tokens";
      errorTitle = "Permission Denied";
    } else if (err.code === 'not-found') {
      errorMsg = "User or data not found";
      errorTitle = "Not Found";
    } else if (err.code === 'invalid-argument') {
      errorMsg = "Invalid data - ensure all fields are correct";
      errorTitle = "Invalid Input";
    } else if (err.message?.includes('Insufficient balance')) {
      errorTitle = "Insufficient Balance";
    } else if (err.message?.includes('Recipient not found')) {
      errorMsg = "Recipient UID not found";
      errorTitle = "User Not Found";
    } else if (err.message?.includes('Your user data not found')) {
      errorMsg = "Your account data not found";
      errorTitle = "Account Error";
    }

    resultEl.innerHTML = `
      <div style="background: rgba(255, 107, 107, 0.1); border-left: 3px solid #ff6b6b; padding: 12px; border-radius: 6px; margin-top: 12px;">
        <p style="color: #ff6b6b; margin: 0; font-weight: 600;">⚠️ ${errorTitle}</p>
        <p style="color: #e0e0e0; margin: 6px 0 0 0; font-size: 13px;">${errorMsg}</p>
      </div>
    `;

    if (transferBtn) {
      transferBtn.disabled = false;
      transferBtn.textContent = "🚀 Send Tokens";
    }
  }
}

async function acceptTokenGift(giftId) {
  if (!giftId || !myUID) return;

  const giftRef = doc(db, 'tokenGifts', giftId);
  const recipientRef = doc(db, 'users', myUID);

  try {
    await runTransaction(db, async (transaction) => {
      const giftSnap = await transaction.get(giftRef);
      if (!giftSnap.exists()) {
        throw new Error('Gift request not found.');
      }

      const gift = giftSnap.data();
      if (gift.status !== 'pending') {
        throw new Error('This gift is no longer available.');
      }
      if (gift.recipientId !== myUID) {
        throw new Error('Unauthorized access.');
      }

      const recipientSnap = await transaction.get(recipientRef);
      if (!recipientSnap.exists()) {
        throw new Error('Recipient account not found.');
      }

      const recipientTokens = recipientSnap.data()?.tokens ?? 0;
      transaction.update(recipientRef, {
        tokens: recipientTokens + gift.amount,
        lastTokenReceived: serverTimestamp()
      });

      transaction.update(giftRef, {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });

    closeGiftReceiveDrawer();
    showNotif(`Gift accepted — +${gift.amount} tokens added.`, 'success');
  } catch (error) {
    console.error('Error accepting token gift:', error);
    showNotif('Unable to accept gift: ' + error.message, 'error');
  }
}

async function declineTokenGift(giftId) {
  if (!giftId || !myUID) return;

  const giftRef = doc(db, 'tokenGifts', giftId);
  const giftSnap = await getDoc(giftRef);

  if (!giftSnap.exists()) {
    showNotif('Gift request not found.', 'error');
    return;
  }

  const gift = giftSnap.data();
  if (gift.status !== 'pending' || gift.recipientId !== myUID) {
    showNotif('Unable to decline this gift.', 'error');
    return;
  }

  const senderRef = doc(db, 'users', gift.senderId);

  try {
    await runTransaction(db, async (transaction) => {
      const senderDoc = await transaction.get(senderRef);
      if (!senderDoc.exists()) {
        throw new Error('Sender account not found.');
      }

      const senderTokens = senderDoc.data()?.tokens ?? 0;
      transaction.update(senderRef, {
        tokens: senderTokens + gift.amount,
        lastTokenTransfer: serverTimestamp()
      });

      transaction.update(giftRef, {
        status: 'declined',
        declinedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });

    closeGiftReceiveDrawer();
    showNotif('Gift declined. Tokens returned to sender.', 'info');
  } catch (error) {
    console.error('Error declining token gift:', error);
    showNotif('Unable to decline gift: ' + error.message, 'error');
  }
}

function showGiftReceiveDrawer(gift) {
  const drawer = document.getElementById('giftReceiveDrawer');
  if (!drawer || !gift) return;

  drawer.innerHTML = `
    <div class="drawer-card">
      <div class="drawer-handle"></div>
      <div>
        <h3 class="drawer-title">Gift received</h3>
        <p class="drawer-text">@${escape(gift.senderName || gift.senderId)} has sent you <strong>${gift.amount} tokens</strong>.</p>
      </div>
      <div class="drawer-footer">
        <span class="drawer-meta">Gift ID: ${gift.id}</span>
        <span class="drawer-meta">Received just now</span>
      </div>
      <div class="drawer-actions">
        <button class="drawer-btn accept" id="acceptGiftBtn">Accept Gift</button>
        <button class="drawer-btn decline" id="declineGiftBtn">Decline Gift</button>
      </div>
    </div>
  `;

  drawer.classList.add('show');
  drawer.setAttribute('aria-hidden', 'false');

  document.getElementById('acceptGiftBtn')?.addEventListener('click', () => acceptTokenGift(gift.id));
  document.getElementById('declineGiftBtn')?.addEventListener('click', () => declineTokenGift(gift.id));
}

function closeGiftReceiveDrawer() {
  const drawer = document.getElementById('giftReceiveDrawer');
  if (!drawer) return;

  drawer.classList.remove('show');
  drawer.setAttribute('aria-hidden', 'true');
  setTimeout(() => {
    if (drawer && drawer.getAttribute('aria-hidden') === 'true') {
      drawer.innerHTML = '';
    }
  }, 300);
}

function setupGiftListener() {
  if (!myUID) return;

  const giftsQuery = query(
    collection(db, 'tokenGifts'),
    where('recipientId', '==', myUID),
    where('status', '==', 'pending')
  );

  if (window.giftListener) {
    window.giftListener();
    window.giftListener = null;
  }

  window.giftListener = onSnapshot(giftsQuery, (snapshot) => {
    updateGiftBadge(snapshot.size);
    snapshot.docChanges().forEach(change => {
      if (change.type !== 'added') return;
      const gift = { id: change.doc.id, ...change.doc.data() };
      if (!document.getElementById('giftReceiveDrawer')?.classList.contains('show')) {
        showGiftReceiveDrawer(gift);
        showNotif(`Gift from ${gift.senderName || gift.senderId} is waiting`, 'success', 3000);
      }
    });
  }, (error) => {
    console.warn('Gift listener error:', error);
  });
}

function updateGiftBadge(count = 0) {
  const badge = document.getElementById('giftBadge');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count;
    badge.style.display = 'inline-flex';
  } else {
    badge.textContent = '';
    badge.style.display = 'none';
  }
}

async function showGiftHistory() {
  if (!myUID) return;
  const historyQuery = query(
    collection(db, 'tokenGifts'),
    where('recipientId', '==', myUID),
    orderBy('createdAt', 'desc'),
    limit(8)
  );

  const snapshot = await getDocs(historyQuery);
  const gifts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const drawer = document.getElementById('giftReceiveDrawer');
  if (!drawer) return;

  const rows = gifts.length
    ? gifts.map((gift) => `
        <div class="history-row">
          <span>${escape(gift.senderName || gift.senderId)}</span>
          <span>${gift.amount} tokens</span>
          <span>${gift.status || 'pending'}</span>
        </div>
      `).join('')
    : '<p class="drawer-text">No gifts received yet.</p>';

  drawer.innerHTML = `
    <div class="drawer-card">
      <div class="drawer-handle"></div>
      <h3 class="drawer-title">Gift history</h3>
      ${gifts.length ? `<div class="gift-history-list">${rows}</div>` : ''}
      <div class="drawer-actions">
        <button class="drawer-btn accept" id="closeGiftHistoryBtn">Close</button>
      </div>
    </div>
  `;

  drawer.classList.add('show');
  drawer.setAttribute('aria-hidden', 'false');
  document.getElementById('closeGiftHistoryBtn')?.addEventListener('click', closeGiftReceiveDrawer);
}

let currentPendingPairSession = null;

async function loadLinkedDevices() {
  const currentLabelEl = document.getElementById("currentDeviceLabel");
  if (currentLabelEl) {
    const dev = detectDeviceInfo();
    currentLabelEl.textContent = `${dev.label} • Active now`;
  }

  const listEl = document.getElementById("otherLinkedDevicesList");
  if (!listEl || !myUID) return;

  listEl.innerHTML = '<p style="color:var(--text-muted);font-size:12px;text-align:center;">Loading linked devices...</p>';

  try {
    const devices = await getLinkedDevices(myUID);
    if (!devices || devices.length === 0) {
      listEl.innerHTML = '<p style="color:var(--text-muted);font-size:12px;text-align:center;padding:8px 0;">No other devices linked yet.</p>';
      return;
    }

    listEl.innerHTML = '';
    devices.forEach((dev) => {
      const item = document.createElement('div');
      item.className = 'setting-item';
      item.style.cssText = 'padding: 8px 10px; background: rgba(255,255,255,0.04); border-radius: 8px; justify-content: space-between; align-items: center; display: flex;';
      
      const icon = dev.deviceType === 'Mobile' ? 'fa-mobile-screen' : (dev.deviceType === 'Tablet' ? 'fa-tablet-screen-button' : 'fa-laptop');
      const timeStr = dev.linkedAt?.toDate ? dev.linkedAt.toDate().toLocaleDateString() : 'Recent';

      item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <i class="fa-solid ${icon}" style="font-size: 18px; color: var(--accent-secondary);"></i>
          <div>
            <strong style="color: #fff; font-size: 12.5px;">${escape(dev.label || 'Linked Device')}</strong>
            <p style="margin: 2px 0 0 0; color: var(--text-muted); font-size: 11px;">Linked: ${timeStr}</p>
          </div>
        </div>
        <button class="btn-danger unlink-device-btn" data-session-id="${dev.sessionId}" style="padding: 4px 10px; font-size: 11px; cursor: pointer; border-radius: 6px;">
          <i class="fa-solid fa-link-slash"></i> Log out
        </button>
      `;

      item.querySelector('.unlink-device-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`Log out from ${dev.label || 'this device'}?`)) {
          await unlinkDevice(myUID, dev.sessionId);
          showNotif('Device unlinked and logged out.', 'info', 2000);
          loadLinkedDevices();
        }
      });

      listEl.appendChild(item);
    });
  } catch (err) {
    console.warn('Error loading linked devices:', err);
    listEl.innerHTML = '<p style="color:var(--text-muted);font-size:12px;text-align:center;">Could not load linked devices.</p>';
  }
}

function setupLinkedDeviceListeners() {
  const openModalBtn = document.getElementById("openLinkDeviceModalBtn");
  const modal = document.getElementById("linkDeviceModal");
  const closeModalBtn = document.getElementById("closeLinkDeviceModalBtn");
  const findBtn = document.getElementById("findPairSessionBtn");
  const codeInput = document.getElementById("pairCodeInput");
  const foundCard = document.getElementById("pairSessionFoundCard");
  const foundName = document.getElementById("pairFoundDeviceName");
  const foundMeta = document.getElementById("pairFoundDeviceMeta");
  const approveBtn = document.getElementById("approvePairBtn");
  const rejectBtn = document.getElementById("rejectPairBtn");
  const feedback = document.getElementById("pairStatusFeedback");

  if (!modal) return;

  openModalBtn?.addEventListener('click', () => {
    modal.style.display = 'flex';
    if (codeInput) {
      codeInput.value = '';
      codeInput.focus();
    }
    if (foundCard) foundCard.style.display = 'none';
    if (feedback) feedback.textContent = '';
    currentPendingPairSession = null;
  });

  closeModalBtn?.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  findBtn?.addEventListener('click', async () => {
    const code = codeInput?.value.trim();
    if (!code) {
      if (feedback) {
        feedback.textContent = 'Please enter a 6-character code (e.g. NX-4821)';
        feedback.style.color = '#ff6b6b';
      }
      return;
    }

    if (feedback) {
      feedback.textContent = 'Searching for device session...';
      feedback.style.color = 'var(--accent-primary)';
    }

    try {
      const session = await findPendingSession(code);
      if (!session) {
        if (feedback) {
          feedback.textContent = 'No active pairing session found. Ensure code is correct and not expired.';
          feedback.style.color = '#ff6b6b';
        }
        if (foundCard) foundCard.style.display = 'none';
        return;
      }

      currentPendingPairSession = session;
      const dev = session.deviceInfo || {};
      if (foundName) foundName.textContent = dev.label || `${dev.browser || 'Browser'} on ${dev.os || 'OS'}`;
      if (foundMeta) foundMeta.textContent = `Screen: ${dev.screen || 'Desktop'} • Requesting access`;
      if (foundCard) foundCard.style.display = 'block';
      if (feedback) {
        feedback.textContent = 'Device found! Confirm to authorize login.';
        feedback.style.color = 'var(--accent-primary)';
      }
    } catch (err) {
      console.error('Find session error:', err);
      if (feedback) {
        feedback.textContent = 'Error: ' + err.message;
        feedback.style.color = '#ff6b6b';
      }
    }
  });

  approveBtn?.addEventListener('click', async () => {
    if (!currentPendingPairSession || !auth.currentUser) return;
    approveBtn.disabled = true;
    approveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authorizing...';

    try {
      await approvePairingSession(currentPendingPairSession.id || currentPendingPairSession.sessionId, auth.currentUser);
      if (feedback) {
        feedback.textContent = '✅ Device authorized and linked successfully!';
        feedback.style.color = '#00ff66';
      }
      showNotif('Device linked successfully!', 'success', 2500);
      setTimeout(() => {
        modal.style.display = 'none';
        loadLinkedDevices();
      }, 1500);
    } catch (err) {
      console.error('Approve error:', err);
      if (feedback) {
        feedback.textContent = 'Failed to authorize: ' + err.message;
        feedback.style.color = '#ff6b6b';
      }
    } finally {
      approveBtn.disabled = false;
      approveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Authorize & Link';
    }
  });

  rejectBtn?.addEventListener('click', async () => {
    if (!currentPendingPairSession) return;
    try {
      await rejectPairingSession(currentPendingPairSession.id || currentPendingPairSession.sessionId);
    } catch {}
    if (foundCard) foundCard.style.display = 'none';
    if (feedback) {
      feedback.textContent = 'Authorization denied.';
      feedback.style.color = '#ff6b6b';
    }
    currentPendingPairSession = null;
  });
}

function openSettingsModal() {
  const modal = document.getElementById("settingsModal");
  if (modal) {
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
    loadSettingsPreferences();
    renderSelfAIUserList();
    loadLinkedDevices();

    const ringtoneSelect = document.getElementById("ringtoneSelect");
    if (ringtoneSelect) {
      ringtoneSelect.addEventListener('change', () => {
        selectedRingtone = ringtoneSelect.value;
        startRinging(selectedRingtone);
        setTimeout(() => stopRinging(), 2000);
      });
    }

    const refreshSelfAIListBtn = document.getElementById('refreshSelfAIUserListBtn');
    if (refreshSelfAIListBtn) {
      refreshSelfAIListBtn.onclick = (e) => {
        e.preventDefault();
        renderSelfAIUserList();
        showNotif('? Self AI user list refreshed', 'success', 1500);
      };
    }

    const userUIDDisplay = document.getElementById("userUIDDisplay");
    if (userUIDDisplay && myUID) {
      userUIDDisplay.textContent = myUID;
    }

    loadTokenBalance();

    loadPendingRequests();

    if (isAndroid && navigator.vibrate) {
      navigator.vibrate(50);
    }
  }
}

async function loadGroupPendingRequests(groupId) {
  const listEl = document.getElementById('groupPendingRequestsList');
  const sectionEl = document.getElementById('groupPendingRequestsSection');

  if (!listEl || !sectionEl || !myUID) return;

  listEl.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">Loading pending requests...</p>';

  try {
    const requestsSnap = await getDocs(query(
      collection(db, 'groupJoinRequests'),
      where('groupId', '==', groupId),
      where('status', '==', 'pending')
    ));

    if (requestsSnap.empty) {
      sectionEl.style.display = 'block';
      listEl.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">No pending requests</p>';
      return;
    }

    let html = '';
    requestsSnap.forEach(doc => {
      const request = doc.data();
      const requestId = doc.id;
      const requesterId = request.userId;
      const createdAt = request.createdAt?.toDate?.() || new Date();
      const timeAgo = getTimeAgo(createdAt);

      getDoc(doc(db, 'users', requesterId)).then(userDoc => {
        const userData = userDoc.data() || {};
        const username = userData.username || userData.email || 'Unknown';

        const requestHtml = `
          <div style="padding: 12px; border: 1px solid #333; border-radius: 8px; margin-bottom: 8px; background: rgba(0, 255, 102, 0.05);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <strong style="color: #00ff66;">${username}</strong>
              <small style="color: #aaa;">${timeAgo}</small>
            </div>
            <div style="display: flex; gap: 8px;">
              <button onclick="acceptGroupJoinRequest('${requestId}', '${groupId}')" style="flex: 1; padding: 8px; background: #00ff66; color: #000; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">? Accept</button>
              <button onclick="declineGroupJoinRequest('${requestId}')" style="flex: 1; padding: 8px; background: #ff6b6b; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">? Decline</button>
            </div>
          </div>
        `;

        html += requestHtml;
        listEl.innerHTML = html;
      }).catch(err => {
        console.error('Error getting user data:', err);
      });
    });

    sectionEl.style.display = 'block';

  } catch (error) {
    console.error('Error loading group pending requests:', error);
    listEl.innerHTML = '<p style="color: #ff6b6b; text-align: center; padding: 20px;">Error loading requests</p>';
  }
}

async function loadPendingRequests() {
  const listEl = document.getElementById('pendingRequestsList');
  if (!listEl) return;

  listEl.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">Loading pending requests...</p>';

  if (!myUID) {
    listEl.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">No chat requests at the moment</p>';
    return;
  }

  if (pendingRequestsListener) {
    try {
      pendingRequestsListener();
    } catch (err) {
      console.warn('Failed to clear existing pending requests listener:', err);
    }
    pendingRequestsListener = null;
  }

  const requestsQuery = query(
    collection(db, 'chatRequests'),
    where('to', '==', myUID),
    where('status', '==', 'pending')
  );

  pendingRequestsListener = onSnapshot(requestsQuery, (snapshot) => {
    if (!listEl) return;
    if (snapshot.empty) {
      listEl.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">No chat requests at the moment</p>';
      return;
    }

    let html = '';
    snapshot.forEach(docSnap => {
      const request = docSnap.data();
      const requestId = docSnap.id;
      const fromName = request.fromName || request.from;
      const createdAt = request.createdAt?.toDate?.() || new Date();
      const timeAgo = getTimeAgo(createdAt);

      html += `
        <div style="padding: 12px; border: 1px solid #333; border-radius: 8px; margin-bottom: 8px; background: rgba(0, 255, 102, 0.05);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="color: #00ff66;">${fromName}</strong>
            <small style="color: #aaa;">${timeAgo}</small>
          </div>
          <div style="display: flex; gap: 8px;">
            <button onclick="acceptChatRequest('${requestId}')" style="flex: 1; padding: 8px; background: #00ff66; color: #000; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">? Accept</button>
            <button onclick="declineChatRequest('${requestId}')" style="flex: 1; padding: 8px; background: #ff6b6b; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">? Decline</button>
          </div>
        </div>
      `;
    });

    listEl.innerHTML = html;
  }, (error) => {
    console.error('Pending requests listener error:', error);
    if (listEl) {
      listEl.innerHTML = '<p style="color: #ff6b6b; text-align: center; padding: 20px;">No chat requests at the moment</p>';
    }
  });
}

async function acceptChatRequest(requestId) {
  if (!myUID || !requestId) return;

  try {
    const requestRef = doc(db, 'chatRequests', requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      showNotif('? Request not found', 'error');
      return;
    }

    const request = requestSnap.data();
    if (request.to !== myUID) {
      showNotif('? Unauthorized', 'error');
      return;
    }

    await updateDoc(requestRef, { status: 'accepted' });

    setUserApprovedForChat(request.from);

    await addDoc(collection(db, 'messages'), {
      from: myUID,
      to: request.from,
      text: `? ${myUsername || 'Someone'} accepted your chat request! You can now chat directly.`,
      time: serverTimestamp(),
      read: false,
      type: 'text',
      chatType: 'system'
    });

    showNotif(`? Chat request from ${request.fromName || request.from} accepted`, 'success');
    loadPendingRequests(); // Refresh list

  } catch (error) {
    console.error('Error accepting request:', error);
    showNotif('? Error accepting request', 'error');
  }
}

async function declineChatRequest(requestId) {
  if (!myUID || !requestId) return;

  try {
    const requestRef = doc(db, 'chatRequests', requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      showNotif('? Request not found', 'error');
      return;
    }

    const request = requestSnap.data();
    if (request.to !== myUID) {
      showNotif('? Unauthorized', 'error');
      return;
    }

    await updateDoc(requestRef, { status: 'declined' });

    await addDoc(collection(db, 'messages'), {
      from: myUID,
      to: request.from,
      text: `? ${myUsername || 'Someone'} declined your chat request.`,
      time: serverTimestamp(),
      read: false,
      type: 'text',
      chatType: 'system'
    });

    showNotif(`? Chat request from ${request.fromName || request.from} declined`, 'info');
    loadPendingRequests(); // Refresh list

  } catch (error) {
    console.error('Error declining request:', error);
    showNotif('? Error declining request', 'error');
  }
}

async function acceptGroupJoinRequest(requestId, groupId) {
  if (!myUID || !requestId || !groupId) return;

  try {
    const requestRef = doc(db, 'groupJoinRequests', requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      showNotif('? Request not found', 'error');
      return;
    }

    const request = requestSnap.data();
    if (request.groupId !== groupId) {
      showNotif('? Invalid request', 'error');
      return;
    }

    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    if (!groupDoc.exists()) {
      showNotif('? Group not found', 'error');
      return;
    }

    const groupData = groupDoc.data();
    const groupAdmins = groupData.admins || [groupData.createdBy];
    if (!groupAdmins.includes(myUID)) {
      showNotif('? Unauthorized', 'error');
      return;
    }

    await updateDoc(doc(db, 'groups', groupId), {
      members: arrayUnion(request.userId)
    });

    await updateDoc(requestRef, { status: 'accepted' });

    const welcomeUsername = request.username || 'New member';
    const mentionText = request.username ? `@${request.username.replace(/\s+/g, '_')}` : 'a new member';
    await sendGroupBotMessage(groupId, `??? Group Defense Bot: ${mentionText} has joined the group. Welcome aboard!`, [request.userId]);

    showNotif(`? ${request.username || 'User'} accepted to group`, 'success');
    loadGroupPendingRequests(groupId); // Refresh list

  } catch (error) {
    console.error('Error accepting group join request:', error);
    showNotif('? Error accepting request', 'error');
  }
}

async function declineGroupJoinRequest(requestId) {
  if (!myUID || !requestId) return;

  try {
    const requestRef = doc(db, 'groupJoinRequests', requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      showNotif('? Request not found', 'error');
      return;
    }

    const request = requestSnap.data();

    const groupDoc = await getDoc(doc(db, 'groups', request.groupId));
    if (groupDoc.exists()) {
      const groupData = groupDoc.data();
      const groupAdmins = groupData.admins || [groupData.createdBy];
      if (!groupAdmins.includes(myUID)) {
        showNotif('? Unauthorized', 'error');
        return;
      }
    }

    await updateDoc(requestRef, { status: 'declined' });

    await addDoc(collection(db, 'messages'), {
      from: myUID,
      to: request.userId,
      text: `? Your request to join "${request.groupName || 'the group'}" was declined.`,
      time: serverTimestamp(),
      read: false,
      type: 'text',
      chatType: 'system'
    });

    showNotif(`? ${request.username || 'User'} request declined`, 'info');
    loadGroupPendingRequests(request.groupId); // Refresh list

  } catch (error) {
    console.error('Error declining group join request:', error);
    showNotif('? Error declining request', 'error');
  }
}

window.acceptChatRequest = acceptChatRequest;
window.declineChatRequest = declineChatRequest;
window.acceptGroupJoinRequest = acceptGroupJoinRequest;
window.declineGroupJoinRequest = declineGroupJoinRequest;

function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function closeSettingsModal() {
  const modal = document.getElementById("settingsModal");
  if (modal) {
    modal.style.display = "none";
    document.body.style.overflow = "auto";

    if (isAndroid && navigator.vibrate) {
      navigator.vibrate(30);
    }
  }
}

function loadSettingsPreferences() {
  try {
    const prefs = JSON.parse(localStorage.getItem("nexchat_settings")) || {};

    const notifEl = document.getElementById("notifToggle");
    const soundEl = document.getElementById("soundToggle");
    const onlineEl = document.getElementById("onlineStatusToggle");
    const readEl = document.getElementById("readReceiptsToggle");
    const antiReloadEl = document.getElementById("antiReloadToggle");
    const selfAIEl = document.getElementById("selfAIAutoResponderToggle");

    if (notifEl) notifEl.checked = prefs.notifications !== false;
    if (soundEl) soundEl.checked = prefs.sound !== false;
    if (onlineEl) onlineEl.checked = prefs.onlineStatus !== false;
    if (readEl) readEl.checked = prefs.readReceipts !== false;
    if (antiReloadEl) antiReloadEl.checked = prefs.antiReload === true;
    if (selfAIEl) selfAIEl.checked = prefs.selfAI === true;

    selfAISelectedUserIds = Array.isArray(prefs.selfAIUserIds) ? prefs.selfAIUserIds : [];

    const theme = prefs.theme || "dark";
    const themeEl = document.getElementById("theme" + theme.charAt(0).toUpperCase() + theme.slice(1));
    if (themeEl) themeEl.checked = true;

    selectedRingtone = prefs.ringtone || 'classic';
    const ringtoneSelect = document.getElementById("ringtoneSelect");
    if (ringtoneSelect) ringtoneSelect.value = selectedRingtone;

    const chatSize = prefs.chatSize || "medium";
    const chatSizeFormatted = chatSize.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
    const chatSizeEl = document.getElementById("chatSize" + chatSizeFormatted);
    if (chatSizeEl) chatSizeEl.checked = true;

    const fontFamilySelect = document.getElementById("fontFamilySelect");
    if (fontFamilySelect && prefs.fontFamily) {
      fontFamilySelect.value = prefs.fontFamily;
    }

    const letterSpacingRange = document.getElementById("letterSpacingRange");
    if (letterSpacingRange && prefs.letterSpacing !== undefined) {
      letterSpacingRange.value = prefs.letterSpacing;
      document.getElementById("letterSpacingValue").textContent = prefs.letterSpacing;
    }

    const lineHeightRange = document.getElementById("lineHeightRange");
    if (lineHeightRange && prefs.lineHeight !== undefined) {
      lineHeightRange.value = prefs.lineHeight;
      document.getElementById("lineHeightValue").textContent = prefs.lineHeight;
    }

    const alignButtons = document.querySelectorAll(".text-align-btn");
    alignButtons.forEach(btn => {
      btn.style.background = "#444";
      btn.style.color = "#fff";
    });
    const alignmentBtn = document.getElementById("align" + (prefs.textAlignment || "left").charAt(0).toUpperCase() + (prefs.textAlignment || "left").slice(1));
    if (alignmentBtn) {
      alignmentBtn.style.background = "#00ff66";
      alignmentBtn.style.color = "#000";
    }

    console.log("? Settings loaded successfully", prefs);
  } catch (err) {
    console.error("Error loading settings:", err);
    showNotif("?? Could not load settings", "error");
  }
}

function saveSettingsPreferences() {
  try {
    const notifEl = document.getElementById("notifToggle");
    const soundEl = document.getElementById("soundToggle");
    const onlineEl = document.getElementById("onlineStatusToggle");
    const readEl = document.getElementById("readReceiptsToggle");

    let textAlignment = "left";
    const activeAlignBtn = document.querySelector(".text-align-btn[style*='background: rgb(0, 255, 102)']");
    if (activeAlignBtn) {
      if (activeAlignBtn.id === "alignLeft") textAlignment = "left";
      else if (activeAlignBtn.id === "alignCenter") textAlignment = "center";
      else if (activeAlignBtn.id === "alignRight") textAlignment = "right";
    }

    const antiReloadEl = document.getElementById("antiReloadToggle");
    const selfAIEl = document.getElementById("selfAIAutoResponderToggle");
    const prefs = {
      notifications: notifEl?.checked ?? true,
      sound: soundEl?.checked ?? true,
      onlineStatus: onlineEl?.checked ?? true,
      readReceipts: readEl?.checked ?? true,
      antiReload: antiReloadEl?.checked === true,
      selfAI: selfAIEl?.checked === true,
      selfAIUserIds: Array.from(document.querySelectorAll('#selfAIUserListItems input[type="checkbox"]:checked')).map(cb => cb.value),
      theme: document.querySelector('input[name="theme"]:checked')?.value || "dark",
      ringtone: document.getElementById("ringtoneSelect")?.value || "classic",
      chatSize: document.querySelector('input[name="chatSize"]:checked')?.value || "medium",
      fontFamily: document.getElementById("fontFamilySelect")?.value || "Arial, sans-serif",
      letterSpacing: parseFloat(document.getElementById("letterSpacingRange")?.value) || 0,
      lineHeight: parseFloat(document.getElementById("lineHeightRange")?.value) || 1.5,
      textAlignment: textAlignment,
      lastUpdated: new Date().toISOString()
    };

    localStorage.setItem("nexchat_settings", JSON.stringify(prefs));
    console.log("? Settings saved:", prefs);
    showNotif("? Settings saved", "success", 2000);

    applySettings(prefs);
  } catch (err) {
    console.error("Error saving settings:", err);
    showNotif("? Failed to save settings", "error");
  }
}

function applySettings(prefs) {
  try {
    if (!prefs.notifications) {
      console.log("?? Notifications disabled");
    }

    if (prefs.theme === "light") {
      document.documentElement.style.colorScheme = "light";
      document.body.classList.add("light-theme");
      document.body.classList.remove("dark-theme");
    } else {
      document.documentElement.style.colorScheme = "dark";
      document.body.classList.add("dark-theme");
      document.body.classList.remove("light-theme");
    }

    if (prefs.antiReload) {
      window.onbeforeunload = function (event) {
        const confirmationMessage = 'Anti-reload is enabled. Are you sure you want to leave or refresh the page?';
        event.preventDefault();
        event.returnValue = confirmationMessage;
        return confirmationMessage;
      };
      console.log("? Anti-reload protection enabled");
    } else {
      window.onbeforeunload = null;
      console.log("? Anti-reload protection disabled");
    }

    if (prefs.selfAI) {
      console.log("? Self AI auto-responder enabled");
    } else {
      console.log("? Self AI auto-responder disabled");
    }

    selfAISelectedUserIds = Array.isArray(prefs.selfAIUserIds) ? prefs.selfAIUserIds : [];

    const chatSize = prefs.chatSize || "medium";
    document.documentElement.setAttribute("data-chat-size", chatSize);
    document.body.classList.remove("chat-size-small", "chat-size-medium", "chat-size-large", "chat-size-extra-large");
    document.body.classList.add(`chat-size-${chatSize}`);

    const messagesContainer = document.querySelector('.messages');
    if (messagesContainer) {
      const fontFamily = prefs.fontFamily || "Arial, sans-serif";
      const letterSpacing = (prefs.letterSpacing || 0) + "px";
      const lineHeight = prefs.lineHeight || 1.5;
      const textAlignment = prefs.textAlignment || "left";

      messagesContainer.style.fontFamily = fontFamily;
      messagesContainer.style.letterSpacing = letterSpacing;
      messagesContainer.style.lineHeight = lineHeight;

      document.querySelectorAll('.message-item').forEach(msg => {
        msg.style.textAlign = textAlignment;
      });
    }

    if (isAndroid && navigator.vibrate && prefs.sound) {
      console.log("? Vibration support enabled");
    }

    window.nexchatSettings = prefs;
  } catch (err) {
    console.error("Error applying settings:", err);
  }
}

async function getSelfAIResponse(messageText, senderUID) {
  if (!messageText) return "";
  const endpoint = "http://127.0.0.1:5005/chat";

  try {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: messageText,
        userId: senderUID
      })
    });

    if (resp.ok) {
      const result = await resp.json();
      if (result && result.response) {
        return String(result.response).trim();
      }
    }

    console.warn("? Self AI backend unavailable or returned invalid data");
  } catch (err) {
    console.warn("? Self AI backend fetch failed:", err);
  }

  if (typeof chronexAI !== 'undefined' && chronexAI.chat) {
    try {
      const fallback = await chronexAI.chat(messageText, `self-ai-${senderUID}`);
      return String(fallback || "").trim();
    } catch (err) {
      console.warn("? Chronex AI fallback failed:", err);
    }
  }

  return "I'm sorry, I couldn't generate an auto-reply right now.";
}

async function handleSelfAIReplies(newMessages = []) {
  if (!window.nexchatSettings?.selfAI) return;
  if (!Array.isArray(newMessages) || newMessages.length === 0) return;

  const grouped = {};
  const enabledUsers = Array.isArray(selfAISelectedUserIds) ? selfAISelectedUserIds : [];

  newMessages.forEach((message) => {
    if (!message || !message.from || message.from === myUID) return;
    if (message.type && message.type !== 'text') return;
    if (!message.text || !message.text.trim()) return;
    if (message.autoResponder === 'self-ai') return;
    if (selfAIAutoResponderSeenMessages.has(message.docId)) return;

    selfAIAutoResponderSeenMessages.add(message.docId);
    grouped[message.from] = grouped[message.from] || [];
    grouped[message.from].push(message);
  });

  for (const senderUID of Object.keys(grouped)) {
    if (!enabledUsers.includes(senderUID)) continue;
    const messages = grouped[senderUID];
    if (messages.length === 0) continue;
    const latest = messages[messages.length - 1];
    const prompt = latest.text.trim();
    const response = await getSelfAIResponse(prompt, senderUID);
    if (!response) continue;

    try {
      await addDoc(collection(db, 'messages'), {
        from: myUID,
        to: senderUID,
        text: response,
        time: serverTimestamp(),
        read: false,
        type: 'text',
        autoResponder: 'self-ai',
        autoResponderSource: 'self-ai.py'
      });
      console.log(`? Self AI responded to ${senderUID}`);
    } catch (err) {
      console.warn("? Failed to send Self AI reply:", err);
    }
  }
}

function renderSelfAIUserList() {
  const listContainer = document.getElementById('selfAIUserListItems');
  const hint = document.getElementById('selfAIUserListHint');
  if (!listContainer) return;

  listContainer.innerHTML = '';
  const allContactItems = Array.from(document.querySelectorAll('#contactList .chat-list-item'));
  const validContacts = allContactItems.filter(li => {
    const chatId = li.getAttribute('data-chat-id');
    return chatId && chatId !== 'chronex-ai' && !li.classList.contains('group-item');
  });

  if (validContacts.length === 0) {
    listContainer.innerHTML = '<p style="color: #ccc; font-size: 13px;">Load some chat contacts first and reopen settings to select Self AI targets.</p>';
    return;
  }

  validContacts.forEach(li => {
    const chatId = li.getAttribute('data-chat-id');
    const nameEl = li.querySelector('.chat-name');
    const username = nameEl ? nameEl.textContent : (chatId || 'Unknown');
    const checked = selfAISelectedUserIds.includes(chatId);

    const item = document.createElement('label');
    item.style.cssText = 'display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px 12px; border-radius:12px; background: rgba(0,255,102,0.06); border: 1px solid rgba(0,255,102,0.15); cursor:pointer; color:#e7ffdf;';
    item.innerHTML = `
      <span style="flex:1; min-width:0; white-space: nowrap; overflow:hidden; text-overflow:ellipsis;">${escape(username)}</span>
      <input type="checkbox" value="${escape(chatId)}" ${checked ? 'checked' : ''} style="width:18px; height:18px; accent-color: #00ff66;" />
    `;

    item.querySelector('input')?.addEventListener('change', () => {
      selfAISelectedUserIds = Array.from(document.querySelectorAll('#selfAIUserListItems input[type="checkbox"]:checked')).map(cb => cb.value);
      saveSettingsPreferences();
    });

    listContainer.appendChild(item);
  });

  if (hint) {
    hint.textContent = 'Only users selected here will receive auto-replies from Self AI.';
  }
}

function refreshPage() {
  console.log('🔄 Hard refresh requested - reloading page');
  // Perform hard refresh to clear any cached issues and improve performance
  // location.reload(); // Temporarily disabled to prevent unwanted reloads
  showNotif('Page refresh disabled to prevent issues', 'warning');
}

function validateSettingsIntegrity() {
  try {
    const stored = localStorage.getItem("nexchat_settings");
    if (!stored) {
      console.log("?? No settings found, using defaults");
      return true;
    }

    const parsed = JSON.parse(stored);
    const required = ["notifications", "sound", "onlineStatus", "readReceipts", "theme"];
    const valid = required.every(key => key in parsed);

    if (!valid) {
      console.warn("?? Settings missing required fields, resetting");
      localStorage.removeItem("nexchat_settings");
      return false;
    }

    console.log("? Settings integrity check passed");
    return true;
  } catch (err) {
    console.error("Error validating settings:", err);
    localStorage.removeItem("nexchat_settings");
    return false;
  }
}



window.debugSearchUsers = async function () {
  console.log("?? DEBUG: Testing Firestore user query...");
  console.log("?? Current user UID:", myUID);

  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef);
    const snap = await getDocs(q);

    console.log("? Firestore query successful!");
    console.log("?? Total users found:", snap.docs.length);
    console.log("?? Users in database:");

    snap.docs.forEach(doc => {
      const userData = doc.data();
      console.log({
        uid: doc.id,
        username: userData.username,
        email: userData.email,
        name: userData.name,
        hasProfilePic: !!userData.profilePic,
        online: userData.online
      });
    });

    if (snap.docs.length === 0) {
      console.warn("??  No users found in Firestore!");
    }
  } catch (err) {
    console.error("? Error querying users:", err);
  }
};


window.debugAuthState = function () {
  console.log("?? DEBUG: Checking auth state...");
  console.log("?? myUID (from app):", myUID);
  console.log("?? myUsername (from app):", myUsername);
  console.log("?? auth.currentUser:", auth.currentUser);

  if (auth.currentUser) {
    console.log("? User is authenticated");
    console.log("?? Current UID:", auth.currentUser.uid);
    console.log("?? Current Email:", auth.currentUser.email);
  } else {
    console.log("? No user authenticated");
  }
};


window.debugReloadAndSearch = async function () {
  console.log("?? DEBUG: Reloading and testing search...");

  await new Promise(r => setTimeout(r, 1000));

  console.log("?? Checking auth state...");
  if (!myUID) {
    console.warn("?? User not authenticated yet");
    console.log("? Waiting for auth...");
    let attempts = 0;
    while (!myUID && attempts < 50) {
      await new Promise(r => setTimeout(r, 100));
      attempts++;
    }
  }

  console.log("?? Current myUID:", myUID);

  if (myUID) {
    console.log("? User authenticated, querying users...");
    await window.debugSearchUsers();
  } else {
    console.log("? User still not authenticated!");
  }
};


async function checkVideoLikeMilestones() {
  try {
    if (!myUID) return;

    const videosQuery = query(
      collection(db, 'videos'),
      where('authorId', '==', myUID)
    );

    const videosSnap = await getDocs(videosQuery);

    videosSnap.docs.forEach(async (docSnapshot) => {
      const video = docSnapshot.data();
      const likes = video.likes || 0;

      if (likes >= 1000 && !video.tokensAwarded) {
        try {
          const userRef = doc(db, 'users', myUID);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            const currentTokens = userDoc.data()?.tokens ?? 0;
            const rewardTokens = 1500;
            const newTokens = currentTokens + rewardTokens;

            await updateDoc(userRef, {
              tokens: newTokens
            });

            await updateDoc(docSnapshot.ref, {
              tokensAwarded: true,
              tokensAwardedAt: new Date(),
              tokenRewardAmount: rewardTokens
            });

            const tokenDisplay = document.getElementById("tokenCount");
            if (tokenDisplay) {
              tokenDisplay.textContent = formatBalanceDisplay(newTokens);
            }

            showNotif(`?? Milestone! Your video hit 1k likes! +1.5k tokens (${newTokens} total)`, "success", 3000);
            console.log(`? Rewarded ${rewardTokens} tokens for video with 1k likes`);
          }
        } catch (error) {
          console.error('Error rewarding tokens:', error);
        }
      }
    });
  } catch (error) {
    console.error('Error checking video milestones:', error);
  }
}



async function createPoll(groupId, question, options) {
  if (!myUID || !groupId) return;

  try {
    if (tokens < 1) {
      showNotif('? Not enough tokens (need 1)', 'error');
      return;
    }

    await updateDoc(doc(db, 'users', myUID), {
      tokens: increment(-1)
    });

    const poll = {
      groupId,
      createdBy: myUID,
      question,
      options: options.map(opt => ({
        text: opt,
        votes: 0,
        voters: []
      })),
      timestamp: serverTimestamp(),
      totalVotes: 0
    };

    const pollRef = await addDoc(collection(db, 'groupPolls'), poll);

    await addDoc(collection(db, 'groupMessages'), {
      groupId,
      from: myUID,
      text: `?? Poll: ${question}`,
      pollId: pollRef.id,
      timestamp: serverTimestamp(),
      edited: false,
      isPoll: true
    });

    showNotif('? Poll created successfully', 'success', 1500);

    await updateDoc(doc(db, 'groups', groupId), {
      lastMessage: `?? Poll: ${question}`,
      lastMessageTime: serverTimestamp()
    });

    loadGroupMessages(groupId);

  } catch (error) {
    console.error('Error creating poll:', error);
    showNotif(`Error: ${error.message}`, 'error');
  }
}

async function votePoll(pollId, optionIndex) {
  if (!myUID) return;

  try {
    const pollRef = doc(db, 'groupPolls', pollId);
    const pollDoc = await getDoc(pollRef);

    if (!pollDoc.exists()) {
      showNotif('Poll not found', 'error');
      return;
    }

    const pollData = pollDoc.data();
    const options = pollData.options || [];

    let userVoted = false;
    options.forEach(opt => {
      if (opt.voters && opt.voters.includes(myUID)) {
        userVoted = true;
      }
    });

    if (userVoted) {
      showNotif('?? You already voted on this poll', 'info');
      return;
    }

    options.forEach((opt, idx) => {
      if (opt.voters) {
        opt.voters = opt.voters.filter(v => v !== myUID);
      }
    });

    if (options[optionIndex]) {
      if (!options[optionIndex].voters) options[optionIndex].voters = [];
      options[optionIndex].voters.push(myUID);
      options[optionIndex].votes = options[optionIndex].voters.length;
    }

    const totalVotes = options.reduce((sum, opt) => sum + (opt.votes || 0), 0);

    await updateDoc(pollRef, {
      options,
      totalVotes
    });

    showNotif('? Vote recorded', 'success', 1200);

    loadGroupMessages(pollData.groupId);

  } catch (error) {
    console.error('Error voting on poll:', error);
    showNotif(`Error: ${error.message}`, 'error');
  }
}

function renderPoll(pollId, poll) {
  const pollHTML = document.createElement('div');
  pollHTML.style.cssText = `
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(0, 255, 102, 0.05));
    border: 1px solid #00d4ff;
    border-radius: 12px;
    padding: 12px;
    margin: 8px 0;
  `;

  let optionsHTML = '';
  const totalVotes = poll.totalVotes || 0;
  const options = poll.options || [];

  options.forEach((opt, idx) => {
    const percentage = totalVotes > 0 ? (opt.votes / totalVotes * 100).toFixed(0) : 0;
    const userVoted = opt.voters && opt.voters.includes(myUID);
    const voteColor = userVoted ? '#00ff66' : '#00d4ff';

    optionsHTML += `
      <div style="margin: 10px 0;">
        <button onclick="votePoll('${pollId}', ${idx})" style="
          width: 100%;
          padding: 10px;
          background: linear-gradient(90deg, ${voteColor}40 0%, ${voteColor}10 ${percentage}%, transparent ${percentage}%);
          border: 1px solid ${voteColor};
          border-radius: 8px;
          color: #fff;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 13px;
          position: relative;
        ">
          <span style="font-weight: 600;">${opt.text}</span>
          <span style="float: right; color: ${voteColor}; font-weight: 700;">${opt.votes || 0} (${percentage}%)</span>
        </button>
      </div>
    `;
  });

  pollHTML.innerHTML = `
    <div style="color: #00ff66; font-weight: 600; margin-bottom: 10px;">?? ${escape(poll.question)}</div>
    ${optionsHTML}
    <div style="color: #00d4ff; font-size: 12px; margin-top: 10px; text-align: right;">
      Total votes: ${totalVotes}
    </div>
  `;
  return pollHTML;
}


function applyBackgroundImage(imageUrl) {
  applyActiveWallpaper(imageUrl);
  const app = document.querySelector(".app");
  if (app) {
    if (imageUrl) {
      app.style.backgroundImage = `url('${imageUrl}')`;
      app.style.backgroundSize = imageUrl.startsWith('data:image/svg') ? 'auto' : 'cover';
      app.style.backgroundPosition = 'center';
      app.style.backgroundRepeat = imageUrl.startsWith('data:image/svg') ? 'repeat' : 'no-repeat';
      app.style.backgroundColor = 'transparent';
      app.setAttribute('data-custom-bg', 'true');
    } else {
      app.style.backgroundImage = "none";
      app.style.backgroundColor = "";
      app.setAttribute('data-custom-bg', 'false');
    }
  }
}

function removeBackgroundImage() {
  applyActiveWallpaper(null);
  const app = document.querySelector(".app");
  if (app) {
    app.style.backgroundImage = "none";
    app.style.backgroundColor = "";
    app.setAttribute('data-custom-bg', 'false');
  }
}

window.openChatWallpaperPicker = (chatId, chatName, isGroup) => {
  openWallpaperModal({
    chatId: chatId || currentChatUser,
    chatName: chatName || currentChatName || (isGroup ? 'Group' : 'Chat'),
    chatType: isGroup ? 'group' : (currentChatType || 'direct'),
    myUID: myUID,
    db: db,
    onUploadCustom: async (file) => {
      const res = await uploadMediaBlob(file, {
        folder: 'chat-backgrounds',
        uid: myUID,
        access: 'public'
      });
      return res.url || res.downloadUrl;
    },
    showNotif: showNotif
  });
};

document.getElementById('quickWallpaperBtn')?.addEventListener('click', () => {
  if (typeof window.openChatWallpaperPicker === 'function') {
    window.openChatWallpaperPicker(currentChatUser, currentChatName, currentChatType === 'group');
  }
});

function updateBackgroundPreview(imageUrl) {
  const preview = document.getElementById("backgroundPreview");
  if (preview) {
    preview.style.backgroundImage = `url('${imageUrl}')`;
  }
}


async function loadChatBackground(chatId, chatType) {
  const uid = chatId || currentChatUser;
  const type = chatType || currentChatType;

  try {
    const cachedBg = localStorage.getItem(`chat_bg_${uid}`);
    if (cachedBg) {
      applyBackgroundImage(cachedBg);
      return;
    }

    if (type === 'ai') {
      applyBackgroundImage('chronex-background.jpg');
    }

    if (!myUID || !uid) return;

    const bgDocPath = chatType === 'group'
      ? `groupBackgrounds/${chatId}`
      : `directMessageBackgrounds/${myUID}_${chatId}`;

    const bgDoc = await getDoc(doc(db, bgDocPath.split('/')[0], bgDocPath.split('/')[1]));

    if (bgDoc.exists() && bgDoc.data().backgroundUrl) {
      applyBackgroundImage(bgDoc.data().backgroundUrl);
    } else {
      loadUserBackground();
    }
  } catch (error) {
    console.warn("Could not load chat background:", error);
    loadUserBackground();
  }
}

async function loadUserBackground() {
  try {
    const savedBg = localStorage.getItem("nexchat_background");
    if (savedBg) {
      applyBackgroundImage(savedBg);
      updateBackgroundPreview(savedBg);
      return;
    }

    if (!myUID) return;

    const bgDoc = await getDoc(doc(db, "userBackgrounds", myUID));
    if (bgDoc.exists() && bgDoc.data().backgroundUrl) {
      const bgUrl = bgDoc.data().backgroundUrl;
      applyBackgroundImage(bgUrl);
      updateBackgroundPreview(bgUrl);
      localStorage.setItem("nexchat_background", bgUrl);
    }
  } catch (error) {
    console.warn("?? Failed to load user background:", error);
  }
}

window.loadChatBackground = loadChatBackground;
window.loadUserBackground = loadUserBackground;
window.loadUserBackgroundOnAuth = loadUserBackground;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupInitialization);
} else {
  setupInitialization();
}

function resetProfileStickerToEmoji() {
  const profileBtn = document.getElementById('profile-sticker');
  if (!profileBtn) return;

  profileBtn.style.backgroundImage = 'none';
  profileBtn.style.backgroundSize = '';
  profileBtn.style.backgroundPosition = '';
  profileBtn.style.fontSize = '20px';
  profileBtn.style.color = '';
  profileBtn.style.borderRadius = '50%';
  profileBtn.textContent = '👤';
  profileBtn.onclick = () => {
    const modal = document.getElementById('profilePicModal');
    if (modal) modal.style.display = 'flex';
    const editBtn = document.getElementById('editProfileBtnModal');
    if (editBtn) {
      editBtn.style.display = 'block';
      editBtn.onclick = () => window.location.href = 'profile-upload.html';
    }
  };
}

function updateProfileSticker(profilePic, username) {
  const profileBtn = document.getElementById('profile-sticker');
  if (!profileBtn) return;

  if (!profilePic || !(profilePic.startsWith('http') || profilePic.startsWith('data:'))) {
    resetProfileStickerToEmoji();
    return;
  }

  const testImg = new Image();
  testImg.onload = () => {
    profileBtn.style.backgroundImage = `url('${profilePic}')`;
    profileBtn.style.backgroundSize = 'cover';
    profileBtn.style.backgroundPosition = 'center';
    profileBtn.style.fontSize = '0';
    profileBtn.style.color = 'transparent';
    profileBtn.style.borderRadius = '50%';
    profileBtn.textContent = '';
    profileBtn.onclick = (e) => {
      e.preventDefault();
      const modal = document.getElementById('profilePicModal');
      const modalImg = document.getElementById('profileModalImg');
      const modalName = document.getElementById('profileModalName');
      if (modal && modalImg) {
        modalImg.src = profilePic;
        if (modalName) modalName.innerText = username || 'ME';
        modal.style.display = 'flex';

        const editBtn = document.getElementById('editProfileBtnModal');
        if (editBtn) {
          editBtn.style.display = 'block';
          editBtn.onclick = () => window.location.href = 'profile-upload.html';
        }
      }
    };
  };
  testImg.onerror = () => {
    resetProfileStickerToEmoji();
  };
  testImg.src = profilePic;
}

async function setupInitialization() {
  // Prevent multiple listener setup
  if (authListenersInitialized) {
    console.log("✓ Auth listeners already initialized");
    return;
  }
  authListenersInitialized = true;

  initializeBasicUI();
  setupLinkedDeviceListeners();

  onAuthStateChanged(auth, async (user) => {
    // Clear any pending redirect timers
    if (authRedirectTimer) {
      clearTimeout(authRedirectTimer);
      authRedirectTimer = null;
    }

    if (user) {
      // Check if this device is linked via a secondary session
      const linkedSessionRaw = localStorage.getItem('nexchat_linked_session');
      if (linkedSessionRaw) {
        try {
          const s = JSON.parse(linkedSessionRaw);
          if (s && s.sessionId) {
            listenForSessionRevocation(s.sessionId, () => {
              alert('This device was unlinked by your primary phone.');
              localStorage.removeItem('nexchat_linked_session');
              signOut(auth).catch(() => {});
              window.location.replace('index.html');
            });
          }
        } catch {}
      }

      // Skip re-initialization if already done for this user
      if (pageInitializedForCurrentUser && myUID === user.uid) {
        console.log("✓ Page already initialized for user:", user.uid);
        return;
      }

      // Prevent any redirect attempts
      authRedirectInProgress = false;
      sessionStorage.removeItem('auth_redirect_block');

      myUID = user.uid;
      pageInitializedForCurrentUser = true;
      console.log("✅ User authenticated:", myUID);

      if (typeof chronexAI !== 'undefined' && chronexAI.setUserId) {
        chronexAI.setUserId(myUID);
      }

      try {
        const userDoc = await getDoc(doc(db, "users", myUID));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          myUsername = userData.username || "";
          myProfilePic = userData.profilePic || userData.profilePicUrl || "";

          updateProfileSticker(myProfilePic, myUsername);
          const statusImg = document.getElementById('myStatusPic');
          if (statusImg) {
            statusImg.src = myProfilePic || statusImg.src;
          }

          const profileBtn = document.getElementById('profile-sticker');
          if (profileBtn) {
            profileBtn.onclick = () => {
              const modal = document.getElementById('profilePicModal');
              if (modal) modal.style.display = 'flex';
              const editBtn = document.getElementById('editProfileBtnModal');
              if (editBtn) {
                editBtn.style.display = 'block';
                editBtn.onclick = () => window.location.href = 'profile-upload.html';
              }
            };
          }

          const closeProfileModal = document.getElementById('closeProfileModal');
          if (closeProfileModal) {
            closeProfileModal.onclick = () => {
              document.getElementById('profilePicModal').style.display = 'none';
            };
          }

          const profilePicModal = document.getElementById('profilePicModal');
          if (profilePicModal) {
            profilePicModal.onclick = (e) => {
              if (e.target === profilePicModal) {
                profilePicModal.style.display = 'none';
              }
            };
          }

          window.addEventListener('message', (event) => {
            if (event.data.type === 'avatarSelected') {
              const avatar = event.data.avatar;
              const newPic = avatar.url || avatar.svg;
              if (newPic) {
                myProfilePic = newPic;
                updateProfileSticker(newPic, myUsername);
                const statusImg = document.getElementById('myStatusPic');
                if (statusImg) statusImg.src = newPic;
              }
            }
          });
          const tokenCount = userData.tokens ?? 0;
          tokens = tokenCount; // Sync initial tokens to global variable
          console.log("?? Token count from Firebase:", tokenCount);
          console.log("?? User data:", userData);

          const tokenDisplay = document.getElementById("tokenCount");
          console.log("?? Token display element:", tokenDisplay);

          if (tokenDisplay) {
            tokenDisplay.textContent = formatBalanceDisplay(tokenCount);
            console.log("? Token display updated to:", formatBalanceDisplay(tokenCount));
          } else {
            console.error("? Token display element not found!");
          }

          console.log("? User data loaded. Username:", myUsername, "Tokens:", tokenCount);

          if (userData.isAdmin) {
            const adminBtn = document.getElementById("adminPanelBtn");
            if (adminBtn) adminBtn.style.display = "block";
          }

          setupIncomingCallListener();
          setupGiftListener();
        } else {
          console.log("?? User document doesn't exist, creating one with 2000 tokens");
          try {
            await setDoc(doc(db, "users", myUID), {
              uid: myUID,
              email: user.email || "",
              username: user.displayName || "",
              tokens: 2000,
              online: true,
              lastSeen: serverTimestamp(),
              createdAt: serverTimestamp()
            });
            const tokenDisplay = document.getElementById("tokenCount");
            if (tokenDisplay) tokenDisplay.textContent = formatBalanceDisplay(2000);
            setupIncomingCallListener();
            setupGiftListener();
          } catch (createErr) {
            console.error("Error creating user document:", createErr);
          }
        }

        const urlParams = new URLSearchParams(window.location.search);
        const chatWithParam = urlParams.get('chatWith');
        const chatNameParam = urlParams.get('chatName');
        const productParam = urlParams.get('product');

        const targetUID = chatWithParam || sessionStorage.getItem('targetUserUID');
        const targetName = chatNameParam || sessionStorage.getItem('targetUsername');
        const productName = productParam || sessionStorage.getItem('productName');
        const isFromAd = chatWithParam || (sessionStorage.getItem('fromAdvertisement') === 'true');

        if (isFromAd && targetUID && targetUID !== myUID) {
          console.log(`✓ Marketplace connect: opening chat with ${targetName}`);

          sessionStorage.removeItem('fromAdvertisement');
          sessionStorage.removeItem('targetUserUID');
          sessionStorage.removeItem('targetUsername');
          sessionStorage.removeItem('productName');

          if (chatWithParam) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }

          setTimeout(async () => {
            const initialText = productName ? `Hi, I'm interested in your advertisement: "${productName}"` : "Hi, I'm interested in your advertisement!";
            await openChat(targetUID, targetName || 'Seller', null, 'direct');

            const messageInput = document.getElementById('message-input');
            if (messageInput) {
              messageInput.value = initialText;
              if (typeof updateSendButtons === 'function') updateSendButtons();
              messageInput.focus();
            }
          }, 800);
        }

        const tokenSnapshotUnsubscribe = onSnapshot(doc(db, "users", myUID), (userDocSnapshot) => {
          if (userDocSnapshot.exists()) {
            const snapshotData = userDocSnapshot.data();
            const currentTokens = snapshotData.tokens;

            if (typeof currentTokens === 'number' && currentTokens >= 0) {
              tokens = currentTokens; // Sync global tokens variable
              const tokenDisplay = document.getElementById("tokenCount");
              if (tokenDisplay) {
                const oldValue = tokenDisplay.textContent;
                tokenDisplay.textContent = formatBalanceDisplay(currentTokens);

                if (Math.abs(parseInt(oldValue) - currentTokens) > 0) {
                  console.log(`?? Token update: ${oldValue} ? ${currentTokens}`);
                }
              }
            } else if (currentTokens === undefined || currentTokens === null) {
              console.warn("?? Tokens field is missing in snapshot, but not updating to prevent data loss");
            }
          }
        }, (error) => {
          console.error("Error listening to user snapshot:", error);
        });

        window.tokenSnapshotUnsubscribe = tokenSnapshotUnsubscribe;

        loadChatApprovalSettings();
        const incomingMessagesQuery = query(
          collection(db, "messages"),
          where("to", "==", myUID),
          orderBy("timestamp", "desc"),
          limit(50)
        );

        let incomingMessagesInitialLoad = true;
        const incomingMessagesUnsubscribe = onSnapshot(incomingMessagesQuery, async (snapshot) => {
          const newSenders = new Set();
          const newMessages = [];

          snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
              const data = change.doc.data();
              if (data.from && data.from !== myUID) {
                newSenders.add(data.from);
                if (data.to === myUID) {
                  newMessages.push({ docId: change.doc.id, ...data });
                }
              }
            }
          });

          if (!incomingMessagesInitialLoad && newMessages.length > 0) {
            handleSelfAIReplies(newMessages).catch((err) => {
              console.warn("? Self AI auto reply error:", err);
            });
          }
          incomingMessagesInitialLoad = false;

          if (newSenders.size === 0) return;

          try {
            const myUserRef = doc(db, "users", myUID);
            const myUserDoc = await getDoc(myUserRef);

            if (!myUserDoc.exists()) return;

            const myContacts = myUserDoc.data()?.contacts || [];
            let updated = false;

            for (const senderUID of newSenders) {
              if (!myContacts.includes(senderUID)) {
                myContacts.push(senderUID);
                updated = true;
                console.log("? Auto-added", senderUID, "to contacts");
              }
            }

            if (updated) {
              await updateDoc(myUserRef, { contacts: myContacts });
              if (typeof loadContacts === 'function') loadContacts();
            }
          } catch (err) {
            console.warn("Could not auto-add sender to contacts:", err);
          }
        }, (error) => {
          if (error.code === 'failed-precondition') {
            console.warn("?? Index missing for incoming messages query. Please create 'messages' index: to (Asc) + timestamp (Desc)");
          }
          console.warn("Error listening to incoming messages:", error);
        });

        window.incomingMessagesUnsubscribe = incomingMessagesUnsubscribe;

        try {
          await updateDoc(doc(db, "users", myUID), {
            online: true,
            lastSeen: serverTimestamp()
          });
          console.log("?? Marked user as online");
        } catch (updateErr) {
          console.warn("Could not update online status:", updateErr);
        }

        try {
          console.log("?? Loading chat list after authentication...");
          loadContacts();
          loadStatuses();
          if (window.loadUserBackgroundOnAuth) {
            window.loadUserBackgroundOnAuth();
          }
        } catch (contactErr) {
          console.error("Error loading contacts:", contactErr);
        }

        sessionStorage.removeItem('auth_redirect_block');

      } catch (err) {
        console.error("Error loading user data:", err);
        showNotif("Error loading user data: " + err.message, "error");
      }
    } else {
      // Firebase sometimes briefly fires null during token refresh or page visibility changes.
      // Check auth.currentUser synchronously first — if it's already set, ignore this event.
      if (auth.currentUser) {
        console.log("⚡ onAuthStateChanged null event ignored — auth.currentUser is still valid");
        return;
      }

      console.warn("User not authenticated. Will verify before redirecting...");

      // Only redirect if not already in progress
      if (!authRedirectInProgress && !sessionStorage.getItem('auth_redirect_block')) {
        authRedirectInProgress = true;
        sessionStorage.setItem('auth_redirect_block', 'true');
        console.log("⏱️ Setting up auth redirect timer (10 seconds — extended to prevent false redirects)");

        // Wait 10 seconds then double-check before redirecting — prevents false positives from
        // brief auth state flickers (token refresh, page visibility, etc.)
        authRedirectTimer = setTimeout(async () => {
          // Final check: if user came back (token refreshed), abort the redirect
          if (auth.currentUser) {
            console.log("✅ User came back during grace period — aborting redirect");
            authRedirectInProgress = false;
            sessionStorage.removeItem('auth_redirect_block');
            authRedirectTimer = null;
            return;
          }

          // Genuinely unauthenticated — clean up and redirect
          console.log("🔄 Auth redirect confirmed — user is genuinely logged out, redirecting to index.html");

          // Reset page state
          pageInitializedForCurrentUser = false;
          myUID = null;

          if (incomingCallListener) {
            incomingCallListener();
            incomingCallListener = null;
          }
          detachCallDocListener();
          if (incomingCallOverlay) {
            incomingCallOverlay.remove();
            incomingCallOverlay = null;
          }
          callActive = false;
          activeCallDocId = null;

          window.location.href = "index.html";
        }, 10000);

      } else {
        console.log("⏸️ Auth redirect already in progress or blocked — ignoring");
      }
    }
  });

  window.addEventListener("beforeunload", async () => {
    if (myUID) {
      await clearTypingStatus().catch(() => {});
      if (window.tokenSnapshotUnsubscribe) {
        window.tokenSnapshotUnsubscribe();
      }

      if (window.incomingMessagesUnsubscribe) {
        window.incomingMessagesUnsubscribe();
      }

      if (messageListener) {
        messageListener();
      }
      if (contactsListener) {
        contactsListener();
      }
      try {
        await updateDoc(doc(db, "users", myUID), {
          online: false,
          lastSeen: serverTimestamp()
        });
        console.log("?? Marked user as offline on unload");
      } catch (err) {
        console.warn("Could not mark user as offline:", err);
      }
    }
  });
}


document.getElementById("fullscreen-btn-header")?.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  toggleFullscreen();
}, false);

document.getElementById("settings-btn-header")?.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  openSettingsModal();
}, false);

document.getElementById("closeSettingsBtn")?.addEventListener("click", () => {
  saveSettingsPreferences();
  closeSettingsModal();
}, false);

document.getElementById("openTerminalBtn")?.addEventListener("click", () => {
  window.open('terminal.html', '_blank', 'width=1000,height=700,scrollbars=yes,resizable=yes');
}, false);

document.getElementById("copyUIDBtn")?.addEventListener("click", () => {
  const userUIDDisplay = document.getElementById("userUIDDisplay");
  if (userUIDDisplay && myUID) {
    navigator.clipboard.writeText(myUID).then(() => {
      showNotif("? UID copied to clipboard!", "success", 2000);
      const btn = document.getElementById("copyUIDBtn");
      if (btn) {
        const originalText = btn.textContent;
        btn.textContent = "? Copied!";
        setTimeout(() => {
          btn.textContent = originalText;
        }, 2000);
      }
    }).catch(() => {
      showNotif("?? Failed to copy UID", "error");
    });
  }
}, false);

const refreshPageBtnEl = document.getElementById("refreshPageBtn");
if (refreshPageBtnEl) {
  refreshPageBtnEl.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    refreshPage();
  }, false);
}

const giftHistoryBtnEl = document.getElementById("giftHistoryBtn");
if (giftHistoryBtnEl) {
  giftHistoryBtnEl.addEventListener("click", () => {
    showGiftHistory();
  }, false);
}

const gamingBtnEl = document.getElementById("gaming-btn-header");
if (gamingBtnEl) {
  gamingBtnEl.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = 'gaminghub.html';
  }, false);
}

const terminalBtnEl = document.getElementById("terminal-btn-header");
if (terminalBtnEl) {
  terminalBtnEl.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.open('terminal.html', '_blank', 'width=1000,height=700,scrollbars=yes,resizable=yes');
  }, false);
}

const transferTokensBtnEl = document.getElementById("transferTokensBtn");
if (transferTokensBtnEl) {
  transferTokensBtnEl.addEventListener("click", transferTokens, false);
  console.log("? Transfer Tokens button listener attached successfully");
} else {
  console.error("? Transfer Tokens button not found in DOM!");
}

const installAppBtnEl = document.getElementById("installAppBtn");
if (installAppBtnEl) {
  installAppBtnEl.addEventListener("click", (e) => {
    e.preventDefault();
    if (typeof window.promptInstallNexchat === 'function') {
      window.promptInstallNexchat();
    } else {
      alert('Install support is not available right now. Please refresh or use the browser menu to install NEXCHAT.');
    }
  }, false);
  console.log("? Install App button listener attached successfully");
}

function showInstallInstructions(platform) {
  const instructions = {
    ios: 'On iOS, open NEXCHAT in Safari, tap Share, then choose "Add to Home Screen". If you are not running Safari, open NEXCHAT in Safari first.',
    mac: 'Use Chrome or Edge on macOS and choose "Install app" from the browser menu. If that does not appear, use "Add to desktop" or "Add to Dock" for a native-like experience.',
    windows: 'Use Chrome or Edge on Windows and choose "Install app" from the browser menu, or use "Add to desktop" for a native experience.',
    linux: 'Use Chrome or Edge on Linux and choose "Install app" from the browser menu, or add to desktop for a native-like app.',
  };

  if (platform !== 'ios' && typeof window.promptInstallNexchat === 'function' && window.nexchatInstallReady) {
    window.promptInstallNexchat();
    return;
  }

  alert(instructions[platform] || 'Please use your browser menu to install NEXCHAT on this device.');
}

function installNexchatPlatform(platform) {
  if (platform === 'ios') {
    showInstallInstructions('ios');
    return;
  }

  if (typeof window.promptInstallNexchat === 'function') {
    window.promptInstallNexchat();
    return;
  }

  showInstallInstructions(platform);
}

["installIOSBtn", "installMacBtn", "installWindowsBtn", "installLinuxBtn"].forEach((id) => {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    switch (id) {
      case "installIOSBtn":
        installNexchatPlatform('ios');
        break;
      case "installMacBtn":
        installNexchatPlatform('mac');
        break;
      case "installWindowsBtn":
        installNexchatPlatform('windows');
        break;
      case "installLinuxBtn":
        installNexchatPlatform('linux');
        break;
    }
  }, false);
});

const installHeaderBtnEl = document.getElementById("installHeaderBtn");
if (installHeaderBtnEl) {
  installHeaderBtnEl.addEventListener("click", (e) => {
    e.preventDefault();
    if (typeof window.promptInstallNexchat === 'function') {
      window.promptInstallNexchat();
    } else {
      alert('Install support is not available right now. Please refresh or use the browser menu to install NEXCHAT.');
    }
  }, false);
  console.log("? Header Install button listener attached successfully");
}


document.getElementById("adminPanelBtn")?.addEventListener("click", () => {
  window.location.href = "../NEXCHAT-ADMIN DASH BOARD/admin-dashboard.html";
}, false);

document.getElementById("settingsModal")?.addEventListener("click", (e) => {
  if (e.target.id === "settingsModal") {
    saveSettingsPreferences();
    closeSettingsModal();
  }
}, false);

const setupSettingsListeners = () => {
  const toggles = ["notifToggle", "soundToggle", "onlineStatusToggle", "readReceiptsToggle", "selfAIAutoResponderToggle"];

  toggles.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", saveSettingsPreferences, false);
      el.addEventListener("touchstart", () => {
        el.style.opacity = "0.7";
      }, false);
      el.addEventListener("touchend", () => {
        el.style.opacity = "1";
      }, false);
    }
  });

  document.querySelectorAll('input[name="theme"]').forEach(radio => {
    radio.addEventListener("change", saveSettingsPreferences, false);
  });

  document.querySelectorAll('input[name="chatSize"]').forEach(radio => {
    radio.addEventListener("change", saveSettingsPreferences, false);
  });

  const fontFamilySelect = document.getElementById("fontFamilySelect");
  if (fontFamilySelect) {
    fontFamilySelect.addEventListener("change", saveSettingsPreferences, false);
  }

  const letterSpacingRange = document.getElementById("letterSpacingRange");
  if (letterSpacingRange) {
    letterSpacingRange.addEventListener("input", (e) => {
      document.getElementById("letterSpacingValue").textContent = e.target.value;
      saveSettingsPreferences();
    }, false);
  }

  const lineHeightRange = document.getElementById("lineHeightRange");
  if (lineHeightRange) {
    lineHeightRange.addEventListener("input", (e) => {
      document.getElementById("lineHeightValue").textContent = e.target.value;
      saveSettingsPreferences();
    }, false);
  }

  const alignButtons = document.querySelectorAll(".text-align-btn");
  alignButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      alignButtons.forEach(b => {
        b.style.background = "#444";
        b.style.color = "#fff";
      });
      e.target.style.background = "#00ff66";
      e.target.style.color = "#000";
      saveSettingsPreferences();
    }, false);
  });
};

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.target.id === "settingsModal" && mutation.target.style.display === "flex") {
      setupSettingsListeners();
    }
  });
});

const modalEl = document.getElementById("settingsModal");
if (modalEl) {
  observer.observe(modalEl, { attributes: true, attributeFilter: ["style"] });
}

document.getElementById("changePasswordBtn")?.addEventListener("click", async () => {
  if (isAndroid && navigator.vibrate) {
    navigator.vibrate(50);
  }

  const currentPass = prompt("?? Enter your current password:");
  if (!currentPass) return;

  const newPass = prompt("?? Enter new password (min 6 characters):");
  if (!newPass) return;

  if (newPass.length < 6) {
    showNotif("? Password must be at least 6 characters", "error");
    return;
  }

  const confirmPass = prompt("?? Confirm new password:");
  if (confirmPass !== newPass) {
    showNotif("? Passwords do not match", "error");
    return;
  }

  try {
    showNotif("? Changing password...", "info");

    const user = auth.currentUser;
    if (!user || !user.email) {
      showNotif("? User not authenticated", "error");
      return;
    }

    const credential = EmailAuthProvider.credential(user.email, currentPass);
    await reauthenticateWithCredential(user, credential);

    await updatePassword(user, newPass);
    showNotif("? Password changed successfully!", "success");
    console.log("? Password updated");
  } catch (err) {
    console.error("Password change error:", err);
    if (err.code === "auth/wrong-password") {
      showNotif("? Current password is incorrect", "error");
    } else if (err.code === "auth/weak-password") {
      showNotif("? New password is too weak", "error");
    } else {
      showNotif(`? Error: ${err.message}`, "error");
    }
  }
});

document.getElementById("clearCacheBtn")?.addEventListener("click", () => {
  if (isAndroid && navigator.vibrate) {
    navigator.vibrate([30, 10, 30]);
  }

  if (confirm("?? Are you sure? This will clear all cached data.")) {
    if (isAndroid && navigator.vibrate) {
      navigator.vibrate([50, 20, 50]);
    }

    try {
      resetAuthFlags(); // Reset auth flags before clearing cache
      localStorage.clear();
      sessionStorage.clear();
      showNotif("✅ Cache cleared successfully!", "success", 2000);
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    } catch (err) {
      console.error("Error clearing cache:", err);
      showNotif("❌ Error clearing cache", "error");
    }
  }
});

document.getElementById("saveAiModelBtn")?.addEventListener("click", () => {
  const modelSelect = document.getElementById("aiModelSelect");
  if (!modelSelect || typeof chronexAI === 'undefined' || !chronexAI.setModel) {
    showNotif("?? AI model control is not available", "error");
    return;
  }

  const modelKey = modelSelect.value;
  let modelConfig;

  if (modelKey === 'performance') {
    modelConfig = { name: "NEXCHAT Performance Model", temperature: 0.2, maxTokens: 1200, topP: 0.6 };
  } else if (modelKey === 'creative') {
    modelConfig = { name: "NEXCHAT Creative Model", temperature: 0.9, maxTokens: 2200, topP: 0.95 };
  } else if (modelKey === 'safe') {
    modelConfig = { name: "NEXCHAT Safe Guard", temperature: 0.4, maxTokens: 1500, topP: 0.5, frequencyPenalty: 0.8, presencePenalty: 0.8 };
  } else {
    modelConfig = { name: "NEXCHAT Custom Neural Model", temperature: 0.7, maxTokens: 2000, topP: 0.9, frequencyPenalty: 0.6, presencePenalty: 0.6 };
  }

  chronexAI.setModel(modelConfig);
  localStorage.setItem('nexchat_ai_model', modelKey);
  showNotif(`? AI model switched to ${modelConfig.name}`, "success", 2500);
});


document.getElementById("uploadChatBackgroundBtn")?.addEventListener("click", async (e) => {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  if (!myUID) {
    showNotif("? You must be logged in", "error");
    return;
  }
  if (!currentChatUser) {
    showNotif("? No active chat detected. Open a chat first.", "error");
    return;
  }

  const fileInput = document.getElementById("chatBackgroundImageInput");
  const file = fileInput?.files[0];

  if (!file) {
    showNotif("? Please select an image first", "error");
    return;
  }

  try {
    showNotif("?? Synchronizing Background Ledger...", "info");

    const timestamp = Date.now();
    const bgPath = currentChatType === 'group'
      ? `chatBackgrounds/groups/${currentChatUser}/${timestamp}_${file.name}`
      : `chatBackgrounds/direct/${myUID}_${currentChatUser}/${timestamp}_${file.name}`;

    let bgUrl = '';
    try {
      const upRes = await uploadAnyMedia(file, { folder: 'chat-backgrounds', uid: myUID });
      bgUrl = upRes.url || upRes.downloadUrl;
    } catch (bgErr) {
      try {
        const bgRef = storageRef(storage, bgPath);
        const uploadTask = uploadBytesResumable(bgRef, file);
        await uploadTask;
        bgUrl = await getDownloadURL(uploadTask.snapshot.ref);
      } catch (fbErr) {
        bgUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
      }
    }

    const collection_name = currentChatType === 'group' ? 'groupBackgrounds' : 'directMessageBackgrounds';
    const doc_id = currentChatType === 'group' ? currentChatUser : `${myUID}_${currentChatUser}`;

    await setDoc(doc(db, collection_name, doc_id), {
      backgroundUrl: bgUrl,
      uploadedAt: serverTimestamp(),
      fileName: file.name,
      chatId: currentChatUser,
      chatType: currentChatType,
      owner: myUID
    }, { merge: true });

    applyBackgroundImage(bgUrl);
    localStorage.setItem(`chat_bg_${currentChatUser}`, bgUrl);

    showNotif("? Neural Atmosphere Calibrated!", "success");
    if (fileInput) fileInput.value = "";
  } catch (error) {
    console.error("? Background Upload Failure:", error);
    showNotif("? Upload Failed: " + error.message, "error");
  }
});

document.getElementById("removeChatBackgroundBtn")?.addEventListener("click", async () => {
  if (!currentChatUser) {
    showNotif("? No chat selected", "error");
    return;
  }

  if (!confirm("??? Remove this chat's background?")) return;

  try {
    showNotif("??? Removing chat background...", "info");

    const collection_name = currentChatType === 'group' ? 'groupBackgrounds' : 'directMessageBackgrounds';
    const doc_id = currentChatType === 'group' ? currentChatUser : `${myUID}_${currentChatUser}`;

    await updateDoc(doc(db, collection_name, doc_id), {
      backgroundUrl: null,
      removedAt: serverTimestamp()
    });

    removeBackgroundImage();
    localStorage.removeItem(`chat_bg_${currentChatUser}`);

    showNotif("? Chat background removed!", "success");
  } catch (error) {
    console.error("? Failed to remove chat background:", error);
    showNotif("? Failed to remove chat background", "error");
  }
});


document.getElementById("uploadBackgroundBtn")?.addEventListener("click", async (e) => {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  const fileInput = document.getElementById("backgroundImageInput");
  const file = fileInput.files[0];

  if (!file) {
    showNotif("? Please select an image first", "error");
    return;
  }

  try {
    showNotif("?? Uploading background image...", "info");

    let bgUrl = '';
    try {
      const upRes = await uploadAnyMedia(file, { folder: 'backgrounds', uid: myUID });
      bgUrl = upRes.url || upRes.downloadUrl;
    } catch (bgErr) {
      try {
        const bgRef = storageRef(storage, `backgrounds/${myUID}/${Date.now()}`);
        const uploadTask = uploadBytesResumable(bgRef, file);
        await uploadTask;
        bgUrl = await getDownloadURL(uploadTask.snapshot.ref);
      } catch (fbErr) {
        bgUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
      }
    }

    await setDoc(doc(db, "userBackgrounds", myUID), {
      backgroundUrl: bgUrl,
      uploadedAt: serverTimestamp(),
      fileName: file.name
    }, { merge: true });

    applyBackgroundImage(bgUrl);

    localStorage.setItem("nexchat_background", bgUrl);

    showNotif("? Background updated!", "success");
    fileInput.value = "";
  } catch (error) {
    console.error("? Failed to upload background:", error);
    showNotif("? Failed to upload background", "error");
  }
});

document.getElementById("removeBackgroundBtn")?.addEventListener("click", async () => {
  if (!confirm("??? Remove background image?")) return;

  try {
    showNotif("??? Removing background...", "info");

    await updateDoc(doc(db, "userBackgrounds", myUID), {
      backgroundUrl: null,
      removedAt: serverTimestamp()
    });

    removeBackgroundImage();

    localStorage.removeItem("nexchat_background");

    showNotif("? Background removed!", "success");
  } catch (error) {
    console.error("? Failed to remove background:", error);
    showNotif("? Failed to remove background", "error");
  }
});



document.getElementById("logoutSettingsBtn")?.addEventListener("click", () => {
  if (isAndroid && navigator.vibrate) {
    navigator.vibrate([40, 20, 40]);
  }

  if (confirm("?? Are you sure you want to logout?")) {
    if (isAndroid && navigator.vibrate) {
      navigator.vibrate([50, 30, 50, 30, 50]);
    }

    signOut(auth)
      .then(() => {
        try {
          resetAuthFlags(); // Reset auth flags before clearing storage
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          console.warn("Could not clear storage:", e);
        }

        showNotif("👋 Logged out successfully!", "success", 2000);
        setTimeout(() => {
          window.location.href = "index.html";
        }, 1500);
      })
      .catch((err) => {
        console.error("Logout error:", err);
        showNotif("❌ Logout error: " + err.message, "error", 3000);
      });
  }
});


function getGoogleDriveToken() {
  const token = localStorage.getItem('driveAccessToken');
  const expiry = Number(localStorage.getItem('driveAccessTokenExpiry')) || 0;
  if (!token || Date.now() > expiry) {
    localStorage.removeItem('driveAccessToken');
    localStorage.removeItem('driveAccessTokenExpiry');
    return null;
  }
  return token;
}

function isGoogleDriveConnected() {
  return !!getGoogleDriveToken();
}

function getGoogleDriveViewUrl(fileId) {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

async function shareGoogleDriveFile(fileId, accessToken) {
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: 'reader', type: 'anyone' })
    });
    if (!res.ok) {
      const message = await res.text();
      console.warn('?? Failed to set Drive file permission:', message);
    }
  } catch (err) {
    console.warn('?? Drive permission request failed:', err);
  }
}

async function uploadToGoogleDrive(file) {
  const accessToken = getGoogleDriveToken();
  if (!accessToken) {
    throw new Error('Google Drive access token is not available. Sign in with Google again.');
  }

  const metadata = {
    name: `${Date.now()}_${file.name}`,
    mimeType: file.type || 'application/octet-stream'
  };

  const initRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': file.type || 'application/octet-stream'
    },
    body: JSON.stringify(metadata)
  });

  if (!initRes.ok) {
    const body = await initRes.text();
    throw new Error(`Drive init failed: ${initRes.status} ${body}`);
  }

  const uploadUrl = initRes.headers.get('Location');
  if (!uploadUrl) {
    throw new Error('Google Drive resumable upload URL not returned.');
  }

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream'
    },
    body: file
  });

  if (!uploadRes.ok) {
    const body = await uploadRes.text();
    throw new Error(`Drive upload failed: ${uploadRes.status} ${body}`);
  }

  const fileData = await uploadRes.json();
  if (fileData.id) {
    await shareGoogleDriveFile(fileData.id, accessToken);
    return getGoogleDriveViewUrl(fileData.id);
  }

  throw new Error('Google Drive upload returned no file ID.');
}

function updateDriveStatusUI() {
  const note = document.getElementById('driveStatusNote');
  const btn = document.getElementById('connectDriveBtn');
  if (note) {
    note.textContent = isGoogleDriveConnected()
      ? '? Google Drive access is enabled for large status uploads.'
      : '?? Sign in with Google and allow Drive access to offload large status media to Google Drive when available.';
  }
  if (btn) {
    btn.disabled = true;
    btn.style.cursor = 'not-allowed';
  }
}

// Status UI event listeners are cleanly managed in setupEventListeners()
document.getElementById("closeStatusViewerBtn")?.addEventListener("click", () => {
  const modal = document.getElementById("statusViewerModal");
  if (modal) {
    modal.style.display = "none";
  }
  showChatListView();
});

document.getElementById("statusViewerModal")?.addEventListener("click", (e) => {
  if (e.target.id === "statusViewerModal") {
    e.target.style.display = "none";
  }
});


try {
  initOfflineDB();
  monitorConnectivity();
  console.log("? Offline queue system initialized");
} catch (error) {
  console.warn("?? Failed to initialize offline queue:", error);
}



async function getChattedUsers(userId) {
  try {
    const messagesRef = collection(db, "messages");

    const q = query(
      messagesRef,
      where("from", "==", userId)
    );

    const snap = await getDocs(q);
    const chattedUsers = new Set([userId]); // Include self

    snap.docs.forEach(doc => {
      const msg = doc.data();
      if (msg.to) chattedUsers.add(msg.to);
    });

    const q2 = query(
      messagesRef,
      where("to", "==", userId)
    );

    const snap2 = await getDocs(q2);
    snap2.docs.forEach(doc => {
      const msg = doc.data();
      if (msg.from) chattedUsers.add(msg.from);
    });

    return Array.from(chattedUsers);
  } catch (err) {
    console.error("Error getting chatted users:", err);
    return [userId]; // Return at least self
  }
}

async function loadStatuses() {
  const statusFeed = document.getElementById("statusFeed");
  if (!statusFeed) return;

  if (!myUID) {
    console.warn("?? myUID is not set, waiting for authentication...");
    return;
  }

  try {
    const statusesRef = collection(db, "statuses");
    const q = query(statusesRef, orderBy("timestamp", "desc"), limit(50));

    const unsubscribe = onSnapshot(q, async (snap) => {
      statusFeed.innerHTML = "";

      if (snap.docs.length === 0) {
        statusFeed.innerHTML = '<div class="status-empty-state"><p>No statuses yet</p></div>';
        return;
      }

      for (const docSnap of snap.docs) {
        const status = docSnap.data();

        if (status.expiresAt) {
          const expiryTime = status.expiresAt?.toDate?.() || new Date(status.expiresAt);
          if (new Date() > expiryTime) {
            if (status.userId === myUID) {
              try {
                await deleteDoc(doc(db, "statuses", docSnap.id));
              } catch (err) {
                console.warn("Could not delete expired status:", err);
              }
            }
            continue;
          }
        }

        const isOwnStatus = status.userId === myUID;
        const visibleToArray = Array.isArray(status.visibleTo) ? status.visibleTo : [];
        const canSeeStatus = isOwnStatus || visibleToArray.includes(myUID);

        if (!canSeeStatus) {
          continue;
        }

        const userRef = doc(db, "users", status.userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) continue;

        const userData = userDoc.data();
        const userName = userData.username || userData.name || "User";
        const userInitial = userName.charAt(0).toUpperCase();
        const timestamp = status.timestamp?.toDate?.() || new Date();
        const timeStr = formatTime(timestamp);

        const expiryTime = status.expiresAt?.toDate?.() || new Date(status.expiresAt);
        const timeRemaining = getTimeRemaining(expiryTime);

        const statusItem = document.createElement("div");
        statusItem.className = "status-item";
        const deleteBtn = isOwnStatus ? `<button class="status-delete-btn" data-status-id="${docSnap.id}" title="Delete status"><i class="fa-solid fa-trash-can"></i></button>` : "";
        statusItem.innerHTML = `
          <div class="status-item-header">
            <div class="status-item-user">
              <div class="status-item-avatar">${userInitial}</div>
              <div>
                <h4 class="status-item-name">@${escape(userName)}</h4>
              </div>
            </div>
            <div class="status-item-actions">
              <span class="status-item-time">${timeStr}</span>
              ${deleteBtn}
            </div>
          </div>
          <p class="status-item-text">${escape(status.text)}</p>
          <div class="status-item-footer">
            <span class="status-expiry-timer" data-expires="${expiryTime.getTime()}"><i class="fa-regular fa-clock"></i> Expires in ${timeRemaining}</span>
          </div>
        `;

        if (isOwnStatus) {
          const delBtn = statusItem.querySelector(".status-delete-btn");
          delBtn?.addEventListener("click", async (e) => {
            e.stopPropagation();
            if (confirm("Delete this status?")) {
              try {
                await deleteDoc(doc(db, "statuses", docSnap.id));
                showNotif("Status deleted", "success", 2000);
              } catch (err) {
                console.error("Error deleting status:", err);
                showNotif("Error deleting status", "error");
              }
            }
          });
        }

        statusFeed.appendChild(statusItem);
      }

      startStatusTimerUpdates();
    });

    window.statusListener = unsubscribe;
  } catch (err) {
    console.error("Error loading statuses:", err);
    statusFeed.innerHTML = '<div class="status-empty-state"><p>Error loading statuses</p></div>';
  }
}

function getTimeRemaining(expiryTime) {
  const now = new Date();
  const diff = expiryTime - now;

  if (diff <= 0) {
    return "Expired";
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

function startStatusTimerUpdates() {
  if (window.statusTimerInterval) {
    clearInterval(window.statusTimerInterval);
  }

  window.statusTimerInterval = setInterval(() => {
    const timers = document.querySelectorAll(".status-expiry-timer");
    timers.forEach(timer => {
      const expiresAt = parseInt(timer.dataset.expires);
      const expiryTime = new Date(expiresAt);
      const timeRemaining = getTimeRemaining(expiryTime);
      timer.innerHTML = `<i class="fa-regular fa-clock"></i> Expires in ${timeRemaining}`;
    });
  }, 60000); // Update every minute
}

function openReportModal() {
  if (!currentChatUser || !myUID) {
    showNotif("? Please select a user first", "error");
    return;
  }

  const reportModal = document.getElementById("reportModal");
  if (!reportModal) {
    createReportModal();
    return;
  }

  reportModal.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeReportModal() {
  const reportModal = document.getElementById("reportModal");
  if (reportModal) {
    reportModal.style.display = "none";
    document.body.style.overflow = "auto";
  }
}

function createReportModal() {
  const modal = document.createElement("div");
  modal.id = "reportModal";
  modal.className = "report-modal";
  modal.style.cssText = `
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 1000;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  `;

  modal.innerHTML = `
    <div class="report-modal-content" style="
      background: #1a1a1a;
      border: 2px solid #00ff66;
      border-radius: 16px;
      padding: 24px;
      max-width: 90%;
      width: 100%;
      max-height: 80vh;
      overflow-y: auto;
      -webkit-user-select: text;
      user-select: text;
    ">
      <div class="report-header" style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      ">
        <h2 style="
          margin: 0;
          color: #00ff66;
          font-size: 20px;
          font-weight: 700;
        "><i class="fa-solid fa-flag"></i> Report User</h2>
        <button id="closeReportModalBtn" class="close-btn" style="
          background: none;
          border: none;
          color: #00ff66;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">?</button>
      </div>
      
      <div class="report-body" style="
        display: flex;
        flex-direction: column;
        gap: 16px;
      ">
        <div style="
          background: rgba(0, 255, 102, 0.1);
          border: 1px solid #00ff66;
          border-radius: 12px;
          padding: 12px;
          color: #00d4ff;
          font-size: 13px;
        ">
          <strong><i class="fa-solid fa-circle-info"></i> Report Information:</strong><br>
          This report will be reviewed by our moderation team. Please provide accurate details.
        </div>
        
        <div style="
          display: flex;
          flex-direction: column;
          gap: 8px;
        ">
          <label style="
            color: #00ff66;
            font-weight: 600;
            font-size: 14px;
          ">Report Reason:</label>
          <select id="reportReason" style="
            width: 100%;
            padding: 12px;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid #00ff66;
            border-radius: 8px;
            color: #00ff66;
            font-size: 14px;
            outline: none;
            -webkit-appearance: none;
            appearance: none;
          ">
            <option value="" style="background: #1a1a1a; color: #fff;">Select a reason...</option>
            <option value="harassment" style="background: #1a1a1a; color: #fff;">Harassment/Bullying</option>
            <option value="spam" style="background: #1a1a1a; color: #fff;">Spam</option>
            <option value="inappropriate" style="background: #1a1a1a; color: #fff;">Inappropriate Content</option>
            <option value="scam" style="background: #1a1a1a; color: #fff;">Scam/Fraud</option>
            <option value="hate" style="background: #1a1a1a; color: #fff;">Hate Speech</option>
            <option value="other" style="background: #1a1a1a; color: #fff;">? Other</option>
          </select>
        </div>
        
        <div style="
          display: flex;
          flex-direction: column;
          gap: 8px;
        ">
          <label style="
            color: #00ff66;
            font-weight: 600;
            font-size: 14px;
          ">Detailed Description:</label>
          <textarea id="reportDescription" placeholder="Please explain what happened..." style="
            width: 100%;
            padding: 12px;
            min-height: 120px;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid #00ff66;
            border-radius: 8px;
            color: #fff;
            font-size: 14px;
            font-family: inherit;
            outline: none;
            resize: vertical;
            -webkit-appearance: none;
            -webkit-user-select: text;
            user-select: text;
          "></textarea>
          <small style="
            color: rgba(255, 255, 255, 0.5);
            font-size: 12px;
          " id="reportCharCount">0 / 500</small>
        </div>
        
        <div style="
          display: flex;
          gap: 12px;
        ">
          <button id="submitReportBtn" style="
            flex: 1;
            padding: 12px;
            background: #00ff66;
            color: #000;
            border: none;
            border-radius: 8px;
            font-weight: 700;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
          ">? Submit Report</button>
          <button id="cancelReportBtn" style="
            flex: 1;
            padding: 12px;
            background: rgba(255, 0, 0, 0.2);
            color: #ff6b6b;
            border: 1px solid #ff6b6b;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
          ">? Cancel</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("closeReportModalBtn").addEventListener("click", closeReportModal);
  document.getElementById("cancelReportBtn").addEventListener("click", closeReportModal);
  document.getElementById("submitReportBtn").addEventListener("click", submitReport);

  const textarea = document.getElementById("reportDescription");
  textarea?.addEventListener("input", () => {
    const count = textarea.value.length;
    const charCount = document.getElementById("reportCharCount");
    if (charCount) {
      charCount.textContent = `${count} / 500`;
      if (count > 500) {
        textarea.value = textarea.value.substring(0, 500);
      }
    }
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeReportModal();
    }
  });
}

async function submitReport() {
  const reason = document.getElementById("reportReason")?.value;
  const description = document.getElementById("reportDescription")?.value.trim();

  if (!reason) {
    showNotif("? Please select a reason", "error");
    return;
  }

  if (!description || description.length < 10) {
    showNotif("? Please provide a detailed description (at least 10 characters)", "error");
    return;
  }

  if (!currentChatUser || !myUID) {
    showNotif("? Error: User information not found", "error");
    return;
  }

  try {
    const submitBtn = document.getElementById("submitReportBtn");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "? Submitting...";
    }

    const reportsRef = collection(db, "reports");
    await addDoc(reportsRef, {
      reportedBy: myUID,
      reportedUser: currentChatUser,
      reason: reason,
      description: description,
      timestamp: serverTimestamp(),
      status: "pending",
      reviewed: false
    });

    showNotif("? Report submitted successfully! Our team will review it shortly.", "success", 3000);
    closeReportModal();

    document.getElementById("reportReason").value = "";
    document.getElementById("reportDescription").value = "";
  } catch (err) {
    console.error("Report submission error:", err);
    showNotif("? Error submitting report: " + err.message, "error");
  } finally {
    const submitBtn = document.getElementById("submitReportBtn");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "? Submit Report";
    }
  }
}

document.getElementById("reportBtn")?.addEventListener("click", (e) => {
  e.stopPropagation();
  document.getElementById("chatOptionsMenu").style.display = "none";
  openReportModal();
});

document.getElementById("infoReportBtn")?.addEventListener("click", (e) => {
  e.stopPropagation();
  openReportModal();
});

async function openCreateGroupModal() {
  const modal = document.getElementById('createGroupModal');
  if (!modal) {
    console.error('Create group modal not found');
    showNotif('? Modal not found', 'error');
    return;
  }
  modal.style.display = 'block';
  document.getElementById('groupCreateResult').style.display = 'none';
  await loadGroupMembersList();

  attachGroupMemberButtons();
}

function attachGroupMemberButtons() {
  const addAllBtn = document.getElementById('addAllContactsBtn');
  const clearAllBtn = document.getElementById('clearAllContactsBtn');

  if (addAllBtn) {
    addAllBtn.onclick = (e) => {
      e.preventDefault();
      const checkboxes = document.querySelectorAll('.member-checkbox');
      checkboxes.forEach(cb => cb.checked = true);
      showNotif('? All contacts selected', 'success', 2000);
      console.log(`? Selected ${checkboxes.length} contacts`);
    };
  }

  if (clearAllBtn) {
    clearAllBtn.onclick = (e) => {
      e.preventDefault();
      const checkboxes = document.querySelectorAll('.member-checkbox');
      checkboxes.forEach(cb => cb.checked = false);
      showNotif('? All contacts deselected', 'info', 2000);
      console.log('? Cleared all selections');
    };
  }
}

async function loadGroupMembersList() {
  const membersList = document.getElementById('groupMembersList');
  if (!membersList) {
    console.error('Members list container not found');
    return;
  }
  membersList.innerHTML = '<p style="color: #888; text-align: center; padding: 10px;">Loading contacts...</p>';

  try {
    const contactsSnap = await getDocs(collection(db, 'users'));
    let contactsHtml = '';
    let contactCount = 0;

    contactsSnap.forEach(doc => {
      const user = doc.data();
      if (doc.id !== myUID && !user.blocked?.includes(myUID)) {
        const username = user.username || user.email || 'Unknown';
        const safeUsername = String(username).replace(/"/g, '&quot;');
        const uniqueId = `member-${doc.id}`;
        contactsHtml += `
          <div style="padding: 10px; border-bottom: 1px solid #333; display: flex; align-items: center; cursor: pointer;" onclick="document.getElementById('${uniqueId}').click();">
            <input type="checkbox" id="${uniqueId}" class="member-checkbox" data-uid="${doc.id}" data-username="${safeUsername}" style="margin-right: 10px; cursor: pointer;">
            <label for="${uniqueId}" style="flex: 1; cursor: pointer;">${safeUsername}</label>
          </div>
        `;
        contactCount++;
      }
    });

    if (contactCount > 0) {
      membersList.innerHTML = contactsHtml;
      attachGroupMemberButtons();
    } else {
      membersList.innerHTML = '<p style="color: #888; text-align: center; padding: 10px;">No contacts available</p>';
      showNotif('?? No contacts to add', 'info', 2000);
    }
  } catch (error) {
    console.error('? Error loading members:', error);
    membersList.innerHTML = `<p style="color: #ff6b6b; text-align: center; padding: 10px;">? Error: ${error.message}</p>`;
    showNotif(`Error loading contacts: ${error.message}`, 'error', 3000);
  }
}


document.getElementById('generateGroupAvatarBtn')?.addEventListener('click', () => {
  const randomString = Math.random().toString(36).substring(7);
  const avatarUrl = `https://robohash.org/${randomString}?set=set1&size=200x200`;
  document.getElementById('groupIconPreview').src = avatarUrl;
  document.getElementById('groupIconPreview').setAttribute('data-generated', 'true');
});

async function createGroup(e) {
  e.preventDefault();

  const nameInput = document.getElementById('groupName');
  const descInput = document.getElementById('groupDescription');
  const privacyInput = document.getElementById('groupPrivacy');
  const approvalInput = document.getElementById('groupApproval');
  const resultDiv = document.getElementById('groupCreateResult');
  const iconInput = document.getElementById('groupIconInput');
  const iconPreview = document.getElementById('groupIconPreview');

  if (!myUID || !auth.currentUser) {
    showNotif('? You must be logged in to create a group', 'error', 3000);
    resultDiv.style.display = 'block';
    resultDiv.style.background = '#ff6b6b';
    resultDiv.style.color = '#fff';
    resultDiv.textContent = '? User not authenticated. Please log in again.';
    return;
  }

  if (!nameInput) {
    console.error('Group name input not found');
    showNotif('? Form error', 'error');
    return;
  }

  const name = nameInput.value.trim();
  const description = descInput?.value.trim() || '';
  const privacy = privacyInput?.value || 'public';
  const approval = approvalInput?.value || 'auto';

  if (!name || name.length < 1) {
    resultDiv.style.display = 'block';
    resultDiv.style.background = '#ff6b6b';
    resultDiv.style.color = '#fff';
    resultDiv.textContent = '? Group name is required';
    return;
  }

  if (name.length > 50) {
    resultDiv.style.display = 'block';
    resultDiv.style.background = '#ff6b6b';
    resultDiv.style.color = '#fff';
    resultDiv.textContent = '? Group name too long (max 50 chars)';
    return;
  }

  try {
    const selectedCheckboxes = document.querySelectorAll('.member-checkbox:checked');

    if (selectedCheckboxes.length === 0) {
      resultDiv.style.display = 'block';
      resultDiv.style.background = '#ff6b6b';
      resultDiv.style.color = '#fff';
      resultDiv.textContent = '? Select at least one member';
      showNotif('? Please select at least one member', 'error', 2000);
      return;
    }

    const members = new Set([myUID]);
    selectedCheckboxes.forEach(cb => {
      const uid = cb.dataset.uid;
      if (uid) members.add(uid);
    });
    const membersList = Array.from(members);

    console.log(`?? Creating group "${name}" with ${membersList.length} members`);

    let profilePicUrl = ''; // Default or empty

    if (iconInput && iconInput.files && iconInput.files[0]) {
      const file = iconInput.files[0];
      try {
        showNotif('?? Uploading group icon...', 'info');
        try {
          const upRes = await uploadAnyMedia(file, { folder: 'group-icons', uid: myUID });
          profilePicUrl = upRes.url || upRes.downloadUrl;
        } catch (upErr) {
          const storageRefPath = `groups/${Date.now()}_${file.name}`;
          const imgRef = storageRef(storage, storageRefPath);
          const snapshot = await uploadBytes(imgRef, file);
          profilePicUrl = await getDownloadURL(snapshot.ref);
        }
      } catch (uploadErr) {
        console.error("Error uploading group icon:", uploadErr);
        showNotif('?? Failed to upload icon, using default', 'warning');
      }
    } else if (iconPreview && iconPreview.getAttribute('data-generated') === 'true') {
      profilePicUrl = iconPreview.src;
    }

    const groupRef = await addDoc(collection(db, 'groups'), {
      name: name,
      description: description,
      creatorId: myUID,
      privacy: privacy,
      approval: approval,
      members: membersList,
      admins: [myUID], // Creator is default admin
      profilePic: profilePicUrl,
      createdAt: serverTimestamp(),
      lastMessage: '',
      lastMessageTime: serverTimestamp()
    });

    console.log(`? Group created with ID: ${groupRef.id}`);
    showNotif(`? Group "${name}" created!`, 'success', 2000);

    const groupJoinLink = `${window.location.origin}${window.location.pathname}?joinGroup=${groupRef.id}`;

    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.style.background = '#4CAF50';
      resultDiv.style.color = '#fff';
      resultDiv.innerHTML = `
        <div style="padding: 15px; border-radius: 6px;">
            <p>? Group "${name}" created successfully!</p>
            <p style="font-size: 0.9rem; margin-top: 10px; opacity: 0.9;">Share this link with others to let them join:</p>
            <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 4px; margin: 10px 0; word-break: break-all; font-size: 0.85rem; max-height: 80px; overflow-y: auto;">
            ${groupJoinLink}
            </div>
            <button type="button" onclick="copyGroupLink('${groupJoinLink}')" style="background: #fff; color: #333; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-weight: bold; margin-top: 10px;">?? Copy Link</button>
        </div>
        `;
    }

    document.getElementById('createGroupForm')?.reset();
    document.getElementById('createGroupModal').style.display = 'none';

    if (iconPreview) {
      iconPreview.src = "logo.jpg";
      iconPreview.removeAttribute('data-generated');
    }

    await loadContacts();

    await openChat(groupRef.id, name, profilePicUrl || '??', 'group');

  } catch (error) {
    console.error('? Error creating group:', error);
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.style.background = '#ff6b6b';
      resultDiv.style.color = '#fff';
      resultDiv.textContent = `? Error: ${error.message || 'Unknown error'}`;
    }
    showNotif(`Error creating group: ${error.message}`, 'error', 3000);
  }
}

async function deleteGroup(groupId) {
  if (!confirm("?? Are you sure you want to DELETE this group? This action cannot be undone and will remove the group for ALL members.")) return;

  try {
    const groupMessagesSnapshot = await getDocs(query(collection(db, 'groupMessages'), where('groupId', '==', groupId)));
    await Promise.all(groupMessagesSnapshot.docs.map(docSnap => deleteDoc(docSnap.ref)));
    await deleteDoc(doc(db, "groups", groupId));
    showNotif("? Group deleted successfully", "success");
    document.getElementById('groupInfoModal').style.display = 'none';
    showChatListView();
    await loadContacts();
  } catch (err) {
    console.error("Error deleting group:", err);
    showNotif("? Failed to delete group", "error");
  }
}



window.promoteMember = async (groupId, userId) => {
  try {
    await updateDoc(doc(db, "groups", groupId), {
      admins: arrayUnion(userId)
    });
    showNotif("👑 Member promoted to Admin!", "success");
    showGroupInfoPanel(groupId); // Refresh
  } catch (err) {
    showNotif("Failed to promote member", "error");
  }
};

window.promoteToModerator = async (groupId, userId) => {
  try {
    await GroupChat.promoteToModerator(groupId, userId);
    showNotif("🛡️ Member promoted to Moderator!", "success");
    showGroupInfoPanel(groupId);
  } catch (err) {
    showNotif("Failed to promote member: " + (err.message || err), "error");
  }
};

window.demoteToMember = async (groupId, userId) => {
  try {
    await GroupChat.demoteToMember(groupId, userId);
    showNotif("👤 Role changed to Member", "info");
    showGroupInfoPanel(groupId);
  } catch (err) {
    showNotif("Failed to demote member: " + (err.message || err), "error");
  }
};

window.removeMember = async (groupId, userId) => {
  if (!confirm("Remove this user from the group?")) return;
  try {
    const groupRef = doc(db, "groups", groupId);
    await updateDoc(groupRef, {
      members: arrayRemove(userId),
      admins: arrayRemove(userId)
    });
    showNotif("?? Member removed", "info");
    showGroupInfoPanel(groupId); // Refresh
  } catch (err) {
    showNotif("Failed to remove member", "error");
  }
};

async function openAddGroupMembersPrompt() {
  if (!currentChatUser) {
    showNotif('? No group selected', 'error');
    return;
  }

  await openAddGroupMembersModal(currentChatUser);
}

function closeAddGroupMembersModal() {
  const modal = document.getElementById('addGroupMembersModal');
  if (modal) modal.style.display = 'none';
}

async function openAddGroupMembersModal(groupId) {
  if (!groupId) {
    showNotif('? No group selected', 'error');
    return;
  }

  const modal = document.getElementById('addGroupMembersModal');
  if (!modal) {
    showNotif('? Add members modal not found', 'error');
    return;
  }

  const groupRef = doc(db, 'groups', groupId);
  const groupDoc = await getDoc(groupRef);
  if (!groupDoc.exists()) {
    showNotif('? Group not found', 'error');
    return;
  }

  const groupData = groupDoc.data();
  const admins = groupData.admins || [groupData.createdBy];
  if (!admins.includes(myUID)) {
    showNotif('?? Only group admins can add members', 'error');
    return;
  }

  modal.style.display = 'block';
  const info = document.getElementById('addGroupMembersInfo');
  if (info) info.textContent = 'Select contacts to add to this group. Existing group members are hidden.';
  await loadAddGroupMembersList(groupId);
}

async function loadAddGroupMembersList(groupId) {
  const list = document.getElementById('addGroupMembersList');
  if (!list) {
    console.error('Add members list container not found');
    return;
  }

  list.innerHTML = '<p style="color: #888; text-align: center; padding: 12px;">Loading contacts...</p>';

  try {
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    if (!groupDoc.exists()) {
      list.innerHTML = '<p style="color: #ff6b6b; text-align: center; padding: 12px;">Group not found</p>';
      showNotif('? Group not found', 'error');
      return;
    }

    const groupData = groupDoc.data();
    const existingMembers = new Set(groupData.members || []);
    existingMembers.add(myUID);

    const contactsSnap = await getDocs(collection(db, 'users'));
    let html = '';
    let contactCount = 0;

    contactsSnap.forEach(userDoc => {
      const user = userDoc.data();
      if (!user || !userDoc.id || existingMembers.has(userDoc.id)) return;
      if (user.blocked?.includes(myUID)) return;

      const username = user.username || user.name || user.email || 'Unknown';
      const safeUsername = String(username).replace(/"/g, '&quot;');
      const uniqueId = `add-group-member-${userDoc.id}`;

      html += `
        <div style="padding: 10px; border-bottom: 1px solid #222; display: flex; align-items: center; cursor: pointer;" onclick="document.getElementById('${uniqueId}')?.click();">
          <input type="checkbox" id="${uniqueId}" class="member-checkbox" data-uid="${userDoc.id}" data-username="${safeUsername}" style="margin-right: 10px; cursor: pointer;">
          <label for="${uniqueId}" style="flex: 1; color: #fff; cursor: pointer;">${safeUsername}</label>
        </div>
      `;
      contactCount++;
    });

    if (contactCount > 0) {
      list.innerHTML = html;
      attachAddGroupMemberButtons();
    } else {
      list.innerHTML = '<p style="color: #888; text-align: center; padding: 12px;">No available contacts found to add.</p>';
      showNotif('?? No contacts available to add', 'info');
    }
  } catch (err) {
    console.error('Error loading add-member contacts:', err);
    list.innerHTML = `<p style="color: #ff6b6b; text-align: center; padding: 12px;">Error loading contacts</p>`;
    showNotif(`Error loading contacts: ${err.message}`, 'error');
  }
}

function attachAddGroupMemberButtons() {
  const selectAllBtn = document.getElementById('selectAllGroupAddMembersBtn');
  const clearAllBtn = document.getElementById('clearAllGroupAddMembersBtn');

  if (selectAllBtn) {
    selectAllBtn.onclick = (e) => {
      e.preventDefault();
      document.querySelectorAll('#addGroupMembersList .member-checkbox').forEach(cb => cb.checked = true);
      showNotif('? All contacts selected', 'success', 2000);
    };
  }

  if (clearAllBtn) {
    clearAllBtn.onclick = (e) => {
      e.preventDefault();
      document.querySelectorAll('#addGroupMembersList .member-checkbox').forEach(cb => cb.checked = false);
      showNotif('? Selection cleared', 'info', 2000);
    };
  }
}

async function addSelectedGroupMembersToGroup(groupId) {
  const selectedCheckboxes = Array.from(document.querySelectorAll('#addGroupMembersList .member-checkbox:checked'));
  if (!selectedCheckboxes.length) {
    showNotif('?? Select at least one contact to add', 'error');
    return;
  }

  const userIds = selectedCheckboxes.map(cb => cb.getAttribute('data-uid')).filter(Boolean);
  if (!userIds.length) {
    showNotif('?? No valid contacts selected', 'error');
    return;
  }

  try {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      members: arrayUnion(...userIds)
    });

    const memberNames = selectedCheckboxes.map(cb => cb.getAttribute('data-username') || 'Member');
    const mentionText = memberNames.map(name => `@${String(name).replace(/\s+/g, '_')}`).join(', ');
    await sendGroupBotMessage(groupId, `??? Group Defense Bot: ${mentionText} joined the group. Stay safe and welcome them!`, userIds);

    showNotif(`? Added ${userIds.length} member(s)`, 'success');
    closeAddGroupMembersModal();
    await showGroupInfoPanel(groupId);
  } catch (err) {
    console.error('Error adding selected members:', err);
    showNotif('? Failed to add members: ' + (err.message || err), 'error');
  }
}

function openMuteMemberModal(groupId) {
  currentMuteGroupId = groupId;
  const modal = document.getElementById('muteMemberModal');
  if (!modal) return;
  modal.style.display = 'flex';
  loadMuteMemberList(groupId);
}

function closeMuteMemberModal() {
  const modal = document.getElementById('muteMemberModal');
  if (modal) modal.style.display = 'none';
}

async function loadMuteMemberList(groupId) {
  const listContainer = document.getElementById('muteMemberList');
  if (!listContainer) return;
  listContainer.innerHTML = '<p style="color: #888; text-align: center; padding: 12px;">Loading members...</p>';

  try {
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    if (!groupDoc.exists()) {
      listContainer.innerHTML = '<p style="color: #ff6b6b; text-align: center; padding: 12px;">Group not found</p>';
      return;
    }

    const groupData = groupDoc.data();
    const members = groupData.members || [];
    const mutedMembersMap = normalizeGroupMutedMembers(groupData.mutedMembers || {});
    const adminMembers = groupData.admins || [groupData.createdBy];

    let html = '';
    for (const memberId of members) {
      if (memberId === myUID) continue;
      const userDoc = await getDoc(doc(db, 'users', memberId));
      const userData = userDoc.data() || {};
      const username = userData.username || userData.name || 'Unknown';
      const isAdminMember = adminMembers.includes(memberId);
      const muteInfo = mutedMembersMap[memberId];
      const isMuted = muteInfo && (muteInfo.toDate ? muteInfo.toDate() : new Date(muteInfo)) > new Date();
      const currentDuration = isMuted ? Math.ceil(((muteInfo.toDate ? muteInfo.toDate() : new Date(muteInfo)) - Date.now()) / 60000) : 60;

      html += `
        <div class="mute-member-row" data-userid="${memberId}" style="background: #111; border: 1px solid #222; border-radius: 12px; padding: 12px; display: grid; gap: 10px;">
          <div style="display:flex; justify-content: space-between; align-items:center; gap: 10px;">
            <div>
              <strong style="color:#00ff66;">${escape(username)}</strong>
              <div style="color:#aaa; font-size:12px;">${isAdminMember ? 'Admin' : 'Member'}${isMuted ? ' ï¿½ Muted' : ''}</div>
            </div>
            <label style="display:flex; align-items:center; gap:8px;">
              <input type="checkbox" class="mute-member-checkbox" ${isMuted ? 'checked' : ''}>
              <span style="color:#fff;">Mute</span>
            </label>
          </div>
          <div style="display:flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <span style="color:#aaa; font-size:12px;">Duration:</span>
            <select class="mute-duration-select" style="background:#1a1a1a; border:1px solid #00ff66; color:#00ff66; padding:8px; border-radius:8px; min-width:120px;">
              <option value="60" ${currentDuration === 60 ? 'selected' : ''}>1 hour</option>
              <option value="360" ${currentDuration === 360 ? 'selected' : ''}>6 hours</option>
              <option value="1440" ${currentDuration === 1440 ? 'selected' : ''}>24 hours</option>
              <option value="10080" ${currentDuration === 10080 ? 'selected' : ''}>7 days</option>
            </select>
            <span style="color:#aaa; font-size:12px;">${isMuted ? formatTimeRemaining(muteInfo) : ''}</span>
          </div>
        </div>
      `;
    }

    if (!html) {
      listContainer.innerHTML = '<p style="color:#888; text-align:center; padding:12px;">No members available to mute.</p>';
      return;
    }

    listContainer.innerHTML = html;
  } catch (err) {
    console.error('Error loading mute member list:', err);
    listContainer.innerHTML = `<p style="color: #ff6b6b; text-align: center; padding: 12px;">Error loading members</p>`;
  }
}

async function saveMuteMemberSettings() {
  if (!currentMuteGroupId) return;
  const rows = document.querySelectorAll('#muteMemberList .mute-member-row');
  const results = [];

  for (const row of rows) {
    const userId = row.dataset.userid;
    const checkbox = row.querySelector('.mute-member-checkbox');
    const durationSelect = row.querySelector('.mute-duration-select');
    const isMuted = checkbox?.checked;
    const durationMinutes = parseInt(durationSelect?.value || '0', 10);
    if (!userId) continue;

    if (isMuted && durationMinutes > 0) {
      results.push(muteGroupMember(currentMuteGroupId, userId, durationMinutes).then(() => ({ userId, action: 'muted', durationMinutes })).catch(err => ({ userId, action: 'error', error: err })));
    } else {
      results.push(unmuteGroupMember(currentMuteGroupId, userId).then(() => ({ userId, action: 'unmuted' })).catch(err => ({ userId, action: 'error', error: err })));
    }
  }

  const summary = await Promise.all(results);
  const successCount = summary.filter(r => r.action === 'muted' || r.action === 'unmuted').length;
  if (successCount > 0) {
    showNotif(`? Updated mute settings for ${successCount} members`, 'success');
    await showGroupInfoPanel(currentMuteGroupId);
    await loadMuteMemberList(currentMuteGroupId);
  } else {
    showNotif('?? No mute settings changed', 'info');
  }
}

async function removeAllGroupMembers(groupId) {
  if (!groupId) {
    showNotif('? No group selected', 'error');
    return;
  }

  if (!confirm('?? Remove all group members except you? This will leave only your account in the group.')) return;

  try {
    const groupRef = doc(db, 'groups', groupId);
    const groupDoc = await getDoc(groupRef);
    if (!groupDoc.exists()) {
      showNotif('? Group not found', 'error');
      return;
    }

    const groupData = groupDoc.data();
    const admins = groupData.admins || [groupData.createdBy];
    if (!admins.includes(myUID)) {
      showNotif('?? Only group admins can remove members', 'error');
      return;
    }

    await updateDoc(groupRef, {
      members: [myUID],
      admins: [myUID]
    });

    showNotif('? All other members removed from group', 'success');
    await showGroupInfoPanel(groupId);
  } catch (err) {
    console.error('Error removing all members:', err);
    showNotif('? Failed to remove members: ' + (err.message || err), 'error');
  }
}

async function loadGroupMessages(groupId) {
  const messagesDiv = document.getElementById('messages-area');
  if (!messagesDiv) {
    console.error("Messages area not found!");
    return;
  }

  if (messageListener) {
    messageListener();
    messageListener = null;
  }

  try {
    queueChatLoadFeedback('Opening group chat...');
    const messageInput = document.getElementById('message-input');
    const pinnedBarContainer = document.getElementById('pinnedMessagesBar');
    const typingContainer = document.getElementById('typingIndicator');

    await GroupChat.open(groupId, messagesDiv, {
      inputElement: messageInput,
      pinnedBarContainer: pinnedBarContainer,
      typingContainer: typingContainer,
      currentUid: myUID,
      onNotify: (msg, type) => showNotif(msg, type)
    });
    cancelChatLoadFeedback();
  } catch (error) {
    cancelChatLoadFeedback();
    console.error('Error loading group messages:', error);
    messagesDiv.innerHTML = `<p style="color: #ff6b6b; padding: 20px; text-align: center;">Error loading messages: ${error.message}</p>`;
  }
}

async function sendGroupMessage(groupId, text, attachment) {
  if ((!text || !text.trim()) && !attachment) return;

  if (tokens < 1) {
    showNotif('❌ Not enough tokens (need 1)', 'error');
    return;
  }

  try {
    await GroupChat.send({ text, attachment });
    tokens--;
    const tokenDisplay = document.getElementById('currentTokenBalance');
    if (tokenDisplay) tokenDisplay.textContent = formatBalanceDisplay(tokens);
  } catch (error) {
    console.error('❌ Group message error:', error);
    showNotif(`❌ Failed to send: ${error.message}`, 'error');
  }
}

function parseAndReplaceMentions(text) {
  const mentionRegex = /@(\w+)/g;
  const mentionedUsers = [];
  let replacedText = text;

  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    const username = match[1];
    mentionedUsers.push(username);
  }

  return {
    text: replacedText,
    ids: mentionedUsers
  };
}


function copyGroupLink(link) {
  navigator.clipboard.writeText(link).then(() => {
    showNotif('? Group link copied to clipboard!', 'success', 2000);
  }).catch(err => {
    console.error('Failed to copy:', err);
    showNotif('? Failed to copy link', 'error', 2000);
  });
}

async function handleGroupJoinLink(groupId) {
  try {
    if (!myUID) {
      showNotif('? Please log in first', 'error', 3000);
      return;
    }

    console.log(`?? Attempting to join group: ${groupId}`);

    const groupRef = doc(db, 'groups', groupId);
    const groupSnap = await getDoc(groupRef);

    if (!groupSnap.exists()) {
      showNotif('? Group not found', 'error', 3000);
      console.error('Group not found:', groupId);
      return;
    }

    const groupData = groupSnap.data();

    if (groupData.members && groupData.members.includes(myUID)) {
      console.log('? User already a member of this group');
      showNotif(`? You're already a member of "${groupData.name}"`, 'info', 2000);
      await openChat(groupId, groupData.name, '??', 'group');
      return;
    }

    showGroupJoinModal(groupData, groupId);
    return;

  } catch (error) {
    console.error('? Error joining group:', error);
    showNotif(`Error joining group: ${error.message}`, 'error', 3000);
  }
}

function showGroupJoinModal(groupData, groupId) {
  const modal = document.getElementById('groupJoinModal');
  const iconEl = document.getElementById('joinGroupIcon');
  const nameEl = document.getElementById('joinGroupName');
  const descEl = document.getElementById('joinGroupDesc');
  const memberCountEl = document.getElementById('joinGroupMemberCount');
  const approvalStatusEl = document.getElementById('joinGroupApprovalStatus');
  const memberListEl = document.getElementById('joinGroupMemberList');
  const statusEl = document.getElementById('joinGroupStatus');
  const requestBtn = document.getElementById('joinGroupRequestBtn');
  const cancelBtn = document.getElementById('cancelGroupRequestBtn');

  if (!modal || !myUID) return;

  currentJoinModalGroupId = groupId;
  currentJoinRequestDocId = null;

  iconEl.src = groupData.profilePic || 'logo.jpg';
  nameEl.textContent = groupData.name || 'Group';
  descEl.textContent = groupData.description || 'No description provided.';
  const members = groupData.members || [];
  memberCountEl.textContent = `${members.length} members`;
  approvalStatusEl.textContent = (groupData.privacy === 'private' || groupData.approval === 'admin') ? 'Admin approval required' : 'Auto-join';
  statusEl.textContent = (groupData.privacy === 'private' || groupData.approval === 'admin') ? 'This group requires approval before joining.' : 'You can join freely without approval.';

  memberListEl.innerHTML = '';
  const displayMembers = members.slice(0, 4);
  displayMembers.forEach(memberId => {
    const chip = document.createElement('span');
    chip.style.cssText = 'background: rgba(0,255,102,0.1); color: #fff; padding: 6px 10px; border-radius: 999px; font-size: 12px;';
    chip.textContent = memberId === myUID ? 'You' : memberId;
    memberListEl.appendChild(chip);
  });
  if (members.length > 4) {
    const more = document.createElement('span');
    more.style.cssText = 'color: #aaa; font-size: 12px;';
    more.textContent = `+${members.length - 4} more`;
    memberListEl.appendChild(more);
  }

  requestBtn.disabled = false;
  cancelBtn.style.display = 'none';

  getDocs(query(collection(db, 'groupJoinRequests'), where('groupId', '==', groupId), where('userId', '==', myUID), where('status', '==', 'pending')))
    .then(snapshot => {
      if (!snapshot.empty) {
        const requestId = snapshot.docs[0].id;
        currentJoinRequestDocId = requestId;
        requestBtn.textContent = 'Request Pending';
        requestBtn.disabled = true;
        cancelBtn.style.display = 'block';
      } else {
        requestBtn.textContent = (groupData.privacy === 'private' || groupData.approval === 'admin') ? 'Request to Join Group' : 'Join Group';
      }
    })
    .catch(err => {
      console.error('Error checking existing join request:', err);
    });

  modal.style.display = 'flex';
}

async function submitGroupJoinRequest() {
  if (!myUID || !currentJoinModalGroupId) return;

  try {
    const groupRef = doc(db, 'groups', currentJoinModalGroupId);
    const groupSnap = await getDoc(groupRef);
    if (!groupSnap.exists()) {
      showNotif('? Group not found', 'error');
      return;
    }

    const groupData = groupSnap.data();
    const isAdminApproval = groupData.approval === 'admin' || groupData.privacy === 'private';

    if (!groupData.members) groupData.members = [];
    if (groupData.members.includes(myUID)) {
      showNotif('? You are already a member of this group', 'info');
      closeGroupJoinModal();
      return;
    }

    if (!isAdminApproval) {
      await updateDoc(groupRef, {
        members: arrayUnion(myUID)
      });
      showNotif(`? You joined "${groupData.name}"!`, 'success', 3000);
      closeGroupJoinModal();
      await loadGroups();
      await openChat(currentJoinModalGroupId, groupData.name, groupData.profilePic || '??', 'group');
      return;
    }

    const existingRequests = await getDocs(query(collection(db, 'groupJoinRequests'), where('groupId', '==', currentJoinModalGroupId), where('userId', '==', myUID), where('status', '==', 'pending')));
    if (!existingRequests.empty) {
      currentJoinRequestDocId = existingRequests.docs[0].id;
      showNotif('?? You already have a pending request for this group', 'info');
      const requestBtn = document.getElementById('joinGroupRequestBtn');
      const cancelBtn = document.getElementById('cancelGroupRequestBtn');
      if (requestBtn) {
        requestBtn.textContent = 'Request Pending';
        requestBtn.disabled = true;
      }
      if (cancelBtn) cancelBtn.style.display = 'block';
      return;
    }

    const requestRef = await addDoc(collection(db, 'groupJoinRequests'), {
      groupId: currentJoinModalGroupId,
      groupName: groupData.name,
      userId: myUID,
      username: myUsername || 'Unknown',
      status: 'pending',
      createdAt: serverTimestamp()
    });

    currentJoinRequestDocId = requestRef.id;
    showNotif(`?? Join request sent for "${groupData.name}". Waiting for admin approval.`, 'info', 4000);
    const requestBtn = document.getElementById('joinGroupRequestBtn');
    const cancelBtn = document.getElementById('cancelGroupRequestBtn');
    if (requestBtn) {
      requestBtn.textContent = 'Request Pending';
      requestBtn.disabled = true;
    }
    if (cancelBtn) cancelBtn.style.display = 'block';
  } catch (error) {
    console.error('Error submitting group join request:', error);
    showNotif('? Error sending join request', 'error');
  }
}

async function cancelGroupJoinRequest() {
  if (!currentJoinRequestDocId) return;

  try {
    await deleteDoc(doc(db, 'groupJoinRequests', currentJoinRequestDocId));
    showNotif('? Group join request canceled', 'success');
    currentJoinRequestDocId = null;
    const requestBtn = document.getElementById('joinGroupRequestBtn');
    const cancelBtn = document.getElementById('cancelGroupRequestBtn');
    if (requestBtn) {
      requestBtn.textContent = 'Request to Join Group';
      requestBtn.disabled = false;
    }
    if (cancelBtn) cancelBtn.style.display = 'none';
  } catch (error) {
    console.error('Error canceling join request:', error);
    showNotif('? Error canceling request', 'error');
  }
}

function closeGroupJoinModal() {
  const modal = document.getElementById('groupJoinModal');
  if (modal) modal.style.display = 'none';
  currentJoinModalGroupId = null;
  currentJoinRequestDocId = null;
}

function checkGroupJoinLink() {
  const params = new URLSearchParams(window.location.search);
  const groupId = params.get('joinGroup');

  if (groupId) {
    console.log(`?? Detected group join link: ${groupId}`);
    const checkInterval = setInterval(async () => {
      if (myUID && auth.currentUser) {
        clearInterval(checkInterval);
        await handleGroupJoinLink(groupId);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }, 500);

    setTimeout(() => clearInterval(checkInterval), 10000);
  }
}




async function initOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('NEXCHATOfflineDB', 1);

    request.onerror = () => {
      console.error('? Failed to open offline DB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      offlineDB = request.result;
      console.log('? Offline DB initialized');
      resolve(offlineDB);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('offlineMessages')) {
        db.createObjectStore('offlineMessages', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('statuses')) {
        db.createObjectStore('statuses', { keyPath: 'id', autoIncrement: true });
      }
      console.log('? Offline DB schema created');
    };
  });
}

async function storeOfflineMessage(chatId, message, chatType = 'direct', attachmentUrl = null) {
  if (!offlineDB) return false;

  try {
    const transaction = offlineDB.transaction(['offlineMessages'], 'readwrite');
    const store = transaction.objectStore('offlineMessages');

    const offlineMsg = {
      id: Date.now(),
      chatId,
      chatType,
      message,
      attachmentUrl,
      timestamp: new Date().toISOString(),
      sent: false,
      senderUID: myUID
    };

    store.add(offlineMsg);
    console.log('?? Message stored offline:', offlineMsg);
    return true;
  } catch (error) {
    console.error('? Failed to store offline message:', error);
    return false;
  }
}

async function getOfflineMessages() {
  if (!offlineDB) return [];

  return new Promise((resolve, reject) => {
    try {
      const transaction = offlineDB.transaction(['offlineMessages'], 'readonly');
      const store = transaction.objectStore('offlineMessages');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result.filter(msg => !msg.sent));
      };
      request.onerror = () => reject(request.error);
    } catch (error) {
      console.error('? Failed to retrieve offline messages:', error);
      reject(error);
    }
  });
}

async function markOfflineMessageSent(offlineMsgId) {
  if (!offlineDB) return false;

  try {
    const transaction = offlineDB.transaction(['offlineMessages'], 'readwrite');
    const store = transaction.objectStore('offlineMessages');
    const request = store.get(offlineMsgId);

    request.onsuccess = () => {
      const msg = request.result;
      if (msg) {
        msg.sent = true;
        store.put(msg);
      }
    };
    return true;
  } catch (error) {
    console.error('? Failed to mark message as sent:', error);
    return false;
  }
}

function monitorConnectivity() {
  const offlineIndicator = document.getElementById('offlineIndicator');

  function updateOnlineStatus() {
    const isOnline = navigator.onLine;
    console.log(`?? Connection status: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);

    if (offlineIndicator) {
      if (!isOnline) {
        offlineIndicator.style.display = 'flex';
        document.querySelector('.app')?.classList.add('show-offline-indicator');
      } else {
        offlineIndicator.style.display = 'none';
        document.querySelector('.app')?.classList.remove('show-offline-indicator');
        syncOfflineMessages();
      }
    }
  }

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

  updateOnlineStatus();
}

async function syncOfflineMessages() {
  if (!navigator.onLine) return;

  console.log('?? Attempting to sync offline messages...');
  const offlineMessages = await getOfflineMessages();

  if (offlineMessages.length === 0) {
    console.log('? No messages to sync');
    return;
  }

  console.log(`?? Syncing ${offlineMessages.length} messages...`);

  for (const msg of offlineMessages) {
    try {
      if (msg.chatType === 'direct') {
        const docRef = await addDoc(collection(db, 'messages'), {
          senderId: myUID,
          senderName: myUsername,
          senderProfilePic: myProfilePic,
          receiverId: msg.chatId,
          message: msg.message,
          attachmentUrl: msg.attachmentUrl || null,
          attachmentName: msg.attachmentUrl ? 'File' : null,
          timestamp: serverTimestamp(),
          read: false
        });
        await markOfflineMessageSent(msg.id);
        console.log('? Synced direct message:', msg.id);
      } else if (msg.chatType === 'group') {
        await addDoc(collection(db, 'groupMessages'), {
          groupId: msg.chatId,
          senderId: myUID,
          senderName: myUsername,
          senderProfilePic: myProfilePic,
          message: msg.message,
          attachmentUrl: msg.attachmentUrl || null,
          attachmentName: msg.attachmentUrl ? 'File' : null,
          timestamp: serverTimestamp()
        });
        await markOfflineMessageSent(msg.id);
        console.log('? Synced group message:', msg.id);
      }
    } catch (error) {
      console.error('? Failed to sync message:', error);
    }
  }

  showNotif('? All offline messages synced!', 'success', 3000);
}


async function postStatus(textContent = '', imageUrl = null, mediaType = null) {
  if (!textContent && !imageUrl) {
    showNotif('Please add text or select media for your status', 'error');
    return;
  }

  try {
    const now = Date.now();
    const expiresAtMs = now + 24 * 60 * 60 * 1000; // Strictly 24 hours from creation

    const statusData = {
      userId: myUID,
      username: myUsername || 'User',
      profilePic: myProfilePic || '',
      content: textContent || '',
      type: mediaType ? (mediaType.startsWith('image/') ? 'image' : (mediaType.startsWith('video/') ? 'video' : 'text')) : (imageUrl ? 'image' : 'text'),
      mediaType: mediaType || (imageUrl ? 'image/jpeg' : null),
      imageUrl: imageUrl || null,
      expiresAt: new Date(expiresAtMs),
      expiresAtMs: expiresAtMs,
      createdAt: serverTimestamp(),
      createdAtMs: now,
      timestamp: serverTimestamp()
    };

    const statusRef = await addDoc(collection(db, 'statuses'), statusData);
    console.log('✅ Status published to Firestore:', statusRef.id, 'Expires in 24h at:', new Date(expiresAtMs).toLocaleTimeString());

    showNotif('✓ Status posted! Disappears in 24 hours.', 'success', 3500);

    const textInput = document.getElementById('statusInput');
    const imageInput = document.getElementById('statusImageInput');
    if (textInput) textInput.value = '';
    if (imageInput) imageInput.value = '';

    const myStatusPic = document.getElementById('myStatusPic');
    if (myStatusPic && myProfilePic) {
      myStatusPic.src = myProfilePic;
    }

    loadStatusFeed();
  } catch (error) {
    console.error('Failed to post status:', error);
    showNotif('Failed to post status: ' + error.message, 'error');
  }
}

async function loadStatusFeed() {
  try {
    const statusFeed = document.getElementById('statusFeed');
    if (!statusFeed) return;

    const now = Date.now();
    const q = query(
      collection(db, 'statuses'),
      limit(150)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      statusFeed.innerHTML = '<div class="status-empty-state"><p>No active statuses. Be the first to share an update!</p></div>';
      return;
    }

    const activeStatuses = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const docId = docSnap.id;

      // Calculate exact expiration in milliseconds
      let expTime = data.expiresAtMs;
      if (!expTime && data.expiresAt) {
        expTime = data.expiresAt.toMillis ? data.expiresAt.toMillis() : new Date(data.expiresAt).getTime();
      }
      if (!expTime && data.createdAt) {
        const crTime = data.createdAt.toMillis ? data.createdAt.toMillis() : new Date(data.createdAt).getTime();
        expTime = crTime + 24 * 60 * 60 * 1000;
      }
      if (!expTime) {
        expTime = now + 24 * 60 * 60 * 1000;
      }

      // 24-HOUR AUTO-PURGE: Silently delete expired statuses from Firestore
      if (expTime <= now) {
        console.log(`[NEX-STATUS] Purging 24h expired status: ${docId}`);
        deleteDoc(doc(db, 'statuses', docId)).catch(() => {});
        return;
      }

      activeStatuses.push({
        ...data,
        docId: docId,
        expiresAtMs: expTime,
        text: data.content || data.text || '',
      });
    });

    if (activeStatuses.length === 0) {
      statusFeed.innerHTML = '<div class="status-empty-state"><p>No active statuses. All previous statuses expired (24h limit).</p></div>';
      return;
    }

    // Sort active statuses: latest first
    activeStatuses.sort((a, b) => {
      const aTime = a.createdAtMs || (a.timestamp?.toMillis ? a.timestamp.toMillis() : 0);
      const bTime = b.createdAtMs || (b.timestamp?.toMillis ? b.timestamp.toMillis() : 0);
      return bTime - aTime;
    });

    statusFeed.innerHTML = '';
    const userStatusMap = new Map();

    activeStatuses.forEach(status => {
      if (!userStatusMap.has(status.userId)) {
        userStatusMap.set(status.userId, status);
      }
    });

    // "My Status" add button
    const myStatusDiv = document.createElement('div');
    myStatusDiv.className = 'status-item';
    myStatusDiv.innerHTML = `
      <div class="status-item-circle" style="border-color: #00ff66; border-style: dashed; position: relative;">
        <div class="status-item-overlay"></div>
        <span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 3; color: #00ff66; font-size: 22px; font-weight: bold;">+</span>
      </div>
      <p class="status-item-username">My Status</p>
      <span style="font-size: 9px; color: #888;">Tap to add</span>
    `;
    myStatusDiv.addEventListener('click', () => {
      document.getElementById("statusImageInput")?.click();
    });
    statusFeed.appendChild(myStatusDiv);

    // Render contacts' statuses
    userStatusMap.forEach((status) => {
      const statusDiv = document.createElement('div');
      statusDiv.className = 'status-item';
      statusDiv.style.cursor = 'pointer';

      // Remaining 24h countdown
      const remainingMs = Math.max(0, status.expiresAtMs - now);
      const remHours = Math.floor(remainingMs / (1000 * 60 * 60));
      const remMins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      const expiryBadge = remHours > 0 ? `${remHours}h left` : `${remMins}m left`;

      const isVideo = status.mediaType && status.mediaType.startsWith('video/');
      const mediaHtml = status.imageUrl
        ? (isVideo
            ? '<div class="status-item-video-placeholder" style="background:#111; display:flex; align-items:center; justify-content:center; width:100%; height:100%;"><i class="fa-solid fa-play" style="color:#00ff66;"></i></div>'
            : `<img src="${status.imageUrl}" alt="status" class="status-item-image" style="width:100%; height:100%; object-fit:cover;">`)
        : `<div class="status-item-text-placeholder"><p style="font-size:10px; padding:4px;">${(status.text || '').substring(0, 18)}...</p></div>`;

      statusDiv.innerHTML = `
        <div class="status-item-circle" style="border-color: #00ff66; overflow: hidden; position: relative;">
          ${mediaHtml}
          <div class="status-item-overlay"></div>
        </div>
        <p class="status-item-username" style="margin-top: 4px;">${(status.username || 'User').substring(0, 10)}</p>
        <span class="status-expiry-badge" style="font-size: 10px; color: #00ff66; background: rgba(0,255,102,0.12); border: 1px solid rgba(0,255,102,0.25); padding: 2px 6px; border-radius: 999px; margin-top: 2px; font-weight: 600;">${expiryBadge}</span>
      `;
      statusDiv.addEventListener('click', () => viewStatus(status));
      statusFeed.appendChild(statusDiv);
    });
  } catch (error) {
    console.error('Failed to load status feed:', error);
  }
}

function viewStatus(status) {
  const modal = document.getElementById('statusViewerModal');
  const image = document.getElementById('statusViewerImage');
  const avatar = document.getElementById('statusViewerAvatar');
  const name = document.getElementById('statusViewerName');
  const time = document.getElementById('statusViewerTime');
  const caption = document.getElementById('statusViewerCaption');
  const video = document.getElementById('statusViewerVideo');
  const fallback = document.getElementById('statusViewerFallbackText');

  if (!modal) return;

  if (status.imageUrl) {
    const isVideo = status.mediaType && status.mediaType.startsWith('video/');
    if (isVideo) {
      if (image) image.style.display = 'none';
      if (video) {
        video.style.display = 'block';
        video.src = status.imageUrl;
        video.load();
      }
      if (fallback) fallback.style.display = 'none';
    } else {
      if (video) video.style.display = 'none';
      if (fallback) fallback.style.display = 'none';
      if (image) {
        image.style.display = 'block';
        image.src = status.imageUrl;
      }
    }
  } else {
    if (video) video.style.display = 'none';
    if (image) image.style.display = 'none';
    if (fallback) {
      fallback.style.display = 'block';
      fallback.textContent = status.text || 'No media';
    }
  }

  if (avatar) avatar.src = status.profilePic || 'default-avatar.svg';
  if (name) name.textContent = status.username || 'User';
  if (caption) caption.textContent = status.text || '';

  // Calculate 24h expiration countdown
  const now = Date.now();
  const remainingMs = Math.max(0, (status.expiresAtMs || (now + 86400000)) - now);
  const remHours = Math.floor(remainingMs / (1000 * 60 * 60));
  const remMins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const expiryLabel = remHours > 0 ? `${remHours}h left` : `${remMins}m left`;

  const postedAgoMs = Math.floor((now - (status.createdAtMs || now)) / 1000);
  const postedAgoText = postedAgoMs < 60 ? 'Just now' : (postedAgoMs < 3600 ? `${Math.floor(postedAgoMs / 60)}m ago` : `${Math.floor(postedAgoMs / 3600)}h ago`);

  if (time) {
    time.textContent = `${postedAgoText} • Expires in ${expiryLabel}`;
  }

  modal.style.display = 'flex';
}


async function loadAnnouncements() {
  try {
    const announcementsFeed = document.getElementById('announcementsFeed');
    if (!announcementsFeed) return;

    const pinnedAnnouncementHTML = `
      <div class="announcement-item pinned-announcement" style="border: 2px solid #00ff66; background: rgba(0, 255, 102, 0.05); margin-bottom: 15px;">
        <div class="announcement-header">
          <h4 class="announcement-title">WELCOME TO NEXCHAT</h4>
          <span class="announcement-badge" style="background: #00ff66; color: #000;"><i class="fa-solid fa-code"></i> NEX-DEV</span>
        </div>
        <p class="announcement-content" style="font-weight: 600; color: #fff;">
          WELCOME TO NEXCHAT THE FUTURE IS INIT I AM DEMON ALEX NEX DEVELOPER....
        </p>
        <p class="announcement-content">
          NEW FEATURES ARE BRINGING YOU NEX_REELS SIMILAR TO TIKTOK/SNAPCHAT BUT IT WILL BE ON NEXCHAT BY NOVEMBER 23RD... 
          IF YOU HAVE ANY COMPLAINT KINDLY GO TO NEX SETTINGS AND FILE THEM
        </p>
        <p class="announcement-content" style="color: #00ff66; font-weight: bold; margin-top: 10px; text-shadow: 0 0 10px rgba(0,255,102,0.5);">
          <i class="fa-solid fa-terminal"></i> LIVE TERMINAL WILL BE ADDED TO NEXCHAT
        </p>
        <div class="announcement-footer">
          <span class="announcement-time">IMPORTANT Update</span>
          <span class="announcement-admin">BEST REGARDS: DEMON ALEX {LINUX-DEVELOPER}</span>
        </div>
      </div>
    `;

    const q = query(
      collection(db, 'announcements'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(q);

    announcementsFeed.innerHTML = pinnedAnnouncementHTML;

    if (snapshot.empty) {
      announcementsFeed.innerHTML += `
        <div class="announcements-empty-state">
          <p>No other announcements yet</p>
          <p class="hint">Stay tuned for more updates from NEXCHAT</p>
        </div>
      `;
      return;
    }

    snapshot.forEach(doc => {
      const announcement = doc.data();
      const announceDiv = document.createElement('div');
      announceDiv.className = 'announcement-item';

      const createdTime = announcement.createdAt?.toDate ? announcement.createdAt.toDate() : (announcement.createdAt ? new Date(announcement.createdAt) : new Date());
      const timeDiff = Math.floor((Date.now() - createdTime.getTime()) / 1000);

      let timeText = 'Just now';
      if (timeDiff < 60) {
        timeText = 'Just now';
      } else if (timeDiff < 3600) {
        timeText = `${Math.floor(timeDiff / 60)}m ago`;
      } else if (timeDiff < 86400) {
        timeText = `${Math.floor(timeDiff / 3600)}h ago`;
      } else {
        timeText = `${Math.floor(timeDiff / 86400)}d ago`;
      }

      announceDiv.innerHTML = `
        <div class="announcement-header">
          <h4 class="announcement-title">${escape(announcement.title || 'Announcement')}</h4>
          <span class="announcement-badge"><i class="fa-solid fa-shield-halved"></i> Admin</span>
        </div>
        <p class="announcement-content">${escape(announcement.content || '')}</p>
        <div class="announcement-footer">
          <span class="announcement-time">${timeText}</span>
          <span class="announcement-admin">By Admin</span>
        </div>
      `;

      announcementsFeed.appendChild(announceDiv);
    });

    showNotif('Announcements updated', 'success', 2000);
  } catch (error) {
    console.error('? Error loading announcements:', error);
    showNotif('Error loading announcements: ' + error.message, 'error');
  }
}

function loadTokenBalance() {
  console.log('Loading token balance');
  if (!myUID) {
    console.log('No UID available for token balance load');
    return;
  }

  const userRef = doc(db, 'users', myUID);
  getDoc(userRef).then((docSnap) => {
    if (docSnap.exists()) {
      const userData = docSnap.data();
      tokens = userData.tokens || 0;
      
      // Update both header balance and modal balance
      const headerTokenDisplay = document.getElementById('tokenCount');
      const modalTokenDisplay = document.getElementById('currentTokenBalance');
      
      if (headerTokenDisplay) {
        headerTokenDisplay.textContent = formatBalanceDisplay(tokens);
      }
      if (modalTokenDisplay) {
        modalTokenDisplay.textContent = formatBalanceDisplay(tokens);
      }
      
      console.log('Token balance loaded:', tokens);
    } else {
      console.log('User document not found for token balance');
    }
  }).catch((error) => {
    console.error('Error loading token balance:', error);
  });
}


if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initializeBasicUI();
    checkGroupJoinLink();
    if (typeof updateDriveStatusUI === 'function') updateDriveStatusUI();
  });
} else {
  initializeBasicUI();
  checkGroupJoinLink();
  if (typeof updateDriveStatusUI === 'function') updateDriveStatusUI();
}



function initializeBasicUI() {
  if (basicUIInitialized) {
    console.log("?? Basic UI already initialized, skipping...");
    return;
  }
  basicUIInitialized = true;

  try {
    const mainLogo = document.getElementById('headerLogoContainer');
    if (mainLogo) {
      mainLogo.style.cursor = 'pointer';
      mainLogo.addEventListener('click', () => {
        const modal = document.getElementById('profilePicModal');
        const modalImg = document.getElementById('profileModalImg');
        const modalName = document.getElementById('profileModalName');
        const modalDesc = document.getElementById('profileModalDesc');

        if (modal && modalImg && modalName) {
          modalImg.src = 'logo.jpg';
          modalName.textContent = "NEXCHAT SYSTEM";
          if (modalDesc) modalDesc.textContent = "Elite Robotic Communication Protocol v2.0. Powered by NEX_DEV Neural Engines. The standard in autonomous data exchange.";
          modal.style.display = 'flex';
          const editBtn = document.getElementById('editProfileBtnModal');
          if (editBtn) editBtn.style.display = 'none';
        }
      });
    }

    const savedSettings = JSON.parse(localStorage.getItem("nexchat_settings")) || {};
    applySettings(savedSettings);
  } catch (err) {
    console.log("No saved settings found, using defaults");
  }

  initializeEmojiPicker();

  document.getElementById("poll-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (currentChatType === 'group') {
      document.getElementById("pollModal").style.display = "block";
    } else {
      showNotif("?? Polls are only available in group chats", "info");
    }
  });

  document.getElementById("pollForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const question = document.getElementById("pollQuestion").value.trim();
    const optionsText = document.getElementById("pollOptions").value.trim();

    if (!question || !optionsText) {
      showNotif("Please fill in all poll fields", "error");
      return;
    }

    const options = optionsText.split('\n').map(o => o.trim()).filter(o => o);

    if (options.length < 2) {
      showNotif("Poll must have at least 2 options", "error");
      return;
    }

    await createPoll(currentChatUser, question, options);

    document.getElementById("pollModal").style.display = "none";
    document.getElementById("pollForm").reset();
  });

  document.getElementById("dashboardBackBtn")?.addEventListener("click", goBackToDashboard);

  const messageForm = document.getElementById("message-form");
  if (messageForm) {
    messageForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log("?? Message form submitted via enter key");
      await sendMessage(e);
      clearTypingStatus().catch(() => {});
    });
    console.log("? Message form listener attached");
  } else {
    console.warn("?? Message form element not found");
  }

  document.getElementById('search-btn-header')?.addEventListener('click', openSearch);
  document.getElementById('giftHistoryBtn')?.addEventListener('click', showGiftHistory);
  document.getElementById('close-search-btn')?.addEventListener('click', closeSearch);
  document.getElementById('newChatBtn')?.addEventListener('click', openSearch);
  document.getElementById('browse-users-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    browseAllUsers();
  });
  document.getElementById('search-submit-btn')?.addEventListener('click', searchUser);
  document.getElementById('search-input')?.addEventListener('keypress', (e) => {
    if (e.key === "Enter") searchUser();
  });

  document.getElementById('settings-btn-header')?.addEventListener('click', () => {
    const modal = document.getElementById('settingsModal');
    if (modal) {
      modal.style.display = 'block';
      const uidDisplay = document.getElementById('userUIDDisplay');
      if (uidDisplay) uidDisplay.textContent = myUID || 'Loading...';
    }
  });
  document.getElementById('closeSettingsBtn')?.addEventListener('click', () => {
    saveSettingsPreferences();
    closeSettingsModal();
  });

  document.getElementById('fullscreen-btn-header')?.addEventListener('click', toggleFullscreen);

  document.getElementById('createNewGroupBtn')?.addEventListener('click', () => {
    const modal = document.getElementById('createGroupModal');
    if (modal) {
      modal.style.display = 'block';
      if (typeof loadGroupMembersList === 'function') loadGroupMembersList();
    }
  });

  const createGroupForm = document.getElementById('createGroupForm');
  if (createGroupForm) {
    createGroupForm.addEventListener('submit', createGroup);
  }

  document.getElementById('uploadStatusImageBtn')?.addEventListener('click', () => {
    document.getElementById('statusImageInput')?.click();
  });

  document.getElementById('statusImageInput')?.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.getElementById('myStatusPic');
        if (img) img.src = e.target.result;
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  });

  document.getElementById('postStatusBtn')?.addEventListener('click', async () => {
    const textInput = document.getElementById('statusInput');
    const imageInput = document.getElementById('statusImageInput');

    if (!textInput) return;

    const text = textInput.value;
    const file = imageInput?.files ? imageInput.files[0] : null;

    await handleStatusPost(text, file);
  });

  document.getElementById('menuBtn')?.addEventListener('click', () => {
    const menu = document.getElementById('chatOptionsMenu');
    if (menu) menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
  });

  document.getElementById('attach-btn')?.addEventListener('click', () => {
    document.getElementById('file-input')?.click();
  });

  document.getElementById('closeSettingsBtn')?.addEventListener('click', () => {
    document.getElementById('settingsModal').style.display = 'none';
  });

  document.getElementById('logoutSettingsBtn')?.addEventListener('click', () => {
    resetAuthFlags(); // Reset auth flags before logout
    signOut(auth).then(() => {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = 'index.html';
    }).catch(err => {
      console.error("Logout error:", err);
      showNotif("❌ Logout error: " + err.message, "error");
    });
  });

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
      signOut(auth).then(() => {
        window.location.href = 'index.html';
      });
    }
  });

  console.log("? All header button listeners attached");

  const sendBtn = document.querySelector(".send-btn");
  const audioSendBtn = document.getElementById('audio-send-btn');
  if (sendBtn) {
    sendBtn.addEventListener("click", (e) => {
      console.log("?? Send button clicked");
      e.preventDefault();
      sendMessage(e);
    });
  }

  if (audioSendBtn) {
    audioSendBtn.addEventListener('click', (e) => {
      e.preventDefault();
      sendMessage(e);
    });
  }

  function updateSendButtons() {
    const input = document.getElementById('message-input');
    const hasText = input && input.value.trim().length > 0;
    const sendBtn = document.getElementById('sendBtn') || document.querySelector('.send-btn');
    const audioRecBtn = document.getElementById('audio-record-btn');
    const audioSendBtn = document.getElementById('audio-send-btn');

    if (typeof selectedFile !== 'undefined' && selectedFile) {
      if (sendBtn) sendBtn.style.display = 'none';
      if (audioSendBtn) audioSendBtn.style.display = 'flex';
      if (audioRecBtn) audioRecBtn.style.display = 'none';
    } else if (hasText) {
      if (audioSendBtn) audioSendBtn.style.display = 'none';
      if (sendBtn) sendBtn.style.display = 'flex';
      if (audioRecBtn) audioRecBtn.style.display = 'none';
    } else {
      if (audioSendBtn) audioSendBtn.style.display = 'none';
      if (sendBtn) sendBtn.style.display = 'none';
      if (audioRecBtn) audioRecBtn.style.display = 'flex';
    }
  }

  document.addEventListener('selectedFileChanged', () => updateSendButtons());
  const messageInput = document.getElementById('message-input');
  if (messageInput) {
    messageInput.addEventListener('input', () => {
      updateSendButtons();
      handleTypingInputEvent();
    });
    messageInput.addEventListener('blur', () => {
      clearTypingStatus().catch(() => {});
    });
  }
  setTimeout(() => updateSendButtons(), 200);

  document.getElementById("dashboardBackBtn")?.addEventListener("click", () => {
    goBackToDashboard();
  });
  document.getElementById("backBtn")?.addEventListener("click", () => {
    goBackToDashboard();
  });


  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase().trim();
      filterChats(query);
    });
  }

  const filterTabs = document.querySelectorAll(".filter-tab");
  filterTabs.forEach(tab => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      const filter = tab.dataset.filter;

      if (filter === undefined) return; // Skip if not a filter button

      filterTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      if (filter === 'groups') {
        handleNavigation('communities');
        return;
      }

      applyFilter(filter);
    });
  });

  document.getElementById("newChatFromTab")?.addEventListener("click", () => {
    document.getElementById("newChatBtn")?.click();
  });

  const archivedToggle = document.getElementById("archivedToggle");
  if (archivedToggle) {
    archivedToggle.addEventListener("click", () => {
      const archivedList = document.getElementById("archivedList");
      archivedList?.classList.toggle("show");
    });
  }

  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const navSection = item.dataset.nav;

      navItems.forEach(nav => nav.classList.remove("active"));
      item.classList.add("active");

      handleNavigation(navSection);
    });
  });

  const darkModeToggle = document.getElementById("darkModeToggle");
  let isSliding = false;
  let startX = 0;
  let currentX = 0;

  const savedDarkMode = localStorage.getItem("darkMode") === "true";
  if (savedDarkMode) {
    darkModeToggle?.classList.add("active");
    document.body.classList.add("dark-mode");
  } else {
    darkModeToggle?.classList.remove("active");
    document.body.classList.add("light-mode");
  }

  darkModeToggle?.addEventListener("mousedown", (e) => {
    isSliding = true;
    startX = e.clientX;
    darkModeToggle.style.cursor = "grabbing";
  });

  darkModeToggle?.addEventListener("touchstart", (e) => {
    isSliding = true;
    startX = e.touches[0].clientX;
  });

  document.addEventListener("mousemove", (e) => {
    if (!isSliding || !darkModeToggle) return;
    currentX = e.clientX - startX;
  });

  document.addEventListener("touchmove", (e) => {
    if (!isSliding || !darkModeToggle) return;
    currentX = e.touches[0].clientX - startX;
  });

  document.addEventListener("mouseup", () => {
    if (!isSliding || !darkModeToggle) return;
    isSliding = false;
    darkModeToggle.style.cursor = "pointer";

    if (Math.abs(currentX) > 15) {
      switchDarkMode();
    }
    currentX = 0;
  });

  document.addEventListener("touchend", () => {
    if (!isSliding || !darkModeToggle) return;
    isSliding = false;

    if (Math.abs(currentX) > 15) {
      switchDarkMode();
    }
    currentX = 0;
  });

  darkModeToggle?.addEventListener("click", () => {
    if (!isSliding) {
      switchDarkMode();
    }
  });

  setupMobileFeatures();
}

function setupMobileFeatures() {
  // Mobile Top 3-Dots Menu Toggle
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileDropdownMenu = document.getElementById('mobileDropdownMenu');
  
  if (mobileMenuBtn && mobileDropdownMenu) {
    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = mobileDropdownMenu.style.display === 'flex';
      mobileDropdownMenu.style.display = isVisible ? 'none' : 'flex';
    });

    document.addEventListener('click', (e) => {
      if (mobileDropdownMenu.style.display === 'flex' && !mobileDropdownMenu.contains(e.target) && e.target !== mobileMenuBtn) {
        mobileDropdownMenu.style.display = 'none';
      }
    });
  }

  // Mobile Search Button triggers main search overlay
  document.getElementById('mobileSearchBtn')?.addEventListener('click', () => {
    document.getElementById('search-btn-header')?.click();
  });

  // Mobile FAB New Chat button triggers new chat tab
  document.getElementById('mobileFabNewChat')?.addEventListener('click', () => {
    document.getElementById('newChatFromTab')?.click();
  });

  // Chat Detail Header Video Call & Voice Call buttons
  document.getElementById('headerCallBtn')?.addEventListener('click', () => {
    document.getElementById('callBtn')?.click();
  });
  document.getElementById('headerVideoBtn')?.addEventListener('click', () => {
    document.getElementById('videoCallBtn')?.click();
  });

  // Mobile More Sheet Close Handlers
  const closeMoreSheet = () => {
    document.getElementById('mobileMoreSheet')?.classList.remove('open');
  };
  document.getElementById('closeMoreSheetBtn')?.addEventListener('click', closeMoreSheet);
  document.getElementById('closeMoreSheetBackdrop')?.addEventListener('click', closeMoreSheet);

  // Mobile Menu shortcuts
  document.getElementById('mobileLinkDeviceBtn')?.addEventListener('click', () => {
    if (mobileDropdownMenu) mobileDropdownMenu.style.display = 'none';
    document.getElementById('openLinkDeviceModalBtn')?.click();
  });

  document.getElementById('mobileThemeToggleBtn')?.addEventListener('click', () => {
    if (mobileDropdownMenu) mobileDropdownMenu.style.display = 'none';
    if (typeof switchDarkMode === 'function') {
      switchDarkMode();
    } else {
      document.getElementById('darkModeToggle')?.click();
    }
  });

  document.getElementById('mobileSettingsBtn')?.addEventListener('click', () => {
    if (mobileDropdownMenu) mobileDropdownMenu.style.display = 'none';
    document.getElementById('settings-btn-header')?.click();
  });

  document.getElementById('mobileLogoutBtn')?.addEventListener('click', () => {
    if (mobileDropdownMenu) mobileDropdownMenu.style.display = 'none';
    document.getElementById('logout-btn')?.click();
  });

  // Sync token counter into mobile menu badge
  const tokenCountEl = document.getElementById('tokenCount');
  const mobileTokenBadge = document.getElementById('mobileTokenBadge');
  if (tokenCountEl && mobileTokenBadge) {
    const updateBadge = () => {
      mobileTokenBadge.textContent = tokenCountEl.textContent || '0';
    };
    const observer = new MutationObserver(updateBadge);
    observer.observe(tokenCountEl, { childList: true, characterData: true, subtree: true });
    updateBadge();
  }
}

function showChatDetailView() {
  const sections = [
    'chatListView',
    'statusContainer', 
    'groupsContainer',
    'announcementsContainer',
    'callHistoryContainer'
  ];
  
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  
  const chatDetailView = document.getElementById('chatDetailView');
  const bottomNav = document.querySelector('.bottom-nav');
  if (chatDetailView) {
    chatDetailView.style.display = 'flex';
    chatDetailView.classList.remove('hidden');
    chatDetailView.classList.add('entering');
    requestAnimationFrame(() => {
      chatDetailView.classList.add('visible');
      chatDetailView.classList.remove('entering');
    });
  }
  if (bottomNav) {
    bottomNav.style.display = 'none';
  }
  
  const activeChatHeader = document.getElementById('activeChatHeader');
  const headerLogoContainer = document.getElementById('headerLogoContainer');
  if (activeChatHeader) activeChatHeader.style.display = 'flex';
  if (headerLogoContainer) headerLogoContainer.style.display = 'none';

  const fab = document.getElementById('mobileFabNewChat');
  if (fab) fab.style.display = 'none';
}





async function handleStatusPost(text, file) {
  let mediaUrl = null;
  let mediaType = null;

  if (file) {
    try {
      showNotif("Uploading to NEX-STATUS Vault...", "info", 4000);
      const res = await uploadStatusMedia(file, {
        uid: myUID,
        onProgress: (percent, msg, vaultName) => {
          console.log(`[Status Upload] ${vaultName}: ${percent}% (${msg})`);
        },
        onVaultSwitch: (fromVault, toVault) => {
          showNotif(`Vault full, switching to ${toVault}...`, "info", 3000);
        }
      });
      mediaUrl = res.url;
      mediaType = res.fileType || res.mediaType || file.type || 'image/jpeg';
    } catch (e) {
      console.warn("Status Vault cascade failed, using universal fallback:", e);
      try {
        const upRes = await uploadAnyMedia(file, { folder: 'status', uid: myUID });
        mediaUrl = upRes.url || upRes.downloadUrl;
        mediaType = upRes.fileType || file.type;
      } catch (fbErr) {
        try {
          const storageRefPath = `status/${Date.now()}_${file.name}`;
          const imgRef = storageRef(storage, storageRefPath);
          const snapshot = await uploadBytes(imgRef, file);
          mediaUrl = await getDownloadURL(snapshot.ref);
          mediaType = file.type || 'image/jpeg';
        } catch (storageErr) {
          mediaUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = ev => resolve(ev.target.result);
            reader.readAsDataURL(file);
          });
          mediaType = file.type || 'image/jpeg';
        }
      }
    }
  }

  await postStatus(text, mediaUrl, mediaType);
}



function filterChats(query) {
  const chatItems = document.querySelectorAll("#contactList .chat-list-item");
  query = query.toLowerCase();

  chatItems.forEach(item => {
    const nameEl = item.querySelector(".chat-name");
    const name = nameEl ? nameEl.textContent.toLowerCase() : "";

    const previewEl = item.querySelector(".chat-preview");
    const preview = previewEl ? previewEl.textContent.toLowerCase() : "";

    if (name.includes(query) || preview.includes(query)) {
      item.style.display = "flex";
    } else {
      item.style.display = "none";
    }
  });
}

function applyFilter(filterType) {
  const chatItems = document.querySelectorAll("#contactList .chat-list-item");
  if (filterType === 'all') {
    chatItems.forEach(item => {
      item.style.display = "flex";
    });
    return;
  }

  chatItems.forEach(item => {
    let shouldShow = false;

    if (filterType === 'unread') {
      const unreadBadge = item.querySelector(".unread-badge");
      const isUnread = item.classList.contains("unread") || (unreadBadge && unreadBadge.textContent.trim() !== "");
      if (isUnread) shouldShow = true;
    } else if (filterType === 'favorites') {
      shouldShow = false;
    } else if (filterType === 'groups') {
      const isGroup = item.querySelector(".group-avatar") || item.getAttribute('data-chat-id')?.length > 20; // heuristic
      if (isGroup) shouldShow = true;
    }

    item.style.display = shouldShow ? "flex" : "none";
  });
}

function switchDarkMode() {
  const body = document.body;
  const toggle = document.getElementById("darkModeToggle");
  const isDark = body.classList.contains("dark-mode");

  if (isDark) {
    body.classList.remove("dark-mode");
    body.classList.add("light-mode");
    toggle?.classList.remove("active");
    localStorage.setItem("darkMode", "false");
    saveSettingsPreferences();
    showNotif("☀️ Light Mode Enabled", "success");
  } else {
    body.classList.remove("light-mode");
    body.classList.add("dark-mode");
    toggle?.classList.add("active");
    localStorage.setItem("darkMode", "true");
    saveSettingsPreferences();
    showNotif("🌙 Dark Mode Enabled", "success");
  }
}

window.toggleFullscreen = toggleFullscreen;
window.openSearch = openSearch;
window.closeSearch = closeSearch;
window.openSettingsModal = openSettingsModal;
window.goBack = goBack;
window.goBackToDashboard = goBackToDashboard;
window.showChatListView = showChatListView;
window.showNotif = showNotif;
window.openChat = openChat;
window.sendMessage = sendMessage;
window.loadContacts = loadContacts;
window.switchDarkMode = switchDarkMode;
window.showChatDetailView = showChatDetailView;
window.applyFilter = applyFilter;
window.muteChat = muteChat;
window.unmuteChat = unmuteChat;
window.archiveChat = archiveChat;
window.unarchiveChat = unarchiveChat;
window.deleteChat = deleteChat;
window.showChatContextMenu = showChatContextMenu;

console.log("? Functions exposed to global window");



async function loadGroups() {
  const groupsList = document.getElementById("groupsList");
  if (!groupsList || !myUID) return;

  try {
    const q = query(
      collection(db, "groups"),
      where("members", "array-contains", myUID),
      orderBy("lastMessageTime", "desc"),
      limit(10)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      groupsList.innerHTML = `<li class="empty-state"><p>No groups yet</p></li>`;
      return;
    }

    groupsList.innerHTML = "";
    snapshot.forEach(async docSnap => {
      const group = docSnap.data();
      const groupId = docSnap.id;
      const li = document.createElement("li");
      li.className = "chat-list-item";
      li.classList.add("group-item");
      li.setAttribute('data-chat-id', groupId);

      let lastMessage = group.lastMessage || "No messages yet";
      let lastMessageTime = "";
      let unreadCount = 0;

      try {
        if (group.lastMessageTime) {
          const date = group.lastMessageTime.toDate ? group.lastMessageTime.toDate() : new Date(group.lastMessageTime);
          const now = new Date();
          const diffMs = now - date;
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMs / 3600000);
          const diffDays = Math.floor(diffMs / 86400000);

          if (diffMins < 1) {
            lastMessageTime = "Now";
          } else if (diffMins < 60) {
            lastMessageTime = `${diffMins}m`;
          } else if (diffHours < 24) {
            lastMessageTime = `${diffHours}h`;
          } else if (diffDays < 7) {
            lastMessageTime = `${diffDays}d`;
          } else {
            lastMessageTime = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }
        }

        if (lastMessage && lastMessage.length > 40) {
          lastMessage = lastMessage.substring(0, 40) + "...";
        }

        const messagesRef = collection(db, "groupMessages");
        const unreadQuery = query(
          messagesRef,
          where("groupId", "==", groupId),
          where("readBy", "array-contains-any", [myUID]) // Not read by this user
        );
      } catch (e) {
        console.log("Error loading group message preview:", e);
      }

      const unreadBadgeHTML = unreadCount > 0 ? `<span class="unread-badge">${unreadCount > 99 ? '99+' : unreadCount}</span>` : '';

      let avatarHtml;
      if (group.profilePic) {
        avatarHtml = `<img src="${group.profilePic}" class="chat-avatar group-avatar" style="object-fit:cover;" onerror="this.style.display='none';this.parentElement.querySelector('.avatar-placeholder').style.display='flex';">`;
      } else {
        avatarHtml = `<div class="chat-avatar avatar-placeholder">${groupInit}</div>`;
      }

      li.innerHTML = `
        <div class="chat-avatar-container">${avatarHtml}</div>
        <div class="chat-item-content ${unreadCount > 0 ? 'unread' : ''}">
          <div class="chat-item-header">
            <span class="chat-name">${escape(group.name)}</span>
            <span class="chat-type-pill">GROUP</span>
          </div>
          <p class="chat-preview">${escape(lastMessage)}</p>
        </div>
        <div class="chat-time-container">
          <span class="chat-item-time">${lastMessageTime}</span>
          ${unreadBadgeHTML}
        </div>
        <button class="chat-menu-btn" title="Options"><i class="fa-solid fa-ellipsis-vertical"></i></button>
      `;

      li.addEventListener("click", async () => {
        await openChat(groupId, group.name, group.profilePic || "??", "group");
        if (typeof showChatDetailView === 'function') showChatDetailView();
      });
      li.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        if (typeof showChatContextMenu === 'function') showChatContextMenu(e, groupId);
      });
      let longPressTimer;
      let touchMoved = false;
      li.addEventListener("touchstart", (event) => {
        touchMoved = false;
        longPressTimer = setTimeout(() => {
          if (!touchMoved) {
            const touchEvent = new MouseEvent('contextmenu', {
              clientX: event.touches?.[0]?.clientX || 0,
              clientY: event.touches?.[0]?.clientY || 0
            });
            if (typeof showChatContextMenu === 'function') showChatContextMenu(touchEvent, groupId);
          }
        }, 250);
      });
      li.addEventListener("touchmove", () => {
        touchMoved = true;
        clearTimeout(longPressTimer);
      });
      li.addEventListener("touchend", () => {
        clearTimeout(longPressTimer);
      });

      const menuBtn = li.querySelector(".chat-menu-btn");
      if (menuBtn) {
        let menuBtnTouchMoved = false;
        menuBtn.addEventListener("touchstart", () => { menuBtnTouchMoved = false; });
        menuBtn.addEventListener("touchmove", () => { menuBtnTouchMoved = true; });
        menuBtn.addEventListener("click", (e) => {
          if (menuBtnTouchMoved) {
            menuBtnTouchMoved = false;
            return;
          }
          e.stopPropagation();
          if (typeof showChatContextMenu === 'function') showChatContextMenu(e, groupId);
        });
      }

      groupsList.appendChild(li);
    });
  } catch (err) {
    console.error("Groups error", err);
    if (err.message.includes("index")) console.warn("Index missing for groups query");
  }
}

async function loadContacts() {
  const contactList = document.getElementById("contactList");
  if (!contactList || !myUID) return;

  contactList.innerHTML = '<li style="text-align:center; padding:10px;">Loading chats...</li>';
  try {
    if (typeof contactsListener === 'function') {
      try { contactsListener(); } catch (e) {  }
    }

    const tempContainer = document.createElement("div");

    const chronexLi = document.createElement("li");
    chronexLi.className = "chat-list-item chronex-ai-item";
    chronexLi.setAttribute('data-chat-id', 'chronex-ai');
    chronexLi.innerHTML = `
      <div class="chat-avatar-container">
        <img src="chronex-ai.jpg" class="chat-avatar" onerror="this.src='logo.jpg';" style="width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 2px solid #00ff66;">
      </div>
      <div class="chat-item-content">
        <div class="chat-item-header">
          <span class="chat-name">Chronex AI</span>
        </div>
        <p class="chat-preview">AI Assistant</p>
      </div>
      <div class="chat-time-container">
        <span class="chat-item-time">Now</span>
      </div>
      <button class="chat-menu-btn" title="Options"><i class="fa-solid fa-ellipsis-vertical"></i></button>
    `;

    chronexLi.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (myUID) chronexAI.setUserId(myUID);
      await openChat("chronex-ai", "Chronex AI", "chronex-ai.jpg", "ai");
      if (typeof showChatDetailView === 'function') showChatDetailView();

      const modal = document.getElementById('profilePicModal');
      const modalImg = document.getElementById('profileModalImg');
      const modalName = document.getElementById('profileModalName');
      const modalDesc = document.getElementById('profileModalDesc');
      const modalWordmark = document.getElementById('profileModalBrandWordmark');

      if (modal && modalImg && modalName) {
        modalImg.src = "chronex-ai.jpg";
        modalName.textContent = "Chronex AI";
        if (modalWordmark) modalWordmark.style.display = 'block';
        if (modalDesc) modalDesc.textContent = "Official NEX_DEV Neural Assistant. Primary interface for the NEXCHAT ecosystem. Advanced robotic intelligence designed for cross-sector synchronization.";
        modal.style.display = 'flex';
        const editBtn = document.getElementById('editProfileBtnModal');
        if (editBtn) editBtn.style.display = 'none';
      }
    });

    const myUserDoc = await getDoc(doc(db, "users", myUID));
    let rawContacts = myUserDoc.data()?.contacts || [];

    let top10Contacts = [];
    try {
      const messagesRef = collection(db, "messages");
      const qIn = query(messagesRef, where("to", "==", myUID), orderBy("timestamp", "desc"), limit(25));
      const qOut = query(messagesRef, where("from", "==", myUID), orderBy("timestamp", "desc"), limit(25));

      const [snapIn, snapOut] = await Promise.all([getDocs(qIn), getDocs(qOut)]);

      const partnerMap = new Map();
      snapIn.forEach(docSnap => {
        const d = docSnap.data();
        if (d.from && d.from !== myUID) {
          const ts = d.timestamp?.toMillis ? d.timestamp.toMillis() : (d.timestamp instanceof Date ? d.timestamp.getTime() : 0);
          if (!partnerMap.has(d.from) || ts > partnerMap.get(d.from)) partnerMap.set(d.from, ts);
        }
      });
      snapOut.forEach(docSnap => {
        const d = docSnap.data();
        if (d.to && d.to !== myUID) {
          const ts = d.timestamp?.toMillis ? d.timestamp.toMillis() : (d.timestamp instanceof Date ? d.timestamp.getTime() : 0);
          if (!partnerMap.has(d.to) || ts > partnerMap.get(d.to)) partnerMap.set(d.to, ts);
        }
      });

      top10Contacts = Array.from(partnerMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(e => e[0])
        .filter(uid => uid !== 'chronex-ai')
        .slice(0, 10);

      if (top10Contacts.length < 10) {
        const otherContacts = [...rawContacts].reverse().filter(uid => !top10Contacts.includes(uid) && uid !== 'chronex-ai');
        top10Contacts.push(...otherContacts.slice(0, 10 - top10Contacts.length));
      }
    } catch (err) {
      console.warn("Recent conversations optimization failed, falling back to simplified list:", err);
      top10Contacts = [...rawContacts].reverse().slice(0, 10);
    }

    const myContacts = top10Contacts;

    const batchSize = 10;
    let contactDataList = [];

    for (let i = 0; i < myContacts.length; i += batchSize) {
      const batch = myContacts.slice(i, i + batchSize);
      const batchPromises = batch.map(async (uid) => {
        if (uid === myUID) return null;

        try {
          const userDoc = await getDoc(doc(db, "users", uid));
          if (!userDoc.exists()) return null;

          const user = userDoc.data();
          const name = user.username || user.name || "User";
          const pic = user.profilePic || null;

          const messagesRef = collection(db, "messages");

          const lastMsgPromise = (async () => {
            const q1 = query(messagesRef, where("to", "==", uid), where("from", "==", myUID), orderBy("timestamp", "desc"), limit(1));
            const q2 = query(messagesRef, where("from", "==", uid), where("to", "==", myUID), orderBy("timestamp", "desc"), limit(1));
            const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

            let latestMsg = null;
            let latestTime = null;

            if (!snap1.empty) {
              latestMsg = snap1.docs[0].data();
              latestTime = latestMsg.timestamp;
            }
            if (!snap2.empty) {
              const msg2 = snap2.docs[0].data();
              const time2 = msg2.timestamp;
              if (!latestTime || (time2 && time2 > latestTime)) { // Use time2 directly if latestTime is null
                latestMsg = msg2;
                latestTime = time2;
              }
            }
            return { latestMsg, latestTime };
          })();

          const unreadPromise = getDocs(query(messagesRef, where("from", "==", uid), where("to", "==", myUID), where("read", "==", false)));

          const [msgData, unreadSnap] = await Promise.all([lastMsgPromise, unreadPromise]);
          const { latestMsg, latestTime } = msgData;
          const unreadCount = unreadSnap.size;

          return {
            uid,
            name,
            pic,
            latestMsg,
            latestTime,
            unreadCount
          };
        } catch (e) {
          console.error("Error loading contact", uid, e);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      contactDataList.push(...batchResults.filter(r => r !== null));
    }

    contactDataList.sort((a, b) => {
      const timeA = a.latestTime?.toDate ? a.latestTime.toDate() : (a.latestTime ? new Date(a.latestTime) : new Date(0));
      const timeB = b.latestTime?.toDate ? b.latestTime.toDate() : (b.latestTime ? new Date(b.latestTime) : new Date(0));
      return timeB - timeA;
    });

    contactList.innerHTML = "";
    contactList.appendChild(chronexLi);

    contactDataList.forEach(data => {
      const { uid, name, pic, latestMsg, latestTime, unreadCount } = data;

      const li = document.createElement("li");
      li.className = "chat-list-item";
      li.setAttribute('data-chat-id', uid);

      let avatar = (pic && (pic.startsWith('http') || pic.startsWith('data:') || pic.includes('.')))
        ? `<img src="${pic}" class="chat-avatar" onerror="this.style.display='none';this.parentElement.querySelector('.avatar-placeholder').style.display='flex';">` + `<div class="chat-avatar avatar-placeholder" style="display:none; background:#333; color:#fff; align-items:center; justify-content:center; font-weight:bold;">${name.charAt(0).toUpperCase()}</div>`
        : `<div class="chat-avatar" style="background:#333; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:bold;">${name.charAt(0).toUpperCase()}</div>`;

      let lastMessage = "No messages yet";
      let lastMessageTime = "";

      if (latestMsg) {
        if (latestMsg.text) {
          lastMessage = (latestMsg.from === myUID ? "You: " : "") + latestMsg.text.substring(0, 40);
          if (latestMsg.text.length > 40) lastMessage += "...";
        } else if (latestMsg.attachment) {
          lastMessage = (latestMsg.from === myUID ? "You: " : "") + "📎 Attachment";
        }

        if (latestTime) {
          const date = latestTime.toDate ? latestTime.toDate() : new Date(latestTime);
          const now = new Date();
          const diffMs = now - date;
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMs / 3600000);
          const diffDays = Math.floor(diffMs / 86400000);

          if (date && !isNaN(date.getTime())) {
            if (diffMins < 1) lastMessageTime = "Now";
            else if (diffMins < 60) lastMessageTime = `${diffMins}m`;
            else if (diffHours < 24) lastMessageTime = `${diffHours}h`;
            else if (diffDays < 7) lastMessageTime = `${diffDays}d`;
            else lastMessageTime = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          } else {
            lastMessageTime = "";
          }
        }
      }

      const unreadBadgeHTML = unreadCount > 0 ? `<div class="unread-badge" title="${unreadCount} unread">${unreadCount > 99 ? '99+' : unreadCount}</div>` : '';

      li.innerHTML = `
        <div class="chat-avatar-container">${avatar}</div>
        <div class="chat-item-content ${unreadCount > 0 ? 'unread' : ''}">
          <div class="chat-item-header">
            <span class="chat-name">${escape(name)}</span>
          </div>
          <p class="chat-preview">${escape(lastMessage)}</p>
        </div>
        <div class="chat-time-container">
          <span class="chat-item-time">${lastMessageTime}</span>
          ${unreadBadgeHTML}
        </div>
        <button class="chat-menu-btn" title="Options"><i class="fa-solid fa-ellipsis-vertical"></i></button>
      `;

      li.addEventListener("click", async () => {
        await openChat(uid, name, pic, "direct");
        if (typeof showChatDetailView === 'function') showChatDetailView();
      });

      li.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        if (typeof showChatContextMenu === 'function') showChatContextMenu(e, uid);
      });

      let longPressTimer;
      let touchMoved = false;
      li.addEventListener("touchstart", (event) => {
        touchMoved = false;
        longPressTimer = setTimeout(() => {
          if (!touchMoved) {
            const touchEvent = new MouseEvent('contextmenu', {
              clientX: event.touches?.[0]?.clientX || 0,
              clientY: event.touches?.[0]?.clientY || 0
            });
            if (typeof showChatContextMenu === 'function') showChatContextMenu(touchEvent, uid);
          }
        }, 250);
      });
      li.addEventListener("touchmove", () => {
        touchMoved = true;
        clearTimeout(longPressTimer);
      });
      li.addEventListener("touchend", () => {
        clearTimeout(longPressTimer);
      });

      const menuBtn = li.querySelector(".chat-menu-btn");
      if (menuBtn) {
        let menuBtnTouchMoved = false;
        menuBtn.addEventListener("touchstart", () => { menuBtnTouchMoved = false; });
        menuBtn.addEventListener("touchmove", () => { menuBtnTouchMoved = true; });
        menuBtn.addEventListener("click", (e) => {
          if (menuBtnTouchMoved) {
            menuBtnTouchMoved = false;
            return;
          }
          e.stopPropagation();
          if (typeof showChatContextMenu === 'function') showChatContextMenu(e, uid);
        });
      }

      contactList.appendChild(li);
    });

    const groupCount = await appendGroupsToContactList(contactList);
    if (contactDataList.length === 0 && groupCount === 0) {
      contactList.innerHTML += `<li class="empty-state"><p>No chats yet. Start a conversation!</p></li>`;
    }

  } catch (err) {
    console.error("Contacts error", err);
    contactList.innerHTML = `<li style="text-align:center; padding:10px; color: #ff6b6b;">Error loading contacts</li>`;
  }
}

async function appendGroupsToContactList(contactList) {
  if (!contactList || !myUID) return 0;

  try {
    const groupsQuery = query(
      collection(db, "groups"),
      where("members", "array-contains", myUID),
      orderBy("lastMessageTime", "desc"),
      limit(10)
    );

    const snapshot = await getDocs(groupsQuery);
    if (snapshot.empty) return 0;

    let groupCount = 0;
    snapshot.forEach(docSnap => {
      const group = docSnap.data();
      const groupId = docSnap.id;
      const groupName = group.name || 'Group';
      let lastMessage = group.lastMessage || 'No messages yet';
      if (lastMessage.length > 40) lastMessage = lastMessage.substring(0, 40) + '...';
      const lastMessageTime = group.lastMessageTime ? formatChatTimestamp(group.lastMessageTime) : '';

      let avatarHtml;
      if (group.profilePic) {
        avatarHtml = `<img src="${group.profilePic}" class="chat-avatar group-avatar" onerror="this.style.display='none';this.parentElement.querySelector('.avatar-placeholder').style.display='flex';">`;
      } else {
        avatarHtml = `<div class="chat-avatar avatar-placeholder">${gInit}</div>`;
      }

      const li = document.createElement('li');
      li.className = 'chat-list-item group-item';
      li.setAttribute('data-chat-id', groupId);
      li.innerHTML = `
        <div class="chat-avatar-container">${avatarHtml}</div>
        <div class="chat-item-content">
          <div class="chat-item-header">
            <span class="chat-name">${escape(groupName)}</span>
            <span class="chat-type-pill">GROUP</span>
          </div>
          <p class="chat-preview">${escape(lastMessage)}</p>
        </div>
        <div class="chat-time-container">
          <span class="chat-item-time">${escape(lastMessageTime)}</span>
        </div>
        <button class="chat-menu-btn" title="Group options"><i class="fa-solid fa-ellipsis-vertical"></i></button>
      `;

      li.addEventListener('click', async () => {
        await openChat(groupId, groupName, group.profilePic || '??', 'group');
        if (typeof showChatDetailView === 'function') showChatDetailView();
      });

      li.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (typeof showChatContextMenu === 'function') showChatContextMenu(e, groupId);
      });

      contactList.appendChild(li);
      groupCount += 1;
    });

    return groupCount;
  } catch (err) {
    console.error('Error loading groups into chat list:', err);
    return 0;
  }
}

async function deleteChat(chatId, type) {
  if (!confirm("Are you sure you want to delete this chat? This will remove it from your list.")) return;

  try {
    const userRef = doc(db, "users", myUID);
    await updateDoc(userRef, {
      deletedChats: arrayUnion(chatId)
    });

    showNotif("Chat deleted", "success");
    if (typeof loadContacts === 'function') loadContacts();

    if (currentChatUser === chatId) {
      if (typeof goBackToDashboard === 'function') goBackToDashboard();
    }
  } catch (e) {
    console.error("Error deleting chat:", e);
    showNotif("Could not delete chat", "error");
  }
}

window.deleteChat = deleteChat;


document.getElementById('infoBlockBtn')?.addEventListener('click', async () => {
  if (!currentChatUser) return;
  if (!confirm('Are you sure you want to block this user?')) return;

  try {
    const userRef = doc(db, 'users', myUID);
    await updateDoc(userRef, {
      blockedUsers: arrayUnion(currentChatUser)
    });

    showNotif('User blocked', 'success');
    document.getElementById('infoBlockBtn').style.display = 'none';
    document.getElementById('infoUnblockBtn').style.display = 'flex';
  } catch (err) {
    console.error('Error blocking user:', err);
    showNotif('Failed to block user', 'error');
  }
});

document.getElementById('infoUnblockBtn')?.addEventListener('click', async () => {
  if (!currentChatUser) return;

  try {
    const userRef = doc(db, 'users', myUID);
    await updateDoc(userRef, {
      blockedUsers: arrayRemove(currentChatUser)
    });

    showNotif('User unblocked', 'success');
    document.getElementById('infoBlockBtn').style.display = 'flex';
    document.getElementById('infoUnblockBtn').style.display = 'none';
  } catch (err) {
    console.error('Error unblocking user:', err);
    showNotif('Failed to unblock user', 'error');
  }
});

document.getElementById('infoDeleteBtn')?.addEventListener('click', () => {
  if (!currentChatUser) return;
  deleteChat(currentChatUser);
});

document.getElementById('muteUserToggle')?.addEventListener('change', async (e) => {
  if (!currentChatUser) return;
  const isMuted = e.target.checked;

  try {
    const userRef = doc(db, 'users', myUID);
    if (isMuted) {
      await updateDoc(userRef, {
        mutedUsers: arrayUnion(currentChatUser)
      });
      showNotif('User muted', 'success');
    } else {
      await updateDoc(userRef, {
        mutedUsers: arrayRemove(currentChatUser)
      });
      showNotif('User unmuted', 'success');
    }
  } catch (err) {
    console.error("Error toggling mute:", err);
    e.target.checked = !isMuted;
    showNotif("Failed to update mute status", "error");
  }
});


async function saveCallToHistory(callerId, receiverId, callType, duration, callStatus = 'completed') {
  if (!myUID) {
    console.warn('Cannot save call history: User not authenticated');
    return;
  }

  const isOutgoingCall = callerId === myUID;

  try {
    const callRecord = {
      callerId: callerId,
      receiverId: receiverId,
      type: callType,
      duration: duration,
      timestamp: serverTimestamp(),
      status: callStatus,
      isOutgoing: isOutgoingCall
    };

    const result = await addDoc(collection(db, 'callHistory'), callRecord);
    console.log('[CALL] Saved to history:', result.id);
    return result.id;
  } catch (error) {
    console.error('[CALL] Error saving call to history:', error);
    throw error;
  }
}


async function loadCallHistory() {
  if (!myUID) {
    showNotif('Please log in to view call history', 'error');
    return;
  }

  const callHistoryFeed = document.getElementById('callHistoryFeed');
  if (!callHistoryFeed) return;

  callHistoryFeed.innerHTML = `
    <div style="text-align: center; padding: 40px; color: #00ff66;">
      <div style="font-size: 40px; margin-bottom: 14px;"><i class="fa-solid fa-phone fa-bounce"></i></div>
      <p style="color: #aaa; font-size: 14px;">Loading call history...</p>
    </div>
  `;

  try {
    // Query without orderBy to avoid requiring composite Firestore indexes
    const callsQuery1 = query(
      collection(db, 'callHistory'),
      where('callerId', '==', myUID),
      limit(50)
    );

    const callsQuery2 = query(
      collection(db, 'callHistory'),
      where('receiverId', '==', myUID),
      limit(50)
    );

    const callsQuery3 = query(
      collection(db, 'callHistory'),
      where('from', '==', myUID),
      limit(50)
    );

    const callsQuery4 = query(
      collection(db, 'callHistory'),
      where('to', '==', myUID),
      limit(50)
    );

    const [snapshot1, snapshot2, snapshot3, snapshot4] = await Promise.all([
      getDocs(callsQuery1).catch(() => ({ forEach: () => {} })),
      getDocs(callsQuery2).catch(() => ({ forEach: () => {} })),
      getDocs(callsQuery3).catch(() => ({ forEach: () => {} })),
      getDocs(callsQuery4).catch(() => ({ forEach: () => {} }))
    ]);

    const allCalls = [];
    snapshot1.forEach(doc => {
      allCalls.push({ id: doc.id, ...doc.data(), isOutgoing: true });
    });
    snapshot2.forEach(doc => {
      allCalls.push({ id: doc.id, ...doc.data(), isOutgoing: false });
    });
    snapshot3.forEach(doc => {
      allCalls.push({ id: doc.id, ...doc.data(), isOutgoing: true });
    });
    snapshot4.forEach(doc => {
      allCalls.push({ id: doc.id, ...doc.data(), isOutgoing: false });
    });

    const uniqueCalls = allCalls.filter((call, index, self) =>
      index === self.findIndex(c => c.id === call.id)
    );

    // In-memory sort by timestamp descending (zero index required)
    uniqueCalls.sort((a, b) => {
      const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : (a.timestamp ? new Date(a.timestamp).getTime() : 0);
      const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : (b.timestamp ? new Date(b.timestamp).getTime() : 0);
      return timeB - timeA;
    });

    if (uniqueCalls.length === 0) {
      callHistoryFeed.innerHTML = `
        <div class="call-history-empty-state" style="text-align: center; padding: 60px 20px; color: #888;">
          <div style="font-size: 52px; margin-bottom: 16px; color: #444;"><i class="fa-solid fa-phone-slash"></i></div>
          <p style="font-size: 17px; color: #ccc; margin-bottom: 8px;">No Calls Yet</p>
          <p style="font-size: 13px; color: #666;">Your call logs will appear here</p>
        </div>
      `;
      return;
    }

    let historyHTML = '';
    for (const call of uniqueCalls) {
      const contactId = call.isOutgoing ? (call.receiverId || call.to) : (call.callerId || call.from);
      if (!contactId) continue;
      const contactInfo = await getContactInfo(contactId);
      const isVideo = call.type === 'video';
      const callIcon = isVideo ? '<i class="fa-solid fa-video"></i>' : '<i class="fa-solid fa-phone"></i>';
      const directionIcon = call.isOutgoing ? '<i class="fa-solid fa-arrow-up-right-from-square"></i>' : '<i class="fa-solid fa-arrow-down-left-and-up-right-to-center"></i>';
      const directionText = call.isOutgoing ? 'Outgoing' : 'Incoming';
      const directionColor = call.isOutgoing ? '#00ff66' : '#00aaff';
      const duration = formatCallDuration(call.duration);
      const timeAgo = call.timestamp ? formatTimeAgo(call.timestamp.toDate ? call.timestamp.toDate() : new Date(call.timestamp)) : 'Recently';

      historyHTML += `
        <div class="call-history-item" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(0,255,102,0.2); border-radius: 10px; padding: 15px; margin-bottom: 12px; display: flex; align-items: center; gap: 15px; cursor: pointer;" onclick="openChat('${contactId}', '${contactInfo.name}', '${contactInfo.profilePic}', 'direct'); showChatDetailView();">
          <img src="${contactInfo.profilePic || 'logo.jpg'}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid ${directionColor};">
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
              <span style="color: #fff; font-size: 16px; font-weight: 600;">${contactInfo.name}</span>
              <span style="font-size: 13px; color: ${directionColor};">${directionIcon}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px; font-size: 13px; color: #888;">
              <span style="color: ${directionColor}; display: inline-flex; align-items: center; gap: 4px;">${callIcon} ${directionText} ${call.type}</span>
              <span>•</span>
              <span>${duration}</span>
            </div>
          </div>
          <div style="text-align: right; color: #666; font-size: 12px;">${timeAgo}</div>
        </div>
      `;
    }

    callHistoryFeed.innerHTML = historyHTML;
    console.log(`[CALLS] Loaded ${uniqueCalls.length} call(s) from history`);
  } catch (error) {
    console.error('Error loading call history:', error);
    callHistoryFeed.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #ff4444;">
        <div style="font-size: 40px; margin-bottom: 14px;"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <p>Error loading call history</p>
        <p style="font-size: 12px; color: #888; margin-top: 10px;">${error.message}</p>
      </div>
    `;
  }
}


async function getContactInfo(contactId) {
  try {
    const userDoc = await getDoc(doc(db, 'users', contactId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        name: userData.username || userData.email || 'Unknown User',
        profilePic: userData.profilePic || 'logo.jpg'
      };
    }
  } catch (error) {
    console.warn('Could not fetch contact info:', error);
  }

  return {
    name: contactId.substring(0, 12) + '...',
    profilePic: 'logo.jpg'
  };
}


function formatCallDuration(seconds) {
  if (!seconds || seconds < 1) return '0:00';

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}


function formatTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}


function groupCallsByDate(calls) {
  const grouped = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  calls.forEach(call => {
    const callDate = call.timestamp.toDate ? call.timestamp.toDate() : new Date(call.timestamp);
    const callDay = new Date(callDate.getFullYear(), callDate.getMonth(), callDate.getDate());

    let dateLabel = '';
    if (callDay.getTime() === today.getTime()) {
      dateLabel = 'Today';
    } else if (callDay.getTime() === yesterday.getTime()) {
      dateLabel = 'Yesterday';
    } else if (now.getTime() - callDay.getTime() < 7 * 24 * 60 * 60 * 1000) {
      dateLabel = callDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } else {
      dateLabel = callDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: callDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
    }

    if (!grouped[dateLabel]) {
      grouped[dateLabel] = [];
    }
    grouped[dateLabel].push(call);
  });

  return grouped;
}


function getCallStatus(call) {
  const isMissed = call.status === 'no-answer' || call.status === 'missed' || call.status === 'declined' || call.status === 'rejected';
  
  let text = '';
  if (isMissed) {
    text = 'Missed call';
  } else if (call.status === 'completed') {
    text = call.isOutgoing ? 'Outgoing call' : 'Incoming call';
  } else {
    text = 'Call';
  }

  return {
    text,
    isMissed
  };
}


function getDirectionIcon(isOutgoing, isMissed) {
  if (isMissed) {
    return '↙'; // Missed call
  } else if (isOutgoing) {
    return '↗'; // Outgoing call
  } else {
    return '↙'; // Incoming call
  }
}


function formatCallTime(date) {
  if (!date) return '';
  
  const callDate = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const callDay = new Date(callDate.getFullYear(), callDate.getMonth(), callDate.getDate());

  if (callDay.getTime() === today.getTime()) {
    return callDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  return callDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}


async function clearCallHistory() {
  if (!myUID) return;

  const confirmed = confirm('Are you sure you want to clear all call history? This action cannot be undone.');
  if (!confirmed) return;

  try {
    showNotif('Clearing call history...', 'info');

    const callsQuery1 = query(collection(db, 'callHistory'), where('from', '==', myUID));
    const callsQuery2 = query(collection(db, 'callHistory'), where('to', '==', myUID));

    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(callsQuery1),
      getDocs(callsQuery2)
    ]);

    const deletePromises = [];
    snapshot1.forEach(docSnap => {
      deletePromises.push(deleteDoc(doc(db, 'callHistory', docSnap.id)));
    });
    snapshot2.forEach(docSnap => {
      deletePromises.push(deleteDoc(doc(db, 'callHistory', docSnap.id)));
    });

    await Promise.all(deletePromises);

    showNotif('Call history cleared', 'success');
    loadCallHistory(); // Reload to show empty state

  } catch (error) {
    console.error('Error clearing call history:', error);
    showNotif('Failed to clear call history', 'error');
  }
}

document.getElementById('clearCallHistoryBtn')?.addEventListener('click', clearCallHistory);

window.loadCallHistory = loadCallHistory;
window.loadStatusFeed = loadStatusFeed;
window.loadStatuses = loadStatuses;
window.openChat = openChat;
window.goBackToDashboard = goBackToDashboard;



