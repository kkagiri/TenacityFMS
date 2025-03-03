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

namespace FMS.Application.Queries.Database.FMSQuery.IssueTrackerQueries;

public record GetIssueListByIdQuery(int Id) : IRequest<Issuetracker>;

public class GetIssueListByIDQueryHandler : IRequestHandler<GetIssueListByIdQuery, Issuetracker>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetIssueListByIDQueryHandler> _logger;

    public GetIssueListByIDQueryHandler(GpsdataContext context, ILogger<GetIssueListByIDQueryHandler> logger)
    {
        _context = context;
        _logger = logger;

    }


    public async Task<Issuetracker> Handle(GetIssueListByIdQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var issuetrackers = await _context.Issuetrackers.
                                              Include(i => i.OpenbyNavigation.Email)
                                              .Include(i => i.StatusNavigation.Status)
                                              .Include(i => i.AssignToNavigation.Email)
                                              .Include(i => i.PriorityNavigation.Name)
                                .Where(i => i.Id == request.Id).FirstOrDefaultAsync(cancellationToken);

            return issuetrackers;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occured while getting issue tracker");
            throw new Exception(ex.ToString());
        }
    }
}

