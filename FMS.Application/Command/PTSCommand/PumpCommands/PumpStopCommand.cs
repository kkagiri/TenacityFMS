using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.PTSServices.PumpService;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.PTSCommand.PumpCommands {
    public record PumpStopCommand (string DeviceId, int PumpId) : IRequest<FMSResponseMessage>;

    public class PumpStopCommandHandler : IRequestHandler<PumpStopCommand, FMSResponseMessage> {
        private readonly ILogger<PumpStopCommandHandler> _logger;
        private readonly IPumpService _pumpService;

        public PumpStopCommandHandler (IPumpService pumpService, ILogger<PumpStopCommandHandler> logger) {
            _pumpService = pumpService;
            _logger = logger;
        }

        public async Task<FMSResponseMessage> Handle (PumpStopCommand request, CancellationToken cancellationToken) {
            try {
                var result = await _pumpService.StopPumpAsync (request.DeviceId, request.PumpId);
                return new FMSResponseMessage (true, "PumpStop");

            } catch (Exception ex) {
                _logger.LogError (ex, "Error processing Pump.Stop.Command");
                return new FMSResponseMessage (false, "Error processing PumpStop");
            }
        }
    }

}