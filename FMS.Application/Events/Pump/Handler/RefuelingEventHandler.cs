//For the moment, the refueling event handler is not used.
// using System.Threading;
// using System.Threading.Tasks;
// using FMS.Application.Command.PTSCommand.PumpCommands;
// using FMS.Application.Infrastructure.DistCacheTracker;
// using FMS.Application.Queries.Database.FMSQuery.TagQueries;
// using FMS.Domain.Entities.PTS.Enums;
// using MediatR;
// using Microsoft.Extensions.Logging;

// namespace FMS.Application.Events.Pump.Handler {
//     public class RefuelingEventHandler : INotificationHandler<NozzleStateChangeEvent>, INotificationHandler<TagReadEvent>, INotificationHandler<PumpStateChangeEvent>, INotificationHandler<TransactionCompletedEvent> {

//         private readonly IMediator _mediator;
//         private readonly ILogger<RefuelingEventHandler> _logger;
//         private readonly IAuthorizationStateTracker _authTracker;

//         public RefuelingEventHandler (IMediator mediator, IAuthorizationStateTracker authTracker, ILogger<RefuelingEventHandler> logger) {
//             _mediator = mediator;
//             _authTracker = authTracker;
//             _logger = logger;
//         }

//         public async Task Handle (NozzleStateChangeEvent notification, CancellationToken cancellationToken) {
//             try {
//                 // Assuming NozzleStateChangeEvent has IsUp and NozzleId properties

//                 _logger.LogInformation ("Nozzle state changed for device {DeviceId}, pump {PumpId}, nozzle {NozzleId}. IsUp: {IsUp}", notification.DeviceId, notification.PumpId, notification.NozzleId, notification.IsUp);

//                 await _authTracker.UpdateNozzleState (notification.DeviceId, notification.PumpId, notification.NozzleId, notification.IsUp);
//             } catch (System.Exception ex) {
//                 _logger.LogError (ex, "Error handling NozzleStateChangeEvent");
//             }
//         }

//         public async Task Handle (TagReadEvent notification, CancellationToken cancellationToken) {
//             _logger.LogInformation ("TagReadEvent received for Device: {DeviceId}, Pump: {PumpId}, Nozzle: {NozzleId}, Tag: {TagId}",
//                 notification.DeviceId, notification.PumpId, notification.NozzleId, notification.TagId);
//             // UI-less auto-authorization logic was here, now commented out as per user instruction.
//             await Task.CompletedTask;
//         }

//         public async Task Handle (PumpStateChangeEvent notification, CancellationToken cancellationToken) {
//             try {
//                 int nozzleIdToUpdate = notification.NozzleId ?? 0;
//                 if (nozzleIdToUpdate <= 0) {
//                     _logger.LogWarning ("PumpStateChangeEvent for Device {DeviceId}, Pump {PumpId} received with no specific NozzleId. Status: {State}. Auth state updates might be ambiguous.",
//                         notification.DeviceId, notification.PumpId, notification.State);
//                 }

//                 _logger.LogInformation ("Pump state changed for device {DeviceId}, pump {PumpId}, Nozzle {NozzleId}, state {State}", notification.DeviceId, notification.PumpId, nozzleIdToUpdate, notification.State);

//                 if (nozzleIdToUpdate > 0) {
//                     string newStatusForAuth = notification.State?.ToUpperInvariant () switch {
//                         "IDLE" => "Idle",
//                         "OFFLINE" => "Offline",
//                         "FILLING" => "InProgress",
//                         "AUTHORIZED" => "Authorized",
//                         "ENDOFTRANSACTION" => "Completed",
//                         _ => notification.State
//                     };

//                     var currentAuthState = await _authTracker.GetAuthorizationState (notification.DeviceId, nozzleIdToUpdate);
//                     if (currentAuthState != null) {
//                         await _authTracker.UpdateAuthState (notification.DeviceId, nozzleIdToUpdate, newStatusForAuth);
//                     } else {
//                         _logger.LogInformation ("No active AuthState found for Device {DeviceId}, Nozzle {NozzleId} during PumpStateChangeEvent to {State}. No state updated.",
//                             notification.DeviceId, nozzleIdToUpdate, notification.State);
//                     }

//                     switch (notification.State?.ToUpperInvariant ()) {
//                         case "IDLE":
//                         case "OFFLINE":
//                             await _authTracker.ClearAuthorization (notification.DeviceId, nozzleIdToUpdate);
//                             _logger.LogInformation ("Auth cleared for Device {DeviceId}, Nozzle {NozzleId} due to state: {State}", notification.DeviceId, nozzleIdToUpdate, notification.State);
//                             break;
//                     }
//                 }
//             } catch (System.Exception ex) {
//                 _logger.LogError (ex, "Error handling PumpStateChangeEvent");
//             }
//         }
//         public async Task Handle (TransactionCompletedEvent notification, CancellationToken cancellationToken) {
//             _logger.LogInformation ("TransactionCompletedEvent (FMS internal) for device {DeviceId}, pump {PumpId}, transaction {TransactionId}, Nozzle {NozzleId}",
//                 notification.DeviceId, notification.PumpId, notification.TrasactionId, notification.NozzleId);
//             try {
//                 if (notification.NozzleId > 0) {
//                     await _authTracker.ClearAuthorization (notification.DeviceId, notification.NozzleId ?? 0);
//                     _logger.LogInformation ("Auth cleared via TransactionCompletedEvent for Device {DeviceId}, Nozzle {NozzleId}", notification.DeviceId, notification.NozzleId);
//                 } else {
//                     _logger.LogWarning ("TransactionCompletedEvent for Device {DeviceId}, Pump {PumpId} has no NozzleId. Cannot clear specific AuthState.", notification.DeviceId, notification.PumpId);
//                 }

//             } catch (System.Exception ex) {
//                 _logger.LogError (ex, "Error handling TransactionCompletedEvent (FMS internal)");
//             }
//         }
//     }
// }