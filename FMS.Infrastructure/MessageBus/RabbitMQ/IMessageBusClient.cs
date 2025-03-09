using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Infrastructure.EventBus.RabbitMQ
{
    public interface IMessageBusClient
    {
        Task<TResponse> SendAndWaitForResponse<TResponse>(
            string routingKey,
            object message,
            TimeSpan timeout);

        Task PublishAsync(string routingKey, object message);
        Task SubscribeAsync<T>(string routingKey, Func<T, Task> handler, CancellationToken stoppingToken);
    }
}
