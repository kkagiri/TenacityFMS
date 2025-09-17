namespace FMS.IoT.Contracts.Common;

/// <summary>
/// IoT system configuration constants
/// </summary>
public static class IoTConstants {
    public static class Protocols {
        public const string WebSocket = "websocket";
        public const string Http = "http";
        public const string Mqtt = "mqtt";
        public const string Tcp = "tcp";
        public const string Udp = "udp";
        public const string PTS = "pts";
    }

    public static class MessageTypes {
        public const string Telemetry = "telemetry";
        public const string Command = "command";
        public const string Response = "response";
        public const string Event = "event";
        public const string Heartbeat = "heartbeat";
        public const string Alert = "alert";
    }

    public static class Headers {
        public const string DeviceId = "device-id";
        public const string MessageType = "message-type";
        public const string Timestamp = "timestamp";
        public const string CorrelationId = "correlation-id";
        public const string Protocol = "protocol";
        public const string ContentType = "content-type";
    }

    public static class Events {
        public const string DeviceConnected = "device.connected";
        public const string DeviceDisconnected = "device.disconnected";
        public const string MessageReceived = "message.received";
        public const string MessageProcessed = "message.processed";
        public const string CommandExecuted = "command.executed";
        public const string ErrorOccurred = "error.occurred";
    }
}