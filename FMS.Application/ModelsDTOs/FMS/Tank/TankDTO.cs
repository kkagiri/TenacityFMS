using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Application.ModelsDTOs.FMS.Tank
{
    public class TankDTO
    {
        public int Id { get; set; }

        public string Name { get; set; } = null!;

        public decimal TankVolume { get; set; }

        public decimal? TankHeight { get; set; }

        public int? PtsId { get; set; }

        public int SiteId { get; set; }
        public decimal? DiscrepancyThreshold { get; set; }
        public decimal? TankLength { get; set; }

        public decimal CurrentStock { get; set; }

        public DateTime LastStockUpdate { get; set; }
    }
}
