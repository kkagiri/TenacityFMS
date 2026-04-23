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

namespace FMS.Application.Features.IssueTracker.Queries.V2.Workflows;

public record GetIssueTemplateWorkflowQuery(int TemplateId)
    : IRequest<FMSResponse<IssueTemplateWorkflowDTO>>;

public record GetIssueTemplateWorkflowForCompletionQuery(int TemplateId)
    : IRequest<FMSResponse<IssueTemplateWorkflowDTO>>;

public class GetIssueTemplateWorkflowQueryHandler : IRequestHandler<GetIssueTemplateWorkflowQuery, FMSResponse<IssueTemplateWorkflowDTO>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetIssueTemplateWorkflowQueryHandler> _logger;

    public GetIssueTemplateWorkflowQueryHandler(GpsdataContext context, ILogger<GetIssueTemplateWorkflowQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<IssueTemplateWorkflowDTO>> Handle(GetIssueTemplateWorkflowQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var workflow = await IssueTemplateWorkflowReader.BuildAsync(_context, request.TemplateId, activeOnly: false, cancellationToken);

            if (workflow == null)
            {
                return FMSResponse<IssueTemplateWorkflowDTO>.Failed($"Issue template {request.TemplateId} was not found.");
            }

            return FMSResponse<IssueTemplateWorkflowDTO>.Success(workflow);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error building workflow preview for template {TemplateId}", request.TemplateId);
            return FMSResponse<IssueTemplateWorkflowDTO>.Failed($"Error building workflow preview: {ex.Message}");
        }
    }
}

public class GetIssueTemplateWorkflowForCompletionQueryHandler : IRequestHandler<GetIssueTemplateWorkflowForCompletionQuery, FMSResponse<IssueTemplateWorkflowDTO>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetIssueTemplateWorkflowForCompletionQueryHandler> _logger;

    public GetIssueTemplateWorkflowForCompletionQueryHandler(GpsdataContext context, ILogger<GetIssueTemplateWorkflowForCompletionQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<IssueTemplateWorkflowDTO>> Handle(GetIssueTemplateWorkflowForCompletionQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var workflow = await IssueTemplateWorkflowReader.BuildAsync(_context, request.TemplateId, activeOnly: true, cancellationToken);

            if (workflow == null)
            {
                return FMSResponse<IssueTemplateWorkflowDTO>.Failed($"Issue template {request.TemplateId} was not found.");
            }

            return FMSResponse<IssueTemplateWorkflowDTO>.Success(workflow);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error building completion workflow for template {TemplateId}", request.TemplateId);
            return FMSResponse<IssueTemplateWorkflowDTO>.Failed($"Error building completion workflow: {ex.Message}");
        }
    }
}

internal static class IssueTemplateWorkflowReader
{
    private static readonly List<IssueTemplateWorkflowStageDTO> DefaultStages = new()
    {
        new() { Id = null, Name = "Diagnose", Color = "#0078d4", SortOrder = 0, IsActive = true },
        new() { Id = null, Name = "Repair", Color = "#ca5010", SortOrder = 1, IsActive = true },
        new() { Id = null, Name = "Verify", Color = "#107c10", SortOrder = 2, IsActive = true }
    };

    public static async Task<IssueTemplateWorkflowDTO?> BuildAsync(GpsdataContext context, int templateId, bool activeOnly, CancellationToken cancellationToken)
    {
        var templateExists = await context.Issuetemplates.AsNoTracking().AnyAsync(t => t.Id == templateId, cancellationToken);
        if (!templateExists)
        {
            return null;
        }

        var workflow = await context.IssueTemplateWorkflows
            .AsNoTracking()
            .Include(w => w.Stages)
            .FirstOrDefaultAsync(w => w.IssueTemplateId == templateId, cancellationToken);

        if (activeOnly && workflow != null && !workflow.IsActive)
        {
            return new IssueTemplateWorkflowDTO
            {
                Id = workflow.Id,
                IssueTemplateId = templateId,
                Name = workflow.Name,
                IsActive = false,
                RowVersion = workflow.RowVersion,
                CreatedAt = workflow.CreatedAt,
                UpdatedAt = workflow.UpdatedAt,
                Stages = new List<IssueTemplateWorkflowStageDTO>()
            };
        }

        var actionsQuery = context.IssueTemplateActions
            .AsNoTracking()
            .Where(a => a.IssueTemplateId == templateId);

        if (activeOnly)
        {
            actionsQuery = actionsQuery.Where(a => a.IsActive);
        }

        var actions = await actionsQuery
            .OrderBy(a => a.SortOrder)
            .ThenBy(a => a.Name)
            .ToListAsync(cancellationToken);

        if (workflow == null)
        {
            return BuildSynthesizedWorkflow(templateId, actions, activeOnly);
        }

        var stageDtos = workflow.Stages
            .Where(stage => !activeOnly || stage.IsActive)
            .OrderBy(stage => stage.SortOrder)
            .Select(stage => new IssueTemplateWorkflowStageDTO
            {
                Id = stage.Id,
                Name = stage.Name,
                Description = stage.Description,
                Color = string.IsNullOrWhiteSpace(stage.Color) ? ResolveDefaultStageColor(stage.Name) : stage.Color,
                SortOrder = stage.SortOrder,
                IsActive = stage.IsActive,
                Actions = new List<IssueTemplateWorkflowActionDTO>()
            })
            .ToList();

        if (stageDtos.Count == 0)
        {
            stageDtos = DefaultStages.Select(CloneStage).ToList();
        }

        foreach (var action in actions)
        {
            var stage = ResolvePersistedStage(action, stageDtos, activeOnly);
            if (stage == null)
            {
                continue;
            }

            stage.Actions.Add(MapAction(action));
        }

        if (activeOnly)
        {
            stageDtos = stageDtos.Where(stage => stage.Actions.Count > 0).ToList();
        }

        return new IssueTemplateWorkflowDTO
        {
            Id = workflow.Id,
            IssueTemplateId = templateId,
            Name = workflow.Name,
            IsActive = workflow.IsActive,
            RowVersion = workflow.RowVersion,
            CreatedAt = workflow.CreatedAt,
            UpdatedAt = workflow.UpdatedAt,
            Stages = stageDtos
        };
    }

    private static IssueTemplateWorkflowDTO BuildSynthesizedWorkflow(int templateId, List<IssueTemplateAction> actions, bool activeOnly)
    {
        var stages = DefaultStages.Select(CloneStage).ToList();

        foreach (var action in actions)
        {
            var stage = ResolveStageByActionType(action.ActionType, stages);
            stage.Actions.Add(MapAction(action));
        }

        return new IssueTemplateWorkflowDTO
        {
            Id = null,
            IssueTemplateId = templateId,
            Name = "Default workflow",
            IsActive = true,
            RowVersion = 1,
            Stages = activeOnly ? stages.Where(stage => stage.Actions.Count > 0).ToList() : stages
        };
    }

    private static IssueTemplateWorkflowStageDTO CloneStage(IssueTemplateWorkflowStageDTO stage) => new()
    {
        Id = stage.Id,
        Name = stage.Name,
        Description = stage.Description,
        Color = stage.Color,
        SortOrder = stage.SortOrder,
        IsActive = stage.IsActive,
        Actions = new List<IssueTemplateWorkflowActionDTO>()
    };

    private static IssueTemplateWorkflowStageDTO? ResolvePersistedStage(IssueTemplateAction action, List<IssueTemplateWorkflowStageDTO> stages, bool activeOnly)
    {
        if (action.StageId.HasValue)
        {
            var matchedStage = stages.FirstOrDefault(stage => stage.Id == action.StageId.Value);
            if (matchedStage != null)
            {
                return matchedStage;
            }

            if (activeOnly)
            {
                return null;
            }
        }

        return ResolveStageByActionType(action.ActionType, stages);
    }

    private static IssueTemplateWorkflowStageDTO ResolveStageByActionType(string? actionType, List<IssueTemplateWorkflowStageDTO> stages)
    {
        if (string.Equals(actionType, "SensorCalibration", StringComparison.OrdinalIgnoreCase))
        {
            return stages.FirstOrDefault(stage => string.Equals(stage.Name, "Verify", StringComparison.OrdinalIgnoreCase))
                ?? stages.ElementAtOrDefault(2)
                ?? stages[stages.Count - 1];
        }

        if (string.Equals(actionType, "DeviceChange", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(actionType, "CameraInstall", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(actionType, "SensorReplacement", StringComparison.OrdinalIgnoreCase))
        {
            return stages.FirstOrDefault(stage => string.Equals(stage.Name, "Repair", StringComparison.OrdinalIgnoreCase))
                ?? stages.ElementAtOrDefault(1)
                ?? stages[0];
        }

        return stages.FirstOrDefault(stage => string.Equals(stage.Name, "Diagnose", StringComparison.OrdinalIgnoreCase))
            ?? stages[0];
    }

    private static IssueTemplateWorkflowActionDTO MapAction(IssueTemplateAction action) => new()
    {
        Id = action.Id,
        IssueTemplateId = action.IssueTemplateId,
        StageId = action.StageId,
        Name = action.Name,
        ActionType = action.ActionType,
        Description = action.Description,
        SortOrder = action.SortOrder,
        IsActive = action.IsActive,
        PositionX = action.PositionX,
        PositionY = action.PositionY,
        RequiresDeviceDetails = action.RequiresDeviceDetails,
        RequiresSourceVehicle = action.RequiresSourceVehicle,
        RequiresCameraDetails = action.RequiresCameraDetails
    };

    private static string ResolveDefaultStageColor(string? stageName)
    {
        if (string.Equals(stageName, "Repair", StringComparison.OrdinalIgnoreCase))
        {
            return "#ca5010";
        }

        if (string.Equals(stageName, "Verify", StringComparison.OrdinalIgnoreCase))
        {
            return "#107c10";
        }

        return "#0078d4";
    }
}