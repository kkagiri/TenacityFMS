using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.VehicleDocumentManagement.Commands;

public record DeleteVehicleDocumentCommand(Guid Id) : IRequest<FMSResponse<bool>>;

public class DeleteVehicleDocumentCommandHandler : IRequestHandler<DeleteVehicleDocumentCommand, FMSResponse<bool>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<DeleteVehicleDocumentCommandHandler> _logger;

    public DeleteVehicleDocumentCommandHandler(GpsdataContext context, ILogger<DeleteVehicleDocumentCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<bool>> Handle(DeleteVehicleDocumentCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var vehicleDocument = await _context.VehicleDocuments.FirstOrDefaultAsync(vd => vd.Id == request.Id, cancellationToken);

            if (vehicleDocument == null)
            {
                return FMSResponse<bool>.Fail("Vehicle document not found.");
            }

            _context.VehicleDocuments.Remove(vehicleDocument);
            await _context.SaveChangesAsync(cancellationToken);

            return FMSResponse<bool>.Success(true, "Vehicle document deleted successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting vehicle document.");
            return FMSResponse<bool>.Fail("Error deleting vehicle document.");
        }
    }
}
