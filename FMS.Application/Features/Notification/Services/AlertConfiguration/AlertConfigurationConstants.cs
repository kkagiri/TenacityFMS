/**
 * File: AlertConfigurationConstants.cs
 * Purpose: Central registry of all alert types, their configurable parameters, defaults, and groupings.
 *          This is the single source of truth for what alert types exist and what can be configured.
 * Dependencies: None (pure constants)
 * Last Modified: 2026-02-07
 *
 * Key Structures:
 * - AlertTypeDefinition: Describes an alert type with its parameters and defaults
 * - AlertParameterDefinition: Describes a single configurable parameter
 * - GetAllAlertTypes(): Returns the complete registry
 * - GetAlertGroups(): Returns groupings for UI display
 */

using System;
using System.Collections.Generic;

namespace FMS.Application.Features.Notification.Services.AlertConfiguration
{
    /// <summary>
    /// Central registry of all configurable alert types in the FMS system.
    /// Every hardcoded threshold in the system should have a corresponding entry here.
    /// </summary>
    public static class AlertConfigurationConstants
    {
        /// <summary>
        /// Prefix for all alert configuration keys in the SystemConfiguration table
        /// </summary>
        public const string ConfigKeyPrefix = "Alert";

        /// <summary>
        /// Category prefix for SystemConfiguration table grouping
        /// </summary>
        public const string ConfigCategoryPrefix = "AlertConfiguration";

        #region Alert Type Keys

        // Tank Operations
        public const string TankClosingStockDiscrepancy = "TankClosingStockDiscrepancy";
        public const string TankSensorVariance = "TankSensorVariance";
        public const string TankLowLevel = "TankLowLevel";
        public const string TankHighLevel = "TankHighLevel";
        public const string TankCriticalLowLevel = "TankCriticalLowLevel";
        public const string TankCriticalHighLevel = "TankCriticalHighLevel";
        public const string TankWaterDetection = "TankWaterDetection";
        public const string TankTemperature = "TankTemperature";
        public const string TankStaleData = "TankStaleData";
        public const string TankUnusualConsumption = "TankUnusualConsumption";
        public const string TankCapacityLimit = "TankCapacityLimit";
        public const string TankReconciliation = "TankReconciliation";
        public const string TankLeakage = "TankLeakage";

        // PTS Device
        public const string PTSDeviceOffline = "PTSDeviceOffline";
        public const string PTSProbeAlarmCooldown = "PTSProbeAlarmCooldown";
        public const string PTSSystemLevelCooldown = "PTSSystemLevelCooldown";

        // GPS & Vehicle
        public const string GPSTagOffline = "GPSTagOffline";
        public const string VehicleMaintenanceDue = "VehicleMaintenanceDue";
        public const string OdometerSync = "OdometerSync";

        // System
        public const string EscalationAutoEscalate = "EscalationAutoEscalate";
        public const string BusinessImpactCalc = "BusinessImpactCalc";

        #endregion

        #region Alert Group Names

        public const string GroupTankOperations = "Tank Operations";
        public const string GroupPTSDevice = "PTS Device";
        public const string GroupGPSVehicle = "GPS & Vehicle";
        public const string GroupSystem = "System";

        #endregion

        /// <summary>
        /// Builds the SystemConfiguration key for a given alert type and parameter
        /// </summary>
        public static string BuildConfigKey(string alertType, string parameter)
            => $"{ConfigKeyPrefix}.{alertType}.{parameter}";

        /// <summary>
        /// Builds the SystemConfiguration key for the enabled flag
        /// </summary>
        public static string BuildEnabledKey(string alertType)
            => $"{ConfigKeyPrefix}.{alertType}.Enabled";

        /// <summary>
        /// Builds the category string for the SystemConfiguration table
        /// </summary>
        public static string BuildCategory(string groupName)
            => $"{ConfigCategoryPrefix}.{groupName.Replace(" ", "").Replace("&", "And")}";

        /// <summary>
        /// Returns alert group definitions for UI display
        /// </summary>
        public static List<AlertGroupDefinition> GetAlertGroups()
        {
            return new List<AlertGroupDefinition>
            {
                new(GroupTankOperations, "fa-light fa-gas-pump", "Tank level, stock, temperature, and reconciliation alerts",
                    new[] { TankClosingStockDiscrepancy, TankSensorVariance, TankLowLevel, TankHighLevel,
                            TankCriticalLowLevel, TankCriticalHighLevel, TankWaterDetection, TankTemperature,
                            TankStaleData, TankUnusualConsumption, TankCapacityLimit, TankReconciliation, TankLeakage }),

                new(GroupPTSDevice, "fa-light fa-microchip", "PTS device connectivity and probe alarm settings",
                    new[] { PTSDeviceOffline, PTSProbeAlarmCooldown, PTSSystemLevelCooldown }),

                new(GroupGPSVehicle, "fa-light fa-car", "GPS tracking, vehicle maintenance, and odometer alerts",
                    new[] { GPSTagOffline, VehicleMaintenanceDue, OdometerSync }),

                new(GroupSystem, "fa-light fa-gear", "Escalation rules and system-wide calculation parameters",
                    new[] { EscalationAutoEscalate, BusinessImpactCalc })
            };
        }

        /// <summary>
        /// Returns the complete registry of all alert types with their parameters and defaults.
        /// This is the SINGLE SOURCE OF TRUTH for all configurable thresholds.
        /// </summary>
        public static Dictionary<string, AlertTypeDefinition> GetAllAlertTypes()
        {
            return new Dictionary<string, AlertTypeDefinition>
            {
                #region Tank Operations

                [TankClosingStockDiscrepancy] = new AlertTypeDefinition
                {
                    Key = TankClosingStockDiscrepancy,
                    DisplayName = "Closing Stock Discrepancy",
                    Description = "Detects variance between expected and actual closing stock during daily reconciliation",
                    Group = GroupTankOperations,
                    DefaultEnabled = true,
                    Parameters = new List<AlertParameterDefinition>
                    {
                        new("significanceThresholdLiters", "Significance Threshold (Liters)", "decimal", "L", true, 50m, "Minimum variance in liters to flag as significant"),
                        new("significanceThresholdPercent", "Significance Threshold (%)", "decimal", "%", true, 5m, "Minimum variance percentage to flag as significant"),
                        new("investigationThresholdLiters", "Investigation Threshold (Liters)", "decimal", "L", true, 100m, "Variance in liters that requires investigation"),
                        new("investigationThresholdPercent", "Investigation Threshold (%)", "decimal", "%", true, 10m, "Variance percentage that requires investigation"),
                    }
                },

                [TankSensorVariance] = new AlertTypeDefinition
                {
                    Key = TankSensorVariance,
                    DisplayName = "Sensor vs Manual Variance",
                    Description = "Detects significant difference between manual stock entry and sensor/probe reading",
                    Group = GroupTankOperations,
                    DefaultEnabled = true,
                    Parameters = new List<AlertParameterDefinition>
                    {
                        new("varianceThresholdLiters", "Variance Threshold (Liters)", "decimal", "L", true, 5m, "Minimum variance in liters to trigger alert"),
                        new("varianceThresholdPercent", "Variance Threshold (%)", "decimal", "%", true, 2m, "Minimum variance percentage to trigger alert"),
                        new("criticalLiters", "Critical Severity (Liters)", "decimal", "L", true, 20m, "Variance in liters for Critical severity"),
                        new("criticalPercent", "Critical Severity (%)", "decimal", "%", true, 10m, "Variance percentage for Critical severity"),
                        new("highLiters", "High Severity (Liters)", "decimal", "L", true, 10m, "Variance in liters for High severity"),
                        new("highPercent", "High Severity (%)", "decimal", "%", true, 5m, "Variance percentage for High severity"),
                    }
                },

                [TankLowLevel] = new AlertTypeDefinition
                {
                    Key = TankLowLevel,
                    DisplayName = "Low Tank Level",
                    Description = "Alerts when tank volume drops below threshold percentage of capacity",
                    Group = GroupTankOperations,
                    DefaultEnabled = true,
                    Parameters = new List<AlertParameterDefinition>
                    {
                        new("thresholdPercent", "Threshold (%)", "decimal", "%", true, 10m, "Tank level percentage below which alert triggers"),
                        new("hysteresisPercent", "Hysteresis (%)", "decimal", "%", false, 1m, "Buffer to prevent rapid on/off toggling"),
                    }
                },

                [TankHighLevel] = new AlertTypeDefinition
                {
                    Key = TankHighLevel,
                    DisplayName = "High Tank Level",
                    Description = "Alerts when tank volume exceeds threshold percentage of capacity",
                    Group = GroupTankOperations,
                    DefaultEnabled = true,
                    Parameters = new List<AlertParameterDefinition>
                    {
                        new("thresholdPercent", "Threshold (%)", "decimal", "%", true, 95m, "Tank level percentage above which alert triggers"),
                    }
                },

                [TankCriticalLowLevel] = new AlertTypeDefinition
                {
                    Key = TankCriticalLowLevel,
                    DisplayName = "Critical Low Level",
                    Description = "System-level critical low tank level alert from PTS probe data",
                    Group = GroupTankOperations,
                    DefaultEnabled = true,
                    Parameters = new List<AlertParameterDefinition>
                    {
                        new("thresholdPercent", "Threshold (%)", "decimal", "%", true, 10m, "Critical low level percentage"),
                    }
                },

                [TankCriticalHighLevel] = new AlertTypeDefinition
                {
                    Key = TankCriticalHighLevel,
                    DisplayName = "Critical High Level",
                    Description = "System-level critical high tank level alert from PTS probe data",
                    Group = GroupTankOperations,
                    DefaultEnabled = true,
                    Parameters = new List<AlertParameterDefinition>
                    {
                        new("thresholdPercent", "Threshold (%)", "decimal", "%", true, 95m, "Critical high level percentage"),
                    }
                },

                [TankWaterDetection] = new AlertTypeDefinition
                {
                    Key = TankWaterDetection,
                    DisplayName = "Water Detection",
                    Description = "Alerts when water is detected in fuel tank above threshold",
                    Group = GroupTankOperations,
                    DefaultEnabled = true,
                    Parameters = new List<AlertParameterDefinition>
                    {
                        new("waterHeightMm", "Water Height (mm)", "decimal", "mm", true, 5m, "Water height in millimeters that triggers alert"),
                        new("sustainedForMinutes", "Sustained For (min)", "int", "min", false, 5, "Minutes the reading must sustain before triggering"),
                    }
                },

                [TankTemperature] = new AlertTypeDefinition
                {
                    Key = TankTemperature,
                    DisplayName = "Temperature Alarm",
                    Description = "Alerts when tank temperature is outside acceptable range",
                    Group = GroupTankOperations,
                    DefaultEnabled = true,
                    Parameters = new List<AlertParameterDefinition>
                    {
                        new("minTempCelsius", "Minimum Temperature (°C)", "decimal", "°C", true, -10m, "Temperature below which alert triggers"),
                        new("maxTempCelsius", "Maximum Temperature (°C)", "decimal", "°C", true, 50m, "Temperature above which alert triggers"),
                    }
                },

                [TankStaleData] = new AlertTypeDefinition
                {
                    Key = TankStaleData,
                    DisplayName = "Stale Data Alert",
                    Description = "Alerts when no data has been received from a tank for a specified duration",
                    Group = GroupTankOperations,
                    DefaultEnabled = true,
                    Parameters = new List<AlertParameterDefinition>
                    {
                        new("staleDataHours", "Stale Data Duration (hours)", "decimal", "hr", true, 2m, "Hours without data before triggering alert"),
                    }
                },

                [TankUnusualConsumption] = new AlertTypeDefinition
                {
                    Key = TankUnusualConsumption,
                    DisplayName = "Unusual Consumption",
                    Description = "Detects abnormally rapid tank volume drop that may indicate leak or theft",
                    Group = GroupTankOperations,
                    DefaultEnabled = true,
                    Parameters = new List<AlertParameterDefinition>
                    {
                        new("dropPercent", "Volume Drop (%)", "decimal", "%", true, 20m, "Percentage of capacity drop that triggers alert"),
                        new("withinHours", "Within Duration (hours)", "decimal", "hr", true, 1m, "Time window for the volume drop"),
                    }
                },

                [TankCapacityLimit] = new AlertTypeDefinition
                {
                    Key = TankCapacityLimit,
                    DisplayName = "Capacity Limit",
                    Description = "Warns when tank approaches maximum capacity",
                    Group = GroupTankOperations,
                    DefaultEnabled = true,
                    Parameters = new List<AlertParameterDefinition>
                    {
                        new("capacityPercent", "Capacity Threshold (%)", "decimal", "%", true, 90m, "Percentage at which capacity warning triggers"),
                    }
                },

                [TankReconciliation] = new AlertTypeDefinition
                {
                    Key = TankReconciliation,
                    DisplayName = "Reconciliation Discrepancy",
                    Description = "Automated reconciliation variance detection thresholds",
                    Group = GroupTankOperations,
                    DefaultEnabled = true,
                    Parameters = new List<AlertParameterDefinition>
                    {
                        new("minVarianceLiters", "Minimum Variance (Liters)", "decimal", "L", true, 1m, "Minimum variance in liters to flag"),
                        new("minVariancePercent", "Minimum Variance (%)", "decimal", "%", true, 1m, "Minimum variance percentage to flag"),
                        new("fallbackPricePerLiter", "Fallback Price per Liter", "decimal", "KES", false, 150m, "Default fuel price for business impact calculation"),
                    }
                },

                [TankLeakage] = new AlertTypeDefinition
                {
                    Key = TankLeakage,
                    DisplayName = "Tank Leakage",
                    Description = "Critical alert for potential tank leakage detected by probe",
                    Group = GroupTankOperations,
                    DefaultEnabled = true,
                    Parameters = new List<AlertParameterDefinition>() // No configurable params — fires on probe detection
                },

                #endregion

                #region PTS Device

                [PTSDeviceOffline] = new AlertTypeDefinition
                {
                    Key = PTSDeviceOffline,
                    DisplayName = "PTS Device Offline",
                    Description = "Alerts when a PTS device has been offline for a specified duration",
                    Group = GroupPTSDevice,
                    DefaultEnabled = true,
                    Parameters = new List<AlertParameterDefinition>
                    {
                        new("offlineDurationMinutes", "Offline Duration (min)", "int", "min", true, 30, "Minutes offline before triggering alert"),
                    }
                },

                [PTSProbeAlarmCooldown] = new AlertTypeDefinition
                {
                    Key = PTSProbeAlarmCooldown,
                    DisplayName = "Probe Alarm Cooldown",
                    Description = "Minimum interval between repeated probe alarms for the same tank",
                    Group = GroupPTSDevice,
                    DefaultEnabled = true,
                    Parameters = new List<AlertParameterDefinition>
                    {
                        new("cooldownMinutes", "Cooldown (min)", "int", "min", true, 5, "Minutes between repeated probe alarms"),
                    }
                },

                [PTSSystemLevelCooldown] = new AlertTypeDefinition
                {
                    Key = PTSSystemLevelCooldown,
                    DisplayName = "System Level Alarm Cooldown",
                    Description = "Minimum interval between repeated system-level tank alarms",
                    Group = GroupPTSDevice,
                    DefaultEnabled = true,
                    Parameters = new List<AlertParameterDefinition>
                    {
                        new("cooldownMinutes", "Cooldown (min)", "int", "min", true, 15, "Minutes between repeated system-level alarms"),
                    }
                },

                #endregion

                #region GPS & Vehicle

                [GPSTagOffline] = new AlertTypeDefinition
                {
                    Key = GPSTagOffline,
                    DisplayName = "GPS Tag Offline",
                    Description = "Alerts when a GPS tag has not reported for a specified duration",
                    Group = GroupGPSVehicle,
                    DefaultEnabled = true,
                    Parameters = new List<AlertParameterDefinition>
                    {
                        new("offlineHours", "Offline Duration (hours)", "decimal", "hr", true, 2m, "Hours without GPS data before alert"),
                        new("longTermOfflineHours", "Long-Term Offline (hours)", "decimal", "hr", true, 24m, "Hours for long-term offline classification"),
                    }
                },

                [VehicleMaintenanceDue] = new AlertTypeDefinition
                {
                    Key = VehicleMaintenanceDue,
                    DisplayName = "Vehicle Maintenance Due",
                    Description = "Alerts when vehicle maintenance is approaching or overdue",
                    Group = GroupGPSVehicle,
                    DefaultEnabled = true,
                    Parameters = new List<AlertParameterDefinition>
                    {
                        new("warningDaysBefore", "Warning Days Before Due", "int", "days", true, 7, "Days before due date to start alerting"),
                        new("checkIntervalHours", "Check Interval (hours)", "int", "hr", true, 6, "How often the system checks for due maintenance"),
                    }
                },

                [OdometerSync] = new AlertTypeDefinition
                {
                    Key = OdometerSync,
                    DisplayName = "Odometer Sync",
                    Description = "Settings for odometer synchronization checks",
                    Group = GroupGPSVehicle,
                    DefaultEnabled = true,
                    Parameters = new List<AlertParameterDefinition>
                    {
                        new("syncIntervalHours", "Sync Interval (hours)", "int", "hr", true, 4, "Hours between odometer sync checks"),
                        new("distanceToleranceKm", "Distance Tolerance (km)", "decimal", "km", true, 10m, "Acceptable variance in km between readings"),
                    }
                },

                #endregion

                #region System

                [EscalationAutoEscalate] = new AlertTypeDefinition
                {
                    Key = EscalationAutoEscalate,
                    DisplayName = "Auto-Escalation Rules",
                    Description = "Controls when unacknowledged alarms are automatically escalated",
                    Group = GroupSystem,
                    DefaultEnabled = true,
                    Parameters = new List<AlertParameterDefinition>
                    {
                        new("unacknowledgedMinutes", "Escalation After (min)", "int", "min", true, 30, "Minutes unacknowledged before auto-escalation"),
                        new("reEscalationCooldownHours", "Re-escalation Cooldown (hours)", "int", "hr", true, 2, "Hours between re-escalation attempts"),
                    }
                },

                [BusinessImpactCalc] = new AlertTypeDefinition
                {
                    Key = BusinessImpactCalc,
                    DisplayName = "Business Impact Scoring",
                    Description = "Parameters for calculating business impact scores on discrepancies",
                    Group = GroupSystem,
                    DefaultEnabled = true,
                    Parameters = new List<AlertParameterDefinition>
                    {
                        new("litersPerPoint", "Liters per Impact Point", "decimal", "L", true, 10m, "Liters of variance per impact score point"),
                        new("maxScore", "Maximum Score", "decimal", "", true, 100m, "Maximum impact score cap"),
                        new("capacityWeightMultiplier", "Capacity Weight Multiplier", "decimal", "x", true, 2m, "Multiplier for capacity-based impact weighting"),
                    }
                },

                #endregion
            };
        }
    }

    #region Supporting Types

    /// <summary>
    /// Defines an alert type with all its configurable parameters
    /// </summary>
    public class AlertTypeDefinition
    {
        public string Key { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Group { get; set; } = string.Empty;
        public bool DefaultEnabled { get; set; } = true;
        public List<AlertParameterDefinition> Parameters { get; set; } = new();
    }

    /// <summary>
    /// Defines a single configurable parameter for an alert type
    /// </summary>
    public class AlertParameterDefinition
    {
        public string Name { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string DataType { get; set; } = "string"; // int, decimal, bool, string
        public string? Unit { get; set; }
        public bool Required { get; set; }
        public object? DefaultValue { get; set; }
        public string? Description { get; set; }

        public AlertParameterDefinition() { }

        public AlertParameterDefinition(string name, string displayName, string dataType, string? unit, bool required, object? defaultValue, string? description = null)
        {
            Name = name;
            DisplayName = displayName;
            DataType = dataType;
            Unit = unit;
            Required = required;
            DefaultValue = defaultValue;
            Description = description;
        }
    }

    /// <summary>
    /// Defines a group of alert types for UI display
    /// </summary>
    public class AlertGroupDefinition
    {
        public string Name { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string[] AlertTypes { get; set; } = Array.Empty<string>();

        public AlertGroupDefinition() { }

        public AlertGroupDefinition(string name, string icon, string description, string[] alertTypes)
        {
            Name = name;
            Icon = icon;
            Description = description;
            AlertTypes = alertTypes;
        }
    }

    #endregion
}
