using FMS.Domain.PTSCommon;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Handlers.Interface
{
    public interface IMessageTypeHandler
    {
        Task<Packet> HandleMessageAsync(Packet packet, CancellationToken cancellationToken = default);
    }
}
