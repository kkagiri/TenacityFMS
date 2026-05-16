/*
 * File:          TenantResolutionMiddleware.cs
 * Purpose:       Resolves the current tenant from JWT claims
 *                (tenant_id, tenant_kind, is_platform_operator) and
 *                stores them on the scoped ITenantContext. Must run
 *                AFTER authentication.
 * Dependencies:  ASP.NET Core, FMS.Application, FMS.Domain
 * Last Modified: 2026-05-14
 */
using System;
using System.Threading.Tasks;
using FMS.Application.Features.MultiTenancy.Services;
using FMS.Domain.Entities.Features.MultiTenancy;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace FMS.WebClient.Middleware
{
    public sealed class TenantResolutionMiddleware
    {
        private const string TenantIdClaim = "tenant_id";
        private const string TenantKindClaim = "tenant_kind";
        private const string IsPlatformOperatorClaim = "is_platform_operator";

        private readonly RequestDelegate _next;

        public TenantResolutionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, ITenantContext tenantContext)
        {
            if (context.User?.Identity?.IsAuthenticated == true)
            {
                var raw = context.User.FindFirst(TenantIdClaim)?.Value;
                if (!string.IsNullOrWhiteSpace(raw) &&
                    Guid.TryParse(raw, out var tenantId))
                {
                    var kindRaw = context.User.FindFirst(TenantKindClaim)?.Value;
                    var kind = ParseTenantKind(kindRaw);
                    var operatorRaw = context.User.FindFirst(IsPlatformOperatorClaim)?.Value;
                    bool isOperator = string.Equals(operatorRaw, "true", StringComparison.OrdinalIgnoreCase);

                    tenantContext.SetTenant(tenantId, kind, isOperator);
                }
            }

            await _next(context);
        }

        private static TenantKind ParseTenantKind(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return TenantKind.Client;
            }

            return value.ToLowerInvariant() switch
            {
                "system" => TenantKind.System,
                "customer" => TenantKind.Customer,
                _ => TenantKind.Client,
            };
        }
    }

    public static class TenantResolutionMiddlewareExtensions
    {
        public static IApplicationBuilder UseTenantResolution(this IApplicationBuilder builder)
            => builder.UseMiddleware<TenantResolutionMiddleware>();
    }
}
