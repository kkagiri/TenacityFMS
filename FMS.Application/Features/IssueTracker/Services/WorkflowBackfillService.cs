/**
 * File: WorkflowBackfillService.cs
 * Purpose: One-shot startup backfill for issue template workflows when legacy templates exist without workflow rows.
 * Dependencies: GpsdataContext, EF Core, ILogger, issue tracker workflow entities
 * Last Modified: 2026-04-23
 *
 * Key Functions:
 * - ExecuteAsync(): seeds default workflow/stage data and stage assignments for legacy template actions.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.IssueTracker.Services;

public interface IWorkflowBackfillService
{
    Task ExecuteAsync(CancellationToken cancellationToken = default);
}

public class WorkflowBackfillService : IWorkflowBackfillService
{
    private const string WorkflowFeatureFlag = "IssueTrackerWorkflowsV2";

    private static readonly IReadOnlyList<StageSeed> DefaultStages = new List<StageSeed>
    {
        new("Diagnose", "Initial diagnosis and problem scoping", "#0078d4", 0),
        new("Repair", "Physical repair, replacement, or installation work", "#ca5010", 1),
        new("Verify", "Final validation and sign-off checks", "#107c10", 2)
    };

    private readonly GpsdataContext _context;
    private readonly ILogger<WorkflowBackfillService> _logger;

    public WorkflowBackfillService(GpsdataContext context, ILogger<WorkflowBackfillService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task ExecuteAsync(CancellationToken cancellationToken = default)
    {
        if (!await IsWorkflowFeatureEnabledAsync(cancellationToken))
        {
            _logger.LogInformation("Skipping issue tracker workflow backfill because feature flag {ConfigurationKey} is disabled.", WorkflowFeatureFlag);
            return;
        }

        if (await _context.IssueTemplateWorkflows.AsNoTracking().AnyAsync(cancellationToken))
        {
            _logger.LogInformation("Skipping issue tracker workflow backfill because workflow rows already exist.");
            return;
        }

        var templateIds = await _context.Issuetemplates
            .AsNoTracking()
            .OrderBy(item => item.Id)
            .Select(item => item.Id)
            .ToListAsync(cancellationToken);

        if (templateIds.Count == 0)
        {
            _logger.LogInformation("Skipping issue tracker workflow backfill because no issue templates exist.");
            return;
        }

        var executionStrategy = _context.Database.CreateExecutionStrategy();

        await executionStrategy.ExecuteAsync(async () =>
        {
            if (await _context.IssueTemplateWorkflows.AsNoTracking().AnyAsync(cancellationToken))
            {
                _logger.LogInformation("Issue tracker workflow backfill became unnecessary because workflow rows were created by another process.");
                return;
            }

            var actions = await _context.IssueTemplateActions
                .Where(item => templateIds.Contains(item.IssueTemplateId))
                .OrderBy(item => item.IssueTemplateId)
                .ThenBy(item => item.SortOrder)
                .ThenBy(item => item.Id)
                .ToListAsync(cancellationToken);

            var workflows = new List<IssueTemplateWorkflow>();
            var now = DateTime.UtcNow;

            foreach (var templateId in templateIds)
            {
                var workflow = new IssueTemplateWorkflow
                {
                    IssueTemplateId = templateId,
                    Name = $"Template {templateId} workflow",
                    IsActive = true,
                    RowVersion = 1,
                    CreatedAt = now,
                    UpdatedAt = now,
                    Stages = DefaultStages.Select(stage => new IssueTemplateWorkflowStage
                    {
                        Name = stage.Name,
                        Description = stage.Description,
                        Color = stage.Color,
                        SortOrder = stage.SortOrder,
                        IsActive = true,
                        CreatedAt = now,
                        UpdatedAt = now
                    }).ToList()
                };

                workflows.Add(workflow);
                _context.IssueTemplateWorkflows.Add(workflow);
            }

            await _context.SaveChangesAsync(cancellationToken);

            var workflowByTemplateId = workflows.ToDictionary(item => item.IssueTemplateId);
            var stageOrderByTemplate = new Dictionary<int, Dictionary<string, int>>(templateIds.Count);

            foreach (var action in actions)
            {
                if (!workflowByTemplateId.TryGetValue(action.IssueTemplateId, out var workflow))
                {
                    continue;
                }

                var stageName = ResolveStageName(action.ActionType);
                var stage = workflow.Stages.First(item => item.Name == stageName);

                if (!stageOrderByTemplate.TryGetValue(action.IssueTemplateId, out var nextStageOrder))
                {
                    nextStageOrder = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
                    stageOrderByTemplate[action.IssueTemplateId] = nextStageOrder;
                }

                nextStageOrder.TryGetValue(stageName, out var stageIndex);

                action.StageId = stage.Id;
                action.SortOrder = stageIndex;
                action.PositionX ??= 48 + ((stageIndex % 3) * 300);
                action.PositionY ??= (stage.SortOrder * 248) + 52 + ((stageIndex / 3) * 118);
                action.UpdatedAt = now;

                nextStageOrder[stageName] = stageIndex + 1;
            }

            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Seeded staged issue tracker workflows for {TemplateCount} templates and mapped {ActionCount} legacy actions.", templateIds.Count, actions.Count);
        });
    }

    private async Task<bool> IsWorkflowFeatureEnabledAsync(CancellationToken cancellationToken)
    {
        var configurationValue = await _context.SystemConfigurations
            .AsNoTracking()
            .Where(item => item.ConfigurationKey == WorkflowFeatureFlag && item.IsActive)
            .Select(item => item.ConfigurationValue)
            .FirstOrDefaultAsync(cancellationToken);

        if (string.IsNullOrWhiteSpace(configurationValue))
        {
            return false;
        }

        if (bool.TryParse(configurationValue, out var boolValue))
        {
            return boolValue;
        }

        return string.Equals(configurationValue, "1", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(configurationValue, "yes", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(configurationValue, "on", StringComparison.OrdinalIgnoreCase);
    }

    private static string ResolveStageName(string? actionType)
    {
        if (string.Equals(actionType, "SensorCalibration", StringComparison.OrdinalIgnoreCase))
        {
            return "Verify";
        }

        if (string.Equals(actionType, "DeviceChange", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(actionType, "CameraInstall", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(actionType, "SensorReplacement", StringComparison.OrdinalIgnoreCase))
        {
            return "Repair";
        }

        return "Diagnose";
    }

    private sealed record StageSeed(string Name, string Description, string Color, int SortOrder);
}