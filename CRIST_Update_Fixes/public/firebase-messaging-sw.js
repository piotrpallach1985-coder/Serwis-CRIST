importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDhaAwJbcDNRp5wloQFweluHdAvbCiZ82U",
  authDomain: "serwis-crist.firebaseapp.com",
  databaseURL: "https://serwis-crist-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "serwis-crist",
  storageBucket: "serwis-crist.firebasestorage.app",
  messagingSenderId: "321327519677",
  appId: "1:321327519677:web:107294ad94ad3eb45664d4"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'System Awarii CRIST';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/pwa-192x192.png',
    badge: '/masked-icon.svg',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Otwieramy powiązaną awarię lub ogólny link
  let clickAction = '/';
  if (event.notification.data && event.notification.data.click_action) {
    clickAction = event.notification.data.click_action;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(clickAction);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(clickAction);
      }
    })
  );
});
