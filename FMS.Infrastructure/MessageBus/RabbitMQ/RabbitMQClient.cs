using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client.Events;
using RabbitMQ.Client;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using FMS.Infrastructure.EventBus.RabbitMQ.Configuration;
using System.Text.Json;
using System.Threading.Channels;
using System.Collections.Concurrent;
using FMS.Infrastructure.MessageBus.RabbitMQ;

namespace FMS.Infrastructure.EventBus.RabbitMQ
{
    public class RabbitMQClient : IMessageBusClient, IAsyncDisposable
    {
        private readonly IChannel _channel;
        private readonly string _replyQueueName;
        private readonly IConnection _connection;
        private readonly ConcurrentDictionary<string, TaskCompletionSource<object>> _pendingRequests;
        private readonly ILogger<RabbitMQClient> _logger;

        public RabbitMQClient(RabbitMQConnection connection, ILogger<RabbitMQClient> logger, IChannel channel)
        {

            if (connection == null) throw new ArgumentNullException(nameof(connection));
            _channel = connection.Channel ?? throw new ArgumentNullException(nameof(connection.Channel));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _pendingRequests = new ConcurrentDictionary<string, TaskCompletionSource<object>>();

            // Declare reply queue
            // Declare the reply queue
            var declareResult = _channel.QueueDeclareAsync(
                queue: "",
                durable: false,
                exclusive: false,
                autoDelete: true).Result;

            _replyQueueName = declareResult.QueueName;

            // Setup consumer for reply queue
            var consumer = new AsyncEventingBasicConsumer(_channel);
            consumer.ReceivedAsync += HandleResponseAsync;

            // Start consuming messages from the reply queue
            _channel.BasicConsumeAsync(
                queue: _replyQueueName,
                autoAck: true,
                consumerTag: "",
                noLocal: false,
                exclusive: false,
                arguments: null,
                consumer: consumer).Wait();
        }


        public async Task<TResponse> SendAndWaitForResponse<TResponse>(
            string routingKey,
            object message,
            TimeSpan timeout)
        {
            var correlationId = Guid.NewGuid().ToString();

            var tcs = new TaskCompletionSource<object>(TaskCreationOptions.RunContinuationsAsynchronously);

            _pendingRequests[correlationId] = tcs;

            try
            {

                var messageBody = JsonSerializer.SerializeToUtf8Bytes(message);

                var properties = new BasicProperties
                {
                    CorrelationId = correlationId,
                    ReplyTo = _replyQueueName
                };
                // Serialize the message


                // Publish the message
                await _channel.BasicPublishAsync(
                    exchange: "",
                    routingKey: routingKey,
                    mandatory: true,
                    basicProperties: properties,
                    body: messageBody,
                    cancellationToken: CancellationToken.None
                );

                // Wait for the response or timeout
                using var cts = new CancellationTokenSource(timeout);
                cts.Token.Register(() => tcs.TrySetCanceled(), useSynchronizationContext: false);

                var result = await tcs.Task.ConfigureAwait(false);
                return (TResponse)result;
            }
            finally
            {
                _pendingRequests.TryRemove(correlationId, out _);
            }
        }

        public async Task PublishAsync(string routingKey, object message)
        {
            int retryCount = 3;

            for (int attempt = 0; attempt < retryCount; attempt++)
            {
                try
                {
                    var body = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(message));
                    // Define message properties
                    var basicProperties = new BasicProperties
                    {
                        Persistent = true
                    }; // Ensure BasicProperties implements IReadOnlyBasicProperties and IAmqpHeader


                    // Publish the message
                    await _channel.BasicPublishAsync<BasicProperties>(
                    exchange: "",
                    routingKey: routingKey,
                    mandatory: true,
                    basicProperties: basicProperties,
                    body: body,
                    cancellationToken: CancellationToken.None
                );
                    _logger.LogInformation("Message published to routing key {RoutingKey}", routingKey);
                    break;
                }
                catch (Exception ex) when (attempt < retryCount - 1)
                {
                    _logger.LogWarning(ex, "Retrying message publish to {RoutingKey} (attempt {Attempt})", routingKey, attempt + 1);
                    await Task.Delay(1000); // Exponential backoff can be added here
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to publish message to {RoutingKey}", routingKey);
                    throw;
                }
            }
        }

        public async Task SubscribeAsync<T>(string routingKey, Func<T, Task> handler, CancellationToken stoppingToken)
        {
            try
            {

                await _channel.QueueDeclareAsync(queue: routingKey, durable: true, exclusive: false, autoDelete: false);

                var consumer = new AsyncEventingBasicConsumer(_channel);
                consumer.ReceivedAsync += async (sender, args) =>
                {
                    if (stoppingToken.IsCancellationRequested) return;
                    try
                    {
                        var message = JsonSerializer.Deserialize<T>(args.Body.ToArray());
                        await handler(message);
                        await _channel.BasicAckAsync(args.DeliveryTag, multiple: false);

                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error handling message.");
                        await _channel.BasicNackAsync(args.DeliveryTag, multiple: false, requeue: true);
                    }
                };

                await _channel.BasicConsumeAsync(
                                    queue: routingKey,
                                    autoAck: false,
                                    consumerTag: "",
                                    noLocal: false,
                                    exclusive: false,
                                    arguments: null,
                                    consumer: consumer);
                stoppingToken.Register(() =>
                {
                    _logger.LogInformation("Stopping consumer for {RoutingKey}", routingKey);
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error subscribing to queue {QueueName}", routingKey);
                throw;
            }
        }


        private async Task HandleResponseAsync(object sender, BasicDeliverEventArgs args)
        {
            if (_pendingRequests.TryGetValue(args.BasicProperties.CorrelationId, out var tcs))
            {
                try
                {
                    var response = JsonSerializer.Deserialize<object>(args.Body.ToArray());
                    tcs.TrySetResult(response);
                }
                catch (Exception ex)
                {
                    tcs.TrySetException(ex);
                }
            }
            await Task.CompletedTask;
        }

        public async ValueTask DisposeAsync()
        {
            if (_channel != null && _channel.IsOpen)
            {
                await _channel.CloseAsync(replyCode: 200, replyText: "Disposed", abort: false);
                await _channel.DisposeAsync();
            }

            if (_connection != null && _connection.IsOpen)
            {
                await _connection.CloseAsync();
                _connection.Dispose();
            }
        }


    }

}
