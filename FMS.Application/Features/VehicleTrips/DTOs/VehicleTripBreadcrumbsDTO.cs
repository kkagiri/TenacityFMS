/**
 * File: VehicleTripBreadcrumbsDTO.cs
 * Purpose: Read model for GPS breadcrumb points associated with a persisted vehicle trip group.
 * Dependencies: TrackPointDTO.
 * Last Modified: 2026-03-13
 */
using System;
using System.Collections.Generic;
using FMS.Application.Features.Vehicle.DTOs;

namespace FMS.Application.Features.VehicleTrips.DTOs;

public class VehicleTripBreadcrumbsDTO
{
    public int VehicleTripGroupId { get; set; }
    public int VehicleId { get; set; }
    public DateTime FromUtc { get; set; }
    public DateTime ToUtc { get; set; }
    public int PointCount { get; set; }
    public List<TrackPointDTO> TrackPoints { get; set; } = new();
}