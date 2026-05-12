/*
 * File:          TenantResolutionMiddleware.cs
 * Purpose:       Resolves the current tenant from JWT claims
 *                (claim name: "tenant_id") and stores it on the scoped
 *                ITenantContext. Must run AFTER authentication.
 * Dependencies:  ASP.NET Core, FMS.Application
 * Last Modified: 2026-04-26
 */
using System;
using System.Threading.Tasks;
using FMS.Application.Features.MultiTenancy.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace FMS.WebClient.Middleware
{
    /// <summary>
    /// Resolves the tenant for the current request from the
    /// <c>tenant_id</c> JWT claim and stores it on the scoped
    /// <see cref="ITenantContext"/>.
    /// </summary>
    public sealed class TenantResolutionMiddleware
    {
        private const string TenantClaimType = "tenant_id";

        private readonly RequestDelegate _next;

        public TenantResolutionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, ITenantContext tenantContext)
        {
            if (context.User?.Identity?.IsAuthenticated == true)
            {
                var raw = context.User.FindFirst(TenantClaimType)?.Value;
                if (!string.IsNullOrWhiteSpace(raw) &&
                    Guid.TryParse(raw, out var tenantId))
                {
                    tenantContext.SetTenant(tenantId);
                }
            }

            await _next(context);
        }
    }

    public static class TenantResolutionMiddlewareExtensions
    {
        /// <summary>
        /// Registers <see cref="TenantResolutionMiddleware"/> in the
        /// pipeline. Call AFTER <c>UseAuthentication()</c> and BEFORE
        /// <c>UseAuthorization()</c>.
        /// </summary>
        public static IApplicationBuilder UseTenantResolution(this IApplicationBuilder builder)
            => builder.UseMiddleware<TenantResolutionMiddleware>();
    }
}
