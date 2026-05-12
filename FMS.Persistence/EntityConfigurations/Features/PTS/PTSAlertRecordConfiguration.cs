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
                    .ValueGeneratedOnAdd();

                //Cursor: Required properties
                builder.Property(ar => ar.PtsId)
                    .HasMaxLength(50)
                    .IsRequired();

                builder.Property(ar => ar.DeviceType)
                    .HasMaxLength(20)
                    .IsRequired();

                builder.Property(ar => ar.DeviceNumber);

                builder.Property(ar => ar.AlertCode);

                builder.Property(ar => ar.State)
                    .HasMaxLength(20)
                    .IsRequired();

                builder.Property(ar => ar.DateTime);

                builder.Property(ar => ar.ConfigurationId)
                    .HasMaxLength(50);

                builder.Property(ar => ar.AlarmId);

                builder.Property(ar => ar.ProcessedAt)
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
