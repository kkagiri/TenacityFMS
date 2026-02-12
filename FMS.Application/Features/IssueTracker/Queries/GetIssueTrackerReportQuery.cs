/**
 * File: GetIssueTrackerReportQuery.cs
 * Purpose: Encapsulates filters and pagination for Issue Tracker reporting.
 * Dependencies: MediatR, FMSResponse, IssueTrackerReportResultDto
 * Last Modified: 2026-02-12
 */
using System;
using System.Collections.Generic;
using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.DTOs;
using MediatR;

namespace FMS.Application.Features.IssueTracker.Queries
{
    public class GetIssueTrackerReportQuery : IRequest<FMSResponse<IssueTrackerReportResultDto>>
    {
        public DateTime? DateFrom { get; set; }
        public DateTime? DateTo { get; set; }
        public List<int>? SiteIds { get; set; }
        public List<int>? VehicleIds { get; set; }
        public List<int>? IssueTemplateIds { get; set; }
        public List<int>? StatusIds { get; set; }
        public List<int>? CategoryIds { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 200;
    }
}
