using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Application.Features.FMS.TankTransfer {
    public class TankTransferDTO {
        public int Id { get; set; }
        public int? SourceTankId { get; set; }
        public int? DestinationTankId { get; set; }
        public decimal? Amount { get; set; }
        public DateTime? Date { get; set; }
        public string? RecordedBy { get; set; } = null;
    }
}