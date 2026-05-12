using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities.Dashboard;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Dashboard.Commands
{
    /// <summary>
    /// Command to share a widget with other users
    /// Creates new widget instances for each target user
    /// </summary>
    public record ShareWidgetCommand(
        string OwnerUserId,
        ShareWidgetRequestDto Request,
        string Actor
    ) : IRequest<FMSResponseMessage<ShareWidgetResponseDto>>;

    /// <summary>
    /// Handler for ShareWidgetCommand
    /// </summary>
    public class ShareWidgetCommandHandler : IRequestHandler<ShareWidgetCommand, FMSResponseMessage<ShareWidgetResponseDto>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<ShareWidgetCommandHandler> _logger;

        public ShareWidgetCommandHandler(
            GpsdataContext context,
            ILogger<ShareWidgetCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponseMessage<ShareWidgetResponseDto>> Handle(
            ShareWidgetCommand command,
            CancellationToken cancellationToken)
        {
            try
            {
                var request = command.Request;

                // Validation
                if (request.WidgetInstanceId <= 0)
                {
                    return new FMSResponseMessage<ShareWidgetResponseDto>(
                        false,
                        "Invalid widget instance ID",
                        null!
                    );
                }

                // Resolve department IDs to user IDs and merge with individually selected users
                var allTargetUserIds = new HashSet<string>(request.TargetUserIds ?? new List<string>());

                if (request.TargetDepartmentIds != null && request.TargetDepartmentIds.Any())
                {
                    var departmentUserIds = await _context.Users
                        .Where(u => u.DepartmentId.HasValue
                            && request.TargetDepartmentIds.Contains(u.DepartmentId.Value))
                        .Select(u => u.Id)
                        .ToListAsync(cancellationToken);

                    foreach (var uid in departmentUserIds)
                    {
                        allTargetUserIds.Add(uid);
                    }

                    _logger.LogInformation(
                        "Resolved {DeptCount} department(s) to {UserCount} user(s) for widget sharing",
                        request.TargetDepartmentIds.Count,
                        departmentUserIds.Count
                    );
                }

                if (!allTargetUserIds.Any())
                {
                    return new FMSResponseMessage<ShareWidgetResponseDto>(
                        false,
                        "No target users or departments specified",
                        null!
                    );
                }

                // Load the original widget
                var originalWidget = await _context.DashboardWidgetInstances
                    .Include(w => w.Template)
                    .FirstOrDefaultAsync(
                        w => w.Id == request.WidgetInstanceId &&
                        w.UserId == command.OwnerUserId &&
                        w.IsVisible,
                        cancellationToken
                    );

                if (originalWidget == null)
                {
                    return new FMSResponseMessage<ShareWidgetResponseDto>(
                        false,
                        "Widget not found or access denied",
                        null!
                    );
                }

                // Don't allow sharing of already-shared widgets
                if (originalWidget.IsShared)
                {
                    return new FMSResponseMessage<ShareWidgetResponseDto>(
                        false,
                        "Cannot share a widget that was shared with you. Only the original owner can share.",
                        null!
                    );
                }

                var response = new ShareWidgetResponseDto
                {
                    OriginalWidgetId = originalWidget.Id
                };

                var sharedAt = DateTime.UtcNow;

                // Process each target user (merged from individual + department selections)
                foreach (var targetUserId in allTargetUserIds)
                {
                    try
                    {
                        // Validate target user exists
                        var targetUserExists = await _context.Users
                            .AnyAsync(u => u.Id == targetUserId, cancellationToken);

                        if (!targetUserExists)
                        {
                            response.Failures.Add(new ShareFailureDto
                            {
                                UserId = targetUserId,
                                Reason = "User not found"
                            });
                            continue;
                        }

                        // Don't share with self
                        if (targetUserId == command.OwnerUserId)
                        {
                            response.Failures.Add(new ShareFailureDto
                            {
                                UserId = targetUserId,
                                Reason = "Cannot share widget with yourself"
                            });
                            continue;
                        }

                        // Check if already shared with this user
                        var existingShare = await _context.DashboardWidgetInstances
                            .AnyAsync(
                                w => w.UserId == targetUserId &&
                                w.SharedFromWidgetId == originalWidget.Id &&
                                w.IsShared &&
                                w.IsVisible,
                                cancellationToken
                            );

                        if (existingShare)
                        {
                            response.Failures.Add(new ShareFailureDto
                            {
                                UserId = targetUserId,
                                Reason = "Widget already shared with this user"
                            });
                            continue;
                        }

                        // Create a new widget instance for the target user
                        var sharedWidget = new DashboardWidgetInstance
                        {
                            UserId = targetUserId,
                            TemplateId = originalWidget.TemplateId,
                            CustomName = originalWidget.CustomName,
                            WidgetType = originalWidget.WidgetType,
                            Category = originalWidget.Category,
                            DataSource = originalWidget.DataSource,
                            PositionX = originalWidget.PositionX,
                            PositionY = originalWidget.PositionY,
                            Width = originalWidget.Width,
                            Height = originalWidget.Height,
                            ConfigurationJson = originalWidget.ConfigurationJson,
                            IsVisible = true,
                            IsCustomWidget = originalWidget.IsCustomWidget,
                            // Sharing properties
                            IsShared = true,
                            SharedFromUserId = command.OwnerUserId,
                            SharedFromWidgetId = originalWidget.Id,
                            CanEdit = request.AllowEdit,
                            CanDelete = false, // Shared users cannot delete
                            SharedAt = sharedAt,
                            CreatedAt = sharedAt,
                            UpdatedAt = sharedAt
                        };

                        _context.DashboardWidgetInstances.Add(sharedWidget);
                        await _context.SaveChangesAsync(cancellationToken);

                        // Get user display name and department
                        var targetUser = await _context.Users
                            .Include(u => u.Department)
                            .FirstOrDefaultAsync(u => u.Id == targetUserId, cancellationToken);

                        response.SharedInstances.Add(new SharedWidgetInstanceDto
                        {
                            WidgetInstanceId = sharedWidget.Id,
                            UserId = targetUserId,
                            UserDisplayName = targetUser?.UserName ?? targetUserId,
                            DepartmentName = targetUser?.Department?.Name,
                            SharedAt = sharedAt,
                            CanEdit = request.AllowEdit,
                            CanDelete = false
                        });

                        _logger.LogInformation(
                            "Widget {WidgetId} shared from user {OwnerId} to user {TargetId} by {Actor}",
                            originalWidget.Id,
                            command.OwnerUserId,
                            targetUserId,
                            command.Actor
                        );
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(
                            ex,
                            "Failed to share widget {WidgetId} with user {UserId}",
                            originalWidget.Id,
                            targetUserId
                        );

                        response.Failures.Add(new ShareFailureDto
                        {
                            UserId = targetUserId,
                            Reason = $"Error: {ex.Message}"
                        });
                    }
                }

                var message = response.SuccessCount > 0 ?
                    $"Widget shared successfully with {response.SuccessCount} user(s)" :
                    "Failed to share widget with any users";

                return new FMSResponseMessage<ShareWidgetResponseDto>(
                    response.SuccessCount > 0,
                    message,
                    response
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sharing widget {WidgetId}", command.Request.WidgetInstanceId);
                return new FMSResponseMessage<ShareWidgetResponseDto>(
                    false,
                    $"Error sharing widget: {ex.Message}",
                    null!
                );
            }
        }
    }

    /// <summary>
    /// Command to unshare (remove) a shared widget
    /// </summary>
    public record UnshareWidgetCommand(
        string UserId,
        int SharedWidgetInstanceId,
        string Actor
    ) : IRequest<FMSResponseMessage<bool>>;

    /// <summary>
    /// Handler for UnshareWidgetCommand
    /// </summary>
    public class UnshareWidgetCommandHandler : IRequestHandler<UnshareWidgetCommand, FMSResponseMessage<bool>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<UnshareWidgetCommandHandler> _logger;

        public UnshareWidgetCommandHandler(
            GpsdataContext context,
            ILogger<UnshareWidgetCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponseMessage<bool>> Handle(
            UnshareWidgetCommand command,
            CancellationToken cancellationToken)
        {
            try
            {
                var sharedWidget = await _context.DashboardWidgetInstances
                    .FirstOrDefaultAsync(
                        w => w.Id == command.SharedWidgetInstanceId &&
                        w.UserId == command.UserId &&
                        w.IsShared,
                        cancellationToken
                    );

                if (sharedWidget == null)
                {
                    return new FMSResponseMessage<bool>(
                        false,
                        "Shared widget not found",
                        false
                    );
                }

                // Soft delete by hiding
                sharedWidget.IsVisible = false;
                sharedWidget.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation(
                    "Shared widget {WidgetId} removed for user {UserId} by {Actor}",
                    command.SharedWidgetInstanceId,
                    command.UserId,
                    command.Actor
                );

                return new FMSResponseMessage<bool>(
                    true,
                    "Shared widget removed successfully",
                    true
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error removing shared widget {WidgetId} for user {UserId}",
                    command.SharedWidgetInstanceId,
                    command.UserId
                );

                return new FMSResponseMessage<bool>(
                    false,
                    $"Error removing shared widget: {ex.Message}",
                    false
                );
            }
        }
    }
}
