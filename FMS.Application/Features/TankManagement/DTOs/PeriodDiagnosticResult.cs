using System;
using System.Collections.Generic;

namespace FMS.Application.Features.TankManagement.DTOs;

/// <summary>
/// Complete diagnostic data for a specific tank period
/// Combines all data sources for comprehensive analysis
/// </summary>
public class PeriodDiagnosticResult
{
    public int TankId { get; set; }
    public string TankName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    /// <summary>
    /// Tank stock entries in this period
    /// </summary>
    public List<TankStockEntry> StockEntries { get; set; } = new();

    /// <summary>
    /// All volume history transactions in this period
    /// </summary>
    public List<VolumeHistoryTransaction> VolumeTransactions { get; set; } = new();

    /// <summary>
    /// Transfer transactions in this period
    /// </summary>
    public List<TransferTransaction> Transfers { get; set; } = new();

    /// <summary>
    /// Calculated reconciliation summary
    /// </summary>
    public DiagnosticReconciliation Reconciliation { get; set; } = new();

    /// <summary>
    /// Data quality warnings
    /// </summary>
    public List<DataQualityWarning> Warnings { get; set; } = new();
}

/// <summary>
/// Tank stock entry detail
/// </summary>
public class TankStockEntry
{
    public int EntryId { get; set; }
    public DateTime EntryDate { get; set; }
    public string EntryType { get; set; } = string.Empty;
    public int EntryTypeId { get; set; }

    // Opening values
    public decimal? ManualOpeningLevel { get; set; }
    public decimal? SensorOpeningLevel { get; set; }
    public decimal? OpeningMeter { get; set; }

    // Closing values
    public decimal? ManualClosingLevel { get; set; }
    public decimal? SensorClosingLevel { get; set; }
    public decimal? ClosingMeter { get; set; }

    // Calculated fields
    public decimal? ManualAmount { get; set; }
    public decimal? ManualCalculatedUsage { get; set; }

    public string RecordedBy { get; set; } = string.Empty;
    public string Comment { get; set; } = string.Empty;
    public string ImportBatchId { get; set; } = string.Empty;
}

/// <summary>
/// Volume history transaction detail
/// </summary>
public class VolumeHistoryTransaction
{
    public int HistoryId { get; set; }
    public DateTime Timestamp { get; set; }
    public string ChangeReason { get; set; } = string.Empty;
    public int ChangeReasonId { get; set; }
    public decimal? VolumeChange { get; set; }
    public decimal? VolumeBefore { get; set; }
    public decimal? VolumeAfter { get; set; }
    public string Source { get; set; } = string.Empty;
    public string RecordedBy { get; set; } = string.Empty;
    public string TransactionReference { get; set; } = string.Empty;
    public bool? IsDeleted { get; set; }
}

/// <summary>
/// Transfer transaction detail
/// </summary>
public class TransferTransaction
{
    public int TransferId { get; set; }
    public DateTime? TransferDate { get; set; }
    public int? SourceTankId { get; set; }
    public string SourceTankName { get; set; } = string.Empty;
    public int? DestinationTankId { get; set; }
    public string DestinationTankName { get; set; } = string.Empty;
    public decimal? Amount { get; set; }
    public string Direction { get; set; } = string.Empty; // "In" or "Out"
    public string RecordedBy { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public bool IsDeleted { get; set; }
}

/// <summary>
/// Diagnostic reconciliation calculation
/// </summary>
public class DiagnosticReconciliation
{
    // Opening/Closing
    public decimal OpeningStock { get; set; }
    public decimal ActualClosing { get; set; }

    // Transfers
    public decimal TransfersIn { get; set; }
    public int TransfersInCount { get; set; }
    public decimal TransfersOut { get; set; }
    public int TransfersOutCount { get; set; }

    // Dispensing breakdown by source
    public DispensingBreakdownDetailed DispensingBreakdown { get; set; } = new();

    // Adjustments and reconciliations
    public decimal Adjustments { get; set; }
    public int AdjustmentCount { get; set; }
    public decimal Reconciliations { get; set; }
    public int ReconciliationCount { get; set; }

    // Deliveries
    public decimal Deliveries { get; set; }
    public int DeliveryCount { get; set; }

    // Calculation
    public decimal ExpectedClosing { get; set; }
    public decimal Variance { get; set; }
    public decimal VariancePercentage { get; set; }

    /// <summary>
    /// Step-by-step calculation breakdown
    /// </summary>
    public List<string> CalculationSteps { get; set; } = new();
}

/// <summary>
/// Detailed dispensing breakdown
/// </summary>
public class DispensingBreakdownDetailed
{
    // From TankStock
    public decimal ManualAggregate { get; set; }
    public int ManualAggregateCount { get; set; }

    // From TankVolumeHistory - Dispensing
    public decimal SensorDispensing { get; set; }
    public int SensorDispensingCount { get; set; }

    // From TankVolumeHistory - AutomatedDispensing
    public decimal AutomatedDispensing { get; set; }
    public int AutomatedDispensingCount { get; set; }

    // Total
    public decimal Total => ManualAggregate + SensorDispensing + AutomatedDispensing;
    public int TotalCount => ManualAggregateCount + SensorDispensingCount + AutomatedDispensingCount;
}

/// <summary>
/// Data quality warning
/// </summary>
public class DataQualityWarning
{
    public string Severity { get; set; } = string.Empty; // "info", "warning", "critical"
    public string Category { get; set; } = string.Empty; // "missing_data", "inconsistent", "suspicious"
    public string Message { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public DateTime? RelatedTimestamp { get; set; }
    public string SuggestedAction { get; set; } = string.Empty;
}
