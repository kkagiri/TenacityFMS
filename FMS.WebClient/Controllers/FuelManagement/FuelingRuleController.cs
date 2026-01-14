using FMS.Application.Common;
using FMS.Application.Features.FuelTagManagement.FuelingRules.Queries;
using FMS.Application.Features.FuelTagManagement.FuelingRules.Rules.Commands.DailyMonthlyRules;
using FMS.Application.Features.FuelTagManagement.FuelingRules.Rules.Commands.NoOfRefilRules;
using FMS.Application.Features.FuelTagManagement.FuelingRules.Rules.Commands.TimeWIndowLimitRule;
using FMS.Application.Features.FuelTagManagement.FuelingRules.RuleSet.Commands;
using FMS.Application.Features.FuelTagManagement.FuelingRules.RuleSet.Queries;
using FMS.Application.Features.FuelTagManagement.FuelingRules.RuleSetAssignments.Commands;
using FMS.Application.Features.FuelTagManagement.FuelingRules.RuleSetAssignments.DTOs;
using FMS.Application.Features.FuelTagManagement.FuelingRules.RuleSetAssignments.Queries;
using FMS.Application.Queries.Database.FMSQuery;
using FMS.Domain.Entities.Features.FuelRuleSet;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers;

[ApiController]
[Route("api/v1/[controller]")]

public class FuelingRuleController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<FuelingRuleController> _logger;

    public FuelingRuleController(IMediator mediator, ILogger<FuelingRuleController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    // RuleSet Endpoints
    [HttpPost("rulesets")]
    public async Task<IActionResult> CreateRuleSet([FromBody] CreateFuelRuleSetCommand command)
    {
        try
        {
            var result = await _mediator.Send(command);
            if (!result.Success)
                return BadRequest(result.Message);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating rule set");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("rulesets/{id}")]
    public async Task<IActionResult> UpdateRuleSet(int id, [FromBody] UpdateFuelRuleSetCommand command)
    {
        if (id != command.Id)
            return BadRequest("ID mismatch");

        try
        {
            var result = await _mediator.Send(command);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating rule set");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("rulesets/{id}")]
    public async Task<IActionResult> DeleteRuleSet(int id)
    {
        try
        {
            var result = await _mediator.Send(new DeleteFuelRuleSetCommand { Id = id });
            if (!result)
                return BadRequest("Failed to delete rule set");
            return Ok("Rule set deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting rule set");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("rulesets/{ruleSetId}/assign/{tagId}")]
    public async Task<IActionResult> AssignRuleSetToTag(int ruleSetId, int tagId)
    {
        try
        {
            var result = await _mediator.Send(new AssignFuelingRuleSetToTagCommand(tagId, ruleSetId));
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning rule set to tag");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("rulesets/{ruleSetId}/assign-to-vehicle/{vehicleId}")]
    public async Task<IActionResult> AssignRuleSetToVehicle(int ruleSetId, int vehicleId)
    {
        try
        {
            var result = await _mediator.Send(new AssignFuelingRuleSetToVehicleCommand(vehicleId, ruleSetId));
            if (!result.IsSuccess)
                return BadRequest(result);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning rule set to vehicle");
            return StatusCode(500, "Internal server error");
        }
    }

    // Daily/Monthly Limit Rules
    [HttpPost("rulesets/{ruleSetId}/dailymonthly")]
    public async Task<IActionResult> CreateDailyMonthlyRule(int ruleSetId, [FromBody] CreateDailyMonthlyLimitRuleCommand command)
    {
        if (ruleSetId != command.RuleSetId)
            return BadRequest("RuleSet ID mismatch");

        try
        {
            var result = await _mediator.Send(command);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating daily/monthly limit rule");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("rules/dailymonthly/{ruleId}")]
    public async Task<IActionResult> UpdateDailyMonthlyRule(int ruleId, [FromBody] UpdateDailyMonthlyLimitRuleCommand command)
    {
        if (ruleId != command.RuleId)
            return BadRequest("Rule ID mismatch");

        try
        {
            var result = await _mediator.Send(command);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating daily/monthly limit rule");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("rules/dailymonthly/{ruleId}")]
    public async Task<IActionResult> DeleteDailyMonthlyRule(int ruleId)
    {
        try
        {
            var result = await _mediator.Send(new DeleteDailyMonthlyLimitRuleCommand(ruleId));
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting daily/monthly limit rule");
            return StatusCode(500, "Internal server error");
        }
    }

    // Number of Refills Rules
    [HttpPost("rulesets/{ruleSetId}/refillcount")]
    public async Task<IActionResult> CreateRefillCountRule(int ruleSetId, [FromBody] CreateNoOfRefillRuleCommand command)
    {
        _logger.LogInformation("CreateRefillCountRule received: RuleSetId={RuleSetId}, RuleName={RuleName}, " +
            "MaxRefillsPerDay={MaxRefillsPerDay}, MaxRefillsPerWeek={MaxRefillsPerWeek}, MaxRefillsPerMonth={MaxRefillsPerMonth}",
            command.RuleSetId, command.RuleName, command.MaxRefillsPerDay, command.MaxRefillsPerWeek, command.MaxRefillsPerMonth);

        if (ruleSetId != command.RuleSetId)
            return BadRequest("RuleSet ID mismatch");

        try
        {
            var result = await _mediator.Send(command);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating refill count rule");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("rules/refillcount/{ruleId}")]
    public async Task<IActionResult> UpdateRefillCountRule(int ruleId, [FromBody] UpdateNoOfRefillRuleCommand command)
    {
        _logger.LogInformation("UpdateRefillCountRule received: RuleId={RuleId}, RuleName={RuleName}, " +
            "MaxRefillsPerDay={MaxRefillsPerDay}, MaxRefillsPerWeek={MaxRefillsPerWeek}, MaxRefillsPerMonth={MaxRefillsPerMonth}",
            command.RuleId, command.RuleName, command.MaxRefillsPerDay, command.MaxRefillsPerWeek, command.MaxRefillsPerMonth);

        if (ruleId != command.RuleId)
            return BadRequest("Rule ID mismatch");

        try
        {
            var result = await _mediator.Send(command);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating refill count rule");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("rules/refillcount/{ruleId}")]
    public async Task<IActionResult> DeleteRefillCountRule(int ruleId)
    {
        try
        {
            var result = await _mediator.Send(new DeleteNoOfRefillRuleCommand(ruleId));
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting refill count rule");
            return StatusCode(500, "Internal server error");
        }
    }

    // Time Window Rules
    [HttpPost("rulesets/{ruleSetId}/timewindow")]
    public async Task<IActionResult> CreateTimeWindowRule(int ruleSetId, [FromBody] CreateTimeWindowRuleCommand command)
    {
        if (ruleSetId != command.RuleSetId)
            return BadRequest("RuleSet ID mismatch");

        try
        {
            var result = await _mediator.Send(command);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating time window rule");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("rules/timewindow/{ruleId}")]
    public async Task<IActionResult> UpdateTimeWindowRule(int ruleId, [FromBody] UpdateTimeWindowRuleCommand command)
    {
        if (ruleId != command.RuleId)
            return BadRequest("Rule ID mismatch");

        try
        {
            var result = await _mediator.Send(command);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating time window rule");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("rules/timewindow/{ruleId}")]
    public async Task<IActionResult> DeleteTimeWindowRule(int ruleId)
    {
        try
        {
            var result = await _mediator.Send(new DeleteTimeWindowRuleCommand(ruleId));
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting time window rule");
            return StatusCode(500, "Internal server error");
        }
    }

    // Get RuleSets and Rules
    [HttpGet("rulesets")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetRuleSets()
    {
        try
        {
            var result = await _mediator.Send(new GetAllFuelRuleSetsQuery());
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rule sets");
            return StatusCode(500, new { success = false, message = "Internal server error" });
        }
    }

    [HttpGet("rulesets/{id}")]
    public async Task<IActionResult> GetRuleSetById(int id)
    {
        try
        {
            var result = await _mediator.Send(new GetFuelRuleSetByIDQuery(id));
            if (result == null)
                return NotFound();
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rule set by id");
            return StatusCode(500, "Internal server error");
        }
    }

    #region Rule Set Assignments (Cascade Model)

    /// <summary>
    /// Get all rule set assignments with optional filtering
    /// </summary>
    [HttpGet("assignments")]
    public async Task<IActionResult> GetAssignments(
        [FromQuery] int? ruleSetId = null,
        [FromQuery] AssignmentTargetType? targetType = null,
        [FromQuery] int? siteId = null,
        [FromQuery] int? vehicleTypeId = null,
        [FromQuery] int? vehicleId = null,
        [FromQuery] int? tagId = null,
        [FromQuery] bool? isActive = true)
    {
        try
        {
            var result = await _mediator.Send(new GetRuleSetAssignmentsQuery(
                ruleSetId, targetType, siteId, vehicleTypeId, vehicleId, tagId, isActive));

            if (!result.IsSuccess)
                return BadRequest(result);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rule set assignments");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get a specific assignment by ID
    /// </summary>
    [HttpGet("assignments/{id}")]
    public async Task<IActionResult> GetAssignmentById(int id)
    {
        try
        {
            var result = await _mediator.Send(new GetRuleSetAssignmentByIdQuery(id));
            if (!result.IsSuccess)
                return result.ErrorCode == "ASSIGNMENT_NOT_FOUND" ? NotFound(result) : BadRequest(result);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting assignment by id {Id}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get all applicable assignments for a specific vehicle (cascade hierarchy)
    /// </summary>
    [HttpGet("assignments/vehicle/{vehicleId}")]
    public async Task<IActionResult> GetAssignmentsForVehicle(
        int vehicleId,
        [FromQuery] int? siteId = null,
        [FromQuery] int? tagId = null)
    {
        try
        {
            var result = await _mediator.Send(new GetAssignmentsForVehicleQuery(vehicleId, siteId, tagId));
            if (!result.IsSuccess)
                return result.ErrorCode == "VEHICLE_NOT_FOUND" ? NotFound(result) : BadRequest(result);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting assignments for vehicle {VehicleId}", vehicleId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get effective (merged) rules for a vehicle based on cascade hierarchy.
    /// Returns the calculated fuel allowance considering Site → VehicleType → Tag → Vehicle priority.
    /// </summary>
    [HttpGet("vehicle/{vehicleId}/effective-rules")]
    public async Task<IActionResult> GetEffectiveRulesForVehicle(
        int vehicleId,
        [FromQuery] int? siteId = null,
        [FromQuery] int? tagId = null)
    {
        try
        {
            var result = await _mediator.Send(
                new GetEffectiveRulesForVehicleQuery(vehicleId, siteId, tagId));

            if (!result.IsSuccess)
                return result.ErrorCode == "VEHICLE_NOT_FOUND" ? NotFound(result) : BadRequest(result);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting effective rules for vehicle {VehicleId}", vehicleId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Simulate fueling rules for a vehicle at a specific time.
    /// This allows testing how rules would apply at different times of day,
    /// useful for verifying time window rules and understanding rule cascade behavior.
    /// </summary>
    /// <param name="vehicleId">Vehicle ID to simulate</param>
    /// <param name="siteId">Optional site ID (uses vehicle's working site if not provided)</param>
    /// <param name="tagId">Optional tag ID to include tag-level rules</param>
    /// <param name="simulationTime">ISO timestamp for the simulation time (defaults to current time)</param>
    [HttpGet("vehicle/{vehicleId}/simulate")]
    public async Task<IActionResult> SimulateFuelingRules(
        int vehicleId,
        [FromQuery] int? siteId = null,
        [FromQuery] int? tagId = null,
        [FromQuery] DateTime? simulationTime = null)
    {
        try
        {
            var result = await _mediator.Send(
                new SimulateFuelingRulesQuery(vehicleId, siteId, tagId, simulationTime));

            if (!result.IsSuccess)
                return result.ErrorCode == "VEHICLE_NOT_FOUND" ? NotFound(result) : BadRequest(result);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error simulating fueling rules for vehicle {VehicleId} at {SimulationTime}",
                vehicleId, simulationTime);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Create a new rule set assignment (link a rule set to a target)
    /// </summary>
    [HttpPost("assignments")]
    public async Task<IActionResult> CreateAssignment([FromBody] FuelingRuleSetAssignmentDTO assignment)
    {
        try
        {
            var result = await _mediator.Send(new CreateRuleSetAssignmentCommand(assignment));
            if (!result.IsSuccess)
            {
                return result.ErrorCode switch
                {
                    "RULESET_NOT_FOUND" or "SITE_NOT_FOUND" or "VEHICLE_TYPE_NOT_FOUND"
                        or "VEHICLE_NOT_FOUND" or "TAG_NOT_FOUND" => NotFound(result),
                    _ => BadRequest(result)
                };
            }
            return CreatedAtAction(nameof(GetAssignmentById), new { id = result.Data!.Id }, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating rule set assignment");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Update an existing rule set assignment
    /// </summary>
    [HttpPut("assignments/{id}")]
    public async Task<IActionResult> UpdateAssignment(int id, [FromBody] FuelingRuleSetAssignmentDTO assignment)
    {
        try
        {
            var result = await _mediator.Send(new UpdateRuleSetAssignmentCommand(id, assignment));
            if (!result.IsSuccess)
            {
                return result.ErrorCode switch
                {
                    "ASSIGNMENT_NOT_FOUND" or "RULESET_NOT_FOUND" or "SITE_NOT_FOUND"
                        or "VEHICLE_TYPE_NOT_FOUND" or "VEHICLE_NOT_FOUND" or "TAG_NOT_FOUND" => NotFound(result),
                    _ => BadRequest(result)
                };
            }
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating rule set assignment {Id}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Delete (deactivate) a rule set assignment
    /// </summary>
    [HttpDelete("assignments/{id}")]
    public async Task<IActionResult> DeleteAssignment(int id)
    {
        try
        {
            var result = await _mediator.Send(new DeleteRuleSetAssignmentCommand(id));
            if (!result.IsSuccess)
                return result.ErrorCode == "ASSIGNMENT_NOT_FOUND" ? NotFound(result) : BadRequest(result);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting rule set assignment {Id}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Permanently delete a rule set assignment (hard delete)
    /// </summary>
    [HttpDelete("assignments/{id}/permanent")]
    public async Task<IActionResult> HardDeleteAssignment(int id)
    {
        try
        {
            var result = await _mediator.Send(new HardDeleteRuleSetAssignmentCommand(id));
            if (!result.IsSuccess)
                return result.ErrorCode == "ASSIGNMENT_NOT_FOUND" ? NotFound(result) : BadRequest(result);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error hard deleting rule set assignment {Id}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Bulk create assignments - assign a rule set to multiple targets at once
    /// </summary>
    [HttpPost("assignments/bulk")]
    public async Task<IActionResult> BulkCreateAssignments([FromBody] BulkAssignmentDTO bulkAssignment)
    {
        try
        {
            var result = await _mediator.Send(new BulkCreateRuleSetAssignmentsCommand(bulkAssignment));
            if (!result.IsSuccess)
                return result.ErrorCode == "RULESET_NOT_FOUND" ? NotFound(result) : BadRequest(result);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error bulk creating rule set assignments");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get assignments grouped by rule set
    /// </summary>
    [HttpGet("rulesets/{ruleSetId}/assignments")]
    public async Task<IActionResult> GetAssignmentsByRuleSet(int ruleSetId, [FromQuery] bool? isActive = true)
    {
        try
        {
            var result = await _mediator.Send(new GetRuleSetAssignmentsQuery(
                RuleSetId: ruleSetId,
                IsActive: isActive));

            if (!result.IsSuccess)
                return BadRequest(result);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting assignments for rule set {RuleSetId}", ruleSetId);
            return StatusCode(500, "Internal server error");
        }
    }

    #endregion
}