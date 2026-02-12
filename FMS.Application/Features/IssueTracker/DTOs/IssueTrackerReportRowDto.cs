/**
 * File: IssueTrackerReportRowDto.cs
 * Purpose: Row model for Issue Tracker report output.
 * Dependencies: None
 * Last Modified: 2026-02-12
 */
using System;

namespace FMS.Application.Features.IssueTracker.DTOs
{
    public class IssueTrackerReportRowDto
    {
        public int Id { get; set; }
        public DateTime? OpenDate { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime? ClosingDate { get; set; }
        public int SiteId { get; set; }
        public string SiteName { get; set; } = string.Empty;
        public int VehicleId { get; set; }
        public string VehicleNumber { get; set; } = string.Empty;
        public string VehicleHyoungNo { get; set; } = string.Empty;
        public int IssueCategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public int? Status { get; set; }
        public string StatusName { get; set; } = string.Empty;
        public int? Priority { get; set; }
        public string PriorityName { get; set; } = string.Empty;
        public int? IssueTemplateId { get; set; }
        public string TemplateName { get; set; } = string.Empty;
        public string ProblemTitle { get; set; } = string.Empty;
        public string ProblemDescription { get; set; } = string.Empty;
        public string OpenbyId { get; set; } = string.Empty;
        public string OpenbyUserName { get; set; } = string.Empty;
        public string AssignToId { get; set; } = string.Empty;
        public string AssignToUserName { get; set; } = string.Empty;
        public string AssignToIds { get; set; } = string.Empty;
        public string AssignToUserNames { get; set; } = string.Empty;
        public bool IsAutoCreated { get; set; }
        public bool CanAutoClose { get; set; }
    }
}
