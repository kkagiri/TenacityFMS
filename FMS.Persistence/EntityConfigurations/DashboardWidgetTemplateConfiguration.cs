using FMS.Domain.Entities.Dashboard;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations {
    public class DashboardWidgetTemplateConfiguration : EntityTypeConfiguration<DashboardWidgetTemplate> {
        public override void Configure (EntityTypeBuilder<DashboardWidgetTemplate> builder) {
            builder.ToTable ("dashboard_widget_template")
                .HasCharSet ("utf8mb4").UseCollation ("utf8mb4_general_ci");

            builder.HasKey (x => x.Id).HasName ("PRIMARY");

            builder.Property (x => x.WidgetType).HasMaxLength (50).IsRequired ();
            builder.Property (x => x.Name).HasMaxLength (100).IsRequired ();
            builder.Property (x => x.DisplayName).HasMaxLength (200).IsRequired ();
            builder.Property (x => x.Description).HasMaxLength (500).IsRequired ();
            builder.Property (x => x.Category).HasMaxLength (50).IsRequired ();
            builder.Property (x => x.DataSource).HasMaxLength (50).IsRequired ();
            builder.Property (x => x.ConfigurationJson).HasColumnType ("longtext").IsRequired ();
            builder.Property (x => x.RequiredRole).HasMaxLength (100);
            builder.Property (x => x.RequiredPermissions).HasMaxLength (500);
            builder.Property (x => x.CreatedAt).HasDefaultValueSql ("CURRENT_TIMESTAMP");
            builder.Property (x => x.UpdatedAt).HasDefaultValueSql ("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

            // Indexes
            builder.HasIndex (x => x.WidgetType).HasDatabaseName ("IX_DashboardWidgetTemplate_Type");
            builder.HasIndex (x => x.Category).HasDatabaseName ("IX_DashboardWidgetTemplate_Category");
            builder.HasIndex (x => x.IsEnabled).HasDatabaseName ("IX_DashboardWidgetTemplate_Enabled");
        }
    }
}