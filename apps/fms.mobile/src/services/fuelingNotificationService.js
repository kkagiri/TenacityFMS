//Cursor - Fueling Notification Service
// Shows persistent foreground notification during fueling with progress and stop button
// Works for both user-initiated and external fueling (detected via SignalR)

import { AppState, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import signalRService from "./signalRService";

// Note: This service requires @notifee/react-native to be installed and native modules linked
// The service will work without notifee, but notifications will be disabled

let notifee = null;
let AndroidImportance = { HIGH: 4 }; // Default value
let EventType = { ACTION_PRESS: 1 }; // Default value

const CHANNEL_ID = "fueling-progress";
const NOTIFICATION_ID = "fueling-active";

// Storage keys for notification settings
const STORAGE_KEYS = {
  FUELING_NOTIFICATIONS_ENABLED: "fms_fueling_notifications_enabled",
  FUELING_NOTIFICATIONS_PTS_LIST: "fms_fueling_notifications_pts_list",
};

class FuelingNotificationService {
  constructor() {
    this.isInitialized = false;
    this.activeFuelings = new Map(); // deviceId:pumpId -> fueling info
    this.signalRSubscriptions = [];
    this.appStateSubscription = null;
    // Settings
    this.notificationsEnabled = true; // Default enabled
    this.allowedDeviceIds = []; // Empty = all devices allowed
  }

  /**
   * Initialize the notification service
   */
  async initialize() {
    console.log("[FuelingNotification] Initializing service...");

    if (this.isInitialized) {
      console.log("[FuelingNotification] Already initialized");
      return;
    }

    // Load saved settings
    await this.loadSettings();

    // Try to load notifee lazily to avoid crash if native module not linked
    if (!notifee) {
      try {
        const notifeeModule = require("@notifee/react-native");
        notifee = notifeeModule.default;
        if (notifeeModule.AndroidImportance) {
          AndroidImportance = notifeeModule.AndroidImportance;
        }
        if (notifeeModule.EventType) {
          EventType = notifeeModule.EventType;
        }
        console.log("[FuelingNotification] Notifee module loaded successfully");
      } catch (e) {
        console.warn(
          "[FuelingNotification] @notifee/react-native not available:",
          e.message
        );
        console.warn(
          "[FuelingNotification] Notifications will be disabled. Run: npm install @notifee/react-native && cd ios && pod install"
        );
        // Subscribe to events anyway (for logging/debugging)
        this.subscribeToFuelingEvents();
        this.isInitialized = true;
        return;
      }
    }

    if (!notifee) {
      console.warn(
        "[FuelingNotification] Notifee not available, skipping initialization"
      );
      this.subscribeToFuelingEvents();
      this.isInitialized = true;
      return;
    }

    try {
      console.log("[FuelingNotification] Creating notification channel...");
      // Create notification channel for Android
      if (Platform.OS === "android") {
        await notifee.createChannel({
          id: CHANNEL_ID,
          name: "Fueling Progress",
          description: "Shows fueling progress and allows stopping the pump",
          importance: AndroidImportance.HIGH,
          vibration: false,
          sound: undefined,
        });
      }

      // Handle notification actions (Stop button pressed)
      notifee.onForegroundEvent(({ type, detail }) => {
        if (type === EventType.ACTION_PRESS) {
          this.handleNotificationAction(
            detail.pressAction?.id,
            detail.notification?.data
          );
        }
      });

      // Also handle background events
      notifee.onBackgroundEvent(async ({ type, detail }) => {
        if (type === EventType.ACTION_PRESS) {
          await this.handleNotificationAction(
            detail.pressAction?.id,
            detail.notification?.data
          );
        }
      });

      // Subscribe to SignalR events to detect all fueling activity
      this.subscribeToFuelingEvents();

      // Handle app state changes
      this.appStateSubscription = AppState.addEventListener(
        "change",
        (state) => {
          if (state === "active") {
            // App came to foreground - refresh active fuelings
            this.refreshActiveFuelings();
          }
        }
      );

      this.isInitialized = true;
      console.log("[FuelingNotification] Service initialized");
    } catch (error) {
      console.error("[FuelingNotification] Initialization error:", error);
    }
  }

  /**
   * Subscribe to SignalR events to detect fueling activity
   */
  subscribeToFuelingEvents() {
    // Listen for upload status updates (fueling progress)
    const uploadStatusSub = signalRService.on("UploadStatusUpdate", (data) => {
      this.handleUploadStatus(data);
    });
    if (uploadStatusSub) this.signalRSubscriptions.push(uploadStatusSub);

    // Listen for transaction updates
    const transactionSub = signalRService.on("TransactionUpdate", (data) => {
      this.handleTransactionUpdate(data);
    });
    if (transactionSub) this.signalRSubscriptions.push(transactionSub);

    // Listen for device disconnect
    const disconnectSub = signalRService.on("DeviceDisconnected", (data) => {
      this.handleDeviceDisconnected(data);
    });
    if (disconnectSub) this.signalRSubscriptions.push(disconnectSub);
  }

  /**
   * Load notification settings from AsyncStorage
   */
  async loadSettings() {
    try {
      const [enabledStr, ptsListStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.FUELING_NOTIFICATIONS_ENABLED),
        AsyncStorage.getItem(STORAGE_KEYS.FUELING_NOTIFICATIONS_PTS_LIST),
      ]);

      // Parse enabled setting (default to true)
      this.notificationsEnabled = enabledStr !== "false";

      // Parse allowed devices list
      if (ptsListStr) {
        try {
          this.allowedDeviceIds = JSON.parse(ptsListStr);
        } catch (e) {
          this.allowedDeviceIds = [];
        }
      } else {
        this.allowedDeviceIds = [];
      }

      console.log(
        `[FuelingNotification] Settings loaded: enabled=${this.notificationsEnabled}, allowedDevices=${this.allowedDeviceIds.length}`
      );
    } catch (error) {
      console.error("[FuelingNotification] Error loading settings:", error);
    }
  }

  /**
   * Set whether notifications are enabled
   * @param {boolean} enabled - Whether notifications should be shown
   */
  async setEnabled(enabled) {
    this.notificationsEnabled = enabled;
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.FUELING_NOTIFICATIONS_ENABLED,
        enabled ? "true" : "false"
      );
      console.log(`[FuelingNotification] Notifications enabled: ${enabled}`);

      // If disabling, hide any active notifications
      if (!enabled) {
        this.hideNotification();
      }
    } catch (error) {
      console.error(
        "[FuelingNotification] Error saving enabled setting:",
        error
      );
    }
  }

  /**
   * Set the list of allowed device IDs for notifications
   * @param {string[]} deviceIds - Array of device IDs that should trigger notifications
   */
  async setAllowedDevices(deviceIds) {
    this.allowedDeviceIds = deviceIds || [];
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.FUELING_NOTIFICATIONS_PTS_LIST,
        JSON.stringify(this.allowedDeviceIds)
      );
      console.log(
        `[FuelingNotification] Allowed devices updated: ${this.allowedDeviceIds.length} devices`
      );
    } catch (error) {
      console.error(
        "[FuelingNotification] Error saving allowed devices:",
        error
      );
    }
  }

  /**
   * Check if notifications should be shown for a device
   * @param {string} deviceId - The device ID to check
   * @returns {boolean} True if notifications should be shown for this device
   */
  shouldShowNotificationForDevice(deviceId) {
    // If notifications are disabled globally, don't show
    if (!this.notificationsEnabled) {
      return false;
    }

    // If no specific devices are set, allow all
    if (!this.allowedDeviceIds || this.allowedDeviceIds.length === 0) {
      return true;
    }

    // Check if device is in allowed list
    return this.allowedDeviceIds.includes(deviceId);
  }

  /**
   * Handle upload status updates from SignalR
   */
  handleUploadStatus(data) {
    if (!data) return;

    const deviceId = data.DeviceId || data.deviceId;
    const pumps = data.Pumps || data.pumps || [];

    pumps.forEach((pump) => {
      const pumpId = pump.PumpId ?? pump.pumpId ?? pump.Pump ?? pump.pump;
      const state = (pump.State || pump.state || "").toUpperCase();
      const volume = pump.Volume ?? pump.volume ?? 0;
      const amount = pump.Amount ?? pump.amount ?? 0;
      const nozzle = pump.Nozzle ?? pump.nozzle;
      const transactionId = pump.Transaction ?? pump.transaction;

      const key = `${deviceId}:${pumpId}`;

      if (state === "FILLING" || state === "AUTHORIZED") {
        // Fueling in progress
        this.activeFuelings.set(key, {
          deviceId,
          pumpId,
          nozzle,
          transactionId,
          volume,
          amount,
          state,
          lastUpdate: Date.now(),
        });
        this.showFuelingNotification(
          deviceId,
          pumpId,
          volume,
          amount,
          transactionId
        );
      } else if (state === "IDLE" || state === "ENDOFTRANSACTION") {
        // Fueling ended
        if (this.activeFuelings.has(key)) {
          this.activeFuelings.delete(key);
          if (this.activeFuelings.size === 0) {
            this.hideNotification();
          } else {
            this.updateNotificationWithActiveFuelings();
          }
        }
      }
    });
  }

  /**
   * Handle transaction updates
   */
  handleTransactionUpdate(data) {
    if (!data) return;

    const deviceId = data.DeviceId || data.deviceId;
    const pumpId = data.PumpId || data.pumpId;
    const status = data.Status || data.status;
    const volume = data.Volume ?? data.volume ?? 0;
    const amount = data.Amount ?? data.amount ?? 0;
    const transactionId = data.TransactionId || data.transactionId;

    const key = `${deviceId}:${pumpId}`;

    if (
      status === "InProgress" ||
      status === "Fueling" ||
      status === "Authorized"
    ) {
      this.activeFuelings.set(key, {
        deviceId,
        pumpId,
        transactionId,
        volume,
        amount,
        state: status,
        lastUpdate: Date.now(),
      });
      this.showFuelingNotification(
        deviceId,
        pumpId,
        volume,
        amount,
        transactionId
      );
    } else if (
      status === "Completed" ||
      status === "Cancelled" ||
      status === "Error"
    ) {
      if (this.activeFuelings.has(key)) {
        this.activeFuelings.delete(key);
        if (this.activeFuelings.size === 0) {
          this.hideNotification();
        } else {
          this.updateNotificationWithActiveFuelings();
        }
      }
    }
  }

  /**
   * Handle device disconnection
   */
  handleDeviceDisconnected(data) {
    const deviceId = data?.DeviceId || data?.deviceId;
    if (!deviceId) return;

    // Remove all fuelings for this device
    for (const [key] of this.activeFuelings) {
      if (key.startsWith(`${deviceId}:`)) {
        this.activeFuelings.delete(key);
      }
    }

    if (this.activeFuelings.size === 0) {
      this.hideNotification();
    } else {
      this.updateNotificationWithActiveFuelings();
    }
  }

  /**
   * Show or update the fueling notification
   */
  async showFuelingNotification(
    deviceId,
    pumpId,
    volume,
    amount,
    transactionId
  ) {
    // Check if we should show notification for this device
    if (!this.shouldShowNotificationForDevice(deviceId)) {
      console.log(
        `[FuelingNotification] Skipping notification for device ${deviceId} (not allowed or disabled)`
      );
      return;
    }

    if (!notifee) {
      console.log(
        `[FuelingNotification] Would show: Pump ${pumpId} - ${volume?.toFixed(
          2
        )}L`
      );
      return;
    }

    try {
      const title =
        this.activeFuelings.size > 1
          ? `${this.activeFuelings.size} Active Fueling Operations`
          : `Fueling in Progress - Pump ${pumpId}`;

      let body = "";
      if (this.activeFuelings.size > 1) {
        // Multiple fuelings - show summary
        const entries = Array.from(this.activeFuelings.values());
        body = entries
          .map((f) => `Pump ${f.pumpId}: ${(f.volume || 0).toFixed(2)}L`)
          .join("\n");
      } else {
        // Single fueling - show details
        body = `Volume: ${(volume || 0).toFixed(2)}L\nAmount: KES ${(
          amount || 0
        ).toFixed(2)}`;
      }

      await notifee.displayNotification({
        id: NOTIFICATION_ID,
        title,
        body,
        data: {
          deviceId,
          pumpId: String(pumpId),
          transactionId: String(transactionId || ""),
        },
        android: {
          channelId: CHANNEL_ID,
          ongoing: true, // Persistent notification
          pressAction: {
            id: "open",
            launchActivity: "default",
          },
          actions: [
            {
              title: "🛑 Stop Fueling",
              pressAction: {
                id: "stop",
              },
            },
          ],
          progress: {
            indeterminate: true,
          },
          smallIcon: "ic_launcher", // Use app launcher icon
          color: "#f97316", // Orange color
        },
        ios: {
          interruptionLevel: "active",
        },
      });
    } catch (error) {
      console.error("[FuelingNotification] Error showing notification:", error);
    }
  }

  /**
   * Update notification to show all active fuelings
   */
  async updateNotificationWithActiveFuelings() {
    if (this.activeFuelings.size === 0) {
      await this.hideNotification();
      return;
    }

    const firstFueling = this.activeFuelings.values().next().value;
    await this.showFuelingNotification(
      firstFueling.deviceId,
      firstFueling.pumpId,
      firstFueling.volume,
      firstFueling.amount,
      firstFueling.transactionId
    );
  }

  /**
   * Hide the fueling notification
   */
  async hideNotification() {
    if (!notifee) return;

    try {
      await notifee.cancelNotification(NOTIFICATION_ID);
      console.log("[FuelingNotification] Notification hidden");
    } catch (error) {
      console.error("[FuelingNotification] Error hiding notification:", error);
    }
  }

  /**
   * Handle notification action (Stop button)
   */
  async handleNotificationAction(actionId, data) {
    if (actionId === "stop") {
      const { deviceId, pumpId, transactionId } = data || {};
      console.log("[FuelingNotification] Stop action pressed:", {
        deviceId,
        pumpId,
        transactionId,
      });

      if (deviceId && pumpId) {
        try {
          // Import pumpControlService dynamically to avoid circular deps
          const { pumpControlService } = require("./pumpControlService");
          await pumpControlService.stopPump(deviceId, parseInt(pumpId));
          console.log("[FuelingNotification] Stop command sent");
        } catch (error) {
          console.error("[FuelingNotification] Error stopping pump:", error);
        }
      }
    }
  }

  /**
   * Refresh active fuelings (called when app comes to foreground)
   */
  refreshActiveFuelings() {
    // Clean up stale entries (older than 5 minutes with no updates)
    const staleThreshold = 5 * 60 * 1000;
    const now = Date.now();

    for (const [key, fueling] of this.activeFuelings) {
      if (now - fueling.lastUpdate > staleThreshold) {
        this.activeFuelings.delete(key);
      }
    }

    if (this.activeFuelings.size === 0) {
      this.hideNotification();
    } else {
      this.updateNotificationWithActiveFuelings();
    }
  }

  /**
   * Manually start showing notification for a fueling
   * Called when user initiates fueling
   */
  startFuelingNotification(deviceId, pumpId, transactionId) {
    const key = `${deviceId}:${pumpId}`;
    this.activeFuelings.set(key, {
      deviceId,
      pumpId,
      transactionId,
      volume: 0,
      amount: 0,
      state: "Authorized",
      lastUpdate: Date.now(),
    });
    this.showFuelingNotification(deviceId, pumpId, 0, 0, transactionId);
  }

  /**
   * Manually update notification with current progress
   */
  updateFuelingProgress(deviceId, pumpId, volume, amount) {
    const key = `${deviceId}:${pumpId}`;
    const existing = this.activeFuelings.get(key);
    if (existing) {
      existing.volume = volume;
      existing.amount = amount;
      existing.lastUpdate = Date.now();
      this.showFuelingNotification(
        deviceId,
        pumpId,
        volume,
        amount,
        existing.transactionId
      );
    }
  }

  /**
   * Manually stop notification for a fueling
   */
  stopFuelingNotification(deviceId, pumpId) {
    const key = `${deviceId}:${pumpId}`;
    this.activeFuelings.delete(key);

    if (this.activeFuelings.size === 0) {
      this.hideNotification();
    } else {
      this.updateNotificationWithActiveFuelings();
    }
  }

  /**
   * Cleanup subscriptions
   */
  cleanup() {
    this.signalRSubscriptions.forEach((unsub) => {
      if (typeof unsub === "function") unsub();
    });
    this.signalRSubscriptions = [];

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    this.hideNotification();
    this.activeFuelings.clear();
    this.isInitialized = false;
  }
}

// Singleton instance
const fuelingNotificationService = new FuelingNotificationService();
export default fuelingNotificationService;
