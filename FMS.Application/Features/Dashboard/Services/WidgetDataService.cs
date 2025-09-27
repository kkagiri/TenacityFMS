using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.Features.Dashboard;
using FMS.Domain.Entities.Dashboard;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace FMS.Application.Services.Dashboard {
    [Obsolete ("Use IDataSourceManager instead")]
    public interface IWidgetDataService {
        Task<WidgetDataResponseDto> GetWidgetDataAsync (string userId, int widgetInstanceId);
        Task<List<WidgetDataResponseDto>> GetAllUserWidgetDataAsync (string userId);
        Task<WidgetDataResponseDto> RefreshWidgetDataAsync (string userId, int widgetInstanceId);
    }

    [Obsolete ("Use IDataSourceManager instead")]

    public class WidgetDataService : IWidgetDataService {
        private readonly GpsdataContext _context;
        private readonly IDashboardMetricsService _metricsService;
        private readonly ILogger<WidgetDataService> _logger;

        public WidgetDataService (
            GpsdataContext context,
            IDashboardMetricsService metricsService,
            ILogger<WidgetDataService> logger) {
            _context = context;
            _metricsService = metricsService;
            _logger = logger;
        }

        public async Task<WidgetDataResponseDto> GetWidgetDataAsync (string userId, int widgetInstanceId) {
            try {
                // Get widget instance with template
                var widgetInstance = await _context.DashboardWidgetInstances
                    .Include (w => w.Template)
                    .FirstOrDefaultAsync (w => w.Id == widgetInstanceId && w.UserId == userId && w.IsVisible);

                if (widgetInstance == null) {
                    return new WidgetDataResponseDto {
                    WidgetInstanceId = widgetInstanceId,
                    WidgetType = "unknown",
                    ErrorMessage = "Widget instance not found or not visible",
                    LastUpdated = DateTime.UtcNow
                    };
                }

                // Parse widget configuration (tolerant parsing)
                Dictionary<string, object> configuration;
                try {
                    configuration = JsonConvert.DeserializeObject<Dictionary<string, object>> (
                        widgetInstance.ConfigurationJson) ?? new Dictionary<string, object> ();
                } catch {
                    configuration = new Dictionary<string, object> ();
                }

                // Determine widget type & data source (support custom widgets where TemplateId is null)
                var widgetType = widgetInstance.Template?.WidgetType ??
                    configuration.GetValueOrDefault ("widgetType", widgetInstance.WidgetType)?.ToString () ??
                    "unknown";

                var dataSource = widgetInstance.Template?.DataSource ??
                    configuration.GetValueOrDefault ("dataSource", null)?.ToString ();

                // If still null, attempt nested settings.dataSource
                if (dataSource == null && configuration.TryGetValue ("settings", out var settingsObj) && settingsObj is Newtonsoft.Json.Linq.JObject settingsJObj) {
                    dataSource = settingsJObj["dataSource"]?.ToString ();
                }

                if (dataSource == null && configuration.TryGetValue ("settings", out var settingsDictObj) && settingsDictObj is Dictionary<string, object> settingsDict && settingsDict.TryGetValue ("dataSource", out var dsVal)) {
                    dataSource = dsVal?.ToString ();
                }

                if (string.IsNullOrWhiteSpace (dataSource)) {
                    // Without a datasource we cannot proceed; return graceful error
                    return new WidgetDataResponseDto {
                        WidgetInstanceId = widgetInstanceId,
                            WidgetType = widgetType,
                            ErrorMessage = "Widget data source not defined",
                            LastUpdated = DateTime.UtcNow
                    };
                }

                // Build metric request (template may be null)
                var metricRequest = CreateMetricRequestFromConfiguration (widgetInstance.Template, configuration, dataSource);

                // Get data from metrics service (guard exceptions)
                DashboardMetricResponseDto metricResponse;
                try {
                    metricResponse = await _metricsService.GetMetricAsync (metricRequest);
                } catch (Exception exMetric) {
                    _logger.LogError (exMetric, "Metric service failed for widget {WidgetId}", widgetInstanceId);
                    return new WidgetDataResponseDto {
                        WidgetInstanceId = widgetInstanceId,
                            WidgetType = widgetType,
                            ErrorMessage = "Metric retrieval failed",
                            LastUpdated = DateTime.UtcNow
                    };
                }

                // Transform response based on widget type
                var widgetData = await TransformMetricDataToWidgetData (
                    widgetType,
                    metricResponse,
                    configuration);

                return new WidgetDataResponseDto {
                    WidgetInstanceId = widgetInstanceId,
                        WidgetType = widgetType,
                        Data = widgetData,
                        LastUpdated = DateTime.UtcNow
                };
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting widget data for user {UserId}, widget {WidgetId}",
                    userId, widgetInstanceId);

                return new WidgetDataResponseDto {
                    WidgetInstanceId = widgetInstanceId,
                        WidgetType = "unknown",
                        ErrorMessage = "Error retrieving widget data",
                        LastUpdated = DateTime.UtcNow
                };
            }
        }

        public async Task<List<WidgetDataResponseDto>> GetAllUserWidgetDataAsync (string userId) {
            try {
                var widgetInstances = await _context.DashboardWidgetInstances
                    .Include (w => w.Template)
                    .Where (w => w.UserId == userId && w.IsVisible)
                    .ToListAsync ();

                var results = new List<WidgetDataResponseDto> ();

                foreach (var widgetInstance in widgetInstances) {
                    var result = await GetWidgetDataAsync (userId, widgetInstance.Id);
                    results.Add (result);
                }

                return results;
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting all widget data for user {UserId}", userId);
                return new List<WidgetDataResponseDto> ();
            }
        }

        public async Task<WidgetDataResponseDto> RefreshWidgetDataAsync (string userId, int widgetInstanceId) {
            // For now, just return fresh data (could implement caching later)
            return await GetWidgetDataAsync (userId, widgetInstanceId);
        }

        private DashboardMetricRequestDto CreateMetricRequestFromConfiguration (
            DashboardWidgetTemplate? template,
            Dictionary<string, object> configuration,
            string explicitDataSource) {

            string metricType = template?.DataSource ?? explicitDataSource;
            if (string.IsNullOrWhiteSpace (metricType)) metricType = "unknown";

            var request = new DashboardMetricRequestDto {
                MetricType = metricType,
                Mode = configuration.GetValueOrDefault ("mode", "cumulative")?.ToString () ?? "cumulative",
                DatePreset = configuration.GetValueOrDefault ("datePreset", "yesterday")?.ToString () ?? "yesterday"
            };

            // Handle site filters
            if (configuration.TryGetValue ("siteIds", out var siteIdsObj) && siteIdsObj is List<object> siteIds) {
                request.SiteIds = siteIds.Select (s => Convert.ToInt32 (s)).ToList ();
            }

            // TODO: handle vehicleType filter (currently not implemented)

            // Handle vehicle filters
            if (configuration.TryGetValue ("vehicleIds", out var vehicleIdsObj) && vehicleIdsObj is List<object> vehicleIds) {
                request.VehicleIds = vehicleIds.Select (v => Convert.ToInt32 (v)).ToList ();
            }

            // Handle custom date range
            if (configuration.TryGetValue ("startDate", out var startDateObj) && startDateObj is DateTime startDate) {
                request.StartDate = startDate;
            }
            if (configuration.TryGetValue ("endDate", out var endDateObj) && endDateObj is DateTime endDate) {
                request.EndDate = endDate;
            }

            return request;
        }

        private async Task<object> TransformMetricDataToWidgetData (
            string widgetType,
            DashboardMetricResponseDto metricResponse,
            Dictionary<string, object> configuration) {

            switch (widgetType.ToLower ()) {
                case "ticker":
                    return new {
                        value = metricResponse.Value,
                            unit = metricResponse.Unit,
                            change = CalculateChange (metricResponse),
                            trend = DetermineTrend (metricResponse),
                            lastUpdated = metricResponse.LastUpdated
                    };

                case "graph":
                case "chart":
                    return new {
                        value = metricResponse.Value,
                            unit = metricResponse.Unit,
                            chartType = configuration.GetValueOrDefault ("chartType", "line")?.ToString () ?? "line",
                            timeSeries = await GetTimeSeriesData (metricResponse, configuration),
                            lastUpdated = metricResponse.LastUpdated
                    };

                case "gauge":
                    return new {
                        value = metricResponse.Value,
                            unit = metricResponse.Unit,
                            min = configuration.GetValueOrDefault ("min", 0),
                            max = configuration.GetValueOrDefault ("max", 100),
                            thresholds = configuration.GetValueOrDefault ("thresholds", new List<object> ()),
                            lastUpdated = metricResponse.LastUpdated
                    };

                case "table":
                    return new {
                        data = await GetTableData (metricResponse, configuration),
                            columns = configuration.GetValueOrDefault ("columns", new List<string> ()),
                            lastUpdated = metricResponse.LastUpdated
                    };

                default:
                    return new {
                        value = metricResponse.Value,
                            unit = metricResponse.Unit,
                            rawData = metricResponse,
                            lastUpdated = metricResponse.LastUpdated
                    };
            }
        }

        private object CalculateChange (DashboardMetricResponseDto response) {
            // This would typically compare with previous period
            // For now, return a placeholder
            return new {
                value = 0,
                    percentage = 0,
                    direction = "stable"
            };
        }

        private string DetermineTrend (DashboardMetricResponseDto response) {
            // Simple trend determination logic
            return "stable";
        }

        private async Task<object> GetTimeSeriesData (DashboardMetricResponseDto response, Dictionary<string, object> config) {
            // This would fetch time series data for charts
            // For now, return current value as single point
            return new [] {
                new {
                    timestamp = response.LastUpdated,
                        value = response.Value
                }
            };
        }

        private async Task<object> GetTableData (DashboardMetricResponseDto response, Dictionary<string, object> config) {
            // This would fetch tabular data
            // For now, return basic structure
            return new [] {
                new {
                    metric = response.MetricType,
                        value = response.Value,
                        unit = response.Unit,
                        dateRange = response.DateRange
                }
            };
        }
    }
}