using FMS.IoT.Contracts.Common;
using FMS.IoT.Contracts.Gateway.Interfaces;
using FMS.IoT.Contracts.Gateway.Models;
using Microsoft.Extensions.Logging;

namespace FMS.IoT.Gateway.Protocols;

/// <summary>
/// WebSocket protocol handler implementation
/// </summary>
public class WebSocketProtocolHandler : IProtocolHandler {
    private readonly ILogger<WebSocketProtocolHandler> _logger;

    public string Protocol => IoTConstants.Protocols.WebSocket;

    public WebSocketProtocolHandler (ILogger<WebSocketProtocolHandler> logger) {
        _logger = logger;
    }

    public async Task<bool> CanHandleAsync (string protocol) {
        return string.Equals (protocol, Protocol, StringComparison.OrdinalIgnoreCase);
    }

    public async Task<DeviceMessage> ParseMessageAsync (byte[] rawData, Dictionary<string, object> ? context = null) {
        try {
        // TODO: Implement actual WebSocket message parsing
        var message = new DeviceMessage {
        MessageId = Guid.NewGuid ().ToString (),
        Protocol = Protocol,
        Timestamp = DateTime.UtcNow,
        RawData = rawData,
        MessageType = IoTConstants.MessageTypes.Telemetry
            };

            if (context != null && context.ContainsKey (IoTConstants.Headers.DeviceId)) {
                message.DeviceId = context[IoTConstants.Headers.DeviceId].ToString () ?? string.Empty;
            }

            _logger.LogDebug ("Parsed WebSocket message: {MessageId}", message.MessageId);
            return message;
        } catch (Exception ex) {
            _logger.LogError (ex, "Failed to parse WebSocket message");
            throw;
        }
    }

    public async Task<byte[]> SerializeMessageAsync (DeviceMessage message) {
        try {
            // TODO: Implement actual WebSocket message serialization
            if (message.RawData != null && message.RawData.Length > 0) {
                return message.RawData;
            }

            // Default serialization for testing
            var content = $"{{\"messageId\":\"{message.MessageId}\",\"deviceId\":\"{message.DeviceId}\",\"timestamp\":\"{message.Timestamp:O}\"}}";
            return System.Text.Encoding.UTF8.GetBytes (content);
        } catch (Exception ex) {
            _logger.LogError (ex, "Failed to serialize WebSocket message");
            throw;
        }
    }

    public async Task<ValidationResult> ValidateMessageAsync (DeviceMessage message) {
        var result = new ValidationResult {
            IsValid = true,
            ValidatedAt = DateTime.UtcNow
        };

        if (string.IsNullOrEmpty (message.DeviceId)) {
            result.IsValid = false;
            result.Errors.Add ("DeviceId is required");
        }

        if (string.IsNullOrEmpty (message.MessageId)) {
            result.IsValid = false;
            result.Errors.Add ("MessageId is required");
        }

        if (message.RawData == null || message.RawData.Length == 0) {
            result.IsValid = false;
            result.Errors.Add ("RawData is required");
        }

        return result;
    }

    public async Task<ProtocolConfiguration> GetConfigurationAsync () {
        return new ProtocolConfiguration {
            ProtocolName = Protocol,
                Version = "1.0",
                IsEnabled = true,
                MaxConnections = 1000,
                ConnectionTimeout = TimeSpan.FromSeconds (30),
                MessageTimeout = TimeSpan.FromSeconds (10),
                RequiresAuthentication = false
        };
    }
}