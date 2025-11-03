/**
 * SignalR Base Service Utilities
 * Shared utilities and constants for all SignalR services
 * (PTS, Dashboard, Business)
 */

import {
  getResolvedApiBaseUrlSync,
  resolveApiBaseUrl,
} from "../api/axiosInstance";

// ============================================================
// ENUMS & CONSTANTS
// ============================================================

/**
 * Connection state enum
 * Used by all SignalR services to track connection status
 */
export const ConnectionState = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  RECONNECTING: "reconnecting",
  ERROR: "error",
  PAUSED: "paused",
};

/**
 * Error types for SignalR connections
 */
export const SignalRError = {
  CONNECTION_FAILED: "connection_failed",
  RECONNECTION_FAILED: "reconnection_failed",
  HANDLER_ERROR: "handler_error",
  AUTHENTICATION_FAILED: "authentication_failed",
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get window origin safely
 * @returns {string} Window origin or empty string
 */
export const getWindowOrigin = () =>
  typeof window !== "undefined" && window.location
    ? window.location.origin
    : "";

/**
 * Get environment hint from process.env
 * @returns {string} Environment name (production, development, etc.)
 */
export const getEnvironmentHint = () =>
  (
    process.env.REACT_APP_FMS_ENVIRONMENT ||
    process.env.REACT_APP_ENVIRONMENT ||
    process.env.NODE_ENV ||
    ""
  )
    .toString()
    .toLowerCase();

/**
 * Normalize SignalR host URL (remove trailing slashes)
 * @param {string} value - URL to normalize
 * @returns {string|null} Normalized URL or null
 */
export const normalizeSignalRHost = (value) =>
  value ? value.replace(/\/+$/, "") : null;

/**
 * Get authentication token from localStorage
 * @returns {string|null} JWT token or null
 */
export const getAuthToken = () => {
  return localStorage.getItem("token");
};

// ============================================================
// URL RESOLUTION
// ============================================================

/**
 * Resolve the best base URL for SignalR connections
 * This is the SINGLE SOURCE OF TRUTH for SignalR URL resolution
 *
 * Priority order:
 * 1. REACT_APP_SIGNALR_URL (if set - REMOVED from .env, so this won't be used)
 * 2. Resolved API base URL from axiosInstance (uses auto-detection)
 * 3. REACT_APP_PUBLIC_FMS_API_URL (fallback)
 * 4. REACT_APP_API_URL (fallback)
 * 5. Window origin (fallback)
 * 6. localhost:7009 (last resort)
 *
 * @param {string} serviceName - Name of the service for logging (e.g., "PTS", "Dashboard", "Business")
 * @returns {Promise<string>} Base URL without trailing slash or /api suffix
 */
export async function resolveSignalRBaseUrl(serviceName = "SignalR") {
  // Step 1: Check for explicit SignalR URL override (deprecated - should not be used)
  const explicitSignalR = (process.env.REACT_APP_SIGNALR_URL || "")
    .toString()
    .trim();

  if (explicitSignalR) {
    const normalized = explicitSignalR.replace(/\/?$/g, "");
    console.log(
      `[${serviceName} SignalR] ⚠️ Using REACT_APP_SIGNALR_URL override (deprecated):`,
      normalized
    );
    return removeApiSuffix(normalized);
  }

  // Step 2: Try to get cached API base URL from axiosInstance
  let baseUrl = getResolvedApiBaseUrlSync();

  // Step 3: If not cached, resolve it now
  if (!baseUrl) {
    console.log(`[${serviceName} SignalR] Base URL not cached, resolving...`);
    try {
      baseUrl = await resolveApiBaseUrl();
      console.log(`[${serviceName} SignalR] ✓ Resolved base URL:`, baseUrl);
    } catch (err) {
      console.error(
        `[${serviceName} SignalR] ❌ Failed to resolve API base URL:`,
        err
      );
      baseUrl = null;
    }
  } else {
    console.log(`[${serviceName} SignalR] ✓ Using cached base URL:`, baseUrl);
  }

  // Step 4: Build candidate list with fallbacks
  const windowOrigin = getWindowOrigin();
  const candidateHosts = [];

  // Priority 1: Resolved API base URL (from axios auto-detection)
  if (baseUrl) {
    candidateHosts.push(baseUrl);
  }

  // Priority 2: Explicit fallback URLs from environment
  if (process.env.REACT_APP_PUBLIC_FMS_API_URL) {
    candidateHosts.push(process.env.REACT_APP_PUBLIC_FMS_API_URL);
  }

  if (process.env.REACT_APP_API_URL) {
    candidateHosts.push(process.env.REACT_APP_API_URL);
  }

  // Priority 3: Window origin
  if (windowOrigin) {
    candidateHosts.push(windowOrigin);
  }

  // Remove duplicates while preserving order
  const uniqueCandidates = candidateHosts.filter((value, index, self) => {
    return value && self.indexOf(value) === index;
  });

  // Step 5: Use first valid candidate
  let normalized = uniqueCandidates.length > 0 ? uniqueCandidates[0] : null;

  // Step 6: Fallback to localhost if nothing worked
  if (!normalized) {
    console.error(
      `[${serviceName} SignalR] ❌ No valid candidates found. Using fallback.`
    );
    normalized = windowOrigin || "http://localhost:7009";
    console.warn(`[${serviceName} SignalR] Using fallback URL:`, normalized);
  }

  // Step 7: Remove /api suffix and trailing slashes
  normalized = removeApiSuffix(normalized);
  normalized = normalized.replace(/\/+$/, "");

  // Step 8: Validate final URL
  if (
    !normalized ||
    normalized === "null" ||
    normalized === null ||
    String(normalized) === "null" ||
    normalized.length < 7
  ) {
    console.error(
      `[${serviceName} SignalR] ❌ Invalid normalized URL:`,
      normalized
    );
    normalized = windowOrigin || "http://localhost:7009";
    console.warn(
      `[${serviceName} SignalR] Using emergency fallback:`,
      normalized
    );
  }

  console.log(
    `[${serviceName} SignalR] ✅ Final SignalR base URL:`,
    normalized
  );
  return normalized;
}

/**
 * Remove /api suffix from URL
 * @param {string} url - URL to process
 * @returns {string} URL without /api suffix
 */
function removeApiSuffix(url) {
  if (!url) return url;

  if (url.endsWith("/api/")) {
    return url.slice(0, -5);
  } else if (url.endsWith("/api")) {
    return url.slice(0, -4);
  }

  return url;
}

/**
 * Build full hub URL from base URL and hub path
 * @param {string} baseURL - Base URL (e.g., "http://10.0.10.153")
 * @param {string} hubPath - Hub path (e.g., "/ptsHub", "ptsHub", or null for default)
 * @param {string} defaultHubPath - Default hub path if hubPath is null
 * @returns {string} Full hub URL
 */
export function buildHubUrl(baseURL, hubPath, defaultHubPath) {
  const normalizedBase = baseURL.replace(/\/+$/, "");

  // If hubPath is a full URL, use it as-is
  if (hubPath && hubPath.startsWith("http")) {
    return hubPath;
  }

  // Determine the actual hub path to use
  const actualHubPath = hubPath || defaultHubPath;

  // Ensure hub path starts with /
  const normalizedHubPath = actualHubPath.startsWith("/")
    ? actualHubPath
    : `/${actualHubPath}`;

  return `${normalizedBase}${normalizedHubPath}`;
}

// ============================================================
// CONNECTION HELPERS
// ============================================================

/**
 * Log connection configuration
 * @param {string} serviceName - Service name for logging
 * @param {string} hubUrl - Full hub URL
 * @param {string} transport - Transport type description
 */
export function logConnectionConfig(
  serviceName,
  hubUrl,
  transport = "WebSockets with LongPolling fallback"
) {
  console.log(
    `[${serviceName} SignalR] ============================================`
  );
  console.log(`[${serviceName} SignalR] Connection Configuration:`);
  console.log(`[${serviceName} SignalR]   URL: ${hubUrl}`);
  console.log(`[${serviceName} SignalR]   Transport: ${transport}`);
  console.log(`[${serviceName} SignalR]   KeepAlive: 15s, ServerTimeout: 30s`);
  console.log(
    `[${serviceName} SignalR] ============================================`
  );
}

/**
 * Log successful connection
 * @param {string} serviceName - Service name for logging
 * @param {string} connectionId - Unique connection ID
 * @param {object} connection - SignalR connection object
 */
export function logConnectionSuccess(serviceName, connectionId, connection) {
  const actualTransport = connection?.transport?.name || "Unknown";
  console.log(
    `[${serviceName} SignalR] ✓ Connected successfully (ID: ${connectionId})`
  );
  console.log(`[${serviceName} SignalR] ✓ Transport: ${actualTransport}`);
  console.log(
    `[${serviceName} SignalR] ✓ Connection ID: ${connection?.connectionId}`
  );
}

/**
 * Create access token factory for SignalR
 * @param {string} serviceName - Service name for logging
 * @returns {Function} Access token factory function
 */
export function createAccessTokenFactory(serviceName) {
  return () => {
    const token = getAuthToken();
    if (token) {
      console.log(`[${serviceName} SignalR] ✓ Auth token present`);
      return token;
    }
    console.warn(
      `[${serviceName} SignalR] ✗ No auth token - connection may fail`
    );
    return null;
  };
}

/**
 * Get connection info object
 * @param {object} connection - SignalR connection
 * @param {boolean} isConnected - Connection status
 * @param {number} reconnectAttempts - Number of reconnect attempts
 * @param {Date} lastSuccessfulHealthCheck - Last health check timestamp
 * @param {Date} lastDataUpdate - Last data update timestamp
 * @returns {object|null} Connection info
 */
export function getConnectionInfo(
  connection,
  isConnected,
  reconnectAttempts,
  lastSuccessfulHealthCheck,
  lastDataUpdate
) {
  if (!connection || !isConnected) {
    return null;
  }

  return {
    connectionId: connection.connectionId,
    state: connection.state,
    transport: connection.transport?.name || "unknown",
    isConnected: isConnected,
    reconnectAttempts: reconnectAttempts,
    url: connection.baseUrl,
    lastHealthCheck: lastSuccessfulHealthCheck,
    lastDataUpdate: lastDataUpdate,
  };
}

// ============================================================
// DEFAULT EXPORT (for backward compatibility)
// ============================================================

export default {
  ConnectionState,
  SignalRError,
  getWindowOrigin,
  getEnvironmentHint,
  normalizeSignalRHost,
  getAuthToken,
  resolveSignalRBaseUrl,
  buildHubUrl,
  logConnectionConfig,
  logConnectionSuccess,
  createAccessTokenFactory,
  getConnectionInfo,
};
