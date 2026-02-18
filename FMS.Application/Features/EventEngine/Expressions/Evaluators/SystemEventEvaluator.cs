/**
 * File: SystemEventEvaluator.cs
 * Purpose: Evaluates SystemEvent conditions — _alertTypeKey matching, multi-site/tank
 *          scope filtering via _siteIds/_tankIds arrays, and entry-type-specific logic
 *          for NoTankStockEntry events.
 * Dependencies: IExpressionEvaluator, SystemEvent
 * Last Modified: 2026-02-17
 *
 * Conditions JSON format (NoTankStockEntry example):
 * {
 *   "_alertTypeKey": "NoTankStockEntry",
 *   "_siteIds": [2, 5, 6],
 *   "_tankIds": [1, 2, 12],
 *   "entryType": "ClosingStock",
 *   "checkFrequency": "Daily",
 *   "gracePeriodHours": "4",
 *   "checkTimeUtc": "10:00"
 * }
 */

using System;
using System.Linq;
using System.Text.Json;
using FMS.Application.Features.EventEngine.Events;

namespace FMS.Application.Features.EventEngine.Expressions.Evaluators
{
    /// <summary>
    /// Evaluates SystemEvent against expression conditions.
    /// Handles multi-scope filtering (_siteIds, _tankIds) and
    /// _alertTypeKey routing so different System-type expressions
    /// (NoTankStockEntry, IssueTracker, etc.) don't cross-fire.
    /// </summary>
    public class SystemEventEvaluator : IExpressionEvaluator
    {
        public string EventType => SystemEvent.EventTypeName; // "System"

        public bool Evaluate(FMSEvent fmsEvent, string? conditionsJson)
        {
            if (string.IsNullOrWhiteSpace(conditionsJson))
                return true;

            if (fmsEvent is not SystemEvent systemEvent)
                return false;

            try
            {
                using var doc = JsonDocument.Parse(conditionsJson);
                var root = doc.RootElement;

                // 1. _alertTypeKey must match event SubType
                //    This prevents a NoTankStockEntry expression from firing
                //    when an IssueTracker SystemEvent comes through.
                if (root.TryGetProperty("_alertTypeKey", out var alertTypeKeyProp))
                {
                    var alertTypeKey = alertTypeKeyProp.GetString();
                    if (!string.IsNullOrEmpty(alertTypeKey) &&
                        !string.Equals(systemEvent.SubType, alertTypeKey, StringComparison.OrdinalIgnoreCase))
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

                // 3. Multi-tank scope: _tankIds array
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

                // 4. Entry-type filter (for NoTankStockEntry)
                if (root.TryGetProperty("entryType", out var entryTypeProp))
                {
                    var requiredEntryType = entryTypeProp.GetString();
                    if (!string.IsNullOrEmpty(requiredEntryType) &&
                        !string.Equals(requiredEntryType, "Both", StringComparison.OrdinalIgnoreCase))
                    {
                        // Event data carries "missingEntryType" = "OpeningStock" / "ClosingStock" / "Both"
                        if (fmsEvent.Data.TryGetValue("missingEntryType", out var missingType))
                        {
                            var missingTypeStr = missingType?.ToString();
                            // If event says "Both" are missing, any filter matches
                            if (!string.Equals(missingTypeStr, "Both", StringComparison.OrdinalIgnoreCase) &&
                                !string.Equals(missingTypeStr, requiredEntryType, StringComparison.OrdinalIgnoreCase))
                            {
                                return false;
                            }
                        }
                    }
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
