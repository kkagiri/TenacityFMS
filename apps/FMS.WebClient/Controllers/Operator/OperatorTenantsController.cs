/*
 * File:          OperatorTenantsController.cs
 * Purpose:       Cross-tenant tenant management endpoints for FMS.Admin
 *                platform operators.
 * Dependencies:  IMediator, AllowCrossTenant, RequirePermission
 * Last Modified: 2026-05-10
 *
 * Key Functions:
 * - GetTenants(): Lists tenants with paging, search, and filters.
 */
using FMS.Application.Common.Constants;
using FMS.Application.Features.MultiTenancy.Commands;
using FMS.Application.Features.MultiTenancy.Queries;
using FMS.Domain.Entities.Features.MultiTenancy;
using FMS.WebClient.Attributes;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers.Operator
{
    [ApiController]
    [Route("api/v1/operator/tenants")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [AllowCrossTenant]
    public sealed class OperatorTenantsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public OperatorTenantsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        public sealed record CreateOperatorTenantRequest(
            string Code,
            string Name,
            string? LogoUrl,
            string? PrimaryColor,
            string? SecondaryColor);

        public sealed record UpdateOperatorTenantStatusRequest(string Status);

        [HttpGet]
        [RequirePermission(Permissions.Platform.ReadTenant)]
        public async Task<IActionResult> GetTenants(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 25,
            [FromQuery] string? search = null,
            [FromQuery] TenantKind? tenantKind = null,
            [FromQuery] bool? isActive = null,
            CancellationToken cancellationToken = default)
        {
            var result = await _mediator.Send(
                new GetOperatorTenantsQuery(pageNumber, pageSize, search, tenantKind, isActive),
                cancellationToken);

            return Ok(result);
        }

        [HttpGet("{id:guid}")]
        [RequirePermission(Permissions.Platform.ReadTenant)]
        public async Task<IActionResult> GetTenant(Guid id, CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(new GetOperatorTenantDetailQuery(id), cancellationToken);
            return StatusCode(result.StatusCode, result);
        }

        [HttpPost]
        [RequirePermission(Permissions.Platform.ManageTenant)]
        public async Task<IActionResult> CreateTenant(
            [FromBody] CreateOperatorTenantRequest request,
            CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _mediator.Send(
                new CreateOperatorTenantCommand(
                    request.Code,
                    request.Name,
                    request.LogoUrl,
                    request.PrimaryColor,
                    request.SecondaryColor),
                cancellationToken);

            return StatusCode(result.StatusCode, result);
        }

        [HttpPatch("{id:guid}")]
        [RequirePermission(Permissions.Platform.ManageTenant)]
        public async Task<IActionResult> UpdateTenantStatus(
            Guid id,
            [FromBody] UpdateOperatorTenantStatusRequest request,
            CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _mediator.Send(
                new UpdateOperatorTenantStatusCommand(id, request.Status),
                cancellationToken);

            return StatusCode(result.StatusCode, result);
        }
    }
}