using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
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
            var deletedCount = await _context.VehicleDocuments
                .Where(vd => vd.Id == request.Id)
                .ExecuteDeleteAsync(cancellationToken);

            if (deletedCount == 0)
            {
                return FMSResponse<bool>.Failed("Vehicle document not found.");
            }

            return FMSResponse<bool>.Success(true, "Vehicle document deleted successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting vehicle document.");
            return FMSResponse<bool>.SystemError("Error deleting vehicle document.");
        }
    }
}
