using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Common.Constants;
using FMS.Application.Features.Operator.DTOs;
using FMS.Application.Features.Operator.Reports;
using FMS.WebClient.Attributes;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers.Operator;

[ApiController]
[Authorize]
[AllowCrossTenant]
[Route("api/v1/operator/reports")]
public sealed class OperatorReportsController : ControllerBase
{
    private readonly IMediator _mediator;

    public OperatorReportsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("usage")]
    [RequirePermission(Permissions.Platform.ReadReports)]
    public async Task<ActionResult<FMSResponse<OperatorUsageReportPayload>>> GetUsage(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] Guid? tenantId = null,
        CancellationToken cancellationToken = default)
    {
        var response = await _mediator.Send(new GetOperatorUsageReportQuery(from, to, tenantId), cancellationToken);
        return this.ToActionResult(response);
    }
}
