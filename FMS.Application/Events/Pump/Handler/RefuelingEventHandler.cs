using System.Threading;
using System.Threading.Tasks;
using MediatR;
using FMS.Application.Infrastructure.DistCacheTracker;
using Microsoft.Extensions.Logging;
using FMS.Application.Command.PTSCommand.TagCommands;
using FMS.Application.Command.PTSCommand.PumpCommands;
using FMS.Domain.Entities.PTS.Enums;

namespace FMS.Application.Events.Pump.Handler
{
    public class RefuelingEventHandler : INotificationHandler<NozzleStateChangeEvent>, INotificationHandler<TagReadEvent>, INotificationHandler<PumpStateChangeEvent>, INotificationHandler<TransactionCompletedEvent>
    {

        private readonly IMediator _mediator;
        private readonly ILogger<RefuelingEventHandler> _logger;
        private readonly IAuthorizationStateTracker _authTracker;

        public RefuelingEventHandler(IMediator mediator, IAuthorizationStateTracker authTracker, ILogger<RefuelingEventHandler> logger)
        {
            _mediator = mediator;
            _authTracker = authTracker;
            _logger = logger;
        }


        public async Task Handle(NozzleStateChangeEvent notification, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation("Nozzle state changed for device {DeviceId}, pump {PumpId}, nozzle {NozzleId}", notification.DeviceId, notification.PumpId, notification.NozzleId);

                await _authTracker.UpdateNozzleState(notification.DeviceId, notification.PumpId, notification.NozzleId, true);
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Error handling NozzleStateChangeEvent");
                return;
            }
        }

        public async Task Handle(TagReadEvent notification, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation("Tag read for device {DeviceId}, pump {PumpId}, nozzle {NozzleId}, tag {TagId}", notification.DeviceId, notification.PumpId, notification.NozzleId, notification.TagId);
                var IsNozzleUp = await _authTracker.IsNozzleUp(notification.DeviceId, notification.PumpId);

                if (!IsNozzleUp)
                {
                    _logger.LogInformation("Nozzle is not up for device {DeviceId}, pump {PumpId}", notification.DeviceId, notification.PumpId);
                    return;
                }
                //check if the pump is authorized
                if (await _authTracker.IsAuthorized(notification.DeviceId, notification.NozzleId))
                {
                    _logger.LogInformation(
                    "Tag read ignored - pump already authorized for device {DeviceId}, pump {PumpId}",
                    notification.DeviceId, notification.PumpId);
                    return;
                }
                //authorize the Tag

                var tagAuthentication = await _mediator.Send(new AuthenticateTagCommand(notification.TagId), cancellationToken);

                if (!tagAuthentication.IsAuthenticated)
                {
                    _logger.LogInformation("Tag read ignored - tag not authenticated for device {DeviceId}, pump {PumpId}", notification.DeviceId, notification.PumpId);
                    return;
                }
                var authorizeCommand = new PumpAuthorizeCommand
                {
                    DeviceId = notification.DeviceId,
                    PumpId = notification.PumpId,
                    Tag = notification.TagId,
                    Type = PumpAuthorizeType.VOLUME,
                    Dose = (double)tagAuthentication.dose,
                    AutoCloseTransaction = true,
                    TransactionEnabled = true
                };

                var result = await _mediator.Send(authorizeCommand, cancellationToken);

                if (result == null)
                {
                    _logger.LogInformation("Tag read ignored - pump not authorized for device {DeviceId}, pump {PumpId}", notification.DeviceId, notification.PumpId);
                    return;
                }

                _logger.LogInformation("Pump authorized for device {DeviceId}, pump {PumpId}", notification.DeviceId, notification.PumpId);


            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Error handling TagReadEvent");
                return;
            }
        }



        public async Task Handle(PumpStateChangeEvent notification, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation("Pump state changed for device {DeviceId}, pump {PumpId}, state {State}", notification.DeviceId, notification.PumpId, notification.State);

                await _authTracker.UpdateAuthState(notification.DeviceId, notification.PumpId, notification.State);

                switch (notification.State.ToUpper())
                {
                    case "IDLE":
                        await _authTracker.ClearAuthorization(notification.DeviceId, notification.PumpId);
                        break;
                    case "OFFLINE":
                        await _authTracker.ClearAuthorization(notification.DeviceId, notification.PumpId);
                        break;
                    case "FILLING":
                        //trigger the pump to start filling
                        break;


                    default:
                        break;
                }
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Error handling PumpStateChangeEvent");
                return;
            }
        }
        public async Task Handle(TransactionCompletedEvent notification, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation("Transaction completed for device {DeviceId}, pump {PumpId}, transaction {TransactionId}", notification.DeviceId, notification.PumpId, notification.TrasactionId);
                await _authTracker.ClearAuthorization(notification.DeviceId, notification.PumpId);

                //Update the transaction Record
                //var transaction = await _mediator.Send(new GetTransactionByIdQuery(notification.TransactionId), cancellationToken);
                //

            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Error handling TransactionCompletedEvent");
                return;
            }
        }
    }
}