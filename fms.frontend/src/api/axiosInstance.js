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
    "Accept": "application/json",
  },
});

axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, {
      status: response.status,
      statusText: response.statusText
    });
    return response;
  },
  (error) => {
    if (error.message === "Network Error") {
      console.error("Network error - possibly CORS related:", error);
    }

    if (error.response) {
      console.error(`Error response from ${error.config?.url}:`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }

    return Promise.reject(error);
  }
);

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

export const initializeAxiosInstance = async () => {
  axiosInstance.defaults.baseURL = await determineApiUrl();
};

export default axiosInstance;
