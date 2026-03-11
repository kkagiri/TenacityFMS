/**
 * File: GetVehicleTripsQuery.cs
 * Purpose: Query contract for the trip management workbench across vehicles.
 * Dependencies: MediatR, FMSResponse, VehicleTripListItemDTO.
 * Last Modified: 2026-03-10
 */
using System;
using System.Collections.Generic;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTrips.DTOs;
using FMS.Domain.Entities;
using MediatR;

namespace FMS.Application.Features.VehicleTrips.Queries;

public record GetVehicleTripsQuery : IRequest<FMSResponse<List<VehicleTripListItemDTO>>>
{
    public int? VehicleId { get; init; }
    public DateTime? FromUtc { get; init; }
    public DateTime? ToUtc { get; init; }
    public VehicleMovementProfile? MovementProfile { get; init; }
    public string? DetectionMode { get; init; }
}