 # Push Notification Integration Guide

This document describes how to set up and use push notifications in the FMS system for both mobile (React Native) and web (React) applications.

## Overview

The push notification system uses Firebase Cloud Messaging (FCM) to deliver notifications to:
- **Mobile App** (fms.mobile): Native push notifications via `@react-native-firebase/messaging`
- **Web App** (fms.frontend): Browser push notifications via Firebase Web SDK

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   FMS Backend   │────▶│      FCM        │────▶│   Mobile/Web    │
│ (PushService)   │     │ (Firebase Cloud │     │    Clients      │
│                 │     │   Messaging)    │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                                │
        │                                                │
        ▼                                                ▼
┌─────────────────┐                           ┌─────────────────┐
│  UserPushDevices│                           │ Token Storage   │
│   (Database)    │                           │ (AsyncStorage/  │
│                 │                           │  localStorage)  │
└─────────────────┘                           └─────────────────┘
```

## Backend Setup (Already Complete)

The backend push notification infrastructure is already in place:

- **PushDevicesController**: `/api/push-devices/register`, `/unregister`, `/my-devices`, `/test`
- **PushNotificationService**: Sends notifications via FCM
- **UserPushDevice Entity**: Stores device tokens in database

### Environment Variables Required

Add to `appsettings.json` or environment:

```json
{
  "Firebase": {
    "ServerKey": "YOUR_FIREBASE_SERVER_KEY",
    "SenderId": "YOUR_SENDER_ID"
  }
}
```

## Mobile App Setup (fms.mobile)

### 1. Install Firebase Dependencies

```bash
cd fms.mobile
npm install @react-native-firebase/app @react-native-firebase/messaging
```

### 2. Android Configuration

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a project or use existing one
3. Add an Android app with package name from `android/app/build.gradle`
4. Download `google-services.json`
5. Place in `android/app/google-services.json`

Update `android/build.gradle`:
```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

Update `android/app/build.gradle`:
```gradle
apply plugin: 'com.google.gms.google-services'
```

### 3. iOS Configuration

1. In Firebase Console, add an iOS app
2. Download `GoogleService-Info.plist`
3. Add to Xcode project via Xcode (not just copy)
4. Enable Push Notifications capability in Xcode
5. Enable Background Modes > Remote notifications

Run:
```bash
cd ios && pod install
```

### 4. How It Works

The mobile app automatically:
1. Initializes on authentication (see `App.js`)
2. Requests notification permission
3. Gets FCM token
4. Registers token with backend
5. Handles foreground messages with Notifee
6. Cleans up on logout

Key files:
- [pushNotificationService.js](../fms.mobile/src/services/pushNotificationService.js)
- [App.js](../fms.mobile/src/App.js) - initialization

## Web App Setup (fms.frontend)

### 1. Install Firebase

```bash
cd fms.frontend
npm install firebase
```

### 2. Firebase Configuration

1. In Firebase Console, add a Web app
2. Copy the configuration
3. Update [firebase.config.js](../fms.frontend/src/config/firebase.config.js)

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

4. Get VAPID key from Firebase Console > Cloud Messaging > Web configuration
5. Update `VAPID_KEY` in firebase.config.js

### 3. Service Worker Configuration

Update the Firebase config in [firebase-messaging-sw.js](../fms.frontend/public/firebase-messaging-sw.js) to match your firebase.config.js.

### 4. Environment Variables (Alternative)

Add to `.env.production` and `.env.development`:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_VAPID_KEY=your_vapid_key
```

### 5. How It Works

The web app automatically:
1. Checks permission status on authentication
2. Auto-registers if permission already granted
3. Users can enable push via notification preferences UI
4. Registers token with backend
5. Displays foreground notifications
6. Service worker handles background notifications

Key files:
- [webPushNotificationService.js](../fms.frontend/src/services/webPushNotificationService.js)
- [firebase.config.js](../fms.frontend/src/config/firebase.config.js)
- [firebase-messaging-sw.js](../fms.frontend/public/firebase-messaging-sw.js)
- [App.js](../fms.frontend/src/App.js) - initialization

## User Preferences UI

Push notifications can be enabled/disabled per notification type in:
- **Web**: `/notifications/preferences`
- **Mobile**: Settings screen (TBD)

The preferences table now includes a "Push" toggle alongside System, Email, and SMS.

## Testing

### Test via API

```bash
# Get your devices
GET /api/push-devices/my-devices

# Send test notification
POST /api/push-devices/test
{
  "title": "Test Notification",
  "body": "This is a test push notification"
}
```

### Test via Backend

```csharp
// In any service with IPushNotificationService injected
await _pushService.SendToUserAsync(userId, new PushNotification
{
    Title = "Test",
    Body = "Hello from FMS!",
    Data = new Dictionary<string, string>
    {
        { "type", "test" },
        { "url", "/dashboard" }
    }
});
```

## Troubleshooting

### Mobile

1. **No token**: Ensure Firebase is properly configured in native projects
2. **Permission denied**: User denied notifications, must be requested again from system settings
3. **Token not registering**: Check network connectivity and API endpoint

### Web

1. **Service worker not registered**: Ensure `firebase-messaging-sw.js` is in public folder
2. **VAPID key error**: Ensure VAPID key matches Firebase project
3. **Notifications not showing**: Check browser notification permissions
4. **HTTPS required**: Web push only works on HTTPS (except localhost)

### Backend

1. **FCM errors**: Verify Firebase Server Key is correct
2. **Token invalid**: Device may have uninstalled app or token expired

## Security Considerations

1. Tokens are user-specific and stored securely
2. Devices are automatically cleaned up when tokens become invalid
3. Only authenticated users can register devices
4. Push payloads should not contain sensitive data

## Files Created/Modified

### Mobile (fms.mobile)
- `src/services/pushNotificationService.js` (NEW)
- `src/App.js` (MODIFIED - added push initialization)

### Web (fms.frontend)
- `src/config/firebase.config.js` (NEW)
- `src/services/webPushNotificationService.js` (NEW)
- `public/firebase-messaging-sw.js` (NEW)
- `src/App.js` (MODIFIED - added push initialization)
- `src/dataservice/notificationPreferencesApi.js` (MODIFIED - added Push delivery method)
