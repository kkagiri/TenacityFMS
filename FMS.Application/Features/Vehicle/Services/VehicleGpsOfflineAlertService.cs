using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.EventEngine.Engine;
using FMS.Application.Features.EventEngine.Events;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.Services;
using FMS.Application.Services.Configuration;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Vehicle.Services;

/// <summary>
/// Service to check vehicle GPS status and create alerts when vehicles with GPS
/// are fueled while offline or not seen for a configurable period.
/// </summary>
public class VehicleGpsOfflineAlertService : IVehicleGpsOfflineAlertService
{
    private readonly GpsdataContext _context;
    private readonly ILogger<VehicleGpsOfflineAlertService> _logger;
    private readonly INotificationService _notificationService;
    private readonly IGPSService? _gpsService;
    private readonly ISystemConfigurationService? _configService;
    private readonly IEventExpressionEngine? _eventEngine;

    /// <summary>
    /// Default threshold in days for GPS stale detection (used if config not available)
    /// </summary>
    private const int DEFAULT_GPS_OFFLINE_THRESHOLD_DAYS = 2;

    /// <summary>
    /// Configuration key for GPS offline threshold
    /// </summary>
    private const string CONFIG_KEY_GPS_OFFLINE_THRESHOLD_DAYS = "Vehicle.GpsOfflineAlertThresholdDays";

    /// <summary>
    /// Alarm type for GPS offline during fueling
    /// </summary>
    private const string ALARM_TYPE_GPS_OFFLINE_FUELING = "VehicleGpsOfflineDuringFueling";

    public VehicleGpsOfflineAlertService(
        GpsdataContext context,
        ILogger<VehicleGpsOfflineAlertService> logger,
        INotificationService notificationService,
        IGPSService? gpsService = null,
        ISystemConfigurationService? configService = null,
        IEventExpressionEngine? eventEngine = null)
    {
        _context = context;
        _logger = logger;
        _notificationService = notificationService;
        _gpsService = gpsService;
        _configService = configService;
        _eventEngine = eventEngine;
    }

    public async Task<int> GetGpsOfflineThresholdDaysAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            // Try to get from system configuration database
            var config = await _context.SystemConfigurations
                .FirstOrDefaultAsync(c => c.ConfigurationKey == CONFIG_KEY_GPS_OFFLINE_THRESHOLD_DAYS, cancellationToken);

            if (config != null && int.TryParse(config.ConfigurationValue, out var days) && days > 0)
            {
                return days;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get GPS offline threshold from config, using default");
        }

        return DEFAULT_GPS_OFFLINE_THRESHOLD_DAYS;
    }

    public async Task<VehicleGpsAlertResult> CheckAndAlertIfGpsOfflineAsync(
        int vehicleId,
        int? siteId,
        decimal? fuelAmount,
        string? triggeredBy,
        CancellationToken cancellationToken = default)
    {
        var result = new VehicleGpsAlertResult();

        try
        {
            // Step 1: Check if vehicle has GPS tracking configured
            var providerMapping = await _context.VehicleProviderMappings
                .Include(m => m.Vehicle)
                .FirstOrDefaultAsync(m => m.VehicleId == vehicleId && m.IsActive, cancellationToken);

            if (providerMapping == null || string.IsNullOrEmpty(providerMapping.ExternalDeviceId))
            {
                // Vehicle doesn't have GPS tracking configured
                result.VehicleHasGps = false;
                result.Message = "Vehicle does not have GPS tracking configured";
                _logger.LogDebug("Vehicle {VehicleId} does not have GPS tracking configured, skipping offline check", vehicleId);
                return result;
            }

            result.VehicleHasGps = true;
            var vehicle = providerMapping.Vehicle;
            var vehicleIdentifier = vehicle?.HyoungNo ?? vehicleId.ToString();

            // Step 2: Get vehicle's last known location to check if GPS is offline
            DateTime? lastSeenUtc = null;
            bool isOffline = false;

            if (_gpsService != null)
            {
                try
                {
                    var locationResponse = await _gpsService.GetVehicleLocationAsync(vehicleId);

                    if (locationResponse.IsSuccess && locationResponse.Data != null)
                    {
                        var location = locationResponse.Data;
                        lastSeenUtc = location.LastUpdated;
                        result.LastSeenUtc = lastSeenUtc;

                        // Calculate days since last seen
                        var daysSinceLastSeen = (DateTime.UtcNow - lastSeenUtc.Value).TotalDays;
                        result.DaysSinceLastSeen = (int)daysSinceLastSeen;

                        // Get threshold from configuration
                        var thresholdDays = await GetGpsOfflineThresholdDaysAsync(cancellationToken);

                        // Check if offline (no recent location data) or if device is explicitly offline
                        isOffline = !location.IsOnline || daysSinceLastSeen >= thresholdDays;

                        _logger.LogWarning("Vehicle {VehicleId} last seen {DaysSinceLastSeen:F1} days ago (threshold: {ThresholdDays} days), IsOnline: {IsOnline}",
                            vehicleId, daysSinceLastSeen, thresholdDays, location.IsOnline);
                    }
                    else
                    {
                        // No location data at all - consider as offline
                        isOffline = true;
                        _logger.LogDebug("Vehicle {VehicleId} has no location data available", vehicleId);
                    }
                }
                catch (Exception ex)
                {
                    // If we can't get location data, log but don't create alert (might be a temporary issue)
                    _logger.LogWarning(ex, "Failed to get location data for vehicle {VehicleId}", vehicleId);
                    result.Message = $"Failed to get GPS location data: {ex.Message}";
                    return result;
                }
            }
            else
            {
                // No GPS service available - can't check offline status
                _logger.LogWarning("[VehicleGPSofflineAlert]GPS service not available, cannot check GPS status for vehicle {VehicleId}", vehicleId);
                result.Message = "GPS service not available";
                return result;
            }

            result.IsGpsOffline = isOffline;

            // Step 3: Create alert if GPS is offline
            if (isOffline)
            {
                result.AlertType = ALARM_TYPE_GPS_OFFLINE_FUELING;

                var alertMessage = result.LastSeenUtc.HasValue
                    ? $"Vehicle {vehicleIdentifier} was fueled but GPS has been offline for {result.DaysSinceLastSeen} days (last seen: {result.LastSeenUtc:yyyy-MM-dd HH:mm} UTC)"
                    : $"Vehicle {vehicleIdentifier} was fueled but GPS has no location data available";

                // Fire VehicleGpsEvent through the event expression engine
                if (_eventEngine != null)
                {
                    var gpsEvent = new VehicleGpsEvent
                    {
                        SiteId = siteId,
                        VehicleId = vehicleId,
                        VehicleName = vehicleIdentifier,
                        Severity = "High",
                        GpsStatus = "Offline",
                        Message = alertMessage,
                        LastPositionAt = result.LastSeenUtc,
                        OfflineDuration = result.LastSeenUtc.HasValue ? DateTime.UtcNow - result.LastSeenUtc.Value : null,
                    };
                    gpsEvent.Data["FuelAmount"] = fuelAmount ?? 0;
                    gpsEvent.Data["TriggeredBy"] = triggeredBy ?? "System";
                    await _eventEngine.ProcessAsync(gpsEvent, cancellationToken);
                }
                _logger.LogInformation("GPS offline event detected for vehicle {VehicleId} ({VehicleNo}) - last seen {DaysSinceLastSeen} days ago",
                    vehicleId, vehicleIdentifier, result.DaysSinceLastSeen);

                result.AlertCreated = true;
                result.Message = alertMessage;
            }
            else
            {
                result.Message = $"Vehicle GPS is online (last seen {result.DaysSinceLastSeen} days ago)";
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking GPS offline status for vehicle {VehicleId}", vehicleId);
            result.Message = $"Error checking GPS status: {ex.Message}";
            return result;
        }
    }
}
