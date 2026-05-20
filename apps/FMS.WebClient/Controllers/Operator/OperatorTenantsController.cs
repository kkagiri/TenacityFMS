using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Common.Constants;
using FMS.Application.Features.Operator.DTOs;
using FMS.Application.Features.Operator.Tenants;
using FMS.WebClient.Attributes;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers.Operator;

[ApiController]
[Authorize]
[AllowCrossTenant]
[Route("api/v1/operator/tenants")]
public class OperatorTenantsController : ControllerBase
{
    private readonly IMediator _mediator;

    public OperatorTenantsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [RequirePermission(Permissions.Platform.ReadTenant)]
    public async Task<ActionResult<FMSResponse<OperatorTenantListPayload>>> GetTenants(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] string? search = null,
        [FromQuery] string? tenantKind = null,
        [FromQuery] bool? isActive = null,
        CancellationToken cancellationToken = default)
    {
        var response = await _mediator.Send(
            new GetOperatorTenantsQuery(pageNumber, pageSize, search, tenantKind, isActive),
            cancellationToken);

        return this.ToActionResult(response);
    }

    [HttpGet("{tenantId:guid}")]
    [RequirePermission(Permissions.Platform.ReadTenant)]
    public async Task<ActionResult<FMSResponse<OperatorTenantDetailDto>>> GetTenant(
        Guid tenantId,
        CancellationToken cancellationToken = default)
    {
        var response = await _mediator.Send(new GetOperatorTenantByIdQuery(tenantId), cancellationToken);
        return this.ToActionResult(response);
    }

    [HttpPost]
    [RequirePermission(Permissions.Platform.ManageTenant)]
    public async Task<ActionResult<FMSResponse<OperatorTenantDetailDto>>> CreateTenant(
        [FromBody] CreateOperatorTenantRequest request,
        CancellationToken cancellationToken = default)
    {
        var response = await _mediator.Send(new CreateOperatorTenantCommand(request), cancellationToken);
        if (!response.IsSuccess || response.Data is null)
        {
            return this.ToActionResult(response);
        }

        return CreatedAtAction(
            nameof(GetTenant),
            new { tenantId = response.Data.Id },
            response);
    }
}
