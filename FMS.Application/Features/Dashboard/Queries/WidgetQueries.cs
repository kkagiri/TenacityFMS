using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.Dashboard;
using FMS.Domain.Entities.Dashboard;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.Dashboard {
    // Get Widget Templates Query
    public record GetWidgetTemplatesQuery (
        string UserId,
        string? Category = null,
        bool OnlyEnabled = true) : IRequest<FMSResponseMessage<IEnumerable<DashboardWidgetTemplateDto>>>;

    public class GetWidgetTemplatesQueryHandler : IRequestHandler<GetWidgetTemplatesQuery, FMSResponseMessage<IEnumerable<DashboardWidgetTemplateDto>>> {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<GetWidgetTemplatesQueryHandler> _logger;

        public GetWidgetTemplatesQueryHandler (
            GpsdataContext context,
            IMapper mapper,
            ILogger<GetWidgetTemplatesQueryHandler> logger) {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<FMSResponseMessage<IEnumerable<DashboardWidgetTemplateDto>>> Handle (
            GetWidgetTemplatesQuery request,
            CancellationToken cancellationToken) {
            try {
                // Get user roles and permissions for filtering
                var userRoles = await GetUserRoles (request.UserId, cancellationToken);
                var userPermissions = await GetUserPermissions (request.UserId, cancellationToken);

                var query = _context.DashboardWidgetTemplates.AsNoTracking ();

                if (request.OnlyEnabled) {
                    query = query.Where (t => t.IsEnabled);
                }

                if (!string.IsNullOrEmpty (request.Category)) {
                    query = query.Where (t => t.Category == request.Category);
                }

                var templates = await query.ToListAsync (cancellationToken);

                // Filter by role and permissions
                var filteredTemplates = templates.Where (t =>
                    HasRequiredAccess (t, userRoles, userPermissions)).ToList ();

                var dtos = _mapper.Map<IEnumerable<DashboardWidgetTemplateDto>> (filteredTemplates);

                return new FMSResponseMessage<IEnumerable<DashboardWidgetTemplateDto>> (
                    true, "Widget templates retrieved successfully", dtos);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving widget templates for user {UserId}", request.UserId);
                return new FMSResponseMessage<IEnumerable<DashboardWidgetTemplateDto>> (
                    false, ex.Message, null!);
            }
        }

        private async Task<List<string>> GetUserRoles (string userId, CancellationToken cancellationToken) {
            return await _context.UserRoles
                .Where (ur => ur.UserId == userId)
                .Join (_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name)
                .ToListAsync (cancellationToken);
        }

        private async Task<List<string>> GetUserPermissions (string userId, CancellationToken cancellationToken) {
            return await _context.UserRoles
                .Where (ur => ur.UserId == userId)
                .Join (_context.RolePermissions, ur => ur.RoleId, rp => rp.RoleId, (ur, rp) => rp.Permission.Name)
                .Distinct ()
                .ToListAsync (cancellationToken);
        }

        private bool HasRequiredAccess (DashboardWidgetTemplate template, List<string> userRoles, List<string> userPermissions) {
            // Check role requirements
            if (!string.IsNullOrEmpty (template.RequiredRole)) {
                var requiredRoles = template.RequiredRole.Split (',');
                if (!requiredRoles.Any (role => userRoles.Contains (role.Trim ()))) {
                    return false;
                }
            }

            // Check permission requirements
            if (!string.IsNullOrEmpty (template.RequiredPermissions)) {
                var requiredPermissions = template.RequiredPermissions.Split (',');
                if (!requiredPermissions.All (perm => userPermissions.Contains (perm.Trim ()))) {
                    return false;
                }
            }

            return true;
        }
    }

    // Get User Widget Instances Query
    public record GetUserWidgetInstancesQuery (
        string UserId,
        string? Category = null) : IRequest<FMSResponseMessage<IEnumerable<DashboardWidgetInstanceDto>>>;

    public class GetUserWidgetInstancesQueryHandler : IRequestHandler<GetUserWidgetInstancesQuery, FMSResponseMessage<IEnumerable<DashboardWidgetInstanceDto>>> {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<GetUserWidgetInstancesQueryHandler> _logger;

        public GetUserWidgetInstancesQueryHandler (
            GpsdataContext context,
            IMapper mapper,
            ILogger<GetUserWidgetInstancesQueryHandler> logger) {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<FMSResponseMessage<IEnumerable<DashboardWidgetInstanceDto>>> Handle (
            GetUserWidgetInstancesQuery request,
            CancellationToken cancellationToken) {
            try {
                var query = _context.DashboardWidgetInstances
                    .Include (w => w.Template)
                    .Where (w => w.UserId == request.UserId && w.IsVisible)
                    .AsNoTracking ();

                if (!string.IsNullOrEmpty (request.Category)) {
                    query = query.Where (w => w.Template.Category == request.Category);
                }

                var widgetInstances = await query

                    .ToListAsync (cancellationToken);

                var dtos = _mapper.Map<IEnumerable<DashboardWidgetInstanceDto>> (widgetInstances);

                return new FMSResponseMessage<IEnumerable<DashboardWidgetInstanceDto>> (
                    true, "Widget instances retrieved successfully", dtos);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving widget instances for user {UserId}", request.UserId);
                return new FMSResponseMessage<IEnumerable<DashboardWidgetInstanceDto>> (
                    false, ex.Message, null!);
            }
        }
    }

    // Get Widget Instance Query
    public record GetWidgetInstanceQuery (
        string UserId,
        int WidgetInstanceId) : IRequest<FMSResponseMessage<DashboardWidgetInstanceDto>>;

    public class GetWidgetInstanceQueryHandler : IRequestHandler<GetWidgetInstanceQuery, FMSResponseMessage<DashboardWidgetInstanceDto>> {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<GetWidgetInstanceQueryHandler> _logger;

        public GetWidgetInstanceQueryHandler (
            GpsdataContext context,
            IMapper mapper,
            ILogger<GetWidgetInstanceQueryHandler> logger) {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<FMSResponseMessage<DashboardWidgetInstanceDto>> Handle (
            GetWidgetInstanceQuery request,
            CancellationToken cancellationToken) {
            try {
                var widgetInstance = await _context.DashboardWidgetInstances
                    .Include (w => w.Template)
                    .FirstOrDefaultAsync (w => w.Id == request.WidgetInstanceId &&
                        w.UserId == request.UserId &&
                        w.IsVisible, cancellationToken);

                if (widgetInstance == null) {
                    return new FMSResponseMessage<DashboardWidgetInstanceDto> (
                        false, "Widget instance not found", null!);
                }

                var dto = _mapper.Map<DashboardWidgetInstanceDto> (widgetInstance);
                return new FMSResponseMessage<DashboardWidgetInstanceDto> (
                    true, "Widget instance retrieved successfully", dto);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving widget instance {WidgetId} for user {UserId}",
                    request.WidgetInstanceId, request.UserId);
                return new FMSResponseMessage<DashboardWidgetInstanceDto> (
                    false, ex.Message, null!);
            }
        }
    }

    // Get Widget Categories Query
    public record GetWidgetCategoriesQuery (
        string UserId,
        bool OnlyEnabled = true) : IRequest<FMSResponseMessage<IEnumerable<string>>>;

    public class GetWidgetCategoriesQueryHandler : IRequestHandler<GetWidgetCategoriesQuery, FMSResponseMessage<IEnumerable<string>>> {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetWidgetCategoriesQueryHandler> _logger;

        public GetWidgetCategoriesQueryHandler (
            GpsdataContext context,
            ILogger<GetWidgetCategoriesQueryHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponseMessage<IEnumerable<string>>> Handle (
            GetWidgetCategoriesQuery request,
            CancellationToken cancellationToken) {
            try {
                var query = _context.DashboardWidgetTemplates.AsNoTracking ();

                if (request.OnlyEnabled) {
                    query = query.Where (t => t.IsEnabled);
                }

                var categories = await query
                    .Select (t => t.Category)
                    .Distinct ()
                    .OrderBy (c => c)
                    .ToListAsync (cancellationToken);

                return new FMSResponseMessage<IEnumerable<string>> (
                    true, "Widget categories retrieved successfully", categories);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving widget categories");
                return new FMSResponseMessage<IEnumerable<string>> (
                    false, ex.Message, null!);
            }
        }
    }
}