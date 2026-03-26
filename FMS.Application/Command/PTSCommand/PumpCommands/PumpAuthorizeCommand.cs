//
// File: PumpAuthorizeCommand.cs
// Purpose: Handles pump authorization workflow and returns standardized FMSResponse with proper ErrorType mapping
// Dependencies: FMSResponse<T>, PTSDeviceException, logging, Redis, device monitoring services
// Last Modified: 2025-01-06
//
// Key Sections:
// - Command record with authorization parameters
// - Handler orchestrating validation, pre-checks, and authorization
//
// REFACTORED: Logic extracted to separate services:
// - IPumpAuthorizationValidator: Request validation
// - IPumpAuthorizationPreCheckService: Nozzle state, stuck transactions, location validation
// - ITransactionContextService: Redis transaction context storage
// - IFuelPriceService: Fuel grade price retrieval
// - IPumpAuthorizationLoggingService: Debug logging
// - IDeviceConnectionTypeService: Connection type determination

/// <summary>
/// Handles pump authorization requests from the frontend/UI. Validates the request, checks and sets authorization state using AuthorizationStateTracker,
/// and calls the pump service to authorize the pump. This is the main entry point for UI-driven fueling operations.
///
/// TRANSACTION ID STRATEGY: This handler lets PTS devices generate their own transaction IDs instead of generating them locally.
/// This prevents transaction ID conflicts, out-of-range errors, and ensures unique IDs across application restarts.
/// The PTS device maintains its own transaction counter and returns the assigned ID in the PumpAuthorizeConfirmation.
/// </summary>
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.CommonInterface;
using FMS.Application.Features.LocationValidation.DTOs;
using FMS.Application.Features.PTS.Services;
using FMS.Application.Helpers;
using FMS.Application.Infrastructure.DistCacheTracker;
using FMS.Application.Infrastructure.Expections.Base;
using FMS.Application.PTSServices.PumpService;
using FMS.Application.Services;
using FMS.Application.Services.Configuration;
using FMS.Application.Validation.PTSValidators.PumpAuthorization;
using FMS.Domain.Entities.PTS;
using FMS.Domain.Entities.PTS.Enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.PTSCommand.PumpCommands
{
    /// <summary>
    /// Command for authorizing a pump to dispense fuel.
    /// </summary>
    public record PumpAuthorizeCommand : IRequest<FMSResponse<PumpAuthorizeConfirmation>>
    {
        public string? DeviceId { get; set; }
        public int PumpId { get; set; } = 0;
        public double? Dose { get; set; }
        public NozzleOrFuelIdSelector NozzleOrFuelIdSelector { get; set; }
        public int Nozzle { get; set; } = 0;
        public List<int>? Nozzles { get; set; }
        public int? FuelGradeId { get; set; }
        public bool PriceEnabled { get; set; }
        public PumpAuthorizeType Type { get; set; }
        /// <summary>
        /// Whether to auto-close and save the transaction when fueling completes.
        /// DEFAULTS TO TRUE to ensure transactions are automatically saved to the database.
        /// Set to false only for special cases where manual completion is required.
        /// </summary>
        public bool AutoCloseTransaction { get; set; } = true;
        public string? Tag { get; set; }
        public int? TankId { get; set; }
        public int? VehicleId { get; set; }

        /// <summary>
        /// User ID from controller for auto-assign master tag feature.
        /// </summary>
        public string? UserId { get; set; }

        /// <summary>
        /// Vehicle odometer reading at time of fueling (in kilometers or miles).
        /// </summary>
        public decimal? Odometer { get; set; }

        /// <summary>
        /// Mobile app operator's current location for proximity validation.
        /// Required when PTS device has RequireMobileAppProximity enabled.
        /// </summary>
        public GeoLocation? MobileLocation { get; set; }

        /// <summary>
        /// Employee/Driver ID who is performing the fueling.
        /// Selected from mobile app during authorization flow.
        /// </summary>
        public int? EmployeeId { get; set; }
    }

    /// <summary>
    /// Handler for pump authorization requests.
    /// Orchestrates validation, pre-checks, and pump authorization through dedicated services.
    /// </summary>
    public class PumpAuthorizeCommandHandler : IRequestHandler<PumpAuthorizeCommand, FMSResponse<PumpAuthorizeConfirmation>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<PumpAuthorizeCommandHandler> _logger;
        private readonly IAuthorizationStateTracker _authTracker;
        private readonly IPumpService _pumpService;
        private readonly ITransactionMonitoringService _transactionMonitoringService;
        private readonly ISystemConfigurationService _systemConfigService;
        private readonly Features.FuelTagManagement.FuelingRules.Services.IFuelingRuleEvaluationService _fuelingRuleService;

        // Refactored services
        private readonly IPumpAuthorizationValidator _validator;
        private readonly IPumpAuthorizationPreCheckService _preCheckService;
        private readonly ITransactionContextService _transactionContextService;
        private readonly IFuelPriceService _fuelPriceService;
        private readonly IPumpAuthorizationLoggingService _loggingService;
        private readonly IDeviceConnectionTypeService _connectionTypeService;
        private readonly Features.LocationValidation.Services.ILocationValidationService _locationValidationService;
        private readonly Features.Vehicle.Services.IGPSService? _gpsService;
        private readonly IGPSGateDriverNameService? _driverNameService;
        private readonly Features.Vehicle.Services.IVehicleGpsOfflineAlertService? _gpsOfflineAlertService;

        public PumpAuthorizeCommandHandler(
            IAuthorizationStateTracker authstatetracker,
            GpsdataContext context,
            IPumpService pumpService,
            ITransactionMonitoringService transactionMonitoringService,
            ISystemConfigurationService systemConfigService,
            Features.FuelTagManagement.FuelingRules.Services.IFuelingRuleEvaluationService fuelingRuleService,
            IPumpAuthorizationValidator validator,
            IPumpAuthorizationPreCheckService preCheckService,
            ITransactionContextService transactionContextService,
            IFuelPriceService fuelPriceService,
            IPumpAuthorizationLoggingService loggingService,
            IDeviceConnectionTypeService connectionTypeService,
            Features.LocationValidation.Services.ILocationValidationService locationValidationService,
            ILogger<PumpAuthorizeCommandHandler> logger,
            Features.Vehicle.Services.IGPSService? gpsService = null,
            IGPSGateDriverNameService? driverNameService = null,
            Features.Vehicle.Services.IVehicleGpsOfflineAlertService? gpsOfflineAlertService = null)
        {
            _authTracker = authstatetracker;
            _context = context;
            _pumpService = pumpService;
            _transactionMonitoringService = transactionMonitoringService;
            _systemConfigService = systemConfigService;
            _fuelingRuleService = fuelingRuleService;
            _validator = validator;
            _preCheckService = preCheckService;
            _transactionContextService = transactionContextService;
            _fuelPriceService = fuelPriceService;
            _loggingService = loggingService;
            _connectionTypeService = connectionTypeService;
            _locationValidationService = locationValidationService;
            _logger = logger;
            _gpsService = gpsService;
            _driverNameService = driverNameService;
            _gpsOfflineAlertService = gpsOfflineAlertService;
        }

        public async Task<FMSResponse<PumpAuthorizeConfirmation>> Handle(PumpAuthorizeCommand request, CancellationToken cancellationToken)
        {
            try
            {
                // **STEP 0: DEBUG LOGGING**
                await _loggingService.LogAuthorizationRequestAsync(request, cancellationToken);

                // **STEP 1: NOZZLE STATE VALIDATION**
                var nozzleResult = await _preCheckService.ValidateNozzleStateAsync(
                    request.DeviceId!, request.PumpId, cancellationToken);

                if (!nozzleResult.IsSuccess)
                {
                    return FMSResponse<PumpAuthorizeConfirmation>.ValidationFailed(
                        new List<string> { nozzleResult.Message ?? "Unable to verify nozzle state" });
                }

                if (!nozzleResult.Data!.IsNozzleUp)
                {
                    return FMSResponse<PumpAuthorizeConfirmation>.ValidationFailed(
                        new List<string>
                        {
                            "⚠️ Nozzle must be lifted before starting fueling",
                            "Please lift the nozzle from the pump and try again",
                            $"Current status: {nozzleResult.Data.Message}"
                        });
                }

                // **STEP 2: STUCK TRANSACTION CHECK**
                var stuckTransaction = await _preCheckService.CheckForStuckTransactionAsync(
                    request.DeviceId!, request.PumpId);

                if (stuckTransaction != null)
                {
                    _logger.LogWarning("[PumpAuth] Stuck transaction detected - {TransactionId} on pump {PumpId}",
                        stuckTransaction.TransactionId, stuckTransaction.PumpId);

                    return FMSResponse<PumpAuthorizeConfirmation>.ValidationFailed(
                        new List<string>
                        {
                            $"Pump {request.PumpId} has a stuck transaction ({stuckTransaction.TransactionId}) that must be cleared first. Please contact support or use the emergency cleanup feature."
                        });
                }

                // **STEP 2.25: GLOBAL LOCATION VALIDATION TOGGLE**
                var globalLocationValidationEnabled = await _systemConfigService.GetConfigurationValueAsync(
                    "FuelingRules.EnableLocationValidation", cancellationToken);

                var isLocationValidationEnabled = !string.Equals(
                    globalLocationValidationEnabled, "false", StringComparison.OrdinalIgnoreCase);

                // **STEP 2.3: CHECK USER BYPASS BEFORE LOCATION VALIDATION**
                // If user has BypassLocationValidation enabled, skip all location-related checks
                bool userHasLocationBypass = false;
                if (!string.IsNullOrEmpty(request.UserId))
                {
                    var user = await _context.Users
                        .AsNoTracking()
                        .Where(u => u.Id == request.UserId)
                        .Select(u => new { u.BypassLocationValidation })
                        .FirstOrDefaultAsync(cancellationToken);

                    userHasLocationBypass = user?.BypassLocationValidation == true;

                    if (userHasLocationBypass)
                    {
                        _logger.LogInformation("[PumpAuth] User {UserId} has BypassLocationValidation enabled - skipping all location checks", request.UserId);
                    }
                }

                // Also check device-level bypass
                bool deviceHasLocationBypass = false;
                if (!string.IsNullOrEmpty(request.DeviceId))
                {
                    var ptsDeviceBypass = await _context.Ptsdevices
                        .AsNoTracking()
                        .Where(d => d.Ptsid == request.DeviceId)
                        .Select(d => new { d.BypassOnGPSFailure })
                        .FirstOrDefaultAsync(cancellationToken);

                    deviceHasLocationBypass = ptsDeviceBypass?.BypassOnGPSFailure == 1;

                    if (deviceHasLocationBypass)
                    {
                        _logger.LogInformation("[PumpAuth] Device {DeviceId} has BypassOnGPSFailure enabled - location validation will be relaxed", request.DeviceId);
                    }
                }

                // Skip location validation if user has bypass OR if location validation is globally disabled
                bool skipLocationValidation = userHasLocationBypass || !isLocationValidationEnabled;

                if (isLocationValidationEnabled && !skipLocationValidation)
                {
                    // **STEP 2.5: MOBILE LOCATION VALIDATION**
                    // Validate mobile location based on configurable settings
                    var mobileLocationSettings = await _locationValidationService.GetMobileLocationSettingsAsync(cancellationToken);

                    if (request.MobileLocation != null)
                    {
                        // Check 1: Reject cached locations if configured
                        if (mobileLocationSettings.RejectCachedLocation && request.MobileLocation.IsCached == true)
                        {
                            _logger.LogWarning("[PumpAuth] ⚠️ CACHED MOBILE LOCATION REJECTED - IsCached=true, RejectCachedLocation=true");

                            return FMSResponse<PumpAuthorizeConfirmation>.ValidationFailed(
                                new List<string>
                                {
                                    "⚠️ Cached location not allowed",
                                    "Please wait for a fresh GPS fix and try again",
                                    "Ensure location services are enabled on your device"
                                });
                        }

                        // Check 2: Validate location age (staleness)
                        if (request.MobileLocation.Timestamp != null)
                        {
                            var locationAge = DateTime.UtcNow - request.MobileLocation.Timestamp.Value;
                            if (locationAge.TotalSeconds > mobileLocationSettings.MaxLocationAgeSeconds)
                            {
                                _logger.LogWarning("[PumpAuth] ⚠️ STALE MOBILE LOCATION REJECTED - Location is {Age:F1} seconds old (max: {Max}s). Timestamp: {Timestamp}",
                                    locationAge.TotalSeconds, mobileLocationSettings.MaxLocationAgeSeconds, request.MobileLocation.Timestamp.Value);

                                return FMSResponse<PumpAuthorizeConfirmation>.ValidationFailed(
                                    new List<string>
                                    {
                                        "⚠️ Location data is too old",
                                        $"Your location was recorded {locationAge.TotalSeconds:F0} seconds ago (maximum allowed: {mobileLocationSettings.MaxLocationAgeSeconds} seconds)",
                                        "Please wait for a fresh GPS fix and try again"
                                    });
                            }
                            else
                            {
                                _logger.LogDebug("[PumpAuth] Mobile location age: {Age:F1} seconds (within {Max}s limit)",
                                    locationAge.TotalSeconds, mobileLocationSettings.MaxLocationAgeSeconds);
                            }
                        }
                        else
                        {
                            // No timestamp - this is a problem for validation
                            _logger.LogWarning("[PumpAuth] ⚠️ MOBILE LOCATION HAS NO TIMESTAMP - Cannot validate freshness");
                        }

                        // Check 3: Validate location accuracy
                        if (request.MobileLocation.Accuracy.HasValue &&
                            request.MobileLocation.Accuracy.Value > mobileLocationSettings.MaxLocationAccuracyMeters)
                        {
                            _logger.LogWarning("[PumpAuth] ⚠️ POOR MOBILE LOCATION ACCURACY - Accuracy is {Accuracy:F1}m (max: {Max}m)",
                                request.MobileLocation.Accuracy.Value, mobileLocationSettings.MaxLocationAccuracyMeters);

                            // This is a warning, not a rejection - accuracy can vary based on conditions
                            // Log but continue with the authorization
                        }
                    }
                    else if (mobileLocationSettings.RequireMobileLocation)
                    {
                        // Mobile location is required but not provided
                        _logger.LogWarning("[PumpAuth] ⚠️ MOBILE LOCATION REQUIRED BUT NOT PROVIDED");
                        // Note: We don't reject here because the geofence validation will handle this check
                        // This allows the system to be more flexible with bypass settings
                    }

                    // **STEP 3: LOCATION VALIDATION**
                    // CRITICAL FIX: Always attempt location validation if DeviceId is provided
                    // The LocationValidationService will check if the device requires location validation
                    // Get TankId from the nozzle/pump if not provided directly
                    int? effectiveTankId = request.TankId;

                    if (!effectiveTankId.HasValue && !string.IsNullOrEmpty(request.DeviceId))
                    {
                        // Try to get tank from device + pump configuration
                        var ptsDevice = await _context.Ptsdevices
                            .AsNoTracking()
                            .FirstOrDefaultAsync(d => d.Ptsid == request.DeviceId, cancellationToken);

                        if (ptsDevice?.EnableLocationValidation == 1)
                        {
                            _logger.LogWarning("[PumpAuth] Location validation required for device {DeviceId} but no TankId provided",
                                request.DeviceId);
                        }
                    }

                    // Perform location validation if we have a TankId OR if the device requires it
                    if (effectiveTankId.HasValue || !string.IsNullOrEmpty(request.DeviceId))
                    {
                        var locationRequest = new LocationValidationRequest
                        {
                            TankId = effectiveTankId ?? 0, // Will be validated in service
                            PtsId = request.DeviceId,
                            VehicleId = request.VehicleId,
                            MobileAppLocation = request.MobileLocation,
                            UserId = request.UserId
                        };

                        var locationResult = await _preCheckService.ValidateLocationProximityAsync(
                            locationRequest, cancellationToken);

                        // Only fail if validation was actually performed and failed
                        if (locationResult.ValidationPerformed && !locationResult.IsValid)
                        {
                            _logger.LogWarning("[PumpAuth] Location validation FAILED - {Reason}", locationResult.FailureReason);
                            return FMSResponse<PumpAuthorizeConfirmation>.ValidationFailed(
                                new List<string>
                                {
                                    "⚠️ Location validation failed",
                                    locationResult.FailureReason ?? "Vehicle or mobile device not within required proximity to fuel dispenser"
                                });
                        }

                        if (locationResult.WasBypassedDueToGPSFailure)
                        {
                            _logger.LogWarning("[PumpAuth] Location validation was bypassed due to GPS unavailability");
                        }

                        // **STEP 3.5: GEOFENCE VALIDATION**
                        // This ensures tankers cannot fuel outside designated geofenced areas
                        {
                            _logger.LogInformation("[PumpAuth] Starting geofence validation for TankId: {TankId}, VehicleId: {VehicleId}",
                                effectiveTankId, request.VehicleId);

                            // Get tank location for geofence check (for mobile tankers)
                            GeoLocation? tankerLocation = null;
                            string? tankerLocationSource = null;
                            if (effectiveTankId.HasValue)
                            {
                                var (tankLoc, source) = await _locationValidationService.GetTankLocationAsync(effectiveTankId.Value, cancellationToken);
                                tankerLocation = tankLoc;
                                tankerLocationSource = source;
                            }

                            // FALLBACK: For mobile tankers without linked vehicle GPS, use operator's mobile location
                            // The operator is physically with the tanker, so their phone location is a valid proxy
                            if (tankerLocation == null && request.MobileLocation != null)
                            {
                                _logger.LogInformation("[PumpAuth] 📍 Using OPERATOR MOBILE LOCATION as tanker location fallback (tanker has no linked vehicle GPS)");
                                tankerLocation = request.MobileLocation;
                                tankerLocationSource = "OperatorMobileFallback";
                            }

                            // Get vehicle location for geofence check
                            GeoLocation? vehicleLocation = null;
                            bool? vehicleHasGPS = null;
                            if (request.VehicleId.HasValue)
                            {
                                // Check if vehicle has GPS installed
                                vehicleHasGPS = await _locationValidationService.CheckVehicleHasGPSAsync(request.VehicleId.Value, cancellationToken);

                                if (vehicleHasGPS == true)
                                {
                                    vehicleLocation = await _locationValidationService.GetVehicleLocationAsync(request.VehicleId.Value, cancellationToken);
                                }
                                else
                                {
                                    _logger.LogInformation("[PumpAuth] 📍 Vehicle {VehicleId} does not have GPS installed - vehicle geofence check will be bypassed",
                                        request.VehicleId.Value);
                                }
                            }

                            _logger.LogInformation("[PumpAuth] Geofence locations - Tanker: {TankerLoc} (source: {Source}), Operator: {OpLoc}, Vehicle: {VehLoc} (HasGPS: {HasGPS})",
                                tankerLocation != null ? $"({tankerLocation.Latitude}, {tankerLocation.Longitude})" : "N/A",
                                tankerLocationSource ?? "N/A",
                                request.MobileLocation != null ? $"({request.MobileLocation.Latitude}, {request.MobileLocation.Longitude})" : "N/A",
                                vehicleLocation != null ? $"({vehicleLocation.Latitude}, {vehicleLocation.Longitude})" : "N/A",
                                vehicleHasGPS?.ToString() ?? "N/A");

                            // Build geofence validation request
                            // Note: We pass FuelingRuleSetId=0 as the system now uses global geofence groups (IsAllowedForFueling flag)
                            var geofenceRequest = new GeofenceValidationRequest
                            {
                                FuelingRuleSetId = 0, // Global policy - uses groups with IsAllowedForFueling=true
                                TankerLocation = tankerLocation,
                                OperatorLocation = request.MobileLocation,
                                VehicleLocation = vehicleLocation,
                                VehicleId = request.VehicleId,
                                PtsId = request.DeviceId,
                                VehicleHasGPS = vehicleHasGPS
                            };

                            var geofenceResult = await _preCheckService.ValidateGeofenceAsync(geofenceRequest, cancellationToken);

                            // Fail if geofence validation was performed and failed
                            if (geofenceResult.WasEnabled && geofenceResult.Outcome == ValidationOutcome.Failed)
                            {
                                _logger.LogWarning("[PumpAuth] ❌ GEOFENCE validation FAILED - {Reason}", geofenceResult.Reason);
                                return FMSResponse<PumpAuthorizeConfirmation>.ValidationFailed(
                                    new List<string>
                                    {
                                        "⚠️ Geofence validation failed",
                                        geofenceResult.Reason ?? "Tanker or vehicle is not within an allowed fueling zone",
                                        "Please move to a designated fueling area and try again"
                                    });
                            }

                            if (geofenceResult.Outcome == ValidationOutcome.Skipped)
                            {
                                _logger.LogDebug("[PumpAuth] Geofence validation skipped - {Reason}", geofenceResult.Reason);
                            }
                        }
                    }
                }

                if (userHasLocationBypass)
                {
                    _logger.LogInformation("[PumpAuth] User has BypassLocationValidation enabled - all location checks were skipped");
                }
                else if (!isLocationValidationEnabled)
                {
                    _logger.LogInformation("[PumpAuth] Global location validation is disabled - skipping mobile/location/geofence checks");
                }

                // **STEP 4: DETERMINE NOZZLE/FUEL SELECTOR**
                request = DetermineNozzleSelector(request);

                // **STEP 5: REQUEST VALIDATION**
                var validationResult = await _validator.ValidateAsync(request, cancellationToken);
                if (!validationResult.IsSuccess)
                {
                    _logger.LogError("Validation failed: {ValidationErrors}",
                        string.Join("; ", validationResult.ValidationErrors));
                    return FMSResponse<PumpAuthorizeConfirmation>.ValidationFailed(validationResult.ValidationErrors);
                }

                // **STEP 5.5: OPENING STOCK VALIDATION**
                // Ensure the tank has opening stock recorded for today before allowing fueling
                // This prevents automated transactions from creating ledger entries when opening stock hasn't been established
                // CRITICAL: This validation applies to ALL tanks, not just UseBookKeeping tanks
                if (request.TankId.HasValue)
                {
                    var tank = await _context.Tanks.FindAsync(new object[] { request.TankId.Value }, cancellationToken);

                    if (tank != null)
                    {
                        // Check for opening stock - applies to ALL tanks regardless of UseBookKeeping
                        var today = DateTime.UtcNow.Date;
                        var hasOpeningStock = await _context.TankVolumeHistories
                            .AnyAsync(tvh =>
                                tvh.TankId == request.TankId.Value &&
                                tvh.Timestamp.Date == today &&
                                tvh.ChangeReason == Domain.Entities.enums.VolumeChangeReasonEnum.OpeningStock &&
                                tvh.IsDeleted != true,
                                cancellationToken);

                        if (!hasOpeningStock)
                        {
                            _logger.LogWarning(
                                "[PumpAuth] ⚠️ OPENING STOCK NOT FOUND - Tank {TankId} ({TankName}) requires opening stock for {Date} before fueling can proceed. UseBookKeeping={UseBookKeeping}",
                                tank.Id, tank.Name, today.ToString("yyyy-MM-dd"), tank.UseBookKeeping);

                            return FMSResponse<PumpAuthorizeConfirmation>.ValidationFailed(
                                new List<string>
                                {
                                    $"⚠️ Opening stock not recorded for tank '{tank.Name}' on {today:yyyy-MM-dd}",
                                    "Opening stock must be recorded before automated fueling can begin.",
                                    "Please record today's opening stock in the Stock Management system first."
                                });
                        }

                        _logger.LogDebug("[PumpAuth] ✅ Opening stock validated for tank {TankId} on {Date}",
                            request.TankId.Value, today.ToString("yyyy-MM-dd"));

                        // **STEP 5.6: PHYSICAL STOCK LEVEL VALIDATION**
                        // Ensure the tank has sufficient physical stock before allowing dispensing
                        // This prevents authorizing fuel that would result in negative stock
                        var physicalStock = tank.PhysicalStockValue ?? 0;
                        var currentBookStock = tank.CurrentStock ?? 0;

                        // **CRITICAL: Always check for negative or zero physical stock**
                        // This prevents any dispensing when tank has no fuel, regardless of dose
                        if (physicalStock <= 0)
                        {
                            _logger.LogError(
                                "[PumpAuth] 🚫 NEGATIVE/ZERO PHYSICAL STOCK - Tank {TankId} ({TankName}) has PhysicalStock={PhysicalStock:N0}L, CurrentStock={CurrentStock:N0}L. Fueling blocked!",
                                tank.Id, tank.Name, physicalStock, currentBookStock);

                            return FMSResponse<PumpAuthorizeConfirmation>.ValidationFailed(
                                new List<string>
                                {
                                    $"🚫 Tank '{tank.Name}' has no fuel available",
                                    $"Physical Stock: {physicalStock:N0} L, Book Stock: {currentBookStock:N0} L",
                                    "Please record a delivery or stock adjustment before fueling can proceed.",
                                    "Contact your supervisor if you believe this is an error."
                                });
                        }

                        // **NOTE: Book stock (CurrentStock) check removed - we only validate physical stock**
                        // Book stock may be out of sync due to missing opening stock entries
                        // Physical stock is the actual fuel level in the tank
                        if (currentBookStock < -1000)
                        {
                            // Log warning but don't block - physical stock is the source of truth for fueling
                            _logger.LogWarning(
                                "[PumpAuth] ⚠️ BOOK STOCK NEGATIVE - Tank {TankId} ({TankName}) has CurrentStock={CurrentStock:N0}L. " +
                                "Fueling will proceed based on physical stock ({PhysicalStock:N0}L). Data reconciliation recommended.",
                                tank.Id, tank.Name, currentBookStock, physicalStock);
                        }

                        // If specific dose requested, validate against physical stock
                        if (request.Dose.HasValue && request.Dose.Value > 0)
                        {
                            var requestedVolume = (decimal)request.Dose.Value;

                            if (physicalStock < requestedVolume)
                            {
                                _logger.LogWarning(
                                    "[PumpAuth] ⛽ INSUFFICIENT STOCK - Tank {TankId} ({TankName}) has {PhysicalStock:N0}L but {RequestedVolume:N0}L was requested",
                                    tank.Id, tank.Name, physicalStock, requestedVolume);

                                return FMSResponse<PumpAuthorizeConfirmation>.ValidationFailed(
                                    new List<string>
                                    {
                                        $"⛽ Insufficient stock in tank '{tank.Name}'",
                                        $"Available: {physicalStock:N0} L, Requested: {requestedVolume:N0} L",
                                        "Please reduce the fuel amount or select a different tank."
                                    });
                            }

                            _logger.LogDebug("[PumpAuth] ✅ Physical stock validated for tank {TankId}: {PhysicalStock:N0}L available, {RequestedVolume:N0}L requested",
                                request.TankId.Value, physicalStock, requestedVolume);
                        }
                        else
                        {
                            // Unlimited fueling - just log that physical stock is positive
                            _logger.LogDebug("[PumpAuth] ✅ Physical stock available for unlimited fueling on tank {TankId}: {PhysicalStock:N0}L",
                                request.TankId.Value, physicalStock);
                        }
                    }
                }

                // **STEP 6: CHECK IF ALREADY AUTHORIZED**
                if (request.Nozzle > 0 && await _authTracker.IsAuthorized(request.DeviceId!, request.Nozzle))
                {
                    _logger.LogInformation("Pump {PumpId} already authorized for device {DeviceId}",
                        request.PumpId, request.DeviceId);
                    return FMSResponse<PumpAuthorizeConfirmation>.Success(null!, "Pump already authorized");
                }

                // **STEP 7: FUELING RULES VALIDATION**
                decimal? effectiveDose = request.Dose.HasValue ? (decimal)request.Dose.Value : null;
                effectiveDose = await EvaluateFuelingRulesAsync(request, effectiveDose, cancellationToken);

                if (effectiveDose.HasValue && effectiveDose.Value > 0)
                {
                    request = request with { Dose = (double)effectiveDose.Value };
                }

                // **STEP 8: GET FUEL GRADE PRICE**
                decimal fuelGradePrice = 0;
                bool shouldIncludePrice = request.Type != PumpAuthorizeType.FULLTANK;

                if (shouldIncludePrice)
                {
                    fuelGradePrice = await _fuelPriceService.GetFuelGradePriceAsync(
                        request.DeviceId!, request.Nozzle, request.FuelGradeId);

                    if (fuelGradePrice <= 0)
                    {
                        fuelGradePrice = 1; // Default fallback
                        _logger.LogWarning("[PumpAuth] Using default price: 1 for device {DeviceId}", request.DeviceId);
                    }
                }

                // **STEP 9: AUTHORIZE PUMP**
                var pumpAuthorizeData = BuildPumpAuthorizeData(request, fuelGradePrice, shouldIncludePrice);

                _logger.LogInformation("Authorizing pump {PumpId} on device {DeviceId}, letting PTS device assign transaction ID",
                    request.PumpId, request.DeviceId);

                var confirmation = await _pumpService.PumpAuthorizeAsync(request.DeviceId!, pumpAuthorizeData);

                if (confirmation == null)
                {
                    return FMSResponse<PumpAuthorizeConfirmation>.Failed("Pump not authorized");
                }

                // **STEP 10: POST-AUTHORIZATION PROCESSING**
                await ProcessAuthorizationConfirmationAsync(request, confirmation, cancellationToken);

                return FMSResponse<PumpAuthorizeConfirmation>.Success(confirmation, "Pump authorized");
            }
            catch (PTSDeviceException ex)
            {
                _logger.LogError(ex, "PTS device error while authorizing pump {PumpId} for device {DeviceId}. Error type: {ErrorType}",
                    request.PumpId, request.DeviceId, ex.ErrorType);

                return ex.ErrorType switch
                {
                    ErrorType.SystemError => FMSResponse<PumpAuthorizeConfirmation>.SystemError(ex.Message),
                    ErrorType.NetworkError => FMSResponse<PumpAuthorizeConfirmation>.NetworkError(ex.Message),
                    ErrorType.DeviceError => FMSResponse<PumpAuthorizeConfirmation>.DeviceError(ex.Message),
                    _ => FMSResponse<PumpAuthorizeConfirmation>.Failed(ex.Message)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while authorizing pump {PumpId} for device {DeviceId}",
                    request.PumpId, request.DeviceId);
                throw;
            }
        }

        /// <summary>
        /// Determines the nozzle/fuel selector based on provided inputs.
        /// </summary>
        private static PumpAuthorizeCommand DetermineNozzleSelector(PumpAuthorizeCommand request)
        {
            if (request.Nozzle > 0)
            {
                return request with { NozzleOrFuelIdSelector = NozzleOrFuelIdSelector.NOZZLE };
            }
            else if (request.Nozzles != null && request.Nozzles.Any())
            {
                return request with { NozzleOrFuelIdSelector = NozzleOrFuelIdSelector.NOZZLES };
            }
            else if (request.FuelGradeId.HasValue && request.FuelGradeId > 0)
            {
                return request with { NozzleOrFuelIdSelector = NozzleOrFuelIdSelector.FUELGRADEID };
            }
            else
            {
                return request with { NozzleOrFuelIdSelector = NozzleOrFuelIdSelector.NONE };
            }
        }

        /// <summary>
        /// Evaluates fueling rules and returns the effective dose.
        /// </summary>
        private async Task<decimal?> EvaluateFuelingRulesAsync(
            PumpAuthorizeCommand request,
            decimal? currentDose,
            CancellationToken cancellationToken)
        {
            if (!request.VehicleId.HasValue)
            {
                return currentDose;
            }

            try
            {
                // Get site ID for rule evaluation
                int siteIdForRules = 0;
                if (request.TankId.HasValue)
                {
                    var tank = await _context.Tanks.FindAsync(new object[] { request.TankId.Value }, cancellationToken);
                    siteIdForRules = tank?.SiteId ?? 0;
                }

                // Get tag ID if tag is provided
                int? tagIdForRules = null;
                if (!string.IsNullOrEmpty(request.Tag))
                {
                    var fuelTag = await _context.FuelTags.FirstOrDefaultAsync(t => t.Name == request.Tag, cancellationToken);
                    tagIdForRules = fuelTag?.Id;
                }

                // Build fueling context
                var fuelingContext = await _fuelingRuleService.BuildFuelingContextAsync(
                    request.VehicleId.Value, siteIdForRules, tagIdForRules, cancellationToken);

                // Calculate fuel allowance
                var fuelAllowance = await _fuelingRuleService.CalculateFuelAllowanceAsync(fuelingContext, cancellationToken);

                _logger.LogInformation(
                    "[PumpAuth] Fueling rules - Vehicle {VehicleId}: IsAllowed={IsAllowed}, MaxFuel={MaxFuel}L, LimitingFactor={LimitingFactor}",
                    request.VehicleId.Value, fuelAllowance.IsAllowed, fuelAllowance.MaxFuelAllowed, fuelAllowance.LimitingFactor);

                if (!fuelAllowance.IsAllowed)
                {
                    _logger.LogWarning("[PumpAuth] Fueling blocked - Vehicle {VehicleId}: {Reason}",
                        request.VehicleId.Value, fuelAllowance.BlockedReason);
                    // Note: Caller should handle blocked fueling scenario
                }

                // Apply rule-based dose limit
                if (fuelAllowance.MaxFuelAllowed > 0)
                {
                    if (!currentDose.HasValue || currentDose.Value == 0)
                    {
                        return fuelAllowance.MaxFuelAllowed;
                    }
                    else if (currentDose.Value > fuelAllowance.MaxFuelAllowed)
                    {
                        _logger.LogInformation("[PumpAuth] Dose limited from {Requested}L to {Max}L",
                            currentDose.Value, fuelAllowance.MaxFuelAllowed);
                        return fuelAllowance.MaxFuelAllowed;
                    }
                }

                return currentDose;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[PumpAuth] Failed to evaluate fueling rules for vehicle {VehicleId}. Proceeding without limits.",
                    request.VehicleId.Value);
                return currentDose;
            }
        }

        /// <summary>
        /// Builds the PumpAuthorizeData for the PTS service.
        /// </summary>
        private static PumpAuthorizeData BuildPumpAuthorizeData(
            PumpAuthorizeCommand request,
            decimal fuelGradePrice,
            bool shouldIncludePrice)
        {
            return new PumpAuthorizeData
            {
                Pump = request.PumpId,
                NozzleOrFuelIdSelector = request.NozzleOrFuelIdSelector,
                Nozzle = request.Nozzle,
                Nozzles = request.Nozzles,
                FuelGradeId = request.FuelGradeId ?? 0,
                PriceEnabled = shouldIncludePrice && fuelGradePrice > 0,
                Price = fuelGradePrice,
                Type = request.Type,
                Dose = request.Dose ?? 0,
                AutoCloseTransaction = request.AutoCloseTransaction,
                TransactionEnabled = false, // Let PTS device generate transaction ID
                Tag = request.Tag,
            };
        }

        /// <summary>
        /// Processes the authorization confirmation - stores state and transaction context.
        /// </summary>
        private async Task ProcessAuthorizationConfirmationAsync(
            PumpAuthorizeCommand request,
            PumpAuthorizeConfirmation confirmation,
            CancellationToken cancellationToken)
        {
            _logger.LogDebug("PTS device assigned transaction ID: {TransactionId} for pump {PumpId}",
                confirmation.Transaction, request.PumpId);

            // Get connection type
            var connectionType = await _connectionTypeService.GetConnectionTypeAsync(request.DeviceId!);

            // Set authorization state
            var authState = new AuthState
            {
                DeviceId = request.DeviceId!,
                PumpId = request.PumpId,
                TagId = request.Tag,
                NozzleId = request.Nozzle,
                ExpiresAt = DateTime.UtcNow.AddMinutes(5),
                Status = "Authorized",
                TransactionId = confirmation.Transaction,
                AuthorizedAt = DateTime.UtcNow,
                AuthorizedAmount = (decimal)(request.Dose ?? 0)
            };

            await _authTracker.SetAuthorized(request.DeviceId!, request.Nozzle, authState);

            // Get site ID for context
            int? siteId = null;
            string? tankName = null;
            if (request.TankId.HasValue)
            {
                var tank = await _context.Tanks.FindAsync(request.TankId.Value);
                siteId = tank?.SiteId;
                tankName = tank?.Name;
            }

            string? vehicleName = null;
            if (request.VehicleId.HasValue)
            {
                var vehicle = await _context.Vehicles
                    .AsNoTracking()
                    .Where(v => v.VehicleId == request.VehicleId.Value)
                    .Select(v => new { v.NumberPlate, v.HyoungNo })
                    .FirstOrDefaultAsync(cancellationToken);

                vehicleName = vehicle?.NumberPlate ?? vehicle?.HyoungNo;
            }

            string? userName = null;
            if (!string.IsNullOrWhiteSpace(request.UserId))
            {
                userName = await _context.Users
                    .AsNoTracking()
                    .Where(u => u.Id == request.UserId)
                    .Select(u => u.UserName)
                    .FirstOrDefaultAsync(cancellationToken);
            }

            // Get auto-create ledger setting from system configuration
            var autoCreateLedgerEntries = await _systemConfigService.GetPtsAutoCreateLedgerEntriesAsync(cancellationToken);

            // Determine auto-close behavior
            var configuredAutoClose = request.AutoCloseTransaction;
            if (autoCreateLedgerEntries && connectionType != "HTTPPolling")
            {
                configuredAutoClose = true;
                _logger.LogDebug("[PumpAuth] Auto-close enabled based on configuration for transaction {TransactionId}",
                    confirmation.Transaction);
            }

            // Capture fuel level before fueling for GPS-enabled vehicles in vehicle refueling mode.
            // This value is stored in transaction context and persisted when transaction completes.
            var fuelLevelBefore = await TryGetFuelLevelBeforeFuelingAsync(request, cancellationToken);

            // Store transaction context
            var transactionContext = new TransactionContext
            {
                DeviceId = request.DeviceId!,
                TransactionId = confirmation.Transaction,
                PumpId = request.PumpId,
                TankId = request.TankId,
                VehicleId = request.VehicleId,
                UserId = request.UserId,
                VehicleName = vehicleName,
                TankName = tankName,
                UserName = userName,
                SiteId = siteId,
                Odometer = request.Odometer,
                FuelLevelBefore = fuelLevelBefore,
                MobileLocationLatitude = (double?)request.MobileLocation?.Latitude,
                MobileLocationLongitude = (double?)request.MobileLocation?.Longitude,
                MobileLocationAccuracy = (double?)request.MobileLocation?.Accuracy,
                MobileLocationIsCached = request.MobileLocation?.IsCached,
                AuthorizedAt = DateTime.UtcNow,
                ConnectionType = connectionType,
                AutoCloseTransaction = configuredAutoClose,
                StartTime = DateTime.UtcNow,
                // CRITICAL FIX: Add missing fields for transaction completion enrichment
                Tag = request.Tag,
                // NOZZLE FIX: Use nozzle from confirmation if request didn't specify one
                // (happens when authorizing by FuelGradeId - device selects nozzle)
                Nozzle = request.Nozzle > 0 ? request.Nozzle : confirmation.Nozzle,
                // FUEL GRADE FIX: Use fuel grade from confirmation if available
                FuelGradeId = request.FuelGradeId ?? confirmation.FuelGradeId,
                // FuelGradeName will be populated from device status during completion if needed
                FuelGradeName = null,
                // ConfigurationId can be populated if available from device
                ConfigurationId = null,
                // Employee/Driver who is performing the fueling
                EmployeeId = request.EmployeeId,
                IsTransferMode = false
            };

            await _transactionContextService.StoreTransactionContextAsync(transactionContext);

            // Update LocationValidationLog with the TransactionId
            // (The log was created before authorization when we didn't have the ID yet)
            // ENHANCED: Also update when we have mobile location but no TankId (mobile tanker scenarios)
            if (confirmation.Transaction > 0)
            {
                bool updated = false;

                // Try with TankId if available
                if (request.TankId.HasValue)
                {
                    updated = await _locationValidationService.UpdateTransactionIdAsync(
                        request.DeviceId!,
                        request.TankId.Value,
                        request.VehicleId,
                        confirmation.Transaction,
                        cancellationToken);
                }

                // If TankId is not available but we have a mobile location, try alternative linking
                // by looking for any recent location log for this device
                if (!updated && request.MobileLocation != null)
                {
                    _logger.LogDebug("[PumpAuth] TankId not available for location log linking, trying device-only match for transaction {TransactionId}",
                        confirmation.Transaction);
                }
            }

            // Start monitoring the transaction
            await _transactionMonitoringService.StartMonitoringTransaction(
                request.DeviceId!, request.PumpId, request.Nozzle, confirmation.Transaction);

            // Update GPSGate DriverName custom field if employee/driver is specified
            await UpdateGpsGateDriverNameAsync(request.VehicleId, request.EmployeeId, cancellationToken);

            // Check if vehicle GPS is offline and create alert if needed
            await CheckVehicleGpsOfflineAsync(request.VehicleId, request.TankId, (decimal?)request.Dose, request.UserId, cancellationToken);
        }

        /// <summary>
        /// Gets vehicle fuel level before fueling from GPS sensor for vehicle fueling mode only.
        /// Returns null when feature is disabled, vehicle has no GPS, or reading is unavailable.
        /// </summary>
        private async Task<decimal?> TryGetFuelLevelBeforeFuelingAsync(PumpAuthorizeCommand request, CancellationToken cancellationToken)
        {
            if (!request.VehicleId.HasValue || _gpsService == null)
            {
                return null;
            }

            try
            {
                var fuelLevelCheckEnabled = await _systemConfigService.GetPtsEnableGPSFuelLevelCheckAsync(cancellationToken);
                if (!fuelLevelCheckEnabled)
                {
                    return null;
                }

                var hasGpsInstalled = await _context.Vehicles
                    .AsNoTracking()
                    .Where(v => v.VehicleId == request.VehicleId.Value)
                    .Select(v => v.HasGPSInstalled == 1)
                    .FirstOrDefaultAsync(cancellationToken);

                if (!hasGpsInstalled)
                {
                    return null;
                }

                var fuelLevelResult = await _gpsService.GetFuelLevelAsync(request.VehicleId.Value);
                if (fuelLevelResult.IsSuccess && fuelLevelResult.Data.HasValue)
                {
                    _logger.LogDebug("[PumpAuth] Captured FuelLevelBefore={FuelLevel}L for vehicle {VehicleId}",
                        fuelLevelResult.Data.Value,
                        request.VehicleId.Value);
                    return fuelLevelResult.Data.Value;
                }

                _logger.LogDebug("[PumpAuth] Fuel level before fueling unavailable for vehicle {VehicleId}. Message: {Message}",
                    request.VehicleId.Value,
                    fuelLevelResult.Message);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "[PumpAuth] Failed to capture fuel level before fueling for vehicle {VehicleId}",
                    request.VehicleId.Value);
                return null;
            }
        }

        /// <summary>
        /// Updates the GPSGate DriverName custom field when pump authorization succeeds.
        /// This allows operators to see who was the last driver to fuel a vehicle in GPSGate.
        /// </summary>
        private async Task UpdateGpsGateDriverNameAsync(int? vehicleId, int? employeeId, CancellationToken cancellationToken)
        {
            if (_driverNameService == null)
            {
                return;
            }

            // Only update if both vehicle and employee are specified
            if (!vehicleId.HasValue)
            {
                _logger.LogDebug("[PumpAuth] No vehicle specified, skipping GPSGate DriverName update");
                return;
            }

            if (!employeeId.HasValue)
            {
                _logger.LogDebug("[PumpAuth] No employee/driver specified for vehicle {VehicleId}, skipping GPSGate DriverName update", vehicleId);
                return;
            }

            try
            {
                var result = await _driverNameService.UpdateDriverNameAsync(vehicleId.Value, employeeId.Value, cancellationToken);

                if (result.IsSuccess)
                {
                    _logger.LogInformation(
                        "[PumpAuth] Updated GPSGate DriverName for vehicle {VehicleId} with employee {EmployeeId}: {Message}",
                        vehicleId.Value, employeeId.Value, result.Message);
                }
                else
                {
                    _logger.LogWarning(
                        "[PumpAuth] Failed to update GPSGate DriverName for vehicle {VehicleId} with employee {EmployeeId}: {Message}",
                        vehicleId.Value, employeeId.Value, result.Message);
                }
            }
            catch (Exception ex)
            {
                // Log but don't fail the authorization - this is a non-critical enhancement
                _logger.LogWarning(ex,
                    "[PumpAuth] Error updating GPSGate DriverName for vehicle {VehicleId} with employee {EmployeeId}",
                    vehicleId.Value, employeeId.Value);
            }
        }

        /// <summary>
        /// Checks if the vehicle has GPS tracking and if the GPS is offline or stale.
        /// If so, creates an alert/notification to inform operators.
        /// </summary>
        private async Task CheckVehicleGpsOfflineAsync(int? vehicleId, int? siteId, decimal? fuelAmount, string? triggeredBy, CancellationToken cancellationToken)
        {
            if (_gpsOfflineAlertService == null)
            {
                return;
            }

            if (!vehicleId.HasValue)
            {
                _logger.LogDebug("[PumpAuth] No vehicle specified, skipping GPS offline check");
                return;
            }

            try
            {
                var result = await _gpsOfflineAlertService.CheckAndAlertIfGpsOfflineAsync(
                    vehicleId.Value, siteId, fuelAmount, triggeredBy, cancellationToken);

                if (result.AlertCreated)
                {
                    _logger.LogWarning(
                        "GPS offline alert created for vehicle {VehicleId}: {Message}",
                        vehicleId, result.Message);
                }
            }
            catch (Exception ex)
            {
                // Log but don't fail the authorization - this is a non-critical enhancement
                _logger.LogWarning(ex, "Failed to check vehicle GPS offline status for vehicle {VehicleId}", vehicleId);
            }
        }
    }
}
