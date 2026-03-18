/**
 * File: VehicleTripDetectionModeHelper.cs
 * Purpose: Centralizes detection-mode conventions for manual trip overrides and superseded records.
 * Dependencies: VehicleTripManualOverrideAction.
 * Last Modified: 2026-03-11
 */
using FMS.Application.Features.VehicleTrips.DTOs;

namespace FMS.Application.Features.VehicleTrips.Services;

public static class VehicleTripDetectionModeHelper
{
    public const string ManualOverridePrefix = "ManualOverride:";
    public const string SupersededPrefix = "Superseded:";

    public static string CreateManualOverrideMode(VehicleTripManualOverrideAction action)
        => $"{ManualOverridePrefix}{action}";

    public static string CreateSupersededMode(VehicleTripManualOverrideAction action, int? replacementGroupId = null)
        => replacementGroupId.HasValue
            ? $"{SupersededPrefix}{action}:{replacementGroupId.Value}"
            : $"{SupersededPrefix}{action}";

    public static bool IsSuperseded(string? detectionMode)
        => !string.IsNullOrWhiteSpace(detectionMode)
           && detectionMode.StartsWith(SupersededPrefix, System.StringComparison.OrdinalIgnoreCase);

    public static bool IsManualOverride(string? detectionMode)
        => !string.IsNullOrWhiteSpace(detectionMode)
           && detectionMode.StartsWith(ManualOverridePrefix, System.StringComparison.OrdinalIgnoreCase);
}
