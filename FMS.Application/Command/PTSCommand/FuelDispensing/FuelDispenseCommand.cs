using FMS.Application.Command.PTSCommand.TagCommands;
using FMS.Application.FuelDispensing.Commands;
using FMS.PTS.DataStruct;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Command.PTSCommand.FuelDispensing
{
    public record FuelDispenseCommand(string TagName, int PumpNumber, int NozzleNumber) : IRequest<FuelDispenseResult>;

    public class FuelDispenseCommandHandler : IRequestHandler<FuelDispenseCommand, FuelDispenseResult>
    {

        private readonly IMediator _mediator;

        public FuelDispenseCommandHandler(IMediator mediator)
        {
            _mediator = mediator;
        }
        public async Task<FuelDispenseResult> Handle(FuelDispenseCommand request, CancellationToken cancellationToken)
        {
            // Authenticate the tag
            var authenticateTagCommand = new AuthenticateTagCommand(request.TagName);
            var authResult = await _mediator.Send(authenticateTagCommand,cancellationToken);

            if (!authResult.IsAuthenticated)
            {
                //ToDo: notification not autheticated
            }

            // Tag is authorized, proceed to send authorization to PTS controller
            var pumpAuthorizeCommand = new SendPumpAuthorizeCommand(new PumpAuthorizeData
            {
                Pump = request.PumpNumber,
                Nozzle = request.NozzleNumber,
                Tag = authResult.Tag.Name,
                Dose = ((double)authResult.dose),
                Type = PTS.DataStruct.enums.PumpAuthorizeType.VOLUME
            });

            // Send the command and await the result
            var pumpAuthorizeResult = await _mediator.Send(pumpAuthorizeCommand, cancellationToken);

            // Now you can access Success and Message properties
            if (!pumpAuthorizeResult.Success)
            {
                return new FuelDispenseResult(false, pumpAuthorizeResult.Message);
            }

            // await _sendAuthorization(request.PumpNumber, request.NozzleNumber, authResult.Tag);

            return new FuelDispenseResult(true, "Fuel dispensed successfully");
        }
    }
    public record FuelDispenseResult(bool Success, string Message);
}
