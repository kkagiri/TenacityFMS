/**
 * File: IssueTrackerReportResultDto.cs
 * Purpose: Paged Issue Tracker report payload and summary metadata.
 * Dependencies: IssueTrackerReportRowDto
 * Last Modified: 2026-02-12
 */
using System.Collections.Generic;

namespace FMS.Application.Features.IssueTracker.DTOs
{
    public class IssueTrackerReportResultDto
    {
        public List<IssueTrackerReportRowDto> Records { get; set; } = new List<IssueTrackerReportRowDto>();
        public int TotalRecords { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public int OpenIssues { get; set; }
        public int ClosedIssues { get; set; }
        public int AutoCreatedIssues { get; set; }
    }
}
