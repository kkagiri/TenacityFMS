using FMS.Persistence.DataAccess;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Application.Queries.Database.FMSQuery.UserManagement.Permissions
{
    public class PermissionAuthorization : AuthorizationHandler<PermissionRequirement>
    {

        private readonly GpsdataContext _context;

        public PermissionAuthorization(GpsdataContext context)
        {
            _context = context;
        }
        protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
        {
            if (context.User == null)
            {
                return;
            }
            //retrive user permision from the database based on used ID and check against requirements . 

            var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            // Use dependency injection or a service to get permissions

            var userPermission =  await _context.Users
                .Where(u=>u.Id ==  userId)
                .SelectMany(u => u.UserRoles)
                .SelectMany(ur => ur.Role.RolePermissions)
                .Select(rp => rp.Permission.Name)   
                .Distinct().ToListAsync();


            if(userPermission.Contains(requirement.PermisisonName))
            {
                context.Succeed(requirement);
            }
        }
    }

    public class PermissionRequirement : IAuthorizationRequirement
    {
        public string PermisisonName { get; }

        public PermissionRequirement(string permissionName)
        {
            PermisisonName = permissionName;
        }
    }


}
