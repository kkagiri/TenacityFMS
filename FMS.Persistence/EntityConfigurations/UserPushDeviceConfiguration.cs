using FMS.Domain.Entities.Features.Notifications;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    public class UserPushDeviceConfiguration : IEntityTypeConfiguration<UserPushDevice>
    {
        public void Configure(EntityTypeBuilder<UserPushDevice> builder)
        {
            builder.ToTable("user_push_devices");

            builder.HasKey(e => e.Id);

            builder.Property(e => e.UserId)
                .HasMaxLength(450)
                .IsRequired();

            builder.Property(e => e.DeviceToken)
                .HasMaxLength(500)
                .IsRequired();

            builder.Property(e => e.Platform)
                .HasMaxLength(20)
                .IsRequired();

            builder.Property(e => e.DeviceId)
                .HasMaxLength(100);

            builder.Property(e => e.DeviceName)
                .HasMaxLength(100);

            builder.Property(e => e.AppVersion)
                .HasMaxLength(50);

            builder.Property(e => e.LastError)
                .HasMaxLength(500);

            builder.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            // Index for quick lookup by user
            builder.HasIndex(e => e.UserId)
                .HasDatabaseName("IX_UserPushDevices_UserId");

            // Index for token lookup (for updates)
            builder.HasIndex(e => e.DeviceToken)
                .HasDatabaseName("IX_UserPushDevices_DeviceToken");

            // Composite index for user + active devices
            builder.HasIndex(e => new { e.UserId, e.IsActive })
                .HasDatabaseName("IX_UserPushDevices_UserId_IsActive");

            // Relationship
            builder.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
