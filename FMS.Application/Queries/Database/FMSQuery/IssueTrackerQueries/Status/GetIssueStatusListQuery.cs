using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.IssueTrackerQueries.Status;

public record GetIssueStatusListQuery : IRequest<List<Issuestatus>>;

public class GetIssueStatusListQueryHandler : IRequestHandler<GetIssueStatusListQuery, List<Issuestatus>>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetIssueStatusListQueryHandler> _logger;

    public GetIssueStatusListQueryHandler(GpsdataContext context, ILogger<GetIssueStatusListQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<Issuestatus>> Handle(GetIssueStatusListQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _context.Issuestatuses.ToListAsync(cancellationToken);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occured while getting issue status list");
            throw new Exception(ex.Message);
        }
    }
}