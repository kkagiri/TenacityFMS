using FMS.Domain.Entities.FuelAudit;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations.FuelAudit
{
    /// <summary>
    /// Entity configuration for FuelAuditSite (multi-site support junction table)
    /// </summary>
    public class FuelAuditSiteConfiguration : IEntityTypeConfiguration<FuelAuditSite>
    {
        public void Configure(EntityTypeBuilder<FuelAuditSite> builder)
        {
            builder.ToTable("fuel_audit_sites");

            builder.HasKey(s => s.Id);

            builder.Property(s => s.Id)
                .HasColumnName("id")
                .ValueGeneratedOnAdd();

            builder.Property(s => s.AuditId)
                .HasColumnName("audit_id")
                .IsRequired();

            builder.Property(s => s.SiteId)
                .HasColumnName("site_id")
                .IsRequired();

            builder.Property(s => s.SiteOrder)
                .HasColumnName("site_order")
                .HasDefaultValue(0);

            builder.Property(s => s.CreatedAt)
                .HasColumnName("created_at")
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            // Indexes
            builder.HasIndex(s => s.AuditId);
            builder.HasIndex(s => s.SiteId);
            builder.HasIndex(s => new { s.AuditId, s.SiteId }).IsUnique();

            // Relationship with FuelAudit
            builder.HasOne(s => s.Audit)
                .WithMany(a => a.AuditSites)
                .HasForeignKey(s => s.AuditId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
