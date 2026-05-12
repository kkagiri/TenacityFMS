using System;

namespace FMS.Application.Features.TankManagement.DTOs;

/// <summary>
/// Result of expected stock calculation for validation
/// </summary>
public class ExpectedStockResult
{
    public int TankId { get; set; }
    public string TankName { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string StockType { get; set; } = string.Empty;

    /// <summary>
    /// Calculated expected stock value
    /// </summary>
    public decimal ExpectedStock { get; set; }

    /// <summary>
    /// Breakdown of calculation components
    /// </summary>
    public StockCalculationBreakdown Breakdown { get; set; } = new();

    /// <summary>
    /// Variance thresholds from system configuration
    /// </summary>
    public VarianceThresholds Thresholds { get; set; } = new();

    /// <summary>
    /// Whether a previous stock entry was found
    /// </summary>
    public bool HasPreviousStock { get; set; }

    /// <summary>
    /// Message explaining the calculation or any issues
    /// </summary>
    public string Message { get; set; } = string.Empty;
}

/// <summary>
/// Breakdown of stock calculation components
/// </summary>
public class StockCalculationBreakdown
{
    public decimal PreviousClosingStock { get; set; }
    public DateTime? PreviousClosingDate { get; set; }
    public decimal DeliveriesSum { get; set; }
    public int DeliveriesCount { get; set; }
    public decimal TransfersInSum { get; set; }
    public int TransfersInCount { get; set; }
    public decimal TransfersOutSum { get; set; }
    public int TransfersOutCount { get; set; }

    /// <summary>
    /// Total dispensing from all sources
    /// </summary>
    public decimal TotalDispensing { get; set; }

    /// <summary>
    /// Dispensing breakdown by source
    /// </summary>
    public DispensingBreakdown DispensingDetails { get; set; } = new();

    /// <summary>
    /// Calculation formula as string for display
    /// </summary>
    public string Formula => $"Previous ({PreviousClosingStock:F2}) + Deliveries ({DeliveriesSum:F2}) + Transfers In ({TransfersInSum:F2}) - Transfers Out ({TransfersOutSum:F2}) - Dispensing ({TotalDispensing:F2})";
}

/// <summary>
/// Breakdown of dispensing by source
/// </summary>
public class DispensingBreakdown
{
    /// <summary>
    /// Manual aggregated dispensing from tankstock table
    /// </summary>
    public decimal ManualAggregate { get; set; }

    /// <summary>
    /// Sensor dispensing from tankvolumehistory (ChangeReason = Dispensing)
    /// </summary>
    public decimal SensorDispensing { get; set; }

    /// <summary>
    /// Automated dispensing from tankvolumehistory (ChangeReason = AutomatedDispensing)
    /// </summary>
    public decimal AutomatedDispensing { get; set; }

    /// <summary>
    /// Total dispensing (sum of all sources)
    /// </summary>
    public decimal Total => ManualAggregate + SensorDispensing + AutomatedDispensing;
}

/// <summary>
/// Variance threshold configuration
/// </summary>
public class VarianceThresholds
{
    /// <summary>
    /// Acceptable variance as percentage (e.g., 5 for 5%)
    /// </summary>
    public decimal PercentageThreshold { get; set; }

    /// <summary>
    /// Acceptable absolute variance in liters
    /// </summary>
    public decimal AbsoluteLitersThreshold { get; set; }

    /// <summary>
    /// Check if variance is within acceptable limits
    /// </summary>
    public bool IsWithinThreshold(decimal expectedStock, decimal actualStock)
    {
        if (expectedStock == 0) return true; // Avoid division by zero

        var variance = Math.Abs(actualStock - expectedStock);
        var percentageVariance = (variance / expectedStock) * 100;

        return variance <= AbsoluteLitersThreshold || percentageVariance <= PercentageThreshold;
    }

    /// <summary>
    /// Get severity level for the variance
    /// </summary>
    public string GetVarianceSeverity(decimal expectedStock, decimal actualStock)
    {
        if (expectedStock == 0) return "unknown";

        var variance = Math.Abs(actualStock - expectedStock);
        var percentageVariance = (variance / expectedStock) * 100;

        if (variance <= AbsoluteLitersThreshold || percentageVariance <= PercentageThreshold)
            return "acceptable"; // Green

        if (percentageVariance <= PercentageThreshold * 2)
            return "moderate"; // Yellow

        return "high"; // Red
    }
}
