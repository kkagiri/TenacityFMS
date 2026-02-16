/*
 * File: GetUserIssuesDashboardQuery.cs
 * Purpose: Query to get comprehensive issue dashboard data for the current user
 * Dependencies: MediatR, GpsdataContext, AutoMapper
 * Last Modified: 2026-02-05
 *
 * Key Functions:
 * - GetUserIssuesDashboardQuery: Returns issue statistics and lists for the logged-in user
 * - Supports filtering by week, vehicle, site, and category
 */
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.FMS.Issuetracker;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.IssueTracker.Queries
{
    public class UserIssuesDashboardRequest
    {
        public string UserId { get; set; } = string.Empty;
        public int? VehicleId { get; set; }
        public int? SiteId { get; set; }
        public int? CategoryId { get; set; }
        public int? WeeksBack { get; set; } // Filter by last N weeks
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }

    public class UserIssuesDashboardDto
    {
        // Summary Statistics
        public int TotalAssignedIssues { get; set; }
        public int OpenIssues { get; set; }
        public int ClosedIssues { get; set; }
        public int InProgressIssues { get; set; }
        public int HighPriorityIssues { get; set; }
        public int OverdueIssues { get; set; }

        // Issues opened by the user
        public int TotalOpenedByMe { get; set; }
        public int OpenedByMeOpen { get; set; }
        public int OpenedByMeClosed { get; set; }

        // Breakdown by time periods
        public List<IssuesByPeriodDto> IssuesByWeek { get; set; } = new();

        // Breakdown by category
        public List<IssuesByCategoryDto> IssuesByCategory { get; set; } = new();

        // Breakdown by vehicle
        public List<IssuesByVehicleDto> IssuesByVehicle { get; set; } = new();

        // Breakdown by site
        public List<IssuesBySiteDto> IssuesBySite { get; set; } = new();

        // Issue lists
        public List<IssueTrackerResponseDTO> AssignedIssues { get; set; } = new();
        public List<IssueTrackerResponseDTO> OpenedByMeIssues { get; set; } = new();
        public List<IssueTrackerResponseDTO> RecentlyClosedIssues { get; set; } = new();
    }

    public class IssuesByPeriodDto
    {
        public string Period { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int OpenedCount { get; set; }
        public int ClosedCount { get; set; }
        public int AssignedCount { get; set; }
    }

    public class IssuesByCategoryDto
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public int TotalCount { get; set; }
        public int OpenCount { get; set; }
        public int ClosedCount { get; set; }
    }

    public class IssuesByVehicleDto
    {
        public int VehicleId { get; set; }
        public string VehicleName { get; set; } = string.Empty;
        public string HyoungNo { get; set; } = string.Empty;
        public int TotalCount { get; set; }
        public int OpenCount { get; set; }
        public int ClosedCount { get; set; }
    }

    public class IssuesBySiteDto
    {
        public int SiteId { get; set; }
        public string SiteName { get; set; } = string.Empty;
        public int TotalCount { get; set; }
        public int OpenCount { get; set; }
        public int ClosedCount { get; set; }
    }

    public record GetUserIssuesDashboardQuery(UserIssuesDashboardRequest Request) : IRequest<FMSResponse<UserIssuesDashboardDto>>;

    public class GetUserIssuesDashboardQueryHandler : IRequestHandler<GetUserIssuesDashboardQuery, FMSResponse<UserIssuesDashboardDto>>
    {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<GetUserIssuesDashboardQueryHandler> _logger;

        public GetUserIssuesDashboardQueryHandler(
            GpsdataContext context,
            IMapper mapper,
            ILogger<GetUserIssuesDashboardQueryHandler> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<FMSResponse<UserIssuesDashboardDto>> Handle(GetUserIssuesDashboardQuery query, CancellationToken cancellationToken)
        {
            try
            {
                var request = query.Request;

                if (string.IsNullOrEmpty(request.UserId))
                {
                    return FMSResponse<UserIssuesDashboardDto>.Failed("User ID is required.");
                }

                // Calculate date range
                var endDate = request.EndDate ?? DateTime.UtcNow;
                var startDate = request.StartDate ?? (request.WeeksBack.HasValue
                    ? endDate.AddDays(-7 * request.WeeksBack.Value)
                    : endDate.AddMonths(-3)); // Default to last 3 months

                // Fetch all statuses to determine open/closed
                var statuses = await _context.Issuestatuses.ToListAsync(cancellationToken);
                var closedStatusIds = statuses
                    .Where(s => s.Status != null && (
                        s.Status.ToLower().Contains("closed") ||
                        s.Status.ToLower().Contains("complete") ||
                        s.Status.ToLower().Contains("resolved") ||
                        s.Status.ToLower().Contains("done")))
                    .Select(s => s.Id)
                    .ToList();

                var inProgressStatusIds = statuses
                    .Where(s => s.Status != null && (
                        s.Status.ToLower().Contains("progress") ||
                        s.Status.ToLower().Contains("working")))
                    .Select(s => s.Id)
                    .ToList();

                var assignedIssueIds = await _context.Issueassignmenttrackers
                    .Where(a => a.AssignedTo == request.UserId)
                    .Select(a => a.Issue)
                    .Distinct()
                    .ToListAsync(cancellationToken);

                // Build base query for assigned issues
                var assignedQuery = _context.Issuetrackers
                    .Where(i => i.AssignTo == request.UserId || assignedIssueIds.Contains(i.Id));

                // Build base query for issues opened by user
                var openedByMeQuery = _context.Issuetrackers
                    .Where(i => i.Openby == request.UserId);

                // Apply filters
                if (request.VehicleId.HasValue)
                {
                    assignedQuery = assignedQuery.Where(i => i.VehicleId == request.VehicleId.Value);
                    openedByMeQuery = openedByMeQuery.Where(i => i.VehicleId == request.VehicleId.Value);
                }

                if (request.SiteId.HasValue)
                {
                    assignedQuery = assignedQuery.Where(i => i.SiteId == request.SiteId.Value);
                    openedByMeQuery = openedByMeQuery.Where(i => i.SiteId == request.SiteId.Value);
                }

                if (request.CategoryId.HasValue)
                {
                    assignedQuery = assignedQuery.Where(i => i.IssueCategoryId == request.CategoryId.Value);
                    openedByMeQuery = openedByMeQuery.Where(i => i.IssueCategoryId == request.CategoryId.Value);
                }

                // Fetch assigned issues
                var assignedIssues = await assignedQuery
                    .Include(i => i.IssueCategory)
                    .Include(i => i.StatusNavigation)
                    .Include(i => i.PriorityNavigation)
                    .Include(i => i.Vehicle)
                    .Include(i => i.Site)
                    .OrderByDescending(i => i.OpenDate)
                    .ToListAsync(cancellationToken);

                // Fetch issues opened by user
                var openedByMe = await openedByMeQuery
                    .Include(i => i.IssueCategory)
                    .Include(i => i.StatusNavigation)
                    .Include(i => i.PriorityNavigation)
                    .Include(i => i.Vehicle)
                    .Include(i => i.Site)
                    .OrderByDescending(i => i.OpenDate)
                    .ToListAsync(cancellationToken);

                // Fetch high priority
                var highPriorities = await _context.Issuepriorities
                    .Where(p => p.Name != null && p.Name.ToLower().Contains("high"))
                    .Select(p => p.Id)
                    .ToListAsync(cancellationToken);

                // Calculate statistics for assigned issues
                var openAssigned = assignedIssues.Where(i => !closedStatusIds.Contains(i.Status ?? 0)).ToList();
                var closedAssigned = assignedIssues.Where(i => closedStatusIds.Contains(i.Status ?? 0)).ToList();
                var inProgressAssigned = assignedIssues.Where(i => inProgressStatusIds.Contains(i.Status ?? 0)).ToList();
                var highPriorityAssigned = assignedIssues.Where(i => highPriorities.Contains(i.Priority ?? 0)).ToList();
                var overdueAssigned = openAssigned.Where(i => i.DueDate.HasValue && i.DueDate.Value < DateTime.UtcNow).ToList();

                // Calculate statistics for opened by me
                var openedByMeOpen = openedByMe.Where(i => !closedStatusIds.Contains(i.Status ?? 0)).ToList();
                var openedByMeClosed = openedByMe.Where(i => closedStatusIds.Contains(i.Status ?? 0)).ToList();

                // Build the dashboard DTO
                var issueTagLookup = await GetIssueTagNameLookupAsync(
                    assignedIssues.Select(i => i.Id).Concat(openedByMe.Select(i => i.Id)).Distinct().ToList(),
                    cancellationToken);

                var dashboardDto = new UserIssuesDashboardDto
                {
                    // Assigned statistics
                    TotalAssignedIssues = assignedIssues.Count,
                    OpenIssues = openAssigned.Count,
                    ClosedIssues = closedAssigned.Count,
                    InProgressIssues = inProgressAssigned.Count,
                    HighPriorityIssues = highPriorityAssigned.Count,
                    OverdueIssues = overdueAssigned.Count,

                    // Opened by me statistics
                    TotalOpenedByMe = openedByMe.Count,
                    OpenedByMeOpen = openedByMeOpen.Count,
                    OpenedByMeClosed = openedByMeClosed.Count,

                    // Issues by week
                    IssuesByWeek = GetIssuesByWeek(assignedIssues, openedByMe, closedStatusIds, startDate, endDate),

                    // Issues by category
                    IssuesByCategory = GetIssuesByCategory(assignedIssues, closedStatusIds, issueTagLookup),

                    // Issues by vehicle
                    IssuesByVehicle = GetIssuesByVehicle(assignedIssues, closedStatusIds),

                    // Issues by site
                    IssuesBySite = GetIssuesBySite(assignedIssues, closedStatusIds),

                    // Issue lists
                    AssignedIssues = MapToResponseDto(openAssigned.Take(20).ToList(), issueTagLookup),
                    OpenedByMeIssues = MapToResponseDto(openedByMeOpen.Take(20).ToList(), issueTagLookup),
                    RecentlyClosedIssues = MapToResponseDto(closedAssigned.Take(10).ToList(), issueTagLookup)
                };

                return FMSResponse<UserIssuesDashboardDto>.Success(dashboardDto, "Dashboard data loaded successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching user issues dashboard for user {UserId}", query.Request.UserId);
                return FMSResponse<UserIssuesDashboardDto>.Failed($"Error loading dashboard: {ex.Message}");
            }
        }

        private List<IssuesByPeriodDto> GetIssuesByWeek(
            List<Issuetracker> assignedIssues,
            List<Issuetracker> openedByMe,
            List<int> closedStatusIds,
            DateTime startDate,
            DateTime endDate)
        {
            var result = new List<IssuesByPeriodDto>();

            // Get Monday of the start week
            var currentDate = startDate.Date;
            while (currentDate.DayOfWeek != DayOfWeek.Monday)
                currentDate = currentDate.AddDays(-1);

            while (currentDate < endDate)
            {
                var weekStart = currentDate;
                var weekEnd = currentDate.AddDays(7);

                var weekAssigned = assignedIssues
                    .Where(i => i.OpenDate.HasValue && i.OpenDate.Value >= weekStart && i.OpenDate.Value < weekEnd)
                    .ToList();

                var weekOpened = openedByMe
                    .Where(i => i.OpenDate.HasValue && i.OpenDate.Value >= weekStart && i.OpenDate.Value < weekEnd)
                    .ToList();

                var weekClosed = assignedIssues
                    .Where(i => i.ClosingDate.HasValue && i.ClosingDate.Value >= weekStart && i.ClosingDate.Value < weekEnd)
                    .ToList();

                result.Add(new IssuesByPeriodDto
                {
                    Period = $"Week of {weekStart:MMM dd}",
                    StartDate = weekStart,
                    EndDate = weekEnd,
                    AssignedCount = weekAssigned.Count,
                    OpenedCount = weekOpened.Count,
                    ClosedCount = weekClosed.Count
                });

                currentDate = weekEnd;
            }

            return result.OrderByDescending(w => w.StartDate).Take(12).ToList();
        }

        private List<IssuesByCategoryDto> GetIssuesByCategory(
            List<Issuetracker> issues,
            List<int> closedStatusIds,
            Dictionary<int, List<string>> issueTagLookup)
        {
            return issues
                .Select(i => new
                {
                    Issue = i,
                    CategoryName = ResolveCategoryName(i, issueTagLookup)
                })
                .GroupBy(x => new { x.Issue.IssueCategoryId, x.CategoryName })
                .Select(g => new IssuesByCategoryDto
                {
                    CategoryId = g.Key.IssueCategoryId,
                    CategoryName = g.Key.CategoryName,
                    TotalCount = g.Count(),
                    OpenCount = g.Count(x => !closedStatusIds.Contains(x.Issue.Status ?? 0)),
                    ClosedCount = g.Count(x => closedStatusIds.Contains(x.Issue.Status ?? 0))
                })
                .OrderByDescending(c => c.TotalCount)
                .Take(10)
                .ToList();
        }

        private List<IssuesByVehicleDto> GetIssuesByVehicle(List<Issuetracker> issues, List<int> closedStatusIds)
        {
            return issues
                .Where(i => i.VehicleId > 0)
                .GroupBy(i => new
                {
                    i.VehicleId,
                    VehicleName = i.Vehicle?.NumberPlate ?? "Unknown",
                    HyoungNo = i.Vehicle?.HyoungNo ?? ""
                })
                .Select(g => new IssuesByVehicleDto
                {
                    VehicleId = g.Key.VehicleId,
                    VehicleName = g.Key.VehicleName,
                    HyoungNo = g.Key.HyoungNo,
                    TotalCount = g.Count(),
                    OpenCount = g.Count(i => !closedStatusIds.Contains(i.Status ?? 0)),
                    ClosedCount = g.Count(i => closedStatusIds.Contains(i.Status ?? 0))
                })
                .OrderByDescending(v => v.TotalCount)
                .Take(10)
                .ToList();
        }

        private List<IssuesBySiteDto> GetIssuesBySite(List<Issuetracker> issues, List<int> closedStatusIds)
        {
            return issues
                .Where(i => i.SiteId > 0)
                .GroupBy(i => new { i.SiteId, SiteName = i.Site?.Name ?? "Unknown" })
                .Select(g => new IssuesBySiteDto
                {
                    SiteId = g.Key.SiteId,
                    SiteName = g.Key.SiteName,
                    TotalCount = g.Count(),
                    OpenCount = g.Count(i => !closedStatusIds.Contains(i.Status ?? 0)),
                    ClosedCount = g.Count(i => closedStatusIds.Contains(i.Status ?? 0))
                })
                .OrderByDescending(s => s.TotalCount)
                .Take(10)
                .ToList();
        }

        private List<IssueTrackerResponseDTO> MapToResponseDto(
            List<Issuetracker> issues,
            Dictionary<int, List<string>> issueTagLookup)
        {
            return issues.Select(i => new IssueTrackerResponseDTO
            {
                Id = i.Id,
                ProblemTitle = i.ProblemTitle ?? string.Empty,
                ProblemDescription = i.ProblemDescription ?? string.Empty,
                OpenDate = i.OpenDate,
                DueDate = i.DueDate,
                ClosingDate = i.ClosingDate,
                LastModfield = i.LastModfield,
                RelatedIssue = i.RelatedIssue,
                IssueCategoryId = i.IssueCategoryId,
                CategoryName = ResolveCategoryName(i, issueTagLookup),
                IssueCategoryTagNames = issueTagLookup.TryGetValue(i.Id, out var tagNames)
                    ? tagNames
                    : new List<string>(),
                SiteId = i.SiteId,
                SiteName = i.Site?.Name ?? string.Empty,
                Status = i.Status,
                StatusName = i.StatusNavigation?.Status ?? string.Empty,
                Priority = i.Priority,
                PriorityName = i.PriorityNavigation?.Name ?? string.Empty,
                VehicleId = i.VehicleId,
                VehicleNumber = i.Vehicle?.NumberPlate ?? string.Empty,
                VehicleHyoungNo = i.Vehicle?.HyoungNo ?? string.Empty,
                OpenbyId = i.Openby ?? string.Empty,
                AssignToId = i.AssignTo ?? string.Empty,
                DeviceType = i.DeviceType
            }).ToList();
        }

        private static string ResolveCategoryName(Issuetracker issue, Dictionary<int, List<string>> issueTagLookup)
        {
            if (issueTagLookup.TryGetValue(issue.Id, out var tagNames) && tagNames.Count > 0)
            {
                return string.Join(", ", tagNames);
            }

            return issue.IssueCategory?.Name ?? string.Empty;
        }

        private async Task<Dictionary<int, List<string>>> GetIssueTagNameLookupAsync(
            List<int> issueIds,
            CancellationToken cancellationToken)
        {
            var lookup = new Dictionary<int, List<string>>();
            if (issueIds == null || issueIds.Count == 0)
            {
                return lookup;
            }

            var connection = _context.Database.GetDbConnection();
            var shouldCloseConnection = connection.State != ConnectionState.Open;

            if (shouldCloseConnection)
            {
                await connection.OpenAsync(cancellationToken);
            }

            try
            {
                await using var command = connection.CreateCommand();
                var parameterNames = new List<string>();
                for (var index = 0; index < issueIds.Count; index++)
                {
                    var parameterName = $"@issueId{index}";
                    parameterNames.Add(parameterName);

                    var parameter = command.CreateParameter();
                    parameter.ParameterName = parameterName;
                    parameter.Value = issueIds[index];
                    command.Parameters.Add(parameter);
                }

                command.CommandText = $@"
SELECT it.IssueID, ic.Name
FROM issuetracker_tags it
INNER JOIN issuecategory ic ON ic.ID = it.IssueCategoryID
WHERE it.IssueID IN ({string.Join(",", parameterNames)})
ORDER BY ic.Name";

                await using var reader = await command.ExecuteReaderAsync(cancellationToken);
                while (await reader.ReadAsync(cancellationToken))
                {
                    if (reader.IsDBNull(0) || reader.IsDBNull(1))
                    {
                        continue;
                    }

                    var issueId = reader.GetInt32(0);
                    var tagName = reader.GetString(1);

                    if (!lookup.TryGetValue(issueId, out var names))
                    {
                        names = new List<string>();
                        lookup[issueId] = names;
                    }

                    if (!names.Contains(tagName, StringComparer.OrdinalIgnoreCase))
                    {
                        names.Add(tagName);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Issue tag lookup failed in dashboard query. Falling back to legacy category names.");
            }
            finally
            {
                if (shouldCloseConnection)
                {
                    await connection.CloseAsync();
                }
            }

            return lookup;
        }
    }
}
