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
            builder.Property(e => e.MaintenanceId)
                .HasColumnType("int(11)")
                .HasColumnName("MaintenanceID");

            builder.Property(e => e.VehicleId)
                .HasColumnType("int(11)")
                .HasColumnName("VehicleID");

            builder.Property(e => e.MaintenanceType)
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnName("MaintenanceType");

            builder.Property(e => e.Status)
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("Status")
                .HasDefaultValue("Scheduled");

            builder.Property(e => e.ScheduledDate)
                .HasColumnType("datetime")
                .HasColumnName("ScheduledDate");

            builder.Property(e => e.CompletedDate)
                .HasColumnType("datetime")
                .HasColumnName("CompletedDate");

            builder.Property(e => e.OdometerAtSchedule)
                .HasColumnType("decimal(10,2)")
                .HasColumnName("OdometerAtSchedule");

            builder.Property(e => e.OdometerAtCompletion)
                .HasColumnType("decimal(10,2)")
                .HasColumnName("OdometerAtCompletion");

            builder.Property(e => e.NextDueOdometer)
                .HasColumnType("decimal(10,2)")
                .HasColumnName("NextDueOdometer");

            builder.Property(e => e.NextDueDate)
                .HasColumnType("datetime")
                .HasColumnName("NextDueDate");

            builder.Property(e => e.Cost)
                .HasColumnType("decimal(10,2)")
                .HasColumnName("Cost");

            builder.Property(e => e.ServiceProvider)
                .HasMaxLength(200)
                .HasColumnName("ServiceProvider");

            builder.Property(e => e.Description)
                .HasMaxLength(1000)
                .HasColumnName("Description");

            builder.Property(e => e.Notes)
                .HasMaxLength(2000)
                .HasColumnName("Notes");

            builder.Property(e => e.Priority)
                .HasColumnType("int(11)")
                .HasColumnName("Priority")
                .HasDefaultValue(2);

            builder.Property(e => e.IsOverdue)
                .HasColumnType("tinyint(1)")
                .HasColumnName("IsOverdue")
                .HasDefaultValue(false);

            builder.Property(e => e.CreatedBy)
                .HasMaxLength(255)
                .HasColumnName("CreatedBy");

            builder.Property(e => e.ModifiedBy)
                .HasMaxLength(255)
                .HasColumnName("ModifiedBy");

            builder.Property(e => e.ResponsiblePerson)
                .HasMaxLength(255)
                .HasColumnName("ResponsiblePerson");

            builder.Property(e => e.DateCreated)
                .HasColumnType("datetime")
                .HasColumnName("DateCreated")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(e => e.DateModified)
                .HasColumnType("datetime")
                .HasColumnName("DateModified");

            builder.Property(e => e.MaintenanceScheduleId)
                .HasColumnType("int(11)")
                .HasColumnName("MaintenanceScheduleID");

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

            builder.HasOne(d => d.CreatedByNavigation)
                .WithMany()
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_maintenance_created_by");

            builder.HasOne(d => d.ModifiedByNavigation)
                .WithMany()
                .HasForeignKey(d => d.ModifiedBy)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_maintenance_modified_by");

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
