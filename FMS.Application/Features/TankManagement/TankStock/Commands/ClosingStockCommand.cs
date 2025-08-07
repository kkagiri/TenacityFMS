using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Application.Common;
using FMS.Application.Common.Constants;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.Services;
using FMS.Application.ModelsDTOs.FMS.TankStock;
using FMS.Application.Services.AutomatedReconciliation;
using FMS.Application.Services.TankStock;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.TankStockCommand {
    public record ClosingStockCommand (int TankId, decimal ClosingStock, string RecordedBy, DateTime? EntryDate = null) : IRequest<FMSResponseMessage>;

    public class ClosingStockCommandHandler : IRequestHandler<ClosingStockCommand, FMSResponseMessage> {
        private readonly GpsdataContext _context;
        private readonly ILogger<ClosingStockCommandHandler> _logger;
        private readonly IMediator _mediator;
        //Cursor - Added TankVolumeHistoryIntegrationService dependency
        private readonly TankVolumeHistoryIntegrationService _tankVolumeHistoryService;
        private readonly TankStockFutureRecordsService _futureRecordsService;
        private readonly DiscrepancyDetectionService _discrepancyDetectionService;
        private readonly INotificationService _notificationService;

        public ClosingStockCommandHandler (GpsdataContext context, ILogger<ClosingStockCommandHandler> logger, IMediator mediator, TankVolumeHistoryIntegrationService tankVolumeHistoryService, TankStockFutureRecordsService futureRecordsService, DiscrepancyDetectionService discrepancyDetectionService, INotificationService notificationService) {
            _context = context;
            _logger = logger;
            _mediator = mediator;
            _tankVolumeHistoryService = tankVolumeHistoryService;
            _futureRecordsService = futureRecordsService;
            _discrepancyDetectionService = discrepancyDetectionService;
            _notificationService = notificationService;
        }

        public async Task<FMSResponseMessage> Handle (ClosingStockCommand request, CancellationToken cancellationToken) {

            try {
                var entryDate = request.EntryDate ?? DateTime.Now.Date;

                var tank = await _context.Tanks.FindAsync (request.TankId, cancellationToken);
                if (tank == null) return new FMSResponseMessage (false, $"TankID {request.TankId} not found ");

                // Validate historical entry against future records policy
                if (entryDate.Date < DateTime.Now.Date) {
                    var futureRecordsValidation = await _futureRecordsService.ValidateHistoricalEntryAsync (
                        request.TankId, entryDate, VolumeChangeReasonEnum.ClosingStock, cancellationToken);

                    if (!futureRecordsValidation.IsAllowed) {
                        return new FMSResponseMessage (false, futureRecordsValidation.Message);
                    }

                    // Log warning for future reference
                    if (futureRecordsValidation.RequiresUserConfirmation) {
                        _logger.LogWarning ("Historical closing stock entry with future records: Tank {TankId}, Date {EntryDate}, Policy {Policy}, Future Records {Count}",
                            request.TankId, entryDate, futureRecordsValidation.Policy, futureRecordsValidation.FutureRecordsCount);
                    }
                }

                var existingClosingStock = await _context.TankVolumeHistories
                    .Where (x => x.TankId == request.TankId &&
                        x.Timestamp.Date == entryDate &&
                        x.ChangeReason == VolumeChangeReasonEnum.ClosingStock)
                    .SingleOrDefaultAsync (cancellationToken);

                if (existingClosingStock != null) return new FMSResponseMessage (false, "A closing stock entry already exists for today. You cannot create multiple closing stocks for the same day.");

                var openingStock = await _context.TankVolumeHistories.Where (x => x.TankId == request.TankId &&
                        x.Timestamp.Date == entryDate.Date && x.ChangeReason == VolumeChangeReasonEnum.OpeningStock)
                    .SingleOrDefaultAsync (cancellationToken);

                if (openingStock == null) return new FMSResponseMessage (false, $"Cannot record closing stock for this date if no Opening stock not found for TankID {request.TankId} is not Found");

                // Get all transactions for the day
                var transactions = await _context.TankVolumeHistories
                    .Where (tvh => tvh.TankId == request.TankId && tvh.Timestamp.Date == DateTime.Now.Date)
                    .ToListAsync ();

                var totalRefills = transactions.Where (t => t.ChangeReason == VolumeChangeReasonEnum.Dispensing).Sum (t => t.VolumeChange);
                var totalDeliveries = transactions.Where (t => t.ChangeReason == VolumeChangeReasonEnum.Delivery).Sum (t => t.VolumeChange);
                var totalTransfersIn = transactions.Where (t => t.ChangeReason == VolumeChangeReasonEnum.TransferIn).Sum (t => t.VolumeChange);
                var totalTransfersOut = transactions.Where (t => t.ChangeReason == VolumeChangeReasonEnum.TransferOut).Sum (t => t.VolumeChange);

                var newClosingStock = new Tankstock {
                    TankId = request.TankId,
                    EntryDate = entryDate,
                    EntryType = VolumeChangeReasonEnum.ClosingStock,
                    ManualClosingLevel = request.ClosingStock,
                    RecordedBy = request.RecordedBy,
                    SiteId = tank.SiteId
                };

                _context.Tankstocks.Add (newClosingStock);

                if (entryDate.Date == DateTime.Now.Date) {

                    if (tank.UseBookKeeping == 1) {
                        tank.CurrentStock = request.ClosingStock;
                        tank.LastStockUpdate = DateTime.Now;
                    }
                }

                //Cursor: Update physical stock value and timestamp
                tank.PhysicalStockValue = request.ClosingStock;
                tank.LastPhysicalStockUpdate = entryDate;
                tank.PhysicalStockSource = "Manual";

                await _context.SaveChangesAsync (cancellationToken);

                //Cursor - Calculate volume change for closing stock from the corresponding opening stock
                decimal volumeChange;
                if (openingStock != null && openingStock.NewVolume.HasValue) {
                    // Calculate from corresponding opening stock
                    volumeChange = request.ClosingStock - openingStock.NewVolume.Value;
                } else {
                    // Fallback to current tank stock (should not happen due to validation above)
                    var previousStock = tank.CurrentStock ?? 0;
                    volumeChange = request.ClosingStock - previousStock;
                }

                //Cursor - Replaced manual TankVolumeHistory creation with TankVolumeHistoryIntegrationService
                var volumeUpdateResult = await _tankVolumeHistoryService.ProcessTankStockChangeAsync (
                    tankId: request.TankId,
                    timestamp: entryDate,
                    volumeChange: volumeChange,
                    stockId: newClosingStock.EntryId,
                    isOpening: false, // This is a closing stock
                    actionType : ActionType.Create, // This is a new closing stock
                    recordedBy : request.RecordedBy,
                    cancellationToken : cancellationToken);

                if (!volumeUpdateResult.Success) {
                    _logger.LogWarning ("Failed to update tank volume history: {Message}", volumeUpdateResult.Message);
                    // We continue even if volume history update fails, but log the error
                }

                // Perform reconciliation analysis after successful closing stock entry
                var reconciliationResult = await PerformReconciliationAnalysis (
                    openingStock.NewVolume ?? 0,
                    request.ClosingStock,
                    totalDeliveries ?? 0,
                    totalRefills ?? 0,
                    totalTransfersIn ?? 0,
                    totalTransfersOut ?? 0,
                    request.TankId,
                    entryDate,
                    cancellationToken);

                // Perform additional sensor vs manual variance analysis
                await PerformSensorVarianceAnalysis (
                    request.TankId,
                    request.ClosingStock,
                    entryDate,
                    request.RecordedBy,
                    cancellationToken);

                // Log reconciliation results
                if (reconciliationResult.IsSignificantVariance) {
                    _logger.LogWarning ("Significant variance detected in closing stock for Tank {TankId}: {Variance}L ({VariancePercentage}%)",
                        request.TankId, reconciliationResult.Variance, reconciliationResult.VariancePercentage);
                }

                return new FMSResponseMessage (true, "Closing stock created successfully");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error while creating closing stock");
                return new FMSResponseMessage (false, "Error while creating closing stock");
            }

        }

        public async Task<StockReconciliationResult> PerformReconciliationAnalysis (
            decimal openingStock,
            decimal closingStock,
            decimal totalDeliveries,
            decimal totalRefills,
            decimal totalTransfersIn,
            decimal totalTransfersOut,
            int tankId,
            DateTime entryDate,
            CancellationToken cancellationToken = default) {
            decimal expectedClosingStock = openingStock + totalDeliveries + totalTransfersIn + totalRefills + totalTransfersOut;
            decimal actualClosingStock = closingStock;
            decimal variance = actualClosingStock - expectedClosingStock;
            decimal variancePercentage = expectedClosingStock > 0 ? variance / expectedClosingStock * 100 : 0;

            // Determine variance type
            string varianceType = variance > 0 ? "GAIN" : variance < 0 ? "LOSS" : "BALANCED";

            // Define significance thresholds (these could be configurable)
            decimal significanceThresholdLiters = 50; // 50 liters threshold
            decimal significanceThresholdPercentage = 5; // 5% threshold

            bool isSignificantVariance = Math.Abs (variance) >= significanceThresholdLiters ||
                Math.Abs (variancePercentage) >= significanceThresholdPercentage;

            bool requiresInvestigation = Math.Abs (variance) >= 100 || // 100 liters threshold for investigation
                Math.Abs (variancePercentage) >= 10; // 10% threshold for investigation

            var result = new StockReconciliationResult {
                TankId = tankId,
                Date = entryDate,
                OpeningStock = openingStock,
                ExpectedClosingStock = expectedClosingStock,
                ActualClosingStock = actualClosingStock,
                Variance = variance,
                VariancePercentage = variancePercentage,
                TotalDeliveries = totalDeliveries,
                TotalDispensing = totalRefills, // Note: Refills are negative dispensing
                TotalTransfersIn = totalTransfersIn,
                TotalTransfersOut = totalTransfersOut,
                VarianceType = varianceType,
                IsSignificantVariance = isSignificantVariance,
                RequiresInvestigation = requiresInvestigation
            };

            // If significant variance detected, create a ReconciliationDiscrepancy record
            if (isSignificantVariance) {
                try {
                    var tank = await _context.Tanks.FindAsync (tankId, cancellationToken);
                    if (tank != null) {
                        // Determine severity based on variance magnitude
                        DiscrepancySeverity severity = DetermineSeverity (variance, variancePercentage);

                        var discrepancy = new ReconciliationDiscrepancy {
                            PolicyExecutionId = 0, // Since this is not policy-driven, set to 0 or create a default policy execution
                            TankId = tankId,
                            DetectedAt = DateTime.UtcNow,
                            CurrentStock = actualClosingStock,
                            ExpectedStock = expectedClosingStock,
                            AbsoluteVariance = variance,
                            PercentageVariance = variancePercentage,
                            Severity = severity,
                            IsResolved = false,
                            AnalysisNotes = $"Daily closing stock reconciliation variance detected. Type: {varianceType} , Total Deliveries: {totalDeliveries}, Total Refills: {totalRefills}, Total Transfers In: {totalTransfersIn}, Total Transfers Out: {totalTransfersOut} , Opening Stock: {openingStock}",
                            BusinessImpactScore = CalculateBusinessImpact (variance, tank)
                        };

                        _context.ReconciliationDiscrepancies.Add (discrepancy);
                        await _context.SaveChangesAsync (cancellationToken);

                        _logger.LogInformation ("ReconciliationDiscrepancy record created for Tank {TankId}: {Variance}L ({VariancePercentage}%)",
                            tankId, variance, variancePercentage);

                        // Send notification for discrepancy detection
                        await SendDiscrepancyNotificationAsync (tank, variance, variancePercentage, varianceType, severity, cancellationToken);
                    }
                } catch (Exception ex) {
                    _logger.LogError (ex, "Failed to create ReconciliationDiscrepancy record for Tank {TankId}", tankId);
                    // Don't throw - reconciliation analysis failure shouldn't prevent closing stock creation
                }
            }

            // Create or update Dailytankreconciliation record for backward compatibility and historical tracking
            try {
                var existingDailyRecon = await _context.Dailytankreconciliations
                    .Where (dtr => dtr.TankId == tankId && dtr.ReconciliationDate.Date == entryDate.Date)
                    .FirstOrDefaultAsync (cancellationToken);

                if (existingDailyRecon != null) {
                    // Update existing record
                    existingDailyRecon.ClosingLevel = actualClosingStock;
                    existingDailyRecon.TotalDeliveries = totalDeliveries;
                    existingDailyRecon.TotalRefills = totalRefills;
                    existingDailyRecon.TotalTransfersIn = totalTransfersIn;
                    existingDailyRecon.TotalTransfersOut = totalTransfersOut;

                    _logger.LogInformation ("Updated existing Dailytankreconciliation record for Tank {TankId}, Date {Date}",
                        tankId, entryDate.Date);
                } else {
                    // Create new record
                    var dailyRecon = new Dailytankreconciliation {
                        TankId = tankId,
                        ReconciliationDate = entryDate.Date,
                        OpeningLevel = openingStock,
                        ClosingLevel = actualClosingStock,
                        TotalDeliveries = totalDeliveries,
                        TotalRefills = totalRefills,
                        TotalTransfersIn = totalTransfersIn,
                        TotalTransfersOut = totalTransfersOut,
                        CreatedOn = DateTime.UtcNow
                    };

                    _context.Dailytankreconciliations.Add (dailyRecon);

                    _logger.LogInformation ("Created new Dailytankreconciliation record for Tank {TankId}, Date {Date}",
                        tankId, entryDate.Date);
                }

                await _context.SaveChangesAsync (cancellationToken);
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to create/update Dailytankreconciliation record for Tank {TankId}", tankId);
                // Don't throw - daily reconciliation record failure shouldn't prevent closing stock creation
            }

            return result;
        }

        private DiscrepancySeverity DetermineSeverity (decimal varianceLiters, decimal variancePercentage) {
            decimal absVarianceLiters = Math.Abs (varianceLiters);
            decimal absVariancePercentage = Math.Abs (variancePercentage);

            if (absVarianceLiters > 100 || absVariancePercentage > 10) {
                return DiscrepancySeverity.High;
            }

            if (absVarianceLiters > 50 || absVariancePercentage > 5) {
                return DiscrepancySeverity.Medium;
            }

            return DiscrepancySeverity.Low;
        }

        private decimal CalculateBusinessImpact (decimal varianceLiters, Tank tank) {
            decimal absVariance = Math.Abs (varianceLiters);

            // Base impact score (0-100 scale)
            decimal impactScore = Math.Min (absVariance / 10, 100); // 10 liters = 1 point, max 100

            // Adjust based on tank capacity if available
            if (tank.TankVolume > 0) {
                decimal percentageOfCapacity = absVariance / tank.TankVolume * 100;
                impactScore = Math.Max (impactScore, percentageOfCapacity * 2); // Weight capacity percentage higher
            }

            return Math.Round (impactScore, 2);
        }

        /// <summary>
        /// Sends notification when a discrepancy is detected during closing stock reconciliation
        /// </summary>
        private async Task SendDiscrepancyNotificationAsync (Tank tank, decimal variance, decimal variancePercentage,
            string varianceType, DiscrepancySeverity severity, CancellationToken cancellationToken) {
            try {
                // Determine notification priority based on severity
                string priority = severity
                switch {
                    DiscrepancySeverity.High => "High",
                    DiscrepancySeverity.Medium => "Medium",
                    DiscrepancySeverity.Low => "Low",
                    _ => "Medium"
                };

                // Create notification request
                var notificationRequest = new CreateNotificationRequest {
                    Type = "Alert",
                    Category = "Tank",
                    Priority = priority,
                    Title = "Closing Stock Discrepancy Detected",
                    Message = $"Tank {tank.Name} closing stock discrepancy: {variance:F2}L ({variancePercentage:F1}%) - {varianceType}",
                    TriggerSource = "ClosingStock",
                    TriggeredBy = SystemConstants.Defaults.SystemTriggeredBy,
                    SiteId = tank.SiteId,
                    TankId = tank.Id

                };

                // Add additional delivery methods for high severity
                if (severity == DiscrepancySeverity.High) {
                    notificationRequest.Recipients.Add (new CreateNotificationRecipientRequest {
                        UserId = "site-manager",
                            DeliveryMethods = new List<string> { "System", "Email", "SMS" }
                    });
                }

                await _notificationService.CreateNotificationAsync (notificationRequest, cancellationToken);

                _logger.LogInformation ("Discrepancy notification sent for Tank {TankId}: {Severity} severity, {Variance}L variance",
                    tank.Id, severity, variance);

            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to send discrepancy notification for Tank {TankId}", tank.Id);
                // Don't throw - notification failure shouldn't prevent closing stock creation
            }
        }

        /// <summary>
        /// Performs sensor vs manual variance analysis for closing stock entries
        /// Compares manual closing stock entry with recent sensor readings
        /// </summary>
        private async Task PerformSensorVarianceAnalysis (
            int tankId,
            decimal manualClosingStock,
            DateTime entryDate,
            string recordedBy,
            CancellationToken cancellationToken) {
            try {
                var tank = await _context.Tanks.FindAsync (tankId, cancellationToken);
                if (tank?.PtsId == null) {
                    return; // No sensor available for this tank
                }

                // Get the most recent sensor reading (within last 24 hours)
                var cutoffTime = entryDate.AddHours (-24);
                var latestSensorReading = await _context.Tankmeasurements
                    .Where (tm => tm.Ptsid == tank.PtsId && tm.DateTime >= cutoffTime)
                    .OrderByDescending (tm => tm.DateTime)
                    .FirstOrDefaultAsync (cancellationToken);

                if (latestSensorReading?.ProductVolume.HasValue != true) {
                    _logger.LogInformation ("No recent sensor data available for Tank {TankId} for sensor variance analysis", tankId);
                    return;
                }

                var sensorVolume = (decimal) latestSensorReading.ProductVolume.Value;
                var variance = manualClosingStock - sensorVolume;
                var absVariance = Math.Abs (variance);
                var variancePercentage = sensorVolume > 0 ? (absVariance / sensorVolume) * 100 : 0;

                // Define thresholds for sensor vs manual variance
                var varianceThresholdLiters = 5.0m; // 5 liters
                var varianceThresholdPercentage = 2.0m; // 2%

                var isSignificantVariance = absVariance > varianceThresholdLiters ||
                    variancePercentage > varianceThresholdPercentage;

                if (isSignificantVariance) {
                    // Create discrepancy record for sensor vs manual variance
                    var severity = DetermineSensorVarianceSeverity (absVariance, variancePercentage);

                    var discrepancy = new ReconciliationDiscrepancy {
                        PolicyExecutionId = 0, // Manual entry discrepancy
                        TankId = tankId,
                        DetectedAt = DateTime.UtcNow,
                        CurrentStock = manualClosingStock,
                        ExpectedStock = sensorVolume,
                        AbsoluteVariance = variance,
                        PercentageVariance = variancePercentage,
                        Severity = severity,
                        IsResolved = false,
                        AnalysisNotes = $"Sensor vs Manual Closing Stock variance detected. Manual Entry: {manualClosingStock}L, " +
                        $"Sensor Reading: {sensorVolume}L (from {latestSensorReading.DateTime:yyyy-MM-dd HH:mm:ss}), " +
                        $"Recorded By: {recordedBy}, Entry Date: {entryDate:yyyy-MM-dd}",
                        BusinessImpactScore = CalculateBusinessImpact (absVariance, tank)
                    };

                    _context.ReconciliationDiscrepancies.Add (discrepancy);
                    await _context.SaveChangesAsync (cancellationToken);

                    _logger.LogWarning ("Sensor vs Manual variance detected for Tank {TankId}: Manual {Manual}L vs Sensor {Sensor}L, Variance: {Variance}L ({VariancePercentage:F2}%)",
                        tankId, manualClosingStock, sensorVolume, variance, variancePercentage);

                    // Send notification for sensor variance
                    await SendSensorVarianceNotificationAsync (
                        tank, manualClosingStock, sensorVolume, variance, variancePercentage,
                        latestSensorReading.DateTime, recordedBy, severity, cancellationToken);
                } else {
                    _logger.LogInformation ("Sensor vs Manual variance within acceptable limits for Tank {TankId}: {Variance}L ({VariancePercentage:F2}%)",
                        tankId, variance, variancePercentage);
                }

            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to perform sensor variance analysis for Tank {TankId}", tankId);
                // Don't throw - sensor variance analysis failure shouldn't prevent closing stock creation
            }
        }

        /// <summary>
        /// Determines severity for sensor vs manual variance
        /// </summary>
        private DiscrepancySeverity DetermineSensorVarianceSeverity (decimal absVarianceLiters, decimal variancePercentage) {
            // Higher thresholds for sensor variance as sensors may have calibration differences
            return (absVarianceLiters, variancePercentage) switch {
                ( >= 20.0m, _) or (_, >= 10.0m) => DiscrepancySeverity.Critical,
                    ( >= 10.0m, _) or (_, >= 5.0m) => DiscrepancySeverity.High,
                    ( >= 5.0m, _) or (_, >= 2.0m) => DiscrepancySeverity.Medium,
                    _ => DiscrepancySeverity.Low
            };
        }

        /// <summary>
        /// Sends notification for sensor vs manual variance
        /// </summary>
        private async Task SendSensorVarianceNotificationAsync (
            Tank tank,
            decimal manualVolume,
            decimal sensorVolume,
            decimal variance,
            decimal variancePercentage,
            DateTime sensorTimestamp,
            string recordedBy,
            DiscrepancySeverity severity,
            CancellationToken cancellationToken) {
            try {
                var priorityLevel = severity
                switch {
                    DiscrepancySeverity.Critical => "High",
                    DiscrepancySeverity.High => "Medium",
                    _ => "Low"
                };

                var notificationRequest = new CreateNotificationRequest {
                    Type = "Alert",
                        Category = "SensorVariance",
                        Priority = priorityLevel,
                        Title = $"Sensor vs Manual Closing Stock Variance - Tank {tank.Name}",
                        Message = $"Significant variance detected between manual closing stock entry and sensor reading for Tank {tank.Name}. " +
                        $"Manual Entry: {manualVolume}L, Sensor Reading: {sensorVolume}L (from {sensorTimestamp:yyyy-MM-dd HH:mm:ss}), " +
                        $"Variance: {variance:+0.00;-0.00;0}L ({variancePercentage:F2}%), Severity: {severity}, Recorded By: {recordedBy}",
                        TriggerSource = "ClosingStockSensorVariance",
                        TriggeredBy = recordedBy

                };

                await _notificationService.CreateNotificationAsync (notificationRequest, cancellationToken);

                _logger.LogInformation ("Sensor variance notification sent for Tank {TankId}: {Severity} severity, Manual {Manual}L vs Sensor {Sensor}L",
                    tank.Id, severity, manualVolume, sensorVolume);

            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to send sensor variance notification for Tank {TankId}", tank.Id);
                // Don't throw - notification failure shouldn't prevent closing stock creation
            }
        }

        public class StockReconciliationResult {
            public int TankId { get; set; }
            public DateTime Date { get; set; }
            public decimal OpeningStock { get; set; }
            public decimal ExpectedClosingStock { get; set; }
            public decimal ActualClosingStock { get; set; }
            public decimal Variance { get; set; }
            public decimal VariancePercentage { get; set; }

            public decimal TotalDeliveries { get; set; }
            public decimal TotalDispensing { get; set; }
            public decimal TotalTransfersIn { get; set; }
            public decimal TotalTransfersOut { get; set; }

            public string VarianceType { get; set; } = string.Empty; // GAIN, LOSS, BALANCED
            public bool IsSignificantVariance { get; set; }
            public bool RequiresInvestigation { get; set; }
        }

    }
}