# GroupBy Frontend-Backend Disconnect Fix

**Date**: September 30, 2025
**Issue**: Pie charts and bar charts showing time-based slices instead of categorical groupings
**Root Cause**: Frontend widget form not properly handling `groupBy` parameter

## Problem Description

When creating widgets like `CHART_PIE_DISTRIBUTION` or `CHART_BAR_COMPARISON`, the frontend was not properly including or initializing the `groupBy` parameter, resulting in:

1. **Default behavior**: `groupBy: 'none'` causing time-based grouping
2. **Pie charts**: Showing dates as slices (e.g., "Sep 29") instead of sites/vehicle types
3. **Bar charts**: Showing dates as categories instead of comparative groups
4. **User confusion**: Widget appeared to have data but not in the expected format

### Example Issue

**Widget Configuration**:
```json
{
  "widgetType": "CHART_PIE_DISTRIBUTION",
  "dataSource": "fuel_dispensed",
  "mode": "cumulative",
  "timeRange": "yesterday",
  "aggregation": "SUM"
  // Missing: "groupBy" parameter
}
```

**Result**:
```json
{
  "slices": [
    {
      "category": "Sep 29",
      "label": "Sep 29",
      "value": 5037,
      "percentage": 100
    }
  ]
}
```

**Expected** (with `groupBy: 'site'`):
```json
{
  "slices": [
    {
      "category": "Site A",
      "value": 2500,
      "percentage": 49.6
    },
    {
      "category": "Site B",
      "value": 1537,
      "percentage": 30.5
    },
    {
      "category": "Site C",
      "value": 1000,
      "percentage": 19.9
    }
  ]
}
```

## Changes Made

### 1. Frontend - WidgetForm.js

#### A. Added `groupBy` to Metadata Defaults Merging

**File**: `fms.frontend/src/components/dashboard/ModalPopup/WidgetForm.js`

**Change**: Updated `mergeWithMetadataDefaults` function to include `groupBy` parameter

```javascript
const baseConfig = {
  mode: partial.mode ?? prevState.mode,
  aggregation: partial.aggregation ?? prevState.aggregation,
  granularity: partial.granularity ?? prevState.granularity,
  datePreset: partial.datePreset ?? prevState.datePreset,
  unit: partial.unit ?? prevState.unit,
  includeTotal: partial.includeTotal ?? prevState.includeTotal,
  topK: partial.topK ?? prevState.topK,
  cumulative: partial.cumulative ?? prevState.cumulative,
  smoothing: partial.smoothing ?? prevState.smoothing,
  groupBy: partial.groupBy ?? prevState.groupBy  // ✅ ADDED
};

// Later in the function...
if (normalized.groupBy !== undefined) {
  next.groupBy = normalized.groupBy;  // ✅ ADDED
}

next.settings = {
  ...(prevState.settings || {}),
  ...(partial.settings || {}),
  mode: next.mode,
  aggregation: next.aggregation,
  granularity: next.granularity,
  datePreset: next.datePreset,
  unit: next.unit,
  includeTotal: next.includeTotal,
  topK: next.topK,
  groupBy: next.groupBy  // ✅ ADDED
};
```

#### B. Enhanced Group By UI Section

**Change**: Improved UI clarity and user guidance for `groupBy` selection

```javascript
{/* Group By */}
{newWidget.visualizationType && ['CHART_BAR_COMPARISON','CHART_PIE_DISTRIBUTION','DATA_TABLE_DETAILED','PROGRESS_LIST'].includes(newWidget.visualizationType) && (
  <div className="tw-space-y-2">
    <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
      Group By
      {['CHART_PIE_DISTRIBUTION', 'CHART_BAR_COMPARISON'].includes(newWidget.visualizationType) && (
        <span className="tw-ml-2 tw-text-xs tw-text-orange-600 tw-font-semibold">
          <i className="fa-light fa-info-circle tw-mr-1"></i>
          Recommended for better visualization
        </span>
      )}
    </label>
    <SelectBox
      items={(dataSourceMeta?.supportedGroupBy || ['none','site','vehicleType']).map(g => ({
        value: g,
        text: g === 'none' ? 'None (Time-based)' : g.charAt(0).toUpperCase() + g.slice(1).replace(/([A-Z])/g, ' $1')
      }))}
      value={newWidget.groupBy || 'none'}
      // ... other props
    />
    <div className="tw-text-xs tw-text-gray-500">
      {newWidget.groupBy === 'none' || !newWidget.groupBy ? (
        <span className="tw-text-orange-600">
          <i className="fa-light fa-exclamation-triangle tw-mr-1"></i>
          Time-based grouping: Shows dates as {newWidget.visualizationType === 'CHART_PIE_DISTRIBUTION' ? 'slices' : 'categories'}.
          Consider using 'site' or 'vehicleType' for categorical comparison.
        </span>
      ) : (
        <span className="tw-text-green-600">
          <i className="fa-light fa-check-circle tw-mr-1"></i>
          Categorical grouping by {newWidget.groupBy}
        </span>
      )}
    </div>
  </div>
)}
```

#### C. Auto-Suggest GroupBy for Categorical Charts

**Change**: Added automatic suggestion of categorical grouping for pie/bar charts

```javascript
// Auto-suggest groupBy for categorical chart types
React.useEffect(() => {
  if (!newWidget.visualizationType || !dataSourceMeta) return;

  // Chart types that benefit from categorical grouping
  const needsGrouping = ['CHART_PIE_DISTRIBUTION', 'CHART_BAR_COMPARISON'].includes(newWidget.visualizationType);

  if (needsGrouping && (!newWidget.groupBy || newWidget.groupBy === 'none')) {
    // Suggest first non-'none' groupBy option
    const supportedGroupBy = dataSourceMeta?.supportedGroupBy || [];
    const firstCategorical = supportedGroupBy.find(g => g !== 'none');

    if (firstCategorical) {
      setNewWidget(prev => ({
        ...prev,
        groupBy: firstCategorical,
        settings: {
          ...prev.settings,
          groupBy: firstCategorical
        }
      }));
    }
  }
}, [newWidget.visualizationType, dataSourceMeta]);
```

### 2. Backend - Pie Chart Fallback (Already Fixed)

**File**: `FMS.Application/Features/Dashboard/Services/WidgetDataTransformerService.cs`

**Previous Fix**: Added fallback to convert time-series to categories when `groupBy='none'`

```csharp
private object TransformForPieChart(object rawData, Dictionary<string, object> configuration)
{
    List<(string key, decimal value, decimal percent)> categories = ExtractCategories(rawData);
    object? metadata = ExtractMetadata(rawData);

    // If no categories found (groupBy='none'), convert time-series to categories
    if (categories.Count == 0)
    {
        var timeSeries = ExtractTimeSeries(rawData);
        if (timeSeries.Count > 0)
        {
            // Convert time-series points to categorical slices for pie chart
            decimal timeSeriesTotal = timeSeries.Sum(p => p.value);
            categories = timeSeries
                .Select(p => {
                    var label = p.timestamp.ToString("MMM dd", System.Globalization.CultureInfo.InvariantCulture);
                    var percent = timeSeriesTotal > 0 ? Math.Round((p.value / timeSeriesTotal) * 100m, 2) : 0m;
                    return (key: label, value: p.value, percent: percent);
                })
                .ToList();
        }
    }
    // ... rest of transformation
}
```

## Testing Checklist

### Before Fix
- [ ] Pie chart with `groupBy='none'` shows single date slice
- [ ] Bar chart with `groupBy='none'` shows dates as categories
- [ ] No visual indicator about grouping importance
- [ ] User has to manually discover grouping options

### After Fix
- [x] Pie chart auto-suggests `groupBy='site'` when created
- [x] UI shows warning when `groupBy='none'` for pie/bar charts
- [x] UI shows success message when categorical grouping selected
- [x] GroupBy properly included in widget configuration
- [x] Backend correctly processes groupBy parameter
- [x] Fallback still works if groupBy='none' (shows dates)

## User Impact

### Before
1. User creates pie chart for "fuel dispensed"
2. Chart shows single slice with date
3. User confused why no site breakdown
4. User has to manually discover groupBy setting

### After
1. User creates pie chart for "fuel dispensed"
2. Form automatically suggests `groupBy='site'`
3. Chart shows multiple slices, one per site
4. If user changes to 'none', warning explains behavior

## Configuration Examples

### Good Configuration (Categorical)
```json
{
  "widgetType": "CHART_PIE_DISTRIBUTION",
  "dataSource": "fuel_dispensed",
  "mode": "cumulative",
  "timeRange": "yesterday",
  "aggregation": "SUM",
  "groupBy": "site",  // ✅ Categorical grouping
  "settings": {
    "groupBy": "site"
  }
}
```

### Time-Based Configuration (Still Valid)
```json
{
  "widgetType": "CHART_PIE_DISTRIBUTION",
  "dataSource": "fuel_dispensed",
  "mode": "cumulative",
  "timeRange": "last_7_days",
  "aggregation": "SUM",
  "groupBy": "none",  // ⚠️ Time-based grouping
  "settings": {
    "groupBy": "none"
  }
}
```

## Related Files

### Frontend
- `fms.frontend/src/components/dashboard/ModalPopup/WidgetForm.js` - Main form component
- `fms.frontend/src/services/dashboard/dataSourceService.js` - Metadata service

### Backend
- `FMS.Application/Features/Dashboard/Services/WidgetDataTransformerService.cs` - Data transformation
- `FMS.Application/Features/Dashboard/Services/DataSourceManager/DataSourceManager.Metadata.cs` - Metadata definitions
- `FMS.Application/Features/Dashboard/Command/CreateWidgetInstanceCommand.cs` - Widget creation

## Future Enhancements

1. **Smart Grouping Recommendations**:
   - Analyze data distribution and suggest best groupBy
   - Show preview of grouping options before selection

2. **Validation Rules**:
   - Warn if groupBy='none' results in single category
   - Suggest alternative groupings for better insights

3. **Template Defaults**:
   - Save common groupBy preferences per widget type
   - Learn from user patterns

4. **Documentation**:
   - Add tooltips explaining each groupBy option
   - Show example visualizations for each grouping

## Migration Notes

**Existing Widgets**: No migration needed. Existing widgets with `groupBy='none'` will continue to work with the fallback time-based grouping.

**New Widgets**: Will automatically get smart groupBy suggestions based on widget type.

## Conclusion

This fix addresses the frontend-backend disconnect by:
1. ✅ Properly handling `groupBy` in frontend form state
2. ✅ Auto-suggesting appropriate grouping for categorical charts
3. ✅ Providing clear UI guidance about grouping implications
4. ✅ Maintaining backward compatibility with time-based grouping

Users will now get better default visualizations while retaining the flexibility to use time-based grouping when appropriate.
