import axios from "axios";

const HEALTH_CHECK_PATH = "v1/Health";
const PROBE_TIMEOUT_MS = 4000;

const getWindowOrigin = () =>
  typeof window !== "undefined" && window.location
    ? window.location.origin
    : "";

const normalizeUrl = (url) => {
  if (!url) {
    return null;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
};

const buildCandidateList = () => {
  // Check if we're on local dev machine using Windows environment variable
  const isLocalDev = process.env.REACT_APP_IS_LOCAL_DEV === 'true';

  // If local dev, prioritize localhost URLs
  const localDevUrls = isLocalDev ? [
    'http://localhost:7009/api/',
    'http://127.0.0.1:7009/api/',
  ] : [];

  const envCandidates = [
    ...localDevUrls, // Local dev URLs go first if enabled
    process.env.REACT_APP_PRIVATE_FMS_API_URL,
    process.env.REACT_APP_API_URL,
    process.env.REACT_APP_FMS_API_URL,
    process.env.REACT_APP_FMS_API_URL_DEV,
    process.env.REACT_APP_FMS_API_URL_PROD,
    process.env.REACT_APP_PUBLIC_FMS_API_URL,
  ]
    .filter(Boolean)
    .map(normalizeUrl)
    .filter(Boolean);

  const fallback = normalizeUrl(`${getWindowOrigin()}/api`);
  const combined = fallback ? [...envCandidates, fallback] : [...envCandidates];

  // Deduplicate while preserving order
  const deduplicated = combined.filter((value, index) => combined.indexOf(value) === index);

  if (process.env.NODE_ENV === "development" && isLocalDev) {
    console.log(`[Axios] Local dev mode enabled - prioritizing localhost URLs`);
  }

  return deduplicated;
};

let cachedApiBaseUrl = null;
let defaultApiBaseUrl = null;
let resolvePromise = null;

const ensureDefaultApiUrl = () => {
  if (!defaultApiBaseUrl) {
    const candidates = buildCandidateList();
    defaultApiBaseUrl =
      candidates[0] || normalizeUrl("http://localhost:7009/api");

    if (!defaultApiBaseUrl) {
      defaultApiBaseUrl = "http://localhost:7009/api/";
    }
  }

  return defaultApiBaseUrl;
};

const getApiUrl = () => cachedApiBaseUrl || ensureDefaultApiUrl();

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

    const healthEndpoint = `${baseUrl}${HEALTH_CHECK_PATH}`;
    const response = await fetch(healthEndpoint, {
      method: "GET",
      mode: "cors",
      credentials: "omit",
      signal: controller?.signal,
    });

    return response.ok;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[Axios] Probe failed for ${baseUrl}`, error);
    }
    return false;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

export const resolveApiBaseUrl = async (forceRefresh = false) => {
  if (cachedApiBaseUrl && !forceRefresh) {
    return cachedApiBaseUrl;
  }

  if (resolvePromise) {
    return resolvePromise;
  }

  const candidates = buildCandidateList();

  const attemptResolve = async () => {
    for (const candidate of candidates) {
      if (!candidate) {
        continue;
      }

      const reachable = await probeCandidate(candidate);
      if (reachable) {
        cachedApiBaseUrl = candidate;
        break;
      }
    }

    if (!cachedApiBaseUrl) {
      cachedApiBaseUrl = ensureDefaultApiUrl();
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[Axios] Falling back to default API URL ${cachedApiBaseUrl}. Check connectivity to preferred endpoints.`
        );
      }
    }

    if (typeof window !== "undefined") {
      window.__FMS_API_BASE_URL__ = cachedApiBaseUrl;
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`[Axios] Resolved API base URL: ${cachedApiBaseUrl}`);
    }

    return cachedApiBaseUrl;
  };

  resolvePromise = attemptResolve().finally(() => {
    resolvePromise = null;
  });

  return resolvePromise;
};

export const getResolvedApiBaseUrlSync = () => cachedApiBaseUrl;

// Create axios instance with dynamic baseURL
const axiosInstance = axios.create({
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "API-Version": "v1", // Default to v1 for all requests
  },
  timeout: 30000, // 30 second timeout - restored for debugging
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Set baseURL for each request (no async needed)
    config.baseURL = getApiUrl();

    // Handle API versioning - auto-prepend v1 if not already in URL
    if (config.url && !config.url.includes("/api/v")) {
      // If URL starts with just controller name (e.g., 'tankstock/openingstock')
      // prepend v1 to make it 'v1/tankstock/openingstock'
      if (!config.url.startsWith("api/")) {
        // Remove leading slash if present to avoid double slash
        const cleanUrl = config.url.startsWith("/")
          ? config.url.slice(1)
          : config.url;
        config.url = `v1/${cleanUrl}`;
      }
    }

    // Add auth token if available
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Ensure API-Version header is set (can be overridden per request)
    if (!config.headers["API-Version"]) {
      config.headers["API-Version"] = "v1";
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`Making request to: ${config.baseURL}${config.url}`);
      console.log("Request headers:", config.headers);
      console.log("Request method:", config.method);
      console.log("Request data:", config.data);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`Response from ${response.config.url}:`, {
        status: response.status,
        statusText: response.statusText,
        baseURL: response.config.baseURL,
      });
    }
    return response;
  },
  (error) => {
    // Handle network errors (often CORS related)
    if (error.code === "ECONNABORTED") {
      console.error(
        "Request timeout - server may be slow or unreachable. Consider checking server status:",
        error
      );
    } else if (error.message === "Network Error") {
      console.error(
        "Network error - check CORS configuration or server connection:",
        error
      );
    }

    // Log error responses
    if (error.response) {
      console.error(`Error response from ${error.config?.url}:`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        baseURL: error.config?.baseURL,
      });

      // Handle authentication errors
      if (error.response.status === 401) {
        const token = localStorage.getItem('token');

        // Only log and clear if we actually had a token (i.e., it's expired)
        // Don't log 401 errors when there's no token (unauthenticated state is expected)
        if (token) {
          console.error("🚫 Authentication error - token may be expired or invalid");
          localStorage.removeItem("token");
          // window.location.href = '/login'; // Uncomment if you want automatic redirect
        } else {
          console.debug("ℹ️ 401 response (no token present - expected on login page)");
        }
      }

      // Handle not found errors
      if (error.response.status === 404) {
        console.error("Resource not found");
      }

      // Handle server errors
      if (error.response.status >= 500) {
        console.error("Server error - please try again later");
      }
    } else if (error.request) {
      console.error("No response received from server:", {
        baseURL: error.config?.baseURL,
        url: error.config?.url,
        method: error.config?.method,
      });
    }

    return Promise.reject(error);
  }
);
// Initialize function for App.js compatibility
export const initializeAxiosInstance = async () => {
  const resolvedBase = await resolveApiBaseUrl();
  axiosInstance.defaults.baseURL = resolvedBase;

  if (process.env.NODE_ENV === "development") {
    console.log("Axios instance initialized with baseURL:", resolvedBase);
  }
};
export default axiosInstance;
