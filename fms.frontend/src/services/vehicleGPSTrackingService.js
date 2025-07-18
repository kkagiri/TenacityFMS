import axiosInstance from '../api/axiosInstance';

/**
 * Vehicle GPS Tracking Service
 * Provides vehicle location and odometer data for dispatch and maintenance modules
 */
class VehicleGPSTrackingService {
  constructor() {
    this.baseURL = '/vehicletracking';
  }

  /**
   * Get vehicle location for dispatch module
   * @param {number} vehicleId - Vehicle ID
   * @returns {Promise} Vehicle location data
   */
  async getVehicleLocation(vehicleId) {
    try {
      const response = await axiosInstance.get(`${this.baseURL}/${vehicleId}/location`);
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle location:', error);
      throw this.handleError(error, `Failed to get location for vehicle ${vehicleId}`);
    }
  }

  /**
   * Get vehicle odometer for maintenance module
   * @param {number} vehicleId - Vehicle ID
   * @returns {Promise} Vehicle odometer data
   */
  async getVehicleOdometer(vehicleId) {
    try {
      const response = await axiosInstance.get(`${this.baseURL}/${vehicleId}/odometer`);
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle odometer:', error);
      throw this.handleError(error, `Failed to get odometer for vehicle ${vehicleId}`);
    }
  }

  /**
   * Get all vehicle locations
   * @param {boolean} onlineOnly - Filter to online vehicles only
   * @param {boolean} gpsEnabledOnly - Filter to GPS-enabled vehicles only
   * @returns {Promise} List of vehicle locations
   */
  async getAllVehicleLocations(onlineOnly = false, gpsEnabledOnly = true) {
    try {
      const response = await axiosInstance.get(`${this.baseURL}/locations`, {
        params: {
          onlineOnly,
          gpsEnabledOnly
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle locations:', error);
      throw this.handleError(error, 'Failed to get vehicle locations');
    }
  }

  /**
   * Check if vehicle is online
   * @param {number} vehicleId - Vehicle ID
   * @returns {Promise} Vehicle online status
   */
  async isVehicleOnline(vehicleId) {
    try {
      const response = await axiosInstance.get(`${this.baseURL}/${vehicleId}/online-status`);
      return response.data;
    } catch (error) {
      console.error('Error checking vehicle online status:', error);
      throw this.handleError(error, `Failed to check status for vehicle ${vehicleId}`);
    }
  }

  /**
   * Get GPS connection status
   * @returns {Promise} GPS connection health status
   */
  async getConnectionStatus() {
    try {
      const response = await axiosInstance.get(`${this.baseURL}/connection-status`);
      return response.data;
    } catch (error) {
      console.error('Error getting GPS connection status:', error);
      throw this.handleError(error, 'Failed to get GPS connection status');
    }
  }

  /**
   * Get GPS vehicles summary for dashboard
   * @returns {Promise} GPS vehicles summary data
   */
  async getGPSVehiclesSummary() {
    try {
      const response = await axiosInstance.get(`${this.baseURL}/summary`);
      return response.data;
    } catch (error) {
      console.error('Error getting GPS vehicles summary:', error);
      throw this.handleError(error, 'Failed to get GPS vehicles summary');
    }
  }

  /**
   * Check if vehicle is trackable (has GPS and is configured)
   * @param {number} vehicleId - Vehicle ID
   * @returns {Promise<boolean>} Whether vehicle can be tracked
   */
  async isVehicleTrackable(vehicleId) {
    try {
      const locationResponse = await this.getVehicleLocation(vehicleId);
      return locationResponse.isSuccess && locationResponse.data?.hasGPSInstalled === true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get vehicle locations for specific vehicles (batch request)
   * @param {number[]} vehicleIds - Array of vehicle IDs
   * @returns {Promise} Locations for specified vehicles
   */
  async getVehicleLocationsBatch(vehicleIds) {
    try {
      // Since we don't have a batch endpoint, we'll get all and filter
      const allLocationsResponse = await this.getAllVehicleLocations();

      if (allLocationsResponse.isSuccess && allLocationsResponse.data) {
        const filteredLocations = allLocationsResponse.data.filter(
          location => vehicleIds.includes(location.vehicleId)
        );

        return {
          isSuccess: true,
          data: filteredLocations,
          message: `Retrieved locations for ${filteredLocations.length} vehicles`
        };
      }

      return allLocationsResponse;
    } catch (error) {
      console.error('Error fetching batch vehicle locations:', error);
      throw this.handleError(error, 'Failed to get vehicle locations');
    }
  }

  /**
   * Handle API errors consistently
   * @param {Error} error - The error object
   * @param {string} defaultMessage - Default error message
   * @returns {Error} Formatted error
   */
  handleError(error, defaultMessage) {
    if (error.response) {
      // Server responded with error status
      const serverMessage = error.response.data?.message || error.response.data?.Message;
      return new Error(serverMessage || `${defaultMessage} (${error.response.status})`);
    } else if (error.request) {
      // Network error
      return new Error(`${defaultMessage} - Network error`);
    } else {
      // Other error
      return new Error(defaultMessage);
    }
  }

  /**
   * Format location for display
   * @param {Object} location - Location object
   * @returns {string} Formatted location string
   */
  formatLocation(location) {
    if (!location?.latitude || !location?.longitude) {
      return 'Location unavailable';
    }

    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  }

  /**
   * Calculate distance between two points (Haversine formula)
   * @param {number} lat1 - Latitude 1
   * @param {number} lon1 - Longitude 1
   * @param {number} lat2 - Latitude 2
   * @param {number} lon2 - Longitude 2
   * @returns {number} Distance in kilometers
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   * @param {number} degrees - Degrees
   * @returns {number} Radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
}

// Export singleton instance
const vehicleGPSTrackingService = new VehicleGPSTrackingService();
export default vehicleGPSTrackingService;

// Also export the class for testing purposes
export { VehicleGPSTrackingService };
