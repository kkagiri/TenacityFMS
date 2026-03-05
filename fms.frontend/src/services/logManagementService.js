import axiosInstance from '../api/axiosInstance';

const BASE_URL = 'v1/LogManagement';
const FALLBACK_BASE_URL = 'v1/log-management';

const getWithFallback = async (path) => {
  try {
    const response = await axiosInstance.get(`${BASE_URL}${path}`);
    return response.data;
  } catch (error) {
    if (error?.response?.status === 404) {
      const fallbackResponse = await axiosInstance.get(`${FALLBACK_BASE_URL}${path}`);
      return fallbackResponse.data;
    }
    throw error;
  }
};

const postWithFallback = async (path, data) => {
  try {
    const response = await axiosInstance.post(`${BASE_URL}${path}`, data);
    return response.data;
  } catch (error) {
    if (error?.response?.status === 404) {
      const fallbackResponse = await axiosInstance.post(`${FALLBACK_BASE_URL}${path}`, data);
      return fallbackResponse.data;
    }
    throw error;
  }
};

const putWithFallback = async (path, data) => {
  try {
    const response = await axiosInstance.put(`${BASE_URL}${path}`, data);
    return response.data;
  } catch (error) {
    if (error?.response?.status === 404) {
      const fallbackResponse = await axiosInstance.put(`${FALLBACK_BASE_URL}${path}`, data);
      return fallbackResponse.data;
    }
    throw error;
  }
};

/**
 * Service for managing system logs
 */
const logManagementService = {
  /**
   * Get list of available log categories
   */
  getLogCategories: async () => {
    return getWithFallback('/categories');
  },

  /**
   * Get list of log files for a specific category
   * @param {string} category - Log category (app, errors, audit, slow, startup)
   */
  getLogFiles: async (category) => {
    return getWithFallback(`/files/${category}`);
  },

  /**
   * Download a specific log file
   * @param {string} category - Log category
   * @param {string} fileName - File name
   */
  downloadLogFile: async (category, fileName) => {
    let response;
    try {
      response = await axiosInstance.get(
        `${BASE_URL}/download/${category}/${fileName}`,
        { responseType: 'blob' }
      );
    } catch (error) {
      if (error?.response?.status === 404) {
        response = await axiosInstance.get(
          `${FALLBACK_BASE_URL}/download/${category}/${fileName}`,
          { responseType: 'blob' }
        );
      } else {
        throw error;
      }
    }

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return response.data;
  },

  /**
   * Download all log files for a category as a zip
   * @param {string} category - Log category
   */
  downloadAllLogs: async (category) => {
    let response;
    try {
      response = await axiosInstance.get(
        `${BASE_URL}/download-all/${category}`,
        { responseType: 'blob' }
      );
    } catch (error) {
      if (error?.response?.status === 404) {
        response = await axiosInstance.get(
          `${FALLBACK_BASE_URL}/download-all/${category}`,
          { responseType: 'blob' }
        );
      } else {
        throw error;
      }
    }

    // Extract filename from Content-Disposition header or use default
    const contentDisposition = response.headers['content-disposition'];
    let fileName = `${category}-logs.zip`;

    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (fileNameMatch && fileNameMatch.length === 2) {
        fileName = fileNameMatch[1];
      }
    }

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return response.data;
  },

  /**
   * Get current log retention configuration
   */
  getLogRetention: async () => {
    return getWithFallback('/retention');
  },

  /**
   * Get full cleanup settings (retention, auto-cleanup, schedule hour)
   */
  getCleanupSettings: async () => {
    return getWithFallback('/settings');
  },

  /**
   * Update cleanup settings
   * @param {{retentionDays: number, autoCleanupEnabled: boolean, cleanupHour: number}} settings
   */
  updateCleanupSettings: async (settings) => {
    return putWithFallback('/settings', settings);
  },

  /**
   * Manually trigger log cleanup
   */
  triggerLogCleanup: async () => {
    return postWithFallback('/cleanup');
  },

  /**
   * Get log statistics
   */
  getLogStatistics: async () => {
    return getWithFallback('/statistics');
  }
};

export default logManagementService;
