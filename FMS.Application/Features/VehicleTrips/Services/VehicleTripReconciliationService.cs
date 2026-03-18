/**
 * File: VehicleTripReconciliationService.cs
 * Purpose: Replays full-day GPS data, compares batch output to persisted trips, applies reconciliation categories, and replaces persisted records with reconciled records.
 * Dependencies: DbContext, trip detection services, grouping service, fuel enrichment, FMSResponse.
 * Last Modified: 2026-03-11
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTrips.DTOs;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VehicleEntity = FMS.Domain.Entities.Vehicle;

namespace FMS.Application.Features.VehicleTrips.Services;

public class VehicleTripReconciliationService : IVehicleTripReconciliationService
{
    private const int MatchingWindowMinutes = 120;
    private const int ConfirmationTimeToleranceMinutes = 15;
    private const decimal ConfirmationDistanceToleranceKm = 1.00m;
    private const decimal ConfirmationDurationToleranceMinutes = 15.00m;
    private const decimal UnrealisticSpeedThresholdKph = 120.00m;
    private const decimal AsymmetricCycleRatioThreshold = 2.50m;

    private readonly GpsdataContext _context;
    private readonly IVehicleTripGeofenceDetectionService _geofenceDetectionService;
    private readonly IVehicleTripClusterDetectionService _clusterDetectionService;
    private readonly IVehicleTripGroupingService _groupingService;
    private readonly IVehicleTripConfidenceScoringService _confidenceScoringService;
    private readonly IVehicleTripFuelContextService _fuelContextService;
    private readonly ILogger<VehicleTripReconciliationService> _logger;

    public VehicleTripReconciliationService(
        GpsdataContext context,
        IVehicleTripGeofenceDetectionService geofenceDetectionService,
        IVehicleTripClusterDetectionService clusterDetectionService,
        IVehicleTripGroupingService groupingService,
        IVehicleTripConfidenceScoringService confidenceScoringService,
        IVehicleTripFuelContextService fuelContextService,
        ILogger<VehicleTripReconciliationService> logger)
    {
        _context = context;
        _geofenceDetectionService = geofenceDetectionService;
        _clusterDetectionService = clusterDetectionService;
        _groupingService = groupingService;
        _confidenceScoringService = confidenceScoringService;
        _fuelContextService = fuelContextService;
        _logger = logger;
    }

    public async Task<FMSResponse<VehicleTripReconciliationResultDTO>> ReconcileVehicleTripsAsync(
        int vehicleId,
        DateTime? fromUtc,
        DateTime? toUtc,
        bool previewOnly,
        CancellationToken cancellationToken = default)
    {
        var effectiveFromUtc = fromUtc?.ToUniversalTime() ?? DateTime.UtcNow.AddDays(-1);
        var effectiveToUtc = toUtc?.ToUniversalTime() ?? DateTime.UtcNow;

        if (vehicleId <= 0)
        {
            return FMSResponse<VehicleTripReconciliationResultDTO>.ValidationFailed(new List<string> { "VehicleId is required." });
        }

        if (effectiveFromUtc >= effectiveToUtc)
        {
            return FMSResponse<VehicleTripReconciliationResultDTO>.ValidationFailed(new List<string> { "FromUtc must be earlier than ToUtc." });
        }

        var vehicle = await _context.Vehicles
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.VehicleId == vehicleId, cancellationToken);

        if (vehicle == null)
        {
            return FMSResponse<VehicleTripReconciliationResultDTO>.NotFound("VEHICLE_NOT_FOUND", $"Vehicle {vehicleId} was not found.");
        }

        if (!await HasGpsDeviceConfiguredAsync(vehicleId, cancellationToken))
        {
            return FMSResponse<VehicleTripReconciliationResultDTO>.ValidationFailed(
                new List<string> { "Vehicle doesn't have an active GPS provider mapping or legacy device ID configured." },
                "VEHICLE_GPS_DEVICE_NOT_CONFIGURED");
        }

        try
        {
            var persistedGroups = await _context.VehicleTripGroups
                .Include(g => g.Trips)
                .Where(g => g.VehicleId == vehicleId && g.StartTimeUtc <= effectiveToUtc && g.EndTimeUtc >= effectiveFromUtc)
                .OrderBy(g => g.StartTimeUtc)
                .ToListAsync(cancellationToken);

            var detectedTrips = new List<VehicleTripDetectionResultDTO>();
            foreach (var processingWindow in BuildProcessingWindows(effectiveFromUtc, effectiveToUtc))
            {
                var dayTrips = await DetectTripsAsync(vehicle, processingWindow.FromUtc, processingWindow.ToUtc, cancellationToken);
                detectedTrips.AddRange(dayTrips);
            }

            await _fuelContextService.EnrichTripsAsync(vehicleId, detectedTrips, cancellationToken);
            await _confidenceScoringService.ScoreTripsAsync(detectedTrips, cancellationToken);

            var groupedTrips = _groupingService.GroupTrips(vehicle, detectedTrips)
                .OrderBy(group => group.StartTimeUtc)
                .ToList();

            await _confidenceScoringService.ScoreGroupsAsync(groupedTrips, cancellationToken);
            FinalizeRecomputedGroups(vehicle, groupedTrips);

            var persistedGroupCount = persistedGroups.Count;
            var recomputedGroupCount = groupedTrips.Count;
            var persistedTripCount = persistedGroups.Sum(g => g.Trips.Count);
            var recomputedTripCount = groupedTrips.Sum(g => g.Trips.Count);

            var (groupResults, anomalyReports, reconciledGroups) = BuildReconciliationArtifacts(persistedGroups, groupedTrips);

            var confirmedGroups = groupResults.Count(result => result.ReconciliationStatus == VehicleTripReconciliationStatus.Confirmed);
            var splitGroups = groupResults.Count(result => result.ReconciliationStatus == VehicleTripReconciliationStatus.Split);
            var mergedGroups = groupResults.Count(result => result.ReconciliationStatus == VehicleTripReconciliationStatus.Merged);
            var adjustedGroups = groupResults.Count(result => result.ReconciliationStatus == VehicleTripReconciliationStatus.Adjusted);
            var anomalyGroups = groupResults.Count(result => result.ReconciliationStatus == VehicleTripReconciliationStatus.Anomaly);

            var groupsUpdated = 0;
            var tripsUpdated = 0;

            if (!previewOnly)
            {
                (groupsUpdated, tripsUpdated) = await ReplacePersistedTripsAsync(
                    vehicle,
                    effectiveFromUtc,
                    effectiveToUtc,
                    persistedGroups,
                    reconciledGroups,
                    cancellationToken);
            }

            var overallStatus = anomalyGroups > 0
                ? VehicleTripReconciliationStatus.Anomaly
                : splitGroups > 0
                    ? VehicleTripReconciliationStatus.Split
                    : mergedGroups > 0
                        ? VehicleTripReconciliationStatus.Merged
                        : adjustedGroups > 0
                            ? VehicleTripReconciliationStatus.Adjusted
                            : VehicleTripReconciliationStatus.Confirmed;

            var result = new VehicleTripReconciliationResultDTO
            {
                VehicleId = vehicleId,
                FromUtc = effectiveFromUtc,
                ToUtc = effectiveToUtc,
                PreviewOnly = previewOnly,
                PersistedGroupsReviewed = persistedGroupCount,
                PersistedTripsReviewed = persistedTripCount,
                RecomputedGroupsDetected = recomputedGroupCount,
                RecomputedTripsDetected = recomputedTripCount,
                ConfirmedGroups = confirmedGroups,
                SplitGroups = splitGroups,
                MergedGroups = mergedGroups,
                AdjustedGroups = adjustedGroups,
                AnomalyGroups = anomalyGroups,
                GroupsUpdated = groupsUpdated,
                TripsUpdated = tripsUpdated,
                OverallStatus = overallStatus,
                Notes = previewOnly
                    ? "Reconciliation preview generated successfully. No persistence updates were written."
                    : "Reconciliation execution completed. Persisted trip records were replaced with reconciled records and original records were preserved in reconciliation audit logs.",
                GroupResults = groupResults,
                AnomalyReports = anomalyReports,
            };

            return FMSResponse<VehicleTripReconciliationResultDTO>.Success(
                result,
                previewOnly
                    ? "Vehicle trip reconciliation preview completed successfully."
                    : "Vehicle trip reconciliation executed successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reconciling trips for vehicle {VehicleId}", vehicleId);
            return FMSResponse<VehicleTripReconciliationResultDTO>.SystemError($"Failed to reconcile trips: {ex.Message}");
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
            _ => new List<VehicleTripDetectionResultDTO>(),
        };
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

    private static (List<VehicleTripReconciliationGroupResultDTO> GroupResults,
        List<VehicleTripAnomalyReportDTO> AnomalyReports,
        List<VehicleTripGroupedDetectionDTO> ReconciledGroups) BuildReconciliationArtifacts(
        IReadOnlyCollection<VehicleTripGroup> persistedGroups,
        IReadOnlyCollection<VehicleTripGroupedDetectionDTO> recomputedGroups)
    {
        var results = new List<VehicleTripReconciliationGroupResultDTO>();
        var reconciledGroups = new List<VehicleTripGroupedDetectionDTO>();
        var components = BuildComparisonComponents(persistedGroups, recomputedGroups);

        foreach (var component in components)
        {
            var aggregatedAnomalyFlags = AggregatePersistedAnomalyFlags(component.PersistedGroups)
                | AggregateRecomputedAnomalyFlags(component.RecomputedGroups);
            var reconciliationStatus = ResolveComponentStatus(component.PersistedGroups, component.RecomputedGroups, aggregatedAnomalyFlags);
            var notes = BuildComponentNotes(component.PersistedGroups, component.RecomputedGroups, reconciliationStatus, aggregatedAnomalyFlags);

            foreach (var recomputedGroup in component.RecomputedGroups)
            {
                recomputedGroup.ReconciliationStatus = reconciliationStatus;
                recomputedGroup.AnomalyFlags |= aggregatedAnomalyFlags;
                reconciledGroups.Add(recomputedGroup);
            }

            if (component.PersistedGroups.Count == 0)
            {
                foreach (var recomputedGroup in component.RecomputedGroups.OrderBy(group => group.StartTimeUtc))
                {
                    results.Add(new VehicleTripReconciliationGroupResultDTO
                    {
                        VehicleTripGroupId = 0,
                        PersistedStartTimeUtc = recomputedGroup.StartTimeUtc,
                        PersistedEndTimeUtc = recomputedGroup.EndTimeUtc,
                        PersistedTripCount = 0,
                        RecomputedTripCount = recomputedGroup.Trips.Count,
                        PersistedStatus = VehicleTripStatus.Completed,
                        RecomputedStatus = recomputedGroup.Trips.Any(trip => trip.Status == VehicleTripStatus.InProgress)
                            ? VehicleTripStatus.InProgress
                            : VehicleTripStatus.Completed,
                        PersistedConfidenceScore = 0m,
                        RecomputedConfidenceScore = recomputedGroup.ConfidenceScore,
                        PersistedConfidenceBand = string.Empty,
                        RecomputedConfidenceBand = recomputedGroup.ConfidenceBand,
                        PersistedTotalFuelConsumed = null,
                        RecomputedTotalFuelConsumed = CalculateTotalFuelConsumed(recomputedGroup.Trips),
                        AnomalyFlags = recomputedGroup.AnomalyFlags,
                        ReconciliationStatus = reconciliationStatus,
                        Notes = notes,
                    });
                }

                continue;
            }

            var recomputedTripCount = component.RecomputedGroups.Sum(group => group.Trips.Count);
            var recomputedStatus = component.RecomputedGroups.Count == 0
                ? (VehicleTripStatus?)null
                : component.RecomputedGroups.Any(group => group.Trips.Any(trip => trip.Status == VehicleTripStatus.InProgress))
                    ? VehicleTripStatus.InProgress
                    : VehicleTripStatus.Completed;
            var recomputedConfidenceScore = component.RecomputedGroups.Count == 0
                ? (decimal?)null
                : component.RecomputedGroups.Average(group => group.ConfidenceScore);
            var recomputedFuelConsumed = component.RecomputedGroups.Count == 0
                ? (decimal?)null
                : component.RecomputedGroups.SelectMany(group => group.Trips).Any(trip => trip.FuelConsumed.HasValue)
                    ? component.RecomputedGroups.SelectMany(group => group.Trips).Sum(trip => trip.FuelConsumed ?? 0m)
                    : (decimal?)null;
            var recomputedConfidenceBand = recomputedConfidenceScore.HasValue
                ? ResolveConfidenceBand(recomputedConfidenceScore.Value)
                : null;

            foreach (var persistedGroup in component.PersistedGroups.OrderBy(group => group.StartTimeUtc))
            {
                results.Add(new VehicleTripReconciliationGroupResultDTO
                {
                    VehicleTripGroupId = persistedGroup.VehicleTripGroupId,
                    PersistedStartTimeUtc = persistedGroup.StartTimeUtc,
                    PersistedEndTimeUtc = persistedGroup.EndTimeUtc,
                    PersistedTripCount = persistedGroup.TripCount,
                    RecomputedTripCount = recomputedTripCount,
                    PersistedStatus = Enum.IsDefined(typeof(VehicleTripStatus), persistedGroup.Status)
                        ? (VehicleTripStatus)persistedGroup.Status
                        : VehicleTripStatus.Completed,
                    RecomputedStatus = recomputedStatus,
                    PersistedConfidenceScore = persistedGroup.ConfidenceScore,
                    RecomputedConfidenceScore = recomputedConfidenceScore,
                    PersistedConfidenceBand = persistedGroup.ConfidenceBand,
                    RecomputedConfidenceBand = recomputedConfidenceBand,
                    PersistedTotalFuelConsumed = persistedGroup.TotalFuelConsumed,
                    RecomputedTotalFuelConsumed = recomputedFuelConsumed,
                    AnomalyFlags = aggregatedAnomalyFlags,
                    ReconciliationStatus = reconciliationStatus,
                    Notes = notes,
                });
            }
        }

        var anomalyReports = BuildAnomalyReports(results);
        return (results, anomalyReports, reconciledGroups.OrderBy(group => group.StartTimeUtc).ToList());
    }

    private static List<VehicleTripAnomalyReportDTO> BuildAnomalyReports(IEnumerable<VehicleTripReconciliationGroupResultDTO> groupResults)
    {
        return groupResults
            .Where(groupResult => groupResult.ReconciliationStatus == VehicleTripReconciliationStatus.Anomaly
                || groupResult.AnomalyFlags != VehicleTripAnomalyType.None)
            .Select(groupResult => new VehicleTripAnomalyReportDTO
            {
                VehicleTripGroupId = groupResult.VehicleTripGroupId,
                PersistedStartTimeUtc = groupResult.PersistedStartTimeUtc,
                PersistedEndTimeUtc = groupResult.PersistedEndTimeUtc,
                ReconciliationStatus = groupResult.ReconciliationStatus,
                AnomalyFlags = groupResult.AnomalyFlags,
                PersistedConfidenceScore = groupResult.PersistedConfidenceScore,
                RecomputedConfidenceScore = groupResult.RecomputedConfidenceScore,
                Summary = groupResult.Notes,
            })
            .ToList();
    }

    private static List<(List<VehicleTripGroup> PersistedGroups, List<VehicleTripGroupedDetectionDTO> RecomputedGroups)> BuildComparisonComponents(
        IReadOnlyCollection<VehicleTripGroup> persistedGroups,
        IReadOnlyCollection<VehicleTripGroupedDetectionDTO> recomputedGroups)
    {
        var persistedList = persistedGroups.OrderBy(group => group.StartTimeUtc).ToList();
        var recomputedList = recomputedGroups.OrderBy(group => group.StartTimeUtc).ToList();
        var visitedPersisted = new bool[persistedList.Count];
        var visitedRecomputed = new bool[recomputedList.Count];
        var components = new List<(List<VehicleTripGroup> PersistedGroups, List<VehicleTripGroupedDetectionDTO> RecomputedGroups)>();

        while (true)
        {
            var persistedSeed = Array.FindIndex(visitedPersisted, visited => !visited);
            var recomputedSeed = Array.FindIndex(visitedRecomputed, visited => !visited);
            if (persistedSeed < 0 && recomputedSeed < 0)
            {
                break;
            }

            var componentPersisted = new List<VehicleTripGroup>();
            var componentRecomputed = new List<VehicleTripGroupedDetectionDTO>();
            var persistedQueue = new Queue<int>();
            var recomputedQueue = new Queue<int>();

            if (persistedSeed >= 0)
            {
                visitedPersisted[persistedSeed] = true;
                persistedQueue.Enqueue(persistedSeed);
            }
            else if (recomputedSeed >= 0)
            {
                visitedRecomputed[recomputedSeed] = true;
                recomputedQueue.Enqueue(recomputedSeed);
            }

            while (persistedQueue.Count > 0 || recomputedQueue.Count > 0)
            {
                while (persistedQueue.Count > 0)
                {
                    var persistedIndex = persistedQueue.Dequeue();
                    var persistedGroup = persistedList[persistedIndex];
                    componentPersisted.Add(persistedGroup);

                    for (var recomputedIndex = 0; recomputedIndex < recomputedList.Count; recomputedIndex++)
                    {
                        if (visitedRecomputed[recomputedIndex])
                        {
                            continue;
                        }

                        if (!AreGroupsRelated(persistedGroup, recomputedList[recomputedIndex]))
                        {
                            continue;
                        }

                        visitedRecomputed[recomputedIndex] = true;
                        recomputedQueue.Enqueue(recomputedIndex);
                    }
                }

                while (recomputedQueue.Count > 0)
                {
                    var recomputedIndex = recomputedQueue.Dequeue();
                    var recomputedGroup = recomputedList[recomputedIndex];
                    componentRecomputed.Add(recomputedGroup);

                    for (var persistedIndex = 0; persistedIndex < persistedList.Count; persistedIndex++)
                    {
                        if (visitedPersisted[persistedIndex])
                        {
                            continue;
                        }

                        if (!AreGroupsRelated(persistedList[persistedIndex], recomputedGroup))
                        {
                            continue;
                        }

                        visitedPersisted[persistedIndex] = true;
                        persistedQueue.Enqueue(persistedIndex);
                    }
                }
            }

            components.Add((componentPersisted, componentRecomputed));
        }

        return components;
    }

    private static bool AreGroupsRelated(VehicleTripGroup persistedGroup, VehicleTripGroupedDetectionDTO recomputedGroup)
    {
        var startDifferenceMinutes = Math.Abs((persistedGroup.StartTimeUtc - recomputedGroup.StartTimeUtc).TotalMinutes);
        var endDifferenceMinutes = Math.Abs((persistedGroup.EndTimeUtc - recomputedGroup.EndTimeUtc).TotalMinutes);
        var overlapsInTime = persistedGroup.StartTimeUtc <= recomputedGroup.EndTimeUtc
            && recomputedGroup.StartTimeUtc <= persistedGroup.EndTimeUtc;

        var routeAffinity = (persistedGroup.OriginSiteId.HasValue && persistedGroup.OriginSiteId == recomputedGroup.OriginSiteId)
            || (persistedGroup.DestinationSiteId.HasValue && persistedGroup.DestinationSiteId == recomputedGroup.DestinationSiteId)
            || (persistedGroup.OriginSiteId == recomputedGroup.OriginSiteId && persistedGroup.DestinationSiteId == recomputedGroup.DestinationSiteId)
            || (persistedGroup.OriginSiteId == recomputedGroup.DestinationSiteId && persistedGroup.DestinationSiteId == recomputedGroup.OriginSiteId)
            || (!persistedGroup.OriginSiteId.HasValue && !recomputedGroup.OriginSiteId.HasValue)
            || (!persistedGroup.DestinationSiteId.HasValue && !recomputedGroup.DestinationSiteId.HasValue);

        return routeAffinity && (overlapsInTime || startDifferenceMinutes <= MatchingWindowMinutes || endDifferenceMinutes <= MatchingWindowMinutes);
    }

    private static VehicleTripReconciliationStatus ResolveComponentStatus(
        IReadOnlyCollection<VehicleTripGroup> persistedGroups,
        IReadOnlyCollection<VehicleTripGroupedDetectionDTO> recomputedGroups,
        VehicleTripAnomalyType anomalyFlags)
    {
        if (anomalyFlags != VehicleTripAnomalyType.None)
        {
            return VehicleTripReconciliationStatus.Anomaly;
        }

        if (persistedGroups.Count == 1 && recomputedGroups.Count == 1)
        {
            var persistedGroup = persistedGroups.First();
            var recomputedGroup = recomputedGroups.First();
            return IsConfirmedMatch(persistedGroup, recomputedGroup)
                ? VehicleTripReconciliationStatus.Confirmed
                : VehicleTripReconciliationStatus.Adjusted;
        }

        if (persistedGroups.Count == 1 && recomputedGroups.Count > 1)
        {
            return VehicleTripReconciliationStatus.Split;
        }

        if (persistedGroups.Count > 1 && recomputedGroups.Count == 1)
        {
            return VehicleTripReconciliationStatus.Merged;
        }

        if (persistedGroups.Count > 0 && recomputedGroups.Count == 0)
        {
            return VehicleTripReconciliationStatus.Merged;
        }

        if (persistedGroups.Count == 0 && recomputedGroups.Count > 0)
        {
            return VehicleTripReconciliationStatus.Adjusted;
        }

        if (persistedGroups.Count == recomputedGroups.Count)
        {
            return VehicleTripReconciliationStatus.Adjusted;
        }

        return recomputedGroups.Count > persistedGroups.Count
            ? VehicleTripReconciliationStatus.Split
            : VehicleTripReconciliationStatus.Merged;
    }

    private static bool IsConfirmedMatch(VehicleTripGroup persistedGroup, VehicleTripGroupedDetectionDTO recomputedGroup)
    {
        var startDifferenceMinutes = Math.Abs((persistedGroup.StartTimeUtc - recomputedGroup.StartTimeUtc).TotalMinutes);
        var endDifferenceMinutes = Math.Abs((persistedGroup.EndTimeUtc - recomputedGroup.EndTimeUtc).TotalMinutes);
        var distanceDifferenceKm = Math.Abs(persistedGroup.TotalDistanceKm - recomputedGroup.TotalDistanceKm);
        var durationDifferenceMinutes = Math.Abs(persistedGroup.TotalDurationMinutes - recomputedGroup.TotalDurationMinutes);

        return persistedGroup.TripCount == recomputedGroup.Trips.Count
            && persistedGroup.OriginSiteId == recomputedGroup.OriginSiteId
            && persistedGroup.DestinationSiteId == recomputedGroup.DestinationSiteId
            && startDifferenceMinutes <= ConfirmationTimeToleranceMinutes
            && endDifferenceMinutes <= ConfirmationTimeToleranceMinutes
            && distanceDifferenceKm <= ConfirmationDistanceToleranceKm
            && durationDifferenceMinutes <= ConfirmationDurationToleranceMinutes;
    }

    private static VehicleTripAnomalyType AggregatePersistedAnomalyFlags(IEnumerable<VehicleTripGroup> persistedGroups)
    {
        return persistedGroups.Aggregate(VehicleTripAnomalyType.None, (current, group) => current | (VehicleTripAnomalyType)group.AnomalyFlags);
    }

    private static VehicleTripAnomalyType AggregateRecomputedAnomalyFlags(IEnumerable<VehicleTripGroupedDetectionDTO> recomputedGroups)
    {
        return recomputedGroups.Aggregate(VehicleTripAnomalyType.None, (current, group) => current | group.AnomalyFlags);
    }

    private static decimal? CalculateTotalFuelConsumed(IEnumerable<VehicleTripDetectionResultDTO> trips)
    {
        var tripList = trips.ToList();
        return tripList.Any(trip => trip.FuelConsumed.HasValue)
            ? tripList.Sum(trip => trip.FuelConsumed ?? 0m)
            : null;
    }

    private static string ResolveConfidenceBand(decimal score)
    {
        return score >= 0.85m ? "High" : score >= 0.60m ? "Medium" : "Low";
    }

    private static string BuildComponentNotes(
        IReadOnlyCollection<VehicleTripGroup> persistedGroups,
        IReadOnlyCollection<VehicleTripGroupedDetectionDTO> recomputedGroups,
        VehicleTripReconciliationStatus reconciliationStatus,
        VehicleTripAnomalyType anomalyFlags)
    {
        var note = reconciliationStatus switch
        {
            VehicleTripReconciliationStatus.Confirmed => "Persisted and batch-replayed groups matched within configured tolerances.",
            VehicleTripReconciliationStatus.Split => $"One persisted group matched {recomputedGroups.Count} recomputed groups during batch replay.",
            VehicleTripReconciliationStatus.Merged => $"{persistedGroups.Count} persisted groups collapsed into {recomputedGroups.Count} recomputed group during batch replay.",
            VehicleTripReconciliationStatus.Adjusted => "Persisted and batch-replayed groups aligned loosely but required timing, route, or metric adjustments.",
            VehicleTripReconciliationStatus.Anomaly => $"Batch replay detected anomaly flags: {anomalyFlags}.",
            _ => "Reconciliation completed.",
        };

        if (persistedGroups.Count == 0 && recomputedGroups.Count > 0)
        {
            note = "Batch replay produced reconciled groups where no persisted real-time group existed.";
        }

        return note;
    }

    private void FinalizeRecomputedGroups(VehicleEntity vehicle, List<VehicleTripGroupedDetectionDTO> groupedTrips)
    {
        foreach (var groupedTrip in groupedTrips)
        {
            var orderedTrips = groupedTrip.Trips.OrderBy(trip => trip.StartTimeUtc).ToList();
            if (orderedTrips.Count == 0)
            {
                continue;
            }

            groupedTrip.TripDate = orderedTrips.First().StartTimeUtc.Date;
            groupedTrip.StartTimeUtc = orderedTrips.First().StartTimeUtc;
            groupedTrip.EndTimeUtc = orderedTrips.Last().EndTimeUtc;
            groupedTrip.TotalDistanceKm = orderedTrips.Sum(trip => trip.DistanceKm);
            groupedTrip.TotalDurationMinutes = orderedTrips.Sum(trip => trip.DurationMinutes);

            var anomalyFlags = orderedTrips.Aggregate(groupedTrip.AnomalyFlags, (current, trip) => current | trip.AnomalyFlags);

            if (!orderedTrips.Any(trip => trip.FuelAtDeparture.HasValue || trip.FuelAtArrival.HasValue || trip.FuelConsumed.HasValue))
            {
                anomalyFlags |= VehicleTripAnomalyType.MissingFuelData;
            }

            if (orderedTrips.Any(trip => trip.FuelConsumed.HasValue && trip.FuelConsumed.Value < 0m))
            {
                anomalyFlags |= VehicleTripAnomalyType.NegativeFuelConsumption;
            }

            if (orderedTrips.Any(trip => trip.MaxSpeedKph.HasValue && trip.MaxSpeedKph.Value > UnrealisticSpeedThresholdKph))
            {
                anomalyFlags |= VehicleTripAnomalyType.UnrealisticSpeed;
            }

            if (groupedTrip.GroupingType == VehicleTripGroupingType.LoadCycle || groupedTrip.GroupingType == VehicleTripGroupingType.RoundTrip)
            {
                if (orderedTrips.Count < 2)
                {
                    anomalyFlags |= VehicleTripAnomalyType.NoReturnToOrigin;
                }
                else
                {
                    var firstTrip = orderedTrips.First();
                    var lastTrip = orderedTrips.Last();
                    if (firstTrip.OriginSiteId != lastTrip.DestinationSiteId)
                    {
                        anomalyFlags |= VehicleTripAnomalyType.NoReturnToOrigin;
                    }

                    var minDistance = orderedTrips.Min(trip => trip.DistanceKm);
                    var maxDistance = orderedTrips.Max(trip => trip.DistanceKm);
                    var minDuration = orderedTrips.Min(trip => trip.DurationMinutes);
                    var maxDuration = orderedTrips.Max(trip => trip.DurationMinutes);

                    var distanceRatio = minDistance <= 0m ? decimal.MaxValue : maxDistance / minDistance;
                    var durationRatio = minDuration <= 0m ? decimal.MaxValue : maxDuration / minDuration;

                    if (distanceRatio > AsymmetricCycleRatioThreshold || durationRatio > AsymmetricCycleRatioThreshold)
                    {
                        anomalyFlags |= VehicleTripAnomalyType.AsymmetricCycle;
                    }
                }
            }
            else if (vehicle.MovementProfile == VehicleMovementProfile.Cluster)
            {
                anomalyFlags |= VehicleTripAnomalyType.UnmatchedReturn;
            }

            foreach (var trip in orderedTrips)
            {
                if (!trip.FuelAtDeparture.HasValue && !trip.FuelAtArrival.HasValue && !trip.FuelConsumed.HasValue)
                {
                    trip.AnomalyFlags |= VehicleTripAnomalyType.MissingFuelData;
                }

                if (trip.FuelConsumed.HasValue && trip.FuelConsumed.Value < 0m)
                {
                    trip.AnomalyFlags |= VehicleTripAnomalyType.NegativeFuelConsumption;
                }

                if (trip.MaxSpeedKph.HasValue && trip.MaxSpeedKph.Value > UnrealisticSpeedThresholdKph)
                {
                    trip.AnomalyFlags |= VehicleTripAnomalyType.UnrealisticSpeed;
                }
            }

            groupedTrip.AnomalyFlags = anomalyFlags;
            groupedTrip.ReconciliationStatus = anomalyFlags == VehicleTripAnomalyType.None
                ? VehicleTripReconciliationStatus.Pending
                : VehicleTripReconciliationStatus.Anomaly;
        }
    }

    private async Task<(int GroupsUpdated, int TripsUpdated)> ReplacePersistedTripsAsync(
        VehicleEntity vehicle,
        DateTime fromUtc,
        DateTime toUtc,
        IReadOnlyCollection<VehicleTripGroup> persistedGroups,
        IReadOnlyCollection<VehicleTripGroupedDetectionDTO> reconciledGroups,
        CancellationToken cancellationToken)
    {
        var executionStrategy = _context.Database.CreateExecutionStrategy();
        return await executionStrategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

            LogAuditSnapshot(vehicle.VehicleId, fromUtc, toUtc, persistedGroups);

            var persistedTrips = persistedGroups.SelectMany(group => group.Trips).ToList();
            if (persistedTrips.Count > 0)
            {
                _context.VehicleTrips.RemoveRange(persistedTrips);
            }

            if (persistedGroups.Count > 0)
            {
                _context.VehicleTripGroups.RemoveRange(persistedGroups);
            }

            await _context.SaveChangesAsync(cancellationToken);

            var groupsUpdated = 0;
            var tripsUpdated = 0;

            foreach (var reconciledGroup in reconciledGroups.OrderBy(group => group.StartTimeUtc))
            {
                var orderedTrips = reconciledGroup.Trips.OrderBy(trip => trip.StartTimeUtc).ToList();
                var totalFuelConsumed = CalculateTotalFuelConsumed(orderedTrips);
                var persistedGroup = new VehicleTripGroup
                {
                    VehicleId = vehicle.VehicleId,
                    TripDate = reconciledGroup.TripDate,
                    StartTimeUtc = reconciledGroup.StartTimeUtc,
                    EndTimeUtc = reconciledGroup.EndTimeUtc,
                    OriginSiteId = reconciledGroup.OriginSiteId,
                    DestinationSiteId = reconciledGroup.DestinationSiteId,
                    TripCount = orderedTrips.Count,
                    TotalDistanceKm = reconciledGroup.TotalDistanceKm,
                    TotalDurationMinutes = reconciledGroup.TotalDurationMinutes,
                    Status = orderedTrips.Any(trip => trip.Status == VehicleTripStatus.InProgress)
                        ? (int)VehicleTripStatus.InProgress
                        : (int)VehicleTripStatus.Completed,
                    MovementProfile = reconciledGroup.MovementProfile,
                    DetectionMode = reconciledGroup.DetectionMode,
                    TotalFuelConsumed = totalFuelConsumed,
                    GroupingType = (int)reconciledGroup.GroupingType,
                    ConfidenceScore = reconciledGroup.ConfidenceScore,
                    ConfidenceBand = reconciledGroup.ConfidenceBand,
                    AnomalyFlags = (int)reconciledGroup.AnomalyFlags,
                    ReconciliationStatus = (int)reconciledGroup.ReconciliationStatus,
                    ProjectPlanId = reconciledGroup.ProjectPlanId ?? orderedTrips.Select(t => t.ProjectPlanId).FirstOrDefault(id => id.HasValue),
                    WorkShiftId = reconciledGroup.WorkShiftId ?? orderedTrips.Select(t => t.WorkShiftId).FirstOrDefault(id => id.HasValue),
                    PlannedHaulRouteId = reconciledGroup.PlannedHaulRouteId ?? orderedTrips.Select(t => t.PlannedHaulRouteId).FirstOrDefault(id => id.HasValue),
                    PlannedOriginZoneId = reconciledGroup.PlannedOriginZoneId ?? orderedTrips.FirstOrDefault()?.PlannedOriginZoneId,
                    PlannedDestinationZoneId = reconciledGroup.PlannedDestinationZoneId ?? orderedTrips.LastOrDefault()?.PlannedDestinationZoneId,
                    PlanningMatchStatus = reconciledGroup.PlanningMatchStatus,
                    IsOutOfBounds = reconciledGroup.IsOutOfBounds,
                    IsProductiveMovement = reconciledGroup.IsProductiveMovement,
                    CreatedAtUtc = DateTime.UtcNow,
                    UpdatedAtUtc = DateTime.UtcNow,
                };

                var sequenceNo = 1;
                foreach (var reconciledTrip in orderedTrips)
                {
                    persistedGroup.Trips.Add(new VehicleTrip
                    {
                        VehicleId = vehicle.VehicleId,
                        SequenceNo = sequenceNo++,
                        StartTimeUtc = reconciledTrip.StartTimeUtc,
                        EndTimeUtc = reconciledTrip.EndTimeUtc,
                        OriginSiteId = reconciledTrip.OriginSiteId,
                        DestinationSiteId = reconciledTrip.DestinationSiteId,
                        OriginGeofenceId = reconciledTrip.OriginGeofenceId,
                        DestinationGeofenceId = reconciledTrip.DestinationGeofenceId,
                        StartLatitude = reconciledTrip.StartLatitude,
                        StartLongitude = reconciledTrip.StartLongitude,
                        EndLatitude = reconciledTrip.EndLatitude,
                        EndLongitude = reconciledTrip.EndLongitude,
                        DistanceKm = reconciledTrip.DistanceKm,
                        DurationMinutes = reconciledTrip.DurationMinutes,
                        MaxSpeedKph = reconciledTrip.MaxSpeedKph,
                        Status = (int)reconciledTrip.Status,
                        MovementProfile = reconciledTrip.MovementProfile,
                        DetectionMode = reconciledTrip.DetectionMode,
                        StartTrackInfoId = reconciledTrip.StartTrackInfoId,
                        EndTrackInfoId = reconciledTrip.EndTrackInfoId,
                        FuelAtDeparture = reconciledTrip.FuelAtDeparture,
                        FuelAtArrival = reconciledTrip.FuelAtArrival,
                        FuelConsumed = reconciledTrip.FuelConsumed,
                        ConfidenceScore = reconciledTrip.ConfidenceScore,
                        ConfidenceBand = reconciledTrip.ConfidenceBand,
                        AnomalyFlags = (int)reconciledTrip.AnomalyFlags,
                        ReconciliationStatus = (int)reconciledGroup.ReconciliationStatus,
                        IsLowConfidence = reconciledTrip.IsLowConfidence,
                        ProjectPlanId = reconciledTrip.ProjectPlanId,
                        WorkShiftId = reconciledTrip.WorkShiftId,
                        PlannedHaulRouteId = reconciledTrip.PlannedHaulRouteId,
                        PlannedOriginZoneId = reconciledTrip.PlannedOriginZoneId,
                        PlannedDestinationZoneId = reconciledTrip.PlannedDestinationZoneId,
                        PlanningMatchStatus = reconciledTrip.PlanningMatchStatus,
                        IsOutOfBounds = reconciledTrip.IsOutOfBounds,
                        IsProductiveMovement = reconciledTrip.IsProductiveMovement,
                        CreatedAtUtc = DateTime.UtcNow,
                    });
                }

                _context.VehicleTripGroups.Add(persistedGroup);
                groupsUpdated++;
                tripsUpdated += orderedTrips.Count;
            }

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return (groupsUpdated, tripsUpdated);
        });
    }

    private void LogAuditSnapshot(
        int vehicleId,
        DateTime fromUtc,
        DateTime toUtc,
        IReadOnlyCollection<VehicleTripGroup> persistedGroups)
    {
        if (persistedGroups.Count == 0)
        {
            _logger.LogInformation(
                "Vehicle trip reconciliation found no persisted groups to snapshot for vehicle {VehicleId} between {FromUtc} and {ToUtc}.",
                vehicleId,
                fromUtc,
                toUtc);
            return;
        }

        var snapshot = persistedGroups
            .OrderBy(group => group.StartTimeUtc)
            .Select(group => new
            {
                group.VehicleTripGroupId,
                group.VehicleId,
                group.StartTimeUtc,
                group.EndTimeUtc,
                group.OriginSiteId,
                group.DestinationSiteId,
                group.TripCount,
                group.TotalDistanceKm,
                group.TotalDurationMinutes,
                group.TotalFuelConsumed,
                group.ConfidenceScore,
                group.ConfidenceBand,
                group.AnomalyFlags,
                group.ReconciliationStatus,
                Trips = group.Trips
                    .OrderBy(trip => trip.SequenceNo)
                    .Select(trip => new
                    {
                        trip.VehicleTripId,
                        trip.SequenceNo,
                        trip.StartTimeUtc,
                        trip.EndTimeUtc,
                        trip.OriginSiteId,
                        trip.DestinationSiteId,
                        trip.DistanceKm,
                        trip.DurationMinutes,
                        trip.MaxSpeedKph,
                        trip.FuelAtDeparture,
                        trip.FuelAtArrival,
                        trip.FuelConsumed,
                        trip.AnomalyFlags,
                        trip.ReconciliationStatus,
                    })
                    .ToList(),
            })
            .ToList();

        _logger.LogInformation(
            "Vehicle trip reconciliation audit snapshot for vehicle {VehicleId} between {FromUtc} and {ToUtc}: {SnapshotJson}",
            vehicleId,
            fromUtc,
            toUtc,
            JsonSerializer.Serialize(snapshot));
    }
}