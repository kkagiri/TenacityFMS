using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities {
    public partial class TankTransfer {
        public int Id { get; set; }
        public int? SourceTankId { get; set; }
        public int? DestinationTankId { get; set; }
        public decimal? Amount { get; set; }
        public DateTime? TransferDate { get; set; }
        public string? RecordedBy { get; set; } = null;

        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

        // Soft delete properties
        /// <summary>
        /// Indicates if this record has been soft deleted
        /// </summary>
        public bool IsDeleted { get; set; } = false;

        /// <summary>
        /// When this record was soft deleted
        /// </summary>
        public DateTime? DeletedAt { get; set; }

        /// <summary>
        /// User who soft deleted this record
        /// </summary>
        public string? DeletedBy { get; set; }

        // Correction tracking properties
        /// <summary>
        /// Indicates if this record is a correction entry
        /// </summary>
        public bool IsCorrection { get; set; } = false;

        /// <summary>
        /// Reference to the original record ID that this entry corrects (if this is a correction)
        /// </summary>
        public int? CorrectsRecordId { get; set; }

        /// <summary>
        /// Reason for the correction
        /// </summary>
        public string? CorrectionReason { get; set; }

        public virtual Tank SourceTank { get; set; } = null!;
        public virtual Tank DestinationTank { get; set; } = null!;

        public virtual User RecordedByNavigation { get; set; } = null!;
        public virtual User? DeletedByNavigation { get; set; }

        // Self-referencing relationship for corrections
        public virtual TankTransfer? CorrectsRecord { get; set; }
        public virtual ICollection<TankTransfer> CorrectionRecords { get; set; } = [];
    }
}