/*
 * File:          TenantBrandingController.cs
 * Purpose:       Read/update endpoints for the white-label branding columns
 *                on the current tenant (logo + primary/secondary colours).
 *
 *                GET  /api/v1/tenant/branding   — read (all authenticated users)
 *                PATCH /api/v1/tenant/branding  — update (Manage_Branding required)
 *
 *                Surfaced to fms.frontend on bootstrap; the response drives
 *                CSS custom properties (--m365-primary, --m365-primary-hover)
 *                and the logo image swap in the SideNavOuterToolbar header.
 *
 *                Tenant resolution is automatic — TenantResolutionMiddleware
 *                has already populated ITenantContext from the JWT.
 *
 * Dependencies:  EF Core (GpsdataContext), ITenantContext
 * Last Modified: 2026-05-10
 */
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common.Constants;
using FMS.Application.Features.MultiTenancy.Services;
using FMS.Persistence.DataAccess;
using FMS.WebClient.Attributes;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FMS.WebClient.Controllers
{
    [ApiController]
    [Route("api/v1/tenant/branding")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public sealed class TenantBrandingController : ControllerBase
    {
        private readonly GpsdataContext _db;
        private readonly ITenantContext _tenantContext;

        public TenantBrandingController(GpsdataContext db, ITenantContext tenantContext)
        {
            _db = db;
            _tenantContext = tenantContext;
        }

        public sealed record BrandingDto(string? LogoUrl, string? PrimaryColor, string? SecondaryColor);

        public sealed record UpdateBrandingRequest(string? LogoUrl, string? PrimaryColor, string? SecondaryColor);

        /// <summary>
        /// Returns the current tenant's branding, or all-nulls (= use M365 defaults)
        /// if not set. Always 200 — fms.frontend handles null fields gracefully.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<BrandingDto>> Get(CancellationToken cancellationToken)
        {
            if (!_tenantContext.HasTenant)
            {
                return Ok(new BrandingDto(null, null, null));
            }

            var tenant = await _db.Tenants
                .AsNoTracking()
                .Where(t => t.Id == _tenantContext.TenantId)
                .Select(t => new BrandingDto(t.LogoUrl, t.PrimaryColor, t.SecondaryColor))
                .FirstOrDefaultAsync(cancellationToken);

            return Ok(tenant ?? new BrandingDto(null, null, null));
        }

        /// <summary>
        /// Updates branding for the current tenant. Requires _Manage_Branding.
        /// Customer-tenant users cannot reach this — they don't carry the
        /// permission. Client admins manage branding for their sub-customers
        /// via /api/v1/tenants/sub/{id}/branding (added in Phase 3).
        /// </summary>
        [HttpPatch]
        [RequirePermission(Permissions.MultiTenancy.ManageBranding)]
        public async Task<ActionResult<BrandingDto>> Update(
            [FromBody] UpdateBrandingRequest request,
            CancellationToken cancellationToken)
        {
            if (!_tenantContext.HasTenant)
            {
                return BadRequest(new { message = "No tenant resolved on this request." });
            }

            var tenant = await _db.Tenants
                .FirstOrDefaultAsync(t => t.Id == _tenantContext.TenantId, cancellationToken);

            if (tenant is null)
            {
                return NotFound();
            }

            tenant.LogoUrl = NullIfBlank(request.LogoUrl);
            tenant.PrimaryColor = NormalizeColor(request.PrimaryColor);
            tenant.SecondaryColor = NormalizeColor(request.SecondaryColor);
            tenant.UpdatedAt = System.DateTime.UtcNow;

            await _db.SaveChangesAsync(cancellationToken);

            return Ok(new BrandingDto(tenant.LogoUrl, tenant.PrimaryColor, tenant.SecondaryColor));
        }

        private static string? NullIfBlank(string? value) =>
            string.IsNullOrWhiteSpace(value) ? null : value.Trim();

        /// <summary>
        /// Accepts only "#RRGGBB" or "#RGB" hex values; anything else stored as null.
        /// Prevents CSS injection via the colour columns.
        /// </summary>
        private static string? NormalizeColor(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return null;
            var trimmed = value.Trim();
            if (System.Text.RegularExpressions.Regex.IsMatch(trimmed, "^#([0-9A-Fa-f]{3}){1,2}$"))
            {
                return trimmed;
            }
            return null;
        }
    }
}
