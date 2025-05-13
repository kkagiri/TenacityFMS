import axios from "axios";

const determineApiUrl = async () => {
  if (process.env.NODE_ENV === "development") {
    // console.log("development");
    // console.log(process.env.REACT_APP_FMS_API_URL_DEV);
    return process.env.REACT_APP_FMS_API_URL_DEV;
  } else {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_PUBLIC_FMS_API_URL}/health`
      );
      if (response.ok) {
        return process.env.REACT_APP_PUBLIC_FMS_API_URL;
      } else {
        return process.env.REACT_APP_FMS_API_URL_PROD;
      }
    } catch (error) {
      console.error("Error determining API URL:", error);
      return process.env.REACT_APP_FMS_API_URL_PROD;
    }
  }
};

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_FMS_API_URL_DEV,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  async (config) => {
    if (
      !axiosInstance.defaults.baseURL ||
      axiosInstance.defaults.baseURL === process.env.REACT_APP_FMS_API_URL_DEV
    ) {
      axiosInstance.defaults.baseURL = await determineApiUrl();
    }
    config.baseURL = axiosInstance.defaults.baseURL;
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Cursor: Add response interceptor to handle authentication errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 404)
    ) {
      // Check if it's a login redirect
      if (
        error.response.config &&
        error.response.config.url.includes("Login")
      ) {
        console.error("Authentication error - redirecting to login page");
        // Redirect to login or handle auth error
        // window.location.href = '/login'; // Uncomment if you want automatic redirect
      }
    }
    return Promise.reject(error);
  }
);

export const initializeAxiosInstance = async () => {
  axiosInstance.defaults.baseURL = await determineApiUrl();
};

export default axiosInstance;
