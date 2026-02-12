/**
 * File: EventProcessingResult.cs
 * Purpose: Result object returned by IEventExpressionEngine.ProcessAsync().
 *          Summarizes how many expressions matched, triggered, or were suppressed.
 * Dependencies: None
 * Last Modified: 2026-02-11
 *
 * Key Properties:
 * - MatchedExpressions: count of expressions whose scope matched
 * - TriggeredCount: count that actually fired notifications
 * - SuppressedCount: count blocked by cooldown/daily cap/condition
 * - Errors: any errors encountered during processing
 */

using System.Collections.Generic;

namespace FMS.Application.Features.EventEngine.Events
{
    /// <summary>
    /// Result returned by IEventExpressionEngine.ProcessAsync().
    /// Provides audit trail of what happened during event evaluation.
    /// </summary>
    public class EventProcessingResult
    {
        /// <summary>
        /// The EventType that was processed.
        /// </summary>
        public string EventType { get; set; } = string.Empty;

        /// <summary>
        /// Total number of EventExpressions whose EventType + scope matched the event.
        /// </summary>
        public int MatchedExpressions { get; set; }

        /// <summary>
        /// Number of expressions that passed conditions and triggered notifications.
        /// </summary>
        public int TriggeredCount { get; set; }

        /// <summary>
        /// Number of expressions suppressed (cooldown, daily cap, condition not met, disabled).
        /// </summary>
        public int SuppressedCount { get; set; }

        /// <summary>
        /// Details of each expression evaluation.
        /// </summary>
        public List<ExpressionEvaluationDetail> Details { get; set; } = new();

        /// <summary>
        /// Any errors encountered during processing. Empty if all went well.
        /// </summary>
        public List<string> Errors { get; set; } = new();

        /// <summary>
        /// Whether the overall processing completed without errors.
        /// </summary>
        public bool Success => Errors.Count == 0;

        /// <summary>
        /// Creates a simple success result with no matches.
        /// </summary>
        public static EventProcessingResult NoMatch(string eventType) => new()
        {
            EventType = eventType,
            MatchedExpressions = 0,
            TriggeredCount = 0,
            SuppressedCount = 0
        };

        /// <summary>
        /// Creates an error result.
        /// </summary>
        public static EventProcessingResult Error(string eventType, string error) => new()
        {
            EventType = eventType,
            Errors = new List<string> { error }
        };
    }

    /// <summary>
    /// Detail record for each expression evaluated during event processing.
    /// </summary>
    public class ExpressionEvaluationDetail
    {
        public int EventExpressionId { get; set; }
        public string ExpressionName { get; set; } = string.Empty;
        public bool WasTriggered { get; set; }
        public string? SuppressedReason { get; set; }
        public int? NotificationId { get; set; }
    }
}
