using AutoMapper.Configuration.Annotations;
using FMS.Application.Command.DatabaseCommand.EmployeeCmd;
using FMS.Application.ModelsDTOs.FMS.Employee;
using FMS.Application.Queries.Database.FMSQuery.EmployeeQuery;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers
{
    [ApiController]
    [Route("api/[controller]")]

    public class EmployeeController : ControllerBase

    {
        private readonly IMediator _mediator;

        public EmployeeController(IMediator mediator)
        {
            _mediator = mediator;
        }
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateEmployee([FromBody] EmployeeDto employeeDto)
        {
            var hasPermission = User.HasClaim("permissions", "_createEmployee");

            var userIdClaim = User.Claims.FirstOrDefault(c =>
                            c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
                            Guid.TryParse(c.Value, out _));
            if (userIdClaim == null) return BadRequest("Invalid User ID");

            employeeDto.CreatedBy = userIdClaim.Value;


            if (!hasPermission) return Forbid();
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var command = new EmployeeCreateCmd { EmployeeDto = employeeDto };
            var result = await _mediator.Send(command);
            if (!result.Success) return BadRequest(result.Message);
            return Ok(result);
        }



        [HttpGet("site/{siteId}")]
        [Authorize]
        public async Task<IActionResult> GetEmployeeBySiteId(int siteId)
        {
            var hasPermission = User.HasClaim("permissions", "_readEmployee");
            if (!hasPermission) return Forbid();
            if (siteId <= 0) return BadRequest("Invalid ID");
            var query = new GetEmployeeBySiteIdQuery { SiteId = siteId };
            var employees = await _mediator.Send(query);
            return Ok(employees);
        }



        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetEmployeeList([FromQuery] bool? active)
        {
            var hasPermission = User.HasClaim("permissions", "_readEmployee");
            var permissionlist = User.Claims.ToList();

            if (!hasPermission) return Forbid();

            var query = new GetEmployeeQuery(active ?? true);
            var employees = await _mediator.Send(query);
            return Ok(employees);
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetEmployee(int id)
        {
            var hasPermission = User.HasClaim("permissions", "_readEmployee");
            if (!hasPermission) return Forbid();
            if (id <= 0) return BadRequest("Invalid ID");

            var query = new GetEmployeeByIdQuery { Id = id };
            var employee = await _mediator.Send(query);

            if (employee == null) return NotFound();

            return Ok(employee);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEmployee(int id, [FromBody] EmployeeDto employeeDto)
        {
            var hasPermission = User.HasClaim("permissions", "_editEmployee");
            if (!hasPermission) return Forbid();
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (id <= 0) return BadRequest("Invalid ID");
            if (id != employeeDto.Id) return BadRequest("ID mismatch");

            var userIdClaim = User.Claims.FirstOrDefault(c =>
                c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
                Guid.TryParse(c.Value, out _));

            if (userIdClaim == null) return BadRequest("Invalid User ID");

            employeeDto.ModifiedBy = userIdClaim.Value;

            var command = new EmployeeUpdateCmd(id, employeeDto);

            var result = await _mediator.Send(command);
            if (!result.Success) return BadRequest(result.Message);

            return Ok(result);

        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteEmployee(int id)
        {
            var hasPermission = User.HasClaim("permissions", "_deleteEmployee");
            if (!hasPermission) return Forbid();
            if (id <= 0) return BadRequest("Invalid ID");

            var command = new EmployeeDeleteCmd(id);
            var result = await _mediator.Send(command);
            if (!result.Success) return BadRequest(result.Message);

            return NoContent();
        }

    }
}
