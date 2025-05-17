using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Command.PTSCommand.PumpCommands;
using FMS.Application.Infrastructure.DistCacheTracker;
using FMS.Application.Queries.Database.FMSQuery.TagQueries;
using FMS.Domain.Entities.PTS.Enums;
using MediatR;
using Microsoft.Extensions.Logging;
using StackExchange.Redis; //Cursor

namespace FMS.Application.Events.Pump.Handler {
    public class RefuelingEventHandler : INotificationHandler<NozzleStateChangeEvent>, INotificationHandler<TagReadEvent>, INotificationHandler<PumpStateChangeEvent>, INotificationHandler<TransactionCompletedEvent> {

        private readonly IMediator _mediator;
        private readonly ILogger<RefuelingEventHandler> _logger;
        private readonly IAuthorizationStateTracker _authTracker;
        private readonly IDatabase _redisDb; //Cursor

        public RefuelingEventHandler (
            IMediator mediator,
            IAuthorizationStateTracker authTracker,
            IConnectionMultiplexer redisConnection, //Cursor
            ILogger<RefuelingEventHandler> logger) {
            _mediator = mediator;
            _authTracker = authTracker;
            _redisDb = redisConnection?.GetDatabase (); //Cursor
            _logger = logger;
        }

        public async Task Handle (NozzleStateChangeEvent notification, CancellationToken cancellationToken) {
            try {
                // Assuming NozzleStateChangeEvent has IsUp and NozzleId properties

                _logger.LogInformation ("Nozzle state changed for device {DeviceId}, pump {PumpId}, nozzle {NozzleId}. IsUp: {IsUp}", notification.DeviceId, notification.PumpId, notification.NozzleId, notification.IsUp);

                await _authTracker.UpdateNozzleState (notification.DeviceId, notification.PumpId, notification.NozzleId, notification.IsUp);
            } catch (System.Exception ex) {
                _logger.LogError (ex, "Error handling NozzleStateChangeEvent");
            }
        }

        public async Task Handle (TagReadEvent notification, CancellationToken cancellationToken) {
            _logger.LogInformation ("TagReadEvent received for Device: {DeviceId}, Pump: {PumpId}, Nozzle: {NozzleId}, Tag: {TagId}",
                notification.DeviceId, notification.PumpId, notification.NozzleId, notification.TagId);
            // UI-less auto-authorization logic was here, now commented out as per user instruction.
            await Task.CompletedTask;
        }

        public async Task Handle (PumpStateChangeEvent notification, CancellationToken cancellationToken) {
            try {
                int nozzleIdToUpdate = notification.NozzleId ?? 0;
                if (nozzleIdToUpdate <= 0) {
                    _logger.LogWarning ("PumpStateChangeEvent for Device {DeviceId}, Pump {PumpId} received with no specific NozzleId. Status: {State}. Auth state updates might be ambiguous.",
                        notification.DeviceId, notification.PumpId, notification.State);
                }

                _logger.LogInformation ("Pump state changed for device {DeviceId}, pump {PumpId}, Nozzle {NozzleId}, state {State}", notification.DeviceId, notification.PumpId, nozzleIdToUpdate, notification.State);

                if (nozzleIdToUpdate > 0) {
                    string newStatusForAuth = notification.State?.ToUpperInvariant () switch {
                        "IDLE" => "Idle",
                        "OFFLINE" => "Offline",
                        "FILLING" => "InProgress",
                        "AUTHORIZED" => "Authorized",
                        "ENDOFTRANSACTION" => "Completed",
                        _ => notification.State
                    };

                    var currentAuthState = await _authTracker.GetAuthorizationState (notification.DeviceId, nozzleIdToUpdate);
                    if (currentAuthState != null) {
                        await _authTracker.UpdateAuthState (notification.DeviceId, nozzleIdToUpdate, newStatusForAuth);
                    } else {
                        _logger.LogInformation ("No active AuthState found for Device {DeviceId}, Nozzle {NozzleId} during PumpStateChangeEvent to {State}. No state updated.",
                            notification.DeviceId, nozzleIdToUpdate, notification.State);
                    }

                    switch (notification.State?.ToUpperInvariant ()) {
                        case "IDLE":
                        case "OFFLINE":
                            await _authTracker.ClearAuthorization (notification.DeviceId, nozzleIdToUpdate);
                            _logger.LogInformation ("Auth cleared for Device {DeviceId}, Nozzle {NozzleId} due to state: {State}", notification.DeviceId, nozzleIdToUpdate, notification.State);
                            break;
                    }
                }
            } catch (System.Exception ex) {
                _logger.LogError (ex, "Error handling PumpStateChangeEvent");
            }
        }

        public async Task Handle (TransactionCompletedEvent notification, CancellationToken cancellationToken) {
            _logger.LogInformation ("TransactionCompletedEvent (FMS internal) for device {DeviceId}, pump {PumpId}, transaction {TransactionId}, Nozzle {NozzleId}",
                notification.DeviceId, notification.PumpId, notification.TrasactionId, notification.NozzleId);
            try {
                if (notification.NozzleId > 0) {
                    // Clear the authorization state
                    await _authTracker.ClearAuthorization (notification.DeviceId, notification.NozzleId ?? 0);
                    _logger.LogInformation ("Auth cleared via TransactionCompletedEvent for Device {DeviceId}, Nozzle {NozzleId}", notification.DeviceId, notification.NozzleId);

                    // Cursor: Mark the transaction as processed in Redis to prevent duplicate processing
                    await MarkTransactionAsProcessed (notification.DeviceId, notification.PumpId, notification.TrasactionId);
                } else {
                    _logger.LogWarning ("TransactionCompletedEvent for Device {DeviceId}, Pump {PumpId} has no NozzleId. Cannot clear specific AuthState.", notification.DeviceId, notification.PumpId);
                }

            } catch (System.Exception ex) {
                _logger.LogError (ex, "Error handling TransactionCompletedEvent (FMS internal)");
            }
        }

        //Cursor: New method to mark transaction as processed
        private async Task MarkTransactionAsProcessed (string deviceId, int pumpId, int? transactionId) {
            if (string.IsNullOrEmpty (deviceId) || pumpId <= 0)
                return;

            try {
                // Mark both the transaction context and EOT as processed
                if (transactionId.HasValue && transactionId.Value > 0) {
                    // Delete the transaction context - it's been handled
                    var transactionKey = $"device:{deviceId}:transaction:{transactionId}";
                    await _redisDb.KeyDeleteAsync (transactionKey);

                    _logger.LogDebug ("Deleted transaction context for Device {DeviceId}, Transaction {TransactionId}",
                        deviceId, transactionId);
                }

                // Mark EOT as processed to prevent duplicate handling
                var eotKey = $"device:{deviceId}:eot:pump:{pumpId}:processed";
                await _redisDb.StringSetAsync (eotKey, System.DateTime.UtcNow.ToString ("o"), System.TimeSpan.FromMinutes (5));

                _logger.LogDebug ("Marked EOT as processed for Device {DeviceId}, Pump {PumpId}",
                    deviceId, pumpId);
            } catch (System.Exception ex) {
                _logger.LogError (ex, "Error marking transaction as processed in Redis for Device {DeviceId}, Pump {PumpId}, Transaction {TransactionId}",
                    deviceId, pumpId, transactionId);
                // Don't throw - best effort
            }
        }
    }
}