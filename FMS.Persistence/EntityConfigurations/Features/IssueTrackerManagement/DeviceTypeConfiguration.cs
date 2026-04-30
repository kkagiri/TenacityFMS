using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    public class DeviceTypeConfiguration : EntityTypeConfiguration<Devicetype>
    {
        public override void Configure(EntityTypeBuilder<Devicetype> builder)
        {
            try
            {
                builder.HasKey(e => e.Id);

                builder.ToTable("devicetype");

                builder.Property(e => e.Id)
                    .ValueGeneratedNever();

                builder.Property(e => e.Name)
                    .HasMaxLength(100)
                    .IsRequired();

                builder.Property(e => e.Description)
                    .HasMaxLength(945);

                builder.Property(e => e.IsMonitored)
                    .HasDefaultValue(false);

                builder.Property(e => e.MonitoringEndpoint)
                    .HasMaxLength(255);

                builder.Property(e => e.CreatedAt)
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                builder.Property(e => e.UpdatedAt)
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                builder.HasIndex(e => e.Name).IsUnique();

                builder.HasMany(e => e.Issuetemplates)
                    .WithOne(t => t.DeviceType)
                    .HasForeignKey(t => t.DeviceTypeId)
                    .OnDelete(DeleteBehavior.Restrict)
                    .HasConstraintName("FK_issuetemplate_devicetype");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring DeviceTypeConfiguration: {ex.Message}");
                throw new Exception($"Error configuring DeviceTypeConfiguration: {ex.Message}", ex);
            }
        }
    }
}

