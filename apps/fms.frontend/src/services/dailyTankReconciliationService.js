import axiosInstance from '../api/axiosInstance';

/**
 * Service for Daily Tank Reconciliation API operations
 * Handles communication with /api/v1/DailyTankReconciliation endpoints
 */
class DailyTankReconciliationService {
  constructor() {
    this.baseUrl = 'v1/DailyTankReconciliation';
  }

  /**
   * Get daily reconciliation report with analytics
   * @param {Object} params - Report parameters
   * @param {string} params.startDate - Start date (YYYY-MM-DD)
   * @param {string} params.endDate - End date (YYYY-MM-DD)
   * @param {number} [params.siteId] - Optional site filter
   * @param {number} [params.tankId] - Optional tank filter
   * @param {boolean} [params.discrepanciesOnly=false] - Show only discrepancies
   * @param {number} [params.pageNumber=1] - Page number
   * @param {number} [params.pageSize=50] - Page size
   * @returns {Promise<Object>} Report data with summary and items
   */
  async getReport(params = {}) {
    try {
      const {
        startDate,
        endDate,
        siteId = null,
        tankId = null,
        discrepanciesOnly = false,
        pageNumber = 1,
        pageSize = 50
      } = params;

      const queryParams = new URLSearchParams();
      queryParams.append('startDate', startDate);
      queryParams.append('endDate', endDate);
      if (siteId) queryParams.append('siteId', siteId);
      if (tankId) queryParams.append('tankId', tankId);
      queryParams.append('discrepanciesOnly', discrepanciesOnly);
      queryParams.append('pageNumber', pageNumber);
      queryParams.append('pageSize', pageSize);

      const response = await axiosInstance.get(`${this.baseUrl}/report?${queryParams}`);

      if (response.status === 200 && response.data?.isSuccess) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      }

      throw new Error(response.data?.message || 'Failed to fetch daily reconciliation report');
    } catch (error) {
      console.error('Error fetching daily reconciliation report:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get reconciliation summary for dashboard widgets
   * @param {Object} params - Summary parameters
   * @param {number} [params.days=7] - Number of days to include
   * @param {number} [params.siteId] - Optional site filter
   * @returns {Promise<Object>} Summary statistics
   */
  async getSummary(params = {}) {
    try {
      const {
        days = 7,
        siteId = null
      } = params;

      const queryParams = new URLSearchParams();
      queryParams.append('days', days);
      if (siteId) queryParams.append('siteId', siteId);

      const response = await axiosInstance.get(`${this.baseUrl}/summary?${queryParams}`);

      if (response.status === 200 && response.data?.isSuccess) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      }

      throw new Error(response.data?.message || 'Failed to fetch reconciliation summary');
    } catch (error) {
      console.error('Error fetching reconciliation summary:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get discrepancy alerts
   * @param {Object} params - Alert parameters
   * @param {number} [params.days=3] - Number of days to look back
   * @param {number} [params.siteId] - Optional site filter
   * @returns {Promise<Object>} List of discrepancy alerts
   */
  async getAlerts(params = {}) {
    try {
      const {
        days = 3,
        siteId = null
      } = params;

      const queryParams = new URLSearchParams();
      queryParams.append('days', days);
      if (siteId) queryParams.append('siteId', siteId);

      const response = await axiosInstance.get(`${this.baseUrl}/alerts?${queryParams}`);

      if (response.status === 200 && response.data?.isSuccess) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      }

      throw new Error(response.data?.message || 'Failed to fetch discrepancy alerts');
    } catch (error) {
      console.error('Error fetching discrepancy alerts:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Process daily reconciliation for a date range
   * @param {Object} params - Processing parameters
   * @param {string} params.startDate - Start date (YYYY-MM-DD)
   * @param {string} [params.endDate] - End date (defaults to startDate)
   * @param {number} [params.tankId] - Optional tank filter
   * @param {number} [params.siteId] - Optional site filter
   * @param {boolean} [params.forceReprocess=false] - Force reprocessing existing records
   * @returns {Promise<Object>} Processing result with statistics
   */
  async processReconciliation(params = {}) {
    try {
      const {
        startDate,
        endDate = null,
        tankId = null,
        siteId = null,
        forceReprocess = false
      } = params;

      const requestData = {
        startDate,
        endDate: endDate || startDate,
        tankId,
        siteId,
        forceReprocess
      };

      const response = await axiosInstance.post(`${this.baseUrl}/process`, requestData);

      if (response.status === 200 && response.data?.isSuccess) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      }

      throw new Error(response.data?.message || 'Failed to process daily reconciliation');
    } catch (error) {
      console.error('Error processing daily reconciliation:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Process yesterday's reconciliation (convenience method)
   * @param {Object} params - Processing parameters
   * @param {number} [params.siteId] - Optional site filter
   * @param {number} [params.tankId] - Optional tank filter
   * @returns {Promise<Object>} Processing result
   */
  async processYesterday(params = {}) {
    try {
      const {
        siteId = null,
        tankId = null
      } = params;

      const queryParams = new URLSearchParams();
      if (siteId) queryParams.append('siteId', siteId);
      if (tankId) queryParams.append('tankId', tankId);

      const response = await axiosInstance.post(`${this.baseUrl}/process-yesterday?${queryParams}`);

      if (response.status === 200 && response.data?.isSuccess) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      }

      throw new Error(response.data?.message || 'Failed to process yesterday\'s reconciliation');
    } catch (error) {
      console.error('Error processing yesterday\'s reconciliation:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || error.message
      };
    }
  }
}

export default new DailyTankReconciliationService();
