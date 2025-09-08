import signalRService from './signalRService';
import dataSourceService from './dataSourceService'; // Phase 2 unified service

/**
 * Optimized Widget Data Service
 * Manages data fetching for widgets with proper SignalR/API integration
 * Reduces unnecessary API calls and implements proper caching
 */
class OptimizedWidgetDataService {
  constructor() {
    this.cache = new Map();
    this.intervals = new Map();
    this.liveSubscriptions = new Set();

    // Cache durations
    this.LIVE_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for live mode
    this.CUMULATIVE_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes for cumulative mode
  }

  /**
   * Get data for a widget with optimized fetching strategy
   * @param {Object} widget - Widget configuration
   * @param {boolean} forceRefresh - Force refresh even if cached
   * @returns {Promise<Object>} Widget data
   */
  async getWidgetData(widget, forceRefresh = false) {
    const cacheKey = this.generateCacheKey(widget);
    const now = Date.now();

    // Check cache first
    if (!forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      const cacheDuration = widget.mode === 'live' ? this.LIVE_CACHE_DURATION : this.CUMULATIVE_CACHE_DURATION;

      if ((now - cached.timestamp) < cacheDuration) {
        return cached.data;
      }
    }

    // For live mode, try SignalR first
    if (widget.mode === 'live' && signalRService.getConnectionStatus()) {
      try {
        const realtimeData = await this.getRealtimeData(widget);
        if (realtimeData) {
          this.setCache(cacheKey, realtimeData);
          return realtimeData;
        }
      } catch (error) {
        console.warn('Failed to get real-time data, falling back to API:', error);
      }
    }

    // Fallback to API
    try {
      // Use dataSourceService for unified data source management
      const dashboardRequest = {
        metricType: widget.metric,
        mode: widget.mode || 'cumulative',
        datePreset: widget.datePreset || 'today',
        siteIds: widget.siteIds,
        vehicleIds: widget.vehicleTypeIds
      };
      
      const apiData = await dataSourceService.getInitialData(widget.metric, {}, dashboardRequest);
      this.setCache(cacheKey, apiData);
      return apiData;
    } catch (error) {
      console.error('Failed to get widget data from API:', error);
      throw error;
    }
  }

  /**
   * Get real-time data from SignalR
   * @param {Object} widget - Widget configuration
   * @returns {Promise<Object|null>} Real-time data or null
   */
  async getRealtimeData(widget) {
    if (!signalRService.getConnectionStatus()) {
      return null;
    }

    try {
      // Request current metrics from SignalR
      const realtimeData = await signalRService.send('RequestCurrentMetrics', [widget.metric]);

      if (realtimeData && realtimeData[widget.metric] !== undefined) {
        return {
          metric: widget.metric,
          value: realtimeData[widget.metric],
          unit: this.getUnitForMetric(widget.metric),
          period: 'Live',
          status: 'success',
          lastUpdated: new Date().toISOString(),
          additionalInfo: {
            is_live: true,
            mode: 'live',
            source: 'signalr'
          }
        };
      }
    } catch (error) {
      console.warn('SignalR request failed:', error);
    }

    return null;
  }

  /**
   * Set up automatic refresh for cumulative mode widgets
   * @param {Object} widget - Widget configuration
   * @param {Function} refreshCallback - Callback to refresh data
   */
  setupAutoRefresh(widget, refreshCallback) {
    if (widget.mode !== 'cumulative') return;

    const intervalKey = `${widget.id}_${widget.metric}`;

    // Clear existing interval
    this.clearAutoRefresh(intervalKey);

    // Set up new interval
    const interval = setInterval(async () => {
      try {
        console.log(`Auto-refreshing cumulative data for widget ${widget.id}`);
        const data = await this.getWidgetData(widget, true);
        refreshCallback(data);
      } catch (error) {
        console.error(`Auto-refresh failed for widget ${widget.id}:`, error);
      }
    }, this.CUMULATIVE_CACHE_DURATION);

    this.intervals.set(intervalKey, interval);
  }

  /**
   * Clear automatic refresh for a widget
   * @param {string} intervalKey - Interval key
   */
  clearAutoRefresh(intervalKey) {
    if (this.intervals.has(intervalKey)) {
      clearInterval(this.intervals.get(intervalKey));
      this.intervals.delete(intervalKey);
    }
  }

  /**
   * Subscribe to live metrics for a widget
   * @param {Object} widget - Widget configuration
   * @param {Function} updateCallback - Callback for live updates
   */
  subscribeToLiveUpdates(widget, updateCallback) {
    if (widget.mode !== 'live') return;

    const subscriptionKey = `${widget.metric}_${widget.id}`;

    if (!this.liveSubscriptions.has(subscriptionKey)) {
      // Set up SignalR event listener for this metric
      signalRService.on(`${widget.metric}Update`, (data) => {
        const normalizedData = {
          metric: widget.metric,
          value: data.value || data,
          unit: this.getUnitForMetric(widget.metric),
          period: 'Live',
          status: 'success',
          lastUpdated: new Date().toISOString(),
          additionalInfo: {
            is_live: true,
            mode: 'live',
            source: 'signalr'
          }
        };

        updateCallback(normalizedData);
      });

      this.liveSubscriptions.add(subscriptionKey);
    }
  }

  /**
   * Unsubscribe from live updates for a widget
   * @param {Object} widget - Widget configuration
   */
  unsubscribeFromLiveUpdates(widget) {
    const subscriptionKey = `${widget.metric}_${widget.id}`;
    this.liveSubscriptions.delete(subscriptionKey);
  }

  /**
   * Generate cache key for widget
   * @param {Object} widget - Widget configuration
   * @returns {string} Cache key
   */
  generateCacheKey(widget) {
    return `${widget.id}_${widget.metric}_${widget.mode}_${widget.datePreset}_${widget.sitesMode}_${JSON.stringify(widget.siteIds || [])}`;
  }

  /**
   * Set data in cache
   * @param {string} key - Cache key
   * @param {Object} data - Data to cache
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Get unit for metric
   * @param {string} metric - Metric name
   * @returns {string} Unit
   */
  getUnitForMetric(metric) {
    const unitMap = {
      fuel_dispense: 'L',
      fuel_used_gps: 'L',
      engine_hours: 'hrs',
      km_travel: 'km',
      idling: 'min'
    };
    return unitMap[metric] || '';
  }

  /**
   * Clear all caches and intervals
   */
  clearAll() {
    this.cache.clear();

    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();

    this.liveSubscriptions.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      activeIntervals: this.intervals.size,
      liveSubscriptions: this.liveSubscriptions.size
    };
  }
}

// Create and export singleton instance
const optimizedWidgetDataService = new OptimizedWidgetDataService();
export default optimizedWidgetDataService;

// Export the class for testing
export { OptimizedWidgetDataService };
