/**
 * File: SaveIssueTemplateWorkflowCommand.cs
 * Purpose: Saves staged issue template workflows with nested stages and actions.
 * Dependencies: MediatR, GpsdataContext, workflow DTOs, FMSResponse
 * Last Modified: 2026-04-23
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.DTOs.V2;
using FMS.Application.Features.IssueTracker.Queries.V2.Workflows;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.IssueTracker.Commands.V2.Workflows;

public record SaveIssueTemplateWorkflowCommand(int TemplateId, SaveIssueTemplateWorkflowRequestDTO Workflow)
    : IRequest<FMSResponse<IssueTemplateWorkflowDTO>>;

public class SaveIssueTemplateWorkflowCommandHandler : IRequestHandler<SaveIssueTemplateWorkflowCommand, FMSResponse<IssueTemplateWorkflowDTO>>
{
    private static readonly HashSet<string> ValidActionTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "General",
        "DeviceChange",
        "CameraInstall",
        "SensorReplacement",
        "SensorCalibration"
    };

    private readonly GpsdataContext _context;
    private readonly ILogger<SaveIssueTemplateWorkflowCommandHandler> _logger;

    public SaveIssueTemplateWorkflowCommandHandler(GpsdataContext context, ILogger<SaveIssueTemplateWorkflowCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<IssueTemplateWorkflowDTO>> Handle(SaveIssueTemplateWorkflowCommand request, CancellationToken cancellationToken)
    {
        var dto = request.Workflow;
        if (dto == null)
        {
            return FMSResponse<IssueTemplateWorkflowDTO>.Failed("Workflow payload is required.");
        }

        dto.IssueTemplateId = request.TemplateId;

        var validationErrors = Validate(dto);
        if (validationErrors.Count > 0)
        {
            return FMSResponse<IssueTemplateWorkflowDTO>.ValidationFailed(validationErrors);
        }

        var templateExists = await _context.Issuetemplates.AnyAsync(t => t.Id == request.TemplateId, cancellationToken);
        if (!templateExists)
        {
            return FMSResponse<IssueTemplateWorkflowDTO>.NotFound("ISSUE_TEMPLATE_NOT_FOUND", $"Issue template {request.TemplateId} was not found.");
        }

        try
        {
            var strategy = _context.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync(async () =>
            {
                await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

                var workflow = await _context.IssueTemplateWorkflows
                    .Include(item => item.Stages)
                    .FirstOrDefaultAsync(item => item.IssueTemplateId == request.TemplateId, cancellationToken);

                if (workflow != null && workflow.RowVersion != dto.RowVersion)
                {
                    return FMSResponse<IssueTemplateWorkflowDTO>.Conflict(
                        "ISSUE_TEMPLATE_WORKFLOW_VERSION_CONFLICT",
                        "This workflow was changed by another user. Reload and try again.");
                }

                var actions = await _context.IssueTemplateActions
                    .Where(action => action.IssueTemplateId == request.TemplateId)
                    .ToListAsync(cancellationToken);

                var nextWorkflowId = workflow?.Id ?? await GetNextWorkflowIdAsync(cancellationToken);
                var nextStageId = await GetNextStageIdAsync(cancellationToken);
                var nextActionId = await GetNextActionIdAsync(cancellationToken);

                if (workflow == null)
                {
                    workflow = new IssueTemplateWorkflow
                    {
                        Id = nextWorkflowId,
                        IssueTemplateId = request.TemplateId,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.IssueTemplateWorkflows.Add(workflow);
                }

                workflow.Name = string.IsNullOrWhiteSpace(dto.Name) ? "Default workflow" : dto.Name.Trim();
                workflow.IsActive = dto.IsActive;
                workflow.RowVersion = workflow.RowVersion <= 0 ? 1 : workflow.RowVersion + 1;
                workflow.UpdatedAt = DateTime.UtcNow;

                var stageById = workflow.Stages.ToDictionary(stage => stage.Id);
                var actionById = actions.ToDictionary(action => action.Id);
                var retainedStageIds = new HashSet<int>();
                var retainedActionIds = new HashSet<int>();
                var orderedStages = dto.Stages.OrderBy(stage => stage.SortOrder).ToList();
                var globalSortOrder = 0;

                for (var stageIndex = 0; stageIndex < orderedStages.Count; stageIndex += 1)
                {
                    var stageDto = orderedStages[stageIndex];
                    IssueTemplateWorkflowStage stage;

                    if (stageDto.Id.HasValue)
                    {
                        if (!stageById.TryGetValue(stageDto.Id.Value, out stage!))
                        {
                            return FMSResponse<IssueTemplateWorkflowDTO>.Failed($"Workflow stage {stageDto.Id.Value} was not found for template {request.TemplateId}.");
                        }
                    }
                    else
                    {
                        stage = new IssueTemplateWorkflowStage
                        {
                            Id = ++nextStageId,
                            WorkflowId = workflow.Id,
                            CreatedAt = DateTime.UtcNow
                        };
                        workflow.Stages.Add(stage);
                        _context.IssueTemplateWorkflowStages.Add(stage);
                    }

                    stage.Name = stageDto.Name.Trim();
                    stage.Description = string.IsNullOrWhiteSpace(stageDto.Description) ? null : stageDto.Description.Trim();
                    stage.Color = string.IsNullOrWhiteSpace(stageDto.Color) ? null : stageDto.Color.Trim();
                    stage.SortOrder = stageIndex;
                    stage.IsActive = stageDto.IsActive;
                    stage.UpdatedAt = DateTime.UtcNow;
                    retainedStageIds.Add(stage.Id);

                    var orderedActions = stageDto.Actions.OrderBy(action => action.SortOrder).ToList();
                    for (var actionIndex = 0; actionIndex < orderedActions.Count; actionIndex += 1)
                    {
                        var actionDto = orderedActions[actionIndex];
                        IssueTemplateAction action;

                        if (actionDto.Id.HasValue)
                        {
                            if (!actionById.TryGetValue(actionDto.Id.Value, out action!))
                            {
                                return FMSResponse<IssueTemplateWorkflowDTO>.Failed($"Workflow action {actionDto.Id.Value} was not found for template {request.TemplateId}.");
                            }
                        }
                        else
                        {
                            action = new IssueTemplateAction
                            {
                                Id = ++nextActionId,
                                IssueTemplateId = request.TemplateId,
                                CreatedAt = DateTime.UtcNow
                            };
                            actions.Add(action);
                            _context.IssueTemplateActions.Add(action);
                        }

                        var requirements = GetRequirements(actionDto.ActionType);
                        action.Name = actionDto.Name.Trim();
                        action.ActionType = actionDto.ActionType;
                        action.Description = string.IsNullOrWhiteSpace(actionDto.Description) ? null : actionDto.Description.Trim();
                        action.SortOrder = globalSortOrder;
                        action.IsActive = actionDto.IsActive;
                        action.StageId = stage.Id;
                        action.PositionX = actionDto.PositionX;
                        action.PositionY = actionDto.PositionY;
                        action.RequiresDeviceDetails = requirements.requiresDeviceDetails;
                        action.RequiresSourceVehicle = requirements.requiresSourceVehicle;
                        action.RequiresCameraDetails = requirements.requiresCameraDetails;
                        action.UpdatedAt = DateTime.UtcNow;
                        retainedActionIds.Add(action.Id);
                        globalSortOrder += 1;
                    }
                }

                var actionsToRemove = actions.Where(action => !retainedActionIds.Contains(action.Id)).ToList();
                if (actionsToRemove.Count > 0)
                {
                    _context.IssueTemplateActions.RemoveRange(actionsToRemove);
                }

                var stagesToRemove = workflow.Stages.Where(stage => !retainedStageIds.Contains(stage.Id)).ToList();
                if (stagesToRemove.Count > 0)
                {
                    _context.IssueTemplateWorkflowStages.RemoveRange(stagesToRemove);
                }

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                var savedWorkflow = await IssueTemplateWorkflowReader.BuildAsync(_context, request.TemplateId, activeOnly: false, cancellationToken);
                return FMSResponse<IssueTemplateWorkflowDTO>.Success(savedWorkflow!, "Workflow saved successfully.");
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving workflow for template {TemplateId}", request.TemplateId);
            return FMSResponse<IssueTemplateWorkflowDTO>.Failed($"Error saving workflow: {ex.Message}");
        }
    }

    private static List<string> Validate(SaveIssueTemplateWorkflowRequestDTO workflow)
    {
        var errors = new List<string>();
        if (workflow.Stages == null || workflow.Stages.Count == 0)
        {
            errors.Add("At least one workflow stage is required.");
            return errors;
        }

        var actionNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var stage in workflow.Stages)
        {
            if (string.IsNullOrWhiteSpace(stage.Name))
            {
                errors.Add("Each stage must have a name.");
            }

            foreach (var action in stage.Actions)
            {
                if (string.IsNullOrWhiteSpace(action.Name))
                {
                    errors.Add("Each workflow action must have a name.");
                }

                if (!ValidActionTypes.Contains(action.ActionType))
                {
                    errors.Add($"Invalid action type '{action.ActionType}'.");
                }

                var trimmedName = action.Name?.Trim();
                if (!string.IsNullOrWhiteSpace(trimmedName) && !actionNames.Add(trimmedName))
                {
                    errors.Add($"Duplicate action name '{trimmedName}' is not allowed within the same workflow.");
                }
            }
        }

        return errors;
    }

    private static (bool requiresDeviceDetails, bool requiresSourceVehicle, bool requiresCameraDetails) GetRequirements(string actionType)
    {
        if (string.Equals(actionType, "DeviceChange", StringComparison.OrdinalIgnoreCase))
        {
            return (true, true, false);
        }

        if (string.Equals(actionType, "CameraInstall", StringComparison.OrdinalIgnoreCase))
        {
            return (false, false, true);
        }

        if (string.Equals(actionType, "SensorReplacement", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(actionType, "SensorCalibration", StringComparison.OrdinalIgnoreCase))
        {
            return (false, false, false);
        }

        return (false, false, false);
    }

    private async Task<int> GetNextWorkflowIdAsync(CancellationToken cancellationToken)
    {
        var maxId = await _context.IssueTemplateWorkflows.Select(item => (int?)item.Id).MaxAsync(cancellationToken) ?? 0;
        return maxId + 1;
    }

    private async Task<int> GetNextStageIdAsync(CancellationToken cancellationToken)
    {
        return await _context.IssueTemplateWorkflowStages.Select(item => (int?)item.Id).MaxAsync(cancellationToken) ?? 0;
    }

    private async Task<int> GetNextActionIdAsync(CancellationToken cancellationToken)
    {
        return await _context.IssueTemplateActions.Select(item => (int?)item.Id).MaxAsync(cancellationToken) ?? 0;
    }
}