using System.ComponentModel.DataAnnotations;

namespace FMS.Application.Features.FuelComparison.DTOs
{
    /// <summary>
    /// DTO for soft-deleting GPS report entry
    /// Used when GPS data is incorrect and should be excluded from comparisons
    /// </summary>
    public class GpsEntryDeleteDto
    {
        /// <summary>
        /// ID of the GPS report entry to delete
        /// </summary>
        [Required]
        public int Id { get; set; }

        /// <summary>
        /// Reason for deleting the GPS entry (required for audit trail)
        /// </summary>
        [Required]
        [MaxLength(500, ErrorMessage = "Reason cannot exceed 500 characters")]
        public string DeletionReason { get; set; }

        /// <summary>
        /// User ID making the deletion (set from JWT token)
        /// </summary>
        public string DeletedBy { get; set; }
    }
}
