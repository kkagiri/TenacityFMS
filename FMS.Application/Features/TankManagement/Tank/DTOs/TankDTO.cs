using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace FMS.Application.ModelsDTOs.FMS.Tank
{
    public class TankDTO
    {
        public int Id { get; set; }

        public string Name { get; set; } = null!;

        public decimal TankVolume { get; set; }

        public decimal? TankHeight { get; set; }

        public string? PtsId { get; set; }

        public int SiteId { get; set; }
        public decimal? DiscrepancyThreshold { get; set; }
        public decimal? TankLength { get; set; }

        public decimal CurrentStock { get; set; }
        public bool UseBookKeeping { get; set; }

        public DateTime LastStockUpdate { get; set; }


        [JsonIgnore]
        public string? SiteName { get; set; }
    }
}
