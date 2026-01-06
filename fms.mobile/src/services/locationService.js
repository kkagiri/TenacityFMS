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
  }

  /**
   * Pre-warm location service by getting an initial location
   * Call this early (e.g., when user opens fueling screen) to improve later fetch speed
   * @returns {Promise<void>}
   */
  async warmUpLocation() {
    if (this.isWarmingUp) {
      console.log("[LocationService] Already warming up location...");
      return;
    }

    this.isWarmingUp = true;
    console.log("[LocationService] Warming up location service...");

    try {
      // Try to get a quick location with relaxed settings
      const location = await this.getCurrentLocation({
        enableHighAccuracy: false, // Network location is faster
        timeout: 5000, // Quick attempt
        maximumAge: 300000, // Accept old cached locations (5 min)
      });

      if (location) {
        console.log("[LocationService] Location warmed up successfully");
      }
    } catch (error) {
      console.log("[LocationService] Location warm-up failed (non-critical)");
    } finally {
      this.isWarmingUp = false;
    }
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
   * @returns {Promise<{latitude: number, longitude: number, accuracy: number, isCached: boolean} | null>}
   */
  async getCurrentLocation(options = {}) {
    const {
      timeout = 15000,
      enableHighAccuracy = true,
      maximumAge = 10000,
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

            switch (error.code) {
              case 1: // PERMISSION_DENIED
                this.showEnableLocationAlert(true);
                break;
              case 2: // POSITION_UNAVAILABLE
                this.showEnableLocationAlert(false);
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
   * Uses fallback strategy: high accuracy first, then low accuracy, then cached
   * @returns {Promise<{latitude: number, longitude: number, accuracy: number, isCached: boolean} | null>}
   */
  async getLocationForFueling() {
    console.log(
      "[LocationService] Getting location for fueling authorization..."
    );

    // Strategy 1: Try high accuracy first (GPS) with extended timeout
    console.log("[LocationService] Attempting high-accuracy GPS location...");
    let location = await this.getCurrentLocation({
      enableHighAccuracy: true,
      timeout: 30000, // 30 seconds for GPS lock
      maximumAge: 60000, // Accept location up to 60 seconds old
    });

    // Strategy 2: If high accuracy fails, try low accuracy (network/cell tower)
    if (!location) {
      console.log(
        "[LocationService] High-accuracy failed, trying low-accuracy location..."
      );
      location = await this.getCurrentLocation({
        enableHighAccuracy: false, // Use network/cell tower location
        timeout: 10000, // Faster for network location
        maximumAge: 120000, // Accept older locations for network
      });
    }

    // Strategy 3: If all fails, use last known cached location
    if (!location && this.lastKnownLocation) {
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

    // Warn if accuracy is poor (> 100 meters)
    if (location.accuracy > 100) {
      console.warn(
        "[LocationService] Poor GPS accuracy:",
        location.accuracy,
        "meters",
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
