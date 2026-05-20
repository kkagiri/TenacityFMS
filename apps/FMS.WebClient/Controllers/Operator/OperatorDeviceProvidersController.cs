using System;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Common.Constants;
using FMS.Application.Features.Operator.DeviceProviders;
using FMS.Application.Features.Operator.DTOs;
using FMS.WebClient.Attributes;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers.Operator;

[ApiController]
[Authorize]
[AllowCrossTenant]
[Route("api/v1/operator/device-providers")]
public sealed class OperatorDeviceProvidersController : ControllerBase
{
    private readonly IMediator _mediator;

    public OperatorDeviceProvidersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [RequirePermission(Permissions.Platform.ReadDeviceProvider, Permissions.Platform.ManageDeviceProvider)]
    public async Task<ActionResult<FMSResponse<OperatorDeviceProviderListPayload>>> GetProviders(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] string? search = null,
        [FromQuery] Guid? tenantId = null,
        [FromQuery] string? tenantKind = null,
        [FromQuery] string? deviceCategory = null,
        [FromQuery] bool? isEnabled = null,
        CancellationToken cancellationToken = default)
    {
        var response = await _mediator.Send(
            new GetOperatorDeviceProvidersQuery(pageNumber, pageSize, search, tenantId, tenantKind, deviceCategory, isEnabled),
            cancellationToken);

        return this.ToActionResult(response);
    }

    [HttpPost]
    [RequirePermission(Permissions.Platform.ManageDeviceProvider)]
    public async Task<ActionResult<FMSResponse<OperatorDeviceProviderDto>>> CreateProvider(
        [FromBody] OperatorDeviceProviderCreateRequest request,
        CancellationToken cancellationToken = default)
    {
        var response = await _mediator.Send(
            new CreateOperatorDeviceProviderCommand(request, CurrentUserId()),
            cancellationToken);

        if (!response.IsSuccess || response.Data is null)
        {
            return this.ToActionResult(response);
        }

        return CreatedAtAction(
            nameof(GetProviders),
            new { providerId = response.Data.ProviderId },
            response);
    }

    [HttpPut("{providerId:int}")]
    [RequirePermission(Permissions.Platform.ManageDeviceProvider)]
    public async Task<ActionResult<FMSResponse<OperatorDeviceProviderDto>>> UpdateProvider(
        int providerId,
        [FromBody] OperatorDeviceProviderUpdateRequest request,
        CancellationToken cancellationToken = default)
    {
        var response = await _mediator.Send(
            new UpdateOperatorDeviceProviderCommand(providerId, request, CurrentUserId()),
            cancellationToken);

        return this.ToActionResult(response);
    }

    [HttpGet("mappings")]
    [RequirePermission(Permissions.Platform.ReadDeviceProvider, Permissions.Platform.ManageDeviceProvider)]
    public async Task<ActionResult<FMSResponse<OperatorDeviceProviderMappingListPayload>>> GetMappings(
        [FromQuery] int? providerId = null,
        [FromQuery] Guid? tenantId = null,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var response = await _mediator.Send(
            new GetOperatorDeviceProviderMappingsQuery(providerId, tenantId, search),
            cancellationToken);

        return this.ToActionResult(response);
    }

    private string? CurrentUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
}
