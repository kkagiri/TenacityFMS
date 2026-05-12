using System;
using System.ComponentModel.DataAnnotations;
using FMS.Domain.Entities.enums;

namespace FMS.Application.Features.TankManagement.StockAdjustment.DTOs;

/// <summary>
/// DTO for stock adjustment correction data
/// </summary>
public class StockAdjustmentCorrectionDto {
    /// <summary>
    /// Tank being adjusted
    /// </summary>
    [Required]
    public int TankId { get; set; }

    /// <summary>
    /// Site where the tank is located
    /// </summary>
    [Required]
    public int SiteId { get; set; }

    /// <summary>
    /// Date and time of adjustment
    /// </summary>
    [Required]
    public DateTime AdjustmentDate { get; set; }

    /// <summary>
    /// Volume before the adjustment
    /// </summary>
    [Required]
    [Range (0, double.MaxValue, ErrorMessage = "Previous volume cannot be negative")]
    public decimal PreviousVolume { get; set; }

    /// <summary>
    /// Volume after the adjustment
    /// </summary>
    [Required]
    [Range (0, double.MaxValue, ErrorMessage = "New volume cannot be negative")]
    public decimal NewVolume { get; set; }

    /// <summary>
    /// Type of adjustment: 0=Increase, 1=Decrease, 2=Correction
    /// </summary>
    [Required]
    [Range (0, 2)]
    public int AdjustmentType { get; set; }

    /// <summary>
    /// Reason code for the adjustment
    /// </summary>
    [Required]
    public StockAdjustmentReasonEnum ReasonCode { get; set; }

    /// <summary>
    /// Human-readable reason for the adjustment
    /// </summary>
    [Required]
    [StringLength (200)]
    public string Reason { get; set; } = string.Empty;

    /// <summary>
    /// Additional notes about the adjustment
    /// </summary>
    [StringLength (500)]
    public string? Notes { get; set; }

    /// <summary>
    /// User who approved the adjustment (if approval is required)
    /// </summary>
    public string? ApprovedBy { get; set; }

    /// <summary>
    /// Status of the adjustment: 0=Pending, 1=Approved, 2=Rejected
    /// </summary>
    [Range (0, 2)]
    public int Status { get; set; } = 1; // Default to approved

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
    public string CreatedBy { get; set; } = string.Empty;
}