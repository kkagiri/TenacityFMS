import axios from "axios";

const proxyApiUrl = 'http://localhost:3000';

const axiosInstanceGPSGate = axios.create({
    baseURL: apiUrl,
    headers: {
      'Content-Type': 'application/json'
    }
});

axiosInstance.interceptors.request.use(
    (config) => {
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

export default axiosInstanceGPSGate;