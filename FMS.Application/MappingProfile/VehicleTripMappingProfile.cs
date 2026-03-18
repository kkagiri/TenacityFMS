/**
 * File: VehicleTripMappingProfile.cs
 * Purpose: AutoMapper profile for vehicle trip entities to DTOs.
 * Dependencies: VehicleTrip, VehicleTripGroup, VehicleTripOverride entities; Trip DTOs and enums.
 * Last Modified: 2026-03-17
 *
 * Key Mappings:
 * - VehicleTrip → VehicleTripLegDTO (individual trip leg)
 * - VehicleTripGroup → VehicleTripGroupDTO (group summary without legs)
 * - VehicleTripGroup → VehicleTripDetailDTO (group with nested legs + vehicle info)
 * - VehicleTripGroup → VehicleTripListItemDTO (light list item with vehicle info)
 * - VehicleTripOverride → VehicleTripOverrideHistoryItemDTO (audit history)
 */
using System;
using System.Linq;
using System.Text.Json;
using AutoMapper;
using FMS.Application.Features.VehicleTrips.DTOs;
using FMS.Application.Features.VehicleTrips.Services;
using FMS.Domain.Entities;

namespace FMS.Application.MappingProfile;

public class VehicleTripMappingProfile : Profile
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public VehicleTripMappingProfile()
    {
        // ── VehicleTrip → VehicleTripLegDTO ──
        CreateMap<VehicleTrip, VehicleTripLegDTO>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => SafeStatus(src.Status)))
            .ForMember(dest => dest.AnomalyFlags, opt => opt.MapFrom(src => (VehicleTripAnomalyType)src.AnomalyFlags))
            .ForMember(dest => dest.ReconciliationStatus, opt => opt.MapFrom(src => (VehicleTripReconciliationStatus)src.ReconciliationStatus))
            .ForMember(dest => dest.IsManualOverride, opt => opt.MapFrom(src => VehicleTripDetectionModeHelper.IsManualOverride(src.DetectionMode)))
            .ForMember(dest => dest.OriginSiteName, opt => opt.MapFrom(src => src.OriginSite != null ? src.OriginSite.Name : null))
            .ForMember(dest => dest.OriginDisplayName, opt => opt.MapFrom(src =>
                src.OriginSite != null
                    ? src.OriginSite.Name
                    : $"Cluster ({src.StartLatitude:F5}, {src.StartLongitude:F5})"))
            .ForMember(dest => dest.DestinationSiteName, opt => opt.MapFrom(src => src.DestinationSite != null ? src.DestinationSite.Name : null))
            .ForMember(dest => dest.DestinationDisplayName, opt => opt.MapFrom(src =>
                src.DestinationSite != null
                    ? src.DestinationSite.Name
                    : $"Cluster ({src.EndLatitude:F5}, {src.EndLongitude:F5})"))
            .ForMember(dest => dest.HasFuelData, opt => opt.MapFrom(src => src.FuelConsumed.HasValue))
            .ForMember(dest => dest.FuelRateKmPerLiter, opt => opt.MapFrom(src => CalculateFuelRate(src.DistanceKm, src.FuelConsumed)))
            // GroupingType is inherited from the parent group via AfterMap in the Group→Detail mapping
            .ForMember(dest => dest.GroupingType, opt => opt.Ignore())
            .ForMember(dest => dest.ExpectedFuelRateKmPerLiter, opt => opt.Ignore())
            .ForMember(dest => dest.FuelVarianceKmPerLiter, opt => opt.Ignore())
            .ForMember(dest => dest.FuelVariancePercent, opt => opt.Ignore())
            .AfterMap((src, dest) =>
            {
                dest.FuelDataQuality = ResolveFuelDataQuality(dest.AnomalyFlags, dest.HasFuelData);
            });

        // ── VehicleTripGroup → VehicleTripGroupDTO ──
        CreateMap<VehicleTripGroup, VehicleTripGroupDTO>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => SafeStatus(src.Status)))
            .ForMember(dest => dest.GroupingType, opt => opt.MapFrom(src => SafeGroupingType(src.GroupingType)))
            .ForMember(dest => dest.AnomalyFlags, opt => opt.MapFrom(src => (VehicleTripAnomalyType)src.AnomalyFlags))
            .ForMember(dest => dest.ReconciliationStatus, opt => opt.MapFrom(src => (VehicleTripReconciliationStatus)src.ReconciliationStatus))
            .ForMember(dest => dest.IsManualOverride, opt => opt.MapFrom(src => VehicleTripDetectionModeHelper.IsManualOverride(src.DetectionMode)))
            .ForMember(dest => dest.OriginSiteName, opt => opt.MapFrom(src => src.OriginSite != null ? src.OriginSite.Name : null))
            .ForMember(dest => dest.DestinationSiteName, opt => opt.MapFrom(src => src.DestinationSite != null ? src.DestinationSite.Name : null))
            .ForMember(dest => dest.HasFuelData, opt => opt.MapFrom(src => src.TotalFuelConsumed.HasValue))
            .ForMember(dest => dest.FuelRateKmPerLiter, opt => opt.MapFrom(src => CalculateFuelRate(src.TotalDistanceKm, src.TotalFuelConsumed)))
            .ForMember(dest => dest.ExpectedFuelRateKmPerLiter, opt => opt.Ignore())
            .ForMember(dest => dest.FuelVarianceKmPerLiter, opt => opt.Ignore())
            .ForMember(dest => dest.FuelVariancePercent, opt => opt.Ignore())
            // Display names need Trips collection for coordinate fallback
            .ForMember(dest => dest.OriginDisplayName, opt => opt.Ignore())
            .ForMember(dest => dest.DestinationDisplayName, opt => opt.Ignore())
            .AfterMap((src, dest) =>
            {
                dest.FuelDataQuality = ResolveFuelDataQuality(dest.AnomalyFlags, dest.HasFuelData);
                ResolveGroupDisplayNames(src, dest.OriginSiteName, dest.DestinationSiteName,
                    out var origin, out var destination);
                dest.OriginDisplayName = origin;
                dest.DestinationDisplayName = destination;
            });

        // ── VehicleTripGroup → VehicleTripDetailDTO (with nested legs + vehicle info) ──
        CreateMap<VehicleTripGroup, VehicleTripDetailDTO>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => SafeStatus(src.Status)))
            .ForMember(dest => dest.GroupingType, opt => opt.MapFrom(src => SafeGroupingType(src.GroupingType)))
            .ForMember(dest => dest.AnomalyFlags, opt => opt.MapFrom(src => (VehicleTripAnomalyType)src.AnomalyFlags))
            .ForMember(dest => dest.ReconciliationStatus, opt => opt.MapFrom(src => (VehicleTripReconciliationStatus)src.ReconciliationStatus))
            .ForMember(dest => dest.IsManualOverride, opt => opt.MapFrom(src => VehicleTripDetectionModeHelper.IsManualOverride(src.DetectionMode)))
            .ForMember(dest => dest.VehicleLabel, opt => opt.MapFrom(src => FormatVehicleLabel(src.Vehicle)))
            .ForMember(dest => dest.NumberPlate, opt => opt.MapFrom(src => src.Vehicle != null ? src.Vehicle.NumberPlate : null))
            .ForMember(dest => dest.OriginSiteName, opt => opt.MapFrom(src => src.OriginSite != null ? src.OriginSite.Name : null))
            .ForMember(dest => dest.DestinationSiteName, opt => opt.MapFrom(src => src.DestinationSite != null ? src.DestinationSite.Name : null))
            .ForMember(dest => dest.Trips, opt => opt.MapFrom(src => src.Trips.OrderBy(t => t.SequenceNo)))
            .ForMember(dest => dest.HasFuelData, opt => opt.MapFrom(src => src.TotalFuelConsumed.HasValue))
            .ForMember(dest => dest.FuelRateKmPerLiter, opt => opt.MapFrom(src => CalculateFuelRate(src.TotalDistanceKm, src.TotalFuelConsumed)))
            .ForMember(dest => dest.ExpectedFuelRateKmPerLiter, opt => opt.Ignore())
            .ForMember(dest => dest.FuelVarianceKmPerLiter, opt => opt.Ignore())
            .ForMember(dest => dest.FuelVariancePercent, opt => opt.Ignore())
            .ForMember(dest => dest.OriginDisplayName, opt => opt.Ignore())
            .ForMember(dest => dest.DestinationDisplayName, opt => opt.Ignore())
            .AfterMap((src, dest) =>
            {
                dest.FuelDataQuality = ResolveFuelDataQuality(dest.AnomalyFlags, dest.HasFuelData);
                ResolveGroupDisplayNames(src, dest.OriginSiteName, dest.DestinationSiteName,
                    out var origin, out var destination);
                dest.OriginDisplayName = origin;
                dest.DestinationDisplayName = destination;
                // Propagate parent group's GroupingType to each leg
                var groupingType = dest.GroupingType;
                foreach (var leg in dest.Trips)
                {
                    leg.GroupingType = groupingType;
                }
            });

        // ── VehicleTripGroup → VehicleTripListItemDTO (light list with vehicle info) ──
        CreateMap<VehicleTripGroup, VehicleTripListItemDTO>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => SafeStatus(src.Status)))
            .ForMember(dest => dest.GroupingType, opt => opt.MapFrom(src => SafeGroupingType(src.GroupingType)))
            .ForMember(dest => dest.AnomalyFlags, opt => opt.MapFrom(src => (VehicleTripAnomalyType)src.AnomalyFlags))
            .ForMember(dest => dest.ReconciliationStatus, opt => opt.MapFrom(src => (VehicleTripReconciliationStatus)src.ReconciliationStatus))
            .ForMember(dest => dest.IsManualOverride, opt => opt.MapFrom(src => VehicleTripDetectionModeHelper.IsManualOverride(src.DetectionMode)))
            .ForMember(dest => dest.VehicleLabel, opt => opt.MapFrom(src => FormatVehicleLabel(src.Vehicle)))
            .ForMember(dest => dest.NumberPlate, opt => opt.MapFrom(src => src.Vehicle != null ? src.Vehicle.NumberPlate : null))
            .ForMember(dest => dest.HasFuelData, opt => opt.MapFrom(src => src.TotalFuelConsumed.HasValue))
            .ForMember(dest => dest.FuelRateKmPerLiter, opt => opt.MapFrom(src => CalculateFuelRate(src.TotalDistanceKm, src.TotalFuelConsumed)))
            .ForMember(dest => dest.ExpectedFuelRateKmPerLiter, opt => opt.Ignore())
            .ForMember(dest => dest.FuelVarianceKmPerLiter, opt => opt.Ignore())
            .ForMember(dest => dest.FuelVariancePercent, opt => opt.Ignore())
            .ForMember(dest => dest.OriginDisplayName, opt => opt.Ignore())
            .ForMember(dest => dest.DestinationDisplayName, opt => opt.Ignore())
            .AfterMap((src, dest) =>
            {
                dest.FuelDataQuality = ResolveFuelDataQuality(dest.AnomalyFlags, dest.HasFuelData);
                ResolveGroupDisplayNames(src, src.OriginSite?.Name, src.DestinationSite?.Name,
                    out var origin, out var destination);
                dest.OriginDisplayName = origin;
                dest.DestinationDisplayName = destination;
            });

        // ── VehicleTripOverride → VehicleTripOverrideHistoryItemDTO ──
        CreateMap<VehicleTripOverride, VehicleTripOverrideHistoryItemDTO>()
            .ForMember(dest => dest.AuditId, opt => opt.MapFrom(src => src.VehicleTripOverrideId))
            .ForMember(dest => dest.Action, opt => opt.MapFrom(src => ParseOverrideAction(src.ActionType)))
            .ForMember(dest => dest.SupervisorApproval, opt => opt.MapFrom(src =>
                !string.IsNullOrEmpty(src.SupervisorApprovalJson)
                    ? JsonSerializer.Deserialize<VehicleTripSupervisorApprovalDTO>(src.SupervisorApprovalJson, JsonOptions)
                    : null))
            .ForMember(dest => dest.OriginalValues, opt => opt.MapFrom(src =>
                !string.IsNullOrEmpty(src.OriginalValuesJson)
                    ? JsonSerializer.Deserialize<VehicleTripDetailDTO>(src.OriginalValuesJson, JsonOptions)
                    : null))
            .ForMember(dest => dest.NewValues, opt => opt.MapFrom(src =>
                !string.IsNullOrEmpty(src.NewValuesJson)
                    ? JsonSerializer.Deserialize<VehicleTripDetailDTO>(src.NewValuesJson, JsonOptions)
                    : null));
    }

    // ── Shared helpers ──

    internal static VehicleTripStatus SafeStatus(int status)
        => Enum.IsDefined(typeof(VehicleTripStatus), status)
            ? (VehicleTripStatus)status
            : VehicleTripStatus.Completed;

    internal static VehicleTripGroupingType SafeGroupingType(int groupingType)
        => Enum.IsDefined(typeof(VehicleTripGroupingType), groupingType)
            ? (VehicleTripGroupingType)groupingType
            : VehicleTripGroupingType.SingleLeg;

    internal static decimal? CalculateFuelRate(decimal distanceKm, decimal? fuelConsumed)
        => fuelConsumed.HasValue && fuelConsumed.Value > 0m
            ? Math.Round(distanceKm / fuelConsumed.Value, 2)
            : null;

    internal static string ResolveFuelDataQuality(VehicleTripAnomalyType anomalyFlags, bool hasFuelData)
    {
        if (!hasFuelData || anomalyFlags.HasFlag(VehicleTripAnomalyType.MissingFuelData))
            return "Missing";
        if (anomalyFlags.HasFlag(VehicleTripAnomalyType.WeakFuelData))
            return "Weak";
        return "Derived";
    }

    internal static string FormatVehicleLabel(Vehicle? vehicle)
    {
        if (vehicle == null) return "";
        return !string.IsNullOrWhiteSpace(vehicle.NumberPlate)
            ? $"{vehicle.HyoungNo} / {vehicle.NumberPlate}"
            : vehicle.HyoungNo;
    }

    private static void ResolveGroupDisplayNames(
        VehicleTripGroup group,
        string? originSiteName, string? destinationSiteName,
        out string originDisplay, out string destinationDisplay)
    {
        if (originSiteName != null)
        {
            originDisplay = originSiteName;
        }
        else
        {
            var firstTrip = group.Trips?.OrderBy(t => t.SequenceNo).FirstOrDefault();
            originDisplay = firstTrip != null
                ? $"Cluster ({firstTrip.StartLatitude:F5}, {firstTrip.StartLongitude:F5})"
                : "Unknown";
        }

        if (destinationSiteName != null)
        {
            destinationDisplay = destinationSiteName;
        }
        else
        {
            var lastTrip = group.Trips?.OrderByDescending(t => t.SequenceNo).FirstOrDefault();
            destinationDisplay = lastTrip != null
                ? $"Cluster ({lastTrip.EndLatitude:F5}, {lastTrip.EndLongitude:F5})"
                : "Unknown";
        }
    }

    private static VehicleTripManualOverrideAction ParseOverrideAction(string actionType)
    {
        return actionType switch
        {
            "Split" => VehicleTripManualOverrideAction.Split,
            "Merge" => VehicleTripManualOverrideAction.Merge,
            "ReassignSite" => VehicleTripManualOverrideAction.ReassignSite,
            "Add" => VehicleTripManualOverrideAction.Add,
            "Delete" => VehicleTripManualOverrideAction.Delete,
            "AdjustTimes" => VehicleTripManualOverrideAction.AdjustTimes,
            _ => Enum.TryParse<VehicleTripManualOverrideAction>(actionType, true, out var parsed)
                ? parsed
                : VehicleTripManualOverrideAction.AdjustTimes
        };
    }
}
