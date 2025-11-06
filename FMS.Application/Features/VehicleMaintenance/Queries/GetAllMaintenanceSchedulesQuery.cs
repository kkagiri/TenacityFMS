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

public record GetAllMaintenanceSchedulesQuery(bool? IsActive = null) : IRequest<List<MaintenanceScheduleDTO>>;

public class GetAllMaintenanceSchedulesQueryHandler : IRequestHandler<GetAllMaintenanceSchedulesQuery, List<MaintenanceScheduleDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<GetAllMaintenanceSchedulesQueryHandler> _logger;

    public GetAllMaintenanceSchedulesQueryHandler(GpsdataContext context, IMapper mapper, ILogger<GetAllMaintenanceSchedulesQueryHandler> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<List<MaintenanceScheduleDTO>> Handle(GetAllMaintenanceSchedulesQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var query = _context.Set<Domain.Entities.Features.VehicleManagement.MaintenanceSchedule>()
                .AsNoTracking()
                .Include(s => s.Vehicle)
                .Include(s => s.VehicleType)
                .AsQueryable();

            // Filter by active status if specified
            if (request.IsActive.HasValue)
            {
                query = query.Where(s => s.IsActive == request.IsActive.Value);
            }

            var schedules = await query
                .OrderBy(s => s.MaintenanceType)
                .ToListAsync(cancellationToken);

            return _mapper.Map<List<MaintenanceScheduleDTO>>(schedules);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving maintenance schedules");
            return new List<MaintenanceScheduleDTO>();
        }
    }
}
