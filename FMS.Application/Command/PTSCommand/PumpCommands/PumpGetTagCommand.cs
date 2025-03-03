///Completed

using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.PTS;
using FMS.Application.PTSServices.PumpService;
using FMS.PTS;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.PTSCommand.PumpCommands;

public record PumpGetTagCommand(int DeviceNo, int PumpNo, int NozzleNo) : IRequest<FMSResponseMessage<PumpTagResponseDTO>>;


public class PumpGetTagCommandHandler : IRequestHandler<PumpGetTagCommand, FMSResponseMessage<PumpTagResponseDTO>>
{
    private readonly IPumpService _pumpService;
    private readonly ILogger<PumpGetTagCommandHandler> _logger;


    public PumpGetTagCommandHandler(IPumpService pumpService, ILogger<PumpGetTagCommandHandler> logger)
    {
        _pumpService = pumpService;
        _logger = logger;
    }
    public async Task<FMSResponseMessage<PumpTagResponseDTO>> Handle(PumpGetTagCommand request, CancellationToken cancellationToken)
    {
        try
        {
            return await _pumpService.GetPumpTagAsync(request.DeviceNo.ToString(), request.PumpNo, request.NozzleNo);

        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting pump tag");
            return new FMSResponseMessage<PumpTagResponseDTO>(false, "Failed to get pump tag", null);
        }
    }
}


