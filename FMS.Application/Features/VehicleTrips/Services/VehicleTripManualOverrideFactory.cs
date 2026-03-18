/**
 * File: VehicleTripManualOverrideFactory.cs
 * Purpose: Builds mutable trip models, persisted override entities, detail snapshots, and standard responses.
 * Dependencies: Vehicle trip entities and trip DTOs.
 * Last Modified: 2026-03-11
 */
using System;
using System.Collections.Generic;
using System.Linq;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTrips.Commands;
using FMS.Application.Features.VehicleTrips.DTOs;
using FMS.Domain.Entities;

namespace FMS.Application.Features.VehicleTrips.Services;

public static class VehicleTripManualOverrideFactory
{
    public static VehicleTripMutationState CloneTrip(VehicleTripMutationState trip)
        => new()
        {
            VehicleTripId = trip.VehicleTripId,
            StartTimeUtc = trip.StartTimeUtc,
            EndTimeUtc = trip.EndTimeUtc,
            OriginSiteId = trip.OriginSiteId,
            DestinationSiteId = trip.DestinationSiteId,
            OriginGeofenceId = trip.OriginGeofenceId,
            DestinationGeofenceId = trip.DestinationGeofenceId,
            StartLatitude = trip.StartLatitude,
            StartLongitude = trip.StartLongitude,
            EndLatitude = trip.EndLatitude,
            EndLongitude = trip.EndLongitude,
            DistanceKm = trip.DistanceKm,
            DurationMinutes = trip.DurationMinutes,
            MaxSpeedKph = trip.MaxSpeedKph,
            Status = trip.Status,
            MovementProfile = trip.MovementProfile,
            DetectionMode = trip.DetectionMode,
            StartTrackInfoId = trip.StartTrackInfoId,
            EndTrackInfoId = trip.EndTrackInfoId,
            FuelAtDeparture = trip.FuelAtDeparture,
            FuelAtArrival = trip.FuelAtArrival,
            FuelConsumed = trip.FuelConsumed,
            FuelRateKmPerLiter = trip.FuelRateKmPerLiter,
            HasFuelData = trip.HasFuelData,
            FuelDataQuality = trip.FuelDataQuality,
            ExpectedFuelRateKmPerLiter = trip.ExpectedFuelRateKmPerLiter,
            FuelVarianceKmPerLiter = trip.FuelVarianceKmPerLiter,
            FuelVariancePercent = trip.FuelVariancePercent,
            GroupingType = trip.GroupingType,
            ConfidenceScore = trip.ConfidenceScore,
            ConfidenceBand = trip.ConfidenceBand,
            AnomalyFlags = trip.AnomalyFlags,
            ReconciliationStatus = trip.ReconciliationStatus,
            IsLowConfidence = trip.IsLowConfidence,
            ProjectPlanId = trip.ProjectPlanId,
            WorkShiftId = trip.WorkShiftId,
            PlannedHaulRouteId = trip.PlannedHaulRouteId,
            PlannedOriginZoneId = trip.PlannedOriginZoneId,
            PlannedDestinationZoneId = trip.PlannedDestinationZoneId,
            PlanningMatchStatus = trip.PlanningMatchStatus,
            IsOutOfBounds = trip.IsOutOfBounds,
            IsProductiveMovement = trip.IsProductiveMovement,
        };

    public static List<VehicleTripMutationState> BuildMutableTrips(VehicleTripGroup group)
        => group.Trips
            .OrderBy(t => t.SequenceNo)
            .Select(t => new VehicleTripMutationState
            {
                VehicleTripId = t.VehicleTripId,
                StartTimeUtc = t.StartTimeUtc,
                EndTimeUtc = t.EndTimeUtc,
                OriginSiteId = t.OriginSiteId,
                DestinationSiteId = t.DestinationSiteId,
                OriginGeofenceId = t.OriginGeofenceId,
                DestinationGeofenceId = t.DestinationGeofenceId,
                StartLatitude = t.StartLatitude,
                StartLongitude = t.StartLongitude,
                EndLatitude = t.EndLatitude,
                EndLongitude = t.EndLongitude,
                DistanceKm = t.DistanceKm,
                DurationMinutes = t.DurationMinutes,
                MaxSpeedKph = t.MaxSpeedKph,
                Status = Enum.IsDefined(typeof(VehicleTripStatus), t.Status) ? (VehicleTripStatus)t.Status : VehicleTripStatus.Completed,
                MovementProfile = t.MovementProfile,
                DetectionMode = t.DetectionMode,
                StartTrackInfoId = t.StartTrackInfoId,
                EndTrackInfoId = t.EndTrackInfoId,
                FuelAtDeparture = t.FuelAtDeparture,
                FuelAtArrival = t.FuelAtArrival,
                FuelConsumed = t.FuelConsumed,
                FuelRateKmPerLiter = CalculateFuelRate(t.DistanceKm, t.FuelConsumed),
                HasFuelData = t.FuelConsumed.HasValue,
                FuelDataQuality = ResolveFuelDataQuality((VehicleTripAnomalyType)t.AnomalyFlags, t.FuelConsumed.HasValue),
                GroupingType = ResolveGroupingType(group),
                ConfidenceScore = t.ConfidenceScore,
                ConfidenceBand = t.ConfidenceBand,
                AnomalyFlags = (VehicleTripAnomalyType)t.AnomalyFlags,
                ReconciliationStatus = (VehicleTripReconciliationStatus)t.ReconciliationStatus,
                IsLowConfidence = t.IsLowConfidence,
                ProjectPlanId = t.ProjectPlanId ?? group.ProjectPlanId,
                WorkShiftId = t.WorkShiftId ?? group.WorkShiftId,
                PlannedHaulRouteId = t.PlannedHaulRouteId ?? group.PlannedHaulRouteId,
                PlannedOriginZoneId = t.PlannedOriginZoneId ?? group.PlannedOriginZoneId,
                PlannedDestinationZoneId = t.PlannedDestinationZoneId ?? group.PlannedDestinationZoneId,
                PlanningMatchStatus = t.PlanningMatchStatus ?? group.PlanningMatchStatus,
                IsOutOfBounds = t.IsOutOfBounds ?? group.IsOutOfBounds,
                IsProductiveMovement = t.IsProductiveMovement ?? group.IsProductiveMovement,
            })
            .ToList();

    public static VehicleTripGroup BuildResultGroupEntity(
        int vehicleId,
        VehicleMovementProfile movementProfile,
        VehicleTripGroupingType groupingType,
        List<VehicleTripMutationState> trips,
        VehicleTripManualOverrideAction action,
        VehicleTripReconciliationStatus reconciliationStatus)
    {
        var orderedTrips = trips.OrderBy(t => t.StartTimeUtc).ToList();
        var totalFuelConsumed = orderedTrips.Any(t => t.FuelConsumed.HasValue)
            ? orderedTrips.Sum(t => t.FuelConsumed ?? 0m)
            : (decimal?)null;
        var averageConfidence = orderedTrips.Average(t => t.ConfidenceScore);

        var group = new VehicleTripGroup
        {
            VehicleId = vehicleId,
            TripDate = orderedTrips.First().StartTimeUtc.Date,
            StartTimeUtc = orderedTrips.First().StartTimeUtc,
            EndTimeUtc = orderedTrips.Last().EndTimeUtc,
            OriginSiteId = orderedTrips.First().OriginSiteId,
            DestinationSiteId = orderedTrips.Last().DestinationSiteId,
            TripCount = orderedTrips.Count,
            TotalDistanceKm = Math.Round(orderedTrips.Sum(t => t.DistanceKm), 2),
            TotalDurationMinutes = Math.Round(orderedTrips.Sum(t => t.DurationMinutes), 2),
            Status = orderedTrips.Any(t => t.Status == VehicleTripStatus.InProgress) ? (int)VehicleTripStatus.InProgress : (int)VehicleTripStatus.Completed,
            MovementProfile = movementProfile,
            DetectionMode = VehicleTripDetectionModeHelper.CreateManualOverrideMode(action),
            TotalFuelConsumed = totalFuelConsumed,
            GroupingType = (int)groupingType,
            ConfidenceScore = averageConfidence,
            ConfidenceBand = ResolveConfidenceBand(averageConfidence),
            AnomalyFlags = (int)orderedTrips.Aggregate(VehicleTripAnomalyType.None, (current, trip) => current | trip.AnomalyFlags),
            ReconciliationStatus = (int)reconciliationStatus,
            ProjectPlanId = orderedTrips.Select(t => t.ProjectPlanId).FirstOrDefault(id => id.HasValue),
            WorkShiftId = orderedTrips.Select(t => t.WorkShiftId).FirstOrDefault(id => id.HasValue),
            PlannedHaulRouteId = orderedTrips.Select(t => t.PlannedHaulRouteId).FirstOrDefault(id => id.HasValue),
            PlannedOriginZoneId = orderedTrips.FirstOrDefault()?.PlannedOriginZoneId,
            PlannedDestinationZoneId = orderedTrips.LastOrDefault()?.PlannedDestinationZoneId,
            PlanningMatchStatus = ResolvePlanningMatchStatus(orderedTrips),
            IsOutOfBounds = ResolveNullableFlag(orderedTrips.Select(t => t.IsOutOfBounds)),
            IsProductiveMovement = ResolveNullableFlag(orderedTrips.Select(t => t.IsProductiveMovement)),
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow,
        };

        var sequence = 1;
        foreach (var trip in orderedTrips)
        {
            group.Trips.Add(new VehicleTrip
            {
                VehicleId = vehicleId,
                SequenceNo = sequence++,
                StartTimeUtc = trip.StartTimeUtc,
                EndTimeUtc = trip.EndTimeUtc,
                OriginSiteId = trip.OriginSiteId,
                DestinationSiteId = trip.DestinationSiteId,
                OriginGeofenceId = trip.OriginGeofenceId,
                DestinationGeofenceId = trip.DestinationGeofenceId,
                StartLatitude = trip.StartLatitude,
                StartLongitude = trip.StartLongitude,
                EndLatitude = trip.EndLatitude,
                EndLongitude = trip.EndLongitude,
                DistanceKm = trip.DistanceKm,
                DurationMinutes = trip.DurationMinutes,
                MaxSpeedKph = trip.MaxSpeedKph,
                Status = (int)trip.Status,
                MovementProfile = trip.MovementProfile,
                DetectionMode = VehicleTripDetectionModeHelper.CreateManualOverrideMode(action),
                StartTrackInfoId = trip.StartTrackInfoId,
                EndTrackInfoId = trip.EndTrackInfoId,
                FuelAtDeparture = trip.FuelAtDeparture,
                FuelAtArrival = trip.FuelAtArrival,
                FuelConsumed = trip.FuelConsumed,
                ConfidenceScore = trip.ConfidenceScore,
                ConfidenceBand = trip.ConfidenceBand,
                AnomalyFlags = (int)trip.AnomalyFlags,
                ReconciliationStatus = (int)reconciliationStatus,
                IsLowConfidence = trip.IsLowConfidence,
                ProjectPlanId = trip.ProjectPlanId,
                WorkShiftId = trip.WorkShiftId,
                PlannedHaulRouteId = trip.PlannedHaulRouteId,
                PlannedOriginZoneId = trip.PlannedOriginZoneId,
                PlannedDestinationZoneId = trip.PlannedDestinationZoneId,
                PlanningMatchStatus = trip.PlanningMatchStatus,
                IsOutOfBounds = trip.IsOutOfBounds,
                IsProductiveMovement = trip.IsProductiveMovement,
                CreatedAtUtc = DateTime.UtcNow,
            });
        }

        return group;
    }

    public static VehicleTripDetailDTO MapGroupToDetailDto(VehicleTripGroup group)
    {
        var orderedTrips = group.Trips.OrderBy(t => t.SequenceNo).ToList();
        var firstTrip = orderedTrips.FirstOrDefault();
        var lastTrip = orderedTrips.LastOrDefault();

        return new VehicleTripDetailDTO
        {
            VehicleTripGroupId = group.VehicleTripGroupId,
            VehicleId = group.VehicleId,
            VehicleLabel = group.Vehicle != null
                ? (!string.IsNullOrWhiteSpace(group.Vehicle.NumberPlate) ? $"{group.Vehicle.HyoungNo} / {group.Vehicle.NumberPlate}" : group.Vehicle.HyoungNo)
                : string.Empty,
            NumberPlate = group.Vehicle?.NumberPlate,
            TripDate = group.TripDate,
            StartTimeUtc = group.StartTimeUtc,
            EndTimeUtc = group.EndTimeUtc,
            OriginSiteId = group.OriginSiteId,
            OriginSiteName = group.OriginSite?.Name,
            OriginDisplayName = group.OriginSite?.Name ?? (firstTrip != null ? $"Cluster ({firstTrip.StartLatitude:F5}, {firstTrip.StartLongitude:F5})" : "Unknown"),
            DestinationSiteId = group.DestinationSiteId,
            DestinationSiteName = group.DestinationSite?.Name,
            DestinationDisplayName = group.DestinationSite?.Name ?? (lastTrip != null ? $"Cluster ({lastTrip.EndLatitude:F5}, {lastTrip.EndLongitude:F5})" : "Unknown"),
            TripCount = group.TripCount,
            TotalDistanceKm = group.TotalDistanceKm,
            TotalDurationMinutes = group.TotalDurationMinutes,
            Status = Enum.IsDefined(typeof(VehicleTripStatus), group.Status) ? (VehicleTripStatus)group.Status : VehicleTripStatus.Completed,
            TotalFuelConsumed = group.TotalFuelConsumed,
            FuelRateKmPerLiter = CalculateFuelRate(group.TotalDistanceKm, group.TotalFuelConsumed),
            HasFuelData = group.TotalFuelConsumed.HasValue,
            FuelDataQuality = ResolveFuelDataQuality((VehicleTripAnomalyType)group.AnomalyFlags, group.TotalFuelConsumed.HasValue),
            MovementProfile = group.MovementProfile,
            DetectionMode = group.DetectionMode,
            IsManualOverride = VehicleTripDetectionModeHelper.IsManualOverride(group.DetectionMode),
            GroupingType = ResolveGroupingType(group),
            ConfidenceScore = group.ConfidenceScore,
            ConfidenceBand = group.ConfidenceBand,
            AnomalyFlags = (VehicleTripAnomalyType)group.AnomalyFlags,
            ReconciliationStatus = (VehicleTripReconciliationStatus)group.ReconciliationStatus,
            IsOutOfBounds = group.IsOutOfBounds,
            IsProductiveMovement = group.IsProductiveMovement,
            PlanningMatchStatus = group.PlanningMatchStatus,
            Trips = orderedTrips.Select(t => new VehicleTripLegDTO
            {
                VehicleTripId = t.VehicleTripId,
                SequenceNo = t.SequenceNo,
                StartTimeUtc = t.StartTimeUtc,
                EndTimeUtc = t.EndTimeUtc,
                OriginSiteId = t.OriginSiteId,
                OriginSiteName = t.OriginSite?.Name,
                OriginDisplayName = t.OriginSite?.Name ?? $"Cluster ({t.StartLatitude:F5}, {t.StartLongitude:F5})",
                DestinationSiteId = t.DestinationSiteId,
                DestinationSiteName = t.DestinationSite?.Name,
                DestinationDisplayName = t.DestinationSite?.Name ?? $"Cluster ({t.EndLatitude:F5}, {t.EndLongitude:F5})",
                OriginGeofenceId = t.OriginGeofenceId,
                DestinationGeofenceId = t.DestinationGeofenceId,
                StartLatitude = t.StartLatitude,
                StartLongitude = t.StartLongitude,
                EndLatitude = t.EndLatitude,
                EndLongitude = t.EndLongitude,
                DistanceKm = t.DistanceKm,
                DurationMinutes = t.DurationMinutes,
                MaxSpeedKph = t.MaxSpeedKph,
                Status = Enum.IsDefined(typeof(VehicleTripStatus), t.Status) ? (VehicleTripStatus)t.Status : VehicleTripStatus.Completed,
                MovementProfile = t.MovementProfile,
                DetectionMode = t.DetectionMode,
                IsManualOverride = VehicleTripDetectionModeHelper.IsManualOverride(t.DetectionMode),
                StartTrackInfoId = t.StartTrackInfoId,
                EndTrackInfoId = t.EndTrackInfoId,
                FuelAtDeparture = t.FuelAtDeparture,
                FuelAtArrival = t.FuelAtArrival,
                FuelConsumed = t.FuelConsumed,
                FuelRateKmPerLiter = CalculateFuelRate(t.DistanceKm, t.FuelConsumed),
                HasFuelData = t.FuelConsumed.HasValue,
                FuelDataQuality = ResolveFuelDataQuality((VehicleTripAnomalyType)t.AnomalyFlags, t.FuelConsumed.HasValue),
                GroupingType = ResolveGroupingType(group),
                ConfidenceScore = t.ConfidenceScore,
                ConfidenceBand = t.ConfidenceBand,
                AnomalyFlags = (VehicleTripAnomalyType)t.AnomalyFlags,
                ReconciliationStatus = (VehicleTripReconciliationStatus)t.ReconciliationStatus,
                IsOutOfBounds = t.IsOutOfBounds,
                IsProductiveMovement = t.IsProductiveMovement,
                PlanningMatchStatus = t.PlanningMatchStatus,
            }).ToList(),
        };
    }

    public static void SupersedeGroup(VehicleTripGroup group, VehicleTripManualOverrideAction action, int? replacementGroupId, VehicleTripReconciliationStatus reconciliationStatus)
    {
        group.DetectionMode = VehicleTripDetectionModeHelper.CreateSupersededMode(action, replacementGroupId);
        group.ReconciliationStatus = (int)reconciliationStatus;
        group.UpdatedAtUtc = DateTime.UtcNow;

        foreach (var trip in group.Trips)
        {
            trip.DetectionMode = VehicleTripDetectionModeHelper.CreateSupersededMode(action, replacementGroupId);
            trip.ReconciliationStatus = (int)reconciliationStatus;
        }
    }

    public static decimal GetSegmentRatio(DateTime startTimeUtc, DateTime splitTimeUtc, DateTime endTimeUtc)
    {
        var totalMinutes = Math.Max(1d, (endTimeUtc - startTimeUtc).TotalMinutes);
        return (decimal)((splitTimeUtc - startTimeUtc).TotalMinutes / totalMinutes);
    }

    public static decimal Interpolate(decimal start, decimal end, decimal ratio)
        => Math.Round(start + ((end - start) * ratio), 8);

    public static decimal GetDurationMinutes(DateTime startTimeUtc, DateTime endTimeUtc)
        => Math.Round((decimal)(endTimeUtc - startTimeUtc).TotalMinutes, 2);

    public static string BuildSuccessMessage(VehicleTripManualOverrideAction action, bool hasReplacement)
        => action switch
        {
            VehicleTripManualOverrideAction.Split => "Trip split override applied successfully.",
            VehicleTripManualOverrideAction.Merge => "Trip merge override applied successfully.",
            VehicleTripManualOverrideAction.ReassignSite => "Trip site override applied successfully.",
            VehicleTripManualOverrideAction.Delete when hasReplacement => "Trip delete override applied successfully.",
            VehicleTripManualOverrideAction.Delete => "Trip group was superseded successfully.",
            VehicleTripManualOverrideAction.AdjustTimes => "Trip time override applied successfully.",
            _ => "Manual override applied successfully.",
        };

    public static VehicleTripManualOverrideResponseDTO CreateResponse(
        int vehicleTripGroupId,
        int? sourceVehicleTripGroupId,
        VehicleTripManualOverrideAction action,
        VehicleTripReconciliationStatus reconciliationStatus,
        string message,
        VehicleTripManualOverrideCommandBase request)
        => new()
        {
            VehicleTripGroupId = vehicleTripGroupId,
            SourceVehicleTripGroupId = sourceVehicleTripGroupId,
            Applied = true,
            Action = action,
            ResultingStatus = VehicleTripStatus.Completed,
            ReconciliationStatus = reconciliationStatus,
            Message = message,
            AppliedByUserId = request.RequestedByUserId,
            AppliedByName = request.RequestedByName,
            Reason = request.Reason,
            RequiredSupervisorApproval = request.SupervisorApproval != null,
        };

    public static FMSResponse<VehicleTripManualOverrideResponseDTO> PropagateFailure(FMSResponse<List<VehicleTripMutationState>> mutationResult)
    {
        if (mutationResult.ValidationErrors?.Count > 0)
        {
            return FMSResponse<VehicleTripManualOverrideResponseDTO>.ValidationFailed(mutationResult.ValidationErrors);
        }

        if (mutationResult.StatusCode == 404)
        {
            return FMSResponse<VehicleTripManualOverrideResponseDTO>.NotFound(mutationResult.ErrorCode ?? "NOT_FOUND", mutationResult.Message ?? "Requested trip was not found.");
        }

        return FMSResponse<VehicleTripManualOverrideResponseDTO>.Failed(mutationResult.Message ?? "Manual override failed.");
    }

    public static VehicleTripGroupingType ResolveGroupingType(VehicleTripGroup group)
        => Enum.IsDefined(typeof(VehicleTripGroupingType), group.GroupingType)
            ? (VehicleTripGroupingType)group.GroupingType
            : VehicleTripGroupingType.SingleLeg;

    public static decimal? CalculateFuelRate(decimal distanceKm, decimal? fuelConsumed)
    {
        if (!fuelConsumed.HasValue || fuelConsumed.Value <= 0m)
        {
            return null;
        }

        return Math.Round(distanceKm / fuelConsumed.Value, 2);
    }

    private static string ResolveFuelDataQuality(VehicleTripAnomalyType anomalyFlags, bool hasFuelData)
    {
        if (!hasFuelData || anomalyFlags.HasFlag(VehicleTripAnomalyType.MissingFuelData))
        {
            return "Missing";
        }

        if (anomalyFlags.HasFlag(VehicleTripAnomalyType.WeakFuelData))
        {
            return "Weak";
        }

        return "Derived";
    }

    private static string ResolveConfidenceBand(decimal score)
        => score >= 0.85m ? "High" : score >= 0.60m ? "Medium" : "Low";

    private static bool? ResolveNullableFlag(IEnumerable<bool?> flags)
    {
        var values = flags.Where(flag => flag.HasValue).Select(flag => flag!.Value).Distinct().ToList();
        return values.Count switch
        {
            0 => null,
            1 => values[0],
            _ => null,
        };
    }

    private static string? ResolvePlanningMatchStatus(IReadOnlyList<VehicleTripMutationState> trips)
    {
        var statuses = trips
            .Select(trip => trip.PlanningMatchStatus)
            .Where(status => !string.IsNullOrWhiteSpace(status))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        return statuses.Count switch
        {
            0 => null,
            1 => statuses[0],
            _ => "Partial",
        };
    }
}
