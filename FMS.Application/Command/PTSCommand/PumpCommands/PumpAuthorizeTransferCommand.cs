//
// File: PumpAuthorizeTransferCommand.cs
// Purpose: Handles pump authorization for tank-to-tank transfers WITHOUT vehicle involvement
// Dependencies: FMSResponse<T>, Redis, pump service, tank validation
// Last Modified: 2025-11-13
//
// Key Differences from PumpAuthorizeCommand:
// - NO vehicle or tag validation (tank transfer only)
// - Validates source/destination tanks
// - Creates Redis context with IsTransferMode: true flag
// - Stores SourceTankId and DestinationTankId (instead of VehicleId)

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Infrastructure.DistCacheTracker;
using FMS.Application.Infrastructure.Expections.Base;
using FMS.Application.PTSServices.PumpService;
using FMS.Domain.Entities.PTS;
using FMS.Domain.Entities.PTS.Enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace FMS.Application.Command.PTSCommand.PumpCommands
{
    /// <summary>
    /// Authorizes pump for tank-to-tank transfer operation (NOT vehicle fueling)
    /// </summary>
    public record PumpAuthorizeTransferCommand : IRequest<FMSResponse<PumpAuthorizeConfirmation>>
    {
        public string DeviceId { get; init; } = string.Empty;
        public int PumpId { get; init; }
        public int SourceTankId { get; init; }
        public int DestinationTankId { get; init; }
        public double Volume { get; init; }
        public string? Reason { get; init; }
        public int Nozzle { get; init; }
        public string? UserId { get; init; }
    }

    public class PumpAuthorizeTransferCommandHandler
        : IRequestHandler<PumpAuthorizeTransferCommand, FMSResponse<PumpAuthorizeConfirmation>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<PumpAuthorizeTransferCommandHandler> _logger;
        private readonly IAuthorizationStateTracker _authTracker;
        private readonly IMediator _mediator;
        private readonly IPumpService _pumpService;
        private readonly IDatabase _redisDb;

        public PumpAuthorizeTransferCommandHandler(
            IAuthorizationStateTracker authstatetracker,
            IMediator mediator,
            GpsdataContext context,
            IPumpService pumpService,
            IConnectionMultiplexer redisConnection,
            ILogger<PumpAuthorizeTransferCommandHandler> logger)
        {
            _authTracker = authstatetracker;
            _mediator = mediator;
            _context = context;
            _pumpService = pumpService;
            _redisDb = redisConnection.GetDatabase();
            _logger = logger;
        }

        public async Task<FMSResponse<PumpAuthorizeConfirmation>> Handle(
            PumpAuthorizeTransferCommand request,
            CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation(
                    "[TankTransferAuth] **TANK TRANSFER AUTHORIZATION** - Device {DeviceId}, Pump {PumpId}, Source Tank {SourceTank} -> Dest Tank {DestTank}, Volume: {Volume} L",
                    request.DeviceId, request.PumpId, request.SourceTankId, request.DestinationTankId, request.Volume);

                // **STEP 1: NOZZLE STATE VALIDATION**
                _logger.LogInformation("[TankTransferAuth] **STEP 1** - Checking nozzle state");

                var nozzleStateQuery = new Features.PTS.Queries.GetPumpNozzleStateQuery(request.DeviceId, request.PumpId);
                var nozzleStateResult = await _mediator.Send(nozzleStateQuery, cancellationToken);

                if (!nozzleStateResult.IsSuccess)
                {
                    _logger.LogWarning("[TankTransferAuth] **NOZZLE CHECK FAILED** - {Message}", nozzleStateResult.Message);
                    return FMSResponse<PumpAuthorizeConfirmation>.ValidationFailed(
                        new List<string> { nozzleStateResult.Message ?? "Unable to verify nozzle state" }
                    );
                }

                var nozzleState = nozzleStateResult.Data!;

                if (!nozzleState.IsNozzleUp)
                {
                    _logger.LogWarning("[TankTransferAuth] **NOZZLE DOWN** - Nozzle must be lifted");
                    return FMSResponse<PumpAuthorizeConfirmation>.ValidationFailed(
                        new List<string>
                        {
                            "⚠️ Nozzle must be lifted before starting transfer",
                            "Please lift the nozzle from the pump and try again",
                            $"Current status: {nozzleState.Message}"
                        });
                }

                _logger.LogInformation("[TankTransferAuth] **NOZZLE UP** ✅ - Nozzle {NozzleNumber}", nozzleState.NozzleNumber);

                // **STEP 2: VALIDATE REQUEST**
                _logger.LogInformation("[TankTransferAuth] **STEP 2** - Validating transfer request");

                var validationResult = await ValidateRequest(request);
                if (!validationResult.IsSuccess)
                {
                    _logger.LogError("[TankTransferAuth] **VALIDATION FAILED** - {Errors}",
                        string.Join("; ", validationResult.ValidationErrors));
                    return FMSResponse<PumpAuthorizeConfirmation>.ValidationFailed(validationResult.ValidationErrors);
                }

                // **STEP 3: CHECK FOR STUCK TRANSACTIONS**
                _logger.LogInformation("[TankTransferAuth] **STEP 3** - Checking for stuck transactions");

                if (await _authTracker.IsAuthorized(request.DeviceId, request.Nozzle))
                {
                    _logger.LogWarning("[TankTransferAuth] **ALREADY AUTHORIZED** - Pump {PumpId} already authorized", request.PumpId);
                    return FMSResponse<PumpAuthorizeConfirmation>.ValidationFailed(
                        new List<string> { "Pump is already authorized for another operation" }
                    );
                }

                // **STEP 4: AUTHORIZE PUMP**
                _logger.LogInformation("[TankTransferAuth] **STEP 4** - Authorizing pump with PTS device");

                var pumpAuthorizeData = new PumpAuthorizeData
                {
                    Pump = request.PumpId,
                    NozzleOrFuelIdSelector = NozzleOrFuelIdSelector.NOZZLE,
                    Nozzle = request.Nozzle,
                    PriceEnabled = false,
                    Type = PumpAuthorizeType.VOLUME,
                    Dose = request.Volume,
                    AutoCloseTransaction = false,
                    TransactionEnabled = false, // Let PTS device generate transaction ID
                    Tag = null // NO TAG for tank transfers
                };

                var confirmation = await _pumpService.PumpAuthorizeAsync(request.DeviceId, pumpAuthorizeData);

                if (confirmation == null)
                {
                    _logger.LogError("[TankTransferAuth] **AUTHORIZATION FAILED** - No confirmation from device");
                    return FMSResponse<PumpAuthorizeConfirmation>.Failed("Pump authorization failed");
                }

                _logger.LogInformation(
                    "[TankTransferAuth] **PUMP AUTHORIZED** ✅ - Transaction ID: {TransactionId}",
                    confirmation.Transaction);

                // **STEP 5: STORE TRANSFER CONTEXT IN REDIS**
                _logger.LogInformation("[TankTransferAuth] **STEP 5** - Storing transfer context in Redis");

                var transferContext = new
                {
                    DeviceId = request.DeviceId,
                    TransactionId = confirmation.Transaction,
                    PumpId = request.PumpId,
                    SourceTankId = request.SourceTankId,
                    DestinationTankId = request.DestinationTankId,
                    Volume = request.Volume,
                    Reason = request.Reason,
                    UserId = request.UserId,
                    IsTransferMode = true, // **CRITICAL FLAG** - Tells EOT processing this is a transfer
                    AuthorizedAt = DateTime.UtcNow,
                    StartTime = DateTime.UtcNow,
                    VehicleId = (int?)null, // Explicitly NULL for transfers
                    Tag = (string?)null     // Explicitly NULL for transfers
                };

                var redisKey = $"device:{request.DeviceId}:transaction:{confirmation.Transaction}";
                var contextJson = JsonSerializer.Serialize(transferContext);

                // Store with 2-hour expiry (longer than vehicle fueling due to large transfer volumes)
                await _redisDb.StringSetAsync(redisKey, contextJson, expiry: TimeSpan.FromHours(2));

                _logger.LogInformation(
                    "[TankTransferAuth] **CONTEXT STORED** ✅ - Redis key: {RedisKey}, IsTransferMode: true",
                    redisKey);

                // **STEP 6: UPDATE AUTHORIZATION STATE TRACKER**
                var authState = new AuthState
                {
                    DeviceId = request.DeviceId,
                    PumpId = request.PumpId,
                    TagId = null, // NO TAG for transfers
                    NozzleId = request.Nozzle,
                    ExpiresAt = DateTime.UtcNow.AddHours(2),
                    Status = "Authorized",
                    TransactionId = confirmation.Transaction,
                    AuthorizedAt = DateTime.UtcNow,
                    AuthorizedAmount = (decimal)request.Volume
                };

                await _authTracker.SetAuthorized(request.DeviceId, request.Nozzle, authState);

                _logger.LogInformation(
                    "[TankTransferAuth] **TRANSFER AUTHORIZED** ✅ - Device {DeviceId}, Pump {PumpId}, Transaction {TransactionId}, Source Tank {SourceTank} -> Dest Tank {DestTank}, Volume: {Volume} L",
                    request.DeviceId, request.PumpId, confirmation.Transaction, request.SourceTankId, request.DestinationTankId, request.Volume);

                return FMSResponse<PumpAuthorizeConfirmation>.Success(
                    confirmation,
                    $"Tank transfer authorized: {request.Volume} L from Tank {request.SourceTankId} to Tank {request.DestinationTankId}");
            }
            catch (PTSDeviceException ex)
            {
                _logger.LogError(ex, "[TankTransferAuth] **PTS DEVICE ERROR** - {ErrorType}", ex.ErrorType);
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
                _logger.LogError(ex, "[TankTransferAuth] **UNEXPECTED ERROR** - Device {DeviceId}, Pump {PumpId}",
                    request.DeviceId, request.PumpId);
                throw;
            }
        }

        private async Task<FMSResponse> ValidateRequest(PumpAuthorizeTransferCommand request)
        {
            var validationErrors = new List<string>();

            // Basic input validation
            if (string.IsNullOrEmpty(request.DeviceId))
                validationErrors.Add("Device ID is required");

            if (request.PumpId <= 0 || request.PumpId > 20)
                validationErrors.Add("Invalid pump ID (must be between 1 and 20)");

            if (request.SourceTankId <= 0)
                validationErrors.Add("Source tank ID is required");

            if (request.DestinationTankId <= 0)
                validationErrors.Add("Destination tank ID is required");

            if (request.SourceTankId == request.DestinationTankId)
                validationErrors.Add("Source and destination tanks must be different");

            if (request.Volume <= 0)
                validationErrors.Add("Transfer volume must be greater than 0");

            if (request.Nozzle <= 0)
                validationErrors.Add("Nozzle number is required");

            // Device validation
            if (!string.IsNullOrEmpty(request.DeviceId))
            {
                var device = await _context.Ptsdevices.FirstOrDefaultAsync(d => d.Ptsid == request.DeviceId);
                if (device == null)
                {
                    validationErrors.Add("Device not found");
                }
                else if (device.IsAuthenticated == 0)
                {
                    validationErrors.Add("Device not authorized");
                }
            }

            // Source tank validation
            if (request.SourceTankId > 0)
            {
                var sourceTank = await _context.Tanks
                    .Include(t => t.Site)
                    .FirstOrDefaultAsync(t => t.Id == request.SourceTankId);

                if (sourceTank == null)
                {
                    validationErrors.Add("Source tank not found");
                }
                else
                {
                    // Check sufficient stock
                    var currentStock = sourceTank.CurrentStock ?? 0;
                    if (currentStock < (decimal)request.Volume)
                    {
                        validationErrors.Add(
                            $"Insufficient stock in source tank. Available: {currentStock:F2} L, Requested: {request.Volume:F2} L");
                    }

                    // Check tank capacity for destination
                    if (request.DestinationTankId > 0)
                    {
                        var destTank = await _context.Tanks.FirstOrDefaultAsync(t => t.Id == request.DestinationTankId);
                        if (destTank == null)
                        {
                            validationErrors.Add("Destination tank not found");
                        }
                        // NOTE: Removed same-site, fuel grade, and capacity validations
                        // These checks are removed to allow flexibility in tank transfers
                    }
                }
            }

            if (validationErrors.Any())
            {
                return FMSResponse.ValidationFailed(validationErrors);
            }

            return FMSResponse.SuccessResponse("Validation passed");
        }
    }
}
