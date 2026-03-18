/**
 * Provider Management Service
 * Phase 6 & 7: GPS Tracking Provider Management
 *
 * Provides comprehensive provider management including:
 * - Provider CRUD operations
 * - Health monitoring and statistics
 * - Vehicle-to-provider assignments
 * - Device management and mapping
 * - Connection testing and reloading
 *
 * @version 1.0.0
 * @since API v1
 */

import { BaseService } from './core/BaseService';

class ProviderManagementService extends BaseService {
  constructor() {
    super('ProviderManagement', '/v1/providers', {
      useCache: true,
      cacheTimeout: 3 * 60 * 1000, // 3 minutes for provider data
      logRequests: true,
      apiVersion: 'v1'
    });
  }

  // ============================================================================
  // Provider Management
  // ============================================================================

  /**
   * Get all providers with their configurations
   * @returns {Promise<{success: boolean, data: Array, message: string}>}
   */
  async getAllProviders() {
    return this.get('list');
  }

  /**
   * Get provider by ID
   * @param {number} providerId - Provider ID
   * @returns {Promise<{success: boolean, data: Object, message: string}>}
   */
  async getProviderById(providerId) {
    if (!providerId) {
      return {
        success: false,
        data: null,
        message: 'Provider ID is required',
        errors: ['providerId is required']
      };
    }

    return this.get(`${providerId}`);
  }

  /**
   * Update provider configuration
   * @param {number} providerId - Provider ID
   * @param {Object} updates - Update data
   * @param {string} updates.name - Provider name
   * @param {boolean} updates.isActive - Active status
   * @param {number} updates.priority - Provider priority
   * @param {Object} updates.configuration - Provider-specific configuration
   * @returns {Promise<{success: boolean, data: Object, message: string}>}
   */
  async updateProvider(providerId, updates) {
    if (!providerId) {
      return {
        success: false,
        data: null,
        message: 'Provider ID is required',
        errors: ['providerId is required']
      };
    }

    if (!updates || Object.keys(updates).length === 0) {
      return {
        success: false,
        data: null,
        message: 'Update data is required',
        errors: ['updates object cannot be empty']
      };
    }

    return this.put(`${providerId}`, updates);
  }

  // ============================================================================
  // Health & Monitoring
  // ============================================================================

  /**
   * Get health status of all providers
   * @returns {Promise<{success: boolean, data: Object, message: string}>}
   */
  async getProvidersHealth() {
    return this.get('health');
  }

  /**
   * Get provider statistics
   * @returns {Promise<{success: boolean, data: Object, message: string}>}
   */
  async getProviderStatistics() {
    return this.get('statistics');
  }

  /**
   * Test provider connection
   * @param {string} providerName - Provider name (e.g., 'GPSGate', 'Cartrack')
   * @returns {Promise<{success: boolean, data: Object, message: string}>}
   */
  async testProviderConnection(providerName) {
    if (!providerName) {
      return {
        success: false,
        data: null,
        message: 'Provider name is required',
        errors: ['providerName is required']
      };
    }

    return this.post(`${providerName}/test`);
  }

  /**
   * Reload all providers (refresh configurations)
   * @returns {Promise<{success: boolean, data: Object, message: string}>}
   */
  async reloadProviders() {
    // Clear cache before reloading
    this.clearCache();
    return this.post('reload');
  }

  // ============================================================================
  // Vehicle Assignments
  // ============================================================================

  /**
   * Get provider mappings (which vehicles are assigned to which providers)
   * @param {number|null} vehicleId - Optional vehicle ID to filter
   * @returns {Promise<{success: boolean, data: Array, message: string}>}
   */
  async getProviderMappings(vehicleId = null) {
    const endpoint = vehicleId ? `mappings?vehicleId=${vehicleId}` : 'mappings';
    return this.get(endpoint);
  }

  /**
   * Assign a single vehicle to a provider
   * @param {number} vehicleId - Vehicle ID
   * @param {number} providerId - Provider ID
   * @param {string} externalDeviceId - External device ID from provider mapping
   * @returns {Promise<{success: boolean, data: Object, message: string}>}
   */
  async assignVehicleToProvider(vehicleId, providerId, externalDeviceId) {
    if (!vehicleId || !providerId || !externalDeviceId) {
      return {
        success: false,
        data: null,
        message: 'Vehicle ID, Provider ID, and external device ID are required',
        errors: ['vehicleId, providerId, and externalDeviceId are required']
      };
    }

    return this.post('mappings', {
      vehicleId,
      providerId,
      externalDeviceId
    });
  }

  /**
   * Bulk assign vehicles to a provider
   * @param {{ vehicleId: number, externalDeviceId: string }[]} assignments - Per-vehicle external device mappings
   * @param {number} providerId - Provider ID
   * @returns {Promise<{success: boolean, data: Object, message: string}>}
   */
  async bulkAssignVehiclesToProvider(assignments, providerId) {
    if (!assignments || assignments.length === 0) {
      return {
        success: false,
        data: null,
        message: 'At least one vehicle assignment is required',
        errors: ['assignments array cannot be empty']
      };
    }

    if (!providerId) {
      return {
        success: false,
        data: null,
        message: 'Provider ID is required',
        errors: ['providerId is required']
      };
    }

    return this.post('mappings/bulk', {
      vehicleIds: assignments.map((assignment) => assignment.vehicleId),
      providerId,
      assignments
    });
  }

  /**
   * Bulk unassign vehicles from all providers
   * @param {number[]} vehicleIds - Array of vehicle IDs
   * @returns {Promise<{success: boolean, data: Object, message: string}>}
   */
  async bulkUnassignVehiclesFromProvider(vehicleIds) {
    if (!vehicleIds || vehicleIds.length === 0) {
      return {
        success: false,
        data: null,
        message: 'At least one vehicle ID is required',
        errors: ['vehicleIds array cannot be empty']
      };
    }

    return this.post('mappings/bulk/unassign', {
      vehicleIds
    });
  }

  // ============================================================================
  // Device Management
  // ============================================================================

  /**
   * Get all GPS devices from a provider
   * @param {string|null} providerName - Provider name (optional, uses active provider if null)
   * @returns {Promise<{success: boolean, data: Array, message: string}>}
   */
  async getProviderDevices(providerName = null) {
    const endpoint = providerName ? `devices?providerName=${providerName}` : 'devices';
    return this.get(endpoint);
  }

  /**
   * Map a GPS device to a vehicle
   * @param {Object} mappingData - Device mapping data
   * @param {number} mappingData.vehicleId - Vehicle ID
   * @param {string} mappingData.providerName - Provider name
   * @param {string} mappingData.externalDeviceId - External device ID from provider
   * @param {string} mappingData.deviceIMEI - Device IMEI
   * @param {string} mappingData.deviceName - Device name
   * @param {string} mappingData.deviceType - Device type
   * @param {string} mappingData.metadata - Additional metadata as JSON string
   * @returns {Promise<{success: boolean, data: Object, message: string}>}
   */
  async mapDeviceToVehicle(mappingData) {
    if (!mappingData || !mappingData.vehicleId || !mappingData.providerName) {
      return {
        success: false,
        data: null,
        message: 'Vehicle ID and Provider Name are required',
        errors: ['vehicleId and providerName are required in mappingData']
      };
    }

    return this.post('mappings/device', mappingData);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Get active providers only
   * @returns {Promise<{success: boolean, data: Array, message: string}>}
   */
  async getActiveProviders() {
    const response = await this.getAllProviders();

    if (response.success && response.data) {
      const activeProviders = response.data.filter(provider => provider.isActive);
      return {
        ...response,
        data: activeProviders,
        message: `Found ${activeProviders.length} active providers`
      };
    }

    return response;
  }

  /**
   * Get provider by name
   * @param {string} providerName - Provider name
   * @returns {Promise<{success: boolean, data: Object|null, message: string}>}
   */
  async getProviderByName(providerName) {
    const response = await this.getAllProviders();

    if (response.success && response.data) {
      const provider = response.data.find(
        p => p.name.toLowerCase() === providerName.toLowerCase()
      );

      if (provider) {
        return {
          success: true,
          data: provider,
          message: `Found provider: ${providerName}`
        };
      }

      return {
        success: false,
        data: null,
        message: `Provider not found: ${providerName}`,
        errors: [`No provider found with name: ${providerName}`]
      };
    }

    return response;
  }

  /**
   * Check if a provider is healthy
   * @param {number} providerId - Provider ID
   * @returns {Promise<{success: boolean, data: Object, message: string}>}
   */
  async isProviderHealthy(providerId) {
    const healthResponse = await this.getProvidersHealth();

    if (healthResponse.success && healthResponse.data) {
      const providerHealth = healthResponse.data.providers?.find(
        p => p.providerId === providerId
      );

      if (providerHealth) {
        return {
          success: true,
          data: {
            isHealthy: providerHealth.status === 'Healthy',
            status: providerHealth.status,
            lastCheck: providerHealth.lastHealthCheck
          },
          message: `Provider health: ${providerHealth.status}`
        };
      }
    }

    return {
      success: false,
      data: { isHealthy: false },
      message: 'Unable to determine provider health'
    };
  }

  /**
   * Get vehicles assigned to a specific provider
   * @param {number} providerId - Provider ID
   * @returns {Promise<{success: boolean, data: Array, message: string}>}
   */
  async getVehiclesByProvider(providerId) {
    const response = await this.getProviderMappings();

    if (response.success && response.data) {
      const vehicles = response.data.filter(
        mapping => mapping.providerId === providerId
      );

      return {
        success: true,
        data: vehicles,
        message: `Found ${vehicles.length} vehicles for provider ${providerId}`
      };
    }

    return response;
  }

  /**
   * Check if a vehicle is assigned to any provider
   * @param {number} vehicleId - Vehicle ID
   * @returns {Promise<{success: boolean, data: Object, message: string}>}
   */
  async isVehicleAssigned(vehicleId) {
    const response = await this.getProviderMappings(vehicleId);

    if (response.success && response.data) {
      const isAssigned = response.data.length > 0;
      return {
        success: true,
        data: {
          isAssigned,
          mapping: isAssigned ? response.data[0] : null
        },
        message: isAssigned ? 'Vehicle is assigned' : 'Vehicle is not assigned'
      };
    }

    return {
      success: false,
      data: { isAssigned: false, mapping: null },
      message: 'Unable to check vehicle assignment'
    };
  }

  /**
   * Format provider for display
   * @param {Object} provider - Provider object
   * @returns {string} Formatted provider string
   */
  formatProviderDisplay(provider) {
    if (!provider) return 'Unknown Provider';

    const status = provider.isActive ? '✓' : '✗';
    return `${status} ${provider.name} (Priority: ${provider.priority || 0})`;
  }

  /**
   * Validate provider configuration before update
   * @param {Object} config - Provider configuration
   * @returns {{isValid: boolean, errors: Array}}
   */
  validateProviderConfig(config) {
    const errors = [];

    if (config.priority !== undefined) {
      if (typeof config.priority !== 'number' || config.priority < 0) {
        errors.push('Priority must be a non-negative number');
      }
    }

    if (config.name !== undefined) {
      if (!config.name || config.name.trim().length === 0) {
        errors.push('Provider name cannot be empty');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
const providerManagementService = new ProviderManagementService();
export default providerManagementService;

// Also export the class for testing purposes
export { ProviderManagementService };
