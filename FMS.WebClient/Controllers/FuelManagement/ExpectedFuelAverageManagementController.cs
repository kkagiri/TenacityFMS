using FMS.Application.Common;
using FMS.Application.Features.ExpectedFuelAverage.Commands;
using FMS.Application.Features.ExpectedFuelAverage.DTOs;
using FMS.Application.Features.ExpectedFuelAverage.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers.FuelManagement;

/// <summary>
/// Controller for managing expected fuel average templates and vehicle assignments.
/// Supports both km/L (for vehicles on routes) and L/hr (for stationary equipment) measurements.
/// </summary>
[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class ExpectedFuelAverageManagementController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<ExpectedFuelAverageManagementController> _logger;

    public ExpectedFuelAverageManagementController(IMediator mediator, ILogger<ExpectedFuelAverageManagementController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    #region Fuel Routes

    /// <summary>
    /// Get all fuel routes
    /// </summary>
    [HttpGet("routes")]
    public async Task<IActionResult> GetFuelRoutes([FromQuery] bool includeInactive = false)
    {
        var result = await _mediator.Send(new GetFuelRoutesQuery(includeInactive));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get fuel routes by site
    /// </summary>
    [HttpGet("routes/by-site/{siteId}")]
    public async Task<IActionResult> GetFuelRoutesBySite(int siteId)
    {
        var result = await _mediator.Send(new GetFuelRoutesBySiteQuery(siteId));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Create a new fuel route
    /// </summary>
    [HttpPost("routes")]
    public async Task<IActionResult> CreateFuelRoute([FromBody] FuelRouteDTO dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(FMSResponse<FuelRouteDTO>.Failed("Invalid model state"));

        var result = await _mediator.Send(new CreateFuelRouteCommand(dto));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Update a fuel route
    /// </summary>
    [HttpPut("routes/{id}")]
    public async Task<IActionResult> UpdateFuelRoute(int id, [FromBody] FuelRouteDTO dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(FMSResponse<FuelRouteDTO>.Failed("Invalid model state"));

        var result = await _mediator.Send(new UpdateFuelRouteCommand(id, dto));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Delete a fuel route
    /// </summary>
    [HttpDelete("routes/{id}")]
    public async Task<IActionResult> DeleteFuelRoute(int id)
    {
        var result = await _mediator.Send(new DeleteFuelRouteCommand(id));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Load Classifications

    /// <summary>
    /// Get all load classifications
    /// </summary>
    [HttpGet("load-classifications")]
    public async Task<IActionResult> GetLoadClassifications([FromQuery] bool includeInactive = false)
    {
        var result = await _mediator.Send(new GetLoadClassificationsQuery(includeInactive));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Create a new load classification
    /// </summary>
    [HttpPost("load-classifications")]
    public async Task<IActionResult> CreateLoadClassification([FromBody] LoadClassificationDTO dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(FMSResponse<LoadClassificationDTO>.Failed("Invalid model state"));

        var result = await _mediator.Send(new CreateLoadClassificationCommand(dto));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Update a load classification
    /// </summary>
    [HttpPut("load-classifications/{id}")]
    public async Task<IActionResult> UpdateLoadClassification(int id, [FromBody] LoadClassificationDTO dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(FMSResponse<LoadClassificationDTO>.Failed("Invalid model state"));

        var result = await _mediator.Send(new UpdateLoadClassificationCommand(id, dto));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Delete a load classification
    /// </summary>
    [HttpDelete("load-classifications/{id}")]
    public async Task<IActionResult> DeleteLoadClassification(int id)
    {
        var result = await _mediator.Send(new DeleteLoadClassificationCommand(id));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Usage Intensities

    /// <summary>
    /// Get all usage intensities
    /// </summary>
    [HttpGet("usage-intensities")]
    public async Task<IActionResult> GetUsageIntensities([FromQuery] bool includeInactive = false)
    {
        var result = await _mediator.Send(new GetUsageIntensitiesQuery(includeInactive));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Create a new usage intensity
    /// </summary>
    [HttpPost("usage-intensities")]
    public async Task<IActionResult> CreateUsageIntensity([FromBody] UsageIntensityDTO dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(FMSResponse<UsageIntensityDTO>.Failed("Invalid model state"));

        var result = await _mediator.Send(new CreateUsageIntensityCommand(dto));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Update a usage intensity
    /// </summary>
    [HttpPut("usage-intensities/{id}")]
    public async Task<IActionResult> UpdateUsageIntensity(int id, [FromBody] UsageIntensityDTO dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(FMSResponse<UsageIntensityDTO>.Failed("Invalid model state"));

        var result = await _mediator.Send(new UpdateUsageIntensityCommand(id, dto));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Delete a usage intensity
    /// </summary>
    [HttpDelete("usage-intensities/{id}")]
    public async Task<IActionResult> DeleteUsageIntensity(int id)
    {
        var result = await _mediator.Send(new DeleteUsageIntensityCommand(id));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Expected Fuel Average Templates

    /// <summary>
    /// Get all expected fuel average templates with optional filtering
    /// </summary>
    [HttpGet("templates")]
    public async Task<IActionResult> GetTemplates(
        [FromQuery] int? vehicleTypeId = null,
        [FromQuery] int? vehicleManufacturerId = null,
        [FromQuery] int? vehicleModelId = null,
        [FromQuery] int? siteId = null,
        [FromQuery] bool? isKmPerLiter = null,
        [FromQuery] bool includeInactive = false)
    {
        var result = await _mediator.Send(new GetExpectedFuelAverageTemplatesQuery(
            vehicleTypeId, vehicleManufacturerId, vehicleModelId, siteId, isKmPerLiter, includeInactive));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get a specific template by ID
    /// </summary>
    [HttpGet("templates/{id}")]
    public async Task<IActionResult> GetTemplateById(int id)
    {
        var result = await _mediator.Send(new GetExpectedFuelAverageTemplateByIdQuery(id));
        if (!result.IsSuccess)
            return NotFound(result);
        return Ok(result);
    }

    /// <summary>
    /// Get matching templates for a vehicle (based on vehicle type, manufacturer, model, site)
    /// </summary>
    [HttpGet("templates/for-vehicle/{vehicleId}")]
    public async Task<IActionResult> GetMatchingTemplatesForVehicle(int vehicleId)
    {
        var result = await _mediator.Send(new GetMatchingTemplatesForVehicleQuery(vehicleId));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Create a new expected fuel average template
    /// </summary>
    [HttpPost("templates")]
    public async Task<IActionResult> CreateTemplate([FromBody] ExpectedFuelAverageTemplateDTO dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(FMSResponse<ExpectedFuelAverageTemplateDTO>.Failed("Invalid model state"));

        var result = await _mediator.Send(new CreateExpectedFuelAverageTemplateCommand(dto));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Update an expected fuel average template
    /// </summary>
    [HttpPut("templates/{id}")]
    public async Task<IActionResult> UpdateTemplate(int id, [FromBody] ExpectedFuelAverageTemplateDTO dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(FMSResponse<ExpectedFuelAverageTemplateDTO>.Failed("Invalid model state"));

        var result = await _mediator.Send(new UpdateExpectedFuelAverageTemplateCommand(id, dto));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Delete an expected fuel average template
    /// </summary>
    [HttpDelete("templates/{id}")]
    public async Task<IActionResult> DeleteTemplate(int id)
    {
        var result = await _mediator.Send(new DeleteExpectedFuelAverageTemplateCommand(id));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Vehicle Assignments

    /// <summary>
    /// Get expected average assignments for a specific vehicle
    /// </summary>
    [HttpGet("vehicle/{vehicleId}/assignments")]
    public async Task<IActionResult> GetVehicleAssignments(int vehicleId)
    {
        var result = await _mediator.Send(new GetVehicleExpectedAverageAssignmentsQuery(vehicleId));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get all vehicles with their expected average assignments (admin grid view)
    /// </summary>
    [HttpGet("vehicles")]
    public async Task<IActionResult> GetAllVehicleAssignments(
        [FromQuery] int? siteId = null,
        [FromQuery] int? vehicleTypeId = null,
        [FromQuery] bool onlyWithoutAssignment = false)
    {
        var result = await _mediator.Send(new GetAllVehicleExpectedAveragesQuery(siteId, vehicleTypeId, onlyWithoutAssignment));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Assign an expected fuel average template to a vehicle
    /// </summary>
    [HttpPost("vehicle/assign")]
    public async Task<IActionResult> AssignToVehicle([FromBody] VehicleExpectedAverageAssignmentDTO dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(FMSResponse<VehicleExpectedAverageAssignmentDTO>.Failed("Invalid model state"));

        var result = await _mediator.Send(new AssignExpectedAverageToVehicleCommand(dto));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Remove an expected average assignment from a vehicle
    /// </summary>
    [HttpDelete("vehicle/assignment/{assignmentId}")]
    public async Task<IActionResult> RemoveAssignment(int assignmentId)
    {
        var result = await _mediator.Send(new RemoveVehicleAssignmentCommand(assignmentId));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Set the default expected average assignment for a vehicle
    /// </summary>
    [HttpPut("vehicle/{vehicleId}/default-assignment/{assignmentId}")]
    public async Task<IActionResult> SetDefaultAssignment(int vehicleId, int assignmentId)
    {
        var result = await _mediator.Send(new SetDefaultVehicleAssignmentCommand(vehicleId, assignmentId));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    #endregion
}
