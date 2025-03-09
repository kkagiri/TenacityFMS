using FMS.Infrastructure.EventBus.RabbitMQ.Configuration;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Infrastructure.MessageBus.RabbitMQ
{
    public class RabbitMQConnection : IAsyncDisposable
    {

        private readonly IConnection _connection;
        private readonly IChannel _channel;

        public IChannel Channel => _channel;

        public RabbitMQConnection(IOptions<MessageBusOptions> options)
        {
            if (options == null) throw new ArgumentNullException(nameof(options));

            var factory = new ConnectionFactory
            {
                HostName = options.Value.HostName,
                Port = options.Value.Port,
                UserName = options.Value.UserName,
                Password = options.Value.Password,
                VirtualHost = options.Value.VirtualHost,
                AutomaticRecoveryEnabled = true, // Enables automatic reconnection
                NetworkRecoveryInterval = TimeSpan.FromSeconds(10), // Recovery interval
                RequestedHeartbeat = TimeSpan.FromSeconds(60), // Heartbeat to keep connection alive
            };

            _connection = factory.CreateConnectionAsync().GetAwaiter().GetResult();
            _channel = _connection.CreateChannelAsync().Result;
        }


        public async ValueTask DisposeAsync()
        {
            if (_channel != null)
            {
                await _channel.CloseAsync(replyCode: 200, replyText: "Connection closed", abort: false);
                await _channel.DisposeAsync();
            }

            _connection?.Dispose();
        }
    }
}
