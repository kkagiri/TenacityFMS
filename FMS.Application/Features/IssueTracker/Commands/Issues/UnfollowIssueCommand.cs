/**
 * File: UnfollowIssueCommand.cs
 * Purpose: Command to unfollow an issue and stop receiving activity notifications
 * Dependencies: MediatR, GpsdataContext, IIssueActivityService
 * Last Modified: 2026-02-05
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.Services;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.IssueTracker.Commands.Issues
{
    public record UnfollowIssueCommand(
        int IssueId,
        string UserId,
        string UserName
    ) : IRequest<FMSResponse<bool>>;

    public class UnfollowIssueCommandHandler : IRequestHandler<UnfollowIssueCommand, FMSResponse<bool>>
    {
        private readonly GpsdataContext _context;
        private readonly IIssueActivityService _activityService;
        private readonly ILogger<UnfollowIssueCommandHandler> _logger;

        public UnfollowIssueCommandHandler(
            GpsdataContext context,
            IIssueActivityService activityService,
            ILogger<UnfollowIssueCommandHandler> logger)
        {
            _context = context;
            _activityService = activityService;
            _logger = logger;
        }

        public async Task<FMSResponse<bool>> Handle(UnfollowIssueCommand request, CancellationToken cancellationToken)
        {
            try
            {
                // Find existing follow
                var existingFollow = await _context.IssueFollowers
                    .FirstOrDefaultAsync(f => f.IssueId == request.IssueId && f.UserId == request.UserId, cancellationToken);

                if (existingFollow == null)
                {
                    return FMSResponse<bool>.Success(true, "You are not following this issue");
                }

                // Remove follow
                _context.IssueFollowers.Remove(existingFollow);
                await _context.SaveChangesAsync(cancellationToken);

                // Log activity
                await _activityService.LogActivityAsync(
                    request.IssueId,
                    "Unfollowed",
                    $"{request.UserName} stopped following this issue",
                    request.UserId,
                    request.UserName,
                    cancellationToken: cancellationToken);

                return FMSResponse<bool>.Success(true, "Successfully unfollowed the issue");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unfollowing issue {IssueId} by user {UserId}", request.IssueId, request.UserId);
                return FMSResponse<bool>.Failed("Failed to unfollow issue");
            }
        }
    }
}
