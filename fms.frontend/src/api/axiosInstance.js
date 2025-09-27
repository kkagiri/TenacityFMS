import axios from "axios";
// Resolve API URL from multiple env vars with sensible fallbacks
const getApiUrl = () => {
  const candidates = [
    process.env.REACT_APP_API_URL,
    process.env.REACT_APP_FMS_API_URL,
    process.env.REACT_APP_PUBLIC_FMS_API_URL,
    process.env.REACT_APP_FMS_API_URL_DEV,
    process.env.REACT_APP_FMS_API_URL_PROD,
  ].filter(Boolean);

  let apiUrl = candidates[0];

  if (!apiUrl) {
    const fallback = `${window.location.origin}/api`;
    console.warn(
      `API base URL not configured via env. Falling back to ${fallback}. Set REACT_APP_API_URL in .env.`
    );
    return fallback;
  }

  if (process.env.NODE_ENV === "development") {
    console.log("Environment:", process.env.NODE_ENV);
    console.log("Resolved API URL:", apiUrl);
  }

  // Ensure trailing slash so relative URLs join as /api/route
  if (apiUrl && !apiUrl.endsWith('/')) {
    apiUrl = apiUrl + '/';
  }

  return apiUrl;
};

// Create axios instance with dynamic baseURL
const axiosInstance = axios.create({
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
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
    if (config.url && !config.url.includes('/api/v')) {
      // If URL starts with just controller name (e.g., 'tankstock/openingstock')
      // prepend v1 to make it 'v1/tankstock/openingstock'
      if (!config.url.startsWith('api/')) {
        // Remove leading slash if present to avoid double slash
        const cleanUrl = config.url.startsWith('/') ? config.url.slice(1) : config.url;
        config.url = `v1/${cleanUrl}`;
      }
    }

    // Add auth token if available
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Ensure API-Version header is set (can be overridden per request)
    if (!config.headers['API-Version']) {
      config.headers['API-Version'] = 'v1';
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`Making request to: ${config.baseURL}${config.url}`);
      console.log('Request headers:', config.headers);
      console.log('Request method:', config.method);
      console.log('Request data:', config.data);
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
        baseURL: response.config.baseURL
      });
    }
    return response;
  },
  (error) => {
    // Handle network errors (often CORS related)
    if (error.code === 'ECONNABORTED') {
      console.error("Request timeout - server may be slow or unreachable. Consider checking server status:", error);
    } else if (error.message === "Network Error") {
      console.error("Network error - check CORS configuration or server connection:", error);
    }

    // Log error responses
    if (error.response) {
      console.error(`Error response from ${error.config?.url}:`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        baseURL: error.config?.baseURL
      });

      // Handle authentication errors
      if (error.response.status === 401) {
        console.error("Authentication error - token may be expired");
        // Clear token and redirect to login
        localStorage.removeItem("token");
        // window.location.href = '/login'; // Uncomment if you want automatic redirect
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
        method: error.config?.method
      });
    }

    return Promise.reject(error);
  }
);
// Initialize function for App.js compatibility
export const initializeAxiosInstance = async () => {
  axiosInstance.defaults.baseURL = getApiUrl();

  if (process.env.NODE_ENV === "development") {
    console.log("Axios instance initialized with baseURL:", axiosInstance.defaults.baseURL);
  }
};
export default axiosInstance;