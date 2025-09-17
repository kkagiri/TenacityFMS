using System;

namespace FMS.Application.Features.FMS.Issuetracker {
    public class IssueTrackerDTO {
        public int Id { get; set; }
        public int IssueCategory { get; set; }
        public int Site { get; set; }
        public string Openby { get; set; }
        public int? RelatedIssue { get; set; }
        public string ProblemDescription { get; set; }
        public string ProblemTitle { get; set; }
        public int? Status { get; set; }
        public int? Priority { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime? OpenDate { get; set; }
        public DateTime? ClosingDate { get; set; }
        public DateTime? LastModfield { get; set; }
        public int Vehicle { get; set; }
        public int? Device { get; set; }
        public int? DeviceType { get; set; }
        public string AssignTo { get; set; }
    }
}