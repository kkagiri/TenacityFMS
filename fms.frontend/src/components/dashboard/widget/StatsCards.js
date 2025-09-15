import React, { useEffect, useState, useCallback } from "react";
import dashboardSignalRService from '../../../signalR/dashboardSignalRService';
import optimizedWidgetDataService from '../../../services/OptimizedWidgetDataService';
import dashboardMetricsService from '../../../services/DashboardMetricsService'; // Legacy support
import dataSourceService from '../../../services/dataSourceService'; // Phase 2 unified service

//claude - created stats cards component with key metrics and real-time support

export const StatsCards = ({ pdTotals, stats, filterConfig, filters, sites = [], metricFilters, realtimeData = {} }) => {
  // Format numbers with commas
  const formatNumber = (num) => {
    return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
  };

  // Helper functions for metric styling
  const getMetricIcon = (metric) => {
    const iconMap = {
      fuel_dispense: 'fa-solid fa-droplet',
      engine_hours: 'fa-solid fa-clock',
      km_travel: 'fa-solid fa-arrow-trend-up',
      fuel_used_gps: 'fa-solid fa-gas-pump',
      idling: 'fa-solid fa-pause',
      pending_issues: 'fa-solid fa-triangle-exclamation',
      active_alerts: 'fa-solid fa-bell'
    };
    return iconMap[metric] || 'fa-solid fa-chart-bar';
  };

  const getMetricIconColor = (metric) => {
    const colorMap = {
      fuel_dispense: '#2196f3',
      engine_hours: '#9c27b0',
      km_travel: '#4caf50',
      fuel_used_gps: '#ff9800',
      idling: '#795548',
      pending_issues: '#e91e63',
      active_alerts: '#f44336'
    };
    return colorMap[metric] || '#666';
  };

  const getMetricBgColor = (metric) => {
    const bgMap = {
      fuel_dispense: '#ebf5ff',
      engine_hours: '#f3e5f5',
      km_travel: '#e8f5e9',
      fuel_used_gps: '#fff8e1',
      idling: '#efebe9',
      pending_issues: '#fce4ec',
      active_alerts: '#ffebee'
    };
    return bgMap[metric] || '#f5f5f5';
  };

  // Load widget configuration from API instead of localStorage
  const [widgetConfig, setWidgetConfig] = useState({ key_statistics: [] });
  const [preferencesLoading, setPreferencesLoading] = useState(true);

  // Load widget configuration from API on component mount
  useEffect(() => {
    // Initialize with default empty config since preferences endpoint is removed
    const defaultConfig = { key_statistics: [] };
    setWidgetConfig(defaultConfig);
    setPreferencesLoading(false);
    console.log('Initialized widget config with default values (preferences endpoint removed)');
  }, []);

  // State for dynamic API data with caching and intervals
  const [apiData, setApiData] = useState({});
  const [apiLoading, setApiLoading] = useState({});
  const [cumulativeIntervals, setCumulativeIntervals] = useState({});

  // Constants for data fetching optimization
  const API_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes for cumulative mode

  // Clear cumulative intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(cumulativeIntervals).forEach(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, [cumulativeIntervals]);

  // Optimized widget data fetching using the new service
  const fetchWidgetData = useCallback(async (widget, forceRefresh = false) => {
    const cacheKey = `${widget.id}_${widget.metric}_${widget.mode}_${widget.datePreset}_${widget.sitesMode}_${JSON.stringify(widget.siteIds || [])}`;

    if (apiLoading[cacheKey] && !forceRefresh) return; // Prevent duplicate requests

    setApiLoading(prev => ({ ...prev, [cacheKey]: true }));

    try {
      const data = await optimizedWidgetDataService.getWidgetData(widget, forceRefresh);
      setApiData(prev => ({ ...prev, [cacheKey]: data }));
      console.log(`Fetched optimized data for widget ${widget.id} (${widget.mode} mode):`, data);
      return data;
    } catch (error) {
      console.error(`Error fetching optimized data for widget ${widget.id}:`, error);
      setApiData(prev => ({ ...prev, [cacheKey]: { error: error.message } }));
      return { error: error.message };
    } finally {
      setApiLoading(prev => ({ ...prev, [cacheKey]: false }));
    }
  }, [apiLoading]);

  // Set up cumulative mode intervals
  const setupCumulativeInterval = useCallback((widget) => {
    const intervalKey = `${widget.id}_${widget.metric}`;

    // Clear existing interval if any
    if (cumulativeIntervals[intervalKey]) {
      clearInterval(cumulativeIntervals[intervalKey]);
    }

    // Only set up intervals for cumulative mode
    if (widget.mode === 'cumulative') {
      const interval = setInterval(() => {
        console.log(`Auto-refreshing cumulative data for widget ${widget.id}`);
        fetchWidgetData(widget, true);
      }, API_CACHE_DURATION);

      setCumulativeIntervals(prev => ({ ...prev, [intervalKey]: interval }));
    }
  }, [cumulativeIntervals, fetchWidgetData, API_CACHE_DURATION]);

  // Fetch data for all enabled widgets with optimization
  useEffect(() => {
    const keyStatWidgets = (widgetConfig.key_statistics || []).filter(widget => widget.enabled);

    keyStatWidgets.forEach(widget => {
      // For live mode, only fetch if we don't have data
      if (widget.mode === 'live') {
        const cacheKey = `${widget.id}_${widget.metric}_${widget.mode}_${widget.datePreset}_${widget.sitesMode}_${JSON.stringify(widget.siteIds || [])}`;
        const hasData = apiData[cacheKey];

        if (!hasData) {
          fetchWidgetData(widget);
        }
      } else {
        // For cumulative mode, fetch immediately and set up intervals
        fetchWidgetData(widget);
        setupCumulativeInterval(widget);
      }
    });

    // Clean up intervals for disabled widgets
    const enabledWidgetKeys = keyStatWidgets.map(w => `${w.id}_${w.metric}`);
    const currentIntervalKeys = Object.keys(cumulativeIntervals);

    currentIntervalKeys.forEach(key => {
      if (!enabledWidgetKeys.includes(key)) {
        if (cumulativeIntervals[key]) {
          clearInterval(cumulativeIntervals[key]);
          setCumulativeIntervals(prev => {
            const newIntervals = { ...prev };
            delete newIntervals[key];
            return newIntervals;
          });
        }
      }
    });
  }, [widgetConfig, fetchWidgetData, setupCumulativeInterval, apiData, cumulativeIntervals]);  // Live fuel state (today) & yesterday snapshot
  const [todayFuelRaw, setTodayFuelRaw] = useState(() => {
    // Initialize with pdTotals.consumption as fallback
    return pdTotals.consumption;
  });
  const [yesterdayFuelRaw, setYesterdayFuelRaw] = useState(pdTotals.consumption);

  // Load yesterday value from DashboardMetricsService
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const result = await dashboardMetricsService.getFuelDispensed('cumulative', 'yesterday');
        if (!active) return;
        if (result?.value != null) setYesterdayFuelRaw(result.value);
      } catch (e) {
        console.warn('Failed to load yesterday fuel data:', e);
        // fallback remains pdTotals.consumption
      }
    })();
    return () => { active = false; };
  }, []);

  // SignalR subscription using dashboardSignalRService for 'FuelDispensedIncrement' events
  useEffect(() => {
    let cancelled = false;

    const handleFuelDispensedIncrement = (payload) => {
      if (cancelled) return;
      const inc = typeof payload === 'number' ? payload : payload?.liters || 0;
      if (inc > 0) setTodayFuelRaw(prev => prev + inc);
    };

    const initializeSignalR = async () => {
      try {
        // Use the managed SignalR service - connection is handled by route-based manager
        // No need to manually start the service, ConnectionManager handles this

        // Subscribe to fuel dispensed increment events
        const unsubscribe = dashboardSignalRService.on('FuelDispensedIncrement', handleFuelDispensedIncrement);

        if (!cancelled) {
          // Request current snapshot using DashboardMetricsService
          try {
            const result = await dashboardMetricsService.getFuelDispensed('live', 'today');
            if (!cancelled && result?.value != null) setTodayFuelRaw(result.value);
          } catch (err) {
            console.warn('Failed to load today fuel snapshot:', err);
          }
        }

        return unsubscribe;
      } catch (err) {
        if (!cancelled) {
          console.warn('SignalR connection failed:', err);
        }
        return null;
      }
    };

    let unsubscribeFunc = null;
    initializeSignalR().then(unsubscribe => {
      unsubscribeFunc = unsubscribe;
    });

    return () => {
      cancelled = true;
      if (unsubscribeFunc) unsubscribeFunc();
    };
  }, []);

  const yesterdayFuelTotal = formatNumber(yesterdayFuelRaw);

  // Use real-time data when available, fallback to static data
  const getRealtimeValue = (widget, fallbackValue) => {
    if (!realtimeData.keyStatistics) return fallbackValue;

    // Map widget configuration to real-time data keys
    const realtimeKeyMap = {
      'fuel_dispense': 'fuel_dispense',
      'fuel_used_gps': 'fuel_used_gps',
      'engine_hours': 'engine_hours',
      'km_travel': 'km_travel',
      'idling': 'idling'
    };

    const realtimeKey = realtimeKeyMap[widget.metric];
    if (realtimeKey && realtimeData.keyStatistics[realtimeKey] !== undefined) {
      return realtimeData.keyStatistics[realtimeKey];
    }

    return fallbackValue;
  };

  // Check if widget has real-time data available
  const hasRealtimeData = (widget) => {
    if (!realtimeData.keyStatistics) return false;

    const realtimeKeyMap = {
      'fuel_dispense': 'fuel_dispense',
      'fuel_used_gps': 'fuel_used_gps',
      'engine_hours': 'engine_hours',
      'km_travel': 'km_travel',
      'idling': 'idling'
    };

    const realtimeKey = realtimeKeyMap[widget.metric];
    return realtimeKey && realtimeData.keyStatistics[realtimeKey] !== undefined;
  };

  // Widget templates for different metrics
  const getWidgetTemplate = (widget, data) => {
    const { metric, mode, label, datePreset } = widget;
  // IMPORTANT: use the exact same cache key format as fetchWidgetData / optimizedWidgetDataService
  const cacheKey = optimizedWidgetDataService.generateCacheKey(widget);
    const widgetApiData = apiData[cacheKey];
    const isLoading = apiLoading[cacheKey];

    // Build dynamic label based on widget configuration
    const buildLabel = (baseLabel, widget) => {
      if (widget.sitesMode === 'custom' && widget.siteIds && widget.siteIds.length > 0) {
        const selectedSites = sites.filter(s => widget.siteIds.includes(s.id));
        if (selectedSites.length === 1) {
          return `${baseLabel} - ${selectedSites[0].name}`;
        } else if (selectedSites.length > 1) {
          return `${baseLabel} - ${selectedSites.length} Sites`;
        }
      }
      return baseLabel;
    };

    // Helper to normalize units coming from API (e.g. 'liters' -> 'L')
    const normalizeUnit = (u) => {
      if (!u) return '';
      const map = { liters: 'L', liter: 'L', l: 'L', hours: 'hrs', hour: 'hrs', minutes: 'min', minute: 'min' };
      const lowered = ('' + u).toLowerCase();
      return map[lowered] || u; // keep original if not mapped
    };

    // Recognized metrics that have specialized rendering below
    const recognizedMetrics = new Set([
      'fuel_dispense',
      'engine_hours',
      'km_travel',
      'fuel_used_gps',
      'idling',
      'pending_issues',
      'active_alerts'
    ]);

    // Generic early return ONLY for custom/unrecognized metrics with API data
    if (widgetApiData && !widgetApiData.error && !recognizedMetrics.has(metric)) {
      const isLive = widgetApiData.additionalInfo?.is_live || widget.mode === 'live';
      const unit = normalizeUnit(widgetApiData.unit);
      console.debug('Rendering custom metric from API cache', { widgetId: widget.id, metric: widget.metric, cacheKey, value: widgetApiData.value, unit });
      return {
        label: buildLabel(label || widgetApiData.metric || 'Custom Metric', widget),
        value: `${formatNumber(widgetApiData.value)} ${unit}`.trim(),
        icon: getMetricIcon(metric),
        iconColor: getMetricIconColor(metric),
        bgColor: getMetricBgColor(metric),
        subtitle: isLive ? 'Live Data' : 'Cumulative',
        isRealtime: isLive,
        mode: widget.mode
      };
    }

    // Show loading state for API widgets
    if (isLoading) {
      return {
        label: buildLabel(label || 'Loading...', widget),
        value: '---',
        icon: 'fa-solid fa-spinner fa-spin',
        iconColor: '#666',
        bgColor: '#f5f5f5',
        subtitle: 'Loading data...',
        mode: widget.mode
      };
    }

    // Show error state for failed API widgets
    if (widgetApiData && widgetApiData.error) {
      return {
        label: buildLabel(label || 'Error', widget),
        value: '---',
        icon: 'fa-solid fa-exclamation-triangle',
        iconColor: '#f44336',
        bgColor: '#ffebee',
        subtitle: 'Failed to load',
        mode: widget.mode
      };
    }

    // Static data fallback for default widgets
    switch (metric) {
      case 'fuel_dispense':
        // Check if we have real API data first
        if (widgetApiData && !widgetApiData.error) {
          const isLive = widgetApiData.additionalInfo?.is_live || widget.mode === 'live';
          const unit = normalizeUnit(widgetApiData.unit || 'L');
          return {
            label: buildLabel(label || 'Fuel Dispensed', widget),
            value: `${formatNumber(widgetApiData.value)} ${unit}`,
            icon: 'fa-solid fa-droplet',
            iconColor: '#2196f3',
            bgColor: '#ebf5ff',
            subtitle: isLive ? 'Live Data' : 'Cumulative',
            isRealtime: isLive,
            mode: widget.mode
          };
        }

        // Fallback to old logic if no API data
        if (mode === 'live' && datePreset === 'today') {
          const realtimeValue = getRealtimeValue(widget, todayFuelRaw);
          const isRealtime = hasRealtimeData(widget);
          return {
            label: buildLabel(label || 'Today Fuel Dispensed', widget),
            value: `${formatNumber(realtimeValue)} L`,
            icon: 'fa-solid fa-droplet',
            iconColor: '#2196f3',
            bgColor: '#ebf5ff',
            subtitle: isRealtime ? 'Live Data' : 'Real-time',
            isRealtime
          };
        } else if (mode === 'cumulative' && datePreset === 'yesterday') {
          return {
            label: buildLabel(label || 'Yesterday Fuel Dispensed', widget),
            value: `${yesterdayFuelTotal} L`,
            icon: 'fa-solid fa-gas-pump',
            iconColor: '#1565c0',
            bgColor: '#e3f2fd',
            subtitle: 'Cumulative'
          };
        }
        break;

      case 'engine_hours':
        // Check if we have real API data first
        if (widgetApiData && !widgetApiData.error) {
          const isLive = widgetApiData.additionalInfo?.is_live || widget.mode === 'live';
          const unit = normalizeUnit(widgetApiData.unit || 'hrs');
          return {
            label: buildLabel(label || 'Engine Hours', widget),
            value: `${formatNumber(widgetApiData.value)} ${unit}`,
            icon: 'fa-solid fa-clock',
            iconColor: '#9c27b0',
            bgColor: '#f3e5f5',
            subtitle: isLive ? 'Live Data' : 'Cumulative',
            isRealtime: isLive,
            mode: widget.mode
          };
        }

        // Fallback to old logic
        const engineHoursValue = getRealtimeValue(widget, pdTotals.hours);
        const engineHoursRealtime = hasRealtimeData(widget);
        return {
          label: buildLabel(label || 'Engine Hours', widget),
          value: `${formatNumber(engineHoursValue)} hrs`,
          icon: 'fa-solid fa-clock',
          iconColor: '#9c27b0',
          bgColor: '#f3e5f5',
          subtitle: engineHoursRealtime ? 'Live Data' : undefined,
          isRealtime: engineHoursRealtime
        };

      case 'km_travel':
        // Check if we have real API data first
        if (widgetApiData && !widgetApiData.error) {
          const isLive = widgetApiData.additionalInfo?.is_live || widget.mode === 'live';
          const unit = normalizeUnit(widgetApiData.unit || 'km');
          return {
            label: buildLabel(label || 'Distance Travelled', widget),
            value: `${formatNumber(widgetApiData.value)} ${unit}`,
            icon: 'fa-solid fa-arrow-trend-up',
            iconColor: '#4caf50',
            bgColor: '#e8f5e9',
            subtitle: isLive ? 'Live Data' : 'Cumulative',
            isRealtime: isLive,
            mode: widget.mode
          };
        }

        // Fallback to old logic
        const distanceValue = getRealtimeValue(widget, pdTotals.distance);
        const distanceRealtime = hasRealtimeData(widget);
        return {
          label: buildLabel(label || 'Distance Travelled', widget),
          value: `${formatNumber(distanceValue)} km`,
          icon: 'fa-solid fa-arrow-trend-up',
          iconColor: '#4caf50',
          bgColor: '#e8f5e9',
          subtitle: distanceRealtime ? 'Live Data' : undefined,
          isRealtime: distanceRealtime
        };

      case 'fuel_used_gps':
        // Check if we have real API data first
        if (widgetApiData && !widgetApiData.error) {
          const isLive = widgetApiData.additionalInfo?.is_live || widget.mode === 'live';
          const unit = normalizeUnit(widgetApiData.unit || 'L');
          return {
            label: buildLabel(label || 'Fuel Used (GPS)', widget),
            value: `${formatNumber(widgetApiData.value)} ${unit}`,
            icon: 'fa-solid fa-gas-pump',
            iconColor: '#ff9800',
            bgColor: '#fff8e1',
            subtitle: isLive ? 'Live Data' : 'Cumulative',
            isRealtime: isLive,
            mode: widget.mode
          };
        }

        // Fallback to old logic
        const fuelGpsValue = getRealtimeValue(widget, 1564.32);
        const fuelGpsRealtime = hasRealtimeData(widget);
        return {
          label: buildLabel(label || 'Fuel Used (GPS)', widget),
          value: `${formatNumber(fuelGpsValue)} L`,
          icon: 'fa-solid fa-gas-pump',
          iconColor: '#ff9800',
          bgColor: '#fff8e1',
          subtitle: fuelGpsRealtime ? 'Live Data' : undefined,
          isRealtime: fuelGpsRealtime
        };

      case 'idling':
        // Check if we have real API data first
        if (widgetApiData && !widgetApiData.error) {
          const isLive = widgetApiData.additionalInfo?.is_live || widget.mode === 'live';
          const unit = normalizeUnit(widgetApiData.unit || 'min');
          return {
            label: buildLabel(label || 'Idling Time', widget),
            value: `${formatNumber(widgetApiData.value)} ${unit}`,
            icon: 'fa-solid fa-pause',
            iconColor: '#795548',
            bgColor: '#efebe9',
            subtitle: isLive ? 'Live Data' : 'Cumulative',
            isRealtime: isLive,
            mode: widget.mode
          };
        }

        // Fallback to old logic
        const idlingValue = getRealtimeValue(widget, 127.5);
        const idlingRealtime = hasRealtimeData(widget);
        return {
          label: buildLabel(label || 'Idling Time', widget),
          value: `${formatNumber(idlingValue)} min`,
          icon: 'fa-solid fa-pause',
          iconColor: '#795548',
          bgColor: '#efebe9',
          subtitle: idlingRealtime ? 'Live Data' : undefined,
          isRealtime: idlingRealtime
        };

      case 'pending_issues':
        return {
          label: buildLabel(label || 'Pending Issues', widget),
          value: '27', // TODO: replace with actual data
          icon: 'fa-solid fa-triangle-exclamation',
          iconColor: '#e91e63',
          bgColor: '#fce4ec',
          subtitle: 'Static Data',
          mode: 'static'
        };

      case 'active_alerts':
        return {
          label: buildLabel(label || 'Active Alerts', widget),
          value: stats.activeAlerts || '0',
          icon: 'fa-solid fa-bell',
          iconColor: '#f44336',
          bgColor: '#ffebee',
          subtitle: 'Real-time',
          isRealtime: true,
          highlight: (stats.activeAlerts || 0) > 0,
          mode: 'live'
        };

      default:
        // Generic template for unknown metrics
        return {
          label: label || 'Custom Metric',
          value: 'N/A',
          icon: 'fa-solid fa-chart-line',
          iconColor: '#666',
          bgColor: '#f5f5f5',
          subtitle: 'Unknown',
          mode: 'unknown'
        };
    }

    // Return null if no template matches (shouldn't happen with the default case)
    return null;
  };

  // Render dynamic widget
  const renderWidget = (widget) => {
    if (!widget.enabled) return null;

    const template = getWidgetTemplate(widget);
    if (!template) return null;

    return (
      <div key={widget.id} className={`dashboard-card ${template.highlight ? 'highlight' : ''} ${template.isRealtime ? 'realtime-update' : ''}`}>
        <div className="flex-between">
          <div>
            <p className="stat-label">{template.label}</p>
            <h3 className="stat-value">{template.value}</h3>
            {template.subtitle && (
              <div className="tw-text-[10px] tw-font-medium tw-mt-1 tw-text-gray-500 tw-flex tw-items-center tw-gap-1">
                {template.isRealtime && <span className="tw-text-green-600 tw-animate-pulse">●</span>}
                {!template.isRealtime && template.mode === 'cumulative' && <span className="tw-text-blue-600">◉</span>}
                {template.mode === 'static' && <span className="tw-text-gray-600">○</span>}
                {template.mode === 'unknown' && <span className="tw-text-orange-600">?</span>}
                <span>{template.subtitle}</span>
              </div>
            )}
          </div>
          <div
            className="icon-container"
            style={{ backgroundColor: template.bgColor }}
          >
            <i className={template.icon} style={{ color: template.iconColor }}></i>
          </div>
        </div>
      </div>
    );
  };

  // Get all enabled widgets from key_statistics category, sorted by position
  const keyStatWidgets = (widgetConfig.key_statistics || [])
    .filter(widget => widget.enabled)
    .sort((a, b) => {
      // Sort by position if available, otherwise by original order
      const posA = a.position !== undefined ? a.position : parseInt(a.id.split('_').pop()) || 0;
      const posB = b.position !== undefined ? b.position : parseInt(b.id.split('_').pop()) || 0;
      return posA - posB;
    });

  // Debug logging (only in development)


  return (
    <div className="card-grid-4">
      {preferencesLoading ? (
        <div className="dashboard-card">
          <div className="flex-between">
            <div>
              <p className="stat-label">Loading Configuration...</p>
              <h3 className="stat-value">---</h3>
              <div className="tw-text-[10px] tw-font-medium tw-mt-1 tw-text-gray-500">
                <i className="fa-solid fa-spinner fa-spin"></i> Loading dashboard preferences...
              </div>
            </div>
            <div className="icon-container" style={{ backgroundColor: "#f5f5f5" }}>
              <i className="fa-solid fa-cog fa-spin" style={{ color: "#666" }}></i>
            </div>
          </div>
        </div>
      ) : keyStatWidgets.length > 0 ? (
        keyStatWidgets.map(widget => {

          return renderWidget(widget);
        })
      ) : (
        <div className="dashboard-card">
          <div className="flex-between">
            <div>
              <p className="stat-label">No Widgets Configured</p>
              <h3 className="stat-value">0</h3>
              <div className="tw-text-[10px] tw-font-medium tw-mt-1 tw-text-gray-500">
                Add widgets using the configuration modal
              </div>
            </div>
            <div className="icon-container" style={{ backgroundColor: "#f5f5f5" }}>
              <i className="fa-solid fa-plus" style={{ color: "#666" }}></i>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
