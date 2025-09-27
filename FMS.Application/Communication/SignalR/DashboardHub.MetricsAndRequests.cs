using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.Features.Dashboard;
using FMS.Application.Features.Dashboard.Contracts;
using FMS.Application.Features.Dashboard.DTOs;
using Microsoft.AspNetCore.SignalR;
using Newtonsoft.Json;

namespace FMS.Application.Communication.SignalR {
    /// <summary>
    /// Metric & ad-hoc request handling partial (RequestWidgetData, RequestDataSourceData, RequestDashboardMetrics, broadcast helpers).
    /// </summary>
    public partial class DashboardHub : Hub {
        public async Task BroadcastKeyStatisticsUpdate (object statisticsData) {
            try {
                var envelopeOnly = SupportsEnvelopeV2 ();
                var envelope = WidgetEnvelopeBuilder.BuildUpdateUntyped (
                    widgetInstanceId: 0,
                    widgetType: "key_statistics",
                    category: "general",
                    dataSource: "key_statistics",
                    mode: "live",
                    timeRange : string.Empty,
                    aggregation: "none",
                    updateType: "stats",
                    data : new { timestamp = System.DateTime.UtcNow, statistics = statisticsData },
                    metadata : new WidgetMetadata ("Key Statistics", null, true, true, null)
                );
                await Clients.All.SendAsync ("WidgetDataEnvelope", envelope);
                if (!envelopeOnly) {
                    await Clients.Group (LegacyGroup).SendAsync ("KeyStatisticsUpdate", new { timestamp = System.DateTime.UtcNow, statistics = statisticsData });
                }
            } catch { }
        }
        public async Task BroadcastTickerUpdate (string metricType, decimal value, string unit, System.DateTime timestamp) {
            try {
                var envelopeOnly = SupportsEnvelopeV2 ();
                var formatted = FormatTickerValue (value, unit);
                var payload = new TickerUpdateDto (metricType, value, unit, timestamp, formatted);
                var envelope = WidgetEnvelopeBuilder.BuildUpdate<TickerUpdateDto> (
                    widgetInstanceId: 0,
                    widgetType: "ticker",
                    category: "general",
                    dataSource : metricType,
                    mode: "live",
                    timeRange : string.Empty,
                    aggregation: "none",
                    updateType: "ticker",
                    data : payload,
                    metadata : new WidgetMetadata ("Ticker", unit, true, true, null)
                );
                await Clients.All.SendAsync ("WidgetDataEnvelope", envelope);
                if (!envelopeOnly) {
                    await Clients.Group (LegacyGroup).SendAsync ("TickerUpdate", new { metricType, value, unit, timestamp, formattedValue = formatted });
                }
            } catch { }
        }
        public async Task BroadcastGraphUpdate (string graphId, string graphType, object dataPoints) {
            try {
                var envelopeOnly = SupportsEnvelopeV2 ();
                var payload = new GraphUpdateDto (graphId, graphType, dataPoints, System.DateTime.UtcNow);
                var envelope = WidgetEnvelopeBuilder.BuildUpdate<GraphUpdateDto> (
                    widgetInstanceId: 0,
                    widgetType: "graph",
                    category : graphType ?? "general",
                    dataSource : graphId ?? "graph",
                    mode: "live",
                    timeRange : string.Empty,
                    aggregation: "none",
                    updateType: "graph",
                    data : payload,
                    metadata : new WidgetMetadata ($"Graph: {graphType}", null, true, true, null)
                );
                await Clients.All.SendAsync ("WidgetDataEnvelope", envelope);
                if (!envelopeOnly) {
                    await Clients.Group (LegacyGroup).SendAsync ("GraphUpdate", new { graphId, graphType, dataPoints, timestamp = System.DateTime.UtcNow });
                }
            } catch { }
        }
        public async Task BroadcastDashboardLayoutUpdate (string userId, object layoutData) {
            try {
                var envelopeOnly = SupportsEnvelopeV2 ();
                var payload = new DashboardLayoutDto (userId, layoutData, System.DateTime.UtcNow);
                var envelope = WidgetEnvelopeBuilder.BuildUpdate<DashboardLayoutDto> (
                    widgetInstanceId: 0,
                    widgetType: "dashboard_layout",
                    category: "general",
                    dataSource: "layout",
                    mode: "live",
                    timeRange : string.Empty,
                    aggregation: "none",
                    updateType: "layout",
                    data : payload,
                    metadata : new WidgetMetadata ("Dashboard Layout", null, true, true, null)
                );
                await Clients.All.SendAsync ("WidgetDataEnvelope", envelope);
                if (!envelopeOnly) {
                    await Clients.Group (LegacyGroup).SendAsync ("DashboardLayoutUpdate", new { userId, layoutData, timestamp = System.DateTime.UtcNow });
                }
            } catch { }
        }

        public async Task RequestWidgetData (object requestData) {
            int widgetInstanceId = 0;
            try {
                var envelopeOnly = SupportsEnvelopeV2 ();
                string userId = CurrentUserId;
                var (parsedWidgetId, frontendConfiguration, error) = ParseWidgetDataRequest (requestData);

                if (!string.IsNullOrEmpty (error)) {
                    // Send error envelope + legacy (if not suppressed)
                    var errEnvParse = WidgetEnvelopeBuilder.BuildError (
                        widgetInstanceId: 0,
                        widgetType: "unknown",
                        category: "unknown",
                        dataSource : string.Empty,
                        updateType: "error",
                        errors : new [] { error }
                    );
                    await Clients.Caller.SendAsync ("WidgetDataEnvelope", errEnvParse);
                    if (!envelopeOnly) await Clients.Caller.SendAsync ("WidgetDataUpdate", new { error, timestamp = System.DateTime.UtcNow });
                    return;
                }

                widgetInstanceId = parsedWidgetId;
                var widgetInstance = await GetWidgetInstanceAsync (widgetInstanceId, userId, nameof (RequestWidgetData));
                if (widgetInstance == null) {
                    var errEnvNF = WidgetEnvelopeBuilder.BuildError (
                        widgetInstanceId,
                        widgetType: "unknown",
                        category: "unknown",
                        dataSource : string.Empty,
                        updateType: "error",
                        errors : new [] { "Widget instance not found or not visible" }
                    );
                    await Clients.Caller.SendAsync ("WidgetDataEnvelope", errEnvNF);
                    if (!envelopeOnly) await Clients.Caller.SendAsync ("WidgetDataUpdate", new { widgetId = widgetInstanceId, error = "Widget instance not found or not visible", timestamp = System.DateTime.UtcNow });
                    return;
                }

                var configuration = ParseWidgetConfiguration (widgetInstance.ConfigurationJson, frontendConfiguration);
                string dataSource = widgetInstance.DataSource ?? widgetInstance.Template?.DataSource;
                string widgetType = widgetInstance.WidgetType ?? widgetInstance.Template?.WidgetType ?? "unknown";
                string category = widgetInstance.Category ?? widgetInstance.Template?.Category ?? "general";
                if (string.IsNullOrEmpty (dataSource)) {
                    var errEnvDS = WidgetEnvelopeBuilder.BuildError (
                        widgetInstanceId,
                        widgetType : widgetType,
                        category : category,
                        dataSource : string.Empty,
                        updateType: "error",
                        errors : new [] { "Widget data source not configured" }
                    );
                    await Clients.Caller.SendAsync ("WidgetDataEnvelope", errEnvDS);
                    if (!envelopeOnly) await Clients.Caller.SendAsync ("WidgetDataUpdate", new { widgetId = widgetInstanceId, error = "Widget data source not configured", timestamp = System.DateTime.UtcNow });
                    return;
                }

                var getConfigValue = new Func<string[], string, object> ((paths, defaultValue) => {
                        foreach (var path in paths) {
                            if (path.Contains ('.')) {
                                var keys = path.Split ('.');
                                object current = configuration;
                                foreach (var key in keys) {
                                    if (current is Dictionary<string, object> dict && dict.TryGetValue (key, out var value)) current = value;
                                    else { current = null; break; }
                                }
                                if (current != null) return current.ToString ();
                            } else if (configuration.TryGetValue (path, out var value)) return value?.ToString ();
                        }
                        return defaultValue;
                    });

                // Extract capability fields with sane defaults
                var resolvedMode = (string) getConfigValue (new [] { "mode", "settings.mode" }, "cumulative") ?? "cumulative";
                var resolvedDatePreset = (string) getConfigValue (new [] { "settings.datePreset", "datePreset" }, "yesterday") ?? "yesterday";
                var resolvedAggregation = ((string) getConfigValue (new [] { "settings.aggregation", "aggregation" }, "SUM") ?? "SUM").ToUpperInvariant ();
                var resolvedGroupBy = ((string) getConfigValue (new [] { "settings.groupBy", "groupBy" }, "none") ?? "none").ToLowerInvariant ();
                var resolvedGranularity = (string) getConfigValue (new [] { "settings.granularity", "granularity" }, null);
                if (string.IsNullOrEmpty (resolvedGranularity)) {
                    // derive from mode/date preset
                    resolvedGranularity = resolvedMode.Equals ("live", StringComparison.OrdinalIgnoreCase) ? "minute" : (resolvedDatePreset.Contains ("24", StringComparison.OrdinalIgnoreCase) ? "hour" : "day");
                }
                var includeTotal = GetConfigValue<bool?> (configuration, "includeTotal", null) ?? true;
                var topK = GetConfigValue<int?> (configuration, "topK", null) ?? 10;

                // Ensure configuration.settings contains normalized capability fields for downstream shaping
                try {
                    if (!configuration.TryGetValue ("settings", out var settingsObj) || settingsObj == null) {
                        configuration["settings"] = new Dictionary<string, object> (StringComparer.OrdinalIgnoreCase);
                        settingsObj = configuration["settings"];
                    }
                    var settingsDict = JsonConvert.DeserializeObject<Dictionary<string, object>> (JsonConvert.SerializeObject (settingsObj)) ?? new (StringComparer.OrdinalIgnoreCase);
                    settingsDict["aggregation"] = resolvedAggregation;
                    settingsDict["groupBy"] = resolvedGroupBy;
                    settingsDict["granularity"] = resolvedGranularity;
                    settingsDict["includeTotal"] = includeTotal;
                    settingsDict["topK"] = topK;
                    configuration["settings"] = settingsDict;
                } catch { }

                var metricRequest = new DashboardMetricRequestDto {
                    MetricType = dataSource,
                    Mode = resolvedMode,
                    DatePreset = resolvedDatePreset,
                    SiteIds = GetConfigValue<System.Collections.Generic.List<int> ?> (configuration, "siteIds", null),
                    VehicleIds = GetConfigValue<System.Collections.Generic.List<int> ?> (configuration, "vehicleIds", null),
                    VehicleType = GetConfigValue<System.Collections.Generic.List<int> ?> (configuration, "vehicleTypeIds", null),
                    IntervalHours = GetConfigValue<int?> (configuration, "intervalHours", null)
                };

                bool isLiveMode = metricRequest.Mode?.ToLower () == "live";
                object widgetData;
                if (isLiveMode && _dataSourceManager.IsLiveDataSource (dataSource)) {
                    object liveData = await _dataSourceManager.GetLiveDataAsync (dataSource, metricRequest);
                    widgetData = await _dataSourceManager.TransformDataForWidgetType (widgetType, liveData, configuration);
                } else {
                    object initialData = await _dataSourceManager.GetInitialDataAsync (dataSource, metricRequest);
                    widgetData = await _dataSourceManager.TransformDataForWidgetType (widgetType, initialData, configuration);
                }
                if (widgetData != null && IsChartWidget (widgetType)) widgetData = TransformDataForFrontendWidget (widgetData, widgetType);
                // Envelope-first response
                var dsMeta = _dataSourceManager.GetDataSourceMetadata (dataSource);
                var envelope = WidgetEnvelopeBuilder.BuildUpdateUntyped (
                    widgetInstanceId: widgetInstanceId,
                    widgetType: widgetType,
                    category: category,
                    dataSource: dataSource,
                    mode: isLiveMode ? "live" : (metricRequest.Mode ?? "cumulative"),
                    timeRange : metricRequest.DatePreset ?? string.Empty,
                    aggregation : resolvedAggregation,
                    updateType: "update",
                    data : widgetData ?? new { },
                    metadata : dsMeta == null ?
                    new WidgetMetadata (widgetType, null, null, null, null) :
                    new WidgetMetadata (
                        DisplayName: dsMeta.DisplayName ?? widgetType,
                        Unit : dsMeta.Unit,
                        SupportsLive : dsMeta.SupportsLiveData,
                        SupportsHistorical : dsMeta.SupportsHistoricalData,
                        RefreshIntervalSeconds : dsMeta.RefreshIntervalSeconds)
                );
                // Temporarily include capability hints in Debug for client alignment; will move to strongly-typed metadata later
                envelope = envelope with { Debug = new { aggregation = resolvedAggregation, groupBy = resolvedGroupBy, granularity = resolvedGranularity, includeTotal, topK } };
                await Clients.Caller.SendAsync ("WidgetDataEnvelope", envelope);
                if (!envelopeOnly) {
                    await Clients.Caller.SendAsync ("WidgetDataUpdate", new { widgetId = widgetInstanceId, widgetType, widgetCategory = category, dataSource, data = widgetData, isLiveData = isLiveMode, metadata = dsMeta, timestamp = System.DateTime.UtcNow });
                }
            } catch {
                var errEnv = WidgetEnvelopeBuilder.BuildError (
                    widgetInstanceId,
                    widgetType: "unknown",
                    category: "unknown",
                    dataSource : string.Empty,
                    updateType: "error",
                    errors : new [] { "Error retrieving widget data" }
                );
                await Clients.Caller.SendAsync ("WidgetDataEnvelope", errEnv);
                if (!SupportsEnvelopeV2 ()) {
                    await Clients.Caller.SendAsync ("WidgetDataUpdate", new { widgetId = widgetInstanceId, error = "Error retrieving widget data", timestamp = System.DateTime.UtcNow });
                }
            }
        }

        public async Task RequestDataSourceData (string dataSource, object requestParams = null) {
            try {
                var envelopeOnly = SupportsEnvelopeV2 ();
                var metricRequest = new DashboardMetricRequestDto { MetricType = dataSource, Mode = "live", DatePreset = "today" };
                // Make params dictionary available outside this block for downstream aggregation resolution
                Dictionary<string, object> ? paramDict = null;
                if (requestParams != null) {
                    paramDict = JsonConvert.DeserializeObject<Dictionary<string, object>> (JsonConvert.SerializeObject (requestParams)) ?? new ();
                    metricRequest.Mode = GetConfigValue<string> (paramDict, "mode", "live");
                    metricRequest.DatePreset = GetConfigValue<string> (paramDict, "datePreset", "today");
                    metricRequest.SiteIds = GetConfigValue<System.Collections.Generic.List<int> ?> (paramDict, "siteIds", null);
                    metricRequest.VehicleIds = GetConfigValue<System.Collections.Generic.List<int> ?> (paramDict, "vehicleIds", null);
                    metricRequest.VehicleType = GetConfigValue<System.Collections.Generic.List<int> ?> (paramDict, "vehicleTypeIds", null);
                    metricRequest.IntervalHours = GetConfigValue<int?> (paramDict, "intervalHours", null);
                }
                var data = await _dataSourceManager.GetLiveDataAsync (dataSource, metricRequest);
                var widgetType = dataSource; // best-effort mapping when no widget context exists
                var category = "general";
                var dsMeta = _dataSourceManager.GetDataSourceMetadata (dataSource);
                string agg = paramDict != null ?
                    (GetConfigValue<string> (paramDict, "aggregation", "SUM") ?? "SUM") :
                    "SUM";
                agg = agg.ToUpperInvariant ();
                var envelope = WidgetEnvelopeBuilder.BuildUpdateUntyped (
                    widgetInstanceId: 0,
                    widgetType: widgetType,
                    category: category,
                    dataSource: dataSource,
                    mode: metricRequest.Mode ?? "live",
                    timeRange : metricRequest.DatePreset ?? string.Empty,
                    aggregation : agg,
                    updateType: "datasource",
                    data : data ?? new { },
                    metadata : dsMeta == null ?
                    new WidgetMetadata (widgetType, null, null, null, null) :
                    new WidgetMetadata (
                        DisplayName: dsMeta.DisplayName ?? widgetType,
                        Unit : dsMeta.Unit,
                        SupportsLive : dsMeta.SupportsLiveData,
                        SupportsHistorical : dsMeta.SupportsHistoricalData,
                        RefreshIntervalSeconds : dsMeta.RefreshIntervalSeconds)
                );
                await Clients.Caller.SendAsync ("WidgetDataEnvelope", envelope);
                if (!envelopeOnly) {
                    await Clients.Caller.SendAsync ("DataSourceUpdate", new { dataSource, data, metadata = dsMeta, timestamp = System.DateTime.UtcNow });
                }
            } catch {
                var errEnv = WidgetEnvelopeBuilder.BuildError (
                    widgetInstanceId: 0,
                    widgetType: dataSource ?? "unknown",
                    category: "general",
                    dataSource : dataSource ?? string.Empty,
                    updateType: "error",
                    errors : new [] { "Error retrieving data source data" }
                );
                await Clients.Caller.SendAsync ("WidgetDataEnvelope", errEnv);
                if (!SupportsEnvelopeV2 ()) {
                    await Clients.Caller.SendAsync ("DataSourceUpdate", new { dataSource, error = "Error retrieving data source data", timestamp = System.DateTime.UtcNow });
                }
            }
        }

        public async Task RequestDashboardMetrics () {
            try {
                var envelopeOnly = SupportsEnvelopeV2 ();
                // Build a lightweight dashboard overview using DataSourceManager for key metrics
                var fuelReq = new DashboardMetricRequestDto { MetricType = "fuel_dispensed", Mode = "cumulative", DatePreset = "last_7_days" };
                var distReq = new DashboardMetricRequestDto { MetricType = "km_travel", Mode = "cumulative", DatePreset = "last_7_days" };
                var engReq = new DashboardMetricRequestDto { MetricType = "engine_hours", Mode = "cumulative", DatePreset = "last_7_days" };

                var fuel = await _dataSourceManager.GetInitialDataAsync ("fuel_dispensed", fuelReq);
                var distance = await _dataSourceManager.GetInitialDataAsync ("km_travel", distReq);
                var engine = await _dataSourceManager.GetInitialDataAsync ("engine_hours", engReq);

                var overview = new {
                    fuel_dispensed = fuel,
                    distance_travelled = distance,
                    engine_hours = engine
                };

                var payload = new DashboardMetricsDto (overview, System.DateTime.UtcNow);
                var envelope = WidgetEnvelopeBuilder.BuildUpdate<DashboardMetricsDto> (
                    widgetInstanceId: 0,
                    widgetType: "dashboard_overview",
                    category: "general",
                    dataSource: "dashboard_overview",
                    mode: "cumulative",
                    timeRange: "last_7_days",
                    aggregation: "none",
                    updateType: "metrics",
                    data : payload,
                    metadata : new WidgetMetadata ("Dashboard Overview", null, true, true, null)
                );
                await Clients.Caller.SendAsync ("WidgetDataEnvelope", envelope);
                if (!envelopeOnly) {
                    await Clients.Caller.SendAsync ("DashboardMetricsUpdate", overview);
                }
            } catch {
                var errEnv = WidgetEnvelopeBuilder.BuildError (
                    widgetInstanceId: 0,
                    widgetType: "dashboard_overview",
                    category: "general",
                    dataSource: "dashboard_overview",
                    updateType: "error",
                    errors : new [] { "Error retrieving dashboard metrics" }
                );
                await Clients.Caller.SendAsync ("WidgetDataEnvelope", errEnv);
                if (!SupportsEnvelopeV2 ()) {
                    await Clients.Caller.SendAsync ("DashboardMetricsUpdate", new { error = "Error retrieving dashboard metrics", timestamp = System.DateTime.UtcNow });
                }
            }
        }

        private string FormatTickerValue (decimal value, string unit) => unit.ToLower () switch {
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
}