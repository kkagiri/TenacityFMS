# Push Notification Configuration Guide

## Overview

This guide explains how to configure push notifications in the FMS system. Push notifications support both **Firebase Cloud Messaging (FCM)** for production use and **Expo Push** for development/testing.

---

## 1. Configuration Settings

Add the following section to your `appsettings.json` or `appsettings.Production.json`:

```json
{
  "PushNotifications": {
    "Enabled": true,
    "DefaultProvider": "FCM",

    "Firebase": {
      "ProjectId": "your-firebase-project-id",
      "ServiceAccountKeyPath": "C:\\Config\\firebase-service-account.json",
      "ServerKey": "YOUR_FCM_SERVER_KEY"
    },

    "Expo": {
      "AccessToken": "YOUR_EXPO_ACCESS_TOKEN"
    },

    "Settings": {
      "MaxRetries": 3,
      "RetryDelayMs": 1000,
      "DeactivateAfterFailures": 5,
      "BatchSize": 100
    }
  }
}
```

### Configuration Options

| Setting | Description | Default |
|---------|-------------|---------|
| `Enabled` | Master switch for push notifications | `true` |
| `DefaultProvider` | Default provider: `FCM` or `Expo` | `FCM` |
| `Firebase.ProjectId` | Firebase project ID from console | Required for FCM |
| `Firebase.ServiceAccountKeyPath` | Path to service account JSON | Required for FCM v1 |
| `Firebase.ServerKey` | Legacy FCM server key | Optional (deprecated) |
| `Expo.AccessToken` | Expo push access token | Optional |
| `Settings.MaxRetries` | Max retry attempts per push | `3` |
| `Settings.DeactivateAfterFailures` | Deactivate device after N failures | `5` |
| `Settings.BatchSize` | Batch size for bulk push | `100` |

---

## 2. Firebase Setup (Production)

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "FMS-Production")
4. Enable/disable Google Analytics as needed
5. Click "Create project"

### Step 2: Enable Cloud Messaging

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Go to **Cloud Messaging** tab
3. Note your **Server Key** (legacy) and **Sender ID**

### Step 3: Create Service Account

1. Go to **Project Settings** → **Service accounts**
2. Click **"Generate new private key"**
3. Download the JSON file
4. Save it securely on your server (e.g., `C:\Config\firebase-service-account.json`)

### Step 4: Mobile App Configuration

Add to your mobile app's Firebase configuration:

**Android (`google-services.json`):**
1. Go to Project Settings → Your Apps → Android
2. Download `google-services.json`
3. Place in your React Native project root

**iOS (`GoogleService-Info.plist`):**
1. Go to Project Settings → Your Apps → iOS
2. Download `GoogleService-Info.plist`
3. Add to your Xcode project

---

## 3. Expo Push Setup (Development)

For development with Expo-based React Native apps:

### Step 1: Get Expo Access Token

1. Go to [Expo Dashboard](https://expo.dev/)
2. Create an account or sign in
3. Go to **Account Settings** → **Access Tokens**
4. Create a new token

### Step 2: Configure App

Expo push is automatically detected when tokens start with `ExponentPushToken[`.

---

## 4. API Endpoints

### Register Device

```http
POST /api/pushdevices/register
Content-Type: application/json

{
  "deviceToken": "ExponentPushToken[xxxxxxx]",
  "platform": "android",
  "deviceId": "unique-device-id",
  "deviceName": "Samsung Galaxy S23",
  "appVersion": "1.2.0"
}
```

### Unregister Device

```http
POST /api/pushdevices/unregister
Content-Type: application/json

{
  "deviceToken": "ExponentPushToken[xxxxxxx]"
}
```

### Get My Devices

```http
GET /api/pushdevices/my-devices
```

### Test Push

```http
POST /api/pushdevices/test
Content-Type: application/json

{
  "title": "Test Notification",
  "message": "This is a test push notification"
}
```

---

## 5. Mobile App Integration

### React Native with Expo

```javascript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register for push notifications
async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return null;
  }

  // Get Expo push token
  const token = await Notifications.getExpoPushTokenAsync({
    projectId: 'your-expo-project-id' // Optional
  });

  // Android-specific channel
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token.data;
}

// Register token with FMS backend
async function registerTokenWithBackend(token) {
  try {
    const response = await fetch('https://your-api.com/api/pushdevices/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        deviceToken: token,
        platform: Platform.OS,
        deviceId: Device.modelId || 'unknown',
        deviceName: Device.modelName || 'Unknown Device',
        appVersion: '1.0.0',
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to register push token:', error);
    return false;
  }
}

// Usage in your app
useEffect(() => {
  registerForPushNotifications()
    .then(token => {
      if (token) {
        registerTokenWithBackend(token);
      }
    });

  // Listen for notifications received while app is foregrounded
  const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
  });

  // Listen for notification response (user tapped notification)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification tapped:', response);
    // Handle navigation based on notification data
  });

  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
}, []);
```

---

## 6. Web Push (PWA)

For web browser push notifications:

```javascript
// Register service worker for push
async function registerWebPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications not supported');
    return null;
  }

  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY'
  });

  // Send subscription to backend
  await fetch('/api/pushdevices/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deviceToken: JSON.stringify(subscription),
      platform: 'web',
      deviceId: 'browser-' + navigator.userAgent.hashCode(),
      deviceName: navigator.userAgent,
    }),
  });

  return subscription;
}
```

---

## 7. Troubleshooting

### Device Not Receiving Push

1. **Check device registration:**
   ```sql
   SELECT * FROM user_push_devices
   WHERE user_id = ? AND is_active = 1;
   ```

2. **Check failed attempts:**
   ```sql
   SELECT * FROM user_push_devices
   WHERE failed_attempts > 0;
   ```

3. **Verify FCM credentials:**
   - Ensure service account JSON is valid
   - Check FCM project has Cloud Messaging enabled

### Token Expired/Invalid

- FCM tokens can expire or become invalid
- Device will be marked inactive after 5 consecutive failures
- User needs to re-register the device

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `InvalidRegistration` | Token is malformed | Re-register device |
| `NotRegistered` | Token expired or app uninstalled | Remove from database |
| `MismatchSenderId` | Wrong FCM project | Check firebase config |
| `MessageTooBig` | Payload > 4KB | Reduce message size |

---

## 8. Database Schema

```sql
CREATE TABLE user_push_devices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    device_token VARCHAR(500) NOT NULL,
    platform VARCHAR(20) NOT NULL,
    device_id VARCHAR(255),
    device_name VARCHAR(255),
    app_version VARCHAR(50),
    is_active TINYINT(1) DEFAULT 1,
    failed_attempts INT DEFAULT 0,
    last_push_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX ix_user_id (user_id),
    UNIQUE INDEX uq_device_token (device_token(191)),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

---

## 9. Security Considerations

1. **Protect Service Account Keys**
   - Never commit to source control
   - Use environment variables or secure vault
   - Restrict file permissions

2. **Token Validation**
   - Always validate user authentication before registering tokens
   - One token per device per user

3. **Rate Limiting**
   - Implement rate limiting on push endpoints
   - Batch notifications to avoid FCM quota limits

4. **GDPR/Privacy**
   - Allow users to disable push notifications
   - Provide device management interface
   - Clear tokens when user deletes account

---

## Related Documentation

- [NOTIFICATION_SYSTEM_GUIDE.md](./NOTIFICATION_SYSTEM_GUIDE.md) - Complete notification system documentation
- [REFACTORING_CHECKLIST.md](./REFACTORING_CHECKLIST.md) - Cleanup and improvement tasks
