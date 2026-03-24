/**
 * PTS Device Configuration Service
 *
 * Provides methods for managing PTS device remote server and WebSocket configuration.
 * This includes enabling/disabling UploadStatus, getting device configuration, and
 * setting configuration parameters.
 *
 * API Endpoints:
 * - GET  /api/v1/pts/{deviceId}/config/remote-server
 * - POST /api/v1/pts/{deviceId}/config/remote-server
 * - POST /api/v1/pts/{deviceId}/config/enable-upload-status
 * - POST /api/v1/pts/{deviceId}/config/disable-upload-status
 * - GET  /api/v1/pts/{deviceId}/config/datetime
 * - GET  /api/v1/pts/{deviceId}/config/pumps
 * - GET  /api/v1/pts/{deviceId}/config/diagnostics
 * - GET  /api/v1/pts/{deviceId}/config/probes/{probeNumber}/calibration-chart/*
 * - GET  /api/v1/pts/{deviceId}/config/probes/{probeNumber}/interval-volume-chart/*
 * - GET  /api/v1/pts/{deviceId}/config/probes/{probeNumber}/automatic-calibration-chart/*
 * - POST /api/v1/pts/{deviceId}/config/probes/{probeNumber}/automatic-calibration-chart/generate
 *
 * @version 1.0.0
 */

import axiosInstance from "../api/axiosInstance";

// Note: axiosInstance baseURL already includes /api/ so we only need the path after /api/
const BASE_URL = "v1/pts";

const ptsConfigService = {
  /**
   * Get the remote server configuration from a PTS device
   * This includes HTTP upload settings, WebSocket settings, and server connection details
   *
   * @param {string} deviceId - The PTS device ID
   * @returns {Promise<{isSuccess: boolean, data: object, message: string}>}
   */
  getRemoteServerConfiguration: async (deviceId) => {
    try {
      const response = await axiosInstance.get(
        `${BASE_URL}/${deviceId}/config/remote-server`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting remote server configuration:", error);
      throw error;
    }
  },

  /**
   * Set the remote server configuration on a PTS device
   * Only properties that are provided (non-null) will be updated
   *
   * @param {string} deviceId - The PTS device ID
   * @param {object} config - Configuration object with properties to update
   * @param {boolean} [config.websocketsUploadStatus] - Enable/disable WebSocket status uploads
   * @param {number} [config.websocketsUploadStatusRequestsPeriodSeconds] - Period for status uploads
   * @param {boolean} [config.websocketsUploadPumpTransactions] - Enable/disable pump transaction uploads
   * @param {boolean} [config.websocketsUploadTankMeasurements] - Enable/disable tank measurement uploads
   * @param {boolean} [config.useWebsocketsCommunication] - Enable/disable WebSocket communication
   * @returns {Promise<{isSuccess: boolean, data: boolean, message: string}>}
   */
  setRemoteServerConfiguration: async (deviceId, config) => {
    try {
      const response = await axiosInstance.post(
        `${BASE_URL}/${deviceId}/config/remote-server`,
        config
      );
      return response.data;
    } catch (error) {
      console.error("Error setting remote server configuration:", error);
      throw error;
    }
  },

  /**
   * Enable WebSocket UploadStatus on a PTS device
   * This configures the device to send periodic status updates via WebSocket
   *
   * @param {string} deviceId - The PTS device ID
   * @param {number} [periodSeconds=10] - Period in seconds for status updates
   * @returns {Promise<{isSuccess: boolean, data: boolean, message: string}>}
   */
  enableUploadStatus: async (deviceId, periodSeconds = 10) => {
    try {
      const response = await axiosInstance.post(
        `${BASE_URL}/${deviceId}/config/enable-upload-status`,
        null,
        { params: { periodSeconds } }
      );
      return response.data;
    } catch (error) {
      console.error("Error enabling upload status:", error);
      throw error;
    }
  },

  /**
   * Disable WebSocket UploadStatus on a PTS device
   *
   * @param {string} deviceId - The PTS device ID
   * @returns {Promise<{isSuccess: boolean, data: boolean, message: string}>}
   */
  disableUploadStatus: async (deviceId) => {
    try {
      const response = await axiosInstance.post(
        `${BASE_URL}/${deviceId}/config/disable-upload-status`
      );
      return response.data;
    } catch (error) {
      console.error("Error disabling upload status:", error);
      throw error;
    }
  },

  /**
   * Get the date/time from a PTS device
   *
   * @param {string} deviceId - The PTS device ID
   * @returns {Promise<{isSuccess: boolean, data: object, message: string}>}
   */
  getDateTime: async (deviceId) => {
    try {
      const response = await axiosInstance.get(
        `${BASE_URL}/${deviceId}/config/datetime`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting device datetime:", error);
      throw error;
    }
  },

  /**
   * Get the pumps configuration from a PTS device
   *
   * @param {string} deviceId - The PTS device ID
   * @returns {Promise<{isSuccess: boolean, data: object, message: string}>}
   */
  getPumpsConfiguration: async (deviceId) => {
    try {
      const response = await axiosInstance.get(
        `${BASE_URL}/${deviceId}/config/pumps`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting pumps configuration:", error);
      throw error;
    }
  },

  /**
   * Get the probes configuration from a PTS device
   * Based on protocol 52. GetProbesConfiguration
   *
   * @param {string} deviceId - The PTS device ID
   * @returns {Promise<{isSuccess: boolean, data: {ports: Array, probes: Array}, message: string}>}
   */
  getProbesConfiguration: async (deviceId) => {
    try {
      const response = await axiosInstance.get(
        `${BASE_URL}/${deviceId}/config/probes`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting probes configuration:", error);
      throw error;
    }
  },

  /**
   * Get the tanks configuration from a PTS device.
   * Based on protocol 69. GetTanksConfiguration.
   *
   * @param {string} deviceId - The PTS device ID
   * @returns {Promise<{isSuccess: boolean, data: {tanks: Array}, message: string}>}
   */
  getTanksConfiguration: async (deviceId) => {
    try {
      const response = await axiosInstance.get(
        `${BASE_URL}/${deviceId}/config/tanks`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting tanks configuration:", error);
      throw error;
    }
  },

  /**
   * Get comprehensive diagnostics from a PTS device
   *
   * @param {string} deviceId - The PTS device ID
   * @returns {Promise<{isSuccess: boolean, data: object, message: string}>}
   */
  getDiagnostics: async (deviceId) => {
    try {
      const response = await axiosInstance.get(
        `${BASE_URL}/${deviceId}/config/diagnostics`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting device diagnostics:", error);
      throw error;
    }
  },

  /**
   * Batch enable UploadStatus on multiple devices
   *
   * @param {string[]} deviceIds - Array of PTS device IDs
   * @param {number} [periodSeconds=10] - Period in seconds for status updates
   * @returns {Promise<{success: string[], failed: Array<{deviceId: string, error: string}>}>}
   */
  batchEnableUploadStatus: async (deviceIds, periodSeconds = 10) => {
    const results = {
      success: [],
      failed: [],
    };

    for (const deviceId of deviceIds) {
      try {
        await ptsConfigService.enableUploadStatus(deviceId, periodSeconds);
        results.success.push(deviceId);
      } catch (error) {
        results.failed.push({
          deviceId,
          error: error.response?.data?.message || error.message,
        });
      }
    }

    return results;
  },

  /**
   * Get WebSocket configuration summary for a device
   * Convenience method that extracts WebSocket-specific settings
   *
   * @param {string} deviceId - The PTS device ID
   * @returns {Promise<object>} WebSocket configuration summary
   */
  getWebSocketConfigSummary: async (deviceId) => {
    try {
      const result = await ptsConfigService.getRemoteServerConfiguration(deviceId);

      if (!result.isSuccess) {
        throw new Error(result.message || "Failed to get configuration");
      }

      const config = result.data;
      return {
        useWebsocketsCommunication: config.useWebsocketsCommunication,
        isWebsocketsCommunicationSuccessful: config.isWebsocketsCommunicationSuccessful,
        websocketsUri: config.websocketsUri,
        websocketsPort: config.websocketsPort,
        uploads: {
          status: {
            enabled: config.websocketsUploadStatus,
            periodSeconds: config.websocketsUploadStatusRequestsPeriodSeconds,
          },
          pumpTransactions: config.websocketsUploadPumpTransactions,
          tankMeasurements: config.websocketsUploadTankMeasurements,
          inTankDeliveries: config.websocketsUploadInTankDeliveries,
          gpsRecords: config.websocketsUploadGpsRecords,
          alertRecords: config.websocketsUploadAlertRecords,
          configuration: config.websocketsUploadConfiguration,
        },
        requestTagsInformation: config.websocketsRequestTagsInformation,
      };
    } catch (error) {
      console.error("Error getting WebSocket config summary:", error);
      throw error;
    }
  },

  /**
   * Configure all WebSocket upload settings at once
   *
   * @param {string} deviceId - The PTS device ID
   * @param {object} settings - WebSocket upload settings
   * @param {boolean} [settings.uploadStatus] - Enable status uploads
   * @param {number} [settings.statusPeriodSeconds] - Status upload period
   * @param {boolean} [settings.uploadPumpTransactions] - Enable pump transaction uploads
   * @param {boolean} [settings.uploadTankMeasurements] - Enable tank measurement uploads
   * @param {boolean} [settings.uploadInTankDeliveries] - Enable in-tank delivery uploads
   * @param {boolean} [settings.uploadGpsRecords] - Enable GPS record uploads
   * @param {boolean} [settings.uploadAlertRecords] - Enable alert record uploads
   * @param {boolean} [settings.uploadConfiguration] - Enable configuration uploads
   * @returns {Promise<{isSuccess: boolean, data: boolean, message: string}>}
   */
  configureWebSocketUploads: async (deviceId, settings) => {
    const config = {};

    if (settings.uploadStatus !== undefined) {
      config.websocketsUploadStatus = settings.uploadStatus;
    }
    if (settings.statusPeriodSeconds !== undefined) {
      config.websocketsUploadStatusRequestsPeriodSeconds = settings.statusPeriodSeconds;
    }
    if (settings.uploadPumpTransactions !== undefined) {
      config.websocketsUploadPumpTransactions = settings.uploadPumpTransactions;
    }
    if (settings.uploadTankMeasurements !== undefined) {
      config.websocketsUploadTankMeasurements = settings.uploadTankMeasurements;
    }
    if (settings.uploadInTankDeliveries !== undefined) {
      config.websocketsUploadInTankDeliveries = settings.uploadInTankDeliveries;
    }
    if (settings.uploadGpsRecords !== undefined) {
      config.websocketsUploadGpsRecords = settings.uploadGpsRecords;
    }
    if (settings.uploadAlertRecords !== undefined) {
      config.websocketsUploadAlertRecords = settings.uploadAlertRecords;
    }
    if (settings.uploadConfiguration !== undefined) {
      config.websocketsUploadConfiguration = settings.uploadConfiguration;
    }

    return ptsConfigService.setRemoteServerConfiguration(deviceId, config);
  },

  /**
   * Set the pumps configuration on a PTS device (ports and pump assignments)
   * Based on protocol 49. SetPumpsConfiguration
   *
   * @param {string} deviceId - The PTS device ID
   * @param {object} config - Pumps configuration
   * @param {Array} [config.ports] - Array of port configurations {id, protocol, baudRate}
   * @param {Array} [config.pumps] - Array of pump configurations {id, port, address}
   * @returns {Promise<{isSuccess: boolean, data: boolean, message: string}>}
   */
  setPumpsConfiguration: async (deviceId, config) => {
    try {
      const response = await axiosInstance.post(
        `${BASE_URL}/${deviceId}/config/pumps`,
        config
      );
      return response.data;
    } catch (error) {
      console.error("Error setting pumps configuration:", error);
      throw error;
    }
  },

  /**
   * Get the pump nozzles configuration from a PTS device
   * Based on protocol 66. GetPumpNozzlesConfiguration
   *
   * @param {string} deviceId - The PTS device ID
   * @returns {Promise<{isSuccess: boolean, data: object, message: string}>}
   */
  getPumpNozzlesConfiguration: async (deviceId) => {
    try {
      const response = await axiosInstance.get(
        `${BASE_URL}/${deviceId}/config/pump-nozzles`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting pump nozzles configuration:", error);
      throw error;
    }
  },

  /**
   * Set the pump nozzles configuration on a PTS device
   * Based on protocol 67. SetPumpNozzlesConfiguration
   *
   * @param {string} deviceId - The PTS device ID
   * @param {object} config - Pump nozzles configuration
   * @param {Array} config.pumpNozzles - Array of pump nozzle configs {pumpId, fuelGradeIds, tankIds, paymentFormIds}
   * @returns {Promise<{isSuccess: boolean, data: boolean, message: string}>}
   */
  setPumpNozzlesConfiguration: async (deviceId, config) => {
    try {
      const response = await axiosInstance.post(
        `${BASE_URL}/${deviceId}/config/pump-nozzles`,
        config
      );
      return response.data;
    } catch (error) {
      console.error("Error setting pump nozzles configuration:", error);
      throw error;
    }
  },

  getTankCalibrationChartTotalRecords: async (deviceId, probeNumber) => {
    try {
      const response = await axiosInstance.get(
        `${BASE_URL}/${deviceId}/config/probes/${probeNumber}/calibration-chart/total-records`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting tank calibration chart total records:", error);
      throw error;
    }
  },

  getTankCalibrationChartRecords: async (
    deviceId,
    probeNumber,
    startNumber,
    totalNumber
  ) => {
    try {
      const response = await axiosInstance.get(
        `${BASE_URL}/${deviceId}/config/probes/${probeNumber}/calibration-chart/records`,
        { params: { startNumber, totalNumber } }
      );
      return response.data;
    } catch (error) {
      console.error("Error getting tank calibration chart records:", error);
      throw error;
    }
  },

  getTankIntervalVolumeChartTotalRecords: async (deviceId, probeNumber) => {
    try {
      const response = await axiosInstance.get(
        `${BASE_URL}/${deviceId}/config/probes/${probeNumber}/interval-volume-chart/total-records`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting tank interval volume chart total records:", error);
      throw error;
    }
  },

  getTankIntervalVolumeChartRecords: async (
    deviceId,
    probeNumber,
    startNumber,
    totalNumber
  ) => {
    try {
      const response = await axiosInstance.get(
        `${BASE_URL}/${deviceId}/config/probes/${probeNumber}/interval-volume-chart/records`,
        { params: { startNumber, totalNumber } }
      );
      return response.data;
    } catch (error) {
      console.error("Error getting tank interval volume chart records:", error);
      throw error;
    }
  },

  getTankAutomaticCalibrationChartTotalRecords: async (deviceId, probeNumber) => {
    try {
      const response = await axiosInstance.get(
        `${BASE_URL}/${deviceId}/config/probes/${probeNumber}/automatic-calibration-chart/total-records`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting tank automatic calibration chart total records:", error);
      throw error;
    }
  },

  getTankAutomaticCalibrationChartRecords: async (
    deviceId,
    probeNumber,
    startNumber,
    totalNumber
  ) => {
    try {
      const response = await axiosInstance.get(
        `${BASE_URL}/${deviceId}/config/probes/${probeNumber}/automatic-calibration-chart/records`,
        { params: { startNumber, totalNumber } }
      );
      return response.data;
    } catch (error) {
      console.error("Error getting tank automatic calibration chart records:", error);
      throw error;
    }
  },

  getTankVolumeForHeight: async (deviceId, probeNumber, height) => {
    try {
      const response = await axiosInstance.get(
        `${BASE_URL}/${deviceId}/config/probes/${probeNumber}/volume-for-height/${height}`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting tank volume for height:", error);
      throw error;
    }
  },

  generateTankAutomaticCalibrationChart: async (deviceId, probeNumber) => {
    try {
      const response = await axiosInstance.post(
        `${BASE_URL}/${deviceId}/config/probes/${probeNumber}/automatic-calibration-chart/generate`
      );
      return response.data;
    } catch (error) {
      console.error("Error generating tank automatic calibration chart:", error);
      throw error;
    }
  },

  getTankCalibrationCurrentSnapshot: async (tankId, chartType) => {
    try {
      const response = await axiosInstance.get(
        `v1/tanks/${tankId}/calibration/current`,
        { params: { chartType } }
      );
      return response.data;
    } catch (error) {
      console.error("Error getting tank calibration current snapshot:", error);
      throw error;
    }
  },

  getTankCalibrationHistory: async (tankId, chartType, pageNumber = 1, pageSize = 20) => {
    try {
      const response = await axiosInstance.get(
        `v1/tanks/${tankId}/calibration/history`,
        { params: { chartType, pageNumber, pageSize } }
      );
      return response.data;
    } catch (error) {
      console.error("Error getting tank calibration history:", error);
      throw error;
    }
  },

  getTankCalibrationSnapshotById: async (tankId, snapshotId) => {
    try {
      const response = await axiosInstance.get(
        `v1/tanks/${tankId}/calibration/history/${snapshotId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting tank calibration snapshot by id:", error);
      throw error;
    }
  },

  syncTankCalibrationSnapshot: async (tankId, payload) => {
    try {
      const response = await axiosInstance.post(
        `v1/tanks/${tankId}/calibration/sync`,
        payload,
        { timeout: 120000 }
      );
      return response.data;
    } catch (error) {
      console.error("Error syncing tank calibration snapshot:", error);
      throw error;
    }
  },

  generateTankCalibrationAutomaticChart: async (tankId) => {
    try {
      const response = await axiosInstance.post(
        `v1/tanks/${tankId}/calibration/generate-automatic`,
        null,
        { timeout: 120000 }
      );
      return response.data;
    } catch (error) {
      console.error("Error generating automatic tank calibration chart:", error);
      throw error;
    }
  },

  setTankManualCalibrationChart: async (tankId, records) => {
    try {
      const response = await axiosInstance.post(
        `v1/tanks/${tankId}/calibration/manual/set`,
        { records },
        { timeout: 120000 }
      );
      return response.data;
    } catch (error) {
      console.error("Error setting manual tank calibration chart:", error);
      throw error;
    }
  },

  addTankManualCalibrationRecord: async (tankId, record) => {
    try {
      const response = await axiosInstance.post(
        `v1/tanks/${tankId}/calibration/manual/record`,
        record,
        { timeout: 60000 }
      );
      return response.data;
    } catch (error) {
      console.error("Error adding manual tank calibration record:", error);
      throw error;
    }
  },

  editTankManualCalibrationRecord: async (tankId, record) => {
    try {
      const response = await axiosInstance.put(
        `v1/tanks/${tankId}/calibration/manual/record`,
        record,
        { timeout: 60000 }
      );
      return response.data;
    } catch (error) {
      console.error("Error editing manual tank calibration record:", error);
      throw error;
    }
  },

  deleteTankManualCalibrationRecord: async (tankId, height) => {
    try {
      const response = await axiosInstance.delete(
        `v1/tanks/${tankId}/calibration/manual/record/${height}`,
        { timeout: 60000 }
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting manual tank calibration record:", error);
      throw error;
    }
  },

  getTankCalibrationHealth: async (tankId) => {
    try {
      const response = await axiosInstance.get(
        `v1/tanks/${tankId}/calibration/health`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching tank calibration health:", error);
      throw error;
    }
  },

  getTankCalibrationVariances: async (tankId, maxDeliveries = 20) => {
    try {
      const response = await axiosInstance.get(
        `v1/tanks/${tankId}/calibration/variances`,
        { params: { maxDeliveries } }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching tank calibration variances:", error);
      throw error;
    }
  },

  extractCalibrationLearningData: async (tankId, payload) => {
    try {
      const response = await axiosInstance.post(
        `v1/tanks/${tankId}/calibration/learning/extract`,
        payload,
        { timeout: 120000 }
      );
      return response.data;
    } catch (error) {
      console.error("Error extracting calibration learning data:", error);
      throw error;
    }
  },

  getCalibrationLearningCoverage: async (tankId) => {
    try {
      const response = await axiosInstance.get(
        `v1/tanks/${tankId}/calibration/learning/coverage`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching calibration learning coverage:", error);
      throw error;
    }
  },

  generateLearnedCalibrationChart: async (tankId) => {
    try {
      const response = await axiosInstance.post(
        `v1/tanks/${tankId}/calibration/learning/generate`,
        null,
        { timeout: 120000 }
      );
      return response.data;
    } catch (error) {
      console.error("Error generating learned calibration chart:", error);
      throw error;
    }
  },

  seedCalibrationLearning: async (tankId, snapshotId) => {
    try {
      const response = await axiosInstance.post(
        `v1/tanks/${tankId}/calibration/learning/seed/${snapshotId}`,
        null,
        { timeout: 120000 }
      );
      return response.data;
    } catch (error) {
      console.error("Error seeding calibration learning:", error);
      throw error;
    }
  },

  compareCalibrationLearningCharts: async (tankId, params = {}) => {
    try {
      const response = await axiosInstance.get(
        `v1/tanks/${tankId}/calibration/learning/compare`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error("Error comparing calibration learning charts:", error);
      throw error;
    }
  },
};

export default ptsConfigService;
