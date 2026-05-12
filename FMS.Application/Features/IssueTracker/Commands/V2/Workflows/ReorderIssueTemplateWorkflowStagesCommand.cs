/**
 * File: ReorderIssueTemplateWorkflowStagesCommand.cs
 * Purpose: Reorder existing workflow stages for an issue template workflow.
 * Dependencies: MediatR, FMSResponse, GpsdataContext, Workflow DTOs
 * Last Modified: 2026-04-23
 *
 * Key Functions:
 * - ReorderIssueTemplateWorkflowStagesCommandHandler.Handle(): validates and persists stage sort order updates.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.DTOs.V2;
using FMS.Application.Features.IssueTracker.Queries.V2.Workflows;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.IssueTracker.Commands.V2.Workflows;

public record ReorderIssueTemplateWorkflowStagesCommand(int TemplateId, ReorderIssueTemplateWorkflowStagesRequestDTO Request)
    : IRequest<FMSResponse<IssueTemplateWorkflowDTO>>;

public class ReorderIssueTemplateWorkflowStagesCommandHandler
    : IRequestHandler<ReorderIssueTemplateWorkflowStagesCommand, FMSResponse<IssueTemplateWorkflowDTO>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<ReorderIssueTemplateWorkflowStagesCommandHandler> _logger;

    public ReorderIssueTemplateWorkflowStagesCommandHandler(
        GpsdataContext context,
        ILogger<ReorderIssueTemplateWorkflowStagesCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<IssueTemplateWorkflowDTO>> Handle(ReorderIssueTemplateWorkflowStagesCommand request, CancellationToken cancellationToken)
    {
        var stageIds = request.Request.StageIds?
            .Where(id => id > 0)
            .Distinct()
            .ToList() ?? new List<int>();

        if (stageIds.Count == 0)
        {
            return FMSResponse<IssueTemplateWorkflowDTO>.Failed("At least one workflow stage ID is required.");
        }

        try
        {
            var workflow = await _context.IssueTemplateWorkflows
                .Include(item => item.Stages)
                .FirstOrDefaultAsync(item => item.IssueTemplateId == request.TemplateId, cancellationToken);

            if (workflow == null)
            {
                return FMSResponse<IssueTemplateWorkflowDTO>.NotFound(
                    "ISSUE_TEMPLATE_WORKFLOW_NOT_FOUND",
                    $"Workflow for issue template {request.TemplateId} was not found.");
            }

            if (workflow.RowVersion != request.Request.RowVersion)
            {
                return FMSResponse<IssueTemplateWorkflowDTO>.Conflict(
                    "ISSUE_TEMPLATE_WORKFLOW_VERSION_CONFLICT",
                    "The workflow changed before the new stage order was saved. Reload and try again.");
            }

            var existingStageIds = workflow.Stages
                .Select(item => item.Id)
                .OrderBy(item => item)
                .ToList();

            var requestedStageIds = stageIds
                .OrderBy(item => item)
                .ToList();

            if (existingStageIds.Count != requestedStageIds.Count || !existingStageIds.SequenceEqual(requestedStageIds))
            {
                return FMSResponse<IssueTemplateWorkflowDTO>.Failed("Stage reorder payload must contain every existing workflow stage exactly once.");
            }

            var executionStrategy = _context.Database.CreateExecutionStrategy();

            return await executionStrategy.ExecuteAsync(async () =>
            {
                foreach (var stage in workflow.Stages)
                {
                    stage.SortOrder = stageIds.IndexOf(stage.Id);
                    stage.UpdatedAt = DateTime.UtcNow;
                }

                workflow.RowVersion += 1;
                workflow.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync(cancellationToken);

                var updatedWorkflow = await IssueTemplateWorkflowReader.BuildAsync(_context, request.TemplateId, activeOnly: false, cancellationToken);
                return FMSResponse<IssueTemplateWorkflowDTO>.Success(updatedWorkflow!, "Workflow stages reordered successfully.");
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reordering workflow stages for template {TemplateId}", request.TemplateId);
            return FMSResponse<IssueTemplateWorkflowDTO>.Failed($"Error reordering workflow stages: {ex.Message}");
        }
    }
}