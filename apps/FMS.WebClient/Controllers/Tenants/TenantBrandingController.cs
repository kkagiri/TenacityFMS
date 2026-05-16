/*
 * File:          TenantBrandingController.cs
 * Purpose:       Tenant-scoped white-label branding endpoints for fms.frontend.
 * Dependencies:  MediatR, FMSResponse, MultiTenancy CQRS requests
 * Last Modified: 2026-05-16
 */
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Common.Constants;
using FMS.Application.Features.MultiTenancy.Commands;
using FMS.Application.Features.MultiTenancy.DTOs;
using FMS.Application.Features.MultiTenancy.Queries;
using FMS.WebClient.Attributes;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers.Tenants;

[ApiController]
[Authorize]
[Route("api/v1/tenant/branding")]
public sealed class TenantBrandingController : ControllerBase
{
    private readonly IMediator _mediator;

    public TenantBrandingController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<FMSResponse<TenantBrandingDto>>> Get(CancellationToken cancellationToken)
    {
        var response = await _mediator.Send(new GetTenantBrandingQuery(), cancellationToken);

        if (!response.IsSuccess && string.Equals(response.ErrorCode, "UNAUTHORIZED", System.StringComparison.OrdinalIgnoreCase))
        {
            return Unauthorized(response);
        }

        if (!response.IsSuccess && string.Equals(response.ErrorCode, "TENANT_NOT_FOUND", System.StringComparison.OrdinalIgnoreCase))
        {
            return NotFound(response);
        }

        return Ok(response);
    }

    [HttpPatch]
    [RequirePermission(Permissions.MultiTenancy.ManageBranding)]
    public async Task<ActionResult<FMSResponse<TenantBrandingDto>>> Patch(
        [FromBody] UpdateTenantBrandingRequestDto? request,
        CancellationToken cancellationToken)
    {
        var response = await _mediator.Send(
            new UpdateTenantBrandingCommand(
                request?.LogoUrl,
                request?.PrimaryColor,
                request?.SecondaryColor),
            cancellationToken);

        if (response.IsSuccess)
        {
            return Ok(response);
        }

        return response.ErrorCode switch
        {
            "UNAUTHORIZED" => Unauthorized(response),
            "FORBIDDEN" or "CUSTOMER_TENANT_RESTRICTED" => StatusCode(403, response),
            "TENANT_NOT_FOUND" => NotFound(response),
            "VALIDATION_FAILED" => BadRequest(response),
            _ => BadRequest(response),
        };
    }
}
