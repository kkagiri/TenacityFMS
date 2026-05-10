/**
 * Web Push Notification Service
 *
 * Manages Firebase Cloud Messaging for browser push notifications.
 * Handles permission requests, token registration, and message handling.
 *
 * SETUP REQUIRED:
 * 1. Configure firebase.config.js with your Firebase project details
 * 2. Add firebase-messaging-sw.js to public folder
 * 3. Install firebase: npm install firebase
 */

import axiosInstance from "../api/axiosInstance";
// Import Firebase modules for webpack bundling
import "firebase/app";
import "firebase/messaging";

// Firebase will be loaded dynamically
let firebaseApp = null;
let messaging = null;

/**
 * Push Notification Service for Web
 */
class WebPushNotificationService {
  constructor() {
    this.isInitialized = false;
    this.currentToken = null;
    this.vapidKey = null;
    this.onMessageCallback = null;
  }

  /**
   * Initialize Firebase and messaging
   * @returns {Promise<boolean>} Whether initialization succeeded
   */
  async initialize() {
    if (this.isInitialized) {
      console.log("[WebPush] Already initialized");
      return true;
    }

    // Check if browser supports notifications
    if (!("Notification" in window)) {
      console.warn("[WebPush] This browser does not support notifications");
      return false;
    }

    // Check if service workers are supported
    if (!("serviceWorker" in navigator)) {
      console.warn("[WebPush] Service workers are not supported");
      return false;
    }

    try {
      // Dynamically import Firebase modules
      const { initializeApp, getApps } = await import("firebase/app");
      const { getMessaging, getToken, onMessage, isSupported } = await import(
        "firebase/messaging"
      );

      // Check if messaging is supported
      const supported = await isSupported();
      if (!supported) {
        console.warn(
          "[WebPush] Firebase messaging not supported in this browser"
        );
        return false;
      }

      // Import config
      const { default: firebaseConfig, VAPID_KEY } = await import(
        "../config/firebase.config"
      );
      this.vapidKey = VAPID_KEY;

      // Initialize Firebase app if not already done
      if (getApps().length === 0) {
        firebaseApp = initializeApp(firebaseConfig);
        console.log("[WebPush] Firebase initialized");
      } else {
        firebaseApp = getApps()[0];
      }

      // Get messaging instance
      messaging = getMessaging(firebaseApp);

      // Register service worker
      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );
      console.log("[WebPush] Service worker registered:", registration.scope);

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error("[WebPush] Initialization failed:", error);
      return false;
    }
  }

  /**
   * Request notification permission and get FCM token
   * @returns {Promise<string|null>} FCM token or null if failed
   */
  async requestPermissionAndGetToken() {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return null;
    }

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      console.log("[WebPush] Permission:", permission);

      if (permission !== "granted") {
        console.log("[WebPush] Notification permission denied");
        return null;
      }

      // Get FCM token
      const { getToken } = await import("firebase/messaging");

      const registration = await navigator.serviceWorker.ready;
      const token = await getToken(messaging, {
        vapidKey: this.vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (token) {
        this.currentToken = token;
        console.log("[WebPush] Got FCM token:", token.substring(0, 20) + "...");
        return token;
      } else {
        console.log("[WebPush] No registration token available");
        return null;
      }
    } catch (error) {
      console.error("[WebPush] Failed to get token:", error);
      return null;
    }
  }

  /**
   * Register the FCM token with the backend
   * @param {string} token - FCM token to register
   * @returns {Promise<boolean>} Whether registration succeeded
   */
  async registerTokenWithBackend(token) {
    if (!token) {
      console.warn("[WebPush] No token to register");
      return false;
    }

    try {
      const deviceInfo = {
        token: token,
        platform: "Web",
        deviceName: this.getBrowserName(),
        deviceModel: navigator.userAgent.substring(0, 100),
        appVersion: "1.0.0",
      };

      const response = await axiosInstance.post(
        "/push-devices/register",
        deviceInfo
      );

      if (response.data?.isSuccess) {
        console.log("[WebPush] ✅ Device registered with backend");
        localStorage.setItem("fms_push_device_registered", "true");
        localStorage.setItem("fms_push_token", token);
        return true;
      } else {
        console.error("[WebPush] Registration failed:", response.data?.message);
        return false;
      }
    } catch (error) {
      console.error("[WebPush] Registration error:", error);
      return false;
    }
  }

  /**
   * Unregister the device from push notifications
   * @returns {Promise<boolean>} Whether unregistration succeeded
   */
  async unregisterDevice() {
    const token = this.currentToken || localStorage.getItem("fms_push_token");
    if (!token) {
      console.log("[WebPush] No token to unregister");
      return true;
    }

    try {
      const response = await axiosInstance.post("/push-devices/unregister", {
        token,
      });

      if (response.data?.isSuccess) {
        console.log("[WebPush] Device unregistered");
      }

      localStorage.removeItem("fms_push_device_registered");
      localStorage.removeItem("fms_push_token");
      this.currentToken = null;
      return true;
    } catch (error) {
      console.error("[WebPush] Unregister error:", error);
      return false;
    }
  }

  /**
   * Setup foreground message handler
   * @param {Function} callback - Function to call when message is received
   */
  onForegroundMessage(callback) {
    if (!messaging) {
      console.warn("[WebPush] Cannot setup message handler - not initialized");
      return;
    }

    this.onMessageCallback = callback;

    import("firebase/messaging").then(({ onMessage }) => {
      onMessage(messaging, (payload) => {
        console.log("[WebPush] Foreground message received:", payload);

        // Show notification manually for foreground messages
        if (Notification.permission === "granted") {
          const { title, body, icon } = payload.notification || {};
          new Notification(title || "FMS Notification", {
            body: body || "",
            icon: icon || "/logo192.png",
            data: payload.data,
          });
        }

        // Call custom callback if provided
        if (this.onMessageCallback) {
          this.onMessageCallback(payload);
        }
      });
    });
  }

  /**
   * Check if push notifications are enabled
   * @returns {boolean} Whether push is enabled
   */
  isPushEnabled() {
    return localStorage.getItem("fms_push_device_registered") === "true";
  }

  /**
   * Check current permission status
   * @returns {string} 'granted', 'denied', or 'default'
   */
  getPermissionStatus() {
    if (!("Notification" in window)) return "unsupported";
    return Notification.permission;
  }

  /**
   * Get the current FCM token
   * @returns {string|null} Current token
   */
  getCurrentToken() {
    return this.currentToken || localStorage.getItem("fms_push_token");
  }

  /**
   * Get browser name for device info
   * @returns {string} Browser name
   */
  getBrowserName() {
    const ua = navigator.userAgent;
    if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
    if (ua.includes("Edg")) return "Edge";
    if (ua.includes("Opera") || ua.includes("OPR")) return "Opera";
    return "Unknown Browser";
  }

  /**
   * Full flow: request permission, get token, and register with backend
   * @returns {Promise<boolean>} Whether the full flow succeeded
   */
  async enablePushNotifications() {
    console.log("[WebPush] Starting push notification setup...");

    // Initialize if needed
    const initialized = await this.initialize();
    if (!initialized) {
      console.warn("[WebPush] Initialization failed");
      return false;
    }

    // Request permission and get token
    const token = await this.requestPermissionAndGetToken();
    if (!token) {
      console.warn("[WebPush] Failed to get token");
      return false;
    }

    // Register with backend
    const registered = await this.registerTokenWithBackend(token);
    if (!registered) {
      console.warn("[WebPush] Failed to register with backend");
      return false;
    }

    // Setup foreground message handling
    this.onForegroundMessage((payload) => {
      console.log("[WebPush] Message in foreground:", payload);
    });

    console.log("[WebPush] ✅ Push notifications enabled successfully");
    return true;
  }

  /**
   * Cleanup on logout
   */
  async cleanup() {
    await this.unregisterDevice();
    this.isInitialized = false;
    this.currentToken = null;
  }
}

// Export singleton instance
const webPushNotificationService = new WebPushNotificationService();
export default webPushNotificationService;
