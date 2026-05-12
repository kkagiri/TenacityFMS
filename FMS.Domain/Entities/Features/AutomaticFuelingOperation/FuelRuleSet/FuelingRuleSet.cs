using FMS.Domain.Entities.Features.FuelRule;

namespace FMS.Domain.Entities.Features.FuelRuleSet
{
    /// <summary>
    /// FuelingRuleSet is a template containing fueling rules that can be assigned to
    /// Site/VehicleType/Vehicle/Tag via cascade hierarchy.
    ///
    /// NOTE: Geofence validation is now a GLOBAL system-wide policy configured via SystemConfiguration.
    /// Allowed geofence groups are stored in the gps_geofence_group.is_allowed_for_fueling column.
    /// </summary>
    public class FuelingRuleSet
    {
        public int Id { get; set; }
        public String Name { get; set; }
        public string? Description { get; set; }
        public virtual ICollection<FuelTag> Tags { get; set; } = new List<FuelTag>();

        public virtual ICollection<FuelingRule> Rules { get; set; } = new List<FuelingRule>();
    }
}