using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations {
    /// <summary>
    /// Configuration for the User entity
    /// </summary>
    public class UserConfiguration : EntityTypeConfiguration<User> {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure (EntityTypeBuilder<User> builder) {
            try {
                builder.HasKey (e => e.Id).HasName ("PRIMARY");

                builder.ToTable ("user");

                builder.HasIndex (e => e.UserName, "UserName_UNIQUE").IsUnique ();

                builder.Property (e => e.Id)
                    .HasMaxLength (100)
                    .UseCollation ("utf8mb4_general_ci")
                    .HasCharSet ("utf8mb4");

                builder.Property (e => e.AccessFailedCount).HasColumnType ("int(11)");

                builder.Property (e => e.MasterRFIDTag);

                builder.HasOne (e => e.MasterTags)
                    .WithMany ()
                    .HasForeignKey (e => e.MasterRFIDTag)
                    .HasConstraintName ("FK_TagID_TAGID");

                builder.Property (e => e.ConcurrencyStamp)
                    .HasMaxLength (256)
                    .UseCollation ("utf8mb4_general_ci")
                    .HasCharSet ("utf8mb4");

                builder.Property (e => e.Email)
                    .HasMaxLength (256)
                    .UseCollation ("utf8mb4_general_ci")
                    .HasCharSet ("utf8mb4");

                builder.Property (e => e.IsDeleted)
                    .HasDefaultValueSql ("'0'").IsRequired (false);

                builder.Property (e => e.NormalizedEmail)
                    .HasMaxLength (256)
                    .UseCollation ("utf8mb4_general_ci")
                    .HasCharSet ("utf8mb4");

                builder.Property (e => e.NormalizedUserName)
                    .HasMaxLength (256)
                    .UseCollation ("utf8mb4_general_ci")
                    .HasCharSet ("utf8mb4");

                builder.Property (e => e.PasswordHash)
                    .HasMaxLength (256)
                    .UseCollation ("utf8mb4_general_ci")
                    .HasCharSet ("utf8mb4");

                builder.Property (e => e.PhoneNumber)
                    .HasMaxLength (256)
                    .UseCollation ("utf8mb4_general_ci")
                    .HasCharSet ("utf8mb4");

                builder.Property (e => e.SecurityStamp)
                    .HasMaxLength (256)
                    .UseCollation ("utf8mb4_general_ci")
                    .HasCharSet ("utf8mb4");

                builder.Property (e => e.UserName)
                    .HasMaxLength (100)
                    .UseCollation ("utf8mb4_general_ci")
                    .HasCharSet ("utf8mb4");

                // Apply global query filter
                builder.HasQueryFilter (u => !u.IsDeleted == true);
            } catch (Exception ex) {
                Console.WriteLine ($"Error configuring  : {ex.Message}");

                throw new Exception ($"Error configuring UserConfiguration: {ex.Message}", ex);
            }
        }
    }
}