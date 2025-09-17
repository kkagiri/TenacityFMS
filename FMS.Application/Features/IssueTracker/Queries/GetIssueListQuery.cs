using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.FMS.Issuetracker;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.IssueTrackerQueries {
    public record GetIssueListQuery : IRequest<List<IssueTrackerResponseDTO>>;

    public class GetIssueListQueryHandler : IRequestHandler<GetIssueListQuery, List<IssueTrackerResponseDTO>> {

        private readonly GpsdataContext _context;
        private readonly ILogger<GetIssueListQueryHandler> _logger;

        public GetIssueListQueryHandler (GpsdataContext context, ILogger<GetIssueListQueryHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<List<IssueTrackerResponseDTO>> Handle (GetIssueListQuery request, CancellationToken cancellationToken) {
            try {
                var issueTrackers = await _context.Issuetrackers
                    .Include (x => x.AssignToNavigation)
                    .Include (x => x.Site)
                    .Include (x => x.StatusNavigation)
                    .Include (x => x.OpenbyNavigation)
                    .Include (x => x.PriorityNavigation)
                    .Include (x => x.IssueCategory)
                    .Include (x => x.Vehicle)
                    //.Include (x => x.DeviceTypeNavigation)
                    .Select (issue => new IssueTrackerResponseDTO {
                        Id = issue.Id,
                            ProblemTitle = issue.ProblemTitle,
                            ProblemDescription = issue.ProblemDescription,
                            OpenDate = issue.OpenDate,
                            DueDate = issue.DueDate,
                            ClosingDate = issue.ClosingDate,
                            LastModfield = issue.LastModfield,
                            RelatedIssue = issue.RelatedIssue,

                            // Category information
                            IssueCategoryId = issue.IssueCategoryId,
                            CategoryName = issue.IssueCategory != null ? issue.IssueCategory.Name : "",

                            // Site information
                            SiteId = issue.SiteId,
                            SiteName = issue.Site != null ? issue.Site.Name : "",

                            // Status information
                            Status = issue.Status,
                            StatusName = issue.StatusNavigation != null ? issue.StatusNavigation.Status : "",

                            // Priority information
                            Priority = issue.Priority,
                            PriorityName = issue.PriorityNavigation != null ? issue.PriorityNavigation.Name : "",

                            // Vehicle information
                            VehicleId = issue.VehicleId,
                            VehicleNumber = issue.Vehicle != null ? issue.Vehicle.NumberPlate : "",
                            VehicleHyoungNo = issue.Vehicle != null ? issue.Vehicle.HyoungNo : "",

                            // User information - using names instead of IDs
                            OpenbyId = issue.Openby ?? "",
                            OpenbyUserName = issue.OpenbyNavigation != null ? issue.OpenbyNavigation.UserName : "",
                            OpenbyEmail = issue.OpenbyNavigation != null ? issue.OpenbyNavigation.Email : "",

                            AssignToId = issue.AssignTo ?? "",
                            AssignToUserName = issue.AssignToNavigation != null ? issue.AssignToNavigation.UserName : "",
                            AssignToEmail = issue.AssignToNavigation != null ? issue.AssignToNavigation.Email : "",

                            //// Device information (optional)
                            //DeviceId = issue.DeviceId,
                            //DeviceType = issue.DeviceType,
                            //DeviceTypeName = issue.DeviceTypeNavigation != null ? issue.DeviceTypeNavigation.Name : ""
                    })
                    .ToListAsync (cancellationToken);

                return issueTrackers;
            } catch (Exception ex) {
                _logger.LogError (ex, "Error fetching issue trackers");
                throw new Exception (ex.Message);
            }
        }
    }
}