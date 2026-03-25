using FMS.Application.Common;
using FMS.Application.Features.VehicleDocumentManagement.Dtos;
using MediatR;
using System.Collections.Generic;
using AutoMapper;
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
    private readonly IMapper _mapper;

    public GetVehicleDocumentsByVehicleIdQueryHandler(GpsdataContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<FMSResponse<List<VehicleDocumentDto>>> Handle(GetVehicleDocumentsByVehicleIdQuery request, CancellationToken cancellationToken)
    {

        try
        {
            var existingVehicle = await _context.Vehicles.FindAsync(request.VehicleId);
            if (existingVehicle == null)
            {
                return FMSResponse<List<VehicleDocumentDto>>.Failed($"Vehicle with id {request.VehicleId} not found");
            }
            var documents = await _context.VehicleDocuments
                .Include(d => d.Vehicle)
                .Where(d => d.VehicleId == request.VehicleId)
                .ToListAsync(cancellationToken);

            if (documents == null || !documents.Any())
            {
                return FMSResponse<List<VehicleDocumentDto>>.Success(new List<VehicleDocumentDto>(), "No documents found for this vehicle.");
            }

            var documentDtos = _mapper.Map<List<VehicleDocumentDto>>(documents);

            return FMSResponse<List<VehicleDocumentDto>>.Success(documentDtos, "Documents retrieved successfully");
        }
        catch (System.Exception ex)
        {
            return FMSResponse<List<VehicleDocumentDto>>.Failed($"An error occurred while retrieving documents: {ex.Message}");
        }
    }
}
