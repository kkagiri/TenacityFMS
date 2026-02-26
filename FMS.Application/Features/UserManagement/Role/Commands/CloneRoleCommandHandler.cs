/**
 * File: CloneRoleCommandHandler.cs
 * Purpose: Handles cloning of a role with its permissions and navigation items.
 * Dependencies: RoleManager, GpsdataContext, FMSResponse
 * Last Modified: 2026-02-24
 *
 * Key Functions:
 * - Handle(): Creates new role, copies RolePermissions and Rolenavigations from source
 */
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Auth;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.UserManagement.Role.Commands
{
    public class CloneRoleCommandHandler : IRequestHandler<CloneRoleCommand, FMSResponse<CloneRoleResult>>
    {
        private readonly RoleManager<Domain.Entities.Role> _roleManager;
        private readonly GpsdataContext _context;
        private readonly ILogger<CloneRoleCommandHandler> _logger;

        public CloneRoleCommandHandler(
            RoleManager<Domain.Entities.Role> roleManager,
            GpsdataContext context,
            ILogger<CloneRoleCommandHandler> logger)
        {
            _roleManager = roleManager;
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<CloneRoleResult>> Handle(CloneRoleCommand request, CancellationToken cancellationToken)
        {
            try
            {
                // Validate input
                if (string.IsNullOrWhiteSpace(request.SourceRoleId))
                    return FMSResponse<CloneRoleResult>.Failed("Source role ID is required.");

                if (string.IsNullOrWhiteSpace(request.NewRoleName))
                    return FMSResponse<CloneRoleResult>.Failed("New role name is required.");

                // Check source role exists
                var sourceRole = await _roleManager.Roles
                    .Include(r => r.RolePermissions)
                    .Include(r => r.Rolenavigations)
                    .FirstOrDefaultAsync(r => r.Id == request.SourceRoleId, cancellationToken);

                if (sourceRole == null)
                    return FMSResponse<CloneRoleResult>.Failed($"Source role with ID '{request.SourceRoleId}' not found.");

                // Check new role name doesn't already exist
                var existingRole = await _roleManager.FindByNameAsync(request.NewRoleName);
                if (existingRole != null)
                    return FMSResponse<CloneRoleResult>.Failed($"A role with name '{request.NewRoleName}' already exists.");

                // Create new role
                var newRole = new Domain.Entities.Role
                {
                    Name = request.NewRoleName,
                    Description = request.NewDescription ?? $"Cloned from {sourceRole.Name}"
                };

                var createResult = await _roleManager.CreateAsync(newRole);
                if (!createResult.Succeeded)
                {
                    var errors = string.Join(", ", createResult.Errors.Select(e => e.Description));
                    return FMSResponse<CloneRoleResult>.Failed($"Failed to create role: {errors}");
                }

                // Copy permissions
                int permsCopied = 0;
                if (sourceRole.RolePermissions?.Any() == true)
                {
                    var permissionIds = sourceRole.RolePermissions.Select(rp => rp.PermissionId).ToList();
                    foreach (var permissionId in permissionIds)
                    {
                        _context.RolePermissions.Add(new RolePermission
                        {
                            RoleId = newRole.Id,
                            PermissionId = permissionId
                        });
                        permsCopied++;
                    }
                }

                // Copy navigation items
                int navsCopied = 0;
                if (sourceRole.Rolenavigations?.Any() == true)
                {
                    var navItemIds = sourceRole.Rolenavigations.Select(rn => rn.NavigationItemId).ToList();
                    foreach (var navItemId in navItemIds)
                    {
                        _context.Rolenavigations.Add(new Rolenavigation
                        {
                            RoleId = newRole.Id,
                            NavigationItemId = navItemId
                        });
                        navsCopied++;
                    }
                }

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation(
                    "Cloned role '{SourceRole}' → '{NewRole}'. Permissions: {PermCount}, Navigations: {NavCount}",
                    sourceRole.Name, newRole.Name, permsCopied, navsCopied);

                return FMSResponse<CloneRoleResult>.Success(new CloneRoleResult
                {
                    RoleId = newRole.Id,
                    RoleName = newRole.Name,
                    PermissionsCopied = permsCopied,
                    NavigationsCopied = navsCopied
                }, $"Role '{sourceRole.Name}' cloned as '{newRole.Name}' with {permsCopied} permissions and {navsCopied} navigation items.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cloning role {SourceRoleId}", request.SourceRoleId);
                return FMSResponse<CloneRoleResult>.Failed($"Error cloning role: {ex.Message}");
            }
        }
    }
}
