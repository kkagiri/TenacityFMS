using System;
using System.ComponentModel.DataAnnotations;

namespace FMS.Application.Features.TankManagement.TankTransfer.DTOs;

/// <summary>
/// DTO for tank transfer correction data
/// </summary>
public class TankTransferCorrectionDto {
    /// <summary>
    /// Source tank ID
    /// </summary>
    [Required]
    public int SourceTankId { get; set; }

    /// <summary>
    /// Destination tank ID
    /// </summary>
    [Required]
    public int DestinationTankId { get; set; }

    /// <summary>
    /// Amount transferred in liters
    /// </summary>
    [Required]
    [Range (0.01, double.MaxValue, ErrorMessage = "Transfer amount must be greater than zero")]
    public decimal Amount { get; set; }

    /// <summary>
    /// Date and time of transfer
    /// </summary>
    [Required]
    public DateTime TransferDate { get; set; }

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
    public string RecordedBy { get; set; } = string.Empty;
}