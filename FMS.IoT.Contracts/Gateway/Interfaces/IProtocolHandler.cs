using FMS.IoT.Contracts.Gateway.Models;

namespace FMS.IoT.Contracts.Gateway.Interfaces;

/// <summary>
/// Interface for protocol-specific message handlers
/// </summary>
public interface IProtocolHandler {
    /// <summary>
    /// Protocol name (e.g., "WebSocket", "HTTP", "MQTT")
    /// </summary>
    string Protocol { get; }

    /// <summary>
    /// Checks if this handler can process the specified protocol
    /// </summary>
    Task<bool> CanHandleAsync (string protocol);

    /// <summary>
    /// Parses raw data into a device message
    /// </summary>
    Task<DeviceMessage> ParseMessageAsync (byte[] rawData, Dictionary<string, object> ? context = null);

    /// <summary>
    /// Serializes a device message into raw data
    /// </summary>
    Task<byte[]> SerializeMessageAsync (DeviceMessage message);

    /// <summary>
    /// Validates the message format for this protocol
    /// </summary>
    Task<ValidationResult> ValidateMessageAsync (DeviceMessage message);

    /// <summary>
    /// Gets protocol-specific configuration
    /// </summary>
    Task<ProtocolConfiguration> GetConfigurationAsync ();
}