using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.FMS.Issuetracker;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.IssueTrackerQueries
{
    public record GetIssueListQuery : IRequest<List<IssueTrackerResponseDTO>>;

    public class GetIssueListQueryHandler : IRequestHandler<GetIssueListQuery, List<IssueTrackerResponseDTO>>
    {

        private readonly GpsdataContext _context;
        private readonly ILogger<GetIssueListQueryHandler> _logger;

        public GetIssueListQueryHandler(GpsdataContext context, ILogger<GetIssueListQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<IssueTrackerResponseDTO>> Handle(GetIssueListQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var issueTrackers = await _context.Issuetrackers
                    .Include(x => x.AssignToNavigation)
                    .Include(x => x.Site)
                    .Include(x => x.StatusNavigation)
                    .Include(x => x.OpenbyNavigation)
                    .Include(x => x.PriorityNavigation)
                    .Include(x => x.IssueCategory)
                    .Include(x => x.Vehicle)
                    //.Include (x => x.DeviceTypeNavigation)
                    .Select(issue => new IssueTrackerResponseDTO
                    {
                        Id = issue.Id,
                        ProblemTitle = issue.ProblemTitle,
                        ProblemDescription = issue.ProblemDescription,
                        OpenDate = issue.OpenDate,
                        DueDate = issue.DueDate,
                        ClosingDate = issue.ClosingDate,
                        LastModfield = issue.LastModfield,
                        RelatedIssue = issue.RelatedIssue,

                        // Category information
                        IssueCategoryId = issue.IssueCategoryId,
                        CategoryName = issue.IssueCategory != null ? issue.IssueCategory.Name : "",

                        // Site information
                        SiteId = issue.SiteId,
                        SiteName = issue.Site != null ? issue.Site.Name : "",

                        // Status information
                        Status = issue.Status,
                        StatusName = issue.StatusNavigation != null ? issue.StatusNavigation.Status : "",

                        // Priority information
                        Priority = issue.Priority,
                        PriorityName = issue.PriorityNavigation != null ? issue.PriorityNavigation.Name : "",

                        // Vehicle information
                        VehicleId = issue.VehicleId,
                        VehicleNumber = issue.Vehicle != null ? issue.Vehicle.NumberPlate : "",
                        VehicleCode = issue.Vehicle != null ? issue.Vehicle.VehicleCode : "",

                        // User information - using names instead of IDs
                        OpenbyId = issue.Openby ?? "",
                        OpenbyUserName = issue.OpenbyNavigation != null ? issue.OpenbyNavigation.UserName : "",
                        OpenbyEmail = issue.OpenbyNavigation != null ? issue.OpenbyNavigation.Email : "",

                        AssignToId = issue.AssignTo ?? "",
                        AssignToUserName = issue.AssignToNavigation != null ? issue.AssignToNavigation.UserName : "",
                        AssignToEmail = issue.AssignToNavigation != null ? issue.AssignToNavigation.Email : "",

                        // Notes
                        CompletionNotes = issue.CompletionNotes,
                        ClosingNotes = issue.ClosingNotes,

                        //// Device information (optional)
                        //DeviceId = issue.DeviceId,
                        //DeviceType = issue.DeviceType,
                        //DeviceTypeName = issue.DeviceTypeNavigation != null ? issue.DeviceTypeNavigation.Name : ""
                    })
                    .ToListAsync(cancellationToken);

                var issueIds = issueTrackers
                    .Select(issue => issue.Id)
                    .ToList();

                var issueTagLookup = await GetIssueTagNameLookupAsync(issueIds, cancellationToken);

                foreach (var issue in issueTrackers)
                {
                    if (!issueTagLookup.TryGetValue(issue.Id, out var tagNames) || tagNames.Count == 0)
                    {
                        continue;
                    }

                    issue.IssueCategoryTagNames = tagNames;
                    issue.CategoryName = string.Join(", ", tagNames);
                }

                var assignmentRows = await (
                    from assignment in _context.Issueassignmenttrackers
                    join user in _context.Users on assignment.AssignedTo equals user.Id
                    where issueIds.Contains(assignment.Issue)
                    select new
                    {
                        IssueId = assignment.Issue,
                        UserId = user.Id,
                        UserName = user.UserName,
                        UserEmail = user.Email,
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

                foreach (var issue in issueTrackers)
                {
                    if (!assignmentLookup.TryGetValue(issue.Id, out var assignees) || assignees.Count == 0)
                    {
                        issue.AssignToIds = issue.AssignToId;
                        issue.AssignToUserNames = issue.AssignToUserName;
                        continue;
                    }

                    issue.AssignToIds = string.Join(",", assignees.Select(row => row.UserId).Distinct());
                    issue.AssignToUserNames = string.Join(", ", assignees
                        .Select(row => row.UserName)
                        .Where(userName => !string.IsNullOrWhiteSpace(userName))
                        .Distinct());

                    var primaryAssignee = assignees.FirstOrDefault();
                    if (primaryAssignee != null)
                    {
                        issue.AssignToId = primaryAssignee.UserId ?? issue.AssignToId;
                        issue.AssignToUserName = primaryAssignee.UserName ?? issue.AssignToUserName;
                        issue.AssignToEmail = primaryAssignee.UserEmail ?? issue.AssignToEmail;
                    }
                }

                return issueTrackers;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching issue trackers");
                throw new Exception(ex.Message);
            }
        }

        private async Task<Dictionary<int, List<string>>> GetIssueTagNameLookupAsync(List<int> issueIds, CancellationToken cancellationToken)
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

                    if (!lookup.TryGetValue(issueId, out var tagNames))
                    {
                        tagNames = new List<string>();
                        lookup[issueId] = tagNames;
                    }

                    if (!tagNames.Contains(tagName, StringComparer.OrdinalIgnoreCase))
                    {
                        tagNames.Add(tagName);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Issue tag lookup failed. Falling back to legacy category names.");
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