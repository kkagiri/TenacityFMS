using System;
using System.Linq;
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
    private static readonly JsonSerializerOptions _serviceFilterJsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

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
            transferDTO.ServiceFilterPartsList = ParseServiceFilterParts(transfer.ServiceFilterParts);

            return FMSResponse<VehicleTransferDTO>.Success(transferDTO, "Transfer fetched successfully");
        }
        catch (Exception ex)
        {
            return FMSResponse<VehicleTransferDTO>.Failed($"Error fetching transfer: {ex.Message}");
        }
    }

    private static System.Collections.Generic.List<ServiceFilterPartDTO>? ParseServiceFilterParts(string? rawValue)
    {
        if (string.IsNullOrWhiteSpace(rawValue))
        {
            return null;
        }

        try
        {
            var parsed = JsonSerializer.Deserialize<System.Collections.Generic.List<ServiceFilterPartDTO>>(rawValue, _serviceFilterJsonOptions);
            if (parsed?.Count > 0)
            {
                return parsed;
            }
        }
        catch
        {
        }

        var legacyParts = rawValue
            .Split(new[] { "\r\n", "\n", ";", "," }, StringSplitOptions.RemoveEmptyEntries)
            .Select((value, index) => new ServiceFilterPartDTO
            {
                Number = index + 1,
                PartNumber = value.Trim(),
                Quantity = 1
            })
            .Where(part => !string.IsNullOrWhiteSpace(part.PartNumber))
            .ToList();

        return legacyParts.Count > 0 ? legacyParts : null;
    }
}
