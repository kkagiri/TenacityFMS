// SignalR Connection Manager
// Manages which SignalR services are active based on current route/module

import ptsSignalRService from "./ptsSignalRService";
import dashboardSignalRService from "./dashboardSignalRService";
import businessSignalRService from "./businessSignalRService";

/**
 * Route patterns for different modules
 */
const ROUTE_PATTERNS = {
  DASHBOARD: [
    /^\/home$/,
    /^\/dashboard/,
    /\/dashboard$/,
    /^\/$/, // Root often goes to dashboard
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
    /^\/fueling/,
    /^\/atg/,
  ],
  BUSINESS: [
    /^\/tankstock/,
    /^\/tank-stock/,
    /^\/notifications/,
    /^\/issue-tracker/,
    /^\/active-alarms/,
    /^\/alarms/,
    /^\/stock/,
    /^\/delivery/,
    /^\/consumption/,
    /^\/adjustment/,
    /\/tankstock$/,
    /\/notifications$/,
    /\/issue-tracker$/,
    /\/active-alarms$/,
    /^\/reports\/fuel-importer/, // Fuel importer needs SignalR for async import progress
    /\/fuel-importer$/,
  ],
  // Routes that DON'T need any SignalR connection
  NO_SIGNALR: [
    /^\/vehicles/,
    /^\/site/,
    /^\/user/,
    /^\/roles/,
    /^\/permissions/,
    /^\/navigation/,
    /^\/admin\/users/,
    /^\/admin\/roles/,
    /^\/admin\/permissions/,
    /^\/pts-terminal-test/, // Test page has its own connection
  ],
  ADMIN: [/^\/admin/],
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
    console.log("[SignalRManager] Initializing with path:", initialPath);
    this.isInitialized = true;
    await this.handleRouteChange(initialPath);
  }

  /**
   * Handle route change
   * @param {string} newPath - New route path
   */
  async handleRouteChange(newPath) {
    if (!this.isInitialized) {
      console.warn("[SignalRManager] Not initialized yet");
      return;
    }

    // Skip SignalR for login/auth pages or when no token present
    const isAuthPage =
      newPath.includes("/login") ||
      newPath.includes("/auth") ||
      newPath.includes("/logout");
    const hasToken = !!localStorage.getItem("token");

    if (isAuthPage || !hasToken) {
      console.log(
        `[SignalRManager] ⏭️ Skipping SignalR - ${
          isAuthPage ? "auth page" : "no token"
        }`
      );
      // Stop all active services if user is logging out
      if (this.activeServices.size > 0) {
        await this.stopAll();
      }
      return;
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`[SignalRManager] 🔄 Route Change Detected`);
    console.log(`  From: ${this.currentPath || "(initial)"}`);
    console.log(`  To:   ${newPath}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    this.currentPath = newPath;

    const requiredServices = this.getRequiredServices(newPath);
    const servicesToStart = [];
    const servicesToStop = [];

    console.log(`[SignalRManager] 📊 Service Analysis:`);
    console.log(
      `  Currently Active: [${
        Array.from(this.activeServices).join(", ") || "none"
      }]`
    );
    console.log(
      `  Required for route: [${
        Array.from(requiredServices).join(", ") || "none"
      }]`
    );

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

    console.log(`[SignalRManager] 🎬 Actions:`);
    console.log(`  ⛔ To Stop:  [${servicesToStop.join(", ") || "none"}]`);
    console.log(`  ▶️  To Start: [${servicesToStart.join(", ") || "none"}]`);

    // Stop unnecessary services
    if (servicesToStop.length > 0) {
      console.log(
        `[SignalRManager] 🛑 Stopping ${servicesToStop.length} service(s)...`
      );
      await Promise.all(
        servicesToStop.map((service) =>
          this.stopService(service, "route-change")
        )
      );
    }

    // Start required services
    if (servicesToStart.length > 0) {
      console.log(
        `[SignalRManager] ▶️ Starting ${servicesToStart.length} service(s)...`
      );
      await Promise.all(
        servicesToStart.map((service) =>
          this.startService(service, "route-change")
        )
      );
    }

    // Validate final state
    const finalActive = Array.from(this.activeServices).sort();
    const expectedActive = Array.from(requiredServices).sort();
    const stateValid =
      JSON.stringify(finalActive) === JSON.stringify(expectedActive);

    console.log(`[SignalRManager] ✅ Route Change Complete`);
    console.log(`  Final Active: [${finalActive.join(", ") || "none"}]`);
    console.log(
      `  State Valid:  ${stateValid ? "✅ YES" : "❌ NO - MISMATCH!"}`
    );
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    if (!stateValid) {
      console.error(
        `[SignalRManager] ❌ STATE MISMATCH DETECTED!`,
        `\n  Expected: [${expectedActive.join(", ")}]`,
        `\n  Actual:   [${finalActive.join(", ")}]`
      );
    }
  }

  /**
   * Determine which services are required for a given path
   * @param {string} path - Route path
   * @returns {Set<string>} Set of required service names
   */
  getRequiredServices(path) {
    const services = new Set();

    console.log(`[SignalRManager] 🔍 Analyzing route: "${path}"`);

    // First, check if this route explicitly DOESN'T need SignalR
    if (this.matchesPattern(path, ROUTE_PATTERNS.NO_SIGNALR)) {
      console.log(
        `[SignalRManager] ⛔ Route matches NO_SIGNALR pattern - returning empty set`
      );
      return services; // Return empty set
    }

    // Check if path matches dashboard patterns
    if (this.matchesPattern(path, ROUTE_PATTERNS.DASHBOARD)) {
      services.add("dashboard");
      console.log(`[SignalRManager] ✓ Matched DASHBOARD pattern`);
    }

    // Check if path matches PTS patterns
    if (this.matchesPattern(path, ROUTE_PATTERNS.PTS)) {
      services.add("pts");
      console.log(`[SignalRManager] ✓ Matched PTS pattern`);
    }

    // Check if path matches business patterns
    if (this.matchesPattern(path, ROUTE_PATTERNS.BUSINESS)) {
      services.add("business");
      console.log(`[SignalRManager] ✓ Matched BUSINESS pattern`);
    }

    // Admin and Reports might need multiple services
    if (this.matchesPattern(path, ROUTE_PATTERNS.ADMIN)) {
      services.add("business");
      console.log(`[SignalRManager] ✓ Matched ADMIN pattern`);
    }

    if (this.matchesPattern(path, ROUTE_PATTERNS.REPORTS)) {
      services.add("business");
      console.log(`[SignalRManager] ✓ Matched REPORTS pattern`);
    }

    // Only default to dashboard if on root path or truly unknown route
    if (services.size === 0 && (path === "/" || path === "/home")) {
      console.log(
        "[SignalRManager] 🏠 Root/Home path, connecting to dashboard"
      );
      services.add("dashboard");
    } else if (services.size === 0) {
      console.log(
        "[SignalRManager] ℹ️ No SignalR services required for path:",
        path
      );
    }

    console.log(
      `[SignalRManager] ✅ Required services: [${
        Array.from(services).join(", ") || "none"
      }]`
    );
    return services;
  }

  /**
   * Check if path matches any pattern in array
   * @param {string} path - Route path
   * @param {RegExp[]} patterns - Array of regex patterns
   * @returns {boolean}
   */
  matchesPattern(path, patterns) {
    if (!patterns || !Array.isArray(patterns)) {
      console.warn(
        "[SignalRManager] Invalid patterns provided to matchesPattern:",
        patterns
      );
      return false;
    }
    return patterns.some((pattern) => pattern.test(path));
  }

  /**
   * Start a SignalR service
   * @param {string} serviceName - Name of service to start
   * @param {string} reason - Reason for starting (for logging)
   */
  async startService(serviceName, reason = "manual") {
    // Prevent duplicate start attempts
    if (this.connectionPromises.has(serviceName)) {
      console.log(
        `[SignalRManager] ⏸️ Service ${serviceName} is already starting, skipping...`
      );
      return this.connectionPromises.get(serviceName);
    }

    console.log(
      `[SignalRManager] ▶️ Starting ${serviceName} service (reason: ${reason})`
    );

    let promise;
    try {
      switch (serviceName) {
        case "dashboard":
          promise = dashboardSignalRService.start();
          break;
        case "pts":
          promise = ptsSignalRService.start();
          break;
        case "business":
          promise = businessSignalRService.start();
          break;
        default:
          console.warn(`[SignalRManager] ❌ Unknown service: ${serviceName}`);
          return;
      }

      this.connectionPromises.set(serviceName, promise);
      await promise;
      this.activeServices.add(serviceName);
      console.log(
        `[SignalRManager] ✅ ${serviceName} service started successfully`
      );

      // Request initial data after connection
      await this.requestInitialData(serviceName);
    } catch (error) {
      console.error(
        `[SignalRManager] ❌ Failed to start ${serviceName} service:`,
        error
      );
    } finally {
      this.connectionPromises.delete(serviceName);
    }
  }

  /**
   * Stop a SignalR service
   * @param {string} serviceName - Name of service to stop
   * @param {string} reason - Reason for stopping (for logging)
   */
  async stopService(serviceName, reason = "manual") {
    if (!this.activeServices.has(serviceName)) {
      console.log(
        `[SignalRManager] ⏭️ Skip stopping ${serviceName} (not active)`
      );
      return;
    }

    console.log(
      `[SignalRManager] ⛔ Stopping ${serviceName} service (reason: ${reason})`
    );

    try {
      switch (serviceName) {
        case "dashboard":
          await dashboardSignalRService.stop();
          break;
        case "pts":
          await ptsSignalRService.stop();
          break;
        case "business":
          await businessSignalRService.stop();
          break;
        default:
          console.warn(`[SignalRManager] ❌ Unknown service: ${serviceName}`);
          return;
      }
      this.activeServices.delete(serviceName);
      console.log(`[SignalRManager] ✅ ${serviceName} service stopped`);
    } catch (error) {
      console.error(
        `[SignalRManager] ❌ Error stopping ${serviceName} service:`,
        error
      );
    }
  }

  /**
   * Request initial data after service connection
   * @param {string} serviceName - Name of service
   */
  async requestInitialData(serviceName) {
    try {
      switch (serviceName) {
        case "dashboard":
          // Request dashboard initial data
          if (dashboardSignalRService.getConnectionStatus()) {
            await dashboardSignalRService.requestDashboardMetrics();
          }
          break;
        case "pts":
          // Request PTS initial data
          if (ptsSignalRService.getConnectionStatus()) {
            await ptsSignalRService.requestDeviceStatusSummary();
            await ptsSignalRService.requestPTSDeviceList();
          }
          break;
        case "business":
          // Request business initial data (if needed)
          if (businessSignalRService.getConnectionStatus()) {
            // You can add initial data requests here if needed
            // await businessSignalRService.requestAlarmStatistics();
          }
          break;
        default:
          console.warn(
            `[SignalRManager] Unknown service for initial data request: ${serviceName}`
          );
          break;
      }
    } catch (error) {
      console.error(
        `[SignalRManager] Error requesting initial data for ${serviceName}:`,
        error
      );
    }
  }

  /**
   * Stop all active services
   */
  async stopAll() {
    console.log("[SignalRManager] Stopping all services");
    const stopPromises = Array.from(this.activeServices).map((service) =>
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
      ptsConnected: ptsSignalRService.getConnectionStatus(),
      businessConnected: businessSignalRService.getConnectionStatus(),
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
    const requiredServices = this.getRequiredServices(
      this.currentPath || window.location.pathname
    );
    return requiredServices.has(serviceName);
  }

  /**
   * Manual connect to specific service (for debugging/testing)
   * @param {string} serviceName - Service to connect
   */
  async connectService(serviceName) {
    console.log(`[SignalRManager] Manual connect: ${serviceName}`);
    await this.startService(serviceName);
  }

  /**
   * Manual disconnect from specific service (for debugging/testing)
   * @param {string} serviceName - Service to disconnect
   */
  async disconnectService(serviceName) {
    console.log(`[SignalRManager] Manual disconnect: ${serviceName}`);
    await this.stopService(serviceName);
  }
}

// Export singleton instance
const signalRConnectionManager = new SignalRConnectionManager();
export default signalRConnectionManager;
