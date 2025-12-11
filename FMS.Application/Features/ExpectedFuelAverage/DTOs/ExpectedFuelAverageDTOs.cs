using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace FMS.Application.Features.ExpectedFuelAverage.DTOs;

/// <summary>
/// DTO for Fuel Route (from/to locations for km/L based vehicles)
/// </summary>
public class FuelRouteDTO
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("fromLocation")]
    public string FromLocation { get; set; } = string.Empty;

    [JsonPropertyName("toLocation")]
    public string ToLocation { get; set; } = string.Empty;

    [JsonPropertyName("distanceKm")]
    public decimal? DistanceKm { get; set; }

    [JsonPropertyName("elevationChange")]
    public int? ElevationChange { get; set; }

    [JsonPropertyName("routeType")]
    public string? RouteType { get; set; }

    [JsonPropertyName("siteId")]
    public int? SiteId { get; set; }

    [JsonPropertyName("siteName")]
    public string? SiteName { get; set; }

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; } = true;
}

/// <summary>
/// DTO for Load Classification (weight-based for km/L vehicles)
/// </summary>
public class LoadClassificationDTO
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("minWeightTonnes")]
    public decimal? MinWeightTonnes { get; set; }

    [JsonPropertyName("maxWeightTonnes")]
    public decimal? MaxWeightTonnes { get; set; }

    [JsonPropertyName("sortOrder")]
    public int SortOrder { get; set; }

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; } = true;
}

/// <summary>
/// DTO for Usage Intensity (for L/hr based vehicles)
/// </summary>
public class UsageIntensityDTO
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("typicalHoursPerDay")]
    public decimal? TypicalHoursPerDay { get; set; }

    [JsonPropertyName("sortOrder")]
    public int SortOrder { get; set; }

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; } = true;
}

/// <summary>
/// DTO for Expected Fuel Average Template - the main entity for managing expected averages
/// </summary>
public class ExpectedFuelAverageTemplateDTO
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    // Vehicle criteria
    [JsonPropertyName("vehicleTypeId")]
    public int VehicleTypeId { get; set; }

    [JsonPropertyName("vehicleTypeName")]
    public string? VehicleTypeName { get; set; }

    [JsonPropertyName("vehicleManufacturerId")]
    public int? VehicleManufacturerId { get; set; }

    [JsonPropertyName("vehicleManufacturerName")]
    public string? VehicleManufacturerName { get; set; }

    [JsonPropertyName("vehicleModelId")]
    public int? VehicleModelId { get; set; }

    [JsonPropertyName("vehicleModelName")]
    public string? VehicleModelName { get; set; }

    [JsonPropertyName("yearOfManufacture")]
    public string? YearOfManufacture { get; set; }

    // Operating conditions
    [JsonPropertyName("siteId")]
    public int? SiteId { get; set; }

    [JsonPropertyName("siteName")]
    public string? SiteName { get; set; }

    [JsonPropertyName("fuelRouteId")]
    public int? FuelRouteId { get; set; }

    [JsonPropertyName("fuelRouteName")]
    public string? FuelRouteName { get; set; }

    [JsonPropertyName("loadClassificationId")]
    public int? LoadClassificationId { get; set; }

    [JsonPropertyName("loadClassificationName")]
    public string? LoadClassificationName { get; set; }

    [JsonPropertyName("usageIntensityId")]
    public int? UsageIntensityId { get; set; }

    [JsonPropertyName("usageIntensityName")]
    public string? UsageIntensityName { get; set; }

    // Expected values
    [JsonPropertyName("isKmPerLiter")]
    public bool IsKmPerLiter { get; set; } = true;

    [JsonPropertyName("expectedValue")]
    public decimal ExpectedValue { get; set; }

    [JsonPropertyName("minThreshold")]
    public decimal? MinThreshold { get; set; }

    [JsonPropertyName("maxThreshold")]
    public decimal? MaxThreshold { get; set; }

    [JsonPropertyName("tolerancePercent")]
    public decimal? TolerancePercent { get; set; } = 10;

    // Metadata
    [JsonPropertyName("priority")]
    public int Priority { get; set; }

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; } = true;

    [JsonPropertyName("effectiveFrom")]
    public DateTime? EffectiveFrom { get; set; }

    [JsonPropertyName("effectiveTo")]
    public DateTime? EffectiveTo { get; set; }

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("createdBy")]
    public string? CreatedBy { get; set; }

    // Computed display property
    [JsonPropertyName("displayUnit")]
    public string DisplayUnit => IsKmPerLiter ? "km/L" : "L/hr";
}

/// <summary>
/// DTO for Vehicle Expected Average Assignment
/// </summary>
public class VehicleExpectedAverageAssignmentDTO
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("vehicleId")]
    public int VehicleId { get; set; }

    [JsonPropertyName("vehicleHyoungNo")]
    public string? VehicleHyoungNo { get; set; }

    [JsonPropertyName("vehicleNumberPlate")]
    public string? VehicleNumberPlate { get; set; }

    [JsonPropertyName("expectedFuelAverageTemplateId")]
    public int ExpectedFuelAverageTemplateId { get; set; }

    [JsonPropertyName("templateName")]
    public string? TemplateName { get; set; }

    [JsonPropertyName("isDefault")]
    public bool IsDefault { get; set; }

    [JsonPropertyName("overrideExpectedValue")]
    public decimal? OverrideExpectedValue { get; set; }

    [JsonPropertyName("overrideTolerancePercent")]
    public decimal? OverrideTolerancePercent { get; set; }

    [JsonPropertyName("notes")]
    public string? Notes { get; set; }

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; } = true;

    // Include template details for display
    [JsonPropertyName("template")]
    public ExpectedFuelAverageTemplateDTO? Template { get; set; }

    // Computed: effective expected value (override or template value)
    [JsonPropertyName("effectiveExpectedValue")]
    public decimal EffectiveExpectedValue => OverrideExpectedValue ?? Template?.ExpectedValue ?? 0;
}

/// <summary>
/// Summary DTO for vehicle's expected averages
/// </summary>
public class VehicleExpectedAverageSummaryDTO
{
    [JsonPropertyName("vehicleId")]
    public int VehicleId { get; set; }

    [JsonPropertyName("vehicleHyoungNo")]
    public string? VehicleHyoungNo { get; set; }

    [JsonPropertyName("vehicleTypeName")]
    public string? VehicleTypeName { get; set; }

    [JsonPropertyName("isKmPerLiter")]
    public bool IsKmPerLiter { get; set; }

    [JsonPropertyName("defaultAssignment")]
    public VehicleExpectedAverageAssignmentDTO? DefaultAssignment { get; set; }

    [JsonPropertyName("allAssignments")]
    public List<VehicleExpectedAverageAssignmentDTO> AllAssignments { get; set; } = new();

    [JsonPropertyName("totalAssignments")]
    public int TotalAssignments { get; set; }
}
