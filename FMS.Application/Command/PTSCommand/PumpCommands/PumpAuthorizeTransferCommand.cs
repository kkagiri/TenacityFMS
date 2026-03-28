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
using FMS.Application.Features.PTS.Services;
using FMS.Application.Infrastructure.DistCacheTracker;
using FMS.Application.Infrastructure.Expections.Base;
using FMS.Application.PTSServices.PumpService;
using FMS.Domain.Entities;
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

                // **STEP 2.5: OPENING STOCK VALIDATION FOR BOTH TANKS**
                // Ensure both source and destination tanks have opening stock recorded for today
                // This prevents automated transfer transactions from creating ledger entries when opening stock hasn't been established
                // CRITICAL: This validation applies to ALL tanks, not just UseBookKeeping tanks
                _logger.LogInformation("[TankTransferAuth] **STEP 2.5** - Validating opening stock for both tanks");

                var sourceTank = await _context.Tanks.FindAsync(new object[] { request.SourceTankId }, CancellationToken.None);
                var destinationTank = await _context.Tanks.FindAsync(new object[] { request.DestinationTankId }, CancellationToken.None);
                var today = DateTime.UtcNow.Date;

                // Check source tank opening stock - applies to ALL tanks
                if (sourceTank != null)
                {
                    var hasSourceOpeningStock = await _context.TankVolumeHistories
                        .AnyAsync(tvh =>
                            tvh.TankId == request.SourceTankId &&
                            tvh.Timestamp.Date == today &&
                            tvh.ChangeReason == Domain.Entities.enums.VolumeChangeReasonEnum.OpeningStock &&
                            tvh.IsDeleted != true,
                            cancellationToken);

                    if (!hasSourceOpeningStock)
                    {
                        _logger.LogWarning(
                            "[TankTransferAuth] ⚠️ SOURCE TANK OPENING STOCK NOT FOUND - Tank {TankId} ({TankName}) requires opening stock for {Date}. UseBookKeeping={UseBookKeeping}",
                            sourceTank.Id, sourceTank.Name, today.ToString("yyyy-MM-dd"), sourceTank.UseBookKeeping);

                        return FMSResponse<PumpAuthorizeConfirmation>.ValidationFailed(
                            new List<string>
                            {
                                $"⚠️ Opening stock not recorded for SOURCE tank '{sourceTank.Name}' on {today:yyyy-MM-dd}",
                                "Opening stock must be recorded for both tanks before automated transfer can begin.",
                                "Please record today's opening stock in the Stock Management system first."
                            });
                    }
                }

                // Check destination tank opening stock - applies to ALL tanks
                if (destinationTank != null)
                {
                    var hasDestOpeningStock = await _context.TankVolumeHistories
                        .AnyAsync(tvh =>
                            tvh.TankId == request.DestinationTankId &&
                            tvh.Timestamp.Date == today &&
                            tvh.ChangeReason == Domain.Entities.enums.VolumeChangeReasonEnum.OpeningStock &&
                            tvh.IsDeleted != true,
                            cancellationToken);

                    if (!hasDestOpeningStock)
                    {
                        _logger.LogWarning(
                            "[TankTransferAuth] ⚠️ DESTINATION TANK OPENING STOCK NOT FOUND - Tank {TankId} ({TankName}) requires opening stock for {Date}. UseBookKeeping={UseBookKeeping}",
                            destinationTank.Id, destinationTank.Name, today.ToString("yyyy-MM-dd"), destinationTank.UseBookKeeping);

                        return FMSResponse<PumpAuthorizeConfirmation>.ValidationFailed(
                            new List<string>
                            {
                                $"⚠️ Opening stock not recorded for DESTINATION tank '{destinationTank.Name}' on {today:yyyy-MM-dd}",
                                "Opening stock must be recorded for both tanks before automated transfer can begin.",
                                "Please record today's opening stock in the Tank Management system first."
                            });
                    }
                }

                _logger.LogInformation("[TankTransferAuth] ✅ Opening stock validated for both tanks on {Date}", today.ToString("yyyy-MM-dd"));

                // **STEP 2.6: VALIDATE PHYSICAL AND BOOK STOCK LEVELS**
                // Prevent transfers when source tank has negative/zero physical stock or critically negative book stock
                if (sourceTank != null)
                {
                    var sourcePhysicalStock = sourceTank.PhysicalStockValue ?? 0;
                    var sourceCurrentStock = sourceTank.CurrentStock ?? 0;

                    // Check for zero/negative physical stock
                    if (sourcePhysicalStock <= 0)
                    {
                        _logger.LogError(
                            "[TankTransferAuth] 🚫 SOURCE TANK EMPTY - Tank {TankId} ({TankName}) has PhysicalStock={PhysicalStock:N0}L, CurrentStock={CurrentStock:N0}L",
                            sourceTank.Id, sourceTank.Name, sourcePhysicalStock, sourceCurrentStock);

                        return FMSResponse<PumpAuthorizeConfirmation>.ValidationFailed(
                            new List<string>
                            {
                                $"🚫 Source tank '{sourceTank.Name}' has no fuel available",
                                $"Physical Stock: {sourcePhysicalStock:N0} L, Book Stock: {sourceCurrentStock:N0} L",
                                "Please record a delivery before transfer can proceed."
                            });
                    }

                    // **NOTE: Book stock (CurrentStock) check removed - we only validate physical stock**
                    // Book stock may be out of sync due to missing opening stock entries
                    // Physical stock is the actual fuel level in the tank
                    const decimal NEGATIVE_STOCK_THRESHOLD = -1000;
                    if (sourceCurrentStock < NEGATIVE_STOCK_THRESHOLD)
                    {
                        // Log warning but don't block - physical stock is the source of truth
                        _logger.LogWarning(
                            "[TankTransferAuth] ⚠️ SOURCE BOOK STOCK NEGATIVE - Tank {TankId} ({TankName}) has CurrentStock={CurrentStock:N0}L. " +
                            "Transfer will proceed based on physical stock ({PhysicalStock:N0}L). Data reconciliation recommended.",
                            sourceTank.Id, sourceTank.Name, sourceCurrentStock, sourcePhysicalStock);
                    }
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

                _logger.LogInformation(
                    "[TankTransferAuth] Pump authorize request - Device {DeviceId}, Pump {PumpId}, Nozzle {Nozzle}, Dose {Dose}, AutoCloseTransaction {AutoCloseTransaction}, TransactionEnabled {TransactionEnabled}",
                    request.DeviceId,
                    request.PumpId,
                    request.Nozzle,
                    request.Volume,
                    pumpAuthorizeData.AutoCloseTransaction,
                    pumpAuthorizeData.TransactionEnabled);

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

                // Get fuel grade info from the source tank
                int? fuelGradeId = null;
                string? fuelGradeName = null;
                try
                {
                    // Get fuel grade from source tank
                    var sourceTankForFuelGrade = await _context.Tanks
                        .FirstOrDefaultAsync(t => t.Id == request.SourceTankId);
                    if (sourceTankForFuelGrade != null)
                    {
                        fuelGradeId = sourceTankForFuelGrade.FuelGradeId;
                        fuelGradeName = sourceTankForFuelGrade.FuelGradeName;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogDebug("[TankTransferAuth] Could not get fuel grade info: {Error}", ex.Message);
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

                var transferContext = new TransactionContext
                {
                    DeviceId = request.DeviceId,
                    TransactionId = confirmation.Transaction,
                    PumpId = request.PumpId,
                    TankId = request.SourceTankId,
                    TankName = sourceTank?.Name,
                    SourceTankId = request.SourceTankId,
                    SourceTankName = sourceTank?.Name,
                    DestinationTankId = request.DestinationTankId,
                    DestinationTankName = destinationTank?.Name,
                    Nozzle = request.Nozzle, // **ADDED** - Nozzle for pump transaction record
                    Volume = request.Volume,
                    Reason = request.Reason,
                    UserId = request.UserId,
                    UserName = userName,
                    FuelGradeId = fuelGradeId,     // **ADDED** - Fuel grade for pump transaction record
                    FuelGradeName = fuelGradeName, // **ADDED** - Fuel grade name for pump transaction record
                    IsTransferMode = true, // **CRITICAL FLAG** - Tells EOT processing this is a transfer
                    AuthorizedAt = DateTime.UtcNow,
                    StartTime = DateTime.UtcNow,
                    ConnectionType = string.Empty,
                    AutoCloseTransaction = false,
                    VehicleId = (int?)null, // Explicitly NULL for transfers
                    Tag = (string?)null     // Explicitly NULL for transfers
                };

                var redisKey = $"device:{request.DeviceId}:transaction:{confirmation.Transaction}";
                var contextJson = JsonSerializer.Serialize(transferContext);

                // Store with 2-hour expiry (longer than vehicle fueling due to large transfer volumes)
                await _redisDb.StringSetAsync(redisKey, contextJson, expiry: TimeSpan.FromHours(2));

                _logger.LogInformation(
                    "[TankTransferAuth] **CONTEXT STORED** ✅ - Redis key: {RedisKey}, Tx {TransactionId}, SourceTank {SourceTankId}, DestinationTank {DestinationTankId}, Nozzle {Nozzle}, FuelGradeId {FuelGradeId}, FuelGrade {FuelGrade}, IsTransferMode {IsTransferMode}, AutoCloseTransaction {AutoCloseTransaction}, ConnectionType '{ConnectionType}', Reason '{Reason}'",
                    redisKey,
                    confirmation.Transaction,
                    request.SourceTankId,
                    request.DestinationTankId,
                    request.Nozzle,
                    fuelGradeId,
                    fuelGradeName,
                    transferContext.IsTransferMode,
                    transferContext.AutoCloseTransaction,
                    transferContext.ConnectionType,
                    transferContext.Reason);

                if (!transferContext.AutoCloseTransaction || string.IsNullOrWhiteSpace(transferContext.ConnectionType))
                {
                    _logger.LogWarning(
                        "[TankTransferAuth] Transfer context may require manual completion downstream - Tx {TransactionId}, AutoCloseTransaction {AutoCloseTransaction}, ConnectionType '{ConnectionType}'",
                        confirmation.Transaction,
                        transferContext.AutoCloseTransaction,
                        transferContext.ConnectionType);
                }

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

            // Tank validations - load both tanks with their relationships
            Tank? sourceTank = null;
            Tank? destTank = null;

            if (request.SourceTankId > 0)
            {
                sourceTank = await _context.Tanks
                    .Include(t => t.Site)
                    .FirstOrDefaultAsync(t => t.Id == request.SourceTankId);

                if (sourceTank == null)
                {
                    validationErrors.Add("Source tank not found");
                }
            }

            if (request.DestinationTankId > 0)
            {
                destTank = await _context.Tanks
                    .Include(t => t.Site)
                    .FirstOrDefaultAsync(t => t.Id == request.DestinationTankId);

                if (destTank == null)
                {
                    validationErrors.Add("Destination tank not found");
                }
            }

            // Perform detailed validations only if both tanks are found
            if (sourceTank != null && destTank != null)
            {
                // **VALIDATION 1: Source Tank PHYSICAL Stock Check**
                // PhysicalStockValue = what we "actually" have (real-time physical measurement)
                // CurrentStock = what we "should" have (book/ledger value for accounting)
                var physicalStock = sourceTank.PhysicalStockValue ?? 0;
                if (physicalStock < (decimal)request.Volume)
                {
                    validationErrors.Add(
                        $"⛽ Insufficient physical stock in source tank '{sourceTank.Name}'. Available: {physicalStock:N0} L, Requested: {request.Volume:N0} L");
                }

                // **VALIDATION 2: Destination Tank Capacity Check (using physical stock)**
                var destPhysicalStock = destTank.PhysicalStockValue ?? 0;
                var destCapacity = destTank.TankVolume;
                var destAvailableSpace = destCapacity - destPhysicalStock;

                if (destAvailableSpace < (decimal)request.Volume)
                {
                    validationErrors.Add(
                        $"⚠️ Destination tank '{destTank.Name}' has insufficient capacity. Available space: {destAvailableSpace:N0} L, Transfer volume: {request.Volume:N0} L");
                }

                // Also warn if transfer would fill tank above 95% (safety threshold)
                var destAfterTransfer = destPhysicalStock + (decimal)request.Volume;
                var destPercentAfter = (destAfterTransfer / destCapacity) * 100;
                if (destPercentAfter > 95)
                {
                    _logger.LogWarning(
                        "[TankTransferAuth] ⚠️ WARNING: Transfer will fill destination tank '{TankName}' to {Percent:F1}%",
                        destTank.Name, destPercentAfter);
                }

                // **VALIDATION 3: Minimum Transfer Volume (prevent trivial transfers)**
                const double MINIMUM_TRANSFER_VOLUME = 10.0; // 10 liters minimum
                if (request.Volume < MINIMUM_TRANSFER_VOLUME)
                {
                    validationErrors.Add(
                        $"Transfer volume must be at least {MINIMUM_TRANSFER_VOLUME:N0} L. Requested: {request.Volume:N1} L");
                }

                // **VALIDATION 4: Maximum Single Transfer Volume (safety limit)**
                const double MAXIMUM_SINGLE_TRANSFER = 20000.0; // 50,000 liters max per single transfer
                if (request.Volume > MAXIMUM_SINGLE_TRANSFER)
                {
                    validationErrors.Add(
                        $"Transfer volume exceeds maximum limit of {MAXIMUM_SINGLE_TRANSFER:N0} L. Please split into smaller transfers.");
                }

                // Log successful validation details
                if (!validationErrors.Any())
                {
                    _logger.LogInformation(
                        "[TankTransferAuth] ✅ Validation passed - Source: '{SourceTank}' (Physical: {SourceStock:N0}/{SourceCapacity:N0} L), Dest: '{DestTank}' (Physical: {DestStock:N0}/{DestCapacity:N0} L), Transfer: {Volume:N0} L",
                        sourceTank.Name, physicalStock, sourceTank.TankVolume,
                        destTank.Name, destPhysicalStock, destCapacity, request.Volume);
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
