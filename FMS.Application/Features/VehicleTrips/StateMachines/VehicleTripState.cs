/**
 * File: VehicleTripState.cs
 * Purpose: Defines the per-vehicle real-time state for trip detection state machines.
 * Dependencies: TrackPointDTO, VehicleTripDetectionResultDTO.
 * Last Modified: 2026-03-12
 */
using System;
using System.Collections.Generic;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Application.Features.VehicleTrips.DTOs;

namespace FMS.Application.Features.VehicleTrips.StateMachines;

public enum TripDetectionPhase
{
    AtSite = 0,
    Departing = 1,
    InTransit = 2,
    Arriving = 3,
}

public class VehicleTripState
{
    public int VehicleId { get; set; }
    public TripDetectionPhase Phase { get; set; } = TripDetectionPhase.AtSite;

    public int? CurrentSiteId { get; set; }
    public int? CurrentGeofenceId { get; set; }
    public string? CurrentSiteName { get; set; }

    public int? OriginSiteId { get; set; }
    public int? OriginGeofenceId { get; set; }
    public string? OriginSiteName { get; set; }
    public decimal? OriginLatitude { get; set; }
    public decimal? OriginLongitude { get; set; }
    public DateTime? TripStartTimeUtc { get; set; }
    public int? TripStartTrackInfoId { get; set; }
    public decimal? FuelAtDeparture { get; set; }

    public int ConsecutiveOutOfSitePoints { get; set; }
    public int ConsecutiveAtSitePoints { get; set; }

    public decimal AccumulatedDistanceKm { get; set; }
    public decimal? MaxSpeedKph { get; set; }

    public DateTime? LastGpsTimestampUtc { get; set; }
    public decimal? LastLatitude { get; set; }
    public decimal? LastLongitude { get; set; }

    public int? InProgressTripGroupId { get; set; }
    public int? InProgressTripId { get; set; }

    public List<TrackPointDTO> RecentPoints { get; set; } = new();

    public void Reset()
    {
        Phase = TripDetectionPhase.AtSite;
        OriginSiteId = null;
        OriginGeofenceId = null;
        OriginSiteName = null;
        OriginLatitude = null;
        OriginLongitude = null;
        TripStartTimeUtc = null;
        TripStartTrackInfoId = null;
        FuelAtDeparture = null;
        ConsecutiveOutOfSitePoints = 0;
        ConsecutiveAtSitePoints = 0;
        AccumulatedDistanceKm = 0;
        MaxSpeedKph = null;
        InProgressTripGroupId = null;
        InProgressTripId = null;
    }
}
