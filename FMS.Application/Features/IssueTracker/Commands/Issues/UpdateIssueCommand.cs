using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Features.FMS.Issuetracker;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.IssueTracker.Commands.Issues;

public record UpdateIssueCommand (IssueTrackerDTO IssueTracker) : IRequest<Unit>;

public class UpdateIssueCommandHandler : IRequestHandler<UpdateIssueCommand, Unit> {
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<UpdateIssueCommandHandler> _logger;

    public UpdateIssueCommandHandler (GpsdataContext context, IMapper mapper, ILogger<UpdateIssueCommandHandler> logger) {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<Unit> Handle (UpdateIssueCommand request, CancellationToken cancellationToken) {
        try {
            var entity = await _context.Issuetrackers.FindAsync (request.IssueTracker.Id);
            if (entity == null) {
                _logger.LogWarning ("Issue with ID: {Id} not found", request.IssueTracker.Id);
                return Unit.Value;
            }

            // Resolve usernames to user IDs before mapping
            string? openbyUserId = null;
            string? assignToUserId = null;

            // Find user by username for Openby field
            if (!string.IsNullOrEmpty (request.IssueTracker.Openby)) {
                var openbyUser = await _context.Users
                    .FirstOrDefaultAsync (u => u.UserName == request.IssueTracker.Openby, cancellationToken);
                if (openbyUser != null) {
                    openbyUserId = openbyUser.Id;
                } else {
                    throw new Exception ($"User '{request.IssueTracker.Openby}' not found");
                }
            }

            // Find user by username for AssignTo field
            if (!string.IsNullOrEmpty (request.IssueTracker.AssignTo)) {
                var assignToUser = await _context.Users
                    .FirstOrDefaultAsync (u => u.UserName == request.IssueTracker.AssignTo, cancellationToken);
                if (assignToUser != null) {
                    assignToUserId = assignToUser.Id;
                } else {
                    throw new Exception ($"User '{request.IssueTracker.AssignTo}' not found");
                }
            }

            // Manually map DTO to Entity with resolved user IDs
            entity.IssueCategoryId = request.IssueTracker.IssueCategory;
            entity.IssueTemplateId = request.IssueTracker.IssueTemplateId;
            entity.DeviceTypeId = request.IssueTracker.DeviceTypeId ?? request.IssueTracker.DeviceType;
            entity.SiteId = request.IssueTracker.Site;
            entity.Openby = openbyUserId ?? entity.Openby;
            entity.RelatedIssue = request.IssueTracker.RelatedIssue;
            entity.ProblemDescription = request.IssueTracker.ProblemDescription;
            entity.ProblemTitle = request.IssueTracker.ProblemTitle;
            entity.Status = request.IssueTracker.Status;
            entity.Priority = request.IssueTracker.Priority;
            entity.DueDate = request.IssueTracker.DueDate;
            entity.ClosingDate = request.IssueTracker.ClosingDate;
            entity.LastModfield = DateTime.UtcNow;
            entity.VehicleId = request.IssueTracker.Vehicle;
            //entity.DeviceId = request.IssueTracker.Device;
            entity.DeviceType = request.IssueTracker.DeviceType;
            entity.CanAutoClose = request.IssueTracker.CanAutoClose ?? entity.CanAutoClose;
            entity.IsAutoCreated = request.IssueTracker.IsAutoCreated ?? entity.IsAutoCreated;
            entity.AssignTo = assignToUserId ?? entity.AssignTo;

            await _context.SaveChangesAsync (cancellationToken);

            _logger.LogInformation ("Issue with ID: {Id} updated", entity.Id);

            return Unit.Value;
        } catch (Exception ex) {
            _logger.LogError ("An error occured while updating issue with ID: {Id}", request.IssueTracker.Id);
            throw new Exception (ex.Message);
        }
    }
}
