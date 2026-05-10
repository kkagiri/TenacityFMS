/*
 * File:          TenantResolutionMiddleware.cs
 * Purpose:       Resolves the current tenant from JWT claims and stores
 *                it on the scoped ITenantContext. Must run AFTER
 *                authentication.
 *
 *                Claims read:
 *                  - tenant_id              (required for authenticated requests)
 *                  - tenant_kind            ("system" | "client" | "customer")
 *                  - is_platform_operator   ("true" iff present)
 *
 * Dependencies:  ASP.NET Core, FMS.Application, FMS.Domain
 * Last Modified: 2026-05-10
 */
using System;
using System.Threading.Tasks;
using FMS.Application.Features.MultiTenancy.Services;
using FMS.Domain.Entities.Features.MultiTenancy;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace FMS.WebClient.Middleware
{
    /// <summary>
    /// Resolves the tenant for the current request from JWT claims and
    /// stores it (along with TenantKind and IsPlatformOperator) on the
    /// scoped <see cref="ITenantContext"/>.
    /// </summary>
    public sealed class TenantResolutionMiddleware
    {
        private const string TenantIdClaimType = "tenant_id";
        private const string TenantKindClaimType = "tenant_kind";
        private const string IsPlatformOperatorClaimType = "is_platform_operator";

        private readonly RequestDelegate _next;

        public TenantResolutionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, ITenantContext tenantContext)
        {
            if (context.User?.Identity?.IsAuthenticated == true)
            {
                var rawTenantId = context.User.FindFirst(TenantIdClaimType)?.Value;
                if (!string.IsNullOrWhiteSpace(rawTenantId) &&
                    Guid.TryParse(rawTenantId, out var tenantId))
                {
                    var tenantKind = ParseTenantKind(context.User.FindFirst(TenantKindClaimType)?.Value);

                    var isPlatformOperator = string.Equals(
                        context.User.FindFirst(IsPlatformOperatorClaimType)?.Value,
                        "true",
                        StringComparison.OrdinalIgnoreCase);

                    tenantContext.SetTenant(tenantId, tenantKind, isPlatformOperator);
                }
            }

            await _next(context);
        }

        /// <summary>
        /// Parses the lower-case tenant_kind claim emitted by JwtTokenGenerator.
        /// Defaults to <see cref="TenantKind.Client"/> for tokens issued before
        /// this claim existed (backwards compatibility).
        /// </summary>
        private static TenantKind ParseTenantKind(string? raw)
        {
            if (string.IsNullOrWhiteSpace(raw))
            {
                return TenantKind.Client;
            }

            return raw.ToLowerInvariant() switch
            {
                "system" => TenantKind.System,
                "customer" => TenantKind.Customer,
                _ => TenantKind.Client,
            };
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
