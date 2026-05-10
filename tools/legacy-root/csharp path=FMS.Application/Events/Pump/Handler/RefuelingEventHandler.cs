using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Command.PTSCommand.PumpCommands;
using FMS.Application.Infrastructure.DistCacheTracker;
using FMS.Application.Queries.Database.FMSQuery.TagQueries;
using FMS.Domain.Entities.PTS.Enums;
using MediatR;
using Microsoft.Extensions.Logging;

//Cursor: Assuming Event classes and IAuthorizationStateTracker will be updated to match usage.
namespace FMS.Application.Events.Pump.Handler {
    public class RefuelingEventHandler : INotificationHandler<NozzleStateChangeEvent>, INotificationHandler<TagReadEvent>, INotificationHandler<PumpStateChangeEvent>, INotificationHandler<TransactionCompletedEvent> {

        private readonly IMediator _mediator;
        private readonly ILogger<RefuelingEventHandler> _logger;
        private readonly IAuthorizationStateTracker _authTracker;

        public RefuelingEventHandler (IMediator mediator, IAuthorizationStateTracker authTracker, ILogger<RefuelingEventHandler> logger) {
            _mediator = mediator;
            _authTracker = authTracker;
            _logger = logger;
        }

        public async Task Handle (NozzleStateChangeEvent notification, CancellationToken cancellationToken) {
            try {
                // Assuming NozzleStateChangeEvent has IsUp and NozzleId properties
                _logger.LogInformation ("Nozzle state changed for device {DeviceId}, pump {PumpId}, nozzle {NozzleId}. IsUp: {IsUp}", notification.DeviceId, notification.PumpId, notification.NozzleId, notification.IsUp);

                await _authTracker.UpdateNozzleState (notification.DeviceId, notification.PumpId, notification.NozzleId, notification.IsUp);
            } catch (System.Exception ex) {
                _logger.LogError (ex, "Error handling NozzleStateChangeEvent for Device: {DeviceId}, Pump: {PumpId}, Nozzle: {NozzleId}", notification.DeviceId, notification.PumpId, notification.NozzleId);
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
                // Assuming PumpStateChangeEvent has a NozzleId property (nullable int)
                int nozzleIdToUpdate = notification.NozzleId ?? 0;

                _logger.LogInformation ("Pump state changed for device {DeviceId}, pump {PumpId}, Nozzle {NozzleId}, state {State}", notification.DeviceId, notification.PumpId, nozzleIdToUpdate, notification.State);

                if (nozzleIdToUpdate > 0) {
                    string newStatusForAuth = notification.State?.ToUpperInvariant () switch {
                        "IDLE" => "Idle",
                        "OFFLINE" => "Offline",
                        "FILLING" => "InProgress",
                        "AUTHORIZED" => "Authorized",
                        "ENDOFTRANSACTION" => "Completed", // This means PTS EOT, auth state still exists
                        _ => notification.State ?? "Unknown"
                    };

                    // Assuming IAuthorizationStateTracker has GetAuthState(string deviceId, int nozzleId)
                    var currentAuthState = await _authTracker.GetAuthState (notification.DeviceId, nozzleIdToUpdate);
                    if (currentAuthState != null) {
                        // UpdateAuthState should ideally take the new status and know how to update the existing AuthState object
                        // or allow passing the full AuthState. Let's assume it takes the new status string.
                        // The TransactionId from currentAuthState might be useful here if UpdateAuthState needs it.
                        await _authTracker.UpdateAuthState (notification.DeviceId, nozzleIdToUpdate, newStatusForAuth, currentAuthState.TransactionId);
                    } else {
                        _logger.LogInformation ("No active AuthState found for Device {DeviceId}, Nozzle {NozzleId} during PumpStateChangeEvent to {State}. No state updated in tracker.",
                            notification.DeviceId, nozzleIdToUpdate, notification.State);
                    }

                    switch (notification.State?.ToUpperInvariant ()) {
                        case "IDLE":
                        case "OFFLINE":
                            // If pump goes idle or offline, clear any specific auth state for that nozzle.
                            // This is important if the EOT from PTS was missed or if the pump is reset.
                            if (currentAuthState != null) // Only clear if it was previously authorized/in progress
                            {
                                await _authTracker.ClearAuthorization (notification.DeviceId, nozzleIdToUpdate);
                                _logger.LogInformation ("Auth cleared for Device {DeviceId}, Nozzle {NozzleId} due to state: {State}", notification.DeviceId, nozzleIdToUpdate, notification.State);
                            }
                            break;
                    }
                } else {
                    _logger.LogWarning ("PumpStateChangeEvent for Device {DeviceId}, Pump {PumpId} received with no specific NozzleId. Status: {State}. Auth state updates for tracker might be ambiguous.",
                        notification.DeviceId, notification.PumpId, notification.State);
                }
            } catch (System.Exception ex) {
                _logger.LogError (ex, "Error handling PumpStateChangeEvent for Device: {DeviceId}, Pump: {PumpId}, State: {State}", notification.DeviceId, notification.PumpId, notification.State);
            }
        }
        public async Task Handle (TransactionCompletedEvent notification, CancellationToken cancellationToken) {
            // Assuming TransactionCompletedEvent is an FMS-internal event published AFTER FuelRefil is successfully created
            // and it includes NozzleId to clear the specific AuthState.
            _logger.LogInformation ("TransactionCompletedEvent (FMS internal) for device {DeviceId}, pump {PumpId}, transaction {TransactionId}, Nozzle {NozzleId}",
                notification.DeviceId, notification.PumpId, notification.TrasactionId, notification.NozzleId);
            try {
                if (notification.NozzleId > 0) { // Assuming NozzleId is present
                    await _authTracker.ClearAuthorization (notification.DeviceId, notification.NozzleId);
                    _logger.LogInformation ("Auth cleared via TransactionCompletedEvent (FMS internal) for Device {DeviceId}, Nozzle {NozzleId}", notification.DeviceId, notification.NozzleId);
                } else {
                    _logger.LogWarning ("TransactionCompletedEvent (FMS internal) for Device {DeviceId}, Pump {PumpId} has no valid NozzleId. Cannot clear specific AuthState from tracker.", notification.DeviceId, notification.PumpId);
                }

            } catch (System.Exception ex) {
                _logger.LogError (ex, "Error handling TransactionCompletedEvent (FMS internal) for Device: {DeviceId}, Pump: {PumpId}, Transaction: {TransactionId}", notification.DeviceId, notification.PumpId, notification.TrasactionId);
            }
        }
    }
}