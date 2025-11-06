using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.VehicleMaintenance.DTOs;
using FMS.Domain.Entities.Features.VehicleManagement;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.VehicleMaintenance.Commands;

public record UpdateMaintenanceScheduleCommand(MaintenanceScheduleDTO ScheduleDTO) : IRequest<FMSResponseMessage<MaintenanceScheduleDTO>>;

public class UpdateMaintenanceScheduleCommandHandler : IRequestHandler<UpdateMaintenanceScheduleCommand, FMSResponseMessage<MaintenanceScheduleDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<UpdateMaintenanceScheduleCommandHandler> _logger;

    public UpdateMaintenanceScheduleCommandHandler(GpsdataContext context, IMapper mapper, ILogger<UpdateMaintenanceScheduleCommandHandler> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<FMSResponseMessage<MaintenanceScheduleDTO>> Handle(UpdateMaintenanceScheduleCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var schedule = await _context.Set<MaintenanceSchedule>()
                .FirstOrDefaultAsync(s => s.ScheduleId == request.ScheduleDTO.ScheduleId, cancellationToken);

            if (schedule == null)
            {
                return new FMSResponseMessage<MaintenanceScheduleDTO>(false, $"Maintenance schedule with ID {request.ScheduleDTO.ScheduleId} not found", null);
            }

            // Update properties
            request.ScheduleDTO.DateModified = DateTime.UtcNow;
            _mapper.Map(request.ScheduleDTO, schedule);

            await _context.SaveChangesAsync(cancellationToken);

            var responseDTO = _mapper.Map<MaintenanceScheduleDTO>(schedule);
            return new FMSResponseMessage<MaintenanceScheduleDTO>(true, "Maintenance schedule updated successfully", responseDTO);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating maintenance schedule");
            return new FMSResponseMessage<MaintenanceScheduleDTO>(false, $"Error updating maintenance schedule: {ex.Message}", null);
        }
    }
}
