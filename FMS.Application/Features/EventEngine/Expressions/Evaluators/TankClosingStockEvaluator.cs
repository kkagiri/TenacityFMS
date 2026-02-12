/**
 * File: TankClosingStockEvaluator.cs
 * Purpose: Evaluates TankClosingStockEvent conditions — variance thresholds,
 *          variance percentage, variance type filters.
 * Dependencies: IExpressionEvaluator, TankClosingStockEvent
 * Last Modified: 2026-02-11
 *
 * Conditions JSON format:
 * {
 *   "minVariance": 50,               → trigger if absolute variance >= 50
 *   "minVariancePercent": 2,          → trigger if variance percentage >= 2%
 *   "varianceTypeFilter": "Over"      → only trigger for Over/Under/any
 * }
 */

using System;
using System.Text.Json;
using FMS.Application.Features.EventEngine.Events;

namespace FMS.Application.Features.EventEngine.Expressions.Evaluators
{
    /// <summary>
    /// Evaluates TankClosingStockEvent against discrepancy conditions.
    /// </summary>
    public class TankClosingStockEvaluator : IExpressionEvaluator
    {
        public string EventType => TankClosingStockEvent.EventTypeName;

        public bool Evaluate(FMSEvent fmsEvent, string? conditionsJson)
        {
            if (string.IsNullOrWhiteSpace(conditionsJson))
                return true;

            if (fmsEvent is not TankClosingStockEvent stockEvent)
                return false;

            try
            {
                using var doc = JsonDocument.Parse(conditionsJson);
                var root = doc.RootElement;

                // Minimum absolute variance
                if (root.TryGetProperty("minVariance", out var minVar)
                    && minVar.TryGetDecimal(out var minVariance))
                {
                    if (Math.Abs(stockEvent.Variance) < minVariance)
                        return false;
                }

                // Minimum variance percentage
                if (root.TryGetProperty("minVariancePercent", out var minPct)
                    && minPct.TryGetDecimal(out var minPercent))
                {
                    if (Math.Abs(stockEvent.VariancePercentage) < minPercent)
                        return false;
                }

                // Variance type filter
                if (root.TryGetProperty("varianceTypeFilter", out var typeProp))
                {
                    var typeFilter = typeProp.GetString();
                    if (!string.IsNullOrEmpty(typeFilter)
                        && !string.Equals(stockEvent.VarianceType, typeFilter, StringComparison.OrdinalIgnoreCase))
                    {
                        return false;
                    }
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
