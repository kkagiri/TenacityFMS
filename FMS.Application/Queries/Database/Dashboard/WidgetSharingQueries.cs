using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Dashboard;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.Dashboard
{
    /// <summary>
    /// Query to get widgets shared with the current user
    /// </summary>
    public record GetSharedWidgetsQuery(
        string UserId,
        string? Category = null
    ) : IRequest<FMSResponseMessage<IEnumerable<DashboardWidgetInstanceWithSharingDto>>>;

    /// <summary>
    /// Handler for GetSharedWidgetsQuery
    /// </summary>
    public class GetSharedWidgetsQueryHandler : IRequestHandler<GetSharedWidgetsQuery, FMSResponseMessage<IEnumerable<DashboardWidgetInstanceWithSharingDto>>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetSharedWidgetsQueryHandler> _logger;

        public GetSharedWidgetsQueryHandler(
            GpsdataContext context,
            ILogger<GetSharedWidgetsQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponseMessage<IEnumerable<DashboardWidgetInstanceWithSharingDto>>> Handle(
            GetSharedWidgetsQuery query,
            CancellationToken cancellationToken)
        {
            try
            {
                var widgetsQuery = _context.DashboardWidgetInstances
                    .Include(w => w.Template)
                    .Where(w => w.UserId == query.UserId &&
                        w.IsShared &&
                        w.IsVisible);

                if (!string.IsNullOrEmpty(query.Category))
                {
                    widgetsQuery = widgetsQuery.Where(w => w.Category == query.Category);
                }

                var widgets = await widgetsQuery
                    .OrderByDescending(w => w.SharedAt)
                    .ToListAsync(cancellationToken);

                // Get original owner information
                var ownerIds = widgets.Select(w => w.SharedFromUserId).Where(id => !string.IsNullOrEmpty(id)).Distinct().ToList();
                var owners = await _context.Users
                    .Where(u => ownerIds.Contains(u.Id))
                    .ToDictionaryAsync(u => u.Id, u => u.UserName ?? u.Email ?? u.Id, cancellationToken);

                var dtos = widgets.Select(w => new DashboardWidgetInstanceWithSharingDto
                {
                    Id = w.Id,
                    TemplateId = w.TemplateId,
                    CustomName = w.CustomName,
                    WidgetType = w.WidgetType,
                    Category = w.Category,
                    DataSource = w.DataSource,
                    PositionX = w.PositionX,
                    PositionY = w.PositionY,
                    Width = w.Width,
                    Height = w.Height,
                    ConfigurationJson = w.ConfigurationJson,
                    IsVisible = w.IsVisible,
                    IsCustomWidget = w.IsCustomWidget,
                    CreatedAt = w.CreatedAt,
                    UpdatedAt = w.UpdatedAt,
                    // Sharing info
                    IsShared = w.IsShared,
                    SharedFromUserId = w.SharedFromUserId,
                    SharedFromUserName = w.SharedFromUserId != null && owners.ContainsKey(w.SharedFromUserId) ?
                            owners[w.SharedFromUserId] :
                            w.SharedFromUserId,
                    SharedFromWidgetId = w.SharedFromWidgetId,
                    CanEdit = w.CanEdit,
                    CanDelete = w.CanDelete,
                    SharedAt = w.SharedAt,
                    SharedWithUsers = null // Not applicable for shared widgets
                }).ToList();

                return new FMSResponseMessage<IEnumerable<DashboardWidgetInstanceWithSharingDto>>(
                    true,
                    $"Retrieved {dtos.Count} shared widget(s)",
                    dtos
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving shared widgets for user {UserId}", query.UserId);
                return new FMSResponseMessage<IEnumerable<DashboardWidgetInstanceWithSharingDto>>(
                    false,
                    $"Error retrieving shared widgets: {ex.Message}",
                    new List<DashboardWidgetInstanceWithSharingDto>()
                );
            }
        }
    }

    /// <summary>
    /// Query to get users a widget has been shared with (for original owner)
    /// </summary>
    public record GetWidgetSharesQuery(
        string OwnerUserId,
        int WidgetInstanceId
    ) : IRequest<FMSResponseMessage<List<SharedWithUserDto>>>;

    /// <summary>
    /// Handler for GetWidgetSharesQuery
    /// </summary>
    public class GetWidgetSharesQueryHandler : IRequestHandler<GetWidgetSharesQuery, FMSResponseMessage<List<SharedWithUserDto>>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetWidgetSharesQueryHandler> _logger;

        public GetWidgetSharesQueryHandler(
            GpsdataContext context,
            ILogger<GetWidgetSharesQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponseMessage<List<SharedWithUserDto>>> Handle(
            GetWidgetSharesQuery query,
            CancellationToken cancellationToken)
        {
            try
            {
                // Verify ownership
                var isOwner = await _context.DashboardWidgetInstances
                    .AnyAsync(
                        w => w.Id == query.WidgetInstanceId &&
                        w.UserId == query.OwnerUserId &&
                        !w.IsShared,
                        cancellationToken
                    );

                if (!isOwner)
                {
                    return new FMSResponseMessage<List<SharedWithUserDto>>(
                        false,
                        "Widget not found or access denied",
                        new List<SharedWithUserDto>()
                    );
                }

                // Get all shares
                var shares = await _context.DashboardWidgetInstances
                    .Where(w => w.SharedFromWidgetId == query.WidgetInstanceId &&
                        w.IsShared &&
                        w.IsVisible)
                    .ToListAsync(cancellationToken);

                if (!shares.Any())
                {
                    return new FMSResponseMessage<List<SharedWithUserDto>>(
                        true,
                        "Widget has not been shared with any users",
                        new List<SharedWithUserDto>()
                    );
                }

                // Get user information
                var userIds = shares.Select(s => s.UserId).ToList();
                var users = await _context.Users
                    .Where(u => userIds.Contains(u.Id))
                    .ToDictionaryAsync(u => u.Id, u => u.UserName ?? u.Email ?? u.Id, cancellationToken);

                var dtos = shares.Select(s => new SharedWithUserDto
                {
                    UserId = s.UserId,
                    UserDisplayName = users.ContainsKey(s.UserId) ? users[s.UserId] : s.UserId,
                    SharedWidgetInstanceId = s.Id,
                    SharedAt = s.SharedAt ?? s.CreatedAt,
                    CanEdit = s.CanEdit
                }).ToList();

                return new FMSResponseMessage<List<SharedWithUserDto>>(
                    true,
                    $"Widget shared with {dtos.Count} user(s)",
                    dtos
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error retrieving shares for widget {WidgetId}",
                    query.WidgetInstanceId
                );
                return new FMSResponseMessage<List<SharedWithUserDto>>(
                    false,
                    $"Error retrieving widget shares: {ex.Message}",
                    new List<SharedWithUserDto>()
                );
            }
        }
    }
}
