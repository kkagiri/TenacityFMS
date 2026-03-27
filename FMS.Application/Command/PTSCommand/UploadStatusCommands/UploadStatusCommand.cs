/**
 * File: UploadStatusCommand.cs
 * Purpose: Orchestrates UploadStatus packet processing by delegating broadcast, cache, pump-state, and probe pipelines.
 * Dependencies: MediatR, DeviceConnectionTracker, UploadStatus broadcast/cache/pump services, deferred probe processing
 * Last Modified: 2026-03-27
 *
 * Key Functions:
 * - Handle(): Coordinates UploadStatus processing without embedding the critical transaction logic inline.
 * - QueueDeferredProbeProcessing(): Runs deferred probe processing in an isolated scope.
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Common.PTSResponse;
using FMS.Application.Communication;
using FMS.Application.Features.PTS.Services;
using FMS.Application.Features.TankManagement.TankMeasurements.Services;
using FMS.Domain.Entities.PTS.PTSStatus;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

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
        private readonly DeviceConnectionTracker _connectionTracker;
        private readonly IUploadStatusBroadcastService _broadcastService;
        private readonly IUploadStatusRedisService _redisService;
        private readonly IUploadStatusPumpStatusProcessingService _pumpStatusProcessingService;
        private readonly IServiceScopeFactory _serviceScopeFactory;

        public UploadStatusCommandHandler(
            ILogger<UploadStatusCommandHandler> logger,
            DeviceConnectionTracker connectionTracker,
            IUploadStatusBroadcastService broadcastService,
            IUploadStatusRedisService redisService,
            IUploadStatusPumpStatusProcessingService pumpStatusProcessingService,
            IServiceScopeFactory serviceScopeFactory)
        {
            _logger = logger;
            _connectionTracker = connectionTracker;
            _broadcastService = broadcastService;
            _redisService = redisService;
            _pumpStatusProcessingService = pumpStatusProcessingService;
            _serviceScopeFactory = serviceScopeFactory;
        }

        public async Task<CommandResult> Handle(UploadStatusCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var uploadStatus = request.UploadStatus;
                var deviceId = request.DeviceId;

                if (uploadStatus == null)
                {
                    _logger.LogWarning("No status data received for device {DeviceId}", deviceId);
                    return CommandResult.Failed("No status data received");
                }

                if (!string.IsNullOrWhiteSpace(deviceId))
                {
                    await _broadcastService.BroadcastAsync(deviceId, uploadStatus, cancellationToken);
                    await _redisService.StoreAsync(deviceId, uploadStatus);
                    await _connectionTracker.UpdateWebSocketLastMessageTime(deviceId);
                }

                if (uploadStatus.Pumps != null && !string.IsNullOrWhiteSpace(deviceId))
                {
                    await _pumpStatusProcessingService.ProcessAsync(deviceId, uploadStatus.Pumps);
                }

                if (uploadStatus.Probes != null && !string.IsNullOrWhiteSpace(deviceId))
                {
                    QueueDeferredProbeProcessing(deviceId, uploadStatus.Probes);
                }

                return CommandResult.Succeeded("OK", null!);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing status update");
                throw;
            }
        }

        private void QueueDeferredProbeProcessing(string deviceId, FMS.Domain.Entities.PTS.PTSStatus.ProbeStatus.ProbeStatus probeStatus)
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = _serviceScopeFactory.CreateScope();
                    var probeProcessingService = scope.ServiceProvider.GetRequiredService<IUploadStatusProbeProcessingService>();
                    await probeProcessingService.ProcessAsync(deviceId, probeStatus, CancellationToken.None);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[UploadStatus] Deferred probe processing failed for device {DeviceId}", deviceId);
                }
            });
        }
    }
}