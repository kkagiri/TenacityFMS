using FMS.Domain.Entities.Features.VehicleManagement;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations;

/// <summary>
/// Entity Framework configuration for MaintenanceSchedule entity
/// </summary>
public class MaintenanceScheduleConfiguration : EntityTypeConfiguration<MaintenanceSchedule>
{
    public override void Configure(EntityTypeBuilder<MaintenanceSchedule> builder)
    {
        try
        {
            // Primary key
            builder.HasKey(e => e.ScheduleId).HasName("PRIMARY");

            // Table name
            builder.ToTable("maintenance_schedule");

            // Indexes
            builder.HasIndex(e => e.MaintenanceType, "idx_schedule_maintenance_type");
            builder.HasIndex(e => e.VehicleTypeId, "idx_schedule_vehicle_type");
            builder.HasIndex(e => e.VehicleId, "idx_schedule_vehicle");
            builder.HasIndex(e => e.IsActive, "idx_schedule_is_active");

            // Column configurations
            builder.Property(e => e.ScheduleId)
                .HasColumnType("int(11)")
                .HasColumnName("ScheduleID");

            builder.Property(e => e.MaintenanceType)
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnName("MaintenanceType");

            builder.Property(e => e.Description)
                .HasMaxLength(500)
                .HasColumnName("Description");

            builder.Property(e => e.IntervalKilometers)
                .HasColumnType("decimal(10,2)")
                .HasColumnName("IntervalKilometers");

            builder.Property(e => e.IntervalDays)
                .HasColumnType("int(11)")
                .HasColumnName("IntervalDays");

            builder.Property(e => e.WarningThresholdKm)
                .HasColumnType("decimal(10,2)")
                .HasColumnName("WarningThresholdKm");

            builder.Property(e => e.WarningThresholdDays)
                .HasColumnType("int(11)")
                .HasColumnName("WarningThresholdDays");

            builder.Property(e => e.EstimatedCost)
                .HasColumnType("decimal(10,2)")
                .HasColumnName("EstimatedCost");

            builder.Property(e => e.VehicleTypeId)
                .HasColumnType("int(11)")
                .HasColumnName("VehicleTypeID");

            builder.Property(e => e.IsActive)
                .HasColumnType("tinyint(1)")
                .HasColumnName("IsActive")
                .HasDefaultValue(true);

            builder.Property(e => e.ApplyToAllVehicles)
                .HasColumnType("tinyint(1)")
                .HasColumnName("ApplyToAllVehicles")
                .HasDefaultValue(true);

            builder.Property(e => e.VehicleId)
                .HasColumnType("int(11)")
                .HasColumnName("VehicleID");

            builder.Property(e => e.DefaultPriority)
                .HasColumnType("int(11)")
                .HasColumnName("DefaultPriority")
                .HasDefaultValue(2);

            builder.Property(e => e.CreatedBy)
                .HasMaxLength(255)
                .HasColumnName("CreatedBy");

            builder.Property(e => e.ModifiedBy)
                .HasMaxLength(255)
                .HasColumnName("ModifiedBy");

            builder.Property(e => e.DateCreated)
                .HasColumnType("datetime")
                .HasColumnName("DateCreated")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(e => e.DateModified)
                .HasColumnType("datetime")
                .HasColumnName("DateModified");

            // Relationships
            builder.HasOne(d => d.Vehicle)
                .WithMany()
                .HasForeignKey(d => d.VehicleId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("fk_schedule_vehicle");

            builder.HasOne(d => d.VehicleType)
                .WithMany()
                .HasForeignKey(d => d.VehicleTypeId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("fk_schedule_vehicle_type");

            builder.HasOne(d => d.CreatedByNavigation)
                .WithMany()
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_schedule_created_by");

            builder.HasOne(d => d.ModifiedByNavigation)
                .WithMany()
                .HasForeignKey(d => d.ModifiedBy)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_schedule_modified_by");

            builder.HasMany(d => d.MaintenanceRecords)
                .WithOne(p => p.MaintenanceSchedule)
                .HasForeignKey(p => p.MaintenanceScheduleId)
                .OnDelete(DeleteBehavior.SetNull);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error configuring MaintenanceSchedule: {ex.Message}");
        }
    }
}
