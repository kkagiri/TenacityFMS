using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.VehicleTransfer.Commands;

public record DeleteVehicleTransferCommand(int TransferId, string? UserId) : IRequest<FMSResponse<bool>>;

public class DeleteVehicleTransferCommandHandler : IRequestHandler<DeleteVehicleTransferCommand, FMSResponse<bool>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<DeleteVehicleTransferCommandHandler> _logger;

    public DeleteVehicleTransferCommandHandler(GpsdataContext context, ILogger<DeleteVehicleTransferCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<bool>> Handle(DeleteVehicleTransferCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var transfer = await _context.Set<Domain.Entities.Features.VehicleManagement.VehicleTransfer>()
                .Include(t => t.CheckupItems)
                .Include(t => t.TyreDetails)
                .Include(t => t.BatteryDetails)
                .FirstOrDefaultAsync(t => t.TransferId == request.TransferId, cancellationToken);

            if (transfer == null)
            {
                return FMSResponse<bool>.Failed($"Transfer with ID {request.TransferId} not found", "NOT_FOUND");
            }

            // Only allow deletion of pending transfers
            if (!transfer.Status.Equals("Pending", StringComparison.OrdinalIgnoreCase))
            {
                return FMSResponse<bool>.Failed("Only pending transfers can be deleted", "VALIDATION_ERROR");
            }

            // Remove related entities
            _context.Set<Domain.Entities.Features.VehicleManagement.VehicleTransferCheckupItem>().RemoveRange(transfer.CheckupItems);
            _context.Set<Domain.Entities.Features.VehicleManagement.VehicleTransferTyreDetail>().RemoveRange(transfer.TyreDetails);
            _context.Set<Domain.Entities.Features.VehicleManagement.VehicleTransferBatteryDetail>().RemoveRange(transfer.BatteryDetails);

            // Remove transfer
            _context.Set<Domain.Entities.Features.VehicleManagement.VehicleTransfer>().Remove(transfer);

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Vehicle transfer {TransferId} deleted by user {UserId}", request.TransferId, request.UserId);

            return FMSResponse<bool>.Success(true, "Transfer deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting transfer {TransferId}", request.TransferId);
            return FMSResponse<bool>.Failed($"Error deleting transfer: {ex.Message}");
        }
    }
}
