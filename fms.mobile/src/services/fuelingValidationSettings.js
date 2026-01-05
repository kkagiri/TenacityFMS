/**
 * Fueling Validation Settings Service
 * Fetches admin-managed settings from the backend API for fuel validation features
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG } from "../config/environment";

const STORAGE_KEYS = {
  CACHED_SETTINGS: "fms_fueling_validation_settings_cache",
  CACHE_TIMESTAMP: "fms_fueling_validation_settings_timestamp",
};

// Cache settings for 5 minutes
const CACHE_DURATION_MS = 5 * 60 * 1000;

class FuelingValidationSettings {
  constructor() {
    // Default values (used as fallback)
    this.fuelRulesCheckEnabled = true;
    this.fuelCapacityValidationEnabled = true;
    this.gpsFuelLevelCheckEnabled = true;
    this.isLoaded = false;
    this.lastFetchTime = null;
  }

  /**
   * Get the API base URL
   */
  getApiBaseUrl() {
    // API_CONFIG.BASE_URL already contains /api suffix
    // Remove it and use the full path
    const baseUrl = API_CONFIG.BASE_URL || "http://localhost:5000/api";
    // Remove trailing /api if present to build the full URL
    return baseUrl.replace(/\/api$/, "");
  }

  /**
   * Get auth token from storage
   */
  async getAuthToken() {
    try {
      const token = await AsyncStorage.getItem("userToken");
      return token;
    } catch (error) {
      console.error(
        "[FuelingValidationSettings] Error getting auth token:",
        error
      );
      return null;
    }
  }

  /**
   * Fetch settings from the backend API
   * @param {number} siteId - Optional site ID to get site-specific settings
   */
  async fetchSettingsFromApi(siteId = null) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        console.warn(
          "[FuelingValidationSettings] No auth token available, using cached/default settings"
        );
        return null;
      }

      const baseUrl = this.getApiBaseUrl();
      let url = `${baseUrl}/api/v1/automated-fueling-configuration/mobile-validation-settings`;
      if (siteId) {
        url += `?siteId=${siteId}`;
      }

      console.log("[FuelingValidationSettings] Fetching settings from:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error(
          "[FuelingValidationSettings] API request failed:",
          response.status
        );
        return null;
      }

      const result = await response.json();
      if (result.success && result.data) {
        return result.data;
      }

      console.warn(
        "[FuelingValidationSettings] API returned unsuccessful response:",
        result.message
      );
      return null;
    } catch (error) {
      console.error(
        "[FuelingValidationSettings] Error fetching settings from API:",
        error
      );
      return null;
    }
  }

  /**
   * Load cached settings from AsyncStorage
   */
  async loadCachedSettings() {
    try {
      const cachedData = await AsyncStorage.getItem(
        STORAGE_KEYS.CACHED_SETTINGS
      );
      const cacheTimestamp = await AsyncStorage.getItem(
        STORAGE_KEYS.CACHE_TIMESTAMP
      );

      if (cachedData && cacheTimestamp) {
        const timestamp = parseInt(cacheTimestamp, 10);
        const now = Date.now();

        // Check if cache is still valid
        if (now - timestamp < CACHE_DURATION_MS) {
          const settings = JSON.parse(cachedData);
          console.log(
            "[FuelingValidationSettings] Using cached settings:",
            settings
          );
          return settings;
        }
      }

      return null;
    } catch (error) {
      console.error(
        "[FuelingValidationSettings] Error loading cached settings:",
        error
      );
      return null;
    }
  }

  /**
   * Save settings to cache
   */
  async saveToCache(settings) {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.CACHED_SETTINGS,
        JSON.stringify(settings)
      );
      await AsyncStorage.setItem(
        STORAGE_KEYS.CACHE_TIMESTAMP,
        Date.now().toString()
      );
    } catch (error) {
      console.error(
        "[FuelingValidationSettings] Error saving to cache:",
        error
      );
    }
  }

  /**
   * Load all settings - fetches from API with cache fallback
   * @param {number} siteId - Optional site ID for site-specific settings
   */
  async loadSettings(siteId = null) {
    try {
      // Try to get cached settings first (for quick UI response)
      const cachedSettings = await this.loadCachedSettings();
      if (cachedSettings) {
        this.fuelRulesCheckEnabled =
          cachedSettings.enableFuelRulesCheck !== false;
        this.fuelCapacityValidationEnabled =
          cachedSettings.enableFuelCapacityValidation !== false;
        this.gpsFuelLevelCheckEnabled =
          cachedSettings.enableGPSFuelLevelCheck !== false;
        this.isLoaded = true;
      }

      // Fetch fresh settings from API
      const apiSettings = await this.fetchSettingsFromApi(siteId);
      if (apiSettings) {
        this.fuelRulesCheckEnabled = apiSettings.enableFuelRulesCheck !== false;
        this.fuelCapacityValidationEnabled =
          apiSettings.enableFuelCapacityValidation !== false;
        this.gpsFuelLevelCheckEnabled =
          apiSettings.enableGPSFuelLevelCheck !== false;
        this.isLoaded = true;
        this.lastFetchTime = Date.now();

        // Cache the settings
        await this.saveToCache(apiSettings);

        console.log("[FuelingValidationSettings] Loaded settings from API:", {
          fuelRulesCheck: this.fuelRulesCheckEnabled,
          fuelCapacityValidation: this.fuelCapacityValidationEnabled,
          gpsFuelLevelCheck: this.gpsFuelLevelCheckEnabled,
        });
      } else if (!cachedSettings) {
        // No API settings and no cache - use defaults
        console.log("[FuelingValidationSettings] Using default settings");
        this.fuelRulesCheckEnabled = true;
        this.fuelCapacityValidationEnabled = true;
        this.gpsFuelLevelCheckEnabled = true;
        this.isLoaded = true;
      }

      return {
        fuelRulesCheckEnabled: this.fuelRulesCheckEnabled,
        fuelCapacityValidationEnabled: this.fuelCapacityValidationEnabled,
        gpsFuelLevelCheckEnabled: this.gpsFuelLevelCheckEnabled,
      };
    } catch (error) {
      console.error(
        "[FuelingValidationSettings] Error loading settings:",
        error
      );
      // Return defaults on error
      return {
        fuelRulesCheckEnabled: true,
        fuelCapacityValidationEnabled: true,
        gpsFuelLevelCheckEnabled: true,
      };
    }
  }

  /**
   * Get all current settings
   */
  getSettings() {
    return {
      fuelRulesCheckEnabled: this.fuelRulesCheckEnabled,
      fuelCapacityValidationEnabled: this.fuelCapacityValidationEnabled,
      gpsFuelLevelCheckEnabled: this.gpsFuelLevelCheckEnabled,
    };
  }

  /**
   * Check if fuel rules check is enabled
   */
  isFuelRulesCheckEnabled() {
    return this.fuelRulesCheckEnabled;
  }

  /**
   * Check if fuel capacity validation is enabled
   */
  isFuelCapacityValidationEnabled() {
    return this.fuelCapacityValidationEnabled;
  }

  /**
   * Check if GPS fuel level check is enabled
   */
  isGpsFuelLevelCheckEnabled() {
    return this.gpsFuelLevelCheckEnabled;
  }

  /**
   * Force refresh settings from API
   * @param {number} siteId - Optional site ID for site-specific settings
   */
  async refreshSettings(siteId = null) {
    // Clear cache to force fresh fetch
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.CACHED_SETTINGS);
      await AsyncStorage.removeItem(STORAGE_KEYS.CACHE_TIMESTAMP);
    } catch (error) {
      console.error("[FuelingValidationSettings] Error clearing cache:", error);
    }
    return this.loadSettings(siteId);
  }

  /**
   * Clear local cache
   */
  async clearCache() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.CACHED_SETTINGS);
      await AsyncStorage.removeItem(STORAGE_KEYS.CACHE_TIMESTAMP);
      console.log("[FuelingValidationSettings] Cache cleared");
    } catch (error) {
      console.error("[FuelingValidationSettings] Error clearing cache:", error);
    }
  }
}

// Export singleton instance
const fuelingValidationSettings = new FuelingValidationSettings();
export default fuelingValidationSettings;

// Also export the class for testing purposes
export { FuelingValidationSettings, STORAGE_KEYS };
