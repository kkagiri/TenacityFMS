/*
 * File: GetIssueListByIDQuery.cs
 * Purpose: Fetches issue detail by ID including category tags and assignment metadata.
 * Dependencies: MediatR, GpsdataContext, EF Core
 * Last Modified: 2026-02-14
 */
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

namespace FMS.Application.Queries.Database.FMSQuery.IssueTrackerQueries;

public record GetIssueListByIdQuery(int Id) : IRequest<IssueTrackerResponseDTO>;

public class GetIssueListByIDQueryHandler : IRequestHandler<GetIssueListByIdQuery, IssueTrackerResponseDTO>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetIssueListByIDQueryHandler> _logger;

    public GetIssueListByIDQueryHandler(GpsdataContext context, ILogger<GetIssueListByIDQueryHandler> logger)
    {
        _context = context;
        _logger = logger;

    }

    public async Task<IssueTrackerResponseDTO> Handle(GetIssueListByIdQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var issuetracker = await _context.Issuetrackers
                .Include(i => i.OpenbyNavigation)
                .Include(i => i.StatusNavigation)
                .Include(i => i.AssignToNavigation)
                .Include(i => i.PriorityNavigation)
                .Include(i => i.IssueCategory)
                .Include(i => i.Site)
                .Include(i => i.Vehicle)
                .Include(i => i.IssueTemplate)
                //.Include (i => i.DeviceTypeNavigation)
                .Where(i => i.Id == request.Id)
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
                    VehicleStatusValue = issue.Vehicle != null ? (int)issue.Vehicle.VehicleStatusValue : 0,

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

                    // V2 Template fields
                    IssueTemplateId = issue.IssueTemplateId,
                    TemplateName = issue.IssueTemplate != null ? issue.IssueTemplate.Name : null,
                    CanAutoClose = issue.CanAutoClose,
                    IsAutoCreated = issue.IsAutoCreated,

                    // Device information (optional)
                    //DeviceId = issue.DeviceId,
                    //DeviceType = issue.DeviceType,
                    //DeviceTypeName = issue.DeviceTypeNavigation != null ? issue.DeviceTypeNavigation.Name : ""
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (issuetracker != null)
            {
                var tagLookup = await GetIssueTagsAsync(issuetracker.Id, cancellationToken);
                issuetracker.IssueCategoryTags = tagLookup.tagIds;
                issuetracker.IssueCategoryTagNames = tagLookup.tagNames;

                if (string.IsNullOrWhiteSpace(issuetracker.CategoryName) && tagLookup.tagNames.Count > 0)
                {
                    issuetracker.CategoryName = tagLookup.tagNames[0];
                }

                var assignees = await (
                    from assignment in _context.Issueassignmenttrackers
                    join user in _context.Users on assignment.AssignedTo equals user.Id
                    where assignment.Issue == issuetracker.Id
                    orderby assignment.AssignedDate descending
                    select new
                    {
                        UserId = user.Id,
                        UserName = user.UserName,
                        UserEmail = user.Email
                    })
                    .ToListAsync(cancellationToken);

                if (assignees.Count > 0)
                {
                    issuetracker.AssignToIds = string.Join(",", assignees
                        .Select(row => row.UserId)
                        .Where(userId => !string.IsNullOrWhiteSpace(userId))
                        .Distinct());
                    issuetracker.AssignToUserNames = string.Join(", ", assignees
                        .Select(row => row.UserName)
                        .Where(userName => !string.IsNullOrWhiteSpace(userName))
                        .Distinct());

                    var primaryAssignee = assignees.FirstOrDefault();
                    if (primaryAssignee != null)
                    {
                        issuetracker.AssignToId = primaryAssignee.UserId ?? issuetracker.AssignToId;
                        issuetracker.AssignToUserName = primaryAssignee.UserName ?? issuetracker.AssignToUserName;
                        issuetracker.AssignToEmail = primaryAssignee.UserEmail ?? issuetracker.AssignToEmail;
                    }
                }
                else
                {
                    issuetracker.AssignToIds = issuetracker.AssignToId;
                    issuetracker.AssignToUserNames = issuetracker.AssignToUserName;
                }
            }

            if (issuetracker == null)
            {
                _logger.LogInformation("Issue with ID {IssueId} not found", request.Id);
                return null;
            }

            return issuetracker;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occured while getting issue tracker for issue ID {IssueId}", request.Id);
            throw;
        }
    }

    private async Task<(List<int> tagIds, List<string> tagNames)> GetIssueTagsAsync(int issueId, CancellationToken cancellationToken)
    {
        var tagIds = new List<int>();
        var tagNames = new List<string>();

        var connection = _context.Database.GetDbConnection();
        var shouldCloseConnection = connection.State != ConnectionState.Open;

        if (shouldCloseConnection)
        {
            await connection.OpenAsync(cancellationToken);
        }

        try
        {
            await using var command = connection.CreateCommand();
            command.CommandText = @"
SELECT ic.ID, ic.Name
FROM issuetracker_tags it
INNER JOIN issuecategory ic ON ic.ID = it.IssueCategoryID
WHERE it.IssueID = @issueId
ORDER BY ic.Name";

            var parameter = command.CreateParameter();
            parameter.ParameterName = "@issueId";
            parameter.Value = issueId;
            command.Parameters.Add(parameter);

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                if (!reader.IsDBNull(0))
                {
                    tagIds.Add(reader.GetInt32(0));
                }

                if (!reader.IsDBNull(1))
                {
                    tagNames.Add(reader.GetString(1));
                }
            }
        }
        finally
        {
            if (shouldCloseConnection)
            {
                await connection.CloseAsync();
            }
        }

        return (tagIds, tagNames);
    }
}