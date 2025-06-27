using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common.Constants;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.Services;
using FMS.Application.Services;
using FMS.Application.Services.AutomatedReconciliation;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Domain.Entities.Features.AutomaticReconciliation;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.AutomatedReconciliation.Services;

//Cursor - Enhanced AutomatedReconciliationService with notification system integration and configuration support
public class AutomatedReconciliationService {
    private readonly GpsdataContext _context;
    private readonly PolicyEvaluationEngine _policyEvaluationEngine;
    private readonly DiscrepancyDetectionService _discrepancyDetectionService;
    private readonly ReconciliationOrchestrationService _orchestrationService;
    private readonly DailyReconciliationPolicyService _dailyReconciliationService;
    private readonly INotificationService _notificationService; //Cursor - Add notification service
    private readonly IAutomatedFuelingConfigurationService _configurationService; //Cursor - Add configuration service
    private readonly ILogger<AutomatedReconciliationService> _logger;

    public AutomatedReconciliationService (
        GpsdataContext context,
        PolicyEvaluationEngine policyEvaluationEngine,
        DiscrepancyDetectionService discrepancyDetectionService,
        ReconciliationOrchestrationService orchestrationService,
        DailyReconciliationPolicyService dailyReconciliationService,
        INotificationService notificationService, //Cursor - Add notification service
        IAutomatedFuelingConfigurationService configurationService, //Cursor - Add configuration service
        ILogger<AutomatedReconciliationService> logger) {
        _context = context;
        _policyEvaluationEngine = policyEvaluationEngine;
        _discrepancyDetectionService = discrepancyDetectionService;
        _orchestrationService = orchestrationService;
        _dailyReconciliationService = dailyReconciliationService;
        _notificationService = notificationService; //Cursor - Initialize notification service
        _configurationService = configurationService; //Cursor - Initialize configuration service
        _logger = logger;
    }

    //Cursor - Enhanced ExecuteReconciliationCycleAsync with metrics emission and notifications
    public async Task<ReconciliationCycleResult> ExecuteReconciliationCycleAsync (CancellationToken cancellationToken = default) {
        var cycleResult = new ReconciliationCycleResult {
        StartedAt = DateTime.UtcNow,
        CycleId = Guid.NewGuid ()
        };

        //Cursor - Emit metrics using ILogger.BeginScope for structured logging
        using var scope = _logger.BeginScope (new Dictionary<string, object> {
            ["Operation"] = "ReconciliationCycle",
            ["CycleId"] = cycleResult.CycleId,
            ["StartTime"] = cycleResult.StartedAt
        });

        try {
            _logger.LogInformation ("Starting reconciliation cycle {CycleId}", cycleResult.CycleId);

            // Get all active policies that are due for execution
            var duePolicies = await GetDuePoliciesAsync (cancellationToken);
            cycleResult.ProcessedPolicies = duePolicies.Count;

            _logger.LogInformation ("Found {PolicyCount} policies due for execution", duePolicies.Count);

            // Execute each policy
            foreach (var policy in duePolicies) {
                try {
                    var policyResult = await ExecuteSinglePolicyAsync (policy.Id, cancellationToken);
                    cycleResult.PolicyResults.Add (policyResult);

                    if (policyResult.Success)
                        cycleResult.SuccessfulPolicies++;
                    else
                        cycleResult.FailedPolicies++;
                } catch (Exception policyEx) {
                    _logger.LogError (policyEx, "Failed to execute policy {PolicyId} during cycle {CycleId}",
                        policy.Id, cycleResult.CycleId);
                    cycleResult.FailedPolicies++;

                    //Cursor - Send notification for policy execution failure
                    await SendPolicyExecutionFailureNotificationAsync (policy.Id, policyEx.Message, cancellationToken);
                }
            }

            cycleResult.CompletedAt = DateTime.UtcNow;
            cycleResult.Duration = cycleResult.CompletedAt - cycleResult.StartedAt;
            cycleResult.Success = cycleResult.FailedPolicies == 0;

            //Cursor - Send cycle summary notification if there were failures
            if (cycleResult.FailedPolicies > 0) {
                await SendCycleSummaryNotificationAsync (cycleResult, cancellationToken);
            }

            //Cursor - Emit final metrics before returning result
            _logger.LogInformation ("Reconciliation cycle {CycleId} completed in {Duration}ms. Success: {SuccessCount}, Failed: {FailedCount}",
                cycleResult.CycleId,
                cycleResult.Duration.TotalMilliseconds,
                cycleResult.SuccessfulPolicies,
                cycleResult.FailedPolicies);

            // Emit structured metrics for monitoring systems
            using var metricsScope = _logger.BeginScope (new Dictionary<string, object> {
                ["MetricType"] = "ReconciliationCycleCompleted",
                ["CycleId"] = cycleResult.CycleId,
                ["Duration"] = cycleResult.Duration.TotalMilliseconds,
                ["SuccessfulPolicies"] = cycleResult.SuccessfulPolicies,
                ["FailedPolicies"] = cycleResult.FailedPolicies,
                ["TotalPolicies"] = cycleResult.ProcessedPolicies
            });

            return cycleResult;
        } catch (Exception ex) {
            _logger.LogError (ex, "Reconciliation cycle {CycleId} failed", cycleResult.CycleId);
            cycleResult.CompletedAt = DateTime.UtcNow;
            cycleResult.Duration = cycleResult.CompletedAt - cycleResult.StartedAt;
            cycleResult.Success = false;
            cycleResult.ErrorMessage = ex.Message;

            //Cursor - Send critical failure notification
            await SendCycleCriticalFailureNotificationAsync (cycleResult.CycleId, ex.Message, cancellationToken);

            throw;
        }
    }

    //Cursor - Enhanced ExecuteSinglePolicyAsync with configuration checks and notifications
    public async Task<PolicyExecutionResult> ExecuteSinglePolicyAsync (int policyId, CancellationToken cancellationToken = default) {
        var executionResult = new PolicyExecutionResult {
        PolicyId = policyId,
        StartedAt = DateTime.UtcNow,
        ExecutionId = Guid.NewGuid ()
        };

        using var scope = _logger.BeginScope (new Dictionary<string, object> {
            ["Operation"] = "SinglePolicyExecution",
            ["PolicyId"] = policyId,
            ["ExecutionId"] = executionResult.ExecutionId
        });

        try {
            //Cursor - Replace temporary policy creation with actual fetch from context
            var policy = await _context.ReconciliationPolicies
                .Include (p => p.TankScopeConfiguration)
                .FirstOrDefaultAsync (p => p.Id == policyId && p.IsActive, cancellationToken);

            if (policy == null) {
                executionResult.Success = false;
                executionResult.ErrorMessage = "Policy not found or inactive";
                return executionResult;
            }

            _logger.LogInformation ("Executing policy {PolicyId} - {PolicyName}", policy.Id, policy.Name);

            //Cursor - Check configuration before execution
            var configuration = await _configurationService.GetConfigurationAsync (policy.SiteId, cancellationToken);
            if (!configuration.AutoReconcileTankVolumes) {
                _logger.LogInformation ("Auto-reconciliation disabled for site {SiteId}, skipping policy {PolicyId}",
                    policy.SiteId, policy.Id);

                executionResult.Success = true;
                executionResult.CompletedAt = DateTime.UtcNow;
                executionResult.ErrorMessage = "Auto-reconciliation disabled by configuration";
                return executionResult;
            }

            //Cursor - Check if this is a daily reconciliation policy and handle accordingly
            if (_dailyReconciliationService.IsDailyReconciliationPolicy (policy)) {
                _logger.LogInformation ("Executing daily reconciliation policy {PolicyId}", policy.Id);
                return await _dailyReconciliationService.ExecuteDailyReconciliationPolicyAsync (policy, cancellationToken);
            }

            // Create execution record
            var execution = new ReconciliationPolicyExecution {
                PolicyId = policyId,
                ExecutionStartTime = DateTime.UtcNow,
                Status = ReconciliationExecutionStatus.InProgress,
                ExecutedBy = SystemConstants.Defaults.SystemTriggeredBy
            };

            _context.ReconciliationPolicyExecutions.Add (execution);
            await _context.SaveChangesAsync (cancellationToken);

            try {
                // Get tanks requiring reconciliation based on policy
                var tanksToReconcile = await _policyEvaluationEngine.GetTanksRequiringReconciliation (policy, cancellationToken);
                executionResult.ProcessedTanks = tanksToReconcile.Count;

                // Process each tank
                var discrepancyRecords = new List<DiscrepancyRecord> ();

                foreach (var tank in tanksToReconcile) {
                    var discrepancyResult = await _discrepancyDetectionService.DetectDiscrepancies (tank, policy, cancellationToken);

                    if (discrepancyResult.IsSignificant) {
                        var discrepancyRecord = new DiscrepancyRecord {
                            TankId = tank.Id,
                            PolicyId = policyId,
                            ExecutionId = execution.Id,
                            DetectedAt = DateTime.UtcNow,
                            VarianceLiters = discrepancyResult.VarianceLiters,
                            VariancePercentage = discrepancyResult.VariancePercentage,
                            IsResolved = false
                        };

                        discrepancyRecords.Add (discrepancyRecord);

                        //Cursor - Send discrepancy detection notification
                        await SendDiscrepancyDetectedNotificationAsync (tank, discrepancyResult, policy, cancellationToken);
                    }
                }

                // Process all discrepancies
                if (discrepancyRecords.Any ()) {
                    // Convert DiscrepancyRecord to ReconciliationDiscrepancy
                    var reconciliationDiscrepancies = discrepancyRecords.Select (dr => new ReconciliationDiscrepancy {
                        PolicyExecutionId = dr.ExecutionId,
                            TankId = dr.TankId,
                            DetectedAt = dr.DetectedAt,
                            CurrentStock = 0, // Will be populated by the service
                            ExpectedStock = 0, // Will be populated by the service
                            AbsoluteVariance = dr.VarianceLiters,
                            PercentageVariance = dr.VariancePercentage,
                            Severity = FMS.Domain.Entities.enums.DiscrepancySeverity.Medium,
                            IsResolved = dr.IsResolved,
                            AnalysisNotes = $"Discrepancy detected by policy {policyId}",
                            BusinessImpactScore = 0 // Will be calculated by the service
                    }).ToList ();

                    var reconciliationResults = await _orchestrationService.ProcessAllDiscrepanciesAsync (
                        reconciliationDiscrepancies, policy, execution.Id, cancellationToken);

                    executionResult.DiscrepanciesFound = discrepancyRecords.Count;
                    executionResult.DiscrepanciesResolved = reconciliationResults.Count (r => r.Success);

                    //Cursor - Send reconciliation completion notification
                    await SendReconciliationCompletionNotificationAsync (policy, executionResult.DiscrepanciesFound,
                        executionResult.DiscrepanciesResolved, cancellationToken);
                }

                // Update execution record
                execution.ExecutionEndTime = DateTime.UtcNow;
                execution.Status = ReconciliationExecutionStatus.Completed;
                execution.DiscrepanciesDetected = executionResult.DiscrepanciesFound;
                execution.TanksReconciled = executionResult.DiscrepanciesResolved;

                executionResult.Success = true;
                executionResult.CompletedAt = DateTime.UtcNow;

                _logger.LogInformation ("Policy {PolicyId} execution completed successfully. Discrepancies: {Found}/{Resolved}",
                    policyId, executionResult.DiscrepanciesFound, executionResult.DiscrepanciesResolved);
            } catch (Exception ex) {
                execution.ExecutionEndTime = DateTime.UtcNow;
                execution.Status = ReconciliationExecutionStatus.Failed;
                execution.ErrorMessage = ex.Message;

                executionResult.Success = false;
                executionResult.ErrorMessage = ex.Message;
                executionResult.CompletedAt = DateTime.UtcNow;

                _logger.LogError (ex, "Policy {PolicyId} execution failed", policyId);
            }

            await _context.SaveChangesAsync (cancellationToken);
            return executionResult;
        } catch (Exception ex) {
            _logger.LogError (ex, "Critical error during policy {PolicyId} execution", policyId);
            executionResult.Success = false;
            executionResult.ErrorMessage = ex.Message;
            executionResult.CompletedAt = DateTime.UtcNow;
            throw;
        }
    }

    //Cursor - Notification methods for reconciliation events
    private async Task SendPolicyExecutionFailureNotificationAsync (int policyId, string errorMessage, CancellationToken cancellationToken) {
        try {
            var request = new CreateNotificationRequest {
                Type = "Alert",
                Category = "Reconciliation",
                Priority = "High",
                Title = "Reconciliation Policy Execution Failed",
                Message = $"Policy {policyId} execution failed: {errorMessage}",
                TriggerSource = "AutomatedReconciliation",
                TriggeredBy = "System",
                Recipients = new List<CreateNotificationRecipientRequest> {
                new CreateNotificationRecipientRequest {
                UserId = "fuel-operations",
                DeliveryMethods = new List<string> { "System", "Email" }
                }
                }
            };

            await _notificationService.CreateNotificationAsync (request, cancellationToken);
        } catch (Exception ex) {
            _logger.LogError (ex, "Failed to send policy execution failure notification for policy {PolicyId}", policyId);
        }
    }

    private async Task SendCycleSummaryNotificationAsync (ReconciliationCycleResult cycleResult, CancellationToken cancellationToken) {
        try {
            var request = new CreateNotificationRequest {
                Type = "Alert",
                Category = "Reconciliation",
                Priority = cycleResult.FailedPolicies > cycleResult.SuccessfulPolicies ? "High" : "Medium",
                Title = "Reconciliation Cycle Summary",
                Message = $"Cycle {cycleResult.CycleId}: {cycleResult.SuccessfulPolicies} successful, {cycleResult.FailedPolicies} failed policies. Duration: {cycleResult.Duration.TotalMinutes:F1}min",
                TriggerSource = "AutomatedReconciliation",
                TriggeredBy = "System",
                Recipients = new List<CreateNotificationRecipientRequest> {
                new CreateNotificationRecipientRequest {
                UserId = "fuel-operations",
                DeliveryMethods = new List<string> { "System" }
                }
                }
            };

            await _notificationService.CreateNotificationAsync (request, cancellationToken);
        } catch (Exception ex) {
            _logger.LogError (ex, "Failed to send cycle summary notification for cycle {CycleId}", cycleResult.CycleId);
        }
    }

    private async Task SendCycleCriticalFailureNotificationAsync (Guid cycleId, string errorMessage, CancellationToken cancellationToken) {
        try {
            var request = new CreateNotificationRequest {
                Type = "Alert",
                Category = "Reconciliation",
                Priority = "Critical",
                Title = "Critical Reconciliation System Failure",
                Message = $"Reconciliation cycle {cycleId} failed critically: {errorMessage}",
                TriggerSource = "AutomatedReconciliation",
                TriggeredBy = SystemConstants.Defaults.SystemTriggeredBy,
                Recipients = new List<CreateNotificationRecipientRequest> {
                new CreateNotificationRecipientRequest {
                UserId = "fuel-operations",
                DeliveryMethods = new List<string> { "System", "Email", "SMS" }
                },
                new CreateNotificationRecipientRequest {
                UserId = "system-administrator",
                DeliveryMethods = new List<string> { "System", "Email" }
                }
                }
            };

            await _notificationService.CreateNotificationAsync (request, cancellationToken);
        } catch (Exception ex) {
            _logger.LogError (ex, "Failed to send critical failure notification for cycle {CycleId}", cycleId);
        }
    }

    private async Task SendDiscrepancyDetectedNotificationAsync (Tank tank, DiscrepancyDetectionResult discrepancyResult,
        ReconciliationPolicy policy, CancellationToken cancellationToken) {
        try {
            var priority = Math.Abs (discrepancyResult.VarianceLiters) > 50 ? "High" : "Medium";

            var request = new CreateNotificationRequest {
                Type = "Alert",
                Category = "Tank",
                Priority = priority,
                Title = "Tank Volume Discrepancy Detected",
                Message = $"Tank {tank.Name} discrepancy: {discrepancyResult.VarianceLiters:F2}L ({discrepancyResult.VariancePercentage:F1}%)",
                TriggerSource = "AutomatedReconciliation",
                TriggeredBy = SystemConstants.Defaults.SystemTriggeredBy,
                SiteId = tank.SiteId,
                TankId = tank.Id,
                Recipients = new List<CreateNotificationRecipientRequest> {
                new CreateNotificationRecipientRequest {
                UserId = "fuel-operations",
                DeliveryMethods = new List<string> { "System", "Email" }
                }
                }
            };

            await _notificationService.CreateNotificationAsync (request, cancellationToken);
        } catch (Exception ex) {
            _logger.LogError (ex, "Failed to send discrepancy detection notification for tank {TankId}", tank.Id);
        }
    }

    private async Task SendReconciliationCompletionNotificationAsync (ReconciliationPolicy policy,
        int discrepanciesFound, int discrepanciesResolved, CancellationToken cancellationToken) {
        try {
            var unresolvedCount = discrepanciesFound - discrepanciesResolved;
            var priority = unresolvedCount > 0 ? "Medium" : "Low";

            var request = new CreateNotificationRequest {
                Type = "Info",
                Category = "Reconciliation",
                Priority = priority,
                Title = "Reconciliation Policy Completed",
                Message = $"Policy '{policy.Name}': {discrepanciesFound} discrepancies found, {discrepanciesResolved} resolved",
                TriggerSource = "AutomatedReconciliation",
                TriggeredBy = SystemConstants.Defaults.SystemTriggeredBy,
                SiteId = policy.SiteId,
                Recipients = new List<CreateNotificationRecipientRequest> {
                new CreateNotificationRecipientRequest {
                UserId = "fuel-operations",
                DeliveryMethods = new List<string> { "System" }
                }
                }
            };

            await _notificationService.CreateNotificationAsync (request, cancellationToken);
        } catch (Exception ex) {
            _logger.LogError (ex, "Failed to send reconciliation completion notification for policy {PolicyId}", policy.Id);
        }
    }

    private async Task<List<ReconciliationPolicy>> GetDuePoliciesAsync (CancellationToken cancellationToken) {
        var activePolicies = await _context.ReconciliationPolicies
            .Where (p => p.IsActive)
            .ToListAsync (cancellationToken);

        var duePolicies = new List<ReconciliationPolicy> ();

        foreach (var policy in activePolicies) {
            //Cursor - Check configuration before evaluating policy
            var configuration = await _configurationService.GetConfigurationAsync (policy.SiteId, cancellationToken);
            if (!configuration.AutoReconcileTankVolumes) {
                continue; // Skip policies for sites with auto-reconciliation disabled
            }

            if (await _policyEvaluationEngine.IsPolicyDueForExecution (policy, cancellationToken)) {
                duePolicies.Add (policy);
            }
        }

        return duePolicies;
    }
}

//Cursor - Result classes for execution tracking
public class ReconciliationCycleResult {
    public Guid CycleId { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime CompletedAt { get; set; }
    public TimeSpan Duration { get; set; }
    public bool Success { get; set; }
    public string ErrorMessage { get; set; }
    public int ProcessedPolicies { get; set; }
    public int SuccessfulPolicies { get; set; }
    public int FailedPolicies { get; set; }
    public List<PolicyExecutionResult> PolicyResults { get; set; } = new ();
}

public class PolicyExecutionResult {
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