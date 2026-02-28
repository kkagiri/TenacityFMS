/**
 * Push Notification Service
 * Manages Firebase Cloud Messaging (FCM) for push notifications
 * Handles token registration with backend and message handling
 *
 * Compatible with React Native Firebase v22+
 */

import { Platform, AppState, Alert, Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DeviceInfo from "react-native-device-info";
import { API_CONFIG } from "../config/environment";
import { navigateToNotificationCenter } from "./navigationService";

// Storage keys
const STORAGE_KEYS = {
  FCM_TOKEN: "fms_fcm_token",
  DEVICE_REGISTERED: "fms_device_registered",
  PUSH_ENABLED: "fms_push_enabled",
};

// Firebase messaging - loaded lazily via v22+ modular API
let messaging = null; // Messaging instance from getMessaging()
let fbApi = {};       // Modular API functions { getToken, requestPermission, ... }
let notifee = null;
let AndroidImportance = { HIGH: 4 };

// Authorization status constants
const AuthorizationStatus = {
  NOT_DETERMINED: -1,
  DENIED: 0,
  AUTHORIZED: 1,
  PROVISIONAL: 2,
};

class PushNotificationService {
  constructor() {
    this.isInitialized = false;
    this._initPromise = null; // Shared promise — concurrent callers wait for same result
    this.currentToken = null;
    this.authToken = null;
    this.userId = null;
    this.unsubscribeTokenRefresh = null;
    this.unsubscribeMessage = null;
  }

  /**
   * Initialize the push notification service.
   * Concurrent callers will wait for the same result (no duplicate runs).
   * @param {string} authToken - JWT token for API authentication
   * @param {string} userId - Current user's ID
   */
  async initialize(authToken, userId) {
    if (this.isInitialized) {
      console.log("[PushNotification] Already initialized");
      return true;
    }

    // If initialization is already running, let concurrent callers
    // wait for the same result instead of returning false.
    if (this._initPromise) {
      console.log("[PushNotification] Initialization in progress, waiting for result...");
      return this._initPromise;
    }

    this._initPromise = this._executeInit(authToken, userId);
    return this._initPromise;
  }

  /** @private – actual initialization logic */
  async _executeInit(authToken, userId) {
    try {
      console.log("[PushNotification] Initializing...");
      this.authToken = authToken;
      this.userId = userId;

      // Check if push is enabled in settings
      const pushEnabled = await this.isPushEnabled();
      if (!pushEnabled) {
        console.log("[PushNotification] Push notifications disabled by user");
        return false;
      }

      // Load Firebase messaging modular API (v22+)
      if (!messaging) {
        try {
          const mod = require("@react-native-firebase/messaging");

          // Extract modular API functions to avoid deprecated namespaced calls
          fbApi = {
            getMessaging: mod.getMessaging,
            getToken: mod.getToken,
            requestPermission: mod.requestPermission,
            onMessage: mod.onMessage,
            onTokenRefresh: mod.onTokenRefresh,
            onNotificationOpenedApp: mod.onNotificationOpenedApp,
            getInitialNotification: mod.getInitialNotification,
            setBackgroundMessageHandler: mod.setBackgroundMessageHandler,
            registerDeviceForRemoteMessages: mod.registerDeviceForRemoteMessages,
          };

          if (typeof fbApi.getMessaging === "function") {
            messaging = fbApi.getMessaging();
            console.log("[PushNotification] Firebase messaging loaded (modular API)");
          } else {
            throw new Error("getMessaging not available — unsupported version");
          }
        } catch (e) {
          console.warn(
            "[PushNotification] @react-native-firebase/messaging not available:",
            e.message
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

      // Request permission
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log("[PushNotification] Permission not granted");
        return false;
      }

      // Get FCM token with timeout
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

      console.log("[PushNotification] Failed to get FCM token");
      return false;
    } catch (error) {
      console.error("[PushNotification] Initialization failed:", error);
      return false;
    } finally {
      this._initPromise = null;
    }
  }

  /**
   * Request notification permission
   * @returns {Promise<boolean>} Whether permission was granted
   */
  async requestPermission() {
    if (!messaging || !fbApi.requestPermission) return false;

    try {
      const authStatus = await fbApi.requestPermission(messaging);

      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

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
   * Get the FCM token with timeout
   * @returns {Promise<string|null>} FCM token or null
   */
  async getToken() {
    if (!messaging) return null;

    // Helper function to add timeout to a promise
    const withTimeout = (promise, ms) => {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
      );
      return Promise.race([promise, timeout]);
    };

    try {
      // Check if registration is allowed
      console.log("[PushNotification] Registering device for remote messages...");

      // registerDeviceForRemoteMessages is primarily for iOS
      if (Platform.OS === 'ios' && fbApi.registerDeviceForRemoteMessages) {
        await withTimeout(fbApi.registerDeviceForRemoteMessages(messaging), 10000);
      }

      console.log("[PushNotification] Getting FCM token...");

      // Get token with 15 second timeout
      const token = await withTimeout(fbApi.getToken(messaging), 15000);

      if (!token) {
        console.warn("[PushNotification] No token returned from Firebase");
        return null;
      }

      this.currentToken = token;

      // Store token locally
      await AsyncStorage.setItem(STORAGE_KEYS.FCM_TOKEN, token);

      console.log("[PushNotification] Got FCM token:", token.substring(0, 30) + "...");
      return token;
    } catch (error) {
      console.error("[PushNotification] Failed to get token:", error.message || error);

      // Try to get cached token if available
      try {
        const cachedToken = await AsyncStorage.getItem(STORAGE_KEYS.FCM_TOKEN);
        if (cachedToken) {
          console.log("[PushNotification] Using cached FCM token");
          this.currentToken = cachedToken;
          return cachedToken;
        }
      } catch (cacheError) {
        console.warn("[PushNotification] Failed to get cached token:", cacheError.message);
      }

      return null;
    }
  }

  /**
   * Subscribe to token refresh events
   */
  subscribeToTokenRefresh() {
    if (!messaging) return;

    this.unsubscribeTokenRefresh = fbApi.onTokenRefresh(messaging, async (newToken) => {
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

    this.unsubscribeMessage = fbApi.onMessage(messaging, async (remoteMessage) => {
      console.log("[PushNotification] Foreground message received:", remoteMessage);

      // Display notification using notifee if available
      if (notifee && remoteMessage.notification) {
        await this.displayNotification(remoteMessage);
      }
    });
  }

  /**
   * Setup notification open handlers (for tapping on notifications)
   * Call this after NavigationContainer is ready
   */
  async setupNotificationOpenHandlers() {
    if (!messaging) {
      console.warn("[PushNotification] Messaging not available for open handlers");
      return;
    }

    try {
      // Handle notification opened from background state
      fbApi.onNotificationOpenedApp(messaging, (remoteMessage) => {
        console.log("[PushNotification] Notification opened from background:", remoteMessage);
        this.handleNotificationOpen(remoteMessage);
      });

      // Handle notification opened from quit state
      const initialNotification = await fbApi.getInitialNotification(messaging);
      if (initialNotification) {
        console.log("[PushNotification] App opened from quit state by notification:", initialNotification);
        // Small delay to ensure navigation is ready
        setTimeout(() => {
          this.handleNotificationOpen(initialNotification);
        }, 1000);
      }

      // Setup notifee foreground event handler for notification taps
      if (notifee) {
        notifee.onForegroundEvent(({ type, detail }) => {
          // EventType.PRESS = 1
          if (type === 1 && detail.notification) {
            console.log("[PushNotification] Notifee notification pressed:", detail.notification);
            this.handleNotificationOpen({
              data: detail.notification.data,
              notification: {
                title: detail.notification.title,
                body: detail.notification.body,
              },
            });
          }
        });
      }

      console.log("[PushNotification] Notification open handlers setup complete");
    } catch (error) {
      console.error("[PushNotification] Failed to setup open handlers:", error);
    }
  }

  /**
   * Handle notification open - navigate to notification center
   * @param {Object} remoteMessage - The notification message
   */
  handleNotificationOpen(remoteMessage) {
    console.log("[PushNotification] Handling notification open:", remoteMessage);

    const notificationData = {
      title: remoteMessage.notification?.title || "Notification",
      body: remoteMessage.notification?.body || "",
      data: remoteMessage.data || {},
    };

    // Navigate to notification center with the notification data
    navigateToNotificationCenter(notificationData);
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

      // Display the notification
      await notifee.displayNotification({
        title: notification?.title || "FMS Notification",
        body: notification?.body || "",
        data: data,
        android: {
          channelId: "push-notifications",
          pressAction: {
            id: "default",
          },
        },
      });
    } catch (error) {
      console.error("[PushNotification] Failed to display notification:", error);
    }
  }

  /**
   * Register FCM token with backend
   * @param {string} token - FCM token
   */
  async registerTokenWithBackend(token) {
    if (!this.authToken || !this.userId) {
      console.warn("[PushNotification] Cannot register: missing auth token or user ID");
      return false;
    }

    try {
      const deviceInfo = {
        deviceToken: token,
        platform: Platform.OS === "ios" ? "ios" : "android",
        deviceName: await DeviceInfo.getDeviceName(),
        deviceModel: DeviceInfo.getModel(),
        osVersion: DeviceInfo.getSystemVersion(),
        appVersion: DeviceInfo.getVersion(),
        userId: this.userId,
      };

      console.log("[PushNotification] Registering device with backend:", {
        ...deviceInfo,
        deviceToken: deviceInfo.deviceToken.substring(0, 20) + "...",
      });

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
        console.log("[PushNotification] ✅ Device registered with backend");
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
      this._initPromise = null;
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
    this._initPromise = null;
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
    const mod = require("@react-native-firebase/messaging");

    if (typeof mod.getMessaging === "function" && typeof mod.setBackgroundMessageHandler === "function") {
      const bgMessaging = mod.getMessaging();
      mod.setBackgroundMessageHandler(bgMessaging, async (remoteMessage) => {
        console.log("[PushNotification] Background message:", remoteMessage);
      });

      // Pre-populate module-level refs so initialize() can skip loading
      if (!messaging) {
        messaging = bgMessaging;
        fbApi = {
          getMessaging: mod.getMessaging,
          getToken: mod.getToken,
          requestPermission: mod.requestPermission,
          onMessage: mod.onMessage,
          onTokenRefresh: mod.onTokenRefresh,
          onNotificationOpenedApp: mod.onNotificationOpenedApp,
          getInitialNotification: mod.getInitialNotification,
          setBackgroundMessageHandler: mod.setBackgroundMessageHandler,
          registerDeviceForRemoteMessages: mod.registerDeviceForRemoteMessages,
        };
      }

      console.log("[PushNotification] Background message handler registered");
    }
  } catch (e) {
    console.warn("[PushNotification] Could not setup background handler:", e.message);
  }
}
