namespace FMS.IoT.Contracts.Gateway.Models;

/// <summary>
/// Device connection status enumeration
/// </summary>
public enum ConnectionStatus {
    Connecting,
    Connected,
    Active,
    Idle,
    Disconnecting,
    Disconnected,
    Error,
    Timeout,
    Authenticated,
    Unauthorized
}