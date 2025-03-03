using FMS.Infrastructure.MessageBus.RabbitMQ;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Text.Json;

namespace FMS.Infrastructure.EventBus.RabbitMQ
{
    public class RabbitMQConsumer : IAsyncDisposable
    {

        private readonly IChannel _channel;
        private readonly ILogger<RabbitMQConsumer> _logger;
        private readonly List<AsyncEventingBasicConsumer> _consumers;

        public RabbitMQConsumer(RabbitMQConnection connection, ILogger<RabbitMQConsumer> logger)
        {
            if (connection == null) throw new ArgumentNullException(nameof(connection));

            _channel = connection.Channel ?? throw new ArgumentNullException(nameof(connection.Channel));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _consumers = new List<AsyncEventingBasicConsumer>();




        }
        /// <summary>
        /// Subscribes to a queue and processes incoming messages using the provided handler.
        /// </summary>
        /// <typeparam name="T">The type of the message to deserialize.</typeparam>
        /// <param name="queueName">The name of the queue to consume from.</param>
        /// <param name="handler">The handler to process the messages.</param>
        /// <param name="autoAck">Whether messages should be automatically acknowledged.</param>
        /// <returns>A task representing the asynchronous operation.</returns>
        public async Task SubscribeAsync<T>(string queueName, Func<T, Task> handler, bool autoAck = true)
        {
            if (string.IsNullOrWhiteSpace(queueName)) throw new ArgumentException("Value cannot be null or whitespace.", nameof(queueName));
            if (handler == null) throw new ArgumentNullException(nameof(handler));


            //Ensure queue exists
            await _channel.QueueDeclareAsync(queueName, durable: true, exclusive: false, autoDelete: false);


            var consumer = new AsyncEventingBasicConsumer(_channel);
            consumer.ReceivedAsync += async (sender, args) =>
            {
                try
                {
                    var body = args.Body.ToArray();
                    var message = JsonSerializer.Deserialize<T>(body);


                    if (message != null)
                    {
                        await handler(message);
                    }
                    if (!autoAck)
                    {
                        await _channel.BasicAckAsync(args.DeliveryTag, multiple: false);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error handling message");

                    if (!autoAck)
                    {
                        await _channel.BasicNackAsync(args.DeliveryTag, multiple: false, requeue: true);
                    }
                }
            };
            //Start consuming messages
            await _channel.BasicConsumeAsync(
               queue: queueName,
               autoAck: autoAck,
               consumerTag: "",
               noLocal: false,
               exclusive: false,
               arguments: null,
               consumer: consumer);


            _consumers.Add(consumer);
            _logger.LogInformation("Started consuming messages from queue: {QueueName}", queueName);
        }

        // <summary>
        /// Gracefully shuts down the consumer and its associated resources.
        /// </summary>
        public async ValueTask DisposeAsync()
        {

            foreach (var consumer in _consumers)
            {
                try
                {
                    await _channel.BasicCancelAsync(consumer.ConsumerTags[0]);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error canceling consumer");
                }
            }

            _logger.LogInformation("RabbitMQConsumer disposed.");
        }
    }
}
