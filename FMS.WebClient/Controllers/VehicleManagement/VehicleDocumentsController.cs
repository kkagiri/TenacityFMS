/**
 * File: VehicleDocumentsController.cs
 * Purpose: Handles vehicle document CRUD and expiration query endpoints.
 * Dependencies: MediatR vehicle document commands/queries, FMSResponse, JWT claims.
 * Last Modified: 2026-02-04
 *
 * Key Actions:
 * - CreateVehicleDocument(): Creates vehicle documents with user context.
 * - UpdateVehicleDocument(): Updates document metadata/files.
 * - GetExpiringDocuments(): Returns documents nearing expiry.
 */
using FMS.Application.Common;
using FMS.Application.Features.VehicleDocumentManagement.Commands;
using FMS.Application.Features.VehicleDocumentManagement.Dtos;
using FMS.Application.Features.VehicleDocumentManagement.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using FMS.WebClient.Attributes;
using FMS.Application.Common.Constants;

namespace FMS.WebClient.Controllers.VehicleManagement;

[ApiController]
[Route("api/v1/vehicledocuments")]
[Authorize]
[RequirePermission(Permissions.Vehicle.Read)]
public class VehicleDocumentsController : ControllerBase
{
    private readonly IMediator _mediator;

    public VehicleDocumentsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private bool TryGetCurrentUserId(out string userId)
    {
        userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? string.Empty;

        return Guid.TryParse(userId, out _);
    }

    private ActionResult<TResponse> CreateResponse<TResponse>(TResponse result) where TResponse : FMSResponse
    {
        var statusCode = result?.StatusCode > 0
            ? result.StatusCode
            : result?.IsSuccess == false
                ? StatusCodes.Status400BadRequest
                : StatusCodes.Status200OK;

        return StatusCode(statusCode, result);
    }

    [HttpGet]
    public async Task<ActionResult<FMSResponse<List<VehicleDocumentDto>>>> GetVehicleDocuments([FromQuery] GetVehicleDocumentsQuery query)
    {
        var result = await _mediator.Send(query);
        return CreateResponse(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<FMSResponse<VehicleDocumentDto>>> GetVehicleDocumentById(Guid id)
    {
        var result = await _mediator.Send(new GetVehicleDocumentByIdQuery(id));
        return CreateResponse(result);
    }

    [HttpPost]
    public async Task<ActionResult<FMSResponse<VehicleDocumentDto>>> CreateVehicleDocument([FromForm] CreateVehicleDocumentDto createVehicleDocumentDto)
    {


        string? userId = TryGetCurrentUserId(out var currentUserId) ? currentUserId : null;
        createVehicleDocumentDto.UserId = userId;


        var result = await _mediator.Send(new CreateVehicleDocumentCommand(createVehicleDocumentDto));
        return CreateResponse(result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<FMSResponse<bool>>> UpdateVehicleDocument(Guid id, [FromForm] UpdateVehicleDocumentDto updateVehicleDocumentDto)
    {
        if (id != updateVehicleDocumentDto.Id)
        {
            return BadRequest("ID mismatch");
        }
        var result = await _mediator.Send(new UpdateVehicleDocumentCommand(updateVehicleDocumentDto));
        return CreateResponse(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<FMSResponse<bool>>> DeleteVehicleDocument(Guid id)
    {
        var result = await _mediator.Send(new DeleteVehicleDocumentCommand(id));
        return CreateResponse(result);
    }

    [HttpGet("vehicle/{vehicleId}")]
    public async Task<ActionResult<FMSResponse<List<VehicleDocumentDto>>>> GetVehicleDocumentsByVehicleId(int vehicleId)
    {
        var result = await _mediator.Send(new GetVehicleDocumentsByVehicleIdQuery(vehicleId));
        return CreateResponse(result);
    }

    [HttpGet("expiring")]
    public async Task<ActionResult<FMSResponse<List<VehicleDocumentDto>>>> GetExpiringDocuments([FromQuery] GetExpiringDocumentsQuery query)
    {
        var result = await _mediator.Send(query);
        return CreateResponse(result);
    }

    [HttpGet("compliance/requirements")]
    public async Task<ActionResult<FMSResponse<List<VehicleComplianceRequirementDto>>>> GetComplianceRequirements()
    {
        var result = await _mediator.Send(new GetVehicleComplianceRequirementsQuery());
        return CreateResponse(result);
    }

    [HttpGet("settings/issuing-authorities")]
    public async Task<ActionResult<FMSResponse<List<VehicleDocumentIssuingAuthorityDto>>>> GetIssuingAuthorities()
    {
        var result = await _mediator.Send(new GetVehicleDocumentIssuingAuthoritiesQuery());
        return CreateResponse(result);
    }

    [HttpPost("settings/issuing-authorities")]
    public async Task<ActionResult<FMSResponse<bool>>> CreateIssuingAuthority([FromBody] CreateVehicleDocumentIssuingAuthorityDto request)
    {
        var result = await _mediator.Send(new CreateVehicleDocumentIssuingAuthorityCommand(request));
        return CreateResponse(result);
    }

    [HttpGet("settings/reminder-defaults/current-user")]
    public async Task<ActionResult<FMSResponse<List<VehicleDocumentUserPreferenceDto>>>> GetCurrentUserReminderDefaults()
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return CreateResponse(FMSResponse<List<VehicleDocumentUserPreferenceDto>>.Unauthorized(message: "User not authenticated."));
        }

        var result = await _mediator.Send(new GetVehicleDocumentUserPreferencesQuery(userId));
        return CreateResponse(result);
    }

    [HttpPut("settings/reminder-defaults/current-user")]
    public async Task<ActionResult<FMSResponse<List<VehicleDocumentUserPreferenceDto>>>> SaveCurrentUserReminderDefaults([FromBody] SaveVehicleDocumentUserPreferencesDto request)
    {
        if (!TryGetCurrentUserId(out var userId))
        {
            return CreateResponse(FMSResponse<List<VehicleDocumentUserPreferenceDto>>.Unauthorized(message: "User not authenticated."));
        }

        request.UserId = userId;
        var result = await _mediator.Send(new SaveVehicleDocumentUserPreferencesCommand(request));
        return CreateResponse(result);
    }

    [HttpPut("settings/issuing-authorities")]
    public async Task<ActionResult<FMSResponse<bool>>> RenameIssuingAuthority([FromBody] RenameVehicleDocumentIssuingAuthorityDto request)
    {
        var result = await _mediator.Send(new RenameVehicleDocumentIssuingAuthorityCommand(request));
        return CreateResponse(result);
    }

    [HttpPost("settings/issuing-authorities/delete")]
    public async Task<ActionResult<FMSResponse<bool>>> DeleteIssuingAuthority([FromBody] DeleteVehicleDocumentIssuingAuthorityDto request)
    {
        var result = await _mediator.Send(new DeleteVehicleDocumentIssuingAuthorityCommand(request));
        return CreateResponse(result);
    }

    [HttpPost("compliance/requirements/bulk")]
    public async Task<ActionResult<FMSResponse<VehicleComplianceBulkAssignmentResultDto>>> BulkCreateComplianceRequirements([FromBody] VehicleComplianceBulkAssignmentDto bulkAssignmentDto)
    {
        string? userId = TryGetCurrentUserId(out var currentUserId) ? currentUserId : null;
        bulkAssignmentDto.UserId = userId;

        var result = await _mediator.Send(new BulkCreateVehicleComplianceRequirementsCommand(bulkAssignmentDto));
        return CreateResponse(result);
    }

    [HttpGet("compliance/dashboard")]
    public async Task<ActionResult<FMSResponse<VehicleComplianceDashboardDto>>> GetComplianceDashboard()
    {
        var result = await _mediator.Send(new GetVehicleComplianceDashboardQuery());
        return CreateResponse(result);
    }

    [HttpGet("report")]
    public async Task<ActionResult<FMSResponse<List<VehicleDocumentReportRowDto>>>> GetVehicleDocumentReport([FromQuery] GetVehicleDocumentReportQuery query)
    {
        var result = await _mediator.Send(query);
        return CreateResponse(result);
    }
}
