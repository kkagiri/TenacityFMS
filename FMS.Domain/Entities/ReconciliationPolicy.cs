using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FMS.Domain.Entities.enums;
using FMS.Domain.Entities.Features.AutomaticReconciliation;

namespace FMS.Domain.Entities {
    /// <summary>
    /// Represents a policy configuration for automated reconciliation
    /// </summary>
    public class ReconciliationPolicy {
        public int Id { get; set; }

        [Required]
        [MaxLength (100)]
        public string Name { get; set; } = null!;

        [MaxLength (500)]
        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;

        public ReconciliationPolicyType ExecutionType { get; set; } // "Scheduled", "EventDriven", "Manual"

        //Cursor - Schedule frequency in hours (from new version)
        public int? ScheduleFrequencyHours { get; set; }

        /// <summary>
        /// JSON configuration for policy schedule (if time-based)
        /// </summary>
        public string? ScheduleConfiguration { get; set; }

        /// <summary>
        /// Threshold configuration for discrepancy-based triggers
        /// </summary>
        public decimal? DiscrepancyThreshold { get; set; }

        /// <summary>
        /// Percentage threshold for discrepancy-based triggers
        /// </summary>
        public decimal? DiscrepancyPercentageThreshold { get; set; }

        /// <summary>
        /// Site scope filter (null for all sites)
        /// </summary>
        public int? SiteId { get; set; }

        /// <summary>
        /// JSON configuration for tank scope filters
        /// </summary>
        public string? TankScopeConfiguration { get; set; }

        /// <summary>
        /// Policy execution priority (higher numbers execute first)
        /// </summary>
        public int Priority { get; set; } = 100;

        /// <summary>
        /// Maximum number of tanks to reconcile per execution
        /// </summary>
        public int? MaxTanksPerExecution { get; set; }

        /// <summary>
        /// Notification configuration for policy results
        /// </summary>
        public string? NotificationConfiguration { get; set; }

        /// <summary>
        /// User who created this policy
        /// </summary>
        [Required]
        [MaxLength (50)]
        public string CreatedBy { get; set; } = null!;

        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// User who last modified this policy
        /// </summary>
        [MaxLength (50)]
        public string? ModifiedBy { get; set; }

        public DateTime? ModifiedOn { get; set; }

        /// <summary>
        /// Last execution timestamp
        /// </summary>
        public DateTime? LastExecuted { get; set; }

        /// <summary>
        /// Next scheduled execution timestamp
        /// </summary>
        public DateTime? NextExecution { get; set; }

        //Cursor - Enhanced next execution time (from new version)
        //public DateTime? NextExecutionTime { get; set; }

        // Navigation properties
        public virtual Site? Site { get; set; }
        public virtual User CreatedByNavigation { get; set; } = null!;
        public virtual User? ModifiedByNavigation { get; set; }
        public virtual ICollection<ReconciliationPolicyExecution> PolicyExecutions { get; set; } = new List<ReconciliationPolicyExecution> ();

        //Cursor - Enhanced navigation properties (from new version)
        public virtual ICollection<ReconciliationPolicyExecution> Executions { get; set; } = new List<ReconciliationPolicyExecution> ();
        public virtual ICollection<DiscrepancyRecord> DiscrepancyRecords { get; set; } = new List<DiscrepancyRecord> ();

        //Cursor - Enhanced computed property for tank scope (from new version)
        [NotMapped]
        public ReconciliationTankScope TankScope {
            get {
                var jsonToUse = !string.IsNullOrEmpty (TankScopeConfiguration) ?
                    TankScopeConfiguration :
                    null;

                if (string.IsNullOrEmpty (jsonToUse))
                    return null;

                try {
                    return System.Text.Json.JsonSerializer.Deserialize<ReconciliationTankScope> (jsonToUse);
                } catch {
                    return null;
                }
            }
            set {
                var serialized = value != null ?
                    System.Text.Json.JsonSerializer.Serialize (value) :
                    null;

                TankScopeConfiguration = serialized; // Keep both for backward compatibility
            }
        }
    }

    //Cursor - Enhanced tank scope configuration class (from new version)
    public class ReconciliationTankScope {
        public List<int> SiteIds { get; set; } = new List<int> ();
        public List<int> TankIds { get; set; } = new List<int> ();
        public List<string> FuelTypes { get; set; } = new List<string> ();
        public bool? HighPriorityOnly { get; set; }
        public decimal? MinCapacity { get; set; }
        public decimal? MaxCapacity { get; set; }
    }
}