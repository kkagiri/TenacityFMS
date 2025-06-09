using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.PTSCommands.PumpTransactionCommand {
    /// <summary>
    /// Query to check if a manual fuel refill entry exists for the same vehicle with approximately the same volume
    /// on the same date. This is used to prevent double-counting when an automated transaction also has a manual entry.
    /// </summary>
    public record CheckDuplicateFuelRefillQuery (
        int VehicleId,
        decimal Volume,
        DateTime Date) : IRequest<FMSResponseMessage<bool>>;

    public class CheckDuplicateFuelRefillQueryHandler : IRequestHandler<CheckDuplicateFuelRefillQuery, FMSResponseMessage<bool>> {
        private readonly GpsdataContext _context;
        private readonly ILogger<CheckDuplicateFuelRefillQueryHandler> _logger;
        private const decimal VOLUME_TOLERANCE = 0.01m; // 1% tolerance for volume comparison

        public CheckDuplicateFuelRefillQueryHandler (
            GpsdataContext context,
            ILogger<CheckDuplicateFuelRefillQueryHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponseMessage<bool>> Handle (CheckDuplicateFuelRefillQuery request, CancellationToken cancellationToken) {
            try {
                // Check if there's a manual fuel refill entry for this vehicle on this date with approximately the same volume
                var manualRefill = await _context.Fuelrefils
                    .Where (f => f.VehicleId == request.VehicleId &&
                        f.Date.HasValue &&
                        f.Date.Value.Date == request.Date.Date &&
                        Math.Abs ((decimal) f.ManualFuelrefilAmount - request.Volume) / request.Volume <= VOLUME_TOLERANCE)
                    .FirstOrDefaultAsync (cancellationToken);

                var hasDuplicate = manualRefill != null;

                if (hasDuplicate) {
                    _logger.LogInformation (
                        "Found potential duplicate manual fuel refill (ID: {RefillId}) for vehicle {VehicleId} on {Date} with volume {Volume}",
                        manualRefill.Id, request.VehicleId, request.Date.ToString ("yyyy-MM-dd"), manualRefill.ManualFuelrefilAmount);
                }

                return new FMSResponseMessage<bool> (true,
                    hasDuplicate ? "Duplicate fuel refill entry found" : "No duplicate found",
                    hasDuplicate);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error checking for duplicate fuel refill for vehicle {VehicleId}", request.VehicleId);
                return new FMSResponseMessage<bool> (false, $"Error checking for duplicate: {ex.Message}", false);
            }
        }
    }
}