/**
 * Environment Configuration
 * Loads environment variables from .env file using react-native-config
 */

let Config;
try {
  Config = require("react-native-config").default;
} catch (error) {
  console.warn("react-native-config not available, using default values");
  Config = null;
}

// Fallback if Config is not properly initialized (before native module is built)
const safeConfig = Config || {};

/**
 * API Configuration
 */
export const API_CONFIG = {
  // Base API URL - automatically switches based on .env configuration
  // Production server: 197.254.33.227
  BASE_URL: safeConfig.API_BASE_URL || "http://197.254.33.227:7009/api",

  // SignalR Hub URL
  SIGNALR_HUB_URL: safeConfig.SIGNALR_HUB_URL || "http://197.254.33.227:7009",

  // Request timeout (milliseconds)
  TIMEOUT: 30000,

  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
};

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
    if (DEBUG_CONFIG.DEBUG_MODE) {
      console.log("=== Environment Configuration ===");
      console.log("API Base URL:", API_CONFIG.BASE_URL);
      console.log("SignalR Hub URL:", API_CONFIG.SIGNALR_HUB_URL);
      console.log("Debug Mode:", DEBUG_CONFIG.DEBUG_MODE);
      console.log("================================");
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
