using System;

namespace FMS.Application.Features.FMS.FuelRefil {

    public class FuelRefilDTO {
        public int Id { get; set; }
        public int VehicleId { get; set; }
        public string? HyoungNo { get; set; }

        public decimal? ManualFuelrefillAmount { get; set; }

        public DateTime? Date { get; set; }

        public decimal? PreviousMeterReading { get; set; }

        public decimal? CurrentMeterReading { get; set; }

        public int SiteId { get; set; }

        public string? Comment { get; set; }
        public string? TagId { get; set; } = null!;
        public string FuelBy { get; set; } = null!;

        public int? PumpTranscationId { get; set; }

        public int? DriverId { get; set; }

        public int? TankId { get; set; }

        public string? DateCreated { get; set; }
        public DateTime? DateModified { get; set; }
        public decimal? Consumption { get; set; }
        public bool IsModified { get; set; }

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
    }
}