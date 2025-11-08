using AutoMapper;
using FMS.Application.Features.VehicleMaintenance.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.VehicleMaintenance.Queries;

public record GetAllMaintenanceQuery(
    int? VehicleId = null,
    string? Status = null,
    int? SiteId = null,
    int? VehicleTypeId = null,
    int? VehicleModelId = null
) : IRequest<List<VehicleMaintenanceDTO>>;

public class GetAllMaintenanceQueryHandler : IRequestHandler<GetAllMaintenanceQuery, List<VehicleMaintenanceDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<GetAllMaintenanceQueryHandler> _logger;

    public GetAllMaintenanceQueryHandler(GpsdataContext context, IMapper mapper, ILogger<GetAllMaintenanceQueryHandler> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<List<VehicleMaintenanceDTO>> Handle(GetAllMaintenanceQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var query = _context.Set<Domain.Entities.Features.VehicleManagement.VehicleMaintenance>()
                .AsNoTracking()
                .Include(m => m.Vehicle)
                .Include(m => m.MaintenanceSchedule)
                .Include(m => m.Issues)
                .AsQueryable();

            // Filter by vehicle if specified
            if (request.VehicleId.HasValue)
            {
                query = query.Where(m => m.VehicleId == request.VehicleId.Value);
            }

            // Filter by status if specified
            if (!string.IsNullOrEmpty(request.Status))
            {
                query = query.Where(m => m.Status == request.Status);
            }

            // Filter by site if specified
            if (request.SiteId.HasValue)
            {
                query = query.Where(m => m.Vehicle != null && m.Vehicle.SiteId == request.SiteId.Value);
            }

            // Filter by vehicle type if specified
            if (request.VehicleTypeId.HasValue)
            {
                query = query.Where(m => m.Vehicle != null && m.Vehicle.VehicleTypeId == request.VehicleTypeId.Value);
            }

            // Filter by vehicle model if specified
            if (request.VehicleModelId.HasValue)
            {
                query = query.Where(m => m.Vehicle != null && m.Vehicle.VehicleModelId == request.VehicleModelId.Value);
            }

            var maintenanceRecords = await query
                .OrderByDescending(m => m.DateCreated)
                .ToListAsync(cancellationToken);

            return _mapper.Map<List<VehicleMaintenanceDTO>>(maintenanceRecords);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving maintenance records");
            return new List<VehicleMaintenanceDTO>();
        }
    }
}
