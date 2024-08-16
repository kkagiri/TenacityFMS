import axios from "axios";

const determineApiUrl = async () => {
  if (process.env.NODE_ENV === 'development') {
    return 'http://10.0.11.90:7009/api';
  } else {
    try {
      const response = await fetch('http://10.0.11.90:7009/api/health');
      if (response.ok) {
        return 'http://10.0.11.90:7009/api';
      } else {
        return 'http://10.0.11.90:7009/api';
      }
    } catch (error) {
      console.error('Error determining API URL:', error);
      return 'http://10.0.11.90:7009/api';
    }
  }
};

const axiosInstance = axios.create({
  baseURL: 'http://10.0.11.90:7009/api', // Default URL, will be updated
  headers: {
    'Content-Type': 'application/json'
  }
});

axiosInstance.interceptors.request.use(
  async (config) => {
    if (!axiosInstance.baseURL || axiosInstance.baseURL === 'http://10.0.11.90:7009/api') {
      axiosInstance.defaults.baseURL = await determineApiUrl();
    }
    config.baseURL = axiosInstance.defaults.baseURL;

    const token = localStorage.getItem('token');
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