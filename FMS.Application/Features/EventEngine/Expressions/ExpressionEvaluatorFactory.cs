/**
 * File: ExpressionEvaluatorFactory.cs
 * Purpose: Maps EventType strings to their IExpressionEvaluator implementations.
 *          When adding a new event type, register its evaluator here.
 * Dependencies: IExpressionEvaluator, all evaluator implementations
 * Last Modified: 2026-02-11
 *
 * Key Functions:
 * - GetEvaluator(): returns the evaluator for an event type
 * - Register(): adds a new evaluator to the registry
 */

using System;
using System.Collections.Generic;
using FMS.Application.Features.EventEngine.Expressions.Evaluators;

namespace FMS.Application.Features.EventEngine.Expressions
{
    /// <summary>
    /// Factory that maps EventType → IExpressionEvaluator.
    /// Falls back to AlwaysTrueEvaluator if no specific evaluator is registered.
    /// </summary>
    public class ExpressionEvaluatorFactory
    {
        private readonly Dictionary<string, IExpressionEvaluator> _evaluators = new(StringComparer.OrdinalIgnoreCase);
        private readonly AlwaysTrueEvaluator _fallback = new();

        public ExpressionEvaluatorFactory()
        {
            // Register built-in evaluators
            Register(new ThresholdEvaluator());
            Register(new TankLevelEvaluator());
            Register(new DeviceOfflineEvaluator());
            Register(new TankClosingStockEvaluator());
            Register(new SensorVarianceEvaluator());
            Register(new PumpAlarmEvaluator());
            Register(new SystemEventEvaluator());
            Register(new ReconciliationEvaluator());
            Register(new TagMonitoringEvaluator());
            Register(new IssueTrackerEvaluator());
        }

        /// <summary>
        /// Register an evaluator for its EventType.
        /// Overwrites any existing registration for the same type.
        /// </summary>
        public void Register(IExpressionEvaluator evaluator)
        {
            _evaluators[evaluator.EventType] = evaluator;
        }

        /// <summary>
        /// Get the evaluator for the given EventType.
        /// Returns AlwaysTrueEvaluator if no specific evaluator is registered.
        /// </summary>
        public IExpressionEvaluator GetEvaluator(string eventType)
        {
            if (string.IsNullOrEmpty(eventType))
                return _fallback;

            return _evaluators.TryGetValue(eventType, out var evaluator)
                ? evaluator
                : _fallback;
        }

        /// <summary>
        /// Check if a specific evaluator is registered for this event type.
        /// </summary>
        public bool HasEvaluator(string eventType)
        {
            return _evaluators.ContainsKey(eventType);
        }

        /// <summary>
        /// Get all registered event types.
        /// </summary>
        public IEnumerable<string> GetRegisteredEventTypes()
        {
            return _evaluators.Keys;
        }
    }
}
