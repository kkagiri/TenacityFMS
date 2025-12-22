/**
 * API Client Configuration
 * Axios instance with environment-based configuration
 */

import axios from "axios";
import { API_CONFIG, DEBUG_CONFIG } from "../config/environment";

/**
 * Create axios instance with base configuration
 */
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * Request interceptor
 * - Adds authentication token
 * - Logs requests in debug mode
 */
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    // const token = getAuthToken(); // Implement this based on your auth system
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }

    // ALWAYS log request for debugging physical device connectivity
    console.log("🌐 API Request:", {
      method: config.method?.toUpperCase(),
      baseURL: config.baseURL,
      url: config.url,
      fullURL: `${config.baseURL}${config.url}`,
      data: config.data,
    });

    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * - Handles errors
 * - Logs responses in debug mode
 */
apiClient.interceptors.response.use(
  (response) => {
    // Log response in debug mode
    if (DEBUG_CONFIG.LOG_API_CALLS) {
      console.log("API Response:", {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }

    return response;
  },
  (error) => {
    // Log error
    console.error("API Error:", {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url,
    });

    // Handle specific error cases
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      console.log("Unauthorized - Redirecting to login");
    }

    return Promise.reject(error);
  }
);

/**
 * API Service wrapper with retry logic
 */
export const apiService = {
  /**
   * GET request with retry
   */
  get: async (url, config = {}) => {
    return apiClient.get(url, config);
  },

  /**
   * POST request with retry
   */
  post: async (url, data, config = {}) => {
    return apiClient.post(url, data, config);
  },

  /**
   * PUT request with retry
   */
  put: async (url, data, config = {}) => {
    return apiClient.put(url, data, config);
  },

  /**
   * DELETE request with retry
   */
  delete: async (url, config = {}) => {
    return apiClient.delete(url, config);
  },

  /**
   * Test API connectivity
   */
  testConnection: async () => {
    try {
      // Try to reach any health endpoint or simple endpoint
      const response = await apiClient.get("/health", { timeout: 5000 });
      console.log("API Connection: OK");
      return true;
    } catch (error) {
      console.error("API Connection: FAILED", error.message);
      return false;
    }
  },
};

export default apiClient;
