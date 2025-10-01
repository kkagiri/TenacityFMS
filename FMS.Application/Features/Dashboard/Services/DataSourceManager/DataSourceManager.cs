using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.Communication.SignalR;
using FMS.Application.Features.Dashboard;
using FMS.Domain.Entities.Dashboard;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace FMS.Application.Services.Dashboard {
    /// <summary>
    /// Unified data source manager implementation
    ///
    /// This class is split into multiple partial files for better organization:
    ///
    /// - DataSourceManager.cs (this file): Core implementation with main API methods for getting initial data,
    ///   live data, aggregated data, and broadcasting updates. Contains dependency injection setup and public interface methods.
    ///
    /// - DataSourceManager.Metadata.cs: Contains all data source metadata definitions including BuildMetadata() which
    ///   creates the complete catalog of available data sources (fuel dispensed, engine hours, distance traveled, etc.).
    ///   Each metadata entry defines supported modes, aggregations, units, compatible widget types, and default configurations.
    ///
    /// - DataSourceManager.Metrics.cs: Helper methods for metric computation. Currently delegates to IMetricCalculationService
    ///   for calculating changes and comparing metrics against previous periods.
    ///
    /// - DataSourceManager.TimeSeries.cs: Time-series data retrieval helpers. Delegates to ITimeSeriesDataService to fetch
    ///   historical time-series data points for charting and trend analysis.
    ///
    /// - DataSourceManager.Transformers.cs: Widget-specific data transformation methods that convert raw metric data into
    ///   the format required by different widget types (ticker, big stat card, line chart, bar chart, pie chart, gauge,
    ///   data table, progress list, etc.). Includes helper methods for extracting current values, time series, and categories.
    /// </summary>
    public partial class DataSourceManager : IDataSourceManager {
        private readonly IHubContext<DashboardHub> _hubContext;
        private readonly ILogger<DataSourceManager> _logger;
        private readonly IMetricCalculationService _metricService;
        private readonly IWidgetDataTransformerService _transformerService;
        private readonly ITimeSeriesDataService _timeSeriesService;
        private static readonly Dictionary<string, DataSourceMetadata> _dataSourceMetadata = BuildMetadata ();

        public DataSourceManager (
            IHubContext<DashboardHub> hubContext,
            ILogger<DataSourceManager> logger,
            IMetricCalculationService metricService,
            IWidgetDataTransformerService transformerService,
            ITimeSeriesDataService timeSeriesService) {
            _hubContext = hubContext;
            _logger = logger;
            _metricService = metricService;
            _transformerService = transformerService;
            _timeSeriesService = timeSeriesService;
        }

        public async Task<object> GetInitialDataAsync (string dataSource, DashboardMetricRequestDto request) {
            try {
                var canonicalSource = IdentifierNormalizer.NormalizeDataSource (dataSource);
                _logger.LogInformation ("Getting initial data for data source: {DataSource}, Mode: {Mode}", canonicalSource, request.Mode);

                // Get base metric data (computed internally)
                var metricResponse = await _metricService.ComputeMetricAsync (request);

                if (!string.IsNullOrEmpty (metricResponse.ErrorMessage)) {
                    return new { error = metricResponse.ErrorMessage, timestamp = DateTime.UtcNow };
                }

                // For historical data, also get time series if available
                if (request.Mode?.ToLower () != "live") {
                    var timeSeriesData = await GetTimeSeriesDataAsync (canonicalSource, request);
                    return new {
                        current = new {
                                value = metricResponse.Value,
                                unit = metricResponse.Unit,
                                timestamp = metricResponse.LastUpdated,
                                dateRange = metricResponse.DateRange
                                },
                                timeSeries = timeSeriesData,
                                metadata = GetDataSourceMetadata (canonicalSource)
                    };
                }

                // For live data, return current value with metadata
                return new {
                    value = metricResponse.Value,
                        unit = metricResponse.Unit,
                        timestamp = metricResponse.LastUpdated,
                        isLive = true,
                        metadata = GetDataSourceMetadata (canonicalSource)
                };

            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting initial data for data source: {DataSource}", dataSource);
                return new { error = "Error retrieving initial data", timestamp = DateTime.UtcNow };
            }
        }

        public async Task<object> GetLiveDataAsync (string dataSource, DashboardMetricRequestDto request) {
            try {
                var canonicalSource = IdentifierNormalizer.NormalizeDataSource (dataSource);
                if (!IsLiveDataSource (canonicalSource)) {
                    return new { error = $"Data source {canonicalSource} does not support live data", timestamp = DateTime.UtcNow };
                }

                // Force live mode for this request
                var liveRequest = new DashboardMetricRequestDto {
                    MetricType = request.MetricType,
                    Mode = "live",
                    DatePreset = "today", // Live data typically uses current day
                    SiteIds = request.SiteIds,
                    VehicleIds = request.VehicleIds,
                    VehicleType = request.VehicleType,
                };

                var metricResponse = await _metricService.ComputeMetricAsync (liveRequest);
                var change = await CalculateChangeAsync (metricResponse);

                return new {
                    value = metricResponse.Value,
                        unit = metricResponse.Unit,
                        timestamp = DateTime.UtcNow,
                        change = change,
                        trend = "stable", // TODO: Implement trend calculation
                        isLive = true
                };

            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting live data for data source: {DataSource}", dataSource);
                return new { error = "Error retrieving live data", timestamp = DateTime.UtcNow };
            }
        }

        public async Task<object> GetAggregatedDataAsync (string dataSource, DashboardMetricRequestDto request, string aggregationInterval = "hourly") {
            try {
                var canonicalSource = IdentifierNormalizer.NormalizeDataSource (dataSource);
                _logger.LogInformation ("Getting aggregated data for data source: {DataSource}, Interval: {Interval}", canonicalSource, aggregationInterval);

                // TODO: Implement time-series aggregation based on aggregationInterval
                // For now, return sample data structure
                var timeSeriesData = await GetTimeSeriesDataAsync (canonicalSource, request);

                // Compute simple summary from timeSeriesData if possible
                decimal total = 0m;
                int count = 0;
                if (timeSeriesData is System.Collections.IEnumerable enumerable) {
                    foreach (var item in enumerable) {
                        var vProp = item.GetType ().GetProperty ("value") ?? item.GetType ().GetProperty ("Value");
                        var vObj = vProp?.GetValue (item);
                        if (vObj != null && decimal.TryParse (vObj.ToString (), out var v)) {
                            total += v;
                            count++;
                        }
                    }
                }
                var average = count > 0 ? total / count : 0m;

                return new {
                    aggregationType = aggregationInterval,
                        dataPoints = timeSeriesData,
                        summary = new {
                            total,
                            average,
                            count
                            },
                            metadata = GetDataSourceMetadata (canonicalSource)
                };

            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting aggregated data for data source: {DataSource}", dataSource);
                return new { error = "Error retrieving aggregated data", timestamp = DateTime.UtcNow };
            }
        }

        public async Task BroadcastDataUpdateAsync (string dataSource, object data, string connectionId = null) {
            try {
            var updateData = new {
            dataSource = dataSource,
            data = data,
            timestamp = DateTime.UtcNow
                };

                if (string.IsNullOrEmpty (connectionId)) {
                    // Broadcast to all clients in the metric group
                    await _hubContext.Clients.Group ($"metric_{dataSource}").SendAsync ("MetricDataUpdate", updateData);
                } else {
                    // Send to specific connection
                    await _hubContext.Clients.Client (connectionId).SendAsync ("MetricDataUpdate", updateData);
                }

                _logger.LogDebug ("Broadcasted data update for data source: {DataSource}", dataSource);

            } catch (Exception ex) {
                _logger.LogError (ex, "Error broadcasting data update for data source: {DataSource}", dataSource);
            }
        }

        public bool IsLiveDataSource (string dataSource) {
            var key = IdentifierNormalizer.NormalizeDataSource (dataSource);
            return _dataSourceMetadata.TryGetValue (key, out var metadata) && metadata.SupportsLiveData;
        }

        public bool IsHistoricalDataSource (string dataSource) {
            var key = IdentifierNormalizer.NormalizeDataSource (dataSource);
            return _dataSourceMetadata.TryGetValue (key, out var metadata) && metadata.SupportsHistoricalData;
        }

        public List<string> GetSupportedAggregations (string dataSource) {
            var key = IdentifierNormalizer.NormalizeDataSource (dataSource);
            return _dataSourceMetadata.TryGetValue (key, out var metadata) ?
                metadata.SupportedAggregations :
                new List<string> { "sum" };
        }

        public DataSourceMetadata GetDataSourceMetadata (string dataSource) {
            var key = IdentifierNormalizer.NormalizeDataSource (dataSource);
            return _dataSourceMetadata.TryGetValue (key, out var metadata) ?
                metadata :
                new DataSourceMetadata {
                    DisplayName = key,
                        Unit = "units",
                        Description = $"Data for {key}",
                        SupportsLiveData = false,
                        SupportsHistoricalData = true,
                        SupportedModes = new List<string> { "historical_snapshot", "daily_aggregated" },
                        SupportedAggregations = new List<string> { "sum", "avg", "count" },
                        SupportedGranularities = new List<string> { "day" },
                        RecommendedUnits = new List<string> { "units" },
                        SupportedGroupBy = new List<string> { "none", "site", "vehicleType" },
                        DefaultMode = "historical_snapshot",
                        DefaultAggregation = "sum",
                        DefaultGranularity = "day",
                        DefaultGroupBy = "none",
                        Recommendations = new DataSourceRecommendations {
                        DatePreset = "last_7_days",
                        Granularity = "day",
                        CumulativeDefault = false,
                        SmoothingDefault = "none"
                        },
                        DefaultConfiguration = new Dictionary<string, object> {
                        ["mode"] = "historical_snapshot",
                        ["aggregation"] = "sum",
                        ["granularity"] = "day",
                        ["datePreset"] = "last_7_days",
                        ["unit"] = "units",
                        ["groupBy"] = "none",
                        ["includeTotal"] = false,
                        ["topK"] = 10
                        }
                };
        }

        public IEnumerable<KeyValuePair<string, DataSourceMetadata>> GetAllDataSources () {
            return _dataSourceMetadata
                .Where (kvp => kvp.Value?.IsCatalogVisible != false)
                .Select (kvp => new KeyValuePair<string, DataSourceMetadata> (kvp.Key, kvp.Value));
        }

        public async Task<object> TransformDataForWidgetType (string widgetType, object rawData, Dictionary<string, object> configuration) {
            try {
                return await _transformerService.TransformAsync (widgetType, rawData, configuration);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error transforming data for widget type: {WidgetType}", widgetType);
                return new { error = "Error transforming data", originalData = rawData };
            }
        }

        // Static accessors to share metadata without needing an instance
        public static DataSourceMetadata GetMetadataStatic (string dataSource) =>
            _dataSourceMetadata.TryGetValue (dataSource, out var meta) ? meta : new DataSourceMetadata ();

        public static IEnumerable<KeyValuePair<string, DataSourceMetadata>> GetAllMetadataStatic () =>
            _dataSourceMetadata.Where (kvp => kvp.Value?.IsCatalogVisible != false)
            .Select (kvp => new KeyValuePair<string, DataSourceMetadata> (kvp.Key, kvp.Value));

        // ... methods moved to partials: metadata builders, transformers, time series, metrics, and helpers

        // ...existing helper methods are now in partials
    }
}