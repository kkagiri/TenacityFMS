import axios from "axios";
import store from "../store";
import {
  authorizePump,
  stopPump,
  closeTransaction,
} from "../redux/actions/ptsActions/ptspumpActions";

// Create an axios instance with default config
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:7009/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to attach auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const pumpControlService = {
  /**
   * Authorize a pump for fueling
   * @param {string} deviceId - PTS device ID
   * @param {object} params - Authorization parameters
   * @returns {Promise<object>} - Response data
   */
  authorizePump: async (deviceId, params) => {
    try {
      // Dispatch the Redux action which handles the API call
      const result = await store.dispatch(
        authorizePump({
          deviceId,
          ...params,
        })
      );

      return result;
    } catch (error) {
      console.error("Pump authorization error:", error);
      throw error;
    }
  },

  /**
   * Stop a pump that is currently fueling
   * @param {string} deviceId - PTS device ID
   * @param {number} pumpId - Pump ID to stop
   * @returns {Promise<object>} - Response data
   */
  stopPump: async (deviceId, pumpId) => {
    try {
      const result = await store.dispatch(stopPump(deviceId, pumpId));
      return result;
    } catch (error) {
      console.error("Stop pump error:", error);
      throw error;
    }
  },

  /**
   * Close a completed transaction
   * @param {string} deviceId - PTS device ID
   * @param {number} pumpId - Pump ID
   * @param {number} transactionId - Transaction ID to close
   * @returns {Promise<object>} - Response data
   */
  closeTransaction: async (deviceId, pumpId, transactionId) => {
    try {
      const result = await store.dispatch(
        closeTransaction(deviceId, pumpId, transactionId)
      );
      return result;
    } catch (error) {
      console.error("Close transaction error:", error);
      throw error;
    }
  },

  /**
   * Get pump state
   * @param {string} deviceId - PTS device ID
   * @param {number} pumpId - Pump ID
   * @returns {Promise<object>} - Response data with pump state
   */
  getPumpState: async (deviceId, pumpId) => {
    try {
      const response = await axiosInstance.get(
        `/pump/${deviceId}/${pumpId}/state`
      );
      return response.data;
    } catch (error) {
      console.error("Get pump state error:", error);
      throw error;
    }
  },

  /**
   * Validate a tag (RFID or vehicle registration)
   * @param {string} deviceId - PTS device ID
   * @param {string} tag - Tag ID or vehicle registration
   * @returns {Promise<object>} - Response with validation result
   */
  validateTag: async (deviceId, tag) => {
    try {
      const response = await axiosInstance.post(`/tag/validate`, {
        deviceId,
        tag,
      });
      return response.data;
    } catch (error) {
      console.error("Tag validation error:", error);
      throw error;
    }
  },
};

export default pumpControlService;
