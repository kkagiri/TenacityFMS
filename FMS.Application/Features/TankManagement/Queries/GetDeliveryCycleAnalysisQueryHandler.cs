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
/// Handler for GetDeliveryCycleAnalysisQuery
/// Analyzes tank stock behavior between delivery cycles with consumption rate tracking
/// </summary>
public class GetDeliveryCycleAnalysisQueryHandler
    : IRequestHandler<GetDeliveryCycleAnalysisQuery, FMSResponse<DeliveryCycleAnalysisResult>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetDeliveryCycleAnalysisQueryHandler> _logger;

    public GetDeliveryCycleAnalysisQueryHandler(
        GpsdataContext context,
        ILogger<GetDeliveryCycleAnalysisQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<DeliveryCycleAnalysisResult>> Handle(
        GetDeliveryCycleAnalysisQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Validate inputs
            if (request.StartDate > request.EndDate)
            {
                return FMSResponse<DeliveryCycleAnalysisResult>.ValidationFailed(
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
                return FMSResponse<DeliveryCycleAnalysisResult>.ValidationFailed(
                    new List<string> { $"End date cannot be in the future. End date: {endDateUtc.Date:yyyy-MM-dd}, Current date: {nowUtc.Date:yyyy-MM-dd}" });
            }

            // Get effective tank IDs (single or multiple)
            var tankIds = request.GetEffectiveTankIds();

            if (!tankIds.Any())
            {
                return FMSResponse<DeliveryCycleAnalysisResult>.ValidationFailed(
                    new List<string> { "At least one tank ID must be provided" });
            }

            // Get tank information
            var tanks = await _context.Tanks
                .Where(t => tankIds.Contains(t.Id))
                .Select(t => new { t.Id, t.Name })
                .ToListAsync(cancellationToken);

            if (!tanks.Any())
            {
                return FMSResponse<DeliveryCycleAnalysisResult>.NotFound(
                    $"No tanks found with the provided IDs");
            }

            var tankName = tankIds.Count == 1
                ? tanks.First().Name
                : $"Multiple Tanks ({tankIds.Count})";

            // Get data based on dispensing mode selection FOR ALL TANKS
            List<Domain.Entities.Tankstock> tankStockData;
            List<TankVolumeHistoryEntity> volumeHistoryData = null;

            if (request.UseCombinedDispensing)
            {
                // COMBINED MODE: Use TankVolumeHistory as primary, fill gaps with TankStock
                // Get ALL data from TankVolumeHistory for all change reasons
                volumeHistoryData = await _context.TankVolumeHistories
                    .Where(tvh => tvh.TankId.HasValue && tankIds.Contains(tvh.TankId.Value)
                        && tvh.Timestamp >= request.StartDate
                        && tvh.Timestamp <= request.EndDate)
                    .OrderBy(tvh => tvh.TankId)
                    .ThenBy(tvh => tvh.Timestamp)
                    .ThenBy(tvh => tvh.ChangeReason)
                    .ToListAsync(cancellationToken);

                // Get ALL TankStock data to fill gaps
                tankStockData = await _context.Tankstocks
                    .Where(ts => tankIds.Contains(ts.TankId)
                        && ts.EntryDate >= request.StartDate
                        && ts.EntryDate <= request.EndDate)
                    .OrderBy(ts => ts.TankId)
                    .ThenBy(ts => ts.EntryDate)
                    .ThenBy(ts => ts.EntryType)
                    .ToListAsync(cancellationToken);
            }
            else if (request.UseManualDispensing)
            {
                // MANUAL MODE: Use TankStock for dispensing, TankVolumeHistory for non-dispensing
                // Get non-dispensing data from TankVolumeHistory
                volumeHistoryData = await _context.TankVolumeHistories
                    .Where(tvh => tvh.TankId.HasValue && tankIds.Contains(tvh.TankId.Value)
                        && tvh.Timestamp >= request.StartDate
                        && tvh.Timestamp <= request.EndDate
                        && tvh.ChangeReason != VolumeChangeReasonEnum.Dispensing
                        && tvh.ChangeReason != VolumeChangeReasonEnum.AutomatedDispensing)
                    .OrderBy(tvh => tvh.TankId)
                    .ThenBy(tvh => tvh.Timestamp)
                    .ThenBy(tvh => tvh.ChangeReason)
                    .ToListAsync(cancellationToken);

                // Get manual dispensing from TankStock
                tankStockData = await _context.Tankstocks
                    .Where(ts => tankIds.Contains(ts.TankId)
                        && ts.EntryDate >= request.StartDate
                        && ts.EntryDate <= request.EndDate)
                    .OrderBy(ts => ts.TankId)
                    .ThenBy(ts => ts.EntryDate)
                    .ThenBy(ts => ts.EntryType)
                    .ToListAsync(cancellationToken);
            }
            else
            {
                // SENSOR MODE (DEFAULT): Use TankVolumeHistory for automated sensor readings
                // This includes both AutomatedDispensing (PTS) and manual Dispensing (FuelRefills)
                volumeHistoryData = await _context.TankVolumeHistories
                    .Where(tvh => tvh.TankId.HasValue && tankIds.Contains(tvh.TankId.Value)
                        && tvh.Timestamp >= request.StartDate
                        && tvh.Timestamp <= request.EndDate)
                    .OrderBy(tvh => tvh.TankId)
                    .ThenBy(tvh => tvh.Timestamp)
                    .ThenBy(tvh => tvh.ChangeReason)
                    .ToListAsync(cancellationToken);

                // Still need TankStock for fallback/aggregated data
                tankStockData = await _context.Tankstocks
                    .Where(ts => tankIds.Contains(ts.TankId)
                        && ts.EntryDate >= request.StartDate
                        && ts.EntryDate <= request.EndDate)
                    .OrderBy(ts => ts.TankId)
                    .ThenBy(ts => ts.EntryDate)
                    .ThenBy(ts => ts.EntryType)
                    .ToListAsync(cancellationToken);
            }

            // Check if we have any data
            bool hasData = tankStockData?.Count > 0 || volumeHistoryData?.Count > 0;
            if (!hasData)
            {
                _logger.LogWarning(
                    "No data found for Tanks {TankIds} between {StartDate} and {EndDate}",
                    string.Join(",", tankIds), request.StartDate, request.EndDate);

                return FMSResponse<DeliveryCycleAnalysisResult>.Success(
                    new DeliveryCycleAnalysisResult
                    {
                        TankId = tankIds.Count == 1 ? tankIds.First() : null,
                        TankIds = tankIds.Count > 1 ? tankIds : null,
                        TankName = tankName,
                        AnalysisType = request.AnalysisType,
                        StartDate = request.StartDate,
                        EndDate = request.EndDate,
                        Cycles = new List<DeliveryCycle>(),
                        Summary = new CycleSummary()
                    },
                    "No data available for the selected date range");
            }

            // Get delivery dates to determine cycle boundaries
            // Deliveries can come from either TankStock or TankVolumeHistory
            var deliveryDates = new List<DateTime>();

            if (tankStockData != null)
            {
                deliveryDates.AddRange(tankStockData
                    .Where(ts => ts.EntryType == VolumeChangeReasonEnum.Delivery)
                    .Select(ts => ts.EntryDate.Date));
            }

            if (volumeHistoryData != null)
            {
                deliveryDates.AddRange(volumeHistoryData
                    .Where(vh => vh.ChangeReason == VolumeChangeReasonEnum.Delivery)
                    .Select(vh => vh.Timestamp.Date));
            }

            deliveryDates = deliveryDates
                .Distinct()
                .OrderBy(d => d)
                .ToList();

            // Determine cycle boundaries based on analysis type
            var cycleBoundaries = DetermineCycleBoundaries(
                request.AnalysisType,
                request.StartDate,
                request.EndDate,
                deliveryDates);

            // Calculate metrics for each cycle
            var cycles = new List<DeliveryCycle>();
            int cycleNumber = 1;

            foreach (var (start, end) in cycleBoundaries)
            {
                var cycle = CalculateCycleMetrics(
                    cycleNumber++,
                    start,
                    end,
                    tankStockData,
                    volumeHistoryData,
                    deliveryDates,
                    request.UseCombinedDispensing,
                    request.UseManualDispensing);

                if (cycle != null)
                {
                    cycles.Add(cycle);
                }
            }

            // Calculate summary statistics
            var summary = CalculateSummary(cycles);

            var result = new DeliveryCycleAnalysisResult
            {
                TankId = tankIds.Count == 1 ? tankIds.First() : null,
                TankIds = tankIds.Count > 1 ? tankIds : null,
                TankName = tankName,
                AnalysisType = request.AnalysisType,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                Cycles = cycles,
                Summary = summary
            };

            _logger.LogInformation(
                "Delivery cycle analysis completed for {TankCount} tank(s) ({TankName}). " +
                "Total cycles: {Cycles}, Avg consumption/day: {AvgConsumption}L",
                tankIds.Count, tankName, cycles.Count, summary.AverageConsumptionPerDay);

            return FMSResponse<DeliveryCycleAnalysisResult>.Success(
                result,
                $"Analysis completed for {cycles.Count} cycle(s) across {tankIds.Count} tank(s)");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Error calculating delivery cycle analysis for Tanks {TankIds}",
                string.Join(",", request.GetEffectiveTankIds()));
            return FMSResponse<DeliveryCycleAnalysisResult>.Failed(
                $"Failed to calculate delivery cycle analysis: {ex.Message}");
        }
    }

    /// <summary>
    /// Determine cycle boundaries based on analysis type
    /// </summary>
    private List<(DateTime Start, DateTime End)> DetermineCycleBoundaries(
        DeliveryCycleAnalysisType analysisType,
        DateTime startDate,
        DateTime endDate,
        List<DateTime> deliveryDates)
    {
        var boundaries = new List<(DateTime, DateTime)>();

        switch (analysisType)
        {
            case DeliveryCycleAnalysisType.BetweenDeliveries:
                // Create cycles between consecutive deliveries
                if (deliveryDates.Count == 0)
                {
                    // No deliveries - one cycle for entire period
                    boundaries.Add((startDate, endDate));
                }
                else if (deliveryDates.Count == 1)
                {
                    // One delivery - split into before and after
                    if (deliveryDates[0] > startDate)
                    {
                        boundaries.Add((startDate, deliveryDates[0].AddDays(-1)));
                    }
                    if (deliveryDates[0] < endDate)
                    {
                        boundaries.Add((deliveryDates[0], endDate));
                    }
                }
                else
                {
                    // Multiple deliveries - cycles between each
                    for (int i = 0; i < deliveryDates.Count; i++)
                    {
                        DateTime cycleStart = i == 0 ? startDate : deliveryDates[i];
                        DateTime cycleEnd = i < deliveryDates.Count - 1
                            ? deliveryDates[i + 1].AddDays(-1)
                            : endDate;

                        if (cycleStart <= cycleEnd)
                        {
                            boundaries.Add((cycleStart, cycleEnd));
                        }
                    }
                }
                break;

            case DeliveryCycleAnalysisType.Monthly:
                // Create monthly cycles
                var current = new DateTime(startDate.Year, startDate.Month, 1);
                while (current <= endDate)
                {
                    var monthEnd = current.AddMonths(1).AddDays(-1);
                    if (monthEnd > endDate) monthEnd = endDate;
                    if (current >= startDate)
                    {
                        boundaries.Add((current, monthEnd));
                    }
                    current = current.AddMonths(1);
                }
                break;

            case DeliveryCycleAnalysisType.UntilNextDelivery:
                // From start until first delivery
                if (deliveryDates.Count > 0)
                {
                    boundaries.Add((startDate, deliveryDates[0]));
                }
                else
                {
                    boundaries.Add((startDate, endDate));
                }
                break;

            default:
                // Custom - single cycle for entire period
                boundaries.Add((startDate, endDate));
                break;
        }

        return boundaries;
    }

    /// <summary>
    /// Calculate metrics for a single cycle
    /// </summary>
    private DeliveryCycle? CalculateCycleMetrics(
        int cycleNumber,
        DateTime start,
        DateTime end,
        List<Domain.Entities.Tankstock> tankStockData,
        List<TankVolumeHistoryEntity> volumeHistoryData,
        List<DateTime> deliveryDates,
        bool useCombinedDispensing,
        bool useManualDispensing)
    {
        // Combine data from both sources based on mode
        decimal openingStock = 0, actualClosing = 0, expectedClosing = 0;
        decimal deliveryVolume = 0, dispensingVolume = 0, transferInVolume = 0, transferOutVolume = 0;
        List<DeliveryDetail> deliveryDetails = new List<DeliveryDetail>();

        if (useCombinedDispensing && volumeHistoryData != null)
        {
            // Use TankVolumeHistory as primary, fill gaps with TankStock
            var cycleVolumeData = volumeHistoryData
                .Where(vh => vh.Timestamp.Date >= start && vh.Timestamp.Date <= end)
                .OrderBy(vh => vh.Timestamp)
                .ToList();

            var cycleTankStockData = tankStockData
                .Where(ts => ts.EntryDate.Date >= start && ts.EntryDate.Date <= end)
                .OrderBy(ts => ts.EntryDate)
                .ToList();

            // Get opening stock - prefer TankVolumeHistory, fallback to TankStock
            var openingVH = cycleVolumeData.FirstOrDefault();
            var openingTS = cycleTankStockData.FirstOrDefault(ts => ts.EntryType == VolumeChangeReasonEnum.OpeningStock);
            openingStock = openingVH?.NewVolume ?? openingTS?.ManualOpeningLevel ?? openingTS?.SensorOpeningLevel ?? 0;

            // Get closing stock
            var closingVH = cycleVolumeData.LastOrDefault();
            var closingTS = cycleTankStockData.FirstOrDefault(ts => ts.EntryType == VolumeChangeReasonEnum.ClosingStock);
            actualClosing = closingVH?.NewVolume ?? closingTS?.ManualClosingLevel ?? closingTS?.SensorClosingLevel ?? 0;
            expectedClosing = closingTS?.ExpectedClosingLevel ?? actualClosing;

            // Calculate volumes - use volume history, fill gaps with tank stock
            deliveryVolume = cycleVolumeData.Where(vh => vh.ChangeReason == VolumeChangeReasonEnum.Delivery)
                .Sum(vh => Math.Abs(vh.VolumeChange ?? 0));
            if (deliveryVolume == 0)
            {
                deliveryVolume = cycleTankStockData.Where(ts => ts.EntryType == VolumeChangeReasonEnum.Delivery)
                    .Sum(ts => Math.Abs((ts.ManualClosingLevel ?? ts.SensorClosingLevel ?? 0)
                                      - (ts.ManualOpeningLevel ?? ts.SensorOpeningLevel ?? 0)));
            }

            dispensingVolume = cycleVolumeData
                .Where(vh => vh.ChangeReason == VolumeChangeReasonEnum.Dispensing || vh.ChangeReason == VolumeChangeReasonEnum.AutomatedDispensing)
                .Sum(vh => Math.Abs(vh.VolumeChange ?? 0));
            if (dispensingVolume == 0)
            {
                dispensingVolume = cycleTankStockData.Where(ts => ts.EntryType == VolumeChangeReasonEnum.Dispensing)
                    .Sum(ts => Math.Abs((ts.ManualClosingLevel ?? ts.SensorClosingLevel ?? 0)
                                      - (ts.ManualOpeningLevel ?? ts.SensorOpeningLevel ?? 0)));
            }

            transferInVolume = cycleVolumeData.Where(vh => vh.ChangeReason == VolumeChangeReasonEnum.TransferIn)
                .Sum(vh => Math.Abs(vh.VolumeChange ?? 0));
            if (transferInVolume == 0)
            {
                transferInVolume = cycleTankStockData.Where(ts => ts.EntryType == VolumeChangeReasonEnum.TransferIn)
                    .Sum(ts => Math.Abs((ts.ManualClosingLevel ?? ts.SensorClosingLevel ?? 0)
                                      - (ts.ManualOpeningLevel ?? ts.SensorOpeningLevel ?? 0)));
            }

            transferOutVolume = cycleVolumeData.Where(vh => vh.ChangeReason == VolumeChangeReasonEnum.TransferOut)
                .Sum(vh => Math.Abs(vh.VolumeChange ?? 0));
            if (transferOutVolume == 0)
            {
                transferOutVolume = cycleTankStockData.Where(ts => ts.EntryType == VolumeChangeReasonEnum.TransferOut)
                    .Sum(ts => Math.Abs((ts.ManualClosingLevel ?? ts.SensorClosingLevel ?? 0)
                                      - (ts.ManualOpeningLevel ?? ts.SensorOpeningLevel ?? 0)));
            }

            // Get delivery details - prefer volume history
            deliveryDetails = cycleVolumeData
                .Where(vh => vh.ChangeReason == VolumeChangeReasonEnum.Delivery)
                .Select(vh => new DeliveryDetail
                {
                    Date = vh.Timestamp,
                    Volume = Math.Abs(vh.VolumeChange ?? 0),
                    BeforeDelivery = (vh.NewVolume ?? 0) - (vh.VolumeChange ?? 0),
                    AfterDelivery = vh.NewVolume ?? 0,
                    DeliveryReference = vh.ReferenceType ?? string.Empty
                })
                .ToList();

            if (!deliveryDetails.Any())
            {
                deliveryDetails = cycleTankStockData
                    .Where(ts => ts.EntryType == VolumeChangeReasonEnum.Delivery)
                    .Select(ts => new DeliveryDetail
                    {
                        Date = ts.EntryDate,
                        Volume = Math.Abs((ts.ManualClosingLevel ?? ts.SensorClosingLevel ?? 0)
                                        - (ts.ManualOpeningLevel ?? ts.SensorOpeningLevel ?? 0)),
                        BeforeDelivery = ts.ManualOpeningLevel ?? ts.SensorOpeningLevel ?? 0,
                        AfterDelivery = ts.ManualClosingLevel ?? ts.SensorClosingLevel ?? 0,
                        DeliveryReference = ts.Comment ?? string.Empty
                    })
                    .ToList();
            }
        }
        else if (useManualDispensing && volumeHistoryData != null)
        {
            // Use TankStock for dispensing, TankVolumeHistory for other transactions
            var cycleVolumeData = volumeHistoryData
                .Where(vh => vh.Timestamp.Date >= start && vh.Timestamp.Date <= end)
                .OrderBy(vh => vh.Timestamp)
                .ToList();

            var cycleTankStockData = tankStockData
                .Where(ts => ts.EntryDate.Date >= start && ts.EntryDate.Date <= end)
                .OrderBy(ts => ts.EntryDate)
                .ToList();

            // Get opening/closing from TankStock
            var openingTS = cycleTankStockData.FirstOrDefault(ts => ts.EntryType == VolumeChangeReasonEnum.OpeningStock);
            var closingTS = cycleTankStockData.FirstOrDefault(ts => ts.EntryType == VolumeChangeReasonEnum.ClosingStock);

            openingStock = openingTS?.ManualOpeningLevel ?? openingTS?.SensorOpeningLevel ?? 0;
            actualClosing = closingTS?.ManualClosingLevel ?? closingTS?.SensorClosingLevel ?? 0;
            expectedClosing = closingTS?.ExpectedClosingLevel ?? actualClosing;

            // Get dispensing from TankStock (manual aggregate)
            dispensingVolume = cycleTankStockData.Where(ts => ts.EntryType == VolumeChangeReasonEnum.Dispensing)
                .Sum(ts => Math.Abs((ts.ManualClosingLevel ?? ts.SensorClosingLevel ?? 0)
                                  - (ts.ManualOpeningLevel ?? ts.SensorOpeningLevel ?? 0)));

            // Get other transactions from TankVolumeHistory
            deliveryVolume = cycleVolumeData.Where(vh => vh.ChangeReason == VolumeChangeReasonEnum.Delivery)
                .Sum(vh => Math.Abs(vh.VolumeChange ?? 0));

            transferInVolume = cycleVolumeData.Where(vh => vh.ChangeReason == VolumeChangeReasonEnum.TransferIn)
                .Sum(vh => Math.Abs(vh.VolumeChange ?? 0));

            transferOutVolume = cycleVolumeData.Where(vh => vh.ChangeReason == VolumeChangeReasonEnum.TransferOut)
                .Sum(vh => Math.Abs(vh.VolumeChange ?? 0));

            // Delivery details from volume history
            deliveryDetails = cycleVolumeData
                .Where(vh => vh.ChangeReason == VolumeChangeReasonEnum.Delivery)
                .Select(vh => new DeliveryDetail
                {
                    Date = vh.Timestamp,
                    Volume = Math.Abs(vh.VolumeChange ?? 0),
                    BeforeDelivery = (vh.NewVolume ?? 0) - (vh.VolumeChange ?? 0),
                    AfterDelivery = vh.NewVolume ?? 0,
                    DeliveryReference = vh.ReferenceType ?? string.Empty
                })
                .ToList();
        }
        else
        {
            // SENSOR MODE (DEFAULT): Use TankVolumeHistory for all data
            // This includes Dispensing (manual fuel refills) and AutomatedDispensing (PTS)
            var cycleVolumeData = volumeHistoryData
                .Where(vh => vh.Timestamp.Date >= start && vh.Timestamp.Date <= end)
                .OrderBy(vh => vh.Timestamp)
                .ToList();

            var cycleTankStockData = tankStockData
                .Where(ts => ts.EntryDate.Date >= start && ts.EntryDate.Date <= end)
                .OrderBy(ts => ts.EntryDate)
                .ToList();

            if (cycleVolumeData.Count == 0 && cycleTankStockData.Count == 0)
                return null;

            // Get opening stock - prefer TankVolumeHistory, fallback to TankStock
            var openingVH = cycleVolumeData
                .FirstOrDefault(vh => vh.ChangeReason == VolumeChangeReasonEnum.OpeningStock);
            var openingTS = cycleTankStockData
                .FirstOrDefault(ts => ts.EntryType == VolumeChangeReasonEnum.OpeningStock);

            openingStock = openingVH?.NewVolume
                ?? openingTS?.ManualOpeningLevel
                ?? openingTS?.SensorOpeningLevel
                ?? 0;

            // Get closing stock - prefer TankVolumeHistory, fallback to TankStock
            var closingVH = cycleVolumeData
                .FirstOrDefault(vh => vh.ChangeReason == VolumeChangeReasonEnum.ClosingStock);
            var closingTS = cycleTankStockData
                .FirstOrDefault(ts => ts.EntryType == VolumeChangeReasonEnum.ClosingStock);

            actualClosing = closingVH?.NewVolume
                ?? closingTS?.ManualClosingLevel
                ?? closingTS?.SensorClosingLevel
                ?? 0;
            expectedClosing = closingTS?.ExpectedClosingLevel ?? actualClosing;

            if (openingStock == 0 && actualClosing == 0)
                return null;

            // Calculate transactions from TankVolumeHistory
            // Include BOTH Dispensing (manual fuel refills) and AutomatedDispensing (PTS)
            deliveryVolume = cycleVolumeData
                .Where(vh => vh.ChangeReason == VolumeChangeReasonEnum.Delivery)
                .Sum(vh => Math.Abs(vh.VolumeChange ?? 0));

            dispensingVolume = cycleVolumeData
                .Where(vh => vh.ChangeReason == VolumeChangeReasonEnum.Dispensing
                          || vh.ChangeReason == VolumeChangeReasonEnum.AutomatedDispensing)
                .Sum(vh => Math.Abs(vh.VolumeChange ?? 0));

            transferInVolume = cycleVolumeData
                .Where(vh => vh.ChangeReason == VolumeChangeReasonEnum.TransferIn)
                .Sum(vh => Math.Abs(vh.VolumeChange ?? 0));

            transferOutVolume = cycleVolumeData
                .Where(vh => vh.ChangeReason == VolumeChangeReasonEnum.TransferOut)
                .Sum(vh => Math.Abs(vh.VolumeChange ?? 0));

            // Fallback to TankStock if no volume history data
            if (deliveryVolume == 0 && cycleTankStockData.Any(ts => ts.EntryType == VolumeChangeReasonEnum.Delivery))
            {
                deliveryVolume = cycleTankStockData
                    .Where(ts => ts.EntryType == VolumeChangeReasonEnum.Delivery)
                    .Sum(ts => Math.Abs((ts.ManualClosingLevel ?? ts.SensorClosingLevel ?? 0)
                                      - (ts.ManualOpeningLevel ?? ts.SensorOpeningLevel ?? 0)));
            }

            if (dispensingVolume == 0 && cycleTankStockData.Any(ts => ts.EntryType == VolumeChangeReasonEnum.Dispensing))
            {
                dispensingVolume = cycleTankStockData
                    .Where(ts => ts.EntryType == VolumeChangeReasonEnum.Dispensing)
                    .Sum(ts => Math.Abs((ts.ManualClosingLevel ?? ts.SensorClosingLevel ?? 0)
                                      - (ts.ManualOpeningLevel ?? ts.SensorOpeningLevel ?? 0)));
            }

            // Get delivery details from TankVolumeHistory
            deliveryDetails = cycleVolumeData
                .Where(vh => vh.ChangeReason == VolumeChangeReasonEnum.Delivery)
                .Select(vh => new DeliveryDetail
                {
                    Date = vh.Timestamp,
                    Volume = Math.Abs(vh.VolumeChange ?? 0),
                    BeforeDelivery = (vh.NewVolume ?? 0) - (vh.VolumeChange ?? 0),
                    AfterDelivery = vh.NewVolume ?? 0,
                    DeliveryReference = vh.ReferenceType ?? string.Empty
                })
                .ToList();

            // Fallback to TankStock for delivery details if none in volume history
            if (!deliveryDetails.Any() && cycleTankStockData.Any())
            {
                deliveryDetails = cycleTankStockData
                    .Where(ts => ts.EntryType == VolumeChangeReasonEnum.Delivery)
                    .Select(ts => new DeliveryDetail
                    {
                        Date = ts.EntryDate,
                        Volume = Math.Abs((ts.ManualClosingLevel ?? ts.SensorClosingLevel ?? 0)
                                        - (ts.ManualOpeningLevel ?? ts.SensorOpeningLevel ?? 0)),
                        BeforeDelivery = ts.ManualOpeningLevel ?? ts.SensorOpeningLevel ?? 0,
                        AfterDelivery = ts.ManualClosingLevel ?? ts.SensorClosingLevel ?? 0,
                        DeliveryReference = ts.Comment ?? string.Empty
                    })
                    .ToList();
            }
        }

        // Calculate metrics
        int daysInCycle = (end - start).Days + 1;
        decimal stockAfterDelivery = openingStock + deliveryVolume;
        decimal cycleVariance = expectedClosing - actualClosing;
        decimal variancePercent = expectedClosing != 0 ? (cycleVariance / expectedClosing) * 100 : 0;
        decimal consumptionPerDay = daysInCycle > 0 ? dispensingVolume / daysInCycle : 0;
        decimal consumptionPerMonth = consumptionPerDay * 30.44m; // Average days in month
        decimal actualMonthlyConsumption = daysInCycle >= 28 ? (dispensingVolume / daysInCycle) * 30.44m : dispensingVolume;
        int daysToStockout = consumptionPerDay > 0 ? (int)(actualClosing / consumptionPerDay) : 0;
        decimal stockTurnoverRate = openingStock > 0 ? dispensingVolume / openingStock : 0;
        decimal averageStockLevel = (openingStock + actualClosing) / 2;

        return new DeliveryCycle
        {
            CycleNumber = cycleNumber,
            CycleStartDate = start,
            CycleEndDate = end,
            DaysInCycle = daysInCycle,
            OpeningStock = openingStock,
            DeliveryReceived = deliveryVolume,
            StockAfterDelivery = stockAfterDelivery,
            ActualClosing = actualClosing,
            ExpectedClosing = expectedClosing,
            TotalDispensing = dispensingVolume,
            TotalTransferOut = transferOutVolume,
            TotalTransferIn = transferInVolume,
            CycleVariance = cycleVariance,
            VariancePercent = variancePercent,
            ConsumptionPerDay = consumptionPerDay,
            ConsumptionPerMonth = consumptionPerMonth,
            ActualMonthlyConsumption = actualMonthlyConsumption,
            DaysToStockout = daysToStockout,
            StockTurnoverRate = stockTurnoverRate,
            AverageStockLevel = averageStockLevel,
            DeliveryDetails = deliveryDetails
        };
    }

    /// <summary>
    /// Calculate summary statistics across all cycles
    /// </summary>
    private CycleSummary CalculateSummary(List<DeliveryCycle> cycles)
    {
        if (cycles.Count == 0)
        {
            return new CycleSummary();
        }

        return new CycleSummary
        {
            TotalCycles = cycles.Count,
            TotalDeliveries = cycles.Sum(c => c.DeliveryDetails.Count),
            TotalDeliveryVolume = cycles.Sum(c => c.DeliveryReceived),
            TotalDispensing = cycles.Sum(c => c.TotalDispensing),
            TotalVariance = cycles.Sum(c => c.CycleVariance),
            AverageConsumptionPerDay = cycles.Average(c => c.ConsumptionPerDay),
            AverageConsumptionPerMonth = cycles.Average(c => c.ConsumptionPerMonth),
            AverageCycleLength = cycles.Average(c => c.DaysInCycle),
            AverageStockTurnover = cycles.Average(c => c.StockTurnoverRate),
            OverallVariancePercent = cycles.Sum(c => c.ExpectedClosing) != 0
                ? (cycles.Sum(c => c.CycleVariance) / cycles.Sum(c => c.ExpectedClosing)) * 100
                : 0,
            MinConsumptionPerDay = cycles.Min(c => c.ConsumptionPerDay),
            MaxConsumptionPerDay = cycles.Max(c => c.ConsumptionPerDay),
            MinDaysToStockout = cycles.Where(c => c.DaysToStockout > 0).Any()
                ? cycles.Where(c => c.DaysToStockout > 0).Min(c => c.DaysToStockout)
                : 0,
            MaxDaysToStockout = cycles.Max(c => c.DaysToStockout)
        };
    }
}
