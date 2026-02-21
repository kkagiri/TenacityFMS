/**
 * File: TagMonitoringEvaluator.cs
 * Purpose: Evaluates TagMonitoringEvent conditions — SubType matching,
 *          multi-site scope filtering, and vehicle scope filtering.
 * Dependencies: IExpressionEvaluator, TagMonitoringEvent
 * Last Modified: 2026-02-18
 *
 * Conditions JSON format:
 * {
 *   "subTypeFilter": "TagUpdateError",
 *   "_siteIds": [2, 5]
 * }
 */

using System;
using System.Linq;
using System.Text.Json;
using FMS.Application.Features.EventEngine.Events;

namespace FMS.Application.Features.EventEngine.Expressions.Evaluators
{
    /// <summary>
    /// Evaluates TagMonitoringEvent against expression conditions.
    /// Handles SubType filtering (Success/Error) and multi-scope filtering.
    /// </summary>
    public class TagMonitoringEvaluator : IExpressionEvaluator
    {
        public string EventType => TagMonitoringEvent.EventTypeName; // "TagMonitoring"

        public bool Evaluate(FMSEvent fmsEvent, string? conditionsJson)
        {
            if (string.IsNullOrWhiteSpace(conditionsJson))
                return true;

            if (fmsEvent is not TagMonitoringEvent tagEvent)
                return false;

            try
            {
                using var doc = JsonDocument.Parse(conditionsJson);
                var root = doc.RootElement;

                // 1. SubType filter — TagUpdateSuccess or TagUpdateError
                if (root.TryGetProperty("subTypeFilter", out var subTypeProp))
                {
                    var subTypeFilter = subTypeProp.GetString();
                    if (!string.IsNullOrEmpty(subTypeFilter) &&
                        !string.Equals(tagEvent.SubType, subTypeFilter, StringComparison.OrdinalIgnoreCase))
                    {
                        return false;
                    }
                }

                // 2. Multi-site scope: _siteIds array
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

                // 3. Vehicle filter (via VehicleId on the event)
                if (root.TryGetProperty("vehicleIdFilter", out var vehicleProp) &&
                    vehicleProp.TryGetInt32(out var vehicleIdFilter))
                {
                    if (tagEvent.VehicleId != vehicleIdFilter)
                        return false;
                }

                return true;
            }
            catch (JsonException)
            {
                // Malformed JSON — don't suppress, let it trigger
                return true;
            }
        }
    }
}
