/**
 * File: DeleteFuelRefillCommandHandler.cs
 * Purpose: Deletes a fuel refill by delegating to tank volume history soft delete and recalculation logic.
 * Dependencies: GpsdataContext, MediatR, DeleteTankVolumeHistoryCommand, EF Core.
 * Last Modified: 2026-03-11
 *
 * Key Behaviors:
 * - Finds the associated dispensing transaction in tank volume history.
 * - Reuses transaction hub delete logic so tank stock recalculation stays consistent.
 * - Falls back to direct soft delete only when no linked history record exists.
 */
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Application.Common;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.TankManagement.FuelRefill.Commands;

public class DeleteFuelRefillCommandHandler : IRequestHandler<DeleteFuelRefillCommand, FMSResponseMessage>
{
    private readonly GpsdataContext _context;
    private readonly IMediator _mediator;
    private readonly ILogger<DeleteFuelRefillCommandHandler> _logger;

    public DeleteFuelRefillCommandHandler(
        GpsdataContext context,
        IMediator mediator,
        ILogger<DeleteFuelRefillCommandHandler> logger)
    {
        _context = context;
        _mediator = mediator;
        _logger = logger;
    }

    public async Task<FMSResponseMessage> Handle(DeleteFuelRefillCommand request, CancellationToken cancellationToken)
    {
        try
        {
            if (request.FuelRefillId <= 0)
            {
                return new FMSResponseMessage(false, "A valid fuel refill id is required.");
            }

            if (string.IsNullOrWhiteSpace(request.DeletedBy))
            {
                return new FMSResponseMessage(false, "DeletedBy is required for fuel refill delete operations.");
            }

            var fuelRefill = await _context.FuelRefills
                .FirstOrDefaultAsync(fr => fr.Id == request.FuelRefillId && !fr.IsDeleted, cancellationToken);

            if (fuelRefill == null)
            {
                return new FMSResponseMessage(false, $"Fuel refill {request.FuelRefillId} was not found or is already deleted.");
            }

            var tankVolumeHistory = await _context.TankVolumeHistories
                .Where(tvh => tvh.ReferenceId == request.FuelRefillId
                    && tvh.ChangeReason == VolumeChangeReasonEnum.Dispensing
                    && (tvh.IsDeleted != true))
                .OrderByDescending(tvh => tvh.Timestamp)
                .ThenByDescending(tvh => tvh.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (tankVolumeHistory != null)
            {
                var deleteResult = await _mediator.Send(
                    new DeleteTankVolumeHistoryCommand(
                        DeletedBy: request.DeletedBy,
                        Id: tankVolumeHistory.Id,
                        ValidateFutureRecords: true),
                    cancellationToken);

                if (!deleteResult.Success)
                {
                    return deleteResult;
                }

                _logger.LogInformation(
                    "Deleted fuel refill {FuelRefillId} via tank volume history {TankVolumeHistoryId}. Reason: {Reason}",
                    request.FuelRefillId,
                    tankVolumeHistory.Id,
                    request.DeletionReason ?? "Not provided");

                return new FMSResponseMessage(true, "Fuel refill deleted successfully.");
            }

            fuelRefill.IsDeleted = true;
            fuelRefill.DeletedAt = DateTime.UtcNow;
            fuelRefill.DeletedBy = request.DeletedBy;

            Tankstock? linkedTankStock = await _context.Tankstocks
                .FirstOrDefaultAsync(ts => ts.EntryId == request.FuelRefillId
                    && ts.EntryType == VolumeChangeReasonEnum.Dispensing
                    && !ts.IsDeleted,
                    cancellationToken);

            if (linkedTankStock != null)
            {
                linkedTankStock.IsDeleted = true;
                linkedTankStock.DeletedAt = DateTime.UtcNow;
                linkedTankStock.DeletedBy = request.DeletedBy;
                linkedTankStock.ActiveEntryKey = null;
            }

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogWarning(
                "Deleted fuel refill {FuelRefillId} without an associated active tank volume history record. Reason: {Reason}",
                request.FuelRefillId,
                request.DeletionReason ?? "Not provided");

            return new FMSResponseMessage(
                true,
                "Fuel refill deleted, but no linked tank volume history record was found for recalculation.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting fuel refill {FuelRefillId}", request.FuelRefillId);
            return new FMSResponseMessage(false, $"Error deleting fuel refill: {ex.Message}");
        }
    }
}