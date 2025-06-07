using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using AutoMapper.Configuration.Annotations;
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.FMS.FuelRefil;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace FMS.Application.Command.DatabaseCommand.FuelRefillCommand;

public record UpdateFuelRefillCommand (
    int FuelRefillId,
    int TankId,
    DateTime RefillDate,
    decimal NewAmount,
    decimal OldAmount,
    string UserId
) : IRequest<FMSResponseMessage>;

public class FuelRefilUpdateCommandHandler : IRequestHandler<UpdateFuelRefillCommand, FMSResponseMessage> {
    private readonly GpsdataContext _context;
    private readonly ILogger<FuelRefilUpdateCommandHandler> _logger;

    private readonly TankVolumeHistoryIntegrationService _tankVolumeHistoryService;

    public FuelRefilUpdateCommandHandler (GpsdataContext context, TankVolumeHistoryIntegrationService tankVolumeHistoryIntegrationService, ILogger<FuelRefilUpdateCommandHandler> logger) {
        _tankVolumeHistoryService = tankVolumeHistoryIntegrationService;
        _context = context;
        _logger = logger;

    }

    public async Task<FMSResponseMessage> Handle (UpdateFuelRefillCommand request, CancellationToken cancellationToken) {
        try {

            if (request.NewAmount <= 0) {
                return new FMSResponseMessage (false, "Refill amount must be greater than zero");
            }

            var fuelRefill = await _context.Fuelrefils.FindAsync (new object[] { request.FuelRefillId }, cancellationToken);
            if (fuelRefill == null) {
                return new FMSResponseMessage (false, $"Fuel refill with ID {request.FuelRefillId} not found");
            }

            // Update fuel refill
            fuelRefill.Date = request.RefillDate;
            fuelRefill.ManualFuelrefilAmount = request.NewAmount;
            fuelRefill.DateModified = DateTime.UtcNow;
            fuelRefill.ModifiedBy = request.UserId;

            await _context.SaveChangesAsync (cancellationToken);

            // The volume change is the difference between the new and old amount
            // Remember that refills reduce tank volume, so we negate the amounts
            decimal volumeChange = -request.NewAmount;

            // Update tank volume history
            var volumeUpdateResult = await _tankVolumeHistoryService.ProcessFuelRefillChangeAsync (
                tankId: request.TankId,
                timestamp: request.RefillDate,
                volumeChange: volumeChange,
                refillId: fuelRefill.Id,
                actionType: ActionType.Update, // This is an update
                recordedBy : request.UserId,
                cancellationToken : cancellationToken);

            if (!volumeUpdateResult.Success) {
                _logger.LogWarning ("Failed to update tank volume history: {Message}", volumeUpdateResult.Message);
                // We continue even if volume history update fails, but log the error
            }
            return new FMSResponseMessage (true, "Fuel refill updated successfully");

        } catch (Exception ex) {
            _logger.LogError (ex.ToString (), "Error in UpdateFuelRefilCommandHandler");
            return new FMSResponseMessage (false, $"Error updating fuel refill: {ex.Message}");
        }
    }
}