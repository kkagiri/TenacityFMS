using System;
using System.Collections.Concurrent;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common.Commands;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace FMS.Application.Communication.Redis {
    /// <summary>
    /// This class is used to send and receive commands to and from the Redis server.
    /// should be used for  web client only
    /// </summary>
    public class RedisCommandService {
        private readonly IRedisPublisher _publisher;
        private readonly IRedisSubscriber _subscriber;
        private readonly ILogger<RedisCommandService> _logger;
        private readonly ConcurrentDictionary<string, TaskCompletionSource<RedisPTSCommandResponse>> _pendingCommands;
        private readonly string _responseChannel = "pts-command-responses"; //TODO: move to config
        private readonly string _commandChannel = "pts-commands"; //TODO: move to config
        private readonly TimeSpan _commandTimeout = TimeSpan.FromSeconds (10);

        public RedisCommandService (IRedisPublisher publisher, IRedisSubscriber subscriber, ILogger<RedisCommandService> logger) {
            _publisher = publisher;
            _subscriber = subscriber;
            _logger = logger;
            _pendingCommands = new ConcurrentDictionary<string, TaskCompletionSource<RedisPTSCommandResponse>> ();

            //start subscriber
            StartResponseSubscription ();
        }

        private void StartResponseSubscription () {
            _subscriber.SubscribeAsync (_responseChannel, (channel, message) => {
                try {
                    //Cursor: Use System.Text.Json for response deserialization to match RedisPTSCommandResponse
                    var response = System.Text.Json.JsonSerializer.Deserialize<RedisPTSCommandResponse> (message);
                    if (response == null || string.IsNullOrEmpty (response.CorrelationId)) {
                        _logger.LogWarning ("Invalid response received: {Message}", message);
                        return;
                    }

                    if (_pendingCommands.TryGetValue (response.CorrelationId, out var tcs)) {
                        tcs.TrySetResult (response);
                        _pendingCommands.TryRemove (response.CorrelationId, out _);
                    } else {
                        _logger.LogWarning ("No pending command found for correlation ID: {CorrelationId}", response.CorrelationId);
                    }
                } catch (Exception ex) {
                    _logger.LogError (ex, "Error processing response: {Message}", message);
                }
            }).ConfigureAwait (false);
        }

        public async Task<RedisPTSCommandResponse> SendCommandAsync (RedisPTSCommand command, CancellationToken cancellationToken = default) {
            command.CorrelationId = Guid.NewGuid ().ToString ();

            var tcs = new TaskCompletionSource<RedisPTSCommandResponse> (TaskCreationOptions.RunContinuationsAsynchronously);
            _pendingCommands[command.CorrelationId] = tcs;

            //Cursor: Use Newtonsoft.Json for serialization to match Windows Service expectation
            var message = JsonConvert.SerializeObject (command);
            int maxRetries = 3;
            int attempt = 0;
            TimeSpan retryDelay = TimeSpan.FromSeconds (1);

            while (attempt < maxRetries) {
                try {
                    await _publisher.PublishAsync (_commandChannel, message).ConfigureAwait (false);

                    // Use proper timeout mechanism with command timeout, not retry delay
                    using (var timeoutCts = new CancellationTokenSource (_commandTimeout))
                    using (var linkedCts = CancellationTokenSource.CreateLinkedTokenSource (timeoutCts.Token, cancellationToken)) {
                        var completedTask = await Task.WhenAny (tcs.Task, Task.Delay (_commandTimeout, linkedCts.Token)).ConfigureAwait (false);
                        if (completedTask == tcs.Task) {
                            return await tcs.Task;
                        } else {
                            throw new TimeoutException ("Timed out waiting for command response.");
                        }
                    }
                } catch (Exception ex) when (!(ex is OperationCanceledException)) {
                    attempt++;
                    _logger.LogError (ex, "Error sending command (attempt {Attempt}/{MaxRetries})", attempt, maxRetries);
                    if (attempt >= maxRetries) {
                        _pendingCommands.TryRemove (command.CorrelationId, out _);
                        throw;
                    }
                    // Wait with exponential backoff before retry
                    await Task.Delay (retryDelay, cancellationToken);
                    retryDelay = TimeSpan.FromSeconds (retryDelay.TotalSeconds * 2);
                }
            }
            throw new Exception ("Failed to send command after retries.");
        }

        //Cursor: Added test method to verify Redis communication
        public async Task<bool> TestRedisConnectionAsync () {
            try {
                var testCommand = new RedisPTSCommand {
                    DeviceId = "TEST_DEVICE",
                    CommandType = "TestConnection",
                    CommandData = new JObject { { "Test", "true" } },
                    CorrelationId = Guid.NewGuid ().ToString ()
                };

                _logger.LogInformation ("Testing Redis connection with test command");
                await _publisher.PublishAsync (_commandChannel, JsonConvert.SerializeObject (testCommand));
                _logger.LogInformation ("Test command published successfully to channel: {Channel}", _commandChannel);
                return true;
            } catch (Exception ex) {
                _logger.LogError (ex, "Redis connection test failed");
                return false;
            }
        }

        //Cursor: Test method to verify device connectivity
        public async Task<RedisPTSCommandResponse> TestDeviceConnectionAsync (string deviceId, CancellationToken cancellationToken = default) {
            var testCommand = new RedisPTSCommand {
            DeviceId = deviceId,
            CommandType = "TestConnection",
            CommandData = JObject.FromObject (new { Test = true }),
            CorrelationId = Guid.NewGuid ().ToString ()
            };

            _logger.LogInformation ("Sending TestConnection command to device {DeviceId}", deviceId);
            return await SendCommandAsync (testCommand, cancellationToken);
        }
    }
}