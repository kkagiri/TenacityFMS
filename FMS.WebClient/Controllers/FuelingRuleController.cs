using FMS.Application.Command.DatabaseCommand.FuelingRulesCommands;
using FMS.Application.Command.DatabaseCommand.FuelRules;
using FMS.Application.Command.DatabaseCommand.FuelRules.Rules;
using FMS.Application.Command.DatabaseCommand.FuelRules.Rules.TimeWindowRules;
using FMS.Application.Common;
using FMS.Application.Queries.Database.FMSQuery;
using FMS.Application.Queries.Database.FuelRulesQueries;
using FMS.Application.Commands.FuelRuleSetCommands;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers;

[ApiController]
[Route ("api/[controller]")]

public class FuelingRuleController : ControllerBase {
    private readonly IMediator _mediator;
    private readonly ILogger<FuelingRuleController> _logger;

    public FuelingRuleController (IMediator mediator, ILogger<FuelingRuleController> logger) {
        _mediator = mediator;
        _logger = logger;
    }

    // RuleSet Endpoints
    [HttpPost ("rulesets")]
    public async Task<IActionResult> CreateRuleSet ([FromBody] CreateFuelRuleSetCommand command) {
        try {
            var result = await _mediator.Send (command);
            if (!result.Success)
                return BadRequest (result.Message);
            return Ok (result);
        } catch (Exception ex) {
            _logger.LogError (ex, "Error creating rule set");
            return StatusCode (500, "Internal server error");
        }
    }

    [HttpPut ("rulesets/{id}")]
    public async Task<IActionResult> UpdateRuleSet (int id, [FromBody] UpdateFuelRuleSetCommand command) {
        if (id != command.Id)
            return BadRequest ("ID mismatch");

        try {
            var result = await _mediator.Send (command);
            if (!result.Success)
                return BadRequest (result);
            return Ok (result);
        } catch (Exception ex) {
            _logger.LogError (ex, "Error updating rule set");
            return StatusCode (500, "Internal server error");
        }
    }

    [HttpDelete ("rulesets/{id}")]
    public async Task<IActionResult> DeleteRuleSet (int id) {
        try {
            var result = await _mediator.Send (new DeleteFuelRuleSetCommand { Id = id });
            if (!result)
                return BadRequest ("Failed to delete rule set");
            return Ok ("Rule set deleted successfully");
        } catch (Exception ex) {
            _logger.LogError (ex, "Error deleting rule set");
            return StatusCode (500, "Internal server error");
        }
    }

    [HttpPost ("rulesets/{ruleSetId}/assign/{tagId}")]
    public async Task<IActionResult> AssignRuleSetToTag (int ruleSetId, int tagId) {
        try {
            var result = await _mediator.Send (new AssignFuelingRuleSetToTagCommand (tagId, ruleSetId));
            if (!result.Success)
                return BadRequest (result);
            return Ok (result);
        } catch (Exception ex) {
            _logger.LogError (ex, "Error assigning rule set to tag");
            return StatusCode (500, "Internal server error");
        }
    }

    // Daily/Monthly Limit Rules
    [HttpPost ("rulesets/{ruleSetId}/dailymonthly")]
    public async Task<IActionResult> CreateDailyMonthlyRule (int ruleSetId, [FromBody] CreateDailyMonthlyLimitRuleCommand command) {
        if (ruleSetId != command.RuleSetId)
            return BadRequest ("RuleSet ID mismatch");

        try {
            var result = await _mediator.Send (command);
            if (!result.Success)
                return BadRequest (result);
            return Ok (result);
        } catch (Exception ex) {
            _logger.LogError (ex, "Error creating daily/monthly limit rule");
            return StatusCode (500, "Internal server error");
        }
    }

    [HttpPut ("rules/dailymonthly/{ruleId}")]
    public async Task<IActionResult> UpdateDailyMonthlyRule (int ruleId, [FromBody] UpdateDailyMonthlyLimitRuleCommand command) {
        if (ruleId != command.RuleId)
            return BadRequest ("Rule ID mismatch");

        try {
            var result = await _mediator.Send (command);
            if (!result.Success)
                return BadRequest (result);
            return Ok (result);
        } catch (Exception ex) {
            _logger.LogError (ex, "Error updating daily/monthly limit rule");
            return StatusCode (500, "Internal server error");
        }
    }

    [HttpDelete ("rules/dailymonthly/{ruleId}")]
    public async Task<IActionResult> DeleteDailyMonthlyRule (int ruleId) {
        try {
            var result = await _mediator.Send (new DeleteDailyMonthlyLimitRuleCommand (ruleId));
            if (!result.Success)
                return BadRequest (result);
            return Ok (result);
        } catch (Exception ex) {
            _logger.LogError (ex, "Error deleting daily/monthly limit rule");
            return StatusCode (500, "Internal server error");
        }
    }

    // Number of Refills Rules
    [HttpPost ("rulesets/{ruleSetId}/refillcount")]
    public async Task<IActionResult> CreateRefillCountRule (int ruleSetId, [FromBody] CreateNoOfRefillRuleCommand command) {
        if (ruleSetId != command.RuleSetId)
            return BadRequest ("RuleSet ID mismatch");

        try {
            var result = await _mediator.Send (command);
            if (!result.Success)
                return BadRequest (result);
            return Ok (result);
        } catch (Exception ex) {
            _logger.LogError (ex, "Error creating refill count rule");
            return StatusCode (500, "Internal server error");
        }
    }

    [HttpPut ("rules/refillcount/{ruleId}")]
    public async Task<IActionResult> UpdateRefillCountRule (int ruleId, [FromBody] UpdateNoOfRefillRuleCommand command) {
        if (ruleId != command.RuleId)
            return BadRequest ("Rule ID mismatch");

        try {
            var result = await _mediator.Send (command);
            if (!result.Success)
                return BadRequest (result);
            return Ok (result);
        } catch (Exception ex) {
            _logger.LogError (ex, "Error updating refill count rule");
            return StatusCode (500, "Internal server error");
        }
    }

    [HttpDelete ("rules/refillcount/{ruleId}")]
    public async Task<IActionResult> DeleteRefillCountRule (int ruleId) {
        try {
            var result = await _mediator.Send (new DeleteNoOfRefillRuleCommand (ruleId));
            if (!result.Success)
                return BadRequest (result);
            return Ok (result);
        } catch (Exception ex) {
            _logger.LogError (ex, "Error deleting refill count rule");
            return StatusCode (500, "Internal server error");
        }
    }

    // Time Window Rules
    [HttpPost ("rulesets/{ruleSetId}/timewindow")]
    public async Task<IActionResult> CreateTimeWindowRule (int ruleSetId, [FromBody] CreateTimeWindowRuleCommand command) {
        if (ruleSetId != command.RuleSetId)
            return BadRequest ("RuleSet ID mismatch");

        try {
            var result = await _mediator.Send (command);
            if (!result.Success)
                return BadRequest (result);
            return Ok (result);
        } catch (Exception ex) {
            _logger.LogError (ex, "Error creating time window rule");
            return StatusCode (500, "Internal server error");
        }
    }

    [HttpPut ("rules/timewindow/{ruleId}")]
    public async Task<IActionResult> UpdateTimeWindowRule (int ruleId, [FromBody] UpdateTimeWindowRuleCommand command) {
        if (ruleId != command.RuleId)
            return BadRequest ("Rule ID mismatch");

        try {
            var result = await _mediator.Send (command);
            if (!result.Success)
                return BadRequest (result);
            return Ok (result);
        } catch (Exception ex) {
            _logger.LogError (ex, "Error updating time window rule");
            return StatusCode (500, "Internal server error");
        }
    }

    [HttpDelete ("rules/timewindow/{ruleId}")]
    public async Task<IActionResult> DeleteTimeWindowRule (int ruleId) {
        try {
            var result = await _mediator.Send (new DeleteTimeWindowRuleCommand (ruleId));
            if (!result.Success)
                return BadRequest (result);
            return Ok (result);
        } catch (Exception ex) {
            _logger.LogError (ex, "Error deleting time window rule");
            return StatusCode (500, "Internal server error");
        }
    }

    // Get RuleSets and Rules
    [HttpGet ("rulesets")]
    public async Task<IActionResult> GetRuleSets () {
        try {
            var result = await _mediator.Send (new GetAllFuelRuleSetsQuery ());
            return Ok (result);
        } catch (Exception ex) {
            _logger.LogError (ex, "Error getting rule sets");
            return StatusCode (500, "Internal server error");
        }
    }

    [HttpGet ("rulesets/{id}")]
    public async Task<IActionResult> GetRuleSetById (int id) {
        try {
            var result = await _mediator.Send (new GetFuelRuleSetByIDQuery (id));
            if (result == null)
                return NotFound ();
            return Ok (result);
        } catch (Exception ex) {
            _logger.LogError (ex, "Error getting rule set by id");
            return StatusCode (500, "Internal server error");
        }
    }
}