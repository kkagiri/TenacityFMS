# UI Design: SupportedModes Display & User Interface Analysis

**Date**: September 30, 2025
**Purpose**: Analyze and design ideal UI for displaying widget SupportedModes based on data source capabilities
**Status**: Brainstorming & Design Phase

---

## 1. Current State Analysis

### Backend: Data Source Metadata Structure
From `DataSourceManager.Metadata.cs`, each data source defines:

```csharp
SupportedModes = new List<string> {
    "live",                    // Real-time streaming
    "historical_snapshot",     // Point-in-time value
    "daily_aggregated",        // Daily buckets
    "running_cumulative",      // Running totals (MBFU)
    "rolling_window",          // Moving window
    "compare_periods"          // Period comparison
}
```

### Frontend: Current Mode Definitions
From `WidgetForm.js` (lines 48-75):

```javascript
const MODE_DEFINITIONS = {
  live: {
    value: 'live',
    label: 'Live',
    description: 'Stream the most recent telemetry as updates arrive',
    icon: 'fa-signal-stream',
    color: 'green'
  },
  historical_snapshot: {
    value: 'historical_snapshot',
    label: 'Snapshot',
    description: 'Single point-in-time value for the chosen preset',
    icon: 'fa-camera',
    color: 'blue'
  },
  daily_aggregated: {
    value: 'daily_aggregated',
    label: 'Daily Aggregated',
    description: 'One aggregated data point per day for the preset window',
    icon: 'fa-calendar-days',
    color: 'purple'
  },
  running_cumulative: {
    value: 'running_cumulative',
    label: 'Running Cumulative',
    description: 'Running totals (e.g., MBFU) accumulating across the range',
    icon: 'fa-chart-line-up',
    color: 'orange'
  },
  rolling_window: {
    value: 'rolling_window',
    label: 'Rolling Window',
    description: 'Fixed-size moving window (e.g., last 24h) recomputed over time',
    icon: 'fa-window-frame',
    color: 'teal'
  },
  compare_periods: {
    value: 'compare_periods',
    label: 'Compare Periods',
    description: 'Compare current window against a previous period',
    icon: 'fa-code-compare',
    color: 'indigo'
  }
};
```

---

## 2. Widget Type Capabilities Matrix

### BigStatCard Example
```json
{
  "type": "BigStatCard",
  "primaryUse": "Single KPI (total fuel dispensed, avg consumption, distance traveled)",
  "aggregationSupport": ["SUM", "AVG", "COUNT", "MIN", "MAX"],
  "dataGranularity": "Single aggregated value",
  "filtersApplicable": ["site", "vehicleType", "dateRange", "aggregation"],
  "uiRole": "Display only, no further aggregation",
  "supportedModes": {
    "live": {
      "applicable": true,
      "description": "Real-time streaming value with auto-update",
      "defaultDatePreset": "today",
      "refreshInterval": 30,
      "useCase": "Monitor current fuel dispensed right now"
    },
    "historical_snapshot": {
      "applicable": true,
      "description": "Single value for a point in time",
      "defaultDatePreset": "yesterday",
      "useCase": "Show total fuel dispensed yesterday"
    },
    "daily_aggregated": {
      "applicable": true,
      "description": "Aggregated across days, displayed as single value",
      "defaultDatePreset": "last_7_days",
      "useCase": "Total fuel dispensed over last 7 days"
    },
    "running_cumulative": {
      "applicable": true,
      "description": "Running total up to now",
      "defaultDatePreset": "this_month",
      "useCase": "Month-to-date total fuel dispensed"
    },
    "rolling_window": {
      "applicable": false,
      "reason": "BigStatCard doesn't show time-series, rolling window not meaningful"
    },
    "compare_periods": {
      "applicable": true,
      "description": "Show current vs previous period delta",
      "defaultDatePreset": "last_7_days",
      "useCase": "This week vs last week fuel dispensed"
    }
  }
}
```

### LineChart Example
```json
{
  "type": "CHART_LINE_TREND",
  "primaryUse": "Time-series trends (daily fuel, hourly consumption)",
  "supportedModes": {
    "live": {
      "applicable": true,
      "description": "Real-time data points appending to chart",
      "defaultDatePreset": "today",
      "granularity": "minute",
      "useCase": "Live fuel dispensing throughout the day"
    },
    "historical_snapshot": {
      "applicable": false,
      "reason": "Snapshot is single point, not suitable for trend line"
    },
    "daily_aggregated": {
      "applicable": true,
      "description": "Daily data points over date range",
      "defaultDatePreset": "last_30_days",
      "granularity": "day",
      "useCase": "Daily fuel dispensed over last month"
    },
    "running_cumulative": {
      "applicable": true,
      "description": "Cumulative line showing running total",
      "defaultDatePreset": "this_month",
      "granularity": "day",
      "useCase": "Month-to-date cumulative fuel dispensed"
    },
    "rolling_window": {
      "applicable": true,
      "description": "Moving average or rolling sum",
      "defaultDatePreset": "last_24_hours",
      "granularity": "hour",
      "useCase": "Last 24 hours fuel consumption pattern"
    },
    "compare_periods": {
      "applicable": true,
      "description": "Two lines: current vs previous period",
      "defaultDatePreset": "last_7_days",
      "granularity": "day",
      "useCase": "This week vs last week trend comparison"
    }
  }
}
```

### BarChart Example
```json
{
  "type": "CHART_BAR_COMPARISON",
  "primaryUse": "Compare categories (fuel by site, by vehicle type)",
  "supportedModes": {
    "live": {
      "applicable": true,
      "description": "Real-time bar values updating",
      "defaultDatePreset": "today",
      "useCase": "Current fuel by site today"
    },
    "historical_snapshot": {
      "applicable": true,
      "description": "Bars for a single time point",
      "defaultDatePreset": "yesterday",
      "useCase": "Fuel by site yesterday"
    },
    "daily_aggregated": {
      "applicable": true,
      "description": "Aggregated bars across date range",
      "defaultDatePreset": "last_7_days",
      "useCase": "Total fuel by site over last week"
    },
    "running_cumulative": {
      "applicable": true,
      "description": "Cumulative bars",
      "defaultDatePreset": "this_month",
      "useCase": "Month-to-date fuel by site"
    },
    "rolling_window": {
      "applicable": false,
      "reason": "Bar chart typically shows categorical comparison, not rolling time window"
    },
    "compare_periods": {
      "applicable": true,
      "description": "Grouped bars: current vs previous",
      "defaultDatePreset": "last_7_days",
      "useCase": "This week vs last week by site"
    }
  }
}
```

### PieChart Example
```json
{
  "type": "CHART_PIE_DISTRIBUTION",
  "primaryUse": "Proportional distribution (fuel share by vehicle type)",
  "supportedModes": {
    "live": {
      "applicable": true,
      "description": "Real-time slice values",
      "defaultDatePreset": "today",
      "useCase": "Current fuel distribution by vehicle type"
    },
    "historical_snapshot": {
      "applicable": true,
      "description": "Distribution at point in time",
      "defaultDatePreset": "yesterday",
      "useCase": "Yesterday's fuel distribution"
    },
    "daily_aggregated": {
      "applicable": true,
      "description": "Aggregated distribution over period",
      "defaultDatePreset": "last_7_days",
      "useCase": "Last 7 days fuel share by type"
    },
    "running_cumulative": {
      "applicable": true,
      "description": "Cumulative distribution",
      "defaultDatePreset": "this_month",
      "useCase": "Month-to-date fuel distribution"
    },
    "rolling_window": {
      "applicable": false,
      "reason": "Pie shows distribution, rolling window not meaningful"
    },
    "compare_periods": {
      "applicable": false,
      "reason": "Comparing two pies is confusing; use bar chart instead"
    }
  }
}
```

---

## 3. UI Design Options

### Option A: Icon-Based Card Selection (Recommended)

**Visual**: Large cards with icons, similar to current template/custom choice

```jsx
<div className="tw-space-y-3">
  <label className="tw-block tw-text-sm tw-font-semibold tw-text-gray-800">
    <i className="fa-light fa-toggle-on tw-mr-2 tw-text-purple-600"></i>
    Data Mode
  </label>
  <p className="tw-text-xs tw-text-gray-500 tw-mb-3">
    Choose how data should be loaded and updated for this widget
  </p>

  <div className="tw-grid tw-grid-cols-2 tw-gap-3">
    {/* Live Mode */}
    <button
      className={`tw-p-4 tw-border-2 tw-rounded-lg tw-transition-all tw-text-left
        ${newWidget.mode === 'live'
          ? 'tw-border-green-500 tw-bg-green-50'
          : 'tw-border-gray-200 hover:tw-border-green-300'}`}
      onClick={() => handleModeChange('live')}
    >
      <div className="tw-flex tw-items-center tw-mb-2">
        <i className="fa-light fa-signal-stream tw-text-2xl tw-text-green-600 tw-mr-3"></i>
        <div>
          <div className="tw-font-semibold tw-text-gray-800">Live</div>
          <div className="tw-text-xs tw-text-gray-500">Real-time updates</div>
        </div>
      </div>
      <p className="tw-text-xs tw-text-gray-600">
        Stream the most recent telemetry as updates arrive
      </p>
    </button>

    {/* Snapshot Mode */}
    <button
      className={`tw-p-4 tw-border-2 tw-rounded-lg tw-transition-all tw-text-left
        ${newWidget.mode === 'historical_snapshot'
          ? 'tw-border-blue-500 tw-bg-blue-50'
          : 'tw-border-gray-200 hover:tw-border-blue-300'}`}
      onClick={() => handleModeChange('historical_snapshot')}
    >
      <div className="tw-flex tw-items-center tw-mb-2">
        <i className="fa-light fa-camera tw-text-2xl tw-text-blue-600 tw-mr-3"></i>
        <div>
          <div className="tw-font-semibold tw-text-gray-800">Snapshot</div>
          <div className="tw-text-xs tw-text-gray-500">Point-in-time</div>
        </div>
      </div>
      <p className="tw-text-xs tw-text-gray-600">
        Single value for the chosen time period
      </p>
    </button>

    {/* Daily Aggregated */}
    <button
      className={`tw-p-4 tw-border-2 tw-rounded-lg tw-transition-all tw-text-left
        ${newWidget.mode === 'daily_aggregated'
          ? 'tw-border-purple-500 tw-bg-purple-50'
          : 'tw-border-gray-200 hover:tw-border-purple-300'}`}
      onClick={() => handleModeChange('daily_aggregated')}
    >
      <div className="tw-flex tw-items-center tw-mb-2">
        <i className="fa-light fa-calendar-days tw-text-2xl tw-text-purple-600 tw-mr-3"></i>
        <div>
          <div className="tw-font-semibold tw-text-gray-800">Daily Aggregated</div>
          <div className="tw-text-xs tw-text-gray-500">Daily buckets</div>
        </div>
      </div>
      <p className="tw-text-xs tw-text-gray-600">
        One data point per day for the time range
      </p>
    </button>

    {/* Running Cumulative */}
    <button
      className={`tw-p-4 tw-border-2 tw-rounded-lg tw-transition-all tw-text-left
        ${newWidget.mode === 'running_cumulative'
          ? 'tw-border-orange-500 tw-bg-orange-50'
          : 'tw-border-gray-200 hover:tw-border-orange-300'}`}
      onClick={() => handleModeChange('running_cumulative')}
    >
      <div className="tw-flex tw-items-center tw-mb-2">
        <i className="fa-light fa-chart-line-up tw-text-2xl tw-text-orange-600 tw-mr-3"></i>
        <div>
          <div className="tw-font-semibold tw-text-gray-800">Running Cumulative</div>
          <div className="tw-text-xs tw-text-gray-500">Running total</div>
        </div>
      </div>
      <p className="tw-text-xs tw-text-gray-600">
        Accumulating totals over time (MBFU)
      </p>
    </button>

    {/* Rolling Window */}
    <button
      className={`tw-p-4 tw-border-2 tw-rounded-lg tw-transition-all tw-text-left
        ${newWidget.mode === 'rolling_window'
          ? 'tw-border-teal-500 tw-bg-teal-50'
          : 'tw-border-gray-200 hover:tw-border-teal-300'}`}
      onClick={() => handleModeChange('rolling_window')}
      disabled={!isModeSupported('rolling_window')}
    >
      <div className="tw-flex tw-items-center tw-mb-2">
        <i className="fa-light fa-window-frame tw-text-2xl tw-text-teal-600 tw-mr-3"></i>
        <div>
          <div className="tw-font-semibold tw-text-gray-800">Rolling Window</div>
          <div className="tw-text-xs tw-text-gray-500">Moving window</div>
        </div>
      </div>
      <p className="tw-text-xs tw-text-gray-600">
        Fixed-size moving window recomputed
      </p>
    </button>

    {/* Compare Periods */}
    <button
      className={`tw-p-4 tw-border-2 tw-rounded-lg tw-transition-all tw-text-left
        ${newWidget.mode === 'compare_periods'
          ? 'tw-border-indigo-500 tw-bg-indigo-50'
          : 'tw-border-gray-200 hover:tw-border-indigo-300'}`}
      onClick={() => handleModeChange('compare_periods')}
      disabled={!isModeSupported('compare_periods')}
    >
      <div className="tw-flex tw-items-center tw-mb-2">
        <i className="fa-light fa-code-compare tw-text-2xl tw-text-indigo-600 tw-mr-3"></i>
        <div>
          <div className="tw-font-semibold tw-tw-gray-800">Compare Periods</div>
          <div className="tw-text-xs tw-text-gray-500">Period comparison</div>
        </div>
      </div>
      <p className="tw-text-xs tw-text-gray-600">
        Compare current vs previous period
      </p>
    </button>
  </div>

  {/* Help text based on selected mode */}
  {newWidget.mode && (
    <div className="tw-mt-3 tw-p-3 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg">
      <div className="tw-flex tw-items-start">
        <i className="fa-light fa-info-circle tw-text-blue-600 tw-mr-2 tw-mt-0.5"></i>
        <div className="tw-text-xs tw-text-blue-800">
          {getModeHelpText(newWidget.mode, newWidget.visualizationType)}
        </div>
      </div>
    </div>
  )}
</div>
```

**Pros**:
- Visual and intuitive
- Easy to see all available modes at once
- Clear disabled states for unsupported modes
- Consistent with current simplified UI design
- Icons provide quick visual recognition

**Cons**:
- Takes more vertical space
- Might be overwhelming if all 6 modes are shown

---

### Option B: Dropdown with Rich Items (Current Implementation)

**Visual**: SelectBox with custom item rendering showing icon, label, and description

```jsx
<div>
  <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
    Data Mode
  </label>
  <SelectBox
    items={modeOptions}
    value={newWidget.mode}
    displayExpr="text"
    valueExpr="value"
    width="100%"
    itemRender={(data) => (
      <div className="tw-py-2">
        <div className="tw-flex tw-items-center tw-mb-1">
          <i className={`fa-light ${data.icon} tw-text-lg tw-text-${data.color}-600 tw-mr-2`}></i>
          <span className="tw-font-semibold tw-text-gray-800">{data.label}</span>
        </div>
        <div className="tw-text-xs tw-text-gray-500 tw-ml-7">
          {data.description}
        </div>
      </div>
    )}
    onValueChanged={(e) => handleModeChange(e.value)}
  />
</div>
```

**Pros**:
- Compact, saves vertical space
- Familiar dropdown pattern
- Good for many options
- DevExtreme built-in search/filter

**Cons**:
- Requires click to see all options
- Disabled items might be hidden
- Less visual impact
- User needs to open dropdown to explore

---

### Option C: Segmented Button Group (Compact)

**Visual**: Horizontal button group for quick switching

```jsx
<div>
  <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
    Data Mode
  </label>
  <div className="tw-flex tw-flex-wrap tw-gap-2">
    {supportedModes.map(mode => (
      <Button
        key={mode.value}
        text={mode.label}
        icon={mode.icon}
        type={newWidget.mode === mode.value ? 'default' : 'normal'}
        stylingMode={newWidget.mode === mode.value ? 'contained' : 'outlined'}
        onClick={() => handleModeChange(mode.value)}
        hint={mode.description}
      />
    ))}
  </div>
</div>
```

**Pros**:
- Very compact
- Quick switching between modes
- Good for 3-4 modes
- Clean horizontal layout

**Cons**:
- Limited space for descriptions
- Can wrap on mobile
- Not ideal for 6 modes
- Tooltips required for descriptions

---

### Option D: Wizard-Style Steps (Advanced)

**Visual**: Step-by-step mode selection with explanations

```jsx
<div className="tw-space-y-4">
  {/* Step 1: Choose Data Behavior */}
  <div className="tw-border tw-border-gray-200 tw-rounded-lg tw-p-4">
    <h4 className="tw-font-semibold tw-text-gray-800 tw-mb-3">
      Step 1: Choose Data Behavior
    </h4>

    <div className="tw-space-y-2">
      <div className="tw-flex tw-items-start">
        <input
          type="radio"
          name="dataCategory"
          value="realtime"
          checked={dataCategoryMode === 'realtime'}
          onChange={() => setDataCategory('realtime')}
          className="tw-mt-1 tw-mr-3"
        />
        <div>
          <div className="tw-font-medium tw-text-gray-800">Real-time</div>
          <div className="tw-text-xs tw-text-gray-500">
            Data updates automatically as new values arrive
          </div>
        </div>
      </div>

      <div className="tw-flex tw-items-start">
        <input
          type="radio"
          name="dataCategory"
          value="historical"
          checked={dataCategory === 'historical'}
          onChange={() => setDataCategory('historical')}
          className="tw-mt-1 tw-mr-3"
        />
        <div>
          <div className="tw-font-medium tw-text-gray-800">Historical</div>
          <div className="tw-text-xs tw-text-gray-500">
            Data from a completed time period
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Step 2: Choose Aggregation Style */}
  {dataCategory === 'historical' && (
    <div className="tw-border tw-border-gray-200 tw-rounded-lg tw-p-4">
      <h4 className="tw-font-semibold tw-text-gray-800 tw-mb-3">
        Step 2: Choose Aggregation Style
      </h4>

      {/* Show relevant modes based on category */}
      <div className="tw-space-y-2">
        {/* ... mode selection ... */}
      </div>
    </div>
  )}
</div>
```

**Pros**:
- Educational for new users
- Guides decision-making
- Can explain complex concepts
- Reduces cognitive load

**Cons**:
- More clicks required
- Takes more space
- Slower for experienced users
- May feel patronizing

---

## 4. Recommended Hybrid Approach

### Design: Context-Aware Mode Selection

```jsx
const ModeSelectorComponent = ({
  newWidget,
  setNewWidget,
  dataSourceMeta,
  visualizationType
}) => {
  // Filter modes based on widget type and data source
  const availableModes = useMemo(() => {
    const supportedByDataSource = dataSourceMeta?.supportedModes || [];
    const compatibleWithWidget = getCompatibleModesForWidget(
      visualizationType,
      supportedByDataSource
    );
    return compatibleWithWidget;
  }, [dataSourceMeta, visualizationType]);

  // Group modes by category
  const modeGroups = {
    realtime: availableModes.filter(m => m.value === 'live'),
    historical: availableModes.filter(m =>
      ['historical_snapshot', 'daily_aggregated', 'running_cumulative'].includes(m.value)
    ),
    advanced: availableModes.filter(m =>
      ['rolling_window', 'compare_periods'].includes(m.value)
    )
  };

  return (
    <div className="tw-space-y-4">
      <div className="tw-flex tw-items-center tw-justify-between">
        <label className="tw-block tw-text-sm tw-font-semibold tw-text-gray-800">
          <i className="fa-light fa-toggle-on tw-mr-2 tw-text-purple-600"></i>
          Data Mode
        </label>
        {/* Toggle between simple/advanced view */}
        <button
          className="tw-text-xs tw-text-blue-600 hover:tw-text-blue-700"
          onClick={() => setShowAdvancedModes(!showAdvancedModes)}
        >
          {showAdvancedModes ? 'Simple View' : 'Show Advanced'}
        </button>
      </div>

      <p className="tw-text-xs tw-text-gray-500">
        {getModeContextHelp(visualizationType)}
      </p>

      {/* Real-time Group */}
      {modeGroups.realtime.length > 0 && (
        <div>
          <div className="tw-text-xs tw-font-semibold tw-text-gray-600 tw-mb-2 tw-uppercase tw-tracking-wide">
            Real-time
          </div>
          <div className="tw-grid tw-grid-cols-1 tw-gap-2">
            {modeGroups.realtime.map(mode => (
              <ModeCard key={mode.value} mode={mode} selected={newWidget.mode === mode.value} onClick={handleModeChange} />
            ))}
          </div>
        </div>
      )}

      {/* Historical Group */}
      {modeGroups.historical.length > 0 && (
        <div>
          <div className="tw-text-xs tw-font-semibold tw-text-gray-600 tw-mb-2 tw-uppercase tw-tracking-wide">
            Historical
          </div>
          <div className="tw-grid tw-grid-cols-2 tw-gap-2">
            {modeGroups.historical.map(mode => (
              <ModeCard key={mode.value} mode={mode} selected={newWidget.mode === mode.value} onClick={handleModeChange} />
            ))}
          </div>
        </div>
      )}

      {/* Advanced Group (collapsible) */}
      {showAdvancedModes && modeGroups.advanced.length > 0 && (
        <div>
          <div className="tw-text-xs tw-font-semibold tw-text-gray-600 tw-mb-2 tw-uppercase tw-tracking-wide">
            Advanced
          </div>
          <div className="tw-grid tw-grid-cols-2 tw-gap-2">
            {modeGroups.advanced.map(mode => (
              <ModeCard key={mode.value} mode={mode} selected={newWidget.mode === mode.value} onClick={handleModeChange} />
            ))}
          </div>
        </div>
      )}

      {/* Context-specific help */}
      {newWidget.mode && (
        <ModeContextHelp mode={newWidget.mode} widgetType={visualizationType} />
      )}
    </div>
  );
};

const ModeCard = ({ mode, selected, onClick }) => (
  <button
    className={`tw-p-3 tw-border-2 tw-rounded-lg tw-transition-all tw-text-left
      ${selected
        ? `tw-border-${mode.color}-500 tw-bg-${mode.color}-50`
        : 'tw-border-gray-200 hover:tw-border-gray-300'}`}
    onClick={() => onClick(mode.value)}
  >
    <div className="tw-flex tw-items-center tw-mb-1">
      <i className={`fa-light ${mode.icon} tw-text-lg tw-text-${mode.color}-600 tw-mr-2`}></i>
      <span className="tw-font-semibold tw-text-sm tw-text-gray-800">{mode.label}</span>
    </div>
    <p className="tw-text-xs tw-text-gray-600 tw-line-clamp-2">
      {mode.description}
    </p>
  </button>
);
```

### Key Features:
1. **Context-aware**: Only shows modes compatible with widget type
2. **Grouped logically**: Real-time, Historical, Advanced
3. **Progressive disclosure**: Advanced modes hidden by default
4. **Visual feedback**: Icons, colors, descriptions
5. **Responsive**: 2-column grid for historical/advanced, 1-column for real-time
6. **Smart defaults**: Auto-select best mode based on widget type

---

## 5. Mode Compatibility Logic

```javascript
/**
 * Get compatible modes for a widget type
 */
const getCompatibleModesForWidget = (widgetType, supportedModes) => {
  const compatibility = {
    'BIG_STAT_CARD': {
      recommended: ['live', 'historical_snapshot', 'daily_aggregated', 'running_cumulative'],
      supported: ['live', 'historical_snapshot', 'daily_aggregated', 'running_cumulative', 'compare_periods'],
      excluded: ['rolling_window'] // Not meaningful for single stat
    },
    'CHART_LINE_TREND': {
      recommended: ['live', 'daily_aggregated', 'running_cumulative'],
      supported: ['live', 'daily_aggregated', 'running_cumulative', 'rolling_window', 'compare_periods'],
      excluded: ['historical_snapshot'] // Single point doesn't make a trend
    },
    'CHART_BAR_COMPARISON': {
      recommended: ['historical_snapshot', 'daily_aggregated'],
      supported: ['live', 'historical_snapshot', 'daily_aggregated', 'running_cumulative', 'compare_periods'],
      excluded: ['rolling_window']
    },
    'CHART_PIE_DISTRIBUTION': {
      recommended: ['historical_snapshot', 'daily_aggregated'],
      supported: ['live', 'historical_snapshot', 'daily_aggregated', 'running_cumulative'],
      excluded: ['rolling_window', 'compare_periods'] // Confusing to compare two pies
    },
    'DATA_TABLE_DETAILED': {
      recommended: ['historical_snapshot', 'daily_aggregated'],
      supported: ['live', 'historical_snapshot', 'daily_aggregated'],
      excluded: ['running_cumulative', 'rolling_window', 'compare_periods']
    },
    'PROGRESS_LIST': {
      recommended: ['historical_snapshot', 'daily_aggregated'],
      supported: ['live', 'historical_snapshot', 'daily_aggregated', 'running_cumulative'],
      excluded: ['rolling_window', 'compare_periods']
    }
  };

  const config = compatibility[widgetType] || {
    supported: supportedModes,
    excluded: []
  };

  // Filter data source supported modes by widget compatibility
  return supportedModes
    .filter(mode => !config.excluded.includes(mode))
    .map(mode => ({
      ...MODE_DEFINITIONS[mode],
      isRecommended: config.recommended?.includes(mode)
    }));
};

/**
 * Get context-specific help text
 */
const getModeContextHelp = (widgetType) => {
  const helpText = {
    'BIG_STAT_CARD': 'Choose how to display your single metric value',
    'CHART_LINE_TREND': 'Select how data points should be aggregated over time',
    'CHART_BAR_COMPARISON': 'Choose how to aggregate values for comparison',
    'CHART_PIE_DISTRIBUTION': 'Select how to calculate proportional distribution',
    'DATA_TABLE_DETAILED': 'Choose data loading and update behavior',
    'PROGRESS_LIST': 'Select how to rank and display progress items'
  };
  return helpText[widgetType] || 'Choose how data should be loaded';
};

/**
 * Get mode-specific help based on widget type
 */
const getModeHelpText = (mode, widgetType) => {
  const helpMatrix = {
    'live': {
      'BIG_STAT_CARD': 'The metric will update automatically as new data arrives. Perfect for monitoring current activity.',
      'CHART_LINE_TREND': 'New data points will be added to the chart in real-time as they occur.',
      'CHART_BAR_COMPARISON': 'Bar values will update live as transactions occur.',
      'CHART_PIE_DISTRIBUTION': 'Slice values will adjust in real-time as proportions change.'
    },
    'historical_snapshot': {
      'BIG_STAT_CARD': 'Shows a single aggregated value for the selected time period (e.g., yesterday\'s total).',
      'CHART_BAR_COMPARISON': 'Each bar represents the total for that category in the selected period.',
      'CHART_PIE_DISTRIBUTION': 'Shows the distribution breakdown for the selected period.'
    },
    'daily_aggregated': {
      'BIG_STAT_CARD': 'Sums up all daily values within the date range to show one total.',
      'CHART_LINE_TREND': 'Shows one data point per day, creating a trend line over your date range.',
      'CHART_BAR_COMPARISON': 'Each bar shows the total across all days in the range for that category.'
    },
    'running_cumulative': {
      'BIG_STAT_CARD': 'Shows the running total up to now (e.g., month-to-date fuel dispensed).',
      'CHART_LINE_TREND': 'Line shows cumulative total growing each day (MBFU pattern).',
      'CHART_BAR_COMPARISON': 'Bars show cumulative totals for each category.'
    },
    'rolling_window': {
      'CHART_LINE_TREND': 'Shows a moving window (e.g., last 24 hours) that shifts over time.',
    },
    'compare_periods': {
      'BIG_STAT_CARD': 'Shows current period value with delta vs previous period.',
      'CHART_LINE_TREND': 'Displays two trend lines: current period and previous period for comparison.',
      'CHART_BAR_COMPARISON': 'Shows grouped bars: current vs previous period for each category.'
    }
  };

  return helpMatrix[mode]?.[widgetType] || MODE_DEFINITIONS[mode]?.description || '';
};
```

---

## 6. Implementation Roadmap

### Phase 1: Update Frontend Definitions ✅
- [x] Add icon and color to MODE_DEFINITIONS
- [x] Create compatibility matrix
- [x] Build helper functions

### Phase 2: Implement Hybrid UI
- [ ] Create ModeCard component
- [ ] Implement mode grouping (Real-time, Historical, Advanced)
- [ ] Add progressive disclosure for advanced modes
- [ ] Implement context-specific help text

### Phase 3: Smart Defaults
- [ ] Auto-select mode based on widget type
- [ ] Pre-configure date presets per mode
- [ ] Set granularity defaults per mode
- [ ] Handle mode changes with validation

### Phase 4: Backend Validation
- [ ] Extend DataSourceManager to validate mode compatibility
- [ ] Return validation errors for unsupported modes
- [ ] Provide mode suggestions in API responses

### Phase 5: Testing & Documentation
- [ ] Test all widget types with all modes
- [ ] Document mode use cases
- [ ] Create user guide
- [ ] Add tooltips and help text

---

## 7. User Experience Flows

### Flow 1: Creating BigStatCard
1. User selects "BigStatCard" widget type
2. UI shows modes: Live, Snapshot, Daily Aggregated, Running Cumulative, Compare Periods
3. System recommends "Daily Aggregated" (highlighted)
4. User selects "Live"
5. Date presets auto-update to live options (Today, Last Hour, Last 4 Hours)
6. Granularity auto-sets to "minute"
7. Help text appears: "The metric will update automatically as new data arrives"

### Flow 2: Creating Line Chart
1. User selects "CHART_LINE_TREND" widget type
2. UI shows modes: Live, Daily Aggregated, Running Cumulative, Rolling Window, Compare Periods
3. "Daily Aggregated" is recommended
4. User expands "Advanced" to see Rolling Window
5. Selects "Rolling Window"
6. Help text: "Shows a moving window (e.g., last 24 hours) that shifts over time"
7. Date preset auto-suggests "last_24_hours"
8. Granularity auto-sets to "hour"

### Flow 3: Mode Not Supported
1. User creates Pie Chart
2. Selects "Running Cumulative" mode
3. Selects Data Source "Alert Summary"
4. Backend validates: "Alert Summary" doesn't support "running_cumulative"
5. UI shows warning: "Running Cumulative not available for Alert Summary. Try: Snapshot, Daily Aggregated"
6. User clicks suggestion to auto-switch to "Daily Aggregated"

---

## 8. Mobile Responsive Considerations

### Desktop (>= 768px)
- 2-column grid for Historical/Advanced modes
- 1-column for Real-time mode
- Full descriptions visible
- Advanced section expanded by default

### Tablet (>= 640px)
- 2-column grid maintained
- Shorter descriptions
- Advanced section collapsed by default

### Mobile (< 640px)
- 1-column stack for all modes
- Icons prominent
- Minimal descriptions
- Advanced section collapsed
- Modal or drawer for mode selection

```jsx
// Responsive grid
<div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-2">
  {/* Mode cards */}
</div>

// Mobile-optimized card
<button className="tw-p-2 sm:tw-p-3 ...">
  <div className="tw-flex tw-items-center">
    <i className="tw-text-lg sm:tw-text-xl ..."></i>
    <span className="tw-text-sm sm:tw-text-base ..."></span>
  </div>
  <p className="tw-text-xs tw-hidden sm:tw-block ...">
    {/* Description only on larger screens */}
  </p>
</button>
```

---

## 9. Accessibility Considerations

### ARIA Labels
```jsx
<button
  role="radio"
  aria-checked={selected}
  aria-describedby={`mode-${mode.value}-description`}
  aria-label={`Select ${mode.label} mode`}
>
  {/* Card content */}
</button>

<div id={`mode-${mode.value}-description`} className="tw-sr-only">
  {mode.description}. {getModeHelpText(mode.value, widgetType)}
</div>
```

### Keyboard Navigation
- Tab through mode cards
- Enter/Space to select
- Arrow keys for grid navigation
- Escape to close help panels

### Screen Readers
- Announce selected mode changes
- Read full descriptions on focus
- Announce unsupported modes with reason

---

## 10. Next Steps

1. **Review & Feedback**: Share this document with team for feedback
2. **Design Mockup**: Create Figma/design mockups for hybrid approach
3. **Prototype**: Build interactive prototype in dev environment
4. **User Testing**: Test with 3-5 users for usability feedback
5. **Implementation**: Build production version following roadmap
6. **Documentation**: Update user guides and API documentation

---

## Appendix: Color Palette

```javascript
const MODE_COLORS = {
  live: {
    border: 'tw-border-green-500',
    bg: 'tw-bg-green-50',
    text: 'tw-text-green-600',
    hover: 'hover:tw-border-green-300'
  },
  historical_snapshot: {
    border: 'tw-border-blue-500',
    bg: 'tw-bg-blue-50',
    text: 'tw-text-blue-600',
    hover: 'hover:tw-border-blue-300'
  },
  daily_aggregated: {
    border: 'tw-border-purple-500',
    bg: 'tw-bg-purple-50',
    text: 'tw-text-purple-600',
    hover: 'hover:tw-border-purple-300'
  },
  running_cumulative: {
    border: 'tw-border-orange-500',
    bg: 'tw-bg-orange-50',
    text: 'tw-text-orange-600',
    hover: 'hover:tw-border-orange-300'
  },
  rolling_window: {
    border: 'tw-border-teal-500',
    bg: 'tw-bg-teal-50',
    text: 'tw-text-teal-600',
    hover: 'hover:tw-border-teal-300'
  },
  compare_periods: {
    border: 'tw-border-indigo-500',
    bg: 'tw-bg-indigo-50',
    text: 'tw-text-indigo-600',
    hover: 'hover:tw-border-indigo-300'
  }
};
```

---

**End of Analysis Document**
