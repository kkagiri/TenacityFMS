using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace FMS.Application.Features.FMS.Tank {
    public class TankDTO {
        public int Id { get; set; }

        public string Name { get; set; } = null!;

        public decimal TankVolume { get; set; }

        public decimal? TankHeight { get; set; }

        public string? PtsId { get; set; }

        public int SiteId { get; set; }
        public decimal? DiscrepancyThreshold { get; set; }
        public decimal? TankLength { get; set; }

        // Align with Domain entity types/nullability
        public decimal? CurrentStock { get; set; }
        public bool UseBookKeeping { get; set; }

        public DateTime LastStockUpdate { get; set; }

        public decimal? PhysicalStockValue { get; set; }

        public DateTime? LastPhysicalStockUpdate { get; set; }

        public string? PhysicalStockSource { get; set; }

        public int? FuelGradeId { get; set; }
        public string? FuelGradeName { get; set; }

        [JsonIgnore]
        public string? SiteName { get; set; }
    }
}