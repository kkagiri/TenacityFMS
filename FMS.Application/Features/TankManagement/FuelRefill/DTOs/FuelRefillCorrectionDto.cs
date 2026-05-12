using System;
using System.ComponentModel.DataAnnotations;

namespace FMS.Application.Features.TankManagement.FuelRefill.DTOs;

/// <summary>
/// DTO for fuel refill correction data
/// </summary>
public class FuelRefillCorrectionDto {
    /// <summary>
    /// Vehicle being refilled
    /// </summary>
    [Required]
    public int VehicleId { get; set; }

    /// <summary>
    /// Tank being refilled from
    /// </summary>
    public int? TankId { get; set; }

    /// <summary>
    /// Site where refill occurred
    /// </summary>
    [Required]
    public int SiteId { get; set; }

    /// <summary>
    /// Date and time of refill
    /// </summary>
    [Required]
    public DateTime Date { get; set; }

    /// <summary>
    /// Manual fuel refill amount in liters
    /// </summary>
    [Required]
    [Range (0.01, double.MaxValue, ErrorMessage = "Refill amount must be greater than zero")]
    public decimal ManualFuelrefillAmount { get; set; }

    /// <summary>
    /// Previous meter reading
    /// </summary>
    public decimal? PreviousMeterReading { get; set; }

    /// <summary>
    /// Current meter reading
    /// </summary>
    public decimal? CurrentMeterReading { get; set; }

    /// <summary>
    /// Driver ID (optional)
    /// </summary>
    public int? DriverId { get; set; }

    /// <summary>
    /// Tag ID used for refill
    /// </summary>
    public string? TagId { get; set; }

    /// <summary>
    /// Comments about the refill
    /// </summary>
    [StringLength (500)]
    public string? Comment { get; set; }

    /// <summary>
    /// Associated pump transaction ID
    /// </summary>
    public int? PumpTranscationId { get; set; }

    /// <summary>
    /// Reason for the correction
    /// </summary>
    [Required]
    [StringLength (200)]
    public string CorrectionReason { get; set; } = string.Empty;

    /// <summary>
    /// User making the correction
    /// </summary>
    [Required]
    public string FuelBy { get; set; } = string.Empty;
}