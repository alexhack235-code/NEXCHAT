
const CACHE_NAME = 'nexchat-v10-csp-bypass';
const STATIC_FILES = [
  './manifest.json',
  './logo.jpg',
  './chronex-ai.jpg',
  './chronex-background.jpg',
  './nex-list.jpg'
];

self.addEventListener('install', (event) => {
  console.log('[NEXCHAT SW] Installing nuclear alive service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_FILES).catch(err => {
        console.warn('[NEXCHAT SW] Non-fatal static cache warning:', err);
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[NEXCHAT SW] Activating, purging all stale caches, and reloading clients...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[NEXCHAT SW] Purging old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    }).then(() => {
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    }).then((clients) => {
      clients.forEach((client) => {
        try {
          client.postMessage({ type: 'SW_ACTIVATED', version: CACHE_NAME });
        } catch (_) {}
      });
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  try {
    const url = new URL(event.request.url);

    // CRITICAL: NEVER intercept cross-origin requests (CDNs, Google APIs, Fonts, Firebase SDKs, Cloudflare, etc.)
    // Let the browser load external scripts/stylesheets/fonts natively so they are checked against
    // script-src, style-src, and font-src instead of tripping connect-src CSP!
    if (url.origin !== self.location.origin) {
      return; // Direct browser network bypass
    }

    // Direct network bypass for HTML navigations and dynamic serverless APIs
    if (
      event.request.mode === 'navigate' ||
      event.request.destination === 'document' ||
      url.pathname.endsWith('.html') ||
      url.pathname === '/' ||
      url.pathname.startsWith('/api/')
    ) {
      return; // Direct network bypass
    }
  } catch (_) {
    return;
  }

  // Only handle same-origin static assets
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clonedResponse = response.clone();
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse).catch(() => {});
          }).catch(() => {});
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((response) => {
          return response || new Response('Offline - Asset not cached', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

self.addEventListener('push', (event) => {
  console.log('[NEXCHAT SW] Push notification received:', event);

  let rawData = {};
  if (event.data) {
    try {
      rawData = event.data.json();
    } catch (_) {
      rawData = { body: event.data.text() };
    }
  }

  const notification = rawData.notification || {};
  const data = rawData.data || {};

  const chatId = data.chatId || data.from || rawData.tag || 'direct';
  const senderName = notification.title || data.senderName || rawData.title || 'NEXCHAT';
  const messagePreview = notification.body || data.body || data.text || rawData.body || 'New message';
  const icon = notification.icon || data.avatar || rawData.icon || '/nex-logo.png';

  // Zone 5: Push Notification Filtering Rules
  if (
    rawData.isTranslateJob === true ||
    rawData.isSystemAction === true ||
    rawData.isAiUtility === true ||
    data.isTranslateJob === true ||
    data.chatType === 'system' ||
    data.chatType === 'ai_utility'
  ) {
    return; // Suppress background utility/system push notifications
  }

  // Suppress push if recipient is Chronex AI
  if (
    data.recipient === 'chronex' ||
    data.recipient === 'chronex-ai' ||
    data.to === 'chronex' ||
    data.to === 'chronex-ai'
  ) {
    return;
  }

  // WHATSAPP IMAGE 2 FORMAT: Grouping by tag = chatId ensures 5 messages from same user update 1 row
  const notificationTitle = senderName;
  const notificationOptions = {
    body: messagePreview,
    icon: icon,
    badge: '/favicons/icon-192.png',
    tag: chatId, // Web grouping key like WhatsApp
    renotify: true,
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: {
      chatId: chatId,
      senderId: data.senderId || data.from,
      url: '/chat.html?chatId=' + encodeURIComponent(chatId)
    }
  };

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[NEXCHAT SW] Notification clicked:', event);
  event.notification.close();

  const chatId = event.notification.data?.chatId;
  const targetUrl = chatId ? `/chat.html?chatId=${encodeURIComponent(chatId)}` : '/chat.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let client of clientList) {
        if (client.url.includes('chat.html') && 'focus' in client) {
          if (chatId && client.postMessage) {
            client.postMessage({ type: 'OPEN_CHAT', chatId: chatId });
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    }).catch((err) => {
      console.warn('[SW NotificationClick Error]', err);
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(
      clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SYNC_MESSAGES' });
        });
      }).catch((err) => {
        console.warn('[SW Sync Error]', err);
      })
    );
  }
});

