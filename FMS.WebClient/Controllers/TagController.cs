using System;
using FMS.Application.Command.DatabaseCommand.TagCmd;
using FMS.Application.ModelsDTOs.FMS.Tag;
using FMS.Application.Queries;
using FMS.Application.Queries.Database.FMSQuery.TagQueries;
using FMS.Application.Queries.Database.PTSQueries.TagQueries;
using FMS.Domain.Entities.Features.FuelRule.Rules;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers;

[Route ("api/[controller]")]
[ApiController]
public class TagController : ControllerBase {
    private readonly IMediator _mediator;

    public TagController (IMediator mediator) {
        _mediator = mediator;
    }

    [HttpGet]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetTags () {
        return User.HasClaim ("permissions", "_readTag") ?
            Ok (await _mediator.Send (new GetAllTagsQuery ())) :
            Forbid ();
    }

    [HttpGet ("{id}")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetTagById (int id) {
        var hasPermission = User.HasClaim ("permissions", "_readTag");
        if (!hasPermission) return Forbid ();
        if (id <= 0) return BadRequest ("Invalid ID");

        var result = await _mediator.Send (new FMS.Application.Queries.Database.FMSQuery.TagQueries.GetTagByIdQuery (id));
        return result != null ? Ok (result) : NotFound ();
    }

    [HttpGet ("by-vehicle/{vehicleId}")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetTagsByVehicleId (int vehicleId) {
        var hasPermission = User.HasClaim ("permissions", "_readTag");
        if (!hasPermission) return Forbid ();
        if (vehicleId <= 0) return BadRequest ("Invalid Vehicle ID");

        var result = await _mediator.Send (new GetTagsByVehicleIdQuery (vehicleId));
        return Ok (result);
    }

    [HttpGet ("validate-vehicle/{vehicleId}")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> ValidateVehicle (int vehicleId) {
        if (vehicleId <= 0) return BadRequest ("Invalid Vehicle ID");
        var hasPermission = User.HasClaim ("permissions", "_readTag");
        if (!hasPermission) return Forbid ();

        var result = await _mediator.Send (new ValidateVehicleQuery (vehicleId));
        return Ok (result);
    }

    [HttpGet ("details/{tagName}")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetTagDetails (string tagName) {
        if (string.IsNullOrEmpty (tagName))
            return BadRequest ("Invalid Tag ID");

        try {
            var result = await _mediator.Send (new GetTagDetailsQuery (tagName));
            return Ok (result);
        } catch (KeyNotFoundException ex) {
            return NotFound (ex.Message);
        } catch (Exception ex) {
            return StatusCode (500, $"Error retrieving tag details: {ex.Message}");
        }
    }

    [HttpGet ("validate/{tagName}")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> ValidateTag (string tagName) {
        if (string.IsNullOrEmpty (tagName))
            return BadRequest ("Invalid request data");

        try {
            var result = await _mediator.Send (new ValidateTagQuery (tagName));
            return Ok (result);
        } catch (Exception ex) {
            return StatusCode (500, new { isValid = false, message = $"Error validating tag: {ex.Message}" });
        }
    }

    [HttpPost]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> CreateTag ([FromBody] TagDTO tagDTO) {
        var hasPermission = User.HasClaim ("permissions", "_CreateTags");
        if (!hasPermission) return Forbid ();

        if (!ModelState.IsValid) return BadRequest (ModelState);

        var response = await _mediator.Send (new CreateTagCommand (tagDTO));
        if (response.Success)
            return CreatedAtAction (nameof (GetTagById), new { id = response.Data }, tagDTO);
        else
            return BadRequest (response.Message);
    }

    [HttpPut ("{id}")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> UpdateTag (int id, [FromBody] TagDTO tagDTO) {
        var hasPermission = User.HasClaim ("permissions", "_EditTags");
        if (!hasPermission) return Forbid ();

        if (!ModelState.IsValid) return BadRequest (ModelState);
        if (id != tagDTO.Id) return BadRequest ("ID mismatch");

        var result = await _mediator.Send (new UpdateTagCommand (tagDTO));
        return result.Success ? Ok ("Tag Updated Successfully") : BadRequest (result.Message);
    }

    [HttpDelete ("{id}")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> DeleteTag (int id) {
        var hasPermission = User.HasClaim ("permissions", "_DeleteTags");
        if (!hasPermission) return Forbid ();

        var result = await _mediator.Send (new DeleteTagCommand (id));
        return result.Success ? Ok ("Tag Deleted Successfully") : BadRequest (result.Message);
    }

    [HttpPost ("assign-to-vehicle")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> AssignTagToVehicle ([FromBody] AssignTagToVehicleDTO assignTagDTO) {
        var hasPermission = User.HasClaim ("permissions", "_EditTags");
        if (!hasPermission) return Forbid ();

        if (!ModelState.IsValid) return BadRequest (ModelState);

        var result = await _mediator.Send (new AssignToVehicleTagCommand (assignTagDTO));
        return result.Success ? Ok (result.Message) : BadRequest (result.Message);
    }
}