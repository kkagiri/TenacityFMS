using FMS.Domain.Entities.GPSGate;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations.GPSGate
{
    public class GPSGateSessionConfiguration : IEntityTypeConfiguration<GPSGateSession>
    {
        public void Configure(EntityTypeBuilder<GPSGateSession> builder)
        {
            builder.ToTable("gpsgate_sessions");

            builder.HasKey(s => s.Id);

            builder.Property(s => s.Id)
                .ValueGeneratedOnAdd();

            builder.Property(s => s.SessionId)
                .HasMaxLength(500)
                .IsRequired();

            builder.Property(s => s.Username)
                .HasMaxLength(100)
                .IsRequired();

            builder.Property(s => s.ApplicationId)
                .IsRequired();

            builder.Property(s => s.CreatedAt)
                .IsRequired();

            builder.Property(s => s.ExpiresAt);

            builder.Property(s => s.IsActive)
                .IsRequired();

            builder.Property(s => s.LastUsed);

            builder.Property(s => s.IpAddress)
                .HasMaxLength(50);

            builder.HasIndex(s => s.SessionId)
                .IsUnique();

            builder.HasIndex(s => s.Username);
        }
    }
}

