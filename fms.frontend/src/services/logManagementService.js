import axiosInstance from '../api/axiosInstance';

const BASE_URL = '/api/v1/LogManagement';

/**
 * Service for managing system logs
 */
const logManagementService = {
  /**
   * Get list of available log categories
   */
  getLogCategories: async () => {
    const response = await axiosInstance.get(`${BASE_URL}/categories`);
    return response.data;
  },

  /**
   * Get list of log files for a specific category
   * @param {string} category - Log category (app, errors, audit, slow, startup)
   */
  getLogFiles: async (category) => {
    const response = await axiosInstance.get(`${BASE_URL}/files/${category}`);
    return response.data;
  },

  /**
   * Download a specific log file
   * @param {string} category - Log category
   * @param {string} fileName - File name
   */
  downloadLogFile: async (category, fileName) => {
    const response = await axiosInstance.get(
      `${BASE_URL}/download/${category}/${fileName}`,
      { responseType: 'blob' }
    );

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
    const response = await axiosInstance.get(
      `${BASE_URL}/download-all/${category}`,
      { responseType: 'blob' }
    );

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
    const response = await axiosInstance.get(`${BASE_URL}/retention`);
    return response.data;
  },

  /**
   * Manually trigger log cleanup
   */
  triggerLogCleanup: async () => {
    const response = await axiosInstance.post(`${BASE_URL}/cleanup`);
    return response.data;
  },

  /**
   * Get log statistics
   */
  getLogStatistics: async () => {
    const response = await axiosInstance.get(`${BASE_URL}/statistics`);
    return response.data;
  }
};

export default logManagementService;
