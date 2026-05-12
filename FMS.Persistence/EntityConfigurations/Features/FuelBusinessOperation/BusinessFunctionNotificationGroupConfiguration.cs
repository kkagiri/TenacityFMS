using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations {
    /// <summary>
    /// Entity configuration for BusinessFunctionNotificationGroup
    /// Maps business function trigger sources to notification groups
    /// </summary>
    public class BusinessFunctionNotificationGroupConfiguration : IEntityTypeConfiguration<BusinessFunctionNotificationGroup> {
        public void Configure(EntityTypeBuilder<BusinessFunctionNotificationGroup> builder) {
            builder.ToTable("BusinessFunctionNotificationGroups");

            // Primary key
            builder.HasKey(e => e.Id);

            // Properties
            builder.Property(e => e.TriggerSource)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(e => e.GroupId)
                .IsRequired();

            builder.Property(e => e.SiteId)
                .IsRequired(false); // Nullable for global mappings

            builder.Property(e => e.IsActive)
                .IsRequired()
                .HasDefaultValue(true);

            builder.Property(e => e.AllowedDeliveryMethods)
                .HasMaxLength(100)
                .IsRequired(false);

            builder.Property(e => e.MinimumSeverity)
                .HasMaxLength(20)
                .IsRequired(false);

            builder.Property(e => e.CreatedAt)
                .IsRequired()
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(e => e.CreatedBy)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(e => e.UpdatedAt)
                .IsRequired(false);

            builder.Property(e => e.UpdatedBy)
                .HasMaxLength(100)
                .IsRequired(false);

            // Foreign key relationships
            builder.HasOne(e => e.Group)
                .WithMany()
                .HasForeignKey(e => e.GroupId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_BusinessFunctionNotificationGroup_Group");

            builder.HasOne(e => e.Site)
                .WithMany()
                .HasForeignKey(e => e.SiteId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired(false)
                .HasConstraintName("FK_BusinessFunctionNotificationGroup_Site");

            // Indexes
            builder.HasIndex(e => e.TriggerSource)
                .HasDatabaseName("IX_BusinessFunctionNotificationGroups_TriggerSource");

            builder.HasIndex(e => e.GroupId)
                .HasDatabaseName("IX_BusinessFunctionNotificationGroups_GroupId");

            builder.HasIndex(e => e.SiteId)
                .HasDatabaseName("IX_BusinessFunctionNotificationGroups_SiteId");

            builder.HasIndex(e => new { e.TriggerSource, e.SiteId })
                .HasDatabaseName("IX_BusinessFunctionNotificationGroups_TriggerSource_SiteId");

            builder.HasIndex(e => new { e.IsActive, e.TriggerSource })
                .HasDatabaseName("IX_BusinessFunctionNotificationGroups_IsActive_TriggerSource");

            // Unique constraint to prevent duplicate mappings
            builder.HasIndex(e => new { e.TriggerSource, e.GroupId, e.SiteId })
                .IsUnique()
                .HasDatabaseName("UX_BusinessFunctionNotificationGroups_TriggerSource_Group_Site");
        }
    }
}


