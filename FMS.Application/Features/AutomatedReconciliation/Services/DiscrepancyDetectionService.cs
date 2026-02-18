using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.EventEngine.Engine;
using FMS.Application.Features.EventEngine.Events;
using FMS.Application.Features.TankManagement.Services;
using FMS.Domain.Entities;
using FMS.Domain.Events;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Services.AutomatedReconciliation;

//Cursor - DiscrepancyDetectionService with configurable thresholds and event publishing
public class DiscrepancyDetectionService
{
    //Cursor - Configurable constants moved to private readonly fields
    private readonly decimal _defaultVarianceThresholdLiters = 1.0m;
    private readonly decimal _defaultVarianceThresholdPercentage = 1.0m;

    private readonly ILogger<DiscrepancyDetectionService> _logger;
    private readonly IMediator _mediator;
    private readonly GpsdataContext _context;
    private readonly InventoryCostingService _costingService;
    private readonly IEventExpressionEngine _eventEngine;

    public DiscrepancyDetectionService(
        ILogger<DiscrepancyDetectionService> logger,
        IMediator mediator,
        GpsdataContext context,
        InventoryCostingService costingService,
        IEventExpressionEngine eventEngine)
    {
        _logger = logger;
        _mediator = mediator;
        _context = context;
        _costingService = costingService;
        _eventEngine = eventEngine;
    }

    // Enhanced discrepancy detection with configurable thresholds
    public async Task<DiscrepancyDetectionResult> DetectDiscrepancies(
        Tank tank,
        ReconciliationPolicy policy,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Use policy thresholds or default values
            var varianceThresholdLiters = policy.DiscrepancyThreshold ?? _defaultVarianceThresholdLiters;
            var varianceThresholdPercentage = policy.DiscrepancyPercentageThreshold ?? _defaultVarianceThresholdPercentage;

            // Perform discrepancy calculation
            var discrepancyResult = await CalculateDiscrepancy(tank, varianceThresholdLiters, varianceThresholdPercentage, cancellationToken);

            //  - Generate and push domain event when variance is significant
            if (discrepancyResult.IsSignificant)
            {
                var discrepancyEvent = new DiscrepancyDetectedEvent
                {
                    TankId = tank.Id,
                    PolicyId = policy.Id,
                    VarianceLiters = discrepancyResult.VarianceLiters,
                    VariancePercentage = discrepancyResult.VariancePercentage,
                    DetectedAt = DateTime.UtcNow,
                    Severity = (FMS.Domain.Events.DiscrepancySeverity)DetermineDiscrepancySeverity(discrepancyResult), //Cursor: Cast to correct enum type
                    ExpectedVolume = discrepancyResult.ExpectedVolume,
                    ActualVolume = discrepancyResult.ActualVolume
                };

                // Publish domain event for downstream alerting
                await _mediator.Publish(discrepancyEvent, cancellationToken);

                // Fire TankClosingStockEvent through the event expression engine
                var severityStr = DetermineDiscrepancySeverity(discrepancyResult) switch
                {
                    FMS.Domain.Entities.enums.DiscrepancySeverity.Critical => "Critical",
                    FMS.Domain.Entities.enums.DiscrepancySeverity.High => "High",
                    FMS.Domain.Entities.enums.DiscrepancySeverity.Medium => "Medium",
                    _ => "Low"
                };
                var stockEvent = new TankClosingStockEvent
                {
                    SiteId = tank.SiteId,
                    TankId = tank.Id,
                    Severity = severityStr,
                    Message = $"Significant discrepancy detected for Tank {tank.Name}: Expected {discrepancyResult.ExpectedVolume:N2}L, Actual {discrepancyResult.ActualVolume:N2}L, Variance {discrepancyResult.VarianceLiters:N2}L ({discrepancyResult.VariancePercentage:F2}%)",
                    TankName = tank.Name ?? "",
                    ExpectedClosingStock = discrepancyResult.ExpectedVolume,
                    ClosingStock = discrepancyResult.ActualVolume,
                    Variance = discrepancyResult.VarianceLiters,
                    VariancePercentage = discrepancyResult.VariancePercentage,
                };
                await _eventEngine.ProcessAsync(stockEvent, cancellationToken);
                _logger.LogInformation("Stock discrepancy event processed for Tank {TankId}: Expected {Expected}L, Actual {Actual}L, Variance {Variance}L",
                    tank.Id, discrepancyResult.ExpectedVolume, discrepancyResult.ActualVolume, discrepancyResult.VarianceLiters);

                _logger.LogWarning("Significant discrepancy detected for Tank {TankId}. Variance: {VarianceLiters}L ({VariancePercentage}%)",
                    tank.Id, discrepancyResult.VarianceLiters, discrepancyResult.VariancePercentage);
            }

            return discrepancyResult;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error detecting discrepancies for tank {TankId}", tank.Id);
            throw;
        }
    }

    //Cursor - Create ReconciliationDiscrepancy entity from detection result
    public async Task<ReconciliationDiscrepancy> CreateDiscrepancyRecordAsync(
        DiscrepancyDetectionResult detectionResult,
        int policyExecutionId,
        ReconciliationPolicy policy,
        CancellationToken cancellationToken = default)
    {

        //Cursor - Use inventory costing service for accurate business impact calculation
        var businessImpact = await CalculateBusinessImpactAsync(detectionResult, cancellationToken);

        return new ReconciliationDiscrepancy
        {
            PolicyExecutionId = policyExecutionId,
            TankId = detectionResult.TankId,
            DetectedAt = DateTime.UtcNow,
            CurrentStock = detectionResult.ActualVolume,
            ExpectedStock = detectionResult.ExpectedVolume,
            AbsoluteVariance = detectionResult.VarianceLiters,
            PercentageVariance = detectionResult.VariancePercentage,
            Severity = DetermineDiscrepancySeverity(detectionResult),
            IsResolved = false,
            AnalysisNotes = $"Detected by policy {policy.Name}. Expected: {detectionResult.ExpectedVolume}L, Actual: {detectionResult.ActualVolume}L, Variance: {detectionResult.VarianceLiters}L ({detectionResult.VariancePercentage:F2}%)",
            BusinessImpactScore = businessImpact
        };
    }

    //Cursor - Overload for backward compatibility
    public ReconciliationDiscrepancy CreateDiscrepancyRecord(
        DiscrepancyDetectionResult detectionResult,
        int policyExecutionId,
        ReconciliationPolicy policy)
    {
        return CreateDiscrepancyRecordAsync(detectionResult, policyExecutionId, policy).GetAwaiter().GetResult();
    }

    //Cursor - New method to detect physical vs book stock discrepancies using new PhysicalStockValue property
    public async Task<PhysicalStockDiscrepancyResult> DetectPhysicalStockDiscrepancies(
        Tank tank,
        decimal? thresholdLiters = null,
        decimal? thresholdPercentage = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var varianceThresholdLiters = thresholdLiters ?? _defaultVarianceThresholdLiters;
            var varianceThresholdPercentage = thresholdPercentage ?? _defaultVarianceThresholdPercentage;

            var physicalStock = tank.PhysicalStockValue ?? 0;
            var bookStock = tank.CurrentStock ?? 0;
            var varianceAmount = physicalStock - bookStock;
            var variancePercentage = bookStock > 0 ? Math.Abs(varianceAmount) / bookStock * 100 : 0;

            var isSignificant = Math.Abs(varianceAmount) > varianceThresholdLiters ||
                variancePercentage > varianceThresholdPercentage;

            return new PhysicalStockDiscrepancyResult
            {
                TankId = tank.Id,
                TankName = tank.Name,
                PhysicalStock = physicalStock,
                BookStock = bookStock,
                VarianceAmount = varianceAmount,
                VariancePercentage = variancePercentage,
                IsSignificant = isSignificant,
                PhysicalStockSource = tank.PhysicalStockSource,
                LastPhysicalUpdate = tank.LastPhysicalStockUpdate,
                LastBookUpdate = tank.LastStockUpdate,
                ThresholdLiters = varianceThresholdLiters,
                ThresholdPercentage = varianceThresholdPercentage
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error detecting physical stock discrepancies for tank {TankId}", tank.Id);
            throw;
        }
    }

    //Cursor - Get all tanks with physical stock discrepancies
    public async Task<List<PhysicalStockDiscrepancyResult>> GetTanksWithPhysicalStockDiscrepanciesAsync(
        int? siteId = null,
        decimal thresholdPercentage = 2.0m,
        CancellationToken cancellationToken = default)
    {
        var tanksQuery = _context.Tanks
            .Include(t => t.Site)
            .Where(t => t.PhysicalStockValue.HasValue && t.CurrentStock.HasValue);

        if (siteId.HasValue)
        {
            tanksQuery = tanksQuery.Where(t => t.SiteId == siteId.Value);
        }

        var tanks = await tanksQuery.ToListAsync(cancellationToken);
        var results = new List<PhysicalStockDiscrepancyResult>();

        foreach (var tank in tanks)
        {
            var discrepancyResult = await DetectPhysicalStockDiscrepancies(
                tank, null, thresholdPercentage, cancellationToken);

            if (discrepancyResult.IsSignificant)
            {
                results.Add(discrepancyResult);
            }
        }

        return results.OrderByDescending(r => Math.Abs(r.VariancePercentage)).ToList();
    }

    //Cursor - Complete implementation of discrepancy calculation logic
    private async Task<DiscrepancyDetectionResult> CalculateDiscrepancy(
        Tank tank,
        decimal varianceThresholdLiters,
        decimal varianceThresholdPercentage,
        CancellationToken cancellationToken)
    {

        //Cursor - Get latest tank volume reading
        var latestVolumeHistory = await _context.TankVolumeHistories
            .Where(tvh => tvh.TankId == tank.Id)
            .OrderByDescending(tvh => tvh.Timestamp)
            .FirstOrDefaultAsync(cancellationToken);

        if (latestVolumeHistory == null)
        {
            return new DiscrepancyDetectionResult
            {
                TankId = tank.Id,
                ExpectedVolume = 0,
                ActualVolume = 0,
                VarianceLiters = 0,
                VariancePercentage = 0,
                IsSignificant = false,
                ThresholdLiters = varianceThresholdLiters,
                ThresholdPercentage = varianceThresholdPercentage
            };
        }

        var actualVolume = latestVolumeHistory.NewVolume ?? 0; //Cursor: Handle nullable NewVolume property

        //Cursor - Calculate expected volume based on recent transactions
        var expectedVolume = await CalculateExpectedVolume(tank, cancellationToken);

        //Cursor - Calculate variance
        var varianceLiters = Math.Abs(expectedVolume - actualVolume);
        var variancePercentage = expectedVolume > 0 ? (varianceLiters / expectedVolume) * 100 : 0;

        //Cursor - Determine if variance is significant
        var isSignificant = varianceLiters > varianceThresholdLiters ||
            variancePercentage > varianceThresholdPercentage;

        return new DiscrepancyDetectionResult
        {
            TankId = tank.Id,
            ExpectedVolume = expectedVolume,
            ActualVolume = actualVolume,
            VarianceLiters = varianceLiters,
            VariancePercentage = variancePercentage,
            IsSignificant = isSignificant,
            ThresholdLiters = varianceThresholdLiters,
            ThresholdPercentage = varianceThresholdPercentage
        };
    }

    //Cursor - Calculate expected volume based on deliveries, consumption, and transfers
    private async Task<decimal> CalculateExpectedVolume(Tank tank, CancellationToken cancellationToken)
    {
        var cutoffTime = DateTime.UtcNow.AddHours(-24); // Look at last 24 hours

        //Cursor - Get starting volume from 24 hours ago
        var startingVolumeHistory = await _context.TankVolumeHistories
            .Where(tvh => tvh.TankId == tank.Id && tvh.Timestamp >= cutoffTime)
            .OrderBy(tvh => tvh.Timestamp)
            .FirstOrDefaultAsync(cancellationToken);

        var startingVolume = startingVolumeHistory?.NewVolume ?? tank.CurrentStock ?? 0; //Cursor: Use NewVolume instead of CurrentVolume

        //Cursor - Get deliveries in the time window
        var deliveries = await _context.Deliveries
            .Where(d => d.TankId == tank.Id && d.DeliveryDate >= cutoffTime)
            .ToListAsync(cancellationToken);

        var deliveryVolume = deliveries.Sum(d => d.ManualDeliveryAmount); //Cursor: Use ManualDeliveryAmount property

        //Cursor - Get consumption from pump transactions
        var consumption = await _context.Pumptransactions
            .Where(pt => pt.TankId == tank.Id && pt.DateTime >= cutoffTime) //Cursor: Use DateTime property
            .ToListAsync(cancellationToken);

        var consumptionVolume = consumption.Sum(c => c.TotalVolume ?? 0); //Cursor: Use TotalVolume property

        //Cursor - Get tank transfers (in and out)
        var transfersIn = await _context.TankTransfers
            .Where(tt => tt.DestinationTankId == tank.Id && tt.TransferDate >= cutoffTime) //Cursor: Use DestinationTankId
            .ToListAsync(cancellationToken);

        var transfersOut = await _context.TankTransfers
            .Where(tt => tt.SourceTankId == tank.Id && tt.TransferDate >= cutoffTime) //Cursor: Use SourceTankId
            .ToListAsync(cancellationToken);

        var transferInVolume = transfersIn.Sum(t => t.Amount ?? 0); //Cursor: Use Amount property
        var transferOutVolume = transfersOut.Sum(t => t.Amount ?? 0); //Cursor: Use Amount property

        //Cursor - Calculate expected volume
        var expectedVolume = startingVolume + deliveryVolume - consumptionVolume + transferInVolume - transferOutVolume;

        return Math.Max(0, expectedVolume); // Ensure non-negative
    }

    //Cursor - Determine discrepancy severity based on variance levels
    private FMS.Domain.Entities.enums.DiscrepancySeverity DetermineDiscrepancySeverity(DiscrepancyDetectionResult result)
    {
        var varianceRatio = Math.Max(
            result.VarianceLiters / result.ThresholdLiters,
            result.VariancePercentage / result.ThresholdPercentage
        );

        return varianceRatio
        switch
        {
            >=
            5.0m => FMS.Domain.Entities.enums.DiscrepancySeverity.Critical,
            >=
                3.0m => FMS.Domain.Entities.enums.DiscrepancySeverity.High,
            >=
                2.0m => FMS.Domain.Entities.enums.DiscrepancySeverity.Medium,
            _ => FMS.Domain.Entities.enums.DiscrepancySeverity.Low
        };
    }

    //Cursor - Calculate business impact using inventory costing service for accurate KES-based calculations
    private async Task<decimal> CalculateBusinessImpactAsync(DiscrepancyDetectionResult result, CancellationToken cancellationToken = default)
    {
        try
        {
            // Use the inventory costing service for accurate weighted average cost calculation
            var costResponse = await _costingService.GetWeightedAverageCostAsync(result.TankId, cancellationToken);

            if (costResponse.IsSuccess)
            {
                var costPerLiter = costResponse.Data;
                var volumeImpact = result.VarianceLiters * costPerLiter;

                // Apply percentage multiplier for additional risk assessment
                var percentageMultiplier = Math.Min(result.VariancePercentage / 100m, 1.0m); // Cap at 100%
                var businessImpact = volumeImpact * (1 + percentageMultiplier);

                _logger.LogDebug("Business impact calculated for Tank {TankId}: {VarianceLiters}L × {CostPerLiter} KES/L × (1 + {PercentageMultiplier}) = {BusinessImpact} KES",
                    result.TankId, result.VarianceLiters, costPerLiter, percentageMultiplier, businessImpact);

                return businessImpact;
            }
            else
            {
                _logger.LogWarning("Failed to get weighted average cost for tank {TankId}: {Error}. Using fallback calculation.",
                    result.TankId, costResponse.Message);
                return CalculateBusinessImpactFallback(result);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating business impact for tank {TankId}, using fallback", result.TankId);
            return CalculateBusinessImpactFallback(result);
        }
    }

    //Cursor - Fallback business impact calculation using default pricing
    private decimal CalculateBusinessImpactFallback(DiscrepancyDetectionResult result)
    {
        // Fallback calculation using default price of 150 KES/L
        var volumeImpact = result.VarianceLiters * 150.0m; // Default KES per liter
        var percentageMultiplier = Math.Min(result.VariancePercentage / 100m, 1.0m); // Cap at 100%

        return volumeImpact * (1 + percentageMultiplier);
    }

    //Cursor - Legacy method for backward compatibility (deprecated)
    [Obsolete("Use CalculateBusinessImpactAsync for accurate weighted average cost calculations")]
    private decimal CalculateBusinessImpact(DiscrepancyDetectionResult result)
    {
        // Legacy simple business impact calculation - deprecated
        // Kept for backward compatibility but should use CalculateBusinessImpactAsync
        return CalculateBusinessImpactFallback(result);
    }
}

//Cursor - Result class for physical stock discrepancy detection
public class PhysicalStockDiscrepancyResult
{
    public int TankId { get; set; }
    public string TankName { get; set; } = string.Empty;
    public decimal PhysicalStock { get; set; }
    public decimal BookStock { get; set; }
    public decimal VarianceAmount { get; set; }
    public decimal VariancePercentage { get; set; }
    public bool IsSignificant { get; set; }
    public string? PhysicalStockSource { get; set; }
    public DateTime? LastPhysicalUpdate { get; set; }
    public DateTime LastBookUpdate { get; set; }
    public decimal ThresholdLiters { get; set; }
    public decimal ThresholdPercentage { get; set; }
}

//Cursor - Result class for discrepancy detection
public class DiscrepancyDetectionResult
{
    public int TankId { get; set; }
    public decimal ExpectedVolume { get; set; }
    public decimal ActualVolume { get; set; }
    public decimal VarianceLiters { get; set; }
    public decimal VariancePercentage { get; set; }
    public bool IsSignificant { get; set; }
    public decimal ThresholdLiters { get; set; }
    public decimal ThresholdPercentage { get; set; }
}