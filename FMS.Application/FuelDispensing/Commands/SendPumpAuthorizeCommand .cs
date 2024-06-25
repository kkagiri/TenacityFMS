using FMS.PTS;
using FMS.PTS.DataStruct;
using FMS.PTS.DataStruct.enums;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.FuelDispensing.Commands
{

    public record SendPumpAuthorizeCommand (PumpAuthorizeData PumpAuthorizeData) : IRequest<SendPumpAuthorizeResult>;
    public class SendPumpAuthorizeCommandHandler : IRequestHandler<SendPumpAuthorizeCommand, SendPumpAuthorizeResult>
    {
        private readonly Device _ptsDevice;


        public SendPumpAuthorizeCommandHandler(Device ptsDevice)
        {
            _ptsDevice = ptsDevice;
        }

        public async  Task<SendPumpAuthorizeResult> Handle(SendPumpAuthorizeCommand request, CancellationToken cancellationToken)
        {

            if (!_ptsDevice.IsOpened())
            {
                return new SendPumpAuthorizeResult(false, "PTS device is not opened");
            }

            if (!_ptsDevice.IsConnected())
            {
                return new SendPumpAuthorizeResult(false, "PTS device is not connected");
            }

           var result = _ptsDevice.PumpAuthorize(request.PumpAuthorizeData);

           if(result !=(int)TTResult.NO_ERROR)
            {
                return new SendPumpAuthorizeResult(false, $"Failed to send PumpAuthorize request. Error code: {result}");
            }


           result = _ptsDevice.ExecuteRequestsQueue();

            if (result != (int)TTResult.NO_ERROR)
            {
                return new SendPumpAuthorizeResult(false, $"Failed to execute PumpAuthorize request. Error code: {result}");
            }

            // Handle the response from the PTS controller
            //response is received in the PumpAuthorize.Callback

             

            return new SendPumpAuthorizeResult(true, "Pump authorize command sent successfully");

        }
    }

    public record SendPumpAuthorizeResult(bool Success, string Message);

}
