/**
 * File: GetIssueTrackerReportQueryHandler.cs
 * Purpose: Executes Issue Tracker report query with filtering and pagination.
 * Dependencies: GpsdataContext, MediatR, EF Core, FMSResponse
 * Last Modified: 2026-02-12
 */
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.IssueTracker.Queries
{
    public class GetIssueTrackerReportQueryHandler : IRequestHandler<GetIssueTrackerReportQuery, FMSResponse<IssueTrackerReportResultDto>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetIssueTrackerReportQueryHandler> _logger;

        public GetIssueTrackerReportQueryHandler(
            GpsdataContext context,
            ILogger<GetIssueTrackerReportQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<IssueTrackerReportResultDto>> Handle(
            GetIssueTrackerReportQuery request,
            CancellationToken cancellationToken)
        {
            try
            {
                var pageNumber = request.PageNumber <= 0 ? 1 : request.PageNumber;
                var pageSize = request.PageSize <= 0 ? 200 : Math.Min(request.PageSize, 1000);

                IQueryable<global::FMS.Domain.Entities.Issuetracker> query = _context.Issuetrackers
                    .AsNoTracking();

                if (request.DateFrom.HasValue)
                {
                    var fromDateUtc = request.DateFrom.Value.Date;
                    query = query.Where(i => i.OpenDate.HasValue && i.OpenDate.Value >= fromDateUtc);
                }

                if (request.DateTo.HasValue)
                {
                    var toExclusiveUtc = request.DateTo.Value.Date.AddDays(1);
                    query = query.Where(i => i.OpenDate.HasValue && i.OpenDate.Value < toExclusiveUtc);
                }

                if (request.SiteIds is { Count: > 0 })
                {
                    query = query.Where(i => request.SiteIds.Contains(i.SiteId));
                }

                if (request.VehicleIds is { Count: > 0 })
                {
                    query = query.Where(i => request.VehicleIds.Contains(i.VehicleId));
                }

                if (request.IssueTemplateIds is { Count: > 0 })
                {
                    query = query.Where(i =>
                        i.IssueTemplateId.HasValue &&
                        request.IssueTemplateIds.Contains(i.IssueTemplateId.Value));
                }

                if (request.StatusIds is { Count: > 0 })
                {
                    query = query.Where(i =>
                        i.Status.HasValue &&
                        request.StatusIds.Contains(i.Status.Value));
                }

                if (request.CategoryIds is { Count: > 0 })
                {
                    query = query.Where(i => request.CategoryIds.Contains(i.IssueCategoryId));
                }

                var totalRecords = await query.CountAsync(cancellationToken);
                var totalPages = totalRecords == 0 ? 0 : (int)Math.Ceiling(totalRecords / (double)pageSize);
                var safePageNumber = totalPages == 0 ? 1 : Math.Min(pageNumber, totalPages);
                var skip = (safePageNumber - 1) * pageSize;

                var records = await query
                    .OrderByDescending(i => i.OpenDate ?? DateTime.MinValue)
                    .ThenByDescending(i => i.Id)
                    .Skip(skip)
                    .Take(pageSize)
                    .Select(i => new IssueTrackerReportRowDto
                    {
                        Id = i.Id,
                        OpenDate = i.OpenDate,
                        DueDate = i.DueDate,
                        ClosingDate = i.ClosingDate,
                        SiteId = i.SiteId,
                        SiteName = i.Site != null ? i.Site.Name : string.Empty,
                        VehicleId = i.VehicleId,
                        VehicleNumber = i.Vehicle != null ? i.Vehicle.NumberPlate : string.Empty,
                        VehicleHyoungNo = i.Vehicle != null ? i.Vehicle.HyoungNo : string.Empty,
                        IssueCategoryId = i.IssueCategoryId,
                        CategoryName = i.IssueCategory != null ? i.IssueCategory.Name : string.Empty,
                        Status = i.Status,
                        StatusName = i.StatusNavigation != null ? i.StatusNavigation.Status : string.Empty,
                        Priority = i.Priority,
                        PriorityName = i.PriorityNavigation != null ? i.PriorityNavigation.Name : string.Empty,
                        IssueTemplateId = i.IssueTemplateId,
                        TemplateName = i.IssueTemplate != null ? i.IssueTemplate.Name : string.Empty,
                        ProblemTitle = i.ProblemTitle,
                        ProblemDescription = i.ProblemDescription,
                        OpenbyId = i.Openby,
                        OpenbyUserName = _context.Users
                            .Where(u => u.Id == i.Openby)
                            .Select(u => u.UserName)
                            .FirstOrDefault() ?? string.Empty,
                        AssignToId = i.AssignTo,
                        AssignToUserName = _context.Users
                            .Where(u => u.Id == i.AssignTo)
                            .Select(u => u.UserName)
                            .FirstOrDefault() ?? string.Empty,
                        IsAutoCreated = i.IsAutoCreated,
                        CanAutoClose = i.CanAutoClose
                    })
                    .ToListAsync(cancellationToken);

                var recordIds = records
                    .Select(record => record.Id)
                    .ToList();

                var assignmentRows = await (
                    from assignment in _context.Issueassignmenttrackers.AsNoTracking()
                    join user in _context.Users.AsNoTracking() on assignment.AssignedTo equals user.Id
                    where recordIds.Contains(assignment.Issue)
                    select new
                    {
                        IssueId = assignment.Issue,
                        UserId = user.Id,
                        UserName = user.UserName,
                        AssignedDate = assignment.AssignedDate
                    })
                    .ToListAsync(cancellationToken);

                var assignmentLookup = assignmentRows
                    .GroupBy(row => row.IssueId)
                    .ToDictionary(
                        group => group.Key,
                        group => group
                            .OrderByDescending(row => row.AssignedDate)
                            .ToList());

                foreach (var record in records)
                {
                    if (!assignmentLookup.TryGetValue(record.Id, out var assignees) || assignees.Count == 0)
                    {
                        record.AssignToIds = record.AssignToId;
                        record.AssignToUserNames = record.AssignToUserName;
                        continue;
                    }

                    record.AssignToIds = string.Join(",", assignees
                        .Select(row => row.UserId)
                        .Where(userId => !string.IsNullOrWhiteSpace(userId))
                        .Distinct());
                    record.AssignToUserNames = string.Join(", ", assignees
                        .Select(row => row.UserName)
                        .Where(userName => !string.IsNullOrWhiteSpace(userName))
                        .Distinct());

                    var primaryAssignee = assignees.FirstOrDefault();
                    if (primaryAssignee != null)
                    {
                        record.AssignToId = primaryAssignee.UserId ?? record.AssignToId;
                        record.AssignToUserName = primaryAssignee.UserName ?? record.AssignToUserName;
                    }
                }

                var closedStatusIds = await _context.Issuestatuses
                    .AsNoTracking()
                    .Where(s =>
                        EF.Functions.Like(s.Status, "%closed%") ||
                        EF.Functions.Like(s.Status, "%resolved%") ||
                        EF.Functions.Like(s.Status, "%complete%"))
                    .Select(s => s.Id)
                    .ToListAsync(cancellationToken);

                var closedIssues = closedStatusIds.Count == 0
                    ? 0
                    : await query.CountAsync(i =>
                        i.Status.HasValue && closedStatusIds.Contains(i.Status.Value),
                        cancellationToken);

                var autoCreatedIssues = await query.CountAsync(i => i.IsAutoCreated, cancellationToken);

                var result = new IssueTrackerReportResultDto
                {
                    Records = records,
                    TotalRecords = totalRecords,
                    PageNumber = safePageNumber,
                    PageSize = pageSize,
                    TotalPages = totalPages,
                    OpenIssues = Math.Max(0, totalRecords - closedIssues),
                    ClosedIssues = closedIssues,
                    AutoCreatedIssues = autoCreatedIssues
                };

                return FMSResponse<IssueTrackerReportResultDto>.Success(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating Issue Tracker report data");
                return FMSResponse<IssueTrackerReportResultDto>.SystemError(
                    $"Failed to generate Issue Tracker report: {ex.Message}");
            }
        }
    }
}
