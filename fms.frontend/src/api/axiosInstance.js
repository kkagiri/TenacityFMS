import axios from "axios";

//const apiUrl = process.env.REACT_APP_FMS_API_URL;

const getApiUrl = () => {
  // const metaTag = document.head.querySelector('meta[name="x-api-url"]');
  // return metaTag ? metaTag.content : process.env.REACT_APP_FMS_API_URL;

  return process.env.REACT_APP_FMS_API_URL;
};

const axiosInstance = axios.create({
    baseURL: getApiUrl,
    headers: {
      'Content-Type': 'application/json'
    }
});

axiosInstance.interceptors.request.use(
    (config) => {
      config.baseURL = getApiUrl();
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

export default axiosInstance;