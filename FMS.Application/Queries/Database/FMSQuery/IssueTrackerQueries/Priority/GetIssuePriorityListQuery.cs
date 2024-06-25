using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.IssueTrackerQueries.Priority;

public record GetIssuePriorityListQuery : IRequest<List<Issuepriority>>;

public class GetIssuePriorityListQueryHandler : IRequestHandler<GetIssuePriorityListQuery, List<Issuepriority>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetIssuePriorityListQueryHandler> _logger; 

    public GetIssuePriorityListQueryHandler(GpsdataContext context, ILogger<GetIssuePriorityListQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<Issuepriority>> Handle(GetIssuePriorityListQuery request, CancellationToken cancellationToken)
    {
       try{
           var result = await _context.Issuepriorities.ToListAsync(cancellationToken);
           return result;
       }catch(Exception ex)

       {
           _logger.LogError(ex, "An error occured while getting issue priority list");
           throw new Exception(ex.Message);

       }
    }
}   