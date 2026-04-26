using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FMS.Domain.Entities.Features.FuelRule;

namespace FMS.Domain.Entities.Features.FuelRuleSet
{
    /// <summary>
    /// Links a FuelingRuleSet (template) to a target entity (Site, VehicleType, Vehicle, or Tag).
    /// This enables the cascade/inheritance model:
    ///   Site (default) → VehicleType (override) → Tag (override) → Vehicle (most specific override)
    ///
    /// Rules are MERGED from all applicable assignments when evaluating fuel allowance.
    /// Priority determines which value wins when the same rule type appears multiple times.
    /// </summary>
    [Table("fueling_rule_set_assignments")]
    public class FuelingRuleSetAssignment
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        /// <summary>
        /// The FuelingRuleSet (template) being assigned
        /// </summary>
        [Column("fueling_rule_set_id")]
        public int FuelingRuleSetId { get; set; }

        /// <summary>
        /// Navigation property to the RuleSet
        /// </summary>
        public virtual FuelingRuleSet FuelingRuleSet { get; set; } = null!;

        /// <summary>
        /// Type of target this assignment applies to
        /// </summary>
        [Column("target_type")]
        public AssignmentTargetType TargetType { get; set; }

        /// <summary>
        /// Site ID (when TargetType = Site)
        /// Assignment applies to all vehicles at this site as a default
        /// </summary>
        [Column("site_id")]
        public int? SiteId { get; set; }

        /// <summary>
        /// Navigation to Site
        /// </summary>
        public virtual Site? Site { get; set; }

        /// <summary>
        /// VehicleType ID (when TargetType = VehicleType)
        /// Assignment applies to all vehicles of this type (e.g., all Tippers)
        /// </summary>
        [Column("vehicle_type_id")]
        public int? VehicleTypeId { get; set; }

        /// <summary>
        /// Navigation to VehicleType
        /// </summary>
        public virtual Vehicletype? VehicleType { get; set; }

        /// <summary>
        /// Vehicle ID (when TargetType = Vehicle)
        /// Most specific assignment - applies to this specific vehicle only
        /// </summary>
        [Column("vehicle_id")]
        public int? VehicleId { get; set; }

        /// <summary>
        /// Navigation to Vehicle
        /// </summary>
        public virtual Vehicle? Vehicle { get; set; }

        /// <summary>
        /// Tag ID (when TargetType = Tag)
        /// Assignment applies when this specific tag is used for fueling
        /// </summary>
        [Column("tag_id")]
        public int? TagId { get; set; }

        /// <summary>
        /// Navigation to FuelTag
        /// </summary>
        public virtual FuelTag? Tag { get; set; }

        /// <summary>
        /// Priority for conflict resolution.
        /// Higher priority = more specific = wins in conflicts.
        /// Default priorities: Site=10, VehicleType=50, Tag=80, Vehicle=100
        /// Can be customized for special cases.
        /// </summary>
        [Column("priority")]
        public int Priority { get; set; }

        /// <summary>
        /// Whether this assignment is currently active
        /// </summary>
        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// When this assignment was created
        /// </summary>
        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// User who created this assignment
        /// </summary>
        [Column("created_by_user_id")]
        public int? CreatedByUserId { get; set; }

        /// <summary>
        /// When this assignment was last updated
        /// </summary>
        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        /// <summary>
        /// User who last updated this assignment
        /// </summary>
        [Column("updated_by_user_id")]
        public int? UpdatedByUserId { get; set; }

        /// <summary>
        /// Optional description/notes for this assignment
        /// </summary>
        [MaxLength(500)]
        [Column("description")]
        public string? Description { get; set; }

        /// <summary>
        /// Validates that exactly one target ID is set based on TargetType
        /// </summary>
        public bool IsValid()
        {
            return TargetType switch
            {
                AssignmentTargetType.Site => SiteId.HasValue && !VehicleTypeId.HasValue && !VehicleId.HasValue && !TagId.HasValue,
                AssignmentTargetType.VehicleType => VehicleTypeId.HasValue && !SiteId.HasValue && !VehicleId.HasValue && !TagId.HasValue,
                AssignmentTargetType.Vehicle => VehicleId.HasValue && !SiteId.HasValue && !VehicleTypeId.HasValue && !TagId.HasValue,
                AssignmentTargetType.Tag => TagId.HasValue && !SiteId.HasValue && !VehicleTypeId.HasValue && !VehicleId.HasValue,
                _ => false
            };
        }

        /// <summary>
        /// Gets a display name for the assignment target
        /// </summary>
        public string GetTargetDisplayName()
        {
            return TargetType switch
            {
                AssignmentTargetType.Site => $"Site: {Site?.Name ?? SiteId?.ToString() ?? "Unknown"}",
                AssignmentTargetType.VehicleType => $"Type: {VehicleType?.Name ?? VehicleTypeId?.ToString() ?? "Unknown"}",
                AssignmentTargetType.Vehicle => $"Vehicle: {Vehicle?.VehicleCode ?? VehicleId?.ToString() ?? "Unknown"}",
                AssignmentTargetType.Tag => $"Tag: {Tag?.Name ?? TagId?.ToString() ?? "Unknown"}",
                _ => "Unknown"
            };
        }
    }
}
