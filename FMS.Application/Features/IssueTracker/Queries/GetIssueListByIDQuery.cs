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

public record GetIssueListByIdQuery (int Id) : IRequest<IssueTrackerResponseDTO>;

public class GetIssueListByIDQueryHandler : IRequestHandler<GetIssueListByIdQuery, IssueTrackerResponseDTO> {
    private readonly GpsdataContext _context;
    private readonly ILogger<GetIssueListByIDQueryHandler> _logger;

    public GetIssueListByIDQueryHandler (GpsdataContext context, ILogger<GetIssueListByIDQueryHandler> logger) {
        _context = context;
        _logger = logger;

    }

    public async Task<IssueTrackerResponseDTO> Handle (GetIssueListByIdQuery request, CancellationToken cancellationToken) {
        try {
            var issuetracker = await _context.Issuetrackers
                .Include (i => i.OpenbyNavigation)
                .Include (i => i.StatusNavigation)
                .Include (i => i.AssignToNavigation)
                .Include (i => i.PriorityNavigation)
                .Include (i => i.IssueCategory)
                .Include (i => i.Site)
                .Include (i => i.Vehicle)
                //.Include (i => i.DeviceTypeNavigation)
                .Where (i => i.Id == request.Id)
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
                .FirstOrDefaultAsync (cancellationToken);

            if (issuetracker == null) {
                throw new Exception ($"Issue with ID {request.Id} not found");
            }

            return issuetracker;
        } catch (Exception ex) {
            _logger.LogError (ex, "An error occured while getting issue tracker");
            throw new Exception (ex.ToString ());
        }
    }
}