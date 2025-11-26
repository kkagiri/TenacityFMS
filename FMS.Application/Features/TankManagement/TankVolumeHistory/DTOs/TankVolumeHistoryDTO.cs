using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using FMS.Domain.Entities.enums;

namespace FMS.Application.Features.FMS.TankVolumeHistory {
    public class TankVolumeHistoryDTO {
        public int Id { get; set; }
        public int? TankId { get; set; }
        public DateTime Timestamp { get; set; }
        public decimal? VolumeChange { get; set; }
        public decimal? NewVolume { get; set; }
        public VolumeChangeReasonEnum ChangeReason { get; set; }
        public string? RecordedBy { get; set; } = null;
        public string? RecordedByUserName { get; set; } = null;
        public string? VehicleName { get; set; }
        public string? VehicleType { get; set; }

        public string? ReferenceType { get; set; } = null;

        public int? ReferenceId { get; set; }
        public string? Site { get; set; } = null;
        public int? SiteId { get; set; }

    }
}