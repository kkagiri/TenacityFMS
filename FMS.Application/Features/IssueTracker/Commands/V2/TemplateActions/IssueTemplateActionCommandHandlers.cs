/**
 * File: IssueTemplateActionCommandHandlers.cs
 * Purpose: Command handlers for IssueTemplateAction CRUD operations
 * Dependencies: MediatR, EF Core, GpsdataContext, FMSResponse
 * Last Modified: 2026-02-21
 *
 * Key Handlers:
 * - CreateTemplateActionCommandHandler: Create with manual ID assignment
 * - UpdateTemplateActionCommandHandler: Update existing action
 * - DeleteTemplateActionCommandHandler: Delete action
 * - ToggleTemplateActionActiveCommandHandler: Toggle IsActive flag
 */
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

namespace FMS.Application.Features.IssueTracker.Commands.V2.TemplateActions;

public class CreateTemplateActionCommandHandler : IRequestHandler<CreateTemplateActionCommand, FMSResponse<IssueTemplateActionDTO>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<CreateTemplateActionCommandHandler> _logger;

    public CreateTemplateActionCommandHandler(GpsdataContext context, ILogger<CreateTemplateActionCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<IssueTemplateActionDTO>> Handle(CreateTemplateActionCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var dto = request.Action;

            // Validate template exists
            var template = await _context.Issuetemplates
                .FirstOrDefaultAsync(t => t.Id == dto.IssueTemplateId, cancellationToken);

            if (template == null)
            {
                return FMSResponse<IssueTemplateActionDTO>.Failed($"Issue Template with ID {dto.IssueTemplateId} not found.");
            }

            // Validate action type
            var validTypes = new[] { "General", "DeviceChange", "CameraInstall", "SensorReplacement", "SensorCalibration" };
            if (!validTypes.Contains(dto.ActionType, StringComparer.OrdinalIgnoreCase))
            {
                return FMSResponse<IssueTemplateActionDTO>.Failed($"Invalid ActionType '{dto.ActionType}'. Valid values: {string.Join(", ", validTypes)}");
            }

            // Check unique name within template
            var nameExists = await _context.IssueTemplateActions
                .AnyAsync(a => a.IssueTemplateId == dto.IssueTemplateId && a.Name == dto.Name, cancellationToken);

            if (nameExists)
            {
                return FMSResponse<IssueTemplateActionDTO>.Failed($"Action '{dto.Name}' already exists for this template.");
            }

            var now = DateTime.UtcNow;
            IssueTemplateAction? entity = null;

            for (var attempt = 0; attempt < 2; attempt++)
            {
                var nextId = await GetNextIdAsync(cancellationToken);

                entity = new IssueTemplateAction
                {
                    Id = nextId,
                    IssueTemplateId = dto.IssueTemplateId,
                    Name = dto.Name.Trim(),
                    ActionType = dto.ActionType,
                    Description = dto.Description?.Trim(),
                    RequiresDeviceDetails = dto.RequiresDeviceDetails,
                    RequiresSourceVehicle = dto.RequiresSourceVehicle,
                    RequiresCameraDetails = dto.RequiresCameraDetails,
                    SortOrder = dto.SortOrder,
                    IsActive = dto.IsActive,
                    CreatedAt = now,
                    UpdatedAt = now
                };

                _context.IssueTemplateActions.Add(entity);

                try
                {
                    await _context.SaveChangesAsync(cancellationToken);
                    break;
                }
                catch (DbUpdateException ex) when (attempt == 0 && IsDuplicateKeyException(ex))
                {
                    _context.Entry(entity).State = EntityState.Detached;
                    entity = null;
                }
            }

            if (entity == null)
            {
                return FMSResponse<IssueTemplateActionDTO>.Failed("Failed to generate a valid action ID.");
            }

            _logger.LogInformation("Created template action {ActionId} '{ActionName}' for template {TemplateId}",
                entity.Id, entity.Name, entity.IssueTemplateId);

            return FMSResponse<IssueTemplateActionDTO>.Success(MapToDto(entity, template.Name), "Template action created successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating template action");
            return FMSResponse<IssueTemplateActionDTO>.Failed($"Error creating template action: {ex.Message}");
        }
    }

    private async Task<int> GetNextIdAsync(CancellationToken cancellationToken)
    {
        var maxId = await _context.IssueTemplateActions
            .Select(a => (int?)a.Id)
            .MaxAsync(cancellationToken) ?? 0;
        return maxId + 1;
    }

    private static bool IsDuplicateKeyException(DbUpdateException ex)
    {
        return ex.InnerException?.Message?.Contains("Duplicate entry", StringComparison.OrdinalIgnoreCase) == true;
    }

    private static IssueTemplateActionDTO MapToDto(IssueTemplateAction entity, string? templateName) => new()
    {
        Id = entity.Id,
        IssueTemplateId = entity.IssueTemplateId,
        IssueTemplateName = templateName,
        Name = entity.Name,
        ActionType = entity.ActionType,
        Description = entity.Description,
        RequiresDeviceDetails = entity.RequiresDeviceDetails,
        RequiresSourceVehicle = entity.RequiresSourceVehicle,
        RequiresCameraDetails = entity.RequiresCameraDetails,
        SortOrder = entity.SortOrder,
        IsActive = entity.IsActive,
        CreatedAt = entity.CreatedAt,
        UpdatedAt = entity.UpdatedAt
    };
}

public class UpdateTemplateActionCommandHandler : IRequestHandler<UpdateTemplateActionCommand, FMSResponse<IssueTemplateActionDTO>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<UpdateTemplateActionCommandHandler> _logger;

    public UpdateTemplateActionCommandHandler(GpsdataContext context, ILogger<UpdateTemplateActionCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<IssueTemplateActionDTO>> Handle(UpdateTemplateActionCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var dto = request.Action;

            var entity = await _context.IssueTemplateActions
                .Include(a => a.IssueTemplate)
                .FirstOrDefaultAsync(a => a.Id == dto.Id, cancellationToken);

            if (entity == null)
            {
                return FMSResponse<IssueTemplateActionDTO>.Failed($"Template action with ID {dto.Id} not found.");
            }

            // Validate action type
            var validTypes = new[] { "General", "DeviceChange", "CameraInstall", "SensorReplacement", "SensorCalibration" };
            if (!validTypes.Contains(dto.ActionType, StringComparer.OrdinalIgnoreCase))
            {
                return FMSResponse<IssueTemplateActionDTO>.Failed($"Invalid ActionType '{dto.ActionType}'. Valid values: {string.Join(", ", validTypes)}");
            }

            // Check unique name within template (exclude self)
            var nameExists = await _context.IssueTemplateActions
                .AnyAsync(a => a.IssueTemplateId == entity.IssueTemplateId && a.Name == dto.Name && a.Id != dto.Id, cancellationToken);

            if (nameExists)
            {
                return FMSResponse<IssueTemplateActionDTO>.Failed($"Action '{dto.Name}' already exists for this template.");
            }

            entity.Name = dto.Name.Trim();
            entity.ActionType = dto.ActionType;
            entity.Description = dto.Description?.Trim();
            entity.RequiresDeviceDetails = dto.RequiresDeviceDetails;
            entity.RequiresSourceVehicle = dto.RequiresSourceVehicle;
            entity.RequiresCameraDetails = dto.RequiresCameraDetails;
            entity.SortOrder = dto.SortOrder;
            entity.IsActive = dto.IsActive;
            entity.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Updated template action {ActionId}", entity.Id);

            return FMSResponse<IssueTemplateActionDTO>.Success(new IssueTemplateActionDTO
            {
                Id = entity.Id,
                IssueTemplateId = entity.IssueTemplateId,
                IssueTemplateName = entity.IssueTemplate?.Name,
                Name = entity.Name,
                ActionType = entity.ActionType,
                Description = entity.Description,
                RequiresDeviceDetails = entity.RequiresDeviceDetails,
                RequiresSourceVehicle = entity.RequiresSourceVehicle,
                RequiresCameraDetails = entity.RequiresCameraDetails,
                SortOrder = entity.SortOrder,
                IsActive = entity.IsActive,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt
            }, "Template action updated successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating template action {ActionId}", request.Action.Id);
            return FMSResponse<IssueTemplateActionDTO>.Failed($"Error updating template action: {ex.Message}");
        }
    }
}

public class DeleteTemplateActionCommandHandler : IRequestHandler<DeleteTemplateActionCommand, FMSResponse<bool>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<DeleteTemplateActionCommandHandler> _logger;

    public DeleteTemplateActionCommandHandler(GpsdataContext context, ILogger<DeleteTemplateActionCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<bool>> Handle(DeleteTemplateActionCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var entity = await _context.IssueTemplateActions
                .FirstOrDefaultAsync(a => a.Id == request.Id, cancellationToken);

            if (entity == null)
            {
                return FMSResponse<bool>.Failed($"Template action with ID {request.Id} not found.");
            }

            _context.IssueTemplateActions.Remove(entity);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Deleted template action {ActionId} '{ActionName}'", entity.Id, entity.Name);

            return FMSResponse<bool>.Success(true, "Template action deleted successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting template action {ActionId}", request.Id);
            return FMSResponse<bool>.Failed($"Error deleting template action: {ex.Message}");
        }
    }
}

public class ToggleTemplateActionActiveCommandHandler : IRequestHandler<ToggleTemplateActionActiveCommand, FMSResponse<IssueTemplateActionDTO>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<ToggleTemplateActionActiveCommandHandler> _logger;

    public ToggleTemplateActionActiveCommandHandler(GpsdataContext context, ILogger<ToggleTemplateActionActiveCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<IssueTemplateActionDTO>> Handle(ToggleTemplateActionActiveCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var entity = await _context.IssueTemplateActions
                .Include(a => a.IssueTemplate)
                .FirstOrDefaultAsync(a => a.Id == request.Id, cancellationToken);

            if (entity == null)
            {
                return FMSResponse<IssueTemplateActionDTO>.Failed($"Template action with ID {request.Id} not found.");
            }

            entity.IsActive = !entity.IsActive;
            entity.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Toggled template action {ActionId} IsActive to {IsActive}", entity.Id, entity.IsActive);

            return FMSResponse<IssueTemplateActionDTO>.Success(new IssueTemplateActionDTO
            {
                Id = entity.Id,
                IssueTemplateId = entity.IssueTemplateId,
                IssueTemplateName = entity.IssueTemplate?.Name,
                Name = entity.Name,
                ActionType = entity.ActionType,
                Description = entity.Description,
                RequiresDeviceDetails = entity.RequiresDeviceDetails,
                RequiresSourceVehicle = entity.RequiresSourceVehicle,
                RequiresCameraDetails = entity.RequiresCameraDetails,
                SortOrder = entity.SortOrder,
                IsActive = entity.IsActive,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt
            }, $"Template action {(entity.IsActive ? "activated" : "deactivated")}.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error toggling template action {ActionId}", request.Id);
            return FMSResponse<IssueTemplateActionDTO>.Failed($"Error toggling template action: {ex.Message}");
        }
    }
}
