using System;
using System.ComponentModel.DataAnnotations;
using FMS.Domain.Entities.enums;

namespace FMS.Domain.Entities
{
    /// <summary>
    /// Represents a manual stock adjustment made to a tank
    /// This entity tracks manual adjustments separately from the TankVolumeHistory
    /// but integrates with it through the TankVolumeHistoryIntegrationService
    /// </summary>
    public partial class StockAdjustment
    {
        public int Id { get; set; }

        /// <summary>
        /// The tank being adjusted
        /// </summary>
        public int TankId { get; set; }

        /// <summary>
        /// The site where the tank is located
        /// </summary>
        public int SiteId { get; set; }

        /// <summary>
        /// Date and time when the adjustment was made
        /// </summary>
        public DateTime AdjustmentDate { get; set; }

        /// <summary>
        /// Volume before the adjustment
        /// </summary>
        public decimal PreviousVolume { get; set; }

        /// <summary>
        /// Volume after the adjustment
        /// </summary>
        public decimal NewVolume { get; set; }

        /// <summary>
        /// Calculated volume change (NewVolume - PreviousVolume)
        /// </summary>
        public decimal VolumeChange { get; set; }

        /// <summary>
        /// Type of adjustment: 0=Increase, 1=Decrease, 2=Correction
        /// </summary>
        public int AdjustmentType { get; set; }

        /// <summary>
        /// Reason code for the adjustment
        /// </summary>
        public StockAdjustmentReasonEnum ReasonCode { get; set; }

        /// <summary>
        /// Human-readable reason for the adjustment
        /// </summary>
        [StringLength(200)]
        public string Reason { get; set; } = string.Empty;

        /// <summary>
        /// Additional notes about the adjustment
        /// </summary>
        [StringLength(500)]
        public string? Notes { get; set; }

        /// <summary>
        /// User who created the adjustment
        /// </summary>
        [StringLength(450)]
        public string CreatedBy { get; set; } = string.Empty;

        /// <summary>
        /// When the adjustment record was created
        /// </summary>
        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// User who approved the adjustment (if approval is required)
        /// </summary>
        [StringLength(450)]
        public string? ApprovedBy { get; set; }

        /// <summary>
        /// When the adjustment was approved
        /// </summary>
        public DateTime? ApprovedOn { get; set; }

        /// <summary>
        /// Status of the adjustment: 0=Pending, 1=Approved, 2=Rejected
        /// </summary>
        public int Status { get; set; } = 1; // Default to approved for now

        /// <summary>
        /// Reference to the TankVolumeHistory record created for this adjustment
        /// </summary>
        public int? TankVolumeHistoryId { get; set; }

        // Navigation properties
        public virtual Tank Tank { get; set; } = null!;
        public virtual Site Site { get; set; } = null!;
        public virtual User CreatedByNavigation { get; set; } = null!;
        public virtual User? ApprovedByNavigation { get; set; }
        public virtual TankVolumeHistory? TankVolumeHistory { get; set; }
    }
}