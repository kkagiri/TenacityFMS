/**
 * File: SensorVarianceEvaluator.cs
 * Purpose: Evaluates SensorVarianceEvent conditions — variance thresholds
 *          between manual and sensor readings.
 * Dependencies: IExpressionEvaluator, SensorVarianceEvent
 * Last Modified: 2026-02-11
 *
 * Conditions JSON format:
 * {
 *   "minVariance": 20,               → trigger if absolute variance >= 20
 *   "minVariancePercent": 1           → trigger if variance percentage >= 1%
 * }
 */

using System;
using System.Text.Json;
using FMS.Application.Features.EventEngine.Events;

namespace FMS.Application.Features.EventEngine.Expressions.Evaluators
{
    /// <summary>
    /// Evaluates SensorVarianceEvent against sensor-vs-manual reading conditions.
    /// </summary>
    public class SensorVarianceEvaluator : IExpressionEvaluator
    {
        public string EventType => SensorVarianceEvent.EventTypeName;

        public bool Evaluate(FMSEvent fmsEvent, string? conditionsJson)
        {
            if (string.IsNullOrWhiteSpace(conditionsJson))
                return true;

            if (fmsEvent is not SensorVarianceEvent varianceEvent)
                return false;

            try
            {
                using var doc = JsonDocument.Parse(conditionsJson);
                var root = doc.RootElement;

                // Minimum absolute variance
                if (root.TryGetProperty("minVariance", out var minVar)
                    && minVar.TryGetDecimal(out var minVariance))
                {
                    if (Math.Abs(varianceEvent.Variance) < minVariance)
                        return false;
                }

                // Minimum variance percentage
                if (root.TryGetProperty("minVariancePercent", out var minPct)
                    && minPct.TryGetDecimal(out var minPercent))
                {
                    if (Math.Abs(varianceEvent.VariancePercentage) < minPercent)
                        return false;
                }

                return true;
            }
            catch (JsonException)
            {
                return true;
            }
        }
    }
}
