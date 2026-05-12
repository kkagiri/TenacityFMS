/**
 * File: FollowIssueCommand.cs
 * Purpose: Command to follow an issue for activity notifications
 * Dependencies: MediatR, GpsdataContext, IIssueActivityService
 * Last Modified: 2026-02-05
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.DTOs;
using FMS.Application.Features.IssueTracker.Services;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.IssueTracker.Commands.Issues
{
    public record FollowIssueCommand(
        int IssueId,
        string UserId,
        string UserName,
        bool NotifyByEmail = true,
        bool NotifyByPush = true
    ) : IRequest<FMSResponse<IssueFollowerDTO>>;

    public class FollowIssueCommandHandler : IRequestHandler<FollowIssueCommand, FMSResponse<IssueFollowerDTO>>
    {
        private readonly GpsdataContext _context;
        private readonly IIssueActivityService _activityService;
        private readonly ILogger<FollowIssueCommandHandler> _logger;

        public FollowIssueCommandHandler(
            GpsdataContext context,
            IIssueActivityService activityService,
            ILogger<FollowIssueCommandHandler> logger)
        {
            _context = context;
            _activityService = activityService;
            _logger = logger;
        }

        public async Task<FMSResponse<IssueFollowerDTO>> Handle(FollowIssueCommand request, CancellationToken cancellationToken)
        {
            try
            {
                await IssueFollowerSchemaGuard.EnsureTableExistsAsync(_context, cancellationToken);

                // Check if issue exists
                var issue = await _context.Issuetrackers.FindAsync(new object[] { request.IssueId }, cancellationToken);
                if (issue == null)
                {
                    return FMSResponse<IssueFollowerDTO>.Failed($"Issue with ID {request.IssueId} not found");
                }

                // Check if already following
                var existingFollow = await _context.IssueFollowers
                    .FirstOrDefaultAsync(f => f.IssueId == request.IssueId && f.UserId == request.UserId, cancellationToken);

                if (existingFollow != null)
                {
                    // Update existing follow preferences
                    existingFollow.NotifyByEmail = request.NotifyByEmail;
                    existingFollow.NotifyByPush = request.NotifyByPush;
                    await _context.SaveChangesAsync(cancellationToken);

                    return FMSResponse<IssueFollowerDTO>.Success(new IssueFollowerDTO
                    {
                        Id = existingFollow.Id,
                        IssueId = existingFollow.IssueId,
                        UserId = existingFollow.UserId,
                        UserName = existingFollow.UserName,
                        FollowedDate = existingFollow.FollowedDate,
                        NotifyByEmail = existingFollow.NotifyByEmail,
                        NotifyByPush = existingFollow.NotifyByPush
                    }, "Already following this issue, preferences updated");
                }

                // Create new follow
                var follower = new IssueFollower
                {
                    IssueId = request.IssueId,
                    UserId = request.UserId,
                    UserName = request.UserName,
                    FollowedDate = DateTime.UtcNow,
                    NotifyByEmail = request.NotifyByEmail,
                    NotifyByPush = request.NotifyByPush
                };

                await _context.IssueFollowers.AddAsync(follower, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);

                // Log activity
                await _activityService.LogActivityAsync(
                    request.IssueId,
                    "Followed",
                    $"{request.UserName} started following this issue",
                    request.UserId,
                    request.UserName,
                    cancellationToken: cancellationToken);

                return FMSResponse<IssueFollowerDTO>.Success(new IssueFollowerDTO
                {
                    Id = follower.Id,
                    IssueId = follower.IssueId,
                    UserId = follower.UserId,
                    UserName = follower.UserName,
                    FollowedDate = follower.FollowedDate,
                    NotifyByEmail = follower.NotifyByEmail,
                    NotifyByPush = follower.NotifyByPush
                }, "Successfully followed the issue");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error following issue {IssueId} by user {UserId}", request.IssueId, request.UserId);
                return FMSResponse<IssueFollowerDTO>.Failed($"Failed to follow issue: {ex.Message}");
            }
        }
    }
}
