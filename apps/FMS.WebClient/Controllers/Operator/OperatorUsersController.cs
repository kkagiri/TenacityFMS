using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Common.Constants;
using FMS.Application.Features.Operator.DTOs;
using FMS.Application.Features.Operator.Users;
using FMS.WebClient.Attributes;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers.Operator;

[ApiController]
[Authorize]
[AllowCrossTenant]
[Route("api/v1/operator/users")]
public sealed class OperatorUsersController : ControllerBase
{
    private readonly IMediator _mediator;

    public OperatorUsersController(IMediator mediator)
    {
        _mediator = mediator;
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
        var response = await _mediator.Send(
            new GetOperatorUsersQuery(pageNumber, pageSize, search, isActive),
            cancellationToken);

        return this.ToActionResult(response);
    }

    [HttpGet("{id}")]
    [RequirePermission(Permissions.Platform.ReadOperators)]
    public async Task<ActionResult<FMSResponse<OperatorUserDetailDto>>> GetById(
        string id,
        CancellationToken cancellationToken)
    {
        var response = await _mediator.Send(new GetOperatorUserByIdQuery(id), cancellationToken);
        return this.ToActionResult(response);
    }

    [HttpPost]
    [RequirePermission(Permissions.Platform.ManageOperators)]
    public async Task<ActionResult<FMSResponse<OperatorUserDetailDto>>> Create(
        [FromBody] CreateOperatorUserRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _mediator.Send(new CreateOperatorUserCommand(request), cancellationToken);
        if (!response.IsSuccess || response.Data is null)
        {
            return this.ToActionResult(response);
        }

        return CreatedAtAction(
            nameof(GetById),
            new { id = response.Data.Id },
            response);
    }

    [HttpPatch("{id}")]
    [RequirePermission(Permissions.Platform.ManageOperators)]
    public async Task<ActionResult<FMSResponse<OperatorUserDetailDto>>> Patch(
        string id,
        [FromBody] PatchOperatorUserRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _mediator.Send(new PatchOperatorUserCommand(id, request), cancellationToken);
        return this.ToActionResult(response);
    }
}
