using System;
using System.Collections.Generic;
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

public record GetVehicleTransfersQuery(
    int? VehicleId = null,
    int? FromSiteId = null,
    int? ToSiteId = null,
    string? Status = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    int Skip = 0,
    int Take = 50
) : IRequest<FMSResponse<List<VehicleTransferDTO>>>;

public class GetVehicleTransfersQueryHandler : IRequestHandler<GetVehicleTransfersQuery, FMSResponse<List<VehicleTransferDTO>>>
{
    private static readonly JsonSerializerOptions _serviceFilterJsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;

    public GetVehicleTransfersQueryHandler(GpsdataContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<FMSResponse<List<VehicleTransferDTO>>> Handle(GetVehicleTransfersQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var query = _context.Set<Domain.Entities.Features.VehicleManagement.VehicleTransfer>()
                .Include(t => t.Vehicle)
                .Include(t => t.FromSite)
                .Include(t => t.ToSite)
                .Include(t => t.Driver)
                .Include(t => t.CheckupItems)
                .AsQueryable();

            // Apply filters
            if (request.VehicleId.HasValue)
            {
                query = query.Where(t => t.VehicleId == request.VehicleId.Value);
            }

            if (request.FromSiteId.HasValue)
            {
                query = query.Where(t => t.FromSiteId == request.FromSiteId.Value);
            }

            if (request.ToSiteId.HasValue)
            {
                query = query.Where(t => t.ToSiteId == request.ToSiteId.Value);
            }

            if (!string.IsNullOrEmpty(request.Status))
            {
                query = query.Where(t => t.Status == request.Status);
            }

            if (request.FromDate.HasValue)
            {
                query = query.Where(t => t.TransferDate >= request.FromDate.Value);
            }

            if (request.ToDate.HasValue)
            {
                query = query.Where(t => t.TransferDate <= request.ToDate.Value);
            }

            // Order by most recent first
            query = query.OrderByDescending(t => t.TransferDate);

            // Pagination
            var transfers = await query
                .Skip(request.Skip)
                .Take(request.Take)
                .ToListAsync(cancellationToken);

            var transferDTOs = _mapper.Map<List<VehicleTransferDTO>>(transfers);

            for (var index = 0; index < transfers.Count; index++)
            {
                var transfer = transfers[index];
                var dto = transferDTOs[index];

                dto.ServiceFilterPartsList = ParseServiceFilterParts(transfer.ServiceFilterParts);
            }

            return FMSResponse<List<VehicleTransferDTO>>.Success(transferDTOs, "Transfers fetched successfully");
        }
        catch (Exception ex)
        {
            return FMSResponse<List<VehicleTransferDTO>>.Failed($"Error fetching transfers: {ex.Message}");
        }
    }

    private static List<ServiceFilterPartDTO>? ParseServiceFilterParts(string? rawValue)
    {
        if (string.IsNullOrWhiteSpace(rawValue))
        {
            return null;
        }

        try
        {
            var parsed = JsonSerializer.Deserialize<List<ServiceFilterPartDTO>>(rawValue, _serviceFilterJsonOptions);
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
