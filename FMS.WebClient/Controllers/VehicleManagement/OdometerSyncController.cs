using FMS.Application.Common;
using FMS.Application.Features.VehicleMaintenance.Commands;
using FMS.Application.Features.VehicleMaintenance.DTOs;
using FMS.Application.Features.VehicleMaintenance.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace FMS.WebClient.Controllers.VehicleManagement;

/// <summary>
/// API Controller for Odometer/Engine Hours synchronization between GPS and maintenance data
/// </summary>
[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class OdometerSyncController : ControllerBase
{
    private readonly IMediator _mediator;

    public OdometerSyncController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get odometer/engine hours status for a specific vehicle
    /// Returns readings from GPS, FuelRefill, PumpTransaction, and stored database value
    /// </summary>
    /// <param name="vehicleId">Vehicle ID</param>
    [HttpGet("{vehicleId}")]
    [ProducesResponseType(typeof(FMSResponse<OdometerSyncDTO>), 200)]
    public async Task<IActionResult> GetVehicleOdometerStatus(int vehicleId)
    {
        var query = new GetVehicleOdometerStatusQuery(vehicleId);
        var result = await _mediator.Send(query);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get odometer status for all vehicles with GPS mappings
    /// </summary>
    /// <param name="onlyOutOfSync">If true, only return vehicles where readings differ significantly</param>
    [HttpGet]
    [ProducesResponseType(typeof(FMSResponse<System.Collections.Generic.List<OdometerSyncDTO>>), 200)]
    public async Task<IActionResult> GetAllVehicleOdometerStatus([FromQuery] bool onlyOutOfSync = false)
    {
        var query = new GetAllVehicleOdometerStatusQuery(onlyOutOfSync);
        var result = await _mediator.Send(query);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Sync a vehicle's odometer FROM GPS TO the database
    /// Updates Vehicle.CurrentPhysicalReading with the latest GPS accumulator value
    /// </summary>
    /// <param name="vehicleId">Vehicle ID</param>
    [HttpPost("{vehicleId}/sync-from-gps")]
    [ProducesResponseType(typeof(FMSResponse<OdometerSyncResultDTO>), 200)]
    public async Task<IActionResult> SyncFromGPS(int vehicleId)
    {
        var command = new SyncOdometerFromGPSCommand(vehicleId);
        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Sync a vehicle's odometer FROM fueling data TO GPS
    /// Updates GPSGate accumulator with the latest FuelRefill/PumpTransaction reading
    /// </summary>
    /// <param name="vehicleId">Vehicle ID</param>
    [HttpPost("{vehicleId}/sync-to-gps")]
    [ProducesResponseType(typeof(FMSResponse<OdometerSyncResultDTO>), 200)]
    public async Task<IActionResult> SyncToGPS(int vehicleId)
    {
        var command = new SyncOdometerToGPSCommand(vehicleId);
        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Manually set a vehicle's odometer reading
    /// Optionally syncs to GPS
    /// </summary>
    /// <param name="vehicleId">Vehicle ID</param>
    /// <param name="request">Odometer update request</param>
    [HttpPost("{vehicleId}/set")]
    [ProducesResponseType(typeof(FMSResponse<OdometerSyncResultDTO>), 200)]
    public async Task<IActionResult> SetOdometer(int vehicleId, [FromBody] SetOdometerRequest request)
    {
        var userId = User.Identity?.Name;
        var command = new SetVehicleOdometerCommand(vehicleId, request.Reading, request.SyncToGPS, userId);
        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Batch sync all vehicles' odometers from GPS
    /// </summary>
    /// <param name="onlyOutOfSync">If true, only sync vehicles where readings differ significantly</param>
    [HttpPost("batch-sync")]
    [ProducesResponseType(typeof(FMSResponse<OdometerBatchSyncResultDTO>), 200)]
    public async Task<IActionResult> BatchSyncFromGPS([FromQuery] bool onlyOutOfSync = true)
    {
        var command = new BatchSyncOdometerFromGPSCommand(onlyOutOfSync);
        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }
}

/// <summary>
/// Request model for setting odometer manually
/// </summary>
public class SetOdometerRequest
{
    /// <summary>
    /// New odometer/engine hours reading in display units (km or hr)
    /// </summary>
    public decimal Reading { get; set; }

    /// <summary>
    /// If true, also update the GPS accumulator with this value
    /// </summary>
    public bool SyncToGPS { get; set; } = false;
}
