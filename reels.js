/**
 * NEX_REELS — Interactive Vertical Short Video Feed
 * Integrates with Firebase Firestore and NEX-REELS Multi-Vault Storage (0-5)
 */
import "./src/js/security-guard.js";
import { auth, db } from './firebase-config.js';
import {
  collection, doc, addDoc, getDocs, onSnapshot, query, orderBy, limit,
  updateDoc, increment, arrayUnion, arrayRemove, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { uploadReelVideo, getVideoDuration, REELS_VAULTS } from './src/js/reels-vault.js';

// Application State
let currentUser = null;
let myUID = null;
let myUsername = 'NEX_User';
let myProfilePic = 'favicon.png';
let isGlobalMuted = true;
let activeReelId = null;
let currentCommentUnsubscribe = null;
let selectedReelFile = null;

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
const commentsModal = document.getElementById('commentsModal');
const commentsBackdrop = document.getElementById('commentsBackdrop');
const closeCommentsBtn = document.getElementById('closeCommentsBtn');
const commentsList = document.getElementById('commentsList');
const commentForm = document.getElementById('commentForm');
const commentTextInput = document.getElementById('commentTextInput');
const commentsCountHeader = document.getElementById('commentsCountHeader');
const heartBurst = document.getElementById('heartBurst');
const reelsNotif = document.getElementById('reelsNotif');

// Toast Notification
function showToast(message, duration = 3000) {
  if (!reelsNotif) return;
  reelsNotif.textContent = message;
  reelsNotif.style.display = 'block';
  setTimeout(() => {
    reelsNotif.style.display = 'none';
  }, duration);
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
    showToast('Sound Muted');
  } else {
    icon.className = 'fa-solid fa-volume-high';
    showToast('Sound Unmuted');
  }

  // Update all playing reel videos
  document.querySelectorAll('.reel-video').forEach((v) => {
    v.muted = isGlobalMuted;
  });
});

// IntersectionObserver for vertical autoplay
const videoObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const video = entry.target.querySelector('video');
    if (!video) return;

    if (entry.isIntersecting && entry.intersectionRatio >= 0.65) {
      video.muted = isGlobalMuted;
      video.play().catch(() => {
        // Autoplay policy prevented playback, keep muted
        video.muted = true;
        video.play().catch(() => {});
      });
      activeReelId = entry.target.dataset.reelId;
    } else {
      video.pause();
    }
  });
}, { threshold: [0.65] });

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
    renderEmptyFeed('Failed to connect to NEX_REELS server.');
  });
}

function renderEmptyFeed(msg = 'No reels yet. Be the first to post a short reel!') {
  reelsFeed.innerHTML = `
    <div class="reels-empty-state">
      <i class="fa-solid fa-clapperboard" style="font-size: 54px; color: var(--primary-accent); margin-bottom: 12px;"></i>
      <h3 style="font-family: var(--font-display); color: #fff;">NEX_REELS Stream Empty</h3>
      <p style="font-size: 13px; color: var(--text-muted); max-width: 280px;">${msg}</p>
      <button class="reels-btn-primary" style="margin-top: 14px;" onclick="document.getElementById('openUploadModalBtn').click()">
        <i class="fa-solid fa-plus"></i> Create Reel
      </button>
    </div>
  `;
}

function renderReels(reelsList) {
  // Disconnect existing observers
  videoObserver.disconnect();
  reelsFeed.innerHTML = '';

  reelsList.forEach((reel) => {
    const isLiked = myUID && reel.likes && Array.isArray(reel.likes) && reel.likes.includes(myUID);
    const likeCount = reel.likesCount || (reel.likes ? reel.likes.length : 0);
    const commentCount = reel.commentsCount || 0;
    const vaultBadge = reel.vault ? reel.vault : 'VAULT 0';

    const card = document.createElement('div');
    card.className = 'reel-card';
    card.dataset.reelId = reel.id;

    card.innerHTML = `
      <video class="reel-video" src="${reel.videoUrl}" playsinline loop preload="metadata"></video>
      <div class="reel-play-indicator"><i class="fa-solid fa-play"></i></div>

      <!-- Right Action Sidebar -->
      <aside class="reel-actions-sidebar">
        <div class="reel-author-avatar-wrap">
          <img src="${reel.authorPic || 'favicon.png'}" class="reel-author-avatar" alt="${reel.authorName || 'Creator'}">
        </div>

        <div class="reel-action-item">
          <button class="reel-action-btn like-btn ${isLiked ? 'liked' : ''}" data-reel-id="${reel.id}">
            <i class="fa-${isLiked ? 'solid' : 'regular'} fa-heart"></i>
          </button>
          <span class="reel-action-label like-count">${likeCount}</span>
        </div>

        <div class="reel-action-item">
          <button class="reel-action-btn comment-btn" data-reel-id="${reel.id}">
            <i class="fa-regular fa-comment-dots"></i>
          </button>
          <span class="reel-action-label">${commentCount}</span>
        </div>

        <div class="reel-action-item">
          <button class="reel-action-btn share-btn" data-reel-id="${reel.id}">
            <i class="fa-solid fa-share-nodes"></i>
          </button>
          <span class="reel-action-label">Share</span>
        </div>

        <div class="reel-sound-disc">
          <i class="fa-solid fa-music"></i>
        </div>
      </aside>

      <!-- Bottom Metadata Overlay -->
      <div class="reel-bottom-info">
        <div class="reel-author-row">
          <span class="reel-author-name">@${reel.authorName || 'anonymous'}</span>
          <span class="reel-vault-tag">${vaultBadge}</span>
        </div>
        <p class="reel-caption">${escapeHtml(reel.caption || '')}</p>
        <div class="reel-sound-row">
          <i class="fa-solid fa-music"></i>
          <span>${escapeHtml(reel.sound || 'Original Audio — NEX_REELS')}</span>
        </div>
      </div>
    `;

    // Video Tap & Double-Tap handlers
    const videoEl = card.querySelector('.reel-video');
    const playIndicator = card.querySelector('.reel-play-indicator');
    let lastTap = 0;

    videoEl.addEventListener('click', (e) => {
      const now = Date.now();
      if (now - lastTap < 300) {
        // Double Tap -> Like
        triggerHeartBurst(e.clientX, e.clientY);
        handleLikeToggle(reel.id, card.querySelector('.like-btn'), card.querySelector('.like-count'));
        lastTap = 0;
        return;
      }
      lastTap = now;

      // Single Tap -> Play/Pause
      if (videoEl.paused) {
        videoEl.play();
        showPlayIndicator(playIndicator, 'fa-play');
      } else {
        videoEl.pause();
        showPlayIndicator(playIndicator, 'fa-pause');
      }
    });

    // Like Button
    card.querySelector('.like-btn').addEventListener('click', () => {
      handleLikeToggle(reel.id, card.querySelector('.like-btn'), card.querySelector('.like-count'));
    });

    // Comment Button
    card.querySelector('.comment-btn').addEventListener('click', () => {
      openCommentsDrawer(reel.id);
    });

    // Share Button
    card.querySelector('.share-btn').addEventListener('click', () => {
      handleShareReel(reel);
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

function triggerHeartBurst(x, y) {
  if (!heartBurst) return;
  const clone = heartBurst.cloneNode(true);
  clone.style.display = 'block';
  clone.style.left = `${x}px`;
  clone.style.top = `${y}px`;
  document.body.appendChild(clone);
  setTimeout(() => clone.remove(), 800);
}

async function handleLikeToggle(reelId, likeBtn, countSpan) {
  if (!myUID) {
    showToast('Log in to like reels');
    return;
  }

  const reelRef = doc(db, 'reels', reelId);
  const currentlyLiked = likeBtn.classList.contains('liked');

  if (currentlyLiked) {
    likeBtn.classList.remove('liked');
    likeBtn.innerHTML = '<i class="fa-regular fa-heart"></i>';
    countSpan.textContent = Math.max(0, parseInt(countSpan.textContent || '1', 10) - 1);
    await updateDoc(reelRef, {
      likes: arrayRemove(myUID),
      likesCount: increment(-1),
    }).catch(err => console.warn('Like remove err:', err));
  } else {
    likeBtn.classList.add('liked');
    likeBtn.innerHTML = '<i class="fa-solid fa-heart"></i>';
    countSpan.textContent = parseInt(countSpan.textContent || '0', 10) + 1;
    await updateDoc(reelRef, {
      likes: arrayUnion(myUID),
      likesCount: increment(1),
    }).catch(err => console.warn('Like add err:', err));
  }
}

function handleShareReel(reel) {
  const shareData = {
    title: `NEX_REELS: @${reel.authorName}`,
    text: reel.caption || 'Watch this short reel on NEXCHAT!',
    url: window.location.href,
  };

  if (navigator.share) {
    navigator.share(shareData).catch(() => {});
  } else {
    navigator.clipboard.writeText(window.location.href);
    showToast('Reel link copied to clipboard!');
  }
}

// Comments Drawer Logic
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
      commentsList.innerHTML = '<div class="comment-empty">No comments yet. Share your thoughts!</div>';
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
          <span class="comment-author">@${c.authorName || 'user'}</span>
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
    showToast('Please log in to comment');
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

// Upload Reel Modal Handlers
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
    showToast('Warning: Short video reels are ideally under 90s');
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
  reelUploadProgressWrapper.style.display = 'none';
  reelProgressBarFill.style.width = '0%';
  submitReelBtn.disabled = false;
  submitReelBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Publish Reel';
}

// Upload & Publish Reel to Multi-Vault Storage & Firestore
uploadReelForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!selectedReelFile) {
    showToast('Please select a video file first');
    return;
  }

  const caption = document.getElementById('reelCaptionInput').value.trim();
  const sound = document.getElementById('reelSoundInput').value.trim() || `Original Audio — @${myUsername}`;

  submitReelBtn.disabled = true;
  submitReelBtn.innerHTML = '<div class="cyber-spinner" style="width:16px;height:16px;border-width:2px;"></div> Uploading...';
  reelUploadProgressWrapper.style.display = 'flex';

  try {
    // Sequential multi-vault upload (Vault 0 -> 1 -> 2 -> 3 -> 4 -> 5)
    const uploadResult = await uploadReelVideo(selectedReelFile, {
      uid: myUID || 'anon',
      onProgress: (percent, msg, vaultName) => {
        reelProgressBarFill.style.width = `${percent}%`;
        reelProgressPercent.textContent = `${percent}%`;
        reelProgressVault.textContent = `${vaultName} (${msg})`;
      },
      onVaultSwitch: (oldVault, newVault) => {
        reelProgressVault.textContent = `Cascading: ${oldVault} full → ${newVault}...`;
      },
    });

    reelProgressVault.textContent = `Finalizing on ${uploadResult.vault}...`;

    // Commit to Firestore 'reels' collection
    await addDoc(collection(db, 'reels'), {
      videoUrl: uploadResult.url,
      rawBlobUrl: uploadResult.rawBlobUrl || uploadResult.url,
      pathname: uploadResult.pathname || '',
      vault: uploadResult.vault || 'NEX-REELS VAULT 0',
      vaultIndex: uploadResult.vaultIndex ?? 0,
      access: uploadResult.access || 'public',
      duration: uploadResult.duration || 0,
      caption: caption,
      sound: sound,
      authorId: myUID || 'anonymous',
      authorName: myUsername,
      authorPic: myProfilePic,
      likes: [],
      likesCount: 0,
      commentsCount: 0,
      createdAt: serverTimestamp(),
    });

    showToast(`Reel successfully posted to ${uploadResult.vault}!`);
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
