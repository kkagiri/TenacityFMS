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
using System.Threading;
using System.Threading.Tasks;

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


        public UploadStatusCommandHandler(IHubContext<FrontEndHub> hubContext, GpsdataContext context, IMediator mediator, ILogger<UploadStatusCommandHandler> logger, IPendingCommandRepository pendingCommandRepository, IAuthorizationStateTracker authorizationState)
        {
            _hubContext = hubContext;
            _mediator = mediator;
            _logger = logger;
            _pendingCommandRepo = pendingCommandRepository;
            _authTracker = authorizationState;
            _context = context;
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

                // Broadcast the upload status update via SignalR
                if (deviceId != null)
                {
                    // Create a status object with the relevant data to send to the client
                    var statusUpdate = new
                    {
                        deviceId = deviceId,
                        timestamp = DateTime.UtcNow,
                        pumps = uploadstatus.Pumps,
                        probes = uploadstatus.Probes,
                        readers = uploadstatus.Readers
                    };

                    // Send the upload status update directly using the hub context
                    await _hubContext.Clients.All.SendAsync("UploadStatusUpdate", new { deviceId, status = statusUpdate });
                    _logger.LogInformation("Upload status broadcasted for device {DeviceId}", deviceId);
                }

                //TODO: uncomment this when the database is ready
                //check if there is a pending command for this device ..
                // var pendingCommand = await _pendingCommandRepo.GetNextPendingCommandAsync(deviceId!);
                // if (pendingCommand.HasValue)
                // {
                //     var (commandId, commandType, commandData) = pendingCommand.Value;
                //     await _pendingCommandRepo.MarkCommandDeliveredAsync(commandId);
                //     _logger.LogInformation("Pending command {CommandType} marked as completed for device {DeviceId}", commandType, deviceId);
                //     return CommandResult.Succeeded(commandType, commandData);
                // }

                if (uploadstatus?.Pumps != null)
                {
                    await ProcessLivePumpStatus(deviceId!, uploadstatus.Pumps);
                }

                if (uploadstatus?.Probes != null)
                {
                    await ProcessLiveProbeStatus(deviceId!, uploadstatus.Probes);
                }


                return CommandResult.Succeeded("OK", null!);


            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing status update");
                throw; // continue to the next handler
            }



        }



        private async Task ProcessLiveProbeStatus(string deviceId, Domain.Entities.PTS.PTSStatus.ProbeStatus.ProbeStatus probeStatus)

        {
            if (probeStatus.OnlineStatus.Ids != null)
            {
                foreach (var probeId in probeStatus.OnlineStatus.Ids)
                {
                    //save to db .. get the tank Associated
                }


            }
        }



        private async Task ProcessLivePumpStatus(string deviceId, Domain.Entities.PTS.PTSStatus.PumpStatus.PumpStatus pumpStatus)
        {
            // Handle Idle Status - Check for nozzles up and tags
            if (pumpStatus.IdleStatus != null)
            {

                await PublishNozzleAndTagStates(deviceId, pumpStatus.IdleStatus);
            }

            // Handle Filling Status
            if (pumpStatus.FillingStatus != null)
            {
                await ProcessFillingStatus(deviceId, pumpStatus.FillingStatus);
            }

            // Handle End of Transaction
            if (pumpStatus.EndOfTransactionStatus != null)
            {
                await ProcessEndOfTransactionStatus(deviceId, pumpStatus.EndOfTransactionStatus);
            }

            // Handle Offline Status
            if (pumpStatus.OfflineStatus != null)
            {
                await ProcessOfflineStatus(deviceId, pumpStatus.OfflineStatus);
            }

        }

        private async Task ProcessOfflineStatus(string deviceId, Domain.Entities.PTS.PTSStatus.PumpStatus.PumpOfflineStatus offlineStatus)
        {
            //check if the pump that are on idle status are in the list of pumps on the device
            if (offlineStatus.Ids == null || !offlineStatus.Ids.Any()) return;

            foreach (var pumpId in offlineStatus.Ids)
            {
                await _authTracker.ClearAuthorization(deviceId, pumpId.Value);
            }
            await _hubContext.Clients.All.SendAsync("PumpOffline", new { deviceId, pumpId = offlineStatus.Ids });

        }

        private async Task PublishNozzleAndTagStates(string deviceId, IdleStatus idleStatus)
        {
            //check if the pump that are on idle status are in the list of pumps on the device
            if (idleStatus.Ids == null || !idleStatus.Ids.Any()) return;

            for (int i = 0; i < idleStatus.Ids.Count; i++)
            {
                var pumpId = idleStatus.Ids[i];
                if (!pumpId.HasValue || pumpId.Value < 1 || pumpId > 50)
                {
                    _logger.LogWarning("Invalid pump ID {PumpId} for device {DeviceId}", pumpId, deviceId);
                    continue;
                }

                //process Nozzle State
                if (idleStatus.NozzlesUp?.Count > i)
                {
                    var nozzleNumber = idleStatus.NozzlesUp[i];

                    if (nozzleNumber < 1 || nozzleNumber > 6) //Protocal specific Range
                    {
                        var nozzleEvent = new NozzleStateChangeEvent(
                             deviceId: deviceId,
                           pumpId: pumpId.Value,
                           nozzleNumber: nozzleNumber

                          );

                        //include last Transaction Data if Available
                        if (idleStatus.LastTransactions?.Count > i && idleStatus.LastTransactions[i] > 0)
                        {

                            nozzleEvent = nozzleEvent with
                            {
                                LastNozzle = idleStatus.LastNozzles?.ElementAtOrDefault(i),
                                LastTransaction = idleStatus.LastTransactions[i],
                                LastAmount = idleStatus.LastAmounts?.ElementAtOrDefault(i),
                                LastVolume = idleStatus.LastVolumes?.ElementAtOrDefault(i),
                                LastPrice = idleStatus.LastPrices?.ElementAtOrDefault(i),

                            };

                        }

                        await _mediator.Publish(nozzleEvent);
                        await _hubContext.Clients.All.SendAsync("NozzleStateChange", nozzleEvent);
                    }

                }


                //process Tag Read
                if (idleStatus.Tags?.Count > i && !string.IsNullOrEmpty(idleStatus.Tags[i].ToString()))
                {
                    var tag = idleStatus.Tags[i].ToString();
                    if (tag.Length <= 48 && IsValidHexString(tag))
                    {
                        await _mediator.Publish(new TagReadEvent(deviceId, pumpId.Value, idleStatus.NozzlesUp?.ElementAtOrDefault(i) ?? 9, tag));
                        await _hubContext.Clients.All.SendAsync("UploadstatusTagRead", new TagReadEvent(deviceId, pumpId.Value, idleStatus.NozzlesUp?.ElementAtOrDefault(i) ?? 9, tag));
                    }
                }


            }
        }
        private async Task ProcessFillingStatus(string deviceId, FillingStatus fillingStatus)
        {
            if (fillingStatus.Ids == null) return;

            for (int i = 0; i < fillingStatus.Ids.Count; i++)
            {
                var pumpId = fillingStatus.Ids[i];
                if (!pumpId.HasValue || pumpId.Value < 1 || pumpId > 50)
                {
                    _logger.LogWarning("Invalid pump ID {PumpId} for device {DeviceId}", pumpId, deviceId);
                    continue;
                }

                try
                {

                    var transactionDetails = new TransactionDetails
                    {
                        Nozzle = fillingStatus.Nozzles?.ElementAtOrDefault(i) ?? 0,
                        FuelGradeId = fillingStatus.FuelGradeIds?.ElementAtOrDefault(i) ?? 0,
                        FuelGradeName = fillingStatus.FuelGradeNames?.ElementAtOrDefault(i) ?? "",
                        Transaction = fillingStatus.Transactions?.ElementAtOrDefault(i) ?? 0,
                        Volume = fillingStatus.Volumes?.ElementAtOrDefault(i) ?? 0,
                        Amount = fillingStatus.Amounts?.ElementAtOrDefault(i) ?? 0,
                        Price = fillingStatus.Prices?.ElementAtOrDefault(i) ?? 0,
                        Tag = fillingStatus.Tags?.ElementAtOrDefault(i) ?? ""
                    };


                    await _authTracker.UpdateAuthState(deviceId, pumpId.Value, "InProgress");

                    _logger.LogInformation("Pump {PumpId} on device {DeviceId} is now fueling", pumpId, deviceId);

                    await _hubContext.Clients.All.SendAsync("FillingStatus", new { deviceId, pumpId = pumpId.Value, transactionDetails });


                }
                catch (Exception ex)
                {
                    _logger.LogError(ex,
                        "Error processing filling status for pump {PumpId} on device {DeviceId}",
                        pumpId, deviceId);
                }
            }
        }

        private bool IsValidHexString(string input)
        {
            return input.All(c => "0123456789ABCDEFabcdef".Contains(char.ToUpper(c)));
        }



        private async Task ProcessEndOfTransactionStatus(string deviceId, EndOfTransactionStatus eotStatus)
        {
            if (eotStatus.Ids == null) return;

            foreach (var pumpId in eotStatus.Ids.Where(id => id.HasValue))
            {
                try
                {
                    await _authTracker.ClearAuthorization(deviceId, pumpId.Value);
                    await _hubContext.Clients.All.SendAsync("PumpTransactionCompleted", new { deviceId, pumpId = pumpId.Value });
                    _logger.LogInformation(
                        "Transaction completed for pump {PumpId} on device {DeviceId}",
                        pumpId, deviceId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex,
                        "Error processing end of transaction for pump {PumpId} on device {DeviceId}",
                        pumpId, deviceId);
                }
            }
        }











    }

    public record TransactionDetails
    {
        public int Nozzle { get; init; }
        public int FuelGradeId { get; init; }
        public string? FuelGradeName { get; init; }
        public int Transaction { get; init; }
        public decimal Volume { get; init; }
        public decimal Amount { get; init; }
        public decimal Price { get; init; }
        public string? Tag { get; init; }
    }
}
