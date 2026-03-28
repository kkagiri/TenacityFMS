/**
 * File: ActiveEventsController.cs
 * Purpose: REST API controller for managing ActiveEvents (the new "active alarms").
 *          Provides lifecycle operations: list, acknowledge, resolve, get stats.
 * Dependencies: GpsdataContext, ILogger, FMSResponse
 * Last Modified: 2026-02-11
 *
 * Key Endpoints:
 * - GET    /api/v1/active-events             — List with filters
 * - GET    /api/v1/active-events/{id}         — Get by ID
 * - GET    /api/v1/active-events/stats        — Dashboard statistics
 * - POST   /api/v1/active-events/{id}/acknowledge — Acknowledge an event
 * - POST   /api/v1/active-events/{id}/resolve     — Resolve an event
 * - POST   /api/v1/active-events/bulk-acknowledge — Bulk acknowledge
 */

using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Common.Constants;
using FMS.Application.Features.EventEngine.Engine;
using FMS.Application.Features.EventEngine.Events;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using FMS.WebClient.Attributes;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.WebClient.Controllers
{
    [ApiController]
    [Route("api/v1/active-events")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class ActiveEventsController : ControllerBase
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<ActiveEventsController> _logger;
        private readonly IEventExpressionEngine _eventEngine;

        public ActiveEventsController(
            GpsdataContext context,
            ILogger<ActiveEventsController> logger,
            IEventExpressionEngine eventEngine)
        {
            _context = context;
            _logger = logger;
            _eventEngine = eventEngine;
        }

        /// <summary>
        /// Lists active events with optional filtering.
        /// </summary>
        [HttpGet]
        [RequirePermission(Permissions.EventExpression.Read, Permissions.Admin.ATGAdmin)]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? eventType = null,
            [FromQuery] string? state = null,
            [FromQuery] int? siteId = null,
            [FromQuery] string? severity = null,
            [FromQuery] int skip = 0,
            [FromQuery] int take = 50,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var query = _context.ActiveEvents
                    .Include(e => e.Site)
                    .Include(e => e.Tank)
                    .Include(e => e.EventExpression)
                    .AsQueryable();

                if (!string.IsNullOrWhiteSpace(eventType))
                    query = query.Where(e => e.EventType == eventType);

                if (!string.IsNullOrWhiteSpace(state))
                    query = query.Where(e => e.State == state);

                if (siteId.HasValue)
                    query = query.Where(e => e.SiteId == siteId.Value);

                query = query.OrderByDescending(e => e.TriggeredAt);

                var events = await query
                    .Skip(skip)
                    .Take(take)
                    .ToListAsync(cancellationToken);

                return Ok(FMSResponse<List<ActiveEvent>>.Success(events, "Active events fetched successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching active events");
                return StatusCode(500, FMSResponse<object>.SystemError($"Error fetching active events: {ex.Message}"));
            }
        }

        /// <summary>
        /// Gets a single active event by ID.
        /// </summary>
        [HttpGet("{id:int}")]
        [RequirePermission(Permissions.EventExpression.Read, Permissions.Admin.ATGAdmin)]
        public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken = default)
        {
            try
            {
                var entity = await _context.ActiveEvents
                    .Include(e => e.Site)
                    .Include(e => e.Tank)
                    .Include(e => e.EventExpression)
                    .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

                if (entity == null)
                    return NotFound(FMSResponse<object>.Failed($"Active event with ID {id} not found", "NOT_FOUND"));

                return Ok(FMSResponse<ActiveEvent>.Success(entity, "Active event fetched successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching active event {Id}", id);
                return StatusCode(500, FMSResponse<object>.SystemError($"Error fetching active event: {ex.Message}"));
            }
        }

        /// <summary>
        /// Returns aggregated statistics for the dashboard.
        /// </summary>
        [HttpGet("stats")]
        [RequirePermission(Permissions.EventExpression.Read, Permissions.Admin.ATGAdmin)]
        public async Task<IActionResult> GetStats(
            [FromQuery] int? siteId = null,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var query = _context.ActiveEvents.AsQueryable();

                if (siteId.HasValue)
                    query = query.Where(e => e.SiteId == siteId.Value);

                var stats = new
                {
                    Total = await query.CountAsync(cancellationToken),
                    Active = await query.CountAsync(e => e.State == "Active", cancellationToken),
                    Acknowledged = await query.CountAsync(e => e.State == "Acknowledged", cancellationToken),
                    Resolved = await query.CountAsync(e => e.State == "Resolved", cancellationToken),
                    BySeverity = await query
                        .Where(e => e.State != "Resolved")
                        .GroupBy(e => e.Severity)
                        .Select(g => new { Severity = g.Key, Count = g.Count() })
                        .ToListAsync(cancellationToken),
                    ByEventType = await query
                        .Where(e => e.State != "Resolved")
                        .GroupBy(e => e.EventType)
                        .Select(g => new { EventType = g.Key, Count = g.Count() })
                        .ToListAsync(cancellationToken)
                };

                return Ok(FMSResponse<object>.Success(stats, "Stats fetched successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching active event stats");
                return StatusCode(500, FMSResponse<object>.SystemError($"Error fetching stats: {ex.Message}"));
            }
        }

        /// <summary>
        /// Acknowledges an active event.
        /// </summary>
        [HttpPost("{id:int}/acknowledge")]
        [RequirePermission(Permissions.EventExpression.Edit, Permissions.Admin.ATGAdmin)]
        public async Task<IActionResult> Acknowledge(int id, CancellationToken cancellationToken = default)
        {
            try
            {
                var entity = await _context.ActiveEvents
                    .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

                if (entity == null)
                    return NotFound(FMSResponse<object>.Failed($"Active event with ID {id} not found", "NOT_FOUND"));

                if (entity.State == "Resolved")
                    return BadRequest(FMSResponse<object>.Failed("Cannot acknowledge a resolved event"));

                var userId = GetCurrentUserId();
                entity.State = "Acknowledged";
                entity.AcknowledgedAt = DateTime.UtcNow;
                entity.AcknowledgedBy = userId;
                entity.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync(cancellationToken);

                // Fire lifecycle event so notification policies for "Acknowledged" can trigger
                try
                {
                    await _eventEngine.ProcessAsync(new EventLifecycleEvent
                    {
                        ActiveEventId = entity.Id,
                        ActionType = "Acknowledged",
                        OriginalEventType = entity.EventType,
                        ActionBy = userId,
                        SiteId = entity.SiteId,
                        TankId = entity.TankId,
                        DeviceId = entity.DeviceId,
                        Severity = entity.Severity.ToString(),
                        Message = $"Event '{entity.Message}' acknowledged by {userId}"
                    }, cancellationToken);
                }
                catch (Exception lifecycleEx)
                {
                    _logger.LogWarning(lifecycleEx, "Failed to fire lifecycle event for acknowledge {Id}", id);
                }

                return Ok(FMSResponse<ActiveEvent>.Success(entity, "Event acknowledged successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error acknowledging active event {Id}", id);
                return StatusCode(500, FMSResponse<object>.SystemError($"Error acknowledging event: {ex.Message}"));
            }
        }

        /// <summary>
        /// Resolves an active event.
        /// </summary>
        [HttpPost("{id:int}/resolve")]
        [RequirePermission(Permissions.EventExpression.Edit, Permissions.Admin.ATGAdmin)]
        public async Task<IActionResult> Resolve(
            int id,
            [FromBody] ResolveEventRequest? request = null,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var entity = await _context.ActiveEvents
                    .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

                if (entity == null)
                    return NotFound(FMSResponse<object>.Failed($"Active event with ID {id} not found", "NOT_FOUND"));

                if (entity.State == "Resolved")
                    return BadRequest(FMSResponse<object>.Failed("Event is already resolved"));

                var userId = GetCurrentUserId();
                entity.State = "Resolved";
                entity.ResolvedAt = DateTime.UtcNow;
                entity.ResolvedBy = userId;
                entity.ResolutionNotes = request?.Notes;
                entity.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync(cancellationToken);

                // Fire lifecycle event so notification policies for "Resolved" can trigger
                try
                {
                    await _eventEngine.ProcessAsync(new EventLifecycleEvent
                    {
                        ActiveEventId = entity.Id,
                        ActionType = "Resolved",
                        OriginalEventType = entity.EventType,
                        ActionBy = userId,
                        Notes = request?.Notes,
                        SiteId = entity.SiteId,
                        TankId = entity.TankId,
                        DeviceId = entity.DeviceId,
                        Severity = entity.Severity.ToString(),
                        Message = $"Event '{entity.Message}' resolved by {userId}"
                    }, cancellationToken);
                }
                catch (Exception lifecycleEx)
                {
                    _logger.LogWarning(lifecycleEx, "Failed to fire lifecycle event for resolve {Id}", id);
                }

                return Ok(FMSResponse<ActiveEvent>.Success(entity, "Event resolved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resolving active event {Id}", id);
                return StatusCode(500, FMSResponse<object>.SystemError($"Error resolving event: {ex.Message}"));
            }
        }

        /// <summary>
        /// Bulk acknowledges multiple active events.
        /// </summary>
        [HttpPost("bulk-acknowledge")]
        [RequirePermission(Permissions.EventExpression.Edit, Permissions.Admin.ATGAdmin)]
        public async Task<IActionResult> BulkAcknowledge(
            [FromBody] BulkEventActionRequest request,
            CancellationToken cancellationToken = default)
        {
            try
            {
                if (request?.Ids == null || request.Ids.Count == 0)
                    return BadRequest(FMSResponse<object>.Failed("No event IDs provided"));

                var events = await _context.ActiveEvents
                    .Where(e => request.Ids.Contains(e.Id) && e.State != "Resolved")
                    .ToListAsync(cancellationToken);

                var userId = GetCurrentUserId();
                var now = DateTime.UtcNow;

                foreach (var entity in events)
                {
                    entity.State = "Acknowledged";
                    entity.AcknowledgedAt = now;
                    entity.AcknowledgedBy = userId;
                    entity.UpdatedAt = now;
                }

                await _context.SaveChangesAsync(cancellationToken);

                // Fire lifecycle events for each acknowledged event
                foreach (var entity in events)
                {
                    try
                    {
                        await _eventEngine.ProcessAsync(new EventLifecycleEvent
                        {
                            ActiveEventId = entity.Id,
                            ActionType = "Acknowledged",
                            OriginalEventType = entity.EventType,
                            ActionBy = userId,
                            SiteId = entity.SiteId,
                            TankId = entity.TankId,
                            DeviceId = entity.DeviceId,
                            Severity = entity.Severity.ToString(),
                            Message = $"Event '{entity.Message}' bulk-acknowledged by {userId}"
                        }, cancellationToken);
                    }
                    catch (Exception lifecycleEx)
                    {
                        _logger.LogWarning(lifecycleEx,
                            "Failed to fire lifecycle event for bulk-acknowledge {Id}", entity.Id);
                    }
                }

                return Ok(FMSResponse<object>.Success(
                    new { AcknowledgedCount = events.Count },
                    $"{events.Count} events acknowledged successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error bulk acknowledging active events");
                return StatusCode(500, FMSResponse<object>.SystemError($"Error acknowledging events: {ex.Message}"));
            }
        }

        private string GetCurrentUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub")
                ?? "Unknown";
        }
    }

    /// <summary>
    /// Request body for resolving an active event.
    /// </summary>
    public class ResolveEventRequest
    {
        public string? Notes { get; set; }
    }

    /// <summary>
    /// Request body for bulk event actions.
    /// </summary>
    public class BulkEventActionRequest
    {
        public List<int> Ids { get; set; } = new();
    }
}
