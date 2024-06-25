using FMS.Domain.Entities;
using FMS.Domain.Entities.Auth;
using FMS.Persistence.DataAccess;
using MediatR;
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
    public record AssignPermissionsToRoleCommand (string RoleId, List<int> PermisionIds) : IRequest<AssignPermissionToRoleResult>;


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
            try
            {
                var role = await _roleManager.FindByIdAsync(request.RoleId);
                if (role == null) 
                {
                    _logger.LogWarning($"Role with id {request.RoleId} not found.");
                    return new AssignPermissionToRoleResult(false, $"Role with id {request.RoleId} not found.");
                }


                if (request.PermisionIds == null || !request.PermisionIds.Any())
                {
                    _logger.LogWarning("No permissions provided to assign.");
                    return new AssignPermissionToRoleResult(true,"No permission(s) provided to assign");
                }
                var existingPermissions = await _context.RolePermissions
                  .Where(rp => rp.RoleId == request.RoleId && request.PermisionIds.Contains(rp.PermissionId))
                  .Select(rp => rp.PermissionId)
                  .ToListAsync(cancellationToken);

                var newPermissionIds = request.PermisionIds.Except(existingPermissions).ToList();


                if (!newPermissionIds.Any())
                {
                    _logger.LogInformation("No new permissions to assign.");
                    return new AssignPermissionToRoleResult(true, "No new permission(s) to assign.");
                }

                var newPermissions = await _context.Permissions .Where(p => newPermissionIds.Contains(p.Id)).ToListAsync(cancellationToken);
               
                foreach (var permission in newPermissions)
            {
                role.RolePermissions.Add(new RolePermission { RoleId = role.Id, PermissionId = permission.Id });
            }

            var result = await _roleManager.UpdateAsync(role);
            if (!result.Succeeded)
            {
                _logger.LogError($"Failed to update role: {string.Join(", ", result.Errors.Select(e => e.Description))}");
                return new AssignPermissionToRoleResult(false, $"Failed to update role: {string.Join(", ", result.Errors.Select(e => e.Description))}");
            }

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation($"Assigned {newPermissions.Count} permissions to role {role.Name}.");
            return new AssignPermissionToRoleResult(true, $"Assigned {newPermissions.Count} permissions to role {role.Name}.");


       
            }catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                return new AssignPermissionToRoleResult(false, ex.Message);
            }   
        }
    }

     public record AssignPermissionToRoleResult(bool Success, string Message);

}
