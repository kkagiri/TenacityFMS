using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using FMS.Domain.Entities.enums;

namespace FMS.Application.Features.FMS.TankVolumeHistory
{
    public class TankVolumeHistoryDTO
    {
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

        /// <summary>
        /// GPS-reported refill volume from GPSGate (if available)
        /// Only populated when IncludeGpsData = true and vehicle has GPS mapping
        /// </summary>
        public decimal? GpsVolume { get; set; }

        /// <summary>
        /// Vehicle ID for GPS data lookup
        /// </summary>
        public int? VehicleId { get; set; }

        // <summary>
        /// For TransferIn: The source tank ID where fuel came from
        /// For TransferOut: The destination tank ID where fuel went to
        /// </summary>
        public int? TransferTankId { get; set; }

        /// <summary>
        /// For TransferIn: The source tank name where fuel came from
        /// For TransferOut: The destination tank name where fuel went to
        /// </summary>
        public string? TransferTankName { get; set; }

        /// <summary>
        /// For TransferIn: The source tank site name
        /// For TransferOut: The destination tank site name
        /// </summary>
        public string? TransferTankSite { get; set; }

    }
}