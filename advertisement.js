import { auth, db, storage } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc, getDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js';
import { uploadAnyMedia } from './src/js/media-upload.js';

let currentUser = null;
let currentView = 'browse'; // 'browse' (default), 'upload', 'myads', 'cart', 'detail'
let cartItems = [];
let allAds = [];
let selectedCategory = '';
let searchTerm = '';
let currentDetailAd = null;
let userUID = null;
let userUsername = null;
let userEmail = null;
let userTokens = 0;

// Token Duration Plans
const DURATION_PLANS = {
  '48': { hours: 48, tokens: 100, label: '48 Hours' },
  '72': { hours: 72, tokens: 150, label: '72 Hours (3 Days)' },
  '144': { hours: 144, tokens: 300, label: '144 Hours (6 Days)' },
  '168': { hours: 168, tokens: 350, label: '168 Hours (7 Days)' }
};

// Category Emojis Map
const CATEGORY_MAP = {
  'electronics': { emoji: '📱', label: 'Electronics' },
  'clothing': { emoji: '👕', label: 'Fashion' },
  'gaming': { emoji: '🎮', label: 'Gaming' },
  'services': { emoji: '🛠️', label: 'Services' },
  'books': { emoji: '📚', label: 'Books' },
  'food': { emoji: '🍔', label: 'Food' },
  'furniture': { emoji: '🪑', label: 'Home' },
  'other': { emoji: '📦', label: 'Other' }
};

// ============================================================
// FORMAT TOKEN BALANCE
// ============================================================
function formatBalanceDisplay(amount) {
  const num = Number(amount || 0);
  if (num >= 1e32) return '∞';
  if (num >= 1e15) return (num / 1e15).toFixed(1) + 'Q';
  if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toLocaleString();
}

function escapeHtml(t) {
  const m = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return t ? String(t).replace(/[&<>"']/g, x => m[x]) : '';
}

// ============================================================
// AUTH STATE INITIALIZATION
// ============================================================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    userUID = user.uid;
    userEmail = user.email || 'No email';

    try {
      const userRef = doc(db, 'users', userUID);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        userUsername = userData.username || userData.name || user.displayName || 'NEX User';
        userTokens = Number(userData.tokens || 0);
      } else {
        userUsername = user.displayName || 'NEX User';
        userTokens = 0;
      }
    } catch (error) {
      console.warn('Error fetching user document:', error);
      userUsername = user.displayName || 'NEX User';
      userTokens = 0;
    }

    // Populate auto-fill elements
    const nexUserEl = document.getElementById('nexUsername');
    const userEmailEl = document.getElementById('userEmail');
    const userUIDEl = document.getElementById('userUID');
    const sellerDisplay = document.getElementById('sellerUsernameDisplay');
    if (nexUserEl) nexUserEl.value = userUsername;
    if (userEmailEl) userEmailEl.value = userEmail;
    if (userUIDEl) userUIDEl.value = userUID;
    if (sellerDisplay) sellerDisplay.textContent = `${userUsername} (${userEmail})`;

    updateTokenDisplay();
    loadAllAds();
    loadCartFromLocalStorage();
    checkExpiredAds();
    setInterval(checkExpiredAds, 600000); // Check every 10 mins
  } else {
    // If not logged in, redirect to login
    window.location.href = 'index.html';
  }
});

// ============================================================
// DOM EVENT LISTENERS
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Navigation Buttons
  document.getElementById('backBtn')?.addEventListener('click', () => {
    window.location.href = 'chat.html';
  });

  // Top tabs listeners (Desktop)
  document.querySelectorAll('.top-nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const view = tab.getAttribute('data-view');
      if (view) showView(view);
    });
  });

  // Bottom navigation listeners (Mobile)
  document.querySelectorAll('.bottom-nav .nav-item[data-view]').forEach(item => {
    item.addEventListener('click', () => {
      const view = item.getAttribute('data-view');
      if (view) showView(view);
    });
  });

  // Cart Header Button
  document.getElementById('cartHeaderBtn')?.addEventListener('click', () => showView('cart'));
  document.getElementById('continueShopping')?.addEventListener('click', () => showView('browse'));
  document.getElementById('backFromDetailBtn')?.addEventListener('click', () => showView('browse'));

  // Create New Ad Button (inside My Ads)
  document.getElementById('createNewAdBtn')?.addEventListener('click', () => {
    showView('upload');
    resetAdForm();
  });

  // Grid / List View Toggle
  document.getElementById('gridViewBtn')?.addEventListener('click', () => {
    document.getElementById('adsList')?.classList.remove('list-view');
    document.getElementById('gridViewBtn')?.classList.add('active');
    document.getElementById('listViewBtn')?.classList.remove('active');
  });

  document.getElementById('listViewBtn')?.addEventListener('click', () => {
    document.getElementById('adsList')?.classList.add('list-view');
    document.getElementById('listViewBtn')?.classList.add('active');
    document.getElementById('gridViewBtn')?.classList.remove('active');
  });

  // Category filter chips
  document.querySelectorAll('#categoryChips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#categoryChips .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedCategory = chip.getAttribute('data-category') || '';
      renderFilteredAds();
    });
  });

  // Live Search Input
  const searchInput = document.getElementById('searchAds');
  const clearBtn = document.getElementById('clearSearchBtn');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value.toLowerCase().trim();
      if (clearBtn) clearBtn.style.display = searchTerm ? 'block' : 'none';
      renderFilteredAds();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      searchTerm = '';
      clearBtn.style.display = 'none';
      renderFilteredAds();
      searchInput?.focus();
    });
  }

  // Duration Plan Radios
  document.querySelectorAll('input[name="durationPlan"]').forEach(radio => {
    radio.addEventListener('change', updateTokenDisplay);
  });

  // Image Upload Area Handlers
  const uploadArea = document.getElementById('imageUploadArea');
  const fileInput = document.getElementById('productImage');
  const previewContainer = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImg');
  const removeBtn = document.getElementById('removeImageBtn');

  if (uploadArea && fileInput) {
    uploadArea.addEventListener('click', () => fileInput.click());
    
    // Drag & Drop
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = 'var(--accent-primary)';
      uploadArea.style.background = 'rgba(0, 240, 118, 0.2)';
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.style.borderColor = '';
      uploadArea.style.background = '';
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '';
      uploadArea.style.background = '';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        fileInput.files = e.dataTransfer.files;
        handleFileSelection(fileInput.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelection(e.target.files[0]);
      }
    });
  }

  function handleFileSelection(file) {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      showNotification('File size exceeds 50MB limit.', 'error');
      if (fileInput) fileInput.value = '';
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video/');

    if (previewContainer) {
      if (isVideo) {
        previewContainer.innerHTML = `
          <video src="${objectUrl}" style="width:100%; max-height:240px; object-fit:cover;" controls autoplay muted playsinline></video>
          <button type="button" class="remove-image-btn" id="removeImageBtn" title="Remove Media">✕</button>
        `;
      } else {
        previewContainer.innerHTML = `
          <img src="${objectUrl}" style="width:100%; max-height:240px; object-fit:cover;" alt="Preview">
          <button type="button" class="remove-image-btn" id="removeImageBtn" title="Remove Media">✕</button>
        `;
      }

      previewContainer.style.display = 'block';
      if (uploadArea) uploadArea.style.display = 'none';

      // Re-attach remove listener
      document.getElementById('removeImageBtn')?.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        resetImageUpload();
      });
    }
  }

  if (removeBtn) {
    removeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      resetImageUpload();
    });
  }

  function resetImageUpload() {
    if (fileInput) fileInput.value = '';
    if (previewContainer) {
      previewContainer.style.display = 'none';
      previewContainer.innerHTML = `
        <img id="previewImg" src="" alt="Preview">
        <button type="button" class="remove-image-btn" id="removeImageBtn" title="Remove Media">✕</button>
      `;
    }
    if (uploadArea) uploadArea.style.display = 'block';
  }

  // Checkout Button (Routes to Chat Checkout)
  document.getElementById('checkoutBtn')?.addEventListener('click', () => {
    if (cartItems.length > 0) {
      const item = cartItems[0];
      const count = cartItems.length;
      const total = cartItems.reduce((s, i) => s + (i.productPrice * i.quantity), 0);
      const summaryMsg = `Hi ${item.sellerUsername}, I want to purchase ${count > 1 ? `${count} items (total $${total.toFixed(2)})` : `"${item.productName}" for $${item.productPrice.toFixed(2)}`} from NEXCHAT Marketplace!`;

      sessionStorage.setItem('targetUserUID', item.sellerUID);
      sessionStorage.setItem('targetUsername', item.sellerUsername);
      sessionStorage.setItem('productName', item.productName);
      sessionStorage.setItem('fromAdvertisement', 'true');

      showNotification('Opening chat with seller...', 'success');
      setTimeout(() => {
        window.location.href = `chat.html?chatWith=${encodeURIComponent(item.sellerUID)}&chatName=${encodeURIComponent(item.sellerUsername)}&product=${encodeURIComponent(item.productName)}`;
      }, 600);
    }
  });

  // Post Ad Form Submit
  document.getElementById('adForm')?.addEventListener('submit', handleAdSubmit);
});

// ============================================================
// VIEW SWITCHING
// ============================================================
function showView(view) {
  currentView = view;
  const sections = {
    'browse': 'adsListSection',
    'upload': 'uploadSection',
    'myads': 'myAdsSection',
    'cart': 'cartSection',
    'detail': 'adDetailSection'
  };

  Object.keys(sections).forEach(v => {
    const el = document.getElementById(sections[v]);
    if (el) el.style.display = (v === view) ? 'block' : 'none';
  });

  // Update desktop tabs
  document.querySelectorAll('.top-nav-tab').forEach(t => {
    t.classList.toggle('active', t.getAttribute('data-view') === view);
  });

  // Update mobile bottom nav
  document.querySelectorAll('.bottom-nav .nav-item[data-view]').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-view') === view);
  });

  if (view === 'browse') {
    renderFilteredAds();
  } else if (view === 'upload') {
    updateTokenDisplay();
  } else if (view === 'myads') {
    loadUserAds();
  } else if (view === 'cart') {
    displayCart();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.showMarketView = showView;

// ============================================================
// TOKEN BALANCE CALCULATION & DISPLAY
// ============================================================
function updateTokenDisplay() {
  const tokenHeaderEl = document.getElementById('headerTokenCount');
  if (tokenHeaderEl) {
    tokenHeaderEl.textContent = formatBalanceDisplay(userTokens);
  }

  const selectedRadio = document.querySelector('input[name="durationPlan"]:checked');
  if (!selectedRadio) return;
  const plan = DURATION_PLANS[selectedRadio.value] || DURATION_PLANS['48'];
  const warningEl = document.getElementById('tokenWarning');
  if (!warningEl) return;

  if (userTokens < plan.tokens) {
    warningEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Insufficient tokens! You need ${plan.tokens} tokens, but currently have ${formatBalanceDisplay(userTokens)}. <a href="cart.html" style="color: #00f076; text-decoration: underline; margin-left: 6px;">Get Tokens</a>`;
    warningEl.className = 'token-warning error';
    warningEl.style.display = 'block';
  } else {
    warningEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> Balance verified: ${formatBalanceDisplay(userTokens)} Tokens available (${plan.tokens} Tokens will be deducted upon posting).`;
    warningEl.className = 'token-warning success';
    warningEl.style.display = 'block';
  }
}

// ============================================================
// LOAD ALL ADVERTISEMENTS (EXPLORE FEED)
// ============================================================
async function loadAllAds() {
  try {
    const snap = await getDocs(query(collection(db, 'advertisements'), where('status', '==', 'active')));
    allAds = [];
    const now = new Date();

    snap.forEach(d => {
      const data = d.data();
      const exp = data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
      if (exp > now) {
        allAds.push({ id: d.id, ...data });
      }
    });

    allAds.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    renderFilteredAds();
  } catch (err) {
    console.warn('Failed to load advertisements:', err);
    const container = document.getElementById('adsList');
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon" style="color: var(--danger-color);"><i class="fa-solid fa-circle-exclamation"></i></div>
          <p class="empty-title">Unable to Load Ads</p>
          <p class="empty-sub">Please verify your network connection and try again.</p>
        </div>
      `;
    }
  }
}

// ============================================================
// FILTER AND RENDER ADS
// ============================================================
function renderFilteredAds() {
  let filtered = allAds;

  if (selectedCategory) {
    filtered = filtered.filter(ad => (ad.productCategory || '').toLowerCase() === selectedCategory.toLowerCase());
  }

  if (searchTerm) {
    filtered = filtered.filter(ad =>
      (ad.productName || '').toLowerCase().includes(searchTerm) ||
      (ad.productDescription || '').toLowerCase().includes(searchTerm) ||
      (ad.sellerUsername || '').toLowerCase().includes(searchTerm)
    );
  }

  displayAds(filtered);
}

function displayAds(ads) {
  const container = document.getElementById('adsList');
  if (!container) return;

  if (ads.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i class="fa-solid fa-box-open"></i></div>
        <p class="empty-title">${searchTerm ? 'No Matching Products' : 'No Listings in this Category'}</p>
        <p class="empty-sub">${searchTerm ? 'Try a different search keyword.' : 'Be the first seller to post an item in this category!'}</p>
        <button type="button" class="btn-primary mt-12" style="max-width: 220px; margin: 12px auto 0;" onclick="window.showMarketView('upload')">
          <i class="fa-solid fa-plus"></i> Post an Ad
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = ads.map(ad => {
    const exp = ad.expiresAt?.toDate ? ad.expiresAt.toDate() : new Date(ad.expiresAt);
    const hours = Math.max(0, Math.ceil((exp - new Date()) / 3600000));
    const imageUrl = ad.imageURL || 'logo.jpg';
    const isVideo = ad.mediaType === 'video' || imageUrl.includes('.mp4');
    const catInfo = CATEGORY_MAP[ad.productCategory] || { emoji: '📦', label: ad.productCategory || 'Other' };

    const mediaHtml = isVideo
      ? `<video src="${imageUrl}" class="ad-card-image" autoplay muted loop playsinline></video>`
      : `<img src="${imageUrl}" class="ad-card-image" alt="${escapeHtml(ad.productName)}" loading="lazy" onerror="this.onerror=null;this.src='logo.jpg';">`;

    return `
      <div class="ad-card" onclick="window.viewAdDetail('${ad.id}')">
        <div class="ad-card-media-wrap">
          ${mediaHtml}
          <div class="ad-card-category-badge">${catInfo.emoji} ${catInfo.label}</div>
          <div class="ad-card-expiry-badge"><i class="fa-regular fa-clock"></i> ${hours}h</div>
        </div>
        <div class="ad-card-content">
          <div class="ad-card-title">${escapeHtml(ad.productName)}</div>
          <div class="ad-card-price-row">
            <div class="ad-card-price">$${parseFloat(ad.productPrice || 0).toFixed(2)}</div>
            <div class="ad-card-seller" title="Seller: ${escapeHtml(ad.sellerUsername)}">
              <i class="fa-solid fa-user-check"></i> ${escapeHtml(ad.sellerUsername || 'Seller')}
            </div>
          </div>
          <div class="ad-card-actions">
            <button type="button" class="card-action-btn chat-btn" onclick="window.contactSeller(event, '${ad.id}')">
              <i class="fa-solid fa-comment-dots"></i> Chat
            </button>
            <button type="button" class="card-action-btn cart-btn" onclick="window.addToCartFromCard(event, '${ad.id}')">
              <i class="fa-solid fa-cart-plus"></i> Cart
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================
// MY ADVERTISEMENTS
// ============================================================
async function loadUserAds() {
  if (!userUID) return;
  const container = document.getElementById('myAdsList');
  if (!container) return;

  try {
    const snap = await getDocs(query(collection(db, 'advertisements'), where('sellerUID', '==', userUID)));
    const userAds = [];
    snap.forEach(d => userAds.push({ id: d.id, ...d.data() }));
    userAds.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    if (userAds.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i class="fa-solid fa-box-open"></i></div>
          <p class="empty-title">No Active Listings</p>
          <p class="empty-sub">You have not posted any advertisements yet.</p>
          <button type="button" class="btn-primary mt-12" style="max-width: 220px; margin: 12px auto 0;" onclick="window.showMarketView('upload')">
            <i class="fa-solid fa-plus"></i> Post Your First Ad
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = userAds.map(ad => {
      const exp = ad.expiresAt?.toDate ? ad.expiresAt.toDate() : new Date(ad.expiresAt);
      const expired = exp <= new Date();
      const hours = Math.max(0, Math.ceil((exp - new Date()) / 3600000));
      const imageUrl = ad.imageURL || 'logo.jpg';
      const isVideo = ad.mediaType === 'video' || imageUrl.includes('.mp4');
      const catInfo = CATEGORY_MAP[ad.productCategory] || { emoji: '📦', label: ad.productCategory || 'Other' };

      const mediaHtml = isVideo
        ? `<video src="${imageUrl}" class="ad-card-image" autoplay muted loop playsinline></video>`
        : `<img src="${imageUrl}" class="ad-card-image" alt="${escapeHtml(ad.productName)}" loading="lazy" onerror="this.onerror=null;this.src='logo.jpg';">`;

      return `
        <div class="ad-card ${expired ? 'expired' : ''}">
          <div class="ad-card-media-wrap" onclick="window.viewAdDetail('${ad.id}')">
            ${mediaHtml}
            <div class="ad-card-category-badge">${catInfo.emoji} ${catInfo.label}</div>
            <div class="ad-card-expiry-badge">
              ${expired ? '<i class="fa-solid fa-ban"></i> EXPIRED' : `<i class="fa-regular fa-clock"></i> ${hours}h`}
            </div>
          </div>
          <div class="ad-card-content">
            <div class="ad-card-title">${escapeHtml(ad.productName)}</div>
            <div class="ad-card-price-row">
              <div class="ad-card-price">$${parseFloat(ad.productPrice || 0).toFixed(2)}</div>
            </div>
            <div class="ad-card-actions">
              <button type="button" class="card-action-btn" onclick="window.viewAdDetail('${ad.id}')">
                <i class="fa-solid fa-eye"></i> View
              </button>
              <button type="button" class="card-action-btn delete-btn" onclick="window.deleteAd(event, '${ad.id}')">
                <i class="fa-solid fa-trash-can"></i> Delete Listing
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.warn('Error loading user ads:', err);
  }
}

// ============================================================
// AD DETAIL VIEW
// ============================================================
function viewAdDetail(adId) {
  currentDetailAd = allAds.find(a => a.id === adId);
  if (!currentDetailAd) return;

  const detailImgContainer = document.getElementById('detailImageContainer');
  if (detailImgContainer) {
    const isVideo = currentDetailAd.mediaType === 'video' || (currentDetailAd.imageURL && currentDetailAd.imageURL.includes('.mp4'));
    const catInfo = CATEGORY_MAP[currentDetailAd.productCategory] || { emoji: '📦', label: currentDetailAd.productCategory || 'Other' };
    
    if (isVideo) {
      detailImgContainer.innerHTML = `
        <video src="${currentDetailAd.imageURL}" style="width:100%; max-height:380px; object-fit:cover;" controls autoplay playsinline></video>
        <div class="detail-category-badge">${catInfo.emoji} ${catInfo.label}</div>
      `;
    } else {
      detailImgContainer.innerHTML = `
        <img src="${currentDetailAd.imageURL || 'logo.jpg'}" id="detailImage" alt="${escapeHtml(currentDetailAd.productName)}" onerror="this.onerror=null;this.src='logo.jpg';">
        <div class="detail-category-badge">${catInfo.emoji} ${catInfo.label}</div>
      `;
    }
  }

  const exp = currentDetailAd.expiresAt?.toDate ? currentDetailAd.expiresAt.toDate() : new Date(currentDetailAd.expiresAt);
  const hours = Math.max(0, Math.ceil((exp - new Date()) / 3600000));

  const nameEl = document.getElementById('detailName');
  const priceEl = document.getElementById('detailPrice');
  const descEl = document.getElementById('detailDescription');
  const catEl = document.getElementById('detailCategory');
  const expEl = document.getElementById('detailExpiry');
  const userEl = document.getElementById('detailUsername');
  const uidEl = document.getElementById('detailUID');

  if (nameEl) nameEl.textContent = currentDetailAd.productName;
  if (priceEl) priceEl.textContent = `$${parseFloat(currentDetailAd.productPrice || 0).toFixed(2)}`;
  if (descEl) descEl.textContent = currentDetailAd.productDescription || 'No description provided.';
  if (catEl) catEl.textContent = currentDetailAd.productCategory || 'General';
  if (expEl) expEl.textContent = `${hours} hours remaining`;
  if (userEl) userEl.textContent = currentDetailAd.sellerUsername || 'Verified Seller';
  if (uidEl) uidEl.textContent = `UID: ${currentDetailAd.sellerUID || 'N/A'}`;

  // Hook up detail action buttons
  const chatBtn = document.getElementById('contactSellerBtn');
  if (chatBtn) {
    chatBtn.onclick = () => contactSeller(null, currentDetailAd.id);
  }

  const cartBtn = document.getElementById('addToCartDetailBtn');
  if (cartBtn) {
    cartBtn.onclick = (e) => addToCartFromCard(e, currentDetailAd.id);
  }

  showView('detail');
}

// ============================================================
// CONTACT SELLER (DIRECT CHAT INTEGRATION)
// ============================================================
function contactSeller(e, id) {
  if (e) e.stopPropagation();
  const ad = id ? (allAds.find(a => a.id === id) || currentDetailAd) : currentDetailAd;
  if (!ad) return;

  if (ad.sellerUID === userUID) {
    showNotification('This is your own advertisement listing.', 'info');
    return;
  }

  sessionStorage.setItem('targetUserUID', ad.sellerUID);
  sessionStorage.setItem('targetUsername', ad.sellerUsername);
  sessionStorage.setItem('productName', ad.productName);
  sessionStorage.setItem('fromAdvertisement', 'true');

  showNotification(`Connecting with ${ad.sellerUsername}...`, 'success');
  setTimeout(() => {
    window.location.href = `chat.html?chatWith=${encodeURIComponent(ad.sellerUID)}&chatName=${encodeURIComponent(ad.sellerUsername)}&product=${encodeURIComponent(ad.productName)}`;
  }, 400);
}

// ============================================================
// POST ADVERTISEMENT FORM HANDLER
// ============================================================
async function handleAdSubmit(e) {
  e.preventDefault();

  const fileInput = document.getElementById('productImage');
  const imageFile = fileInput?.files?.[0];
  const productName = document.getElementById('productName')?.value.trim();
  const productPrice = parseFloat(document.getElementById('productPrice')?.value);
  const productCategory = document.getElementById('productCategory')?.value;
  const productDescription = document.getElementById('productDescription')?.value.trim();
  const selectedRadio = document.querySelector('input[name="durationPlan"]:checked');
  const plan = DURATION_PLANS[selectedRadio?.value] || DURATION_PLANS['48'];

  if (!imageFile) {
    showNotification('Please select a product image or video.', 'error');
    return;
  }

  if (!productName || productName.length < 3) {
    showNotification('Product title must be at least 3 characters.', 'error');
    return;
  }

  if (isNaN(productPrice) || productPrice < 0) {
    showNotification('Please enter a valid price.', 'error');
    return;
  }

  if (!productCategory) {
    showNotification('Please select a category.', 'error');
    return;
  }

  if (userTokens < plan.tokens) {
    showNotification(`Insufficient tokens! You need ${plan.tokens} tokens but currently have ${userTokens}.`, 'error');
    return;
  }

  const submitBtn = document.getElementById('postAdBtn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading Media...';
  }

  showStatus('Uploading media to NEX-VAULT...', 'loading');

  try {
    let url = '';
    try {
      const uploadRes = await uploadAnyMedia(imageFile, {
        folder: `advertisements/${userUID}`,
        uid: userUID,
        onProgress: (percent) => {
          showStatus(`Uploading media: ${percent}%...`, 'loading');
        }
      });
      url = uploadRes.url || uploadRes.downloadUrl;
    } catch (upErr) {
      console.warn('Primary Cloudinary upload failed, falling back to Firebase Storage:', upErr);
      try {
        const storeRef = ref(storage, `advertisements/${userUID}/${Date.now()}_${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
        const snap = await uploadBytes(storeRef, imageFile);
        url = await getDownloadURL(snap.ref);
      } catch (fbErr) {
        console.warn('Firebase Storage failed, encoding Base64 fallback:', fbErr);
        url = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.readAsDataURL(imageFile);
        });
      }
    }

    const expiresAt = new Date(Date.now() + plan.hours * 60 * 60 * 1000);

    const adData = {
      productName: productName,
      productDescription: productDescription,
      productPrice: productPrice,
      productCategory: productCategory,
      imageURL: url,
      mediaType: imageFile.type.startsWith('video/') ? 'video' : 'image',
      sellerUID: userUID,
      sellerUsername: userUsername,
      sellerEmail: userEmail,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      expiresAt: expiresAt,
      durationHours: plan.hours,
      durationTokens: plan.tokens,
      status: 'active',
      views: 0
    };

    await addDoc(collection(db, 'advertisements'), adData);
    await deductUserTokens(plan.tokens);

    showStatus('Advertisement published successfully!', 'success');
    showNotification('Your advertisement is now live on NEXCHAT Marketplace!', 'success');

    resetAdForm();
    await loadAllAds();

    setTimeout(() => {
      showView('browse');
    }, 1200);
  } catch (err) {
    console.error('Publish ad failed:', err);
    showStatus('Failed to publish advertisement: ' + err.message, 'error');
    showNotification('Error: ' + err.message, 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-rocket"></i> Publish Advertisement';
    }
  }
}

async function deductUserTokens(amount) {
  try {
    userTokens = Math.max(0, userTokens - amount);
    await updateDoc(doc(db, 'users', userUID), { tokens: userTokens });
    updateTokenDisplay();
  } catch (err) {
    console.warn('Token deduction failed:', err);
  }
}

function resetAdForm() {
  document.getElementById('adForm')?.reset();
  const fileInput = document.getElementById('productImage');
  if (fileInput) fileInput.value = '';
  const previewContainer = document.getElementById('imagePreview');
  if (previewContainer) previewContainer.style.display = 'none';
  const uploadArea = document.getElementById('imageUploadArea');
  if (uploadArea) uploadArea.style.display = 'block';
  updateTokenDisplay();
}

// ============================================================
// SHOPPING CART SYSTEM
// ============================================================
function addToCartFromCard(e, adId) {
  if (e) e.stopPropagation();
  const ad = allAds.find(a => a.id === adId);
  if (!ad) return;

  const exist = cartItems.find(i => i.id === ad.id);
  if (exist) {
    exist.quantity++;
  } else {
    cartItems.push({
      id: ad.id,
      productName: ad.productName,
      productPrice: ad.productPrice,
      imageURL: ad.imageURL,
      sellerUID: ad.sellerUID,
      sellerUsername: ad.sellerUsername,
      quantity: 1
    });
  }

  updateCartBadges();
  saveCartToLocalStorage();
  showNotification(`Added "${ad.productName}" to cart!`, 'success');
}

function updateCartBadges() {
  const count = cartItems.reduce((s, i) => s + (i.quantity || 1), 0);
  const headerCount = document.getElementById('cartCount');
  const bottomCount = document.getElementById('bottomCartCount');

  if (headerCount) headerCount.textContent = count;
  if (bottomCount) {
    bottomCount.textContent = count;
    bottomCount.style.display = count > 0 ? 'inline-block' : 'none';
  }
}

function displayCart() {
  const container = document.getElementById('cartItems');
  const summary = document.getElementById('cartSummary');
  if (!container) return;

  if (cartItems.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i class="fa-solid fa-cart-arrow-down"></i></div>
        <p class="empty-title">Your cart is empty</p>
        <p class="empty-sub">Explore the marketplace and tap "Cart" on items you like</p>
        <button type="button" class="btn-primary mt-12" style="max-width: 220px; margin: 12px auto 0;" onclick="window.showMarketView('browse')">
          <i class="fa-solid fa-shop"></i> Explore Marketplace
        </button>
      </div>
    `;
    if (summary) summary.style.display = 'none';
    return;
  }

  container.innerHTML = cartItems.map(item => {
    const imageUrl = item.imageURL || 'logo.jpg';
    return `
      <div class="cart-item">
        <img src="${imageUrl}" class="cart-item-image" alt="${escapeHtml(item.productName)}" onerror="this.onerror=null;this.src='logo.jpg';">
        <div class="cart-item-content">
          <div class="cart-item-name">${escapeHtml(item.productName)}</div>
          <div class="cart-item-price">$${parseFloat(item.productPrice || 0).toFixed(2)}</div>
        </div>
        <div class="cart-item-actions">
          <div class="qty-control">
            <button type="button" class="qty-btn" onclick="window.updateCartItemQuantity('${item.id}', ${item.quantity - 1})">−</button>
            <span class="qty-input">${item.quantity}</span>
            <button type="button" class="qty-btn" onclick="window.updateCartItemQuantity('${item.id}', ${item.quantity + 1})">+</button>
          </div>
          <button type="button" class="remove-cart-btn" onclick="window.removeFromCart('${item.id}')" title="Remove">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  const sub = cartItems.reduce((s, i) => s + (i.productPrice * i.quantity), 0);
  const subtotalEl = document.getElementById('subtotal');
  const totalEl = document.getElementById('totalAmount');
  if (subtotalEl) subtotalEl.textContent = '$' + sub.toFixed(2);
  if (totalEl) totalEl.textContent = '$' + sub.toFixed(2);
  if (summary) summary.style.display = 'flex';
}

function updateCartItemQuantity(id, qty) {
  const item = cartItems.find(i => i.id === id);
  if (item) {
    if (qty <= 0) {
      removeFromCart(id);
    } else {
      item.quantity = qty;
      updateCartBadges();
      saveCartToLocalStorage();
      displayCart();
    }
  }
}

function removeFromCart(id) {
  cartItems = cartItems.filter(i => i.id !== id);
  updateCartBadges();
  saveCartToLocalStorage();
  displayCart();
  showNotification('Item removed from cart.', 'info');
}

function saveCartToLocalStorage() {
  localStorage.setItem('nexchatCart', JSON.stringify(cartItems));
}

function loadCartFromLocalStorage() {
  const s = localStorage.getItem('nexchatCart');
  if (s) {
    try {
      cartItems = JSON.parse(s);
      updateCartBadges();
    } catch (e) {
      cartItems = [];
    }
  }
}

// ============================================================
// DELETE ADVERTISEMENT
// ============================================================
async function deleteAd(e, id) {
  if (e) e.stopPropagation();
  if (confirm('Are you sure you want to delete this advertisement?')) {
    try {
      await deleteDoc(doc(db, 'advertisements', id));
      showNotification('Advertisement deleted.', 'info');
      loadUserAds();
      loadAllAds();
    } catch (err) {
      showNotification('Failed to delete ad: ' + err.message, 'error');
    }
  }
}

// ============================================================
// CLEANUP EXPIRED ADS
// ============================================================
async function checkExpiredAds() {
  try {
    const snap = await getDocs(query(collection(db, 'advertisements'), where('status', '==', 'active')));
    const now = new Date();
    snap.forEach(async d => {
      const data = d.data();
      const exp = data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
      if (exp <= now) {
        await deleteDoc(d.ref);
      }
    });
  } catch (err) {
    // Ignore background expiry failures
  }
}

// ============================================================
// NOTIFICATIONS & STATUS HELPERS
// ============================================================
function showNotification(msg, type = 'info') {
  const c = document.getElementById('notificationContainer');
  if (!c) return;
  const n = document.createElement('div');
  n.className = `notification ${type}`;
  const icon = type === 'success' ? '<i class="fa-solid fa-circle-check"></i>' : (type === 'error' ? '<i class="fa-solid fa-circle-exclamation"></i>' : '<i class="fa-solid fa-bell"></i>');
  n.innerHTML = `${icon} <span>${msg}</span>`;
  c.appendChild(n);
  setTimeout(() => n.remove(), 3200);
}

function showStatus(msg, type = 'info') {
  const el = document.getElementById('uploadStatus');
  if (!el) return;
  el.textContent = msg;
  el.className = `status-message ${type}`;
  el.style.display = 'block';
  if (type !== 'loading') {
    setTimeout(() => { if (el) el.style.display = 'none'; }, 3000);
  }
}

// Expose globals for inline HTML event handlers
window.addToCartFromCard = addToCartFromCard;
window.contactSeller = contactSeller;
window.viewAdDetail = viewAdDetail;
window.deleteAd = deleteAd;
window.updateCartItemQuantity = updateCartItemQuantity;
window.removeFromCart = removeFromCart;

console.log('✅ NEXCHAT Marketplace Initialized');
