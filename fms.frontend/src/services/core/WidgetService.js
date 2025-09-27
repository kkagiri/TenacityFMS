/**
 * WidgetService - Widget-specific service for dashboard operations
 *
 * Handles widget lifecycle, data management, and configuration.
 * Extends BaseService with widget-specific functionality.
 */

import BaseService from '../core/BaseService';

export class WidgetService extends BaseService {
  constructor(config = {}) {
    super({
      ...config,
      baseUrl: '/api/v1/dashboard/widgets',
      serviceName: 'WidgetService'
    });

    // Widget data cache with TTL
    this.widgetDataCache = new Map();
    this.widgetMetadataCache = new Map();
    this.cacheTimeout = config.cacheTimeout || 30000; // 30 seconds default
  }

  /**
   * Get all available widget templates
   * @returns {Promise<FMSResponse>} Available widget templates
   */
  async getWidgetTemplates() {
    try {
      const cacheKey = 'widget-templates';
      const cached = this.getCachedItem(cacheKey);

      if (cached) {
        return cached;
      }

      const response = await this.get('/templates');

      if (response.success) {
        this.setCachedItem(cacheKey, response, 300000); // Cache for 5 minutes
      }

      return response;
    } catch (error) {
      this.logger.error('Error fetching widget templates:', error);
      return this.handleError(error, 'Failed to fetch widget templates');
    }
  }

  /**
   * Get widget instances for current user
   * @returns {Promise<FMSResponse>} User's widget instances
   */
  async getWidgetInstances() {
    try {
      const cacheKey = 'widget-instances';
      const cached = this.getCachedItem(cacheKey);

      if (cached) {
        return cached;
      }

      const response = await this.get('/instances');

      if (response.success) {
        this.setCachedItem(cacheKey, response, 60000); // Cache for 1 minute
      }

      return response;
    } catch (error) {
      this.logger.error('Error fetching widget instances:', error);
      return this.handleError(error, 'Failed to fetch widget instances');
    }
  }

  /**
   * Get data for a specific widget instance
   * @param {string|number} widgetInstanceId - Widget instance ID
   * @param {Object} config - Widget configuration
   * @param {Object} filters - Additional filters
   * @returns {Promise<FMSResponse>} Widget data
   */
  async getWidgetData(widgetInstanceId, config = {}, filters = {}) {
    try {
      const cacheKey = `widget-data-${widgetInstanceId}`;
      const cached = this.getCachedItem(cacheKey);

      if (cached && !config.forceRefresh) {
        return cached;
      }

      const payload = {
        configuration: config,
        filters: filters,
        timestamp: new Date().toISOString()
      };

      const response = await this.post(`/instances/${widgetInstanceId}/data`, payload);

      if (response.success) {
        // Cache widget data with shorter TTL
        this.setCachedItem(cacheKey, response, this.cacheTimeout);

        // Store in widget data cache for real-time updates
        this.widgetDataCache.set(widgetInstanceId.toString(), {
          data: response.data,
          lastUpdated: new Date(),
          config: config
        });
      }

      return response;
    } catch (error) {
      this.logger.error(`Error fetching data for widget ${widgetInstanceId}:`, error);
      return this.handleError(error, `Failed to fetch widget data for ${widgetInstanceId}`);
    }
  }

  /**
   * Create a new widget instance
   * @param {Object} widgetData - Widget configuration data
   * @returns {Promise<FMSResponse>} Created widget instance
   */
  async createWidgetInstance(widgetData) {
    try {
      const response = await this.post('/instances', widgetData);

      if (response.success) {
        // Clear instances cache to force refresh
        this.clearCacheByPattern('widget-instances');
        this.logger.info(`Widget instance created: ${response.data.id}`);
      }

      return response;
    } catch (error) {
      this.logger.error('Error creating widget instance:', error);
      return this.handleError(error, 'Failed to create widget instance');
    }
  }

  /**
   * Update an existing widget instance
   * @param {string|number} widgetInstanceId - Widget instance ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<FMSResponse>} Updated widget instance
   */
  async updateWidgetInstance(widgetInstanceId, updateData) {
    try {
      const response = await this.put(`/instances/${widgetInstanceId}`, updateData);

      if (response.success) {
        // Clear related caches
        this.clearCacheByPattern('widget-instances');
        this.clearCacheByPattern(`widget-data-${widgetInstanceId}`);
        this.logger.info(`Widget instance updated: ${widgetInstanceId}`);
      }

      return response;
    } catch (error) {
      this.logger.error(`Error updating widget instance ${widgetInstanceId}:`, error);
      return this.handleError(error, `Failed to update widget instance ${widgetInstanceId}`);
    }
  }

  /**
   * Delete a widget instance
   * @param {string|number} widgetInstanceId - Widget instance ID
   * @returns {Promise<FMSResponse>} Deletion result
   */
  async deleteWidgetInstance(widgetInstanceId) {
    try {
      const response = await this.delete(`/instances/${widgetInstanceId}`);

      if (response.success) {
        // Clear related caches
        this.clearCacheByPattern('widget-instances');
        this.clearCacheByPattern(`widget-data-${widgetInstanceId}`);
        this.widgetDataCache.delete(widgetInstanceId.toString());
        this.logger.info(`Widget instance deleted: ${widgetInstanceId}`);
      }

      return response;
    } catch (error) {
      this.logger.error(`Error deleting widget instance ${widgetInstanceId}:`, error);
      return this.handleError(error, `Failed to delete widget instance ${widgetInstanceId}`);
    }
  }

  /**
   * Get widget configuration schema
   * @param {string} templateId - Widget template ID
   * @returns {Promise<FMSResponse>} Configuration schema
   */
  async getWidgetConfigurationSchema(templateId) {
    try {
      const cacheKey = `widget-schema-${templateId}`;
      const cached = this.getCachedItem(cacheKey);

      if (cached) {
        return cached;
      }

      const response = await this.get(`/templates/${templateId}/schema`);

      if (response.success) {
        this.setCachedItem(cacheKey, response, 600000); // Cache for 10 minutes
      }

      return response;
    } catch (error) {
      this.logger.error(`Error fetching schema for template ${templateId}:`, error);
      return this.handleError(error, `Failed to fetch configuration schema for ${templateId}`);
    }
  }

  /**
   * Validate widget configuration
   * @param {string} templateId - Widget template ID
   * @param {Object} configuration - Configuration to validate
   * @returns {Promise<FMSResponse>} Validation result
   */
  async validateWidgetConfiguration(templateId, configuration) {
    try {
      const payload = {
        templateId,
        configuration
      };

      const response = await this.post('/validate-configuration', payload);
      return response;
    } catch (error) {
      this.logger.error('Error validating widget configuration:', error);
      return this.handleError(error, 'Failed to validate widget configuration');
    }
  }

  /**
   * Get widget performance metrics
   * @param {string|number} widgetInstanceId - Widget instance ID
   * @param {string} timeRange - Time range for metrics (1h, 6h, 24h, 7d)
   * @returns {Promise<FMSResponse>} Performance metrics
   */
  async getWidgetMetrics(widgetInstanceId, timeRange = '24h') {
    try {
      const response = await this.get(`/instances/${widgetInstanceId}/metrics?timeRange=${timeRange}`);
      return response;
    } catch (error) {
      this.logger.error(`Error fetching metrics for widget ${widgetInstanceId}:`, error);
      return this.handleError(error, `Failed to fetch widget metrics`);
    }
  }

  /**
   * Refresh widget data (bypass cache)
   * @param {string|number} widgetInstanceId - Widget instance ID
   * @param {Object} config - Widget configuration
   * @returns {Promise<FMSResponse>} Fresh widget data
   */
  async refreshWidgetData(widgetInstanceId, config = {}) {
    // Clear cache for this widget
    this.clearCacheByPattern(`widget-data-${widgetInstanceId}`);
    this.widgetDataCache.delete(widgetInstanceId.toString());

    // Fetch fresh data
    return this.getWidgetData(widgetInstanceId, { ...config, forceRefresh: true });
  }

  /**
   * Get cached widget data
   * @param {string|number} widgetInstanceId - Widget instance ID
   * @returns {Object|null} Cached widget data
   */
  getCachedWidgetData(widgetInstanceId) {
    return this.widgetDataCache.get(widgetInstanceId.toString()) || null;
  }

  /**
   * Update cached widget data (for real-time updates)
   * @param {string|number} widgetInstanceId - Widget instance ID
   * @param {Object} data - New data
   * @param {Object} metadata - Additional metadata
   */
  updateCachedWidgetData(widgetInstanceId, data, metadata = {}) {
    const existingCache = this.widgetDataCache.get(widgetInstanceId.toString());

    this.widgetDataCache.set(widgetInstanceId.toString(), {
      data: data,
      lastUpdated: new Date(),
      config: existingCache?.config || {},
      metadata: {
        ...existingCache?.metadata,
        ...metadata,
        isRealtime: true
      }
    });
  }

  /**
   * Bulk refresh multiple widgets
   * @param {Array<string|number>} widgetInstanceIds - Array of widget instance IDs
   * @returns {Promise<Object>} Results map
   */
  async bulkRefreshWidgets(widgetInstanceIds) {
    const results = {};

    const refreshPromises = widgetInstanceIds.map(async (widgetId) => {
      try {
        const result = await this.refreshWidgetData(widgetId);
        results[widgetId] = result;
      } catch (error) {
        results[widgetId] = this.handleError(error, `Failed to refresh widget ${widgetId}`);
      }
    });

    await Promise.allSettled(refreshPromises);
    return results;
  }

  /**
   * Get widget data from cache or fetch if not available
   * @param {string|number} widgetInstanceId - Widget instance ID
   * @param {Object} config - Widget configuration
   * @returns {Promise<FMSResponse>|Object} Widget data
   */
  async getWidgetDataWithFallback(widgetInstanceId, config = {}) {
    // Try cache first
    const cached = this.getCachedWidgetData(widgetInstanceId);
    if (cached && !this.isCacheExpired(cached.lastUpdated)) {
      return {
        success: true,
        data: cached.data,
        metadata: { ...cached.metadata, fromCache: true }
      };
    }

    // Fetch fresh data
    return this.getWidgetData(widgetInstanceId, config);
  }

  /**
   * Check if cached data is expired
   * @param {Date} lastUpdated - Last update timestamp
   * @returns {boolean} True if expired
   */
  isCacheExpired(lastUpdated) {
    const now = new Date();
    const diff = now.getTime() - lastUpdated.getTime();
    return diff > this.cacheTimeout;
  }

  /**
   * Clear all widget-related caches
   */
  clearWidgetCaches() {
    this.widgetDataCache.clear();
    this.widgetMetadataCache.clear();
    this.clearCacheByPattern('widget-');
  }

  /**
   * Cleanup service resources
   */
  cleanup() {
    this.clearWidgetCaches();
    super.cleanup && super.cleanup();
  }

  /**
   * Get service statistics
   * @returns {Object} Service statistics
   */
  getStatistics() {
    return {
      ...super.getStatistics(),
      widgetDataCacheSize: this.widgetDataCache.size,
      widgetMetadataCacheSize: this.widgetMetadataCache.size,
      cacheTimeout: this.cacheTimeout
    };
  }
}

export default WidgetService;