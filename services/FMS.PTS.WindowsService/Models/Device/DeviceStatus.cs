

using FMS.Domain.PTSCommon;

namespace FMS.PTS.WindowsService.Models.Device
{
    public class DeviceStatus
    {

        public string? DeviceId { get; set; }
        public ConnectionState ConnectionState { get; set; }
        public DateTime LastHeartbeat { get; set; }
        public DateTime ConnectedAt { get; set; }
        public Dictionary<string, string> Metadata { get; set; } = new();
        public List<PTSMessage> MessageQueue { get; set; } = new();
        public DeviceHealth Health { get; set; } = new();
        public DateTime LastMessageReceived { get; set; }
        public string? LastMessage { get; set; }
    }
    public enum ConnectionState
    {
        Connected,
        Disconnected,
        Reconnecting,
        Error,
        UnAuthorized
    }

    public class DeviceHealth
    {
        public bool IsHealthy { get; set; }
        public List<string> ActiveAlarms { get; set; } = new();
        public Dictionary<string, double> Metrics { get; set; } = new();
    }
}


