using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.VehicleMaintenance.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.VehicleMaintenance.Commands;

public record UpdateMaintenanceCommand(VehicleMaintenanceDTO MaintenanceDTO) : IRequest<FMSResponseMessage<VehicleMaintenanceDTO>>;

public class UpdateMaintenanceCommandHandler : IRequestHandler<UpdateMaintenanceCommand, FMSResponseMessage<VehicleMaintenanceDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<UpdateMaintenanceCommandHandler> _logger;

    public UpdateMaintenanceCommandHandler(GpsdataContext context, IMapper mapper, ILogger<UpdateMaintenanceCommandHandler> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<FMSResponseMessage<VehicleMaintenanceDTO>> Handle(UpdateMaintenanceCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var maintenance = await _context.Set<Domain.Entities.Features.VehicleManagement.VehicleMaintenance>()
                .Include(m => m.Vehicle)
                .FirstOrDefaultAsync(m => m.MaintenanceId == request.MaintenanceDTO.MaintenanceId, cancellationToken);

            if (maintenance == null)
            {
                return new FMSResponseMessage<VehicleMaintenanceDTO>(false, $"Maintenance record with ID {request.MaintenanceDTO.MaintenanceId} not found", null);
            }

            // Update properties
            request.MaintenanceDTO.DateModified = DateTime.UtcNow;
            _mapper.Map(request.MaintenanceDTO, maintenance);

            await _context.SaveChangesAsync(cancellationToken);

            var responseDTO = _mapper.Map<VehicleMaintenanceDTO>(maintenance);
            return new FMSResponseMessage<VehicleMaintenanceDTO>(true, "Maintenance record updated successfully", responseDTO);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating maintenance record");
            return new FMSResponseMessage<VehicleMaintenanceDTO>(false, $"Error updating maintenance record: {ex.Message}", null);
        }
    }
}
