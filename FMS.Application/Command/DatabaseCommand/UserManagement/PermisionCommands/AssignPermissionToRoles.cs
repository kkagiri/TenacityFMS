using FMS.Domain.Entities;
using FMS.Domain.Entities.Auth;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.AspNetCore.DataProtection.KeyManagement.Internal;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Command.DatabaseCommand.UserManagement.PermisionCommands
{
    public record AssignPermissionsToRoleCommand (string RoleId, List<int> PermissionIds) : IRequest<AssignPermissionToRoleResult>;


    public class AssignPermissionsToRoleCommandHandler : IRequestHandler<AssignPermissionsToRoleCommand, AssignPermissionToRoleResult>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<AssignPermissionsToRoleCommandHandler> _logger;
        private readonly RoleManager<Role> _roleManager;

        public AssignPermissionsToRoleCommandHandler(GpsdataContext context, ILogger<AssignPermissionsToRoleCommandHandler> logger, RoleManager<Role> roleManager)
        {
            _context = context;
            _logger = logger;
            _roleManager = roleManager;
        }
        public async Task<AssignPermissionToRoleResult> Handle(AssignPermissionsToRoleCommand request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrEmpty(request.RoleId))
            {
                return new AssignPermissionToRoleResult(false, "Invalid role ID.");
            }

            if (request.PermissionIds == null || !request.PermissionIds.Any())
            {
                _logger.LogWarning("No permissions provided to assign.");
                return new AssignPermissionToRoleResult(false, "No permission(s) provided to assign");
            }
            try
            {
                var role = await _roleManager.Roles.Include(r=>r.RolePermissions).FirstOrDefaultAsync(r =>r.Id == request.RoleId, cancellationToken);
                if (role == null)
                {
                    return new AssignPermissionToRoleResult(false, $"Role with id {request.RoleId} not found.");
                }

                var result = await AssignNewPermissions(role, request.PermissionIds, cancellationToken);

                return result;

            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return new AssignPermissionToRoleResult(false, ex.Message);
            }   
        }


        /// <summary>
        /// Assigns new permissions to the role
        /// </summary>
        /// <param name="role"></param>
        /// <param name="newPermissionIds"></param>
        /// <param name="cancellationToken"></param>
        /// <returns>AssignPermissionToRoleResult </returns>
        private async Task<AssignPermissionToRoleResult> AssignNewPermissions(Role role, List<int> newPermissionIds, CancellationToken cancellationToken)
        {
            try
            {

                var currentPermissionIds = await _context.RolePermissions
                    .Where(rp => rp.RoleId == role.Id)
                    .Select(rp => rp.PermissionId)
                    .ToListAsync(cancellationToken);

                var permissionsToAdd = newPermissionIds.Except(currentPermissionIds).ToList();
                var permissionsToRemove = currentPermissionIds.Except(newPermissionIds).ToList();

                if (permissionsToAdd.Any())
                {
                    var newPermissions = await _context.Permissions
                        .Where(p => permissionsToAdd.Contains(p.Id))
                        .ToListAsync(cancellationToken);

                    foreach (var permission in newPermissions)
                    {
                        role.RolePermissions.Add(new RolePermission { RoleId = role.Id, PermissionId = permission.Id });
                    }
                }

                if (permissionsToRemove.Any())
                {
                    var removePermissions = role.RolePermissions.Where(rp => permissionsToRemove.Contains(rp.PermissionId)).ToList();
                    foreach (var rp in removePermissions)
                    {
                        role.RolePermissions.Remove(rp);
                    }
                }


                var updateResult = await _roleManager.UpdateAsync(role);
                if (!updateResult.Succeeded)
                {
                    var errors = string.Join(", ", updateResult.Errors.Select(e => e.Description));
                    throw new ApplicationException($"Failed to update role: {errors}");
                }

                await _context.SaveChangesAsync(cancellationToken);

                var addedCount = permissionsToAdd.Count;
                var removedCount = permissionsToRemove.Count;
                return new AssignPermissionToRoleResult(true, $"Successfully updated permissions for role {role.Name}. Added: {addedCount}, Removed: {removedCount}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating permissions for role {RoleName}", role.Name);
                return new AssignPermissionToRoleResult(false, $"Failed to update permissions for role {role.Name}: {ex.Message}");
            }
        }

    }

     public record AssignPermissionToRoleResult(bool Success, string Message);

}
