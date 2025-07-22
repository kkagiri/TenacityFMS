using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using FMS.Domain.Entities.enums;

namespace FMS.Domain.Entities {
    /// <summary>
    /// Provides a detailed, chronological record of all volume changes in a tank.
    /// </summary>
    public partial class TankVolumeHistory {
        /// <summary>
        /// Gets or sets the unique identifier for the volume history record.
        /// </summary>
        public int Id { get; set; }
        /// <summary>
        /// Gets or sets the unique identifier for the tank associated with this volume history record.
        /// </summary>
        public int? TankId { get; set; }

        public DateTime Timestamp { get; set; }
        /// <summary>
        /// Gets or sets the volume change in liters after processing. it can be positive or negative.
        /// </summary>
        public decimal? VolumeChange { get; set; }
        /// <summary>
        /// Gets or sets the new volume in liters after the change.
        /// This is the new  volume after applying the change to the previous volume.
        /// This field is nullable to allow for cases where the volume is not yet known or applicable.
        /// </summary>
        public decimal? NewVolume { get; set; }
        public VolumeChangeReasonEnum ChangeReason { get; set; }
        public string? RecordedBy { get; set; } = null;
        /// <summary>
        /// Gets or sets the identifier VolumeChangeReasonEnum process that change
        /// This is a foreign key to the volumechangereason process table
        /// </summary>
        public int? ReferenceId { get; set; }
        /// <summary>
        /// Gets or sets the type of reference for this volume history record.It represent VolumeChangeReasonEnum in String format.
        /// This can be used to link the volume change to a specific operation or event, such as a stock adjustment or a manual entry.
        /// </summary>
        public string? ReferenceType { get; set; }
        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

        public virtual Tank Tank { get; set; } = null!;
        public virtual User RecordedByNavigation { get; set; } = null!;
        // Add this to the TankVolumeHistory entity:
        public virtual StockAdjustment? StockAdjustment { get; set; }

    }
}