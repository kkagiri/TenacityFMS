using System;
using System.Collections.Generic;

namespace FMS.Application.Features.VehicleTracking.DTOs
{
    /// <summary>
    /// DTO for bulk assignment request
    /// </summary>
    public class BulkAssignmentRequestDTO
    {
        public int ProviderId { get; set; }
        public List<int> VehicleIds { get; set; } = new();
    }

    /// <summary>
    /// DTO for bulk assignment progress updates
    /// </summary>
    public class BulkAssignmentProgressDTO
    {
        public string JobId { get; set; } = string.Empty;
        public string Operation { get; set; } = string.Empty;
        public int? ProviderId { get; set; }
        public string? ProviderName { get; set; }
        public int TotalVehicles { get; set; }
        public int ProcessedVehicles { get; set; }
        public int SuccessCount { get; set; }
        public int FailCount { get; set; }
        public int ProgressPercentage { get; set; }
        public int EstimatedRemainingSeconds { get; set; }
        public bool IsComplete { get; set; }
        public List<string> Errors { get; set; } = new();
        public DateTime Timestamp { get; set; }
    }
}
