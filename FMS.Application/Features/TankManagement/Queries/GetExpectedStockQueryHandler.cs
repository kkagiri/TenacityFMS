using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.TankManagement.DTOs;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.TankManagement.Queries;

/// <summary>
/// Handler for GetExpectedStockQuery
/// Calculates expected stock based on previous closing + deliveries + transfers in - transfers out - dispensing
/// Supports real-time validation before saving stock entries
/// </summary>
public class GetExpectedStockQueryHandler
    : IRequestHandler<GetExpectedStockQuery, FMSResponse<ExpectedStockResult>>
{
    private const string StockVarianceThresholdPercentageKey = "Stock.VarianceThreshold.Percentage";
    private const string StockVarianceThresholdAbsoluteLitersKey = "Stock.VarianceThreshold.AbsoluteLiters";

    private readonly GpsdataContext _context;
    private readonly ILogger<GetExpectedStockQueryHandler> _logger;

    public GetExpectedStockQueryHandler(
        GpsdataContext context,
        ILogger<GetExpectedStockQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<ExpectedStockResult>> Handle(
        GetExpectedStockQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation(
                "Calculating expected stock for TankId: {TankId}, Timestamp: {Timestamp}, StockType: {StockType}",
                request.TankId, request.Timestamp, request.StockType);

            // Validate tank exists
            var tank = await _context.Tanks
                .Where(t => t.Id == request.TankId)
                .Select(t => new { t.Id, t.Name })
                .FirstOrDefaultAsync(cancellationToken);

            if (tank == null)
            {
                return FMSResponse<ExpectedStockResult>.NotFound(
                    $"Tank with ID {request.TankId} not found");
            }

            // Get variance thresholds from system configuration
            var thresholds = await GetVarianceThresholds(cancellationToken);

            // Get the last closing stock before the requested timestamp
            var previousClosingStock = await _context.Tankstocks
                .Where(ts => ts.TankId == request.TankId
                    && ts.EntryType == VolumeChangeReasonEnum.ClosingStock
                    && ts.EntryDate < request.Timestamp
                    && (ts.ImportBatchId == null || !ts.ImportBatchId.StartsWith("DELETED_")))
                .OrderByDescending(ts => ts.EntryDate)
                .Select(ts => new
                {
                    ts.ManualClosingLevel,
                    ts.SensorClosingLevel,
                    ts.EntryDate
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (previousClosingStock == null)
            {
                // No previous closing stock found - cannot calculate expected stock
                _logger.LogWarning(
                    "No previous closing stock found for TankId: {TankId} before {Timestamp}",
                    request.TankId, request.Timestamp);

                return FMSResponse<ExpectedStockResult>.Success(
                    new ExpectedStockResult
                    {
                        TankId = request.TankId,
                        TankName = tank.Name,
                        Timestamp = request.Timestamp,
                        StockType = request.StockType,
                        ExpectedStock = 0,
                        HasPreviousStock = false,
                        Message = "No previous closing stock found. This may be the first entry for this tank.",
                        Thresholds = thresholds
                    });
            }

            // Determine which closing level to use (prioritize manual over sensor)
            var previousClosing = previousClosingStock.ManualClosingLevel ?? previousClosingStock.SensorClosingLevel ?? 0;

            // Calculate deliveries between previous closing and current timestamp
            var deliveriesSum = await _context.Tankstocks
                .Where(ts => ts.TankId == request.TankId
                    && ts.EntryType == VolumeChangeReasonEnum.Delivery
                    && ts.EntryDate > previousClosingStock.EntryDate
                    && ts.EntryDate <= request.Timestamp
                    && (ts.ImportBatchId == null || !ts.ImportBatchId.StartsWith("DELETED_")))
                .SumAsync(ts => ts.ManualAmount ?? 0, cancellationToken);

            var deliveriesCount = await _context.Tankstocks
                .Where(ts => ts.TankId == request.TankId
                    && ts.EntryType == VolumeChangeReasonEnum.Delivery
                    && ts.EntryDate > previousClosingStock.EntryDate
                    && ts.EntryDate <= request.Timestamp
                    && (ts.ImportBatchId == null || !ts.ImportBatchId.StartsWith("DELETED_")))
                .CountAsync(cancellationToken);

            // Calculate transfers in (to this tank)
            var transfersInSum = await _context.TankTransfers
                .Where(tt => tt.DestinationTankId == request.TankId
                    && tt.TransferDate > previousClosingStock.EntryDate
                    && tt.TransferDate <= request.Timestamp
                    && !tt.IsDeleted)
                .SumAsync(tt => tt.Amount ?? 0, cancellationToken);

            var transfersInCount = await _context.TankTransfers
                .Where(tt => tt.DestinationTankId == request.TankId
                    && tt.TransferDate > previousClosingStock.EntryDate
                    && tt.TransferDate <= request.Timestamp
                    && !tt.IsDeleted)
                .CountAsync(cancellationToken);

            // Calculate transfers out (from this tank)
            var transfersOutSum = await _context.TankTransfers
                .Where(tt => tt.SourceTankId == request.TankId
                    && tt.TransferDate > previousClosingStock.EntryDate
                    && tt.TransferDate <= request.Timestamp
                    && !tt.IsDeleted)
                .SumAsync(tt => tt.Amount ?? 0, cancellationToken);

            var transfersOutCount = await _context.TankTransfers
                .Where(tt => tt.SourceTankId == request.TankId
                    && tt.TransferDate > previousClosingStock.EntryDate
                    && tt.TransferDate <= request.Timestamp
                    && !tt.IsDeleted)
                .CountAsync(cancellationToken);

            // Calculate dispensing from BOTH sources (CRITICAL)
            // Source 1: Manual aggregated dispensing from tankstock table
            var manualAggregateDispensing = await _context.Tankstocks
                .Where(ts => ts.TankId == request.TankId
                    && ts.EntryDate > previousClosingStock.EntryDate
                    && ts.EntryDate <= request.Timestamp
                    && (ts.ImportBatchId == null || !ts.ImportBatchId.StartsWith("DELETED_")))
                .SumAsync(ts => ts.ManualCalculatedUsage ?? 0, cancellationToken);

            // Source 2: Dispensing from tankvolumehistory (ChangeReason = Dispensing OR AutomatedDispensing)
            var volumeHistoryDispensing = await _context.TankVolumeHistories
                .Where(tvh => tvh.TankId == request.TankId
                    && tvh.Timestamp > previousClosingStock.EntryDate
                    && tvh.Timestamp <= request.Timestamp
                    && (tvh.ChangeReason == VolumeChangeReasonEnum.Dispensing
                        || tvh.ChangeReason == VolumeChangeReasonEnum.AutomatedDispensing)
                    && (tvh.IsDeleted == null || tvh.IsDeleted == false))
                .SumAsync(tvh => Math.Abs(tvh.VolumeChange ?? 0), cancellationToken);

            // Break down volume history dispensing by type
            var sensorDispensing = await _context.TankVolumeHistories
                .Where(tvh => tvh.TankId == request.TankId
                    && tvh.Timestamp > previousClosingStock.EntryDate
                    && tvh.Timestamp <= request.Timestamp
                    && tvh.ChangeReason == VolumeChangeReasonEnum.Dispensing
                    && (tvh.IsDeleted == null || tvh.IsDeleted == false))
                .SumAsync(tvh => Math.Abs(tvh.VolumeChange ?? 0), cancellationToken);

            var automatedDispensing = await _context.TankVolumeHistories
                .Where(tvh => tvh.TankId == request.TankId
                    && tvh.Timestamp > previousClosingStock.EntryDate
                    && tvh.Timestamp <= request.Timestamp
                    && tvh.ChangeReason == VolumeChangeReasonEnum.AutomatedDispensing
                    && (tvh.IsDeleted == null || tvh.IsDeleted == false))
                .SumAsync(tvh => Math.Abs(tvh.VolumeChange ?? 0), cancellationToken);

            var totalDispensing = manualAggregateDispensing + volumeHistoryDispensing;

            // Calculate expected stock
            // Expected = Previous Closing + Deliveries + Transfers In - Transfers Out - Dispensing
            var expectedStock = previousClosing + deliveriesSum + transfersInSum - transfersOutSum - totalDispensing;

            var result = new ExpectedStockResult
            {
                TankId = request.TankId,
                TankName = tank.Name,
                Timestamp = request.Timestamp,
                StockType = request.StockType,
                ExpectedStock = expectedStock,
                HasPreviousStock = true,
                Message = "Expected stock calculated successfully",
                Thresholds = thresholds,
                Breakdown = new StockCalculationBreakdown
                {
                    PreviousClosingStock = previousClosing,
                    PreviousClosingDate = previousClosingStock.EntryDate,
                    DeliveriesSum = deliveriesSum,
                    DeliveriesCount = deliveriesCount,
                    TransfersInSum = transfersInSum,
                    TransfersInCount = transfersInCount,
                    TransfersOutSum = transfersOutSum,
                    TransfersOutCount = transfersOutCount,
                    TotalDispensing = totalDispensing,
                    DispensingDetails = new DispensingBreakdown
                    {
                        ManualAggregate = manualAggregateDispensing,
                        SensorDispensing = sensorDispensing,
                        AutomatedDispensing = automatedDispensing
                    }
                }
            };

            _logger.LogInformation(
                "Expected stock calculated: {ExpectedStock:F2}L for TankId: {TankId}. " +
                "Components: Previous={Previous:F2}, Deliveries={Deliveries:F2}, " +
                "TransfersIn={TransfersIn:F2}, TransfersOut={TransfersOut:F2}, Dispensing={Dispensing:F2}",
                expectedStock, request.TankId, previousClosing, deliveriesSum,
                transfersInSum, transfersOutSum, totalDispensing);

            return FMSResponse<ExpectedStockResult>.Success(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Error calculating expected stock for TankId: {TankId}, Timestamp: {Timestamp}",
                request.TankId, request.Timestamp);

            return FMSResponse<ExpectedStockResult>.Failed(
                $"Error calculating expected stock: {ex.Message}");
        }
    }

    /// <summary>
    /// Get variance thresholds from system configuration
    /// </summary>
    private async Task<VarianceThresholds> GetVarianceThresholds(CancellationToken cancellationToken)
    {
        var thresholds = new VarianceThresholds
        {
            PercentageThreshold = 5, // Default 5%
            AbsoluteLitersThreshold = 50 // Default 50 liters
        };

        try
        {
            var configs = await _context.SystemConfigurations
                .Where(sc => sc.IsActive
                    && (sc.ConfigurationKey == StockVarianceThresholdPercentageKey
                        || sc.ConfigurationKey == StockVarianceThresholdAbsoluteLitersKey))
                .ToListAsync(cancellationToken);

            foreach (var config in configs)
            {
                if (config.ConfigurationKey == StockVarianceThresholdPercentageKey
                    && decimal.TryParse(config.ConfigurationValue, out var percentage))
                {
                    thresholds.PercentageThreshold = percentage;
                }
                else if (config.ConfigurationKey == StockVarianceThresholdAbsoluteLitersKey
                    && decimal.TryParse(config.ConfigurationValue, out var liters))
                {
                    thresholds.AbsoluteLitersThreshold = liters;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error loading variance thresholds from configuration. Using defaults.");
        }

        return thresholds;
    }
}
