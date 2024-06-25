using FMS.Application.ModelsDTOs.FMS.Vehicle;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Application.ModelsDTOs.NaftaATG
{
    public class CardDetailsDTO
    {
        public string CardId { get; set; } = string.Empty;
        public string Holder { get; set; } = string.Empty;
        public bool IsVehicle { get; set; }
        public VehicleDTO Vehicle { get; set; }
    }

    public class VehicleDTO
    {
        public string HyoungNo { get; set; }
        public int? VehicleId { get; set; }
        public string VehicleTypeId { get; set; } = string.Empty;
    }
}
