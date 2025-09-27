using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Domain.Entities.Dashboard;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;

namespace FMS.Application.Communication.SignalR {
    /// <summary>
    /// Helper / utility methods partial for DashboardHub (transformation, config resolution, context lookups, misc endpoints).
    /// </summary>
    public partial class DashboardHub : Hub {
        private string CurrentUserId {
            get {
                try {
                    if (Context.User?.Identity?.IsAuthenticated != true) return "system";
                    foreach (var claim in Context.User.Claims) {
                        if (System.Guid.TryParse (claim.Value, out _)) return claim.Value;
                    }
                    return "system";
                } catch { return "system"; }
            }
        }

        public async Task Ping () => await Clients.Caller.SendAsync ("Pong", System.DateTime.UtcNow);

        private bool IsChartWidget (string widgetType) => widgetType?.ToUpper () switch {
            "CHART_LINE_TREND" => true,
            "CHART_BAR_COMPARISON" => true,
            "CHART_PIE_DISTRIBUTION" => true,
            "LINECHART" => true,
            "BARCHART" => true,
            "PIECHART" => true,
            _ => false
        };

        private bool HasChartDataProperty (object data) {
            if (data == null) return false;
            try {
                var json = JsonConvert.SerializeObject (data);
                dynamic dyn = JsonConvert.DeserializeObject (json);
                if (dyn == null) return false;
                return dyn.chartData != null;
            } catch { return data.GetType ().GetProperty ("chartData") != null; }
        }

        private object TransformDataForFrontendWidget (object rawData, string widgetType) {
            try {
                string jsonString = JsonConvert.SerializeObject (rawData);
                dynamic dynamicData = JsonConvert.DeserializeObject (jsonString);
                if (dynamicData?.timeSeries != null) {
                    var chartData = new List<object> ();
                    foreach (var point in dynamicData.timeSeries) {
                        chartData.Add (new { argument = point.timestamp?.ToString ("MM/dd HH:mm") ?? point.timestamp?.ToString (), value = point.value, timestamp = point.timestamp, originalValue = point.value });
                    }
                    return new {
                        chartData,
                        current = dynamicData.current,
                        metadata = dynamicData.metadata,
                        summary = dynamicData.summary,
                        unit = dynamicData.metadata?.unit ?? dynamicData.current?.unit,
                        title = dynamicData.metadata?.displayName,
                        lastUpdated = System.DateTime.UtcNow
                    };
                }
                return rawData;
            } catch { return rawData; }
        }

        private T GetConfigValue<T> (Dictionary<string, object> configuration, string key, T defaultValue) {
            if (configuration?.TryGetValue (key, out var value) == true) {
                try { if (value is T tv) return tv; return (T) System.Convert.ChangeType (value, typeof (T)); } catch { return defaultValue; }
            }
            return defaultValue;
        }

        private T GetNestedConfigValue<T> (Dictionary<string, object> configuration, string[] paths, T defaultValue) {
            if (configuration == null) return defaultValue;
            foreach (var path in paths) {
                var segments = path.Split ('.', System.StringSplitOptions.RemoveEmptyEntries);
                object current = configuration;
                bool failed = false;
                foreach (var seg in segments) {
                    if (current is Dictionary<string, object> dict) { if (!dict.TryGetValue (seg, out current)) { failed = true; break; } } else if (current is Newtonsoft.Json.Linq.JObject jobj) { var token = jobj[seg]; if (token == null) { failed = true; break; } current = token is Newtonsoft.Json.Linq.JValue jv ? jv.Value : token.ToString (); } else { failed = true; break; }
                }
                if (!failed && current != null) { try { if (current is T tv) return tv; return (T) System.Convert.ChangeType (current, typeof (T)); } catch { } }
            }
            return defaultValue;
        }

        private async Task < (string? category, string? dataSource) > GetWidgetContextForEnvelope (int widgetInstanceId) {
            try {
                var instance = await _context.DashboardWidgetInstances.Include (w => w.Template).AsNoTracking ().FirstOrDefaultAsync (w => w.Id == widgetInstanceId);
                if (instance == null) return (null, null);
                return (instance.Category ?? instance.Template?.Category ?? "general", instance.DataSource ?? instance.Template?.DataSource);
            } catch { return (null, null); }
        }
        private async Task<string?> GetWidgetType (int widgetInstanceId) {
            try { var instance = await _context.DashboardWidgetInstances.Include (w => w.Template).AsNoTracking ().FirstOrDefaultAsync (w => w.Id == widgetInstanceId); return instance?.WidgetType ?? instance?.Template?.WidgetType; } catch { return null; }
        }

        private (int widgetInstanceId, Dictionary<string, object> ? frontendConfiguration, string? error) ParseWidgetDataRequest (object requestData) {
            Dictionary<string, object> ? frontendConfiguration = null;
            if (int.TryParse (requestData?.ToString (), out int parsedId)) return (parsedId, null, null);
            if (requestData is Dictionary<string, object> dict) {
                if (!dict.TryGetValue ("widgetInstanceId", out var widgetIdObj) || !int.TryParse (widgetIdObj?.ToString (), out int widgetId)) return (0, null, "Invalid or missing widgetInstanceId");
                if (dict.TryGetValue ("configuration", out object? configObj)) frontendConfiguration = configObj as Dictionary<string, object>;
                return (widgetId, frontendConfiguration, null);
            }
            try {
                var jsonDict = JsonConvert.DeserializeObject<Dictionary<string, object>> (requestData.ToString ());
                if (jsonDict == null) return (0, null, "Invalid request format - could not parse JSON");
                if (!jsonDict.TryGetValue ("widgetInstanceId", out var widgetIdObj) || !int.TryParse (widgetIdObj?.ToString (), out int widgetId)) return (0, null, "Invalid or missing widgetInstanceId in JSON");
                if (jsonDict.TryGetValue ("configuration", out object? cfgObj) && cfgObj != null) frontendConfiguration = JsonConvert.DeserializeObject<Dictionary<string, object>> (cfgObj.ToString ());
                return (widgetId, frontendConfiguration, null);
            } catch { return (0, null, "Invalid request format"); }
        }

        private async Task<DashboardWidgetInstance?> GetWidgetInstanceAsync (int widgetInstanceId, string userId, string methodName) {
            DashboardWidgetInstance? widgetInstance;
            if (userId == "system") {
                widgetInstance = await _context.DashboardWidgetInstances.Include (w => w.Template).FirstOrDefaultAsync (w => w.Id == widgetInstanceId && w.IsVisible);
            } else {
                widgetInstance = await _context.DashboardWidgetInstances.Include (w => w.Template).FirstOrDefaultAsync (w => w.Id == widgetInstanceId && w.UserId == userId && w.IsVisible);
            }
            return widgetInstance;
        }

        // Added: helper previously in monolithic file, required by InitialLoad & Metrics partials
        private Dictionary<string, object> ParseWidgetConfiguration (string? configurationJson, Dictionary<string, object> ? frontendConfiguration) {
            var configuration = new Dictionary<string, object> (StringComparer.OrdinalIgnoreCase);
            if (!string.IsNullOrWhiteSpace (configurationJson)) {
                try {
                    configuration = JsonConvert.DeserializeObject<Dictionary<string, object>> (configurationJson) ?? new (StringComparer.OrdinalIgnoreCase);
                } catch { /* swallow parse errors */ }
            }
            if (frontendConfiguration != null) {
                foreach (var kvp in frontendConfiguration) configuration[kvp.Key] = kvp.Value;
            }
            return configuration;
        }
    }
}