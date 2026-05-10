/*
 * File:          AllowCrossTenantAttribute.cs
 * Purpose:       Marks an endpoint as opt-in to cross-tenant access. The
 *                authorization filter only allows users from the reserved
 *                "_platform" system tenant (is_platform_operator = true)
 *                to enter cross-tenant scope; all other callers receive 403.
 *
 *                When the filter passes, it flips ITenantContext.IsCrossTenant
 *                to true, which the EF global query filter checks to bypass
 *                tenant-scoped predicates for the duration of the request.
 *
 *                This is the SINGLE documented escape hatch from
 *                ITenantOwned isolation. Do not call IgnoreQueryFilters()
 *                ad-hoc elsewhere.
 *
 * Usage:         [AllowCrossTenant]
 *                public async Task<IActionResult> ListAllTenants() { ... }
 *
 * Dependencies:  FMS.Application (ITenantContext)
 * Last Modified: 2026-05-10
 */
using System;
using System.Linq;
using FMS.Application.Features.MultiTenancy.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Logging;

namespace FMS.WebClient.Attributes
{
    /// <summary>
    /// Opt-in marker for endpoints that need to read or write across tenants.
    /// Only users from the reserved system tenant (<c>is_platform_operator</c>
    /// JWT claim) can pass this filter.
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
    public sealed class AllowCrossTenantAttribute : TypeFilterAttribute
    {
        public AllowCrossTenantAttribute() : base(typeof(AllowCrossTenantFilter)) { }
    }

    /// <summary>
    /// Authorization filter for <see cref="AllowCrossTenantAttribute"/>.
    /// Verifies the caller is a platform operator and switches the
    /// scoped <see cref="ITenantContext"/> into cross-tenant mode for the
    /// rest of the request.
    /// </summary>
    public sealed class AllowCrossTenantFilter : IAuthorizationFilter
    {
        private readonly ITenantContext _tenantContext;
        private readonly ILogger<AllowCrossTenantFilter> _logger;

        public AllowCrossTenantFilter(ITenantContext tenantContext, ILogger<AllowCrossTenantFilter> logger)
        {
            _tenantContext = tenantContext;
            _logger = logger;
        }

        public void OnAuthorization(AuthorizationFilterContext context)
        {
            // Respect [AllowAnonymous] — operator endpoints should never be
            // anonymous, but if marked, skip rather than throw.
            if (context.ActionDescriptor.EndpointMetadata.OfType<AllowAnonymousAttribute>().Any())
            {
                return;
            }

            if (context.HttpContext.User?.Identity?.IsAuthenticated != true)
            {
                _logger.LogWarning("Unauthenticated request to [AllowCrossTenant] endpoint");
                context.Result = new UnauthorizedResult();
                return;
            }

            if (!_tenantContext.IsPlatformOperator)
            {
                _logger.LogWarning(
                    "Non-operator user {UserId} attempted to access [AllowCrossTenant] endpoint {Endpoint}",
                    context.HttpContext.User.Identity?.Name,
                    context.HttpContext.Request.Path);

                // 404 (not 403) to avoid leaking the existence of the endpoint
                // to non-operator callers. Operators always have the claim.
                context.Result = new NotFoundResult();
                return;
            }

            _tenantContext.EnterCrossTenantScope();
        }
    }
}
