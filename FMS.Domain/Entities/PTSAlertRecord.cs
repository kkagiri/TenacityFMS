using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities {
    /// <summary>
    /// Entity to store PTS alert records from UploadAlertRecord packets
    /// </summary>
    public class PTSAlertRecord {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// PTS device ID that sent the alert
        /// </summary>
        [Required]
        [MaxLength (50)]
        public string PtsId { get; set; } = null!;

        /// <summary>
        /// Type of device that triggered the alert (PTS, Pump, Probe, PriceBoard, Reader)
        /// </summary>
        [Required]
        [MaxLength (20)]
        public string DeviceType { get; set; } = null!;

        /// <summary>
        /// Device number within the PTS system
        /// </summary>
        public int DeviceNumber { get; set; }

        /// <summary>
        /// Alert code from PTS protocol
        /// </summary>
        public int AlertCode { get; set; }

        /// <summary>
        /// Alert state (Started, Finished, Detected)
        /// </summary>
        [Required]
        [MaxLength (20)]
        public string State { get; set; } = null!;

        /// <summary>
        /// Date and time when the alert occurred
        /// </summary>
        public DateTime DateTime { get; set; }

        /// <summary>
        /// Configuration ID from PTS
        /// </summary>
        [MaxLength (50)]
        public string? ConfigurationId { get; set; }

        /// <summary>
        /// Associated alarm ID
        /// </summary>
        public int? AlarmId { get; set; }

        /// <summary>
        /// When this alert record was processed by FMS
        /// </summary>
        public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Navigation property to the associated alarm
        /// </summary>
        public virtual Alarm? Alarm { get; set; }
    }
}