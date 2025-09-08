import axiosInstance from '../api/axiosInstance';
import dashboardSignalRService from '../signalR/dashboardSignalRService';

/**
 * Phase 2: Streaming Data Service
 * Handles unified data source management with streaming capabilities
 * Provides DevExtreme-style data loading patterns for dashboard widgets
 */
class DataSourceService {
  constructor() {
    this.activeStreams = new Map(); // Track active data streams
    this.streamSubscriptions = new Map(); // Track SignalR subscriptions
    this.dataCache = new Map(); // Cache for initial data loads
    this.retryAttempts = new Map(); // Track retry attempts per data source
    this.maxRetryAttempts = 3;
    this.retryDelay = 1000; // Start with 1 second delay
  }

  // ========================================
  // CORE DATA SOURCE METHODS
  // ========================================

  /**
   * Get initial data for a data source (DevExtreme LoadOptions pattern)
   * @param {string} dataSource - Data source identifier (e.g., 'fuel_dispense', 'engine_hours')
   * @param {object} loadOptions - DevExtreme-style load options
   * @param {object} dashboardRequest - Dashboard-specific request parameters
   * @returns {Promise<object>} Initial data response
   */
  async getInitialData(dataSource, loadOptions = {}, dashboardRequest = {}) {
    try {
      console.log(`[DataSource] Getting initial data for: ${dataSource}`, { loadOptions, dashboardRequest });

      // Build request parameters
      const params = this.buildRequestParams(loadOptions, dashboardRequest);
      params.sourceId = dataSource; // Add sourceId for new backend endpoint

      // Determine optimal timeout based on data complexity
      const isComplexQuery = this.isComplexQuery(dashboardRequest);
      const timeoutMs = isComplexQuery ? 20000 : 12000; // 20s for complex, 12s for simple queries

      console.log(`[DataSource] Using ${timeoutMs}ms timeout for ${isComplexQuery ? 'complex' : 'simple'} query`);

      // Make API request using the new unified endpoint
      const response = await axiosInstance.get(`/dashboard/data-sources/initial-data`, {
        params,
        timeout: timeoutMs,
        signal: AbortSignal.timeout(timeoutMs + 1000) // AbortController fallback
      });

      // Cache the initial data
      this.dataCache.set(dataSource, {
        data: response.data,
        timestamp: Date.now(),
        ttl: 30000 // 30 seconds TTL
      });

      // Reset retry counter on success
      this.retryAttempts.delete(dataSource);

      console.log(`[DataSource] Initial data loaded for ${dataSource}:`, response.data);
      return this.transformApiResponse(response.data);

    } catch (error) {
      console.error(`[DataSource] Error getting initial data for ${dataSource}:`, error);
      return await this.handleDataSourceError(dataSource, error, 'initial');
    }
  }

  /**
   * Get live/streaming data for a data source
   * @param {string} dataSource - Data source identifier
   * @param {object} dashboardRequest - Dashboard-specific request parameters
   * @returns {Promise<object>} Live data response
   */
  async getLiveData(dataSource, dashboardRequest = {}) {
    try {
      console.log(`[DataSource] Getting live data for: ${dataSource}`, dashboardRequest);

      const params = this.buildRequestParams({}, dashboardRequest);
      params.sourceId = dataSource; // Add sourceId for new backend endpoint
      params.mode = 'live'; // Force live mode

      // Live data should be faster, so use shorter timeout
      const timeoutMs = 8000; // 8 seconds for live data

      const response = await axiosInstance.get(`/dashboard/data-sources/initial-data`, {
        params,
        timeout: timeoutMs,
        signal: AbortSignal.timeout(timeoutMs + 1000)
      });

      console.log(`[DataSource] Live data loaded for ${dataSource}:`, response.data);
      return this.transformApiResponse(response.data);

    } catch (error) {
      console.error(`[DataSource] Error getting live data for ${dataSource}:`, error);
      return await this.handleDataSourceError(dataSource, error, 'live');
    }
  }

  /**
   * Get aggregated data for a data source
   * @param {string} dataSource - Data source identifier
   * @param {string} aggregationInterval - Aggregation interval ('hourly', 'daily', 'weekly')
   * @param {object} dashboardRequest - Dashboard-specific request parameters
   * @returns {Promise<object>} Aggregated data response
   */
  async getAggregatedData(dataSource, aggregationInterval = 'hourly', dashboardRequest = {}) {
    try {
      console.log(`[DataSource] Getting aggregated data for: ${dataSource}`, { aggregationInterval, dashboardRequest });

      const params = this.buildRequestParams({}, dashboardRequest);
      params.sourceId = dataSource; // Add sourceId for new backend endpoint
      params.aggregationInterval = aggregationInterval;
      params.mode = 'aggregated'; // Set mode for aggregated data

      const response = await axiosInstance.get(`/dashboard/data-sources/initial-data`, {
        params,
        timeout: 15000 // Longer timeout for aggregated data
      });

      console.log(`[DataSource] Aggregated data loaded for ${dataSource}:`, response.data);
      return this.transformApiResponse(response.data);

    } catch (error) {
      console.error(`[DataSource] Error getting aggregated data for ${dataSource}:`, error);
      return await this.handleDataSourceError(dataSource, error, 'aggregated');
    }
  }

  // ========================================
  // STREAMING METHODS (Phase 2 Core)
  // ========================================

  /**
   * Start streaming data for a data source
   * @param {string} dataSource - Data source identifier
   * @param {Function} onDataUpdate - Callback for data updates
   * @param {object} options - Streaming options
   * @returns {Promise<string>} Stream ID for managing the stream
   */
  async startStreaming(dataSource, onDataUpdate, options = {}) {
    try {
      const streamId = `${dataSource}-${Date.now()}`;
      console.log(`[DataSource] Starting stream for ${dataSource} (ID: ${streamId})`);

      // Configure streaming options
      const streamOptions = {
        refreshInterval: options.refreshInterval || 30000, // 30 seconds default
        enableLiveData: options.enableLiveData !== false, // Default to true
        retryOnError: options.retryOnError !== false, // Default to true
        maxRetries: options.maxRetries || 3,
        ...options
      };

      // Ensure SignalR connection is active
      if (!dashboardSignalRService.isConnected) {
        console.log('[DataSource] SignalR not connected, attempting to connect...');
        await dashboardSignalRService.start();
      }

      // Subscribe to SignalR updates for this data source
      const signalRHandler = (updateData) => {
        if (updateData.dataSource === dataSource) {
          console.log(`[DataSource] Received SignalR update for ${dataSource}:`, updateData);
          onDataUpdate(this.transformApiResponse(updateData.data));
        }
      };

      const unsubscribe = dashboardSignalRService.on('MetricDataUpdate', signalRHandler);
      this.streamSubscriptions.set(streamId, unsubscribe);

      // Subscribe to metric updates via SignalR
      await dashboardSignalRService.subscribeToMetric(dataSource);

      // Store stream configuration
      this.activeStreams.set(streamId, {
        dataSource,
        onDataUpdate,
        options: streamOptions,
        startTime: Date.now(),
        lastUpdate: null,
        isActive: true
      });

      // Start periodic refresh if enabled
      if (streamOptions.enablePeriodicRefresh !== false) {
        this.startPeriodicRefresh(streamId, streamOptions.refreshInterval);
      }

      console.log(`[DataSource] Stream started for ${dataSource} (ID: ${streamId})`);
      return streamId;

    } catch (error) {
      console.error(`[DataSource] Error starting stream for ${dataSource}:`, error);
      throw error;
    }
  }

  /**
   * Stop streaming data for a data source
   * @param {string} streamId - Stream ID returned from startStreaming
   * @returns {Promise<void>}
   */
  async stopStreaming(streamId) {
    try {
      const stream = this.activeStreams.get(streamId);
      if (!stream) {
        console.warn(`[DataSource] Stream not found: ${streamId}`);
        return;
      }

      console.log(`[DataSource] Stopping stream: ${streamId}`);

      // Mark stream as inactive
      stream.isActive = false;

      // Unsubscribe from SignalR events
      const unsubscribe = this.streamSubscriptions.get(streamId);
      if (unsubscribe) {
        unsubscribe();
        this.streamSubscriptions.delete(streamId);
      }

      // Clear periodic refresh timer
      if (stream.refreshTimer) {
        clearInterval(stream.refreshTimer);
      }

      // Remove from active streams
      this.activeStreams.delete(streamId);

      console.log(`[DataSource] Stream stopped: ${streamId}`);

    } catch (error) {
      console.error(`[DataSource] Error stopping stream ${streamId}:`, error);
    }
  }

  /**
   * Stop all active streams
   * @returns {Promise<void>}
   */
  async stopAllStreams() {
    console.log('[DataSource] Stopping all active streams...');

    const streamIds = Array.from(this.activeStreams.keys());
    const stopPromises = streamIds.map(streamId => this.stopStreaming(streamId));

    await Promise.all(stopPromises);
    console.log(`[DataSource] Stopped ${streamIds.length} streams`);
  }

  // ========================================
  // DATA SOURCE METADATA
  // ========================================

  /**
   * Get time interval configuration options for date presets
   * @returns {object} Available time intervals for different presets
   */
  getTimeIntervalOptions() {
    return {
      'today': {
        label: 'Today',
        defaultInterval: 1,
        intervalOptions: [
          { value: 1, label: '1 Hour', description: 'Hourly data points' },
          { value: 2, label: '2 Hours', description: '2-hour intervals' },
          { value: 4, label: '4 Hours', description: '4-hour intervals' }
        ]
      },
      'yesterday': {
        label: 'Yesterday',
        defaultInterval: 1,
        intervalOptions: [
          { value: 1, label: '1 Hour', description: 'Hourly data points' },
          { value: 2, label: '2 Hours', description: '2-hour intervals' },
          { value: 4, label: '4 Hours', description: '4-hour intervals' },
          { value: 6, label: '6 Hours', description: '6-hour intervals' }
        ]
      },
      'last_7_days': {
        label: 'Last 7 Days',
        defaultInterval: 6,
        intervalOptions: [
          { value: 3, label: '3 Hours', description: '3-hour intervals' },
          { value: 6, label: '6 Hours', description: '6-hour intervals' },
          { value: 12, label: '12 Hours', description: '12-hour intervals' },
          { value: 24, label: 'Daily', description: 'Daily data points' }
        ]
      },
      'last_30_days': {
        label: 'Last 30 Days',
        defaultInterval: 24,
        intervalOptions: [
          { value: 12, label: '12 Hours', description: '12-hour intervals' },
          { value: 24, label: 'Daily', description: 'Daily data points' },
          { value: 168, label: 'Weekly', description: 'Weekly data points' }
        ]
      },
      'this_week': {
        label: 'This Week',
        defaultInterval: 6,
        intervalOptions: [
          { value: 3, label: '3 Hours', description: '3-hour intervals' },
          { value: 6, label: '6 Hours', description: '6-hour intervals' },
          { value: 12, label: '12 Hours', description: '12-hour intervals' },
          { value: 24, label: 'Daily', description: 'Daily data points' }
        ]
      },
      'this_month': {
        label: 'This Month',
        defaultInterval: 24,
        intervalOptions: [
          { value: 12, label: '12 Hours', description: '12-hour intervals' },
          { value: 24, label: 'Daily', description: 'Daily data points' },
          { value: 168, label: 'Weekly', description: 'Weekly data points' }
        ]
      }
    };
  }

  /**
   * Get default interval for a date preset
   * @param {string} datePreset - Date preset (e.g., 'today', 'yesterday')
   * @returns {number} Default interval in hours
   */
  getDefaultInterval(datePreset) {
    const options = this.getTimeIntervalOptions();
    return options[datePreset]?.defaultInterval || 1;
  }

  /**
   * Get available intervals for a date preset
   * @param {string} datePreset - Date preset
   * @returns {Array} Available interval options
   */
  getAvailableIntervals(datePreset) {
    const options = this.getTimeIntervalOptions();
    return options[datePreset]?.intervalOptions || [
      { value: 1, label: '1 Hour', description: 'Hourly data points' }
    ];
  }

  /**
   * Get metadata for a data source
   * @param {string} dataSource - Data source identifier
   * @returns {Promise<object>} Data source metadata
   */
  async getDataSourceMetadata(dataSource) {
    try {
      const response = await axiosInstance.get(`/dashboard/data-sources/health`);
      return response.data;
    } catch (error) {
      console.error(`[DataSource] Error getting metadata for ${dataSource}:`, error);

      // Return default metadata structure
      return {
        displayName: dataSource,
        unit: 'units',
        description: `Data for ${dataSource}`,
        supportsLiveData: false,
        supportsHistoricalData: true,
        supportedAggregations: ['sum'],
        category: 'general',
        refreshIntervalSeconds: 30
      };
    }
  }

  /**
   * Get all available data sources
   * @returns {Promise<Array>} List of available data sources
   */
  async getAvailableDataSources() {
    try {
      const response = await axiosInstance.get('/dashboard/data-sources');
      return response.data;
    } catch (error) {
      console.error('[DataSource] Error getting available data sources:', error);

      // Return default data sources
      return [
        'fuel_dispense',
        'fuel_used_gps',
        'fuel_lost_gps',
        'flowmeter_fuel_used',
        'flowmeter_fuel_lost',
        'engine_hours',
        'engine_hours_gps',
        'km_travel',
        'distance_travel',
        'fuel_efficiency',
        'flowmeter_efficiency',
        'max_speed',
        'avg_speed'
      ];
    }
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Build request parameters from load options and dashboard request
   * @param {object} loadOptions - DevExtreme load options
   * @param {object} dashboardRequest - Dashboard request parameters
   * @returns {object} Combined request parameters
   */
  buildRequestParams(loadOptions = {}, dashboardRequest = {}) {
    const params = {
      // DevExtreme load options
      skip: loadOptions.skip || 0,
      take: loadOptions.take || 50,
      sort: loadOptions.sort ? JSON.stringify(loadOptions.sort) : undefined,
      filter: loadOptions.filter ? JSON.stringify(loadOptions.filter) : undefined,
      group: loadOptions.group ? JSON.stringify(loadOptions.group) : undefined,

      // Dashboard-specific parameters
      mode: dashboardRequest.mode || 'cumulative',
      datePreset: dashboardRequest.datePreset || 'yesterday',
      startDate: dashboardRequest.startDate,
      endDate: dashboardRequest.endDate,
      vehicleType: dashboardRequest.vehicleType,

      // Time interval configuration (user-selectable)
      intervalHours: dashboardRequest.intervalHours || this.getDefaultInterval(dashboardRequest.datePreset || 'yesterday')
    };

    // Handle site IDs - only add if there are actual values
    if (dashboardRequest.siteIds && dashboardRequest.siteIds.length > 0) {
      params.siteIds = dashboardRequest.siteIds.join(',');
    }

    // Handle vehicle IDs - only add if there are actual values
    if (dashboardRequest.vehicleIds && dashboardRequest.vehicleIds.length > 0) {
      params.vehicleIds = dashboardRequest.vehicleIds.join(',');
    }

    // Remove undefined values
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === null) {
        delete params[key];
      }
    });

    console.log(`[DataSource] Built request params:`, params);
    return params;
  }

  /**
   * Transform API response to standard format
   * @param {object} apiResponse - Raw API response
   * @returns {object} Transformed response
   */
  transformApiResponse(apiResponse) {
    // Handle different response formats
    if (apiResponse.success !== undefined) {
      // FMSResponseMessage format
      return {
        success: apiResponse.success,
        data: apiResponse.data,
        error: apiResponse.errorMessage,
        timestamp: Date.now()
      };
    }

    // Direct data format
    return {
      success: true,
      data: apiResponse,
      error: null,
      timestamp: Date.now()
    };
  }

  /**
   * Handle data source errors with retry logic
   * @param {string} dataSource - Data source identifier
   * @param {Error} error - The error that occurred
   * @param {string} operation - The operation that failed
   * @returns {Promise<object>} Error response or retry result
   */
  async handleDataSourceError(dataSource, error, operation) {
    const retryKey = `${dataSource}-${operation}`;
    const currentRetries = this.retryAttempts.get(retryKey) || 0;

    console.error(`[DataSource] Error in ${operation} for ${dataSource} (attempt ${currentRetries + 1}):`, error);

    // Check if we should retry
    if (currentRetries < this.maxRetryAttempts && this.isRetryableError(error)) {
      this.retryAttempts.set(retryKey, currentRetries + 1);

      // Exponential backoff
      const delay = this.retryDelay * Math.pow(2, currentRetries);
      console.log(`[DataSource] Retrying ${operation} for ${dataSource} in ${delay}ms...`);

      await new Promise(resolve => setTimeout(resolve, delay));

      // Retry the operation
      try {
        switch (operation) {
          case 'initial':
            return await this.getInitialData(dataSource);
          case 'live':
            return await this.getLiveData(dataSource);
          case 'aggregated':
            return await this.getAggregatedData(dataSource);
          default:
            throw error;
        }
      } catch (retryError) {
        return await this.handleDataSourceError(dataSource, retryError, operation);
      }
    }

    // Max retries reached or non-retryable error
    this.retryAttempts.delete(retryKey);

    return {
      success: false,
      data: null,
      error: error.message || 'Unknown error occurred',
      timestamp: Date.now(),
      retryable: this.isRetryableError(error)
    };
  }

  /**
   * Check if an error is retryable
   * @param {Error} error - The error to check
   * @returns {boolean} Whether the error is retryable
   */
  isRetryableError(error) {
    // Network errors, timeouts, and 5xx server errors are retryable
    if (error.code === 'NETWORK_ERROR' ||
        error.code === 'ECONNABORTED' ||
        error.message?.includes('timeout') ||
        error.message?.includes('Request timeout')) {
      return true;
    }

    if (error.response?.status >= 500) {
      return true;
    }

    // 404 and authentication errors are not retryable
    if (error.response?.status === 404 || error.response?.status === 401) {
      return false;
    }

    return false;
  }

  /**
   * Determine if a query is complex and needs longer timeout
   * @param {object} dashboardRequest - Dashboard request parameters
   * @returns {boolean} Whether the query is complex
   */
  isComplexQuery(dashboardRequest) {
    const {
      datePreset,
      startDate,
      endDate,
      siteIds = [],
      vehicleIds = [],
      intervalHours
    } = dashboardRequest;

    // Consider query complex if:
    // - Large date range (more than 7 days)
    // - Multiple vehicles/sites
    // - Custom date range
    // - Fine granularity (hourly intervals)

    const isLargeDateRange = this.isLargeDateRange(datePreset, startDate, endDate);
    const hasMultipleFilters = siteIds.length > 5 || vehicleIds.length > 10;
    const isCustomDateRange = !datePreset && startDate && endDate;
    const isFineGranularity = intervalHours && intervalHours <= 1;

    return isLargeDateRange || hasMultipleFilters || isCustomDateRange || isFineGranularity;
  }

  /**
   * Check if date range is large
   * @param {string} datePreset - Date preset
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {boolean} Whether date range is large
   */
  isLargeDateRange(datePreset, startDate, endDate) {
    if (datePreset) {
      return ['last_month', 'last_3_months', 'last_6_months', 'last_year'].includes(datePreset);
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffDays = (end - start) / (1000 * 60 * 60 * 24);
      return diffDays > 7; // More than a week
    }

    return false;
  }

  /**
   * Start periodic refresh for a stream
   * @param {string} streamId - Stream ID
   * @param {number} interval - Refresh interval in milliseconds
   */
  startPeriodicRefresh(streamId, interval) {
    const stream = this.activeStreams.get(streamId);
    if (!stream) return;

    stream.refreshTimer = setInterval(async () => {
      if (!stream.isActive) {
        clearInterval(stream.refreshTimer);
        return;
      }

      try {
        console.log(`[DataSource] Periodic refresh for ${stream.dataSource}`);
        const liveData = await this.getLiveData(stream.dataSource);

        if (liveData.success) {
          stream.lastUpdate = Date.now();
          stream.onDataUpdate(liveData);
        }
      } catch (error) {
        console.error(`[DataSource] Error in periodic refresh for ${stream.dataSource}:`, error);
      }
    }, interval);
  }

  /**
   * Get cached data if available and not expired
   * @param {string} dataSource - Data source identifier
   * @returns {object|null} Cached data or null
   */
  getCachedData(dataSource) {
    const cached = this.dataCache.get(dataSource);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      this.dataCache.delete(dataSource);
      return null;
    }

    return cached.data;
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    console.log('[DataSource] Clearing data cache');
    this.dataCache.clear();
  }

  /**
   * Get streaming statistics
   * @returns {object} Streaming statistics
   */
  getStreamingStats() {
    const activeStreams = Array.from(this.activeStreams.values());

    return {
      totalStreams: activeStreams.length,
      activeStreams: activeStreams.filter(s => s.isActive).length,
      dataSourceBreakdown: activeStreams.reduce((acc, stream) => {
        acc[stream.dataSource] = (acc[stream.dataSource] || 0) + 1;
        return acc;
      }, {}),
      cacheSize: this.dataCache.size,
      retryQueue: this.retryAttempts.size
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    console.log('[DataSource] Cleaning up resources...');

    await this.stopAllStreams();
    this.clearCache();
    this.retryAttempts.clear();

    console.log('[DataSource] Cleanup completed');
  }
}

// Create singleton instance
const dataSourceService = new DataSourceService();

// Export configuration utilities
export const TimeIntervalConfig = {
  getOptions: () => dataSourceService.getTimeIntervalOptions(),
  getDefaultInterval: (preset) => dataSourceService.getDefaultInterval(preset),
  getAvailableIntervals: (preset) => dataSourceService.getAvailableIntervals(preset)
};

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    dataSourceService.cleanup();
  });
}

export default dataSourceService;
