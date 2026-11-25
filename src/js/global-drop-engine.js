/**
 * =============================================================================
 * NEXCHAT GLOBAL DROP ENGINE (src/js/global-drop-engine.js)
 * High-Performance Obsidian Cyber-Green Microblogging & Public Broadcast Matrix
 * =============================================================================
 */

import { auth, db } from '../../firebase-config.js';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { uploadAnyMedia } from './media-upload.js';

function compressImageToDataUrl(file, maxDimension = 1200, quality = 0.72) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      return reject(new Error('File is not an image'));
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        canvas.width = 0;
        canvas.height = 0;
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

class GlobalDropEngine {
  constructor() {
    this.currentMode = 'radar'; // 'radar' | 'following' | 'local' | 'nodes'
    this.currentTopic = 'all';  // 'all' | 'tech' | 'cybersec' | etc.
    this.unsubscribeFeed = null;
    this.selectedMediaFiles = [];
    this.recordedVoiceBlob = null;
    this.codeSnippet = null;
    this.activePoll = null;
    this.selectedTtl = 'permanent';
    this.currentReplyDrop = null;
    this.unsubscribeReplies = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecordingVoice = false;
    this.cachedDrops = [];
    this.userLocation = null;
    this.activeDropLocation = null;
    this.selectedGeoFilter = null;
    this.currentProfileUid = null;
    this.currentProfileTab = 'drops';
    this.cachedProfileDrops = [];
  }


  // ---------------------------------------------------------------------------
  // VAULT & TIMELINE PERSISTENCE (BOOKMARKS, HISTORY, RESHARES)
  // ---------------------------------------------------------------------------
  getBookmarkedDropIds() {
    try {
      const stored = localStorage.getItem('nex_bookmarked_drop_ids');
      return stored ? JSON.parse(stored) : [];
    } catch (_) {
      return [];
    }
  }

  isDropBookmarked(dropId) {
    if (!dropId) return false;
    const ids = this.getBookmarkedDropIds();
    return ids.includes(dropId);
  }

  toggleDropBookmark(dropId) {
    if (!dropId) return false;
    const ids = this.getBookmarkedDropIds();
    const idx = ids.indexOf(dropId);
    let isNow = false;
    if (idx >= 0) {
      ids.splice(idx, 1);
      isNow = false;
    } else {
      ids.unshift(dropId);
      isNow = true;
    }
    try {
      localStorage.setItem('nex_bookmarked_drop_ids', JSON.stringify(ids.slice(0, 500)));
    } catch (_) {}
    return isNow;
  }

  recordDropHistory(dropId) {
    if (!dropId) return;
    try {
      const stored = localStorage.getItem('nex_drop_history_ids');
      const ids = stored ? JSON.parse(stored) : [];
      const idx = ids.indexOf(dropId);
      if (idx >= 0) ids.splice(idx, 1);
      ids.unshift(dropId);
      localStorage.setItem('nex_drop_history_ids', JSON.stringify(ids.slice(0, 300)));
    } catch (_) {}
  }

  getHistoryDropIds() {
    try {
      const stored = localStorage.getItem('nex_drop_history_ids');
      return stored ? JSON.parse(stored) : [];
    } catch (_) {
      return [];
    }
  }

  getResharedDropIds() {
    try {
      const stored = localStorage.getItem('nex_reshared_drop_ids');
      return stored ? JSON.parse(stored) : [];
    } catch (_) {
      return [];
    }
  }

  toggleDropReshared(dropId) {
    if (!dropId) return false;
    try {
      const ids = this.getResharedDropIds();
      const idx = ids.indexOf(dropId);
      let isEchoed = false;
      if (idx >= 0) {
        ids.splice(idx, 1);
      } else {
        ids.unshift(dropId);
        isEchoed = true;
      }
      localStorage.setItem('nex_reshared_drop_ids', JSON.stringify(ids.slice(0, 300)));
      return isEchoed;
    } catch (_) {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // INITIALIZATION & EVENT BINDINGS
  // ---------------------------------------------------------------------------
  init() {
    if (this._isInitialized) return;
    this._isInitialized = true;
    console.log('[GLOBAL DROP] Initializing Global Drop Microblogging Engine with Geo-Locator...');
    this.bindHeaderTabs();
    this.bindTopicChips();
    this.bindComposer();
    this.bindRepliesDrawer();
    this.bindMobileFab();
    this.bindAccountDrawer();
    this.bindGlobalEvents();
    this.loadSideWidgets();
    this.initGeoLocator();
    this.initUserProfile();
    this.initHeaderAutoHide();
    this.syncTheme();
  }

  initHeaderAutoHide() {
    const container = document.getElementById('globalDropContainer');
    const header = document.querySelector('.top-header');
    if (!container || !header) return;

    let lastScrollTop = 0;
    let isHidden = false;

    const handleScroll = (scrollTop) => {
      const app = document.querySelector('.app');
      const activeSection = app?.dataset?.activeSection || document.body.dataset?.activeSection;
      if (activeSection !== 'global-drop') return;

      if (scrollTop <= 15) {
        if (isHidden) {
          header.classList.remove('header-hidden');
          document.body.classList.remove('drop-feed-scrolled-down');
          isHidden = false;
        }
      } else if (scrollTop > lastScrollTop + 8 && scrollTop > 35) {
        if (!isHidden) {
          header.classList.add('header-hidden');
          document.body.classList.add('drop-feed-scrolled-down');
          isHidden = true;
        }
      } else if (scrollTop < lastScrollTop - 8) {
        if (isHidden) {
          header.classList.remove('header-hidden');
          document.body.classList.remove('drop-feed-scrolled-down');
          isHidden = false;
        }
      }
      lastScrollTop = Math.max(0, scrollTop);
    };

    container.addEventListener('scroll', () => {
      handleScroll(container.scrollTop);
    }, { passive: true });

    window.addEventListener('scroll', () => {
      handleScroll(window.scrollY || document.documentElement.scrollTop);
    }, { passive: true });
  }

  getUID() {
    return auth?.currentUser?.uid || window.myUID || localStorage.getItem('myUID') || localStorage.getItem('auth_uid') || '';
  }

  getUsername() {
    return auth?.currentUser?.displayName || window.myUsername || localStorage.getItem('myUsername') || 'Transmitter';
  }

  getAvatar() {
    return auth?.currentUser?.photoURL || window.myProfilePic || localStorage.getItem('myProfilePic') || 'logo.jpg';
  }

  // ---------------------------------------------------------------------------
  // 1. HEADER & MODE SWITCHING
  // ---------------------------------------------------------------------------
  // 1. HEADER & MODE SWITCHING
  // ---------------------------------------------------------------------------
  bindHeaderTabs() {
    const tabs = document.querySelectorAll('.x-tab-btn, .global-drop-mode-pill');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const mode = tab.getAttribute('data-mode') || 'radar';
        this.currentMode = mode;
        if (mode === 'local' && !this.userLocation) {
          this.detectUserLocation(false).then(() => {
            this.filterAndRenderCachedDrops();
          });
        } else {
          this.filterAndRenderCachedDrops();
        }
      });
    });

    // Refresh feed button
    document.getElementById('globalDropRefreshBtn')?.addEventListener('click', () => {
      const icon = document.querySelector('#globalDropRefreshBtn i');
      if (icon) icon.classList.add('fa-spin');
      this.subscribeFeed();
      setTimeout(() => {
        if (icon) icon.classList.remove('fa-spin');
      }, 700);
    });
  }

  bindTopicChips() {
    const chips = document.querySelectorAll('.x-topic-chip, .global-drop-topic-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const topic = chip.getAttribute('data-topic') || 'all';
        this.currentTopic = topic;
        this.filterAndRenderCachedDrops();
      });
    });
  }

  // ---------------------------------------------------------------------------
  // 2. DISPATCH COMPOSER (NEW DROP)
  // ---------------------------------------------------------------------------
  bindComposer() {
    if (this._composerBound) return;
    this._composerBound = true;

    const textarea = document.getElementById('globalDropTextarea');
    const charRingProgress = document.getElementById('globalDropCharProgress');
    const transmitBtn = document.getElementById('globalDropTransmitBtn');
    const mediaInput = document.getElementById('globalDropMediaFileInput');
    const addMediaBtn = document.getElementById('globalDropAddMediaBtn');
    const addCodeBtn = document.getElementById('globalDropAddCodeBtn');
    const addVoiceBtn = document.getElementById('globalDropAddVoiceBtn');
    const codeDrawer = document.getElementById('globalDropCodeDrawer');
    const voiceDrawer = document.getElementById('globalDropVoiceDrawer');
    const ttlSelect = document.getElementById('globalDropTtlSelect');
    const topicSelect = document.getElementById('globalDropTopicSelect');

    // Update avatar on composer
    const userAvatar = document.getElementById('globalDropComposerAvatar');
    if (userAvatar) userAvatar.src = this.getAvatar();

    // Auto-grow textarea & character limit ring
    textarea?.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 240) + 'px';

      const length = textarea.value.length;
      const max = 500;
      const radius = 10;
      const circumference = 2 * Math.PI * radius; // ~62.83
      const offset = circumference - (Math.min(length, max) / max) * circumference;

      if (charRingProgress) {
        charRingProgress.style.strokeDashoffset = offset;
        if (length > max) {
          charRingProgress.style.stroke = '#ef4444';
        } else if (length > max - 50) {
          charRingProgress.style.stroke = '#f59e0b';
        } else {
          charRingProgress.style.stroke = 'var(--drop-accent)';
        }
      }

      if (transmitBtn) {
        transmitBtn.disabled = (length === 0 && this.selectedMediaFiles.length === 0 && !this.codeSnippet && !this.recordedVoiceBlob);
      }
    });

    // Media attachment triggers
    addMediaBtn?.addEventListener('click', () => mediaInput?.click());
    mediaInput?.addEventListener('change', (e) => this.handleMediaSelection(e));

    // Code snippet drawer toggle
    addCodeBtn?.addEventListener('click', () => {
      if (!codeDrawer) return;
      const isOpen = codeDrawer.style.display === 'flex';
      codeDrawer.style.display = isOpen ? 'none' : 'flex';
      addCodeBtn.classList.toggle('active', !isOpen);
      if (!isOpen) {
        document.getElementById('globalDropCodeTextarea')?.focus();
      }
    });

    // Voice recording drawer toggle
    addVoiceBtn?.addEventListener('click', () => {
      if (!voiceDrawer) return;
      const isOpen = voiceDrawer.style.display === 'flex';
      voiceDrawer.style.display = isOpen ? 'none' : 'flex';
      addVoiceBtn.classList.toggle('active', !isOpen);
    });

    // Voice record button in composer
    const recBtn = document.getElementById('globalDropVoiceRecordBtn');
    recBtn?.addEventListener('click', () => this.toggleVoiceRecording());

    // TTL selector
    ttlSelect?.addEventListener('change', (e) => {
      this.selectedTtl = e.target.value || 'permanent';
    });

    // Transmit drop button
    transmitBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.transmitDrop();
    });
  }

  handleMediaSelection(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Maximum 4 media items per drop
    const total = this.selectedMediaFiles.length + files.length;
    if (total > 4) {
      if (window.showNotif) window.showNotif('Maximum 4 media attachments per Drop', 'warning');
      e.target.value = '';
      return;
    }

    files.forEach(f => {
      if (f.size > 100 * 1024 * 1024) {
        if (window.showNotif) window.showNotif(`File ${f.name} exceeds 100MB limit`, 'error');
        return;
      }
      this.selectedMediaFiles.push(f);
    });

    e.target.value = '';
    this.renderComposerMediaPreviews();
    const transmitBtn = document.getElementById('globalDropTransmitBtn');
    if (transmitBtn) transmitBtn.disabled = false;
  }

  renderComposerMediaPreviews() {
    const container = document.getElementById('globalDropMediaPreviews');
    if (!container) return;
    container.innerHTML = '';

    if (!this.selectedMediaFiles.length) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    const count = Math.min(this.selectedMediaFiles.length, 4);
    const grid = document.createElement('div');
    grid.className = 'x-composer-media-grid';
    grid.setAttribute('data-count', String(count));

    this.selectedMediaFiles.forEach((file, index) => {
      const item = document.createElement('div');
      item.className = 'x-preview-item global-drop-media-preview-item';

      const fileUrl = URL.createObjectURL(file);
      if (this._isVideoFile(file)) {
        const vid = document.createElement('video');
        vid.src = fileUrl;
        vid.controls = true;
        vid.muted = true;
        vid.playsInline = true;
        vid.setAttribute('playsinline', '');
        vid.setAttribute('webkit-playsinline', '');
        vid.preload = 'auto';
        vid.loop = true;
        item.appendChild(vid);
        vid.play().catch(() => {});
      } else {
        const img = document.createElement('img');
        img.src = fileUrl;
        img.alt = 'Attached Media Preview';
        item.appendChild(img);
      }

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'x-composer-media-remove-btn global-drop-media-remove-btn';
      removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
      removeBtn.title = 'Remove';
      removeBtn.setAttribute('aria-label', 'Remove media');
      removeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.selectedMediaFiles.splice(index, 1);
        this.renderComposerMediaPreviews();
        const textarea = document.getElementById('globalDropTextarea');
        const transmitBtn = document.getElementById('globalDropTransmitBtn');
        if (transmitBtn) {
          transmitBtn.disabled = (!textarea?.value.trim() && this.selectedMediaFiles.length === 0 && !this.codeSnippet && !this.recordedVoiceBlob);
        }
      });

      item.appendChild(removeBtn);
      grid.appendChild(item);
    });

    container.appendChild(grid);
  }

  // ---------------------------------------------------------------------------
  // VOICE RECORDING IN COMPOSER
  // ---------------------------------------------------------------------------
  async toggleVoiceRecording() {
    const btn = document.getElementById('globalDropVoiceRecordBtn');
    const timerText = document.getElementById('globalDropVoiceTimer');

    if (!this.isRecordingVoice) {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaRecorder = new MediaRecorder(stream);
        this.audioChunks = [];

        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) this.audioChunks.push(e.data);
        };

        this.mediaRecorder.onstop = () => {
          this.recordedVoiceBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          stream.getTracks().forEach(t => t.stop());
          if (btn) btn.classList.remove('recording');
          if (timerText) timerText.textContent = 'Voice Note Ready';
          const transmitBtn = document.getElementById('globalDropTransmitBtn');
          if (transmitBtn) transmitBtn.disabled = false;
        };

        this.mediaRecorder.start();
        this.isRecordingVoice = true;
        if (btn) btn.classList.add('recording');
        if (timerText) timerText.textContent = 'Recording... (Tap stop)';
      } catch (err) {
        console.error('[GLOBAL DROP] Microphone error:', err);
        if (window.showNotif) window.showNotif('Microphone access denied or unavailable', 'error');
      }
    } else {
      // Stop recording
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
      this.isRecordingVoice = false;
    }
  }

  // ---------------------------------------------------------------------------
  // 2B. GEO-LOCATOR & SECTOR DETECTION
  // ---------------------------------------------------------------------------
  initGeoLocator() {
    const addLocBtn = document.getElementById('globalDropAddLocationBtn');
    const removeLocBtn = document.getElementById('globalDropRemoveLocationBtn');
    const locRow = document.getElementById('globalDropComposerLocationRow');
    const locLabel = document.getElementById('globalDropLocationLabel');

    // Restore cached location from localStorage if fresh (< 12 hours)
    try {
      const cached = localStorage.getItem('nexchat_user_geo');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && (Date.now() - (parsed.timestamp || 0) < 12 * 3600 * 1000)) {
          this.userLocation = parsed;
          this.updateLocalTabLabel();
        }
      }
    } catch (e) {
      console.warn('[GLOBAL DROP GEO] Cache read error:', e);
    }

    // Proactively detect user location in background if not known
    if (!this.userLocation) {
      this.detectUserLocation(false);
    }

    // Tag location button in composer toolbar
    addLocBtn?.addEventListener('click', async () => {
      if (locRow) locRow.style.display = 'flex';
      if (locLabel) locLabel.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Detecting sector...';

      const loc = await this.detectUserLocation(true);
      if (loc) {
        this.activeDropLocation = loc;
        if (locLabel) locLabel.textContent = loc.label || `${loc.city}, ${loc.countryCode}`;
      } else {
        if (locLabel) locLabel.textContent = 'Global Matrix (Unknown)';
        this.activeDropLocation = { city: 'Global', country: 'Earth', countryCode: 'GL', label: 'Global Matrix' };
      }
    });

    // Remove location tag chip
    removeLocBtn?.addEventListener('click', () => {
      this.activeDropLocation = null;
      if (locRow) locRow.style.display = 'none';
      if (locLabel) locLabel.textContent = '';
    });
  }

  async detectUserLocation(interactive = false) {
    if (this.userLocation && !interactive) {
      return this.userLocation;
    }

    // 1. Try Browser HTML5 Geolocation
    const geoPromise = new Promise((resolve) => {
      if (!navigator.geolocation) {
        return resolve(null);
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // Privacy rounding: 2 decimal places (~1.1 km accuracy)
          const lat = Math.round(pos.coords.latitude * 100) / 100;
          const lng = Math.round(pos.coords.longitude * 100) / 100;
          resolve({ lat, lng });
        },
        () => resolve(null),
        { timeout: 5000, maximumAge: 300000, enableHighAccuracy: false }
      );
    });

    try {
      const coords = await geoPromise;
      if (coords) {
        // Reverse geocode via free reverse geocoding API or fallback
        try {
          const resp = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.lat}&longitude=${coords.lng}&localityLanguage=en`, { signal: AbortSignal.timeout(4000) });
          if (resp.ok) {
            const data = await resp.json();
            const city = data.city || data.locality || data.principalSubdivision || 'Local Sector';
            const country = data.countryName || 'Global';
            const countryCode = data.countryCode || '';
            const label = city + (countryCode ? `, ${countryCode}` : '');
            this.userLocation = {
              city,
              country,
              countryCode,
              label,
              lat: coords.lat,
              lng: coords.lng,
              timestamp: Date.now()
            };
            localStorage.setItem('nexchat_user_geo', JSON.stringify(this.userLocation));
            this.updateLocalTabLabel();
            return this.userLocation;
          }
        } catch (revErr) {
          console.warn('[GLOBAL DROP GEO] Reverse geocode error:', revErr);
        }
      }
    } catch (e) {
      console.warn('[GLOBAL DROP GEO] Geolocation error:', e);
    }

    // 2. Fallback to IP Geolocation
    const ipLoc = await this.fallbackIpLocation();
    if (ipLoc) {
      this.userLocation = ipLoc;
      localStorage.setItem('nexchat_user_geo', JSON.stringify(this.userLocation));
      this.updateLocalTabLabel();
      return this.userLocation;
    }

    // 3. Fallback to Timezone inference
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const parts = tz.split('/');
      const city = parts[parts.length - 1]?.replace(/_/g, ' ') || 'Local';
      this.userLocation = {
        city,
        country: 'Global',
        countryCode: '',
        label: city,
        lat: null,
        lng: null,
        timestamp: Date.now()
      };
      this.updateLocalTabLabel();
      return this.userLocation;
    } catch (tzErr) {
      return null;
    }
  }

  async fallbackIpLocation() {
    try {
      const res = await fetch('https://freeipapi.com/api/json', { signal: AbortSignal.timeout(3500) });
      if (res.ok) {
        const data = await res.json();
        if (data && data.cityName) {
          return {
            city: data.cityName || 'Local Sector',
            country: data.countryName || '',
            countryCode: data.countryCode || '',
            label: `${data.cityName}, ${data.countryCode || ''}`,
            lat: data.latitude ? Math.round(data.latitude * 100) / 100 : null,
            lng: data.longitude ? Math.round(data.longitude * 100) / 100 : null,
            timestamp: Date.now()
          };
        }
      }
    } catch (e) {
      // ignore
    }

    try {
      const res2 = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3500) });
      if (res2.ok) {
        const data2 = await res2.json();
        if (data2 && data2.city) {
          return {
            city: data2.city || 'Local Sector',
            country: data2.country_name || '',
            countryCode: data2.country_code || '',
            label: `${data2.city}, ${data2.country_code || ''}`,
            lat: data2.latitude ? Math.round(data2.latitude * 100) / 100 : null,
            lng: data2.longitude ? Math.round(data2.longitude * 100) / 100 : null,
            timestamp: Date.now()
          };
        }
      }
    } catch (e2) {
      // ignore
    }

    return null;
  }

  updateLocalTabLabel() {
    const labelSpan = document.getElementById('globalDropLocalTabLabel');
    if (!labelSpan) return;
    if (this.userLocation?.city) {
      labelSpan.innerHTML = `<i class="fa-solid fa-location-crosshairs"></i> Near ${this.userLocation.city}`;
    } else {
      labelSpan.innerHTML = `<i class="fa-solid fa-location-crosshairs"></i> Near you`;
    }
  }

  getRawDistanceKm(lat1, lon1, lat2, lon2) {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const dist = this.getRawDistanceKm(lat1, lon1, lat2, lon2);
    if (!isFinite(dist)) return null;
    if (dist < 1) return '< 1 km away';
    if (dist < 10) return `${dist.toFixed(1)} km away`;
    return `${Math.round(dist)} km away`;
  }

  // ---------------------------------------------------------------------------
  // 3. TRANSMIT DROP (PUBLISH TO COLD-VAULT & FIRESTORE)
  // ---------------------------------------------------------------------------
  async transmitDrop() {
    if (this.isTransmitting) return;

    const textarea = document.getElementById('globalDropTextarea');
    const transmitBtn = document.getElementById('globalDropTransmitBtn');
    const topicSelect = document.getElementById('globalDropTopicSelect');
    const codeTextarea = document.getElementById('globalDropCodeTextarea');
    const codeLangSelect = document.getElementById('globalDropCodeLangSelect');

    const content = textarea?.value.trim() || '';
    let uid = this.getUID();

    if (!uid) {
      uid = localStorage.getItem('local_guest_uid') || `guest_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      localStorage.setItem('local_guest_uid', uid);
    }

    // Code snippet payload
    const rawCode = codeTextarea?.value.trim();
    if (rawCode) {
      this.codeSnippet = {
        code: rawCode,
        language: codeLangSelect?.value || 'javascript'
      };
    } else {
      this.codeSnippet = null;
    }

    if (!content && !this.selectedMediaFiles.length && !this.codeSnippet && !this.recordedVoiceBlob) {
      if (window.showNotif) window.showNotif('Drop cannot be empty. Add text, media, or code.', 'warning');
      return;
    }

    // Synchronously lock and disable button
    this.isTransmitting = true;
    if (transmitBtn) {
      transmitBtn.disabled = true;
      transmitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Posting...</span>';
    }

    try {
      // 1. Upload media files to Cold-Vault
      const mediaUrls = [];
      let detectedMediaType = 'none';

      for (const file of this.selectedMediaFiles) {
        const isVideo = this._isVideoFile(file);
        try {
          const timeoutDuration = isVideo ? 120000 : 18000;
          const uploadPromise = uploadAnyMedia(file, { folder: 'global_drops', uid, preferImageKit: true });
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Media upload timed out')), timeoutDuration));
          const res = await Promise.race([uploadPromise, timeoutPromise]).catch(async (err) => {
            console.warn('[GLOBAL DROP] Media upload timed out or failed, using client fallback:', err);
            if (!isVideo && file.type && file.type.startsWith('image/')) {
              const fallbackUrl = await compressImageToDataUrl(file);
              return { url: fallbackUrl, downloadUrl: fallbackUrl };
            }
            throw err;
          });
          const url = res?.url || res?.downloadUrl;
          if (!url || url.startsWith('blob:') || (isVideo && url.startsWith('data:') && url.length > 750000)) {
            throw new Error(isVideo
              ? 'Video upload failed across cloud vaults or exceeded inline fallback size. Please check connection and retry.'
              : 'Media upload returned an invalid temporary URL.');
          }
          mediaUrls.push({
            url: url,
            type: isVideo ? 'video' : 'image',
            name: file.name || (isVideo ? 'drop_video.mp4' : 'drop_image.jpg')
          });
          if (isVideo) detectedMediaType = 'video';
          else if (detectedMediaType !== 'video') detectedMediaType = 'image';
        } catch (mErr) {
          console.error('[GLOBAL DROP] Media vault error:', mErr);
          if (!isVideo && file.type && file.type.startsWith('image/')) {
            try {
              const fallbackUrl = await compressImageToDataUrl(file);
              if (fallbackUrl) {
                mediaUrls.push({
                  url: fallbackUrl,
                  type: 'image',
                  name: file.name
                });
                if (detectedMediaType !== 'video') detectedMediaType = 'image';
              }
            } catch (_) {}
          } else {
            throw new Error(mErr?.message || 'Could not upload video to media vault. Please retry.');
          }
        }
      }

      // 2. Upload voice blob if present
      let voiceUrl = null;
      if (this.recordedVoiceBlob) {
        try {
          const voiceFile = new File([this.recordedVoiceBlob], `drop_voice_${Date.now()}.webm`, { type: 'audio/webm' });
          const vRes = await uploadAnyMedia(voiceFile, { folder: 'global_drops', uid, preferImageKit: true });
          voiceUrl = vRes.url || vRes.downloadUrl;
          detectedMediaType = 'voice';
        } catch (vErr) {
          console.error('[GLOBAL DROP] Voice vault error:', vErr);
        }
      }

      if (this.codeSnippet && detectedMediaType === 'none') {
        detectedMediaType = 'code';
      }

      // 3. Extract hashtags
      const hashtags = (content.match(/#[a-zA-Z0-9_]+/g) || []).map(h => h.toLowerCase());
      const selectedTopic = topicSelect?.value || 'general';

      // 4. Calculate TTL
      const now = Date.now();
      let expiresAtMs = null;
      if (this.selectedTtl === '24h') expiresAtMs = now + 86400000;
      else if (this.selectedTtl === '48h') expiresAtMs = now + 172800000;
      else if (this.selectedTtl === '7d') expiresAtMs = now + 604800000;

      // Calculate author metadata (tenure, location, rank)
      const userJoinedAt = parseInt(localStorage.getItem('userCreatedAtMs') || localStorage.getItem('auth_time') || (now - 86400000 * 90), 10);
      const tenureInfo = this.calculateUserRankAndTenure(userJoinedAt);
      const authorLoc = this.activeDropLocation?.city || this.activeDropLocation?.label || this.userLocation?.city || null;

      const firstRemoteVideo = mediaUrls.find(m => m.type === 'video' && /^https?:\/\//i.test(m.url) && m.url.length <= 2048)?.url || null;

      // 5. Build Drop Document Payload
      const dropDoc = {
        authorId: uid,
        userId: uid,
        authorName: this.getUsername(),
        authorHandle: (this.getUsername() || 'user').toLowerCase().replace(/\s+/g, '_'),
        authorPhoto: this.getAvatar(),
        authorVerified: true,
        authorLocation: authorLoc,
        authorTenure: tenureInfo.shortBadge,
        authorRank: tenureInfo.rank,
        authorJoinedAtMs: userJoinedAt,
        content: content,
        location: this.activeDropLocation || null,
        videoUrl: firstRemoteVideo,
        mediaUrls: mediaUrls.map(m => m.url),
        mediaItems: mediaUrls,
        mediaType: detectedMediaType,
        voiceUrl: voiceUrl,
        codeSnippet: this.codeSnippet,
        topic: selectedTopic,
        tags: hashtags,
        ttl: this.selectedTtl,
        expiresAtMs: expiresAtMs,
        signalsCount: 0,
        likesCount: 0,
        likes: [],
        echoesCount: 0,
        repostsCount: 0,
        echoes: [],
        repliesCount: 0,
        viewsCount: 1,
        pinned: false,
        createdAt: serverTimestamp(),
        createdAtMs: now
      };

      // 6. Write to Firestore
      if (db) {
        await addDoc(collection(db, 'global_drops'), dropDoc);
      }

      // Reset composer
      if (textarea) {
        textarea.value = '';
        textarea.style.height = 'auto';
      }
      if (codeTextarea) codeTextarea.value = '';
      const codeDrawer = document.getElementById('globalDropCodeDrawer');
      if (codeDrawer) codeDrawer.style.display = 'none';
      const voiceDrawer = document.getElementById('globalDropVoiceDrawer');
      if (voiceDrawer) voiceDrawer.style.display = 'none';
      this.selectedMediaFiles = [];
      this.recordedVoiceBlob = null;
      this.codeSnippet = null;
      this.activeDropLocation = null;
      const locRow = document.getElementById('globalDropComposerLocationRow');
      if (locRow) locRow.style.display = 'none';
      const locLabel = document.getElementById('globalDropLocationLabel');
      if (locLabel) locLabel.textContent = '';
      this.renderComposerMediaPreviews();

      if (window.showNotif) {
        window.showNotif('Global Drop transmitted to the network!', 'success', 3000);
      }
    } catch (err) {
      console.error('[GLOBAL DROP] Transmission error:', err);
      if (window.showNotif) {
        window.showNotif('Failed to transmit Drop: ' + (err.message || 'Unknown network error'), 'error');
      }
    } finally {
      setTimeout(() => {
        this.isTransmitting = false;
        if (transmitBtn) {
          transmitBtn.disabled = false;
          transmitBtn.innerHTML = '<span>Post</span>';
        }
      }, 1200);
    }
  }

  // ---------------------------------------------------------------------------
  // 4. REAL-TIME FEED SUBSCRIPTION
  // ---------------------------------------------------------------------------
  subscribeFeed() {
    if (!db) return;

    if (this.unsubscribeFeed) {
      this.unsubscribeFeed();
      this.unsubscribeFeed = null;
    }

    const streamContainer = document.getElementById('globalDropStreamList');
    if (streamContainer) {
      streamContainer.innerHTML = `
        <div style="padding: 40px 20px; text-align: center; color: var(--drop-text-muted);">
          <i class="fa-solid fa-satellite fa-spin" style="font-size: 28px; color: var(--drop-accent); margin-bottom: 12px; display: block;"></i>
          <span>Synchronizing Global Radar...</span>
        </div>
      `;
    }

    try {
      const dropsRef = collection(db, 'global_drops');
      let q = query(dropsRef, orderBy('createdAtMs', 'desc'), limit(50));

      this.unsubscribeFeed = onSnapshot(q, (snapshot) => {
        const drops = [];
        const now = Date.now();
        const seenDocIds = new Set();
        const seenDropSignatures = new Set();

        snapshot.forEach(docSnap => {
          if (seenDocIds.has(docSnap.id)) return;
          seenDocIds.add(docSnap.id);

          const data = docSnap.data();
          // Filter out expired TTL drops
          if (data.expiresAtMs && data.expiresAtMs < now) {
            return;
          }

          // Twin deduplication: guard against duplicate documents created by rapid submit events
          const sig = `${data.authorId || ''}_${(data.content || '').slice(0, 60)}_${Math.round((data.createdAtMs || 0) / 4000)}`;
          if (seenDropSignatures.has(sig)) {
            return;
          }
          seenDropSignatures.add(sig);

          drops.push({ id: docSnap.id, ...data });
        });

        this.cachedDrops = drops;
        this.filterAndRenderCachedDrops();
      }, (err) => {
        console.warn('[GLOBAL DROP] Feed listener notice:', err);
        if (streamContainer) {
          streamContainer.innerHTML = `
            <div style="padding: 40px 20px; text-align: center; color: var(--drop-text-muted);">
              <i class="fa-solid fa-earth-americas" style="font-size: 32px; color: var(--drop-card-border); margin-bottom: 12px; display: block;"></i>
              <p style="font-weight: 600; margin-bottom: 6px;">No drops received yet</p>
              <span style="font-size: 13px;">Be the first transmitter to broadcast a Global Drop!</span>
            </div>
          `;
        }
      });
    } catch (err) {
      console.error('[GLOBAL DROP] Query error:', err);
    }
  }

  filterAndRenderCachedDrops() {
    let list = [...this.cachedDrops];

    // Filter by mode
    if (this.currentMode === 'following') {
      const myUid = this.getUID();
      list = list.filter(d => d.authorId === myUid);
    } else if (this.currentMode === 'bookmarks') {
      const bookmarkedIds = this.getBookmarkedDropIds();
      list = list.filter(d => bookmarkedIds.includes(d.id));
    } else if (this.currentMode === 'loved') {
      const myUid = this.getUID();
      list = list.filter(d => Array.isArray(d.likes) && d.likes.includes(myUid));
    } else if (this.currentMode === 'reshared') {
      const resharedIds = this.getResharedDropIds();
      const myUid = this.getUID();
      list = list.filter(d => resharedIds.includes(d.id) || (Array.isArray(d.echoes) && d.echoes.includes(myUid)));
    } else if (this.currentMode === 'history') {
      const historyIds = this.getHistoryDropIds();
      list = list.filter(d => historyIds.includes(d.id));
    } else if (this.currentMode === 'local') {
      // Local Radar mode: filter drops with location tag near user or active geo filter
      if (this.selectedGeoFilter) {
        const filterLower = this.selectedGeoFilter.toLowerCase();
        list = list.filter(d => d.location && (
          (d.location.city && d.location.city.toLowerCase() === filterLower) ||
          (d.location.countryCode && d.location.countryCode.toLowerCase() === filterLower) ||
          (d.location.label && d.location.label.toLowerCase().includes(filterLower))
        ));
      } else if (this.userLocation) {
        const uLat = this.userLocation.lat;
        const uLng = this.userLocation.lng;
        const uCity = (this.userLocation.city || '').toLowerCase();
        const uCountry = (this.userLocation.countryCode || '').toLowerCase();

        list = list.filter(d => {
          if (!d.location) return false;
          // Match by city
          if (uCity && d.location.city && d.location.city.toLowerCase() === uCity) return true;
          // Match by country code
          if (uCountry && d.location.countryCode && d.location.countryCode.toLowerCase() === uCountry) return true;
          // Match by coordinates (< 500 km)
          if (uLat != null && uLng != null && d.location.lat != null && d.location.lng != null) {
            const dist = this.getRawDistanceKm(uLat, uLng, d.location.lat, d.location.lng);
            return dist <= 500;
          }
          return false;
        });
      } else {
        // Fallback: show drops that have any location tag
        list = list.filter(d => Boolean(d.location));
      }
    } else if (this.selectedGeoFilter) {
      // Radar / For You mode with active geo filter
      const filterLower = this.selectedGeoFilter.toLowerCase();
      list = list.filter(d => d.location && (
        (d.location.city && d.location.city.toLowerCase() === filterLower) ||
        (d.location.countryCode && d.location.countryCode.toLowerCase() === filterLower) ||
        (d.location.label && d.location.label.toLowerCase().includes(filterLower))
      ));
    }

    // Filter by topic
    if (this.currentTopic && this.currentTopic !== 'all') {
      const topicTag = '#' + this.currentTopic.replace('#', '').toLowerCase();
      list = list.filter(d => {
        const hasTopic = (d.topic && d.topic.toLowerCase() === this.currentTopic.toLowerCase());
        const hasTag = (Array.isArray(d.tags) && d.tags.some(t => t.toLowerCase() === topicTag));
        return hasTopic || hasTag;
      });
    }

    this.renderDrops(list);
  }

  // ---------------------------------------------------------------------------
  // 5. DROP CARDS RENDERING (OFFICIAL X CONTINUOUS TIMELINE ARCHITECTURE)
  // ---------------------------------------------------------------------------
  renderDrops(drops) {
    const container = document.getElementById('globalDropStreamList');
    if (!container) return;

    container.innerHTML = '';
    const myUid = this.getUID();

    // Render active sector filter banner if filtered
    if (this.selectedGeoFilter) {
      const banner = document.createElement('div');
      banner.className = 'x-geo-filter-banner';
      banner.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; background: rgba(0, 255, 136, 0.08); border-bottom: 1px solid rgba(0, 255, 136, 0.2); font-size: 13px; color: var(--x-green);';
      banner.innerHTML = `
        <span style="display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-location-dot"></i>
          <span>Filtered sector: <strong>${this.escapeHtml(this.selectedGeoFilter)}</strong></span>
        </span>
        <button type="button" id="globalDropClearGeoFilterBtn" style="background: transparent; border: none; color: #ffffff; cursor: pointer; font-size: 12px; font-weight: 600; text-decoration: underline;">
          Clear filter
        </button>
      `;
      container.appendChild(banner);

      banner.querySelector('#globalDropClearGeoFilterBtn')?.addEventListener('click', () => {
        this.selectedGeoFilter = null;
        this.filterAndRenderCachedDrops();
      });
    }

    if (!drops.length) {
      const emptyDiv = document.createElement('div');
      if (this.currentMode === 'local') {
        const sectorName = this.userLocation?.city || 'your area';
        emptyDiv.innerHTML = `
          <div style="padding: 60px 20px; text-align: center; color: var(--x-text-secondary); border-bottom: 1px solid var(--x-border);">
            <i class="fa-solid fa-location-crosshairs" style="font-size: 38px; color: var(--x-green); margin-bottom: 14px; display: block; opacity: 0.85; filter: drop-shadow(0 0 14px var(--x-green-glow));"></i>
            <h3 style="font-size: 19px; font-weight: 800; color: #ffffff; margin-bottom: 6px;">No drops in your sector yet</h3>
            <p style="font-size: 14px; color: var(--x-text-secondary); max-width: 400px; margin: 0 auto; line-height: 1.45;">
              Be the pioneer to transmit the first Global Drop from ${this.escapeHtml(sectorName)}! Tag your sector with the location pin above to light up the radar.
            </p>
          </div>
        `;
      } else if (this.currentMode === 'bookmarks') {
        emptyDiv.innerHTML = `
          <div style="padding: 60px 20px; text-align: center; color: var(--x-text-secondary); border-bottom: 1px solid var(--x-border);">
            <i class="fa-regular fa-bookmark" style="font-size: 38px; color: var(--x-green); margin-bottom: 14px; display: block; opacity: 0.85; filter: drop-shadow(0 0 14px var(--x-green-glow));"></i>
            <h3 style="font-size: 19px; font-weight: 800; color: #ffffff; margin-bottom: 6px;">Save Drops for later</h3>
            <p style="font-size: 14px; color: var(--x-text-secondary); max-width: 380px; margin: 0 auto; line-height: 1.45;">Don't let the good ones fly away! Bookmark Drops to easily find them again in the future.</p>
          </div>
        `;
      } else if (this.currentMode === 'loved') {
        emptyDiv.innerHTML = `
          <div style="padding: 60px 20px; text-align: center; color: var(--x-text-secondary); border-bottom: 1px solid var(--x-border);">
            <i class="fa-regular fa-heart" style="font-size: 38px; color: var(--x-green); margin-bottom: 14px; display: block; opacity: 0.85; filter: drop-shadow(0 0 14px var(--x-green-glow));"></i>
            <h3 style="font-size: 19px; font-weight: 800; color: #ffffff; margin-bottom: 6px;">You haven't loved any Drops yet</h3>
            <p style="font-size: 14px; color: var(--x-text-secondary); max-width: 380px; margin: 0 auto; line-height: 1.45;">When you like a Drop, it will appear here.</p>
          </div>
        `;
      } else if (this.currentMode === 'reshared') {
        emptyDiv.innerHTML = `
          <div style="padding: 60px 20px; text-align: center; color: var(--x-text-secondary); border-bottom: 1px solid var(--x-border);">
            <i class="fa-solid fa-retweet" style="font-size: 38px; color: var(--x-green); margin-bottom: 14px; display: block; opacity: 0.85; filter: drop-shadow(0 0 14px var(--x-green-glow));"></i>
            <h3 style="font-size: 19px; font-weight: 800; color: #ffffff; margin-bottom: 6px;">No reshared Drops</h3>
            <p style="font-size: 14px; color: var(--x-text-secondary); max-width: 380px; margin: 0 auto; line-height: 1.45;">Drops you reshare to your network will appear here.</p>
          </div>
        `;
      } else if (this.currentMode === 'history') {
        emptyDiv.innerHTML = `
          <div style="padding: 60px 20px; text-align: center; color: var(--x-text-secondary); border-bottom: 1px solid var(--x-border);">
            <i class="fa-solid fa-clock-rotate-left" style="font-size: 38px; color: var(--x-green); margin-bottom: 14px; display: block; opacity: 0.85; filter: drop-shadow(0 0 14px var(--x-green-glow));"></i>
            <h3 style="font-size: 19px; font-weight: 800; color: #ffffff; margin-bottom: 6px;">No watch history</h3>
            <p style="font-size: 14px; color: var(--x-text-secondary); max-width: 380px; margin: 0 auto; line-height: 1.45;">Drops you view in your stream will be recorded here.</p>
          </div>
        `;
      } else {
        emptyDiv.innerHTML = `
          <div style="padding: 60px 20px; text-align: center; color: var(--x-text-secondary); border-bottom: 1px solid var(--x-border);">
            <i class="fa-solid fa-earth-americas" style="font-size: 38px; color: var(--x-green); margin-bottom: 14px; display: block; opacity: 0.85; filter: drop-shadow(0 0 14px var(--x-green-glow));"></i>
            <h3 style="font-size: 19px; font-weight: 800; color: #ffffff; margin-bottom: 6px;">Welcome to Global Drop!</h3>
            <p style="font-size: 14px; color: var(--x-text-secondary); max-width: 380px; margin: 0 auto; line-height: 1.45;">This is the best place to see what is happening in the cyber matrix right now. Transmit your first drop above!</p>
          </div>
        `;
      }
      container.appendChild(emptyDiv);
      return;
    }

    drops.forEach(drop => {
      const card = document.createElement('article');
      card.className = 'x-drop-row global-drop-card';
      card.id = `drop-card-${drop.id}`;
      card.dataset.dropId = drop.id;

      // Time format
      const timeStr = this.formatRelativeTime(drop.createdAtMs || (drop.createdAt?.seconds ? drop.createdAt.seconds * 1000 : Date.now()));
      const safeAuthor = this.escapeHtml(drop.authorName || 'Transmitter');
      const safeHandle = this.escapeHtml(drop.authorHandle || (drop.authorName ? drop.authorName.toLowerCase().replace(/\s+/g, '_') : 'node'));
      const safeAvatar = drop.authorPhoto || 'logo.jpg';
      const isSignaled = Array.isArray(drop.likes) && drop.likes.includes(myUid);
      const isEchoed = Array.isArray(drop.echoes) && drop.echoes.includes(myUid);
      const isBookmarked = this.isDropBookmarked(drop.id);
      this.recordDropHistory(drop.id);

      // Pinned / TTL badge
      let ttlBadge = '';
      if (drop.ttl && drop.ttl !== 'permanent') {
        ttlBadge = `<span class="x-drop-ttl-badge" title="Auto-purges after ${drop.ttl}"><i class="fa-regular fa-clock"></i> ${drop.ttl}</span>`;
      }

      // Geo Location Badge
      let geoBadgeHtml = '';
      if (drop.location && (drop.location.city || drop.location.label)) {
        const locLabel = this.escapeHtml(drop.location.city || drop.location.label);
        let distBadge = '';
        if (this.userLocation?.lat != null && this.userLocation?.lng != null && drop.location.lat != null && drop.location.lng != null) {
          const distStr = this.calculateDistanceKm(this.userLocation.lat, this.userLocation.lng, drop.location.lat, drop.location.lng);
          if (distStr) {
            distBadge = `<span class="x-drop-distance">&middot; ${distStr}</span>`;
          }
        }
        geoBadgeHtml = `
          <button type="button" class="x-drop-geo-badge" data-geo-city="${locLabel}" title="Filter stream by ${locLabel}">
            <i class="fa-solid fa-location-dot"></i>
            <span>${locLabel}</span>
            ${distBadge}
          </button>
        `;
      }

      // Text with highlighted tags
      const formattedContent = this.formatDropText(drop.content || '');

      // Media Grid HTML
      const mediaHtml = this.buildMediaGridHtml(drop);

      // Code Box HTML
      const codeHtml = this.buildCodeBoxHtml(drop.codeSnippet);

      // Voice Player HTML
      const voiceHtml = drop.voiceUrl ? `
        <div class="x-drop-voice-player global-drop-voice-player">
          <button type="button" class="x-drop-voice-play-btn global-drop-voice-play-btn" data-url="${drop.voiceUrl}">
            <i class="fa-solid fa-play"></i>
          </button>
          <div class="x-drop-voice-wave-bars global-drop-voice-wave-bars">
            ${Array.from({ length: 28 }).map((_, i) => `<div class="x-drop-voice-wave-bar" style="height: ${4 + (i % 7) * 3}px;"></div>`).join('')}
          </div>
          <span style="font-size: 11px; color: var(--x-text-secondary); font-family: var(--x-mono); letter-spacing: 0.5px;">AUDIO DROP</span>
        </div>
      ` : '';

      // Author Tenure & Location chips for timeline
      const authorTenureBadge = drop.authorTenure ? `<span class="x-drop-tenure-chip" title="NEXCHAT Member Tenure"><i class="fa-solid fa-shield-halved"></i> ${this.escapeHtml(drop.authorTenure)}</span>` : '';
      const authorLocationBadge = (!geoBadgeHtml && drop.authorLocation) ? `<span class="x-drop-location-chip" title="Location"><i class="fa-solid fa-location-dot"></i> ${this.escapeHtml(drop.authorLocation)}</span>` : '';

      card.innerHTML = `
        <div class="x-drop-avatar-col">
          <div class="x-avatar-wrap">
            <img src="${safeAvatar}" alt="${safeAuthor}" class="x-drop-avatar" onerror="this.src='logo.jpg'" />
            <div class="x-avatar-status-beacon"></div>
          </div>
        </div>

        <div class="x-drop-main-col">
          <div class="x-drop-header">
            <div class="x-drop-author-info">
              <span class="x-drop-author-name">${safeAuthor}</span>
              <i class="fa-solid fa-circle-check x-drop-verified" title="Verified Cyber Node"></i>
              <span class="x-drop-author-handle">@${safeHandle}</span>
              <span class="x-drop-dot">&middot;</span>
              <span class="x-drop-time">${timeStr}</span>
              ${authorTenureBadge}
              ${authorLocationBadge}
              ${ttlBadge}
              ${geoBadgeHtml}
            </div>
            <button type="button" class="x-drop-more-btn global-drop-card-more-btn" data-drop-id="${drop.id}" title="More options">
              <i class="fa-solid fa-ellipsis"></i>
            </button>
          </div>

          ${formattedContent ? `<div class="x-drop-text">${formattedContent}</div>` : ''}
          ${mediaHtml}
          ${codeHtml}
          ${voiceHtml}

          <!-- X Action Row (Comment, Retweet, Like, Views, Bookmark, Share) -->
          <div class="x-action-row">
            <!-- 1. Reply -->
            <button type="button" class="x-action-btn x-action-reply global-drop-action-btn discuss" data-drop-id="${drop.id}" title="Reply">
              <div class="x-action-icon-circle">
                <i class="fa-regular fa-comment"></i>
              </div>
              <span class="x-action-count reply-count">${drop.repliesCount || 0}</span>
            </button>

            <!-- 2. Repost / Echo -->
            <button type="button" class="x-action-btn x-action-echo global-drop-action-btn echo ${isEchoed ? 'active' : ''}" data-drop-id="${drop.id}" title="Repost">
              <div class="x-action-icon-circle">
                <i class="fa-solid fa-retweet"></i>
              </div>
              <span class="x-action-count echo-count">${drop.echoesCount || 0}</span>
            </button>

            <!-- 3. Like / Signal -->
            <button type="button" class="x-action-btn x-action-like global-drop-action-btn signal ${isSignaled ? 'active' : ''}" data-drop-id="${drop.id}" title="Like">
              <div class="x-action-icon-circle">
                <i class="${isSignaled ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}"></i>
              </div>
              <span class="x-action-count signal-count">${drop.signalsCount || drop.likesCount || (Array.isArray(drop.likes) ? drop.likes.length : 0)}</span>
            </button>

            <!-- 4. Views / Analytics -->
            <button type="button" class="x-action-btn x-action-views" data-drop-id="${drop.id}" title="Views">
              <div class="x-action-icon-circle">
                <i class="fa-solid fa-chart-simple"></i>
              </div>
              <span class="x-action-count">${drop.viewsCount || (drop.likesCount ? drop.likesCount * 4 + 18 : '84')}</span>
            </button>

            <!-- 5. Bookmark & Share -->
            <div class="x-action-group-right">
              <button type="button" class="x-action-btn x-action-bookmark global-drop-action-btn bookmark ${isBookmarked ? 'active' : ''}" data-drop-id="${drop.id}" title="Bookmark">
                <div class="x-action-icon-circle">
                  <i class="${isBookmarked ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark'}"></i>
                </div>
              </button>
              <button type="button" class="x-action-btn x-action-share global-drop-action-btn forward" data-drop-id="${drop.id}" title="Share">
                <div class="x-action-icon-circle">
                  <i class="fa-solid fa-arrow-up-from-bracket"></i>
                </div>
              </button>
            </div>
          </div>
        </div>
      `;

      // Click avatar or author name to open User Profile
      card.querySelector('.x-drop-avatar-col')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openUserProfile(drop.authorId || drop.userId, {
          name: drop.authorName,
          handle: drop.authorHandle,
          photo: drop.authorPhoto
        });
      });
      card.querySelector('.x-drop-author-name')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openUserProfile(drop.authorId || drop.userId, {
          name: drop.authorName,
          handle: drop.authorHandle,
          photo: drop.authorPhoto
        });
      });
      card.querySelector('.x-drop-author-handle')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openUserProfile(drop.authorId || drop.userId, {
          name: drop.authorName,
          handle: drop.authorHandle,
          photo: drop.authorPhoto
        });
      });

      // Click anywhere on card (except interactive elements) to open Thread
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        if (e.target.closest('button, a, video, audio, input, textarea, select, .x-action-btn, .x-drop-geo-badge, .global-drop-card-more-btn, .x-drop-code-copy-btn')) {
          return;
        }
        this.openRepliesDrawer(drop);
      });

      // Event Listeners for actions
      this.bindCardActions(card, drop);
      this.hydrateDropVideos(card);
      container.appendChild(card);
    });
  }

  _isVideoFile(file) {
    if (!file) return false;
    return Boolean(
      (file.type && file.type.startsWith('video/')) ||
      /\.(mp4|webm|mov|m4v|mkv|3gp|ogv|ogg)$/i.test(file.name || '')
    );
  }

  _isVideoMediaUrl(url, item, drop) {
    if (!url || typeof url !== 'string') return false;
    if (item && item.type === 'video') return true;
    if (/\.(mp4|webm|mov|m4v|mkv|3gp|ogv|ogg)([?#].*)?$/i.test(url)) return true;
    if (/\/video\/upload\/|\/video\/|^data:video\//i.test(url)) return true;
    if (drop?.videoUrl && drop.videoUrl === url) return true;
    if (drop?.mediaType === 'video' && !/\.(jpe?g|png|gif|webp|avif|svg)([?#].*)?$/i.test(url) && !/^data:image\//i.test(url)) {
      return true;
    }
    return false;
  }

  _withVideoPosterHint(url) {
    if (!url || typeof url !== 'string') return url;
    if (/^https?:\/\//i.test(url) && !url.includes('#')) {
      return `${url}#t=0.001`;
    }
    return url;
  }

  hydrateDropVideos(rootEl) {
    if (!rootEl) return;
    rootEl.querySelectorAll('.x-media-cell.is-video-cell').forEach((cell) => {
      const video = cell.querySelector('video');
      const playOverlay = cell.querySelector('.x-video-play-overlay-btn');
      if (!video || video.dataset.nexDropVideoBound === 'true') return;
      video.dataset.nexDropVideoBound = 'true';

      const syncOverlay = () => {
        if (!playOverlay) return;
        playOverlay.classList.toggle('is-hidden', !video.paused && !video.ended);
      };

      const togglePlay = (e) => {
        e.stopPropagation();
        if (video.paused || video.ended) {
          video.muted = false;
          video.play().then(syncOverlay).catch(() => {
            video.muted = true;
            video.play().then(syncOverlay).catch(() => {});
          });
        } else {
          video.pause();
          syncOverlay();
        }
      };

      playOverlay?.addEventListener('click', togglePlay);
      cell.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        e.stopPropagation();
        if (e.target !== video) {
          togglePlay(e);
        }
      });

      video.addEventListener('play', syncOverlay);
      video.addEventListener('playing', syncOverlay);
      video.addEventListener('pause', syncOverlay);
      video.addEventListener('ended', syncOverlay);
      video.addEventListener('error', () => {
        if (playOverlay) playOverlay.style.display = 'none';
        if (!cell.querySelector('.x-video-error-fallback')) {
          const errBox = document.createElement('div');
          errBox.className = 'x-video-error-fallback';
          errBox.innerHTML = '<i class="fa-solid fa-video-slash"></i><span>Video clip unavailable or still processing</span>';
          cell.appendChild(errBox);
        }
      });
    });
  }

  buildMediaGridHtml(drop) {
    const rawUrls = Array.isArray(drop.mediaUrls) && drop.mediaUrls.length
      ? drop.mediaUrls
      : (drop.videoUrl ? [drop.videoUrl] : []);
    if (!rawUrls.length) return '';

    const mediaItems = Array.isArray(drop.mediaItems) ? drop.mediaItems : [];
    const count = Math.min(rawUrls.length, 4);
    const gridClass = `grid-${count}`;

    const cellsHtml = rawUrls.slice(0, 4).map((url, idx) => {
      const item = mediaItems[idx] || mediaItems.find(m => m && m.url === url);
      const isVideo = this._isVideoMediaUrl(url, item, drop);
      if (isVideo) {
        const safeUrl = this.escapeHtml(url);
        const videoSrc = this.escapeHtml(this._withVideoPosterHint(url));
        return `
          <div class="x-media-cell global-drop-media-cell is-video-cell" data-media-url="${safeUrl}">
            <video src="${videoSrc}" controls preload="auto" playsinline webkit-playsinline controlsList="nodownload"></video>
            <button type="button" class="x-video-play-overlay-btn" aria-label="Play video" title="Play video">
              <i class="fa-solid fa-play"></i>
            </button>
          </div>
        `;
      }
      const safeImgUrl = this.escapeHtml(url);
      return `
        <div class="x-media-cell global-drop-media-cell" data-media-url="${safeImgUrl}">
          <img src="${safeImgUrl}" alt="Drop Attachment" loading="lazy" />
        </div>
      `;
    }).join('');

    return `<div class="x-media-grid global-drop-media-grid ${gridClass}">${cellsHtml}</div>`;
  }

  buildCodeBoxHtml(codeSnippet) {
    if (!codeSnippet || !codeSnippet.code) return '';
    const safeCode = this.escapeHtml(codeSnippet.code);
    const lang = this.escapeHtml(codeSnippet.language || 'code');

    return `
      <div class="x-drop-code-box global-drop-code-box">
        <div class="x-drop-code-header">
          <div class="x-drop-code-dots">
            <span class="x-dot-r"></span>
            <span class="x-dot-y"></span>
            <span class="x-dot-g"></span>
          </div>
          <div class="x-drop-code-meta">
            <span class="x-drop-code-lang">${lang}</span>
            <button type="button" class="x-drop-code-copy-btn" onclick="navigator.clipboard.writeText(decodeURIComponent('${encodeURIComponent(codeSnippet.code)}')).then(() => { if(window.showNotif) window.showNotif('Code snippet copied to clipboard', 'success'); })">
              <i class="fa-regular fa-copy"></i> Copy
            </button>
          </div>
        </div>
        <pre class="x-drop-code-pre"><code>${safeCode}</code></pre>
      </div>
    `;
  }

  bindCardActions(card, drop) {
    // 1. Signal / Like
    card.querySelector('.global-drop-action-btn.signal')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleSignal(drop.id, card);
    });

    // 2. Echo / Retransmit
    card.querySelector('.global-drop-action-btn.echo')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleEcho(drop.id, card);
    });

    // 3. Discussion / Reply
    card.querySelector('.global-drop-action-btn.discuss')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openRepliesDrawer(drop);
    });

    // 4. Forward to Chat
    card.querySelector('.global-drop-action-btn.forward')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.shareDropToChat(drop);
    });

    // 5. Bookmark
    card.querySelector('.global-drop-action-btn.bookmark')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const btn = card.querySelector('.global-drop-action-btn.bookmark');
      const isNow = this.toggleDropBookmark(drop.id);
      btn.classList.toggle('active', isNow);
      const icon = btn.querySelector('i');
      if (icon) {
        icon.className = isNow ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark';
      }
      if (window.showNotif) window.showNotif(isNow ? 'Drop saved to Bookmarks' : 'Removed from Bookmarks', 'success');
      if (this.currentMode === 'bookmarks') {
        this.filterAndRenderCachedDrops();
      }
    });

    // 6. Voice playback trigger
    const voiceBtn = card.querySelector('.global-drop-voice-play-btn');
    if (voiceBtn) {
      voiceBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.playVoiceAudio(voiceBtn, voiceBtn.getAttribute('data-url'));
      });
    }

    // 7. More options (Delete if owner)
    card.querySelector('.global-drop-card-more-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openDropOptionsMenu(drop);
    });

    // 8. Geo location badge filter click
    card.querySelector('.x-drop-geo-badge')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const city = e.currentTarget.dataset.geoCity;
      if (city) {
        if (this.selectedGeoFilter === city) {
          this.selectedGeoFilter = null;
          if (window.showNotif) window.showNotif('Showing all drops', 'info');
        } else {
          this.selectedGeoFilter = city;
          if (window.showNotif) window.showNotif(`Filtering stream to sector: ${city}`, 'success');
        }
        this.filterAndRenderCachedDrops();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 6. INTERACTIVE ACTIONS (SIGNAL, ECHO, SHARE)
  // ---------------------------------------------------------------------------
  async toggleSignal(dropId, card) {
    const uid = this.getUID();
    if (!uid) {
      if (window.showNotif) window.showNotif('Please sign in to pulse signals', 'warning');
      return;
    }

    const btn = card.querySelector('.global-drop-action-btn.signal');
    const countEl = btn?.querySelector('.signal-count');
    const icon = btn?.querySelector('i');
    const isActive = btn?.classList.contains('active');

    // Optimistic UI
    if (btn) btn.classList.toggle('active');
    if (icon) icon.className = !isActive ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
    if (countEl) {
      const cur = parseInt(countEl.textContent || '0', 10);
      countEl.textContent = !isActive ? cur + 1 : Math.max(0, cur - 1);
    }

    try {
      const dropRef = doc(db, 'global_drops', dropId);
      if (!isActive) {
        await updateDoc(dropRef, {
          likes: arrayUnion(uid),
          signalsCount: increment(1),
          likesCount: increment(1)
        });
      } else {
        await updateDoc(dropRef, {
          likes: arrayRemove(uid),
          signalsCount: increment(-1),
          likesCount: increment(-1)
        });
      }
    } catch (err) {
      console.error('[GLOBAL DROP] Signal error:', err);
    }
  }

  async toggleEcho(dropId, card) {
    const uid = this.getUID();
    if (!uid) return;

    const btn = card.querySelector('.global-drop-action-btn.echo');
    const countEl = btn?.querySelector('.echo-count');
    const isActive = btn?.classList.contains('active');

    if (btn) btn.classList.toggle('active');
    if (countEl) {
      const cur = parseInt(countEl.textContent || '0', 10);
      countEl.textContent = !isActive ? cur + 1 : Math.max(0, cur - 1);
    }

    try {
      const dropRef = doc(db, 'global_drops', dropId);
      if (!isActive) {
        await updateDoc(dropRef, {
          echoes: arrayUnion(uid),
          echoesCount: increment(1),
          repostsCount: increment(1)
        });
        if (window.showNotif) window.showNotif('Echoed to your network transmitters!', 'success');
      } else {
        await updateDoc(dropRef, {
          echoes: arrayRemove(uid),
          echoesCount: increment(-1),
          repostsCount: increment(-1)
        });
      }
    } catch (err) {
      console.error('[GLOBAL DROP] Echo error:', err);
    }
  }

  shareDropToChat(drop) {
    const link = `${window.location.origin}/chat?drop=${drop.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
      if (window.showNotif) window.showNotif('Drop link copied! Share directly in chats.', 'success');
    }
  }

  playVoiceAudio(btn, url) {
    if (!url) return;
    if (this.currentAudio && this.currentAudioBtn === btn) {
      if (this.currentAudio.paused) {
        this.currentAudio.play();
        btn.innerHTML = '<i class="fa-solid fa-pause"></i>';
      } else {
        this.currentAudio.pause();
        btn.innerHTML = '<i class="fa-solid fa-play"></i>';
      }
      return;
    }

    if (this.currentAudio) {
      this.currentAudio.pause();
      if (this.currentAudioBtn) this.currentAudioBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }

    const audio = new Audio(url);
    this.currentAudio = audio;
    this.currentAudioBtn = btn;
    btn.innerHTML = '<i class="fa-solid fa-pause"></i>';

    audio.onended = () => {
      btn.innerHTML = '<i class="fa-solid fa-play"></i>';
      this.currentAudio = null;
      this.currentAudioBtn = null;
    };

    audio.play().catch(e => console.warn('[GLOBAL DROP] Audio play block:', e));
  }

  openDropOptionsMenu(drop) {
    const myUid = this.getUID();
    const isOwner = (drop.authorId === myUid || drop.userId === myUid);

    const action = confirm(isOwner ? 'Delete this Global Drop from the network?' : 'Copy link to this Drop?');
    if (!action) return;

    if (isOwner) {
      deleteDoc(doc(db, 'global_drops', drop.id))
        .then(() => {
          if (window.showNotif) window.showNotif('Drop purged from the network', 'success');
        })
        .catch(err => console.error('[GLOBAL DROP] Delete error:', err));
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/chat?drop=${drop.id}`);
      if (window.showNotif) window.showNotif('Drop link copied to clipboard', 'success');
    }
  }

  formatFullTimestamp(ms) {
    if (!ms) return '';
    const date = new Date(ms);
    const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    const month = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    return `${time} · ${month}`;
  }

  // ---------------------------------------------------------------------------
  // 7. REPLIES & DISCUSSIONS DRAWER (OFFICIAL X THREAD SPECIFICATION)
  // ---------------------------------------------------------------------------
  bindRepliesDrawer() {
    const drawer = document.getElementById('globalDropRepliesDrawer');
    const closeBtn = document.getElementById('globalDropRepliesCloseBtn');
    const sendBtn = document.getElementById('globalDropReplySendBtn');
    const input = document.getElementById('globalDropReplyInput');
    const shareBtn = document.getElementById('globalDropThreadShareBtn');

    const closeThread = () => {
      if (drawer) drawer.style.display = 'none';
      if (this.unsubscribeReplies) {
        this.unsubscribeReplies();
        this.unsubscribeReplies = null;
      }
      this.currentReplyDrop = null;
    };

    closeBtn?.addEventListener('click', closeThread);

    drawer?.addEventListener('click', (e) => {
      if (e.target === drawer) {
        closeThread();
      }
    });

    shareBtn?.addEventListener('click', () => {
      if (!this.currentReplyDrop) return;
      this.shareDropToChat(this.currentReplyDrop);
    });

    input?.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 160) + 'px';
      if (sendBtn) {
        sendBtn.disabled = !input.value.trim();
      }
    });

    const submitReply = async () => {
      const text = input?.value.trim();
      if (!text || !this.currentReplyDrop) return;
      const uid = this.getUID();
      if (!uid) {
        if (window.showNotif) window.showNotif('Please sign in to reply to drops', 'warning');
        return;
      }

      sendBtn.disabled = true;
      sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

      try {
        const repliesCol = collection(db, 'global_drops', this.currentReplyDrop.id, 'replies');
        await addDoc(repliesCol, {
          authorId: uid,
          userId: uid,
          authorName: this.getUsername(),
          authorHandle: (this.getUsername() || 'user').toLowerCase().replace(/\s+/g, '_'),
          authorPhoto: this.getAvatar(),
          content: text,
          createdAt: serverTimestamp(),
          createdAtMs: Date.now()
        });

        // Increment reply count on parent drop
        const dropRef = doc(db, 'global_drops', this.currentReplyDrop.id);
        await updateDoc(dropRef, { repliesCount: increment(1) });

        input.value = '';
        input.style.height = 'auto';
        if (window.showNotif) window.showNotif('Reply transmitted to thread', 'success');
        if (navigator.vibrate) navigator.vibrate(15);
      } catch (err) {
        console.error('[GLOBAL DROP] Post reply error:', err);
        if (window.showNotif) window.showNotif('Failed to post reply: ' + err.message, 'error');
      } finally {
        if (sendBtn) {
          sendBtn.disabled = !input?.value.trim();
          sendBtn.innerHTML = '<span>Reply</span>';
        }
      }
    };

    sendBtn?.addEventListener('click', submitReply);
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        submitReply();
      }
    });
  }

  openRepliesDrawer(drop) {
    this.currentReplyDrop = drop;
    const drawer = document.getElementById('globalDropRepliesDrawer');
    const parentContainer = document.getElementById('globalDropThreadParent');
    const list = document.getElementById('globalDropRepliesList');
    const replyingHandle = document.getElementById('globalDropThreadReplyingHandle');
    const headerSub = document.getElementById('globalDropThreadHeaderSub');
    const composerAvatar = document.getElementById('globalDropThreadComposerAvatar');
    const replyInput = document.getElementById('globalDropReplyInput');
    const scrollable = document.getElementById('globalDropThreadScrollable');

    if (!drawer || !parentContainer || !list) return;

    if (composerAvatar) composerAvatar.src = this.getAvatar();
    if (replyingHandle) replyingHandle.textContent = `@${drop.authorHandle || 'node'}`;
    if (headerSub) headerSub.textContent = `@${drop.authorHandle || 'node'}`;
    if (replyInput) {
      replyInput.value = '';
      replyInput.style.height = 'auto';
    }

    const myUid = this.getUID();
    const safeAuthor = this.escapeHtml(drop.authorName || 'Transmitter');
    const safeHandle = this.escapeHtml(drop.authorHandle || 'node');
    const safeAvatar = drop.authorPhoto || 'logo.jpg';
    const isSignaled = Array.isArray(drop.likes) && drop.likes.includes(myUid);
    const isEchoed = Array.isArray(drop.echoes) && drop.echoes.includes(myUid);

    // Full timestamp
    const fullTimeStr = this.formatFullTimestamp(drop.createdAtMs || (drop.createdAt?.seconds ? drop.createdAt.seconds * 1000 : Date.now()));

    // Media, Code, Voice
    const mediaHtml = this.buildMediaGridHtml(drop);
    const codeHtml = this.buildCodeBoxHtml(drop.codeSnippet);
    const voiceHtml = drop.voiceUrl ? `
      <div class="x-drop-voice-player global-drop-voice-player" style="margin: 12px 0;">
        <button type="button" class="x-drop-voice-play-btn global-drop-voice-play-btn" data-url="${drop.voiceUrl}">
          <i class="fa-solid fa-play"></i>
        </button>
        <div class="x-drop-voice-wave-bars global-drop-voice-wave-bars">
          ${Array.from({ length: 32 }).map((_, i) => `<div class="x-drop-voice-wave-bar" style="height: ${4 + (i % 7) * 3}px;"></div>`).join('')}
        </div>
        <span style="font-size: 11px; color: var(--x-text-secondary); font-family: var(--x-mono); letter-spacing: 0.5px;">AUDIO DROP</span>
      </div>
    ` : '';

    // Location badge
    let geoBadgeHtml = '';
    if (drop.location && (drop.location.city || drop.location.label)) {
      const locLabel = this.escapeHtml(drop.location.city || drop.location.label);
      geoBadgeHtml = `
        <span class="x-drop-geo-badge" style="margin-left: 6px;">
          <i class="fa-solid fa-location-dot"></i>
          <span>${locLabel}</span>
        </span>
      `;
    }

    // Pinned / TTL badge
    let ttlBadge = '';
    if (drop.ttl && drop.ttl !== 'permanent') {
      ttlBadge = `<span class="x-drop-ttl-badge" style="margin-left: 6px;"><i class="fa-regular fa-clock"></i> ${drop.ttl}</span>`;
    }

    // Engagement stats
    const likesCount = drop.signalsCount || drop.likesCount || (Array.isArray(drop.likes) ? drop.likes.length : 0);
    const echoesCount = drop.echoesCount || 0;
    const repliesCount = drop.repliesCount || 0;
    const viewsCount = drop.viewsCount || (likesCount ? likesCount * 4 + 18 : 84);

    parentContainer.innerHTML = `
      <div class="x-thread-parent-author-row">
        <div class="x-thread-parent-author-info">
          <img src="${safeAvatar}" alt="${safeAuthor}" class="x-thread-parent-avatar" onerror="this.src='logo.jpg'" />
          <div class="x-thread-parent-names">
            <span class="x-thread-parent-name">
              ${safeAuthor}
              <i class="fa-solid fa-circle-check x-drop-verified" title="Verified Cyber Node"></i>
            </span>
            <span class="x-thread-parent-handle">@${safeHandle}</span>
            <div class="x-thread-parent-submeta">
              ${drop.authorTenure ? `<span class="x-drop-tenure-chip" title="NEXCHAT Tenure"><i class="fa-solid fa-shield-halved"></i> ${this.escapeHtml(drop.authorTenure)}</span>` : ''}
              ${(drop.authorLocation || (drop.location && (drop.location.city || drop.location.label))) ? `<span class="x-drop-location-chip"><i class="fa-solid fa-location-dot"></i> ${this.escapeHtml(drop.authorLocation || drop.location.city || drop.location.label)}</span>` : ''}
            </div>
          </div>
        </div>
        <button type="button" class="x-thread-action-icon-btn global-drop-card-more-btn" title="More options">
          <i class="fa-solid fa-ellipsis"></i>
        </button>
      </div>

      <div class="x-thread-parent-content">${this.formatDropText(drop.content || '')}</div>
      ${mediaHtml}
      ${codeHtml}
      ${voiceHtml}

      <div class="x-thread-parent-timestamp">
        <span>${fullTimeStr}</span>
        <span>&middot;</span>
        <span style="color: var(--x-green); font-weight: 600;"><i class="fa-solid fa-satellite-dish"></i> NEX Radar</span>
        ${geoBadgeHtml}
        ${ttlBadge}
      </div>

      <div class="x-thread-metrics-bar">
        <span><strong>${echoesCount}</strong> Reposts</span>
        <span><strong>${repliesCount}</strong> Replies</span>
        <span><strong id="threadParentLikesCount">${likesCount}</strong> Likes</span>
        <span><strong>${this.formatCompactNumber(viewsCount)}</strong> Views</span>
      </div>

      <div class="x-thread-parent-actions">
        <button type="button" class="x-action-btn x-action-reply global-drop-action-btn discuss" title="Reply">
          <div class="x-action-icon-circle"><i class="fa-regular fa-comment"></i></div>
          <span class="x-action-count">${repliesCount}</span>
        </button>
        <button type="button" class="x-action-btn x-action-echo global-drop-action-btn echo ${isEchoed ? 'active' : ''}" title="Repost">
          <div class="x-action-icon-circle"><i class="fa-solid fa-retweet"></i></div>
          <span class="x-action-count">${echoesCount}</span>
        </button>
        <button type="button" class="x-action-btn x-action-like global-drop-action-btn signal ${isSignaled ? 'active' : ''}" id="threadParentLikeBtn" title="Like">
          <div class="x-action-icon-circle"><i class="${isSignaled ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}"></i></div>
          <span class="x-action-count">${likesCount}</span>
        </button>
        <button type="button" class="x-action-btn x-action-bookmark global-drop-action-btn bookmark" title="Bookmark">
          <div class="x-action-icon-circle"><i class="fa-regular fa-bookmark"></i></div>
        </button>
        <button type="button" class="x-action-btn x-action-share global-drop-action-btn forward" title="Share">
          <div class="x-action-icon-circle"><i class="fa-solid fa-arrow-up-from-bracket"></i></div>
        </button>
      </div>
    `;

    // Click author info to open User Profile
    parentContainer.querySelector('.x-thread-parent-author-info')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openUserProfile(drop.authorId || drop.userId, {
        name: drop.authorName,
        handle: drop.authorHandle,
        photo: drop.authorPhoto
      });
    });

    // Bind parent actions
    parentContainer.querySelector('.global-drop-action-btn.signal')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleSignal(drop.id, parentContainer);
    });
    parentContainer.querySelector('.global-drop-action-btn.echo')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleEcho(drop.id, parentContainer);
    });
    parentContainer.querySelector('.global-drop-action-btn.forward')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.shareDropToChat(drop);
    });
    parentContainer.querySelector('.global-drop-action-btn.bookmark')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const bBtn = parentContainer.querySelector('.global-drop-action-btn.bookmark');
      bBtn.classList.toggle('active');
      const bIcon = bBtn.querySelector('i');
      if (bIcon) bIcon.className = bBtn.classList.contains('active') ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark';
      if (window.showNotif) window.showNotif('Drop saved to Cyber Vault bookmarks', 'success');
    });
    parentContainer.querySelector('.global-drop-card-more-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openDropOptionsMenu(drop);
    });

    const pVoiceBtn = parentContainer.querySelector('.global-drop-voice-play-btn');
    if (pVoiceBtn) {
      pVoiceBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.playVoiceAudio(pVoiceBtn, pVoiceBtn.getAttribute('data-url'));
      });
    }
    this.hydrateDropVideos(parentContainer);

    // Subscribe to replies stream
    if (this.unsubscribeReplies) {
      this.unsubscribeReplies();
      this.unsubscribeReplies = null;
    }

    list.innerHTML = `
      <div style="text-align: center; color: var(--x-text-secondary); padding: 32px 16px;">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 24px; color: var(--x-green); margin-bottom: 8px; display: block;"></i>
        <span>Loading replies...</span>
      </div>
    `;

    try {
      const repliesCol = collection(db, 'global_drops', drop.id, 'replies');
      const q = query(repliesCol, orderBy('createdAtMs', 'asc'), limit(50));

      this.unsubscribeReplies = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
          list.innerHTML = `
            <div class="x-thread-empty">
              <i class="fa-regular fa-comment-dots"></i>
              <h3>Be the first to reply</h3>
              <p>Share your perspective or signal back to @${safeHandle}.</p>
            </div>
          `;
          return;
        }

        list.innerHTML = '';
        snapshot.forEach((docSnap, idx) => {
          const rep = docSnap.data();
          const rTime = this.formatRelativeTime(rep.createdAtMs || Date.now());
          const rAuthor = this.escapeHtml(rep.authorName || 'Transmitter');
          const rHandle = this.escapeHtml(rep.authorHandle || 'node');
          const rAvatar = rep.authorPhoto || 'logo.jpg';
          const isLast = (idx === snapshot.docs.length - 1);

          const rCard = document.createElement('article');
          rCard.className = 'x-thread-reply-card';
          rCard.innerHTML = `
            <div class="x-thread-reply-left">
              <img src="${rAvatar}" alt="${rAuthor}" class="x-thread-reply-avatar" onerror="this.src='logo.jpg'" />
              ${!isLast ? '<div class="x-thread-spine-line"></div>' : ''}
            </div>
            <div class="x-thread-reply-right">
              <div class="x-thread-reply-header">
                <span class="x-thread-reply-author">${rAuthor}</span>
                <i class="fa-solid fa-circle-check x-drop-verified" style="font-size: 11px;"></i>
                <span class="x-thread-reply-handle">@${rHandle}</span>
                <span>·</span>
                <span class="x-thread-reply-time">${rTime}</span>
              </div>
              <div class="x-thread-reply-rep-badge">
                Replying to <span style="color: var(--x-green);">@${safeHandle}</span>
              </div>
              <div class="x-thread-reply-text">${this.formatDropText(rep.content || '')}</div>
              <div class="x-thread-reply-actions">
                <button type="button" class="x-thread-reply-action-btn reply-to-reply" title="Reply">
                  <i class="fa-regular fa-comment"></i>
                </button>
                <button type="button" class="x-thread-reply-action-btn like-reply" title="Like">
                  <i class="fa-regular fa-heart"></i>
                  <span class="like-rep-count">${rep.likesCount || 0}</span>
                </button>
                <button type="button" class="x-thread-reply-action-btn share-reply" title="Share">
                  <i class="fa-solid fa-arrow-up-from-bracket"></i>
                </button>
              </div>
            </div>
          `;

          // Reply to reply click -> populate textarea with @handle
          rCard.querySelector('.reply-to-reply')?.addEventListener('click', () => {
            const ta = document.getElementById('globalDropReplyInput');
            if (ta) {
              ta.value = `@${rHandle} ` + ta.value.replace(`@${rHandle} `, '');
              ta.focus();
            }
          });

          // Like reply click
          rCard.querySelector('.like-reply')?.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            btn.classList.toggle('active');
            const icon = btn.querySelector('i');
            const cnt = btn.querySelector('.like-rep-count');
            const isAct = btn.classList.contains('active');
            if (icon) icon.className = isAct ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
            if (cnt) {
              const c = parseInt(cnt.textContent || '0', 10);
              cnt.textContent = isAct ? c + 1 : Math.max(0, c - 1);
            }
          });

          // Click author avatar or name in reply to open user profile
          rCard.querySelector('.x-thread-reply-left')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openUserProfile(rep.authorId || rep.userId, {
              name: rep.authorName,
              handle: rep.authorHandle,
              photo: rep.authorPhoto
            });
          });
          rCard.querySelector('.x-thread-reply-author')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openUserProfile(rep.authorId || rep.userId, {
              name: rep.authorName,
              handle: rep.authorHandle,
              photo: rep.authorPhoto
            });
          });

          list.appendChild(rCard);
        });
      }, (err) => {
        console.error('[GLOBAL DROP] Replies stream error:', err);
      });
    } catch (err) {
      console.error('[GLOBAL DROP] Reply subscription init error:', err);
    }

    drawer.style.display = 'flex';
    if (scrollable) scrollable.scrollTop = 0;
  }

  // ---------------------------------------------------------------------------
  // 8. MOBILE CYBER-FAB & COMPOSER MODAL SHEET
  // ---------------------------------------------------------------------------
  bindMobileFab() {
    const fab = document.getElementById('globalDropMobileFab');
    const closeBtn = document.getElementById('globalDropCloseComposerBtn');
    const topPostBtn = document.getElementById('globalDropModalTopPostBtn');

    fab?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openComposerModal();
    });

    closeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeComposerModal();
    });

    topPostBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.transmitDrop();
    });
  }

  openComposerModal() {
    const composer = document.getElementById('globalDropComposer') || document.querySelector('.x-composer');
    if (composer) {
      composer.classList.add('mobile-modal-open');
      const textarea = document.getElementById('globalDropTextarea');
      if (textarea) {
        setTimeout(() => textarea.focus(), 150);
      }
    }
  }

  closeComposerModal() {
    const composer = document.getElementById('globalDropComposer') || document.querySelector('.x-composer');
    if (composer) {
      composer.classList.remove('mobile-modal-open');
    }
  }

  // ---------------------------------------------------------------------------
  // 8B. PROFILE NAVIGATION SIDE DRAWER (EXACT REPLICA FROM IMAGE 2)
  // ---------------------------------------------------------------------------
  bindAccountDrawer() {
    const mobileAvatar = document.getElementById('globalDropMobileHeaderAvatar');
    const mobileAvatarWrap = document.getElementById('globalDropMobileHeaderAvatarWrap') || document.querySelector('.x-mobile-header-avatar');
    const drawer = document.getElementById('globalDropDrawer');
    const overlay = document.getElementById('globalDropDrawerOverlay');
    if (!drawer || !overlay) return;

    // Ensure hidden initially to avoid blocking touch/scroll events
    overlay.style.display = 'none';
    drawer.style.display = 'none';

    // Mount drawer and overlay directly to body to prevent clipping by parent scroll/overflow containers
    if (drawer.parentElement && drawer.parentElement !== document.body) {
      document.body.appendChild(overlay);
      document.body.appendChild(drawer);
    }

    const openDrawer = (e) => {
      if (e) {
        e.preventDefault?.();
        e.stopPropagation?.();
      }
      this.syncDrawerProfile();
      overlay.style.display = 'block';
      drawer.style.display = 'flex';
      drawer.style.visibility = 'visible';
      requestAnimationFrame(() => {
        overlay.classList.add('active');
        drawer.classList.add('open');
      });
    };

    const closeDrawer = (e) => {
      if (e) {
        e.preventDefault?.();
        e.stopPropagation?.();
      }
      overlay.classList.remove('active');
      drawer.classList.remove('open');
      setTimeout(() => {
        if (!drawer.classList.contains('open')) {
          overlay.style.display = 'none';
          drawer.style.display = 'none';
        }
      }, 260);
    };

    // Expose globally for both inline and external invocation
    window.globalDropOpenDrawer = openDrawer;
    window.globalDropCloseDrawer = closeDrawer;
    this.openAccountDrawer = openDrawer;
    this.closeAccountDrawer = closeDrawer;

    // Bind triggers to avatar image and wrapper container (handling click, touchend, pointerup)
    const avatarElements = [mobileAvatar, mobileAvatarWrap].filter(Boolean);
    avatarElements.forEach(el => {
      el.style.cursor = 'pointer';
      el.addEventListener('click', (e) => openDrawer(e));
      el.addEventListener('touchend', (e) => openDrawer(e), { passive: false });
    });

    overlay.addEventListener('click', (e) => closeDrawer(e));
    overlay.addEventListener('touchend', (e) => closeDrawer(e), { passive: false });

    // Header dots button in drawer
    document.getElementById('globalDropDrawerDotsBtn')?.addEventListener('click', () => {
      if (window.showNotif) window.showNotif('Node Identity: Genesis Tier 1 Verified', 'info');
    });

    // Wire drawer navigation items
    document.getElementById('globalDropDrawerProfileLink')?.addEventListener('click', () => {
      closeDrawer();
      this.openUserProfile(this.getUID());
    });

    document.getElementById('globalDropDrawerPremiumLink')?.addEventListener('click', () => {
      closeDrawer();
      if (window.showNotif) window.showNotif('Genesis Tier Active — 100% Unlocked', 'success');
      this.openUserProfile(this.getUID());
    });

    document.getElementById('globalDropDrawerCommunitiesLink')?.addEventListener('click', () => {
      closeDrawer();
      if (typeof window.handleNavigation === 'function') {
        window.handleNavigation('groups');
      }
    });

    document.getElementById('globalDropDrawerBookmarksLink')?.addEventListener('click', () => {
      closeDrawer();
      this.setFeedFilter('bookmarks');
    });

    document.getElementById('globalDropDrawerLovedLink')?.addEventListener('click', () => {
      closeDrawer();
      this.setFeedFilter('loved');
    });

    document.getElementById('globalDropDrawerResharedLink')?.addEventListener('click', () => {
      closeDrawer();
      this.setFeedFilter('reshared');
    });

    document.getElementById('globalDropDrawerHistoryLink')?.addEventListener('click', () => {
      closeDrawer();
      this.setFeedFilter('history');
    });

    document.getElementById('globalDropDrawerListsLink')?.addEventListener('click', () => {
      closeDrawer();
      if (window.broadcastChannelsEngine?.openModal) {
        window.broadcastChannelsEngine.openModal();
      } else if (window.showNotif) {
        window.showNotif('Frequency Channels Active', 'info');
      }
    });

    document.getElementById('globalDropDrawerSpacesLink')?.addEventListener('click', () => {
      closeDrawer();
      if (window.CyberFeatures?.audioSpaces?.show) {
        window.CyberFeatures.audioSpaces.show();
      } else if (window.showNotif) {
        window.showNotif('Quantum Voice Stages Initialized', 'info');
      }
    });

    document.getElementById('globalDropDrawerStudioLink')?.addEventListener('click', () => {
      closeDrawer();
      if (window.cyberFeatureMatrix?.openModal) {
        window.cyberFeatureMatrix.openModal();
      } else if (window.showNotif) {
        window.showNotif('Cyber Matrix Studio Matrix Active', 'info');
      }
    });

    document.getElementById('globalDropDrawerAutomateLink')?.addEventListener('click', () => {
      closeDrawer();
      if (typeof window.openChronexAI === 'function') {
        window.openChronexAI();
      } else if (window.showNotif) {
        window.showNotif('ChronEX Swarm v4.2 Online', 'info');
      }
    });

    document.getElementById('globalDropDrawerSettingsLink')?.addEventListener('click', () => {
      closeDrawer();
      const fab = document.getElementById('globalDropMobileFab');
      if (fab) {
        fab.style.setProperty('display', 'none', 'important');
        fab.classList.add('hidden');
      }
      if (typeof window.openSettingsModal === 'function') {
        window.openSettingsModal();
      } else {
        const m = document.getElementById('settingsModal');
        if (m) m.style.display = 'flex';
      }
    });

    document.getElementById('globalDropDrawerHelpLink')?.addEventListener('click', () => {
      closeDrawer();
      if (window.showNotif) window.showNotif('Protocol Matrix & Docs Loaded', 'info');
    });

    document.getElementById('globalDropDrawerThemeBtn')?.addEventListener('click', (e) => {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      this.toggleTheme();
    });

    // Initial theme sync
    this.syncTheme();
  }

  toggleTheme() {
    const currentTheme = localStorage.getItem('global_drop_theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem('global_drop_theme', nextTheme);
    } catch (_) {}
    this.syncTheme();
    if (typeof window.showNotif === 'function') {
      window.showNotif(`GlobalDrop ${nextTheme === 'dark' ? 'Dark' : 'Light'} Mode Activated`, 'info', 1800);
    }
  }

  syncTheme() {
    const savedTheme = localStorage.getItem('global_drop_theme') || 'dark';
    const isLight = savedTheme === 'light';
    const drawer = document.getElementById('globalDropDrawer');
    const container = document.getElementById('globalDropContainer');
    const themeBtn = document.getElementById('globalDropDrawerThemeBtn');

    if (drawer) {
      drawer.classList.toggle('light-theme', isLight);
      drawer.classList.toggle('light-mode', isLight);
      drawer.classList.toggle('dark-theme', !isLight);
      drawer.classList.toggle('dark-mode', !isLight);
    }
    if (container) {
      container.classList.toggle('light-theme', isLight);
      container.classList.toggle('light-mode', isLight);
      container.classList.toggle('dark-theme', !isLight);
      container.classList.toggle('dark-mode', !isLight);
    }
    if (themeBtn) {
      const icon = themeBtn.querySelector('i');
      if (icon) {
        icon.className = isLight ? 'fa-solid fa-sun' : 'fa-regular fa-moon';
        icon.style.color = isLight ? '#f59e0b' : '#ffd700';
      }
      themeBtn.title = isLight ? 'Switch GlobalDrop to Dark Mode' : 'Switch GlobalDrop to Light Mode';
    }
  }

  syncDrawerProfile() {
    const avatar = document.getElementById('globalDropDrawerAvatar');
    const nameEl = document.getElementById('globalDropDrawerName');
    const handleEl = document.getElementById('globalDropDrawerHandle');
    const followingEl = document.getElementById('globalDropDrawerFollowingCount');
    const followersEl = document.getElementById('globalDropDrawerFollowersCount');

    const currentUser = (typeof auth !== 'undefined' && auth?.currentUser) ? auth.currentUser : null;
    const myUid = this.getUID();
    const myName = currentUser?.displayName || localStorage.getItem('nex_display_name') || this.getUsername() || 'User';
    const myAvatar = this.getAvatar();
    const myHandle = '@' + (currentUser?.email ? currentUser.email.split('@')[0] : (localStorage.getItem('nex_username') || 'user_' + (myUid ? myUid.slice(0, 5) : 'node')));

    if (avatar) avatar.src = myAvatar;
    if (nameEl) nameEl.textContent = myName;
    if (handleEl) handleEl.textContent = myHandle;

    const followingCount = localStorage.getItem('nex_following_count') || '21';
    const followersCount = localStorage.getItem('nex_followers_count') || '1';
    if (followingEl) followingEl.textContent = followingCount;
    if (followersEl) followersEl.textContent = followersCount;

    this.syncTheme();
  }

  setFeedFilter(mode) {
    this.currentMode = mode;
    document.querySelectorAll('.x-timeline-tabs .x-tab-btn').forEach(btn => btn.classList.remove('active'));
    this.filterAndRenderCachedDrops();
    const container = document.getElementById('globalDropContainer') || document.querySelector('.x-timeline-col');
    if (container) container.scrollTop = 0;
  }

  // ---------------------------------------------------------------------------
  // 9. SIDEBAR MODULES (TRENDING & WHO TO FOLLOW)
  // ---------------------------------------------------------------------------
  loadSideWidgets() {
    // 1. Trending Topics (What's happening)
    const trendingList = document.getElementById('globalDropTrendingList');
    if (trendingList) {
      const trendingItems = [
        { category: 'Technology · Trending', tag: '#ChronexAI', count: '48.2K Drops' },
        { category: 'Cyber Security · Trending', tag: '#E2EEProtocol', count: '29.5K Drops' },
        { category: 'Web3 & Quantum · Trending', tag: '#QuantumVault', count: '18.1K Drops' },
        { category: 'Development · Trending', tag: '#ViteArchitecture', count: '14.3K Drops' },
        { category: 'Gaming Hub · Trending', tag: '#CyberCombat', count: '10.8K Drops' }
      ];

      trendingList.innerHTML = trendingItems.map(item => `
        <div class="x-trending-item global-drop-trending-item" data-tag="${item.tag}">
          <span class="x-trending-category">${item.category}</span>
          <span class="x-trending-tag">${item.tag}</span>
          <span class="x-trending-count">${item.count}</span>
        </div>
      `).join('');

      trendingList.querySelectorAll('.x-trending-item').forEach(el => {
        el.addEventListener('click', () => {
          const tag = el.getAttribute('data-tag');
          if (tag) {
            this.currentTopic = tag.replace('#', '').toLowerCase();
            const chip = document.querySelector(`.x-topic-chip[data-topic="${this.currentTopic}"], .global-drop-topic-chip[data-topic="${this.currentTopic}"]`);
            if (chip) chip.click();
            else this.filterAndRenderCachedDrops();
          }
        });
      });
    }

    // 2. Who to follow widget
    const followList = document.getElementById('globalDropFollowList');
    if (followList) {
      const followRecs = [
        { name: 'Chronex AI', handle: 'chronex_ai', avatar: 'logo.jpg' },
        { name: 'NEX Core Enclave', handle: 'nex_core', avatar: 'logo.jpg' },
        { name: 'Sentinel Protocol', handle: 'sentinel_shield', avatar: 'logo.jpg' }
      ];

      followList.innerHTML = followRecs.map(rec => `
        <div class="x-follow-item">
          <div class="x-follow-user-left">
            <img src="${rec.avatar}" alt="${rec.name}" class="x-follow-avatar" onerror="this.src='logo.jpg'" />
            <div class="x-follow-names">
              <span class="x-follow-display-name">${rec.name}</span>
              <span class="x-follow-handle">@${rec.handle}</span>
            </div>
          </div>
          <button type="button" class="x-follow-btn" onclick="this.textContent = this.textContent === 'Follow' ? 'Following' : 'Follow'; if(window.showNotif) window.showNotif('Following @${rec.handle}', 'success');">Follow</button>
        </div>
      `).join('');
    }

    // 3. User rail info update
    this.updateUserRailPill();
  }

  updateUserRailPill() {
    const name = this.getUsername();
    const handle = '@' + name.toLowerCase().replace(/\s+/g, '_');
    const avatar = this.getAvatar();

    const nameEl = document.getElementById('globalDropNavUserName');
    if (nameEl) nameEl.textContent = name;

    const handleEl = document.getElementById('globalDropNavUserHandle');
    if (handleEl) handleEl.textContent = handle;

    const avatarEl = document.getElementById('globalDropNavUserAvatar');
    if (avatarEl) avatarEl.src = avatar;

    const mobileAvatarEl = document.getElementById('globalDropMobileHeaderAvatar');
    if (mobileAvatarEl) mobileAvatarEl.src = avatar;
  }

  bindGlobalEvents() {
    // Lightbox image clicks
    document.addEventListener('click', (e) => {
      const cell = e.target.closest('.global-drop-media-cell');
      if (cell) {
        const img = cell.querySelector('img');
        if (img && window.setupMediaLightbox) {
          // If lightbox available
        }
      }
    });
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------
  formatRelativeTime(ms) {
    if (!ms) return 'now';
    const diff = Math.floor((Date.now() - ms) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  formatDropText(text) {
    if (!text) return '';
    let escaped = this.escapeHtml(text);
    // Replace hashtags with links
    escaped = escaped.replace(/(^|\s)(#[a-zA-Z0-9_]+)/g, '$1<a href="javascript:void(0)" class="drop-hashtag">$2</a>');
    // Replace @mentions with links
    escaped = escaped.replace(/(^|\s)(@[a-zA-Z0-9_]+)/g, '$1<a href="javascript:void(0)" class="drop-mention">$2</a>');
    return escaped;
  }

  escapeHtml(str) {
    if (!str) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(str).replace(/[&<>"']/g, m => map[m]);
  }

  // ---------------------------------------------------------------------------
  // 10. USER-TO-USER PROFILE (OFFICIAL X SPECIFICATION)
  // ---------------------------------------------------------------------------
  initUserProfile() {
    const modal = document.getElementById('globalDropUserProfileModal');
    const backBtn = document.getElementById('globalDropProfileBackBtn');
    const shareBtn = document.getElementById('globalDropProfileShareBtn');
    const tabs = document.querySelectorAll('.x-profile-tab');

    const closeModal = () => {
      if (modal) modal.style.display = 'none';
      this.currentProfileUid = null;
    };

    backBtn?.addEventListener('click', closeModal);

    modal?.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    shareBtn?.addEventListener('click', () => {
      if (!this.currentProfileUid) return;
      const url = `${window.location.origin}/chat?profile=${this.currentProfileUid}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url);
        if (window.showNotif) window.showNotif('Profile link copied to clipboard', 'success');
      }
    });

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentProfileTab = tab.getAttribute('data-tab') || 'drops';
        this.renderProfileFilteredDrops();
      });
    });

    // Profile navigation triggers
    document.getElementById('globalDropNavUserPill')?.addEventListener('click', () => {
      this.openUserProfile(this.getUID());
    });
    // Note: globalDropMobileHeaderAvatar is bound in bindAccountDrawer() to open the navigation drawer
  }

  formatCompactNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(num);
  }

  calculateUserRankAndTenure(ms) {
    if (!ms) {
      return {
        tenureText: 'Joined Recently',
        tenureYears: '0',
        rank: 'Novice Operative',
        shortBadge: '< 1mo'
      };
    }
    const diffMs = Date.now() - ms;
    const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);
    const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44);

    let tenureText = '';
    let rank = 'Cyber Operative';
    let shortBadge = '';

    if (diffYears >= 2) {
      const y = Math.floor(diffYears);
      tenureText = `${y} yrs on NEXCHAT`;
      rank = `Pioneer Operative (${y}+ Yrs)`;
      shortBadge = `${y}y`;
    } else if (diffYears >= 1) {
      tenureText = `1 yr on NEXCHAT`;
      rank = `Veteran Operative (1+ Yr)`;
      shortBadge = `1y`;
    } else if (diffMonths >= 6) {
      const m = Math.floor(diffMonths);
      tenureText = `${m} mos on NEXCHAT`;
      rank = `Senior Transmitter (${m} Mos)`;
      shortBadge = `${m}mo`;
    } else if (diffMonths >= 1) {
      const m = Math.floor(diffMonths);
      tenureText = `${m} mo${m > 1 ? 's' : ''} on NEXCHAT`;
      rank = `Active Transmitter (${m} Mos)`;
      shortBadge = `${m}mo`;
    } else {
      tenureText = 'Joined this month';
      rank = 'New Node Operative';
      shortBadge = '< 1mo';
    }

    const date = new Date(ms);
    const monthYear = date.toLocaleDateString([], { month: 'short', year: 'numeric' });

    return {
      monthYear,
      tenureText: `Joined ${monthYear} \u00B7 ${tenureText}`,
      tenureYears: diffYears.toFixed(1),
      rank,
      shortBadge
    };
  }

  formatJoinDateAndTenure(ms) {
    return this.calculateUserRankAndTenure(ms).tenureText;
  }

  async openUserProfile(targetUid, authorData = {}) {
    if (!targetUid) targetUid = this.getUID();
    this.currentProfileUid = targetUid;
    this.currentProfileTab = 'drops';

    const modal = document.getElementById('globalDropUserProfileModal');
    const headerName = document.getElementById('globalDropProfileHeaderName');
    const headerDropsCount = document.getElementById('globalDropProfileHeaderDropsCount');
    const avatar = document.getElementById('globalDropProfileAvatar');
    const displayName = document.getElementById('globalDropProfileDisplayName');
    const rankChip = document.getElementById('globalDropProfileRankChip');
    const handle = document.getElementById('globalDropProfileHandle');
    const bio = document.getElementById('globalDropProfileBio');
    const joinDate = document.getElementById('globalDropProfileJoinDate');
    const locItem = document.getElementById('globalDropProfileLocation');
    const viewsItem = document.getElementById('globalDropProfileViews');
    const nodeIdItem = document.getElementById('globalDropProfileNodeId');
    const followingCount = document.getElementById('globalDropProfileFollowingCount');
    const followersCount = document.getElementById('globalDropProfileFollowersCount');
    const totalViewsCount = document.getElementById('globalDropProfileTotalViewsCount');
    const totalDropsCount = document.getElementById('globalDropProfileTotalDropsCount');
    const ctaButtons = document.getElementById('globalDropProfileCtaButtons');
    const stream = document.getElementById('globalDropProfileStream');

    if (!modal) return;

    if (stream) {
      stream.innerHTML = `
        <div style="padding: 40px; text-align: center; color: var(--x-text-secondary);">
          <i class="fa-solid fa-spinner fa-spin" style="font-size: 24px; color: var(--x-green); margin-bottom: 8px; display: block;"></i>
          <span>Retrieving node profile...</span>
        </div>
      `;
    }

    const myUid = this.getUID();
    const isMe = (targetUid === myUid);
    const initialName = authorData.name || (isMe ? this.getUsername() : 'Transmitter');
    const initialHandle = authorData.handle || (initialName ? initialName.toLowerCase().replace(/\s+/g, '_') : 'node');
    const initialAvatar = authorData.photo || (isMe ? this.getAvatar() : 'logo.jpg');

    if (headerName) headerName.textContent = initialName;
    if (displayName) displayName.innerHTML = `${this.escapeHtml(initialName)} <i class="fa-solid fa-circle-check x-drop-verified" title="Verified Cyber Node"></i>`;
    if (handle) handle.textContent = `@${initialHandle}`;
    if (avatar) avatar.src = initialAvatar;

    modal.style.display = 'flex';

    // 1. Fetch user doc from Firestore
    let userData = {};
    if (db) {
      try {
        const uSnap = await getDoc(doc(db, 'users', targetUid));
        if (uSnap.exists()) {
          userData = uSnap.data();
        }
      } catch (err) {
        console.warn('[GLOBAL DROP PROFILE] User doc fetch error:', err);
      }
    }

    const finalName = userData.displayName || userData.username || userData.name || initialName;
    const finalHandle = userData.username || (finalName ? finalName.toLowerCase().replace(/\s+/g, '_') : initialHandle);
    const finalAvatar = userData.profilePic || userData.photoURL || initialAvatar;
    const finalBio = userData.bio || userData.status || 'NEX Cyber Node Operative • Transmitting on Global Drop.';
    const finalLocation = userData.location || (this.userLocation?.city ? `${this.userLocation.city}, ${this.userLocation.countryCode}` : 'Global Matrix');
    const joinedAt = userData.createdAtMs || userData.createdAt?.seconds * 1000 || userData.timestamp || (Date.now() - 365 * 86400000);

    if (headerName) headerName.textContent = finalName;
    if (displayName) displayName.innerHTML = `${this.escapeHtml(finalName)} <i class="fa-solid fa-circle-check x-drop-verified" title="Verified Cyber Node"></i>`;
    if (handle) handle.textContent = `@${finalHandle}`;
    if (avatar) avatar.src = finalAvatar;
    if (bio) bio.textContent = finalBio;

    // Tenure & rank calculation
    const tenureData = this.calculateUserRankAndTenure(joinedAt);
    if (rankChip) {
      rankChip.innerHTML = `<i class="fa-solid fa-shield-halved"></i> <span>${this.escapeHtml(tenureData.rank)}</span>`;
    }
    if (joinDate) {
      joinDate.innerHTML = `<i class="fa-regular fa-calendar"></i> <span>${this.escapeHtml(tenureData.tenureText)}</span>`;
    }

    // Location
    if (locItem) {
      locItem.innerHTML = `<i class="fa-solid fa-location-dot"></i> <span>${this.escapeHtml(finalLocation)}</span>`;
    }

    // Node Fingerprint
    if (nodeIdItem) {
      nodeIdItem.innerHTML = `<i class="fa-solid fa-fingerprint"></i> <span>NEX-${targetUid.slice(0, 8).toUpperCase()}</span>`;
    }

    // Following & Followers
    const following = Array.isArray(userData.following) ? userData.following.length : 142;
    const followers = Array.isArray(userData.followers) ? userData.followers.length : 1840;
    if (followingCount) followingCount.textContent = this.formatCompactNumber(following);
    if (followersCount) followersCount.textContent = this.formatCompactNumber(followers);

    // CTA Buttons
    if (ctaButtons) {
      ctaButtons.innerHTML = '';
      if (isMe) {
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'x-profile-edit-btn wide';
        editBtn.textContent = 'Edit profile';
        editBtn.addEventListener('click', () => {
          if (typeof window.openSettingsModal === 'function') window.openSettingsModal();
        });
        ctaButtons.appendChild(editBtn);
      } else {
        const myFollowingList = Array.isArray(window.myFollowing) ? window.myFollowing : [];
        let isFollowing = myFollowingList.includes(targetUid);

        const followBtn = document.createElement('button');
        followBtn.type = 'button';
        followBtn.className = `x-profile-follow-btn ${isFollowing ? 'following' : ''}`;
        followBtn.textContent = isFollowing ? 'Following' : 'Follow';

        followBtn.addEventListener('click', async () => {
          isFollowing = !isFollowing;
          followBtn.className = `x-profile-follow-btn ${isFollowing ? 'following' : ''}`;
          followBtn.textContent = isFollowing ? 'Following' : 'Follow';

          if (db && myUid) {
            try {
              const myRef = doc(db, 'users', myUid);
              const targetRef = doc(db, 'users', targetUid);
              if (isFollowing) {
                await updateDoc(myRef, { following: arrayUnion(targetUid) });
                await updateDoc(targetRef, { followers: arrayUnion(myUid) });
                if (window.showNotif) window.showNotif(`Now following @${finalHandle}`, 'success');
              } else {
                await updateDoc(myRef, { following: arrayRemove(targetUid) });
                await updateDoc(targetRef, { followers: arrayRemove(myUid) });
                if (window.showNotif) window.showNotif(`Unfollowed @${finalHandle}`, 'info');
              }
            } catch (err) {
              console.warn('[GLOBAL DROP PROFILE] Follow toggle error:', err);
            }
          }
        });
        ctaButtons.appendChild(followBtn);

        const dmBtn = document.createElement('button');
        dmBtn.type = 'button';
        dmBtn.className = 'x-profile-dm-btn';
        dmBtn.title = 'Send Direct Message';
        dmBtn.innerHTML = '<i class="fa-regular fa-envelope"></i>';
        dmBtn.addEventListener('click', () => {
          modal.style.display = 'none';
          if (typeof window.openChat === 'function') {
            window.openChat(targetUid, finalName, finalAvatar, 'direct');
            if (typeof window.showChatDetailView === 'function') window.showChatDetailView();
          } else if (typeof window.startDirectChat === 'function') {
            window.startDirectChat(targetUid, finalName);
          } else if (typeof window.handleNavigation === 'function') {
            window.handleNavigation('chats');
          }
        });
        ctaButtons.appendChild(dmBtn);
      }
    }

    // 2. Query user drops
    try {
      const dropsRef = collection(db, 'global_drops');
      const q = query(dropsRef, where('authorId', '==', targetUid), orderBy('createdAtMs', 'desc'), limit(50));
      const dropSnaps = await getDocs(q);
      const userDrops = [];
      dropSnaps.forEach(dSnap => {
        userDrops.push({ id: dSnap.id, ...dSnap.data() });
      });

      this.cachedProfileDrops = userDrops;
      if (headerDropsCount) headerDropsCount.textContent = `${userDrops.length} Drops`;

      const videoDrops = userDrops.filter(d => d.mediaType === 'video' || (Array.isArray(d.mediaUrls) && d.mediaUrls.some(u => /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(u) || (typeof u === 'string' && u.includes('/video/')))));
      const videosCountEl = document.getElementById('globalDropProfileVideosCount');
      const videosBadgeEl = document.getElementById('globalDropProfileVideosCountBadge');
      if (videosCountEl) videosCountEl.textContent = this.formatCompactNumber(videoDrops.length);
      if (videosBadgeEl) videosBadgeEl.textContent = this.formatCompactNumber(videoDrops.length);

      const totalViews = userDrops.reduce((acc, d) => acc + (d.viewsCount || 1), 0);
      if (viewsItem) {
        viewsItem.innerHTML = `<i class="fa-solid fa-chart-simple"></i> <span><strong>${this.formatCompactNumber(totalViews)}</strong> Drop Views</span>`;
      }
      if (totalViewsCount) totalViewsCount.textContent = this.formatCompactNumber(totalViews);
      if (totalDropsCount) totalDropsCount.textContent = this.formatCompactNumber(userDrops.length);

      this.renderProfileFilteredDrops();
    } catch (err) {
      console.warn('[GLOBAL DROP PROFILE] Drops query fallback:', err);
      const filtered = this.cachedDrops.filter(d => d.authorId === targetUid || d.userId === targetUid);
      this.cachedProfileDrops = filtered;
      if (headerDropsCount) headerDropsCount.textContent = `${filtered.length} Drops`;
      const fallbackViews = filtered.reduce((acc, d) => acc + (d.viewsCount || 1), 0);
      const videoDrops = filtered.filter(d => d.mediaType === 'video' || (Array.isArray(d.mediaUrls) && d.mediaUrls.some(u => /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(u) || (typeof u === 'string' && u.includes('/video/')))));
      const videosCountEl = document.getElementById('globalDropProfileVideosCount');
      const videosBadgeEl = document.getElementById('globalDropProfileVideosCountBadge');
      if (videosCountEl) videosCountEl.textContent = this.formatCompactNumber(videoDrops.length);
      if (videosBadgeEl) videosBadgeEl.textContent = this.formatCompactNumber(videoDrops.length);

      if (viewsItem) {
        viewsItem.innerHTML = `<i class="fa-solid fa-chart-simple"></i> <span><strong>${this.formatCompactNumber(fallbackViews)}</strong> Drop Views</span>`;
      }
      if (totalViewsCount) totalViewsCount.textContent = this.formatCompactNumber(fallbackViews);
      if (totalDropsCount) totalDropsCount.textContent = this.formatCompactNumber(filtered.length);
      this.renderProfileFilteredDrops();
    }
  }

  renderProfileFilteredDrops() {
    const stream = document.getElementById('globalDropProfileStream');
    if (!stream) return;

    let drops = [...this.cachedProfileDrops];

    if (this.currentProfileTab === 'videos') {
      const videoDrops = drops.filter(d => d.mediaType === 'video' || (Array.isArray(d.mediaUrls) && d.mediaUrls.some(u => /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(u) || (typeof u === 'string' && u.includes('/video/')))));
      if (!videoDrops.length) {
        stream.innerHTML = `
          <div style="padding: 48px 20px; text-align: center; color: var(--x-text-secondary);">
            <i class="fa-solid fa-video-slash" style="font-size: 32px; color: var(--x-green); opacity: 0.8; margin-bottom: 12px; display: block;"></i>
            <h3 style="font-size: 18px; font-weight: 800; color: #ffffff; margin-bottom: 4px;">No videos uploaded yet</h3>
            <p style="font-size: 13.5px; max-width: 320px; margin: 0 auto; line-height: 1.4;">When this user posts video clips or reels on Global Drop, they will be showcased here.</p>
          </div>
        `;
        return;
      }

      stream.innerHTML = '<div class="x-profile-videos-grid"></div>';
      const grid = stream.querySelector('.x-profile-videos-grid');
      videoDrops.forEach(drop => {
        const vUrl = (Array.isArray(drop.mediaUrls) ? drop.mediaUrls.find(u => /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(u) || (typeof u === 'string' && u.includes('/video/'))) : null) || (Array.isArray(drop.mediaUrls) ? drop.mediaUrls[0] : '');
        const card = document.createElement('div');
        card.className = 'x-profile-video-card';
        card.innerHTML = `
          <video src="${vUrl}" preload="metadata" muted playsinline></video>
          <div class="x-profile-video-card-overlay">
            <span class="x-profile-video-play-tag"><i class="fa-solid fa-play"></i> VIDEO</span>
            <div class="x-profile-video-footer-block">
              <div class="x-profile-video-caption">${this.escapeHtml(drop.content || 'Video drop')}</div>
              <div class="x-profile-video-footer">
                <span><i class="fa-regular fa-heart"></i> ${drop.likesCount || 0}</span>
                <span><i class="fa-solid fa-chart-simple"></i> ${this.formatCompactNumber(drop.viewsCount || 1)}</span>
              </div>
            </div>
          </div>
        `;
        card.addEventListener('click', () => {
          this.openRepliesDrawer(drop);
        });
        grid.appendChild(card);
      });
      return;
    } else if (this.currentProfileTab === 'media') {
      drops = drops.filter(d => Array.isArray(d.mediaUrls) && d.mediaUrls.length > 0);
    } else if (this.currentProfileTab === 'likes') {
      drops = this.cachedDrops.filter(d => Array.isArray(d.likes) && d.likes.includes(this.currentProfileUid));
    } else if (this.currentProfileTab === 'replies') {
      drops = drops.filter(d => (d.repliesCount || 0) > 0 || d.replyToDropId);
    }

    if (!drops.length) {
      stream.innerHTML = `
        <div style="padding: 48px 20px; text-align: center; color: var(--x-text-secondary);">
          <i class="fa-regular fa-folder-open" style="font-size: 32px; color: var(--x-green); opacity: 0.8; margin-bottom: 12px; display: block;"></i>
          <h3 style="font-size: 18px; font-weight: 800; color: #ffffff; margin-bottom: 4px;">No ${this.currentProfileTab} yet</h3>
          <p style="font-size: 13.5px; max-width: 320px; margin: 0 auto; line-height: 1.4;">When this transmitter posts ${this.currentProfileTab}, they will appear here.</p>
        </div>
      `;
      return;
    }

    stream.innerHTML = '';
    const myUid = this.getUID();

    drops.forEach(drop => {
      const card = document.createElement('article');
      card.className = 'x-drop-row global-drop-card';
      card.id = `profile-drop-card-${drop.id}`;

      const timeStr = this.formatRelativeTime(drop.createdAtMs || Date.now());
      const safeAuthor = this.escapeHtml(drop.authorName || 'Transmitter');
      const safeHandle = this.escapeHtml(drop.authorHandle || 'node');
      const safeAvatar = drop.authorPhoto || 'logo.jpg';
      const isSignaled = Array.isArray(drop.likes) && drop.likes.includes(myUid);
      const isEchoed = Array.isArray(drop.echoes) && drop.echoes.includes(myUid);

      const mediaHtml = this.buildMediaGridHtml(drop);
      const codeHtml = this.buildCodeBoxHtml(drop.codeSnippet);

      card.innerHTML = `
        <div class="x-drop-avatar-col">
          <img src="${safeAvatar}" alt="${safeAuthor}" class="x-drop-avatar" onerror="this.src='logo.jpg'" />
        </div>
        <div class="x-drop-main-col">
          <div class="x-drop-header">
            <div class="x-drop-author-info">
              <span class="x-drop-author-name">${safeAuthor}</span>
              <i class="fa-solid fa-circle-check x-drop-verified"></i>
              <span class="x-drop-author-handle">@${safeHandle}</span>
              <span class="x-drop-dot">·</span>
              <span class="x-drop-time">${timeStr}</span>
            </div>
          </div>
          <div class="x-drop-text">${this.formatDropText(drop.content || '')}</div>
          ${mediaHtml}
          ${codeHtml}
          <div class="x-action-row">
            <button type="button" class="x-action-btn x-action-reply"><i class="fa-regular fa-comment"></i> <span class="x-action-count">${drop.repliesCount || 0}</span></button>
            <button type="button" class="x-action-btn x-action-echo ${isEchoed ? 'active' : ''}"><i class="fa-solid fa-retweet"></i> <span class="x-action-count">${drop.echoesCount || 0}</span></button>
            <button type="button" class="x-action-btn x-action-like ${isSignaled ? 'active' : ''}"><i class="${isSignaled ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}"></i> <span class="x-action-count">${drop.likesCount || 0}</span></button>
            <button type="button" class="x-action-btn x-action-views"><i class="fa-solid fa-chart-simple"></i> <span class="x-action-count">${drop.viewsCount || 42}</span></button>
          </div>
        </div>
      `;

      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        if (e.target.closest('button, a, video, audio')) return;
        this.openRepliesDrawer(drop);
      });

      this.hydrateDropVideos(card);
      stream.appendChild(card);
    });
  }
}

// Global Singleton
const globalDropEngine = new GlobalDropEngine();
if (typeof window !== 'undefined') {
  window.globalDropEngine = globalDropEngine;
}
window.openGlobalDropUserProfile = (uid, data) => globalDropEngine.openUserProfile(uid, data);

export function initGlobalDropEngine() {
  globalDropEngine.init();
  globalDropEngine.subscribeFeed();
}

export { globalDropEngine };
