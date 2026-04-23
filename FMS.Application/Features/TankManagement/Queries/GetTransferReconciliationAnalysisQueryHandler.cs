using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Configuration;
using FMS.Application.Features.TankManagement.DTOs;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.TankManagement.Queries;

/// <summary>
/// Handler for GetTransferReconciliationAnalysisQuery
/// Analyzes transfer-based reconciliation by period
/// Calculates expected vs actual stock for each period between stock entries
/// </summary>
public class GetTransferReconciliationAnalysisQueryHandler
    : IRequestHandler<GetTransferReconciliationAnalysisQuery, FMSResponse<TransferReconciliationResult>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetTransferReconciliationAnalysisQueryHandler> _logger;

    public GetTransferReconciliationAnalysisQueryHandler(
        GpsdataContext context,
        ILogger<GetTransferReconciliationAnalysisQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<TransferReconciliationResult>> Handle(
        GetTransferReconciliationAnalysisQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation(
                "Analyzing transfer reconciliation for TankId: {TankId}, Period: {StartDate} to {EndDate}",
                request.TankId, request.StartDate, request.EndDate);

            // Validate inputs
            if (request.StartDate > request.EndDate)
            {
                return FMSResponse<TransferReconciliationResult>.ValidationFailed(
                    new List<string> { "Start date must be before or equal to end date" });
            }

            // Validate tank exists
            var tank = await _context.Tanks
                .Where(t => t.Id == request.TankId)
                .Select(t => new { t.Id, t.Name })
                .FirstOrDefaultAsync(cancellationToken);

            if (tank == null)
            {
                return FMSResponse<TransferReconciliationResult>.NotFound(
                    "TANK_NOT_FOUND",
                    $"Tank with ID {request.TankId} not found");
            }

            // Get variance thresholds
            var thresholds = await GetVarianceThresholds(cancellationToken);

            // Get all stock entries (Opening and Closing) in the date range
            // These define the boundaries of reconciliation periods
            var stockEntries = await _context.Tankstocks
                .Where(ts => ts.TankId == request.TankId
                    && (ts.EntryType == VolumeChangeReasonEnum.OpeningStock
                        || ts.EntryType == VolumeChangeReasonEnum.ClosingStock)
                    && ts.EntryDate >= request.StartDate
                    && ts.EntryDate <= request.EndDate
                    && !ts.ImportBatchId.StartsWith("DELETED_"))
                .OrderBy(ts => ts.EntryDate)
                .ThenBy(ts => ts.EntryType) // Opening before Closing for same date
                .Select(ts => new
                {
                    ts.EntryId,
                    ts.EntryDate,
                    ts.EntryType,
                    Volume = ts.EntryType == VolumeChangeReasonEnum.OpeningStock
                        ? (ts.ManualOpeningLevel ?? ts.SensorOpeningLevel ?? 0)
                        : (ts.ManualClosingLevel ?? ts.SensorClosingLevel ?? 0)
                })
                .ToListAsync(cancellationToken);

            if (!stockEntries.Any())
            {
                return FMSResponse<TransferReconciliationResult>.Success(
                    new TransferReconciliationResult
                    {
                        TankId = request.TankId,
                        TankName = tank.Name,
                        StartDate = request.StartDate,
                        EndDate = request.EndDate,
                        Periods = new List<ReconciliationPeriod>(),
                        Summary = new ReconciliationSummary
                        {
                            TotalPeriods = 0,
                            Thresholds = thresholds
                        }
                    },
                    "No stock entries found in the specified date range");
            }

            // Build periods between consecutive stock entries
            var periods = new List<ReconciliationPeriod>();

            for (int i = 0; i < stockEntries.Count - 1; i++)
            {
                var currentEntry = stockEntries[i];
                var nextEntry = stockEntries[i + 1];

                var period = await BuildReconciliationPeriod(
                    request.TankId,
                    i + 1,
                    currentEntry.EntryDate,
                    nextEntry.EntryDate,
                    currentEntry.Volume,
                    nextEntry.Volume,
                    thresholds,
                    request.IncludeTransferDetails,
                    cancellationToken);

                periods.Add(period);
            }

            // Calculate summary statistics
            var summary = CalculateSummary(periods, thresholds);

            var result = new TransferReconciliationResult
            {
                TankId = request.TankId,
                TankName = tank.Name,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                Periods = periods,
                Summary = summary
            };

            _logger.LogInformation(
                "Transfer reconciliation analysis complete for TankId: {TankId}. " +
                "Periods: {PeriodCount}, Within threshold: {WithinThreshold}",
                request.TankId, periods.Count, summary.PeriodsWithinThreshold);

            return FMSResponse<TransferReconciliationResult>.Success(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Error analyzing transfer reconciliation for TankId: {TankId}",
                request.TankId);

            return FMSResponse<TransferReconciliationResult>.Failed(
                $"Error analyzing transfer reconciliation: {ex.Message}");
        }
    }

    /// <summary>
    /// Build a single reconciliation period with all calculations
    /// </summary>
    private async Task<ReconciliationPeriod> BuildReconciliationPeriod(
        int tankId,
        int periodNumber,
        DateTime startDate,
        DateTime endDate,
        decimal openingStock,
        decimal actualClosing,
        VarianceThresholds thresholds,
        bool includeDetails,
        CancellationToken cancellationToken)
    {
        // Get transfers IN (to this tank)
        var transfersInQuery = _context.TankTransfers
            .Where(tt => tt.DestinationTankId == tankId
                && tt.TransferDate > startDate
                && tt.TransferDate <= endDate
                && !tt.IsDeleted);

        var transfersInSum = await transfersInQuery.SumAsync(tt => tt.Amount ?? 0, cancellationToken);
        var transfersInCount = await transfersInQuery.CountAsync(cancellationToken);

        // Get transfers OUT (from this tank)
        var transfersOutQuery = _context.TankTransfers
            .Where(tt => tt.SourceTankId == tankId
                && tt.TransferDate > startDate
                && tt.TransferDate <= endDate
                && !tt.IsDeleted);

        var transfersOutSum = await transfersOutQuery.SumAsync(tt => tt.Amount ?? 0, cancellationToken);
        var transfersOutCount = await transfersOutQuery.CountAsync(cancellationToken);

        // Get dispensing from BOTH sources (CRITICAL)
        // Source 1: Manual aggregated dispensing from tankstock
        var manualAggregateDispensing = await _context.Tankstocks
            .Where(ts => ts.TankId == tankId
                && ts.EntryDate > startDate
                && ts.EntryDate <= endDate
                && !ts.ImportBatchId.StartsWith("DELETED_"))
            .SumAsync(ts => ts.ManualCalculatedUsage ?? 0, cancellationToken);

        // Source 2: Sensor dispensing from tankvolumehistory (Dispensing)
        var sensorDispensing = await _context.TankVolumeHistories
            .Where(tvh => tvh.TankId == tankId
                && tvh.Timestamp > startDate
                && tvh.Timestamp <= endDate
                && tvh.ChangeReason == VolumeChangeReasonEnum.Dispensing
                && (tvh.IsDeleted == null || tvh.IsDeleted == false))
            .SumAsync(tvh => Math.Abs(tvh.VolumeChange ?? 0), cancellationToken);

        // Source 3: Automated dispensing from tankvolumehistory (AutomatedDispensing)
        var automatedDispensing = await _context.TankVolumeHistories
            .Where(tvh => tvh.TankId == tankId
                && tvh.Timestamp > startDate
                && tvh.Timestamp <= endDate
                && tvh.ChangeReason == VolumeChangeReasonEnum.AutomatedDispensing
                && (tvh.IsDeleted == null || tvh.IsDeleted == false))
            .SumAsync(tvh => Math.Abs(tvh.VolumeChange ?? 0), cancellationToken);

        var totalDispensing = manualAggregateDispensing + sensorDispensing + automatedDispensing;

        // Calculate expected closing
        // Expected = Opening + TransfersIn - TransfersOut - Dispensing
        var expectedClosing = openingStock + transfersInSum - transfersOutSum - totalDispensing;

        // Calculate variance
        var variance = actualClosing - expectedClosing;
        var variancePercentage = expectedClosing != 0
            ? (Math.Abs(variance) / expectedClosing) * 100
            : 0;

        // Determine severity
        var severity = thresholds.GetVarianceSeverity(expectedClosing, actualClosing);
        var isWithinThreshold = thresholds.IsWithinThreshold(expectedClosing, actualClosing);

        var period = new ReconciliationPeriod
        {
            PeriodNumber = periodNumber,
            StartDate = startDate,
            EndDate = endDate,
            OpeningStock = openingStock,
            ActualClosing = actualClosing,
            ExpectedClosing = expectedClosing,
            Variance = variance,
            VariancePercentage = variancePercentage,
            IsWithinThreshold = isWithinThreshold,
            Severity = severity,
            TransfersIn = transfersInSum,
            TransfersInCount = transfersInCount,
            TransfersOut = transfersOutSum,
            TransfersOutCount = transfersOutCount,
            TotalDispensing = totalDispensing,
            DispensingDetails = new DispensingBreakdown
            {
                ManualAggregate = manualAggregateDispensing,
                SensorDispensing = sensorDispensing,
                AutomatedDispensing = automatedDispensing
            }
        };

        // Include transfer details if requested
        if (includeDetails)
        {
            var transferDetails = new List<TransferDetail>();

            // Get transfers IN with details
            var transfersIn = await _context.TankTransfers
                .Where(tt => tt.DestinationTankId == tankId
                    && tt.TransferDate > startDate
                    && tt.TransferDate <= endDate
                    && !tt.IsDeleted)
                .Include(tt => tt.SourceTank)
                .Include(tt => tt.DestinationTank)
                .Select(tt => new TransferDetail
                {
                    TransferId = tt.Id,
                    TransferDate = tt.TransferDate ?? DateTime.MinValue,
                    SourceTankId = tt.SourceTankId,
                    SourceTankName = tt.SourceTank != null ? tt.SourceTank.Name : "",
                    DestinationTankId = tt.DestinationTankId,
                    DestinationTankName = tt.DestinationTank != null ? tt.DestinationTank.Name : "",
                    Amount = tt.Amount ?? 0,
                    RecordedBy = tt.RecordedBy ?? "",
                    Direction = "In"
                })
                .ToListAsync(cancellationToken);

            // Get transfers OUT with details
            var transfersOut = await _context.TankTransfers
                .Where(tt => tt.SourceTankId == tankId
                    && tt.TransferDate > startDate
                    && tt.TransferDate <= endDate
                    && !tt.IsDeleted)
                .Include(tt => tt.SourceTank)
                .Include(tt => tt.DestinationTank)
                .Select(tt => new TransferDetail
                {
                    TransferId = tt.Id,
                    TransferDate = tt.TransferDate ?? DateTime.MinValue,
                    SourceTankId = tt.SourceTankId,
                    SourceTankName = tt.SourceTank != null ? tt.SourceTank.Name : "",
                    DestinationTankId = tt.DestinationTankId,
                    DestinationTankName = tt.DestinationTank != null ? tt.DestinationTank.Name : "",
                    Amount = tt.Amount ?? 0,
                    RecordedBy = tt.RecordedBy ?? "",
                    Direction = "Out"
                })
                .ToListAsync(cancellationToken);

            transferDetails.AddRange(transfersIn);
            transferDetails.AddRange(transfersOut);
            transferDetails = transferDetails.OrderBy(td => td.TransferDate).ToList();

            period.TransferDetails = transferDetails;
        }

        return period;
    }

    /// <summary>
    /// Calculate summary statistics across all periods
    /// </summary>
    private ReconciliationSummary CalculateSummary(
        List<ReconciliationPeriod> periods,
        VarianceThresholds thresholds)
    {
        if (!periods.Any())
        {
            return new ReconciliationSummary
            {
                TotalPeriods = 0,
                Thresholds = thresholds
            };
        }

        var summary = new ReconciliationSummary
        {
            TotalPeriods = periods.Count,
            PeriodsWithinThreshold = periods.Count(p => p.Severity == "acceptable"),
            PeriodsWithModerateVariance = periods.Count(p => p.Severity == "moderate"),
            PeriodsWithHighVariance = periods.Count(p => p.Severity == "high"),
            TotalTransfersIn = periods.Sum(p => p.TransfersIn),
            TotalTransfersOut = periods.Sum(p => p.TransfersOut),
            TotalDispensing = periods.Sum(p => p.TotalDispensing),
            AverageVariance = periods.Average(p => p.Variance),
            AverageVariancePercentage = periods.Average(p => p.VariancePercentage),
            LargestPositiveVariance = periods.Max(p => p.Variance),
            LargestNegativeVariance = periods.Min(p => p.Variance),
            Thresholds = thresholds
        };

        // Find period with largest absolute variance
        var periodWithLargestVariance = periods
            .OrderByDescending(p => Math.Abs(p.Variance))
            .FirstOrDefault();

        if (periodWithLargestVariance != null)
        {
            summary.PeriodWithLargestVariance = periodWithLargestVariance.PeriodNumber;
        }

        // Calculate total dispensing breakdown
        summary.TotalDispensingBreakdown = new DispensingBreakdown
        {
            ManualAggregate = periods.Sum(p => p.DispensingDetails.ManualAggregate),
            SensorDispensing = periods.Sum(p => p.DispensingDetails.SensorDispensing),
            AutomatedDispensing = periods.Sum(p => p.DispensingDetails.AutomatedDispensing)
        };

        return summary;
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
                    && (sc.ConfigurationKey == SystemConfiguration.DB_CONFIG_STOCK_VARIANCE_THRESHOLD_PERCENTAGE_KEY
                        || sc.ConfigurationKey == SystemConfiguration.DB_CONFIG_STOCK_VARIANCE_THRESHOLD_ABSOLUTE_LITERS_KEY))
                .ToListAsync(cancellationToken);

            foreach (var config in configs)
            {
                if (config.ConfigurationKey == SystemConfiguration.DB_CONFIG_STOCK_VARIANCE_THRESHOLD_PERCENTAGE_KEY
                    && decimal.TryParse(config.ConfigurationValue, out var percentage))
                {
                    thresholds.PercentageThreshold = percentage;
                }
                else if (config.ConfigurationKey == SystemConfiguration.DB_CONFIG_STOCK_VARIANCE_THRESHOLD_ABSOLUTE_LITERS_KEY
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
