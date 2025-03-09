using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the UserActivity entity
    /// </summary>
    public class UserActivityConfiguration : EntityTypeConfiguration<UserActivity>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<UserActivity> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder
                    .ToTable("user_activity")
                    .HasCharSet("utf8mb4")
                    .UseCollation("utf8mb4_general_ci");

                builder.HasIndex(e => e.UserId, "UserId");

                builder.Property(e => e.Id).HasColumnType("int(11)");
                builder.Property(e => e.Action).HasMaxLength(255);
                builder.Property(e => e.ActionName).HasMaxLength(255);
                builder.Property(e => e.Controller).HasMaxLength(255);
                builder.Property(e => e.Parameters).HasColumnType("text");
                builder.Property(e => e.UserId).HasMaxLength(100);

                // Relationships
                builder.HasOne(d => d.User).WithMany(p => p.UserActivities)
                    .HasForeignKey(d => d.UserId)
                    .HasConstraintName("FK_UserActivity_User");
            }


            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring UserActivityConfiguration: {ex.Message}", ex);
            }
        }
    }
}
