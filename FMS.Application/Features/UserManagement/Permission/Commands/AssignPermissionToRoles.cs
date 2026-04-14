using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.CommonInterface;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Auth;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.AspNetCore.DataProtection.KeyManagement.Internal;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.UserManagement.PermisionCommands
{
    public record AssignPermissionsToRoleCommand(string RoleId, List<int> PermissionIds) : IRequest<FMSResponseMessage>;

    public class AssignPermissionsToRoleCommandHandler : IRequestHandler<AssignPermissionsToRoleCommand, FMSResponseMessage>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<AssignPermissionsToRoleCommandHandler> _logger;
        private readonly RoleManager<Role> _roleManager;
        private readonly IPermissionAuthorizationService _permissionAuthorizationService;

        public AssignPermissionsToRoleCommandHandler(GpsdataContext context, ILogger<AssignPermissionsToRoleCommandHandler> logger, RoleManager<Role> roleManager, IPermissionAuthorizationService permissionAuthorizationService)
        {
            _context = context;
            _logger = logger;
            _roleManager = roleManager;
            _permissionAuthorizationService = permissionAuthorizationService;
        }
        public async Task<FMSResponseMessage> Handle(AssignPermissionsToRoleCommand request, CancellationToken cancellationToken)
        {

            if (string.IsNullOrEmpty(request.RoleId))
            {
                return new FMSResponseMessage(false, "Invalid role ID.");
            }

            if (request.PermissionIds == null || !request.PermissionIds.Any())
            {
                _logger.LogWarning("No permissions provided to assign.");
                return new FMSResponseMessage(false, "No permission(s) provided to assign");
            }
            try
            {
                var role = await _roleManager.Roles.Include(r => r.RolePermissions).FirstOrDefaultAsync(r => r.Id == request.RoleId, cancellationToken);
                if (role == null)
                {
                    return new FMSResponseMessage(false, $"Role with id {request.RoleId} not found.");
                }

                var result = await AssignNewPermissions(role, request.PermissionIds, cancellationToken);

                return result;

            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return new FMSResponseMessage(false, ex.Message);
            }
        }

        /// <summary>
        /// Assigns new permissions to the role
        /// </summary>
        /// <param name="role"></param>
        /// <param name="newPermissionIds"></param>
        /// <param name="cancellationToken"></param>
        /// <returns>AssignPermissionToRoleResult </returns>
        private async Task<FMSResponseMessage> AssignNewPermissions(Role role, List<int> newPermissionIds, CancellationToken cancellationToken)
        {
            try
            {
                var currentPermissionIds = await _context.RolePermissions
                    .Where(rp => rp.RoleId == role.Id)
                    .Select(rp => rp.PermissionId)
                    .ToListAsync(cancellationToken);

                var permissionsToAdd = newPermissionIds.Except(currentPermissionIds).ToList();
                var permissionsToRemove = currentPermissionIds.Except(newPermissionIds).ToList();

                // Add new permissions
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

                // Remove old permissions (without cascading to Rolenavigation)
                if (permissionsToRemove.Any())
                {
                    var removePermissions = await _context.RolePermissions
                        .Where(rp => rp.RoleId == role.Id && permissionsToRemove.Contains(rp.PermissionId))
                        .ToListAsync(cancellationToken);

                    _context.RolePermissions.RemoveRange(removePermissions);
                }

                await _context.SaveChangesAsync(cancellationToken);
                await _permissionAuthorizationService.InvalidateRolePermissionsAsync(role.Id);

                return new FMSResponseMessage(
                    true,
                    $"Updated permissions for role {role.Name}. Added: {permissionsToAdd.Count}, Removed: {permissionsToRemove.Count}"
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating permissions for role {RoleName}", role.Name);
                return new FMSResponseMessage(false, ex.Message);
            }
        }

    }

}