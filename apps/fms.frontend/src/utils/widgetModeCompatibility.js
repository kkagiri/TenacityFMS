/**
 * Widget Mode Compatibility Utilities
 *
 * Handles mode compatibility, validation, and smart defaults for widget configuration
 */

export const MODE_DEFINITIONS = {
  live: {
    value: 'live',
    label: 'Live',
    description: 'Stream the most recent telemetry as updates arrive',
    icon: 'fa-signal-stream',
    color: 'green',
    category: 'realtime'
  },
  historical_snapshot: {
    value: 'historical_snapshot',
    label: 'Snapshot',
    description: 'Single point-in-time value for the chosen preset',
    icon: 'fa-camera',
    color: 'blue',
    category: 'historical'
  },
  daily_aggregated: {
    value: 'daily_aggregated',
    label: 'Daily Aggregated',
    description: 'One aggregated data point per day for the preset window',
    icon: 'fa-calendar-days',
    color: 'purple',
    category: 'historical'
  },
  running_cumulative: {
    value: 'running_cumulative',
    label: 'Running Cumulative',
    description: 'Running totals (e.g., MBFU) accumulating across the range',
    icon: 'fa-chart-line-up',
    color: 'orange',
    category: 'historical'
  },
  rolling_window: {
    value: 'rolling_window',
    label: 'Rolling Window',
    description: 'Fixed-size moving window (e.g., last 24h) recomputed over time',
    icon: 'fa-window-frame',
    color: 'teal',
    category: 'advanced'
  },
  compare_periods: {
    value: 'compare_periods',
    label: 'Compare Periods',
    description: 'Compare current window against a previous period',
    icon: 'fa-code-compare',
    color: 'indigo',
    category: 'advanced'
  }
};

/**
 * Widget type compatibility configuration
 */
const WIDGET_MODE_COMPATIBILITY = {
  'BIG_STAT_CARD': {
    recommended: ['live', 'historical_snapshot', 'daily_aggregated'],
    supported: ['live', 'historical_snapshot', 'daily_aggregated', 'running_cumulative', 'compare_periods'],
    excluded: ['rolling_window'],
    defaultMode: 'daily_aggregated'
  },
  'CHART_LINE_TREND': {
    recommended: ['live', 'daily_aggregated', 'running_cumulative'],
    supported: ['live', 'daily_aggregated', 'running_cumulative', 'rolling_window', 'compare_periods'],
    excluded: ['historical_snapshot'],
    defaultMode: 'daily_aggregated'
  },
  'CHART_BAR_COMPARISON': {
    recommended: ['historical_snapshot', 'daily_aggregated'],
    supported: ['live', 'historical_snapshot', 'daily_aggregated', 'running_cumulative', 'compare_periods'],
    excluded: ['rolling_window'],
    defaultMode: 'historical_snapshot'
  },
  'CHART_PIE_DISTRIBUTION': {
    recommended: ['historical_snapshot', 'daily_aggregated'],
    supported: ['live', 'historical_snapshot', 'daily_aggregated', 'running_cumulative'],
    excluded: ['rolling_window', 'compare_periods'],
    defaultMode: 'historical_snapshot'
  },
  'DATA_TABLE_DETAILED': {
    recommended: ['historical_snapshot', 'daily_aggregated'],
    supported: ['live', 'historical_snapshot', 'daily_aggregated'],
    excluded: ['running_cumulative', 'rolling_window', 'compare_periods'],
    defaultMode: 'historical_snapshot'
  },
  'PROGRESS_LIST': {
    recommended: ['historical_snapshot', 'daily_aggregated'],
    supported: ['live', 'historical_snapshot', 'daily_aggregated', 'running_cumulative'],
    excluded: ['rolling_window', 'compare_periods'],
    defaultMode: 'daily_aggregated'
  },
  'ALERT_NOTIFICATION': {
    recommended: ['live', 'historical_snapshot'],
    supported: ['live', 'historical_snapshot', 'daily_aggregated'],
    excluded: ['running_cumulative', 'rolling_window', 'compare_periods'],
    defaultMode: 'live'
  },
  'ticker': {
    recommended: ['live', 'historical_snapshot'],
    supported: ['live', 'historical_snapshot', 'daily_aggregated', 'running_cumulative'],
    excluded: ['rolling_window', 'compare_periods'],
    defaultMode: 'live'
  }
};

/**
 * Get compatible modes for a widget type
 * @param {string} widgetType - Widget type ID
 * @param {array} dataSourceSupportedModes - Modes supported by data source
 * @returns {array} Array of compatible mode objects
 */
export const getCompatibleModesForWidget = (widgetType, dataSourceSupportedModes = []) => {
  const config = WIDGET_MODE_COMPATIBILITY[widgetType] || {
    supported: Object.keys(MODE_DEFINITIONS),
    excluded: [],
    recommended: []
  };

  // If no data source modes provided, use all from MODE_DEFINITIONS
  const availableModes = dataSourceSupportedModes.length > 0
    ? dataSourceSupportedModes
    : Object.keys(MODE_DEFINITIONS);

  // Filter modes: must be in data source supported AND widget supported AND not excluded
  const compatibleModes = availableModes
    .filter(mode => config.supported.includes(mode) && !config.excluded.includes(mode))
    .map(mode => ({
      ...MODE_DEFINITIONS[mode],
      isRecommended: config.recommended?.includes(mode),
      isSupported: true
    }));

  return compatibleModes;
};

/**
 * Group modes by category (realtime, historical, advanced)
 * @param {array} modes - Array of mode objects
 * @returns {object} Grouped modes object
 */
export const groupModesByCategory = (modes) => {
  return {
    realtime: modes.filter(m => m.category === 'realtime'),
    historical: modes.filter(m => m.category === 'historical'),
    advanced: modes.filter(m => m.category === 'advanced')
  };
};

/**
 * Get context-specific help text for widget type
 * @param {string} widgetType - Widget type ID
 * @returns {string} Help text
 */
export const getModeContextHelp = (widgetType) => {
  const helpText = {
    'BIG_STAT_CARD': 'Choose how to display your single metric value',
    'CHART_LINE_TREND': 'Select how data points should be aggregated over time',
    'CHART_BAR_COMPARISON': 'Choose how to aggregate values for comparison',
    'CHART_PIE_DISTRIBUTION': 'Select how to calculate proportional distribution',
    'DATA_TABLE_DETAILED': 'Choose data loading and update behavior',
    'PROGRESS_LIST': 'Select how to rank and display progress items',
    'ALERT_NOTIFICATION': 'Choose how alerts should be loaded and updated',
    'ticker': 'Select how ticker values should update'
  };
  return helpText[widgetType] || 'Choose how data should be loaded and updated';
};

/**
 * Get mode-specific help based on widget type and mode
 * @param {string} mode - Mode value
 * @param {string} widgetType - Widget type ID
 * @returns {string} Detailed help text
 */
export const getModeHelpText = (mode, widgetType) => {
  const helpMatrix = {
    'live': {
      'BIG_STAT_CARD': 'The metric will update automatically as new data arrives. Perfect for monitoring current activity.',
      'CHART_LINE_TREND': 'New data points will be added to the chart in real-time as they occur.',
      'CHART_BAR_COMPARISON': 'Bar values will update live as transactions occur.',
      'CHART_PIE_DISTRIBUTION': 'Slice values will adjust in real-time as proportions change.',
      'DATA_TABLE_DETAILED': 'New rows will appear automatically as data is recorded.',
      'PROGRESS_LIST': 'Progress values will update in real-time.',
      'ALERT_NOTIFICATION': 'New alerts will appear immediately as they are triggered.',
      'ticker': 'Ticker value updates continuously with latest data.'
    },
    'historical_snapshot': {
      'BIG_STAT_CARD': 'Shows a single aggregated value for the selected time period (e.g., yesterday\'s total).',
      'CHART_BAR_COMPARISON': 'Each bar represents the total for that category in the selected period.',
      'CHART_PIE_DISTRIBUTION': 'Shows the distribution breakdown for the selected period.',
      'DATA_TABLE_DETAILED': 'Displays all records from the selected time period.',
      'PROGRESS_LIST': 'Shows rankings based on the selected period.',
      'ALERT_NOTIFICATION': 'Displays alerts from the selected time period.',
      'ticker': 'Shows the value at a specific point in time.'
    },
    'daily_aggregated': {
      'BIG_STAT_CARD': 'Sums up all daily values within the date range to show one total.',
      'CHART_LINE_TREND': 'Shows one data point per day, creating a trend line over your date range.',
      'CHART_BAR_COMPARISON': 'Each bar shows the total across all days in the range for that category.',
      'CHART_PIE_DISTRIBUTION': 'Distribution calculated from all days in the range combined.',
      'DATA_TABLE_DETAILED': 'Shows daily summaries for the selected range.',
      'PROGRESS_LIST': 'Rankings based on daily aggregated values.',
      'ALERT_NOTIFICATION': 'Alerts grouped by day.',
      'ticker': 'Shows daily aggregated value.'
    },
    'running_cumulative': {
      'BIG_STAT_CARD': 'Shows the running total up to now (e.g., month-to-date fuel dispensed).',
      'CHART_LINE_TREND': 'Line shows cumulative total growing each day (MBFU pattern).',
      'CHART_BAR_COMPARISON': 'Bars show cumulative totals for each category.',
      'CHART_PIE_DISTRIBUTION': 'Distribution of cumulative values over time.',
      'PROGRESS_LIST': 'Rankings based on cumulative totals.',
      'ticker': 'Shows running total up to current moment.'
    },
    'rolling_window': {
      'CHART_LINE_TREND': 'Shows a moving window (e.g., last 24 hours) that shifts over time with fresh data.',
    },
    'compare_periods': {
      'BIG_STAT_CARD': 'Shows current period value with delta vs previous period (e.g., this week vs last week).',
      'CHART_LINE_TREND': 'Displays two trend lines: current period and previous period for comparison.',
      'CHART_BAR_COMPARISON': 'Shows grouped bars: current vs previous period for each category.'
    }
  };

  return helpMatrix[mode]?.[widgetType] || MODE_DEFINITIONS[mode]?.description || '';
};

/**
 * Get smart defaults for a mode and widget type combination
 * @param {string} mode - Mode value
 * @param {string} widgetType - Widget type ID
 * @returns {object} Default configuration object
 */
export const getDefaultsForMode = (mode, widgetType) => {
  const defaults = {
    live: {
      datePreset: 'today',
      granularity: widgetType === 'CHART_LINE_TREND' ? 'minute' : 'hour',
      aggregation: 'SUM'
    },
    historical_snapshot: {
      datePreset: 'yesterday',
      granularity: 'day',
      aggregation: 'SUM'
    },
    daily_aggregated: {
      datePreset: 'last_7_days',
      granularity: 'day',
      aggregation: 'SUM'
    },
    running_cumulative: {
      datePreset: 'this_month',
      granularity: 'day',
      aggregation: 'SUM'
    },
    rolling_window: {
      datePreset: 'last_24_hours',
      granularity: 'hour',
      aggregation: 'AVG'
    },
    compare_periods: {
      datePreset: 'last_7_days',
      granularity: 'day',
      aggregation: 'SUM'
    }
  };

  return defaults[mode] || {
    datePreset: 'yesterday',
    granularity: 'day',
    aggregation: 'SUM'
  };
};

/**
 * Validate if mode is supported by data source
 * @param {string} mode - Mode value
 * @param {object} dataSourceMeta - Data source metadata
 * @returns {object} Validation result with alternatives
 */
export const validateModeForDataSource = (mode, dataSourceMeta) => {
  if (!dataSourceMeta || !dataSourceMeta.supportedModes) {
    return { valid: true, alternatives: [] };
  }

  const isSupported = dataSourceMeta.supportedModes.includes(mode);

  if (isSupported) {
    return { valid: true, alternatives: [] };
  }

  // Provide alternatives
  const alternatives = dataSourceMeta.supportedModes.filter(m =>
    MODE_DEFINITIONS[m] // Only suggest modes we have definitions for
  );

  const reason = mode === 'live'
    ? `${dataSourceMeta.displayName || 'This data source'} doesn't support live streaming`
    : `${dataSourceMeta.displayName || 'This data source'} doesn't support ${MODE_DEFINITIONS[mode]?.label || mode} mode`;

  return {
    valid: false,
    reason,
    alternatives
  };
};

/**
 * Get recommended mode for widget type and data source
 * @param {string} widgetType - Widget type ID
 * @param {object} dataSourceMeta - Data source metadata
 * @returns {string} Recommended mode value
 */
export const getRecommendedMode = (widgetType, dataSourceMeta) => {
  const config = WIDGET_MODE_COMPATIBILITY[widgetType];
  if (!config) return 'daily_aggregated';

  // Get modes that are both recommended for widget and supported by data source
  const dataSourceModes = dataSourceMeta?.supportedModes || Object.keys(MODE_DEFINITIONS);

  const recommendedAndSupported = config.recommended.filter(mode =>
    dataSourceModes.includes(mode)
  );

  // Return first recommended mode, or fall back to default, or first supported
  return recommendedAndSupported[0] || config.defaultMode || dataSourceModes[0] || 'daily_aggregated';
};

/**
 * Check if mode is compatible with widget type
 * @param {string} mode - Mode value
 * @param {string} widgetType - Widget type ID
 * @returns {boolean} True if compatible
 */
export const isModeCompatibleWithWidget = (mode, widgetType) => {
  const config = WIDGET_MODE_COMPATIBILITY[widgetType];
  if (!config) return true;

  return config.supported.includes(mode) && !config.excluded.includes(mode);
};

/**
 * Get CSS color classes for a mode
 * @param {string} mode - Mode value
 * @param {boolean} selected - Whether mode is selected
 * @returns {object} Object with CSS class strings
 */
export const getModeColorClasses = (mode, selected = false) => {
  const modeConfig = MODE_DEFINITIONS[mode];
  if (!modeConfig) return {};

  const color = modeConfig.color;

  return {
    border: selected ? `tw-border-${color}-500` : 'tw-border-gray-200',
    bg: selected ? `tw-bg-${color}-50` : 'tw-bg-white',
    text: `tw-text-${color}-600`,
    hover: `hover:tw-border-${color}-300`,
    hoverBg: `hover:tw-bg-${color}-50`
  };
};
