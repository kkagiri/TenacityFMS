//using FMS.Application.Command.DatabaseCommand.FuelRefillCommand;
using FMS.Application.Features.TankManagement.FuelRefill.Commands;
using FMS.Application.ModelsDTOs.FMS.FuelRefil;
using FMS.Application.Queries.Database.FMSQuery.FuelRefillQueries;
using FMS.Application.Queries.Database.FMSQuery.FuelRefilQueries;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers;

[ApiController]
[Route ("api/[controller]")]
public class FuelRefillController : ControllerBase {
    private readonly IMediator _mediator;

    public FuelRefillController (IMediator mediator) {
        _mediator = mediator;
    }

    //api: Post fuelrefill
    // [HttpPost]
    // public async Task<IActionResult> CreateFuelRefil (CreateFuelRrefillCommand command) {
    //     if (!ModelState.IsValid) return BadRequest (ModelState);
    //     var id = await _mediator.Send (command);
    //     return CreatedAtAction (nameof (GetFuelRefil), new { id = id }, command);
    // }

    //api: Post fuelrefill
    [HttpPost]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> CreateFuelRefil ([FromBody] FuelRefilDTO fuelRefilDTO) {
        var hasPermission = User.HasClaim ("permissions", "_createFuelRefill");
        if (!hasPermission) return Forbid ();
        if (!ModelState.IsValid) return BadRequest (ModelState);

        var userIdClaim = User.Claims.FirstOrDefault (c =>
            c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
            Guid.TryParse (c.Value, out _));

        if (userIdClaim == null) return BadRequest ("Invalid User ID");

        fuelRefilDTO.FuelBy = userIdClaim.Value;

        var command = new CreateFuelRrefillCommand (fuelRefilDTO);

        var results = await _mediator.Send (command);
        if (!results.Success) return BadRequest (results);
        return Ok (results);
    }

    [HttpGet ("{id}")]
    public async Task<IActionResult> GetFuelRefil (int id) {
        var FuelRefill = await _mediator.Send (new FuelRefillGetbyIDQuery (id));
        if (FuelRefill == null) {
            return NotFound ();
        }
        return Ok (FuelRefill);
    }

    [HttpGet ("summary")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetFuelRefillSummary ([FromQuery] DateTime startDate, [FromQuery] DateTime endDate) {
        var hasPermission = User.HasClaim ("permissions", "_readFuelRefill");
        if (!hasPermission) return Forbid ();

        var summary = await _mediator.Send (new FuelRefillSummaryQuery (startDate, endDate, null));

        if (summary == null || !summary.Any ()) {
            return NoContent ();
        }

        return Ok (summary);
    }

    [HttpGet ("summary/{siteId}")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetFuelRefillSummaryBySite ([FromQuery] DateTime startDate, [FromQuery] DateTime endDate, int siteId) {
        var hasPermission = User.HasClaim ("permissions", "_readFuelRefill");
        if (!hasPermission) return Forbid ();

        var summary = await _mediator.Send (new FuelRefillSummaryQuery (startDate, endDate, siteId));

        if (summary == null || !summary.Any ()) {
            return NoContent ();
        }

        return Ok (summary);
    }

    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetFuelRefilList (int take = 100, int skip = 0) {
        var hasPermission = User.HasClaim ("permissions", "_readFuelRefill");
        if (!hasPermission) return Forbid ();
        var fuelRefil = await _mediator.Send (new FuelRefillGetListQuery (take, skip));
        if (fuelRefil == null) return NoContent ();
        return Ok (fuelRefil);
    }

    [HttpPut ("{id}")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]

    public async Task<IActionResult> UpdateFuelRefil (int id, [FromBody] FuelRefilDTO dto) {
        if (id <= 0 || id != dto.Id) {
            return BadRequest ("ID mismatch");
        }

        // Get user id from claims
        var userIdClaim = User.Claims.FirstOrDefault (c =>
            c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
            Guid.TryParse (c.Value, out _));
        if (userIdClaim == null) {
            return BadRequest ("Invalid User ID");
        }

        // Query the fuel refill entity to get the old amount
        var FuelRefill = await _mediator.Send (new FuelRefillGetbyIDQuery (id));
        if (FuelRefill == null) {
            return NotFound ();
        }

        // Set the user id for auditing
        dto.FuelBy = userIdClaim.Value;

        // Use the old amount from the entity for the update command
        var command = new UpdateFuelRefillCommand (
            id,
            dto.TankId ?? 0,
            dto.Date ?? DateTime.UtcNow,
            dto.ManualFuelrefillAmount ?? 0,
            FuelRefill.ManualFuelrefillAmount ?? 0,
            dto.FuelBy
        );

        var result = await _mediator.Send (command);
        if (!result.Success) {
            return NotFound (result.Message);
        }

        return NoContent ();
    }

    [HttpDelete ("{id}")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> DeleteFuelRefil (int id) {
        var hasPermission = User.HasClaim ("permissions", "_deleteFuelRefill");
        if (!hasPermission) return Forbid ();
        if (id <= 0) return BadRequest ("Invalid ID");

        // Query the fuel refill entity (using MediatR or DbContext)
        var FuelRefill = await _mediator.Send (new FuelRefillGetbyIDQuery (id));
        if (FuelRefill == null) return NotFound ();

        // Get user id from claims
        var userIdClaim = User.Claims.FirstOrDefault (c =>
            c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
            Guid.TryParse (c.Value, out _));
        if (userIdClaim == null) return BadRequest ("Invalid User ID");

        // Pass all required fields to the command
        var command = new DeleteFuelRefillCommand (
            id,
            FuelRefill.TankId ?? 0,
            FuelRefill.ManualFuelrefillAmount ?? 0,
            FuelRefill.Date ?? DateTime.UtcNow,
            userIdClaim.Value
        );

        var result = await _mediator.Send (command);
        if (!result.Success) return NotFound (result.Message);

        return NoContent ();
    }
}