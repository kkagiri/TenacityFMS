using System.Threading;
using System.Threading.Tasks;
using FMS.PTS;
using MediatR;

namespace FMS.Application.Command.PTSCommand;

public record PumpGetTagCommand (int PumpNumber, int NozzleNumber):IRequest<PumpGetTagResult>;


public class PumpGetTagCommandHandler : IRequestHandler<PumpGetTagCommand, PumpGetTagResult>
{

    private readonly PTSCommunicationService _ptsCommunicationService;
    

    public PumpGetTagCommandHandler(PTSCommunicationService pTSCommunicationService)
    {
        _ptsCommunicationService = pTSCommunicationService;
    }
    public async Task<PumpGetTagResult> Handle(PumpGetTagCommand request, CancellationToken cancellationToken)
    {
        throw new System.NotImplementedException();
        // var results =  _ptsCommunicationService.PumpGetTagCommand(request.PumpNumber,request.NozzleNumber);

        // return results, ?
        //         new PumpGetTagResult(true, results.)
        //         : new PumpGetTagResult(false, null, results.ErrorMessage);


    }
}


public record PumpGetTagResult(bool Success, string TagData, string ErrorMessage = null);