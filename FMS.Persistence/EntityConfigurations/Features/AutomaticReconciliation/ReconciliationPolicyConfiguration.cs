//Cursor - Entity Framework Configuration for ReconciliationPolicy
using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the ReconciliationPolicy entity
    /// </summary>
    public class ReconciliationPolicyConfiguration : EntityTypeConfiguration<ReconciliationPolicy>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<ReconciliationPolicy> builder)
        {
            try
            {
                builder.HasKey(e => e.Id);

                builder.ToTable("reconciliationpolicy");

                // Indexes
                builder.HasIndex(e => e.SiteId, "FK_ReconciliationPolicy_Site_idx");
                builder.HasIndex(e => e.CreatedBy, "FK_ReconciliationPolicy_CreatedBy_idx");
                builder.HasIndex(e => e.ModifiedBy, "FK_ReconciliationPolicy_ModifiedBy_idx");
                builder.HasIndex(e => e.IsActive, "IX_ReconciliationPolicy_IsActive");
                builder.HasIndex(e => e.NextExecution, "IX_ReconciliationPolicy_NextExecution");

                // Properties
                builder.Property(e => e.Id);
                builder.Property(e => e.Name).HasMaxLength(100).IsRequired();
                builder.Property(e => e.Description).HasMaxLength(500);
                builder.Property(e => e.IsActive).HasDefaultValue(true);
                builder.Property(e => e.ScheduleConfiguration);
                builder.Property(e => e.DiscrepancyThreshold).HasPrecision(10, 2);
                builder.Property(e => e.DiscrepancyPercentageThreshold).HasPrecision(5, 2);
                builder.Property(e => e.SiteId);
                builder.Property(e => e.TankScopeConfiguration);
                builder.Property(e => e.Priority).HasDefaultValue(100);
                builder.Property(e => e.MaxTanksPerExecution);
                builder.Property(e => e.NotificationConfiguration);
                builder.Property(e => e.CreatedBy).HasMaxLength(50).IsRequired();
                builder.Property(e => e.CreatedOn).HasDefaultValueSql("CURRENT_TIMESTAMP");
                builder.Property(e => e.ModifiedBy).HasMaxLength(50);
                builder.Property(e => e.ModifiedOn);
                builder.Property(e => e.LastExecuted);
                builder.Property(e => e.NextExecution);

                // Relationships
                builder.HasOne(d => d.Site)
                    .WithMany()
                    .HasForeignKey(d => d.SiteId)
                    .HasConstraintName("FK_ReconciliationPolicy_Site");

                builder.HasOne(d => d.CreatedByNavigation)
                    .WithMany()
                    .HasForeignKey(d => d.CreatedBy)
                    .HasConstraintName("FK_ReconciliationPolicy_CreatedBy");

                builder.HasOne(d => d.ModifiedByNavigation)
                    .WithMany()
                    .HasForeignKey(d => d.ModifiedBy)
                    .HasConstraintName("FK_ReconciliationPolicy_ModifiedBy");

                builder.HasMany(d => d.PolicyExecutions)
                    .WithOne(p => p.Policy)
                    .HasForeignKey(p => p.PolicyId)
                    .HasConstraintName("FK_ReconciliationPolicyExecution_Policy");

                builder.HasQueryFilter(e =>
                    e.CreatedByNavigation.IsDeleted != true &&
                    (e.ModifiedByNavigation == null || e.ModifiedByNavigation.IsDeleted != true));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring ReconciliationPolicy: {ex.Message}");
                throw;
            }
        }
    }
}
