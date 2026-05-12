using System.ComponentModel.DataAnnotations;

namespace FMS.Domain.Entities {
    public class VehicleLocationTagMonitoringConfig {
        [Key]
        public int Id { get; set; }
        public int? VehicleId { get; set; } // null means applies to all vehicles for this tag
        public string TagName { get; set; } = string.Empty;
        public bool IsEnabled { get; set; } = true;
        public string IgnoredLocations { get; set; } = string.Empty; // comma-separated list
        public bool Monitored { get; set; } = true;

        public virtual Vehicle? Vehicle { get; set; }
    }
}