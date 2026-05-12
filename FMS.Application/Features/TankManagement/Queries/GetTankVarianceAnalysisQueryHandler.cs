using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TankVolumeHistoryEntity = FMS.Domain.Entities.Features.TankStockManagement.TankVolumeHistory;

namespace FMS.Application.Features.TankManagement.Queries;

/// <summary>
/// Handler for GetTankVarianceAnalysisQuery
/// Calculates variance between expected and actual stock levels over a date range
/// </summary>
public class GetTankVarianceAnalysisQueryHandler
    : IRequestHandler<GetTankVarianceAnalysisQuery, FMSResponse<TankVarianceAnalysisResult>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetTankVarianceAnalysisQueryHandler> _logger;

    public GetTankVarianceAnalysisQueryHandler(
        GpsdataContext context,
        ILogger<GetTankVarianceAnalysisQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<TankVarianceAnalysisResult>> Handle(
        GetTankVarianceAnalysisQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Validate inputs
            if (request.StartDate > request.EndDate)
            {
                return FMSResponse<TankVarianceAnalysisResult>.ValidationFailed(
                    new List<string> { "Start date must be before or equal to end date" });
            }

            // Allow end date to be today or in the past (convert to UTC for comparison)
            var endDateUtc = request.EndDate.Kind == DateTimeKind.Local
                ? request.EndDate.ToUniversalTime()
                : request.EndDate;
            var nowUtc = DateTime.UtcNow;

            // Compare dates only, allowing the full day
            if (endDateUtc.Date > nowUtc.Date)
            {
                return FMSResponse<TankVarianceAnalysisResult>.ValidationFailed(
                    new List<string> { $"End date cannot be in the future. End date: {endDateUtc.Date:yyyy-MM-dd}, Current date: {nowUtc.Date:yyyy-MM-dd}" });
            }

            // Get tank information
            var tank = await _context.Tanks
                .Where(t => t.Id == request.TankId)
                .Select(t => new { t.Id, t.Name })
                .FirstOrDefaultAsync(cancellationToken);

            if (tank == null)
            {
                return FMSResponse<TankVarianceAnalysisResult>.NotFound($"Tank with ID {request.TankId} not found");
            }

            // Get data based on dispensing mode selection
            List<Domain.Entities.Tankstock> tankStockData = null;
            List<TankVolumeHistoryEntity> volumeHistoryData = null;

            if (request.UseCombinedDispensing)
            {
                // COMBINED MODE: Use TankVolumeHistory as primary, fill gaps with TankStock
                volumeHistoryData = await _context.TankVolumeHistories
                    .Where(tvh => tvh.TankId == request.TankId
                        && tvh.Timestamp >= request.StartDate
                        && tvh.Timestamp <= request.EndDate)
                    .OrderBy(tvh => tvh.Timestamp)
                    .ToListAsync(cancellationToken);

                tankStockData = await _context.Tankstocks
                    .Where(ts => ts.TankId == request.TankId
                        && ts.EntryDate >= request.StartDate
                        && ts.EntryDate <= request.EndDate)
                    .OrderBy(ts => ts.EntryDate)
                    .ToListAsync(cancellationToken);
            }
            else if (request.UseManualDispensing)
            {
                // MANUAL MODE: Use TankStock for dispensing, TankVolumeHistory for non-dispensing
                volumeHistoryData = await _context.TankVolumeHistories
                    .Where(tvh => tvh.TankId == request.TankId
                        && tvh.Timestamp >= request.StartDate
                        && tvh.Timestamp <= request.EndDate
                        && tvh.ChangeReason != Domain.Entities.enums.VolumeChangeReasonEnum.Dispensing
                        && tvh.ChangeReason != Domain.Entities.enums.VolumeChangeReasonEnum.AutomatedDispensing)
                    .OrderBy(tvh => tvh.Timestamp)
                    .ToListAsync(cancellationToken);

                tankStockData = await _context.Tankstocks
                    .Where(ts => ts.TankId == request.TankId
                        && ts.EntryDate >= request.StartDate
                        && ts.EntryDate <= request.EndDate)
                    .OrderBy(ts => ts.EntryDate)
                    .ToListAsync(cancellationToken);
            }
            else
            {
                // DEFAULT MODE: Use only TankStock (current behavior)
                tankStockData = await _context.Tankstocks
                    .Where(ts => ts.TankId == request.TankId
                        && ts.EntryDate >= request.StartDate
                        && ts.EntryDate <= request.EndDate)
                    .OrderBy(ts => ts.EntryDate)
                    .ToListAsync(cancellationToken);
            }

            // Check if we have any data
            bool hasData = (tankStockData?.Count > 0) || (volumeHistoryData?.Count > 0);
            if (!hasData)
            {
                _logger.LogWarning("No tank stock data found for Tank {TankId} between {StartDate} and {EndDate}",
                    request.TankId, request.StartDate, request.EndDate);

                return FMSResponse<TankVarianceAnalysisResult>.Success(
                    new TankVarianceAnalysisResult
                    {
                        TankId = tank.Id,
                        TankName = tank.Name,
                        StartDate = request.StartDate,
                        EndDate = request.EndDate,
                        DailyData = new List<DailyVarianceData>(),
                        Statistics = new VarianceStatistics()
                    },
                    "No data available for the selected date range");
            }

            // Prepare daily data list - get all unique dates from both sources
            var allDates = new HashSet<DateTime>();
            if (tankStockData != null)
                allDates.UnionWith(tankStockData.Select(ts => ts.EntryDate.Date));
            if (volumeHistoryData != null)
                allDates.UnionWith(volumeHistoryData.Select(vh => vh.Timestamp.Date));

            List<DailyVarianceData> dailyDataList = new List<DailyVarianceData>();
            decimal cumulativeVariance = 0;

            foreach (var dayDate in allDates.OrderBy(d => d))
            {
                decimal openingStock = 0, actualClosing = 0, expectedClosing = 0;
                decimal deliveryVolume = 0, dispensingVolume = 0, transferInVolume = 0, transferOutVolume = 0;

                // Get TankStock data for this day
                var dayTankStockData = tankStockData?.Where(ts => ts.EntryDate.Date == dayDate).ToList();
                var dayVolumeData = volumeHistoryData?.Where(vh => vh.Timestamp.Date == dayDate).ToList();

                // Get opening/closing stock from TankStock (always primary source for these)
                var openingEntry = dayTankStockData?.FirstOrDefault(ts => ts.EntryType == Domain.Entities.enums.VolumeChangeReasonEnum.OpeningStock);
                var closingEntry = dayTankStockData?.FirstOrDefault(ts => ts.EntryType == Domain.Entities.enums.VolumeChangeReasonEnum.ClosingStock);

                if (openingEntry == null || closingEntry == null)
                    continue;

                openingStock = openingEntry.ManualOpeningLevel ?? openingEntry.SensorOpeningLevel ?? 0;
                actualClosing = closingEntry.ManualClosingLevel ?? closingEntry.SensorClosingLevel ?? 0;
                expectedClosing = closingEntry.ExpectedClosingLevel ?? actualClosing;

                // Calculate volumes based on dispensing mode
                if (request.UseCombinedDispensing && dayVolumeData != null)
                {
                    // Use TankVolumeHistory, fill gaps with TankStock
                    deliveryVolume = dayVolumeData.Where(vh => vh.ChangeReason == Domain.Entities.enums.VolumeChangeReasonEnum.Delivery)
                        .Sum(vh => Math.Abs(vh.VolumeChange ?? 0));
                    if (deliveryVolume == 0)
                    {
                        deliveryVolume = dayTankStockData?.Where(ts => ts.EntryType == Domain.Entities.enums.VolumeChangeReasonEnum.Delivery)
                            .Sum(ts => Math.Abs((ts.ManualClosingLevel ?? ts.SensorClosingLevel ?? 0) - (ts.ManualOpeningLevel ?? ts.SensorOpeningLevel ?? 0))) ?? 0;
                    }

                    dispensingVolume = dayVolumeData
                        .Where(vh => vh.ChangeReason == Domain.Entities.enums.VolumeChangeReasonEnum.Dispensing ||
                                     vh.ChangeReason == Domain.Entities.enums.VolumeChangeReasonEnum.AutomatedDispensing)
                        .Sum(vh => Math.Abs(vh.VolumeChange ?? 0));
                    if (dispensingVolume == 0)
                    {
                        dispensingVolume = dayTankStockData?.Where(ts => ts.EntryType == Domain.Entities.enums.VolumeChangeReasonEnum.Dispensing)
                            .Sum(ts => Math.Abs((ts.ManualClosingLevel ?? ts.SensorClosingLevel ?? 0) - (ts.ManualOpeningLevel ?? ts.SensorOpeningLevel ?? 0))) ?? 0;
                    }

                    transferInVolume = dayVolumeData.Where(vh => vh.ChangeReason == Domain.Entities.enums.VolumeChangeReasonEnum.TransferIn)
                        .Sum(vh => Math.Abs(vh.VolumeChange ?? 0));
                    if (transferInVolume == 0)
                    {
                        transferInVolume = dayTankStockData?.Where(ts => ts.EntryType == Domain.Entities.enums.VolumeChangeReasonEnum.TransferIn)
                            .Sum(ts => Math.Abs((ts.ManualClosingLevel ?? ts.SensorClosingLevel ?? 0) - (ts.ManualOpeningLevel ?? ts.SensorOpeningLevel ?? 0))) ?? 0;
                    }

                    transferOutVolume = dayVolumeData.Where(vh => vh.ChangeReason == Domain.Entities.enums.VolumeChangeReasonEnum.TransferOut)
                        .Sum(vh => Math.Abs(vh.VolumeChange ?? 0));
                    if (transferOutVolume == 0)
                    {
                        transferOutVolume = dayTankStockData?.Where(ts => ts.EntryType == Domain.Entities.enums.VolumeChangeReasonEnum.TransferOut)
                            .Sum(ts => Math.Abs((ts.ManualClosingLevel ?? ts.SensorClosingLevel ?? 0) - (ts.ManualOpeningLevel ?? ts.SensorOpeningLevel ?? 0))) ?? 0;
                    }
                }
                else if (request.UseManualDispensing && dayVolumeData != null)
                {
                    // Use TankStock for dispensing, TankVolumeHistory for others
                    dispensingVolume = dayTankStockData?.Where(ts => ts.EntryType == Domain.Entities.enums.VolumeChangeReasonEnum.Dispensing)
                        .Sum(ts => Math.Abs((ts.ManualClosingLevel ?? ts.SensorClosingLevel ?? 0) - (ts.ManualOpeningLevel ?? ts.SensorOpeningLevel ?? 0))) ?? 0;

                    deliveryVolume = dayVolumeData.Where(vh => vh.ChangeReason == Domain.Entities.enums.VolumeChangeReasonEnum.Delivery)
                        .Sum(vh => Math.Abs(vh.VolumeChange ?? 0));

                    transferInVolume = dayVolumeData.Where(vh => vh.ChangeReason == Domain.Entities.enums.VolumeChangeReasonEnum.TransferIn)
                        .Sum(vh => Math.Abs(vh.VolumeChange ?? 0));

                    transferOutVolume = dayVolumeData.Where(vh => vh.ChangeReason == Domain.Entities.enums.VolumeChangeReasonEnum.TransferOut)
                        .Sum(vh => Math.Abs(vh.VolumeChange ?? 0));
                }
                else
                {
                    // DEFAULT MODE: Use only TankStock
                    deliveryVolume = dayTankStockData?.Where(ts => ts.EntryType == Domain.Entities.enums.VolumeChangeReasonEnum.Delivery)
                        .Sum(ts => Math.Abs((ts.ManualClosingLevel ?? ts.SensorClosingLevel ?? 0) - (ts.ManualOpeningLevel ?? ts.SensorOpeningLevel ?? 0))) ?? 0;

                    dispensingVolume = dayTankStockData?.Where(ts => ts.EntryType == Domain.Entities.enums.VolumeChangeReasonEnum.Dispensing)
                        .Sum(ts => Math.Abs((ts.ManualClosingLevel ?? ts.SensorClosingLevel ?? 0) - (ts.ManualOpeningLevel ?? ts.SensorOpeningLevel ?? 0))) ?? 0;

                    transferInVolume = dayTankStockData?.Where(ts => ts.EntryType == Domain.Entities.enums.VolumeChangeReasonEnum.TransferIn)
                        .Sum(ts => Math.Abs((ts.ManualClosingLevel ?? ts.SensorClosingLevel ?? 0) - (ts.ManualOpeningLevel ?? ts.SensorOpeningLevel ?? 0))) ?? 0;

                    transferOutVolume = dayTankStockData?.Where(ts => ts.EntryType == Domain.Entities.enums.VolumeChangeReasonEnum.TransferOut)
                        .Sum(ts => Math.Abs((ts.ManualClosingLevel ?? ts.SensorClosingLevel ?? 0) - (ts.ManualOpeningLevel ?? ts.SensorOpeningLevel ?? 0))) ?? 0;
                }

                // Daily variance = Actual - Expected
                decimal dailyVariance = actualClosing - expectedClosing;
                cumulativeVariance += dailyVariance;

                // Calculate variance percentage
                decimal variancePercent = expectedClosing != 0 ? dailyVariance / expectedClosing * 100 : 0;

                var dailyData = new DailyVarianceData
                {
                    Date = dayDate,
                    DateString = dayDate.ToString("MMM dd"),
                    ExpectedStock = expectedClosing,
                    ActualStock = actualClosing,
                    DailyVariance = dailyVariance,
                    CumulativeVariance = cumulativeVariance,
                    VariancePercent = variancePercent,
                    DeliveryVolume = deliveryVolume,
                    DispensingVolume = dispensingVolume,
                    TransferIn = transferInVolume,
                    TransferOut = transferOutVolume,
                    ExpectedDispensing = dispensingVolume
                };

                dailyDataList.Add(dailyData);
            }

            // Calculate statistics
            var statistics = new VarianceStatistics
            {
                FinalCumulativeVariance = cumulativeVariance,
                TotalDelivery = dailyDataList.Sum(d => d.DeliveryVolume),
                TotalDispensing = dailyDataList.Sum(d => d.DispensingVolume),
                AvgDailyVariance = dailyDataList.Count > 0
                    ? dailyDataList.Average(d => Math.Abs(d.DailyVariance))
                    : 0,
                MaxVariance = dailyDataList.Count > 0
                    ? dailyDataList.Max(d => Math.Abs(d.CumulativeVariance))
                    : 0,
                ExpectedClosingStock = dailyDataList.LastOrDefault()?.ExpectedStock ?? 0,
                ActualClosingStock = dailyDataList.LastOrDefault()?.ActualStock ?? 0,
                DaysAnalyzed = dailyDataList.Count
            };

            // Calculate stock accuracy percentage
            if (statistics.ExpectedClosingStock != 0)
            {
                statistics.StockAccuracyPercent =
                    (statistics.ActualClosingStock / statistics.ExpectedClosingStock) * 100;
            }

            var result = new TankVarianceAnalysisResult
            {
                TankId = tank.Id,
                TankName = tank.Name,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                DailyData = dailyDataList,
                Statistics = statistics
            };

            _logger.LogInformation(
                "Variance analysis completed for Tank {TankId} ({TankName}). Days analyzed: {Days}, Final cumulative variance: {Variance}L",
                tank.Id, tank.Name, dailyDataList.Count, cumulativeVariance);

            return FMSResponse<TankVarianceAnalysisResult>.Success(
                result,
                $"Variance analysis completed for {dailyDataList.Count} days");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating variance analysis for Tank {TankId}", request.TankId);
            return FMSResponse<TankVarianceAnalysisResult>.Failed(
                $"Failed to calculate variance analysis: {ex.Message}");
        }
    }
}
