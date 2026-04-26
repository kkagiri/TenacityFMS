/**
 * File: GetVehicleTripLiveOperationsReportQuery.cs
 * Purpose: Builds a live fleet trip operations snapshot for reporting.
 * Dependencies: MediatR, FMSResponse, GpsdataContext, live trip operations DTOs.
 * Last Modified: 2026-03-13
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTrips.DTOs;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.VehicleTrips.Queries;

public record GetVehicleTripLiveOperationsReportQuery : IRequest<FMSResponse<VehicleTripLiveOperationsReportDTO>>
{
    public int? VehicleId { get; init; }
    public int? SiteId { get; init; }
    public DateTime? StartDate { get; init; }
    public DateTime? EndDate { get; init; }
    public int IdleThresholdMinutes { get; init; } = 15;
}

public class GetVehicleTripLiveOperationsReportQueryHandler : IRequestHandler<GetVehicleTripLiveOperationsReportQuery, FMSResponse<VehicleTripLiveOperationsReportDTO>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetVehicleTripLiveOperationsReportQueryHandler> _logger;

    public GetVehicleTripLiveOperationsReportQueryHandler(
        GpsdataContext context,
        ILogger<GetVehicleTripLiveOperationsReportQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<VehicleTripLiveOperationsReportDTO>> Handle(GetVehicleTripLiveOperationsReportQuery request, CancellationToken cancellationToken)
    {
        if (request.VehicleId.HasValue && request.VehicleId.Value <= 0)
        {
            return FMSResponse<VehicleTripLiveOperationsReportDTO>.ValidationFailed(new List<string> { "VehicleId must be greater than zero." });
        }

        if (request.SiteId.HasValue && request.SiteId.Value <= 0)
        {
            return FMSResponse<VehicleTripLiveOperationsReportDTO>.ValidationFailed(new List<string> { "SiteId must be greater than zero." });
        }

        if (request.IdleThresholdMinutes <= 0 || request.IdleThresholdMinutes > 1440)
        {
            return FMSResponse<VehicleTripLiveOperationsReportDTO>.ValidationFailed(new List<string> { "IdleThresholdMinutes must be between 1 and 1440." });
        }

        var startUtc = request.StartDate.HasValue
            ? DateTime.SpecifyKind(request.StartDate.Value.Date, DateTimeKind.Utc)
            : DateTime.UtcNow.Date;
        var endUtc = request.EndDate.HasValue
            ? DateTime.SpecifyKind(request.EndDate.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc)
            : DateTime.UtcNow.Date.AddDays(1).AddTicks(-1);

        if (startUtc > endUtc)
        {
            return FMSResponse<VehicleTripLiveOperationsReportDTO>.ValidationFailed(new List<string> { "StartDate must be earlier than or equal to EndDate." });
        }

        try
        {
            var query = _context.VehicleTripGroups
                .AsNoTracking()
                .Include(group => group.Vehicle)
                .Include(group => group.OriginSite)
                .Include(group => group.DestinationSite)
                .Include(group => group.Trips)
                    .ThenInclude(trip => trip.DestinationSite)
                .Where(group => group.StartTimeUtc <= endUtc && group.EndTimeUtc >= startUtc);

            if (request.VehicleId.HasValue)
            {
                query = query.Where(group => group.VehicleId == request.VehicleId.Value);
            }

            if (request.SiteId.HasValue)
            {
                query = query.Where(group => group.OriginSiteId == request.SiteId.Value || group.DestinationSiteId == request.SiteId.Value);
            }

            var groups = await query
                .OrderByDescending(group => group.StartTimeUtc)
                .ToListAsync(cancellationToken);

            var nowUtc = DateTime.UtcNow;
            var activeGroups = groups
                .Where(group => group.Status == (int)VehicleTripStatus.InProgress)
                .ToList();

            var travelingVehicles = activeGroups
                .Select(group =>
                {
                    var currentTrip = GetCurrentTrip(group);
                    return new VehicleTripLiveTravelingVehicleDTO
                    {
                        VehicleTripGroupId = group.VehicleTripGroupId,
                        VehicleTripId = currentTrip?.VehicleTripId ?? 0,
                        VehicleId = group.VehicleId,
                        VehicleLabel = BuildVehicleLabel(group.Vehicle.VehicleCode, group.Vehicle.NumberPlate),
                        NumberPlate = group.Vehicle.NumberPlate,
                        StartedAtUtc = group.StartTimeUtc,
                        LastUpdatedAtUtc = ResolveLastUpdatedUtc(group, currentTrip),
                        OriginDisplayName = ResolveOriginDisplayName(group, currentTrip),
                        DestinationDisplayName = ResolveDestinationDisplayName(group, currentTrip),
                        DistanceKm = currentTrip?.DistanceKm ?? group.TotalDistanceKm,
                        DurationMinutes = currentTrip?.DurationMinutes ?? group.TotalDurationMinutes,
                        MovementProfile = group.MovementProfile,
                        DetectionMode = group.DetectionMode,
                        Status = VehicleTripStatus.InProgress,
                        ConfidenceScore = currentTrip?.ConfidenceScore ?? group.ConfidenceScore,
                        ConfidenceBand = currentTrip?.ConfidenceBand ?? group.ConfidenceBand,
                    };
                })
                .Where(item => item.VehicleTripId > 0)
                .OrderBy(item => item.VehicleLabel)
                .ToList();

            var activeTrips = activeGroups
                .Select(group =>
                {
                    var currentTrip = GetCurrentTrip(group);
                    return new VehicleTripLiveActiveTripDTO
                    {
                        VehicleTripGroupId = group.VehicleTripGroupId,
                        VehicleTripId = currentTrip?.VehicleTripId ?? 0,
                        VehicleId = group.VehicleId,
                        VehicleLabel = BuildVehicleLabel(group.Vehicle.VehicleCode, group.Vehicle.NumberPlate),
                        NumberPlate = group.Vehicle.NumberPlate,
                        TripDate = group.TripDate,
                        StartedAtUtc = group.StartTimeUtc,
                        LastUpdatedAtUtc = ResolveLastUpdatedUtc(group, currentTrip),
                        OriginDisplayName = ResolveOriginDisplayName(group, currentTrip),
                        DestinationDisplayName = ResolveDestinationDisplayName(group, currentTrip),
                        CurrentLatitude = currentTrip?.EndLatitude ?? 0m,
                        CurrentLongitude = currentTrip?.EndLongitude ?? 0m,
                        DistanceKm = currentTrip?.DistanceKm ?? group.TotalDistanceKm,
                        DurationMinutes = currentTrip?.DurationMinutes ?? group.TotalDurationMinutes,
                        FuelConsumed = currentTrip?.FuelConsumed ?? group.TotalFuelConsumed,
                        MovementProfile = group.MovementProfile,
                        DetectionMode = group.DetectionMode,
                        Status = VehicleTripStatus.InProgress,
                        ConfidenceScore = currentTrip?.ConfidenceScore ?? group.ConfidenceScore,
                        ConfidenceBand = currentTrip?.ConfidenceBand ?? group.ConfidenceBand,
                        AnomalyFlags = currentTrip != null ? (VehicleTripAnomalyType)currentTrip.AnomalyFlags : (VehicleTripAnomalyType)group.AnomalyFlags,
                        IsOutOfBounds = currentTrip?.IsOutOfBounds ?? group.IsOutOfBounds,
                    };
                })
                .Where(item => item.VehicleTripId > 0)
                .OrderBy(item => item.VehicleLabel)
                .ToList();

            var tripCounts = groups
                .GroupBy(group => new
                {
                    group.VehicleId,
                    VehicleLabel = BuildVehicleLabel(group.Vehicle.VehicleCode, group.Vehicle.NumberPlate),
                    group.Vehicle.NumberPlate,
                })
                .Select(group => new VehicleTripLiveVehicleCountDTO
                {
                    VehicleId = group.Key.VehicleId,
                    VehicleLabel = group.Key.VehicleLabel,
                    NumberPlate = group.Key.NumberPlate,
                    TripGroupCount = group.Count(),
                    TripLegCount = group.Sum(item => item.TripCount),
                    ActiveTripCount = group.Count(item => item.Status == (int)VehicleTripStatus.InProgress),
                    LoadCycleCount = group.Count(item => item.GroupingType == (int)VehicleTripGroupingType.LoadCycle),
                    RoundTripCount = group.Count(item => item.GroupingType == (int)VehicleTripGroupingType.RoundTrip),
                    TotalDistanceKm = group.Sum(item => item.TotalDistanceKm),
                })
                .OrderByDescending(item => item.TripLegCount)
                .ThenBy(item => item.VehicleLabel)
                .ToList();

            var tipperCycles = groups
                .Where(group => group.MovementProfile == VehicleMovementProfile.Cluster || group.GroupingType == (int)VehicleTripGroupingType.LoadCycle)
                .GroupBy(group => new
                {
                    group.VehicleId,
                    VehicleLabel = BuildVehicleLabel(group.Vehicle.VehicleCode, group.Vehicle.NumberPlate),
                    group.Vehicle.NumberPlate,
                })
                .Select(group =>
                {
                    var ordered = group.OrderByDescending(item => item.StartTimeUtc).ToList();
                    return new VehicleTripLiveTipperCycleDTO
                    {
                        VehicleId = group.Key.VehicleId,
                        VehicleLabel = group.Key.VehicleLabel,
                        NumberPlate = group.Key.NumberPlate,
                        TotalCycleCount = group.Count(item => item.GroupingType == (int)VehicleTripGroupingType.LoadCycle),
                        CompletedCycleCount = group.Count(item => item.GroupingType == (int)VehicleTripGroupingType.LoadCycle && item.Status == (int)VehicleTripStatus.Completed),
                        ActiveCycleCount = group.Count(item => item.GroupingType == (int)VehicleTripGroupingType.LoadCycle && item.Status == (int)VehicleTripStatus.InProgress),
                        TotalDistanceKm = group.Sum(item => item.TotalDistanceKm),
                        LastCycleStartedAtUtc = ordered.FirstOrDefault(item => item.GroupingType == (int)VehicleTripGroupingType.LoadCycle)?.StartTimeUtc,
                    };
                })
                .Where(item => item.TotalCycleCount > 0 || item.ActiveCycleCount > 0)
                .OrderByDescending(item => item.TotalCycleCount)
                .ThenBy(item => item.VehicleLabel)
                .ToList();

            var idleOutsideWorkZones = activeGroups
                .Select(group =>
                {
                    var currentTrip = GetCurrentTrip(group);
                    var lastUpdatedUtc = ResolveLastUpdatedUtc(group, currentTrip);
                    var idleMinutes = Math.Round(Convert.ToDecimal((nowUtc - lastUpdatedUtc).TotalMinutes), 2);
                    var groupFlags = (VehicleTripAnomalyType)group.AnomalyFlags;
                    var tripFlags = currentTrip != null ? (VehicleTripAnomalyType)currentTrip.AnomalyFlags : VehicleTripAnomalyType.None;
                    var flags = groupFlags | tripFlags;
                    var isOutOfBounds = (currentTrip?.IsOutOfBounds ?? group.IsOutOfBounds) == true;
                    var offSiteIdleSuspected = flags.HasFlag(VehicleTripAnomalyType.OffSiteIdleSuspected);

                    return new VehicleTripLiveIdleOutsideZoneDTO
                    {
                        VehicleTripGroupId = group.VehicleTripGroupId,
                        VehicleTripId = currentTrip?.VehicleTripId ?? 0,
                        VehicleId = group.VehicleId,
                        VehicleLabel = BuildVehicleLabel(group.Vehicle.VehicleCode, group.Vehicle.NumberPlate),
                        NumberPlate = group.Vehicle.NumberPlate,
                        LocationDisplayName = ResolveDestinationDisplayName(group, currentTrip),
                        StartedAtUtc = group.StartTimeUtc,
                        LastUpdatedAtUtc = lastUpdatedUtc,
                        IdleMinutes = idleMinutes,
                        IsOutOfBounds = isOutOfBounds,
                        OffSiteIdleSuspected = offSiteIdleSuspected,
                        AnomalyFlags = flags,
                    };
                })
                .Where(item => item.VehicleTripId > 0
                    && item.IdleMinutes >= request.IdleThresholdMinutes
                    && (item.IsOutOfBounds || item.OffSiteIdleSuspected))
                .OrderByDescending(item => item.IdleMinutes)
                .ThenBy(item => item.VehicleLabel)
                .ToList();

            var report = new VehicleTripLiveOperationsReportDTO
            {
                StartUtc = startUtc,
                EndUtc = endUtc,
                IdleThresholdMinutes = request.IdleThresholdMinutes,
                Records = activeTrips,
                VehiclesCurrentlyTraveling = travelingVehicles,
                ActiveTripsInProgress = activeTrips,
                TripCountsPerVehicle = tripCounts,
                LiveTipperCycleCounts = tipperCycles,
                VehiclesIdleOutsideWorkZones = idleOutsideWorkZones,
                Summary = new VehicleTripLiveOperationsSummaryDTO
                {
                    VehiclesCurrentlyTravelingCount = travelingVehicles.Count,
                    ActiveTripsInProgressCount = activeTrips.Count,
                    VehiclesWithTripCountsCount = tripCounts.Count,
                    LiveTipperCycleVehicleCount = tipperCycles.Count,
                    VehiclesIdleOutsideWorkZonesCount = idleOutsideWorkZones.Count,
                    TotalTripGroups = groups.Count,
                    TotalTripLegs = groups.Sum(group => group.TripCount),
                    TotalActiveDistanceKm = activeTrips.Sum(trip => trip.DistanceKm),
                    TotalActiveDurationMinutes = activeTrips.Sum(trip => trip.DurationMinutes),
                },
            };

            return FMSResponse<VehicleTripLiveOperationsReportDTO>.Success(report, "Live trip operations snapshot retrieved successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading live trip operations report data");
            return FMSResponse<VehicleTripLiveOperationsReportDTO>.SystemError($"Failed to read live trip operations report data: {ex.Message}");
        }
    }

    private static VehicleTrip? GetCurrentTrip(VehicleTripGroup group)
    {
        return group.Trips
            .OrderByDescending(trip => trip.SequenceNo)
            .FirstOrDefault(trip => trip.Status == (int)VehicleTripStatus.InProgress)
            ?? group.Trips.OrderByDescending(trip => trip.SequenceNo).FirstOrDefault();
    }

    private static DateTime ResolveLastUpdatedUtc(VehicleTripGroup group, VehicleTrip? currentTrip)
    {
        return group.UpdatedAtUtc
            ?? currentTrip?.EndTimeUtc
            ?? group.EndTimeUtc;
    }

    private static string ResolveOriginDisplayName(VehicleTripGroup group, VehicleTrip? currentTrip)
    {
        if (group.OriginSite != null)
        {
            return group.OriginSite.Name;
        }

        if (currentTrip != null)
        {
            return $"Cluster ({currentTrip.StartLatitude:F5}, {currentTrip.StartLongitude:F5})";
        }

        return "Unknown";
    }

    private static string ResolveDestinationDisplayName(VehicleTripGroup group, VehicleTrip? currentTrip)
    {
        if (group.DestinationSite != null)
        {
            return group.DestinationSite.Name;
        }

        if (currentTrip?.DestinationSite != null)
        {
            return currentTrip.DestinationSite.Name;
        }

        if (currentTrip != null)
        {
            return $"Cluster ({currentTrip.EndLatitude:F5}, {currentTrip.EndLongitude:F5})";
        }

        return "Unknown";
    }

    private static string BuildVehicleLabel(string? vehicleCode, string? numberPlate)
    {
        return !string.IsNullOrWhiteSpace(numberPlate)
            ? $"{vehicleCode} / {numberPlate}"
            : vehicleCode ?? string.Empty;
    }
}