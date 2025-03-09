using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities.Auth;

namespace FMS.Persistence.EntityConfigurations
{
       public class UserRoleConfiguration : EntityTypeConfiguration<UserRole>
       {
              public override void Configure(EntityTypeBuilder<UserRole> builder)
              {
                     try
                     {
                            // Define the composite key
                            builder.HasKey(ur => new { ur.UserId, ur.RoleId });
                            builder.HasIndex(ur => new { ur.UserId, ur.RoleId }).IsUnique();

                            builder.ToTable("userroles")
                                   .HasCharSet("utf8mb4")
                                   .UseCollation("utf8mb4_general_ci");

                            // Optionally set property lengths if required by your model
                            builder.Property(ur => ur.UserId)
                                   .HasMaxLength(100);
                            builder.Property(ur => ur.RoleId)
                                   .HasMaxLength(100);

                            // Define the relationships
                            builder.HasOne(ur => ur.User)
                                   .WithMany(u => u.UserRoles)
                                   .HasForeignKey(ur => ur.UserId)
                                   .HasConstraintName("FK_UserRoles_Users");

                            builder.HasOne(ur => ur.Role)
                                   .WithMany(r => r.UserRoles)
                                   .HasForeignKey(ur => ur.RoleId)
                                   .HasConstraintName("FK_UserRoles_Roles");
                     }


                     catch (Exception ex)
                     {
                            throw new Exception($"Error configuring UserRoleConfiguration: {ex.Message}", ex);
                     }
              }
       }
}
