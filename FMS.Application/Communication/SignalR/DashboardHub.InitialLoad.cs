using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.Features.Dashboard;
using FMS.Application.Features.Dashboard.Contracts;
using FMS.Application.Services.Dashboard;
using FMS.Domain.Entities.Dashboard;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging; // For _logger extension methods
using Newtonsoft.Json;

namespace FMS.Application.Communication.SignalR {
    /// <summary>
    /// Initial widget data & batch loading partial.
    /// Handles GetInitialWidgetData / GetInitialWidgetsData with dual-send suppression based on negotiated protocol version.
    /// </summary>
    public partial class DashboardHub : Hub {
        public async Task GetInitialWidgetData (int widgetInstanceId) {
            try {
                bool suppressLegacy = SupportsEnvelopeV2 ();
                string userId = CurrentUserId;

                _logger.LogInformation ("GetInitialWidgetData for widget {WidgetId}, UserId: {UserId}", widgetInstanceId, userId);

                var widgetInstance = await GetWidgetInstanceAsync (widgetInstanceId, userId, nameof (GetInitialWidgetData));
                if (widgetInstance == null) {
                    if (!suppressLegacy) {
                        await Clients.Caller.SendAsync ("InitialWidgetDataResponse", new {
                            widgetInstanceId,
                            error = "Widget instance not found or not visible",
                            timestamp = DateTime.UtcNow
                        });
                    }
                    var errEnvNF = WidgetEnvelopeBuilder.BuildError (widgetInstanceId, "unknown", "unknown", string.Empty, "initial", new [] { "Widget instance not found or not visible" });
                    await Clients.Caller.SendAsync ("WidgetDataEnvelope", errEnvNF);
                    return;
                }

                var configuration = ParseWidgetConfiguration (widgetInstance.ConfigurationJson, null);
                string widgetType = widgetInstance.WidgetType ?? widgetInstance.Template?.WidgetType ?? "unknown";
                string? dataSource = widgetInstance.DataSource ?? widgetInstance.Template?.DataSource;
                if (string.IsNullOrEmpty (dataSource)) {
                    if (!suppressLegacy) {
                        await Clients.Caller.SendAsync ("InitialWidgetDataResponse", new {
                            widgetInstanceId,
                            error = "Widget data source not configured",
                            timestamp = DateTime.UtcNow
                        });
                    }
                    var errEnvDS = WidgetEnvelopeBuilder.BuildError (widgetInstanceId, widgetType, widgetInstance.Category ?? widgetInstance.Template?.Category ?? "general", string.Empty, "initial", new [] { "Widget data source not configured" });
                    await Clients.Caller.SendAsync ("WidgetDataEnvelope", errEnvDS);
                    return;
                }

                Dictionary<string, object> settingsDict = new (StringComparer.OrdinalIgnoreCase);
                if (configuration.TryGetValue ("settings", out var settingsObj)) {
                    try { settingsDict = JsonConvert.DeserializeObject<Dictionary<string, object>> (JsonConvert.SerializeObject (settingsObj)) ?? new (StringComparer.OrdinalIgnoreCase); } catch { }
                }

                var filters = new Dictionary<string, object> (StringComparer.OrdinalIgnoreCase);
                if (configuration.TryGetValue ("siteIds", out var siteIds)) filters["siteIds"] = siteIds;
                if (configuration.TryGetValue ("vehicleIds", out var vehicleIds)) filters["vehicleIds"] = vehicleIds;
                if (configuration.TryGetValue ("vehicleTypeIds", out var vehicleTypeIds)) filters["vehicleTypeIds"] = vehicleTypeIds;

                string resolvedDatePreset = GetNestedConfigValue<string> (configuration, new [] { "settings.datePreset", "datePreset" }, "yesterday");
                string resolvedMode = GetNestedConfigValue<string> (configuration, new [] { "settings.mode", "mode" }, "cumulative");

                var widgetRequest = new WidgetDataRequest {
                    WidgetType = widgetType,
                    Category = widgetInstance.Category ?? widgetInstance.Template?.Category ?? "general",
                    DataSource = dataSource,
                    Filters = filters,
                    Settings = settingsDict,
                    TimeRange = resolvedDatePreset,
                    Mode = resolvedMode
                };

                object finalData;
                try {
                    var factoryResult = await _widgetFactoryService.GetWidgetDataAsync (widgetRequest);
                    if (!factoryResult.Success) {
                        if (!suppressLegacy) {
                            await Clients.Caller.SendAsync ("InitialWidgetDataResponse", new {
                                widgetInstanceId,
                                error = factoryResult.ErrorMessage ?? "Widget factory error",
                                validation = factoryResult.ValidationErrors,
                                timestamp = DateTime.UtcNow
                            });
                        }
                        var envErr = WidgetEnvelopeBuilder.BuildError (widgetInstanceId, widgetType, widgetRequest.Category, dataSource, "initial", new [] { factoryResult.ErrorMessage ?? "Widget factory error" }, factoryResult.ValidationErrors);
                        await Clients.Caller.SendAsync ("WidgetDataEnvelope", envErr);
                        return;
                    }
                    finalData = factoryResult.Data;
                    if (finalData != null && IsChartWidget (widgetType) && !HasChartDataProperty (finalData)) {
                        finalData = TransformDataForFrontendWidget (finalData, widgetType);
                    }
                } catch (Exception exFactory) {
                    _logger.LogError (exFactory, "WidgetFactoryService failed for widget {WidgetId}; fallback", widgetInstanceId);
                    var fallbackMetricRequest = new DashboardMetricRequestDto {
                        MetricType = dataSource,
                        Mode = "cumulative",
                        DatePreset = resolvedDatePreset,
                        SiteIds = GetConfigValue<List<int> ?> (configuration, "siteIds", null),
                        VehicleIds = GetConfigValue<List<int> ?> (configuration, "vehicleIds", null),
                        VehicleType = GetConfigValue<List<int> ?> (configuration, "vehicleTypeIds", null),
                        IntervalHours = GetConfigValue<int?> (configuration, "intervalHours", null)
                    };
                    object initialData = await _dataSourceManager.GetInitialDataAsync (dataSource, fallbackMetricRequest);
                    finalData = await _dataSourceManager.TransformDataForWidgetType (widgetType, initialData, configuration);
                    if (finalData != null && IsChartWidget (widgetType)) finalData = TransformDataForFrontendWidget (finalData, widgetType);
                }

                if (!suppressLegacy) {
                    await Clients.Caller.SendAsync ("InitialWidgetDataResponse", new {
                        widgetInstanceId,
                        data = finalData,
                        metadata = new { widgetType, dataSource, isInitialLoad = true, lastUpdated = DateTime.UtcNow },
                        timestamp = DateTime.UtcNow
                    });
                }

                var dsMeta = _dataSourceManager.GetDataSourceMetadata (dataSource);
                var envelope = WidgetEnvelopeBuilder.BuildInitialUntyped (
                    widgetInstanceId,
                    widgetType,
                    widgetInstance.Category ?? widgetInstance.Template?.Category ?? "general",
                    dataSource,
                    mode : resolvedMode,
                    timeRange : resolvedDatePreset,
                    aggregation : settingsDict.TryGetValue ("aggregation", out var aggObj) ? aggObj?.ToString () ?? "none" : "none",
                    data : finalData ?? new { },
                    metadata : new WidgetMetadata (
                        DisplayName: dsMeta.DisplayName ?? widgetType,
                        Unit : dsMeta.Unit,
                        SupportsLive : dsMeta.SupportsLiveData,
                        SupportsHistorical : dsMeta.SupportsHistoricalData,
                        RefreshIntervalSeconds : dsMeta.RefreshIntervalSeconds));
                await Clients.Caller.SendAsync ("WidgetDataEnvelope", envelope);

                _logger.LogDebug ("Sent initial widget data (dual/optimized) for widget {WidgetId}", widgetInstanceId);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting initial widget data for widget {WidgetId}", widgetInstanceId);
                bool suppressLegacy = SupportsEnvelopeV2 ();
                if (!suppressLegacy) {
                    await Clients.Caller.SendAsync ("InitialWidgetDataResponse", new { widgetInstanceId, error = "Error retrieving initial widget data", timestamp = DateTime.UtcNow });
                }
                var errorEnvelope = WidgetEnvelopeBuilder.BuildError (widgetInstanceId, "unknown", "unknown", string.Empty, "error", new [] { "Error retrieving initial widget data" });
                await Clients.Caller.SendAsync ("WidgetDataEnvelope", errorEnvelope);
            }
        }

        public async Task GetInitialWidgetsData (int[] widgetInstanceIds) {
            if (widgetInstanceIds == null || widgetInstanceIds.Length == 0) {
                await Clients.Caller.SendAsync ("InitialWidgetsDataBatch", new { widgets = Array.Empty<object> (), timestamp = DateTime.UtcNow });
                return;
            }

            bool suppressLegacy = SupportsEnvelopeV2 ();
            string userId = CurrentUserId;
            var distinctIds = widgetInstanceIds.Distinct ().ToArray ();
            _logger.LogInformation ("GetInitialWidgetsData for {Count} widgets (User: {UserId})", distinctIds.Length, userId);

            List<object> legacyResponses = new (distinctIds.Length);
            List<WidgetDataEnvelope> envelopeResponses = new (distinctIds.Length);

            try {
                var query = _context.DashboardWidgetInstances
                    .Include (w => w.Template)
                    .Where (w => distinctIds.Contains (w.Id) && w.IsVisible);
                if (userId != "system") query = query.Where (w => w.UserId == userId);
                var widgetInstances = await query.ToListAsync ();
                var widgetMap = widgetInstances.ToDictionary (w => w.Id, w => w);

                foreach (var wid in distinctIds) {
                    try {
                        if (!widgetMap.TryGetValue (wid, out var widgetInstance)) {
                            if (!suppressLegacy) legacyResponses.Add (new { widgetInstanceId = wid, error = "Widget instance not found or not visible", timestamp = DateTime.UtcNow });
                            envelopeResponses.Add (WidgetEnvelopeBuilder.BuildError (wid, "unknown", "unknown", string.Empty, "initial", new [] { "Widget instance not found or not visible" }));
                            continue;
                        }
                        var configuration = ParseWidgetConfiguration (widgetInstance.ConfigurationJson, null);
                        string widgetType = widgetInstance.WidgetType ?? widgetInstance.Template?.WidgetType ?? "unknown";
                        string? dataSource = widgetInstance.DataSource ?? widgetInstance.Template?.DataSource;
                        if (string.IsNullOrEmpty (dataSource)) {
                            if (!suppressLegacy) legacyResponses.Add (new { widgetInstanceId = wid, error = "Widget data source not configured", timestamp = DateTime.UtcNow });
                            envelopeResponses.Add (WidgetEnvelopeBuilder.BuildError (wid, widgetType, widgetInstance.Category ?? widgetInstance.Template?.Category ?? "general", string.Empty, "initial", new [] { "Widget data source not configured" }));
                            continue;
                        }

                        Dictionary<string, object> settingsDict = new (StringComparer.OrdinalIgnoreCase);
                        if (configuration.TryGetValue ("settings", out var settingsObj)) {
                            try { settingsDict = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, object>> (Newtonsoft.Json.JsonConvert.SerializeObject (settingsObj)) ?? new (); } catch { }
                        }
                        var filters = new Dictionary<string, object> (StringComparer.OrdinalIgnoreCase);
                        if (configuration.TryGetValue ("siteIds", out var siteIds)) filters["siteIds"] = siteIds;
                        if (configuration.TryGetValue ("vehicleIds", out var vehicleIds)) filters["vehicleIds"] = vehicleIds;
                        if (configuration.TryGetValue ("vehicleTypeIds", out var vehicleTypeIds)) filters["vehicleTypeIds"] = vehicleTypeIds;

                        string resolvedDatePreset = GetNestedConfigValue<string> (configuration, new [] { "settings.datePreset", "datePreset" }, "yesterday");
                        var widgetRequest = new WidgetDataRequest {
                            WidgetType = widgetType,
                            Category = widgetInstance.Category ?? widgetInstance.Template?.Category ?? "general",
                            DataSource = dataSource,
                            Filters = filters,
                            Settings = settingsDict,
                            TimeRange = resolvedDatePreset,
                            Mode = GetNestedConfigValue<string> (configuration, new [] { "settings.mode", "mode" }, "cumulative")
                        };

                        object dataPayload;
                        try {
                            var factoryResult = await _widgetFactoryService.GetWidgetDataAsync (widgetRequest);
                            if (!factoryResult.Success) {
                                if (!suppressLegacy) legacyResponses.Add (new { widgetInstanceId = wid, error = factoryResult.ErrorMessage ?? "Widget factory error", validation = factoryResult.ValidationErrors, timestamp = DateTime.UtcNow });
                                envelopeResponses.Add (WidgetEnvelopeBuilder.BuildError (wid, widgetType, widgetRequest.Category, dataSource, "initial", new [] { factoryResult.ErrorMessage ?? "Widget factory error" }, factoryResult.ValidationErrors));
                                continue;
                            }
                            dataPayload = factoryResult.Data;
                            if (dataPayload != null && IsChartWidget (widgetType) && !HasChartDataProperty (dataPayload)) {
                                dataPayload = TransformDataForFrontendWidget (dataPayload, widgetType);
                            }
                        } catch (Exception exFactory) {
                            _logger.LogError (exFactory, "Factory batch failure for widget {WidgetId}; falling back", wid);
                            var metricRequest = new DashboardMetricRequestDto {
                                MetricType = dataSource,
                                Mode = "cumulative",
                                DatePreset = resolvedDatePreset,
                                SiteIds = GetConfigValue<List<int> ?> (configuration, "siteIds", null),
                                VehicleIds = GetConfigValue<List<int> ?> (configuration, "vehicleIds", null),
                                VehicleType = GetConfigValue<List<int> ?> (configuration, "vehicleTypeIds", null),
                                IntervalHours = GetConfigValue<int?> (configuration, "intervalHours", null)
                            };
                            object initialData = await _dataSourceManager.GetInitialDataAsync (dataSource, metricRequest);
                            dataPayload = await _dataSourceManager.TransformDataForWidgetType (widgetType, initialData, configuration);
                            if (dataPayload != null && IsChartWidget (widgetType)) dataPayload = TransformDataForFrontendWidget (dataPayload, widgetType);
                        }

                        if (!suppressLegacy) legacyResponses.Add (new { widgetInstanceId = wid, data = dataPayload, metadata = new { widgetType, dataSource, isInitialLoad = true, lastUpdated = DateTime.UtcNow }, timestamp = DateTime.UtcNow });
                        var dsMeta = _dataSourceManager.GetDataSourceMetadata (dataSource);
                        envelopeResponses.Add (WidgetEnvelopeBuilder.BuildInitialUntyped (
                            widgetInstanceId: wid,
                            widgetType: widgetType,
                            category: widgetInstance.Category ?? widgetInstance.Template?.Category ?? "general",
                            dataSource : dataSource,
                            mode : widgetRequest.Mode,
                            timeRange : widgetRequest.TimeRange,
                            aggregation : widgetRequest.Settings.TryGetValue ("aggregation", out var aggObj) ? aggObj?.ToString () ?? "none" : "none",
                            data : dataPayload ?? new { },
                            metadata : new WidgetMetadata (
                                DisplayName: dsMeta.DisplayName ?? widgetType,
                                Unit : dsMeta.Unit,
                                SupportsLive : dsMeta.SupportsLiveData,
                                SupportsHistorical : dsMeta.SupportsHistoricalData,
                                RefreshIntervalSeconds : dsMeta.RefreshIntervalSeconds)));
                    } catch (Exception exWidget) {
                        _logger.LogError (exWidget, "Error building initial data for widget {WidgetId}", wid);
                        if (!suppressLegacy) legacyResponses.Add (new { widgetInstanceId = wid, error = "Error retrieving initial widget data", timestamp = DateTime.UtcNow });
                        envelopeResponses.Add (WidgetEnvelopeBuilder.BuildError (wid, "unknown", "unknown", string.Empty, "initial", new [] { "Error retrieving initial widget data" }));
                    }
                }
            } catch (Exception ex) {
                _logger.LogError (ex, "Batch initial widget data failure");
            }

            if (!suppressLegacy) {
                await Clients.Caller.SendAsync ("InitialWidgetsDataBatch", new { widgets = legacyResponses, count = legacyResponses.Count, timestamp = DateTime.UtcNow });
            }
            await Clients.Caller.SendAsync ("WidgetDataEnvelopeBatch", new { widgets = envelopeResponses, count = envelopeResponses.Count, protocolVersion = 2, timestamp = DateTime.UtcNow });
        }
    }
}