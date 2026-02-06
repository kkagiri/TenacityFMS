/**
 * File: GetIssueActivitiesQuery.cs
 * Purpose: Query to get activity log for an issue
 * Dependencies: MediatR, GpsdataContext
 * Last Modified: 2026-02-05
 */
using System.Collections.Generic;
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
    public record GetIssueActivitiesQuery(int IssueId, int? Limit = null)
        : IRequest<FMSResponse<List<IssueActivityLogDTO>>>;

    public class GetIssueActivitiesQueryHandler
        : IRequestHandler<GetIssueActivitiesQuery, FMSResponse<List<IssueActivityLogDTO>>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetIssueActivitiesQueryHandler> _logger;

        public GetIssueActivitiesQueryHandler(GpsdataContext context, ILogger<GetIssueActivitiesQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<List<IssueActivityLogDTO>>> Handle(
            GetIssueActivitiesQuery request, CancellationToken cancellationToken)
        {
            var query = _context.IssueActivityLogs
                .Where(a => a.IssueId == request.IssueId)
                .OrderByDescending(a => a.ActivityDate)
                .Select(a => new IssueActivityLogDTO
                {
                    Id = a.Id,
                    IssueId = a.IssueId,
                    ActivityType = a.ActivityType,
                    FieldName = a.FieldName,
                    OldValue = a.OldValue,
                    NewValue = a.NewValue,
                    Description = a.Description,
                    PerformedBy = a.PerformedBy,
                    PerformedByUserName = a.PerformedByUserName,
                    ActivityDate = a.ActivityDate,
                    Metadata = a.Metadata
                });

            if (request.Limit.HasValue && request.Limit.Value > 0)
            {
                query = (IOrderedQueryable<IssueActivityLogDTO>)query.Take(request.Limit.Value);
            }

            var activities = await query.ToListAsync(cancellationToken);

            return FMSResponse<List<IssueActivityLogDTO>>.Success(activities);
        }
    }
}
