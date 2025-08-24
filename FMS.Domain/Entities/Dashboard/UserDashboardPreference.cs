using System;

namespace FMS.Domain.Entities.Dashboard {
    /// <summary>
    /// Stores a user's complete dashboard preferences (versioned JSON payload) for customizable dashboard.
    /// Single row per user (active) – additional rows possible for history / versioning if needed later.
    /// </summary>
    public class UserDashboardPreference {
        public Guid Id { get; set; } = Guid.NewGuid ();
        public string UserId { get; set; } = null!; // FK to AspNetUsers (User)
        public string PreferencesJson { get; set; } = null!; // JSON blob as per documented schema
        public string Version { get; set; } = "1.0"; // schema version
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // audit
        public string CreatedBy { get; set; } = null!;
        public string? UpdatedBy { get; set; }

        // Navigation
        public virtual User User { get; set; } = null!;
    }
}