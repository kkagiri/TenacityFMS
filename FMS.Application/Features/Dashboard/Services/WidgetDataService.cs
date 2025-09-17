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
    public interface IWidgetDataService {
        Task<WidgetDataResponseDto> GetWidgetDataAsync (string userId, int widgetInstanceId);
        Task<List<WidgetDataResponseDto>> GetAllUserWidgetDataAsync (string userId);
        Task<WidgetDataResponseDto> RefreshWidgetDataAsync (string userId, int widgetInstanceId);
    }

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

                // Parse widget configuration
                var configuration = JsonConvert.DeserializeObject<Dictionary<string, object>> (
                        widgetInstance.ConfigurationJson);

                // Create metric request based on widget configuration
                var metricRequest = CreateMetricRequestFromConfiguration (widgetInstance.Template, configuration);

                // Get data from metrics service
                var metricResponse = await _metricsService.GetMetricAsync (metricRequest);

                // Transform response based on widget type
                var widgetData = await TransformMetricDataToWidgetData (
                    widgetInstance.Template.WidgetType,
                    metricResponse,
                    configuration);

                return new WidgetDataResponseDto {
                    WidgetInstanceId = widgetInstanceId,
                        WidgetType = widgetInstance.Template.WidgetType,
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
            DashboardWidgetTemplate template,
            Dictionary<string, object> configuration) {

            var request = new DashboardMetricRequestDto {
                MetricType = template.DataSource,
                Mode = configuration.GetValueOrDefault ("mode", "cumulative")?.ToString () ?? "cumulative",
                DatePreset = configuration.GetValueOrDefault ("datePreset", "yesterday")?.ToString () ?? "yesterday"
            };

            // Handle site filters
            if (configuration.TryGetValue ("siteIds", out var siteIdsObj) && siteIdsObj is List<object> siteIds) {
                request.SiteIds = siteIds.Select (s => Convert.ToInt32 (s)).ToList ();
            }

            //TODO:hadle vehicleType filter .

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