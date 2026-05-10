import axiosInstance from '../api/axiosInstance';

/**
 * Service for Tank Volume History API operations
 * Specifically for the /api/tankvolumehistory/filtered endpoint
 */
class TankVolumeHistoryService {
  constructor() {
    this.baseUrl = '/tankvolumehistory';
  }

  /**
   * Fetch filtered tank volume history
   * @param {Object} filters - Filter parameters
   * @param {number|null} filters.siteId - Site ID (null for all sites)
   * @param {number|null} filters.tankId - Tank ID (null for all tanks)
   * @param {string|null} filters.startDate - Start date (YYYY-MM-DD format)
   * @param {string|null} filters.endDate - End date (YYYY-MM-DD format)
   * @param {boolean} filters.includeVehicleNames - Include vehicle names in response
   * @param {number} filters.take - Maximum number of records to return
   * @returns {Promise<Object>} API response data
   */
  async fetchFiltered(filters = {}) {
    try {
      const defaultFilters = {
        siteId: null,
        tankId: null,
        startDate: null,
        endDate: null,
        includeVehicleNames: true,
        take: 100
      };

      const queryParams = { ...defaultFilters, ...filters };
      const params = new URLSearchParams();

      // Build query parameters, only add non-null values
      if (queryParams.siteId !== null) params.append('siteId', queryParams.siteId);
      if (queryParams.tankId !== null) params.append('tankId', queryParams.tankId);
      if (queryParams.startDate) params.append('startDate', queryParams.startDate);
      if (queryParams.endDate) params.append('endDate', queryParams.endDate);
      if (queryParams.includeVehicleNames !== undefined) {
        params.append('includeVehicleNames', queryParams.includeVehicleNames);
      }
      if (queryParams.take) params.append('take', queryParams.take);

      const url = `${this.baseUrl}/filtered?${params.toString()}`;
      console.log('🔄 TankVolumeHistoryService: Fetching from', url);

      const response = await axiosInstance.get(url);

      console.log('✅ TankVolumeHistoryService: Response received', {
        recordCount: response.data?.length || 0,
        hasVehicleData: response.data?.some(r => r.vehicleName || r.VehicleName) || false
      });

      return {
        success: true,
        data: response.data || [],
        recordCount: response.data?.length || 0
      };

    } catch (error) {
      console.error('❌ TankVolumeHistoryService: Error fetching filtered data', error);

      return {
        success: false,
        data: [],
        error: error.response?.data?.message || error.message || 'Failed to fetch tank volume history',
        recordCount: 0
      };
    }
  }

  /**
   * Fetch tank volume history for a specific site and date range
   * Example: fetchForSiteAndDateRange(22, '2025-07-31', '2025-07-31', true)
   */
  async fetchForSiteAndDateRange(siteId, startDate, endDate, includeVehicleNames = true) {
    return await this.fetchFiltered({
      siteId: siteId === 'all' ? null : siteId,
      startDate,
      endDate,
      includeVehicleNames,
      take: 200
    });
  }

  /**
   * Fetch tank volume history for a specific tank
   */
  async fetchForTank(tankId, startDate = null, endDate = null, includeVehicleNames = true) {
    return await this.fetchFiltered({
      tankId,
      startDate,
      endDate,
      includeVehicleNames,
      take: 100
    });
  }

  /**
   * Fetch recent vehicle dispensing transactions
   */
  async fetchRecentVehicleTransactions(siteId = null, hours = 24) {
    const endDate = new Date();
    const startDate = new Date(Date.now() - (hours * 60 * 60 * 1000));

    return await this.fetchFiltered({
      siteId: siteId === 'all' ? null : siteId,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      includeVehicleNames: true,
      take: 50
    });
  }

  /**
   * Fetch today's transactions for a site (your specific use case)
   * Example: fetchTodayForSite(22) - matches your URL parameters
   */
  async fetchTodayForSite(siteId) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    console.log(`📊 Fetching today's transactions for site ${siteId} (${today})`);

    return await this.fetchForSiteAndDateRange(siteId, today, today, true);
  }

  /**
   * Process and normalize response data
   */
  normalizeData(rawData) {
    if (!Array.isArray(rawData)) return [];

    return rawData.map((record, index) => ({
      id: record.id || index,
      timestamp: record.timestamp || record.Timestamp,
      tankId: record.tankId || record.TankId,
      tankName: record.tankName || record.TankName,
      newVolume: record.newVolume ?? record.NewVolume ?? 0,
      volumeChange: record.volumeChange ?? record.VolumeChange ?? 0,
      changeReason: record.changeReason ?? record.ChangeReason,
      referenceType: record.referenceType || record.ReferenceType,
      vehicleName: record.vehicleName || record.VehicleName,
      recordedBy: record.recordedBy || record.RecordedBy,
      // Computed fields
      isDispensing: (record.changeReason ?? record.ChangeReason) === 6,
      hasVehicle: !!(record.vehicleName || record.VehicleName),
      formattedTimestamp: new Date(record.timestamp || record.Timestamp).toLocaleString(),
      volumeChangeFormatted: `${(record.volumeChange ?? record.VolumeChange) > 0 ? '+' : ''}${(record.volumeChange ?? record.VolumeChange)?.toFixed(2) || '0.00'} L`
    }));
  }

  /**
   * Get statistics from volume history data
   */
  getStatistics(data) {
    const normalizedData = this.normalizeData(data);

    if (!normalizedData.length) {
      return {
        totalRecords: 0,
        dispensingRecords: 0,
        recordsWithVehicles: 0,
        totalVolumeChange: 0,
        averageVolumeChange: 0,
        dateRange: null
      };
    }

    const dispensingRecords = normalizedData.filter(r => r.isDispensing).length;
    const recordsWithVehicles = normalizedData.filter(r => r.hasVehicle).length;
    const totalVolumeChange = normalizedData.reduce((sum, r) => sum + (r.volumeChange || 0), 0);
    const timestamps = normalizedData.map(r => new Date(r.timestamp)).sort();

    return {
      totalRecords: normalizedData.length,
      dispensingRecords,
      recordsWithVehicles,
      totalVolumeChange,
      averageVolumeChange: totalVolumeChange / normalizedData.length,
      dateRange: timestamps.length > 0 ? {
        start: timestamps[0],
        end: timestamps[timestamps.length - 1]
      } : null
    };
  }
}

const tankVolumeHistoryService = new TankVolumeHistoryService();
export default tankVolumeHistoryService;

