/**
 * File: GetLinkedIssuesQuery.cs
 * Purpose: Query to get issues linked by the same template
 * Dependencies: MediatR, GpsdataContext
 * Last Modified: 2026-02-05
 */
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Data;
using FMS.Application.Common;
using FMS.Application.Features.FMS.Issuetracker;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.IssueTracker.Queries
{
    public record GetLinkedIssuesQuery(int IssueId, string? MatchBy = null, int? TagId = null) : IRequest<FMSResponse<List<IssueTrackerResponseDTO>>>;

    public class GetLinkedIssuesQueryHandler
        : IRequestHandler<GetLinkedIssuesQuery, FMSResponse<List<IssueTrackerResponseDTO>>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetLinkedIssuesQueryHandler> _logger;

        public GetLinkedIssuesQueryHandler(GpsdataContext context, ILogger<GetLinkedIssuesQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<List<IssueTrackerResponseDTO>>> Handle(
            GetLinkedIssuesQuery request, CancellationToken cancellationToken)
        {
            // First get the current issue to find its template
            var currentIssue = await _context.Issuetrackers
                .FirstOrDefaultAsync(i => i.Id == request.IssueId, cancellationToken);

            if (currentIssue == null)
            {
                return FMSResponse<List<IssueTrackerResponseDTO>>.Failed("Issue not found");
            }

            // Get issues matching the selected mode (excluding current issue)
            var query = _context.Issuetrackers
                .Where(i => i.Id != request.IssueId);

            var normalizedMatchBy = (request.MatchBy ?? string.Empty).Trim().ToLowerInvariant();

            if (normalizedMatchBy == "vehicle")
            {
                query = query.Where(i => i.VehicleId == currentIssue.VehicleId);
            }
            else if (normalizedMatchBy == "template")
            {
                if (currentIssue.IssueTemplateId.HasValue)
                {
                    query = query.Where(i => i.IssueTemplateId == currentIssue.IssueTemplateId);
                }
                else
                {
                    return FMSResponse<List<IssueTrackerResponseDTO>>.Success(new List<IssueTrackerResponseDTO>());
                }
            }
            else if (normalizedMatchBy == "tag")
            {
                var currentIssueTagIds = await GetIssueTagIdsAsync(request.IssueId, cancellationToken);
                var selectedTagId = request.TagId ?? currentIssueTagIds.FirstOrDefault();

                if (selectedTagId <= 0)
                {
                    selectedTagId = currentIssue.IssueCategoryId;
                }

                if (selectedTagId > 0)
                {
                    var issueIdsByTag = await GetIssueIdsByTagIdAsync(selectedTagId, cancellationToken);
                    query = query.Where(i => i.IssueCategoryId == selectedTagId || issueIdsByTag.Contains(i.Id));
                }
                else
                {
                    return FMSResponse<List<IssueTrackerResponseDTO>>.Success(new List<IssueTrackerResponseDTO>());
                }
            }
            else
            {
                // Legacy fallback: template if available, else category
                if (currentIssue.IssueTemplateId.HasValue)
                {
                    query = query.Where(i => i.IssueTemplateId == currentIssue.IssueTemplateId);
                }
                else
                {
                    query = query.Where(i => i.IssueCategoryId == currentIssue.IssueCategoryId);
                }
            }

            var linkedIssues = await query
                .OrderByDescending(i => i.OpenDate)
                .Take(50)
                .Select(i => new IssueTrackerResponseDTO
                {
                    Id = i.Id,
                    ProblemTitle = i.ProblemTitle,
                    ProblemDescription = i.ProblemDescription,
                    IssueCategoryId = i.IssueCategoryId,
                    CategoryName = i.IssueCategory != null ? i.IssueCategory.Name : null,
                    Status = i.Status,
                    StatusName = i.StatusNavigation != null ? i.StatusNavigation.Status : null,
                    Priority = i.Priority,
                    PriorityName = i.PriorityNavigation != null ? i.PriorityNavigation.Name : null,
                    OpenDate = i.OpenDate,
                    DueDate = i.DueDate,
                    ClosingDate = i.ClosingDate,
                    VehicleId = i.VehicleId,
                    VehicleCode = i.Vehicle != null ? i.Vehicle.VehicleCode : null,
                    SiteId = i.SiteId,
                    SiteName = i.Site != null ? i.Site.Name : null,
                    AssignToUserName = i.AssignToNavigation != null ? i.AssignToNavigation.UserName : null,
                    OpenbyUserName = i.OpenbyNavigation != null ? i.OpenbyNavigation.UserName : null,
                    IssueTemplateId = i.IssueTemplateId,
                    TemplateName = i.IssueTemplate != null ? i.IssueTemplate.Name : null
                })
                .ToListAsync(cancellationToken);

            return FMSResponse<List<IssueTrackerResponseDTO>>.Success(linkedIssues);
        }

        private async Task<List<int>> GetIssueTagIdsAsync(int issueId, CancellationToken cancellationToken)
        {
            var tagIds = new List<int>();
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
SELECT DISTINCT it.IssueCategoryID
FROM issuetracker_tags it
WHERE it.IssueID = @issueId";

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
                }
            }
            finally
            {
                if (shouldCloseConnection)
                {
                    await connection.CloseAsync();
                }
            }

            return tagIds;
        }

        private async Task<List<int>> GetIssueIdsByTagIdAsync(int tagId, CancellationToken cancellationToken)
        {
            var issueIds = new List<int>();
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
SELECT DISTINCT it.IssueID
FROM issuetracker_tags it
WHERE it.IssueCategoryID = @tagId";

                var parameter = command.CreateParameter();
                parameter.ParameterName = "@tagId";
                parameter.Value = tagId;
                command.Parameters.Add(parameter);

                await using var reader = await command.ExecuteReaderAsync(cancellationToken);
                while (await reader.ReadAsync(cancellationToken))
                {
                    if (!reader.IsDBNull(0))
                    {
                        issueIds.Add(reader.GetInt32(0));
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

            return issueIds;
        }
    }
}
