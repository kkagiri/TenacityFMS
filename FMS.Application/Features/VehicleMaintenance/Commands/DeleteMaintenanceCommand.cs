using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.VehicleMaintenance.Commands;

public record DeleteMaintenanceCommand(int MaintenanceId) : IRequest<FMSResponseMessage<bool>>;

public class DeleteMaintenanceCommandHandler : IRequestHandler<DeleteMaintenanceCommand, FMSResponseMessage<bool>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<DeleteMaintenanceCommandHandler> _logger;

    public DeleteMaintenanceCommandHandler(GpsdataContext context, ILogger<DeleteMaintenanceCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponseMessage<bool>> Handle(DeleteMaintenanceCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var maintenance = await _context.Set<Domain.Entities.Features.VehicleManagement.VehicleMaintenance>()
                .FirstOrDefaultAsync(m => m.MaintenanceId == request.MaintenanceId, cancellationToken);

            if (maintenance == null)
            {
                return new FMSResponseMessage<bool>(false, $"Maintenance record with ID {request.MaintenanceId} not found", false);
            }

            _context.Set<Domain.Entities.Features.VehicleManagement.VehicleMaintenance>().Remove(maintenance);
            await _context.SaveChangesAsync(cancellationToken);

            return new FMSResponseMessage<bool>(true, "Maintenance record deleted successfully", true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting maintenance record");
            return new FMSResponseMessage<bool>(false, $"Error deleting maintenance record: {ex.Message}", false);
        }
    }
}
