/**
 * File: FuelRefillController.cs
 * Purpose: Handles fuel refill CRUD and summary endpoints.
 * Dependencies: MediatR, fuel refill commands/queries, JWT claims.
 * Last Modified: 2026-02-04
 *
 * Key Actions:
 * - CreateFuelRefil(): Creates a fuel refill with authenticated user context.
 * - GetFuelRefillSummary(): Returns summary totals by date range.
 * - GetFuelRefilList(): Returns paged fuel refill records with filters.
 */
//using FMS.Application.Command.DatabaseCommand.FuelRefillCommand;
using System.Security.Claims;
using FMS.Application.Features.FMS.FuelRefil;
using FMS.Application.Features.TankManagement.FuelRefill.Commands;
using FMS.Application.Features.TankManagement.FuelRefill.DTOs;
using FMS.Application.Queries.Database.FMSQuery.FuelRefillQueries;
using FMS.Application.Queries.Database.FMSQuery.FuelRefilQueries;
using FMS.WebClient.Attributes;
using FMS.Application.Common.Constants;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
[RequirePermission(Permissions.FuelRefill.Read)]
public class FuelRefillController : ControllerBase
{
    private readonly IMediator _mediator;

    public FuelRefillController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private bool TryGetCurrentUserId(out string userId)
    {
        userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? string.Empty;

        return Guid.TryParse(userId, out _);
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
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.FuelRefill.Create)]
    public async Task<IActionResult> CreateFuelRefil([FromBody] FuelRefilDTO fuelRefilDTO)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        if (!TryGetCurrentUserId(out var userId)) return BadRequest("Invalid User ID");

        fuelRefilDTO.FuelBy = userId;

        var command = new CreateFuelRrefillCommand(fuelRefilDTO);

        var results = await _mediator.Send(command);
        if (!results.Success) return BadRequest(results);
        return Ok(results);
    }

    [HttpGet("{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.FuelRefill.Read)]
    public async Task<IActionResult> GetFuelRefil(int id)
    {
        var FuelRefill = await _mediator.Send(new FuelRefillGetbyIDQuery(id));
        if (FuelRefill == null)
        {
            return NotFound();
        }
        return Ok(FuelRefill);
    }

    [HttpGet("summary")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.FuelRefill.Read)]
    public async Task<IActionResult> GetFuelRefillSummary([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
    {
        var summary = await _mediator.Send(new FuelRefillSummaryQuery(startDate, endDate, null));

        if (summary == null || !summary.Any())
        {
            return NoContent();
        }

        return Ok(summary);
    }

    [HttpGet("summary/{siteId}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.FuelRefill.Read)]
    public async Task<IActionResult> GetFuelRefillSummaryBySite([FromQuery] DateTime startDate, [FromQuery] DateTime endDate, int siteId)
    {
        var summary = await _mediator.Send(new FuelRefillSummaryQuery(startDate, endDate, siteId));

        if (summary == null || !summary.Any())
        {
            return NoContent();
        }

        return Ok(summary);
    }

    //Cursor - Enhanced GetFuelRefilList with filtering support
    [HttpGet]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.FuelRefill.Read)]
    public async Task<IActionResult> GetFuelRefilList(
        int take = 100,
        int skip = 0, [FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null, [FromQuery] int? siteId = null)
    {

        var fuelRefil = await _mediator.Send(new FuelRefillGetListQuery(take, skip, startDate, endDate, siteId));
        if (fuelRefil == null) return NoContent();
        return Ok(fuelRefil);
    }

    [HttpPut("{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.FuelRefill.Edit)]
    public async Task<IActionResult> UpdateFuelRefill(int id, [FromBody] FuelRefillCorrectionDto correctionData)
    {
        if (!TryGetCurrentUserId(out var userId)) return BadRequest("Invalid User ID");

        if (!ModelState.IsValid) return BadRequest(ModelState);

        correctionData.FuelBy = userId;

        if (string.IsNullOrWhiteSpace(correctionData.CorrectionReason))
        {
            correctionData.CorrectionReason = "Manual fuel refill update";
        }

        var result = await _mediator.Send(new UpdateFuelRefillCommand(id, correctionData));
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.FuelRefill.Delete)]
    public async Task<IActionResult> DeleteFuelRefill(int id, [FromQuery] string? deletionReason = null)
    {
        if (!TryGetCurrentUserId(out var userId)) return BadRequest("Invalid User ID");

        var result = await _mediator.Send(new DeleteFuelRefillCommand(id, userId, deletionReason));
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

}