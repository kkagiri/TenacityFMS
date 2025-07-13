import axios from "axios";
// Simplified URL determination - no async needed
const getApiUrl = () => {
  if (process.env.NODE_ENV === "development") {
    return process.env.REACT_APP_API_URL; // Use the simplified env var
  } else {
    // In production, you could add fallback logic here if needed
    return process.env.REACT_APP_API_URL;
  }
};

// Create axios instance with dynamic baseURL
const axiosInstance = axios.create({
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Set baseURL for each request (no async needed)
    config.baseURL = getApiUrl();

    // Add auth token if available
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`Making request to: ${config.baseURL}${config.url}`);
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
    if (error.code === 'ECONNABORTED' || error.message === "Network Error") {
      console.error("Network error - check CORS configuration:", error);
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
         window.location.href = '/login'; // Uncomment if you want automatic redirect
      }

      // Handle not found errors
      if (error.response.status === 404) {
        console.error("Resource not found");
      }
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