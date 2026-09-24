/**
 * NEX_REELS — 100% TikTok 2026 Experience
 * Pure Black • Sci-Fi HUD Lines • Neon Green #39FF14 • Zero Middle Watermarks • Zero Debug Badges
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
  const savedSettings = JSON.parse(localStorage.getItem('nex_reels_settings') || '{}');
  reelsSettings = { ...reelsSettings, ...savedSettings };
} catch (e) {
  console.warn('[REELS] Settings parse error:', e);
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
let followedAuthors = new Set(JSON.parse(localStorage.getItem('nex_followed_authors') || '[]'));
let activeShareReel = null;
let activeProfileAuthor = null;
let currentProfileReels = [];
let currentProfilePics = [];

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

// Subscribe to Firestore Reels Collection
function initReelsFeed() {
  const reelsQuery = query(
    collection(db, 'reels'),
    orderBy('createdAt', 'desc'),
    limit(40)
  );

  onSnapshot(reelsQuery, (snapshot) => {
    if (reelsLoadingState) reelsLoadingState.style.display = 'none';

    if (snapshot.empty) {
      renderEmptyFeed();
      return;
    }

    const reelDocs = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    renderReels(reelDocs);
  }, (err) => {
    console.error('Error fetching reels:', err);
    if (reelsLoadingState) reelsLoadingState.style.display = 'none';
    renderEmptyFeed('NEX_REELS stream initializing...');
  });
}

function renderEmptyFeed(msg = 'No reels yet. Be the first to post a TikTok reel!') {
  reelsFeed.innerHTML = `
    <div class="reels-empty-state">
      <i class="fa-solid fa-clapperboard" style="font-size: 54px; color: var(--neon-green); margin-bottom: 12px;"></i>
      <h3 style="color: #fff; font-size: 18px; font-weight: 800;">NEX_REELS Stream Empty</h3>
      <p style="font-size: 13px; color: var(--text-muted); max-width: 280px;">${msg}</p>
      <button class="reels-btn-primary" style="margin-top: 14px;" onclick="document.getElementById('openUploadModalBtn').click()">
        <i class="fa-solid fa-plus"></i> Create First Reel
      </button>
    </div>
  `;
}

// ══════════════════════════════════════════════════
// RENDER REELS: 100% TIKTOK 2026 SPECIFICATION
// NO MIDDLE WATERMARKS • NO DEBUG BADGES • ULTRA CLEAN
// ══════════════════════════════════════════════════
function renderReels(reelsList) {
  videoObserver.disconnect();
  reelsFeed.innerHTML = '';

  reelsList.forEach((reel) => {
    const isLiked = myUID && reel.likes && Array.isArray(reel.likes) && reel.likes.includes(myUID);
    const likeCount = reel.likesCount || (reel.likes ? reel.likes.length : 0);
    const commentCount = reel.commentsCount || 0;
    const shareCount = reel.sharesCount || 21000;
    const authorHandle = reel.authorName || 'creator';
    const isFollowing = followedAuthors.has(authorHandle);
    const soundTrackTitle = reel.sound || `Original Audio — @${authorHandle}`;

    // Debug logging to console ONLY (Issue 2 requirement)
    console.log(`[NEX_REELS] Mounted Reel ID: ${reel.id} | Vault: ${reel.vault || 'Cloudinary Pool'}`);

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

    // Card Markup: Video + Floating Action Bar + Bottom Metadata + Bottom Comment Input Bar
    card.innerHTML = `
      <!-- 3. Fullscreen Video: object-cover w-screen h-screen bg-black, no borders -->
      <video class="reel-video w-screen h-screen object-cover bg-black" src="${reel.videoUrl}" playsinline loop preload="metadata"></video>
      <div class="reel-play-indicator"><i class="fa-solid fa-play"></i></div>

      <!-- 4. Right Action Bar: right-4 bottom-32, gap-5: Heart, Comment, Share, Bot icon, Music disc rotating -->
      <aside class="absolute right-4 bottom-32 z-20 flex flex-col items-center gap-5 text-white select-none pointer-events-auto">
        <!-- Heart (count 1) -->
        <div class="flex flex-col items-center gap-1 cursor-pointer">
          <button type="button" class="like-btn text-white transition-transform active:scale-125 focus:outline-none" data-reel-id="${reel.id}" title="Like">
            <i class="fa-solid fa-heart text-[32px] ${isLiked ? 'text-[#fe2c55]' : 'text-white'} drop-shadow-[0_2px_5px_rgba(0,0,0,0.85)]"></i>
          </button>
          <span class="like-count text-xs font-bold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">${formatNumber(likeCount)}</span>
        </div>

        <!-- Comment (0) -->
        <div class="flex flex-col items-center gap-1 cursor-pointer">
          <button type="button" class="comment-btn text-white transition-transform active:scale-125 focus:outline-none" data-reel-id="${reel.id}" title="Comments">
            <i class="fa-solid fa-comment-dots text-[32px] text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.85)]"></i>
          </button>
          <span class="reel-comment-count text-xs font-bold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">${formatNumber(commentCount)}</span>
        </div>

        <!-- Share (21.0K) -->
        <div class="flex flex-col items-center gap-1 cursor-pointer">
          <button type="button" class="share-btn text-white transition-transform active:scale-125 focus:outline-none" data-reel-id="${reel.id}" title="Share">
            <i class="fa-solid fa-share text-[30px] text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.85)]"></i>
          </button>
          <span class="text-xs font-bold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">${formatNumber(shareCount)}</span>
        </div>

        <!-- Bot icon -->
        <div class="flex flex-col items-center cursor-pointer">
          <button type="button" class="bot-btn text-white transition-transform active:scale-125 focus:outline-none" title="ChronEX AI Assistant">
            <i class="fa-solid fa-robot text-[28px] text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.85)]"></i>
          </button>
        </div>

        <!-- Music disc rotating -->
        <div class="music-disc-wrapper cursor-pointer mt-0.5">
          <div class="reel-sound-disc w-10 h-10 rounded-full border-2 border-white/70 bg-gradient-to-tr from-gray-950 via-zinc-900 to-black flex items-center justify-center drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]" title="${escapeHtml(soundTrackTitle)}">
            <i class="fa-solid fa-compact-disc text-white text-base"></i>
          </div>
        </div>
      </aside>

      <!-- 2. KEEP ONLY bottom username: <div class="absolute bottom-20 left-4 z-10"> @alexandergamedeveloper74 + caption </div> -->
      <div class="absolute bottom-20 left-4 z-10 flex flex-col gap-1 max-w-[70%] text-white select-none pointer-events-auto">
        <span class="reel-creator-handle font-bold text-[15px] tracking-wide text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)] hover:underline cursor-pointer" data-author="${escapeHtml(authorHandle)}" title="View @${escapeHtml(authorHandle)} Profile">
          @${escapeHtml(authorHandle)}
        </span>
        <p class="text-[13.5px] text-gray-100 font-normal leading-snug drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)] break-words">
          ${escapeHtml(reel.caption || '')}
        </p>
        <div class="flex items-center gap-2 text-xs text-white/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] mt-0.5">
          <i class="fa-solid fa-music text-[11px]"></i>
          <span class="truncate max-w-[200px] font-medium">${escapeHtml(soundTrackTitle)}</span>
        </div>
      </div>

      <!-- 5. Add bottom comment input bar like TikTok: "Add comment..." with image/emoji/@ icons -->
      <div class="reel-bottom-bar absolute bottom-0 left-0 right-0 z-20 px-3 pb-3 pt-2 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center gap-2.5">
        <div class="flex-1 bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-full px-3.5 py-1.5 flex items-center gap-2.5 border border-white/15 transition-all">
          <input type="text" class="reel-inline-input flex-1 bg-transparent text-white placeholder-gray-400 text-sm outline-none" placeholder="Add comment..." autocomplete="off">
          <button type="button" class="reel-inline-image-btn text-white/80 hover:text-white transition-colors" title="Add image">
            <i class="fa-regular fa-image text-[17px] drop-shadow"></i>
          </button>
          <button type="button" class="reel-inline-emoji-btn text-white/80 hover:text-white transition-colors" title="Add emoji">
            <i class="fa-regular fa-face-smile text-[17px] drop-shadow"></i>
          </button>
          <button type="button" class="reel-inline-at-btn text-white/80 hover:text-white transition-colors" title="Mention user">
            <i class="fa-solid fa-at text-[17px] drop-shadow"></i>
          </button>
        </div>
        <button type="button" class="reel-inline-send-btn text-white/90 hover:text-[#39FF14] transition-colors p-1.5 focus:outline-none" title="Post comment">
          <i class="fa-solid fa-paper-plane text-base drop-shadow"></i>
        </button>
      </div>

      <!-- Thin Neon Green Scrubber Bar at Bottom (#39FF14) -->
      <div class="reel-progress-container absolute bottom-0 left-0 right-0 h-1 z-30 cursor-pointer" title="Seek video">
        <div class="w-full h-full bg-white/20">
          <div class="reel-progress-fill h-full w-0 bg-[#39FF14] shadow-[0_0_8px_#39FF14]"></div>
        </div>
      </div>
    `;

    // Elements inside card
    const videoEl = card.querySelector('.reel-video');
    const playIndicator = card.querySelector('.reel-play-indicator');
    const progressFill = card.querySelector('.reel-progress-fill');
    const progressContainer = card.querySelector('.reel-progress-container');
    const discEl = card.querySelector('.reel-sound-disc');
    const inlineInput = card.querySelector('.reel-inline-input');
    const inlineSendBtn = card.querySelector('.reel-inline-send-btn');
    const inlineEmojiBtn = card.querySelector('.reel-inline-emoji-btn');
    const inlineImageBtn = card.querySelector('.reel-inline-image-btn');
    const inlineAtBtn = card.querySelector('.reel-inline-at-btn');
    const botBtn = card.querySelector('.bot-btn');

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

    // 8. Do NOT add auto emoji popup on input focus
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
        const emojis = ['🔥', '❤️', '👏', '😂', '✨'];
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

    if (botBtn) {
      botBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showToast(`ChronEX Bot: Ready to discuss @${authorHandle}'s reel!`);
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

    // Video Tap & Double Tap (Double tap anywhere = like + show big heart)
    let lastTap = 0;
    card.addEventListener('click', (e) => {
      // Ignore clicks on action bar, inputs, buttons, comment bar, progress container
      if (
        e.target.closest('aside') ||
        e.target.closest('.reel-progress-container') ||
        e.target.closest('.reel-bottom-bar') ||
        e.target.closest('button') ||
        e.target.closest('input')
      ) return;

      const now = Date.now();
      if (now - lastTap < 300) {
        // Double Tap -> Heart Burst + Like
        triggerHeartBurst(e.clientX, e.clientY);
        handleLikeToggle(reel.id, card.querySelector('.like-btn'), card.querySelector('.like-count'), true);
        lastTap = 0;
        return;
      }
      lastTap = now;

      // Single Tap -> Play/Pause & Tap to Unmute
      if (videoEl.muted) {
        videoEl.muted = false;
        isGlobalMuted = false;
        globalSoundToggle.querySelector('i').className = 'fa-solid fa-volume-high';
        if (card._customAudio) card._customAudio.muted = false;
        showToast('Sound Unmuted');
      }

      if (videoEl.paused) {
        videoEl.play();
        showPlayIndicator(playIndicator, 'fa-play');
        discEl.style.animationPlayState = 'running';
        if (card._customAudio) card._customAudio.play().catch(() => {});
      } else {
        videoEl.pause();
        showPlayIndicator(playIndicator, 'fa-pause');
        discEl.style.animationPlayState = 'paused';
        if (card._customAudio) card._customAudio.pause();
      }
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

    reelsFeed.appendChild(card);
    videoObserver.observe(card);
  });
}

// Submit inline comment from bottom bar
async function submitInlineComment(reelId, inputEl, cardEl) {
  const text = inputEl.value.trim();
  if (!text) return;

  if (!myUID) {
    showToast('Log in to comment');
    return;
  }

  inputEl.value = '';
  try {
    await addDoc(collection(db, 'reels', reelId, 'comments'), {
      authorId: myUID,
      authorName: myUsername,
      authorPic: myProfilePic,
      text: text,
      createdAt: serverTimestamp(),
    });

    await updateDoc(doc(db, 'reels', reelId), {
      commentsCount: increment(1),
    });

    const commentCountEl = cardEl.querySelector('.reel-comment-count');
    if (commentCountEl) {
      const current = parseInt(commentCountEl.textContent.replace(/[^0-9]/g, '') || '0', 10);
      commentCountEl.textContent = formatNumber(current + 1);
    }
    showToast('Comment posted!');
  } catch (err) {
    console.error('Error posting comment:', err);
    showToast('Failed to post comment');
  }
}

function showPlayIndicator(el, iconClass) {
  if (!el) return;
  el.innerHTML = `<i class="fa-solid ${iconClass}"></i>`;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 400);
}

// Double Tap Big Heart Burst
function triggerHeartBurst(x, y) {
  if (!heartBurst) return;
  const clone = heartBurst.cloneNode(true);
  clone.style.display = 'block';
  clone.style.left = `${x}px`;
  clone.style.top = `${y}px`;
  document.body.appendChild(clone);
  setTimeout(() => clone.remove(), 850);
}

// Like Toggle Logic
async function handleLikeToggle(reelId, likeBtn, countSpan, forceLike = false) {
  if (!myUID) {
    showToast('Log in to like reels');
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
      showToast('Reel link copied!');
      closeShareModal();
    }
  });
}

if (shareQuickCopyBtn) {
  shareQuickCopyBtn.addEventListener('click', () => {
    if (shareLinkInput.value) {
      navigator.clipboard.writeText(shareLinkInput.value);
      showToast('Reel link copied!');
      closeShareModal();
    }
  });
}

if (shareNativeBtn) {
  shareNativeBtn.addEventListener('click', () => {
    if (navigator.share && activeShareReel) {
      navigator.share({
        title: `NEX_REELS: @${activeShareReel.authorName}`,
        text: activeShareReel.caption || 'Watch this reel on NEXCHAT!',
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

if (shareDownloadBtn) {
  shareDownloadBtn.addEventListener('click', () => {
    if (activeShareReel && activeShareReel.videoUrl) {
      const a = document.createElement('a');
      a.href = activeShareReel.videoUrl;
      a.download = `NEX_REEL_${activeShareReel.id}.mp4`;
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
// COMMENTS DRAWER
// ══════════════════════════════════════════════════
function openCommentsDrawer(reelId) {
  activeReelId = reelId;
  commentsModal.style.display = 'flex';

  if (currentCommentUnsubscribe) {
    currentCommentUnsubscribe();
    currentCommentUnsubscribe = null;
  }

  const commentsQuery = query(
    collection(db, 'reels', reelId, 'comments'),
    orderBy('createdAt', 'asc')
  );

  currentCommentUnsubscribe = onSnapshot(commentsQuery, (snapshot) => {
    commentsCountHeader.textContent = snapshot.size;
    if (snapshot.empty) {
      commentsList.innerHTML = '<div class="comment-empty"><i class="fa-regular fa-comment-dots" style="font-size:28px;margin-bottom:8px;display:block;"></i>No comments yet. Share your thoughts!</div>';
      return;
    }

    commentsList.innerHTML = '';
    snapshot.docs.forEach((docSnap) => {
      const c = docSnap.data();
      const item = document.createElement('div');
      item.className = 'comment-item';
      item.innerHTML = `
        <img src="${c.authorPic || 'favicon.png'}" class="comment-avatar" alt="${c.authorName}">
        <div class="comment-body">
          <span class="comment-author">@${escapeHtml(c.authorName || 'user')}</span>
          <span class="comment-text">${escapeHtml(c.text || '')}</span>
        </div>
      `;
      commentsList.appendChild(item);
    });
    commentsList.scrollTop = commentsList.scrollHeight;
  });
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

commentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = commentTextInput.value.trim();
  if (!text || !activeReelId) return;

  if (!myUID) {
    showToast('Log in to comment');
    return;
  }

  commentTextInput.value = '';
  try {
    await addDoc(collection(db, 'reels', activeReelId, 'comments'), {
      authorId: myUID,
      authorName: myUsername,
      authorPic: myProfilePic,
      text: text,
      createdAt: serverTimestamp(),
    });

    await updateDoc(doc(db, 'reels', activeReelId), {
      commentsCount: increment(1),
    });
  } catch (err) {
    console.error('Error posting comment:', err);
    showToast('Failed to post comment');
  }
});

// ══════════════════════════════════════════════════
// UPLOAD REEL MODAL & ISSUE 3: HIGHEST QUALITY HD/4K
// ══════════════════════════════════════════════════
openUploadModalBtn.addEventListener('click', () => {
  uploadReelModal.style.display = 'flex';
});

closeUploadModalBtn.addEventListener('click', () => {
  uploadReelModal.style.display = 'none';
  resetUploadForm();
});

cancelUploadBtn.addEventListener('click', () => {
  uploadReelModal.style.display = 'none';
  resetUploadForm();
});

reelDropzone.addEventListener('click', () => {
  reelVideoInput.click();
});

// Character counter for Caption
if (reelCaptionInput && reelCaptionCounter) {
  reelCaptionInput.addEventListener('input', () => {
    const len = reelCaptionInput.value.length;
    reelCaptionCounter.textContent = `${len}/300`;
  });
}

// Quick Hashtag Pills
document.querySelectorAll('.hashtag-pill').forEach((pill) => {
  pill.addEventListener('click', () => {
    const tag = pill.dataset.tag;
    if (!reelCaptionInput.value.includes(tag)) {
      reelCaptionInput.value = (reelCaptionInput.value ? reelCaptionInput.value + ' ' : '') + tag;
      if (reelCaptionCounter) reelCaptionCounter.textContent = `${reelCaptionInput.value.length}/300`;
    }
  });
});

// Quality Selector Pills
let selectedQualityMode = 'fhd';
document.querySelectorAll('.quality-pill').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.quality-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedQualityMode = btn.dataset.quality;
  });
});

reelVideoInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('video/')) {
    showToast('Please select a valid video file (.mp4, .webm, .mov)');
    return;
  }

  selectedReelFile = file;
  reelDropzonePrompt.style.display = 'none';
  reelPreviewContainer.style.display = 'flex';
  reelPreviewVideo.src = URL.createObjectURL(file);

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
      const resCategory = thumbData.width >= 3800 ? '4K Ultra HD' : (thumbData.width >= 1000 ? '1080p FHD' : '720p HD');
      if (reelHdSpecText) {
        reelHdSpecText.textContent = `${thumbData.width}x${thumbData.height} ${resCategory} • Lossless H.264`;
      }
      showToast(`Analyzed: ${resCategory} (${thumbData.width}x${thumbData.height})`);
    }
  } catch (err) {
    console.warn('Thumbnail generation error:', err);
  }

  if (duration > 90) {
    showToast('Notice: Short reels are ideally under 90s');
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
  submitReelBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Publish Reel';
}

// Publish Reel to Cloudinary Pool with Highest HD/4K Parameters
uploadReelForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!selectedReelFile) {
    showToast('Please select a video file first');
    return;
  }

  const caption = document.getElementById('reelCaptionInput').value.trim() || 'Testing NEX vault';
  const soundTrackName = document.getElementById('reelSoundTitle').value || `Original Audio — @${myUsername}`;
  const customAudioUrl = document.getElementById('reelSoundUrl').value || '';

  // Determine Bitrate and Quality based on user selection: highest HD / 4K without compression
  let bitRate = '8000k';
  if (selectedQualityMode === '4k') {
    bitRate = '14000k';
  } else if (selectedQualityMode === 'hd') {
    bitRate = '5000k';
  }

  submitReelBtn.disabled = true;
  submitReelBtn.innerHTML = '<div class="cyber-spinner" style="width:16px;height:16px;border-width:2px;"></div> Uploading HD...';
  reelUploadProgressWrapper.style.display = 'flex';

  try {
    const uploadResult = await uploadReelVideo(selectedReelFile, {
      uid: myUID || 'anon',
      quality: 'auto:best',
      fetchFormat: 'auto',
      videoCodec: 'h264',
      bitRate: bitRate,
      eager: 'q_auto:best',
      onProgress: (percent, msg, vaultName) => {
        reelProgressBarFill.style.width = `${percent}%`;
        reelProgressPercent.textContent = `${percent}%`;
        reelProgressVault.textContent = `Optimizing HD stream (${msg})`;
      },
    });

    console.log('[NEX_REELS] HD Video Saved to Cloudinary Vault:', uploadResult.vault);

    // If a high-res poster thumbnail was generated via canvas, upload to Cloudinary for 0ms profile grid loading
    let thumbnailUrl = '';
    if (selectedReelThumbnailBlob) {
      try {
        reelProgressVault.textContent = 'Uploading High-Res Poster Thumbnail...';
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

    // Commit to Firestore 'reels' collection
    await addDoc(collection(db, 'reels'), {
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
      authorId: myUID || 'anonymous',
      authorName: myUsername,
      authorPic: myProfilePic,
      likes: [],
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      views: 1,
      createdAt: serverTimestamp(),
    });

    showToast(`HD Reel posted successfully!`);
    uploadReelModal.style.display = 'none';
    resetUploadForm();
  } catch (err) {
    console.error('Reel upload error:', err);
    showToast(`Upload failed: ${err.message}`);
    submitReelBtn.disabled = false;
    submitReelBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Try Again';
  }
});

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

// ══════════════════════════════════════════════════
// TIKTOK-STYLE CREATOR PROFILE DRAWER LOGIC
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
    if (bioText) bioText.textContent = myCreatorBio || `🎮 Creator @${authorName} • Streaming Ultra HD 4K NEX_REELS • Built on NEXCHAT Protocol`;
    if (editProfileBtn) editProfileBtn.style.display = 'flex';
    if (followBtn) followBtn.style.display = 'none';
  } else {
    if (displayName) displayName.textContent = authorName.replace(/[0-9_]/g, ' ').trim() || authorName;
    if (avatarImg) avatarImg.src = authorPic || 'favicon.png';
    if (bioText) bioText.textContent = `🎮 Creator @${authorName} • Streaming Ultra HD 4K NEX_REELS • Built on NEXCHAT Protocol`;
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

    if (tab === 'liked' && activeProfileAuthor) {
      loadCreatorLiked(activeProfileAuthor);
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
      profileReelsGrid.innerHTML = `
        <div class="profile-empty-grid">
          <i class="fa-solid fa-clapperboard" style="font-size: 32px; color: var(--neon-green); margin-bottom: 8px; display: block;"></i>
          <p>No reels published yet by @${escapeHtml(authorName)}</p>
        </div>
      `;
      return;
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
    localStorage.removeItem('nex_reels_cache');
    localStorage.removeItem('nex_watched_reels');
    showToast('Stream cache and watch history cleared.');
  });
}

// Launch feed on startup
initReelsFeed();
