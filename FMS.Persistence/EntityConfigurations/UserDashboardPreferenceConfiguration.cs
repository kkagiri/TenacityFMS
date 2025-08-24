using FMS.Domain.Entities.Dashboard;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations {
    public class UserDashboardPreferenceConfiguration : EntityTypeConfiguration<UserDashboardPreference> {
        public override void Configure (EntityTypeBuilder<UserDashboardPreference> builder) {
            builder.ToTable ("user_dashboard_preference")
                .HasCharSet ("utf8mb4").UseCollation ("utf8mb4_general_ci");

            builder.HasKey (x => x.Id).HasName ("PRIMARY");
            builder.HasIndex (x => x.UserId).HasDatabaseName ("IX_UserDashboardPreference_User");
            builder.HasIndex (x => new { x.UserId, x.IsActive }).HasDatabaseName ("IX_UserDashboardPreference_UserActive");

            builder.Property (x => x.Id).HasColumnType ("char(36)");
            builder.Property (x => x.UserId).HasMaxLength (100).IsRequired ();
            builder.Property (x => x.PreferencesJson).HasColumnType ("longtext").IsRequired ();
            builder.Property (x => x.Version).HasMaxLength (20).HasDefaultValue ("1.0");
            builder.Property (x => x.IsActive).HasDefaultValue (true);
            builder.Property (x => x.CreatedAt).HasDefaultValueSql ("CURRENT_TIMESTAMP");
            builder.Property (x => x.UpdatedAt).HasDefaultValueSql ("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
            builder.Property (x => x.CreatedBy).HasMaxLength (100).IsRequired ();
            builder.Property (x => x.UpdatedBy).HasMaxLength (100);

            builder.HasOne (x => x.User)
                .WithMany ()
                .HasForeignKey (x => x.UserId)
                .OnDelete (DeleteBehavior.Cascade)
                .HasConstraintName ("FK_UserDashboardPreference_User");
        }
    }
}