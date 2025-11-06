using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.VehicleMaintenance.DTOs;
using FMS.Domain.Entities.Features.VehicleManagement;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.VehicleMaintenance.Commands;

public record CreateMaintenanceCommand(VehicleMaintenanceDTO MaintenanceDTO) : IRequest<FMSResponseMessage<VehicleMaintenanceDTO>>;

public class CreateMaintenanceCommandHandler : IRequestHandler<CreateMaintenanceCommand, FMSResponseMessage<VehicleMaintenanceDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<CreateMaintenanceCommandHandler> _logger;

    public CreateMaintenanceCommandHandler(GpsdataContext context, IMapper mapper, ILogger<CreateMaintenanceCommandHandler> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<FMSResponseMessage<VehicleMaintenanceDTO>> Handle(CreateMaintenanceCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Validate vehicle exists
            var vehicle = await _context.Vehicles.FindAsync(new object[] { request.MaintenanceDTO.VehicleId }, cancellationToken);
            if (vehicle == null)
            {
                return new FMSResponseMessage<VehicleMaintenanceDTO>(false, $"Vehicle with ID {request.MaintenanceDTO.VehicleId} not found", null);
            }

            // Validate schedule if provided
            if (request.MaintenanceDTO.MaintenanceScheduleId.HasValue)
            {
                var schedule = await _context.Set<MaintenanceSchedule>().FindAsync(new object[] { request.MaintenanceDTO.MaintenanceScheduleId.Value }, cancellationToken);
                if (schedule == null)
                {
                    return new FMSResponseMessage<VehicleMaintenanceDTO>(false, $"Maintenance schedule with ID {request.MaintenanceDTO.MaintenanceScheduleId} not found", null);
                }
            }

            // Set timestamps
            request.MaintenanceDTO.DateCreated = DateTime.UtcNow;
            request.MaintenanceDTO.DateModified = DateTime.UtcNow;

            // Map and save
            var maintenance = _mapper.Map<Domain.Entities.Features.VehicleManagement.VehicleMaintenance>(request.MaintenanceDTO);
            _context.Set<Domain.Entities.Features.VehicleManagement.VehicleMaintenance>().Add(maintenance);
            await _context.SaveChangesAsync(cancellationToken);

            // Load related data for response
            await _context.Entry(maintenance)
                .Reference(m => m.Vehicle)
                .LoadAsync(cancellationToken);

            var responseDTO = _mapper.Map<VehicleMaintenanceDTO>(maintenance);
            return new FMSResponseMessage<VehicleMaintenanceDTO>(true, "Maintenance record created successfully", responseDTO);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating maintenance record");
            return new FMSResponseMessage<VehicleMaintenanceDTO>(false, $"Error creating maintenance record: {ex.Message}", null);
        }
    }
}
