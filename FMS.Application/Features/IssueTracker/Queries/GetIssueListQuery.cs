using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.IssueTrackerQueries {
    public record GetIssueListQuery : IRequest<List<Issuetracker>>;

    public class GetIssueListQueryHandler : IRequestHandler<GetIssueListQuery, List<Issuetracker>> {

        private readonly GpsdataContext _context;
        private readonly ILogger<GetIssueListQueryHandler> _logger;

        public GetIssueListQueryHandler (GpsdataContext context, ILogger<GetIssueListQueryHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<List<Issuetracker>> Handle (GetIssueListQuery request, CancellationToken cancellationToken) {
            try {
                var issueTrackers = await _context.Issuetrackers
                    .Include (x => x.AssignToNavigation)
                    .Include (x => x.Site)
                    .Include (x => x.StatusNavigation)
                    .Include (x => x.OpenbyNavigation)
                    .Include (x => x.PriorityNavigation)
                    .Include (x => x.IssueCategory)
                    .Include (x => x.Vehicle)
                    .Include (x => x.DeviceTypeNavigation)
                    .ToListAsync (cancellationToken);

                return issueTrackers;
            } catch (Exception ex) {
                _logger.LogError (ex, "Error fetching issue trackers");
                throw new Exception (ex.Message);
            }
        }
    }
}