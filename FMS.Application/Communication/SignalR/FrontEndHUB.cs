using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.ConsumtionCmd.Import;
using FMS.Application.Communication.Tracker;
using FMS.Application.Features.PTSDevice.Queries;
using FMS.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Communication.SignalR {

    public class FrontEndHub : Hub {
        private readonly DeviceConnectionTracker _deviceConnectionTracker;
        private readonly IMediator _mediator;
        private readonly ConnectionMonitor _connectionMonitor;
        private readonly ILogger<FrontEndHub> _logger;
        private readonly DeviceStatusHelper _deviceStatusHelper;

        public FrontEndHub (
            DeviceConnectionTracker deviceConnectionTracker,
            IMediator mediator,
            ConnectionMonitor connectionMonitor,
            ILogger<FrontEndHub> logger,
            DeviceStatusHelper deviceStatusHelper) {
            _deviceConnectionTracker = deviceConnectionTracker;
            _mediator = mediator;
            _connectionMonitor = connectionMonitor;
            _logger = logger;
            _deviceStatusHelper = deviceStatusHelper;
        }

        public override async Task OnConnectedAsync () {
            var connectionId = Context.ConnectionId;
            _logger.LogInformation ("Client connected: {ConnectionId}", connectionId);
            _connectionMonitor.AddConnection (connectionId);

            try {
                // Broadcast current device status summary to the newly connected client
                await BroadcastConnectedDevicesSummary ();
                // Broadcast static list
                await BroadcastPTSDeviceList ();
            } catch (Exception ex) {
                _logger.LogError (ex, "Error during connection setup for {ConnectionId}", connectionId);
            }

            await base.OnConnectedAsync ();
        }

        public override async Task OnDisconnectedAsync (Exception exception) {
            var connectionId = Context.ConnectionId;
            _logger.LogInformation ("Client disconnected: {ConnectionId}. Reason: {Reason}",
                connectionId,
                exception?.Message ?? "Normal disconnection");

            _connectionMonitor.RemoveConnection (connectionId);

            await base.OnDisconnectedAsync (exception);
        }

        // Renamed: Sends the full summary list
        public async Task BroadcastConnectedDevicesSummary () {
            var devices = await _deviceConnectionTracker.GetConnectedDevices ();
            // Send only to the caller? Or All? Sending to All for now.
            await Clients.All.SendAsync ("ConnectedDevicesStatus", devices);
            _logger.LogTrace ("Sent full ConnectedDevicesStatus summary.");
        }

        // Optional: Method that can be called from client to request device status summary
        public async Task RequestDeviceStatusSummary () {
            await BroadcastConnectedDevicesSummary ();
        }

        // New method to broadcast fuel import progress updates
        public async Task BroadcastFuelImportProgress (ImportProgressInfo progressInfo) {
            try {
                await Clients.All.SendAsync ("FuelImportProgress", progressInfo);
                _logger.LogDebug ("Fuel import progress update: {Status} - {Processed}/{Total} records ({Percentage}%)",
                    progressInfo.Status,
                    progressInfo.ProcessedRecords,
                    progressInfo.TotalRecords,
                    progressInfo.ProgressPercentage);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error broadcasting fuel import progress");
            }
        }

        public async Task BroadcastDashboardMetrics (object metrics) {
            await Clients.All.SendAsync ("DashboardMetricsUpdate", metrics);
        }

        // Enhanced method to broadcast key statistics widget updates
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

        // Method to broadcast specific widget data updates
        public async Task BroadcastWidgetDataUpdate (int widgetId, string widgetType, object data) {
            try {
                await Clients.All.SendAsync ("WidgetDataUpdate", new {
                    widgetId = widgetId,
                        widgetType = widgetType,
                        data = data,
                        timestamp = DateTime.UtcNow
                });
                _logger.LogDebug ("Broadcasted widget data update for widget {WidgetId} ({WidgetType})", widgetId, widgetType);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error broadcasting widget data update for widget {WidgetId}", widgetId);
            }
        }

        // Method to broadcast ticker value updates (for real-time counters)
        public async Task BroadcastTickerUpdate (string metricType, decimal value, string unit, DateTime timestamp) {
            try {
                await Clients.All.SendAsync ("TickerUpdate", new {
                    metricType = metricType,
                        value = value,
                        unit = unit,
                        timestamp = timestamp,
                        formattedValue = FormatTickerValue (value, unit)
                });
                _logger.LogTrace ("Broadcasted ticker update: {MetricType} = {Value} {Unit}", metricType, value, unit);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error broadcasting ticker update for {MetricType}", metricType);
            }
        }

        // Method to broadcast graph data updates
        public async Task BroadcastGraphUpdate (string graphId, string graphType, object dataPoints) {
            try {
                await Clients.All.SendAsync ("GraphUpdate", new {
                    graphId = graphId,
                        graphType = graphType,
                        dataPoints = dataPoints,
                        timestamp = DateTime.UtcNow
                });
                _logger.LogDebug ("Broadcasted graph update for {GraphId} ({GraphType})", graphId, graphType);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error broadcasting graph update for {GraphId}", graphId);
            }
        }

        // Method to broadcast dashboard layout changes
        public async Task BroadcastDashboardLayoutUpdate (string userId, object layoutData) {
            try {
                await Clients.All.SendAsync ("DashboardLayoutUpdate", new {
                    userId = userId,
                        layout = layoutData,
                        timestamp = DateTime.UtcNow
                });
                _logger.LogDebug ("Broadcasted dashboard layout update for user {UserId}", userId);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error broadcasting dashboard layout update");
            }
        }

        // Method for clients to subscribe to specific widget updates
        public async Task SubscribeToWidgetUpdates (int widgetId) {
            try {
                await Groups.AddToGroupAsync (Context.ConnectionId, $"widget_{widgetId}");
                _logger.LogInformation ("Client {ConnectionId} subscribed to widget {WidgetId} updates",
                    Context.ConnectionId, widgetId);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error subscribing client to widget updates");
            }
        }

        // Method for clients to unsubscribe from specific widget updates
        public async Task UnsubscribeFromWidgetUpdates (int widgetId) {
            try {
                await Groups.RemoveFromGroupAsync (Context.ConnectionId, $"widget_{widgetId}");
                _logger.LogInformation ("Client {ConnectionId} unsubscribed from widget {WidgetId} updates",
                    Context.ConnectionId, widgetId);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error unsubscribing client from widget updates");
            }
        }

        // Method for clients to subscribe to specific metric updates
        public async Task SubscribeToMetricUpdates (string metricType) {
            try {
                await Groups.AddToGroupAsync (Context.ConnectionId, $"metric_{metricType}");
                _logger.LogInformation ("Client {ConnectionId} subscribed to {MetricType} updates",
                    Context.ConnectionId, metricType);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error subscribing client to metric updates");
            }
        }

        // Method for clients to unsubscribe from specific metric updates
        public async Task UnsubscribeFromMetricUpdates (string metricType) {
            try {
                await Groups.RemoveFromGroupAsync (Context.ConnectionId, $"metric_{metricType}");
                _logger.LogInformation ("Client {ConnectionId} unsubscribed from {MetricType} updates",
                    Context.ConnectionId, metricType);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error unsubscribing client from metric updates");
            }
        }

        // Helper method to format ticker values for display
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

        // Method to broadcast upload status updates (likely called from UploadStatusCommand handler)
        public async Task BroadcastUploadStatusUpdate (string deviceId, object status) {
            // Broadcast to all clients or to specific groups depending on your needs
            await Clients.All.SendAsync ("UploadStatusUpdate", new { deviceId, status });
        }

        // Method to broadcast the static PTS device list (on connect or update)
        public async Task BroadcastPTSDeviceList () {
            try {
                var devices = await _mediator.Send (new GetPTSDeviceListQuery ());
                await Clients.All.SendAsync ("PTSDeviceListUpdate", devices);
            } catch (Exception ex) {
                // Log the error
                _logger.LogError (ex, "Error broadcasting PTS device list");
            }
        }

        // Health check method (unchanged)
        public async Task<string> HealthCheck () {
            try {
                // Get current connection status
                var connectionId = Context.ConnectionId;
                var timestamp = DateTime.UtcNow;

                _logger.LogTrace ($"Health check received from connection {connectionId} at {timestamp}");

                // Return success response
                return JsonSerializer.Serialize (new {
                    status = "healthy",
                        timestamp = timestamp,
                        connectionId = connectionId
                });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error during health check");
                throw;
            }
        }

        // New method to retrieve device status from Redis and send to client
        public async Task RequestDeviceStatus (string deviceId) {
            try {
                if (string.IsNullOrEmpty (deviceId)) {
                    _logger.LogWarning ("Client requested status for null or empty deviceId");
                    return;
                }

                _logger.LogInformation ("Client requested status for device: {DeviceId}", deviceId);

                // Get the status from Redis
                var status = await _deviceStatusHelper.GetDeviceStatusAsync (deviceId);
                if (status == null) {
                    _logger.LogWarning ("No status found in Redis for device {DeviceId}", deviceId);
                    return;
                }

                // Get the timestamp
                var timestamp = await _deviceStatusHelper.GetDeviceStatusTimestampAsync (deviceId);

                // Format the response to match what the frontend expects
                var statusUpdate = new {
                    deviceId = deviceId,
                    timestamp = timestamp ?? DateTime.UtcNow,
                    status = new {
                    configurationId = status.ConfigurationId,
                    dateTime = status.DateTime,
                    firmwareDateTime = status.FirmwareDateTime,
                    startupSeconds = status.StartupSeconds,
                    batteryVoltage = status.BatteryVoltage,
                    cpuTemperature = status.CpuTemperature,
                    ptsPowerDownDetected = status.PtsPowerDownDetected,
                    sdMounted = status.SdMounted,
                    pumps = status.Pumps,
                    probes = status.Probes,
                    readers = status.Readers,
                    fuelGrades = status.FuelGrades
                    }
                };

                // Send to the requesting client only
                await Clients.Caller.SendAsync ("UploadStatusUpdate", statusUpdate);
                _logger.LogInformation ("Sent status from Redis for device {DeviceId} to client", deviceId);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving device status for {DeviceId}", deviceId);
            }
        }

        // New method to retrieve and broadcast status for all connected devices
        public async Task<object> RequestAllDevicesStatus () {
            try {
                _logger.LogInformation ("Client requested status for all connected devices");

                // Get all connected devices
                var connectedDevices = await _deviceConnectionTracker.GetConnectedDevices ();
                var summary = new {
                    websocketCount = connectedDevices.WebSocketConnections.Count,
                    httpCount = connectedDevices.HttpConnections.Count,
                    totalCount = connectedDevices.TotalConnectedDevices,
                    wsDeviceIds = connectedDevices.WebSocketConnections.Select (d => d.DeviceId).ToList (),
                    httpDeviceIds = connectedDevices.HttpConnections.Select (d => d.DeviceId).ToList ()
                };

                // For each connected device, fetch and broadcast its status
                // foreach (var device in connectedDevices.WebSocketConnections) {
                //     try {
                //         var deviceId = device.DeviceId;
                //         await RequestDeviceStatus (deviceId);
                //     } catch (Exception ex) {
                //         _logger.LogError (ex, "Error processing status for device in batch request");
                //         // Continue with other devices
                //     }
                // }

                _logger.LogInformation ("Found {Count} total connected devices", summary.totalCount);

                return summary;

            } catch (Exception ex) {
                _logger.LogError (ex, "Error processing all devices status request");
                return null;
            }
        }

        // This method might become obsolete if the Tracker broadcasts directly
        // Or could be kept for direct client->server status updates if needed.
        // For now, let's comment it out as the tracker handles broadcasts.
        /*
        public async Task UpdateDeviceStatus(string deviceId, string status)
        {
            try
            {
                // This might interact with the tracker or directly broadcast
                 await _deviceConnectionTracker.UpdateWebSocketConnection(deviceId, Context.GetHttpContext()?.Connection?.RemoteIpAddress?.ToString() ?? "unknown");
                // The tracker now broadcasts internally, so this might not be needed here.
                 // await BroadcastConnectedDevicesSummary();
            }
            catch (Exception ex)
            {
                 _logger.LogError(ex, "Error updating device status for {DeviceId}", deviceId);
                throw;
            }
        }
        */

        // Method to broadcast tank volume history updates
        public async Task BroadcastTankVolumeHistoryUpdate (object tankVolumeData) {
            try {
                await Clients.All.SendAsync ("TankVolumeHistoryUpdate", tankVolumeData);
                _logger.LogDebug ("Tank volume history update broadcasted: {Data}", tankVolumeData);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error broadcasting tank volume history update");
            }
        }

        // Method to broadcast tank delivery updates
        public async Task BroadcastTankDeliveryUpdate (object deliveryData) {
            try {
                await Clients.All.SendAsync ("TankDeliveryUpdate", deliveryData);
                _logger.LogDebug ("Tank delivery update broadcasted: {Data}", deliveryData);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error broadcasting tank delivery update");
            }
        }

        // Method to broadcast consumption data updates
        public async Task BroadcastConsumptionUpdate (object consumptionData) {
            try {
                await Clients.All.SendAsync ("ConsumptionUpdate", consumptionData);
                _logger.LogDebug ("Consumption update broadcasted: {Data}", consumptionData);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error broadcasting consumption update");
            }
        }

        // Method to broadcast tank stock changes (current stock levels)
        public async Task BroadcastTankStockUpdate (object tankStockData) {
            try {
                await Clients.All.SendAsync ("TankStockUpdate", tankStockData);
                _logger.LogDebug ("Tank stock update broadcasted: {Data}", tankStockData);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error broadcasting tank stock update");
            }
        }

        // Method to broadcast stock adjustment updates
        public async Task BroadcastStockAdjustmentUpdate (object adjustmentData) {
            try {
                await Clients.All.SendAsync ("StockAdjustmentUpdate", adjustmentData);
                _logger.LogDebug ("Stock adjustment update broadcasted: {Data}", adjustmentData);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error broadcasting stock adjustment update");
            }
        }

        // Method to broadcast comprehensive tank dashboard data
        public async Task BroadcastTankDashboardUpdate (object dashboardData) {
            try {
                await Clients.All.SendAsync ("TankDashboardUpdate", dashboardData);
                _logger.LogDebug ("Tank dashboard update broadcasted");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error broadcasting tank dashboard update");
            }
        }

        // Method for clients to request fresh tank data for a specific site
        public async Task RequestTankDataUpdate (string siteId, string startDate, string endDate) {
            try {
                _logger.LogInformation ("Client requested tank data update for site: {SiteId}, date range: {StartDate} - {EndDate}",
                    siteId, startDate, endDate);

                // This will trigger the backend to send fresh data
                // The actual data fetching should be handled by the caller service
                await Clients.Caller.SendAsync ("TankDataRefreshRequested", new {
                    siteId,
                    startDate,
                    endDate,
                    timestamp = DateTime.UtcNow
                });
            } catch (Exception ex) {
                _logger.LogError (ex, "Error processing tank data refresh request");
            }
        }

        // Method to broadcast active alarm creation
        public async Task BroadcastActiveAlarmCreated (object alarmData) {
            try {
                await Clients.All.SendAsync ("ActiveAlarmCreated", alarmData);
                _logger.LogInformation ("Broadcasted active alarm creation: {AlarmId}",
                    alarmData.GetType ().GetProperty ("Id")?.GetValue (alarmData));
            } catch (Exception ex) {
                _logger.LogError (ex, "Error broadcasting active alarm creation");
            }
        }

        // Method to broadcast active alarm updates
        public async Task BroadcastActiveAlarmUpdated (object alarmData) {
            try {
                await Clients.All.SendAsync ("ActiveAlarmUpdated", alarmData);
                _logger.LogInformation ("Broadcasted active alarm update: {AlarmId}",
                    alarmData.GetType ().GetProperty ("Id")?.GetValue (alarmData));
            } catch (Exception ex) {
                _logger.LogError (ex, "Error broadcasting active alarm update");
            }
        }

        // Method to broadcast alarm state changes
        public async Task BroadcastActiveAlarmStateChanged (int alarmId, string newState) {
            try {
                await Clients.All.SendAsync ("ActiveAlarmStateChanged", new { alarmId, newState });
                _logger.LogInformation ("Broadcasted alarm state change: Alarm {AlarmId} -> {NewState}", alarmId, newState);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error broadcasting alarm state change");
            }
        }

        // Method to broadcast notification creation
        public async Task BroadcastNotificationCreated (object notificationData) {
            try {
                await Clients.All.SendAsync ("NotificationCreated", notificationData);
                _logger.LogDebug ("Broadcasted notification creation");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error broadcasting notification");
            }
        }

        // Method for testing alarm broadcasts
        public async Task BroadcastAlarmTest (object testData) {
            try {
                await Clients.All.SendAsync ("AlarmTestBroadcast", testData);
                _logger.LogInformation ("Broadcasted alarm test: {Message}",
                    testData.GetType ().GetProperty ("message")?.GetValue (testData));
            } catch (Exception ex) {
                _logger.LogError (ex, "Error broadcasting alarm test");
            }
        }

        // Method to get alarm statistics (for testing)
        public async Task RequestAlarmStatistics () {
            try {
                // This would typically call a service to get statistics
                var mockStats = new {
                    totalActive = 15,
                    critical = 3,
                    unacknowledged = 7,
                    resolvedToday = 5,
                    timestamp = DateTime.UtcNow
                };

                await Clients.Caller.SendAsync ("AlarmStatisticsUpdate", mockStats);
                _logger.LogDebug ("Sent alarm statistics to client");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error sending alarm statistics");
            }
        }
    }
}