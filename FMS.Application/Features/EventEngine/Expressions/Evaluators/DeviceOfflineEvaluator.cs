/**
 * File: DeviceOfflineEvaluator.cs
 * Purpose: Evaluates DeviceStatusEvent conditions — offline duration,
 *          specific status values, device type filters.
 * Dependencies: IExpressionEvaluator, DeviceStatusEvent
 * Last Modified: 2026-02-11
 *
 * Conditions JSON format:
 * {
 *   "statusFilter": "Offline",          → only trigger for this status
 *   "minOfflineMinutes": 15,            → minimum offline duration before triggering
 *   "deviceTypeFilter": "ATG"           → only trigger for specific device type
 * }
 */

using System;
using System.Text.Json;
using FMS.Application.Features.EventEngine.Events;

namespace FMS.Application.Features.EventEngine.Expressions.Evaluators
{
    /// <summary>
    /// Evaluates DeviceStatusEvent data against device-specific conditions.
    /// </summary>
    public class DeviceOfflineEvaluator : IExpressionEvaluator
    {
        public string EventType => DeviceStatusEvent.EventTypeName;

        public bool Evaluate(FMSEvent fmsEvent, string? conditionsJson)
        {
            if (string.IsNullOrWhiteSpace(conditionsJson))
                return true;

            if (fmsEvent is not DeviceStatusEvent deviceEvent)
                return false;

            try
            {
                using var doc = JsonDocument.Parse(conditionsJson);
                var root = doc.RootElement;

                // Status filter — only trigger for specific status
                if (root.TryGetProperty("statusFilter", out var statusProp))
                {
                    var filterValue = statusProp.GetString();
                    if (!string.IsNullOrEmpty(filterValue)
                        && !string.Equals(deviceEvent.DeviceStatus, filterValue, StringComparison.OrdinalIgnoreCase))
                    {
                        return false;
                    }
                }

                // Minimum offline duration
                if (root.TryGetProperty("minOfflineMinutes", out var minOffline)
                    && minOffline.TryGetInt32(out var minMinutes))
                {
                    if (deviceEvent.OfflineDuration == null
                        || deviceEvent.OfflineDuration.Value.TotalMinutes < minMinutes)
                    {
                        return false;
                    }
                }

                // Device type filter
                if (root.TryGetProperty("deviceTypeFilter", out var typeProp))
                {
                    var typeFilter = typeProp.GetString();
                    if (!string.IsNullOrEmpty(typeFilter)
                        && !string.Equals(deviceEvent.DeviceType, typeFilter, StringComparison.OrdinalIgnoreCase))
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
