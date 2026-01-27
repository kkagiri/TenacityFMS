using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTransfer.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.VehicleTransfer.Queries;

public record GetVehicleTransferByIdQuery(int TransferId) : IRequest<FMSResponse<VehicleTransferDTO>>;

public class GetVehicleTransferByIdQueryHandler : IRequestHandler<GetVehicleTransferByIdQuery, FMSResponse<VehicleTransferDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;

    public GetVehicleTransferByIdQueryHandler(GpsdataContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<FMSResponse<VehicleTransferDTO>> Handle(GetVehicleTransferByIdQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var transfer = await _context.Set<Domain.Entities.Features.VehicleManagement.VehicleTransfer>()
                .Include(t => t.Vehicle)
                .Include(t => t.FromSite)
                .Include(t => t.ToSite)
                .Include(t => t.Driver)
                .Include(t => t.CheckupItems)
                .Include(t => t.TyreDetails)
                .Include(t => t.BatteryDetails)
                .FirstOrDefaultAsync(t => t.TransferId == request.TransferId, cancellationToken);

            if (transfer == null)
            {
                return FMSResponse<VehicleTransferDTO>.Failed($"Transfer with ID {request.TransferId} not found", "NOT_FOUND");
            }

            var transferDTO = _mapper.Map<VehicleTransferDTO>(transfer);

            // Parse service filter parts from JSON
            if (!string.IsNullOrEmpty(transfer.ServiceFilterParts))
            {
                try
                {
                    transferDTO.ServiceFilterPartsList = JsonSerializer.Deserialize<System.Collections.Generic.List<ServiceFilterPartDTO>>(transfer.ServiceFilterParts);
                }
                catch
                {
                    // If parsing fails, leave as null
                }
            }

            return FMSResponse<VehicleTransferDTO>.Success(transferDTO, "Transfer fetched successfully");
        }
        catch (Exception ex)
        {
            return FMSResponse<VehicleTransferDTO>.Failed($"Error fetching transfer: {ex.Message}");
        }
    }
}
