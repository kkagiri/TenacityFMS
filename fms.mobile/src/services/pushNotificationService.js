/**
 * Push Notification Service
 * Manages Firebase Cloud Messaging (FCM) for push notifications
 * Handles token registration with backend and message handling
 */

import { Platform, AppState, Alert, Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DeviceInfo from "react-native-device-info";
import { API_CONFIG } from "../config/environment";

// Storage keys
const STORAGE_KEYS = {
  FCM_TOKEN: "fms_fcm_token",
  DEVICE_REGISTERED: "fms_device_registered",
  PUSH_ENABLED: "fms_push_enabled",
};

// Firebase messaging will be loaded lazily
let messaging = null;
let notifee = null;
let AndroidImportance = { HIGH: 4 };

class PushNotificationService {
  constructor() {
    this.isInitialized = false;
    this.currentToken = null;
    this.authToken = null;
    this.userId = null;
    this.unsubscribeTokenRefresh = null;
    this.unsubscribeMessage = null;
  }

  /**
   * Initialize the push notification service
   * Call this after user authentication
   * @param {string} authToken - JWT token for API authentication
   * @param {string} userId - Current user's ID
   */
  async initialize(authToken, userId) {
    if (this.isInitialized) {
      console.log("[PushNotification] Already initialized");
      return true;
    }

    console.log("[PushNotification] Initializing...");
    this.authToken = authToken;
    this.userId = userId;

    // Check if push is enabled in settings
    const pushEnabled = await this.isPushEnabled();
    if (!pushEnabled) {
      console.log("[PushNotification] Push notifications disabled by user");
      return false;
    }

    // Try to load Firebase messaging
    if (!messaging) {
      try {
        const firebaseMessaging = require("@react-native-firebase/messaging");
        messaging = firebaseMessaging.default;
        console.log("[PushNotification] Firebase messaging loaded");
      } catch (e) {
        console.warn(
          "[PushNotification] @react-native-firebase/messaging not available:",
          e.message
        );
        console.warn(
          "[PushNotification] To enable push notifications, install Firebase:"
        );
        console.warn(
          "  npm install @react-native-firebase/app @react-native-firebase/messaging"
        );
        return false;
      }
    }

    // Try to load notifee for displaying notifications
    if (!notifee) {
      try {
        const notifeeModule = require("@notifee/react-native");
        notifee = notifeeModule.default;
        if (notifeeModule.AndroidImportance) {
          AndroidImportance = notifeeModule.AndroidImportance;
        }
        console.log("[PushNotification] Notifee loaded for notification display");
      } catch (e) {
        console.warn("[PushNotification] @notifee/react-native not available");
      }
    }

    try {
      // Request permission
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log("[PushNotification] Permission not granted");
        return false;
      }

      // Get FCM token
      const token = await this.getToken();
      if (token) {
        // Register token with backend
        await this.registerTokenWithBackend(token);

        // Subscribe to token refresh
        this.subscribeToTokenRefresh();

        // Subscribe to foreground messages
        this.subscribeToForegroundMessages();

        this.isInitialized = true;
        console.log("[PushNotification] ✅ Initialization complete");
        return true;
      }

      return false;
    } catch (error) {
      console.error("[PushNotification] Initialization failed:", error);
      return false;
    }
  }

  /**
   * Request notification permission
   * @returns {Promise<boolean>} Whether permission was granted
   */
  async requestPermission() {
    if (!messaging) return false;

    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      console.log(
        `[PushNotification] Permission status: ${authStatus}, enabled: ${enabled}`
      );
      if (!enabled) {
        Alert.alert(
          "Enable Notifications",
          "Notifications are disabled. Open settings to enable push notifications?",
          [
            { text: "Not now", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {
                Linking.openSettings().catch((error) => {
                  console.warn("[PushNotification] Failed to open settings:", error);
                });
              },
            },
          ]
        );
      }

      return enabled;
    } catch (error) {
      console.error("[PushNotification] Permission request failed:", error);
      return false;
    }
  }

  /**
   * Get the FCM token
   * @returns {Promise<string|null>} FCM token or null
   */
  async getToken() {
    if (!messaging) return null;

    try {
      // Check if registration is allowed
      await messaging().registerDeviceForRemoteMessages();

      const token = await messaging().getToken();
      this.currentToken = token;

      // Store token locally
      await AsyncStorage.setItem(STORAGE_KEYS.FCM_TOKEN, token);

      console.log("[PushNotification] Got FCM token:", token.substring(0, 20) + "...");
      return token;
    } catch (error) {
      console.error("[PushNotification] Failed to get token:", error);
      return null;
    }
  }

  /**
   * Subscribe to token refresh events
   */
  subscribeToTokenRefresh() {
    if (!messaging) return;

    this.unsubscribeTokenRefresh = messaging().onTokenRefresh(async (newToken) => {
      console.log("[PushNotification] Token refreshed");
      this.currentToken = newToken;
      await AsyncStorage.setItem(STORAGE_KEYS.FCM_TOKEN, newToken);

      // Re-register with backend
      await this.registerTokenWithBackend(newToken);
    });
  }

  /**
   * Subscribe to foreground messages
   */
  subscribeToForegroundMessages() {
    if (!messaging) return;

    this.unsubscribeMessage = messaging().onMessage(async (remoteMessage) => {
      console.log("[PushNotification] Foreground message received:", remoteMessage);

      // Display notification using notifee if available
      if (notifee && remoteMessage.notification) {
        await this.displayNotification(remoteMessage);
      }
    });
  }

  /**
   * Display a notification using Notifee
   * @param {Object} remoteMessage - FCM remote message
   */
  async displayNotification(remoteMessage) {
    if (!notifee) return;

    const { notification, data } = remoteMessage;

    try {
      // Create channel for Android if needed
      if (Platform.OS === "android") {
        await notifee.createChannel({
          id: "push-notifications",
          name: "Push Notifications",
          importance: AndroidImportance.HIGH,
        });
      }

      await notifee.displayNotification({
        title: notification?.title || "FMS Notification",
        body: notification?.body || "",
        data: data || {},
        android: {
          channelId: "push-notifications",
          smallIcon: "ic_notification",
          pressAction: {
            id: "default",
          },
        },
        ios: {
          sound: "default",
        },
      });
    } catch (error) {
      console.error("[PushNotification] Failed to display notification:", error);
    }
  }

  /**
   * Register FCM token with backend
   * @param {string} token - FCM token to register
   */
  async registerTokenWithBackend(token) {
    if (!this.authToken) {
      console.warn("[PushNotification] No auth token, cannot register device");
      return false;
    }

    try {
      const deviceInfo = {
        deviceToken: token,
        platform: Platform.OS,
        deviceName: await DeviceInfo.getDeviceName(),
        deviceId: DeviceInfo.getModel(),
        appVersion: DeviceInfo.getVersion(),
      };

      console.log("[PushNotification] Registering device with backend...");

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/v1/push-devices/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.authToken}`,
          },
          body: JSON.stringify(deviceInfo),
        }
      );

      if (response.ok) {
        await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_REGISTERED, "true");
        console.log("[PushNotification] ✅ Device registered successfully");
        return true;
      } else {
        const error = await response.text();
        console.error("[PushNotification] Registration failed:", error);
        return false;
      }
    } catch (error) {
      console.error("[PushNotification] Registration error:", error);
      return false;
    }
  }

  /**
   * Unregister device from push notifications
   */
  async unregisterDevice() {
    if (!this.currentToken || !this.authToken) {
      console.log("[PushNotification] Nothing to unregister");
      return;
    }

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/v1/push-devices/unregister`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.authToken}`,
          },
          body: JSON.stringify({ deviceToken: this.currentToken }),
        }
      );

      if (response.ok) {
        await AsyncStorage.removeItem(STORAGE_KEYS.DEVICE_REGISTERED);
        console.log("[PushNotification] Device unregistered");
      }
    } catch (error) {
      console.error("[PushNotification] Unregister error:", error);
    }
  }

  /**
   * Check if push notifications are enabled
   */
  async isPushEnabled() {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.PUSH_ENABLED);
      return value !== "false"; // Default to enabled
    } catch {
      return true;
    }
  }

  /**
   * Enable or disable push notifications
   * @param {boolean} enabled - Whether to enable push
   */
  async setPushEnabled(enabled) {
    await AsyncStorage.setItem(STORAGE_KEYS.PUSH_ENABLED, enabled ? "true" : "false");

    if (!enabled) {
      // Unregister when disabled
      await this.unregisterDevice();
    } else if (this.authToken && this.userId) {
      // Re-initialize when enabled
      this.isInitialized = false;
      await this.initialize(this.authToken, this.userId);
    }
  }

  /**
   * Cleanup when user logs out
   */
  async cleanup() {
    console.log("[PushNotification] Cleaning up...");

    // Unsubscribe from listeners
    if (this.unsubscribeTokenRefresh) {
      this.unsubscribeTokenRefresh();
      this.unsubscribeTokenRefresh = null;
    }
    if (this.unsubscribeMessage) {
      this.unsubscribeMessage();
      this.unsubscribeMessage = null;
    }

    // Unregister device
    await this.unregisterDevice();

    // Clear state
    this.isInitialized = false;
    this.currentToken = null;
    this.authToken = null;
    this.userId = null;
  }

  /**
   * Get the current FCM token
   */
  getCurrentToken() {
    return this.currentToken;
  }

  /**
   * Check if device is registered for push
   */
  async isDeviceRegistered() {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_REGISTERED);
    return value === "true";
  }
}

// Export singleton instance
const pushNotificationService = new PushNotificationService();
export default pushNotificationService;

/**
 * Setup background message handler
 * This must be called at the top level of your app (outside of any component)
 */
export function setupBackgroundMessageHandler() {
  try {
    const firebaseMessaging = require("@react-native-firebase/messaging");
    const messaging = firebaseMessaging.default;

    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log("[PushNotification] Background message:", remoteMessage);
      // Background messages are automatically displayed as notifications by FCM
      // Add any custom handling here if needed
    });

    console.log("[PushNotification] Background message handler registered");
  } catch (e) {
    console.warn("[PushNotification] Could not setup background handler:", e.message);
  }
}
