using FMS.Application.Communication;
using FMS.Application.Communication.SignalR;
using FMS.Application.Communication.Tracker;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.WebClient.Services
{
    public class StatusBroadcastService : BackgroundService
    {
        private readonly ILogger<StatusBroadcastService> _logger;
        private readonly IHubContext<FrontEndHub> _hubContext;
        private readonly DeviceConnectionTracker _connectionTracker;
        private readonly DeviceStatusHelper _deviceStatusHelper;
        private readonly TimeSpan _broadcastInterval = TimeSpan.FromSeconds(5); // Broadcast every 5 seconds

        public StatusBroadcastService(
            ILogger<StatusBroadcastService> logger,
            IHubContext<FrontEndHub> hubContext,
            DeviceConnectionTracker connectionTracker,
            DeviceStatusHelper deviceStatusHelper)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _hubContext = hubContext ?? throw new ArgumentNullException(nameof(hubContext));
            _connectionTracker = connectionTracker ?? throw new ArgumentNullException(nameof(connectionTracker));
            _deviceStatusHelper = deviceStatusHelper ?? throw new ArgumentNullException(nameof(deviceStatusHelper));
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("StatusBroadcastService starting");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await BroadcastDeviceStatusUpdates(stoppingToken);
                    await Task.Delay(_broadcastInterval, stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    // Normal shutdown, don't log as error
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in status broadcast service");
                    await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
                }
            }

            _logger.LogInformation("StatusBroadcastService stopping");
        }

        private async Task BroadcastDeviceStatusUpdates(CancellationToken stoppingToken)
        {
            try
            {
                // Get all connected devices
                var connectedDevices = await _connectionTracker.GetConnectedDevices();

                if (connectedDevices.WebSocketConnections.Count == 0)
                {
                    _logger.LogDebug("No connected devices to broadcast status for");
                    return;
                }

                _logger.LogDebug("Broadcasting status for {Count} devices", connectedDevices.WebSocketConnections.Count);

                // For each WebSocket connected device, get and broadcast status
                foreach (var device in connectedDevices.WebSocketConnections)
                {
                    if (stoppingToken.IsCancellationRequested) break;

                    try
                    {
                        var deviceId = device.DeviceId;
                        var status = await _deviceStatusHelper.GetDeviceStatusAsync(deviceId);

                        if (status == null)
                        {
                            _logger.LogDebug("No status found in Redis for device {DeviceId}", deviceId);
                            continue;
                        }

                        // Check if status is recent (within last 30 seconds)
                        var timestamp = await _deviceStatusHelper.GetDeviceStatusTimestampAsync(deviceId);
                        if (timestamp == null || DateTime.UtcNow - timestamp.Value > TimeSpan.FromSeconds(30))
                        {
                            _logger.LogDebug("Status for device {DeviceId} is too old (timestamp: {Timestamp})",
                                deviceId, timestamp);
                            continue;
                        }

                        // Format the response to match what the frontend expects
                        var statusUpdate = new
                        {
                            deviceId = deviceId,
                            timestamp = timestamp ?? DateTime.UtcNow,
                            status = new
                            {
                                configurationId = status.ConfigurationId,
                                dateTime = status.DateTime,
                                firmwareDateTime = status.FirmwareDateTime,
                                startupSeconds = status.StartupSeconds,
                                batteryVoltage = status.BatteryVoltage,
                                cpuTemperature = status.CpuTemperature,
                                ptsPowerDownDetected = status.PtsPowerDownDetected,
                                sdMounted = status.SdMounted,
                                pumps = status.Pumps, // Send the whole Pumps object
                                probes = status.Probes, // Send the whole Probes object
                                readers = status.Readers, // Send the whole Readers object
                                fuelGrades = status.FuelGrades
                            }
                        };

                        // Broadcast to all connected clients
                        await _hubContext.Clients.All.SendAsync("UploadStatusUpdate", statusUpdate, cancellationToken: stoppingToken);
                        _logger.LogDebug("Broadcast status update for device {DeviceId} from Redis", deviceId);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error broadcasting status for device {DeviceId}", device.DeviceId);
                        // Continue with other devices
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in BroadcastDeviceStatusUpdates");
                throw;
            }
        }
    }
}