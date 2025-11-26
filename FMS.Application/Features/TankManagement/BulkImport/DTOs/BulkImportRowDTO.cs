using System;
using System.ComponentModel.DataAnnotations;

namespace FMS.Application.Features.TankManagement.BulkImport.DTOs
{
    /// <summary>
    /// Represents a single row from the bulk import Excel file
    /// </summary>
    public class BulkImportRowDTO
    {
        /// <summary>
        /// Tank name (used to lookup Tank by Name, case-insensitive)
        /// </summary>
        [Required(ErrorMessage = "Tank name is required")]
        public string TankName { get; set; } = string.Empty;

        /// <summary>
        /// Date for this stock entry
        /// </summary>
        [Required(ErrorMessage = "Date is required")]
        public DateTime Date { get; set; }

        /// <summary>
        /// Opening stock level in liters
        /// </summary>
        [Range(0, double.MaxValue, ErrorMessage = "Opening stock must be non-negative")]
        public decimal? Opening { get; set; }

        /// <summary>
        /// Dispensing volume in liters
        /// </summary>
        [Range(0, double.MaxValue, ErrorMessage = "Dispensing must be non-negative")]
        public decimal? Dispensing { get; set; }

        /// <summary>
        /// Transfer IN volume in liters (received from another tank)
        /// </summary>
        [Range(0, double.MaxValue, ErrorMessage = "Transfer IN must be non-negative")]
        public decimal? TransferIn { get; set; }

        /// <summary>
        /// Transfer OUT volume in liters (sent to another tank)
        /// </summary>
        [Range(0, double.MaxValue, ErrorMessage = "Transfer OUT must be non-negative")]
        public decimal? TransferOut { get; set; }

        /// <summary>
        /// Delivery volume in liters
        /// </summary>
        [Range(0, double.MaxValue, ErrorMessage = "Delivery must be non-negative")]
        public decimal? Delivery { get; set; }

        /// <summary>
        /// Closing stock level in liters
        /// </summary>
        [Range(0, double.MaxValue, ErrorMessage = "Closing stock must be non-negative")]
        public decimal? Closing { get; set; }

        /// <summary>
        /// Opening meter reading (optional but recommended for validation)
        /// </summary>
        public decimal? OpeningMeter { get; set; }

        /// <summary>
        /// Closing meter reading (optional but recommended for validation)
        /// </summary>
        public decimal? ClosingMeter { get; set; }

        /// <summary>
        /// Optional notes/comments
        /// </summary>
        public string? Notes { get; set; }

        /// <summary>
        /// Row number in Excel file (for error reporting)
        /// </summary>
        public int RowNumber { get; set; }

        /// <summary>
        /// Helper method to check if any transaction values are present
        /// </summary>
        public bool HasTransactions()
        {
            return Dispensing.HasValue || TransferIn.HasValue ||
                   TransferOut.HasValue || Delivery.HasValue;
        }

        /// <summary>
        /// Helper method to calculate net change
        /// </summary>
        public decimal CalculateNetChange()
        {
            var inflow = (TransferIn ?? 0) + (Delivery ?? 0);
            var outflow = (Dispensing ?? 0) + (TransferOut ?? 0);
            return inflow - outflow;
        }

        /// <summary>
        /// Helper method to calculate expected closing
        /// </summary>
        public decimal? CalculateExpectedClosing()
        {
            if (!Opening.HasValue) return null;
            return Opening.Value + CalculateNetChange();
        }
    }
}
