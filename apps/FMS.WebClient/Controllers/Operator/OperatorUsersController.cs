/*
 * File:          OperatorUsersController.cs
 * Purpose:       Operator-scoped CRUD for platform operator users (Phase 3.5).
 *                All endpoints narrow to users where TenantId equals the
 *                _platform tenant id. Gated by [AllowCrossTenant] so only
 *                platform operators can hit them; non-operators get 404.
 * Last Modified: 2026-05-16
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
using FMS.Application.CommonInterface;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Auth;
using FMS.Persistence.DataAccess;
using FMS.WebClient.Attributes;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FMS.WebClient.Controllers.Operator;

[ApiController]
[Authorize]
[AllowCrossTenant]
[Route("api/v1/operator/users")]
public sealed class OperatorUsersController : ControllerBase
{
    private const string PlatformTenantCode = "_platform";
    private const string DefaultOperatorRole = "PlatformOperator";

    private readonly GpsdataContext _context;
    private readonly UserManager<User> _userManager;
    private readonly IMediator _mediator;
    private readonly IPermissionAuthorizationService _permissionService;

    public OperatorUsersController(
        GpsdataContext context,
        UserManager<User> userManager,
        IMediator mediator,
        IPermissionAuthorizationService permissionService)
    {
        _context = context;
        _userManager = userManager;
        _mediator = mediator;
        _permissionService = permissionService;
    }

    [HttpGet]
    [RequirePermission(Permissions.Platform.ReadOperators)]
    public async Task<ActionResult<FMSResponse<OperatorUserListPayload>>> List(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null,
        CancellationToken cancellationToken = default)
    {
        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var platformTenantId = await GetPlatformTenantIdAsync(cancellationToken);
        if (platformTenantId is null)
        {
            return NotFound(FMSResponse<OperatorUserListPayload>.NotFound("PLATFORM_TENANT_MISSING", "Platform tenant not seeded."));
        }

        var query = _context.Users
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(u => u.TenantId == platformTenantId.Value);

        if (isActive.HasValue)
        {
            query = isActive.Value
                ? query.Where(u => u.IsDeleted != true)
                : query.Where(u => u.IsDeleted == true);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var needle = search.Trim();
            query = query.Where(u =>
                (u.UserName != null && EF.Functions.ILike(u.UserName, $"%{needle}%")) ||
                (u.Email != null && EF.Functions.ILike(u.Email, $"%{needle}%")) ||
                (u.FirstName != null && EF.Functions.ILike(u.FirstName, $"%{needle}%")) ||
                (u.LastName != null && EF.Functions.ILike(u.LastName, $"%{needle}%")));
        }

        var total = await query.CountAsync(cancellationToken);

        var pageUsers = await query
            .OrderBy(u => u.UserName)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new
            {
                u.Id,
                u.UserName,
                u.Email,
                u.FirstName,
                u.LastName,
                u.IsDeleted,
            })
            .ToListAsync(cancellationToken);

        var userIds = pageUsers.Select(u => u.Id).ToList();

        // Resolve role names per user in one query.
        var rolesByUserId = await _context.Set<UserRole>()
            .AsNoTracking()
            .Where(ur => userIds.Contains(ur.UserId))
            .Join(_context.Set<Role>().AsNoTracking(),
                ur => ur.RoleId,
                r => r.Id,
                (ur, r) => new { ur.UserId, RoleName = r.Name ?? string.Empty })
            .ToListAsync(cancellationToken);

        var roleLookup = rolesByUserId
            .GroupBy(x => x.UserId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.RoleName).Where(n => !string.IsNullOrEmpty(n)).ToArray());

        var items = pageUsers.Select(u => new OperatorUserSummaryDto(
            u.Id,
            u.UserName ?? string.Empty,
            u.Email,
            u.FirstName,
            u.LastName,
            (u.IsDeleted ?? false) == false,
            roleLookup.TryGetValue(u.Id, out var roleArr) ? roleArr : Array.Empty<string>()))
        .ToList();

        var totalPages = total == 0 ? 0 : (int)Math.Ceiling(total / (double)pageSize);

        var pagination = new PaginationMetadataDto(
            total,
            pageNumber,
            pageSize,
            totalPages,
            pageNumber > 1,
            pageNumber < totalPages);

        var payload = new OperatorUserListPayload(items, pagination);
        return Ok(FMSResponse<OperatorUserListPayload>.Success(payload, "Operator users loaded."));
    }

    [HttpGet("{id}")]
    [RequirePermission(Permissions.Platform.ReadOperators)]
    public async Task<ActionResult<FMSResponse<OperatorUserDetailDto>>> GetById(
        string id,
        CancellationToken cancellationToken)
    {
        var platformTenantId = await GetPlatformTenantIdAsync(cancellationToken);
        if (platformTenantId is null)
        {
            return NotFound(FMSResponse<OperatorUserDetailDto>.NotFound("PLATFORM_TENANT_MISSING", "Platform tenant not seeded."));
        }

        var user = await _context.Users
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id && u.TenantId == platformTenantId.Value, cancellationToken);

        if (user is null)
        {
            return NotFound(FMSResponse<OperatorUserDetailDto>.NotFound("OPERATOR_NOT_FOUND", "Operator user not found."));
        }

        var roles = await _userManager.GetRolesAsync(user);

        var dto = new OperatorUserDetailDto(
            user.Id,
            user.UserName ?? string.Empty,
            user.Email,
            user.FirstName,
            user.LastName,
            user.PhoneNumber,
            (user.IsDeleted ?? false) == false,
            user.EmailConfirmed,
            user.RequirePasswordChangeOnFirstLogin,
            roles.ToArray());

        return Ok(FMSResponse<OperatorUserDetailDto>.Success(dto, "Operator user loaded."));
    }

    [HttpPost]
    [RequirePermission(Permissions.Platform.ManageOperators)]
    public async Task<ActionResult<FMSResponse<OperatorUserDetailDto>>> Create(
        [FromBody] CreateOperatorUserRequest request,
        CancellationToken cancellationToken)
    {
        var platformTenantId = await GetPlatformTenantIdAsync(cancellationToken);
        if (platformTenantId is null)
        {
            return NotFound(FMSResponse<OperatorUserDetailDto>.NotFound("PLATFORM_TENANT_MISSING", "Platform tenant not seeded."));
        }

        var roleName = string.IsNullOrWhiteSpace(request.RoleName) ? DefaultOperatorRole : request.RoleName.Trim();

        var createResponse = await _mediator.Send(new UserCreateCommand(
            Email: request.Email?.Trim(),
            Username: request.Username.Trim(),
            RoleName: roleName,
            FirstName: request.FirstName,
            LastName: request.LastName,
            DepartmentId: null,
            SendOnboardingEmail: request.SendOnboardingEmail,
            RequireEmailConfirmation: false,
            RequirePasswordChangeOnFirstLogin: true), cancellationToken);

        if (!createResponse.IsSuccess || createResponse.Data is null)
        {
            return BadRequest(FMSResponse<OperatorUserDetailDto>.Failed(
                createResponse.Message,
                createResponse.ErrorCode));
        }

        // Re-bind the new user to the _platform tenant. (UserCreateCommand does not set TenantId.)
        var createdUser = await _userManager.FindByIdAsync(createResponse.Data.UserId);
        if (createdUser is null)
        {
            return StatusCode(500, FMSResponse<OperatorUserDetailDto>.SystemError("Provisioned operator could not be located."));
        }

        createdUser.TenantId = platformTenantId.Value;
        await _context.SaveChangesAsync(cancellationToken);

        var roles = await _userManager.GetRolesAsync(createdUser);

        var dto = new OperatorUserDetailDto(
            createdUser.Id,
            createdUser.UserName ?? string.Empty,
            createdUser.Email,
            createdUser.FirstName,
            createdUser.LastName,
            createdUser.PhoneNumber,
            (createdUser.IsDeleted ?? false) == false,
            createdUser.EmailConfirmed,
            createdUser.RequirePasswordChangeOnFirstLogin,
            roles.ToArray());

        return CreatedAtAction(
            nameof(GetById),
            new { id = createdUser.Id },
            FMSResponse<OperatorUserDetailDto>.Success(dto, createResponse.Message));
    }

    [HttpPatch("{id}")]
    [RequirePermission(Permissions.Platform.ManageOperators)]
    public async Task<ActionResult<FMSResponse<OperatorUserDetailDto>>> Patch(
        string id,
        [FromBody] PatchOperatorUserRequest request,
        CancellationToken cancellationToken)
    {
        var platformTenantId = await GetPlatformTenantIdAsync(cancellationToken);
        if (platformTenantId is null)
        {
            return NotFound(FMSResponse<OperatorUserDetailDto>.NotFound("PLATFORM_TENANT_MISSING", "Platform tenant not seeded."));
        }

        var user = await _context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id == id && u.TenantId == platformTenantId.Value, cancellationToken);

        if (user is null)
        {
            return NotFound(FMSResponse<OperatorUserDetailDto>.NotFound("OPERATOR_NOT_FOUND", "Operator user not found."));
        }

        bool changed = false;

        if (request.FirstName != null && request.FirstName != user.FirstName)
        {
            user.FirstName = request.FirstName;
            changed = true;
        }

        if (request.LastName != null && request.LastName != user.LastName)
        {
            user.LastName = request.LastName;
            changed = true;
        }

        if (request.Email != null && request.Email != user.Email)
        {
            user.Email = request.Email.Trim();
            user.NormalizedEmail = request.Email.Trim().ToUpperInvariant();
            changed = true;
        }

        if (request.IsActive.HasValue)
        {
            var desiredIsDeleted = !request.IsActive.Value;
            if ((user.IsDeleted ?? false) != desiredIsDeleted)
            {
                user.IsDeleted = desiredIsDeleted;
                changed = true;
            }
        }

        if (changed)
        {
            await _context.SaveChangesAsync(cancellationToken);
        }

        // Optional role swap. Empty / null means leave roles alone.
        if (request.Roles != null && request.Roles.Count > 0)
        {
            var existing = await _userManager.GetRolesAsync(user);
            var add = request.Roles.Except(existing, StringComparer.OrdinalIgnoreCase).ToArray();
            var remove = existing.Except(request.Roles, StringComparer.OrdinalIgnoreCase).ToArray();

            if (remove.Length > 0)
            {
                var removeResult = await _userManager.RemoveFromRolesAsync(user, remove);
                if (!removeResult.Succeeded)
                {
                    return BadRequest(FMSResponse<OperatorUserDetailDto>.ValidationFailed(
                        removeResult.Errors.Select(e => e.Description).ToList()));
                }
            }
            if (add.Length > 0)
            {
                var addResult = await _userManager.AddToRolesAsync(user, add);
                if (!addResult.Succeeded)
                {
                    return BadRequest(FMSResponse<OperatorUserDetailDto>.ValidationFailed(
                        addResult.Errors.Select(e => e.Description).ToList()));
                }
            }

            if (add.Length > 0 || remove.Length > 0)
            {
                _permissionService.InvalidateUserPermissions(user.Id);
            }
        }

        var roles = await _userManager.GetRolesAsync(user);

        var dto = new OperatorUserDetailDto(
            user.Id,
            user.UserName ?? string.Empty,
            user.Email,
            user.FirstName,
            user.LastName,
            user.PhoneNumber,
            (user.IsDeleted ?? false) == false,
            user.EmailConfirmed,
            user.RequirePasswordChangeOnFirstLogin,
            roles.ToArray());

        return Ok(FMSResponse<OperatorUserDetailDto>.Success(dto, "Operator user updated."));
    }

    private async Task<Guid?> GetPlatformTenantIdAsync(CancellationToken cancellationToken)
    {
        var id = await _context.Tenants.AsNoTracking()
            .Where(t => t.Code == PlatformTenantCode)
            .Select(t => (Guid?)t.Id)
            .FirstOrDefaultAsync(cancellationToken);
        return id;
    }

    public sealed record OperatorUserSummaryDto(
        string Id,
        string UserName,
        string? Email,
        string? FirstName,
        string? LastName,
        bool IsActive,
        IReadOnlyList<string> Roles);

    public sealed record OperatorUserDetailDto(
        string Id,
        string UserName,
        string? Email,
        string? FirstName,
        string? LastName,
        string? PhoneNumber,
        bool IsActive,
        bool EmailConfirmed,
        bool RequirePasswordChangeOnFirstLogin,
        IReadOnlyList<string> Roles);

    public sealed record OperatorUserListPayload(
        IReadOnlyCollection<OperatorUserSummaryDto> Items,
        PaginationMetadataDto Pagination);

    public sealed record PaginationMetadataDto(
        int TotalCount,
        int PageNumber,
        int PageSize,
        int TotalPages,
        bool HasPrevious,
        bool HasNext);

    public sealed record CreateOperatorUserRequest(
        [property: Required] string Username,
        [property: Required, EmailAddress] string Email,
        string? FirstName = null,
        string? LastName = null,
        string? RoleName = null,
        bool SendOnboardingEmail = true);

    public sealed record PatchOperatorUserRequest(
        string? FirstName,
        string? LastName,
        string? Email,
        bool? IsActive,
        IReadOnlyList<string>? Roles);
}
