using FMS.Domain.Entities.Dashboard;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    public class DashboardWidgetInstanceConfiguration : EntityTypeConfiguration<DashboardWidgetInstance>
    {
        public override void Configure(EntityTypeBuilder<DashboardWidgetInstance> builder)
        {
            builder.ToTable("dashboard_widget_instance");

            builder.HasKey(x => x.Id).HasName("PRIMARY");

            // User and identification
            builder.Property(x => x.UserId).HasMaxLength(100).IsRequired();
            builder.Property(x => x.CustomName).HasMaxLength(200).IsRequired();

            // Core widget properties (moved from template level)
            builder.Property(x => x.WidgetType).HasMaxLength(50).IsRequired();
            builder.Property(x => x.Category).HasMaxLength(50).IsRequired();
            builder.Property(x => x.DataSource).HasMaxLength(50).IsRequired();

            // Configuration and metadata
            builder.Property(x => x.ConfigurationJson).IsRequired();
            builder.Property(x => x.IsCustomWidget).HasDefaultValue(false);

            // Layout properties
            builder.Property(x => x.PositionX).IsRequired();
            builder.Property(x => x.PositionY).IsRequired();
            builder.Property(x => x.Width).IsRequired();
            builder.Property(x => x.Height).IsRequired();
            builder.Property(x => x.IsVisible).HasDefaultValue(true);

            // Audit fields
            builder.Property(x => x.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            builder.Property(x => x.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

            // Indexes
            builder.HasIndex(x => x.UserId).HasDatabaseName("IX_DashboardWidgetInstance_User");
            builder.HasIndex(x => new { x.UserId, x.TemplateId }).HasDatabaseName("IX_DashboardWidgetInstance_UserTemplate");
            builder.HasIndex(x => x.TemplateId).HasDatabaseName("IX_DashboardWidgetInstance_Template");
            builder.HasIndex(x => x.Category).HasDatabaseName("IX_DashboardWidgetInstance_Category");
            builder.HasIndex(x => x.IsCustomWidget).HasDatabaseName("IX_DashboardWidgetInstance_IsCustom");

            // Foreign Keys - Template is now OPTIONAL
            builder.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_DashboardWidgetInstance_User");

            builder.HasOne(x => x.Template)
                .WithMany(x => x.WidgetInstances)
                .HasForeignKey(x => x.TemplateId)
                .OnDelete(DeleteBehavior.SetNull) // Don't delete instance if template is removed
                .IsRequired(false) // Make template optional
                .HasConstraintName("FK_DashboardWidgetInstance_Template");

            builder.HasQueryFilter(x => x.User.IsDeleted != true);
        }
    }
}

