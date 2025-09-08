using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.ModelsDTOs.Dashboard;
using FMS.Application.Services.Dashboard;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace FMS.WebClient.Controllers.Dashboard {
    /// <summary>
    /// Phase 2: Data Source API Controller
    /// Provides streaming-capable data source endpoints for unified dashboard data management
    /// </summary>
    [ApiController]
    [Route ("api/dashboard/data-sources")]
    [Authorize]
    public class DataSourceController : ControllerBase {
        private readonly IDataSourceManager _dataSourceManager;
        private readonly ILogger<DataSourceController> _logger;

        public DataSourceController (
            IDataSourceManager dataSourceManager,
            ILogger<DataSourceController> logger) {
            _dataSourceManager = dataSourceManager;
            _logger = logger;
        }

        /// <summary>
        /// Get initial data for a specific data source
        /// </summary>
        /// <param name="dataSource">Data source identifier (e.g., 'fuel_dispense', 'engine_hours')</param>
        /// <param name="request">Dashboard metric request parameters</param>
        /// <returns>Initial data response</returns>
        [HttpGet ("{dataSource}/initial")]
        public async Task<IActionResult> GetInitialData (
            string dataSource, [FromQuery] DashboardMetricRequestDto request) {
            try {
                _logger.LogInformation ("Getting initial data for data source: {DataSource}", dataSource);

                if (string.IsNullOrEmpty (dataSource)) {
                    return BadRequest (new { error = "Data source identifier is required" });
                }

                // Set defaults if not provided
                request = request ?? new DashboardMetricRequestDto ();
                request.MetricType = request.MetricType ?? dataSource;
                request.Mode = request.Mode ?? "historical";
                request.DatePreset = request.DatePreset ?? "today";

                var result = await _dataSourceManager.GetInitialDataAsync (dataSource, request);

                return Ok (result);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting initial data for data source: {DataSource}", dataSource);
                return StatusCode (500, new {
                    error = "Internal server error",
                        message = ex.Message,
                        dataSource,
                        timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Get live/streaming data for a specific data source
        /// </summary>
        /// <param name="dataSource">Data source identifier</param>
        /// <param name="request">Dashboard metric request parameters</param>
        /// <returns>Live data response</returns>
        [HttpGet ("{dataSource}/live")]
        public async Task<IActionResult> GetLiveData (
            string dataSource, [FromQuery] DashboardMetricRequestDto request) {
            try {
                _logger.LogInformation ("Getting live data for data source: {DataSource}", dataSource);

                if (string.IsNullOrEmpty (dataSource)) {
                    return BadRequest (new { error = "Data source identifier is required" });
                }

                // Check if data source supports live data
                if (!_dataSourceManager.IsLiveDataSource (dataSource)) {
                    return BadRequest (new {
                        error = $"Data source '{dataSource}' does not support live data",
                            supportedModes = new [] { "historical" }
                    });
                }

                // Set defaults for live data
                request = request ?? new DashboardMetricRequestDto ();
                request.MetricType = request.MetricType ?? dataSource;
                request.Mode = "live"; // Force live mode
                request.DatePreset = request.DatePreset ?? "today";

                var result = await _dataSourceManager.GetLiveDataAsync (dataSource, request);

                return Ok (result);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting live data for data source: {DataSource}", dataSource);
                return StatusCode (500, new {
                    error = "Internal server error",
                        message = ex.Message,
                        dataSource,
                        timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Get aggregated data for a specific data source
        /// </summary>
        /// <param name="dataSource">Data source identifier</param>
        /// <param name="aggregationInterval">Aggregation interval (hourly, daily, weekly)</param>
        /// <param name="request">Dashboard metric request parameters</param>
        /// <returns>Aggregated data response</returns>
        [HttpGet ("{dataSource}/aggregated")]
        public async Task<IActionResult> GetAggregatedData (
            string dataSource, [FromQuery] string aggregationInterval = "hourly", [FromQuery] DashboardMetricRequestDto request = null) {
            try {
                _logger.LogInformation ("Getting aggregated data for data source: {DataSource}, Interval: {Interval}",
                    dataSource, aggregationInterval);

                if (string.IsNullOrEmpty (dataSource)) {
                    return BadRequest (new { error = "Data source identifier is required" });
                }

                // Validate aggregation interval
                var validIntervals = new [] { "hourly", "daily", "weekly", "monthly" };
                if (!validIntervals.Contains (aggregationInterval?.ToLower ())) {
                    return BadRequest (new {
                        error = "Invalid aggregation interval",
                            validIntervals
                    });
                }

                // Set defaults
                request = request ?? new DashboardMetricRequestDto ();
                request.MetricType = request.MetricType ?? dataSource;
                request.Mode = request.Mode ?? "historical";
                request.DatePreset = request.DatePreset ?? "last7days"; // Default to last 7 days for aggregation

                var result = await _dataSourceManager.GetAggregatedDataAsync (dataSource, request, aggregationInterval);

                return Ok (result);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting aggregated data for data source: {DataSource}", dataSource);
                return StatusCode (500, new {
                    error = "Internal server error",
                        message = ex.Message,
                        dataSource,
                        aggregationInterval,
                        timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Get metadata for a specific data source
        /// </summary>
        /// <param name="dataSource">Data source identifier</param>
        /// <returns>Data source metadata</returns>
        [HttpGet ("{dataSource}/metadata")]
        public async Task<IActionResult> GetDataSourceMetadata (string dataSource) {
            try {
                _logger.LogInformation ("Getting metadata for data source: {DataSource}", dataSource);

                if (string.IsNullOrEmpty (dataSource)) {
                    return BadRequest (new { error = "Data source identifier is required" });
                }

                var metadata = _dataSourceManager.GetDataSourceMetadata (dataSource);

                return Ok (metadata);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting metadata for data source: {DataSource}", dataSource);
                return StatusCode (500, new {
                    error = "Internal server error",
                        message = ex.Message,
                        dataSource,
                        timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Get all available data sources
        /// </summary>
        /// <returns>List of available data sources with metadata</returns>
        [HttpGet]
        public async Task<IActionResult> GetAvailableDataSources () {
            try {
                _logger.LogInformation ("Getting all available data sources");

                // Get all available data sources from WidgetTypeDefinitions
                var dataSources = new List<object> ();

                // Add fuel management data sources
                dataSources.Add (new {
                    id = "fuel_dispensed",
                        metadata = _dataSourceManager.GetDataSourceMetadata ("fuel_dispensed")
                });

                dataSources.Add (new {
                    id = "fuel_used_gps",
                        metadata = _dataSourceManager.GetDataSourceMetadata ("fuel_used_gps")
                });

                dataSources.Add (new {
                    id = "fuel_lost_gps",
                        metadata = _dataSourceManager.GetDataSourceMetadata ("fuel_lost_gps")
                });

                dataSources.Add (new {
                    id = "flowmeter_fuel_used",
                        metadata = _dataSourceManager.GetDataSourceMetadata ("flowmeter_fuel_used")
                });

                dataSources.Add (new {
                    id = "flowmeter_fuel_lost",
                        metadata = _dataSourceManager.GetDataSourceMetadata ("flowmeter_fuel_lost")
                });

                // Add vehicle performance data sources
                dataSources.Add (new {
                    id = "engine_hours",
                        metadata = _dataSourceManager.GetDataSourceMetadata ("engine_hours")
                });

                dataSources.Add (new {
                    id = "engine_hours_gps",
                        metadata = _dataSourceManager.GetDataSourceMetadata ("engine_hours_gps")
                });

                dataSources.Add (new {
                    id = "km_travel",
                        metadata = _dataSourceManager.GetDataSourceMetadata ("km_travel")
                });

                dataSources.Add (new {
                    id = "distance_travel",
                        metadata = _dataSourceManager.GetDataSourceMetadata ("distance_travel")
                });

                dataSources.Add (new {
                    id = "fuel_efficiency",
                        metadata = _dataSourceManager.GetDataSourceMetadata ("fuel_efficiency")
                });

                dataSources.Add (new {
                    id = "flowmeter_efficiency",
                        metadata = _dataSourceManager.GetDataSourceMetadata ("flowmeter_efficiency")
                });

                dataSources.Add (new {
                    id = "max_speed",
                        metadata = _dataSourceManager.GetDataSourceMetadata ("max_speed")
                });

                dataSources.Add (new {
                    id = "avg_speed",
                        metadata = _dataSourceManager.GetDataSourceMetadata ("avg_speed")
                });

                return Ok (new {
                    success = true,
                        data = dataSources,
                        count = dataSources.Count,
                        timestamp = DateTime.UtcNow
                });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting available data sources");
                return StatusCode (500, new {
                    error = "Internal server error",
                        message = ex.Message,
                        timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Get initial data for a data source using query parameters (Legacy compatibility)
        /// </summary>
        /// <param name="sourceId">Data source identifier (e.g., 'fuel-dispense-metrics')</param>
        /// <param name="mode">Data mode (live, cumulative)</param>
        /// <param name="datePreset">Date preset (today, yesterday, etc.)</param>
        /// <param name="intervalHours">Time interval in hours for time-series data</param>
        /// <param name="siteIds">Optional comma-separated site IDs</param>
        /// <param name="vehicleIds">Optional comma-separated vehicle IDs</param>
        /// <returns>Initial data response</returns>
        [HttpGet ("initial-data")]
        public async Task<IActionResult> GetInitialDataByQuery (
            [FromQuery] string sourceId, [FromQuery] string mode = "cumulative", [FromQuery] string datePreset = "yesterday", [FromQuery] int? intervalHours = null, [FromQuery] string siteIds = null, [FromQuery] string vehicleIds = null) {
            try {
                _logger.LogInformation ("Getting initial data for source: {SourceId}, Mode: {Mode}, DatePreset: {DatePreset}, IntervalHours: {IntervalHours}",
                    sourceId, mode, datePreset, intervalHours);

                if (string.IsNullOrEmpty (sourceId)) {
                    return BadRequest (new { error = "Source ID is required" });
                }

                // Map sourceId to actual metric type
                var metricType = MapSourceIdToMetricType (sourceId);

                // Build request parameters
                var request = new DashboardMetricRequestDto {
                    MetricType = metricType,
                    Mode = mode,
                    DatePreset = datePreset,
                    IntervalHours = intervalHours ?? GetDefaultIntervalHours (datePreset)
                };

                // Parse site IDs if provided
                if (!string.IsNullOrEmpty (siteIds)) {
                    var siteIdList = siteIds.Split (',', StringSplitOptions.RemoveEmptyEntries)
                        .Select (id => int.TryParse (id.Trim (), out var siteId) ? siteId : (int?) null)
                        .Where (id => id.HasValue)
                        .Select (id => id.Value)
                        .ToList ();
                    request.SiteIds = siteIdList;
                }

                // Parse vehicle IDs if provided
                if (!string.IsNullOrEmpty (vehicleIds)) {
                    var vehicleIdList = vehicleIds.Split (',', StringSplitOptions.RemoveEmptyEntries)
                        .Select (id => int.TryParse (id.Trim (), out var vehicleId) ? vehicleId : (int?) null)
                        .Where (id => id.HasValue)
                        .Select (id => id.Value)
                        .ToList ();
                    request.VehicleIds = vehicleIdList;
                }

                var result = await _dataSourceManager.GetInitialDataAsync (metricType, request);

                return Ok (result);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting initial data for source: {SourceId}", sourceId);
                return StatusCode (500, new {
                    error = "Internal server error",
                        message = ex.Message,
                        sourceId,
                        timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Map source ID to metric type for backward compatibility
        /// </summary>
        /// <param name="sourceId">Source identifier from frontend</param>
        /// <returns>Mapped metric type</returns>
        private string MapSourceIdToMetricType (string sourceId) {
            if (string.IsNullOrEmpty (sourceId)) return sourceId ?? string.Empty;

            return sourceId.ToLower () switch {
                "fuel-dispense-metrics" => "fuel_dispensed",
                "fuel_dispensed" => "fuel_dispensed", // Direct mapping
                "fuel_dispense" => "fuel_dispensed", // Alternative variation
                "fuel-used-gps-metrics" => "fuel_used_gps",
                "fuel_used_gps" => "fuel_used_gps", // Direct mapping
                "fuel-lost-gps-metrics" => "fuel_lost_gps",
                "fuel_lost_gps" => "fuel_lost_gps", // Direct mapping
                "flowmeter-fuel-used-metrics" => "flowmeter_fuel_used",
                "flowmeter_fuel_used" => "flowmeter_fuel_used", // Direct mapping
                "flowmeter-fuel-lost-metrics" => "flowmeter_fuel_lost",
                "flowmeter_fuel_lost" => "flowmeter_fuel_lost", // Direct mapping
                "engine-hours-metrics" => "engine_hours",
                "engine_hours" => "engine_hours", // Direct mapping
                "engine-hours-gps-metrics" => "engine_hours_gps",
                "engine_hours_gps" => "engine_hours_gps", // Direct mapping
                "distance-travelled-metrics" => "km_travel",
                "km_travel" => "km_travel", // Direct mapping
                "distance_traveled" => "km_travel", // US spelling variant
                "distance_travelled" => "km_travel", // UK spelling variant
                "distance-travel-gps-metrics" => "distance_travel",
                "distance_travel" => "distance_travel", // Direct mapping
                "fuel-efficiency-metrics" => "fuel_efficiency",
                "fuel_efficiency" => "fuel_efficiency", // Direct mapping
                "flowmeter-efficiency-metrics" => "flowmeter_efficiency",
                "flowmeter_efficiency" => "flowmeter_efficiency", // Direct mapping
                "max-speed-metrics" => "max_speed",
                "max_speed" => "max_speed", // Direct mapping
                "avg-speed-metrics" => "avg_speed",
                "avg_speed" => "avg_speed", // Direct mapping
                "average_speed" => "avg_speed", // Alternative variation
                _ => sourceId.Replace ("-metrics", "").Replace ("-", "_")
            };
        }

        /// <summary>
        /// Get default interval hours for a date preset
        /// </summary>
        /// <param name="datePreset">Date preset</param>
        /// <returns>Default interval in hours</returns>
        private int GetDefaultIntervalHours (string datePreset) {
            return datePreset?.ToLower () switch {
                "today" => 1, // 1-hour intervals for today
                "yesterday" => 1, // 1-hour intervals for yesterday
                "last_7_days"
                or "last_week" => 6, // 6-hour intervals for week
                    "last_30_days"
                or "last_month" => 24, // Daily intervals for month
                    "this_week" => 6, // 6-hour intervals for this week
                    "this_month" => 24, // Daily intervals for this month
                    _ => 1 // Default: 1-hour intervals
            };
        }

        /// <summary>
        /// Get supported aggregations for a data source
        /// </summary>
        /// <param name="dataSource">Data source identifier</param>
        /// <returns>List of supported aggregations</returns>
        [HttpGet ("{dataSource}/aggregations")]
        public async Task<IActionResult> GetSupportedAggregations (string dataSource) {
            try {
                _logger.LogInformation ("Getting supported aggregations for data source: {DataSource}", dataSource);

                if (string.IsNullOrEmpty (dataSource)) {
                    return BadRequest (new { error = "Data source identifier is required" });
                }

                var aggregations = _dataSourceManager.GetSupportedAggregations (dataSource);

                return Ok (new {
                    success = true,
                        dataSource,
                        supportedAggregations = aggregations,
                        timestamp = DateTime.UtcNow
                });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting supported aggregations for data source: {DataSource}", dataSource);
                return StatusCode (500, new {
                    error = "Internal server error",
                        message = ex.Message,
                        dataSource,
                        timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Trigger data refresh for a specific data source (for testing/debugging)
        /// </summary>
        /// <param name="dataSource">Data source identifier</param>
        /// <returns>Refresh status</returns>
        [HttpPost ("{dataSource}/refresh")]
        public async Task<IActionResult> RefreshDataSource (string dataSource) {
            try {
                _logger.LogInformation ("Manually refreshing data source: {DataSource}", dataSource);

                if (string.IsNullOrEmpty (dataSource)) {
                    return BadRequest (new { error = "Data source identifier is required" });
                }

                // Get latest live data and broadcast it
                var request = new DashboardMetricRequestDto {
                    MetricType = dataSource,
                    Mode = "live",
                    DatePreset = "today"
                };

                var refreshedData = await _dataSourceManager.GetLiveDataAsync (dataSource, request);

                // Broadcast the update
                await _dataSourceManager.BroadcastDataUpdateAsync (dataSource, refreshedData);

                return Ok (new {
                    success = true,
                        message = $"Data source '{dataSource}' refreshed successfully",
                        dataSource,
                        data = refreshedData,
                        timestamp = DateTime.UtcNow
                });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error refreshing data source: {DataSource}", dataSource);
                return StatusCode (500, new {
                    error = "Internal server error",
                        message = ex.Message,
                        dataSource,
                        timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Health check endpoint for data source service
        /// </summary>
        /// <returns>Health status</returns>
        [HttpGet ("health")]
        public async Task<IActionResult> GetHealthStatus () {
            try {
                _logger.LogInformation ("Getting data source service health status");

                var healthData = new {
                    status = "healthy",
                    service = "DataSourceService",
                    phase = "Phase 2 - Streaming Data Service",
                    version = "2.0.0",
                    timestamp = DateTime.UtcNow,
                    capabilities = new {
                    streamingSupported = true,
                    aggregationSupported = true,
                    liveDataSupported = true,
                    cacheEnabled = true
                    },
                    availableDataSources = new [] {
                    "fuel_dispense",
                    "fuel_used_gps",
                    "fuel_lost_gps",
                    "flowmeter_fuel_used",
                    "flowmeter_fuel_lost",
                    "engine_hours",
                    "engine_hours_gps",
                    "km_travel",
                    "distance_travel",
                    "fuel_efficiency",
                    "flowmeter_efficiency",
                    "max_speed",
                    "avg_speed"
                    }
                };

                return Ok (healthData);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting health status");
                return StatusCode (500, new {
                    status = "unhealthy",
                        error = ex.Message,
                        timestamp = DateTime.UtcNow
                });
            }
        }
    }
}