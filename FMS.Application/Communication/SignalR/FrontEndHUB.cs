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
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Communication.SignalR {

    public class ConnectionMonitor {
        private readonly ConcurrentDictionary<string, DateTime> _connections = new ();
        private readonly ILogger<ConnectionMonitor> _logger;

        public ConnectionMonitor (ILogger<ConnectionMonitor> logger) {
            _logger = logger;
        }

        public void AddConnection (string connectionId) {
            _connections.TryAdd (connectionId, DateTime.UtcNow);
            _logger.LogInformation ("Added connection {ConnectionId}. Total connections: {Count}",
                connectionId, _connections.Count);
        }

        public void RemoveConnection (string connectionId) {
            if (_connections.TryRemove (connectionId, out var connectedAt)) {
                _logger.LogInformation ("Removed connection {ConnectionId}. Duration: {Duration}",
                    connectionId, DateTime.UtcNow - connectedAt);
            }
        }
    }

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
    }
}