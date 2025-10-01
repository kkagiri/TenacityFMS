# Widget Factory Integration Complete Setup Guide

> Deprecation note (Sept 2025): The legacy `WidgetDataService`/`IWidgetDataService` bridge has been removed. Use `IDataSourceManager` with `IWidgetFactoryService` and `IWidgetDataTransformerService` instead.

## 🚀 Service Registration

### 1. Add to Program.cs or Startup.cs

```csharp
// In your service configuration section (Program.cs)
services.AddScoped<IDataSourceManager, DataSourceManager>();
services.AddScoped<IWidgetDataTransformerService, WidgetDataTransformerService>();
services.AddScoped<IMetricCalculationService, MetricCalculationService>();
services.AddScoped<ITimeSeriesDataService, TimeSeriesDataService>();
services.AddScoped<IWidgetFactoryService, WidgetFactoryService>();
```

### 2. Dependencies Already Handled

Your `DataSourceManager` is already perfect! The integration leverages your existing:

- ✅ `TransformDataForWidgetType` method
- ✅ Data source metadata system
- ✅ Aggregation support
- ✅ Live/historical data handling

## 🔧 Enhanced Data Pipeline Flow

```text
Form Input → WidgetFactoryService → Factory Processing → DataSourceManager → Widget UI
    ↓                   ↓                    ↓                 ↓               ↓
Site Filters → Validation → Smart Processing → Data Transform → BigStatCard.js
Date Range → Config Check → Time Processing → Format Data → LineChart.js
Widget Type → Type Factory → Aggregation → Widget Format → Your Components
```

## 📊 Updated Controller Example

```csharp
[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase {
    private readonly IDataSourceManager _dataSourceManager;
    private readonly IWidgetFactoryService _widgetFactory;

    public DashboardController(IDataSourceManager dataSourceManager, IWidgetFactoryService widgetFactory) {
        _dataSourceManager = dataSourceManager;
        _widgetFactory = widgetFactory;
    }

    [HttpGet("widget-data/{instanceId}")]
    public async Task<IActionResult> GetWidgetData(int instanceId) {
        var widgetInstance = await GetWidgetInstanceAsync(instanceId);
        var config = JsonConvert.DeserializeObject<dynamic>(widgetInstance.ConfigurationJson);

        var request = new DashboardMetricRequestDto {
            WidgetType = config.visualizationType,
            Category = config.category,
            DataSourceKey = config.dataSource,
            Filters = JsonConvert.DeserializeObject<Dictionary<string, object>>(config.filters.ToString()),
            Settings = JsonConvert.DeserializeObject<Dictionary<string, object>>(config.settings.ToString()),
            TimeRange = config.datePreset ?? "yesterday",
            Mode = config.mode ?? "cumulative"
        };

        var processed = await _widgetFactory.PreProcessAsync(request);
        var result = await _dataSourceManager.TransformDataForWidgetType(processed);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    [HttpGet("widget-types")]
    public IActionResult GetAvailableWidgetTypes() {
        return Ok(WidgetTypeDefinitions.AllTypes);
    }
}
```

## 🎯 Benefits Achieved

### ✅ Your UI Components Protected

- **BigStatCardWidget.js** - Still gets `data.value`, `data.trend`, `data.unit`
- **LineChartWidget.js** - Still gets `data.chartData` array
- **All widgets** - Zero changes required

### ✅ Enhanced Data Processing

```csharp
// Before: Simple JSON storage
"filters": { "siteIds": [1,2,3] }

// After: Intelligent processing
"processedFilters": {
    "siteFilter": [1,2,3],
    "timeRange": "yesterday",
    "aggregationPeriod": "hour",
    "trendComparisonPeriod": "day_before_yesterday"
}
```

### ✅ Widget-Specific Intelligence

```text
// Chart widgets get:
- Time-based aggregation
- Series configuration
- Chart-specific settings

// Stat cards get:
- Trend calculation
- Comparison periods
- Formatting rules

// Tables get:
- Column configuration
- Pagination settings
- Filter processing
```

## 🔗 Integration with Your DataSourceManager

The `IWidgetFactoryService` + `IDataSourceManager` pairing acts as the smart layer that:

1. Validates widget configurations using factories
2. Processes filters and settings intelligently
3. Calls your existing `DataSourceManager` methods
4. Returns enhanced data ready for your UI components

Your `DataSourceManager.TransformDataForWidgetType` continues to work exactly as before, but now receives processed and validated inputs.

## 🚦 Ready to Use

The system is now complete:

- ✅ **Factory System**: Validates and processes widget configurations
- ✅ **Factory + DSM**: Bridges factories with your DataSourceManager
- ✅ **Commands**: Enhanced widget creation with validation
- ✅ **UI Protection**: Your widgets remain unchanged
- ✅ **Aggregation**: Built-in sum, avg, custom aggregation support

Just add the service registration and you're ready to create widgets with intelligent data processing while preserving your existing UI components!

## 🎉 Final Architecture

```text
Widget Form → CreateWidgetCommand → WidgetFactoryService → Factory Processing
                                                    ↓
UI Components ← DataSourceManager ← Enhanced Filters ← Widget Factory
```

Your concerns about data acquisition, aggregation, and UI compatibility are now fully addressed with zero breaking changes to your existing widget components.
