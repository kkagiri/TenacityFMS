//using FMS.Application.Command.DatabaseCommand.FuelRefillCommand;
using FMS.Application.Features.FMS.FuelRefil;
using FMS.Application.Features.TankManagement.FuelRefill.Commands;
using FMS.Application.Queries.Database.FMSQuery.FuelRefillQueries;
using FMS.Application.Queries.Database.FMSQuery.FuelRefilQueries;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers;

[ApiController]
[Route ("api/v1/[controller]")]
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

    //Cursor - Enhanced GetFuelRefilList with filtering support
    [HttpGet]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetFuelRefilList (
        int take = 100,
        int skip = 0, [FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null, [FromQuery] int? siteId = null) {

        var hasPermission = User.HasClaim ("permissions", "_readFuelRefill");
        if (!hasPermission) return Forbid ();

        var fuelRefil = await _mediator.Send (new FuelRefillGetListQuery (take, skip, startDate, endDate, siteId));
        if (fuelRefil == null) return NoContent ();
        return Ok (fuelRefil);
    }

}