/**
 * File: InTankDeliveryEvaluator.cs
 * Purpose: Evaluates InTankDeliveryEvent conditions — volume thresholds,
 *          fuel grade filters, match status, and volume percentage limits.
 * Dependencies: IExpressionEvaluator, InTankDeliveryEvent
 * Last Modified: 2026-02-27
 *
 * Conditions JSON format:
 * {
 *   "minVolume": 500,                  → trigger if delivery volume >= 500L
 *   "maxVolumePercent": 95,            → trigger if fill % >= 95
 *   "fuelGradeFilter": "Diesel",       → only trigger for specific fuel grade
 *   "matchStatusFilter": "Unmatched",  → only trigger for unmatched ITDs
 *   "_siteIds": [2, 5],               → multi-site scope
 *   "_tankIds": [1, 12]               → multi-tank scope
 * }
 */

using System;
using System.Linq;
using System.Text.Json;
using FMS.Application.Features.EventEngine.Events;

namespace FMS.Application.Features.EventEngine.Expressions.Evaluators
{
    /// <summary>
    /// Evaluates InTankDeliveryEvent against expression conditions.
    /// Handles volume thresholds, fuel grade filtering, match status,
    /// and multi-scope (_siteIds, _tankIds) filtering.
    /// </summary>
    public class InTankDeliveryEvaluator : IExpressionEvaluator
    {
        public string EventType => InTankDeliveryEvent.EventTypeName; // "InTankDelivery"

        public bool Evaluate(FMSEvent fmsEvent, string? conditionsJson)
        {
            if (string.IsNullOrWhiteSpace(conditionsJson))
                return true;

            if (fmsEvent is not InTankDeliveryEvent itdEvent)
                return false;

            try
            {
                using var doc = JsonDocument.Parse(conditionsJson);
                var root = doc.RootElement;

                // 1. _alertTypeKey routing
                if (root.TryGetProperty("_alertTypeKey", out var alertTypeKeyProp))
                {
                    var alertTypeKey = alertTypeKeyProp.GetString();
                    if (!string.IsNullOrEmpty(alertTypeKey) &&
                        !string.Equals(alertTypeKey, InTankDeliveryEvent.EventTypeName, StringComparison.OrdinalIgnoreCase))
                    {
                        return false;
                    }
                }

                // 2. Minimum volume threshold
                if (root.TryGetProperty("minVolume", out var minVolProp) &&
                    minVolProp.TryGetDecimal(out var minVolume))
                {
                    if (itdEvent.Volume < minVolume)
                        return false;
                }

                // 3. Maximum volume percentage (fill level check)
                if (root.TryGetProperty("maxVolumePercent", out var maxPctProp) &&
                    maxPctProp.TryGetDecimal(out var maxPercent))
                {
                    if (itdEvent.VolumePercentage > maxPercent)
                        return false;
                }

                // 4. Fuel grade filter
                if (root.TryGetProperty("fuelGradeFilter", out var gradeProp))
                {
                    var gradeFilter = gradeProp.GetString();
                    if (!string.IsNullOrEmpty(gradeFilter) &&
                        !string.Equals(itdEvent.FuelGrade, gradeFilter, StringComparison.OrdinalIgnoreCase))
                    {
                        return false;
                    }
                }

                // 5. Match status filter
                if (root.TryGetProperty("matchStatusFilter", out var statusProp))
                {
                    var statusFilter = statusProp.GetString();
                    if (!string.IsNullOrEmpty(statusFilter) &&
                        !string.Equals(itdEvent.Status, statusFilter, StringComparison.OrdinalIgnoreCase))
                    {
                        return false;
                    }
                }

                // 6. Multi-site scope: _siteIds array
                if (root.TryGetProperty("_siteIds", out var siteIdsProp) &&
                    siteIdsProp.ValueKind == JsonValueKind.Array &&
                    fmsEvent.SiteId.HasValue)
                {
                    var siteIds = siteIdsProp.EnumerateArray()
                        .Where(e => e.ValueKind == JsonValueKind.Number)
                        .Select(e => e.TryGetInt32(out var id) ? id : -1)
                        .Where(id => id > 0)
                        .ToList();

                    if (siteIds.Count > 0 && !siteIds.Contains(fmsEvent.SiteId.Value))
                        return false;
                }

                // 7. Multi-tank scope: _tankIds array
                if (root.TryGetProperty("_tankIds", out var tankIdsProp) &&
                    tankIdsProp.ValueKind == JsonValueKind.Array &&
                    fmsEvent.TankId.HasValue)
                {
                    var tankIds = tankIdsProp.EnumerateArray()
                        .Where(e => e.ValueKind == JsonValueKind.Number)
                        .Select(e => e.TryGetInt32(out var id) ? id : -1)
                        .Where(id => id > 0)
                        .ToList();

                    if (tankIds.Count > 0 && !tankIds.Contains(fmsEvent.TankId.Value))
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
