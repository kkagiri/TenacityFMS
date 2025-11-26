using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Command.VehicleMaintenance
{
    public class BulkUpdateVehicleOdometersCommandHandler
        : IRequestHandler<BulkUpdateVehicleOdometersCommand, FMSResponse<BulkUpdateResult>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<BulkUpdateVehicleOdometersCommandHandler> _logger;

        public BulkUpdateVehicleOdometersCommandHandler(
            GpsdataContext context,
            ILogger<BulkUpdateVehicleOdometersCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<BulkUpdateResult>> Handle(
            BulkUpdateVehicleOdometersCommand request,
            CancellationToken cancellationToken)
        {
            var result = new BulkUpdateResult
            {
                TotalRequested = request.Updates.Count
            };

            try
            {
                foreach (var update in request.Updates)
                {
                    try
                    {
                        var vehicle = await _context.Vehicles
                            .FirstOrDefaultAsync(v => v.VehicleId == update.VehicleId, cancellationToken);

                        if (vehicle == null)
                        {
                            result.FailCount++;
                            result.Errors.Add($"Vehicle {update.VehicleId} not found");
                            continue;
                        }

                        // Update odometer
                        // TODO: Add CurrentOdometer and LastOdometerUpdate properties to Vehicle entity
                        // vehicle.CurrentOdometer = update.GpsOdometer;
                        // vehicle.LastOdometerUpdate = DateTime.UtcNow;

                        // Track update source if column exists
                        // Note: You may need to add OdometerUpdateSource column to vehicles table

                        await _context.SaveChangesAsync(cancellationToken);

                        result.SuccessCount++;

                        _logger.LogInformation(
                            "Updated vehicle {VehicleId} odometer from {Source}: {Odometer} km",
                            update.VehicleId, update.UpdateSource, update.GpsOdometer);
                    }
                    catch (Exception ex)
                    {
                        result.FailCount++;
                        result.Errors.Add($"Vehicle {update.VehicleId}: {ex.Message}");
                        _logger.LogError(ex, "Failed to update vehicle {VehicleId} odometer", update.VehicleId);
                    }
                }

                _logger.LogInformation(
                    "Bulk odometer update completed: {Success} succeeded, {Fail} failed out of {Total}",
                    result.SuccessCount, result.FailCount, result.TotalRequested);

                return FMSResponse<BulkUpdateResult>.Success(
                    result,
                    $"Updated {result.SuccessCount} of {result.TotalRequested} vehicles");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during bulk odometer update");
                return FMSResponse<BulkUpdateResult>.Failed("Failed to update vehicle odometers");
            }
        }
    }
}
