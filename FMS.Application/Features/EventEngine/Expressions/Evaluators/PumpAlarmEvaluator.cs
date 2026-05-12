/**
 * File: PumpAlarmEvaluator.cs
 * Purpose: Evaluates PumpAlarmEvent conditions — alarm code filters,
 *          pump status filters, product filters.
 * Dependencies: IExpressionEvaluator, PumpAlarmEvent
 * Last Modified: 2026-02-11
 *
 * Conditions JSON format:
 * {
 *   "statusFilter": "EmergencyStop",      → only trigger for specific pump status
 *   "alarmCodeFilter": "E001",            → only trigger for specific alarm code
 *   "productFilter": "Diesel"             → only trigger for specific product
 * }
 */

using System;
using System.Text.Json;
using FMS.Application.Features.EventEngine.Events;

namespace FMS.Application.Features.EventEngine.Expressions.Evaluators
{
    /// <summary>
    /// Evaluates PumpAlarmEvent against pump-specific conditions.
    /// </summary>
    public class PumpAlarmEvaluator : IExpressionEvaluator
    {
        public string EventType => PumpAlarmEvent.EventTypeName;

        public bool Evaluate(FMSEvent fmsEvent, string? conditionsJson)
        {
            if (string.IsNullOrWhiteSpace(conditionsJson))
                return true;

            if (fmsEvent is not PumpAlarmEvent pumpEvent)
                return false;

            try
            {
                using var doc = JsonDocument.Parse(conditionsJson);
                var root = doc.RootElement;

                // Pump status filter
                if (root.TryGetProperty("statusFilter", out var statusProp))
                {
                    var statusFilter = statusProp.GetString();
                    if (!string.IsNullOrEmpty(statusFilter)
                        && !string.Equals(pumpEvent.PumpStatus, statusFilter, StringComparison.OrdinalIgnoreCase))
                    {
                        return false;
                    }
                }

                // Alarm code filter
                if (root.TryGetProperty("alarmCodeFilter", out var codeProp))
                {
                    var codeFilter = codeProp.GetString();
                    if (!string.IsNullOrEmpty(codeFilter)
                        && !string.Equals(pumpEvent.AlarmCode, codeFilter, StringComparison.OrdinalIgnoreCase))
                    {
                        return false;
                    }
                }

                // Product filter
                if (root.TryGetProperty("productFilter", out var prodProp))
                {
                    var productFilter = prodProp.GetString();
                    if (!string.IsNullOrEmpty(productFilter)
                        && !string.Equals(pumpEvent.ProductName, productFilter, StringComparison.OrdinalIgnoreCase))
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
