/// <summary>
/// Handles pump authorization requests from the frontend/UI. Validates the request, checks and sets authorization state using AuthorizationStateTracker,
/// and calls the pump service to authorize the pump. This is the main entry point for UI-driven fueling operations.
/// </summary>
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Helpers;
using FMS.Application.Infrastructure.DistCacheTracker;
using FMS.Application.Infrastructure.Expections.Base;
using FMS.Application.PTSServices.PumpService;
using FMS.Application.Queries.Database.FMSQuery.TagQueries;
using FMS.Domain.Entities.PTS;
using FMS.Domain.Entities.PTS.Enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;
using StackExchange.Redis; //Cursor

namespace FMS.Application.Command.PTSCommand.PumpCommands {
    public record PumpAuthorizeCommand : IRequest<FMSResponseMessage<PumpAuthorizeConfirmation>> {

        public string? DeviceId { get; set; }
        public int PumpId { get; set; } = 0;

        public double? Dose { get; set; }
        public NozzleOrFuelIdSelector NozzleOrFuelIdSelector { get; set; }
        public int Nozzle { get; set; } = 0;
        public List<int> ? Nozzles { get; set; }
        public int? FuelGradeId { get; set; }
        public bool PriceEnabled { get; set; }
        public PumpAuthorizeType Type { get; set; }
        public bool AutoCloseTransaction { get; set; }
        public bool TransactionEnabled { get; set; }
        public int Transaction { get; set; }
        public string? Tag { get; set; }
        public int? TankId { get; set; }

        public int? VehicleId { get; set; }

    }

    public class PumpAuthorizeCommandHandler : IRequestHandler<PumpAuthorizeCommand, FMSResponseMessage<PumpAuthorizeConfirmation>> {

        private readonly GpsdataContext _context;
        private readonly ILogger<PumpAuthorizeCommandHandler> _logger;
        private readonly IAuthorizationStateTracker _authTracker;
        private readonly IMediator _mediator;

        private readonly IPumpService _pumpService;
        private readonly IDatabase _redisDb; //Cursor

        public PumpAuthorizeCommandHandler (
            IAuthorizationStateTracker authstatetracker,
            IMediator mediator,
            GpsdataContext context,
            IPumpService pumpService,
            IConnectionMultiplexer redisConnection, //Cursor
            ILogger<PumpAuthorizeCommandHandler> logger) {
            _authTracker = authstatetracker;
            _mediator = mediator;
            _context = context;
            _pumpService = pumpService;
            _redisDb = redisConnection.GetDatabase (); //Cursor
            _logger = logger;
        }

        public async Task<FMSResponseMessage<PumpAuthorizeConfirmation>> Handle (PumpAuthorizeCommand request, CancellationToken cancellationToken) {
            try {

                // Determine NozzleOrFuelIdSelector based on provided inputs
                if (request.Nozzle > 0) {
                    request = request with { NozzleOrFuelIdSelector = NozzleOrFuelIdSelector.NOZZLE };
                } else if (request.Nozzles != null && request.Nozzles.Any ()) {
                    request = request with { NozzleOrFuelIdSelector = NozzleOrFuelIdSelector.NOZZLES };
                } else if (request.FuelGradeId.HasValue && request.FuelGradeId > 0) {
                    request = request with { NozzleOrFuelIdSelector = NozzleOrFuelIdSelector.FUELGRADEID };
                } else {
                    // If PTS relies on nozzle up event without explicit nozzle/fuel grade, this might be NONE.
                    // For now, this path might indicate an issue if explicit selection is expected.
                    // The frontend payload has nozzle:1, so NOZZLE will be chosen.
                    request = request with { NozzleOrFuelIdSelector = NozzleOrFuelIdSelector.NONE }; // Defaulting or could be an error
                }

                //1. validate Request
                if (!await ValidateRequest (request)) {
                    _logger.LogError ("Invalid request for authorizing pump {PumpId} for device {DeviceId}", request.PumpId, request.DeviceId);
                    return new FMSResponseMessage<PumpAuthorizeConfirmation> (false, "Invalid request", null!);
                }

                //2. check if alread authorized
                //Cursor: Using request.Nozzle for auth tracker key. If selector is FuelGradeId, this might need adjustment
                // or ensure Nozzle is always resolved if FuelGradeId is used for authorization.
                // For now, assuming request.Nozzle is the key for _authTracker if applicable.
                var nozzleToCheck = request.Nozzle;

                if (request.NozzleOrFuelIdSelector == NozzleOrFuelIdSelector.FUELGRADEID && request.Nozzle <= 0) {
                    // If authorizing by FuelGradeID and no specific nozzle given in request,
                    // this check might not be applicable in its current form or _authTracker needs a different key.
                    // For now, this implies a specific nozzle must eventually be identified for tracking.
                    // This area might need refinement based on how FuelGradeId auth translates to a physical nozzle for tracking.
                }

                if (nozzleToCheck > 0 && await _authTracker.IsAuthorized (request.DeviceId!, nozzleToCheck)) {
                    _logger.LogInformation ("Pump {PumpId} already authorized for device {DeviceId}", request.PumpId, request.DeviceId);
                    return new FMSResponseMessage<PumpAuthorizeConfirmation> (true, "Pump already authorized", null!);
                }

                //3. Aunthicate the tag if Provide

                decimal? effectiveDoseForAuthTracking = null;
                AuthenticateTagResult tagAuthentication = null;

                if (!string.IsNullOrEmpty (request.Tag)) {

                    tagAuthentication = await _mediator.Send (new AuthenticateTagQuery (request.Tag), cancellationToken);

                    if (tagAuthentication == null || !tagAuthentication.IsAuthenticated) {
                        _logger.LogInformation ("Tag read ignored - tag not authenticated for device {DeviceId}, pump {PumpId}", request.DeviceId, request.PumpId);
                        return new FMSResponseMessage<PumpAuthorizeConfirmation> (false, "Tag not authenticated", null!);
                    }

                    //use the tag dose limit if not provided, or use the lower value if both are provided
                    if (!request.Dose.HasValue) {
                        request = request with { Dose = (double) tagAuthentication.dose };
                    } else if (tagAuthentication.dose < (decimal) request.Dose.Value) {
                        // Use the lower of tag limit and request dose for safety
                        _logger.LogInformation ("Limiting dose to tag limit: {TagLimit} (requested: {RequestedDose}) for device {DeviceId}, pump {PumpId}",
                            tagAuthentication.dose, request.Dose.Value, request.DeviceId, request.PumpId);
                        request = request with { Dose = (double) tagAuthentication.dose };
                    }
                }

                var pumpAuthorizeData = new PumpAuthorizeData {
                    Pump = request.PumpId,
                    NozzleOrFuelIdSelector = request.NozzleOrFuelIdSelector,
                    Nozzle = request.Nozzle,
                    Nozzles = request.Nozzles,
                    FuelGradeId = request.FuelGradeId ?? 0,
                    PriceEnabled = request.PriceEnabled,
                    Type = request.Type,
                    Dose = request.Dose ?? 0,
                    AutoCloseTransaction = request.AutoCloseTransaction,
                    TransactionEnabled = request.TransactionEnabled,
                    Transaction = PacketIdGenerator.GetNextId (),
                    Tag = request.Tag,

                };

                var confirmation = await _pumpService.PumpAuthorizeAsync (request.DeviceId!, pumpAuthorizeData);

                //log the confirmation
                if (confirmation != null) {
                    _logger.LogInformation ("Pump {PumpId} authorized successfully for device {DeviceId}. Transaction: {TransactionId}", request.PumpId, request.DeviceId, confirmation.Transaction);

                    var authState = new AuthState {
                        DeviceId = request.DeviceId!,
                        PumpId = request.PumpId,
                        TagId = request.Tag,
                        NozzleId = request.Nozzle,
                        ExpiresAt = DateTime.UtcNow.AddMinutes (5),
                        Status = "Authorized",
                        TransactionId = confirmation.Transaction,
                        AuthorizedAt = DateTime.UtcNow,
                        AuthorizedAmount = (decimal) (request.Dose ?? 0)
                    };

                    await _authTracker.SetAuthorized (request.DeviceId!, request.Nozzle, authState);

                    //Cursor: Store transaction context in Redis for later correlation
                    await StoreTransactionContextInRedis (request.DeviceId!, confirmation.Transaction, request.TankId, request.VehicleId);

                    return new FMSResponseMessage<PumpAuthorizeConfirmation> (true, "Pump authorized", confirmation);
                }

                return new FMSResponseMessage<PumpAuthorizeConfirmation> (false, "Pump not authorized", null!);
            } catch (PTSDeviceException ex) {
                _logger.LogError (ex, "PTS device error while authorizing pump {PumpId} for device {DeviceId}",
                    request.PumpId, request.DeviceId);
                return new FMSResponseMessage<PumpAuthorizeConfirmation> (false, ex.Message, null!);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error while authorizing pump {PumpId} for device {DeviceId}",
                    request.PumpId, request.DeviceId);
                throw;
            }
        }

        //Cursor: New method to store transaction context in Redis
        private async Task StoreTransactionContextInRedis (string deviceId, int transactionId, int? tankId, int? vehicleId) {
            try {
                var transactionContext = new {
                    DeviceId = deviceId,
                    TransactionId = transactionId,
                    TankId = tankId,
                    VehicleId = vehicleId,
                    AuthorizedAt = DateTime.UtcNow
                };

                var redisKey = $"device:{deviceId}:transaction:{transactionId}";
                var contextJson = JsonSerializer.Serialize (transactionContext);

                // Store with 24 hour expiry to ensure it doesn't stay forever if transaction never completes
                await _redisDb.StringSetAsync (redisKey, contextJson, expiry : TimeSpan.FromHours (24));

                _logger.LogInformation ("Stored transaction context in Redis for device {DeviceId}, transaction {TransactionId}",
                    deviceId, transactionId);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error storing transaction context in Redis for device {DeviceId}, transaction {TransactionId}",
                    deviceId, transactionId);
                // Don't rethrow - we still want to continue even if Redis storage fails
            }
        }

        //TODO: change this to use FluentValidation

        private async Task<bool> ValidateRequest (PumpAuthorizeCommand request) {
            if (string.IsNullOrEmpty (request.DeviceId)) return false;
            //validate if tankID and VehicleId provide are available in _context
            if (request.TankId.HasValue && !_context.Tanks.Any (t => t.Id == request.TankId.Value)) return false;
            if (request.VehicleId.HasValue && !_context.Vehicles.Any (v => v.VehicleId == request.VehicleId.Value)) return false;

            if (request.PumpId <= 0 || request.PumpId > 50) return false;

            if (request.Dose <= 0) return false;
            if (request.NozzleOrFuelIdSelector == NozzleOrFuelIdSelector.NOZZLE && request.Nozzle <= 0) return false;
            if (request.NozzleOrFuelIdSelector == NozzleOrFuelIdSelector.FUELGRADEID && request.FuelGradeId <= 0) return false;
            return true;
        }
    }
}