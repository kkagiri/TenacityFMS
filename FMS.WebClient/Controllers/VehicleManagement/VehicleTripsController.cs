/// <summary>
/// File: VehicleTripsController.cs
/// Purpose: Exposes persisted vehicle trip history and manual trip recomputation APIs.
/// Dependencies: MediatR, FMSResponse, Vehicle trip CQRS handlers.
/// Last Modified: 2026-03-10
/// </summary>
using FMS.Application.Common.Constants;
using FMS.Application.Features.VehicleTrips.Commands;
using FMS.Application.Features.VehicleTrips.Queries;
using FMS.Domain.Entities;
using FMS.WebClient.Attributes;
using MediatR;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers;

[ApiController]
[Route("api/v1/vehicletrips")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
[RequirePermission(Permissions.Vehicle.Read)]
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
        [FromQuery] DateTime? fromUtc,
        [FromQuery] DateTime? toUtc,
        [FromQuery] VehicleMovementProfile? movementProfile,
        [FromQuery] string? detectionMode)
    {
        try
        {
            var result = await _mediator.Send(new GetVehicleTripsQuery
            {
                VehicleId = vehicleId,
                FromUtc = fromUtc,
                ToUtc = toUtc,
                MovementProfile = movementProfile,
                DetectionMode = detectionMode,
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
        [FromQuery] DateTime? fromUtc,
        [FromQuery] DateTime? toUtc)
    {
        try
        {
            var result = await _mediator.Send(new GetVehicleTripHistoryQuery
            {
                VehicleId = vehicleId,
                FromUtc = fromUtc,
                ToUtc = toUtc,
            });

            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading trip history for vehicle {VehicleId}", vehicleId);
            return StatusCode(500, new { Success = false, Message = "Internal server error" });
        }
    }

    [HttpPost("recompute")]
    [RequirePermission(Permissions.Vehicle.Edit)]
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
}
