using System.Collections.Generic;

namespace FMS.Application.Features.FMS.AutomatedReconciliation {
    /// <summary>
    /// Data Transfer Object for ReconciliationTankScope
    /// </summary>
    public class ReconciliationTankScopeDTO {
        public List<int> SiteIds { get; set; } = new List<int> ();
        public List<int> TankIds { get; set; } = new List<int> ();
        public List<string> FuelTypes { get; set; } = new List<string> ();
        public bool? HighPriorityOnly { get; set; }
        public decimal? MinCapacity { get; set; }
        public decimal? MaxCapacity { get; set; }
    }
}