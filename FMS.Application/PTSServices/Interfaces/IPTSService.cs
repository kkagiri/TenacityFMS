using FMS.Domain.PTSCommon;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Application.PTSServices.Interfaces
{
    /// <summary>
    /// Interface for a Service that processes incoming PTS messages
    /// </summary>
    public interface IPTSService
    {
        Task<PTSMessage> ProcessIncomingMessage(PTSMessage requestMessage);
    }
}
