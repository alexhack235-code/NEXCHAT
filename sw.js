
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
            cache.put(event.request, clonedResponse);
          });
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
  console.log('Push notification received:', event);
  
  let notificationData = {
    title: ' NEXCHAT',
    body: 'You have a new message',
    icon: './logo.jpg',
    badge: './logo.jpg',
    tag: 'nexchat-notification',
    requireInteraction: true
  };

  if (event.data) {
    try {
      notificationData = {
        ...notificationData,
        ...event.data.json()
      };
    } catch (err) {
      notificationData.body = event.data.text();
    }
  }

  // Zone 5: Push Notification Filtering Rules
  if (
    notificationData.isTranslateJob === true ||
    notificationData.isSystemAction === true ||
    notificationData.isAiUtility === true ||
    notificationData.isAiTranslation === true ||
    notificationData.isAiSummary === true ||
    notificationData.chatType === 'system' ||
    notificationData.chatType === 'ai_utility'
  ) {
    return; // Suppress background utility/system push notifications
  }

  // Suppress push if recipient is Chronex AI
  if (
    notificationData.recipient === 'chronex' ||
    notificationData.recipient === 'chronex-ai' ||
    notificationData.to === 'chronex' ||
    notificationData.to === 'chronex-ai'
  ) {
    return;
  }

  if (!notificationData.vibrate) {
    notificationData.vibrate = [200, 100, 200];
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let client of clientList) {
        if (client.url.includes('chat.html') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./chat.html');
      }
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
      })
    );
  }
});

