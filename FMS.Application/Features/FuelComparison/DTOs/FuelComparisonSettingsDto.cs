using System;
using System.Collections.Generic;

namespace FMS.Application.Features.FuelComparison.DTOs
{
    /// <summary>
    /// DTO for user-specific fuel comparison settings
    /// </summary>
    public class FuelComparisonSettingsDto
    {
        /// <summary>
        /// Settings identifier
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// User ID who owns these settings
        /// </summary>
        public string UserId { get; set; }

        /// <summary>
        /// Username for display
        /// </summary>
        public string UserName { get; set; }

        /// <summary>
        /// Variance threshold in liters (default: 10.0)
        /// Records with variance exceeding this value will be highlighted
        /// </summary>
        public decimal VarianceThreshold { get; set; }

        /// <summary>
        /// Whether to show soft-deleted GPS entries in the grid
        /// </summary>
        public bool ShowDeleted { get; set; }

        /// <summary>
        /// Default filter mode: "all", "site", or "tank"
        /// </summary>
        public string DefaultFilter { get; set; }

        /// <summary>
        /// Default grouping: "vehicle", "site", "tank", or "none"
        /// </summary>
        public string DefaultGrouping { get; set; }

        /// <summary>
        /// Last update timestamp
        /// </summary>
        public DateTime UpdatedAt { get; set; }
    }
}
