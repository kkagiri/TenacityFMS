/**
 * Fueling Validation Settings Service
 * Fetches admin-managed settings from the backend API for fuel validation features
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG } from "../config/environment";

const STORAGE_KEYS = {
  CACHED_SETTINGS: "fms_fueling_validation_settings_cache",
  CACHE_TIMESTAMP: "fms_fueling_validation_settings_timestamp",
  CACHED_LOCATION_SETTINGS: "fms_mobile_location_settings_cache",
  LOCATION_SETTINGS_TIMESTAMP: "fms_mobile_location_settings_timestamp",
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

    // Mobile Location Settings (server-managed)
    this.locationSettings = {
      requireMobileLocation: true,
      maxLocationAgeSeconds: 60,
      maxLocationAccuracyMeters: 500,
      rejectCachedLocation: true,
      requireOperatorInGeofence: false,
      bypassOnGPSFailure: true,
    };
    this.locationSettingsLoaded = false;
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
      await AsyncStorage.removeItem(STORAGE_KEYS.CACHED_LOCATION_SETTINGS);
      await AsyncStorage.removeItem(STORAGE_KEYS.LOCATION_SETTINGS_TIMESTAMP);
      console.log("[FuelingValidationSettings] Cache cleared");
    } catch (error) {
      console.error("[FuelingValidationSettings] Error clearing cache:", error);
    }
  }

  // ==========================================
  // Mobile Location Settings Methods
  // ==========================================

  /**
   * Fetch mobile location settings from API
   * @returns {Promise<Object|null>} Location settings or null on error
   */
  async fetchLocationSettingsFromApi() {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        console.warn("[FuelingValidationSettings] No auth token, using cached/default location settings");
        return null;
      }

      const baseUrl = this.getApiBaseUrl();
      const url = `${baseUrl}/api/v1/SystemConfiguration/mobile-location-settings`;

      console.log("[FuelingValidationSettings] Fetching location settings from:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error("[FuelingValidationSettings] Location settings API request failed:", response.status);
        return null;
      }

      const result = await response.json();
      if (result.success && result.data) {
        console.log("[FuelingValidationSettings] Location settings received:", result.data);
        return result.data;
      }

      console.warn("[FuelingValidationSettings] API returned unsuccessful response:", result.message);
      return null;
    } catch (error) {
      console.error("[FuelingValidationSettings] Error fetching location settings:", error);
      return null;
    }
  }

  /**
   * Load cached location settings
   * @returns {Promise<Object|null>} Cached settings or null
   */
  async loadCachedLocationSettings() {
    try {
      const cachedData = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_LOCATION_SETTINGS);
      const cacheTimestamp = await AsyncStorage.getItem(STORAGE_KEYS.LOCATION_SETTINGS_TIMESTAMP);

      if (cachedData && cacheTimestamp) {
        const timestamp = parseInt(cacheTimestamp, 10);
        const now = Date.now();

        if (now - timestamp < CACHE_DURATION_MS) {
          const settings = JSON.parse(cachedData);
          console.log("[FuelingValidationSettings] Using cached location settings:", settings);
          return settings;
        }
      }

      return null;
    } catch (error) {
      console.error("[FuelingValidationSettings] Error loading cached location settings:", error);
      return null;
    }
  }

  /**
   * Save location settings to cache
   * @param {Object} settings - Location settings to cache
   */
  async saveLocationSettingsToCache(settings) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CACHED_LOCATION_SETTINGS, JSON.stringify(settings));
      await AsyncStorage.setItem(STORAGE_KEYS.LOCATION_SETTINGS_TIMESTAMP, Date.now().toString());
    } catch (error) {
      console.error("[FuelingValidationSettings] Error saving location settings to cache:", error);
    }
  }

  /**
   * Load mobile location settings from API with cache fallback
   * @returns {Promise<Object>} Location settings
   */
  async loadLocationSettings() {
    try {
      // Try cached settings first
      const cachedSettings = await this.loadCachedLocationSettings();
      if (cachedSettings) {
        this.locationSettings = { ...this.locationSettings, ...cachedSettings };
        this.locationSettingsLoaded = true;
      }

      // Fetch fresh from API
      const apiSettings = await this.fetchLocationSettingsFromApi();
      if (apiSettings) {
        this.locationSettings = {
          requireMobileLocation: apiSettings.requireMobileLocation ?? true,
          maxLocationAgeSeconds: apiSettings.maxLocationAgeSeconds ?? 60,
          maxLocationAccuracyMeters: apiSettings.maxLocationAccuracyMeters ?? 500,
          rejectCachedLocation: apiSettings.rejectCachedLocation ?? true,
          requireOperatorInGeofence: apiSettings.requireOperatorInGeofence ?? false,
          bypassOnGPSFailure: apiSettings.bypassOnGPSFailure ?? true,
        };
        this.locationSettingsLoaded = true;

        // Cache the settings
        await this.saveLocationSettingsToCache(this.locationSettings);

        console.log("[FuelingValidationSettings] Location settings loaded:", this.locationSettings);
      }

      return this.locationSettings;
    } catch (error) {
      console.error("[FuelingValidationSettings] Error loading location settings:", error);
      return this.locationSettings;
    }
  }

  /**
   * Get current location settings
   * @returns {Object} Current location settings
   */
  getLocationSettings() {
    return { ...this.locationSettings };
  }

  /**
   * Get max location age in seconds
   * @returns {number} Max age in seconds
   */
  getMaxLocationAgeSeconds() {
    return this.locationSettings.maxLocationAgeSeconds;
  }

  /**
   * Get max location accuracy in meters
   * @returns {number} Max accuracy in meters
   */
  getMaxLocationAccuracyMeters() {
    return this.locationSettings.maxLocationAccuracyMeters;
  }

  /**
   * Check if cached locations should be rejected
   * @returns {boolean} True if cached locations should be rejected
   */
  shouldRejectCachedLocation() {
    return this.locationSettings.rejectCachedLocation;
  }

  /**
   * Check if mobile location is required
   * @returns {boolean} True if mobile location is required
   */
  isMobileLocationRequired() {
    return this.locationSettings.requireMobileLocation;
  }

  /**
   * Check if GPS failure can be bypassed
   * @returns {boolean} True if bypass is allowed
   */
  canBypassOnGPSFailure() {
    return this.locationSettings.bypassOnGPSFailure;
  }
}

// Export singleton instance
const fuelingValidationSettings = new FuelingValidationSettings();
export default fuelingValidationSettings;

// Also export the class for testing purposes
export { FuelingValidationSettings, STORAGE_KEYS };
