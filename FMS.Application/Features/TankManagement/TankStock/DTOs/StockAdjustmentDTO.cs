using System;
using System.ComponentModel.DataAnnotations;

namespace FMS.Application.ModelsDTOs.FMS.TankStock;

//Cursor - Stock Adjustment DTO for tank stock adjustments
public class StockAdjustmentDTO {
    public int Id { get; set; }

    [Required]
    public int TankId { get; set; }

    [Required]
    public int SiteId { get; set; }

    [Required]
    public DateTime AdjustmentDate { get; set; }

    [Required]
    [Range (0, double.MaxValue, ErrorMessage = "Current volume must be non-negative")]
    public decimal CurrentVolume { get; set; }

    [Required]
    [Range (0, double.MaxValue, ErrorMessage = "New volume must be non-negative")]
    public decimal NewVolume { get; set; }

    public decimal VolumeChange => NewVolume - CurrentVolume;

    [Required]
    public int AdjustmentType { get; set; } // 0: Increase, 1: Decrease, 2: Correction

    [Required]
    public int ReasonCode { get; set; } // StockAdjustmentReasonEnum value

    [Required]
    [StringLength (200)]
    public string Reason { get; set; } = null!;

    [StringLength (500)]
    public string? Notes { get; set; }

    [Required]
    public string CreatedBy { get; set; } = null!;

    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

    public int Status { get; set; } = 1; // 0=Pending, 1=Approved, 2=Rejected

    public string? ApprovedBy { get; set; }

    public DateTime? ApprovedOn { get; set; }

    public int? TankVolumeHistoryId { get; set; }

    // Navigation properties for display
    public string? TankName { get; set; }
    public string? SiteName { get; set; }
    public string? CreatedByName { get; set; }
    public string? ApprovedByName { get; set; }
}