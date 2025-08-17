using System;

namespace FMS.Application.ModelsDTOs.FMS.TankStock {
    /// <summary>
    /// Result of opening stock validation with detailed information for better user guidance
    /// </summary>
    public class OpeningStockValidationResult {
        public bool Success { get; set; }
        public string Message { get; set; }
        public ValidationDetails Details { get; set; }
    }

    /// <summary>
    /// Detailed validation information for opening stock conflicts
    /// </summary>
    public class ValidationDetails {
        /// <summary>
        /// Date of the last opening stock that needs to be closed
        /// </summary>
        public DateTime LastOpeningStockDate { get; set; }

        /// <summary>
        /// Amount of the last opening stock that needs to be closed
        /// </summary>
        public decimal LastOpeningStockAmount { get; set; }

        /// <summary>
        /// ID of the tank
        /// </summary>
        public int TankId { get; set; }

        /// <summary>
        /// Name of the tank
        /// </summary>
        public string TankName { get; set; }

        /// <summary>
        /// Suggested action for the user
        /// </summary>
        public string SuggestedAction { get; set; }

        /// <summary>
        /// Type of validation error
        /// </summary>
        public string ErrorType { get; set; }
    }
}