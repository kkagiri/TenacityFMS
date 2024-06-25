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

public record GetIssueListByVehiceIdQuery(int VehicleId) : IRequest<List<Issuetracker>>;


public class GetIssueListByVehiceIdQueryHandler : IRequestHandler<GetIssueListByVehiceIdQuery, List<Issuetracker>>
{

    private readonly GpsdataContext _context;
    private readonly ILogger<GetIssueListByVehiceIdQueryHandler> _logger;

    public GetIssueListByVehiceIdQueryHandler(GpsdataContext context, ILogger<GetIssueListByVehiceIdQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }
    public async Task<List<Issuetracker>> Handle(GetIssueListByVehiceIdQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var issues = await _context.Issuetrackers
                       .Include(i => i.IssueCategory.Name)
                       .Include(x => x.OpenbyNavigation.Email)
                       .Include(x => x.StatusNavigation.Status)
                       .Include(x => x.AssignToNavigation.Email)
                       .Include(x => x.PriorityNavigation.Name)
                       .Include(x => x.Site.Name)
                       .Include(x => x.Vehicle.HyoungNo)

                .Where(i => i.VehicleId == request.VehicleId).ToListAsync(cancellationToken);

            return issues;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occured while getting issues list by vehicle id @{VehicleId}", request.VehicleId);
            throw new Exception(ex.Message);

        }
    }
}
  