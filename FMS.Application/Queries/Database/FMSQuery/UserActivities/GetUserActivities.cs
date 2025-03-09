using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.UserActivies;

public class GetUserActivitiesQuery : IRequest<List<UserActivity>>
{
    public string UserID { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string Module { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;

    public GetUserActivitiesQuery(string userId, DateTime? startTime, DateTime? endTime, string module)
    {
        UserID = userId;
        StartTime = startTime;
        EndTime = endTime;
        Module = module;
    }
}

public class GetUserActivitiesQueryHandler : IRequestHandler<GetUserActivitiesQuery, List<UserActivity>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetUserActivitiesQueryHandler> _logger;

    public GetUserActivitiesQueryHandler(GpsdataContext context, ILogger<GetUserActivitiesQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<UserActivity>> Handle(GetUserActivitiesQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var query = _context.UserActivities.AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(request.UserID))
            {
                query = query.Where(x => x.UserId == request.UserID);
            }

            if (request.StartTime.HasValue)
            {
                query = query.Where(x => x.Timestamp >= request.StartTime.Value);
            }

            if (request.EndTime.HasValue)
            {
                query = query.Where(x => x.Timestamp <= request.EndTime.Value);
            }

            if (!string.IsNullOrEmpty(request.Module))
            {
                query = query.Where(x => x.Controller.Contains(request.Module));
            }

            // Apply pagination
            var activities = await query
                .OrderByDescending(x => x.Timestamp)
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync(cancellationToken);

            return activities;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user activities");
            throw;
        }
    }
}