using FMS.Application.Command.DatabaseCommand.SupplierCommands;
using FMS.Application.Common;
using FMS.Application.Features.FMS.Supplier;
using FMS.Application.Queries.Database.FMSQuery.SuppliersQueries;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using FMS.WebClient.Attributes;
using FMS.Application.Common.Constants;

namespace FMS.WebClient.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.Admin.ATGAdmin)]
    public class SupplierController : ControllerBase
    {
        private readonly IMediator _mediator;

        public SupplierController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<ActionResult<List<SupplierDTO>>> GetSuppliers()
        {
            var query = new GetSupplierListQuery();
            var result = await _mediator.Send(query);
            return Ok(result);
        }

        [HttpPost]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]

        public async Task<ActionResult<FMSResponseMessage>> CreateSupplier([FromBody] SupplierDTO supplier)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var command = new CreateSupplierCommand(supplier);
            var result = await _mediator.Send(command);
            return Ok(result);
        }

        [HttpPut("{id}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]

        public async Task<ActionResult<FMSResponseMessage>> UpdateSupplier(int id, [FromBody] SupplierDTO supplier)
        {
            if (id <= 0) return BadRequest("Invalid ID");
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var command = new UpdateSupplierCommand(id, supplier);
            var result = await _mediator.Send(command);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]

        public async Task<ActionResult<FMSResponseMessage>> DeleteSupplier(int id)
        {
            if (id <= 0) return BadRequest("Invalid ID");
            var command = new DeleteSupplierCommand(id);
            var result = await _mediator.Send(command);
            return Ok(result);
        }
    }
}
