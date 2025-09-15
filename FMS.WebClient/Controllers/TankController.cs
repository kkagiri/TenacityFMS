using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.TankCommands;
using FMS.Application.ModelsDTOs.FMS.Tank;
using FMS.Application.Queries.Database.FMSQuery.TankQueries;
using FMS.Application.Queries.Database.FMSQuery.TankVolumeHistory;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers {
    [ApiController]
    [Route ("api/[controller]")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class TankController : ControllerBase {
        private readonly IMediator _mediator;

        public TankController (IMediator mediator) {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult<List<TankDTO>>> GetTanks ([FromQuery] string? siteIds = null) {
            var query = new GetTankListQuery ();
            var result = await _mediator.Send (query);
            if (!string.IsNullOrWhiteSpace (siteIds)) {
                var set = siteIds.Split (',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .Select (s => int.TryParse (s, out var id) ? id : (int?) null)
                    .Where (id => id.HasValue)
                    .Select (id => id!.Value)
                    .ToHashSet ();
                if (set.Count > 0) {
                    result = result.Where (t => set.Contains (t.SiteId)).ToList ();
                }
            }
            return Ok (result);
        }

        [HttpGet ("{id}")]
        public async Task<ActionResult<TankDTO>> GetTank (int id) {
            if (id <= 0) return BadRequest ("Invalid ID");
            var query = new GetTankByIdQuery (id);
            var result = await _mediator.Send (query);
            if (result == null) {
                return NotFound ();
            }
            return Ok (result);
        }

        [HttpGet ("site/{siteId}")]
        public async Task<ActionResult<List<TankDTO>>> GetTanksBySiteId (int siteId) {
            if (siteId <= 0) return BadRequest ("Invalid Site ID");
            var query = new GetTankBySiteIdQuery (siteId);
            var result = await _mediator.Send (query);
            return Ok (result);
        }

        [HttpPost]
        public async Task<ActionResult<int>> CreateTank ([FromBody] TankDTO tank) {
            if (!ModelState.IsValid) return BadRequest (ModelState);

            if (string.IsNullOrWhiteSpace (tank?.Name)) {
                return BadRequest (new { message = "Tank name is required and cannot be empty" });
            }

            var command = new CreateTankCommand (tank);
            var tankId = await _mediator.Send (command);
            return CreatedAtAction (nameof (GetTank), new { id = tankId }, tankId);
        }

        [HttpPut ("{id}")]
        public async Task<ActionResult> UpdateTank (int id, [FromBody] TankDTO tank) {
            if (id <= 0) return BadRequest ("Invalid ID");
            if (!ModelState.IsValid) return BadRequest (ModelState);

            var command = new UpdateTankCommand (id, tank);
            var result = await _mediator.Send (command);
            if (!result) {
                return NotFound ();
            }
            return NoContent ();
        }

        [HttpGet ("volume-history")]
        public async Task<ActionResult> GetTankVolumeHistory ([FromQuery] DateTime startDate, [FromQuery] DateTime endDate, [FromQuery] int tankId) {
            if (tankId <= 0) return BadRequest ("Invalid tank ID");
            if (startDate == default || endDate == default) return BadRequest ("Invalid date range");

            var query = new GetTankVolumeHistoryByTankIdQuery (startDate, endDate, tankId);
            var result = await _mediator.Send (query);

            if (result == null || !result.Success) {
                return BadRequest (result?.Message ?? "Error fetching tank volume history");
            }

            return Ok (result.Data);
        }

        [HttpDelete ("{id}")]
        public async Task<ActionResult> DeleteTank (int id) {
            if (id == 0 || id < 0) return BadRequest ();

            var command = new DeleteTankCommand (id);
            var result = await _mediator.Send (command);
            if (!result) {
                return NotFound ();
            }
            return NoContent ();
        }
    }
}