/**
 * File: IsFollowingIssueQuery.cs
 * Purpose: Query to check if a user is following an issue
 * Dependencies: MediatR, GpsdataContext
 * Last Modified: 2026-02-05
 */
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.DTOs;
using FMS.Application.Features.IssueTracker.Services;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.IssueTracker.Queries
{
    public record IsFollowingIssueQuery(int IssueId, string UserId) : IRequest<FMSResponse<IsFollowingResponseDTO>>;

    public class IsFollowingIssueQueryHandler
        : IRequestHandler<IsFollowingIssueQuery, FMSResponse<IsFollowingResponseDTO>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<IsFollowingIssueQueryHandler> _logger;

        public IsFollowingIssueQueryHandler(GpsdataContext context, ILogger<IsFollowingIssueQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<IsFollowingResponseDTO>> Handle(
            IsFollowingIssueQuery request, CancellationToken cancellationToken)
        {
            try
            {
                await IssueFollowerSchemaGuard.EnsureTableExistsAsync(_context, cancellationToken);

                var follower = await _context.IssueFollowers
                    .FirstOrDefaultAsync(f => f.IssueId == request.IssueId && f.UserId == request.UserId, cancellationToken);

                return FMSResponse<IsFollowingResponseDTO>.Success(new IsFollowingResponseDTO
                {
                    IsFollowing = follower != null,
                    FollowerId = follower?.Id,
                    FollowedDate = follower?.FollowedDate
                });
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Error checking follow status for issue {IssueId} and user {UserId}", request.IssueId, request.UserId);
                return FMSResponse<IsFollowingResponseDTO>.Success(new IsFollowingResponseDTO
                {
                    IsFollowing = false,
                    FollowerId = null,
                    FollowedDate = null
                });
            }
        }
    }
}
