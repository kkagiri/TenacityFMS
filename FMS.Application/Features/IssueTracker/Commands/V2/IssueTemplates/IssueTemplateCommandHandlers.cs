/*
 * File: IssueTemplateCommandHandlers.cs
 * Purpose: Command handlers for Issue Template create/update/delete/toggle operations (Issue Tracker V2)
 * Dependencies: MediatR, Entity Framework Core, GpsdataContext, FMSResponse
 * Last Modified: 2026-02-03
 */
using System;
using System.Collections.Generic;
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

namespace FMS.Application.Features.IssueTracker.Commands.V2.IssueTemplates;

public class CreateIssueTemplateCommandHandler : IRequestHandler<CreateIssueTemplateCommand, FMSResponse<IssueTemplateDTO>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<CreateIssueTemplateCommandHandler> _logger;

    public CreateIssueTemplateCommandHandler(GpsdataContext context, ILogger<CreateIssueTemplateCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<IssueTemplateDTO>> Handle(CreateIssueTemplateCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Validate Device Type exists
            var deviceType = await _context.Devicetypes
                .FirstOrDefaultAsync(d => d.Id == request.Template.DeviceTypeId, cancellationToken);

            if (deviceType == null)
            {
                return FMSResponse<IssueTemplateDTO>.Failed($"Device Type with ID {request.Template.DeviceTypeId} not found.");
            }

            // Validate unique name within device type
            var existingName = await _context.Issuetemplates
                .AnyAsync(t => t.DeviceTypeId == request.Template.DeviceTypeId &&
                               t.Name == request.Template.Name, cancellationToken);

            if (existingName)
            {
                return FMSResponse<IssueTemplateDTO>.Failed($"Issue Template with name '{request.Template.Name}' already exists for this Device Type.");
            }

            // Validate Priority if provided
            string? priorityName = null;
            if (request.Template.DefaultPriorityId.HasValue)
            {
                var priority = await _context.Issuepriorities
                    .FirstOrDefaultAsync(p => p.Id == request.Template.DefaultPriorityId, cancellationToken);
                if (priority == null)
                {
                    return FMSResponse<IssueTemplateDTO>.Failed($"Priority with ID {request.Template.DefaultPriorityId} not found.");
                }
                priorityName = priority.Name;
            }

            // Validate Status if provided
            string? statusName = null;
            if (request.Template.DefaultStatusId.HasValue)
            {
                var status = await _context.Issuestatuses
                    .FirstOrDefaultAsync(s => s.Id == request.Template.DefaultStatusId, cancellationToken);
                if (status == null)
                {
                    return FMSResponse<IssueTemplateDTO>.Failed($"Status with ID {request.Template.DefaultStatusId} not found.");
                }
                statusName = status.Status;
            }

            // Validate Categories if provided
            List<Issuecategory> categories = new List<Issuecategory>();
            if (request.Template.CategoryIds != null && request.Template.CategoryIds.Any())
            {
                categories = await _context.Issuecategories
                    .Where(c => request.Template.CategoryIds.Contains(c.Id))
                    .ToListAsync(cancellationToken);

                if (categories.Count != request.Template.CategoryIds.Count)
                {
                    var missingIds = request.Template.CategoryIds.Except(categories.Select(c => c.Id));
                    return FMSResponse<IssueTemplateDTO>.Failed($"Categories with IDs {string.Join(", ", missingIds)} not found.");
                }
            }

            // Validate DefaultAssignee if provided - supports comma-separated user IDs for multiple assignees
            string? defaultAssigneeId = null;
            string? defaultAssigneeName = null;
            if (!string.IsNullOrEmpty(request.Template.DefaultAssignee))
            {
                var rawIds = request.Template.DefaultAssignee
                    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .Distinct()
                    .ToList();

                var resolvedUsers = await _context.Users
                    .AsNoTracking()
                    .Where(u => rawIds.Contains(u.Id) || rawIds.Contains(u.UserName))
                    .Select(u => new { u.Id, u.UserName })
                    .ToListAsync(cancellationToken);

                if (resolvedUsers.Count == 0)
                {
                    return FMSResponse<IssueTemplateDTO>.Failed($"No valid users found for Default Assignee(s): '{request.Template.DefaultAssignee}'.");
                }

                defaultAssigneeId = string.Join(",", resolvedUsers.Select(u => u.Id));
                defaultAssigneeName = string.Join(", ", resolvedUsers.Select(u => u.UserName));
            }

            var now = DateTime.UtcNow;
            Issuetemplate? entity = null;

            // ID is assigned manually for compatibility with environments where issuetemplate.ID
            // is not configured as AUTO_INCREMENT.
            for (var attempt = 0; attempt < 2; attempt++)
            {
                var nextId = await GetNextIssueTemplateIdAsync(cancellationToken);

                entity = new Issuetemplate
                {
                    Id = nextId,
                    DeviceTypeId = request.Template.DeviceTypeId,
                    Name = request.Template.Name,
                    TitleTemplate = request.Template.TitleTemplate,
                    DescriptionTemplate = request.Template.DescriptionTemplate,
                    DefaultPriorityId = request.Template.DefaultPriorityId,
                    DefaultStatusId = request.Template.DefaultStatusId,
                    IsActive = request.Template.IsActive,
                    CanAutoCreate = request.Template.CanAutoCreate,
                    OfflineThresholdMinutes = request.Template.OfflineThresholdMinutes,
                    DefaultAssignee = defaultAssigneeId,
                    CreatedAt = now,
                    UpdatedAt = now
                };

                _context.Issuetemplates.Add(entity);

                try
                {
                    await _context.SaveChangesAsync(cancellationToken);

                    // Assign categories to template
                    if (categories.Any())
                    {
                        entity.Categories = categories;
                        await _context.SaveChangesAsync(cancellationToken);
                    }

                    break;
                }
                catch (DbUpdateException ex) when (attempt == 0 && IsDuplicateKeyException(ex))
                {
                    _context.Entry(entity).State = EntityState.Detached;
                }
            }

            if (entity == null || entity.Id <= 0)
            {
                return FMSResponse<IssueTemplateDTO>.Failed("Error creating Issue Template: failed to generate a valid template ID.");
            }

            var dto = new IssueTemplateDTO
            {
                Id = entity.Id,
                DeviceTypeId = entity.DeviceTypeId,
                DeviceTypeName = deviceType.Name,
                Name = entity.Name,
                TitleTemplate = entity.TitleTemplate,
                DescriptionTemplate = entity.DescriptionTemplate,
                DefaultPriorityId = entity.DefaultPriorityId,
                DefaultPriorityName = priorityName,
                DefaultStatusId = entity.DefaultStatusId,
                DefaultStatusName = statusName,
                IsActive = entity.IsActive,
                CanAutoCreate = entity.CanAutoCreate,
                OfflineThresholdMinutes = entity.OfflineThresholdMinutes,
                DefaultAssignee = entity.DefaultAssignee,
                DefaultAssigneeName = defaultAssigneeName,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt,
                HasAutoCloseConfig = false,
                AutoCloseEnabled = false,
                CategoryIds = categories.Select(c => c.Id).ToList(),
                Categories = categories.Select(c => new CategorySummaryDTO
                {
                    Id = c.Id,
                    Name = c.Name ?? string.Empty,
                    Description = c.Description
                }).ToList()
            };

            _logger.LogInformation("Created Issue Template {Id}: {Name} for Device Type {DeviceTypeId}",
                entity.Id, entity.Name, entity.DeviceTypeId);
            return FMSResponse<IssueTemplateDTO>.Success(dto, "Issue Template created successfully.");
        }
        catch (DbUpdateConcurrencyException ex)
        {
            _logger.LogError(ex, "Concurrency error creating Issue Template for DeviceTypeId {DeviceTypeId}", request.Template.DeviceTypeId);
            return FMSResponse<IssueTemplateDTO>.Failed("Error creating Issue Template: failed to persist template due to database concurrency/state mismatch. Verify issuetemplate.ID key generation.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating Issue Template");
            return FMSResponse<IssueTemplateDTO>.Failed($"Error creating Issue Template: {ex.Message}");
        }
    }

    private async Task<int> GetNextIssueTemplateIdAsync(CancellationToken cancellationToken)
    {
        var maxId = await _context.Issuetemplates
            .AsNoTracking()
            .MaxAsync(t => (int?)t.Id, cancellationToken);

        return (maxId ?? 0) + 1;
    }

    private static bool IsDuplicateKeyException(DbUpdateException ex)
    {
        var message = ex.InnerException?.Message ?? ex.Message;
        return message.Contains("Duplicate entry", StringComparison.OrdinalIgnoreCase);
    }
}

public class UpdateIssueTemplateCommandHandler : IRequestHandler<UpdateIssueTemplateCommand, FMSResponse<IssueTemplateDTO>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<UpdateIssueTemplateCommandHandler> _logger;

    public UpdateIssueTemplateCommandHandler(GpsdataContext context, ILogger<UpdateIssueTemplateCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<IssueTemplateDTO>> Handle(UpdateIssueTemplateCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var entity = await _context.Issuetemplates
                .Include(t => t.DeviceType)
                .Include(t => t.AutoCloseConfig)
                .Include(t => t.Categories)
                .FirstOrDefaultAsync(t => t.Id == request.Template.Id, cancellationToken);

            if (entity == null)
            {
                return FMSResponse<IssueTemplateDTO>.Failed($"Issue Template with ID {request.Template.Id} not found.");
            }

            // Validate Device Type if changed
            if (entity.DeviceTypeId != request.Template.DeviceTypeId)
            {
                var deviceType = await _context.Devicetypes
                    .FirstOrDefaultAsync(d => d.Id == request.Template.DeviceTypeId, cancellationToken);
                if (deviceType == null)
                {
                    return FMSResponse<IssueTemplateDTO>.Failed($"Device Type with ID {request.Template.DeviceTypeId} not found.");
                }
            }

            // Check for duplicate name (excluding current)
            var existingName = await _context.Issuetemplates
                .AnyAsync(t => t.DeviceTypeId == request.Template.DeviceTypeId &&
                               t.Name == request.Template.Name &&
                               t.Id != request.Template.Id, cancellationToken);

            if (existingName)
            {
                return FMSResponse<IssueTemplateDTO>.Failed($"Issue Template with name '{request.Template.Name}' already exists for this Device Type.");
            }

            // Get names for response
            var deviceTypeName = (await _context.Devicetypes
                .FirstOrDefaultAsync(d => d.Id == request.Template.DeviceTypeId, cancellationToken))?.Name ?? "";

            string? priorityName = null;
            if (request.Template.DefaultPriorityId.HasValue)
            {
                priorityName = (await _context.Issuepriorities
                    .FirstOrDefaultAsync(p => p.Id == request.Template.DefaultPriorityId, cancellationToken))?.Name;
            }

            string? statusName = null;
            if (request.Template.DefaultStatusId.HasValue)
            {
                statusName = (await _context.Issuestatuses
                    .FirstOrDefaultAsync(s => s.Id == request.Template.DefaultStatusId, cancellationToken))?.Status;
            }

            // Update categories if provided
            if (request.Template.CategoryIds != null)
            {
                var newCategories = await _context.Issuecategories
                    .Where(c => request.Template.CategoryIds.Contains(c.Id))
                    .ToListAsync(cancellationToken);

                if (newCategories.Count != request.Template.CategoryIds.Count)
                {
                    var missingIds = request.Template.CategoryIds.Except(newCategories.Select(c => c.Id));
                    return FMSResponse<IssueTemplateDTO>.Failed($"Categories with IDs {string.Join(", ", missingIds)} not found.");
                }

                // Clear existing and add new
                entity.Categories.Clear();
                foreach (var category in newCategories)
                {
                    entity.Categories.Add(category);
                }
            }

            // Validate DefaultAssignee if provided - supports comma-separated user IDs for multiple assignees
            string? defaultAssigneeId = null;
            string? defaultAssigneeName = null;
            if (!string.IsNullOrEmpty(request.Template.DefaultAssignee))
            {
                var rawIds = request.Template.DefaultAssignee
                    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .Distinct()
                    .ToList();

                var resolvedUsers = await _context.Users
                    .AsNoTracking()
                    .Where(u => rawIds.Contains(u.Id) || rawIds.Contains(u.UserName))
                    .Select(u => new { u.Id, u.UserName })
                    .ToListAsync(cancellationToken);

                if (resolvedUsers.Count == 0)
                {
                    return FMSResponse<IssueTemplateDTO>.Failed($"No valid users found for Default Assignee(s): '{request.Template.DefaultAssignee}'.");
                }

                defaultAssigneeId = string.Join(",", resolvedUsers.Select(u => u.Id));
                defaultAssigneeName = string.Join(", ", resolvedUsers.Select(u => u.UserName));
            }

            entity.DeviceTypeId = request.Template.DeviceTypeId;
            entity.Name = request.Template.Name;
            entity.TitleTemplate = request.Template.TitleTemplate;
            entity.DescriptionTemplate = request.Template.DescriptionTemplate;
            entity.DefaultPriorityId = request.Template.DefaultPriorityId;
            entity.DefaultStatusId = request.Template.DefaultStatusId;
            entity.IsActive = request.Template.IsActive;
            entity.CanAutoCreate = request.Template.CanAutoCreate;
            entity.OfflineThresholdMinutes = request.Template.OfflineThresholdMinutes;
            entity.DefaultAssignee = defaultAssigneeId;
            entity.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            var dto = new IssueTemplateDTO
            {
                Id = entity.Id,
                DeviceTypeId = entity.DeviceTypeId,
                DeviceTypeName = deviceTypeName,
                Name = entity.Name,
                TitleTemplate = entity.TitleTemplate,
                DescriptionTemplate = entity.DescriptionTemplate,
                DefaultPriorityId = entity.DefaultPriorityId,
                DefaultPriorityName = priorityName,
                DefaultStatusId = entity.DefaultStatusId,
                DefaultStatusName = statusName,
                IsActive = entity.IsActive,
                CanAutoCreate = entity.CanAutoCreate,
                OfflineThresholdMinutes = entity.OfflineThresholdMinutes,
                DefaultAssignee = entity.DefaultAssignee,
                DefaultAssigneeName = defaultAssigneeName,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt,
                HasAutoCloseConfig = entity.AutoCloseConfig != null,
                AutoCloseEnabled = entity.AutoCloseConfig?.IsEnabled ?? false,
                CategoryIds = entity.Categories.Select(c => c.Id).ToList(),
                Categories = entity.Categories.Select(c => new CategorySummaryDTO
                {
                    Id = c.Id,
                    Name = c.Name ?? string.Empty,
                    Description = c.Description
                }).ToList()
            };

            _logger.LogInformation("Updated Issue Template {Id}: {Name}", entity.Id, entity.Name);
            return FMSResponse<IssueTemplateDTO>.Success(dto, "Issue Template updated successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating Issue Template {Id}", request.Template.Id);
            return FMSResponse<IssueTemplateDTO>.Failed($"Error updating Issue Template: {ex.Message}");
        }
    }
}

public class DeleteIssueTemplateCommandHandler : IRequestHandler<DeleteIssueTemplateCommand, FMSResponse<bool>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<DeleteIssueTemplateCommandHandler> _logger;

    public DeleteIssueTemplateCommandHandler(GpsdataContext context, ILogger<DeleteIssueTemplateCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<bool>> Handle(DeleteIssueTemplateCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var entity = await _context.Issuetemplates
                .Include(t => t.AutoCloseConfig)
                .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);

            if (entity == null)
            {
                return FMSResponse<bool>.Failed($"Issue Template with ID {request.Id} not found.");
            }

            // Check if any issues use this template
            var hasIssues = await _context.Issuetrackers
                .AnyAsync(i => i.IssueTemplateId == request.Id, cancellationToken);

            if (hasIssues)
            {
                return FMSResponse<bool>.Failed($"Cannot delete Issue Template '{entity.Name}' - it has associated issues.");
            }

            // AutoCloseConfig will cascade delete due to FK config
            _context.Issuetemplates.Remove(entity);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Deleted Issue Template {Id}: {Name}", entity.Id, entity.Name);
            return FMSResponse<bool>.Success(true, "Issue Template deleted successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting Issue Template {Id}", request.Id);
            return FMSResponse<bool>.Failed($"Error deleting Issue Template: {ex.Message}");
        }
    }
}

public class ToggleIssueTemplateActiveCommandHandler : IRequestHandler<ToggleIssueTemplateActiveCommand, FMSResponse<IssueTemplateDTO>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<ToggleIssueTemplateActiveCommandHandler> _logger;

    public ToggleIssueTemplateActiveCommandHandler(GpsdataContext context, ILogger<ToggleIssueTemplateActiveCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<IssueTemplateDTO>> Handle(ToggleIssueTemplateActiveCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var entity = await _context.Issuetemplates
                .Include(t => t.DeviceType)
                .Include(t => t.AutoCloseConfig)
                .Include(t => t.DefaultPriority)
                .Include(t => t.DefaultStatus)
                .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);

            if (entity == null)
            {
                return FMSResponse<IssueTemplateDTO>.Failed($"Issue Template with ID {request.Id} not found.");
            }

            entity.IsActive = !entity.IsActive;
            entity.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            var dto = new IssueTemplateDTO
            {
                Id = entity.Id,
                DeviceTypeId = entity.DeviceTypeId,
                DeviceTypeName = entity.DeviceType?.Name ?? "",
                Name = entity.Name,
                TitleTemplate = entity.TitleTemplate,
                DescriptionTemplate = entity.DescriptionTemplate,
                DefaultPriorityId = entity.DefaultPriorityId,
                DefaultPriorityName = entity.DefaultPriority?.Name,
                DefaultStatusId = entity.DefaultStatusId,
                DefaultStatusName = entity.DefaultStatus?.Status,
                IsActive = entity.IsActive,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt,
                HasAutoCloseConfig = entity.AutoCloseConfig != null,
                AutoCloseEnabled = entity.AutoCloseConfig?.IsEnabled ?? false
            };

            var status = entity.IsActive ? "activated" : "deactivated";
            _logger.LogInformation("Issue Template {Id}: {Name} {Status}", entity.Id, entity.Name, status);
            return FMSResponse<IssueTemplateDTO>.Success(dto, $"Issue Template {status} successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error toggling Issue Template {Id}", request.Id);
            return FMSResponse<IssueTemplateDTO>.Failed($"Error toggling Issue Template: {ex.Message}");
        }
    }
}
