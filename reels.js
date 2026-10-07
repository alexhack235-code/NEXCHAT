/**
 * CamShot — Premium Short-Form Video Platform
 * Cinematic Luxury • Warm Gold #E8B84B • Frosted Glass • Pure Elegance
 */
import "./src/js/security-guard.js";
import { auth, db } from './firebase-config.js';
import {
  collection, doc, getDoc, setDoc, addDoc, getDocs, onSnapshot, query, orderBy, limit,
  updateDoc, increment, arrayUnion, arrayRemove, serverTimestamp, where
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { uploadReelVideo, getVideoDuration } from './src/js/reels-vault.js';
import { uploadAudioToCloudinary, uploadImageToCloudinary } from './src/js/cloudinary.js';
import { TRENDING_SOUNDS } from './src/js/reels-sounds.js';

// Application State
let currentUser = null;
let myUID = null;
let myUsername = 'NEX_User';

// 🛡️ Global CamShot Runtime Resilience Shield
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.name === 'AbortError' || event.reason?.message?.includes('aborted') || event.reason?.message?.includes('play()')) {
    event.preventDefault();
    return;
  }
  console.warn('[CAMSHOT-SHIELD] Handled background promise rejection:', event.reason?.message || event.reason);
});

window.addEventListener('error', (event) => {
  if (event.message?.includes('ResizeObserver loop') || event.message?.includes('play() request was interrupted')) {
    event.stopImmediatePropagation();
  }
});

// ══════════════════════════════════════════════════
// USER IDENTITY & LOCAL COMMENT PERSISTENCE HELPERS
// ══════════════════════════════════════════════════
function getEffectiveUser() {
  if (myUID && myUsername) {
    return {
      uid: myUID,
      username: myUsername,
      pic: myProfilePic || '/favicons/favicon.ico'
    };
  }
  try {
    const raw = localStorage.getItem('nexchat_user') || localStorage.getItem('user');
    if (raw) {
      const u = JSON.parse(raw);
      const uid = u.uid || u.id || ('user_' + Math.random().toString(36).substring(2, 8));
      const username = u.displayName || u.username || u.name || ('User_' + uid.substring(0, 5));
      const pic = u.photoURL || u.profilePic || '/favicons/favicon.ico';
      myUID = uid;
      myUsername = username;
      myProfilePic = pic;
      return { uid, username, pic };
    }
  } catch (e) {}

  let guestId = localStorage.getItem('nex_guest_uid');
  let guestName = localStorage.getItem('nex_guest_name');
  if (!guestId) {
    guestId = 'guest_' + Math.random().toString(36).substring(2, 8);
    localStorage.setItem('nex_guest_uid', guestId);
  }
  if (!guestName) {
    guestName = 'CyberUser_' + Math.floor(100 + Math.random() * 900);
    localStorage.setItem('nex_guest_name', guestName);
  }
  myUID = guestId;
  myUsername = guestName;
  myProfilePic = '/favicons/favicon.ico';
  return { uid: guestId, username: guestName, pic: myProfilePic };
}

function getLocalReelComments(reelId) {
  try {
    const raw = localStorage.getItem('nex_reel_comments_' + reelId);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalReelComment(reelId, comment) {
  try {
    const list = getLocalReelComments(reelId);
    list.push(comment);
    localStorage.setItem('nex_reel_comments_' + reelId, JSON.stringify(list));
    return list;
  } catch (e) {
    return [];
  }
}

async function safeIncrementReelCommentCount(reelId) {
  try {
    await setDoc(doc(db, 'reels', reelId), {
      commentsCount: increment(1)
    }, { merge: true });
  } catch (err) {
    console.warn('safeIncrementReelCommentCount notice:', err);
  }
}

let myProfilePic = 'favicon.png';
let generalProfilePic = 'favicon.png';
let customReelsAvatar = '';
let useCustomReelsAvatar = false;
let myCreatorName = '';
let myCreatorBio = '';

// Reels Settings State with LocalStorage Persistence
let reelsSettings = {
  autoScroll: false,
  defaultSound: false,
  doubleTapLike: true,
  quality: 'auto',
  allowComments: 'all',
  allowDownloads: true,
  showViews: true,
};

try {
  const savedSettings = JSON.parse(localStorage.getItem('camshot_settings') || localStorage.getItem('nex_reels_settings') || '{}');
  reelsSettings = { ...reelsSettings, ...savedSettings };
} catch (e) {
  console.warn('[CAMSHOT] Settings parse error:', e);
}

let isGlobalMuted = reelsSettings.defaultSound ? false : true;
let activeReelId = null;
let currentCommentUnsubscribe = null;
let selectedReelFile = null;
let selectedReelThumbnailBlob = null;
let selectedReelThumbnailDataUrl = null;
let selectedSound = { title: 'Original Audio', artist: '', url: '' };
let previewAudio = null;
let currentPlayingSoundAudio = null;

// BUG FIX: Upload state management
let uploadAbortController = null;   // AbortController for canceling uploads
let detectedVideoWidth = 0;         // Source video width (for quality gating)
let detectedVideoHeight = 0;        // Source video height (for quality gating)
let uploadStartTime = 0;            // Timestamp for ETA calculation
let currentUploadXHR = null;        // XHR reference for aborting
let followedAuthors = new Set(JSON.parse(localStorage.getItem('nex_followed_authors') || '[]'));
let activeShareReel = null;
let activeProfileAuthor = null;
let currentProfileReels = [];
let currentProfilePics = [];

// Features A, B, C, D, E Application State
let activeFeedMode = 'foryou'; // 'foryou' | 'following'
let allLoadedReels = [];
let bookmarkedReels = new Set(JSON.parse(localStorage.getItem('nex_bookmarked_reels') || '[]'));
let userTokenBalance = parseInt(localStorage.getItem('nex_user_tokens') || '2000', 10);
let activeFilterShader = 'normal';
let activeAiReel = null;
let activeTipReel = null;
let activeTipAmount = 50;

// DOM Elements
const reelsFeed = document.getElementById('reelsFeed');
const reelsLoadingState = document.getElementById('reelsLoadingState');
const globalSoundToggle = document.getElementById('globalSoundToggle');
const openUploadModalBtn = document.getElementById('openUploadModalBtn');
const uploadReelModal = document.getElementById('uploadReelModal');
const closeUploadModalBtn = document.getElementById('closeUploadModalBtn');
const cancelUploadBtn = document.getElementById('cancelUploadBtn');
const uploadReelForm = document.getElementById('uploadReelForm');
const reelVideoInput = document.getElementById('reelVideoInput');
const reelDropzone = document.getElementById('reelDropzone');
const reelDropzonePrompt = document.getElementById('reelDropzonePrompt');
const reelPreviewContainer = document.getElementById('reelPreviewContainer');
const reelPreviewVideo = document.getElementById('reelPreviewVideo');
const reelDurationBadge = document.getElementById('reelDurationBadge');
const removeVideoBtn = document.getElementById('removeVideoBtn');
const submitReelBtn = document.getElementById('submitReelBtn');
const reelUploadProgressWrapper = document.getElementById('reelUploadProgressWrapper');
const reelProgressBarFill = document.getElementById('reelProgressBarFill');
const reelProgressPercent = document.getElementById('reelProgressPercent');
const reelProgressVault = document.getElementById('reelProgressVault');
const reelCaptionInput = document.getElementById('reelCaptionInput');
const reelCaptionCounter = document.getElementById('reelCaptionCounter');
const keepOriginalQuality = document.getElementById('keepOriginalQuality');
const commentsModal = document.getElementById('commentsModal');
const commentsBackdrop = document.getElementById('commentsBackdrop');
const closeCommentsBtn = document.getElementById('closeCommentsBtn');
const commentsList = document.getElementById('commentsList');
const commentForm = document.getElementById('commentForm');
const commentTextInput = document.getElementById('commentTextInput');
const commentsCountHeader = document.getElementById('commentsCountHeader');
const heartBurst = document.getElementById('heartBurst');
const reelsNotif = document.getElementById('reelsNotif');
const shareReelModal = document.getElementById('shareReelModal');
const closeShareModalBtn = document.getElementById('closeShareModalBtn');
const shareCopyLinkBtn = document.getElementById('shareCopyLinkBtn');
const shareNativeBtn = document.getElementById('shareNativeBtn');
const shareSendInChatBtn = document.getElementById('shareSendInChatBtn');
const shareDownloadBtn = document.getElementById('shareDownloadBtn');
const shareLinkInput = document.getElementById('shareLinkInput');
const shareQuickCopyBtn = document.getElementById('shareQuickCopyBtn');
const prevReelBtn = document.getElementById('prevReelBtn');
const nextReelBtn = document.getElementById('nextReelBtn');
const soundsLibraryModal = document.getElementById('soundsLibraryModal');
const openSoundLibraryBtn = document.getElementById('openSoundLibraryBtn');
const closeSoundsLibraryBtn = document.getElementById('closeSoundsLibraryBtn');
const soundsListContainer = document.getElementById('soundsListContainer');
const selectedSoundLabel = document.getElementById('selectedSoundLabel');
const resetSoundBtn = document.getElementById('resetSoundBtn');

// Toast Notification
function showToast(message, duration = 3000) {
  if (!reelsNotif) return;
  reelsNotif.textContent = message;
  reelsNotif.style.display = 'block';
  setTimeout(() => {
    reelsNotif.style.display = 'none';
  }, duration);
}

// Format numbers (e.g. 88700 -> 88.7K)
function formatNumber(num) {
  if (!num || isNaN(num)) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return String(num);
}

// High Quality Canvas Video Thumbnail Generator
export function generateVideoThumbnail(file, seekTime = 1.0) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(seekTime, (video.duration || 2) / 2);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 720;
        canvas.height = video.videoHeight || 1280;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);

        canvas.toBlob((blob) => {
          resolve({
            blob: blob,
            dataUrl: canvas.toDataURL('image/jpeg', 0.92),
            width: canvas.width,
            height: canvas.height,
          });
        }, 'image/jpeg', 0.92);
      } catch {
        URL.revokeObjectURL(url);
        resolve(null);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    setTimeout(() => {
      URL.revokeObjectURL(url);
      resolve(null);
    }, 4500);
  });
}

// Authentication Sync & Reels Profile Hydration
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    myUID = user.uid;
    myUsername = user.displayName || user.email?.split('@')[0] || `user_${myUID.substring(0, 5)}`;
    generalProfilePic = user.photoURL || 'favicon.png';
    myProfilePic = generalProfilePic;

    // Fetch user Firestore record for Reels preferences and avatar choice
    try {
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      if (userSnap.exists()) {
        const udata = userSnap.data();
        if (udata.profilePic || udata.profilePicUrl || udata.photoURL) {
          generalProfilePic = udata.profilePic || udata.profilePicUrl || udata.photoURL;
        }
        if (udata.reelsAvatar) {
          customReelsAvatar = udata.reelsAvatar;
        }
        if (udata.useCustomReelsAvatar !== undefined) {
          useCustomReelsAvatar = Boolean(udata.useCustomReelsAvatar);
        }
        if (udata.reelsCreatorName) {
          myCreatorName = udata.reelsCreatorName;
          myUsername = myCreatorName;
        }
        if (udata.reelsCreatorBio) {
          myCreatorBio = udata.reelsCreatorBio;
        }
        if (udata.reelsSettings) {
          reelsSettings = { ...reelsSettings, ...udata.reelsSettings };
        }
        if (udata.tokens !== undefined) {
          userTokenBalance = Number(udata.tokens);
        } else {
          userTokenBalance = 2000;
          setDoc(doc(db, 'users', user.uid), { tokens: 2000 }, { merge: true }).catch(() => {});
        }
        localStorage.setItem('nex_user_tokens', String(userTokenBalance));

        // Apply chosen avatar mode
        if (useCustomReelsAvatar && customReelsAvatar) {
          myProfilePic = customReelsAvatar;
        } else {
          myProfilePic = generalProfilePic;
        }
      }
    } catch (dbErr) {
      console.warn('[REELS] Could not fetch profile document:', dbErr.message);
    }

    syncSettingsUI();
  } else {
    currentUser = null;
    myUID = null;
  }
});

// Sound Toggle Handler
if (globalSoundToggle) {
  // Sync initial sound icon with setting
  const initialIcon = globalSoundToggle.querySelector('i');
  if (initialIcon) {
    initialIcon.className = isGlobalMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
  }

  globalSoundToggle.addEventListener('click', () => {
    isGlobalMuted = !isGlobalMuted;
    const icon = globalSoundToggle.querySelector('i');
    if (isGlobalMuted) {
      icon.className = 'fa-solid fa-volume-xmark';
      showToast('Muted');
    } else {
      icon.className = 'fa-solid fa-volume-high';
      showToast('Unmuted');
    }

    // Update all playing reel videos
    document.querySelectorAll('.reel-video').forEach((v) => {
      v.muted = isGlobalMuted;
    });

    if (currentPlayingSoundAudio) {
      currentPlayingSoundAudio.muted = isGlobalMuted;
    }
  });
}

// IntersectionObserver for vertical autoplay
const videoObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const video = entry.target.querySelector('video');
    const disc = entry.target.querySelector('.reel-sound-disc');
    const customAudio = entry.target._customAudio;
    if (!video) return;

    if (entry.isIntersecting && entry.intersectionRatio >= 0.65) {
      video.muted = isGlobalMuted;
      video.play().then(() => {
        if (disc) disc.style.animationPlayState = 'running';
      }).catch(() => {
        video.muted = true;
        video.play().catch(() => {});
        if (disc) disc.style.animationPlayState = 'running';
      });

      if (customAudio) {
        customAudio.currentTime = video.currentTime || 0;
        customAudio.muted = isGlobalMuted;
        customAudio.play().catch(() => {});
        currentPlayingSoundAudio = customAudio;
      }

      activeReelId = entry.target.dataset.reelId;
    } else {
      video.pause();
      if (disc) disc.style.animationPlayState = 'paused';
      if (customAudio) {
        customAudio.pause();
      }
    }
  });
}, { threshold: [0.65] });

// Desktop Prev/Next Buttons
if (prevReelBtn) {
  prevReelBtn.addEventListener('click', () => {
    reelsFeed.scrollBy({ top: -reelsFeed.clientHeight, behavior: 'smooth' });
  });
}

if (nextReelBtn) {
  nextReelBtn.addEventListener('click', () => {
    reelsFeed.scrollBy({ top: reelsFeed.clientHeight, behavior: 'smooth' });
  });
}

// Desktop Keyboard Hotkeys
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (uploadReelModal.style.display !== 'none' || commentsModal.style.display !== 'none' || soundsLibraryModal.style.display !== 'none') return;

  if (e.key === 'ArrowDown' || e.key === 'j' || e.key === 'J') {
    e.preventDefault();
    reelsFeed.scrollBy({ top: reelsFeed.clientHeight, behavior: 'smooth' });
  } else if (e.key === 'ArrowUp' || e.key === 'k' || e.key === 'K') {
    e.preventDefault();
    reelsFeed.scrollBy({ top: -reelsFeed.clientHeight, behavior: 'smooth' });
  } else if (e.key === ' ') {
    e.preventDefault();
    const currentCard = getCurrentActiveCard();
    if (currentCard) {
      const v = currentCard.querySelector('.reel-video');
      const pi = currentCard.querySelector('.reel-play-indicator');
      if (v.paused) {
        v.play();
        showPlayIndicator(pi, 'fa-play');
      } else {
        v.pause();
        showPlayIndicator(pi, 'fa-pause');
      }
    }
  } else if (e.key === 'm' || e.key === 'M') {
    globalSoundToggle.click();
  } else if (e.key === 'l' || e.key === 'L') {
    const currentCard = getCurrentActiveCard();
    if (currentCard) {
      const likeBtn = currentCard.querySelector('.like-btn');
      const likeCount = currentCard.querySelector('.like-count');
      if (likeBtn) handleLikeToggle(currentCard.dataset.reelId, likeBtn, likeCount);
    }
  } else if (e.key === 'c' || e.key === 'C' || e.key === '+') {
    e.preventDefault();
    openCreatorStudio();
  }
});

function getCurrentActiveCard() {
  const cards = document.querySelectorAll('.reel-card');
  const feedTop = reelsFeed.scrollTop;
  const feedHeight = reelsFeed.clientHeight;
  for (const card of cards) {
    const cardTop = card.offsetTop;
    if (Math.abs(cardTop - feedTop) < feedHeight * 0.4) {
      return card;
    }
  }
  return cards[0] || null;
}


// ══════════════════════════════════════════════════
// CURATED SEED REELS STREAM (Zero-Empty Feed Protection)
// ══════════════════════════════════════════════════
export const SEED_REELS = [
  {
    id: 'seed-reel-chronex-ai',
    videoUrl: 'https://res.cloudinary.com/demo/video/upload/ar_9:16,c_pad,b_auto/hourglass_timer.mp4',
    thumbnailUrl: 'https://res.cloudinary.com/demo/video/upload/ar_9:16,c_pad,b_auto/hourglass_timer.jpg',
    authorName: 'chronex_ai',
    authorPic: 'chronex-ai.jpg',
    caption: 'ChronEX AI v4.0 is now live across NEXCHAT! Real-time neural models, code debugging, and instant multi-language translation in chats and reels. #ChronEX #AI #FutureTech #NEXCHAT',
    likesCount: 48200,
    likes: [],
    commentsCount: 3,
    sharesCount: 9100,
    views: 194000,
    sound: 'Quantum Neural Drift — NEX_Records',
    audioUrl: '',
    poll: {
      question: 'Which ChronEX AI model do you use most?',
      options: [
        { text: '⚡ Ultra Fast (Lite)', votes: 142 },
        { text: '🧠 Deep Neural (Flash)', votes: 89 }
      ]
    },
    hasBounty: true,
    bountyAmount: 10,
    seedComments: [
      { authorName: 'dev_sarah', authorPic: 'favicon.png', text: 'The response latency on ChronEX v4 is insanely fast! Love the streaming markdown support.' },
      { authorName: 'cyber_mark', authorPic: 'logo.jpg', text: 'Can it generate Three.js shaders directly? Testing it today.' },
      { authorName: 'nex_fan', authorPic: 'chronex-ai.jpg', text: 'NEXCHAT AI integration keeps getting better and better.' }
    ]
  },
  {
    id: 'seed-reel-gaming-hub',
    videoUrl: 'https://res.cloudinary.com/demo/video/upload/ar_9:16,c_pad,b_auto/finish_line.mp4',
    thumbnailUrl: 'https://res.cloudinary.com/demo/video/upload/ar_9:16,c_pad,b_auto/finish_line.jpg',
    authorName: 'pixel_warlord',
    authorPic: 'chronex-ai.jpg',
    caption: 'Sprint to the finish in the NEX Gaming Hub Grand Finals! Down to 0.2 seconds on the clock. Who wants a rematch in the arcade lobby tonight? #GamingHub #Esports #Clutch #Speedrun #NEXCHAT',
    likesCount: 72400,
    likes: [],
    commentsCount: 3,
    sharesCount: 14800,
    views: 320000,
    sound: 'Cyberpunk Drift Phonk — DEMON_BEATS',
    audioUrl: '',
    poll: {
      question: 'Who wins the rematch tonight?',
      options: [
        { text: '🎮 Pixel Warlord', votes: 68 },
        { text: '🔥 Steve FPS', votes: 44 }
      ]
    },
    hasBounty: true,
    bountyAmount: 10,
    seedComments: [
      { authorName: 'arcade_king', authorPic: 'favicon.png', text: 'That final sprint timing was clutch! GG!' },
      { authorName: 'steve_fps', authorPic: 'logo.jpg', text: 'Challenge accepted! Meet me on the Gaming Hub leaderboard.' },
      { authorName: 'nova_gamer', authorPic: 'chronex-ai.jpg', text: 'The intensity was crazy, unreal reflex speed.' }
    ]
  },
  {
    id: 'seed-reel-motion-design',
    videoUrl: 'https://res.cloudinary.com/demo/video/upload/ar_9:16,c_pad,b_auto/wave.mp4',
    thumbnailUrl: 'https://res.cloudinary.com/demo/video/upload/ar_9:16,c_pad,b_auto/wave.jpg',
    authorName: 'motion_nexus',
    authorPic: 'logo.jpg',
    caption: 'Liquid neon physics simulation rendered with GPU particles. 60 FPS fluid dynamics study for our new NEX UI theme. Tap like if you want dark mode liquid wallpapers! #MotionDesign #3D #Blender #UIUX #CyberAesthetics',
    likesCount: 56100,
    likes: [],
    commentsCount: 3,
    sharesCount: 8700,
    views: 242000,
    sound: 'Midnight City Glide — K-Trap Labs',
    audioUrl: '',
    poll: {
      question: 'Want liquid neon live wallpapers in NEXCHAT?',
      options: [
        { text: '💎 YES 100%', votes: 312 },
        { text: '🖤 Keep Onyx Dark', votes: 28 }
      ]
    },
    seedComments: [
      { authorName: 'ui_designer', authorPic: 'favicon.png', text: 'Please release this as an animated chat wallpaper!' },
      { authorName: 'render_bot', authorPic: 'logo.jpg', text: 'The fluid refraction index is dialed in perfectly.' },
      { authorName: 'crypto_artist', authorPic: 'chronex-ai.jpg', text: 'Liquid aesthetics on another level.' }
    ]
  },
  {
    id: 'seed-reel-cyber-runner',
    videoUrl: 'https://res.cloudinary.com/demo/video/upload/ar_9:16,c_pad,b_auto/forest_bike.mp4',
    thumbnailUrl: 'https://res.cloudinary.com/demo/video/upload/ar_9:16,c_pad,b_auto/forest_bike.jpg',
    authorName: 'cyber_rider',
    authorPic: 'chronex-ai.jpg',
    caption: 'Full throttle mountain descent at sunset! High speed POV with gyro stabilization. Where should we ride next? Tag your crew below! #Extreme #ActionCam #Speed #Adventure #POV',
    likesCount: 61800,
    likes: [],
    commentsCount: 3,
    sharesCount: 11300,
    views: 275000,
    sound: 'Hyperdrive Synthwave — Retro_Future',
    audioUrl: '',
    seedComments: [
      { authorName: 'speed_demon', authorPic: 'favicon.png', text: 'That camera stabilization is doing work, looks so smooth!' },
      { authorName: 'rider_mike', authorPic: 'logo.jpg', text: 'Fast lines through those trees. Pure adrenaline!' },
      { authorName: 'adventures_with_leo', authorPic: 'chronex-ai.jpg', text: 'Awesome trail, need the GPS coordinates for this spot.' }
    ]
  },
  {
    id: 'seed-reel-synthwave-drone',
    videoUrl: 'https://res.cloudinary.com/demo/video/upload/ar_9:16,c_pad,b_auto/snow_horses.mp4',
    thumbnailUrl: 'https://res.cloudinary.com/demo/video/upload/ar_9:16,c_pad,b_auto/snow_horses.jpg',
    authorName: 'frost_cinematics',
    authorPic: 'logo.jpg',
    caption: 'Cinematic 4K FPV Drone Reel captured at 60 FPS in the Alpine Frost Zone. Testing real-time gyro stabilization algorithms. Drop your thoughts below! #Drone #FPV #Cinematic #Tech #NEXCHAT',
    likesCount: 52400,
    likes: [],
    commentsCount: 3,
    sharesCount: 8300,
    views: 215000,
    sound: 'Neon Tokyo Funk 2088 — Future_Wave',
    audioUrl: '',
    seedComments: [
      { authorName: 'drone_pilot', authorPic: 'favicon.png', text: 'The tracking on those subjects at speed is immaculate!' },
      { authorName: 'film_maker', authorPic: 'logo.jpg', text: 'What shutter speed and ND filter was this shot on? Looks cinematic.' },
      { authorName: 'tech_gear', authorPic: 'chronex-ai.jpg', text: 'Smooth 60fps playback, love this feed!' }
    ]
  }
];

// Subscribe to Firestore Reels Collection
function initReelsFeed() {
  const reelsQuery = query(
    collection(db, 'reels'),
    orderBy('createdAt', 'desc'),
    limit(40)
  );

  onSnapshot(reelsQuery, (snapshot) => {
    if (reelsLoadingState) reelsLoadingState.style.display = 'none';

    const reelDocs = (!snapshot.empty) ? snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) : [];

    // Augment with curated seed reels so the feed is never empty or abandoned
    const firestoreIds = new Set(reelDocs.map(r => r.id));
    const merged = [...reelDocs];
    SEED_REELS.forEach(sr => {
      if (!firestoreIds.has(sr.id)) {
        merged.push(sr);
      }
    });

    allLoadedReels = merged;
    applyFeedFilter();
  }, (err) => {
    console.warn('Reels stream fallback to seeded content:', err.message);
    if (reelsLoadingState) reelsLoadingState.style.display = 'none';
    allLoadedReels = [...SEED_REELS];
    applyFeedFilter();
  });
}

function applyFeedFilter() {
  if (activeFeedMode === 'following') {
    const followingReels = allLoadedReels.filter(r => followedAuthors.has(r.authorName));
    if (followingReels.length === 0) {
      renderEmptyFollowingFeed();
      return;
    }
    renderReels(followingReels);
  } else {
    renderReels(allLoadedReels);
  }
}

function renderEmptyFollowingFeed() {
  videoObserver.disconnect();
  reelsFeed.innerHTML = `
    <div class="reels-empty-state">
      <i class="fa-solid fa-user-group" style="font-size: 54px; color: var(--cs-gold); margin-bottom: 12px;"></i>
      <h3 style="color: #fff; font-size: 18px; font-weight: 800; font-family: var(--cs-font-display);">Following Stream Empty</h3>
      <p style="font-size: 13px; color: var(--cs-text-muted); max-width: 320px;">You are not following any creators yet or they haven't posted reels. Switch to For You to explore creators!</p>
      <button class="reels-btn-primary" style="margin-top: 14px;" id="switchBackForYouBtn">
        <i class="fa-solid fa-compass"></i> Explore For You
      </button>
    </div>
  `;
  const btn = document.getElementById('switchBackForYouBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      const tabFY = document.getElementById('tabForYou');
      if (tabFY) tabFY.click();
    });
  }
}

// Following vs For You Tab Switchers
const tabFollowing = document.getElementById('tabFollowing');
const tabForYou = document.getElementById('tabForYou');

if (tabFollowing && tabForYou) {
  tabFollowing.addEventListener('click', () => {
    if (activeFeedMode === 'following') return;
    activeFeedMode = 'following';
    tabFollowing.classList.add('active');
    tabForYou.classList.remove('active');
    applyFeedFilter();
  });

  tabForYou.addEventListener('click', () => {
    if (activeFeedMode === 'foryou') return;
    activeFeedMode = 'foryou';
    tabForYou.classList.add('active');
    tabFollowing.classList.remove('active');
    applyFeedFilter();
  });
}

function renderEmptyFeed(msg = 'No reels yet. Be the first to post a CamShot reel!') {
  reelsFeed.innerHTML = `
    <div class="reels-empty-state">
      <i class="fa-solid fa-clapperboard" style="font-size: 54px; color: var(--cs-gold); margin-bottom: 12px;"></i>
      <h3 style="color: #fff; font-size: 18px; font-weight: 800; font-family: var(--cs-font-display);">CamShot Stream Empty</h3>
      <p style="font-size: 13px; color: var(--cs-text-muted); max-width: 280px;">${msg}</p>
      <button class="reels-btn-primary" style="margin-top: 14px;" onclick="document.getElementById('openUploadModalBtn').click()">
        <i class="fa-solid fa-plus"></i> Create First Reel
      </button>
    </div>
  `;
}

// ══════════════════════════════════════════════════
// RENDER REELS: CAMSHOT ULTRA STREAM ARCHITECTURE
// NO MIDDLE WATERMARKS • NO DEBUG BADGES • ULTRA CLEAN
// ══════════════════════════════════════════════════
function renderReels(reelsList) {
  videoObserver.disconnect();
  reelsFeed.innerHTML = '';

  reelsList.forEach((reel) => {
    const isLiked = myUID && reel.likes && Array.isArray(reel.likes) && reel.likes.includes(myUID);
    const isBookmarked = bookmarkedReels.has(reel.id);
    const likeCount = reel.likesCount || (reel.likes ? reel.likes.length : 0);
    const commentCount = reel.commentsCount || 0;
    const shareCount = reel.sharesCount || 21000;
    const authorHandle = reel.authorName || 'creator';
    const isFollowing = followedAuthors.has(authorHandle);
    const soundTrackTitle = reel.sound || `Original Audio — @${authorHandle}`;

    // Debug logging to console ONLY
    console.log(`[CamShot] Mounted Reel ID: ${reel.id} | Vault: ${reel.vault || 'Cloudinary Pool'}`);

    const card = document.createElement('div');
    card.className = 'reel-card';
    card.dataset.reelId = reel.id;

    // Optional custom soundtrack audio element
    if (reel.audioUrl) {
      const audioEl = new Audio(reel.audioUrl);
      audioEl.loop = true;
      audioEl.muted = isGlobalMuted;
      card._customAudio = audioEl;
    }

    const filterClass = activeFilterShader && activeFilterShader !== 'normal' ? `filter-${activeFilterShader}` : '';

    // Card Markup: Video + Floating Action Bar + Bottom Metadata + Bottom Comment Input Bar
    const posterUrl = reel.thumbnailUrl || (reel.videoUrl ? reel.videoUrl.replace(/\.[^.]+$/, '.jpg') : 'logo.jpg');

    // Professional Video Player: Ambient Theater BG + Centered Phone-Ratio Stage (9:16)
    card.innerHTML = `
      <!-- Ambient background for desktop theater experience -->
      <div class="reel-ambient-bg" style="background-image: url('${posterUrl}');"></div>

      <!-- Central Phone-Proportioned Reel Stage (9:16) -->
      <div class="reel-stage">
        <!-- Dual-Layer Video Stage: Full-Sized Video + Ambient Blur Backdrop -->
        <div class="reel-video-wrapper">
          <div class="reel-ambient-backdrop" style="background-image: url('${posterUrl}');"></div>
          <video class="reel-video ${filterClass}" src="${reel.videoUrl}" poster="${posterUrl}" playsinline loop preload="metadata"></video>
          <div class="reel-play-indicator"><i class="fa-solid fa-play"></i></div>
        </div>

        <!-- Right Action Bar: Heart, Comment, Bookmark, Share, Tip, Bot, Music disc -->
        <aside class="reel-actions-column select-none pointer-events-auto">
          <!-- Heart (Like) -->
          <div class="flex flex-col items-center gap-1 cursor-pointer">
            <button type="button" class="like-btn text-white transition-transform active:scale-125 focus:outline-none" data-reel-id="${reel.id}" title="Like">
              <i class="fa-solid fa-heart text-[28px] ${isLiked ? 'text-[#fe2c55]' : 'text-white'} drop-shadow-[0_2px_5px_rgba(0,0,0,0.85)]"></i>
            </button>
            <span class="like-count text-xs font-bold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">${formatNumber(likeCount)}</span>
          </div>

          <!-- Comment -->
          <div class="flex flex-col items-center gap-1 cursor-pointer">
            <button type="button" class="comment-btn text-white transition-transform active:scale-125 focus:outline-none" data-reel-id="${reel.id}" title="Comments">
              <i class="fa-solid fa-comment-dots text-[28px] text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.85)]"></i>
            </button>
            <span class="reel-comment-count text-xs font-bold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">${formatNumber(commentCount)}</span>
          </div>

          <!-- Bookmark / Vault -->
          <div class="flex flex-col items-center gap-1 cursor-pointer">
            <button type="button" class="bookmark-btn text-white transition-transform active:scale-125 focus:outline-none" data-reel-id="${reel.id}" title="Save to Vault">
              <i class="${isBookmarked ? 'fa-solid fa-bookmark text-[#FFD700]' : 'fa-regular fa-bookmark text-white'} text-[25px] drop-shadow-[0_2px_5px_rgba(0,0,0,0.85)]"></i>
            </button>
            <span class="text-[11px] font-bold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">Save</span>
          </div>

          <!-- Share -->
          <div class="flex flex-col items-center gap-1 cursor-pointer">
            <button type="button" class="share-btn text-white transition-transform active:scale-125 focus:outline-none" data-reel-id="${reel.id}" title="Share">
              <i class="fa-solid fa-share text-[26px] text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.85)]"></i>
            </button>
            <span class="text-[11px] font-bold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">${formatNumber(shareCount)}</span>
          </div>

          <!-- More Actions (CamShot Stream Controls) -->
          <div class="flex flex-col items-center gap-1 cursor-pointer">
            <button type="button" class="bot-btn text-white transition-transform active:scale-125 focus:outline-none" title="More Actions (AI & Tips)">
              <i class="fa-solid fa-ellipsis text-[22px] text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.85)]"></i>
            </button>
          </div>

          <!-- Music disc rotating with floating notes -->
          <div class="music-disc-wrapper cursor-pointer mt-0.5" title="${escapeHtml(soundTrackTitle)}" style="position: relative;">
            <div class="music-note-float">♪</div>
            <div class="music-note-float" style="animation-delay: 1.2s; color: #ff2d55;">♫</div>
            <div class="reel-sound-disc w-9 h-9 rounded-full border border-white/20 bg-gradient-to-tr from-gray-950 via-zinc-900 to-black flex items-center justify-center drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
              <i class="fa-solid fa-compact-disc text-white text-sm"></i>
            </div>
          </div>
        </aside>

        <!-- Bottom Creator Handle + Caption + Sound Hub Row -->
        <div class="reel-bottom-info flex flex-col gap-1 text-white select-none pointer-events-auto">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="reel-creator-handle font-bold text-[14.5px] tracking-wide text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)] hover:underline cursor-pointer" data-author="${escapeHtml(authorHandle)}" title="View @${escapeHtml(authorHandle)} Profile">
              @${escapeHtml(authorHandle)}
            </span>
            <button type="button" class="reel-follow-pill ${isFollowing ? 'following' : ''}" data-author="${escapeHtml(authorHandle)}" title="Follow creator">
              ${isFollowing ? '<i class="fa-solid fa-check"></i> Following' : '<i class="fa-solid fa-plus"></i> Follow'}
            </button>
          </div>
          <p class="text-[13px] text-gray-100 font-normal leading-snug drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)] break-words">
            ${escapeHtml(reel.caption || '')}
          </p>
          <div class="reel-sound-row flex items-center gap-2 text-xs text-white/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] mt-0.5 cursor-pointer hover:text-[var(--cs-gold-soft)] transition-colors" title="Open Sound Hub">
            <i class="fa-solid fa-music text-[11px]"></i>
            <span class="truncate max-w-[200px] font-medium">${escapeHtml(soundTrackTitle)}</span>
          </div>
        </div>

        <!-- Bottom inline comment input bar -->
        <div class="reel-bottom-bar flex items-center gap-2">
          <div class="flex-1 bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-2 border-0 transition-all">
            <input type="text" class="reel-inline-input flex-1 bg-transparent text-white placeholder-gray-400 text-xs outline-none" placeholder="Add comment..." autocomplete="off">
            <button type="button" class="reel-inline-image-btn text-white/80 hover:text-white transition-colors" title="Add image">
              <i class="fa-regular fa-image text-[15px] drop-shadow"></i>
            </button>
            <button type="button" class="reel-inline-emoji-btn text-white/80 hover:text-white transition-colors" title="Add emoji">
              <i class="fa-regular fa-face-smile text-[15px] drop-shadow"></i>
            </button>
            <button type="button" class="reel-inline-at-btn text-white/80 hover:text-white transition-colors" title="Mention user">
              <i class="fa-solid fa-at text-[15px] drop-shadow"></i>
            </button>
          </div>
          <button type="button" class="reel-inline-send-btn text-white/90 hover:text-[var(--cs-gold)] transition-colors p-1.5 focus:outline-none" title="Post comment">
            <i class="fa-solid fa-paper-plane text-sm drop-shadow"></i>
          </button>
        </div>

        <!-- Premium Gold Scrubber Bar at Bottom -->
        <div class="reel-progress-container cursor-pointer" title="Seek video">
          <div class="reel-progress-track">
            <div class="reel-progress-fill"></div>
          </div>
        </div>
      </div>
    `;

    // ── INTERACTIVE CYBER OVERLAYS (Live Polls & Token Bounties) ──
    const stageEl = card.querySelector('.reel-stage');
    if (stageEl && reel.poll && reel.poll.question) {
      const pollBox = document.createElement('div');
      pollBox.className = 'camshot-poll-sticker';
      const votedKey = `camshot_poll_${reel.id}`;
      const userChoice = localStorage.getItem(votedKey);
      const opt1 = reel.poll.options?.[0]?.text || 'Option A';
      const opt2 = reel.poll.options?.[1]?.text || 'Option B';
      let v1 = Number(reel.poll.options?.[0]?.votes || 4);
      let v2 = Number(reel.poll.options?.[1]?.votes || 2);
      const total = v1 + v2;
      const pct1 = Math.round((v1 / total) * 100);
      const pct2 = 100 - pct1;

      pollBox.innerHTML = `
        <div class="poll-question-header"><i class="fa-solid fa-square-poll-vertical" style="color:var(--cs-gold);margin-right:6px;"></i>${escapeHtml(reel.poll.question)}</div>
        <div class="poll-options-stack">
          <button type="button" class="poll-option-btn ${userChoice === '1' ? 'voted' : ''}" data-choice="1">
            <div class="poll-fill-bar" style="width: ${userChoice ? pct1 : 0}%;"></div>
            <span class="poll-text-label">${escapeHtml(opt1)}</span>
            <span class="poll-pct-label" style="display:${userChoice ? 'inline' : 'none'};">${pct1}%</span>
          </button>
          <button type="button" class="poll-option-btn ${userChoice === '2' ? 'voted' : ''}" data-choice="2">
            <div class="poll-fill-bar" style="width: ${userChoice ? pct2 : 0}%;"></div>
            <span class="poll-text-label">${escapeHtml(opt2)}</span>
            <span class="poll-pct-label" style="display:${userChoice ? 'inline' : 'none'};">${pct2}%</span>
          </button>
        </div>
      `;

      pollBox.querySelectorAll('.poll-option-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (localStorage.getItem(votedKey)) return;
          const choice = btn.getAttribute('data-choice');
          localStorage.setItem(votedKey, choice);
          btn.classList.add('voted');
          if (choice === '1') v1++; else v2++;
          const tot = v1 + v2;
          const p1 = Math.round((v1 / tot) * 100);
          const p2 = 100 - p1;
          const fills = pollBox.querySelectorAll('.poll-fill-bar');
          const pcts = pollBox.querySelectorAll('.poll-pct-label');
          if (fills[0]) fills[0].style.width = `${p1}%`;
          if (fills[1]) fills[1].style.width = `${p2}%`;
          if (pcts[0]) { pcts[0].textContent = `${p1}%`; pcts[0].style.display = 'inline'; }
          if (pcts[1]) { pcts[1].textContent = `${p2}%`; pcts[1].style.display = 'inline'; }
          playLuxuryPopSound();
          showToast('🗳️ Live vote submitted!');
        });
      });
      stageEl.appendChild(pollBox);
    }

    if (stageEl && reel.hasBounty) {
      const bountyKey = `camshot_bounty_${reel.id}`;
      const isClaimed = Boolean(localStorage.getItem(bountyKey));
      const bountyBadge = document.createElement('div');
      bountyBadge.className = `camshot-bounty-badge ${isClaimed ? 'claimed' : ''}`;
      bountyBadge.innerHTML = isClaimed 
        ? `<i class="fa-solid fa-check"></i> <span>Claimed</span>`
        : `<i class="fa-solid fa-gift fa-bounce" style="color:#00ff66;"></i> <span>10 TOKENS</span>`;

      bountyBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        if (localStorage.getItem(bountyKey)) {
          showToast('You already claimed this bounty!');
          return;
        }
        localStorage.setItem(bountyKey, 'true');
        bountyBadge.className = 'camshot-bounty-badge claimed';
        bountyBadge.innerHTML = `<i class="fa-solid fa-check"></i> <span>Claimed</span>`;
        const currentTokens = parseInt(localStorage.getItem('nex_tokens') || '0', 10);
        localStorage.setItem('nex_tokens', String(currentTokens + 10));
        playLuxuryPopSound();
        showToast('🎉 Claimed 10 NEX Tokens Bounty from this CamShot!');
      });
      stageEl.appendChild(bountyBadge);
    }

    // Elements inside card
    const videoEl = card.querySelector('.reel-video');
    // Dynamic Aspect-Ratio Detection: If vertical 9:16, fill edge-to-edge; otherwise show full-sized without cropping
    videoEl.addEventListener('loadedmetadata', () => {
      if (videoEl.videoWidth && videoEl.videoHeight) {
        const ratio = videoEl.videoHeight / videoEl.videoWidth;
        if (ratio >= 1.35) {
          videoEl.classList.add('is-vertical');
        } else {
          videoEl.classList.remove('is-vertical');
        }
      }
    });

    const playIndicator = card.querySelector('.reel-play-indicator');
    const progressFill = card.querySelector('.reel-progress-fill');
    const progressContainer = card.querySelector('.reel-progress-container');
    const discEl = card.querySelector('.reel-sound-disc');
    const soundRowEl = card.querySelector('.reel-sound-row');
    const inlineInput = card.querySelector('.reel-inline-input');
    const inlineSendBtn = card.querySelector('.reel-inline-send-btn');
    const inlineEmojiBtn = card.querySelector('.reel-inline-emoji-btn');
    const inlineImageBtn = card.querySelector('.reel-inline-image-btn');
    const inlineAtBtn = card.querySelector('.reel-inline-at-btn');
    const botBtn = card.querySelector('.bot-btn');
    const bookmarkBtn = card.querySelector('.bookmark-btn');
    const tipBtn = card.querySelector('.tip-btn');

    // Video Timeupdate -> Update Progress Bar
    videoEl.addEventListener('timeupdate', () => {
      if (videoEl.duration) {
        const pct = (videoEl.currentTime / videoEl.duration) * 100;
        progressFill.style.width = `${pct}%`;
      }
    });

    // Scrubber click to seek
    progressContainer.addEventListener('click', (e) => {
      const rect = progressContainer.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      if (videoEl.duration) {
        videoEl.currentTime = pos * videoEl.duration;
        if (card._customAudio) card._customAudio.currentTime = videoEl.currentTime;
      }
    });

    // Inline comment submit handlers
    if (inlineInput && inlineSendBtn) {
      inlineInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitInlineComment(reel.id, inlineInput, card);
        }
      });

      inlineSendBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        submitInlineComment(reel.id, inlineInput, card);
      });
    }

    if (inlineEmojiBtn && inlineInput) {
      inlineEmojiBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const emojis = ['🔥', '❤️', '👏', '😂', '✨', '💯', '😍', '🙌'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        inlineInput.value += randomEmoji;
        inlineInput.focus();
      });
    }

    if (inlineAtBtn && inlineInput) {
      inlineAtBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        inlineInput.value += '@';
        inlineInput.focus();
      });
    }

    if (inlineImageBtn) {
      inlineImageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showToast('Image attachments in comments coming soon!');
      });
    }

    // Bot Button -> Open ChronEX AI Companion Drawer
    if (botBtn) {
      botBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openChronexAiDrawer(reel);
      });
    }

    // Bookmark Button -> Toggle Saved Vault
    if (bookmarkBtn) {
      bookmarkBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleBookmarkToggle(reel.id, bookmarkBtn);
      });
    }

    // Tip Button -> Open Tip Creator Modal
    if (tipBtn) {
      tipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openTipModal(reel);
      });
    }

    // Sound Disc & Sound Row Click -> Open Sound Hub
    if (discEl) {
      discEl.addEventListener('click', (e) => {
        e.stopPropagation();
        openSoundHub(reel);
      });
    }

    if (soundRowEl) {
      soundRowEl.addEventListener('click', (e) => {
        e.stopPropagation();
        openSoundHub(reel);
      });
    }

    // Creator Profile Click Listener
    const creatorHandle = card.querySelector('.reel-creator-handle');
    if (creatorHandle) {
      creatorHandle.addEventListener('click', (e) => {
        e.stopPropagation();
        openCreatorProfile(authorHandle, reel.authorPic || 'favicon.png');
      });
    }

    // Hold-to-2X Speed Feature (Pointer events)
    let holdTimer = null;
    let is2xActive = false;
    let hasHoldTriggered = false;
    const speed2xBadge = document.getElementById('speed2xBadge');

    const startHoldSpeed = (e) => {
      // Don't trigger when clicking buttons or interactive areas
      if (
        e.target.closest('aside') ||
        e.target.closest('.reel-progress-container') ||
        e.target.closest('.reel-bottom-bar') ||
        e.target.closest('button') ||
        e.target.closest('input') ||
        e.target.closest('.reel-creator-handle') ||
        e.target.closest('.reel-sound-row')
      ) return;

      hasHoldTriggered = false;
      holdTimer = setTimeout(() => {
        is2xActive = true;
        hasHoldTriggered = true;
        videoEl.playbackRate = 2.0;
        if (card._customAudio) card._customAudio.playbackRate = 2.0;
        if (speed2xBadge) speed2xBadge.style.display = 'flex';
        if (navigator.vibrate) navigator.vibrate(30);
      }, 220);
    };

    const stopHoldSpeed = () => {
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
      if (is2xActive) {
        is2xActive = false;
        videoEl.playbackRate = 1.0;
        if (card._customAudio) card._customAudio.playbackRate = 1.0;
        if (speed2xBadge) speed2xBadge.style.display = 'none';
      }
    };

    card.addEventListener('pointerdown', startHoldSpeed);
    card.addEventListener('pointerup', stopHoldSpeed);
    card.addEventListener('pointercancel', stopHoldSpeed);
    card.addEventListener('mouseleave', stopHoldSpeed);

    // Video Tap & Double Tap (Double tap anywhere = like + show big heart)
    let lastTap = 0;
    let singleTapTimeout = null;
    card.addEventListener('click', (e) => {
      // Ignore clicks on action bar, inputs, buttons, comment bar, progress container
      if (
        e.target.closest('aside') ||
        e.target.closest('.reel-progress-container') ||
        e.target.closest('.reel-bottom-bar') ||
        e.target.closest('button') ||
        e.target.closest('input')
      ) return;

      if (hasHoldTriggered) {
        hasHoldTriggered = false;
        return;
      }

      const now = Date.now();
      if (now - lastTap < 280) {
        // Double Tap -> Heart Burst + Like without jitter
        if (singleTapTimeout) {
          clearTimeout(singleTapTimeout);
          singleTapTimeout = null;
        }
        triggerHeartBurst(e.clientX, e.clientY);
        handleLikeToggle(reel.id, card.querySelector('.like-btn'), card.querySelector('.like-count'), true);
        lastTap = 0;
        return;
      }
      lastTap = now;

      // Single Tap -> Play/Pause with clean 250ms debounce
      singleTapTimeout = setTimeout(() => {
        if (videoEl.muted) {
          videoEl.muted = false;
          isGlobalMuted = false;
          const sndIcon = globalSoundToggle?.querySelector('i');
          if (sndIcon) sndIcon.className = 'fa-solid fa-volume-high';
          if (card._customAudio) card._customAudio.muted = false;
          showPlayIndicator(playIndicator, 'fa-volume-high');
        }

        if (videoEl.paused) {
          videoEl.play().catch(() => {});
          showPlayIndicator(playIndicator, 'fa-play');
          if (discEl) discEl.style.animationPlayState = 'running';
          if (card._customAudio) card._customAudio.play().catch(() => {});
        } else {
          videoEl.pause();
          showPlayIndicator(playIndicator, 'fa-pause');
          if (discEl) discEl.style.animationPlayState = 'paused';
          if (card._customAudio) card._customAudio.pause();
        }
        singleTapTimeout = null;
      }, 250);
    });

    // Like Button
    card.querySelector('.like-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      handleLikeToggle(reel.id, card.querySelector('.like-btn'), card.querySelector('.like-count'));
    });

    // Comment Button
    card.querySelector('.comment-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openCommentsDrawer(reel.id);
    });

    // Share Button
    card.querySelector('.share-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openShareModal(reel);
    });

    // Follow Creator Pill Button
    const followBtn = card.querySelector('.reel-follow-pill');
    if (followBtn) {
      followBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playLuxuryPopSound();
        const author = followBtn.getAttribute('data-author');
        if (followedAuthors.has(author)) {
          followedAuthors.delete(author);
          followBtn.classList.remove('following');
          followBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Follow';
          showToast(`Unfollowed @${author}`);
        } else {
          followedAuthors.add(author);
          followBtn.classList.add('following');
          followBtn.innerHTML = '<i class="fa-solid fa-check"></i> Following';
          showToast(`Following @${author}`);
        }
        localStorage.setItem('nex_followed_authors', JSON.stringify([...followedAuthors]));
      });
    }

    reelsFeed.appendChild(card);
    videoObserver.observe(card);
  });
}

// Submit inline comment from bottom bar
async function submitInlineComment(reelId, inputEl, cardEl) {
  const text = inputEl.value.trim();
  if (!text) return;
  inputEl.value = '';

  const user = getEffectiveUser();
  const localComment = {
    id: 'local_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    authorId: user.uid,
    authorName: user.username,
    authorPic: user.pic,
    text: text,
    createdAt: Date.now()
  };
  saveLocalReelComment(reelId, localComment);

  // Optimistic UI update on the reel card
  const commentCountEl = cardEl?.querySelector('.reel-comment-count');
  if (commentCountEl) {
    const current = parseInt(commentCountEl.textContent.replace(/[^0-9]/g, '') || '0', 10);
    commentCountEl.textContent = formatNumber(current + 1);
  }
  showToast('Comment posted!');

  // Non-blocking sync to Firestore
  try {
    await addDoc(collection(db, 'reels', reelId, 'comments'), {
      authorId: user.uid,
      authorName: user.username,
      authorPic: user.pic,
      text: text,
      createdAt: serverTimestamp(),
    });
    await safeIncrementReelCommentCount(reelId);
  } catch (err) {
    console.warn('Firestore comment synced locally:', err);
  }
}

function showPlayIndicator(el, iconClass) {
  if (!el) return;
  el.innerHTML = `<i class="fa-solid ${iconClass}"></i>`;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 400);
}

// Zero-dependency Web Audio synthesizer for tactile pops & clicks
function playLuxuryPopSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(860, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {}
}

// Deluxe Double Tap Heart Burst + Radiant Particle Dispersion
function triggerHeartBurst(x, y) {
  playLuxuryPopSound();
  const posX = (typeof x === 'number' && !isNaN(x) && x > 0) ? x : (window.innerWidth / 2);
  const posY = (typeof y === 'number' && !isNaN(y) && y > 0) ? y : (window.innerHeight / 2);

  // Big central 3D heart with bounce and glow
  const bigHeart = document.createElement('div');
  bigHeart.className = 'heart-burst-deluxe';
  bigHeart.innerHTML = '<i class="fa-solid fa-heart"></i>';
  bigHeart.style.left = `${posX}px`;
  bigHeart.style.top = `${posY}px`;
  document.body.appendChild(bigHeart);
  setTimeout(() => bigHeart.remove(), 950);

  // Floating sparkling particle explosion
  const emojis = ['❤️', '✨', '🔥', '💖', '⭐', '💫', '💥'];
  for (let i = 0; i < 7; i++) {
    const p = document.createElement('div');
    p.className = 'heart-particle-particle';
    p.textContent = emojis[i % emojis.length];
    const angle = (Math.PI * 2 * i) / 7 + (Math.random() * 0.3 - 0.15);
    const dist = 55 + Math.random() * 65;
    const destX = Math.cos(angle) * dist;
    const destY = Math.sin(angle) * dist - 40;
    p.style.setProperty('--dx', `${destX}px`);
    p.style.setProperty('--dy', `${destY}px`);
    p.style.left = `${posX}px`;
    p.style.top = `${posY}px`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 850);
  }
}

// Like Toggle Logic
async function handleLikeToggle(reelId, likeBtn, countSpan, forceLike = false) {
  if (!myUID) {
    showToast('Log in to like CamShots');
    return;
  }

  const reelRef = doc(db, 'reels', reelId);
  const heartIcon = likeBtn.querySelector('i') || likeBtn;
  const currentlyLiked = heartIcon.classList.contains('text-[#fe2c55]');

  if (currentlyLiked && !forceLike) {
    heartIcon.classList.remove('text-[#fe2c55]');
    heartIcon.classList.add('text-white');
    const current = Math.max(0, parseInt(countSpan.textContent.replace(/[^0-9]/g, '') || '1', 10) - 1);
    countSpan.textContent = formatNumber(current);
    await updateDoc(reelRef, {
      likes: arrayRemove(myUID),
      likesCount: increment(-1),
    }).catch(err => console.warn('Like remove err:', err));
  } else if (!currentlyLiked) {
    heartIcon.classList.remove('text-white');
    heartIcon.classList.add('text-[#fe2c55]');
    heartIcon.classList.add('scale-125');
    setTimeout(() => heartIcon.classList.remove('scale-125'), 200);
    const current = parseInt(countSpan.textContent.replace(/[^0-9]/g, '') || '0', 10) + 1;
    countSpan.textContent = formatNumber(current);
    await updateDoc(reelRef, {
      likes: arrayUnion(myUID),
      likesCount: increment(1),
    }).catch(err => console.warn('Like add err:', err));
  }
}

// ══════════════════════════════════════════════════
// FEATURE B: BOOKMARKS / SAVED VAULT LOGIC
// ══════════════════════════════════════════════════
function handleBookmarkToggle(reelId, btn) {
  const icon = btn.querySelector('i');
  if (bookmarkedReels.has(reelId)) {
    bookmarkedReels.delete(reelId);
    if (icon) icon.className = 'fa-regular fa-bookmark text-white text-[26px] drop-shadow-[0_2px_5px_rgba(0,0,0,0.85)]';
    showToast('Removed from Saved Vault');
  } else {
    bookmarkedReels.add(reelId);
    if (icon) {
      icon.className = 'fa-solid fa-bookmark text-[#FFD700] text-[26px] drop-shadow-[0_2px_5px_rgba(0,0,0,0.85)] scale-125';
      setTimeout(() => icon.classList.remove('scale-125'), 200);
    }
    showToast('Saved to Saved Vault');
  }
  localStorage.setItem('nex_bookmarked_reels', JSON.stringify([...bookmarkedReels]));
  updateSavedTabCount();
}

function updateSavedTabCount() {
  const savedCountEl = document.getElementById('profileSavedTabCount');
  if (savedCountEl) savedCountEl.textContent = bookmarkedReels.size;
}

// ══════════════════════════════════════════════════
// FEATURE B: CREATOR TOKEN TIPPING & COIN BURST
// ══════════════════════════════════════════════════
const tipCreatorModal = document.getElementById('tipCreatorModal');
const closeTipModalBtn = document.getElementById('closeTipModalBtn');
const tipRecipientAvatar = document.getElementById('tipRecipientAvatar');
const tipRecipientName = document.getElementById('tipRecipientName');
const tipRecipientHandle = document.getElementById('tipRecipientHandle');
const tipUserBalance = document.getElementById('tipUserBalance');
const confirmTipBtn = document.getElementById('confirmTipBtn');
const tipBtnAmount = document.getElementById('tipBtnAmount');
const coinBurstLayer = document.getElementById('coinBurstLayer');

function openTipModal(reel) {
  activeTipReel = reel;
  activeTipAmount = 50;

  if (tipRecipientAvatar) tipRecipientAvatar.src = reel.authorPic || 'favicon.png';
  if (tipRecipientName) tipRecipientName.textContent = reel.authorName || 'Creator';
  if (tipRecipientHandle) tipRecipientHandle.textContent = `@${reel.authorName || 'creator'}`;
  if (tipUserBalance) tipUserBalance.textContent = formatNumber(userTokenBalance);
  if (tipBtnAmount) tipBtnAmount.textContent = '50';

  document.querySelectorAll('.tip-pill').forEach((pill) => {
    pill.classList.toggle('active', pill.dataset.amount === '50');
  });

  if (tipCreatorModal) tipCreatorModal.style.display = 'flex';
}

function closeTipModal() {
  if (tipCreatorModal) tipCreatorModal.style.display = 'none';
  activeTipReel = null;
}

if (closeTipModalBtn) closeTipModalBtn.addEventListener('click', closeTipModal);

document.querySelectorAll('.tip-pill').forEach((pill) => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.tip-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    activeTipAmount = parseInt(pill.dataset.amount, 10);
    if (tipBtnAmount) tipBtnAmount.textContent = activeTipAmount;
  });
});

if (confirmTipBtn) {
  confirmTipBtn.addEventListener('click', async () => {
    if (!activeTipReel) return;
    if (userTokenBalance < activeTipAmount) {
      showToast('Insufficient token balance!');
      return;
    }

    userTokenBalance -= activeTipAmount;
    localStorage.setItem('nex_user_tokens', String(userTokenBalance));
    if (tipUserBalance) tipUserBalance.textContent = formatNumber(userTokenBalance);

    // Update in Firestore
    if (myUID) {
      updateDoc(doc(db, 'users', myUID), {
        tokens: increment(-activeTipAmount),
      }).catch(err => console.warn('Token deduct error:', err));
    }
    if (activeTipReel.authorId && activeTipReel.authorId !== myUID) {
      updateDoc(doc(db, 'users', activeTipReel.authorId), {
        tokens: increment(activeTipAmount),
      }).catch(err => console.warn('Token credit error:', err));
    }
    if (activeTipReel.id) {
      updateDoc(doc(db, 'reels', activeTipReel.id), {
        tokensTipped: increment(activeTipAmount),
      }).catch(err => console.warn('Reel tip increment error:', err));
    }

    triggerCoinBurst();
    showToast(`Tipped ${activeTipAmount} NEX Tokens to @${activeTipReel.authorName}!`);

    setTimeout(() => {
      closeTipModal();
    }, 700);
  });
}

function triggerCoinBurst() {
  if (!coinBurstLayer) return;
  coinBurstLayer.innerHTML = '';
  coinBurstLayer.style.display = 'block';

  for (let i = 0; i < 18; i++) {
    const coin = document.createElement('div');
    coin.className = 'floating-coin';
    coin.innerHTML = '<i class="fa-solid fa-coins"></i>';
    const left = 20 + Math.random() * 60;
    const delay = Math.random() * 0.4;
    coin.style.left = `${left}%`;
    coin.style.animationDelay = `${delay}s`;
    coinBurstLayer.appendChild(coin);
  }

  setTimeout(() => {
    coinBurstLayer.style.display = 'none';
    coinBurstLayer.innerHTML = '';
  }, 1600);
}

// ══════════════════════════════════════════════════
// FEATURE C: SOUND HUB DRAWER ("Use This Sound")
// ══════════════════════════════════════════════════
const soundHubDrawer = document.getElementById('soundHubDrawer');
const closeSoundHubBtn = document.getElementById('closeSoundHubBtn');
const soundHubTrackTitle = document.getElementById('soundHubTrackTitle');
const soundHubArtistName = document.getElementById('soundHubArtistName');
const soundHubUsageCount = document.getElementById('soundHubUsageCount');
const soundHubDisc = document.getElementById('soundHubDisc');
const useThisSoundDrawerBtn = document.getElementById('useThisSoundDrawerBtn');
const soundHubPlayPauseBtn = document.getElementById('soundHubPlayPauseBtn');
const soundHubWaveFill = document.getElementById('soundHubWaveFill');
const soundHubReelsGrid = document.getElementById('soundHubReelsGrid');
const shareSoundTopBtn = document.getElementById('shareSoundTopBtn');

let soundHubAudioEl = null;
let soundHubAudioInterval = null;

function openSoundHub(reel) {
  const soundName = reel.sound || `Original Audio — @${reel.authorName || 'creator'}`;
  const authorName = reel.authorName || 'creator';

  if (soundHubTrackTitle) soundHubTrackTitle.textContent = soundName;
  if (soundHubArtistName) soundHubArtistName.textContent = `@${authorName}`;

  // Find all reels using this sound
  const matchingReels = allLoadedReels.filter(r => (r.sound && r.sound === reel.sound) || (!r.sound && !reel.sound && r.authorName === reel.authorName));
  const usageCount = Math.max(matchingReels.length * 142 + 23, 1420);
  if (soundHubUsageCount) soundHubUsageCount.textContent = formatNumber(usageCount);

  // Render matching videos
  if (soundHubReelsGrid) {
    soundHubReelsGrid.innerHTML = '';
    matchingReels.forEach((r) => {
      const item = document.createElement('div');
      item.className = 'profile-grid-item';
      const thumb = r.thumbnailUrl;
      item.innerHTML = `
        ${thumb ? `<img src="${thumb}" class="profile-grid-thumb" alt="Reel">` : `<video src="${r.videoUrl}#t=0.5" class="profile-grid-thumb" preload="metadata" muted playsinline></video>`}
        <div class="profile-grid-play-badge"><i class="fa-solid fa-play text-[9px]"></i> ${formatNumber(r.views || 850)}</div>
      `;
      item.addEventListener('click', () => {
        closeSoundHub();
        const target = document.querySelector(`.reel-card[data-reel-id="${r.id}"]`);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
          const v = target.querySelector('video');
          if (v) v.play().catch(() => {});
        }
      });
      soundHubReelsGrid.appendChild(item);
    });
  }

  // Audio preview preparation
  const audioSrc = reel.audioUrl || reel.videoUrl;
  if (soundHubAudioEl) {
    soundHubAudioEl.pause();
    soundHubAudioEl = null;
  }
  if (audioSrc) {
    soundHubAudioEl = new Audio(audioSrc);
  }

  if (soundHubDrawer) soundHubDrawer.style.display = 'flex';
}

function closeSoundHub() {
  if (soundHubAudioEl) {
    soundHubAudioEl.pause();
    soundHubAudioEl = null;
  }
  if (soundHubAudioInterval) {
    clearInterval(soundHubAudioInterval);
    soundHubAudioInterval = null;
  }
  if (soundHubPlayPauseBtn) soundHubPlayPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
  if (soundHubWaveFill) soundHubWaveFill.style.width = '0%';
  if (soundHubDisc) soundHubDisc.style.animationPlayState = 'paused';
  if (soundHubDrawer) soundHubDrawer.style.display = 'none';
}

if (closeSoundHubBtn) closeSoundHubBtn.addEventListener('click', closeSoundHub);

if (soundHubPlayPauseBtn) {
  soundHubPlayPauseBtn.addEventListener('click', () => {
    if (!soundHubAudioEl) return;
    if (soundHubAudioEl.paused) {
      soundHubAudioEl.play().catch(() => {});
      soundHubPlayPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
      if (soundHubDisc) soundHubDisc.style.animationPlayState = 'running';
      soundHubAudioInterval = setInterval(() => {
        if (soundHubAudioEl && soundHubAudioEl.duration) {
          const pct = (soundHubAudioEl.currentTime / soundHubAudioEl.duration) * 100;
          if (soundHubWaveFill) soundHubWaveFill.style.width = `${pct}%`;
        }
      }, 100);
      soundHubAudioEl.onended = () => {
        soundHubPlayPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        if (soundHubWaveFill) soundHubWaveFill.style.width = '0%';
        if (soundHubDisc) soundHubDisc.style.animationPlayState = 'paused';
        clearInterval(soundHubAudioInterval);
      };
    } else {
      soundHubAudioEl.pause();
      soundHubPlayPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
      if (soundHubDisc) soundHubDisc.style.animationPlayState = 'paused';
      clearInterval(soundHubAudioInterval);
    }
  });
}

if (useThisSoundDrawerBtn) {
  useThisSoundDrawerBtn.addEventListener('click', () => {
    const title = soundHubTrackTitle ? soundHubTrackTitle.textContent : 'Original Audio';
    const artist = soundHubArtistName ? soundHubArtistName.textContent : '';
    const audioUrl = soundHubAudioEl ? soundHubAudioEl.src : '';

    selectedSound = { title, artist, url: audioUrl };
    if (selectedSoundLabel) selectedSoundLabel.textContent = `${title} — ${artist}`;
    const reelSoundTitle = document.getElementById('reelSoundTitle');
    const reelSoundUrl = document.getElementById('reelSoundUrl');
    if (reelSoundTitle) reelSoundTitle.value = title;
    if (reelSoundUrl) reelSoundUrl.value = audioUrl;

    closeSoundHub();
    if (uploadReelModal) uploadReelModal.style.display = 'flex';
    showToast(`Sound applied: ${title}`);
  });
}

if (shareSoundTopBtn) {
  shareSoundTopBtn.addEventListener('click', () => {
    const title = soundHubTrackTitle?.textContent || 'Sound';
    navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#sound/${encodeURIComponent(title)}`).then(() => {
      showToast('Sound link copied to clipboard!');
    });
  });
}

// ══════════════════════════════════════════════════
// FEATURE D: CHRONEX AI COMPANION DRAWER
// ══════════════════════════════════════════════════
const chronexAiDrawer = document.getElementById('chronexAiDrawer');
const closeChronexAiBtn = document.getElementById('closeChronexAiBtn');
const chronexAiSummaryText = document.getElementById('chronexAiSummaryText');
const chronexAiTagsRow = document.getElementById('chronexAiTagsRow');
const smartReplyChips = document.getElementById('smartReplyChips');
const chronexAiQuestionInput = document.getElementById('chronexAiQuestionInput');
const chronexAiAskBtn = document.getElementById('chronexAiAskBtn');
const chronexAiAnswerBox = document.getElementById('chronexAiAnswerBox');
const chronexAiAnswerText = document.getElementById('chronexAiAnswerText');

function openChronexAiDrawer(reel) {
  activeAiReel = reel;
  const author = reel.authorName || 'creator';
  const caption = reel.caption || '';

  if (chronexAiSummaryText) {
    chronexAiSummaryText.innerHTML = `<strong>Neural Video Scanner:</strong> Detected high dynamic range cinematic stream by <strong>@${escapeHtml(author)}</strong>. Real-time visual telemetry indicates high virality potential. Audio soundtrack is synchronized with visual keyframes.`;
  }

  // Extract or generate tags
  if (chronexAiTagsRow) {
    const tags = caption.match(/#[a-zA-Z0-9_]+/g) || ['#CamShot', '#viral', '#cinematic', '#trending', '#4K'];
    chronexAiTagsRow.innerHTML = tags.map(t => `<span class="chronex-tag">${escapeHtml(t)}</span>`).join('');
  }

  // 1-Tap Smart Replies
  if (smartReplyChips) {
    const replies = [
      `This lighting in @${author}'s reel is immaculate!`,
      `What camera rig or grading LUT did you use for this?`,
      `CamShot AI Score: 99.8% Cinematic Masterpiece!`,
    ];

    smartReplyChips.innerHTML = '';
    replies.forEach((rep) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'smart-reply-chip';
      btn.textContent = rep;
      btn.addEventListener('click', async () => {
        const user = getEffectiveUser();
        saveLocalReelComment(reel.id, {
          id: 'ai_reply_' + Date.now(),
          authorId: user.uid,
          authorName: user.username,
          authorPic: user.pic,
          text: rep,
          createdAt: Date.now()
        });
        showToast('Smart comment posted!');
        closeChronexAiDrawer();
        try {
          await addDoc(collection(db, 'reels', reel.id, 'comments'), {
            authorId: user.uid,
            authorName: user.username,
            authorPic: user.pic,
            text: rep,
            createdAt: serverTimestamp(),
          });
          await safeIncrementReelCommentCount(reel.id);
        } catch (err) {
          console.warn('AI reply synced locally:', err);
        }
      });
      smartReplyChips.appendChild(btn);
    });
  }

  if (chronexAiAnswerBox) chronexAiAnswerBox.style.display = 'none';
  if (chronexAiQuestionInput) chronexAiQuestionInput.value = '';
  if (chronexAiDrawer) chronexAiDrawer.style.display = 'flex';
}

function closeChronexAiDrawer() {
  if (chronexAiDrawer) chronexAiDrawer.style.display = 'none';
  activeAiReel = null;
}

if (closeChronexAiBtn) closeChronexAiBtn.addEventListener('click', closeChronexAiDrawer);

if (chronexAiAskBtn && chronexAiQuestionInput) {
  const handleAiQuestion = () => {
    const q = chronexAiQuestionInput.value.trim().toLowerCase();
    if (!q || !activeAiReel) return;

    let ans = '';
    if (q.includes('song') || q.includes('music') || q.includes('audio') || q.includes('sound')) {
      ans = `Soundtrack: "${activeAiReel.sound || 'Original Audio'}" uploaded by @${activeAiReel.authorName}. You can tap the spinning disc to open Sound Hub!`;
    } else if (q.includes('who') || q.includes('author') || q.includes('creator')) {
      ans = `Creator: @${activeAiReel.authorName}. They stream high-definition reels on NEXCHAT. Tap their handle to view their full portfolio.`;
    } else if (q.includes('quality') || q.includes('resolution') || q.includes('fps')) {
      ans = `Quality: High Definition Video stream with smooth playback.`;
    } else {
      ans = `ChronEX Intelligence: Analyzed "${q}" for reel "${activeAiReel.caption || activeAiReel.id}". Video has ${formatNumber(activeAiReel.likesCount || 0)} likes and is currently trending!`;
    }

    if (chronexAiAnswerText) chronexAiAnswerText.textContent = ans;
    if (chronexAiAnswerBox) chronexAiAnswerBox.style.display = 'block';
  };

  chronexAiAskBtn.addEventListener('click', handleAiQuestion);
  chronexAiQuestionInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAiQuestion();
    }
  });
}

// ══════════════════════════════════════════════════
// FEATURE E: CYBER VISUAL FILTERS / SHADERS RIBBON
// ══════════════════════════════════════════════════
const toggleFilterBtn = document.getElementById('toggleFilterBtn');
const cyberFilterRibbon = document.getElementById('cyberFilterRibbon');
const closeFilterRibbonBtn = document.getElementById('closeFilterRibbonBtn');

if (toggleFilterBtn && cyberFilterRibbon) {
  toggleFilterBtn.addEventListener('click', () => {
    const isShowing = cyberFilterRibbon.style.display !== 'none';
    cyberFilterRibbon.style.display = isShowing ? 'none' : 'flex';
  });
}

if (closeFilterRibbonBtn && cyberFilterRibbon) {
  closeFilterRibbonBtn.addEventListener('click', () => {
    cyberFilterRibbon.style.display = 'none';
  });
}

document.querySelectorAll('.filter-shader-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-shader-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilterShader = btn.dataset.filter;

    // Apply or remove filter classes on all reel videos
    document.querySelectorAll('.reel-video').forEach((v) => {
      v.classList.remove('filter-matrix', 'filter-cyber-neon', 'filter-night-city', 'filter-noir');
      if (activeFilterShader !== 'normal') {
        v.classList.add(`filter-${activeFilterShader}`);
      }
    });

    showToast(`Visual Filter: ${btn.textContent.trim()}`);
  });
});

// ══════════════════════════════════════════════════
// ISSUE 4: MUSIC & SOUNDS LIBRARY LOGIC
// ══════════════════════════════════════════════════
function populateSoundsLibrary() {
  if (!soundsListContainer) return;
  soundsListContainer.innerHTML = '';

  TRENDING_SOUNDS.forEach((track) => {
    const row = document.createElement('div');
    row.className = 'sound-item-row';
    row.innerHTML = `
      <div class="sound-item-info">
        <button type="button" class="sound-play-toggle-btn" title="Preview Sound">
          <i class="fa-solid fa-play"></i>
        </button>
        <div class="sound-details">
          <span class="sound-title">${escapeHtml(track.title)}</span>
          <span class="sound-artist">${escapeHtml(track.artist)} • ${track.duration}</span>
        </div>
      </div>
      <button type="button" class="sound-select-pill-btn">Select</button>
    `;

    const playBtn = row.querySelector('.sound-play-toggle-btn');
    const selectBtn = row.querySelector('.sound-select-pill-btn');

    playBtn.addEventListener('click', () => {
      if (previewAudio && previewAudio.src === track.url && !previewAudio.paused) {
        previewAudio.pause();
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
      } else {
        if (previewAudio) previewAudio.pause();
        document.querySelectorAll('.sound-play-toggle-btn').forEach(b => b.innerHTML = '<i class="fa-solid fa-play"></i>');
        previewAudio = new Audio(track.url);
        previewAudio.play().catch(() => {});
        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        previewAudio.onended = () => {
          playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        };
      }
    });

    selectBtn.addEventListener('click', () => {
      if (previewAudio) {
        previewAudio.pause();
        previewAudio = null;
      }
      selectedSound = {
        title: track.title,
        artist: track.artist,
        url: track.url,
      };
      selectedSoundLabel.textContent = `${track.title} — ${track.artist}`;
      document.getElementById('reelSoundTitle').value = `${track.title} — ${track.artist}`;
      document.getElementById('reelSoundUrl').value = track.url;
      soundsLibraryModal.style.display = 'none';
      showToast(`Selected: ${track.title}`);
    });

    soundsListContainer.appendChild(row);
  });
}

if (openSoundLibraryBtn) {
  openSoundLibraryBtn.addEventListener('click', () => {
    populateSoundsLibrary();
    soundsLibraryModal.style.display = 'flex';
  });
}

if (closeSoundsLibraryBtn) {
  closeSoundsLibraryBtn.addEventListener('click', () => {
    if (previewAudio) {
      previewAudio.pause();
      previewAudio = null;
    }
    soundsLibraryModal.style.display = 'none';
  });
}

if (resetSoundBtn) {
  resetSoundBtn.addEventListener('click', () => {
    selectedSound = { title: 'Original Audio', artist: '', url: '' };
    selectedSoundLabel.textContent = 'Original Audio — (Video Sound)';
    document.getElementById('reelSoundTitle').value = 'Original Audio';
    document.getElementById('reelSoundUrl').value = '';
    showToast('Reset to Original Audio');
  });
}

// ══════════════════════════════════════════════════
// SHARE MODAL OPERATIONS
// ══════════════════════════════════════════════════
function openShareModal(reel) {
  activeShareReel = reel;
  const reelUrl = `${window.location.origin}${window.location.pathname}#${reel.id}`;
  shareLinkInput.value = reelUrl;
  shareReelModal.style.display = 'flex';
}

function closeShareModal() {
  shareReelModal.style.display = 'none';
  activeShareReel = null;
}

if (closeShareModalBtn) closeShareModalBtn.addEventListener('click', closeShareModal);

if (shareCopyLinkBtn) {
  shareCopyLinkBtn.addEventListener('click', () => {
    if (shareLinkInput.value) {
      navigator.clipboard.writeText(shareLinkInput.value);
      showToast('CamShot link copied!');
      closeShareModal();
    }
  });
}

if (shareQuickCopyBtn) {
  shareQuickCopyBtn.addEventListener('click', () => {
    if (shareLinkInput.value) {
      navigator.clipboard.writeText(shareLinkInput.value);
      showToast('CamShot link copied!');
      closeShareModal();
    }
  });
}

if (shareNativeBtn) {
  shareNativeBtn.addEventListener('click', () => {
    if (navigator.share && activeShareReel) {
      navigator.share({
        title: `CamShot: @${activeShareReel.authorName}`,
        text: activeShareReel.caption || 'Watch this reel on CamShot!',
        url: shareLinkInput.value,
      }).catch(() => {});
      closeShareModal();
    } else {
      showToast('Sharing not supported in browser');
    }
  });
}

if (shareSendInChatBtn) {
  shareSendInChatBtn.addEventListener('click', () => {
    window.location.href = `chat.html?share_reel=${encodeURIComponent(shareLinkInput.value)}`;
  });
}

const shareWhatsAppBtn = document.getElementById('shareWhatsAppBtn');
if (shareWhatsAppBtn) {
  shareWhatsAppBtn.addEventListener('click', () => {
    const url = encodeURIComponent(shareLinkInput.value);
    const text = encodeURIComponent('Watch this video on CamShot: ');
    window.open(`https://api.whatsapp.com/send?text=${text}${url}`, '_blank');
    closeShareModal();
  });
}

const shareTelegramBtn = document.getElementById('shareTelegramBtn');
if (shareTelegramBtn) {
  shareTelegramBtn.addEventListener('click', () => {
    const url = encodeURIComponent(shareLinkInput.value);
    const text = encodeURIComponent('Watch this video on CamShot!');
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
    closeShareModal();
  });
}

const shareTwitterBtn = document.getElementById('shareTwitterBtn');
if (shareTwitterBtn) {
  shareTwitterBtn.addEventListener('click', () => {
    const url = encodeURIComponent(shareLinkInput.value);
    const text = encodeURIComponent('Check out this CamShot video!');
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
    closeShareModal();
  });
}

const cancelCommentReplyBtn = document.getElementById('cancelCommentReplyBtn');
if (cancelCommentReplyBtn) {
  cancelCommentReplyBtn.addEventListener('click', () => {
    const replyBarEl = document.getElementById('commentReplyBar');
    if (replyBarEl) replyBarEl.style.display = 'none';
    if (commentTextInput && commentTextInput.value.startsWith('@')) {
      commentTextInput.value = '';
    }
  });
}

if (shareDownloadBtn) {
  shareDownloadBtn.addEventListener('click', () => {
    if (activeShareReel && activeShareReel.videoUrl) {
      const a = document.createElement('a');
      a.href = activeShareReel.videoUrl;
      a.download = `CAMSHOT_${activeShareReel.id}.mp4`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast('Downloading reel video...');
      closeShareModal();
    }
  });
}

// ══════════════════════════════════════════════════
// ══════════════════════════════════════════════════
// COMMENTS DRAWER — HIGH CLASS & CAMSHOT SPEC
// ══════════════════════════════════════════════════
const commentInputUserAvatar = document.getElementById('commentInputUserAvatar');
const commentsQuickEmojis = document.getElementById('commentsQuickEmojis');
const commentLikedSet = new Set(JSON.parse(localStorage.getItem('camshot_liked_comments') || '[]'));

function formatCommentRelativeTime(timestamp) {
  if (!timestamp) return 'Just now';
  let ms = 0;
  if (typeof timestamp === 'number') ms = timestamp;
  else if (timestamp.toMillis) ms = timestamp.toMillis();
  else if (timestamp.toDate) ms = timestamp.toDate().getTime();
  else if (timestamp instanceof Date) ms = timestamp.getTime();
  else return 'Just now';

  const diffSec = Math.floor((Date.now() - ms) / 1000);
  if (diffSec < 45) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function renderCommentsList(seedComms, localComms, firestoreDocs) {
  const allComments = [];
  const seenKeys = new Set();
  const activeReelObj = allLoadedReels.find(r => r.id === activeReelId);
  const reelCreatorHandle = activeReelObj?.authorName || '';

  // 1. Seed comments
  seedComms.forEach((c, idx) => {
    const key = (c.authorName || '') + '|' + (c.text || '');
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      allComments.push({
        id: 'seed_' + idx,
        authorName: c.authorName || 'user',
        authorPic: c.authorPic || 'logo.jpg',
        text: c.text || '',
        createdAt: Date.now() - (idx + 1) * 3600000,
        likesCount: c.likesCount || Math.floor(Math.random() * 24) + 1
      });
    }
  });

  // 2. Firestore live comments
  firestoreDocs.forEach((docSnap) => {
    const c = docSnap.data();
    const key = (c.authorName || '') + '|' + (c.text || '');
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      allComments.push({
        id: docSnap.id,
        authorName: c.authorName || 'user',
        authorPic: c.authorPic || '/favicons/favicon.ico',
        text: c.text || '',
        createdAt: c.createdAt || Date.now(),
        likesCount: c.likesCount || 0
      });
    }
  });

  // 3. Local saved comments
  localComms.forEach((c) => {
    const key = (c.authorName || '') + '|' + (c.text || '');
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      allComments.push({
        id: c.id || ('local_' + Math.random()),
        authorName: c.authorName || 'user',
        authorPic: c.authorPic || '/favicons/favicon.ico',
        text: c.text || '',
        createdAt: c.createdAt || Date.now(),
        likesCount: c.likesCount || 0
      });
    }
  });

  if (allComments.length === 0) {
    commentsCountHeader.textContent = '0';
    commentsList.innerHTML = `
      <div class="comments-empty">
        <i class="fa-regular fa-comment-dots"></i>
        <p>No comments yet</p>
        <span>Be the first to share your thoughts on this CamShot reel!</span>
      </div>`;
    return;
  }

  commentsList.innerHTML = '';
  allComments.forEach((c) => {
    const item = document.createElement('div');
    item.className = 'comment-item';
    item.dataset.commentId = c.id;

    const isCreator = (c.authorName && c.authorName.toLowerCase() === reelCreatorHandle.toLowerCase());
    const isLiked = commentLikedSet.has(c.id);
    const likes = (c.likesCount || 0) + (isLiked ? 1 : 0);

    item.innerHTML = `
      <img src="${c.authorPic || 'logo.jpg'}" class="comment-avatar" alt="${escapeHtml(c.authorName)}" onerror="this.src='favicon.png'">
      <div class="comment-body">
        <div class="comment-header-row">
          <span class="comment-author">@${escapeHtml(c.authorName)}</span>
          ${isCreator ? '<span class="comment-creator-badge">Creator</span>' : ''}
          <span class="comment-time">${formatCommentRelativeTime(c.createdAt)}</span>
        </div>
        <div class="comment-text">${escapeHtml(c.text)}</div>
        <div class="comment-actions-row">
          <button type="button" class="comment-reply-btn" data-reply-to="${escapeHtml(c.authorName)}">Reply</button>
        </div>
      </div>
      <div class="comment-like-wrapper">
        <button type="button" class="comment-like-btn ${isLiked ? 'liked' : ''}" data-comment-id="${c.id}" title="Like comment">
          <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
        </button>
        <span class="comment-like-count">${likes > 0 ? formatNumber(likes) : ''}</span>
      </div>
    `;

    // Reply click handler
    const replyBtn = item.querySelector('.comment-reply-btn');
    if (replyBtn) {
      replyBtn.addEventListener('click', () => {
        if (commentTextInput) {
          commentTextInput.value = `@${c.authorName} `;
          const replyUserEl = document.getElementById('commentReplyUser');
          const replyBarEl = document.getElementById('commentReplyBar');
          if (replyUserEl && replyBarEl) {
            replyUserEl.textContent = `@${c.authorName}`;
            replyBarEl.style.display = 'flex';
          }
          commentTextInput.focus();
        }
      });
    }

    // Like comment toggle
    const likeBtn = item.querySelector('.comment-like-btn');
    const likeCountSpan = item.querySelector('.comment-like-count');
    if (likeBtn) {
      likeBtn.addEventListener('click', () => {
        const id = c.id;
        if (commentLikedSet.has(id)) {
          commentLikedSet.delete(id);
          likeBtn.classList.remove('liked');
          likeBtn.innerHTML = '<i class="fa-regular fa-heart"></i>';
          const newLikes = Math.max(0, (c.likesCount || 0));
          likeCountSpan.textContent = newLikes > 0 ? formatNumber(newLikes) : '';
        } else {
          commentLikedSet.add(id);
          likeBtn.classList.add('liked');
          likeBtn.innerHTML = '<i class="fa-solid fa-heart"></i>';
          const newLikes = (c.likesCount || 0) + 1;
          likeCountSpan.textContent = formatNumber(newLikes);
        }
        localStorage.setItem('camshot_liked_comments', JSON.stringify([...commentLikedSet]));
      });
    }

    commentsList.appendChild(item);
  });

  commentsCountHeader.textContent = String(allComments.length);
  commentsList.scrollTop = commentsList.scrollHeight;
}

function openCommentsDrawer(reelId) {
  activeReelId = reelId;
  commentsModal.style.display = 'flex';

  // Update composer avatar with current user profile
  const user = getEffectiveUser();
  if (commentInputUserAvatar) {
    commentInputUserAvatar.src = user.pic || 'favicon.png';
  }

  if (currentCommentUnsubscribe) {
    currentCommentUnsubscribe();
    currentCommentUnsubscribe = null;
  }

  const activeReelObj = allLoadedReels.find(r => r.id === reelId);
  const seedComms = (activeReelObj && activeReelObj.seedComments) ? activeReelObj.seedComments : [];
  const initialLocal = getLocalReelComments(reelId);

  // Render immediately with seed + local
  renderCommentsList(seedComms, initialLocal, []);

  try {
    const commentsQuery = query(
      collection(db, 'reels', reelId, 'comments'),
      orderBy('createdAt', 'asc')
    );

    currentCommentUnsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const freshLocal = getLocalReelComments(reelId);
      renderCommentsList(seedComms, freshLocal, snapshot.docs);
    }, (err) => {
      console.warn('Realtime comments subscription notice (using local/seed):', err);
    });
  } catch (err) {
    console.warn('Could not subscribe to comments Firestore:', err);
  }
}

function closeCommentsDrawer() {
  commentsModal.style.display = 'none';
  if (currentCommentUnsubscribe) {
    currentCommentUnsubscribe();
    currentCommentUnsubscribe = null;
  }
}

closeCommentsBtn.addEventListener('click', closeCommentsDrawer);
commentsBackdrop.addEventListener('click', closeCommentsDrawer);

// Quick 1-Tap Reaction Emojis
if (commentsQuickEmojis && commentTextInput) {
  commentsQuickEmojis.querySelectorAll('.quick-emoji-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const emoji = btn.dataset.emoji || btn.textContent.trim();
      commentTextInput.value += emoji;
      commentTextInput.focus();
    });
  });
}

commentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = commentTextInput.value.trim();
  if (!text || !activeReelId) return;

  const user = getEffectiveUser();
  commentTextInput.value = '';

  const localComment = {
    id: 'local_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    authorId: user.uid,
    authorName: user.username,
    authorPic: user.pic,
    text: text,
    createdAt: Date.now(),
    likesCount: 0
  };
  saveLocalReelComment(activeReelId, localComment);

  // Optimistically append comment item to list
  const emptyEl = commentsList.querySelector('.comment-empty, .comments-empty');
  if (emptyEl) emptyEl.remove();

  const activeReelObj = allLoadedReels.find(r => r.id === activeReelId);
  const isCreator = (user.username && user.username.toLowerCase() === (activeReelObj?.authorName || '').toLowerCase());

  const item = document.createElement('div');
  item.className = 'comment-item';
  item.dataset.commentId = localComment.id;
  item.innerHTML = `
    <img src="${user.pic || 'favicon.png'}" class="comment-avatar" alt="${escapeHtml(user.username)}" onerror="this.src='favicon.png'">
    <div class="comment-body">
      <div class="comment-header-row">
        <span class="comment-author">@${escapeHtml(user.username)}</span>
        ${isCreator ? '<span class="comment-creator-badge">Creator</span>' : ''}
        <span class="comment-time">Just now</span>
      </div>
      <div class="comment-text">${escapeHtml(text)}</div>
      <div class="comment-actions-row">
        <button type="button" class="comment-reply-btn" data-reply-to="${escapeHtml(user.username)}">Reply</button>
      </div>
    </div>
    <div class="comment-like-wrapper">
      <button type="button" class="comment-like-btn" data-comment-id="${localComment.id}" title="Like comment">
        <i class="fa-regular fa-heart"></i>
      </button>
      <span class="comment-like-count"></span>
    </div>
  `;
  commentsList.appendChild(item);
  commentsList.scrollTop = commentsList.scrollHeight;

  const curCount = parseInt(commentsCountHeader.textContent.replace(/[^0-9]/g, '') || '0', 10);
  commentsCountHeader.textContent = String(curCount + 1);

  // Update card comment counter if present in DOM
  const activeCard = document.querySelector(`.reel-card[data-reel-id="${activeReelId}"]`);
  if (activeCard) {
    const countEl = activeCard.querySelector('.reel-comment-count');
    if (countEl) {
      const c = parseInt(countEl.textContent.replace(/[^0-9]/g, '') || '0', 10);
      countEl.textContent = formatNumber(c + 1);
    }
  }

  showToast('Comment posted!');

  // Sync to Firestore in background
  try {
    await addDoc(collection(db, 'reels', activeReelId, 'comments'), {
      authorId: user.uid,
      authorName: user.username,
      authorPic: user.pic,
      text: text,
      createdAt: serverTimestamp(),
    });
    await safeIncrementReelCommentCount(activeReelId);
  } catch (err) {
    console.warn('Firestore comment synced locally:', err);
  }
});

// ══════════════════════════════════════════════════
// UPLOAD REEL MODAL & ISSUE 3: HIGHEST QUALITY HD/4K
// ══════════════════════════════════════════════════
// ══════════════════════════════════════════════════
// CAMSHOT CREATOR STUDIO PRO & REAL-TIME SIMULATOR
// ══════════════════════════════════════════════════
const floatingCreateReelBtn = document.getElementById('floatingCreateReelBtn');
const chronexAiGenCaptionBtn = document.getElementById('chronexAiGenCaptionBtn');
const personaCardGeneral = document.getElementById('personaCardGeneral');
const personaCardCustom = document.getElementById('personaCardCustom');
const personaImgGeneral = document.getElementById('personaImgGeneral');
const personaImgCustom = document.getElementById('personaImgCustom');
const personaHandleGeneral = document.getElementById('personaHandleGeneral');
const personaHandleCustom = document.getElementById('personaHandleCustom');
const simPreviewVideo = document.getElementById('simPreviewVideo');
const simPlaceholder = document.getElementById('simPlaceholder');
const simCreatorAvatar = document.getElementById('simCreatorAvatar');
const simCreatorHandle = document.getElementById('simCreatorHandle');
const simCaptionText = document.getElementById('simCaptionText');
const simSoundLabel = document.getElementById('simSoundLabel');
const studioThumbBox = document.getElementById('studioThumbBox');
const studioThumbPreviewImg = document.getElementById('studioThumbPreviewImg');

// Open / Close Studio
function openCreatorStudio() {
  if (!uploadReelModal) return;
  if (personaHandleGeneral) personaHandleGeneral.textContent = `@${myUsername}`;
  if (personaImgGeneral) personaImgGeneral.src = generalProfilePic || 'favicon.png';
  if (personaHandleCustom) personaHandleCustom.textContent = `@${myCreatorName || myUsername}`;
  if (personaImgCustom) personaImgCustom.src = customReelsAvatar || generalProfilePic || 'favicon.png';

  syncSimulatorPreview();
  uploadReelModal.style.display = 'flex';
}

function closeCreatorStudio() {
  stopCameraStream();
  if (uploadReelModal) uploadReelModal.style.display = 'none';
  resetUploadForm();
}

if (openUploadModalBtn) openUploadModalBtn.addEventListener('click', openCreatorStudio);
if (floatingCreateReelBtn) floatingCreateReelBtn.addEventListener('click', openCreatorStudio);
if (closeUploadModalBtn) closeUploadModalBtn.addEventListener('click', closeCreatorStudio);
if (cancelUploadBtn) cancelUploadBtn.addEventListener('click', () => {
  // BUG FIX: Actually abort in-progress upload before closing
  if (currentUploadXHR) {
    currentUploadXHR.abort();
    currentUploadXHR = null;
    showToast('Upload cancelled');
  }
  closeCreatorStudio();
});

// Real-Time Simulator Preview Sync
function syncSimulatorPreview() {
  if (simCaptionText && reelCaptionInput) {
    simCaptionText.textContent = reelCaptionInput.value.trim() || 'Watch my new reel! #nexchat #cyberpunk';
  }
  if (simSoundLabel) {
    simSoundLabel.textContent = selectedSound?.title ? `${selectedSound.title}${selectedSound.artist ? ' — ' + selectedSound.artist : ''}` : `Original Audio — @${myUsername}`;
  }

  const selectedPersona = document.querySelector('input[name="studioPersonaRadio"]:checked')?.value || 'general';
  if (selectedPersona === 'custom') {
    if (simCreatorAvatar) simCreatorAvatar.src = customReelsAvatar || generalProfilePic || 'favicon.png';
    if (simCreatorHandle) simCreatorHandle.textContent = `@${myCreatorName || myUsername}`;
  } else {
    if (simCreatorAvatar) simCreatorAvatar.src = generalProfilePic || 'favicon.png';
    if (simCreatorHandle) simCreatorHandle.textContent = `@${myUsername}`;
  }
}

// Persona selection cards
if (personaCardGeneral) {
  personaCardGeneral.addEventListener('click', () => {
    const radio = personaCardGeneral.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;
    personaCardGeneral.classList.add('active');
    if (personaCardCustom) personaCardCustom.classList.remove('active');
    syncSimulatorPreview();
  });
}

if (personaCardCustom) {
  personaCardCustom.addEventListener('click', () => {
    const radio = personaCardCustom.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;
    personaCardCustom.classList.add('active');
    if (personaCardGeneral) personaCardGeneral.classList.remove('active');
    syncSimulatorPreview();
  });
}

// ChronEX AI Viral Caption Generator
const VIRAL_CYBER_CAPTIONS = [
  "Exploring Night City procedural shaders in Ultra HD 4K. Lossless 60FPS stream on NEXCHAT! #nexchat #cyberpunk #gaming #4k60fps",
  "Dropping high-velocity Cyberpunk telemetry with ChronEX AI companion #nexchat #tech #viral #futuristic",
  "When the neural audio drop aligns with 4K raytracing keyframes #gaming #music #cyberpunk #nexchat",
  "Zero-lag streaming protocol engaged. Pure black OLED cyber aesthetic in action #tech #scifi #viral #4k",
  "Procedural world generation running live on the NEX engine. Rate this setup 1-10! #gaming #cyberpunk #nexchat",
];

if (chronexAiGenCaptionBtn) {
  chronexAiGenCaptionBtn.addEventListener('click', () => {
    const randomCaption = VIRAL_CYBER_CAPTIONS[Math.floor(Math.random() * VIRAL_CYBER_CAPTIONS.length)];
    if (reelCaptionInput) {
      reelCaptionInput.value = randomCaption;
      if (reelCaptionCounter) reelCaptionCounter.textContent = `${randomCaption.length}/300`;
      syncSimulatorPreview();
      showToast('ChronEX AI generated viral caption!');
    }
  });
}

reelDropzone.addEventListener('click', () => {
  reelVideoInput.click();
});

// BUG FIX: Drag & drop support for video files
reelDropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
  reelDropzone.classList.add('drag-over');
});

reelDropzone.addEventListener('dragleave', (e) => {
  e.preventDefault();
  e.stopPropagation();
  reelDropzone.classList.remove('drag-over');
});

reelDropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
  reelDropzone.classList.remove('drag-over');
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    const file = files[0];
    if (validateVideoFile(file)) {
      // Trigger the same handler as file input change
      reelVideoInput.files = e.dataTransfer.files;
      reelVideoInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
});

// ══════════════════════════════════════════════════
// CAMSHOT LIVE CAMERA STUDIO CONTROLLER
// ══════════════════════════════════════════════════
const sourceUploadFileBtn = document.getElementById('sourceUploadFileBtn');
const sourceLiveCamBtn = document.getElementById('sourceLiveCamBtn');
const liveCameraStudioStage = document.getElementById('liveCameraStudioStage');
const liveCamStreamVideo = document.getElementById('liveCamStreamVideo');
const liveCamTimerBadge = document.getElementById('liveCamTimerBadge');
const liveCamTimerText = document.getElementById('liveCamTimerText');
const flipLiveCameraBtn = document.getElementById('flipLiveCameraBtn');
const startLiveRecordBtn = document.getElementById('startLiveRecordBtn');
const stopLiveRecordBtn = document.getElementById('stopLiveRecordBtn');
const enablePollStickerCheckbox = document.getElementById('enablePollStickerCheckbox');
const pollInputsContainer = document.getElementById('pollInputsContainer');
const enableBountyCheckbox = document.getElementById('enableBountyCheckbox');

let liveCamStream = null;
let liveMediaRecorder = null;
let recordedCamChunks = [];
let liveRecordTimerInterval = null;
let liveRecordSeconds = 0;
let currentFacingMode = 'user';
let currentLiveShader = 'normal';

function applyLiveShaderToVideo(shaderName) {
  currentLiveShader = shaderName;
  if (!liveCamStreamVideo) return;
  liveCamStreamVideo.className = '';
  if (shaderName === 'matrix') {
    liveCamStreamVideo.classList.add('video-shader-matrix');
  } else if (shaderName === 'cyber') {
    liveCamStreamVideo.classList.add('video-shader-cyber');
  } else if (shaderName === 'gold') {
    liveCamStreamVideo.classList.add('video-shader-gold');
  } else if (shaderName === 'noir') {
    liveCamStreamVideo.classList.add('video-shader-noir');
  }
}

async function startCameraStream() {
  stopCameraStream();
  try {
    const constraints = {
      video: {
        facingMode: currentFacingMode,
        width: { ideal: 1080 },
        height: { ideal: 1920 }
      },
      audio: true
    };
    try {
      liveCamStream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (audioErr) {
      console.warn('Audio permission denied or unavailable, falling back to video only:', audioErr);
      liveCamStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: currentFacingMode },
        audio: false
      });
    }

    if (liveCamStreamVideo) {
      liveCamStreamVideo.srcObject = liveCamStream;
      applyLiveShaderToVideo(currentLiveShader);
      await liveCamStreamVideo.play().catch(() => {});
    }
  } catch (err) {
    console.error('Camera stream access failed:', err);
    showToast('Camera access denied or unavailable: ' + (err.message || 'Error'));
  }
}

function stopCameraStream() {
  if (liveRecordTimerInterval) {
    clearInterval(liveRecordTimerInterval);
    liveRecordTimerInterval = null;
  }
  if (liveMediaRecorder && liveMediaRecorder.state !== 'inactive') {
    try { liveMediaRecorder.stop(); } catch (_) {}
  }
  if (liveCamStream) {
    liveCamStream.getTracks().forEach(track => {
      try { track.stop(); } catch (_) {}
    });
    liveCamStream = null;
  }
  if (liveCamStreamVideo) {
    liveCamStreamVideo.srcObject = null;
  }
  if (liveCamTimerBadge) liveCamTimerBadge.style.display = 'none';
  if (startLiveRecordBtn) startLiveRecordBtn.style.display = 'inline-flex';
  if (stopLiveRecordBtn) stopLiveRecordBtn.style.display = 'none';
}

async function startLiveRecord() {
  if (!liveCamStream || !liveCamStream.active) {
    await startCameraStream();
  }
  if (!liveCamStream) return;

  recordedCamChunks = [];
  let mimeType = 'video/webm';
  if (typeof MediaRecorder !== 'undefined') {
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
      mimeType = 'video/webm;codecs=vp9,opus';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
      mimeType = 'video/webm;codecs=vp8,opus';
    } else if (MediaRecorder.isTypeSupported('video/webm')) {
      mimeType = 'video/webm';
    } else if (MediaRecorder.isTypeSupported('video/mp4')) {
      mimeType = 'video/mp4';
    }
  } else {
    showToast('MediaRecorder not supported on this browser');
    return;
  }

  try {
    liveMediaRecorder = new MediaRecorder(liveCamStream, { mimeType });
  } catch (e) {
    liveMediaRecorder = new MediaRecorder(liveCamStream);
  }

  liveMediaRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      recordedCamChunks.push(event.data);
    }
  };

  liveMediaRecorder.onstop = handleLiveRecordStop;
  liveMediaRecorder.start(250);

  // UI state
  liveRecordSeconds = 0;
  if (liveCamTimerText) liveCamTimerText.textContent = '00:00';
  if (liveCamTimerBadge) liveCamTimerBadge.style.display = 'inline-flex';
  if (startLiveRecordBtn) startLiveRecordBtn.style.display = 'none';
  if (stopLiveRecordBtn) stopLiveRecordBtn.style.display = 'inline-flex';

  playLuxuryPopSound();
  showToast('🔴 Recording live CamShot...');

  liveRecordTimerInterval = setInterval(() => {
    liveRecordSeconds++;
    const mins = Math.floor(liveRecordSeconds / 60);
    const secs = liveRecordSeconds % 60;
    if (liveCamTimerText) {
      liveCamTimerText.textContent = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    if (liveRecordSeconds >= 90) {
      showToast('90s CamShot limit reached!');
      stopLiveRecord();
    }
  }, 1000);
}

function stopLiveRecord() {
  if (liveRecordTimerInterval) {
    clearInterval(liveRecordTimerInterval);
    liveRecordTimerInterval = null;
  }
  if (liveCamTimerBadge) liveCamTimerBadge.style.display = 'none';
  if (startLiveRecordBtn) startLiveRecordBtn.style.display = 'inline-flex';
  if (stopLiveRecordBtn) stopLiveRecordBtn.style.display = 'none';

  if (liveMediaRecorder && liveMediaRecorder.state !== 'inactive') {
    liveMediaRecorder.stop();
  }
}

async function handleLiveRecordStop() {
  if (recordedCamChunks.length === 0) {
    showToast('No video recorded');
    return;
  }

  const mimeType = liveMediaRecorder?.mimeType || 'video/webm';
  const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
  const recordedBlob = new Blob(recordedCamChunks, { type: mimeType });
  const recordedFile = new File([recordedBlob], `camshot_studio_${Date.now()}.${ext}`, { type: mimeType });

  selectedReelFile = recordedFile;
  const videoObjUrl = URL.createObjectURL(recordedBlob);

  reelPreviewVideo.src = videoObjUrl;
  reelPreviewContainer.style.display = 'flex';
  reelDropzonePrompt.style.display = 'none';

  if (simPreviewVideo) {
    simPreviewVideo.src = videoObjUrl;
    simPreviewVideo.style.display = 'block';
    simPreviewVideo.play().catch(() => {});
  }
  if (simPlaceholder) simPlaceholder.style.display = 'none';

  const mins = Math.floor(liveRecordSeconds / 60);
  const secs = liveRecordSeconds % 60;
  reelDurationBadge.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  try {
    const thumbData = await generateVideoThumbnail(recordedFile, 0.2);
    if (thumbData) {
      selectedReelThumbnailBlob = thumbData.blob;
      selectedReelThumbnailDataUrl = thumbData.dataUrl;
      detectedVideoWidth = thumbData.width;
      detectedVideoHeight = thumbData.height;

      if (studioThumbPreviewImg) studioThumbPreviewImg.src = thumbData.dataUrl;
      if (studioThumbBox) studioThumbBox.style.display = 'flex';

      const reelHdSpecText = document.getElementById('reelHdSpecText');
      const reelHdBadge = document.getElementById('reelHdBadge');
      if (reelHdBadge && reelHdSpecText) {
        reelHdSpecText.textContent = `${thumbData.width}x${thumbData.height} Live HD Studio • 60 FPS`;
        reelHdBadge.style.display = 'flex';
      }
      updateQualityPillsForResolution(thumbData.width, thumbData.height);
    }
  } catch (thumbErr) {
    console.warn('Live thumbnail generation notice:', thumbErr);
  }

  // Stop camera hardware stream so user webcam light turns off
  stopCameraStream();

  // Switch UI view back to preview
  if (sourceUploadFileBtn && sourceLiveCamBtn) {
    sourceUploadFileBtn.classList.add('active');
    sourceUploadFileBtn.style.background = 'rgba(232, 184, 75, 0.15)';
    sourceUploadFileBtn.style.borderColor = 'var(--cs-gold)';
    sourceUploadFileBtn.style.color = '#fff';

    sourceLiveCamBtn.classList.remove('active');
    sourceLiveCamBtn.style.background = 'rgba(255, 255, 255, 0.05)';
    sourceLiveCamBtn.style.borderColor = 'rgba(255, 255, 255, 0.15)';
    sourceLiveCamBtn.style.color = '#a1a1aa';
  }
  reelDropzone.style.display = 'block';
  liveCameraStudioStage.style.display = 'none';

  playLuxuryPopSound();
  showToast('🎉 Live CamShot captured! Ready to publish.');
}

// Source Mode Switcher Listeners
if (sourceUploadFileBtn) {
  sourceUploadFileBtn.addEventListener('click', () => {
    sourceUploadFileBtn.classList.add('active');
    sourceUploadFileBtn.style.background = 'rgba(232, 184, 75, 0.15)';
    sourceUploadFileBtn.style.borderColor = 'var(--cs-gold)';
    sourceUploadFileBtn.style.color = '#fff';

    if (sourceLiveCamBtn) {
      sourceLiveCamBtn.classList.remove('active');
      sourceLiveCamBtn.style.background = 'rgba(255, 255, 255, 0.05)';
      sourceLiveCamBtn.style.borderColor = 'rgba(255, 255, 255, 0.15)';
      sourceLiveCamBtn.style.color = '#a1a1aa';
    }

    reelDropzone.style.display = 'block';
    if (liveCameraStudioStage) liveCameraStudioStage.style.display = 'none';
    stopCameraStream();
  });
}

if (sourceLiveCamBtn) {
  sourceLiveCamBtn.addEventListener('click', () => {
    sourceLiveCamBtn.classList.add('active');
    sourceLiveCamBtn.style.background = 'rgba(0, 255, 102, 0.15)';
    sourceLiveCamBtn.style.borderColor = '#00ff66';
    sourceLiveCamBtn.style.color = '#fff';

    if (sourceUploadFileBtn) {
      sourceUploadFileBtn.classList.remove('active');
      sourceUploadFileBtn.style.background = 'rgba(255, 255, 255, 0.05)';
      sourceUploadFileBtn.style.borderColor = 'rgba(255, 255, 255, 0.15)';
      sourceUploadFileBtn.style.color = '#a1a1aa';
    }

    reelDropzone.style.display = 'none';
    if (liveCameraStudioStage) liveCameraStudioStage.style.display = 'flex';
    startCameraStream();
  });
}

// Live Camera Shaders
document.querySelectorAll('.cam-shader-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.cam-shader-pill').forEach(p => {
      p.classList.remove('active');
      p.style.background = 'rgba(255,255,255,0.05)';
    });
    pill.classList.add('active');
    pill.style.background = 'rgba(255,255,255,0.25)';
    const shader = pill.dataset.shader || 'normal';
    applyLiveShaderToVideo(shader);
    showToast(`Color Grade: ${shader.toUpperCase()}`);
  });
});

// Live Camera Flip
if (flipLiveCameraBtn) {
  flipLiveCameraBtn.addEventListener('click', () => {
    currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    startCameraStream();
    showToast(`Camera: ${currentFacingMode === 'user' ? 'Front' : 'Back'}`);
  });
}

// Live Record Trigger Buttons
if (startLiveRecordBtn) {
  startLiveRecordBtn.addEventListener('click', startLiveRecord);
}
if (stopLiveRecordBtn) {
  stopLiveRecordBtn.addEventListener('click', stopLiveRecord);
}

// Interactive Poll Sticker Toggle
if (enablePollStickerCheckbox) {
  enablePollStickerCheckbox.addEventListener('change', () => {
    if (pollInputsContainer) {
      pollInputsContainer.style.display = enablePollStickerCheckbox.checked ? 'flex' : 'none';
    }
  });
}

// BUG FIX: File validation (max size 250MB, valid video type)
const MAX_VIDEO_SIZE_BYTES = 250 * 1024 * 1024; // 250MB
const VALID_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v', 'video/avi'];

function validateVideoFile(file) {
  if (!file) return false;

  // Type check
  if (!file.type.startsWith('video/') && !VALID_VIDEO_TYPES.includes(file.type)) {
    showToast('Invalid file type. Please select MP4, WebM, or MOV.');
    return false;
  }

  // Size check
  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    showToast(`File too large (${sizeMb} MB). Maximum is 250 MB.`);
    return false;
  }

  return true;
}

// Character counter for Caption
if (reelCaptionInput && reelCaptionCounter) {
  reelCaptionInput.addEventListener('input', () => {
    const len = reelCaptionInput.value.length;
    reelCaptionCounter.textContent = `${len}/300`;
    syncSimulatorPreview();
  });
}

// Quick Hashtag Pills
document.querySelectorAll('.hashtag-pill').forEach((pill) => {
  pill.addEventListener('click', () => {
    const tag = pill.dataset.tag;
    if (!reelCaptionInput.value.includes(tag)) {
      reelCaptionInput.value = (reelCaptionInput.value ? reelCaptionInput.value + ' ' : '') + tag;
      if (reelCaptionCounter) reelCaptionCounter.textContent = `${reelCaptionInput.value.length}/300`;
      syncSimulatorPreview();
    }
  });
});

// Quality Selector Pills
let selectedQualityMode = 'fhd';
document.querySelectorAll('.quality-pill').forEach((btn) => {
  btn.addEventListener('click', () => {
    // BUG FIX: Don't allow selecting disabled (upscale) quality pills
    if (btn.classList.contains('disabled')) return;
    document.querySelectorAll('.quality-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedQualityMode = btn.dataset.quality;
  });
});

// BUG FIX: Auto-detect resolution and gate quality pills to prevent upscaling
function updateQualityPillsForResolution(width, height) {
  const qualityPills = document.querySelectorAll('.quality-pill');
  const maxDim = Math.max(width, height);

  qualityPills.forEach((pill) => {
    const q = pill.dataset.quality;
    // Remove any existing warning labels
    const existingWarn = pill.querySelector('.quality-warning');
    if (existingWarn) existingWarn.remove();

    pill.classList.remove('disabled');

    if (q === '4k' && maxDim < 2160) {
      pill.classList.add('disabled');
      pill.classList.remove('active');
      const warn = document.createElement('span');
      warn.className = 'quality-warning';
      warn.textContent = `Source is ${maxDim >= 1080 ? '1080p' : maxDim >= 720 ? '720p' : maxDim + 'p'} — upscaling won't improve quality`;
      pill.appendChild(warn);
    }

    if (q === 'fhd' && maxDim < 1080) {
      pill.classList.add('disabled');
      pill.classList.remove('active');
      const warn = document.createElement('span');
      warn.className = 'quality-warning';
      warn.textContent = `Source is ${maxDim >= 720 ? '720p' : maxDim + 'p'}`;
      pill.appendChild(warn);
    }
  });

  // BUG FIX: Auto-select best MATCHING quality based on source resolution
  autoSelectBestQuality(maxDim);
}

// Auto-select the highest quality that matches the source resolution
function autoSelectBestQuality(maxDim) {
  const qualityPills = document.querySelectorAll('.quality-pill');
  const keepOriginal = document.getElementById('keepOriginalQuality');

  // Determine best matching quality
  let bestQuality = 'hd'; // default fallback
  if (maxDim >= 2160) bestQuality = '4k';
  else if (maxDim >= 1080) bestQuality = 'fhd';
  else bestQuality = 'hd';

  // If "Upload in highest available quality" is checked, auto-select
  if (keepOriginal && keepOriginal.checked) {
    qualityPills.forEach(p => p.classList.remove('active'));
    const targetPill = [...qualityPills].find(p => p.dataset.quality === bestQuality);
    if (targetPill && !targetPill.classList.contains('disabled')) {
      targetPill.classList.add('active');
      selectedQualityMode = bestQuality;
    } else {
      // Fallback: select the highest non-disabled pill
      const available = [...qualityPills].filter(p => !p.classList.contains('disabled'));
      if (available.length > 0) {
        qualityPills.forEach(p => p.classList.remove('active'));
        available[available.length - 1].classList.add('active');
        selectedQualityMode = available[available.length - 1].dataset.quality;
      }
    }
  }
}

// BUG FIX: "Upload in highest available quality" checkbox auto-selects best
const keepOriginalQualityCb = document.getElementById('keepOriginalQuality');
if (keepOriginalQualityCb) {
  keepOriginalQualityCb.addEventListener('change', () => {
    if (detectedVideoHeight > 0 || detectedVideoWidth > 0) {
      autoSelectBestQuality(Math.max(detectedVideoWidth, detectedVideoHeight));
    }
  });
}

reelVideoInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // BUG FIX: Validate file type and size before processing
  if (!validateVideoFile(file)) {
    reelVideoInput.value = '';
    return;
  }

  selectedReelFile = file;
  reelDropzonePrompt.style.display = 'none';
  reelPreviewContainer.style.display = 'flex';
  const videoObjUrl = URL.createObjectURL(file);
  reelPreviewVideo.src = videoObjUrl;

  // Real-time live simulator playback
  if (simPreviewVideo) {
    simPreviewVideo.src = videoObjUrl;
    simPreviewVideo.style.display = 'block';
    simPreviewVideo.play().catch(() => {});
  }
  if (simPlaceholder) {
    simPlaceholder.style.display = 'none';
  }

  const duration = await getVideoDuration(file);
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  reelDurationBadge.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  // Analyze video for HD resolution and generate instant high-res poster thumbnail
  const reelHdBadge = document.getElementById('reelHdBadge');
  const reelHdSpecText = document.getElementById('reelHdSpecText');
  if (reelHdBadge && reelHdSpecText) {
    reelHdSpecText.textContent = 'Analyzing HD Stream...';
    reelHdBadge.style.display = 'flex';
  }

  try {
    const thumbData = await generateVideoThumbnail(file, 1.0);
    if (thumbData) {
      selectedReelThumbnailBlob = thumbData.blob;
      selectedReelThumbnailDataUrl = thumbData.dataUrl;

      // BUG FIX: Store detected resolution for quality gating
      detectedVideoWidth = thumbData.width;
      detectedVideoHeight = thumbData.height;

      const resCategory = thumbData.width >= 3800 ? '4K Ultra HD' : (thumbData.width >= 1000 ? '1080p FHD' : '720p HD');
      if (reelHdSpecText) {
        reelHdSpecText.textContent = `${thumbData.width}x${thumbData.height} ${resCategory} • Lossless H.264`;
      }
      if (studioThumbPreviewImg) {
        studioThumbPreviewImg.src = thumbData.dataUrl;
      }
      if (studioThumbBox) {
        studioThumbBox.style.display = 'flex';
      }

      // BUG FIX: Update quality pills based on detected source resolution
      updateQualityPillsForResolution(thumbData.width, thumbData.height);

      showToast(`Analyzed: ${resCategory} (${thumbData.width}x${thumbData.height})`);
    }
  } catch (err) {
    console.warn('Thumbnail generation error:', err);
  }

  if (duration > 90) {
    showToast('Notice: Short CamShots are ideally under 90s');
  }
});

removeVideoBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  resetVideoPicker();
});

function resetVideoPicker() {
  selectedReelFile = null;
  selectedReelThumbnailBlob = null;
  selectedReelThumbnailDataUrl = null;
  reelVideoInput.value = '';
  reelPreviewVideo.pause();
  reelPreviewVideo.src = '';
  reelPreviewContainer.style.display = 'none';

  // BUG FIX: Reset detected resolution and quality pill states
  detectedVideoWidth = 0;
  detectedVideoHeight = 0;
  document.querySelectorAll('.quality-pill').forEach((pill) => {
    pill.classList.remove('disabled');
    const warn = pill.querySelector('.quality-warning');
    if (warn) warn.remove();
  });
  if (simPreviewVideo) {
    simPreviewVideo.pause();
    simPreviewVideo.src = '';
    simPreviewVideo.style.display = 'none';
  }
  if (simPlaceholder) {
    simPlaceholder.style.display = 'flex';
  }
  if (studioThumbBox) {
    studioThumbBox.style.display = 'none';
  }
  const reelHdBadge = document.getElementById('reelHdBadge');
  if (reelHdBadge) reelHdBadge.style.display = 'none';
  reelDropzonePrompt.style.display = 'block';
}

function resetUploadForm() {
  resetVideoPicker();
  uploadReelForm.reset();
  if (reelCaptionCounter) reelCaptionCounter.textContent = '0/300';
  reelUploadProgressWrapper.style.display = 'none';
  reelProgressBarFill.style.width = '0%';
  selectedSound = { title: 'Original Audio', artist: '', url: '' };
  selectedSoundLabel.textContent = 'Original Audio — (Video Sound)';
  submitReelBtn.disabled = false;
  submitReelBtn.innerHTML = '<i class="fa-solid fa-rocket"></i> Publish Reel to NEX Stream';

  // BUG FIX: Reset upload success state and progress labels
  const successState = document.getElementById('uploadSuccessState');
  if (successState) successState.style.display = 'none';
  const etaLabel = document.getElementById('reelProgressEta');
  if (etaLabel) etaLabel.textContent = '';
  const phaseText = document.getElementById('uploadPhaseText');
  if (phaseText) phaseText.textContent = 'Phase 1: Uploading video...';
  const progressLabel = document.getElementById('reelProgressLabel');
  if (progressLabel) progressLabel.textContent = 'Uploading your reel...';

  // BUG FIX: Abort any in-progress upload
  if (currentUploadXHR) {
    currentUploadXHR.abort();
    currentUploadXHR = null;
  }

  // Reset overlay toggles
  const pollCb = document.getElementById('enablePollStickerCheckbox');
  if (pollCb) pollCb.checked = false;
  const pollInputs = document.getElementById('pollInputsContainer');
  if (pollInputs) pollInputs.style.display = 'none';
  const bountyCb = document.getElementById('enableBountyCheckbox');
  if (bountyCb) bountyCb.checked = false;

  // Reset live camera stream
  stopCameraStream();

  // Reset source mode to Upload File
  const srcUploadBtn = document.getElementById('sourceUploadFileBtn');
  const srcCamBtn = document.getElementById('sourceLiveCamBtn');
  const dropzoneEl = document.getElementById('reelDropzone');
  const liveStageEl = document.getElementById('liveCameraStudioStage');
  if (srcUploadBtn && srcCamBtn) {
    srcUploadBtn.classList.add('active');
    srcUploadBtn.style.background = 'rgba(232, 184, 75, 0.15)';
    srcUploadBtn.style.borderColor = 'var(--cs-gold)';
    srcUploadBtn.style.color = '#fff';

    srcCamBtn.classList.remove('active');
    srcCamBtn.style.background = 'rgba(255, 255, 255, 0.05)';
    srcCamBtn.style.borderColor = 'rgba(255, 255, 255, 0.15)';
    srcCamBtn.style.color = '#a1a1aa';
  }
  if (dropzoneEl) dropzoneEl.style.display = 'block';
  if (liveStageEl) liveStageEl.style.display = 'none';

  syncSimulatorPreview();
}

// Publish Reel — BUG FIX: Proper 2-phase upload progress + ETA + Cancel
uploadReelForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!selectedReelFile) {
    showToast('Please select a video file first');
    return;
  }

  // BUG FIX: Validate that identity is selected
  const chosenPersona = document.querySelector('input[name="studioPersonaRadio"]:checked')?.value || 'general';
  if (!chosenPersona) {
    showToast('Please select a publishing identity');
    return;
  }

  const caption = document.getElementById('reelCaptionInput').value.trim() || 'Testing NEX vault';
  const soundTrackName = document.getElementById('reelSoundTitle').value || `Original Audio — @${myUsername}`;
  const customAudioUrl = document.getElementById('reelSoundUrl').value || '';

  // Determine Bitrate and Quality based on user selection
  let bitRate = '8000k';
  if (selectedQualityMode === '4k') {
    bitRate = '14000k';
  } else if (selectedQualityMode === 'hd') {
    bitRate = '5000k';
  }

  // BUG FIX: Determine publishing identity correctly
  const publishAuthorName = (chosenPersona === 'custom' && myCreatorName) ? myCreatorName : myUsername;
  const publishAuthorPic = (chosenPersona === 'custom' && customReelsAvatar) ? customReelsAvatar : (generalProfilePic || myProfilePic || 'favicon.png');

  submitReelBtn.disabled = true;
  submitReelBtn.innerHTML = '<div class="cyber-spinner" style="width:16px;height:16px;border-width:2px;"></div> Uploading...';
  reelUploadProgressWrapper.style.display = 'flex';

  // BUG FIX: Phase 1 — Real upload progress with ETA
  const phaseText = document.getElementById('uploadPhaseText');
  const phaseDot = document.getElementById('uploadPhaseDot');
  const progressLabel = document.getElementById('reelProgressLabel');
  const etaLabel = document.getElementById('reelProgressEta');
  const successState = document.getElementById('uploadSuccessState');

  if (phaseText) phaseText.textContent = 'Phase 1: Uploading video...';
  if (phaseDot) { phaseDot.className = 'phase-dot'; }
  if (progressLabel) progressLabel.textContent = 'Uploading your reel...';
  if (etaLabel) etaLabel.textContent = '';
  if (successState) successState.style.display = 'none';

  uploadStartTime = Date.now();

  try {
    // Phase 1: Upload with true upload progress
    const effectiveUID = auth.currentUser?.uid || myUID || 'anon';
    const uploadResult = await uploadReelVideo(selectedReelFile, {
      uid: effectiveUID,
      quality: 'auto:best',
      fetchFormat: 'auto',
      videoCodec: 'h264',
      bitRate: bitRate,
      onXHRCreated: (xhr) => { currentUploadXHR = xhr; },
      onProgress: (percent, msg, vaultName) => {
        reelProgressBarFill.style.width = `${percent}%`;
        reelProgressPercent.textContent = `${percent}%`;
        reelProgressVault.textContent = `Uploading (${msg})`;
        if (progressLabel) progressLabel.textContent = `Uploading your reel... ${percent}%`;

        if (percent > 0 && percent < 100 && uploadStartTime) {
          const elapsed = (Date.now() - uploadStartTime) / 1000;
          const totalEstimate = (elapsed / percent) * 100;
          const remaining = Math.max(0, totalEstimate - elapsed);
          if (remaining > 60) {
            if (etaLabel) etaLabel.textContent = `~${Math.ceil(remaining / 60)} min remaining`;
          } else if (remaining > 0) {
            if (etaLabel) etaLabel.textContent = `~${Math.ceil(remaining)}s remaining`;
          }
        }
      },
    });

    // Phase 1 complete — transition to Phase 2
    reelProgressBarFill.style.width = '100%';
    reelProgressPercent.textContent = '100%';
    if (phaseText) phaseText.textContent = 'Phase 2: Processing...';
    if (progressLabel) progressLabel.textContent = 'Processing uploaded video...';
    if (phaseDot) { phaseDot.className = 'phase-dot phase-done'; }
    if (etaLabel) etaLabel.textContent = '';
    reelProgressVault.textContent = 'Server-side optimization in progress...';

    console.log('[CamShot] HD Video Saved to Vault:', uploadResult.vault);

    // Phase 2: Upload thumbnail
    let thumbnailUrl = '';
    if (selectedReelThumbnailBlob) {
      try {
        reelProgressVault.textContent = 'Uploading poster thumbnail...';
        const thumbUpload = await uploadImageToCloudinary(selectedReelThumbnailBlob, {
          folder: 'nexchat-reels-posters',
        });
        if (thumbUpload && (thumbUpload.secure_url || thumbUpload.url)) {
          thumbnailUrl = thumbUpload.secure_url || thumbUpload.url;
        }
      } catch (tErr) {
        console.warn('Thumbnail upload warning:', tErr);
      }
    }

    // Phase 3: Commit to CamShot stream
    reelProgressVault.textContent = 'Publishing to CamShot stream...';
    const realAuthorId = auth.currentUser?.uid || myUID || 'user_anon';
    const reelData = {
      videoUrl: uploadResult.url,
      thumbnailUrl: thumbnailUrl || '',
      rawBlobUrl: uploadResult.rawBlobUrl || uploadResult.url,
      pathname: uploadResult.pathname || '',
      vault: uploadResult.vault || 'Cloudinary Vault Pool',
      vaultIndex: uploadResult.vaultIndex ?? 0,
      access: 'public',
      duration: uploadResult.duration || 0,
      qualityMode: selectedQualityMode,
      caption: caption,
      sound: soundTrackName,
      audioUrl: customAudioUrl,
      authorId: realAuthorId,
      authorName: publishAuthorName,
      authorPic: publishAuthorPic,
      publishingIdentity: chosenPersona,
      likes: [],
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      views: 1,
    };

    // Extract interactive poll sticker and token bounty if creator enabled them
    const enablePollSticker = document.getElementById('enablePollStickerCheckbox')?.checked;
    const pollQ = document.getElementById('pollQuestionInput')?.value.trim();
    const pollO1 = document.getElementById('pollOption1Input')?.value.trim();
    const pollO2 = document.getElementById('pollOption2Input')?.value.trim();
    if (enablePollSticker && pollQ) {
      reelData.poll = {
        question: pollQ,
        options: [
          { text: pollO1 || '🔥 Insane', votes: 0 },
          { text: pollO2 || '⚡ Mid', votes: 0 },
        ],
      };
    }

    const enableBounty = document.getElementById('enableBountyCheckbox')?.checked;
    if (enableBounty) {
      reelData.hasBounty = true;
      reelData.bountyAmount = 10;
    }

    let publishedReelId = null;
    let committedSuccessfully = false;

    // Dual-strategy commit: 1. Firestore (if authenticated), 2. Serverless ingestion API fallback
    if (auth.currentUser && realAuthorId === auth.currentUser.uid) {
      try {
        const reelDocRef = await addDoc(collection(db, 'reels'), {
          ...reelData,
          createdAt: serverTimestamp(),
        });
        publishedReelId = reelDocRef.id;
        committedSuccessfully = true;
        console.log('[CamShot] Saved reel to Firestore:', publishedReelId);
      } catch (fErr) {
        console.warn('[CamShot] Direct Firestore write bypassed:', fErr.message);
      }
    }

    if (!committedSuccessfully) {
      try {
        const ingestRes = await fetch('/api/reels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reelData),
        });
        if (ingestRes.ok) {
          const ingestJson = await ingestRes.json();
          publishedReelId = ingestJson.id;
          committedSuccessfully = true;
          console.log('[CamShot] Ingested reel via serverless API:', publishedReelId);
        }
      } catch (apiErr) {
        console.warn('[CamShot] Ingestion API fallback notice:', apiErr.message);
      }
    }

    // Immediately push to local client feed so user sees their reel in stream
    const localReel = {
      id: publishedReelId || `reel_${Date.now()}`,
      ...reelData,
      createdAt: { toMillis: () => Date.now(), seconds: Math.floor(Date.now() / 1000) },
    };
    allLoadedReels.unshift(localReel);
    applyFeedFilter();

    // Show success state
    if (successState) successState.style.display = 'flex';
    if (phaseText) phaseText.textContent = 'Complete!';
    if (phaseDot) { phaseDot.className = 'phase-dot phase-done'; }
    if (progressLabel) progressLabel.textContent = 'CamShot posted successfully!';
    reelProgressVault.textContent = '';
    if (etaLabel) etaLabel.textContent = '';
    submitReelBtn.innerHTML = '<i class="fa-solid fa-check"></i> Posted!';
    showToast('HD CamShot posted successfully!');

    // Auto-close after 2 seconds
    setTimeout(() => {
      closeCreatorStudio();
    }, 2000);

  } catch (err) {
    // BUG FIX: Better error handling with retry
    if (err.name === 'AbortError' || err.message?.includes('abort')) {
      showToast('Upload cancelled');
    } else {
      console.error('Reel upload error:', err);
      showToast(`Upload failed: ${err.message}`);
    }
    submitReelBtn.disabled = false;
    submitReelBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Retry Upload';
    if (etaLabel) etaLabel.textContent = '';
    if (phaseText) phaseText.textContent = 'Upload failed';
    if (phaseDot) phaseDot.className = 'phase-dot';
    currentUploadXHR = null;
  }
});

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

// ══════════════════════════════════════════════════
// CAMSHOT CREATOR PROFILE DRAWER LOGIC
// ══════════════════════════════════════════════════
const creatorProfileDrawer = document.getElementById('creatorProfileDrawer');
const closeProfileBtn = document.getElementById('closeProfileBtn');
const closeProfileBackdrop = document.getElementById('closeProfileBackdrop');
const shareProfileTopBtn = document.getElementById('shareProfileTopBtn');
const profileFollowBtn = document.getElementById('profileFollowBtn');
const profileMessageBtn = document.getElementById('profileMessageBtn');
const profileCopyLinkBtn = document.getElementById('profileCopyLinkBtn');
const profileReelsGrid = document.getElementById('profileReelsGrid');
const profilePicsGrid = document.getElementById('profilePicsGrid');
const profileLikedGrid = document.getElementById('profileLikedGrid');
const profileSavedGrid = document.getElementById('profileSavedGrid');
const picLightboxModal = document.getElementById('picLightboxModal');
const closeLightboxBtn = document.getElementById('closeLightboxBtn');
const closeLightboxBackdrop = document.getElementById('closeLightboxBackdrop');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');

// Open Creator Profile
export async function openCreatorProfile(authorName, authorPic = 'favicon.png') {
  if (!creatorProfileDrawer) return;
  activeProfileAuthor = authorName;

  const topUsername = document.getElementById('profileTopUsername');
  const avatarImg = document.getElementById('profileAvatarImg');
  const displayName = document.getElementById('profileDisplayName');
  const handleText = document.getElementById('profileHandleText');
  const bioText = document.getElementById('profileBioText');
  const followBtn = document.getElementById('profileFollowBtn');
  const editProfileBtn = document.getElementById('editMyReelsProfileBtn');

  const isMe = (myUID && (authorName === myUsername || authorName === myCreatorName)) ||
               (currentUser && (authorName === currentUser.displayName || authorName === currentUser.email?.split('@')[0]));

  if (topUsername) topUsername.textContent = `@${authorName}`;
  if (handleText) handleText.textContent = `@${authorName}`;

  if (isMe) {
    if (displayName) displayName.textContent = myCreatorName || authorName.replace(/[0-9_]/g, ' ').trim() || authorName;
    if (avatarImg) avatarImg.src = myProfilePic || authorPic;
    if (bioText) bioText.textContent = myCreatorBio || `Creator @${authorName} • Streaming Ultra HD 4K CamShot • Built on NEXCHAT Protocol`;
    if (editProfileBtn) editProfileBtn.style.display = 'flex';
    if (followBtn) followBtn.style.display = 'none';
  } else {
    if (displayName) displayName.textContent = authorName.replace(/[0-9_]/g, ' ').trim() || authorName;
    if (avatarImg) avatarImg.src = authorPic || 'favicon.png';
    if (bioText) bioText.textContent = `Creator @${authorName} • Streaming Ultra HD 4K CamShot • Built on NEXCHAT Protocol`;
    if (editProfileBtn) editProfileBtn.style.display = 'none';
    if (followBtn) followBtn.style.display = 'flex';
  }

  // Update follow button state
  const isFollowing = followedAuthors.has(authorName);
  if (followBtn && !isMe) {
    if (isFollowing) {
      followBtn.classList.add('following');
      followBtn.innerHTML = '<i class="fa-solid fa-user-check"></i> <span>Following</span>';
    } else {
      followBtn.classList.remove('following');
      followBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> <span>Follow</span>';
    }
  }

  updateSavedTabCount();

  // Show drawer
  creatorProfileDrawer.style.display = 'flex';

  // Load content
  loadCreatorReels(authorName);
  loadCreatorPics(authorName);
}

export function closeCreatorProfile() {
  if (creatorProfileDrawer) {
    creatorProfileDrawer.style.display = 'none';
  }
  activeProfileAuthor = null;
}

if (closeProfileBtn) closeProfileBtn.addEventListener('click', closeCreatorProfile);
if (closeProfileBackdrop) closeProfileBackdrop.addEventListener('click', closeCreatorProfile);

// Tab switching
document.querySelectorAll('.profile-tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.profile-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;

    if (profileReelsGrid) profileReelsGrid.style.display = tab === 'reels' ? 'grid' : 'none';
    if (profilePicsGrid) profilePicsGrid.style.display = tab === 'pics' ? 'grid' : 'none';
    if (profileLikedGrid) profileLikedGrid.style.display = tab === 'liked' ? 'grid' : 'none';
    if (profileSavedGrid) profileSavedGrid.style.display = tab === 'saved' ? 'grid' : 'none';

    if (tab === 'liked' && activeProfileAuthor) {
      loadCreatorLiked(activeProfileAuthor);
    } else if (tab === 'saved') {
      loadCreatorSaved();
    }
  });
});

// Follow toggle in profile
if (profileFollowBtn) {
  profileFollowBtn.addEventListener('click', () => {
    if (!activeProfileAuthor) return;
    const author = activeProfileAuthor;
    const isFollowing = followedAuthors.has(author);

    if (isFollowing) {
      followedAuthors.delete(author);
      profileFollowBtn.classList.remove('following');
      profileFollowBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> <span>Follow</span>';
      showToast(`Unfollowed @${author}`);
    } else {
      followedAuthors.add(author);
      profileFollowBtn.classList.add('following');
      profileFollowBtn.innerHTML = '<i class="fa-solid fa-user-check"></i> <span>Following</span>';
      showToast(`Following @${author}`);
    }
    localStorage.setItem('nex_followed_authors', JSON.stringify([...followedAuthors]));

    // Update followers count
    const fCountEl = document.getElementById('profileFollowersCount');
    if (fCountEl) {
      fCountEl.textContent = formatNumber(isFollowing ? 28400 : 28401);
    }
  });
}

// Message button -> direct to chat
if (profileMessageBtn) {
  profileMessageBtn.addEventListener('click', () => {
    if (activeProfileAuthor) {
      window.location.href = `chat.html?chatWith=${encodeURIComponent(activeProfileAuthor)}`;
    }
  });
}

// Copy link button
if (profileCopyLinkBtn) {
  profileCopyLinkBtn.addEventListener('click', () => {
    if (activeProfileAuthor) {
      const url = `${window.location.origin}${window.location.pathname}#user/@${activeProfileAuthor}`;
      navigator.clipboard.writeText(url).then(() => {
        showToast(`Copied profile link for @${activeProfileAuthor}`);
      }).catch(() => {
        showToast('Link copied');
      });
    }
  });
}

if (shareProfileTopBtn) {
  shareProfileTopBtn.addEventListener('click', () => {
    if (activeProfileAuthor) {
      const url = `${window.location.origin}${window.location.pathname}#user/@${activeProfileAuthor}`;
      if (navigator.share) {
        navigator.share({
          title: `NEXCHAT: @${activeProfileAuthor}`,
          text: `Check out @${activeProfileAuthor}'s Ultra HD reels and photos on NEXCHAT!`,
          url: url,
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(url);
        showToast('Profile link copied to clipboard!');
      }
    }
  });
}

// Load Creator Reels from Firestore
async function loadCreatorReels(authorName) {
  if (!profileReelsGrid) return;
  profileReelsGrid.innerHTML = `
    <div class="profile-grid-loading">
      <div class="cyber-spinner" style="width: 26px; height: 26px;"></div>
      <p>Loading @${escapeHtml(authorName)}'s reels...</p>
    </div>
  `;

  try {
    const reelsQuery = query(collection(db, 'reels'), orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(reelsQuery);
    const authorReels = [];
    let totalLikes = 0;

    snap.docs.forEach((d) => {
      const data = { id: d.id, ...d.data() };
      if (!authorName || (data.authorName || '').toLowerCase() === authorName.toLowerCase()) {
        authorReels.push(data);
        totalLikes += (data.likesCount || (data.likes ? data.likes.length : 0));
      }
    });

    currentProfileReels = authorReels;
    const countEl = document.getElementById('profileReelsTabCount');
    if (countEl) countEl.textContent = authorReels.length;
    const likesEl = document.getElementById('profileLikesCount');
    if (likesEl) likesEl.textContent = formatNumber(totalLikes || 195200);

    if (authorReels.length === 0) {
      // Check if author matches any seed reel
      const seedMatches = SEED_REELS.filter(sr => sr.authorName.toLowerCase() === (authorName || '').toLowerCase());
      if (seedMatches.length > 0) {
        authorReels.push(...seedMatches);
      } else {
        // Fallback to 2 sample clips so creator profile is never abandoned
        authorReels.push(SEED_REELS[0], SEED_REELS[1]);
      }
    }

    profileReelsGrid.innerHTML = '';
    authorReels.forEach((r) => {
      const card = document.createElement('div');
      card.className = 'profile-grid-item';
      card.dataset.reelId = r.id;
      const playCount = r.views || (r.likesCount ? r.likesCount * 14 : 850);
      const thumb = r.thumbnailUrl;

      card.innerHTML = `
        ${thumb ? `<img src="${thumb}" class="profile-grid-thumb" alt="${escapeHtml(r.caption || '')}" loading="lazy">` : `<video src="${r.videoUrl}#t=0.5" class="profile-grid-thumb" preload="metadata" muted playsinline></video>`}
        <div class="profile-grid-play-badge">
          <i class="fa-solid fa-play text-[9px]"></i>
          <span>${formatNumber(playCount)}</span>
        </div>
        ${(r.likesCount || 0) > 0 ? `<div class="profile-grid-like-badge"><i class="fa-solid fa-heart"></i> ${formatNumber(r.likesCount)}</div>` : ''}
      `;

      card.addEventListener('click', () => {
        closeCreatorProfile();
        const targetReel = document.querySelector(`.reel-card[data-reel-id="${r.id}"]`);
        if (targetReel) {
          targetReel.scrollIntoView({ behavior: 'smooth' });
          const v = targetReel.querySelector('video');
          if (v) v.play().catch(() => {});
        } else {
          showToast(`Playing: ${r.caption || r.id}`);
        }
      });

      profileReelsGrid.appendChild(card);
    });
  } catch (err) {
    console.error('Error loading creator reels:', err);
    profileReelsGrid.innerHTML = '<div class="profile-empty-grid">Failed to load reels.</div>';
  }
}

// Load Creator Pics
async function loadCreatorPics(authorName) {
  if (!profilePicsGrid) return;
  profilePicsGrid.innerHTML = `
    <div class="profile-grid-loading">
      <div class="cyber-spinner" style="width: 26px; height: 26px;"></div>
      <p>Loading pics...</p>
    </div>
  `;

  try {
    const statusQuery = query(collection(db, 'status_updates'), orderBy('timestamp', 'desc'), limit(30));
    const snap = await getDocs(statusQuery).catch(() => ({ docs: [] }));
    const pics = [];

    snap.docs.forEach((d) => {
      const data = d.data();
      if (data.mediaUrl && (data.mediaType === 'image' || !data.mediaType)) {
        if (!authorName || (data.author || data.authorName || '').toLowerCase() === authorName.toLowerCase()) {
          pics.push({ url: data.mediaUrl, caption: data.caption || 'NEX Photo' });
        }
      }
    });

    if (pics.length === 0) {
      pics.push({ url: 'logo.jpg', caption: 'NEXCHAT Cyber Protocol' });
      pics.push({ url: 'chronex-ai.jpg', caption: 'ChronEX AI Core Engine' });
      pics.push({ url: 'favicon.png', caption: `@${authorName} Avatar` });
    }

    currentProfilePics = pics;
    const pCountEl = document.getElementById('profilePicsTabCount');
    if (pCountEl) pCountEl.textContent = pics.length;
    profilePicsGrid.innerHTML = '';

    pics.forEach((p) => {
      const picItem = document.createElement('div');
      picItem.className = 'profile-pic-item';
      picItem.innerHTML = `<img src="${p.url}" class="profile-pic-thumb" alt="${escapeHtml(p.caption)}" loading="lazy">`;
      picItem.addEventListener('click', () => {
        openPicLightbox(p.url, p.caption);
      });
      profilePicsGrid.appendChild(picItem);
    });
  } catch (err) {
    console.warn('Could not load status pics:', err);
    profilePicsGrid.innerHTML = '<div class="profile-empty-grid">No pics available.</div>';
  }
}

// Load Creator Liked
async function loadCreatorLiked(authorName) {
  if (!profileLikedGrid) return;
  profileLikedGrid.innerHTML = `
    <div class="profile-grid-loading">
      <div class="cyber-spinner" style="width: 26px; height: 26px;"></div>
      <p>Loading liked reels...</p>
    </div>
  `;

  const likedReels = currentProfileReels.filter(r => (r.likesCount || 0) > 0);
  if (likedReels.length === 0) {
    profileLikedGrid.innerHTML = '<div class="profile-empty-grid"><i class="fa-regular fa-heart" style="font-size:32px;margin-bottom:8px;display:block;"></i>No public liked reels</div>';
    return;
  }

  profileLikedGrid.innerHTML = '';
  likedReels.forEach((r) => {
    const card = document.createElement('div');
    card.className = 'profile-grid-item';
    const thumb = r.thumbnailUrl;
    card.innerHTML = `
      ${thumb ? `<img src="${thumb}" class="profile-grid-thumb" alt="Reel">` : `<video src="${r.videoUrl}#t=0.5" class="profile-grid-thumb" preload="metadata" muted playsinline></video>`}
      <div class="profile-grid-like-badge"><i class="fa-solid fa-heart"></i> ${formatNumber(r.likesCount)}</div>
    `;
    card.addEventListener('click', () => {
      closeCreatorProfile();
      const targetReel = document.querySelector(`.reel-card[data-reel-id="${r.id}"]`);
      if (targetReel) {
        targetReel.scrollIntoView({ behavior: 'smooth' });
        const v = targetReel.querySelector('video');
        if (v) v.play().catch(() => {});
      }
    });
    profileLikedGrid.appendChild(card);
  });
}

// Load Creator Saved Reels from Vault
function loadCreatorSaved() {
  if (!profileSavedGrid) return;
  updateSavedTabCount();

  const savedReels = allLoadedReels.filter(r => bookmarkedReels.has(r.id));
  if (savedReels.length === 0) {
    profileSavedGrid.innerHTML = `
      <div class="profile-empty-grid">
        <i class="fa-regular fa-bookmark" style="font-size: 32px; color: #FFD700; margin-bottom: 8px; display: block;"></i>
        <p>No saved reels in vault. Tap Save on any video to store it here!</p>
      </div>
    `;
    return;
  }

  profileSavedGrid.innerHTML = '';
  savedReels.forEach((r) => {
    const card = document.createElement('div');
    card.className = 'profile-grid-item';
    const thumb = r.thumbnailUrl;
    card.innerHTML = `
      ${thumb ? `<img src="${thumb}" class="profile-grid-thumb" alt="Reel">` : `<video src="${r.videoUrl}#t=0.5" class="profile-grid-thumb" preload="metadata" muted playsinline></video>`}
      <div class="profile-grid-play-badge"><i class="fa-solid fa-bookmark text-[#FFD700]"></i> Saved</div>
    `;
    card.addEventListener('click', () => {
      closeCreatorProfile();
      const targetReel = document.querySelector(`.reel-card[data-reel-id="${r.id}"]`);
      if (targetReel) {
        targetReel.scrollIntoView({ behavior: 'smooth' });
        const v = targetReel.querySelector('video');
        if (v) v.play().catch(() => {});
      } else {
        showToast(`Playing saved reel: ${r.caption || r.id}`);
      }
    });
    profileSavedGrid.appendChild(card);
  });
}

// Lightbox logic
function openPicLightbox(imgUrl, caption = '') {
  if (!picLightboxModal || !lightboxImg) return;
  lightboxImg.src = imgUrl;
  if (lightboxCaption) lightboxCaption.textContent = caption;
  picLightboxModal.style.display = 'flex';
}

function closePicLightbox() {
  if (!picLightboxModal) return;
  picLightboxModal.style.display = 'none';
  if (lightboxImg) lightboxImg.src = '';
}

if (closeLightboxBtn) closeLightboxBtn.addEventListener('click', closePicLightbox);
if (closeLightboxBackdrop) closeLightboxBackdrop.addEventListener('click', closePicLightbox);

// Hashchange handler: support #user/@alexandergamedeveloper74 or #profile/@alexandergamedeveloper74
window.addEventListener('hashchange', checkUrlHashForProfile);
function checkUrlHashForProfile() {
  const hash = window.location.hash;
  if (hash.startsWith('#profile/') || hash.startsWith('#user/')) {
    const user = hash.split('/')[1]?.replace(/^@/, '');
    if (user) {
      openCreatorProfile(user);
    }
  }
}
setTimeout(checkUrlHashForProfile, 600);

// ============================================================
// REELS STUDIO & SETTINGS CONTROLLER (DUAL AVATAR + PLAYBACK)
// ============================================================
const reelsSettingsModal = document.getElementById('reelsSettingsModal');
const openReelsSettingsBtn = document.getElementById('openReelsSettingsBtn');
const closeReelsSettingsBtn = document.getElementById('closeReelsSettingsBtn');
const editMyReelsProfileBtn = document.getElementById('editMyReelsProfileBtn');

const settingAutoScroll = document.getElementById('settingAutoScroll');
const settingDefaultSound = document.getElementById('settingDefaultSound');
const settingDoubleTapLike = document.getElementById('settingDoubleTapLike');
const settingQualityPills = document.querySelectorAll('.settings-quality-pill');

const avatarModeGeneral = document.getElementById('avatarModeGeneral');
const avatarModeCustom = document.getElementById('avatarModeCustom');
const modeCardGeneral = document.getElementById('modeCardGeneral');
const modeCardCustom = document.getElementById('modeCardCustom');
const settingsAvatarPreviewImg = document.getElementById('settingsAvatarPreviewImg');
const settingsAvatarSourceBadge = document.getElementById('settingsAvatarSourceBadge');
const customReelsAvatarInput = document.getElementById('customReelsAvatarInput');
const changeReelsAvatarBtn = document.getElementById('changeReelsAvatarBtn');
const syncGeneralAvatarBtn = document.getElementById('syncGeneralAvatarBtn');
const avatarUploadStatus = document.getElementById('avatarUploadStatus');
const settingCreatorName = document.getElementById('settingCreatorName');
const settingCreatorBio = document.getElementById('settingCreatorBio');
const saveCreatorProfileSettingsBtn = document.getElementById('saveCreatorProfileSettingsBtn');

const settingAllowComments = document.getElementById('settingAllowComments');
const settingAllowDownloads = document.getElementById('settingAllowDownloads');
const settingShowViews = document.getElementById('settingShowViews');
const clearReelsCacheBtn = document.getElementById('clearReelsCacheBtn');

// Sync UI with state
function syncSettingsUI() {
  if (settingAutoScroll) settingAutoScroll.checked = Boolean(reelsSettings.autoScroll);
  if (settingDefaultSound) settingDefaultSound.checked = Boolean(reelsSettings.defaultSound);
  if (settingDoubleTapLike) settingDoubleTapLike.checked = reelsSettings.doubleTapLike !== false;
  if (settingAllowComments) settingAllowComments.checked = reelsSettings.allowComments !== 'off';
  if (settingAllowDownloads) settingAllowDownloads.checked = reelsSettings.allowDownloads !== false;
  if (settingShowViews) settingShowViews.checked = reelsSettings.showViews !== false;

  // Sync Quality pills
  settingQualityPills.forEach((p) => {
    if (p.dataset.quality === (reelsSettings.quality || 'auto')) {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });

  // Sync Dual Avatar Mode
  if (useCustomReelsAvatar) {
    if (avatarModeCustom) avatarModeCustom.checked = true;
    if (modeCardCustom) modeCardCustom.classList.add('selected');
    if (modeCardGeneral) modeCardGeneral.classList.remove('selected');
    if (settingsAvatarSourceBadge) settingsAvatarSourceBadge.textContent = 'Custom Creator Avatar';
    if (settingsAvatarPreviewImg) settingsAvatarPreviewImg.src = customReelsAvatar || generalProfilePic || 'favicon.png';
  } else {
    if (avatarModeGeneral) avatarModeGeneral.checked = true;
    if (modeCardGeneral) modeCardGeneral.classList.add('selected');
    if (modeCardCustom) modeCardCustom.classList.remove('selected');
    if (settingsAvatarSourceBadge) settingsAvatarSourceBadge.textContent = 'General Profile';
    if (settingsAvatarPreviewImg) settingsAvatarPreviewImg.src = generalProfilePic || 'favicon.png';
  }

  if (settingCreatorName) {
    settingCreatorName.value = myCreatorName || (currentUser?.displayName || myUsername || '');
  }
  if (settingCreatorBio) {
    settingCreatorBio.value = myCreatorBio || '';
  }
}

// Open / Close Settings
export function openReelsSettings(tab = 'playback') {
  if (!reelsSettingsModal) return;
  syncSettingsUI();
  switchSettingsTab(tab);
  reelsSettingsModal.style.display = 'flex';
}

export function closeReelsSettings() {
  if (!reelsSettingsModal) return;
  reelsSettingsModal.style.display = 'none';
}

function switchSettingsTab(tabName) {
  document.querySelectorAll('.settings-tab-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.tab === tabName);
  });
  const tabPlayback = document.getElementById('settingsTabPlayback');
  const tabCreator = document.getElementById('settingsTabCreator');
  const tabPrivacy = document.getElementById('settingsTabPrivacy');

  if (tabPlayback) tabPlayback.style.display = tabName === 'playback' ? 'block' : 'none';
  if (tabCreator) tabCreator.style.display = tabName === 'creator' ? 'block' : 'none';
  if (tabPrivacy) tabPrivacy.style.display = tabName === 'privacy' ? 'block' : 'none';
}

// Tab Button Listeners
document.querySelectorAll('.settings-tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => switchSettingsTab(btn.dataset.tab));
});

if (openReelsSettingsBtn) {
  openReelsSettingsBtn.addEventListener('click', () => openReelsSettings('playback'));
}

if (closeReelsSettingsBtn) {
  closeReelsSettingsBtn.addEventListener('click', closeReelsSettings);
}

// Edit My Profile button inside drawer opens Creator tab directly
if (editMyReelsProfileBtn) {
  editMyReelsProfileBtn.addEventListener('click', () => openReelsSettings('creator'));
}

// Save Playback setting changes immediately
function savePlaybackSettings() {
  localStorage.setItem('camshot_settings', JSON.stringify(reelsSettings));
  localStorage.setItem('nex_reels_settings', JSON.stringify(reelsSettings));
  if (myUID) {
    updateDoc(doc(db, 'users', myUID), { reelsSettings }).catch(() => {});
  }
}

if (settingAutoScroll) {
  settingAutoScroll.addEventListener('change', (e) => {
    reelsSettings.autoScroll = e.target.checked;
    savePlaybackSettings();
    showToast(reelsSettings.autoScroll ? 'Autoplay stream enabled' : 'Autoplay stream disabled');
  });
}

if (settingDefaultSound) {
  settingDefaultSound.addEventListener('change', (e) => {
    reelsSettings.defaultSound = e.target.checked;
    savePlaybackSettings();
  });
}

if (settingDoubleTapLike) {
  settingDoubleTapLike.addEventListener('change', (e) => {
    reelsSettings.doubleTapLike = e.target.checked;
    savePlaybackSettings();
  });
}

settingQualityPills.forEach((pill) => {
  pill.addEventListener('click', () => {
    settingQualityPills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    reelsSettings.quality = pill.dataset.quality;
    savePlaybackSettings();
    showToast(`Streaming quality set to: ${pill.textContent}`);
  });
});

if (settingAllowComments) {
  settingAllowComments.addEventListener('change', (e) => {
    reelsSettings.allowComments = e.target.checked ? 'all' : 'off';
    savePlaybackSettings();
  });
}

if (settingAllowDownloads) {
  settingAllowDownloads.addEventListener('change', (e) => {
    reelsSettings.allowDownloads = e.target.checked;
    savePlaybackSettings();
  });
}

if (settingShowViews) {
  settingShowViews.addEventListener('change', (e) => {
    reelsSettings.showViews = e.target.checked;
    savePlaybackSettings();
  });
}

// Avatar Mode Switching
if (modeCardGeneral) {
  modeCardGeneral.addEventListener('click', () => {
    useCustomReelsAvatar = false;
    if (avatarModeGeneral) avatarModeGeneral.checked = true;
    modeCardGeneral.classList.add('selected');
    if (modeCardCustom) modeCardCustom.classList.remove('selected');
    if (settingsAvatarSourceBadge) settingsAvatarSourceBadge.textContent = 'General Profile';
    if (settingsAvatarPreviewImg) settingsAvatarPreviewImg.src = generalProfilePic || 'favicon.png';
  });
}

if (modeCardCustom) {
  modeCardCustom.addEventListener('click', () => {
    useCustomReelsAvatar = true;
    if (avatarModeCustom) avatarModeCustom.checked = true;
    modeCardCustom.classList.add('selected');
    if (modeCardGeneral) modeCardGeneral.classList.remove('selected');
    if (settingsAvatarSourceBadge) settingsAvatarSourceBadge.textContent = 'Custom Creator Avatar';
    if (settingsAvatarPreviewImg) settingsAvatarPreviewImg.src = customReelsAvatar || generalProfilePic || 'favicon.png';
  });
}

// Custom Avatar File Picker
if (changeReelsAvatarBtn && customReelsAvatarInput) {
  changeReelsAvatarBtn.addEventListener('click', () => customReelsAvatarInput.click());

  customReelsAvatarInput.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size must be under 5MB');
      return;
    }

    if (avatarUploadStatus) avatarUploadStatus.textContent = 'Optimizing avatar...';

    // Instant local preview
    const previewUrl = URL.createObjectURL(file);
    if (settingsAvatarPreviewImg) settingsAvatarPreviewImg.src = previewUrl;

    try {
      if (avatarUploadStatus) avatarUploadStatus.textContent = 'Uploading to Cloud Storage...';
      const cldRes = await uploadImageToCloudinary(file, { folder: 'nexchat-avatars' });
      const uploadedUrl = cldRes?.secure_url || cldRes?.url;

      if (uploadedUrl) {
        customReelsAvatar = uploadedUrl;
      } else {
        // Fallback to base64 data url
        customReelsAvatar = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.readAsDataURL(file);
        });
      }

      useCustomReelsAvatar = true;
      if (avatarModeCustom) avatarModeCustom.checked = true;
      if (modeCardCustom) modeCardCustom.classList.add('selected');
      if (modeCardGeneral) modeCardGeneral.classList.remove('selected');
      if (settingsAvatarSourceBadge) settingsAvatarSourceBadge.textContent = 'Custom Creator Avatar';
      if (settingsAvatarPreviewImg) settingsAvatarPreviewImg.src = customReelsAvatar;
      if (avatarUploadStatus) avatarUploadStatus.textContent = 'Custom avatar ready! Click Save to apply.';
      showToast('Avatar uploaded successfully!');
    } catch (err) {
      console.warn('[REELS] Avatar upload fallback:', err);
      // Fallback to data URL
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.readAsDataURL(file);
      });
      customReelsAvatar = dataUrl;
      useCustomReelsAvatar = true;
      if (settingsAvatarPreviewImg) settingsAvatarPreviewImg.src = customReelsAvatar;
      if (avatarUploadStatus) avatarUploadStatus.textContent = 'Avatar cached. Click Save to apply.';
    }
  });
}

// Revert to General Avatar
if (syncGeneralAvatarBtn) {
  syncGeneralAvatarBtn.addEventListener('click', () => {
    useCustomReelsAvatar = false;
    if (avatarModeGeneral) avatarModeGeneral.checked = true;
    if (modeCardGeneral) modeCardGeneral.classList.add('selected');
    if (modeCardCustom) modeCardCustom.classList.remove('selected');
    if (settingsAvatarSourceBadge) settingsAvatarSourceBadge.textContent = 'General Profile';
    if (settingsAvatarPreviewImg) settingsAvatarPreviewImg.src = generalProfilePic || 'favicon.png';
    if (avatarUploadStatus) avatarUploadStatus.textContent = 'Reverted to general profile photo.';
    showToast('Reverted to primary profile picture');
  });
}

// Save Creator Profile Settings
if (saveCreatorProfileSettingsBtn) {
  saveCreatorProfileSettingsBtn.addEventListener('click', async () => {
    const isCustomMode = avatarModeCustom ? avatarModeCustom.checked : useCustomReelsAvatar;
    useCustomReelsAvatar = isCustomMode;

    const newCreatorName = settingCreatorName?.value.trim() || myUsername;
    const newCreatorBio = settingCreatorBio?.value.trim() || '';

    myCreatorName = newCreatorName;
    myCreatorBio = newCreatorBio;
    myUsername = newCreatorName;

    if (useCustomReelsAvatar && customReelsAvatar) {
      myProfilePic = customReelsAvatar;
    } else {
      myProfilePic = generalProfilePic || 'favicon.png';
    }

    saveCreatorProfileSettingsBtn.disabled = true;
    saveCreatorProfileSettingsBtn.innerHTML = '<div class="cyber-spinner" style="width:14px;height:14px;border-width:2px;display:inline-block;"></div> Saving...';

    try {
      if (myUID) {
        await setDoc(doc(db, 'users', myUID), {
          useCustomReelsAvatar,
          reelsAvatar: customReelsAvatar || '',
          reelsCreatorName: myCreatorName,
          reelsCreatorBio: myCreatorBio,
        }, { merge: true });
      }

      showToast('Creator Profile & Avatar saved!');
      closeReelsSettings();

      // If active profile drawer is open for me, update its view
      if (activeProfileAuthor === myUsername || (myCreatorName && activeProfileAuthor === myCreatorName)) {
        openCreatorProfile(myUsername, myProfilePic);
      }
    } catch (err) {
      console.error('[REELS] Save creator profile error:', err);
      showToast('Profile updated locally.');
      closeReelsSettings();
    } finally {
      saveCreatorProfileSettingsBtn.disabled = false;
      saveCreatorProfileSettingsBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Creator Profile';
    }
  });
}

// Clear Stream Cache & History
if (clearReelsCacheBtn) {
  clearReelsCacheBtn.addEventListener('click', () => {
    localStorage.removeItem('camshot_cache');
    localStorage.removeItem('nex_reels_cache');
    localStorage.removeItem('nex_watched_reels');
    showToast('Stream cache and watch history cleared.');
  });
}

// Launch feed on startup
initReelsFeed();
