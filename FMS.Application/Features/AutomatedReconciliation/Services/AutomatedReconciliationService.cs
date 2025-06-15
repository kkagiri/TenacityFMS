// using System;
// using System.Collections.Generic;
// using System.Linq;
// using System.Threading;
// using System.Threading.Tasks;
// using FMS.Application.Services.AutomatedReconciliation;
// using FMS.Domain.Entities;
// using FMS.Domain.Entities.enums;
// using FMS.Domain.Entities.Features.AutomaticReconciliation;
// using FMS.Persistence.DataAccess;
// using Microsoft.EntityFrameworkCore;
// using Microsoft.Extensions.Logging;

// namespace FMS.Application.Features.AutomatedReconciliation.Services;

// //Cursor - AutomatedReconciliationService with metrics and enhanced policy execution
// public class AutomatedReconciliationService {
//     private readonly GpsdataContext _context;
//     private readonly PolicyEvaluationEngine _policyEvaluationEngine;
//     private readonly DiscrepancyDetectionService _discrepancyDetectionService;
//     private readonly ReconciliationOrchestrationService _orchestrationService;
//     private readonly DailyReconciliationPolicyService _dailyReconciliationService;
//     private readonly ILogger<AutomatedReconciliationService> _logger;

//     public AutomatedReconciliationService (
//         GpsdataContext context,
//         PolicyEvaluationEngine policyEvaluationEngine,
//         DiscrepancyDetectionService discrepancyDetectionService,
//         ReconciliationOrchestrationService orchestrationService,
//         DailyReconciliationPolicyService dailyReconciliationService,
//         ILogger<AutomatedReconciliationService> logger) {
//         _context = context;
//         _policyEvaluationEngine = policyEvaluationEngine;
//         _discrepancyDetectionService = discrepancyDetectionService;
//         _orchestrationService = orchestrationService;
//         _dailyReconciliationService = dailyReconciliationService;
//         _logger = logger;
//     }

//     //Cursor - Enhanced ExecuteReconciliationCycleAsync with metrics emission
//     public async Task<ReconciliationCycleResult> ExecuteReconciliationCycleAsync (CancellationToken cancellationToken = default) {
//         var cycleResult = new ReconciliationCycleResult {
//         StartedAt = DateTime.UtcNow,
//         CycleId = Guid.NewGuid ()
//         };

//         //Cursor - Emit metrics using ILogger.BeginScope for structured logging
//         using var scope = _logger.BeginScope (new Dictionary<string, object> {
//             ["Operation"] = "ReconciliationCycle",
//             ["CycleId"] = cycleResult.CycleId,
//             ["StartTime"] = cycleResult.StartedAt
//         });

//         try {
//             _logger.LogInformation ("Starting reconciliation cycle {CycleId}", cycleResult.CycleId);

//             // Get all active policies that are due for execution
//             var duePolicies = await GetDuePoliciesAsync (cancellationToken);
//             cycleResult.ProcessedPolicies = duePolicies.Count;

//             _logger.LogInformation ("Found {PolicyCount} policies due for execution", duePolicies.Count);

//             // Execute each policy
//             foreach (var policy in duePolicies) {
//                 try {
//                     var policyResult = await ExecuteSinglePolicyAsync (policy.Id, cancellationToken);
//                     cycleResult.PolicyResults.Add (policyResult);

//                     if (policyResult.Success)
//                         cycleResult.SuccessfulPolicies++;
//                     else
//                         cycleResult.FailedPolicies++;
//                 } catch (Exception policyEx) {
//                     _logger.LogError (policyEx, "Failed to execute policy {PolicyId} during cycle {CycleId}",
//                         policy.Id, cycleResult.CycleId);
//                     cycleResult.FailedPolicies++;
//                 }
//             }

//             cycleResult.CompletedAt = DateTime.UtcNow;
//             cycleResult.Duration = cycleResult.CompletedAt - cycleResult.StartedAt;
//             cycleResult.Success = cycleResult.FailedPolicies == 0;

//             //Cursor - Emit final metrics before returning result
//             _logger.LogInformation ("Reconciliation cycle {CycleId} completed in {Duration}ms. Success: {SuccessCount}, Failed: {FailedCount}",
//                 cycleResult.CycleId,
//                 cycleResult.Duration.TotalMilliseconds,
//                 cycleResult.SuccessfulPolicies,
//                 cycleResult.FailedPolicies);

//             // Emit structured metrics for monitoring systems
//             using var metricsScope = _logger.BeginScope (new Dictionary<string, object> {
//                 ["MetricType"] = "ReconciliationCycleCompleted",
//                 ["CycleId"] = cycleResult.CycleId,
//                 ["Duration"] = cycleResult.Duration.TotalMilliseconds,
//                 ["SuccessfulPolicies"] = cycleResult.SuccessfulPolicies,
//                 ["FailedPolicies"] = cycleResult.FailedPolicies,
//                 ["TotalPolicies"] = cycleResult.ProcessedPolicies
//             });

//             return cycleResult;
//         } catch (Exception ex) {
//             _logger.LogError (ex, "Reconciliation cycle {CycleId} failed", cycleResult.CycleId);
//             cycleResult.CompletedAt = DateTime.UtcNow;
//             cycleResult.Duration = cycleResult.CompletedAt - cycleResult.StartedAt;
//             cycleResult.Success = false;
//             cycleResult.ErrorMessage = ex.Message;
//             throw;
//         }
//     }

//     //Cursor - Enhanced ExecuteSinglePolicyAsync with actual policy fetch and validation
//     public async Task<PolicyExecutionResult> ExecuteSinglePolicyAsync (int policyId, CancellationToken cancellationToken = default) {
//         var executionResult = new PolicyExecutionResult {
//         PolicyId = policyId,
//         StartedAt = DateTime.UtcNow,
//         ExecutionId = Guid.NewGuid ()
//         };

//         using var scope = _logger.BeginScope (new Dictionary<string, object> {
//             ["Operation"] = "SinglePolicyExecution",
//             ["PolicyId"] = policyId,
//             ["ExecutionId"] = executionResult.ExecutionId
//         });

//         try {
//             //Cursor - Replace temporary policy creation with actual fetch from context
//             var policy = await _context.ReconciliationPolicies
//                 .Include (p => p.TankScopeConfiguration)
//                 .FirstOrDefaultAsync (p => p.Id == policyId && p.IsActive, cancellationToken);

//             if (policy == null) {
//                 executionResult.Success = false;
//                 executionResult.ErrorMessage = "Policy not found or inactive";
//                 return executionResult;
//             }

//             _logger.LogInformation ("Executing policy {PolicyId} - {PolicyName}", policy.Id, policy.Name);

//             //Cursor - Check if this is a daily reconciliation policy and handle accordingly
//             if (_dailyReconciliationService.IsDailyReconciliationPolicy (policy)) {
//                 _logger.LogInformation ("Executing daily reconciliation policy {PolicyId}", policy.Id);
//                 return await _dailyReconciliationService.ExecuteDailyReconciliationPolicyAsync (policy, cancellationToken);
//             }

//             // Create execution record
//             var execution = new ReconciliationPolicyExecution {
//                 PolicyId = policyId,
//                 ExecutionStartTime = DateTime.UtcNow,
//                 Status = ReconciliationExecutionStatus.InProgress,
//                 ExecutedBy = "System"
//             };

//             _context.ReconciliationPolicyExecutions.Add (execution);
//             await _context.SaveChangesAsync (cancellationToken);

//             try {
//                 // Get tanks requiring reconciliation based on policy
//                 var tanksToReconcile = await _policyEvaluationEngine.GetTanksRequiringReconciliation (policy, cancellationToken);
//                 executionResult.ProcessedTanks = tanksToReconcile.Count;

//                 // Process each tank
//                 var discrepancyRecords = new List<DiscrepancyRecord> ();

//                 foreach (var tank in tanksToReconcile) {
//                     var discrepancyResult = await _discrepancyDetectionService.DetectDiscrepancies (tank, policy, cancellationToken);

//                     if (discrepancyResult.IsSignificant) {
//                         var discrepancyRecord = new DiscrepancyRecord {
//                             TankId = tank.Id,
//                             PolicyId = policyId,
//                             ExecutionId = execution.Id,
//                             DetectedAt = DateTime.UtcNow,
//                             VarianceLiters = discrepancyResult.VarianceLiters,
//                             VariancePercentage = discrepancyResult.VariancePercentage,
//                             IsResolved = false
//                         };

//                         discrepancyRecords.Add (discrepancyRecord);
//                     }
//                 }

//                 // Process all discrepancies
//                 if (discrepancyRecords.Any ()) {
//                     var reconciliationResults = await _orchestrationService.ProcessAllDiscrepanciesAsync (
//                         discrepancyRecords, policy, execution.Id, cancellationToken);

//                     executionResult.DiscrepanciesFound = discrepancyRecords.Count;
//                     executionResult.DiscrepanciesResolved = reconciliationResults.Count (r => r.Success);
//                 }

//                 // Update execution record
//                 execution.ExecutionEndTime = DateTime.UtcNow;
//                 execution.Status = ReconciliationExecutionStatus.Completed;
//                 execution.DiscrepanciesDetected = executionResult.DiscrepanciesFound;
//                 execution.TanksReconciled = executionResult.DiscrepanciesResolved;

//                 executionResult.Success = true;
//                 executionResult.CompletedAt = DateTime.UtcNow;

//                 _logger.LogInformation ("Policy {PolicyId} execution completed successfully. Discrepancies: {Found}/{Resolved}",
//                     policyId, executionResult.DiscrepanciesFound, executionResult.DiscrepanciesResolved);
//             } catch (Exception ex) {
//                 execution.ExecutionStartTime = DateTime.UtcNow;
//                 execution.Status = ReconciliationExecutionStatus.Failed;
//                 execution.ErrorMessage = ex.Message;

//                 executionResult.Success = false;
//                 executionResult.ErrorMessage = ex.Message;
//                 executionResult.CompletedAt = DateTime.UtcNow;

//                 _logger.LogError (ex, "Policy {PolicyId} execution failed", policyId);
//             }

//             await _context.SaveChangesAsync (cancellationToken);
//             return executionResult;
//         } catch (Exception ex) {
//             _logger.LogError (ex, "Critical error during policy {PolicyId} execution", policyId);
//             executionResult.Success = false;
//             executionResult.ErrorMessage = ex.Message;
//             executionResult.CompletedAt = DateTime.UtcNow;
//             throw;
//         }
//     }

//     private async Task<List<ReconciliationPolicy>> GetDuePoliciesAsync (CancellationToken cancellationToken) {
//         var activePolicies = await _context.ReconciliationPolicies
//             .Where (p => p.IsActive)
//             .ToListAsync (cancellationToken);

//         var duePolicies = new List<ReconciliationPolicy> ();

//         foreach (var policy in activePolicies) {
//             if (await _policyEvaluationEngine.IsPolicyDueForExecution (policy, cancellationToken)) {
//                 duePolicies.Add (policy);
//             }
//         }

//         return duePolicies;
//     }
// }

// //Cursor - Result classes for execution tracking
// public class ReconciliationCycleResult {
//     public Guid CycleId { get; set; }
//     public DateTime StartedAt { get; set; }
//     public DateTime CompletedAt { get; set; }
//     public TimeSpan Duration { get; set; }
//     public bool Success { get; set; }
//     public string ErrorMessage { get; set; }
//     public int ProcessedPolicies { get; set; }
//     public int SuccessfulPolicies { get; set; }
//     public int FailedPolicies { get; set; }
//     public List<PolicyExecutionResult> PolicyResults { get; set; } = new ();
// }

// public class PolicyExecutionResult {
//     public int PolicyId { get; set; }
//     public Guid ExecutionId { get; set; }
//     public DateTime StartedAt { get; set; }
//     public DateTime CompletedAt { get; set; }
//     public bool Success { get; set; }
//     public string ErrorMessage { get; set; }
//     public int ProcessedTanks { get; set; }
//     public int DiscrepanciesFound { get; set; }
//     public int DiscrepanciesResolved { get; set; }
// }