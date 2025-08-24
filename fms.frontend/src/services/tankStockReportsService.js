import axiosInstance from '../api/axiosInstance';

/**
 * Service for Tank Stock Reports API operations
 * Handles communication with /api/tankstock/reports endpoints
 */
class TankStockReportsService {
  constructor() {
  // Use relative path so axios baseURL (which includes /api) is preserved
  this.baseUrl = 'tankstockreports';
  }

  /**
   * Get tank volume history grouped by month
   */
  async getVolumeHistoryByMonth(params = {}) {
    try {
      const {
        startDate,
        endDate,
        siteIds = null,
        tankIds = null,
        includeCumulative = false
      } = params;

      const queryParams = new URLSearchParams();
      queryParams.append('startDate', startDate);
      queryParams.append('endDate', endDate);
      if (siteIds?.length) siteIds.forEach(id => queryParams.append('siteIds', id));
      if (tankIds?.length) tankIds.forEach(id => queryParams.append('tankIds', id));
      queryParams.append('includeCumulative', includeCumulative);

      const response = await axiosInstance.get(`${this.baseUrl}/volume-history-summary/by-month?${queryParams}`);

      if (response.status === 200 && response.data) {
        return {
          success: true,
          data: response.data,
          recordCount: response.data.data?.length || 0
        };
      }

      throw new Error(response.data?.message || 'Failed to fetch volume history by month');
    } catch (error) {
      console.error('Error fetching volume history by month:', error);

      return {
        success: false,
        data: null,
        recordCount: 0,
        error: error.message
      };
    }
  }

  /**
   * Get tank volume history grouped by quarter
   */
  async getVolumeHistoryByQuarter(params = {}) {
    try {
      const {
        startDate,
        endDate,
        siteIds = null,
        tankIds = null,
        includeCumulative = false
      } = params;

      const queryParams = new URLSearchParams();
      queryParams.append('startDate', startDate);
      queryParams.append('endDate', endDate);
      if (siteIds?.length) siteIds.forEach(id => queryParams.append('siteIds', id));
      if (tankIds?.length) tankIds.forEach(id => queryParams.append('tankIds', id));
      queryParams.append('includeCumulative', includeCumulative);

      const response = await axiosInstance.get(`${this.baseUrl}/volume-history-summary/by-quarter?${queryParams}`);

      if (response.status === 200 && response.data) {
        return {
          success: true,
          data: response.data,
          recordCount: response.data.data?.length || 0
        };
      }

      throw new Error(response.data?.message || 'Failed to fetch volume history by quarter');
    } catch (error) {
      console.error('Error fetching volume history by quarter:', error);

      return {
        success: false,
        data: null,
        recordCount: 0,
        error: error.message
      };
    }
  }

  /**
   * Get tank volume history grouped by week
   */
  async getVolumeHistoryByWeek(params = {}) {
    try {
      const {
        startDate,
        endDate,
        siteIds = null,
        tankIds = null,
        includeCumulative = false
      } = params;

      const queryParams = new URLSearchParams();
      queryParams.append('startDate', startDate);
      queryParams.append('endDate', endDate);
      if (siteIds?.length) siteIds.forEach(id => queryParams.append('siteIds', id));
      if (tankIds?.length) tankIds.forEach(id => queryParams.append('tankIds', id));
      queryParams.append('includeCumulative', includeCumulative);

      const response = await axiosInstance.get(`${this.baseUrl}/volume-history-summary/by-week?${queryParams}`);

      if (response.status === 200 && response.data) {
        return {
          success: true,
          data: response.data,
          recordCount: response.data.data?.length || 0
        };
      }

      throw new Error(response.data?.message || 'Failed to fetch volume history by week');
    } catch (error) {
      console.error('Error fetching volume history by week:', error);

      return {
        success: false,
        data: null,
        recordCount: 0,
        error: error.message
      };
    }
  }

  /**
   * Get tank volume history with custom date grouping
   */
  async getVolumeHistoryCustomDate(params = {}) {
    try {
      const {
        startDate,
        endDate,
        groupByPeriod = 'Day',
        siteIds = null,
        tankIds = null,
        includeCumulative = false
      } = params;

      const queryParams = new URLSearchParams();
      queryParams.append('startDate', startDate);
      queryParams.append('endDate', endDate);
      queryParams.append('groupByPeriod', groupByPeriod);
      if (siteIds?.length) siteIds.forEach(id => queryParams.append('siteIds', id));
      if (tankIds?.length) tankIds.forEach(id => queryParams.append('tankIds', id));
      queryParams.append('includeCumulative', includeCumulative);

      const response = await axiosInstance.get(`${this.baseUrl}/volume-history-summary/custom?${queryParams}`);

      if (response.status === 200 && response.data) {
        return {
          success: true,
          data: response.data,
          recordCount: response.data.data?.length || 0
        };
      }

      throw new Error(response.data?.message || 'Failed to fetch volume history with custom date grouping');
    } catch (error) {
      console.error('Error fetching volume history with custom date grouping:', error);

      return {
        success: false,
        data: null,
        recordCount: 0,
        error: error.message
      };
    }
  }

  /**
   * Get pivot data for tank volume history reports
   */
  async getPivotData(params = {}) {
    try {
      const {
        startDate,
        endDate,
        groupByPeriod = 'month',
        siteIds = null,
        tankIds = null
      } = params;

      const queryParams = new URLSearchParams();
      queryParams.append('startDate', startDate);
      queryParams.append('endDate', endDate);
      queryParams.append('groupByPeriod', groupByPeriod);
      if (siteIds?.length) siteIds.forEach(id => queryParams.append('siteIds', id));
      if (tankIds?.length) tankIds.forEach(id => queryParams.append('tankIds', id));

      const response = await axiosInstance.get(`${this.baseUrl}/pivot-data?${queryParams}`);

      if (response.status === 200 && response.data) {
        return {
          success: true,
          data: response.data,
          recordCount: response.data.data?.length || 0
        };
      }

      throw new Error(response.data?.message || 'Failed to fetch pivot data');
    } catch (error) {
      console.error('Error fetching pivot data:', error);

      return {
        success: false,
        data: null,
        recordCount: 0,
        error: error.message
      };
    }
  }

  /**
   * Get available volume change reasons
   */
  async getVolumeChangeReasons() {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/volume-change-reasons`);

      if (response.status === 200 && response.data) {
        return {
          success: true,
          data: response.data
        };
      }

      throw new Error(response.data?.message || 'Failed to fetch volume change reasons');
    } catch (error) {
      console.error('Error fetching volume change reasons:', error);

      return {
        success: false,
        data: [],
        error: error.message
      };
    }
  }

  /**
   * Export report
   */
  async exportReport(exportRequest) {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/export`, exportRequest);

      if (response.status === 200) {
        return {
          success: true,
          data: response.data
        };
      }

      throw new Error(response.data?.message || 'Failed to export report');
    } catch (error) {
      console.error('Error exporting report:', error);

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Utility method to format data for pivot grid
   */
  formatPivotData(rawData) {
    if (!rawData?.data) return [];

    return rawData.data.map(item => ({
      siteName: item.siteName,
      tankName: item.tankName,
      timePeriod: item.timePeriod,
      changeReason: item.changeReasonDisplay,
      totalVolume: item.totalVolume,
      cumulativeVolume: item.cumulativeVolume,
      transactionCount: item.transactionCount,
      averageVolume: item.averageVolume,
      periodStart: new Date(item.periodStart),
      periodEnd: new Date(item.periodEnd)
    }));
  }

  /**
   * Get statistics from report data
   */
  getReportStatistics(data) {
    if (!data?.data?.length) {
      return {
        totalRecords: 0,
        totalVolume: 0,
        uniqueSites: 0,
        uniqueTanks: 0,
        dateRange: null
      };
    }

    const records = data.data;
    const totalVolume = records.reduce((sum, r) => sum + (r.totalVolume || 0), 0);
    const uniqueSites = new Set(records.map(r => r.siteName)).size;
    const uniqueTanks = new Set(records.map(r => r.tankName)).size;

    const dates = records.map(r => new Date(r.periodStart)).sort();
    const dateRange = dates.length > 0 ? {
      start: dates[0],
      end: dates[dates.length - 1]
    } : null;

    return {
      totalRecords: records.length,
      totalVolume,
      uniqueSites,
      uniqueTanks,
      dateRange
    };
  }
}

const tankStockReportsService = new TankStockReportsService();
export default tankStockReportsService;


