using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
//frfr

namespace FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand {
    public record ProcessTankStockChangeCommand (
        int TankId,
        DateTime Timestamp,
        decimal VolumeChange,
        VolumeChangeReasonEnum ChangeReason,
        string RecordedBy,
        int ReferenceId,
        string ReferenceType,
        ActionType ActionType) : IRequest<FMSResponseMessage>;

    public enum ActionType {
        Create,
        Update,
        Delete
    }

    public class ProcessTankStockChangeCommandHandler : IRequestHandler<ProcessTankStockChangeCommand, FMSResponseMessage> {
        private readonly GpsdataContext _context;
        private readonly ILogger<ProcessTankStockChangeCommandHandler> _logger;
        private readonly IMediator _mediator;

        public ProcessTankStockChangeCommandHandler (
            GpsdataContext context,
            ILogger<ProcessTankStockChangeCommandHandler> logger,
            IMediator mediator) {
            _context = context;
            _logger = logger;
            _mediator = mediator;
        }

        public async Task<FMSResponseMessage> Handle (ProcessTankStockChangeCommand request, CancellationToken cancellationToken) {
            try {
                // Validate the request
                var tank = await _context.Tanks
                    .FirstOrDefaultAsync (t => t.Id == request.TankId, cancellationToken);

                if (tank == null) {
                    return new FMSResponseMessage (false, $"Tank with ID {request.TankId} not found");
                }

                // Different handling based on action type
                switch (request.ActionType) {
                    case ActionType.Create:
                        // Calculate the new volume based on previous volume + volume change
                        decimal previousVolume = await GetPreviousVolumeAsync (request.TankId, request.Timestamp, cancellationToken);
                        decimal newVolume = previousVolume + request.VolumeChange;

                        // Create new tank volume history record
                        var newRecord = new TankVolumeHistory {
                            TankId = request.TankId,
                            Timestamp = request.Timestamp,
                            VolumeChange = request.VolumeChange,
                            NewVolume = newVolume,
                            ChangeReason = request.ChangeReason,
                            RecordedBy = request.RecordedBy,
                            ReferenceId = request.ReferenceId,
                            ReferenceType = request.ReferenceType,
                            CreatedOn = DateTime.UtcNow
                        };

                        _context.TankVolumeHistories.Add (newRecord);
                        await _context.SaveChangesAsync (cancellationToken);
                        break;

                    case ActionType.Update:
                        // Find existing tank volume history record
                        var existingRecord = await _context.TankVolumeHistories
                            .FirstOrDefaultAsync (h =>
                                h.TankId == request.TankId &&
                                h.ReferenceId == request.ReferenceId &&
                                h.ReferenceType == request.ReferenceType,
                                cancellationToken);

                        if (existingRecord == null) {
                            // Create new record if not found
                            var newUpdateRecord = new TankVolumeHistory {
                            TankId = request.TankId,
                            Timestamp = request.Timestamp,
                            VolumeChange = request.VolumeChange,
                            ChangeReason = request.ChangeReason,
                            RecordedBy = request.RecordedBy,
                            ReferenceId = request.ReferenceId,
                            ReferenceType = request.ReferenceType,
                            CreatedOn = DateTime.UtcNow
                            };

                            _context.TankVolumeHistories.Add (newUpdateRecord);
                        } else {
                            // Update existing record
                            existingRecord.Timestamp = request.Timestamp;
                            existingRecord.VolumeChange = request.VolumeChange;
                            existingRecord.RecordedBy = request.RecordedBy;
                        }

                        await _context.SaveChangesAsync (cancellationToken);
                        break;

                    case ActionType.Delete:
                        // Find and delete tank volume history record
                        var recordToDelete = await _context.TankVolumeHistories
                            .FirstOrDefaultAsync (h =>
                                h.TankId == request.TankId &&
                                h.ReferenceId == request.ReferenceId &&
                                h.ReferenceType == request.ReferenceType,
                                cancellationToken);

                        if (recordToDelete != null) {
                            _context.TankVolumeHistories.Remove (recordToDelete);
                            await _context.SaveChangesAsync (cancellationToken);
                        }
                        break;
                }

                // Update all affected tank volume history records
                var updateResult = await _mediator.Send (
                    new UpdateTankVolumeHistoryCommand (
                        request.TankId,
                        request.Timestamp),
                    cancellationToken);

                if (!updateResult.Success) {
                    _logger.LogWarning ("Failed to update tank volume history: {Message}", updateResult.Message);
                    return new FMSResponseMessage (false, $"Failed to update tank volume history: {updateResult.Message}");
                }

                return new FMSResponseMessage (true,
                    $"Successfully processed {request.ActionType} action for tank {request.TankId}");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error processing tank stock change for tank {TankId}", request.TankId);
                return new FMSResponseMessage (false, $"Error processing tank stock change: {ex.Message}");
            }
        }

        private async Task<decimal> GetPreviousVolumeAsync (int tankId, DateTime beforeTimestamp, CancellationToken cancellationToken) {
            var previousVolume = await _context.TankVolumeHistories
                .Where (h => h.TankId == tankId && h.Timestamp < beforeTimestamp)
                .OrderByDescending (h => h.Timestamp)
                .ThenByDescending (h => h.Id)
                .Select (h => h.NewVolume)
                .FirstOrDefaultAsync (cancellationToken);

            // If no previous history exists, get the current stock from the tank
            if (previousVolume == null) {
                var tank = await _context.Tanks
                    .Where (t => t.Id == tankId)
                    .Select (t => t.CurrentStock)
                    .FirstOrDefaultAsync (cancellationToken);

                return tank ?? 0m;
            }

            return previousVolume.Value;
        }
    }
}