using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    public class LoginactivityConfiguration : EntityTypeConfiguration<Loginactivity>
    {
        public override void Configure(EntityTypeBuilder<Loginactivity> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("loginactivities");

                builder.HasIndex(e => e.UserId, "FK_LoginActivities_Users");

                builder.Property(e => e.Id);
                builder.Property(e => e.IpAddress).HasMaxLength(100);
                builder.Property(e => e.UserId).HasMaxLength(100);

                builder.HasOne(d => d.User)
                    .WithMany(p => p.Loginactivities)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_LoginActivities_Users");
            }

            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring LoginactivityConfiguration: {ex.Message}", ex);
            }
        }
    }
}

