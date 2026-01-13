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

namespace FMS.Application.Features.IssueTracker.Commands.V2.AutoCloseConfig;

public class UpsertAutoCloseConfigCommandHandler : IRequestHandler<UpsertAutoCloseConfigCommand, FMSResponse<IssueAutoCloseConfigDTO>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<UpsertAutoCloseConfigCommandHandler> _logger;

    public UpsertAutoCloseConfigCommandHandler(GpsdataContext context, ILogger<UpsertAutoCloseConfigCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<IssueAutoCloseConfigDTO>> Handle(UpsertAutoCloseConfigCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Validate Issue Template exists
            var template = await _context.Issuetemplates
                .FirstOrDefaultAsync(t => t.Id == request.Config.IssueTemplateId, cancellationToken);

            if (template == null)
            {
                return FMSResponse<IssueAutoCloseConfigDTO>.Failed($"Issue Template with ID {request.Config.IssueTemplateId} not found.");
            }

            // Validate Checker Type
            if (!AutoCloseCheckerTypes.All.Contains(request.Config.CheckerType))
            {
                return FMSResponse<IssueAutoCloseConfigDTO>.Failed(
                    $"Invalid Checker Type '{request.Config.CheckerType}'. Valid types: {string.Join(", ", AutoCloseCheckerTypes.All)}");
            }

            // Check if config already exists
            var existing = await _context.Issueautocloseconfigs
                .FirstOrDefaultAsync(c => c.IssueTemplateId == request.Config.IssueTemplateId, cancellationToken);

            if (existing != null)
            {
                // Update existing
                existing.IsEnabled = request.Config.IsEnabled;
                existing.CheckerType = request.Config.CheckerType;
                existing.CheckIntervalSeconds = request.Config.CheckIntervalSeconds;
                existing.CheckerConfigJson = request.Config.CheckerConfigJson;
                existing.AutoCloseWhenSatisfied = request.Config.AutoCloseWhenSatisfied;
                existing.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync(cancellationToken);

                var updateDto = new IssueAutoCloseConfigDTO
                {
                    Id = existing.Id,
                    IssueTemplateId = existing.IssueTemplateId,
                    IssueTemplateName = template.Name,
                    IsEnabled = existing.IsEnabled,
                    CheckerType = existing.CheckerType,
                    CheckIntervalSeconds = existing.CheckIntervalSeconds,
                    CheckerConfigJson = existing.CheckerConfigJson,
                    AutoCloseWhenSatisfied = existing.AutoCloseWhenSatisfied,
                    CreatedAt = existing.CreatedAt,
                    UpdatedAt = existing.UpdatedAt
                };

                _logger.LogInformation("Updated Auto Close Config {Id} for Template {TemplateId}", existing.Id, template.Id);
                return FMSResponse<IssueAutoCloseConfigDTO>.Success(updateDto, "Auto Close Config updated successfully.");
            }
            else
            {
                // Create new
                var entity = new Issueautocloseconfig
                {
                    IssueTemplateId = request.Config.IssueTemplateId,
                    IsEnabled = request.Config.IsEnabled,
                    CheckerType = request.Config.CheckerType,
                    CheckIntervalSeconds = request.Config.CheckIntervalSeconds,
                    CheckerConfigJson = request.Config.CheckerConfigJson,
                    AutoCloseWhenSatisfied = request.Config.AutoCloseWhenSatisfied,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Issueautocloseconfigs.Add(entity);
                await _context.SaveChangesAsync(cancellationToken);

                var createDto = new IssueAutoCloseConfigDTO
                {
                    Id = entity.Id,
                    IssueTemplateId = entity.IssueTemplateId,
                    IssueTemplateName = template.Name,
                    IsEnabled = entity.IsEnabled,
                    CheckerType = entity.CheckerType,
                    CheckIntervalSeconds = entity.CheckIntervalSeconds,
                    CheckerConfigJson = entity.CheckerConfigJson,
                    AutoCloseWhenSatisfied = entity.AutoCloseWhenSatisfied,
                    CreatedAt = entity.CreatedAt,
                    UpdatedAt = entity.UpdatedAt
                };

                _logger.LogInformation("Created Auto Close Config {Id} for Template {TemplateId}", entity.Id, template.Id);
                return FMSResponse<IssueAutoCloseConfigDTO>.Success(createDto, "Auto Close Config created successfully.");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error upserting Auto Close Config for Template {TemplateId}", request.Config.IssueTemplateId);
            return FMSResponse<IssueAutoCloseConfigDTO>.Failed($"Error saving Auto Close Config: {ex.Message}");
        }
    }
}

public class UpdateAutoCloseConfigCommandHandler : IRequestHandler<UpdateAutoCloseConfigCommand, FMSResponse<IssueAutoCloseConfigDTO>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<UpdateAutoCloseConfigCommandHandler> _logger;

    public UpdateAutoCloseConfigCommandHandler(GpsdataContext context, ILogger<UpdateAutoCloseConfigCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<IssueAutoCloseConfigDTO>> Handle(UpdateAutoCloseConfigCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var entity = await _context.Issueautocloseconfigs
                .Include(c => c.IssueTemplate)
                .FirstOrDefaultAsync(c => c.Id == request.Config.Id, cancellationToken);

            if (entity == null)
            {
                return FMSResponse<IssueAutoCloseConfigDTO>.Failed($"Auto Close Config with ID {request.Config.Id} not found.");
            }

            // Validate Checker Type
            if (!AutoCloseCheckerTypes.All.Contains(request.Config.CheckerType))
            {
                return FMSResponse<IssueAutoCloseConfigDTO>.Failed(
                    $"Invalid Checker Type '{request.Config.CheckerType}'. Valid types: {string.Join(", ", AutoCloseCheckerTypes.All)}");
            }

            entity.IsEnabled = request.Config.IsEnabled;
            entity.CheckerType = request.Config.CheckerType;
            entity.CheckIntervalSeconds = request.Config.CheckIntervalSeconds;
            entity.CheckerConfigJson = request.Config.CheckerConfigJson;
            entity.AutoCloseWhenSatisfied = request.Config.AutoCloseWhenSatisfied;
            entity.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            var dto = new IssueAutoCloseConfigDTO
            {
                Id = entity.Id,
                IssueTemplateId = entity.IssueTemplateId,
                IssueTemplateName = entity.IssueTemplate?.Name ?? "",
                IsEnabled = entity.IsEnabled,
                CheckerType = entity.CheckerType,
                CheckIntervalSeconds = entity.CheckIntervalSeconds,
                CheckerConfigJson = entity.CheckerConfigJson,
                AutoCloseWhenSatisfied = entity.AutoCloseWhenSatisfied,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt
            };

            _logger.LogInformation("Updated Auto Close Config {Id}", entity.Id);
            return FMSResponse<IssueAutoCloseConfigDTO>.Success(dto, "Auto Close Config updated successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating Auto Close Config {Id}", request.Config.Id);
            return FMSResponse<IssueAutoCloseConfigDTO>.Failed($"Error updating Auto Close Config: {ex.Message}");
        }
    }
}

public class DeleteAutoCloseConfigCommandHandler : IRequestHandler<DeleteAutoCloseConfigCommand, FMSResponse<bool>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<DeleteAutoCloseConfigCommandHandler> _logger;

    public DeleteAutoCloseConfigCommandHandler(GpsdataContext context, ILogger<DeleteAutoCloseConfigCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<bool>> Handle(DeleteAutoCloseConfigCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var entity = await _context.Issueautocloseconfigs
                .FirstOrDefaultAsync(c => c.IssueTemplateId == request.IssueTemplateId, cancellationToken);

            if (entity == null)
            {
                return FMSResponse<bool>.Failed($"Auto Close Config for Template {request.IssueTemplateId} not found.");
            }

            _context.Issueautocloseconfigs.Remove(entity);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Deleted Auto Close Config {Id} for Template {TemplateId}", entity.Id, request.IssueTemplateId);
            return FMSResponse<bool>.Success(true, "Auto Close Config deleted successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting Auto Close Config for Template {TemplateId}", request.IssueTemplateId);
            return FMSResponse<bool>.Failed($"Error deleting Auto Close Config: {ex.Message}");
        }
    }
}

public class ToggleAutoCloseConfigCommandHandler : IRequestHandler<ToggleAutoCloseConfigCommand, FMSResponse<IssueAutoCloseConfigDTO>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<ToggleAutoCloseConfigCommandHandler> _logger;

    public ToggleAutoCloseConfigCommandHandler(GpsdataContext context, ILogger<ToggleAutoCloseConfigCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<IssueAutoCloseConfigDTO>> Handle(ToggleAutoCloseConfigCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var entity = await _context.Issueautocloseconfigs
                .Include(c => c.IssueTemplate)
                .FirstOrDefaultAsync(c => c.IssueTemplateId == request.IssueTemplateId, cancellationToken);

            if (entity == null)
            {
                return FMSResponse<IssueAutoCloseConfigDTO>.Failed($"Auto Close Config for Template {request.IssueTemplateId} not found.");
            }

            entity.IsEnabled = !entity.IsEnabled;
            entity.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            var dto = new IssueAutoCloseConfigDTO
            {
                Id = entity.Id,
                IssueTemplateId = entity.IssueTemplateId,
                IssueTemplateName = entity.IssueTemplate?.Name ?? "",
                IsEnabled = entity.IsEnabled,
                CheckerType = entity.CheckerType,
                CheckIntervalSeconds = entity.CheckIntervalSeconds,
                CheckerConfigJson = entity.CheckerConfigJson,
                AutoCloseWhenSatisfied = entity.AutoCloseWhenSatisfied,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt
            };

            var status = entity.IsEnabled ? "enabled" : "disabled";
            _logger.LogInformation("Auto Close Config {Id} for Template {TemplateId} {Status}", entity.Id, request.IssueTemplateId, status);
            return FMSResponse<IssueAutoCloseConfigDTO>.Success(dto, $"Auto Close Config {status} successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error toggling Auto Close Config for Template {TemplateId}", request.IssueTemplateId);
            return FMSResponse<IssueAutoCloseConfigDTO>.Failed($"Error toggling Auto Close Config: {ex.Message}");
        }
    }
}
