using FMS.Application.Command.PTSCommand.PumpCommands;
using FMS.Application.Common;
using FMS.Application.Common.PTSResponse;
using FMS.Application.Communication.HttpPolling;
using FMS.Application.Communication.SignalR;
using FMS.Application.Events.Pump;
using FMS.Application.Infrastructure.DistCacheTracker;
using FMS.Application.ModelsDTOs.ATG.Common;
using FMS.Application.PTSServices.PumpService;
using FMS.Domain.Entities.PTS;
using FMS.Domain.Entities.PTS.Enums;
using FMS.Domain.Entities.PTS.PTSStatus;
using FMS.Domain.Entities.PTS.PTSStatus.ProbeStatus;
using FMS.Domain.Entities.PTS.PTSStatus.PumpStatus;
using FMS.Persistence.DataAccess;
using FMS.PTS.WindowsService.Services.Pump;
//using FMS.Services.Helper;
using MediatR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using StackExchange.Redis;
using FMS.Application.Communication;

namespace FMS.Application.Command.PTSCommand.UploadStatusCommands
{

    public record UploadStatusCommand : IRequest<CommandResult>
    {
        public string? DeviceId { get; init; }

        public UploadStatus? UploadStatus { get; init; }

    }


    public class UploadStatusCommandHandler : IRequestHandler<UploadStatusCommand, CommandResult>
    {


        private readonly ILogger<UploadStatusCommandHandler> _logger;
        private readonly IPendingCommandRepository _pendingCommandRepo;
        private readonly IAuthorizationStateTracker _authTracker;
        private readonly GpsdataContext _context;
        private readonly IHubContext<FrontEndHub> _hubContext;
        private readonly IMediator _mediator;
        private readonly IDatabase _redisDb; //Cursor
        private readonly DeviceConnectionTracker _connectionTracker; //Cursor


        public UploadStatusCommandHandler(
            IHubContext<FrontEndHub> hubContext,
            GpsdataContext context,
            IMediator mediator,
            ILogger<UploadStatusCommandHandler> logger,
            IPendingCommandRepository pendingCommandRepository,
            IAuthorizationStateTracker authorizationState,
            IConnectionMultiplexer redisConnection, //Cursor
            DeviceConnectionTracker connectionTracker) //Cursor
        {
            _hubContext = hubContext;
            _mediator = mediator;
            _logger = logger;
            _pendingCommandRepo = pendingCommandRepository;
            _authTracker = authorizationState;
            _context = context;
            _redisDb = redisConnection.GetDatabase(); //Cursor
            _connectionTracker = connectionTracker; //Cursor
        }




        public async Task<CommandResult> Handle(UploadStatusCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var uploadstatus = request.UploadStatus;
                var deviceId = request.DeviceId;

                if (uploadstatus == null)
                {
                    _logger.LogWarning("No status data received for device {DeviceId}", deviceId);
                    return CommandResult.Failed("No status data received");
                }

                // Broadcast ONLY the complete upload status update
                await BroadcastUploadStatusUpdate(deviceId, uploadstatus);

                // Store the status update in Redis //Cursor
                await StoreUploadStatusInRedis(deviceId, uploadstatus); //Cursor

                // Update the last activity time for the WebSocket connection
                if (!string.IsNullOrEmpty(deviceId))
                {
                    await _connectionTracker.UpdateWebSocketLastMessageTime(deviceId);
                }

                // Process specific components INTERNALLY (e.g., update auth state)
                // but DO NOT broadcast granular events from here anymore.
                // if (uploadstatus?.Pumps != null)
                // {
                //     await ProcessLivePumpStatusInternally(deviceId!, uploadstatus.Pumps);
                // }

                // // Optional: Internal processing for probes/readers - NO Hub calls
                //  if (uploadstatus?.Probes != null)
                //  {
                //      await ProcessLiveProbeStatusInternalLogic(deviceId!, uploadstatus.Probes);
                //  }
                //  if (uploadstatus?.Readers != null)
                //  {
                //      await ProcessLiveReaderStatusInternalLogic(deviceId!, uploadstatus.Readers);
                //  }

                return CommandResult.Succeeded("OK", null!);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing status update");
                throw;
            }
        }

        // New method to store the upload status in Redis //Cursor
        private async Task StoreUploadStatusInRedis(string deviceId, UploadStatus status)
        {
            try
            {
                if (string.IsNullOrEmpty(deviceId) || status == null)
                {
                    _logger.LogWarning("Cannot store upload status in Redis: device ID or status is null");
                    return;
                }

                var redisKey = $"device:{deviceId}:status";
                var statusJson = JsonSerializer.Serialize(status);

                await _redisDb.StringSetAsync(
                    redisKey,
                    statusJson,
                    expiry: TimeSpan.FromMinutes(30) // Keep status for 30 minutes
                );

                // Also set a timestamp key to track when the status was last updated
                await _redisDb.StringSetAsync(
                    $"device:{deviceId}:status:timestamp",
                    DateTime.UtcNow.ToString("o"),
                    expiry: TimeSpan.FromMinutes(30)
                );

                _logger.LogInformation("Stored UploadStatus in Redis for device {DeviceId}", deviceId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error storing upload status in Redis for device {DeviceId}", deviceId);
                // Don't rethrow - we still want to continue processing if Redis storage fails
            }
        }

        // Keep this method for broadcasting the full status
        private async Task BroadcastUploadStatusUpdate(string deviceId, UploadStatus status)
        {
            try
            {
                var statusUpdate = new
                {
                    deviceId = deviceId,
                    timestamp = DateTime.UtcNow,
                    status = new // Pass the full nested status object
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

                await _hubContext.Clients.All.SendAsync("UploadStatusUpdate", statusUpdate);
                 _logger.LogInformation("[Broadcast] Sent UploadStatusUpdate for {DeviceId}", deviceId);
            }
            catch (Exception ex)
            {
                 _logger.LogError(ex, "Error broadcasting upload status update for device {DeviceId}", deviceId);
            }
        }

        // Internal processing logic - NO Hub calls
        private Task ProcessLiveReaderStatusInternalLogic(string deviceId, Domain.Entities.PTS.PTSStatus.ReaderStatus.ReaderStatus readerStatus)
        {
             _logger.LogTrace("[Internal] Processing Reader Status for {DeviceId}", deviceId);
             // Example: Log online/offline readers
             // if (readerStatus?.OnlineStatus?.Ids != null) { /* Log IDs */ }
             // if (readerStatus?.OfflineStatus?.Ids != null) { /* Log IDs */ }
             return Task.CompletedTask;
        }

        // Internal processing logic - NO Hub calls
        private Task ProcessLiveProbeStatusInternalLogic(string deviceId, Domain.Entities.PTS.PTSStatus.ProbeStatus.ProbeStatus probeStatus)
        {
             _logger.LogTrace("[Internal] Processing Probe Status for {DeviceId}", deviceId);
             // Example: Log online/offline probes
             // if (probeStatus.OnlineStatus?.Ids != null) { /* Log IDs and maybe measurements */ }
             // if (probeStatus.OfflineStatus?.Ids != null) { /* Log IDs */ }
             return Task.CompletedTask;
        }

        // Renamed to indicate internal processing only
        private async Task ProcessLivePumpStatusInternally(string deviceId, Domain.Entities.PTS.PTSStatus.PumpStatus.PumpStatus pumpStatus)
        {
             _logger.LogTrace("[Internal] Processing Pump Status for {DeviceId}", deviceId);
            // Handle Idle Status - Check for nozzles up and tags (for internal logic like events/auth)
            if (pumpStatus.IdleStatus != null)
            {
                await ProcessIdleStatusInternalLogic(deviceId, pumpStatus.IdleStatus);
            }

            // Handle Filling Status (update auth state)
            if (pumpStatus.FillingStatus != null)
            {
                await ProcessFillingStatusInternalLogic(deviceId, pumpStatus.FillingStatus);
            }

            // Handle End of Transaction (update auth state)
            if (pumpStatus.EndOfTransactionStatus != null)
            {
                await ProcessEndOfTransactionStatusInternalLogic(deviceId, pumpStatus.EndOfTransactionStatus);
            }

            // Handle Offline Status (update auth state)
            if (pumpStatus.OfflineStatus != null)
            {
                await ProcessOfflineStatusInternalLogic(deviceId, pumpStatus.OfflineStatus);
            }
        }

        // Renamed, only internal logic, NO hub broadcast
        private async Task ProcessOfflineStatusInternalLogic(string deviceId, Domain.Entities.PTS.PTSStatus.PumpStatus.PumpOfflineStatus offlineStatus)
        {
            if (offlineStatus.Ids == null || !offlineStatus.Ids.Any()) return;
            // Iterate through nullable ints, check HasValue before using Value
            foreach (var pumpIdNullable in offlineStatus.Ids)
            {
                 if (!pumpIdNullable.HasValue) continue; // Skip null entries
                 var pumpId = pumpIdNullable.Value; // Get the non-nullable int value

                 try
                 {
                    await _authTracker.ClearAuthorization(deviceId, pumpId);
                    _logger.LogInformation("[Internal] Cleared auth for offline Pump {PumpId} on Device {DeviceId}", pumpId, deviceId);
                 } catch (Exception ex) {
                     _logger.LogError(ex, "[Internal] Error clearing auth for offline Pump {PumpId} on Device {DeviceId}", pumpId, deviceId);
                 }
            }
            // NO _hubContext call here
        }

        // Renamed, only internal logic (e.g., publishing MediatR events), NO hub broadcast
        private async Task ProcessIdleStatusInternalLogic(string deviceId, IdleStatus idleStatus)
        {
            // if (idleStatus.Ids == null || !idleStatus.Ids.Any()) return;

            // for (int i = 0; i < idleStatus.Ids.Count; i++)
            // {
            //     var pumpIdNullable = idleStatus.Ids[i];
            //     if (!pumpIdNullable.HasValue) continue; // Skip null entries
            //     var pumpId = pumpIdNullable.Value; // Get the non-nullable int value

            //     if (pumpId < 1 || pumpId > 50) continue; // Validate range

            //     // Internal: Process Nozzle State for MediatR event
            //     if (idleStatus.NozzlesUp?.Count > i)
            //     {
            //         var nozzleNumber = idleStatus.NozzlesUp[i];
            //         if (nozzleNumber >= 1 && nozzleNumber <= 6) // Check valid range for nozzles up
            //         {
            //             try
            //             {
            //                 var nozzleEvent = new NozzleStateChangeEvent(
            //                     deviceId: deviceId,
            //                     pumpId: pumpId,
            //                     nozzleNumber: nozzleNumber
            //                 );
            //                 // Add last transaction details if available
            //                 if (idleStatus.LastTransactions?.Count > i && idleStatus.LastTransactions[i] && idleStatus.LastTransactions[i] > 0)
            //                 {
            //                      nozzleEvent = nozzleEvent with
            //                      {
            //                          LastNozzle = idleStatus.LastNozzles?.ElementAtOrDefault(i),
            //                          LastTransaction = idleStatus.LastTransactions[i], // Use .Value for nullable decimal?
            //                          LastAmount = idleStatus.LastAmounts?.ElementAtOrDefault(i),
            //                          LastVolume = idleStatus.LastVolumes?.ElementAtOrDefault(i),
            //                          LastPrice = idleStatus.LastPrices?.ElementAtOrDefault(i)
            //                      };
            //                 }
            //                 await _mediator.Publish(nozzleEvent); // Publish internal event
            //                  _logger.LogTrace("[Internal] Published NozzleStateChange event for Pump {PumpId}, Nozzle {Nozzle}", pumpId, nozzleNumber);
            //             } catch (Exception ex) {
            //                  _logger.LogError(ex, "[Internal] Error publishing NozzleStateChange event for Pump {PumpId}", pumpId);
            //             }
            //              // NO _hubContext call here
            //         }
            //     }

            //     // Internal: Process Tag Read for MediatR event
            //     if (idleStatus.Tags?.Count > i && !string.IsNullOrEmpty(idleStatus.Tags[i]?.ToString()))
            //     {
            //         var tag = idleStatus.Tags[i].ToString();
            //         if (tag.Length <= 48 && IsValidHexString(tag))
            //         {
            //              try
            //              {
            //                  var tagEvent = new TagReadEvent(deviceId, pumpId, idleStatus.NozzlesUp?.ElementAtOrDefault(i) ?? 0, tag);
            //                  await _mediator.Publish(tagEvent); // Publish internal event
            //                   _logger.LogTrace("[Internal] Published TagReadEvent event for Pump {PumpId}", pumpId);
            //              } catch (Exception ex) {
            //                   _logger.LogError(ex, "[Internal] Error publishing TagReadEvent event for Pump {PumpId}", pumpId);
            //              }
            //             // NO _hubContext call here
            //         }
            //     }
            // }
        }

        // Renamed, only internal logic (update auth state), NO hub broadcast
        private async Task ProcessFillingStatusInternalLogic(string deviceId, FillingStatus fillingStatus)
        {
            if (fillingStatus.Ids == null) return;
            for (int i = 0; i < fillingStatus.Ids.Count; i++)
            {
                var pumpIdNullable = fillingStatus.Ids[i];
                if (!pumpIdNullable.HasValue) continue; // Skip null entries
                var pumpId = pumpIdNullable.Value; // Get the non-nullable int value

                if (pumpId < 1 || pumpId > 50) continue; // Validate range

                try
                {
                    await _authTracker.UpdateAuthState(deviceId, pumpId, "InProgress");
                    _logger.LogInformation("[Internal] Updated auth state to InProgress for Pump {PumpId} on Device {DeviceId}", pumpId, deviceId);
                    // NO _hubContext call here
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[Internal] Error processing filling status for pump {PumpId} on device {DeviceId}", pumpId, deviceId);
                }
            }
        }

        // Keep IsValidHexString helper
        private bool IsValidHexString(string input)
        {
            return input.All(c => "0123456789ABCDEFabcdef".Contains(char.ToUpper(c)));
        }


        // Renamed, only internal logic (update auth state), NO hub broadcast
        private async Task ProcessEndOfTransactionStatusInternalLogic(string deviceId, EndOfTransactionStatus eotStatus)
        {
            if (eotStatus.Ids == null) return;
            // Iterate through nullable ints, check HasValue before using Value
            foreach (var pumpIdNullable in eotStatus.Ids)
            {
                 if (!pumpIdNullable.HasValue) continue; // Skip null entries
                 var pumpId = pumpIdNullable.Value; // Get the non-nullable int value
                try
                {
                    await _authTracker.ClearAuthorization(deviceId, pumpId);
                    _logger.LogInformation("[Internal] Cleared auth for EOT on Pump {PumpId} on Device {DeviceId}", pumpId, deviceId);
                     // NO _hubContext call here
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[Internal] Error processing end of transaction for pump {PumpId} on device {DeviceId}", pumpId, deviceId);
                }
            }
        }

    }

    // Keep TransactionDetails record
    public record TransactionDetails
    {
         // Ensure types match domain model (might be nullable)
         public int? Nozzle { get; init; }
         public int? FuelGradeId { get; init; }
         public string? FuelGradeName { get; init; }
         public int? Transaction { get; init; }
         public decimal? Volume { get; init; }
         public decimal? Amount { get; init; }
         public decimal? Price { get; init; }
         public string? Tag { get; init; }
    }
}
