/**
 * Location Service for FMS Mobile
 * Handles GPS location fetching with permission management
 * Prompts user to enable location from settings if disabled
 */
import { Platform, Alert, Linking, PermissionsAndroid } from "react-native";
import Geolocation from "@react-native-community/geolocation";

// Configure geolocation - use new API on Android
Geolocation.setRNConfiguration({
  skipPermissionRequests: false, // Let us handle permissions manually
  authorizationLevel: "whenInUse",
  locationProvider: "auto", // 'playServices' | 'android' | 'auto'
});

class LocationService {
  constructor() {
    this.lastKnownLocation = null;
    this.locationWatchId = null;
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

      // Get current position
      return new Promise((resolve, reject) => {
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
            resolve(location);
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
                  resolve({
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

            resolve(null);
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
   * Get location for fueling authorization
   * Returns location or shows appropriate error/settings prompt
   * @returns {Promise<{latitude: number, longitude: number, accuracy: number, isCached: boolean} | null>}
   */
  async getLocationForFueling() {
    console.log(
      "[LocationService] Getting location for fueling authorization..."
    );

    const location = await this.getCurrentLocation({
      enableHighAccuracy: true,
      timeout: 20000, // Give more time for GPS lock
      maximumAge: 30000, // Accept location up to 30 seconds old
    });

    if (!location) {
      console.log("[LocationService] Failed to get location for fueling");
      return null;
    }

    // Warn if accuracy is poor (> 100 meters)
    if (location.accuracy > 100) {
      console.warn(
        "[LocationService] Poor GPS accuracy:",
        location.accuracy,
        "meters"
      );
    }

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
}

// Export singleton instance
export const locationService = new LocationService();
export default locationService;
