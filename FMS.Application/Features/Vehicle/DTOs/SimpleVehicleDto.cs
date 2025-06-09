using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace FMS.Application.Features.Vehicle.DTOs
{
    public class SimpleVehicleDto
    {
        [JsonPropertyName("vehicleId")]
        public int VehicleId { get; set; }

        [JsonPropertyName("hyoungNo")]
        public string HyoungNo { get; set; }
    }
}
