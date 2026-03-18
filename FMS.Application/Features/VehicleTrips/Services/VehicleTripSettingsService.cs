/**
 * File: VehicleTripSettingsService.cs
 * Purpose: Manages VehicleTrips runtime settings stored in SystemConfiguration.
 * Dependencies: GpsdataContext, ISystemConfigurationService, VehicleTripSettingsDTO.
 * Last Modified: 2026-03-14
 */
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.VehicleTrips.DTOs;
using FMS.Application.Services.Configuration;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SystemConfigurationEntity = FMS.Domain.Entities.SystemConfiguration;

namespace FMS.Application.Features.VehicleTrips.Services;

public class VehicleTripSettingsService : IVehicleTripSettingsService
{
    private const string RealtimeStateMachineExecutionKey = "VehicleTrips.RealtimeStateMachineExecution.Enabled";
    private const string ReconciliationEnabledKey = "VehicleTrips.Reconciliation.Enabled";
    private const string ReconciliationRunTimeLocalKey = "VehicleTrips.Reconciliation.DailyRunTimeLocal";
    private const string ReconciliationLookbackDaysKey = "VehicleTrips.Reconciliation.LookbackDays";
    private const string FuelContextEnrichmentEnabledKey = "VehicleTrips.FuelContext.Enabled";
    private const string FuelLookupWindowHoursKey = "VehicleTrips.FuelContext.LookupWindowHours";
    private const string ConfidenceUnknownEndpointPenaltyKey = "VehicleTrips.Confidence.UnknownEndpointPenalty";
    private const string ConfidenceShortTripPenaltyKey = "VehicleTrips.Confidence.ShortTripPenalty";
    private const string ConfidenceHighSpeedPenaltyKey = "VehicleTrips.Confidence.HighSpeedPenalty";
    private const string ConfidenceMissingFuelPenaltyKey = "VehicleTrips.Confidence.MissingFuelPenalty";
    private const string ConfidenceWeakFuelPenaltyKey = "VehicleTrips.Confidence.WeakFuelPenalty";
    private const string ConfidenceMinimumScoreKey = "VehicleTrips.Confidence.MinimumScore";
    private const string ConfidenceHighBandThresholdKey = "VehicleTrips.Confidence.HighBandThreshold";
    private const string ConfidenceMediumBandThresholdKey = "VehicleTrips.Confidence.MediumBandThreshold";
    private const string ConfidenceHighSpeedThresholdKphKey = "VehicleTrips.Confidence.HighSpeedThresholdKph";
    private const string ConfidenceShortTripDistanceThresholdKmKey = "VehicleTrips.Confidence.ShortTripDistanceThresholdKm";
    private const string ConfidenceShortTripDurationThresholdMinutesKey = "VehicleTrips.Confidence.ShortTripDurationThresholdMinutes";
    private const string ConfidenceLoadCycleSuspiciousFuelRateThresholdKey = "VehicleTrips.Confidence.LoadCycleSuspiciousFuelRateThresholdKmPerLiter";
    private const string ConfidenceLoadCycleReturnFuelRateThresholdKey = "VehicleTrips.Confidence.LoadCycleReturnFuelRateThresholdKmPerLiter";
    private const string ClusterBatchStopSpeedKey = "VehicleTrips.Cluster.Batch.StopSpeedThresholdKph";
    private const string ClusterBatchMinStopDurationKey = "VehicleTrips.Cluster.Batch.MinimumStopDurationMinutes";
    private const string ClusterBatchMinTripDistanceKey = "VehicleTrips.Cluster.Batch.MinimumTripDistanceKm";
    private const string ClusterBatchMinTripDurationKey = "VehicleTrips.Cluster.Batch.MinimumTripDurationMinutes";
    private const string ClusterBatchClusterRadiusKey = "VehicleTrips.Cluster.Batch.ClusterRadiusMeters";
    private const string ClusterBatchMaxTrackPointsKey = "VehicleTrips.Cluster.Batch.MaxTrackPoints";
    private const string ClusterRealtimeStopSpeedKey = "VehicleTrips.Cluster.RealTime.StopSpeedThresholdKph";
    private const string ClusterRealtimeStopDurationPointsKey = "VehicleTrips.Cluster.RealTime.StopDurationPoints";
    private const string ClusterRealtimeMovingDurationPointsKey = "VehicleTrips.Cluster.RealTime.MovingDurationPoints";
    private const string ClusterRealtimeClusterMatchRadiusKey = "VehicleTrips.Cluster.RealTime.ClusterMatchRadiusKm";
    private const string SettingsCategory = "VehicleTrips";
    private const string DefaultRealtimeStateMachineExecutionValue = "true";
    private const string SettingsDescription = "Enable or disable real-time vehicle trip state machine execution for live GPS point processing. When disabled, live GPS updates skip trip state machine execution but historical recompute and reconciliation remain available.";
    private const string DefaultReconciliationEnabledValue = "true";
    private const string DefaultReconciliationRunTimeLocalValue = "00:30";
    private const string DefaultReconciliationLookbackDaysValue = "1";
    private const string DefaultFuelContextEnrichmentEnabledValue = "true";
    private const string DefaultFuelLookupWindowHoursValue = "2.0";
    private const string DefaultConfidenceUnknownEndpointPenaltyValue = "0.25";
    private const string DefaultConfidenceShortTripPenaltyValue = "0.10";
    private const string DefaultConfidenceHighSpeedPenaltyValue = "0.20";
    private const string DefaultConfidenceMissingFuelPenaltyValue = "0.10";
    private const string DefaultConfidenceWeakFuelPenaltyValue = "0.05";
    private const string DefaultConfidenceMinimumScoreValue = "0.10";
    private const string DefaultConfidenceHighBandThresholdValue = "0.85";
    private const string DefaultConfidenceMediumBandThresholdValue = "0.60";
    private const string DefaultConfidenceHighSpeedThresholdKphValue = "120";
    private const string DefaultConfidenceShortTripDistanceThresholdKmValue = "1.00";
    private const string DefaultConfidenceShortTripDurationThresholdMinutesValue = "5.00";
    private const string DefaultConfidenceLoadCycleSuspiciousFuelRateThresholdValue = "3.00";
    private const string DefaultConfidenceLoadCycleReturnFuelRateThresholdValue = "3.50";
    private const string DefaultClusterBatchStopSpeedValue = "3";
    private const string DefaultClusterBatchMinStopDurationValue = "1.5";
    private const string DefaultClusterBatchMinTripDistanceValue = "0.50";
    private const string DefaultClusterBatchMinTripDurationValue = "2";
    private const string DefaultClusterBatchClusterRadiusValue = "150";
    private const string DefaultClusterBatchMaxTrackPointsValue = "5000";
    private const string DefaultClusterRealtimeStopSpeedValue = "5.0";
    private const string DefaultClusterRealtimeStopDurationPointsValue = "3";
    private const string DefaultClusterRealtimeMovingDurationPointsValue = "2";
    private const string DefaultClusterRealtimeClusterMatchRadiusValue = "0.15";
    private const string BooleanValidationPattern = "^(true|false|1|0)$";
    private const string TimeValidationPattern = "^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$";
    private const string IntegerValidationPattern = "^[0-9]+$";
    private const string DecimalValidationPattern = "^([0-9]+)(\\.[0-9]+)?$";

    private readonly GpsdataContext _context;
    private readonly ISystemConfigurationService _systemConfigurationService;
    private readonly ILogger<VehicleTripSettingsService> _logger;
    private static readonly SemaphoreSlim EnsureConfigurationsSemaphore = new(1, 1);
    private static int _configurationsInitialized;

    private static readonly IReadOnlyList<VehicleTripSettingDefinition> SettingDefinitions = new[]
    {
        new VehicleTripSettingDefinition(RealtimeStateMachineExecutionKey, DefaultRealtimeStateMachineExecutionValue, "Boolean", BooleanValidationPattern, SettingsDescription),
        new VehicleTripSettingDefinition(ReconciliationEnabledKey, DefaultReconciliationEnabledValue, "Boolean", BooleanValidationPattern, "Enable or disable the nightly vehicle trip reconciliation background service."),
        new VehicleTripSettingDefinition(ReconciliationRunTimeLocalKey, DefaultReconciliationRunTimeLocalValue, "String", TimeValidationPattern, "Local daily run time for the vehicle trip reconciliation background service in HH:mm or HH:mm:ss format."),
        new VehicleTripSettingDefinition(ReconciliationLookbackDaysKey, DefaultReconciliationLookbackDaysValue, "Int32", IntegerValidationPattern, "Number of local days to look back when the nightly vehicle trip reconciliation background service selects persisted trip groups."),
        new VehicleTripSettingDefinition(FuelContextEnrichmentEnabledKey, DefaultFuelContextEnrichmentEnabledValue, "Boolean", BooleanValidationPattern, "Enable or disable fuel-context enrichment for detected and overridden trips."),
        new VehicleTripSettingDefinition(FuelLookupWindowHoursKey, DefaultFuelLookupWindowHoursValue, "Decimal", DecimalValidationPattern, "Maximum time window, in hours, used to match fuel readings to trip start and end events when exact track matches are unavailable."),
        new VehicleTripSettingDefinition(ConfidenceUnknownEndpointPenaltyKey, DefaultConfidenceUnknownEndpointPenaltyValue, "Decimal", DecimalValidationPattern, "Confidence penalty applied when the trip origin or destination cannot be resolved to a site."),
        new VehicleTripSettingDefinition(ConfidenceShortTripPenaltyKey, DefaultConfidenceShortTripPenaltyValue, "Decimal", DecimalValidationPattern, "Confidence penalty applied to trips below the configured minimum distance or duration thresholds."),
        new VehicleTripSettingDefinition(ConfidenceHighSpeedPenaltyKey, DefaultConfidenceHighSpeedPenaltyValue, "Decimal", DecimalValidationPattern, "Confidence penalty applied when a trip exceeds the configured speed threshold."),
        new VehicleTripSettingDefinition(ConfidenceMissingFuelPenaltyKey, DefaultConfidenceMissingFuelPenaltyValue, "Decimal", DecimalValidationPattern, "Confidence penalty applied when no fuel telemetry is attached to a trip."),
        new VehicleTripSettingDefinition(ConfidenceWeakFuelPenaltyKey, DefaultConfidenceWeakFuelPenaltyValue, "Decimal", DecimalValidationPattern, "Confidence penalty applied when fuel telemetry is available but marked weak or derived."),
        new VehicleTripSettingDefinition(ConfidenceMinimumScoreKey, DefaultConfidenceMinimumScoreValue, "Decimal", DecimalValidationPattern, "Minimum confidence floor applied after penalties are calculated."),
        new VehicleTripSettingDefinition(ConfidenceHighBandThresholdKey, DefaultConfidenceHighBandThresholdValue, "Decimal", DecimalValidationPattern, "Score threshold at or above which a trip is classified as High confidence."),
        new VehicleTripSettingDefinition(ConfidenceMediumBandThresholdKey, DefaultConfidenceMediumBandThresholdValue, "Decimal", DecimalValidationPattern, "Score threshold at or above which a trip is classified as Medium confidence."),
        new VehicleTripSettingDefinition(ConfidenceHighSpeedThresholdKphKey, DefaultConfidenceHighSpeedThresholdKphValue, "Decimal", DecimalValidationPattern, "Speed threshold in km/h above which a trip is treated as a possible GPS gap or unrealistic speed spike."),
        new VehicleTripSettingDefinition(ConfidenceShortTripDistanceThresholdKmKey, DefaultConfidenceShortTripDistanceThresholdKmValue, "Decimal", DecimalValidationPattern, "Minimum distance threshold in km for short-trip confidence checks."),
        new VehicleTripSettingDefinition(ConfidenceShortTripDurationThresholdMinutesKey, DefaultConfidenceShortTripDurationThresholdMinutesValue, "Decimal", DecimalValidationPattern, "Minimum duration threshold in minutes for short-trip confidence checks."),
        new VehicleTripSettingDefinition(ConfidenceLoadCycleSuspiciousFuelRateThresholdKey, DefaultConfidenceLoadCycleSuspiciousFuelRateThresholdValue, "Decimal", DecimalValidationPattern, "Fuel-rate threshold for loaded trip legs in load-cycle anomaly detection."),
        new VehicleTripSettingDefinition(ConfidenceLoadCycleReturnFuelRateThresholdKey, DefaultConfidenceLoadCycleReturnFuelRateThresholdValue, "Decimal", DecimalValidationPattern, "Fuel-rate threshold for return trip legs in load-cycle anomaly detection."),
        new VehicleTripSettingDefinition(ClusterBatchStopSpeedKey, DefaultClusterBatchStopSpeedValue, "Decimal", DecimalValidationPattern, "Speed in km/h at or below which a GPS point is treated as stationary during batch cluster stop extraction."),
        new VehicleTripSettingDefinition(ClusterBatchMinStopDurationKey, DefaultClusterBatchMinStopDurationValue, "Decimal", DecimalValidationPattern, "Minimum dwell time in minutes for a cluster stop to be recorded during batch detection."),
        new VehicleTripSettingDefinition(ClusterBatchMinTripDistanceKey, DefaultClusterBatchMinTripDistanceValue, "Decimal", DecimalValidationPattern, "Minimum distance in km for a cluster-to-cluster movement to qualify as a valid trip leg."),
        new VehicleTripSettingDefinition(ClusterBatchMinTripDurationKey, DefaultClusterBatchMinTripDurationValue, "Decimal", DecimalValidationPattern, "Minimum duration in minutes for a cluster-to-cluster movement to qualify as a valid trip leg."),
        new VehicleTripSettingDefinition(ClusterBatchClusterRadiusKey, DefaultClusterBatchClusterRadiusValue, "Decimal", DecimalValidationPattern, "Radius in meters used when grouping nearby stops into spatial clusters during batch detection."),
        new VehicleTripSettingDefinition(ClusterBatchMaxTrackPointsKey, DefaultClusterBatchMaxTrackPointsValue, "Int32", IntegerValidationPattern, "Maximum number of GPS track points fetched per vehicle per date range during batch cluster detection."),
        new VehicleTripSettingDefinition(ClusterRealtimeStopSpeedKey, DefaultClusterRealtimeStopSpeedValue, "Decimal", DecimalValidationPattern, "Speed in km/h at or below which a GPS point is treated as stationary during realtime cluster state machine processing."),
        new VehicleTripSettingDefinition(ClusterRealtimeStopDurationPointsKey, DefaultClusterRealtimeStopDurationPointsValue, "Int32", IntegerValidationPattern, "Number of consecutive low-speed GPS points required to detect a stop in the realtime cluster state machine."),
        new VehicleTripSettingDefinition(ClusterRealtimeMovingDurationPointsKey, DefaultClusterRealtimeMovingDurationPointsValue, "Int32", IntegerValidationPattern, "Number of consecutive high-speed GPS points required to transition from stopped to moving in the realtime cluster state machine."),
        new VehicleTripSettingDefinition(ClusterRealtimeClusterMatchRadiusKey, DefaultClusterRealtimeClusterMatchRadiusValue, "Decimal", DecimalValidationPattern, "Radius in km used to match an incoming stop position to an existing cluster in the realtime state machine."),
    };

    public VehicleTripSettingsService(
        GpsdataContext context,
        ISystemConfigurationService systemConfigurationService,
        ILogger<VehicleTripSettingsService> logger)
    {
        _context = context;
        _systemConfigurationService = systemConfigurationService;
        _logger = logger;
    }

    public async Task<bool> IsRealtimeStateMachineExecutionEnabledAsync(CancellationToken cancellationToken = default)
    {
        await EnsureDefaultsInitializedAsync(cancellationToken);

        var value = await _systemConfigurationService.GetConfigurationValueAsync(
            RealtimeStateMachineExecutionKey,
            cancellationToken);

        return ParseBoolean(value, defaultValue: true);
    }

    public async Task<bool> IsFuelContextEnrichmentEnabledAsync(CancellationToken cancellationToken = default)
    {
        await EnsureDefaultsInitializedAsync(cancellationToken);

        var value = await _systemConfigurationService.GetConfigurationValueAsync(
            FuelContextEnrichmentEnabledKey,
            cancellationToken);

        return ParseBoolean(value, defaultValue: true);
    }

    public async Task<VehicleTripSettingsDTO> GetSettingsAsync(CancellationToken cancellationToken = default)
    {
        var configs = await EnsureConfigurationsAsync(cancellationToken);
        return Map(configs);
    }

    public async Task<VehicleTripSettingsDTO> UpdateSettingsAsync(
        VehicleTripSettingsDTO settings,
        string? updatedBy,
        CancellationToken cancellationToken = default)
    {
        var normalized = Normalize(settings);
        var configs = await EnsureConfigurationsAsync(cancellationToken);

        foreach (var definition in SettingDefinitions)
        {
            var config = configs[definition.Key];
            var newValue = GetSerializedValue(normalized, definition.Key);
            var updated = await _systemConfigurationService.UpdateConfigurationAsync(definition.Key, newValue, cancellationToken);
            if (!updated)
            {
                throw new InvalidOperationException($"Failed to persist VehicleTrips setting '{definition.Key}'.");
            }

            config.ConfigurationValue = newValue;
            ApplyMetadata(config, definition, updatedBy);
            config.UpdatedAt = DateTime.UtcNow;

            if (!string.IsNullOrWhiteSpace(updatedBy))
            {
                config.UpdatedBy = updatedBy;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Updated VehicleTrips settings by {UpdatedBy}", updatedBy ?? "System");

        return Map(configs);
    }

    private async Task<Dictionary<string, SystemConfigurationEntity>> EnsureConfigurationsAsync(CancellationToken cancellationToken)
    {
        if (Volatile.Read(ref _configurationsInitialized) == 1)
        {
            var initializedConfigs = await LoadConfigurationsAsync(cancellationToken);
            if (HasAllSettingDefinitions(initializedConfigs))
            {
                return initializedConfigs;
            }
        }

        await EnsureConfigurationsSemaphore.WaitAsync(cancellationToken);

        try
        {
            for (var attempt = 1; attempt <= 3; attempt++)
            {
                _context.ChangeTracker.Clear();

                var configs = await LoadConfigurationsAsync(cancellationToken);
                var hasChanges = ApplySettingDefinitions(configs);

                if (!hasChanges)
                {
                    Volatile.Write(ref _configurationsInitialized, 1);
                    return configs;
                }

                try
                {
                    await _context.SaveChangesAsync(cancellationToken);
                    Volatile.Write(ref _configurationsInitialized, 1);
                    return configs;
                }
                catch (DbUpdateException ex) when (IsDuplicateConfigurationKeyViolation(ex) && attempt < 3)
                {
                    _logger.LogWarning(
                        ex,
                        "VehicleTrips settings bootstrap hit a duplicate-key race on attempt {Attempt}. Reloading configuration state.",
                        attempt);
                }
            }

            _context.ChangeTracker.Clear();
            var finalConfigs = await LoadConfigurationsAsync(cancellationToken);
            if (HasAllSettingDefinitions(finalConfigs))
            {
                Volatile.Write(ref _configurationsInitialized, 1);
                return finalConfigs;
            }

            throw new InvalidOperationException(
                $"VehicleTrips settings bootstrap did not produce a complete configuration set. Missing keys: {string.Join(", ", GetMissingKeys(finalConfigs))}");
        }
        finally
        {
            EnsureConfigurationsSemaphore.Release();
        }
    }

    private async Task EnsureDefaultsInitializedAsync(CancellationToken cancellationToken)
    {
        if (Volatile.Read(ref _configurationsInitialized) == 1)
        {
            return;
        }

        await EnsureConfigurationsAsync(cancellationToken);
    }

    private async Task<Dictionary<string, SystemConfigurationEntity>> LoadConfigurationsAsync(CancellationToken cancellationToken)
    {
        return await _context.SystemConfigurations
            .Where(item => item.Category == SettingsCategory || item.ConfigurationKey.StartsWith("VehicleTrips."))
            .ToDictionaryAsync(item => item.ConfigurationKey, cancellationToken);
    }

    private bool ApplySettingDefinitions(Dictionary<string, SystemConfigurationEntity> configs)
    {
        var hasChanges = false;
        foreach (var definition in SettingDefinitions)
        {
            if (!configs.TryGetValue(definition.Key, out var config))
            {
                config = new SystemConfigurationEntity
                {
                    ConfigurationKey = definition.Key,
                    ConfigurationValue = definition.DefaultValue,
                    Description = definition.Description,
                    Category = SettingsCategory,
                    DataType = definition.DataType,
                    IsActive = true,
                    IsEditable = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    CreatedBy = "System",
                    UpdatedBy = "System",
                    ValidationPattern = definition.ValidationPattern,
                    DefaultValue = definition.DefaultValue,
                };

                _context.SystemConfigurations.Add(config);
                configs[definition.Key] = config;
                hasChanges = true;
                continue;
            }

            if (ApplyMetadata(config, definition, updatedBy: null))
            {
                config.UpdatedAt = DateTime.UtcNow;
                hasChanges = true;
            }
        }

        return hasChanges;
    }

    private static bool HasAllSettingDefinitions(IReadOnlyDictionary<string, SystemConfigurationEntity> configs)
    {
        return SettingDefinitions.All(definition => configs.ContainsKey(definition.Key));
    }

    private static IEnumerable<string> GetMissingKeys(IReadOnlyDictionary<string, SystemConfigurationEntity> configs)
    {
        return SettingDefinitions
            .Where(definition => !configs.ContainsKey(definition.Key))
            .Select(definition => definition.Key);
    }

    private static bool IsDuplicateConfigurationKeyViolation(DbUpdateException exception)
    {
        var message = exception.InnerException?.Message ?? exception.Message;
        return message.Contains("Duplicate entry", StringComparison.OrdinalIgnoreCase)
            && message.Contains("IX_SystemConfigurations_ConfigurationKey", StringComparison.OrdinalIgnoreCase);
    }

    private static bool ApplyMetadata(SystemConfigurationEntity config, VehicleTripSettingDefinition definition, string? updatedBy)
    {
        var changed = false;

        if (config.Description != definition.Description)
        {
            config.Description = definition.Description;
            changed = true;
        }

        if (config.Category != SettingsCategory)
        {
            config.Category = SettingsCategory;
            changed = true;
        }

        if (config.DataType != definition.DataType)
        {
            config.DataType = definition.DataType;
            changed = true;
        }

        if (!config.IsActive)
        {
            config.IsActive = true;
            changed = true;
        }

        if (!config.IsEditable)
        {
            config.IsEditable = true;
            changed = true;
        }

        if (config.ValidationPattern != definition.ValidationPattern)
        {
            config.ValidationPattern = definition.ValidationPattern;
            changed = true;
        }

        if (config.DefaultValue != definition.DefaultValue)
        {
            config.DefaultValue = definition.DefaultValue;
            changed = true;
        }

        if (string.IsNullOrWhiteSpace(config.CreatedBy))
        {
            config.CreatedBy = "System";
            changed = true;
        }

        if (!string.IsNullOrWhiteSpace(updatedBy) && config.UpdatedBy != updatedBy)
        {
            config.UpdatedBy = updatedBy;
            changed = true;
        }

        return changed;
    }

    private static VehicleTripSettingsDTO Map(IReadOnlyDictionary<string, SystemConfigurationEntity> configs)
    {
        var updatedAt = DateTime.MinValue;
        string? updatedBy = null;
        foreach (var config in configs.Values)
        {
            if (config.UpdatedAt > updatedAt)
            {
                updatedAt = config.UpdatedAt;
                updatedBy = config.UpdatedBy;
            }
        }

        return new VehicleTripSettingsDTO
        {
            EnableRealtimeStateMachineExecution = ParseBoolean(configs[RealtimeStateMachineExecutionKey].ConfigurationValue, defaultValue: true),
            DefaultEnableRealtimeStateMachineExecution = ParseBoolean(configs[RealtimeStateMachineExecutionKey].DefaultValue, defaultValue: true),
            EnableScheduledReconciliation = ParseBoolean(configs[ReconciliationEnabledKey].ConfigurationValue, defaultValue: true),
            DefaultEnableScheduledReconciliation = ParseBoolean(configs[ReconciliationEnabledKey].DefaultValue, defaultValue: true),
            ReconciliationDailyRunTimeLocal = NormalizeDailyRunTimeLocal(configs[ReconciliationRunTimeLocalKey].ConfigurationValue, DefaultReconciliationRunTimeLocalValue),
            DefaultReconciliationDailyRunTimeLocal = NormalizeDailyRunTimeLocal(configs[ReconciliationRunTimeLocalKey].DefaultValue, DefaultReconciliationRunTimeLocalValue),
            ReconciliationLookbackDays = ParseInt(configs[ReconciliationLookbackDaysKey].ConfigurationValue, 1),
            DefaultReconciliationLookbackDays = ParseInt(configs[ReconciliationLookbackDaysKey].DefaultValue, 1),
            EnableFuelContextEnrichment = ParseBoolean(configs[FuelContextEnrichmentEnabledKey].ConfigurationValue, defaultValue: true),
            DefaultEnableFuelContextEnrichment = ParseBoolean(configs[FuelContextEnrichmentEnabledKey].DefaultValue, defaultValue: true),
            FuelLookupWindowHours = ParseDecimal(configs[FuelLookupWindowHoursKey].ConfigurationValue, 2.0m),
            DefaultFuelLookupWindowHours = ParseDecimal(configs[FuelLookupWindowHoursKey].DefaultValue, 2.0m),
            ConfidenceUnknownEndpointPenalty = ParseDecimal(configs[ConfidenceUnknownEndpointPenaltyKey].ConfigurationValue, 0.25m),
            DefaultConfidenceUnknownEndpointPenalty = ParseDecimal(configs[ConfidenceUnknownEndpointPenaltyKey].DefaultValue, 0.25m),
            ConfidenceShortTripPenalty = ParseDecimal(configs[ConfidenceShortTripPenaltyKey].ConfigurationValue, 0.10m),
            DefaultConfidenceShortTripPenalty = ParseDecimal(configs[ConfidenceShortTripPenaltyKey].DefaultValue, 0.10m),
            ConfidenceHighSpeedPenalty = ParseDecimal(configs[ConfidenceHighSpeedPenaltyKey].ConfigurationValue, 0.20m),
            DefaultConfidenceHighSpeedPenalty = ParseDecimal(configs[ConfidenceHighSpeedPenaltyKey].DefaultValue, 0.20m),
            ConfidenceMissingFuelPenalty = ParseDecimal(configs[ConfidenceMissingFuelPenaltyKey].ConfigurationValue, 0.10m),
            DefaultConfidenceMissingFuelPenalty = ParseDecimal(configs[ConfidenceMissingFuelPenaltyKey].DefaultValue, 0.10m),
            ConfidenceWeakFuelPenalty = ParseDecimal(configs[ConfidenceWeakFuelPenaltyKey].ConfigurationValue, 0.05m),
            DefaultConfidenceWeakFuelPenalty = ParseDecimal(configs[ConfidenceWeakFuelPenaltyKey].DefaultValue, 0.05m),
            ConfidenceMinimumScore = ParseDecimal(configs[ConfidenceMinimumScoreKey].ConfigurationValue, 0.10m),
            DefaultConfidenceMinimumScore = ParseDecimal(configs[ConfidenceMinimumScoreKey].DefaultValue, 0.10m),
            ConfidenceHighBandThreshold = ParseDecimal(configs[ConfidenceHighBandThresholdKey].ConfigurationValue, 0.85m),
            DefaultConfidenceHighBandThreshold = ParseDecimal(configs[ConfidenceHighBandThresholdKey].DefaultValue, 0.85m),
            ConfidenceMediumBandThreshold = ParseDecimal(configs[ConfidenceMediumBandThresholdKey].ConfigurationValue, 0.60m),
            DefaultConfidenceMediumBandThreshold = ParseDecimal(configs[ConfidenceMediumBandThresholdKey].DefaultValue, 0.60m),
            ConfidenceHighSpeedThresholdKph = ParseDecimal(configs[ConfidenceHighSpeedThresholdKphKey].ConfigurationValue, 120m),
            DefaultConfidenceHighSpeedThresholdKph = ParseDecimal(configs[ConfidenceHighSpeedThresholdKphKey].DefaultValue, 120m),
            ConfidenceShortTripDistanceThresholdKm = ParseDecimal(configs[ConfidenceShortTripDistanceThresholdKmKey].ConfigurationValue, 1.00m),
            DefaultConfidenceShortTripDistanceThresholdKm = ParseDecimal(configs[ConfidenceShortTripDistanceThresholdKmKey].DefaultValue, 1.00m),
            ConfidenceShortTripDurationThresholdMinutes = ParseDecimal(configs[ConfidenceShortTripDurationThresholdMinutesKey].ConfigurationValue, 5.00m),
            DefaultConfidenceShortTripDurationThresholdMinutes = ParseDecimal(configs[ConfidenceShortTripDurationThresholdMinutesKey].DefaultValue, 5.00m),
            ConfidenceLoadCycleSuspiciousFuelRateThresholdKmPerLiter = ParseDecimal(configs[ConfidenceLoadCycleSuspiciousFuelRateThresholdKey].ConfigurationValue, 3.00m),
            DefaultConfidenceLoadCycleSuspiciousFuelRateThresholdKmPerLiter = ParseDecimal(configs[ConfidenceLoadCycleSuspiciousFuelRateThresholdKey].DefaultValue, 3.00m),
            ConfidenceLoadCycleReturnFuelRateThresholdKmPerLiter = ParseDecimal(configs[ConfidenceLoadCycleReturnFuelRateThresholdKey].ConfigurationValue, 3.50m),
            DefaultConfidenceLoadCycleReturnFuelRateThresholdKmPerLiter = ParseDecimal(configs[ConfidenceLoadCycleReturnFuelRateThresholdKey].DefaultValue, 3.50m),
            ClusterBatchStopSpeedThresholdKph = ParseDecimal(configs[ClusterBatchStopSpeedKey].ConfigurationValue, 3m),
            DefaultClusterBatchStopSpeedThresholdKph = ParseDecimal(configs[ClusterBatchStopSpeedKey].DefaultValue, 3m),
            ClusterBatchMinimumStopDurationMinutes = ParseDecimal(configs[ClusterBatchMinStopDurationKey].ConfigurationValue, 1.5m),
            DefaultClusterBatchMinimumStopDurationMinutes = ParseDecimal(configs[ClusterBatchMinStopDurationKey].DefaultValue, 1.5m),
            ClusterBatchMinimumTripDistanceKm = ParseDecimal(configs[ClusterBatchMinTripDistanceKey].ConfigurationValue, 0.50m),
            DefaultClusterBatchMinimumTripDistanceKm = ParseDecimal(configs[ClusterBatchMinTripDistanceKey].DefaultValue, 0.50m),
            ClusterBatchMinimumTripDurationMinutes = ParseDecimal(configs[ClusterBatchMinTripDurationKey].ConfigurationValue, 2m),
            DefaultClusterBatchMinimumTripDurationMinutes = ParseDecimal(configs[ClusterBatchMinTripDurationKey].DefaultValue, 2m),
            ClusterBatchClusterRadiusMeters = ParseDecimal(configs[ClusterBatchClusterRadiusKey].ConfigurationValue, 150m),
            DefaultClusterBatchClusterRadiusMeters = ParseDecimal(configs[ClusterBatchClusterRadiusKey].DefaultValue, 150m),
            ClusterBatchMaxTrackPoints = ParseInt(configs[ClusterBatchMaxTrackPointsKey].ConfigurationValue, 5000),
            DefaultClusterBatchMaxTrackPoints = ParseInt(configs[ClusterBatchMaxTrackPointsKey].DefaultValue, 5000),
            ClusterRealtimeStopSpeedThresholdKph = ParseDecimal(configs[ClusterRealtimeStopSpeedKey].ConfigurationValue, 5m),
            DefaultClusterRealtimeStopSpeedThresholdKph = ParseDecimal(configs[ClusterRealtimeStopSpeedKey].DefaultValue, 5m),
            ClusterRealtimeStopDurationPoints = ParseInt(configs[ClusterRealtimeStopDurationPointsKey].ConfigurationValue, 3),
            DefaultClusterRealtimeStopDurationPoints = ParseInt(configs[ClusterRealtimeStopDurationPointsKey].DefaultValue, 3),
            ClusterRealtimeMovingDurationPoints = ParseInt(configs[ClusterRealtimeMovingDurationPointsKey].ConfigurationValue, 2),
            DefaultClusterRealtimeMovingDurationPoints = ParseInt(configs[ClusterRealtimeMovingDurationPointsKey].DefaultValue, 2),
            ClusterRealtimeClusterMatchRadiusKm = ParseDecimal(configs[ClusterRealtimeClusterMatchRadiusKey].ConfigurationValue, 0.15m),
            DefaultClusterRealtimeClusterMatchRadiusKm = ParseDecimal(configs[ClusterRealtimeClusterMatchRadiusKey].DefaultValue, 0.15m),
            ConfigurationKey = RealtimeStateMachineExecutionKey,
            Description = "VehicleTrips enrichment, reconciliation scheduling, scoring, and realtime execution settings.",
            UpdatedAtUtc = updatedAt,
            UpdatedBy = updatedBy,
        };
    }

    private static VehicleTripSettingsDTO Normalize(VehicleTripSettingsDTO settings)
    {
        var mediumBandThreshold = ClampDecimal(settings.ConfidenceMediumBandThreshold, 0.05m, 0.95m);
        var highBandThreshold = ClampDecimal(settings.ConfidenceHighBandThreshold, mediumBandThreshold, 1.00m);

        return new VehicleTripSettingsDTO
        {
            EnableRealtimeStateMachineExecution = settings.EnableRealtimeStateMachineExecution,
            EnableScheduledReconciliation = settings.EnableScheduledReconciliation,
            ReconciliationDailyRunTimeLocal = NormalizeDailyRunTimeLocal(settings.ReconciliationDailyRunTimeLocal, DefaultReconciliationRunTimeLocalValue),
            ReconciliationLookbackDays = ClampInt(settings.ReconciliationLookbackDays, 1, 365),
            EnableFuelContextEnrichment = settings.EnableFuelContextEnrichment,
            FuelLookupWindowHours = ClampDecimal(settings.FuelLookupWindowHours, 0.25m, 24m),
            ConfidenceUnknownEndpointPenalty = ClampDecimal(settings.ConfidenceUnknownEndpointPenalty, 0m, 1m),
            ConfidenceShortTripPenalty = ClampDecimal(settings.ConfidenceShortTripPenalty, 0m, 1m),
            ConfidenceHighSpeedPenalty = ClampDecimal(settings.ConfidenceHighSpeedPenalty, 0m, 1m),
            ConfidenceMissingFuelPenalty = ClampDecimal(settings.ConfidenceMissingFuelPenalty, 0m, 1m),
            ConfidenceWeakFuelPenalty = ClampDecimal(settings.ConfidenceWeakFuelPenalty, 0m, 1m),
            ConfidenceMinimumScore = ClampDecimal(settings.ConfidenceMinimumScore, 0m, mediumBandThreshold),
            ConfidenceHighBandThreshold = highBandThreshold,
            ConfidenceMediumBandThreshold = mediumBandThreshold,
            ConfidenceHighSpeedThresholdKph = ClampDecimal(settings.ConfidenceHighSpeedThresholdKph, 1m, 500m),
            ConfidenceShortTripDistanceThresholdKm = ClampDecimal(settings.ConfidenceShortTripDistanceThresholdKm, 0m, 100m),
            ConfidenceShortTripDurationThresholdMinutes = ClampDecimal(settings.ConfidenceShortTripDurationThresholdMinutes, 0m, 1440m),
            ConfidenceLoadCycleSuspiciousFuelRateThresholdKmPerLiter = ClampDecimal(settings.ConfidenceLoadCycleSuspiciousFuelRateThresholdKmPerLiter, 0m, 100m),
            ConfidenceLoadCycleReturnFuelRateThresholdKmPerLiter = ClampDecimal(settings.ConfidenceLoadCycleReturnFuelRateThresholdKmPerLiter, settings.ConfidenceLoadCycleSuspiciousFuelRateThresholdKmPerLiter, 100m),
            ClusterBatchStopSpeedThresholdKph = ClampDecimal(settings.ClusterBatchStopSpeedThresholdKph, 0m, 50m),
            ClusterBatchMinimumStopDurationMinutes = ClampDecimal(settings.ClusterBatchMinimumStopDurationMinutes, 0.1m, 60m),
            ClusterBatchMinimumTripDistanceKm = ClampDecimal(settings.ClusterBatchMinimumTripDistanceKm, 0m, 100m),
            ClusterBatchMinimumTripDurationMinutes = ClampDecimal(settings.ClusterBatchMinimumTripDurationMinutes, 0m, 1440m),
            ClusterBatchClusterRadiusMeters = ClampDecimal(settings.ClusterBatchClusterRadiusMeters, 10m, 5000m),
            ClusterBatchMaxTrackPoints = ClampInt(settings.ClusterBatchMaxTrackPoints, 100, 50000),
            ClusterRealtimeStopSpeedThresholdKph = ClampDecimal(settings.ClusterRealtimeStopSpeedThresholdKph, 0m, 50m),
            ClusterRealtimeStopDurationPoints = ClampInt(settings.ClusterRealtimeStopDurationPoints, 1, 50),
            ClusterRealtimeMovingDurationPoints = ClampInt(settings.ClusterRealtimeMovingDurationPoints, 1, 50),
            ClusterRealtimeClusterMatchRadiusKm = ClampDecimal(settings.ClusterRealtimeClusterMatchRadiusKm, 0.01m, 10m),
        };
    }

    private static string GetSerializedValue(VehicleTripSettingsDTO settings, string key)
    {
        if (key == RealtimeStateMachineExecutionKey)
        {
            return SerializeBoolean(settings.EnableRealtimeStateMachineExecution);
        }

        if (key == ReconciliationEnabledKey)
        {
            return SerializeBoolean(settings.EnableScheduledReconciliation);
        }

        if (key == FuelContextEnrichmentEnabledKey)
        {
            return SerializeBoolean(settings.EnableFuelContextEnrichment);
        }

        return key switch
        {
            ReconciliationRunTimeLocalKey => settings.ReconciliationDailyRunTimeLocal,
            ReconciliationLookbackDaysKey => SerializeInt(settings.ReconciliationLookbackDays),
            FuelLookupWindowHoursKey => SerializeDecimal(settings.FuelLookupWindowHours),
            ConfidenceUnknownEndpointPenaltyKey => SerializeDecimal(settings.ConfidenceUnknownEndpointPenalty),
            ConfidenceShortTripPenaltyKey => SerializeDecimal(settings.ConfidenceShortTripPenalty),
            ConfidenceHighSpeedPenaltyKey => SerializeDecimal(settings.ConfidenceHighSpeedPenalty),
            ConfidenceMissingFuelPenaltyKey => SerializeDecimal(settings.ConfidenceMissingFuelPenalty),
            ConfidenceWeakFuelPenaltyKey => SerializeDecimal(settings.ConfidenceWeakFuelPenalty),
            ConfidenceMinimumScoreKey => SerializeDecimal(settings.ConfidenceMinimumScore),
            ConfidenceHighBandThresholdKey => SerializeDecimal(settings.ConfidenceHighBandThreshold),
            ConfidenceMediumBandThresholdKey => SerializeDecimal(settings.ConfidenceMediumBandThreshold),
            ConfidenceHighSpeedThresholdKphKey => SerializeDecimal(settings.ConfidenceHighSpeedThresholdKph),
            ConfidenceShortTripDistanceThresholdKmKey => SerializeDecimal(settings.ConfidenceShortTripDistanceThresholdKm),
            ConfidenceShortTripDurationThresholdMinutesKey => SerializeDecimal(settings.ConfidenceShortTripDurationThresholdMinutes),
            ConfidenceLoadCycleSuspiciousFuelRateThresholdKey => SerializeDecimal(settings.ConfidenceLoadCycleSuspiciousFuelRateThresholdKmPerLiter),
            ConfidenceLoadCycleReturnFuelRateThresholdKey => SerializeDecimal(settings.ConfidenceLoadCycleReturnFuelRateThresholdKmPerLiter),
            ClusterBatchStopSpeedKey => SerializeDecimal(settings.ClusterBatchStopSpeedThresholdKph),
            ClusterBatchMinStopDurationKey => SerializeDecimal(settings.ClusterBatchMinimumStopDurationMinutes),
            ClusterBatchMinTripDistanceKey => SerializeDecimal(settings.ClusterBatchMinimumTripDistanceKm),
            ClusterBatchMinTripDurationKey => SerializeDecimal(settings.ClusterBatchMinimumTripDurationMinutes),
            ClusterBatchClusterRadiusKey => SerializeDecimal(settings.ClusterBatchClusterRadiusMeters),
            ClusterBatchMaxTrackPointsKey => SerializeInt(settings.ClusterBatchMaxTrackPoints),
            ClusterRealtimeStopSpeedKey => SerializeDecimal(settings.ClusterRealtimeStopSpeedThresholdKph),
            ClusterRealtimeStopDurationPointsKey => SerializeInt(settings.ClusterRealtimeStopDurationPoints),
            ClusterRealtimeMovingDurationPointsKey => SerializeInt(settings.ClusterRealtimeMovingDurationPoints),
            ClusterRealtimeClusterMatchRadiusKey => SerializeDecimal(settings.ClusterRealtimeClusterMatchRadiusKm),
            _ => throw new InvalidOperationException($"Unknown VehicleTrips configuration key '{key}'."),
        };
    }

    private static bool ParseBoolean(string? value, bool defaultValue)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return defaultValue;
        }

        if (bool.TryParse(value, out var parsed))
        {
            return parsed;
        }

        return value == "1"
            ? true
            : value == "0"
                ? false
                : defaultValue;
    }

    private static decimal ParseDecimal(string? value, decimal defaultValue)
    {
        return decimal.TryParse(value, NumberStyles.Float, CultureInfo.InvariantCulture, out var parsed)
            ? parsed
            : defaultValue;
    }

    private static int ParseInt(string? value, int defaultValue)
    {
        return int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsed)
            ? parsed
            : defaultValue;
    }

    private static string SerializeBoolean(bool value) => value ? "true" : "false";

    private static string SerializeDecimal(decimal value) => value.ToString("0.##", CultureInfo.InvariantCulture);

    private static string SerializeInt(int value) => value.ToString(CultureInfo.InvariantCulture);

    private static string NormalizeDailyRunTimeLocal(string? value, string fallback)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return fallback;
        }

        if (TimeSpan.TryParseExact(
                value,
                new[] { @"hh\:mm", @"h\:mm", @"hh\:mm\:ss", @"h\:mm\:ss" },
                CultureInfo.InvariantCulture,
                out var parsedTime)
            && parsedTime >= TimeSpan.Zero
            && parsedTime < TimeSpan.FromDays(1))
        {
            return parsedTime.ToString(@"hh\:mm", CultureInfo.InvariantCulture);
        }

        return fallback;
    }

    private static decimal ClampDecimal(decimal value, decimal minValue, decimal maxValue)
    {
        if (value < minValue)
        {
            return minValue;
        }

        if (value > maxValue)
        {
            return maxValue;
        }

        return value;
    }

    private static int ClampInt(int value, int minValue, int maxValue)
    {
        if (value < minValue)
        {
            return minValue;
        }

        if (value > maxValue)
        {
            return maxValue;
        }

        return value;
    }

    private sealed record VehicleTripSettingDefinition(
        string Key,
        string DefaultValue,
        string DataType,
        string ValidationPattern,
        string Description);
}