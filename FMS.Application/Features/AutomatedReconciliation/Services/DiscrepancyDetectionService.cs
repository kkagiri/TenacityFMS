// using System;
// using System.Linq;
// using System.Threading;
// using System.Threading.Tasks;
// using FMS.Domain.Entities;
// using FMS.Domain.Events;
// using FMS.Persistence.DataAccess;
// using MediatR;
// using Microsoft.EntityFrameworkCore;
// using Microsoft.Extensions.Logging;

// namespace FMS.Application.Services.AutomatedReconciliation;

// //Cursor - DiscrepancyDetectionService with configurable thresholds and event publishing
// public class DiscrepancyDetectionService {
//     //Cursor - Configurable constants moved to private readonly fields
//     private readonly decimal _defaultVarianceThresholdLiters = 1.0m;
//     private readonly decimal _defaultVarianceThresholdPercentage = 1.0m;

//     private readonly ILogger<DiscrepancyDetectionService> _logger;
//     private readonly IMediator _mediator;
//     private readonly GpsdataContext _context;

//     public DiscrepancyDetectionService (
//         ILogger<DiscrepancyDetectionService> logger,
//         IMediator mediator,
//         GpsdataContext context) {
//         _logger = logger;
//         _mediator = mediator;
//         _context = context;
//     }

//     //Cursor - Enhanced discrepancy detection with configurable thresholds
//     public async Task<DiscrepancyDetectionResult> DetectDiscrepancies (
//         Tank tank,
//         ReconciliationPolicy policy,
//         CancellationToken cancellationToken = default) {
//         try {
//             // Use policy thresholds or default values
//             var varianceThresholdLiters = policy.VarianceThresholdLiters ?? policy.DiscrepancyThreshold ?? _defaultVarianceThresholdLiters;
//             var varianceThresholdPercentage = policy.VarianceThresholdPercentage ?? policy.DiscrepancyPercentageThreshold ?? _defaultVarianceThresholdPercentage;

//             // Perform discrepancy calculation
//             var discrepancyResult = await CalculateDiscrepancy (tank, varianceThresholdLiters, varianceThresholdPercentage, cancellationToken);

//             //Cursor - Generate and push domain event when variance is significant
//             if (discrepancyResult.IsSignificant) {
//                 var discrepancyEvent = new DiscrepancyDetectedEvent {
//                     TankId = tank.Id,
//                     PolicyId = policy.Id,
//                     VarianceLiters = discrepancyResult.VarianceLiters,
//                     VariancePercentage = discrepancyResult.VariancePercentage,
//                     DetectedAt = DateTime.UtcNow,
//                     Severity = DetermineDiscrepancySeverity (discrepancyResult),
//                     ExpectedVolume = discrepancyResult.ExpectedVolume,
//                     ActualVolume = discrepancyResult.ActualVolume
//                 };

//                 // Publish domain event for downstream alerting
//                 await _mediator.Publish (discrepancyEvent, cancellationToken);

//                 _logger.LogWarning ("Significant discrepancy detected for Tank {TankId}. Variance: {VarianceLiters}L ({VariancePercentage}%)",
//                     tank.Id, discrepancyResult.VarianceLiters, discrepancyResult.VariancePercentage);
//             }

//             return discrepancyResult;
//         } catch (Exception ex) {
//             _logger.LogError (ex, "Error detecting discrepancies for tank {TankId}", tank.Id);
//             throw;
//         }
//     }

//     //Cursor - Create ReconciliationDiscrepancy entity from detection result
//     public ReconciliationDiscrepancy CreateDiscrepancyRecord (
//         DiscrepancyDetectionResult detectionResult,
//         int policyExecutionId,
//         ReconciliationPolicy policy) {
//         return new ReconciliationDiscrepancy {
//             PolicyExecutionId = policyExecutionId,
//                 TankId = detectionResult.TankId,
//                 DetectedAt = DateTime.UtcNow,
//                 CurrentStock = detectionResult.ActualVolume,
//                 ExpectedStock = detectionResult.ExpectedVolume,
//                 AbsoluteVariance = detectionResult.VarianceLiters,
//                 PercentageVariance = detectionResult.VariancePercentage,
//                 Severity = DetermineDiscrepancySeverity (detectionResult),
//                 IsResolved = false,
//                 AnalysisNotes = $"Detected by policy {policy.Name}",
//                 BusinessImpactScore = CalculateBusinessImpact (detectionResult)
//         };
//     }

//     //Cursor - Complete implementation of discrepancy calculation logic
//     private async Task<DiscrepancyDetectionResult> CalculateDiscrepancy (
//         Tank tank,
//         decimal varianceThresholdLiters,
//         decimal varianceThresholdPercentage,
//         CancellationToken cancellationToken) {

//         //Cursor - Get latest tank volume reading
//         var latestVolumeHistory = await _context.TankVolumeHistories
//             .Where (tvh => tvh.TankId == tank.Id)
//             .OrderByDescending (tvh => tvh.Timestamp)
//             .FirstOrDefaultAsync (cancellationToken);

//         if (latestVolumeHistory == null) {
//             return new DiscrepancyDetectionResult {
//             TankId = tank.Id,
//             ExpectedVolume = 0,
//             ActualVolume = 0,
//             VarianceLiters = 0,
//             VariancePercentage = 0,
//             IsSignificant = false,
//             ThresholdLiters = varianceThresholdLiters,
//             ThresholdPercentage = varianceThresholdPercentage
//             };
//         }

//         var actualVolume = latestVolumeHistory.NewVolume;

//         //Cursor - Calculate expected volume based on recent transactions
//         var expectedVolume = await CalculateExpectedVolume (tank, cancellationToken);

//         //Cursor - Calculate variance
//         var varianceLiters = Math.Abs (expectedVolume - actualVolume);
//         var variancePercentage = expectedVolume > 0 ? (varianceLiters / expectedVolume) * 100 : 0;

//         //Cursor - Determine if variance is significant
//         var isSignificant = varianceLiters > varianceThresholdLiters ||
//             variancePercentage > varianceThresholdPercentage;

//         return new DiscrepancyDetectionResult {
//             TankId = tank.Id,
//                 ExpectedVolume = expectedVolume,
//                 ActualVolume = actualVolume,
//                 VarianceLiters = varianceLiters,
//                 VariancePercentage = variancePercentage,
//                 IsSignificant = isSignificant,
//                 ThresholdLiters = varianceThresholdLiters,
//                 ThresholdPercentage = varianceThresholdPercentage
//         };
//     }

//     //Cursor - Calculate expected volume based on deliveries, consumption, and transfers
//     private async Task<decimal> CalculateExpectedVolume (Tank tank, CancellationToken cancellationToken) {
//         var cutoffTime = DateTime.UtcNow.AddHours (-24); // Look at last 24 hours

//         //Cursor - Get starting volume from 24 hours ago
//         var startingVolumeHistory = await _context.TankVolumeHistories
//             .Where (tvh => tvh.TankId == tank.Id && tvh.Timestamp >= cutoffTime)
//             .OrderBy (tvh => tvh.Timestamp)
//             .FirstOrDefaultAsync (cancellationToken);

//         var startingVolume = startingVolumeHistory?.CurrentVolume ?? tank.CurrentStock ?? 0;

//         //Cursor - Get deliveries in the period
//         var deliveries = await _context.Deliveries
//             .Where (d => d.TankId == tank.Id && d.DeliveryDate >= cutoffTime)
//             .SumAsync (d => d.DeliveredQuantity ?? 0, cancellationToken);

//         //Cursor - Get fuel consumption (pump transactions)
//         var consumption = await _context.Pumptransactions
//             .Where (pt => pt.TankId == tank.Id && pt.TransactionDate >= cutoffTime)
//             .SumAsync (pt => pt.FuelQuantity ?? 0, cancellationToken);

//         //Cursor - Get tank transfers (in and out)
//         var transfersIn = await _context.TankTransfers
//             .Where (tt => tt.ToTankId == tank.Id && tt.TransferDate >= cutoffTime)
//             .SumAsync (tt => tt.TransferQuantity, cancellationToken);

//         var transfersOut = await _context.TankTransfers
//             .Where (tt => tt.FromTankId == tank.Id && tt.TransferDate >= cutoffTime)
//             .SumAsync (tt => tt.TransferQuantity, cancellationToken);

//         //Cursor - Calculate expected volume
//         var expectedVolume = startingVolume + deliveries - consumption + transfersIn - transfersOut;

//         return Math.Max (0, expectedVolume); // Ensure non-negative
//     }

//     //Cursor - Determine discrepancy severity based on variance levels
//     private FMS.Domain.Entities.enums.DiscrepancySeverity DetermineDiscrepancySeverity (DiscrepancyDetectionResult result) {
//         var varianceRatio = Math.Max (
//             result.VarianceLiters / result.ThresholdLiters,
//             result.VariancePercentage / result.ThresholdPercentage
//         );

//         return varianceRatio
//         switch { >=
//             5.0m => FMS.Domain.Entities.enums.DiscrepancySeverity.Critical, >=
//                 3.0m => FMS.Domain.Entities.enums.DiscrepancySeverity.High, >=
//                 2.0m => FMS.Domain.Entities.enums.DiscrepancySeverity.Medium,
//                 _ => FMS.Domain.Entities.enums.DiscrepancySeverity.Low
//         };
//     }

//     //Cursor - Calculate business impact score
//     private decimal CalculateBusinessImpact (DiscrepancyDetectionResult result) {
//         // Simple business impact calculation based on variance amount and percentage
//         var volumeImpact = result.VarianceLiters * 0.1m; // Assume $0.10 per liter impact
//         var percentageMultiplier = result.VariancePercentage / 100m;

//         return volumeImpact * (1 + percentageMultiplier);
//     }
// }

// //Cursor - Result class for discrepancy detection
// public class DiscrepancyDetectionResult {
//     public int TankId { get; set; }
//     public decimal ExpectedVolume { get; set; }
//     public decimal ActualVolume { get; set; }
//     public decimal VarianceLiters { get; set; }
//     public decimal VariancePercentage { get; set; }
//     public bool IsSignificant { get; set; }
//     public decimal ThresholdLiters { get; set; }
//     public decimal ThresholdPercentage { get; set; }
// }