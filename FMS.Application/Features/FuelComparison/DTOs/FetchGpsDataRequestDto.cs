using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FMS.Application.Features.FuelComparison.DTOs
{
    /// <summary>
    /// DTO for requesting GPSGate data fetch
    /// Triggers async process to fetch Report 212 data from GPSGate
    /// </summary>
    public class FetchGpsDataRequestDto
    {
        /// <summary>
        /// Start date for fetching GPS data
        /// </summary>
        [Required]
        public DateTime StartDate { get; set; }

        /// <summary>
        /// End date for fetching GPS data
        /// </summary>
        [Required]
        public DateTime EndDate { get; set; }

        /// <summary>
        /// Optional: Filter by specific site
        /// </summary>
        public int? SiteId { get; set; }

        /// <summary>
        /// Optional: Filter by specific vehicle
        /// </summary>
        public int? VehicleId { get; set; }

        /// <summary>
        /// Whether to overwrite existing GPS entries in the date range
        /// If false, only new entries will be added
        /// </summary>
        public bool OverwriteExisting { get; set; } = false;
    }
}
