using System.ComponentModel.DataAnnotations;

namespace FMS.Application.Features.Site.DTOs
{
    public class CreateSiteDTO
    {
        [Required(ErrorMessage = "Site name is required")]
        [MaxLength(255, ErrorMessage = "Site name must not exceed 255 characters")]
        public string Name { get; set; } = null!;

        /// <summary>
        /// Whether the site is active for fuel reporting. Defaults to true.
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Site Administrator User ID for notification routing
        /// </summary>
        public string? SiteAdministratorId { get; set; }

        /// <summary>
        /// GPSGate Tag ID for this site
        /// </summary>
        public int? GpsGateTagId { get; set; }

        /// <summary>
        /// GPSGate Tag Name for display purposes
        /// </summary>
        public string? GpsGateTagName { get; set; }

        /// <summary>
        /// Whether to automatically update GPSGate tag when vehicles are transferred to this site
        /// </summary>
        public bool AutoUpdateGpsGateTag { get; set; } = true;
    }
}