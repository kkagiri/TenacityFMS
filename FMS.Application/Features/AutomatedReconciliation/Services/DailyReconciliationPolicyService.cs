//  using System.Collections.Generic;
//  using System.Linq;
//  using System.Threading.Tasks;
//  using System.Threading;
//  using System;
//  using FMS.Application.Features.TankManagement.DailyTankReconciliation.Commands;
//  using FMS.Domain.Entities.enums;
//  using FMS.Domain.Entities;
//  using FMS.Persistence.DataAccess;
//  using MediatR;
//  using Microsoft.EntityFrameworkCore;
//  using Microsoft.Extensions.Logging;

//  namespace FMS.Application.Features.AutomatedReconciliation.Services;

//  //Cursor - Service to integrate daily tank reconciliation with automated reconciliation policies
//  public class DailyReconciliationPolicyService {
//      private readonly GpsdataContext _context;
//      private readonly IMediator _mediator;
//      private readonly ILogger<DailyReconciliationPolicyService> _logger;

//      public DailyReconciliationPolicyService (
//          GpsdataContext context,
//          IMediator mediator,
//          ILogger<DailyReconciliationPolicyService> logger) {
//          _context = context;
//          _mediator = mediator;
//          _logger = logger;
//      }

//      //Cursor - Execute daily reconciliation as part of automated reconciliation policy
//      public async Task<PolicyExecutionResult> ExecuteDailyReconciliationPolicyAsync (
//          ReconciliationPolicy policy,
//          CancellationToken cancellationToken = default) {
//          var executionResult = new PolicyExecutionResult {
//          PolicyId = policy.Id,
//          StartedAt = DateTime.UtcNow,
//          ExecutionId = Guid.NewGuid ()
//          };

//          try {
//              _logger.LogInformation ("Executing daily reconciliation policy {PolicyId} - {PolicyName}",
//                  policy.Id, policy.Name);

//              // Determine the date to process (yesterday by default for daily reconciliation)
//              var targetDate = GetTargetDateForPolicy (policy);

//              // Create command for daily reconciliation processing
//              var command = new ProcessDailyReconciliationCommand {
//                  StartDate = targetDate,
//                  EndDate = targetDate, // Single day processing
//                  SiteId = GetSiteIdFromPolicy (policy),
//                  TankId = GetTankIdFromPolicy (policy),
//                  ForceReprocess = policy.AllowReprocessing ?? false
//              };

//              // Execute daily reconciliation
//              var reconciliationResponse = await _mediator.Send (command, cancellationToken);

//              if (reconciliationResponse.IsSuccess && reconciliationResponse.Data != null) {
//                  var result = reconciliationResponse.Data;

//                  executionResult.Success = true;
//                  executionResult.ProcessedTanks = result.TotalTanksProcessed;
//                  executionResult.DiscrepanciesFound = result.RecordsWithDiscrepancies;
//                  executionResult.DiscrepanciesResolved = result.RecordsCreated + result.RecordsUpdated;
//                  executionResult.CompletedAt = DateTime.UtcNow;

//                  // Create discrepancy records for significant variances
//                  await CreateDiscrepancyRecordsFromDailyReconciliation (result, policy, cancellationToken);

//                  _logger.LogInformation ("Daily reconciliation policy {PolicyId} completed successfully. " +
//                      "Processed {TankCount} tanks, found {DiscrepancyCount} discrepancies",
//                      policy.Id, result.TotalTanksProcessed, result.RecordsWithDiscrepancies);
//              } else {
//                  executionResult.Success = false;
//                  executionResult.ErrorMessage = reconciliationResponse.Message;
//                  executionResult.CompletedAt = DateTime.UtcNow;

//                  _logger.LogError ("Daily reconciliation policy {PolicyId} failed: {ErrorMessage}",
//                      policy.Id, reconciliationResponse.Message);
//              }

//              return executionResult;
//          } catch (Exception ex) {
//              _logger.LogError (ex, "Error executing daily reconciliation policy {PolicyId}", policy.Id);

//              executionResult.Success = false;
//              executionResult.ErrorMessage = ex.Message;
//              executionResult.CompletedAt = DateTime.UtcNow;

//              return executionResult;
//          }
//      }

//      //Cursor - Create discrepancy records from daily reconciliation results for automated processing
//      private async Task CreateDiscrepancyRecordsFromDailyReconciliation (
//          DailyReconciliationResult result,
//          ReconciliationPolicy policy,
//          CancellationToken cancellationToken) {
//          var discrepancyThreshold = policy.VarianceThresholdLiters ?? 5.0m; // Default 5L threshold
//          var significantDiscrepancies = result.TankSummaries
//              .Where (ts => ts.HasDiscrepancy && ts.Variance > discrepancyThreshold)
//              .ToList ();

//          if (!significantDiscrepancies.Any ()) {
//              _logger.LogDebug ("No significant discrepancies found above threshold {Threshold}L", discrepancyThreshold);
//              return;
//          }

//          // Get the policy execution record
//          var policyExecution = await _context.ReconciliationPolicyExecutions
//              .Where (pe => pe.PolicyId == policy.Id)
//              .OrderByDescending (pe => pe.ExecutionStartTime)
//              .FirstOrDefaultAsync (cancellationToken);

//          if (policyExecution == null) {
//              _logger.LogWarning ("No policy execution record found for policy {PolicyId}", policy.Id);
//              return;
//          }

//          // Create discrepancy records
//          var discrepancyRecords = new List<ReconciliationDiscrepancy> ();

//          foreach (var tankSummary in significantDiscrepancies) {
//              var discrepancyRecord = new ReconciliationDiscrepancy {
//                  PolicyExecutionId = policyExecution.Id,
//                  TankId = tankSummary.TankId,
//                  DetectedAt = DateTime.UtcNow,
//                  CurrentStock = tankSummary.ClosingLevel,
//                  ExpectedStock = tankSummary.CalculatedClosing,
//                  AbsoluteVariance = tankSummary.Variance,
//                  PercentageVariance = tankSummary.OpeningLevel > 0 ? (tankSummary.Variance / tankSummary.OpeningLevel) * 100 : 0,
//                  Severity = DetermineDiscrepancySeverity (tankSummary.Variance, discrepancyThreshold),
//                  IsResolved = false,
//                  AnalysisNotes = $"Daily reconciliation discrepancy detected on {tankSummary.ReconciliationDate:yyyy-MM-dd}. " +
//                  $"Opening: {tankSummary.OpeningLevel}L, Closing: {tankSummary.ClosingLevel}L, " +
//                  $"Expected: {tankSummary.CalculatedClosing}L, Variance: {tankSummary.Variance}L",
//                  BusinessImpactScore = CalculateBusinessImpact (tankSummary.Variance)
//              };

//              discrepancyRecords.Add (discrepancyRecord);
//          }

//          _context.ReconciliationDiscrepancies.AddRange (discrepancyRecords);
//          await _context.SaveChangesAsync (cancellationToken);

//          _logger.LogInformation ("Created {Count} discrepancy records from daily reconciliation for policy {PolicyId}",
//              discrepancyRecords.Count, policy.Id);
//      }

//      //Cursor - Determine target date for policy execution
//      private DateTime GetTargetDateForPolicy (ReconciliationPolicy policy) {
//          // For daily reconciliation, typically process previous day's data
//          var targetDate = DateTime.Today.AddDays (-1);

//          // Check if policy has specific configuration for target date
//          if (policy.Configuration != null && policy.Configuration.ContainsKey ("TargetDateOffset")) {
//              if (int.TryParse (policy.Configuration["TargetDateOffset"].ToString (), out var offset)) {
//                  targetDate = DateTime.Today.AddDays (offset);
//              }
//          }

//          return targetDate;
//      }

//      //Cursor - Extract site ID from policy scope configuration
//      private int? GetSiteIdFromPolicy (ReconciliationPolicy policy) {
//          if (policy.TankScope?.SiteIds?.Any () == true) {
//              return policy.TankScope.SiteIds.First (); // For daily reconciliation, process one site at a time
//          }

//          return null;
//      }

//      //Cursor - Extract tank ID from policy scope configuration
//      private int? GetTankIdFromPolicy (ReconciliationPolicy policy) {
//          if (policy.TankScope?.TankIds?.Any () == true) {
//              return policy.TankScope.TankIds.First (); // For daily reconciliation, process one tank at a time
//          }

//          return null;
//      }

//      //Cursor - Determine discrepancy severity based on variance
//      private DiscrepancySeverity DetermineDiscrepancySeverity (decimal variance, decimal threshold) {
//          var ratio = variance / threshold;

//          return ratio
//          switch { >=
//              5.0m => DiscrepancySeverity.Critical, >=
//                  3.0m => DiscrepancySeverity.High, >=
//                  2.0m => DiscrepancySeverity.Medium,
//                  _ => DiscrepancySeverity.Low
//          };
//      }

//      //Cursor - Calculate business impact score
//      private decimal CalculateBusinessImpact (decimal variance) {
//          // Simple business impact calculation
//          // Assume $1.50 per liter average fuel cost
//          return variance * 1.50m;
//      }

//      //Cursor - Check if policy is configured for daily reconciliation
//      public bool IsDailyReconciliationPolicy (ReconciliationPolicy policy) {
//          return policy.PolicyType?.ToLower () == "dailyreconciliation" ||
//              policy.Name?.ToLower ().Contains ("daily") == true ||
//              policy.Description?.ToLower ().Contains ("daily reconciliation") == true;
//      }

//      //Cursor - Create a default daily reconciliation policy
//      public async Task<ReconciliationPolicy> CreateDefaultDailyReconciliationPolicyAsync (
//          string name = "Daily Tank Reconciliation",
//          string description = "Automated daily tank reconciliation processing",
//          CancellationToken cancellationToken = default) {
//          var policy = new ReconciliationPolicy {
//          Name = name,
//          Description = description,
//          PolicyType = "DailyReconciliation",
//          ExecutionType = "Scheduled",
//          ScheduleFrequencyHours = 24, // Run daily
//          IsActive = true,
//          VarianceThresholdLiters = 5.0m,
//          VarianceThresholdPercentage = 2.0m,
//          AllowReprocessing = false,
//          CreatedAt = DateTime.UtcNow,
//          CreatedBy = "System",
//          Configuration = new Dictionary<string, object> {
//          ["TargetDateOffset"] = -1, // Process previous day
//          ["CreateDiscrepancyRecords"] = true,
//          ["AutoResolveSmallVariances"] = true,
//          ["SmallVarianceThreshold"] = 2.0m
//          }
//          };

//          _context.ReconciliationPolicies.Add (policy);
//          await _context.SaveChangesAsync (cancellationToken);

//          _logger.LogInformation ("Created default daily reconciliation policy with ID {PolicyId}", policy.Id);
//          return policy;
//      }
//  }