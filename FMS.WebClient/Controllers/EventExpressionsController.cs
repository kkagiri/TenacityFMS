/**
 * File: EventExpressionsController.cs
 * Purpose: REST API controller for managing EventExpressions (CRUD + type metadata).
 * Dependencies: MediatR, FMSResponse, EventExpression DTOs
 * Last Modified: 2026-02-11
 *
 * Key Endpoints:
 * - GET    /api/v1/event-expressions            — List with filters
 * - GET    /api/v1/event-expressions/{id}        — Get by ID
 * - GET    /api/v1/event-expressions/types       — Available event types + conditions
 * - GET    /api/v1/event-expressions/{id}/executions — Execution history
 * - POST   /api/v1/event-expressions            — Create
 * - PUT    /api/v1/event-expressions/{id}        — Update
 * - DELETE /api/v1/event-expressions/{id}        — Soft-delete (deactivate)
 */

using System;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common.Constants;
using FMS.Application.Features.EventEngine.Commands;
using FMS.Application.Features.EventEngine.DTOs;
using FMS.Application.Features.EventEngine.Queries;
using FMS.WebClient.Attributes;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace FMS.WebClient.Controllers
{
    [ApiController]
    [Route("api/v1/event-expressions")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class EventExpressionsController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ILogger<EventExpressionsController> _logger;

        public EventExpressionsController(
            IMediator mediator,
            ILogger<EventExpressionsController> logger)
        {
            _mediator = mediator;
            _logger = logger;
        }

        /// <summary>
        /// Lists event expressions with optional filtering.
        /// </summary>
        [HttpGet]
        [RequirePermission(Permissions.EventExpression.Read)]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? eventType = null,
            [FromQuery] int? siteId = null,
            [FromQuery] bool? isActive = null,
            [FromQuery] int skip = 0,
            [FromQuery] int take = 50,
            CancellationToken cancellationToken = default)
        {
            var query = new GetEventExpressionsQuery(eventType, siteId, isActive, skip, take);
            var result = await _mediator.Send(query, cancellationToken);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Gets a single event expression by ID.
        /// </summary>
        [HttpGet("{id:int}")]
        [RequirePermission(Permissions.EventExpression.Read)]
        public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken = default)
        {
            var query = new GetEventExpressionByIdQuery(id);
            var result = await _mediator.Send(query, cancellationToken);
            return result.IsSuccess ? Ok(result) : NotFound(result);
        }

        /// <summary>
        /// Returns all available event types with their configurable condition fields.
        /// Powers the frontend dropdown/form when creating an EventExpression.
        /// </summary>
        [HttpGet("types")]
        [RequirePermission(Permissions.EventExpression.Read)]
        public async Task<IActionResult> GetTypes(CancellationToken cancellationToken = default)
        {
            var query = new GetEventExpressionTypesQuery();
            var result = await _mediator.Send(query, cancellationToken);
            return Ok(result);
        }

        /// <summary>
        /// Gets execution history for a specific event expression.
        /// </summary>
        [HttpGet("{id:int}/executions")]
        [RequirePermission(Permissions.EventExpression.Read)]
        public async Task<IActionResult> GetExecutions(
            int id,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] bool? wasTriggered = null,
            [FromQuery] int skip = 0,
            [FromQuery] int take = 50,
            CancellationToken cancellationToken = default)
        {
            var query = new GetEventExpressionExecutionsQuery(id, fromDate, toDate, wasTriggered, skip, take);
            var result = await _mediator.Send(query, cancellationToken);
            return result.IsSuccess ? Ok(result) : NotFound(result);
        }

        /// <summary>
        /// Creates a new event expression.
        /// </summary>
        [HttpPost]
        [RequirePermission(Permissions.EventExpression.Create)]
        public async Task<IActionResult> Create(
            [FromBody] CreateEventExpressionRequest request,
            CancellationToken cancellationToken = default)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetCurrentUserId();
            var command = new CreateEventExpressionCommand
            {
                Request = request,
                CreatedBy = userId
            };

            var result = await _mediator.Send(command, cancellationToken);

            if (result.IsSuccess)
                return CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result);

            return BadRequest(result);
        }

        /// <summary>
        /// Updates an existing event expression.
        /// </summary>
        [HttpPut("{id:int}")]
        [RequirePermission(Permissions.EventExpression.Edit)]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] UpdateEventExpressionRequest request,
            CancellationToken cancellationToken = default)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetCurrentUserId();
            var command = new UpdateEventExpressionCommand
            {
                Id = id,
                Request = request,
                ModifiedBy = userId
            };

            var result = await _mediator.Send(command, cancellationToken);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Soft-deletes (deactivates) an event expression.
        /// </summary>
        [HttpDelete("{id:int}")]
        [RequirePermission(Permissions.EventExpression.Delete)]
        public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken = default)
        {
            var userId = GetCurrentUserId();
            var command = new DeleteEventExpressionCommand
            {
                Id = id,
                DeletedBy = userId
            };

            var result = await _mediator.Send(command, cancellationToken);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        private string GetCurrentUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub")
                ?? "Unknown";
        }
    }
}
