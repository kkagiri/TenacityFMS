/**
 * Widget Factory Service
 * Enhanced service for widget data acquisition using the Widget Factory pattern
 */
import axiosInstance from './axiosConfig';

class WidgetFactoryService {
  /**
   * Get widget data using the Widget Factory system
   * @param {Object} request - Widget factory request
   * @returns {Promise<Object>} Widget data result
   */
  async getWidgetData(request) {
    try {
      console.log('WidgetFactory: Requesting data for widget', request);

      const response = await axiosInstance.post('/dashboard/widgets/factory/data', {
        widgetType: request.widgetType,
        category: request.category,
        dataSource: request.dataSource,
        filters: request.filters || {},
        settings: request.settings || {},
        timeRange: request.timeRange || 'yesterday',
        mode: request.mode || 'cumulative'
      });

      if (response.data && response.data.success) {
        console.log('WidgetFactory: Successfully received data', response.data);
        return {
          success: true,
          data: response.data.data,
          processedFilters: response.data.processedFilters,
          processedSettings: response.data.processedSettings,
          aggregationType: response.data.aggregationType,
          dataQueryType: response.data.dataQueryType,
          metadata: response.data.metadata,
          timestamp: response.data.timestamp
        };
      } else {
        console.warn('WidgetFactory: Request failed', response.data);
        return {
          success: false,
          error: response.data?.message || 'Failed to get widget data',
          validationErrors: response.data?.validationErrors || []
        };
      }
    } catch (error) {
      console.error('WidgetFactory: Network error', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Network error',
        networkError: true
      };
    }
  }

  /**
   * Validate widget configuration
   * @param {Object} request - Validation request
   * @returns {Promise<Object>} Validation result
   */
  async validateWidgetConfiguration(request) {
    try {
      console.log('WidgetFactory: Validating configuration', request);

      const response = await axiosInstance.post('/dashboard/widgets/factory/validate', {
        widgetType: request.widgetType,
        category: request.category,
        dataSource: request.dataSource,
        filters: request.filters || {},
        settings: request.settings || {},
        mode: request.mode || 'cumulative',
        aggregationType: request.aggregationType || 'sum'
      });

      return {
        isValid: response.data.success,
        message: response.data.message,
        validationErrors: response.data.validationErrors || [],
        timestamp: response.data.timestamp
      };
    } catch (error) {
      console.error('WidgetFactory: Validation error', error);
      return {
        isValid: false,
        message: error.response?.data?.message || error.message || 'Validation error',
        validationErrors: [error.message],
        networkError: true
      };
    }
  }

  /**
   * Get available widget types from the factory
   * @returns {Promise<Object>} Available widget types
   */
  async getAvailableWidgetTypes() {
    try {
      console.log('WidgetFactory: Getting available widget types');

      const response = await axiosInstance.get('/dashboard/widgets/factory/types');

      if (response.data && response.data.success) {
        return {
          success: true,
          widgetTypes: response.data.data,
          count: response.data.count,
          timestamp: response.data.timestamp
        };
      } else {
        return {
          success: false,
          error: 'Failed to get widget types'
        };
      }
    } catch (error) {
      console.error('WidgetFactory: Error getting widget types', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Network error',
        networkError: true
      };
    }
  }

  /**
   * Build widget request from widget instance
   * @param {Object} widgetInstance - Widget instance from database
   * @param {Object} overrides - Optional overrides for filters/settings
   * @returns {Object} Widget factory request
   */
  buildRequestFromInstance(widgetInstance, overrides = {}) {
    try {
      // Parse configuration
      let config = {};
      if (widgetInstance.configurationJson) {
        try {
          config = JSON.parse(widgetInstance.configurationJson);
        } catch (e) {
          console.warn('Failed to parse widget configuration:', e);
        }
      }

      // Extract template information
      const template = widgetInstance.template || {};

      return {
        widgetType: template.type || template.widgetType || widgetInstance.templateType,
        category: template.category || config.category || 'general',
        dataSource: template.dataSource || config.dataSource,
        filters: {
          ...(config.filters || {}),
          ...(overrides.filters || {})
        },
        settings: {
          ...(config.settings || {}),
          ...(overrides.settings || {})
        },
        timeRange: overrides.timeRange || config.timeRange || 'yesterday',
        mode: overrides.mode || config.mode || 'cumulative'
      };
    } catch (error) {
      console.error('WidgetFactory: Error building request from instance', error);
      return null;
    }
  }

  /**
   * Check if a widget should use the factory system
   * @param {Object} widgetInstance - Widget instance
   * @returns {boolean} True if should use factory
   */
  shouldUseFactory(widgetInstance) {
    try {
      // Check if widget has factory-compatible configuration
      const template = widgetInstance.template || {};
      const factoryTypes = [
        'CHART_LINE_TREND',
        'CHART_BAR_COMPARISON',
        'CHART_PIE_DISTRIBUTION',
        'BIG_STAT_CARD',
        'ticker',
        'DATA_TABLE_DETAILED',
        'PROGRESS_LIST',
        'ALERT_NOTIFICATION'
      ];

      const widgetType = template.type || template.widgetType || widgetInstance.templateType;

      return factoryTypes.includes(widgetType) && template.dataSource;
    } catch (error) {
      console.warn('WidgetFactory: Error checking factory compatibility', error);
      return false;
    }
  }
}

// Export singleton instance
export default new WidgetFactoryService();
