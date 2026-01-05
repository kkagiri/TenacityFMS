using FMS.Application.Features.LocationValidation.DTOs;
using FMS.Application.Features.Vehicle.Services;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Enums;
using FMS.Domain.Entities.Features.LocationValidation;
using FMS.Domain.Entities.VehicleTracking;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.LocationValidation.Services;

/// <summary>
/// Implementation of location validation service for fueling operations.
/// Validates proximity between vehicles, mobile devices, and tanks/dispensers.
/// </summary>
public class LocationValidationService : ILocationValidationService
{
    private readonly GpsdataContext _context;
    private readonly IGPSService _gpsService;
    private readonly ILogger<LocationValidationService> _logger;

    // Earth radius in meters for Haversine formula
    private const double EarthRadiusMeters = 6371000;

    public LocationValidationService(
        GpsdataContext context,
        IGPSService gpsService,
        ILogger<LocationValidationService> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _gpsService = gpsService ?? throw new ArgumentNullException(nameof(gpsService));
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

            // Step 1: Get PTS device settings
            ptsDevice = await GetPtsDeviceForTankAsync(request.TankId, request.PtsId, cancellationToken);

            if (ptsDevice == null)
            {
                _logger.LogWarning("PTS device not found for tank {TankId}", request.TankId);
                result = LocationValidationResult.Skipped("PTS device not found");
                return result;
            }

            // Step 2: Check if location validation is enabled
            if (ptsDevice.EnableLocationValidation == 0)
            {
                _logger.LogDebug("Location validation not enabled for PTS {PtsId}", ptsDevice.Ptsid);
                result = LocationValidationResult.Skipped("Location validation not enabled for this device");
                return result;
            }

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

            // Step 4: Perform proximity checks
            ProximityCheckResult? vehicleProximity = null;
            ProximityCheckResult? mobileProximity = null;

            // Vehicle proximity check
            if (ptsDevice.RequireVehicleProximity == 1 && request.VehicleId.HasValue)
            {
                vehicleProximity = await CheckVehicleProximityAsync(
                    request.VehicleId.Value,
                    tankLocation,
                    ptsDevice.VehicleProximityRadius ?? 100,
                    gracePeriodMeters,
                    minimumGPSAccuracy,
                    ptsDevice.BypassOnGPSFailure == 1,
                    cancellationToken);

                if (vehicleProximity.WasRequired && !vehicleProximity.IsValid && ptsDevice.BypassOnGPSFailure != 1)
                {
                    result = LocationValidationResult.Failed(
                        vehicleProximity.Reason ?? "Vehicle not within required proximity",
                        tankLocation,
                        vehicleProximity,
                        null);
                    await LogValidationAuditAsync(request, result, ptsDevice.Ptsid, cancellationToken);
                    return result;
                }
            }

            // Mobile app proximity check
            if (ptsDevice.RequireMobileAppProximity == 1)
            {
                mobileProximity = await CheckMobileProximityAsync(
                    request.MobileAppLocation,
                    tankLocation,
                    ptsDevice.MobileAppProximityRadius ?? 50,
                    gracePeriodMeters,
                    minimumGPSAccuracy,
                    ptsDevice.BypassOnGPSFailure == 1,
                    cancellationToken);

                if (mobileProximity.WasRequired && !mobileProximity.IsValid && ptsDevice.BypassOnGPSFailure != 1)
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

            // All checks passed
            _logger.LogInformation(
                "Location validation passed for Tank {TankId}, Vehicle {VehicleId}. " +
                "Vehicle distance: {VehicleDistance}m, Mobile distance: {MobileDistance}m",
                request.TankId,
                request.VehicleId,
                vehicleProximity?.DistanceMeters,
                mobileProximity?.DistanceMeters);

            // Check if any validation was bypassed
            bool wasBypassed = (vehicleProximity?.Reason?.Contains("bypassed", StringComparison.OrdinalIgnoreCase) ?? false) ||
                               (mobileProximity?.Reason?.Contains("bypassed", StringComparison.OrdinalIgnoreCase) ?? false);

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
                Timestamp = dto.LastUpdated
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting GPS location for vehicle {VehicleId}", vehicleId);
            return null;
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
        // Check if vehicle has GPS
        var vehicle = await _context.Vehicles
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.VehicleId == vehicleId, cancellationToken);

        if (vehicle == null)
        {
            return new ProximityCheckResult
            {
                WasRequired = true,
                IsValid = bypassOnFailure,
                Reason = bypassOnFailure ? "Vehicle not found - bypassed" : "Vehicle not found"
            };
        }

        // Get vehicle location
        var vehicleLocation = await GetVehicleLocationAsync(vehicleId, cancellationToken);

        if (vehicleLocation == null || !vehicleLocation.IsValid)
        {
            // Check if vehicle even has GPS tracking
            var hasGPS = await VehicleHasGPSAsync(vehicleId, cancellationToken);

            if (!hasGPS)
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
                Reason = bypassOnFailure ? "Vehicle GPS unavailable - bypassed" : "Vehicle GPS unavailable"
            };
        }

        // Check GPS accuracy first (per user requirement)
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
            reason = $"Vehicle is {distance:F0}m away, must be within {allowedRadius}m (with {gracePeriodMeters}m tolerance)";
        }
        else if (distance > allowedRadius && distance <= effectiveRadius)
        {
            // Within grace period - log info
            _logger.LogInformation("Vehicle {VehicleId} is {Distance}m away - within grace period ({Radius}m + {Grace}m tolerance)",
                vehicleId, distance, allowedRadius, gracePeriodMeters);
        }

        return new ProximityCheckResult
        {
            WasRequired = true,
            IsValid = isWithinRadius,
            Location = vehicleLocation,
            DistanceMeters = distance,
            AllowedRadiusMeters = allowedRadius,
            Reason = reason
        };
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
            _logger.LogInformation("Using cached mobile location (offline mode allowed)");
        }

        // Calculate distance
        var distance = CalculateDistanceMeters(mobileLocation, tankLocation);

        // Apply grace period tolerance
        int effectiveRadius = allowedRadius + gracePeriodMeters;
        var isWithinRadius = distance <= effectiveRadius;

        string? reason = null;
        if (!isWithinRadius)
        {
            reason = $"Mobile device is {distance:F0}m away, must be within {allowedRadius}m (with {gracePeriodMeters}m tolerance)";
            if (hasAccuracyIssue)
            {
                reason += $" (Note: GPS accuracy was {mobileLocation.Accuracy}m)";
            }
        }
        else if (distance > allowedRadius && distance <= effectiveRadius)
        {
            _logger.LogInformation("Mobile device is {Distance}m away - within grace period ({Radius}m + {Grace}m tolerance)",
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

    private async Task<bool> VehicleHasGPSAsync(int vehicleId, CancellationToken cancellationToken)
    {
        // Check if vehicle has GPS mapping in provider_mappings
        var hasMapping = await _context.Set<VehicleProviderMappingEntity>()
            .AsNoTracking()
            .AnyAsync(m => m.VehicleId == vehicleId && m.IsActive, cancellationToken);

        return hasMapping;
    }

    private static double DegreesToRadians(double degrees) => degrees * (Math.PI / 180);

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

    #endregion
}
