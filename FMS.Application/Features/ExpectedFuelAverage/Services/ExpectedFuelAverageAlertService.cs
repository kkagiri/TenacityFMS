/**
 * File: ExpectedFuelAverageAlertService.cs
 * Purpose: Evaluates completed vehicle fueling records against assigned expected
 *          fuel average benchmarks and emits Event Engine events when the actual
 *          fueling efficiency breaches the configured tolerance.
 * Dependencies: GpsdataContext, IEventExpressionEngine, FuelRefill, Pumptransaction
 * Last Modified: 2026-03-23
 *
 * Key Functions:
 * - CheckManualFuelRefillAsync(): evaluates a saved manual refill
 * - CheckPumpTransactionAsync(): evaluates a saved PTS pump transaction
 */

using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.EventEngine.Engine;
using FMS.Application.Features.EventEngine.Events;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.ExpectedFuelAverage.Services
{
    public interface IExpectedFuelAverageAlertService
    {
        Task CheckManualFuelRefillAsync(global::FMS.Domain.Entities.FuelRefill fuelRefill, string? triggeredBy = null, CancellationToken cancellationToken = default);
        Task CheckPumpTransactionAsync(global::FMS.Domain.Entities.Pumptransaction pumpTransaction, string? triggeredBy = null, CancellationToken cancellationToken = default);
    }

    internal sealed record MeterReadingHistoryRecord(int Id, string Source, DateTime Date, decimal MeterReading);

    internal sealed record FuelingAlertInput(
        int VehicleId,
        int? SiteId,
        int? TankId,
        decimal FuelVolume,
        decimal? CurrentMeterReading,
        decimal? ExplicitPreviousMeterReading,
        DateTime OccurredAt,
        int ReferenceId,
        string Source,
        string? TriggeredBy);

    /// <summary>
    /// Shared benchmark evaluation service for both manual and pump fueling flows.
    /// </summary>
    public class ExpectedFuelAverageAlertService : IExpectedFuelAverageAlertService
    {
        private readonly GpsdataContext _context;
        private readonly IEventExpressionEngine _eventEngine;
        private readonly ILogger<ExpectedFuelAverageAlertService> _logger;

        public ExpectedFuelAverageAlertService(
            GpsdataContext context,
            IEventExpressionEngine eventEngine,
            ILogger<ExpectedFuelAverageAlertService> logger)
        {
            _context = context;
            _eventEngine = eventEngine;
            _logger = logger;
        }

        public Task CheckManualFuelRefillAsync(global::FMS.Domain.Entities.FuelRefill fuelRefill, string? triggeredBy = null, CancellationToken cancellationToken = default)
        {
            if (fuelRefill.ManualFuelrefillAmount.GetValueOrDefault() <= 0)
            {
                return Task.CompletedTask;
            }

            return CheckAndRaiseAsync(new FuelingAlertInput(
                VehicleId: fuelRefill.VehicleId,
                SiteId: fuelRefill.SiteId,
                TankId: fuelRefill.TankId,
                FuelVolume: fuelRefill.ManualFuelrefillAmount!.Value,
                CurrentMeterReading: fuelRefill.CurrentMeterReading,
                ExplicitPreviousMeterReading: fuelRefill.PreviousMeterReading,
                OccurredAt: fuelRefill.Date ?? DateTime.UtcNow,
                ReferenceId: fuelRefill.Id,
                Source: "ManualRefill",
                TriggeredBy: triggeredBy ?? fuelRefill.FuelBy), cancellationToken);
        }

        public Task CheckPumpTransactionAsync(global::FMS.Domain.Entities.Pumptransaction pumpTransaction, string? triggeredBy = null, CancellationToken cancellationToken = default)
        {
            if (pumpTransaction.IsTransferMode || !pumpTransaction.VehicleId.HasValue || pumpTransaction.VehicleId.Value <= 0 || pumpTransaction.Volume.GetValueOrDefault() <= 0)
            {
                return Task.CompletedTask;
            }

            return CheckAndRaiseAsync(new FuelingAlertInput(
                VehicleId: pumpTransaction.VehicleId.Value,
                SiteId: null,
                TankId: pumpTransaction.TankId,
                FuelVolume: pumpTransaction.Volume!.Value,
                CurrentMeterReading: pumpTransaction.Odometer,
                ExplicitPreviousMeterReading: null,
                OccurredAt: pumpTransaction.DateTime,
                ReferenceId: pumpTransaction.Id,
                Source: "PumpTransaction",
                TriggeredBy: triggeredBy ?? "PTS System"), cancellationToken);
        }

        private async Task CheckAndRaiseAsync(FuelingAlertInput input, CancellationToken cancellationToken)
        {
            try
            {
                if (input.VehicleId <= 0 || input.FuelVolume <= 0 || !input.CurrentMeterReading.HasValue || input.CurrentMeterReading.Value <= 0)
                {
                    return;
                }

                var vehicle = await _context.Vehicles
                    .AsNoTracking()
                    .Include(v => v.WorkingSite)
                    .FirstOrDefaultAsync(v => v.VehicleId == input.VehicleId, cancellationToken);

                if (vehicle == null)
                {
                    return;
                }

                var now = DateTime.UtcNow;
                var assignment = await _context.VehicleExpectedAverageAssignments
                    .AsNoTracking()
                    .Include(a => a.ExpectedFuelAverageTemplate)
                    .Where(a => a.VehicleId == input.VehicleId && a.IsActive && a.ExpectedFuelAverageTemplate.IsActive)
                    .Where(a =>
                        // Exclude templates not yet effective
                        !a.ExpectedFuelAverageTemplate.EffectiveFrom.HasValue || a.ExpectedFuelAverageTemplate.EffectiveFrom.Value <= now)
                    .Where(a =>
                        // Exclude expired templates
                        !a.ExpectedFuelAverageTemplate.EffectiveTo.HasValue || a.ExpectedFuelAverageTemplate.EffectiveTo.Value >= now)
                    .OrderByDescending(a => a.IsDefault)
                    .ThenBy(a => a.Id)
                    .FirstOrDefaultAsync(cancellationToken);

                if (assignment?.ExpectedFuelAverageTemplate == null)
                {
                    return;
                }

                var expectedTemplate = assignment.ExpectedFuelAverageTemplate;
                var isKmPerLiter = vehicle.AverageKmL;
                if (expectedTemplate.IsKmPerLiter != isKmPerLiter)
                {
                    _logger.LogWarning(
                        "Skipping expected average alert for vehicle {VehicleId} because measurement mode differs between vehicle ({VehicleMode}) and template ({TemplateMode})",
                        input.VehicleId,
                        isKmPerLiter ? "KmPerLiter" : "LitersPerHour",
                        expectedTemplate.IsKmPerLiter ? "KmPerLiter" : "LitersPerHour");
                    return;
                }

                var expectedValue = assignment.OverrideExpectedValue ?? expectedTemplate.ExpectedValue;
                if (expectedValue <= 0)
                {
                    return;
                }

                var tolerancePercent = Math.Max(0m, assignment.OverrideTolerancePercent ?? expectedTemplate.TolerancePercent ?? 0m);

                var previousMeterReading = input.ExplicitPreviousMeterReading;
                var previousReadingSource = previousMeterReading.HasValue ? $"{input.Source}.PreviousMeterReading" : null;
                if (!previousMeterReading.HasValue)
                {
                    var previousReading = await FindPreviousMeterReadingAsync(
                        input.VehicleId,
                        input.OccurredAt,
                        input.Source,
                        input.ReferenceId,
                        cancellationToken);

                    previousMeterReading = previousReading?.MeterReading;
                    previousReadingSource = previousReading?.Source;
                }

                var distanceOrHours = CalculateDistanceOrHours(input.CurrentMeterReading, previousMeterReading);
                var actualValue = CalculateFuelEfficiency(input.CurrentMeterReading, previousMeterReading, input.FuelVolume, isKmPerLiter);
                if (!distanceOrHours.HasValue || !actualValue.HasValue)
                {
                    return;
                }

                var allowedValue = isKmPerLiter
                    ? expectedValue * (1m - (tolerancePercent / 100m))
                    : expectedValue * (1m + (tolerancePercent / 100m));

                var breached = isKmPerLiter
                    ? actualValue.Value < allowedValue
                    : actualValue.Value > allowedValue;

                if (!breached)
                {
                    return;
                }

                var varianceValue = isKmPerLiter
                    ? expectedValue - actualValue.Value
                    : actualValue.Value - expectedValue;
                var variancePercent = expectedValue > 0
                    ? Math.Round((varianceValue / expectedValue) * 100m, 2)
                    : 0m;

                var tank = input.TankId.HasValue
                    ? await _context.Tanks
                        .AsNoTracking()
                        .Include(t => t.Site)
                        .FirstOrDefaultAsync(t => t.Id == input.TankId.Value, cancellationToken)
                    : null;

                var siteId = input.SiteId ?? tank?.SiteId ?? vehicle.WorkingSiteId;
                var siteName = tank?.Site?.Name ?? vehicle.WorkingSite?.Name ?? string.Empty;
                var measurementMode = isKmPerLiter ? "KmPerLiter" : "LitersPerHour";
                var measurementUnit = isKmPerLiter ? "km/L" : "L/hr";
                var breachDirection = isKmPerLiter ? "BelowExpected" : "AboveExpected";
                var severity = DetermineSeverity(variancePercent);

                var fuelingEvent = new FuelingExpectedAverageEvent
                {
                    SiteId = siteId,
                    TankId = input.TankId,
                    Severity = severity,
                    TriggeredBy = string.IsNullOrWhiteSpace(input.TriggeredBy) ? "System" : input.TriggeredBy!,
                    Message = BuildMessage(vehicle.HyoungNo, actualValue.Value, expectedValue, variancePercent, measurementUnit, input.Source, isKmPerLiter),
                    VehicleId = vehicle.VehicleId,
                    VehicleName = vehicle.HyoungNo ?? string.Empty,
                    VehicleNumberPlate = vehicle.NumberPlate ?? string.Empty,
                    SiteName = siteName,
                    TankName = tank?.Name ?? string.Empty,
                    FuelingSource = input.Source,
                    ReferenceId = input.ReferenceId,
                    BenchmarkName = expectedTemplate.Name,
                    IsKmPerLiter = isKmPerLiter,
                    MeasurementMode = measurementMode,
                    MeasurementUnit = measurementUnit,
                    BreachDirection = breachDirection,
                    ExpectedValue = expectedValue,
                    ActualValue = actualValue.Value,
                    AllowedValue = Math.Round(allowedValue, 2),
                    TolerancePercent = tolerancePercent,
                    VarianceValue = Math.Round(varianceValue, 2),
                    VariancePercent = variancePercent,
                    FuelVolume = input.FuelVolume,
                    DistanceOrHours = distanceOrHours.Value,
                    OccurredAt = input.OccurredAt
                };

                fuelingEvent.Data["PreviousMeterReading"] = previousMeterReading?.ToString("F2") ?? string.Empty;
                fuelingEvent.Data["PreviousMeterReadingSource"] = previousReadingSource ?? string.Empty;

                await _eventEngine.ProcessAsync(fuelingEvent, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "Failed to evaluate expected fuel average alert for vehicle {VehicleId} after {Source}",
                    input.VehicleId,
                    input.Source);
            }
        }

        private async Task<MeterReadingHistoryRecord?> FindPreviousMeterReadingAsync(
            int vehicleId,
            DateTime occurredAt,
            string currentSource,
            int currentReferenceId,
            CancellationToken cancellationToken)
        {
            var refillHistory = await _context.FuelRefills
                .AsNoTracking()
                .Where(r => r.VehicleId == vehicleId && !r.IsDeleted && r.Date.HasValue && r.CurrentMeterReading.HasValue && r.CurrentMeterReading.Value > 0)
                .Select(r => new MeterReadingHistoryRecord(
                    r.Id,
                    "FuelRefill",
                    r.Date!.Value,
                    r.CurrentMeterReading!.Value))
                .ToListAsync(cancellationToken);

            var pumpHistory = await _context.Pumptransactions
                .AsNoTracking()
                .Where(t => t.VehicleId == vehicleId && !t.IsTransferMode && t.Odometer.HasValue && t.Odometer.Value > 0)
                .Select(t => new MeterReadingHistoryRecord(
                    t.Id,
                    "PumpTransaction",
                    t.DateTime,
                    t.Odometer!.Value))
                .ToListAsync(cancellationToken);

            return refillHistory
                .Concat(pumpHistory)
                .Where(r => r.Date < occurredAt || (r.Date == occurredAt && !(string.Equals(r.Source, currentSource, StringComparison.OrdinalIgnoreCase) && r.Id == currentReferenceId)))
                .OrderByDescending(r => r.Date)
                .ThenByDescending(r => r.Id)
                .FirstOrDefault();
        }

        private static decimal? CalculateDistanceOrHours(decimal? currentMeterReading, decimal? previousMeterReading)
        {
            if (!currentMeterReading.HasValue || !previousMeterReading.HasValue)
            {
                return null;
            }

            var difference = currentMeterReading.Value - previousMeterReading.Value;
            return difference > 0 ? difference : null;
        }

        private static decimal? CalculateFuelEfficiency(decimal? currentMeterReading, decimal? previousMeterReading, decimal fuelVolume, bool isKmPerLiter)
        {
            var distanceOrHours = CalculateDistanceOrHours(currentMeterReading, previousMeterReading);
            if (!distanceOrHours.HasValue || fuelVolume <= 0)
            {
                return null;
            }

            return isKmPerLiter
                ? Math.Round(distanceOrHours.Value / fuelVolume, 2)
                : Math.Round(fuelVolume / distanceOrHours.Value, 2);
        }

        private static string DetermineSeverity(decimal variancePercent)
        {
            if (variancePercent >= 50m)
            {
                return "Critical";
            }

            if (variancePercent >= 25m)
            {
                return "High";
            }

            if (variancePercent >= 10m)
            {
                return "Medium";
            }

            return "Low";
        }

        private static string BuildMessage(
            string? vehicleName,
            decimal actualValue,
            decimal expectedValue,
            decimal variancePercent,
            string measurementUnit,
            string source,
            bool isKmPerLiter)
        {
            var vehicleLabel = string.IsNullOrWhiteSpace(vehicleName) ? "Vehicle" : vehicleName;
            return isKmPerLiter
                ? $"{vehicleLabel} recorded {actualValue:F2} {measurementUnit} after {source}, below expected {expectedValue:F2} {measurementUnit} by {variancePercent:F1}%."
                : $"{vehicleLabel} recorded {actualValue:F2} {measurementUnit} after {source}, above expected {expectedValue:F2} {measurementUnit} by {variancePercent:F1}%.";
        }
    }
}