using System;
using System.Collections.Generic;
using FMS.Application.Common;
using MediatR;

namespace FMS.Application.Features.TankManagement.Queries;

/// <summary>
/// Query to get variance analysis data for a specific tank over a date range
/// </summary>
public record GetTankVarianceAnalysisQuery(
    int TankId,
    DateTime StartDate,
    DateTime EndDate,
    bool UseManualDispensing = false,
    bool UseCombinedDispensing = false
) : IRequest<FMSResponse<TankVarianceAnalysisResult>>;

/// <summary>
/// Result containing variance analysis data
/// </summary>
public class TankVarianceAnalysisResult
{
    public int TankId { get; set; }
    public string TankName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public List<DailyVarianceData> DailyData { get; set; } = new();
    public VarianceStatistics Statistics { get; set; } = new();
}

/// <summary>
/// Daily variance data point
/// </summary>
public class DailyVarianceData
{
    public DateTime Date { get; set; }
    public string DateString { get; set; } = string.Empty;

    // Stock levels
    public decimal ExpectedStock { get; set; }
    public decimal ActualStock { get; set; }

    // Variance metrics
    public decimal DailyVariance { get; set; }
    public decimal CumulativeVariance { get; set; }
    public decimal VariancePercent { get; set; }

    // Contributing factors
    public decimal DeliveryVolume { get; set; }
    public decimal DispensingVolume { get; set; }
    public decimal TransferIn { get; set; }
    public decimal TransferOut { get; set; }

    // Calculated expected dispensing
    public decimal ExpectedDispensing { get; set; }
}

/// <summary>
/// Summary statistics for the variance analysis period
/// </summary>
public class VarianceStatistics
{
    public decimal FinalCumulativeVariance { get; set; }
    public decimal TotalDelivery { get; set; }
    public decimal TotalDispensing { get; set; }
    public decimal AvgDailyVariance { get; set; }
    public decimal MaxVariance { get; set; }
    public decimal ExpectedClosingStock { get; set; }
    public decimal ActualClosingStock { get; set; }
    public decimal StockAccuracyPercent { get; set; }
    public int DaysAnalyzed { get; set; }
}
