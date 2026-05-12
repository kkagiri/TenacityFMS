/**
 * File:          OperatorTenantsController.cs
 * Purpose:       Provides compatibility operator tenant APIs for FMS.Admin.
 * Dependencies:  FMSResponse, GpsdataContext, EF Core
 * Last Modified: 2026-05-12
 *
 * Key Functions:
 * - GetTenants(): Returns paged tenant summaries for the operator portal.
 * - GetTenant(): Returns one tenant detail payload with derived counts.
 * - CreateTenant(): Creates a tenant in the current tenancy root table.
 */
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities.Features.MultiTenancy;
using FMS.Persistence.DataAccess;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FMS.WebClient.Controllers.Operator;

[ApiController]
[Authorize]
[Route("api/v1/operator/tenants")]
public class OperatorTenantsController : ControllerBase
{
    private readonly GpsdataContext _context;

    public OperatorTenantsController(GpsdataContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<FMSResponse<OperatorTenantListPayload>>> GetTenants(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] string? search = null,
        [FromQuery] string? tenantKind = null,
        [FromQuery] bool? isActive = null,
        CancellationToken cancellationToken = default)
    {
        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 100);

        if (!string.IsNullOrWhiteSpace(tenantKind) && !string.Equals(tenantKind, "client", StringComparison.OrdinalIgnoreCase))
        {
            var emptyPayload = new OperatorTenantListPayload(
                Array.Empty<OperatorTenantSummaryDto>(),
                new PaginationMetadataDto(0, pageNumber, pageSize, 0, false, false));

            return Ok(FMSResponse<OperatorTenantListPayload>.Success(emptyPayload, "Tenants loaded successfully."));
        }

        IQueryable<Tenant> query = _context.Tenants.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = search.Trim().ToLower();
            query = query.Where(tenant =>
                tenant.Name.ToLower().Contains(normalizedSearch) ||
                tenant.Code.ToLower().Contains(normalizedSearch));
        }

        if (isActive.HasValue)
        {
            query = query.Where(tenant => tenant.IsActive == isActive.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var tenantRows = await query
            .OrderBy(tenant => tenant.Name)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(tenant => new OperatorTenantSummaryDto(
                tenant.Id,
                tenant.Code,
                tenant.Name,
                "client",
                null,
                tenant.IsActive,
                0,
                null,
                null,
                null,
                tenant.CreatedAt,
                tenant.UpdatedAt))
            .ToListAsync(cancellationToken);

        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);
        var payload = new OperatorTenantListPayload(
            tenantRows,
            new PaginationMetadataDto(
                totalCount,
                pageNumber,
                pageSize,
                totalPages,
                pageNumber > 1,
                totalPages > 0 && pageNumber < totalPages));

        return Ok(FMSResponse<OperatorTenantListPayload>.Success(payload, "Tenants loaded successfully."));
    }

    [HttpGet("{tenantId:guid}")]
    public async Task<ActionResult<FMSResponse<OperatorTenantDetailDto>>> GetTenant(
        Guid tenantId,
        CancellationToken cancellationToken = default)
    {
        var tenant = await _context.Tenants
            .AsNoTracking()
            .FirstOrDefaultAsync(currentTenant => currentTenant.Id == tenantId, cancellationToken);

        if (tenant is null)
        {
            return NotFound(FMSResponse<OperatorTenantDetailDto>.NotFound("TENANT_NOT_FOUND", "Tenant not found."));
        }

        var counts = new OperatorTenantCountsDto(
            0,
            0,
            await _context.Users.AsNoTracking().CountAsync(user => user.TenantId == tenant.Id, cancellationToken),
            await _context.Users.AsNoTracking().CountAsync(user => user.TenantId == tenant.Id && user.IsDeleted != true, cancellationToken),
            await _context.Sites.AsNoTracking().CountAsync(site => site.TenantId == tenant.Id, cancellationToken),
            await _context.Vehicles.AsNoTracking().CountAsync(vehicle => vehicle.TenantId == tenant.Id, cancellationToken));

        var payload = new OperatorTenantDetailDto(
            tenant.Id,
            tenant.Code,
            tenant.Name,
            "client",
            null,
            tenant.IsActive,
            0,
            null,
            null,
            null,
            tenant.CreatedAt,
            tenant.UpdatedAt,
            null,
            counts,
            Array.Empty<OperatorTenantHierarchyNodeDto>());

        return Ok(FMSResponse<OperatorTenantDetailDto>.Success(payload, "Tenant loaded successfully."));
    }

    [HttpPost]
    public async Task<ActionResult<FMSResponse<OperatorTenantDetailDto>>> CreateTenant(
        [FromBody] CreateOperatorTenantRequest request,
        CancellationToken cancellationToken = default)
    {
        var validationErrors = ValidateCreateRequest(request);
        if (validationErrors.Count > 0)
        {
            return BadRequest(FMSResponse<OperatorTenantDetailDto>.ValidationFailed(validationErrors));
        }

        var normalizedCode = request.Code.Trim();
        var normalizedName = request.Name.Trim();

        var duplicateExists = await _context.Tenants
            .AsNoTracking()
            .AnyAsync(tenant => tenant.Code == normalizedCode, cancellationToken);

        if (duplicateExists)
        {
            return Conflict(FMSResponse<OperatorTenantDetailDto>.Conflict("TENANT_CODE_EXISTS", "A tenant with this code already exists."));
        }

        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Code = normalizedCode,
            Name = normalizedName,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        _context.Tenants.Add(tenant);
        await _context.SaveChangesAsync(cancellationToken);

        var payload = new OperatorTenantDetailDto(
            tenant.Id,
            tenant.Code,
            tenant.Name,
            "client",
            null,
            tenant.IsActive,
            0,
            request.LogoUrl,
            request.PrimaryColor,
            request.SecondaryColor,
            tenant.CreatedAt,
            tenant.UpdatedAt,
            null,
            new OperatorTenantCountsDto(0, 0, 0, 0, 0, 0),
            Array.Empty<OperatorTenantHierarchyNodeDto>());

        return CreatedAtAction(
            nameof(GetTenant),
            new { tenantId = tenant.Id },
            FMSResponse<OperatorTenantDetailDto>.Success(payload, "Tenant created successfully."));
    }

    private static List<string> ValidateCreateRequest(CreateOperatorTenantRequest request)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(request.Code))
        {
            errors.Add("Code is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            errors.Add("Name is required.");
        }

        return errors;
    }

    public sealed record CreateOperatorTenantRequest(
        [property: Required] string Code,
        [property: Required] string Name,
        string? LogoUrl,
        string? PrimaryColor,
        string? SecondaryColor);

    public sealed record OperatorTenantListPayload(
        IReadOnlyCollection<OperatorTenantSummaryDto> Items,
        PaginationMetadataDto Pagination);

    public record OperatorTenantSummaryDto(
        Guid Id,
        string Code,
        string Name,
        string TenantKind,
        Guid? ParentTenantId,
        bool IsActive,
        int ChildrenCount,
        string? LogoUrl,
        string? PrimaryColor,
        string? SecondaryColor,
        DateTime CreatedAt,
        DateTime? UpdatedAt);

    public sealed record PaginationMetadataDto(
        int TotalCount,
        int PageNumber,
        int PageSize,
        int TotalPages,
        bool HasPrevious,
        bool HasNext);

    public sealed record OperatorTenantCountsDto(
        int DirectChildTenants,
        int DescendantTenants,
        int Users,
        int ActiveUsers,
        int Sites,
        int Vehicles);

    public sealed record OperatorTenantHierarchyNodeDto(
        Guid Id,
        string Code,
        string Name,
        string TenantKind,
        bool IsActive,
        IReadOnlyCollection<OperatorTenantHierarchyNodeDto> Children);

    public sealed record OperatorTenantDetailDto(
        Guid Id,
        string Code,
        string Name,
        string TenantKind,
        Guid? ParentTenantId,
        bool IsActive,
        int ChildrenCount,
        string? LogoUrl,
        string? PrimaryColor,
        string? SecondaryColor,
        DateTime CreatedAt,
        DateTime? UpdatedAt,
        string? ParentTenantName,
        OperatorTenantCountsDto Counts,
        IReadOnlyCollection<OperatorTenantHierarchyNodeDto> Hierarchy)
        : OperatorTenantSummaryDto(
            Id,
            Code,
            Name,
            TenantKind,
            ParentTenantId,
            IsActive,
            ChildrenCount,
            LogoUrl,
            PrimaryColor,
            SecondaryColor,
            CreatedAt,
            UpdatedAt);
}