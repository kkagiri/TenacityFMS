using FMS.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace FMS.Application.ModelsDTOs.FMS.Vehicle
{
    public class VehicleDTO
    {
        public string HyoungNo { get; set; } = null!;

        public int VehicleId { get; set; }

        public int? VehicleTypeId { get; set; }

        public int? VehicleModelId { get; set; }

        public int? VehicleManufacturerId { get; set; }

        public string? Yom { get; set; } = null!;

        public int? DeviceId { get; set; }

        public int? DefaultEmployeeId { get; set; }

        public int? WorkingSiteId { get; set; }

        public decimal? ExcessWorkingHrCost { get; set; }

        public string? NumberPlate { get; set; } = null!;

        public bool AverageKmL { get; set; }

        public string? Capacity { get; set; } = null;

        public string? Passenger { get; set; } = null!;
        public string? CurrentPhysicalReading { get; set; } = null!;

        public int? DefaultExptdAvgid { get; set; }

        [JsonIgnore]

        public string ExpectedAverageclassificationName { get; set; } = null!;

        [JsonIgnore]
        public decimal? ExpectedAverageValue { get; set; }


        [JsonIgnore]
        public string CombinedExpectedAverage => $"{ExpectedAverageclassificationName} {ExpectedAverageValue}" ?? "";

        public List<string> Tags { get; set; } = new List<string>();

    }
}
