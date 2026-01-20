/**
 * Environment Configuration
 * Loads environment variables from .env file using react-native-config
 */

import { Platform } from "react-native";

let Config;
try {
  Config = require("react-native-config").default;
  console.log("✅ [Environment] react-native-config loaded successfully");
} catch (error) {
  console.warn(
    "⚠️ [Environment] react-native-config not available, using default values:",
    error.message
  );
  Config = null;
}

// Fallback if Config is not properly initialized (before native module is built)
const safeConfig = Config || {};
console.log("📋 [Environment] Config initialized:", {
  hasConfig: !!Config,
  hasApiUrl: !!safeConfig.API_BASE_URL,
  hasSignalRUrl: !!safeConfig.SIGNALR_HUB_URL,
});

// Determine default URL based on platform and dev mode
// Android emulator uses 10.0.2.2 to access host localhost
// iOS simulator uses localhost directly
// Physical device via USB uses localhost with adb reverse (run: adb reverse tcp:7009 tcp:7009)
// Physical device via WiFi needs your computer's IP address
// Set USE_LOCAL_BACKEND to true to test with local backend
const USE_LOCAL_BACKEND = true; // Change to true to use local backend (requires rebuild with react-native-config)
const IS_PHYSICAL_DEVICE_USB = true; // Set to true when testing on physical device via USB
const DEV_MACHINE_IP = "10.0.13.50"; // Only used if USB is false - Replace with your computer's IP address (run 'ipconfig' to find it)

const getDefaultUrl = () => {
  if (__DEV__ && USE_LOCAL_BACKEND) {
    // Development mode with local backend
    if (Platform.OS === "android") {
      if (IS_PHYSICAL_DEVICE_USB) {
        return "http://localhost:7009"; // USB debugging with adb reverse
      }
      return "http://10.0.2.2:7009"; // Android emulator localhost alias
    }
    return "http://localhost:7009"; // iOS simulator
  }
  // Production or dev without local backend
  return "http://197.254.33.227:7009";
};

const DEFAULT_URL = getDefaultUrl();

/**
 * API Configuration
 */
export const API_CONFIG = {
  // Base API URL - automatically switches based on .env configuration
  BASE_URL: safeConfig.API_BASE_URL || `${DEFAULT_URL}/api`,

  // SignalR Hub URL
  SIGNALR_HUB_URL: safeConfig.SIGNALR_HUB_URL || DEFAULT_URL,

  // Request timeout (milliseconds)
  TIMEOUT: 30000,

  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
};

// Log environment configuration at startup
console.log("====================================");
console.log("🔧 FMS Mobile Environment Config:");
console.log("  API_BASE_URL:", API_CONFIG.BASE_URL);
console.log("  SIGNALR_HUB_URL:", API_CONFIG.SIGNALR_HUB_URL);
console.log("  Platform:", Platform.OS);
console.log("  Dev Mode:", __DEV__ ? "Yes" : "No");
console.log(
  "  From .env:",
  safeConfig.API_BASE_URL ? "Yes" : "No (using defaults)"
);
console.log("====================================");

/**
 * Debug Configuration
 */
export const DEBUG_CONFIG = {
  // Enable debug mode
  DEBUG_MODE: safeConfig.DEBUG_MODE === "true",

  // Enable API logging
  ENABLE_LOGGING: safeConfig.ENABLE_LOGGING === "true",

  // Log API requests and responses
  LOG_API_CALLS: safeConfig.DEBUG_MODE === "true",
};

/**
 * App Configuration
 */
export const APP_CONFIG = {
  // App name
  APP_NAME: "Hyoung FMS",

  // App version
  VERSION: "1.0.0",

  // SignalR reconnection settings
  SIGNALR_RECONNECT_DELAY: 5000,
  SIGNALR_MAX_RECONNECT_ATTEMPTS: 10,
};

/**
 * Environment helper functions
 */
export const ENV = {
  /**
   * Check if running in development mode
   */
  isDevelopment: () => __DEV__,

  /**
   * Check if debug mode is enabled
   */
  isDebugMode: () => DEBUG_CONFIG.DEBUG_MODE,

  /**
   * Get current environment configuration
   */
  getConfig: () => ({
    api: API_CONFIG,
    debug: DEBUG_CONFIG,
    app: APP_CONFIG,
  }),

  /**
   * Print current configuration to console
   */
  printConfig: () => {
    console.log("=== Environment Configuration ===");
    console.log("API Base URL:", API_CONFIG.BASE_URL);
    console.log("SignalR Hub URL:", API_CONFIG.SIGNALR_HUB_URL);
    console.log("Debug Mode:", DEBUG_CONFIG.DEBUG_MODE);
    console.log("Dev Mode (__DEV__):", __DEV__);
    console.log("================================");
  },

  /**
   * Test API connectivity
   */
  testConnection: async () => {
    try {
      console.log("Testing API connection to:", API_CONFIG.BASE_URL);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_CONFIG.BASE_URL}/v1/User`, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("API connection test result:", response.status);
      return { success: response.status < 500, status: response.status };
    } catch (error) {
      console.error("API connection test failed:", error.message);
      return { success: false, error: error.message };
    }
  },
};

// Log configuration on app start (only in debug mode)
if (DEBUG_CONFIG.DEBUG_MODE) {
  ENV.printConfig();
}

export default {
  API_CONFIG,
  DEBUG_CONFIG,
  APP_CONFIG,
  ENV,
};
