/**
 * File: EventExpressionTypeMetadataDto.cs
 * Purpose: DTO that describes available event/alert types and their configurable condition fields.
 *          Powers the frontend dropdown/form when creating an EventExpression.
 *          Unified structure mapping AlertConfigurationConstants to event evaluator bindings.
 * Dependencies: FMSEvent subclasses (for EventTypeName constants)
 * Last Modified: 2026-02-27
 *
 * Key Functions:
 * - GetAvailableTypes(): returns all registered event/alert types with metadata
 *
 * Groups (business domains):
 * - Tank Stock:       Stock discrepancy, sensor variance
 * - Tank Monitoring:  Level alerts (low, high, water, temperature)
 * - Fuel Delivery:    In-tank delivery detection, manual delivery entries
 * - PTS Device:       Device status changes, pump alarms
 * - GPS & Vehicle:    Vehicle GPS alerts, geofence, speed
 * - Issue Tracker:    Issue lifecycle events
 * - System:           System events, event lifecycle
 *
 * AlertTypeKey is the unique identifier for each dropdown entry.
 * EventType is the evaluator binding (event class EventTypeName constant).
 * They are the same for most entries; they differ when multiple alert types
 * share one evaluator (e.g., IssueTracker → System evaluator).
 *
 * Scopes (physical entities that an expression can target):
 * - SiteId, TankId, DeviceId, VehicleId, UserId, ProductId
 */

using System.Collections.Generic;
using FMS.Application.Features.EventEngine.Events;

namespace FMS.Application.Features.EventEngine.DTOs
{
    /// <summary>
    /// Describes an available event/alert type and the condition fields the frontend
    /// should render when creating an EventExpression for this type.
    /// </summary>
    public class EventExpressionTypeMetadataDto
    {
        /// <summary>Unique key for this entry — used as dropdown valueExpr in the frontend.</summary>
        public string AlertTypeKey { get; set; } = string.Empty;

        /// <summary>Evaluator binding — maps to an FMSEvent subclass EventTypeName constant.
        /// Stored in EventExpression.EventType for matching incoming events.</summary>
        public string EventType { get; set; } = string.Empty;

        public string DisplayName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        /// <summary>Business domain group name for UI grouping.</summary>
        public string Category { get; set; } = string.Empty;

        /// <summary>FontAwesome icon class for the category group header (fa-light fa-*).</summary>
        public string CategoryIcon { get; set; } = string.Empty;

        public List<ConditionFieldDto> AvailableConditions { get; set; } = new();

        /// <summary>
        /// Which scope filters apply to this type.
        /// Possible values: SiteId, TankId, VehicleId, DeviceId, UserId, ProductId
        /// </summary>
        public string[] AvailableScopeFilters { get; set; } = System.Array.Empty<string>();

        public string DefaultSeverity { get; set; } = "Medium";
        public int DefaultCooldownMinutes { get; set; } = 30;

        /// <summary>
        /// Returns all registered event/alert types, organized by business domain.
        /// AlertTypeKey is unique per entry; EventType may be shared where multiple
        /// alert types map to the same underlying evaluator.
        /// </summary>
        public static List<EventExpressionTypeMetadataDto> GetAvailableTypes()
        {
            return new List<EventExpressionTypeMetadataDto>
            {
                // ═══════════════════════════════════════════════════
                // Group: Tank Stock
                // Covers: stock discrepancy detection, sensor vs manual variance
                // Related AlertConfigurationConstants: TankClosingStockDiscrepancy,
                //   TankSensorVariance, TankReconciliation
                // ═══════════════════════════════════════════════════
                new()
                {
                    AlertTypeKey = TankClosingStockEvent.EventTypeName,
                    EventType = TankClosingStockEvent.EventTypeName,
                    DisplayName = "Tank Stock Discrepancy",
                    Description = "Triggers when closing stock calculation detects a variance beyond thresholds",
                    Category = "Tank Stock",
                    CategoryIcon = "fa-light fa-gas-pump",
                    AvailableConditions = new List<ConditionFieldDto>
                    {
                        new("minVariance", "Minimum Variance (Liters)", "number", false, "50"),
                        new("minVariancePercent", "Minimum Variance (%)", "number", false, "2"),
                        new("varianceTypeFilter", "Variance Type", "select", false, null, new[] { "Over", "Under" })
                    },
                    AvailableScopeFilters = new[] { "SiteId", "TankId", "ProductId" },
                    DefaultSeverity = "High",
                    DefaultCooldownMinutes = 60
                },
                new()
                {
                    AlertTypeKey = SensorVarianceEvent.EventTypeName,
                    EventType = SensorVarianceEvent.EventTypeName,
                    DisplayName = "Sensor Variance",
                    Description = "Triggers when sensor reading differs from manual dip reading beyond thresholds",
                    Category = "Tank Stock",
                    CategoryIcon = "fa-light fa-gas-pump",
                    AvailableConditions = new List<ConditionFieldDto>
                    {
                        new("minVariance", "Minimum Variance (Liters)", "number", false, "20"),
                        new("minVariancePercent", "Minimum Variance (%)", "number", false, "1")
                    },
                    AvailableScopeFilters = new[] { "SiteId", "TankId", "ProductId" },
                    DefaultSeverity = "Medium",
                    DefaultCooldownMinutes = 60
                },
                new()
                {
                    AlertTypeKey = "NoTankStockEntry",
                    EventType = SystemEvent.EventTypeName,
                    DisplayName = "No Tank Stock Entry",
                    Description = "Triggers when no opening or closing stock entry has been submitted within a configured schedule (daily, weekly, or monthly)",
                    Category = "Tank Stock",
                    CategoryIcon = "fa-light fa-gas-pump",
                    AvailableConditions = new List<ConditionFieldDto>
                    {
                        new("entryType", "Entry Type", "select", true, "ClosingStock",
                            new[] { "OpeningStock", "ClosingStock", "Both" }),
                        new("checkFrequency", "Check Frequency", "select", true, "Daily",
                            new[] { "Daily", "Weekly", "Monthly" }),
                        new("gracePeriodHours", "Grace Period (hours)", "number", false, "4",
                            null),
                        new("checkTimeUtc", "Check Time (UTC)", "time", false, "10:00",
                            null)
                    },
                    AvailableScopeFilters = new[] { "SiteId", "TankId" },
                    DefaultSeverity = "Medium",
                    DefaultCooldownMinutes = 1440
                },

                // ═══════════════════════════════════════════════════
                // Group: Tank Monitoring
                // Covers: tank level thresholds (low, high, water, temperature)
                // Related AlertConfigurationConstants: TankLowLevel, TankHighLevel,
                //   TankCriticalLowLevel, TankCriticalHighLevel, TankWaterDetection,
                //   TankTemperature, TankStaleData, TankCapacityLimit, TankLeakage
                // ═══════════════════════════════════════════════════
                new()
                {
                    AlertTypeKey = TankLevelEvent.EventTypeName,
                    EventType = TankLevelEvent.EventTypeName,
                    DisplayName = "Tank Level Alert",
                    Description = "Triggers when tank level crosses configured thresholds (high, low, water, temperature)",
                    Category = "Tank Monitoring",
                    CategoryIcon = "fa-light fa-gauge",
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

                // ═══════════════════════════════════════════════════
                // Group: PTS Device
                // Covers: PTS/ATG device connectivity, pump alarms, probe alarms
                // Related AlertConfigurationConstants: PTSDeviceOffline,
                //   PTSProbeAlarmCooldown, PTSSystemLevelCooldown
                // ═══════════════════════════════════════════════════
                new()
                {
                    AlertTypeKey = DeviceStatusEvent.EventTypeName,
                    EventType = DeviceStatusEvent.EventTypeName,
                    DisplayName = "Device Status Change",
                    Description = "Triggers when a PTS/ATG device goes offline, comes online, or encounters errors",
                    Category = "PTS Device",
                    CategoryIcon = "fa-light fa-microchip",
                    AvailableConditions = new List<ConditionFieldDto>
                    {
                        new("statusFilter", "Status Filter", "select", false, "Offline", new[] { "Offline", "Online", "Error", "Disconnected" }),
                        new("minOfflineMinutes", "Min Offline Duration (min)", "number", false, "15"),
                        new("deviceTypeFilter", "Device Type", "select", false, null, new[] { "ATG", "PTS", "GPS" })
                    },
                    AvailableScopeFilters = new[] { "SiteId", "DeviceId" },
                    DefaultSeverity = "High",
                    DefaultCooldownMinutes = 15
                },
                new()
                {
                    AlertTypeKey = PumpAlarmEvent.EventTypeName,
                    EventType = PumpAlarmEvent.EventTypeName,
                    DisplayName = "Pump Alarm",
                    Description = "Triggers when a PTS pump reports an alarm condition (emergency stop, nozzle fault, etc.)",
                    Category = "PTS Device",
                    CategoryIcon = "fa-light fa-microchip",
                    AvailableConditions = new List<ConditionFieldDto>
                    {
                        new("statusFilter", "Pump Status", "select", false, null, new[] { "EmergencyStop", "NozzleFault", "FlowError", "Fault" }),
                        new("alarmCodeFilter", "Alarm Code", "text", false, null),
                        new("productFilter", "Product Filter", "text", false, null)
                    },
                    AvailableScopeFilters = new[] { "SiteId", "DeviceId" },
                    DefaultSeverity = "Critical",
                    DefaultCooldownMinutes = 5
                },

                // ═══════════════════════════════════════════════════
                // Group: GPS & Vehicle
                // Covers: GPS tracker status, geofence breach, speed violations,
                //         maintenance scheduling, odometer sync
                // Related AlertConfigurationConstants: GPSTagOffline,
                //   VehicleMaintenanceDue, OdometerSync
                // ═══════════════════════════════════════════════════
                new()
                {
                    AlertTypeKey = VehicleGpsEvent.EventTypeName,
                    EventType = VehicleGpsEvent.EventTypeName,
                    DisplayName = "Vehicle GPS Alert",
                    Description = "Triggers when a vehicle GPS tracker changes status, breaches geofence, or violates speed limits",
                    Category = "GPS & Vehicle",
                    CategoryIcon = "fa-light fa-car",
                    AvailableConditions = new List<ConditionFieldDto>
                    {
                        new("statusFilter", "GPS Status", "select", false, "Offline", new[] { "Offline", "Online", "GeofenceBreach", "SpeedViolation" }),
                        new("minOfflineMinutes", "Min Offline Duration (min)", "number", false, "30"),
                        new("maintenanceFilter", "Maintenance Status", "select", false, null, new[] { "Due", "Overdue", "Upcoming" })
                    },
                    AvailableScopeFilters = new[] { "SiteId", "VehicleId" },
                    DefaultSeverity = "Medium",
                    DefaultCooldownMinutes = 30
                },

                // ═══════════════════════════════════════════════════
                // Group: Issue Tracker
                // Covers: issue creation, updates, escalation, overdue detection
                // Evaluator: SystemEvent (shares the System evaluator)
                // AlertTypeKey differs from EventType for unique dropdown selection
                // ═══════════════════════════════════════════════════
                new()
                {
                    AlertTypeKey = IssueTrackerEvent.EventTypeName,
                    EventType = IssueTrackerEvent.EventTypeName,
                    DisplayName = "Issue Tracker Alert",
                    Description = "Triggers when issues are auto-created, escalated, or marked overdue in the issue tracking system",
                    Category = "Issue Tracker",
                    CategoryIcon = "fa-light fa-clipboard-list-check",
                    AvailableConditions = new List<ConditionFieldDto>
                    {
                        new("subTypeFilter", "Issue Action", "select", false, null,
                            new[] { "IssueCreated", "IssueUpdated", "IssueEscalated", "IssueOverdue" }),
                        new("issuePriorityFilter", "Priority Filter", "select", false, null,
                            new[] { "Low", "Medium", "High", "Critical" }),
                        new("entityTypeFilter", "Entity Type", "select", false, null,
                            new[] { "vehicle", "pts", "atg" })
                    },
                    AvailableScopeFilters = new[] { "SiteId", "VehicleId" },
                    DefaultSeverity = "High",
                    DefaultCooldownMinutes = 60
                },

                // ═══════════════════════════════════════════════════
                // Group: Reconciliation
                // Covers: automated reconciliation lifecycle — policy execution,
                //         discrepancy detection, cycle summaries, manual review
                // ═══════════════════════════════════════════════════
                new()
                {
                    AlertTypeKey = ReconciliationEvent.EventTypeName,
                    EventType = ReconciliationEvent.EventTypeName,
                    DisplayName = "Reconciliation Alert",
                    Description = "Triggers for automated reconciliation events: policy failures, discrepancy detection, cycle summaries, manual review requests",
                    Category = "Tank Stock",
                    CategoryIcon = "fa-light fa-gas-pump",
                    AvailableConditions = new List<ConditionFieldDto>
                    {
                        new("subTypeFilter", "Event Type", "select", false, null,
                            new[] { "PolicyExecutionFailed", "CycleSummary", "CycleCriticalFailure",
                                    "DiscrepancyDetected", "PolicyCompleted", "ReconciliationFailed",
                                    "ReconciliationSuccess", "ReconciliationCriticalError",
                                    "ManualReviewRequired", "ExecutionSummary", "SystemHealthAlert" }),
                        new("minVariance", "Minimum Variance (Liters)", "number", false, "50"),
                        new("minVariancePercent", "Minimum Variance (%)", "number", false, "2")
                    },
                    AvailableScopeFilters = new[] { "SiteId", "TankId" },
                    DefaultSeverity = "High",
                    DefaultCooldownMinutes = 60
                },

                // ═══════════════════════════════════════════════════
                // Group: Fuel Delivery
                // Covers: In-tank delivery detection (PTS/ATG sensors),
                //         Manual delivery entries (same-day and historical)
                // ═══════════════════════════════════════════════════
                new()
                {
                    AlertTypeKey = InTankDeliveryEvent.EventTypeName,
                    EventType = InTankDeliveryEvent.EventTypeName,
                    DisplayName = "In-Tank Delivery Detected",
                    Description = "Triggers when PTS/ATG sensors detect an in-tank delivery — monitors volume, fuel grade, and match status",
                    Category = "Fuel Delivery",
                    CategoryIcon = "fa-light fa-truck-ramp-box",
                    AvailableConditions = new List<ConditionFieldDto>
                    {
                        new("minVolume", "Minimum Volume (Liters)", "number", false, "500"),
                        new("maxVolumePercent", "Max Fill Level (%)", "number", false, "95"),
                        new("fuelGradeFilter", "Fuel Grade", "text", false, null),
                        new("matchStatusFilter", "Match Status", "select", false, null,
                            new[] { "Detected", "Matched", "Unmatched", "Confirmed", "Rejected" })
                    },
                    AvailableScopeFilters = new[] { "SiteId", "TankId" },
                    DefaultSeverity = "Medium",
                    DefaultCooldownMinutes = 30
                },
                new()
                {
                    AlertTypeKey = ManualDeliveryEvent.EventTypeName,
                    EventType = ManualDeliveryEvent.EventTypeName,
                    DisplayName = "Manual Delivery Entry",
                    Description = "Triggers when a manual delivery is recorded — monitors volume, supplier, product, and same-day entries",
                    Category = "Fuel Delivery",
                    CategoryIcon = "fa-light fa-truck-ramp-box",
                    AvailableConditions = new List<ConditionFieldDto>
                    {
                        new("minVolume", "Minimum Volume (Liters)", "number", false, "1000"),
                        new("maxFillPercent", "Max Fill Level (%)", "number", false, "95"),
                        new("sameDayOnly", "Same-Day Entry Only", "boolean", false, "true"),
                        new("supplierFilter", "Supplier Name", "text", false, null),
                        new("productFilter", "Product/Fuel Grade", "text", false, null)
                    },
                    AvailableScopeFilters = new[] { "SiteId", "TankId" },
                    DefaultSeverity = "Low",
                    DefaultCooldownMinutes = 15
                },

                // ═══════════════════════════════════════════════════
                // Group: GPS & Vehicle — Tag Monitoring
                // Covers: GPS tag update success/failure notifications
                // ═══════════════════════════════════════════════════
                new()
                {
                    AlertTypeKey = TagMonitoringEvent.EventTypeName,
                    EventType = TagMonitoringEvent.EventTypeName,
                    DisplayName = "Tag Monitoring",
                    Description = "Triggers when a vehicle GPS tag update succeeds or fails",
                    Category = "GPS & Vehicle",
                    CategoryIcon = "fa-light fa-car",
                    AvailableConditions = new List<ConditionFieldDto>
                    {
                        new("subTypeFilter", "Event Type", "select", false, null,
                            new[] { "TagUpdateSuccess", "TagUpdateError" })
                    },
                    AvailableScopeFilters = new[] { "SiteId", "VehicleId" },
                    DefaultSeverity = "Medium",
                    DefaultCooldownMinutes = 30
                },

                // ═══════════════════════════════════════════════════
                // Group: System
                // Covers: maintenance events, security, scheduled reports, backups,
                //         event lifecycle (acknowledge, resolve, escalate)
                // Related AlertConfigurationConstants: EscalationAutoEscalate,
                //   BusinessImpactCalc
                // ═══════════════════════════════════════════════════
                new()
                {
                    AlertTypeKey = SystemEvent.EventTypeName,
                    EventType = SystemEvent.EventTypeName,
                    DisplayName = "System Event",
                    Description = "Triggers for system-level events: maintenance, security, reports, backups",
                    Category = "System",
                    CategoryIcon = "fa-light fa-gear",
                    AvailableConditions = new List<ConditionFieldDto>
                    {
                        new("subTypeFilter", "Sub-Type", "select", false, null,
                            new[] { "MaintenanceDue", "SecurityBreach", "ScheduledReport", "BackupComplete" })
                    },
                    AvailableScopeFilters = new[] { "SiteId" },
                    DefaultSeverity = "Medium",
                    DefaultCooldownMinutes = 60
                },
                new()
                {
                    AlertTypeKey = EventLifecycleEvent.EventTypeName,
                    EventType = EventLifecycleEvent.EventTypeName,
                    DisplayName = "Event Lifecycle",
                    Description = "Triggers when an active event changes state (acknowledged, resolved, escalated)",
                    Category = "System",
                    CategoryIcon = "fa-light fa-gear",
                    AvailableConditions = new List<ConditionFieldDto>
                    {
                        new("actionTypeFilter", "Action Type", "select", false, null,
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
    /// InputType values: "number", "select", "boolean", "text"
    /// </summary>
    public class ConditionFieldDto
    {
        public string Key { get; set; }
        public string Label { get; set; }

        /// <summary>"number" | "select" | "boolean" | "text" — matches frontend switch/case</summary>
        public string InputType { get; set; }

        public bool IsRequired { get; set; }
        public string? DefaultValue { get; set; }

        /// <summary>Options for "select" input type (dropdown values).</summary>
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
