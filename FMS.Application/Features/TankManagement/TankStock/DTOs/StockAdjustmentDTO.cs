using System;
using System.ComponentModel.DataAnnotations;

namespace FMS.Application.ModelsDTOs.FMS.TankStock;

//Cursor - Stock Adjustment DTO for tank stock adjustments
public class StockAdjustmentDTO {
    public int Id { get; set; }

    [Required (ErrorMessage = "Tank ID is required")]
    public int TankId { get; set; }

    [Required (ErrorMessage = "Site ID is required")]
    public int SiteId { get; set; }

    [Required (ErrorMessage = "Adjustment date is required")]
    public DateTime AdjustmentDate { get; set; }

    [Required (ErrorMessage = "Current volume is required")]
    [Range (0, double.MaxValue, ErrorMessage = "Current volume must be non-negative")]
    public decimal CurrentVolume { get; set; }

    [Required (ErrorMessage = "New volume is required")]
    [Range (0, double.MaxValue, ErrorMessage = "New volume must be non-negative")]
    public decimal NewVolume { get; set; }

    //Cursor - VolumeChange will be calculated automatically if not provided
    public decimal VolumeChange { get; set; }

    [Required (ErrorMessage = "Adjustment type is required")]
    public int AdjustmentType { get; set; } // 0: Increase, 1: Decrease, 2: Correction

    [Required (ErrorMessage = "Reason code is required")]
    [Range (1, int.MaxValue, ErrorMessage = "Reason code must be a valid value")]
    public int ReasonCode { get; set; } // StockAdjustmentReasonEnum value

    [Required (ErrorMessage = "Reason is required")]
    [StringLength (200, ErrorMessage = "Reason cannot exceed 200 characters")]
    public string Reason { get; set; } = null!;

    [StringLength (500, ErrorMessage = "Notes cannot exceed 500 characters")]
    public string? Notes { get; set; }

    [Required (ErrorMessage = "Created by is required")]
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