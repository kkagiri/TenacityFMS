/**
 * File: DataSourceManager.cs
 * Purpose: Orchestrates dashboard data-source retrieval, aggregation, live updates, and widget transformations.
 * Dependencies: DashboardHub, GpsdataContext, IDataSourceManager collaborators, IdentifierNormalizer
 * Last Modified: 2026-03-07
 *
 * Key Functions:
 * - GetInitialDataAsync(): Loads the initial payload for a dashboard data source.
 * - GetLiveDataAsync(): Loads live payloads for streaming-compatible sources.
 * - GetAggregatedDataAsync(): Loads aggregated payloads for chart-oriented widgets.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.Communication.SignalR;
using FMS.Application.Features.Dashboard;
using FMS.Application.Features.PTSService.Services;
using FMS.Domain.Entities.Dashboard;
using FMS.Persistence.DataAccess;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace FMS.Application.Services.Dashboard
{
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
    public partial class DataSourceManager : IDataSourceManager
    {
        private readonly IHubContext<DashboardHub> _hubContext;
        private readonly ILogger<DataSourceManager> _logger;
        private readonly GpsdataContext _context;
        private readonly IMetricCalculationService _metricService;
        private readonly IWidgetDataTransformerService _transformerService;
        private readonly ITimeSeriesDataService _timeSeriesService;
        private readonly ConnectionMonitor _connectionMonitor;
        private readonly IServiceControlService _serviceControlService;
        private readonly IServiceProvider _serviceProvider;
        private static readonly Dictionary<string, DataSourceMetadata> _dataSourceMetadata = BuildMetadata();

        public DataSourceManager(
            IHubContext<DashboardHub> hubContext,
            ILogger<DataSourceManager> logger,
            GpsdataContext context,
            IMetricCalculationService metricService,
            IWidgetDataTransformerService transformerService,
            ITimeSeriesDataService timeSeriesService,
            ConnectionMonitor connectionMonitor,
            IServiceControlService serviceControlService,
            IServiceProvider serviceProvider)
        {
            _hubContext = hubContext;
            _logger = logger;
            _context = context;
            _metricService = metricService;
            _transformerService = transformerService;
            _timeSeriesService = timeSeriesService;
            _connectionMonitor = connectionMonitor;
            _serviceControlService = serviceControlService;
            _serviceProvider = serviceProvider;
        }

        public async Task<object> GetInitialDataAsync(string dataSource, DashboardMetricRequestDto request)
        {
            try
            {
                var canonicalSource = IdentifierNormalizer.NormalizeDataSource(dataSource);
                _logger.LogInformation("Getting initial data for data source: {DataSource}, Mode: {Mode}", canonicalSource, request.Mode);

                if (IsEventAlertDataSource(canonicalSource))
                {
                    return await GetEventAlertDataAsync(canonicalSource, request, "initial");
                }

                if (IsIssueTrackerDataSource(canonicalSource))
                {
                    return await GetIssueTrackerDataAsync(canonicalSource, request, "initial");
                }

                if (IsAdminDataSource(canonicalSource))
                {
                    return await GetAdminDataAsync(canonicalSource, request, "initial");
                }

                // Get base metric data (computed internally)
                var metricResponse = await _metricService.ComputeMetricAsync(request);

                if (!string.IsNullOrEmpty(metricResponse.ErrorMessage))
                {
                    return new { error = metricResponse.ErrorMessage, timestamp = DateTime.UtcNow };
                }

                // For historical data, also get time series if available
                if (request.Mode?.ToLower() != "live")
                {
                    var timeSeriesData = await GetTimeSeriesDataAsync(canonicalSource, request);
                    return new
                    {
                        current = new
                        {
                            value = metricResponse.Value,
                            unit = metricResponse.Unit,
                            timestamp = metricResponse.LastUpdated,
                            dateRange = metricResponse.DateRange
                        },
                        timeSeries = timeSeriesData,
                        metadata = GetDataSourceMetadata(canonicalSource)
                    };
                }

                // For live data, return current value with metadata
                return new
                {
                    value = metricResponse.Value,
                    unit = metricResponse.Unit,
                    timestamp = metricResponse.LastUpdated,
                    isLive = true,
                    metadata = GetDataSourceMetadata(canonicalSource)
                };

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting initial data for data source: {DataSource}", dataSource);
                return new { error = "Error retrieving initial data", timestamp = DateTime.UtcNow };
            }
        }

        public async Task<object> GetLiveDataAsync(string dataSource, DashboardMetricRequestDto request)
        {
            try
            {
                var canonicalSource = IdentifierNormalizer.NormalizeDataSource(dataSource);
                if (IsEventAlertDataSource(canonicalSource))
                {
                    return await GetEventAlertDataAsync(canonicalSource, request, "live");
                }

                if (IsIssueTrackerDataSource(canonicalSource))
                {
                    return await GetIssueTrackerDataAsync(canonicalSource, request, "live");
                }

                if (IsAdminDataSource(canonicalSource))
                {
                    return await GetAdminDataAsync(canonicalSource, request, "live");
                }

                if (!IsLiveDataSource(canonicalSource))
                {
                    return new { error = $"Data source {canonicalSource} does not support live data", timestamp = DateTime.UtcNow };
                }

                // Force live mode for this request
                var liveRequest = new DashboardMetricRequestDto
                {
                    MetricType = request.MetricType,
                    Mode = "live",
                    DatePreset = "today", // Live data typically uses current day
                    SiteIds = request.SiteIds,
                    VehicleIds = request.VehicleIds,
                    VehicleType = request.VehicleType,
                };

                var metricResponse = await _metricService.ComputeMetricAsync(liveRequest);
                var change = await CalculateChangeAsync(metricResponse);

                // Extract trend direction from change result
                var trend = "stable";
                if (change is IDictionary<string, object> changeDict && changeDict.TryGetValue("direction", out var dir))
                {
                    trend = dir?.ToString() ?? "stable";
                }
                else
                {
                    // Try dynamic access for anonymous type
                    var dirProp = change?.GetType().GetProperty("direction");
                    if (dirProp != null)
                    {
                        trend = dirProp.GetValue(change)?.ToString() ?? "stable";
                    }
                }

                return new
                {
                    value = metricResponse.Value,
                    unit = metricResponse.Unit,
                    timestamp = DateTime.UtcNow,
                    change = change,
                    trend = trend,
                    isLive = true
                };

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting live data for data source: {DataSource}", dataSource);
                return new { error = "Error retrieving live data", timestamp = DateTime.UtcNow };
            }
        }

        public async Task<object> GetAggregatedDataAsync(string dataSource, DashboardMetricRequestDto request, string aggregationInterval = "hourly")
        {
            try
            {
                var canonicalSource = IdentifierNormalizer.NormalizeDataSource(dataSource);
                _logger.LogInformation("Getting aggregated data for data source: {DataSource}, Interval: {Interval}", canonicalSource, aggregationInterval);

                if (IsEventAlertDataSource(canonicalSource))
                {
                    return await GetEventAlertDataAsync(canonicalSource, request, "aggregated", aggregationInterval);
                }

                if (IsIssueTrackerDataSource(canonicalSource))
                {
                    return await GetIssueTrackerDataAsync(canonicalSource, request, "aggregated", aggregationInterval);
                }

                if (IsAdminDataSource(canonicalSource))
                {
                    return await GetAdminDataAsync(canonicalSource, request, "aggregated", aggregationInterval);
                }

                // Map aggregationInterval to granularity for time-series service
                var granularity = MapAggregationIntervalToGranularity(aggregationInterval);

                // Create request with the resolved granularity
                var aggregatedRequest = new DashboardMetricRequestDto
                {
                    MetricType = request.MetricType ?? canonicalSource,
                    Mode = request.Mode ?? "daily_aggregated",
                    DatePreset = request.DatePreset,
                    StartDate = request.StartDate,
                    EndDate = request.EndDate,
                    SiteIds = request.SiteIds,
                    VehicleIds = request.VehicleIds,
                    VehicleType = request.VehicleType,
                    Granularity = granularity
                };

                var timeSeriesData = await GetTimeSeriesDataAsync(canonicalSource, aggregatedRequest);

                // Compute summary from timeSeriesData
                decimal total = 0m;
                decimal min = decimal.MaxValue;
                decimal max = decimal.MinValue;
                int count = 0;

                if (timeSeriesData is System.Collections.IEnumerable enumerable)
                {
                    foreach (var item in enumerable)
                    {
                        var vProp = item.GetType().GetProperty("value") ?? item.GetType().GetProperty("Value");
                        var vObj = vProp?.GetValue(item);
                        if (vObj != null && decimal.TryParse(vObj.ToString(), out var v))
                        {
                            total += v;
                            if (v < min) min = v;
                            if (v > max) max = v;
                            count++;
                        }
                    }
                }
                var average = count > 0 ? Math.Round(total / count, 2) : 0m;
                if (count == 0) { min = 0m; max = 0m; }

                return new
                {
                    aggregationType = aggregationInterval,
                    granularity = granularity,
                    dataPoints = timeSeriesData,
                    summary = new
                    {
                        total = Math.Round(total, 2),
                        average,
                        min = Math.Round(min, 2),
                        max = Math.Round(max, 2),
                        count
                    },
                    metadata = GetDataSourceMetadata(canonicalSource)
                };

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting aggregated data for data source: {DataSource}", dataSource);
                return new { error = "Error retrieving aggregated data", timestamp = DateTime.UtcNow };
            }
        }

        /// <summary>
        /// Maps user-friendly aggregation interval to time-series granularity
        /// </summary>
        private static string MapAggregationIntervalToGranularity(string aggregationInterval)
        {
            return (aggregationInterval ?? "hourly").ToLowerInvariant() switch
            {
                "minutely" or "minute" or "1m" => "minute",
                "hourly" or "hour" or "1h" => "hour",
                "daily" or "day" or "1d" => "day",
                "weekly" or "week" or "1w" => "week",
                "monthly" or "month" or "1M" => "month",
                _ => "hour"
            };
        }

        public async Task BroadcastDataUpdateAsync(string dataSource, object data, string connectionId = null)
        {
            try
            {
                var updateData = new
                {
                    dataSource = dataSource,
                    data = data,
                    timestamp = DateTime.UtcNow
                };

                if (string.IsNullOrEmpty(connectionId))
                {
                    // Broadcast to all clients in the metric group
                    await _hubContext.Clients.Group($"metric_{dataSource}").SendAsync("MetricDataUpdate", updateData);
                }
                else
                {
                    // Send to specific connection
                    await _hubContext.Clients.Client(connectionId).SendAsync("MetricDataUpdate", updateData);
                }

                _logger.LogDebug("Broadcasted data update for data source: {DataSource}", dataSource);

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting data update for data source: {DataSource}", dataSource);
            }
        }

        public bool IsLiveDataSource(string dataSource)
        {
            var key = IdentifierNormalizer.NormalizeDataSource(dataSource);
            return _dataSourceMetadata.TryGetValue(key, out var metadata) && metadata.SupportsLiveData;
        }

        public bool IsHistoricalDataSource(string dataSource)
        {
            var key = IdentifierNormalizer.NormalizeDataSource(dataSource);
            return _dataSourceMetadata.TryGetValue(key, out var metadata) && metadata.SupportsHistoricalData;
        }

        public List<string> GetSupportedAggregations(string dataSource)
        {
            var key = IdentifierNormalizer.NormalizeDataSource(dataSource);
            return _dataSourceMetadata.TryGetValue(key, out var metadata) ?
                metadata.SupportedAggregations :
                new List<string> { "sum" };
        }

        public DataSourceMetadata GetDataSourceMetadata(string dataSource)
        {
            var key = IdentifierNormalizer.NormalizeDataSource(dataSource);
            return _dataSourceMetadata.TryGetValue(key, out var metadata) ?
                metadata :
                new DataSourceMetadata
                {
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
                    Recommendations = new DataSourceRecommendations
                    {
                        DatePreset = "last_7_days",
                        Granularity = "day",
                        CumulativeDefault = false,
                        SmoothingDefault = "none"
                    },
                    DefaultConfiguration = new Dictionary<string, object>
                    {
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

        public IEnumerable<KeyValuePair<string, DataSourceMetadata>> GetAllDataSources()
        {
            return _dataSourceMetadata
                .Where(kvp => kvp.Value?.IsCatalogVisible != false)
                .Select(kvp => new KeyValuePair<string, DataSourceMetadata>(kvp.Key, kvp.Value));
        }

        public async Task<object> TransformDataForWidgetType(string widgetType, object rawData, Dictionary<string, object> configuration)
        {
            try
            {
                return await _transformerService.TransformAsync(widgetType, rawData, configuration);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error transforming data for widget type: {WidgetType}", widgetType);
                return new { error = "Error transforming data", originalData = rawData };
            }
        }

        // Static accessors to share metadata without needing an instance
        public static DataSourceMetadata GetMetadataStatic(string dataSource) =>
            _dataSourceMetadata.TryGetValue(dataSource, out var meta) ? meta : new DataSourceMetadata();

        public static IEnumerable<KeyValuePair<string, DataSourceMetadata>> GetAllMetadataStatic() =>
            _dataSourceMetadata.Where(kvp => kvp.Value?.IsCatalogVisible != false)
            .Select(kvp => new KeyValuePair<string, DataSourceMetadata>(kvp.Key, kvp.Value));

        // ... methods moved to partials: metadata builders, transformers, time series, metrics, and helpers

        // ...existing helper methods are now in partials
    }
}