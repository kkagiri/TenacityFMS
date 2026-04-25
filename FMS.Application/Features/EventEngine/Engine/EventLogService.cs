/**
 * File: EventLogService.cs
 * Purpose: Persists ActiveEvent records and manages their lifecycle.
 *          Called by EventExpressionEngine when CreateActiveEvent = true on an expression.
 * Dependencies: GpsdataContext, ActiveEvent entity
 * Last Modified: 2026-02-11
 *
 * Key Functions:
 * - CreateActiveEventAsync(): creates an ActiveEvent from an FMSEvent + expression
 */

using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.EventEngine.Events;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.EventEngine.Engine
{
    /// <summary>
    /// Manages ActiveEvent persistence and lifecycle.
    /// </summary>
    public class EventLogService
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<EventLogService> _logger;

        public EventLogService(GpsdataContext context, ILogger<EventLogService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Create an ActiveEvent record from an FMSEvent and the expression that matched it.
        /// </summary>
        public async Task<ActiveEvent> CreateActiveEventAsync(
            FMSEvent fmsEvent,
            EventExpression expression,
            CancellationToken ct = default)
        {
            var severityInt = fmsEvent.Severity switch
            {
                "Low" => 1,
                "Medium" => 2,
                "High" => 3,
                "Critical" => 4,
                _ => 2
            };

            var activeEvent = new ActiveEvent
            {
                EventType = fmsEvent.EventType,
                State = "Active",
                TriggerSource = "Expression",
                Severity = severityInt,
                Priority = expression.Priority,
                Message = !string.IsNullOrEmpty(fmsEvent.Message) ? fmsEvent.Message : $"Event: {fmsEvent.EventType}",
                SiteId = fmsEvent.SiteId,
                TankId = fmsEvent.TankId,
                DeviceId = fmsEvent.DeviceId,
                PtsDeviceId = fmsEvent.PtsDeviceId,
                EventExpressionId = expression.Id,
                TriggeredAt = fmsEvent.OccurredAt,
                TriggeredBy = fmsEvent.TriggeredBy,
                CreatedAt = DateTime.UtcNow
            };

            // Serialize event data snapshot
            try
            {
                activeEvent.EventData = fmsEvent.SerializeEventData();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to serialize FMSEvent data for ActiveEvent");
                activeEvent.EventData = "{}";
            }

            _context.ActiveEvents.Add(activeEvent);

            _logger.LogInformation(
                "ActiveEvent created for EventType={EventType}, ExpressionId={ExpressionId}",
                fmsEvent.EventType, expression.Id);

            return activeEvent;
        }
    }
}
