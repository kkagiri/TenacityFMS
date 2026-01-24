import axiosInstance from '../api/axiosInstance';
import { dashboardApi } from '../api/dashboardFactory';
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
    this.metadataCache = new Map();
    this.catalogCache = { items: null, timestamp: 0 };
    this.catalogTtl = 5 * 60 * 1000; // 5 minutes
    this.categoryIndex = new Map();
    this.widgetCompatibilityIndex = new Map();
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

      // Make API request using the v1 endpoint
      const response = await axiosInstance.get(`v1/dashboard/data-sources/${dataSource}/initial`, {
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

      const response = await axiosInstance.get(`v1/dashboard/data-sources/${dataSource}/initial`, {
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

      const response = await axiosInstance.get(`v1/dashboard/data-sources/${dataSource}/aggregated`, {
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

      // Ensure SignalR connection is active (should be managed by SignalRConnectionManager)
      if (!dashboardSignalRService.isConnected) {
        console.log('[DataSource] SignalR not connected, attempting fallback start...');
        console.warn('[DataSource] Connection should be managed by SignalRConnectionManager based on route');
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
  async getDataSourceMetadata(dataSource, options = {}) {
    if (!dataSource) return null;

    const { forceRefresh = false } = options;
    const cacheKey = dataSource.toLowerCase();
    const cached = this.metadataCache.get(cacheKey);
    if (!forceRefresh && cached && Date.now() - cached.timestamp < this.catalogTtl) {
      return cached.metadata;
    }

    try {
      const metadata = await dashboardApi.getDataSourceMetadata(dataSource, { forceRefresh });
      if (metadata) {
        this.metadataCache.set(cacheKey, { metadata, timestamp: Date.now() });
        return metadata;
      }
    } catch (error) {
      console.error(`[DataSource] Error getting metadata for ${dataSource}:`, error);
    }

    if (cached) {
      return cached.metadata;
    }

    return {
      displayName: dataSource,
      category: 'general',
      supportedModes: [],
      supportedAggregations: ['sum'],
      supportedGranularities: ['day'],
      defaultMode: 'historical_snapshot',
      defaultAggregation: 'sum',
      defaultGranularity: 'day',
      refreshIntervalSeconds: 30
    };
  }

  rebuildCatalogIndexes(items = []) {
    const categoryIndex = new Map();
    const widgetIndex = new Map();

    // Ensure items is an array
    const itemsArray = Array.isArray(items) ? items : [];

    itemsArray.forEach(item => {
      if (!item) return;
      const metadata = item.metadata || {};
      const category = metadata.category || item.category || 'general';
      const entry = {
        id: item.id,
        displayName: item.displayName || item.id,
        category,
        modes: metadata.supportedModes || [],
        metadata
      };

      if (!categoryIndex.has(category)) {
        categoryIndex.set(category, []);
      }
      categoryIndex.get(category).push(entry);

      (metadata.compatibleWidgetTypes || []).forEach(widgetType => {
        if (!widgetType) return;
        if (!widgetIndex.has(widgetType)) {
          widgetIndex.set(widgetType, new Set());
        }
        widgetIndex.get(widgetType).add(item.id);
      });
    });

    // Ensure deterministic ordering within categories
    categoryIndex.forEach((sources, category) => {
      categoryIndex.set(
        category,
        sources.sort((a, b) => a.displayName.localeCompare(b.displayName))
      );
    });

    this.categoryIndex = categoryIndex;
    this.widgetCompatibilityIndex = widgetIndex;
  }

  /**
   * Get all available data sources
   * @returns {Promise<Array>} List of available data sources
   */
  async getAvailableDataSources(options = {}) {
    const { forceRefresh = false } = options;

    if (!forceRefresh && this.catalogCache.items && Date.now() - this.catalogCache.timestamp < this.catalogTtl) {
      if (!this.categoryIndex.size) {
        this.rebuildCatalogIndexes(this.catalogCache.items);
      }
      return this.catalogCache.items;
    }

    try {
      const result = await dashboardApi.getDataSources({ forceRefresh });
      // Ensure items is always an array
      const items = Array.isArray(result) ? result : [];
      this.catalogCache = { items, timestamp: Date.now() };

      items.forEach(item => {
        if (item?.id && item?.metadata) {
          this.metadataCache.set(item.id.toLowerCase(), {
            metadata: item.metadata,
            timestamp: Date.now()
          });
        }
      });

      this.rebuildCatalogIndexes(items);
      return items;
    } catch (error) {
      console.error('[DataSource] Error getting available data sources:', error);
      if (this.catalogCache.items) {
        if (!this.categoryIndex.size) {
          this.rebuildCatalogIndexes(this.catalogCache.items);
        }
        return this.catalogCache.items;
      }
      this.rebuildCatalogIndexes([]);
      return [];
    }
  }

  async getDataSourceCatalog(options = {}) {
    const items = await this.getAvailableDataSources(options);
    const includeMetadata = options.includeMetadata ?? false;

    const categories = Array.from(this.categoryIndex.entries()).map(([category, sources]) => ({
      category,
      sources: sources.map(source => {
        const base = {
          id: source.id,
          displayName: source.displayName,
          modes: source.modes,
          category: source.category
        };
        if (includeMetadata) {
          base.metadata = source.metadata;
        }
        return base;
      })
    }));

    const widgetCompatibility = Array.from(this.widgetCompatibilityIndex.entries()).reduce((acc, [widgetType, idSet]) => {
      acc[widgetType] = Array.from(idSet.values());
      return acc;
    }, {});

    return {
      items,
      categories,
      widgetCompatibility
    };
  }

  async getCategoryModeMatrix(options = {}) {
    await this.getAvailableDataSources(options);

    const matrix = {};
    this.categoryIndex.forEach((sources, category) => {
      matrix[category] = sources.reduce((acc, source) => {
        const meta = source.metadata || {};
        acc[source.id] = {
          modes: source.modes || [],
          defaultMode: meta.defaultMode || meta.DefaultMode || meta.defaultConfiguration?.mode,
          defaultAggregation: meta.defaultAggregation || meta.DefaultAggregation || meta.defaultConfiguration?.aggregation,
          defaultGranularity: meta.defaultGranularity || meta.DefaultGranularity || meta.defaultConfiguration?.granularity,
          recommendations: meta.recommendations || meta.Recommendations || {}
        };
        return acc;
      }, {});
    });

    return matrix;
  }

  async getSourcesForCategory(category, options = {}) {
    if (!category) return [];
    await this.getAvailableDataSources(options);
    const includeMetadata = options.includeMetadata ?? false;
    const sources = this.categoryIndex.get(category) || [];
    return sources.map(source => {
      const base = {
        id: source.id,
        displayName: source.displayName,
        modes: source.modes,
        category: source.category
      };
      if (includeMetadata) {
        base.metadata = source.metadata;
      }
      return base;
    });
  }

  async getCompatibleSourcesForWidget(widgetType, options = {}) {
    if (!widgetType) return [];
    await this.getAvailableDataSources(options);
    const includeMetadata = options.includeMetadata ?? false;
    const ids = Array.from(this.widgetCompatibilityIndex.get(widgetType) || []);
    if (ids.length === 0) return [];
    return ids
      .map(id => {
        const matchFromCatalog = this.catalogCache.items?.find(item => item.id === id);
        if (!matchFromCatalog) return null;
        const base = {
          id: matchFromCatalog.id,
          displayName: matchFromCatalog.displayName,
          category: matchFromCatalog.metadata?.category || matchFromCatalog.category,
          modes: matchFromCatalog.metadata?.supportedModes || []
        };
        if (includeMetadata) {
          base.metadata = matchFromCatalog.metadata;
        }
        return base;
      })
      .filter(Boolean)
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  async getSupportedModesForSource(sourceId, options = {}) {
    if (!sourceId) return [];
    const metadata = await this.getDataSourceMetadata(sourceId, options);
    return metadata?.supportedModes || metadata?.SupportedModes || [];
  }

  async getDefaultConfigurationForSource(sourceId, options = {}) {
    const metadata = await this.getDataSourceMetadata(sourceId, options);
    if (!metadata) return {};
    const defaults = metadata.defaultConfiguration || {};
    return {
      mode: metadata.defaultMode || defaults.mode,
      aggregation: metadata.defaultAggregation || defaults.aggregation,
      granularity: metadata.defaultGranularity || defaults.granularity,
      datePreset: metadata.recommendations?.datePreset || defaults.datePreset,
      unit: defaults.unit || metadata.unit,
      includeTotal: defaults.includeTotal,
      topK: defaults.topK
    };
  }

  applyMetadataDefaults(metadata, currentConfig = {}) {
    if (!metadata) return { ...currentConfig };

    const result = { ...currentConfig };
    const defaults = metadata.defaultConfiguration || {};
    const recommendations = metadata.recommendations || {};
    const firstMode = metadata.supportedModes?.[0];
    const firstAggregation = metadata.supportedAggregations?.[0];
    const firstGranularity = metadata.supportedGranularities?.[0];
    const firstUnit = metadata.recommendedUnits?.[0] || metadata.supportedUnits?.[0];

    const ensure = (key, value) => {
      if (result[key] === undefined || result[key] === null || result[key] === '') {
        result[key] = value;
      }
    };

    ensure('mode', defaults.mode || metadata.defaultMode || firstMode || 'historical_snapshot');
    ensure('aggregation', defaults.aggregation || metadata.defaultAggregation || firstAggregation || 'sum');
    ensure('granularity', defaults.granularity || metadata.defaultGranularity || recommendations.granularity || firstGranularity || 'day');
    ensure('datePreset', defaults.datePreset || recommendations.datePreset || 'last_7_days');
    ensure('unit', defaults.unit || metadata.unit || firstUnit || result.unit);

    if (defaults.includeTotal !== undefined && result.includeTotal === undefined) {
      result.includeTotal = defaults.includeTotal;
    }

    if (defaults.topK !== undefined && result.topK === undefined) {
      result.topK = defaults.topK;
    }

    if (recommendations.cumulativeDefault !== undefined && result.cumulative === undefined) {
      result.cumulative = recommendations.cumulativeDefault;
    }

    if (recommendations.smoothingDefault !== undefined && result.smoothing === undefined) {
      result.smoothing = recommendations.smoothingDefault;
    }

    return result;
  }

  async normalizeConfigurationForSource(sourceId, currentConfig = {}, options = {}) {
    const metadata = await this.getDataSourceMetadata(sourceId, options);
    const normalized = this.applyMetadataDefaults(metadata, currentConfig);
    return {
      metadata,
      config: normalized
    };
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
    if (apiResponse?.isSuccess !== undefined) {
      return {
        success: apiResponse.isSuccess,
        data: apiResponse.data,
        error: apiResponse.isSuccess ? null : (apiResponse.message || apiResponse.errorMessage),
        message: apiResponse.message,
        validationErrors: apiResponse.validationErrors || [],
        timestamp: Date.now()
      };
    }

    if (apiResponse.success !== undefined) {
      // FMSResponseMessage format
      return {
        success: apiResponse.success,
        data: apiResponse.data,
        error: apiResponse.errorMessage,
        message: apiResponse.message,
        validationErrors: apiResponse.validationErrors || [],
        timestamp: Date.now()
      };
    }

    // Direct data format
    return {
      success: true,
      data: apiResponse,
      error: null,
      message: null,
      validationErrors: [],
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
    this.metadataCache.clear();
    this.catalogCache = { items: null, timestamp: 0 };
    this.categoryIndex.clear();
    this.widgetCompatibilityIndex.clear();
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
