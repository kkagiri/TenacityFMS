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

public record GetIssueListByVehiceIdQuery (int VehicleId) : IRequest<List<Issuetracker>>;

public class GetIssueListByVehiceIdQueryHandler : IRequestHandler<GetIssueListByVehiceIdQuery, List<Issuetracker>> {

    private readonly GpsdataContext _context;
    private readonly ILogger<GetIssueListByVehiceIdQueryHandler> _logger;

    public GetIssueListByVehiceIdQueryHandler (GpsdataContext context, ILogger<GetIssueListByVehiceIdQueryHandler> logger) {
        _context = context;
        _logger = logger;
    }
    public async Task<List<Issuetracker>> Handle (GetIssueListByVehiceIdQuery request, CancellationToken cancellationToken) {
        try {
            var issues = await _context.Issuetrackers
                .Include (i => i.IssueCategory)
                .Include (x => x.OpenbyNavigation)
                .Include (x => x.StatusNavigation)
                .Include (x => x.AssignToNavigation)
                .Include (x => x.PriorityNavigation)
                .Include (x => x.Site)
                .Include (x => x.Vehicle)
                .Where (i => i.VehicleId == request.VehicleId)
                .ToListAsync (cancellationToken);

            return issues;
        } catch (Exception ex) {
            _logger.LogError (ex, "An error occured while getting issues list by vehicle id @{VehicleId}", request.VehicleId);
            throw new Exception (ex.Message);
        }
    }
}