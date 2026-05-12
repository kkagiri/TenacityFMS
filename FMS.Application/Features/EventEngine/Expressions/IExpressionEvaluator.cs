/**
 * File: IExpressionEvaluator.cs
 * Purpose: Interface for evaluating FMSEvent data against EventExpression conditions JSON.
 *          Each EventType has its own evaluator registered in ExpressionEvaluatorFactory.
 * Dependencies: FMSEvent
 * Last Modified: 2026-02-11
 *
 * Key Members:
 * - EventType: which event type this evaluator handles
 * - Evaluate(): tests whether the event matches the conditions JSON
 */

namespace FMS.Application.Features.EventEngine.Expressions
{
    /// <summary>
    /// Evaluates FMSEvent data against an EventExpression's Conditions JSON.
    /// One evaluator per EventType is registered in ExpressionEvaluatorFactory.
    /// </summary>
    public interface IExpressionEvaluator
    {
        /// <summary>
        /// The EventType this evaluator handles (must match FMSEvent.EventType).
        /// </summary>
        string EventType { get; }

        /// <summary>
        /// Evaluate whether the event matches the conditions.
        /// Returns true if the event should trigger the expression.
        /// </summary>
        /// <param name="fmsEvent">The event being evaluated.</param>
        /// <param name="conditionsJson">The Conditions JSON from the EventExpression. May be null/empty.</param>
        /// <returns>True if conditions are met (or no conditions specified).</returns>
        bool Evaluate(Events.FMSEvent fmsEvent, string? conditionsJson);
    }
}
