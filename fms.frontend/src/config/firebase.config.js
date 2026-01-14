/**
 * Firebase Configuration for Web Push Notifications
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to Firebase Console: https://console.firebase.google.com
 * 2. Create a project or use existing one
 * 3. Go to Project Settings > Cloud Messaging
 * 4. Get your Web Push certificate (VAPID key)
 * 5. Go to Project Settings > General > Web apps
 * 6. Register a web app and copy the config below
 * 7. Replace the placeholder values with your actual Firebase config
 */

// Firebase configuration - REPLACE WITH YOUR ACTUAL VALUES
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "YOUR_APP_ID",
};

// VAPID key for web push (from Firebase Console > Cloud Messaging > Web configuration)
export const VAPID_KEY = process.env.REACT_APP_FIREBASE_VAPID_KEY || "YOUR_VAPID_KEY";

export default firebaseConfig;
