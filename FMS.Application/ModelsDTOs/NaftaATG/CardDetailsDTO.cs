using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using FMS.Application.Features.Vehicle.DTOs;

namespace FMS.Application.Features.NaftaATG {
    public class CardDetailsDTO {
        public string CardId { get; set; } = string.Empty;
        public string Holder { get; set; } = string.Empty;
        public bool IsVehicle { get; set; }

        [JsonPropertyName ("vehicle")]
        public VehicleDTO Vehicle { get; set; }
    }

}