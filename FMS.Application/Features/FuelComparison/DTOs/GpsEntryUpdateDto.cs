using System.ComponentModel.DataAnnotations;

namespace FMS.Application.Features.FuelComparison.DTOs
{
    /// <summary>
    /// DTO for updating GPS report entry volume
    /// Used when user wants to correct GPS data due to inaccuracies
    /// </summary>
    public class GpsEntryUpdateDto
    {
        /// <summary>
        /// ID of the GPS report entry to update
        /// </summary>
        [Required]
        public int Id { get; set; }

        /// <summary>
        /// New volume value to replace the original (must be positive)
        /// </summary>
        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Volume must be greater than 0")]
        public decimal ModifiedVolume { get; set; }

        /// <summary>
        /// Reason for modifying the GPS entry (required for audit trail)
        /// </summary>
        [Required]
        [MaxLength(500, ErrorMessage = "Reason cannot exceed 500 characters")]
        public string ModificationReason { get; set; }

        /// <summary>
        /// User ID making the modification (set from JWT token)
        /// </summary>
        public string ModifiedBy { get; set; }
    }
}
