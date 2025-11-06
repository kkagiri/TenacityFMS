using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.VehicleMaintenance.DTOs;
using FMS.Domain.Entities.Features.VehicleManagement;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.VehicleMaintenance.Commands;

public record CreateMaintenanceScheduleCommand(MaintenanceScheduleDTO ScheduleDTO) : IRequest<FMSResponseMessage<MaintenanceScheduleDTO>>;

public class CreateMaintenanceScheduleCommandHandler : IRequestHandler<CreateMaintenanceScheduleCommand, FMSResponseMessage<MaintenanceScheduleDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<CreateMaintenanceScheduleCommandHandler> _logger;

    public CreateMaintenanceScheduleCommandHandler(GpsdataContext context, IMapper mapper, ILogger<CreateMaintenanceScheduleCommandHandler> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<FMSResponseMessage<MaintenanceScheduleDTO>> Handle(CreateMaintenanceScheduleCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Set timestamps
            request.ScheduleDTO.DateCreated = DateTime.UtcNow;
            request.ScheduleDTO.DateModified = DateTime.UtcNow;

            // Map and save
            var schedule = _mapper.Map<MaintenanceSchedule>(request.ScheduleDTO);
            _context.Set<MaintenanceSchedule>().Add(schedule);
            await _context.SaveChangesAsync(cancellationToken);

            var responseDTO = _mapper.Map<MaintenanceScheduleDTO>(schedule);
            return new FMSResponseMessage<MaintenanceScheduleDTO>(true, "Maintenance schedule created successfully", responseDTO);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating maintenance schedule");
            return new FMSResponseMessage<MaintenanceScheduleDTO>(false, $"Error creating maintenance schedule: {ex.Message}", null);
        }
    }
}
