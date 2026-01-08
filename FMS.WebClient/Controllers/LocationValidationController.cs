using System.Threading.Tasks;
using FMS.Application.Features.LocationValidation.DTOs;
using FMS.Application.Features.LocationValidation.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace FMS.WebClient.Controllers;

/// <summary>
/// Controller for viewing location validation logs
/// </summary>
[Authorize]
[ApiController]
[Route("api/v1/[controller]")]
public class LocationValidationController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<LocationValidationController> _logger;

    public LocationValidationController(IMediator mediator, ILogger<LocationValidationController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Get paginated list of location validation logs with optional filtering
    /// </summary>
    /// <param name="startDate">Filter by start date</param>
    /// <param name="endDate">Filter by end date</param>
    /// <param name="ptsId">Filter by PTS device ID</param>
    /// <param name="tankId">Filter by tank ID</param>
    /// <param name="vehicleId">Filter by vehicle ID</param>
    /// <param name="isValid">Filter by validation result (true/false)</param>
    /// <param name="validationResult">Filter by validation result type (Passed, Failed, Bypassed, Skipped)</param>
    /// <param name="pageNumber">Page number (default: 1)</param>
    /// <param name="pageSize">Page size (default: 50)</param>
    /// <returns>Paginated list of location validation logs</returns>
    [HttpGet("logs")]
    public async Task<IActionResult> GetLogs(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] string? ptsId = null,
        [FromQuery] int? tankId = null,
        [FromQuery] int? vehicleId = null,
        [FromQuery] bool? isValid = null,
        [FromQuery] string? validationResult = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50)
    {
        var filter = new LocationValidationLogFilter
        {
            StartDate = startDate,
            EndDate = endDate,
            PtsId = ptsId,
            TankId = tankId,
            VehicleId = vehicleId,
            IsValid = isValid,
            ValidationResult = validationResult,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        var result = await _mediator.Send(new GetLocationValidationLogsQuery(filter));

        if (result.IsSuccess)
        {
            return Ok(result);
        }

        return BadRequest(result);
    }

    /// <summary>
    /// Get a single location validation log by ID
    /// </summary>
    /// <param name="id">The log ID</param>
    /// <returns>The location validation log details</returns>
    [HttpGet("logs/{id:int}")]
    public async Task<IActionResult> GetLogById(int id)
    {
        var result = await _mediator.Send(new GetLocationValidationLogByIdQuery(id));

        if (result.IsSuccess)
        {
            return Ok(result);
        }

        if (result.ErrorType == Application.Common.ErrorType.NotFound)
        {
            return NotFound(result);
        }

        return BadRequest(result);
    }
}
