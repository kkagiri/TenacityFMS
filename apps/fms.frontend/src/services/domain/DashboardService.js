/**
 * DashboardService Class
 *
 * Handles all dashboard-related operations with standardized enterprise patterns:
 * - Widget instance management
 * - Dashboard layout operations
 * - Real-time data coordination
 * - Site data management
 * - Performance metrics
 *
 * Replaces mixed API patterns in RealtimeDashboard with unified service architecture
 */

import BaseService from '../core/BaseService.js';

export class DashboardService extends BaseService {
  constructor() {
    super('DashboardService', '/dashboard', {
      useCache: true,
      cacheTimeout: 60000, // 1 minute default cache
      apiVersion: 'v1'
    });
  }

  /**
   * Get all widget instances for current user
   * @param {object} filters - Optional filters for widget instances
   * @returns {Promise<FMSResponse<Array>>}
   */
  async getWidgetInstances(filters = {}) {
    try {
      this.logger.debug('Fetching widget instances', { filters });

      const response = await this.get('/widgets/instances', filters, {
        useCache: true,
        cacheTTL: 120000 // 2 minutes cache for widget instances
      });

      if (response.success) {
        this.logger.debug('Widget instances fetched successfully', {
          count: response.data?.length || 0
        });
      }

      return response;

    } catch (error) {
      this.logger.error('Failed to fetch widget instances', error);
      return this.errorHandler.handle(error);
    }
  }

  /**
   * Create new widget instance
   * @param {object} widgetData - Widget configuration data
   * @returns {Promise<FMSResponse<object>>}
   */
  async createWidgetInstance(widgetData) {
    try {
      this.logger.debug('Creating widget instance', {
        widgetType: widgetData.widgetType,
        title: widgetData.title
      });

      // Backend route: POST /api/v1/dashboard/widgets/instances
      const response = await this.post('/widgets/instances', widgetData);

      if (response.success) {
        // Invalidate widget instances cache
        this._invalidateCache('/widgets/instances');

        this.logger.info('Widget instance created successfully', {
          widgetId: response.data?.id
        });
      }

      return response;

    } catch (error) {
      this.logger.error('Failed to create widget instance', error);
      return this.errorHandler.handle(error);
    }
  }

  /**
   * Update existing widget instance
   * @param {number} widgetInstanceId - Widget instance ID
   * @param {object} updateData - Updated widget data
   * @returns {Promise<FMSResponse<object>>}
   */
  async updateWidgetInstance(widgetInstanceId, updateData) {
    try {
      this.logger.debug('Updating widget instance', {
        widgetInstanceId,
        updateData
      });

      // Backend route: PUT /api/v1/dashboard/widgets/instances/{id}
      const response = await this.put(`/widgets/instances/${widgetInstanceId}`, updateData);

      if (response.success) {
        // Invalidate related caches
        this._invalidateCache('/widgets/instances');
        this._invalidateCache(`/widgets/instances/${widgetInstanceId}`);

        this.logger.info('Widget instance updated successfully', { widgetInstanceId });
      }

      return response;

    } catch (error) {
      this.logger.error('Failed to update widget instance', error);
      return this.errorHandler.handle(error);
    }
  }

  /**
   * Delete widget instance
   * @param {number} widgetInstanceId - Widget instance ID
   * @returns {Promise<FMSResponse<boolean>>}
   */
  async deleteWidgetInstance(widgetInstanceId) {
    try {
      this.logger.debug('Deleting widget instance', { widgetInstanceId });

      // Backend route: DELETE /api/v1/dashboard/widgets/instances/{id}
      const response = await this.delete(`/widgets/instances/${widgetInstanceId}`);

      if (response.success) {
        // Invalidate related caches
        this._invalidateCache('/widgets/instances');
        this._invalidateCache(`/widgets/instances/${widgetInstanceId}`);

        this.logger.info('Widget instance deleted successfully', { widgetInstanceId });
      }

      return response;

    } catch (error) {
      this.logger.error('Failed to delete widget instance', error);
      return this.errorHandler.handle(error);
    }
  }

  /**
   * Get dashboard layout for current user
   * @returns {Promise<FMSResponse<object>>}
   */
  async getDashboardLayout() {
    try {
      this.logger.debug('Fetching dashboard layout');

      const response = await this.get('/layout', {}, {
        useCache: true,
        cacheTTL: 300000 // 5 minutes cache for layout
      });

      if (response.success) {
        this.logger.debug('Dashboard layout fetched successfully');
      }

      return response;

    } catch (error) {
      this.logger.error('Failed to fetch dashboard layout', error);
      return this.errorHandler.handle(error);
    }
  }

  /**
   * Update dashboard layout
   * @param {object} layoutData - New layout configuration
   * @returns {Promise<FMSResponse<object>>}
   */
  async updateDashboardLayout(layoutData) {
    try {
      this.logger.debug('Updating dashboard layout', { layoutData });

      const response = await this.put('/layout', layoutData);

      if (response.success) {
        // Invalidate layout cache
        this._invalidateCache('/layout');

        this.logger.info('Dashboard layout updated successfully');
      }

      return response;

    } catch (error) {
      this.logger.error('Failed to update dashboard layout', error);
      return this.errorHandler.handle(error);
    }
  }

  /**
   * Get sites for current user
   * @returns {Promise<FMSResponse<Array>>}
   */
  async getUserSites() {
    try {
      this.logger.debug('Fetching user sites');

      const response = await this.get('/user-sites', {}, {
        useCache: true,
        cacheTTL: 600000 // 10 minutes cache for sites
      });

      if (response.success) {
        this.logger.debug('User sites fetched successfully', {
          count: response.data?.length || 0
        });
      }

      return response;

    } catch (error) {
      this.logger.error('Failed to fetch user sites', error);
      return this.errorHandler.handle(error);
    }
  }

  /**
   * Get widget data with configuration
   * @param {number} widgetInstanceId - Widget instance ID
   * @param {object} config - Widget configuration
   * @returns {Promise<FMSResponse<object>>}
   */
  async getWidgetData(widgetInstanceId, config = {}) {
    try {
      this.logger.debug('Fetching widget data', { widgetInstanceId, config });
      // Backend exposes GET /api/v1/dashboard/widgets/{id}/data (no body). Ignore config for now.
      const response = await this.get(`/widgets/${widgetInstanceId}/data`);

      if (response.success) {
        this.logger.debug('Widget data fetched successfully', {
          widgetInstanceId,
          dataSize: JSON.stringify(response.data || {}).length
        });
      }

      return response;

    } catch (error) {
      this.logger.error('Failed to fetch widget data', error);
      return this.errorHandler.handle(error);
    }
  }

  /**
   * Refresh widget data
   * @param {number} widgetInstanceId - Widget instance ID
   * @returns {Promise<FMSResponse<object>>}
   */
  async refreshWidgetData(widgetInstanceId) {
    try {
      this.logger.debug('Refreshing widget data', { widgetInstanceId });

      // Invalidate widget cache first (old and new keys for safety during transition)
      this._invalidateCache(`/widget-instances/${widgetInstanceId}/data`);
      this._invalidateCache(`/widgets/${widgetInstanceId}/data`);

      // Backend route: POST /api/v1/dashboard/widgets/{id}/refresh
      const response = await this.post(`/widgets/${widgetInstanceId}/refresh`);

      if (response.success) {
        this.logger.info('Widget data refreshed successfully', { widgetInstanceId });
      }

      return response;

    } catch (error) {
      this.logger.error('Failed to refresh widget data', error);
      return this.errorHandler.handle(error);
    }
  }

  /**
   * Get dashboard statistics
   * @returns {Promise<FMSResponse<object>>}
   */
  async getDashboardStatistics() {
    try {
      const response = await this.get('/statistics', {}, {
        useCache: true,
        cacheTTL: 60000 // 1 minute cache for stats
      });

      return response;

    } catch (error) {
      this.logger.error('Failed to fetch dashboard statistics', error);
      return this.errorHandler.handle(error);
    }
  }

  /**
   * Get key performance metrics
   * @param {object} filters - Time range and other filters
   * @returns {Promise<FMSResponse<object>>}
   */
  async getKeyMetrics(filters = {}) {
    try {
      this.logger.debug('Fetching key metrics', { filters });

      const response = await this.get('/metrics', filters, {
        useCache: true,
        cacheTTL: 30000 // 30 seconds cache for metrics
      });

      return response;

    } catch (error) {
      this.logger.error('Failed to fetch key metrics', error);
      return this.errorHandler.handle(error);
    }
  }

  /**
   * Update metric filters for a widget
   * @param {string} category - Metric category
   * @param {string} metricKey - Specific metric key
   * @param {object} filterData - Filter configuration
   * @returns {Promise<FMSResponse<object>>}
   */
  async updateMetricFilter(category, metricKey, filterData) {
    try {
      this.logger.debug('Updating metric filter', { category, metricKey, filterData });

      const response = await this.put(`/metrics/${category}/${metricKey}/filters`, filterData);

      if (response.success) {
        // Invalidate metrics cache
        this._invalidateCache('/metrics');

        this.logger.info('Metric filter updated successfully', { category, metricKey });
      }

      return response;

    } catch (error) {
      this.logger.error('Failed to update metric filter', error);
      return this.errorHandler.handle(error);
    }
  }

  /**
   * Get real-time connection status
   * @returns {Promise<FMSResponse<object>>}
   */
  async getConnectionStatus() {
    try {
      const response = await this.get('/connection-status');
      return response;

    } catch (error) {
      this.logger.error('Failed to get connection status', error);
      return this.errorHandler.handle(error);
    }
  }

  /**
   * Initialize real-time dashboard connection
   * @param {object} connectionConfig - Connection configuration
   * @returns {Promise<FMSResponse<object>>}
   */
  async initializeRealtimeConnection(connectionConfig = {}) {
    try {
      this.logger.debug('Initializing real-time connection', { connectionConfig });

      const response = await this.post('/realtime/initialize', connectionConfig);

      if (response.success) {
        this.logger.info('Real-time connection initialized successfully');
      }

      return response;

    } catch (error) {
      this.logger.error('Failed to initialize real-time connection', error);
      return this.errorHandler.handle(error);
    }
  }

  /**
   * Subscribe to widget data stream
   * @param {number} widgetInstanceId - Widget instance ID
   * @param {object} streamConfig - Stream configuration
   * @returns {Promise<FMSResponse<object>>}
   */
  async subscribeToWidgetStream(widgetInstanceId, streamConfig = {}) {
    try {
      this.logger.debug('Subscribing to widget stream', { widgetInstanceId, streamConfig });
      // NOTE: Streaming endpoint not yet implemented on backend. Placeholder path updated for consistency.
      const response = await this.post(`/widgets/${widgetInstanceId}/stream/subscribe`, streamConfig);

      if (response.success) {
        this.logger.info('Widget stream subscription successful', { widgetInstanceId });
      }

      return response;

    } catch (error) {
      this.logger.error('Failed to subscribe to widget stream', error);
      return this.errorHandler.handle(error);
    }
  }

  /**
   * Unsubscribe from widget data stream
   * @param {number} widgetInstanceId - Widget instance ID
   * @returns {Promise<FMSResponse<boolean>>}
   */
  async unsubscribeFromWidgetStream(widgetInstanceId) {
    try {
      this.logger.debug('Unsubscribing from widget stream', { widgetInstanceId });
      // NOTE: Streaming endpoint not yet implemented on backend. Placeholder path updated for consistency.
      const response = await this.delete(`/widgets/${widgetInstanceId}/stream/unsubscribe`);

      if (response.success) {
        this.logger.info('Widget stream unsubscription successful', { widgetInstanceId });
      }

      return response;

    } catch (error) {
      this.logger.error('Failed to unsubscribe from widget stream', error);
      return this.errorHandler.handle(error);
    }
  }

  /**
   * Get available widget types
   * @returns {Promise<FMSResponse<Array>>}
   */
  async getAvailableWidgetTypes() {
    try {
      const response = await this.get('/widgets/factory/types', {}, {
        useCache: true,
        cacheTTL: 3600000 // 1 hour cache for widget types
      });

      return response;

    } catch (error) {
      this.logger.error('Failed to fetch available widget types', error);
      return this.errorHandler.handle(error);
    }
  }

  /**
   * Get available widgets (alias for getAvailableWidgetTypes for compatibility)
   * @returns {Promise<FMSResponse<Array>>}
   */
  async getAvailableWidgets() {
    try {
      this.logger.debug('Attempting to fetch available widgets/widget types');

      // Try the widget factory types endpoint first
      const response = await this.getAvailableWidgetTypes();

      if (response.success) {
        this.logger.debug('Successfully fetched widget types', { count: response.data?.length || 0 });
        return response;
      }

      // If that fails, return a fallback response
      this.logger.warn('Failed to fetch widget types, providing fallback');
      return {
        success: true,
        data: [], // Empty array as fallback
        message: 'Widget types not available',
        errors: []
      };

    } catch (error) {
      this.logger.error('Failed to fetch available widgets', error);

      // Check if it's a permission error
      if (error.response?.status === 403) {
        return {
          success: false,
          data: null,
          message: 'Access denied: You do not have permission to view dashboard widgets',
          errors: ['INSUFFICIENT_PERMISSIONS'],
          errorType: 'PERMISSION_DENIED'
        };
      }

      return this.errorHandler.handle(error);
    }
  }

  /**
   * Get dashboard permissions for current user
   * @returns {Promise<FMSResponse<object>>}
   */
  async getDashboardPermissions() {
    try {
      const response = await this.get('/permissions', {}, {
        useCache: true,
        cacheTTL: 300000 // 5 minutes cache for permissions
      });

      return response;

    } catch (error) {
      this.logger.error('Failed to fetch dashboard permissions', error);
      return this.errorHandler.handle(error);
    }
  }

  /**
   * Health check for dashboard service
   * @returns {Promise<FMSResponse<object>>}
   */
  async healthCheck() {
    try {
      const response = await this.get('/health');
      return response;
    } catch (error) {
      return this.errorHandler.handle(error);
    }
  }

  /**
   * Clear all dashboard-related cache
   */
  clearDashboardCache() {
    this.clearCache();
    this.logger.info('Dashboard cache cleared');
  }

  /**
   * Get cache statistics for dashboard service
   * @returns {object}
   */
  getDashboardCacheStats() {
    return {
      ...this.getCacheStats(),
      serviceName: 'DashboardService'
    };
  }
}

export default DashboardService;