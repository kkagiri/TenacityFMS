using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the PTSAlertRecord entity
    /// </summary>
    public class PTSAlertRecordConfiguration : IEntityTypeConfiguration<PTSAlertRecord>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public void Configure(EntityTypeBuilder<PTSAlertRecord> builder)
        {
            try
            {
                //Cursor: Table configuration
                builder.ToTable("PTSAlertRecord");

                //Cursor: Primary key
                builder.HasKey(ar => ar.Id);
                builder.Property(ar => ar.Id)
                    .HasColumnName("id")
                    .ValueGeneratedOnAdd();

                //Cursor: Required properties
                builder.Property(ar => ar.PtsId)
                    .HasColumnName("pts_id")
                    .HasMaxLength(50)
                    .IsRequired();

                builder.Property(ar => ar.DeviceType)
                    .HasColumnName("device_type")
                    .HasMaxLength(20)
                    .IsRequired();

                builder.Property(ar => ar.DeviceNumber)
                    .HasColumnName("device_number");

                builder.Property(ar => ar.AlertCode)
                    .HasColumnName("alert_code");

                builder.Property(ar => ar.State)
                    .HasColumnName("state")
                    .HasMaxLength(20)
                    .IsRequired();

                builder.Property(ar => ar.DateTime)
                    .HasColumnName("date_time")
                    .HasColumnType("datetime");

                builder.Property(ar => ar.ConfigurationId)
                    .HasColumnName("configuration_id")
                    .HasMaxLength(50);

                builder.Property(ar => ar.AlarmId)
                    .HasColumnName("alarm_id");

                builder.Property(ar => ar.ProcessedAt)
                    .HasColumnName("processed_at")
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                //Cursor: Indexes for performance
                builder.HasIndex(ar => ar.PtsId)
                    .HasDatabaseName("IX_AlertRecord_PtsId");

                builder.HasIndex(ar => ar.DeviceType)
                    .HasDatabaseName("IX_AlertRecord_DeviceType");

                builder.HasIndex(ar => ar.AlertCode)
                    .HasDatabaseName("IX_AlertRecord_AlertCode");

                builder.HasIndex(ar => ar.State)
                    .HasDatabaseName("IX_AlertRecord_State");

                builder.HasIndex(ar => ar.DateTime)
                    .HasDatabaseName("IX_AlertRecord_DateTime");

                builder.HasIndex(ar => ar.ProcessedAt)
                    .HasDatabaseName("IX_AlertRecord_ProcessedAt");

                builder.HasIndex(ar => new { ar.PtsId, ar.DeviceType, ar.AlertCode })
                    .HasDatabaseName("IX_AlertRecord_Composite");

            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring AlertRecord: {ex.Message}");
                throw new Exception($"Error configuring AlertRecordConfiguration: {ex.Message}", ex);
            }
        }
    }
}