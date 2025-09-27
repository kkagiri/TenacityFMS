/**
 * Core Services Index
 *
 * Central export point for all core service components:
 * - BaseService: Foundation class for all API services
 * - APIErrorHandler: Standardized error processing
 * - ServiceFactory: Dependency injection and service management
 *
 * @version 1.0.0
 * @since API v1
 */

import BaseService from './BaseService';
import APIErrorHandler from './APIErrorHandler';
import ServiceLogger from './ServiceLogger';
import serviceFactory, {
  ServiceFactory,
  TankStockService,
  VehicleService,
  UserManagementService,
  NotificationService,
  DashboardService,
  AuthenticationService,
  SystemConfigurationService
} from './ServiceFactory';

export {
  // Core service classes
  BaseService,
  APIErrorHandler,
  ServiceLogger,
  ServiceFactory,

  // Service factory singleton
  serviceFactory,

  // Domain service classes
  TankStockService,
  VehicleService,
  UserManagementService,
  NotificationService,
  DashboardService,
  AuthenticationService,
  SystemConfigurationService
};

// Default export for convenience
export default serviceFactory;