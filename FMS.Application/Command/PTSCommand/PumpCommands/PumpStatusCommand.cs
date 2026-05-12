using FMS.Application.Common;
using FMS.Application.PTSServices.PumpService;
using MediatR;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Command.PTSCommand.PumpCommands
{
    public record PumpStatusCommand(string DeviceId, int PumpId) : IRequest<FMSResponseMessage<object>>;

    public class PumpStatusCommandHandler : IRequestHandler<PumpStatusCommand, FMSResponseMessage<object>>
    {
        private readonly ILogger<PumpStatusCommandHandler> _logger;
        private readonly IPumpService _pumpService;

        public PumpStatusCommandHandler(IPumpService pumpService, ILogger<PumpStatusCommandHandler> logger)
        {
            _pumpService = pumpService;
            _logger = logger;
        }

        public async Task<FMSResponseMessage<object>> Handle(PumpStatusCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _pumpService.GetPumpStatusAsync(request.DeviceId, request.PumpId);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing Pump.Status.Command");
                return new FMSResponseMessage<object>(false, "Error processing PumpStatus", null);
            }
        }
    }
}
