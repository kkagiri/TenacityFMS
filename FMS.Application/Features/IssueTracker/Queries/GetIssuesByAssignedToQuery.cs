using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.IssueTrackerQueries;
public record GetIssuesByAssignedToQuery(string AssignedToId) : IRequest<List<Issuetracker>>;

public class GetIssuesByAssignedToQueryHandler : IRequestHandler<GetIssuesByAssignedToQuery, List<Issuetracker>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<GetIssuesByAssignedToQueryHandler> _logger;
    public GetIssuesByAssignedToQueryHandler(GpsdataContext context, IMapper mapper, ILogger<GetIssuesByAssignedToQueryHandler> logger)
    {
        _mapper = mapper;
        _logger = logger;

        _context = context;
    }
    public async Task<List<Issuetracker>> Handle(GetIssuesByAssignedToQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var issues = await _context.Issuetrackers.Where(i => i.AssignTo == request.AssignedToId).ToListAsync(cancellationToken);
            return issues;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occured while getting issues by assigned to");
            throw new Exception(ex.Message);

        }
    }
}


