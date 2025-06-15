using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Command.DatabaseCommand.VehicleCmd
{
    public record DeleteVehicleCommand(int VehicleId) : IRequest<FMSResponseMessage<bool>>;

    public class DeleteVehicleCommandHandler : IRequestHandler<DeleteVehicleCommand, FMSResponseMessage<bool>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<DeleteVehicleCommandHandler> _logger;

        public DeleteVehicleCommandHandler(GpsdataContext context, ILogger<DeleteVehicleCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponseMessage<bool>> Handle(DeleteVehicleCommand request, CancellationToken cancellationToken)
        {
            try
            {
                // Begin a transaction since we need to modify multiple tables
                using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

                try
                {
                    // Find the vehicle to delete
                    var vehicle = await _context.Vehicles
                        .Include(v => v.EmployeeVehicles)
                        .Include(v => v.Tags)
                        .FirstOrDefaultAsync(v => v.VehicleId == request.VehicleId, cancellationToken);

                    if (vehicle == null)
                    {
                        return new FMSResponseMessage<bool>(false, $"Vehicle with ID {request.VehicleId} not found", false);
                    }

                    // Remove entries from EmployeeVehicle join table
                    if (vehicle.EmployeeVehicles.Any())
                    {
                        foreach (var employeeVehicle in vehicle.EmployeeVehicles.ToList())
                        {
                            _context.Remove(employeeVehicle);
                        }
                    }

                    // Remove tag relationships if any
                    vehicle.Tags.Clear();

                    // Remove the vehicle itself
                    _context.Vehicles.Remove(vehicle);

                    // Save changes
                    await _context.SaveChangesAsync(cancellationToken);

                    // Commit the transaction
                    await transaction.CommitAsync(cancellationToken);

                    return new FMSResponseMessage<bool>(true, "Vehicle deleted successfully", true);
                }
                catch (Exception ex)
                {
                    // Rollback the transaction in case of error
                    await transaction.RollbackAsync(cancellationToken);
                    _logger.LogError(ex, "Error deleting vehicle with ID {VehicleId}", request.VehicleId);
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting vehicle with ID {VehicleId}", request.VehicleId);
                return new FMSResponseMessage<bool>(false, $"Error deleting vehicle: {ex.Message}", false);
            }
        }
    }
}