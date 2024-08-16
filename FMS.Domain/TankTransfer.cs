using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities
{
    public  partial class TankTransfer
    {
        public int Id { get; set; }
        public int? SourceTankId { get; set; }
        public int? DestinationTankId { get; set; }
        public decimal? Amount { get; set; }
        public DateTime? TransferDate { get; set; }
        public string? RecordedBy { get; set; } = null;

        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

        public virtual Tank SourceTank { get; set; } = null!;
        public virtual Tank DestinationTank { get; set; } = null!;

        public virtual User RecordedByNavigation { get; set; } = null!;
    }
}
