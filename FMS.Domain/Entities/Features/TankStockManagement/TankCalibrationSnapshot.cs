using System;

namespace FMS.Domain.Entities.Features.TankStockManagement
{
    /// <summary>
    /// Stores a persisted local snapshot of a tank calibration chart and its records.
    /// </summary>
    public class TankCalibrationSnapshot
    {
        public long Id { get; set; }

        public int TankId { get; set; }

        public string TankName { get; set; } = null!;

        public string PtsDeviceId { get; set; } = null!;

        public int ProbeNumber { get; set; }

        public string ChartType { get; set; } = null!;

        public string Source { get; set; } = null!;

        public int TotalRecords { get; set; }

        public DateTime RecordedAtUtc { get; set; }

        public string? RecordedBy { get; set; }

        public string? Notes { get; set; }

        /// <summary>
        /// Serialized JSON array of calibration records (height/volume pairs).
        /// </summary>
        public string RecordsJson { get; set; } = null!;
    }
}
