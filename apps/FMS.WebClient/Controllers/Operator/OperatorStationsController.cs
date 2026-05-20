using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Common.Constants;
using FMS.Application.Features.Operator.DTOs;
using FMS.Application.Features.Operator.Stations;
using FMS.WebClient.Attributes;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers.Operator;

[ApiController]
[Authorize]
[AllowCrossTenant]
[Route("api/v1/operator/stations")]
public sealed class OperatorStationsController : ControllerBase
{
    private readonly IMediator _mediator;

    public OperatorStationsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [RequirePermission(Permissions.Platform.ReadTenant)]
    public async Task<ActionResult<FMSResponse<OperatorStationListPayload>>> GetStations(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] Guid? tenantId = null,
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null,
        CancellationToken cancellationToken = default)
    {
        var response = await _mediator.Send(
            new GetOperatorStationsQuery(pageNumber, pageSize, tenantId, search, isActive),
            cancellationToken);

        return this.ToActionResult(response);
    }

    [HttpPost]
    [RequirePermission(Permissions.Platform.ManageTenant)]
    public async Task<ActionResult<FMSResponse<OperatorStationSummaryDto>>> CreateStation(
        [FromBody] CreateOperatorStationRequest request,
        CancellationToken cancellationToken = default)
    {
        var response = await _mediator.Send(new CreateOperatorStationCommand(request), cancellationToken);
        return this.ToActionResult(response);
    }

    [HttpPatch("{stationId:int}")]
    [RequirePermission(Permissions.Platform.ManageTenant)]
    public async Task<ActionResult<FMSResponse<OperatorStationSummaryDto>>> UpdateStation(
        int stationId,
        [FromBody] UpdateOperatorStationRequest request,
        CancellationToken cancellationToken = default)
    {
        var response = await _mediator.Send(new UpdateOperatorStationCommand(stationId, request), cancellationToken);
        return this.ToActionResult(response);
    }
}
