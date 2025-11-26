using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Domain.Entities.Features.TankStockManagement;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
//frfr

namespace FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand
{
    public record ProcessTankStockChangeCommand(
        int TankId,
        DateTime Timestamp,
        decimal VolumeChange,
        VolumeChangeReasonEnum ChangeReason,
        string RecordedBy,
        int ReferenceId,
        string ReferenceType,
        ActionType ActionType,
        decimal? NewPhysicalStockValue = null, // For opening/closing stock operations
        string? PhysicalStockSource = null) : IRequest<FMSResponseMessage>; // For opening/closing stock operations

    public enum ActionType
    {
        Create,
        Update,
        Delete
    }

    public class ProcessTankStockChangeCommandHandler : IRequestHandler<ProcessTankStockChangeCommand, FMSResponseMessage>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<ProcessTankStockChangeCommandHandler> _logger;
        private readonly IMediator _mediator;

        public ProcessTankStockChangeCommandHandler(
            GpsdataContext context,
            ILogger<ProcessTankStockChangeCommandHandler> logger,
            IMediator mediator)
        {
            _context = context;
            _logger = logger;
            _mediator = mediator;
        }

        public async Task<FMSResponseMessage> Handle(ProcessTankStockChangeCommand request, CancellationToken cancellationToken)
        {
            try
            {
                // Validate the request
                var tank = await _context.Tanks
                    .FirstOrDefaultAsync(t => t.Id == request.TankId, cancellationToken);

                if (tank == null)
                {
                    return new FMSResponseMessage(false, $"Tank with ID {request.TankId} not found");
                }

                // Different handling based on action type
                switch (request.ActionType)
                {
                    case ActionType.Create:
                        // For opening/closing stock, use the physical stock value directly as the new volume
                        // For other operations, calculate new volume from previous volume + change
                        decimal newVolume;
                        if ((request.ChangeReason == VolumeChangeReasonEnum.OpeningStock ||
                             request.ChangeReason == VolumeChangeReasonEnum.ClosingStock) &&
                            request.NewPhysicalStockValue.HasValue)
                        {
                            // Use the physical stock value directly - user entered absolute value
                            newVolume = request.NewPhysicalStockValue.Value;
                        }
                        else
                        {
                            // Calculate the new volume based on previous volume + volume change
                            decimal previousVolume = await GetPreviousVolumeAsync(request.TankId, request.Timestamp, cancellationToken);
                            newVolume = previousVolume + request.VolumeChange;
                        }

                        // Create new tank volume history record
                        var newRecord = new TankVolumeHistory
                        {
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

                        _context.TankVolumeHistories.Add(newRecord);

                        // Update tank properties for all operations when physical stock value is provided
                        if (request.NewPhysicalStockValue.HasValue)
                        {
                            var isCurrentDay = request.Timestamp.Date == DateTime.Now.Date;

                            // Update physical stock value for any operation type
                            tank.PhysicalStockValue = request.NewPhysicalStockValue.Value;
                            tank.LastPhysicalStockUpdate = request.Timestamp;
                            tank.PhysicalStockSource = request.PhysicalStockSource ?? GetDefaultPhysicalStockSource(request.ChangeReason);

                            // Update book balance only for current day and if bookkeeping is enabled
                            if (isCurrentDay && tank.UseBookKeeping == 1)
                            {
                                // For opening/closing stock, use the exact physical stock value
                                if (request.ChangeReason == VolumeChangeReasonEnum.OpeningStock ||
                                    request.ChangeReason == VolumeChangeReasonEnum.ClosingStock)
                                {
                                    tank.CurrentStock = request.NewPhysicalStockValue.Value;
                                }
                                else
                                {
                                    // For other operations (delivery, fuel refill, transfer), apply the change to current stock
                                    tank.CurrentStock = (tank.CurrentStock ?? 0) + request.VolumeChange;
                                }
                                tank.LastStockUpdate = DateTime.Now;
                            }

                            _context.Tanks.Update(tank);
                        }
                        // Handle cases where no physical stock is provided but we still need to update book balance
                        else if (request.Timestamp.Date == DateTime.Now.Date && tank.UseBookKeeping == 1)
                        {
                            // Only update book balance for current day operations when no physical stock is specified
                            tank.CurrentStock = (tank.CurrentStock ?? 0) + request.VolumeChange;
                            tank.LastStockUpdate = DateTime.Now;
                            _context.Tanks.Update(tank);
                        }

                        await _context.SaveChangesAsync(cancellationToken);
                        break;

                    case ActionType.Update:
                        // Find existing tank volume history record
                        var existingRecord = await _context.TankVolumeHistories
                            .FirstOrDefaultAsync(h =>
                                h.TankId == request.TankId &&
                                h.ReferenceId == request.ReferenceId &&
                                h.ReferenceType == request.ReferenceType,
                                cancellationToken);

                        if (existingRecord == null)
                        {
                            // Create new record if not found
                            var newUpdateRecord = new TankVolumeHistory
                            {
                                TankId = request.TankId,
                                Timestamp = request.Timestamp,
                                VolumeChange = request.VolumeChange,
                                ChangeReason = request.ChangeReason,
                                RecordedBy = request.RecordedBy,
                                ReferenceId = request.ReferenceId,
                                ReferenceType = request.ReferenceType,
                                CreatedOn = DateTime.UtcNow
                            };

                            _context.TankVolumeHistories.Add(newUpdateRecord);
                        }
                        else
                        {
                            // Update existing record
                            existingRecord.Timestamp = request.Timestamp;
                            existingRecord.VolumeChange = request.VolumeChange;
                            existingRecord.RecordedBy = request.RecordedBy;
                        }

                        await _context.SaveChangesAsync(cancellationToken);
                        break;

                    case ActionType.Delete:
                        // Find and soft delete tank volume history record
                        var recordToDelete = await _context.TankVolumeHistories
                            .FirstOrDefaultAsync(h =>
                                h.TankId == request.TankId &&
                                h.ReferenceId == request.ReferenceId &&
                                h.ReferenceType == request.ReferenceType &&
                                (h.IsDeleted != true),
                                cancellationToken);

                        if (recordToDelete != null)
                        {
                            // Perform soft delete instead of hard delete
                            recordToDelete.IsDeleted = true;
                            recordToDelete.DeletedAt = DateTime.UtcNow;
                            recordToDelete.DeletedBy = request.RecordedBy;

                            await _context.SaveChangesAsync(cancellationToken);
                        }
                        break;
                }

                // Update all affected tank volume history records
                var updateResult = await _mediator.Send(
                    new UpdateTankVolumeHistoryCommand(
                        request.TankId,
                        request.Timestamp),
                    cancellationToken);

                if (!updateResult.Success)
                {
                    _logger.LogWarning("Failed to update tank volume history: {Message}", updateResult.Message);
                    return new FMSResponseMessage(false, $"Failed to update tank volume history: {updateResult.Message}");
                }

                return new FMSResponseMessage(true,
                    $"Successfully processed {request.ActionType} action for tank {request.TankId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing tank stock change for tank {TankId}", request.TankId);
                return new FMSResponseMessage(false, $"Error processing tank stock change: {ex.Message}");
            }
        }

        private async Task<decimal> GetPreviousVolumeAsync(int tankId, DateTime beforeTimestamp, CancellationToken cancellationToken)
        {
            var previousVolume = await _context.TankVolumeHistories
                .Where(h => h.TankId == tankId &&
                    h.Timestamp < beforeTimestamp &&
                    (h.IsDeleted != true))
                .OrderByDescending(h => h.Timestamp)
                .ThenByDescending(h => h.Id)
                .Select(h => h.NewVolume)
                .FirstOrDefaultAsync(cancellationToken);

            // If no previous history exists, get the current stock from the tank
            if (previousVolume == null)
            {
                var tank = await _context.Tanks
                    .Where(t => t.Id == tankId)
                    .Select(t => t.CurrentStock)
                    .FirstOrDefaultAsync(cancellationToken);

                return tank ?? 0m;
            }

            return previousVolume.Value;
        }

        private static string GetDefaultPhysicalStockSource(VolumeChangeReasonEnum changeReason)
        {
            return changeReason
            switch
            {
                VolumeChangeReasonEnum.OpeningStock => "Manual",
                VolumeChangeReasonEnum.ClosingStock => "Manual",
                VolumeChangeReasonEnum.Delivery => "Delivery",
                VolumeChangeReasonEnum.Dispensing => "FuelRefill",
                VolumeChangeReasonEnum.TransferIn => "Transfer",
                VolumeChangeReasonEnum.TransferOut => "Transfer",
                VolumeChangeReasonEnum.Adjustment => "Adjustment",
                VolumeChangeReasonEnum.AutomatedDispensing => "PumpTransaction",
                _ => "System"
            };
        }

    }
}