using FMS.Application.Common;
using FMS.Application.Features.VehicleDocumentManagement.Dtos;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.VehicleDocumentManagement.Queries;

public record GetVehicleDocumentByIdQuery(Guid Id) : IRequest<FMSResponse<VehicleDocumentDto>>;

public class GetVehicleDocumentByIdQueryHandler : IRequestHandler<GetVehicleDocumentByIdQuery, FMSResponse<VehicleDocumentDto>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetVehicleDocumentByIdQueryHandler> _logger;

    public GetVehicleDocumentByIdQueryHandler(GpsdataContext context, ILogger<GetVehicleDocumentByIdQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<VehicleDocumentDto>> Handle(GetVehicleDocumentByIdQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var row = await _context.VehicleDocuments
                .AsNoTracking()
                .Where(vd => vd.Id == request.Id)
                .ProjectToVehicleDocumentRows()
                .FirstOrDefaultAsync(cancellationToken);

            if (row == null)
            {
                return FMSResponse<VehicleDocumentDto>.Failed("Vehicle document not found.");
            }

            var vehicleDocumentDto = row.ToDto();

            return FMSResponse<VehicleDocumentDto>.Success(vehicleDocumentDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting vehicle document by ID.");
            return FMSResponse<VehicleDocumentDto>.SystemError("Error getting vehicle document by ID.");
        }
    }
}
