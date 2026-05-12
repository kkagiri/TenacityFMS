/**
 * File: ReconciliationEvaluator.cs
 * Purpose: Evaluates ReconciliationEvent conditions — SubType matching via _alertTypeKey,
 *          multi-site/tank scope filtering, and variance threshold conditions.
 * Dependencies: IExpressionEvaluator, ReconciliationEvent
 * Last Modified: 2026-02-18
 *
 * Conditions JSON format:
 * {
 *   "_alertTypeKey": "Reconciliation",
 *   "_siteIds": [2, 5],
 *   "_tankIds": [1, 12],
 *   "subTypeFilter": "DiscrepancyDetected",
 *   "minVariance": 50,
 *   "minVariancePercent": 2
 * }
 */

using System;
using System.Linq;
using System.Text.Json;
using FMS.Application.Features.EventEngine.Events;

namespace FMS.Application.Features.EventEngine.Expressions.Evaluators
{
    /// <summary>
    /// Evaluates ReconciliationEvent against expression conditions.
    /// Handles SubType filtering, multi-scope (_siteIds, _tankIds),
    /// and variance threshold conditions for discrepancy-type events.
    /// </summary>
    public class ReconciliationEvaluator : IExpressionEvaluator
    {
        public string EventType => ReconciliationEvent.EventTypeName; // "Reconciliation"

        public bool Evaluate(FMSEvent fmsEvent, string? conditionsJson)
        {
            if (string.IsNullOrWhiteSpace(conditionsJson))
                return true;

            if (fmsEvent is not ReconciliationEvent reconEvent)
                return false;

            try
            {
                using var doc = JsonDocument.Parse(conditionsJson);
                var root = doc.RootElement;

                // 1. _alertTypeKey routing — prevents cross-fire between different
                //    reconciliation expressions if needed in the future
                if (root.TryGetProperty("_alertTypeKey", out var alertTypeKeyProp))
                {
                    var alertTypeKey = alertTypeKeyProp.GetString();
                    if (!string.IsNullOrEmpty(alertTypeKey) &&
                        !string.Equals(alertTypeKey, ReconciliationEvent.EventTypeName, StringComparison.OrdinalIgnoreCase))
                    {
                        return false;
                    }
                }

                // 2. SubType filter — match specific reconciliation event types
                if (root.TryGetProperty("subTypeFilter", out var subTypeProp))
                {
                    var subTypeFilter = subTypeProp.GetString();
                    if (!string.IsNullOrEmpty(subTypeFilter) &&
                        !string.Equals(reconEvent.SubType, subTypeFilter, StringComparison.OrdinalIgnoreCase))
                    {
                        return false;
                    }
                }

                // 3. Multi-site scope: _siteIds array
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

                // 4. Multi-tank scope: _tankIds array
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

                // 5. Minimum absolute variance (for discrepancy events)
                if (root.TryGetProperty("minVariance", out var minVar) &&
                    minVar.TryGetDecimal(out var minVariance))
                {
                    if (Math.Abs(reconEvent.VarianceLiters) < minVariance)
                        return false;
                }

                // 6. Minimum variance percentage (for discrepancy events)
                if (root.TryGetProperty("minVariancePercent", out var minPct) &&
                    minPct.TryGetDecimal(out var minPercent))
                {
                    if (Math.Abs(reconEvent.VariancePercentage) < minPercent)
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
