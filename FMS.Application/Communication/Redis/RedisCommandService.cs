using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System.Diagnostics;
using FMS.Application.Common.Commands;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace FMS.Application.Communication.Redis
{
    /// <summary>
    /// This class is used to send and receive commands to and from the Redis server.
    /// should be used for  web client only
    /// </summary>
    public class RedisCommandService
    {
        private readonly IRedisPublisher _publisher;
        private readonly IRedisSubscriber _subscriber;
        private readonly ILogger<RedisCommandService> _logger;
        private readonly ConcurrentDictionary<string, TaskCompletionSource<RedisPTSCommandResponse>> _pendingCommands;
        private readonly string _responseChannel = "pts-command-responses"; //TODO: move to config
        private readonly string _commandChannel = "pts-commands"; //TODO: move to config
        private readonly TimeSpan _commandTimeout = TimeSpan.FromSeconds(10);

        private readonly TimeSpan _pumpCloseTimeout = TimeSpan.FromSeconds(600); // 5 minutes
        // Extended timeout for pump authorization commands (device needs time to process and confirm)
        private readonly TimeSpan _pumpAuthorizeTimeout = TimeSpan.FromSeconds(15);

        // Extended timeout for configuration commands (device may take longer to respond)
        private readonly TimeSpan _configurationCommandTimeout = TimeSpan.FromSeconds(30);

        // Extended timeout for probe calibration commands (device reads physical probe data in batches)
        private readonly TimeSpan _probeCalibrationTimeout = TimeSpan.FromSeconds(30);

        // Commands that require extended timeout
        private static readonly HashSet<string> _extendedTimeoutCommands = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "PumpAuthorize",
            "SetRemoteServerConfiguration",
            "PumpCloseTransaction",
            "GetRemoteServerConfiguration",
            "GetTanksConfiguration"
        };

        // Probe calibration commands that need extended timeout (device reads physical probe data)
        private static readonly HashSet<string> _probeCalibrationCommands = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "ProbeGetTankCalibrationChartTotalRecordsNumber",
            "ProbeGetTankCalibrationChartRecordsList",
            "ProbeGetTankAutomaticCalibrationChartTotalRecordsNumber",
            "ProbeGetTankAutomaticCalibrationChartRecordsList",
            "ProbeGetTankIntervalVolumeChartTotalRecordsNumber",
            "ProbeGetTankIntervalVolumeChartRecordsList",
            "ProbeGetTankVolumeForHeight",
            "ProbeSetTankCalibrationChartRecordsList",
            "ProbeAddTankCalibrationChartRecordToList",
            "ProbeEditTankCalibrationChartRecordInList",
            "ProbeDeleteTankCalibrationChartRecordFromList",
            "ProbeGenerateTankAutomaticCalibrationChart"
        };

        // Track processed correlation IDs to prevent duplicate processing (keep for 5 minutes)
        private readonly ConcurrentDictionary<string, DateTime> _processedCorrelationIds;
        private readonly TimeSpan _correlationIdCacheDuration = TimeSpan.FromMinutes(5);

        public RedisCommandService(IRedisPublisher publisher, IRedisSubscriber subscriber, ILogger<RedisCommandService> logger)
        {
            _publisher = publisher;
            _subscriber = subscriber;
            _logger = logger;
            _pendingCommands = new ConcurrentDictionary<string, TaskCompletionSource<RedisPTSCommandResponse>>();
            _processedCorrelationIds = new ConcurrentDictionary<string, DateTime>();
            // Default pump close timeout (120 seconds)
            _pumpCloseTimeout = TimeSpan.FromSeconds(120);
            //start subscriber
            StartResponseSubscription();

            // Start background task to clean up old correlation IDs
            Task.Run(CleanupExpiredCorrelationIds);
        }

        private async Task CleanupExpiredCorrelationIds()
        {
            while (true)
            {
                try
                {
                    await Task.Delay(TimeSpan.FromMinutes(1)); // Run every minute

                    var now = DateTime.UtcNow;
                    var expiredKeys = _processedCorrelationIds
                        .Where(kvp => now - kvp.Value > _correlationIdCacheDuration)
                        .Select(kvp => kvp.Key)
                        .ToList();

                    foreach (var key in expiredKeys)
                    {
                        _processedCorrelationIds.TryRemove(key, out _);
                    }

                    if (expiredKeys.Any())
                    {
                        _logger.LogDebug("Cleaned up {Count} expired correlation IDs", expiredKeys.Count);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error cleaning up expired correlation IDs");
                }
            }
        }

        private void StartResponseSubscription()
        {
            _subscriber.SubscribeAsync(_responseChannel, (channel, message) =>
            {
                try
                {
                    //Cursor: Use System.Text.Json for response deserialization to match RedisPTSCommandResponse
                    var response = System.Text.Json.JsonSerializer.Deserialize<RedisPTSCommandResponse>(message);
                    if (response == null || string.IsNullOrEmpty(response.CorrelationId))
                    {
                        _logger.LogWarning("Invalid response received: {Message}", message);
                        return;
                    }

                    // Atomically dedupe correlation IDs to avoid duplicate processing under concurrent callbacks.
                    if (!_processedCorrelationIds.TryAdd(response.CorrelationId, DateTime.UtcNow))
                    {
                        _logger.LogWarning("Duplicate response detected for correlation ID: {CorrelationId}. Ignoring.", response.CorrelationId);
                        return;
                    }

                    if (_pendingCommands.TryGetValue(response.CorrelationId, out var tcs))
                    {
                        // Response arrived in time - deliver it to waiting task
                        var setResult = tcs.TrySetResult(response);
                        if (setResult)
                        {
                            _logger.LogDebug("Successfully delivered response for correlation ID: {CorrelationId}", response.CorrelationId);
                        }
                        else
                        {
                            _logger.LogWarning("Failed to set result for correlation ID {CorrelationId} - task may have already timed out", response.CorrelationId);
                        }
                        _pendingCommands.TryRemove(response.CorrelationId, out _);
                    }
                    else
                    {
                        // Response arrived after timeout - this is a late arrival
                        _logger.LogWarning("Late response received for correlation ID: {CorrelationId}. Response arrived after timeout or command already completed.", response.CorrelationId);

                        // For PumpAuthorizeConfirmation, we should still log the transaction details for diagnostics
                        if (response.ResponsePayload.HasValue)
                        {
                            try
                            {
                                var payload = response.ResponsePayload.Value;
                                if (payload.TryGetProperty("Packets", out var packets))
                                {
                                    foreach (var packet in packets.EnumerateArray())
                                    {
                                        if (packet.TryGetProperty("Type", out var typeProperty) &&
                                            typeProperty.GetString() == "PumpAuthorizeConfirmation" &&
                                            packet.TryGetProperty("Data", out var data))
                                        {
                                            var pumpId = data.TryGetProperty("Pump", out var pump) ? pump.GetInt32() : -1;
                                            var transactionId = data.TryGetProperty("Transaction", out var txn) ? txn.GetInt32() : -1;
                                            _logger.LogInformation("Late PumpAuthorizeConfirmation: Device={DeviceId}, Pump={PumpId}, Transaction={TransactionId}, CorrelationId={CorrelationId}",
                                                response.DeviceId, pumpId, transactionId, response.CorrelationId);
                                        }
                                    }
                                }
                            }
                            catch (Exception parseEx)
                            {
                                _logger.LogWarning(parseEx, "Failed to parse late response payload for correlation ID: {CorrelationId}", response.CorrelationId);
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing response: {Message}", message);
                }
            }).ConfigureAwait(false);
        }

        public async Task<RedisPTSCommandResponse> SendCommandAsync(RedisPTSCommand command, CancellationToken cancellationToken = default)
        {
            command.CorrelationId = Guid.NewGuid().ToString();

            var tcs = new TaskCompletionSource<RedisPTSCommandResponse>(TaskCreationOptions.RunContinuationsAsynchronously);
            _pendingCommands[command.CorrelationId] = tcs;

            //Cursor: Use Newtonsoft.Json for serialization to match Windows Service expectation
            var message = JsonConvert.SerializeObject(command);
            int maxRetries = 3;
            int attempt = 0;
            TimeSpan retryDelay = TimeSpan.FromSeconds(1);

            // Use extended timeout for pump authorization and configuration commands
            var effectiveTimeout = command.CommandType switch
            {
                "PumpAuthorize" => _pumpAuthorizeTimeout,
                "PumpCloseTransaction" => _pumpCloseTimeout,
                var cmd when cmd.StartsWith("SetRemoteServerConfiguration") ||
                       cmd.StartsWith("GetRemoteServerConfiguration") => _configurationCommandTimeout,
                var cmd when _probeCalibrationCommands.Contains(cmd) => _probeCalibrationTimeout,
                _ => _commandTimeout
            };

            _logger.LogDebug("Sending {CommandType} command with {Timeout}s timeout (correlation: {CorrelationId})",
                command.CommandType, effectiveTimeout.TotalSeconds, command.CorrelationId);

            while (attempt < maxRetries)
            {
                try
                {
                    await _publisher.PublishAsync(_commandChannel, message).ConfigureAwait(false);
                    var stopwatch = Stopwatch.StartNew();

                    // Use proper timeout mechanism with command timeout, not retry delay
                    using (var timeoutCts = new CancellationTokenSource(effectiveTimeout))
                    using (var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(timeoutCts.Token, cancellationToken))
                    {
                        var completedTask = await Task.WhenAny(tcs.Task, Task.Delay(effectiveTimeout, linkedCts.Token)).ConfigureAwait(false);
                        if (completedTask == tcs.Task)
                        {
                            var response = await tcs.Task;
                            stopwatch.Stop();
                            _logger.LogInformation("Received response for {CommandType} (correlation: {CorrelationId}) in {ElapsedMs}ms",
                                command.CommandType, command.CorrelationId,
                                    stopwatch.Elapsed.TotalMilliseconds);
                            return response;
                        }
                        else
                        {
                            _logger.LogWarning("Timeout waiting for {CommandType} response after {Timeout}s (correlation: {CorrelationId})",
                                command.CommandType, effectiveTimeout.TotalSeconds, command.CorrelationId);
                            throw new TimeoutException($"Timed out waiting for {command.CommandType} response after {effectiveTimeout.TotalSeconds}s.");
                        }
                    }
                }
                catch (Exception ex) when (!(ex is OperationCanceledException))
                {
                    attempt++;
                    _logger.LogError(ex, "Error sending command (attempt {Attempt}/{MaxRetries})", attempt, maxRetries);
                    if (attempt >= maxRetries)
                    {
                        _pendingCommands.TryRemove(command.CorrelationId, out _);
                        throw;
                    }
                    // Wait with exponential backoff before retry
                    await Task.Delay(retryDelay, cancellationToken);
                    retryDelay = TimeSpan.FromSeconds(retryDelay.TotalSeconds * 2);
                }
            }
            throw new Exception("Failed to send command after retries.");
        }

        //Cursor: Added test method to verify Redis communication
        public async Task<bool> TestRedisConnectionAsync()
        {
            try
            {
                var testCommand = new RedisPTSCommand
                {
                    DeviceId = "TEST_DEVICE",
                    CommandType = "TestConnection",
                    CommandData = new JObject { { "Test", "true" } },
                    CorrelationId = Guid.NewGuid().ToString()
                };

                _logger.LogInformation("Testing Redis connection with test command");
                await _publisher.PublishAsync(_commandChannel, JsonConvert.SerializeObject(testCommand));
                _logger.LogInformation("Test command published successfully to channel: {Channel}", _commandChannel);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Redis connection test failed");
                return false;
            }
        }

        //Cursor: Test method to verify device connectivity
        public async Task<RedisPTSCommandResponse> TestDeviceConnectionAsync(string deviceId, CancellationToken cancellationToken = default)
        {
            var testCommand = new RedisPTSCommand
            {
                DeviceId = deviceId,
                CommandType = "TestConnection",
                CommandData = JObject.FromObject(new { Test = true }),
                CorrelationId = Guid.NewGuid().ToString()
            };

            _logger.LogInformation("Sending TestConnection command to device {DeviceId}", deviceId);
            return await SendCommandAsync(testCommand, cancellationToken);
        }
    }
}
