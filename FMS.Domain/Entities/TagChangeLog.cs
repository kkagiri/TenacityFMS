using System;
using System.ComponentModel.DataAnnotations;

namespace FMS.Domain.Entities {
    public class TagChangeLog {
        [Key]
        public int Id { get; set; }
        public int VehicleId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string OldTag { get; set; } = string.Empty;
        public string NewTag { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string Action { get; set; } = string.Empty; // e.g., TagChanged, NoChange, Ignored
        public string? Note { get; set; }

        public virtual Vehicle? Vehicle { get; set; }
    }
}