using FMS.Domain.PTSCommon;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Communication.WebSocket
{
    public interface IPTSDeviceConnection : IAsyncDisposable
    {
        Task StartAsync(CancellationToken cancellationToken);
        Task<PTSMessage> SendPTSMessageAsync(PTSMessage message, CancellationToken cancellationToken = default);
    }
}
