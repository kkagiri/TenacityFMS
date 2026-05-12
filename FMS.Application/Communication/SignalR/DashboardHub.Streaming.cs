using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.Features.Dashboard.Contracts;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging; // For _logger extension methods

namespace FMS.Application.Communication.SignalR {
    /// <summary>
    /// Streaming & update broadcasting partial for DashboardHub.
    /// Includes dual-send streaming envelope logic with optional suppression for v2 connections.
    /// </summary>
    public partial class DashboardHub : Hub {
        public async Task BroadcastWidgetDataUpdate (int widgetId, string widgetType, object data) {
            try {
                // Send legacy update only to legacy group; envelope goes to all
                await Clients.Group (LegacyGroup).SendAsync ("WidgetDataUpdate", new { widgetId, widgetType, data, timestamp = DateTime.UtcNow });

                var (category, dataSource) = await GetWidgetContextForEnvelope (widgetId);
                var dsMeta = string.IsNullOrEmpty (dataSource) ? null : _dataSourceManager.GetDataSourceMetadata (dataSource);
                var envelope = WidgetEnvelopeBuilder.BuildUpdateUntyped (
                    widgetInstanceId: widgetId,
                    widgetType: widgetType ?? "unknown",
                    category : category ?? "general",
                    dataSource : dataSource ?? string.Empty,
                    mode: "live",
                    timeRange: "live",
                    aggregation: "none",
                    updateType: "stream",
                    data : data ?? new { },
                    metadata : dsMeta == null ? new WidgetMetadata (widgetType ?? "unknown", null, null, null, null) : new WidgetMetadata (
                        DisplayName: dsMeta.DisplayName ?? widgetType ?? "unknown",
                        Unit : dsMeta.Unit,
                        SupportsLive : dsMeta.SupportsLiveData,
                        SupportsHistorical : dsMeta.SupportsHistoricalData,
                        RefreshIntervalSeconds : dsMeta.RefreshIntervalSeconds));
                await Clients.All.SendAsync ("WidgetDataEnvelope", envelope);
                _logger.LogDebug ("Broadcasted streaming widget update (dual/optimized) for {WidgetId}", widgetId);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error broadcasting widget data update");
            }
        }

        public async Task SendIncrementalWidgetUpdate (int widgetInstanceId, object incrementalData) {
            try {
                // Send legacy incremental update only to legacy group; envelope goes to all
                await Clients.Group (LegacyGroup).SendAsync ("WidgetDataUpdate", new { widgetId = widgetInstanceId, data = incrementalData, timestamp = DateTime.UtcNow, updateType = "incremental" });

                var (category, dataSource) = await GetWidgetContextForEnvelope (widgetInstanceId);
                var widgetType = await GetWidgetType (widgetInstanceId) ?? "unknown";
                var dsMeta = string.IsNullOrEmpty (dataSource) ? null : _dataSourceManager.GetDataSourceMetadata (dataSource);
                var envelope = WidgetEnvelopeBuilder.BuildUpdateUntyped (
                    widgetInstanceId: widgetInstanceId,
                    widgetType: widgetType,
                    category: category ?? "general",
                    dataSource : dataSource ?? string.Empty,
                    mode: "live",
                    timeRange: "live",
                    aggregation: "none",
                    updateType: "stream",
                    data : incrementalData ?? new { },
                    metadata : dsMeta == null ? new WidgetMetadata (widgetType, null, null, null, null) : new WidgetMetadata (
                        DisplayName: dsMeta.DisplayName ?? widgetType,
                        Unit : dsMeta.Unit,
                        SupportsLive : dsMeta.SupportsLiveData,
                        SupportsHistorical : dsMeta.SupportsHistoricalData,
                        RefreshIntervalSeconds : dsMeta.RefreshIntervalSeconds));
                await Clients.All.SendAsync ("WidgetDataEnvelope", envelope);
                _logger.LogDebug ("Sent incremental streaming widget update (dual/optimized) for widget {WidgetId}", widgetInstanceId);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error sending incremental widget update for widget {WidgetId}", widgetInstanceId);
            }
        }
    }
}