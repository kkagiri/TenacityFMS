/**
 * Firebase Cloud Messaging Service Worker
 *
 * Handles background push notifications when the app is not in focus.
 * This file must be placed in the public folder and served from the root.
 *
 * SETUP: Configure with your Firebase project settings
 */

/* eslint-disable no-undef */

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase configuration - MUST match firebase.config.js
// These values should be replaced with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get messaging instance
const messaging = firebase.messaging();

/**
 * Handle background messages
 * This is called when a message arrives while the app is in the background
 */
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload);

  // Extract notification data
  const { title, body, icon, data } = payload.notification || {};

  // Customize notification options
  const notificationOptions = {
    body: body || 'You have a new notification',
    icon: icon || '/logo192.png',
    badge: '/logo192.png',
    vibrate: [200, 100, 200],
    tag: payload.data?.notificationId || 'fms-notification',
    data: {
      ...payload.data,
      url: payload.data?.url || '/',
    },
    actions: [
      {
        action: 'open',
        title: 'View',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
  };

  // Show the notification
  self.registration.showNotification(
    title || 'FMS Notification',
    notificationOptions
  );
});

/**
 * Handle notification click
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);

  // Close the notification
  event.notification.close();

  // Get the action clicked
  const action = event.action;
  const data = event.notification.data || {};

  if (action === 'dismiss') {
    // Just close the notification
    return;
  }

  // Open or focus the app
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // Navigate to the notification URL if provided
            if (data.url) {
              client.navigate(data.url);
            }
            return client.focus();
          }
        }

        // Open new window if app is not open
        if (clients.openWindow) {
          const url = data.url || '/';
          return clients.openWindow(url);
        }
      })
  );
});

/**
 * Handle push event (for custom push handling)
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received');

  // This is handled by Firebase's onBackgroundMessage
  // Add any additional custom handling here if needed
});

/**
 * Service worker installation
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Service worker installing...');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

/**
 * Service worker activation
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Service worker activated');
  // Claim all clients immediately
  event.waitUntil(clients.claim());
});
