using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Common.Constants;
using FMS.Application.Features.Operator.Audit;
using FMS.Application.Features.Operator.DTOs;
using FMS.WebClient.Attributes;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers.Operator;

[ApiController]
[Authorize]
[AllowCrossTenant]
[Route("api/v1/operator/audit")]
public sealed class OperatorAuditController : ControllerBase
{
    private readonly IMediator _mediator;

    public OperatorAuditController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [RequirePermission(Permissions.Platform.ReadAudit)]
    public async Task<ActionResult<FMSResponse<OperatorAuditListPayload>>> List(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] Guid? tenantId = null,
        [FromQuery] string? userId = null,
        [FromQuery] string? action = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        CancellationToken cancellationToken = default)
    {
        var response = await _mediator.Send(
            new GetOperatorAuditQuery(pageNumber, pageSize, tenantId, userId, action, from, to),
            cancellationToken);

        return this.ToActionResult(response);
    }
}
