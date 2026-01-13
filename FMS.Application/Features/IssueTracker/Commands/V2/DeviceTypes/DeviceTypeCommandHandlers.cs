using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.DTOs.V2;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.IssueTracker.Commands.V2.DeviceTypes;

public class CreateDeviceTypeCommandHandler : IRequestHandler<CreateDeviceTypeCommand, FMSResponse<DeviceTypeDTO>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<CreateDeviceTypeCommandHandler> _logger;

    public CreateDeviceTypeCommandHandler(GpsdataContext context, ILogger<CreateDeviceTypeCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<DeviceTypeDTO>> Handle(CreateDeviceTypeCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Validate unique name
            var existingName = await _context.Devicetypes
                .AnyAsync(d => d.Name == request.DeviceType.Name, cancellationToken);

            if (existingName)
            {
                return FMSResponse<DeviceTypeDTO>.Failed($"Device Type with name '{request.DeviceType.Name}' already exists.");
            }

            var entity = new Devicetype
            {
                Name = request.DeviceType.Name,
                Description = request.DeviceType.Description,
                IsMonitored = request.DeviceType.IsMonitored,
                MonitoringEndpoint = request.DeviceType.MonitoringEndpoint,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Devicetypes.Add(entity);
            await _context.SaveChangesAsync(cancellationToken);

            var dto = new DeviceTypeDTO
            {
                Id = entity.Id,
                Name = entity.Name,
                Description = entity.Description,
                IsMonitored = entity.IsMonitored,
                MonitoringEndpoint = entity.MonitoringEndpoint,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt,
                TemplateCount = 0
            };

            _logger.LogInformation("Created Device Type {Id}: {Name}", entity.Id, entity.Name);
            return FMSResponse<DeviceTypeDTO>.Success(dto, "Device Type created successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating Device Type");
            return FMSResponse<DeviceTypeDTO>.Failed($"Error creating Device Type: {ex.Message}");
        }
    }
}

public class UpdateDeviceTypeCommandHandler : IRequestHandler<UpdateDeviceTypeCommand, FMSResponse<DeviceTypeDTO>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<UpdateDeviceTypeCommandHandler> _logger;

    public UpdateDeviceTypeCommandHandler(GpsdataContext context, ILogger<UpdateDeviceTypeCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<DeviceTypeDTO>> Handle(UpdateDeviceTypeCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var entity = await _context.Devicetypes
                .Include(d => d.Issuetemplates)
                .FirstOrDefaultAsync(d => d.Id == request.DeviceType.Id, cancellationToken);

            if (entity == null)
            {
                return FMSResponse<DeviceTypeDTO>.Failed($"Device Type with ID {request.DeviceType.Id} not found.");
            }

            // Check for duplicate name (excluding current)
            var existingName = await _context.Devicetypes
                .AnyAsync(d => d.Name == request.DeviceType.Name && d.Id != request.DeviceType.Id, cancellationToken);

            if (existingName)
            {
                return FMSResponse<DeviceTypeDTO>.Failed($"Device Type with name '{request.DeviceType.Name}' already exists.");
            }

            entity.Name = request.DeviceType.Name;
            entity.Description = request.DeviceType.Description;
            entity.IsMonitored = request.DeviceType.IsMonitored;
            entity.MonitoringEndpoint = request.DeviceType.MonitoringEndpoint;
            entity.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            var dto = new DeviceTypeDTO
            {
                Id = entity.Id,
                Name = entity.Name,
                Description = entity.Description,
                IsMonitored = entity.IsMonitored,
                MonitoringEndpoint = entity.MonitoringEndpoint,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt,
                TemplateCount = entity.Issuetemplates?.Count ?? 0
            };

            _logger.LogInformation("Updated Device Type {Id}: {Name}", entity.Id, entity.Name);
            return FMSResponse<DeviceTypeDTO>.Success(dto, "Device Type updated successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating Device Type {Id}", request.DeviceType.Id);
            return FMSResponse<DeviceTypeDTO>.Failed($"Error updating Device Type: {ex.Message}");
        }
    }
}

public class DeleteDeviceTypeCommandHandler : IRequestHandler<DeleteDeviceTypeCommand, FMSResponse<bool>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<DeleteDeviceTypeCommandHandler> _logger;

    public DeleteDeviceTypeCommandHandler(GpsdataContext context, ILogger<DeleteDeviceTypeCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<bool>> Handle(DeleteDeviceTypeCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var entity = await _context.Devicetypes
                .Include(d => d.Issuetemplates)
                .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken);

            if (entity == null)
            {
                return FMSResponse<bool>.Failed($"Device Type with ID {request.Id} not found.");
            }

            // Check if templates exist
            if (entity.Issuetemplates?.Any() == true)
            {
                return FMSResponse<bool>.Failed($"Cannot delete Device Type '{entity.Name}' - it has {entity.Issuetemplates.Count} associated templates.");
            }

            _context.Devicetypes.Remove(entity);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Deleted Device Type {Id}: {Name}", entity.Id, entity.Name);
            return FMSResponse<bool>.Success(true, "Device Type deleted successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting Device Type {Id}", request.Id);
            return FMSResponse<bool>.Failed($"Error deleting Device Type: {ex.Message}");
        }
    }
}
