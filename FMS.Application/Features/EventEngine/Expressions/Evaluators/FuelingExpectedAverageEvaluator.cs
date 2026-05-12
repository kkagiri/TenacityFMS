/**
 * File: FuelingExpectedAverageEvaluator.cs
 * Purpose: Evaluates FuelingExpectedAverageEvent conditions such as variance
 *          thresholds, fueling source, measurement mode, and vehicle filter.
 * Dependencies: IExpressionEvaluator, FuelingExpectedAverageEvent
 * Last Modified: 2026-03-23
 *
 * Conditions JSON format:
 * {
 *   "minVariancePercent": 10,
 *   "minFuelVolume": 20,
 *   "sourceFilter": "PumpTransaction",
 *   "measurementModeFilter": "KmPerLiter",
 *   "vehicleIdFilter": 123
 * }
 */

using System;
using System.Text.Json;
using FMS.Application.Features.EventEngine.Events;

namespace FMS.Application.Features.EventEngine.Expressions.Evaluators
{
    /// <summary>
    /// Evaluates fueling expected-average breach events against expression conditions.
    /// </summary>
    public class FuelingExpectedAverageEvaluator : IExpressionEvaluator
    {
        public string EventType => FuelingExpectedAverageEvent.EventTypeName;

        public bool Evaluate(FMSEvent fmsEvent, string? conditionsJson)
        {
            if (string.IsNullOrWhiteSpace(conditionsJson))
                return true;

            if (fmsEvent is not FuelingExpectedAverageEvent fuelingEvent)
                return false;

            try
            {
                using var doc = JsonDocument.Parse(conditionsJson);
                var root = doc.RootElement;

                if (root.TryGetProperty("minVariancePercent", out var minVarianceProp) &&
                    minVarianceProp.TryGetDecimal(out var minVariancePercent) &&
                    fuelingEvent.VariancePercent < minVariancePercent)
                {
                    return false;
                }

                if (root.TryGetProperty("minFuelVolume", out var minFuelVolumeProp) &&
                    minFuelVolumeProp.TryGetDecimal(out var minFuelVolume) &&
                    fuelingEvent.FuelVolume < minFuelVolume)
                {
                    return false;
                }

                if (root.TryGetProperty("sourceFilter", out var sourceProp))
                {
                    var sourceFilter = sourceProp.GetString();
                    if (!string.IsNullOrWhiteSpace(sourceFilter) &&
                        !string.Equals(fuelingEvent.FuelingSource, sourceFilter, StringComparison.OrdinalIgnoreCase))
                    {
                        return false;
                    }
                }

                if (root.TryGetProperty("measurementModeFilter", out var modeProp))
                {
                    var measurementModeFilter = modeProp.GetString();
                    if (!string.IsNullOrWhiteSpace(measurementModeFilter) &&
                        !string.Equals(fuelingEvent.MeasurementMode, measurementModeFilter, StringComparison.OrdinalIgnoreCase))
                    {
                        return false;
                    }
                }

                if (root.TryGetProperty("vehicleIdFilter", out var vehicleProp) &&
                    vehicleProp.TryGetInt32(out var vehicleIdFilter) &&
                    fuelingEvent.VehicleId != vehicleIdFilter)
                {
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