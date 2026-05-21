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
using System.Text.Json;
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
                    if (!TryParseTenantKind(kindRaw, out var kind))
                    {
                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        context.Response.ContentType = "application/json";
                        await context.Response.WriteAsync(JsonSerializer.Serialize(new
                        {
                            message = "Token tenant_kind is no longer supported. Please sign in again.",
                            tenantKind = kindRaw,
                        }));
                        return;
                    }

                    var operatorRaw = context.User.FindFirst(IsPlatformOperatorClaim)?.Value;
                    bool isOperator = string.Equals(operatorRaw, "true", StringComparison.OrdinalIgnoreCase);

                    tenantContext.SetTenant(tenantId, kind, isOperator);
                }
            }

            await _next(context);
        }

        private static bool TryParseTenantKind(string? value, out TenantKind tenantKind)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                tenantKind = TenantKind.Client;
                return true;
            }

            switch (value.ToLowerInvariant())
            {
                case "system":
                    tenantKind = TenantKind.System;
                    return true;
                case "client":
                    tenantKind = TenantKind.Client;
                    return true;
                default:
                    tenantKind = TenantKind.Client;
                    return false;
            }
        }
    }

    public static class TenantResolutionMiddlewareExtensions
    {
        public static IApplicationBuilder UseTenantResolution(this IApplicationBuilder builder)
            => builder.UseMiddleware<TenantResolutionMiddleware>();
    }
}
