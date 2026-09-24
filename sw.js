
const CACHE_NAME = 'nexchat-v3';
const STATIC_FILES = [
  './',
  './index.html',
  './chat.html',
  './profile-upload.html',
  './advertisement.html',
  './gaminghub.html',
  './terminal.html',
  './cart.html',
  './chat.css',
  './login.css',
  './register.css',
  './reset.css',
  './profile-upload.css',
  './manifest.json',
  './logo.jpg',
  './chronex-ai.jpg',
  './chronex-background.jpg',
  './nex-list.jpg'
];

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching application shell');
      return cache.addAll(STATIC_FILES.filter(file => {
        return !file.includes('node_modules');
      })).catch(err => {
        console.log('Some files could not be cached:', err);
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome://')) {
    return;
  }

  if (event.request.url.includes('firebase') || event.request.url.includes('firestore')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return new Response('Offline - Firebase not available', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        })
    );
    return;
  }

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
          return response || new Response('Offline - Page not cached', {
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

