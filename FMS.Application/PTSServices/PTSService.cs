using FMS.Application.PTSServices.Interfaces;
using FMS.Domain.PTSCommon;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Numerics;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Application.PTSServices
{
    public class PTSService : IPTSService
    {
        private readonly ILogger<PTSService> _logger;



        public Task<PTSMessage> ProcessIncomingMessage(PTSMessage requestMessage)
        {
            throw new NotImplementedException();
        }
    }
}
