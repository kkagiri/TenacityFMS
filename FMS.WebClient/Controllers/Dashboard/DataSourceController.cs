using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Dashboard;
using FMS.Application.Features.Dashboard.Dtos;
using FMS.Application.Services.Dashboard;
using FMS.Domain.Entities.Dashboard;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace FMS.WebClient.Controllers.Dashboard
{
    /// <summary>
    /// Phase 2: Data Source API Controller (partial legacy)
    /// NOTE: Live/streaming delivery is migrating to SignalR (DashboardHub). HTTP endpoints involved in
    /// streaming are deprecated and should not be used by new clients. Prefer SignalR subscriptions via DashboardHub.
    /// </summary>
    [ApiController]
    [Route("api/v1/dashboard/data-sources")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class DataSourceController : ControllerBase
    {
        private readonly IDataSourceManager _dataSourceManager;
        private readonly ILogger<DataSourceController> _logger;

        public DataSourceController(
            IDataSourceManager dataSourceManager,
            ILogger<DataSourceController> logger)
        {
            _dataSourceManager = dataSourceManager;
            _logger = logger;
        }

        /// <summary>
        /// Get initial data for a specific data source
        /// </summary>
        /// <param name="dataSource">Data source identifier (e.g., 'fuel_dispense', 'engine_hours')</param>
        /// <param name="request">Dashboard metric request parameters</param>
        /// <returns>Initial data response</returns>
        [HttpGet("{dataSource}/initial")]
        public async Task<ActionResult<FMSResponse<object>>> GetInitialData(
            string dataSource, [FromQuery] DashboardMetricRequestDto request)
        {
            try
            {
                _logger.LogInformation("Getting initial data for data source: {DataSource}", dataSource);

                if (string.IsNullOrWhiteSpace(dataSource))
                {
                    return BadRequest(CreateValidationErrorResponse("Data source identifier is required"));
                }

                // Set defaults if not provided
                if (request == null) request = new DashboardMetricRequestDto();
                if (request.MetricType == null) request.MetricType = dataSource;
                if (request.Mode == null) request.Mode = "historical";
                if (request.DatePreset == null) request.DatePreset = "today";

                var result = await _dataSourceManager.GetInitialDataAsync(dataSource, request);

                if (TryExtractError(result, out var errorMessage))
                {
                    var errorResponse = FMSResponse<object>.Failed(errorMessage);
                    errorResponse.Data = result;
                    return BadRequest(errorResponse);
                }

                return Ok(FMSResponse<object>.Success(result));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting initial data for data source: {DataSource}", dataSource);
                return StatusCode(500, FMSResponse<object>.SystemError("An unexpected error occurred while retrieving initial data."));
            }
        }

        /// <summary>
        /// Get live/streaming data for a specific data source
        /// </summary>
        /// <param name="dataSource">Data source identifier</param>
        /// <param name="request">Dashboard metric request parameters</param>
        /// <returns>Live data response</returns>
        [Obsolete("Deprecated: Use SignalR DashboardHub for live streaming (MetricDataUpdate group 'metric_{dataSource}').")]
        [ApiExplorerSettings(IgnoreApi = true)]
        [HttpGet("{dataSource}/live")]
        public async Task<ActionResult<FMSResponse<object>>> GetLiveData(
            string dataSource, [FromQuery] DashboardMetricRequestDto request)
        {
            try
            {
                // Mark response as deprecated for clients that still call this endpoint
                Response.Headers["Deprecation"] = "true";
                Response.Headers["Sunset"] = "2025-12-31";
                _logger.LogInformation("Getting live data for data source: {DataSource}", dataSource);

                if (string.IsNullOrWhiteSpace(dataSource))
                {
                    return BadRequest(CreateValidationErrorResponse("Data source identifier is required"));
                }

                if (!_dataSourceManager.IsLiveDataSource(dataSource))
                {
                    var errorResponse = FMSResponse<object>.Failed($"Data source '{dataSource}' does not support live data");
                    errorResponse.Data = new
                    {
                        supportedModes = new[] { "historical" }
                    };
                    return BadRequest(errorResponse);
                }

                // Set defaults for live data
                if (request == null) request = new DashboardMetricRequestDto();
                if (request.MetricType == null) request.MetricType = dataSource;
                request.Mode = "live"; // Force live mode
                if (request.DatePreset == null) request.DatePreset = "today";

                var result = await _dataSourceManager.GetLiveDataAsync(dataSource, request);

                if (TryExtractError(result, out var errorMessage))
                {
                    var errorResponse = FMSResponse<object>.Failed(errorMessage);
                    errorResponse.Data = result;
                    return BadRequest(errorResponse);
                }

                return Ok(FMSResponse<object>.Success(result));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting live data for data source: {DataSource}", dataSource);
                return StatusCode(500, FMSResponse<object>.SystemError("An unexpected error occurred while retrieving live data."));
            }
        }

        /// <summary>
        /// Get aggregated data for a specific data source
        /// </summary>
        /// <param name="dataSource">Data source identifier</param>
        /// <param name="aggregationInterval">Aggregation interval (hourly, daily, weekly)</param>
        /// <param name="request">Dashboard metric request parameters</param>
        /// <returns>Aggregated data response</returns>
        [HttpGet("{dataSource}/aggregated")]
        public async Task<ActionResult<FMSResponse<object>>> GetAggregatedData(
            string dataSource, [FromQuery] string aggregationInterval = "hourly", [FromQuery] DashboardMetricRequestDto request = null)
        {
            try
            {
                _logger.LogInformation("Getting aggregated data for data source: {DataSource}, Interval: {Interval}",
                    dataSource, aggregationInterval);

                if (string.IsNullOrWhiteSpace(dataSource))
                {
                    return BadRequest(CreateValidationErrorResponse("Data source identifier is required"));
                }

                var validIntervals = new[] { "hourly", "daily", "weekly", "monthly" };
                if (!validIntervals.Contains(aggregationInterval?.ToLower()))
                {
                    var errorResponse = CreateValidationErrorResponse("Invalid aggregation interval", new[] { "Invalid aggregation interval" }, new
                    {
                        validIntervals
                    });
                    return BadRequest(errorResponse);
                }

                // Set defaults
                if (request == null) request = new DashboardMetricRequestDto();
                if (request.MetricType == null) request.MetricType = dataSource;
                if (request.Mode == null) request.Mode = "historical";
                if (request.DatePreset == null) request.DatePreset = "last7days";

                var result = await _dataSourceManager.GetAggregatedDataAsync(dataSource, request, aggregationInterval);

                if (TryExtractError(result, out var errorMessage))
                {
                    var errorResponse = FMSResponse<object>.Failed(errorMessage);
                    errorResponse.Data = result;
                    return BadRequest(errorResponse);
                }

                return Ok(FMSResponse<object>.Success(result));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting aggregated data for data source: {DataSource}", dataSource);
                return StatusCode(500, FMSResponse<object>.SystemError("An unexpected error occurred while retrieving aggregated data."));
            }
        }

        /// <summary>
        /// Get metadata for a specific data source
        /// </summary>
        /// <param name="dataSource">Data source identifier</param>
        /// <returns>Data source metadata</returns>
        [HttpGet("{dataSource}/metadata")]
        public ActionResult<FMSResponse<DataSourceMetadata>> GetDataSourceMetadata(string dataSource)
        {
            try
            {
                _logger.LogInformation("Getting metadata for data source: {DataSource}", dataSource);

                if (string.IsNullOrWhiteSpace(dataSource))
                {
                    var errorResponse = FMSResponse<DataSourceMetadata>.ValidationFailed(new List<string> { "Data source identifier is required" });
                    errorResponse.Message = "Data source identifier is required";
                    return BadRequest(errorResponse);
                }

                var metadata = _dataSourceManager.GetDataSourceMetadata(dataSource);

                return Ok(FMSResponse<DataSourceMetadata>.Success(metadata));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting metadata for data source: {DataSource}", dataSource);
                return StatusCode(500, FMSResponse<DataSourceMetadata>.SystemError("An unexpected error occurred while retrieving metadata."));
            }
        }

        /// <summary>
        /// Get all available data sources
        /// </summary>
        /// <returns>List of available data sources with metadata</returns>
        [HttpGet]
        public ActionResult<FMSResponse<DataSourceCatalogDto>> GetAvailableDataSources()
        {
            try
            {
                _logger.LogInformation("Getting all available data sources");

                var catalogItems = _dataSourceManager
                    .GetAllDataSources()
                    .Select(kvp =>
                    {
                        var metadata = kvp.Value ?? new DataSourceMetadata();
                        var category = string.IsNullOrWhiteSpace(metadata.Category) ?
                            WidgetTypeDefinitions.Categories.CUSTOM_ANALYTICS :
                            metadata.Category;

                        return new DataSourceCatalogItemDto(
                            kvp.Key,
                            string.IsNullOrWhiteSpace(metadata.DisplayName) ? kvp.Key : metadata.DisplayName,
                            category,
                            metadata
                        );
                    })
                    .OrderBy(item => item.Category)
                    .ThenBy(item => item.DisplayName)
                    .ToList();

                var payload = new DataSourceCatalogDto
                {
                    Items = catalogItems,
                    Count = catalogItems.Count
                };

                return Ok(FMSResponse<DataSourceCatalogDto>.Success(payload, "Data source catalog retrieved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available data sources");
                return StatusCode(500, FMSResponse<DataSourceCatalogDto>.SystemError("Failed to retrieve data source catalog."));
            }
        }

        // /// <summary>
        // /// Get initial data for a data source using query parameters (Legacy compatibility)
        // /// </summary>
        // /// <param name="sourceId">Data source identifier (e.g., 'fuel-dispense-metrics')</param>
        // /// <param name="mode">Data mode (live, cumulative)</param>
        // /// <param name="datePreset">Date preset (today, yesterday, etc.)</param>
        // /// <param name="intervalHours">Time interval in hours for time-series data</param>
        // /// <param name="siteIds">Optional comma-separated site IDs</param>
        // /// <param name="vehicleIds">Optional comma-separated vehicle IDs</param>
        // /// <returns>Initial data response</returns>
        // [Obsolete ("Deprecated legacy endpoint: Use SignalR DashboardHub or the typed initial endpoint.")]
        // [ApiExplorerSettings (IgnoreApi = true)]
        // [HttpGet ("initial-data")]
        // public async Task<ActionResult<FMSResponse<object>>> GetInitialDataByQuery (
        //     [FromQuery] string sourceId, [FromQuery] string mode = "cumulative", [FromQuery] string datePreset = "yesterday", [FromQuery] int? intervalHours = null, [FromQuery] string siteIds = null, [FromQuery] string vehicleIds = null) {
        //     try {
        //         Response.Headers["Deprecation"] = "true";
        //         Response.Headers["Sunset"] = "2025-12-31";
        //         _logger.LogInformation ("Getting initial data for source: {SourceId}, Mode: {Mode}, DatePreset: {DatePreset}, IntervalHours: {IntervalHours}",
        //             sourceId, mode, datePreset, intervalHours);

        //         if (string.IsNullOrWhiteSpace (sourceId)) {
        //             var errorResponse = FMSResponse<object>.ValidationFailed (new List<string> { "Source ID is required" });
        //             errorResponse.Message = "Source ID is required";
        //             return BadRequest (errorResponse);
        //         }

        //         var metricType = MapSourceIdToMetricType (sourceId);

        //         var request = new DashboardMetricRequestDto {
        //             MetricType = metricType,
        //             Mode = mode,
        //             DatePreset = datePreset,
        //             IntervalHours = intervalHours ?? GetDefaultIntervalHours (datePreset)
        //         };

        //         if (!string.IsNullOrEmpty (siteIds)) {
        //             var siteIdList = siteIds.Split (',', StringSplitOptions.RemoveEmptyEntries)
        //                 .Select (id => int.TryParse (id.Trim (), out var siteId) ? siteId : (int?) null)
        //                 .Where (id => id.HasValue)
        //                 .Select (id => id.Value)
        //                 .ToList ();
        //             request.SiteIds = siteIdList;
        //         }

        //         if (!string.IsNullOrEmpty (vehicleIds)) {
        //             var vehicleIdList = vehicleIds.Split (',', StringSplitOptions.RemoveEmptyEntries)
        //                 .Select (id => int.TryParse (id.Trim (), out var vehicleId) ? vehicleId : (int?) null)
        //                 .Where (id => id.HasValue)
        //                 .Select (id => id.Value)
        //                 .ToList ();
        //             request.VehicleIds = vehicleIdList;
        //         }

        //         var result = await _dataSourceManager.GetInitialDataAsync (metricType, request);

        //         if (TryExtractError (result, out var errorMessage)) {
        //             var errorResponse = FMSResponse<object>.Failed (errorMessage);
        //             errorResponse.Data = result;
        //             return BadRequest (errorResponse);
        //         }

        //         return Ok (FMSResponse<object>.Success (result));
        //     } catch (Exception ex) {
        //         _logger.LogError (ex, "Error getting initial data for source: {SourceId}", sourceId);
        //         return StatusCode (500, FMSResponse<object>.SystemError ("An unexpected error occurred while retrieving initial data."));
        //     }
        // }

        /// <summary>
        /// Map source ID to metric type for backward compatibility
        /// </summary>
        /// <param name="sourceId">Source identifier from frontend</param>
        /// <returns>Mapped metric type</returns>
        private string MapSourceIdToMetricType(string sourceId)
        {
            if (string.IsNullOrEmpty(sourceId)) return sourceId ?? string.Empty;

            return sourceId.ToLower() switch
            {
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
                _ => sourceId.Replace("-metrics", "").Replace("-", "_")
            };
        }

        /// <summary>
        /// Get default interval hours for a date preset
        /// </summary>
        /// <param name="datePreset">Date preset</param>
        /// <returns>Default interval in hours</returns>
        private int GetDefaultIntervalHours(string datePreset)
        {
            return datePreset?.ToLower() switch
            {
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
        [HttpGet("{dataSource}/aggregations")]
        public ActionResult<FMSResponse<List<string>>> GetSupportedAggregations(string dataSource)
        {
            try
            {
                _logger.LogInformation("Getting supported aggregations for data source: {DataSource}", dataSource);

                if (string.IsNullOrWhiteSpace(dataSource))
                {
                    var errorResponse = FMSResponse<List<string>>.ValidationFailed(new List<string> { "Data source identifier is required" });
                    errorResponse.Message = "Data source identifier is required";
                    return BadRequest(errorResponse);
                }

                var aggregations = _dataSourceManager.GetSupportedAggregations(dataSource);

                return Ok(FMSResponse<List<string>>.Success(aggregations));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting supported aggregations for data source: {DataSource}", dataSource);
                return StatusCode(500, FMSResponse<List<string>>.SystemError("An unexpected error occurred while retrieving supported aggregations."));
            }
        }

        /// <summary>
        /// Trigger data refresh for a specific data source (for testing/debugging)
        /// </summary>
        /// <param name="dataSource">Data source identifier</param>
        /// <returns>Refresh status</returns>
        [Obsolete("Deprecated: Use SignalR DashboardHub to receive pushed updates; do not call HTTP refresh.")]
        [ApiExplorerSettings(IgnoreApi = true)]
        [HttpPost("{dataSource}/refresh")]
        public async Task<ActionResult<FMSResponse<object>>> RefreshDataSource(string dataSource)
        {
            try
            {
                Response.Headers["Deprecation"] = "true";
                Response.Headers["Sunset"] = "2025-12-31";
                _logger.LogInformation("Manually refreshing data source: {DataSource}", dataSource);

                if (string.IsNullOrWhiteSpace(dataSource))
                {
                    var errorResponse = FMSResponse<object>.ValidationFailed(new List<string> { "Data source identifier is required" });
                    errorResponse.Message = "Data source identifier is required";
                    return BadRequest(errorResponse);
                }

                var request = new DashboardMetricRequestDto
                {
                    MetricType = dataSource,
                    Mode = "live",
                    DatePreset = "today"
                };

                var refreshedData = await _dataSourceManager.GetLiveDataAsync(dataSource, request);

                if (TryExtractError(refreshedData, out var errorMessage))
                {
                    var errorResponse = FMSResponse<object>.Failed(errorMessage);
                    errorResponse.Data = refreshedData;
                    return BadRequest(errorResponse);
                }

                await _dataSourceManager.BroadcastDataUpdateAsync(dataSource, refreshedData);

                var successPayload = new
                {
                    dataSource,
                    data = refreshedData,
                    timestamp = DateTime.UtcNow
                };

                var response = FMSResponse<object>.Success(successPayload, $"Data source '{dataSource}' refreshed successfully");
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing data source: {DataSource}", dataSource);
                return StatusCode(500, FMSResponse<object>.SystemError("An unexpected error occurred while refreshing the data source."));
            }
        }

        /// <summary>
        /// Health check endpoint for data source service
        /// </summary>
        /// <returns>Health status</returns>
        [HttpGet("health")]
        public ActionResult<FMSResponse<object>> GetHealthStatus()
        {
            try
            {
                _logger.LogInformation("Getting data source service health status");

                var healthData = new
                {
                    status = "healthy",
                    service = "DataSourceService",
                    phase = "Phase 2 - Streaming Data Service",
                    version = "2.0.0",
                    timestamp = DateTime.UtcNow,
                    capabilities = new
                    {
                        streamingSupported = true,
                        aggregationSupported = true,
                        liveDataSupported = true,
                        cacheEnabled = true
                    },
                    availableDataSources = _dataSourceManager
                    .GetAllDataSources()
                    .Select(kvp => kvp.Key)
                    .ToArray()
                };

                return Ok(FMSResponse<object>.Success(healthData));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting health status");
                var errorResponse = FMSResponse<object>.SystemError("An unexpected error occurred while retrieving health status.");
                errorResponse.Data = new
                {
                    timestamp = DateTime.UtcNow
                };
                return StatusCode(500, errorResponse);
            }
        }

        private static FMSResponse<object> CreateValidationErrorResponse(string message, IEnumerable<string> errors = null, object data = null)
        {
            var errorList = errors?.ToList() ?? new List<string> { message };
            var response = FMSResponse<object>.ValidationFailed(errorList);
            response.Message = message;
            if (data != null)
            {
                response.Data = data;
            }
            return response;
        }

        private static bool TryExtractError(object result, out string errorMessage)
        {
            errorMessage = null;

            if (result == null)
            {
                return false;
            }

            var errorProperty = result.GetType().GetProperty("error", BindingFlags.Instance | BindingFlags.Public | BindingFlags.IgnoreCase);
            if (errorProperty == null)
            {
                return false;
            }

            var value = errorProperty.GetValue(result);
            if (value is string stringValue && !string.IsNullOrWhiteSpace(stringValue))
            {
                errorMessage = stringValue;
                return true;
            }

            return false;
        }
    }
}