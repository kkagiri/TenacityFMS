//Create Issue based on FMS Issue Tracker
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.FMS.Issuetracker;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.IssueTracker.Commands.Issues {
    public record CreateIssueCommand (IssueTrackerDTO IssueTrackerDto) : IRequest<int>;

    public class IssueCreateCommandHandler : IRequestHandler<CreateIssueCommand, int> {
        private readonly GpsdataContext _context;
        private readonly ILogger<IssueCreateCommandHandler> _logger;

        public IssueCreateCommandHandler (GpsdataContext context, ILogger<IssueCreateCommandHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<int> Handle (CreateIssueCommand request, CancellationToken cancellationToken) {
            try {
                // Resolve usernames to user IDs
                string? openbyUserId = null;
                string? assignToUserId = null;

                // Find user by username for Openby field
                if (!string.IsNullOrEmpty (request.IssueTrackerDto.Openby)) {
                    var openbyUser = await _context.Users
                        .FirstOrDefaultAsync (u => u.UserName == request.IssueTrackerDto.Openby, cancellationToken);
                    if (openbyUser != null) {
                        openbyUserId = openbyUser.Id;
                    } else {
                        throw new Exception ($"User '{request.IssueTrackerDto.Openby}' not found");
                    }
                }

                // Find user by username for AssignTo field
                if (!string.IsNullOrEmpty (request.IssueTrackerDto.AssignTo)) {
                    var assignToUser = await _context.Users
                        .FirstOrDefaultAsync (u => u.UserName == request.IssueTrackerDto.AssignTo, cancellationToken);
                    if (assignToUser != null) {
                        assignToUserId = assignToUser.Id;
                    } else {
                        throw new Exception ($"User '{request.IssueTrackerDto.AssignTo}' not found");
                    }
                }

                // Validate required fields
                if (string.IsNullOrEmpty (openbyUserId)) {
                    throw new Exception ("Openby user is required");
                }
                if (string.IsNullOrEmpty (assignToUserId)) {
                    throw new Exception ("AssignTo user is required");
                }

                // Map DTO to Entity
                Issuetracker issueEntity = new Issuetracker {
                    IssueCategoryId = request.IssueTrackerDto.IssueCategory,
                    SiteId = request.IssueTrackerDto.Site,
                    Openby = openbyUserId,
                    RelatedIssue = request.IssueTrackerDto.RelatedIssue,
                    ProblemDescription = request.IssueTrackerDto.ProblemDescription,
                    ProblemTitle = request.IssueTrackerDto.ProblemTitle,
                    Status = request.IssueTrackerDto.Status,
                    Priority = request.IssueTrackerDto.Priority,
                    DueDate = request.IssueTrackerDto.DueDate,
                    OpenDate = request.IssueTrackerDto.OpenDate ?? DateTime.UtcNow,
                    ClosingDate = request.IssueTrackerDto.ClosingDate,
                    LastModfield = DateTime.UtcNow,
                    VehicleId = request.IssueTrackerDto.Vehicle,
                    //DeviceId = request.IssueTrackerDto.Device,
                    DeviceType = request.IssueTrackerDto.DeviceType,
                    AssignTo = assignToUserId
                };

                await _context.Issuetrackers.AddAsync (issueEntity, cancellationToken);
                await _context.SaveChangesAsync (cancellationToken);

                return issueEntity.Id;
            } catch (Exception ex) {
                _logger.LogError (ex, "Error creating issue");
                throw new Exception ("Error creating issue", ex);
            }
        }
    }
}