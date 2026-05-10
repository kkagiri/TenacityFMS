/**
 * ServiceFactory - Centralized Service Management
 *
 * Provides dependency injection and service lifecycle management:
 * - Singleton service instances
 * - Lazy loading of services
 * - Configuration injection
 * - Service health monitoring
 * - Consistent initialization
 *
 * @version 1.0.0
 * @since API v1
 */

import BaseService from './BaseService';
import TankStockService from '../domain/TankStockService';
import VehicleService from '../domain/VehicleService';
import UserManagementService from '../domain/UserManagementService';
import AuthenticationService from '../domain/AuthenticationService';
import DashboardService from '../domain/DashboardService';

class ServiceFactory {
  constructor() {
    this.services = new Map();
    this.configuration = {
      apiVersion: 'v1',
      timeout: 30000,
      retryAttempts: 3,
      enableCaching: true,
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
      enableLogging: true
    };
  }

  /**
   * Get or create a service instance
   * @template T
   * @param {string} serviceName - Name of the service
   * @param {new (...args: any[]) => T} ServiceClass - Service class constructor
   * @param {Object} options - Additional configuration options
   * @returns {T} Service instance
   */
  getService(serviceName, ServiceClass, options = {}) {
    // Check if service already exists
    if (this.services.has(serviceName)) {
      return this.services.get(serviceName);
    }

    // Create new service instance
    const serviceConfig = {
      ...this.configuration,
      ...options,
      serviceName
    };

    const service = new ServiceClass(serviceConfig);

    // Store the service instance
    this.services.set(serviceName, service);

    // Initialize service if it has an init method
    if (typeof service.init === 'function') {
      service.init();
    }

    return service;
  }

  /**
   * Get TankStock service
   * @returns {TankStockService}
   */
  getTankStockService() {
    return this.getService('tankstock', TankStockService);
  }

  /**
   * Get Vehicle service
   * @returns {VehicleService}
   */
  getVehicleService() {
    return this.getService('vehicle', VehicleService);
  }

  /**
   * Get User Management service
   * @returns {UserManagementService}
   */
  getUserManagementService() {
    return this.getService('usermanagement', UserManagementService);
  }

  /**
   * Get Authentication service
   * @returns {AuthenticationService}
   */
  getAuthenticationService() {
    return this.getService('authentication', AuthenticationService);
  }

  /**
   * Get Dashboard service
   * @returns {DashboardService}
   */
  getDashboardService() {
    return this.getService('dashboard', DashboardService);
  }

  /**
   * Get Notification service
   * @returns {NotificationService}
   */
  getNotificationService() {
    return this.getService('notification', NotificationService);
  }

  /**
   * Get System Configuration service
   * @returns {SystemConfigurationService}
   */
  getSystemConfigurationService() {
    return this.getService('systemconfig', SystemConfigurationService);
  }

  /**
   * Create a custom service that extends BaseService
   * @param {string} serviceName - Name of the service
   * @param {string} baseUrl - Base URL for the service endpoints
   * @param {Object} customMethods - Custom methods to add to the service
   * @param {Object} options - Additional configuration options
   * @returns {BaseService} Custom service instance
   */
  createCustomService(serviceName, baseUrl, customMethods = {}, options = {}) {
    // Create dynamic service class
    class CustomService extends BaseService {
      constructor(config) {
        super(config);
        this.baseUrl = baseUrl;

        // Add custom methods
        Object.keys(customMethods).forEach(methodName => {
          this[methodName] = customMethods[methodName].bind(this);
        });
      }
    }

    return this.getService(serviceName, CustomService, options);
  }

  /**
   * Update global configuration
   * @param {Object} newConfig - New configuration options
   */
  updateConfiguration(newConfig) {
    this.configuration = {
      ...this.configuration,
      ...newConfig
    };

    // Update existing services with new configuration
    this.services.forEach((service, serviceName) => {
      if (typeof service.updateConfig === 'function') {
        service.updateConfig(newConfig);
      }
    });
  }

  /**
   * Clear service cache
   * @param {string} [serviceName] - Specific service to clear, or all if not provided
   */
  clearCache(serviceName = null) {
    if (serviceName && this.services.has(serviceName)) {
      const service = this.services.get(serviceName);
      if (typeof service.clearCache === 'function') {
        service.clearCache();
      }
    } else {
      // Clear all service caches
      this.services.forEach(service => {
        if (typeof service.clearCache === 'function') {
          service.clearCache();
        }
      });
    }
  }

  /**
   * Health check for all services
   * @returns {Promise<Object>} Health status for each service
   */
  async healthCheck() {
    const healthStatus = {};

    for (const [serviceName, service] of this.services) {
      try {
        if (typeof service.healthCheck === 'function') {
          healthStatus[serviceName] = await service.healthCheck();
        } else {
          healthStatus[serviceName] = {
            status: 'available',
            message: 'Service is available (no health check implemented)'
          };
        }
      } catch (error) {
        healthStatus[serviceName] = {
          status: 'error',
          message: error.message
        };
      }
    }

    return healthStatus;
  }

  /**
   * Dispose all services and cleanup resources
   */
  dispose() {
    this.services.forEach((service, serviceName) => {
      if (typeof service.dispose === 'function') {
        service.dispose();
      }
    });

    this.services.clear();
  }

  /**
   * Get service statistics
   * @returns {Object} Statistics for all services
   */
  getServiceStatistics() {
    const stats = {
      totalServices: this.services.size,
      serviceNames: Array.from(this.services.keys()),
      configuration: this.configuration
    };

    // Add individual service stats if available
    this.services.forEach((service, serviceName) => {
      if (typeof service.getStatistics === 'function') {
        stats[serviceName] = service.getStatistics();
      }
    });

    return stats;
  }
}

// Service class placeholders - these will be created as we migrate existing services
class NotificationService extends BaseService {
  constructor(config) {
    super(config);
    this.baseUrl = '/notifications';
  }

  // Notification specific methods will be added during migration
}

class SystemConfigurationService extends BaseService {
  constructor(config) {
    super(config);
    this.baseUrl = '/systemconfig';
  }

  // System configuration specific methods will be added during migration
}

// Export singleton instance
const serviceFactory = new ServiceFactory();

export default serviceFactory;
export {
  ServiceFactory,
  TankStockService,
  VehicleService,
  UserManagementService,
  AuthenticationService,
  DashboardService,
  NotificationService,
  SystemConfigurationService
};
