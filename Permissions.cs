
public class Role
{
    public int Id { get; set; }
    public string Name { get; set; }
    public List<RolePermission> RolePermissions { get; set; }
}

public class Permission
{
    public int Id { get; set; }
    public string Name { get; set; }  // e.g., "edit_vehicle", "view_reports"
}

public class RolePermission
{
    public int RoleId { get; set; }
    public Role Role { get; set; }
    public int PermissionId { get; set; }
    public Permission Permission { get; set; }
}

public class UserRole
{
    public int UserId { get; set; }
    public User User { get; set; }
    public int RoleId { get; set; }
    public Role Role { get; set; }
}

public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        if (context.User == null)
        {
            return Task.CompletedTask;
        }

        // Retrieve user's permissions from the database based on the user ID and check against the requirement
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        // Use dependency injection or a service to get permissions
        var userPermissions = GetUserPermissionsFromDatabase(userId);

        if (userPermissions.Contains(requirement.PermissionName))
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}

public class PermissionRequirement : IAuthorizationRequirement
{
    public string PermissionName { get; }

    public PermissionRequirement(string permissionName)
    {
        PermissionName = permissionName;
    }
}


using MediatR;

namespace FMS.Application.Commands;

public record CreatePermissionCommand(string PermissionName) : IRequest<int>;

public class CreatePermissionCommandHandler : IRequestHandler<CreatePermissionCommand, int>
{
    private readonly GpsdataContext _context;

    public CreatePermissionCommandHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<int> Handle(CreatePermissionCommand request, CancellationToken cancellationToken)
    {
        var permission = new Permission { Name = request.PermissionName };
        _context.Permissions.Add(permission);
        await _context.SaveChangesAsync(cancellationToken);
        return permission.Id;
    }
}
using MediatR;

namespace FMS.Application.Commands;

public record UpdatePermissionCommand(int PermissionId, string NewName) : IRequest<bool>;

public class UpdatePermissionCommandHandler : IRequestHandler<UpdatePermissionCommand, bool>
{
    private readonly GpsdataContext _context;

    public UpdatePermissionCommandHandler(GpsdataContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(UpdatePermissionCommand request, CancellationToken cancellationToken)
    {
        var permission = await _context.Permissions.FindAsync(request.PermissionId);
        if (permission == null) return false;

        permission.Name = request.NewName;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}


using Microsoft.AspNetCore.Mvc;
using MediatR;

namespace FMS.WebClient.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PermissionsController : ControllerBase
{
    private readonly IMediator _mediator;

    public PermissionsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<IActionResult> CreatePermission([FromBody] string permissionName)
    {
        var id = await _mediator.Send(new CreatePermissionCommand(permissionName));
        return CreatedAtAction(nameof(GetPermission), new { id = id }, id);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePermission(int id, [FromBody] string newName)
    {
        var result = await _mediator.Send(new UpdatePermissionCommand(id, newName));
        if (!result)
        {
            return NotFound();
        }
        return NoContent();
    }

    // Additional methods for getting permissions, listing all permissions, etc.
}
using Microsoft.AspNetCore.Mvc;
using MediatR;

namespace FMS.WebClient.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RolePermissionsController : ControllerBase
{
    private readonly IMediator _mediator;

    public RolePermissionsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("assign")]
    public async Task<IActionResult> AssignPermissionToRole([FromBody] AssignPermissionToRoleCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result)
        {
            return BadRequest("Failed to assign permission to role");
        }
        return Ok();
    }

    [HttpPost("remove")]
    public async Task<IActionResult> RemovePermissionFromRole([FromBody] RemovePermissionFromRoleCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result)
        {
            return BadRequest("Failed to remove permission from role");
        }
        return Ok();
    }

    // Implement commands and handlers for AssignPermissionToRoleCommand and RemovePermissionFromRoleCommand
}
