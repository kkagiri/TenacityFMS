// SignalR Connection Manager
// Manages which SignalR services are active based on current route/module

import ptsSignalRService from './ptsSignalRService';
import dashboardSignalRService from './dashboardSignalRService';

/**
 * Route patterns for different modules
 */
const ROUTE_PATTERNS = {
  DASHBOARD: [
    /^\/home$/,
    /^\/dashboard/,
    /\/dashboard$/,
    /^\/$/,  // Root often goes to dashboard
    /^\/notifications/,  // Notifications typically show on dashboard
    /^\/issue-tracker/,  // Issue tracking often needs dashboard updates
    /^\/active-alarms/,  // Active alarms are dashboard-centric
    /^\/tankstock/       // Tank stock monitoring uses dashboard features
  ],
  PTS: [
    /^\/pts/,
    /\/pts$/,
    /^\/pump/,
    /^\/device/,
    /^\/fuel/,
    /^\/tag/,
    /^\/probe/,
    /^\/reader/,
    /^\/fueling/,        // Fueling process needs PTS data
    /^\/atg/,            // ATG is part of PTS system
    /^\/vehicles/        // Vehicle management might need PTS device data
  ],
  REPORTS: [
    /^\/reports/,
    /^\/analytics/
  ]
};

/**
 * SignalR Connection Manager
 * Controls which SignalR services should be active based on application state
 */
class SignalRConnectionManager {
  constructor() {
    this.activeServices = new Set();
    this.currentPath = null;
    this.isInitialized = false;
    this.connectionPromises = new Map();
  }

  /**
   * Initialize the connection manager
   * @param {string} initialPath - Initial route path
   */
  async initialize(initialPath = window.location.pathname) {
    console.log('[SignalRManager] Initializing with path:', initialPath);
    this.isInitialized = true;
    await this.handleRouteChange(initialPath);
  }

  /**
   * Handle route change
   * @param {string} newPath - New route path
   */
  async handleRouteChange(newPath) {
    if (!this.isInitialized) {
      console.warn('[SignalRManager] Not initialized yet');
      return;
    }

    console.log('[SignalRManager] Route changed from', this.currentPath, 'to', newPath);
    this.currentPath = newPath;

    const requiredServices = this.getRequiredServices(newPath);
    const servicesToStart = [];
    const servicesToStop = [];

    // Determine which services to start
    for (const service of requiredServices) {
      if (!this.activeServices.has(service)) {
        servicesToStart.push(service);
      }
    }

    // Determine which services to stop
    for (const service of this.activeServices) {
      if (!requiredServices.has(service)) {
        servicesToStop.push(service);
      }
    }

    // Stop unnecessary services
    await Promise.all(servicesToStop.map(service => this.stopService(service)));

    // Start required services
    await Promise.all(servicesToStart.map(service => this.startService(service)));
  }

  /**
   * Determine which services are required for a given path
   * @param {string} path - Route path
   * @returns {Set<string>} Set of required service names
   */
  getRequiredServices(path) {
    const services = new Set();

    // Check if path matches dashboard patterns
    if (this.matchesPattern(path, ROUTE_PATTERNS.DASHBOARD)) {
      services.add('dashboard');
    }

    // Check if path matches PTS patterns
    if (this.matchesPattern(path, ROUTE_PATTERNS.PTS)) {
      services.add('pts');
    }

    // Admin and Reports might need both services
    if (this.matchesPattern(path, ROUTE_PATTERNS.ADMIN) ||
        this.matchesPattern(path, ROUTE_PATTERNS.REPORTS)) {
      services.add('dashboard');
      services.add('pts');
    }

    // If no specific match, default to dashboard
    if (services.size === 0) {
      console.log('[SignalRManager] No specific route match, defaulting to dashboard');
      services.add('dashboard');
    }

    console.log('[SignalRManager] Required services for', path, ':', Array.from(services));
    return services;
  }

  /**
   * Check if path matches any pattern in array
   * @param {string} path - Route path
   * @param {RegExp[]} patterns - Array of regex patterns
   * @returns {boolean}
   */
  matchesPattern(path, patterns) {
    return patterns.some(pattern => pattern.test(path));
  }

  /**
   * Start a SignalR service
   * @param {string} serviceName - Name of service to start
   */
  async startService(serviceName) {
    // Prevent duplicate start attempts
    if (this.connectionPromises.has(serviceName)) {
      console.log(`[SignalRManager] Service ${serviceName} is already starting`);
      return this.connectionPromises.get(serviceName);
    }

    console.log(`[SignalRManager] Starting ${serviceName} service`);

    let promise;
    try {
      switch (serviceName) {
        case 'dashboard':
          promise = dashboardSignalRService.start();
          break;
        case 'pts':
          promise = ptsSignalRService.start();
          break;
        default:
          console.warn(`[SignalRManager] Unknown service: ${serviceName}`);
          return;
      }

      this.connectionPromises.set(serviceName, promise);
      await promise;
      this.activeServices.add(serviceName);
      console.log(`[SignalRManager] ${serviceName} service started successfully`);

      // Request initial data after connection
      await this.requestInitialData(serviceName);

    } catch (error) {
      console.error(`[SignalRManager] Failed to start ${serviceName} service:`, error);
    } finally {
      this.connectionPromises.delete(serviceName);
    }
  }

  /**
   * Stop a SignalR service
   * @param {string} serviceName - Name of service to stop
   */
  async stopService(serviceName) {
    if (!this.activeServices.has(serviceName)) {
      return;
    }

    console.log(`[SignalRManager] Stopping ${serviceName} service`);

    try {
      switch (serviceName) {
        case 'dashboard':
          await dashboardSignalRService.stop();
          break;
        case 'pts':
          await ptsSignalRService.stop();
          break;
        default:
          console.warn(`[SignalRManager] Unknown service: ${serviceName}`);
          return;
      }
      this.activeServices.delete(serviceName);
      console.log(`[SignalRManager] ${serviceName} service stopped`);
    } catch (error) {
      console.error(`[SignalRManager] Error stopping ${serviceName} service:`, error);
    }
  }

  /**
   * Request initial data after service connection
   * @param {string} serviceName - Name of service
   */
  async requestInitialData(serviceName) {
    try {
      switch (serviceName) {
        case 'dashboard':
          // Request dashboard initial data
          if (dashboardSignalRService.getConnectionStatus()) {
            await dashboardSignalRService.requestDashboardMetrics();
            // Note: RequestKeyStatistics removed as it's not implemented on server
          }
          break;
        case 'pts':
          // Request PTS initial data
          if (ptsSignalRService.getConnectionStatus()) {
            await ptsSignalRService.requestDeviceStatusSummary();
            await ptsSignalRService.requestPTSDeviceList();
          }
          break;
        default:
          console.warn(`[SignalRManager] Unknown service for initial data request: ${serviceName}`);
          break;
      }
    } catch (error) {
      console.error(`[SignalRManager] Error requesting initial data for ${serviceName}:`, error);
    }
  }

  /**
   * Stop all active services
   */
  async stopAll() {
    console.log('[SignalRManager] Stopping all services');
    const stopPromises = Array.from(this.activeServices).map(service =>
      this.stopService(service)
    );
    await Promise.all(stopPromises);
  }

  /**
   * Get status of all services
   * @returns {Object} Status object
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      currentPath: this.currentPath,
      activeServices: Array.from(this.activeServices),
      dashboardConnected: dashboardSignalRService.getConnectionStatus(),
      ptsConnected: ptsSignalRService.getConnectionStatus()
    };
  }

  /**
   * Force refresh specific service
   * @param {string} serviceName - Service to refresh
   */
  async refreshService(serviceName) {
    console.log(`[SignalRManager] Refreshing ${serviceName} service`);

    if (this.activeServices.has(serviceName)) {
      await this.stopService(serviceName);
      await this.startService(serviceName);
    }
  }

  /**
   * Check if a service should be active for current path
   * @param {string} serviceName - Service name to check
   * @returns {boolean}
   */
  shouldServiceBeActive(serviceName) {
    const requiredServices = this.getRequiredServices(this.currentPath || window.location.pathname);
    return requiredServices.has(serviceName);
  }
}

// Export singleton instance
const signalRConnectionManager = new SignalRConnectionManager();
export default signalRConnectionManager;
