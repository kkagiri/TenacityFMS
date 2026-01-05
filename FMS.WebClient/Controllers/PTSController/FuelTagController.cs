using System;
using FMS.Application.Features.FuelTagManagement.FuelingTags.Command;
using FMS.Application.Features.FuelTagManagement.FuelingTags.DTOs;
using FMS.Application.Features.FuelTagManagement.FuelingTags.Queries;
using FMS.Application.Queries;
using FMS.Application.Queries.Database.PTSQueries.TagQueries;
using FMS.Domain.Entities.Features.FuelRule.Rules;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers;

[Route("api/v1/[controller]")]
[ApiController]
public class FuelTagController : ControllerBase
{
    private readonly IMediator _mediator;

    public FuelTagController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetFuelTags()
    {
        return User.HasClaim("permissions", "_readFuelTag") ?
            Ok(await _mediator.Send(new GetAllFuelTagsQuery())) :
            Forbid();
    }

    [HttpGet("{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetFuelTagById(int id)
    {
        var hasPermission = User.HasClaim("permissions", "_readFuelTag");
        if (!hasPermission) return Forbid();
        if (id <= 0) return BadRequest("Invalid ID");

        var result = await _mediator.Send(new GetFuelTagByIdQuery(id));
        return result != null ? Ok(result) : NotFound();
    }

    [HttpGet("by-vehicle/{vehicleId}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetFuelTagsByVehicleId(int vehicleId)
    {
        var hasPermission = User.HasClaim("permissions", "_readFuelTag");
        if (!hasPermission) return Forbid();
        if (vehicleId <= 0) return BadRequest("Invalid Vehicle ID");

        var result = await _mediator.Send(new GetFuelTagsByVehicleIdQuery(vehicleId));
        return Ok(result);
    }

    [HttpGet("validate-vehicle/{vehicleId}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> ValidateVehicle(int vehicleId, [FromQuery] int siteId)
    {
        if (vehicleId <= 0) return BadRequest("Invalid Vehicle ID");
        if (siteId <= 0) return BadRequest("Invalid Site ID");
        var hasPermission = User.HasClaim("permissions", "_readFuelTag");
        if (!hasPermission) return Forbid();

        var result = await _mediator.Send(new ValidateVehicleQuery(vehicleId, siteId));

        // Return 200 OK with result object - frontend will check isValid flag
        // This allows frontend to receive vehicleInfo even when validation fails
        return Ok(result);
    }

    [HttpGet("details/{fuelTagName}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetFuelTagDetails(string fuelTagName)
    {
        if (string.IsNullOrEmpty(fuelTagName))
            return BadRequest("Invalid Tag ID");

        try
        {
            var result = await _mediator.Send(new GetFuelTagDetailsQuery(fuelTagName));
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error retrieving tag details: {ex.Message}");
        }
    }

    [HttpGet("validate/{fuelTagName}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> ValidateTag(string tagName)
    {
        if (string.IsNullOrEmpty(tagName))
            return BadRequest("Invalid request data");

        try
        {
            var result = await _mediator.Send(new ValidateFuelTagQuery(tagName));
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { isValid = false, message = $"Error validating tag: {ex.Message}" });
        }
    }

    [HttpPost]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> CreateFuelTag([FromBody] FuelTagDTO tagDTO)
    {
        var hasPermission = User.HasClaim("permissions", "_CreateFuelTags");
        if (!hasPermission) return Forbid();

        if (!ModelState.IsValid) return BadRequest(ModelState);

        var response = await _mediator.Send(new CreateFuelTagCommand(tagDTO));
        if (response.Success)
            return CreatedAtAction(nameof(GetFuelTagById), new { id = response.Data }, tagDTO);
        else
            return BadRequest(response.Message);
    }

    [HttpPut("{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> UpdateTag(int id, [FromBody] FuelTagDTO fuelTagDTO)
    {
        var hasPermission = User.HasClaim("permissions", "_EditFuelTags");
        if (!hasPermission) return Forbid();

        if (!ModelState.IsValid) return BadRequest(ModelState);
        if (id != fuelTagDTO.Id) return BadRequest("ID mismatch");

        var result = await _mediator.Send(new UpdateFuelTagCommand(fuelTagDTO));
        return result.Success ? Ok("Tag Updated Successfully") : BadRequest(result.Message);
    }

    [HttpDelete("{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> DeleteTag(int id)
    {
        var hasPermission = User.HasClaim("permissions", "_DeleteFuelTags");
        if (!hasPermission) return Forbid();

        var result = await _mediator.Send(new DeleteFuelTagCommand(id));
        return result.Success ? Ok("Tag Deleted Successfully") : BadRequest(result.Message);
    }

    [HttpPost("assign-to-vehicle")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> AssignTagToVehicle([FromBody] AssignFuelTagToVehicleDTO assignFuelTagDTO)
    {
        var hasPermission = User.HasClaim("permissions", "_EditFuelTags");
        if (!hasPermission) return Forbid();

        if (!ModelState.IsValid) return BadRequest(ModelState);

        var result = await _mediator.Send(new AssignToVehicleFuelTagCommand(assignFuelTagDTO));
        return result.Success ? Ok(result.Message) : BadRequest(result.Message);
    }
}
