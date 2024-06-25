using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using FMS.Persistence.DataAccess;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Util;

public class PermissionHandler : AuthorizationHandler<PermissionRequirements>
{
    private readonly GpsdataContext _context;
    public  PermissionHandler(GpsdataContext context)
    {
        _context = context;
    }

    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirements requirement)
    {
       if (context.User == null)
        {
            return;
        }

        var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return;
        }

        var userRoles = await _context.UserRoles.Where(ur => ur.UserId == userId).Select(ur => ur.RoleId).ToListAsync();
        if (!userRoles.Any())
        {
            return;
        }

        var permissions = await _context.RolePermissions
            .Where(rp => userRoles.Contains(rp.RoleId))
            .Select(rp => rp.Permission.Name)
            .ToListAsync();

        if (permissions.Contains(requirement.Permission))
        {
            context.Succeed(requirement);
        }
    }
}