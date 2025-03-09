using FMS.Application.Command.DatabaseCommand.TankCommands;
using FMS.Application.ModelsDTOs.FMS.Tank;
using FMS.Application.Queries.Database.FMSQuery.TankQueries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace FMS.WebClient.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class TankController : ControllerBase
    {
        private readonly IMediator _mediator;

        public TankController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult<List<TankDTO>>> GetTanks()
        {
            var query = new GetTankListQuery();
            var result = await _mediator.Send(query);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TankDTO>> GetTank(int id)
        {
            if (id <= 0) return BadRequest("Invalid ID");
            var query = new GetTankByIdQuery(id);
            var result = await _mediator.Send(query);
            if (result == null)
            {
                return NotFound();
            }
            return Ok(result);
        }

        [HttpGet("site/{siteId}")]
        public async Task<ActionResult<List<TankDTO>>> GetTanksBySiteId(int siteId)
        {
            if (siteId <= 0) return BadRequest("Invalid Site ID");
            var query = new GetTankBySiteIdQuery(siteId);
            var result = await _mediator.Send(query);
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<int>> CreateTank([FromBody] TankDTO tank)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var command = new CreateTankCommand(tank);
            var tankId = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetTank), new { id = tankId }, tankId);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateTank(int id, [FromBody] TankDTO tank)
        {
            if (id <= 0) return BadRequest("Invalid ID");
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var command = new UpdateTankCommand(id, tank);
            var result = await _mediator.Send(command);
            if (!result)
            {
                return NotFound();
            }
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteTank(int id)
        {
            if (id == 0 || id < 0) return BadRequest();

            var command = new DeleteTankCommand(id);
            var result = await _mediator.Send(command);
            if (!result)
            {
                return NotFound();
            }
            return NoContent();
        }
    }
}
