/// <summary>
/// File: VehicleTripsController.cs
/// Purpose: Exposes persisted vehicle trip history and manual trip recomputation APIs.
/// Dependencies: MediatR, FMSResponse, Vehicle trip CQRS handlers.
/// Last Modified: 2026-03-10
/// </summary>
using FMS.Application.Common;
using FMS.Application.Common.Constants;
using FMS.Application.Features.VehicleTrips.Commands;
using FMS.Application.Features.VehicleTrips.DTOs;
using FMS.Application.Features.VehicleTrips.Queries;
using FMS.Domain.Entities;
using FMS.WebClient.Attributes;
using MediatR;
using System.Security.Claims;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers;

[ApiController]
[Route("api/v1/vehicletrips")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
[RequirePermission(Permissions.VehicleTrips.Read, Permissions.Vehicle.Read)]
public class VehicleTripsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<VehicleTripsController> _logger;

    public VehicleTripsController(IMediator mediator, ILogger<VehicleTripsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetVehicleTrips(
        [FromQuery] int? vehicleId,
        [FromQuery] int? siteId,
        [FromQuery] DateTime? fromUtc,
        [FromQuery] DateTime? toUtc,
        [FromQuery] VehicleMovementProfile? movementProfile,
        [FromQuery] string? detectionMode,
        [FromQuery] decimal? minimumConfidenceScore,
        [FromQuery] bool? isLowConfidence,
        [FromQuery] VehicleTripStatus? status,
        [FromQuery] VehicleTripGroupingType? groupingType,
        [FromQuery] VehicleTripReconciliationStatus? reconciliationStatus)
    {
        try
        {
            var result = await _mediator.Send(new GetVehicleTripsQuery
            {
                VehicleId = vehicleId,
                SiteId = siteId,
                FromUtc = fromUtc,
                ToUtc = toUtc,
                MovementProfile = movementProfile,
                DetectionMode = detectionMode,
                MinimumConfidenceScore = minimumConfidenceScore,
                IsLowConfidence = isLowConfidence,
                Status = status,
                GroupingType = groupingType,
                ReconciliationStatus = reconciliationStatus,
            });

            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading vehicle trips list");
            return StatusCode(500, new { Success = false, Message = "Internal server error" });
        }
    }

    [HttpGet("vehicle/{vehicleId:int}")]
    public async Task<IActionResult> GetVehicleTripHistory(
        int vehicleId,
        [FromQuery] int? siteId,
        [FromQuery] DateTime? fromUtc,
        [FromQuery] DateTime? toUtc,
        [FromQuery] decimal? minimumConfidenceScore,
        [FromQuery] VehicleTripStatus? status,
        [FromQuery] VehicleTripGroupingType? groupingType,
        [FromQuery] VehicleTripReconciliationStatus? reconciliationStatus)
    {
        try
        {
            var result = await _mediator.Send(new GetVehicleTripHistoryQuery
            {
                VehicleId = vehicleId,
                SiteId = siteId,
                FromUtc = fromUtc,
                ToUtc = toUtc,
                MinimumConfidenceScore = minimumConfidenceScore,
                Status = status,
                GroupingType = groupingType,
                ReconciliationStatus = reconciliationStatus,
            });

            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading trip history for vehicle {VehicleId}", vehicleId);
            return StatusCode(500, new { Success = false, Message = "Internal server error" });
        }
    }

    [HttpGet("{vehicleTripGroupId:int}")]
    public async Task<IActionResult> GetVehicleTripDetail(int vehicleTripGroupId)
    {
        try
        {
            var result = await _mediator.Send(new GetVehicleTripDetailQuery
            {
                VehicleTripGroupId = vehicleTripGroupId,
            });

            if (result.IsSuccess) return Ok(result);
            if (result.StatusCode == 404) return NotFound(result);
            return BadRequest(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading trip detail for group {VehicleTripGroupId}", vehicleTripGroupId);
            return StatusCode(500, new { Success = false, Message = "Internal server error" });
        }
    }

    [HttpGet("{vehicleTripGroupId:int}/breadcrumbs")]
    public async Task<IActionResult> GetVehicleTripBreadcrumbs(int vehicleTripGroupId, [FromQuery] int maxPoints = 2000)
    {
        try
        {
            var result = await _mediator.Send(new GetVehicleTripBreadcrumbsQuery
            {
                VehicleTripGroupId = vehicleTripGroupId,
                MaxPoints = maxPoints,
            });

            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading trip breadcrumbs for group {VehicleTripGroupId}", vehicleTripGroupId);
            return StatusCode(500, new { Success = false, Message = "Internal server error" });
        }
    }

    [HttpGet("in-progress")]
    public async Task<IActionResult> GetInProgressTrips([FromQuery] int? vehicleId, [FromQuery] int? siteId)
    {
        try
        {
            var result = await _mediator.Send(new GetInProgressVehicleTripsQuery
            {
                VehicleId = vehicleId,
                SiteId = siteId,
            });

            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading in-progress trips");
            return StatusCode(500, new { Success = false, Message = "Internal server error" });
        }
    }

    [HttpGet("reports/live-operations")]
    public async Task<IActionResult> GetLiveTripOperationsReport(
        [FromQuery] int? vehicleId,
        [FromQuery] int? siteId,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] int? idleThresholdMinutes)
    {
        try
        {
            var result = await _mediator.Send(new GetVehicleTripLiveOperationsReportQuery
            {
                VehicleId = vehicleId,
                SiteId = siteId,
                StartDate = startDate,
                EndDate = endDate,
                IdleThresholdMinutes = idleThresholdMinutes ?? 15,
            });

            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading live trip operations report data");
            return StatusCode(500, new { Success = false, Message = "Internal server error" });
        }
    }

    [HttpGet("rules/evaluate")]
    public async Task<IActionResult> EvaluateTripRules([FromQuery] int? vehicleId, [FromQuery] DateTime? fromUtc, [FromQuery] DateTime? toUtc)
    {
        try
        {
            var result = await _mediator.Send(new GetVehicleTripRuleEvaluationQuery
            {
                VehicleId = vehicleId,
                FromUtc = fromUtc,
                ToUtc = toUtc,
            });

            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error evaluating vehicle trip rules");
            return StatusCode(500, new { Success = false, Message = "Internal server error" });
        }
    }

    [HttpGet("reconciliation/summary")]
    public async Task<IActionResult> GetVehicleReconciliationSummary([FromQuery] int? vehicleId, [FromQuery] DateTime? fromUtc, [FromQuery] DateTime? toUtc)
    {
        try
        {
            var result = await _mediator.Send(new GetVehicleTripReconciliationSummaryQuery
            {
                VehicleId = vehicleId,
                FromUtc = fromUtc,
                ToUtc = toUtc,
            });

            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading vehicle reconciliation summary");
            return StatusCode(500, new { Success = false, Message = "Internal server error" });
        }
    }

    [HttpPost("recompute")]
    [RequirePermission(Permissions.VehicleTrips.Edit, Permissions.Vehicle.Edit)]
    public async Task<IActionResult> RecomputeVehicleTrips([FromBody] RecomputeVehicleTripsCommand command)
    {
        try
        {
            var result = await _mediator.Send(command);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recomputing trips for vehicle {VehicleId}", command.VehicleId);
            return StatusCode(500, new { Success = false, Message = "Internal server error" });
        }
    }

    [HttpPost("recompute/batch")]
    [RequirePermission(Permissions.VehicleTrips.Edit, Permissions.Vehicle.Edit)]
    public async Task<IActionResult> BatchRecomputeVehicleTrips([FromBody] BatchRecomputeVehicleTripsCommand command)
    {
        try
        {
            var result = await _mediator.Send(command);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in batch recompute (VehicleTypeId={VehicleTypeId}, SiteId={SiteId}, VehicleId={VehicleId})",
                command.VehicleTypeId, command.SiteId, command.VehicleId);
            return StatusCode(500, new { Success = false, Message = "Internal server error" });
        }
    }

    [HttpPost("reconciliation")]
    [RequirePermission(Permissions.VehicleTrips.Edit, Permissions.Vehicle.Edit)]
    public async Task<IActionResult> ReconcileVehicleTrips([FromBody] ReconcileVehicleTripsCommand command)
    {
        try
        {
            var result = await _mediator.Send(command);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reconciling trips for vehicle {VehicleId}", command.VehicleId);
            return StatusCode(500, new { Success = false, Message = "Internal server error" });
        }
    }

    [HttpPost("reconciliation/batch")]
    [RequirePermission(Permissions.VehicleTrips.Edit, Permissions.Vehicle.Edit)]
    public async Task<IActionResult> BatchReconcileVehicleTrips([FromBody] BatchReconcileVehicleTripsCommand command)
    {
        try
        {
            var result = await _mediator.Send(command);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in batch reconciliation (VehicleTypeId={VehicleTypeId}, SiteId={SiteId}, VehicleId={VehicleId})",
                command.VehicleTypeId, command.SiteId, command.VehicleId);
            return StatusCode(500, new { Success = false, Message = "Internal server error" });
        }
    }

    [HttpGet("settings")]
    public async Task<IActionResult> GetVehicleTripSettings()
    {
        try
        {
            var result = await _mediator.Send(new GetVehicleTripSettingsQuery());
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading vehicle trip settings");
            return StatusCode(500, new { Success = false, Message = "Internal server error" });
        }
    }

    [HttpPut("settings")]
    [RequirePermission(Permissions.VehicleTrips.Edit, Permissions.Vehicle.Edit)]
    public async Task<IActionResult> UpdateVehicleTripSettings([FromBody] UpdateVehicleTripSettingsCommand command)
    {
        try
        {
            command.UpdatedBy = User.Identity?.Name
                ?? User.FindFirstValue(ClaimTypes.Name)
                ?? User.FindFirstValue("username")
                ?? "System";

            var result = await _mediator.Send(command);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating vehicle trip settings");
            return StatusCode(500, new { Success = false, Message = "Internal server error" });
        }
    }

    [HttpPost("override/split")]
    [RequirePermission(Permissions.VehicleTrips.Edit, Permissions.Vehicle.Edit)]
    public async Task<IActionResult> SplitVehicleTrip([FromBody] SplitVehicleTripCommand command)
    {
        HydrateAuditMetadata(command);
        return await ExecuteOverrideAsync(command);
    }

    [HttpPost("override/merge")]
    [RequirePermission(Permissions.VehicleTrips.Edit, Permissions.Vehicle.Edit)]
    public async Task<IActionResult> MergeVehicleTrips([FromBody] MergeVehicleTripsCommand command)
    {
        HydrateAuditMetadata(command);
        return await ExecuteOverrideAsync(command);
    }

    [HttpPost("override/reassign-site")]
    [RequirePermission(Permissions.VehicleTrips.Edit, Permissions.Vehicle.Edit)]
    public async Task<IActionResult> ReassignVehicleTripSite([FromBody] ReassignVehicleTripSiteCommand command)
    {
        HydrateAuditMetadata(command);
        return await ExecuteOverrideAsync(command);
    }

    [HttpPost("override/add")]
    [RequirePermission(Permissions.VehicleTrips.Edit, Permissions.Vehicle.Edit)]
    public async Task<IActionResult> AddVehicleTrip([FromBody] AddVehicleTripCommand command)
    {
        HydrateAuditMetadata(command);
        return await ExecuteOverrideAsync(command);
    }

    [HttpPost("override/delete")]
    [RequirePermission(Permissions.VehicleTrips.Edit, Permissions.Vehicle.Edit)]
    public async Task<IActionResult> DeleteVehicleTrip([FromBody] DeleteVehicleTripCommand command)
    {
        HydrateAuditMetadata(command);
        return await ExecuteOverrideAsync(command);
    }

    [HttpPost("override/adjust-times")]
    [RequirePermission(Permissions.VehicleTrips.Edit, Permissions.Vehicle.Edit)]
    public async Task<IActionResult> AdjustVehicleTripTimes([FromBody] AdjustVehicleTripTimesCommand command)
    {
        HydrateAuditMetadata(command);
        return await ExecuteOverrideAsync(command);
    }

    [HttpGet("{vehicleTripGroupId:int}/overrides")]
    public async Task<IActionResult> GetVehicleTripOverrideHistory(int vehicleTripGroupId, [FromQuery] int? vehicleTripId)
    {
        try
        {
            var result = await _mediator.Send(new GetVehicleTripOverrideHistoryQuery
            {
                VehicleTripGroupId = vehicleTripGroupId,
                VehicleTripId = vehicleTripId,
            });

            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading trip override history for group {VehicleTripGroupId}", vehicleTripGroupId);
            return StatusCode(500, new { Success = false, Message = "Internal server error" });
        }
    }

    private async Task<IActionResult> ExecuteOverrideAsync<TCommand>(TCommand command)
        where TCommand : VehicleTripManualOverrideCommandBase
    {
        try
        {
            var result = await _mediator.Send(command);
            return result is FMSResponse response && response.IsSuccess ? Ok(result) : BadRequest(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error applying manual vehicle trip override");
            return StatusCode(500, new { Success = false, Message = "Internal server error" });
        }
    }

    private void HydrateAuditMetadata(VehicleTripManualOverrideCommandBase command)
    {
        command.RequestedByUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        command.RequestedByName = User.Identity?.Name ?? User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue("username");
        command.RequestIpAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
    }
}
