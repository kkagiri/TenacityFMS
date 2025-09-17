using System;

namespace FMS.Domain.Entities
{
    public class SeedingHistory
    {
        public int Id { get; set; }
        public string SeedType { get; set; } // e.g., "InitialSetup", "NavigationItems", etc.
        public DateTime SeedDate { get; set; }
        public string Version { get; set; }
        public string Description { get; set; }
    }
}