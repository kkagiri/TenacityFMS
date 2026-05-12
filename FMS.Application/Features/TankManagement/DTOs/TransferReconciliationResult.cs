using System;
using System.Collections.Generic;

namespace FMS.Application.Features.TankManagement.DTOs;

/// <summary>
/// Result of transfer-based reconciliation analysis
/// </summary>
public class TransferReconciliationResult
{
    public int TankId { get; set; }
    public string TankName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    /// <summary>
    /// List of reconciliation periods (between consecutive stock entries)
    /// </summary>
    public List<ReconciliationPeriod> Periods { get; set; } = new();

    /// <summary>
    /// Summary statistics across all periods
    /// </summary>
    public ReconciliationSummary Summary { get; set; } = new();
}

/// <summary>
/// Represents a single reconciliation period between stock entries
/// </summary>
public class ReconciliationPeriod
{
    public int PeriodNumber { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    /// <summary>
    /// Opening stock at start of period
    /// </summary>
    public decimal OpeningStock { get; set; }

    /// <summary>
    /// Actual closing stock at end of period
    /// </summary>
    public decimal ActualClosing { get; set; }

    /// <summary>
    /// Expected closing based on calculation
    /// </summary>
    public decimal ExpectedClosing { get; set; }

    /// <summary>
    /// Variance (Actual - Expected)
    /// </summary>
    public decimal Variance { get; set; }

    /// <summary>
    /// Variance as percentage of expected
    /// </summary>
    public decimal VariancePercentage { get; set; }

    /// <summary>
    /// Whether variance is within acceptable threshold
    /// </summary>
    public bool IsWithinThreshold { get; set; }

    /// <summary>
    /// Severity: 'acceptable', 'moderate', 'high'
    /// </summary>
    public string Severity { get; set; } = string.Empty;

    /// <summary>
    /// Total transfers in during this period
    /// </summary>
    public decimal TransfersIn { get; set; }

    /// <summary>
    /// Number of transfer-in transactions
    /// </summary>
    public int TransfersInCount { get; set; }

    /// <summary>
    /// Total transfers out during this period
    /// </summary>
    public decimal TransfersOut { get; set; }

    /// <summary>
    /// Number of transfer-out transactions
    /// </summary>
    public int TransfersOutCount { get; set; }

    /// <summary>
    /// Total dispensing during this period (all sources)
    /// </summary>
    public decimal TotalDispensing { get; set; }

    /// <summary>
    /// Breakdown of dispensing by source
    /// </summary>
    public DispensingBreakdown DispensingDetails { get; set; } = new();

    /// <summary>
    /// Detailed transfer transactions (only if requested)
    /// </summary>
    public List<TransferDetail>? TransferDetails { get; set; }
}

/// <summary>
/// Details of a single transfer transaction
/// </summary>
public class TransferDetail
{
    public int TransferId { get; set; }
    public DateTime TransferDate { get; set; }
    public int? SourceTankId { get; set; }
    public string SourceTankName { get; set; } = string.Empty;
    public int? DestinationTankId { get; set; }
    public string DestinationTankName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string RecordedBy { get; set; } = string.Empty;
    public string Direction { get; set; } = string.Empty; // "In" or "Out"
}

/// <summary>
/// Summary statistics across all reconciliation periods
/// </summary>
public class ReconciliationSummary
{
    /// <summary>
    /// Total number of periods analyzed
    /// </summary>
    public int TotalPeriods { get; set; }

    /// <summary>
    /// Number of periods within acceptable variance
    /// </summary>
    public int PeriodsWithinThreshold { get; set; }

    /// <summary>
    /// Number of periods with moderate variance
    /// </summary>
    public int PeriodsWithModerateVariance { get; set; }

    /// <summary>
    /// Number of periods with high variance
    /// </summary>
    public int PeriodsWithHighVariance { get; set; }

    /// <summary>
    /// Total transfers in across all periods
    /// </summary>
    public decimal TotalTransfersIn { get; set; }

    /// <summary>
    /// Total transfers out across all periods
    /// </summary>
    public decimal TotalTransfersOut { get; set; }

    /// <summary>
    /// Total dispensing across all periods
    /// </summary>
    public decimal TotalDispensing { get; set; }

    /// <summary>
    /// Average variance across all periods
    /// </summary>
    public decimal AverageVariance { get; set; }

    /// <summary>
    /// Average variance percentage across all periods
    /// </summary>
    public decimal AverageVariancePercentage { get; set; }

    /// <summary>
    /// Largest positive variance
    /// </summary>
    public decimal LargestPositiveVariance { get; set; }

    /// <summary>
    /// Largest negative variance
    /// </summary>
    public decimal LargestNegativeVariance { get; set; }

    /// <summary>
    /// Period number with largest variance (absolute)
    /// </summary>
    public int? PeriodWithLargestVariance { get; set; }

    /// <summary>
    /// Dispensing breakdown totals
    /// </summary>
    public DispensingBreakdown TotalDispensingBreakdown { get; set; } = new();

    /// <summary>
    /// Variance thresholds used for analysis
    /// </summary>
    public VarianceThresholds Thresholds { get; set; } = new();
}
