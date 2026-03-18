/**
 * File: VehicleTripFuelContextService.cs
 * Purpose: Fills trip fuel metrics from persisted fuel audit readings when available.
 * Dependencies: DbContext, fuel audit readings, trip detection DTOs.
 * Last Modified: 2026-03-11
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.VehicleTrips.DTOs;
using FMS.Domain.Entities.FuelAudit;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.VehicleTrips.Services;

public class VehicleTripFuelContextService : IVehicleTripFuelContextService
{
    private readonly GpsdataContext _context;
    private readonly IVehicleTripSettingsService _vehicleTripSettingsService;
    private readonly ILogger<VehicleTripFuelContextService> _logger;

    public VehicleTripFuelContextService(
        GpsdataContext context,
        IVehicleTripSettingsService vehicleTripSettingsService,
        ILogger<VehicleTripFuelContextService> logger)
    {
        _context = context;
        _vehicleTripSettingsService = vehicleTripSettingsService;
        _logger = logger;
    }

    public async Task EnrichTripsAsync(int vehicleId, IReadOnlyCollection<VehicleTripDetectionResultDTO> trips, CancellationToken cancellationToken = default)
    {
        if (trips.Count == 0)
        {
            return;
        }

        var settings = await _vehicleTripSettingsService.GetSettingsAsync(cancellationToken);
        if (!settings.EnableFuelContextEnrichment)
        {
            foreach (var trip in trips)
            {
                trip.FuelAtDeparture = null;
                trip.FuelAtArrival = null;
                trip.FuelConsumed = null;
                trip.FuelRateKmPerLiter = null;
                trip.HasFuelData = false;
                trip.FuelDataQuality = "Disabled";
            }

            return;
        }

        var lookupWindow = TimeSpan.FromHours((double)settings.FuelLookupWindowHours);
        var fromUtc = trips.Min(trip => trip.StartTimeUtc).Subtract(lookupWindow);
        var toUtc = trips.Max(trip => trip.EndTimeUtc).Add(lookupWindow);

        var readings = await _context.FuelAuditGPSReadings
            .AsNoTracking()
            .Where(reading => reading.VehicleId == vehicleId
                && reading.FuelLevel.HasValue
                && reading.ReadingTimestamp.HasValue
                && reading.ReadingTimestamp.Value >= fromUtc
                && reading.ReadingTimestamp.Value <= toUtc)
            .OrderBy(reading => reading.ReadingTimestamp)
            .ToListAsync(cancellationToken);

        if (readings.Count == 0)
        {
            return;
        }

        foreach (var trip in trips)
        {
            var departureReading = ResolveReading(readings, trip.StartTrackInfoId, trip.StartTimeUtc, lookupWindow);
            var arrivalReading = ResolveReading(readings, trip.EndTrackInfoId, trip.EndTimeUtc, lookupWindow);

            trip.FuelAtDeparture ??= departureReading?.FuelLevel;
            trip.FuelAtArrival ??= arrivalReading?.FuelLevel;
            trip.HasFuelData = trip.FuelAtDeparture.HasValue && trip.FuelAtArrival.HasValue;
            trip.FuelDataQuality = ResolveTripFuelDataQuality(departureReading, arrivalReading, trip.HasFuelData);

            if (!trip.FuelConsumed.HasValue && trip.FuelAtDeparture.HasValue && trip.FuelAtArrival.HasValue)
            {
                trip.FuelConsumed = Math.Round(trip.FuelAtDeparture.Value - trip.FuelAtArrival.Value, 2);
            }

            if (trip.FuelConsumed.HasValue && trip.FuelConsumed.Value > 0m && trip.DistanceKm > 0m)
            {
                trip.FuelRateKmPerLiter = Math.Round(trip.DistanceKm / trip.FuelConsumed.Value, 2);
            }
        }

        _logger.LogDebug("Trip fuel enrichment applied using {ReadingCount} fuel audit reading(s) for vehicle {VehicleId}.", readings.Count, vehicleId);
    }

    private static FuelAuditGPSReading? ResolveReading(
        IReadOnlyCollection<FuelAuditGPSReading> readings,
        int? trackInfoId,
        DateTime targetTimeUtc,
        TimeSpan lookupWindow)
    {
        if (trackInfoId.HasValue)
        {
            var trackMatch = readings
                .Where(reading => reading.TrackInfoId == trackInfoId.Value)
                .OrderBy(reading => Math.Abs((reading.ReadingTimestamp!.Value - targetTimeUtc).TotalMinutes))
                .FirstOrDefault();

            if (trackMatch != null)
            {
                return trackMatch;
            }
        }

        return readings
            .Where(reading => Math.Abs((reading.ReadingTimestamp!.Value - targetTimeUtc).TotalMinutes) <= lookupWindow.TotalMinutes)
            .OrderBy(reading => Math.Abs((reading.ReadingTimestamp!.Value - targetTimeUtc).TotalMinutes))
            .FirstOrDefault();
    }

    private static string ResolveTripFuelDataQuality(
        FuelAuditGPSReading? departureReading,
        FuelAuditGPSReading? arrivalReading,
        bool hasFuelData)
    {
        if (!hasFuelData)
        {
            return "Missing";
        }

        var departureQuality = departureReading?.DataQuality?.Trim() ?? "Missing";
        var arrivalQuality = arrivalReading?.DataQuality?.Trim() ?? "Missing";

        if (string.Equals(departureQuality, "Exact", StringComparison.OrdinalIgnoreCase)
            && string.Equals(arrivalQuality, "Exact", StringComparison.OrdinalIgnoreCase))
        {
            return "Exact";
        }

        if (string.Equals(departureQuality, "Interpolated", StringComparison.OrdinalIgnoreCase)
            || string.Equals(arrivalQuality, "Interpolated", StringComparison.OrdinalIgnoreCase)
            || string.Equals(departureQuality, "SensorNotReporting", StringComparison.OrdinalIgnoreCase)
            || string.Equals(arrivalQuality, "SensorNotReporting", StringComparison.OrdinalIgnoreCase))
        {
            return "Weak";
        }

        return "Derived";
    }
}
