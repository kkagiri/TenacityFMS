using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;
using System.Threading.Tasks;

namespace FMS.Application.Infrastructure.Authorization
{
    /// <summary>
    /// Custom policy provider that creates permission-based authorization policies dynamically
    /// Enables using [Authorize(Policy = "Permission.Read")] instead of manual HasClaim checks
    /// </summary>
    public class PermissionPolicyProvider : IAuthorizationPolicyProvider
    {
        private const string POLICY_PREFIX = "Permission";
        private readonly DefaultAuthorizationPolicyProvider _fallbackPolicyProvider;

        public PermissionPolicyProvider(IOptions<AuthorizationOptions> options)
        {
            _fallbackPolicyProvider = new DefaultAuthorizationPolicyProvider(options);
        }

        public Task<AuthorizationPolicy> GetDefaultPolicyAsync()
        {
            return _fallbackPolicyProvider.GetDefaultPolicyAsync();
        }

        public Task<AuthorizationPolicy?> GetFallbackPolicyAsync()
        {
            return _fallbackPolicyProvider.GetFallbackPolicyAsync();
        }

        public Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
        {
            // Check if this is a permission policy
            if (policyName.StartsWith(POLICY_PREFIX, System.StringComparison.OrdinalIgnoreCase))
            {
                // Extract permission name (e.g., "Permission.TankStock.Read" → "TankStock.Read")
                var permissionName = policyName.Substring(POLICY_PREFIX.Length + 1); // +1 for the dot

                // Build a policy that requires this permission
                var policy = new AuthorizationPolicyBuilder()
                    .AddRequirements(new PermissionRequirement(permissionName))
                    .Build();

                return Task.FromResult<AuthorizationPolicy?>(policy);
            }

            // Fall back to default policy provider for non-permission policies
            return _fallbackPolicyProvider.GetPolicyAsync(policyName);
        }
    }

    /// <summary>
    /// Authorization requirement for permission-based access control
    /// </summary>
    public class PermissionRequirement : IAuthorizationRequirement
    {
        public string PermissionName { get; }

        public PermissionRequirement(string permissionName)
        {
            PermissionName = permissionName;
        }
    }

    /// <summary>
    /// Authorization handler that checks if user has the required permission in their JWT claims
    /// </summary>
    public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
    {
        protected override Task HandleRequirementAsync(
            AuthorizationHandlerContext context,
            PermissionRequirement requirement)
        {
            // Check if user has the permission claim
            // The permission is stored in JWT claims as "permissions" claim
            if (context.User.HasClaim("permissions", requirement.PermissionName))
            {
                context.Succeed(requirement);
            }

            return Task.CompletedTask;
        }
    }
}
