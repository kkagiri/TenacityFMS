/**
 * ⚠️ DEPRECATED - DO NOT USE ⚠️
 *
 * This service has been replaced by:
 * - dashboardSignalRService.js (for dashboard real-time updates)
 * - ptsSignalRService.js (for PTS device updates)
 *
 * Managed by: SignalRConnectionManager.js
 *
 * This file is kept for reference only.
 * All imports should be removed.
 */

// Throw error if someone tries to use this
const throwDeprecationError = () => {
  throw new Error(
    "signalRService.js is deprecated. Use dashboardSignalRService or ptsSignalRService instead."
  );
};

class SignalRService {
  constructor() {
    console.error(
      "❌ signalRService is DEPRECATED - Use dashboardSignalRService or ptsSignalRService"
    );
    throwDeprecationError();
  }

  async start() {
    throwDeprecationError();
  }
  async stop() {
    throwDeprecationError();
  }
  setupEventHandlers() {
    throwDeprecationError();
  }
  async subscribeToMetrics() {
    throwDeprecationError();
  }
  async unsubscribeFromMetrics() {
    throwDeprecationError();
  }
  async requestAllDevicesStatus() {
    throwDeprecationError();
  }
  async send() {
    throwDeprecationError();
  }
  on() {
    throwDeprecationError();
  }
  off() {
    throwDeprecationError();
  }
  notifyListeners() {
    throwDeprecationError();
  }
  getConnectionStatus() {
    throwDeprecationError();
  }
  getConnectionInfo() {
    throwDeprecationError();
  }
}

// Export disabled service
const signalRService = new Proxy(
  {},
  {
    get() {
      console.error("❌ Attempted to use deprecated signalRService");
      throwDeprecationError();
    },
  }
);

export default signalRService;
export { SignalRService };
