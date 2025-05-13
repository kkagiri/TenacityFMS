namespace FMS.Domain.Entities
{
    public class DeviceConnection
    {
        public int Id { get; set; } // Will need to be assigned before save or DB altered to AUTO_INCREMENT
        public string IpAddress { get; set; }
        public DateTime ConnectedAt { get; set; }
        public DateTime? DisconnectedAt { get; set; }
        public DateTime LastActivityAt { get; set; }
        public string ConnectionType { get; set; } // Type mismatch with DB - DB has datetime
        public string Status { get; set; }
        public string? PtsdeviceId { get; set; } // Type mismatch with DB - DB has int

        // Navigation property
        public virtual Ptsdevice Ptsdevice { get; set; }
    }
}