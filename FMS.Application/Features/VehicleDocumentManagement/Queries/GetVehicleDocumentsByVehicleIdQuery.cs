using FMS.Application.Common;
using FMS.Application.Features.VehicleDocumentManagement.Dtos;
using MediatR;
using System.Collections.Generic;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.VehicleDocumentManagement.Queries;

public record GetVehicleDocumentsByVehicleIdQuery(int VehicleId) : IRequest<FMSResponse<List<VehicleDocumentDto>>>;
public class GetVehicleDocumentsByVehicleIdQueryHandler : IRequestHandler<GetVehicleDocumentsByVehicleIdQuery, FMSResponse<List<VehicleDocumentDto>>>
{
    private readonly GpsdataContext _context;

    public GetVehicleDocumentsByVehicleIdQueryHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<FMSResponse<List<VehicleDocumentDto>>> Handle(GetVehicleDocumentsByVehicleIdQuery request, CancellationToken cancellationToken)
    {

        try
        {
            var vehicleExists = await _context.Vehicles
                .AsNoTracking()
                .AnyAsync(vehicle => vehicle.VehicleId == request.VehicleId, cancellationToken);
            if (!vehicleExists)
            {
                return FMSResponse<List<VehicleDocumentDto>>.Failed($"Vehicle with id {request.VehicleId} not found");
            }

            var rows = await _context.VehicleDocuments
                .AsNoTracking()
                .Where(d => d.VehicleId == request.VehicleId)
                .ProjectToVehicleDocumentRows()
                .ToListAsync(cancellationToken);

            if (!rows.Any())
            {
                return FMSResponse<List<VehicleDocumentDto>>.Success(new List<VehicleDocumentDto>(), "No documents found for this vehicle.");
            }

            var documentDtos = rows.ToDtos();
            await documentDtos.ApplyCreatedByDisplayAsync(_context, cancellationToken);

            return FMSResponse<List<VehicleDocumentDto>>.Success(documentDtos, "Documents retrieved successfully");
        }
        catch (System.Exception ex)
        {
            return FMSResponse<List<VehicleDocumentDto>>.SystemError($"An error occurred while retrieving documents: {ex.Message}");
        }
    }
}
