/**
 * File: ManualDeliveryEvaluator.cs
 * Purpose: Evaluates ManualDeliveryEvent conditions — volume thresholds,
 *          supplier filters, same-day checks, and cost limits.
 * Dependencies: IExpressionEvaluator, ManualDeliveryEvent
 * Last Modified: 2026-02-27
 *
 * Conditions JSON format:
 * {
 *   "minVolume": 1000,              → trigger if delivery volume >= 1000L
 *   "maxFillPercent": 95,           → trigger if tank fill % exceeds 95%
 *   "sameDayOnly": true,            → only trigger for same-day entries
 *   "supplierFilter": "Shell",      → only trigger for specific supplier
 *   "productFilter": "Diesel",      → only trigger for specific product
 *   "_siteIds": [2, 5],            → multi-site scope
 *   "_tankIds": [1, 12]            → multi-tank scope
 * }
 */

using System;
using System.Linq;
using System.Text.Json;
using FMS.Application.Features.EventEngine.Events;

namespace FMS.Application.Features.EventEngine.Expressions.Evaluators
{
    /// <summary>
    /// Evaluates ManualDeliveryEvent against expression conditions.
    /// Handles volume thresholds, supplier filtering, same-day checks,
    /// product filtering, and multi-scope (_siteIds, _tankIds) filtering.
    /// </summary>
    public class ManualDeliveryEvaluator : IExpressionEvaluator
    {
        public string EventType => ManualDeliveryEvent.EventTypeName; // "ManualDelivery"

        public bool Evaluate(FMSEvent fmsEvent, string? conditionsJson)
        {
            if (string.IsNullOrWhiteSpace(conditionsJson))
                return true;

            if (fmsEvent is not ManualDeliveryEvent deliveryEvent)
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
                        !string.Equals(alertTypeKey, ManualDeliveryEvent.EventTypeName, StringComparison.OrdinalIgnoreCase))
                    {
                        return false;
                    }
                }

                // 2. Minimum volume threshold
                if (root.TryGetProperty("minVolume", out var minVolProp) &&
                    minVolProp.TryGetDecimal(out var minVolume))
                {
                    if (deliveryEvent.ManualDeliveryAmount < minVolume)
                        return false;
                }

                // 3. Maximum fill percentage
                if (root.TryGetProperty("maxFillPercent", out var maxPctProp) &&
                    maxPctProp.TryGetDecimal(out var maxPercent))
                {
                    if (deliveryEvent.FillPercentage > maxPercent)
                        return false;
                }

                // 4. Same-day only filter
                if (root.TryGetProperty("sameDayOnly", out var sameDayProp))
                {
                    bool sameDayOnly;
                    if (sameDayProp.ValueKind == JsonValueKind.True)
                        sameDayOnly = true;
                    else if (sameDayProp.ValueKind == JsonValueKind.False)
                        sameDayOnly = false;
                    else if (sameDayProp.ValueKind == JsonValueKind.String &&
                             bool.TryParse(sameDayProp.GetString(), out var parsed))
                        sameDayOnly = parsed;
                    else
                        sameDayOnly = false;

                    if (sameDayOnly && !deliveryEvent.IsSameDay)
                        return false;
                }

                // 5. Supplier filter
                if (root.TryGetProperty("supplierFilter", out var supplierProp))
                {
                    var supplierFilter = supplierProp.GetString();
                    if (!string.IsNullOrEmpty(supplierFilter) &&
                        !string.Equals(deliveryEvent.SupplierName, supplierFilter, StringComparison.OrdinalIgnoreCase))
                    {
                        return false;
                    }
                }

                // 6. Product filter
                if (root.TryGetProperty("productFilter", out var productProp))
                {
                    var productFilter = productProp.GetString();
                    if (!string.IsNullOrEmpty(productFilter) &&
                        !string.Equals(deliveryEvent.ProductName, productFilter, StringComparison.OrdinalIgnoreCase))
                    {
                        return false;
                    }
                }

                // 7. Multi-site scope: _siteIds array
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

                // 8. Multi-tank scope: _tankIds array
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
