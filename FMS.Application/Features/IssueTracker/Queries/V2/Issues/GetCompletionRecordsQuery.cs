/**
 * File: GetCompletionRecordsQuery.cs
 * Purpose: MediatR query for fetching structured completion records for an issue
 * Dependencies: MediatR, FMSResponse, IssueCompletionRecordDTO
 * Last Modified: 2026-02-21
 *
 * Key Queries:
 * - GetCompletionRecordsQuery: Returns all completion records for a given issue ID
 */
using System.Collections.Generic;
using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.DTOs.V2;
using MediatR;

namespace FMS.Application.Features.IssueTracker.Queries.V2.Issues
{
    /// <summary>
    /// Returns structured completion records for a given issue.
    /// Results are ordered by CompletedAt descending.
    /// </summary>
    public record GetCompletionRecordsQuery(int IssueId)
        : IRequest<FMSResponse<List<IssueCompletionRecordDTO>>>;
}
