namespace FMS.Domain.Entities.Features.FuelRuleSet
{
    /// <summary>
    /// Defines the type of target that a FuelingRuleSet can be assigned to.
    /// Priority values are used when multiple assignments apply to the same fueling context.
    /// Higher priority = more specific = wins in conflicts.
    /// </summary>
    public enum AssignmentTargetType
    {
        /// <summary>
        /// Assignment applies to all vehicles at a specific site.
        /// Default priority: 10 (lowest - most general)
        /// </summary>
        Site = 1,

        /// <summary>
        /// Assignment applies to all vehicles of a specific type (e.g., Tippers, Trucks).
        /// Default priority: 50
        /// </summary>
        VehicleType = 2,

        /// <summary>
        /// Assignment applies when a specific fuel tag is used.
        /// Default priority: 80
        /// </summary>
        Tag = 3,

        /// <summary>
        /// Assignment applies to a specific vehicle.
        /// Default priority: 100 (highest - most specific)
        /// </summary>
        Vehicle = 4
    }

    /// <summary>
    /// Helper class for AssignmentTargetType operations
    /// </summary>
    public static class AssignmentTargetTypeExtensions
    {
        /// <summary>
        /// Gets the default priority for a target type.
        /// Higher priority = more specific = wins in conflicts.
        /// </summary>
        public static int GetDefaultPriority(this AssignmentTargetType targetType)
        {
            return targetType switch
            {
                AssignmentTargetType.Site => 10,
                AssignmentTargetType.VehicleType => 50,
                AssignmentTargetType.Tag => 80,
                AssignmentTargetType.Vehicle => 100,
                _ => 0
            };
        }
    }
}
