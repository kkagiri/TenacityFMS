using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities.Features.AutomaticReconciliation {
    public class DiscrepancyRecord {
        public int Id { get; set; }
        public int TankId { get; set; }
        public int PolicyId { get; set; }
        public int ExecutionId { get; set; }
        public DateTime DetectedAt { get; set; }
        public decimal VarianceLiters { get; set; }
        public decimal VariancePercentage { get; set; }
        public bool IsResolved { get; set; }
        // Navigation properties
        public Tank Tank { get; set; }
        public ReconciliationPolicy Policy { get; set; }
        public ReconciliationPolicyExecution Execution { get; set; }
    }
}