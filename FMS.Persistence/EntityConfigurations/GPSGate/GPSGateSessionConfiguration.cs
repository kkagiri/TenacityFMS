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
                .HasColumnName("id")
                .ValueGeneratedOnAdd();

            builder.Property(s => s.SessionId)
                .HasColumnName("session_id")
                .HasMaxLength(500)
                .IsRequired();

            builder.Property(s => s.Username)
                .HasColumnName("username")
                .HasMaxLength(100)
                .IsRequired();

            builder.Property(s => s.ApplicationId)
                .HasColumnName("application_id")
                .IsRequired();

            builder.Property(s => s.CreatedAt)
                .HasColumnName("created_at")
                .HasColumnType("datetime")
                .IsRequired();

            builder.Property(s => s.ExpiresAt)
                .HasColumnName("expires_at")
                .HasColumnType("datetime");

            builder.Property(s => s.IsActive)
                .HasColumnName("is_active")
                .IsRequired();

            builder.Property(s => s.LastUsed)
                .HasColumnName("last_used")
                .HasColumnType("datetime");

            builder.Property(s => s.IpAddress)
                .HasColumnName("ip_address")
                .HasMaxLength(50);

            builder.HasIndex(s => s.SessionId)
                .IsUnique();

            builder.HasIndex(s => s.Username);
        }
    }
}
