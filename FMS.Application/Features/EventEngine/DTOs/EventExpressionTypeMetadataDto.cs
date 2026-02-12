/**
 * File: EventExpressionTypeMetadataDto.cs
 * Purpose: DTO that describes available event types and their configurable condition fields.
 *          Powers the frontend dropdown/form when creating an EventExpression.
 * Dependencies: FMSEvent subclasses (for EventTypeName constants)
 * Last Modified: 2026-02-11
 *
 * Key Functions:
 * - GetAvailableTypes(): returns all registered event types with their metadata
 */

using System.Collections.Generic;
using FMS.Application.Features.EventEngine.Events;

namespace FMS.Application.Features.EventEngine.DTOs
{
    /// <summary>
    /// Describes an available event type and the condition fields the frontend
    /// should render when creating an EventExpression for this type.
    /// </summary>
    public class EventExpressionTypeMetadataDto
    {
        public string EventType { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public List<ConditionFieldDto> AvailableConditions { get; set; } = new();
        public string[] AvailableScopeFilters { get; set; } = System.Array.Empty<string>();
        public string DefaultSeverity { get; set; } = "Medium";
        public int DefaultCooldownMinutes { get; set; } = 30;

        /// <summary>
        /// Returns all registered event types with their metadata.
        /// Add new entries here when creating a new event type.
        /// </summary>
        public static List<EventExpressionTypeMetadataDto> GetAvailableTypes()
        {
            return new List<EventExpressionTypeMetadataDto>
            {
                new()
                {
                    EventType = TankClosingStockEvent.EventTypeName,
                    DisplayName = "Tank Stock Discrepancy",
                    Description = "Triggers when closing stock calculation detects a variance beyond thresholds",
                    Category = "StockReconciliation",
                    AvailableConditions = new List<ConditionFieldDto>
                    {
                        new("minVariance", "Minimum Variance (Liters)", "number", false, "50"),
                        new("minVariancePercent", "Minimum Variance (%)", "number", false, "2"),
                        new("varianceTypeFilter", "Variance Type", "dropdown", false, null, new[] { "Over", "Under" })
                    },
                    AvailableScopeFilters = new[] { "SiteId", "TankId" },
                    DefaultSeverity = "High",
                    DefaultCooldownMinutes = 60
                },
                new()
                {
                    EventType = TankLevelEvent.EventTypeName,
                    DisplayName = "Tank Level Alert",
                    Description = "Triggers when tank level crosses configured thresholds (high, low, water, temperature)",
                    Category = "PtsTankAlarm",
                    AvailableConditions = new List<ConditionFieldDto>
                    {
                        new("maxPercentageFull", "Max Tank Level (%)", "number", false, "95"),
                        new("minPercentageFull", "Min Tank Level (%)", "number", false, "15"),
                        new("maxWaterLevel", "Max Water Level (Liters)", "number", false, "5"),
                        new("maxTemperature", "Max Temperature (°C)", "number", false, "50")
                    },
                    AvailableScopeFilters = new[] { "SiteId", "TankId" },
                    DefaultSeverity = "Medium",
                    DefaultCooldownMinutes = 30
                },
                new()
                {
                    EventType = SensorVarianceEvent.EventTypeName,
                    DisplayName = "Sensor Variance",
                    Description = "Triggers when sensor reading differs from manual dip reading beyond thresholds",
                    Category = "SensorVariance",
                    AvailableConditions = new List<ConditionFieldDto>
                    {
                        new("minVariance", "Minimum Variance (Liters)", "number", false, "20"),
                        new("minVariancePercent", "Minimum Variance (%)", "number", false, "1")
                    },
                    AvailableScopeFilters = new[] { "SiteId", "TankId" },
                    DefaultSeverity = "Medium",
                    DefaultCooldownMinutes = 60
                },
                new()
                {
                    EventType = DeviceStatusEvent.EventTypeName,
                    DisplayName = "Device Status Change",
                    Description = "Triggers when a PTS/ATG device goes offline, comes online, or encounters errors",
                    Category = "DeviceAlerts",
                    AvailableConditions = new List<ConditionFieldDto>
                    {
                        new("statusFilter", "Status Filter", "dropdown", false, "Offline", new[] { "Offline", "Online", "Error", "Disconnected" }),
                        new("minOfflineMinutes", "Min Offline Duration (min)", "number", false, "15"),
                        new("deviceTypeFilter", "Device Type", "dropdown", false, null, new[] { "ATG", "PTS", "GPS" })
                    },
                    AvailableScopeFilters = new[] { "SiteId", "DeviceId" },
                    DefaultSeverity = "High",
                    DefaultCooldownMinutes = 15
                },
                new()
                {
                    EventType = PumpAlarmEvent.EventTypeName,
                    DisplayName = "Pump Alarm",
                    Description = "Triggers when a PTS pump reports an alarm condition (emergency stop, nozzle fault, etc.)",
                    Category = "PtsDeviceAlarm",
                    AvailableConditions = new List<ConditionFieldDto>
                    {
                        new("statusFilter", "Pump Status", "dropdown", false, null, new[] { "EmergencyStop", "NozzleFault", "FlowError", "Fault" }),
                        new("alarmCodeFilter", "Alarm Code", "text", false, null),
                        new("productFilter", "Product Filter", "text", false, null)
                    },
                    AvailableScopeFilters = new[] { "SiteId", "DeviceId" },
                    DefaultSeverity = "Critical",
                    DefaultCooldownMinutes = 5
                },
                new()
                {
                    EventType = VehicleGpsEvent.EventTypeName,
                    DisplayName = "Vehicle GPS Alert",
                    Description = "Triggers when a vehicle GPS tracker changes status or breaches geofence",
                    Category = "DeviceAlerts",
                    AvailableConditions = new List<ConditionFieldDto>
                    {
                        new("statusFilter", "GPS Status", "dropdown", false, "Offline", new[] { "Offline", "Online", "GeofenceBreach", "SpeedViolation" }),
                        new("minOfflineMinutes", "Min Offline Duration (min)", "number", false, "30")
                    },
                    AvailableScopeFilters = new[] { "SiteId" },
                    DefaultSeverity = "Medium",
                    DefaultCooldownMinutes = 30
                },
                new()
                {
                    EventType = SystemEvent.EventTypeName,
                    DisplayName = "System Event",
                    Description = "Triggers for system-level events: issues, maintenance, security, reports",
                    Category = "SystemMaintenance",
                    AvailableConditions = new List<ConditionFieldDto>
                    {
                        new("subTypeFilter", "Sub-Type", "dropdown", false, null,
                            new[] { "IssueCreated", "MaintenanceDue", "SecurityBreach", "ScheduledReport", "BackupComplete" })
                    },
                    AvailableScopeFilters = new[] { "SiteId" },
                    DefaultSeverity = "Medium",
                    DefaultCooldownMinutes = 60
                },
                new()
                {
                    EventType = EventLifecycleEvent.EventTypeName,
                    DisplayName = "Event Lifecycle",
                    Description = "Triggers when an active event changes state (acknowledged, resolved, escalated)",
                    Category = "SystemMaintenance",
                    AvailableConditions = new List<ConditionFieldDto>
                    {
                        new("actionTypeFilter", "Action Type", "dropdown", false, null,
                            new[] { "Acknowledged", "Resolved", "Escalated", "AutoResolved" })
                    },
                    AvailableScopeFilters = System.Array.Empty<string>(),
                    DefaultSeverity = "Low",
                    DefaultCooldownMinutes = 0
                }
            };
        }
    }

    /// <summary>
    /// Describes a single condition field that can be configured on an EventExpression.
    /// </summary>
    public class ConditionFieldDto
    {
        public string Key { get; set; }
        public string Label { get; set; }
        public string InputType { get; set; }
        public bool IsRequired { get; set; }
        public string? DefaultValue { get; set; }
        public string[]? Options { get; set; }

        public ConditionFieldDto(string key, string label, string inputType, bool isRequired, string? defaultValue, string[]? options = null)
        {
            Key = key;
            Label = label;
            InputType = inputType;
            IsRequired = isRequired;
            DefaultValue = defaultValue;
            Options = options;
        }
    }
}
