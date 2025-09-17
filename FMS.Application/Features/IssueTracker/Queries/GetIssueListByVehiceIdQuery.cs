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

namespace FMS.Application.Queries.Database.FMSQuery.IssueTrackerQueries;

public record GetIssueListByVehiceIdQuery (int VehicleId) : IRequest<List<IssueTrackerResponseDTO>>;

public class GetIssueListByVehiceIdQueryHandler : IRequestHandler<GetIssueListByVehiceIdQuery, List<IssueTrackerResponseDTO>> {

    private readonly GpsdataContext _context;
    private readonly ILogger<GetIssueListByVehiceIdQueryHandler> _logger;

    public GetIssueListByVehiceIdQueryHandler (GpsdataContext context, ILogger<GetIssueListByVehiceIdQueryHandler> logger) {
        _context = context;
        _logger = logger;
    }
    public async Task<List<IssueTrackerResponseDTO>> Handle (GetIssueListByVehiceIdQuery request, CancellationToken cancellationToken) {
        try {
            var issues = await _context.Issuetrackers
                .Include (i => i.IssueCategory)
                .Include (x => x.OpenbyNavigation)
                .Include (x => x.StatusNavigation)
                .Include (x => x.AssignToNavigation)
                .Include (x => x.PriorityNavigation)
                .Include (x => x.Site)
                .Include (x => x.Vehicle)
                //.Include (x => x.DeviceTypeNavigation)
                .Where (i => i.VehicleId == request.VehicleId)
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

                        // Device information (optional)
                        //DeviceId = issue.DeviceId,
                        //DeviceType = issue.DeviceType,
                        //DeviceTypeName = issue.DeviceTypeNavigation != null ? issue.DeviceTypeNavigation.Name : ""
                })
                .ToListAsync (cancellationToken);

            return issues;
        } catch (Exception ex) {
            _logger.LogError (ex, "An error occured while getting issues list by vehicle id @{VehicleId}", request.VehicleId);
            throw new Exception (ex.Message);
        }
    }
}