using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper.Configuration.Annotations;
using Newtonsoft.Json;

namespace FMS.Application.ModelsDTOs.FMS.Delivery.cs {
    public class DeliveryDTO {
        public int Id { get; set; }
        public int TankId { get; set; }

        [Ignore]
        [JsonIgnore]
        public string? Site { get; set; }
        public DateTime? DeliveryDate { get; set; }
        public DateTime CreatedOn { get; set; }
        public decimal ManualDeliveryAmount { get; set; }
        public decimal? SensorDeliveryAmount { get; set; }
        public decimal? DeliveryTemperature { get; set; }
        public decimal? DeliveryDensity { get; set; }
        public decimal? DeliveryMass { get; set; }
        public decimal StockBeforeDelivery { get; set; }
        public decimal StockAfterDelivery { get; set; }
        public decimal PricePerLiter { get; set; }
        public string? RecordedBy { get; set; }
        public int SupplierId { get; set; }
        public string? Lponumber { get; set; }
        public string? Product { get; set; }

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