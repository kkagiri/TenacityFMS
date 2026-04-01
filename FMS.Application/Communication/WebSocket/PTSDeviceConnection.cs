/**
 * File: PTSDeviceConnection.cs
 * Purpose: Manages a single live WebSocket session to a PTS device, including request/response correlation.
 * Dependencies: System.Net.WebSockets, Newtonsoft.Json, MediatR, DeviceConnectionTracker
 * Last Modified: 2026-03-24
 *
 * Key Functions:
 * - StartAsync(): Starts the receive loop for a connected PTS device.
 * - SendPTSMessageAsync(): Sends a correlated command and awaits the device response.
 * - HealthCheckAsync(): Verifies the connection is still open and not being disposed.
 */
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Communication;
using FMS.Application.Communication.SignalR;
using FMS.Application.Communication.WebSocket;
using FMS.Application.Handlers.Common;
using FMS.Application.Handlers.Interface;
using FMS.Domain.Entities;
using FMS.Domain.PTSCommon;
using MediatR;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using FMS.Application.Features.PTSDevice.Commands;
using FMS.Application.Services;

namespace FMS.Application.Communication.webSocket
{
    /// <summary>
    /// Manages a single WebSocket connection to a PTS device.
    /// Sends/receives PTS messages, handles message parsing, and
    /// invokes IPTSMessageHandler when incoming messages arrive.
    /// </summary>
    public class PTSDeviceConnection : IPTSDeviceConnection
    {
        private readonly ILogger<PTSDeviceConnection> _logger;
        private readonly string _deviceId;
        private readonly System.Net.WebSockets.WebSocket _webSocket;
        private readonly SemaphoreSlim _sendLock = new(1, 1);
        private readonly SemaphoreSlim _disconnectLock = new(1, 1);
        private readonly BufferManager _bufferManager;
        private CancellationTokenSource _cancellationTokenSource = new();
        private volatile ConnectionLifecycle _currentLifecycle = ConnectionLifecycle.Terminated;
        private volatile WebSocketState _lastKnownState = WebSocketState.None;
        private readonly string _ipAdress;
        private readonly DeviceConnectionTracker _deviceConnectionTracker;

        private DateTime _lastPongReceived;
        private int _isDisposed;

        private const int LIFECYCLE_ACTIVE = 0;
        private const int LIFECYCLE_CLEANING = 1;
        private const int LIFECYCLE_COMPLETED = 2;

        //Add constants for WebSocket frame parsing
        private const byte OPCODE_PING = 0x9;

        // Timeout configuration for different command types
        private const int DEFAULT_TIMEOUT_SECONDS = 15;
        private const int CONFIGURATION_TIMEOUT_SECONDS = 45;
        private static readonly HashSet<string> _longTimeoutCommands = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "SetRemoteServerConfiguration",
            "GetRemoteServerConfiguration",
            "GetTanksConfiguration",
            "RemoteServerConfiguration",
            "SetDateTime",
            "GetDateTime"
        };

        /// <summary>
        /// Determines the appropriate timeout based on the command type in the message
        /// </summary>
        private int GetTimeoutForMessage(PTSMessage message)
        {
            if (message?.Packets == null || message.Packets.Count == 0)
                return DEFAULT_TIMEOUT_SECONDS;

            // Check if any packet requires extended timeout
            foreach (var packet in message.Packets)
            {
                if (!string.IsNullOrEmpty(packet.Type) && _longTimeoutCommands.Contains(packet.Type))
                {
                    _logger.LogDebug("Using extended timeout ({Timeout}s) for command type {CommandType}",
                        CONFIGURATION_TIMEOUT_SECONDS, packet.Type);
                    return CONFIGURATION_TIMEOUT_SECONDS;
                }
            }

            return DEFAULT_TIMEOUT_SECONDS;
        }

        /// <summary>
        /// Cancels all pending requests with an exception.
        /// Called when connection is being closed/replaced.
        /// </summary>
        private void CancelAllPendingRequests(string reason)
        {
            var pendingCount = _pendingRequests.Count;
            if (pendingCount == 0) return;

            _logger.LogWarning("Cancelling {Count} pending request(s) for device {DeviceId}: {Reason}",
                pendingCount, _deviceId, reason);

            foreach (var kvp in _pendingRequests)
            {
                if (_pendingRequests.TryRemove(kvp.Key, out var tcs))
                {
                    tcs.TrySetException(new OperationCanceledException($"Connection closed: {reason}"));
                    _logger.LogDebug("Cancelled pending request {CorrelationId} for device {DeviceId}",
                        kvp.Key, _deviceId);
                }
            }

            // Also clear packet ID mappings
            _packetIdToCorrelationId.Clear();
        }

        // new dictionary to handle request/response correlation
        private readonly ConcurrentDictionary<string, TaskCompletionSource<PTSMessage>> _pendingRequests = new ConcurrentDictionary<string, TaskCompletionSource<PTSMessage>>();

        //Cursor: Add packet ID to correlation ID mapping for devices that don't echo PtsId
        private readonly ConcurrentDictionary<int, string> _packetIdToCorrelationId = new ConcurrentDictionary<int, string>();

        private readonly IServiceScopeFactory _scopeFactory;

        public PTSDeviceConnection(
            ILogger<PTSDeviceConnection> logger,
            string deviceId, string ipaddress,
            System.Net.WebSockets.WebSocket webSocket,
            BufferManager bufferManager,
            IServiceScopeFactory scopeFactory,
            DeviceConnectionTracker deviceConnectionTracker

        )
        {
            _logger = logger ??
                throw new ArgumentNullException(nameof(logger));
            _deviceId = deviceId ??
                throw new ArgumentNullException(nameof(deviceId));
            _ipAdress = ipaddress ??
                throw new ArgumentNullException(nameof(ipaddress));
            _webSocket = webSocket ??
                throw new ArgumentNullException(nameof(webSocket));
            _bufferManager = bufferManager ??
                throw new ArgumentNullException(nameof(bufferManager));
            _scopeFactory = scopeFactory ??
                throw new ArgumentNullException(nameof(scopeFactory)); // <-- Assign scope factory
            _cancellationTokenSource = new CancellationTokenSource();
            _deviceConnectionTracker = deviceConnectionTracker ??
                throw new ArgumentNullException(nameof(deviceConnectionTracker)); // Assign tracker

            InitiateNewConnectionAsync().Wait(); // Start with fresh lifecycle
            _currentLifecycle = new ConnectionLifecycle(); // Start with active lifecycle
        }

        private class ConnectionLifecycle
        {
            private int _state;
            public string ConnectionId { get; }
            private readonly DateTime _startTime;

            public ConnectionLifecycle() : this(Guid.NewGuid().ToString(), LIFECYCLE_ACTIVE) { }

            private ConnectionLifecycle(string id, int initialState)
            {
                ConnectionId = id;
                _startTime = DateTime.UtcNow;
                _state = initialState;
            }

            public static readonly ConnectionLifecycle Terminated =
                new ConnectionLifecycle("terminated", LIFECYCLE_COMPLETED);

            public bool TryBeginCleanup() =>
                Interlocked.CompareExchange(ref _state, LIFECYCLE_CLEANING, LIFECYCLE_ACTIVE) == LIFECYCLE_ACTIVE;

            public void MarkComplete() =>
                Interlocked.Exchange(ref _state, LIFECYCLE_COMPLETED);

            public bool IsComplete =>
                Interlocked.CompareExchange(ref _state, LIFECYCLE_COMPLETED, LIFECYCLE_COMPLETED) == LIFECYCLE_COMPLETED;
        }

        private void UpdateWebSocketState(WebSocketState newState)
        {
            var oldState = _lastKnownState;
            _lastKnownState = newState;

            if (oldState != newState)
            {
                _logger.LogInformation(
                    "WebSocket state transition for device {DeviceId}: {OldState} -> {NewState} at {Timestamp}",
                    _deviceId,
                    oldState,
                    newState,
                    DateTime.UtcNow
                );

                switch (newState)
                {
                    case WebSocketState.Aborted:
                    case WebSocketState.Closed:
                        _lastPongReceived = DateTime.MinValue;
                        break;
                    case WebSocketState.Open:
                        _lastPongReceived = DateTime.UtcNow;
                        break;
                }
            }
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            try
            {
                // Update connection status using DeviceConnectionTracker
                await _deviceConnectionTracker.UpdateWebSocketConnection(_deviceId, _ipAdress);

                // Start processing messages
                await ProcessMessagesAsync(cancellationToken);
            }
            catch (Exception ex) when (ex is OperationCanceledException || ex is WebSocketException)
            {
                _logger.LogWarning(ex, "Processing cancelled or WebSocket error for device {DeviceId}", _deviceId);
            }
            finally
            {
                await HandleDisconnectionAsync();
            }
        }

        private async Task HandleCompleteMessage(string message, CancellationToken cancellationToken)
        {
            if (string.IsNullOrEmpty(message))
                return;

            try
            {
                //Cursor: Log the raw message received from device for debugging
                _logger.LogInformation("Raw message received from device {DeviceId}: {RawMessage}", _deviceId, message);

                // Update last activity using DeviceConnectionTracker
                await _deviceConnectionTracker.UpdateWebSocketConnection(_deviceId, _ipAdress);

                // Deserialize the incoming message once
                var ptsMessage = JsonConvert.DeserializeObject<PTSMessage>(message);

                if (ptsMessage == null)
                {
                    _logger.LogWarning("Received null message from device {DeviceId}.", _deviceId);
                    await SendErrorPacketAsync(null, "InvalidMessage", 400, "Message is null or malformed.", cancellationToken);
                    return;
                }

                //Cursor: Add detailed logging for debugging correlation ID issues
                _logger.LogDebug("Received message from device {DeviceId}: PtsId={PtsId}, Packets={PacketCount}",
                    _deviceId, ptsMessage.PtsId ?? "null", ptsMessage.Packets?.Count ?? 0);

                if (ptsMessage.Packets?.Count > 0)
                {
                    foreach (var packet in ptsMessage.Packets)
                    {
                        _logger.LogInformation("  Packet: Id={PacketId}, Type={PacketType}, Error={Error}, Code={Code}, Message={Message}",
                            packet.Id, packet.Type, packet.Error, packet.Code, packet.Message);
                    }
                }

                // Update last activity timestamp in Redis via the tracker
                await _deviceConnectionTracker.UpdateWebSocketLastMessageTime(_deviceId);

                //Cursor: Try to find correlation by PtsId first, then by packet ID
                string matchedCorrelationId = null;
                TaskCompletionSource<PTSMessage> matchedTcs = null;

                // First, try exact PtsId match (preferred method)
                if (!string.IsNullOrWhiteSpace(ptsMessage.PtsId))
                {
                    _logger.LogDebug("Checking for pending request with PtsId {PtsId}. Current pending requests: [{PendingRequests}]",
                        ptsMessage.PtsId, string.Join(", ", _pendingRequests.Keys));

                    if (_pendingRequests.TryRemove(ptsMessage.PtsId, out matchedTcs))
                    {
                        matchedCorrelationId = ptsMessage.PtsId;
                        _logger.LogInformation("Received response for PtsId {PtsId} from device {DeviceId}.", ptsMessage.PtsId, _deviceId);
                    }
                }

                // If no PtsId match found, try packet ID correlation (fallback for devices that don't echo PtsId)
                if (matchedTcs == null && ptsMessage.Packets?.Count > 0)
                {
                    foreach (var packet in ptsMessage.Packets)
                    {
                        if (packet.Id > 0 && _packetIdToCorrelationId.TryRemove(packet.Id, out string correlationId))
                        {
                            if (_pendingRequests.TryRemove(correlationId, out matchedTcs))
                            {
                                matchedCorrelationId = correlationId;
                                _logger.LogInformation("Received response for packet ID {PacketId} (correlation {CorrelationId}) from device {DeviceId}.",
                                    packet.Id, correlationId, _deviceId);
                                break;
                            }
                        }
                    }
                }

                // Fallback #3: If there is exactly ONE pending request and the response
                // is NOT an unsolicited periodic message (UploadStatus), complete it.
                // PTS devices often don't echo back the PtsId or orignal PacketId —
                // they replace PtsId with their own device ID and generate a new PacketId.
                // Since each device connection is a single request-response channel,
                // the one pending request is the only possible match.
                if (matchedTcs == null && _pendingRequests.Count == 1)
                {
                    // Only apply this fallback for non-periodic messages.
                    // UploadStatus is sent autonomously every ~10 s and is NOT a command response.
                    var isUnsolicitedPeriodic = ptsMessage.Packets?.Count > 0
                        && ptsMessage.Packets.All(p =>
                            string.Equals(p.Type, "UploadStatus", StringComparison.OrdinalIgnoreCase));

                    if (!isUnsolicitedPeriodic)
                    {
                        // Grab the single pending entry
                        var singleEntry = _pendingRequests.FirstOrDefault();
                        if (!string.IsNullOrEmpty(singleEntry.Key)
                            && _pendingRequests.TryRemove(singleEntry.Key, out matchedTcs))
                        {
                            matchedCorrelationId = singleEntry.Key;
                            _logger.LogInformation(
                                "Fallback match: completed pending request {CorrelationId} with response " +
                                "PtsId={PtsId} from device {DeviceId} (device did not echo correlation ID).",
                                matchedCorrelationId, ptsMessage.PtsId, _deviceId);

                            // Also clean up any stale packet-ID mappings for this correlation
                            var stalePacketIds = _packetIdToCorrelationId
                                .Where(kvp => kvp.Value == matchedCorrelationId)
                                .Select(kvp => kvp.Key)
                                .ToList();
                            foreach (var staleId in stalePacketIds)
                                _packetIdToCorrelationId.TryRemove(staleId, out _);
                        }
                    }
                }

                // If we found a matching request, complete it
                if (matchedTcs != null)
                {
                    matchedTcs.TrySetResult(ptsMessage);
                    return;
                }

                // No correlation found - this is an unsolicited message
                if (!string.IsNullOrWhiteSpace(ptsMessage.PtsId))
                {
                    _logger.LogWarning("No pending request for PtsId {PtsId} from device {DeviceId}. This may be an unsolicited status message.", ptsMessage.PtsId, _deviceId);
                }
                else
                {
                    _logger.LogWarning("Received message with no PtsId and no matching packet ID from device {DeviceId}. This may be an unsolicited status message.", _deviceId);
                }

                // Process unsolicited messages through the message processor
                if (ptsMessage.Packets?.Count > 0)
                {
                    //Create a new DI scope for processing Message
                    using var scope = _scopeFactory.CreateScope();
                    var messageProcessor = scope.ServiceProvider.GetRequiredService<IPTSMessageProcessor>();
                    var response = await messageProcessor.ProcessMessageAsync(_deviceId, ptsMessage);

                    // CRITICAL FIX: Send the acknowledgement response back to the device.
                    // Previously the response was discarded, so the device never received
                    // an ACK and would retry the same packet indefinitely (e.g. UploadTankMeasurement 1/12 loop).
                    if (response?.Packets?.Count > 0)
                    {
                        // Skip sending if the connection is already disposed/closing
                        if (Interlocked.CompareExchange(ref _isDisposed, 0, 0) == 1)
                        {
                            _logger.LogDebug("Skipping unsolicited response - connection disposed for device {DeviceId}", _deviceId);
                        }
                        else
                        {
                            var jObject = JObject.FromObject(response);
                            var packetsArray = jObject["Packets"] as JArray;
                            if (packetsArray != null)
                            {
                                foreach (var p in packetsArray)
                                {
                                    // Remove internal-only fields before sending to device
                                    p["SetRequestType"]?.Parent?.Remove();

                                    // Remove null Data field
                                    var dataToken = p["Data"];
                                    if (dataToken == null || dataToken.Type == JTokenType.Null)
                                    {
                                        dataToken?.Parent?.Remove();
                                    }

                                    // Remove null/false Error and null Code for clean protocol compliance
                                    var errorToken = p["Error"];
                                    if (errorToken != null && (errorToken.Type == JTokenType.Null || (errorToken.Type == JTokenType.Boolean && !errorToken.Value<bool>())))
                                    {
                                        errorToken.Parent?.Remove();
                                    }
                                    var codeToken = p["Code"];
                                    if (codeToken != null && codeToken.Type == JTokenType.Null)
                                    {
                                        codeToken.Parent?.Remove();
                                    }
                                }
                            }

                            var responseJson = jObject.ToString(Formatting.None);
                            _logger.LogInformation("Sending acknowledgement for unsolicited message to device {DeviceId}: {ResponseJson}",
                                _deviceId, responseJson);

                            await _sendLock.WaitAsync(cancellationToken);
                            try
                            {
                                if (_webSocket.State == WebSocketState.Open)
                                {
                                    var buffer = Encoding.UTF8.GetBytes(responseJson);
                                    await _webSocket.SendAsync(
                                        new ArraySegment<byte>(buffer),
                                        WebSocketMessageType.Text,
                                        true,
                                        cancellationToken);
                                }
                                else
                                {
                                    _logger.LogWarning("Cannot send unsolicited response - WebSocket not open for device {DeviceId}, state: {State}",
                                        _deviceId, _webSocket.State);
                                }
                            }
                            finally
                            {
                                _sendLock.Release();
                            }
                        }
                    }
                }
                else
                {
                    _logger.LogWarning("Received message with no packets for device {DeviceId}.", _deviceId);
                    await SendErrorPacketAsync(null, "EmptyMessage", 400, "No packets found in the message.", cancellationToken);
                }
            }
            catch (Newtonsoft.Json.JsonException jex)
            {
                _logger.LogError(jex, "Failed to deserialize message from device {DeviceId}.", _deviceId);
                await SendErrorPacketAsync(null, "InvalidMessage", 400, "Invalid JSON format.", cancellationToken);
            }
            catch (ObjectDisposedException)
            {
                // Connection is being torn down concurrently - safe to ignore
                _logger.LogDebug("Message processing aborted - connection disposed for device {DeviceId}.", _deviceId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception while processing message from device {DeviceId}.", _deviceId);
                await SendErrorPacketAsync(null, "InternalError", 500, "Internal Server Error", cancellationToken);
            }
        }

        private async Task SendErrorPacketAsync(int? packetId, string type, int code, string message, CancellationToken cancellationToken)
        {
            var errorPacket = new Packet
            {
                Id = packetId.GetValueOrDefault(0),
                Type = type,
                Error = true,
                Code = code,
                Message = message
            };

            var errorJson = JsonConvert.SerializeObject(errorPacket);
            var errorBuffer = System.Text.Encoding.UTF8.GetBytes(errorJson);
            await _webSocket.SendAsync(new ArraySegment<byte>(errorBuffer),
                System.Net.WebSockets.WebSocketMessageType.Text,
                true,
                cancellationToken);
        }

        private async Task HandlePingFrame(WebSocketFrame frame, byte[] headerBuffer, CancellationToken cancellationToken)
        {
            _logger.LogDebug("Protocol-level PING received from {DeviceId}", _deviceId);

            // Read any payload from the PING
            var pingPayload = frame.PayloadLength > 0 ? new byte[(int)frame.PayloadLength] : Array.Empty<byte>();

            if (pingPayload.Length > 0)
            {
                await _webSocket.ReceiveAsync(new ArraySegment<byte>(pingPayload), cancellationToken);
            }

            // Send protocol-level PONG
            await _webSocket.SendAsync(new ArraySegment<byte>(pingPayload), WebSocketMessageType.Binary, true, cancellationToken);

            _logger.LogDebug("Protocol-level PONG sent to {DeviceId}", _deviceId);
        }

        private record WebSocketFrame(
            bool Fin,
            byte Opcode,
            bool Masked,
            ulong PayloadLength,
            int AdditionalHeaderBytes);

        private async Task ProcessMessagesAsync(CancellationToken cancellationToken)
        {
            var buffer = new byte[8192];
            var messageBuilder = new StringBuilder();

            while (!cancellationToken.IsCancellationRequested && _webSocket.State == WebSocketState.Open)
            {
                messageBuilder.Clear();
                WebSocketReceiveResult result;
                do
                {
                    result = await _webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), cancellationToken);

                    // Accumulate each chunk into the message builder
                    var chunk = Encoding.UTF8.GetString(buffer, 0, result.Count);
                    messageBuilder.Append(chunk);

                    if (result.MessageType == WebSocketMessageType.Close)
                    {
                        // Handle close frame logic
                        await HandleDisconnectionAsync();
                        return;
                    }

                } while (!result.EndOfMessage && !(_cancellationTokenSource?.IsCancellationRequested ?? true));

                // Guard: only process if we received the full message.
                // If the loop exited because cancellation was requested before EndOfMessage,
                // the accumulated data is a partial frame — deserializing it would throw.
                if (!result.EndOfMessage)
                {
                    _logger.LogWarning(
                        "Discarding partial WebSocket message for device {DeviceId} — {Length} bytes accumulated before cancellation",
                        _deviceId, messageBuilder.Length);
                    continue;
                }

                // Now we have the full message in messageBuilder
                var completeMessage = messageBuilder.ToString();
                // _logger.LogInformation("Complete message received: {Message}", completeMessage);

                // Parse/Handle the JSON
                await HandleCompleteMessage(completeMessage, cancellationToken);
            }
        }

        public async Task InitiateNewConnectionAsync()
        {
            var newLifecycle = new ConnectionLifecycle();
            var oldLifecycle = Interlocked.Exchange(ref _currentLifecycle, newLifecycle);
            _logger.LogDebug(
                "Initiating new connection for device {DeviceId} lifecycle {LifecycleId}, replacing {OldLifecycleId}",
                _deviceId,
                newLifecycle.ConnectionId,
                oldLifecycle?.ConnectionId
            );

            Interlocked.Exchange(ref _isDisposed, 0);
        }

        private async Task HandleDisconnectionAsync()
        {
            var lifecycle = Interlocked.CompareExchange(
                ref _currentLifecycle,
                _currentLifecycle,
                _currentLifecycle
            );

            if (lifecycle == ConnectionLifecycle.Terminated)
            {
                _logger.LogDebug(
                    "Cleanup skipped - connection already terminated for device {DeviceId}",
                    _deviceId
                );
                return;
            }

            if (!lifecycle.TryBeginCleanup())
            {
                _logger.LogDebug(
                    "Cleanup already initiated for device {DeviceId} lifecycle {LifecycleId}",
                    _deviceId,
                    lifecycle.ConnectionId
                );
                return;
            }

            try
            {
                if (Interlocked.CompareExchange(ref _isDisposed, 1, 0) == 0)
                {
                    var lockAcquired = await _disconnectLock.WaitAsync(TimeSpan.FromSeconds(5));
                    if (!lockAcquired)
                    {
                        _logger.LogWarning("Could not acquire disconnect lock for device {DeviceId} lifecycle {LifecycleId}", _deviceId, lifecycle.ConnectionId);
                        return;
                    }

                    try
                    {
                        // Cancel all pending requests before closing - they won't get responses on this connection
                        CancelAllPendingRequests("Connection closing");

                        if (_webSocket.State == WebSocketState.Open || _webSocket.State == WebSocketState.CloseReceived || _webSocket.State == WebSocketState.CloseSent)
                        {
                            using var closeTimeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(3));
                            try
                            {
                                // Use CloseOutputAsync to close output while still allowing receiving
                                // This prevents the "message type 'Text' is invalid after CloseAsync" error
                                await _webSocket.CloseOutputAsync(WebSocketCloseStatus.NormalClosure, "Connection closed", closeTimeoutCts.Token);
                            }
                            catch (WebSocketException ex)
                            {
                                _logger.LogWarning(ex, "Error closing WebSocket for device {DeviceId} lifecycle {LifecycleId}", _deviceId, lifecycle.ConnectionId);
                            }
                        }
                    }
                    finally
                    {
                        _disconnectLock.Release();
                        lifecycle.MarkComplete();
                    }

                    await PerformFinalCleanup();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error during disconnection cleanup for device {DeviceId} lifecycle {LifecycleId}",
                    _deviceId,
                    lifecycle.ConnectionId
                );
            }
            finally
            {
                lifecycle.MarkComplete();

                // **CRITICAL**: Clean up orphaned transactions BEFORE removing WebSocket from Redis
                // This ensures transaction data is saved before connection info is lost
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var cleanupService = scope.ServiceProvider.GetService<IOrphanedTransactionCleanupService>();
                    if (cleanupService != null)
                    {
                        _logger.LogInformation("[{DeviceId}] Triggering immediate orphaned transaction cleanup before removing connection", _deviceId);
                        var processedTxnIds = await cleanupService.CleanupOrphanedTransactionsAsync(_deviceId, cleanupRedisKeys: true);
                        if (processedTxnIds.Count > 0)
                        {
                            _logger.LogInformation("[{DeviceId}] Saved {Count} orphaned transaction(s) to database: {TxnIds}",
                                _deviceId, processedTxnIds.Count, string.Join(", ", processedTxnIds));
                        }
                    }
                    else
                    {
                        _logger.LogWarning("[{DeviceId}] OrphanedTransactionCleanupService not available - transactions may be lost", _deviceId);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[{DeviceId}] Error during orphaned transaction cleanup", _deviceId);
                }

                await _deviceConnectionTracker.RemoveWebSocketConnection(_deviceId);
                _logger.LogInformation("WebSocket connection cleanup complete and Redis tracker notified for device {DeviceId}, lifecycle {LifecycleId}", _deviceId, lifecycle.ConnectionId);
            }
        }

        private async Task PerformFinalCleanup()
        {
            try
            {
                var oldCts = Interlocked.Exchange(ref _cancellationTokenSource, null);
                if (oldCts != null)
                {
                    await oldCts.CancelAsync();
                    oldCts.Dispose();
                }

                // NOTE: Do NOT dispose _sendLock or _disconnectLock here.
                // SemaphoreSlim used only with WaitAsync does not allocate kernel handles,
                // so disposal is unnecessary. Disposing them while HandleCompleteMessage or
                // SendPTSMessageAsync may still be executing causes ObjectDisposedException.
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in final cleanup for device {DeviceId}", _deviceId);
            }
        }

        public async Task<PTSMessage> SendPTSMessageAsync(PTSMessage message, CancellationToken cancellationToken = default)
        {
            if (_webSocket.State != WebSocketState.Open)
            {
                _logger.LogWarning("Attempted to send message while socket in state: {State}", _webSocket.State);
                throw new InvalidOperationException($"WebSocket not in Open state: {_webSocket.State}");
            }

            if (Interlocked.CompareExchange(ref _isDisposed, 0, 0) == 1)
            {
                throw new ObjectDisposedException(nameof(PTSDeviceConnection));
            }

            //create correlation ID
            var correlationId = message.PtsId;

            //Cursor: Add logging for correlation ID tracking
            _logger.LogInformation("Sending message to device {DeviceId} with correlation ID {CorrelationId}, Message: {Message}",
                _deviceId, correlationId, JsonConvert.SerializeObject(message, Formatting.None));

            //) Create a TCS and store it
            var tcs = new TaskCompletionSource<PTSMessage>(TaskCreationOptions.RunContinuationsAsynchronously);
            _pendingRequests[correlationId] = tcs;

            //Cursor: Also store packet ID correlation for devices that don't echo PtsId
            if (message.Packets?.Count > 0)
            {
                foreach (var packet in message.Packets)
                {
                    if (packet.Id > 0)
                    {
                        _packetIdToCorrelationId[packet.Id] = correlationId;
                        _logger.LogDebug("Stored packet ID {PacketId} correlation to {CorrelationId}", packet.Id, correlationId);
                    }
                }
            }

            _logger.LogDebug("Stored pending request for correlation ID {CorrelationId}. Total pending: {PendingCount}",
                correlationId, _pendingRequests.Count);

            // Acquire lock to safely send
            await _sendLock.WaitAsync(cancellationToken);
            try
            {
                if (_webSocket.State != WebSocketState.Open) throw new InvalidOperationException("WebSocket not open");

                var jsonMessage = JsonConvert.SerializeObject(message);
                var buffer = Encoding.UTF8.GetBytes(jsonMessage);

                await _webSocket.SendAsync(new ArraySegment<byte>(buffer), WebSocketMessageType.Text, true, cancellationToken);

            }
            finally
            {
                if (_sendLock.CurrentCount == 0)
                {

                    _sendLock.Release();

                }
            }

            using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);

            // Determine timeout based on command type - configuration commands need longer timeout
            var timeoutSeconds = GetTimeoutForMessage(message);
            linkedCts.CancelAfter(TimeSpan.FromSeconds(timeoutSeconds));

            var completed = await Task.WhenAny(tcs.Task, Task.Delay(-1, linkedCts.Token));
            if (completed != tcs.Task)
            {
                // Timed out
                _pendingRequests.TryRemove(correlationId, out _);

                //Cursor: Clean up packet ID mappings on timeout
                if (message.Packets?.Count > 0)
                {
                    foreach (var packet in message.Packets)
                    {
                        if (packet.Id > 0)
                        {
                            _packetIdToCorrelationId.TryRemove(packet.Id, out _);
                        }
                    }
                }

                _logger.LogWarning("Timeout waiting for response with correlation ID {CorrelationId} from device {DeviceId}",
                    correlationId, _deviceId);
                throw new TimeoutException($"No response for correlationId {correlationId}");
            }

            _logger.LogInformation("Received successful response for correlation ID {CorrelationId} from device {DeviceId}",
                correlationId, _deviceId);
            return await tcs.Task;

        }

        private readonly PingRateControl _pingRateControl = new PingRateControl();

        private async Task ProcessValidFrame(WebSocketFrame frame, byte[] messageBuffer, StringBuilder messageBuilder, CancellationToken cancellationToken)
        {
            try
            {
                if (_webSocket.State != WebSocketState.Open)
                {
                    _logger.LogWarning(
                        "WebSocket not open (State: {State}) before processing frame for device {DeviceId}",
                        _webSocket.State, _deviceId);
                    return;
                }

                // Handle protocol-level PING explicitly
                if (frame.Opcode == OPCODE_PING)
                {
                    if (!_pingRateControl.ShouldProcessPing())
                    {
                        _logger.LogWarning(
                            "Excessive PING rate detected for device {DeviceId} - suppressing response",
                            _deviceId);
                        return;
                    }
                    await HandlePingFrame(frame, messageBuffer, cancellationToken);
                    return;
                }

                // Handle normal text messages

            }
            catch (Exception ex) when (!(ex is OperationCanceledException))
            {
                _logger.LogError(ex,
                    "Error processing frame for device {DeviceId}", _deviceId);

                // Update connection state tracking
                UpdateWebSocketState(_webSocket.State);

                // Rethrow only if connection might still be valid
                if (_webSocket.State == WebSocketState.Open)
                    throw;
            }
        }

        /// <summary>
        /// TODO: Implement health check for WebSocket connection
        /// </summary>
        /// <returns></returns>
        public async Task<bool> HealthCheckAsync()
        {
            try
            {
                if (Interlocked.CompareExchange(ref _isDisposed, 0, 0) == 1)
                {
                    _logger.LogDebug("Health check failed for device {DeviceId}: connection is disposed", _deviceId);
                    return false;
                }

                if (_cancellationTokenSource?.IsCancellationRequested == true)
                {
                    _logger.LogDebug("Health check failed for device {DeviceId}: cancellation requested", _deviceId);
                    return false;
                }

                var isOpen = _webSocket.State == WebSocketState.Open;
                if (!isOpen)
                {
                    _logger.LogDebug("Health check failed for device {DeviceId}: WebSocket state is {State}", _deviceId, _webSocket.State);
                }

                return isOpen;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Health check failed for device {DeviceId}", _deviceId);
                return false;
            }
        }

        public async ValueTask DisposeAsync()
        {
            await HandleDisconnectionAsync();
        }

        private class PingRateControl
        {
            private readonly Queue<DateTime> _pingHistory = new Queue<DateTime>();
            private readonly TimeSpan _windowDuration = TimeSpan.FromSeconds(5);
            private readonly int _maxPingsPerWindow = 10;
            private readonly object _lock = new object();

            public bool ShouldProcessPing()
            {
                lock (_lock)
                {
                    var now = DateTime.UtcNow;

                    // Remove pings outside the window
                    while (_pingHistory.Count > 0 &&
                        now - _pingHistory.Peek() > _windowDuration)
                    {
                        _pingHistory.Dequeue();
                    }

                    // Check rate
                    if (_pingHistory.Count >= _maxPingsPerWindow)
                    {
                        return false;
                    }

                    _pingHistory.Enqueue(now);
                    return true;
                }
            }
        }
    }
}