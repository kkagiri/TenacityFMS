/**
 * File: VehicleTripAnomalyType.cs
 * Purpose: Flags potential trip quality issues detected during orchestration and reconciliation.
 * Dependencies: None.
 * Last Modified: 2026-03-11
 */
using System;

namespace FMS.Application.Features.VehicleTrips.DTOs;

[Flags]
public enum VehicleTripAnomalyType
{
    None = 0,
    LowConfidence = 1,
    UnknownOriginOrDestination = 2,
    GpsGapSuspected = 4,
    OffSiteIdleSuspected = 8,
    UnmatchedReturn = 16,
    MissingFuelData = 32,
    NegativeFuelConsumption = 64,
    UnrealisticSpeed = 128,
    AsymmetricCycle = 256,
    NoReturnToOrigin = 512,
    WeakFuelData = 1024,
    SuspiciousFuelRate = 2048,
}
