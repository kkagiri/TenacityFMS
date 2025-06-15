using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.TankManagement.FuelRefill.Commands;

public record DeleteFuelRefillCommand (
    int FuelRefillId,
    int TankId,
    decimal Amount,
    DateTime RefillDate,
    string UserId
) : IRequest<FMSResponseMessage>;

public class DeleteFuelRefillCommandHandler : IRequestHandler<DeleteFuelRefillCommand, FMSResponseMessage> {
    private readonly GpsdataContext _context;
    private readonly ILogger<DeleteFuelRefillCommandHandler> _logger;
    private readonly TankVolumeHistoryIntegrationService _tankVolumeHistoryService;

    public DeleteFuelRefillCommandHandler (GpsdataContext context, ILogger<DeleteFuelRefillCommandHandler> logger, TankVolumeHistoryIntegrationService tankVolumeHistoryService) {
        _tankVolumeHistoryService = tankVolumeHistoryService;
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponseMessage> Handle (DeleteFuelRefillCommand request, CancellationToken cancellationToken) {
        try {
            var fuelRefill = await _context.FuelRefills.FindAsync (new object[] { request.FuelRefillId }, cancellationToken);
            if (fuelRefill == null) {
                return new FMSResponseMessage (false, $"Fuel refill with ID {request.FuelRefillId} not found");
            }

            _context.FuelRefills.Remove (fuelRefill);
            await _context.SaveChangesAsync (cancellationToken);
            // When deleting a fuel refill, we need to update the tank volume history
            // The volume change is positive (we're adding back the amount that was removed)
            var results = await _tankVolumeHistoryService.ProcessFuelRefillChangeAsync (
                tankId: request.TankId,
                timestamp: request.RefillDate,
                volumeChange: request.Amount, // Positive because we're removing the refill
                refillId : request.FuelRefillId,
                actionType : ActionType.Delete, // This is a deletion
                recordedBy : request.UserId,
                cancellationToken : cancellationToken);

            if (!results.Success) {
                _logger.LogError ("Failed to update tank volume history for fuel refill deletion: {ErrorMessage}", results.Message);
                // we continue even if volume history update fails, but log the error
            }

            return new FMSResponseMessage (true, "Fuel refill deleted successfully");
        } catch (Exception ex) {
            _logger.LogError (ex, "Error in DeleteFuelRefillCommandHandler");
            return new FMSResponseMessage (false, $"Error deleting fuel refill: {ex.Message}");

        }
    }
}