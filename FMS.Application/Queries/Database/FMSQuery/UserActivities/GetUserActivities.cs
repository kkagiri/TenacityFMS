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

    public int PageNumber { get; set; } =1;

    public int PageSize { get; set; } = 10;

    public DateTime StartTime { get; set; }

    public DateTime EndTime { get; set; }

}

public class GetUserActivitiesQueryHandler: IRequestHandler<GetUserActivitiesQuery, List<UserActivity>>
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
            var userActivities = await _context.UserActivities
                .Where(x => x.UserId == request.UserID && x.Timestamp >= request.StartTime && x.Timestamp <= request.EndTime)
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync(cancellationToken);

            return userActivities;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user activities");
            throw;
        }
      
    }
}