/**
 * File: DeliveryController.cs
 * Purpose: Handles delivery creation, updates, deletes, and retrieval endpoints.
 * Dependencies: MediatR, delivery commands/queries, JWT claims.
 * Last Modified: 2026-02-04
 *
 * Key Actions:
 * - CreateDelivery(): Creates a delivery and stamps the current user.
 * - UpdateDelivery(): Applies delivery corrections with user tracking.
 * - SoftDeleteDelivery(): Soft deletes a delivery with audit user metadata.
 */
using System.Diagnostics;
using System.Linq;
using System.Security.Claims;
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

using FMS.WebClient.Attributes;
using FMS.Application.Common.Constants;

namespace FMS.WebClient.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.Delivery.Read)]
    public class DeliveryController : ControllerBase
    {
        private readonly IMediator _mediator;

        public DeliveryController(IMediator mediator)
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

        [HttpPost]
        [HttpPost("Create")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        [RequirePermission(Permissions.Delivery.Create)]
        public async Task<IActionResult> CreateDelivery([FromBody] DeliveryDTO deliveryDTO)
        {
            if (!TryGetCurrentUserId(out var userId))
                return BadRequest("Invalid User ID");

            deliveryDTO.RecordedBy = userId;

            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            var result = await _mediator.Send(new CreateDeliveryCommand(deliveryDTO));
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }

        [HttpGet]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        [RequirePermission(Permissions.Delivery.Read)]
        public async Task<IActionResult> GetDeliveries()
        {
            var result = await _mediator.Send(new GetDeliveryListQuery());
            if (result == null)
                return NoContent();
            return Ok(result);
        }

        [HttpGet("byDateRange")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        [RequirePermission(Permissions.Delivery.Read)]
        public async Task<IActionResult> GetDeliveryById(DateTime startDate, DateTime endDate)
        {
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
        [RequirePermission(Permissions.Delivery.Read)]
        public async Task<IActionResult> GetDeliveryById(
            DateTime startDate,
            DateTime endDate,
            int siteId
        )
        {
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
        [RequirePermission(Permissions.Delivery.Update)]
        public async Task<IActionResult> UpdateDelivery([FromBody] UpdateDeliveryRequest request)
        {
            if (!TryGetCurrentUserId(out var userId))
                return BadRequest("Invalid User ID");

            // Set the user who is making the correction
            request.CorrectionData.RecordedBy = userId;

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
        [RequirePermission(Permissions.Delivery.Delete)]
        public async Task<IActionResult> SoftDeleteDelivery(int id)
        {
            if (!TryGetCurrentUserId(out var userId))
                return BadRequest("Invalid User ID");

            var result = await _mediator.Send(new SoftDeleteDeliveryCommand(
                DeliveryId: id,
                DeletedBy: userId
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
