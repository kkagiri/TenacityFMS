using System;

namespace FMS.Application.ModelsDTOs.FMS.Issuetracker {
    public class IssueTrackerResponseDTO {
        public int Id { get; set; }
        public string ProblemTitle { get; set; } = string.Empty;
        public string ProblemDescription { get; set; } = string.Empty;
        public DateTime? OpenDate { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime? ClosingDate { get; set; }
        public DateTime? LastModfield { get; set; }
        public int? RelatedIssue { get; set; }

        // Category information
        public int IssueCategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;

        // Site information
        public int SiteId { get; set; }
        public string SiteName { get; set; } = string.Empty;

        // Status information
        public int? Status { get; set; }
        public string StatusName { get; set; } = string.Empty;

        // Priority information
        public int? Priority { get; set; }
        public string PriorityName { get; set; } = string.Empty;

        // Vehicle information
        public int VehicleId { get; set; }
        public string VehicleNumber { get; set; } = string.Empty;
        public string VehicleHyoungNo { get; set; } = string.Empty;

        // User information - using names instead of IDs
        public string OpenbyId { get; set; } = string.Empty;
        public string OpenbyUserName { get; set; } = string.Empty;
        public string OpenbyEmail { get; set; } = string.Empty;

        public string AssignToId { get; set; } = string.Empty;
        public string AssignToUserName { get; set; } = string.Empty;
        public string AssignToEmail { get; set; } = string.Empty;

        // Device information (optional)
        public int? DeviceId { get; set; }
        public int? DeviceType { get; set; }
        public string DeviceTypeName { get; set; } = string.Empty;
    }
}