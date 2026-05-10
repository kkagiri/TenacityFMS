/**
 * Widget Factory Service
 * Enhanced service for widget data acquisition using the Widget Factory pattern
 */
import axiosInstance from '../api/axiosInstance';
import dataSourceService from './dataSourceService';

class WidgetFactoryService {
  constructor() {
    this.validationTimers = new Map();
  }

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
   * Debounced validation helper used for on-change validation in configuration UI.
   * M1 implementation returns a stubbed success response while wiring is completed.
   * @param {Object} config - Current widget configuration snapshot
    * @param {Object} options - Options controlling debounce behavior
   * @param {string} [options.cacheKey='default'] - Identifier for debouncing distinct forms
   * @param {number} [options.debounceMs=300] - Debounce interval in milliseconds
   * @returns {Promise<Object>} Validation outcome { isValid, errors, suggestions, normalizedConfig }
   */
  validateOnChange(config, options = {}) {
    const { cacheKey = 'default', debounceMs = 300, useServerFallback = false } = options;

    const runValidation = async () => {
      try {
        // Defensive parsing of expected shape
        const dataSource = config?.dataSource || config?.metric;
        const widgetType = config?.widgetType || config?.visualizationType;
        const settings = { ...(config?.settings || {}) };
        const filters = { ...(config?.filters || {}) };

        if (!dataSource) {
          return {
            isValid: false,
            errors: [{ field: 'dataSource', code: 'required', message: 'Please select a data source' }],
            suggestions: [],
            normalizedConfig: { ...config }
          };
        }

        // Pull metadata from cache/api
        const meta = await dataSourceService.getDataSourceMetadata(dataSource);
        if (!meta) {
          // No metadata: permissive success to avoid blocking UX
          return { isValid: true, errors: [], suggestions: [], normalizedConfig: { ...config } };
        }

        const errors = [];
        const suggestions = [];
        const normalized = { ...config, settings: { ...settings }, filters: { ...filters } };

        // Normalize Mode
        const supportedModes = meta.supportedModes || meta.SupportedModes || [];
        const defaultMode = meta.defaultMode || meta.DefaultMode || 'historical_snapshot';
        const incomingMode = settings.mode || defaultMode;
        if (supportedModes.length > 0 && !supportedModes.includes(incomingMode)) {
          suggestions.push({ field: 'settings.mode', message: `Mode '${incomingMode}' not supported; switching to '${defaultMode}'`, value: defaultMode });
          normalized.settings.mode = defaultMode;
          errors.push({ field: 'settings.mode', code: 'unsupported', message: `Mode '${incomingMode}' is not supported for ${dataSource}` });
        } else {
          normalized.settings.mode = incomingMode;
        }

        // Aggregation
        const supportedAggs = meta.supportedAggregations || meta.SupportedAggregations || ['sum'];
        const defaultAgg = meta.defaultAggregation || meta.DefaultAggregation || supportedAggs[0] || 'sum';
        const incomingAgg = settings.aggregation || defaultAgg;
        if (!supportedAggs.includes(incomingAgg)) {
          suggestions.push({ field: 'settings.aggregation', message: `Aggregation '${incomingAgg}' not supported; switching to '${defaultAgg}'`, value: defaultAgg });
          normalized.settings.aggregation = defaultAgg;
          errors.push({ field: 'settings.aggregation', code: 'unsupported', message: `Aggregation '${incomingAgg}' is not supported for ${dataSource}` });
        } else {
          normalized.settings.aggregation = incomingAgg;
        }

        // Granularity
        const supportedGrans = meta.supportedGranularities || meta.SupportedGranularities || ['day'];
        const defaultGran = meta.defaultGranularity || meta.DefaultGranularity || supportedGrans[0] || 'day';
        const incomingGran = settings.granularity || defaultGran;
        if (!supportedGrans.includes(incomingGran)) {
          suggestions.push({ field: 'settings.granularity', message: `Granularity '${incomingGran}' not supported; switching to '${defaultGran}'`, value: defaultGran });
          normalized.settings.granularity = defaultGran;
          errors.push({ field: 'settings.granularity', code: 'unsupported', message: `Granularity '${incomingGran}' is not supported for ${dataSource}` });
        } else {
          normalized.settings.granularity = incomingGran;
        }

        // Units
        const supportedUnits = meta.supportedUnits || meta.SupportedUnits || [];
        const recommendedUnits = meta.recommendedUnits || meta.RecommendedUnits || supportedUnits;
        const defaultUnit = (recommendedUnits && recommendedUnits[0]) || meta.unit || meta.Unit;
        const incomingUnit = settings.unit || defaultUnit;
        if (supportedUnits.length > 0 && !supportedUnits.includes(incomingUnit)) {
          suggestions.push({ field: 'settings.unit', message: `Unit '${incomingUnit}' not supported; switching to '${defaultUnit}'`, value: defaultUnit });
          normalized.settings.unit = defaultUnit;
          errors.push({ field: 'settings.unit', code: 'unsupported', message: `Unit '${incomingUnit}' is not supported for ${dataSource}` });
        } else if (!settings.unit && defaultUnit) {
          // smart default if user hasn't chosen
          normalized.settings.unit = defaultUnit;
          suggestions.push({ field: 'settings.unit', message: `Unit set to recommended '${defaultUnit}'`, value: defaultUnit });
        }

        // Date preset and implied window/granularity sanity
        const recommendations = meta.recommendations || meta.Recommendations || {};
        const recPreset = recommendations.datePreset || 'last_7_days';
        const recGran = recommendations.granularity || defaultGran;
        const incomingPreset = settings.datePreset || recPreset;
        normalized.settings.datePreset = incomingPreset;
        if (!settings.granularity) {
          normalized.settings.granularity = recGran;
        }

        // Window enforcement using meta MinWindow/MaxWindow if available
        const minW = meta.minWindow || meta.MinWindow;
        const maxW = meta.maxWindow || meta.MaxWindow;
        if (minW || maxW) {
          const windowMs = this.#estimateWindowMsFromPreset(incomingPreset);
          if (minW && windowMs && windowMs < this.#timeSpanToMs(minW)) {
            errors.push({ field: 'settings.datePreset', code: 'window_too_small', message: `Selected preset is smaller than minimum window` });
            suggestions.push({ field: 'settings.datePreset', message: `Try a broader preset like '${recPreset}'`, value: recPreset });
          }
          if (maxW && windowMs && windowMs > this.#timeSpanToMs(maxW)) {
            errors.push({ field: 'settings.datePreset', code: 'window_too_large', message: `Selected preset exceeds maximum window` });
            suggestions.push({ field: 'settings.datePreset', message: `Try a narrower preset like 'last_30_days'`, value: 'last_30_days' });
          }
        }

        // Required filters
        if (meta.requiresSiteFilter || meta.RequiresSiteFilter) {
          if (!Array.isArray(filters.siteIds) || filters.siteIds.length === 0) {
            errors.push({ field: 'filters.siteIds', code: 'required', message: 'At least one site is required for this data source' });
          }
        }
        if (meta.requiresVehicleFilter || meta.RequiresVehicleFilter) {
          const vehicleIds = filters.vehicleIds || filters.vehicleTypeIds;
          if (!Array.isArray(vehicleIds) || vehicleIds.length === 0) {
            errors.push({ field: 'filters.vehicleIds', code: 'required', message: 'At least one vehicle filter is required for this data source' });
          }
        }

        const isValid = errors.length === 0;

        // Optional server-side validation as fallback (M2+)
        if (useServerFallback && !isValid) {
          try {
            const server = await this.validateWidgetConfiguration({
              widgetType,
              category: config?.category,
              dataSource,
              filters: normalized.filters,
              settings: normalized.settings,
              mode: normalized.settings.mode,
              aggregationType: normalized.settings.aggregation
            });
            if (server && server.validationErrors?.length) {
              server.validationErrors.forEach(msg => errors.push({ field: 'server', code: 'server_validation', message: msg }));
            }
          } catch (_) { /* ignore server fallback errors */ }
        }

        return { isValid, errors, suggestions, normalizedConfig: normalized };
      } catch (e) {
        return { isValid: true, errors: [], suggestions: [], normalizedConfig: { ...config } };
      }
    };

    return new Promise((resolve) => {
      const timerKey = `${cacheKey}`;
      if (this.validationTimers.has(timerKey)) {
        clearTimeout(this.validationTimers.get(timerKey));
      }

      const timer = setTimeout(async () => {
        this.validationTimers.delete(timerKey);
        const result = await runValidation();
        resolve(result);
      }, debounceMs);

      this.validationTimers.set(timerKey, timer);
    });
  }

  // --- Private helpers ---
  #estimateWindowMsFromPreset(preset) {
    switch ((preset || '').toLowerCase()) {
      case 'today':
        return 24 * 60 * 60 * 1000;
      case 'yesterday':
        return 24 * 60 * 60 * 1000;
      case 'last_7_days':
        return 7 * 24 * 60 * 60 * 1000;
      case 'last_30_days':
        return 30 * 24 * 60 * 60 * 1000;
      case 'this_week':
        return 7 * 24 * 60 * 60 * 1000; // approx
      case 'this_month':
        return 31 * 24 * 60 * 60 * 1000; // approx
      default:
        return null;
    }
  }

  #timeSpanToMs(ts) {
    // Supports TimeSpan serialized as 'hh:mm:ss' or an object { hours, minutes, seconds, days }
    if (!ts) return null;
    if (typeof ts === 'string' && ts.includes(':')) {
      const parts = ts.split(':').map(Number);
      const [h, m, s] = parts;
      return ((h || 0) * 3600 + (m || 0) * 60 + (s || 0)) * 1000;
    }
    if (typeof ts === 'object') {
      const d = ts.days || ts.Days || 0;
      const h = ts.hours || ts.Hours || 0;
      const m = ts.minutes || ts.Minutes || 0;
      const s = ts.seconds || ts.Seconds || 0;
      return ((d * 24 + h) * 3600 + m * 60 + s) * 1000;
    }
    if (typeof ts === 'number') return ts; // already ms
    return null;
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

  cancelValidation(cacheKey = 'default') {
    const timerKey = `${cacheKey}`;
    const timer = this.validationTimers.get(timerKey);
    if (timer) {
      clearTimeout(timer);
      this.validationTimers.delete(timerKey);
    }
  }
}

// Export singleton instance
export default new WidgetFactoryService();
