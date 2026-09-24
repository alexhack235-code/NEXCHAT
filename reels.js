/**
 * NEX_REELS — 100% TikTok 2026 Experience
 * Pure Black • Sci-Fi HUD Lines • Neon Green #39FF14 • Zero Middle Watermarks • Zero Debug Badges
 */
import "./src/js/security-guard.js";
import { auth, db } from './firebase-config.js';
import {
  collection, doc, addDoc, getDocs, onSnapshot, query, orderBy, limit,
  updateDoc, increment, arrayUnion, arrayRemove, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { uploadReelVideo, getVideoDuration } from './src/js/reels-vault.js';
import { uploadAudioToCloudinary } from './src/js/cloudinary.js';
import { TRENDING_SOUNDS } from './src/js/reels-sounds.js';

// Application State
let currentUser = null;
let myUID = null;
let myUsername = 'NEX_User';
let myProfilePic = 'favicon.png';
let isGlobalMuted = true;
let activeReelId = null;
let currentCommentUnsubscribe = null;
let selectedReelFile = null;
let selectedSound = { title: 'Original Audio', artist: '', url: '' };
let previewAudio = null;
let currentPlayingSoundAudio = null;
let followedAuthors = new Set(JSON.parse(localStorage.getItem('nex_followed_authors') || '[]'));
let activeShareReel = null;

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

// Authentication Sync
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    myUID = user.uid;
    myUsername = user.displayName || user.email?.split('@')[0] || `user_${myUID.substring(0, 5)}`;
    myProfilePic = user.photoURL || 'favicon.png';
  } else {
    currentUser = null;
    myUID = null;
  }
});

// Sound Toggle Handler
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

    // Card Markup: Video + Floating Action Bar + Bottom Metadata
    card.innerHTML = `
      <video class="reel-video" src="${reel.videoUrl}" playsinline loop preload="metadata"></video>
      <div class="reel-play-indicator"><i class="fa-solid fa-play"></i></div>

      <!-- Right Side Vertical Action Bar (TikTok 2026 Style) -->
      <aside class="reel-actions-sidebar">
        <!-- Profile Pic with + Follow Badge -->
        <div class="reel-avatar-wrapper">
          <img src="${reel.authorPic || 'favicon.png'}" class="reel-author-avatar" alt="${authorHandle}">
          <button class="reel-follow-plus-badge ${isFollowing ? 'following' : ''}" data-author="${authorHandle}" title="Follow ${authorHandle}">
            <i class="fa-solid ${isFollowing ? 'fa-check' : 'fa-plus'}"></i>
          </button>
        </div>

        <!-- Heart / Like Button (32px Icon) -->
        <div class="reel-action-item">
          <button class="reel-action-glass-btn like-btn ${isLiked ? 'liked' : ''}" data-reel-id="${reel.id}" title="Like">
            <i class="fa-${isLiked ? 'solid' : 'regular'} fa-heart"></i>
          </button>
          <span class="reel-action-count like-count">${formatNumber(likeCount)}</span>
        </div>

        <!-- Comment Bubble Button (32px Icon) -->
        <div class="reel-action-item">
          <button class="reel-action-glass-btn comment-btn" data-reel-id="${reel.id}" title="Comments">
            <i class="fa-solid fa-comment-dots"></i>
          </button>
          <span class="reel-action-count">${formatNumber(commentCount)}</span>
        </div>

        <!-- Share Arrow Button (32px Icon) -->
        <div class="reel-action-item">
          <button class="reel-action-glass-btn share-btn" data-reel-id="${reel.id}" title="Share">
            <i class="fa-solid fa-share"></i>
          </button>
          <span class="reel-action-count">${formatNumber(shareCount)}</span>
        </div>

        <!-- Floating Purple Bot Mascot (ChronEX Assistant) -->
        <div class="reel-action-item">
          <div class="reel-purple-bot-mascot" title="ChronEX AI Assistant">
            <i class="fa-solid fa-robot"></i>
          </div>
        </div>

        <!-- Rotating Vinyl Sound Disc -->
        <div class="reel-sound-disc" title="Original Soundtrack">
          <i class="fa-solid fa-music"></i>
        </div>
      </aside>

      <!-- Bottom Metadata Overlay (ONLY @username + caption + marquee) -->
      <div class="reel-bottom-info">
        <span class="reel-username-bold">@${escapeHtml(authorHandle)}</span>
        <p class="reel-caption-text">${escapeHtml(reel.caption || 'Testing NEX vault')}</p>
        <div class="reel-audio-marquee-row">
          <i class="fa-solid fa-music"></i>
          <span class="reel-audio-marquee-text">${escapeHtml(soundTrackTitle)}</span>
        </div>
      </div>

      <!-- Thin Neon Green Scrubber Bar at Bottom (#39FF14) -->
      <div class="reel-progress-container" title="Seek video">
        <div class="reel-progress-track">
          <div class="reel-progress-fill"></div>
        </div>
      </div>
    `;

    // Elements inside card
    const videoEl = card.querySelector('.reel-video');
    const playIndicator = card.querySelector('.reel-play-indicator');
    const progressFill = card.querySelector('.reel-progress-fill');
    const progressContainer = card.querySelector('.reel-progress-container');
    const followBtn = card.querySelector('.reel-follow-plus-badge');
    const discEl = card.querySelector('.reel-sound-disc');

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

    // Follow Button Click
    followBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetAuthor = followBtn.dataset.author;
      if (followedAuthors.has(targetAuthor)) {
        followedAuthors.delete(targetAuthor);
        followBtn.classList.remove('following');
        followBtn.innerHTML = '<i class="fa-solid fa-plus"></i>';
        showToast(`Unfollowed @${targetAuthor}`);
      } else {
        followedAuthors.add(targetAuthor);
        followBtn.classList.add('following');
        followBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
        showToast(`Following @${targetAuthor}`);
      }
      localStorage.setItem('nex_followed_authors', JSON.stringify([...followedAuthors]));
    });

    // Video Tap & Double Tap (Double tap anywhere = like + show big heart)
    let lastTap = 0;
    card.addEventListener('click', (e) => {
      // Ignore clicks on buttons/drawers
      if (e.target.closest('.reel-actions-sidebar') || e.target.closest('.reel-progress-container')) return;

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
  const currentlyLiked = likeBtn.classList.contains('liked');

  if (currentlyLiked && !forceLike) {
    likeBtn.classList.remove('liked');
    likeBtn.innerHTML = '<i class="fa-regular fa-heart"></i>';
    countSpan.textContent = formatNumber(Math.max(0, parseInt(countSpan.textContent.replace(/[^0-9]/g, '') || '1', 10) - 1));
    await updateDoc(reelRef, {
      likes: arrayRemove(myUID),
      likesCount: increment(-1),
    }).catch(err => console.warn('Like remove err:', err));
  } else if (!currentlyLiked) {
    likeBtn.classList.add('liked');
    likeBtn.innerHTML = '<i class="fa-solid fa-heart"></i>';
    countSpan.textContent = formatNumber(parseInt(countSpan.textContent.replace(/[^0-9]/g, '') || '0', 10) + 1);
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
  reelVideoInput.value = '';
  reelPreviewVideo.pause();
  reelPreviewVideo.src = '';
  reelPreviewContainer.style.display = 'none';
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

  // Determine Bitrate and Quality based on user selection
  let bitRate = '5000k';
  if (selectedQualityMode === '4k') {
    bitRate = '12000k';
  } else if (selectedQualityMode === 'hd') {
    bitRate = '3500k';
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

    // Commit to Firestore 'reels' collection
    await addDoc(collection(db, 'reels'), {
      videoUrl: uploadResult.url,
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

// Launch feed on startup
initReelsFeed();
