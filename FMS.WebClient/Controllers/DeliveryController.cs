using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.DeliveriesCommands;
using FMS.Application.Features.FMS.Delivery.cs;
using FMS.Application.Features.TankManagement.Deliveries.Commands;
using FMS.Application.Features.TankManagement.Deliveries.DTOs;
using FMS.Application.Queries.Database.FMSQuery.DeliveryQueries;
using FMS.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class DeliveryController : ControllerBase
    {
        private readonly IMediator _mediator;

        public DeliveryController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost("Create")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> CreateDelivery([FromBody] DeliveryDTO deliveryDTO)
        {
            var hasPermission = User.HasClaim("permissions", "_Create_Delivery");

            if (!hasPermission)
                return Forbid();

            var userIdClaim = User.Claims.FirstOrDefault(c =>
                c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
                Guid.TryParse(c.Value, out _)
            );

            if (userIdClaim == null)
                return BadRequest("Invalid User ID");

            deliveryDTO.RecordedBy = userIdClaim.Value;

            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            var result = await _mediator.Send(new CreateDeliveryCommand(deliveryDTO));
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }

        [HttpGet]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetDeliveries()
        {
            //var hasPermission = User.HasClaim("permissions", "_Read_Delivery");
            // if (!hasPermission) return Forbid();
            var result = await _mediator.Send(new GetDeliveryListQuery());
            if (result == null)
                return NoContent();
            return Ok(result);
        }

        [HttpGet("byDateRange")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetDeliveryById(DateTime startDate, DateTime endDate)
        {
            //var hasPermission = User.HasClaim("permissions", "_Read_Delivery");
            //if (!hasPermission) return Forbid();
            if (startDate == default || endDate == default)
                return BadRequest("Invalid Date Range");

            var result = await _mediator.Send(
                new GetDeliveryListByDateRangeQuery(startDate, endDate)
            );
            if (result == null)
                return NotFound();
            return Ok(result);
        }

        [HttpGet("byDateRangebySite")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetDeliveryById(
            DateTime startDate,
            DateTime endDate,
            int siteId
        )
        {
            //var hasPermission = User.HasClaim("permissions", "_Read_Delivery");
            //if (!hasPermission) return Forbid();
            if (startDate == default || endDate == default)
                return BadRequest("Invalid Date Range");
            if (siteId <= 0)
                return BadRequest("Invalid Site ID");
            var result = await _mediator.Send(
                new GetDeliveryListQueryByDateRangeBySiteIDQuery(startDate, endDate, siteId)
            );
            if (result == null)
                return NotFound();
            return Ok(result);
        }

        [HttpPut("update")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> UpdateDelivery([FromBody] UpdateDeliveryRequest request)
        {
            var hasPermission = User.HasClaim("permissions", "_Update_Delivery");
            if (!hasPermission)
                return Forbid();

            var userIdClaim = User.Claims.FirstOrDefault(c =>
                c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
                Guid.TryParse(c.Value, out _)
            );

            if (userIdClaim == null)
                return BadRequest("Invalid User ID");

            // Set the user who is making the correction
            request.CorrectionData.RecordedBy = userIdClaim.Value;

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _mediator.Send(new UpdateDeliveryCommand(
                request.OriginalDeliveryId,
                request.CorrectionData
            ));

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpDelete("{id}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> SoftDeleteDelivery(int id)
        {
            var hasPermission = User.HasClaim("permissions", "_Delete_Delivery");
            if (!hasPermission)
                return Forbid();

            var userIdClaim = User.Claims.FirstOrDefault(c =>
                c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
                Guid.TryParse(c.Value, out _)
            );

            if (userIdClaim == null)
                return BadRequest("Invalid User ID");

            var result = await _mediator.Send(new SoftDeleteDeliveryCommand(
                DeliveryId: id,
                DeletedBy: userIdClaim.Value
            ));

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }
    }

    // Request model for update endpoint
    public class UpdateDeliveryRequest
    {
        public int OriginalDeliveryId { get; set; }
        public DeliveryCorrectionDto CorrectionData { get; set; }
    }
}