
namespace FMS.Domain.Entities
{
    public class DeviceConnection
    {
        public int Id { get; set; }
        // public string DeviceId { get; set; }
        public string IpAddress { get; set; }
        public DateTime ConnectedAt { get; set; }
        public DateTime? DisconnectedAt { get; set; }
        public DateTime LastActivityAt { get; set; }
        public string ConnectionType { get; set; } // "WebSocket" or "HTTP"
        public string Status { get; set; }
        public string? PtsdeviceId { get; set; }

        // Navigation property
        public virtual Ptsdevice Ptsdevice { get; set; }
    }
}