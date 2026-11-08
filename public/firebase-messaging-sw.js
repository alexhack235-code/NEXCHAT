/* ==============================================================================
   NEXCHAT FIREBASE CLOUD MESSAGING (FCM) SERVICE WORKER FOR WEB
   Provides WhatsApp-style system notification shade grouping for Web
   ============================================================================== */

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyCfT1UFmoGSAanbIDTLYGeFfPE7uCa74Fw",
  authDomain: "nexchat-47326.firebaseapp.com",
  projectId: "nexchat-47326",
  storageBucket: "nexchat-47326.appspot.com",
  messagingSenderId: "327330605104",
  appId: "1:327330605104:web:ac43bb9adf7e4f1f1065f5",
  databaseURL: "https://nexchat-47326-default-rtdb.firebaseio.com"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw] Received background message:', payload);
  const data = payload.data || {};
  const notification = payload.notification || {};

  const chatId = data.chatId || data.from || 'direct';
  const senderName = notification.title || data.senderName || 'NEXCHAT';
  const messagePreview = notification.body || data.body || data.text || 'New message';
  const icon = notification.icon || data.avatar || '/nex-logo.png';

  // Grouping by tag = chatId ensures 5 messages from ALEXANDER update the SAME row, NOT 5 rows!
  const notificationTitle = senderName;
  const notificationOptions = {
    body: messagePreview,
    icon: icon,
    badge: '/favicons/icon-192.png',
    tag: chatId,
    renotify: true,
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: {
      chatId: chatId,
      senderId: data.senderId || data.from,
      url: '/chat.html?chatId=' + encodeURIComponent(chatId)
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw] Notification clicked:', event);
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
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('[firebase-messaging-sw] Notification closed:', event);
});
