using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.ModelsDTOs.Dashboard;
using FMS.Application.Services.Dashboard.WidgetFactories;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace FMS.Application.Services.Dashboard {
    /// <summary>
    /// Enhanced widget factory service that bridges Widget Factory system with existing DataSourceManager
    /// </summary>
    public interface IWidgetFactoryService {
        Task<WidgetDataResult> GetWidgetDataAsync (WidgetDataRequest request);
        Task<WidgetValidationResult> ValidateWidgetConfigurationAsync (WidgetValidationRequest request);
        Task<List<WidgetTypeInfo>> GetAvailableWidgetTypesAsync ();
    }

    public class WidgetFactoryService : IWidgetFactoryService {
        private readonly WidgetFactoryCoordinator _widgetFactory;
        private readonly IDataSourceManager _dataSourceManager;
        private readonly ILogger<WidgetFactoryService> _logger;

        public WidgetFactoryService (
            WidgetFactoryCoordinator widgetFactory,
            IDataSourceManager dataSourceManager,
            ILogger<WidgetFactoryService> logger) {
            _widgetFactory = widgetFactory;
            _dataSourceManager = dataSourceManager;
            _logger = logger;
        }

        public async Task<WidgetDataResult> GetWidgetDataAsync (WidgetDataRequest request) {
            try {
                // Step 1: Validate widget configuration using factory
                var validation = _widgetFactory.ValidateWidgetConfiguration (
                    request.WidgetType,
                    request.Category,
                    request.DataSource,
                    request.Filters,
                    request.Settings);

                if (!validation.IsValid) {
                    return new WidgetDataResult {
                        Success = false,
                            ErrorMessage = validation.ErrorMessage,
                            ValidationErrors = validation.ValidationErrors
                    };
                }

                // Step 2: Process widget configuration using factory
                var processingResult = await _widgetFactory.ProcessWidgetDataAsync (
                    request.WidgetType,
                    request.Category,
                    request.DataSource,
                    request.Filters,
                    request.Settings,
                    request.TimeRange,
                    request.Mode);

                if (!processingResult.Success) {
                    return new WidgetDataResult {
                        Success = false,
                            ErrorMessage = processingResult.ErrorMessage
                    };
                }

                // Step 3: Create enhanced metric request with processed filters
                var metricRequest = CreateMetricRequest (request, processingResult);

                // Step 4: Get data from DataSourceManager based on query type
                object rawData;
                switch (processingResult.DataQueryType) {
                    case "realtime":
                        rawData = await _dataSourceManager.GetLiveDataAsync (request.DataSource, metricRequest);
                        break;
                    case "historical":
                        if (processingResult.AggregationType != "none") {
                            rawData = await _dataSourceManager.GetAggregatedDataAsync (
                                request.DataSource,
                                metricRequest,
                                GetAggregationInterval (request.TimeRange));
                        } else {
                            rawData = await _dataSourceManager.GetInitialDataAsync (request.DataSource, metricRequest);
                        }
                        break;
                    default:
                        rawData = await _dataSourceManager.GetInitialDataAsync (request.DataSource, metricRequest);
                        break;
                }

                // Step 5: Transform data using DataSourceManager (your existing logic)
                var transformedData = await _dataSourceManager.TransformDataForWidgetType (
                    request.WidgetType,
                    rawData,
                    processingResult.ProcessedSettings);

                // Step 6: Return enhanced result
                return new WidgetDataResult {
                    Success = true,
                        Data = transformedData,
                        ProcessedFilters = processingResult.ProcessedFilters,
                        ProcessedSettings = processingResult.ProcessedSettings,
                        AggregationType = processingResult.AggregationType,
                        DataQueryType = processingResult.DataQueryType,
                        Metadata = _dataSourceManager.GetDataSourceMetadata (request.DataSource)
                };

            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting widget data for type {WidgetType}, data source {DataSource}",
                    request.WidgetType, request.DataSource);

                return new WidgetDataResult {
                    Success = false,
                        ErrorMessage = ex.Message
                };
            }
        }

        public async Task<WidgetValidationResult> ValidateWidgetConfigurationAsync (WidgetValidationRequest request) {
            try {
                // Use factory validation
                var validation = _widgetFactory.ValidateWidgetConfiguration (
                    request.WidgetType,
                    request.Category,
                    request.DataSource,
                    request.Filters,
                    request.Settings);

                // Enhance with data source validation
                if (validation.IsValid) {
                    var dataSourceMetadata = _dataSourceManager.GetDataSourceMetadata (request.DataSource);

                    // Check data source compatibility
                    if (request.Mode == "live" && !dataSourceMetadata.SupportsLiveData) {
                        validation.ValidationErrors.Add ("Data source does not support live data");
                        validation.IsValid = false;
                        validation.ErrorMessage = "Data source compatibility issue";
                    }

                    // Check aggregation compatibility (case-insensitive)
                    if (!string.IsNullOrEmpty (request.AggregationType) &&
                        !dataSourceMetadata.SupportedAggregations.Any (agg =>
                            string.Equals (agg, request.AggregationType, StringComparison.OrdinalIgnoreCase))) {
                        validation.ValidationErrors.Add ($"Aggregation type '{request.AggregationType}' not supported by data source");
                        validation.IsValid = false;
                        validation.ErrorMessage = "Aggregation compatibility issue";
                    }
                }

                return validation;

            } catch (Exception ex) {
                _logger.LogError (ex, "Error validating widget configuration for type {WidgetType}", request.WidgetType);

                return new WidgetValidationResult {
                    IsValid = false,
                        ErrorMessage = ex.Message
                };
            }
        }

        public async Task<List<WidgetTypeInfo>> GetAvailableWidgetTypesAsync () {
            try {
                var supportedTypes = _widgetFactory.GetAllSupportedWidgetTypes ();
                var result = new List<WidgetTypeInfo> ();

                foreach (var kvp in supportedTypes) {
                    var widgetType = kvp.Key;
                    var config = kvp.Value;

                    result.Add (new WidgetTypeInfo {
                        WidgetType = widgetType,
                            DisplayName = GetDisplayName (widgetType),
                            Description = GetDescription (widgetType),
                            Category = GetCategoryFromWidgetType (widgetType),
                            ExpectedDataFormat = config.ExpectedDataFormat,
                            SupportedAggregations = config.SupportedAggregations,
                            RequiresTrendData = config.RequiresTrendData,
                            SupportsRealTimeData = config.SupportsRealTimeData,
                            DefaultRefreshInterval = config.DefaultRefreshInterval,
                            DefaultSettings = config.DefaultSettings
                    });
                }

                return result;

            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting available widget types");
                return new List<WidgetTypeInfo> ();
            }
        }

        // Helper methods
        private DashboardMetricRequestDto CreateMetricRequest (WidgetDataRequest request, WidgetDataProcessingResult processingResult) {
            return new DashboardMetricRequestDto {
                MetricType = MapDataSourceToMetricType (request.DataSource),
                    Mode = request.Mode,
                    DatePreset = request.TimeRange,
                    SiteIds = ExtractSiteIds (processingResult.ProcessedFilters),
                    VehicleIds = ExtractVehicleIds (processingResult.ProcessedFilters),
                    VehicleType = ExtractVehicleTypeIds (processingResult.ProcessedFilters)
            };
        }

        private List<int> ExtractSiteIds (Dictionary<string, object> filters) {
            if (filters.TryGetValue ("siteFilter", out var siteFilter) && siteFilter is List<object> sites) {
                return sites.ConvertAll (s => Convert.ToInt32 (s));
            }
            return new List<int> ();
        }

        private List<int> ExtractVehicleIds (Dictionary<string, object> filters) {
            if (filters.TryGetValue ("vehicleIds", out var vehicleFilter) && vehicleFilter is List<object> vehicles) {
                return vehicles.ConvertAll (v => Convert.ToInt32 (v));
            }
            return new List<int> ();
        }

        private string ExtractVehicleType (Dictionary<string, object> filters) {
            return filters.TryGetValue ("vehicleTypeFilter", out var vehicleType) ?
                vehicleType?.ToString () ?? string.Empty :
                string.Empty;
        }

        private List<int> ExtractVehicleTypeIds (Dictionary<string, object> filters) {
            if (filters.TryGetValue ("vehicleTypeIds", out var vehicleTypeFilter) && vehicleTypeFilter is List<object> vehicleTypes) {
                return vehicleTypes.ConvertAll (v => Convert.ToInt32 (v));
            }
            return new List<int> ();
        }

        private string MapDataSourceToMetricType (string dataSource) {
            // Map your data source constants to metric types
            return dataSource
            switch {
                "fuel_dispense" => "fuel_dispensed",
                "fuel_used_gps" => "fuel_consumption",
                "engine_hours" => "engine_hours",
                "km_travel" => "distance_travelled",
                "fuel_efficiency" => "fuel_efficiency",
                _ => dataSource
            };
        }

        private string GetAggregationInterval (string timeRange) {
            return timeRange
            switch {
                "today" => "hourly",
                "yesterday" => "hourly",
                "last_7_days" => "daily",
                "last_30_days" => "daily",
                "last_3_months" => "weekly",
                "last_6_months" => "monthly",
                "last_year" => "monthly",
                _ => "daily"
            };
        }

        private string GetDisplayName (string widgetType) {
            return widgetType
            switch {
                "CHART_LINE_TREND" => "Line Chart",
                "CHART_BAR_COMPARISON" => "Bar Chart",
                "CHART_PIE_DISTRIBUTION" => "Pie Chart",
                "BIG_STAT_CARD" => "Big Statistics Card",
                "ticker" => "Ticker",
                "DATA_TABLE_DETAILED" => "Data Table",
                "PROGRESS_LIST" => "Progress List",
                "ALERT_NOTIFICATION" => "Alert Widget",
                _ => widgetType
            };
        }

        private string GetDescription (string widgetType) {
            return widgetType
            switch {
                "CHART_LINE_TREND" => "Time series trend visualization",
                "CHART_BAR_COMPARISON" => "Comparative bar chart",
                "CHART_PIE_DISTRIBUTION" => "Distribution pie chart",
                "BIG_STAT_CARD" => "Large statistics card with trends",
                "ticker" => "Compact numeric display",
                "DATA_TABLE_DETAILED" => "Detailed tabular data",
                "PROGRESS_LIST" => "Progress indicators with percentages",
                "ALERT_NOTIFICATION" => "System alerts and notifications",
                _ => $"Widget of type {widgetType}"
            };
        }

        private string GetCategoryFromWidgetType (string widgetType) {
            return widgetType
            switch {
                "CHART_LINE_TREND"
                or "CHART_BAR_COMPARISON"
                or "CHART_PIE_DISTRIBUTION" => "charts",
                    "BIG_STAT_CARD"
                or "ticker" => "statistics",
                    "DATA_TABLE_DETAILED"
                or "PROGRESS_LIST" => "tables",
                    "ALERT_NOTIFICATION" => "alerts",
                    _ => "general"
            };
        }
    }

    // Request/Response DTOs
    public class WidgetDataRequest {
        public string WidgetType { get; set; } = null!;
        public string Category { get; set; } = null!;
        public string DataSource { get; set; } = null!;
        public Dictionary<string, object> Filters { get; set; } = new ();
        public Dictionary<string, object> Settings { get; set; } = new ();
        public string TimeRange { get; set; } = "yesterday";
        public string Mode { get; set; } = "cumulative";
    }

    public class WidgetDataResult {
        public bool Success { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;
        public List<string> ValidationErrors { get; set; } = new ();
        public object Data { get; set; } = null!;
        public Dictionary<string, object> ProcessedFilters { get; set; } = new ();
        public Dictionary<string, object> ProcessedSettings { get; set; } = new ();
        public string AggregationType { get; set; } = "none";
        public string DataQueryType { get; set; } = "default";
        public DataSourceMetadata Metadata { get; set; } = null!;
    }

    public class WidgetValidationRequest {
        public string WidgetType { get; set; } = null!;
        public string Category { get; set; } = null!;
        public string DataSource { get; set; } = null!;
        public Dictionary<string, object> Filters { get; set; } = new ();
        public Dictionary<string, object> Settings { get; set; } = new ();
        public string Mode { get; set; } = "cumulative";
        public string AggregationType { get; set; } = "sum";
    }

    public class WidgetTypeInfo {
        public string WidgetType { get; set; } = null!;
        public string DisplayName { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string Category { get; set; } = null!;
        public string ExpectedDataFormat { get; set; } = null!;
        public List<string> SupportedAggregations { get; set; } = new ();
        public bool RequiresTrendData { get; set; }
        public bool SupportsRealTimeData { get; set; }
        public int DefaultRefreshInterval { get; set; }
        public Dictionary<string, object> DefaultSettings { get; set; } = new ();
    }
}