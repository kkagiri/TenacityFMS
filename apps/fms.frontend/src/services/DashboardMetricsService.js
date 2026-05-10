// Dashboard Metrics API Service
// MIGRATED TO USE DataSourceController (Phase 2)
// Handles all API calls for dashboard widget data via unified data source endpoints

import axiosInstance from '../api/axiosInstance';

class DashboardMetricsService {
  constructor(baseUrl = 'dashboard/data-sources') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get dashboard metric data using DataSourceController
   * @param {Object} request - Metric request parameters
   * @param {string} request.metricType - Type of metric (fuel_dispense, fuel_used_gps, engine_hours, km_travel)
   * @param {string} request.mode - Data mode (live, cumulative)
   * @param {string} request.datePreset - Date preset (today, yesterday, last_week, last_month, etc.)
   * @param {Array<number>} request.siteIds - Optional array of site IDs
   * @param {Array<number>} request.vehicleIds - Optional array of vehicle IDs
   * @param {Date} request.startDate - Optional custom start date
   * @param {Date} request.endDate - Optional custom end date
   * @param {AbortController} abortController - Optional abort controller for cancellation
   * @returns {Promise<Object>} Dashboard metric response
   */
  async getMetric(request, abortController = null) {
    try {
      // Convert legacy metric request to DataSource format
      const dataSourceParams = {
        sourceId: `${request.metricType}-metrics`, // e.g., "fuel_dispense-metrics"
        mode: request.mode,
        datePreset: request.datePreset,
        siteIds: request.siteIds,
        vehicleIds: request.vehicleIds,
        startDate: request.startDate,
        endDate: request.endDate
      };

      const response = await axiosInstance.get(`${this.baseUrl}/initial-data`, {
        params: dataSourceParams,
        signal: abortController?.signal
      });

      // Convert DataSource response to legacy format for backward compatibility
      return this._convertToLegacyFormat(response.data, request.metricType);
    } catch (error) {
      console.error('Error getting dashboard metric:', error);
      if (error.response?.data?.errorMessage) {
        throw new Error(error.response.data.errorMessage);
      }
      throw error;
    }
  }

  /**
   * Convert DataSource response to legacy DashboardMetrics format
   * @private
   */
  _convertToLegacyFormat(dataSourceResponse, metricType) {
    if (!dataSourceResponse) return null;

    // If it's already in the expected format, return as-is
    if (dataSourceResponse.metricType || dataSourceResponse.value !== undefined) {
      return dataSourceResponse;
    }

    // Convert DataSource format to legacy format
    return {
      value: dataSourceResponse.data?.value || dataSourceResponse.value || 0,
      unit: dataSourceResponse.data?.unit || dataSourceResponse.unit || '',
      lastUpdated: dataSourceResponse.timestamp || dataSourceResponse.lastUpdated || new Date().toISOString(),
      metricType: metricType,
      mode: dataSourceResponse.mode || 'live',
      dateRange: dataSourceResponse.dateRange || 'Live Data',
      affectedSitesCount: dataSourceResponse.affectedSitesCount || null,
      affectedVehiclesCount: dataSourceResponse.affectedVehiclesCount || null,
      isLiveData: dataSourceResponse.isLiveData || false,
      errorMessage: dataSourceResponse.errorMessage || null
    };
  }

  /**
   * Get fuel dispensed metric using DataSourceController
   * @param {string} mode - Data mode (live, cumulative)
   * @param {string} datePreset - Date preset
   * @param {Array<number>} siteIds - Optional site IDs
   * @param {AbortController} abortController - Optional abort controller for cancellation
   * @returns {Promise<Object>} Fuel dispensed metric
   */
  async getFuelDispensed(mode = 'cumulative', datePreset = 'yesterday', siteIds = null, abortController = null) {
    try {
      const params = {
        sourceId: 'fuel-dispense-metrics',
        mode,
        datePreset
      };

      if (siteIds && siteIds.length > 0) {
        params.siteIds = siteIds.join(',');
      }

      const response = await axiosInstance.get(`${this.baseUrl}/initial-data`, {
        params,
        signal: abortController?.signal
      });

      return this._convertToLegacyFormat(response.data, 'fuel_dispense');
    } catch (error) {
      console.error('Error getting fuel dispensed metric:', error);
      if (error.response?.data?.errorMessage) {
        throw new Error(error.response.data.errorMessage);
      }
      throw error;
    }
  }

  /**
   * Get fuel used GPS metric
   * @param {string} mode - Data mode (live, cumulative)
   * @param {string} datePreset - Date preset
   * @param {Array<number>} siteIds - Optional site IDs
   * @param {AbortController} abortController - Optional abort controller for cancellation
   * @returns {Promise<Object>} Fuel used GPS metric
   */
  async getFuelUsedGps(mode = 'cumulative', datePreset = 'yesterday', siteIds = null, abortController = null) {
    try {
      const params = {
        sourceId: 'fuel-used-gps-metrics',
        mode,
        datePreset
      };

      if (siteIds && siteIds.length > 0) {
        params.siteIds = siteIds.join(',');
      }

      const response = await axiosInstance.get(`${this.baseUrl}/initial-data`, {
        params,
        signal: abortController?.signal
      });

      return this._convertToLegacyFormat(response.data, 'fuel_used_gps');
    } catch (error) {
      console.error('Error getting fuel used GPS metric:', error);
      if (error.response?.data?.errorMessage) {
        throw new Error(error.response.data.errorMessage);
      }
      throw error;
    }
  }

  /**
   * Get engine hours metric
   * @param {string} mode - Data mode (live, cumulative)
   * @param {string} datePreset - Date preset
   * @param {Array<number>} siteIds - Optional site IDs
   * @param {AbortController} abortController - Optional abort controller for cancellation
   * @returns {Promise<Object>} Engine hours metric
   */
  async getEngineHours(mode = 'cumulative', datePreset = 'yesterday', siteIds = null, abortController = null) {
    try {
      const params = {
        sourceId: 'engine-hours-metrics',
        mode,
        datePreset
      };

      if (siteIds && siteIds.length > 0) {
        params.siteIds = siteIds.join(',');
      }

      const response = await axiosInstance.get(`${this.baseUrl}/initial-data`, {
        params,
        signal: abortController?.signal
      });

      return this._convertToLegacyFormat(response.data, 'engine_hours');
    } catch (error) {
      console.error('Error getting engine hours metric:', error);
      if (error.response?.data?.errorMessage) {
        throw new Error(error.response.data.errorMessage);
      }
      throw error;
    }
  }

  /**
   * Get distance travelled metric
   * @param {string} mode - Data mode (live, cumulative)
   * @param {string} datePreset - Date preset
   * @param {Array<number>} siteIds - Optional site IDs
   * @param {AbortController} abortController - Optional abort controller for cancellation
   * @returns {Promise<Object>} Distance travelled metric
   */
  async getDistanceTravelled(mode = 'cumulative', datePreset = 'yesterday', siteIds = null, abortController = null) {
    try {
      const params = {
        sourceId: 'distance-travelled-metrics',
        mode,
        datePreset
      };

      if (siteIds && siteIds.length > 0) {
        params.siteIds = siteIds.join(',');
      }

      const response = await axiosInstance.get(`${this.baseUrl}/initial-data`, {
        params,
        signal: abortController?.signal
      });

      return this._convertToLegacyFormat(response.data, 'km_travel');
    } catch (error) {
      console.error('Error getting distance travelled metric:', error);
      if (error.response?.data?.errorMessage) {
        throw new Error(error.response.data.errorMessage);
      }
      throw error;
    }
  }

  /**
   * Health check for the dashboard metrics API
   * @returns {Promise<Object>} Health check response
   */
  async healthCheck() {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/health`);
      return response.data;
    } catch (error) {
      console.error('Error checking dashboard metrics API health:', error);
      if (error.response?.data?.errorMessage) {
        throw new Error(error.response.data.errorMessage);
      }
      throw error;
    }
  }

    /**
   * Get enhanced widget data using new endpoints
   * @param {number} widgetInstanceId - Widget instance ID
   * @param {AbortController} abortController - Optional abort controller for cancellation
   * @returns {Promise<Object>} Enhanced widget data response
   */
  async getEnhancedWidgetData(widgetInstanceId, abortController = null) {
    try {
      const response = await axiosInstance.get(`dashboard/widgets/${widgetInstanceId}/enhanced-data`, {
        signal: abortController?.signal
      });

      return response.data;
    } catch (error) {
      console.error('Error getting enhanced widget data:', error);
      if (error.response?.data?.errorMessage) {
        throw new Error(error.response.data.errorMessage);
      }
      throw error;
    }
  }

  /**
   * Get widgets by type with enhanced filtering
   * @param {string} widgetType - Widget type
   * @param {Object} request - Enhanced widget data request
   * @param {AbortController} abortController - Optional abort controller for cancellation
   * @returns {Promise<Object>} Enhanced widget data response
   */
  async getWidgetDataByType(widgetType, request, abortController = null) {
    try {
      const response = await axiosInstance.post(`dashboard/widgets/by-type/${widgetType}`, request, {
        signal: abortController?.signal
      });

      return response.data;
    } catch (error) {
      console.error('Error getting widget data by type:', error);
      if (error.response?.data?.errorMessage) {
        throw new Error(error.response.data.errorMessage);
      }
      throw error;
    }
  }

  /**
   * Get category widgets data
   * @param {string} category - Widget category
   * @param {AbortController} abortController - Optional abort controller for cancellation
   * @returns {Promise<Object>} Category widgets data response
   */
  async getCategoryWidgetsData(category, abortController = null) {
    try {
      const response = await axiosInstance.get(`dashboard/widgets/category/${category}`, {
        signal: abortController?.signal
      });

      return response.data;
    } catch (error) {
      console.error('Error getting category widgets data:', error);
      if (error.response?.data?.errorMessage) {
        throw new Error(error.response.data.errorMessage);
      }
      throw error;
    }
  }

  /**
   * Get widget preview data for testing
   * @param {Object} previewRequest - Widget preview request
   * @param {AbortController} abortController - Optional abort controller for cancellation
   * @returns {Promise<Object>} Widget preview data response
   */
  async getWidgetPreviewData(previewRequest, abortController = null) {
    try {
      const response = await axiosInstance.post('dashboard/widgets/preview', previewRequest, {
        signal: abortController?.signal
      });

      return response.data;
    } catch (error) {
      console.error('Error getting widget preview data:', error);
      if (error.response?.data?.errorMessage) {
        throw new Error(error.response.data.errorMessage);
      }
      throw error;
    }
  }

  /**
   * Get metric data for a specific widget configuration (Legacy support)
   * @param {Object} widget - Widget configuration
   * @param {AbortController} abortController - Optional abort controller for cancellation
   * @returns {Promise<Object>} Dashboard metric response
   */
  async getWidgetData(widget, abortController = null) {
    // If widget has instanceId, use enhanced endpoint
    if (widget.instanceId) {
      return this.getEnhancedWidgetData(widget.instanceId, abortController);
    }

    const request = this.widgetToApiRequest(widget);

    try {
      let rawResponse;

      // Use specific endpoint based on metric type for better performance
      switch (request.metricType) {
        case 'fuel_dispense':
        case 'fuel_dispensed':
          rawResponse = await this.getFuelDispensed(request.mode, request.datePreset, request.siteIds, abortController);
          break;
        case 'fuel_used_gps':
          rawResponse = await this.getFuelUsedGps(request.mode, request.datePreset, request.siteIds, abortController);
          break;
        case 'fuel_lost_gps':
          rawResponse = await this.getGenericMetric('fuel_lost_gps', request, abortController);
          break;
        case 'flowmeter_fuel_used':
          rawResponse = await this.getGenericMetric('flowmeter_fuel_used', request, abortController);
          break;
        case 'flowmeter_fuel_lost':
          rawResponse = await this.getGenericMetric('flowmeter_fuel_lost', request, abortController);
          break;
        case 'engine_hours':
          rawResponse = await this.getEngineHours(request.mode, request.datePreset, request.siteIds, abortController);
          break;
        case 'engine_hours_gps':
          rawResponse = await this.getGenericMetric('engine_hours_gps', request, abortController);
          break;
        case 'km_travel':
          rawResponse = await this.getDistanceTravelled(request.mode, request.datePreset, request.siteIds, abortController);
          break;
        case 'distance_travel':
          rawResponse = await this.getGenericMetric('distance_travel', request, abortController);
          break;
        case 'fuel_efficiency':
          rawResponse = await this.getGenericMetric('fuel_efficiency', request, abortController);
          break;
        case 'flowmeter_efficiency':
          rawResponse = await this.getGenericMetric('flowmeter_efficiency', request, abortController);
          break;
        case 'max_speed':
          rawResponse = await this.getGenericMetric('max_speed', request, abortController);
          break;
        case 'avg_speed':
        case 'average_speed':
          rawResponse = await this.getGenericMetric('avg_speed', request, abortController);
          break;
        default:
          rawResponse = await this.getMetric(request, abortController);
      }

      // Normalize the response to match frontend expectations
      return this.normalizeApiResponse(rawResponse);
    } catch (error) {
      console.error('Error getting widget data:', error);

      // Don't return error response if request was cancelled
      if (error.name === 'AbortError' || abortController?.signal?.aborted) {
        return null;
      }

      // Return normalized error response
      return this.normalizeErrorResponse(error);
    }
  }

  /**
   * Convert widget configuration to API request format
   * @param {Object} widget - Widget configuration
   * @returns {Object} API request object
   */
  widgetToApiRequest(widget) {
    return {
      metricType: widget.metric || 'fuel_dispense',
      mode: widget.mode || 'cumulative',
      datePreset: widget.datePreset || 'yesterday',
      siteIds: widget.sitesMode === 'all' ? null : (widget.siteIds || []),
      vehicleIds: widget.vehicleIds || null,
      startDate: widget.startDate || null,
      endDate: widget.endDate || null
    };
  }

  /**
   * Generic method for getting metrics using the new data source API
   * @param {string} metricType - Type of metric
   * @param {Object} request - Request parameters
   * @param {AbortController} abortController - Abort controller for cancellation
   * @returns {Promise<Object>} API response
   */
  async getGenericMetric(metricType, request, abortController = null) {
    console.log(`[DashboardMetricsService] Getting generic metric: ${metricType}`, request);

    try {
      const params = {
        sourceId: `${metricType}-metrics`, // e.g., "fuel_lost_gps-metrics"
        mode: request.mode || 'cumulative',
        datePreset: request.datePreset || 'yesterday',
        intervalHours: request.intervalHours
      };

      // Add site filtering
      if (request.siteIds && request.siteIds.length > 0) {
        params.siteIds = request.siteIds.join(',');
      }

      // Add vehicle filtering
      if (request.vehicleIds && request.vehicleIds.length > 0) {
        params.vehicleIds = request.vehicleIds.join(',');
      }

      // Add date range if provided
      if (request.startDate) params.startDate = request.startDate;
      if (request.endDate) params.endDate = request.endDate;

      const response = await axiosInstance.get('/dashboard/data-sources/initial-data', {
        params,
        signal: abortController?.signal,
        timeout: 10000
      });

      return this._convertToLegacyFormat(response.data, metricType);
    } catch (error) {
      console.error(`[DashboardMetricsService] Error getting ${metricType}:`, error);
      throw error;
    }
  }

  /**
   * Normalize error response for consistent error handling
   * @param {Error} error - Error object
   * @returns {Object} Normalized error response
   */
  normalizeErrorResponse(error) {
    return {
      metric: 'error',
      value: 0,
      unit: '',
      period: 'Error',
      status: 'error',
      lastUpdated: new Date().toISOString(),
      additionalInfo: {
        sites_count: 0,
        vehicles_count: 0,
        is_live: false,
        mode: 'error'
      },
      errorMessage: error.message || 'Unknown error occurred'
    };
  }

  /**
   * Create enhanced widget data request for API
   * @param {Object} widget - Widget configuration
   * @returns {Object} Enhanced API request object
   */
  createEnhancedRequest(widget) {
    return {
      category: widget.category || null,
      groupBy: widget.groupBy || null,
      aggregationType: widget.aggregationType || 'sum',
      limit: widget.limit || null,
      sortBy: widget.sortBy || null,
      sortOrder: widget.sortOrder || 'desc',
      includeSubItems: widget.includeSubItems || false,
      includeTrends: widget.includeTrends || false,
      advancedFilters: widget.advancedFilters || null,
      metricType: widget.metric || widget.metricType,
      mode: widget.mode || 'cumulative',
      datePreset: widget.datePreset || 'yesterday',
      siteIds: widget.sitesMode === 'all' ? null : (widget.siteIds || []),
      vehicleIds: widget.vehicleIds || null,
      startDate: widget.startDate || null,
      endDate: widget.endDate || null
    };
  }
}

// Create and export a singleton instance
const dashboardMetricsService = new DashboardMetricsService();

// Export the instance as default
export default dashboardMetricsService;

// Also export the class for those who need to create their own instances
export { DashboardMetricsService };

// Create a global instance for easy access (optional)
if (typeof window !== 'undefined') {
  window.dashboardMetricsService = dashboardMetricsService;
  window.DashboardMetricsService = DashboardMetricsService;
}
