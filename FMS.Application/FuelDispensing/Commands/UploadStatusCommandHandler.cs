using FMS.Application.ModelsDTOs.ATG.Common;
using FMS.Domain.ATGStatus;
using FMS.PTS.Service;

//using FMS.Services.Helper;
using MediatR;
using Newtonsoft.Json.Linq;
using System;

using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.FuelDispensing.Commands
{

    public class UploadStatusCommand : IRequest<UploadStatus>
    {
        public JToken Data { get; set; }
    }

    public class UploadStatusCommandHandler : IRequestHandler<UploadStatusCommand, UploadStatus>
    {
        public async Task<UploadStatus> Handle(UploadStatusCommand request, CancellationToken cancellationToken)
        {
            //To:DOsave the status to the database
            //
            return request.Data.ToObject<UploadStatus>();
        }
    }
}
