/**
 * File: VehicleTripOrchestrationService.cs
 * Purpose: Coordinates trip detection, idempotent persistence, and grouped trip creation for backend workflows.
 * Dependencies: DbContext, trip detection services, FMSResponse, vehicle trip entities.
 * Last Modified: 2026-03-11
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Communication.SignalR;
using FMS.Application.Features.VehicleTrips.Commands;
using FMS.Application.Features.VehicleTrips.DTOs;
using FMS.Application.Features.VehicleTrips.Validators;
using FMS.Application.Features.Dashboard;
using FMS.Application.Services.Dashboard;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using VehicleEntity = FMS.Domain.Entities.Vehicle;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.VehicleTrips.Services;

public class VehicleTripOrchestrationService : IVehicleTripOrchestrationService
{
    private readonly GpsdataContext _context;
    private readonly IVehicleTripGeofenceDetectionService _geofenceDetectionService;
    private readonly IVehicleTripClusterDetectionService _clusterDetectionService;
    private readonly IVehicleTripGroupingService _groupingService;
    private readonly IVehicleTripConfidenceScoringService _confidenceScoringService;
    private readonly IVehicleTripFuelContextService _fuelContextService;
    private readonly IRecomputeVehicleTripsCommandValidator _validator;
    private readonly IDataSourceManager _dataSourceManager;
    private readonly IHubContext<DashboardHub> _dashboardHubContext;
    private readonly ILogger<VehicleTripOrchestrationService> _logger;

    public VehicleTripOrchestrationService(
        GpsdataContext context,
        IVehicleTripGeofenceDetectionService geofenceDetectionService,
        IVehicleTripClusterDetectionService clusterDetectionService,
        IVehicleTripGroupingService groupingService,
        IVehicleTripConfidenceScoringService confidenceScoringService,
        IVehicleTripFuelContextService fuelContextService,
        IRecomputeVehicleTripsCommandValidator validator,
        IDataSourceManager dataSourceManager,
        IHubContext<DashboardHub> dashboardHubContext,
        ILogger<VehicleTripOrchestrationService> logger)
    {
        _context = context;
        _geofenceDetectionService = geofenceDetectionService;
        _clusterDetectionService = clusterDetectionService;
        _groupingService = groupingService;
        _confidenceScoringService = confidenceScoringService;
        _fuelContextService = fuelContextService;
        _validator = validator;
        _dataSourceManager = dataSourceManager;
        _dashboardHubContext = dashboardHubContext;
        _logger = logger;
    }

    public async Task<FMSResponse<VehicleTripRecomputeResultDTO>> RecomputeVehicleTripsAsync(
        int vehicleId,
        DateTime? fromUtc,
        DateTime? toUtc,
        CancellationToken cancellationToken = default)
    {
        var effectiveFromUtc = fromUtc?.ToUniversalTime() ?? DateTime.UtcNow.AddDays(-7);
        var effectiveToUtc = toUtc?.ToUniversalTime() ?? DateTime.UtcNow;

        var validationErrors = _validator.Validate(new RecomputeVehicleTripsCommand
        {
            VehicleId = vehicleId,
            FromUtc = fromUtc,
            ToUtc = toUtc,
        });

        if (validationErrors.Count > 0)
        {
            return FMSResponse<VehicleTripRecomputeResultDTO>.ValidationFailed(validationErrors);
        }

        var vehicle = await _context.Vehicles
            .FirstOrDefaultAsync(v => v.VehicleId == vehicleId, cancellationToken);

        if (vehicle == null)
        {
            return FMSResponse<VehicleTripRecomputeResultDTO>.NotFound("VEHICLE_NOT_FOUND", $"Vehicle {vehicleId} was not found.");
        }

        if (!await HasGpsDeviceConfiguredAsync(vehicleId, cancellationToken))
        {
            return FMSResponse<VehicleTripRecomputeResultDTO>.ValidationFailed(
                new List<string> { "Vehicle doesn't have an active GPS provider mapping or legacy device ID configured." },
                "VEHICLE_GPS_DEVICE_NOT_CONFIGURED");
        }

        try
        {
            var executionStrategy = _context.Database.CreateExecutionStrategy();
            var persistedResult = await executionStrategy.ExecuteAsync(async () =>
            {
                await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

                await DeleteExistingTripsAsync(vehicleId, effectiveFromUtc, effectiveToUtc, cancellationToken);

                var detectedTrips = new List<VehicleTripDetectionResultDTO>();
                foreach (var processingWindow in BuildProcessingWindows(effectiveFromUtc, effectiveToUtc))
                {
                    var dayTrips = await DetectTripsAsync(vehicle, processingWindow.FromUtc, processingWindow.ToUtc, cancellationToken);
                    detectedTrips.AddRange(dayTrips);
                }

                await _fuelContextService.EnrichTripsAsync(vehicle.VehicleId, detectedTrips, cancellationToken);
                await _confidenceScoringService.ScoreTripsAsync(detectedTrips, cancellationToken);

                var recomputeResult = await PersistDetectedTripsAsync(vehicle, effectiveFromUtc, effectiveToUtc, detectedTrips, cancellationToken);
                await transaction.CommitAsync(cancellationToken);
                return recomputeResult;
            });

            return FMSResponse<VehicleTripRecomputeResultDTO>.Success(
                persistedResult,
                persistedResult.TripsCreated == 0
                    ? "Trip recompute completed. No trips were detected for the selected period."
                    : "Trip recompute completed successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error orchestrating trip recompute for vehicle {VehicleId}", vehicleId);
            return FMSResponse<VehicleTripRecomputeResultDTO>.SystemError($"Failed to recompute trips: {ex.Message}");
        }
    }

    private static List<(DateTime FromUtc, DateTime ToUtc)> BuildProcessingWindows(DateTime fromUtc, DateTime toUtc)
    {
        var windows = new List<(DateTime FromUtc, DateTime ToUtc)>();
        var currentDayStart = fromUtc.Date;

        while (currentDayStart < toUtc)
        {
            var nextDayStart = currentDayStart.AddDays(1);
            var windowFromUtc = currentDayStart < fromUtc ? fromUtc : currentDayStart;
            var windowToUtc = nextDayStart > toUtc ? toUtc : nextDayStart;

            if (windowFromUtc < windowToUtc)
            {
                windows.Add((windowFromUtc, windowToUtc));
            }

            currentDayStart = nextDayStart;
        }

        return windows;
    }

    private async Task<bool> HasGpsDeviceConfiguredAsync(int vehicleId, CancellationToken cancellationToken)
    {
        var hasProviderMapping = await _context.VehicleProviderMappings
            .AsNoTracking()
            .AnyAsync(mapping => mapping.VehicleId == vehicleId
                && mapping.IsActive
                && !string.IsNullOrWhiteSpace(mapping.ExternalDeviceId)
                && (mapping.ProviderConfiguration == null || mapping.ProviderConfiguration.IsEnabled)
                && (mapping.ProviderConfiguration == null || mapping.ProviderConfiguration.Name == "GPSGate"),
                cancellationToken);

        return hasProviderMapping;
    }

    private async Task DeleteExistingTripsAsync(int vehicleId, DateTime fromUtc, DateTime toUtc, CancellationToken cancellationToken)
    {
        var existingTrips = await _context.VehicleTrips
            .Where(t => t.VehicleId == vehicleId
                && !t.DetectionMode.StartsWith(VehicleTripDetectionModeHelper.ManualOverridePrefix)
                && !t.DetectionMode.StartsWith(VehicleTripDetectionModeHelper.SupersededPrefix)
                && t.StartTimeUtc <= toUtc
                && t.EndTimeUtc >= fromUtc)
            .ToListAsync(cancellationToken);

        if (existingTrips.Count > 0)
        {
            _context.VehicleTrips.RemoveRange(existingTrips);
        }

        var existingGroups = await _context.VehicleTripGroups
            .Where(g => g.VehicleId == vehicleId
                && !g.DetectionMode.StartsWith(VehicleTripDetectionModeHelper.ManualOverridePrefix)
                && !g.DetectionMode.StartsWith(VehicleTripDetectionModeHelper.SupersededPrefix)
                && g.StartTimeUtc <= toUtc
                && g.EndTimeUtc >= fromUtc)
            .ToListAsync(cancellationToken);

        if (existingGroups.Count > 0)
        {
            _context.VehicleTripGroups.RemoveRange(existingGroups);
        }

        if (existingTrips.Count > 0 || existingGroups.Count > 0)
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    private async Task<List<VehicleTripDetectionResultDTO>> DetectTripsAsync(
        VehicleEntity vehicle,
        DateTime fromUtc,
        DateTime toUtc,
        CancellationToken cancellationToken)
    {
        return vehicle.MovementProfile switch
        {
            VehicleMovementProfile.Cluster => await _clusterDetectionService.DetectTripsAsync(vehicle, fromUtc, toUtc, cancellationToken),
            VehicleMovementProfile.Geofence or VehicleMovementProfile.Undefined => await _geofenceDetectionService.DetectTripsAsync(vehicle, fromUtc, toUtc, cancellationToken),
            _ => throw new InvalidOperationException($"Movement profile '{vehicle.MovementProfile}' is not supported for trip recompute."),
        };
    }

    private async Task<VehicleTripRecomputeResultDTO> PersistDetectedTripsAsync(
        VehicleEntity vehicle,
        DateTime fromUtc,
        DateTime toUtc,
        List<VehicleTripDetectionResultDTO> detectedTrips,
        CancellationToken cancellationToken)
    {
        var groupedTrips = _groupingService.GroupTrips(vehicle, detectedTrips)
            .OrderBy(g => g.TripDate)
            .ThenBy(g => g.StartTimeUtc)
            .ToList();

        await _confidenceScoringService.ScoreGroupsAsync(groupedTrips, cancellationToken);

        var persistedGroupEntities = new List<VehicleTripGroup>();
        var groupsCreated = 0;
        var tripsCreated = 0;
        var roundTripGroupsCreated = 0;
        var loadCycleGroupsCreated = 0;
        var lowConfidenceTrips = detectedTrips.Count(t => t.IsLowConfidence);
        var tripsWithAnomalies = detectedTrips.Count(t => t.AnomalyFlags != VehicleTripAnomalyType.None);
        var completedTrips = detectedTrips.Count(t => t.Status == VehicleTripStatus.Completed);
        var inProgressTrips = detectedTrips.Count(t => t.Status == VehicleTripStatus.InProgress);
        decimal? totalFuelConsumed = null;

        foreach (var groupedTrip in groupedTrips)
        {
            var orderedTrips = groupedTrip.Trips.OrderBy(t => t.StartTimeUtc).ToList();
            var groupFuelConsumed = orderedTrips.Where(t => t.FuelConsumed.HasValue).Sum(t => t.FuelConsumed ?? 0m);

            if (orderedTrips.Any(t => t.FuelConsumed.HasValue))
            {
                totalFuelConsumed ??= 0m;
                totalFuelConsumed += groupFuelConsumed;
            }

            var group = new VehicleTripGroup
            {
                VehicleId = vehicle.VehicleId,
                TripDate = groupedTrip.TripDate,
                StartTimeUtc = groupedTrip.StartTimeUtc,
                EndTimeUtc = groupedTrip.EndTimeUtc,
                OriginSiteId = groupedTrip.OriginSiteId,
                DestinationSiteId = groupedTrip.DestinationSiteId,
                TripCount = orderedTrips.Count,
                TotalDistanceKm = groupedTrip.TotalDistanceKm,
                TotalDurationMinutes = groupedTrip.TotalDurationMinutes,
                Status = orderedTrips.Any(trip => trip.Status == VehicleTripStatus.InProgress)
                    ? (int)VehicleTripStatus.InProgress
                    : (int)VehicleTripStatus.Completed,
                MovementProfile = groupedTrip.MovementProfile,
                DetectionMode = groupedTrip.DetectionMode,
                TotalFuelConsumed = orderedTrips.Any(t => t.FuelConsumed.HasValue) ? groupFuelConsumed : null,
                GroupingType = (int)groupedTrip.GroupingType,
                ConfidenceScore = groupedTrip.ConfidenceScore,
                ConfidenceBand = groupedTrip.ConfidenceBand,
                AnomalyFlags = (int)groupedTrip.AnomalyFlags,
                ReconciliationStatus = (int)groupedTrip.ReconciliationStatus,
                ProjectPlanId = groupedTrip.ProjectPlanId ?? orderedTrips.Select(t => t.ProjectPlanId).FirstOrDefault(id => id.HasValue),
                WorkShiftId = groupedTrip.WorkShiftId ?? orderedTrips.Select(t => t.WorkShiftId).FirstOrDefault(id => id.HasValue),
                PlannedHaulRouteId = groupedTrip.PlannedHaulRouteId ?? orderedTrips.Select(t => t.PlannedHaulRouteId).FirstOrDefault(id => id.HasValue),
                PlannedOriginZoneId = groupedTrip.PlannedOriginZoneId ?? orderedTrips.FirstOrDefault()?.PlannedOriginZoneId,
                PlannedDestinationZoneId = groupedTrip.PlannedDestinationZoneId ?? orderedTrips.LastOrDefault()?.PlannedDestinationZoneId,
                PlanningMatchStatus = groupedTrip.PlanningMatchStatus,
                IsOutOfBounds = groupedTrip.IsOutOfBounds,
                IsProductiveMovement = groupedTrip.IsProductiveMovement,
                CreatedAtUtc = DateTime.UtcNow,
                UpdatedAtUtc = DateTime.UtcNow,
            };

            var sequenceNo = 1;
            foreach (var detectedTrip in orderedTrips)
            {
                group.Trips.Add(new VehicleTrip
                {
                    VehicleId = vehicle.VehicleId,
                    SequenceNo = sequenceNo++,
                    StartTimeUtc = detectedTrip.StartTimeUtc,
                    EndTimeUtc = detectedTrip.EndTimeUtc,
                    OriginSiteId = detectedTrip.OriginSiteId,
                    DestinationSiteId = detectedTrip.DestinationSiteId,
                    OriginGeofenceId = detectedTrip.OriginGeofenceId,
                    DestinationGeofenceId = detectedTrip.DestinationGeofenceId,
                    StartLatitude = detectedTrip.StartLatitude,
                    StartLongitude = detectedTrip.StartLongitude,
                    EndLatitude = detectedTrip.EndLatitude,
                    EndLongitude = detectedTrip.EndLongitude,
                    DistanceKm = detectedTrip.DistanceKm,
                    DurationMinutes = detectedTrip.DurationMinutes,
                    MaxSpeedKph = detectedTrip.MaxSpeedKph,
                    Status = (int)detectedTrip.Status,
                    MovementProfile = detectedTrip.MovementProfile,
                    DetectionMode = detectedTrip.DetectionMode,
                    StartTrackInfoId = detectedTrip.StartTrackInfoId,
                    EndTrackInfoId = detectedTrip.EndTrackInfoId,
                    FuelAtDeparture = detectedTrip.FuelAtDeparture,
                    FuelAtArrival = detectedTrip.FuelAtArrival,
                    FuelConsumed = detectedTrip.FuelConsumed,
                    ConfidenceScore = detectedTrip.ConfidenceScore,
                    ConfidenceBand = detectedTrip.ConfidenceBand,
                    AnomalyFlags = (int)detectedTrip.AnomalyFlags,
                    ReconciliationStatus = (int)detectedTrip.ReconciliationStatus,
                    IsLowConfidence = detectedTrip.IsLowConfidence,
                    ProjectPlanId = detectedTrip.ProjectPlanId,
                    WorkShiftId = detectedTrip.WorkShiftId,
                    PlannedHaulRouteId = detectedTrip.PlannedHaulRouteId,
                    PlannedOriginZoneId = detectedTrip.PlannedOriginZoneId,
                    PlannedDestinationZoneId = detectedTrip.PlannedDestinationZoneId,
                    PlanningMatchStatus = detectedTrip.PlanningMatchStatus,
                    IsOutOfBounds = detectedTrip.IsOutOfBounds,
                    IsProductiveMovement = detectedTrip.IsProductiveMovement,
                    CreatedAtUtc = DateTime.UtcNow,
                });
            }

            _context.VehicleTripGroups.Add(group);
            persistedGroupEntities.Add(group);
            groupsCreated++;
            tripsCreated += orderedTrips.Count;

            if (groupedTrip.GroupingType == VehicleTripGroupingType.RoundTrip)
            {
                roundTripGroupsCreated++;
            }

            if (groupedTrip.GroupingType == VehicleTripGroupingType.LoadCycle)
            {
                loadCycleGroupsCreated++;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        await PublishTripRealtimeUpdatesAsync(vehicle, persistedGroupEntities, cancellationToken);
        await BroadcastDashboardTripMetricsAsync(cancellationToken);

        return new VehicleTripRecomputeResultDTO
        {
            VehicleId = vehicle.VehicleId,
            FromUtc = fromUtc,
            ToUtc = toUtc,
            GroupsCreated = groupsCreated,
            TripsCreated = tripsCreated,
            CompletedTrips = completedTrips,
            InProgressTrips = inProgressTrips,
            RoundTripGroupsCreated = roundTripGroupsCreated,
            LoadCycleGroupsCreated = loadCycleGroupsCreated,
            LowConfidenceTrips = lowConfidenceTrips,
            TripsWithAnomalies = tripsWithAnomalies,
            TotalFuelConsumed = totalFuelConsumed,
            MovementProfile = vehicle.MovementProfile,
        };
    }

    private async Task PublishTripRealtimeUpdatesAsync(
        VehicleEntity vehicle,
        List<VehicleTripGroup> persistedGroups,
        CancellationToken cancellationToken)
    {
        if (persistedGroups.Count == 0)
        {
            return;
        }

        var relevantSiteIds = persistedGroups
            .SelectMany(group => new[]
            {
                group.OriginSiteId,
                group.DestinationSiteId,
                vehicle.WorkingSiteId
            })
            .Where(siteId => siteId.HasValue)
            .Select(siteId => siteId!.Value)
            .Distinct()
            .ToList();

        var siteLookup = relevantSiteIds.Count == 0
            ? new Dictionary<int, string>()
            : await _context.Sites
                .AsNoTracking()
                .Where(site => relevantSiteIds.Contains(site.Id))
                .ToDictionaryAsync(site => site.Id, site => site.Name, cancellationToken);

        var vehicleLabel = BuildVehicleLabel(vehicle);
        var publishCutoffUtc = DateTime.UtcNow.AddHours(-24);

        foreach (var group in persistedGroups)
        {
            var originSiteName = ResolveSiteName(siteLookup, group.OriginSiteId);
            var estimatedDestinationName = ResolveSiteName(siteLookup, group.DestinationSiteId)
                ?? ResolveSiteName(siteLookup, vehicle.WorkingSiteId)
                ?? "Pending destination";

            foreach (var trip in group.Trips.OrderBy(item => item.SequenceNo))
            {
                if (trip.StartTimeUtc >= publishCutoffUtc)
                {
                    await PublishTripEventAsync(
                        "TripStarted",
                        new VehicleTripStartedEventDTO
                        {
                            VehicleId = trip.VehicleId,
                            VehicleLabel = vehicleLabel,
                            VehicleTripGroupId = group.VehicleTripGroupId,
                            VehicleTripId = trip.VehicleTripId,
                            StartedAtUtc = trip.StartTimeUtc,
                            OriginSiteId = trip.OriginSiteId,
                            OriginSiteName = originSiteName,
                            EstimatedDestinationName = estimatedDestinationName,
                            StartLatitude = trip.StartLatitude,
                            StartLongitude = trip.StartLongitude,
                            Status = VehicleTripStatus.InProgress,
                        },
                        cancellationToken);
                }

                if (trip.Status == (int)VehicleTripStatus.InProgress)
                {
                    await PublishTripEventAsync(
                        "TripInProgress",
                        new VehicleTripInProgressEventDTO
                        {
                            VehicleId = trip.VehicleId,
                            VehicleLabel = vehicleLabel,
                            VehicleTripGroupId = group.VehicleTripGroupId,
                            VehicleTripId = trip.VehicleTripId,
                            EventTimeUtc = DateTime.UtcNow,
                            OriginSiteId = trip.OriginSiteId,
                            OriginSiteName = originSiteName,
                            EstimatedDestinationSiteId = trip.DestinationSiteId ?? vehicle.WorkingSiteId,
                            EstimatedDestinationName = estimatedDestinationName,
                            CurrentLatitude = trip.EndLatitude != 0m ? trip.EndLatitude : trip.StartLatitude,
                            CurrentLongitude = trip.EndLongitude != 0m ? trip.EndLongitude : trip.StartLongitude,
                            DistanceKm = trip.DistanceKm,
                            DurationMinutes = trip.DurationMinutes,
                            Status = VehicleTripStatus.InProgress,
                        },
                        cancellationToken);
                }

                if (trip.Status == (int)VehicleTripStatus.Completed && trip.EndTimeUtc >= publishCutoffUtc)
                {
                    await PublishTripEventAsync(
                        "TripCompleted",
                        new VehicleTripCompletedEventDTO
                        {
                            VehicleId = trip.VehicleId,
                            VehicleLabel = vehicleLabel,
                            VehicleTripGroupId = group.VehicleTripGroupId,
                            VehicleTripId = trip.VehicleTripId,
                            CompletedAtUtc = trip.EndTimeUtc,
                            DestinationSiteId = trip.DestinationSiteId,
                            DestinationSiteName = ResolveSiteName(siteLookup, trip.DestinationSiteId),
                            EndLatitude = trip.EndLatitude,
                            EndLongitude = trip.EndLongitude,
                            DistanceKm = trip.DistanceKm,
                            DurationMinutes = trip.DurationMinutes,
                            FuelConsumed = trip.FuelConsumed,
                            Status = VehicleTripStatus.Completed,
                        },
                        cancellationToken);
                }
            }
        }
    }

    private async Task PublishTripEventAsync(string eventName, object payload, CancellationToken cancellationToken)
    {
        await _dashboardHubContext.Clients.All.SendAsync(eventName, payload, cancellationToken);
        await _dashboardHubContext.Clients.All.SendAsync(
            "TripEvent",
            new
            {
                eventType = eventName,
                data = payload,
                timestamp = DateTime.UtcNow,
            },
            cancellationToken);
    }

    private async Task BroadcastDashboardTripMetricsAsync(CancellationToken cancellationToken)
    {
        var liveRequest = new DashboardMetricRequestDto
        {
            MetricType = string.Empty,
            Mode = "live",
            DatePreset = "today",
        };

        var snapshotRequest = new DashboardMetricRequestDto
        {
            MetricType = string.Empty,
            Mode = "historical_snapshot",
            DatePreset = "today",
        };

        var sources = new[]
        {
            new { DataSource = "trip_in_transit", Request = liveRequest, IsLive = true },
            new { DataSource = "vehicles_at_site", Request = liveRequest, IsLive = true },
            new { DataSource = "trip_count_vs_expected", Request = snapshotRequest, IsLive = false },
            new { DataSource = "tipper_cycle_count", Request = snapshotRequest, IsLive = false },
            new { DataSource = "average_trip_duration", Request = snapshotRequest, IsLive = false },
            new { DataSource = "trip_distance", Request = snapshotRequest, IsLive = false }
        };

        foreach (var source in sources)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var data = source.IsLive
                ? await _dataSourceManager.GetLiveDataAsync(source.DataSource, source.Request)
                : await _dataSourceManager.GetInitialDataAsync(source.DataSource, source.Request);

            await _dataSourceManager.BroadcastDataUpdateAsync(source.DataSource, data);
        }
    }

    private static string? ResolveSiteName(IReadOnlyDictionary<int, string> siteLookup, int? siteId)
    {
        if (!siteId.HasValue)
        {
            return null;
        }

        return siteLookup.TryGetValue(siteId.Value, out var siteName) ? siteName : null;
    }

    private static string BuildVehicleLabel(VehicleEntity vehicle)
    {
        if (!string.IsNullOrWhiteSpace(vehicle.HyoungNo) && !string.IsNullOrWhiteSpace(vehicle.NumberPlate))
        {
            return $"{vehicle.HyoungNo} ({vehicle.NumberPlate})";
        }

        if (!string.IsNullOrWhiteSpace(vehicle.HyoungNo))
        {
            return vehicle.HyoungNo;
        }

        if (!string.IsNullOrWhiteSpace(vehicle.NumberPlate))
        {
            return vehicle.NumberPlate;
        }

        return $"Vehicle {vehicle.VehicleId}";
    }
}