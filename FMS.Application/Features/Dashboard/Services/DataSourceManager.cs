using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.Communication.SignalR;
using FMS.Application.ModelsDTOs.Dashboard;
using FMS.Application.Services.Dashboard;
using FMS.Domain.Entities.Dashboard;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace FMS.Application.Services.Dashboard {
    /// <summary>
    /// Unified data source manager implementation
    /// </summary>
    public class DataSourceManager : IDataSourceManager {
        private readonly IDashboardMetricsService _metricsService;
        private readonly IHubContext<DashboardHub> _hubContext;
        private readonly GpsdataContext _context;
        private readonly ILogger<DataSourceManager> _logger;

        private static readonly Dictionary<string, DataSourceMetadata> _dataSourceMetadata = new Dictionary<string, DataSourceMetadata> {
            [WidgetTypeDefinitions.DataSources.FUEL_DISPENSE] = new DataSourceMetadata {
            DisplayName = "Fuel Dispensed",
            Unit = "liters",
            Description = "Total fuel dispensed from tanks",
            SupportsLiveData = true,
            SupportsHistoricalData = true,
            SupportedAggregations = new List<string> { "sum", "avg", "count", "max", "min" },
            Category = WidgetTypeDefinitions.Categories.FUEL_MANAGEMENT,
            RefreshIntervalSeconds = 30
            },
            // Add alternative key for fuel_dispensed (frontend uses this variation)
            ["fuel_dispensed"] = new DataSourceMetadata {
            DisplayName = "Fuel Dispensed",
            Unit = "liters",
            Description = "Total fuel dispensed from tanks",
            SupportsLiveData = true,
            SupportsHistoricalData = true,
            SupportedAggregations = new List<string> { "sum", "avg", "count", "max", "min" },
            Category = WidgetTypeDefinitions.Categories.FUEL_MANAGEMENT,
            RefreshIntervalSeconds = 30
            },
            [WidgetTypeDefinitions.DataSources.FUEL_USED_GPS] = new DataSourceMetadata {
            DisplayName = "Fuel Used (GPS)",
            Unit = "liters",
            Description = "Fuel consumption from GPS tracking data",
            SupportsLiveData = false, // GPS data is processed, not real-time
            SupportsHistoricalData = true,
            SupportedAggregations = new List<string> { "sum", "avg", "count" },
            Category = WidgetTypeDefinitions.Categories.VEHICLE_PERFORMANCE,
            RefreshIntervalSeconds = 300
            },
            [WidgetTypeDefinitions.DataSources.FUEL_LOST_GPS] = new DataSourceMetadata {
            DisplayName = "Fuel Lost (GPS)",
            Unit = "liters",
            Description = "Fuel losses detected from GPS tracking and flow meter data",
            SupportsLiveData = false,
            SupportsHistoricalData = true,
            SupportedAggregations = new List<string> { "sum", "avg", "count", "max", "min" },
            Category = WidgetTypeDefinitions.Categories.FUEL_MANAGEMENT,
            RefreshIntervalSeconds = 300
            },
            [WidgetTypeDefinitions.DataSources.ENGINE_HOURS] = new DataSourceMetadata {
            DisplayName = "Engine Hours",
            Unit = "hours",
            Description = "Total engine operating hours",
            SupportsLiveData = true,
            SupportsHistoricalData = true,
            SupportedAggregations = new List<string> { "sum", "avg", "max", "min" },
            Category = WidgetTypeDefinitions.Categories.VEHICLE_PERFORMANCE,
            RefreshIntervalSeconds = 60
            },
            [WidgetTypeDefinitions.DataSources.ENGINE_HOURS_GPS] = new DataSourceMetadata {
            DisplayName = "Engine Hours (GPS)",
            Unit = "hours",
            Description = "Engine operating hours from GPS data and flow meter",
            SupportsLiveData = false,
            SupportsHistoricalData = true,
            SupportedAggregations = new List<string> { "sum", "avg", "max", "min" },
            Category = WidgetTypeDefinitions.Categories.VEHICLE_PERFORMANCE,
            RefreshIntervalSeconds = 300
            },
            [WidgetTypeDefinitions.DataSources.KM_TRAVEL] = new DataSourceMetadata {
            DisplayName = "Distance Travelled",
            Unit = "kilometers",
            Description = "Total distance travelled by vehicles",
            SupportsLiveData = true,
            SupportsHistoricalData = true,
            SupportedAggregations = new List<string> { "sum", "avg", "max", "min" },
            Category = WidgetTypeDefinitions.Categories.VEHICLE_PERFORMANCE,
            RefreshIntervalSeconds = 60
            },
            [WidgetTypeDefinitions.DataSources.DISTANCE_TRAVEL] = new DataSourceMetadata {
            DisplayName = "Distance Travel (GPS)",
            Unit = "kilometers",
            Description = "Distance travelled from GPS tracking",
            SupportsLiveData = false,
            SupportsHistoricalData = true,
            SupportedAggregations = new List<string> { "sum", "avg", "max", "min" },
            Category = WidgetTypeDefinitions.Categories.VEHICLE_PERFORMANCE,
            RefreshIntervalSeconds = 300
            },
            [WidgetTypeDefinitions.DataSources.FUEL_EFFICIENCY] = new DataSourceMetadata {
            DisplayName = "Fuel Efficiency",
            Unit = "km/l",
            Description = "Fuel efficiency metrics",
            SupportsLiveData = false,
            SupportsHistoricalData = true,
            SupportedAggregations = new List<string> { "avg", "min", "max" },
            Category = WidgetTypeDefinitions.Categories.VEHICLE_PERFORMANCE,
            RefreshIntervalSeconds = 300
            },
            [WidgetTypeDefinitions.DataSources.FLOWMETER_FUEL_USED] = new DataSourceMetadata {
            DisplayName = "Fuel Used (Flow Meter)",
            Unit = "liters",
            Description = "Fuel consumption from flow meter readings",
            SupportsLiveData = false,
            SupportsHistoricalData = true,
            SupportedAggregations = new List<string> { "sum", "avg", "count", "max", "min" },
            Category = WidgetTypeDefinitions.Categories.FUEL_MANAGEMENT,
            RefreshIntervalSeconds = 300
            },
            [WidgetTypeDefinitions.DataSources.FLOWMETER_FUEL_LOST] = new DataSourceMetadata {
            DisplayName = "Fuel Lost (Flow Meter)",
            Unit = "liters",
            Description = "Fuel losses detected by flow meter",
            SupportsLiveData = false,
            SupportsHistoricalData = true,
            SupportedAggregations = new List<string> { "sum", "avg", "count", "max", "min" },
            Category = WidgetTypeDefinitions.Categories.FUEL_MANAGEMENT,
            RefreshIntervalSeconds = 300
            },
            [WidgetTypeDefinitions.DataSources.FLOWMETER_EFFICIENCY] = new DataSourceMetadata {
            DisplayName = "Flow Meter Efficiency",
            Unit = "percentage",
            Description = "Efficiency metrics from flow meter data",
            SupportsLiveData = false,
            SupportsHistoricalData = true,
            SupportedAggregations = new List<string> { "avg", "min", "max" },
            Category = WidgetTypeDefinitions.Categories.VEHICLE_PERFORMANCE,
            RefreshIntervalSeconds = 300
            },
            [WidgetTypeDefinitions.DataSources.MAX_SPEED] = new DataSourceMetadata {
            DisplayName = "Maximum Speed",
            Unit = "km/h",
            Description = "Maximum speed recorded for vehicles",
            SupportsLiveData = false,
            SupportsHistoricalData = true,
            SupportedAggregations = new List<string> { "max", "avg", "min" },
            Category = WidgetTypeDefinitions.Categories.VEHICLE_PERFORMANCE,
            RefreshIntervalSeconds = 300
            },
            [WidgetTypeDefinitions.DataSources.AVG_SPEED] = new DataSourceMetadata {
            DisplayName = "Average Speed",
            Unit = "km/h",
            Description = "Average speed recorded for vehicles",
            SupportsLiveData = false,
            SupportsHistoricalData = true,
            SupportedAggregations = new List<string> { "avg", "max", "min" },
            Category = WidgetTypeDefinitions.Categories.VEHICLE_PERFORMANCE,
            RefreshIntervalSeconds = 300
            }
        };

        public DataSourceManager (
            IDashboardMetricsService metricsService,
            IHubContext<DashboardHub> hubContext,
            GpsdataContext context,
            ILogger<DataSourceManager> logger) {
            _metricsService = metricsService;
            _hubContext = hubContext;
            _context = context;
            _logger = logger;
        }

        public async Task<object> GetInitialDataAsync (string dataSource, DashboardMetricRequestDto request) {
            try {
                _logger.LogInformation ("Getting initial data for data source: {DataSource}, Mode: {Mode}", dataSource, request.Mode);

                // Get base metric data
                var metricResponse = await _metricsService.GetMetricAsync (request);

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

                var metricResponse = await _metricsService.GetMetricAsync (liveRequest);

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

                return new {
                    aggregationType = aggregationInterval,
                        dataPoints = timeSeriesData,
                        summary = new {
                            total = 0, // TODO: Calculate from actual data
                            average = 0,
                            count = 0
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
                        SupportsHistoricalData = true
                };
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

        // Widget-specific transformation methods
        private object TransformForTicker (object rawData, Dictionary<string, object> configuration) {
            // Simple ticker format: value, unit, change, trend
            var data = JsonConvert.DeserializeObject<dynamic> (JsonConvert.SerializeObject (rawData));

            return new {
                value = data?.value ?? 0,
                    unit = data?.unit ?? "units",
                    formattedValue = FormatValue (data?.value, data?.unit?.ToString ()),
                    change = data?.change ?? new { value = 0, percentage = 0, direction = "stable" },
                    trend = data?.trend ?? "stable",
                    lastUpdated = data?.timestamp ?? DateTime.UtcNow
            };
        }

        private object TransformForBigStatCard (object rawData, Dictionary<string, object> configuration) {
            var data = JsonConvert.DeserializeObject<dynamic> (JsonConvert.SerializeObject (rawData));

            return new {
                mainValue = new {
                        value = data?.value ?? 0,
                        unit = data?.unit ?? "units",
                        formatted = FormatValue (data?.value, data?.unit?.ToString ())
                        },
                        badge = new {
                        text = "Today",
                        color = "primary"
                        },
                        subItems = new [] {
                        new { label = "Previous Period", value = "0", change = "+0%" },
                        new { label = "Average", value = "0", change = "stable" }
                        },
                        lastUpdated = data?.timestamp ?? DateTime.UtcNow
            };
        }

        private async Task<object> TransformForProgressList (object rawData, Dictionary<string, object> configuration) {
            // TODO: Implement progress list transformation
            // This would typically show breakdown by category (e.g., by vehicle type, by site)
            return new {
                items = new [] {
                        new { label = "Category 1", value = 75, percentage = 75, color = "#28a745" },
                        new { label = "Category 2", value = 45, percentage = 45, color = "#17a2b8" },
                        new { label = "Category 3", value = 30, percentage = 30, color = "#ffc107" }
                        },
                        total = 150,
                        lastUpdated = DateTime.UtcNow
            };
        }

        private async Task<object> TransformForDataTable (object rawData, Dictionary<string, object> configuration) {
            // TODO: Implement data table transformation
            // This would show tabular data with rows and columns
            return new {
                columns = new [] {
                        new { field = "name", title = "Name", width = 200 },
                        new { field = "value", title = "Value", width = 100 },
                        new { field = "unit", title = "Unit", width = 80 }
                        },
                        rows = new [] {
                        new { name = "Item 1", value = 100, unit = "L" },
                        new { name = "Item 2", value = 75, unit = "L" },
                        new { name = "Item 3", value = 50, unit = "L" }
                        },
                        pagination = new { page = 1, pageSize = 10, total = 3 },
                        lastUpdated = DateTime.UtcNow
            };
        }

        private object TransformForLineChart (object rawData, Dictionary<string, object> configuration) {
            var data = JsonConvert.DeserializeObject<dynamic> (JsonConvert.SerializeObject (rawData));

            // Extract time series data
            var timeSeries = data?.timeSeries;
            var seriesData = new List<object> ();

            if (timeSeries != null) {
                foreach (var point in timeSeries) {
                    seriesData.Add (new {
                        x = point.timestamp,
                            y = point.value
                    });
                }
            }

            // Ensure we have chart-ready data structure
            return new {
                current = new {
                        value = data?.current?.value ?? data?.value ?? 0,
                        unit = data?.current?.unit ?? data?.unit ?? "units",
                        timestamp = data?.current?.timestamp ?? data?.timestamp ?? DateTime.UtcNow
                        },
                        chartData = new {
                        series = new [] {
                        new {
                        name = data?.metadata?.DisplayName ?? "Data",
                        data = seriesData.ToArray ()
                        }
                        }
                        },
                        summary = new {
                        total = seriesData.Count > 0 ? seriesData.Sum (s => Convert.ToDouble (((dynamic) s).y)) : 0,
                        average = seriesData.Count > 0 ? seriesData.Average (s => Convert.ToDouble (((dynamic) s).y)) : 0,
                        dataPoints = seriesData.Count
                        },
                        metadata = data?.metadata,
                        lastUpdated = DateTime.UtcNow
            };
        }

        private object TransformForBarChart (object rawData, Dictionary<string, object> configuration) {
            return new {
                categories = new [] { "Site 1", "Site 2", "Site 3" },
                    series = new [] {
                    new {
                    name = "Current Period",
                    data = new [] { 100, 75, 50 }
                    }
                    },
                    lastUpdated = DateTime.UtcNow
            };
        }

        private object TransformForPieChart (object rawData, Dictionary<string, object> configuration) {
            return new {
                series = new [] {
                        new { name = "Category 1", value = 60, color = "#28a745" },
                        new { name = "Category 2", value = 25, color = "#17a2b8" },
                        new { name = "Category 3", value = 15, color = "#ffc107" }
                        },
                        total = 100,
                        lastUpdated = DateTime.UtcNow
            };
        }

        private object TransformForGaugeChart (object rawData, Dictionary<string, object> configuration) {
            var data = JsonConvert.DeserializeObject<dynamic> (JsonConvert.SerializeObject (rawData));
            var value = Convert.ToDouble (data?.value ?? 0);
            var max = GetConfigValue<double> (configuration, "max", 100);

            return new {
                value = value,
                    percentage = Math.Round ((value / max) * 100, 1),
                    min = GetConfigValue<double> (configuration, "min", 0),
                    max = max,
                    thresholds = GetConfigValue<object[]> (configuration, "thresholds", new object[] {
                        new { value = 70, color = "#28a745", label = "Good" },
                        new { value = 85, color = "#ffc107", label = "Warning" },
                        new { value = 100, color = "#dc3545", label = "Critical" }
                        }),
                        unit = data?.unit ?? "units",
                        lastUpdated = DateTime.UtcNow
            };
        }

        private object TransformForStatCardWithTrend (object rawData, Dictionary<string, object> configuration) {
            var data = JsonConvert.DeserializeObject<dynamic> (JsonConvert.SerializeObject (rawData));

            return new {
                value = data?.value ?? 0,
                    unit = data?.unit ?? "units",
                    formattedValue = FormatValue (data?.value, data?.unit?.ToString ()),
                    trend = new {
                        direction = data?.trend ?? "stable",
                        percentage = 0, // TODO: Calculate from historical data
                        sparklineData = new [] { 10, 15, 12, 18, 20, 16, Convert.ToDouble (data?.value ?? 0) }
                        },
                        comparison = new {
                        period = "vs last period",
                        value = "+5%",
                        isPositive = true
                        },
                        lastUpdated = DateTime.UtcNow
            };
        }

        // Helper methods
        private async Task<object[]> GetTimeSeriesDataAsync (string dataSource, DashboardMetricRequestDto request) {
            try {
                _logger.LogInformation ("Getting time series data for {DataSource} with mode {Mode} and preset {DatePreset}",
                    dataSource, request.Mode, request.DatePreset);

                // Get time range and interval based on date preset and custom interval hours
                var customIntervalHours = request.IntervalHours;
                var (startDate, endDate, defaultIntervalHours) = GetTimeSeriesRange (request.DatePreset);
                var intervalHours = customIntervalHours ?? defaultIntervalHours;

                _logger.LogInformation ("Time series range: {StartDate} to {EndDate}, interval: {IntervalHours}h (custom: {IsCustom})",
                    startDate, endDate, intervalHours, customIntervalHours.HasValue);

                // Generate time series data based on data source type
                return dataSource.ToLower () switch {
                    "fuel_dispensed"
                    or "fuel_dispense" => await GetFuelDispensedTimeSeriesAsync (startDate, endDate, intervalHours, request),
                        "engine_hours" => await GetEngineHoursTimeSeriesAsync (startDate, endDate, intervalHours, request),
                        "engine_hours_gps" => await GetEngineHoursGpsTimeSeriesAsync (startDate, endDate, intervalHours, request),
                        "km_travel" => await GetDistanceTravelTimeSeriesAsync (startDate, endDate, intervalHours, request),
                        "distance_travel" => await GetDistanceTravelGpsTimeSeriesAsync (startDate, endDate, intervalHours, request),
                        "fuel_used_gps" => await GetFuelUsedGpsTimeSeriesAsync (startDate, endDate, intervalHours, request),
                        "fuel_lost_gps" => await GetFuelLostGpsTimeSeriesAsync (startDate, endDate, intervalHours, request),
                        "flowmeter_fuel_used" => await GetFlowmeterFuelUsedTimeSeriesAsync (startDate, endDate, intervalHours, request),
                        "flowmeter_fuel_lost" => await GetFlowmeterFuelLostTimeSeriesAsync (startDate, endDate, intervalHours, request),
                        "flowmeter_efficiency" => await GetFlowmeterEfficiencyTimeSeriesAsync (startDate, endDate, intervalHours, request),
                        "fuel_efficiency" => await GetFuelEfficiencyTimeSeriesAsync (startDate, endDate, intervalHours, request),
                        "max_speed" => await GetMaxSpeedTimeSeriesAsync (startDate, endDate, intervalHours, request),
                        "avg_speed" => await GetAvgSpeedTimeSeriesAsync (startDate, endDate, intervalHours, request),
                        _ => await GetGenericTimeSeriesAsync (dataSource, startDate, endDate, intervalHours, request)
                };
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting time series data for {DataSource}", dataSource);

                // Return fallback data structure
                var now = DateTime.Now;
                return new object[] {
                    new { timestamp = now.AddHours (-2), value = 0 },
                    new { timestamp = now.AddHours (-1), value = 0 },
                    new { timestamp = now, value = 0 }
                };
            }
        }

        private (DateTime startDate, DateTime endDate, int intervalHours) GetTimeSeriesRange (string datePreset) {
            var now = DateTime.Now;
            var today = now.Date;

            return datePreset?.ToLower () switch {
                "today" => (today, now, 1), // 1-hour intervals for today
                "yesterday" => (today.AddDays (-1), today.AddSeconds (-1), 1), // 1-hour intervals for yesterday
                "last_7_days"
                or "last_week" => (today.AddDays (-7), now, 6), // 6-hour intervals for week
                    "last_30_days"
                or "last_month" => (today.AddDays (-30), now, 24), // Daily intervals for month
                    "this_week" => (GetStartOfWeek (today), now, 6), // 6-hour intervals for this week
                    "this_month" => (new DateTime (today.Year, today.Month, 1), now, 24), // Daily intervals for this month
                    _ => (today, now, 1) // Default: today with 1-hour intervals
            };
        }

        private DateTime GetStartOfWeek (DateTime date) {
            int daysFromMonday = ((int) date.DayOfWeek - 1 + 7) % 7;
            return date.AddDays (-daysFromMonday);
        }

        private async Task<object[]> GetFuelDispensedTimeSeriesAsync (DateTime startDate, DateTime endDate, int intervalHours, DashboardMetricRequestDto request) {
            try {
                var query = _context.TankVolumeHistories
                    .Where (tvh => tvh.Timestamp >= startDate && tvh.Timestamp <= endDate)
                    .Where (tvh => tvh.ChangeReason == VolumeChangeReasonEnum.Dispensing ||
                        tvh.ChangeReason == VolumeChangeReasonEnum.AutomatedDispensing);

                // Apply site filtering if specified
                if (request.SiteIds != null && request.SiteIds.Any ()) {
                    var tankIds = await _context.Tanks
                        .Where (t => request.SiteIds.Contains (t.SiteId))
                        .Select (t => t.Id)
                        .ToListAsync ();
                    query = query.Where (tvh => tankIds.Contains (tvh.TankId ?? 0));
                }

                // Group by time intervals and sum dispensed volumes
                var data = await query
                    .GroupBy (tvh => new {
                        IntervalStart = tvh.Timestamp.AddHours (-(tvh.Timestamp.Hour % intervalHours))
                            .Date.AddHours ((tvh.Timestamp.Hour / intervalHours) * intervalHours)
                    })
                    .Select (g => new {
                        timestamp = g.Key.IntervalStart,
                            value = g.Sum (tvh => Math.Abs (tvh.VolumeChange ?? 0))
                    })
                    .OrderBy (x => x.timestamp)
                    .ToListAsync ();

                return data.Cast<object> ().ToArray ();
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting fuel dispensed time series");
                return GenerateFallbackTimeSeries (startDate, endDate, intervalHours);
            }
        }

        private Task<object[]> GetEngineHoursTimeSeriesAsync (DateTime startDate, DateTime endDate, int intervalHours, DashboardMetricRequestDto request) {
            try {
                // TODO: Implement engine hours time series from GPS data or vehicle logs
                // For now, return simulated data based on interval
                return Task.FromResult (GenerateSimulatedTimeSeries (startDate, endDate, intervalHours, 5, 25)); // 5-25 hours range
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting engine hours time series");
                return Task.FromResult (GenerateFallbackTimeSeries (startDate, endDate, intervalHours));
            }
        }

        private Task<object[]> GetDistanceTravelTimeSeriesAsync (DateTime startDate, DateTime endDate, int intervalHours, DashboardMetricRequestDto request) {
            try {
                // TODO: Implement distance travel time series from GPS data
                // For now, return simulated data based on interval
                return Task.FromResult (GenerateSimulatedTimeSeries (startDate, endDate, intervalHours, 10, 100)); // 10-100 km range
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting distance travel time series");
                return Task.FromResult (GenerateFallbackTimeSeries (startDate, endDate, intervalHours));
            }
        }

        private Task<object[]> GetFuelUsedGpsTimeSeriesAsync (DateTime startDate, DateTime endDate, int intervalHours, DashboardMetricRequestDto request) {
            try {
                // TODO: Implement fuel used GPS time series from processed reports
                // For now, return simulated data based on interval
                return Task.FromResult (GenerateSimulatedTimeSeries (startDate, endDate, intervalHours, 5, 50)); // 5-50 liters range
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting fuel used GPS time series");
                return Task.FromResult (GenerateFallbackTimeSeries (startDate, endDate, intervalHours));
            }
        }

        private async Task<object[]> GetEngineHoursGpsTimeSeriesAsync (DateTime startDate, DateTime endDate, int intervalHours, DashboardMetricRequestDto request) {
            try {
                _logger.LogInformation ("Getting engine hours GPS time series from VehicleConsumption");

                var query = _context.Vehicleconsumptions
                    .Where (vc => vc.Date >= startDate.Date && vc.Date <= endDate.Date)
                    .Where (vc => vc.EngHours.HasValue && vc.EngHours > 0);

                // Apply site filtering
                if (request.SiteIds != null && request.SiteIds.Any ()) {
                    query = query.Where (vc => request.SiteIds.Contains (vc.SiteId));
                }

                // Apply vehicle type filtering if specified
                if (request.VehicleIds != null && request.VehicleIds.Any ()) {
                    query = query.Where (vc => request.VehicleIds.Contains (vc.VehicleId));
                }

                // Group by time intervals and sum engine hours
                var data = await query
                    .GroupBy (vc => new {
                        IntervalStart = vc.Date.AddHours (-(vc.Date.Hour % intervalHours))
                            .Date.AddHours ((vc.Date.Hour / intervalHours) * intervalHours)
                    })
                    .Select (g => new {
                        timestamp = g.Key.IntervalStart,
                            value = g.Sum (vc => vc.EngHours ?? 0)
                    })
                    .OrderBy (x => x.timestamp)
                    .ToListAsync ();

                return data.Cast<object> ().ToArray ();
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting engine hours GPS time series");
                return GenerateSimulatedTimeSeries (startDate, endDate, intervalHours, 2, 20); // 2-20 hours range
            }
        }

        private async Task<object[]> GetDistanceTravelGpsTimeSeriesAsync (DateTime startDate, DateTime endDate, int intervalHours, DashboardMetricRequestDto request) {
            try {
                _logger.LogInformation ("Getting distance travel GPS time series from VehicleConsumption");

                var query = _context.Vehicleconsumptions
                    .Where (vc => vc.Date >= startDate.Date && vc.Date <= endDate.Date)
                    .Where (vc => vc.TotalDistance.HasValue && vc.TotalDistance > 0);

                // Apply site filtering
                if (request.SiteIds != null && request.SiteIds.Any ()) {
                    query = query.Where (vc => request.SiteIds.Contains (vc.SiteId));
                }

                // Apply vehicle type filtering if specified
                if (request.VehicleIds != null && request.VehicleIds.Any ()) {
                    query = query.Where (vc => request.VehicleIds.Contains (vc.VehicleId));
                }

                // Group by time intervals and sum distances
                var data = await query
                    .GroupBy (vc => new {
                        IntervalStart = vc.Date.AddHours (-(vc.Date.Hour % intervalHours))
                            .Date.AddHours ((vc.Date.Hour / intervalHours) * intervalHours)
                    })
                    .Select (g => new {
                        timestamp = g.Key.IntervalStart,
                            value = g.Sum (vc => vc.TotalDistance ?? 0)
                    })
                    .OrderBy (x => x.timestamp)
                    .ToListAsync ();

                return data.Cast<object> ().ToArray ();
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting distance travel GPS time series");
                return GenerateSimulatedTimeSeries (startDate, endDate, intervalHours, 10, 200); // 10-200 km range
            }
        }

        private async Task<object[]> GetFuelLostGpsTimeSeriesAsync (DateTime startDate, DateTime endDate, int intervalHours, DashboardMetricRequestDto request) {
            try {
                _logger.LogInformation ("Getting fuel lost GPS time series from VehicleConsumption");

                var query = _context.Vehicleconsumptions
                    .Where (vc => vc.Date >= startDate.Date && vc.Date <= endDate.Date)
                    .Where (vc => vc.FuelLost.HasValue && vc.FuelLost > 0);

                // Apply site filtering
                if (request.SiteIds != null && request.SiteIds.Any ()) {
                    query = query.Where (vc => request.SiteIds.Contains (vc.SiteId));
                }

                // Apply vehicle type filtering if specified
                if (request.VehicleIds != null && request.VehicleIds.Any ()) {
                    query = query.Where (vc => request.VehicleIds.Contains (vc.VehicleId));
                }

                // Group by time intervals and sum fuel losses
                var data = await query
                    .GroupBy (vc => new {
                        IntervalStart = vc.Date.AddHours (-(vc.Date.Hour % intervalHours))
                            .Date.AddHours ((vc.Date.Hour / intervalHours) * intervalHours)
                    })
                    .Select (g => new {
                        timestamp = g.Key.IntervalStart,
                            value = g.Sum (vc => vc.FuelLost ?? 0)
                    })
                    .OrderBy (x => x.timestamp)
                    .ToListAsync ();

                return data.Cast<object> ().ToArray ();
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting fuel lost GPS time series");
                return GenerateSimulatedTimeSeries (startDate, endDate, intervalHours, 0, 10); // 0-10 liters loss range
            }
        }

        private async Task<object[]> GetFlowmeterFuelUsedTimeSeriesAsync (DateTime startDate, DateTime endDate, int intervalHours, DashboardMetricRequestDto request) {
            try {
                _logger.LogInformation ("Getting flowmeter fuel used time series from VehicleConsumption");

                var query = _context.Vehicleconsumptions
                    .Where (vc => vc.Date >= startDate.Date && vc.Date <= endDate.Date)
                    .Where (vc => vc.FlowMeterFuelUsed.HasValue && vc.FlowMeterFuelUsed > 0);

                // Apply site filtering
                if (request.SiteIds != null && request.SiteIds.Any ()) {
                    query = query.Where (vc => request.SiteIds.Contains (vc.SiteId));
                }

                // Apply vehicle type filtering if specified
                if (request.VehicleIds != null && request.VehicleIds.Any ()) {
                    query = query.Where (vc => request.VehicleIds.Contains (vc.VehicleId));
                }

                // Group by time intervals and sum flowmeter fuel usage
                var data = await query
                    .GroupBy (vc => new {
                        IntervalStart = vc.Date.AddHours (-(vc.Date.Hour % intervalHours))
                            .Date.AddHours ((vc.Date.Hour / intervalHours) * intervalHours)
                    })
                    .Select (g => new {
                        timestamp = g.Key.IntervalStart,
                            value = g.Sum (vc => vc.FlowMeterFuelUsed ?? 0)
                    })
                    .OrderBy (x => x.timestamp)
                    .ToListAsync ();

                return data.Cast<object> ().ToArray ();
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting flowmeter fuel used time series");
                return GenerateSimulatedTimeSeries (startDate, endDate, intervalHours, 5, 45); // 5-45 liters range
            }
        }

        private async Task<object[]> GetFlowmeterFuelLostTimeSeriesAsync (DateTime startDate, DateTime endDate, int intervalHours, DashboardMetricRequestDto request) {
            try {
                _logger.LogInformation ("Getting flowmeter fuel lost time series from VehicleConsumption");

                var query = _context.Vehicleconsumptions
                    .Where (vc => vc.Date >= startDate.Date && vc.Date <= endDate.Date)
                    .Where (vc => vc.FlowMeterFuelLost.HasValue && vc.FlowMeterFuelLost > 0);

                // Apply site filtering
                if (request.SiteIds != null && request.SiteIds.Any ()) {
                    query = query.Where (vc => request.SiteIds.Contains (vc.SiteId));
                }

                // Apply vehicle type filtering if specified
                if (request.VehicleIds != null && request.VehicleIds.Any ()) {
                    query = query.Where (vc => request.VehicleIds.Contains (vc.VehicleId));
                }

                // Group by time intervals and sum flowmeter fuel losses
                var data = await query
                    .GroupBy (vc => new {
                        IntervalStart = vc.Date.AddHours (-(vc.Date.Hour % intervalHours))
                            .Date.AddHours ((vc.Date.Hour / intervalHours) * intervalHours)
                    })
                    .Select (g => new {
                        timestamp = g.Key.IntervalStart,
                            value = g.Sum (vc => vc.FlowMeterFuelLost ?? 0)
                    })
                    .OrderBy (x => x.timestamp)
                    .ToListAsync ();

                return data.Cast<object> ().ToArray ();
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting flowmeter fuel lost time series");
                return GenerateSimulatedTimeSeries (startDate, endDate, intervalHours, 0, 8); // 0-8 liters loss range
            }
        }

        private async Task<object[]> GetFlowmeterEfficiencyTimeSeriesAsync (DateTime startDate, DateTime endDate, int intervalHours, DashboardMetricRequestDto request) {
            try {
                _logger.LogInformation ("Getting flowmeter efficiency time series from VehicleConsumption");

                var query = _context.Vehicleconsumptions
                    .Where (vc => vc.Date >= startDate.Date && vc.Date <= endDate.Date)
                    .Where (vc => vc.FlowMeterEffiency.HasValue && vc.FlowMeterEffiency > 0);

                // Apply site filtering
                if (request.SiteIds != null && request.SiteIds.Any ()) {
                    query = query.Where (vc => request.SiteIds.Contains (vc.SiteId));
                }

                // Apply vehicle type filtering if specified
                if (request.VehicleIds != null && request.VehicleIds.Any ()) {
                    query = query.Where (vc => request.VehicleIds.Contains (vc.VehicleId));
                }

                // Group by time intervals and average efficiency
                var data = await query
                    .GroupBy (vc => new {
                        IntervalStart = vc.Date.AddHours (-(vc.Date.Hour % intervalHours))
                            .Date.AddHours ((vc.Date.Hour / intervalHours) * intervalHours)
                    })
                    .Select (g => new {
                        timestamp = g.Key.IntervalStart,
                            value = g.Average (vc => vc.FlowMeterEffiency ?? 0)
                    })
                    .OrderBy (x => x.timestamp)
                    .ToListAsync ();

                return data.Cast<object> ().ToArray ();
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting flowmeter efficiency time series");
                return GenerateSimulatedTimeSeries (startDate, endDate, intervalHours, 70, 95); // 70-95% efficiency range
            }
        }

        private async Task<object[]> GetFuelEfficiencyTimeSeriesAsync (DateTime startDate, DateTime endDate, int intervalHours, DashboardMetricRequestDto request) {
            try {
                _logger.LogInformation ("Getting fuel efficiency time series from VehicleConsumption");

                var query = _context.Vehicleconsumptions
                    .Where (vc => vc.Date >= startDate.Date && vc.Date <= endDate.Date)
                    .Where (vc => vc.FuelEfficiency.HasValue && vc.FuelEfficiency > 0);

                // Apply site filtering
                if (request.SiteIds != null && request.SiteIds.Any ()) {
                    query = query.Where (vc => request.SiteIds.Contains (vc.SiteId));
                }

                // Apply vehicle type filtering if specified
                if (request.VehicleIds != null && request.VehicleIds.Any ()) {
                    query = query.Where (vc => request.VehicleIds.Contains (vc.VehicleId));
                }

                // Group by time intervals and average efficiency
                var data = await query
                    .GroupBy (vc => new {
                        IntervalStart = vc.Date.AddHours (-(vc.Date.Hour % intervalHours))
                            .Date.AddHours ((vc.Date.Hour / intervalHours) * intervalHours)
                    })
                    .Select (g => new {
                        timestamp = g.Key.IntervalStart,
                            value = g.Average (vc => vc.FuelEfficiency ?? 0)
                    })
                    .OrderBy (x => x.timestamp)
                    .ToListAsync ();

                return data.Cast<object> ().ToArray ();
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting fuel efficiency time series");
                return GenerateSimulatedTimeSeries (startDate, endDate, intervalHours, 5, 15); // 5-15 km/l range
            }
        }

        private async Task<object[]> GetMaxSpeedTimeSeriesAsync (DateTime startDate, DateTime endDate, int intervalHours, DashboardMetricRequestDto request) {
            try {
                _logger.LogInformation ("Getting max speed time series from VehicleConsumption");

                var query = _context.Vehicleconsumptions
                    .Where (vc => vc.Date >= startDate.Date && vc.Date <= endDate.Date)
                    .Where (vc => vc.MaxSpeed.HasValue && vc.MaxSpeed > 0);

                // Apply site filtering
                if (request.SiteIds != null && request.SiteIds.Any ()) {
                    query = query.Where (vc => request.SiteIds.Contains (vc.SiteId));
                }

                // Apply vehicle type filtering if specified
                if (request.VehicleIds != null && request.VehicleIds.Any ()) {
                    query = query.Where (vc => request.VehicleIds.Contains (vc.VehicleId));
                }

                // Group by time intervals and get maximum speed
                var data = await query
                    .GroupBy (vc => new {
                        IntervalStart = vc.Date.AddHours (-(vc.Date.Hour % intervalHours))
                            .Date.AddHours ((vc.Date.Hour / intervalHours) * intervalHours)
                    })
                    .Select (g => new {
                        timestamp = g.Key.IntervalStart,
                            value = g.Max (vc => vc.MaxSpeed ?? 0)
                    })
                    .OrderBy (x => x.timestamp)
                    .ToListAsync ();

                return data.Cast<object> ().ToArray ();
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting max speed time series");
                return GenerateSimulatedTimeSeries (startDate, endDate, intervalHours, 40, 120); // 40-120 km/h range
            }
        }

        private async Task<object[]> GetAvgSpeedTimeSeriesAsync (DateTime startDate, DateTime endDate, int intervalHours, DashboardMetricRequestDto request) {
            try {
                _logger.LogInformation ("Getting average speed time series from VehicleConsumption");

                var query = _context.Vehicleconsumptions
                    .Where (vc => vc.Date >= startDate.Date && vc.Date <= endDate.Date)
                    .Where (vc => vc.AvgSpeed.HasValue && vc.AvgSpeed > 0);

                // Apply site filtering
                if (request.SiteIds != null && request.SiteIds.Any ()) {
                    query = query.Where (vc => request.SiteIds.Contains (vc.SiteId));
                }

                // Apply vehicle type filtering if specified
                if (request.VehicleIds != null && request.VehicleIds.Any ()) {
                    query = query.Where (vc => request.VehicleIds.Contains (vc.VehicleId));
                }

                // Group by time intervals and get average speed
                var data = await query
                    .GroupBy (vc => new {
                        IntervalStart = vc.Date.AddHours (-(vc.Date.Hour % intervalHours))
                            .Date.AddHours ((vc.Date.Hour / intervalHours) * intervalHours)
                    })
                    .Select (g => new {
                        timestamp = g.Key.IntervalStart,
                            value = g.Average (vc => vc.AvgSpeed ?? 0)
                    })
                    .OrderBy (x => x.timestamp)
                    .ToListAsync ();

                return data.Cast<object> ().ToArray ();
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting average speed time series");
                return GenerateSimulatedTimeSeries (startDate, endDate, intervalHours, 20, 80); // 20-80 km/h range
            }
        }

        private Task<object[]> GetGenericTimeSeriesAsync (string dataSource, DateTime startDate, DateTime endDate, int intervalHours, DashboardMetricRequestDto request) {
            try {
                _logger.LogInformation ("Generating generic time series for unknown data source: {DataSource}", dataSource);
                return Task.FromResult (GenerateSimulatedTimeSeries (startDate, endDate, intervalHours, 0, 100)); // Generic 0-100 range
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting generic time series for {DataSource}", dataSource);
                return Task.FromResult (GenerateFallbackTimeSeries (startDate, endDate, intervalHours));
            }
        }

        private object[] GenerateSimulatedTimeSeries (DateTime startDate, DateTime endDate, int intervalHours, double minValue, double maxValue) {
            var dataPoints = new List<object> ();
            var random = new Random ();
            var currentTime = startDate;

            while (currentTime <= endDate) {
                var value = Math.Round (random.NextDouble () * (maxValue - minValue) + minValue, 2);
                dataPoints.Add (new {
                    timestamp = currentTime,
                        value = value
                });
                currentTime = currentTime.AddHours (intervalHours);
            }

            return dataPoints.ToArray ();
        }

        private object[] GenerateFallbackTimeSeries (DateTime startDate, DateTime endDate, int intervalHours) {
            var dataPoints = new List<object> ();
            var currentTime = startDate;
            var pointCount = 0;

            while (currentTime <= endDate && pointCount < 24) { // Limit to 24 points max
                dataPoints.Add (new {
                    timestamp = currentTime,
                        value = 0
                });
                currentTime = currentTime.AddHours (intervalHours);
                pointCount++;
            }

            return dataPoints.ToArray ();
        }

        private object CalculateChange (DashboardMetricResponseDto response) {
            // TODO: Implement actual change calculation by comparing with previous period
            return new {
                value = 0,
                    percentage = 0,
                    direction = "stable"
            };
        }

        private string FormatValue (object value, string unit) {
            if (value == null) return "0";

            var numericValue = Convert.ToDouble (value);
            return unit?.ToLower () switch {
                "liters"
                or "l" => $"{numericValue:N0} L",
                    "hours"
                    or "hrs" => $"{numericValue:N1} hrs",
                    "kilometers"
                    or "km" => $"{numericValue:N0} km",
                    "percentage"
                    or "%" => $"{numericValue:N1}%",
                    _ => $"{numericValue:N2} {unit}"
            };
        }

        private T GetConfigValue<T> (Dictionary<string, object> configuration, string key, T defaultValue) {
            if (configuration?.TryGetValue (key, out var value) == true) {
                try {
                    return (T) Convert.ChangeType (value, typeof (T));
                } catch {
                    return defaultValue;
                }
            }
            return defaultValue;
        }
    }
}