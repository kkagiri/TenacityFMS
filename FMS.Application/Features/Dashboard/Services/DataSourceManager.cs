using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.Communication.SignalR;
using FMS.Application.Features.Dashboard;
using FMS.Application.Services.Dashboard;
using FMS.Domain.Entities.Dashboard;
using FMS.Domain.Entities.enums;
using FMS.Domain.Entities.Features.TankStockManagement;
using FMS.Persistence.DataAccess;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace FMS.Application.Services.Dashboard {
    /// <summary>
    /// Unified data source manager implementation
    /// </summary>
    public partial class DataSourceManager : IDataSourceManager {
        private readonly IHubContext<DashboardHub> _hubContext;
        private readonly GpsdataContext _context;
        private readonly ILogger<DataSourceManager> _logger;
        private readonly IDashboardMetricsService _metricsService;
        private static readonly Dictionary<string, DataSourceMetadata> _dataSourceMetadata = BuildMetadata ();

        public DataSourceManager (
            IHubContext<DashboardHub> hubContext,
            GpsdataContext context,
            ILogger<DataSourceManager> logger,
            IDashboardMetricsService metricsService) {
            _hubContext = hubContext;
            _context = context;
            _logger = logger;
            _metricsService = metricsService;
        }

        public async Task<object> GetInitialDataAsync (string dataSource, DashboardMetricRequestDto request) {
            try {
                _logger.LogInformation ("Getting initial data for data source: {DataSource}, Mode: {Mode}", dataSource, request.Mode);

                // Get base metric data (computed internally)
                var metricResponse = await ComputeMetricAsync (request);

                if (!string.IsNullOrEmpty (metricResponse.ErrorMessage)) {
                    return new { error = metricResponse.ErrorMessage, timestamp = DateTime.UtcNow };
                }

                // For historical data, also get time series if available
                if (request.Mode?.ToLower () != "live") {
                    var timeSeriesData = await GetTimeSeriesDataAsync (dataSource, request);
                    return new {
                        current = new {
                                value = metricResponse.Value,
                                unit = metricResponse.Unit,
                                timestamp = metricResponse.LastUpdated,
                                dateRange = metricResponse.DateRange
                                },
                                timeSeries = timeSeriesData,
                                metadata = GetDataSourceMetadata (dataSource)
                    };
                }

                // For live data, return current value with metadata
                return new {
                    value = metricResponse.Value,
                        unit = metricResponse.Unit,
                        timestamp = metricResponse.LastUpdated,
                        isLive = true,
                        metadata = GetDataSourceMetadata (dataSource)
                };

            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting initial data for data source: {DataSource}", dataSource);
                return new { error = "Error retrieving initial data", timestamp = DateTime.UtcNow };
            }
        }

        public async Task<object> GetLiveDataAsync (string dataSource, DashboardMetricRequestDto request) {
            try {
                if (!IsLiveDataSource (dataSource)) {
                    return new { error = $"Data source {dataSource} does not support live data", timestamp = DateTime.UtcNow };
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

                var metricResponse = await ComputeMetricAsync (liveRequest);

                return new {
                    value = metricResponse.Value,
                        unit = metricResponse.Unit,
                        timestamp = DateTime.UtcNow,
                        change = CalculateChange (metricResponse), // TODO: Implement change calculation
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
                _logger.LogInformation ("Getting aggregated data for data source: {DataSource}, Interval: {Interval}", dataSource, aggregationInterval);

                // TODO: Implement time-series aggregation based on aggregationInterval
                // For now, return sample data structure
                var timeSeriesData = await GetTimeSeriesDataAsync (dataSource, request);

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
                            metadata = GetDataSourceMetadata (dataSource)
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
            return _dataSourceMetadata.TryGetValue (dataSource, out var metadata) && metadata.SupportsLiveData;
        }

        public bool IsHistoricalDataSource (string dataSource) {
            return _dataSourceMetadata.TryGetValue (dataSource, out var metadata) && metadata.SupportsHistoricalData;
        }

        public List<string> GetSupportedAggregations (string dataSource) {
            return _dataSourceMetadata.TryGetValue (dataSource, out var metadata) ?
                metadata.SupportedAggregations :
                new List<string> { "sum" };
        }

        public DataSourceMetadata GetDataSourceMetadata (string dataSource) {
            return _dataSourceMetadata.TryGetValue (dataSource, out var metadata) ?
                metadata :
                new DataSourceMetadata {
                    DisplayName = dataSource,
                        Unit = "units",
                        Description = $"Data for {dataSource}",
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
                var normalizedWidgetType = WidgetTypeDefinitions.MapLegacyType (widgetType.ToLower ());

                return normalizedWidgetType
                switch {
                    WidgetTypeDefinitions.KEY_STAT_TICKER => TransformForTicker (rawData, configuration),
                        WidgetTypeDefinitions.BIG_STAT_CARD => TransformForBigStatCard (rawData, configuration),
                        WidgetTypeDefinitions.PROGRESS_LIST => await TransformForProgressList (rawData, configuration),
                        WidgetTypeDefinitions.DATA_TABLE => await TransformForDataTable (rawData, configuration),
                        WidgetTypeDefinitions.LINE_CHART => TransformForLineChart (rawData, configuration),
                        WidgetTypeDefinitions.BAR_CHART => TransformForBarChart (rawData, configuration),
                        WidgetTypeDefinitions.PIE_CHART => TransformForPieChart (rawData, configuration),
                        WidgetTypeDefinitions.GAUGE_CHART => TransformForGaugeChart (rawData, configuration),
                        WidgetTypeDefinitions.STAT_CARD_WITH_TREND => TransformForStatCardWithTrend (rawData, configuration),
                        _ => rawData // Return raw data for unknown widget types
                };

            } catch (Exception ex) {
                _logger.LogError (ex, "Error transforming data for widget type: {WidgetType}", widgetType);
                return new { error = "Error transforming data", originalData = rawData };
            }
        }

        // ... methods moved to partials: metadata builders, transformers, time series, metrics, and helpers

        // ...existing helper methods are now in partials
    }
}