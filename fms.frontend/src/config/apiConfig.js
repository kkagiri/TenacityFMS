/**
 * Centralized API Configuration Manager
 * Handles API base URL resolution for both intranet and public (internet) access
 *
 * Priority Order:
 * 1. Environment-specific URLs (REACT_APP_PRIVATE_FMS_API_URL for intranet)
 * 2. Health check probing to verify reachability
 * 3. Public URL fallback (REACT_APP_PUBLIC_FMS_API_URL)
 * 4. Window origin fallback
 *
 * Last Modified: 2025-10-30
 */

const HEALTH_CHECK_PATH = "v1/Health";
const PROBE_TIMEOUT_MS = 4000; // 4 seconds for health check
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// Cached values
let cachedApiBaseUrl = null;
let cachedSignalRBaseUrl = null;
let lastProbeTime = null;
let isProbing = false;

/**
 * Get window origin safely
 */
const getWindowOrigin = () =>
  typeof window !== "undefined" && window.location
    ? window.location.origin
    : "";

/**
 * Normalize URL by removing trailing slashes
 */
const normalizeUrl = (url) => {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, ""); // Remove all trailing slashes
};

/**
 * Get environment hint (production, development, staging, etc.)
 */
const getEnvironmentHint = () =>
  (
    process.env.REACT_APP_FMS_ENVIRONMENT ||
    process.env.REACT_APP_ENVIRONMENT ||
    process.env.NODE_ENV ||
    "development"
  )
    .toString()
    .toLowerCase();

/**
 * Check if running on local development machine
 */
const isLocalDevelopment = () => {
  return (
    process.env.REACT_APP_IS_LOCAL_DEV === "true" ||
    process.env.NODE_ENV === "development"
  );
};

/**
 * Build prioritized list of API candidate URLs
 * Returns: { intranet: [], public: [] }
 */
const buildApiCandidates = () => {
  const env = getEnvironmentHint();
  const isLocalDev = isLocalDevelopment();

  const intranet = [];
  const publicUrls = [];

  // Helper to add candidate
  const addCandidate = (url, isPublic = false) => {
    const normalized = normalizeUrl(url);
    if (normalized) {
      if (isPublic) {
        publicUrls.push(normalized);
      } else {
        intranet.push(normalized);
      }
    }
  };

  // 1. Local development URLs (highest priority for dev)
  if (isLocalDev) {
    addCandidate("http://localhost:7009/api");
    addCandidate("http://127.0.0.1:7009/api");
  }

  // 2. Environment-specific URLs
  switch (env) {
    case "production":
      // Intranet (private network)
      addCandidate(process.env.REACT_APP_PRIVATE_FMS_API_URL);
      addCandidate("http://10.0.10.153:7009"); // Production server

      // Public (internet-accessible)
      addCandidate(process.env.REACT_APP_PUBLIC_FMS_API_URL, true);
      addCandidate("http://197.254.33.227:7009", true); // Public IP
      break;

    case "staging":
    case "uat":
      addCandidate(process.env.REACT_APP_PRIVATE_FMS_API_URL);
      addCandidate("http://10.0.10.153:7009/api");
      addCandidate(process.env.REACT_APP_PUBLIC_FMS_API_URL, true);
      break;

    case "development":
    default:
      // Development server
      addCandidate(process.env.REACT_APP_PRIVATE_FMS_API_URL);
      addCandidate("http://10.0.11.90:7009/api"); // Dev server
      addCandidate("http://localhost:7009/api");
      break;
  }

  // 3. Generic environment variables (fallback)
  addCandidate(process.env.REACT_APP_API_URL);
  addCandidate(process.env.REACT_APP_FMS_API_URL);

  // 4. Window origin fallback
  const origin = getWindowOrigin();
  if (origin) {
    addCandidate(`${origin}/api`);
  }

  // Deduplicate while preserving order
  const uniqueIntranet = [...new Set(intranet)];
  const uniquePublic = [...new Set(publicUrls)];

  return {
    intranet: uniqueIntranet,
    public: uniquePublic,
  };
};

/**
 * Build prioritized list of SignalR hub URLs
 */
const buildSignalRCandidates = () => {
  const env = getEnvironmentHint();
  const isLocalDev = isLocalDevelopment();

  const intranet = [];
  const publicUrls = [];

  const addCandidate = (url, isPublic = false) => {
    const normalized = normalizeUrl(url);
    if (normalized) {
      if (isPublic) {
        publicUrls.push(normalized);
      } else {
        intranet.push(normalized);
      }
    }
  };

  // 1. Custom SignalR URL override
  addCandidate(process.env.REACT_APP_SIGNALR_URL);

  // 2. Local development
  if (isLocalDev) {
    addCandidate("http://localhost:7009");
    addCandidate("http://127.0.0.1:7009");
  }

  // 3. Environment-specific URLs
  switch (env) {
    case "production":
      addCandidate("http://10.0.10.153:7009"); // Intranet
      addCandidate("http://197.254.33.227:7009", true); // Public
      break;

    case "staging":
    case "uat":
      addCandidate("http://10.0.10.153:7009");
      break;

    case "development":
    default:
      addCandidate("http://10.0.11.90:7009");
      addCandidate("http://localhost:7009");
      break;
  }

  // 4. Derive from API URL (remove /api suffix)
  const apiCandidates = buildApiCandidates();
  [...apiCandidates.intranet, ...apiCandidates.public].forEach((apiUrl) => {
    const signalRUrl = apiUrl.replace(/\/api\/?$/, "");
    if (signalRUrl && signalRUrl !== apiUrl) {
      const isPublic = apiCandidates.public.includes(apiUrl);
      addCandidate(signalRUrl, isPublic);
    }
  });

  return {
    intranet: [...new Set(intranet)],
    public: [...new Set(publicUrls)],
  };
};

/**
 * Probe a candidate URL for reachability
 */
const probeCandidate = async (baseUrl) => {
  if (typeof fetch !== "function") {
    return false;
  }

  const controller =
    typeof AbortController !== "undefined" ? new AbortController() : null;
  let timeoutId;

  try {
    if (controller) {
      timeoutId = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    }

    const healthEndpoint = `${baseUrl}/${HEALTH_CHECK_PATH}`;
    const response = await fetch(healthEndpoint, {
      method: "GET",
      mode: "cors",
      credentials: "omit",
      signal: controller?.signal,
    });

    return response.ok;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[ApiConfig] Probe failed for ${baseUrl}:`, error.message);
    }
    return false;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

/**
 * Resolve the best API base URL with caching
 */
export const resolveApiBaseUrl = async (forceRefresh = false) => {
  // Return cached value if valid
  if (
    cachedApiBaseUrl &&
    !forceRefresh &&
    lastProbeTime &&
    Date.now() - lastProbeTime < CACHE_DURATION_MS
  ) {
    return cachedApiBaseUrl;
  }

  // Prevent concurrent probing
  if (isProbing) {
    // Wait for existing probe to complete
    await new Promise((resolve) => setTimeout(resolve, 100));
    return cachedApiBaseUrl || buildApiCandidates().intranet[0];
  }

  isProbing = true;

  try {
    const { intranet, public: publicUrls } = buildApiCandidates();
    const allCandidates = [...intranet, ...publicUrls];

    console.log("[ApiConfig] Resolving API base URL...");
    console.log("[ApiConfig] Intranet candidates:", intranet);
    console.log("[ApiConfig] Public candidates:", publicUrls);

    // Try intranet candidates first (faster for internal users)
    for (const candidate of intranet) {
      if (!candidate) continue;

      const reachable = await probeCandidate(candidate);
      if (reachable) {
        cachedApiBaseUrl = `${candidate}/api`;
        lastProbeTime = Date.now();
        console.log(
          `[ApiConfig] ✓ Connected via INTRANET: ${cachedApiBaseUrl}`
        );
        return cachedApiBaseUrl;
      }
    }

    // Try public candidates (for external access)
    for (const candidate of publicUrls) {
      if (!candidate) continue;

      const reachable = await probeCandidate(candidate);
      if (reachable) {
        cachedApiBaseUrl = `${candidate}/api`;
        lastProbeTime = Date.now();
        console.log(
          `[ApiConfig] ✓ Connected via PUBLIC IP: ${cachedApiBaseUrl}`
        );
        return cachedApiBaseUrl;
      }
    }

    // Fallback to first candidate without probing
    const fallback = allCandidates[0];
    cachedApiBaseUrl = fallback
      ? `${fallback}/api`
      : "http://localhost:7009/api";
    lastProbeTime = Date.now();

    console.warn(
      `[ApiConfig] ⚠ All candidates unreachable, using fallback: ${cachedApiBaseUrl}`
    );

    return cachedApiBaseUrl;
  } finally {
    isProbing = false;
  }
};

/**
 * Resolve the best SignalR base URL
 */
export const resolveSignalRBaseUrl = async (forceRefresh = false) => {
  // Return cached value if valid
  if (
    cachedSignalRBaseUrl &&
    !forceRefresh &&
    lastProbeTime &&
    Date.now() - lastProbeTime < CACHE_DURATION_MS
  ) {
    return cachedSignalRBaseUrl;
  }

  const { intranet, public: publicUrls } = buildSignalRCandidates();
  const allCandidates = [...intranet, ...publicUrls];

  console.log("[ApiConfig] Resolving SignalR base URL...");
  console.log("[ApiConfig] Intranet candidates:", intranet);
  console.log("[ApiConfig] Public candidates:", publicUrls);

  // Try intranet candidates first
  for (const candidate of intranet) {
    if (!candidate) continue;

    const reachable = await probeCandidate(candidate);
    if (reachable) {
      cachedSignalRBaseUrl = candidate;
      console.log(
        `[ApiConfig] ✓ SignalR via INTRANET: ${cachedSignalRBaseUrl}`
      );
      return cachedSignalRBaseUrl;
    }
  }

  // Try public candidates
  for (const candidate of publicUrls) {
    if (!candidate) continue;

    const reachable = await probeCandidate(candidate);
    if (reachable) {
      cachedSignalRBaseUrl = candidate;
      console.log(
        `[ApiConfig] ✓ SignalR via PUBLIC IP: ${cachedSignalRBaseUrl}`
      );
      return cachedSignalRBaseUrl;
    }
  }

  // Fallback
  const fallback = allCandidates[0] || "http://localhost:7009";
  cachedSignalRBaseUrl = fallback;

  console.warn(
    `[ApiConfig] ⚠ All SignalR candidates unreachable, using fallback: ${cachedSignalRBaseUrl}`
  );

  return cachedSignalRBaseUrl;
};

/**
 * Get cached API base URL synchronously (no probing)
 */
export const getApiBaseUrlSync = () => {
  if (cachedApiBaseUrl) {
    return cachedApiBaseUrl;
  }

  // Return first candidate without probing
  const { intranet } = buildApiCandidates();
  return intranet[0] ? `${intranet[0]}/api` : "http://localhost:7009/api";
};

/**
 * Get cached SignalR base URL synchronously (no probing)
 */
export const getSignalRBaseUrlSync = () => {
  if (cachedSignalRBaseUrl) {
    return cachedSignalRBaseUrl;
  }

  // Return first candidate without probing
  const { intranet } = buildSignalRCandidates();
  return intranet[0] || "http://localhost:7009";
};

/**
 * Clear cached URLs (useful for network change detection)
 */
export const clearCache = () => {
  cachedApiBaseUrl = null;
  cachedSignalRBaseUrl = null;
  lastProbeTime = null;
  console.log("[ApiConfig] Cache cleared");
};

/**
 * Get current configuration status
 */
export const getConfigStatus = () => {
  return {
    environment: getEnvironmentHint(),
    isLocalDev: isLocalDevelopment(),
    cachedApiUrl: cachedApiBaseUrl,
    cachedSignalRUrl: cachedSignalRBaseUrl,
    lastProbeTime: lastProbeTime ? new Date(lastProbeTime).toISOString() : null,
    cacheAge: lastProbeTime ? Date.now() - lastProbeTime : null,
    apiCandidates: buildApiCandidates(),
    signalRCandidates: buildSignalRCandidates(),
  };
};

// Export for debugging
if (typeof window !== "undefined") {
  window.__FMS_API_CONFIG__ = {
    resolveApiBaseUrl,
    resolveSignalRBaseUrl,
    getConfigStatus,
    clearCache,
  };
}

export default {
  resolveApiBaseUrl,
  resolveSignalRBaseUrl,
  getApiBaseUrlSync,
  getSignalRBaseUrlSync,
  clearCache,
  getConfigStatus,
};
