using System;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.CommonInterface;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Logging;

namespace FMS.WebClient.Attributes
{
    /// <summary>
    /// Authorization filter that checks database permissions at runtime
    /// Works with [RequirePermission] attribute
    /// </summary>
    public class PermissionAuthorizationFilter : IAsyncAuthorizationFilter
    {
        private readonly IPermissionAuthorizationService _permissionService;
        private readonly ILogger<PermissionAuthorizationFilter> _logger;
        private readonly string[] _permissionNames;

        // Constructor for TypeFilterAttribute - permission names passed as arguments, services injected
        public PermissionAuthorizationFilter(
            string permissionName,
            IPermissionAuthorizationService permissionService,
            ILogger<PermissionAuthorizationFilter> logger)
        {
            _permissionService = permissionService;
            _logger = logger;
            _permissionNames = new[] { permissionName };
        }

        // Constructor for multiple permissions (params array flattened to single string[])
        public PermissionAuthorizationFilter(
            string[] permissionNames,
            IPermissionAuthorizationService permissionService,
            ILogger<PermissionAuthorizationFilter> logger)
        {
            _permissionService = permissionService;
            _logger = logger;
            _permissionNames = permissionNames ?? Array.Empty<string>();
        }

        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            // Check if user is authenticated
            if (!context.HttpContext.User.Identity?.IsAuthenticated ?? true)
            {
                _logger.LogWarning("Unauthenticated user attempted to access protected resource");
                context.Result = new UnauthorizedResult();
                return;
            }

            // If no permissions specified, just check authentication
            if (_permissionNames.Length == 0)
            {
                _logger.LogWarning("No permissions specified for authorization filter");
                return;
            }

            try
            {
                // Check if user has any of the required permissions (OR logic)
                bool hasPermission;

                if (_permissionNames.Length == 1)
                {
                    hasPermission = await _permissionService.HasPermissionAsync(_permissionNames[0]);

                    if (!hasPermission)
                    {
                        _logger.LogWarning(
                            "User {UserId} denied access. Missing permission: {Permission}",
                            context.HttpContext.User.Identity.Name,
                            _permissionNames[0]);
                    }
                }
                else
                {
                    hasPermission = await _permissionService.HasAnyPermissionAsync(_permissionNames);

                    if (!hasPermission)
                    {
                        _logger.LogWarning(
                            "User {UserId} denied access. Missing any of permissions: {Permissions}",
                            context.HttpContext.User.Identity.Name,
                            string.Join(", ", _permissionNames));
                    }
                }

                if (!hasPermission)
                {
                    // Return 403 Forbidden for API/JWT authentication (not redirect)
                    context.Result = new ObjectResult(new
                    {
                        message = "Access denied. Insufficient permissions.",
                        requiredPermissions = _permissionNames
                    })
                    {
                        StatusCode = 403
                    };
                    return;
                }

                _logger.LogDebug(
                    "User {UserId} granted access with permission(s): {Permissions}",
                    context.HttpContext.User.Identity.Name,
                    string.Join(", ", _permissionNames));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error checking permissions for user {UserId}. Permissions: {Permissions}",
                    context.HttpContext.User.Identity.Name,
                    string.Join(", ", _permissionNames));

                context.Result = new StatusCodeResult(500);
            }
        }
    }
}
