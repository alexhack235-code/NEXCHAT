import { auth, db, storage } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc, getDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js';
import { uploadAnyMedia } from './src/js/media-upload.js';

let currentUser = null;
let currentView = 'upload'; // upload, browse, myads, cart, detail
let cartItems = [];
let allAds = [];
let currentDetailAd = null;
let userUID = null;
let userUsername = null;
let userEmail = null;
let userTokens = 0;

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

const DURATION_PLANS = {
  '48': { hours: 48, tokens: 100, label: '48 Hours' },
  '72': { hours: 72, tokens: 150, label: '72 Hours' },
  '144': { hours: 144, tokens: 300, label: '144 Hours (6 Days)' },
  '168': { hours: 168, tokens: 350, label: '168 Hours (7 Days)' }
};

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
        userUsername = userData.username || 'Unknown User';
        userTokens = Number(userData.tokens || 0);
      } else {
        userUsername = user.displayName || 'Unknown User';
        userTokens = 0;
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      userUsername = user.displayName || 'Unknown User';
      userTokens = 0;
    }

    const nexUserEl = document.getElementById('nexUsername');
    const userEmailEl = document.getElementById('userEmail');
    const userUIDEl = document.getElementById('userUID');
    if (nexUserEl) nexUserEl.value = userUsername;
    if (userEmailEl) userEmailEl.value = userEmail;
    if (userUIDEl) userUIDEl.value = userUID;

    updateTokenDisplay();
    loadAllAds();
    loadCartFromLocalStorage();
    checkExpiredAds();
    setInterval(checkExpiredAds, 600000); // Check every 10 mins
  } else {
    window.location.href = 'index.html';
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const radioButtons = document.querySelectorAll('input[name="durationPlan"]');
  radioButtons.forEach(radio => radio.addEventListener('change', updateTokenDisplay));

  document.getElementById('backBtn')?.addEventListener('click', () => { window.location.href = 'chat.html'; });
  document.getElementById('cartBtn')?.addEventListener('click', () => showView('cart'));
  document.getElementById('myAdsBtn')?.addEventListener('click', () => showView('myads'));
  document.getElementById('searchBtn')?.addEventListener('click', () => showView('browse'));
  document.getElementById('createNewAdBtn')?.addEventListener('click', () => {
    showView('upload');
    document.getElementById('adForm')?.reset();
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('imageUploadArea').style.display = 'flex';
    updateTokenDisplay();
  });
  document.getElementById('continueShopping')?.addEventListener('click', () => showView('browse'));
  document.getElementById('backFromDetailBtn')?.addEventListener('click', () => showView('browse'));

  document.getElementById('checkoutBtn')?.addEventListener('click', () => {
    if (cartItems.length > 0) {
      const item = cartItems[0];
      sessionStorage.setItem('targetUserUID', item.sellerUID);
      sessionStorage.setItem('targetUsername', item.sellerUsername);
      sessionStorage.setItem('productName', item.productName);
      sessionStorage.setItem('fromAdvertisement', 'true');

      showNotification('Redirecting to checkout chat...', 'success');
      setTimeout(() => {
        window.location.href = 'chat.html';
      }, 1000);
    }
  });

  document.getElementById('imageUploadArea')?.addEventListener('click', () => document.getElementById('productImage')?.click());
  document.getElementById('productImage')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        showNotification('Max file size is 50MB', 'error');
        return;
      }
      const objectUrl = URL.createObjectURL(file);
      
      const isVideo = file.type.startsWith('video/');
      const previewContainer = document.getElementById('imagePreview');
      
      if (isVideo) {
        previewContainer.innerHTML = `<video src="${objectUrl}" style="max-width:100%; max-height:200px; border-radius:10px;" controls autoplay muted playsinline></video>
                                      <button type="button" class="remove-image-btn" id="removeImageBtn" style="position:absolute; top:10px; right:10px;">Ã—</button>`;
      } else {
        previewContainer.innerHTML = `<img id="previewImg" src="${objectUrl}" style="max-width:100%; max-height:200px; border-radius:10px; object-fit:cover;">
                                      <button type="button" class="remove-image-btn" id="removeImageBtn" style="position:absolute; top:10px; right:10px;">Ã—</button>`;
      }
      
      // Re-attach listener since we overwrote innerHTML
      document.getElementById('removeImageBtn')?.addEventListener('click', (ev) => {
        ev.preventDefault();
        document.getElementById('productImage').value = '';
        document.getElementById('imagePreview').style.display = 'none';
        document.getElementById('imageUploadArea').style.display = 'flex';
      });

      previewContainer.style.display = 'block';
      document.getElementById('imageUploadArea').style.display = 'none';
    }
  });

  document.getElementById('removeImageBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('productImage').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('imageUploadArea').style.display = 'flex';
  });

  document.getElementById('searchAds')?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allAds.filter(ad =>
      ad.productName.toLowerCase().includes(term) ||
      ad.productDescription.toLowerCase().includes(term)
    );
    displayAds(filtered);
  });

  document.getElementById('filterCategory')?.addEventListener('change', (e) => {
    const cat = e.target.value;
    const filtered = cat ? allAds.filter(ad => ad.productCategory === cat) : allAds;
    displayAds(filtered);
  });
});

function updateTokenDisplay() {
  const selectedRadio = document.querySelector('input[name="durationPlan"]:checked');
  if (!selectedRadio) return;
  const plan = DURATION_PLANS[selectedRadio.value];
  const warningEl = document.getElementById('tokenWarning');
  if (!warningEl) return;

  if (userTokens < plan.tokens) {
    warningEl.textContent = `âš ï¸ Insufficient tokens! Need ${plan.tokens}, have ${formatBalanceDisplay(userTokens)}.`;
    warningEl.className = 'token-warning error';
  } else {
    warningEl.textContent = `âœ… Tokens available: ${formatBalanceDisplay(userTokens)} (${plan.tokens} will be used)`;
    warningEl.className = 'token-warning success';
  }
  warningEl.style.display = 'block';
}

function showView(view) {
  currentView = view;
  const views = {
    'upload': 'uploadSection',
    'browse': 'adsListSection',
    'myads': 'myAdsSection',
    'cart': 'cartSection',
    'detail': 'adDetailSection'
  };
  Object.keys(views).forEach(v => {
    const el = document.getElementById(views[v]);
    if (el) el.style.display = (v === view) ? 'block' : 'none';
  });
  if (view === 'browse') displayAds(allAds);
  if (view === 'myads') loadUserAds();
  if (view === 'cart') displayCart();
}

document.getElementById('adForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Professional validation
  const validation = validateAdForm();
  if (!validation.isValid) {
    showNotification(validation.message, 'error');
    return;
  }
  
  const imageFile = document.getElementById('productImage').files[0];
  const selectedRadio = document.querySelector('input[name="durationPlan"]:checked');
  const plan = DURATION_PLANS[selectedRadio.value];

  if (userTokens < plan.tokens) {
    showNotification(`Insufficient tokens. You need ${plan.tokens} tokens but have ${userTokens}.`, 'error');
    return;
  }

  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
  }
  
  showStatus('Uploading image and posting advertisement...', 'loading');

  try {
    // Check for duplicate active ads by same seller
    const duplicateCheck = await checkForDuplicateAd();
    if (duplicateCheck.hasDuplicate) {
      throw new Error('You already have an active advertisement with this product name. Please use a different name or wait for your current ad to expire.');
    }

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
      console.warn('Primary media upload failed, attempting Firebase Storage fallback:', upErr);
      try {
        const storeRef = ref(storage, `advertisements/${userUID}/${Date.now()}_${sanitizeFileName(imageFile.name)}`);
        const snap = await uploadBytes(storeRef, imageFile);
        url = await getDownloadURL(snap.ref);
      } catch (fbErr) {
        console.warn('Firebase Storage failed, using local Base64:', fbErr);
        url = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.readAsDataURL(imageFile);
        });
      }
    }

    const expiresAt = new Date(Date.now() + plan.hours * 60 * 60 * 1000);

    const adData = {
      productName: sanitizeInput(document.getElementById('productName').value.trim()),
      productDescription: sanitizeInput(document.getElementById('productDescription').value.trim()),
      productPrice: parseFloat(document.getElementById('productPrice').value),
      productCategory: document.getElementById('productCategory').value,
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
      views: 0,
      contactCount: 0
    };

    await addDoc(collection(db, 'advertisements'), adData);
    await deductUserTokens(plan.tokens);

    showStatus('Advertisement posted successfully!', 'success');
    showNotification('Your ad is now live and visible to all NEXCHAT users.', 'success');
    
    // Reset form professionally
    document.getElementById('adForm').reset();
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('imageUploadArea').style.display = 'flex';
    document.getElementById('tokenWarning').style.display = 'none';

    await loadAllAds();
    setTimeout(() => showView('browse'), 1500);
  } catch (err) {
    console.error('Advertisement upload failed:', err);
    let message = 'Failed to post advertisement. ';
    
    if (err.code === 'storage/unauthorized' || err.code === 'storage/forbidden') {
      message += 'Storage permissions issue. Please contact support.';
    } else if (err.code === 'permission-denied') {
      message += 'Database permissions issue. Please ensure you are logged in.';
    } else if (err.message.includes('duplicate')) {
      message += err.message;
    } else {
      message += 'Please try again or contact support if the issue persists.';
    }
    
    showStatus(message, 'error');
    showNotification(message, 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '🚀 Post Advertisement';
    }
  }
});

function validateAdForm() {
  const productName = document.getElementById('productName').value.trim();
  const productDescription = document.getElementById('productDescription').value.trim();
  const productPrice = parseFloat(document.getElementById('productPrice').value);
  const productCategory = document.getElementById('productCategory').value;
  const imageFile = document.getElementById('productImage').files[0];

  if (!imageFile) {
    return { isValid: false, message: 'Please select a product image or video.' };
  }
  
  if (!imageFile.type.startsWith('image/') && !imageFile.type.startsWith('video/')) {
    return { isValid: false, message: 'Please select a valid image or video file.' };
  }
  
  if (imageFile.size > 50 * 1024 * 1024) {
    return { isValid: false, message: 'File size must be less than 50MB.' };
  }

  if (!productName || productName.length < 3) {
    return { isValid: false, message: 'Product name must be at least 3 characters long.' };
  }
  
  if (productName.length > 100) {
    return { isValid: false, message: 'Product name cannot exceed 100 characters.' };
  }

  if (productDescription.length > 500) {
    return { isValid: false, message: 'Product description cannot exceed 500 characters.' };
  }

  if (isNaN(productPrice) || productPrice < 0) {
    return { isValid: false, message: 'Please enter a valid price (must be 0 or greater).' };
  }
  
  if (productPrice > 999999.99) {
    return { isValid: false, message: 'Price cannot exceed $999,999.99.' };
  }

  if (!productCategory) {
    return { isValid: false, message: 'Please select a product category.' };
  }

  return { isValid: true };
}

async function checkForDuplicateAd() {
  const productName = document.getElementById('productName').value.trim().toLowerCase();
  try {
    const q = query(
      collection(db, 'advertisements'),
      where('sellerUID', '==', userUID),
      where('status', '==', 'active')
    );
    const snap = await getDocs(q);
    const hasDuplicate = snap.docs.some(doc => 
      doc.data().productName.toLowerCase() === productName
    );
    return { hasDuplicate };
  } catch (err) {
    console.error('Error checking for duplicates:', err);
    return { hasDuplicate: false }; // Allow posting if check fails
  }
}

function sanitizeInput(input) {
  // Basic XSS prevention - remove potentially dangerous characters
  return input.replace(/[<>\"'&]/g, '');
}

function sanitizeFileName(filename) {
  // Remove special characters and spaces from filename
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
}

async function loadAllAds() {
  try {
    const snap = await getDocs(query(collection(db, 'advertisements'), where('status', '==', 'active')));
    allAds = [];
    const now = new Date();
    snap.forEach(d => {
      const data = d.data();
      const exp = data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
      if (exp > now) allAds.push({ id: d.id, ...data });
    });
    allAds.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    if (currentView === 'browse') displayAds(allAds);
  } catch (err) {
    console.error('Failed to load advertisements:', err);
    const message = err.code === 'permission-denied' || (err.message && err.message.includes('Missing or insufficient permissions'))
      ? 'Unable to load ads: check Firestore permissions and authentication.'
      : 'Unable to load ads: ' + err.message;
    showNotification(message, 'error');
  }
}

async function loadUserAds() {
  if (!userUID) return;
  try {
    const snap = await getDocs(query(collection(db, 'advertisements'), where('sellerUID', '==', userUID)));
    const userAds = [];
    snap.forEach(d => userAds.push({ id: d.id, ...d.data() }));
    displayUserAds(userAds);
  } catch (err) { console.error(err); }
}

function displayAds(ads) {
  const container = document.getElementById('adsList');
  if (!container) return;
  if (ads.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>ðŸ“­</p><p>No ads found.</p></div>';
    return;
  }
  container.innerHTML = ads.map(ad => {
    const exp = ad.expiresAt?.toDate ? ad.expiresAt.toDate() : new Date(ad.expiresAt);
    const hours = Math.max(0, Math.ceil((exp - new Date()) / 3600000));
    const imageUrl = ad.imageURL || 'logo.jpg';
    const isVideo = ad.mediaType === 'video' || imageUrl.includes('.mp4');
    
    const mediaHtml = isVideo 
      ? `<video src="${imageUrl}" class="ad-card-image" style="object-fit: cover;" autoplay muted loop playsinline></video>`
      : `<img src="${imageUrl}" class="ad-card-image" onerror="this.onerror=null;this.src='logo.jpg';">`;

    return `
            <div class="ad-card" onclick="viewAdDetail('${ad.id}')">
                ${mediaHtml}
                <div class="ad-card-category">${getCategoryEmoji(ad.productCategory)} ${ad.productCategory}</div>
                <div class="ad-card-expiry">â±ï¸ ${hours}h</div>
                <div class="ad-card-content">
                    <h3 class="ad-card-name">${escapeHtml(ad.productName)}</h3>
                    <p class="ad-card-description">${escapeHtml(ad.productDescription)}</p>
                    <div class="ad-card-price">$${ad.productPrice.toFixed(2)}</div>
                    <div class="ad-card-seller">ðŸ‘¤ ${escapeHtml(ad.sellerUsername)}</div>
                    <div class="ad-card-actions">
                        <button class="ad-card-btn cart-btn" onclick="addToCartFromCard(event, '${ad.id}')">ðŸ›’ Cart</button>
                        <button class="ad-card-btn" onclick="contactSeller(event, '${ad.id}')">ðŸ’¬ Chat</button>
                    </div>
                </div>
            </div>
        `;
  }).join('');
}

function displayUserAds(ads) {
  const container = document.getElementById('myAdsList');
  if (!container) return;
  if (ads.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>ðŸ“­</p><p>No ads posted.</p></div>';
    return;
  }
  container.innerHTML = ads.map(ad => {
    const exp = ad.expiresAt?.toDate ? ad.expiresAt.toDate() : new Date(ad.expiresAt);
    const expired = exp <= new Date();
    const imageUrl = ad.imageURL || 'logo.jpg';
    const isVideo = ad.mediaType === 'video' || imageUrl.includes('.mp4');
    
    const mediaHtml = isVideo 
      ? `<video src="${imageUrl}" class="ad-card-image" style="object-fit: cover;" autoplay muted loop playsinline></video>`
      : `<img src="${imageUrl}" class="ad-card-image" onerror="this.onerror=null;this.src='logo.jpg';">`;

    return `
            <div class="ad-card ${expired ? 'expired' : ''}">
                ${mediaHtml}
                <div class="ad-card-category">${getCategoryEmoji(ad.productCategory)} ${ad.productCategory}</div>
                ${expired ? '<div class="ad-card-expired-badge">EXPIRED</div>' : ''}
                <div class="ad-card-content">
                    <h3 class="ad-card-name">${escapeHtml(ad.productName)}</h3>
                    <div class="ad-card-price">$${ad.productPrice.toFixed(2)}</div>
                    <div class="ad-card-actions">
                        <button class="ad-card-btn" onclick="viewAdDetail('${ad.id}')">ðŸ‘ï¸ View</button>
                        <button class="ad-card-btn delete-btn" style="background:#ff4d4d; color:white;" onclick="deleteAd(event, '${ad.id}')">ðŸ—‘ï¸ Delete</button>
                    </div>
                </div>
            </div>
        `;
  }).join('');
}

function viewAdDetail(adId) {
  currentDetailAd = allAds.find(ad => ad.id === adId) || null;
  if (!currentDetailAd) return;
  
  const detailImageContainer = document.getElementById('detailImageContainer');
  if (detailImageContainer) {
    const isVideo = currentDetailAd.mediaType === 'video' || (currentDetailAd.imageURL && currentDetailAd.imageURL.includes('.mp4'));
    if (isVideo) {
      detailImageContainer.innerHTML = `<video src="${currentDetailAd.imageURL}" style="width:100%; max-height:400px; border-radius:12px; object-fit:cover;" controls autoplay playsinline></video>`;
    } else {
      detailImageContainer.innerHTML = `<img src="${currentDetailAd.imageURL || 'logo.jpg'}" id="detailImage" style="width:100%; max-height:400px; border-radius:12px; object-fit:cover;" onerror="this.onerror=null;this.src='logo.jpg';">`;
    }
  }
  
  document.getElementById('detailName').textContent = currentDetailAd.productName;
  document.getElementById('detailDescription').textContent = currentDetailAd.productDescription;
  document.getElementById('detailPrice').textContent = '$' + currentDetailAd.productPrice.toFixed(2);
  document.getElementById('detailCategory').textContent = currentDetailAd.productCategory;
  document.getElementById('detailCategoryBadge').textContent = getCategoryEmoji(currentDetailAd.productCategory) + ' ' + currentDetailAd.productCategory;
  document.getElementById('detailUsername').textContent = currentDetailAd.sellerUsername;
  document.getElementById('detailEmail').textContent = currentDetailAd.sellerEmail;
  document.getElementById('detailUID').textContent = currentDetailAd.sellerUID;
  showView('detail');
}

function addToCartFromCard(e, adId) {
  e.stopPropagation();
  const ad = allAds.find(a => a.id === adId);
  if (ad) {
    const exist = cartItems.find(i => i.id === ad.id);
    if (exist) exist.quantity++;
    else cartItems.push({ ...ad, quantity: 1 });
    updateCartBadge();
    saveCartToLocalStorage();
    showNotification('Added to cart', 'success');
  }
}

function updateCartBadge() {
  const count = cartItems.reduce((s, i) => s + i.quantity, 0);
  const el = document.getElementById('cartCount');
  if (el) el.textContent = count;
}

function displayCart() {
  const container = document.getElementById('cartItems');
  const summary = document.getElementById('cartSummary');
  if (!container) return;
  if (cartItems.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>ðŸ›’</p><p>Cart is empty.</p></div>';
    if (summary) summary.style.display = 'none';
    return;
  }
  container.innerHTML = cartItems.map(item => {
    const imageUrl = item.imageURL || 'logo.jpg';
    return `
        <div class="cart-item">
            <img src="${imageUrl}" class="cart-item-image" onerror="this.onerror=null;this.src='logo.jpg';">
            <div class="cart-item-content">
                <div class="cart-item-name">${escapeHtml(item.productName)}</div>
                <div class="cart-item-price">$${item.productPrice.toFixed(2)}</div>
            </div>
            <div class="cart-item-actions">
                <div class="qty-control">
                    <button class="qty-btn" onclick="updateCartItemQuantity('${item.id}', ${item.quantity - 1})">âˆ’</button>
                    <span class="qty-input">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateCartItemQuantity('${item.id}', ${item.quantity + 1})">+</button>
                </div>
                <button class="remove-cart-btn" onclick="removeFromCart('${item.id}')">Remove</button>
            </div>
        </div>
    `;
  }).join('');
  const sub = cartItems.reduce((s, i) => s + (i.productPrice * i.quantity), 0);
  document.getElementById('subtotal').textContent = '$' + sub.toFixed(2);
  document.getElementById('totalAmount').textContent = '$' + (sub * 1.1).toFixed(2);
  if (summary) summary.style.display = 'block';
}

function updateCartItemQuantity(id, qty) {
  const item = cartItems.find(i => i.id === id);
  if (item) {
    item.quantity = Math.max(1, qty);
    updateCartBadge();
    saveCartToLocalStorage();
    displayCart();
  }
}

function removeFromCart(id) {
  cartItems = cartItems.filter(i => i.id !== id);
  updateCartBadge();
  saveCartToLocalStorage();
  displayCart();
}

async function deleteAd(e, id) {
  e.stopPropagation();
  if (confirm('Delete ad?')) {
    await deleteDoc(doc(db, 'advertisements', id));
    loadUserAds();
    loadAllAds();
  }
}

function contactSeller(e, id) {
  if (e) e.stopPropagation();
  const ad = id ? (allAds.find(a => a.id === id) || currentDetailAd) : currentDetailAd;
  if (ad) {
    sessionStorage.setItem('targetUserUID', ad.sellerUID);
    sessionStorage.setItem('targetUsername', ad.sellerUsername);
    sessionStorage.setItem('productName', ad.productName);
    sessionStorage.setItem('fromAdvertisement', 'true');
    window.location.href = 'chat.html';
  }
}

async function checkExpiredAds() {
  const snap = await getDocs(query(collection(db, 'advertisements'), where('status', '==', 'active')));
  const now = new Date();
  snap.forEach(async d => {
    const data = d.data();
    const exp = data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
    if (exp <= now) await deleteDoc(d.ref);
  });
}

function saveCartToLocalStorage() { localStorage.setItem('nexchatCart', JSON.stringify(cartItems)); }
function loadCartFromLocalStorage() {
  const s = localStorage.getItem('nexchatCart');
  if (s) { cartItems = JSON.parse(s); updateCartBadge(); }
}

function getCategoryEmoji(cat) {
  const m = {
    'electronics': 'ðŸ–¥ï¸',
    'clothing': 'ðŸ‘•',
    'books': 'ðŸ“š',
    'sports': 'âš½',
    'furniture': 'ðŸª‘',
    'food': 'ðŸ”',
    'services': 'ðŸ› ï¸',
    'other': 'ðŸ“¦'
  };
  return m[cat] || 'ðŸ“¦';
}

function escapeHtml(t) {
  const m = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return t ? t.replace(/[&<>"']/g, x => m[x]) : '';
}

function showNotification(m, t = 'info') {
  const c = document.getElementById('notificationContainer');
  const n = document.createElement('div');
  n.className = `notification ${t}`;
  n.innerHTML = `<span>${m}</span>`;
  c.appendChild(n);
  setTimeout(() => n.remove(), 3000);
}

function showStatus(m, t = 'info') {
  const el = document.getElementById('uploadStatus');
  if (!el) return;
  el.textContent = m;
  el.className = `status-message ${t}`;
  el.style.display = 'block';
  if (t !== 'loading') setTimeout(() => el.style.display = 'none', 3000);
}

window.addToCartFromCard = addToCartFromCard;
window.contactSeller = contactSeller;
window.viewAdDetail = viewAdDetail;
window.deleteAd = deleteAd;
window.updateCartItemQuantity = updateCartItemQuantity;
window.removeFromCart = removeFromCart;

console.log('âœ… Marketplace Initialized');

