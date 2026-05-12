using FMS.Application.Common;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;

namespace FMS.Application.Features.TankManagement.Queries;

/// <summary>
/// Query to analyze tank stock behavior between delivery cycles
/// Supports single tank or multiple tanks for site-level analysis
/// </summary>
public record GetDeliveryCycleAnalysisQuery(
    int? TankId,  // Single tank ID (for backward compatibility)
    List<int>? TankIds,  // Multiple tank IDs for site-level analysis
    DateTime StartDate,
    DateTime EndDate,
    DeliveryCycleAnalysisType AnalysisType = DeliveryCycleAnalysisType.BetweenDeliveries,
    bool UseManualDispensing = false,
    bool UseCombinedDispensing = false
) : IRequest<FMSResponse<DeliveryCycleAnalysisResult>>
{
    /// <summary>
    /// Gets the effective tank IDs to analyze (supports both single and multiple tanks)
    /// </summary>
    public List<int> GetEffectiveTankIds()
    {
        if (TankIds?.Any() == true)
            return TankIds;

        if (TankId.HasValue)
            return new List<int> { TankId.Value };

        return new List<int>();
    }
};

/// <summary>
/// Type of cycle analysis to perform
/// </summary>
public enum DeliveryCycleAnalysisType
{
    BetweenDeliveries,  // Analyze each delivery-to-delivery cycle
    Monthly,             // Analyze full month cycles
    UntilNextDelivery,  // From opening to next delivery only
    Custom              // User-defined cycle
}

/// <summary>
/// Result containing all delivery cycle analysis data
/// </summary>
public class DeliveryCycleAnalysisResult
{
    public int? TankId { get; set; }  // Null for multi-tank analysis
    public List<int>? TankIds { get; set; }  // Set for multi-tank analysis
    public string TankName { get; set; } = string.Empty;  // Or "Multiple Tanks" for multi-tank
    public DeliveryCycleAnalysisType AnalysisType { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public List<DeliveryCycle> Cycles { get; set; } = new();
    public CycleSummary Summary { get; set; } = new();
}

/// <summary>
/// Individual delivery cycle data
/// </summary>
public class DeliveryCycle
{
    public int CycleNumber { get; set; }
    public DateTime CycleStartDate { get; set; }
    public DateTime CycleEndDate { get; set; }
    public int DaysInCycle { get; set; }

    // Stock Levels
    public decimal OpeningStock { get; set; }
    public decimal DeliveryReceived { get; set; }
    public decimal StockAfterDelivery { get; set; }
    public decimal ActualClosing { get; set; }
    public decimal ExpectedClosing { get; set; }

    // Transactions
    public decimal TotalDispensing { get; set; }
    public decimal TotalTransferOut { get; set; }
    public decimal TotalTransferIn { get; set; }

    // Variance Analysis
    public decimal CycleVariance { get; set; }
    public decimal VariancePercent { get; set; }

    // Consumption Rates
    public decimal ConsumptionPerDay { get; set; }
    public decimal ConsumptionPerMonth { get; set; }  // Projected based on daily rate
    public decimal ActualMonthlyConsumption { get; set; }  // If cycle is full month

    // Forecasting
    public decimal DaysToStockout { get; set; }
    public decimal StockTurnoverRate { get; set; }
    public decimal AverageStockLevel { get; set; }

    // Delivery Details
    public List<DeliveryDetail> DeliveryDetails { get; set; } = new();
}

/// <summary>
/// Details of a specific delivery within a cycle
/// </summary>
public class DeliveryDetail
{
    public DateTime Date { get; set; }
    public decimal Volume { get; set; }
    public decimal BeforeDelivery { get; set; }
    public decimal AfterDelivery { get; set; }
    public string DeliveryReference { get; set; } = string.Empty;
}

/// <summary>
/// Summary statistics across all cycles
/// </summary>
public class CycleSummary
{
    public int TotalCycles { get; set; }
    public int TotalDeliveries { get; set; }
    public decimal TotalDeliveryVolume { get; set; }
    public decimal TotalDispensing { get; set; }
    public decimal TotalVariance { get; set; }

    // Consumption Rates (Averages)
    public decimal AverageConsumptionPerDay { get; set; }
    public decimal AverageConsumptionPerMonth { get; set; }

    // Cycle Metrics
    public double AverageCycleLength { get; set; }
    public decimal AverageStockTurnover { get; set; }
    public decimal OverallVariancePercent { get; set; }

    // Min/Max Analysis
    public decimal MinConsumptionPerDay { get; set; }
    public decimal MaxConsumptionPerDay { get; set; }
    public decimal MinDaysToStockout { get; set; }
    public decimal MaxDaysToStockout { get; set; }
}
