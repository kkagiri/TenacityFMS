using FMS.Domain.Entities.Dashboard;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations {
    public class DashboardTickerTemplateConfiguration : EntityTypeConfiguration<DashboardTickerTemplate> {
        public override void Configure (EntityTypeBuilder<DashboardTickerTemplate> builder) {
            builder.ToTable ("dashboard_ticker_template")
                .HasCharSet ("utf8mb4").UseCollation ("utf8mb4_general_ci");

            builder.HasKey (x => x.Id).HasName ("PRIMARY");
            builder.HasIndex (x => x.TickerType).IsUnique ();
            builder.Property (x => x.Id).HasColumnType ("int(11)").ValueGeneratedOnAdd ();
            builder.Property (x => x.TickerType).HasMaxLength (100).IsRequired ();
            builder.Property (x => x.Name).HasMaxLength (150).IsRequired ();
            builder.Property (x => x.ConfigurationJson).HasColumnType ("longtext").IsRequired ();
            builder.Property (x => x.RequiredRole).HasMaxLength (100);
            builder.Property (x => x.RequiredPermissions).HasMaxLength (500);
            builder.Property (x => x.IsEnabled).HasDefaultValue (true);
            builder.Property (x => x.CreatedAt).HasDefaultValueSql ("CURRENT_TIMESTAMP");
            builder.Property (x => x.UpdatedAt).HasDefaultValueSql ("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

            // Seed initial ticker templates (MVP set)
            // NOTE: If you modify these seeds later, remember EF will track changes via migrations.
            builder.HasData (
                new DashboardTickerTemplate { Id = 1, TickerType = "tank_levels", Name = "Tank Levels", ConfigurationJson = "{\n  \"version\": 1,\n  \"defaultEnabled\": true,\n  \"category\": \"inventory\",\n  \"description\": \"Real-time tank level summary\",\n  \"defaults\": { \"refreshSeconds\": 60 }\n}", RequiredRole = null, RequiredPermissions = "tank.read", IsEnabled = true, CreatedAt = new DateTime (2025, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime (2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new DashboardTickerTemplate { Id = 2, TickerType = "consumption_summary", Name = "Consumption Summary", ConfigurationJson = "{\n  \"version\": 1,\n  \"defaultEnabled\": true,\n  \"category\": \"usage\",\n  \"description\": \"Daily fuel consumption KPIs\",\n  \"defaults\": { \"refreshSeconds\": 120 }\n}", RequiredRole = null, RequiredPermissions = "consumption.read", IsEnabled = true, CreatedAt = new DateTime (2025, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime (2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new DashboardTickerTemplate { Id = 3, TickerType = "vehicle_status", Name = "Vehicle Status", ConfigurationJson = "{\n  \"version\": 1,\n  \"defaultEnabled\": true,\n  \"category\": \"fleet\",\n  \"description\": \"Active vs maintenance vehicle counts\",\n  \"defaults\": { \"refreshSeconds\": 90 }\n}", RequiredRole = null, RequiredPermissions = "vehicle.read", IsEnabled = true, CreatedAt = new DateTime (2025, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime (2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new DashboardTickerTemplate { Id = 4, TickerType = "admin_alerts", Name = "Admin Alerts", ConfigurationJson = "{\n  \"version\": 1,\n  \"defaultEnabled\": true,\n  \"category\": \"admin\",\n  \"description\": \"Recent critical system / security alerts\",\n  \"defaults\": { \"refreshSeconds\": 30 }\n}", RequiredRole = "Admin", RequiredPermissions = "alerts.read,system.read", IsEnabled = true, CreatedAt = new DateTime (2025, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime (2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new DashboardTickerTemplate { Id = 5, TickerType = "system_health", Name = "System Health", ConfigurationJson = "{\n  \"version\": 1,\n  \"defaultEnabled\": true,\n  \"category\": \"admin\",\n  \"description\": \"Core processing/service status summary\",\n  \"defaults\": { \"refreshSeconds\": 60 }\n}", RequiredRole = "Admin", RequiredPermissions = "health.read,system.read", IsEnabled = true, CreatedAt = new DateTime (2025, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime (2025, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
            );
        }
    }
}