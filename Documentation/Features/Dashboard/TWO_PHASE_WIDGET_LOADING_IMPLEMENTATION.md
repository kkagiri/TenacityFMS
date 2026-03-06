# Two-Phase Widget Loading Implementation

## Overview
This document describes the implementation of a two-phase widget loading pattern inspired by DevExtreme's approach, where widgets first load aggregate/historical data and then receive incremental streaming updates.

## Pattern Description

### Phase 1: Initial Aggregate Data Load
- **Purpose**: Load complete historical/aggregate data for the widget's time range
- **Method**: `GetInitialWidgetData(widgetInstanceId)`
- **Data Type**: Complete dataset (e.g., all fuel dispensed today)
- **Response**: `InitialWidgetDataResponse`

### Phase 2: Incremental Streaming Updates
- **Purpose**: Receive only new data points as they occur
- **Method**: `SubscribeToEnhancedWidgetStreaming(widgetInstanceId, options)`
- **Data Type**: Incremental data only (e.g., new fuel transactions)
- **Response**: `WidgetDataUpdate` with `updateType: "incremental"`

## Supported Widget Types

This pattern works for **any widget type** based on the `mode` configuration:

### Chart Widgets
- **Bar Charts**: Append new data points to existing bars
- **Line Charts**: Add new points to the line series
- **Pie Charts**: Update slice values incrementally

### Data Tables
- **Table Widgets**: Append new rows to existing table data
- **Progress Lists**: Add new items or update existing progress

### Stat Widgets
- **Ticker/Stat Cards**: Update current value but maintain history
- **Gauges**: Update current reading with historical trend

## Configuration Requirements

For a widget to use incremental loading, it must have:

```json
{
  "mode": "live",  // Enables incremental streaming
  "datePreset": "today",  // Time range for initial load
  "aggregation": "SUM",   // How to aggregate initial data
  // ... other widget-specific settings
}
```

## Implementation Details

### Frontend Changes

#### Data Handling Functions
```javascript
// Check if widget should use incremental loading
const shouldUseIncrementalLoading = (widget) => {
  const config = JSON.parse(widget.configurationJson || '{}');
  return config.mode === 'live' || config.settings?.mode === 'live';
};

// Append incremental data based on widget type
const appendIncrementalData = (existingData, newData, widgetType) => {
  // Different logic for charts, tables, stats, etc.
};
```

#### Widget Initialization
```javascript
// Phase 1: Load initial aggregate data
await signalRService.requestInitialWidgetData(widgetInstanceId);

// Phase 2: Subscribe to incremental updates (only for live widgets)
if (isLiveWidget) {
  await signalRService.connection.invoke('SubscribeToEnhancedWidgetStreaming',
    widgetInstanceId, { incrementalOnly: true });
}
```

### Backend Changes

#### DashboardHub Methods
```csharp
// Phase 1: Initial data with complete historical aggregation
public async Task GetInitialWidgetData(int widgetInstanceId) {
  // Force cumulative mode for initial data
  metricRequest.Mode = "cumulative";
  // Get complete dataset for the specified time range
}

// Phase 2: Streaming subscription for live widgets only
public async Task SubscribeToEnhancedWidgetStreaming(int widgetInstanceId, object streamingOptions) {
  // Check if widget is in live mode
  if (mode?.ToLower() != "live") return;
  // Subscribe to incremental updates
}
```

## Example: Fuel Dispensed Today Widget

### Configuration
```json
{
  "widgetType": "CHART_BAR_COMPARISON",
  "dataSource": "fuel_dispensed",
  "mode": "live",
  "datePreset": "today",
  "aggregation": "SUM"
}
```

### Phase 1: Initial Load
- **Request**: Get all fuel dispensed from 00:00 to current time
- **Response**: Complete aggregated data by hour/vehicle/site
- **Data**: `{ chartData: [hour1: 500L, hour2: 750L, ...] }`

### Phase 2: Streaming Updates
- **Trigger**: New fuel transaction occurs
- **Data**: `{ chartData: [currentHour: +25L] }` (incremental only)
- **Result**: Frontend appends +25L to current hour's total

## Benefits

1. **Performance**: Initial load gets complete data efficiently
2. **Real-time**: Incremental updates provide live data without full refresh
3. **Flexibility**: Works with any widget type (charts, tables, stats)
4. **Scalability**: Streaming only sends new data, not entire datasets
5. **User Experience**: Smooth updates without data loss or flickering

## DevExtreme Pattern Comparison

### Our Implementation
```javascript
// Phase 1: Initial aggregate data
await signalRService.requestInitialWidgetData(widgetId);

// Phase 2: Incremental streaming
signalRService.on('widgetDataUpdate', (data) => {
  if (data.updateType === 'incremental') {
    appendIncrementalData(existingData, data.data, widgetType);
  }
});
```

### DevExtreme Reference
```javascript
// Initial data load
const store = new CustomStore({
  load: () => hubConnection.invoke('getAllData')
});

// Incremental updates
hubConnection.on('updateStockPrice', (data) => {
  store.push([{ type: 'insert', key: data.date, data }]);
});
```

## Next Steps

1. **Background Service**: Implement automatic streaming for live widgets
2. **Data Deduplication**: Ensure no duplicate data points
3. **Error Handling**: Graceful fallback if streaming fails
4. **Performance Monitoring**: Track update frequency and data size
5. **Testing**: Comprehensive testing with different widget types

## Configuration Examples

### Live Bar Chart (Fuel by Hour)
```json
{
  "mode": "live",
  "datePreset": "today",
  "chartType": "bar",
  "groupBy": "hour",
  "aggregation": "SUM"
}
```

### Live Data Table (Recent Transactions)
```json
{
  "mode": "live",
  "datePreset": "today",
  "maxRows": 100,
  "sortBy": "timestamp DESC"
}
```

### Live Stat Ticker (Total Fuel Today)
```json
{
  "mode": "live",
  "datePreset": "today",
  "aggregation": "SUM",
  "showHistory": true
}
```
