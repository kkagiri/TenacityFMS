/**
 * File: AlwaysTrueEvaluator.cs
 * Purpose: Evaluator that always returns true — for event types that should
 *          trigger on scope match alone (no condition evaluation needed).
 * Dependencies: IExpressionEvaluator
 * Last Modified: 2026-02-11
 */

using FMS.Application.Features.EventEngine.Events;

namespace FMS.Application.Features.EventEngine.Expressions.Evaluators
{
    /// <summary>
    /// Default/fallback evaluator. Always returns true.
    /// Used for event types registered without a specific evaluator,
    /// or for system events where any match should trigger.
    /// </summary>
    public class AlwaysTrueEvaluator : IExpressionEvaluator
    {
        public string EventType => "*";

        public bool Evaluate(FMSEvent fmsEvent, string? conditionsJson)
        {
            return true;
        }
    }
}
