using AutoMapper;
using FMS.Application.Features.VehicleMaintenance.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.VehicleMaintenance.Queries;

public record GetMaintenanceByIdQuery(int MaintenanceId) : IRequest<VehicleMaintenanceDTO?>;

public class GetMaintenanceByIdQueryHandler : IRequestHandler<GetMaintenanceByIdQuery, VehicleMaintenanceDTO?>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<GetMaintenanceByIdQueryHandler> _logger;

    public GetMaintenanceByIdQueryHandler(GpsdataContext context, IMapper mapper, ILogger<GetMaintenanceByIdQueryHandler> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<VehicleMaintenanceDTO?> Handle(GetMaintenanceByIdQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var maintenance = await _context.Set<Domain.Entities.Features.VehicleManagement.VehicleMaintenance>()
                .AsNoTracking()
                .Include(m => m.Vehicle)
                .Include(m => m.MaintenanceSchedule)
                .Include(m => m.Issues)
                .FirstOrDefaultAsync(m => m.MaintenanceId == request.MaintenanceId, cancellationToken);

            return maintenance != null ? _mapper.Map<VehicleMaintenanceDTO>(maintenance) : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving maintenance record");
            return null;
        }
    }
}
