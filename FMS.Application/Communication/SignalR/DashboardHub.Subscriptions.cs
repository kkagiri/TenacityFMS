using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FMS.Domain.Entities.Dashboard;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;

namespace FMS.Application.Communication.SignalR {
    /// <summary>
    /// Subscription management & category/data source oriented streaming partial.
    /// </summary>
    public partial class DashboardHub : Hub {
        public async Task SubscribeToWidgetUpdates (int widgetId) {
            try { await Groups.AddToGroupAsync (Context.ConnectionId, $"widget_{widgetId}"); } catch { }
        }
        public async Task UnsubscribeFromWidgetUpdates (int widgetId) {
            try { await Groups.RemoveFromGroupAsync (Context.ConnectionId, $"widget_{widgetId}"); } catch { }
        }
        public async Task SubscribeToMetricUpdates (string metricType) {
            try { await Groups.AddToGroupAsync (Context.ConnectionId, $"metric_{metricType}"); } catch { }
        }
        public async Task UnsubscribeFromMetricUpdates (string metricType) {
            try { await Groups.RemoveFromGroupAsync (Context.ConnectionId, $"metric_{metricType}"); } catch { }
        }
        public async Task SubscribeToDataSource (string dataSource) {
            try {
                await Groups.AddToGroupAsync (Context.ConnectionId, $"datasource_{dataSource}");
                await RequestDataSourceData (dataSource);
            } catch { }
        }
        public async Task UnsubscribeFromDataSource (string dataSource) {
            try { await Groups.RemoveFromGroupAsync (Context.ConnectionId, $"datasource_{dataSource}"); } catch { }
        }
        public async Task SubscribeToMultipleDataSources (string[] dataSources) {
            try { foreach (var ds in dataSources) await Groups.AddToGroupAsync (Context.ConnectionId, $"datasource_{ds}"); } catch { }
        }

        public async Task SubscribeToEnhancedWidgetStreaming (int widgetInstanceId, object streamingOptions = null) {
            try {
                string userId = CurrentUserId;
                DashboardWidgetInstance? widgetInstance;
                if (userId == "system") {
                    widgetInstance = await _context.DashboardWidgetInstances.Include (w => w.Template).FirstOrDefaultAsync (w => w.Id == widgetInstanceId && w.IsVisible);
                } else {
                    widgetInstance = await _context.DashboardWidgetInstances.Include (w => w.Template).FirstOrDefaultAsync (w => w.Id == widgetInstanceId && w.UserId == userId && w.IsVisible);
                }
                if (widgetInstance == null) {
                    await Clients.Caller.SendAsync ("EnhancedWidgetStreamingError", new { widgetInstanceId, error = "Widget instance not found or not visible", timestamp = DateTime.UtcNow });
                    return;
                }
                var configuration = new Dictionary<string, object> ();
                try { if (!string.IsNullOrEmpty (widgetInstance.ConfigurationJson)) configuration = JsonConvert.DeserializeObject<Dictionary<string, object>> (widgetInstance.ConfigurationJson) ?? new (); } catch { }
                string mode = GetConfigValue<string> (configuration, "mode", "cumulative");
                if (mode?.ToLower () != "live") return; // silently ignore non-live
                await Groups.AddToGroupAsync (Context.ConnectionId, $"enhanced_widget_{widgetInstanceId}");
                string? dataSource = widgetInstance.DataSource ?? widgetInstance.Template?.DataSource;
                if (!string.IsNullOrEmpty (dataSource)) await Groups.AddToGroupAsync (Context.ConnectionId, $"datasource_{dataSource}");
            } catch { }
        }
        public async Task UnsubscribeFromEnhancedWidgetStreaming (int widgetInstanceId) {
            try { await Groups.RemoveFromGroupAsync (Context.ConnectionId, $"enhanced_widget_{widgetInstanceId}"); } catch { }
        }
    }
}