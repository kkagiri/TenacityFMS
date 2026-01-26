using FMS.Application.Common;
using FMS.Application.Features.VehicleMaintenance.Commands;
using FMS.Application.Features.VehicleMaintenance.DTOs;
using FMS.Application.Features.VehicleMaintenance.Queries;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;

namespace FMS.WebClient.Controllers.VehicleManagement;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public class VehicleMaintenanceController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IDistributedCache _cache;

    public VehicleMaintenanceController(IMediator mediator, IDistributedCache cache)
    {
        _mediator = mediator;
        _cache = cache;
    }

    /// <summary>
    /// Get all maintenance records with optional filters
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAllMaintenance(
        [FromQuery] int? vehicleId = null,
        [FromQuery] string? status = null,
        [FromQuery] int? siteId = null,
        [FromQuery] int? vehicleTypeId = null,
        [FromQuery] int? vehicleModelId = null)
    {
        var cacheKey = $"Maintenance:All:{vehicleId}:{status}:{siteId}:{vehicleTypeId}:{vehicleModelId}";
        var cachedData = await _cache.GetStringAsync(cacheKey);

        if (!string.IsNullOrEmpty(cachedData))
        {
            // Cache stores FMSResponse<List<VehicleMaintenanceDTO>> to avoid deserialization issues
            var cachedResponse = JsonSerializer.Deserialize<FMSResponse<List<VehicleMaintenanceDTO>>>(cachedData);
            return Ok(cachedResponse);
        }

        var query = new GetAllMaintenanceQuery(vehicleId, status, siteId, vehicleTypeId, vehicleModelId);
        var result = await _mediator.Send(query);

        // Cache for 5 minutes - store the full FMSResponse
        var cacheOptions = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
        };
        await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(result), cacheOptions);

        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get maintenance record by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetMaintenanceById(int id)
    {
        var cacheKey = $"Maintenance:{id}";
        var cachedData = await _cache.GetStringAsync(cacheKey);

        if (!string.IsNullOrEmpty(cachedData))
        {
            var cachedRecord = JsonSerializer.Deserialize<VehicleMaintenanceDTO>(cachedData);
            return Ok(cachedRecord);
        }

        var query = new GetMaintenanceByIdQuery(id);
        var maintenance = await _mediator.Send(query);

        if (maintenance == null)
        {
            return NotFound(new { message = $"Maintenance record with ID {id} not found" });
        }

        // Cache for 5 minutes
        var cacheOptions = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
        };
        await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(maintenance), cacheOptions);

        return Ok(maintenance);
    }

    /// <summary>
    /// Create new maintenance record
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateMaintenance([FromBody] VehicleMaintenanceDTO maintenanceDTO)
    {
        var command = new CreateMaintenanceCommand(maintenanceDTO);
        var result = await _mediator.Send(command);

        if (result.Success)
        {
            // Invalidate cache
            await InvalidateMaintenanceCache();
            return CreatedAtAction(nameof(GetMaintenanceById), new { id = result.Data?.MaintenanceId }, result);
        }

        return BadRequest(result);
    }

    /// <summary>
    /// Update existing maintenance record
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateMaintenance(int id, [FromBody] VehicleMaintenanceDTO maintenanceDTO)
    {
        if (id != maintenanceDTO.MaintenanceId)
        {
            return BadRequest(new { message = "ID mismatch" });
        }

        var command = new UpdateMaintenanceCommand(maintenanceDTO);
        var result = await _mediator.Send(command);

        if (result.Success)
        {
            // Invalidate cache
            await InvalidateMaintenanceCache();
            return Ok(result);
        }

        return BadRequest(result);
    }

    /// <summary>
    /// Delete maintenance record
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMaintenance(int id)
    {
        var command = new DeleteMaintenanceCommand(id);
        var result = await _mediator.Send(command);

        if (result.Success)
        {
            // Invalidate cache
            await InvalidateMaintenanceCache();
            return Ok(result);
        }

        return BadRequest(result);
    }

    /// <summary>
    /// Get maintenance dashboard statistics
    /// </summary>
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var cacheKey = "Maintenance:Dashboard";
        var cachedData = await _cache.GetStringAsync(cacheKey);

        if (!string.IsNullOrEmpty(cachedData))
        {
            var cachedDashboard = JsonSerializer.Deserialize<MaintenanceDashboardDTO>(cachedData);
            return Ok(cachedDashboard);
        }

        var query = new GetMaintenanceDashboardQuery();
        var dashboard = await _mediator.Send(query);

        // Cache for 10 minutes
        var cacheOptions = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10)
        };
        await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(dashboard), cacheOptions);

        return Ok(dashboard);
    }

    /// <summary>
    /// Get all maintenance schedules
    /// </summary>
    [HttpGet("schedules")]
    public async Task<IActionResult> GetAllSchedules([FromQuery] bool? isActive = null)
    {
        var cacheKey = $"Maintenance:Schedules:{isActive}";
        var cachedData = await _cache.GetStringAsync(cacheKey);

        if (!string.IsNullOrEmpty(cachedData))
        {
            var cachedSchedules = JsonSerializer.Deserialize<List<MaintenanceScheduleDTO>>(cachedData);
            return Ok(cachedSchedules);
        }

        var query = new GetAllMaintenanceSchedulesQuery(isActive);
        var schedules = await _mediator.Send(query);

        // Cache for 15 minutes
        var cacheOptions = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15)
        };
        await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(schedules), cacheOptions);

        return Ok(schedules);
    }

    /// <summary>
    /// Create new maintenance schedule
    /// </summary>
    [HttpPost("schedules")]
    public async Task<IActionResult> CreateSchedule([FromBody] MaintenanceScheduleDTO scheduleDTO)
    {
        var command = new CreateMaintenanceScheduleCommand(scheduleDTO);
        var result = await _mediator.Send(command);

        if (result.Success)
        {
            // Invalidate cache
            await InvalidateScheduleCache();
            return CreatedAtAction(nameof(GetAllSchedules), new { isActive = true }, result);
        }

        return BadRequest(result);
    }

    /// <summary>
    /// Update existing maintenance schedule
    /// </summary>
    [HttpPut("schedules/{id}")]
    public async Task<IActionResult> UpdateSchedule(int id, [FromBody] MaintenanceScheduleDTO scheduleDTO)
    {
        if (id != scheduleDTO.ScheduleId)
        {
            return BadRequest(new { message = "ID mismatch" });
        }

        var command = new UpdateMaintenanceScheduleCommand(scheduleDTO);
        var result = await _mediator.Send(command);

        if (result.Success)
        {
            // Invalidate cache
            await InvalidateScheduleCache();
            return Ok(result);
        }

        return BadRequest(result);
    }

    /// <summary>
    /// Invalidate all maintenance-related cache entries
    /// </summary>
    private async Task InvalidateMaintenanceCache()
    {
        await _cache.RemoveAsync("Maintenance:Dashboard");
        // Note: In production, you might want to implement a more sophisticated cache invalidation strategy
        // such as using cache tags or storing cache keys in a list
    }

    /// <summary>
    /// Invalidate schedule cache entries
    /// </summary>
    private async Task InvalidateScheduleCache()
    {
        // Remove schedule caches
        await _cache.RemoveAsync("Maintenance:Schedules:True");
        await _cache.RemoveAsync("Maintenance:Schedules:False");
        await _cache.RemoveAsync("Maintenance:Schedules:");
    }

    /// <summary>
    /// Get odometer comparison data for vehicles - compares GPS readings with stored values
    /// </summary>
    /// <param name="onlyWithDiscrepancies">If true, only return vehicles with significant discrepancies</param>
    /// <param name="discrepancyThreshold">Threshold in km/hours to consider as discrepancy (default: 100)</param>
    [HttpGet("odometer-comparison")]
    public async Task<IActionResult> GetOdometerComparison(
        [FromQuery] bool onlyWithDiscrepancies = false,
        [FromQuery] decimal discrepancyThreshold = 100)
    {
        var query = new GetAllVehicleOdometerStatusQuery(onlyWithDiscrepancies, discrepancyThreshold);
        var result = await _mediator.Send(query);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Import maintenance records from bulk data (Excel/CSV)
    /// </summary>
    [HttpPost("import")]
    public async Task<IActionResult> ImportMaintenanceRecords([FromBody] List<MaintenanceImportDTO> importRecords)
    {
        if (importRecords == null || importRecords.Count == 0)
        {
            return BadRequest(FMSResponse<object>.Failed("No records provided for import"));
        }

        var command = new ImportMaintenanceRecordsCommand(importRecords);
        var result = await _mediator.Send(command);

        if (result.IsSuccess)
        {
            // Invalidate cache
            await InvalidateMaintenanceCache();
            return Ok(result);
        }

        return BadRequest(result);
    }
}
