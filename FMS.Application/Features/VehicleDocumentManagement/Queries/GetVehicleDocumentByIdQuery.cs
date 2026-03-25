using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.VehicleDocumentManagement.Dtos;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.VehicleDocumentManagement.Queries;

public record GetVehicleDocumentByIdQuery(Guid Id) : IRequest<FMSResponse<VehicleDocumentDto>>;

public class GetVehicleDocumentByIdQueryHandler : IRequestHandler<GetVehicleDocumentByIdQuery, FMSResponse<VehicleDocumentDto>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<GetVehicleDocumentByIdQueryHandler> _logger;

    public GetVehicleDocumentByIdQueryHandler(GpsdataContext context, IMapper mapper, ILogger<GetVehicleDocumentByIdQueryHandler> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<FMSResponse<VehicleDocumentDto>> Handle(GetVehicleDocumentByIdQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var vehicleDocument = await _context.VehicleDocuments
                .Include(vd => vd.Vehicle)
                .FirstOrDefaultAsync(vd => vd.Id == request.Id, cancellationToken);

            if (vehicleDocument == null)
            {
                return FMSResponse<VehicleDocumentDto>.Failed("Vehicle document not found.");
            }

            var vehicleDocumentDto = _mapper.Map<VehicleDocumentDto>(vehicleDocument);

            return FMSResponse<VehicleDocumentDto>.Success(vehicleDocumentDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting vehicle document by ID.");
            return FMSResponse<VehicleDocumentDto>.Failed("Error getting vehicle document by ID.");
        }
    }
}
