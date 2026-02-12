/**
 * File: IEventExpressionEngine.cs
 * Purpose: The single entry point for ALL notification-triggering business operations.
 *          Business code emits FMSEvents and calls ProcessAsync() — nothing else.
 * Dependencies: FMSEvent, EventProcessingResult
 * Last Modified: 2026-02-11
 *
 * Key Members:
 * - ProcessAsync(): evaluates an FMSEvent against all matching EventExpressions
 */

using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.EventEngine.Events;

namespace FMS.Application.Features.EventEngine.Engine
{
    /// <summary>
    /// The single entry point for ALL notification-triggering operations.
    /// Business code emits FMSEvent subclasses and calls ProcessAsync().
    /// The engine finds matching expressions, evaluates conditions,
    /// checks cooldowns, delivers notifications, and logs executions.
    /// </summary>
    public interface IEventExpressionEngine
    {
        /// <summary>
        /// Process an FMSEvent through the expression engine.
        /// 1. Query EventExpressions matching EventType + scope (SiteId, TankId, DeviceId)
        /// 2. Evaluate conditions via the registered IExpressionEvaluator
        /// 3. Check cooldown and daily rate limits
        /// 4. Resolve NotificationPolicy → channels, templates, recipients
        /// 5. Deliver notification via NotificationService
        /// 6. Persist ActiveEvent (if CreateActiveEvent = true)
        /// 7. Record EventExpressionExecution for audit trail
        /// </summary>
        /// <param name="fmsEvent">The typed event to process.</param>
        /// <param name="ct">Cancellation token.</param>
        /// <returns>Result summarizing matched, triggered, and suppressed expressions.</returns>
        Task<EventProcessingResult> ProcessAsync(FMSEvent fmsEvent, CancellationToken ct = default);
    }
}
