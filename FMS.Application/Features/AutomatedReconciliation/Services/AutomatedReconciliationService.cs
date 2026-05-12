using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common.Constants;
using FMS.Application.Features.EventEngine.Engine;
using FMS.Application.Features.EventEngine.Events;
using FMS.Application.Services.AutomatedReconciliation;
using FMS.Application.Services.Configuration;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Domain.Entities.Features.AutomaticReconciliation;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.AutomatedReconciliation.Services;

//Cursor - Enhanced AutomatedReconciliationService with notification system integration and configuration support
public class AutomatedReconciliationService
{
    private readonly GpsdataContext _context;
    private readonly PolicyEvaluationEngine _policyEvaluationEngine;
    private readonly DiscrepancyDetectionService _discrepancyDetectionService;
    private readonly ReconciliationOrchestrationService _orchestrationService;
    private readonly DailyReconciliationPolicyService _dailyReconciliationService;
    private readonly IEventExpressionEngine _eventEngine;
    private readonly ISystemConfigurationService _systemConfigService; // System configuration service
    private readonly ILogger<AutomatedReconciliationService> _logger;

    public AutomatedReconciliationService(
        GpsdataContext context,
        PolicyEvaluationEngine policyEvaluationEngine,
        DiscrepancyDetectionService discrepancyDetectionService,
        ReconciliationOrchestrationService orchestrationService,
        DailyReconciliationPolicyService dailyReconciliationService,
        IEventExpressionEngine eventEngine,
        ISystemConfigurationService systemConfigService,
        ILogger<AutomatedReconciliationService> logger)
    {
        _context = context;
        _policyEvaluationEngine = policyEvaluationEngine;
        _discrepancyDetectionService = discrepancyDetectionService;
        _orchestrationService = orchestrationService;
        _dailyReconciliationService = dailyReconciliationService;
        _eventEngine = eventEngine;
        _systemConfigService = systemConfigService;
        _logger = logger;
    }

    //Cursor - Enhanced ExecuteReconciliationCycleAsync with metrics emission and notifications
    public async Task<ReconciliationCycleResult> ExecuteReconciliationCycleAsync(CancellationToken cancellationToken = default)
    {
        var cycleResult = new ReconciliationCycleResult
        {
            StartedAt = DateTime.UtcNow,
            CycleId = Guid.NewGuid()
        };

        //Cursor - Emit metrics using ILogger.BeginScope for structured logging
        using var scope = _logger.BeginScope(new Dictionary<string, object>
        {
            ["Operation"] = "ReconciliationCycle",
            ["CycleId"] = cycleResult.CycleId,
            ["StartTime"] = cycleResult.StartedAt
        });

        try
        {
            _logger.LogInformation("Starting reconciliation cycle {CycleId}", cycleResult.CycleId);

            // Get all active policies that are due for execution
            var duePolicies = await GetDuePoliciesAsync(cancellationToken);
            cycleResult.ProcessedPolicies = duePolicies.Count;

            _logger.LogInformation("Found {PolicyCount} policies due for execution", duePolicies.Count);

            // Execute each policy
            foreach (var policy in duePolicies)
            {
                try
                {
                    var policyResult = await ExecuteSinglePolicyAsync(policy.Id, cancellationToken);
                    cycleResult.PolicyResults.Add(policyResult);

                    if (policyResult.Success)
                        cycleResult.SuccessfulPolicies++;
                    else
                        cycleResult.FailedPolicies++;
                }
                catch (Exception policyEx)
                {
                    _logger.LogError(policyEx, "Failed to execute policy {PolicyId} during cycle {CycleId}",
                        policy.Id, cycleResult.CycleId);
                    cycleResult.FailedPolicies++;

                    //Cursor - Send notification for policy execution failure
                    await SendPolicyExecutionFailureNotificationAsync(policy.Id, policyEx.Message, cancellationToken);
                }
            }

            cycleResult.CompletedAt = DateTime.UtcNow;
            cycleResult.Duration = cycleResult.CompletedAt - cycleResult.StartedAt;
            cycleResult.Success = cycleResult.FailedPolicies == 0;

            //Cursor - Send cycle summary notification if there were failures
            if (cycleResult.FailedPolicies > 0)
            {
                await SendCycleSummaryNotificationAsync(cycleResult, cancellationToken);
            }

            //Cursor - Emit final metrics before returning result
            _logger.LogInformation("Reconciliation cycle {CycleId} completed in {Duration}ms. Success: {SuccessCount}, Failed: {FailedCount}",
                cycleResult.CycleId,
                cycleResult.Duration.TotalMilliseconds,
                cycleResult.SuccessfulPolicies,
                cycleResult.FailedPolicies);

            // Emit structured metrics for monitoring systems
            using var metricsScope = _logger.BeginScope(new Dictionary<string, object>
            {
                ["MetricType"] = "ReconciliationCycleCompleted",
                ["CycleId"] = cycleResult.CycleId,
                ["Duration"] = cycleResult.Duration.TotalMilliseconds,
                ["SuccessfulPolicies"] = cycleResult.SuccessfulPolicies,
                ["FailedPolicies"] = cycleResult.FailedPolicies,
                ["TotalPolicies"] = cycleResult.ProcessedPolicies
            });

            return cycleResult;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Reconciliation cycle {CycleId} failed", cycleResult.CycleId);
            cycleResult.CompletedAt = DateTime.UtcNow;
            cycleResult.Duration = cycleResult.CompletedAt - cycleResult.StartedAt;
            cycleResult.Success = false;
            cycleResult.ErrorMessage = ex.Message;

            //Cursor - Send critical failure notification
            await SendCycleCriticalFailureNotificationAsync(cycleResult.CycleId, ex.Message, cancellationToken);

            throw;
        }
    }

    //Cursor - Enhanced ExecuteSinglePolicyAsync with configuration checks and notifications
    public async Task<PolicyExecutionResult> ExecuteSinglePolicyAsync(int policyId, CancellationToken cancellationToken = default)
    {
        var executionResult = new PolicyExecutionResult
        {
            PolicyId = policyId,
            StartedAt = DateTime.UtcNow,
            ExecutionId = Guid.NewGuid()
        };

        using var scope = _logger.BeginScope(new Dictionary<string, object>
        {
            ["Operation"] = "SinglePolicyExecution",
            ["PolicyId"] = policyId,
            ["ExecutionId"] = executionResult.ExecutionId
        });

        try
        {
            //Cursor - Fetch policy with proper navigation properties
            var policy = await _context.ReconciliationPolicies
                .Include(p => p.Site)
                .FirstOrDefaultAsync(p => p.Id == policyId && p.IsActive, cancellationToken);

            if (policy == null)
            {
                executionResult.Success = false;
                executionResult.ErrorMessage = "Policy not found or inactive";
                return executionResult;
            }

            _logger.LogInformation("Executing policy {PolicyId} - {PolicyName}", policy.Id, policy.Name);

            // Check configuration before execution
            var autoReconcile = await _systemConfigService.GetPtsAutoReconcileTankVolumesAsync();
            if (!autoReconcile)
            {
                _logger.LogInformation("Auto-reconciliation disabled, skipping policy {PolicyId}",
                    policy.Id);

                executionResult.Success = true;
                executionResult.CompletedAt = DateTime.UtcNow;
                executionResult.ErrorMessage = "Auto-reconciliation disabled by configuration";
                return executionResult;
            }

            //Cursor - Check if this is a daily reconciliation policy and handle accordingly
            if (_dailyReconciliationService.IsDailyReconciliationPolicy(policy))
            {
                _logger.LogInformation("Executing daily reconciliation policy {PolicyId}", policy.Id);
                return await _dailyReconciliationService.ExecuteDailyReconciliationPolicyAsync(policy, cancellationToken);
            }

            // Create execution record
            var execution = new ReconciliationPolicyExecution
            {
                PolicyId = policyId,
                ExecutionStartTime = DateTime.UtcNow,
                Status = ReconciliationExecutionStatus.InProgress,
                ExecutedBy = SystemConstants.Defaults.SystemTriggeredBy
            };

            _context.ReconciliationPolicyExecutions.Add(execution);
            await _context.SaveChangesAsync(cancellationToken);

            try
            {
                // Get tanks requiring reconciliation based on policy
                var tanksToReconcile = await _policyEvaluationEngine.GetTanksRequiringReconciliation(policy, cancellationToken);
                executionResult.ProcessedTanks = tanksToReconcile.Count;

                // Process each tank - using ReconciliationDiscrepancy as primary entity
                var reconciliationDiscrepancies = new List<ReconciliationDiscrepancy>();

                foreach (var tank in tanksToReconcile)
                {
                    var discrepancyResult = await _discrepancyDetectionService.DetectDiscrepancies(tank, policy, cancellationToken);

                    if (discrepancyResult.IsSignificant)
                    {
                        // Determine severity based on variance thresholds
                        var severity = DetermineSeverity(discrepancyResult.VarianceLiters, discrepancyResult.VariancePercentage);

                        var reconciliationDiscrepancy = new ReconciliationDiscrepancy
                        {
                            DiscrepancyType = DiscrepancyType.PolicyDriven,
                            PolicyExecutionId = execution.Id,
                            TankId = tank.Id,
                            DetectedAt = DateTime.UtcNow,
                            CurrentStock = discrepancyResult.ActualVolume,
                            ExpectedStock = discrepancyResult.ExpectedVolume,
                            AbsoluteVariance = discrepancyResult.VarianceLiters,
                            PercentageVariance = discrepancyResult.VariancePercentage,
                            Severity = severity,
                            IsResolved = false,
                            AnalysisNotes = $"Discrepancy detected by policy '{policy.Name}' (ID: {policyId})",
                            BusinessImpactScore = CalculateBusinessImpact(discrepancyResult.VarianceLiters, tank)
                        };

                        reconciliationDiscrepancies.Add(reconciliationDiscrepancy);

                        //Cursor - Send discrepancy detection notification
                        await SendDiscrepancyDetectedNotificationAsync(tank, discrepancyResult, policy, cancellationToken);
                    }
                }

                // Process all discrepancies
                if (reconciliationDiscrepancies.Any())
                {
                    var reconciliationResults = await _orchestrationService.ProcessAllDiscrepanciesAsync(
                        reconciliationDiscrepancies, policy, execution.Id, cancellationToken);

                    executionResult.DiscrepanciesFound = reconciliationDiscrepancies.Count;
                    executionResult.DiscrepanciesResolved = reconciliationResults.Count(r => r.Success);

                    //Cursor - Send reconciliation completion notification
                    await SendReconciliationCompletionNotificationAsync(policy, executionResult.DiscrepanciesFound,
                        executionResult.DiscrepanciesResolved, cancellationToken);
                }

                // Update execution record
                execution.ExecutionEndTime = DateTime.UtcNow;
                execution.Status = ReconciliationExecutionStatus.Completed;
                execution.DiscrepanciesDetected = executionResult.DiscrepanciesFound;
                execution.TanksReconciled = executionResult.DiscrepanciesResolved;

                executionResult.Success = true;
                executionResult.CompletedAt = DateTime.UtcNow;

                _logger.LogInformation("Policy {PolicyId} execution completed successfully. Discrepancies: {Found}/{Resolved}",
                    policyId, executionResult.DiscrepanciesFound, executionResult.DiscrepanciesResolved);
            }
            catch (Exception ex)
            {
                execution.ExecutionEndTime = DateTime.UtcNow;
                execution.Status = ReconciliationExecutionStatus.Failed;
                execution.ErrorMessage = ex.Message;

                executionResult.Success = false;
                executionResult.ErrorMessage = ex.Message;
                executionResult.CompletedAt = DateTime.UtcNow;

                _logger.LogError(ex, "Policy {PolicyId} execution failed", policyId);
            }

            await _context.SaveChangesAsync(cancellationToken);
            return executionResult;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Critical error during policy {PolicyId} execution", policyId);
            executionResult.Success = false;
            executionResult.ErrorMessage = ex.Message;
            executionResult.CompletedAt = DateTime.UtcNow;
            throw;
        }
    }

    //Event Engine — fire ReconciliationEvent instead of creating notifications directly
    private async Task SendPolicyExecutionFailureNotificationAsync(int policyId, string errorMessage, CancellationToken cancellationToken)
    {
        try
        {
            var evt = new ReconciliationEvent
            {
                SubType = ReconciliationEvent.SubTypePolicyFailed,
                Severity = "High",
                PolicyId = policyId,
                ErrorMessage = errorMessage,
                Message = $"Policy {policyId} execution failed: {errorMessage}",
                TriggeredBy = SystemConstants.Defaults.SystemTriggeredBy
            };
            await _eventEngine.ProcessAsync(evt, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fire policy execution failure event for policy {PolicyId}", policyId);
        }
    }

    private async Task SendCycleSummaryNotificationAsync(ReconciliationCycleResult cycleResult, CancellationToken cancellationToken)
    {
        try
        {
            var evt = new ReconciliationEvent
            {
                SubType = ReconciliationEvent.SubTypeCycleSummary,
                Severity = cycleResult.FailedPolicies > cycleResult.SuccessfulPolicies ? "High" : "Medium",
                SuccessfulPolicies = cycleResult.SuccessfulPolicies,
                FailedPolicies = cycleResult.FailedPolicies,
                ProcessedPolicies = cycleResult.ProcessedPolicies,
                Message = $"Cycle {cycleResult.CycleId}: {cycleResult.SuccessfulPolicies} successful, {cycleResult.FailedPolicies} failed policies. Duration: {cycleResult.Duration.TotalMinutes:F1}min",
                TriggeredBy = SystemConstants.Defaults.SystemTriggeredBy
            };
            await _eventEngine.ProcessAsync(evt, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fire cycle summary event for cycle {CycleId}", cycleResult.CycleId);
        }
    }

    private async Task SendCycleCriticalFailureNotificationAsync(Guid cycleId, string errorMessage, CancellationToken cancellationToken)
    {
        try
        {
            var evt = new ReconciliationEvent
            {
                SubType = ReconciliationEvent.SubTypeCycleCriticalFailure,
                Severity = "Critical",
                ErrorMessage = errorMessage,
                Message = $"Reconciliation cycle {cycleId} failed critically: {errorMessage}",
                TriggeredBy = SystemConstants.Defaults.SystemTriggeredBy
            };
            await _eventEngine.ProcessAsync(evt, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fire critical failure event for cycle {CycleId}", cycleId);
        }
    }

    private async Task SendDiscrepancyDetectedNotificationAsync(Tank tank, DiscrepancyDetectionResult discrepancyResult,
        ReconciliationPolicy policy, CancellationToken cancellationToken)
    {
        try
        {
            var evt = new ReconciliationEvent
            {
                SubType = ReconciliationEvent.SubTypeDiscrepancyDetected,
                Severity = Math.Abs(discrepancyResult.VarianceLiters) > 50 ? "High" : "Medium",
                SiteId = tank.SiteId,
                TankId = tank.Id,
                TankName = tank.Name ?? "",
                PolicyId = policy.Id,
                PolicyName = policy.Name ?? "",
                VarianceLiters = discrepancyResult.VarianceLiters,
                VariancePercentage = discrepancyResult.VariancePercentage,
                Message = $"Tank {tank.Name} discrepancy: {discrepancyResult.VarianceLiters:F2}L ({discrepancyResult.VariancePercentage:F1}%)",
                TriggeredBy = SystemConstants.Defaults.SystemTriggeredBy
            };
            await _eventEngine.ProcessAsync(evt, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fire discrepancy detection event for tank {TankId}", tank.Id);
        }
    }

    private async Task SendReconciliationCompletionNotificationAsync(ReconciliationPolicy policy,
        int discrepanciesFound, int discrepanciesResolved, CancellationToken cancellationToken)
    {
        try
        {
            var unresolvedCount = discrepanciesFound - discrepanciesResolved;
            var evt = new ReconciliationEvent
            {
                SubType = ReconciliationEvent.SubTypePolicyCompleted,
                Severity = unresolvedCount > 0 ? "Medium" : "Low",
                SiteId = policy.SiteId,
                PolicyId = policy.Id,
                PolicyName = policy.Name ?? "",
                DiscrepanciesFound = discrepanciesFound,
                DiscrepanciesResolved = discrepanciesResolved,
                Message = $"Policy '{policy.Name}': {discrepanciesFound} discrepancies found, {discrepanciesResolved} resolved",
                TriggeredBy = SystemConstants.Defaults.SystemTriggeredBy
            };
            await _eventEngine.ProcessAsync(evt, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fire reconciliation completion event for policy {PolicyId}", policy.Id);
        }
    }

    private async Task<List<ReconciliationPolicy>> GetDuePoliciesAsync(CancellationToken cancellationToken)
    {
        var activePolicies = await _context.ReconciliationPolicies
            .Where(p => p.IsActive)
            .ToListAsync(cancellationToken);

        var duePolicies = new List<ReconciliationPolicy>();

        foreach (var policy in activePolicies)
        {
            //Cursor - Check configuration before evaluating policy (now uses global SystemConfiguration)
            var autoReconcileEnabled = await _systemConfigService.GetPtsAutoReconcileTankVolumesAsync(cancellationToken);
            if (!autoReconcileEnabled)
            {
                continue; // Skip policies when auto-reconciliation is disabled globally
            }

            if (await _policyEvaluationEngine.IsPolicyDueForExecution(policy, cancellationToken))
            {
                duePolicies.Add(policy);
            }
        }

        return duePolicies;
    }

    //Cursor - Helper methods for ReconciliationDiscrepancy processing
    private DiscrepancySeverity DetermineSeverity(decimal varianceLiters, decimal variancePercentage)
    {
        decimal absVarianceLiters = Math.Abs(varianceLiters);
        decimal absVariancePercentage = Math.Abs(variancePercentage);

        // Define severity thresholds - these could be configurable
        if (absVarianceLiters > 100 || absVariancePercentage > 10)
        {
            return DiscrepancySeverity.High;
        }

        if (absVarianceLiters > 50 || absVariancePercentage > 5)
        {
            return DiscrepancySeverity.Medium;
        }

        return DiscrepancySeverity.Low;
    }

    private decimal CalculateBusinessImpact(decimal varianceLiters, Tank tank)
    {
        // Simple business impact calculation based on variance amount
        // This could be enhanced with fuel cost, tank capacity, operational criticality, etc.
        decimal absVariance = Math.Abs(varianceLiters);

        // Base impact score (0-100 scale)
        decimal impactScore = Math.Min(absVariance / 10, 100); // 10 liters = 1 point, max 100

        // Adjust based on tank capacity if available
        if (tank.TankVolume > 0)
        {
            decimal percentageOfCapacity = absVariance / tank.TankVolume * 100;
            impactScore = Math.Max(impactScore, percentageOfCapacity * 2); // Weight capacity percentage higher
        }

        return Math.Round(impactScore, 2);
    }
}

//Cursor - Result classes for execution tracking
public class ReconciliationCycleResult
{
    public Guid CycleId { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime CompletedAt { get; set; }
    public TimeSpan Duration { get; set; }
    public bool Success { get; set; }
    public string ErrorMessage { get; set; }
    public int ProcessedPolicies { get; set; }
    public int SuccessfulPolicies { get; set; }
    public int FailedPolicies { get; set; }
    public List<PolicyExecutionResult> PolicyResults { get; set; } = new();
}

public class PolicyExecutionResult
{
    public int PolicyId { get; set; }
    public Guid ExecutionId { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime CompletedAt { get; set; }
    public bool Success { get; set; }
    public string ErrorMessage { get; set; }
    public int ProcessedTanks { get; set; }
    public int DiscrepanciesFound { get; set; }
    public int DiscrepanciesResolved { get; set; }
}