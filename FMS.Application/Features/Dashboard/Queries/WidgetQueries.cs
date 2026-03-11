using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.Dashboard;
using FMS.Application.Services.Dashboard;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Dashboard;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.Dashboard
{
    // Get Widget Templates Query
    public record GetWidgetTemplatesQuery(
        string UserId,
        string? Category = null,
        bool OnlyEnabled = true) : IRequest<FMSResponseMessage<IEnumerable<DashboardWidgetTemplateDto>>>;

    public class GetWidgetTemplatesQueryHandler : IRequestHandler<GetWidgetTemplatesQuery, FMSResponseMessage<IEnumerable<DashboardWidgetTemplateDto>>>
    {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<GetWidgetTemplatesQueryHandler> _logger;

        public GetWidgetTemplatesQueryHandler(
            GpsdataContext context,
            IMapper mapper,
            ILogger<GetWidgetTemplatesQueryHandler> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<FMSResponseMessage<IEnumerable<DashboardWidgetTemplateDto>>> Handle(
            GetWidgetTemplatesQuery request,
            CancellationToken cancellationToken)
        {
            try
            {
                // Get user roles and permissions for filtering
                var userRoles = await GetUserRoles(request.UserId, cancellationToken);
                var userPermissions = await GetUserPermissions(request.UserId, cancellationToken);

                _logger.LogInformation("Getting widget templates for user {UserId}, Roles: [{Roles}], Permissions count: {PermCount}",
                    request.UserId, string.Join(", ", userRoles), userPermissions.Count);

                var query = _context.DashboardWidgetTemplates.AsNoTracking();

                if (request.OnlyEnabled)
                {
                    query = query.Where(t => t.IsEnabled);
                }

                if (!string.IsNullOrEmpty(request.Category))
                {
                    query = query.Where(t => t.Category == request.Category);
                }

                var templates = await query.ToListAsync(cancellationToken);
                _logger.LogInformation("Found {Count} templates before permission filtering", templates.Count);

                // Filter by role and permissions
                var filteredTemplates = templates.Where(t =>
                    HasRequiredAccess(t, userRoles, userPermissions)).ToList();

                _logger.LogInformation("Found {Count} templates after permission filtering", filteredTemplates.Count);

                var dtos = _mapper.Map<IEnumerable<DashboardWidgetTemplateDto>>(filteredTemplates);

                return new FMSResponseMessage<IEnumerable<DashboardWidgetTemplateDto>>(
                    true, "Widget templates retrieved successfully", dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving widget templates for user {UserId}", request.UserId);
                return new FMSResponseMessage<IEnumerable<DashboardWidgetTemplateDto>>(
                    false, ex.Message, null!);
            }
        }

        private async Task<List<string>> GetUserRoles(string userId, CancellationToken cancellationToken)
        {
            return await _context.UserRoles
                .Where(ur => ur.UserId == userId)
                .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name)
                .ToListAsync(cancellationToken);
        }

        private async Task<List<string>> GetUserPermissions(string userId, CancellationToken cancellationToken)
        {
            return await _context.UserRoles
                .Where(ur => ur.UserId == userId)
                .Join(_context.RolePermissions, ur => ur.RoleId, rp => rp.RoleId, (ur, rp) => rp.Permission.Name)
                .Distinct()
                .ToListAsync(cancellationToken);
        }

        private bool HasRequiredAccess(DashboardWidgetTemplate template, List<string> userRoles, List<string> userPermissions)
        {
            // Check role requirements
            if (!string.IsNullOrEmpty(template.RequiredRole))
            {
                var requiredRoles = template.RequiredRole.Split(',');
                if (!requiredRoles.Any(role => userRoles.Contains(role.Trim())))
                {
                    return false;
                }
            }

            // Check permission requirements
            if (!string.IsNullOrEmpty(template.RequiredPermissions))
            {
                var requiredPermissions = template.RequiredPermissions.Split(',');
                if (!requiredPermissions.All(perm => userPermissions.Contains(perm.Trim())))
                {
                    return false;
                }
            }

            return true;
        }
    }

    // Get User Widget Instances Query
    public record GetUserWidgetInstancesQuery(
        string UserId,
        string? Category = null) : IRequest<FMSResponseMessage<IEnumerable<DashboardWidgetInstanceDto>>>;

    public class GetUserWidgetInstancesQueryHandler : IRequestHandler<GetUserWidgetInstancesQuery, FMSResponseMessage<IEnumerable<DashboardWidgetInstanceDto>>>
    {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<GetUserWidgetInstancesQueryHandler> _logger;
        private readonly IWidgetInstanceDtoHydrationService _widgetInstanceDtoHydrationService;

        public GetUserWidgetInstancesQueryHandler(
            GpsdataContext context,
            IMapper mapper,
            ILogger<GetUserWidgetInstancesQueryHandler> logger,
            IWidgetInstanceDtoHydrationService widgetInstanceDtoHydrationService)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
            _widgetInstanceDtoHydrationService = widgetInstanceDtoHydrationService;
        }

        public async Task<FMSResponseMessage<IEnumerable<DashboardWidgetInstanceDto>>> Handle(
            GetUserWidgetInstancesQuery request,
            CancellationToken cancellationToken)
        {
            try
            {
                var query = _context.DashboardWidgetInstances
                    .Include(w => w.Template)
                    .Where(w => w.UserId == request.UserId && w.IsVisible)
                    .AsNoTracking();

                if (!string.IsNullOrEmpty(request.Category))
                {
                    query = query.Where(w => w.Category == request.Category);
                }

                var widgetInstances = await query

                    .ToListAsync(cancellationToken);

                Dictionary<string, string> sharedOwnerLookup = await BuildSharedOwnerLookupAsync(widgetInstances, cancellationToken);
                Dictionary<int, int> sharedCountLookup = await BuildSharedCountLookupAsync(widgetInstances, cancellationToken);

                var dtos = widgetInstances
                    .Select(widgetInstance =>
                    {
                        DashboardWidgetInstanceDto dto = _widgetInstanceDtoHydrationService.Hydrate(
                            widgetInstance,
                            _mapper.Map<DashboardWidgetInstanceDto>(widgetInstance));

                        if (!string.IsNullOrWhiteSpace(widgetInstance.SharedFromUserId) &&
                            sharedOwnerLookup.TryGetValue(widgetInstance.SharedFromUserId, out string? sharedOwnerName))
                        {
                            dto.SharedFromUserName = sharedOwnerName;
                        }

                        if (sharedCountLookup.TryGetValue(widgetInstance.Id, out int sharedWithCount))
                        {
                            dto.SharedWithCount = sharedWithCount;
                        }

                        return dto;
                    })
                    .ToList();

                return new FMSResponseMessage<IEnumerable<DashboardWidgetInstanceDto>>(
                    true, "Widget instances retrieved successfully", dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving widget instances for user {UserId}", request.UserId);
                return new FMSResponseMessage<IEnumerable<DashboardWidgetInstanceDto>>(
                    false, ex.Message, null!);
            }
        }

        private async Task<Dictionary<string, string>> BuildSharedOwnerLookupAsync(
            List<DashboardWidgetInstance> widgetInstances,
            CancellationToken cancellationToken)
        {
            List<string> sharedOwnerIds = widgetInstances
                .Where(widget => widget.IsShared && !string.IsNullOrWhiteSpace(widget.SharedFromUserId))
                .Select(widget => widget.SharedFromUserId!)
                .Distinct()
                .ToList();

            if (sharedOwnerIds.Count == 0)
            {
                return new Dictionary<string, string>();
            }

            List<User> users = await _context.Users
                .AsNoTracking()
                .Where(user => sharedOwnerIds.Contains(user.Id))
                .ToListAsync(cancellationToken);

            return users.ToDictionary(user => user.Id, BuildUserDisplayName);
        }

        private async Task<Dictionary<int, int>> BuildSharedCountLookupAsync(
            List<DashboardWidgetInstance> widgetInstances,
            CancellationToken cancellationToken)
        {
            List<int> originalWidgetIds = widgetInstances
                .Where(widget => !widget.IsShared)
                .Select(widget => widget.Id)
                .Distinct()
                .ToList();

            if (originalWidgetIds.Count == 0)
            {
                return new Dictionary<int, int>();
            }

            return await _context.DashboardWidgetInstances
                .AsNoTracking()
                .Where(widget =>
                    widget.IsVisible &&
                    widget.IsShared &&
                    widget.SharedFromWidgetId.HasValue &&
                    originalWidgetIds.Contains(widget.SharedFromWidgetId.Value))
                .GroupBy(widget => widget.SharedFromWidgetId!.Value)
                .Select(group => new { WidgetId = group.Key, Count = group.Count() })
                .ToDictionaryAsync(group => group.WidgetId, group => group.Count, cancellationToken);
        }

        private static string BuildUserDisplayName(User user)
        {
            string fullName = string.Join(" ", new[] { user.FirstName, user.LastName }
                .Where(value => !string.IsNullOrWhiteSpace(value)));

            if (!string.IsNullOrWhiteSpace(fullName))
            {
                return fullName;
            }

            return user.UserName ?? user.Email ?? user.Id;
        }
    }

    // Get Widget Instance Query
    public record GetWidgetInstanceQuery(
        string UserId,
        int WidgetInstanceId) : IRequest<FMSResponseMessage<DashboardWidgetInstanceDto>>;

    public class GetWidgetInstanceQueryHandler : IRequestHandler<GetWidgetInstanceQuery, FMSResponseMessage<DashboardWidgetInstanceDto>>
    {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<GetWidgetInstanceQueryHandler> _logger;
        private readonly IWidgetInstanceDtoHydrationService _widgetInstanceDtoHydrationService;

        public GetWidgetInstanceQueryHandler(
            GpsdataContext context,
            IMapper mapper,
            ILogger<GetWidgetInstanceQueryHandler> logger,
            IWidgetInstanceDtoHydrationService widgetInstanceDtoHydrationService)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
            _widgetInstanceDtoHydrationService = widgetInstanceDtoHydrationService;
        }

        public async Task<FMSResponseMessage<DashboardWidgetInstanceDto>> Handle(
            GetWidgetInstanceQuery request,
            CancellationToken cancellationToken)
        {
            try
            {
                var widgetInstance = await _context.DashboardWidgetInstances
                    .Include(w => w.Template)
                    .FirstOrDefaultAsync(w => w.Id == request.WidgetInstanceId &&
                        w.UserId == request.UserId &&
                        w.IsVisible, cancellationToken);

                if (widgetInstance == null)
                {
                    return new FMSResponseMessage<DashboardWidgetInstanceDto>(
                        false, "Widget instance not found", null!);
                }

                var dto = _widgetInstanceDtoHydrationService.Hydrate(
                    widgetInstance,
                    _mapper.Map<DashboardWidgetInstanceDto>(widgetInstance));

                if (!string.IsNullOrWhiteSpace(widgetInstance.SharedFromUserId))
                {
                    User? sharedOwner = await _context.Users
                        .AsNoTracking()
                        .Where(user => user.Id == widgetInstance.SharedFromUserId)
                        .FirstOrDefaultAsync(cancellationToken);

                    dto.SharedFromUserName = sharedOwner == null
                        ? null
                        : BuildUserDisplayName(sharedOwner);
                }

                if (!widgetInstance.IsShared)
                {
                    dto.SharedWithCount = await _context.DashboardWidgetInstances
                        .AsNoTracking()
                        .Where(sharedWidget =>
                            sharedWidget.IsVisible &&
                            sharedWidget.IsShared &&
                            sharedWidget.SharedFromWidgetId == widgetInstance.Id)
                        .CountAsync(cancellationToken);
                }

                return new FMSResponseMessage<DashboardWidgetInstanceDto>(
                    true, "Widget instance retrieved successfully", dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving widget instance {WidgetId} for user {UserId}",
                    request.WidgetInstanceId, request.UserId);
                return new FMSResponseMessage<DashboardWidgetInstanceDto>(
                    false, ex.Message, null!);
            }
        }

        private async Task<Dictionary<string, string>> BuildSharedOwnerLookupAsync(
            List<DashboardWidgetInstance> widgetInstances,
            CancellationToken cancellationToken)
        {
            List<string> sharedOwnerIds = widgetInstances
                .Where(widget => widget.IsShared && !string.IsNullOrWhiteSpace(widget.SharedFromUserId))
                .Select(widget => widget.SharedFromUserId!)
                .Distinct()
                .ToList();

            if (sharedOwnerIds.Count == 0)
            {
                return new Dictionary<string, string>();
            }

            List<User> users = await _context.Users
                .AsNoTracking()
                .Where(user => sharedOwnerIds.Contains(user.Id))
                .ToListAsync(cancellationToken);

            return users.ToDictionary(user => user.Id, BuildUserDisplayName);
        }

        private async Task<Dictionary<int, int>> BuildSharedCountLookupAsync(
            List<DashboardWidgetInstance> widgetInstances,
            CancellationToken cancellationToken)
        {
            List<int> originalWidgetIds = widgetInstances
                .Where(widget => !widget.IsShared)
                .Select(widget => widget.Id)
                .Distinct()
                .ToList();

            if (originalWidgetIds.Count == 0)
            {
                return new Dictionary<int, int>();
            }

            return await _context.DashboardWidgetInstances
                .AsNoTracking()
                .Where(widget =>
                    widget.IsVisible &&
                    widget.IsShared &&
                    widget.SharedFromWidgetId.HasValue &&
                    originalWidgetIds.Contains(widget.SharedFromWidgetId.Value))
                .GroupBy(widget => widget.SharedFromWidgetId!.Value)
                .Select(group => new { WidgetId = group.Key, Count = group.Count() })
                .ToDictionaryAsync(group => group.WidgetId, group => group.Count, cancellationToken);
        }

        private static string BuildUserDisplayName(User user)
        {
            string fullName = string.Join(" ", new[] { user.FirstName, user.LastName }
                .Where(value => !string.IsNullOrWhiteSpace(value)));

            if (!string.IsNullOrWhiteSpace(fullName))
            {
                return fullName;
            }

            return user.UserName ?? user.Email ?? user.Id;
        }
    }

    // Get Widget Categories Query
    public record GetWidgetCategoriesQuery(
        string UserId,
        bool OnlyEnabled = true) : IRequest<FMSResponseMessage<IEnumerable<string>>>;

    public class GetWidgetCategoriesQueryHandler : IRequestHandler<GetWidgetCategoriesQuery, FMSResponseMessage<IEnumerable<string>>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetWidgetCategoriesQueryHandler> _logger;

        public GetWidgetCategoriesQueryHandler(
            GpsdataContext context,
            ILogger<GetWidgetCategoriesQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponseMessage<IEnumerable<string>>> Handle(
            GetWidgetCategoriesQuery request,
            CancellationToken cancellationToken)
        {
            try
            {
                var query = _context.DashboardWidgetTemplates.AsNoTracking();

                if (request.OnlyEnabled)
                {
                    query = query.Where(t => t.IsEnabled);
                }

                var categories = await query
                    .Select(t => t.Category)
                    .Distinct()
                    .OrderBy(c => c)
                    .ToListAsync(cancellationToken);

                return new FMSResponseMessage<IEnumerable<string>>(
                    true, "Widget categories retrieved successfully", categories);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving widget categories");
                return new FMSResponseMessage<IEnumerable<string>>(
                    false, ex.Message, null!);
            }
        }
    }
}