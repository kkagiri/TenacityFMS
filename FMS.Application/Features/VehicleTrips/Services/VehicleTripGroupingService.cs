/**
 * File: VehicleTripGroupingService.cs
 * Purpose: Groups detected trip legs into single-leg, round-trip, and load-cycle summaries.
 * Dependencies: Vehicle trip grouped detection DTOs.
 * Last Modified: 2026-03-11
 */
using System.Collections.Generic;
using System.Linq;
using FMS.Application.Features.VehicleTrips.DTOs;
using FMS.Domain.Entities;
using VehicleEntity = FMS.Domain.Entities.Vehicle;

namespace FMS.Application.Features.VehicleTrips.Services;

public class VehicleTripGroupingService : IVehicleTripGroupingService
{
    public List<VehicleTripGroupedDetectionDTO> GroupTrips(VehicleEntity vehicle, IReadOnlyList<VehicleTripDetectionResultDTO> detectedTrips)
    {
        var orderedTrips = detectedTrips
            .OrderBy(t => t.StartTimeUtc)
            .ToList();

        var results = new List<VehicleTripGroupedDetectionDTO>();

        for (var index = 0; index < orderedTrips.Count; index++)
        {
            var currentTrip = orderedTrips[index];
            var nextTrip = index < orderedTrips.Count - 1 ? orderedTrips[index + 1] : null;

            if (nextTrip != null && CanFormCycle(currentTrip, nextTrip))
            {
                var groupingType = vehicle.MovementProfile == VehicleMovementProfile.Cluster
                    ? VehicleTripGroupingType.LoadCycle
                    : VehicleTripGroupingType.RoundTrip;

                results.Add(BuildGroup(groupingType, new[] { currentTrip, nextTrip }, currentTrip.OriginSiteId, nextTrip.DestinationSiteId));
                index++;
                continue;
            }

            results.Add(BuildGroup(VehicleTripGroupingType.SingleLeg, new[] { currentTrip }, currentTrip.OriginSiteId, currentTrip.DestinationSiteId));
        }

        return results;
    }

    private static bool CanFormCycle(VehicleTripDetectionResultDTO outboundTrip, VehicleTripDetectionResultDTO returnTrip)
    {
        return outboundTrip.StartTimeUtc.Date == returnTrip.StartTimeUtc.Date
               && outboundTrip.OriginSiteId.HasValue
               && outboundTrip.DestinationSiteId.HasValue
               && returnTrip.OriginSiteId.HasValue
               && returnTrip.DestinationSiteId.HasValue
               && outboundTrip.OriginSiteId == returnTrip.DestinationSiteId
               && outboundTrip.DestinationSiteId == returnTrip.OriginSiteId;
    }

    private static VehicleTripGroupedDetectionDTO BuildGroup(
        VehicleTripGroupingType groupingType,
        IReadOnlyCollection<VehicleTripDetectionResultDTO> trips,
        int? originSiteId,
        int? destinationSiteId)
    {
        var orderedTrips = trips.OrderBy(t => t.StartTimeUtc).ToList();
        var firstTrip = orderedTrips.First();
        var lastTrip = orderedTrips.Last();

        return new VehicleTripGroupedDetectionDTO
        {
            TripDate = firstTrip.StartTimeUtc.Date,
            OriginSiteId = originSiteId,
            DestinationSiteId = destinationSiteId,
            StartTimeUtc = firstTrip.StartTimeUtc,
            EndTimeUtc = lastTrip.EndTimeUtc,
            TotalDistanceKm = orderedTrips.Sum(t => t.DistanceKm),
            TotalDurationMinutes = orderedTrips.Sum(t => t.DurationMinutes),
            MovementProfile = firstTrip.MovementProfile,
            DetectionMode = firstTrip.DetectionMode,
            GroupingType = groupingType,
            Trips = orderedTrips,
        };
    }
}