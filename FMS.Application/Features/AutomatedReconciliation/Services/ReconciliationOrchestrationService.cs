// using FMS.Domain.Entities;
// using FMS.Domain.Entities.enums;
// using FMS.Domain.Events;
// using FMS.Persistence;
// using FMS.Persistence.DataAccess;
// using MediatR;
// using Microsoft.Extensions.Logging;
// using Microsoft.EntityFrameworkCore;
// using System;
// using System.Collections.Generic;
// using System.Linq;
// using System.Threading;
// using System.Threading.Tasks;

// namespace FMS.Application.Features.AutomatedReconciliation.Services;

// //Cursor - ReconciliationOrchestrationService with enhanced discrepancy processing and event publishing
// public class ReconciliationOrchestrationService
// {
//     private readonly ILogger<ReconciliationOrchestrationService> _logger;
//     private readonly IMediator _mediator;
//     private readonly GpsdataContext _context;

//     public ReconciliationOrchestrationService(
//         ILogger<ReconciliationOrchestrationService> logger,
//         IMediator mediator,
//         GpsdataContext context)
//     {
//         _logger = logger;
//         _mediator = mediator;
//         _context = context;
//     }

//     //Cursor - Enhanced ProcessDiscrepancyAsync with proper error handling and resolution tracking
//     public async Task<ReconciliationResult> ProcessDiscrepancyAsync(ReconciliationDiscrepancy discrepancyRecord, ReconciliationPolicy policy, CancellationToken cancellationToken = default)
//     {
//         try
//         {
//             _logger.LogInformation("Processing discrepancy for Tank {TankId} with Policy {PolicyId}",
//                 discrepancyRecord.TankId, policy.Id);

//             // Attempt automated reconciliation
//             var reconciliationResult = await AttemptAutomatedReconciliation(discrepancyRecord, policy, cancellationToken);

//             //Cursor - Enhanced error handling and resolution tracking
//             if (!reconciliationResult.Success)
//             {
//                 // Mark discrepancy as unresolved with attempted resolution details
//                 discrepancyRecord.IsResolved = false;
//                 discrepancyRecord.ResolutionMethod = "Attempted - automated";
//                 discrepancyRecord.AnalysisNotes = reconciliationResult.ErrorMessage;

//                 _logger.LogWarning("Automated reconciliation failed for Tank {TankId}: {ErrorMessage}",
//                     discrepancyRecord.TankId, reconciliationResult.ErrorMessage);
//             }
//             else
//             {
//                 // Mark as successfully resolved
//                 discrepancyRecord.IsResolved = true;
//                 discrepancyRecord.ResolutionMethod = "Automated";
//                 discrepancyRecord.ResolvedAt = DateTime.UtcNow;
//                 discrepancyRecord.AnalysisNotes = reconciliationResult.ResolutionDetails;

//                 _logger.LogInformation("Successfully reconciled discrepancy for Tank {TankId}",
//                     discrepancyRecord.TankId);
//             }

//             // Update discrepancy record
//             _context.ReconciliationDiscrepancies.Update(discrepancyRecord);
//             await _context.SaveChangesAsync(cancellationToken);

//             return reconciliationResult;
//         }
//         catch (Exception ex)
//         {
//             _logger.LogError(ex, "Error processing discrepancy for Tank {TankId}", discrepancyRecord.TankId);

//             // Mark as failed attempt
//             discrepancyRecord.IsResolved = false;
//             discrepancyRecord.ResolutionMethod = "Failed - system error";
//             discrepancyRecord.AnalysisNotes = ex.Message;

//             _context.ReconciliationDiscrepancies.Update(discrepancyRecord);
//             await _context.SaveChangesAsync(cancellationToken);

//             throw;
//         }
//     }

//     //Cursor - Process multiple discrepancies and publish completion event
//     public async Task<List<ReconciliationResult>> ProcessAllDiscrepanciesAsync(
//         List<ReconciliationDiscrepancy> discrepancyRecords,
//         ReconciliationPolicy policy,
//         int executionId,
//         CancellationToken cancellationToken = default)
//     {
//         var results = new List<ReconciliationResult>();
//         var summary = new ReconciliationExecutionSummary
//         {
//             ExecutionId = executionId,
//             PolicyId = policy.Id,
//             TotalDiscrepancies = discrepancyRecords.Count,
//             StartedAt = DateTime.UtcNow
//         };

//         try
//         {
//             //Cursor - Process each discrepancy
//             foreach (var discrepancyRecord in discrepancyRecords)
//             {
//                 var result = await ProcessDiscrepancyAsync(discrepancyRecord, policy, cancellationToken);
//                 results.Add(result);

//                 // Update summary counters
//                 if (result.Success)
//                     summary.SuccessfulReconciliations++;
//                 else
//                     summary.FailedReconciliations++;
//             }

//             summary.CompletedAt = DateTime.UtcNow;
//             summary.Duration = summary.CompletedAt - summary.StartedAt;

//             //Cursor - Publish domain event after all discrepancies processed
//             var completionEvent = new ReconciliationExecutionCompletedEvent
//             {
//                 ExecutionId = executionId,
//                 PolicyId = policy.Id,
//                 Summary = summary,
//                 CompletedAt = DateTime.UtcNow,
//                 Results = results
//             };

//             await _mediator.Publish(completionEvent, cancellationToken);

//             _logger.LogInformation("Reconciliation execution {ExecutionId} completed. Success: {SuccessCount}, Failed: {FailedCount}",
//                 executionId, summary.SuccessfulReconciliations, summary.FailedReconciliations);

//             return results;
//         }
//         catch (Exception ex)
//         {
//             _logger.LogError(ex, "Error processing discrepancies for execution {ExecutionId}", executionId);
//             summary.CompletedAt = DateTime.UtcNow;
//             summary.ErrorMessage = ex.Message;

//             // Publish failure event
//             var failureEvent = new ReconciliationExecutionCompletedEvent
//             {
//                 ExecutionId = executionId,
//                 PolicyId = policy.Id,
//                 Summary = summary,
//                 CompletedAt = DateTime.UtcNow,
//                 HasErrors = true,
//                 Results = results
//             };

//             await _mediator.Publish(failureEvent, cancellationToken);
//             throw;
//         }
//     }

//     //Cursor - Complete implementation of automated reconciliation logic
//     private async Task<ReconciliationResult> AttemptAutomatedReconciliation(
//         ReconciliationDiscrepancy discrepancyRecord,
//         ReconciliationPolicy policy,
//         CancellationToken cancellationToken)
//     {
//         try
//         {
//             //Cursor - Get tank information
//             var tank = await _context.Tanks
//                 .Include(t => t.Site)
//                 .FirstOrDefaultAsync(t => t.Id == discrepancyRecord.TankId, cancellationToken);

//             if (tank == null)
//             {
//                 return new ReconciliationResult
//                 {
//                     Success = false,
//                     ErrorMessage = "Tank not found",
//                     ResolutionDetails = "Unable to locate tank for reconciliation"
//                 };
//             }

//             //Cursor - Get latest tank volume history
//             var latestVolumeHistory = await _context.TankVolumeHistories
//                 .Where(tvh => tvh.TankId == discrepancyRecord.TankId)
//                 .OrderByDescending(tvh => tvh.Timestamp)
//                 .FirstOrDefaultAsync(cancellationToken);

//             if (latestVolumeHistory == null)
//             {
//                 return new ReconciliationResult
//                 {
//                     Success = false,
//                     ErrorMessage = "No volume history found",
//                     ResolutionDetails = "Unable to find tank volume history for reconciliation"
//                 };
//             }

//             //Cursor - Determine reconciliation approach based on variance
//             var absoluteVariance = Math.Abs(discrepancyRecord.AbsoluteVariance);
//             var reconciliationApproach = DetermineReconciliationApproach(absoluteVariance, policy);

//             switch (reconciliationApproach)
//             {
//                 case ReconciliationApproach.AutomaticAdjustment:
//                     return await PerformAutomaticAdjustment(tank, discrepancyRecord, latestVolumeHistory, cancellationToken);

//                 case ReconciliationApproach.ManualReview:
//                     return new ReconciliationResult
//                     {
//                         Success = false,
//                         ErrorMessage = "Manual review required",
//                         ResolutionDetails = $"Variance of {absoluteVariance}L exceeds automatic adjustment threshold"
//                     };

//                 default:
//                     return new ReconciliationResult
//                     {
//                         Success = false,
//                         ErrorMessage = "Unknown reconciliation approach",
//                         ResolutionDetails = "Unable to determine appropriate reconciliation method"
//                     };
//             }
//         }
//         catch (Exception ex)
//         {
//             _logger.LogError(ex, "Error during automated reconciliation for discrepancy {DiscrepancyId}", discrepancyRecord.Id);
//             return new ReconciliationResult
//             {
//                 Success = false,
//                 ErrorMessage = ex.Message,
//                 ResolutionDetails = "System error during reconciliation attempt"
//             };
//         }
//     }

//     //Cursor - Determine the appropriate reconciliation approach
//     private ReconciliationApproach DetermineReconciliationApproach(decimal absoluteVariance, ReconciliationPolicy policy)
//     {
//         var autoAdjustmentThreshold = policy.VarianceThresholdLiters ?? policy.DiscrepancyThreshold ?? 5.0m; // Default 5L threshold

//         return absoluteVariance <= autoAdjustmentThreshold
//             ? ReconciliationApproach.AutomaticAdjustment
//             : ReconciliationApproach.ManualReview;
//     }

//     //Cursor - Perform automatic adjustment for small variances with corrected StockAdjustment properties
//     private async Task<ReconciliationResult> PerformAutomaticAdjustment( Tank tank, ReconciliationDiscrepancy discrepancyRecord,TankVolumeHistory latestVolumeHistory, CancellationToken cancellationToken)
//     {
//         try
//         {
//             var currentVolume = tank.CurrentStock ?? 0;
//             var adjustmentAmount = discrepancyRecord.AbsoluteVariance;
//             var newVolume = currentVolume + adjustmentAmount;

//             //Cursor - Create adjustment entry with correct StockAdjustment properties
//             var adjustment = new StockAdjustment
//             {
//                 TankId = tank.Id,
//                 SiteId = tank.SiteId,
//                 AdjustmentDate = DateTime.UtcNow,
//                 PreviousVolume = currentVolume,
//                 NewVolume = newVolume,
//                 VolumeChange = adjustmentAmount,
//                 AdjustmentType = adjustmentAmount > 0 ? 0 : 1, // 0=Increase, 1=Decrease
//                 ReasonCode = StockAdjustmentReasonEnum.SystemReconciliation,
//                 Reason = $"Automated reconciliation - Policy {discrepancyRecord.PolicyExecution.PolicyId}",
//                 Notes = $"Discrepancy ID: {discrepancyRecord.Id}, Variance: {discrepancyRecord.AbsoluteVariance}L",
//                 CreatedBy = "System",
//                 CreatedOn = DateTime.UtcNow,
//                 ApprovedBy = "System", //ToDo : make sure its system user
//                 ApprovedOn = DateTime.UtcNow,
//                 Status = 1 // Approved
//             };

//             _context.StockAdjustments.Add(adjustment);

//             //Cursor - Update tank current stock
//             tank.CurrentStock = newVolume;

//             //Cursor - Create reconciliation volume history entry
//             var reconciliationEntry = new TankVolumeHistory
//             {
//                 TankId = tank.Id,
//                 Timestamp = DateTime.UtcNow,
//                 NewVolume = newVolume,
//                 ChangeReason = VolumeChangeReasonEnum.AutomatedReconciliation,
//                 ReferenceType = "Automated Reconciliation System",
//                 ReferenceId = discrepancyRecord.Id, // Link to the discrepancy record
//                 RecordedBy = "System", //Todo use System userId

//             };

//             _context.TankVolumeHistories.Add(reconciliationEntry);
//             await _context.SaveChangesAsync(cancellationToken);

//             // Link the adjustment to the volume history record
//             adjustment.TankVolumeHistoryId = reconciliationEntry.Id;
//             await _context.SaveChangesAsync(cancellationToken);

//             return new ReconciliationResult
//             {
//                 Success = true,
//                 ResolutionDetails = $"Automatic adjustment of {adjustmentAmount}L applied (from {currentVolume}L to {newVolume}L)",
//                 AdjustmentAmount = adjustmentAmount,
//                 AdjustmentType = "Automated Reconciliation"
//             };
//         }
//         catch (Exception ex)
//         {
//             _logger.LogError(ex, "Error performing automatic adjustment for tank {TankId}", tank.Id);
//             return new ReconciliationResult
//             {
//                 Success = false,
//                 ErrorMessage = ex.Message,
//                 ResolutionDetails = "Failed to apply automatic adjustment"
//             };
//         }
//     }
// }

// //Cursor - Enumeration for reconciliation approaches
// public enum ReconciliationApproach
// {
//     AutomaticAdjustment,
//     ManualReview,
//     NoAction
// }