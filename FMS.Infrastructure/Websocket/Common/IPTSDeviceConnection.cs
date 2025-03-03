using FMS.Domain.PTSCommon;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Infrastructure.Websocket.Common
{
    public interface IPTSDeviceConnection : IAsyncDisposable
    {
        Task StartAsync(CancellationToken cancellationToken);
        Task<PTSMessage> SendPTSMessageAsync(PTSMessage message, CancellationToken cancellationToken = default);
        Task<bool> HealthCheckAsync();
    }
}
