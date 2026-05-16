/*
 * File:          SubTenantsController.cs
 * Purpose:       Client-side endpoints for managing Customer sub-tenants under
 *                the calling Client tenant. All operations are scoped to the
 *                current tenant via ITenantContext; no cross-tenant access.
 * Last Modified: 2026-05-14
 */
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.UserManagement;
using FMS.Application.Common;
using FMS.Application.Common.Constants;
using FMS.Application.Features.MultiTenancy.Services;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.MultiTenancy;
using FMS.Persistence.DataAccess;
using FMS.WebClient.Attributes;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FMS.WebClient.Controllers.Tenants;

[ApiController]
[Authorize]
[Route("api/v1/tenants/sub")]
public sealed class SubTenantsController : ControllerBase
{
    private readonly GpsdataContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly IMediator _mediator;
    private readonly UserManager<User> _userManager;

    public SubTenantsController(
        GpsdataContext context,
        ITenantContext tenantContext,
        IMediator mediator,
        UserManager<User> userManager)
    {
        _context = context;
        _tenantContext = tenantContext;
        _mediator = mediator;
        _userManager = userManager;
    }

    [HttpGet]
    [RequirePermission(Permissions.MultiTenancy.ManageSubtenants, Permissions.MultiTenancy.ReadSubtenantData)]
    public async Task<ActionResult<FMSResponse<SubTenantListPayload>>> List(CancellationToken cancellationToken)
    {
        if (!_tenantContext.HasTenant)
        {
            return Unauthorized(FMSResponse<SubTenantListPayload>.Unauthorized());
        }

        var parentId = _tenantContext.TenantId;

        var rows = await _context.Tenants.AsNoTracking()
            .Where(t => t.ParentTenantId == parentId && t.TenantKind == TenantKind.Customer)
            .OrderBy(t => t.Name)
            .Select(t => new SubTenantSummaryDto(
                t.Id,
                t.Code,
                t.Name,
                t.IsActive,
                t.CreatedAt,
                t.UpdatedAt))
            .ToListAsync(cancellationToken);

        var payload = new SubTenantListPayload(rows);
        return Ok(FMSResponse<SubTenantListPayload>.Success(payload, "Sub-customers loaded."));
    }

    [HttpGet("{id:guid}")]
    [RequirePermission(Permissions.MultiTenancy.ManageSubtenants, Permissions.MultiTenancy.ReadSubtenantData)]
    public async Task<ActionResult<FMSResponse<SubTenantDetailDto>>> GetById(Guid id, CancellationToken cancellationToken)
    {
        if (!_tenantContext.HasTenant)
        {
            return Unauthorized(FMSResponse<SubTenantDetailDto>.Unauthorized());
        }

        var parentId = _tenantContext.TenantId;

        var tenant = await _context.Tenants.AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id && t.ParentTenantId == parentId, cancellationToken);

        if (tenant is null)
        {
            return NotFound(FMSResponse<SubTenantDetailDto>.NotFound("SUBTENANT_NOT_FOUND", "Sub-customer not found."));
        }

        // Note: User has a global query filter that already excludes IsDeleted users.
        var activeUserCount = await _context.Users.AsNoTracking()
            .Where(u => u.TenantId == tenant.Id)
            .CountAsync(cancellationToken);

        var userCount = await _context.Users.AsNoTracking()
            .IgnoreQueryFilters()
            .Where(u => u.TenantId == tenant.Id)
            .CountAsync(cancellationToken);

        var siteCount = await _context.Sites.AsNoTracking()
            .Where(s => s.TenantId == tenant.Id)
            .CountAsync(cancellationToken);

        var vehicleCount = await _context.Vehicles.AsNoTracking()
            .Where(v => v.TenantId == tenant.Id)
            .CountAsync(cancellationToken);

        var dto = new SubTenantDetailDto(
            tenant.Id,
            tenant.Code,
            tenant.Name,
            tenant.IsActive,
            tenant.CreatedAt,
            tenant.UpdatedAt,
            new SubTenantUsageDto(userCount, activeUserCount, siteCount, vehicleCount));

        return Ok(FMSResponse<SubTenantDetailDto>.Success(dto, "Sub-customer loaded."));
    }

    [HttpPost]
    [RequirePermission(Permissions.MultiTenancy.ManageSubtenants)]
    public async Task<ActionResult<FMSResponse<SubTenantDetailDto>>> Create(
        [FromBody] CreateSubTenantRequest request,
        CancellationToken cancellationToken)
    {
        if (!_tenantContext.HasTenant)
        {
            return Unauthorized(FMSResponse<SubTenantDetailDto>.Unauthorized());
        }

        var validationErrors = new List<string>();
        if (string.IsNullOrWhiteSpace(request.Code)) validationErrors.Add("Code is required.");
        if (string.IsNullOrWhiteSpace(request.Name)) validationErrors.Add("Name is required.");
        if (validationErrors.Count > 0)
        {
            return BadRequest(FMSResponse<SubTenantDetailDto>.ValidationFailed(validationErrors));
        }

        var parentId = _tenantContext.TenantId;
        var normalizedCode = request.Code.Trim();
        var normalizedName = request.Name.Trim();

        var duplicateExists = await _context.Tenants
            .AsNoTracking()
            .AnyAsync(t => t.Code == normalizedCode, cancellationToken);
        if (duplicateExists)
        {
            return Conflict(FMSResponse<SubTenantDetailDto>.Conflict("SUBTENANT_CODE_EXISTS", "A tenant with this code already exists."));
        }

        var sub = new Tenant
        {
            Id = Guid.NewGuid(),
            Code = normalizedCode,
            Name = normalizedName,
            IsActive = true,
            TenantKind = TenantKind.Customer,
            ParentTenantId = parentId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        _context.Tenants.Add(sub);
        await _context.SaveChangesAsync(cancellationToken);

        var dto = new SubTenantDetailDto(
            sub.Id,
            sub.Code,
            sub.Name,
            sub.IsActive,
            sub.CreatedAt,
            sub.UpdatedAt,
            new SubTenantUsageDto(0, 0, 0, 0));

        return CreatedAtAction(
            nameof(GetById),
            new { id = sub.Id },
            FMSResponse<SubTenantDetailDto>.Success(dto, "Sub-customer created."));
    }

    [HttpPatch("{id:guid}")]
    [RequirePermission(Permissions.MultiTenancy.ManageSubtenants)]
    public async Task<ActionResult<FMSResponse<SubTenantSummaryDto>>> Patch(
        Guid id,
        [FromBody] PatchSubTenantRequest request,
        CancellationToken cancellationToken)
    {
        if (!_tenantContext.HasTenant)
        {
            return Unauthorized(FMSResponse<SubTenantSummaryDto>.Unauthorized());
        }

        var parentId = _tenantContext.TenantId;

        var tenant = await _context.Tenants
            .FirstOrDefaultAsync(t => t.Id == id && t.ParentTenantId == parentId, cancellationToken);

        if (tenant is null)
        {
            return NotFound(FMSResponse<SubTenantSummaryDto>.NotFound("SUBTENANT_NOT_FOUND", "Sub-customer not found."));
        }

        bool changed = false;

        if (request.IsActive.HasValue && request.IsActive.Value != tenant.IsActive)
        {
            tenant.IsActive = request.IsActive.Value;
            changed = true;
        }

        if (!string.IsNullOrWhiteSpace(request.Name) && request.Name.Trim() != tenant.Name)
        {
            tenant.Name = request.Name.Trim();
            changed = true;
        }

        if (changed)
        {
            tenant.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
        }

        var summary = new SubTenantSummaryDto(tenant.Id, tenant.Code, tenant.Name, tenant.IsActive, tenant.CreatedAt, tenant.UpdatedAt);
        return Ok(FMSResponse<SubTenantSummaryDto>.Success(summary, "Sub-customer updated."));
    }

    [HttpPost("{id:guid}/invite-admin")]
    [RequirePermission(Permissions.MultiTenancy.ManageSubtenants)]
    public async Task<ActionResult<FMSResponse<InviteSubTenantAdminResultDto>>> InviteAdmin(
        Guid id,
        [FromBody] InviteSubTenantAdminRequest request,
        CancellationToken cancellationToken)
    {
        if (!_tenantContext.HasTenant)
        {
            return Unauthorized(FMSResponse<InviteSubTenantAdminResultDto>.Unauthorized());
        }

        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Username))
        {
            return BadRequest(FMSResponse<InviteSubTenantAdminResultDto>.ValidationFailed(
                new List<string> { "Email and username are required." }));
        }

        var parentId = _tenantContext.TenantId;

        var sub = await _context.Tenants
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id && t.ParentTenantId == parentId, cancellationToken);

        if (sub is null)
        {
            return NotFound(FMSResponse<InviteSubTenantAdminResultDto>.NotFound("SUBTENANT_NOT_FOUND", "Sub-customer not found."));
        }

        if (!sub.IsActive)
        {
            return BadRequest(FMSResponse<InviteSubTenantAdminResultDto>.BusinessLogicError(
                "SUBTENANT_INACTIVE", "Cannot invite an admin to an inactive sub-customer."));
        }

        // Create the user via the existing pipeline (validation, password gen, email send),
        // then bind to the sub-tenant. The User entity is ITenantOwned but there is no
        // auto-stamping interceptor, so an explicit assignment is honored by SaveChanges.
        var roleName = string.IsNullOrWhiteSpace(request.RoleName) ? "Admin" : request.RoleName.Trim();

        var createResponse = await _mediator.Send(new UserCreateCommand(
            Email: request.Email.Trim(),
            Username: request.Username.Trim(),
            RoleName: roleName,
            FirstName: request.FirstName,
            LastName: request.LastName,
            DepartmentId: null,
            SendOnboardingEmail: true,
            RequireEmailConfirmation: false,
            RequirePasswordChangeOnFirstLogin: true), cancellationToken);

        if (!createResponse.IsSuccess || createResponse.Data is null)
        {
            return BadRequest(FMSResponse<InviteSubTenantAdminResultDto>.Failed(
                createResponse.Message,
                createResponse.ErrorCode));
        }

        var createdUser = await _userManager.FindByIdAsync(createResponse.Data.UserId);
        if (createdUser is null)
        {
            return StatusCode(500, FMSResponse<InviteSubTenantAdminResultDto>.SystemError("Provisioned user could not be located."));
        }

        createdUser.TenantId = sub.Id;
        await _context.SaveChangesAsync(cancellationToken);

        var dto = new InviteSubTenantAdminResultDto(
            createResponse.Data.UserId,
            request.Email.Trim(),
            createResponse.Data.OnboardingEmailSent,
            createResponse.Data.TemporaryPassword);

        return Ok(FMSResponse<InviteSubTenantAdminResultDto>.Success(dto, createResponse.Message));
    }

    public sealed record SubTenantSummaryDto(
        Guid Id,
        string Code,
        string Name,
        bool IsActive,
        DateTime CreatedAt,
        DateTime? UpdatedAt);

    public sealed record SubTenantUsageDto(int Users, int ActiveUsers, int Sites, int Vehicles);

    public sealed record SubTenantDetailDto(
        Guid Id,
        string Code,
        string Name,
        bool IsActive,
        DateTime CreatedAt,
        DateTime? UpdatedAt,
        SubTenantUsageDto Usage);

    public sealed record SubTenantListPayload(IReadOnlyCollection<SubTenantSummaryDto> Items);

    public sealed record CreateSubTenantRequest(
        [property: Required] string Code,
        [property: Required] string Name);

    public sealed record PatchSubTenantRequest(bool? IsActive, string? Name);

    public sealed record InviteSubTenantAdminRequest(
        [property: Required, EmailAddress] string Email,
        [property: Required] string Username,
        string? FirstName = null,
        string? LastName = null,
        string? RoleName = null);

    public sealed record InviteSubTenantAdminResultDto(
        string UserId,
        string Email,
        bool OnboardingEmailSent,
        string? TemporaryPassword);
}
