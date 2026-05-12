using System;
using System.Collections.Generic;
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
/// Handler for GetPeriodDiagnosticQuery
/// Provides comprehensive diagnostic data for tank period analysis
/// </summary>
public class GetPeriodDiagnosticQueryHandler
    : IRequestHandler<GetPeriodDiagnosticQuery, FMSResponse<PeriodDiagnosticResult>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetPeriodDiagnosticQueryHandler> _logger;

    public GetPeriodDiagnosticQueryHandler(
        GpsdataContext context,
        ILogger<GetPeriodDiagnosticQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<PeriodDiagnosticResult>> Handle(
        GetPeriodDiagnosticQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation(
                "Getting diagnostic data for TankId: {TankId}, Period: {StartDate} to {EndDate}",
                request.TankId, request.StartDate, request.EndDate);

            // Validate tank exists
            var tank = await _context.Tanks
                .Where(t => t.Id == request.TankId)
                .Select(t => new { t.Id, t.Name })
                .FirstOrDefaultAsync(cancellationToken);

            if (tank == null)
            {
                return FMSResponse<PeriodDiagnosticResult>.NotFound(
                    "TANK_NOT_FOUND",
                    $"Tank with ID {request.TankId} not found");
            }

            var result = new PeriodDiagnosticResult
            {
                TankId = request.TankId,
                TankName = tank.Name,
                StartDate = request.StartDate,
                EndDate = request.EndDate
            };

            // 1. Get all TankStock entries
            result.StockEntries = await GetStockEntries(
                request.TankId,
                request.StartDate,
                request.EndDate,
                request.IncludeDeletedRecords,
                cancellationToken);

            // 2. Get all VolumeHistory transactions
            result.VolumeTransactions = await GetVolumeTransactions(
                request.TankId,
                request.StartDate,
                request.EndDate,
                request.IncludeDeletedRecords,
                cancellationToken);

            // 3. Get all Transfer transactions
            result.Transfers = await GetTransferTransactions(
                request.TankId,
                request.StartDate,
                request.EndDate,
                request.IncludeDeletedRecords,
                cancellationToken);

            // 4. Calculate reconciliation
            result.Reconciliation = CalculateReconciliation(
                result.StockEntries,
                result.VolumeTransactions,
                result.Transfers,
                request.IncludeAllTransactionTypes);

            // 5. Generate data quality warnings
            result.Warnings = GenerateWarnings(
                result.StockEntries,
                result.VolumeTransactions,
                result.Transfers,
                result.Reconciliation);

            _logger.LogInformation(
                "Diagnostic data retrieved: {StockCount} stock entries, {VolumeCount} volume transactions, " +
                "{TransferCount} transfers, {WarningCount} warnings",
                result.StockEntries.Count, result.VolumeTransactions.Count,
                result.Transfers.Count, result.Warnings.Count);

            return FMSResponse<PeriodDiagnosticResult>.Success(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Error getting diagnostic data for TankId: {TankId}",
                request.TankId);

            return FMSResponse<PeriodDiagnosticResult>.Failed(
                $"Error retrieving diagnostic data: {ex.Message}");
        }
    }

    private async Task<List<TankStockEntry>> GetStockEntries(
        int tankId,
        DateTime startDate,
        DateTime endDate,
        bool includeDeleted,
        CancellationToken cancellationToken)
    {
        var query = _context.Tankstocks
            .Where(ts => ts.TankId == tankId
                && ts.EntryDate >= startDate
                && ts.EntryDate <= endDate);

        if (!includeDeleted)
        {
            query = query.Where(ts => !ts.ImportBatchId.StartsWith("DELETED_"));
        }

        return await query
            .OrderBy(ts => ts.EntryDate)
            .Select(ts => new TankStockEntry
            {
                EntryId = ts.EntryId,
                EntryDate = ts.EntryDate,
                EntryType = ts.EntryType.ToString(),
                EntryTypeId = (int)ts.EntryType,
                ManualOpeningLevel = ts.ManualOpeningLevel,
                SensorOpeningLevel = ts.SensorOpeningLevel,
                OpeningMeter = ts.OpeningMeter,
                ManualClosingLevel = ts.ManualClosingLevel,
                SensorClosingLevel = ts.SensorClosingLevel,
                ClosingMeter = ts.ClosingMeter,
                ManualAmount = ts.ManualAmount,
                ManualCalculatedUsage = ts.ManualCalculatedUsage,
                RecordedBy = ts.RecordedBy ?? "",
                Comment = ts.Comment ?? "",
                ImportBatchId = ts.ImportBatchId ?? ""
            })
            .ToListAsync(cancellationToken);
    }

    private async Task<List<VolumeHistoryTransaction>> GetVolumeTransactions(
        int tankId,
        DateTime startDate,
        DateTime endDate,
        bool includeDeleted,
        CancellationToken cancellationToken)
    {
        var query = _context.TankVolumeHistories
            .Where(tvh => tvh.TankId == tankId
                && tvh.Timestamp >= startDate
                && tvh.Timestamp <= endDate);

        if (!includeDeleted)
        {
            query = query.Where(tvh => tvh.IsDeleted == null || tvh.IsDeleted == false);
        }

        return await query
            .OrderBy(tvh => tvh.Timestamp)
            .Select(tvh => new VolumeHistoryTransaction
            {
                HistoryId = tvh.Id,
                Timestamp = tvh.Timestamp,
                ChangeReason = tvh.ChangeReason.ToString(),
                ChangeReasonId = (int)tvh.ChangeReason,
                VolumeChange = tvh.VolumeChange,
                VolumeBefore = null, // Not available in current schema
                VolumeAfter = tvh.NewVolume,
                Source = tvh.ReferenceType ?? "",
                RecordedBy = tvh.RecordedBy ?? "",
                TransactionReference = tvh.ReferenceId.HasValue ? tvh.ReferenceId.Value.ToString() : "",
                IsDeleted = tvh.IsDeleted
            })
            .ToListAsync(cancellationToken);
    }

    private async Task<List<TransferTransaction>> GetTransferTransactions(
        int tankId,
        DateTime startDate,
        DateTime endDate,
        bool includeDeleted,
        CancellationToken cancellationToken)
    {
        // Get transfers IN
        var transfersInQuery = _context.TankTransfers
            .Where(tt => tt.DestinationTankId == tankId
                && tt.TransferDate >= startDate
                && tt.TransferDate <= endDate);

        if (!includeDeleted)
        {
            transfersInQuery = transfersInQuery.Where(tt => !tt.IsDeleted);
        }

        var transfersIn = await transfersInQuery
            .Include(tt => tt.SourceTank)
            .Include(tt => tt.DestinationTank)
            .Select(tt => new TransferTransaction
            {
                TransferId = tt.Id,
                TransferDate = tt.TransferDate,
                SourceTankId = tt.SourceTankId,
                SourceTankName = tt.SourceTank != null ? tt.SourceTank.Name : "",
                DestinationTankId = tt.DestinationTankId,
                DestinationTankName = tt.DestinationTank != null ? tt.DestinationTank.Name : "",
                Amount = tt.Amount,
                Direction = "In",
                RecordedBy = tt.RecordedBy ?? "",
                Notes = tt.CorrectionReason ?? "",
                IsDeleted = tt.IsDeleted
            })
            .ToListAsync(cancellationToken);

        // Get transfers OUT
        var transfersOutQuery = _context.TankTransfers
            .Where(tt => tt.SourceTankId == tankId
                && tt.TransferDate >= startDate
                && tt.TransferDate <= endDate);

        if (!includeDeleted)
        {
            transfersOutQuery = transfersOutQuery.Where(tt => !tt.IsDeleted);
        }

        var transfersOut = await transfersOutQuery
            .Include(tt => tt.SourceTank)
            .Include(tt => tt.DestinationTank)
            .Select(tt => new TransferTransaction
            {
                TransferId = tt.Id,
                TransferDate = tt.TransferDate,
                SourceTankId = tt.SourceTankId,
                SourceTankName = tt.SourceTank != null ? tt.SourceTank.Name : "",
                DestinationTankId = tt.DestinationTankId,
                DestinationTankName = tt.DestinationTank != null ? tt.DestinationTank.Name : "",
                Amount = tt.Amount,
                Direction = "Out",
                RecordedBy = tt.RecordedBy ?? "",
                Notes = tt.CorrectionReason ?? "",
                IsDeleted = tt.IsDeleted
            })
            .ToListAsync(cancellationToken);

        var allTransfers = transfersIn.Concat(transfersOut)
            .OrderBy(t => t.TransferDate)
            .ToList();

        return allTransfers;
    }

    private DiagnosticReconciliation CalculateReconciliation(
        List<TankStockEntry> stockEntries,
        List<VolumeHistoryTransaction> volumeTransactions,
        List<TransferTransaction> transfers,
        bool includeAllTransactionTypes)
    {
        var reconciliation = new DiagnosticReconciliation
        {
            CalculationSteps = new List<string>()
        };

        // Get opening and closing stock
        var openingEntry = stockEntries
            .Where(s => s.EntryTypeId == (int)VolumeChangeReasonEnum.OpeningStock)
            .OrderBy(s => s.EntryDate)
            .FirstOrDefault();

        var closingEntry = stockEntries
            .Where(s => s.EntryTypeId == (int)VolumeChangeReasonEnum.ClosingStock)
            .OrderByDescending(s => s.EntryDate)
            .FirstOrDefault();

        reconciliation.OpeningStock = openingEntry != null
            ? (openingEntry.ManualOpeningLevel ?? openingEntry.SensorOpeningLevel ?? 0)
            : 0;

        reconciliation.ActualClosing = closingEntry != null
            ? (closingEntry.ManualClosingLevel ?? closingEntry.SensorClosingLevel ?? 0)
            : 0;

        reconciliation.CalculationSteps.Add($"Opening Stock: {reconciliation.OpeningStock:F2} L");
        reconciliation.CalculationSteps.Add($"Actual Closing Stock: {reconciliation.ActualClosing:F2} L");

        // Calculate transfers
        var transfersIn = transfers.Where(t => t.Direction == "In");
        reconciliation.TransfersIn = transfersIn.Sum(t => t.Amount ?? 0);
        reconciliation.TransfersInCount = transfersIn.Count();

        var transfersOut = transfers.Where(t => t.Direction == "Out");
        reconciliation.TransfersOut = transfersOut.Sum(t => t.Amount ?? 0);
        reconciliation.TransfersOutCount = transfersOut.Count();

        reconciliation.CalculationSteps.Add($"Transfers IN: +{reconciliation.TransfersIn:F2} L ({reconciliation.TransfersInCount} transactions)");
        reconciliation.CalculationSteps.Add($"Transfers OUT: -{reconciliation.TransfersOut:F2} L ({reconciliation.TransfersOutCount} transactions)");

        // Calculate dispensing from all sources
        var breakdown = new DispensingBreakdownDetailed();

        // Manual aggregate from TankStock
        var manualUsageEntries = stockEntries.Where(s => s.ManualCalculatedUsage.HasValue);
        breakdown.ManualAggregate = manualUsageEntries.Sum(s => s.ManualCalculatedUsage ?? 0);
        breakdown.ManualAggregateCount = manualUsageEntries.Count();

        // Sensor dispensing from VolumeHistory
        var sensorDispensing = volumeTransactions
            .Where(v => v.ChangeReasonId == (int)VolumeChangeReasonEnum.Dispensing);
        breakdown.SensorDispensing = sensorDispensing.Sum(v => Math.Abs(v.VolumeChange ?? 0));
        breakdown.SensorDispensingCount = sensorDispensing.Count();

        // Automated dispensing from VolumeHistory
        var automatedDispensing = volumeTransactions
            .Where(v => v.ChangeReasonId == (int)VolumeChangeReasonEnum.AutomatedDispensing);
        breakdown.AutomatedDispensing = automatedDispensing.Sum(v => Math.Abs(v.VolumeChange ?? 0));
        breakdown.AutomatedDispensingCount = automatedDispensing.Count();

        reconciliation.DispensingBreakdown = breakdown;

        reconciliation.CalculationSteps.Add($"Manual Dispensing: -{breakdown.ManualAggregate:F2} L ({breakdown.ManualAggregateCount} entries)");
        reconciliation.CalculationSteps.Add($"Sensor Dispensing: -{breakdown.SensorDispensing:F2} L ({breakdown.SensorDispensingCount} transactions)");
        reconciliation.CalculationSteps.Add($"Automated Dispensing: -{breakdown.AutomatedDispensing:F2} L ({breakdown.AutomatedDispensingCount} transactions)");
        reconciliation.CalculationSteps.Add($"Total Dispensing: -{breakdown.Total:F2} L");

        // Calculate adjustments and reconciliations if requested
        if (includeAllTransactionTypes)
        {
            var adjustments = volumeTransactions
                .Where(v => v.ChangeReasonId == (int)VolumeChangeReasonEnum.Adjustment);
            reconciliation.Adjustments = adjustments.Sum(v => v.VolumeChange ?? 0);
            reconciliation.AdjustmentCount = adjustments.Count();

            var reconciliations = volumeTransactions
                .Where(v => v.ChangeReasonId == (int)VolumeChangeReasonEnum.Reconciliation
                    || v.ChangeReasonId == (int)VolumeChangeReasonEnum.AutomatedReconciliation);
            reconciliation.Reconciliations = reconciliations.Sum(v => v.VolumeChange ?? 0);
            reconciliation.ReconciliationCount = reconciliations.Count();

            reconciliation.CalculationSteps.Add($"Adjustments: {(reconciliation.Adjustments >= 0 ? "+" : "")}{reconciliation.Adjustments:F2} L ({reconciliation.AdjustmentCount} transactions)");
            reconciliation.CalculationSteps.Add($"Reconciliations: {(reconciliation.Reconciliations >= 0 ? "+" : "")}{reconciliation.Reconciliations:F2} L ({reconciliation.ReconciliationCount} transactions)");
        }

        // Calculate deliveries
        var deliveries = volumeTransactions
            .Where(v => v.ChangeReasonId == (int)VolumeChangeReasonEnum.Delivery);
        reconciliation.Deliveries = deliveries.Sum(v => Math.Abs(v.VolumeChange ?? 0));
        reconciliation.DeliveryCount = deliveries.Count();

        if (reconciliation.DeliveryCount > 0)
        {
            reconciliation.CalculationSteps.Add($"Deliveries: +{reconciliation.Deliveries:F2} L ({reconciliation.DeliveryCount} transactions)");
        }

        // Calculate expected closing
        reconciliation.ExpectedClosing = reconciliation.OpeningStock
            + reconciliation.TransfersIn
            - reconciliation.TransfersOut
            + reconciliation.Deliveries
            - breakdown.Total
            + (includeAllTransactionTypes ? reconciliation.Adjustments : 0)
            + (includeAllTransactionTypes ? reconciliation.Reconciliations : 0);

        reconciliation.CalculationSteps.Add($"Expected Closing = {reconciliation.OpeningStock:F2} + {reconciliation.TransfersIn:F2} - {reconciliation.TransfersOut:F2} + {reconciliation.Deliveries:F2} - {breakdown.Total:F2}" +
            (includeAllTransactionTypes ? $" + {reconciliation.Adjustments:F2} + {reconciliation.Reconciliations:F2}" : ""));
        reconciliation.CalculationSteps.Add($"Expected Closing: {reconciliation.ExpectedClosing:F2} L");

        // Calculate variance
        reconciliation.Variance = reconciliation.ActualClosing - reconciliation.ExpectedClosing;
        reconciliation.VariancePercentage = reconciliation.ExpectedClosing != 0
            ? (Math.Abs(reconciliation.Variance) / Math.Abs(reconciliation.ExpectedClosing)) * 100
            : 0;

        reconciliation.CalculationSteps.Add($"Variance = {reconciliation.ActualClosing:F2} - {reconciliation.ExpectedClosing:F2} = {reconciliation.Variance:F2} L ({reconciliation.VariancePercentage:F2}%)");

        return reconciliation;
    }

    private List<DataQualityWarning> GenerateWarnings(
        List<TankStockEntry> stockEntries,
        List<VolumeHistoryTransaction> volumeTransactions,
        List<TransferTransaction> transfers,
        DiagnosticReconciliation reconciliation)
    {
        var warnings = new List<DataQualityWarning>();

        // Warning 1: No stock change but dispensing recorded
        if (Math.Abs(reconciliation.ActualClosing - reconciliation.OpeningStock) < 1
            && reconciliation.DispensingBreakdown.Total > 50)
        {
            warnings.Add(new DataQualityWarning
            {
                Severity = "critical",
                Category = "inconsistent",
                Message = "Stock unchanged but significant dispensing recorded",
                Details = $"Opening: {reconciliation.OpeningStock:F2}L, Closing: {reconciliation.ActualClosing:F2}L, " +
                          $"but {reconciliation.DispensingBreakdown.Total:F2}L dispensing recorded",
                SuggestedAction = "Verify closing stock reading or check for duplicate dispensing records"
            });
        }

        // Warning 2: Large variance
        if (Math.Abs(reconciliation.Variance) > 500 || Math.Abs(reconciliation.VariancePercentage) > 20)
        {
            warnings.Add(new DataQualityWarning
            {
                Severity = "critical",
                Category = "suspicious",
                Message = "Large variance detected",
                Details = $"Variance: {reconciliation.Variance:F2}L ({reconciliation.VariancePercentage:F2}%)",
                SuggestedAction = "Review all transactions in this period for accuracy"
            });
        }

        // Warning 3: No dispensing but stock decreased significantly
        if (reconciliation.DispensingBreakdown.Total == 0
            && (reconciliation.OpeningStock - reconciliation.ActualClosing) > 100)
        {
            warnings.Add(new DataQualityWarning
            {
                Severity = "critical",
                Category = "missing_data",
                Message = "Stock decreased but no dispensing recorded",
                Details = $"Stock dropped {(reconciliation.OpeningStock - reconciliation.ActualClosing):F2}L with zero dispensing",
                SuggestedAction = "Check if dispensing records are missing from TankVolumeHistory"
            });
        }

        // Warning 4: Missing opening or closing stock
        if (reconciliation.OpeningStock == 0)
        {
            warnings.Add(new DataQualityWarning
            {
                Severity = "warning",
                Category = "missing_data",
                Message = "No opening stock entry found",
                Details = "Period may be incomplete - missing opening stock",
                SuggestedAction = "Ensure opening stock entry exists for this period"
            });
        }

        if (reconciliation.ActualClosing == 0 && stockEntries.Any())
        {
            warnings.Add(new DataQualityWarning
            {
                Severity = "warning",
                Category = "missing_data",
                Message = "No closing stock entry found",
                Details = "Period may be incomplete - missing closing stock",
                SuggestedAction = "Ensure closing stock entry exists for this period"
            });
        }

        // Warning 5: Deleted records
        if (volumeTransactions.Any(v => v.IsDeleted == true))
        {
            var deletedCount = volumeTransactions.Count(v => v.IsDeleted == true);
            warnings.Add(new DataQualityWarning
            {
                Severity = "info",
                Category = "missing_data",
                Message = $"{deletedCount} deleted volume transactions found",
                Details = "Some transactions were soft-deleted and excluded from calculations",
                SuggestedAction = "Review deleted transactions if variance is unexpected"
            });
        }

        return warnings;
    }
}
