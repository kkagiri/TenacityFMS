using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FuelAudit.DTOs;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelAudit.Services
{
    /// <summary>
    /// Interface for Full Tank Estimation Service.
    /// Estimates opening/closing fuel for Category 2 vehicles (Site Full Tank policy).
    /// </summary>
    public interface IFullTankEstimationService
    {
        /// <summary>
        /// Estimates opening and closing fuel levels for a Category 2 vehicle.
        /// Uses the full tank policy assumption: vehicle is refueled to full tank each time.
        /// </summary>
        /// <param name="request">Estimation request with vehicle info and refill data</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Estimated fuel positions</returns>
        Task<FMSResponse<FullTankEstimationResultDTO>> EstimateFuelLevelsAsync(
            FullTankEstimationRequestDTO request,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Estimates fuel levels for multiple Category 2 vehicles.
        /// </summary>
        /// <param name="requests">List of estimation requests</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Estimation results for all vehicles</returns>
        Task<FMSResponse<List<FullTankEstimationResultDTO>>> EstimateBatchAsync(
            List<FullTankEstimationRequestDTO> requests,
            CancellationToken cancellationToken = default);
    }

    /// <summary>
    /// Request DTO for full tank estimation
    /// </summary>
    public class FullTankEstimationRequestDTO
    {
        public int VehicleId { get; set; }
        public string VehicleName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        /// <summary>Vehicle tank capacity in liters</summary>
        public decimal? FuelTankCapacity { get; set; }

        /// <summary>Average fuel efficiency (km/L or L/hr)</summary>
        public decimal? AverageEfficiency { get; set; }

        /// <summary>Whether efficiency is km/L (true) or L/hr (false)</summary>
        public bool IsKmL { get; set; }

        /// <summary>Whether vehicle follows full tank policy</summary>
        public bool IsFullTankPolicy { get; set; }
    }

    /// <summary>
    /// Result DTO for full tank estimation
    /// </summary>
    public class FullTankEstimationResultDTO
    {
        public int VehicleId { get; set; }
        public string VehicleName { get; set; } = string.Empty;

        #region Opening Stock Estimation

        /// <summary>Estimated opening fuel level</summary>
        public decimal? EstimatedOpeningLevel { get; set; }

        /// <summary>Opening estimation method used</summary>
        public string OpeningEstimationMethod { get; set; } = string.Empty;

        /// <summary>Opening data quality</summary>
        public FuelDataQuality OpeningDataQuality { get; set; }

        /// <summary>Opening estimation details</summary>
        public string OpeningDetails { get; set; } = string.Empty;

        /// <summary>Date of refill used for opening calculation</summary>
        public DateTime? OpeningReferenceDate { get; set; }

        #endregion

        #region Closing Stock Estimation

        /// <summary>Estimated closing fuel level</summary>
        public decimal? EstimatedClosingLevel { get; set; }

        /// <summary>Closing estimation method used</summary>
        public string ClosingEstimationMethod { get; set; } = string.Empty;

        /// <summary>Closing data quality</summary>
        public FuelDataQuality ClosingDataQuality { get; set; }

        /// <summary>Closing estimation details</summary>
        public string ClosingDetails { get; set; } = string.Empty;

        /// <summary>Date of refill used for closing calculation</summary>
        public DateTime? ClosingReferenceDate { get; set; }

        #endregion

        #region Consumption Data

        /// <summary>Total fuel refilled during period</summary>
        public decimal TotalFuelRefilled { get; set; }

        /// <summary>Number of refills during period</summary>
        public int RefillCount { get; set; }

        /// <summary>Calculated consumption (Opening + Refills - Closing)</summary>
        public decimal? CalculatedConsumption { get; set; }

        /// <summary>Average consumption per day</summary>
        public decimal? AverageDailyConsumption { get; set; }

        /// <summary>Expected consumption based on efficiency</summary>
        public decimal? ExpectedConsumption { get; set; }

        /// <summary>Variance between calculated and expected consumption</summary>
        public decimal? ConsumptionVariance { get; set; }

        #endregion

        #region Audit Information

        /// <summary>Tank capacity used for calculations</summary>
        public decimal? TankCapacity { get; set; }

        /// <summary>Whether estimation is reliable</summary>
        public bool IsReliable { get; set; }

        /// <summary>Confidence level: HIGH, MEDIUM, LOW</summary>
        public string Confidence { get; set; } = "MEDIUM";

        /// <summary>Any warnings or notes about the estimation</summary>
        public List<string> Warnings { get; set; } = new();

        #endregion
    }

    /// <summary>
    /// Implementation of Full Tank Estimation Service.
    /// Uses the "fill-up to fill-up" method for Category 2 vehicles.
    ///
    /// Assumptions for Full Tank Policy vehicles:
    /// 1. Vehicle is always refueled to full tank
    /// 2. After refuel, fuel level = tank capacity
    /// 3. Consumption can be calculated from refill amounts between fill-ups
    /// </summary>
    public class FullTankEstimationService : IFullTankEstimationService
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<FullTankEstimationService> _logger;

        // Default tank capacity if not specified (typical pickup truck)
        private const decimal DefaultTankCapacity = 80.0m;

        // Default consumption rate if no efficiency data (L/day for typical pickup)
        private const decimal DefaultDailyConsumption = 20.0m;

        public FullTankEstimationService(
            GpsdataContext context,
            ILogger<FullTankEstimationService> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <inheritdoc />
        public async Task<FMSResponse<FullTankEstimationResultDTO>> EstimateFuelLevelsAsync(
            FullTankEstimationRequestDTO request,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogDebug("Estimating fuel levels for vehicle {VehicleId} ({Name}) from {Start} to {End}",
                    request.VehicleId, request.VehicleName, request.StartDate.ToString("yyyy-MM-dd"), request.EndDate.ToString("yyyy-MM-dd"));

                var result = new FullTankEstimationResultDTO
                {
                    VehicleId = request.VehicleId,
                    VehicleName = request.VehicleName,
                    TankCapacity = request.FuelTankCapacity ?? DefaultTankCapacity
                };

                // Get refill records for the vehicle
                var refills = await GetRefillsForPeriodAsync(
                    request.VehicleId,
                    request.StartDate.AddDays(-30), // Look 30 days before for context
                    request.EndDate.AddDays(30),    // Look 30 days after for context
                    cancellationToken);

                // Separate refills: before period, during period, after period
                var refillsBeforePeriod = refills
                    .Where(r => r.RefillDate < request.StartDate)
                    .OrderByDescending(r => r.RefillDate)
                    .ToList();

                var refillsDuringPeriod = refills
                    .Where(r => r.RefillDate >= request.StartDate && r.RefillDate <= request.EndDate)
                    .OrderBy(r => r.RefillDate)
                    .ToList();

                var refillsAfterPeriod = refills
                    .Where(r => r.RefillDate > request.EndDate)
                    .OrderBy(r => r.RefillDate)
                    .ToList();

                // Calculate totals for period
                result.TotalFuelRefilled = refillsDuringPeriod.Sum(r => r.Amount);
                result.RefillCount = refillsDuringPeriod.Count;

                // Estimate tank capacity if not provided
                var tankCapacity = request.FuelTankCapacity ?? EstimateTankCapacityFromRefills(refills);
                result.TankCapacity = tankCapacity;

                // Estimate consumption rate
                var dailyConsumption = EstimateDailyConsumption(refills, request.IsKmL, request.AverageEfficiency);

                // ===== OPENING STOCK ESTIMATION =====
                EstimateOpeningStock(result, request, refillsBeforePeriod, refillsDuringPeriod, tankCapacity, dailyConsumption);

                // ===== CLOSING STOCK ESTIMATION =====
                EstimateClosingStock(result, request, refillsDuringPeriod, refillsAfterPeriod, tankCapacity, dailyConsumption);

                // ===== CALCULATE CONSUMPTION =====
                if (result.EstimatedOpeningLevel.HasValue && result.EstimatedClosingLevel.HasValue)
                {
                    result.CalculatedConsumption = result.EstimatedOpeningLevel.Value
                        + result.TotalFuelRefilled
                        - result.EstimatedClosingLevel.Value;

                    var periodDays = (request.EndDate - request.StartDate).Days;
                    if (periodDays > 0)
                    {
                        result.AverageDailyConsumption = result.CalculatedConsumption / periodDays;
                    }

                    // Expected consumption based on daily rate
                    result.ExpectedConsumption = dailyConsumption * periodDays;

                    if (result.ExpectedConsumption > 0)
                    {
                        result.ConsumptionVariance = result.CalculatedConsumption - result.ExpectedConsumption;

                        // Check for anomalies
                        var variancePercent = Math.Abs(result.ConsumptionVariance.Value / result.ExpectedConsumption.Value * 100);
                        if (variancePercent > 50)
                        {
                            result.Warnings.Add($"High consumption variance: {variancePercent:F1}% from expected");
                        }
                    }
                }

                // Determine overall reliability
                DetermineReliability(result, request.IsFullTankPolicy);

                _logger.LogInformation(
                    "Estimated vehicle {VehicleId}: Opening={Opening}L, Closing={Closing}L, Refilled={Refilled}L, Consumption={Consumption}L",
                    request.VehicleId,
                    result.EstimatedOpeningLevel?.ToString("F1") ?? "N/A",
                    result.EstimatedClosingLevel?.ToString("F1") ?? "N/A",
                    result.TotalFuelRefilled.ToString("F1"),
                    result.CalculatedConsumption?.ToString("F1") ?? "N/A");

                return FMSResponse<FullTankEstimationResultDTO>.Success(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error estimating fuel levels for vehicle {VehicleId}", request.VehicleId);
                return FMSResponse<FullTankEstimationResultDTO>.Failed($"Error estimating fuel levels: {ex.Message}");
            }
        }

        /// <inheritdoc />
        public async Task<FMSResponse<List<FullTankEstimationResultDTO>>> EstimateBatchAsync(
            List<FullTankEstimationRequestDTO> requests,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var results = new List<FullTankEstimationResultDTO>();

                foreach (var request in requests)
                {
                    var result = await EstimateFuelLevelsAsync(request, cancellationToken);
                    if (result.IsSuccess && result.Data != null)
                    {
                        results.Add(result.Data);
                    }
                    else
                    {
                        // Add a failed result
                        results.Add(new FullTankEstimationResultDTO
                        {
                            VehicleId = request.VehicleId,
                            VehicleName = request.VehicleName,
                            IsReliable = false,
                            Confidence = "LOW",
                            Warnings = new List<string> { result.Message ?? "Estimation failed" }
                        });
                    }
                }

                return FMSResponse<List<FullTankEstimationResultDTO>>.Success(results);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in batch fuel estimation");
                return FMSResponse<List<FullTankEstimationResultDTO>>.Failed($"Error in batch estimation: {ex.Message}");
            }
        }

        #region Private Helper Methods

        private async Task<List<RefillInfo>> GetRefillsForPeriodAsync(
            int vehicleId,
            DateTime fromDate,
            DateTime toDate,
            CancellationToken cancellationToken)
        {
            var refills = await _context.FuelRefills
                .Where(r => r.VehicleId == vehicleId
                    && !r.IsDeleted
                    && r.Date.HasValue
                    && r.Date >= fromDate
                    && r.Date <= toDate)
                .OrderBy(r => r.Date)
                .Select(r => new RefillInfo
                {
                    Id = r.Id,
                    RefillDate = r.Date!.Value,
                    Amount = r.ManualFuelrefillAmount ?? 0,
                    PreviousMeter = r.PreviousMeterReading,
                    CurrentMeter = r.CurrentMeterReading,
                    // IsFullTank is inferred - we'll assume large refills (>60L or >80% capacity) are full tank
                    IsFullTank = false, // Will be computed based on amount
                    SiteId = r.SiteId
                })
                .ToListAsync(cancellationToken);

            return refills;
        }

        /// <summary>
        /// Determines if a refill amount likely represents a full tank fill.
        /// Heuristic: Amount >= 80% of tank capacity OR Amount >= 60L (typical tank size threshold)
        /// </summary>
        private static bool InferIsFullTank(decimal amount, decimal? tankCapacity)
        {
            if (tankCapacity.HasValue && tankCapacity.Value > 0)
            {
                return amount >= tankCapacity.Value * 0.8m;
            }
            // If no tank capacity, assume refills >= 60L are likely full tanks
            return amount >= 60m;
        }

        private decimal EstimateTankCapacityFromRefills(List<RefillInfo> refills)
        {
            // Find the largest single refill - likely a full tank fill
            if (!refills.Any())
                return DefaultTankCapacity;

            var maxRefill = refills.Max(r => r.Amount);

            // Add 20% buffer for "almost empty" scenario
            var estimatedCapacity = maxRefill * 1.2m;

            // Clamp to reasonable range (40L - 300L)
            return Math.Max(40m, Math.Min(300m, estimatedCapacity));
        }

        private decimal EstimateDailyConsumption(
            List<RefillInfo> refills,
            bool isKmL,
            decimal? averageEfficiency)
        {
            if (refills.Count < 2)
                return DefaultDailyConsumption;

            // Method 1: Calculate from consecutive refills with meter readings
            var consumptionRates = new List<decimal>();

            for (int i = 1; i < refills.Count; i++)
            {
                var prev = refills[i - 1];
                var curr = refills[i];

                if (prev.CurrentMeter.HasValue && curr.PreviousMeter.HasValue)
                {
                    var meterDiff = curr.PreviousMeter.Value - prev.CurrentMeter.Value;
                    var daysDiff = (curr.RefillDate - prev.RefillDate).Days;

                    if (daysDiff > 0 && curr.Amount > 0)
                    {
                        // The amount refilled approximately equals fuel consumed since last refill
                        var dailyRate = curr.Amount / daysDiff;
                        consumptionRates.Add(dailyRate);
                    }
                }
            }

            if (consumptionRates.Any())
            {
                // Use median to avoid outliers
                var sorted = consumptionRates.OrderBy(x => x).ToList();
                return sorted[sorted.Count / 2];
            }

            // Method 2: Use efficiency if available
            if (averageEfficiency.HasValue && averageEfficiency > 0)
            {
                if (isKmL)
                {
                    // km/L efficiency - assume 100km per day
                    return 100m / averageEfficiency.Value;
                }
                else
                {
                    // L/hr efficiency - assume 8 hours operation per day
                    return averageEfficiency.Value * 8m;
                }
            }

            return DefaultDailyConsumption;
        }

        private void EstimateOpeningStock(
            FullTankEstimationResultDTO result,
            FullTankEstimationRequestDTO request,
            List<RefillInfo> refillsBeforePeriod,
            List<RefillInfo> refillsDuringPeriod,
            decimal tankCapacity,
            decimal dailyConsumption)
        {
            // STRATEGY: Work backward from first refill during period, or forward from last refill before period

            if (refillsDuringPeriod.Any())
            {
                var firstRefillInPeriod = refillsDuringPeriod.First();
                var daysToFirstRefill = (firstRefillInPeriod.RefillDate - request.StartDate).Days;

                // Infer if this was a full tank refill based on amount
                var isFullTankRefill = InferIsFullTank(firstRefillInPeriod.Amount, tankCapacity);

                if (request.IsFullTankPolicy && isFullTankRefill)
                {
                    // Method 1: Full tank policy - before refill, tank was at (capacity - refill amount)
                    // Then calculate back to period start

                    // Fuel before refill ≈ tank capacity - refill amount (what was needed to fill up)
                    var fuelBeforeRefill = Math.Max(0, tankCapacity - firstRefillInPeriod.Amount);

                    // Add back consumption from start to refill
                    var consumedToRefill = dailyConsumption * daysToFirstRefill;
                    var estimatedOpening = fuelBeforeRefill + consumedToRefill;

                    // Cap at tank capacity
                    result.EstimatedOpeningLevel = Math.Min(tankCapacity, estimatedOpening);
                    result.OpeningEstimationMethod = "FullTank_BackCalculation";
                    result.OpeningDataQuality = daysToFirstRefill <= 3
                        ? FuelDataQuality.Exact
                        : FuelDataQuality.Interpolated;
                    result.OpeningDetails = $"Calculated from first refill on {firstRefillInPeriod.RefillDate:yyyy-MM-dd}. " +
                        $"Refill amount: {firstRefillInPeriod.Amount}L, Tank capacity: {tankCapacity}L, " +
                        $"Days to refill: {daysToFirstRefill}, Daily consumption: {dailyConsumption:F1}L/day";
                    result.OpeningReferenceDate = firstRefillInPeriod.RefillDate;
                }
                else
                {
                    // Method 2: Non-full tank - use refill amount and days
                    // Less reliable but provides an estimate
                    var estimatedOpening = dailyConsumption * daysToFirstRefill + firstRefillInPeriod.Amount;
                    result.EstimatedOpeningLevel = Math.Min(tankCapacity, estimatedOpening);
                    result.OpeningEstimationMethod = "Consumption_BackCalculation";
                    result.OpeningDataQuality = FuelDataQuality.EstimatedFromRefill;
                    result.OpeningDetails = $"Estimated from consumption rate and first refill on {firstRefillInPeriod.RefillDate:yyyy-MM-dd}";
                    result.OpeningReferenceDate = firstRefillInPeriod.RefillDate;

                    result.Warnings.Add("Opening estimate less reliable - first refill was not a full tank");
                }
            }
            else if (refillsBeforePeriod.Any())
            {
                // No refills during period - use last refill before period
                var lastRefillBefore = refillsBeforePeriod.First(); // Already ordered descending
                var daysSinceRefill = (request.StartDate - lastRefillBefore.RefillDate).Days;

                if (request.IsFullTankPolicy)
                {
                    // Full tank after refill, minus consumption since then
                    var consumed = dailyConsumption * daysSinceRefill;
                    result.EstimatedOpeningLevel = Math.Max(0, tankCapacity - consumed);
                    result.OpeningEstimationMethod = "FullTank_ForwardCalculation";
                    result.OpeningDataQuality = daysSinceRefill <= 7
                        ? FuelDataQuality.Interpolated
                        : FuelDataQuality.EstimatedFromRefill;
                    result.OpeningDetails = $"Calculated from last refill on {lastRefillBefore.RefillDate:yyyy-MM-dd}. " +
                        $"Days since refill: {daysSinceRefill}, Estimated consumption: {consumed:F1}L";
                    result.OpeningReferenceDate = lastRefillBefore.RefillDate;
                }
                else
                {
                    result.OpeningDataQuality = FuelDataQuality.Unavailable;
                    result.OpeningDetails = "Cannot estimate - no full tank policy and no refills during period";
                    result.Warnings.Add("Opening level unknown - vehicle doesn't follow full tank policy");
                }
            }
            else
            {
                // No refills at all
                result.OpeningDataQuality = FuelDataQuality.Unavailable;
                result.OpeningEstimationMethod = "NoData";
                result.OpeningDetails = "No refill records available for estimation";
                result.Warnings.Add("No refill history available to estimate opening fuel level");
            }
        }

        private void EstimateClosingStock(
            FullTankEstimationResultDTO result,
            FullTankEstimationRequestDTO request,
            List<RefillInfo> refillsDuringPeriod,
            List<RefillInfo> refillsAfterPeriod,
            decimal tankCapacity,
            decimal dailyConsumption)
        {
            // STRATEGY: Work forward from last refill during period, or backward from first refill after period

            if (refillsDuringPeriod.Any())
            {
                var lastRefillInPeriod = refillsDuringPeriod.Last();
                var daysFromLastRefill = (request.EndDate - lastRefillInPeriod.RefillDate).Days;

                if (request.IsFullTankPolicy)
                {
                    // After full tank refill, tank is at capacity
                    // Subtract consumption from refill to end of period
                    var consumed = dailyConsumption * daysFromLastRefill;
                    result.EstimatedClosingLevel = Math.Max(0, tankCapacity - consumed);
                    result.ClosingEstimationMethod = "FullTank_ForwardCalculation";
                    result.ClosingDataQuality = daysFromLastRefill <= 3
                        ? FuelDataQuality.Exact
                        : FuelDataQuality.Interpolated;
                    result.ClosingDetails = $"Calculated from last refill on {lastRefillInPeriod.RefillDate:yyyy-MM-dd}. " +
                        $"Days since refill: {daysFromLastRefill}, Consumed: {consumed:F1}L";
                    result.ClosingReferenceDate = lastRefillInPeriod.RefillDate;
                }
                else
                {
                    // Non-full tank - estimate from consumption
                    var consumed = dailyConsumption * daysFromLastRefill;
                    result.EstimatedClosingLevel = Math.Max(0, (tankCapacity * 0.8m) - consumed);
                    result.ClosingEstimationMethod = "Consumption_ForwardCalculation";
                    result.ClosingDataQuality = FuelDataQuality.EstimatedFromRefill;
                    result.ClosingDetails = $"Estimated assuming 80% tank after refill on {lastRefillInPeriod.RefillDate:yyyy-MM-dd}";
                    result.ClosingReferenceDate = lastRefillInPeriod.RefillDate;

                    result.Warnings.Add("Closing estimate less reliable - refill was not a full tank");
                }
            }
            else if (refillsAfterPeriod.Any())
            {
                // No refills during period - use first refill after period
                var firstRefillAfter = refillsAfterPeriod.First();
                var daysUntilRefill = (firstRefillAfter.RefillDate - request.EndDate).Days;

                // Infer if this was a full tank refill based on amount
                var isNextFullTankRefill = InferIsFullTank(firstRefillAfter.Amount, tankCapacity);

                if (request.IsFullTankPolicy && isNextFullTankRefill)
                {
                    // Work backward: tank before refill = capacity - refill amount
                    var fuelBeforeNextRefill = Math.Max(0, tankCapacity - firstRefillAfter.Amount);

                    // Add consumption from end of period to next refill
                    var consumedToRefill = dailyConsumption * daysUntilRefill;
                    var estimatedClosing = fuelBeforeNextRefill + consumedToRefill;

                    result.EstimatedClosingLevel = Math.Min(tankCapacity, estimatedClosing);
                    result.ClosingEstimationMethod = "FullTank_BackFromNext";
                    result.ClosingDataQuality = daysUntilRefill <= 7
                        ? FuelDataQuality.Interpolated
                        : FuelDataQuality.EstimatedFromRefill;
                    result.ClosingDetails = $"Calculated backward from refill on {firstRefillAfter.RefillDate:yyyy-MM-dd}. " +
                        $"Days until refill: {daysUntilRefill}, Refill amount: {firstRefillAfter.Amount}L";
                    result.ClosingReferenceDate = firstRefillAfter.RefillDate;
                }
                else
                {
                    result.ClosingDataQuality = FuelDataQuality.Unavailable;
                    result.ClosingDetails = "Cannot reliably estimate - next refill not a full tank";
                    result.Warnings.Add("Closing level unknown - next refill not a full tank");
                }
            }
            else if (result.EstimatedOpeningLevel.HasValue)
            {
                // No refills during or after - use opening minus consumption
                var periodDays = (request.EndDate - request.StartDate).Days;
                var consumed = dailyConsumption * periodDays;

                result.EstimatedClosingLevel = Math.Max(0, result.EstimatedOpeningLevel.Value + result.TotalFuelRefilled - consumed);
                result.ClosingEstimationMethod = "Consumption_FromOpening";
                result.ClosingDataQuality = FuelDataQuality.EstimatedFromRefill;
                result.ClosingDetails = $"Estimated from opening level minus {periodDays} days consumption ({consumed:F1}L)";
                result.Warnings.Add("Closing estimated from opening - no refills to validate against");
            }
            else
            {
                // No data at all
                result.ClosingDataQuality = FuelDataQuality.Unavailable;
                result.ClosingEstimationMethod = "NoData";
                result.ClosingDetails = "No refill records available for estimation";
                result.Warnings.Add("No refill history available to estimate closing fuel level");
            }
        }

        private void DetermineReliability(FullTankEstimationResultDTO result, bool isFullTankPolicy)
        {
            var hasOpening = result.EstimatedOpeningLevel.HasValue;
            var hasClosing = result.EstimatedClosingLevel.HasValue;

            if (!hasOpening || !hasClosing)
            {
                result.IsReliable = false;
                result.Confidence = "LOW";
                return;
            }

            // Check data quality
            var openingQuality = result.OpeningDataQuality;
            var closingQuality = result.ClosingDataQuality;

            if (openingQuality == FuelDataQuality.Exact && closingQuality == FuelDataQuality.Exact)
            {
                result.IsReliable = true;
                result.Confidence = isFullTankPolicy ? "HIGH" : "MEDIUM";
            }
            else if ((openingQuality == FuelDataQuality.Exact || openingQuality == FuelDataQuality.Interpolated) &&
                     (closingQuality == FuelDataQuality.Exact || closingQuality == FuelDataQuality.Interpolated))
            {
                result.IsReliable = true;
                result.Confidence = "MEDIUM";
            }
            else
            {
                result.IsReliable = false;
                result.Confidence = "LOW";
            }

            // Additional sanity checks
            if (result.CalculatedConsumption.HasValue)
            {
                // Negative consumption is impossible
                if (result.CalculatedConsumption < 0)
                {
                    result.IsReliable = false;
                    result.Warnings.Add("Calculated consumption is negative - estimation may be incorrect");
                }

                // Unreasonably high consumption
                var periodDays = Math.Max(1, result.RefillCount > 0 ? result.RefillCount * 7 : 30);
                var maxReasonableConsumption = result.TankCapacity.GetValueOrDefault(DefaultTankCapacity) * periodDays / 7;

                if (result.CalculatedConsumption > maxReasonableConsumption)
                {
                    result.Warnings.Add($"Consumption ({result.CalculatedConsumption:F1}L) seems high for period");
                }
            }
        }

        private class RefillInfo
        {
            public int Id { get; set; }
            public DateTime RefillDate { get; set; }
            public decimal Amount { get; set; }
            public decimal? PreviousMeter { get; set; }
            public decimal? CurrentMeter { get; set; }
            public bool IsFullTank { get; set; }
            public int? SiteId { get; set; }
        }

        #endregion
    }
}
