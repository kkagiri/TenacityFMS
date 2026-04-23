using FMS.Application.Features.LocationValidation.DTOs;
using FMS.Application.Features.Vehicle.Services;
using FMS.Application.Configuration;
using FMS.Application.Services.Configuration;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Enums;
using FMS.Domain.Entities.Features.FuelRuleSet;
using FMS.Domain.Entities.Features.GPSIntergration.GpsGate;
using FMS.Domain.Entities.Features.LocationValidation;
using FMS.Domain.Entities.VehicleTracking;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.LocationValidation.Services;

/// <summary>
/// Implementation of location validation service for fueling operations.
/// Validates proximity between vehicles, mobile devices, and tanks/dispensers.
/// </summary>
/// <remarks>
/// This is a partial class. Geofence-related methods are in LocationValidationService.Geofence.cs
/// </remarks>
public partial class LocationValidationService : ILocationValidationService
{
    private readonly GpsdataContext _context;
    private readonly IGPSService _gpsService;
    private readonly ILogger<LocationValidationService> _logger;
    private readonly ISystemConfigurationService _systemConfigService;

    // Configuration keys for FuelingRules
    private const string CONFIG_KEY_ENABLE_LOCATION_VALIDATION = "FuelingRules.EnableLocationValidation";
    private const string CONFIG_KEY_BYPASS_ON_GPS_FAILURE = "FuelingRules.BypassOnGPSFailure";
    private const string CONFIG_KEY_ALLOW_NON_GPS_VEHICLES = "FuelingRules.AllowNonGPSVehicles";
    private const string CONFIG_KEY_REQUIRE_TANKER_IN_GEOFENCE = "FuelingRules.RequireTankerInGeofence";
    private const string CONFIG_KEY_REQUIRE_OPERATOR_IN_GEOFENCE = "FuelingRules.RequireOperatorInGeofence";
    private const string CONFIG_KEY_REQUIRE_VEHICLE_IN_GEOFENCE = "FuelingRules.RequireVehicleInGeofence";

    // Mobile location validation configuration keys
    private const string CONFIG_KEY_REQUIRE_MOBILE_LOCATION = "FuelingRules.RequireMobileLocation";
    private const string CONFIG_KEY_MAX_MOBILE_LOCATION_AGE_SECONDS = "FuelingRules.MaxMobileLocationAgeSeconds";
    private const string CONFIG_KEY_MAX_MOBILE_LOCATION_ACCURACY_METERS = "FuelingRules.MaxMobileLocationAccuracyMeters";
    private const string CONFIG_KEY_REJECT_CACHED_MOBILE_LOCATION = "FuelingRules.RejectCachedMobileLocation";

    // Temporary bypass configuration keys
    private const string CONFIG_KEY_TEMPORARY_BYPASS_ACTIVE = "FuelingRules.TemporaryBypass.IsActive";
    private const string CONFIG_KEY_TEMPORARY_BYPASS_EXPIRES = "FuelingRules.TemporaryBypass.ExpiresAt";

    // Earth radius in meters for Haversine formula
    private const double EarthRadiusMeters = 6371000;

    public LocationValidationService(
        GpsdataContext context,
        IGPSService gpsService,
        ISystemConfigurationService systemConfigService,
        ILogger<LocationValidationService> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _gpsService = gpsService ?? throw new ArgumentNullException(nameof(gpsService));
        _systemConfigService = systemConfigService ?? throw new ArgumentNullException(nameof(systemConfigService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc />
    public async Task<LocationValidationResult> ValidateProximityAsync(
        LocationValidationRequest request,
        CancellationToken cancellationToken = default)
    {
        LocationValidationResult result;
        Ptsdevice? ptsDevice = null;

        try
        {
            _logger.LogDebug("Starting location validation for Tank {TankId}, Vehicle {VehicleId}",
                request.TankId, request.VehicleId);

            // **STEP 0: Check if user has permanent bypass permission (BypassLocationValidation flag)**
            if (!string.IsNullOrEmpty(request.UserId))
            {
                var user = await _context.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

                if (user?.BypassLocationValidation == true)
                {
                    _logger.LogInformation(
                        "[LocationValidation] User {UserId} has BypassLocationValidation enabled - skipping all location checks",
                        request.UserId);

                    result = LocationValidationResult.Bypassed(
                        "Location validation bypassed - user has BypassLocationValidation permission");
                    return result;
                }

                // **STEP 0.1: Check for USER-SPECIFIC temporary bypass**
                var userBypassResult = await CheckUserSpecificBypassAsync(request.UserId, cancellationToken);
                if (userBypassResult.IsActive)
                {
                    _logger.LogWarning(
                        "[LocationValidation] USER-SPECIFIC bypass active for {UserId} - skipping all location checks",
                        request.UserId);

                    var expiresInfo = userBypassResult.ExpiresAt.HasValue
                        ? $"until {userBypassResult.ExpiresAt:HH:mm:ss}"
                        : "(permanent)";
                    result = LocationValidationResult.Bypassed(
                        $"Location validation bypassed for user {expiresInfo}. Reason: {userBypassResult.Reason ?? "Admin override"}");
                    return result;
                }
            }

            // **STEP 0.2: Check for VEHICLE-SPECIFIC bypass (e.g., vehicle with poor GPS)**
            if (request.VehicleId.HasValue)
            {
                var vehicleBypassResult = await CheckVehicleBypassAsync(request.VehicleId.Value, cancellationToken);
                if (vehicleBypassResult.IsActive)
                {
                    _logger.LogWarning(
                        "[LocationValidation] VEHICLE-SPECIFIC bypass active for Vehicle {VehicleId} - skipping all location checks",
                        request.VehicleId.Value);

                    var expiresInfo = vehicleBypassResult.ExpiresAt.HasValue
                        ? $"until {vehicleBypassResult.ExpiresAt:HH:mm:ss}"
                        : "(permanent)";
                    result = LocationValidationResult.Bypassed(
                        $"Location validation bypassed for this vehicle {expiresInfo}. Reason: {vehicleBypassResult.Reason ?? "Poor GPS/Offline"}");
                    return result;
                }
            }

            // **STEP 0.5: Check for SYSTEM-WIDE TEMPORARY BYPASS (for offline vehicles, poor GPS, etc.)**
            var temporaryBypassResult = await CheckTemporaryBypassAsync(cancellationToken);
            if (temporaryBypassResult.IsActive)
            {
                _logger.LogWarning(
                    "[LocationValidation] SYSTEM-WIDE TEMPORARY BYPASS is active - skipping all location checks. Expires at: {ExpiresAt}, Reason: {Reason}",
                    temporaryBypassResult.ExpiresAt,
                    temporaryBypassResult.Reason ?? "Not specified");

                var expiresInfo = temporaryBypassResult.ExpiresAt.HasValue
                    ? $"until {temporaryBypassResult.ExpiresAt:HH:mm:ss}"
                    : "(permanent)";
                result = LocationValidationResult.Bypassed(
                    $"Location validation temporarily bypassed {expiresInfo}. Reason: {temporaryBypassResult.Reason ?? "Admin override"}");
                return result;
            }

            // **STEP 1: Check global location validation setting from SystemConfigurations**
            var globalLocationValidationEnabled = await _systemConfigService.GetConfigurationValueAsync(
                CONFIG_KEY_ENABLE_LOCATION_VALIDATION, cancellationToken);

            if (string.Equals(globalLocationValidationEnabled, "false", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogDebug("Location validation globally disabled via SystemConfiguration");

                // 🔍 DEBUG: Calculate and log distances even when validation is disabled
                await LogDistanceDebugInfoAsync(request, cancellationToken);

                result = LocationValidationResult.Skipped("Location validation is globally disabled");
                return result;
            }

            // Step 1: Get PTS device settings
            ptsDevice = await GetPtsDeviceForTankAsync(request.TankId, request.PtsId, cancellationToken);

            if (ptsDevice == null)
            {
                _logger.LogWarning("PTS device not found for tank {TankId}, PtsId {PtsId}", request.TankId, request.PtsId);
                // If we can't find the device, we can't determine if validation is required
                // This should be treated as a configuration error, not a skip
                result = LocationValidationResult.Failed("PTS device not found - unable to perform location validation");
                return result;
            }

            // Step 2: Check if location validation is enabled on the PTS device
            if (ptsDevice.EnableLocationValidation == 0)
            {
                _logger.LogDebug("Location validation not enabled for PTS {PtsId}", ptsDevice.Ptsid);
                result = LocationValidationResult.Skipped("Location validation not enabled for this device");

                // ENHANCEMENT: Even when validation is skipped, log the mobile location for tracking purposes
                // This ensures we capture fueling location even for devices without strict validation
                if (request.MobileAppLocation != null)
                {
                    _logger.LogDebug("[LocationValidation] Logging mobile location for tracking (validation skipped) - PTS {PtsId}", ptsDevice.Ptsid);
                    await LogValidationAuditAsync(request, result, ptsDevice.Ptsid, cancellationToken);
                }

                return result;
            }

            // **STEP 2.5: Now that we know validation is REQUIRED, we must enforce it**
            _logger.LogDebug("[LocationValidation] Validation REQUIRED for PTS {PtsId} - enforcing checks", ptsDevice.Ptsid);

            // Step 3: Get tank location (always fresh for mobile tankers)
            var (tankLocation, tankLocationSource) = await GetTankLocationAsync(request.TankId, cancellationToken);

            if (tankLocation == null || !tankLocation.IsValid)
            {
                if (ptsDevice.BypassOnGPSFailure == 1)
                {
                    _logger.LogWarning("Tank location unavailable but bypass enabled for PTS {PtsId}", ptsDevice.Ptsid);
                    result = LocationValidationResult.Bypassed("Tank location unavailable");
                    await LogValidationAuditAsync(request, result, ptsDevice.Ptsid, cancellationToken);
                    return result;
                }

                result = LocationValidationResult.Failed("Tank location unavailable and bypass is disabled");
                await LogValidationAuditAsync(request, result, ptsDevice.Ptsid, cancellationToken);
                return result;
            }

            // Get grace period and accuracy settings
            int gracePeriodMeters = ptsDevice.ProximityGracePeriodMeters ?? 10;
            int minimumGPSAccuracy = ptsDevice.MinimumGPSAccuracy ?? 20;

            // Get global BypassOnGPSFailure setting as fallback
            var globalBypassOnGPSFailure = await _systemConfigService.GetConfigurationValueAsync(
                CONFIG_KEY_BYPASS_ON_GPS_FAILURE, cancellationToken);
            bool allowBypassOnGPSFailure = ptsDevice.BypassOnGPSFailure == 1 ||
                string.Equals(globalBypassOnGPSFailure, "true", StringComparison.OrdinalIgnoreCase);

            // Get global AllowNonGPSVehicles setting
            var globalAllowNonGPSVehicles = await _systemConfigService.GetConfigurationValueAsync(
                CONFIG_KEY_ALLOW_NON_GPS_VEHICLES, cancellationToken);
            bool allowNonGPSVehicles = string.Equals(globalAllowNonGPSVehicles, "true", StringComparison.OrdinalIgnoreCase);

            // Step 4: Perform proximity checks
            ProximityCheckResult? vehicleProximity = null;
            ProximityCheckResult? mobileProximity = null;

            // Vehicle proximity check - CRITICAL FIX: Fail if required but no VehicleId provided
            if (ptsDevice.RequireVehicleProximity == 1)
            {
                if (!request.VehicleId.HasValue)
                {
                    _logger.LogWarning("[LocationValidation] Vehicle proximity REQUIRED but no VehicleId provided for PTS {PtsId}",
                        ptsDevice.Ptsid);

                    if (allowNonGPSVehicles && allowBypassOnGPSFailure)
                    {
                        _logger.LogWarning("[LocationValidation] Bypassing vehicle proximity check - AllowNonGPSVehicles=true");
                        vehicleProximity = new ProximityCheckResult
                        {
                            WasRequired = true,
                            IsValid = true,
                            Reason = "Vehicle proximity bypassed - no vehicle ID provided but AllowNonGPSVehicles is enabled"
                        };
                    }
                    else
                    {
                        result = LocationValidationResult.Failed(
                            "Vehicle proximity validation required but no vehicle ID was provided. Please select a vehicle before fueling.",
                            tankLocation,
                            new ProximityCheckResult
                            {
                                WasRequired = true,
                                IsValid = false,
                                Reason = "No vehicle ID provided for required vehicle proximity check"
                            },
                            null);
                        await LogValidationAuditAsync(request, result, ptsDevice.Ptsid, cancellationToken);
                        return result;
                    }
                }
                else
                {
                    vehicleProximity = await CheckVehicleProximityAsync(
                        request.VehicleId.Value,
                        tankLocation,
                        ptsDevice.VehicleProximityRadius ?? 100,
                        gracePeriodMeters,
                        minimumGPSAccuracy,
                        allowBypassOnGPSFailure,
                        cancellationToken);

                    // CRITICAL FIX: Only bypass if GPS was actually unavailable
                    // If GPS returned a valid location but vehicle is too far away, we MUST fail
                    if (vehicleProximity.WasRequired && !vehicleProximity.IsValid)
                    {
                        _logger.LogWarning(
                            "[LocationValidation] ❌ VEHICLE PROXIMITY FAILED - Distance: {Distance:F0}m, Max allowed: {MaxRadius}m, " +
                            "Bypassed due to GPS failure: {WasBypassed}",
                            vehicleProximity.DistanceMeters,
                            vehicleProximity.AllowedRadiusMeters,
                            vehicleProximity.WasBypassedDueToGPSFailure);

                        result = LocationValidationResult.Failed(
                            vehicleProximity.Reason ?? "Vehicle not within required proximity",
                            tankLocation,
                            vehicleProximity,
                            null);
                        await LogValidationAuditAsync(request, result, ptsDevice.Ptsid, cancellationToken);
                        return result;
                    }
                }
            }

            // Mobile app proximity check - CRITICAL FIX: Fail if required but no location provided
            if (ptsDevice.RequireMobileAppProximity == 1)
            {
                if (request.MobileAppLocation == null || !request.MobileAppLocation.IsValid)
                {
                    _logger.LogWarning("[LocationValidation] Mobile app proximity REQUIRED but no valid location provided for PTS {PtsId}",
                        ptsDevice.Ptsid);

                    // Check if we allow cached mobile locations
                    var allowCachedLocation = await _systemConfigService.GetConfigurationValueAsync(
                        "FuelingRules.AllowCachedMobileLocation", cancellationToken);

                    if (allowBypassOnGPSFailure)
                    {
                        _logger.LogWarning("[LocationValidation] Bypassing mobile proximity check - BypassOnGPSFailure=true");
                        mobileProximity = new ProximityCheckResult
                        {
                            WasRequired = true,
                            IsValid = true,
                            Reason = "Mobile proximity bypassed - no location provided but BypassOnGPSFailure is enabled"
                        };
                    }
                    else
                    {
                        result = LocationValidationResult.Failed(
                            "Mobile app location required for fueling but was not provided. Please enable location services and try again.",
                            tankLocation,
                            vehicleProximity,
                            new ProximityCheckResult
                            {
                                WasRequired = true,
                                IsValid = false,
                                Reason = "No mobile app location provided for required proximity check"
                            });
                        await LogValidationAuditAsync(request, result, ptsDevice.Ptsid, cancellationToken);
                        return result;
                    }
                }
                else
                {
                    mobileProximity = await CheckMobileProximityAsync(
                        request.MobileAppLocation,
                        tankLocation,
                        ptsDevice.MobileAppProximityRadius ?? 50,
                        gracePeriodMeters,
                        minimumGPSAccuracy,
                        allowBypassOnGPSFailure,
                        cancellationToken);

                    // CRITICAL FIX: Only bypass if GPS was actually unavailable
                    // If mobile location is valid but too far away, we MUST fail
                    if (mobileProximity.WasRequired && !mobileProximity.IsValid)
                    {
                        result = LocationValidationResult.Failed(
                            mobileProximity.Reason ?? "Mobile app not within required proximity",
                            tankLocation,
                            vehicleProximity,
                            mobileProximity);
                        await LogValidationAuditAsync(request, result, ptsDevice.Ptsid, cancellationToken);
                        return result;
                    }
                }
            }

            // All checks passed
            _logger.LogInformation(
                "[LocationValidation] ✅ Location validation PASSED for Tank {TankId}, Vehicle {VehicleId}. " +
                "Vehicle distance: {VehicleDistance:F0}m (max: {VehicleRadius}m), Mobile distance: {MobileDistance:F0}m (max: {MobileRadius}m)",
                request.TankId,
                request.VehicleId,
                vehicleProximity?.DistanceMeters,
                ptsDevice.VehicleProximityRadius,
                mobileProximity?.DistanceMeters,
                ptsDevice.MobileAppProximityRadius);

            // Check if any validation was bypassed due to GPS failure
            bool wasBypassed = (vehicleProximity?.WasBypassedDueToGPSFailure ?? false) ||
                               (mobileProximity?.WasBypassedDueToGPSFailure ?? false);

            if (wasBypassed)
            {
                result = new LocationValidationResult
                {
                    IsValid = true,
                    ValidationPerformed = true,
                    Outcome = ValidationOutcome.Bypassed,
                    TankLocation = tankLocation,
                    TankLocationSource = tankLocationSource,
                    VehicleProximity = vehicleProximity,
                    MobileProximity = mobileProximity,
                    WasBypassedDueToGPSFailure = true,
                    FailureReason = "Some checks were bypassed due to GPS unavailability"
                };
                await LogValidationAuditAsync(request, result, ptsDevice.Ptsid, cancellationToken);
                return result;
            }

            result = LocationValidationResult.Success(
                tankLocation,
                tankLocationSource,
                vehicleProximity,
                mobileProximity);
            await LogValidationAuditAsync(request, result, ptsDevice.Ptsid, cancellationToken);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during location validation for Tank {TankId}", request.TankId);

            // Check if we should bypass on error
            ptsDevice ??= await GetPtsDeviceForTankAsync(request.TankId, request.PtsId, cancellationToken);
            if (ptsDevice?.BypassOnGPSFailure == 1)
            {
                result = LocationValidationResult.Bypassed($"Validation error: {ex.Message}");
                await LogValidationAuditAsync(request, result, ptsDevice?.Ptsid ?? "UNKNOWN", cancellationToken);
                return result;
            }

            result = LocationValidationResult.Failed($"Validation error: {ex.Message}");
            if (ptsDevice != null)
            {
                await LogValidationAuditAsync(request, result, ptsDevice.Ptsid, cancellationToken);
            }
            return result;
        }
    }

    /// <inheritdoc />
    public async Task<(GeoLocation? Location, string? Source)> GetTankLocationAsync(
        int tankId,
        CancellationToken cancellationToken = default)
    {
        var tank = await _context.Tanks
            .Include(t => t.LinkedVehicle)
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == tankId, cancellationToken);

        if (tank == null)
        {
            _logger.LogWarning("Tank {TankId} not found", tankId);
            return (null, null);
        }

        // Stationary tank - use configured coordinates
        if (tank.TankType == TankType.Stationary)
        {
            if (tank.Latitude.HasValue && tank.Longitude.HasValue)
            {
                var location = new GeoLocation(tank.Latitude.Value, tank.Longitude.Value)
                {
                    Source = "Static",
                    Timestamp = DateTime.UtcNow
                };

                _logger.LogDebug("Stationary tank {TankId} location: {Location}", tankId, location);
                return (location, "Static");
            }

            _logger.LogWarning("Stationary tank {TankId} has no GPS coordinates configured", tankId);
            return (null, null);
        }

        // Mobile tanker - get location from linked vehicle
        if (tank.TankType == TankType.MobileTanker)
        {
            if (!tank.LinkedVehicleId.HasValue)
            {
                _logger.LogWarning("Mobile tanker {TankId} has no linked vehicle", tankId);
                return (null, null);
            }

            var vehicleLocation = await GetVehicleLocationAsync(tank.LinkedVehicleId.Value, cancellationToken);

            if (vehicleLocation != null)
            {
                var location = vehicleLocation with
                {
                    Source = "LinkedVehicle",
                    Timestamp = DateTime.UtcNow
                };

                _logger.LogDebug("Mobile tanker {TankId} location from vehicle {VehicleId}: {Location}",
                    tankId, tank.LinkedVehicleId, location);

                return (location, $"LinkedVehicle:{tank.LinkedVehicleId}");
            }

            _logger.LogWarning("Could not get location for mobile tanker {TankId}'s linked vehicle {VehicleId}",
                tankId, tank.LinkedVehicleId);
            return (null, null);
        }

        return (null, null);
    }

    /// <inheritdoc />
    public async Task<GeoLocation?> GetVehicleLocationAsync(
        int vehicleId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var locationResult = await _gpsService.GetVehicleLocationAsync(vehicleId);

            if (!locationResult.IsSuccess || locationResult.Data == null)
            {
                _logger.LogDebug("Could not get GPS location for vehicle {VehicleId}: {Message}",
                    vehicleId, locationResult.Message);
                return null;
            }

            var dto = locationResult.Data;

            if (dto.Latitude == 0 && dto.Longitude == 0)
            {
                _logger.LogDebug("Vehicle {VehicleId} has zero coordinates", vehicleId);
                return null;
            }

            return new GeoLocation(dto.Latitude, dto.Longitude)
            {
                Source = "GPSProvider",
                Timestamp = dto.LastUpdated,
                // Pass through GPS validation info from the DTO
                IsGPSValid = dto.IsGPSValid,
                DeviceActivityTime = dto.DeviceActivityTime,
                ValidationStatus = dto.ValidationStatus,
                ValidationStatusReason = dto.ValidationStatusReason
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting GPS location for vehicle {VehicleId}", vehicleId);
            return null;
        }
    }

    /// <summary>
    /// Gets vehicle location with full validation details.
    /// Use this method when you need to check GPS validation status for fueling.
    /// </summary>
    public async Task<VehicleLocationValidationResult> GetVehicleLocationWithValidationAsync(
        int vehicleId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var locationResult = await _gpsService.GetVehicleLocationAsync(vehicleId);

            if (!locationResult.IsSuccess || locationResult.Data == null)
            {
                _logger.LogDebug("Could not get GPS location for vehicle {VehicleId}: {Message}",
                    vehicleId, locationResult.Message);
                return new VehicleLocationValidationResult
                {
                    VehicleId = vehicleId,
                    HasLocation = false,
                    CanFuel = false,
                    ValidationStatus = Features.Vehicle.DTOs.GPSValidationStatus.NoData,
                    FailureReason = locationResult.Message ?? "GPS location unavailable"
                };
            }

            var dto = locationResult.Data;

            // Check for zero coordinates
            if (dto.Latitude == 0 && dto.Longitude == 0)
            {
                _logger.LogDebug("Vehicle {VehicleId} has zero coordinates", vehicleId);
                return new VehicleLocationValidationResult
                {
                    VehicleId = vehicleId,
                    HasLocation = false,
                    CanFuel = dto.ValidationStatus == Features.Vehicle.DTOs.GPSValidationStatus.NoGPSInstalled,
                    ValidationStatus = dto.ValidationStatus,
                    FailureReason = "GPS coordinates are zero"
                };
            }

            var location = new GeoLocation(dto.Latitude, dto.Longitude)
            {
                Source = "GPSProvider",
                Timestamp = dto.LastUpdated,
                IsGPSValid = dto.IsGPSValid,
                DeviceActivityTime = dto.DeviceActivityTime,
                ValidationStatus = dto.ValidationStatus,
                ValidationStatusReason = dto.ValidationStatusReason
            };

            return new VehicleLocationValidationResult
            {
                VehicleId = vehicleId,
                HasLocation = true,
                Location = location,
                CanFuel = dto.CanFuel,
                RequiresNotification = dto.RequiresDeviceIssueNotification,
                ValidationStatus = dto.ValidationStatus,
                ValidationStatusReason = dto.ValidationStatusReason,
                DeviceActivityTime = dto.DeviceActivityTime
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting GPS location with validation for vehicle {VehicleId}", vehicleId);
            return new VehicleLocationValidationResult
            {
                VehicleId = vehicleId,
                HasLocation = false,
                CanFuel = false,
                ValidationStatus = Features.Vehicle.DTOs.GPSValidationStatus.NoData,
                FailureReason = $"Error: {ex.Message}"
            };
        }
    }

    /// <inheritdoc />
    public double CalculateDistanceMeters(GeoLocation point1, GeoLocation point2)
    {
        // Haversine formula for great-circle distance
        var lat1Rad = DegreesToRadians((double)point1.Latitude);
        var lat2Rad = DegreesToRadians((double)point2.Latitude);
        var deltaLat = DegreesToRadians((double)(point2.Latitude - point1.Latitude));
        var deltaLon = DegreesToRadians((double)(point2.Longitude - point1.Longitude));

        var a = Math.Sin(deltaLat / 2) * Math.Sin(deltaLat / 2) +
                Math.Cos(lat1Rad) * Math.Cos(lat2Rad) *
                Math.Sin(deltaLon / 2) * Math.Sin(deltaLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return EarthRadiusMeters * c;
    }

    /// <summary>
    /// Formats distance for display - shows km if distance >= 500m, otherwise shows m
    /// </summary>
    private static string FormatDistance(double distanceMeters)
    {
        if (distanceMeters >= 500)
        {
            return $"{distanceMeters / 1000:F1}km";
        }
        return $"{distanceMeters:F0}m";
    }

    /// <inheritdoc />
    public async Task<bool> IsLocationValidationEnabledAsync(
        string ptsId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(ptsId))
            return false;

        var device = await _context.Ptsdevices
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Ptsid == ptsId, cancellationToken);

        return device?.EnableLocationValidation == 1;
    }

    #region Private Helper Methods

    private async Task<Ptsdevice?> GetPtsDeviceForTankAsync(
        int tankId,
        string? ptsId,
        CancellationToken cancellationToken)
    {
        // If PTS ID is provided directly, use it
        if (!string.IsNullOrEmpty(ptsId))
        {
            return await _context.Ptsdevices
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Ptsid == ptsId, cancellationToken);
        }

        // Otherwise, get it from the tank
        var tank = await _context.Tanks
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == tankId, cancellationToken);

        if (tank?.PtsId == null)
            return null;

        return await _context.Ptsdevices
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Ptsid == tank.PtsId, cancellationToken);
    }

    private async Task<ProximityCheckResult> CheckVehicleProximityAsync(
        int vehicleId,
        GeoLocation tankLocation,
        int allowedRadius,
        int gracePeriodMeters,
        int minimumGPSAccuracy,
        bool bypassOnFailure,
        CancellationToken cancellationToken)
    {
        // Check if vehicle exists
        var vehicle = await _context.Vehicles
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.VehicleId == vehicleId, cancellationToken);

        if (vehicle == null)
        {
            return new ProximityCheckResult
            {
                WasRequired = true,
                IsValid = bypassOnFailure,
                WasBypassedDueToGPSFailure = bypassOnFailure,
                Reason = bypassOnFailure ? "Vehicle not found - bypassed" : "Vehicle not found"
            };
        }

        // Get vehicle location with full validation details
        var locationValidation = await GetVehicleLocationWithValidationAsync(vehicleId, cancellationToken);

        // Handle case where location could not be retrieved
        if (!locationValidation.HasLocation || locationValidation.Location == null)
        {
            // Check if vehicle even has GPS tracking
            var hasGPS = await VehicleHasGPSAsync(vehicleId, cancellationToken);

            if (!hasGPS || locationValidation.ValidationStatus == Features.Vehicle.DTOs.GPSValidationStatus.NoGPSInstalled)
            {
                // Non-GPS vehicles can fuel (per user requirement)
                return new ProximityCheckResult
                {
                    WasRequired = true,
                    IsValid = true,
                    Reason = "Vehicle has no GPS tracking - proximity check skipped (non-GPS vehicles allowed)"
                };
            }

            return new ProximityCheckResult
            {
                WasRequired = true,
                IsValid = bypassOnFailure,
                WasBypassedDueToGPSFailure = bypassOnFailure,
                Reason = bypassOnFailure ? "Vehicle GPS unavailable - bypassed" : locationValidation.FailureReason ?? "Vehicle GPS unavailable"
            };
        }

        var vehicleLocation = locationValidation.Location;

        // **NEW: Check GPS validation status from device activity and valid flag**
        if (!locationValidation.CanFuel)
        {
            var statusReason = locationValidation.ValidationStatus switch
            {
                Features.Vehicle.DTOs.GPSValidationStatus.ValidButStaleDevice =>
                    $"GPS position is valid but device has been offline for too long. Last activity: {locationValidation.DeviceActivityTime?.ToString("g") ?? "Unknown"}. " +
                    "This vehicle cannot receive fuel until the GPS device is checked.",
                Features.Vehicle.DTOs.GPSValidationStatus.InvalidAndStale =>
                    $"GPS position is invalid and device has been inactive too long. Last activity: {locationValidation.DeviceActivityTime?.ToString("g") ?? "Unknown"}. " +
                    "Cannot verify vehicle location.",
                _ => locationValidation.ValidationStatusReason ?? "GPS validation failed"
            };

            _logger.LogWarning(
                "[LocationValidation] ❌ Vehicle {VehicleId} GPS validation FAILED. Status: {Status}, Reason: {Reason}",
                vehicleId, locationValidation.ValidationStatus, statusReason);

            // Create notification for stale device
            if (locationValidation.RequiresNotification)
            {
                await CreateStaleDeviceNotificationAsync(vehicleId, vehicle.HyoungNo ?? vehicleId.ToString(),
                    locationValidation.DeviceActivityTime, cancellationToken);
            }

            return new ProximityCheckResult
            {
                WasRequired = true,
                IsValid = false,
                Location = vehicleLocation,
                Reason = statusReason,
                GPSValidationStatus = locationValidation.ValidationStatus
            };
        }

        // Log if GPS was invalid but we're allowing due to recent activity
        if (locationValidation.ValidationStatus == Features.Vehicle.DTOs.GPSValidationStatus.InvalidButRecentActivity)
        {
            _logger.LogInformation(
                "[LocationValidation] ⚠️ Vehicle {VehicleId} GPS is INVALID but device was active recently. Allowing fueling.",
                vehicleId);
        }

        // Log if GPS position is stale but we're allowing as a faulty device bypass
        // CRITICAL: Skip distance check entirely for stale GPS - the coordinates are unreliable
        if (locationValidation.ValidationStatus == Features.Vehicle.DTOs.GPSValidationStatus.StalePositionBypassed)
        {
            _logger.LogWarning(
                "[LocationValidation] ⚠️ Vehicle {VehicleId} GPS POSITION IS STALE (faulty GPS device). " +
                "BYPASSING distance check - stale coordinates are unreliable. Fueling allowed but logged. Reason: {Reason}",
                vehicleId, locationValidation.ValidationStatusReason);

            return new ProximityCheckResult
            {
                WasRequired = true,
                IsValid = true,  // Allow fueling
                Location = vehicleLocation,
                WasBypassedDueToGPSFailure = true,  // Flag that this was bypassed
                Reason = $"GPS position is stale - distance check bypassed (faulty GPS device). {locationValidation.ValidationStatusReason}",
                GPSValidationStatus = locationValidation.ValidationStatus
            };
        }

        // Check GPS accuracy (per user requirement)
        if (vehicleLocation.Accuracy.HasValue && vehicleLocation.Accuracy > minimumGPSAccuracy)
        {
            _logger.LogWarning("Vehicle GPS accuracy {Accuracy}m exceeds threshold {Threshold}m",
                vehicleLocation.Accuracy, minimumGPSAccuracy);

            // Still allow but log warning - don't block if accuracy is poor
            // Accuracy issues are logged but we proceed with the distance check
        }

        // Calculate distance
        var distance = CalculateDistanceMeters(vehicleLocation, tankLocation);

        // Apply grace period tolerance (per user requirement)
        // If distance is 110m and radius is 100m with 10m grace, effective radius is 110m
        int effectiveRadius = allowedRadius + gracePeriodMeters;
        var isWithinRadius = distance <= effectiveRadius;

        string? reason = null;
        if (!isWithinRadius)
        {
            reason = $"Vehicle is {FormatDistance(distance)} away, must be within {allowedRadius}m (with {gracePeriodMeters}m tolerance)";
        }
        else if (distance > allowedRadius && distance <= effectiveRadius)
        {
            // Within grace period - log info
            _logger.LogDebug("Vehicle {VehicleId} is {Distance}m away - within grace period ({Radius}m + {Grace}m tolerance)",
                vehicleId, distance, allowedRadius, gracePeriodMeters);
        }

        return new ProximityCheckResult
        {
            WasRequired = true,
            IsValid = isWithinRadius,
            Location = vehicleLocation,
            DistanceMeters = distance,
            AllowedRadiusMeters = allowedRadius,
            Reason = reason,
            GPSValidationStatus = locationValidation.ValidationStatus
        };
    }

    /// <summary>
    /// Creates a notification for administrators when a vehicle's GPS device is stale (>1 month inactive).
    /// Also creates a device issue record.
    /// </summary>
    private async Task CreateStaleDeviceNotificationAsync(
        int vehicleId,
        string vehicleName,
        DateTime? lastActivity,
        CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogWarning(
                "[LocationValidation] Creating stale GPS device notification for Vehicle {VehicleId} ({VehicleName}). Last activity: {LastActivity}",
                vehicleId, vehicleName, lastActivity);

            // TODO: Inject INotificationService and create notification
            // For now, just log the issue. The notification service injection should be added.

            // Resolve a valid system user ID from the database for FK fields
            var systemUserId = await _context.Users
                .AsNoTracking()
                .Where(u => u.UserName == "system" || u.UserName == "admin")
                .Select(u => u.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (string.IsNullOrEmpty(systemUserId))
            {
                systemUserId = await _context.Users
                    .AsNoTracking()
                    .Select(u => u.Id)
                    .FirstOrDefaultAsync(cancellationToken);
            }

            if (string.IsNullOrEmpty(systemUserId))
            {
                _logger.LogError("[LocationValidation] No users found in database. Cannot create stale device issue.");
                return;
            }

            // Create issue tracker record for device offline
            var issue = new Issuetracker
            {
                ProblemTitle = $"GPS Device Offline - Vehicle {vehicleName}",
                ProblemDescription = $"The GPS device for vehicle {vehicleName} (ID: {vehicleId}) has not reported " +
                    $"for over 30 days. Last activity was {(lastActivity.HasValue ? lastActivity.Value.ToString("g") : "unknown")}. " +
                    "Vehicle cannot receive fuel until this is resolved.",
                IssueCategoryId = 1, // GPS category
                Priority = 1, // High priority
                Status = 1, // Open
                VehicleId = vehicleId,
                SiteId = 1, // Default site
                OpenDate = DateTime.UtcNow,
                Openby = systemUserId,
                AssignTo = systemUserId
            };

            _context.Issuetrackers.Add(issue);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "[LocationValidation] Created issue tracker #{IssueId} for stale GPS device on vehicle {VehicleId}",
                issue.Id, vehicleId);
        }
        catch (Exception ex)
        {
            // Don't fail the validation if notification creation fails
            _logger.LogError(ex,
                "[LocationValidation] Failed to create stale device notification for vehicle {VehicleId}",
                vehicleId);
        }
    }

    private Task<ProximityCheckResult> CheckMobileProximityAsync(
        GeoLocation? mobileLocation,
        GeoLocation tankLocation,
        int allowedRadius,
        int gracePeriodMeters,
        int minimumGPSAccuracy,
        bool bypassOnFailure,
        CancellationToken cancellationToken)
    {
        // Allow cached location from mobile app when offline (per user requirement)
        if (mobileLocation == null || !mobileLocation.IsValid)
        {
            return Task.FromResult(new ProximityCheckResult
            {
                WasRequired = true,
                IsValid = bypassOnFailure,
                WasBypassedDueToGPSFailure = bypassOnFailure,
                Reason = bypassOnFailure ? "Mobile location not provided - bypassed" : "Mobile location not provided"
            });
        }

        // Check GPS accuracy against threshold
        bool hasAccuracyIssue = false;
        if (mobileLocation.Accuracy.HasValue && mobileLocation.Accuracy > minimumGPSAccuracy)
        {
            _logger.LogWarning("Mobile GPS accuracy {Accuracy}m exceeds threshold {Threshold}m",
                mobileLocation.Accuracy, minimumGPSAccuracy);
            hasAccuracyIssue = true;
        }

        // Log if using cached location
        if (mobileLocation.IsCached)
        {
            _logger.LogDebug("Using cached mobile location (offline mode allowed)");
        }

        // Calculate distance
        var distance = CalculateDistanceMeters(mobileLocation, tankLocation);

        // Apply grace period tolerance
        int effectiveRadius = allowedRadius + gracePeriodMeters;
        var isWithinRadius = distance <= effectiveRadius;

        string? reason = null;
        if (!isWithinRadius)
        {
            reason = $"Mobile device is {FormatDistance(distance)} away, must be within {allowedRadius}m (with {gracePeriodMeters}m tolerance)";
            if (hasAccuracyIssue)
            {
                reason += $" (Note: GPS accuracy was {mobileLocation.Accuracy}m)";
            }
        }
        else if (distance > allowedRadius && distance <= effectiveRadius)
        {
            _logger.LogDebug("Mobile device is {Distance}m away - within grace period ({Radius}m + {Grace}m tolerance)",
                distance, allowedRadius, gracePeriodMeters);
        }

        return Task.FromResult(new ProximityCheckResult
        {
            WasRequired = true,
            IsValid = isWithinRadius,
            Location = mobileLocation,
            DistanceMeters = distance,
            AllowedRadiusMeters = allowedRadius,
            Reason = reason
        });
    }

    /// <inheritdoc />
    public async Task<bool> CheckVehicleHasGPSAsync(int vehicleId, CancellationToken cancellationToken)
    {
        return await VehicleHasGPSAsync(vehicleId, cancellationToken);
    }

    private async Task<bool> VehicleHasGPSAsync(int vehicleId, CancellationToken cancellationToken)
    {
        // First check the Vehicle entity's HasGPSInstalled field (primary source of truth)
        var vehicle = await _context.Vehicles
            .AsNoTracking()
            .Where(v => v.VehicleId == vehicleId)
            .Select(v => new { v.VehicleId, v.HasGPSInstalled })
            .FirstOrDefaultAsync(cancellationToken);

        if (vehicle == null)
        {
            _logger.LogWarning("[VehicleHasGPS] Vehicle {VehicleId} not found", vehicleId);
            return false;
        }

        // HasGPSInstalled = 1 means GPS is installed
        if (vehicle.HasGPSInstalled != 1)
        {
            _logger.LogDebug("[VehicleHasGPS] Vehicle {VehicleId} has HasGPSInstalled = {Value} (GPS not installed)",
                vehicleId, vehicle.HasGPSInstalled);
            return false;
        }

        // Additionally verify there's an active provider mapping (for actual GPS tracking)
        var hasActiveMapping = await _context.Set<VehicleProviderMappingEntity>()
            .AsNoTracking()
            .AnyAsync(m => m.VehicleId == vehicleId && m.IsActive, cancellationToken);

        if (!hasActiveMapping)
        {
            _logger.LogDebug("[VehicleHasGPS] Vehicle {VehicleId} has HasGPSInstalled=1 but no active provider mapping",
                vehicleId);
        }

        return true; // HasGPSInstalled=1 is the primary indicator
    }

    private static double DegreesToRadians(double degrees) => degrees * (Math.PI / 180);

    #endregion

    #region Mobile Location Validation

    /// <inheritdoc />
    public async Task<MobileLocationValidationSettings> GetMobileLocationSettingsAsync(
        CancellationToken cancellationToken = default)
    {
        // Load settings from system configuration
        var requireMobileStr = await _systemConfigService.GetConfigurationValueAsync(
            CONFIG_KEY_REQUIRE_MOBILE_LOCATION, cancellationToken);
        var maxAgeStr = await _systemConfigService.GetConfigurationValueAsync(
            CONFIG_KEY_MAX_MOBILE_LOCATION_AGE_SECONDS, cancellationToken);
        var maxAccuracyStr = await _systemConfigService.GetConfigurationValueAsync(
            CONFIG_KEY_MAX_MOBILE_LOCATION_ACCURACY_METERS, cancellationToken);
        var rejectCachedStr = await _systemConfigService.GetConfigurationValueAsync(
            CONFIG_KEY_REJECT_CACHED_MOBILE_LOCATION, cancellationToken);

        // Also check if operator geofence is required (implies mobile location is required)
        var requireOperatorStr = await _systemConfigService.GetConfigurationValueAsync(
            CONFIG_KEY_REQUIRE_OPERATOR_IN_GEOFENCE, cancellationToken);
        var requireOperatorInGeofence = bool.TryParse(requireOperatorStr, out var opSetting) && opSetting;

        // Parse settings with defaults
        var requireMobileLocation = !string.IsNullOrEmpty(requireMobileStr)
            ? (bool.TryParse(requireMobileStr, out var reqMobile) && reqMobile)
            : requireOperatorInGeofence; // Default to true if operator geofence is required

        var maxAgeSeconds = int.TryParse(maxAgeStr, out var age) ? age : 60; // Default 60 seconds
        var maxAccuracyMeters = int.TryParse(maxAccuracyStr, out var acc) ? acc : 500; // Default 500 meters
        var rejectCached = !bool.TryParse(rejectCachedStr, out var reject) || reject; // Default true

        var settings = new MobileLocationValidationSettings
        {
            RequireMobileLocation = requireMobileLocation,
            MaxLocationAgeSeconds = maxAgeSeconds,
            MaxLocationAccuracyMeters = maxAccuracyMeters,
            RejectCachedLocation = rejectCached
        };

        _logger.LogDebug("[MobileLocation] Settings loaded: RequireMobile={Require}, MaxAge={MaxAge}s, MaxAccuracy={MaxAcc}m, RejectCached={RejectCached}",
            settings.RequireMobileLocation, settings.MaxLocationAgeSeconds,
            settings.MaxLocationAccuracyMeters, settings.RejectCachedLocation);

        return settings;
    }

    #endregion

    #region Audit Logging

    /// <inheritdoc />
    public async Task LogValidationAuditAsync(
        LocationValidationRequest request,
        LocationValidationResult result,
        string ptsId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Get tank type for audit log
            var tank = await _context.Tanks
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == request.TankId, cancellationToken);

            var auditLog = new LocationValidationLog
            {
                ValidationTime = DateTime.UtcNow,
                PtsId = ptsId,
                TankId = request.TankId,
                VehicleId = request.VehicleId,
                TankType = tank?.TankType ?? TankType.Stationary,

                // Tank location
                TankLatitude = result.TankLocation?.Latitude,
                TankLongitude = result.TankLocation?.Longitude,
                TankLocationSource = result.TankLocationSource,

                // Vehicle location
                VehicleLatitude = result.VehicleProximity?.Location?.Latitude,
                VehicleLongitude = result.VehicleProximity?.Location?.Longitude,
                VehicleGPSAccuracy = result.VehicleProximity?.Location?.Accuracy,
                VehicleDistanceMeters = result.VehicleProximity?.DistanceMeters != null
                    ? (decimal)result.VehicleProximity.DistanceMeters
                    : null,
                VehicleProximityRequired = result.VehicleProximity?.WasRequired ?? false,
                VehicleProximityValid = result.VehicleProximity?.IsValid,

                // Mobile location
                MobileLatitude = result.MobileProximity?.Location?.Latitude,
                MobileLongitude = result.MobileProximity?.Location?.Longitude,
                MobileAccuracy = result.MobileProximity?.Location?.Accuracy,
                MobileDistanceMeters = result.MobileProximity?.DistanceMeters != null
                    ? (decimal)result.MobileProximity.DistanceMeters
                    : null,
                MobileProximityRequired = result.MobileProximity?.WasRequired ?? false,
                MobileProximityValid = result.MobileProximity?.IsValid,

                // Validation result
                IsValid = result.IsValid,
                ValidationResult = result.Outcome.ToString(),
                FailureReason = result.FailureReason,

                // Settings used
                VehicleRadiusUsed = result.VehicleProximity?.AllowedRadiusMeters,
                MobileRadiusUsed = result.MobileProximity?.AllowedRadiusMeters,
                WasBypassedDueToGPSFailure = result.WasBypassedDueToGPSFailure,

                // Context
                UserId = request.UserId,
                TransactionId = request.TransactionId
            };

            _context.LocationValidationLogs.Add(auditLog);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogDebug("Logged location validation audit: {Result} for Tank {TankId}",
                result.Outcome, request.TankId);
        }
        catch (Exception ex)
        {
            // Don't fail the validation if audit logging fails
            _logger.LogError(ex, "Failed to log location validation audit for Tank {TankId}", request.TankId);
        }
    }

    /// <inheritdoc />
    public async Task<bool> UpdateTransactionIdAsync(
        string ptsId,
        int tankId,
        int? vehicleId,
        int transactionId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Find the most recent LocationValidationLog for this context within the last 5 minutes
            // that doesn't already have a TransactionId
            // ENHANCED: More flexible matching - if vehicleId is null, match any log for this PTS/Tank
            var cutoffTime = DateTime.UtcNow.AddMinutes(-5);

            // First try exact match including VehicleId
            var logEntry = await _context.LocationValidationLogs
                .Where(l => l.PtsId == ptsId &&
                            l.TankId == tankId &&
                            l.VehicleId == vehicleId &&
                            l.ValidationTime >= cutoffTime &&
                            l.TransactionId == null)
                .OrderByDescending(l => l.ValidationTime)
                .FirstOrDefaultAsync(cancellationToken);

            // If no exact match and vehicleId was specified, try without vehicleId constraint
            // This handles cases where location was validated before vehicle was selected
            if (logEntry == null)
            {
                logEntry = await _context.LocationValidationLogs
                    .Where(l => l.PtsId == ptsId &&
                                l.TankId == tankId &&
                                l.ValidationTime >= cutoffTime &&
                                l.TransactionId == null)
                    .OrderByDescending(l => l.ValidationTime)
                    .FirstOrDefaultAsync(cancellationToken);

                if (logEntry != null)
                {
                    _logger.LogDebug("Found LocationValidationLog by relaxed match (no vehicle constraint) for PTS {PtsId}, Tank {TankId}",
                        ptsId, tankId);
                }
            }

            if (logEntry == null)
            {
                _logger.LogDebug("No pending LocationValidationLog found for PTS {PtsId}, Tank {TankId}, Vehicle {VehicleId}",
                    ptsId, tankId, vehicleId);
                return false;
            }

            logEntry.TransactionId = transactionId;
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogDebug("Updated LocationValidationLog {LogId} with TransactionId {TransactionId}",
                logEntry.Id, transactionId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update TransactionId for LocationValidationLog - PTS {PtsId}, Tank {TankId}",
                ptsId, tankId);
            return false;
        }
    }

    #endregion

    #region Debug Logging

    /// <summary>
    /// Logs distance debug information even when validation is disabled.
    /// This helps operators understand what would happen if validation were enabled.
    /// </summary>
    private async Task LogDistanceDebugInfoAsync(
        LocationValidationRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogDebug("📍 [LocationDebug] ========== DISTANCE DEBUG INFO (Validation Disabled) ==========");

            // Get tank location
            var (tankLocation, tankSource) = await GetTankLocationAsync(request.TankId, cancellationToken);

            if (tankLocation == null || !tankLocation.IsValid)
            {
                _logger.LogWarning("📍 [LocationDebug] ❌ Tank {TankId} has no valid location configured", request.TankId);
                return;
            }

            _logger.LogDebug("📍 [LocationDebug] 🏭 TANK {TankId} Location: ({Lat:F6}, {Lng:F6}) - Source: {Source}",
                request.TankId, tankLocation.Latitude, tankLocation.Longitude, tankSource);

            // Calculate vehicle distance if VehicleId provided
            if (request.VehicleId.HasValue)
            {
                var vehicleLocation = await GetVehicleLocationAsync(request.VehicleId.Value, cancellationToken);

                if (vehicleLocation != null && vehicleLocation.IsValid)
                {
                    var vehicleDistance = CalculateDistanceMeters(vehicleLocation, tankLocation);

                    _logger.LogDebug("📍 [LocationDebug] 🚗 VEHICLE {VehicleId} Location: ({Lat:F6}, {Lng:F6})",
                        request.VehicleId, vehicleLocation.Latitude, vehicleLocation.Longitude);
                    _logger.LogDebug("📍 [LocationDebug] 🚗 VEHICLE -> TANK Distance: {Distance:F1} meters",
                        vehicleDistance);

                    // Get PTS device settings for context
                    var ptsDevice = await GetPtsDeviceForTankAsync(request.TankId, request.PtsId, cancellationToken);
                    if (ptsDevice != null)
                    {
                        var vehicleRadius = ptsDevice.VehicleProximityRadius ?? 100;
                        var gracePeriod = ptsDevice.ProximityGracePeriodMeters ?? 10;
                        var effectiveRadius = vehicleRadius + gracePeriod;

                        var wouldPass = vehicleDistance <= effectiveRadius;
                        var status = wouldPass ? "✅ WOULD PASS" : "❌ WOULD FAIL";

                        _logger.LogDebug("📍 [LocationDebug] 🚗 VEHICLE Proximity Check: {Status} (Distance: {Distance:F1}m, Allowed: {Radius}m + {Grace}m grace = {Effective}m)",
                            status, vehicleDistance, vehicleRadius, gracePeriod, effectiveRadius);
                    }
                }
                else
                {
                    _logger.LogWarning("📍 [LocationDebug] 🚗 VEHICLE {VehicleId} - No GPS location available", request.VehicleId);
                }
            }
            else
            {
                _logger.LogDebug("📍 [LocationDebug] 🚗 No VehicleId provided - skipping vehicle distance calculation");
            }

            // Calculate mobile distance if provided
            if (request.MobileAppLocation != null && request.MobileAppLocation.IsValid)
            {
                var mobileDistance = CalculateDistanceMeters(request.MobileAppLocation, tankLocation);

                _logger.LogDebug("📍 [LocationDebug] 📱 MOBILE Location: ({Lat:F6}, {Lng:F6}), Accuracy: {Accuracy}m, IsCached: {IsCached}",
                    request.MobileAppLocation.Latitude, request.MobileAppLocation.Longitude,
                    request.MobileAppLocation.Accuracy, request.MobileAppLocation.IsCached);
                _logger.LogDebug("📍 [LocationDebug] 📱 MOBILE -> TANK Distance: {Distance:F1} meters",
                    mobileDistance);

                // Get PTS device settings for context
                var ptsDevice = await GetPtsDeviceForTankAsync(request.TankId, request.PtsId, cancellationToken);
                if (ptsDevice != null)
                {
                    var mobileRadius = ptsDevice.MobileAppProximityRadius ?? 50;
                    var gracePeriod = ptsDevice.ProximityGracePeriodMeters ?? 10;
                    var effectiveRadius = mobileRadius + gracePeriod;

                    var wouldPass = mobileDistance <= effectiveRadius;
                    var status = wouldPass ? "✅ WOULD PASS" : "❌ WOULD FAIL";

                    _logger.LogDebug("📍 [LocationDebug] 📱 MOBILE Proximity Check: {Status} (Distance: {Distance:F1}m, Allowed: {Radius}m + {Grace}m grace = {Effective}m)",
                        status, mobileDistance, mobileRadius, gracePeriod, effectiveRadius);
                }
            }
            else
            {
                _logger.LogDebug("📍 [LocationDebug] 📱 No mobile location provided");
            }

            _logger.LogDebug("📍 [LocationDebug] ================================================================");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "📍 [LocationDebug] Error calculating debug distances");
        }
    }

    #endregion

    #region Temporary Bypass

    /// <summary>
    /// Result of checking temporary bypass status
    /// </summary>
    private record TemporaryBypassCheckResult(bool IsActive, DateTime? ExpiresAt, string? Reason);

    /// <summary>
    /// Checks if a temporary location validation bypass is currently active.
    /// Temporary bypasses are used for offline vehicles, poor GPS conditions, or emergency situations.
    /// </summary>
    private async Task<TemporaryBypassCheckResult> CheckTemporaryBypassAsync(CancellationToken cancellationToken)
    {
        try
        {
            // Check if temporary bypass is active
            var isActiveValue = await _systemConfigService.GetConfigurationValueAsync(
                CONFIG_KEY_TEMPORARY_BYPASS_ACTIVE, cancellationToken);

            if (!string.Equals(isActiveValue, "true", StringComparison.OrdinalIgnoreCase))
            {
                return new TemporaryBypassCheckResult(false, null, null);
            }

            // Check if bypass has expired (empty string means permanent bypass)
            var expiresAtValue = await _systemConfigService.GetConfigurationValueAsync(
                CONFIG_KEY_TEMPORARY_BYPASS_EXPIRES, cancellationToken);

            // Handle permanent bypass (no expiration)
            if (string.IsNullOrEmpty(expiresAtValue))
            {
                _logger.LogInformation("[LocationValidation] System-wide PERMANENT bypass is active");
                var permanentReason = await _context.SystemConfigurations
                    .AsNoTracking()
                    .Where(c => c.ConfigurationKey == SystemConfiguration.DB_CONFIG_FUELING_RULES_TEMPORARY_BYPASS_REASON_KEY)
                    .Select(c => c.ConfigurationValue)
                    .FirstOrDefaultAsync(cancellationToken);
                return new TemporaryBypassCheckResult(true, null, permanentReason ?? "Permanent bypass");
            }

            if (!DateTime.TryParse(expiresAtValue, out var expiresAt))
            {
                _logger.LogWarning("[LocationValidation] Temporary bypass has invalid expiration time: {Value}", expiresAtValue);
                return new TemporaryBypassCheckResult(false, null, null);
            }

            // Check if expired
            if (expiresAt <= DateTime.UtcNow)
            {
                _logger.LogInformation("[LocationValidation] Temporary bypass has expired at {ExpiresAt}", expiresAt);
                return new TemporaryBypassCheckResult(false, expiresAt, null);
            }

            // Get the reason if available
            var reason = await _context.SystemConfigurations
                .AsNoTracking()
                .Where(c => c.ConfigurationKey == SystemConfiguration.DB_CONFIG_FUELING_RULES_TEMPORARY_BYPASS_REASON_KEY)
                .Select(c => c.ConfigurationValue)
                .FirstOrDefaultAsync(cancellationToken);

            return new TemporaryBypassCheckResult(true, expiresAt, reason);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "[LocationValidation] CRITICAL: Error checking temporary bypass status. " +
                "Re-throwing to prevent unsafe fuel authorization.");
            // SECURITY FIX: Re-throw exception so outer handler can properly fail the validation
            // Previously this returned (false, null, null) which masked DB errors and allowed fuel to flow
            throw;
        }
    }

    /// <summary>
    /// Checks if a specific vehicle has an active bypass.
    /// </summary>
    private async Task<TemporaryBypassCheckResult> CheckVehicleBypassAsync(
        int vehicleId,
        CancellationToken cancellationToken)
    {
        try
        {
            var now = DateTime.UtcNow;
            var bypass = await _context.LocationValidationBypasses
                .AsNoTracking()
                .Where(b => b.BypassType == Domain.Entities.Features.LocationValidation.BypassType.Vehicle &&
                            b.VehicleId == vehicleId &&
                            b.IsActive &&
                            b.CancelledAt == null &&
                            (b.ExpiresAt == null || b.ExpiresAt > now))
                .FirstOrDefaultAsync(cancellationToken);

            if (bypass != null)
            {
                _logger.LogInformation(
                    "[LocationValidation] VEHICLE-SPECIFIC bypass active for Vehicle {VehicleId}. Reason: {Reason}. Expires: {ExpiresAt}",
                    vehicleId, bypass.Reason ?? "Not specified", bypass.ExpiresAt?.ToString() ?? "Never");

                return new TemporaryBypassCheckResult(true, bypass.ExpiresAt, bypass.Reason);
            }

            return new TemporaryBypassCheckResult(false, null, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "[LocationValidation] CRITICAL: Error checking vehicle bypass for {VehicleId}. " +
                "Re-throwing to prevent unsafe fuel authorization.", vehicleId);
            // SECURITY FIX: Re-throw exception so outer handler can properly fail the validation
            // Previously this returned (false, null, null) which masked DB errors and allowed fuel to flow
            throw;
        }
    }

    /// <summary>
    /// Checks if a specific user has an active bypass.
    /// </summary>
    private async Task<TemporaryBypassCheckResult> CheckUserSpecificBypassAsync(
        string userId,
        CancellationToken cancellationToken)
    {
        try
        {
            var now = DateTime.UtcNow;
            var bypass = await _context.LocationValidationBypasses
                .AsNoTracking()
                .Where(b => b.BypassType == Domain.Entities.Features.LocationValidation.BypassType.User &&
                            b.UserId == userId &&
                            b.IsActive &&
                            b.CancelledAt == null &&
                            (b.ExpiresAt == null || b.ExpiresAt > now))
                .FirstOrDefaultAsync(cancellationToken);

            if (bypass != null)
            {
                _logger.LogInformation(
                    "[LocationValidation] USER-SPECIFIC bypass active for User {UserId}. Reason: {Reason}. Expires: {ExpiresAt}",
                    userId, bypass.Reason ?? "Not specified", bypass.ExpiresAt?.ToString() ?? "Never");

                return new TemporaryBypassCheckResult(true, bypass.ExpiresAt, bypass.Reason);
            }

            return new TemporaryBypassCheckResult(false, null, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "[LocationValidation] CRITICAL: Error checking user bypass for {UserId}. " +
                "Re-throwing to prevent unsafe fuel authorization.", userId);
            // SECURITY FIX: Re-throw exception so outer handler can properly fail the validation
            // Previously this returned (false, null, null) which masked DB errors and allowed fuel to flow
            throw;
        }
    }

    #endregion
}
