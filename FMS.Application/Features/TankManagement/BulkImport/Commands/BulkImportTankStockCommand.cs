using System.Collections.Generic;
using FMS.Application.Common;
using FMS.Application.Features.TankManagement.BulkImport.DTOs;
using MediatR;

namespace FMS.Application.Features.TankManagement.BulkImport.Commands
{
    /// <summary>
    /// Command to bulk import tank stock data from Excel
    /// </summary>
    public record BulkImportTankStockCommand : IRequest<FMSResponse<BulkImportResponseDTO>>
    {
        /// <summary>
        /// List of rows from the Excel file
        /// </summary>
        public List<BulkImportRowDTO> Entries { get; init; } = new List<BulkImportRowDTO>();

        /// <summary>
        /// If true, only validates without importing
        /// </summary>
        public bool ValidateOnly { get; init; }

        /// <summary>
        /// How to handle duplicate entries (Skip or Replace)
        /// </summary>
        public DuplicateHandlingMode DuplicateHandling { get; init; } = DuplicateHandlingMode.Skip;

        /// <summary>
        /// User ID performing the import (for audit)
        /// </summary>
        public string UserId { get; init; } = string.Empty;

        /// <summary>
        /// Optional: Station ID context
        /// </summary>
        public int? StationId { get; init; }

        /// <summary>
        /// Whether to proceed even with warnings
        /// </summary>
        public bool IgnoreWarnings { get; init; }

        /// <summary>
        /// Whether to skip validation checks (controlled by system configuration)
        /// </summary>
        public bool SkipValidation { get; init; }
    }

    /// <summary>
    /// Modes for handling duplicate entries
    /// </summary>
    public enum DuplicateHandlingMode
    {
        /// <summary>
        /// Skip duplicate rows, keep existing data
        /// </summary>
        Skip,

        /// <summary>
        /// Replace existing data with new values
        /// </summary>
        Replace
    }
}
