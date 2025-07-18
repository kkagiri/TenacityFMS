using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace FMS.Application.ModelsDTOs.PTS
{
    public class InTankDeliveryDto
    {
        public int Tank { get; set; }
        public int FuelGradeId { get; set; }
        public string? FuelGradeName { get; set; }

        public InTankDeliveryValuesDto StartValues { get; set; }
        public InTankDeliveryValuesDto EndValues { get; set; }
        public InTankDeliveryAbsoluteValuesDto AbsoluteValues { get; set; }

        public string? ConfigurationId { get; set; }

        //Cursor: Add PtsId and PacketId for handler processing
        public string? PtsId { get; set; }
        public int PacketId { get; set; }

        //Cursor: Add TankId for linking to Tank entity
        public int? TankId { get; set; }
    }

    public class InTankDeliveryValuesDto
    {
        [JsonProperty("DateTime")]
        public DateTime DateTime { get; set; }
        public float? ProductHeight { get; set; }
        public float? WaterHeight { get; set; }
        public float? Temperature { get; set; }
        public float? ProductVolume { get; set; }
        public float? ProductTCVolume { get; set; }
        public float? ProductDensity { get; set; }
        public float? ProductMass { get; set; }
    }

    public class InTankDeliveryAbsoluteValuesDto
    {
        public float? ProductHeight { get; set; }
        public float? WaterHeight { get; set; }
        public float? Temperature { get; set; }
        public float? ProductVolume { get; set; }
        public float? ProductTCVolume { get; set; }
        public float? ProductDensity { get; set; }
        public float? ProductMass { get; set; }
        public float? PumpsDispensedVolume { get; set; }
    }
}

