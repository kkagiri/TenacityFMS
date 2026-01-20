/**
 * Location Service for FMS Mobile
 * Handles GPS location fetching with permission management
 * Prompts user to enable location from settings if disabled
 */
import { Platform, Alert, Linking, PermissionsAndroid } from "react-native";
import Geolocation from "@react-native-community/geolocation";

// Configure geolocation - use Google Play Services on Android for better reliability
Geolocation.setRNConfiguration({
  skipPermissionRequests: false, // Let us handle permissions manually
  authorizationLevel: "whenInUse",
  locationProvider: Platform.OS === "android" ? "playServices" : "auto", // Force Play Services on Android
});

class LocationService {
  constructor() {
    this.lastKnownLocation = null;
    this.locationWatchId = null;
    this.isWarmingUp = false; // Track if we're pre-fetching location
    this.pendingLocationRequest = null; // Track pending request to prevent duplicate callbacks
    this.requestId = 0; // Unique ID for each request to prevent stale callbacks
    this.permissionVerified = false; // Track if permission was already verified this session
  }

  /**
   * Pre-warm location service by getting an initial location and verifying permissions
   * Call this early (e.g., when user opens fueling screen) to improve later fetch speed
   * and avoid permission prompts during authorization
   * @param {boolean} requestPermission - If true, request permission if not granted (default: true)
   * @returns {Promise<{permissionGranted: boolean, locationAvailable: boolean}>}
   */
  async warmUpLocation(requestPermission = true) {
    if (this.isWarmingUp) {
      console.log("[LocationService] Already warming up location...");
      return {
        permissionGranted: this.permissionVerified,
        locationAvailable: !!this.lastKnownLocation,
      };
    }

    this.isWarmingUp = true;
    console.log("[LocationService] Warming up location service...");

    try {
      // First check permission
      const { granted } = await this.checkLocationPermission();

      if (!granted && requestPermission) {
        console.log("[LocationService] Permission not granted, requesting...");
        const permissionGranted = await this.requestLocationPermission();
        if (permissionGranted) {
          this.permissionVerified = true;
        } else {
          console.log("[LocationService] Permission denied during warm-up");
          return { permissionGranted: false, locationAvailable: false };
        }
      } else if (granted) {
        this.permissionVerified = true;
      }

      // Try to get a quick location with relaxed settings (silent mode)
      const location = await this.getCurrentLocation({
        enableHighAccuracy: false, // Network location is faster
        timeout: 5000, // Quick attempt
        maximumAge: 300000, // Accept old cached locations (5 min)
        silentMode: true, // Don't show any alerts during warm-up
      });

      if (location) {
        console.log("[LocationService] Location warmed up successfully");
        return { permissionGranted: true, locationAvailable: true };
      }

      return {
        permissionGranted: this.permissionVerified,
        locationAvailable: false,
      };
    } catch (error) {
      console.log(
        "[LocationService] Location warm-up failed (non-critical):",
        error
      );
      return {
        permissionGranted: this.permissionVerified,
        locationAvailable: !!this.lastKnownLocation,
      };
    } finally {
      this.isWarmingUp = false;
    }
  }

  /**
   * Check if permission has been verified in this session
   * @returns {boolean}
   */
  isPermissionVerified() {
    return this.permissionVerified;
  }

  /**
   * Check if location services are enabled and permissions are granted
   * @returns {Promise<{granted: boolean, canAskAgain: boolean}>}
   */
  async checkLocationPermission() {
    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return { granted, canAskAgain: true };
      } else {
        // iOS - would need react-native-permissions for detailed status
        return { granted: true, canAskAgain: true };
      }
    } catch (error) {
      console.error("[LocationService] Permission check error:", error);
      return { granted: false, canAskAgain: true };
    }
  }

  /**
   * Request location permission from the user
   * @returns {Promise<boolean>} True if permission granted
   */
  async requestLocationPermission() {
    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission Required",
            message:
              "FMS needs access to your location to verify you are near the fuel dispenser for authorization.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log("[LocationService] Location permission granted");
          return true;
        } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          // User selected "Don't ask again" - need to direct to settings
          this.showEnableLocationAlert(true);
          return false;
        } else {
          console.log("[LocationService] Location permission denied");
          return false;
        }
      } else {
        // iOS permissions handled differently
        return true;
      }
    } catch (error) {
      console.error("[LocationService] Permission request error:", error);
      return false;
    }
  }

  /**
   * Show alert prompting user to enable location in settings
   * @param {boolean} isPermissionDenied - True if permission was denied, false if location is off
   */
  showEnableLocationAlert(isPermissionDenied = false) {
    const title = isPermissionDenied
      ? "Location Permission Required"
      : "Location Services Disabled";

    const message = isPermissionDenied
      ? "Location permission was denied. Please enable location access in Settings to authorize fueling near the dispenser."
      : "Please enable Location Services in your device settings to authorize fueling. This ensures you are near the fuel dispenser.";

    Alert.alert(
      title,
      message,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Open Settings",
          onPress: () => this.openLocationSettings(),
        },
      ],
      { cancelable: true }
    );
  }

  /**
   * Open device location settings
   */
  openLocationSettings() {
    if (Platform.OS === "android") {
      Linking.openSettings();
    } else {
      Linking.openURL("app-settings:");
    }
  }

  /**
   * Get current location with permission handling
   * @param {Object} options - Geolocation options
   * @param {number} options.timeout - Timeout in milliseconds (default: 15000)
   * @param {boolean} options.enableHighAccuracy - Use GPS for better accuracy (default: true)
   * @param {number} options.maximumAge - Max age of cached location in ms (default: 10000)
   * @param {boolean} options.silentMode - If true, don't show alerts on errors (default: false)
   * @returns {Promise<{latitude: number, longitude: number, accuracy: number, isCached: boolean} | null>}
   */
  async getCurrentLocation(options = {}) {
    const {
      timeout = 15000,
      enableHighAccuracy = true,
      maximumAge = 10000,
      silentMode = false,
    } = options;

    try {
      // First check/request permission
      const { granted } = await this.checkLocationPermission();

      if (!granted) {
        const permissionGranted = await this.requestLocationPermission();
        if (!permissionGranted) {
          return null;
        }
      }

      // Mark permission as verified for this session
      this.permissionVerified = true;

      // Cancel any pending request to prevent callback conflicts
      this.cancelPendingLocationRequest();

      // Generate unique request ID to prevent stale callbacks
      const currentRequestId = ++this.requestId;

      // Get current position
      return new Promise((resolve, reject) => {
        let isResolved = false; // Flag to prevent duplicate callback invocation

        // Store pending request info for potential cancellation
        this.pendingLocationRequest = {
          requestId: currentRequestId,
          resolve,
          isResolved: false,
        };

        const safeResolve = (value) => {
          // Prevent callback from being invoked multiple times
          if (isResolved) {
            console.log(
              "[LocationService] Ignoring duplicate callback - already resolved"
            );
            return;
          }
          // Check if this is still the current request
          if (currentRequestId !== this.requestId) {
            console.log(
              "[LocationService] Ignoring stale callback from previous request"
            );
            return;
          }
          isResolved = true;
          if (this.pendingLocationRequest?.requestId === currentRequestId) {
            this.pendingLocationRequest.isResolved = true;
          }
          resolve(value);
        };

        Geolocation.getCurrentPosition(
          (position) => {
            const location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date(position.timestamp).toISOString(),
              isCached: false,
            };

            console.log("[LocationService] Location obtained:", location);
            this.lastKnownLocation = location;
            safeResolve(location);
          },
          (error) => {
            console.error("[LocationService] Geolocation error:", error);

            // In silent mode, don't show alerts - just return null or cached location
            if (!silentMode) {
              switch (error.code) {
                case 1: // PERMISSION_DENIED
                  // Only show alert if permission wasn't already verified
                  if (!this.permissionVerified) {
                    this.showEnableLocationAlert(true);
                  }
                  break;
                case 2: // POSITION_UNAVAILABLE
                  // Only show alert if we don't have a cached location to fall back to
                  if (!this.lastKnownLocation) {
                    this.showEnableLocationAlert(false);
                  }
                  break;
                case 3: // TIMEOUT
                  // Try to return cached location if available
                  if (this.lastKnownLocation) {
                    console.log(
                      "[LocationService] Using cached location due to timeout"
                    );
                    safeResolve({
                      ...this.lastKnownLocation,
                      isCached: true,
                    });
                    return;
                  }
                  Alert.alert(
                    "Location Timeout",
                    "Unable to get your location. Please ensure you have a clear view of the sky and try again."
                  );
                  break;
              }
            } else {
              // Silent mode - try to use cached location for any error
              if (this.lastKnownLocation) {
                console.log(
                  "[LocationService] Silent mode - using cached location due to error"
                );
                safeResolve({
                  ...this.lastKnownLocation,
                  isCached: true,
                });
                return;
              }
            }

            safeResolve(null);
          },
          {
            enableHighAccuracy,
            timeout,
            maximumAge,
          }
        );
      });
    } catch (error) {
      console.error("[LocationService] getCurrentLocation error:", error);
      return null;
    }
  }

  /**
   * Cancel any pending location request to prevent callback conflicts
   * Call this before starting a new location request or when component unmounts
   */
  cancelPendingLocationRequest() {
    if (
      this.pendingLocationRequest &&
      !this.pendingLocationRequest.isResolved
    ) {
      console.log("[LocationService] Cancelling pending location request");
      // Increment request ID to invalidate any pending callbacks
      this.requestId++;
      this.pendingLocationRequest = null;
    }
  }

  /**
   * Get location for fueling authorization
   * Returns location or shows appropriate error/settings prompt
   * Uses fallback strategy based on configuration
   *
   * @param {Object} options - Configuration options
   * @param {boolean} options.requireHighAccuracy - If true, prefer GPS over network location (default: false for better reliability)
   * @param {boolean} options.silentMode - If true, don't show any alerts/prompts (default: true if permission already verified)
   * @param {boolean} options.allowCachedLocation - Allow returning cached location if fresh fails (default: true)
   * @param {number} options.maxAccuracyMeters - Maximum acceptable accuracy in meters (default: 500)
   * @returns {Promise<{latitude: number, longitude: number, accuracy: number, isCached: boolean} | null>}
   */
  async getLocationForFueling(options = {}) {
    const {
      requireHighAccuracy = false, // Default to low accuracy for better reliability in poor GPS areas
      silentMode = this.permissionVerified, // If we already verified permission, use silent mode
      allowCachedLocation = true,
      maxAccuracyMeters = 500, // Accept up to 500m accuracy for mobile proximity
    } = options;

    console.log(
      "[LocationService] Getting location for fueling authorization...",
      {
        requireHighAccuracy,
        silentMode,
        allowCachedLocation,
        maxAccuracyMeters,
      }
    );

    let location = null;

    // If high accuracy is required, try GPS first
    if (requireHighAccuracy) {
      console.log("[LocationService] Attempting high-accuracy GPS location...");
      location = await this.getCurrentLocation({
        enableHighAccuracy: true,
        timeout: 20000, // 20 seconds for GPS lock
        maximumAge: 60000, // Accept location up to 60 seconds old
        silentMode: true, // Don't show alerts on first attempt
      });
    }

    // Strategy 2: Try low accuracy (network/cell tower) - works better in poor GPS areas
    if (!location) {
      console.log(
        "[LocationService] Trying low-accuracy (network) location..."
      );
      location = await this.getCurrentLocation({
        enableHighAccuracy: false, // Use network/cell tower location
        timeout: 15000, // 15 seconds for network location
        maximumAge: 120000, // Accept older locations for network
        silentMode, // Use configured silent mode
      });
    }

    // Strategy 3: If low accuracy also failed, try high accuracy as last resort
    if (!location && !requireHighAccuracy) {
      console.log(
        "[LocationService] Low-accuracy failed, trying high-accuracy as fallback..."
      );
      location = await this.getCurrentLocation({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 120000,
        silentMode, // Use configured silent mode
      });
    }

    // Strategy 4: If all fails, use last known cached location
    if (!location && allowCachedLocation && this.lastKnownLocation) {
      console.log(
        "[LocationService] Using last known cached location as fallback"
      );
      location = {
        ...this.lastKnownLocation,
        isCached: true,
      };
    }

    if (!location) {
      console.log("[LocationService] Failed to get location for fueling");
      return null;
    }

    // Warn if accuracy is poor (> maxAccuracyMeters)
    if (location.accuracy > maxAccuracyMeters) {
      console.warn(
        "[LocationService] Location accuracy exceeds maximum:",
        location.accuracy,
        "meters (max:",
        maxAccuracyMeters,
        ")",
        location.isCached ? "(cached)" : ""
      );
    }

    console.log(
      `[LocationService] Location obtained for fueling: lat=${location.latitude}, lng=${location.longitude}, accuracy=${location.accuracy}m, cached=${location.isCached}`
    );

    return location;
  }

  /**
   * Format location for API request (matches backend GeoLocation DTO)
   * @param {Object} location - Location object from getCurrentLocation
   * @returns {Object} Formatted location for API
   */
  formatForApi(location) {
    if (!location) return null;

    return {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      timestamp: location.timestamp,
      isCached: location.isCached || false,
    };
  }

  /**
   * Check if a location is stale (older than maxAgeSeconds)
   * @param {Object} location - Location object with timestamp
   * @param {number} maxAgeSeconds - Maximum age in seconds (default: 60)
   * @returns {boolean} True if location is stale
   */
  isLocationStale(location, maxAgeSeconds = 60) {
    if (!location?.timestamp) {
      return true; // No timestamp means we can't verify freshness
    }

    const locationTime = new Date(location.timestamp).getTime();
    const now = Date.now();
    const ageSeconds = (now - locationTime) / 1000;

    const isStale = ageSeconds > maxAgeSeconds;
    if (isStale) {
      console.log(
        `[LocationService] Location is stale: ${ageSeconds.toFixed(1)}s old (max: ${maxAgeSeconds}s)`
      );
    }

    return isStale;
  }

  /**
   * Get a fresh location for authorization, forcing a new GPS fix if current location is stale.
   * This prevents using outdated cached locations that could be far from actual position.
   *
   * @param {Object} options - Configuration options
   * @param {number} options.maxAgeSeconds - Maximum acceptable location age in seconds (default: 60)
   * @param {number} options.maxAccuracyMeters - Maximum acceptable accuracy in meters (default: 500)
   * @param {boolean} options.silentMode - If true, don't show alerts (default: false)
   * @returns {Promise<{location: Object|null, wasRefreshed: boolean, error: string|null}>}
   */
  async getFreshLocationForAuthorization(options = {}) {
    const {
      maxAgeSeconds = 60,
      maxAccuracyMeters = 500,
      silentMode = false,
    } = options;

    console.log(
      `[LocationService] Getting fresh location for authorization (maxAge: ${maxAgeSeconds}s, maxAccuracy: ${maxAccuracyMeters}m)`
    );

    // First, check if we have a recent location that's still fresh
    if (this.lastKnownLocation && !this.isLocationStale(this.lastKnownLocation, maxAgeSeconds)) {
      console.log("[LocationService] Using existing fresh location");
      return {
        location: this.lastKnownLocation,
        wasRefreshed: false,
        error: null,
      };
    }

    // Location is stale or doesn't exist - force a fresh GPS fix
    console.log("[LocationService] Location is stale or missing - forcing fresh GPS fix...");

    // Clear the cached location to force a new fetch
    const oldLocation = this.lastKnownLocation;
    this.lastKnownLocation = null;

    // Try to get a fresh location with high accuracy
    let location = await this.getCurrentLocation({
      enableHighAccuracy: true,
      timeout: 20000, // Give 20 seconds for GPS lock
      maximumAge: 0, // Force fresh location, don't accept cached
      silentMode: silentMode,
    });

    // If high accuracy failed, try network location
    if (!location) {
      console.log("[LocationService] High-accuracy failed, trying network location...");
      location = await this.getCurrentLocation({
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 0, // Still force fresh
        silentMode: silentMode,
      });
    }

    // If still no location, restore old location but mark it as cached/stale
    if (!location && oldLocation) {
      console.warn("[LocationService] Could not get fresh location - restoring stale location for reference");
      this.lastKnownLocation = oldLocation;

      return {
        location: null,
        wasRefreshed: false,
        error: `Could not get fresh location. Last known location is ${this.getLocationAgeString(oldLocation)} old.`,
      };
    }

    if (!location) {
      return {
        location: null,
        wasRefreshed: false,
        error: "Could not obtain GPS location. Please ensure location services are enabled.",
      };
    }

    // Check if fresh location meets accuracy requirements
    if (location.accuracy > maxAccuracyMeters) {
      console.warn(
        `[LocationService] Fresh location accuracy (${location.accuracy}m) exceeds maximum (${maxAccuracyMeters}m)`
      );
    }

    console.log(
      `[LocationService] Fresh location obtained: lat=${location.latitude}, lng=${location.longitude}, accuracy=${location.accuracy}m`
    );

    return {
      location: location,
      wasRefreshed: true,
      error: null,
    };
  }

  /**
   * Get a human-readable string for location age
   * @param {Object} location - Location object with timestamp
   * @returns {string} Age string like "45 seconds" or "2 minutes"
   */
  getLocationAgeString(location) {
    if (!location?.timestamp) return "unknown time";

    const ageSeconds = (Date.now() - new Date(location.timestamp).getTime()) / 1000;

    if (ageSeconds < 60) {
      return `${Math.round(ageSeconds)} seconds`;
    } else if (ageSeconds < 3600) {
      return `${Math.round(ageSeconds / 60)} minutes`;
    } else {
      return `${Math.round(ageSeconds / 3600)} hours`;
    }
  }

  /**
   * Start watching location changes
   * @param {Function} onLocationChange - Callback when location changes
   * @returns {number} Watch ID to stop watching
   */
  startWatchingLocation(onLocationChange) {
    if (this.locationWatchId !== null) {
      this.stopWatchingLocation();
    }

    this.locationWatchId = Geolocation.watchPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp).toISOString(),
          isCached: false,
        };
        this.lastKnownLocation = location;
        onLocationChange(location);
      },
      (error) => {
        console.error("[LocationService] Watch position error:", error);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10, // Update when moved 10 meters
        interval: 5000, // Check every 5 seconds
        fastestInterval: 2000,
      }
    );

    return this.locationWatchId;
  }

  /**
   * Stop watching location changes
   */
  stopWatchingLocation() {
    if (this.locationWatchId !== null) {
      Geolocation.clearWatch(this.locationWatchId);
      this.locationWatchId = null;
    }
    // Also cancel any pending location request
    this.cancelPendingLocationRequest();
  }

  /**
   * Get last known location (cached)
   * @returns {Object|null} Last known location or null
   */
  getLastKnownLocation() {
    if (this.lastKnownLocation) {
      return {
        ...this.lastKnownLocation,
        isCached: true,
      };
    }
    return null;
  }

  /**
   * Clear cached location
   */
  clearCachedLocation() {
    this.lastKnownLocation = null;
  }

  /**
   * Cleanup method - call this when component unmounts to prevent memory leaks
   * and stale callback errors
   */
  cleanup() {
    this.stopWatchingLocation();
    this.cancelPendingLocationRequest();
    console.log("[LocationService] Cleanup completed");
  }
}

// Export singleton instance
export const locationService = new LocationService();
export default locationService;
