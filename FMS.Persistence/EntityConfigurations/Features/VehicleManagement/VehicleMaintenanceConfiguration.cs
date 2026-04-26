using FMS.Domain.Entities.Features.VehicleManagement;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations;

/// <summary>
/// Entity Framework configuration for VehicleMaintenance entity
/// </summary>
public class VehicleMaintenanceConfiguration : EntityTypeConfiguration<VehicleMaintenance>
{
    public override void Configure(EntityTypeBuilder<VehicleMaintenance> builder)
    {
        try
        {
            // Primary key
            builder.HasKey(e => e.MaintenanceId).HasName("PRIMARY");

            // Table name
            builder.ToTable("vehicle_maintenance");

            // Indexes
            builder.HasIndex(e => e.VehicleId, "idx_maintenance_vehicle");
            builder.HasIndex(e => e.Status, "idx_maintenance_status");
            builder.HasIndex(e => e.ScheduledDate, "idx_maintenance_scheduled_date");
            builder.HasIndex(e => e.MaintenanceType, "idx_maintenance_type");
            builder.HasIndex(e => e.IsOverdue, "idx_maintenance_overdue");
            builder.HasIndex(e => e.MaintenanceScheduleId, "idx_maintenance_schedule");

            // Column configurations
            builder.Property(e => e.MaintenanceId);

            builder.Property(e => e.VehicleId);

            builder.Property(e => e.MaintenanceType)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(e => e.Status)
                .IsRequired()
                .HasMaxLength(50)
                .HasDefaultValue("Scheduled");

            builder.Property(e => e.ScheduledDate);

            builder.Property(e => e.CompletedDate);

            builder.Property(e => e.OdometerAtSchedule)
                .HasColumnType("decimal(10,2)");

            builder.Property(e => e.OdometerAtCompletion)
                .HasColumnType("decimal(10,2)");

            builder.Property(e => e.NextDueOdometer)
                .HasColumnType("decimal(10,2)");

            builder.Property(e => e.NextDueDate);

            builder.Property(e => e.Cost)
                .HasColumnType("decimal(10,2)");

            builder.Property(e => e.ServiceProvider)
                .HasMaxLength(200);

            builder.Property(e => e.Description)
                .HasMaxLength(1000);

            builder.Property(e => e.Notes)
                .HasMaxLength(2000);

            builder.Property(e => e.Priority)
                .HasDefaultValue(2);

            builder.Property(e => e.IsOverdue)
                .HasDefaultValue(false);

            builder.Property(e => e.CreatedBy)
                .HasMaxLength(255);

            builder.Property(e => e.ModifiedBy)
                .HasMaxLength(255);

            builder.Property(e => e.ResponsiblePerson)
                .HasMaxLength(255);

            builder.Property(e => e.DateCreated)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(e => e.DateModified);

            builder.Property(e => e.MaintenanceScheduleId);

            // Relationships
            builder.HasOne(d => d.Vehicle)
                .WithMany()
                .HasForeignKey(d => d.VehicleId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("fk_maintenance_vehicle");

            builder.HasOne(d => d.MaintenanceSchedule)
                .WithMany(p => p.MaintenanceRecords)
                .HasForeignKey(d => d.MaintenanceScheduleId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("fk_maintenance_schedule");

            // Note: CreatedBy and ModifiedBy are stored as strings (usernames/Ids),
            // not as navigation properties. This avoids shadow property issues with EF Core.

            builder.HasMany(d => d.Issues)
                .WithOne(p => p.Maintenance)
                .HasForeignKey(p => p.MaintenanceId)
                .OnDelete(DeleteBehavior.Cascade);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error configuring VehicleMaintenance: {ex.Message}");
        }
    }
}

