using System;
using System.Collections.Generic;

namespace FMS.Domain.Entities;

public partial class Configuration
{
    public int Id { get; set; }

    public string? ConfigurationId { get; set; }

    public string Configuration1 { get; set; } = null!;

    public int PacketId { get; set; }

    public string Ptsid { get; set; } = null!;

    // Default timeouts in seconds
    public const int DEFAULT_WEBSOCKET_TIMEOUT = 30;
    public const int DEFAULT_HTTP_TIMEOUT = 60;

    // Configuration keys for timeouts
    public const string WEBSOCKET_TIMEOUT_KEY = "DeviceActivity.WebSocketTimeout";
    public const string HTTP_TIMEOUT_KEY = "DeviceActivity.HttpTimeout";

    public virtual Ptsdevice Pts { get; set; } = null!;
}
