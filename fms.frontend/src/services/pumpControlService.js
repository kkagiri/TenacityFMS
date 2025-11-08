import axiosInstance from "../api/axiosInstance";
import store from "../store";
import {
  authorizePump,
  stopPump,
  closeTransaction,
} from "../redux/actions/ptsActions/ptspumpActions";

const pumpControlService = {
  /**
   * Authorize a pump for fueling
   * NOTE: This uses Redux action which updates global state
   * Use this when you need the authorization state available globally
   * @param {string} deviceId - PTS device ID
   * @param {object} params - Authorization parameters
   * @returns {Promise<object>} - Response data
   */
  authorizePump: async (deviceId, params) => {
    try {
      // Dispatch the Redux action which handles the API call AND updates state
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
   * NOTE: This uses Redux action for state management
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
   * NOTE: This uses Redux action for state management
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
   * NOTE: This is a direct API call - doesn't need global state
   * Use this for one-time data fetching without state persistence
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
   * NOTE: This is a direct API call - validation is typically one-time
   * @param {string} deviceId - PTS device ID
   * @param {string} tag - Tag ID or vehicle registration
   * @returns {Promise<object>} - Response with validation result
   */
  validateTag: async (deviceId, tag) => {
    try {
      const response = await axiosInstance.post(`/FuelTag/validate`, {
        deviceId,
        tag,
      });
      return response.data;
    } catch (error) {
      console.error("Tag validation error:", error);
      throw error;
    }
  },

  /**
   * Cancel a transaction
   * NOTE: This is a direct API call - cancellation is immediate action
   * Could be converted to Redux action if you need to track cancellation state
   * @param {string} deviceId - PTS device ID
   * @param {number} pumpId - Pump ID
   * @param {number} transactionId - Transaction ID to cancel
   * @param {string} reason - Reason for cancellation
   * @returns {Promise<object>} - Response data
   */
  cancelTransaction: async (deviceId, pumpId, transactionId, reason) => {
    try {
      const response = await axiosInstance.post(
        `/pump/${deviceId}/${pumpId}/cancel`,
        { transactionId, reason }
      );
      return response.data;
    } catch (error) {
      console.error("Cancel transaction error:", error);
      throw error;
    }
  },

  // PURE API METHODS (No Redux) - Use for one-time operations
  /**
   * Direct API calls without Redux state management
   * Use these when you don't need global state persistence
   */
  api: {
    /**
     * Get device connection status - one-time check
     */
    getDeviceStatus: async (deviceId) => {
      try {
        const response = await axiosInstance.get(`/device/${deviceId}/status`);
        return response.data;
      } catch (error) {
        console.error("Get device status error:", error);
        throw error;
      }
    },

    /**
     * Get fuel grades - reference data that doesn't change often
     */
    getFuelGrades: async (deviceId) => {
      try {
        const response = await axiosInstance.get(
          `/device/${deviceId}/fuel-grades`
        );
        return response.data;
      } catch (error) {
        console.error("Get fuel grades error:", error);
        throw error;
      }
    },

    /**
     * Send direct command - immediate operation
     */
    sendDirectCommand: async (deviceId, command) => {
      try {
        const response = await axiosInstance.post(
          `/device/${deviceId}/command`,
          command
        );
        return response.data;
      } catch (error) {
        console.error("Send command error:", error);
        throw error;
      }
    },

    /**
     * Get device configuration for fueling process - Cursor
     * Returns device-specific settings like auto-assign master tag feature
     */
    getDeviceConfig: async (deviceId) => {
      try {
        const response = await axiosInstance.get(`/pump/${deviceId}/config`);
        return response.data;
      } catch (error) {
        console.error("Get device config error:", error);
        throw error;
      }
    },
  },
};

export default pumpControlService;
