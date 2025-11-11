//
// File: PumpAuthorizeCommand.cs
// Purpose: Handles pump authorization workflow and returns standardized FMSResponse with proper ErrorType mapping
// Dependencies: FMSResponse<T>, PTSDeviceException, logging, Redis, device monitoring services
// Last Modified: 2025-11-05
//
// Key Sections:
// - Authorization flow and confirmation
// - Redis transaction context storage
// - Error handling mapping System/Network/Device errors to FMSResponse

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
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Communication; //Cursor: Add for DeviceConnectionTracker
using FMS.Application.Features.FuelTagManagement.FuelingTags.FuelingTags.Queries;
using FMS.Application.Features.FuelTagManagement.FuelingTags.Queries;
using FMS.Application.Helpers;
using FMS.Application.Infrastructure.DistCacheTracker;
using FMS.Application.Infrastructure.Expections.Base;
using FMS.Application.PTSServices.PumpService;
using FMS.Application.Services; //Cursor: Add for ITransactionMonitoringService
using FMS.Domain.Entities; //Cursor: Add for Ptsdevice entity
using FMS.Domain.Entities.PTS;
using FMS.Domain.Entities.PTS.Enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StackExchange.Redis; //Cursor

namespace FMS.Application.Command.PTSCommand.PumpCommands
{
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
        public bool AutoCloseTransaction { get; set; }
        public string? Tag { get; set; }
        public int? TankId { get; set; }

        public int? VehicleId { get; set; }

        // Cursor: User ID from controller for auto-assign master tag feature
        public string? UserId { get; set; }

    }

    public class PumpAuthorizeCommandHandler : IRequestHandler<PumpAuthorizeCommand, FMSResponse<PumpAuthorizeConfirmation>>
    {

        private readonly GpsdataContext _context;
        private readonly ILogger<PumpAuthorizeCommandHandler> _logger;
        private readonly IAuthorizationStateTracker _authTracker;
        private readonly IMediator _mediator;

        private readonly IPumpService _pumpService;
        private readonly IDatabase _redisDb; //Cursor
        private readonly DeviceConnectionTracker _deviceConnectionTracker; //Cursor: Add device connection tracker
        private readonly ITransactionMonitoringService _transactionMonitoringService; //Cursor: Add for ITransactionMonitoringService
        //Cursor: Add configuration service for automated fueling settings
        private readonly IAutomatedFuelingConfigurationService _configurationService;

        public PumpAuthorizeCommandHandler(
            IAuthorizationStateTracker authstatetracker,
            IMediator mediator,
            GpsdataContext context,
            IPumpService pumpService,
            IConnectionMultiplexer redisConnection, //Cursor
            DeviceConnectionTracker deviceConnectionTracker, //Cursor: Add device connection tracker
            ITransactionMonitoringService transactionMonitoringService, //Cursor: Add for ITransactionMonitoringService
            IAutomatedFuelingConfigurationService configurationService, //Cursor: Add configuration service
            ILogger<PumpAuthorizeCommandHandler> logger)
        {
            _authTracker = authstatetracker;
            _mediator = mediator;
            _context = context;
            _pumpService = pumpService;
            _redisDb = redisConnection.GetDatabase(); //Cursor
            _deviceConnectionTracker = deviceConnectionTracker; //Cursor: Add device connection tracker
            _transactionMonitoringService = transactionMonitoringService; //Cursor: Add for ITransactionMonitoringService
            _configurationService = configurationService; //Cursor: Add configuration service
            _logger = logger;
        }

        public async Task<FMSResponse<PumpAuthorizeConfirmation>> Handle(PumpAuthorizeCommand request, CancellationToken cancellationToken)
        {
            try
            {

                // Determine NozzleOrFuelIdSelector based on provided inputs
                if (request.Nozzle > 0)
                {
                    request = request with { NozzleOrFuelIdSelector = NozzleOrFuelIdSelector.NOZZLE };
                }
                else if (request.Nozzles != null && request.Nozzles.Any())
                {
                    request = request with { NozzleOrFuelIdSelector = NozzleOrFuelIdSelector.NOZZLES };
                }
                else if (request.FuelGradeId.HasValue && request.FuelGradeId > 0)
                {
                    request = request with { NozzleOrFuelIdSelector = NozzleOrFuelIdSelector.FUELGRADEID };
                }
                else
                {
                    // If PTS relies on nozzle up event without explicit nozzle/fuel grade, this might be NONE.
                    // For now, this path might indicate an issue if explicit selection is expected.
                    // The frontend payload has nozzle:1, so NOZZLE will be chosen.
                    request = request with { NozzleOrFuelIdSelector = NozzleOrFuelIdSelector.NONE }; // Defaulting or could be an error
                }

                //1. validate Request
                var validationResult = await ValidateRequest(request);
                if (!validationResult.IsSuccess)
                {
                    //Cursor: Return proper FMSResponse with ValidationErrors instead of concatenated message
                    _logger.LogError("Validation failed for authorizing pump {PumpId} for device {DeviceId}: {ValidationErrors}",
                        request.PumpId, request.DeviceId, string.Join("; ", validationResult.ValidationErrors));
                    return FMSResponse<PumpAuthorizeConfirmation>.ValidationFailed(validationResult.ValidationErrors);
                }

                //2. check if alread authorized
                //Cursor: Using request.Nozzle for auth tracker key. If selector is FuelGradeId, this might need adjustment
                // or ensure Nozzle is always resolved if FuelGradeId is used for authorization.
                // For now, assuming request.Nozzle is the key for _authTracker if applicable.
                var nozzleToCheck = request.Nozzle;

                if (request.NozzleOrFuelIdSelector == NozzleOrFuelIdSelector.FUELGRADEID && request.Nozzle <= 0)
                {
                    // If authorizing by FuelGradeID and no specific nozzle given in request,
                    // this check might not be applicable in its current form or _authTracker needs a different key.
                    // For now, this implies a specific nozzle must eventually be identified for tracking.
                    // This area might need refinement based on how FuelGradeId auth translates to a physical nozzle for tracking.
                }

                if (nozzleToCheck > 0 && await _authTracker.IsAuthorized(request.DeviceId!, nozzleToCheck))
                {
                    _logger.LogInformation("Pump {PumpId} already authorized for device {DeviceId}", request.PumpId, request.DeviceId);
                    return FMSResponse<PumpAuthorizeConfirmation>.Success(null!, "Pump already authorized");
                }

                // TODO: FUELING RULE FEATURE - Re-enable tag authentication and fueling rule validation when feature is ready
                // The following section authenticates tags and validates fueling rules (dose limits) for tags.
                // This is currently disabled to allow the fueling process to proceed without tag rule checks.

                /*
                //3. Aunthicate the tag if Provide

                decimal? effectiveDoseForAuthTracking = null;
                AuthenticateTagResult tagAuthentication = null;

                if (!string.IsNullOrEmpty(request.Tag))
                {

                    tagAuthentication = await _mediator.Send(new AuthenticateFuelTagQuery(request.Tag), cancellationToken);

                    if (tagAuthentication == null || !tagAuthentication.IsAuthenticated)
                    {
                        _logger.LogInformation("Tag read ignored - tag not authenticated for device {DeviceId}, pump {PumpId}", request.DeviceId, request.PumpId);
                        return FMSResponse<PumpAuthorizeConfirmation>.Failed("Tag not authenticated");
                    }

                    //use the tag dose limit if not provided, or use the lower value if both are provided
                    if (!request.Dose.HasValue)
                    {
                        request = request with { Dose = (double)tagAuthentication.dose };
                    }
                    else if (tagAuthentication.dose < (decimal)request.Dose.Value)
                    {
                        // Use the lower of tag limit and request dose for safety
                        _logger.LogInformation("Limiting dose to tag limit: {TagLimit} (requested: {RequestedDose}) for device {DeviceId}, pump {PumpId}",
                            tagAuthentication.dose, request.Dose.Value, request.DeviceId, request.PumpId);
                        request = request with { Dose = (double)tagAuthentication.dose };
                    }
                }
                */

                // TODO: FUELING RULE FEATURE - Auto-assign master tag feature also disabled (depends on tag authentication)
                // When fueling rule feature is re-enabled, uncomment this section along with tag authentication above.

                /*
                // Cursor: Auto-assign user master tag if vehicle-only and feature enabled on device
                // Get device configuration for auto-assign setting
                var device = await _context.Ptsdevices.FirstOrDefaultAsync(d => d.Ptsid == request.DeviceId);
                bool deviceAutoAssignEnabled = device?.AutoAssignUserMasterTag == 1;

                if (deviceAutoAssignEnabled &&
                    request.VehicleId.HasValue &&
                    string.IsNullOrEmpty(request.Tag) &&
                    !string.IsNullOrEmpty(request.UserId))
                {

                    try
                    {
                        var user = await _context.Users
                            .Include(u => u.MasterTags)
                            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

                        if (user?.MasterRFIDTag.HasValue == true)
                        {
                            var masterTag = await _context.FuelTags
                                .FirstOrDefaultAsync(t => t.Id == user.MasterRFIDTag.Value, cancellationToken);

                            if (masterTag != null && masterTag.IsMaster == 1)
                            {
                                request = request with { Tag = masterTag.Name };
                                _logger.LogInformation("Auto-assigned user master tag {TagName} for vehicle-only authorization by user {UserId} on device {DeviceId} (device setting enabled)",
                                    masterTag.Name, request.UserId, request.DeviceId);

                                //Cursor: Re-authenticate the auto-assigned master tag to get dose limits
                                tagAuthentication = await _mediator.Send(new AuthenticateFuelTagQuery(masterTag.Name), cancellationToken);

                                if (tagAuthentication == null || !tagAuthentication.IsAuthenticated)
                                {
                                    _logger.LogWarning("Auto-assigned master tag {TagName} authentication failed for user {UserId} on device {DeviceId}",
                                        masterTag.Name, request.UserId, request.DeviceId);
                                    return FMSResponse<PumpAuthorizeConfirmation>.Failed("Auto-assigned master tag not authenticated");
                                }

                                //Cursor: Set dose from auto-assigned tag if not already provided
                                if (!request.Dose.HasValue)
                                {
                                    request = request with { Dose = (double)tagAuthentication.dose };
                                    _logger.LogInformation("Set dose from auto-assigned master tag: {Dose} liters for device {DeviceId}, pump {PumpId}",
                                        tagAuthentication.dose, request.DeviceId, request.PumpId);
                                }
                            }
                            else
                            {
                                _logger.LogWarning("User {UserId} does not have a valid master tag assigned for device {DeviceId}", request.UserId, request.DeviceId);
                            }
                        }
                        else
                        {
                            _logger.LogWarning("User {UserId} does not have a master tag assigned for device {DeviceId}", request.UserId, request.DeviceId);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error auto-assigning master tag for user {UserId} on device {DeviceId}", request.UserId, request.DeviceId);
                        // Continue without auto-assignment - let validation handle the missing tag
                    }
                }
                else if (request.VehicleId.HasValue && string.IsNullOrEmpty(request.Tag))
                {
                    // Log when auto-assign is not enabled but could be useful
                    _logger.LogInformation("Vehicle-only authorization attempted on device {DeviceId}, but auto-assign master tag feature is disabled for this device", request.DeviceId);
                }
                */

                // TODO: FUELING RULE FEATURE - Re-enable vehicle fuel rule validation when feature is ready
                // The following section validates vehicle fuel limits based on configured fueling rules.
                // This is currently disabled to allow vehicle selection to proceed directly to fueling details.

                /*
                //Cursor: 4. Validate vehicle fuel limits if VehicleId is provided (after tag authentication and auto-assignment)
                VehicleValidationResultDTO vehicleValidation = null;
                if (request.VehicleId.HasValue)
                {
                    try
                    {
                        vehicleValidation = await _mediator.Send(new ValidateVehicleQuery(request.VehicleId.Value, request.Dose), cancellationToken);

                        if (vehicleValidation == null || !vehicleValidation.IsValid)
                        {
                            var errorMessage = vehicleValidation?.Message ?? "Vehicle validation failed";
                            _logger.LogWarning("Vehicle validation failed for VehicleId {VehicleId}: {Message}",
                                request.VehicleId.Value, errorMessage);
                            return FMSResponse<PumpAuthorizeConfirmation>.Failed($"Vehicle validation failed: {errorMessage}");
                        }

                        _logger.LogInformation("Vehicle {VehicleId} validation passed. Daily: {DailyUsed}/{DailyLimit}, Monthly: {MonthlyUsed}/{MonthlyLimit}",
                            request.VehicleId.Value,
                            vehicleValidation.VehicleInfo.DailyUsed, vehicleValidation.VehicleInfo.DailyLimit,
                            vehicleValidation.VehicleInfo.MonthlyUsed, vehicleValidation.VehicleInfo.MonthlyLimit);

                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error during vehicle validation for VehicleId {VehicleId}", request.VehicleId.Value);
                        return FMSResponse<PumpAuthorizeConfirmation>.Failed("Error during vehicle validation");
                    }
                }
                */

                //Cursor: 5. Calculate final dose considering both tag and vehicle limits (DISABLED - See TODO above)
                // TODO: FUELING RULE FEATURE - Re-enable dose calculation with vehicle limits when feature is ready

                /*
                if (request.VehicleId.HasValue && vehicleValidation != null && vehicleValidation.IsValid)
                {
                    // Calculate remaining daily and monthly vehicle limits
                    var vehicleInfo = vehicleValidation.VehicleInfo;
                    var vehicleDailyRemaining = vehicleInfo.DailyLimit - vehicleInfo.DailyUsed;
                    var vehicleMonthlyRemaining = vehicleInfo.MonthlyLimit - vehicleInfo.MonthlyUsed;
                    var vehicleLowestRemaining = Math.Min(vehicleDailyRemaining, vehicleMonthlyRemaining);

                    // If we have both tag and vehicle limits, use the lower value for safety
                    if (request.Dose.HasValue && vehicleLowestRemaining > 0)
                    {
                        var originalDose = request.Dose.Value;
                        var safeDose = Math.Min(originalDose, (double)vehicleLowestRemaining);

                        if (safeDose < originalDose)
                        {
                            request = request with { Dose = safeDose };
                            _logger.LogInformation("Limiting dose to vehicle limit: {VehicleLimit} (tag/original: {OriginalDose}) for vehicle {VehicleId} on device {DeviceId}, pump {PumpId}",
                                safeDose, originalDose, request.VehicleId.Value, request.DeviceId, request.PumpId);
                        }
                    }
                    // If no tag dose but vehicle limits exist, use vehicle remaining as dose
                    else if (!request.Dose.HasValue && vehicleLowestRemaining > 0)
                    {
                        request = request with { Dose = (double)vehicleLowestRemaining };
                        _logger.LogInformation("Set dose from vehicle remaining limit: {VehicleRemaining} liters for vehicle {VehicleId} on device {DeviceId}, pump {PumpId}",
                            vehicleLowestRemaining, request.VehicleId.Value, request.DeviceId, request.PumpId);
                    }
                }
                */

                // Cursor: **TRANSACTION ID STRATEGY**: We let the PTS device generate transaction IDs
                // instead of generating them locally. This prevents issues with:
                // 1. Transaction ID conflicts when the application restarts
                // 2. Out-of-range errors when local counter gets out of sync with device
                // 3. Duplicate transaction IDs across multiple application instances
                // The PTS device maintains its own transaction counter and returns the assigned ID.
                var pumpAuthorizeData = new PumpAuthorizeData
                {
                    Pump = request.PumpId,
                    NozzleOrFuelIdSelector = request.NozzleOrFuelIdSelector,
                    Nozzle = request.Nozzle,
                    Nozzles = request.Nozzles,
                    FuelGradeId = request.FuelGradeId ?? 0,
                    PriceEnabled = request.PriceEnabled,
                    Type = request.Type,
                    Dose = request.Dose ?? 0,
                    AutoCloseTransaction = request.AutoCloseTransaction,
                    TransactionEnabled = false, //Cursor: Let PTS device generate transaction ID
                    Tag = request.Tag,
                };

                _logger.LogInformation("**PTS TRANSACTION GENERATION** - Authorizing pump {PumpId} on device {DeviceId}, letting PTS device assign transaction ID",
                    request.PumpId, request.DeviceId);

                var confirmation = await _pumpService.PumpAuthorizeAsync(request.DeviceId!, pumpAuthorizeData);

                //log the confirmation
                if (confirmation != null)
                {
                    _logger.LogInformation("**PTS TRANSACTION ASSIGNED** - Pump {PumpId} authorized successfully for device {DeviceId}. PTS device assigned transaction ID: {TransactionId}",
                        request.PumpId, request.DeviceId, confirmation.Transaction);

                    // Cursor: Get the device connection type to store with transaction context
                    var connectionType = await GetDeviceConnectionType(request.DeviceId!);

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

                    //Cursor: Get site ID from tank for configuration lookup
                    int? siteId = null;
                    if (request.TankId.HasValue)
                    {
                        var tank = await _context.Tanks.FindAsync(request.TankId.Value);
                        siteId = tank?.SiteId;
                    }

                    //Cursor: Get configuration for automated fueling settings
                    var config = await _configurationService.GetConfigurationAsync(siteId, cancellationToken);

                    //Cursor: Apply configuration-based auto-close behavior
                    var configuredAutoClose = request.AutoCloseTransaction;
                    if (config.AutoCreateLedgerEntries && connectionType != "HTTPPolling")
                    {
                        // Enable auto-close for connections that support it when ledger creation is enabled
                        configuredAutoClose = true;
                        _logger.LogInformation("[PumpAuth] Auto-close enabled based on configuration for device {DeviceId}, transaction {TransactionId}",
                            request.DeviceId, confirmation.Transaction);
                    }

                    //Cursor: Store transaction context in Redis for later correlation with connection type and configuration
                    await StoreTransactionContextInRedis(request.DeviceId!, request.PumpId, confirmation.Transaction, request.TankId, request.VehicleId, connectionType, configuredAutoClose, siteId);

                    //Cursor: Start monitoring the transaction after successful authorization
                    await _transactionMonitoringService.StartMonitoringTransaction(request.DeviceId!, request.PumpId, request.Nozzle, confirmation.Transaction);

                    return FMSResponse<PumpAuthorizeConfirmation>.Success(confirmation, "Pump authorized");
                }

                return FMSResponse<PumpAuthorizeConfirmation>.Failed("Pump not authorized");
            }
            catch (PTSDeviceException ex)
            {
                _logger.LogError(ex, "PTS device error while authorizing pump {PumpId} for device {DeviceId}. Error type: {ErrorType}",
                    request.PumpId, request.DeviceId, ex.ErrorType);

                // Return appropriate response based on error type
                return ex.ErrorType
                switch
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

        //Cursor: Enhanced method to store transaction context in Redis with complete data
        private async Task StoreTransactionContextInRedis(string deviceId, int pumpId, int transactionId, int? tankId, int? vehicleId, string connectionType, bool autoCloseTransaction, int? siteId = null)
        {
            try
            {
                var transactionContext = new
                {
                    DeviceId = deviceId,
                    TransactionId = transactionId,
                    PumpId = pumpId, //Cursor: Add missing PumpId for proper correlation
                    TankId = tankId,
                    VehicleId = vehicleId,
                    SiteId = siteId, //Cursor: Add site ID for configuration lookup
                    AuthorizedAt = DateTime.UtcNow,
                    ConnectionType = connectionType,
                    AutoCloseTransaction = autoCloseTransaction,
                    StartTime = DateTime.UtcNow //Cursor: Add start time for timeout detection
                };

                var redisKey = $"device:{deviceId}:transaction:{transactionId}";
                var contextJson = JsonSerializer.Serialize(transactionContext);

                // Store with 24 hour expiry to ensure it doesn't stay forever if transaction never completes
                await _redisDb.StringSetAsync(redisKey, contextJson, expiry: TimeSpan.FromHours(24));

                _logger.LogInformation("**CONTEXT STORED** - Transaction context in Redis for device {DeviceId}, pump {PumpId}, transaction {TransactionId}, VehicleId: {VehicleId}, TankId: {TankId}, connection: {ConnectionType}",
                    deviceId, pumpId, transactionId, vehicleId, tankId, connectionType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "**CONTEXT ERROR** - Error storing transaction context in Redis for device {DeviceId}, transaction {TransactionId}",
                    deviceId, transactionId);
                // Don't rethrow - we still want to continue even if Redis storage fails
            }
        }

        //Cursor: New method to determine device connection type
        private async Task<string> GetDeviceConnectionType(string deviceId)
        {
            try
            {
                // Get WebSocket and HTTP connection info from the device tracker
                var wsConnection = await _deviceConnectionTracker.GetWebSocketConnection(deviceId);
                var httpConnection = await _deviceConnectionTracker.GetHttpConnection(deviceId);

                // Use the static method from DeviceConnectionTracker to determine the connection mode
                var connectionMode = DeviceConnectionTracker.DetermineConnectionMode(wsConnection, httpConnection);

                // Convert the enum to a string for storage
                var connectionType = connectionMode.ToString();

                _logger.LogInformation("Device {DeviceId} connection type determined as: {ConnectionType}",
                    deviceId, connectionType);

                return connectionType;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error determining connection type for device {DeviceId}. Defaulting to 'Unknown'",
                    deviceId);
                return "Unknown";
            }
        }

        //Cursor: Updated to use FMSResponse for validation with support for multiple validation errors and enhanced business rules
        private async Task<FMSResponse> ValidateRequest(PumpAuthorizeCommand request)
        {
            var validationErrors = new List<string>();

            //Cursor: Basic input validation first
            if (string.IsNullOrEmpty(request.DeviceId))
            {
                validationErrors.Add("Device ID is required");
            }

            if (request.PumpId <= 0)
            {
                validationErrors.Add("Pump ID is required and must be greater than 0");
            }

            //Cursor: Updated pump ID range validation to be more reasonable
            if (request.PumpId > 20)
            {
                validationErrors.Add("Invalid pump ID (must be between 1 and 20)");
            }

            if (request.VehicleId.HasValue && request.VehicleId.Value <= 0)
            {
                validationErrors.Add("Vehicle ID must be greater than 0 when provided");
            }

            if (request.TankId.HasValue && request.TankId.Value <= 0)
            {
                validationErrors.Add("Tank ID must be greater than 0 when provided");
            }

            // TODO: FUELING RULE FEATURE - Re-enable dose validation when feature is ready
            // For FullTank type, dose is 0 which is valid, so this validation needs to consider the authorization type
            /*
            if (request.Dose.HasValue && request.Dose.Value <= 0)
            {
                validationErrors.Add("Dose must be greater than 0 when provided");
            }
            */

            // Get device configuration including auto-assign setting
            Ptsdevice? device = null;
            bool deviceAutoAssignEnabled = false;

            // Validate that device exists and is authorized
            if (!string.IsNullOrEmpty(request.DeviceId))
            {
                device = await _context.Ptsdevices.FirstOrDefaultAsync(d => d.Ptsid == request.DeviceId);
                if (device == null)
                {
                    _logger.LogWarning("Device with ID {DeviceId} not found", request.DeviceId);
                    validationErrors.Add("Device not found");
                }
                else if (device.IsAuthenticated == 0)
                {
                    _logger.LogWarning("Device with ID {DeviceId} is not authorized", request.DeviceId);
                    validationErrors.Add("Device not authorized");
                }
                else
                {
                    // Cursor: Get device-specific auto-assign setting
                    deviceAutoAssignEnabled = device.AutoAssignUserMasterTag == 1;
                }
            }

            // TODO: FUELING RULE FEATURE - Re-enable tag and vehicle business rule validation when feature is ready
            // The following business rules are disabled to allow flexible vehicle and tag combinations:
            // - Tag/Vehicle combination rules
            // - Master tag requirements
            // - Fueling rule checks
            // Currently, only basic existence checks are performed below.

            /*
            // Cursor: Validate Tag and Vehicle combination business rules using device settings
            bool hasTag = !string.IsNullOrEmpty(request.Tag);
            bool hasVehicleId = request.VehicleId.HasValue && request.VehicleId.Value > 0;

            // Rule 1: Either tag OR vehicleId must be provided (unless auto-assign is enabled for vehicle-only)
            if (!hasTag && !hasVehicleId)
            {
                validationErrors.Add("Either a tag or vehicle ID must be provided for authorization");
            }

            // Rule 1.5: If vehicle-only with auto-assign enabled on device, ensure we have a user ID
            if (!hasTag && hasVehicleId && deviceAutoAssignEnabled && string.IsNullOrEmpty(request.UserId))
            {
                validationErrors.Add("User authentication required for auto-assign master tag feature on this device");
            }

            // Consolidated tag validation logic
            if (hasTag)
            {
                try
                {
                    var tag = await _context.FuelTags.FirstOrDefaultAsync(t => t.Name == request.Tag);
                    if (tag == null)
                    {
                        validationErrors.Add("Tag not found in database");
                    }
                    else
                    {
                        bool isMasterTag = tag.IsMaster == 1;

                        // Rule 4: If tag is master, then vehicleId must be provided
                        if (isMasterTag && !hasVehicleId)
                        {
                            validationErrors.Add("Master tag requires a vehicle ID to be specified");
                        }

                        // Rule 2: If both tag and vehicleId are provided, tag must be a master tag
                        if (hasVehicleId && !isMasterTag)
                        {
                            validationErrors.Add("When both tag and vehicle are provided, the tag must be a master tag");
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error validating tag {TagName}", request.Tag);
                    validationErrors.Add("Error validating tag");
                }
            }
            */

            // Basic existence checks (non-fueling rule related)
            bool hasTag = !string.IsNullOrEmpty(request.Tag);
            bool hasVehicleId = request.VehicleId.HasValue && request.VehicleId.Value > 0;

            // TODO: FUELING RULE FEATURE - Re-enable tag existence validation when feature is ready
            // Currently commented out to allow authorization without tag validation
            /*
            // Simplified: Just check if tag exists if provided
            if (hasTag)
            {
                try
                {
                    var tag = await _context.FuelTags.FirstOrDefaultAsync(t => t.Name == request.Tag);
                    if (tag == null)
                    {
                        validationErrors.Add("Tag not found in database");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error checking tag existence {TagName}", request.Tag);
                    validationErrors.Add("Error checking tag existence");
                }
            }
            */

            // Rule 3: Vehicle existence check only (fuel limits are validated in main flow after tag authentication)
            if (hasVehicleId)
            {
                try
                {
                    var vehicle = await _context.Vehicles.AnyAsync(v => v.VehicleId == request.VehicleId.Value);
                    if (!vehicle)
                    {
                        validationErrors.Add("Vehicle not found in database");
                        _logger.LogWarning("Vehicle with ID {VehicleId} not found", request.VehicleId.Value);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error checking vehicle existence for VehicleId {VehicleId}", request.VehicleId.Value);
                    validationErrors.Add("Error checking vehicle existence");
                }
            }

            // Validate TankId if provided
            if (request.TankId.HasValue)
            {
                var tankExists = await _context.Tanks.AnyAsync(t => t.Id == request.TankId.Value);
                if (!tankExists)
                {
                    _logger.LogWarning("Tank with ID {TankId} not found", request.TankId.Value);
                    validationErrors.Add("Tank not found");
                }
            }

            //Cursor: Vehicle validation is now handled in main flow after tag authentication and auto-assignment
            //Cursor: This ensures vehicle limits are properly checked with correct context

            // Validate nozzle/fuel grade selection
            if (request.NozzleOrFuelIdSelector == NozzleOrFuelIdSelector.NOZZLE && request.Nozzle <= 0)
            {
                validationErrors.Add("Nozzle must be specified when using nozzle selector");
            }

            if (request.NozzleOrFuelIdSelector == NozzleOrFuelIdSelector.FUELGRADEID && request.FuelGradeId <= 0)
            {
                validationErrors.Add("Fuel Grade ID must be specified when using fuel grade selector");
            }

            // Return validation result
            if (validationErrors.Any())
            {
                return FMSResponse.ValidationFailed(validationErrors);
            }

            return FMSResponse.SuccessResponse("Validation passed");
        }
    }
}