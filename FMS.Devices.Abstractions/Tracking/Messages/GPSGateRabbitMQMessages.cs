using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace FMS.Devices.Abstractions.Tracking.Messages
{
    /// <summary>
    /// File: GPSGateRabbitMQMessages.cs
    /// Purpose: Defines GPSGate RabbitMQ payload contracts and connection settings used by FMS integrations.
    /// Dependencies: System.Text.Json serialization attributes
    /// Last Modified: 2026-03-09
    ///
    /// Key Types:
    /// - GPSGateTrackMessage: Represents live GPS position payloads.
    /// - GPSGateEventMessage: Represents GPSGate rule/event notifications.
    /// - GPSGateRabbitMQSettings: Stores RabbitMQ connection and throughput settings.
    /// </summary>
    /// <summary>
    /// Track message from GPSGate RabbitMQ
    /// Reference: https://support.gpsgate.com/hc/en-us/articles/360009458433-RabbitMQ-Integration
    ///
    /// JSON Schema from GPSGate documentation:
    /// - imei: string (required)
    /// - userID: integer (required) - GPSGate user/device ID
    /// - utc: integer (required) - Unix timestamp in milliseconds
    /// - valid: boolean (required) - GPS fix validity
    /// - heading: number (required) - Heading in degrees
    /// - speed: number (required) - Speed in m/s
    /// - lng: number (required) - Longitude
    /// - lat: number (required) - Latitude
    /// - alt: number (required) - Altitude
    /// - fields: object (required) - Custom field data
    /// </summary>
    public class GPSGateTrackMessage
    {
        /// <summary>
        /// IMEI or device identifier
        /// </summary>
        [JsonPropertyName("imei")]
        public string? Imei { get; set; }

        /// <summary>
        /// GPSGate User ID (maps to FMS vehicle via gpsgate_user_id)
        /// </summary>
        [JsonPropertyName("userID")]
        public int UserId { get; set; }

        /// <summary>
        /// Track timestamp in milliseconds since Unix Epoch (UTC)
        /// </summary>
        [JsonPropertyName("utc")]
        public long Utc { get; set; }

        /// <summary>
        /// GPS fix validity
        /// </summary>
        [JsonPropertyName("valid")]
        public bool Valid { get; set; }

        /// <summary>
        /// Heading in degrees (0-360)
        /// </summary>
        [JsonPropertyName("heading")]
        public double Heading { get; set; }

        /// <summary>
        /// Speed in meters per second
        /// </summary>
        [JsonPropertyName("speed")]
        public double Speed { get; set; }

        /// <summary>
        /// Longitude
        /// </summary>
        [JsonPropertyName("lng")]
        public double Longitude { get; set; }

        /// <summary>
        /// Latitude
        /// </summary>
        [JsonPropertyName("lat")]
        public double Latitude { get; set; }

        /// <summary>
        /// Altitude in meters
        /// </summary>
        [JsonPropertyName("alt")]
        public double Altitude { get; set; }

        /// <summary>
        /// Custom field data (field scripts, accumulators, variables)
        /// </summary>
        [JsonPropertyName("fields")]
        public Dictionary<string, JsonElement>? Fields { get; set; }

        /// <summary>
        /// Convert UTC milliseconds to DateTime
        /// </summary>
        public DateTime GetUtcDateTime() => DateTimeOffset.FromUnixTimeMilliseconds(Utc).UtcDateTime;

        /// <summary>
        /// Get speed in km/h (GPSGate sends m/s)
        /// </summary>
        public double GetSpeedKmh() => Speed * 3.6;
    }

    /// <summary>
    /// Event message from GPSGate RabbitMQ
    /// Reference: https://support.gpsgate.com/hc/en-us/articles/360009458433-RabbitMQ-Integration
    ///
    /// JSON Schema from GPSGate documentation:
    /// - id: integer (required) - Event ID
    /// - userID: integer (required) - GPSGate user/device ID
    /// - RuleName: string (required) - Name of the event rule
    /// - UserName: string (required) - Name of the user/device
    /// - Namespace: string (required) - Namespace of the event
    /// - Value: string (required) - Optional value from event rule notifier
    /// - State: string (required) - Event state (Start, End, etc.)
    /// - lng: number (required) - Longitude
    /// - lat: number (required) - Latitude
    /// - alt: number (required) - Altitude
    /// - utc: integer (required) - Unix timestamp in milliseconds
    /// </summary>
    public class GPSGateEventMessage
    {
        /// <summary>
        /// Event ID
        /// </summary>
        [JsonPropertyName("id")]
        public long Id { get; set; }

        /// <summary>
        /// GPSGate User ID (maps to FMS vehicle via gpsgate_user_id)
        /// </summary>
        [JsonPropertyName("userID")]
        public int UserId { get; set; }

        /// <summary>
        /// Name of the event rule that triggered
        /// </summary>
        [JsonPropertyName("RuleName")]
        public string? RuleName { get; set; }

        /// <summary>
        /// Name of the user/device
        /// </summary>
        [JsonPropertyName("UserName")]
        public string? UserName { get; set; }

        /// <summary>
        /// Namespace of the event
        /// </summary>
        [JsonPropertyName("Namespace")]
        public string? Namespace { get; set; }

        /// <summary>
        /// Optional value from the RabbitMQ notifier (can include signal values)
        /// </summary>
        [JsonPropertyName("Value")]
        public string? Value { get; set; }

        /// <summary>
        /// Event state: Start, End, or Always
        /// </summary>
        [JsonPropertyName("State")]
        public string? State { get; set; }

        /// <summary>
        /// Longitude
        /// </summary>
        [JsonPropertyName("lng")]
        public double Longitude { get; set; }

        /// <summary>
        /// Latitude
        /// </summary>
        [JsonPropertyName("lat")]
        public double Latitude { get; set; }

        /// <summary>
        /// Altitude in meters
        /// </summary>
        [JsonPropertyName("alt")]
        public double Altitude { get; set; }

        /// <summary>
        /// Event timestamp in milliseconds since Unix Epoch (UTC)
        /// </summary>
        [JsonPropertyName("utc")]
        public long Utc { get; set; }

        /// <summary>
        /// Convert UTC milliseconds to DateTime
        /// </summary>
        public DateTime GetUtcDateTime() => DateTimeOffset.FromUnixTimeMilliseconds(Utc).UtcDateTime;
    }

    /// <summary>
    /// Wrapper for detecting message type from RabbitMQ routing key
    /// </summary>
    public enum GPSGateMessageType
    {
        Unknown,
        Track,
        Event
    }

    /// <summary>
    /// RabbitMQ connection settings for GPSGate
    /// These will be stored in provider_configurations.configuration_data JSON under "RabbitMQ" key
    /// </summary>
    public class GPSGateRabbitMQSettings
    {
        /// <summary>
        /// RabbitMQ host (e.g., "localhost" or "rabbitmq.gpsgate.local")
        /// </summary>
        public string Host { get; set; } = "localhost";

        /// <summary>
        /// RabbitMQ port (default: 5672 for AMQP, 5671 for AMQPS)
        /// </summary>
        public int Port { get; set; } = 5672;

        /// <summary>
        /// Virtual host (default: "/")
        /// </summary>
        public string VirtualHost { get; set; } = "/";

        /// <summary>
        /// Username for RabbitMQ authentication
        /// </summary>
        public string Username { get; set; } = "guest";

        /// <summary>
        /// Password for RabbitMQ authentication
        /// </summary>
        public string Password { get; set; } = "guest";

        /// <summary>
        /// Exchange name configured in GPSGate (topic exchange)
        /// </summary>
        public string ExchangeName { get; set; } = "gpsgate";

        /// <summary>
        /// Queue name for this consumer (will be declared if not exists)
        /// </summary>
        public string QueueName { get; set; } = "fms-vehicle-tracking";

        /// <summary>
        /// Routing keys to bind to the queue
        /// Examples: "#" (all), "Tracks.#" (all tracks), "Tracks.[imei]" (specific device)
        /// </summary>
        public List<string> RoutingKeys { get; set; } = new() { "#" };

        /// <summary>
        /// Whether to use SSL/TLS for connection
        /// </summary>
        public bool UseSsl { get; set; } = false;

        /// <summary>
        /// SSL server name for certificate validation (when UseSsl is true)
        /// </summary>
        public string? SslServerName { get; set; }

        /// <summary>
        /// Whether the RabbitMQ integration is enabled
        /// </summary>
        public bool Enabled { get; set; } = true;

        /// <summary>
        /// Prefetch count for consumer (number of unacked messages to buffer)
        /// </summary>
        public ushort PrefetchCount { get; set; } = 50;

        /// <summary>
        /// Delay in seconds before attempting reconnection
        /// </summary>
        public int ReconnectDelaySeconds { get; set; } = 5;

        /// <summary>
        /// Serialization type: "JSON" or "Protobuf" - must match GPSGate configuration
        /// </summary>
        public string SerializationType { get; set; } = "JSON";
    }
}
