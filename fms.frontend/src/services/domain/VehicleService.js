/**
 * VehicleService - Complete Vehicle Management Service
 *
 * Migrated from vehicleActions.js to use BaseService architecture:
 * - FMSResponse<T> handling
 * - v1 API endpoints
 * - Standardized error handling
 * - Caching and performance optimization
 * - Enterprise patterns
 *
 * @version 1.0.0
 * @since API v1
 */

import BaseService from '../core/BaseService';

export class VehicleService extends BaseService {
  constructor(config) {
    super(config);
    this.baseUrl = '/vehicle';
  }

  // ===========================================
  // VEHICLE CORE OPERATIONS
  // ===========================================

  /**
   * Fetch all vehicles
   * @param {Object} filters - Filter criteria
   * @param {number} [filters.siteId] - Site ID filter
   * @param {string} [filters.status] - Vehicle status filter
   * @param {string} [filters.vehicleType] - Vehicle type filter
   * @returns {Promise<FMSResponse<Vehicle[]>>}
   */
  async fetchVehicles(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.siteId) params.append('siteId', filters.siteId);
      if (filters.status) params.append('status', filters.status);
      if (filters.vehicleType) params.append('vehicleType', filters.vehicleType);

      const url = params.toString() ? `${this.baseUrl}?${params.toString()}` : this.baseUrl;

      return await this.get(url, {
        cacheKey: `vehicles-${JSON.stringify(filters)}`,
        cacheTTL: 3 * 60 * 1000 // 3 minutes cache
      });
    } catch (error) {
      return this.handleError('Error fetching vehicles', error);
    }
  }

  /**
   * Fetch vehicle by ID
   * @param {number} vehicleId - Vehicle ID
   * @returns {Promise<FMSResponse<Vehicle>>}
   */
  async getVehicleById(vehicleId) {
    try {
      if (!vehicleId || vehicleId <= 0) {
        return this.createValidationErrorResponse('Invalid vehicle ID');
      }

      return await this.get(`${this.baseUrl}/${vehicleId}`, {
        cacheKey: `vehicle-${vehicleId}`,
        cacheTTL: 5 * 60 * 1000 // 5 minutes cache
      });
    } catch (error) {
      return this.handleError(`Error fetching vehicle ${vehicleId}`, error);
    }
  }

  /**
   * Create new vehicle
   * @param {Object} vehicleData - Vehicle data
   * @returns {Promise<FMSResponse<Vehicle>>}
   */
  async createVehicle(vehicleData) {
    try {
      // Validate required fields
      if (!vehicleData.vehicleCode) {
        return this.createValidationErrorResponse('Vehicle Tenacy number is required');
      }

      if (!vehicleData.numberPlate) {
        return this.createValidationErrorResponse('Vehicle number plate is required');
      }

      const result = await this.post(this.baseUrl, vehicleData);

      // Clear vehicles cache
      this.clearCachePattern('vehicles-');

      return result;
    } catch (error) {
      return this.handleError('Error creating vehicle', error);
    }
  }

  /**
   * Update vehicle
   * @param {number} vehicleId - Vehicle ID
   * @param {Object} vehicleData - Updated vehicle data
   * @returns {Promise<FMSResponse<Vehicle>>}
   */
  async updateVehicle(vehicleId, vehicleData) {
    try {
      if (!vehicleId || vehicleId <= 0) {
        return this.createValidationErrorResponse('Invalid vehicle ID');
      }

      const result = await this.put(`${this.baseUrl}/${vehicleId}`, vehicleData);

      // Clear related caches
      this.clearCachePattern('vehicles-');
      this.clearCache(`vehicle-${vehicleId}`);

      return result;
    } catch (error) {
      return this.handleError(`Error updating vehicle ${vehicleId}`, error);
    }
  }

  /**
   * Update multiple vehicles
   * @param {Array} changes - Array of vehicle changes
   * @returns {Promise<FMSResponse<Vehicle[]>>}
   */
  async updateVehicles(changes) {
    try {
      if (!Array.isArray(changes) || changes.length === 0) {
        return this.createValidationErrorResponse('No vehicle changes provided');
      }

      const updatedVehicles = changes.map((change) => ({
        ...change.data,
        vehicleId: change.key,
      }));

      const result = await this.put(this.baseUrl, updatedVehicles);

      // Clear vehicles cache
      this.clearCachePattern('vehicles-');

      return result;
    } catch (error) {
      return this.handleError('Error updating multiple vehicles', error);
    }
  }

  /**
   * Delete vehicle
   * @param {number} vehicleId - Vehicle ID
   * @returns {Promise<FMSResponse<boolean>>}
   */
  async deleteVehicle(vehicleId) {
    try {
      if (!vehicleId || vehicleId <= 0) {
        return this.createValidationErrorResponse('Invalid vehicle ID');
      }

      const result = await this.delete(`${this.baseUrl}/${vehicleId}`);

      // Clear related caches
      this.clearCachePattern('vehicles-');
      this.clearCache(`vehicle-${vehicleId}`);

      return result;
    } catch (error) {
      return this.handleError(`Error deleting vehicle ${vehicleId}`, error);
    }
  }

  // ===========================================
  // VEHICLE HISTORY OPERATIONS
  // ===========================================

  /**
   * Fetch vehicle consumption history
   * @param {number} vehicleId - Vehicle ID
   * @param {Object} filters - Filter criteria
   * @param {string} [filters.startDate] - Start date filter
   * @param {string} [filters.endDate] - End date filter
   * @returns {Promise<FMSResponse<ConsumptionHistory[]>>}
   */
  async fetchVehicleConsumptionHistory(vehicleId, filters = {}) {
    try {
      if (!vehicleId || vehicleId <= 0) {
        return this.createValidationErrorResponse('Invalid vehicle ID');
      }

      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const url = `${this.baseUrl}/${vehicleId}/consumption-history${params.toString() ? '?' + params.toString() : ''}`;

      return await this.get(url, {
        cacheKey: `vehicle-consumption-${vehicleId}-${JSON.stringify(filters)}`,
        cacheTTL: 10 * 60 * 1000 // 10 minutes cache
      });
    } catch (error) {
      return this.handleError(`Error fetching consumption history for vehicle ${vehicleId}`, error);
    }
  }

  /**
   * Fetch vehicle fueling history
   * @param {number} vehicleId - Vehicle ID
   * @param {Object} filters - Filter criteria
   * @returns {Promise<FMSResponse<FuelingHistory[]>>}
   */
  async fetchVehicleFuelingHistory(vehicleId, filters = {}) {
    try {
      if (!vehicleId || vehicleId <= 0) {
        return this.createValidationErrorResponse('Invalid vehicle ID');
      }

      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const url = `${this.baseUrl}/${vehicleId}/fueling-history${params.toString() ? '?' + params.toString() : ''}`;

      return await this.get(url, {
        cacheKey: `vehicle-fueling-${vehicleId}-${JSON.stringify(filters)}`,
        cacheTTL: 10 * 60 * 1000 // 10 minutes cache
      });
    } catch (error) {
      return this.handleError(`Error fetching fueling history for vehicle ${vehicleId}`, error);
    }
  }

  /**
   * Fetch vehicle maintenance history
   * @param {number} vehicleId - Vehicle ID
   * @param {Object} filters - Filter criteria
   * @returns {Promise<FMSResponse<MaintenanceHistory[]>>}
   */
  async fetchVehicleMaintenanceHistory(vehicleId, filters = {}) {
    try {
      if (!vehicleId || vehicleId <= 0) {
        return this.createValidationErrorResponse('Invalid vehicle ID');
      }

      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const url = `${this.baseUrl}/${vehicleId}/maintenance-history${params.toString() ? '?' + params.toString() : ''}`;

      return await this.get(url, {
        cacheKey: `vehicle-maintenance-${vehicleId}-${JSON.stringify(filters)}`,
        cacheTTL: 10 * 60 * 1000 // 10 minutes cache
      });
    } catch (error) {
      return this.handleError(`Error fetching maintenance history for vehicle ${vehicleId}`, error);
    }
  }

  // ===========================================
  // MAINTENANCE OPERATIONS
  // ===========================================

  /**
   * Add maintenance record
   * @param {number} vehicleId - Vehicle ID
   * @param {Object} maintenanceData - Maintenance record data
   * @returns {Promise<FMSResponse<MaintenanceRecord>>}
   */
  async addMaintenanceRecord(vehicleId, maintenanceData) {
    try {
      if (!vehicleId || vehicleId <= 0) {
        return this.createValidationErrorResponse('Invalid vehicle ID');
      }

      if (!maintenanceData.maintenanceType) {
        return this.createValidationErrorResponse('Maintenance type is required');
      }

      const result = await this.post(`${this.baseUrl}/${vehicleId}/maintenance`, maintenanceData);

      // Clear related caches
      this.clearCachePattern(`vehicle-maintenance-${vehicleId}-`);

      return result;
    } catch (error) {
      return this.handleError(`Error adding maintenance record for vehicle ${vehicleId}`, error);
    }
  }

  // ===========================================
  // SCHEDULE OPERATIONS
  // ===========================================

  /**
   * Fetch vehicle schedules
   * @param {number} vehicleId - Vehicle ID
   * @param {Object} filters - Filter criteria
   * @returns {Promise<FMSResponse<VehicleSchedule[]>>}
   */
  async fetchVehicleSchedules(vehicleId, filters = {}) {
    try {
      if (!vehicleId || vehicleId <= 0) {
        return this.createValidationErrorResponse('Invalid vehicle ID');
      }

      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const url = `${this.baseUrl}/${vehicleId}/schedules${params.toString() ? '?' + params.toString() : ''}`;

      return await this.get(url, {
        cacheKey: `vehicle-schedules-${vehicleId}-${JSON.stringify(filters)}`,
        cacheTTL: 5 * 60 * 1000 // 5 minutes cache
      });
    } catch (error) {
      return this.handleError(`Error fetching schedules for vehicle ${vehicleId}`, error);
    }
  }

  /**
   * Add vehicle schedule
   * @param {number} vehicleId - Vehicle ID
   * @param {Object} scheduleData - Schedule data
   * @returns {Promise<FMSResponse<VehicleSchedule>>}
   */
  async addVehicleSchedule(vehicleId, scheduleData) {
    try {
      if (!vehicleId || vehicleId <= 0) {
        return this.createValidationErrorResponse('Invalid vehicle ID');
      }

      const result = await this.post(`${this.baseUrl}/${vehicleId}/schedules`, scheduleData);

      // Clear related caches
      this.clearCachePattern(`vehicle-schedules-${vehicleId}-`);

      return result;
    } catch (error) {
      return this.handleError(`Error adding schedule for vehicle ${vehicleId}`, error);
    }
  }

  /**
   * Update vehicle schedule
   * @param {number} vehicleId - Vehicle ID
   * @param {number} scheduleId - Schedule ID
   * @param {Object} scheduleData - Updated schedule data
   * @returns {Promise<FMSResponse<VehicleSchedule>>}
   */
  async updateVehicleSchedule(vehicleId, scheduleId, scheduleData) {
    try {
      if (!vehicleId || vehicleId <= 0) {
        return this.createValidationErrorResponse('Invalid vehicle ID');
      }

      if (!scheduleId || scheduleId <= 0) {
        return this.createValidationErrorResponse('Invalid schedule ID');
      }

      const result = await this.put(`${this.baseUrl}/${vehicleId}/schedules/${scheduleId}`, scheduleData);

      // Clear related caches
      this.clearCachePattern(`vehicle-schedules-${vehicleId}-`);

      return result;
    } catch (error) {
      return this.handleError(`Error updating schedule ${scheduleId} for vehicle ${vehicleId}`, error);
    }
  }

  /**
   * Delete vehicle schedule
   * @param {number} vehicleId - Vehicle ID
   * @param {number} scheduleId - Schedule ID
   * @returns {Promise<FMSResponse<boolean>>}
   */
  async deleteVehicleSchedule(vehicleId, scheduleId) {
    try {
      if (!vehicleId || vehicleId <= 0) {
        return this.createValidationErrorResponse('Invalid vehicle ID');
      }

      if (!scheduleId || scheduleId <= 0) {
        return this.createValidationErrorResponse('Invalid schedule ID');
      }

      const result = await this.delete(`${this.baseUrl}/${vehicleId}/schedules/${scheduleId}`);

      // Clear related caches
      this.clearCachePattern(`vehicle-schedules-${vehicleId}-`);

      return result;
    } catch (error) {
      return this.handleError(`Error deleting schedule ${scheduleId} for vehicle ${vehicleId}`, error);
    }
  }

  // ===========================================
  // SEARCH OPERATIONS
  // ===========================================

  /**
   * Quick search vehicles
   * @param {string} searchTerm - Search term
   * @param {number} [limit=10] - Maximum results
   * @returns {Promise<FMSResponse<Vehicle[]>>}
   */
  async quickSearchVehicles(searchTerm, limit = 10) {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        return this.createValidationErrorResponse('Search term is required');
      }

      const params = new URLSearchParams({
        search: searchTerm.trim(),
        limit: limit.toString()
      });

      return await this.get(`${this.baseUrl}/search/quick?${params.toString()}`, {
        cacheKey: `vehicle-quick-search-${searchTerm}-${limit}`,
        cacheTTL: 2 * 60 * 1000 // 2 minutes cache
      });
    } catch (error) {
      return this.handleError('Error performing quick vehicle search', error);
    }
  }

  /**
   * Advanced search vehicles
   * @param {Object} searchCriteria - Search criteria
   * @returns {Promise<FMSResponse<Vehicle[]>>}
   */
  async searchVehicles(searchCriteria) {
    try {
      const result = await this.post(`${this.baseUrl}/search`, searchCriteria);
      return result;
    } catch (error) {
      return this.handleError('Error performing vehicle search', error);
    }
  }

  // ===========================================
  // UTILITY METHODS
  // ===========================================

  /**
   * Create validation error response
   * @private
   */
  createValidationErrorResponse(message) {
    return {
      success: false,
      data: null,
      message: message,
      errors: [message],
      errorType: 'VALIDATION'
    };
  }

  /**
   * Clear cache patterns
   * @private
   */
  clearCachePattern(pattern) {
    if (this.cache) {
      const keys = Array.from(this.cache.keys());
      keys.forEach(key => {
        if (key.startsWith(pattern)) {
          this.cache.delete(key);
        }
      });
    }
  }

  /**
   * Health check for vehicle service
   * @returns {Promise<Object>}
   */
  async healthCheck() {
    try {
      // Try to fetch a small amount of data to verify connectivity
      const result = await this.get(`${this.baseUrl}?limit=1`);

      return {
        status: 'healthy',
        message: 'Vehicle service is operational',
        timestamp: new Date().toISOString(),
        responseTime: result.responseTime || 'N/A'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Vehicle service error: ${error.message}`,
        timestamp: new Date().toISOString(),
        error: error
      };
    }
  }
}

export default VehicleService;