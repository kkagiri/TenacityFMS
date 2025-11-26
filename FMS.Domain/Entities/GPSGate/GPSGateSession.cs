using System;

namespace FMS.Domain.Entities.GPSGate
{
    public class GPSGateSession
    {
        public int Id { get; set; }
        public string SessionId { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public int ApplicationId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public bool IsActive { get; set; }
        public DateTime? LastUsed { get; set; }
        public string? IpAddress { get; set; }  // Nullable - database may have NULL
    }
}
