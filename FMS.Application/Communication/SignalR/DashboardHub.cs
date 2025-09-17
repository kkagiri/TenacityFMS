using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using FMS.Application.Features.Dashboard;
using FMS.Application.Services.Dashboard;
using FMS.Domain.Entities.Dashboard;
using FMS.Persistence.DataAccess;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace FMS.Application.Communication.SignalR {
    public class DashboardHub : Hub {
        private readonly IDataSourceManager _dataSourceManager;

        private readonly IDashboardMetricsService _metricsService;
        private readonly IWidgetDataService _widgetDataService;
        private readonly GpsdataContext _context;
        private readonly ILogger<DashboardHub> _logger;

        private string CurrentUserId {
            get {
                try {
                    // Enhanced debugging for JWT claims
                    _logger.LogDebug ("Authentication Debug - IsAuthenticated: {IsAuthenticated}, User: {User}, Claims Count: {ClaimsCount}",
                        Context.User?.Identity?.IsAuthenticated ?? false,
                        Context.User?.Identity?.Name ?? "null",
                        Context.User?.Claims?.Count () ?? 0);

                    // Log all available claims for debugging
                    if (Context.User?.Claims != null) {
                        foreach (var claim in Context.User.Claims) {
                            _logger.LogDebug ("Available Claim - Type: {Type}, Value: {Value}", claim.Type, claim.Value);
                        }
                    }

                    // Check if user is authenticated first
                    if (Context.User?.Identity?.IsAuthenticated != true) {
                        _logger.LogWarning ("User is not authenticated in SignalR context");
                        return "system";
                    }

                    // Try multiple claim types for user ID - be more flexible with standard claims
                    var userIdClaims = Context.User.Claims.Where (c =>
                        c.Type == ClaimTypes.NameIdentifier ||
                        c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" ||
                        c.Type == "sub" ||
                        c.Type == "userId" ||
                        c.Type == "id").ToList ();

                    // Log found user ID claims
                    foreach (var claim in userIdClaims) {
                        _logger.LogDebug ("Found User ID Claim - Type: {Type}, Value: {Value}", claim.Type, claim.Value);
                    }

                    // Try to find a valid GUID among user ID claims
                    foreach (var claim in userIdClaims) {
                        if (Guid.TryParse (claim.Value, out Guid guidValue)) {
                            _logger.LogInformation ("Using User ID from claim {Type}: {UserId}", claim.Type, claim.Value);
                            return claim.Value;
                        }
                    }

                    // Fallback: try any claim that looks like a GUID
                    var anyGuidClaim = Context.User.Claims.FirstOrDefault (c => Guid.TryParse (c.Value, out _));
                    if (anyGuidClaim != null) {
                        _logger.LogWarning ("Using fallback GUID claim - Type: {Type}, Value: {Value}", anyGuidClaim.Type, anyGuidClaim.Value);
                        return anyGuidClaim.Value;
                    }

                    // If no valid user ID found, log warning and return system fallback
                    _logger.LogWarning ("No valid GUID user ID found in JWT claims. Available claims: {Claims}",
                        string.Join (", ", Context.User.Claims.Select (c => $"{c.Type}={c.Value}")));

                    return "system"; // Fallback when no valid user ID is found
                } catch (Exception ex) {
                    _logger.LogError (ex, "Error extracting user ID from JWT claims");
                    return "system"; // Fallback on error
                }
            }
        }

        public DashboardHub (
            IDashboardMetricsService metricsService,
            IDataSourceManager dataSourceManager,
            IWidgetDataService widgetDataService,
            GpsdataContext context,
            ILogger<DashboardHub> logger) {
            _metricsService = metricsService;
            _dataSourceManager = dataSourceManager;
            _widgetDataService = widgetDataService;
            _context = context;
            _logger = logger;
        }

        // Dashboard-specific methods
        public async Task BroadcastKeyStatisticsUpdate (object statisticsData) {
            try {
                await Clients.All.SendAsync ("KeyStatisticsUpdate", new {
                    timestamp = DateTime.UtcNow,
                        statistics = statisticsData
                });
                _logger.LogDebug ("Broadcasted key statistics update");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error broadcasting key statistics update");
            }
        }

        public async Task BroadcastWidgetDataUpdate (int widgetId, string widgetType, object data) {
            try {
                await Clients.All.SendAsync ("WidgetDataUpdate", new {
                    widgetId,
                    widgetType,
                    data,
                    timestamp = DateTime.UtcNow
                });
                _logger.LogDebug ("Broadcasted widget data update for {WidgetId}", widgetId);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error broadcasting widget data update");
            }
        }

        public async Task BroadcastTickerUpdate (string metricType, decimal value, string unit, DateTime timestamp) {
            try {
                await Clients.All.SendAsync ("TickerUpdate", new {
                    metricType,
                    value,
                    unit,
                    timestamp,
                    formattedValue = FormatTickerValue (value, unit)
                });
                _logger.LogDebug ("Broadcasted ticker update for {MetricType}", metricType);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error broadcasting ticker update");
            }
        }

        public async Task BroadcastGraphUpdate (string graphId, string graphType, object dataPoints) {
            try {
                await Clients.All.SendAsync ("GraphUpdate", new {
                    graphId,
                    graphType,
                    dataPoints,
                    timestamp = DateTime.UtcNow
                });
                _logger.LogDebug ("Broadcasted graph update for {GraphId}", graphId);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error broadcasting graph update");
            }
        }

        public async Task BroadcastDashboardLayoutUpdate (string userId, object layoutData) {
            try {
                await Clients.All.SendAsync ("DashboardLayoutUpdate", new {
                    userId,
                    layoutData,
                    timestamp = DateTime.UtcNow
                });
                _logger.LogDebug ("Broadcasted dashboard layout update");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error broadcasting dashboard layout update");
            }
        }

        // Client methods for subscription management
        public async Task SubscribeToWidgetUpdates (int widgetId) {
            try {
                await Groups.AddToGroupAsync (Context.ConnectionId, $"widget_{widgetId}");
                _logger.LogDebug ("Client {ConnectionId} subscribed to widget {WidgetId}", Context.ConnectionId, widgetId);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error subscribing to widget updates");
            }
        }

        public async Task UnsubscribeFromWidgetUpdates (int widgetId) {
            try {
                await Groups.RemoveFromGroupAsync (Context.ConnectionId, $"widget_{widgetId}");
                _logger.LogDebug ("Client {ConnectionId} unsubscribed from widget {WidgetId}", Context.ConnectionId, widgetId);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error unsubscribing from widget updates");
            }
        }

        public async Task SubscribeToMetricUpdates (string metricType) {
            try {
                await Groups.AddToGroupAsync (Context.ConnectionId, $"metric_{metricType}");
                _logger.LogDebug ("Client {ConnectionId} subscribed to metric {MetricType}", Context.ConnectionId, metricType);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error subscribing to metric updates");
            }
        }

        public async Task UnsubscribeFromMetricUpdates (string metricType) {
            try {
                await Groups.RemoveFromGroupAsync (Context.ConnectionId, $"metric_{metricType}");
                _logger.LogDebug ("Client {ConnectionId} unsubscribed from metric {MetricType}", Context.ConnectionId, metricType);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error unsubscribing from metric updates");
            }
        }

        // ========================================
        // PHASE 2: STREAMING DATA SUBSCRIPTIONS
        // ========================================

        /// <summary>
        /// Subscribe to data source updates for streaming
        /// </summary>
        /// <param name="dataSource">Data source identifier</param>
        public async Task SubscribeToDataSource (string dataSource) {
            try {
                await Groups.AddToGroupAsync (Context.ConnectionId, $"datasource_{dataSource}");
                _logger.LogDebug ("Client {ConnectionId} subscribed to data source {DataSource}", Context.ConnectionId, dataSource);

                // Send initial data
                await RequestDataSourceData (dataSource);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error subscribing to data source updates for {DataSource}", dataSource);
            }
        }

        /// <summary>
        /// Unsubscribe from data source updates
        /// </summary>
        /// <param name="dataSource">Data source identifier</param>
        public async Task UnsubscribeFromDataSource (string dataSource) {
            try {
                await Groups.RemoveFromGroupAsync (Context.ConnectionId, $"datasource_{dataSource}");
                _logger.LogDebug ("Client {ConnectionId} unsubscribed from data source {DataSource}", Context.ConnectionId, dataSource);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error unsubscribing from data source updates for {DataSource}", dataSource);
            }
        }

        /// <summary>
        /// Subscribe to multiple data sources at once
        /// </summary>
        /// <param name="dataSources">Array of data source identifiers</param>
        public async Task SubscribeToMultipleDataSources (string[] dataSources) {
            try {
                _logger.LogInformation ("Client {ConnectionId} subscribing to {Count} data sources", Context.ConnectionId, dataSources.Length);

                foreach (var dataSource in dataSources) {
                    await Groups.AddToGroupAsync (Context.ConnectionId, $"datasource_{dataSource}");
                }

                _logger.LogDebug ("Client {ConnectionId} subscribed to data sources: {DataSources}", Context.ConnectionId, string.Join (", ", dataSources));
            } catch (Exception ex) {
                _logger.LogError (ex, "Error subscribing to multiple data sources");
            }
        }

        /// <summary>
        /// Enhanced widget streaming subscription with configuration (supports any widget type in live mode)
        /// </summary>
        /// <param name="widgetInstanceId">Widget instance ID</param>
        /// <param name="streamingOptions">Streaming configuration options</param>
        public async Task SubscribeToEnhancedWidgetStreaming (int widgetInstanceId, object streamingOptions = null) {
            try {
                // Get current user ID using our enhanced authentication
                string userId = CurrentUserId;

                _logger.LogInformation ("Enhanced widget streaming subscription for widget {WidgetId}, UserId: {UserId}",
                    widgetInstanceId, userId);

                // Get widget instance with proper authentication
                DashboardWidgetInstance? widgetInstance;

                if (userId == "system") {
                    // If we're still getting "system" as user ID, it means authentication isn't working yet
                    _logger.LogWarning ("Using system fallback for widget subscription - authentication issue");
                    widgetInstance = await _context.DashboardWidgetInstances
                        .Include (w => w.Template)
                        .FirstOrDefaultAsync (w => w.Id == widgetInstanceId && w.IsVisible);
                } else {
                    // Proper authenticated query
                    widgetInstance = await _context.DashboardWidgetInstances
                        .Include (w => w.Template)
                        .FirstOrDefaultAsync (w => w.Id == widgetInstanceId && w.UserId == userId && w.IsVisible);
                }

                if (widgetInstance == null) {
                    await Clients.Caller.SendAsync ("EnhancedWidgetStreamingError", new {
                        widgetInstanceId,
                        error = "Widget instance not found or not visible",
                        timestamp = DateTime.UtcNow
                    });
                    return;
                }

                // Parse widget configuration to check if it's in live mode
                var configuration = new Dictionary<string, object> ();
                try {
                    if (!string.IsNullOrEmpty (widgetInstance.ConfigurationJson)) {
                        configuration = JsonConvert.DeserializeObject<Dictionary<string, object>> (
                            widgetInstance.ConfigurationJson) ?? new Dictionary<string, object> ();
                    }
                } catch (Exception ex) {
                    _logger.LogWarning (ex, "Failed to parse widget configuration for streaming");
                }

                // Check if widget is in live mode
                string mode = GetConfigValue<string> (configuration, "mode", "cumulative");
                if (mode?.ToLower () != "live") {
                    _logger.LogInformation ("Widget {WidgetId} is not in live mode ({Mode}), skipping streaming subscription",
                        widgetInstanceId, mode);
                    return;
                }

                // Subscribe to the widget updates group for incremental updates
                await Groups.AddToGroupAsync (Context.ConnectionId, $"enhanced_widget_{widgetInstanceId}");

                // Also subscribe to the data source group for this widget
                string? dataSource = widgetInstance.DataSource ?? widgetInstance.Template?.DataSource;
                if (!string.IsNullOrEmpty (dataSource)) {
                    await Groups.AddToGroupAsync (Context.ConnectionId, $"datasource_{dataSource}");
                }

                string widgetType = widgetInstance.WidgetType ?? widgetInstance.Template?.WidgetType ?? "unknown";

                _logger.LogInformation ("Client {ConnectionId} subscribed to enhanced streaming for widget {WidgetId} ({WidgetType}, {Mode})",
                    Context.ConnectionId, widgetInstanceId, widgetType, mode);

                // Parse streaming options
                var options = streamingOptions != null ?
                    JsonConvert.DeserializeObject<Dictionary<string, object>> (
                        JsonConvert.SerializeObject (streamingOptions)) ?? new Dictionary<string, object> () :
                    new Dictionary<string, object> ();

                // Notify background service about this streaming subscription
                // This would typically be stored in a cache or database for the background service to use
                var streamingConfig = new {
                    WidgetInstanceId = widgetInstanceId,
                    ConnectionId = Context.ConnectionId,
                    WidgetType = widgetType,
                    DataSource = dataSource,
                    Mode = mode,
                    UpdateInterval = GetConfigValue<int> (options, "updateInterval", 30000),
                    IncrementalOnly = GetConfigValue<bool> (options, "incrementalOnly", true),
                    LastUpdate = DateTime.UtcNow
                };

                _logger.LogDebug ("Streaming configuration for widget {WidgetId}: {@Config}",
                    widgetInstanceId, streamingConfig);

            } catch (Exception ex) {
                _logger.LogError (ex, "Error subscribing to enhanced widget streaming for widget {WidgetId}", widgetInstanceId);

                await Clients.Caller.SendAsync ("EnhancedWidgetStreamingError", new {
                    widgetInstanceId,
                    error = "Error setting up enhanced widget streaming",
                    timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Unsubscribe from enhanced widget streaming
        /// </summary>
        /// <param name="widgetInstanceId">Widget instance ID</param>
        public async Task UnsubscribeFromEnhancedWidgetStreaming (int widgetInstanceId) {
            try {
                await Groups.RemoveFromGroupAsync (Context.ConnectionId, $"enhanced_widget_{widgetInstanceId}");
                _logger.LogDebug ("Client {ConnectionId} unsubscribed from enhanced widget streaming for widget {WidgetId}", Context.ConnectionId, widgetInstanceId);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error unsubscribing from enhanced widget streaming for widget {WidgetId}", widgetInstanceId);
            }
        }

        /// <summary>
        /// Broadcast data source update to all subscribers
        /// </summary>
        /// <param name="dataSource">Data source identifier</param>
        /// <param name="data">Updated data</param>
        public async Task BroadcastDataSourceUpdate (string dataSource, object data) {
            try {
                var updateData = new {
                    dataSource,
                    data,
                    metadata = _dataSourceManager.GetDataSourceMetadata (dataSource),
                    timestamp = DateTime.UtcNow
                };

                // Broadcast to data source subscribers
                await Clients.Group ($"datasource_{dataSource}").SendAsync ("DataSourceUpdate", updateData);

                // Also broadcast as metric update for backward compatibility
                await Clients.Group ($"metric_{dataSource}").SendAsync ("MetricDataUpdate", updateData);

                _logger.LogDebug ("Broadcasted data source update for {DataSource}", dataSource);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error broadcasting data source update for {DataSource}", dataSource);
            }
        }

        /// <summary>
        /// Broadcast enhanced widget data update
        /// </summary>
        /// <param name="widgetInstanceId">Widget instance ID</param>
        /// <param name="data">Updated widget data</param>
        public async Task BroadcastEnhancedWidgetUpdate (int widgetInstanceId, object data) {
            try {
                var updateData = new {
                    widgetInstanceId,
                    data,
                    timestamp = DateTime.UtcNow,
                    updateType = "enhanced_streaming"
                };

                await Clients.Group ($"enhanced_widget_{widgetInstanceId}").SendAsync ("EnhancedWidgetDataUpdate", updateData);
                _logger.LogDebug ("Broadcasted enhanced widget update for widget {WidgetId}", widgetInstanceId);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error broadcasting enhanced widget update for widget {WidgetId}", widgetInstanceId);
            }
        }

        // Enhanced request methods using DataSourceManager
        public async Task RequestWidgetData (object requestData) {
            int widgetInstanceId = 0; // Initialize to default value
            try {
                // Get current user ID using our enhanced authentication
                string userId = CurrentUserId;

                _logger.LogInformation ("RequestWidgetData called - ConnectionId: {ConnectionId}, UserId: {UserId}, RequestData: {RequestData}, RequestDataType: {RequestDataType}",
                    Context.ConnectionId, userId, requestData, requestData?.GetType ()?.Name);

                // Parse the request data using consolidated method
                var (parsedWidgetId, frontendConfiguration, error) = ParseWidgetDataRequest (requestData);

                if (!string.IsNullOrEmpty (error)) {
                    await Clients.Caller.SendAsync ("WidgetDataUpdate", new {
                        error = error,
                            timestamp = DateTime.UtcNow
                    });
                    return;
                }

                widgetInstanceId = parsedWidgetId;

                _logger.LogInformation ("Requesting widget data for widget {WidgetId}", widgetInstanceId);

                // Get widget instance with template - using consolidated method
                var widgetInstance = await GetWidgetInstanceAsync (widgetInstanceId, userId, nameof (RequestWidgetData));

                if (widgetInstance == null) {
                    await Clients.Caller.SendAsync ("WidgetDataUpdate", new {
                        widgetId = widgetInstanceId,
                            error = "Widget instance not found or not visible",
                            timestamp = DateTime.UtcNow
                    });
                    return;
                }

                // Parse widget configuration using consolidated method
                var configuration = ParseWidgetConfiguration (widgetInstance.ConfigurationJson, frontendConfiguration);

                // Helper function to get config value with nested path support
                var getConfigValue = new Func<string[], string, object> ((paths, defaultValue) => {
                        foreach (var path in paths) {
                            if (path.Contains ('.')) {
                                // Handle nested paths like "settings.datePreset"
                                var keys = path.Split ('.');
                                object current = configuration;
                                foreach (var key in keys) {
                                    if (current is Dictionary<string, object> dict && dict.TryGetValue (key, out var value)) {
                                        current = value;
                                    } else {
                                        current = null;
                                        break;
                                    }
                                }
                                if (current != null) {
                                    return current.ToString ();
                                }
                            } else {
                                // Handle direct key
                                if (configuration.TryGetValue (path, out var value)) {
                                    return value?.ToString ();
                                }
                            }
                        }
                        return defaultValue;
                    });

                // Create metric request with enhanced configuration parsing
                // For custom widgets, use DataSource directly; for template widgets, use Template.DataSource
                string dataSource = widgetInstance.DataSource ?? widgetInstance.Template?.DataSource;

                if (string.IsNullOrEmpty (dataSource)) {
                    _logger.LogError ("No data source found for widget {WidgetId}", widgetInstanceId);
                    await Clients.Caller.SendAsync ("WidgetDataUpdate", new {
                        widgetId = widgetInstanceId,
                            error = "Widget data source not configured",
                            timestamp = DateTime.UtcNow
                    });
                    return;
                }

                DashboardMetricRequestDto metricRequest = new () {
                    MetricType = dataSource,
                    Mode = (string) getConfigValue (["mode", "settings.mode"], "cumulative"),
                    DatePreset = (string) getConfigValue (["datePreset", "settings.datePreset"], "yesterday"),
                    SiteIds = GetConfigValue<List<int> ?> (configuration, "siteIds", null),
                    VehicleIds = GetConfigValue<List<int> ?> (configuration, "vehicleIds", null),
                    VehicleType = GetConfigValue<List<int> ?> (configuration, "vehicleTypeIds", null),
                    IntervalHours = GetConfigValue<int?> (configuration, "intervalHours", null)
                };

                _logger.LogInformation ("Processing widget {WidgetId} with mode: {Mode}, datePreset: {DatePreset}",
                    widgetInstanceId, metricRequest.Mode, metricRequest.DatePreset);

                // Determine if this is a live data request
                bool isLiveMode = metricRequest.Mode?.ToLower () == "live";

                // Get widget type for data transformation - ensure it's not null
                string widgetType = widgetInstance.WidgetType ?? widgetInstance.Template?.WidgetType ?? "unknown";
                string category = widgetInstance.Category ?? widgetInstance.Template?.Category ?? "general";

                _logger.LogInformation ("Processing widget {WidgetId}: Type='{WidgetType}', DataSource='{DataSource}', Mode='{Mode}', DatePreset='{DatePreset}'",
                    widgetInstanceId, widgetType, dataSource, metricRequest.Mode, metricRequest.DatePreset);

                object widgetData;
                if (isLiveMode && _dataSourceManager.IsLiveDataSource (dataSource)) {
                    // Get live data
                    _logger.LogDebug ("Getting live data for widget {WidgetId}", widgetInstanceId);
                    object liveData = await _dataSourceManager.GetLiveDataAsync (dataSource, metricRequest);
                    widgetData = await _dataSourceManager.TransformDataForWidgetType (
                        widgetType, liveData, configuration);
                } else {
                    // Get initial/historical data
                    _logger.LogDebug ("Getting initial/historical data for widget {WidgetId}", widgetInstanceId);
                    object initialData = await _dataSourceManager.GetInitialDataAsync (dataSource, metricRequest);
                    _logger.LogDebug ("Initial data retrieved for widget {WidgetId}: {DataType}",
                        widgetInstanceId, initialData?.GetType ()?.Name ?? "null");
                    widgetData = await _dataSourceManager.TransformDataForWidgetType (
                        widgetType, initialData, configuration);
                    _logger.LogDebug ("Data transformed for widget {WidgetId}: {DataType}",
                        widgetInstanceId, widgetData?.GetType ()?.Name ?? "null");
                }

                // Transform data for frontend compatibility if needed
                if (widgetData != null && IsChartWidget (widgetType)) {
                    widgetData = TransformDataForFrontendWidget (widgetData, widgetType);
                }

                // Send the widget data back to the client
                await Clients.Caller.SendAsync ("WidgetDataUpdate", new {
                    widgetId = widgetInstanceId,
                        widgetType = widgetType,
                        widgetCategory = category,
                        dataSource = dataSource,
                        data = widgetData,
                        isLiveData = isLiveMode,
                        metadata = _dataSourceManager.GetDataSourceMetadata (dataSource),
                        timestamp = DateTime.UtcNow
                });

                _logger.LogDebug ("Sent widget data to client {ConnectionId} for widget {WidgetId}", Context.ConnectionId, widgetInstanceId);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error sending widget data to client for widget {WidgetId}", widgetInstanceId);

                await Clients.Caller.SendAsync ("WidgetDataUpdate", new {
                    widgetId = widgetInstanceId,
                        error = "Error retrieving widget data",
                        timestamp = DateTime.UtcNow
                });
            }
        }

        public async Task RequestDataSourceData (string dataSource, object requestParams = null) {
            try {
                _logger.LogInformation ("Requesting data source data for {DataSource}", dataSource);

                // Parse request parameters
                var metricRequest = new DashboardMetricRequestDto {
                    MetricType = dataSource,
                    Mode = "live", // Default to live for direct data source requests
                    DatePreset = "today"
                };

                if (requestParams != null) {
                    var paramDict = JsonConvert.DeserializeObject<Dictionary<string, object>> (
                            JsonConvert.SerializeObject (requestParams)) ?? new Dictionary<string, object> ();

                    metricRequest.Mode = GetConfigValue<string> (paramDict, "mode", "live");
                    metricRequest.DatePreset = GetConfigValue<string> (paramDict, "datePreset", "today");
                    metricRequest.SiteIds = GetConfigValue<List<int> ?> (paramDict, "siteIds", null);
                    metricRequest.VehicleIds = GetConfigValue<List<int> ?> (paramDict, "vehicleIds", null);
                    metricRequest.VehicleType = GetConfigValue<List<int> ?> (paramDict, "vehicleTypeIds", null);
                    metricRequest.IntervalHours = GetConfigValue<int?> (paramDict, "intervalHours", null);
                }

                // Get the data
                var data = await _dataSourceManager.GetLiveDataAsync (dataSource, metricRequest);

                // Send to caller
                await Clients.Caller.SendAsync ("DataSourceUpdate", new {
                    dataSource = dataSource,
                        data = data,
                        metadata = _dataSourceManager.GetDataSourceMetadata (dataSource),
                        timestamp = DateTime.UtcNow
                });

                _logger.LogDebug ("Sent data source data to client {ConnectionId} for {DataSource}", Context.ConnectionId, dataSource);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error sending data source data for {DataSource}", dataSource);

                await Clients.Caller.SendAsync ("DataSourceUpdate", new {
                    dataSource = dataSource,
                        error = "Error retrieving data source data",
                        timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Send incremental widget data update (for streaming chart data)
        /// </summary>
        /// <param name="widgetInstanceId">Widget instance ID</param>
        /// <param name="incrementalData">New data points to append</param>
        public async Task SendIncrementalWidgetUpdate (int widgetInstanceId, object incrementalData) {
            try {
                await Clients.All.SendAsync ("WidgetDataUpdate", new {
                    widgetId = widgetInstanceId,
                        data = incrementalData,
                        timestamp = DateTime.UtcNow,
                        updateType = "incremental" // Flag to indicate this is incremental data
                });

                _logger.LogDebug ("Sent incremental widget update for widget {WidgetId}", widgetInstanceId);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error sending incremental widget update for widget {WidgetId}", widgetInstanceId);
            }
        }

        public async Task GetInitialWidgetData (int widgetInstanceId) {
            try {
                // Get current user ID using our enhanced authentication
                string userId = CurrentUserId;

                _logger.LogInformation ("GetInitialWidgetData for widget {WidgetId}, UserId: {UserId}",
                    widgetInstanceId, userId);

                // Get widget instance using consolidated method
                var widgetInstance = await GetWidgetInstanceAsync (widgetInstanceId, userId, nameof (GetInitialWidgetData));

                if (widgetInstance == null) {
                    await Clients.Caller.SendAsync ("InitialWidgetDataResponse", new {
                        widgetInstanceId = widgetInstanceId,
                            error = "Widget instance not found or not visible",
                            timestamp = DateTime.UtcNow
                    });
                    return;
                }

                // Parse widget configuration using consolidated method
                var configuration = ParseWidgetConfiguration (widgetInstance.ConfigurationJson, null);

                // Get widget type and data source
                string widgetType = widgetInstance.WidgetType ?? widgetInstance.Template?.WidgetType ?? "unknown";
                string? dataSource = widgetInstance.DataSource ?? widgetInstance.Template?.DataSource;

                if (string.IsNullOrEmpty (dataSource)) {
                    await Clients.Caller.SendAsync ("InitialWidgetDataResponse", new {
                        widgetInstanceId = widgetInstanceId,
                            error = "Widget data source not configured",
                            timestamp = DateTime.UtcNow
                    });
                    return;
                }

                // Create metric request for INITIAL/HISTORICAL data (not live)
                var metricRequest = new DashboardMetricRequestDto {
                    MetricType = dataSource,
                    Mode = "cumulative", // Force historical mode for initial data
                    DatePreset = GetConfigValue<string> (configuration, "datePreset", "yesterday"),
                    SiteIds = GetConfigValue<List<int> ?> (configuration, "siteIds", null),
                    VehicleIds = GetConfigValue<List<int> ?> (configuration, "vehicleIds", null),
                    VehicleType = GetConfigValue<List<int> ?> (configuration, "vehicleTypeIds", null),
                    IntervalHours = GetConfigValue<int?> (configuration, "intervalHours", null)
                };

                _logger.LogDebug ("Initial data request for widget {WidgetId}: {MetricType}, {DatePreset}",
                    widgetInstanceId, metricRequest.MetricType, metricRequest.DatePreset);

                // Get initial/historical data (never live data for initial load)
                object initialData = await _dataSourceManager.GetInitialDataAsync (dataSource, metricRequest);
                object transformedData = await _dataSourceManager.TransformDataForWidgetType (
                    widgetType, initialData, configuration);

                // Transform data for frontend compatibility if it's a chart widget
                if (transformedData != null && IsChartWidget (widgetType)) {
                    transformedData = TransformDataForFrontendWidget (transformedData, widgetType);

                    try {
                        var dynamicData = (dynamic) transformedData;
                        var dataPointCount = dynamicData?.chartData?.Count ?? 0;
                        Microsoft.Extensions.Logging.LoggerExtensions.LogDebug (_logger, "Initial chart data for widget {WidgetId}: {DataPointCount} points",
                            widgetInstanceId, dataPointCount);
                    } catch {
                        _logger.LogDebug ("Initial chart data loaded for widget {WidgetId}", widgetInstanceId);
                    }
                }

                await Clients.Caller.SendAsync ("InitialWidgetDataResponse", new {
                    widgetInstanceId = widgetInstanceId,
                        data = transformedData,
                        metadata = new {
                            widgetType = widgetType,
                                dataSource = dataSource,
                                isInitialLoad = true,
                                lastUpdated = DateTime.UtcNow
                        },
                        timestamp = DateTime.UtcNow
                });

                _logger.LogDebug ("Sent initial widget data to client {ConnectionId} for widget {WidgetId}",
                    Context.ConnectionId, widgetInstanceId);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting initial widget data for widget {WidgetId}", widgetInstanceId);

                await Clients.Caller.SendAsync ("InitialWidgetDataResponse", new {
                    widgetInstanceId = widgetInstanceId,
                        error = "Error retrieving initial widget data",
                        timestamp = DateTime.UtcNow
                });
            }
        }

        public async Task Ping () {
            // Simple ping method for health checks
            await Clients.Caller.SendAsync ("Pong", DateTime.UtcNow);
        }

        // Helper methods for data transformation
        private bool IsChartWidget (string widgetType) {
            return widgetType?.ToUpper () switch {
                "CHART_LINE_TREND" => true,
                "CHART_BAR_COMPARISON" => true,
                "CHART_PIE_DISTRIBUTION" => true,
                "LINECHART" => true,
                "BARCHART" => true,
                "PIECHART" => true,
                _ => false
            };
        }

        private object TransformDataForFrontendWidget (object rawData, string widgetType) {
            try {
                // Try to parse the raw data as dynamic to access properties
                string jsonString = JsonConvert.SerializeObject (rawData);
                dynamic dynamicData = JsonConvert.DeserializeObject (jsonString);

                // Check if data has timeSeries property
                if (dynamicData?.timeSeries != null) {
                    var chartData = new List<object> ();

                    foreach (var point in dynamicData.timeSeries) {
                        chartData.Add (new {
                            argument = point.timestamp?.ToString ("MM/dd HH:mm") ?? point.timestamp?.ToString (),
                                value = point.value,
                                timestamp = point.timestamp,
                                originalValue = point.value
                        });
                    }

                    // Return transformed data with chartData property expected by frontend
                    return new {
                        chartData = chartData,
                            current = dynamicData.current,
                            metadata = dynamicData.metadata,
                            summary = dynamicData.summary,
                            unit = dynamicData.metadata?.unit ?? dynamicData.current?.unit,
                            title = dynamicData.metadata?.displayName,
                            lastUpdated = DateTime.UtcNow
                    };
                }

                // If no timeSeries, return as-is
                return rawData;
            } catch (Exception ex) {
                _logger.LogWarning (ex, "Failed to transform data for widget type {WidgetType}", widgetType);
                return rawData;
            }
        }

        // Helper methods
        private T GetConfigValue<T> (Dictionary<string, object> configuration, string key, T defaultValue) {
            if (configuration?.TryGetValue (key, out var value) == true) {
                try {
                    if (value is T directValue)
                        return directValue;

                    return (T) Convert.ChangeType (value, typeof (T));
                } catch {
                    return defaultValue;
                }
            }
            return defaultValue;
        }

        public async Task RequestDashboardMetrics () {
            try {
                // Create default request for dashboard metrics
                DashboardMetricRequestDto request = new () {
                    MetricType = "dashboard_overview",
                    Mode = "live",
                    DatePreset = "today"
                };

                // Get current dashboard metrics
                object metrics = await _metricsService.GetMetricAsync (request);
                await Clients.Caller.SendAsync ("DashboardMetricsUpdate", metrics);
                _logger.LogDebug ("Sent dashboard metrics to client {ConnectionId}", Context.ConnectionId);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error sending dashboard metrics to client");
            }
        }

        private string FormatTickerValue (decimal value, string unit) {
            return unit.ToLower () switch {
                "liters"
                or "l" => $"{value:N0} L",
                    "gallons"
                    or "gal" => $"{value:N0} gal",
                    "hours"
                    or "hrs" => $"{value:N1} hrs",
                    "kilometers"
                    or "km" => $"{value:N0} km",
                    "miles"
                    or "mi" => $"{value:N0} mi",
                    "currency"
                    or "$"
                    or "usd" => $"${value:N2}",
                    "percentage"
                    or "%" => $"{value:N1}%",
                    "count"
                    or "units" => $"{value:N0}",
                    _ => $"{value:N2} {unit}"
            };
        }

        // Helper method to parse widget data requests - eliminates duplication
        private (int widgetInstanceId, Dictionary<string, object> ? frontendConfiguration, string? error) ParseWidgetDataRequest (object requestData) {
            Dictionary<string, object> ? frontendConfiguration = null;

            // Try to convert to int first (most common case)
            if (int.TryParse (requestData?.ToString (), out int parsedId)) {
                _logger.LogInformation ("Parsed widget ID as direct integer: {WidgetId}", parsedId);
                return (parsedId, null, null);
            }

            if (requestData is Dictionary<string, object> requestDict) {
                // New format: object with widgetInstanceId and configuration
                if (!requestDict.TryGetValue ("widgetInstanceId", out var widgetIdObj) ||
                    !int.TryParse (widgetIdObj?.ToString (), out int widgetId)) {
                    return (0, null, "Invalid or missing widgetInstanceId");
                }

                if (requestDict.TryGetValue ("configuration", out object? configObj)) {
                    frontendConfiguration = configObj as Dictionary<string, object>;
                }
                return (widgetId, frontendConfiguration, null);
            }

            // Try to parse as JSON string
            try {
                var jsonRequestDict = JsonConvert.DeserializeObject<Dictionary<string, object>> (requestData.ToString ());
                if (jsonRequestDict == null) {
                    return (0, null, "Invalid request format - could not parse JSON");
                }

                if (!jsonRequestDict.TryGetValue ("widgetInstanceId", out var widgetIdObj) ||
                    !int.TryParse (widgetIdObj?.ToString (), out int widgetId)) {
                    return (0, null, "Invalid or missing widgetInstanceId in JSON");
                }

                if (jsonRequestDict.TryGetValue ("configuration", out object? configObj) && configObj != null) {
                    frontendConfiguration = JsonConvert.DeserializeObject<Dictionary<string, object>> (configObj.ToString ());
                }
                return (widgetId, frontendConfiguration, null);
            } catch (Exception ex) {
                _logger.LogError (ex, "Invalid request data format - RequestData: {RequestData}, Type: {RequestDataType}",
                    requestData, requestData?.GetType ()?.Name);
                return (0, null, "Invalid request format");
            }
        }

        // Helper method to get widget instance with proper authentication - eliminates duplication
        private async Task<DashboardWidgetInstance?> GetWidgetInstanceAsync (int widgetInstanceId, string userId, string methodName) {
            _logger.LogDebug ("Querying database for widget {WidgetId} for user {UserId} in {Method}",
                widgetInstanceId, userId, methodName);

            DashboardWidgetInstance? widgetInstance;

            if (userId == "system") {
                // If we're still getting "system" as user ID, it means authentication isn't working yet
                // Allow access to all visible widgets for debugging (this should be temporary)
                _logger.LogWarning ("Using system fallback - querying all visible widgets (authentication issue) in {Method}", methodName);
                widgetInstance = await _context.DashboardWidgetInstances
                    .Include (w => w.Template)
                    .FirstOrDefaultAsync (w => w.Id == widgetInstanceId && w.IsVisible);
            } else {
                // Proper authenticated query - only return widgets owned by the authenticated user
                widgetInstance = await _context.DashboardWidgetInstances
                    .Include (w => w.Template)
                    .FirstOrDefaultAsync (w => w.Id == widgetInstanceId && w.UserId == userId && w.IsVisible);
            }

            // Debug: Log query results
            if (widgetInstance == null) {
                _logger.LogWarning ("Widget {WidgetId} does not exist or is not visible for user {UserId} in {Method}",
                    widgetInstanceId, userId, methodName);
            } else {
                _logger.LogDebug ("Found widget {WidgetId}: {WidgetName} (Owner: {OwnerId}) in {Method}",
                    widgetInstanceId, widgetInstance.CustomName, widgetInstance.UserId, methodName);
            }

            return widgetInstance;
        }

        // Helper method to parse widget configuration - eliminates duplication
        private Dictionary<string, object> ParseWidgetConfiguration (string? configurationJson, Dictionary<string, object> ? frontendConfiguration) {
            var configuration = new Dictionary<string, object> ();

            // First, load configuration from database
            if (!string.IsNullOrEmpty (configurationJson)) {
                try {
                    configuration = JsonConvert.DeserializeObject<Dictionary<string, object>> (configurationJson) ??
                        new Dictionary<string, object> ();
                } catch (Exception ex) {
                    _logger.LogWarning (ex, "Failed to parse widget configuration");
                }
            }

            // Then, override with frontend configuration if provided
            if (frontendConfiguration != null) {
                foreach (var kvp in frontendConfiguration) {
                    configuration[kvp.Key] = kvp.Value;
                }
                _logger.LogDebug ("Applied frontend configuration override: {Config}",
                    JsonConvert.SerializeObject (frontendConfiguration));
            }

            return configuration;
        }
    }
}