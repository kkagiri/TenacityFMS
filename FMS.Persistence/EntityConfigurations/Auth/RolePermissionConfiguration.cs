using FMS.Domain.Entities.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations {
    public class RolePermissionConfiguration : EntityTypeConfiguration<RolePermission> {
        public override void Configure (EntityTypeBuilder<RolePermission> builder) {
            try {
                builder.HasKey (rp => new { rp.RoleId, rp.PermissionId });
                builder.HasIndex (rp => new { rp.RoleId, rp.PermissionId }).IsUnique ();

                builder.ToTable ("rolepermissions")
                    .HasCharSet ("utf8mb4")
                    .UseCollation ("utf8mb4_general_ci");

                builder.HasOne (rp => rp.Role)
                    .WithMany (r => r.RolePermissions)
                    .HasForeignKey (rp => rp.RoleId)
                    .HasConstraintName ("FK_RolePermissions_Roles");

                builder.HasOne (rp => rp.Permission)
                    .WithMany (p => p.RolePermissions)
                    .HasForeignKey (rp => rp.PermissionId)
                    .HasConstraintName ("FK_RolePermissions_Permissions");
            } catch (Exception ex) {
                Console.WriteLine ($"Error configuring  : {ex.Message}");

                throw new Exception ($"Error configuring RolePermissionConfiguration: {ex.Message}", ex);
            }
        }
    }
}