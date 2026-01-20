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
            ILogger<PumpAuthorizeCommandHandler> logger)
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

                // **STEP 2.5: STALE MOBILE LOCATION CHECK**
                // Reject locations older than 60 seconds to prevent fraudulent authorizations with cached locations
                const int MaxLocationAgeSeconds = 60;
                if (request.MobileLocation?.Timestamp != null)
                {
                    var locationAge = DateTime.UtcNow - request.MobileLocation.Timestamp.Value;
                    if (locationAge.TotalSeconds > MaxLocationAgeSeconds)
                    {
                        _logger.LogWarning("[PumpAuth] ⚠️ STALE MOBILE LOCATION REJECTED - Location is {Age:F1} seconds old (max: {Max}s). Timestamp: {Timestamp}",
                            locationAge.TotalSeconds, MaxLocationAgeSeconds, request.MobileLocation.Timestamp.Value);

                        return FMSResponse<PumpAuthorizeConfirmation>.ValidationFailed(
                            new List<string>
                            {
                                "⚠️ Location data is too old",
                                $"Your location was recorded {locationAge.TotalSeconds:F0} seconds ago (maximum allowed: {MaxLocationAgeSeconds} seconds)",
                                "Please wait for a fresh GPS fix and try again"
                            });
                    }
                    else
                    {
                        _logger.LogDebug("[PumpAuth] Mobile location age: {Age:F1} seconds (within {Max}s limit)",
                            locationAge.TotalSeconds, MaxLocationAgeSeconds);
                    }
                }

                // **STEP 3: LOCATION VALIDATION**
                // CRITICAL FIX: Always attempt location validation if DeviceId is provided
                // The LocationValidationService will check if the device requires location validation
                {
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
                            if (request.VehicleId.HasValue)
                            {
                                vehicleLocation = await _locationValidationService.GetVehicleLocationAsync(request.VehicleId.Value, cancellationToken);
                            }

                            _logger.LogInformation("[PumpAuth] Geofence locations - Tanker: {TankerLoc} (source: {Source}), Operator: {OpLoc}, Vehicle: {VehLoc}",
                                tankerLocation != null ? $"({tankerLocation.Latitude}, {tankerLocation.Longitude})" : "N/A",
                                tankerLocationSource ?? "N/A",
                                request.MobileLocation != null ? $"({request.MobileLocation.Latitude}, {request.MobileLocation.Longitude})" : "N/A",
                                vehicleLocation != null ? $"({vehicleLocation.Latitude}, {vehicleLocation.Longitude})" : "N/A");

                            // Build geofence validation request
                            // Note: We pass FuelingRuleSetId=0 as the system now uses global geofence groups (IsAllowedForFueling flag)
                            var geofenceRequest = new GeofenceValidationRequest
                            {
                                FuelingRuleSetId = 0, // Global policy - uses groups with IsAllowedForFueling=true
                                TankerLocation = tankerLocation,
                                OperatorLocation = request.MobileLocation,
                                VehicleLocation = vehicleLocation,
                                VehicleId = request.VehicleId,
                                PtsId = request.DeviceId
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
                if (request.TankId.HasValue)
                {
                    var tank = await _context.Tanks.FindAsync(new object[] { request.TankId.Value }, cancellationToken);

                    // Only validate if tank uses book keeping (ledger system)
                    if (tank?.UseBookKeeping == 1)
                    {
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
                                "[PumpAuth] ⚠️ OPENING STOCK NOT FOUND - Tank {TankId} ({TankName}) requires opening stock for {Date} before fueling can proceed",
                                tank.Id, tank.Name, today.ToString("yyyy-MM-dd"));

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
            if (request.TankId.HasValue)
            {
                var tank = await _context.Tanks.FindAsync(request.TankId.Value);
                siteId = tank?.SiteId;
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

            // Store transaction context
            var transactionContext = new TransactionContext
            {
                DeviceId = request.DeviceId!,
                TransactionId = confirmation.Transaction,
                PumpId = request.PumpId,
                TankId = request.TankId,
                VehicleId = request.VehicleId,
                UserId = request.UserId,
                SiteId = siteId,
                Odometer = request.Odometer,
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
                Nozzle = request.Nozzle,
                FuelGradeId = request.FuelGradeId,
                // FuelGradeName will be populated from device status during completion if needed
                FuelGradeName = null,
                // ConfigurationId can be populated if available from device
                ConfigurationId = null,
                // Employee/Driver who is performing the fueling
                EmployeeId = request.EmployeeId
            };

            await _transactionContextService.StoreTransactionContextAsync(transactionContext);

            // Update LocationValidationLog with the TransactionId
            // (The log was created before authorization when we didn't have the ID yet)
            if (request.TankId.HasValue && confirmation.Transaction > 0)
            {
                await _locationValidationService.UpdateTransactionIdAsync(
                    request.DeviceId!,
                    request.TankId.Value,
                    request.VehicleId,
                    confirmation.Transaction,
                    cancellationToken);
            }

            // Start monitoring the transaction
            await _transactionMonitoringService.StartMonitoringTransaction(
                request.DeviceId!, request.PumpId, request.Nozzle, confirmation.Transaction);
        }
    }
}
