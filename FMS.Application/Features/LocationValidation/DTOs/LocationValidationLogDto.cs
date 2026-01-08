using System;
using System.Collections.Generic;
using FMS.Domain.Entities.Enums;

namespace FMS.Application.Features.LocationValidation.DTOs;

/// <summary>
/// DTO for LocationValidationLog for API responses
/// </summary>
public class LocationValidationLogDto
{
    public int Id { get; set; }
    public DateTime ValidationTime { get; set; }
    public string PtsId { get; set; } = null!;
    public int TankId { get; set; }
    public string? TankName { get; set; }
    public int? VehicleId { get; set; }
    public string? VehicleName { get; set; }
    public string TankType { get; set; } = null!;

    // Tank location
    public decimal? TankLatitude { get; set; }
    public decimal? TankLongitude { get; set; }
    public string? TankLocationSource { get; set; }

    // Vehicle location
    public decimal? VehicleLatitude { get; set; }
    public decimal? VehicleLongitude { get; set; }
    public decimal? VehicleGPSAccuracy { get; set; }
    public decimal? VehicleDistanceMeters { get; set; }
    public bool VehicleProximityRequired { get; set; }
    public bool? VehicleProximityValid { get; set; }

    // Mobile location
    public decimal? MobileLatitude { get; set; }
    public decimal? MobileLongitude { get; set; }
    public decimal? MobileAccuracy { get; set; }
    public decimal? MobileDistanceMeters { get; set; }
    public bool MobileProximityRequired { get; set; }
    public bool? MobileProximityValid { get; set; }

    // GPS Accuracy
    public int? MinimumGPSAccuracyRequired { get; set; }
    public bool? GPSAccuracyValid { get; set; }

    // Validation result
    public bool IsValid { get; set; }
    public string ValidationResult { get; set; } = null!;
    public string? FailureReason { get; set; }

    // Settings used
    public int? VehicleRadiusUsed { get; set; }
    public int? MobileRadiusUsed { get; set; }
    public int? GracePeriodMetersUsed { get; set; }
    public bool WasBypassedDueToGPSFailure { get; set; }

    // Context
    public string? UserId { get; set; }
    public string? UserName { get; set; }
    public int? TransactionId { get; set; }
}

/// <summary>
/// Filter parameters for Location Validation Logs query
/// </summary>
public class LocationValidationLogFilter
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? PtsId { get; set; }
    public int? TankId { get; set; }
    public int? VehicleId { get; set; }
    public bool? IsValid { get; set; }
    public string? ValidationResult { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

/// <summary>
/// Paginated response for Location Validation Logs
/// </summary>
public class LocationValidationLogPagedResponse
{
    public List<LocationValidationLogDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasPreviousPage => PageNumber > 1;
    public bool HasNextPage => PageNumber < TotalPages;
}
