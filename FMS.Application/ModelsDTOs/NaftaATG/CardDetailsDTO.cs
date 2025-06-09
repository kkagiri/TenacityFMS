using FMS.Application.Features.Vehicle.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Text.Json.Serialization;

namespace FMS.Application.ModelsDTOs.NaftaATG
{
    public class CardDetailsDTO
    {
        public string CardId { get; set; } = string.Empty;
        public string Holder { get; set; } = string.Empty;
        public bool IsVehicle { get; set; }
        [JsonPropertyName("vehicle")]
        public VehicleDTO Vehicle { get; set; }
    }


}
