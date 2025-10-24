using System;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.ConsumtionCmd.Import;
using FMS.Application.Communication.Tracker;
using FMS.Application.Features.PTSDevice.Queries;
using FMS.Application.PTSServices.PumpService;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Communication.SignalR
{

    public class PTSHub : Hub
    {
        private readonly DeviceConnectionTracker _deviceConnectionTracker;
        private readonly IMediator _mediator;
        private readonly IPumpService _pumpService;
        private readonly ILogger<PTSHub> _logger;

        public PTSHub(
            DeviceConnectionTracker deviceConnectionTracker,
            IMediator mediator,
            ILogger<PTSHub> logger)
        {
            _deviceConnectionTracker = deviceConnectionTracker;
            _mediator = mediator;
            _logger = logger;
        }




        #region Connection Management
        public override async Task OnConnectedAsync()
        {
            var connectionId = Context.ConnectionId;
            _logger.LogInformation("PTS Client connected: {ConnectionId}", connectionId);

            try
            {
                // Broadcast current device status summary to the newly connected client
                await BroadcastConnectedDevicesSummary();

                // Broadcast static device list
                await BroadcastPTSDeviceList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during PTS connection setup for {ConnectionId}", connectionId);
            }

            await base.OnConnectedAsync();
        }
        public override async Task OnDisconnectedAsync(Exception exception)
        {
            var connectionId = Context.ConnectionId;
            _logger.LogInformation("PTS Client disconnected: {ConnectionId}. Reason: {Reason}",
                connectionId, exception?.Message ?? "Normal disconnection");

            await base.OnDisconnectedAsync(exception);
        }

        #endregion

        #region  Device status and connection management
        public async Task BroadcastPTSDeviceList()
        {
            try
            {
                var devices = await _mediator.Send(new GetPTSDeviceListQuery());
                await Clients.All.SendAsync("PTSDeviceListUpdate", devices);
            }
            catch (Exception ex)
            {
                // Log the error
                _logger.LogError(ex, "Error broadcasting PTS device list");
            }
        }
        // Health check
        public async Task<string> HealthCheck()
        {
            try
            {
                var deviceCount = await _deviceConnectionTracker.GetConnectedDeviceCount();
                return $"PTS Hub OK - {deviceCount} devices connected";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "PTS Health check failed");
                return "PTS Hub Error";
            }
        }

        // PTS Device Management
        public async Task BroadcastConnectedDevicesSummary()
        {
            try
            {
                var devices = await _deviceConnectionTracker.GetConnectedDevices();
                await Clients.All.SendAsync("ConnectedDevicesStatus", devices);
                _logger.LogTrace("Sent PTS ConnectedDevicesStatus summary.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting connected devices summary");
            }
        }

        public async Task RequestDeviceStatusSummary()
        {
            await BroadcastConnectedDevicesSummary();
        }
        // Request methods
        public async Task RequestDeviceStatus(string deviceId)
        {
            try
            {
                if (string.IsNullOrEmpty(deviceId))
                {
                    await Clients.Caller.SendAsync("Error", "DeviceId is required");
                    return;
                }

                var status = await _deviceConnectionTracker.GetDeviceStatus(deviceId);
                if (status == null)
                {
                    await Clients.Caller.SendAsync("Error", $"Device {deviceId} not found");
                    return;
                }

                await Clients.Caller.SendAsync("DeviceStatusUpdate", new { deviceId, status });
                _logger.LogDebug("Sent device status for {DeviceId} to client {ConnectionId}", deviceId, Context.ConnectionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving device status for {DeviceId}", deviceId);
                await Clients.Caller.SendAsync("Error", "Failed to retrieve device status");
            }
        }

        public async Task RequestAllDevicesStatus()
        {
            try
            {
                var devices = await _deviceConnectionTracker.GetConnectedDevices();
                await Clients.Caller.SendAsync("AllDevicesStatus", devices);
                _logger.LogDebug("Sent all devices status to client {ConnectionId}", Context.ConnectionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all devices status");
                await Clients.Caller.SendAsync("Error", "Failed to retrieve devices status");
            }
        }
        #endregion



        #region pump related Events
        // Upload Status Updates
        public async Task BroadcastUploadStatusUpdate(string deviceId, object status)
        {
            try
            {
                await Clients.All.SendAsync("UploadStatusUpdate", new { deviceId, status });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting upload status update for device {DeviceId}", deviceId);
            }
        }

        // Pump-related events
        public async Task BroadcastNozzleStateChange(string deviceId, object nozzleData)
        {
            try
            {
                await Clients.All.SendAsync("NozzleStateChange", new { deviceId, nozzleData });
                _logger.LogDebug("Broadcasted nozzle state change for device {DeviceId}", deviceId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting nozzle state change");
            }
        }

        public async Task BroadcastFillingStatus(string deviceId, object fillingData)
        {
            try
            {
                await Clients.All.SendAsync("FillingStatus", new { deviceId, fillingData });
                _logger.LogDebug("Broadcasted filling status for device {DeviceId}", deviceId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting filling status");
            }
        }

        public async Task BroadcastPumpTransactionCompleted(string deviceId, object transactionData)
        {
            try
            {
                await Clients.All.SendAsync("PumpTransactionCompleted", new { deviceId, transactionData });
                _logger.LogDebug("Broadcasted pump transaction completed for device {DeviceId}", deviceId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting pump transaction completed");
            }
        }

        public async Task BroadcastPumpOffline(string deviceId)
        {
            try
            {
                await Clients.All.SendAsync("PumpOffline", new { deviceId });
                _logger.LogDebug("Broadcasted pump offline for device {DeviceId}", deviceId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting pump offline");
            }
        }

        // RFID/Tag events
        public async Task BroadcastRFIDTag(string deviceId, object tagData)
        {
            try
            {
                await Clients.All.SendAsync("ReceiveRFIDTag", new { deviceId, tagData });
                _logger.LogDebug("Broadcasted RFID tag for device {DeviceId}", deviceId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting RFID tag");
            }
        }

        public async Task BroadcastUploadStatusTagRead(string deviceId, object tagData)
        {
            try
            {
                await Clients.All.SendAsync("UploadstatusTagRead", new { deviceId, tagData });
                _logger.LogDebug("Broadcasted upload status tag read for device {DeviceId}", deviceId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting upload status tag read");
            }
        }

        // Probe and Reader status
        public async Task BroadcastProbeStatusUpdate(string deviceId, object probeData)
        {
            try
            {
                await Clients.All.SendAsync("ProbeStatusUpdate", new { deviceId, probeData });
                _logger.LogDebug("Broadcasted probe status update for device {DeviceId}", deviceId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting probe status update");
            }
        }

        public async Task BroadcastReaderStatusUpdate(string deviceId, object readerData)
        {
            try
            {
                await Clients.All.SendAsync("ReaderStatusUpdate", new { deviceId, readerData });
                _logger.LogDebug("Broadcasted reader status update for device {DeviceId}", deviceId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting reader status update");
            }
        }

        // Fueling Events
        public async Task BroadcastFuelingEvent(string deviceId, object fuelingData)
        {
            try
            {
                await Clients.All.SendAsync("FuelingEvent", new { deviceId, fuelingData });
                _logger.LogDebug("Broadcasted fueling event for device {DeviceId}", deviceId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting fueling event");
            }
        }



        #endregion

    }
}