using FMS.Domain.Entities.enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities
{
    /// <summary>
    /// Provides a detailed, chronological record of all volume changes in a tank.
    /// </summary>
    public partial class TankVolumeHistory
    {
        public int Id { get; set; }
        public int? TankId { get; set; }
        public DateTime Timestamp { get; set; }
        public decimal? VolumeChange { get; set; }
        public decimal? NewVolume { get; set; }
        public VolumeChangeReasonEnum ChangeReason { get; set; }
        public string? RecordedBy { get; set; } = null;
        public int? ReferenceId { get; set; }
        public string? ReferenceType { get; set; }
        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

        public virtual Tank Tank { get; set; } = null!;
        public virtual User RecordedByNavigation { get; set; } = null!;




    }
}
