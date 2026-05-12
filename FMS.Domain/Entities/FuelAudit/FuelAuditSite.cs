using System;

namespace FMS.Domain.Entities.FuelAudit
{
    /// <summary>
    /// Junction table for multi-site fuel audits.
    /// Allows a single fuel audit to span multiple sites.
    /// </summary>
    public class FuelAuditSite
    {
        /// <summary>
        /// Primary key
        /// </summary>
        public long Id { get; set; }

        /// <summary>
        /// Foreign key to FuelAudit
        /// </summary>
        public long AuditId { get; set; }

        /// <summary>
        /// Foreign key to Site
        /// </summary>
        public int SiteId { get; set; }

        /// <summary>
        /// Order/priority of the site (0 = primary site)
        /// </summary>
        public int SiteOrder { get; set; } = 0;

        /// <summary>
        /// When this site was added to the audit
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // ===== NAVIGATION PROPERTIES =====
        /// <summary>
        /// Parent fuel audit
        /// </summary>
        public virtual FuelAudit? Audit { get; set; }
    }
}
