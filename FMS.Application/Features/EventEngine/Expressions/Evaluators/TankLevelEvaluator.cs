/**
 * File: TankLevelEvaluator.cs
 * Purpose: Evaluates TankLevelEvent conditions — percentage thresholds,
 *          water level thresholds, temperature limits.
 * Dependencies: IExpressionEvaluator, TankLevelEvent
 * Last Modified: 2026-02-11
 *
 * Conditions JSON format:
 * {
 *   "maxPercentageFull": 95,       → triggers if tank > 95% full
 *   "minPercentageFull": 15,       → triggers if tank < 15% full
 *   "maxWaterLevel": 5,            → triggers if water > 5 liters
 *   "maxTemperature": 50           → triggers if temp > 50°C
 * }
 */

using System;
using System.Text.Json;
using FMS.Application.Features.EventEngine.Events;

namespace FMS.Application.Features.EventEngine.Expressions.Evaluators
{
    /// <summary>
    /// Evaluates TankLevelEvent data against tank-specific thresholds.
    /// All conditions are AND-ed: all specified conditions must pass.
    /// </summary>
    public class TankLevelEvaluator : IExpressionEvaluator
    {
        public string EventType => TankLevelEvent.EventTypeName;

        public bool Evaluate(FMSEvent fmsEvent, string? conditionsJson)
        {
            if (string.IsNullOrWhiteSpace(conditionsJson))
                return true;

            if (fmsEvent is not TankLevelEvent tankEvent)
                return false;

            try
            {
                using var doc = JsonDocument.Parse(conditionsJson);
                var root = doc.RootElement;

                // High level threshold (tank too full)
                if (root.TryGetProperty("maxPercentageFull", out var maxPct)
                    && maxPct.TryGetDecimal(out var maxPercent))
                {
                    if (tankEvent.PercentageFull <= maxPercent)
                        return false;
                }

                // Low level threshold (tank too empty)
                if (root.TryGetProperty("minPercentageFull", out var minPct)
                    && minPct.TryGetDecimal(out var minPercent))
                {
                    if (tankEvent.PercentageFull >= minPercent)
                        return false;
                }

                // Water detection threshold
                if (root.TryGetProperty("maxWaterLevel", out var waterProp)
                    && waterProp.TryGetDecimal(out var maxWater))
                {
                    if (tankEvent.WaterLevel <= maxWater)
                        return false;
                }

                // Temperature threshold
                if (root.TryGetProperty("maxTemperature", out var tempProp)
                    && tempProp.TryGetDecimal(out var maxTemp))
                {
                    if (tankEvent.Temperature <= maxTemp)
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
