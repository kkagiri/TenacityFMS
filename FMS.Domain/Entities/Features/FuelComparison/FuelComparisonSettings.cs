using System;

namespace FMS.Domain.Entities
{
    /// <summary>
    /// Stores user-specific settings for Fuel Data Comparison module
    /// </summary>
    public class FuelComparisonSettings
    {
        /// <summary>
        /// Primary key
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// User identifier (from User table)
        /// </summary>
        public string UserId { get; set; } = null!;

        /// <summary>
        /// Variance threshold in liters
        /// Default: 10.0 liters
        /// Variances exceeding this value will be highlighted
        /// </summary>
        public decimal VarianceThreshold { get; set; } = 10.0m;

        /// <summary>
        /// Whether to show deleted GPS entries in the comparison table
        /// Default: false
        /// </summary>
        public bool ShowDeleted { get; set; } = false;

        /// <summary>
        /// Default filter selection ('all', 'site', 'tank')
        /// </summary>
        public string DefaultFilter { get; set; } = "all";

        /// <summary>
        /// Default grouping for reports ('vehicle', 'site', 'date')
        /// </summary>
        public string DefaultGrouping { get; set; } = "vehicle";

        /// <summary>
        /// When settings were last updated
        /// </summary>
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        #region Navigation Properties

        /// <summary>
        /// Navigation to the user
        /// </summary>
        public virtual User User { get; set; } = null!;

        #endregion
    }
}
