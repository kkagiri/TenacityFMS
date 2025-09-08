import axiosInstance from '../api/axiosInstance';
import dataSourceService from './dataSourceService';

/**
 * Dashboard Service - Phase 2 Enhanced
 * Handles API calls to backend dashboard customization endpoints with streaming support
 * Integrates with DataSourceService for unified data management
 *
 * Phase 1: Basic dashboard functionality
 * Phase 2: Streaming data service integration
 *
 * Endpoints implemented server-side:
 *  GET /api/dashboard/preferences         -> current user's preferences
 *  POST /api/dashboard/preferences        -> save/update current user's preferences
 *  GET /api/dashboard/ticker-configs      -> filtered ticker templates (query: onlyEnabled=true|false)
 *  GET /api/dashboard/data-sources/*      -> streaming data endpoints
 */
class DashboardService {
  // ========================================
  // PHASE 2: STREAMING DATA INTEGRATION
  // ========================================

  /**
   * Get widget data with streaming support (Phase 2)
   * @param {number} widgetInstanceId - Widget instance ID
   * @param {object} options - Loading options
   * @returns {Promise<object>} WidgetDataResponseDto with streaming capabilities
   */
  async getWidgetDataWithStreaming(widgetInstanceId, options = {}) {
    try {
      console.log('DashboardService: Getting widget data with streaming:', widgetInstanceId, options);

      // Get widget configuration first
      const widgetResponse = await this.getWidgetInstance(widgetInstanceId);
      if (!widgetResponse.success) {
        throw new Error(widgetResponse.errorMessage || 'Failed to get widget configuration');
      }

      const widget = widgetResponse.data;
      const dataSource = widget.configuration?.dataSource;

      if (!dataSource) {
        console.warn('Widget has no data source configured:', widgetInstanceId);
        return { success: false, error: 'No data source configured for widget' };
      }

      // Build dashboard request from widget configuration
      const dashboardRequest = {
        metricType: widget.configuration?.metricType || dataSource,
        mode: options.mode || widget.configuration?.mode || 'historical',
        datePreset: options.datePreset || widget.configuration?.datePreset || 'today',
        siteIds: widget.configuration?.siteIds,
        vehicleIds: widget.configuration?.vehicleIds,
        vehicleType: widget.configuration?.vehicleType
      };

      // Get initial data from data source service
      const initialData = await dataSourceService.getInitialData(
        dataSource,
        options.loadOptions || {},
        dashboardRequest
      );

      return {
        widgetInstanceId,
        dataSource,
        data: initialData,
        configuration: widget.configuration,
        timestamp: Date.now(),
        streaming: {
          supported: initialData.data?.metadata?.supportsLiveData || false,
          enabled: options.enableStreaming !== false
        }
      };

    } catch (error) {
      console.error('DashboardService: Error getting widget data with streaming:', error);
      return {
        success: false,
        error: error.message || 'Failed to get widget data',
        widgetInstanceId,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Start streaming data for a widget
   * @param {number} widgetInstanceId - Widget instance ID
   * @param {Function} onDataUpdate - Callback for data updates
   * @param {object} options - Streaming options
   * @returns {Promise<string>} Stream ID
   */
  async startWidgetStreaming(widgetInstanceId, onDataUpdate, options = {}) {
    try {
      console.log('DashboardService: Starting widget streaming:', widgetInstanceId);

      // Get widget configuration
      const widgetResponse = await this.getWidgetInstance(widgetInstanceId);
      if (!widgetResponse.success) {
        throw new Error(widgetResponse.errorMessage || 'Failed to get widget configuration');
      }

      const widget = widgetResponse.data;
      const dataSource = widget.configuration?.dataSource;

      if (!dataSource) {
        throw new Error('Widget has no data source configured');
      }

      // Create wrapper callback that includes widget context
      const wrappedCallback = (dataUpdate) => {
        const widgetUpdate = {
          widgetInstanceId,
          dataSource,
          data: dataUpdate,
          configuration: widget.configuration,
          timestamp: Date.now()
        };
        onDataUpdate(widgetUpdate);
      };

      // Start streaming via data source service
      const streamId = await dataSourceService.startStreaming(
        dataSource,
        wrappedCallback,
        {
          refreshInterval: options.refreshInterval || widget.configuration?.refreshInterval || 30000,
          enableLiveData: widget.configuration?.supportsLiveData !== false,
          ...options
        }
      );

      console.log('DashboardService: Widget streaming started:', { widgetInstanceId, streamId, dataSource });
      return streamId;

    } catch (error) {
      console.error('DashboardService: Error starting widget streaming:', error);
      throw error;
    }
  }

  /**
   * Stop streaming data for a widget
   * @param {string} streamId - Stream ID returned from startWidgetStreaming
   * @returns {Promise<void>}
   */
  async stopWidgetStreaming(streamId) {
    try {
      console.log('DashboardService: Stopping widget streaming:', streamId);
      await dataSourceService.stopStreaming(streamId);
      console.log('DashboardService: Widget streaming stopped:', streamId);
    } catch (error) {
      console.error('DashboardService: Error stopping widget streaming:', error);
      throw error;
    }
  }

  /**
   * Get data source metadata
   * @param {string} dataSource - Data source identifier
   * @returns {Promise<object>} Data source metadata
   */
  async getDataSourceMetadata(dataSource) {
    return await dataSourceService.getDataSourceMetadata(dataSource);
  }

  /**
   * Get all available data sources
   * @returns {Promise<Array>} List of available data sources
   */
  async getAvailableDataSources() {
    return await dataSourceService.getAvailableDataSources();
  }

  /**
   * Get aggregated data for a widget
   * @param {number} widgetInstanceId - Widget instance ID
   * @param {string} aggregationInterval - Aggregation interval
   * @param {object} options - Additional options
   * @returns {Promise<object>} Aggregated data response
   */
  async getWidgetAggregatedData(widgetInstanceId, aggregationInterval = 'hourly', options = {}) {
    try {
      const widgetResponse = await this.getWidgetInstance(widgetInstanceId);
      if (!widgetResponse.success) {
        throw new Error(widgetResponse.errorMessage || 'Failed to get widget configuration');
      }

      const widget = widgetResponse.data;
      const dataSource = widget.configuration?.dataSource;

      if (!dataSource) {
        throw new Error('Widget has no data source configured');
      }

      const dashboardRequest = {
        metricType: widget.configuration?.metricType || dataSource,
        mode: 'historical',
        datePreset: options.datePreset || widget.configuration?.datePreset || 'today',
        siteIds: widget.configuration?.siteIds,
        vehicleIds: widget.configuration?.vehicleIds,
        vehicleType: widget.configuration?.vehicleType
      };

      const aggregatedData = await dataSourceService.getAggregatedData(
        dataSource,
        aggregationInterval,
        dashboardRequest
      );

      return {
        widgetInstanceId,
        dataSource,
        aggregationInterval,
        data: aggregatedData,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('DashboardService: Error getting widget aggregated data:', error);
      throw error;
    }
  }

  /**
   * Get streaming statistics for debugging
   * @returns {object} Streaming statistics
   */
  getStreamingStats() {
    return dataSourceService.getStreamingStats();
  }

  // ========================================
  // ENHANCED WIDGET DATA METHODS (Phase 2)
  // ========================================

  /**
   * Get enhanced widget data with DevExtreme load options support
   * @param {number} widgetInstanceId - Widget instance ID
   * @param {object} loadOptions - DevExtreme load options
   * @returns {Promise<object>} Enhanced widget data response
   */
  async getEnhancedWidgetData(widgetInstanceId, loadOptions = {}) {
    try {
      console.log('DashboardService: Getting enhanced widget data:', widgetInstanceId, loadOptions);

      return await this.getWidgetDataWithStreaming(widgetInstanceId, {
        loadOptions,
        enableStreaming: false // Just get initial data for enhanced loading
      });

    } catch (error) {
      console.error('DashboardService: Error getting enhanced widget data:', error);
      throw error;
    }
  }

  // ========================================
  // CORE FUNCTIONALITY - KEEP THESE
  // ========================================

  /**
   * Fetch current user's dashboard preferences
   * @returns {Promise<object>} FMSResponseMessage<UserDashboardPreferenceDto>
   */
  async getPreferences() {
    const response = await axiosInstance.get('/dashboard/preferences');
    return response.data;
  }

  /**
   * Save (create/update) current user's dashboard preferences
   * @param {object} payload { preferencesJson: string, version?: string }
   * @returns {Promise<object>} FMSResponseMessage<UserDashboardPreferenceDto>
   */
  async savePreferences(payload) {
    const response = await axiosInstance.post('/dashboard/preferences', payload);
    return response.data;
  }

  /**
   * Get available widget templates for the current user
   * @param {string} category - Optional category filter
   * @param {boolean} onlyEnabled - Filter to only enabled templates (default true)
   * @returns {Promise<object>} FMSResponseMessage<DashboardWidgetTemplateDto[]>
   */
  async getWidgetTemplates(category = null, onlyEnabled = true) {
    const params = { onlyEnabled };
    if (category) params.category = category;
    const response = await axiosInstance.get('/dashboard/widgets/templates', { params });
    return response.data;
  }

  /**
   * Get user's widget instances
   * @param {string} category - Optional category filter
   * @returns {Promise<object>} FMSResponseMessage<DashboardWidgetInstanceDto[]>
   */
  async getWidgetInstances(category = null) {
    const params = {};
    if (category) params.category = category;
    const response = await axiosInstance.get('/dashboard/widgets/instances', { params });
    return response.data;
  }

  /**
   * Get specific widget instance
   * @param {number} widgetInstanceId - Widget instance ID
   * @returns {Promise<object>} FMSResponseMessage<DashboardWidgetInstanceDto>
   */
  async getWidgetInstance(widgetInstanceId) {
    const response = await axiosInstance.get(`/dashboard/widgets/instances/${widgetInstanceId}`);
    return response.data;
  }

  /**
   * Create a new widget instance
   * @param {object} configuration - WidgetConfigurationDto
   * @returns {Promise<object>} FMSResponseMessage<DashboardWidgetInstanceDto>
   */
  async createWidgetInstance(configuration) {
    const response = await axiosInstance.post('/dashboard/widgets/instances', configuration);
    return response.data;
  }

  /**
   * Update an existing widget instance
   * @param {number} widgetInstanceId - Widget instance ID
   * @param {object} configuration - WidgetConfigurationDto
   * @returns {Promise<object>} FMSResponseMessage<DashboardWidgetInstanceDto>
   */
  async updateWidgetInstance(widgetInstanceId, configuration) {
    const response = await axiosInstance.put(`/dashboard/widgets/instances/${widgetInstanceId}`, configuration);
    return response.data;
  }

  /**
   * Delete a widget instance
   * @param {number} widgetInstanceId - Widget instance ID
   * @returns {Promise<object>} FMSResponseMessage<bool>
   */
  async deleteWidgetInstance(widgetInstanceId) {
    const response = await axiosInstance.delete(`/dashboard/widgets/instances/${widgetInstanceId}`);
    return response.data;
  }

  /**
   * Get data for a specific widget
   * @param {number} widgetInstanceId - Widget instance ID
   * @returns {Promise<object>} WidgetDataResponseDto
   */
  async getWidgetData(widgetInstanceId) {
    const response = await axiosInstance.get(`/dashboard/widgets/${widgetInstanceId}/data`);
    return response.data;
  }

  /**
   * Get data for all user's widgets
   * @returns {Promise<object[]>} WidgetDataResponseDto[]
   */
  async getAllWidgetData() {
    const response = await axiosInstance.get('/dashboard/widgets/data');
    return response.data;
  }

  /**
   * Refresh data for a specific widget
   * @param {number} widgetInstanceId - Widget instance ID
   * @returns {Promise<object>} WidgetDataResponseDto
   */
  async refreshWidgetData(widgetInstanceId) {
    const response = await axiosInstance.post(`/dashboard/widgets/${widgetInstanceId}/refresh`);
    return response.data;
  }

  // ========================================
  // NEW LAYOUT MANAGEMENT - ADD THESE
  // ========================================

  /**
   * Save dashboard layout (category order, widget order, widget sizes)
   * @param {object} layout - Dashboard layout configuration
   * @returns {Promise<object>} FMSResponseMessage<DashboardLayoutDto>
   */
  async saveDashboardLayout(layout) {
    console.log('DashboardService: Saving layout to /dashboard/layout:', layout);
    const response = await axiosInstance.post('/dashboard/layout', layout);
    console.log('DashboardService: Save layout response:', response.data);
    return response.data;
  }

  /**
   * Get user's dashboard layout
   * @returns {Promise<object>} FMSResponseMessage<DashboardLayoutDto>
   */
  async getDashboardLayout() {
    console.log('DashboardService: Loading layout from /dashboard/layout');
    const response = await axiosInstance.get('/dashboard/layout');
    console.log('DashboardService: Load layout response:', response.data);
    return response.data;
  }

  /**
   * Update widget size and position
   * @param {number} widgetInstanceId - Widget instance ID
   * @param {object} sizeAndPosition - { width, height, x?, y? }
   * @returns {Promise<object>} FMSResponseMessage<DashboardWidgetInstanceDto>
   */
  async updateWidgetLayout(widgetInstanceId, sizeAndPosition) {
    const response = await axiosInstance.put(`/dashboard/widgets/${widgetInstanceId}/layout`, sizeAndPosition);
    return response.data;
  }

  /**
   * Update individual widget size in the layout
   * @param {number} widgetInstanceId - Widget instance ID
   * @param {object} newSize - { width, height }
   * @returns {Promise<object>}
   */
  async updateWidgetSize(widgetInstanceId, newSize) {
    const response = await axiosInstance.put(`/dashboard/layout/widget-size/${widgetInstanceId}`, newSize);
    return response.data;
  }

  /**
   * Update widget order within a category
   * @param {string} category - Category name
   * @param {string[]} widgetOrder - Array of widget IDs in order
   * @returns {Promise<object>}
   */
  async updateWidgetOrder(category, widgetOrder) {
    const response = await axiosInstance.put(`/dashboard/layout/widget-order/${category}`, widgetOrder);
    return response.data;
  }

  /**
   * Update category order
   * @param {string[]} categoryOrder - Array of category names in order
   * @returns {Promise<object>}
   */
  async updateCategoryOrder(categoryOrder) {
    const response = await axiosInstance.put('/dashboard/layout/category-order', categoryOrder);
    return response.data;
  }

  // ========================================
  // CLEANUP AND LIFECYCLE METHODS (Phase 2)
  // ========================================

  /**
   * Stop all active streams for cleanup
   * @returns {Promise<void>}
   */
  async stopAllStreams() {
    console.log('DashboardService: Stopping all active streams...');
    await dataSourceService.stopAllStreams();
    console.log('DashboardService: All streams stopped');
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    console.log('DashboardService: Clearing cache...');
    dataSourceService.clearCache();
  }

  /**
   * Cleanup all resources
   * @returns {Promise<void>}
   */
  async cleanup() {
    console.log('DashboardService: Starting cleanup...');
    await this.stopAllStreams();
    this.clearCache();
    console.log('DashboardService: Cleanup completed');
  }

  // ========================================
  // LEGACY/DEPRECATED - COMMENT OUT THESE
  // ========================================

  /*
  // DEPRECATED: Use preferences instead
  async getTickerTemplates(onlyEnabled = true) {
    const response = await axiosInstance.get('/dashboard/ticker-configs', { params: { onlyEnabled } });
    return response.data;
  }

  // DEPRECATED: Use createWidgetInstance instead
  async createEnhancedWidgetInstance(configuration) {
    const response = await axiosInstance.post('/dashboard/widgets/enhanced', configuration);
    return response.data;
  }

  // DEPRECATED: Use getWidgetData instead
  async getEnhancedWidgetData(widgetInstanceId) {
    const response = await axiosInstance.get(`/dashboard/widgets/${widgetInstanceId}/enhanced-data`);
    return response.data;
  }

  // DEPRECATED: Use category filtering in getWidgetInstances instead
  async getWidgetDataByType(widgetType, request) {
    const response = await axiosInstance.post(`/dashboard/widgets/by-type/${widgetType}`, request);
    return response.data;
  }

  // DEPRECATED: Use category filtering in getWidgetInstances instead
  async getCategoryWidgetsData(category) {
    const response = await axiosInstance.get(`/dashboard/widgets/category/${category}`);
    return response.data;
  }

  // DEPRECATED: Not needed for production
  async getWidgetPreviewData(previewRequest) {
    const response = await axiosInstance.post('/dashboard/widgets/preview', previewRequest);
    return response.data;
  }

  // DEPRECATED: Not needed for production
  async validateWidgetForCategory(category, widgetType) {
    const response = await axiosInstance.get(`/dashboard/widgets/validate`, {
      params: { category, widgetType }
    });
    return response.data;
  }

  // DEPRECATED: Not needed for production
  async getAvailableWidgetTypes(category) {
    const response = await axiosInstance.get(`/dashboard/widgets/types`, {
      params: { category }
    });
    return response.data;
  }
  */
}

const dashboardService = new DashboardService();
export default dashboardService;
